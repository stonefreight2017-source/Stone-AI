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
// Daily digest removed — Forge disabled
import { runReminderCycle, parseApprovalResponse, processBatchResponse, getPendingBatches } from "@/lib/alert-system/content-approval";
import { checkTrialReminders } from "@/lib/alert-system/trial-reminder";

function authorize(req: NextRequest): boolean {
  const expected = process.env.INTERNAL_ALERT_SECRET;
  if (!expected) return false;

  // Support x-alert-secret header (legacy / Palace poller)
  const secretHeader = req.headers.get("x-alert-secret");
  if (secretHeader === expected) return true;

  // Support Authorization: Bearer <secret> (Vercel cron / standard auth)
  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (token === expected) return true;
  }

  // Support x-internal-secret header
  const internalHeader = req.headers.get("x-internal-secret");
  if (internalHeader === expected) return true;

  return false;
}

export async function GET(req: NextRequest) {
  if (!authorize(req)) {
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
    // No new messages — still run reminder cycle and trial reminders
    const reminderResult = await runReminderCycle();
    const trialReminderResult = await checkTrialReminders();
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

  // Steps 7-8: Daily digest removed (Forge disabled)

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

// maybeRunDigest removed — Forge/digest system disabled
