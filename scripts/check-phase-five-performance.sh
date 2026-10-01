#!/usr/bin/env bash
set -euo pipefail
export NODE_ENV=test WEB_URL=http://localhost:3000 API_URL=http://localhost:3001
export DATABASE_URL=${DATABASE_URL:-postgresql://nexus:nexus_local_only@localhost:5432/nexus}
export REDIS_URL=${REDIS_URL:-redis://localhost:6379} S3_ENDPOINT=${S3_ENDPOINT:-http://localhost:9000}
export S3_REGION=${S3_REGION:-us-east-1} S3_BUCKET=${S3_BUCKET:-nexus-local} S3_ACCESS_KEY=${S3_ACCESS_KEY:-nexus} S3_SECRET_KEY=${S3_SECRET_KEY:-nexus_local_only}
export BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET:-phase-five-performance-secret-32-chars} BETTER_AUTH_URL=http://localhost:3001
export EMAIL_FROM=no-reply@nexus.local SMTP_HOST=localhost SMTP_PORT=1025
api_pid=""
if ! curl --fail --silent --max-time 2 http://localhost:3001/health >/dev/null; then
  pnpm --filter @nexus/api exec tsx src/main.ts >/tmp/phase-five-performance-api.log 2>&1 & api_pid=$!
  for _ in $(seq 1 40); do curl --fail --silent http://localhost:3001/health >/dev/null && break; sleep .25; done
fi
cleanup_api() { [[ -z "$api_pid" ]] || kill "$api_pid" 2>/dev/null || true; rm -f /tmp/phase-five-perf-cookie /tmp/phase-five-perf-times; }
trap cleanup_api EXIT
curl --fail --silent --cookie-jar /tmp/phase-five-perf-cookie -H 'content-type: application/json' --data '{"email":"demo.owner@nexus.invalid","password":"fictional-local-password"}' http://localhost:3001/v1/auth/sign-in/email >/dev/null
: >/tmp/phase-five-perf-times
for i in $(seq 1 20); do
  curl --fail --silent --output /dev/null --cookie /tmp/phase-five-perf-cookie -H 'x-organization-id: 0199abcd-0000-7000-8000-000000000002' -H 'content-type: application/json' --data "{\"name\":\"Fictional performance site $i\",\"reference\":\"PERF-API-$i\",\"type\":\"OTHER\",\"status\":\"ACTIVE\"}" --write-out '%{time_total}\n' http://localhost:3001/v1/sites >>/tmp/phase-five-perf-times
done
python3 - <<'PY2'
from pathlib import Path
values=sorted(float(x) for x in Path('/tmp/phase-five-perf-times').read_text().split())
p95=values[max(0, int(len(values)*.95)-1)]
print(f'api-create-site p95={p95*1000:.1f}ms samples={len(values)} limit=400ms')
if p95 >= .4: raise SystemExit('normal API CRUD p95 exceeded 400ms')
PY2

psql=(docker compose exec -T postgres psql -U "${POSTGRES_USER:-nexus}" -d "${POSTGRES_DB:-nexus}" -v ON_ERROR_STOP=1)
"${psql[@]}" <<'SQL'
BEGIN;
SET LOCAL statement_timeout='700ms';
DO $$ DECLARE u uuid:=uuidv7(); o uuid:=uuidv7(); t uuid:=uuidv7(); s uuid; BEGIN
 INSERT INTO users(id,email,name,email_verified) VALUES(u,'phase5-perf@nexus.local','Phase 5 Performance',true);
 INSERT INTO organizations(id,name,slug,timezone) VALUES(o,'Phase 5 Performance','phase-5-performance','UTC');
 INSERT INTO asset_types(id,organization_id,name,category) VALUES(t,o,'Synthetic asset','TEST');
 FOR i IN 1..250 LOOP
  s:=uuidv7(); INSERT INTO sites(id,organization_id,name,reference,type,status,location,created_by) VALUES(s,o,'Synthetic site '||i,'PERF-'||i,'OTHER','ACTIVE',ST_SetSRID(ST_MakePoint((i%50)/10.0,(i%25)/10.0),4326),u);
  INSERT INTO assets(organization_id,site_id,asset_type_id,identifier,name,status,location)
   SELECT o,s,t,'PERF-'||i||'-'||g,'Synthetic asset '||g,'ACTIVE',ST_SetSRID(ST_MakePoint((i%50)/10.0+g/100000.0,(i%25)/10.0+g/100000.0),4326) FROM generate_series(1,40) g;
 END LOOP;
 PERFORM count(*) FROM assets WHERE organization_id=o AND location && ST_MakeEnvelope(-180,-90,180,90,4326);
 PERFORM count(*) FROM assets WHERE organization_id=o AND (name ILIKE '%asset 20%' OR identifier ILIKE '%asset 20%' OR serial_number ILIKE '%asset 20%');
END $$;
ROLLBACK;
SQL
pnpm --filter @nexus/worker benchmark:phase5
