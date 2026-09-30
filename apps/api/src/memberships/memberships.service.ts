import { createHash, randomBytes } from "node:crypto";

import type { AuthEmailDispatcher } from "@nexus/auth";
import {
  activityEvents,
  and,
  count,
  eq,
  invitations,
  memberships,
  organizations,
  users,
  type createDatabase,
} from "@nexus/database";
import { assertOwnerInvariant, type MembershipRole } from "@nexus/domain";
import type { InvitationCreateInput } from "@nexus/validation";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import type { TenantContext } from "../context/request-context.service.js";

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

@Injectable()
export class MembershipsService {
  constructor(
    private readonly db: ReturnType<typeof createDatabase>["db"],
    private readonly email: AuthEmailDispatcher,
    private readonly webUrl: string,
  ) {}

  async list(context: TenantContext) {
    return this.db
      .select({
        id: memberships.id,
        userId: users.id,
        name: users.name,
        email: users.email,
        role: memberships.role,
        status: memberships.status,
        createdAt: memberships.createdAt,
      })
      .from(memberships)
      .innerJoin(users, eq(users.id, memberships.userId))
      .where(eq(memberships.organizationId, context.organizationId));
  }

  async invite(context: TenantContext, input: InvitationCreateInput) {
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + 7 * 86_400_000);
    try {
      const [invitation] = await this.db
        .insert(invitations)
        .values({
          organizationId: context.organizationId,
          email: input.email,
          role: input.role,
          tokenHash: hashToken(token),
          invitedBy: context.userId,
          expiresAt,
        })
        .returning({
          id: invitations.id,
          email: invitations.email,
          role: invitations.role,
          expiresAt: invitations.expiresAt,
        });
      if (!invitation) throw new Error("Invitation insert returned no record");
      await this.email.enqueue({
        kind: "ORGANIZATION_INVITATION",
        recipient: input.email,
        recipientName: input.email.split("@")[0] ?? "there",
        actionUrl: `${this.webUrl}/invite/${token}`,
      });
      await this.audit(context, "member.invited", invitation.id, {
        email: input.email,
        role: input.role,
      });
      return invitation;
    } catch (error) {
      if (isUniqueViolation(error))
        throw new ConflictException("A pending invitation already exists");
      throw error;
    }
  }

  async accept(userId: string, email: string, token: string) {
    return this.db.transaction(async (tx) => {
      const [invitation] = await tx
        .select()
        .from(invitations)
        .where(and(eq(invitations.tokenHash, hashToken(token)), eq(invitations.status, "PENDING")))
        .limit(1);
      if (
        !invitation ||
        invitation.expiresAt <= new Date() ||
        invitation.email !== email.toLowerCase()
      ) {
        throw new BadRequestException("The invitation is invalid or expired");
      }
      const [membership] = await tx
        .insert(memberships)
        .values({
          userId,
          organizationId: invitation.organizationId,
          role: invitation.role,
          status: "ACTIVE",
        })
        .onConflictDoUpdate({
          target: [memberships.userId, memberships.organizationId],
          set: { role: invitation.role, status: "ACTIVE", updatedAt: new Date() },
        })
        .returning({
          id: memberships.id,
          organizationId: memberships.organizationId,
          role: memberships.role,
        });
      await tx
        .update(invitations)
        .set({ status: "ACCEPTED", acceptedAt: new Date(), updatedAt: new Date() })
        .where(eq(invitations.id, invitation.id));
      await tx.insert(activityEvents).values({
        organizationId: invitation.organizationId,
        actorUserId: userId,
        action: "member.joined",
        resourceType: "membership",
        resourceId: membership!.id,
        metadata: { invitationId: invitation.id },
      });
      const [organization] = await tx
        .select({ name: organizations.name })
        .from(organizations)
        .where(eq(organizations.id, invitation.organizationId));
      return { ...membership!, organizationName: organization?.name };
    });
  }

  async updateRole(context: TenantContext, membershipId: string, role: MembershipRole) {
    await this.assertCanRemoveOwner(context.organizationId, membershipId, role !== "OWNER");
    const [updated] = await this.db
      .update(memberships)
      .set({ role, updatedAt: new Date() })
      .where(
        and(
          eq(memberships.id, membershipId),
          eq(memberships.organizationId, context.organizationId),
        ),
      )
      .returning({ id: memberships.id, role: memberships.role, status: memberships.status });
    if (!updated) throw new NotFoundException("Member not found");
    await this.audit(context, "member.role_changed", updated.id, { role });
    return updated;
  }

  async deactivate(context: TenantContext, membershipId: string) {
    await this.assertCanRemoveOwner(context.organizationId, membershipId, true);
    const [updated] = await this.db
      .update(memberships)
      .set({ status: "DEACTIVATED", updatedAt: new Date() })
      .where(
        and(
          eq(memberships.id, membershipId),
          eq(memberships.organizationId, context.organizationId),
        ),
      )
      .returning({ id: memberships.id, role: memberships.role, status: memberships.status });
    if (!updated) throw new NotFoundException("Member not found");
    await this.audit(context, "member.deactivated", updated.id, {});
    return updated;
  }

  private async assertCanRemoveOwner(
    organizationId: string,
    membershipId: string,
    remove: boolean,
  ) {
    const [target] = await this.db
      .select({ role: memberships.role, status: memberships.status })
      .from(memberships)
      .where(and(eq(memberships.id, membershipId), eq(memberships.organizationId, organizationId)))
      .limit(1);
    if (!target) throw new NotFoundException("Member not found");
    const [result] = await this.db
      .select({ value: count() })
      .from(memberships)
      .where(
        and(
          eq(memberships.organizationId, organizationId),
          eq(memberships.role, "OWNER"),
          eq(memberships.status, "ACTIVE"),
        ),
      );
    assertOwnerInvariant(
      result?.value ?? 0,
      remove && target.role === "OWNER" && target.status === "ACTIVE",
    );
  }

  private async audit(
    context: TenantContext,
    action: string,
    resourceId: string,
    metadata: Record<string, unknown>,
  ) {
    await this.db.insert(activityEvents).values({
      organizationId: context.organizationId,
      actorUserId: context.userId,
      action,
      resourceType: "membership",
      resourceId,
      metadata,
    });
  }
}

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as { code?: unknown; cause?: { code?: unknown } };
  return candidate.code === "23505" || candidate.cause?.code === "23505";
}
