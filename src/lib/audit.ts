/**
 * Security audit logging.
 * Logs security-relevant events to the database for forensic analysis.
 * Inspired by Stripe's audit trail and Cloudflare's event logging.
 */

import { db } from "./db";

export type AuditEvent =
  | "auth.login"
  | "auth.failed"
  | "auth.banned_access"
  | "api_key.created"
  | "api_key.revoked"
  | "api_key.used"
  | "api_key.invalid"
  | "invite.redeemed"
  | "invite.failed"
  | "tier.upgraded"
  | "tier.downgrade_blocked"
  | "agent.access_denied"
  | "rate_limit.hit"
  | "injection.detected"
  | "admin.action"
  | "conversation.deleted"
  | "concurrent.blocked";

interface AuditLogEntry {
  event: AuditEvent;
  userId?: string;
  ip?: string;
  metadata?: Record<string, string | number | boolean>;
}

/**
 * Log a security event. Fire-and-forget — never blocks the request.
 * Falls back to console.warn if DB write fails.
 */
export function logAuditEvent(entry: AuditLogEntry): void {
  // Async, non-blocking
  writeAuditLog(entry).catch(() => {
    // Last-resort: stderr (no stack traces, just the event)
    console.warn(`[AUDIT] ${entry.event} user=${entry.userId ?? "anon"}`);
  });
}

async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  // Use raw SQL to avoid needing a Prisma model migration right now.
  // The table is created in ensureAuditTable() on first use.
  await ensureAuditTable();

  const metaJson = entry.metadata ? JSON.stringify(entry.metadata) : null;

  await db.$executeRawUnsafe(
    `INSERT INTO "AuditLog" (id, event, "userId", ip, metadata, "createdAt")
     VALUES (gen_random_uuid(), $1, $2, $3, $4::jsonb, NOW())`,
    entry.event,
    entry.userId ?? null,
    entry.ip ?? null,
    metaJson
  );
}

let tableEnsured = false;

async function ensureAuditTable(): Promise<void> {
  if (tableEnsured) return;

  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AuditLog" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event VARCHAR(50) NOT NULL,
      "userId" VARCHAR(50),
      ip VARCHAR(45),
      metadata JSONB,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Index for querying by user and time
  await db.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_audit_user_time
    ON "AuditLog" ("userId", "createdAt" DESC)
  `);

  // Index for querying by event type
  await db.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_audit_event
    ON "AuditLog" (event, "createdAt" DESC)
  `);

  tableEnsured = true;
}

/**
 * Extract client IP from request headers.
 * Handles X-Forwarded-For (behind proxy/CDN) and direct connections.
 */
export function getClientIp(headers: Headers): string {
  // X-Forwarded-For can be spoofed — take the LAST entry (closest to server)
  // or the first if behind a trusted reverse proxy
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map((ip) => ip.trim());
    // Take the rightmost non-private IP, or first if all are private
    return ips[0] ?? "unknown";
  }

  return headers.get("x-real-ip") ?? "unknown";
}
