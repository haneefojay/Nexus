import {
  and,
  eq,
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
      attempts: inspectionNotificationIntents.attempts,
    })
    .from(inspectionNotificationIntents)
    .innerJoin(users, eq(users.id, inspectionNotificationIntents.recipientUserId))
    .innerJoin(inspectionRuns, eq(inspectionRuns.id, inspectionNotificationIntents.inspectionRunId))
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
      ["CLOSED", "CANCELLED"].includes(intent.runStatus) ||
      (intent.kind === "OVERDUE" &&
        !["ASSIGNED", "READY", "IN_PROGRESS"].includes(intent.runStatus))
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
        subject: `NEXUS inspection ${label}`,
        text: `Hello ${intent.recipientName},\n\nInspection ${intent.runId} is ${label}. Open NEXUS to review the inspection.`,
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
            eq(inspectionNotificationIntents.status, "PENDING"),
          ),
        );
      sent += 1;
    } catch (error) {
      await db
        .update(inspectionNotificationIntents)
        .set({
          status: "PENDING",
          attempts: intent.attempts + 1,
          lastError: error instanceof Error ? error.message.slice(0, 2_000) : "Delivery failed",
          updatedAt: now,
        })
        .where(eq(inspectionNotificationIntents.id, intent.id));
      throw error;
    }
  }
  return sent;
}
