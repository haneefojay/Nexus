CREATE TYPE "public"."report_status" AS ENUM(
  'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'EXPIRED'
);

CREATE TABLE "report_requests" (
  "id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  "organization_id" uuid NOT NULL,
  "inspection_run_id" uuid NOT NULL,
  "requested_by" uuid NOT NULL,
  "status" "report_status" DEFAULT 'QUEUED' NOT NULL,
  "snapshot" jsonb NOT NULL,
  "snapshot_hash" text NOT NULL,
  "object_key" text,
  "checksum" text,
  "size" bigint,
  "error_code" text,
  "attempt_count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "processing_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "expires_at" timestamp with time zone,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "report_requests_organization_id_unique" UNIQUE("organization_id", "id"),
  CONSTRAINT "report_requests_snapshot_unique" UNIQUE(
    "organization_id", "inspection_run_id", "snapshot_hash"
  ),
  CONSTRAINT "report_requests_attempt_nonnegative" CHECK ("attempt_count" >= 0),
  CONSTRAINT "report_requests_completed_artifact" CHECK (
    "status" <> 'COMPLETED' OR
    ("object_key" IS NOT NULL AND "checksum" IS NOT NULL AND "completed_at" IS NOT NULL)
  )
);

ALTER TABLE "report_requests"
  ADD CONSTRAINT "report_requests_run_tenant_fk"
  FOREIGN KEY ("organization_id", "inspection_run_id")
  REFERENCES "inspection_runs"("organization_id", "id") ON DELETE restrict;
ALTER TABLE "report_requests"
  ADD CONSTRAINT "report_requests_requested_by_users_id_fk"
  FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE restrict;
CREATE INDEX "report_requests_status_idx"
  ON "report_requests" ("organization_id", "status", "created_at");
