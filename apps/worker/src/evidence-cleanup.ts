import { and, eq, evidenceUploadGrants, lte, type createDatabase } from "@nexus/database";
import type { StorageProvider } from "@nexus/storage";

type Database = ReturnType<typeof createDatabase>["db"];

export async function cleanupExpiredEvidenceUploads(
  db: Database,
  storage: StorageProvider,
  now = new Date(),
): Promise<number> {
  const grants = await db
    .select({ id: evidenceUploadGrants.id, objectKey: evidenceUploadGrants.objectKey })
    .from(evidenceUploadGrants)
    .where(and(eq(evidenceUploadGrants.status, "ISSUED"), lte(evidenceUploadGrants.expiresAt, now)))
    .limit(100);
  let cleaned = 0;
  for (const grant of grants) {
    await storage.deleteObject(grant.objectKey);
    const updated = await db
      .update(evidenceUploadGrants)
      .set({ status: "REJECTED" })
      .where(and(eq(evidenceUploadGrants.id, grant.id), eq(evidenceUploadGrants.status, "ISSUED")))
      .returning({ id: evidenceUploadGrants.id });
    if (updated[0]) cleaned += 1;
  }
  return cleaned;
}
