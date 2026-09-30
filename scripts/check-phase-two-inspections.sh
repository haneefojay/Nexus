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
export BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET:-phase-two-ci-secret-with-at-least-32-characters}
export BETTER_AUTH_URL=http://localhost:3001
export EMAIL_FROM='NEXUS <no-reply@nexus.local>'
export SMTP_HOST=localhost
export SMTP_PORT=1025

api_log=$(mktemp)
worker_log=$(mktemp)
cookie_jar=$(mktemp)
viewer_cookie=$(mktemp)
api_pid=""
worker_pid=""
checkpoint() {
  printf 'checkpoint=%s\n' "$1" >/tmp/phase-two-inspections-failure.txt
}
on_error() {
  local exit_code=$?
  {
    echo "line=$1"
    echo "command=$2"
    echo "api=$(tail -n 20 "$api_log" 2>/dev/null | tr '\n' ' ' | tail -c 2000)"
    echo "worker=$(tail -n 20 "$worker_log" 2>/dev/null | tr '\n' ' ' | tail -c 2000)"
  } >/tmp/phase-two-inspections-failure.txt
  {
    echo "### Phase 2 inspection smoke failure"
    echo
    echo "- Line: \`$1\`"
    echo "- Command: \`$2\`"
    echo
    echo "#### API log"
    echo '```text'
    tail -n 80 "$api_log" 2>/dev/null || true
    echo '```'
    echo
    echo "#### Worker log"
    echo '```text'
    tail -n 80 "$worker_log" 2>/dev/null || true
    echo '```'
  } >>"${GITHUB_STEP_SUMMARY:-/dev/stderr}"
  echo "::error title=Phase 2 inspection smoke failure::Command failed at line $1: $2"
  exit "$exit_code"
}
trap 'on_error "$LINENO" "$BASH_COMMAND"' ERR
cleanup() {
  [[ -z "$worker_pid" ]] || kill "$worker_pid" 2>/dev/null || true
  [[ -z "$api_pid" ]] || kill "$api_pid" 2>/dev/null || true
  [[ -z "$worker_pid" ]] || wait "$worker_pid" 2>/dev/null || true
  [[ -z "$api_pid" ]] || wait "$api_pid" 2>/dev/null || true
  rm -f "$api_log" "$worker_log" "$cookie_jar" "$viewer_cookie"
}
trap cleanup EXIT

pnpm --filter @nexus/api exec tsx src/main.ts >"$api_log" 2>&1 &
api_pid=$!
for _ in $(seq 1 40); do
  curl --fail --silent http://localhost:3001/health >/dev/null && break
  kill -0 "$api_pid" 2>/dev/null || { cat "$api_log"; exit 1; }
  sleep 0.5
done
curl --fail --silent http://localhost:3001/health >/dev/null

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

