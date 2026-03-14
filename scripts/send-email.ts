/**
 * REUSABLE OUTBOUND EMAIL SENDER
 *
 * Usage:
 *   npx tsx scripts/send-email.ts --to "someone@gmail.com" --subject "Your subject" --body "Your message"
 *   npx tsx scripts/send-email.ts --to "someone@gmail.com" --subject "Subject" --html "<h1>Rich HTML</h1>"
 *   npx tsx scripts/send-email.ts --to "someone@gmail.com" --subject "Subject" --file "./emails/pitch.html"
 *
 * Options:
 *   --to         Recipient email (required)
 *   --subject    Email subject line (required)
 *   --body       Plain text body (auto-styled with Stone AI branding)
 *   --html       Raw HTML body (sent as-is)
 *   --file       Path to HTML file to send as body
 *   --from-name  Sender display name (default: "Stone AI")
 *   --reply-to   Reply-to address (optional)
 *   --notify     Also send status alert to founder (default: true, use --no-notify to skip)
 */

import "dotenv/config";
import nodemailer from "nodemailer";
import { readFileSync } from "fs";

// --- Parse args ---
const args = process.argv.slice(2);
function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}
function hasFlag(name: string): boolean {
  return args.includes(`--${name}`);
}

const to = getArg("to");
const subject = getArg("subject");
const body = getArg("body");
const html = getArg("html");
const file = getArg("file");
const fromName = getArg("from-name") || "Stone AI";
const replyTo = getArg("reply-to");
const noNotify = hasFlag("no-notify");

if (!to || !subject) {
  console.error("Usage: npx tsx scripts/send-email.ts --to EMAIL --subject SUBJECT --body TEXT");
  console.error("  or:  npx tsx scripts/send-email.ts --to EMAIL --subject SUBJECT --html HTML");
  console.error("  or:  npx tsx scripts/send-email.ts --to EMAIL --subject SUBJECT --file PATH");
  process.exit(1);
}

if (!body && !html && !file) {
  console.error("Error: Provide --body, --html, or --file");
  process.exit(1);
}

const user = process.env.ALERT_EMAIL_USER;
const pass = process.env.ALERT_EMAIL_PASS;

if (!user || !pass) {
  console.error("Error: ALERT_EMAIL_USER and ALERT_EMAIL_PASS must be set in .env");
  process.exit(1);
}

// --- Build HTML content ---
let htmlContent: string;

if (file) {
  htmlContent = readFileSync(file, "utf-8");
} else if (html) {
  htmlContent = html;
} else {
  // Auto-style plain text with Stone AI branding
  const lines = body!.split("\\n").map(line =>
    line.trim() === "" ? "<br/>" : `<p style="margin: 8px 0; line-height: 1.6;">${line}</p>`
  ).join("\n");

  htmlContent = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
  <div style="padding: 24px;">${lines}</div>
  <div style="padding: 16px; border-top: 1px solid #e2e8f0; text-align: center;">
    <p style="color: #64748b; font-size: 12px; margin: 0;">
      Stone AI — <a href="https://stone-ai.net" style="color: #3b82f6;">stone-ai.net</a>
    </p>
  </div>
</div>`;
}

// --- Send ---
async function main() {
  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  const result = await transport.sendMail({
    from: `"${fromName}" <${user}>`,
    to,
    subject,
    html: htmlContent,
    ...(replyTo ? { replyTo } : {}),
  });

  console.log(`SENT to ${to}`);
  console.log(`Message ID: ${result.messageId}`);
  console.log(`SMTP: ${result.response}`);

  // Notify founder unless --no-notify
  if (!noNotify) {
    try {
      const { sendFounderAlert } = await import("../src/lib/alert-system/send");
      const { AlertAgent, AlertPriority, AlertType } = await import("../src/lib/alert-system/types");
      await sendFounderAlert({
        agent: AlertAgent.STONE,
        priority: AlertPriority.P3,
        alertType: AlertType.SEED_DELIVERABLE,
        title: `[EMAIL] Sent to ${to}`,
        body: `Outbound email sent.\nTo: ${to}\nSubject: ${subject}\nMessage ID: ${result.messageId}`,
      }, 0);
      console.log("Founder notified.");
    } catch {
      // Silent fail on notification — email already sent
    }
  }
}

main().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
