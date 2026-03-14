/**
 * Cardinal Marketing Content Approval Queue & Reminder System.
 *
 * Implements the Cardinal Marketing Agent Reminder Protocol:
 * - Content batches enter a pending approval queue
 * - Reminders sent 1 hour before posting windows (09:00, 13:00, 19:00 ET)
 * - Unapproved content auto-rolls to next posting window
 * - Founder responses (APPROVE/REJECT/REQUEST CHANGES) parsed from inbox
 * - All actions logged to JSONL
 *
 * Cardinal gates content — nothing publishes without Founder approval.
 */

import { existsSync, mkdirSync, readFileSync, appendFileSync, writeFileSync } from "fs";
import { join } from "path";
import { sendFounderAlert } from "./send";
import { AlertAgent, AlertPriority, AlertType } from "./types";

// --- Constants ---
const POSTING_WINDOWS = ["09:00", "13:00", "19:00"] as const;
type PostingWindow = (typeof POSTING_WINDOWS)[number];

const REMINDER_OFFSETS: Record<PostingWindow, string> = {
  "09:00": "08:00",
  "13:00": "12:00",
  "19:00": "18:00",
};

const NEXT_WINDOW: Record<PostingWindow, { window: PostingWindow; nextDay: boolean }> = {
  "09:00": { window: "13:00", nextDay: false },
  "13:00": { window: "19:00", nextDay: false },
  "19:00": { window: "09:00", nextDay: true },
};

// --- Storage paths ---
const LOG_DIR = join(process.env.HOME || process.env.USERPROFILE || "~", "palace-logs", "cardinal");
const QUEUE_FILE = join(LOG_DIR, "content-approval-queue.json");
const LOG_FILE = join(LOG_DIR, "marketing-approvals.jsonl");

function ensureLogDir() {
  if (!existsSync(LOG_DIR)) {
    mkdirSync(LOG_DIR, { recursive: true });
  }
}

// --- Content item & batch types ---
export interface ContentItem {
  id: string;
  brand: "stone-ai" | "stone-ai-tools" | "best-ai" | "best-ai-mobile" | "stone-ai-corporate";
  platform: string;
  format: string;
  summary: string;
  draftedBy: "stone" | "cardinal" | "marketing-strategist";
  status: "pending" | "approved" | "rejected" | "revision_requested";
}

export interface ContentBatch {
  batchId: string;
  items: ContentItem[];
  scheduledWindow: PostingWindow;
  scheduledDate: string; // YYYY-MM-DD
  visualHtmlFile: string | null;
  status: "pending" | "approved" | "rejected" | "partial" | "revision_requested";
  rollCount: number;
  createdAt: string;
  lastReminderAt: string | null;
  smtpMessageId: string | null;
}

// --- Queue operations ---

