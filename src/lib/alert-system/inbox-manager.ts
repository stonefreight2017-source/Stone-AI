/**
 * Unified Inbox Manager for Three-Headed Monster.
 *
 * Processes incoming email from Zoho forwarding + social media + direct.
 * Routes to Stone or Cardinal queues, detects priority keywords,
 * fires immediate alerts for P0/P1.
 */

import { sendFounderAlert } from "./send";
import { AlertAgent, AlertPriority, AlertType } from "./types";
import type { InboxMessage } from "./inbox";

// --- Subject tag patterns from Zoho forwarding ---
const ZOHO_TAG_PATTERN = /\[(ADMIN|SUPPORT|SECURITY|LEGAL|ENTERPRISE)\]/i;

// --- Priority keywords (P0 = immediate alert) ---
const P0_KEYWORDS = /\b(urgent|emergency|breach|lawsuit|subpoena|cease and desist|critical outage|data leak)\b/i;
const P1_KEYWORDS = /\b(high priority|action required|escalat|sla breach|revenue drop|churn spike|security incident)\b/i;

// --- Content approval subject patterns (route to Cardinal) ---
const CONTENT_APPROVAL_PATTERN = /content approval|ad content batch|awaiting approval/i;

// --- Social media sender patterns ---
const SOCIAL_SENDERS: Record<string, string> = {
  "notify@twitter.com": "Social/Twitter",
  "info@twitter.com": "Social/Twitter",
  "notify@x.com": "Social/Twitter",
  "info@x.com": "Social/Twitter",
  "notifications@linkedin.com": "Social/LinkedIn",
  "no-reply@mail.instagram.com": "Social/Instagram",
  "noreply@youtube.com": "Social/YouTube",
  "noreply@discord.com": "Social/Discord",
  "noreply@reddit.com": "Social/Reddit",
  "noreply@redditmail.com": "Social/Reddit",
  "notification@facebookmail.com": "Social/Facebook",
  "noreply@facebookmail.com": "Social/Facebook",
  "no-reply@tiktok.com": "Social/TikTok",
};

// --- Zoho tag to agent routing ---
const ZOHO_ROUTE: Record<string, AlertAgent> = {
  ADMIN: AlertAgent.STONE,
  SUPPORT: AlertAgent.STONE,
  SECURITY: AlertAgent.CARDINAL,
  LEGAL: AlertAgent.CARDINAL,
  ENTERPRISE: AlertAgent.STONE,
};

// --- Zoho tag to label ---
const ZOHO_LABEL: Record<string, string> = {
  ADMIN: "Zoho/Admin",
  SUPPORT: "Zoho/Support",
  SECURITY: "Zoho/Security",
  LEGAL: "Zoho/Legal",
  ENTERPRISE: "Zoho/Enterprise",
};

export interface TriageDecision {
  messageId: string;
  from: string;
  subject: string;
  timestamp: Date;
  zohoTag: string | null;
  zohoLabel: string | null;
  socialLabel: string | null;
  routedTo: AlertAgent | null;
  priority: AlertPriority;
  immediateAlert: boolean;
  reason: string;
}

/**
 * Extract sender email address from a "From" string.
 * Handles formats like: "Name <email@example.com>" or just "email@example.com"
 */
function extractEmail(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return (match ? match[1] : from).toLowerCase().trim();
}

/**
 * Process a single incoming email and produce a triage decision.
 */
