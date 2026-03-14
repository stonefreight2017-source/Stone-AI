/**
 * Web Search API Route — POST /api/search
 *
 * Accepts a search query and returns web search results.
 * Used by the chat system to inject real-time web context into agent responses.
 *
 * Auth: Requires either a Clerk session or a valid API key (Bearer token).
 * Rate limiting: Enforced per tier via webSearchesPerDay in tier-config.ts.
 *
 * Request body:
 *   { query: string, userId?: string }
 *
 * Response:
 *   {
 *     results: SearchResult[],
 *     provider: "serper" | "brave" | "none",
 *     query: string,
 *     cached: boolean,
 *     usage: { used: number, limit: number, remaining: number }
 *   }
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { authenticateApiKey } from "@/lib/api-keys";
import { checkRateLimitAsync } from "@/lib/rate-limiter";
import { getTierConfig } from "@/lib/tier-config";
import type { Tier } from "@/lib/tier-config";
import {
  searchWeb,
  checkSearchQuota,
  incrementSearchUsage,
  getSearchUsage,
} from "@/lib/web-search";

// ═══════════════════════════════════════════════════════════
// Input validation
// ═══════════════════════════════════════════════════════════

const searchRequestSchema = z.object({
  query: z
    .string()
    .min(1, "Query cannot be empty")
    .max(500, "Query is too long (max 500 characters)")
    .refine((val) => val.trim().length > 0, "Query cannot be only whitespace"),
  numResults: z.number().int().min(1).max(10).optional(),
}).strict();

// ═══════════════════════════════════════════════════════════
// Route handler
// ═══════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate — try Clerk session first, then API key
    let dbUser: { id: string; tier: string } | null = null;

    const { userId: clerkUserId } = await auth();
    if (clerkUserId) {
      const user = await db.user.findUnique({
        where: { clerkId: clerkUserId },
        select: { id: true, tier: true, banned: true },
      });
      if (user?.banned) {
        return Response.json({ error: "Account suspended" }, { status: 403 });
      }
      if (user) {
        dbUser = user;
      }
    }

    // Try API key auth if no Clerk session
    if (!dbUser) {
      const authHeader = req.headers.get("authorization");
      const apiKeyUser = await authenticateApiKey(authHeader);
      if (apiKeyUser) {
        dbUser = { id: apiKeyUser.id, tier: apiKeyUser.tier };
      }
    }

    if (!dbUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tier = dbUser.tier as Tier;
    const tierConfig = getTierConfig(tier);

    // 2. Check if web search is enabled for this tier
    if (tierConfig.perks.webSearchesPerDay <= 0) {
      return Response.json(
        {
          error: "Web search is not available on your current plan",
          code: "FEATURE_NOT_AVAILABLE",
          currentTier: tier,
        },
        { status: 403 }
      );
    }

    // 3. Parse & validate input
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = searchRequestSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        {
          error: "Invalid input",
          details: parsed.error.issues.map((i) => i.message),
        },
        { status: 400 }
      );
    }

    const { query, numResults } = parsed.data;

    // 4. Rate limit (per-minute, shared with chat)
    const rateCheck = await checkRateLimitAsync(
      `search:${dbUser.id}`,
      tierConfig.limits.requestsPerMinute
    );
    if (!rateCheck.allowed) {
      return Response.json(
        {
          error: "Too many requests. Please slow down.",
          code: "RATE_LIMITED",
          retryAfterMs: rateCheck.retryAfterMs,
        },
        { status: 429 }
      );
    }

    // 5. Check daily search quota
    const quotaAllowed = await checkSearchQuota(dbUser.id, tier);
    if (!quotaAllowed) {
      const usage = await getSearchUsage(dbUser.id, tier);
      return Response.json(
        {
          error: `You've reached your daily web search limit (${usage.limit}/day)`,
          code: "SEARCH_QUOTA_EXCEEDED",
          usage,
        },
        { status: 429 }
      );
    }

    // 6. Execute search
    const searchResponse = await searchWeb(query, numResults);

    // 7. Increment usage (only if we actually hit an API — skip for cached results)
    if (!searchResponse.cached && searchResponse.results.length > 0) {
      await incrementSearchUsage(dbUser.id);
    }

    // 8. Get updated usage stats
    const usage = await getSearchUsage(dbUser.id, tier);

    // 9. Return results
    return Response.json({
      results: searchResponse.results,
      provider: searchResponse.provider,
      query: searchResponse.query,
      cached: searchResponse.cached,
      usage,
    });
  } catch (error) {
    console.error("POST /api/search:", error instanceof Error ? error.message : "Unknown error");
    return Response.json(
      { error: "Search service unavailable", code: "SERVICE_UNAVAILABLE" },
      { status: 500 }
    );
  }
}
