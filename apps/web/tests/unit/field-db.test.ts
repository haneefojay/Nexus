import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  assignmentKey,
  cleanupSynchronized,
  fieldContextKey,
  fieldDb,
  hasUnsynchronizedWork,
  quarantineOtherContexts,
} from "../../lib/field-db";

beforeEach(async () => {
  fieldDb.close();
  await fieldDb.delete();
  await fieldDb.open();
});

afterEach(() => fieldDb.close());

describe("field IndexedDB", () => {
  it("persists tenant-scoped state across close and reopen", async () => {
    const contextKey = fieldContextKey("org", "user", "device");
    await fieldDb.contexts.put({
      contextKey,
      organizationId: "org",
      organizationName: "Network",
      userId: "user",
      memberName: "Technician",
      role: "TECHNICIAN",
      deviceId: "device",
      lastSynchronizedAt: "2026-09-30T12:00:00Z",
      state: "ACTIVE",
    });
    fieldDb.close();
    await fieldDb.open();
    expect(await fieldDb.contexts.get(contextKey)).toMatchObject({
      organizationId: "org",
      userId: "user",
      deviceId: "device",
    });
    expect(fieldDb.verno).toBe(1);
  });

  it("quarantines another context without destroying pending work", async () => {
    const active = fieldContextKey("org-a", "user-a", "device");
    const other = fieldContextKey("org-b", "user-b", "device");
    await fieldDb.contexts.bulkPut([
      {
        contextKey: active,
        organizationId: "org-a",
        organizationName: "A",
        userId: "user-a",
        memberName: "A",
        role: "TECHNICIAN",
        deviceId: "device",
        lastSynchronizedAt: "2026-09-30T12:00:00Z",
        state: "ACTIVE",
      },
      {
        contextKey: other,
        organizationId: "org-b",
        organizationName: "B",
        userId: "user-b",
        memberName: "B",
        role: "TECHNICIAN",
        deviceId: "device",
        lastSynchronizedAt: "2026-09-30T11:00:00Z",
        state: "ACTIVE",
      },
    ]);
    await fieldDb.commands.put({
      commandId: "command",
      contextKey: other,
      organizationId: "org-b",
      inspectionRunId: "run",
      userId: "user-b",
      deviceId: "device",
      sequence: 1,
      dependsOn: [],
      occurredAt: "2026-09-30T11:00:00Z",
      idempotencyKey: "field:device:command",
      type: "START_INSPECTION",
      payload: {},
      state: "PENDING",
      attempts: 0,
      nextAttemptAt: null,
    });

    await quarantineOtherContexts(active, "Context changed");
    expect(await fieldDb.contexts.get(other)).toMatchObject({
      state: "QUARANTINED",
      quarantineReason: "Context changed",
    });
    expect(await fieldDb.commands.get("command")).toBeTruthy();
    expect(await hasUnsynchronizedWork()).toBe(true);
  });

  it("cleans only acknowledged synchronized records", async () => {
    const contextKey = fieldContextKey("org", "user", "device");
    await fieldDb.commands.bulkPut([
      {
        commandId: "old",
        contextKey,
        organizationId: "org",
        inspectionRunId: "run",
        userId: "user",
        deviceId: "device",
        sequence: 1,
        dependsOn: [],
        occurredAt: "2026-09-01T00:00:00Z",
        idempotencyKey: "field:device:old-command",
        type: "START_INSPECTION",
        payload: {},
        state: "SYNCED",
        attempts: 0,
        nextAttemptAt: null,
        authoritativeResult: { acknowledgedAt: "2026-09-01T00:00:00Z" },
      },
      {
        commandId: "pending",
        contextKey,
        organizationId: "org",
        inspectionRunId: "run",
        userId: "user",
        deviceId: "device",
        sequence: 2,
        dependsOn: [],
        occurredAt: "2026-09-01T00:00:00Z",
        idempotencyKey: "field:device:pending-command",
        type: "SAVE_RESPONSES",
        payload: { responses: [] },
        state: "PENDING",
        attempts: 0,
        nextAttemptAt: null,
      },
    ]);
    await cleanupSynchronized(contextKey, new Date("2026-09-10T00:00:00Z"));
    expect(await fieldDb.commands.get("old")).toBeUndefined();
    expect(await fieldDb.commands.get("pending")).toBeTruthy();
    expect(assignmentKey(contextKey, "run")).toContain("run");
  });
});
