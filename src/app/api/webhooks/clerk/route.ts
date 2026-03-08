import { NextRequest } from "next/server";
import { Webhook } from "svix";
import { db } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit";

// ═══════════════════════════════════════════════════════════════
// Clerk Webhook Handler
// ═══════════════════════════════════════════════════════════════
// Keeps the database in sync when users are deleted or updated
// in the Clerk Dashboard or via Clerk's API.
//
// CLERK DASHBOARD SETUP:
//   1. Go to https://dashboard.clerk.com → Webhooks → Add Endpoint
//   2. URL: https://stone-ai.net/api/webhooks/clerk
//   3. Subscribe to events: user.deleted, user.updated
//   4. Copy the Signing Secret and set it as CLERK_WEBHOOK_SECRET
//      in your environment variables (Vercel + .env.local)
// ═══════════════════════════════════════════════════════════════

interface ClerkUserEvent {
  data: {
    id: string; // Clerk user ID (e.g. "user_abc123")
    email_addresses?: Array<{
      email_address: string;
      id: string;
    }>;
    first_name?: string | null;
    last_name?: string | null;
    primary_email_address_id?: string;
  };
  type: string;
}

/**
 * Verify the incoming webhook signature using svix.
 * Clerk signs webhooks with svix — this prevents replay attacks
 * and ensures the payload hasn't been tampered with.
 */
function verifyWebhook(body: string, headers: Headers): ClerkUserEvent {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("CLERK_WEBHOOK_SECRET is not configured");
  }

  const svixId = headers.get("svix-id");
  const svixTimestamp = headers.get("svix-timestamp");
  const svixSignature = headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    throw new Error("Missing svix headers");
  }

  const wh = new Webhook(secret);
  return wh.verify(body, {
    "svix-id": svixId,
    "svix-timestamp": svixTimestamp,
    "svix-signature": svixSignature,
  }) as ClerkUserEvent;
}

// POST /api/webhooks/clerk — handle Clerk webhook events
export async function POST(req: NextRequest) {
  const body = await req.text();

  // Step 1: Verify signature
  let event: ClerkUserEvent;
  try {
    event = verifyWebhook(body, req.headers);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown verification error";
    console.error("[Clerk Webhook] Signature verification failed:", message);
    logAuditEvent({
      event: "admin.action",
      metadata: { action: "clerk_webhook_invalid_signature", error: message },
    });
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  const { type, data } = event;
  const clerkId = data.id;

  try {
    switch (type) {
      case "user.deleted": {
        await handleUserDeleted(clerkId);
        break;
      }

      case "user.updated": {
        await handleUserUpdated(data);
        break;
      }

      default: {
        // Ignore unhandled event types gracefully
        console.log(`[Clerk Webhook] Ignoring unhandled event type: ${type}`);
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Clerk Webhook] Handler error for ${type}:`, message);
    return Response.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

/**
 * Handle user.deleted — cascade-delete the user's DB records.
 *
 * All child relations (Conversation, Message, UsageRecord, DailyUsage,
 * UpgradeOffer, ApiKey, AgentMemory, BestieMemory, ForumPost, ForumReply,
 * ForumLike, Feedback, Notification, Referral, BestieProfile) have
 * onDelete: Cascade in the Prisma schema, so deleting the User row
 * automatically removes all orphaned records in a single operation.
 */
async function handleUserDeleted(clerkId: string) {
  // Look up the DB user by clerkId
  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true, email: true, tier: true, stripeCustomerId: true },
  });

  if (!user) {
    // User may have already been deleted or never synced — not an error
    console.log(`[Clerk Webhook] user.deleted: No DB user found for clerkId=${clerkId}`);
    logAuditEvent({
      event: "admin.action",
      metadata: { action: "clerk_user_deleted_no_db_record", clerkId },
    });
    return;
  }

  // Delete the user — cascade handles all child records
  await db.user.delete({ where: { id: user.id } });

  logAuditEvent({
    event: "admin.action",
    userId: user.id,
    metadata: {
      action: "clerk_user_deleted",
      clerkId,
      email: user.email,
      tier: user.tier,
      hadStripe: !!user.stripeCustomerId,
    },
  });

  console.log(
    `[Clerk Webhook] user.deleted: Removed user ${user.id} (${user.email}), tier=${user.tier}`
  );
}

/**
 * Handle user.updated — sync profile changes (email, name) to DB.
 * Mirrors the same logic as getOrCreateUser() in auth.ts.
 */
async function handleUserUpdated(data: ClerkUserEvent["data"]) {
  const clerkId = data.id;

  // Resolve primary email
  const primaryEmailObj = data.email_addresses?.find(
    (e) => e.id === data.primary_email_address_id
  );
  const email = primaryEmailObj?.email_address ?? data.email_addresses?.[0]?.email_address;

  // Build name string (same format as auth.ts)
  const name = data.first_name
    ? `${data.first_name}${data.last_name ? ` ${data.last_name}` : ""}`
    : null;

  // Only update if we have the user in DB
  const existingUser = await db.user.findUnique({
    where: { clerkId },
    select: { id: true, email: true, name: true },
  });

  if (!existingUser) {
    // User hasn't visited the app yet — no DB record to update
    console.log(`[Clerk Webhook] user.updated: No DB user found for clerkId=${clerkId}`);
    return;
  }

  // Only write if something actually changed
  const updates: Record<string, string | null> = {};
  if (email && email !== existingUser.email) {
    updates.email = email;
  }
  if (name !== undefined && name !== existingUser.name) {
    updates.name = name;
  }

  if (Object.keys(updates).length === 0) {
    return; // Nothing changed
  }

  await db.user.update({
    where: { id: existingUser.id },
    data: updates,
  });

  logAuditEvent({
    event: "admin.action",
    userId: existingUser.id,
    metadata: {
      action: "clerk_user_updated",
      clerkId,
      fieldsUpdated: Object.keys(updates).join(","),
    },
  });

  console.log(
    `[Clerk Webhook] user.updated: Synced ${Object.keys(updates).join(", ")} for user ${existingUser.id}`
  );
}
