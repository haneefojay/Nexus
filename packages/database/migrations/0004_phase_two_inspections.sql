CREATE TYPE "inspection_template_status" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "inspection_target_type" AS ENUM ('SITE', 'ASSET');
CREATE TYPE "inspection_recurrence_type" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'CUSTOM_DAYS');
CREATE TYPE "inspection_run_status" AS ENUM ('ASSIGNED', 'READY', 'IN_PROGRESS', 'SUBMITTED', 'REVIEW_REQUIRED', 'APPROVED', 'CLOSED', 'CANCELLED');
CREATE TYPE "finding_severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TABLE "inspection_templates" (
  "id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE RESTRICT,
  "name" text NOT NULL,
  "description" text,
  "category" text,
  "status" "inspection_template_status" DEFAULT 'DRAFT' NOT NULL,
  "draft_schema" jsonb DEFAULT '{"sections":[]}'::jsonb NOT NULL,
  "latest_version" integer DEFAULT 0 NOT NULL,
  "created_by" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "archived_at" timestamptz,
  CONSTRAINT "inspection_templates_organization_id_unique" UNIQUE("organization_id", "id"),
  CONSTRAINT "inspection_templates_archive_consistent" CHECK (
    ("status" = 'ARCHIVED' AND "archived_at" IS NOT NULL) OR
    ("status" <> 'ARCHIVED' AND "archived_at" IS NULL)
  )
);
CREATE UNIQUE INDEX "inspection_templates_organization_name_unique"
  ON "inspection_templates" ("organization_id", "name") WHERE "status" <> 'ARCHIVED';
CREATE INDEX "inspection_templates_organization_status_idx"
  ON "inspection_templates" ("organization_id", "status");

CREATE TABLE "inspection_template_versions" (
  "id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE RESTRICT,
  "template_id" uuid NOT NULL,
  "version_number" integer NOT NULL,
  "schema" jsonb NOT NULL,
  "checksum" text NOT NULL,
  "published_at" timestamptz DEFAULT now() NOT NULL,
  "created_by" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  CONSTRAINT "inspection_template_versions_organization_id_unique" UNIQUE("organization_id", "id"),
  CONSTRAINT "inspection_template_versions_number_unique" UNIQUE("template_id", "version_number"),
  CONSTRAINT "inspection_template_versions_checksum_unique" UNIQUE("template_id", "checksum"),
  CONSTRAINT "inspection_template_versions_template_tenant_fk"
    FOREIGN KEY ("organization_id", "template_id")
    REFERENCES "inspection_templates"("organization_id", "id") ON DELETE RESTRICT,
  CONSTRAINT "inspection_template_versions_number_positive" CHECK ("version_number" > 0)
);
CREATE INDEX "inspection_template_versions_template_idx"
  ON "inspection_template_versions" ("template_id", "version_number");

