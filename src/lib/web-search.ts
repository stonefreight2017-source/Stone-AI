/**
 * Web Search Module — Stone AI
 *
 * Provides web search capabilities for agents via external search APIs.
 * Supports Serper (primary), Brave Search (fallback), and DuckDuckGo (emergency fallback) providers.
 *
 * Usage:
 *   import { searchWeb, formatSearchResults, checkSearchQuota } from "@/lib/web-search";
 *
 *   // Check quota before searching
 *   const allowed = await checkSearchQuota(userId, tier);
 *   if (allowed) {
 *     const results = await searchWeb("latest AI news", 5);
 *     const context = formatSearchResults(results);
 *     // Inject `context` into the system prompt before LLM call
 *   }
 *
 * Environment variables:
 *   SERPER_API_KEY       — Google Serper API key (primary)
 *   BRAVE_SEARCH_API_KEY — Brave Search API key (fallback)
 *   (none for DDG)       — DuckDuckGo requires no API key (emergency fallback)
 *
 * Rate limiting:
 *   Daily search quota is defined per tier in tier-config.ts (webSearchesPerDay).
 *   Quota is tracked in the DailyUsage table via a `webSearches` field.
 *
 * Error handling:
 *   All search failures are swallowed gracefully — returns empty results.
 *   Search should never block or break a chat response.
 */

import { search as ddgSearch, SafeSearchType } from "duck-duck-scrape";
import { db } from "./db";
import { getTierConfig } from "./tier-config";
import type { Tier } from "./tier-config";

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  /** ISO date string if available */
  date?: string;
  /** Source domain (e.g., "nytimes.com") */
  source?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  provider: "serper" | "brave" | "ddg" | "none";
  query: string;
  cached: boolean;
}

interface SerperOrganicResult {
  title?: string;
  link?: string;
  snippet?: string;
  date?: string;
}

interface SerperResponse {
  organic?: SerperOrganicResult[];
}

interface BraveWebResult {
  title?: string;
  url?: string;
  description?: string;
  age?: string;
  meta_url?: { hostname?: string };
}

interface BraveSearchResponse {
  web?: { results?: BraveWebResult[] };
}

// ═══════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════

const DEFAULT_NUM_RESULTS = 5;
const MAX_NUM_RESULTS = 10;
const SEARCH_TIMEOUT_MS = 8_000;
const DDG_TIMEOUT_MS = 4_000;

/** In-memory cache to avoid duplicate API calls within a short window */
const searchCache = new Map<string, { results: SearchResult[]; provider: "serper" | "brave" | "ddg"; expiry: number }>();
const CACHE_TTL_MS = 5 * 60_000; // 5 minutes

// Clean up expired cache entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of searchCache) {
    if (now > entry.expiry) searchCache.delete(key);
  }
}, 10 * 60_000);

// ═══════════════════════════════════════════════════════════
// Core search function
// ═══════════════════════════════════════════════════════════

/**
 * Search the web using available providers (Serper primary, Brave fallback, DDG emergency).
 * Returns empty array on failure — never throws.
 *
 * @param query    - The search query string
 * @param numResults - Number of results to return (1-10, default 5)
 * @returns Array of search results, possibly empty
 */
