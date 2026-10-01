import { performance } from "node:perf_hooks";

import { parse } from "csv-parse/sync";

import { renderCsv } from "./exports.js";
import { renderInspectionPdf, type InspectionReportSnapshot } from "./reporting.js";

function measure(name: string, rows: number, limitMs: number, run: () => unknown): void {
  const started = performance.now();
  run();
  const duration = performance.now() - started;
  console.info(
    JSON.stringify({
      operation: name,
      rows,
      durationMs: Math.round(duration),
      limitMs,
    }),
  );
  if (duration > limitMs) throw new Error(`${name} exceeded ${limitMs}ms`);
}

const importCsv = [
  "identifier,name",
  ...Array.from({ length: 100_000 }, (_, i) => `A-${i},Synthetic asset ${i}`),
].join("\n");
measure("import-parse-100k", 100_000, 30_000, () => {
  const rows = parse(importCsv, { columns: true, skip_empty_lines: true });
  if (rows.length !== 100_000) throw new Error("Import row count mismatch");
});
measure("export-render-10k", 10_000, 10_000, () =>
  renderCsv({
    columns: ["identifier", "name"],
    rows: Array.from({ length: 10_000 }, (_, i) => [`A-${i}`, `Synthetic asset ${i}`]),
  }),
);
const snapshot: InspectionReportSnapshot = {
  generatedFrom: "immutable-snapshot",
  organization: { name: "Fictional Operations", timezone: "UTC" },
  site: { name: "Fictional Site", reference: "DEMO", address: null },
  asset: null,
  inspection: {
    id: "demo",
    name: "Inspection",
    status: "SUBMITTED",
    templateVersion: 1,
    scheduledFor: new Date(0).toISOString(),
    startedAt: null,
    submittedAt: new Date(0).toISOString(),
    approvedAt: null,
    closedAt: null,
    inspector: "Fictional Inspector",
    notes: null,
  },
  checklist: Array.from({ length: 100 }, (_, i) => ({
    label: `Check ${i}`,
    responseType: "BOOLEAN",
    value: true,
    capturedAt: new Date(0).toISOString(),
  })),
  findings: [],
  evidence: [],
};
measure("report-render", 100, 2_000, () =>
  renderInspectionPdf(snapshot, new Date(0).toISOString()),
);
