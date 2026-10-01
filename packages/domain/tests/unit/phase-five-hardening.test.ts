import { describe, expect, it } from "vitest";
import { isArtifactCleanupEligible } from "../../src/index.js";
describe("artifact cleanup", () =>
  it("protects active and unexpired artifacts", () => {
    const n = new Date(100);
    expect(isArtifactCleanupEligible("COMPLETED", new Date(99), n)).toBe(true);
    expect(isArtifactCleanupEligible("PROCESSING", new Date(0), n)).toBe(false);
    expect(isArtifactCleanupEligible("COMPLETED", null, n)).toBe(false);
  }));