export async function searchWeb(
  query: string,
  numResults: number = DEFAULT_NUM_RESULTS
): Promise<SearchResponse> {
  const count = Math.min(Math.max(numResults, 1), MAX_NUM_RESULTS);
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return { results: [], provider: "none", query: trimmedQuery, cached: false };
  }

  // Check cache first
  const cacheKey = `${trimmedQuery.toLowerCase()}:${count}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() < cached.expiry) {
    return {
      results: cached.results,
      provider: cached.provider,
      query: trimmedQuery,
      cached: true,
    };
  }

  // Try Serper (primary)
  const serperKey = process.env.SERPER_API_KEY;
  if (serperKey) {
    const serperResults = await searchSerper(trimmedQuery, count, serperKey);
    if (serperResults.length > 0) {
      searchCache.set(cacheKey, { results: serperResults, provider: "serper", expiry: Date.now() + CACHE_TTL_MS });
      return { results: serperResults, provider: "serper", query: trimmedQuery, cached: false };
    }
  }

  // Try Brave Search (fallback)
  const braveKey = process.env.BRAVE_SEARCH_API_KEY;
  if (braveKey) {
    const braveResults = await searchBrave(trimmedQuery, count, braveKey);
    if (braveResults.length > 0) {
      searchCache.set(cacheKey, { results: braveResults, provider: "brave", expiry: Date.now() + CACHE_TTL_MS });
      return { results: braveResults, provider: "brave", query: trimmedQuery, cached: false };
    }
  }

  // Try DuckDuckGo (emergency fallback — no API key required)
  const ddgResults = await searchDDG(trimmedQuery, count);
  if (ddgResults.length > 0) {
    searchCache.set(cacheKey, { results: ddgResults, provider: "ddg", expiry: Date.now() + CACHE_TTL_MS });
    return { results: ddgResults, provider: "ddg", query: trimmedQuery, cached: false };
  }

  // All providers failed or unconfigured
  if (!serperKey && !braveKey) {
    console.warn("[web-search] No search API keys configured (SERPER_API_KEY or BRAVE_SEARCH_API_KEY)");
  }

  return { results: [], provider: "none", query: trimmedQuery, cached: false };
}

// ═══════════════════════════════════════════════════════════
// Provider: Serper (Google Search API)
// ═══════════════════════════════════════════════════════════

async function searchSerper(
  query: string,
  numResults: number,
  apiKey: string
): Promise<SearchResult[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: query,
        num: numResults,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[web-search] Serper returned ${response.status}: ${response.statusText}`);
      return [];
    }

    const data = (await response.json()) as SerperResponse;
    const organic = data.organic ?? [];

    return organic
      .filter((r): r is SerperOrganicResult & { title: string; link: string } =>
        typeof r.title === "string" && typeof r.link === "string"
      )
      .slice(0, numResults)
      .map((r) => ({
        title: r.title,
        url: r.link,
        snippet: r.snippet ?? "",
        date: r.date,
        source: extractDomain(r.link),
      }));
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.warn("[web-search] Serper request timed out");
    } else {
      console.warn("[web-search] Serper error:", error instanceof Error ? error.message : "unknown");
    }
    return [];
  }
}

// ═══════════════════════════════════════════════════════════
// Provider: Brave Search
// ═══════════════════════════════════════════════════════════

