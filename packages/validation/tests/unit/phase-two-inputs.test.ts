import { describe, expect, it } from "vitest";

import { inspectionPlanCreateSchema, inspectionTemplateCreateSchema } from "../../src/index.js";

describe("Phase 2 template input", () => {
  it("accepts ordered supported response definitions", () => {
    expect(
      inspectionTemplateCreateSchema.safeParse({
        name: "Generator daily",
        schema: {
          sections: [
            {
              id: "electrical",
              title: "Electrical",
              items: [
                {
                  id: "voltage",
                  label: "Voltage",
                  responseType: "NUMERIC",
                  required: true,
                  minimum: 200,
                  maximum: 260,
                },
              ],
            },
          ],
        },
      }).success,
    ).toBe(true);
  });

  it("rejects duplicate item IDs and invalid single-choice definitions", () => {
    const result = inspectionTemplateCreateSchema.safeParse({
      name: "Invalid",
      schema: {
        sections: [
          {
            id: "one",
            title: "One",
            items: [
              {
                id: "same",
                label: "First",
                responseType: "SINGLE_CHOICE",
                required: true,
                options: ["Only"],
              },
              {
                id: "same",
                label: "Second",
                responseType: "YES_NO",
                required: true,
              },
            ],
          },
        ],
      },
    });
    expect(result.success).toBe(false);
  });
});

describe("Phase 2 plan input", () => {
  it("requires a consistent target, assignment, recurrence, and offset timestamp", () => {
    expect(
      inspectionPlanCreateSchema.safeParse({
        templateVersionId: "01999999-9999-7999-8999-999999999999",
        name: "Daily site inspection",
        targetType: "SITE",
        siteId: "01999999-9999-7999-8999-999999999998",
        recurrence: { type: "DAILY" },
        startsAt: "2026-09-30T09:00:00+01:00",
        assignedRole: "TECHNICIAN",
      }).success,
    ).toBe(true);

    expect(
      inspectionPlanCreateSchema.safeParse({
        templateVersionId: "01999999-9999-7999-8999-999999999999",
        name: "Broken",
        targetType: "ASSET",
        siteId: "01999999-9999-7999-8999-999999999998",
        recurrence: { type: "CUSTOM_DAYS" },
        startsAt: "2026-09-30T09:00:00",
      }).success,
    ).toBe(false);
  });
});
