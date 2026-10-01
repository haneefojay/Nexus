import { createHash } from "node:crypto";

import {
  activityEvents,
  and,
  assetTypes,
  assets,
  eq,
  ilike,
  importJobs,
  importRowErrors,
  isNull,
  or,
  sites,
  sql,
  type createDatabase,
} from "@nexus/database";
import { assertAssetTransition, assertSiteTransition } from "@nexus/domain";
import type {
  AssetCreateInput,
  AssetTypeCreateInput,
  AssetUpdateInput,
  SiteCreateInput,
  SiteUpdateInput,
} from "@nexus/validation";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Queue } from "bullmq";
import { parse } from "csv-parse/sync";

import type { TenantContext } from "../context/request-context.service.js";

@Injectable()
export class OperationsService {
  constructor(
    private readonly db: ReturnType<typeof createDatabase>["db"],
    private readonly importsQueue: Queue,
  ) {}

  listSites(context: TenantContext) {
    return this.db
      .select({
        id: sites.id,
        name: sites.name,
        reference: sites.reference,
        type: sites.type,
        status: sites.status,
        address: sites.address,
        latitude: sql<number | null>`ST_Y(${sites.location})`,
        longitude: sql<number | null>`ST_X(${sites.location})`,
        updatedAt: sites.updatedAt,
      })
      .from(sites)
      .where(
        and(eq(sites.organizationId, context.organizationId), sql`${sites.status} <> 'ARCHIVED'`),
      );
  }

  async createSite(context: TenantContext, input: SiteCreateInput) {
    try {
      const [created] = await this.db
        .insert(sites)
        .values({
          organizationId: context.organizationId,
          createdBy: context.userId,
          name: input.name,
          reference: input.reference,
          type: input.type,
          status: input.status,
          address: input.address,
          notes: input.notes,
          location: point(input.longitude, input.latitude),
        })
        .returning({ id: sites.id, name: sites.name, status: sites.status });
      await this.audit(context, "site.created", "site", created!.id, {});
      return created!;
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException("Site reference already exists");
      throw error;
    }
  }

