import { describe, expect, it } from "vitest";

import { renderAuthEmail } from "../../src/auth-email.js";

describe("auth email rendering", () => {
  it("escapes untrusted names and URLs in HTML", () => {
    const rendered = renderAuthEmail({
      kind: "EMAIL_VERIFICATION",
      recipient: "operator@example.com",
      recipientName: "<Operator>",
      actionUrl: 'https://example.com/verify?next="dashboard"',
    });

    expect(rendered.subject).toBe("Verify your NEXUS email");
    expect(rendered.html).toContain("&lt;Operator&gt;");
    expect(rendered.html).toContain("&quot;dashboard&quot;");
    expect(rendered.html).not.toContain("<Operator>");
  });
});
