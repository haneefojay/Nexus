import { createHash } from "node:crypto";

import { and, eq, reportRequests, type createDatabase } from "@nexus/database";
import type { StorageProvider } from "@nexus/storage";

export interface InspectionReportSnapshot {
  generatedFrom: string;
  organization: { name: string; timezone: string };
  site: { name: string; reference: string | null; address: string | null };
  asset: { name: string; identifier: string } | null;
  inspection: {
    id: string;
    name: string;
    status: string;
    templateVersion: number;
    scheduledFor: string;
    startedAt: string | null;
    submittedAt: string | null;
    approvedAt: string | null;
    closedAt: string | null;
    inspector: string;
    notes: string | null;
  };
  checklist: { label: string; responseType: string; value: unknown; capturedAt: string }[];
  findings: {
    title: string;
    severity: string;
    status: string;
    detectedAt: string;
    actions: { title: string; status: string; dueAt: string; verifiedAt: string | null }[];
  }[];
  evidence: { targetType: string; capturedAt: string | null; contentType: string }[];
}

function clean(value: unknown): string {
  const text =
    value === null || value === undefined
      ? "—"
      : typeof value === "string" || typeof value === "number" || typeof value === "boolean"
        ? String(value)
        : JSON.stringify(value);
  return text.replace(/[\\()\r\n]/g, (character) => `\\${character}`).slice(0, 220);
}

export function renderInspectionPdf(
  snapshot: InspectionReportSnapshot,
  generatedAt: string,
): Uint8Array {
  const lines = [
    "NEXUS INSPECTION REPORT",
    `Organization: ${snapshot.organization.name}`,
    `Site: ${snapshot.site.name}${snapshot.site.reference ? ` (${snapshot.site.reference})` : ""}`,
    `Asset: ${snapshot.asset ? `${snapshot.asset.name} (${snapshot.asset.identifier})` : "Site inspection"}`,
    `Inspection: ${snapshot.inspection.name}`,
    `Template version: ${snapshot.inspection.templateVersion}`,
    `Inspector: ${snapshot.inspection.inspector}`,
    `Status: ${snapshot.inspection.status}`,
    `Scheduled: ${snapshot.inspection.scheduledFor}`,
    `Submitted: ${snapshot.inspection.submittedAt ?? "—"}`,
    `Approved: ${snapshot.inspection.approvedAt ?? "—"}`,
    `Report generated: ${generatedAt}`,
    "",
    "CHECKLIST RESULTS",
    ...snapshot.checklist.map((item) => `${item.label}: ${JSON.stringify(item.value)}`),
    "",
    "FINDINGS AND CORRECTIVE ACTIONS",
    ...(snapshot.findings.length
      ? snapshot.findings.flatMap((finding) => [
          `${finding.severity} · ${finding.title} · ${finding.status}`,
          ...finding.actions.map(
            (action) => `  Action: ${action.title} · ${action.status} · due ${action.dueAt}`,
          ),
        ])
      : ["No findings recorded."]),
    "",
    `Evidence records: ${snapshot.evidence.length}`,
    "This report contains recorded NEXUS source data only.",
  ].slice(0, 180);
  const text = lines
    .map((line, index) => `BT /F1 9 Tf 50 ${790 - index * 12} Td (${clean(line)}) Tj ET`)
    .join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${Buffer.byteLength(text)} >>\nstream\n${text}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("");
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf);
}

export async function generateInspectionReport(
  db: ReturnType<typeof createDatabase>["db"],
  storage: StorageProvider,
  reportRequestId: string,
  organizationId: string,
  now = new Date(),
  retentionDays = 30,
): Promise<void> {
  const [record] = await db
    .select({ status: reportRequests.status, snapshot: reportRequests.snapshot })
    .from(reportRequests)
    .where(
      and(
        eq(reportRequests.id, reportRequestId),
        eq(reportRequests.organizationId, organizationId),
      ),
    )
    .limit(1);
  if (!record) throw new Error("REPORT_NOT_FOUND");
  if (record.status === "COMPLETED" || record.status === "EXPIRED") return;
  await db
    .update(reportRequests)
    .set({ status: "PROCESSING", processingAt: now, errorCode: null, updatedAt: now })
    .where(
      and(
        eq(reportRequests.id, reportRequestId),
        eq(reportRequests.organizationId, organizationId),
      ),
    );
  try {
    const pdf = renderInspectionPdf(record.snapshot as InspectionReportSnapshot, now.toISOString());
    const checksum = createHash("sha256").update(pdf).digest("hex");
    const stored = await storage.writePrivateArtifact({
      category: "reports",
      organizationId,
      artifactId: reportRequestId,
      extension: "pdf",
      contentType: "application/pdf",
      body: pdf,
      checksum,
    });
    await db
      .update(reportRequests)
      .set({
        status: "COMPLETED",
        objectKey: stored.objectKey,
        checksum: stored.checksum,
        size: stored.size,
        completedAt: now,
        expiresAt: new Date(now.getTime() + retentionDays * 24 * 60 * 60 * 1_000),
        errorCode: null,
        updatedAt: now,
      })
      .where(
        and(
          eq(reportRequests.id, reportRequestId),
          eq(reportRequests.organizationId, organizationId),
        ),
      );
  } catch (error) {
    await db
      .update(reportRequests)
      .set({ status: "FAILED", errorCode: "REPORT_GENERATION_FAILED", updatedAt: new Date() })
      .where(
        and(
          eq(reportRequests.id, reportRequestId),
          eq(reportRequests.organizationId, organizationId),
        ),
      );
    throw error;
  }
}
