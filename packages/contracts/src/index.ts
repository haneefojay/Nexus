export const authEmailJobName = "auth-email" as const;
export const emailQueueName = "nexus-email" as const;

export type AuthEmailKind = "EMAIL_VERIFICATION" | "PASSWORD_RESET" | "ORGANIZATION_INVITATION";

export interface AuthEmailJob {
  kind: AuthEmailKind;
  recipient: string;
  recipientName: string;
  actionUrl: string;
}

export const importQueueName = "nexus-imports" as const;
export const processImportJobName = "process-import" as const;

export interface ProcessImportJob {
  importJobId: string;
  organizationId: string;
  requestedBy: string;
}

export const inspectionQueueName = "nexus-inspections" as const;
export const generateInspectionRunsJobName = "generate-inspection-runs" as const;

export interface GenerateInspectionRunsJob {
  planId?: string;
  horizonDays: number;
  requestedAt: string;
}

export const reportQueueName = "nexus-reports" as const;
export const generateInspectionReportJobName = "generate-inspection-report" as const;
export interface GenerateInspectionReportJob {
  reportRequestId: string;
  organizationId: string;
  correlationId: string;
}

export const systemQueueName = "nexus-system" as const;
export const cleanupEvidenceUploadsJobName = "cleanup-evidence-uploads" as const;
export interface CleanupEvidenceUploadsJob {
  requestedAt: string;
}
export const apiVersion = "v1" as const;

export interface ApiErrorDetail {
  field?: string;
  reason: string;
}

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details: ApiErrorDetail[] | Record<string, unknown>;
    requestId: string;
  };
}

export interface CursorPage<T> {
  data: T[];
  page: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}
