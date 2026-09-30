#!/usr/bin/env bash
set -euo pipefail

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

echo "Phase 1 authentication smoke checks are healthy."
