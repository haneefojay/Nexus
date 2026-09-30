import { createHash } from "node:crypto";

import {
  activityEvents,
  and,
  asc,
  assets,
  assetTypes,
  eq,
  exportRequests,
  inspectionFindings,
  inspectionPlans,
  inspectionRuns,
  sites,
  users,
  type createDatabase,
} from "@nexus/database";
import {
  generateOperationalExportJobName,
  type GenerateOperationalExportJob,
} from "@nexus/contracts";
import type { StorageProvider } from "@nexus/storage";
import type { Queue } from "bullmq";
import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";

import type { TenantContext } from "../context/request-context.service.js";

export type ExportType = "ASSETS" | "FINDINGS" | "INSPECTIONS";
type Cell = string | number | boolean | null;
type Snapshot = { columns: string[]; rows: Cell[][] };

@Injectable()
export class ExportsService {
  constructor(
    private readonly db: ReturnType<typeof createDatabase>["db"],
    private readonly queue: Queue<GenerateOperationalExportJob>,
    private readonly storage: StorageProvider,
  ) {}

  async request(context: TenantContext, exportType: ExportType, correlationId: string) {
    const snapshot = await this.snapshot(context.organizationId, exportType);
    const snapshotHash = createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
    const [created] = await this.db
      .insert(exportRequests)
      .values({
        organizationId: context.organizationId,
        exportType,
        requestedBy: context.userId,
        snapshot,
        snapshotHash,
        rowCount: snapshot.rows.length,
      })
      .onConflictDoNothing({
        target: [
          exportRequests.organizationId,
          exportRequests.exportType,
          exportRequests.requestedBy,
          exportRequests.snapshotHash,
        ],
      })
      .returning();
    const record =
      created ??
      (
        await this.db
          .select()
          .from(exportRequests)
          .where(
            and(
              eq(exportRequests.organizationId, context.organizationId),
              eq(exportRequests.exportType, exportType),
              eq(exportRequests.requestedBy, context.userId),
              eq(exportRequests.snapshotHash, snapshotHash),
            ),
          )
          .limit(1)
      )[0];
    if (!record) throw new ConflictException("Export request could not be recorded");
    if (created) {
      await this.db.insert(activityEvents).values({
        organizationId: context.organizationId,
        actorUserId: context.userId,
        action: "export.requested",
        resourceType: "export_request",
        resourceId: record.id,
        metadata: { exportType, rowCount: snapshot.rows.length },
      });
      await this.enqueue(record.id, context.organizationId, correlationId, record.attemptCount);
    }
    return publicExport(record);
  }

  async list(context: TenantContext) {
    const rows = await this.db
      .select()
      .from(exportRequests)
      .where(
        and(
          eq(exportRequests.organizationId, context.organizationId),
          ["TECHNICIAN", "VIEWER"].includes(context.role)
            ? eq(exportRequests.requestedBy, context.userId)
            : undefined,
        ),
      )
      .orderBy(exportRequests.createdAt);
    return rows.map(publicExport);
  }

  async retry(context: TenantContext, id: string, correlationId: string) {
    const record = await this.requireExport(context, id);
    if (record.status !== "FAILED")
      throw new ConflictException("Only failed exports can be retried");
    const attemptCount = record.attemptCount + 1;
    const [updated] = await this.db
      .update(exportRequests)
      .set({ status: "QUEUED", errorCode: null, attemptCount, updatedAt: new Date() })
      .where(
        and(
          eq(exportRequests.id, id),
          eq(exportRequests.organizationId, context.organizationId),
          eq(exportRequests.status, "FAILED"),
        ),
      )
      .returning();
    if (!updated) throw new ConflictException("Export state changed");
    await this.enqueue(id, context.organizationId, correlationId, attemptCount);
    return publicExport(updated);
  }

  async download(context: TenantContext, id: string) {
    const record = await this.requireExport(context, id);
    if (record.status === "COMPLETED" && record.expiresAt && record.expiresAt <= new Date()) {
      await this.db
        .update(exportRequests)
        .set({ status: "EXPIRED", updatedAt: new Date() })
        .where(and(eq(exportRequests.id, id), eq(exportRequests.status, "COMPLETED")));
      throw new ConflictException("The export has expired");
    }
    if (record.status !== "COMPLETED" || !record.objectKey)
      throw new ConflictException("The export is not ready for download");
    return {
      downloadUrl: await this.storage.createAuthorizedDownload(record.objectKey, 300),
      expiresAt: new Date(Date.now() + 300_000),
      filename: `nexus-${record.exportType.toLowerCase()}-${record.id}.csv`,
      contentType: "text/csv",
      checksum: record.checksum,
    };
  }

