import { and, eq, exportRequests, lte, reportRequests, type createDatabase } from "@nexus/database";
import type { StorageProvider } from "@nexus/storage";
export async function cleanupExpiredArtifacts(
  db: ReturnType<typeof createDatabase>["db"],
  storage: StorageProvider,
  now: Date,
) {
  const rs = await db
      .select({
        id: reportRequests.id,
        organizationId: reportRequests.organizationId,
        objectKey: reportRequests.objectKey,
      })
      .from(reportRequests)
      .where(and(eq(reportRequests.status, "COMPLETED"), lte(reportRequests.expiresAt, now))),
    es = await db
      .select({
        id: exportRequests.id,
        organizationId: exportRequests.organizationId,
        objectKey: exportRequests.objectKey,
      })
      .from(exportRequests)
      .where(and(eq(exportRequests.status, "COMPLETED"), lte(exportRequests.expiresAt, now)));
  for (const r of rs) {
    if (r.objectKey) {
      await storage.deleteObject(r.objectKey);
      await db
        .update(reportRequests)
        .set({ status: "EXPIRED", objectKey: null, updatedAt: now })
        .where(
          and(
            eq(reportRequests.id, r.id),
            eq(reportRequests.organizationId, r.organizationId),
            eq(reportRequests.status, "COMPLETED"),
          ),
        );
    }
  }
  for (const r of es) {
    if (r.objectKey) {
      await storage.deleteObject(r.objectKey);
      await db
        .update(exportRequests)
        .set({ status: "EXPIRED", objectKey: null, updatedAt: now })
        .where(
          and(
            eq(exportRequests.id, r.id),
            eq(exportRequests.organizationId, r.organizationId),
            eq(exportRequests.status, "COMPLETED"),
          ),
        );
    }
  }
}
