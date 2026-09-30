import {
  activityEvents,
  and,
  correctiveActions,
  correctiveActionTransitions,
  eq,
  evidence,
  findingTransitions,
  inspectionFindings,
  inspectionNotificationIntents,
  memberships,
  or,
  sql,
  type createDatabase,
  users,
} from "@nexus/database";
import {
  assertCorrectiveActionTransition,
  assertFindingTransition,
  DomainRuleError,
  type CorrectiveActionStatus,
  type FindingStatus,
} from "@nexus/domain";
import type { CorrectiveActionCreateInput } from "@nexus/validation";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import type { TenantContext } from "../context/request-context.service.js";

@Injectable()
export class FindingsService {
  constructor(private readonly db: ReturnType<typeof createDatabase>["db"]) {}

  listFindings(
    context: TenantContext,
    filters: {
      status?: FindingStatus;
      severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      siteId?: string;
      assetId?: string;
      assigneeId?: string;
      overdue?: boolean;
    } = {},
  ) {
    return this.db
      .select({
        id: inspectionFindings.id,
        title: inspectionFindings.title,
        severity: inspectionFindings.severity,
        status: inspectionFindings.status,
        siteId: inspectionFindings.siteId,
        assetId: inspectionFindings.assetId,
        inspectionRunId: inspectionFindings.inspectionRunId,
        detectedAt: inspectionFindings.detectedAt,
        assignedTo: correctiveActions.assignedTo,
        dueAt: correctiveActions.dueAt,
        overdue: sql<boolean>`${correctiveActions.dueAt} < now() and ${correctiveActions.status} not in ('VERIFIED','CANCELLED')`,
      })
      .from(inspectionFindings)
      .leftJoin(
        correctiveActions,
        and(
          eq(correctiveActions.findingId, inspectionFindings.id),
          eq(correctiveActions.organizationId, inspectionFindings.organizationId),
        ),
      )
      .where(
        and(
          eq(inspectionFindings.organizationId, context.organizationId),
          filters.status ? eq(inspectionFindings.status, filters.status) : undefined,
          filters.severity ? eq(inspectionFindings.severity, filters.severity) : undefined,
          filters.siteId ? eq(inspectionFindings.siteId, filters.siteId) : undefined,
          filters.assetId ? eq(inspectionFindings.assetId, filters.assetId) : undefined,
          filters.assigneeId ? eq(correctiveActions.assignedTo, filters.assigneeId) : undefined,
          filters.overdue
            ? sql`${correctiveActions.dueAt} < now() and ${correctiveActions.status} not in ('VERIFIED','CANCELLED')`
            : undefined,
        ),
      )
      .orderBy(
        sql`
        case ${inspectionFindings.severity}
          when 'CRITICAL' then 1 when 'HIGH' then 2 when 'MEDIUM' then 3 else 4
        end, ${inspectionFindings.detectedAt} desc
      `,
      )
      .limit(200);
  }

  listActions(context: TenantContext) {
    return this.db
      .select({
        id: correctiveActions.id,
        findingId: correctiveActions.findingId,
        title: correctiveActions.title,
        assignedTo: correctiveActions.assignedTo,
        priority: correctiveActions.priority,
        dueAt: correctiveActions.dueAt,
        status: correctiveActions.status,
        overdue: sql<boolean>`${correctiveActions.dueAt} < now() and ${correctiveActions.status} not in ('VERIFIED','CANCELLED')`,
      })
      .from(correctiveActions)
      .where(eq(correctiveActions.organizationId, context.organizationId))
      .orderBy(correctiveActions.dueAt)
      .limit(200);
  }

  listEligibleAssignees(context: TenantContext) {
    return this.db
      .select({ id: users.id, name: users.name, role: memberships.role })
      .from(memberships)
      .innerJoin(users, eq(users.id, memberships.userId))
      .where(
        and(
          eq(memberships.organizationId, context.organizationId),
          eq(memberships.status, "ACTIVE"),
          sql`${memberships.role} in ('OWNER','OPERATIONS_MANAGER','SUPERVISOR','TECHNICIAN')`,
        ),
      )
      .orderBy(users.name);
  }

