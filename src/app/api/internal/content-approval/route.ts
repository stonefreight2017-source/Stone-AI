/**
 * Content Approval API — Cardinal Marketing Reminder Protocol.
 *
 * GET  /api/internal/content-approval          — List pending batches
 * POST /api/internal/content-approval          — Add a new batch or respond to one
 *
 * Secured by INTERNAL_ALERT_SECRET header.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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
  const expected = process.env.INTERNAL_ALERT_SECRET;
  if (!expected) return false;

  const secretHeader = req.headers.get("x-alert-secret");
  if (secretHeader === expected) return true;

  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (token === expected) return true;
  }

  const internalHeader = req.headers.get("x-internal-secret");
  if (internalHeader === expected) return true;

  return false;
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
const addBatchSchema = z.object({
  action: z.literal("add"),
  batchId: z.string().min(1).max(200),
  scheduledWindow: z.enum(["09:00", "13:00", "19:00"]),
  items: z.array(z.object({
    id: z.string(),
    brand: z.enum(["stone-ai", "stone-ai-tools", "best-ai", "best-ai-mobile", "stone-ai-corporate"]),
    platform: z.string(),
    format: z.string(),
    summary: z.string(),
    draftedBy: z.enum(["stone", "cardinal", "marketing-strategist"]),
    status: z.enum(["pending", "approved", "rejected", "revision_requested"]),
  }).strict()).min(1),
  visualHtmlFile: z.string().max(500).nullable().optional(),
}).strict();

const respondSchema = z.object({
  action: z.literal("respond"),
  batchId: z.string().min(1).max(200),
  response: z.enum(["APPROVE", "REJECT", "REQUEST CHANGES"]),
  itemId: z.string().max(200).optional(),
}).strict();

const remindSchema = z.object({
  action: z.literal("remind"),
  batchId: z.string().min(1).max(200),
}).strict();

const postBodySchema = z.discriminatedUnion("action", [addBatchSchema, respondSchema, remindSchema]);

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = postBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const body = parsed.data;

  if (body.action === "add") {
    const batch = addBatch({
      batchId: body.batchId,
      scheduledWindow: body.scheduledWindow,
      scheduledDate: getTodayET(),
      items: body.items as ContentItem[],
      visualHtmlFile: body.visualHtmlFile || null,
    });

    return NextResponse.json({ success: true, batch });
  }

  if (body.action === "respond") {
    const result = processBatchResponse(body.batchId, body.response, body.itemId);
    return NextResponse.json({ success: result.success, message: result.message });
  }

  if (body.action === "remind") {
    const batch = getBatch(body.batchId);
    if (!batch) return NextResponse.json({ error: "Batch not found" }, { status: 404 });

    const result = await sendBatchReminder(batch);
    return NextResponse.json({ success: result.success, error: result.error });
  }

  return NextResponse.json({ error: "Unknown action. Use: add, respond, remind" }, { status: 400 });
}
