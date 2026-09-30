ALTER TYPE "public"."evidence_target_type" ADD VALUE IF NOT EXISTS 'INSPECTION_RUN';

CREATE TYPE "public"."field_device_status" AS ENUM('ACTIVE', 'REVOKED');
CREATE TYPE "public"."field_sync_outcome" AS ENUM(
  'SUCCESS',
  'RETRYABLE_FAILURE',
  'PERMANENT_FAILURE',
  'AUTHENTICATION_FAILURE',
  'CONFLICT'
);

CREATE TABLE "field_devices" (
  "id" uuid PRIMARY KEY NOT NULL,
  "organization_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "status" "field_device_status" DEFAULT 'ACTIVE' NOT NULL,
  "label" text,
  "last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "field_devices_organization_id_unique" UNIQUE("organization_id", "id")
);

CREATE TABLE "field_run_devices" (
  "id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
  "organization_id" uuid NOT NULL,
  "inspection_run_id" uuid NOT NULL,
  "device_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "bound_at" timestamp with time zone DEFAULT now() NOT NULL,
  "released_at" timestamp with time zone
);

CREATE TABLE "field_sync_commands" (
  "command_id" uuid PRIMARY KEY NOT NULL,
  "organization_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "device_id" uuid NOT NULL,
  "inspection_run_id" uuid NOT NULL,
  "sequence" integer NOT NULL,
  "idempotency_key" text NOT NULL,
  "command_type" text NOT NULL,
  "payload_hash" text NOT NULL,
  "outcome" "field_sync_outcome" NOT NULL,
  "code" text NOT NULL,
  "authoritative_result" jsonb,
  "occurred_at" timestamp with time zone NOT NULL,
  "processed_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "field_sync_commands_idempotency_unique" UNIQUE(
    "organization_id", "user_id", "device_id", "idempotency_key"
  ),
  CONSTRAINT "field_sync_commands_sequence_unique" UNIQUE(
    "organization_id", "inspection_run_id", "device_id", "sequence"
  ),
  CONSTRAINT "field_sync_commands_sequence_positive" CHECK ("sequence" > 0)
);

ALTER TABLE "field_devices"
  ADD CONSTRAINT "field_devices_organization_id_organizations_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict;
ALTER TABLE "field_devices"
  ADD CONSTRAINT "field_devices_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict;
ALTER TABLE "field_run_devices"
  ADD CONSTRAINT "field_run_devices_run_tenant_fk"
  FOREIGN KEY ("organization_id", "inspection_run_id")
  REFERENCES "public"."inspection_runs"("organization_id", "id") ON DELETE restrict;
ALTER TABLE "field_run_devices"
  ADD CONSTRAINT "field_run_devices_device_tenant_fk"
  FOREIGN KEY ("organization_id", "device_id")
  REFERENCES "public"."field_devices"("organization_id", "id") ON DELETE restrict;
ALTER TABLE "field_run_devices"
  ADD CONSTRAINT "field_run_devices_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict;
ALTER TABLE "field_sync_commands"
  ADD CONSTRAINT "field_sync_commands_run_tenant_fk"
  FOREIGN KEY ("organization_id", "inspection_run_id")
  REFERENCES "public"."inspection_runs"("organization_id", "id") ON DELETE restrict;
ALTER TABLE "field_sync_commands"
  ADD CONSTRAINT "field_sync_commands_device_tenant_fk"
  FOREIGN KEY ("organization_id", "device_id")
  REFERENCES "public"."field_devices"("organization_id", "id") ON DELETE restrict;
ALTER TABLE "field_sync_commands"
  ADD CONSTRAINT "field_sync_commands_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict;

CREATE INDEX "field_devices_owner_idx"
  ON "field_devices" USING btree ("organization_id", "user_id", "status");
CREATE UNIQUE INDEX "field_run_devices_active_run_unique"
  ON "field_run_devices" USING btree ("organization_id", "inspection_run_id")
  WHERE "released_at" IS NULL;
CREATE INDEX "field_run_devices_owner_idx"
  ON "field_run_devices" USING btree ("organization_id", "user_id", "device_id");
CREATE INDEX "field_sync_commands_history_idx"
  ON "field_sync_commands" USING btree ("organization_id", "inspection_run_id", "processed_at");

CREATE TRIGGER "field_sync_commands_immutable"
BEFORE UPDATE OR DELETE ON "field_sync_commands"
FOR EACH ROW EXECUTE FUNCTION prevent_append_only_mutation();