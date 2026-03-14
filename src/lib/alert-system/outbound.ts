/**
 * General-purpose outbound email sender for Stone AI.
 * Allows the founder to send emails to ANY external recipient.
 *
 * Uses the same Gmail SMTP transport as the alert system.
 * Does NOT modify or depend on sendFounderAlert().
 *
 * Required env vars:
 *   ALERT_EMAIL_USER  — Gmail address (e.g. 3headedm@gmail.com)
 *   ALERT_EMAIL_PASS  — Gmail App Password (16-char)
 */

import nodemailer from "nodemailer";

export interface OutboundEmailPayload {
  to: string;            // recipient email
  subject: string;       // email subject line
  body: string;          // plain text body (converted to HTML)
  html?: string;         // optional: full HTML body (overrides body)
  replyTo?: string;      // optional: reply-to address
  fromName?: string;     // optional: display name (default "Stone AI")
}

export interface OutboundEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendOutboundEmail(
  payload: OutboundEmailPayload
): Promise<OutboundEmailResult> {
  const { to, subject, body, html, replyTo, fromName = "Stone AI" } = payload;

  // Validate required fields
  if (!to || !subject || (!body && !html)) {
    return { success: false, error: "Missing required fields: to, subject, and body or html" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    return { success: false, error: `Invalid email address: ${to}` };
  }

  const user = process.env.ALERT_EMAIL_USER;
  const pass = process.env.ALERT_EMAIL_PASS;

  if (!user || !pass) {
    return { success: false, error: "Missing ALERT_EMAIL_USER or ALERT_EMAIL_PASS env vars" };
  }

  try {
    const transport = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // SSL
      auth: { user, pass },
    });

    // Convert plain text body to simple HTML if no custom HTML provided
    const htmlContent = html || `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
        <div style="padding: 24px;">
          ${body.split("\n").map(line =>
            line.trim() === "" ? "<br/>" : `<p style="margin: 8px 0; line-height: 1.6;">${line}</p>`
          ).join("\n")}
        </div>
        <div style="padding: 16px; border-top: 1px solid #e2e8f0; text-align: center;">
          <p style="color: #64748b; font-size: 12px; margin: 0;">
            Stone AI &mdash; <a href="https://stone-ai.net" style="color: #3b82f6;">stone-ai.net</a>
          </p>
        </div>
      </div>
    `;

    const result = await transport.sendMail({
      from: `"${fromName}" <${user}>`,
      to,
      subject,
      html: htmlContent,
      ...(replyTo ? { replyTo } : {}),
    });

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    return {
      success: false,
      error: message,
    };
  }
}