CREATE TABLE "inspection_plans" (
  "id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE RESTRICT,
  "template_version_id" uuid NOT NULL,
  "name" text NOT NULL,
  "target_type" "inspection_target_type" NOT NULL,
  "site_id" uuid NOT NULL,
  "asset_id" uuid,
  "recurrence_type" "inspection_recurrence_type" NOT NULL,
  "interval_days" integer,
  "starts_at" timestamptz NOT NULL,
  "ends_at" timestamptz,
  "assigned_user_id" uuid REFERENCES "users"("id") ON DELETE RESTRICT,
  "assigned_role" "membership_role",
  "due_window_minutes" integer DEFAULT 1440 NOT NULL,
  "requires_review" boolean DEFAULT false NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "next_sequence" integer DEFAULT 0 NOT NULL,
  "next_due_at" timestamptz NOT NULL,
  "created_by" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "inspection_plans_organization_id_unique" UNIQUE("organization_id", "id"),
  CONSTRAINT "inspection_plans_template_version_tenant_fk"
    FOREIGN KEY ("organization_id", "template_version_id")
    REFERENCES "inspection_template_versions"("organization_id", "id") ON DELETE RESTRICT,
  CONSTRAINT "inspection_plans_site_tenant_fk"
    FOREIGN KEY ("organization_id", "site_id")
    REFERENCES "sites"("organization_id", "id") ON DELETE RESTRICT,
  CONSTRAINT "inspection_plans_asset_tenant_site_fk"
    FOREIGN KEY ("organization_id", "site_id", "asset_id")
    REFERENCES "assets"("organization_id", "site_id", "id") ON DELETE RESTRICT,
  CONSTRAINT "inspection_plans_target_consistent" CHECK (
    ("target_type" = 'SITE' AND "asset_id" IS NULL) OR
    ("target_type" = 'ASSET' AND "asset_id" IS NOT NULL)
  ),
  CONSTRAINT "inspection_plans_custom_interval_consistent" CHECK (
    ("recurrence_type" = 'CUSTOM_DAYS' AND "interval_days" > 0) OR
    ("recurrence_type" <> 'CUSTOM_DAYS' AND "interval_days" IS NULL)
  ),
  CONSTRAINT "inspection_plans_assignment_present" CHECK (
    "assigned_user_id" IS NOT NULL OR "assigned_role" IS NOT NULL
  ),
  CONSTRAINT "inspection_plans_due_window_positive" CHECK ("due_window_minutes" > 0),
  CONSTRAINT "inspection_plans_sequence_nonnegative" CHECK ("next_sequence" >= 0),
  CONSTRAINT "inspection_plans_end_after_start" CHECK ("ends_at" IS NULL OR "ends_at" >= "starts_at")
);
CREATE INDEX "inspection_plans_generation_idx" ON "inspection_plans" ("active", "next_due_at");
CREATE INDEX "inspection_plans_organization_active_idx" ON "inspection_plans" ("organization_id", "active");

CREATE TABLE "inspection_runs" (
  "id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE RESTRICT,
  "inspection_plan_id" uuid NOT NULL,
  "template_version_id" uuid NOT NULL,
  "site_id" uuid NOT NULL,
  "asset_id" uuid,
  "assigned_to" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "sequence" integer NOT NULL,
  "status" "inspection_run_status" DEFAULT 'ASSIGNED' NOT NULL,
  "scheduled_for" timestamptz NOT NULL,
  "due_at" timestamptz NOT NULL,
  "started_at" timestamptz,
  "submitted_at" timestamptz,
  "approved_at" timestamptz,
  "closed_at" timestamptz,
  "started_offline" boolean DEFAULT false NOT NULL,
  "submitted_offline" boolean DEFAULT false NOT NULL,
  "client_device_id" text,
  "notes" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "inspection_runs_organization_id_unique" UNIQUE("organization_id", "id"),
  CONSTRAINT "inspection_runs_plan_sequence_unique" UNIQUE("inspection_plan_id", "sequence"),
  CONSTRAINT "inspection_runs_plan_tenant_fk"
    FOREIGN KEY ("organization_id", "inspection_plan_id")
    REFERENCES "inspection_plans"("organization_id", "id") ON DELETE RESTRICT,
  CONSTRAINT "inspection_runs_template_version_tenant_fk"
    FOREIGN KEY ("organization_id", "template_version_id")
    REFERENCES "inspection_template_versions"("organization_id", "id") ON DELETE RESTRICT,
  CONSTRAINT "inspection_runs_site_tenant_fk"
    FOREIGN KEY ("organization_id", "site_id")
    REFERENCES "sites"("organization_id", "id") ON DELETE RESTRICT,
  CONSTRAINT "inspection_runs_asset_tenant_site_fk"
    FOREIGN KEY ("organization_id", "site_id", "asset_id")
    REFERENCES "assets"("organization_id", "site_id", "id") ON DELETE RESTRICT,
  CONSTRAINT "inspection_runs_sequence_nonnegative" CHECK ("sequence" >= 0),
  CONSTRAINT "inspection_runs_due_after_schedule" CHECK ("due_at" >= "scheduled_for")
);
CREATE INDEX "inspection_runs_organization_due_idx"
  ON "inspection_runs" ("organization_id", "status", "due_at");
