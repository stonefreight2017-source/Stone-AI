/**
 * Contextual signal collection for ad targeting.
 * Collects anonymized interest segments — NO PII is ever sent to ad partners.
 *
 * Signals are derived from:
 * - Agent categories the user interacts with
 * - Conversation topics (category-level, not content)
 * - Session duration and engagement patterns
 * - Tier and subscription status (for segment targeting)
 *
 * Stored as interest segments on the User model (future: separate table).
 * Used to select contextual ad categories only.
 *
 * COMPETITOR BLOCKING STRATEGY:
 * When AdSense is configured, use Google AdSense > Blocking Controls to:
 * 1. Block competitor domains (other AI chat services)
 * 2. Block categories: "AI & Machine Learning Software", "Chat Software"
 * 3. Any competitor that wants to advertise must go through direct deals
 *    at premium rates (5-10x standard CPM) — they're paying to poach users
 *
 * Direct competitor ad deals are negotiated separately at premium pricing.
 * This is standard industry practice (Google blocks Bing ads, etc.)
 */

import { db } from "./db";

// Interest categories mapped from agent categories + usage
export const INTEREST_SEGMENTS = [
  "business",
  "marketing",
  "finance",
  "technology",
  "education",
  "content-creation",
  "entrepreneurship",
  "productivity",
  "analytics",
  "legal",
] as const;

export type InterestSegment = (typeof INTEREST_SEGMENTS)[number];

// Map agent categories to interest segments
const CATEGORY_TO_SEGMENT: Record<string, InterestSegment[]> = {
  BUSINESS: ["business", "entrepreneurship", "productivity"],
  CONTENT: ["content-creation", "marketing"],
  MARKETING: ["marketing", "analytics"],
  EDUCATION: ["education", "technology"],
  TECHNICAL: ["technology", "analytics"],
  FINANCE: ["finance", "business"],
};

/**
 * Derive interest segments from a user's conversation history.
 * Returns anonymized categories only — no content, no PII.
 */
export async function deriveUserSegments(userId: string): Promise<InterestSegment[]> {
  try {
    // Get agent categories the user has interacted with
    const conversations = await db.conversation.findMany({
      where: { userId },
      select: {
        agent: {
          select: { category: true },
        },
      },
      take: 50,
      orderBy: { updatedAt: "desc" },
    });

    const segmentCounts = new Map<InterestSegment, number>();

    for (const conv of conversations) {
      if (conv.agent?.category) {
        const segments = CATEGORY_TO_SEGMENT[conv.agent.category] ?? [];
        for (const seg of segments) {
          segmentCounts.set(seg, (segmentCounts.get(seg) ?? 0) + 1);
        }
      }
    }

    // Return top 5 segments sorted by frequency
    return [...segmentCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([seg]) => seg);
  } catch {
    return ["business", "technology"]; // Safe defaults
  }
}

// Ads don't appear until the user has sent this many total messages.
// Creates a seamless initial experience — ads phase in gradually.
const AD_ACTIVATION_THRESHOLD = 15; // ~5-10 conversations worth

/**
 * Get ad configuration for a user's tier.
 * Paid tiers = no ads. Free tier = ads after activation threshold.
 */
export async function getAdConfig(
  tier: string,
  userId: string
): Promise<{
  showAds: boolean;
  adSlots: string[];
  adDensity: "none" | "light" | "standard";
}> {
  // Paid tiers = always ad-free
  if (tier !== "FREE" && tier !== "STARTER") {
    return { showAds: false, adSlots: [], adDensity: "none" };
  }

  // Check if user has crossed the activation threshold
  const totalMessages = await db.message.count({
    where: {
      conversation: { userId },
      role: "USER",
    },
  });

  if (totalMessages < AD_ACTIVATION_THRESHOLD) {
    return { showAds: false, adSlots: [], adDensity: "none" };
  }

  if (tier === "STARTER") {
    return {
      showAds: true,
      adSlots: ["sidebar"],
      adDensity: "light",
    };
  }

  // FREE tier with enough usage
  return {
    showAds: true,
    adSlots: ["sidebar", "chat-idle", "between-conversations"],
    adDensity: "standard",
  };
}
