export const membershipRoles = [
  "OWNER",
  "OPERATIONS_MANAGER",
  "SUPERVISOR",
  "TECHNICIAN",
  "VIEWER",
] as const;
export type MembershipRole = (typeof membershipRoles)[number];

export const membershipStatuses = ["INVITED", "ACTIVE", "DEACTIVATED"] as const;
export type MembershipStatus = (typeof membershipStatuses)[number];

export const siteStatuses = ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"] as const;
export type SiteStatus = (typeof siteStatuses)[number];

export const assetStatuses = ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"] as const;
export type AssetStatus = (typeof assetStatuses)[number];

export const assetConditions = ["UNKNOWN", "GOOD", "ATTENTION", "CRITICAL"] as const;
export type AssetCondition = (typeof assetConditions)[number];

export const inspectionRunStatuses = [
  "PLANNED",
  "READY",
  "IN_PROGRESS",
  "SUBMITTED",
  "UNDER_REVIEW",
  "CLOSED",
  "CANCELLED",
  "SKIPPED",
] as const;
export type InspectionRunStatus = (typeof inspectionRunStatuses)[number];

export const findingStatuses = [
  "OPEN",
  "ACTION_REQUIRED",
  "IN_REMEDIATION",
  "READY_FOR_VERIFICATION",
  "VERIFIED",
  "CLOSED",
  "DISMISSED",
] as const;
export type FindingStatus = (typeof findingStatuses)[number];

const siteTransitions: Record<SiteStatus, readonly SiteStatus[]> = {
  DRAFT: ["ACTIVE", "ARCHIVED"],
  ACTIVE: ["INACTIVE", "ARCHIVED"],
  INACTIVE: ["ACTIVE", "ARCHIVED"],
  ARCHIVED: [],
};

const assetTransitions: Record<AssetStatus, readonly AssetStatus[]> = {
  DRAFT: ["ACTIVE", "ARCHIVED"],
  ACTIVE: ["INACTIVE", "ARCHIVED"],
  INACTIVE: ["ACTIVE", "ARCHIVED"],
  ARCHIVED: [],
};

export class DomainRuleError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "DomainRuleError";
  }
}

export function assertSiteTransition(from: SiteStatus, to: SiteStatus): void {
  if (from === to) return;
  if (!siteTransitions[from].includes(to)) {
    throw new DomainRuleError(
      "SITE_INVALID_TRANSITION",
      `A site cannot transition from ${from} to ${to}.`,
    );
  }
}

export function assertAssetTransition(from: AssetStatus, to: AssetStatus): void {
  if (from === to) return;
  if (!assetTransitions[from].includes(to)) {
    throw new DomainRuleError(
      "ASSET_INVALID_TRANSITION",
      `An asset cannot transition from ${from} to ${to}.`,
    );
  }
}

export type PhaseOnePermission =
  | "organization:read"
  | "members:manage"
  | "sites:read"
  | "sites:manage"
  | "assets:read"
  | "assets:manage"
  | "imports:manage"
  | "map:read";

const rolePermissions: Record<MembershipRole, ReadonlySet<PhaseOnePermission>> = {
  OWNER: new Set([
    "organization:read",
    "members:manage",
    "sites:read",
    "sites:manage",
    "assets:read",
    "assets:manage",
    "imports:manage",
    "map:read",
  ]),
  OPERATIONS_MANAGER: new Set([
    "organization:read",
    "sites:read",
    "sites:manage",
    "assets:read",
    "assets:manage",
    "imports:manage",
    "map:read",
  ]),
  SUPERVISOR: new Set(["organization:read", "sites:read", "assets:read", "map:read"]),
  TECHNICIAN: new Set(["organization:read", "sites:read", "assets:read", "map:read"]),
  VIEWER: new Set(["organization:read", "sites:read", "assets:read", "map:read"]),
};

