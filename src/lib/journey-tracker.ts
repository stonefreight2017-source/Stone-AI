import { db } from "@/lib/db";

export async function trackEvent(
  userId: string,
  agentSlug: string,
  action: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await db.userJourney.create({
      data: {
        userId,
        agentSlug,
        action,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      },
    });
  } catch {
    // Fire-and-forget
  }
}

const SEQUENCES: [string, string][] = [
  ["business-strategist", "financial-advisor"],
  ["financial-advisor", "tax-strategist"],
  ["market-analyst", "business-strategist"],
  ["content-studio", "social-media-manager"],
  ["social-media-manager", "email-marketing-specialist"],
  ["hr-consultant", "legal-advisor"],
  ["product-development", "project-management-coach"],
  ["pitch-deck-specialist", "financial-advisor"],
  ["seo-specialist", "content-studio"],
  ["real-estate-advisor", "financial-advisor"],
];

export async function getJourneyRecommendations(
  userId: string
): Promise<string[]> {
  try {
    const events = await db.userJourney.findMany({
      where: { userId },
      select: { agentSlug: true },
      distinct: ["agentSlug"],
    });

    const visited = new Set(events.map((e) => e.agentSlug));
    const recommendations: string[] = [];

    for (const [from, to] of SEQUENCES) {
      if (visited.has(from) && !visited.has(to)) {
        if (!recommendations.includes(to)) {
          recommendations.push(to);
        }
      }
      if (recommendations.length >= 3) break;
    }

    return recommendations;
  } catch {
    return [];
  }
}
