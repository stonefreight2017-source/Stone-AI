/**
 * POST /api/bestie/avatar — Upload & moderate a custom avatar image.
 *
 * Flow:
 * 1. Accept image (max 5MB)
 * 2. Resize to 128x128 via sharp (built into Next.js)
 * 3. Run through OpenAI Vision moderation — strict US social media standards
 * 4. Return base64 data URI if approved, error if rejected
 *
 * Content policy: No nudity, violence, drugs, smoking, alcohol, weapons,
 * hate symbols, explicit gestures, gore, self-harm imagery, or anything
 * that would violate YouTube/Instagram/TikTok community guidelines.
 */
import { NextRequest } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limiter";
import { getTierConfig } from "@/lib/tier-config";
import type { Tier } from "@/lib/tier-config";
import sharp from "sharp";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const AVATAR_SIZE = 128;

// Strict moderation prompt — covers all US social media standards
// This avatar is private (only the user sees their bestie), so moderation is
// slightly more lenient than public-facing community profiles. However, it still
// must comply with US law and platform standards (no CSAM, no illegal content).
const MODERATION_PROMPT = `You are a content moderator for an AI platform. This image will be used as a private AI companion avatar (only the owner sees it). Determine if it meets US legal standards for digital content.

REJECT the image if it contains ANY of the following:
- Full nudity or sexually explicit content
- Child exploitation or minors in inappropriate contexts
- Graphic violence, gore, or torture
- Drugs, drug use, smoking, vaping, cigarettes, or drug paraphernalia
- Hate symbols, racist imagery, swastikas, extremist content
- Explicit offensive gestures (middle finger, etc.)
- Self-harm or suicide imagery
- Graphic slurs or hate speech text
- Terrorist or extremist propaganda
- Illegal activity being committed

APPROVE the image if it is:
- A person (face, portrait, selfie, casual or professional)
- People in normal social settings
- An animal, pet, nature scene, landscape
- Art, illustration, cartoon, anime character
- Objects, food, vehicles, architecture, scenery
- Abstract or geometric designs
- Memes or pop culture references (non-hateful)
- Swimwear in normal beach/pool context (non-sexual)

Respond with ONLY one word: APPROVED or REJECTED
If rejected, add a brief reason on the next line.`;

export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateUser();
    if (user.banned) {
      return Response.json({ error: "Account suspended" }, { status: 403 });
    }

    const tier = user.tier as Tier;
    const tierConfig = getTierConfig(tier);
    const rateCheck = checkRateLimit(`avatar_${user.id}`, Math.min(tierConfig.limits.requestsPerMinute, 5));
    if (!rateCheck.allowed) {
      return Response.json({ error: "Too many uploads. Try again shortly." }, { status: 429 });
    }

    const formData = await req.formData();
    const file = formData.get("avatar") as File | null;
    if (!file) {
      return Response.json({ error: "No image provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ error: "Only JPEG, PNG, WebP, and GIF images are allowed" }, { status: 400 });
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      return Response.json({ error: "Image must be under 5MB" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Resize to avatar size using sharp
    const resized = await sharp(buffer)
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover", position: "center" })
      .jpeg({ quality: 85 })
      .toBuffer();

    const base64 = resized.toString("base64");
    const dataUri = `data:image/jpeg;base64,${base64}`;

    // Content moderation via OpenAI Vision
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      // If no API key, reject custom uploads as a safety measure
      return Response.json({ error: "Image moderation unavailable. Try an emoji avatar instead." }, { status: 503 });
    }

    const moderationRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 50,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: MODERATION_PROMPT },
              { type: "image_url", image_url: { url: dataUri, detail: "low" } },
            ],
          },
        ],
      }),
    });

    if (!moderationRes.ok) {
      console.error("Avatar moderation API error:", moderationRes.status);
      return Response.json({ error: "Unable to verify image safety. Please try again." }, { status: 503 });
    }

    const moderationData = await moderationRes.json();
    const verdict = (moderationData.choices?.[0]?.message?.content ?? "").trim();

    if (!verdict.toUpperCase().startsWith("APPROVED")) {
      const reason = verdict.split("\n").slice(1).join(" ").trim() || "Image does not meet our community guidelines.";
      return Response.json(
        { error: `Image rejected: ${reason}`, code: "MODERATION_REJECTED" },
        { status: 422 }
      );
    }

    // Approved — return the data URI
    return Response.json({ avatarDataUri: dataUri }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/bestie/avatar:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