  async dashboard(context: TenantContext) {
    const [summary] = await this.db.execute<{
      open_findings: number;
      critical_findings: number;
      high_findings: number;
      due_actions: number;
      overdue_actions: number;
      ready_for_verification: number;
    }>(sql`
      select
        (select count(*)::int from inspection_findings f
          where f.organization_id = ${context.organizationId}::uuid
            and f.status not in ('CLOSED','DISMISSED')) as open_findings,
        (select count(*)::int from inspection_findings f
          where f.organization_id = ${context.organizationId}::uuid
            and f.severity = 'CRITICAL' and f.status not in ('CLOSED','DISMISSED')) as critical_findings,
        (select count(*)::int from inspection_findings f
          where f.organization_id = ${context.organizationId}::uuid
            and f.severity = 'HIGH' and f.status not in ('CLOSED','DISMISSED')) as high_findings,
        (select count(*)::int from corrective_actions a
          where a.organization_id = ${context.organizationId}::uuid
            and a.due_at >= now() and a.status not in ('VERIFIED','CANCELLED')) as due_actions,
        (select count(*)::int from corrective_actions a
          where a.organization_id = ${context.organizationId}::uuid
            and a.due_at < now() and a.status not in ('VERIFIED','CANCELLED')) as overdue_actions,
        (select count(*)::int from corrective_actions a
          where a.organization_id = ${context.organizationId}::uuid
            and a.status = 'VERIFICATION_REQUIRED') as ready_for_verification
    `);
    return (
      summary ?? {
        open_findings: 0,
        critical_findings: 0,
        high_findings: 0,
        due_actions: 0,
        overdue_actions: 0,
        ready_for_verification: 0,
      }
    );
  }

  async getFinding(context: TenantContext, id: string) {
    const [finding] = await this.db
      .select()
      .from(inspectionFindings)
      .where(
        and(
          eq(inspectionFindings.id, id),
          eq(inspectionFindings.organizationId, context.organizationId),
        ),
      );
    if (!finding) throw new NotFoundException("Finding not found");
    const [action] = await this.db
      .select()
      .from(correctiveActions)
      .where(
        and(
          eq(correctiveActions.findingId, id),
          eq(correctiveActions.organizationId, context.organizationId),
        ),
      );
    const history = await this.db
      .select()
      .from(findingTransitions)
      .where(
        and(
          eq(findingTransitions.findingId, id),
          eq(findingTransitions.organizationId, context.organizationId),
        ),
      )
      .orderBy(findingTransitions.createdAt);
    const actionHistory = action
      ? await this.db
          .select()
          .from(correctiveActionTransitions)
          .where(
            and(
              eq(correctiveActionTransitions.correctiveActionId, action.id),
              eq(correctiveActionTransitions.organizationId, context.organizationId),
            ),
          )
          .orderBy(correctiveActionTransitions.createdAt)
      : [];
    const evidenceRecords = await this.db
      .select({
        id: evidence.id,
        targetType: evidence.targetType,
        targetId: evidence.targetId,
        uploaderUserId: evidence.uploaderUserId,
        capturedAt: evidence.capturedAt,
        uploadedAt: evidence.uploadedAt,
        checksum: evidence.checksum,
        note: evidence.note,
      })
      .from(evidence)
      .where(
        and(
          eq(evidence.organizationId, context.organizationId),
          or(
            and(eq(evidence.targetType, "FINDING"), eq(evidence.targetId, id)),
            action
              ? and(eq(evidence.targetType, "CORRECTIVE_ACTION"), eq(evidence.targetId, action.id))
              : undefined,
          ),
        ),
      );
    return {
      ...finding,
      correctiveAction: action ?? null,
      history,
      actionHistory,
      evidence: evidenceRecords,
    };
  }

  acknowledge(context: TenantContext, id: string) {
    return this.transitionFinding(context, id, "ACKNOWLEDGED");
  }

  dismiss(context: TenantContext, id: string, reason: string) {
    return this.transitionFinding(context, id, "DISMISSED", reason);
  }