checkpoint "operator signup"
operator=$(signup "Phase Two Operator" "phase-two-operator@nexus.local" "$cookie_jar")
operator_id=$(jq -er '.user.id' <<<"$operator")
checkpoint "organization creation"
organization=$(curl --fail --silent --cookie "$cookie_jar" -H 'content-type: application/json' \
  --data '{"name":"Phase Two Infrastructure","slug":"phase-two-infrastructure","timezone":"Africa/Lagos"}' \
  http://localhost:3001/v1/organizations)
organization_id=$(jq -er '.data.id' <<<"$organization")
checkpoint "site creation"
site=$(curl --fail --silent --cookie "$cookie_jar" -H "x-organization-id: $organization_id" \
  -H 'content-type: application/json' \
  --data '{"name":"Phase Two Site","type":"SOLAR","status":"ACTIVE"}' \
  http://localhost:3001/v1/sites)
site_id=$(jq -er '.data.id' <<<"$site")

checkpoint "template creation"
template=$(curl --fail --silent --cookie "$cookie_jar" -H "x-organization-id: $organization_id" \
  -H 'content-type: application/json' \
  --data '{"name":"Phase Two Daily","description":"CI inspection","schema":{"sections":[{"id":"main","title":"Main checks","items":[{"id":"condition","label":"Condition acceptable","responseType":"PASS_FAIL","required":true,"evidenceRequired":false},{"id":"voltage","label":"Voltage","responseType":"NUMERIC","required":true,"minimum":200,"maximum":260,"evidenceRequired":false}]}]}}' \
  http://localhost:3001/v1/inspection-templates)
template_id=$(jq -er '.data.id' <<<"$template")
checkpoint "template publication"
version=$(curl --fail --silent --cookie "$cookie_jar" -H "x-organization-id: $organization_id" \
  -X POST "http://localhost:3001/v1/inspection-templates/$template_id/versions")
version_id=$(jq -er '.data.id' <<<"$version")

starts_at=$(date -u -d '1 minute ago' '+%Y-%m-%dT%H:%M:%SZ')
checkpoint "plan creation"
plan=$(curl --fail --silent --cookie "$cookie_jar" -H "x-organization-id: $organization_id" \
  -H 'content-type: application/json' \
  --data "{\"templateVersionId\":\"$version_id\",\"name\":\"Daily CI plan\",\"targetType\":\"SITE\",\"siteId\":\"$site_id\",\"recurrence\":{\"type\":\"DAILY\"},\"startsAt\":\"$starts_at\",\"assignedUserId\":\"$operator_id\",\"dueWindowMinutes\":60,\"requiresReview\":false}" \
  http://localhost:3001/v1/inspection-plans)
plan_id=$(jq -er '.data.id' <<<"$plan")

checkpoint "bounded worker generation"
pnpm --filter @nexus/worker exec tsx src/main.ts >"$worker_log" 2>&1 &
worker_pid=$!
run_id=""
for _ in $(seq 1 40); do
  run_id=$("${psql[@]}" -c "SELECT id FROM inspection_runs WHERE inspection_plan_id = '$plan_id' ORDER BY sequence LIMIT 1;")
  [[ -n "$run_id" ]] && break
  kill -0 "$worker_pid" 2>/dev/null || { cat "$worker_log"; exit 1; }
  sleep 0.5
done
[[ -n "$run_id" ]] || {
  {
    echo "checkpoint=bounded worker generation"
    echo "worker=$(tail -n 30 "$worker_log" | tr '\n' ' ' | tail -c 3000)"
  } >/tmp/phase-two-inspections-failure.txt
  cat "$worker_log"
  exit 1
}
run_count=$("${psql[@]}" -c "SELECT count(*) FROM inspection_runs WHERE inspection_plan_id = '$plan_id';")
[[ "$run_count" -ge 1 && "$run_count" -le 36 ]] || {
  printf 'checkpoint=bounded worker generation\nrun_count=%s\n' "$run_count" >/tmp/phase-two-inspections-failure.txt
  echo "Expected bounded generation, got $run_count runs"
  exit 1
}

checkpoint "run start"
curl --fail --silent --cookie "$cookie_jar" -H "x-organization-id: $organization_id" \
  -X POST "http://localhost:3001/v1/inspection-runs/$run_id/start" >/dev/null
missing_status=$(curl --silent --output /dev/null --write-out '%{http_code}' --cookie "$cookie_jar" \
  -H "x-organization-id: $organization_id" -X POST \
  "http://localhost:3001/v1/inspection-runs/$run_id/submit")
[[ "$missing_status" == "400" ]] || { echo "Required responses did not block submission"; exit 1; }
checkpoint "response persistence"
curl --fail --silent --cookie "$cookie_jar" -H "x-organization-id: $organization_id" \
  -H 'content-type: application/json' -X PUT \
  --data '{"responses":[{"itemId":"condition","value":true},{"itemId":"voltage","value":240}],"notes":"All checks complete"}' \
  "http://localhost:3001/v1/inspection-runs/$run_id/responses" >/dev/null
curl --fail --silent --cookie "$cookie_jar" -H "x-organization-id: $organization_id" \
  -H 'content-type: application/json' \
  --data '{"itemId":"condition","title":"Minor label wear","severity":"LOW"}' \
  "http://localhost:3001/v1/inspection-runs/$run_id/findings" | jq -e '.data.id' >/dev/null
checkpoint "run submission"
submitted=$(curl --fail --silent --cookie "$cookie_jar" -H "x-organization-id: $organization_id" \
  -X POST "http://localhost:3001/v1/inspection-runs/$run_id/submit")
jq -e '.data.status == "CLOSED"' <<<"$submitted" >/dev/null
checkpoint "submitted response immutability"
immutable_status=$(curl --silent --output /dev/null --write-out '%{http_code}' --cookie "$cookie_jar" \
  -H "x-organization-id: $organization_id" -H 'content-type: application/json' -X PUT \
  --data '{"responses":[{"itemId":"condition","value":false}]}' \
  "http://localhost:3001/v1/inspection-runs/$run_id/responses")
[[ "$immutable_status" == "409" ]] || { echo "Submitted response mutation was not rejected"; exit 1; }

historical_version=$("${psql[@]}" -c "SELECT template_version_id FROM inspection_runs WHERE id = '$run_id';")
[[ "$historical_version" == "$version_id" ]] || { echo "Historical run lost its template version"; exit 1; }
checkpoint "dashboard calculations"
dashboard=$(curl --fail --silent --cookie "$cookie_jar" -H "x-organization-id: $organization_id" \
  http://localhost:3001/v1/inspection-dashboard)
jq -e '.data.summary.completed_recently >= 1' <<<"$dashboard" >/dev/null

checkpoint "cross-tenant isolation"
other_org=$(curl --fail --silent --cookie "$cookie_jar" -H 'content-type: application/json' \
  --data '{"name":"Phase Two Other","slug":"phase-two-other","timezone":"UTC"}' \
  http://localhost:3001/v1/organizations)
other_org_id=$(jq -er '.data.id' <<<"$other_org")
cross_tenant_status=$(curl --silent --output /dev/null --write-out '%{http_code}' --cookie "$cookie_jar" \
  -H "x-organization-id: $other_org_id" "http://localhost:3001/v1/inspection-runs/$run_id")
[[ "$cross_tenant_status" == "404" ]] || { echo "Cross-tenant run access was not hidden"; exit 1; }

checkpoint "viewer authorization"
viewer=$(signup "Phase Two Viewer" "phase-two-viewer@nexus.local" "$viewer_cookie")
viewer_id=$(jq -er '.user.id' <<<"$viewer")
"${psql[@]}" -c "INSERT INTO memberships (user_id, organization_id, role, status) VALUES ('$viewer_id', '$organization_id', 'VIEWER', 'ACTIVE');" >/dev/null
viewer_manage_status=$(curl --silent --output /dev/null --write-out '%{http_code}' --cookie "$viewer_cookie" \
  -H "x-organization-id: $organization_id" -H 'content-type: application/json' \
  --data '{"name":"Unauthorized","schema":{"sections":[]}}' \
  http://localhost:3001/v1/inspection-templates)
[[ "$viewer_manage_status" == "403" ]] || { echo "Viewer template management was not rejected"; exit 1; }

checkpoint "audit events"
audit_count=$("${psql[@]}" -c "SELECT count(*) FROM activity_events WHERE organization_id = '$organization_id' AND resource_type IN ('inspection_template','inspection_plan','inspection_run','inspection_finding');")
[[ "$audit_count" -ge 6 ]] || { echo "Expected Phase 2 immutable audit events"; exit 1; }

echo "Phase 2 template, plan, worker, execution, immutability, dashboard, tenancy, and role checks are healthy."
