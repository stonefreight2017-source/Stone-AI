/**
 * Trial Expiry Reminder System for Stone AI.
 *
 * Sends email reminders to users 1 day before their free trial ends
 * and they get charged. Piggybacks on the inbox-manager 5-minute poller.
 *
 * Deduplication: Uses a JSONL file at ~/palace-logs/cardinal/trial-reminders.jsonl
 * to track which users have already been reminded (same pattern as content-approval).
 *
 * Query window: Looks for users whose freeTrialEndsAt is 24-28 hours from now.
 * The 4-hour window ensures the 5-minute poller reliably catches every user
 * even if there are brief outages or timing drift.
 */

import { existsSync, mkdirSync, readFileSync, appendFileSync } from "fs";
import { join } from "path";
import { db } from "@/lib/db";
import { sendOutboundEmail } from "./outbound";
import { TIER_CONFIG, type Tier } from "@/lib/tier-config";

// --- Storage paths (same directory as content-approval logs) ---
const LOG_DIR = join(process.env.HOME || process.env.USERPROFILE || "~", "palace-logs", "cardinal");
const LOG_FILE = join(LOG_DIR, "trial-reminders.jsonl");

function ensureLogDir() {
  if (!existsSync(LOG_DIR)) {
    mkdirSync(LOG_DIR, { recursive: true });
  }
}

interface TrialReminderLog {
  userId: string;
  email: string;
  tier: string;
  trialEndsAt: string;
  sentAt: string;
  messageId?: string;
  error?: string;
}

function appendLog(entry: TrialReminderLog) {
  ensureLogDir();
  appendFileSync(LOG_FILE, JSON.stringify(entry) + "\n", "utf-8");
}

/**
 * Load the set of user IDs that have already been reminded.
 * Reads the entire JSONL file and extracts successful reminder user IDs.
 */
function getRemindedUserIds(): Set<string> {
  ensureLogDir();
  if (!existsSync(LOG_FILE)) return new Set();

  try {
    const lines = readFileSync(LOG_FILE, "utf-8").trim().split("\n").filter(Boolean);
    const ids = new Set<string>();
    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as TrialReminderLog;
        // Only count successful sends as "reminded"
        if (!entry.error) {
          ids.add(entry.userId);
        }
      } catch {
        // Skip malformed lines
      }
    }
    return ids;
  } catch {
    return new Set();
  }
}

/**
 * Build the trial expiry reminder email HTML.
 */