export function triageEmail(msg: InboxMessage): TriageDecision {
  const subject = msg.subject || "(no subject)";
  const fromEmail = extractEmail(msg.from);

  let zohoTag: string | null = null;
  let zohoLabel: string | null = null;
  let socialLabel: string | null = null;
  let routedTo: AlertAgent | null = null;
  let priority: AlertPriority = AlertPriority.P3;
  let immediateAlert = false;
  let reason = "Routine";

  // 0. Check for content approval reply (route to Cardinal — P1)
  if (CONTENT_APPROVAL_PATTERN.test(subject)) {
    routedTo = AlertAgent.CARDINAL;
    priority = AlertPriority.P1;
    immediateAlert = true;
    reason = "Content approval response — routed to Cardinal";
    return {
      messageId: msg.messageId,
      from: msg.from,
      subject,
      timestamp: msg.timestamp,
      zohoTag,
      zohoLabel,
      socialLabel,
      routedTo,
      priority,
      immediateAlert,
      reason,
    };
  }

  // 1. Check for Zoho subject tags
  const tagMatch = subject.match(ZOHO_TAG_PATTERN);
  if (tagMatch) {
    const tag = tagMatch[1].toUpperCase();
    zohoTag = tag;
    zohoLabel = ZOHO_LABEL[tag] || null;
    routedTo = ZOHO_ROUTE[tag] || AlertAgent.STONE;
    priority = AlertPriority.P2;
    reason = `Zoho [${tag}] -> ${routedTo}`;
  }

  // 2. Check for social media sender
  if (!zohoTag) {
    socialLabel = SOCIAL_SENDERS[fromEmail] || null;
    if (socialLabel) {
      priority = AlertPriority.P3;
      reason = `Social notification: ${socialLabel}`;
    }
  }

  // 3. Check for P0 keywords (OVERRIDES everything — immediate alert)
  if (P0_KEYWORDS.test(subject)) {
    priority = AlertPriority.P0;
    immediateAlert = true;
    reason = `P0 keyword detected in subject`;
    if (!routedTo) routedTo = AlertAgent.STONE;
  }
  // 4. Check for P1 keywords (also immediate alert)
  else if (P1_KEYWORDS.test(subject)) {
    priority = AlertPriority.P1;
    immediateAlert = true;
    reason = `P1 keyword detected in subject`;
    if (!routedTo) routedTo = AlertAgent.STONE;
  }

  return {
    messageId: msg.messageId,
    from: msg.from,
    subject,
    timestamp: msg.timestamp,
    zohoTag,
    zohoLabel,
    socialLabel,
    routedTo,
    priority,
    immediateAlert,
    reason,
  };
}

/**
 * Process a batch of incoming emails: triage each, fire immediate alerts for P0/P1.
 */
export async function processIncomingEmails(
  messages: InboxMessage[]
): Promise<{
  decisions: TriageDecision[];
  immediateAlertsSent: number;
  errors: string[];
}> {
  const decisions: TriageDecision[] = [];
  const errors: string[] = [];
  let immediateAlertsSent = 0;

  for (const msg of messages) {
    const decision = triageEmail(msg);
    decisions.push(decision);

    // Fire immediate alert for P0/P1 (bypass digest timer)
    if (decision.immediateAlert && decision.routedTo) {
      try {
        await sendFounderAlert(
          {
            agent: decision.routedTo,
            priority: decision.priority,
            alertType:
              decision.zohoTag === "ENTERPRISE"
                ? AlertType.NEW_ENTERPRISE_LEAD
                : decision.zohoTag === "SECURITY"
                  ? AlertType.SECURITY_ALERT
                  : decision.zohoTag === "LEGAL"
                    ? AlertType.LEGAL_COMPLIANCE
                    : AlertType.ESCALATION,
            title: `[IMMEDIATE] ${decision.subject}`,
            body:
              `Priority: ${decision.priority}\n` +
              `From: ${decision.from}\n` +
              `Reason: ${decision.reason}\n` +
              `Time: ${decision.timestamp.toISOString()}\n\n` +
              `This email bypassed the daily digest due to priority classification.`,
            metadata: {
              messageId: decision.messageId,
              zohoTag: decision.zohoTag || "none",
              socialLabel: decision.socialLabel || "none",
              triageReason: decision.reason,
            },
          },
          0 // No cooldown for immediate alerts
        );
        immediateAlertsSent++;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        errors.push(`Failed to send immediate alert for ${decision.messageId}: ${errMsg}`);
      }
    }
  }

  return { decisions, immediateAlertsSent, errors };
}
