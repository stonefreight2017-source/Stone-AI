/**
 * Core email sender for Three-Headed Monster alerts.
 * Uses Nodemailer with Gmail SMTP (requires App Password).
 *
 * Required env vars:
 *   ALERT_EMAIL_USER     — Gmail address (e.g. 3headedm@gmail.com)
 *   ALERT_EMAIL_PASS     — Gmail App Password (16-char, NOT the regular password)
 *   ALERT_RECIPIENT_EMAIL — Founder's inbox to receive alerts
 */

import nodemailer from "nodemailer";
import type { AlertPayload, AlertResult } from "./types";
import { buildAlertHtml, buildAlertSubject, getFromDisplayName } from "./templates";
import { checkCooldown, setCooldown } from "./cooldown";

function generateAlertId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `alert_${ts}_${rand}`;
}

function getTransporter() {
  const user = process.env.ALERT_EMAIL_USER;
  const pass = process.env.ALERT_EMAIL_PASS;

  if (!user || !pass) {
    throw new Error("Missing ALERT_EMAIL_USER or ALERT_EMAIL_PASS env vars");
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // SSL
    auth: { user, pass },
  });
}

/**
 * Send an alert email to the founder.
 * Respects cooldown — duplicate agent+alertType combos are suppressed.
 *
 * @param payload - The alert details
 * @param cooldownMs - Cooldown period in ms (default: 5 min). Set to 0 to skip cooldown.
 */
export async function sendFounderAlert(
  payload: AlertPayload,
  cooldownMs: number = 5 * 60_000
): Promise<AlertResult> {
  const alertId = generateAlertId();

  // Cooldown check (skip for P0 — critical alerts always go through)
  if (cooldownMs > 0 && payload.priority !== "P0") {
    if (checkCooldown(payload.agent, payload.alertType)) {
      return {
        success: true,
        alertId,
        error: "Suppressed by cooldown",
      };
    }
  }

  const recipient = process.env.ALERT_RECIPIENT_EMAIL;
  if (!recipient) {
    return {
      success: false,
      alertId,
      error: "Missing ALERT_RECIPIENT_EMAIL env var",
    };
  }

  try {
    const transporter = getTransporter();
    const fromName = getFromDisplayName(payload.agent);

    await transporter.sendMail({
      from: `"${fromName}" <${process.env.ALERT_EMAIL_USER}>`,
      to: recipient,
      subject: buildAlertSubject(payload),
      html: buildAlertHtml(payload, alertId),
    });

    // Set cooldown after successful send
    if (cooldownMs > 0) {
      setCooldown(payload.agent, payload.alertType, cooldownMs);
    }

    return { success: true, alertId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    console.error(`[alert-system] Failed to send alert ${alertId}:`, message);
    return { success: false, alertId, error: message };
  }
}
