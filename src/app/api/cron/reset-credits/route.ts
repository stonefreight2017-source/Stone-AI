import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit";

/**
 * GET /api/cron/reset-credits — monthly cron to expire unused bonus credits
 *
 * Secured by CRON_SECRET bearer token (set in Vercel env vars).
 * Scheduled via vercel.json to run on the 1st of each month at midnight UTC.
 *
 * Credits are purchased as one-time add-ons and expire at the end of the
 * billing cycle to prevent hoarding and keep revenue predictable.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await db.user.updateMany({
      where: { smartCreditsBonus: { gt: 0 } },
      data: { smartCreditsBonus: 0 },
    });

    logAuditEvent({
      event: "admin.action",
      metadata: {
        action: "monthly_credit_reset",
        usersReset: result.count,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      reset: result.count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Credit reset cron:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
