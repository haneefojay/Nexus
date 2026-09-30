import {
  and,
  assetTypes,
  assets,
  eq,
  importJobs,
  importRowErrors,
  isNull,
  or,
  sites,
  sql,
  type createDatabase,
} from "@nexus/database";

type Database = ReturnType<typeof createDatabase>["db"];
type ImportRow = Record<string, string>;

export async function processImport(db: Database, importJobId: string, organizationId: string) {
  const [job] = await db
    .select()
    .from(importJobs)
    .where(and(eq(importJobs.id, importJobId), eq(importJobs.organizationId, organizationId)))
    .limit(1);
  if (!job || job.status !== "PROCESSING") throw new Error("Import job is unavailable");
  const rows = (job.mapping as { rows?: ImportRow[] }).rows ?? [];
  let processedRows = 0;
  const runtimeErrors: (typeof importRowErrors.$inferInsert)[] = [];

  for (const [index, row] of rows.entries()) {
    try {
      if (job.kind === "SITE") {
        await db
          .insert(sites)
          .values({
            organizationId,
            createdBy: job.requestedBy,
            name: row.name!,
            reference: optional(row.reference),
            type: row.type!,
            status: normalizeStatus(row.status),
            address: optional(row.address),
            location: coordinates(row),
          })
          .onConflictDoNothing();
      } else if (job.kind === "ASSET") {
        const [site] = await db
          .select({ id: sites.id })
          .from(sites)
          .where(
            and(eq(sites.organizationId, organizationId), eq(sites.reference, row.siteReference!)),
          )
          .limit(1);
        const [type] = await db
          .select({ id: assetTypes.id })
          .from(assetTypes)
          .where(
            and(
              eq(assetTypes.name, row.assetType!),
              or(eq(assetTypes.organizationId, organizationId), isNull(assetTypes.organizationId)),
            ),
          )
          .limit(1);
        if (!site || !type) throw new Error("Site reference or asset type was not found");
        await db
          .insert(assets)
          .values({
            organizationId,
            siteId: site.id,
            assetTypeId: type.id,
            identifier: row.identifier!,
            name: row.name!,
            serialNumber: optional(row.serialNumber),
            manufacturer: optional(row.manufacturer),
            model: optional(row.model),
            status: normalizeStatus(row.status),
            condition: normalizeCondition(row.condition),
            location: coordinates(row),
          })
          .onConflictDoNothing();
      } else {
        throw new Error("Unsupported import kind");
      }
      processedRows += 1;
    } catch (error) {
      runtimeErrors.push({
        importJobId,
        rowNumber: index + 2,
        code: "PROCESSING_FAILED",
        message: error instanceof Error ? error.message : "Row processing failed",
        rowData: row,
      });
    }
  }

  if (runtimeErrors.length) await db.insert(importRowErrors).values(runtimeErrors);
  await db
    .update(importJobs)
    .set({
      status: runtimeErrors.length === rows.length && rows.length > 0 ? "FAILED" : "COMPLETED",
      processedRows,
      invalidRows: job.invalidRows + runtimeErrors.length,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(importJobs.id, importJobId));
}

function optional(value?: string) {
  return value?.trim() || undefined;
}

function coordinates(row: ImportRow) {
  const latitude = row.latitude ? Number(row.latitude) : undefined;
  const longitude = row.longitude ? Number(row.longitude) : undefined;
  if (latitude === undefined || longitude === undefined) return null;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Coordinates are invalid");
  }
  return sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`;
}

function normalizeStatus(value?: string): "DRAFT" | "ACTIVE" | "INACTIVE" {
  return value === "ACTIVE" || value === "INACTIVE" ? value : "DRAFT";
}

function normalizeCondition(value?: string): "UNKNOWN" | "GOOD" | "ATTENTION" | "CRITICAL" {
  return value === "GOOD" || value === "ATTENTION" || value === "CRITICAL" ? value : "UNKNOWN";
}
