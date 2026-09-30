#!/usr/bin/env bash
set -eEuo pipefail

export NODE_ENV=test
export WEB_URL=http://localhost:3000
export API_URL=http://localhost:3001
export DATABASE_URL=${DATABASE_URL:-postgresql://nexus:nexus_local_only@localhost:5432/nexus}
export REDIS_URL=${REDIS_URL:-redis://localhost:6379}
export S3_ENDPOINT=${S3_ENDPOINT:-http://localhost:9000}
export S3_REGION=${S3_REGION:-us-east-1}
export S3_BUCKET=${S3_BUCKET:-nexus-local}
export S3_ACCESS_KEY=${S3_ACCESS_KEY:-nexus}
export S3_SECRET_KEY=${S3_SECRET_KEY:-nexus_local_only}
export S3_FORCE_PATH_STYLE=true
export BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET:-phase-three-ci-secret-with-at-least-32-characters}
export BETTER_AUTH_URL=http://localhost:3001
export EMAIL_FROM='NEXUS <no-reply@nexus.local>'
export SMTP_HOST=localhost
export SMTP_PORT=1025

api_log=$(mktemp)
owner_cookie=$(mktemp)
tech_cookie=$(mktemp)
evidence_file=$(mktemp)
api_pid=""
cleanup() {
  [[ -z "$api_pid" ]] || kill "$api_pid" 2>/dev/null || true
  [[ -z "$api_pid" ]] || wait "$api_pid" 2>/dev/null || true
  rm -f "$api_log" "$owner_cookie" "$tech_cookie" "$evidence_file"
}
trap cleanup EXIT
trap 'printf "line=%s\napi=%s\n" "$LINENO" "$(tail -n 30 "$api_log" | tr "\n" " " | tail -c 3000)" >/tmp/phase-three-lifecycle-failure.txt; echo "Phase 3 lifecycle failed at line $LINENO"; tail -n 80 "$api_log"' ERR

pnpm --filter @nexus/api exec tsx src/main.ts >"$api_log" 2>&1 &
api_pid=$!
for _ in $(seq 1 50); do
  curl --fail --silent http://localhost:3001/health >/dev/null && break
  kill -0 "$api_pid" 2>/dev/null || { cat "$api_log"; exit 1; }
  sleep 0.5
done

compose=(docker compose)
psql=("${compose[@]}" exec -T postgres psql -U "${POSTGRES_USER:-nexus}" -d "${POSTGRES_DB:-nexus}" -At -v ON_ERROR_STOP=1)
signup() {
  local name=$1 email=$2 cookie=$3
  curl --fail --silent -H 'content-type: application/json' \
    --data "{\"name\":\"$name\",\"email\":\"$email\",\"password\":\"a-long-and-valid-password\"}" \
    http://localhost:3001/v1/auth/sign-up/email >/dev/null
  "${psql[@]}" -c "UPDATE users SET email_verified = true, email_verified_at = now() WHERE email = '$email';" >/dev/null
  curl --fail --silent --cookie-jar "$cookie" -H 'content-type: application/json' \
    --data "{\"email\":\"$email\",\"password\":\"a-long-and-valid-password\"}" \
    http://localhost:3001/v1/auth/sign-in/email
}

owner=$(signup "Phase Three Owner" "phase3-api-owner@nexus.local" "$owner_cookie")
owner_id=$(jq -er '.user.id' <<<"$owner")
tech=$(signup "Phase Three Technician" "phase3-api-tech@nexus.local" "$tech_cookie")
tech_id=$(jq -er '.user.id' <<<"$tech")
organization=$(curl --fail --silent --cookie "$owner_cookie" -H 'content-type: application/json' \
  --data '{"name":"Phase Three API","slug":"phase-three-api","timezone":"Africa/Lagos"}' \
  http://localhost:3001/v1/organizations)
organization_id=$(jq -er '.data.id' <<<"$organization")
"${psql[@]}" -c "INSERT INTO memberships (user_id, organization_id, role, status) VALUES ('$tech_id','$organization_id','TECHNICIAN','ACTIVE');" >/dev/null
site=$(curl --fail --silent --cookie "$owner_cookie" -H "x-organization-id: $organization_id" \
  -H 'content-type: application/json' --data '{"name":"Phase Three Site","type":"SOLAR","status":"ACTIVE"}' \
  http://localhost:3001/v1/sites)
site_id=$(jq -er '.data.id' <<<"$site")

ids=$("${psql[@]}" -F '|' -c "
WITH t AS (
  INSERT INTO inspection_templates (organization_id,name,status,draft_schema,latest_version,created_by)
  VALUES ('$organization_id','Phase Three Runtime','PUBLISHED','{\"sections\":[]}',1,'$owner_id') RETURNING id
), v AS (
  INSERT INTO inspection_template_versions (organization_id,template_id,version_number,schema,checksum,created_by)
  SELECT '$organization_id',id,1,'{\"sections\":[]}','phase-three-runtime','$owner_id' FROM t RETURNING id
), p AS (
  INSERT INTO inspection_plans (organization_id,template_version_id,name,target_type,site_id,recurrence_type,starts_at,assigned_user_id,next_due_at,created_by)
  SELECT '$organization_id',id,'Phase Three Runtime','SITE','$site_id','DAILY',now(),'$tech_id',now(),'$owner_id' FROM v RETURNING id,template_version_id
), r AS (
  INSERT INTO inspection_runs (organization_id,inspection_plan_id,template_version_id,site_id,assigned_to,sequence,status,scheduled_for,due_at)
  SELECT '$organization_id',id,template_version_id,'$site_id','$tech_id',0,'IN_PROGRESS',now(),now()+interval '1 day' FROM p RETURNING id
)
SELECT id FROM r;")
run_id=$ids

finding=$(curl --fail --silent --cookie "$tech_cookie" -H "x-organization-id: $organization_id" \
  -H 'content-type: application/json' \
  --data '{"itemId":"condition","title":"Critical isolator failure","notes":"Failed observation","severity":"CRITICAL"}' \
  "http://localhost:3001/v1/inspection-runs/$run_id/findings")
finding_id=$(jq -er '.data.id' <<<"$finding")
due_at=$(date -u -d 'tomorrow' '+%Y-%m-%dT%H:%M:%SZ')
action=$(curl --fail --silent --cookie "$owner_cookie" -H "x-organization-id: $organization_id" \
  -H 'content-type: application/json' \
  --data "{\"title\":\"Replace isolator\",\"description\":\"Replace and attach proof\",\"assignedTo\":\"$tech_id\",\"priority\":\"CRITICAL\",\"dueAt\":\"$due_at\"}" \
  "http://localhost:3001/v1/findings/$finding_id/actions")
action_id=$(jq -er '.data.id' <<<"$action")
curl --fail --silent --cookie "$tech_cookie" -H "x-organization-id: $organization_id" \
  -X POST "http://localhost:3001/v1/actions/$action_id/start" >/dev/null

printf '\xff\xd8\xff\xdb' >"$evidence_file"
checksum=$(sha256sum "$evidence_file" | cut -d' ' -f1)
checksum_b64=$(printf '%s' "$checksum" | xxd -r -p | base64 -w0)
authorization=$(curl --fail --silent --cookie "$tech_cookie" -H "x-organization-id: $organization_id" \
  -H 'content-type: application/json' \
  --data "{\"targetType\":\"CORRECTIVE_ACTION\",\"targetId\":\"$action_id\",\"originalName\":\"proof.jpg\",\"contentType\":\"image/jpeg\",\"contentLength\":4,\"checksum\":\"$checksum\"}" \
  http://localhost:3001/v1/uploads/authorize)
grant_id=$(jq -er '.data.uploadGrantId' <<<"$authorization")
upload_url=$(jq -er '.data.uploadUrl' <<<"$authorization")
curl --fail --silent -X PUT -H 'content-type: image/jpeg' \
  -H "x-amz-checksum-sha256: $checksum_b64" --data-binary "@$evidence_file" "$upload_url" >/dev/null
curl --fail --silent --cookie "$tech_cookie" -H "x-organization-id: $organization_id" \
  -H 'content-type: application/json' --data "{\"uploadGrantId\":\"$grant_id\"}" \
  http://localhost:3001/v1/evidence | jq -e '.data.id' >/dev/null
curl --fail --silent --cookie "$tech_cookie" -H "x-organization-id: $organization_id" \
  -H 'content-type: application/json' --data '{"completionNotes":"Isolator replaced and tested"}' \
  "http://localhost:3001/v1/actions/$action_id/complete" | jq -e '.data.status == "VERIFICATION_REQUIRED"' >/dev/null
curl --fail --silent --cookie "$owner_cookie" -H "x-organization-id: $organization_id" \
  -X POST "http://localhost:3001/v1/actions/$action_id/verify" | jq -e '.data.status == "VERIFIED"' >/dev/null
curl --fail --silent --cookie "$owner_cookie" -H "x-organization-id: $organization_id" \
  -X POST "http://localhost:3001/v1/findings/$finding_id/close" | jq -e '.data.status == "CLOSED"' >/dev/null

history_count=$("${psql[@]}" -c "SELECT count(*) FROM finding_transitions WHERE finding_id='$finding_id';")
[[ "$history_count" -ge 4 ]] || { echo "Finding history is incomplete"; exit 1; }
evidence_count=$("${psql[@]}" -c "SELECT count(*) FROM evidence WHERE organization_id='$organization_id' AND target_id='$action_id';")
[[ "$evidence_count" == "1" ]] || { echo "Evidence provenance was not persisted"; exit 1; }

other=$(curl --fail --silent --cookie "$owner_cookie" -H 'content-type: application/json' \
  --data '{"name":"Phase Three Other","slug":"phase-three-api-other","timezone":"UTC"}' \
  http://localhost:3001/v1/organizations)
other_id=$(jq -er '.data.id' <<<"$other")
cross_status=$(curl --silent --output /dev/null --write-out '%{http_code}' --cookie "$owner_cookie" \
  -H "x-organization-id: $other_id" "http://localhost:3001/v1/findings/$finding_id")
[[ "$cross_status" == "404" ]] || { echo "Cross-tenant finding access was not hidden"; exit 1; }

echo "Phase 3 inspection-to-verification evidence lifecycle is healthy."
