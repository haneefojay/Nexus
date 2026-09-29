import { activityEvents, memberships, organizations, type createDatabase } from "@nexus/database";
import type { OrganizationCreateInput } from "@nexus/validation";
import { ConflictException, Injectable } from "@nestjs/common";

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
      throw error;
    }
  }
}

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as { code?: unknown; cause?: { code?: unknown } };
  return candidate.code === "23505" || candidate.cause?.code === "23505";
}
