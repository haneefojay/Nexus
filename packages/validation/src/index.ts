import { z } from "zod";

export const uuidV7Schema = z
  .uuid()
  .refine((value) => value.split("-")[2]?.startsWith("7"), "Expected a UUIDv7 identifier");

export const cursorQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const coordinateSchema = z.object({
  longitude: z.number().min(-180).max(180),
  latitude: z.number().min(-90).max(90),
});

export const organizationCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(63)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  timezone: z
    .string()
    .min(1)
    .refine((timezone) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: timezone }).format();
        return true;
      } catch {
        return false;
      }
    }, "Expected an IANA timezone"),
});

export type OrganizationCreateInput = z.infer<typeof organizationCreateSchema>;

export const membershipRoleSchema = z.enum([
  "OWNER",
  "OPERATIONS_MANAGER",
  "SUPERVISOR",
  "TECHNICIAN",
  "VIEWER",
]);

export const invitationCreateSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  role: membershipRoleSchema.exclude(["OWNER"]),
});

export const membershipUpdateSchema = z.object({
  role: membershipRoleSchema,
});

export const lifecycleStatusSchema = z.enum(["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"]);

const optionalTrimmed = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .optional()
    .transform((value) => value || undefined);

const siteFields = z.object({
  name: z.string().trim().min(2).max(120),
  reference: optionalTrimmed(80),
  type: z.string().trim().min(2).max(80),
  status: lifecycleStatusSchema.default("DRAFT"),
  address: optionalTrimmed(300),
  notes: optionalTrimmed(2_000),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});
const coordinatesTogether = (value: {
  latitude?: number | undefined;
  longitude?: number | undefined;
}) => (value.latitude === undefined) === (value.longitude === undefined);
export const siteCreateSchema = siteFields.refine(coordinatesTogether, {
  message: "Latitude and longitude must be supplied together",
  path: ["location"],
});

export const siteUpdateSchema = siteFields.partial().refine(coordinatesTogether, {
  message: "Latitude and longitude must be supplied together",
  path: ["location"],
});

export const assetTypeCreateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  category: z.string().trim().min(2).max(80),
  description: optionalTrimmed(500),
  metadataSchema: z.record(z.string(), z.unknown()).default({}),
});

