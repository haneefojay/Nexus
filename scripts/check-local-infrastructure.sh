#!/usr/bin/env bash
set -euo pipefail

compose=(docker compose)

"${compose[@]}" ps

"${compose[@]}" exec -T postgres psql \
  -U "${POSTGRES_USER:-nexus}" \
  -d "${POSTGRES_DB:-nexus}" \
  -v ON_ERROR_STOP=1 \
  -c "CREATE EXTENSION IF NOT EXISTS postgis;" \
  -c "SELECT PostGIS_Version();" \
  -c "SELECT uuidv7();"

"${compose[@]}" exec -T redis redis-cli ping | grep -qx PONG

curl --fail --silent http://localhost:9000/minio/health/live >/dev/null
curl --fail --silent http://localhost:8025/api/v1/info >/dev/null

echo "Local infrastructure is healthy."