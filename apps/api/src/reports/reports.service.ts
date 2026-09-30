import { createHash } from "node:crypto";

import {
  activityEvents,
  and,
  asc,
  assets,
  correctiveActions,
  eq,
  evidence,
  inspectionFindings,
  inspectionPlans,
  inspectionResponses,
  inspectionRuns,
  inspectionTemplates,
  inspectionTemplateVersions,
  organizations,
  reportRequests,
  sites,
  storageObjects,
  users,
  type createDatabase,
} from "@nexus/database";
import {
  generateInspectionReportJobName,
  type GenerateInspectionReportJob,
} from "@nexus/contracts";
import { isInspectionReportable } from "@nexus/domain";
import type { StorageProvider } from "@nexus/storage";
import type { Queue } from "bullmq";
import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";

import type { TenantContext } from "../context/request-context.service.js";

type TemplateSchema = {
  sections?: { items?: { id: string; label: string; responseType: string }[] }[];
};

@Injectable()
export class ReportsService {
  constructor(
    private readonly db: ReturnType<typeof createDatabase>["db"],
    private readonly queue: Queue<GenerateInspectionReportJob>,
    private readonly storage: StorageProvider,
  ) {}

  async request(context: TenantContext, inspectionRunId: string, correlationId: string) {
    const snapshot = await this.createSnapshot(context, inspectionRunId);
    const snapshotHash = createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
    const [created] = await this.db
      .insert(reportRequests)
      .values({
        organizationId: context.organizationId,
        inspectionRunId,
        requestedBy: context.userId,
        snapshot,
        snapshotHash,
      })
      .onConflictDoNothing({
        target: [
          reportRequests.organizationId,
          reportRequests.inspectionRunId,
          reportRequests.snapshotHash,
        ],
      })
      .returning();
    const report =
      created ??
      (
        await this.db
          .select()
          .from(reportRequests)
          .where(
            and(
              eq(reportRequests.organizationId, context.organizationId),
              eq(reportRequests.inspectionRunId, inspectionRunId),
              eq(reportRequests.snapshotHash, snapshotHash),
            ),
          )
          .limit(1)
      )[0];
    if (!report) throw new ConflictException("Report request could not be recorded");
    if (created) {
      await this.db.insert(activityEvents).values({
        organizationId: context.organizationId,
        actorUserId: context.userId,
        action: "report.requested",
        resourceType: "report_request",
        resourceId: report.id,
        metadata: { inspectionRunId },
      });
      await this.enqueue(report.id, context.organizationId, correlationId, report.attemptCount);
    }
    return publicReport(report);
  }

  async list(context: TenantContext, inspectionRunId: string) {
    await this.assertVisibleRun(context, inspectionRunId);
    const rows = await this.db
      .select()
      .from(reportRequests)
      .where(
        and(
          eq(reportRequests.organizationId, context.organizationId),
          eq(reportRequests.inspectionRunId, inspectionRunId),
        ),
      )
      .orderBy(reportRequests.createdAt);
    return rows.map(publicReport);
  }

  async retry(context: TenantContext, id: string, correlationId: string) {
    const report = await this.requireReport(context, id);
    if (report.status !== "FAILED")
      throw new ConflictException("Only failed reports can be retried");
    const nextAttempt = report.attemptCount + 1;
    const [updated] = await this.db
      .update(reportRequests)
      .set({ status: "QUEUED", errorCode: null, attemptCount: nextAttempt, updatedAt: new Date() })
      .where(
        and(
          eq(reportRequests.id, id),
          eq(reportRequests.organizationId, context.organizationId),
          eq(reportRequests.status, "FAILED"),
        ),
      )
      .returning();
    if (!updated) throw new ConflictException("Report state changed");
    await this.enqueue(id, context.organizationId, correlationId, nextAttempt);
    return publicReport(updated);
  }

