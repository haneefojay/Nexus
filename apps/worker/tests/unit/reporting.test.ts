import { describe, expect, it } from "vitest";
import { renderInspectionPdf, type InspectionReportSnapshot } from "../../src/reporting.js";

const snapshot: InspectionReportSnapshot = {
  generatedFrom: "immutable-submission",
  organization: { name: "Fictional Grid", timezone: "UTC" },
  site: { name: "North", reference: "N-1", address: null },
  asset: { name: "Inverter", identifier: "INV-1" },
  inspection: {
    id: "run",
    name: "Monthly",
    status: "SUBMITTED",
    templateVersion: 1,
    scheduledFor: "2026-01-01T00:00:00.000Z",
    startedAt: null,
    submittedAt: "2026-01-01T01:00:00.000Z",
    approvedAt: null,
    closedAt: null,
    inspector: "Fictional Inspector",
    notes: null,
  },
  checklist: [
    {
      label: "Enclosure",
      responseType: "PASS_FAIL",
      value: "PASS",
      capturedAt: "2026-01-01T00:30:00.000Z",
    },
  ],
  findings: [],
  evidence: [],
};

describe("inspection PDF", () => {
  it("renders a deterministic valid PDF from the immutable snapshot", () => {
    const first = renderInspectionPdf(snapshot, "2026-01-02T00:00:00.000Z");
    const second = renderInspectionPdf(snapshot, "2026-01-02T00:00:00.000Z");
    expect(Buffer.from(first).subarray(0, 5).toString()).toBe("%PDF-");
    expect(first).toEqual(second);
  });
});