const assetFields = z.object({
  siteId: z.uuid(),
  assetTypeId: z.uuid(),
  parentAssetId: z.uuid().nullable().optional(),
  identifier: z.string().trim().min(1).max(120),
  name: z.string().trim().min(2).max(160),
  serialNumber: optionalTrimmed(160),
  manufacturer: optionalTrimmed(120),
  model: optionalTrimmed(120),
  installationDate: z.iso.date().optional(),
  status: lifecycleStatusSchema.default("DRAFT"),
  condition: z.enum(["UNKNOWN", "GOOD", "ATTENTION", "CRITICAL"]).default("UNKNOWN"),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export const assetCreateSchema = assetFields.refine(coordinatesTogether, {
  message: "Latitude and longitude must be supplied together",
  path: ["location"],
});

export const assetUpdateSchema = assetFields.partial().refine(coordinatesTogether, {
  message: "Latitude and longitude must be supplied together",
  path: ["location"],
});

export const importPreviewSchema = z.object({
  kind: z.enum(["SITE", "ASSET"]),
  csv: z.string().min(1).max(2_000_000),
});

export const mapViewportSchema = z
  .object({
    west: z.coerce.number().min(-180).max(180),
    south: z.coerce.number().min(-90).max(90),
    east: z.coerce.number().min(-180).max(180),
    north: z.coerce.number().min(-90).max(90),
    zoom: z.coerce.number().min(0).max(24),
  })
  .refine((value) => value.south < value.north, {
    message: "South must be below north",
    path: ["south"],
  });

export const inspectionResponseTypeSchema = z.enum([
  "PASS_FAIL",
  "YES_NO",
  "SINGLE_CHOICE",
  "NUMERIC",
  "SHORT_TEXT",
  "LONG_TEXT",
  "PHOTO",
  "DATE_TIME",
]);

export const inspectionTemplateItemSchema = z
  .object({
    id: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .regex(/^[a-zA-Z0-9_-]+$/),
    label: z.string().trim().min(1).max(300),
    helpText: optionalTrimmed(1_000),
    responseType: inspectionResponseTypeSchema,
    required: z.boolean().default(false),
    unit: optionalTrimmed(40),
    minimum: z.number().finite().optional(),
    maximum: z.number().finite().optional(),
    options: z.array(z.string().trim().min(1).max(120)).max(50).optional(),
    severityTrigger: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
    evidenceRequired: z.boolean().default(false),
  })
  .superRefine((item, context) => {
    if (
      item.responseType === "SINGLE_CHOICE" &&
      (!item.options ||
        new Set(item.options).size !== item.options.length ||
        item.options.length < 2)
    ) {
      context.addIssue({
        code: "custom",
        path: ["options"],
        message: "Single-choice items require at least two unique options",
      });
    }
    if (item.responseType !== "SINGLE_CHOICE" && item.options) {
      context.addIssue({
        code: "custom",
        path: ["options"],
        message: "Options are only supported for single-choice items",
      });
    }
    if (
      item.responseType !== "NUMERIC" &&
      (item.minimum !== undefined || item.maximum !== undefined)
    ) {
      context.addIssue({
        code: "custom",
        path: ["minimum"],
        message: "Minimum and maximum are only supported for numeric items",
      });
    }
    if (item.minimum !== undefined && item.maximum !== undefined && item.minimum > item.maximum) {
      context.addIssue({
        code: "custom",
        path: ["maximum"],
        message: "Maximum must be greater than or equal to minimum",
      });
    }
  });

export const inspectionTemplateSchema = z
  .object({
    sections: z
      .array(
        z.object({
          id: z
            .string()
            .trim()
            .min(1)
            .max(80)
            .regex(/^[a-zA-Z0-9_-]+$/),
          title: z.string().trim().min(1).max(200),
          instructions: optionalTrimmed(2_000),
          items: z.array(inspectionTemplateItemSchema).min(1).max(200),
        }),
      )
      .min(1)
      .max(30),
  })
  .superRefine((schema, context) => {
    const sectionIds = new Set<string>();
    const itemIds = new Set<string>();
    schema.sections.forEach((section, sectionIndex) => {
      if (sectionIds.has(section.id))
        context.addIssue({
          code: "custom",
          path: ["sections", sectionIndex, "id"],
          message: "Section IDs must be unique",
        });
      sectionIds.add(section.id);
      section.items.forEach((item, itemIndex) => {
        if (itemIds.has(item.id))
          context.addIssue({
            code: "custom",
            path: ["sections", sectionIndex, "items", itemIndex, "id"],
            message: "Item IDs must be unique across the template",
          });
        itemIds.add(item.id);
      });
    });
  });

export const inspectionTemplateCreateSchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: optionalTrimmed(2_000),
  category: optionalTrimmed(100),
  schema: inspectionTemplateSchema,
});

export const inspectionTemplateUpdateSchema = inspectionTemplateCreateSchema.partial();

export const inspectionRecurrenceSchema = z
  .object({
    type: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "CUSTOM_DAYS"]),
    intervalDays: z.number().int().min(1).max(365).optional(),
  })
  .superRefine((recurrence, context) => {
    if ((recurrence.type === "CUSTOM_DAYS") !== (recurrence.intervalDays !== undefined)) {
      context.addIssue({
        code: "custom",
        path: ["intervalDays"],
        message: "intervalDays is required only for custom-day recurrence",
      });
    }
  });

