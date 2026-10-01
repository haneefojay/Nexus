export declare const authEmailJobName: "auth-email";
export declare const emailQueueName: "nexus-email";
export type AuthEmailKind = "EMAIL_VERIFICATION" | "PASSWORD_RESET" | "ORGANIZATION_INVITATION";
export interface AuthEmailJob {
    correlationId: string;
    kind: AuthEmailKind;
    recipient: string;
    recipientName: string;
    actionUrl: string;
}
export declare const importQueueName: "nexus-imports";
export declare const processImportJobName: "process-import";
export interface ProcessImportJob {
    correlationId: string;
    importJobId: string;
    organizationId: string;
    requestedBy: string;
}
export declare const inspectionQueueName: "nexus-inspections";
export declare const generateInspectionRunsJobName: "generate-inspection-runs";
export interface GenerateInspectionRunsJob {
    correlationId: string;
    planId?: string;
    horizonDays: number;
    requestedAt: string;
}
export declare const exportQueueName: "nexus-exports";
export declare const generateOperationalExportJobName: "generate-operational-export";
export interface GenerateOperationalExportJob {
    exportRequestId: string;
    organizationId: string;
    correlationId: string;
}
export declare const reportQueueName: "nexus-reports";
export declare const generateInspectionReportJobName: "generate-inspection-report";
export interface GenerateInspectionReportJob {
    reportRequestId: string;
    organizationId: string;
    correlationId: string;
}
export declare const systemQueueName: "nexus-system";
export declare const cleanupArtifactsJobName: "cleanup-expired-artifacts";
export interface CleanupArtifactsJob {
    correlationId: string;
    requestedAt: string;
}
export declare const cleanupEvidenceUploadsJobName: "cleanup-evidence-uploads";
export interface CleanupEvidenceUploadsJob {
    correlationId: string;
    requestedAt: string;
}
export declare const apiVersion: "v1";
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
//# sourceMappingURL=index.d.ts.map