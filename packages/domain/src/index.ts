export const membershipRoles = [
  "OWNER",
  "OPERATIONS_MANAGER",
  "SUPERVISOR",
  "TECHNICIAN",
  "VIEWER",
] as const;

export type MembershipRole = (typeof membershipRoles)[number];

export const siteStatuses = ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"] as const;
export type SiteStatus = (typeof siteStatuses)[number];

export const assetStatuses = [
  "OPERATIONAL",
  "ATTENTION",
  "OUT_OF_SERVICE",
  "DECOMMISSIONED",
  "ARCHIVED",
] as const;
export type AssetStatus = (typeof assetStatuses)[number];

export const inspectionRunStatuses = [
  "ASSIGNED",
  "READY",
  "IN_PROGRESS",
  "SUBMITTED",
  "REVIEW_REQUIRED",
  "APPROVED",
  "CLOSED",
  "CANCELLED",
] as const;
export type InspectionRunStatus = (typeof inspectionRunStatuses)[number];

export const findingStatuses = [
  "OPEN",
  "ACKNOWLEDGED",
  "ACTION_REQUIRED",
  "IN_PROGRESS",
  "READY_FOR_VERIFICATION",
  "VERIFIED",
  "CLOSED",
  "DISMISSED",
] as const;
export type FindingStatus = (typeof findingStatuses)[number];
