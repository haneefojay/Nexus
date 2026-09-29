import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "../../src/index.js";

describe("NEXUS password hashing", () => {
  it("uses Argon2id and verifies only the correct password", async () => {
    const encoded = await hashPassword("a-long-and-valid-password");

    expect(encoded).toMatch(/^\$argon2id\$/);
    await expect(verifyPassword(encoded, "a-long-and-valid-password")).resolves.toBe(true);
    await expect(verifyPassword(encoded, "incorrect-password")).resolves.toBe(false);
  });
});
