import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { getAdConfig, deriveUserSegments } from "@/lib/ad-signals";
import { checkRateLimit } from "@/lib/rate-limiter";

// GET /api/ads — get ad configuration and segments for current user
export async function GET() {
  try {
    const user = await getOrCreateUser();

    // Rate limit: 30 requests per minute
    const rateCheck = checkRateLimit(`ads:${user.id}`, 30);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const config = await getAdConfig(user.tier, user.id);

    if (!config.showAds) {
      return NextResponse.json({
        showAds: false,
        adSlots: [],
        segments: [],
        adDensity: "none",
      });
    }

    // Derive interest segments for contextual targeting
    const segments = await deriveUserSegments(user.id);

    return NextResponse.json({
      showAds: true,
      adSlots: config.adSlots,
      adDensity: config.adDensity,
      segments,
      // AdSense publisher ID placeholder — set when account is approved
      publisherId: process.env.ADSENSE_PUBLISHER_ID ?? null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
