#!/usr/bin/env bash
set -eEuo pipefail
trap 'echo "::error title=Phase 1 smoke failure::Command failed at line $LINENO: $BASH_COMMAND"' ERR

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
export BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET:-phase-one-ci-secret-with-at-least-32-characters}
export BETTER_AUTH_URL=http://localhost:3001
export EMAIL_FROM='NEXUS <no-reply@nexus.local>'
export SMTP_HOST=localhost
export SMTP_PORT=1025

log_file=$(mktemp)
pnpm --filter @nexus/api exec tsx src/main.ts >"$log_file" 2>&1 &
api_pid=$!
cleanup() {
  kill "$api_pid" 2>/dev/null || true
  wait "$api_pid" 2>/dev/null || true
  rm -f "$log_file"
}
trap cleanup EXIT

for _ in $(seq 1 40); do
  if curl --fail --silent http://localhost:3001/health >/dev/null; then break; fi
  if ! kill -0 "$api_pid" 2>/dev/null; then
    cat "$log_file"
    exit 1
  fi
  sleep 0.5
done
curl --fail --silent http://localhost:3001/health >/dev/null || { cat "$log_file"; exit 1; }

response_file=$(mktemp)
status=$(curl --silent --output "$response_file" --write-out '%{http_code}' \
  -H 'content-type: application/json' \
  --data '{"name":"Phase One Operator","email":"auth-phase-one@nexus.local","password":"a-long-and-valid-password"}' \
  http://localhost:3001/v1/auth/sign-up/email)
if [[ "$status" -lt 200 || "$status" -ge 300 ]]; then
  cat "$response_file"
  cat "$log_file"
  rm -f "$response_file"
  exit 1
fi
rm -f "$response_file"

compose=(docker compose)
psql=("${compose[@]}" exec -T postgres psql -U "${POSTGRES_USER:-nexus}" -d "${POSTGRES_DB:-nexus}" -At -v ON_ERROR_STOP=1)

password_hash=$("${psql[@]}" -c "SELECT a.password FROM accounts a JOIN users u ON u.id = a.user_id WHERE u.email = 'auth-phase-one@nexus.local' AND a.provider_id = 'credential';")
[[ "$password_hash" == \$argon2id\$* ]] || { echo "Expected an Argon2id credential hash"; exit 1; }

verified=$("${psql[@]}" -c "SELECT email_verified FROM users WHERE email = 'auth-phase-one@nexus.local';")
[[ "$verified" == "f" ]] || { echo "New account was unexpectedly verified"; exit 1; }

queued_email_count=$(docker compose exec -T redis redis-cli LLEN bull:nexus-email:wait | tr -d '\r')
[[ "$queued_email_count" -ge 1 ]] || { echo "Expected a queued verification email"; exit 1; }

sign_in_status=$(curl --silent --output /dev/null --write-out '%{http_code}' \
  -H 'content-type: application/json' \
  --data '{"email":"auth-phase-one@nexus.local","password":"a-long-and-valid-password"}' \
  http://localhost:3001/v1/auth/sign-in/email)
[[ "$sign_in_status" -ge 400 ]] || { echo "Unverified account unexpectedly signed in"; exit 1; }

"${psql[@]}" -c "UPDATE users SET email_verified = true, email_verified_at = now() WHERE email = 'auth-phase-one@nexus.local';" >/dev/null
cookie_jar=$(mktemp)
sign_in_response=$(curl --fail --silent --cookie-jar "$cookie_jar" -H 'content-type: application/json' --data '{"email":"auth-phase-one@nexus.local","password":"a-long-and-valid-password"}' http://localhost:3001/v1/auth/sign-in/email)
user_id=$(jq -er '.user.id' <<<"$sign_in_response")
organization_response=$(curl --silent --cookie "$cookie_jar" -H 'content-type: application/json' --data '{"name":"Phase One Infrastructure","slug":"phase-one-infrastructure","timezone":"Africa/Lagos"}' --write-out $'\n%{http_code}' http://localhost:3001/v1/organizations)
organization_status=$(tail -n 1 <<<"$organization_response")
organization=$(sed '$d' <<<"$organization_response")
if [[ "$organization_status" -lt 200 || "$organization_status" -ge 300 ]]; then
  echo "::error title=Organization smoke request failed::HTTP $organization_status"
  exit 1
fi
organization_id=$(jq -er '.data.id' <<<"$organization")
site=$(curl --fail --silent --cookie "$cookie_jar" -H "x-organization-id: $organization_id" -H 'content-type: application/json' --data '{"name":"Lagos West","reference":"LG-WEST","type":"SOLAR","status":"ACTIVE","latitude":6.5244,"longitude":3.3792}' http://localhost:3001/v1/sites)
site_id=$(jq -er '.data.id' <<<"$site")
asset_type=$(curl --fail --silent --cookie "$cookie_jar" -H "x-organization-id: $organization_id" -H 'content-type: application/json' --data '{"name":"Phase One Inverter","category":"POWER","metadataSchema":{}}' http://localhost:3001/v1/asset-types)
asset_type_id=$(jq -er '.data.id' <<<"$asset_type")
curl --fail --silent --cookie "$cookie_jar" -H "x-organization-id: $organization_id" -H 'content-type: application/json' --data "{\"siteId\":\"$site_id\",\"assetTypeId\":\"$asset_type_id\",\"identifier\":\"INV-CI-001\",\"name\":\"CI Inverter\",\"status\":\"ACTIVE\",\"condition\":\"GOOD\",\"latitude\":6.5244,\"longitude\":3.3792,\"metadata\":{}}" http://localhost:3001/v1/assets | jq -e '.data.id' >/dev/null
map_count=$(curl --fail --silent --cookie "$cookie_jar" -H "x-organization-id: $organization_id" 'http://localhost:3001/v1/map/assets?west=3&south=6&east=4&north=7&zoom=9' | jq '.data.features | length')
[[ "$map_count" -ge 1 ]] || { echo "Expected created asset in viewport"; exit 1; }
curl --fail --silent --cookie "$cookie_jar" -H "x-organization-id: $organization_id" -H 'content-type: application/json' --data '{"email":"invitee-phase-one@nexus.local","role":"TECHNICIAN"}' http://localhost:3001/v1/invitations | jq -e '.data.role == "TECHNICIAN"' >/dev/null
unknown_organization=$("${psql[@]}" -c 'SELECT uuidv7();')
cross_tenant_status=$(curl --silent --output /dev/null --write-out '%{http_code}' --cookie "$cookie_jar" -H "x-organization-id: $unknown_organization" http://localhost:3001/v1/sites)
[[ "$cross_tenant_status" == "403" ]] || { echo "Cross-tenant request was not rejected"; exit 1; }
preview=$(curl --fail --silent --cookie "$cookie_jar" -H "x-organization-id: $organization_id" -H 'content-type: application/json' --data '{"kind":"SITE","csv":"name,type,reference\nNorth Relay,TELECOM,NORTH-RELAY"}' http://localhost:3001/v1/imports/preview)
import_id=$(jq -er '.data.id' <<<"$preview")
jq -e '.data.status == "READY" and .data.validRows == 1' <<<"$preview" >/dev/null
curl --fail --silent --cookie "$cookie_jar" -H "x-organization-id: $organization_id" -X POST "http://localhost:3001/v1/imports/$import_id/confirm" >/dev/null
worker_log=$(mktemp)
pnpm --filter @nexus/worker exec tsx src/main.ts >"$worker_log" 2>&1 &
worker_pid=$!
for _ in $(seq 1 30); do
  import_status=$("${psql[@]}" -c "SELECT status FROM import_jobs WHERE id = '$import_id';")
  [[ "$import_status" == "COMPLETED" ]] && break
  sleep 0.5
done
if [[ "$import_status" != "COMPLETED" ]]; then cat "$worker_log"; exit 1; fi
kill "$worker_pid" 2>/dev/null || true
wait "$worker_pid" 2>/dev/null || true
audit_count=$("${psql[@]}" -c "SELECT count(*) FROM activity_events WHERE organization_id = '$organization_id' AND actor_user_id = '$user_id';")
[[ "$audit_count" -ge 4 ]] || { echo "Expected immutable activity events"; exit 1; }
rm -f "$cookie_jar" "$worker_log"
echo "Phase 1 authentication, tenant, site, asset, map, invitation, import, and audit smoke checks are healthy."
