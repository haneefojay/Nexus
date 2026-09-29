import { describe, expect, it } from "vitest";

describe("worker shell", () => {
  it("reserves the system queue name", () => {
    expect("nexus-system").toMatch(/^nexus-/);
  });
});
