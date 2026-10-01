#!/usr/bin/env bash
set -euo pipefail
required=(DATABASE_URL REDIS_URL S3_ENDPOINT S3_REGION S3_BUCKET S3_ACCESS_KEY S3_SECRET_KEY BETTER_AUTH_SECRET BETTER_AUTH_URL WEB_URL)
missing=()
for name in "${required[@]}"; do [[ -n "${!name:-}" ]] || missing+=("$name"); done
if ((${#missing[@]})); then printf 'Missing required environment variables: %s\n' "${missing[*]}" >&2; exit 1; fi
if [[ "${NODE_ENV:-development}" == production && "${BETTER_AUTH_SECRET}" == replace-* ]]; then echo 'Production auth secret is a placeholder.' >&2; exit 1; fi
[[ "${ARTIFACT_RETENTION_DAYS:-30}" =~ ^[0-9]+$ ]] || { echo 'ARTIFACT_RETENTION_DAYS must be an integer.' >&2; exit 1; }
echo 'Environment configuration is structurally valid; values were not printed.'
