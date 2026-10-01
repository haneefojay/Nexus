#!/usr/bin/env bash
set -Eeuo pipefail
baseline=${RELEASE_BASELINE_SHA:-6eb4bf5718fbfafb80e09f3e90b6b7bbcc8ae0f6}
worktree=$(mktemp -d)
pid=""
cleanup() {
  [[ -z "$pid" ]] || { kill -TERM -- "-$pid" 2>/dev/null || true; wait "$pid" 2>/dev/null || true; }
  git worktree remove --force "$worktree" >/dev/null 2>&1 || true
  rm -rf "$worktree"
}
trap cleanup EXIT
trap 'echo "::error title=Baseline compatibility failed::line=$LINENO command=$BASH_COMMAND" >&2; cat /tmp/nexus-baseline-api.log >&2 2>/dev/null || true' ERR
git worktree add --detach "$worktree" "$baseline" >/dev/null
(cd "$worktree" && pnpm install --offline --frozen-lockfile >/dev/null)
setsid env NODE_ENV=development WEB_URL=http://localhost:3000 API_URL=http://localhost:3001 \
  DATABASE_URL=postgresql://nexus:nexus_local_only@localhost:5432/nexus REDIS_URL=redis://localhost:6379 \
  S3_ENDPOINT=http://localhost:9000 S3_REGION=us-east-1 S3_BUCKET=nexus-local S3_ACCESS_KEY=nexus \
  S3_SECRET_KEY=nexus_local_only BETTER_AUTH_SECRET=replace-with-at-least-32-random-characters \
  BETTER_AUTH_URL=http://localhost:3001 EMAIL_FROM=no-reply@nexus.local SMTP_HOST=localhost SMTP_PORT=1025 \
  "$worktree/node_modules/.bin/tsx" "$worktree/apps/api/src/main.ts" >/tmp/nexus-baseline-api.log 2>&1 &
pid=$!
for _ in $(seq 1 60); do
  if curl --fail --silent http://localhost:3001/ready >/dev/null; then
    kill -TERM -- "-$pid" 2>/dev/null || true
    for _ in $(seq 1 20); do
      kill -0 "$pid" 2>/dev/null || break
      sleep .25
    done
    kill -KILL -- "-$pid" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true
    pid=""
    for _ in $(seq 1 20); do
      if ! curl --silent --max-time 1 http://localhost:3001/health >/dev/null; then break; fi
      sleep .25
    done
    ! curl --silent --max-time 1 http://localhost:3001/health >/dev/null
    echo "Baseline $baseline started against the RC schema; forward-fix restart may proceed."
    exit 0
  fi
  kill -0 "$pid" 2>/dev/null || break
  sleep 1
done
cat /tmp/nexus-baseline-api.log >&2
exit 1
