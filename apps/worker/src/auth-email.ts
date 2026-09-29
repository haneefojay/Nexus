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
  const verification = job.kind === "EMAIL_VERIFICATION";
  const action = verification ? "Verify email" : "Reset password";
  const subject = verification ? "Verify your NEXUS email" : "Reset your NEXUS password";
  const intro = verification
    ? "Confirm this email address to activate your NEXUS account."
    : "Use the secure link below to choose a new NEXUS password.";
  const safeName = escapeHtml(job.recipientName);
  const safeUrl = escapeHtml(job.actionUrl);

  return {
    subject,
    text: `Hello ${job.recipientName},\n\n${intro}\n\n${action}: ${job.actionUrl}\n\nIf you did not request this, you can ignore this email.`,
    html: `<p>Hello ${safeName},</p><p>${intro}</p><p><a href="${safeUrl}">${action}</a></p><p>If you did not request this, you can ignore this email.</p>`,
  };
}
