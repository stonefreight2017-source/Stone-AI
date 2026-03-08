/**
 * Internal alert endpoint for Three-Headed Monster.
 * POST /api/internal/alerts
 *
 * Secured by INTERNAL_ALERT_SECRET header.
 * Validates payload with Zod .strict(), checks cooldown, sends email.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendFounderAlert } from "@/lib/alert-system/send";
import { AlertPriority, AlertAgent, AlertType, type AlertPayload } from "@/lib/alert-system/types";

const alertSchema = z
  .object({
    agent: z.nativeEnum(AlertAgent),
    priority: z.nativeEnum(AlertPriority),
    alertType: z.nativeEnum(AlertType),
    title: z.string().min(1).max(200),
    body: z.string().min(1).max(5000),
    metadata: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
      .optional(),
  })
  .strict();

export async function POST(req: NextRequest) {
  // Auth: require internal secret
  const secret = req.headers.get("x-alert-secret");
  const expected = process.env.INTERNAL_ALERT_SECRET;

  if (!expected || secret !== expected) {
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
  const parsed = alertSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  // Send alert
  const result = await sendFounderAlert(parsed.data as AlertPayload);

  if (!result.success) {
    console.error("[alerts] Alert send failed:", result.error);
    return NextResponse.json(
      { error: "Alert delivery failed", alertId: result.alertId },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { success: true, alertId: result.alertId },
    { status: 200 }
  );
}
