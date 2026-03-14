/**
 * Send Cardinal Marketing Content Approval System — Completion Report
 * Sends to 3heads (founder) via SMTP
 */
import "dotenv/config";
import { sendOutboundEmail } from "../src/lib/alert-system/outbound";

const reportHtml = `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 720px; margin: 0 auto; color: #1a1a1a; background: #f8fafc; padding: 0;">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px; border-radius: 8px 8px 0 0;">
    <h1 style="color: #f1f5f9; margin: 0 0 8px 0; font-size: 22px;">Cardinal Marketing Content Approval System</h1>
    <p style="color: #94a3b8; margin: 0; font-size: 14px;">Completion Report &mdash; March 10, 2026</p>
    <span style="display: inline-block; margin-top: 12px; padding: 4px 12px; background: #22c55e; color: #fff; border-radius: 4px; font-size: 12px; font-weight: 600;">ALL TESTS PASSED</span>
  </div>

  <div style="background: #fff; padding: 28px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">

    <!-- System Overview -->
    <h2 style="color: #0f172a; font-size: 16px; margin: 0 0 12px 0; border-bottom: 2px solid #3b82f6; padding-bottom: 6px;">System Overview</h2>
    <p style="margin: 0 0 16px 0; line-height: 1.6; color: #475569;">
      The Cardinal Marketing Content Approval Queue &amp; Reminder System is now <strong>fully operational</strong>.
      This system ensures that <strong>zero marketing content publishes without explicit Founder approval</strong>.
    </p>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <tr style="background: #f1f5f9;">
        <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600; width: 40%;">Posting Windows</td>
        <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">09:00 AM, 01:00 PM, 07:00 PM ET</td>
      </tr>
      <tr>
        <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600;">Reminder Timing</td>
        <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">1 hour before each window (08:00, 12:00, 18:00 ET)</td>
      </tr>
      <tr style="background: #f1f5f9;">
        <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600;">Approval Responses</td>
        <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">APPROVE, REJECT, REQUEST CHANGES (per-item or batch)</td>
      </tr>
      <tr>
        <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600;">Missed Window Action</td>
        <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">Auto-hold &amp; roll to next window (never publishes)</td>
      </tr>
      <tr style="background: #f1f5f9;">
        <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600;">Poller</td>
        <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">Every 5 min via Windows Task Scheduler (PowerShell)</td>
      </tr>
      <tr>
        <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600;">Audit Trail</td>
        <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">Append-only JSONL at ~/palace-logs/cardinal/</td>
      </tr>
    </table>

    <!-- Fail-Safe Audit -->
    <h2 style="color: #0f172a; font-size: 16px; margin: 0 0 12px 0; border-bottom: 2px solid #ef4444; padding-bottom: 6px;">Fail-Safe Audit</h2>
    <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-weight: 600; color: #166534;">VERIFIED: Zero paths to unauthorized publishing</p>
      <ul style="margin: 0; padding-left: 20px; color: #15803d; line-height: 1.8;">
        <li>No social media SDKs or APIs in the codebase</li>
        <li><code>processBatchResponse()</code> is the ONLY function that can set status to "approved" &mdash; requires explicit Founder email response</li>
        <li>Unapproved content stays "pending" forever, rolling to next window indefinitely</li>
        <li>No auto-approve, no bypass, no scheduled publishing jobs</li>
        <li>Complete append-only JSONL audit trail for every action</li>
      </ul>
    </div>

    <!-- Test Results -->
    <h2 style="color: #0f172a; font-size: 16px; margin: 0 0 12px 0; border-bottom: 2px solid #22c55e; padding-bottom: 6px;">End-to-End Test Results (12/12 Passed)</h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
      <tr style="background: #0f172a; color: #f1f5f9;">
        <th style="padding: 8px; text-align: left; border: 1px solid #334155;">Test</th>
        <th style="padding: 8px; text-align: left; border: 1px solid #334155;">Description</th>
        <th style="padding: 8px; text-align: center; border: 1px solid #334155; width: 60px;">Result</th>
      </tr>
      <tr><td style="padding: 6px 8px; border: 1px solid #e2e8f0;">1</td><td style="padding: 6px 8px; border: 1px solid #e2e8f0;">Add test batch to approval queue (3 items)</td><td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center; color: #22c55e; font-weight: 700;">PASS</td></tr>
      <tr style="background:#f8fafc;"><td style="padding: 6px 8px; border: 1px solid #e2e8f0;">2</td><td style="padding: 6px 8px; border: 1px solid #e2e8f0;">Verify queue lists batch as pending</td><td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center; color: #22c55e; font-weight: 700;">PASS</td></tr>
      <tr><td style="padding: 6px 8px; border: 1px solid #e2e8f0;">3</td><td style="padding: 6px 8px; border: 1px solid #e2e8f0;">Force-send a P1 reminder (simulated 1hr before window)</td><td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center; color: #22c55e; font-weight: 700;">PASS</td></tr>
      <tr style="background:#f8fafc;"><td style="padding: 6px 8px; border: 1px solid #e2e8f0;">4</td><td style="padding: 6px 8px; border: 1px solid #e2e8f0;">Audit log &mdash; batch_created + reminder_sent logged</td><td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center; color: #22c55e; font-weight: 700;">PASS</td></tr>
      <tr><td style="padding: 6px 8px; border: 1px solid #e2e8f0;">5</td><td style="padding: 6px 8px; border: 1px solid #e2e8f0;">APPROVE single item (per-item response)</td><td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center; color: #22c55e; font-weight: 700;">PASS</td></tr>
      <tr style="background:#f8fafc;"><td style="padding: 6px 8px; border: 1px solid #e2e8f0;">6</td><td style="padding: 6px 8px; border: 1px solid #e2e8f0;">Partial approval state (1 approved, 2 pending)</td><td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center; color: #22c55e; font-weight: 700;">PASS</td></tr>
      <tr><td style="padding: 6px 8px; border: 1px solid #e2e8f0;">7</td><td style="padding: 6px 8px; border: 1px solid #e2e8f0;">REJECT item + REQUEST CHANGES item (mixed responses)</td><td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center; color: #22c55e; font-weight: 700;">PASS</td></tr>
      <tr style="background:#f8fafc;"><td style="padding: 6px 8px; border: 1px solid #e2e8f0;">8</td><td style="padding: 6px 8px; border: 1px solid #e2e8f0;">All items resolved &mdash; batch no longer pending</td><td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center; color: #22c55e; font-weight: 700;">PASS</td></tr>
      <tr><td style="padding: 6px 8px; border: 1px solid #e2e8f0;">9</td><td style="padding: 6px 8px; border: 1px solid #e2e8f0;">Hold-and-roll: 09:00 &rarr; 13:00 (rollCount 1)</td><td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center; color: #22c55e; font-weight: 700;">PASS</td></tr>
      <tr style="background:#f8fafc;"><td style="padding: 6px 8px; border: 1px solid #e2e8f0;">10</td><td style="padding: 6px 8px; border: 1px solid #e2e8f0;">Full rollover chain: 13:00 &rarr; 19:00 &rarr; 09:00 next day</td><td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center; color: #22c55e; font-weight: 700;">PASS</td></tr>
      <tr><td style="padding: 6px 8px; border: 1px solid #e2e8f0;">11</td><td style="padding: 6px 8px; border: 1px solid #e2e8f0;">Complete audit log integrity (all events traced)</td><td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center; color: #22c55e; font-weight: 700;">PASS</td></tr>
      <tr style="background:#f8fafc;"><td style="padding: 6px 8px; border: 1px solid #e2e8f0;">12</td><td style="padding: 6px 8px; border: 1px solid #e2e8f0;">Inbox-manager live endpoint (triage + reminders + roll)</td><td style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center; color: #22c55e; font-weight: 700;">PASS</td></tr>
    </table>

    <!-- Architecture -->
    <h2 style="color: #0f172a; font-size: 16px; margin: 0 0 12px 0; border-bottom: 2px solid #8b5cf6; padding-bottom: 6px;">Architecture &amp; Files</h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
      <tr style="background: #0f172a; color: #f1f5f9;">
        <th style="padding: 8px; text-align: left; border: 1px solid #334155;">Component</th>
        <th style="padding: 8px; text-align: left; border: 1px solid #334155;">Path</th>
      </tr>
      <tr><td style="padding: 6px 8px; border: 1px solid #e2e8f0;">Core Module</td><td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 12px;">src/lib/alert-system/content-approval.ts</td></tr>
      <tr style="background:#f8fafc;"><td style="padding: 6px 8px; border: 1px solid #e2e8f0;">API Endpoint</td><td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 12px;">src/app/api/internal/content-approval/route.ts</td></tr>
      <tr><td style="padding: 6px 8px; border: 1px solid #e2e8f0;">Inbox Manager</td><td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 12px;">src/app/api/internal/inbox-manager/route.ts</td></tr>
      <tr style="background:#f8fafc;"><td style="padding: 6px 8px; border: 1px solid #e2e8f0;">Poller (Task Scheduler)</td><td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 12px;">scripts/poll-inbox-manager.ps1</td></tr>
      <tr><td style="padding: 6px 8px; border: 1px solid #e2e8f0;">Approval Queue</td><td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 12px;">~/palace-logs/cardinal/content-approval-queue.json</td></tr>
      <tr style="background:#f8fafc;"><td style="padding: 6px 8px; border: 1px solid #e2e8f0;">Audit Log</td><td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 12px;">~/palace-logs/cardinal/marketing-approvals.jsonl</td></tr>
    </table>

    <!-- How It Works -->
    <h2 style="color: #0f172a; font-size: 16px; margin: 0 0 12px 0; border-bottom: 2px solid #f59e0b; padding-bottom: 6px;">How It Works</h2>
    <ol style="margin: 0 0 24px 0; padding-left: 20px; line-height: 2; color: #334155;">
      <li>Cardinal drafts content and submits a batch via <code>POST /api/internal/content-approval</code></li>
      <li>1 hour before posting window, a P1 reminder email hits Founder inbox</li>
      <li>Founder replies with APPROVE / REJECT / REQUEST CHANGES (per-item or batch-level)</li>
      <li>Inbox-manager parses the reply and updates batch status</li>
      <li>If no response by posting time &mdash; content holds and rolls to next window</li>
      <li>Roll chain: 09:00 &rarr; 13:00 &rarr; 19:00 &rarr; 09:00 next day (infinite until approved)</li>
      <li>Every action logged to append-only JSONL for full audit trail</li>
    </ol>

    <!-- Integration -->
    <h2 style="color: #0f172a; font-size: 16px; margin: 0 0 12px 0; border-bottom: 2px solid #06b6d4; padding-bottom: 6px;">Integration with Inbox Manager</h2>
    <p style="margin: 0 0 16px 0; line-height: 1.6; color: #475569;">
      The content approval system is fully integrated into the unified inbox-manager endpoint. Every 5-minute poll cycle automatically:
    </p>
    <ul style="margin: 0 0 24px 0; padding-left: 20px; line-height: 1.8; color: #475569;">
      <li>Checks Gmail IMAP for new messages</li>
      <li>Triages by Zoho tags, social senders, priority keywords</li>
      <li>Fires P0/P1 immediate alerts (bypassing daily digest)</li>
      <li>Sends auto-responses (SUPPORT, ENTERPRISE, SECURITY)</li>
      <li>Parses content approval responses from Founder replies</li>
      <li>Runs reminder cycle (send reminders + roll missed windows)</li>
      <li>Queues P2/P3 for daily digest (sent at 7:00 AM ET)</li>
    </ul>

    <!-- Status -->
    <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 8px; padding: 20px; text-align: center;">
      <p style="margin: 0; font-size: 18px; font-weight: 700; color: #166534;">SYSTEM STATUS: PRODUCTION READY</p>
      <p style="margin: 8px 0 0 0; color: #15803d;">All 12 end-to-end tests passed. Fail-safe audit verified. Poller operational.</p>
    </div>

  </div>

  <!-- Footer -->
  <div style="padding: 16px; text-align: center;">
    <p style="color: #94a3b8; font-size: 11px; margin: 0;">
      Stone AI &mdash; Three-Headed Monster &mdash; <a href="https://stone-ai.net" style="color: #3b82f6;">stone-ai.net</a>
    </p>
  </div>
</div>
`;

async function main() {
  const result = await sendOutboundEmail({
    to: "3headedm@gmail.com",
    subject: "Cardinal Content Approval System — Completion Report (12/12 Tests Passed)",
    body: "", // using HTML
    html: reportHtml,
    fromName: "Stone AI — System Report",
  });

  if (result.success) {
    console.log("Report sent successfully!");
    console.log("Message ID:", result.messageId);
  } else {
    console.error("Failed to send report:", result.error);
    process.exit(1);
  }
}

main();
