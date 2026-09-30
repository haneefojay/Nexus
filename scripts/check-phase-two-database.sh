#!/usr/bin/env bash
set -euo pipefail

compose=(docker compose)
psql=("${compose[@]}" exec -T postgres psql -U "${POSTGRES_USER:-nexus}" -d "${POSTGRES_DB:-nexus}" -v ON_ERROR_STOP=1)

"${psql[@]}" <<'SQL'
BEGIN;

DO $$
DECLARE
  owner_id uuid := uuidv7();
  org_a uuid := uuidv7();
  org_b uuid := uuidv7();
  site_a uuid := uuidv7();
  site_b uuid := uuidv7();
  template_id uuid := uuidv7();
  version_id uuid := uuidv7();
  plan_id uuid := uuidv7();
  run_id uuid := uuidv7();
BEGIN
  INSERT INTO users (id, email, name, email_verified)
  VALUES (owner_id, 'phase2-db@nexus.local', 'Phase Two', true);
  INSERT INTO organizations (id, name, slug, timezone) VALUES
    (org_a, 'Phase Two A', 'phase-two-db-a', 'Africa/Lagos'),
    (org_b, 'Phase Two B', 'phase-two-db-b', 'UTC');
  INSERT INTO memberships (user_id, organization_id, role)
  VALUES (owner_id, org_a, 'OWNER');
  INSERT INTO sites (id, organization_id, name, type, status, created_by) VALUES
    (site_a, org_a, 'A Site', 'SOLAR', 'ACTIVE', owner_id),
    (site_b, org_b, 'B Site', 'SOLAR', 'ACTIVE', owner_id);
  INSERT INTO inspection_templates
    (id, organization_id, name, status, draft_schema, latest_version, created_by)
  VALUES
    (template_id, org_a, 'Daily checks', 'PUBLISHED',
      '{"sections":[{"id":"main","title":"Main","items":[{"id":"condition","label":"Condition","responseType":"PASS_FAIL","required":true}]}]}',
      1, owner_id);
  INSERT INTO inspection_template_versions
    (id, organization_id, template_id, version_number, schema, checksum, created_by)
  VALUES
    (version_id, org_a, template_id, 1,
      '{"sections":[{"id":"main","title":"Main","items":[{"id":"condition","label":"Condition","responseType":"PASS_FAIL","required":true}]}]}',
      'phase-two-checksum', owner_id);

  BEGIN
    UPDATE inspection_template_versions SET checksum = 'tampered' WHERE id = version_id;
    RAISE EXCEPTION 'template version immutability test did not fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'template version immutability test did not fail' THEN RAISE; END IF;
  END;

  BEGIN
    INSERT INTO inspection_plans
      (organization_id, template_version_id, name, target_type, site_id,
       recurrence_type, starts_at, assigned_user_id, next_due_at, created_by)
    VALUES
      (org_a, version_id, 'Cross tenant', 'SITE', site_b, 'DAILY', now(),
       owner_id, now(), owner_id);
    RAISE EXCEPTION 'plan tenant constraint test did not fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'plan tenant constraint test did not fail' THEN RAISE; END IF;
  END;

  INSERT INTO inspection_plans
    (id, organization_id, template_version_id, name, target_type, site_id,
     recurrence_type, starts_at, assigned_user_id, next_due_at, created_by)
  VALUES
    (plan_id, org_a, version_id, 'Daily A', 'SITE', site_a, 'DAILY', now(),
     owner_id, now(), owner_id);
  INSERT INTO inspection_runs
    (id, organization_id, inspection_plan_id, template_version_id, site_id,
     assigned_to, sequence, status, scheduled_for, due_at)
  VALUES
    (run_id, org_a, plan_id, version_id, site_a, owner_id, 0, 'IN_PROGRESS',
     now(), now() + interval '1 day');
  INSERT INTO inspection_responses
    (organization_id, inspection_run_id, item_id, value, captured_by)
  VALUES (org_a, run_id, 'condition', 'true'::jsonb, owner_id);
  UPDATE inspection_runs SET status = 'CLOSED', submitted_at = now(), closed_at = now()
  WHERE id = run_id;

  BEGIN
    UPDATE inspection_responses SET value = 'false'::jsonb WHERE inspection_run_id = run_id;
    RAISE EXCEPTION 'submitted response immutability test did not fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'submitted response immutability test did not fail' THEN RAISE; END IF;
  END;

  BEGIN
    INSERT INTO inspection_runs
      (organization_id, inspection_plan_id, template_version_id, site_id,
       assigned_to, sequence, scheduled_for, due_at)
    VALUES
      (org_a, plan_id, version_id, site_a, owner_id, 0, now(), now() + interval '1 day');
    RAISE EXCEPTION 'run idempotency constraint test did not fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'run idempotency constraint test did not fail' THEN RAISE; END IF;
  END;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'inspection_template_versions_immutable'
  ) THEN
    RAISE EXCEPTION 'template immutability trigger missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'inspection_responses_submitted_immutable'
  ) THEN
    RAISE EXCEPTION 'submitted response immutability trigger missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'inspection_plans_generation_idx'
  ) THEN
    RAISE EXCEPTION 'bounded generation index missing';
  END IF;
END
$$;

ROLLBACK;
SQL

echo "Phase 2 tenant, version, response, and run-generation constraints are healthy."
