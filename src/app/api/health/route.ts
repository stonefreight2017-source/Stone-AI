import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
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
