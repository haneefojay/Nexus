#!/usr/bin/env bash
set -euo pipefail
base_url=${1:-http://localhost:3001}
case "$base_url" in *localhost*|*127.0.0.1*|*.test*|*.staging*) ;; *) echo 'Refusing smoke test against an unapproved target.' >&2; exit 1;; esac
curl --fail --silent --show-error --max-time 5 "$base_url/health" >/dev/null
curl --fail --silent --show-error --max-time 10 "$base_url/ready" | grep -q '"status":"ready"'
echo 'Non-production liveness and readiness smoke checks passed.'
