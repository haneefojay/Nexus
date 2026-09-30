import {
  activityEvents,
  and,
  correctiveActions,
  eq,
  evidence,
  evidenceUploadGrants,
  inspectionFindings,
  storageObjects,
  type createDatabase,
} from "@nexus/database";
import type { StorageProvider } from "@nexus/storage";
import type { EvidenceFinalizeInput, EvidenceUploadAuthorizeInput } from "@nexus/validation";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import type { TenantContext } from "../context/request-context.service.js";

@Injectable()
export class EvidenceService {
  constructor(
    private readonly db: ReturnType<typeof createDatabase>["db"],
    private readonly storage: StorageProvider,
  ) {}

  async authorize(context: TenantContext, input: EvidenceUploadAuthorizeInput) {
    await this.assertTarget(context.organizationId, input.targetType, input.targetId);
    const presigned = await this.storage.createAuthorizedUpload({
      organizationId: context.organizationId,
      actorId: context.userId,
      targetType: input.targetType,
      targetId: input.targetId,
      contentType: input.contentType,
      contentLength: input.contentLength,
      checksum: input.checksum,
    });
    const [grant] = await this.db
      .insert(evidenceUploadGrants)
      .values({
        organizationId: context.organizationId,
        targetType: input.targetType,
        targetId: input.targetId,
        uploaderUserId: context.userId,
        objectKey: presigned.objectKey,
        originalName: input.originalName,
        contentType: input.contentType,
        expectedSize: input.contentLength,
        expectedChecksum: input.checksum,
        expiresAt: presigned.expiresAt,
      })
      .returning({ id: evidenceUploadGrants.id });
    return {
      uploadGrantId: grant!.id,
      uploadUrl: presigned.uploadUrl,
      expiresAt: presigned.expiresAt,
      requiredHeaders: presigned.requiredHeaders,
    };
  }

  async finalize(context: TenantContext, input: EvidenceFinalizeInput) {
    const [grant] = await this.db
      .select()
      .from(evidenceUploadGrants)
      .where(
        and(
          eq(evidenceUploadGrants.id, input.uploadGrantId),
          eq(evidenceUploadGrants.organizationId, context.organizationId),
          eq(evidenceUploadGrants.uploaderUserId, context.userId),
        ),
      );
    if (!grant) throw new NotFoundException("Upload authorization not found");
    if (grant.status === "FINALIZED") {
      const [existing] = await this.db
        .select()
        .from(storageObjects)
        .innerJoin(evidence, eq(evidence.storageObjectId, storageObjects.id))
        .where(eq(storageObjects.uploadGrantId, grant.id));
      if (!existing) throw new ConflictException("Upload finalization state is unavailable");
      return existing.evidence;
    }
    if (grant.status !== "ISSUED" || grant.expiresAt < new Date())
      throw new ConflictException("Upload authorization is no longer valid");
    await this.assertTarget(context.organizationId, grant.targetType, grant.targetId);
    const actual = await this.storage.headObject(grant.objectKey);
    if (!actual) throw new BadRequestException("Uploaded evidence is not available");
    const prefix = await this.storage.readObjectPrefix(grant.objectKey, 16);
    const matches =
      actual.contentLength === grant.expectedSize &&
      actual.contentType === grant.contentType &&
      actual.checksum === grant.expectedChecksum &&
      contentMatchesMime(prefix, grant.contentType);
    if (!matches) {
      await this.rejectGrant(grant.id, grant.objectKey);
      throw new BadRequestException("Uploaded evidence did not pass validation");
    }
    return this.db.transaction(async (transaction) => {
      const [object] = await transaction
        .insert(storageObjects)
        .values({
          organizationId: context.organizationId,
          uploadGrantId: grant.id,
          objectKey: grant.objectKey,
          originalName: grant.originalName,
          contentType: grant.contentType,
          size: grant.expectedSize,
          checksum: grant.expectedChecksum,
        })
        .returning();
      const [created] = await transaction
        .insert(evidence)
        .values({
          organizationId: context.organizationId,
          targetType: grant.targetType,
          targetId: grant.targetId,
          storageObjectId: object!.id,
          uploaderUserId: context.userId,
          capturedAt: input.capturedAt ? new Date(input.capturedAt) : null,
          checksum: grant.expectedChecksum,
          latitude: input.latitude,
          longitude: input.longitude,
          deviceMetadata: input.deviceMetadata,
          note: input.note,
        })
        .returning();
      await transaction
        .update(evidenceUploadGrants)
        .set({ status: "FINALIZED", finalizedAt: new Date() })
        .where(
          and(eq(evidenceUploadGrants.id, grant.id), eq(evidenceUploadGrants.status, "ISSUED")),
        );
      await transaction.insert(activityEvents).values({
        organizationId: context.organizationId,
        actorUserId: context.userId,
        action: "evidence.added",
        resourceType: "evidence",
        resourceId: created!.id,
        metadata: { targetType: grant.targetType, targetId: grant.targetId },
      });
      return created!;
    });
  }

  async authorizeDownload(context: TenantContext, id: string) {
    const [record] = await this.db
      .select({
        targetType: evidence.targetType,
        targetId: evidence.targetId,
        objectKey: storageObjects.objectKey,
        originalName: storageObjects.originalName,
        contentType: storageObjects.contentType,
      })
      .from(evidence)
      .innerJoin(
        storageObjects,
        and(
          eq(storageObjects.id, evidence.storageObjectId),
          eq(storageObjects.organizationId, evidence.organizationId),
        ),
      )
      .where(and(eq(evidence.id, id), eq(evidence.organizationId, context.organizationId)));
    if (!record) throw new NotFoundException("Evidence not found");
    await this.assertTarget(context.organizationId, record.targetType, record.targetId);
    return {
      downloadUrl: await this.storage.createAuthorizedDownload(record.objectKey, 300),
      expiresAt: new Date(Date.now() + 300_000),
      filename: record.originalName,
      contentType: record.contentType,
    };
  }

  private async assertTarget(
    organizationId: string,
    targetType: "FINDING" | "CORRECTIVE_ACTION",
    targetId: string,
  ) {
    const table = targetType === "FINDING" ? inspectionFindings : correctiveActions;
    const [target] = await this.db
      .select({ id: table.id })
      .from(table)
      .where(and(eq(table.id, targetId), eq(table.organizationId, organizationId)));
    if (!target) throw new NotFoundException("Evidence target not found");
  }

  private async rejectGrant(id: string, objectKey: string) {
    await this.db
      .update(evidenceUploadGrants)
      .set({ status: "REJECTED" })
      .where(eq(evidenceUploadGrants.id, id));
    try {
      await this.storage.deleteObject(objectKey);
    } catch {
      throw new ForbiddenException("Uploaded evidence could not be accepted");
    }
  }
}

export function contentMatchesMime(bytes: Uint8Array, mime: string): boolean {
  const starts = (...expected: number[]) =>
    expected.every((value, index) => bytes[index] === value);
  if (mime === "image/jpeg") return starts(0xff, 0xd8, 0xff);
  if (mime === "image/png") return starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  if (mime === "application/pdf") return starts(0x25, 0x50, 0x44, 0x46, 0x2d);
  if (mime === "image/webp")
    return (
      starts(0x52, 0x49, 0x46, 0x46) &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    );
  return false;
}
