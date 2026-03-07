/**
 * ═══ BESTIE CRUD — SCALING & SECURITY ═══
 * - Bestie limit enforced per tier (see MAX_BESTIES).
 *   Source of truth: TierPerks.maxBesties in tier-config.ts.
 * - Soft-delete on DELETE (isActive=false). Conversations archived.
 *   No hard delete — preserves data for potential reactivation.
 * - Unique constraint on (userId, name) prevents duplicate names.
 * - Rate limited via checkRateLimit (same as all other routes).
 *
 * EXPLOIT PREVENTION:
 * - All endpoints verify user ownership via userId from Clerk auth.
 * - Name regex: only [a-zA-Z0-9 _-] to prevent XSS via bestie names.
 * - Personality JSON validated via Zod (exact enum values only).
 * - avatarEmoji limited to 4 chars max (prevents emoji-bomb payloads).
 */
import { NextRequest } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createBestieSchema, updateBestieSchema } from "@/lib/bestie-validators";
import { checkRateLimit } from "@/lib/rate-limiter";
import { getTierConfig, getMaxBesties } from "@/lib/tier-config";
import type { Tier } from "@/lib/tier-config";
import { checkEasterEgg, checkBirthdayEgg, getZodiacEggBadge } from "@/lib/easter-eggs";

