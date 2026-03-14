import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { getUserUsage } from "@/lib/usage-dashboard";
import type { Tier } from "@/lib/tier-config";

// GET /api/usage/dashboard — full usage dashboard for authenticated user
export async function GET() {
  try {
    const user = await getOrCreateUser();
    const dashboard = await getUserUsage(user.id, user.tier as Tier);
    return NextResponse.json({ dashboard });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to load usage dashboard" },
      { status: 500 }
    );
  }
}
