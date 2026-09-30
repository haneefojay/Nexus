import { describe, expect, it } from "vitest";
import {
  assetCreateSchema,
  invitationCreateSchema,
  mapViewportSchema,
  siteCreateSchema,
} from "../../src/index.js";

describe("Phase 1 input contracts", () => {
  it("normalizes invitations and excludes owner invitations", () => {
    expect(
      invitationCreateSchema.parse({ email: "  Operator@Example.com ", role: "TECHNICIAN" }),
    ).toEqual({ email: "operator@example.com", role: "TECHNICIAN" });
    expect(
      invitationCreateSchema.safeParse({ email: "owner@example.com", role: "OWNER" }).success,
    ).toBe(false);
  });
  it("requires coordinate pairs", () => {
    expect(siteCreateSchema.safeParse({ name: "West", type: "SOLAR", latitude: 6.5 }).success).toBe(
      false,
    );
    expect(
      assetCreateSchema.safeParse({
        siteId: "019bcb3f-f89a-7d5d-ae9f-67a167895df8",
        assetTypeId: "019bcb3f-f89a-7d5d-ae9f-67a167895df9",
        identifier: "INV-1",
        name: "Inverter",
        longitude: 3.4,
      }).success,
    ).toBe(false);
  });
  it("rejects inverted spatial viewports", () => {
    expect(
      mapViewportSchema.safeParse({ west: 3, south: 7, east: 4, north: 6, zoom: 8 }).success,
    ).toBe(false);
  });
});
