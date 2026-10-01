#!/usr/bin/env bash
set -euo pipefail
backup=$(bash scripts/backup.sh)
bash scripts/restore-rehearsal.sh "$backup"
rm -rf "$backup"
