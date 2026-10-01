import { Temporal } from "@js-temporal/polyfill";
export const membershipRoles = [
    "OWNER",
    "OPERATIONS_MANAGER",
    "SUPERVISOR",
    "TECHNICIAN",
    "VIEWER",
];
export const membershipStatuses = ["INVITED", "ACTIVE", "DEACTIVATED"];
export const siteStatuses = ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"];
export const assetStatuses = ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"];
export const assetConditions = ["UNKNOWN", "GOOD", "ATTENTION", "CRITICAL"];
export const inspectionRunStatuses = [
    "ASSIGNED",
    "READY",
    "IN_PROGRESS",
    "SUBMITTED",
    "REVIEW_REQUIRED",
    "APPROVED",
    "CLOSED",
    "CANCELLED",
];
export const reportableInspectionStatuses = new Set([
    "SUBMITTED",
    "REVIEW_REQUIRED",
    "APPROVED",
    "CLOSED",
]);
export function isInspectionReportable(status) {
    return reportableInspectionStatuses.has(status);
}
export const inspectionResponseTypes = [
    "PASS_FAIL",
    "YES_NO",
    "SINGLE_CHOICE",
    "NUMERIC",
    "SHORT_TEXT",
    "LONG_TEXT",
    "PHOTO",
    "DATE_TIME",
];
export const inspectionRecurrenceTypes = [
    "DAILY",
    "WEEKLY",
    "MONTHLY",
    "QUARTERLY",
    "CUSTOM_DAYS",
];
export const findingStatuses = [
    "OPEN",
    "ACKNOWLEDGED",
    "ACTION_REQUIRED",
    "IN_PROGRESS",
    "READY_FOR_VERIFICATION",
    "VERIFIED",
    "CLOSED",
    "DISMISSED",
];
export const correctiveActionStatuses = [
    "OPEN",
    "IN_PROGRESS",
    "BLOCKED",
    "COMPLETED",
    "VERIFICATION_REQUIRED",
    "VERIFIED",
    "CANCELLED",
];
export const findingSeverities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const siteTransitions = {
    DRAFT: ["ACTIVE", "ARCHIVED"],
    ACTIVE: ["INACTIVE", "ARCHIVED"],
    INACTIVE: ["ACTIVE", "ARCHIVED"],
    ARCHIVED: [],
};
const assetTransitions = {
    DRAFT: ["ACTIVE", "ARCHIVED"],
    ACTIVE: ["INACTIVE", "ARCHIVED"],
    INACTIVE: ["ACTIVE", "ARCHIVED"],
    ARCHIVED: [],
};
export class DomainRuleError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = "DomainRuleError";
    }
}
const inspectionRunTransitions = {
    ASSIGNED: ["READY", "IN_PROGRESS", "CANCELLED"],
    READY: ["IN_PROGRESS", "CANCELLED"],
    IN_PROGRESS: ["SUBMITTED", "CANCELLED"],
    SUBMITTED: ["REVIEW_REQUIRED", "CLOSED"],
    REVIEW_REQUIRED: ["APPROVED"],
    APPROVED: ["CLOSED"],
    CLOSED: [],
    CANCELLED: [],
};
const findingTransitions = {
    OPEN: ["ACKNOWLEDGED", "ACTION_REQUIRED", "DISMISSED"],
    ACKNOWLEDGED: ["ACTION_REQUIRED", "DISMISSED"],
    ACTION_REQUIRED: ["IN_PROGRESS", "DISMISSED"],
    IN_PROGRESS: ["READY_FOR_VERIFICATION"],
    READY_FOR_VERIFICATION: ["IN_PROGRESS", "VERIFIED"],
    VERIFIED: ["CLOSED"],
    CLOSED: [],
    DISMISSED: [],
};
const correctiveActionTransitions = {
    OPEN: ["IN_PROGRESS", "CANCELLED"],
    IN_PROGRESS: ["BLOCKED", "COMPLETED", "CANCELLED"],
    BLOCKED: ["IN_PROGRESS", "CANCELLED"],
    COMPLETED: ["VERIFICATION_REQUIRED"],
    VERIFICATION_REQUIRED: ["IN_PROGRESS", "VERIFIED"],
    VERIFIED: [],
    CANCELLED: [],
};
export function assertFindingTransition(from, to, options) {
    if (!findingTransitions[from].includes(to)) {
        throw new DomainRuleError("INVALID_FINDING_TRANSITION", `Finding cannot transition from ${from} to ${to}.`);
    }
    if (to === "DISMISSED" && !options.dismissalReason?.trim()) {
        throw new DomainRuleError("FINDING_DISMISSAL_REASON_REQUIRED", "A dismissal reason is required.");
    }
    if ((to === "VERIFIED" || to === "CLOSED") &&
        options.severity === "CRITICAL" &&
        !options.hasVerifiedAction) {
        throw new DomainRuleError("CRITICAL_FINDING_VERIFICATION_REQUIRED", "A critical finding requires an authorized verified action before closure.");
    }
}
export function assertCorrectiveActionTransition(from, to, options) {
    if (!correctiveActionTransitions[from].includes(to)) {
        throw new DomainRuleError("INVALID_CORRECTIVE_ACTION_TRANSITION", `Corrective action cannot transition from ${from} to ${to}.`);
    }
    if (to === "COMPLETED") {
        if (!options.completionNotes?.trim()) {
            throw new DomainRuleError("ACTION_COMPLETION_NOTES_REQUIRED", "Completion notes are required.");
        }
        if (!options.completionEvidenceCount) {
            throw new DomainRuleError("ACTION_COMPLETION_EVIDENCE_REQUIRED", "Completion evidence is required.");
        }
    }
    if (to === "VERIFIED" &&
        (options.actorUserId === options.assigneeUserId ||
            options.actorUserId === options.completedByUserId)) {
        throw new DomainRuleError("ACTION_VERIFIER_SEPARATION_REQUIRED", "The assignee or completer cannot verify their own corrective action.");
    }
}
export function isCorrectiveActionOverdue(dueAt, status, now) {
    return !["VERIFIED", "CANCELLED"].includes(status) && dueAt.getTime() < now.getTime();
}
export function assertInspectionRunTransition(from, to, requiresReview) {
    if (!inspectionRunTransitions[from].includes(to)) {
        throw new DomainRuleError("INVALID_INSPECTION_RUN_TRANSITION", `Inspection run cannot transition from ${from} to ${to}.`);
    }
    if (from === "SUBMITTED") {
        const expected = requiresReview ? "REVIEW_REQUIRED" : "CLOSED";
        if (to !== expected) {
            throw new DomainRuleError("INSPECTION_REVIEW_PATH_REQUIRED", `Inspection run must transition from SUBMITTED to ${expected}.`);
        }
    }
}
function isIsoDateTime(value) {
    try {
        Temporal.Instant.from(value);
        return true;
    }
    catch {
        return false;
    }
}
function isMissingResponse(value) {
    return (value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim().length === 0));
}
function validateResponseValue(item, value) {
    const invalid = (message) => ({
        itemId: item.id,
        code: "INVALID_RESPONSE",
        message,
    });
    switch (item.responseType) {
        case "PASS_FAIL":
        case "YES_NO":
            return typeof value === "boolean" ? undefined : invalid("A boolean response is required.");
        case "SINGLE_CHOICE":
            if (typeof value !== "string")
                return invalid("A single option is required.");
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
export function validateInspectionResponses(items, responses) {
    const itemsById = new Map(items.map((item) => [item.id, item]));
    const responsesByItem = new Map();
    const issues = [];
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
        if (issue)
            issues.push(issue);
    }
    return issues;
}
export function assertValidInspectionResponses(items, responses) {
    const issues = validateInspectionResponses(items, responses);
    if (issues.length > 0) {
        throw new DomainRuleError("INSPECTION_RESPONSES_INVALID", `Inspection responses failed validation: ${issues.map((issue) => issue.code).join(", ")}.`);
    }
}
export function inspectionOccurrenceAt(startsAt, recurrence, sequence, timeZone) {
    if (!Number.isSafeInteger(sequence) || sequence < 0) {
        throw new DomainRuleError("INVALID_RECURRENCE_SEQUENCE", "Recurrence sequence must be a non-negative safe integer.");
    }
    if (recurrence.type === "CUSTOM_DAYS" &&
        (!Number.isSafeInteger(recurrence.intervalDays) || (recurrence.intervalDays ?? 0) < 1)) {
        throw new DomainRuleError("INVALID_RECURRENCE_INTERVAL", "Custom recurrence interval must be a positive whole number of days.");
    }
    let occurrence;
    try {
        occurrence = Temporal.Instant.from(startsAt.toISOString()).toZonedDateTimeISO(timeZone);
    }
    catch {
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
            occurrence = occurrence.add({ days: sequence * recurrence.intervalDays });
            break;
    }
    return new Date(occurrence.epochMilliseconds);
}
export function isInspectionOverdue(dueAt, status, now) {
    return (now.getTime() > dueAt.getTime() &&
        !["SUBMITTED", "REVIEW_REQUIRED", "APPROVED", "CLOSED", "CANCELLED"].includes(status));
}
export function calculateInspectionCoverage(records, now) {
    const coverage = new Map();
    for (const record of records) {
        if (record.scheduledFor > now)
            continue;
        const current = coverage.get(record.siteId) ?? {
            siteId: record.siteId,
            required: 0,
            completed: 0,
            overdue: 0,
            skipped: 0,
        };
        current.required += 1;
        if (record.status === "CLOSED")
            current.completed += 1;
        if (record.status === "CANCELLED")
            current.skipped += 1;
        if (isInspectionOverdue(record.dueAt, record.status, now))
            current.overdue += 1;
        coverage.set(record.siteId, current);
    }
    return [...coverage.values()]
        .map((value) => ({
        ...value,
        completionRate: value.required === 0 ? 1 : value.completed / value.required,
    }))
        .sort((left, right) => left.siteId.localeCompare(right.siteId));
}
const attentionPriority = {
    CRITICAL_FINDING: 1,
    HIGH_FINDING: 2,
    OVERDUE_CORRECTIVE_ACTION: 3,
    OVERDUE_INSPECTION: 4,
    ASSET_ATTENTION: 5,
};
export function sortInspectionAttention(attention) {
    return [...attention].sort((left, right) => attentionPriority[left.source] - attentionPriority[right.source]);
}
export function assertSiteTransition(from, to) {
    if (from === to)
        return;
    if (!siteTransitions[from].includes(to)) {
        throw new DomainRuleError("SITE_INVALID_TRANSITION", `A site cannot transition from ${from} to ${to}.`);
    }
}
export function assertAssetTransition(from, to) {
    if (from === to)
        return;
    if (!assetTransitions[from].includes(to)) {
        throw new DomainRuleError("ASSET_INVALID_TRANSITION", `An asset cannot transition from ${from} to ${to}.`);
    }
}
const rolePermissions = {
    OWNER: new Set([
        "organization:read",
        "members:manage",
        "sites:read",
        "sites:manage",
        "assets:read",
        "assets:manage",
        "imports:manage",
        "map:read",
        "inspection-templates:read",
        "inspection-templates:manage",
        "inspection-plans:read",
        "inspection-plans:manage",
        "inspection-runs:read",
        "inspection-runs:execute",
        "inspection-runs:review",
        "inspection-dashboard:read",
        "findings:read",
        "findings:manage",
        "findings:dismiss",
        "actions:read",
        "actions:manage",
        "actions:execute",
        "actions:verify",
        "evidence:read",
        "evidence:manage",
        "exports:read",
        "exports:manage",
        "reports:read",
        "reports:manage",
        "search:read",
    ]),
    OPERATIONS_MANAGER: new Set([
        "organization:read",
        "sites:read",
        "sites:manage",
        "assets:read",
        "assets:manage",
        "imports:manage",
        "map:read",
        "inspection-templates:read",
        "inspection-templates:manage",
        "inspection-plans:read",
        "inspection-plans:manage",
        "inspection-runs:read",
        "inspection-runs:execute",
        "inspection-runs:review",
        "inspection-dashboard:read",
        "findings:read",
        "findings:manage",
        "findings:dismiss",
        "actions:read",
        "actions:manage",
        "actions:execute",
        "actions:verify",
        "evidence:read",
        "evidence:manage",
        "exports:read",
        "exports:manage",
        "reports:read",
        "reports:manage",
        "search:read",
    ]),
    SUPERVISOR: new Set([
        "organization:read",
        "sites:read",
        "assets:read",
        "map:read",
        "inspection-templates:read",
        "inspection-plans:read",
        "inspection-runs:read",
        "inspection-runs:execute",
        "inspection-runs:review",
        "inspection-dashboard:read",
        "findings:read",
        "findings:manage",
        "findings:dismiss",
        "actions:read",
        "actions:execute",
        "actions:verify",
        "evidence:read",
        "evidence:manage",
        "exports:read",
        "exports:manage",
        "reports:read",
        "reports:manage",
        "search:read",
    ]),
    TECHNICIAN: new Set([
        "organization:read",
        "sites:read",
        "assets:read",
        "map:read",
        "inspection-templates:read",
        "inspection-plans:read",
        "inspection-runs:read",
        "inspection-runs:execute",
        "inspection-dashboard:read",
        "findings:read",
        "actions:read",
        "actions:execute",
        "evidence:read",
        "evidence:manage",
        "exports:read",
        "reports:read",
        "reports:manage",
        "search:read",
    ]),
    VIEWER: new Set([
        "organization:read",
        "sites:read",
        "assets:read",
        "map:read",
        "inspection-templates:read",
        "inspection-plans:read",
        "inspection-runs:read",
        "inspection-dashboard:read",
        "findings:read",
        "actions:read",
        "evidence:read",
        "exports:read",
        "reports:read",
        "search:read",
    ]),
};
export function hasPermission(role, permission) {
    return rolePermissions[role].has(permission);
}
export function assertPermission(role, permission) {
    if (!hasPermission(role, permission)) {
        throw new DomainRuleError("AUTHORIZATION_DENIED", "The active membership cannot perform this action.");
    }
}
export function assertOwnerInvariant(activeOwnerCount, removesActiveOwner) {
    if (removesActiveOwner && activeOwnerCount <= 1) {
        throw new DomainRuleError("ORGANIZATION_REQUIRES_OWNER", "An organization must retain at least one active owner.");
    }
}
export function assertValidAssetParent(asset, proposedParentId, assetsById) {
    if (proposedParentId === null)
        return;
    if (proposedParentId === asset.id) {
        throw new DomainRuleError("ASSET_PARENT_SELF", "An asset cannot be its own parent.");
    }
    const visited = new Set([asset.id]);
    let cursor = proposedParentId;
    while (cursor !== null) {
        if (visited.has(cursor)) {
            throw new DomainRuleError("ASSET_PARENT_CYCLE", "The parent relationship would create a cycle.");
        }
        visited.add(cursor);
        const parent = assetsById.get(cursor);
        if (!parent) {
            throw new DomainRuleError("ASSET_PARENT_NOT_FOUND", "The parent asset does not exist.");
        }
        if (parent.organizationId !== asset.organizationId || parent.siteId !== asset.siteId) {
            throw new DomainRuleError("ASSET_PARENT_SCOPE_MISMATCH", "Parent and child assets must belong to the same organization and site.");
        }
        cursor = parent.parentAssetId;
    }
}
export function validateAssetImportRows(rows) {
    const issues = [];
    const identifiers = new Set();
    for (const row of rows) {
        const identifier = row.identifier.trim().toLocaleLowerCase("en-US");
        if (!row.siteReference.trim())
            issues.push(issue(row.rowNumber, "siteReference", "REQUIRED"));
        if (!row.assetType.trim())
            issues.push(issue(row.rowNumber, "assetType", "REQUIRED"));
        if (!identifier)
            issues.push(issue(row.rowNumber, "identifier", "REQUIRED"));
        if (!row.name.trim())
            issues.push(issue(row.rowNumber, "name", "REQUIRED"));
        if (identifier && identifiers.has(identifier)) {
            issues.push(issue(row.rowNumber, "identifier", "DUPLICATE_IN_FILE"));
        }
        identifiers.add(identifier);
        const hasLatitude = row.latitude !== undefined;
        const hasLongitude = row.longitude !== undefined;
        if (hasLatitude !== hasLongitude) {
            issues.push(issue(row.rowNumber, hasLatitude ? "longitude" : "latitude", "COORDINATE_PAIR_REQUIRED"));
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
function issue(rowNumber, field, code) {
    return { rowNumber, field, code, message: `${String(field)} failed ${code}.` };
}
export function isArtifactCleanupEligible(status, expiresAt, now) {
    return status === "COMPLETED" && expiresAt !== null && expiresAt.getTime() <= now.getTime();
}
//# sourceMappingURL=index.js.map