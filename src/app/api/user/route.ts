import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { getTierConfig } from "@/lib/tier-config";
import type { Tier } from "@/lib/tier-config";

// GET /api/user — get current user info + tier details
export async function GET() {
  try {
    const user = await getOrCreateUser();
    const tierConfig = getTierConfig(user.tier as Tier);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        tierName: tierConfig.name,
        limits: tierConfig.limits,
        allowedModes: tierConfig.allowedModes,
        canExport: tierConfig.perks.conversationExport,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/user:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
