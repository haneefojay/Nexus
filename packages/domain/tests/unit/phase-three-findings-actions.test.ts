import { describe, expect, it } from "vitest";

import {
  assertCorrectiveActionTransition,
  assertFindingTransition,
  isCorrectiveActionOverdue,
} from "../../src/index.js";

describe("Phase 3 finding lifecycle", () => {
  it("requires a dismissal reason", () => {
    expect(() =>
      assertFindingTransition("OPEN", "DISMISSED", {
        severity: "LOW",
        hasVerifiedAction: false,
      }),
    ).toThrowError(/dismissal reason/i);
  });

  it("requires verified remediation before a critical finding can verify", () => {
    expect(() =>
      assertFindingTransition("READY_FOR_VERIFICATION", "VERIFIED", {
        severity: "CRITICAL",
        hasVerifiedAction: false,
      }),
    ).toThrowError(/critical finding requires/i);
    expect(() =>
      assertFindingTransition("READY_FOR_VERIFICATION", "VERIFIED", {
        severity: "CRITICAL",
        hasVerifiedAction: true,
      }),
    ).not.toThrow();
  });

  it("rejects skipped lifecycle states", () => {
    expect(() =>
      assertFindingTransition("OPEN", "CLOSED", {
        severity: "LOW",
        hasVerifiedAction: false,
      }),
    ).toThrowError(/cannot transition/i);
  });
});

describe("Phase 3 corrective-action lifecycle", () => {
  const base = {
    actorUserId: "01990000-0000-7000-8000-000000000001",
    assigneeUserId: "01990000-0000-7000-8000-000000000001",
  };

  it("supports blocking and returning to work", () => {
    expect(() => assertCorrectiveActionTransition("IN_PROGRESS", "BLOCKED", base)).not.toThrow();
    expect(() => assertCorrectiveActionTransition("BLOCKED", "IN_PROGRESS", base)).not.toThrow();
    expect(() =>
      assertCorrectiveActionTransition("VERIFICATION_REQUIRED", "IN_PROGRESS", base),
    ).not.toThrow();
  });

  it("requires notes and evidence for completion", () => {
    expect(() => assertCorrectiveActionTransition("IN_PROGRESS", "COMPLETED", base)).toThrowError(
      /notes/i,
    );
    expect(() =>
      assertCorrectiveActionTransition("IN_PROGRESS", "COMPLETED", {
        ...base,
        completionNotes: "Replaced the failed isolator",
        completionEvidenceCount: 0,
      }),
    ).toThrowError(/evidence/i);
  });

  it("enforces verifier separation of duties", () => {
    expect(() =>
      assertCorrectiveActionTransition("VERIFICATION_REQUIRED", "VERIFIED", {
        ...base,
        completedByUserId: base.assigneeUserId,
      }),
    ).toThrowError(/cannot verify/i);
  });

  it("calculates overdue state without rewriting history", () => {
    const dueAt = new Date("2026-09-30T10:00:00.000Z");
    const now = new Date("2026-09-30T10:00:00.001Z");
    expect(isCorrectiveActionOverdue(dueAt, "OPEN", now)).toBe(true);
    expect(isCorrectiveActionOverdue(dueAt, "VERIFIED", now)).toBe(false);
  });
});
