import { ConflictException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { OrganizationsService } from "../../src/organizations/organizations.service.js";

describe("OrganizationsService", () => {
  it("creates the organization, owner, and audit event in one transaction", async () => {
    const insert = vi
      .fn()
      .mockReturnValueOnce({
        values: vi.fn(() => ({
          returning: vi.fn(async () => [
            {
              id: "01990000-0000-7000-8000-000000000001",
              name: "Grid Operations",
              slug: "grid-operations",
              timezone: "Africa/Lagos",
              createdAt: new Date("2026-09-29T00:00:00Z"),
            },
          ]),
        })),
      })
      .mockReturnValue({ values: vi.fn(async () => undefined) });
    const db = { transaction: vi.fn((callback) => callback({ insert })) };
    const service = new OrganizationsService(db as never);

    const organization = await service.create(
      { name: "Grid Operations", slug: "grid-operations", timezone: "Africa/Lagos" },
      "01990000-0000-7000-8000-000000000002",
    );

    expect(organization.slug).toBe("grid-operations");
    expect(insert).toHaveBeenCalledTimes(3);
  });

  it("maps unique conflicts without exposing database detail", async () => {
    const db = {
      transaction: vi.fn(async () => {
        throw Object.assign(new Error("duplicate slug"), { code: "23505" });
      }),
    };
    const service = new OrganizationsService(db as never);

    await expect(
      service.create(
        { name: "Grid Operations", slug: "grid-operations", timezone: "Africa/Lagos" },
        "01990000-0000-7000-8000-000000000002",
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
