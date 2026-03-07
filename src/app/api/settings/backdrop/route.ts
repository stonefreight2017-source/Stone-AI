import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { BACKDROP_PRESETS } from "@/components/backdrops/backdrop-presets";
import { BACKDROP_POOL } from "@/components/backdrops/backdrop-pool";

const backdropSchema = z.object({
  backdropTheme: z.string().optional(),
  nameKey: z.string().optional(),
}).strict();

const VALID_IDS = new Set(BACKDROP_PRESETS.map((p) => p.id));
const POOL_IDS = new Set(BACKDROP_POOL.map((p) => p.id));

// Validate a nameKey: 1-8 lowercase letters only, or empty string
function isValidNameKey(key: string): boolean {
  return key === "" || /^[a-z]{1,8}$/.test(key);
}

// GET /api/settings/backdrop — read current backdrop theme + nameKey
export async function GET() {
  try {
    const user = await getOrCreateUser();
    return NextResponse.json({
      backdropTheme: user.backdropTheme,
      nameKey: user.nameKey,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/settings/backdrop — update backdrop theme and/or nameKey
export async function PUT(req: NextRequest) {
  try {
    const user = await getOrCreateUser();
    const body = await req.json().catch(() => null);
    const parsed = backdropSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { backdropTheme, nameKey } = parsed.data;

    const updateData: Record<string, string> = {};

    // Validate and set backdropTheme if provided
    if (backdropTheme !== undefined) {
      // Allow preset IDs and also pool backdrop IDs (pool-xxx format)
      if (!VALID_IDS.has(backdropTheme) && !POOL_IDS.has(backdropTheme)) {
        return NextResponse.json(
          { error: "Invalid backdrop theme" },
          { status: 400 }
        );
      }
      updateData.backdropTheme = backdropTheme;
    }

    // Validate and set nameKey if provided
    if (nameKey !== undefined) {
      const normalized = typeof nameKey === "string" ? nameKey.toLowerCase().replace(/[^a-z]/g, "").slice(0, 8) : "";
      if (!isValidNameKey(normalized)) {
        return NextResponse.json(
          { error: "Invalid name key" },
          { status: 400 }
        );
      }
      updateData.nameKey = normalized;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    await db.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return NextResponse.json(updateData);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("PUT /api/settings/backdrop:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
