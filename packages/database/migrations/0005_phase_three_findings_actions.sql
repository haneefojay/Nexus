CREATE TYPE "finding_status" AS ENUM (
  'OPEN', 'ACKNOWLEDGED', 'ACTION_REQUIRED', 'IN_PROGRESS',
  'READY_FOR_VERIFICATION', 'VERIFIED', 'CLOSED', 'DISMISSED'
);
CREATE TYPE "corrective_action_status" AS ENUM (
  'OPEN', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED',
  'VERIFICATION_REQUIRED', 'VERIFIED', 'CANCELLED'
);

ALTER TABLE "inspection_findings"
  ADD COLUMN "site_id" uuid,
  ADD COLUMN "asset_id" uuid,
  ADD COLUMN "status" "finding_status" NOT NULL DEFAULT 'OPEN',
  ADD COLUMN "detected_at" timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN "dismissal_reason" text,
  ADD COLUMN "dismissed_at" timestamptz,
  ADD COLUMN "dismissed_by" uuid REFERENCES "users"("id") ON DELETE RESTRICT,
  ADD COLUMN "verified_at" timestamptz,
  ADD COLUMN "verified_by" uuid REFERENCES "users"("id") ON DELETE RESTRICT,
  ADD COLUMN "closed_at" timestamptz;

UPDATE "inspection_findings" f
SET "site_id" = r."site_id", "asset_id" = r."asset_id", "detected_at" = f."created_at"
FROM "inspection_runs" r
WHERE r."id" = f."inspection_run_id" AND r."organization_id" = f."organization_id";

ALTER TABLE "inspection_findings"
  ALTER COLUMN "site_id" SET NOT NULL,
  ADD CONSTRAINT "inspection_findings_organization_id_unique" UNIQUE ("organization_id", "id"),
  ADD CONSTRAINT "inspection_findings_site_tenant_fk"
    FOREIGN KEY ("organization_id", "site_id")
    REFERENCES "sites" ("organization_id", "id") ON DELETE RESTRICT,
  ADD CONSTRAINT "inspection_findings_asset_tenant_site_fk"
    FOREIGN KEY ("organization_id", "site_id", "asset_id")
    REFERENCES "assets" ("organization_id", "site_id", "id") ON DELETE RESTRICT,
  ADD CONSTRAINT "inspection_findings_dismissal_consistent" CHECK (
    ("status" = 'DISMISSED' AND "dismissal_reason" IS NOT NULL AND
      "dismissed_at" IS NOT NULL AND "dismissed_by" IS NOT NULL)
    OR ("status" <> 'DISMISSED')
  );

DROP INDEX "inspection_findings_attention_idx";
CREATE INDEX "inspection_findings_attention_idx"
  ON "inspection_findings" ("organization_id", "status", "severity");

DROP TRIGGER "inspection_findings_submitted_immutable" ON "inspection_findings";
CREATE TRIGGER "inspection_findings_submitted_immutable"
BEFORE UPDATE OF "organization_id", "inspection_run_id", "site_id", "asset_id", "item_id",
  "title", "notes", "severity", "created_by", "created_at"
OR DELETE ON "inspection_findings"
FOR EACH ROW EXECUTE FUNCTION prevent_submitted_finding_mutation();

CREATE TABLE "corrective_actions" (
  "id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE RESTRICT,
  "finding_id" uuid NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "assigned_to" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "priority" "finding_severity" NOT NULL,
  "due_at" timestamptz NOT NULL,
  "status" "corrective_action_status" NOT NULL DEFAULT 'OPEN',
  "blocked_reason" text,
  "completion_notes" text,
  "completed_at" timestamptz,
  "completed_by" uuid REFERENCES "users"("id") ON DELETE RESTRICT,
  "verified_at" timestamptz,
  "verified_by" uuid REFERENCES "users"("id") ON DELETE RESTRICT,
  "created_by" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "corrective_actions_organization_id_unique" UNIQUE ("organization_id", "id"),
  CONSTRAINT "corrective_actions_finding_unique" UNIQUE ("finding_id"),
  CONSTRAINT "corrective_actions_finding_tenant_fk"
    FOREIGN KEY ("organization_id", "finding_id")
    REFERENCES "inspection_findings" ("organization_id", "id") ON DELETE RESTRICT
);
CREATE INDEX "corrective_actions_queue_idx"
  ON "corrective_actions" ("organization_id", "status", "due_at");
CREATE INDEX "corrective_actions_assignee_idx"
  ON "corrective_actions" ("organization_id", "assigned_to", "status");

CREATE TABLE "finding_transitions" (
  "id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  "organization_id" uuid NOT NULL,
  "finding_id" uuid NOT NULL,
  "from_status" "finding_status",
  "to_status" "finding_status" NOT NULL,
  "actor_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "reason" text,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "finding_transitions_finding_tenant_fk"
    FOREIGN KEY ("organization_id", "finding_id")
    REFERENCES "inspection_findings" ("organization_id", "id") ON DELETE RESTRICT
);
CREATE INDEX "finding_transitions_history_idx"
  ON "finding_transitions" ("organization_id", "finding_id", "created_at");

CREATE TABLE "corrective_action_transitions" (
  "id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  "organization_id" uuid NOT NULL,
  "corrective_action_id" uuid NOT NULL,
  "from_status" "corrective_action_status",
  "to_status" "corrective_action_status" NOT NULL,
  "actor_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "note" text,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "corrective_action_transitions_action_tenant_fk"
    FOREIGN KEY ("organization_id", "corrective_action_id")
    REFERENCES "corrective_actions" ("organization_id", "id") ON DELETE RESTRICT
);
CREATE INDEX "corrective_action_transitions_history_idx"
  ON "corrective_action_transitions" ("organization_id", "corrective_action_id", "created_at");

CREATE OR REPLACE FUNCTION prevent_append_only_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'append-only record cannot be changed';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "finding_transitions_immutable"
BEFORE UPDATE OR DELETE ON "finding_transitions"
FOR EACH ROW EXECUTE FUNCTION prevent_append_only_mutation();
CREATE TRIGGER "corrective_action_transitions_immutable"
BEFORE UPDATE OR DELETE ON "corrective_action_transitions"
FOR EACH ROW EXECUTE FUNCTION prevent_append_only_mutation();
