#!/usr/bin/env bash
set -eEuo pipefail
trap 'echo "::error title=Restore rehearsal failed::line=$LINENO command=$BASH_COMMAND" >&2' ERR
backup=${1:?backup directory required}
[[ -f "$backup/postgres.dump" && -f "$backup/object-storage.tar.gz" && -f "$backup/SHA256SUMS" ]] || { echo 'Incomplete backup set.' >&2; exit 1; }
(cd "$backup" && sha256sum -c SHA256SUMS)
tar -tzf "$backup/object-storage.tar.gz" >/dev/null
user=${POSTGRES_USER:-nexus}; restore_db=nexus_restore_rehearsal
docker compose exec -T postgres dropdb -U "$user" --if-exists "$restore_db"
docker compose exec -T postgres createdb -U "$user" "$restore_db"
trap 'docker compose exec -T postgres dropdb -U "${POSTGRES_USER:-nexus}" --if-exists nexus_restore_rehearsal >/dev/null 2>&1 || true' EXIT
docker compose exec -T postgres pg_restore -U "$user" -d "$restore_db" --no-owner <"$backup/postgres.dump"
docker compose exec -T postgres psql -U "$user" -d "$restore_db" -v ON_ERROR_STOP=1 <<'SQL'
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM inspection_runs r LEFT JOIN organizations o ON o.id=r.organization_id WHERE o.id IS NULL) THEN RAISE EXCEPTION 'orphan inspection tenant'; END IF;
  IF EXISTS (SELECT 1 FROM report_requests r LEFT JOIN inspection_runs i ON i.id=r.inspection_run_id AND i.organization_id=r.organization_id WHERE i.id IS NULL) THEN RAISE EXCEPTION 'orphan report'; END IF;
  IF EXISTS (SELECT 1 FROM export_requests e LEFT JOIN organizations o ON o.id=e.organization_id WHERE o.id IS NULL) THEN RAISE EXCEPTION 'orphan export'; END IF;
  IF EXISTS (SELECT 1 FROM field_sync_commands c LEFT JOIN organizations o ON o.id=c.organization_id WHERE o.id IS NULL) THEN RAISE EXCEPTION 'orphan field sync command'; END IF;
END $$;
SELECT count(*) AS immutable_activity_events FROM activity_events;
SELECT count(*) AS report_export_records FROM report_requests UNION ALL SELECT count(*) FROM export_requests;
SQL
echo 'Disposable PostgreSQL restore and object archive integrity checks passed.'
