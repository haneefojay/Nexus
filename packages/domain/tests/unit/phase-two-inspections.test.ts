import { describe, expect, it } from "vitest";

import {
  DomainRuleError,
  assertInspectionRunTransition,
  calculateInspectionCoverage,
  inspectionOccurrenceAt,
  isInspectionOverdue,
  sortInspectionAttention,
  validateInspectionResponses,
  type InspectionTemplateItemDefinition,
} from "../../src/index.js";

describe("inspection run lifecycle", () => {
  it("supports the direct close path when review is not required", () => {
    expect(() => assertInspectionRunTransition("ASSIGNED", "IN_PROGRESS", false)).not.toThrow();
    expect(() => assertInspectionRunTransition("IN_PROGRESS", "SUBMITTED", false)).not.toThrow();
    expect(() => assertInspectionRunTransition("SUBMITTED", "CLOSED", false)).not.toThrow();
  });

  it("requires the configured review path", () => {
    expect(() => assertInspectionRunTransition("SUBMITTED", "REVIEW_REQUIRED", true)).not.toThrow();
    expect(() => assertInspectionRunTransition("REVIEW_REQUIRED", "APPROVED", true)).not.toThrow();
    expect(() => assertInspectionRunTransition("APPROVED", "CLOSED", true)).not.toThrow();
    expect(() => assertInspectionRunTransition("SUBMITTED", "CLOSED", true)).toThrow(
      expect.objectContaining<Partial<DomainRuleError>>({
        code: "INSPECTION_REVIEW_PATH_REQUIRED",
      }),
    );
  });

  it("rejects edits to terminal runs and unsupported transitions", () => {
    expect(() => assertInspectionRunTransition("CLOSED", "IN_PROGRESS", false)).toThrow(
      expect.objectContaining<Partial<DomainRuleError>>({
        code: "INVALID_INSPECTION_RUN_TRANSITION",
      }),
    );
    expect(() => assertInspectionRunTransition("IN_PROGRESS", "CLOSED", false)).toThrow();
  });
});

describe("inspection response validation", () => {
  const items: InspectionTemplateItemDefinition[] = [
    {
      id: "condition",
      label: "Condition",
      responseType: "PASS_FAIL",
      required: true,
    },
    {
      id: "voltage",
      label: "Voltage",
      responseType: "NUMERIC",
      required: true,
      minimum: 200,
      maximum: 260,
    },
    {
      id: "mode",
      label: "Mode",
      responseType: "SINGLE_CHOICE",
      required: false,
      options: ["AUTO", "MANUAL"],
    },
  ];

  it("accepts responses matching the immutable template definition", () => {
    expect(
      validateInspectionResponses(items, [
        { itemId: "condition", value: true },
        { itemId: "voltage", value: 240 },
        { itemId: "mode", value: "AUTO" },
      ]),
    ).toEqual([]);
  });

  it("reports missing, out-of-range, duplicate, and unknown responses", () => {
    expect(
      validateInspectionResponses(items, [
        { itemId: "voltage", value: 300 },
        { itemId: "voltage", value: 230 },
        { itemId: "removed-item", value: "stale" },
      ]).map((issue) => issue.code),
    ).toEqual(["DUPLICATE_RESPONSE", "UNKNOWN_ITEM", "RESPONSE_REQUIRED", "NUMBER_ABOVE_MAXIMUM"]);
  });
});

describe("inspection recurrence and deadlines", () => {
  it("preserves local wall time across a daylight-saving boundary", () => {
    const start = new Date("2026-03-01T14:00:00.000Z"); // 09:00 America/New_York
    expect(
      inspectionOccurrenceAt(start, { type: "WEEKLY" }, 2, "America/New_York").toISOString(),
    ).toBe("2026-03-15T13:00:00.000Z");
  });

  it("clamps monthly recurrence to the final valid local day", () => {
    const start = new Date("2026-01-31T08:00:00.000Z");
    expect(
      inspectionOccurrenceAt(start, { type: "MONTHLY" }, 1, "Africa/Lagos").toISOString(),
    ).toBe("2026-02-28T08:00:00.000Z");
    expect(
      inspectionOccurrenceAt(start, { type: "MONTHLY" }, 2, "Africa/Lagos").toISOString(),
    ).toBe("2026-03-31T08:00:00.000Z");
  });

  it("uses the strict deadline boundary and ignores submitted history", () => {
    const dueAt = new Date("2026-09-30T10:00:00.000Z");
    expect(isInspectionOverdue(dueAt, "IN_PROGRESS", new Date(dueAt))).toBe(false);
    expect(isInspectionOverdue(dueAt, "IN_PROGRESS", new Date(dueAt.getTime() + 1))).toBe(true);
    expect(isInspectionOverdue(dueAt, "SUBMITTED", new Date(dueAt.getTime() + 1))).toBe(false);
  });
});

describe("inspection operational calculations", () => {
  const now = new Date("2026-09-30T10:00:00.000Z");

  it("counts only scheduled runs and never counts in-progress work as completed", () => {
    expect(
      calculateInspectionCoverage(
        [
          {
            siteId: "site-a",
            scheduledFor: new Date("2026-09-29T09:00:00.000Z"),
            dueAt: new Date("2026-09-29T10:00:00.000Z"),
            status: "CLOSED",
          },
          {
            siteId: "site-a",
            scheduledFor: new Date("2026-09-30T09:00:00.000Z"),
            dueAt: new Date("2026-09-30T09:59:59.000Z"),
            status: "IN_PROGRESS",
          },
          {
            siteId: "site-a",
            scheduledFor: new Date("2026-10-01T09:00:00.000Z"),
            dueAt: new Date("2026-10-01T10:00:00.000Z"),
            status: "ASSIGNED",
          },
        ],
        now,
      ),
    ).toEqual([
      {
        siteId: "site-a",
        required: 2,
        completed: 1,
        overdue: 1,
        skipped: 0,
        completionRate: 0.5,
      },
    ]);
  });

  it("orders attention using the explicit operational priority", () => {
    expect(
      sortInspectionAttention([
        { source: "ASSET_ATTENTION", id: "asset" },
        { source: "OVERDUE_INSPECTION", id: "inspection" },
        { source: "CRITICAL_FINDING", id: "finding" },
      ]).map((item) => item.id),
    ).toEqual(["finding", "inspection", "asset"]);
  });
});

describe("inspection reportability", () => {
  it("permits only submitted immutable lifecycle states", async () => {
    const { isInspectionReportable } = await import("../../src/index.js");
    expect(isInspectionReportable("IN_PROGRESS")).toBe(false);
    expect(isInspectionReportable("CANCELLED")).toBe(false);
    expect(isInspectionReportable("SUBMITTED")).toBe(true);
    expect(isInspectionReportable("REVIEW_REQUIRED")).toBe(true);
    expect(isInspectionReportable("APPROVED")).toBe(true);
    expect(isInspectionReportable("CLOSED")).toBe(true);
  });
});
