import {
  and,
  correctiveActions,
  eq,
  inspectionFindings,
  inspectionNotificationIntents,
  inspectionRuns,
  lte,
  memberships,
  sql,
  users,
  type createDatabase,
} from "@nexus/database";
import type { Transporter } from "nodemailer";

type Database = ReturnType<typeof createDatabase>["db"];

export async function dispatchInspectionNotifications(
  db: Database,
  transporter: Transporter,
  from: string,
  now = new Date(),
): Promise<number> {
  await db
    .update(inspectionNotificationIntents)
    .set({ status: "PENDING", updatedAt: now })
    .where(
      and(
        eq(inspectionNotificationIntents.status, "SENDING"),
        sql`${inspectionNotificationIntents.updatedAt} < now() - interval '15 minutes'`,
      ),
    );
  const intents = await db
    .select({
      id: inspectionNotificationIntents.id,
      organizationId: inspectionNotificationIntents.organizationId,
      runId: inspectionNotificationIntents.inspectionRunId,
      kind: inspectionNotificationIntents.kind,
      recipientUserId: inspectionNotificationIntents.recipientUserId,
      recipientEmail: users.email,
      recipientName: users.name,
      runStatus: inspectionRuns.status,
      findingStatus: inspectionFindings.status,
      actionStatus: correctiveActions.status,
      actionDueAt: correctiveActions.dueAt,
      attempts: inspectionNotificationIntents.attempts,
    })
    .from(inspectionNotificationIntents)
    .innerJoin(users, eq(users.id, inspectionNotificationIntents.recipientUserId))
    .leftJoin(inspectionRuns, eq(inspectionRuns.id, inspectionNotificationIntents.inspectionRunId))
    .leftJoin(
      inspectionFindings,
      eq(inspectionFindings.id, inspectionNotificationIntents.findingId),
    )
    .leftJoin(
      correctiveActions,
      eq(correctiveActions.id, inspectionNotificationIntents.correctiveActionId),
    )
    .where(
      and(
        eq(inspectionNotificationIntents.status, "PENDING"),
        lte(inspectionNotificationIntents.scheduledFor, now),
      ),
    )
    .limit(100);

  let sent = 0;
  for (const intent of intents) {
    const [membership] = await db
      .select({ status: memberships.status })
      .from(memberships)
      .where(
        and(
          eq(memberships.organizationId, intent.organizationId),
          eq(memberships.userId, intent.recipientUserId),
        ),
      );
    if (
      membership?.status !== "ACTIVE" ||
      (intent.runStatus !== null && ["CLOSED", "CANCELLED"].includes(intent.runStatus)) ||
      (intent.findingStatus !== null && ["CLOSED", "DISMISSED"].includes(intent.findingStatus)) ||
      (intent.actionStatus !== null &&
        ["VERIFIED", "CANCELLED"].includes(intent.actionStatus) &&
        !["ACTION_VERIFIED"].includes(intent.kind)) ||
      (intent.kind === "OVERDUE" &&
        (intent.runStatus === null ||
          !["ASSIGNED", "READY", "IN_PROGRESS"].includes(intent.runStatus))) ||
      (intent.kind === "ACTION_OVERDUE" &&
        (intent.actionStatus === null ||
          intent.actionDueAt === null ||
          intent.actionDueAt >= now ||
          !["OPEN", "IN_PROGRESS", "BLOCKED"].includes(intent.actionStatus)))
    ) {
      await db
        .update(inspectionNotificationIntents)
        .set({ status: "CANCELLED", updatedAt: now })
        .where(eq(inspectionNotificationIntents.id, intent.id));
      continue;
    }

    const label = {
      ASSIGNMENT: "assigned",
      DUE: "due",
      OVERDUE: "overdue",
      FINDING_ASSIGNMENT: "finding assigned",
      ACTION_ASSIGNMENT: "corrective action assigned",
      ACTION_DUE: "corrective action due",
      ACTION_OVERDUE: "corrective action overdue",
      ACTION_COMPLETED: "corrective action ready for review",
      ACTION_VERIFIED: "corrective action verified",
    }[intent.kind];
    const claimed = await db
      .update(inspectionNotificationIntents)
      .set({ status: "SENDING", updatedAt: now })
      .where(
        and(
          eq(inspectionNotificationIntents.id, intent.id),
          eq(inspectionNotificationIntents.status, "PENDING"),
        ),
      )
      .returning({ id: inspectionNotificationIntents.id });
    if (!claimed[0]) continue;
    try {
      await transporter.sendMail({
        from,
        to: intent.recipientEmail,
        subject: `NEXUS ${label}`,
        text: `Hello ${intent.recipientName},\n\nA NEXUS operational item is ${label}. Open NEXUS to review it.`,
      });
      await db
        .update(inspectionNotificationIntents)
        .set({
          status: "SENT",
          attempts: intent.attempts + 1,
          lastError: null,
          sentAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(inspectionNotificationIntents.id, intent.id),
            eq(inspectionNotificationIntents.status, "SENDING"),
          ),
        );
      sent += 1;
    } catch (error) {
      const attempts = intent.attempts + 1;
      await db
        .update(inspectionNotificationIntents)
        .set({
          status: attempts >= 8 ? "FAILED" : "PENDING",
          attempts,
          lastError: error instanceof Error ? error.message.slice(0, 2_000) : "Delivery failed",
          updatedAt: now,
        })
        .where(eq(inspectionNotificationIntents.id, intent.id));
      if (attempts < 8) throw error;
    }
  }
  return sent;
}