  async createAction(
    context: TenantContext,
    findingId: string,
    input: CorrectiveActionCreateInput,
  ) {
    await this.assertEligibleAssignee(context.organizationId, input.assignedTo);
    return this.db.transaction(async (transaction) => {
      const [finding] = await transaction
        .select()
        .from(inspectionFindings)
        .where(
          and(
            eq(inspectionFindings.id, findingId),
            eq(inspectionFindings.organizationId, context.organizationId),
          ),
        )
        .for("update");
      if (!finding) throw new NotFoundException("Finding not found");
      const [existing] = await transaction
        .select()
        .from(correctiveActions)
        .where(
          and(
            eq(correctiveActions.findingId, findingId),
            eq(correctiveActions.organizationId, context.organizationId),
          ),
        );
      if (existing) {
        if (
          existing.title === input.title &&
          existing.description === input.description &&
          existing.assignedTo === input.assignedTo &&
          existing.priority === input.priority &&
          existing.dueAt.toISOString() === new Date(input.dueAt).toISOString()
        )
          return existing;
        throw new ConflictException("A corrective action already exists for this finding");
      }
      if (!["OPEN", "ACKNOWLEDGED", "ACTION_REQUIRED"].includes(finding.status))
        throw new ConflictException("The finding cannot accept a corrective action");
      const [created] = await transaction
        .insert(correctiveActions)
        .values({
          organizationId: context.organizationId,
          findingId,
          title: input.title,
          description: input.description,
          assignedTo: input.assignedTo,
          priority: input.priority,
          dueAt: new Date(input.dueAt),
          createdBy: context.userId,
        })
        .returning();
      await transaction.insert(correctiveActionTransitions).values({
        organizationId: context.organizationId,
        correctiveActionId: created!.id,
        toStatus: "OPEN",
        actorUserId: context.userId,
      });
      if (finding.status !== "ACTION_REQUIRED") {
        await transaction
          .update(inspectionFindings)
          .set({ status: "ACTION_REQUIRED", assignedTo: input.assignedTo })
          .where(eq(inspectionFindings.id, findingId));
        await transaction.insert(findingTransitions).values({
          organizationId: context.organizationId,
          findingId,
          fromStatus: finding.status,
          toStatus: "ACTION_REQUIRED",
          actorUserId: context.userId,
        });
      }
      await transaction
        .insert(inspectionNotificationIntents)
        .values([
          {
            organizationId: context.organizationId,
            findingId,
            recipientUserId: input.assignedTo,
            kind: "FINDING_ASSIGNMENT",
            dedupeKey: `finding:${findingId}:assignment:${input.assignedTo}`,
            scheduledFor: new Date(),
          },
          {
            organizationId: context.organizationId,
            correctiveActionId: created!.id,
            recipientUserId: input.assignedTo,
            kind: "ACTION_ASSIGNMENT",
            dedupeKey: `action:${created!.id}:assignment:${input.assignedTo}`,
            scheduledFor: new Date(),
          },
          {
            organizationId: context.organizationId,
            correctiveActionId: created!.id,
            recipientUserId: input.assignedTo,
            kind: "ACTION_DUE",
            dedupeKey: `action:${created!.id}:due:${input.dueAt}`,
            scheduledFor: new Date(
              Math.max(Date.now(), new Date(input.dueAt).getTime() - 86_400_000),
            ),
          },
          {
            organizationId: context.organizationId,
            correctiveActionId: created!.id,
            recipientUserId: input.assignedTo,
            kind: "ACTION_OVERDUE",
            dedupeKey: `action:${created!.id}:overdue:${input.dueAt}`,
            scheduledFor: new Date(new Date(input.dueAt).getTime() + 60_000),
          },
        ])
        .onConflictDoNothing();
      await transaction.insert(activityEvents).values({
        organizationId: context.organizationId,
        actorUserId: context.userId,
        action: "corrective_action.created",
        resourceType: "corrective_action",
        resourceId: created!.id,
        metadata: { findingId, assignedTo: input.assignedTo },
      });
      return created!;
    });
  }

  startAction(context: TenantContext, id: string) {
    return this.transitionAction(context, id, "IN_PROGRESS");
  }

