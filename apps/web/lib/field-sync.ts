"use client";

import {
  applyCommandResult,
  createUuidV7,
  orderedReadyCommands,
  type FieldCommand,
  type FieldCommandResult,
} from "@nexus/offline";

import { api, apiUrl, ApiClientError } from "./api";
import {
  assignmentKey,
  fieldContextKey,
  fieldDb,
  quarantineOtherContexts,
  type CachedAssignment,
  type CachedFieldContext,
  type FieldDraft,
  type StoredEvidence,
  type StoredFieldCommand,
} from "./field-db";

interface AssignmentPayload {
  protocolVersion: 1;
  localSchemaVersion: 1;
  synchronizedAt: string;
  context: Omit<CachedFieldContext, "contextKey" | "lastSynchronizedAt" | "state">;
  assignments: Array<{
    snapshot: CachedAssignment["snapshot"];
    site: Record<string, unknown>;
    asset: Record<string, unknown> | null;
  }>;
}

interface BatchPayload {
  protocolVersion: 1;
  results: FieldCommandResult[];
}

let processorActive = false;

export async function ensureDeviceId(): Promise<string> {
  const existing = await fieldDb.meta.get("device-id");
  if (typeof existing?.value === "string") return existing.value;
  const deviceId = createUuidV7();
  await fieldDb.meta.put({ key: "device-id", value: deviceId });
  return deviceId;
}

export async function downloadAssignments(
  organizationId: string,
  deviceLabel = browserDeviceLabel(),
): Promise<CachedFieldContext> {
  const deviceId = await ensureDeviceId();
  const response = await api<{ data: AssignmentPayload }>(
    `/v1/sync/field/assignments?protocolVersion=1&localSchemaVersion=1&deviceId=${encodeURIComponent(deviceId)}&deviceLabel=${encodeURIComponent(deviceLabel)}`,
    {},
    organizationId,
  );
  const { context, assignments, synchronizedAt } = response.data;
  const contextKey = fieldContextKey(context.organizationId, context.userId, context.deviceId);
  const localContext: CachedFieldContext = {
    ...context,
    contextKey,
    lastSynchronizedAt: synchronizedAt,
    state: "ACTIVE",
  };

  await fieldDb.transaction(
    "rw",
    fieldDb.contexts,
    fieldDb.assignments,
    fieldDb.drafts,
    async () => {
      await fieldDb.contexts.put(localContext);
      for (const item of assignments) {
        const key = assignmentKey(contextKey, item.snapshot.id);
        const existing = await fieldDb.assignments.get(key);
        await fieldDb.assignments.put({
          key,
          contextKey,
          inspectionRunId: item.snapshot.id,
          downloadedAt: synchronizedAt,
          snapshot: item.snapshot,
          site: item.site,
          asset: item.asset,
          localStatus: existing?.localStatus ?? "READY",
        });
        if (!(await fieldDb.drafts.get(key))) {
          await fieldDb.drafts.put({
            key,
            contextKey,
            inspectionRunId: item.snapshot.id,
            responses: Object.fromEntries(
              item.snapshot.responses.map((response) => [response.itemId, response.value]),
            ),
            notes: item.snapshot.notes ?? "",
            updatedAt: synchronizedAt,
            locallySubmittedAt: null,
          });
        }
      }
    },
  );
  await quarantineOtherContexts(contextKey, "Another organization or member context became active");
  return localContext;
}

export async function saveDraft(
  assignment: CachedAssignment,
  responses: Record<string, unknown>,
  notes: string,
): Promise<void> {
  const draft: FieldDraft = {
    key: assignment.key,
    contextKey: assignment.contextKey,
    inspectionRunId: assignment.inspectionRunId,
    responses,
    notes,
    updatedAt: new Date().toISOString(),
    locallySubmittedAt: null,
  };
  await fieldDb.transaction("rw", fieldDb.drafts, fieldDb.assignments, async () => {
    await fieldDb.drafts.put(draft);
    await fieldDb.assignments.update(assignment.key, { localStatus: "DRAFT" });
  });
}

