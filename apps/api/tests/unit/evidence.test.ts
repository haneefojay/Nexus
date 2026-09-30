import { describe, expect, it } from "vitest";

import { contentMatchesMime } from "../../src/evidence/evidence.service.js";

describe("evidence content validation", () => {
  it("accepts matching supported signatures", () => {
    expect(contentMatchesMime(Uint8Array.from([0xff, 0xd8, 0xff, 0xdb]), "image/jpeg")).toBe(true);
    expect(
      contentMatchesMime(
        Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        "image/png",
      ),
    ).toBe(true);
    expect(
      contentMatchesMime(Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x2d]), "application/pdf"),
    ).toBe(true);
  });

  it("rejects MIME and content disagreement", () => {
    expect(contentMatchesMime(Uint8Array.from([0x25, 0x50, 0x44, 0x46]), "image/jpeg")).toBe(false);
    expect(contentMatchesMime(new Uint8Array(), "image/webp")).toBe(false);
  });
});
