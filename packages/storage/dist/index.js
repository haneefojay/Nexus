import { randomUUID } from "node:crypto";
import { CreateBucketCommand, DeleteObjectCommand, GetObjectCommand, HeadBucketCommand, HeadObjectCommand, PutObjectCommand, S3Client, } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
export const evidenceContentTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
];
export const maximumEvidenceBytes = 20 * 1024 * 1024;
export class S3StorageProvider {
    client;
    bucket;
    constructor(options) {
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
    async ensureBucket() {
        try {
            await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
        }
        catch {
            await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
        }
    }
    async createAuthorizedUpload(request) {
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
    async headObject(objectKey) {
        try {
            const result = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: objectKey }));
            return {
                contentType: result.ContentType,
                contentLength: result.ContentLength,
                checksum: result.Metadata?.checksum ??
                    (result.ChecksumSHA256
                        ? Buffer.from(result.ChecksumSHA256, "base64").toString("hex")
                        : undefined),
            };
        }
        catch (error) {
            if (typeof error === "object" &&
                error !== null &&
                "$metadata" in error &&
                error.$metadata?.httpStatusCode === 404)
                return null;
            throw error;
        }
    }
    async readObjectPrefix(objectKey, bytes) {
        const result = await this.client.send(new GetObjectCommand({
            Bucket: this.bucket,
            Key: objectKey,
            Range: `bytes=0-${Math.max(0, Math.min(bytes, 512) - 1)}`,
        }));
        return result.Body?.transformToByteArray() ?? new Uint8Array();
    }
    createAuthorizedDownload(objectKey, expiresInSeconds) {
        return getSignedUrl(this.client, new GetObjectCommand({
            Bucket: this.bucket,
            Key: objectKey,
            ResponseContentDisposition: "attachment",
        }), { expiresIn: Math.min(Math.max(expiresInSeconds, 1), 300) });
    }
    async writePrivateArtifact(request) {
        const safe = /^[0-9a-f-]{32,36}$/i;
        if (!safe.test(request.organizationId) || !safe.test(request.artifactId))
            throw new Error("Artifact identity is invalid");
        const objectKey = `${request.category}/${request.organizationId}/${request.artifactId}.${request.extension}`;
        await this.client.send(new PutObjectCommand({
            Bucket: this.bucket,
            Key: objectKey,
            Body: request.body,
            ContentType: request.contentType,
            ContentLength: request.body.byteLength,
            Metadata: { checksum: request.checksum, artifact: request.artifactId },
        }));
        return { objectKey, checksum: request.checksum, size: request.body.byteLength };
    }
    async checkHealth() {
        try {
            await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
            return true;
        }
        catch {
            return false;
        }
    }
    async deleteObject(objectKey) {
        await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: objectKey }));
    }
}
//# sourceMappingURL=index.js.map