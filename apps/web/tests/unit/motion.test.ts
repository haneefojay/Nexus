import { describe, expect, it } from "vitest";

import { ease } from "../../lib/motion";

describe("marketing motion foundation", () => {
  it("keeps the approved expressive easing curve", () => {
    expect(ease).toEqual([0.22, 1, 0.36, 1]);
  });
});
