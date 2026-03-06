/**
 * POST /api/bestie/avatar/generate — Generate an anime avatar from personality config.
 *
 * Flow:
 * 1. Accept bestieId (must belong to authenticated user)
 * 2. Read personality config from the BestieProfile
 * 3. Map traits/style/expertise/path to visual attributes
 * 4. Generate anime avatar via DALL-E 3
 * 5. Download the image, resize to 512x512 via sharp
 * 6. Store as base64 data URI in avatarEmoji field
 * 7. Return the data URI
 *
 * Rate limited to 3/min per user (image generation is expensive).
 */
import { NextRequest } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limiter";
import { getTierConfig } from "@/lib/tier-config";
import type { Tier } from "@/lib/tier-config";
import { generateAvatarPrompt } from "@/lib/bestie-avatar-gen";
import type { BestieTrait, BestieStyle, BestieExpertise, BestiePath } from "@/lib/bestie-validators";
import sharp from "sharp";

const AVATAR_SIZE = 512; // Higher res for crisp display on all devices

export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateUser();
    if (user.banned) {
      return Response.json({ error: "Account suspended" }, { status: 403 });
    }

    const tier = user.tier as Tier;
    const tierConfig = getTierConfig(tier);

    // Stricter rate limit for image generation
    const rateCheck = checkRateLimit(`avatar_gen_${user.id}`, Math.min(tierConfig.limits.requestsPerMinute, 3));
    if (!rateCheck.allowed) {
      return Response.json({ error: "Too many generation requests. Try again shortly." }, { status: 429 });
    }

    let body: { bestieId?: string };
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { bestieId } = body;
    if (!bestieId || typeof bestieId !== "string") {
      return Response.json({ error: "Missing bestieId" }, { status: 400 });
    }

    // Verify ownership
    const bestie = await db.bestieProfile.findFirst({
      where: { id: bestieId, userId: user.id, isActive: true },
    });
    if (!bestie) {
      return Response.json({ error: "Bestie not found" }, { status: 404 });
    }

    const personality = bestie.personality as {
      traits?: BestieTrait[];
      styles?: BestieStyle[];
      expertise?: BestieExpertise[];
      path?: BestiePath;
      purposes?: string[];
    };

    // Build the DALL-E prompt from personality
    const { prompt, attributes } = generateAvatarPrompt({
      traits: personality.traits || [],
      style: personality.styles?.[0],
      expertise: personality.expertise || [],
      path: personality.path,
      purposes: personality.purposes,
    });

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return Response.json(
        { error: "Avatar generation unavailable. Try uploading a photo instead." },
        { status: 503 }
      );
    }

    // Generate image via DALL-E 3
    const dalleRes = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "url",
      }),
    });

    if (!dalleRes.ok) {
      const errBody = await dalleRes.text();
      console.error("DALL-E API error:", dalleRes.status, errBody);
      return Response.json(
        { error: "Avatar generation failed. Please try again." },
        { status: 503 }
      );
    }

    const dalleData = await dalleRes.json();
    const imageUrl = dalleData.data?.[0]?.url;
    if (!imageUrl) {
      console.error("DALL-E returned no image URL:", dalleData);
      return Response.json({ error: "No image generated. Please try again." }, { status: 503 });
    }

    // Download the generated image
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      return Response.json({ error: "Failed to download generated image." }, { status: 503 });
    }
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());

    // Resize to avatar size for efficient storage and display
    const resized = await sharp(imgBuffer)
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover", position: "center" })
      .png({ quality: 90 })
      .toBuffer();

    const base64 = resized.toString("base64");
    const dataUri = `data:image/png;base64,${base64}`;

    // Save to the bestie profile
    await db.bestieProfile.update({
      where: { id: bestieId },
      data: { avatarEmoji: dataUri },
    });

    // Also store the visual attributes in personality for potential regeneration
    const updatedPersonality = {
      ...personality,
      generatedAvatarAttributes: attributes,
    };
    await db.bestieProfile.update({
      where: { id: bestieId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { personality: updatedPersonality as any },
    });

    return Response.json({
      avatarDataUri: dataUri,
      attributes,
    }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/bestie/avatar/generate:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
