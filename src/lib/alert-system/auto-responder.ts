/**
 * Auto-Responder for Three-Headed Monster Unified Inbox.
 *
 * Sends templated replies to support, enterprise, and security emails.
 * NEVER auto-responds to legal. Enforces 1 response per sender per 24 hours.
 *
 * Uses the same SMTP transport as the alert system (nodemailer + Gmail App Password).
 */

import nodemailer from "nodemailer";
import { sendFounderAlert } from "./send";
import { AlertAgent, AlertPriority, AlertType } from "./types";
import type { TriageDecision } from "./inbox-manager";

// --- Cooldown: 1 auto-response per sender per 24 hours ---
const AUTO_RESPONSE_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
const senderCooldowns = new Map<string, number>();

// Cleanup stale cooldowns every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, expiresAt] of senderCooldowns) {
    if (now >= expiresAt) senderCooldowns.delete(key);
  }
}, 60 * 60_000);

/**
 * Extract sender email from a "From" string.
 */
function extractSenderEmail(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return (match ? match[1] : from).toLowerCase().trim();
}

/**
 * Check if we've already auto-responded to this sender within 24h.
 */
function isOnCooldown(senderEmail: string): boolean {
  const expiresAt = senderCooldowns.get(senderEmail);
  if (!expiresAt) return false;
  if (Date.now() >= expiresAt) {
    senderCooldowns.delete(senderEmail);
    return false;
  }
  return true;
}

/**
 * Set cooldown for a sender after auto-response.
 */
function setCooldownForSender(senderEmail: string): void {
  senderCooldowns.set(senderEmail, Date.now() + AUTO_RESPONSE_COOLDOWN_MS);
}

// --- Auto-response templates ---

