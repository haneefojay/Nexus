import { createHash } from "node:crypto";

import {
  activityEvents,
  and,
  assets,
  eq,
  findingTransitions,
  inspectionFindings,
  inspectionPlans,
  inspectionResponses,
  inspectionRuns,
  inspectionTemplates,
  inspectionTemplateVersions,
  memberships,
  sites,
  sql,
  type createDatabase,
} from "@nexus/database";
import {
  assertInspectionRunTransition,
  assertValidInspectionResponses,
  validateInspectionResponses,
  type InspectionTemplateItemDefinition,
} from "@nexus/domain";
import type {
  InspectionFindingCreateInput,
  InspectionPlanCreateInput,
  InspectionPlanUpdateInput,
  InspectionResponsesInput,
  InspectionTemplateCreateInput,
  InspectionTemplateSchema,
  InspectionTemplateUpdateInput,
} from "@nexus/validation";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Queue } from "bullmq";

import type { TenantContext } from "../context/request-context.service.js";

@Injectable()
export class InspectionsService {
  constructor(
    private readonly db: ReturnType<typeof createDatabase>["db"],
    private readonly queue: Queue,
  ) {}

  listTemplates(context: TenantContext) {
    return this.db
      .select({
        id: inspectionTemplates.id,
        name: inspectionTemplates.name,
        description: inspectionTemplates.description,
        category: inspectionTemplates.category,
        status: inspectionTemplates.status,
        latestVersion: inspectionTemplates.latestVersion,
        updatedAt: inspectionTemplates.updatedAt,
      })
      .from(inspectionTemplates)
      .where(
        and(
          eq(inspectionTemplates.organizationId, context.organizationId),
          sql`${inspectionTemplates.status} <> 'ARCHIVED'`,
        ),
      )
      .orderBy(inspectionTemplates.name);
  }

  async getTemplate(context: TenantContext, id: string) {
    const [template] = await this.db
      .select()
      .from(inspectionTemplates)
      .where(
        and(
          eq(inspectionTemplates.id, id),
          eq(inspectionTemplates.organizationId, context.organizationId),
        ),
      )
      .limit(1);
    if (!template) throw new NotFoundException("Inspection template not found");
    const versions = await this.db
      .select({
        id: inspectionTemplateVersions.id,
        versionNumber: inspectionTemplateVersions.versionNumber,
        publishedAt: inspectionTemplateVersions.publishedAt,
        checksum: inspectionTemplateVersions.checksum,
      })
      .from(inspectionTemplateVersions)
      .where(
        and(
          eq(inspectionTemplateVersions.templateId, id),
          eq(inspectionTemplateVersions.organizationId, context.organizationId),
        ),
      )
      .orderBy(sql`${inspectionTemplateVersions.versionNumber} desc`);
    return { ...template, versions };
  }

  async createTemplate(context: TenantContext, input: InspectionTemplateCreateInput) {
    try {
      const [created] = await this.db
        .insert(inspectionTemplates)
        .values({
          organizationId: context.organizationId,
          createdBy: context.userId,
          name: input.name,
          description: input.description,
          category: input.category,
          draftSchema: input.schema,
        })
        .returning();
      await this.audit(context, "inspection_template.created", "inspection_template", created!.id, {
        name: created!.name,
      });
      return created!;
    } catch (error) {
      if (isUniqueViolation(error))
        throw new ConflictException("An active inspection template already uses this name");
      throw error;
    }
  }

