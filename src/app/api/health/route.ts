import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimitAsync } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/security";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const { allowed } = await checkRateLimitAsync(`health:${ip}`, 60);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let dbOk = false;

  try {
    await db.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  // Public health check: only expose overall status, not infrastructure details
  return NextResponse.json({
    status: dbOk ? "ok" : "degraded",
  });
}
