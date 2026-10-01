export declare const fieldProtocolVersion: 1;
export declare const fieldLocalSchemaVersion: 1;
export declare const fieldCommandTypes: readonly ["START_INSPECTION", "SAVE_RESPONSES", "AUTHORIZE_EVIDENCE", "FINALIZE_EVIDENCE", "SUBMIT_INSPECTION"];
export type FieldCommandType = (typeof fieldCommandTypes)[number];
export type CommandState = "PENDING" | "SYNCING" | "RETRYABLE" | "PERMANENT_FAILURE" | "CONFLICT" | "AUTH_REQUIRED" | "SYNCED";
export type FieldSyncOutcome = "SUCCESS" | "RETRYABLE_FAILURE" | "PERMANENT_FAILURE" | "AUTHENTICATION_FAILURE" | "CONFLICT";
export interface FieldCommand<TPayload = unknown> {
    commandId: string;
    organizationId: string;
    inspectionRunId: string;
    userId: string;
    deviceId: string;
    sequence: number;
    dependsOn: string[];
    occurredAt: string;
    idempotencyKey: string;
    type: FieldCommandType;
    payload: TPayload;
    state: CommandState;
    attempts: number;
    nextAttemptAt: string | null;
    authoritativeResult?: unknown;
    lastErrorCode?: string;
}
export interface FieldCommandResult {
    commandId: string;
    idempotencyKey: string;
    outcome: FieldSyncOutcome;
    code: string;
    retryAfterMs?: number;
    authoritativeResult?: unknown;
}
export interface FieldContext {
    organizationId: string;
    userId: string;
    deviceId: string;
}
export interface EvidenceCheckpoint {
    evidenceId: string;
    commandId: string;
    state: "CAPTURED" | "AUTHORIZATION_PENDING" | "AUTHORIZED" | "UPLOADING" | "UPLOADED" | "FINALIZATION_PENDING" | "FINALIZED" | "FAILED";
    uploadGrantId?: string;
    checksum?: string;
    attempts: number;
}
export declare function assertCommandBinding(command: FieldCommand, context: FieldContext): void;
export declare function orderedReadyCommands<TCommand extends FieldCommand>(commands: readonly TCommand[], now?: Date): TCommand[];
export declare function retryDelayMs(attempt: number): number;
export declare function applyCommandResult(command: FieldCommand, result: FieldCommandResult, now?: Date): FieldCommand;
export declare function advanceEvidenceCheckpoint(checkpoint: EvidenceCheckpoint, event: "REQUEST_AUTHORIZATION" | "AUTHORIZED" | "BEGIN_UPLOAD" | "UPLOADED" | "REQUEST_FINALIZATION" | "FINALIZED" | "FAILED", data?: Partial<Pick<EvidenceCheckpoint, "uploadGrantId" | "checksum">>): EvidenceCheckpoint;
export declare function cleanupEligible(command: FieldCommand, acknowledgedBefore: Date): boolean;
export declare function localDateTime(utcIso: string, timeZone: string): string;
export declare function createUuidV7(now?: number): string;
//# sourceMappingURL=index.d.ts.map