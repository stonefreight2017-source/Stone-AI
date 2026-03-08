/**
 * HTML email templates for Three-Headed Monster alerts.
 * Priority-based color coding, mobile-friendly layout.
 */

import { AlertPriority, AlertAgent, type AlertPayload, type AlertMetadata } from "./types";

const PRIORITY_COLORS: Record<AlertPriority, { bg: string; text: string; label: string }> = {
  [AlertPriority.P0]: { bg: "#dc2626", text: "#ffffff", label: "CRITICAL" },
  [AlertPriority.P1]: { bg: "#ea580c", text: "#ffffff", label: "HIGH" },
  [AlertPriority.P2]: { bg: "#2563eb", text: "#ffffff", label: "MEDIUM" },
  [AlertPriority.P3]: { bg: "#6b7280", text: "#ffffff", label: "LOW" },
};

const AGENT_DISPLAY: Record<AlertAgent, { name: string; emoji: string }> = {
  [AlertAgent.CHAOS]: { name: "Chaos", emoji: "infra" },
  [AlertAgent.STONE]: { name: "Stone", emoji: "ops" },
  [AlertAgent.CARDINAL]: { name: "Cardinal", emoji: "intel" },
  [AlertAgent.SYSTEM]: { name: "System", emoji: "sys" },
};

function renderMetadataRows(metadata?: AlertMetadata): string {
  if (!metadata || Object.keys(metadata).length === 0) return "";

  const rows = Object.entries(metadata)
    .map(
      ([key, value]) =>
        `<tr>
          <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;font-weight:600;color:#374151;font-size:13px;">${escapeHtml(key)}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;color:#4b5563;font-size:13px;">${escapeHtml(String(value ?? "null"))}</td>
        </tr>`
    )
    .join("");

  return `
    <table style="width:100%;border-collapse:collapse;margin-top:16px;border:1px solid #e5e7eb;border-radius:6px;">
      <thead>
        <tr style="background:#f9fafb;">
          <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Key</th>
          <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Value</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildAlertHtml(payload: AlertPayload, alertId: string): string {
  const priority = PRIORITY_COLORS[payload.priority];
  const agent = AGENT_DISPLAY[payload.agent];
  const timestamp = new Date().toISOString();

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:24px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

    <!-- Priority banner -->
    <div style="background:${priority.bg};padding:12px 24px;display:flex;align-items:center;">
      <span style="color:${priority.text};font-weight:700;font-size:14px;letter-spacing:0.05em;">
        ${priority.label} &mdash; ${payload.priority}
      </span>
    </div>

    <!-- Header -->
    <div style="padding:24px 24px 0;">
      <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">
        ${agent.name} [${agent.emoji}] &mdash; 3HM Alert
      </div>
      <h1 style="margin:0;font-size:20px;color:#111827;line-height:1.3;">
        ${escapeHtml(payload.title)}
      </h1>
      <div style="margin-top:4px;font-size:12px;color:#9ca3af;">
        ${payload.alertType}
      </div>
    </div>

    <!-- Body -->
    <div style="padding:16px 24px;font-size:14px;color:#374151;line-height:1.6;">
      ${escapeHtml(payload.body).replace(/\n/g, "<br>")}
    </div>

    <!-- Metadata table -->
    <div style="padding:0 24px;">
      ${renderMetadataRows(payload.metadata)}
    </div>

    <!-- Footer -->
    <div style="padding:16px 24px;margin-top:16px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;">
      <div>Event ID: ${escapeHtml(alertId)}</div>
      <div>Timestamp: ${timestamp}</div>
      <div style="margin-top:4px;">Stone AI &mdash; Three-Headed Monster Alert System</div>
    </div>

  </div>
</body>
</html>`;
}

export function buildAlertSubject(payload: AlertPayload): string {
  return `[${payload.priority}] ${payload.agent.toUpperCase()} — ${payload.alertType}: ${payload.title}`;
}

export function getFromDisplayName(agent: AlertAgent): string {
  const display = AGENT_DISPLAY[agent];
  return `${display.name} — 3HM`;
}