export async function locallySubmit(
  context: CachedFieldContext,
  assignment: CachedAssignment,
  draft: FieldDraft,
): Promise<void> {
  const items = assignment.snapshot.template.sections.flatMap((section) => section.items);
  const missing = items.filter(
    (item) =>
      item.required &&
      (draft.responses[item.id] === undefined ||
        draft.responses[item.id] === null ||
        draft.responses[item.id] === ""),
  );
  if (missing.length) throw new Error(`Complete ${missing.length} required response(s)`);

  const existing = await fieldDb.commands
    .where("inspectionRunId")
    .equals(assignment.inspectionRunId)
    .toArray();
  const nextSequence = Math.max(0, ...existing.map((command) => command.sequence)) + 1;
  const start = makeCommand(
    context,
    assignment.inspectionRunId,
    nextSequence,
    "START_INSPECTION",
    {},
  );
  const save = makeCommand(
    context,
    assignment.inspectionRunId,
    nextSequence + 1,
    "SAVE_RESPONSES",
    {
      responses: Object.entries(draft.responses).map(([itemId, value]) => ({ itemId, value })),
      notes: draft.notes || undefined,
    },
    [start.commandId],
  );
  const pendingEvidence = await fieldDb.evidence
    .where("inspectionRunId")
    .equals(assignment.inspectionRunId)
    .filter((item) => item.state !== "FINALIZED")
    .toArray();
  const evidenceCommands = pendingEvidence.map((item, index) =>
    makeCommand(
      context,
      assignment.inspectionRunId,
      nextSequence + 100 * (index + 1),
      "AUTHORIZE_EVIDENCE",
      {
        targetType: "INSPECTION_RUN",
        targetId: assignment.inspectionRunId,
        originalName: item.fileName,
        contentType: item.contentType,
        contentLength: item.size,
        checksum: item.checksum,
      },
      [save.commandId],
    ),
  );
  const submit = makeCommand(
    context,
    assignment.inspectionRunId,
    Math.min(1_000_000, nextSequence + 100_000),
    "SUBMIT_INSPECTION",
    {},
    evidenceCommands.length
      ? evidenceCommands.map((command) => command.commandId)
      : [save.commandId],
  );

  await fieldDb.transaction(
    "rw",
    fieldDb.commands,
    fieldDb.assignments,
    fieldDb.drafts,
    fieldDb.evidence,
    async () => {
      await fieldDb.commands.bulkPut([start, save, ...evidenceCommands, submit]);
      for (const [index, item] of pendingEvidence.entries()) {
        await fieldDb.evidence.update(item.evidenceId, {
          commandId: evidenceCommands[index]!.commandId,
          state: "AUTHORIZATION_PENDING",
        });
      }
      await fieldDb.drafts.update(draft.key, { locallySubmittedAt: new Date().toISOString() });
      await fieldDb.assignments.update(assignment.key, { localStatus: "LOCALLY_SUBMITTED" });
    },
  );
}

export async function captureEvidence(
  assignment: CachedAssignment,
  file: File,
  note: string,
): Promise<void> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Choose a JPEG, PNG, or WebP image");
  if (file.size <= 0 || file.size > 20 * 1024 * 1024)
    throw new Error("Photo must be between 1 byte and 20 MB");
  const checksum = await sha256(file);
  const record: StoredEvidence = {
    evidenceId: createUuidV7(),
    contextKey: assignment.contextKey,
    inspectionRunId: assignment.inspectionRunId,
    commandId: "",
    fileName: file.name,
    contentType: file.type,
    size: file.size,
    checksum,
    capturedAt: new Date(file.lastModified || Date.now()).toISOString(),
    note,
    blob: file,
    state: "CAPTURED",
  };
  try {
    await fieldDb.evidence.add(record);
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError")
      throw new Error("Device storage is full. Free space before capturing more evidence.");
    throw error;
  }
}

