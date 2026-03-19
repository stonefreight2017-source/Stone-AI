/**
 * Internal outbound email endpoint for Stone AI.
 * POST /api/internal/outbound-email
 *
 * Secured by INTERNAL_ALERT_SECRET header.
 * Validates payload with Zod .strict(), sends email to any external recipient.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendOutboundEmail } from "@/lib/alert-system/outbound";

const outboundSchema = z
  .object({
    to: z.string().email().min(1).max(320),
    subject: z.string().min(1).max(200),
    body: z.string().min(1).max(10000),
    html: z.string().max(50000).optional(),
    replyTo: z.string().email().optional(),
    fromName: z.string().max(100).optional(),
  })
  .strict();

function authorize(req: NextRequest): boolean {
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

export async function POST(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse body
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate with Zod .strict()
  const parsed = outboundSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  // Send email
  const result = await sendOutboundEmail(parsed.data);

  if (!result.success) {
    console.error("[outbound-email] Send failed:", result.error);
    return NextResponse.json(
      { error: "Email delivery failed", details: result.error },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { success: true, messageId: result.messageId },
    { status: 200 }
  );
}