interface AutoResponseTemplate {
  subject: string;
  html: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapTemplate(heading: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:24px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#1e1b4b,#312e81);padding:20px 28px;">
      <h1 style="margin:0;color:#ffffff;font-size:20px;">${escapeHtml(heading)}</h1>
    </div>
    <div style="padding:24px 28px;font-size:14px;color:#374151;line-height:1.7;">
      ${body}
    </div>
    <div style="padding:14px 28px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;">
      <div>Stone AI &mdash; Automated Response</div>
      <div>This is an automated message. A team member will follow up if needed.</div>
    </div>
  </div>
</body>
</html>`;
}

function getSupportTemplate(originalSubject: string): AutoResponseTemplate {
  return {
    subject: `Re: ${originalSubject}`,
    html: wrapTemplate(
      "We received your support request",
      `<p>Thank you for reaching out to Stone AI support.</p>
       <p>Your message has been received and logged. Our team typically responds within <strong>24 hours</strong> during business days.</p>
       <p>If this is urgent, please reply with <strong>"URGENT"</strong> in the subject line to escalate.</p>
       <p>For common questions, visit our help center at <a href="https://stone-ai.net/help" style="color:#4f46e5;">stone-ai.net/help</a>.</p>
       <p style="margin-top:16px;color:#6b7280;font-size:13px;">Reference: ${escapeHtml(originalSubject)}</p>`
    ),
  };
}

function getEnterpriseTemplate(originalSubject: string): AutoResponseTemplate {
  return {
    subject: `Re: ${originalSubject}`,
    html: wrapTemplate(
      "Enterprise Inquiry Received",
      `<p>Thank you for your interest in Stone AI enterprise solutions.</p>
       <p>Your inquiry has been flagged as <strong>high priority</strong> and routed to our business development team.</p>
       <p>You can expect a personal response within <strong>4 business hours</strong>.</p>
       <p>In the meantime, you can learn more about our enterprise offerings at <a href="https://stone-ai.net/enterprise" style="color:#4f46e5;">stone-ai.net/enterprise</a>.</p>
       <p style="margin-top:16px;color:#6b7280;font-size:13px;">Reference: ${escapeHtml(originalSubject)}</p>`
    ),
  };
}

function getSecurityTemplate(originalSubject: string): AutoResponseTemplate {
  return {
    subject: `Re: ${originalSubject}`,
    html: wrapTemplate(
      "Security Report Acknowledged",
      `<p>Thank you for reporting a security concern to Stone AI.</p>
       <p>Your report has been received and <strong>immediately escalated</strong> to our security team (Cardinal).</p>
       <p>We take all security reports seriously. You will receive a substantive response within <strong>24 hours</strong>.</p>
       <p>If this is a critical vulnerability requiring immediate attention, please also email <strong>stonefreight2017@gmail.com</strong> directly.</p>
       <p style="margin-top:16px;color:#6b7280;font-size:13px;">Reference: ${escapeHtml(originalSubject)}</p>`
    ),
  };
}

// --- Eligible categories (LEGAL is explicitly excluded) ---
const AUTO_RESPONSE_TAGS: Record<string, (subject: string) => AutoResponseTemplate> = {
  SUPPORT: getSupportTemplate,
  ENTERPRISE: getEnterpriseTemplate,
  SECURITY: getSecurityTemplate,
};

function getTransporter() {
  const user = process.env.ALERT_EMAIL_USER;
  const pass = process.env.ALERT_EMAIL_PASS;

  if (!user || !pass) {
    throw new Error("Missing ALERT_EMAIL_USER or ALERT_EMAIL_PASS env vars");
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
}

/**
 * Send auto-responses for eligible triage decisions.
 * Only responds to SUPPORT, ENTERPRISE, SECURITY (never LEGAL).
 * Enforces 1 response per sender per 24 hours.
 *
 * @returns Count of auto-responses sent and any errors.
 */
export async function sendAutoResponses(
  decisions: TriageDecision[]
): Promise<{
  sent: number;
  skippedCooldown: number;
  skippedIneligible: number;
  errors: string[];
}> {
  let sent = 0;
  let skippedCooldown = 0;
  let skippedIneligible = 0;
  const errors: string[] = [];

  for (const decision of decisions) {
    // Only auto-respond to Zoho-tagged emails with eligible tags
    if (!decision.zohoTag || !AUTO_RESPONSE_TAGS[decision.zohoTag]) {
      skippedIneligible++;
      continue;
    }

    // NEVER respond to LEGAL
    if (decision.zohoTag === "LEGAL") {
      skippedIneligible++;
      continue;
    }

    const senderEmail = extractSenderEmail(decision.from);

    // Check 24h cooldown per sender
    if (isOnCooldown(senderEmail)) {
      skippedCooldown++;
      console.log(
        `[auto-responder] Cooldown active for ${senderEmail}, skipping auto-response`
      );
      continue;
    }

    // Generate template
    const templateFn = AUTO_RESPONSE_TAGS[decision.zohoTag];
    const template = templateFn(decision.subject);

    try {
      const transporter = getTransporter();
      const fromUser = process.env.ALERT_EMAIL_USER;

      await transporter.sendMail({
        from: `"Stone AI Support" <${fromUser}>`,
        to: senderEmail,
        subject: template.subject,
        html: template.html,
        inReplyTo: decision.messageId,
        references: decision.messageId,
      });

      setCooldownForSender(senderEmail);
      sent++;

      console.log(
        `[auto-responder] Sent ${decision.zohoTag} auto-response to ${senderEmail}`
      );

      // Notify founder that an auto-response was sent
      await sendFounderAlert(
        {
          agent: AlertAgent.SYSTEM,
          priority: AlertPriority.P3,
          alertType: AlertType.AUTO_RESPONSE_SENT,
          title: `Auto-response sent: [${decision.zohoTag}]`,
          body:
            `Auto-response sent to: ${senderEmail}\n` +
            `Category: ${decision.zohoTag}\n` +
            `Original subject: ${decision.subject}\n` +
            `Time: ${new Date().toISOString()}`,
          metadata: {
            sender: senderEmail,
            zohoTag: decision.zohoTag,
            originalSubject: decision.subject,
          },
        },
        300_000 // 5 min cooldown on auto-response notifications
      );
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      errors.push(`Failed to auto-respond to ${senderEmail}: ${errMsg}`);
      console.error(`[auto-responder] Error for ${senderEmail}:`, errMsg);
    }
  }

  return { sent, skippedCooldown, skippedIneligible, errors };
}
