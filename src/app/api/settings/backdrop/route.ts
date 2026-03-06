import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { BACKDROP_PRESETS } from "@/components/backdrops/backdrop-presets";

const VALID_IDS = new Set(BACKDROP_PRESETS.map((p) => p.id));

// GET /api/settings/backdrop — read current backdrop theme
export async function GET() {
  try {
    const user = await getOrCreateUser();
    return NextResponse.json({ backdropTheme: user.backdropTheme });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/settings/backdrop — update backdrop theme
export async function PUT(req: NextRequest) {
  try {
    const user = await getOrCreateUser();
    const body = await req.json();
    const { backdropTheme } = body;

    if (typeof backdropTheme !== "string" || !VALID_IDS.has(backdropTheme)) {
      return NextResponse.json(
        { error: "Invalid backdrop theme" },
        { status: 400 }
      );
    }

    await db.user.update({
      where: { id: user.id },
      data: { backdropTheme },
    });

    return NextResponse.json({ backdropTheme });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("PUT /api/settings/backdrop:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