export const inspectionPlanCreateSchema = z
  .object({
    templateVersionId: z.uuid(),
    name: z.string().trim().min(2).max(160),
    targetType: z.enum(["SITE", "ASSET"]),
    siteId: z.uuid(),
    assetId: z.uuid().optional(),
    recurrence: inspectionRecurrenceSchema,
    startsAt: z.iso.datetime({ offset: true }),
    endsAt: z.iso.datetime({ offset: true }).optional(),
    assignedUserId: z.uuid().optional(),
    assignedRole: membershipRoleSchema.optional(),
    dueWindowMinutes: z.number().int().min(1).max(525_600).default(1_440),
    requiresReview: z.boolean().default(false),
  })
  .superRefine((plan, context) => {
    if ((plan.targetType === "ASSET") !== Boolean(plan.assetId))
      context.addIssue({
        code: "custom",
        path: ["assetId"],
        message: "Asset targets require assetId; site targets must omit it",
      });
    if (!plan.assignedUserId && !plan.assignedRole)
      context.addIssue({
        code: "custom",
        path: ["assignedUserId"],
        message: "An assigned user or role is required",
      });
    if (plan.endsAt && Date.parse(plan.endsAt) < Date.parse(plan.startsAt))
      context.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "End must not precede start",
      });
  });

export const inspectionPlanUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(160).optional(),
    assignedUserId: z.uuid().nullable().optional(),
    assignedRole: membershipRoleSchema.nullable().optional(),
    dueWindowMinutes: z.number().int().min(1).max(525_600).optional(),
    requiresReview: z.boolean().optional(),
  })
  .refine(
    (value) => !(value.assignedUserId === null && value.assignedRole === null),
    "An assigned user or role is required",
  );

export const inspectionResponsesSchema = z.object({
  responses: z.array(z.object({ itemId: z.string().min(1).max(80), value: z.unknown() })).max(500),
  notes: z.string().trim().max(10_000).optional(),
});

export const inspectionFindingCreateSchema = z.object({
  itemId: z.string().min(1).max(80).optional(),
  title: z.string().trim().min(1).max(300),
  notes: optionalTrimmed(5_000),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
});

export const findingStatusSchema = z.enum([
  "OPEN",
  "ACKNOWLEDGED",
  "ACTION_REQUIRED",
  "IN_PROGRESS",
  "READY_FOR_VERIFICATION",
  "VERIFIED",
  "CLOSED",
  "DISMISSED",
]);

export const findingTransitionSchema = z.object({
  status: findingStatusSchema,
  reason: z.string().trim().min(1).max(5_000).optional(),
});

export const findingDismissSchema = z.object({
  reason: z.string().trim().min(1).max(5_000),
});

export const correctiveActionCreateSchema = z.object({
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().min(1).max(5_000),
  assignedTo: uuidV7Schema,
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  dueAt: z.string().datetime({ offset: true }),
});

export const correctiveActionTransitionSchema = z.object({
  note: z.string().trim().min(1).max(5_000).optional(),
  completionNotes: z.string().trim().min(1).max(10_000).optional(),
  completionEvidenceCount: z.number().int().min(0).max(100).optional(),
});
export const correctiveActionAssignSchema = z.object({
  assignedTo: uuidV7Schema,
  reason: z.string().trim().min(1).max(5_000),
});

export const evidenceTargetTypeSchema = z.enum(["FINDING", "CORRECTIVE_ACTION", "INSPECTION_RUN"]);
export const evidenceUploadAuthorizeSchema = z.object({
  targetType: evidenceTargetTypeSchema,
  targetId: uuidV7Schema,
  originalName: z.string().trim().min(1).max(255),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
  contentLength: z
    .number()
    .int()
    .min(1)
    .max(20 * 1024 * 1024),
  checksum: z.string().regex(/^[a-f0-9]{64}$/),
});
export const evidenceFinalizeSchema = z
  .object({
    uploadGrantId: uuidV7Schema,
    capturedAt: z.string().datetime({ offset: true }).optional(),
    note: z.string().trim().max(5_000).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    deviceMetadata: z.record(z.string(), z.string().max(500)).optional(),
  })
  .refine(
    (value) => (value.latitude === undefined) === (value.longitude === undefined),
    "Latitude and longitude must be supplied together",
  );

