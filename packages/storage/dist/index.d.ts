export declare const evidenceContentTypes: readonly ["image/jpeg", "image/png", "image/webp", "application/pdf"];
export type EvidenceContentType = (typeof evidenceContentTypes)[number];
export declare const maximumEvidenceBytes: number;
export interface AuthorizedUploadRequest {
    organizationId: string;
    actorId: string;
    targetType: "FINDING" | "CORRECTIVE_ACTION" | "INSPECTION_RUN";
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
export interface PrivateArtifact {
    objectKey: string;
    checksum: string;
    size: number;
}
export interface PrivateArtifactRequest {
    category: "reports" | "exports";
    organizationId: string;
    artifactId: string;
    extension: "pdf" | "csv";
    contentType: "application/pdf" | "text/csv";
    body: Uint8Array;
    checksum: string;
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
    writePrivateArtifact(request: PrivateArtifactRequest): Promise<PrivateArtifact>;
    checkHealth(): Promise<boolean>;
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
export declare class S3StorageProvider implements StorageProvider {
    private readonly client;
    private readonly bucket;
    constructor(options: S3StorageOptions);
    ensureBucket(): Promise<void>;
    createAuthorizedUpload(request: AuthorizedUploadRequest): Promise<PresignedUpload>;
    headObject(objectKey: string): Promise<StoredObjectMetadata | null>;
    readObjectPrefix(objectKey: string, bytes: number): Promise<Uint8Array>;
    createAuthorizedDownload(objectKey: string, expiresInSeconds: number): Promise<string>;
    writePrivateArtifact(request: PrivateArtifactRequest): Promise<PrivateArtifact>;
    checkHealth(): Promise<boolean>;
    deleteObject(objectKey: string): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map