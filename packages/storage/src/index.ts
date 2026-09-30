import { randomUUID } from "node:crypto";

import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const evidenceContentTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;
export type EvidenceContentType = (typeof evidenceContentTypes)[number];
export const maximumEvidenceBytes = 20 * 1024 * 1024;

export interface AuthorizedUploadRequest {
  organizationId: string;
  actorId: string;
  targetType: "FINDING" | "CORRECTIVE_ACTION";
  targetId: string;
  contentType: EvidenceContentType;
  contentLength: number;
  checksum: string;
}

export interface PresignedUpload {
  objectKey: string;
  uploadUrl: string;
  expiresAt: Date;
  requiredHeaders: Record<string, string>;
}

export interface StoredObjectMetadata {
  contentType: string | undefined;
  contentLength: number | undefined;
  checksum: string | undefined;
}

export interface StorageProvider {
  createAuthorizedUpload(request: AuthorizedUploadRequest): Promise<PresignedUpload>;
  headObject(objectKey: string): Promise<StoredObjectMetadata | null>;
  readObjectPrefix(objectKey: string, bytes: number): Promise<Uint8Array>;
  createAuthorizedDownload(objectKey: string, expiresInSeconds: number): Promise<string>;
  deleteObject(objectKey: string): Promise<void>;
}

export interface S3StorageOptions {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle?: boolean;
}

export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(options: S3StorageOptions) {
    this.bucket = options.bucket;
    this.client = new S3Client({
      endpoint: options.endpoint,
      region: options.region,
      forcePathStyle: options.forcePathStyle ?? true,
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      },
    });
  }

  async ensureBucket(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
    }
  }

  async createAuthorizedUpload(request: AuthorizedUploadRequest): Promise<PresignedUpload> {
    if (!evidenceContentTypes.includes(request.contentType))
      throw new Error("Unsupported evidence content type");
    if (request.contentLength <= 0 || request.contentLength > maximumEvidenceBytes)
      throw new Error("Evidence size is outside the allowed range");
    const objectKey = [
      "evidence",
      request.organizationId,
      request.targetType.toLowerCase(),
      request.targetId,
      randomUUID(),
    ].join("/");
    const checksumBase64 = Buffer.from(request.checksum, "hex").toString("base64");
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
      ContentType: request.contentType,
      ContentLength: request.contentLength,
      ChecksumSHA256: checksumBase64,
      Metadata: {
        checksum: request.checksum,
        uploader: request.actorId,
        target: `${request.targetType}:${request.targetId}`,
      },
    });
    const expiresIn = 5 * 60;
    return {
      objectKey,
      uploadUrl: await getSignedUrl(this.client, command, { expiresIn }),
      expiresAt: new Date(Date.now() + expiresIn * 1_000),
      requiredHeaders: {
        "content-type": request.contentType,
        "x-amz-checksum-sha256": checksumBase64,
      },
    };
  }

  async headObject(objectKey: string): Promise<StoredObjectMetadata | null> {
    try {
      const result = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: objectKey }),
      );
      return {
        contentType: result.ContentType,
        contentLength: result.ContentLength,
        checksum:
          result.Metadata?.checksum ??
          (result.ChecksumSHA256
            ? Buffer.from(result.ChecksumSHA256, "base64").toString("hex")
            : undefined),
      };
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "$metadata" in error &&
        (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404
      )
        return null;
      throw error;
    }
  }

  async readObjectPrefix(objectKey: string, bytes: number): Promise<Uint8Array> {
    const result = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        Range: `bytes=0-${Math.max(0, Math.min(bytes, 512) - 1)}`,
      }),
    );
    return result.Body?.transformToByteArray() ?? new Uint8Array();
  }

  createAuthorizedDownload(objectKey: string, expiresInSeconds: number): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        ResponseContentDisposition: "attachment",
      }),
      { expiresIn: Math.min(Math.max(expiresInSeconds, 1), 300) },
    );
  }

  async deleteObject(objectKey: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: objectKey }));
  }
}