  async reassignAction(context: TenantContext, id: string, assignedTo: string, reason: string) {
    await this.assertEligibleAssignee(context.organizationId, assignedTo);
    return this.db.transaction(async (transaction) => {
      const [action] = await transaction
        .select()
        .from(correctiveActions)
        .where(
          and(
            eq(correctiveActions.id, id),
            eq(correctiveActions.organizationId, context.organizationId),
          ),
        )
        .for("update");
      if (!action) throw new NotFoundException("Corrective action not found");
      if (["VERIFIED", "CANCELLED"].includes(action.status))
        throw new ConflictException("A terminal corrective action cannot be reassigned");
      const [updated] = await transaction
        .update(correctiveActions)
        .set({ assignedTo, updatedAt: new Date() })
        .where(
          and(eq(correctiveActions.id, id), eq(correctiveActions.assignedTo, action.assignedTo)),
        )
        .returning();
      if (!updated) throw new ConflictException("Corrective action assignment changed");
      await transaction
        .update(inspectionFindings)
        .set({ assignedTo })
        .where(eq(inspectionFindings.id, action.findingId));
      await transaction.insert(correctiveActionTransitions).values({
        organizationId: context.organizationId,
        correctiveActionId: id,
        fromStatus: action.status,
        toStatus: action.status,
        actorUserId: context.userId,
        note: reason,
        metadata: { previousAssignee: action.assignedTo, assignedTo },
      });
      await transaction.insert(activityEvents).values({
        organizationId: context.organizationId,
        actorUserId: context.userId,
        action: "corrective_action.reassigned",
        resourceType: "corrective_action",
        resourceId: id,
        metadata: { previousAssignee: action.assignedTo, assignedTo, reason },
      });
      await transaction
        .insert(inspectionNotificationIntents)
        .values({
          organizationId: context.organizationId,
          correctiveActionId: id,
          recipientUserId: assignedTo,
          kind: "ACTION_ASSIGNMENT",
          dedupeKey: `action:${id}:assignment:${assignedTo}`,
          scheduledFor: new Date(),
        })
        .onConflictDoNothing();
      return updated;
    });
  }

  blockAction(context: TenantContext, id: string, note: string) {
    if (!note.trim()) throw new BadRequestException("A blocking reason is required");
    return this.transitionAction(context, id, "BLOCKED", note);
  }

  returnAction(context: TenantContext, id: string, note: string) {
    if (!note.trim()) throw new BadRequestException("A return note is required");
    return this.transitionAction(context, id, "IN_PROGRESS", note);
  }

  async completeAction(context: TenantContext, id: string, completionNotes: string) {
    if (!completionNotes.trim()) throw new BadRequestException("Completion notes are required");
    return this.db.transaction(async (transaction) => {
      const [action] = await transaction
        .select()
        .from(correctiveActions)
        .where(
          and(
            eq(correctiveActions.id, id),
            eq(correctiveActions.organizationId, context.organizationId),
          ),
        )
        .for("update");
      if (!action) throw new NotFoundException("Corrective action not found");
      if (action.assignedTo !== context.userId)
        throw new ForbiddenException("Only the assigned active member can complete this action");
      await this.assertEligibleAssignee(context.organizationId, context.userId);
      const [evidenceCount] = await transaction
        .select({ value: sql<number>`count(*)::int` })
        .from(evidence)
        .where(
          and(
            eq(evidence.organizationId, context.organizationId),
            eq(evidence.targetType, "CORRECTIVE_ACTION"),
            eq(evidence.targetId, id),
          ),
        );
      try {
        assertCorrectiveActionTransition(action.status, "COMPLETED", {
          actorUserId: context.userId,
          assigneeUserId: action.assignedTo,
          completionNotes,
          completionEvidenceCount: evidenceCount?.value ?? 0,
        });
        assertCorrectiveActionTransition("COMPLETED", "VERIFICATION_REQUIRED", {
          actorUserId: context.userId,
          assigneeUserId: action.assignedTo,
          completionNotes,
          completionEvidenceCount: evidenceCount?.value ?? 0,
        });
      } catch (error) {
        throw mapDomainError(error);
      }
      const now = new Date();
      const [updated] = await transaction
        .update(correctiveActions)
        .set({
          status: "VERIFICATION_REQUIRED",
          completionNotes,
          completedAt: now,
          completedBy: context.userId,
          updatedAt: now,
        })
        .where(and(eq(correctiveActions.id, id), eq(correctiveActions.status, action.status)))
        .returning();
      if (!updated) throw new ConflictException("Corrective action state changed");
      await transaction.insert(correctiveActionTransitions).values([
        {
          organizationId: context.organizationId,
          correctiveActionId: id,
          fromStatus: action.status,
          toStatus: "COMPLETED",
          actorUserId: context.userId,
          note: completionNotes,
        },
        {
          organizationId: context.organizationId,
          correctiveActionId: id,
          fromStatus: "COMPLETED",
          toStatus: "VERIFICATION_REQUIRED",
          actorUserId: context.userId,
        },
      ]);
      await transaction
        .update(inspectionFindings)
        .set({ status: "READY_FOR_VERIFICATION" })
        .where(
          and(
            eq(inspectionFindings.id, action.findingId),
            eq(inspectionFindings.status, "IN_PROGRESS"),
          ),
        );
      await transaction.insert(findingTransitions).values({
        organizationId: context.organizationId,
        findingId: action.findingId,
        fromStatus: "IN_PROGRESS",
        toStatus: "READY_FOR_VERIFICATION",
        actorUserId: context.userId,
      });
      await transaction.insert(activityEvents).values({
        organizationId: context.organizationId,
        actorUserId: context.userId,
        action: "corrective_action.completed",
        resourceType: "corrective_action",
        resourceId: id,
        metadata: { evidenceCount: evidenceCount?.value ?? 0 },
      });
      if (action.createdBy !== context.userId)
        await transaction
          .insert(inspectionNotificationIntents)
          .values({
            organizationId: context.organizationId,
            correctiveActionId: id,
            recipientUserId: action.createdBy,
            kind: "ACTION_COMPLETED",
            dedupeKey: `action:${id}:completed`,
            scheduledFor: now,
          })
          .onConflictDoNothing();
      return updated;
    });
  }

