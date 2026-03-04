import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateApiKey } from "@/lib/api-keys";
import { checkRateLimit } from "@/lib/rate-limiter";
import { logAuditEvent } from "@/lib/audit";
import type { Tier } from "@/lib/tier-config";

const createKeySchema = z.object({
  name: z.string().min(1).max(100).default("Default"),
});

// GET /api/user/api-keys — list user's API keys
export async function GET() {
  try {
    const user = await getOrCreateUser();

    // Only Pro tier can use API keys
    if ((user.tier as Tier) !== "PRO") {
      return NextResponse.json(
        { error: "API access requires Pro tier" },
        { status: 403 }
      );
    }

    const keys = await db.apiKey.findMany({
      where: { userId: user.id, revokedAt: null },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ keys });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/user/api-keys — create a new API key
export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateUser();

    if ((user.tier as Tier) !== "PRO") {
      return NextResponse.json(
        { error: "API access requires Pro tier" },
        { status: 403 }
      );
    }

    // Rate limit: 10 key creations per minute
    const rateCheck = checkRateLimit(`apikey:${user.id}`, 10);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Slow down." },
        { status: 429 }
      );
    }

    // Limit to 5 active keys
    const activeKeys = await db.apiKey.count({
      where: { userId: user.id, revokedAt: null },
    });
    if (activeKeys >= 5) {
      return NextResponse.json(
        { error: "Maximum 5 active API keys allowed" },
        { status: 400 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const parsed = createKeySchema.safeParse(body);
    const name = parsed.success ? parsed.data.name : "Default";

    const { raw, hash, prefix } = generateApiKey();

    await db.apiKey.create({
      data: {
        userId: user.id,
        name,
        keyHash: hash,
        keyPrefix: prefix,
      },
    });

    logAuditEvent({
      event: "api_key.created",
      userId: user.id,
      metadata: { keyPrefix: prefix },
    });

    // Return the raw key ONCE — it's never stored or shown again
    return NextResponse.json(
      {
        key: raw,
        prefix,
        name,
        warning: "Save this key now. It will not be shown again.",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