export async function synchronizeContext(context: CachedFieldContext): Promise<void> {
  if (!navigator.onLine || processorActive || context.state !== "ACTIVE") return;
  processorActive = true;
  try {
    const run = async () => {
      for (let pass = 0; pass < 100; pass += 1) {
        const commands = await fieldDb.commands
          .where("contextKey")
          .equals(context.contextKey)
          .toArray();
        const command = orderedReadyCommands(commands)[0];
        if (!command) break;
        await fieldDb.commands.update(command.commandId, { state: "SYNCING" });
        await fieldDb.assignments.update(
          assignmentKey(context.contextKey, command.inspectionRunId),
          { localStatus: "SYNCING" },
        );
        try {
          const response = await api<{ data: BatchPayload }>(
            "/v1/sync/field/commands",
            {
              method: "POST",
              body: JSON.stringify({
                protocolVersion: 1,
                localSchemaVersion: 1,
                deviceId: context.deviceId,
                commands: [wireCommand(command)],
              }),
            },
            context.organizationId,
          );
          const result = response.data.results[0]!;
          if (command.type === "AUTHORIZE_EVIDENCE" && result.outcome === "SUCCESS")
            await uploadAuthorizedEvidence(command, result, context);
          if (command.type === "FINALIZE_EVIDENCE" && result.outcome === "SUCCESS") {
            const localEvidence = await fieldDb.evidence
              .where("commandId")
              .equals(command.commandId)
              .first();
            if (localEvidence)
              await fieldDb.evidence.update(localEvidence.evidenceId, {
                state: "FINALIZED",
                blob: new Blob(),
              });
          }
          const updated = applyCommandResult(command, stripSignedAuthorization(command, result));
          await fieldDb.commands.put({ ...updated, contextKey: command.contextKey });
          await reflectAssignmentState(context.contextKey, command.inspectionRunId);
        } catch (error) {
          const authentication =
            error instanceof ApiClientError
              ? error.status === 401
              : error instanceof Error && /session|verified|401/i.test(error.message);
          const conflict =
            error instanceof ApiClientError && [403, 404, 409].includes(error.status);
          const result: FieldCommandResult = {
            commandId: command.commandId,
            idempotencyKey: command.idempotencyKey,
            outcome: authentication
              ? "AUTHENTICATION_FAILURE"
              : conflict
                ? "CONFLICT"
                : "RETRYABLE_FAILURE",
            code: authentication
              ? "SESSION_EXPIRED"
              : conflict
                ? "ASSIGNMENT_OR_MEMBERSHIP_REVOKED"
                : "NETWORK_UNAVAILABLE",
          };
          const updated = applyCommandResult(command, result);
          await fieldDb.commands.put({ ...updated, contextKey: command.contextKey });
          await reflectAssignmentState(context.contextKey, command.inspectionRunId);
          if (authentication || conflict || !navigator.onLine) break;
        }
      }
    };
    if ("locks" in navigator)
      await navigator.locks.request(`nexus-field-sync:${context.contextKey}`, run);
    else await run();
  } finally {
    processorActive = false;
  }
}

export async function retryCommand(commandId: string): Promise<void> {
  await fieldDb.commands.update(commandId, {
    state: "PENDING",
    attempts: 0,
    nextAttemptAt: null,
    lastErrorCode: undefined,
  });
}

export async function discardRecoverableRun(
  contextKey: string,
  inspectionRunId: string,
): Promise<void> {
  const commands = await fieldDb.commands
    .where({ contextKey, inspectionRunId })
    .filter((command) => command.state !== "SYNCED")
    .primaryKeys();
  await fieldDb.transaction(
    "rw",
    fieldDb.commands,
    fieldDb.evidence,
    fieldDb.drafts,
    fieldDb.assignments,
    async () => {
      await fieldDb.commands.bulkDelete(commands);
      await fieldDb.evidence.where({ contextKey, inspectionRunId }).delete();
      await fieldDb.drafts.delete(assignmentKey(contextKey, inspectionRunId));
      await fieldDb.assignments.delete(assignmentKey(contextKey, inspectionRunId));
    },
  );
}

function makeCommand(
  context: CachedFieldContext,
  inspectionRunId: string,
  sequence: number,
  type: FieldCommand["type"],
  payload: unknown,
  dependsOn: string[] = [],
): StoredFieldCommand {
  const commandId = createUuidV7();
  return {
    commandId,
    contextKey: context.contextKey,
    organizationId: context.organizationId,
    inspectionRunId,
    userId: context.userId,
    deviceId: context.deviceId,
    sequence,
    dependsOn,
    occurredAt: new Date().toISOString(),
    idempotencyKey: `field:${context.deviceId}:${commandId}`,
    type,
    payload,
    state: "PENDING",
    attempts: 0,
    nextAttemptAt: null,
  };
}

function wireCommand(command: StoredFieldCommand) {
  return {
    commandId: command.commandId,
    organizationId: command.organizationId,
    inspectionRunId: command.inspectionRunId,
    userId: command.userId,
    deviceId: command.deviceId,
    sequence: command.sequence,
    dependsOn: command.dependsOn,
    occurredAt: command.occurredAt,
    idempotencyKey: command.idempotencyKey,
    type: command.type,
    payload: command.payload,
  };
}

