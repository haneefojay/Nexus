#!/usr/bin/env bash
set -euo pipefail
out=${1:-/tmp/nexus-backup-$(date -u +%Y%m%dT%H%M%SZ)}
mkdir -p "$out"
user=${POSTGRES_USER:-nexus}; db=${POSTGRES_DB:-nexus}
docker compose exec -T postgres pg_dump -U "$user" -d "$db" --format=custom --no-owner >"$out/postgres.dump"
docker compose exec -T minio sh -c 'find /data -type f -printf "%P\n" | sort' >"$out/object-manifest.txt"
docker compose exec -T minio tar -czf - -C /data . >"$out/object-storage.tar.gz"
sha256sum "$out/postgres.dump" "$out/object-manifest.txt" "$out/object-storage.tar.gz" >"$out/SHA256SUMS"
printf '{"createdAt":"%s","database":"%s","objectManifest":"object-manifest.txt"}\n' "$(date -u +%FT%TZ)" "$db" >"$out/metadata.json"
echo "$out"