  async download(context: TenantContext, id: string) {
    const report = await this.requireReport(context, id);
    if (report.status === "COMPLETED" && report.expiresAt && report.expiresAt <= new Date()) {
      await this.db
        .update(reportRequests)
        .set({ status: "EXPIRED", updatedAt: new Date() })
        .where(and(eq(reportRequests.id, id), eq(reportRequests.status, "COMPLETED")));
      throw new ConflictException("The report has expired");
    }
    if (report.status !== "COMPLETED" || !report.objectKey)
      throw new ConflictException("The report is not ready for download");
    return {
      downloadUrl: await this.storage.createAuthorizedDownload(report.objectKey, 300),
      expiresAt: new Date(Date.now() + 300_000),
      filename: `nexus-inspection-${report.inspectionRunId}.pdf`,
      contentType: "application/pdf",
      checksum: report.checksum,
    };
  }

  private enqueue(id: string, organizationId: string, correlationId: string, attempt: number) {
    return this.queue.add(
      generateInspectionReportJobName,
      { reportRequestId: id, organizationId, correlationId },
      {
        jobId: `report-${id}-${attempt}`,
        attempts: 5,
        backoff: { type: "exponential", delay: 1_000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    );
  }

  private async requireReport(context: TenantContext, id: string) {
    const [report] = await this.db
      .select()
      .from(reportRequests)
      .where(
        and(eq(reportRequests.id, id), eq(reportRequests.organizationId, context.organizationId)),
      )
      .limit(1);
    if (!report) throw new NotFoundException("Report not found");
    await this.assertVisibleRun(context, report.inspectionRunId);
    return report;
  }

  private async assertVisibleRun(context: TenantContext, id: string) {
    const [run] = await this.db
      .select({ assignedTo: inspectionRuns.assignedTo })
      .from(inspectionRuns)
      .where(
        and(eq(inspectionRuns.id, id), eq(inspectionRuns.organizationId, context.organizationId)),
      )
      .limit(1);
    if (!run || (context.role === "TECHNICIAN" && run.assignedTo !== context.userId))
      throw new NotFoundException("Inspection run not found");
  }

  private async createSnapshot(context: TenantContext, id: string) {
    const [base] = await this.db
      .select({
        run: inspectionRuns,
        organizationName: organizations.name,
        organizationTimezone: organizations.timezone,
        siteName: sites.name,
        siteReference: sites.reference,
        siteAddress: sites.address,
        assetName: assets.name,
        assetIdentifier: assets.identifier,
        planName: inspectionPlans.name,
        templateVersion: inspectionTemplateVersions.versionNumber,
        templateSchema: inspectionTemplateVersions.schema,
        inspectorName: users.name,
      })
      .from(inspectionRuns)
      .innerJoin(organizations, eq(organizations.id, inspectionRuns.organizationId))
      .innerJoin(
        sites,
        and(
          eq(sites.id, inspectionRuns.siteId),
          eq(sites.organizationId, inspectionRuns.organizationId),
        ),
      )
      .leftJoin(
        assets,
        and(
          eq(assets.id, inspectionRuns.assetId),
          eq(assets.organizationId, inspectionRuns.organizationId),
        ),
      )
      .innerJoin(
        inspectionPlans,
        and(
          eq(inspectionPlans.id, inspectionRuns.inspectionPlanId),
          eq(inspectionPlans.organizationId, inspectionRuns.organizationId),
        ),
      )
      .innerJoin(
        inspectionTemplateVersions,
        and(
          eq(inspectionTemplateVersions.id, inspectionRuns.templateVersionId),
          eq(inspectionTemplateVersions.organizationId, inspectionRuns.organizationId),
        ),
      )
      .innerJoin(
        inspectionTemplates,
        and(
          eq(inspectionTemplates.id, inspectionTemplateVersions.templateId),
          eq(inspectionTemplates.organizationId, inspectionRuns.organizationId),
        ),
      )
      .innerJoin(users, eq(users.id, inspectionRuns.assignedTo))
      .where(
        and(eq(inspectionRuns.id, id), eq(inspectionRuns.organizationId, context.organizationId)),
      )
      .limit(1);
    if (!base || (context.role === "TECHNICIAN" && base.run.assignedTo !== context.userId))
      throw new NotFoundException("Inspection run not found");
    if (!isInspectionReportable(base.run.status))
      throw new ConflictException("Only submitted inspections can be reported");

    const responses = await this.db
      .select()
      .from(inspectionResponses)
      .where(
        and(
          eq(inspectionResponses.organizationId, context.organizationId),
          eq(inspectionResponses.inspectionRunId, id),
        ),
      )
      .orderBy(asc(inspectionResponses.itemId));
    const findings = await this.db
      .select()
      .from(inspectionFindings)
      .where(
        and(
          eq(inspectionFindings.organizationId, context.organizationId),
          eq(inspectionFindings.inspectionRunId, id),
        ),
      )
      .orderBy(asc(inspectionFindings.createdAt));
    const actions = findings.length
      ? await this.db
          .select()
          .from(correctiveActions)
          .where(and(eq(correctiveActions.organizationId, context.organizationId)))
          .orderBy(asc(correctiveActions.createdAt))
      : [];
    const evidenceRows = await this.db
      .select({
        targetType: evidence.targetType,
        targetId: evidence.targetId,
        capturedAt: evidence.capturedAt,
        contentType: storageObjects.contentType,
      })
      .from(evidence)
      .innerJoin(
        storageObjects,
        and(
          eq(storageObjects.id, evidence.storageObjectId),
          eq(storageObjects.organizationId, evidence.organizationId),
        ),
      )
      .where(and(eq(evidence.organizationId, context.organizationId)));
    const relevantTargets = new Set([
      id,
      ...findings.map((finding) => finding.id),
      ...actions
        .filter((action) => findings.some((finding) => finding.id === action.findingId))
        .map((action) => action.id),
    ]);
    const itemDefinitions = ((base.templateSchema as TemplateSchema).sections ?? []).flatMap(
      (section) => section.items ?? [],
    );
    return {
      generatedFrom: "immutable-submission",
      organization: { name: base.organizationName, timezone: base.organizationTimezone },
      site: { name: base.siteName, reference: base.siteReference, address: base.siteAddress },
      asset:
        base.run.assetId && base.assetName && base.assetIdentifier
          ? { name: base.assetName, identifier: base.assetIdentifier }
          : null,
      inspection: {
        id: base.run.id,
        name: base.planName,
        status: base.run.status,
        templateVersion: base.templateVersion,
        scheduledFor: base.run.scheduledFor.toISOString(),
        startedAt: base.run.startedAt?.toISOString() ?? null,
        submittedAt: base.run.submittedAt?.toISOString() ?? null,
        approvedAt: base.run.approvedAt?.toISOString() ?? null,
        closedAt: base.run.closedAt?.toISOString() ?? null,
        inspector: base.inspectorName,
        notes: base.run.notes,
      },
      checklist: responses.map((response) => {
        const item = itemDefinitions.find((candidate) => candidate.id === response.itemId);
        return {
          label: item?.label ?? response.itemId,
          responseType: item?.responseType ?? "UNKNOWN",
          value: response.value,
          capturedAt: response.capturedAt.toISOString(),
        };
      }),
      findings: findings.map((finding) => ({
        title: finding.title,
        severity: finding.severity,
        status: finding.status,
        detectedAt: finding.detectedAt.toISOString(),
        actions: actions
          .filter((action) => action.findingId === finding.id)
          .map((action) => ({
            title: action.title,
            status: action.status,
            dueAt: action.dueAt.toISOString(),
            verifiedAt: action.verifiedAt?.toISOString() ?? null,
          })),
      })),
      evidence: evidenceRows
        .filter((row) => relevantTargets.has(row.targetId))
        .map((row) => ({
          targetType: row.targetType,
          capturedAt: row.capturedAt?.toISOString() ?? null,
          contentType: row.contentType,
        })),
    };
  }
}

function publicReport(report: typeof reportRequests.$inferSelect) {
  return {
    id: report.id,
    inspectionRunId: report.inspectionRunId,
    status: report.status,
    errorCode: report.errorCode,
    attemptCount: report.attemptCount,
    createdAt: report.createdAt,
    completedAt: report.completedAt,
    expiresAt: report.expiresAt,
  };
}
