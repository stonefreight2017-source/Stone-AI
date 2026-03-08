/**
 * Daily Digest Generator for Three-Headed Monster Unified Inbox.
 *
 * Aggregates emails from the past 24 hours, groups by source/priority/status,
 * generates an HTML digest email, and sends to the founder at 7:00 AM ET.
 */

import { sendFounderAlert } from "./send";
import { AlertAgent, AlertPriority, AlertType } from "./types";
import type { TriageDecision } from "./inbox-manager";

// In-memory store for triage decisions (accumulated between digest runs)
let pendingDecisions: TriageDecision[] = [];

/**
 * Add triage decisions to the pending digest queue.
 * Called by processIncomingEmails after each inbox check.
 */
export function addToDigest(decisions: TriageDecision[]): void {
  // Only add non-immediate decisions (P0/P1 already fired individually)
  const digestable = decisions.filter((d) => !d.immediateAlert);
  pendingDecisions.push(...digestable);
}

/**
 * Get current pending count (for monitoring).
 */
export function getPendingCount(): number {
  return pendingDecisions.length;
}

/**
 * Clear pending decisions (after digest is sent).
 */
export function clearPending(): TriageDecision[] {
  const cleared = [...pendingDecisions];
  pendingDecisions = [];
  return cleared;
}

interface DigestGroup {
  label: string;
  color: string;
  items: TriageDecision[];
}

function groupDecisions(decisions: TriageDecision[]): DigestGroup[] {
  const groups: Record<string, DigestGroup> = {};

  // Group by source category
  for (const d of decisions) {
    let label: string;
    let color: string;

    if (d.zohoTag) {
      label = `Zoho / ${d.zohoTag}`;
      color = "#6366f1"; // indigo
    } else if (d.socialLabel) {
      label = d.socialLabel;
      color = "#06b6d4"; // cyan
    } else {
      label = "Direct / Other";
      color = "#6b7280"; // gray
    }

    if (!groups[label]) {
      groups[label] = { label, color, items: [] };
    }
    groups[label].items.push(d);
  }

  // Sort groups: Zoho first, then Social, then Other
  return Object.values(groups).sort((a, b) => {
    const order = (g: DigestGroup) =>
      g.label.startsWith("Zoho") ? 0 : g.label.startsWith("Social") ? 1 : 2;
    return order(a) - order(b);
  });
}

function priorityBadge(p: AlertPriority): string {
  const colors: Record<string, string> = {
    P0: "#dc2626",
    P1: "#ea580c",
    P2: "#2563eb",
    P3: "#6b7280",
  };
  return `<span style="display:inline-block;padding:2px 8px;border-radius:4px;background:${colors[p] || "#6b7280"};color:#fff;font-size:11px;font-weight:700;">${p}</span>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Generate the HTML for the daily digest email.
 */
export function generateDigestHtml(decisions: TriageDecision[]): string {
  const groups = groupDecisions(decisions);
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/New_York",
  });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/New_York",
  });

  // Count by priority
  const pCounts = { P0: 0, P1: 0, P2: 0, P3: 0 };
  decisions.forEach((d) => { pCounts[d.priority]++; });

  let groupsHtml = "";
  for (const group of groups) {
    const rows = group.items
      .map(
        (d) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;">${priorityBadge(d.priority)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111827;">${escapeHtml(d.subject)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#6b7280;">${escapeHtml(d.from)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#6b7280;">${d.routedTo ? d.routedTo.toUpperCase() : "&mdash;"}</td>
        </tr>`
      )
      .join("");

    groupsHtml += `
      <div style="margin-bottom:24px;">
        <div style="display:flex;align-items:center;margin-bottom:8px;">
          <div style="width:4px;height:20px;background:${group.color};border-radius:2px;margin-right:10px;"></div>
          <h2 style="margin:0;font-size:16px;color:#111827;">${escapeHtml(group.label)} <span style="font-weight:400;color:#9ca3af;font-size:13px;">(${group.items.length})</span></h2>
        </div>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f9fafb;">
              <th style="padding:6px 12px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;width:60px;">Pri</th>
              <th style="padding:6px 12px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;">Subject</th>
              <th style="padding:6px 12px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;">From</th>
              <th style="padding:6px 12px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;width:80px;">Route</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:700px;margin:24px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1e1b4b,#312e81);padding:24px 32px;">
      <h1 style="margin:0;color:#ffffff;font-size:22px;">3HM Daily Digest</h1>
      <div style="color:#c7d2fe;font-size:13px;margin-top:4px;">${dateStr} &mdash; ${timeStr} ET</div>
    </div>

    <!-- Summary bar -->
    <div style="display:flex;padding:16px 32px;background:#f9fafb;border-bottom:1px solid #e5e7eb;">
      <div style="flex:1;text-align:center;">
        <div style="font-size:24px;font-weight:700;color:#111827;">${decisions.length}</div>
        <div style="font-size:11px;color:#6b7280;text-transform:uppercase;">Total</div>
      </div>
      <div style="flex:1;text-align:center;">
        <div style="font-size:24px;font-weight:700;color:#dc2626;">${pCounts.P0}</div>
        <div style="font-size:11px;color:#6b7280;text-transform:uppercase;">P0</div>
      </div>
      <div style="flex:1;text-align:center;">
        <div style="font-size:24px;font-weight:700;color:#ea580c;">${pCounts.P1}</div>
        <div style="font-size:11px;color:#6b7280;text-transform:uppercase;">P1</div>
      </div>
      <div style="flex:1;text-align:center;">
        <div style="font-size:24px;font-weight:700;color:#2563eb;">${pCounts.P2}</div>
        <div style="font-size:11px;color:#6b7280;text-transform:uppercase;">P2</div>
      </div>
      <div style="flex:1;text-align:center;">
        <div style="font-size:24px;font-weight:700;color:#6b7280;">${pCounts.P3}</div>
        <div style="font-size:11px;color:#6b7280;text-transform:uppercase;">P3</div>
      </div>
    </div>

    <!-- Content -->
    <div style="padding:24px 32px;">
      ${decisions.length === 0
        ? '<p style="color:#6b7280;font-size:14px;">No new emails in the past 24 hours. All clear.</p>'
        : groupsHtml}
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;">
      <div>Stone AI &mdash; Three-Headed Monster Unified Inbox</div>
      <div>P0 and P1 alerts bypass this digest and fire immediately.</div>
      <div style="margin-top:4px;">Next digest: tomorrow at 7:00 AM ET</div>
    </div>

  </div>
</body>
</html>`;
}

/**
 * Generate and send the daily digest email to the founder.
 */
export async function generateDailyDigest(): Promise<{
  success: boolean;
  emailCount: number;
  error?: string;
}> {
  const decisions = clearPending();

  const html = generateDigestHtml(decisions);

  try {
    const result = await sendFounderAlert(
      {
        agent: AlertAgent.SYSTEM,
        priority: AlertPriority.P3,
        alertType: AlertType.DAILY_DIGEST,
        title: `Daily Digest — ${decisions.length} email(s)`,
        body: `Daily digest containing ${decisions.length} email(s) from the past 24 hours.`,
        metadata: {
          emailCount: decisions.length,
          digestTime: new Date().toISOString(),
        },
      },
      0 // No cooldown for digest
    );

    if (!result.success) {
      // Put decisions back if send failed
      pendingDecisions.push(...decisions);
      return { success: false, emailCount: decisions.length, error: result.error };
    }

    return { success: true, emailCount: decisions.length };
  } catch (err) {
    // Put decisions back if send failed
    pendingDecisions.push(...decisions);
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, emailCount: decisions.length, error: errMsg };
  }
}
