import { NextResponse } from "next/server";

export async function GET() {
  const checks: Record<string, unknown> = {};

  // 1. Check DATABASE_URL exists
  checks.hasDbUrl = !!process.env.DATABASE_URL;
  checks.dbUrlPrefix = process.env.DATABASE_URL?.substring(0, 30) + "...";

  // 2. Check Clerk keys
  checks.hasClerkPublishable = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  checks.hasClerkSecret = !!process.env.CLERK_SECRET_KEY;

  // 3. Try DB connection
  try {
    const { db } = await import("@/lib/db");
    const result = await db.$queryRaw`SELECT 1 as ok`;
    checks.dbConnection = "OK";
    checks.dbResult = result;
  } catch (e) {
    checks.dbConnection = "FAILED";
    checks.dbError = e instanceof Error ? e.message : String(e);
    checks.dbStack = e instanceof Error ? e.stack?.split("\n").slice(0, 5) : undefined;
  }

  // 4. Try Clerk auth import
  try {
    const { auth } = await import("@clerk/nextjs/server");
    const session = await auth();
    checks.clerkAuth = "OK";
    checks.clerkUserId = session.userId || "none (not signed in)";
  } catch (e) {
    checks.clerkAuth = "FAILED";
    checks.clerkError = e instanceof Error ? e.message : String(e);
  }

  // 5. Try getOrCreateUser (the actual thing that runs in app layout)
  try {
    const { getOrCreateUser } = await import("@/lib/auth");
    const user = await getOrCreateUser();
    checks.getOrCreateUser = "OK";
    checks.userTier = user.tier;
  } catch (e) {
    checks.getOrCreateUser = "FAILED";
    checks.authError = e instanceof Error ? e.message : String(e);
    checks.authStack = e instanceof Error ? e.stack?.split("\n").slice(0, 5) : undefined;
  }

  return NextResponse.json(checks, { status: 200 });
}
