import {
  activityEvents,
  and,
  eq,
  memberships,
  organizations,
  type createDatabase,
} from "@nexus/database";
import type { OrganizationCreateInput } from "@nexus/validation";
import { ConflictException, Injectable, InternalServerErrorException } from "@nestjs/common";

@Injectable()
export class OrganizationsService {
  constructor(private readonly db: ReturnType<typeof createDatabase>["db"]) {}

  async create(input: OrganizationCreateInput, userId: string) {
    try {
      return await this.db.transaction(async (transaction) => {
        const [organization] = await transaction.insert(organizations).values(input).returning({
          id: organizations.id,
          name: organizations.name,
          slug: organizations.slug,
          timezone: organizations.timezone,
          createdAt: organizations.createdAt,
        });
        if (!organization) throw new Error("Organization insert returned no record");

        await transaction.insert(memberships).values({
          userId,
          organizationId: organization.id,
          role: "OWNER",
          status: "ACTIVE",
        });
        await transaction.insert(activityEvents).values({
          organizationId: organization.id,
          actorUserId: userId,
          action: "organization.created",
          resourceType: "organization",
          resourceId: organization.id,
          metadata: { slug: organization.slug },
        });

        return organization;
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException("Organization could not be created with those details");
      }
      if (process.env.NODE_ENV === "test") {
        throw new InternalServerErrorException(
          `Organization persistence failed (${databaseErrorCode(error)})`,
        );
      }
      throw error;
    }
  }

  async list(userId: string) {
    return this.db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        timezone: organizations.timezone,
        role: memberships.role,
      })
      .from(memberships)
      .innerJoin(organizations, eq(organizations.id, memberships.organizationId))
      .where(and(eq(memberships.userId, userId), eq(memberships.status, "ACTIVE")));
  }
}

function databaseErrorCode(error: unknown): string {
  if (typeof error !== "object" || error === null) return "unknown";
  const candidate = error as { code?: unknown; cause?: { code?: unknown } };
  const code = candidate.code ?? candidate.cause?.code;
  return typeof code === "string" && /^[A-Z0-9]{5}$/.test(code) ? code : "unknown";
}

function isUniqueViolation(error: unknown): boolean {
  return databaseErrorCode(error) === "23505";
}
