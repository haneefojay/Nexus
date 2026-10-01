import type { NexusAuth } from "@nexus/auth";
import { and, eq, memberships, organizations, users, type createDatabase } from "@nexus/database";
import { assertPermission, type MembershipRole, type Permission } from "@nexus/domain";
import { ForbiddenException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import type { FastifyRequest } from "fastify";

import { AUTH_TOKEN, DATABASE_TOKEN } from "../tokens.js";

export interface ActorContext {
  requestId: string;
  userId: string;
  email: string;
  name: string;
  sessionId: string;
}

export interface TenantContext extends ActorContext {
  organizationId: string;
  organizationName: string;
  membershipId: string;
  role: MembershipRole;
}

function requestHeaders(request: FastifyRequest): Headers {
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) value.forEach((item) => headers.append(name, item));
    else if (value !== undefined) headers.set(name, String(value));
  }
  return headers;
}

@Injectable()
export class RequestContextService {
  constructor(
    @Inject(AUTH_TOKEN) private readonly auth: NexusAuth,
    @Inject(DATABASE_TOKEN) private readonly db: ReturnType<typeof createDatabase>["db"],
  ) {}

  async requireActor(request: FastifyRequest): Promise<ActorContext> {
    const result = await this.auth.api.getSession({ headers: requestHeaders(request) });
    if (!result?.user.emailVerified)
      throw new UnauthorizedException("A verified session is required");

    const user = await this.db.query.users.findFirst({
      columns: { active: true },
      where: (table, operators) => operators.eq(table.id, result.user.id),
    });
    if (!user?.active) throw new UnauthorizedException("The account is unavailable");

    return {
      requestId: request.id,
      userId: result.user.id,
      email: result.user.email,
      name: result.user.name,
      sessionId: result.session.id,
    };
  }

  async requireTenant(request: FastifyRequest, permission: Permission): Promise<TenantContext> {
    const actor = await this.requireActor(request);
    const header = request.headers["x-organization-id"];
    const organizationId = Array.isArray(header) ? header[0] : header;
    if (!organizationId) throw new ForbiddenException("Organization context is required");

    const [membership] = await this.db
      .select({
        id: memberships.id,
        organizationId: memberships.organizationId,
        organizationName: organizations.name,
        role: memberships.role,
      })
      .from(memberships)
      .innerJoin(organizations, eq(organizations.id, memberships.organizationId))
      .innerJoin(users, eq(users.id, memberships.userId))
      .where(
        and(
          eq(memberships.userId, actor.userId),
          eq(memberships.organizationId, organizationId),
          eq(memberships.status, "ACTIVE"),
          eq(users.active, true),
        ),
      )
      .limit(1);
    if (!membership) throw new ForbiddenException("Active organization membership is required");

    try {
      assertPermission(membership.role, permission);
    } catch {
      throw new ForbiddenException("The active membership cannot perform this action");
    }

    return {
      ...actor,
      organizationId: membership.organizationId,
      organizationName: membership.organizationName,
      membershipId: membership.id,
      role: membership.role,
    };
  }
}