  async verifyAction(context: TenantContext, id: string) {
    return this.db.transaction(async (transaction) => {
      const [action] = await transaction
        .select()
        .from(correctiveActions)
        .where(
          and(
            eq(correctiveActions.id, id),
            eq(correctiveActions.organizationId, context.organizationId),
          ),
        )
        .for("update");
      if (!action) throw new NotFoundException("Corrective action not found");
      try {
        assertCorrectiveActionTransition(action.status, "VERIFIED", {
          actorUserId: context.userId,
          assigneeUserId: action.assignedTo,
          completedByUserId: action.completedBy,
        });
      } catch (error) {
        throw mapDomainError(error);
      }
      const now = new Date();
      const [updated] = await transaction
        .update(correctiveActions)
        .set({ status: "VERIFIED", verifiedAt: now, verifiedBy: context.userId, updatedAt: now })
        .where(and(eq(correctiveActions.id, id), eq(correctiveActions.status, action.status)))
        .returning();
      if (!updated) throw new ConflictException("Corrective action state changed");
      const [finding] = await transaction
        .select()
        .from(inspectionFindings)
        .where(
          and(
            eq(inspectionFindings.id, action.findingId),
            eq(inspectionFindings.organizationId, context.organizationId),
          ),
        )
        .for("update");
      if (!finding) throw new NotFoundException("Finding not found");
      try {
        assertFindingTransition(finding.status, "VERIFIED", {
          severity: finding.severity,
          hasVerifiedAction: true,
        });
      } catch (error) {
        throw mapDomainError(error);
      }
      await transaction
        .update(inspectionFindings)
        .set({ status: "VERIFIED", verifiedAt: now, verifiedBy: context.userId })
        .where(eq(inspectionFindings.id, finding.id));
      await transaction.insert(correctiveActionTransitions).values({
        organizationId: context.organizationId,
        correctiveActionId: id,
        fromStatus: action.status,
        toStatus: "VERIFIED",
        actorUserId: context.userId,
      });
      await transaction.insert(findingTransitions).values({
        organizationId: context.organizationId,
        findingId: finding.id,
        fromStatus: finding.status,
        toStatus: "VERIFIED",
        actorUserId: context.userId,
      });
      await transaction.insert(activityEvents).values({
        organizationId: context.organizationId,
        actorUserId: context.userId,
        action: "corrective_action.verified",
        resourceType: "corrective_action",
        resourceId: id,
        metadata: { findingId: finding.id },
      });
      await transaction
        .insert(inspectionNotificationIntents)
        .values({
          organizationId: context.organizationId,
          correctiveActionId: id,
          recipientUserId: action.assignedTo,
          kind: "ACTION_VERIFIED",
          dedupeKey: `action:${id}:verified`,
          scheduledFor: now,
        })
        .onConflictDoNothing();
      return updated;
    });
  }

  closeFinding(context: TenantContext, id: string) {
    return this.transitionFinding(context, id, "CLOSED");
  }

