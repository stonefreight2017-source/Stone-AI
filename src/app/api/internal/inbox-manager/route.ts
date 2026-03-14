/**
 * Unified Inbox Manager endpoint for Three-Headed Monster.
 * GET /api/internal/inbox-manager
 *
 * Secured by INTERNAL_ALERT_SECRET header.
 * Runs the full triage cycle:
 *   1. Check Gmail IMAP for UNSEEN messages
 *   2. Triage each message (Zoho routing, social detection, priority keywords)
 *   3. Fire immediate alerts for P0/P1 (bypass digest)
 *   4. Send auto-responses for SUPPORT, ENTERPRISE, SECURITY (not LEGAL)
 *   5. Add remaining decisions to the daily digest queue
 *   6. If it's 7:00 AM ET (within 30 min window), send the daily digest
 */

import { NextRequest, NextResponse } from "next/server";
import { checkInbox } from "@/lib/alert-system/inbox";
import { processIncomingEmails } from "@/lib/alert-system/inbox-manager";
import { sendAutoResponses } from "@/lib/alert-system/auto-responder";
import { addToDigest, generateDailyDigest, getPendingCount } from "@/lib/alert-system/daily-digest";
import { runReminderCycle, parseApprovalResponse, processBatchResponse, getPendingBatches } from "@/lib/alert-system/content-approval";
import { checkTrialReminders } from "@/lib/alert-system/trial-reminder";

export async function GET(req: NextRequest) {
  // Auth: require internal secret
  const secret = req.headers.get("x-alert-secret");
  const expected = process.env.INTERNAL_ALERT_SECRET;

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const report: Record<string, unknown> = {};

  // --- Step 1: Check inbox ---
  const inboxResult = await checkInbox();

  if (!inboxResult.success) {
    console.error("[inbox-manager] Inbox check failed:", inboxResult.error);
    return NextResponse.json(
      {
        error: "Inbox check failed",
        messagesRead: inboxResult.messages.length,
      },
      { status: 500 }
    );
  }

  report.messagesRead = inboxResult.messages.length;

  if (inboxResult.messages.length === 0) {
    // No new messages — still run reminder cycle, trial reminders, and check digest
    const reminderResult = await runReminderCycle();
    const trialReminderResult = await checkTrialReminders();
    const digestResult = await maybeRunDigest();
    return NextResponse.json(
      {
        success: true,
        messagesRead: 0,
        triaged: 0,
        immediateAlerts: 0,
        autoResponses: { sent: 0 },
        contentReminders: {
          remindersSent: reminderResult.reminders.length,
          reminders: reminderResult.reminders,
          batchesRolled: reminderResult.rolled,
        },
        trialReminders: trialReminderResult,
        digestPending: getPendingCount(),
        digestSent: digestResult.sent,
        durationMs: Date.now() - startTime,
      },
      { status: 200 }
    );
  }

  // --- Step 2 & 3: Triage + fire P0/P1 immediate alerts ---
  const triageResult = await processIncomingEmails(inboxResult.messages);

  report.triaged = triageResult.decisions.length;
  report.immediateAlerts = triageResult.immediateAlertsSent;
  report.triageErrors = triageResult.errors;

  // --- Step 4: Auto-responses ---
  const autoResult = await sendAutoResponses(triageResult.decisions);

  report.autoResponses = {
    sent: autoResult.sent,
    skippedCooldown: autoResult.skippedCooldown,
    skippedIneligible: autoResult.skippedIneligible,
    errors: autoResult.errors,
  };

  // --- Step 5: Check for content approval responses in emails ---
  for (const msg of inboxResult.messages) {
    const subjectLower = (msg.subject || "").toLowerCase();
    if (
      subjectLower.includes("content approval") ||
      subjectLower.includes("ad content batch") ||
      subjectLower.includes("awaiting approval")
    ) {
      const bodyText = msg.textBody || "";
      const parsed = parseApprovalResponse(bodyText);
      if (parsed.response) {
        // Find the batch — use parsed batchId or fall back to most recent pending
        const targetBatchId = parsed.batchId || getPendingBatches()[0]?.batchId;
        if (targetBatchId) {
          const result = processBatchResponse(
            targetBatchId,
            parsed.response,
            parsed.itemId || undefined
          );
          if (!report.contentApproval) report.contentApproval = [];
          (report.contentApproval as unknown[]).push({
            batchId: targetBatchId,
            response: parsed.response,
            itemId: parsed.itemId,
            result: result.message,
          });
        }
      }
    }
  }

  // --- Step 6: Run Cardinal content approval reminder cycle ---
  const reminderResult = await runReminderCycle();
  report.contentReminders = {
    remindersSent: reminderResult.reminders.length,
    reminders: reminderResult.reminders,
    batchesRolled: reminderResult.rolled,
  };

  // --- Step 6b: Check for trial expiry reminders ---
  const trialReminderResult = await checkTrialReminders();
  report.trialReminders = trialReminderResult;

  // --- Step 7: Add non-immediate decisions to digest queue ---
  addToDigest(triageResult.decisions);
  report.digestPending = getPendingCount();

  // --- Step 8: Maybe send daily digest (7:00 AM ET window) ---
  const digestResult = await maybeRunDigest();
  report.digestSent = digestResult.sent;
  if (digestResult.error) report.digestError = digestResult.error;

  report.durationMs = Date.now() - startTime;

  return NextResponse.json(
    {
      success: true,
      ...report,
      decisions: triageResult.decisions.map((d) => ({
        subject: d.subject,
        from: d.from,
        priority: d.priority,
        zohoTag: d.zohoTag,
        socialLabel: d.socialLabel,
        routedTo: d.routedTo,
        immediateAlert: d.immediateAlert,
        reason: d.reason,
      })),
    },
    { status: 200 }
  );
}

/**
 * Check if it's within the 7:00 AM ET digest window (6:45 - 7:15 AM).
 * If yes and there are pending items, fire the digest.
 */
async function maybeRunDigest(): Promise<{
  sent: boolean;
  error?: string;
}> {
  const pending = getPendingCount();
  if (pending === 0) return { sent: false };

  // Check if we're in the 7:00 AM ET window
  const now = new Date();
  const etTime = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  const hour = etTime.getHours();
  const minute = etTime.getMinutes();

  // Window: 6:45 AM - 7:15 AM ET
  const inWindow =
    (hour === 6 && minute >= 45) || (hour === 7 && minute <= 15);

  if (!inWindow) return { sent: false };

  try {
    const result = await generateDailyDigest();
    if (!result.success) {
      return { sent: false, error: result.error };
    }
    return { sent: true };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { sent: false, error: errMsg };
  }
}
