export declare const membershipRoles: readonly ["OWNER", "OPERATIONS_MANAGER", "SUPERVISOR", "TECHNICIAN", "VIEWER"];
export type MembershipRole = (typeof membershipRoles)[number];
export declare const membershipStatuses: readonly ["INVITED", "ACTIVE", "DEACTIVATED"];
export type MembershipStatus = (typeof membershipStatuses)[number];
export declare const siteStatuses: readonly ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"];
export type SiteStatus = (typeof siteStatuses)[number];
export declare const assetStatuses: readonly ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"];
export type AssetStatus = (typeof assetStatuses)[number];
export declare const assetConditions: readonly ["UNKNOWN", "GOOD", "ATTENTION", "CRITICAL"];
export type AssetCondition = (typeof assetConditions)[number];
export declare const inspectionRunStatuses: readonly ["ASSIGNED", "READY", "IN_PROGRESS", "SUBMITTED", "REVIEW_REQUIRED", "APPROVED", "CLOSED", "CANCELLED"];
export type InspectionRunStatus = (typeof inspectionRunStatuses)[number];
export declare const reportableInspectionStatuses: ReadonlySet<InspectionRunStatus>;
export declare function isInspectionReportable(status: InspectionRunStatus): boolean;
export declare const inspectionResponseTypes: readonly ["PASS_FAIL", "YES_NO", "SINGLE_CHOICE", "NUMERIC", "SHORT_TEXT", "LONG_TEXT", "PHOTO", "DATE_TIME"];
export type InspectionResponseType = (typeof inspectionResponseTypes)[number];
export declare const inspectionRecurrenceTypes: readonly ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "CUSTOM_DAYS"];
export type InspectionRecurrenceType = (typeof inspectionRecurrenceTypes)[number];
export interface InspectionRecurrence {
    type: InspectionRecurrenceType;
    intervalDays?: number;
}
export interface InspectionTemplateItemDefinition {
    id: string;
    label: string;
    responseType: InspectionResponseType;
    required: boolean;
    options?: readonly string[];
    minimum?: number;
    maximum?: number;
}
export interface InspectionResponseInput {
    itemId: string;
    value: unknown;
}
export interface InspectionResponseIssue {
    itemId: string;
    code: "RESPONSE_REQUIRED" | "INVALID_RESPONSE" | "OPTION_NOT_ALLOWED" | "NUMBER_BELOW_MINIMUM" | "NUMBER_ABOVE_MAXIMUM" | "DUPLICATE_RESPONSE" | "UNKNOWN_ITEM";
    message: string;
}
export declare const findingStatuses: readonly ["OPEN", "ACKNOWLEDGED", "ACTION_REQUIRED", "IN_PROGRESS", "READY_FOR_VERIFICATION", "VERIFIED", "CLOSED", "DISMISSED"];
export type FindingStatus = (typeof findingStatuses)[number];
export declare const correctiveActionStatuses: readonly ["OPEN", "IN_PROGRESS", "BLOCKED", "COMPLETED", "VERIFICATION_REQUIRED", "VERIFIED", "CANCELLED"];
export type CorrectiveActionStatus = (typeof correctiveActionStatuses)[number];
export declare const findingSeverities: readonly ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
export type FindingSeverity = (typeof findingSeverities)[number];
export declare class DomainRuleError extends Error {
    readonly code: string;
    constructor(code: string, message: string);
}
export declare function assertFindingTransition(from: FindingStatus, to: FindingStatus, options: {
    severity: FindingSeverity;
    hasVerifiedAction: boolean;
    dismissalReason?: string | null;
}): void;
export declare function assertCorrectiveActionTransition(from: CorrectiveActionStatus, to: CorrectiveActionStatus, options: {
    completionNotes?: string | null;
    completionEvidenceCount?: number;
    actorUserId: string;
    assigneeUserId: string;
    completedByUserId?: string | null;
}): void;
export declare function isCorrectiveActionOverdue(dueAt: Date, status: CorrectiveActionStatus, now: Date): boolean;
export declare function assertInspectionRunTransition(from: InspectionRunStatus, to: InspectionRunStatus, requiresReview: boolean): void;
export declare function validateInspectionResponses(items: readonly InspectionTemplateItemDefinition[], responses: readonly InspectionResponseInput[]): InspectionResponseIssue[];
export declare function assertValidInspectionResponses(items: readonly InspectionTemplateItemDefinition[], responses: readonly InspectionResponseInput[]): void;
export declare function inspectionOccurrenceAt(startsAt: Date, recurrence: InspectionRecurrence, sequence: number, timeZone: string): Date;
export declare function isInspectionOverdue(dueAt: Date, status: InspectionRunStatus, now: Date): boolean;
export interface InspectionCoverageRecord {
    siteId: string;
    scheduledFor: Date;
    dueAt: Date;
    status: InspectionRunStatus;
}
export interface InspectionCoverage {
    siteId: string;
    required: number;
    completed: number;
    overdue: number;
    skipped: number;
    completionRate: number;
}
export declare function calculateInspectionCoverage(records: readonly InspectionCoverageRecord[], now: Date): InspectionCoverage[];
export type InspectionAttentionSource = "CRITICAL_FINDING" | "HIGH_FINDING" | "OVERDUE_CORRECTIVE_ACTION" | "OVERDUE_INSPECTION" | "ASSET_ATTENTION";
export declare function sortInspectionAttention<T extends {
    source: InspectionAttentionSource;
}>(attention: readonly T[]): T[];
export declare function assertSiteTransition(from: SiteStatus, to: SiteStatus): void;
export declare function assertAssetTransition(from: AssetStatus, to: AssetStatus): void;
export type Permission = "organization:read" | "members:manage" | "sites:read" | "sites:manage" | "assets:read" | "assets:manage" | "imports:manage" | "map:read" | "inspection-templates:read" | "inspection-templates:manage" | "inspection-plans:read" | "inspection-plans:manage" | "inspection-runs:read" | "inspection-runs:execute" | "inspection-runs:review" | "inspection-dashboard:read" | "findings:read" | "findings:manage" | "findings:dismiss" | "actions:read" | "actions:manage" | "actions:execute" | "actions:verify" | "evidence:read" | "evidence:manage" | "exports:read" | "exports:manage" | "reports:read" | "reports:manage" | "search:read";
export type PhaseOnePermission = Permission;
export declare function hasPermission(role: MembershipRole, permission: Permission): boolean;
export declare function assertPermission(role: MembershipRole, permission: Permission): void;
export declare function assertOwnerInvariant(activeOwnerCount: number, removesActiveOwner: boolean): void;
export interface AssetParentNode {
    id: string;
    parentAssetId: string | null;
    organizationId: string;
    siteId: string;
}
export declare function assertValidAssetParent(asset: AssetParentNode, proposedParentId: string | null, assetsById: ReadonlyMap<string, AssetParentNode>): void;
export interface AssetImportRow {
    rowNumber: number;
    siteReference: string;
    assetType: string;
    identifier: string;
    name: string;
    latitude?: number;
    longitude?: number;
}
export interface ImportRowIssue {
    rowNumber: number;
    field: keyof AssetImportRow;
    code: string;
    message: string;
}
export declare function validateAssetImportRows(rows: readonly AssetImportRow[]): ImportRowIssue[];
export declare function isArtifactCleanupEligible(status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "EXPIRED", expiresAt: Date | null, now: Date): boolean;
//# sourceMappingURL=index.d.ts.map