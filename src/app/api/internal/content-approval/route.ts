/**
 * Content Approval API — Cardinal Marketing Reminder Protocol.
 *
 * GET  /api/internal/content-approval          — List pending batches
 * POST /api/internal/content-approval          — Add a new batch or respond to one
 *
 * Secured by INTERNAL_ALERT_SECRET header.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  addBatch,
  getPendingBatches,
  getBatch,
  processBatchResponse,
  sendBatchReminder,
  runReminderCycle,
  getTodayET,
  type ContentItem,
} from "@/lib/alert-system/content-approval";

function checkAuth(req: NextRequest): boolean {
  const secret = req.headers.get("x-alert-secret");
  const expected = process.env.INTERNAL_ALERT_SECRET;
  return !!expected && secret === expected;
}

/**
 * GET — List all pending content batches, or run the reminder cycle.
 * Query params:
 *   ?action=reminder  — Run the reminder + hold-and-roll cycle now
 *   ?action=list      — List pending batches (default)
 *   ?batchId=xxx      — Get a specific batch
 */
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const action = req.nextUrl.searchParams.get("action") || "list";
  const batchId = req.nextUrl.searchParams.get("batchId");

  if (action === "reminder") {
    const result = await runReminderCycle();
    return NextResponse.json({ success: true, ...result });
  }

  if (batchId) {
    const batch = getBatch(batchId);
    if (!batch) return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    return NextResponse.json({ success: true, batch });
  }

  const pending = getPendingBatches();
  return NextResponse.json({ success: true, pending, count: pending.length });
}

/**
 * POST — Add a new batch or respond to an existing one.
 *
 * Add batch:
 *   { action: "add", batchId: "batch-002", scheduledWindow: "09:00", items: [...] }
 *
 * Respond to batch:
 *   { action: "respond", batchId: "batch-001", response: "APPROVE" }
 *   { action: "respond", batchId: "batch-001", response: "REJECT", itemId: "mkt-..." }
 *
 * Send reminder now:
 *   { action: "remind", batchId: "batch-001" }
 */
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { action } = body;

  if (action === "add") {
    const { batchId, scheduledWindow, items, visualHtmlFile } = body;
    if (!batchId || !scheduledWindow || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Required: batchId, scheduledWindow, items[]" },
        { status: 400 }
      );
    }

    const batch = addBatch({
      batchId,
      scheduledWindow,
      scheduledDate: getTodayET(),
      items: items as ContentItem[],
      visualHtmlFile: visualHtmlFile || null,
    });

    return NextResponse.json({ success: true, batch });
  }

  if (action === "respond") {
    const { batchId, response, itemId } = body;
    if (!batchId || !response) {
      return NextResponse.json(
        { error: "Required: batchId, response (APPROVE|REJECT|REQUEST CHANGES)" },
        { status: 400 }
      );
    }

    if (!["APPROVE", "REJECT", "REQUEST CHANGES"].includes(response)) {
      return NextResponse.json(
        { error: "response must be APPROVE, REJECT, or REQUEST CHANGES" },
        { status: 400 }
      );
    }

    const result = processBatchResponse(batchId, response, itemId);
    return NextResponse.json({ success: result.success, message: result.message });
  }

  if (action === "remind") {
    const { batchId } = body;
    const batch = getBatch(batchId);
    if (!batch) return NextResponse.json({ error: "Batch not found" }, { status: 404 });

    const result = await sendBatchReminder(batch);
    return NextResponse.json({ success: result.success, error: result.error });
  }

  return NextResponse.json({ error: "Unknown action. Use: add, respond, remind" }, { status: 400 });
}
