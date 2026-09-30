import { Temporal } from "@js-temporal/polyfill";

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

export const inspectionResponseTypes = [
  "PASS_FAIL",
  "YES_NO",
  "SINGLE_CHOICE",
  "NUMERIC",
  "SHORT_TEXT",
  "LONG_TEXT",
  "PHOTO",
  "DATE_TIME",
] as const;
export type InspectionResponseType = (typeof inspectionResponseTypes)[number];

export const inspectionRecurrenceTypes = [
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "QUARTERLY",
  "CUSTOM_DAYS",
] as const;
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
  code:
    | "RESPONSE_REQUIRED"
    | "INVALID_RESPONSE"
    | "OPTION_NOT_ALLOWED"
    | "NUMBER_BELOW_MINIMUM"
    | "NUMBER_ABOVE_MAXIMUM"
    | "DUPLICATE_RESPONSE"
    | "UNKNOWN_ITEM";
  message: string;
}

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

const inspectionRunTransitions: Record<InspectionRunStatus, readonly InspectionRunStatus[]> = {
  ASSIGNED: ["READY", "IN_PROGRESS", "CANCELLED"],
  READY: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["REVIEW_REQUIRED", "CLOSED"],
  REVIEW_REQUIRED: ["APPROVED"],
  APPROVED: ["CLOSED"],
  CLOSED: [],
  CANCELLED: [],
};

export function assertInspectionRunTransition(
  from: InspectionRunStatus,
  to: InspectionRunStatus,
  requiresReview: boolean,
): void {
  if (!inspectionRunTransitions[from].includes(to)) {
    throw new DomainRuleError(
      "INVALID_INSPECTION_RUN_TRANSITION",
      `Inspection run cannot transition from ${from} to ${to}.`,
    );
  }

  if (from === "SUBMITTED") {
    const expected = requiresReview ? "REVIEW_REQUIRED" : "CLOSED";
    if (to !== expected) {
      throw new DomainRuleError(
        "INSPECTION_REVIEW_PATH_REQUIRED",
        `Inspection run must transition from SUBMITTED to ${expected}.`,
      );
    }
  }
}

function isIsoDateTime(value: string): boolean {
  try {
    Temporal.Instant.from(value);
    return true;
  } catch {
    return false;
  }
}

function isMissingResponse(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim().length === 0)
  );
}

function validateResponseValue(
  item: InspectionTemplateItemDefinition,
  value: unknown,
): InspectionResponseIssue | undefined {
  const invalid = (message: string): InspectionResponseIssue => ({
    itemId: item.id,
    code: "INVALID_RESPONSE",
    message,
  });

  switch (item.responseType) {
    case "PASS_FAIL":
    case "YES_NO":
      return typeof value === "boolean" ? undefined : invalid("A boolean response is required.");
    case "SINGLE_CHOICE":
      if (typeof value !== "string") return invalid("A single option is required.");
      return item.options?.includes(value)
        ? undefined
        : {
            itemId: item.id,
            code: "OPTION_NOT_ALLOWED",
            message: "The selected option is not defined by this template version.",
          };
    case "NUMERIC":
      if (typeof value !== "number" || !Number.isFinite(value)) {
        return invalid("A finite numeric response is required.");
      }
      if (item.minimum !== undefined && value < item.minimum) {
        return {
          itemId: item.id,
          code: "NUMBER_BELOW_MINIMUM",
          message: `The response must be at least ${item.minimum}.`,
        };
      }
      if (item.maximum !== undefined && value > item.maximum) {
        return {
          itemId: item.id,
          code: "NUMBER_ABOVE_MAXIMUM",
          message: `The response must be at most ${item.maximum}.`,
        };
      }
      return undefined;
    case "SHORT_TEXT":
    case "LONG_TEXT":
    case "PHOTO":
      return typeof value === "string" && value.trim().length > 0
        ? undefined
        : invalid("A non-empty text or file reference is required.");
    case "DATE_TIME":
      return typeof value === "string" && isIsoDateTime(value)
        ? undefined
        : invalid("An ISO 8601 timestamp with an offset is required.");
  }
}