  private enqueue(id: string, organizationId: string, correlationId: string, attempt: number) {
    return this.queue.add(
      generateOperationalExportJobName,
      { exportRequestId: id, organizationId, correlationId },
      {
        jobId: `export-${id}-${attempt}`,
        attempts: 5,
        backoff: { type: "exponential", delay: 1_000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    );
  }

  private async requireExport(context: TenantContext, id: string) {
    const [record] = await this.db
      .select()
      .from(exportRequests)
      .where(
        and(
          eq(exportRequests.id, id),
          eq(exportRequests.organizationId, context.organizationId),
          ["TECHNICIAN", "VIEWER"].includes(context.role)
            ? eq(exportRequests.requestedBy, context.userId)
            : undefined,
        ),
      )
      .limit(1);
    if (!record) throw new NotFoundException("Export not found");
    return record;
  }

  private async snapshot(organizationId: string, type: ExportType): Promise<Snapshot> {
    const siteRows = await this.db
      .select({ id: sites.id, name: sites.name, reference: sites.reference })
      .from(sites)
      .where(eq(sites.organizationId, organizationId));
    const siteMap = new Map(siteRows.map((site) => [site.id, site]));
    const assetRows = await this.db
      .select()
      .from(assets)
      .where(eq(assets.organizationId, organizationId))
      .orderBy(asc(assets.identifier));
    const assetMap = new Map(assetRows.map((asset) => [asset.id, asset]));
    if (type === "ASSETS") {
      const types = await this.db
        .select({ id: assetTypes.id, name: assetTypes.name })
        .from(assetTypes)
        .where(eq(assetTypes.organizationId, organizationId));
      const typeMap = new Map(types.map((assetType) => [assetType.id, assetType.name]));
      return {
        columns: [
          "identifier",
          "name",
          "site_reference",
          "site_name",
          "asset_type",
          "status",
          "condition",
          "installation_date",
          "created_at_utc",
        ],
        rows: assetRows.map((asset) => {
          const site = siteMap.get(asset.siteId);
          return [
            asset.identifier,
            asset.name,
            site?.reference ?? null,
            site?.name ?? "",
            typeMap.get(asset.assetTypeId) ?? "",
            asset.status,
            asset.condition,
            asset.installationDate ?? null,
            asset.createdAt.toISOString(),
          ];
        }),
      };
    }
    if (type === "FINDINGS") {
      const rows = await this.db
        .select()
        .from(inspectionFindings)
        .where(eq(inspectionFindings.organizationId, organizationId))
        .orderBy(asc(inspectionFindings.detectedAt));
      return {
        columns: [
          "finding_id",
          "title",
          "severity",
          "status",
          "site",
          "asset_identifier",
          "detected_at_utc",
          "verified_at_utc",
          "closed_at_utc",
        ],
        rows: rows.map((finding) => [
          finding.id,
          finding.title,
          finding.severity,
          finding.status,
          siteMap.get(finding.siteId)?.name ?? "",
          finding.assetId ? (assetMap.get(finding.assetId)?.identifier ?? "") : null,
          finding.detectedAt.toISOString(),
          finding.verifiedAt?.toISOString() ?? null,
          finding.closedAt?.toISOString() ?? null,
        ]),
      };
    }
    const plans = await this.db
      .select({ id: inspectionPlans.id, name: inspectionPlans.name })
      .from(inspectionPlans)
      .where(eq(inspectionPlans.organizationId, organizationId));
    const planMap = new Map(plans.map((plan) => [plan.id, plan.name]));
    const userRows = await this.db.select({ id: users.id, name: users.name }).from(users);
    const userMap = new Map(userRows.map((user) => [user.id, user.name]));
    const runs = await this.db
      .select()
      .from(inspectionRuns)
      .where(eq(inspectionRuns.organizationId, organizationId))
      .orderBy(asc(inspectionRuns.scheduledFor));
    return {
      columns: [
        "inspection_run_id",
        "plan",
        "site",
        "asset_identifier",
        "status",
        "inspector",
        "scheduled_for_utc",
        "due_at_utc",
        "started_at_utc",
        "submitted_at_utc",
        "approved_at_utc",
        "closed_at_utc",
      ],
      rows: runs.map((run) => [
        run.id,
        planMap.get(run.inspectionPlanId) ?? "",
        siteMap.get(run.siteId)?.name ?? "",
        run.assetId ? (assetMap.get(run.assetId)?.identifier ?? "") : null,
        run.status,
        userMap.get(run.assignedTo) ?? "",
        run.scheduledFor.toISOString(),
        run.dueAt.toISOString(),
        run.startedAt?.toISOString() ?? null,
        run.submittedAt?.toISOString() ?? null,
        run.approvedAt?.toISOString() ?? null,
        run.closedAt?.toISOString() ?? null,
      ]),
    };
  }
}

function publicExport(record: typeof exportRequests.$inferSelect) {
  return {
    id: record.id,
    exportType: record.exportType,
    status: record.status,
    rowCount: record.rowCount,
    errorCode: record.errorCode,
    attemptCount: record.attemptCount,
    createdAt: record.createdAt,
    completedAt: record.completedAt,
    expiresAt: record.expiresAt,
  };
}
