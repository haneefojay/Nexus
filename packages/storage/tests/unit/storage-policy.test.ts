import { describe, expect, it } from "vitest";

import { evidenceContentTypes, maximumEvidenceBytes } from "../../src/index.js";

describe("evidence storage policy", () => {
  it("keeps the MIME allowlist and size boundary explicit", () => {
    expect(evidenceContentTypes).toEqual([
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ]);
    expect(maximumEvidenceBytes).toBe(20 * 1024 * 1024);
  });
});
