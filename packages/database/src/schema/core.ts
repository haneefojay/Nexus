import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  customType,
  date,
  doublePrecision,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const point = customType<{ data: string }>({ dataType: () => "geometry(Point,4326)" });
const polygon = customType<{ data: string }>({ dataType: () => "geometry(Polygon,4326)" });
const id = () =>
  uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`);
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const membershipRoleEnum = pgEnum("membership_role", [
  "OWNER",
  "OPERATIONS_MANAGER",
  "SUPERVISOR",
  "TECHNICIAN",
  "VIEWER",
]);
export const membershipStatusEnum = pgEnum("membership_status", [
  "INVITED",
  "ACTIVE",
  "DEACTIVATED",
]);
export const invitationStatusEnum = pgEnum("invitation_status", [
  "PENDING",
  "ACCEPTED",
  "REVOKED",
  "EXPIRED",
]);
export const siteStatusEnum = pgEnum("site_status", ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"]);
export const assetStatusEnum = pgEnum("asset_status", ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"]);
export const assetConditionEnum = pgEnum("asset_condition", [
  "UNKNOWN",
  "GOOD",
  "ATTENTION",
  "CRITICAL",
]);
export const importStatusEnum = pgEnum("import_status", [
  "UPLOADED",
  "VALIDATING",
  "READY",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
]);
export const inspectionTemplateStatusEnum = pgEnum("inspection_template_status", [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
]);
export const inspectionTargetTypeEnum = pgEnum("inspection_target_type", ["SITE", "ASSET"]);
export const inspectionRecurrenceTypeEnum = pgEnum("inspection_recurrence_type", [
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "QUARTERLY",
  "CUSTOM_DAYS",
]);
export const inspectionRunStatusEnum = pgEnum("inspection_run_status", [
  "ASSIGNED",
  "READY",
  "IN_PROGRESS",
  "SUBMITTED",
  "REVIEW_REQUIRED",
  "APPROVED",
  "CLOSED",
  "CANCELLED",
]);
export const findingSeverityEnum = pgEnum("finding_severity", [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);
export const inspectionNotificationKindEnum = pgEnum("inspection_notification_kind", [
  "ASSIGNMENT",
  "DUE",
  "OVERDUE",
]);
export const inspectionNotificationStatusEnum = pgEnum("inspection_notification_status", [
  "PENDING",
  "SENDING",
  "SENT",
  "CANCELLED",
]);

export const users = pgTable(
  "users",
  {
    id: id(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    image: text("avatar_url"),
    emailVerified: boolean("email_verified").notNull().default(false),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    active: boolean("active").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    check("users_email_normalized", sql`${table.email} = lower(trim(${table.email}))`),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("sessions_token_unique").on(table.token),
    index("sessions_user_expires_idx").on(table.userId, table.expiresAt),
  ],
);

export const accounts = pgTable(
  "accounts",
  {
    id: id(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    unique("accounts_provider_account_unique").on(table.providerId, table.accountId),
    index("accounts_user_idx").on(table.userId),
  ],
);

export const verifications = pgTable(
  "verifications",
  {
    id: id(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("verifications_identifier_idx").on(table.identifier),
    index("verifications_expires_idx").on(table.expiresAt),
  ],
);

export const rateLimits = pgTable(
  "rate_limits",
  {
    id: id(),
    key: text("key").notNull(),
    count: integer("count").notNull(),
    lastRequest: bigint("last_request", { mode: "number" }).notNull(),
  },
  (table) => [uniqueIndex("rate_limits_key_unique").on(table.key)],
);

export const organizations = pgTable(
  "organizations",
  {
    id: id(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    logoUrl: text("logo_url"),
    timezone: text("timezone").notNull(),
    defaultLocale: text("default_locale").notNull().default("en"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("organizations_slug_unique").on(table.slug),
    check("organizations_slug_normalized", sql`${table.slug} = lower(trim(${table.slug}))`),
  ],
);

export const memberships = pgTable(
  "memberships",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    role: membershipRoleEnum("role").notNull(),
    status: membershipStatusEnum("status").notNull().default("ACTIVE"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    unique("memberships_user_organization_unique").on(table.userId, table.organizationId),
    index("memberships_organization_status_idx").on(table.organizationId, table.status),
  ],
);

export const invitations = pgTable(
  "invitations",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    email: text("email").notNull(),
    role: membershipRoleEnum("role").notNull(),
    status: invitationStatusEnum("status").notNull().default("PENDING"),
    tokenHash: text("token_hash").notNull(),
    invitedBy: uuid("invited_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("invitations_token_hash_unique").on(table.tokenHash),
    uniqueIndex("invitations_pending_email_unique")
      .on(table.organizationId, table.email)
      .where(sql`${table.status} = 'PENDING'`),
    check("invitations_email_normalized", sql`${table.email} = lower(trim(${table.email}))`),
  ],
);

export const sites = pgTable(
  "sites",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    reference: text("reference"),
    type: text("type").notNull(),
    status: siteStatusEnum("status").notNull().default("DRAFT"),
    address: text("address"),
    location: point("location"),
    boundary: polygon("boundary"),
    notes: text("notes"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [
    unique("sites_organization_id_unique").on(table.organizationId, table.id),
    uniqueIndex("sites_reference_unique")
      .on(table.organizationId, table.reference)
      .where(sql`${table.reference} is not null`),
    index("sites_organization_status_idx").on(table.organizationId, table.status),
    index("sites_location_gist_idx").using("gist", table.location),
    index("sites_boundary_gist_idx").using("gist", table.boundary),
    check(
      "sites_archive_timestamp_consistent",
      sql`(${table.status} = 'ARCHIVED' and ${table.archivedAt} is not null) or (${table.status} <> 'ARCHIVED' and ${table.archivedAt} is null)`,
    ),
    check("sites_boundary_valid", sql`${table.boundary} is null or ST_IsValid(${table.boundary})`),
  ],
);

export const assetTypes = pgTable(
  "asset_types",
  {
    id: id(),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "restrict",
    }),
    name: text("name").notNull(),
    category: text("category").notNull(),
    description: text("description"),
    metadataSchema: jsonb("metadata_schema")
      .notNull()
      .default(sql`'{}'::jsonb`),
    active: boolean("active").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("asset_types_organization_name_unique")
      .on(table.organizationId, table.name)
      .where(sql`${table.organizationId} is not null`),
    uniqueIndex("asset_types_system_name_unique")
      .on(table.name)
      .where(sql`${table.organizationId} is null`),
  ],
);

export const assets = pgTable(
  "assets",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    siteId: uuid("site_id").notNull(),
    parentAssetId: uuid("parent_asset_id"),
    assetTypeId: uuid("asset_type_id")
      .notNull()
      .references(() => assetTypes.id, { onDelete: "restrict" }),
    identifier: text("identifier").notNull(),
    name: text("name").notNull(),
    serialNumber: text("serial_number"),
    manufacturer: text("manufacturer"),
    model: text("model"),
    installationDate: date("installation_date"),
    status: assetStatusEnum("status").notNull().default("DRAFT"),
    condition: assetConditionEnum("condition").notNull().default("UNKNOWN"),
    location: point("location"),
    metadata: jsonb("metadata")
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [
    unique("assets_organization_site_id_unique").on(table.organizationId, table.siteId, table.id),
    uniqueIndex("assets_identifier_unique").on(table.organizationId, table.identifier),
    index("assets_organization_site_status_idx").on(
      table.organizationId,
      table.siteId,
      table.status,
    ),
    index("assets_location_gist_idx").using("gist", table.location),
    index("assets_name_trgm_idx").using("gin", sql`${table.name} gin_trgm_ops`),
    index("assets_serial_trgm_idx").using("gin", sql`${table.serialNumber} gin_trgm_ops`),
    foreignKey({
      name: "assets_site_tenant_fk",
      columns: [table.organizationId, table.siteId],
      foreignColumns: [sites.organizationId, sites.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "assets_parent_tenant_site_fk",
      columns: [table.organizationId, table.siteId, table.parentAssetId],
      foreignColumns: [table.organizationId, table.siteId, table.id],
    }).onDelete("restrict"),
    check(
      "assets_not_own_parent",
      sql`${table.parentAssetId} is null or ${table.parentAssetId} <> ${table.id}`,
    ),
    check(
      "assets_archive_timestamp_consistent",
      sql`(${table.status} = 'ARCHIVED' and ${table.archivedAt} is not null) or (${table.status} <> 'ARCHIVED' and ${table.archivedAt} is null)`,
    ),
  ],
);

export const activityEvents = pgTable(
  "activity_events",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "restrict" }),
    action: text("action").notNull(),
    resourceType: text("resource_type").notNull(),
    resourceId: uuid("resource_id").notNull(),
    requestId: uuid("request_id"),
    metadata: jsonb("metadata")
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: createdAt(),
  },
  (table) => [
    index("activity_events_resource_idx").on(
      table.organizationId,
      table.resourceType,
      table.resourceId,
      table.createdAt,
    ),
  ],
);

export const importJobs = pgTable(
  "import_jobs",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    requestedBy: uuid("requested_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    kind: text("kind").notNull(),
    status: importStatusEnum("status").notNull().default("UPLOADED"),
    sourceChecksum: text("source_checksum").notNull(),
    mapping: jsonb("mapping")
      .notNull()
      .default(sql`'{}'::jsonb`),
    totalRows: integer("total_rows").notNull().default(0),
    validRows: integer("valid_rows").notNull().default(0),
    invalidRows: integer("invalid_rows").notNull().default(0),
    processedRows: integer("processed_rows").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    unique("import_jobs_idempotency_unique").on(
      table.organizationId,
      table.sourceChecksum,
      table.kind,
    ),
    index("import_jobs_organization_status_idx").on(table.organizationId, table.status),
  ],
);

export const importRowErrors = pgTable(
  "import_row_errors",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    importJobId: uuid("import_job_id")
      .notNull()
      .references(() => importJobs.id, { onDelete: "cascade" }),
    rowNumber: integer("row_number").notNull(),
    field: text("field"),
    code: text("code").notNull(),
    message: text("message").notNull(),
    rowData: jsonb("row_data")
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: createdAt(),
  },
  (table) => [index("import_row_errors_job_row_idx").on(table.importJobId, table.rowNumber)],
);

export const inspectionTemplates = pgTable(
  "inspection_templates",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    description: text("description"),
    category: text("category"),
    status: inspectionTemplateStatusEnum("status").notNull().default("DRAFT"),
    draftSchema: jsonb("draft_schema")
      .notNull()
      .default(sql`'{"sections":[]}'::jsonb`),
    latestVersion: integer("latest_version").notNull().default(0),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [
    unique("inspection_templates_organization_id_unique").on(table.organizationId, table.id),
    uniqueIndex("inspection_templates_organization_name_unique")
      .on(table.organizationId, table.name)
      .where(sql`${table.status} <> 'ARCHIVED'`),
    index("inspection_templates_organization_status_idx").on(table.organizationId, table.status),
    check(
      "inspection_templates_archive_consistent",
      sql`(${table.status} = 'ARCHIVED' and ${table.archivedAt} is not null) or (${table.status} <> 'ARCHIVED' and ${table.archivedAt} is null)`,
    ),
  ],
);

export const inspectionTemplateVersions = pgTable(
  "inspection_template_versions",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    templateId: uuid("template_id").notNull(),
    versionNumber: integer("version_number").notNull(),
    schema: jsonb("schema").notNull(),
    checksum: text("checksum").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
  },
  (table) => [
    unique("inspection_template_versions_organization_id_unique").on(
      table.organizationId,
      table.id,
    ),
    unique("inspection_template_versions_number_unique").on(table.templateId, table.versionNumber),
    unique("inspection_template_versions_checksum_unique").on(table.templateId, table.checksum),
    foreignKey({
      name: "inspection_template_versions_template_tenant_fk",
      columns: [table.organizationId, table.templateId],
      foreignColumns: [inspectionTemplates.organizationId, inspectionTemplates.id],
    }).onDelete("restrict"),
    index("inspection_template_versions_template_idx").on(table.templateId, table.versionNumber),
    check("inspection_template_versions_number_positive", sql`${table.versionNumber} > 0`),
  ],
);

export const inspectionPlans = pgTable(
  "inspection_plans",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    templateVersionId: uuid("template_version_id").notNull(),
    name: text("name").notNull(),
    targetType: inspectionTargetTypeEnum("target_type").notNull(),
    siteId: uuid("site_id").notNull(),
    assetId: uuid("asset_id"),
    recurrenceType: inspectionRecurrenceTypeEnum("recurrence_type").notNull(),
    intervalDays: integer("interval_days"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    assignedUserId: uuid("assigned_user_id").references(() => users.id, { onDelete: "restrict" }),
    assignedRole: membershipRoleEnum("assigned_role"),
    dueWindowMinutes: integer("due_window_minutes").notNull().default(1440),
    requiresReview: boolean("requires_review").notNull().default(false),
    active: boolean("active").notNull().default(true),
    nextSequence: integer("next_sequence").notNull().default(0),
    nextDueAt: timestamp("next_due_at", { withTimezone: true }).notNull(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    unique("inspection_plans_organization_id_unique").on(table.organizationId, table.id),
    foreignKey({
      name: "inspection_plans_template_version_tenant_fk",
      columns: [table.organizationId, table.templateVersionId],
      foreignColumns: [inspectionTemplateVersions.organizationId, inspectionTemplateVersions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "inspection_plans_site_tenant_fk",
      columns: [table.organizationId, table.siteId],
      foreignColumns: [sites.organizationId, sites.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "inspection_plans_asset_tenant_site_fk",
      columns: [table.organizationId, table.siteId, table.assetId],
      foreignColumns: [assets.organizationId, assets.siteId, assets.id],
    }).onDelete("restrict"),
    index("inspection_plans_generation_idx").on(table.active, table.nextDueAt),
    index("inspection_plans_organization_active_idx").on(table.organizationId, table.active),
    check(
      "inspection_plans_target_consistent",
      sql`(${table.targetType} = 'SITE' and ${table.assetId} is null) or (${table.targetType} = 'ASSET' and ${table.assetId} is not null)`,
    ),
    check(
      "inspection_plans_custom_interval_consistent",
      sql`(${table.recurrenceType} = 'CUSTOM_DAYS' and ${table.intervalDays} > 0) or (${table.recurrenceType} <> 'CUSTOM_DAYS' and ${table.intervalDays} is null)`,
    ),
    check(
      "inspection_plans_assignment_present",
      sql`${table.assignedUserId} is not null or ${table.assignedRole} is not null`,
    ),
    check("inspection_plans_due_window_positive", sql`${table.dueWindowMinutes} > 0`),
    check("inspection_plans_sequence_nonnegative", sql`${table.nextSequence} >= 0`),
    check(
      "inspection_plans_end_after_start",
      sql`${table.endsAt} is null or ${table.endsAt} >= ${table.startsAt}`,
    ),
  ],
);

export const inspectionRuns = pgTable(
  "inspection_runs",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    inspectionPlanId: uuid("inspection_plan_id").notNull(),
    templateVersionId: uuid("template_version_id").notNull(),
    siteId: uuid("site_id").notNull(),
    assetId: uuid("asset_id"),
    assignedTo: uuid("assigned_to")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    sequence: integer("sequence").notNull(),
    status: inspectionRunStatusEnum("status").notNull().default("ASSIGNED"),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    startedOffline: boolean("started_offline").notNull().default(false),
    submittedOffline: boolean("submitted_offline").notNull().default(false),
    clientDeviceId: text("client_device_id"),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    unique("inspection_runs_organization_id_unique").on(table.organizationId, table.id),
    unique("inspection_runs_plan_sequence_unique").on(table.inspectionPlanId, table.sequence),
    foreignKey({
      name: "inspection_runs_plan_tenant_fk",
      columns: [table.organizationId, table.inspectionPlanId],
      foreignColumns: [inspectionPlans.organizationId, inspectionPlans.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "inspection_runs_template_version_tenant_fk",
      columns: [table.organizationId, table.templateVersionId],
      foreignColumns: [inspectionTemplateVersions.organizationId, inspectionTemplateVersions.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "inspection_runs_site_tenant_fk",
      columns: [table.organizationId, table.siteId],
      foreignColumns: [sites.organizationId, sites.id],
    }).onDelete("restrict"),
    foreignKey({
      name: "inspection_runs_asset_tenant_site_fk",
      columns: [table.organizationId, table.siteId, table.assetId],
      foreignColumns: [assets.organizationId, assets.siteId, assets.id],
    }).onDelete("restrict"),
    index("inspection_runs_organization_due_idx").on(
      table.organizationId,
      table.status,
      table.dueAt,
    ),
    index("inspection_runs_assignee_status_idx").on(table.assignedTo, table.status, table.dueAt),
    check("inspection_runs_sequence_nonnegative", sql`${table.sequence} >= 0`),
    check("inspection_runs_due_after_schedule", sql`${table.dueAt} >= ${table.scheduledFor}`),
  ],
);

export const inspectionResponses = pgTable(
  "inspection_responses",
  {
    id: id(),
    organizationId: uuid("organization_id").notNull(),
    inspectionRunId: uuid("inspection_run_id").notNull(),
    itemId: text("item_id").notNull(),
    value: jsonb("value").notNull(),
    numericValue: doublePrecision("numeric_value"),
    textValue: text("text_value"),
    selectedOption: text("selected_option"),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
    capturedBy: uuid("captured_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    evidenceRequired: boolean("evidence_required").notNull().default(false),
  },
  (table) => [
    unique("inspection_responses_run_item_unique").on(table.inspectionRunId, table.itemId),
    foreignKey({
      name: "inspection_responses_run_tenant_fk",
      columns: [table.organizationId, table.inspectionRunId],
      foreignColumns: [inspectionRuns.organizationId, inspectionRuns.id],
    }).onDelete("restrict"),
    index("inspection_responses_run_idx").on(table.inspectionRunId),
  ],
);

export const inspectionNotificationIntents = pgTable(
  "inspection_notification_intents",
  {
    id: id(),
    organizationId: uuid("organization_id").notNull(),
    inspectionRunId: uuid("inspection_run_id").notNull(),
    recipientUserId: uuid("recipient_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    kind: inspectionNotificationKindEnum("kind").notNull(),
    status: inspectionNotificationStatusEnum("status").notNull().default("PENDING"),
    dedupeKey: text("dedupe_key").notNull(),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    unique("inspection_notification_intents_dedupe_unique").on(table.dedupeKey),
    foreignKey({
      name: "inspection_notification_intents_run_tenant_fk",
      columns: [table.organizationId, table.inspectionRunId],
      foreignColumns: [inspectionRuns.organizationId, inspectionRuns.id],
    }).onDelete("restrict"),
    index("inspection_notification_intents_dispatch_idx").on(table.status, table.scheduledFor),
  ],
);

export const inspectionFindings = pgTable(
  "inspection_findings",
  {
    id: id(),
    organizationId: uuid("organization_id").notNull(),
    inspectionRunId: uuid("inspection_run_id").notNull(),
    itemId: text("item_id"),
    title: text("title").notNull(),
    notes: text("notes"),
    severity: findingSeverityEnum("severity").notNull(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: createdAt(),
  },
  (table) => [
    foreignKey({
      name: "inspection_findings_run_tenant_fk",
      columns: [table.organizationId, table.inspectionRunId],
      foreignColumns: [inspectionRuns.organizationId, inspectionRuns.id],
    }).onDelete("restrict"),
    index("inspection_findings_run_idx").on(table.inspectionRunId),
    index("inspection_findings_attention_idx").on(table.organizationId, table.severity),
  ],
);
