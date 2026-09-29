CREATE TYPE membership_role AS ENUM ('OWNER', 'OPERATIONS_MANAGER', 'SUPERVISOR', 'TECHNICIAN', 'VIEWER');
CREATE TYPE membership_status AS ENUM ('INVITED', 'ACTIVE', 'DEACTIVATED');
CREATE TYPE invitation_status AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');
CREATE TYPE site_status AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED');
CREATE TYPE asset_status AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED');
CREATE TYPE asset_condition AS ENUM ('UNKNOWN', 'GOOD', 'ATTENTION', 'CRITICAL');
CREATE TYPE import_status AS ENUM ('UPLOADED', 'VALIDATING', 'READY', 'PROCESSING', 'COMPLETED', 'FAILED');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  email text NOT NULL,
  name text NOT NULL,
  avatar_url text,
  email_verified_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_email_normalized CHECK (email = lower(trim(email)))
);
CREATE UNIQUE INDEX users_email_unique ON users (email);

CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  name text NOT NULL,
  slug text NOT NULL,
  logo_url text,
  timezone text NOT NULL,
  default_locale text NOT NULL DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organizations_slug_normalized CHECK (slug = lower(trim(slug)))
);
CREATE UNIQUE INDEX organizations_slug_unique ON organizations (slug);

CREATE TABLE memberships (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  role membership_role NOT NULL,
  status membership_status NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memberships_user_organization_unique UNIQUE (user_id, organization_id)
);
CREATE INDEX memberships_organization_status_idx ON memberships (organization_id, status);

CREATE TABLE invitations (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  email text NOT NULL,
  role membership_role NOT NULL,
  status invitation_status NOT NULL DEFAULT 'PENDING',
  token_hash text NOT NULL,
  invited_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT invitations_email_normalized CHECK (email = lower(trim(email)))
);
CREATE UNIQUE INDEX invitations_token_hash_unique ON invitations (token_hash);
CREATE UNIQUE INDEX invitations_pending_email_unique ON invitations (organization_id, email) WHERE status = 'PENDING';

CREATE TABLE sites (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name text NOT NULL,
  reference text,
  type text NOT NULL,
  status site_status NOT NULL DEFAULT 'DRAFT',
  address text,
  location geometry(Point, 4326),
  boundary geometry(Polygon, 4326),
  notes text,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  CONSTRAINT sites_organization_id_unique UNIQUE (organization_id, id),
  CONSTRAINT sites_archive_timestamp_consistent CHECK (
    (status = 'ARCHIVED' AND archived_at IS NOT NULL)
    OR (status <> 'ARCHIVED' AND archived_at IS NULL)
  ),
  CONSTRAINT sites_boundary_valid CHECK (boundary IS NULL OR ST_IsValid(boundary))
);
CREATE UNIQUE INDEX sites_reference_unique ON sites (organization_id, reference) WHERE reference IS NOT NULL;
CREATE INDEX sites_organization_status_idx ON sites (organization_id, status);
CREATE INDEX sites_location_gist_idx ON sites USING gist (location);
CREATE INDEX sites_boundary_gist_idx ON sites USING gist (boundary);

