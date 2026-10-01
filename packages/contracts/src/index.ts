export const authEmailJobName = "auth-email" as const;
export const emailQueueName = "nexus-email" as const;

export type AuthEmailKind = "EMAIL_VERIFICATION" | "PASSWORD_RESET" | "ORGANIZATION_INVITATION";

export interface AuthEmailJob {
  correlationId: string;
  kind: AuthEmailKind;
  recipient: string;
  recipientName: string;
  actionUrl: string;
}

export const importQueueName = "nexus-imports" as const;
export const processImportJobName = "process-import" as const;

export interface ProcessImportJob {
  correlationId: string;
  importJobId: string;
  organizationId: string;
  requestedBy: string;
}

export const inspectionQueueName = "nexus-inspections" as const;
export const generateInspectionRunsJobName = "generate-inspection-runs" as const;

export interface GenerateInspectionRunsJob {
  correlationId: string;
  planId?: string;
  horizonDays: number;
  requestedAt: string;
}

export const exportQueueName = "nexus-exports" as const;
export const generateOperationalExportJobName = "generate-operational-export" as const;
export interface GenerateOperationalExportJob {
  exportRequestId: string;
  organizationId: string;
  correlationId: string;
}

export const reportQueueName = "nexus-reports" as const;
export const generateInspectionReportJobName = "generate-inspection-report" as const;
export interface GenerateInspectionReportJob {
  reportRequestId: string;
  organizationId: string;
  correlationId: string;
}

export const systemQueueName = "nexus-system" as const;
export const cleanupArtifactsJobName = "cleanup-expired-artifacts" as const;
export interface CleanupArtifactsJob {
  correlationId: string;
  requestedAt: string;
}
export const cleanupEvidenceUploadsJobName = "cleanup-evidence-uploads" as const;
export interface CleanupEvidenceUploadsJob {
  correlationId: string;
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
