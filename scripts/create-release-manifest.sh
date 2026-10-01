#!/usr/bin/env bash
set -euo pipefail
artifact_dir=${RELEASE_ARTIFACT_DIR:-release-artifacts}; digests="$artifact_dir/container-digests.txt"
[[ -f "$digests" ]] || { echo "Missing $digests" >&2; exit 1; }
first_migration=$(find packages/database/migrations -maxdepth 1 -name '*.sql' -printf '%f\n' | sort | head -1)
latest_migration=$(find packages/database/migrations -maxdepth 1 -name '*.sql' -printf '%f\n' | sort | tail -1)
images=$(awk -F= '/_(image_id|archive_sha256)=/{printf "%s=%s\\n",$1,$2}' "$digests" | jq -Rn '[inputs | select(length>0) | split("=") | {(.[0]): .[1]}] | add')
jq -n --arg releaseVersion "$(jq -r .version package.json)" --arg commit "${GITHUB_SHA:-$(git rev-parse HEAD)}" \
  --arg firstMigration "$first_migration" --arg latestMigration "$latest_migration" --arg node "$(node --version)" \
  --arg pnpm "$(pnpm --version)" --arg nextPublicApiUrl "${NEXT_PUBLIC_API_URL:-http://localhost:3001}" --argjson images "$images" \
  '{releaseVersion:$releaseVersion,commit:$commit,migrations:{first:$firstMigration,latest:$latestMigration},toolchain:{node:$node,pnpm:$pnpm},build:{nextPublicApiUrl:$nextPublicApiUrl},images:$images}' > "$artifact_dir/release-manifest.json"
cat "$artifact_dir/release-manifest.json"