CREATE TABLE asset_types (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  organization_id uuid REFERENCES organizations(id) ON DELETE RESTRICT,
  name text NOT NULL,
  category text NOT NULL,
  description text,
  metadata_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX asset_types_organization_name_unique ON asset_types (organization_id, name) WHERE organization_id IS NOT NULL;
CREATE UNIQUE INDEX asset_types_system_name_unique ON asset_types (name) WHERE organization_id IS NULL;

CREATE TABLE assets (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  site_id uuid NOT NULL,
  parent_asset_id uuid,
  asset_type_id uuid NOT NULL REFERENCES asset_types(id) ON DELETE RESTRICT,
  identifier text NOT NULL,
  name text NOT NULL,
  serial_number text,
  manufacturer text,
  model text,
  installation_date date,
  status asset_status NOT NULL DEFAULT 'DRAFT',
  condition asset_condition NOT NULL DEFAULT 'UNKNOWN',
  location geometry(Point, 4326),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  CONSTRAINT assets_organization_site_id_unique UNIQUE (organization_id, site_id, id),
  CONSTRAINT assets_identifier_unique UNIQUE (organization_id, identifier),
  CONSTRAINT assets_site_tenant_fk FOREIGN KEY (organization_id, site_id) REFERENCES sites(organization_id, id) ON DELETE RESTRICT,
  CONSTRAINT assets_parent_tenant_site_fk FOREIGN KEY (organization_id, site_id, parent_asset_id) REFERENCES assets(organization_id, site_id, id) ON DELETE RESTRICT,
  CONSTRAINT assets_not_own_parent CHECK (parent_asset_id IS NULL OR parent_asset_id <> id),
  CONSTRAINT assets_archive_timestamp_consistent CHECK (
    (status = 'ARCHIVED' AND archived_at IS NOT NULL)
    OR (status <> 'ARCHIVED' AND archived_at IS NULL)
  )
);
CREATE INDEX assets_organization_site_status_idx ON assets (organization_id, site_id, status);
CREATE INDEX assets_location_gist_idx ON assets USING gist (location);
CREATE INDEX assets_name_trgm_idx ON assets USING gin (name gin_trgm_ops);
CREATE INDEX assets_serial_trgm_idx ON assets USING gin (serial_number gin_trgm_ops);

CREATE TABLE activity_events (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  actor_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid NOT NULL,
  request_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX activity_events_resource_idx ON activity_events (organization_id, resource_type, resource_id, created_at);

CREATE TABLE import_jobs (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  requested_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  kind text NOT NULL,
  status import_status NOT NULL DEFAULT 'UPLOADED',
  source_checksum text NOT NULL,
  mapping jsonb NOT NULL DEFAULT '{}'::jsonb,
  total_rows integer NOT NULL DEFAULT 0,
  valid_rows integer NOT NULL DEFAULT 0,
  invalid_rows integer NOT NULL DEFAULT 0,
  processed_rows integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT import_jobs_idempotency_unique UNIQUE (organization_id, source_checksum, kind)
);
CREATE INDEX import_jobs_organization_status_idx ON import_jobs (organization_id, status);

CREATE TABLE import_row_errors (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  import_job_id uuid NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
  row_number integer NOT NULL,
  field text,
  code text NOT NULL,
  message text NOT NULL,
  row_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX import_row_errors_job_row_idx ON import_row_errors (import_job_id, row_number);

-- Custom asset types are visible only to their owning organization; null means system default.
CREATE OR REPLACE FUNCTION enforce_asset_type_scope() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  type_organization_id uuid;
BEGIN
  SELECT organization_id INTO type_organization_id FROM asset_types WHERE id = NEW.asset_type_id;
  IF NOT FOUND OR (type_organization_id IS NOT NULL AND type_organization_id <> NEW.organization_id) THEN
    RAISE EXCEPTION 'asset type is not available to this organization';
  END IF;
  RETURN NEW;
END
$$;
CREATE TRIGGER assets_asset_type_scope
BEFORE INSERT OR UPDATE OF asset_type_id, organization_id ON assets
FOR EACH ROW EXECUTE FUNCTION enforce_asset_type_scope();

-- Reject cycles that span more than one asset. The composite FK already enforces tenant/site scope.
CREATE OR REPLACE FUNCTION reject_asset_hierarchy_cycle() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  cycle_found boolean;
BEGIN
  IF NEW.parent_asset_id IS NULL THEN
    RETURN NEW;
  END IF;

  WITH RECURSIVE ancestors(id, parent_asset_id) AS (
    SELECT id, parent_asset_id
    FROM assets
    WHERE organization_id = NEW.organization_id
      AND site_id = NEW.site_id
      AND id = NEW.parent_asset_id
    UNION ALL
    SELECT asset.id, asset.parent_asset_id
    FROM assets asset
    JOIN ancestors ON asset.id = ancestors.parent_asset_id
    WHERE asset.organization_id = NEW.organization_id
      AND asset.site_id = NEW.site_id
  )
  SELECT EXISTS (SELECT 1 FROM ancestors WHERE id = NEW.id) INTO cycle_found;

  IF cycle_found THEN
    RAISE EXCEPTION 'asset hierarchy cycle detected';
  END IF;
  RETURN NEW;
END
$$;
CREATE TRIGGER assets_no_hierarchy_cycle
BEFORE INSERT OR UPDATE OF parent_asset_id, organization_id, site_id ON assets
FOR EACH ROW EXECUTE FUNCTION reject_asset_hierarchy_cycle();

-- Membership changes may not leave an organization without an active owner.
CREATE OR REPLACE FUNCTION require_active_organization_owner() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  affected_organization_id uuid := COALESCE(NEW.organization_id, OLD.organization_id);
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM memberships
    WHERE organization_id = affected_organization_id
      AND role = 'OWNER'
      AND status = 'ACTIVE'
  ) THEN
    RAISE EXCEPTION 'organization must retain an active owner';
  END IF;
  RETURN COALESCE(NEW, OLD);
END
$$;
CREATE CONSTRAINT TRIGGER memberships_require_owner
AFTER UPDATE OR DELETE ON memberships
DEFERRABLE INITIALLY IMMEDIATE
FOR EACH ROW EXECUTE FUNCTION require_active_organization_owner();

-- Prevent direct mutation/deletion of immutable activity history.
CREATE OR REPLACE FUNCTION reject_activity_event_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'activity_events are append-only';
END
$$;
CREATE TRIGGER activity_events_immutable
BEFORE UPDATE OR DELETE ON activity_events
FOR EACH ROW EXECUTE FUNCTION reject_activity_event_mutation();
