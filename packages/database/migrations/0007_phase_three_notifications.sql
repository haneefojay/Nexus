ALTER TYPE "inspection_notification_kind" ADD VALUE IF NOT EXISTS 'FINDING_ASSIGNMENT';
ALTER TYPE "inspection_notification_kind" ADD VALUE IF NOT EXISTS 'ACTION_ASSIGNMENT';
ALTER TYPE "inspection_notification_kind" ADD VALUE IF NOT EXISTS 'ACTION_DUE';
ALTER TYPE "inspection_notification_kind" ADD VALUE IF NOT EXISTS 'ACTION_OVERDUE';
ALTER TYPE "inspection_notification_kind" ADD VALUE IF NOT EXISTS 'ACTION_COMPLETED';
ALTER TYPE "inspection_notification_kind" ADD VALUE IF NOT EXISTS 'ACTION_VERIFIED';
ALTER TYPE "inspection_notification_status" ADD VALUE IF NOT EXISTS 'FAILED';

ALTER TABLE "inspection_findings"
  ADD COLUMN "assigned_to" uuid REFERENCES "users"("id") ON DELETE RESTRICT;

ALTER TABLE "inspection_notification_intents"
  ALTER COLUMN "inspection_run_id" DROP NOT NULL,
  ADD COLUMN "finding_id" uuid,
  ADD COLUMN "corrective_action_id" uuid,
  ADD CONSTRAINT "inspection_notification_intents_finding_tenant_fk"
    FOREIGN KEY ("organization_id", "finding_id")
    REFERENCES "inspection_findings" ("organization_id", "id") ON DELETE RESTRICT,
  ADD CONSTRAINT "inspection_notification_intents_action_tenant_fk"
    FOREIGN KEY ("organization_id", "corrective_action_id")
    REFERENCES "corrective_actions" ("organization_id", "id") ON DELETE RESTRICT,
  ADD CONSTRAINT "inspection_notification_intents_one_resource" CHECK (
    num_nonnulls("inspection_run_id", "finding_id", "corrective_action_id") = 1
  ),
  ADD CONSTRAINT "inspection_notification_intents_attempts_bounded" CHECK ("attempts" <= 8);

CREATE INDEX "inspection_notification_intents_action_idx"
  ON "inspection_notification_intents" ("organization_id", "corrective_action_id", "kind");