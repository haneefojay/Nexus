#!/usr/bin/env bash
set -eEuo pipefail
trap 'echo "::error title=Backup failed::line=$LINENO command=$BASH_COMMAND" >&2' ERR
out=${1:-/tmp/nexus-backup-$(date -u +%Y%m%dT%H%M%SZ)}
mkdir -p "$out"
user=${POSTGRES_USER:-nexus}; db=${POSTGRES_DB:-nexus}
docker compose exec -T postgres pg_dump -U "$user" -d "$db" --format=custom --no-owner >"$out/postgres.dump"
mkdir -p "$out/object-storage"
docker compose cp minio:/data/. "$out/object-storage/" >/dev/null
find "$out/object-storage" -type f -printf '%P\n' | sort >"$out/object-manifest.txt"
tar -czf "$out/object-storage.tar.gz" -C "$out/object-storage" .
rm -rf "$out/object-storage"
sha256sum "$out/postgres.dump" "$out/object-manifest.txt" "$out/object-storage.tar.gz" >"$out/SHA256SUMS"
printf '{"createdAt":"%s","database":"%s","objectManifest":"object-manifest.txt"}\n' "$(date -u +%FT%TZ)" "$db" >"$out/metadata.json"
echo "$out"
