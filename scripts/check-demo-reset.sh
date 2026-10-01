#!/usr/bin/env bash
set -euo pipefail
user=${POSTGRES_USER:-nexus}; password=${POSTGRES_PASSWORD:-nexus_local_only}; main_db=${POSTGRES_DB:-nexus}; reset_db=nexus_demo_reset
seed() { DATABASE_URL="postgresql://$user:$password@localhost:5432/$1" pnpm --filter @nexus/api seed:demo >/dev/null; }
fingerprint() {
  docker compose exec -T postgres psql -U "$user" -d "$1" -At -v ON_ERROR_STOP=1 <<'SQL' | sha256sum | cut -d' ' -f1
SELECT jsonb_build_object(
  'organization',(SELECT jsonb_build_array(id,name,slug,timezone) FROM organizations WHERE id='0199abcd-0000-7000-8000-000000000002'),
  'site',(SELECT jsonb_build_array(id,name,reference,status) FROM sites WHERE id='0199abcd-0000-7000-8000-000000000003'),
  'asset',(SELECT jsonb_build_array(id,identifier,name,status,condition) FROM assets WHERE id='0199abcd-0000-7000-8000-000000000005'),
  'template',(SELECT jsonb_build_array(id,version_number,checksum) FROM inspection_template_versions WHERE id='0199abcd-0000-7000-8000-000000000007'),
  'run',(SELECT jsonb_build_array(id,status,sequence) FROM inspection_runs WHERE id='0199abcd-0000-7000-8000-000000000009'),
  'finding',(SELECT jsonb_build_array(id,title,severity,status) FROM inspection_findings WHERE id='0199abcd-0000-7000-8000-000000000011'),
  'action',(SELECT jsonb_build_array(id,title,priority,status) FROM corrective_actions WHERE id='0199abcd-0000-7000-8000-000000000012'),
  'evidence',(SELECT jsonb_build_array(e.id,e.checksum,s.size,s.checksum,s.status) FROM evidence e JOIN storage_objects s ON s.id=e.storage_object_id WHERE e.id='0199abcd-0000-7000-8000-000000000015')
)::text;
SQL
}
seed "$main_db"; first=$(fingerprint "$main_db")
seed "$main_db"; second=$(fingerprint "$main_db")
[[ "$first" == "$second" ]] || { echo 'Demo reseed changed the semantic fingerprint.' >&2; exit 1; }
docker compose exec -T postgres dropdb -U "$user" --if-exists "$reset_db" >/dev/null
docker compose exec -T postgres createdb -U "$user" "$reset_db"
trap 'docker compose exec -T postgres dropdb -U "${POSTGRES_USER:-nexus}" --if-exists nexus_demo_reset >/dev/null 2>&1 || true' EXIT
DATABASE_URL="postgresql://$user:$password@localhost:5432/$reset_db" pnpm --filter @nexus/database db:migrate >/dev/null
seed "$reset_db"; reset=$(fingerprint "$reset_db")
[[ "$first" == "$reset" ]] || { echo 'Demo reset did not reproduce the semantic fingerprint.' >&2; exit 1; }
echo "Demo seed, reseed, and disposable reset produced fingerprint $first."
