import { describe, expect, it } from "vitest";

import { fieldAssignmentQuerySchema, fieldSyncBatchSchema } from "../../src/index.js";

const id = (suffix: string) => `0199a000-0000-7000-8000-${suffix.padStart(12, "0")}`;

describe("Phase 4 field synchronization input", () => {
  it("accepts a bound versioned command batch", () => {
    expect(
      fieldSyncBatchSchema.safeParse({
        protocolVersion: 1,
        localSchemaVersion: 1,
        deviceId: id("1"),
        commands: [
          {
            commandId: id("2"),
            organizationId: id("3"),
            inspectionRunId: id("4"),
            userId: id("5"),
            deviceId: id("1"),
            sequence: 1,
            dependsOn: [],
            occurredAt: "2026-09-30T18:00:00.000Z",
            idempotencyKey: `field:${id("1")}:${id("2")}`,
            type: "START_INSPECTION",
            payload: {},
          },
        ],
      }).success,
    ).toBe(true);
  });

  it("rejects incompatible protocol, non-v7 devices, and unbounded batches", () => {
    expect(
      fieldAssignmentQuerySchema.safeParse({
        protocolVersion: 2,
        localSchemaVersion: 1,
        deviceId: "550e8400-e29b-41d4-a716-446655440000",
      }).success,
    ).toBe(false);
    expect(
      fieldSyncBatchSchema.safeParse({
        protocolVersion: 1,
        localSchemaVersion: 1,
        deviceId: id("1"),
        commands: [],
      }).success,
    ).toBe(false);
  });

  it("requires inspection-run-bound offline evidence", () => {
    const result = fieldSyncBatchSchema.safeParse({
      protocolVersion: 1,
      localSchemaVersion: 1,
      deviceId: id("1"),
      commands: [
        {
          commandId: id("2"),
          organizationId: id("3"),
          inspectionRunId: id("4"),
          userId: id("5"),
          deviceId: id("1"),
          sequence: 1,
          dependsOn: [],
          occurredAt: "2026-09-30T18:00:00.000Z",
          idempotencyKey: `field:${id("1")}:${id("2")}`,
          type: "AUTHORIZE_EVIDENCE",
          payload: {
            targetType: "FINDING",
            targetId: id("4"),
            originalName: "photo.jpg",
            contentType: "image/jpeg",
            contentLength: 7,
            checksum: "a".repeat(64),
          },
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