function loadQueue(): ContentBatch[] {
  ensureLogDir();
  if (!existsSync(QUEUE_FILE)) return [];
  try {
    return JSON.parse(readFileSync(QUEUE_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function saveQueue(batches: ContentBatch[]) {
  ensureLogDir();
  writeFileSync(QUEUE_FILE, JSON.stringify(batches, null, 2), "utf-8");
}

function appendLog(entry: Record<string, unknown>) {
  ensureLogDir();
  appendFileSync(LOG_FILE, JSON.stringify({ ...entry, loggedAt: new Date().toISOString() }) + "\n", "utf-8");
}

/**
 * Add a new content batch to the approval queue.
 */
export function addBatch(batch: Omit<ContentBatch, "status" | "rollCount" | "createdAt" | "lastReminderAt" | "smtpMessageId">): ContentBatch {
  const full: ContentBatch = {
    ...batch,
    status: "pending",
    rollCount: 0,
    createdAt: new Date().toISOString(),
    lastReminderAt: null,
    smtpMessageId: null,
  };
  const queue = loadQueue();
  queue.push(full);
  saveQueue(queue);
  appendLog({ event: "batch_created", batchId: full.batchId, items: full.items.length, window: full.scheduledWindow });
  return full;
}

/**
 * Get all pending batches for a specific posting window.
 */
export function getPendingBatches(window?: PostingWindow): ContentBatch[] {
  const queue = loadQueue();
  return queue.filter(b => {
    const isPending = b.status === "pending" || b.status === "partial";
    return window ? isPending && b.scheduledWindow === window : isPending;
  });
}

/**
 * Get a specific batch by ID.
 */
export function getBatch(batchId: string): ContentBatch | null {
  const queue = loadQueue();
  return queue.find(b => b.batchId === batchId) || null;
}

/**
 * Update a batch in the queue.
 */
export function updateBatch(batchId: string, updates: Partial<ContentBatch>): ContentBatch | null {
  const queue = loadQueue();
  const idx = queue.findIndex(b => b.batchId === batchId);
  if (idx === -1) return null;
  queue[idx] = { ...queue[idx], ...updates };
  saveQueue(queue);
  return queue[idx];
}

// --- Reminder logic ---

/**
 * Check if a reminder should be sent for the given window.
 * Returns pending batches that need reminders.
 */
export function getBatchesNeedingReminder(currentTimeET: string): ContentBatch[] {
  const [hour, minute] = currentTimeET.split(":").map(Number);
  const currentMinutes = hour * 60 + minute;

  // Check each reminder offset
  for (const [window, reminderTime] of Object.entries(REMINDER_OFFSETS)) {
    const [rh, rm] = reminderTime.split(":").map(Number);
    const reminderMinutes = rh * 60 + rm;

    // Within 5-minute window of reminder time
    if (Math.abs(currentMinutes - reminderMinutes) <= 5) {
      return getPendingBatches(window as PostingWindow);
    }
  }

  return [];
}

/**
 * Send a reminder email for a pending batch.
 */
export async function sendBatchReminder(batch: ContentBatch): Promise<{ success: boolean; error?: string }> {
  const pendingCount = batch.items.filter(i => i.status === "pending").length;
  const totalCount = batch.items.length;

  const brandSummary = batch.items.reduce((acc, item) => {
    const brand = item.brand;
    if (!acc[brand]) acc[brand] = [];
    acc[brand].push(`${item.platform} (${item.format})`);
    return acc;
  }, {} as Record<string, string[]>);

  const brandLines = Object.entries(brandSummary)
    .map(([brand, platforms]) => `${brand}: ${platforms.join(", ")}`)
    .join("\n");

  const windowLabel = batch.scheduledWindow === "09:00" ? "09:00 AM ET"
    : batch.scheduledWindow === "13:00" ? "01:00 PM ET"
    : "07:00 PM ET";

  try {
    const result = await sendFounderAlert(
      {
        agent: AlertAgent.CARDINAL,
        priority: AlertPriority.P1,
        alertType: AlertType.CONTENT_APPROVAL,
        title: `Content Approval Pending — ${windowLabel}`,
        body:
          `A marketing content batch scheduled for posting is awaiting Founder approval.\n\n` +
          `Batch ID: ${batch.batchId}\n` +
          `Scheduled Post Time: ${windowLabel}\n` +
          `Pending Items: ${pendingCount} of ${totalCount}\n` +
          `Roll Count: ${batch.rollCount}\n\n` +
          `Content by Brand:\n${brandLines}\n\n` +
          `Reply with:\n` +
          `  APPROVE — Publish at scheduled time\n` +
          `  REJECT — Discard and log\n` +
          `  REQUEST CHANGES — Return for revision\n\n` +
          `If no approval is received, content will hold until the next posting window.` +
          (batch.visualHtmlFile ? `\n\nVisual mockups were sent separately via: ${batch.visualHtmlFile}` : ""),
        metadata: {
          batchId: batch.batchId,
          scheduledWindow: batch.scheduledWindow,
          pendingItems: pendingCount,
          totalItems: totalCount,
          rollCount: batch.rollCount,
        },
      },
      0 // No cooldown — reminders are time-critical
    );

    if (result.success) {
      updateBatch(batch.batchId, { lastReminderAt: new Date().toISOString() });
      appendLog({
        event: "reminder_sent",
        batchId: batch.batchId,
        window: batch.scheduledWindow,
        alertId: result.alertId,
        pendingItems: pendingCount,
      });
    }

    return { success: result.success, error: result.error };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    appendLog({ event: "reminder_failed", batchId: batch.batchId, error: msg });
    return { success: false, error: msg };
  }
}

// --- Hold & Roll logic ---

/**
 * Roll all pending batches from a missed window to the next one.
 */
export function rollPendingBatches(missedWindow: PostingWindow): { rolled: string[]; nextWindow: PostingWindow } {
  const next = NEXT_WINDOW[missedWindow];
  const pending = getPendingBatches(missedWindow);
  const rolled: string[] = [];

  for (const batch of pending) {
    const newDate = next.nextDay
      ? getNextDay(batch.scheduledDate)
      : batch.scheduledDate;

    updateBatch(batch.batchId, {
      scheduledWindow: next.window,
      scheduledDate: newDate,
      rollCount: batch.rollCount + 1,
    });

    appendLog({
      event: "batch_rolled",
      batchId: batch.batchId,
      fromWindow: missedWindow,
      toWindow: next.window,
      newDate: newDate,
      rollCount: batch.rollCount + 1,
    });

    rolled.push(batch.batchId);
  }

  return { rolled, nextWindow: next.window };
}

// --- Founder response handling ---

/**
 * Process a Founder approval response for a batch.
 */
export function processBatchResponse(
  batchId: string,
  response: "APPROVE" | "REJECT" | "REQUEST CHANGES",
  itemId?: string
): { success: boolean; message: string } {
  const batch = getBatch(batchId);
  if (!batch) return { success: false, message: `Batch ${batchId} not found` };

  if (itemId) {
    // Per-item response
    const item = batch.items.find(i => i.id === itemId);
    if (!item) return { success: false, message: `Item ${itemId} not found in batch ${batchId}` };

    item.status = response === "APPROVE" ? "approved"
      : response === "REJECT" ? "rejected"
      : "revision_requested";

    // Check if all items are resolved
    const allResolved = batch.items.every(i => i.status !== "pending");
    const anyApproved = batch.items.some(i => i.status === "approved");
    const anyPending = batch.items.some(i => i.status === "pending");

    if (allResolved) {
      batch.status = anyApproved ? "approved" : "rejected";
    } else if (anyPending) {
      batch.status = "partial";
    }

    updateBatch(batchId, { items: batch.items, status: batch.status });
  } else {
    // Batch-level response
    const newItemStatus = response === "APPROVE" ? "approved" as const
      : response === "REJECT" ? "rejected" as const
      : "revision_requested" as const;

    batch.items.forEach(item => {
      if (item.status === "pending") {
        item.status = newItemStatus;
      }
    });

    batch.status = response === "APPROVE" ? "approved"
      : response === "REJECT" ? "rejected"
      : "revision_requested";

    updateBatch(batchId, { items: batch.items, status: batch.status });
  }

  appendLog({
    event: "founder_response",
    batchId,
    response,
    itemId: itemId || "all",
    resultingStatus: getBatch(batchId)?.status,
    timestamp: new Date().toISOString(),
  });

  return { success: true, message: `Batch ${batchId} ${itemId ? `item ${itemId}` : ""}: ${response}` };
}

/**
 * Parse a Founder reply email for approval commands.
 * Detects: APPROVE, REJECT, REQUEST CHANGES (case-insensitive)
 */
export function parseApprovalResponse(body: string): {
  response: "APPROVE" | "REJECT" | "REQUEST CHANGES" | null;
  batchId: string | null;
  itemId: string | null;
} {
  const lines = body.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  const firstLine = (lines[0] || "").toUpperCase();

  let response: "APPROVE" | "REJECT" | "REQUEST CHANGES" | null = null;

  if (/^APPROVE\b/.test(firstLine)) response = "APPROVE";
  else if (/^REJECT\b/.test(firstLine)) response = "REJECT";
  else if (/^REQUEST\s*CHANGES?\b/.test(firstLine)) response = "REQUEST CHANGES";
  else if (/^CHANGES?\b/.test(firstLine)) response = "REQUEST CHANGES";

  // Try to extract batch ID and item ID
  const batchMatch = body.match(/batch[- ]?(\d+|[a-z0-9-]+)/i);
  const itemMatch = body.match(/mkt-\d{4}-\d{2}-\d{2}-\d{3}/i);

  return {
    response,
    batchId: batchMatch ? batchMatch[1] : null,
    itemId: itemMatch ? itemMatch[0] : null,
  };
}

// --- Utilities ---

function getNextDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

/**
 * Get current time in ET timezone as HH:MM string.
 */
export function getCurrentTimeET(): string {
  const now = new Date();
  const etStr = now.toLocaleString("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", hour12: false });
  return etStr;
}

/**
 * Get today's date as YYYY-MM-DD.
 */
export function getTodayET(): string {
  const now = new Date();
  const etDate = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  return etDate.toISOString().split("T")[0];
}

/**
 * Run the full reminder + hold-and-roll cycle.
 * Call this on a schedule (e.g., every 5 minutes via the inbox-manager endpoint).
 */
export async function runReminderCycle(): Promise<{
  reminders: { batchId: string; success: boolean; error?: string }[];
  rolled: { window: string; batches: string[] }[];
}> {
  const currentTime = getCurrentTimeET();
  const [hour, minute] = currentTime.split(":").map(Number);
  const currentMinutes = hour * 60 + minute;
  const reminders: { batchId: string; success: boolean; error?: string }[] = [];
  const rolled: { window: string; batches: string[] }[] = [];

  // Check if we're at a reminder time (1 hour before posting)
  const batchesNeedingReminder = getBatchesNeedingReminder(currentTime);
  for (const batch of batchesNeedingReminder) {
    const result = await sendBatchReminder(batch);
    reminders.push({ batchId: batch.batchId, ...result });
  }

  // Check if we just passed a posting window (within 10 min after)
  for (const window of POSTING_WINDOWS) {
    const [wh, wm] = window.split(":").map(Number);
    const windowMinutes = wh * 60 + wm;
    const minutesAfter = currentMinutes - windowMinutes;

    if (minutesAfter >= 0 && minutesAfter <= 10) {
      const result = rollPendingBatches(window);
      if (result.rolled.length > 0) {
        rolled.push({ window, batches: result.rolled });
      }
    }
  }

  return { reminders, rolled };
}