CREATE INDEX "inspection_runs_assignee_status_idx"
  ON "inspection_runs" ("assigned_to", "status", "due_at");

CREATE TABLE "inspection_responses" (
  "id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  "organization_id" uuid NOT NULL,
  "inspection_run_id" uuid NOT NULL,
  "item_id" text NOT NULL,
  "value" jsonb NOT NULL,
  "numeric_value" double precision,
  "text_value" text,
  "selected_option" text,
  "captured_at" timestamptz DEFAULT now() NOT NULL,
  "captured_by" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "evidence_required" boolean DEFAULT false NOT NULL,
  CONSTRAINT "inspection_responses_run_item_unique" UNIQUE("inspection_run_id", "item_id"),
  CONSTRAINT "inspection_responses_run_tenant_fk"
    FOREIGN KEY ("organization_id", "inspection_run_id")
    REFERENCES "inspection_runs"("organization_id", "id") ON DELETE RESTRICT
);
CREATE INDEX "inspection_responses_run_idx" ON "inspection_responses" ("inspection_run_id");

CREATE TABLE "inspection_findings" (
  "id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  "organization_id" uuid NOT NULL,
  "inspection_run_id" uuid NOT NULL,
  "item_id" text,
  "title" text NOT NULL,
  "notes" text,
  "severity" "finding_severity" NOT NULL,
  "created_by" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "inspection_findings_run_tenant_fk"
    FOREIGN KEY ("organization_id", "inspection_run_id")
    REFERENCES "inspection_runs"("organization_id", "id") ON DELETE RESTRICT
);
CREATE INDEX "inspection_findings_run_idx" ON "inspection_findings" ("inspection_run_id");
CREATE INDEX "inspection_findings_attention_idx" ON "inspection_findings" ("organization_id", "severity");

CREATE OR REPLACE FUNCTION prevent_template_version_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'published inspection template versions are immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "inspection_template_versions_immutable"
BEFORE UPDATE OR DELETE ON "inspection_template_versions"
FOR EACH ROW EXECUTE FUNCTION prevent_template_version_mutation();

CREATE OR REPLACE FUNCTION prevent_submitted_response_mutation() RETURNS trigger AS $$
DECLARE
  run_status inspection_run_status;
  target_run_id uuid;
BEGIN
  target_run_id := COALESCE(NEW.inspection_run_id, OLD.inspection_run_id);
  SELECT status INTO run_status FROM inspection_runs WHERE id = target_run_id;
  IF run_status IN ('SUBMITTED', 'REVIEW_REQUIRED', 'APPROVED', 'CLOSED') THEN
    RAISE EXCEPTION 'submitted inspection responses are immutable';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "inspection_responses_submitted_immutable"
BEFORE UPDATE OR DELETE ON "inspection_responses"
FOR EACH ROW EXECUTE FUNCTION prevent_submitted_response_mutation();

CREATE OR REPLACE FUNCTION prevent_submitted_finding_mutation() RETURNS trigger AS $$
DECLARE
  run_status inspection_run_status;
  target_run_id uuid;
BEGIN
  target_run_id := COALESCE(NEW.inspection_run_id, OLD.inspection_run_id);
  SELECT status INTO run_status FROM inspection_runs WHERE id = target_run_id;
  IF run_status IN ('SUBMITTED', 'REVIEW_REQUIRED', 'APPROVED', 'CLOSED') THEN
    RAISE EXCEPTION 'submitted inspection findings are immutable';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "inspection_findings_submitted_immutable"
BEFORE UPDATE OR DELETE ON "inspection_findings"
FOR EACH ROW EXECUTE FUNCTION prevent_submitted_finding_mutation();
