CREATE TYPE "public"."export_type" AS ENUM('ASSETS', 'FINDINGS', 'INSPECTIONS');
CREATE TYPE "public"."export_status" AS ENUM('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'EXPIRED');
CREATE TABLE "export_requests" (
  "id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  "organization_id" uuid NOT NULL,
  "export_type" "export_type" NOT NULL,
  "requested_by" uuid NOT NULL,
  "status" "export_status" DEFAULT 'QUEUED' NOT NULL,
  "snapshot" jsonb NOT NULL,
  "snapshot_hash" text NOT NULL,
  "object_key" text,
  "checksum" text,
  "size" bigint,
  "row_count" integer NOT NULL,
  "error_code" text,
  "attempt_count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "processing_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "expires_at" timestamp with time zone,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "export_requests_organization_id_unique" UNIQUE("organization_id", "id"),
  CONSTRAINT "export_requests_snapshot_unique" UNIQUE("organization_id", "export_type", "requested_by", "snapshot_hash"),
  CONSTRAINT "export_requests_row_count_nonnegative" CHECK ("row_count" >= 0),
  CONSTRAINT "export_requests_attempt_nonnegative" CHECK ("attempt_count" >= 0),
  CONSTRAINT "export_requests_completed_artifact" CHECK ("status" <> 'COMPLETED' OR ("object_key" IS NOT NULL AND "checksum" IS NOT NULL AND "completed_at" IS NOT NULL))
);
ALTER TABLE "export_requests" ADD CONSTRAINT "export_requests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE restrict;
ALTER TABLE "export_requests" ADD CONSTRAINT "export_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE restrict;
CREATE INDEX "export_requests_status_idx" ON "export_requests" ("organization_id", "status", "created_at");
