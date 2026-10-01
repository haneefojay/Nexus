export const fieldProtocolVersion = 1;
export const fieldLocalSchemaVersion = 1;
export const fieldCommandTypes = [
    "START_INSPECTION",
    "SAVE_RESPONSES",
    "AUTHORIZE_EVIDENCE",
    "FINALIZE_EVIDENCE",
    "SUBMIT_INSPECTION",
];
export function assertCommandBinding(command, context) {
    if (command.organizationId !== context.organizationId ||
        command.userId !== context.userId ||
        command.deviceId !== context.deviceId) {
        throw new Error("FIELD_CONTEXT_MISMATCH");
    }
}
export function orderedReadyCommands(commands, now = new Date()) {
    const synchronized = new Set(commands.filter((command) => command.state === "SYNCED").map((command) => command.commandId));
    return [...commands]
        .filter((command) => (command.state === "PENDING" || command.state === "RETRYABLE") &&
        (!command.nextAttemptAt || new Date(command.nextAttemptAt) <= now) &&
        command.dependsOn.every((dependency) => synchronized.has(dependency)))
        .sort((left, right) => left.sequence - right.sequence || left.commandId.localeCompare(right.commandId));
}
export function retryDelayMs(attempt) {
    const boundedAttempt = Math.max(0, Math.min(attempt, 6));
    return Math.min(60_000, 1_000 * 2 ** boundedAttempt);
}
export function applyCommandResult(command, result, now = new Date()) {
    if (result.commandId !== command.commandId || result.idempotencyKey !== command.idempotencyKey) {
        throw new Error("COMMAND_RESULT_MISMATCH");
    }
    const common = {
        ...command,
        authoritativeResult: result.authoritativeResult,
        lastErrorCode: result.code,
    };
    switch (result.outcome) {
        case "SUCCESS":
            return { ...common, state: "SYNCED", nextAttemptAt: null };
        case "AUTHENTICATION_FAILURE":
            return { ...common, state: "AUTH_REQUIRED", nextAttemptAt: null };
        case "CONFLICT":
            return { ...common, state: "CONFLICT", nextAttemptAt: null };
        case "PERMANENT_FAILURE":
            return { ...common, state: "PERMANENT_FAILURE", nextAttemptAt: null };
        case "RETRYABLE_FAILURE": {
            const attempts = command.attempts + 1;
            if (attempts >= 6)
                return { ...common, attempts, state: "PERMANENT_FAILURE", nextAttemptAt: null };
            const delay = result.retryAfterMs ?? retryDelayMs(command.attempts);
            return {
                ...common,
                attempts,
                state: "RETRYABLE",
                nextAttemptAt: new Date(now.getTime() + delay).toISOString(),
            };
        }
    }
}
export function advanceEvidenceCheckpoint(checkpoint, event, data = {}) {
    const transitions = {
        CAPTURED: { REQUEST_AUTHORIZATION: "AUTHORIZATION_PENDING", FAILED: "FAILED" },
        AUTHORIZATION_PENDING: { AUTHORIZED: "AUTHORIZED", FAILED: "FAILED" },
        AUTHORIZED: { BEGIN_UPLOAD: "UPLOADING", FAILED: "FAILED" },
        UPLOADING: { UPLOADED: "UPLOADED", FAILED: "FAILED" },
        UPLOADED: { REQUEST_FINALIZATION: "FINALIZATION_PENDING", FAILED: "FAILED" },
        FINALIZATION_PENDING: { FINALIZED: "FINALIZED", FAILED: "FAILED" },
        FINALIZED: {},
        FAILED: { REQUEST_AUTHORIZATION: "AUTHORIZATION_PENDING" },
    };
    const state = transitions[checkpoint.state][event];
    if (!state)
        throw new Error(`INVALID_EVIDENCE_TRANSITION:${checkpoint.state}:${event}`);
    return { ...checkpoint, ...data, state };
}
export function cleanupEligible(command, acknowledgedBefore) {
    if (command.state !== "SYNCED" || !command.authoritativeResult)
        return false;
    const result = command.authoritativeResult;
    return Boolean(result.acknowledgedAt && new Date(result.acknowledgedAt) < acknowledgedBefore);
}
export function localDateTime(utcIso, timeZone) {
    return new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone,
    }).format(new Date(utcIso));
}
export function createUuidV7(now = Date.now()) {
    const webCrypto = globalThis.crypto;
    if (!webCrypto)
        throw new Error("SECURE_RANDOM_UNAVAILABLE");
    const bytes = webCrypto.getRandomValues(new Uint8Array(16));
    let timestamp = now;
    for (let index = 5; index >= 0; index -= 1) {
        bytes[index] = timestamp % 256;
        timestamp = Math.floor(timestamp / 256);
    }
    bytes[6] = (bytes[6] & 0x0f) | 0x70;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
//# sourceMappingURL=index.js.map