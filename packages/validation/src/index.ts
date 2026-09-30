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

export type InvitationCreateInput = z.infer<typeof invitationCreateSchema>;
export type SiteCreateInput = z.infer<typeof siteCreateSchema>;
export type SiteUpdateInput = z.infer<typeof siteUpdateSchema>;
export type AssetTypeCreateInput = z.infer<typeof assetTypeCreateSchema>;
export type AssetCreateInput = z.infer<typeof assetCreateSchema>;
export type AssetUpdateInput = z.infer<typeof assetUpdateSchema>;
