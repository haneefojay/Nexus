import type { GenerateInspectionRunsJob } from "@nexus/contracts";
import {
  activityEvents,
  and,
  eq,
  inspectionPlans,
  inspectionNotificationIntents,
  inspectionRuns,
  lte,
  memberships,
  organizations,
  type createDatabase,
} from "@nexus/database";
import { inspectionOccurrenceAt } from "@nexus/domain";

type Database = ReturnType<typeof createDatabase>["db"];

const maxRunsPerPlanPerJob = 100;

export async function generateInspectionRuns(
  db: Database,
  input: GenerateInspectionRunsJob,
): Promise<number> {
  const requestedAt = new Date(input.requestedAt);
  if (!Number.isFinite(requestedAt.getTime())) throw new Error("Generation timestamp is invalid");
  const horizon = new Date(requestedAt.getTime() + input.horizonDays * 86_400_000);
  const plans = await db
    .select({
      id: inspectionPlans.id,
      organizationId: inspectionPlans.organizationId,
      templateVersionId: inspectionPlans.templateVersionId,
      siteId: inspectionPlans.siteId,
      assetId: inspectionPlans.assetId,
      recurrenceType: inspectionPlans.recurrenceType,
      intervalDays: inspectionPlans.intervalDays,
      startsAt: inspectionPlans.startsAt,
      endsAt: inspectionPlans.endsAt,
      assignedUserId: inspectionPlans.assignedUserId,
      assignedRole: inspectionPlans.assignedRole,
      dueWindowMinutes: inspectionPlans.dueWindowMinutes,
      nextSequence: inspectionPlans.nextSequence,
      timezone: organizations.timezone,
    })
    .from(inspectionPlans)
    .innerJoin(organizations, eq(organizations.id, inspectionPlans.organizationId))
    .where(
      and(
        eq(inspectionPlans.active, true),
        lte(inspectionPlans.nextDueAt, horizon),
        input.planId ? eq(inspectionPlans.id, input.planId) : undefined,
      ),
    )
    .limit(500);

  let generated = 0;
  for (const plan of plans) {
    const assignedTo =
      plan.assignedUserId ??
      (plan.assignedRole
        ? await eligibleMember(db, plan.organizationId, plan.assignedRole)
        : undefined);
    if (!assignedTo) continue;

    let sequence = plan.nextSequence;
    const recurrence =
      plan.intervalDays === null
        ? { type: plan.recurrenceType }
        : { type: plan.recurrenceType, intervalDays: plan.intervalDays };
    let occurrence = inspectionOccurrenceAt(plan.startsAt, recurrence, sequence, plan.timezone);
    let planGenerated = 0;
    while (
      occurrence <= horizon &&
      (!plan.endsAt || occurrence <= plan.endsAt) &&
      planGenerated < maxRunsPerPlanPerJob
    ) {
      const dueAt = new Date(occurrence.getTime() + plan.dueWindowMinutes * 60_000);
      const inserted = await db.transaction(async (transaction) => {
        const rows = await transaction
          .insert(inspectionRuns)
          .values({
            organizationId: plan.organizationId,
            inspectionPlanId: plan.id,
            templateVersionId: plan.templateVersionId,
            siteId: plan.siteId,
            assetId: plan.assetId,
            assignedTo,
            sequence,
            scheduledFor: occurrence,
            dueAt,
          })
          .onConflictDoNothing({
            target: [inspectionRuns.inspectionPlanId, inspectionRuns.sequence],
          })
          .returning({ id: inspectionRuns.id });
        if (rows[0]) {
          await transaction.insert(activityEvents).values({
            organizationId: plan.organizationId,
            actorUserId: null,
            action: "inspection.generated",
            resourceType: "inspection_run",
            resourceId: rows[0].id,
            metadata: { planId: plan.id, sequence },
          });
          await transaction
            .insert(inspectionNotificationIntents)
            .values([
              {
                organizationId: plan.organizationId,
                inspectionRunId: rows[0].id,
                recipientUserId: assignedTo,
                kind: "ASSIGNMENT",
                dedupeKey: `${rows[0].id}:ASSIGNMENT:${assignedTo}`,
                scheduledFor: requestedAt,
              },
              {
                organizationId: plan.organizationId,
                inspectionRunId: rows[0].id,
                recipientUserId: assignedTo,
                kind: "DUE",
                dedupeKey: `${rows[0].id}:DUE:${assignedTo}`,
                scheduledFor: occurrence,
              },
              {
                organizationId: plan.organizationId,
                inspectionRunId: rows[0].id,
                recipientUserId: assignedTo,
                kind: "OVERDUE",
                dedupeKey: `${rows[0].id}:OVERDUE:${assignedTo}`,
                scheduledFor: dueAt,
              },
            ])
            .onConflictDoNothing();
        }
        return Boolean(rows[0]);
      });
      if (inserted) generated += 1;
      sequence += 1;
      planGenerated += 1;
      occurrence = inspectionOccurrenceAt(plan.startsAt, recurrence, sequence, plan.timezone);
    }

    await db
      .update(inspectionPlans)
      .set({ nextSequence: sequence, nextDueAt: occurrence, updatedAt: new Date() })
      .where(
        and(eq(inspectionPlans.id, plan.id), eq(inspectionPlans.nextSequence, plan.nextSequence)),
      );
  }
  return generated;
}

async function eligibleMember(
  db: Database,
  organizationId: string,
  role: (typeof memberships.$inferSelect)["role"],
) {
  const [membership] = await db
    .select({ userId: memberships.userId })
    .from(memberships)
    .where(
      and(
        eq(memberships.organizationId, organizationId),
        eq(memberships.role, role),
        eq(memberships.status, "ACTIVE"),
      ),
    )
    .orderBy(memberships.createdAt, memberships.id)
    .limit(1);
  return membership?.userId;
}
