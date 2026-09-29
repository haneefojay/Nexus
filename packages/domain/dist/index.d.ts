export declare const membershipRoles: readonly ["OWNER", "OPERATIONS_MANAGER", "SUPERVISOR", "TECHNICIAN", "VIEWER"];
export type MembershipRole = (typeof membershipRoles)[number];
export declare const siteStatuses: readonly ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"];
export type SiteStatus = (typeof siteStatuses)[number];
export declare const assetStatuses: readonly ["OPERATIONAL", "ATTENTION", "OUT_OF_SERVICE", "DECOMMISSIONED", "ARCHIVED"];
export type AssetStatus = (typeof assetStatuses)[number];
export declare const inspectionRunStatuses: readonly ["ASSIGNED", "READY", "IN_PROGRESS", "SUBMITTED", "REVIEW_REQUIRED", "APPROVED", "CLOSED", "CANCELLED"];
export type InspectionRunStatus = (typeof inspectionRunStatuses)[number];
export declare const findingStatuses: readonly ["OPEN", "ACKNOWLEDGED", "ACTION_REQUIRED", "IN_PROGRESS", "READY_FOR_VERIFICATION", "VERIFIED", "CLOSED", "DISMISSED"];
export type FindingStatus = (typeof findingStatuses)[number];
//# sourceMappingURL=index.d.ts.map