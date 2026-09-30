#!/usr/bin/env bash
set -euo pipefail
patterns='(-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]{10,})'
if git grep -nIE "$patterns" -- ':!pnpm-lock.yaml' ':!docs/source/**'; then
  echo 'Potential committed secret detected.' >&2
  exit 1
fi
echo 'No high-confidence committed secret patterns detected.'