async function searchBrave(
  query: string,
  numResults: number,
  apiKey: string
): Promise<SearchResult[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

    const params = new URLSearchParams({
      q: query,
      count: String(numResults),
    });

    const response = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": apiKey,
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[web-search] Brave returned ${response.status}: ${response.statusText}`);
      return [];
    }

    const data = (await response.json()) as BraveSearchResponse;
    const webResults = data.web?.results ?? [];

    return webResults
      .filter((r): r is BraveWebResult & { title: string; url: string } =>
        typeof r.title === "string" && typeof r.url === "string"
      )
      .slice(0, numResults)
      .map((r) => ({
        title: r.title,
        url: r.url,
        snippet: r.description ?? "",
        date: r.age,
        source: r.meta_url?.hostname ?? extractDomain(r.url),
      }));
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.warn("[web-search] Brave request timed out");
    } else {
      console.warn("[web-search] Brave error:", error instanceof Error ? error.message : "unknown");
    }
    return [];
  }
}

// ═══════════════════════════════════════════════════════════
// Provider: DuckDuckGo (emergency fallback — no API key)
// ═══════════════════════════════════════════════════════════

async function searchDDG(
  query: string,
  numResults: number
): Promise<SearchResult[]> {
  try {
    const results = await Promise.race([
      ddgSearch(query, { safeSearch: SafeSearchType.MODERATE }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("DDG request timed out")), DDG_TIMEOUT_MS)
      ),
    ]);

    if (results.noResults || !results.results?.length) {
      return [];
    }

    return results.results
      .filter(
        (r): r is typeof r & { title: string; url: string } =>
          typeof r.title === "string" && typeof r.url === "string"
      )
      .slice(0, numResults)
      .map((r) => ({
        title: r.title,
        url: r.url,
        snippet: r.description ?? "",
        source: r.hostname ?? extractDomain(r.url),
      }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";

    // DDG rate-limit detection — bail immediately, no point retrying
    if (message.includes("anomaly")) {
      console.warn("[web-search] DDG rate-limited (anomaly detected)");
      return [];
    }

    if (message.includes("timed out")) {
      console.warn("[web-search] DDG request timed out");
    } else {
      console.warn("[web-search] DDG error:", message);
    }
    return [];
  }
}

// ═══════════════════════════════════════════════════════════
// Result formatting for LLM context injection
// ═══════════════════════════════════════════════════════════

/**
 * Format search results as a context block for injection into an LLM system prompt.
 * Designed to be concise but informative — the LLM uses this to ground its response.
 *
 * @param results - Array of search results from searchWeb()
 * @returns Formatted string ready for prompt injection, or empty string if no results
 */
export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) return "";

  const formatted = results
    .map((r, i) => {
      const parts = [`[${i + 1}] ${r.title}`];
      if (r.snippet) parts.push(`    ${r.snippet}`);
      parts.push(`    Source: ${r.url}`);
      if (r.date) parts.push(`    Date: ${r.date}`);
      return parts.join("\n");
    })
    .join("\n\n");

  return [
    "",
    "═══ VERIFIED WEB SEARCH RESULTS ═══",
    "These are REAL results from a live Google search. You MUST use these results to answer.",
    "Do NOT ignore these results. Do NOT make up your own business names or addresses.",
    "Present ONLY the businesses listed below. Add no others.",
    "",
    formatted,
    "",
    "═══ END VERIFIED RESULTS ═══",
  ].join("\n");
}

// ═══════════════════════════════════════════════════════════
// Quota management
// ═══════════════════════════════════════════════════════════

/**
 * Check if a user has remaining web search quota for today.
 * Returns true if the user can perform a search, false if quota is exhausted.
 *
 * Uses the tier's webSearchesPerDay from tier-config.ts.
 * Tracks usage in DailyUsage.webSearches field.
 *
 * @param userId - The database user ID
 * @param tier   - The user's current tier
 * @returns true if search is allowed, false if quota exhausted or feature disabled
 */
export async function checkSearchQuota(
  userId: string,
  tier: Tier
): Promise<boolean> {
  const config = getTierConfig(tier);
  const maxSearches = config.perks.webSearchesPerDay;

  // Feature disabled for this tier
  if (maxSearches <= 0) return false;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  try {
    const dailyUsage = await db.dailyUsage.findUnique({
      where: {
        userId_date: {
          userId,
          date: todayStart,
        },
      },
    });

    const searchesToday = (dailyUsage as Record<string, unknown>)?.webSearches as number ?? 0;
    return searchesToday < maxSearches;
  } catch {
    // If the webSearches field doesn't exist yet (pre-migration), allow the search
    // but log a warning so we know migration is needed
    console.warn("[web-search] Could not check search quota — webSearches field may not exist yet");
    return true;
  }
}

/**
 * Increment the user's daily web search count.
 * Call this AFTER a successful search to track usage.
 *
 * @param userId - The database user ID
 */
export async function incrementSearchUsage(userId: string): Promise<void> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  try {
    // Use raw SQL to increment webSearches since the field may not exist in the Prisma client yet.
    // Once the migration adding DailyUsage.webSearches is applied, this can switch to Prisma upsert.
    await db.$executeRawUnsafe(
      `INSERT INTO "DailyUsage" (id, "userId", date, "messagesSent", "smartMessagesSent", "webSearches")
       VALUES (gen_random_uuid(), $1, $2, 0, 0, 1)
       ON CONFLICT ("userId", date)
       DO UPDATE SET "webSearches" = COALESCE("DailyUsage"."webSearches", 0) + 1`,
      userId,
      todayStart
    );
  } catch (error) {
    console.warn("[web-search] Failed to increment search usage:", error instanceof Error ? error.message : "unknown");
  }
}

/**
 * Get the user's remaining web searches for today.
 *
 * @param userId - The database user ID
 * @param tier   - The user's current tier
 * @returns Object with used, limit, and remaining counts
 */
export async function getSearchUsage(
  userId: string,
  tier: Tier
): Promise<{ used: number; limit: number; remaining: number }> {
  const config = getTierConfig(tier);
  const limit = config.perks.webSearchesPerDay;

  if (limit <= 0) {
    return { used: 0, limit: 0, remaining: 0 };
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  try {
    const dailyUsage = await db.dailyUsage.findUnique({
      where: {
        userId_date: {
          userId,
          date: todayStart,
        },
      },
    });

    const used = (dailyUsage as Record<string, unknown>)?.webSearches as number ?? 0;
    return { used, limit, remaining: Math.max(0, limit - used) };
  } catch {
    return { used: 0, limit, remaining: limit };
  }
}

// ═══════════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════════

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
