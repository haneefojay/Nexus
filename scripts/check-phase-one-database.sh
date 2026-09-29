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
  type_a uuid := uuidv7();
  type_b uuid := uuidv7();
  asset_a uuid := uuidv7();
  asset_b uuid := uuidv7();
BEGIN
  INSERT INTO users (id, email, name, email_verified) VALUES (owner_id, 'phase1@nexus.local', 'Phase One', true);
  INSERT INTO sessions (user_id, token, expires_at)
  VALUES (owner_id, 'phase-one-session-token', now() + interval '1 hour');
  INSERT INTO accounts (account_id, provider_id, user_id, password)
  VALUES ('phase1@nexus.local', 'credential', owner_id, '$argon2id$test');
  INSERT INTO verifications (identifier, value, expires_at)
  VALUES ('phase1@nexus.local', 'hashed-token', now() + interval '1 hour');
  INSERT INTO rate_limits (key, count, last_request)
  VALUES ('phase-one-rate-limit', 1, 1790724000000);

  INSERT INTO organizations (id, name, slug, timezone) VALUES
    (org_a, 'Organization A', 'phase-one-a', 'Africa/Lagos'),
    (org_b, 'Organization B', 'phase-one-b', 'UTC');
  INSERT INTO memberships (user_id, organization_id, role) VALUES (owner_id, org_a, 'OWNER');
  INSERT INTO sites (id, organization_id, name, reference, type, status, location, created_by)
  VALUES (site_a, org_a, 'West Site', 'WEST', 'SOLAR', 'ACTIVE', ST_SetSRID(ST_MakePoint(3.3792, 6.5244), 4326), owner_id);
  INSERT INTO asset_types (id, organization_id, name, category) VALUES
    (type_a, org_a, 'Inverter', 'POWER'),
    (type_b, org_b, 'Foreign Inverter', 'POWER');
  INSERT INTO assets (id, organization_id, site_id, asset_type_id, identifier, name, status)
  VALUES
    (asset_a, org_a, site_a, type_a, 'INV-001', 'Inverter 1', 'ACTIVE'),
    (asset_b, org_a, site_a, type_a, 'INV-002', 'Inverter 2', 'ACTIVE');

  BEGIN
    UPDATE assets SET parent_asset_id = asset_b WHERE id = asset_a;
    UPDATE assets SET parent_asset_id = asset_a WHERE id = asset_b;
    RAISE EXCEPTION 'cycle test did not fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'cycle test did not fail' THEN RAISE; END IF;
  END;

  BEGIN
    UPDATE assets SET asset_type_id = type_b WHERE id = asset_a;
    RAISE EXCEPTION 'tenant asset-type test did not fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'tenant asset-type test did not fail' THEN RAISE; END IF;
  END;

  INSERT INTO activity_events (organization_id, actor_user_id, action, resource_type, resource_id)
  VALUES (org_a, owner_id, 'site.created', 'site', site_a);

  BEGIN
    UPDATE activity_events SET action = 'tampered';
    RAISE EXCEPTION 'activity immutability test did not fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'activity immutability test did not fail' THEN RAISE; END IF;
  END;

  BEGIN
    UPDATE memberships SET status = 'DEACTIVATED' WHERE organization_id = org_a AND user_id = owner_id;
    RAISE EXCEPTION 'owner invariant test did not fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'owner invariant test did not fail' THEN RAISE; END IF;
  END;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'assets_location_gist_idx') THEN
    RAISE EXCEPTION 'assets PostGIS index missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'assets_no_hierarchy_cycle') THEN
    RAISE EXCEPTION 'asset hierarchy trigger missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'sessions_token_unique') THEN
    RAISE EXCEPTION 'auth session token uniqueness missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rate_limits' AND column_name = 'id' AND is_nullable = 'NO'
  ) THEN
    RAISE EXCEPTION 'database-backed auth rate limit identifier missing';
  END IF;
END
$$;

ROLLBACK;
SQL

echo "Phase 1 database constraints are healthy."
