"use client";

import Dexie, { type EntityTable } from "dexie";
import type { FieldCommand } from "@nexus/offline";

export interface CachedFieldContext {
  contextKey: string;
  organizationId: string;
  organizationName: string;
  userId: string;
  memberName: string;
  role: string;
  deviceId: string;
  lastSynchronizedAt: string;
  state: "ACTIVE" | "QUARANTINED";
  quarantineReason?: string;
}

export interface CachedAssignment {
  key: string;
  contextKey: string;
  inspectionRunId: string;
  downloadedAt: string;
  snapshot: FieldRunSnapshot;
  site: Record<string, unknown>;
  asset: Record<string, unknown> | null;
  localStatus:
    | "READY"
    | "DRAFT"
    | "LOCALLY_SUBMITTED"
    | "PENDING_SYNC"
    | "SYNCING"
    | "FAILED"
    | "CONFLICTED"
    | "SYNCHRONIZED";
}

export interface FieldRunSnapshot {
  id: string;
  status: string;
  siteId: string;
  assetId: string | null;
  assignedTo: string;
  scheduledFor: string;
  dueAt: string;
  notes: string | null;
  template: {
    sections: Array<{
      id: string;
      title: string;
      instructions?: string;
      items: Array<{
        id: string;
        label: string;
        responseType: string;
        required: boolean;
        options?: string[];
        minimum?: number;
        maximum?: number;
      }>;
    }>;
  };
  responses: Array<{ itemId: string; value: unknown }>;
}

export interface FieldDraft {
  key: string;
  contextKey: string;
  inspectionRunId: string;
  responses: Record<string, unknown>;
  notes: string;
  updatedAt: string;
  locallySubmittedAt: string | null;
}

export interface StoredFieldCommand extends FieldCommand {
  contextKey: string;
}

export interface StoredEvidence {
  evidenceId: string;
  contextKey: string;
  inspectionRunId: string;
  commandId: string;
  fileName: string;
  contentType: string;
  size: number;
  checksum: string;
  capturedAt: string;
  note: string;
  blob: Blob;
  state:
    | "CAPTURED"
    | "AUTHORIZATION_PENDING"
    | "AUTHORIZED"
    | "UPLOADING"
    | "UPLOADED"
    | "FINALIZATION_PENDING"
    | "FINALIZED"
    | "FAILED";
  uploadGrantId?: string;
  lastError?: string;
}

export interface FieldMeta {
  key: string;
  value: unknown;
}

class FieldDatabase extends Dexie {
  contexts!: EntityTable<CachedFieldContext, "contextKey">;
  assignments!: EntityTable<CachedAssignment, "key">;
  drafts!: EntityTable<FieldDraft, "key">;
  commands!: EntityTable<StoredFieldCommand, "commandId">;
  evidence!: EntityTable<StoredEvidence, "evidenceId">;
  meta!: EntityTable<FieldMeta, "key">;

  constructor() {
    super("nexus-field-v1");
    this.version(1).stores({
      contexts: "contextKey, organizationId, userId, deviceId, state, lastSynchronizedAt",
      assignments: "key, contextKey, inspectionRunId, localStatus, downloadedAt",
      drafts: "key, contextKey, inspectionRunId, updatedAt, locallySubmittedAt",
      commands:
        "commandId, contextKey, inspectionRunId, state, sequence, nextAttemptAt, [contextKey+sequence]",
      evidence: "evidenceId, contextKey, inspectionRunId, commandId, state, capturedAt",
      meta: "key",
    });
  }
}

export const fieldDb = new FieldDatabase();

export function fieldContextKey(organizationId: string, userId: string, deviceId: string): string {
  return `${organizationId}:${userId}:${deviceId}`;
}

export function assignmentKey(contextKey: string, inspectionRunId: string): string {
  return `${contextKey}:${inspectionRunId}`;
}

export async function hasUnsynchronizedWork(): Promise<boolean> {
  return (
    (await fieldDb.commands
      .where("state")
      .anyOf(["PENDING", "SYNCING", "RETRYABLE", "AUTH_REQUIRED", "CONFLICT", "PERMANENT_FAILURE"])
      .count()) > 0 || (await fieldDb.evidence.where("state").noneOf(["FINALIZED"]).count()) > 0
  );
}

export async function quarantineOtherContexts(
  activeContextKey: string,
  reason: string,
): Promise<void> {
  await fieldDb.transaction("rw", fieldDb.contexts, async () => {
    const others = await fieldDb.contexts.where("contextKey").notEqual(activeContextKey).toArray();
    await Promise.all(
      others
        .filter((context) => context.state === "ACTIVE")
        .map((context) =>
          fieldDb.contexts.update(context.contextKey, {
            state: "QUARANTINED",
            quarantineReason: reason,
          }),
        ),
    );
  });
}

export async function cleanupSynchronized(contextKey: string, before: Date): Promise<number> {
  const synchronized = await fieldDb.commands
    .where({ contextKey, state: "SYNCED" })
    .filter((command) => {
      const result = command.authoritativeResult as { acknowledgedAt?: string } | undefined;
      return Boolean(result?.acknowledgedAt && new Date(result.acknowledgedAt) < before);
    })
    .primaryKeys();
  await fieldDb.commands.bulkDelete(synchronized);
  const finalizedEvidence = await fieldDb.evidence
    .where({ contextKey, state: "FINALIZED" })
    .primaryKeys();
  await fieldDb.evidence.bulkDelete(finalizedEvidence);
  return synchronized.length + finalizedEvidence.length;
}
