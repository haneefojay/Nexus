import { describe, expect, it } from "vitest";

import {
  advanceEvidenceCheckpoint,
  applyCommandResult,
  assertCommandBinding,
  cleanupEligible,
  createUuidV7,
  localDateTime,
  orderedReadyCommands,
  retryDelayMs,
  type FieldCommand,
} from "../../src/index.js";

const command = (overrides: Partial<FieldCommand> = {}): FieldCommand => ({
  commandId: createUuidV7(1_700_000_000_000),
  organizationId: "org",
  inspectionRunId: "run",
  userId: "user",
  deviceId: "device",
  sequence: 1,
  dependsOn: [],
  occurredAt: "2026-09-30T12:00:00.000Z",
  idempotencyKey: "idem",
  type: "START_INSPECTION",
  payload: {},
  state: "PENDING",
  attempts: 0,
  nextAttemptAt: null,
  ...overrides,
});

describe("field command queue", () => {
  it("orders commands and blocks unmet dependencies", () => {
    const first = command({ commandId: "first", sequence: 1, state: "SYNCED" });
    const second = command({ commandId: "second", sequence: 2, dependsOn: ["first"] });
    const blocked = command({ commandId: "third", sequence: 3, dependsOn: ["missing"] });
    expect(
      orderedReadyCommands([blocked, second, first]).map(({ commandId }) => commandId),
    ).toEqual(["second"]);
  });

  it("uses deterministic bounded backoff and terminal retry state", () => {
    expect([0, 1, 2, 6, 20].map(retryDelayMs)).toEqual([1000, 2000, 4000, 60000, 60000]);
    const original = command({ attempts: 5 });
    const updated = applyCommandResult(original, {
      commandId: original.commandId,
      idempotencyKey: "idem",
      outcome: "RETRYABLE_FAILURE",
      code: "TEMPORARY",
    });
    expect(updated.state).toBe("PERMANENT_FAILURE");
  });

  it("classifies authentication and conflict outcomes without retrying", () => {
    const original = command();
    expect(
      applyCommandResult(original, {
        commandId: original.commandId,
        idempotencyKey: "idem",
        outcome: "AUTHENTICATION_FAILURE",
        code: "SESSION_EXPIRED",
      }).state,
    ).toBe("AUTH_REQUIRED");
    expect(
      applyCommandResult(original, {
        commandId: original.commandId,
        idempotencyKey: "idem",
        outcome: "CONFLICT",
        code: "RUN_STATE_CHANGED",
      }).state,
    ).toBe("CONFLICT");
  });

  it("rejects cross-context commands", () => {
    expect(() =>
      assertCommandBinding(command(), {
        organizationId: "other",
        userId: "user",
        deviceId: "device",
      }),
    ).toThrow("FIELD_CONTEXT_MISMATCH");
  });

  it("persists explicit evidence checkpoints", () => {
    const captured = {
      evidenceId: "e",
      commandId: "c",
      state: "CAPTURED" as const,
      attempts: 0,
    };
    const pending = advanceEvidenceCheckpoint(captured, "REQUEST_AUTHORIZATION");
    const authorized = advanceEvidenceCheckpoint(pending, "AUTHORIZED", { uploadGrantId: "grant" });
    expect(authorized).toMatchObject({ state: "AUTHORIZED", uploadGrantId: "grant" });
    expect(() => advanceEvidenceCheckpoint(captured, "FINALIZED")).toThrow(
      "INVALID_EVIDENCE_TRANSITION",
    );
  });

  it("only cleans acknowledged synchronized commands", () => {
    expect(
      cleanupEligible(
        command({
          state: "SYNCED",
          authoritativeResult: { acknowledgedAt: "2026-09-01T00:00:00Z" },
        }),
        new Date("2026-09-30T00:00:00Z"),
      ),
    ).toBe(true);
    expect(cleanupEligible(command(), new Date())).toBe(false);
  });

  it("generates UUIDv7 identifiers", () => {
    expect(createUuidV7()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("presents persisted UTC instants in the organization timezone", () => {
    expect(localDateTime("2026-09-30T17:30:00.000Z", "Africa/Lagos")).toContain("18:30");
  });
});
