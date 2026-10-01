#!/usr/bin/env bash
set -euo pipefail
baseline=${MIGRATION_BASELINE_REF:-6eb4bf5718fbfafb80e09f3e90b6b7bbcc8ae0f6}
mapfile -t baseline_files < <(git ls-tree -r --name-only "$baseline" packages/database/migrations | grep -E '/[0-9]{4}_.+\.sql$' | sort)
[[ ${#baseline_files[@]} -gt 0 ]] || { echo "No baseline migrations found at $baseline" >&2; exit 1; }
for file in "${baseline_files[@]}"; do
  [[ -f "$file" ]] || { echo "Committed migration removed: $file" >&2; exit 1; }
  baseline_hash=$(git show "$baseline:$file" | sha256sum | cut -d' ' -f1)
  current_hash=$(sha256sum "$file" | cut -d' ' -f1)
  [[ "$baseline_hash" == "$current_hash" ]] || { echo "Committed migration changed: $file" >&2; exit 1; }
done
echo "Migration history is append-only relative to $baseline (${#baseline_files[@]} files verified)."
