#!/usr/bin/env bash
set -euo pipefail
compose=(docker compose)
psql=("${compose[@]}" exec -T postgres psql -U "${POSTGRES_USER:-nexus}" -d "${POSTGRES_DB:-nexus}" -v ON_ERROR_STOP=1)
"${psql[@]}" <<'SQL'
BEGIN;
DO $$
DECLARE
  actor_id uuid := uuidv7(); org_a uuid := uuidv7(); org_b uuid := uuidv7();
  site_id uuid := uuidv7(); template_id uuid := uuidv7(); version_id uuid := uuidv7();
  plan_id uuid := uuidv7(); run_id uuid := uuidv7(); report_id uuid := uuidv7();
BEGIN
  INSERT INTO users (id,email,name,email_verified) VALUES (actor_id,'phase5@nexus.local','Phase Five',true);
  INSERT INTO organizations (id,name,slug,timezone) VALUES
    (org_a,'Phase Five A','phase-five-a','UTC'), (org_b,'Phase Five B','phase-five-b','UTC');
  INSERT INTO sites (id,organization_id,name,type,status,created_by) VALUES (site_id,org_a,'Report Site','OTHER','ACTIVE',actor_id);
  INSERT INTO inspection_templates (id,organization_id,name,status,draft_schema,latest_version,created_by)
    VALUES (template_id,org_a,'Report Template','PUBLISHED','{"sections":[]}',1,actor_id);
  INSERT INTO inspection_template_versions (id,organization_id,template_id,version_number,schema,checksum,created_by)
    VALUES (version_id,org_a,template_id,1,'{"sections":[]}',repeat('a',64),actor_id);
  INSERT INTO inspection_plans (id,organization_id,template_version_id,name,target_type,site_id,recurrence_type,starts_at,assigned_user_id,next_due_at,created_by)
    VALUES (plan_id,org_a,version_id,'Report Plan','SITE',site_id,'MONTHLY',now(),actor_id,now(),actor_id);
  INSERT INTO inspection_runs (id,organization_id,inspection_plan_id,template_version_id,site_id,assigned_to,sequence,status,scheduled_for,due_at,submitted_at)
    VALUES (run_id,org_a,plan_id,version_id,site_id,actor_id,0,'SUBMITTED',now(),now(),now());
  INSERT INTO report_requests (id,organization_id,inspection_run_id,requested_by,snapshot,snapshot_hash)
    VALUES (report_id,org_a,run_id,actor_id,'{}',repeat('b',64));
  BEGIN
    INSERT INTO report_requests (organization_id,inspection_run_id,requested_by,snapshot,snapshot_hash)
      VALUES (org_a,run_id,actor_id,'{}',repeat('b',64));
    RAISE EXCEPTION 'report snapshot deduplication did not fail';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO report_requests (organization_id,inspection_run_id,requested_by,snapshot,snapshot_hash)
      VALUES (org_b,run_id,actor_id,'{}',repeat('c',64));
    RAISE EXCEPTION 'cross-tenant report reference did not fail';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
  BEGIN
    UPDATE report_requests SET status='COMPLETED' WHERE id=report_id;
    RAISE EXCEPTION 'completed artifact invariant did not fail';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END $$;
DO $$
DECLARE
  actor_id uuid := uuidv7(); org_id uuid := uuidv7(); export_id uuid := uuidv7();
BEGIN
  INSERT INTO users (id,email,name,email_verified) VALUES (actor_id,'phase5-export@nexus.local','Phase Five Export',true);
  INSERT INTO organizations (id,name,slug,timezone) VALUES (org_id,'Phase Five Export','phase-five-export','UTC');
  INSERT INTO export_requests (id,organization_id,export_type,requested_by,snapshot,snapshot_hash,row_count)
    VALUES (export_id,org_id,'ASSETS',actor_id,'{"columns":[],"rows":[]}',repeat('d',64),0);
  BEGIN
    INSERT INTO export_requests (organization_id,export_type,requested_by,snapshot,snapshot_hash,row_count)
      VALUES (org_id,'ASSETS',actor_id,'{"columns":[],"rows":[]}',repeat('d',64),0);
    RAISE EXCEPTION 'export snapshot deduplication did not fail';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    UPDATE export_requests SET status='COMPLETED' WHERE id=export_id;
    RAISE EXCEPTION 'completed export artifact invariant did not fail';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END $$;
ROLLBACK;
SQL
echo "Phase 5 report/export deduplication, artifact, and tenant constraints are healthy."
