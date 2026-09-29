export interface AuthorizedUploadRequest {
  organizationId: string;
  actorId: string;
  contentType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
  contentLength: number;
  checksum: string;
}

export interface PresignedUpload {
  objectKey: string;
  uploadUrl: string;
  expiresAt: Date;
}

export interface StorageProvider {
  createAuthorizedUpload(request: AuthorizedUploadRequest): Promise<PresignedUpload>;
  createAuthorizedDownload(objectKey: string, expiresInSeconds: number): Promise<string>;
  deleteObject(objectKey: string): Promise<void>;
}