  async updateTemplate(context: TenantContext, id: string, input: InspectionTemplateUpdateInput) {
    const [updated] = await this.db
      .update(inspectionTemplates)
      .set({
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.schema !== undefined ? { draftSchema: input.schema } : {}),
        status: "DRAFT",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(inspectionTemplates.id, id),
          eq(inspectionTemplates.organizationId, context.organizationId),
          sql`${inspectionTemplates.status} <> 'ARCHIVED'`,
        ),
      )
      .returning();
    if (!updated) throw new NotFoundException("Inspection template not found");
    await this.audit(context, "inspection_template.updated", "inspection_template", id, {});
    return updated;
  }

  async publishTemplate(context: TenantContext, id: string) {
    return this.db.transaction(async (transaction) => {
      const [template] = await transaction
        .select()
        .from(inspectionTemplates)
        .where(
          and(
            eq(inspectionTemplates.id, id),
            eq(inspectionTemplates.organizationId, context.organizationId),
            sql`${inspectionTemplates.status} <> 'ARCHIVED'`,
          ),
        )
        .for("update")
        .limit(1);
      if (!template) throw new NotFoundException("Inspection template not found");
      const schema = template.draftSchema as InspectionTemplateSchema;
      if (!schema.sections.length) throw new BadRequestException("Template must contain sections");
      const versionNumber = template.latestVersion + 1;
      const checksum = createHash("sha256").update(JSON.stringify(schema)).digest("hex");
      const [version] = await transaction
        .insert(inspectionTemplateVersions)
        .values({
          organizationId: context.organizationId,
          templateId: id,
          versionNumber,
          schema,
          checksum,
          createdBy: context.userId,
        })
        .returning();
      await transaction
        .update(inspectionTemplates)
        .set({ latestVersion: versionNumber, status: "PUBLISHED", updatedAt: new Date() })
        .where(eq(inspectionTemplates.id, id));
      await transaction.insert(activityEvents).values({
        organizationId: context.organizationId,
        actorUserId: context.userId,
        action: "inspection_template.published",
        resourceType: "inspection_template",
        resourceId: id,
        metadata: { versionId: version!.id, versionNumber, checksum },
      });
      return version!;
    });
  }

  listPlans(context: TenantContext) {
    return this.db
      .select({
        id: inspectionPlans.id,
        name: inspectionPlans.name,
        templateVersionId: inspectionPlans.templateVersionId,
        targetType: inspectionPlans.targetType,
        siteId: inspectionPlans.siteId,
        assetId: inspectionPlans.assetId,
        recurrenceType: inspectionPlans.recurrenceType,
        intervalDays: inspectionPlans.intervalDays,
        assignedUserId: inspectionPlans.assignedUserId,
        assignedRole: inspectionPlans.assignedRole,
        requiresReview: inspectionPlans.requiresReview,
        active: inspectionPlans.active,
        nextDueAt: inspectionPlans.nextDueAt,
      })
      .from(inspectionPlans)
      .where(eq(inspectionPlans.organizationId, context.organizationId))
      .orderBy(inspectionPlans.nextDueAt);
  }

  async createPlan(context: TenantContext, input: InspectionPlanCreateInput) {
    await this.assertPlanScope(context.organizationId, input);
    const startsAt = new Date(input.startsAt);
    const [created] = await this.db
      .insert(inspectionPlans)
      .values({
        organizationId: context.organizationId,
        templateVersionId: input.templateVersionId,
        name: input.name,
        targetType: input.targetType,
        siteId: input.siteId,
        assetId: input.assetId,
        recurrenceType: input.recurrence.type,
        intervalDays: input.recurrence.intervalDays,
        startsAt,
        endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
        assignedUserId: input.assignedUserId,
        assignedRole: input.assignedRole,
        dueWindowMinutes: input.dueWindowMinutes,
        requiresReview: input.requiresReview,
        nextDueAt: startsAt,
        createdBy: context.userId,
      })
      .returning();
    await this.audit(context, "inspection_plan.created", "inspection_plan", created!.id, {
      templateVersionId: input.templateVersionId,
      targetType: input.targetType,
    });
    await this.enqueueGeneration(created!.id, context.requestId);
    return created!;
  }

  async updatePlan(context: TenantContext, id: string, input: InspectionPlanUpdateInput) {
    if (input.assignedUserId)
      await this.assertEligibleUser(context.organizationId, input.assignedUserId);
    const [updated] = await this.db
      .update(inspectionPlans)
      .set({ ...input, updatedAt: new Date() })
      .where(
        and(eq(inspectionPlans.id, id), eq(inspectionPlans.organizationId, context.organizationId)),
      )
      .returning();
    if (!updated) throw new NotFoundException("Inspection plan not found");
    if (!updated.assignedUserId && !updated.assignedRole)
      throw new BadRequestException("An assigned user or role is required");
    await this.audit(context, "inspection_plan.updated", "inspection_plan", id, {});
    return updated;
  }

  async setPlanActive(context: TenantContext, id: string, active: boolean) {
    const [updated] = await this.db
      .update(inspectionPlans)
      .set({ active, updatedAt: new Date() })
      .where(
        and(eq(inspectionPlans.id, id), eq(inspectionPlans.organizationId, context.organizationId)),
      )
      .returning({ id: inspectionPlans.id, active: inspectionPlans.active });
    if (!updated) throw new NotFoundException("Inspection plan not found");
    await this.audit(
      context,
      active ? "inspection_plan.resumed" : "inspection_plan.paused",
      "inspection_plan",
      id,
      {},
    );
    if (active) await this.enqueueGeneration(id, context.requestId);
    return updated;
  }

  listRuns(context: TenantContext, scope?: "upcoming" | "due" | "overdue") {
    const now = new Date();
    return this.db
      .select({
        id: inspectionRuns.id,
        planId: inspectionRuns.inspectionPlanId,
        siteId: inspectionRuns.siteId,
        assetId: inspectionRuns.assetId,
        assignedTo: inspectionRuns.assignedTo,
        status: inspectionRuns.status,
        scheduledFor: inspectionRuns.scheduledFor,
        dueAt: inspectionRuns.dueAt,
        overdue: sql<boolean>`${inspectionRuns.dueAt} < now() and ${inspectionRuns.status} in ('ASSIGNED','READY','IN_PROGRESS')`,
      })
      .from(inspectionRuns)
      .where(
        and(
          eq(inspectionRuns.organizationId, context.organizationId),
          context.role === "TECHNICIAN" ? eq(inspectionRuns.assignedTo, context.userId) : undefined,
          scope === "upcoming" ? sql`${inspectionRuns.scheduledFor} > ${now}` : undefined,
          scope === "due"
            ? sql`${inspectionRuns.scheduledFor} <= ${now} and ${inspectionRuns.dueAt} >= ${now}`
            : undefined,
          scope === "overdue"
            ? sql`${inspectionRuns.dueAt} < ${now} and ${inspectionRuns.status} in ('ASSIGNED','READY','IN_PROGRESS')`
            : undefined,
        ),
      )
      .orderBy(inspectionRuns.dueAt)
      .limit(200);
  }

  async getRun(context: TenantContext, id: string) {
    const [run] = await this.db
      .select()
      .from(inspectionRuns)
      .where(
        and(eq(inspectionRuns.id, id), eq(inspectionRuns.organizationId, context.organizationId)),
      )
      .limit(1);
    if (!run) throw new NotFoundException("Inspection run not found");
    this.assertRunVisible(context, run.assignedTo);
    const [version] = await this.db
      .select({ schema: inspectionTemplateVersions.schema })
      .from(inspectionTemplateVersions)
      .where(
        and(
          eq(inspectionTemplateVersions.id, run.templateVersionId),
          eq(inspectionTemplateVersions.organizationId, context.organizationId),
        ),
      );
    const responses = await this.db
      .select()
      .from(inspectionResponses)
      .where(
        and(
          eq(inspectionResponses.inspectionRunId, id),
          eq(inspectionResponses.organizationId, context.organizationId),
        ),
      );
    const findings = await this.db
      .select()
      .from(inspectionFindings)
      .where(
        and(
          eq(inspectionFindings.inspectionRunId, id),
          eq(inspectionFindings.organizationId, context.organizationId),
        ),
      );
    return { ...run, template: version!.schema, responses, findings };
  }

  async startRun(context: TenantContext, id: string) {
    const run = await this.requireExecutableRun(context, id);
    assertInspectionRunTransition(run.status, "IN_PROGRESS", false);
    const [updated] = await this.db
      .update(inspectionRuns)
      .set({ status: "IN_PROGRESS", startedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(inspectionRuns.id, id),
          eq(inspectionRuns.organizationId, context.organizationId),
          sql`${inspectionRuns.status} in ('ASSIGNED','READY')`,
        ),
      )
      .returning();
    if (!updated) throw new ConflictException("Inspection run state changed");
    await this.audit(context, "inspection.started", "inspection_run", id, {});
    return updated;
  }

  async saveResponses(context: TenantContext, id: string, input: InspectionResponsesInput) {
    const run = await this.requireExecutableRun(context, id);
    if (run.status !== "IN_PROGRESS")
      throw new ConflictException("Responses can only be saved while an inspection is in progress");
    const items = await this.templateItems(context.organizationId, run.templateVersionId);
    const optionalItems = items.map((item) => ({ ...item, required: false }));
    const issues = validateInspectionResponses(optionalItems, input.responses);
    if (issues.length)
      throw new BadRequestException({ code: "INVALID_RESPONSES", details: issues });
    await this.db.transaction(async (transaction) => {
      for (const response of input.responses) {
        const item = items.find((candidate) => candidate.id === response.itemId)!;
        await transaction
          .insert(inspectionResponses)
          .values({
            organizationId: context.organizationId,
            inspectionRunId: id,
            itemId: response.itemId,
            value: response.value,
            numericValue: typeof response.value === "number" ? response.value : null,
            textValue: typeof response.value === "string" ? response.value : null,
            selectedOption: item.responseType === "SINGLE_CHOICE" ? String(response.value) : null,
            capturedBy: context.userId,
            evidenceRequired: false,
          })
          .onConflictDoUpdate({
            target: [inspectionResponses.inspectionRunId, inspectionResponses.itemId],
            set: {
              value: response.value,
              numericValue: typeof response.value === "number" ? response.value : null,
              textValue: typeof response.value === "string" ? response.value : null,
              selectedOption: item.responseType === "SINGLE_CHOICE" ? String(response.value) : null,
              capturedAt: new Date(),
              capturedBy: context.userId,
            },
          });
      }
      if (input.notes !== undefined)
        await transaction
          .update(inspectionRuns)
          .set({ notes: input.notes, updatedAt: new Date() })
          .where(eq(inspectionRuns.id, id));
    });
    return this.getRun(context, id);
  }

  async createFinding(context: TenantContext, id: string, input: InspectionFindingCreateInput) {
    const run = await this.requireExecutableRun(context, id);
    if (run.status !== "IN_PROGRESS")
      throw new ConflictException(
        "Findings can only be entered while an inspection is in progress",
      );
    return this.db.transaction(async (transaction) => {
      const [created] = await transaction
        .insert(inspectionFindings)
        .values({
          organizationId: context.organizationId,
          inspectionRunId: id,
          siteId: run.siteId,
          assetId: run.assetId,
          createdBy: context.userId,
          ...input,
        })
        .returning();
      await transaction.insert(findingTransitions).values({
        organizationId: context.organizationId,
        findingId: created!.id,
        toStatus: "OPEN",
        actorUserId: context.userId,
      });
      await transaction.insert(activityEvents).values({
        organizationId: context.organizationId,
        actorUserId: context.userId,
        action: "finding.created",
        resourceType: "inspection_finding",
        resourceId: created!.id,
        metadata: { inspectionRunId: id, severity: input.severity },
      });
      return created!;
    });
  }

  async submitRun(context: TenantContext, id: string) {
    const run = await this.requireExecutableRun(context, id);
    if (run.status !== "IN_PROGRESS")
      throw new ConflictException("Only an in-progress inspection can be submitted");
    const items = await this.templateItems(context.organizationId, run.templateVersionId);
    const responses = await this.db
      .select({ itemId: inspectionResponses.itemId, value: inspectionResponses.value })
      .from(inspectionResponses)
      .where(
        and(
          eq(inspectionResponses.inspectionRunId, id),
          eq(inspectionResponses.organizationId, context.organizationId),
        ),
      );
    try {
      assertValidInspectionResponses(items, responses);
    } catch {
      throw new BadRequestException({
        code: "INSPECTION_RESPONSES_INVALID",
        details: validateInspectionResponses(items, responses),
      });
    }
    return this.db.transaction(async (transaction) => {
      assertInspectionRunTransition("IN_PROGRESS", "SUBMITTED", run.requiresReview);
      await transaction
        .update(inspectionRuns)
        .set({ status: "SUBMITTED", submittedAt: new Date(), updatedAt: new Date() })
        .where(
          and(
            eq(inspectionRuns.id, id),
            eq(inspectionRuns.organizationId, context.organizationId),
            eq(inspectionRuns.status, "IN_PROGRESS"),
          ),
        );
      const finalStatus = run.requiresReview ? "REVIEW_REQUIRED" : "CLOSED";
      assertInspectionRunTransition("SUBMITTED", finalStatus, run.requiresReview);
      const [updated] = await transaction
        .update(inspectionRuns)
        .set({
          status: finalStatus,
          ...(finalStatus === "CLOSED" ? { closedAt: new Date() } : {}),
          updatedAt: new Date(),
        })
        .where(eq(inspectionRuns.id, id))
        .returning();
      await transaction.insert(activityEvents).values({
        organizationId: context.organizationId,
        actorUserId: context.userId,
        action: "inspection.submitted",
        resourceType: "inspection_run",
        resourceId: id,
        metadata: { finalStatus },
      });
      return updated!;
    });
  }

  async reviewRun(context: TenantContext, id: string) {
    const [run] = await this.db
      .select({
        status: inspectionRuns.status,
        planId: inspectionRuns.inspectionPlanId,
      })
      .from(inspectionRuns)
      .where(
        and(eq(inspectionRuns.id, id), eq(inspectionRuns.organizationId, context.organizationId)),
      );
    if (!run) throw new NotFoundException("Inspection run not found");
    const [plan] = await this.db
      .select({ requiresReview: inspectionPlans.requiresReview })
      .from(inspectionPlans)
      .where(eq(inspectionPlans.id, run.planId));
    assertInspectionRunTransition(run.status, "APPROVED", plan!.requiresReview);
    return this.db.transaction(async (transaction) => {
      await transaction
        .update(inspectionRuns)
        .set({ status: "APPROVED", approvedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(inspectionRuns.id, id), eq(inspectionRuns.status, "REVIEW_REQUIRED")));
      assertInspectionRunTransition("APPROVED", "CLOSED", true);
      const [updated] = await transaction
        .update(inspectionRuns)
        .set({ status: "CLOSED", closedAt: new Date(), updatedAt: new Date() })
        .where(eq(inspectionRuns.id, id))
        .returning();
      await transaction.insert(activityEvents).values({
        organizationId: context.organizationId,
        actorUserId: context.userId,
        action: "inspection.approved",
        resourceType: "inspection_run",
        resourceId: id,
        metadata: {},
      });
      return updated!;
    });
  }

  async dashboard(context: TenantContext) {
    const summary = await this.db.execute(sql`
      select
        count(*) filter (where scheduled_for <= now() and due_at >= now()
          and status in ('ASSIGNED','READY','IN_PROGRESS'))::int as due,
        count(*) filter (where due_at < now()
          and status in ('ASSIGNED','READY','IN_PROGRESS'))::int as overdue,
        count(*) filter (where status = 'CLOSED'
          and closed_at >= now() - interval '30 days')::int as completed_recently
      from inspection_runs
      where organization_id = ${context.organizationId}::uuid
    `);
    const coverage = await this.db.execute(sql`
      select s.id as site_id, s.name as site_name,
        count(r.id) filter (where r.scheduled_for <= now())::int as required,
        count(r.id) filter (where r.scheduled_for <= now() and r.status = 'CLOSED')::int as completed,
        count(r.id) filter (where r.due_at < now()
          and r.status in ('ASSIGNED','READY','IN_PROGRESS'))::int as overdue
      from sites s
      left join inspection_runs r on r.site_id = s.id and r.organization_id = s.organization_id
      where s.organization_id = ${context.organizationId}::uuid and s.status <> 'ARCHIVED'
      group by s.id, s.name
      order by s.name
    `);
    return { summary: summary[0] ?? { due: 0, overdue: 0, completed_recently: 0 }, coverage };
  }

  private async requireExecutableRun(context: TenantContext, id: string) {
    const [run] = await this.db
      .select({
        status: inspectionRuns.status,
        assignedTo: inspectionRuns.assignedTo,
        siteId: inspectionRuns.siteId,
        assetId: inspectionRuns.assetId,
        templateVersionId: inspectionRuns.templateVersionId,
        requiresReview: inspectionPlans.requiresReview,
      })
      .from(inspectionRuns)
      .innerJoin(inspectionPlans, eq(inspectionPlans.id, inspectionRuns.inspectionPlanId))
      .where(
        and(eq(inspectionRuns.id, id), eq(inspectionRuns.organizationId, context.organizationId)),
      );
    if (!run) throw new NotFoundException("Inspection run not found");
    if (run.assignedTo !== context.userId)
      throw new ForbiddenException("Only the assigned active executor can change this run");
    const [activeMembership] = await this.db
      .select({ id: memberships.id })
      .from(memberships)
      .where(
        and(
          eq(memberships.organizationId, context.organizationId),
          eq(memberships.userId, run.assignedTo),
          eq(memberships.status, "ACTIVE"),
        ),
      );
    if (!activeMembership)
      throw new ForbiddenException("The assigned executor is no longer an active member");
    return run;
  }

  private assertRunVisible(context: TenantContext, assignedTo: string) {
    if (context.role === "TECHNICIAN" && assignedTo !== context.userId)
      throw new NotFoundException("Inspection run not found");
  }

  private async templateItems(organizationId: string, versionId: string) {
    const [version] = await this.db
      .select({ schema: inspectionTemplateVersions.schema })
      .from(inspectionTemplateVersions)
      .where(
        and(
          eq(inspectionTemplateVersions.id, versionId),
          eq(inspectionTemplateVersions.organizationId, organizationId),
        ),
      );
    if (!version) throw new NotFoundException("Inspection template version not found");
    return (version.schema as InspectionTemplateSchema).sections.flatMap(
      (section) => section.items,
    ) as InspectionTemplateItemDefinition[];
  }

  private async assertPlanScope(organizationId: string, input: InspectionPlanCreateInput) {
    const [version] = await this.db
      .select({ id: inspectionTemplateVersions.id })
      .from(inspectionTemplateVersions)
      .where(
        and(
          eq(inspectionTemplateVersions.id, input.templateVersionId),
          eq(inspectionTemplateVersions.organizationId, organizationId),
        ),
      );
    const [site] = await this.db
      .select({ id: sites.id, status: sites.status })
      .from(sites)
      .where(and(eq(sites.id, input.siteId), eq(sites.organizationId, organizationId)));
    const [asset] = input.assetId
      ? await this.db
          .select({ id: assets.id, status: assets.status })
          .from(assets)
          .where(
            and(
              eq(assets.id, input.assetId),
              eq(assets.siteId, input.siteId),
              eq(assets.organizationId, organizationId),
            ),
          )
      : [undefined];
    if (
      !version ||
      !site ||
      site.status === "ARCHIVED" ||
      (input.assetId && (!asset || asset.status === "ARCHIVED"))
    )
      throw new BadRequestException("Template version or inspection target is unavailable");
    if (input.assignedUserId) await this.assertEligibleUser(organizationId, input.assignedUserId);
  }

  private async assertEligibleUser(organizationId: string, userId: string) {
    const [membership] = await this.db
      .select({ id: memberships.id })
      .from(memberships)
      .where(
        and(
          eq(memberships.organizationId, organizationId),
          eq(memberships.userId, userId),
          eq(memberships.status, "ACTIVE"),
        ),
      );
    if (!membership) throw new BadRequestException("Assigned user is not an active member");
  }

  private async enqueueGeneration(planId: string, correlationId: string) {
    await this.queue.add(
      "generate-inspection-runs",
      { correlationId, planId, horizonDays: 35, requestedAt: new Date().toISOString() },
      { jobId: `plan-${planId}`, attempts: 5, backoff: { type: "exponential", delay: 1_000 } },
    );
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

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}