async function uploadAuthorizedEvidence(
  command: StoredFieldCommand,
  result: FieldCommandResult,
  context: CachedFieldContext,
): Promise<void> {
  const authorization = result.authoritativeResult as
    | {
        uploadGrantId?: string;
        uploadUrl?: string;
        requiredHeaders?: Record<string, string>;
      }
    | undefined;
  if (!authorization?.uploadGrantId || !authorization.uploadUrl)
    throw new Error("Upload authorization was not returned");
  const evidence = await fieldDb.evidence.where("commandId").equals(command.commandId).first();
  if (!evidence) throw new Error("Local evidence record is unavailable");
  await fieldDb.evidence.update(evidence.evidenceId, {
    state: "UPLOADING",
    uploadGrantId: authorization.uploadGrantId,
  });
  const upload = await fetch(authorization.uploadUrl, {
    method: "PUT",
    headers: authorization.requiredHeaders,
    body: evidence.blob,
  });
  if (!upload.ok) {
    await fieldDb.evidence.update(evidence.evidenceId, {
      state: "FAILED",
      lastError: "Photo upload was interrupted",
    });
    throw new Error("Photo upload was interrupted");
  }
  await fieldDb.evidence.update(evidence.evidenceId, { state: "FINALIZATION_PENDING" });
  const finalize = makeCommand(
    context,
    command.inspectionRunId,
    command.sequence + 1,
    "FINALIZE_EVIDENCE",
    {
      uploadGrantId: authorization.uploadGrantId,
      capturedAt: evidence.capturedAt,
      note: evidence.note || undefined,
      deviceMetadata: { deviceId: context.deviceId, source: "nexus-field-pwa" },
    },
    [command.commandId],
  );
  await fieldDb.transaction("rw", fieldDb.commands, fieldDb.evidence, async () => {
    await fieldDb.commands.put(finalize);
    const submit = await fieldDb.commands
      .where("inspectionRunId")
      .equals(command.inspectionRunId)
      .filter((candidate) => candidate.type === "SUBMIT_INSPECTION")
      .first();
    if (submit) {
      const dependsOn = submit.dependsOn.map((dependency) =>
        dependency === command.commandId ? finalize.commandId : dependency,
      );
      await fieldDb.commands.update(submit.commandId, { dependsOn });
    }
    await fieldDb.evidence.update(evidence.evidenceId, {
      commandId: finalize.commandId,
      state: "FINALIZATION_PENDING",
    });
  });
}

function stripSignedAuthorization(
  command: StoredFieldCommand,
  result: FieldCommandResult,
): FieldCommandResult {
  if (command.type !== "AUTHORIZE_EVIDENCE" || !result.authoritativeResult) return result;
  const authorization = result.authoritativeResult as Record<string, unknown>;
  return {
    ...result,
    authoritativeResult: {
      uploadGrantId: authorization.uploadGrantId,
      expiresAt: authorization.expiresAt,
      acknowledgedAt: authorization.acknowledgedAt ?? new Date().toISOString(),
    },
  };
}

async function reflectAssignmentState(contextKey: string, inspectionRunId: string): Promise<void> {
  const commands = await fieldDb.commands.where({ contextKey, inspectionRunId }).toArray();
  const state = commands.some((command) => command.state === "CONFLICT")
    ? "CONFLICTED"
    : commands.some((command) => ["PERMANENT_FAILURE", "AUTH_REQUIRED"].includes(command.state))
      ? "FAILED"
      : commands.some((command) => command.state === "SYNCING")
        ? "SYNCING"
        : commands.length > 0 && commands.every((command) => command.state === "SYNCED")
          ? "SYNCHRONIZED"
          : "PENDING_SYNC";
  await fieldDb.assignments.update(assignmentKey(contextKey, inspectionRunId), {
    localStatus: state,
  });
}

async function sha256(blob: Blob): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function browserDeviceLabel(): string {
  return `${navigator.platform || "Browser"} field PWA`.slice(0, 120);
}

export async function inspectRecoveryRecord(contextKey: string, inspectionRunId: string) {
  const [assignment, draft, commands, evidence] = await Promise.all([
    fieldDb.assignments.get(assignmentKey(contextKey, inspectionRunId)),
    fieldDb.drafts.get(assignmentKey(contextKey, inspectionRunId)),
    fieldDb.commands.where({ contextKey, inspectionRunId }).toArray(),
    fieldDb.evidence.where({ contextKey, inspectionRunId }).toArray(),
  ]);
  return {
    assignment,
    draft,
    commands: commands.map((command) => ({
      commandId: command.commandId,
      inspectionRunId: command.inspectionRunId,
      deviceId: command.deviceId,
      sequence: command.sequence,
      dependsOn: command.dependsOn,
      occurredAt: command.occurredAt,
      type: command.type,
      state: command.state,
      attempts: command.attempts,
      lastErrorCode: command.lastErrorCode,
    })),
    evidence: evidence.map((item) => ({
      evidenceId: item.evidenceId,
      inspectionRunId: item.inspectionRunId,
      commandId: item.commandId,
      fileName: item.fileName,
      contentType: item.contentType,
      size: item.size,
      checksum: item.checksum,
      capturedAt: item.capturedAt,
      note: item.note,
      state: item.state,
      uploadGrantId: item.uploadGrantId,
      lastError: item.lastError,
    })),
    apiOrigin: new URL(apiUrl).origin,
  };
}
