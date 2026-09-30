#!/usr/bin/env bash
set -euo pipefail

compose=(docker compose)
psql=("${compose[@]}" exec -T postgres psql -U "${POSTGRES_USER:-nexus}" -d "${POSTGRES_DB:-nexus}" -v ON_ERROR_STOP=1)

"${psql[@]}" <<'SQL'
BEGIN;

DO $$
DECLARE
  actor uuid := uuidv7();
  assignee uuid := uuidv7();
  org_a uuid := uuidv7();
  org_b uuid := uuidv7();
  site_a uuid := uuidv7();
  template_id uuid := uuidv7();
  version_id uuid := uuidv7();
  plan_id uuid := uuidv7();
  run_id uuid := uuidv7();
  finding_id uuid := uuidv7();
  action_id uuid := uuidv7();
  grant_id uuid := uuidv7();
  object_id uuid := uuidv7();
BEGIN
  INSERT INTO users (id, email, name, email_verified) VALUES
    (actor, 'phase3-owner@nexus.local', 'Phase Three Owner', true),
    (assignee, 'phase3-tech@nexus.local', 'Phase Three Tech', true);
  INSERT INTO organizations (id, name, slug, timezone) VALUES
    (org_a, 'Phase Three A', 'phase-three-db-a', 'Africa/Lagos'),
    (org_b, 'Phase Three B', 'phase-three-db-b', 'UTC');
  INSERT INTO memberships (user_id, organization_id, role, status) VALUES
    (actor, org_a, 'OWNER', 'ACTIVE'), (assignee, org_a, 'TECHNICIAN', 'ACTIVE');
  INSERT INTO sites (id, organization_id, name, type, status, created_by)
  VALUES (site_a, org_a, 'Phase Three Site', 'SOLAR', 'ACTIVE', actor);
  INSERT INTO inspection_templates
    (id, organization_id, name, status, draft_schema, latest_version, created_by)
  VALUES (template_id, org_a, 'Phase Three Checks', 'PUBLISHED', '{"sections":[]}', 1, actor);
  INSERT INTO inspection_template_versions
    (id, organization_id, template_id, version_number, schema, checksum, created_by)
  VALUES (version_id, org_a, template_id, 1, '{"sections":[]}', 'phase-three', actor);
  INSERT INTO inspection_plans
    (id, organization_id, template_version_id, name, target_type, site_id,
     recurrence_type, starts_at, assigned_user_id, next_due_at, created_by)
  VALUES (plan_id, org_a, version_id, 'Phase Three Plan', 'SITE', site_a,
    'DAILY', now(), assignee, now(), actor);
  INSERT INTO inspection_runs
    (id, organization_id, inspection_plan_id, template_version_id, site_id,
     assigned_to, sequence, status, scheduled_for, due_at)
  VALUES (run_id, org_a, plan_id, version_id, site_a, assignee, 0, 'CLOSED', now(), now());
  INSERT INTO inspection_findings
    (id, organization_id, inspection_run_id, site_id, title, severity, status, created_by)
  VALUES (finding_id, org_a, run_id, site_a, 'Failed isolator', 'CRITICAL',
    'ACTION_REQUIRED', assignee);
  INSERT INTO corrective_actions
    (id, organization_id, finding_id, title, description, assigned_to, priority, due_at, created_by)
  VALUES (action_id, org_a, finding_id, 'Replace isolator', 'Replace and prove',
    assignee, 'CRITICAL', now() + interval '1 day', actor);

  BEGIN
    INSERT INTO corrective_actions
      (organization_id, finding_id, title, description, assigned_to, priority, due_at, created_by)
    VALUES (org_a, finding_id, 'Duplicate', 'Must fail', assignee, 'HIGH', now(), actor);
    RAISE EXCEPTION 'one-action-per-finding constraint did not fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'one-action-per-finding constraint did not fail' THEN RAISE; END IF;
  END;

  BEGIN
    INSERT INTO corrective_actions
      (organization_id, finding_id, title, description, assigned_to, priority, due_at, created_by)
    VALUES (org_b, finding_id, 'Cross tenant', 'Must fail', assignee, 'HIGH', now(), actor);
    RAISE EXCEPTION 'action tenant constraint did not fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'action tenant constraint did not fail' THEN RAISE; END IF;
  END;

  INSERT INTO finding_transitions
    (organization_id, finding_id, from_status, to_status, actor_user_id)
  VALUES (org_a, finding_id, 'OPEN', 'ACTION_REQUIRED', actor);
  BEGIN
    UPDATE finding_transitions SET to_status = 'CLOSED' WHERE organization_id = org_a;
    RAISE EXCEPTION 'finding history immutability did not fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'finding history immutability did not fail' THEN RAISE; END IF;
  END;

  INSERT INTO evidence_upload_grants
    (id, organization_id, target_type, target_id, uploader_user_id, object_key,
     original_name, content_type, expected_size, expected_checksum, expires_at, status)
  VALUES (grant_id, org_a, 'CORRECTIVE_ACTION', action_id, assignee,
    'evidence/server-issued', 'proof.jpg', 'image/jpeg', 3, repeat('a', 64),
    now() + interval '5 minutes', 'FINALIZED');
  INSERT INTO storage_objects
    (id, organization_id, upload_grant_id, object_key, original_name, content_type, size, checksum)
  VALUES (object_id, org_a, grant_id, 'evidence/server-issued', 'proof.jpg',
    'image/jpeg', 3, repeat('a', 64));
  INSERT INTO evidence
    (organization_id, target_type, target_id, storage_object_id, uploader_user_id, checksum)
  VALUES (org_a, 'CORRECTIVE_ACTION', action_id, object_id, assignee, repeat('a', 64));

  BEGIN
    UPDATE evidence SET note = 'tampered';
    RAISE EXCEPTION 'evidence immutability did not fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'evidence immutability did not fail' THEN RAISE; END IF;
  END;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'evidence_immutable') THEN
    RAISE EXCEPTION 'evidence immutability trigger missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'corrective_actions_queue_idx') THEN
    RAISE EXCEPTION 'corrective action queue index missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'evidence_upload_grants_cleanup_idx') THEN
    RAISE EXCEPTION 'evidence cleanup index missing';
  END IF;
END
$$;

ROLLBACK;
SQL

echo "Phase 3 finding, action, evidence, history, and tenant constraints are healthy."