const fieldCommandBaseSchema = z.object({
  commandId: uuidV7Schema,
  organizationId: uuidV7Schema,
  inspectionRunId: uuidV7Schema,
  userId: uuidV7Schema,
  deviceId: uuidV7Schema,
  sequence: z.number().int().positive().max(1_000_000),
  dependsOn: z.array(uuidV7Schema).max(20),
  occurredAt: z.string().datetime({ offset: true }),
  idempotencyKey: z
    .string()
    .trim()
    .min(16)
    .max(200)
    .regex(/^[a-zA-Z0-9:_-]+$/),
});

export const fieldSyncCommandSchema = z.discriminatedUnion("type", [
  fieldCommandBaseSchema.extend({
    type: z.literal("START_INSPECTION"),
    payload: z.object({}).strict(),
  }),
  fieldCommandBaseSchema.extend({
    type: z.literal("SAVE_RESPONSES"),
    payload: inspectionResponsesSchema,
  }),
  fieldCommandBaseSchema.extend({
    type: z.literal("AUTHORIZE_EVIDENCE"),
    payload: evidenceUploadAuthorizeSchema.extend({
      targetType: z.literal("INSPECTION_RUN"),
      targetId: uuidV7Schema,
    }),
  }),
  fieldCommandBaseSchema.extend({
    type: z.literal("FINALIZE_EVIDENCE"),
    payload: evidenceFinalizeSchema,
  }),
  fieldCommandBaseSchema.extend({
    type: z.literal("SUBMIT_INSPECTION"),
    payload: z.object({}).strict(),
  }),
]);

export const fieldSyncBatchSchema = z.object({
  protocolVersion: z.literal(1),
  localSchemaVersion: z.literal(1),
  deviceId: uuidV7Schema,
  commands: z.array(fieldSyncCommandSchema).min(1).max(50),
});

export const fieldAssignmentQuerySchema = z.object({
  protocolVersion: z.coerce.number().int().pipe(z.literal(1)),
  localSchemaVersion: z.coerce.number().int().pipe(z.literal(1)),
  deviceId: uuidV7Schema,
  deviceLabel: z.string().trim().min(1).max(120).optional(),
});

export type InvitationCreateInput = z.infer<typeof invitationCreateSchema>;
export type SiteCreateInput = z.infer<typeof siteCreateSchema>;
export type SiteUpdateInput = z.infer<typeof siteUpdateSchema>;
export type AssetTypeCreateInput = z.infer<typeof assetTypeCreateSchema>;
export type AssetCreateInput = z.infer<typeof assetCreateSchema>;
export type AssetUpdateInput = z.infer<typeof assetUpdateSchema>;
export type InspectionTemplateSchema = z.infer<typeof inspectionTemplateSchema>;
export type InspectionTemplateCreateInput = z.infer<typeof inspectionTemplateCreateSchema>;
export type InspectionTemplateUpdateInput = z.infer<typeof inspectionTemplateUpdateSchema>;
export type InspectionPlanCreateInput = z.infer<typeof inspectionPlanCreateSchema>;
export type InspectionPlanUpdateInput = z.infer<typeof inspectionPlanUpdateSchema>;
export type InspectionResponsesInput = z.infer<typeof inspectionResponsesSchema>;
export type InspectionFindingCreateInput = z.infer<typeof inspectionFindingCreateSchema>;
export type FindingTransitionInput = z.infer<typeof findingTransitionSchema>;
export type FindingDismissInput = z.infer<typeof findingDismissSchema>;
export type CorrectiveActionCreateInput = z.infer<typeof correctiveActionCreateSchema>;
export type CorrectiveActionTransitionInput = z.infer<typeof correctiveActionTransitionSchema>;
export type CorrectiveActionAssignInput = z.infer<typeof correctiveActionAssignSchema>;
export type EvidenceUploadAuthorizeInput = z.infer<typeof evidenceUploadAuthorizeSchema>;
export type EvidenceFinalizeInput = z.infer<typeof evidenceFinalizeSchema>;
export type FieldSyncCommandInput = z.infer<typeof fieldSyncCommandSchema>;
export type FieldSyncBatchInput = z.infer<typeof fieldSyncBatchSchema>;
export type FieldAssignmentQueryInput = z.infer<typeof fieldAssignmentQuerySchema>;