// GET — List user's besties
export async function GET() {
  try {
    const user = await getOrCreateUser();
    if (user.banned) {
      return Response.json({ error: "Account suspended" }, { status: 403 });
    }

    const besties = await db.bestieProfile.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { conversations: true } },
      },
    });

    return Response.json({
      besties: besties.map((b) => ({
        id: b.id,
        name: b.name,
        personality: b.personality,
        avatarEmoji: b.avatarEmoji,
        conversationCount: b._count.conversations,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      })),
      maxBesties: getMaxBesties(user.tier as Tier),
      tier: user.tier,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/bestie:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST — Create a new bestie
export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateUser();
    if (user.banned) {
      return Response.json({ error: "Account suspended" }, { status: 403 });
    }

    const tier = user.tier as Tier;
    const tierConfig = getTierConfig(tier);

    // Rate limit
    const rateCheck = checkRateLimit(user.id, tierConfig.limits.requestsPerMinute);
    if (!rateCheck.allowed) {
      return Response.json(
        { error: "Too many requests", retryAfterMs: rateCheck.retryAfterMs },
        { status: 429 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = createBestieSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, traits, styles, expertise, avatarEmoji, language, aboutMe, purposes, bgTheme, voicePrefs, safetyNet, autoText } = parsed.data;

    // Check bestie limit
    const activeCount = await db.bestieProfile.count({
      where: { userId: user.id, isActive: true },
    });

    const maxBesties = getMaxBesties(tier);
    if (activeCount >= maxBesties) {
      return Response.json(
        {
          error: `You can have up to ${maxBesties} bestie${maxBesties === 1 ? "" : "s"} on the ${tier} tier. Upgrade to create more!`,
          code: "BESTIE_LIMIT",
          currentCount: activeCount,
          maxBesties,
          tier,
        },
        { status: 403 }
      );
    }

    // Check for duplicate name
    const existing = await db.bestieProfile.findUnique({
      where: { userId_name: { userId: user.id, name } },
    });
    if (existing && existing.isActive) {
      return Response.json(
        { error: `You already have a bestie named "${name}"` },
        { status: 409 }
      );
    }

    // Create or reactivate
    const personalityData = { traits, styles, expertise, language: language || "en", purposes, bgTheme, voicePrefs, safetyNet, autoText };
    const bestie = existing
      ? await db.bestieProfile.update({
          where: { id: existing.id },
          data: {
            personality: personalityData,
            avatarEmoji,
            isActive: true,
          },
        })
      : await db.bestieProfile.create({
          data: {
            userId: user.id,
            name,
            personality: personalityData,
            avatarEmoji,
          },
        });

    // Save "About Me" as bestie memories so the bestie knows the user
    if (aboutMe) {
      const memoryEntries: { key: string; value: string }[] = [];
      if (aboutMe.name) memoryEntries.push({ key: "user_name", value: aboutMe.name });
      if (aboutMe.birthday) memoryEntries.push({ key: "user_birthday", value: aboutMe.birthday });
      if (aboutMe.siblings) memoryEntries.push({ key: "user_siblings", value: aboutMe.siblings });
      if (aboutMe.location) memoryEntries.push({ key: "user_location", value: aboutMe.location });
      if (aboutMe.favorites) memoryEntries.push({ key: "user_favorites", value: aboutMe.favorites });
      if (aboutMe.other) memoryEntries.push({ key: "user_other", value: aboutMe.other });

      if (memoryEntries.length > 0) {
        await db.bestieMemory.createMany({
          data: memoryEntries.map((m) => ({
            bestieId: bestie.id,
            userId: user.id,
            key: m.key,
            value: m.value,
          })),
          skipDuplicates: true,
        });
      }
    }

    // Server-side Easter egg check — one-time per user (tracked on User model, survives bestie deletion)
    let easterEgg: { reward: string; message: string; discountPercent?: number; badge?: { color: string; colorName: string; sign: string } } | null = null;
    const now = new Date();
    const zodiacBadge = getZodiacEggBadge(now);

    // 1. Combo Easter eggs (purpose + background)
    if (purposes.length > 0) {
      const egg = checkEasterEgg(purposes, bgTheme);
      if (egg) {
        const claimKey = `easter_egg_${egg.reward}`;
        const claims = user.easterEggClaims ?? [];
        const alreadyClaimed = claims.includes(claimKey);
        if (!alreadyClaimed) {
          // Record claim on User model (permanent, survives bestie deletion)
          await db.user.update({
            where: { id: user.id },
            data: { easterEggClaims: { push: claimKey } },
          });
          // Also store in bestie memory for the bestie to reference
          await db.bestieMemory.create({
            data: {
              bestieId: bestie.id,
              userId: user.id,
              key: claimKey,
              value: JSON.stringify({
                credits: egg.credits,
                claimedAt: now.toISOString(),
                badge: zodiacBadge,
              }),
            },
          });
          easterEgg = {
            reward: egg.reward,
            message: egg.message,
            badge: { color: zodiacBadge.color, colorName: zodiacBadge.colorName, sign: zodiacBadge.sign },
          };
        }
      }
    }

    // 2. Birthday Easter egg (checked from About Me birthday field)
    if (!easterEgg && aboutMe?.birthday) {
      const bdayEgg = checkBirthdayEgg(aboutMe.birthday);
      if (bdayEgg) {
        const bdayKey = `easter_egg_bday_${bdayEgg.type}`;
        const bdayClaims = user.easterEggClaims ?? [];
        const alreadyClaimed = bdayClaims.includes(bdayKey);
        if (!alreadyClaimed) {
          // Record claim on User model (permanent, survives bestie deletion)
          await db.user.update({
            where: { id: user.id },
            data: { easterEggClaims: { push: bdayKey } },
          });
          // Also store in bestie memory for the bestie to reference
          await db.bestieMemory.create({
            data: {
              bestieId: bestie.id,
              userId: user.id,
              key: bdayKey,
              value: JSON.stringify({
                discountPercent: bdayEgg.discountPercent,
                claimedAt: now.toISOString(),
                used: false,
                badge: zodiacBadge,
              }),
            },
          });
          easterEgg = {
            reward: bdayEgg.reward,
            message: bdayEgg.message,
            discountPercent: bdayEgg.discountPercent,
            badge: { color: zodiacBadge.color, colorName: zodiacBadge.colorName, sign: zodiacBadge.sign },
          };
        }
      }
    }

    return Response.json({ bestie, easterEgg }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/bestie:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PATCH — Update a bestie
export async function PATCH(req: NextRequest) {
  try {
    const user = await getOrCreateUser();
    if (user.banned) {
      return Response.json({ error: "Account suspended" }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { id, ...updates } = body as { id?: string; [key: string]: unknown };
    if (!id || typeof id !== "string") {
      return Response.json({ error: "Missing bestie id" }, { status: 400 });
    }

    const parsed = updateBestieSchema.safeParse(updates);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const bestie = await db.bestieProfile.findFirst({
      where: { id, userId: user.id, isActive: true },
    });
    if (!bestie) {
      return Response.json({ error: "Bestie not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.name) data.name = parsed.data.name;
    if (parsed.data.avatarEmoji) data.avatarEmoji = parsed.data.avatarEmoji;

    // Merge personality fields
    if (parsed.data.traits || parsed.data.styles || parsed.data.expertise) {
      const current = bestie.personality as { traits: string[]; styles: string[]; expertise: string[] };
      data.personality = {
        traits: parsed.data.traits ?? current.traits,
        styles: parsed.data.styles ?? current.styles,
        expertise: parsed.data.expertise ?? current.expertise,
      };
    }

    const updated = await db.bestieProfile.update({
      where: { id: bestie.id },
      data,
    });

    return Response.json({ bestie: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("PATCH /api/bestie:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE — Soft-delete a bestie
export async function DELETE(req: NextRequest) {
  try {
    const user = await getOrCreateUser();
    if (user.banned) {
      return Response.json({ error: "Account suspended" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return Response.json({ error: "Missing bestie id" }, { status: 400 });
    }

    const bestie = await db.bestieProfile.findFirst({
      where: { id, userId: user.id, isActive: true },
    });
    if (!bestie) {
      return Response.json({ error: "Bestie not found" }, { status: 404 });
    }

    // Soft-delete: deactivate and archive conversations
    await db.$transaction([
      db.bestieProfile.update({
        where: { id },
        data: { isActive: false },
      }),
      db.conversation.updateMany({
        where: { bestieId: id },
        data: { archived: true },
      }),
    ]);

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("DELETE /api/bestie:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