function buildReminderHtml(params: {
  userName: string | null;
  tierName: string;
  tierPrice: number;
  trialEndsAt: Date;
}): string {
  const { userName, tierName, tierPrice, trialEndsAt } = params;
  const greeting = userName ? `Hi ${userName}` : "Hi there";
  const endsDate = trialEndsAt.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/New_York",
  });
  const endsTime = trialEndsAt.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; background: #ffffff;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 24px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Stone AI</h1>
        <p style="color: #94a3b8; margin: 8px 0 0; font-size: 14px;">Trial Ending Soon</p>
      </div>

      <!-- Body -->
      <div style="padding: 32px 24px; border: 1px solid #e2e8f0; border-top: none;">
        <p style="margin: 0 0 16px; line-height: 1.6; font-size: 16px;">
          ${greeting},
        </p>

        <p style="margin: 0 0 16px; line-height: 1.6; font-size: 16px;">
          Your free trial of <strong>${tierName}</strong> ends tomorrow.
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Plan</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600;">${tierName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Trial ends</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600;">${endsDate} at ${endsTime} ET</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Amount</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #0f172a;">$${tierPrice.toFixed(2)}/month</td>
            </tr>
          </table>
        </div>

        <p style="margin: 0 0 16px; line-height: 1.6; font-size: 16px;">
          After your trial ends, your card on file will be charged <strong>$${tierPrice.toFixed(2)}/month</strong> to continue your ${tierName} subscription.
        </p>

        <p style="margin: 0 0 24px; line-height: 1.6; font-size: 16px;">
          If you'd like to continue, you don't need to do anything &mdash; your subscription will start automatically.
        </p>

        <p style="margin: 0 0 24px; line-height: 1.6; font-size: 16px;">
          If you'd prefer not to be charged, you can cancel anytime before your trial ends:
        </p>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 28px 0;">
          <a href="https://stone-ai.net/app/billing"
             style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
            Manage Subscription
          </a>
        </div>

        <p style="margin: 0; line-height: 1.6; font-size: 14px; color: #64748b;">
          Questions? Just reply to this email and we'll help you out.
        </p>
      </div>

      <!-- Footer -->
      <div style="padding: 20px 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; text-align: center; background: #f8fafc;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          Stone AI &mdash; <a href="https://stone-ai.net" style="color: #3b82f6; text-decoration: none;">stone-ai.net</a>
        </p>
        <p style="color: #cbd5e1; font-size: 11px; margin: 8px 0 0;">
          You received this email because you started a free trial on Stone AI.
        </p>
      </div>
    </div>
  `;
}

/**
 * Resolve the effective tier and price for a trial user.
 * Uses freeTrialTier if set, otherwise falls back to their current tier.
 * Checks for promotional pricing (e.g., Growth Early Adopter at $39.99).
 */
function getTrialTierInfo(user: {
  tier: string;
  freeTrialTier: string | null;
  promoKey: string | null;
}): { tierName: string; tierPrice: number } {
  const effectiveTier = (user.freeTrialTier || user.tier) as Tier;
  const config = TIER_CONFIG[effectiveTier];

  // Check for promotional pricing
  if (user.promoKey === "GROWTH_SIGNUP") {
    return { tierName: config.name, tierPrice: 39.99 };
  }
  if (user.promoKey === "TRIAL") {
    return { tierName: config.name, tierPrice: 14.99 };
  }

  return { tierName: config.name, tierPrice: config.price };
}

export interface TrialReminderResult {
  checked: number;
  sent: number;
  skippedAlreadyReminded: number;
  errors: { userId: string; error: string }[];
}

/**
 * Check for users whose trials end within 24-28 hours and send reminder emails.
 *
 * Called by the inbox-manager poller every 5 minutes. The 4-hour query window
 * ensures reliable delivery even with brief outages or timing drift.
 *
 * Deduplication is handled via the JSONL log file — users who have already
 * received a reminder are skipped.
 */
export async function checkTrialReminders(): Promise<TrialReminderResult> {
  const result: TrialReminderResult = {
    checked: 0,
    sent: 0,
    skippedAlreadyReminded: 0,
    errors: [],
  };

  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    const windowEnd = new Date(now.getTime() + 28 * 60 * 60 * 1000);   // 28 hours from now

    // Query users with trials ending in the 24-28 hour window
    const users = await db.user.findMany({
      where: {
        freeTrialEndsAt: {
          gte: windowStart,
          lte: windowEnd,
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        tier: true,
        freeTrialTier: true,
        freeTrialEndsAt: true,
        promoKey: true,
      },
    });

    result.checked = users.length;

    if (users.length === 0) return result;

    // Load already-reminded users to avoid duplicates
    const remindedIds = getRemindedUserIds();

    for (const user of users) {
      // Skip if already reminded
      if (remindedIds.has(user.id)) {
        result.skippedAlreadyReminded++;
        continue;
      }

      const { tierName, tierPrice } = getTrialTierInfo(user);

      try {
        const emailResult = await sendOutboundEmail({
          to: user.email,
          subject: `Your ${tierName} trial ends tomorrow — Stone AI`,
          body: "", // Not used — we provide full HTML
          html: buildReminderHtml({
            userName: user.name,
            tierName,
            tierPrice,
            trialEndsAt: user.freeTrialEndsAt!,
          }),
          replyTo: process.env.ALERT_EMAIL_USER,
          fromName: "Stone AI",
        });

        if (emailResult.success) {
          result.sent++;
          appendLog({
            userId: user.id,
            email: user.email,
            tier: tierName,
            trialEndsAt: user.freeTrialEndsAt!.toISOString(),
            sentAt: new Date().toISOString(),
            messageId: emailResult.messageId,
          });
        } else {
          result.errors.push({ userId: user.id, error: emailResult.error || "Unknown send error" });
          appendLog({
            userId: user.id,
            email: user.email,
            tier: tierName,
            trialEndsAt: user.freeTrialEndsAt!.toISOString(),
            sentAt: new Date().toISOString(),
            error: emailResult.error,
          });
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        result.errors.push({ userId: user.id, error: errMsg });
        appendLog({
          userId: user.id,
          email: user.email,
          tier: tierName,
          trialEndsAt: user.freeTrialEndsAt!.toISOString(),
          sentAt: new Date().toISOString(),
          error: errMsg,
        });
      }
    }

    return result;
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[trial-reminder] Failed to check trial reminders:", errMsg);
    result.errors.push({ userId: "system", error: errMsg });
    return result;
  }
}