export function validateInspectionResponses(
  items: readonly InspectionTemplateItemDefinition[],
  responses: readonly InspectionResponseInput[],
): InspectionResponseIssue[] {
  const itemsById = new Map(items.map((item) => [item.id, item]));
  const responsesByItem = new Map<string, InspectionResponseInput>();
  const issues: InspectionResponseIssue[] = [];

  for (const response of responses) {
    if (!itemsById.has(response.itemId)) {
      issues.push({
        itemId: response.itemId,
        code: "UNKNOWN_ITEM",
        message: "The response does not belong to this template version.",
      });
      continue;
    }
    if (responsesByItem.has(response.itemId)) {
      issues.push({
        itemId: response.itemId,
        code: "DUPLICATE_RESPONSE",
        message: "Only one response is allowed for each template item.",
      });
      continue;
    }
    responsesByItem.set(response.itemId, response);
  }

  for (const item of items) {
    const response = responsesByItem.get(item.id);
    if (!response || isMissingResponse(response.value)) {
      if (item.required) {
        issues.push({
          itemId: item.id,
          code: "RESPONSE_REQUIRED",
          message: "A response is required before submission.",
        });
      }
      continue;
    }

    const issue = validateResponseValue(item, response.value);
    if (issue) issues.push(issue);
  }

  return issues;
}

export function assertValidInspectionResponses(
  items: readonly InspectionTemplateItemDefinition[],
  responses: readonly InspectionResponseInput[],
): void {
  const issues = validateInspectionResponses(items, responses);
  if (issues.length > 0) {
    throw new DomainRuleError(
      "INSPECTION_RESPONSES_INVALID",
      `Inspection responses failed validation: ${issues.map((issue) => issue.code).join(", ")}.`,
    );
  }
}

export function inspectionOccurrenceAt(
  startsAt: Date,
  recurrence: InspectionRecurrence,
  sequence: number,
  timeZone: string,
): Date {
  if (!Number.isSafeInteger(sequence) || sequence < 0) {
    throw new DomainRuleError(
      "INVALID_RECURRENCE_SEQUENCE",
      "Recurrence sequence must be a non-negative safe integer.",
    );
  }
  if (
    recurrence.type === "CUSTOM_DAYS" &&
    (!Number.isSafeInteger(recurrence.intervalDays) || (recurrence.intervalDays ?? 0) < 1)
  ) {
    throw new DomainRuleError(
      "INVALID_RECURRENCE_INTERVAL",
      "Custom recurrence interval must be a positive whole number of days.",
    );
  }

  let occurrence: Temporal.ZonedDateTime;
  try {
    occurrence = Temporal.Instant.from(startsAt.toISOString()).toZonedDateTimeISO(timeZone);
  } catch {
    throw new DomainRuleError("INVALID_TIME_ZONE", "A valid IANA time zone is required.");
  }

  switch (recurrence.type) {
    case "DAILY":
      occurrence = occurrence.add({ days: sequence });
      break;
    case "WEEKLY":
      occurrence = occurrence.add({ weeks: sequence });
      break;
    case "MONTHLY":
      occurrence = occurrence.add({ months: sequence }, { overflow: "constrain" });
      break;
    case "QUARTERLY":
      occurrence = occurrence.add({ months: sequence * 3 }, { overflow: "constrain" });
      break;
    case "CUSTOM_DAYS":
      occurrence = occurrence.add({ days: sequence * recurrence.intervalDays! });
      break;
  }

  return new Date(occurrence.epochMilliseconds);
}

export function isInspectionOverdue(dueAt: Date, status: InspectionRunStatus, now: Date): boolean {
  return (
    now.getTime() > dueAt.getTime() &&
    !["SUBMITTED", "REVIEW_REQUIRED", "APPROVED", "CLOSED", "CANCELLED"].includes(status)
  );
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
