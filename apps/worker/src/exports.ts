import { createHash } from "node:crypto";

import { and, eq, exportRequests, type createDatabase } from "@nexus/database";
import type { StorageProvider } from "@nexus/storage";

export interface CsvSnapshot {
  columns: readonly string[];
  rows: readonly (readonly (string | number | boolean | null)[])[];
}

export function protectCsvFormula(value: string): string {
  const trimmed = value.trimStart();
  return /^[=+\-@\t\r]/.test(trimmed) ? `'${value}` : value;
}

export function csvCell(value: string | number | boolean | null): string {
  const text = protectCsvFormula(value === null ? "" : String(value));
  return `"${text.replaceAll('"', '""')}"`;
}

export function renderCsv(snapshot: CsvSnapshot): Uint8Array {
  const lines = [
    snapshot.columns.map(csvCell).join(","),
    ...snapshot.rows.map((row) => row.map(csvCell).join(",")),
  ];
  return Buffer.from(`\uFEFF${lines.join("\r\n")}\r\n`, "utf8");
}

export async function generateOperationalExport(
  db: ReturnType<typeof createDatabase>["db"],
  storage: StorageProvider,
  exportRequestId: string,
  organizationId: string,
  now = new Date(),
  retentionDays = 30,
): Promise<void> {
  const [record] = await db
    .select({ status: exportRequests.status, snapshot: exportRequests.snapshot })
    .from(exportRequests)
    .where(
      and(
        eq(exportRequests.id, exportRequestId),
        eq(exportRequests.organizationId, organizationId),
      ),
    )
    .limit(1);
  if (!record) throw new Error("EXPORT_NOT_FOUND");
  if (record.status === "COMPLETED" || record.status === "EXPIRED") return;
  await db
    .update(exportRequests)
    .set({ status: "PROCESSING", processingAt: now, errorCode: null, updatedAt: now })
    .where(
      and(
        eq(exportRequests.id, exportRequestId),
        eq(exportRequests.organizationId, organizationId),
      ),
    );
  try {
    const csv = renderCsv(record.snapshot as CsvSnapshot);
    const checksum = createHash("sha256").update(csv).digest("hex");
    const stored = await storage.writePrivateArtifact({
      category: "exports",
      organizationId,
      artifactId: exportRequestId,
      extension: "csv",
      contentType: "text/csv",
      body: csv,
      checksum,
    });
    await db
      .update(exportRequests)
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
          eq(exportRequests.id, exportRequestId),
          eq(exportRequests.organizationId, organizationId),
        ),
      );
  } catch (error) {
    await db
      .update(exportRequests)
      .set({ status: "FAILED", errorCode: "EXPORT_GENERATION_FAILED", updatedAt: new Date() })
      .where(
        and(
          eq(exportRequests.id, exportRequestId),
          eq(exportRequests.organizationId, organizationId),
        ),
      );
    throw error;
  }
}
