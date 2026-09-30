import {
  activityEvents,
  and,
  correctiveActions,
  correctiveActionTransitions,
  eq,
  findingTransitions,
  inspectionFindings,
  memberships,
  sql,
  type createDatabase,
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

  listFindings(context: TenantContext) {
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
      })
      .from(inspectionFindings)
      .where(eq(inspectionFindings.organizationId, context.organizationId))
      .orderBy(
        sql`
        case ${inspectionFindings.severity}
          when 'CRITICAL' then 1 when 'HIGH' then 2 when 'MEDIUM' then 3 else 4
        end, ${inspectionFindings.detectedAt} desc
      `,
      )
      .limit(200);
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
    return { ...finding, correctiveAction: action ?? null, history };
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
          .set({ status: "ACTION_REQUIRED" })
          .where(eq(inspectionFindings.id, findingId));
        await transaction.insert(findingTransitions).values({
          organizationId: context.organizationId,
          findingId,
          fromStatus: finding.status,
          toStatus: "ACTION_REQUIRED",
          actorUserId: context.userId,
        });
      }
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

  blockAction(context: TenantContext, id: string, note: string) {
    if (!note.trim()) throw new BadRequestException("A blocking reason is required");
    return this.transitionAction(context, id, "BLOCKED", note);
  }

  returnAction(context: TenantContext, id: string, note: string) {
    if (!note.trim()) throw new BadRequestException("A return note is required");
    return this.transitionAction(context, id, "IN_PROGRESS", note);
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
        assertFindingTransition(finding.status, toStatus, {
          severity: finding.severity,
          hasVerifiedAction: false,
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
