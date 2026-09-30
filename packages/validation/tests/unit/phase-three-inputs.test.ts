import { describe, expect, it } from "vitest";

import {
  correctiveActionCreateSchema,
  evidenceFinalizeSchema,
  evidenceUploadAuthorizeSchema,
  findingDismissSchema,
} from "../../src/index.js";

const id = "01990000-0000-7000-8000-000000000001";

describe("Phase 3 request validation", () => {
  it("requires dismissal reasons", () => {
    expect(findingDismissSchema.safeParse({ reason: "  " }).success).toBe(false);
  });

  it("validates action deadlines and UUIDv7 assignees", () => {
    expect(
      correctiveActionCreateSchema.safeParse({
        title: "Replace isolator",
        description: "Replace and photograph the failed isolator",
        assignedTo: id,
        priority: "HIGH",
        dueAt: "2026-10-01T12:00:00.000Z",
      }).success,
    ).toBe(true);
  });

  it("enforces evidence type, checksum, size, and paired coordinates", () => {
    expect(
      evidenceUploadAuthorizeSchema.safeParse({
        targetType: "CORRECTIVE_ACTION",
        targetId: id,
        originalName: "proof.jpg",
        contentType: "text/html",
        contentLength: 10,
        checksum: "a".repeat(64),
      }).success,
    ).toBe(false);
    expect(
      evidenceFinalizeSchema.safeParse({
        uploadGrantId: id,
        latitude: 6.5,
      }).success,
    ).toBe(false);
  });
});
