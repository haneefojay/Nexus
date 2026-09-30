#!/usr/bin/env bash
set -euo pipefail

compose=(docker compose)
psql=("${compose[@]}" exec -T postgres psql -U "${POSTGRES_USER:-nexus}" -d "${POSTGRES_DB:-nexus}" -v ON_ERROR_STOP=1)

"${psql[@]}" <<'SQL'
BEGIN;

DO $$
DECLARE
  owner_id uuid := uuidv7();
  technician_id uuid := uuidv7();
  org_a uuid := uuidv7();
  org_b uuid := uuidv7();
  site_id uuid := uuidv7();
  template_id uuid := uuidv7();
  version_id uuid := uuidv7();
  plan_id uuid := uuidv7();
  run_id uuid := uuidv7();
  device_a uuid := uuidv7();
  device_b uuid := uuidv7();
  command_uuid uuid := uuidv7();
BEGIN
  INSERT INTO users (id, email, name, email_verified) VALUES
    (owner_id, 'phase4-owner@nexus.local', 'Phase Four Owner', true),
    (technician_id, 'phase4-tech@nexus.local', 'Phase Four Tech', true);
  INSERT INTO organizations (id, name, slug, timezone) VALUES
    (org_a, 'Phase Four A', 'phase-four-db-a', 'Africa/Lagos'),
    (org_b, 'Phase Four B', 'phase-four-db-b', 'UTC');
  INSERT INTO memberships (user_id, organization_id, role, status) VALUES
    (owner_id, org_a, 'OWNER', 'ACTIVE'),
    (technician_id, org_a, 'TECHNICIAN', 'ACTIVE');
  INSERT INTO sites (id, organization_id, name, type, status, created_by)
  VALUES (site_id, org_a, 'Offline Site', 'SOLAR', 'ACTIVE', owner_id);
  INSERT INTO inspection_templates
    (id, organization_id, name, status, draft_schema, latest_version, created_by)
  VALUES (template_id, org_a, 'Offline Checks', 'PUBLISHED', '{"sections":[]}', 1, owner_id);
  INSERT INTO inspection_template_versions
    (id, organization_id, template_id, version_number, schema, checksum, created_by)
  VALUES (version_id, org_a, template_id, 1, '{"sections":[]}', 'phase-four', owner_id);
  INSERT INTO inspection_plans
    (id, organization_id, template_version_id, name, target_type, site_id,
     recurrence_type, starts_at, assigned_user_id, next_due_at, created_by)
  VALUES (plan_id, org_a, version_id, 'Offline Plan', 'SITE', site_id,
    'DAILY', now(), technician_id, now(), owner_id);
  INSERT INTO inspection_runs
    (id, organization_id, inspection_plan_id, template_version_id, site_id,
     assigned_to, sequence, status, scheduled_for, due_at)
  VALUES (run_id, org_a, plan_id, version_id, site_id, technician_id, 0,
    'IN_PROGRESS', now(), now() + interval '1 day');

  INSERT INTO field_devices (id, organization_id, user_id)
  VALUES (device_a, org_a, technician_id), (device_b, org_a, technician_id);
  INSERT INTO field_run_devices (organization_id, inspection_run_id, device_id, user_id)
  VALUES (org_a, run_id, device_a, technician_id);

  BEGIN
    INSERT INTO field_run_devices (organization_id, inspection_run_id, device_id, user_id)
    VALUES (org_a, run_id, device_b, technician_id);
    RAISE EXCEPTION 'single active run device constraint did not fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'single active run device constraint did not fail' THEN RAISE; END IF;
  END;

  BEGIN
    INSERT INTO field_devices (id, organization_id, user_id)
    VALUES (device_a, org_b, technician_id);
    RAISE EXCEPTION 'cross-tenant device identity did not fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'cross-tenant device identity did not fail' THEN RAISE; END IF;
  END;

  INSERT INTO field_sync_commands
    (command_id, organization_id, user_id, device_id, inspection_run_id, sequence,
     idempotency_key, command_type, payload_hash, outcome, code, occurred_at)
  VALUES (command_uuid, org_a, technician_id, device_a, run_id, 1,
    'phase4-command-idempotency', 'START_INSPECTION', repeat('a', 64),
    'SUCCESS', 'COMMAND_APPLIED', now());

  BEGIN
    INSERT INTO field_sync_commands
      (organization_id, user_id, device_id, inspection_run_id, sequence,
       idempotency_key, command_type, payload_hash, outcome, code, occurred_at)
    VALUES (org_a, technician_id, device_a, run_id, 2,
      'phase4-command-idempotency', 'START_INSPECTION', repeat('a', 64),
      'SUCCESS', 'COMMAND_APPLIED', now());
    RAISE EXCEPTION 'idempotency uniqueness did not fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'idempotency uniqueness did not fail' THEN RAISE; END IF;
  END;

  BEGIN
    UPDATE field_sync_commands SET code = 'TAMPERED' WHERE command_id = command_uuid;
    RAISE EXCEPTION 'command outcome immutability did not fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'command outcome immutability did not fail' THEN RAISE; END IF;
  END;

  INSERT INTO evidence_upload_grants
    (organization_id, target_type, target_id, uploader_user_id, object_key,
     original_name, content_type, expected_size, expected_checksum, expires_at)
  VALUES (org_a, 'INSPECTION_RUN', run_id, technician_id,
    'evidence/server-issued/phase-four', 'field.jpg', 'image/jpeg', 3,
    repeat('b', 64), now() + interval '5 minutes');
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'field_sync_commands_immutable') THEN
    RAISE EXCEPTION 'field sync command immutability trigger missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'field_run_devices_active_run_unique') THEN
    RAISE EXCEPTION 'active run device index missing';
  END IF;
END
$$;

ROLLBACK;
SQL

echo "Phase 4 device ownership, idempotency, evidence target, and tenant constraints are healthy."