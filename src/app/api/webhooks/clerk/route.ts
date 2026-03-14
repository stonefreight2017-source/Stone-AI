import { NextRequest } from "next/server";
import { Webhook } from "svix";
import { db } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit";
import { sendOutboundEmail } from "@/lib/alert-system/outbound";
import { sendFounderAlert } from "@/lib/alert-system/send";
import { AlertAgent, AlertPriority, AlertType } from "@/lib/alert-system/types";

// ═══════════════════════════════════════════════════════════════
// Clerk Webhook Handler
// ═══════════════════════════════════════════════════════════════
// Keeps the database in sync when users are created, deleted, or
// updated in the Clerk Dashboard or via Clerk's API.
//
// CLERK DASHBOARD SETUP:
//   1. Go to https://dashboard.clerk.com → Webhooks → Add Endpoint
//   2. URL: https://stone-ai.net/api/webhooks/clerk
//   3. Subscribe to events: user.created, user.deleted, user.updated
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
      case "user.created": {
        handleUserCreated(data);  // fire-and-forget — don't block webhook response
        break;
      }

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
 * Handle user.created — send a welcome email and notify the founder.
 * Runs fire-and-forget so the webhook response isn't delayed by SMTP.
 */
function handleUserCreated(data: ClerkUserEvent["data"]) {
  const clerkId = data.id;

  // Resolve email address
  const primaryEmailObj = data.email_addresses?.find(
    (e) => e.id === data.primary_email_address_id
  );
  const email = primaryEmailObj?.email_address ?? data.email_addresses?.[0]?.email_address;

  if (!email) {
    console.error("[Clerk Webhook] user.created event has no email address, skipping welcome email");
    return;
  }

  const firstName = data.first_name || null;
  const greeting = firstName ? `Hi ${firstName},` : "Hi there,";

  // Fire-and-forget: send welcome email + founder alert without blocking
  Promise.all([
    sendOutboundEmail({
      to: email,
      subject: "Welcome to Stone AI — Your AI Agents Are Ready",
      body: "",
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #1a1a1a;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 40px 32px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
              Stone AI
            </h1>
            <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px;">
              Intelligence that works for you
            </p>
          </div>

          <!-- Body -->
          <div style="padding: 36px 32px;">
            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
              ${greeting}
            </p>
            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
              Welcome to Stone AI! Your account is set up and ready to go.
            </p>
            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              Here's what you can start doing right away:
            </p>

            <ul style="font-size: 15px; line-height: 1.8; margin: 0 0 24px; padding-left: 20px; color: #334155;">
              <li><strong>42+ specialized AI agents</strong> — from writing and research to code review and strategy</li>
              <li><strong>Local-first privacy</strong> — your data stays yours, always</li>
              <li><strong>SMART mode</strong> — automatically routes your request to the best agent for the job</li>
            </ul>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://stone-ai.net/app"
                 style="display: inline-block; background: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-size: 16px; font-weight: 600; letter-spacing: 0.2px;">
                Explore Your Agents
              </a>
            </div>

            <p style="font-size: 15px; line-height: 1.6; color: #475569; margin: 0;">
              If you have any questions, just reply to this email — a real human reads every message.
            </p>
          </div>

          <!-- Footer -->
          <div style="padding: 24px 32px; border-top: 1px solid #e2e8f0; text-align: center; background: #f8fafc; border-radius: 0 0 8px 8px;">
            <p style="margin: 0 0 4px; color: #64748b; font-size: 13px; font-weight: 600;">
              Stone AI
            </p>
            <p style="margin: 0; color: #94a3b8; font-size: 12px;">
              <a href="https://stone-ai.net" style="color: #3b82f6; text-decoration: none;">stone-ai.net</a>
            </p>
          </div>
        </div>
      `,
    }),
    sendFounderAlert(
      {
        agent: AlertAgent.STONE,
        priority: AlertPriority.P3,
        alertType: AlertType.SIGNUP_SURGE,
        title: "New User Signup",
        body: `New user signed up: ${email}`,
        metadata: { email, clerkId, firstName },
      },
      0 // skip cooldown — every signup should be reported
    ),
  ]).then(([emailResult, alertResult]) => {
    if (!emailResult.success) {
      console.error("[Clerk Webhook] Welcome email failed:", emailResult.error);
    }
    if (!alertResult.success) {
      console.error("[Clerk Webhook] Founder signup alert failed:", alertResult.error);
    }
  }).catch((err) => {
    console.error("[Clerk Webhook] user.created fire-and-forget error:", err);
  });

  logAuditEvent({
    event: "admin.action",
    metadata: {
      action: "clerk_user_created_welcome_sent",
      clerkId,
      email,
    },
  });
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

}
