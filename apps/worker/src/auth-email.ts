import type { AuthEmailJob } from "@nexus/contracts";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderAuthEmail(job: AuthEmailJob): {
  subject: string;
  text: string;
  html: string;
} {
  const content = {
    EMAIL_VERIFICATION: {
      action: "Verify email",
      subject: "Verify your NEXUS email",
      intro: "Confirm this email address to activate your NEXUS account.",
    },
    PASSWORD_RESET: {
      action: "Reset password",
      subject: "Reset your NEXUS password",
      intro: "Use the secure link below to choose a new NEXUS password.",
    },
    ORGANIZATION_INVITATION: {
      action: "Join organization",
      subject: "You have been invited to NEXUS",
      intro: "An infrastructure team invited you to join its NEXUS operational workspace.",
    },
  }[job.kind];
  const safeName = escapeHtml(job.recipientName);
  const safeUrl = escapeHtml(job.actionUrl);

  return {
    subject: content.subject,
    text: `Hello ${job.recipientName},\n\n${content.intro}\n\n${content.action}: ${job.actionUrl}\n\nIf you did not expect this, you can ignore this email.`,
    html: `<p>Hello ${safeName},</p><p>${content.intro}</p><p><a href="${safeUrl}">${content.action}</a></p><p>If you did not expect this, you can ignore this email.</p>`,
  };
}
