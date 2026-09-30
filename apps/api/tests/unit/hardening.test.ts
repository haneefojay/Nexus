import { describe, expect, it } from "vitest";
import { FixedWindowLimiter, policyFor } from "../../src/security/hardening.js";
describe("hardening", () => {
  it("covers expensive routes", () => {
    for (const p of [
      "/v1/auth/sign-in/email",
      "/v1/invitations",
      "/v1/uploads/authorize",
      "/v1/imports/preview",
      "/v1/inspection-runs/x/reports",
      "/v1/exports",
      "/v1/sync/field/commands",
    ])
      expect(policyFor("POST", p)).toBeDefined();
  });
  it("limits", () => {
    const l = new FixedWindowLimiter();
    expect(l.consume("k", 1, 60000, 1000).allowed).toBe(true);
    expect(l.consume("k", 1, 60000, 1001).allowed).toBe(false);
  });
});