export function hasPermission(role: MembershipRole, permission: PhaseOnePermission): boolean {
  return rolePermissions[role].has(permission);
}

export function assertPermission(role: MembershipRole, permission: PhaseOnePermission): void {
  if (!hasPermission(role, permission)) {
    throw new DomainRuleError(
      "AUTHORIZATION_DENIED",
      "The active membership cannot perform this action.",
    );
  }
}

export function assertOwnerInvariant(activeOwnerCount: number, removesActiveOwner: boolean): void {
  if (removesActiveOwner && activeOwnerCount <= 1) {
    throw new DomainRuleError(
      "ORGANIZATION_REQUIRES_OWNER",
      "An organization must retain at least one active owner.",
    );
  }
}

export interface AssetParentNode {
  id: string;
  parentAssetId: string | null;
  organizationId: string;
  siteId: string;
}

export function assertValidAssetParent(
  asset: AssetParentNode,
  proposedParentId: string | null,
  assetsById: ReadonlyMap<string, AssetParentNode>,
): void {
  if (proposedParentId === null) return;
  if (proposedParentId === asset.id) {
    throw new DomainRuleError("ASSET_PARENT_SELF", "An asset cannot be its own parent.");
  }

  const visited = new Set([asset.id]);
  let cursor: string | null = proposedParentId;
  while (cursor !== null) {
    if (visited.has(cursor)) {
      throw new DomainRuleError(
        "ASSET_PARENT_CYCLE",
        "The parent relationship would create a cycle.",
      );
    }
    visited.add(cursor);
    const parent: AssetParentNode | undefined = assetsById.get(cursor);
    if (!parent) {
      throw new DomainRuleError("ASSET_PARENT_NOT_FOUND", "The parent asset does not exist.");
    }
    if (parent.organizationId !== asset.organizationId || parent.siteId !== asset.siteId) {
      throw new DomainRuleError(
        "ASSET_PARENT_SCOPE_MISMATCH",
        "Parent and child assets must belong to the same organization and site.",
      );
    }
    cursor = parent.parentAssetId;
  }
}

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

export function validateAssetImportRows(rows: readonly AssetImportRow[]): ImportRowIssue[] {
  const issues: ImportRowIssue[] = [];
  const identifiers = new Set<string>();

  for (const row of rows) {
    const identifier = row.identifier.trim().toLocaleLowerCase("en-US");
    if (!row.siteReference.trim()) issues.push(issue(row.rowNumber, "siteReference", "REQUIRED"));
    if (!row.assetType.trim()) issues.push(issue(row.rowNumber, "assetType", "REQUIRED"));
    if (!identifier) issues.push(issue(row.rowNumber, "identifier", "REQUIRED"));
    if (!row.name.trim()) issues.push(issue(row.rowNumber, "name", "REQUIRED"));
    if (identifier && identifiers.has(identifier)) {
      issues.push(issue(row.rowNumber, "identifier", "DUPLICATE_IN_FILE"));
    }
    identifiers.add(identifier);

    const hasLatitude = row.latitude !== undefined;
    const hasLongitude = row.longitude !== undefined;
    if (hasLatitude !== hasLongitude) {
      issues.push(
        issue(row.rowNumber, hasLatitude ? "longitude" : "latitude", "COORDINATE_PAIR_REQUIRED"),
      );
    }
    if (row.latitude !== undefined && (row.latitude < -90 || row.latitude > 90)) {
      issues.push(issue(row.rowNumber, "latitude", "OUT_OF_RANGE"));
    }
    if (row.longitude !== undefined && (row.longitude < -180 || row.longitude > 180)) {
      issues.push(issue(row.rowNumber, "longitude", "OUT_OF_RANGE"));
    }
  }

  return issues;
}

function issue(rowNumber: number, field: keyof AssetImportRow, code: string): ImportRowIssue {
  return { rowNumber, field, code, message: `${String(field)} failed ${code}.` };
}