  async updateSite(context: TenantContext, id: string, input: SiteUpdateInput) {
    const [existing] = await this.db
      .select()
      .from(sites)
      .where(and(eq(sites.id, id), eq(sites.organizationId, context.organizationId)))
      .limit(1);
    if (!existing) throw new NotFoundException("Site not found");
    if (input.status) assertSiteTransition(existing.status, input.status);
    const archivedAt = input.status === "ARCHIVED" ? new Date() : input.status ? null : undefined;
    const [updated] = await this.db
      .update(sites)
      .set({
        ...withoutCoordinates(input),
        ...(input.latitude !== undefined
          ? { location: point(input.longitude, input.latitude) }
          : {}),
        ...(archivedAt !== undefined ? { archivedAt } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(sites.id, id), eq(sites.organizationId, context.organizationId)))
      .returning({ id: sites.id, name: sites.name, status: sites.status });
    await this.audit(context, "site.updated", "site", id, { status: updated!.status });
    return updated!;
  }

  listAssetTypes(context: TenantContext) {
    return this.db
      .select({
        id: assetTypes.id,
        name: assetTypes.name,
        category: assetTypes.category,
        description: assetTypes.description,
      })
      .from(assetTypes)
      .where(
        and(
          eq(assetTypes.active, true),
          or(
            eq(assetTypes.organizationId, context.organizationId),
            isNull(assetTypes.organizationId),
          ),
        ),
      );
  }

  async createAssetType(context: TenantContext, input: AssetTypeCreateInput) {
    const [created] = await this.db
      .insert(assetTypes)
      .values({ organizationId: context.organizationId, ...input })
      .returning({ id: assetTypes.id, name: assetTypes.name, category: assetTypes.category });
    await this.audit(context, "asset_type.created", "asset_type", created!.id, {});
    return created!;
  }

  listAssets(context: TenantContext, query?: string) {
    const search = query?.trim();
    return this.db
      .select({
        id: assets.id,
        siteId: assets.siteId,
        assetTypeId: assets.assetTypeId,
        parentAssetId: assets.parentAssetId,
        identifier: assets.identifier,
        name: assets.name,
        serialNumber: assets.serialNumber,
        status: assets.status,
        condition: assets.condition,
        latitude: sql<number | null>`ST_Y(${assets.location})`,
        longitude: sql<number | null>`ST_X(${assets.location})`,
        updatedAt: assets.updatedAt,
      })
      .from(assets)
      .where(
        and(
          eq(assets.organizationId, context.organizationId),
          sql`${assets.status} <> 'ARCHIVED'`,
          search
            ? or(
                ilike(assets.name, `%${search}%`),
                ilike(assets.identifier, `%${search}%`),
                ilike(assets.serialNumber, `%${search}%`),
              )
            : undefined,
        ),
      )
      .limit(200);
  }

  async createAsset(context: TenantContext, input: AssetCreateInput) {
    await this.assertAssetScope(context.organizationId, input);
    try {
      const [created] = await this.db
        .insert(assets)
        .values({
          organizationId: context.organizationId,
          siteId: input.siteId,
          assetTypeId: input.assetTypeId,
          parentAssetId: input.parentAssetId,
          identifier: input.identifier,
          name: input.name,
          serialNumber: input.serialNumber,
          manufacturer: input.manufacturer,
          model: input.model,
          installationDate: input.installationDate,
          status: input.status,
          condition: input.condition,
          location: point(input.longitude, input.latitude),
          metadata: input.metadata,
        })
        .returning({
          id: assets.id,
          identifier: assets.identifier,
          name: assets.name,
          status: assets.status,
          condition: assets.condition,
        });
      await this.audit(context, "asset.created", "asset", created!.id, {});
      return created!;
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException("Asset identifier already exists");
      throw error;
    }
  }

  async updateAsset(context: TenantContext, id: string, input: AssetUpdateInput) {
    const [existing] = await this.db
      .select()
      .from(assets)
      .where(and(eq(assets.id, id), eq(assets.organizationId, context.organizationId)))
      .limit(1);
    if (!existing) throw new NotFoundException("Asset not found");
    if (input.status) assertAssetTransition(existing.status, input.status);
    await this.assertAssetScope(context.organizationId, {
      siteId: input.siteId ?? existing.siteId,
      assetTypeId: input.assetTypeId ?? existing.assetTypeId,
    });
    const archivedAt = input.status === "ARCHIVED" ? new Date() : input.status ? null : undefined;
    const [updated] = await this.db
      .update(assets)
      .set({
        ...withoutCoordinates(input),
        ...(input.latitude !== undefined
          ? { location: point(input.longitude, input.latitude) }
          : {}),
        ...(archivedAt !== undefined ? { archivedAt } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(assets.id, id), eq(assets.organizationId, context.organizationId)))
      .returning({
        id: assets.id,
        identifier: assets.identifier,
        name: assets.name,
        status: assets.status,
        condition: assets.condition,
      });
    await this.audit(context, "asset.updated", "asset", id, {
      status: updated!.status,
      condition: updated!.condition,
    });
    return updated!;
  }

  async map(
    context: TenantContext,
    viewport: { west: number; south: number; east: number; north: number },
  ) {
    const rows = await this.db.execute(sql`
      select id, identifier, name, status, condition,
             ST_X(location)::float8 as longitude, ST_Y(location)::float8 as latitude
      from assets
      where organization_id = ${context.organizationId}::uuid
        and status <> 'ARCHIVED' and location is not null
        and ST_Intersects(location, ST_MakeEnvelope(${viewport.west}, ${viewport.south}, ${viewport.east}, ${viewport.north}, 4326))
      limit 2000
    `);
    return {
      type: "FeatureCollection",
      features: rows.map((row: Record<string, unknown>) => ({
        type: "Feature",
        id: row.id,
        geometry: { type: "Point", coordinates: [row.longitude, row.latitude] },
        properties: {
          id: row.id,
          identifier: row.identifier,
          name: row.name,
          status: row.status,
          condition: row.condition,
        },
      })),
    };
  }

  async previewImport(context: TenantContext, kind: "SITE" | "ASSET", csv: string) {
    let rows: Record<string, string>[];
    try {
      rows = parse(csv, { columns: true, skip_empty_lines: true, trim: true });
    } catch {
      throw new BadRequestException("CSV could not be parsed");
    }
    if (rows.length > 5_000) throw new BadRequestException("Imports are limited to 5,000 rows");
    const issues = validateRows(kind, rows);
    const checksum = createHash("sha256").update(csv).digest("hex");
    const [job] = await this.db
      .insert(importJobs)
      .values({
        organizationId: context.organizationId,
        requestedBy: context.userId,
        kind,
        status: issues.length ? "VALIDATING" : "READY",
        sourceChecksum: checksum,
        mapping: { rows },
        totalRows: rows.length,
        validRows: rows.length - new Set(issues.map((issue) => issue.rowNumber)).size,
        invalidRows: new Set(issues.map((issue) => issue.rowNumber)).size,
      })
      .onConflictDoUpdate({
        target: [importJobs.organizationId, importJobs.sourceChecksum, importJobs.kind],
        set: { updatedAt: new Date() },
      })
      .returning({
        id: importJobs.id,
        status: importJobs.status,
        totalRows: importJobs.totalRows,
        validRows: importJobs.validRows,
        invalidRows: importJobs.invalidRows,
      });
    if (job && issues.length)
      await this.db
        .insert(importRowErrors)
        .values(issues.map((issue) => ({ importJobId: job.id, ...issue })));
    return { ...job!, errors: issues.slice(0, 100) };
  }

  async confirmImport(context: TenantContext, id: string) {
    const [job] = await this.db
      .update(importJobs)
      .set({ status: "PROCESSING", updatedAt: new Date() })
      .where(
        and(
          eq(importJobs.id, id),
          eq(importJobs.organizationId, context.organizationId),
          eq(importJobs.status, "READY"),
        ),
      )
      .returning({ id: importJobs.id, kind: importJobs.kind, status: importJobs.status });
    if (!job) throw new BadRequestException("Import is not ready");
    await this.importsQueue.add(
      "process-import",
      {
        correlationId: context.requestId,
        importJobId: job.id,
        organizationId: context.organizationId,
        requestedBy: context.userId,
      },
      { jobId: job.id },
    );
    return job;
  }

  private async assertAssetScope(
    organizationId: string,
    input: { siteId: string; assetTypeId: string },
  ) {
    const [site] = await this.db
      .select({ id: sites.id })
      .from(sites)
      .where(and(eq(sites.id, input.siteId), eq(sites.organizationId, organizationId)))
      .limit(1);
    const [type] = await this.db
      .select({ id: assetTypes.id })
      .from(assetTypes)
      .where(
        and(
          eq(assetTypes.id, input.assetTypeId),
          or(eq(assetTypes.organizationId, organizationId), isNull(assetTypes.organizationId)),
        ),
      )
      .limit(1);
    if (!site || !type)
      throw new BadRequestException("Site or asset type is outside the active organization");
  }

  private async audit(
    context: TenantContext,
    action: string,
    resourceType: string,
    resourceId: string,
    metadata: Record<string, unknown>,
  ) {
    await this.db.insert(activityEvents).values({
      organizationId: context.organizationId,
      actorUserId: context.userId,
      action,
      resourceType,
      resourceId,
      metadata,
    });
  }
}

function point(longitude?: number, latitude?: number) {
  return longitude === undefined || latitude === undefined
    ? null
    : sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`;
}
function withoutCoordinates<T extends Record<string, unknown>>(value: T) {
  const rest: Record<string, unknown> = { ...value };
  delete rest.latitude;
  delete rest.longitude;
  return rest;
}
function validateRows(kind: "SITE" | "ASSET", rows: Record<string, string>[]) {
  const required =
    kind === "SITE" ? ["name", "type"] : ["siteReference", "assetType", "identifier", "name"];
  return rows.flatMap((row, index) =>
    required
      .filter((field) => !row[field])
      .map((field) => ({
        rowNumber: index + 2,
        field,
        code: "REQUIRED",
        message: `${field} is required`,
        rowData: row,
      })),
  );
}
function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as { code?: unknown; cause?: { code?: unknown } };
  return candidate.code === "23505" || candidate.cause?.code === "23505";
}
