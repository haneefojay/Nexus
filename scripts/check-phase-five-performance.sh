#!/usr/bin/env bash
set -euo pipefail
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
