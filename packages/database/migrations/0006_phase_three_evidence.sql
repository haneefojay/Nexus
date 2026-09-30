CREATE TYPE "evidence_target_type" AS ENUM ('FINDING', 'CORRECTIVE_ACTION');
CREATE TYPE "upload_grant_status" AS ENUM ('ISSUED', 'FINALIZED', 'REJECTED');
CREATE TYPE "storage_object_status" AS ENUM ('AVAILABLE', 'QUARANTINED', 'DELETED');

CREATE TABLE "evidence_upload_grants" (
  "id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE RESTRICT,
  "target_type" "evidence_target_type" NOT NULL,
  "target_id" uuid NOT NULL,
  "uploader_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "object_key" text NOT NULL UNIQUE,
  "original_name" text NOT NULL,
  "content_type" text NOT NULL,
  "expected_size" bigint NOT NULL,
  "expected_checksum" text NOT NULL,
  "status" "upload_grant_status" NOT NULL DEFAULT 'ISSUED',
  "expires_at" timestamptz NOT NULL,
  "finalized_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "evidence_upload_grants_size_valid" CHECK ("expected_size" > 0 AND "expected_size" <= 20971520),
  CONSTRAINT "evidence_upload_grants_checksum_valid" CHECK ("expected_checksum" ~ '^[a-f0-9]{64}$'),
  CONSTRAINT "evidence_upload_grants_content_type_valid" CHECK (
    "content_type" IN ('image/jpeg','image/png','image/webp','application/pdf')
  )
);
CREATE INDEX "evidence_upload_grants_cleanup_idx"
  ON "evidence_upload_grants" ("status", "expires_at");
CREATE INDEX "evidence_upload_grants_target_idx"
  ON "evidence_upload_grants" ("organization_id", "target_type", "target_id");

CREATE TABLE "storage_objects" (
  "id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE RESTRICT,
  "upload_grant_id" uuid NOT NULL UNIQUE REFERENCES "evidence_upload_grants"("id") ON DELETE RESTRICT,
  "object_key" text NOT NULL UNIQUE,
  "original_name" text NOT NULL,
  "content_type" text NOT NULL,
  "size" bigint NOT NULL,
  "checksum" text NOT NULL,
  "status" "storage_object_status" NOT NULL DEFAULT 'AVAILABLE',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "storage_objects_organization_id_unique" UNIQUE ("organization_id", "id")
);

CREATE TABLE "evidence" (
  "id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  "organization_id" uuid NOT NULL,
  "target_type" "evidence_target_type" NOT NULL,
  "target_id" uuid NOT NULL,
  "storage_object_id" uuid NOT NULL UNIQUE,
  "uploader_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "captured_at" timestamptz,
  "uploaded_at" timestamptz NOT NULL DEFAULT now(),
  "checksum" text NOT NULL,
  "latitude" double precision,
  "longitude" double precision,
  "device_metadata" jsonb,
  "note" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "evidence_storage_object_tenant_fk"
    FOREIGN KEY ("organization_id", "storage_object_id")
    REFERENCES "storage_objects" ("organization_id", "id") ON DELETE RESTRICT,
  CONSTRAINT "evidence_coordinates_valid" CHECK (
    ("latitude" IS NULL AND "longitude" IS NULL)
    OR ("latitude" BETWEEN -90 AND 90 AND "longitude" BETWEEN -180 AND 180)
  )
);
CREATE INDEX "evidence_target_idx"
  ON "evidence" ("organization_id", "target_type", "target_id");

CREATE TRIGGER "storage_objects_immutable"
BEFORE UPDATE OR DELETE ON "storage_objects"
FOR EACH ROW EXECUTE FUNCTION prevent_append_only_mutation();
CREATE TRIGGER "evidence_immutable"
BEFORE UPDATE OR DELETE ON "evidence"
FOR EACH ROW EXECUTE FUNCTION prevent_append_only_mutation();