  private async transitionFinding(
    context: TenantContext,
    id: string,
    toStatus: FindingStatus,
    reason?: string,
  ) {
    return this.db.transaction(async (transaction) => {
      const [finding] = await transaction
        .select()
        .from(inspectionFindings)
        .where(
          and(
            eq(inspectionFindings.id, id),
            eq(inspectionFindings.organizationId, context.organizationId),
          ),
        )
        .for("update");
      if (!finding) throw new NotFoundException("Finding not found");
      try {
        const [verifiedAction] =
          toStatus === "CLOSED"
            ? await transaction
                .select({ id: correctiveActions.id })
                .from(correctiveActions)
                .where(
                  and(
                    eq(correctiveActions.findingId, id),
                    eq(correctiveActions.organizationId, context.organizationId),
                    eq(correctiveActions.status, "VERIFIED"),
                  ),
                )
            : [undefined];
        assertFindingTransition(finding.status, toStatus, {
          severity: finding.severity,
          hasVerifiedAction: Boolean(verifiedAction),
          ...(reason === undefined ? {} : { dismissalReason: reason }),
        });
      } catch (error) {
        throw mapDomainError(error);
      }
      const now = new Date();
      const [updated] = await transaction
        .update(inspectionFindings)
        .set({
          status: toStatus,
          dismissalReason: toStatus === "DISMISSED" ? reason : finding.dismissalReason,
          dismissedAt: toStatus === "DISMISSED" ? now : finding.dismissedAt,
          dismissedBy: toStatus === "DISMISSED" ? context.userId : finding.dismissedBy,
          closedAt: toStatus === "CLOSED" ? now : finding.closedAt,
        })
        .where(and(eq(inspectionFindings.id, id), eq(inspectionFindings.status, finding.status)))
        .returning();
      if (!updated) throw new ConflictException("Finding state changed");
      await transaction.insert(findingTransitions).values({
        organizationId: context.organizationId,
        findingId: id,
        fromStatus: finding.status,
        toStatus,
        actorUserId: context.userId,
        reason,
      });
      await transaction.insert(activityEvents).values({
        organizationId: context.organizationId,
        actorUserId: context.userId,
        action: `finding.${toStatus.toLowerCase()}`,
        resourceType: "inspection_finding",
        resourceId: id,
        metadata: reason ? { reason } : {},
      });
      return updated;
    });
  }

  private async transitionAction(
    context: TenantContext,
    id: string,
    toStatus: CorrectiveActionStatus,
    note?: string,
  ) {
    return this.db.transaction(async (transaction) => {
      const [action] = await transaction
        .select()
        .from(correctiveActions)
        .where(
          and(
            eq(correctiveActions.id, id),
            eq(correctiveActions.organizationId, context.organizationId),
          ),
        )
        .for("update");
      if (!action) throw new NotFoundException("Corrective action not found");
      if (action.assignedTo !== context.userId)
        throw new ForbiddenException("Only the assigned active member can change this action");
      await this.assertEligibleAssignee(context.organizationId, context.userId);
      try {
        assertCorrectiveActionTransition(action.status, toStatus, {
          actorUserId: context.userId,
          assigneeUserId: action.assignedTo,
          completedByUserId: action.completedBy,
        });
      } catch (error) {
        throw mapDomainError(error);
      }
      const [updated] = await transaction
        .update(correctiveActions)
        .set({
          status: toStatus,
          blockedReason: toStatus === "BLOCKED" ? note : null,
          updatedAt: new Date(),
        })
        .where(and(eq(correctiveActions.id, id), eq(correctiveActions.status, action.status)))
        .returning();
      if (!updated) throw new ConflictException("Corrective action state changed");
      await transaction.insert(correctiveActionTransitions).values({
        organizationId: context.organizationId,
        correctiveActionId: id,
        fromStatus: action.status,
        toStatus,
        actorUserId: context.userId,
        note,
      });
      await transaction
        .update(inspectionFindings)
        .set({ status: "IN_PROGRESS" })
        .where(
          and(
            eq(inspectionFindings.id, action.findingId),
            eq(inspectionFindings.status, "ACTION_REQUIRED"),
          ),
        );
      await transaction.insert(activityEvents).values({
        organizationId: context.organizationId,
        actorUserId: context.userId,
        action: `corrective_action.${toStatus.toLowerCase()}`,
        resourceType: "corrective_action",
        resourceId: id,
        metadata: note ? { note } : {},
      });
      return updated;
    });
  }

  private async assertEligibleAssignee(organizationId: string, userId: string) {
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
}

function mapDomainError(error: unknown) {
  if (error instanceof DomainRuleError)
    return new ConflictException({ code: error.code, message: error.message });
  return error;
}
