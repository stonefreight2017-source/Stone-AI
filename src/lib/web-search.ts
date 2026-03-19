/**
 * Web Search Module — Stone AI
 *
 * Provides web search capabilities for agents via external search APIs.
 * Supports Serper (primary) and DuckDuckGo (emergency fallback) providers.
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
 *   SERPER_API_KEY       — Google Serper API key (primary, not needed when using proxy)
 *   SERPER_PROXY_URL     — Optional proxy URL for Serper (e.g., https://serper.stone-ai.net)
 *                          When set, requests go through the proxy which adds the API key.
 *                          Used to bypass datacenter IP blocking on Vercel.
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
  provider: "serper" | "ddg" | "none";
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

export interface PlaceResult {
  title: string;
  address?: string;
  phone?: string;
  rating?: number;
  ratingCount?: number;
  priceLevel?: string;
  category?: string;
  cid?: string;
  latitude?: number;
  longitude?: number;
}

interface SerperPlacesResponse {
  places?: Array<{
    title?: string;
    address?: string;
    phoneNumber?: string;
    website?: string;
    rating?: number;
    ratingCount?: number;
    priceLevel?: string;
    category?: string;
    cid?: string;
    latitude?: number;
    longitude?: number;
  }>;
}

// ═══════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════

const DEFAULT_NUM_RESULTS = 5;
const MAX_NUM_RESULTS = 10;
const SEARCH_TIMEOUT_MS = 8_000;
const DDG_TIMEOUT_MS = 4_000;

/** In-memory cache to avoid duplicate API calls within a short window */
const searchCache = new Map<string, { results: SearchResult[]; provider: "serper" | "ddg"; expiry: number }>();
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
 * Search the web using available providers (Serper primary, DDG emergency fallback).
 * Returns empty array on failure — never throws.
 *
 * @param query    - The search query string
 * @param numResults - Number of results to return (1-10, default 5)
 * @returns Array of search results, possibly empty
 */
export async function searchWeb(
  query: string,
  numResults: number = DEFAULT_NUM_RESULTS,
  searchType: "search" | "places" = "search"
): Promise<SearchResponse> {
  const count = Math.min(Math.max(numResults, 1), MAX_NUM_RESULTS);
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return { results: [], provider: "none", query: trimmedQuery, cached: false };
  }

  // Check cache first
  const cacheKey = `${trimmedQuery.toLowerCase()}:${count}:${searchType}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() < cached.expiry) {
    return {
      results: cached.results,
      provider: cached.provider,
      query: trimmedQuery,
      cached: true,
    };
  }

  // For "places" searchType, try Serper Places endpoint first for rich structured data
  const serperProxyUrl = process.env.SERPER_PROXY_URL;
  const serperKey = process.env.SERPER_API_KEY;

  if (searchType === "places" && (serperProxyUrl || serperKey)) {
    const placesResults = await searchSerperPlaces(trimmedQuery, count, serperKey ?? "", serperProxyUrl);
    if (placesResults.length > 0) {
      // Map PlaceResult to SearchResult with rich structured snippets
      const mapped: SearchResult[] = placesResults.map((place) => {
        const snippetParts: string[] = [];
        if (place.address) snippetParts.push(`Address: ${place.address}`);
        if (place.phone) snippetParts.push(`Phone: ${place.phone}`);
        if (place.rating != null) {
          let ratingStr = `Rating: ${place.rating}/5`;
          if (place.ratingCount != null) ratingStr += ` (${place.ratingCount.toLocaleString()} reviews)`;
          snippetParts.push(ratingStr);
        }
        if (place.priceLevel) snippetParts.push(`Price: ${place.priceLevel}`);
        if (place.category) snippetParts.push(`Category: ${place.category}`);

        return {
          title: place.title,
          url: place.cid ? `https://www.google.com/maps?cid=${place.cid}` : "",
          snippet: snippetParts.join(" | "),
          source: "Google Maps",
        };
      });

      searchCache.set(cacheKey, { results: mapped, provider: "serper", expiry: Date.now() + CACHE_TTL_MS });
      return { results: mapped, provider: "serper", query: trimmedQuery, cached: false };
    }
  }

  // Try Serper organic search (primary) — via proxy if SERPER_PROXY_URL is set, otherwise direct
  if (serperProxyUrl || serperKey) {
    const serperResults = await searchSerper(trimmedQuery, count, serperKey ?? "", serperProxyUrl);
    if (serperResults.length > 0) {
      searchCache.set(cacheKey, { results: serperResults, provider: "serper", expiry: Date.now() + CACHE_TTL_MS });
      return { results: serperResults, provider: "serper", query: trimmedQuery, cached: false };
    }
  }

  // Try DuckDuckGo (emergency fallback — no API key required)
  const ddgResults = await searchDDG(trimmedQuery, count);
  if (ddgResults.length > 0) {
    searchCache.set(cacheKey, { results: ddgResults, provider: "ddg", expiry: Date.now() + CACHE_TTL_MS });
    return { results: ddgResults, provider: "ddg", query: trimmedQuery, cached: false };
  }

  // All providers failed or unconfigured
  if (!serperKey && !serperProxyUrl) {
    console.warn("[web-search] No search API keys configured (SERPER_API_KEY or SERPER_PROXY_URL)");
  }

  return { results: [], provider: "none", query: trimmedQuery, cached: false };
}

// ═══════════════════════════════════════════════════════════
// Provider: Serper (Google Search API)
// ═══════════════════════════════════════════════════════════

async function searchSerper(
  query: string,
  numResults: number,
  apiKey: string,
  proxyUrl?: string
): Promise<SearchResult[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

    // When a proxy URL is set, POST to the proxy instead of Serper directly.
    // The proxy forwards to google.serper.dev and injects the API key server-side,
    // bypassing datacenter IP blocking on Vercel.
    const url = proxyUrl ?? "https://google.serper.dev/search";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (!proxyUrl) {
      headers["X-API-KEY"] = apiKey;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
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
// Provider: Serper Places (Google Maps structured data)
// ═══════════════════════════════════════════════════════════

async function searchSerperPlaces(
  query: string,
  numResults: number,
  apiKey: string,
  proxyUrl?: string
): Promise<PlaceResult[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

    // Use proxy if available, otherwise direct to Serper.
    // The proxy forwards ALL body params including `type`.
    const url = proxyUrl ?? "https://google.serper.dev/places";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (!proxyUrl) {
      headers["X-API-KEY"] = apiKey;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        q: query,
        num: numResults,
        type: "places",
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[web-search] Serper Places returned ${response.status}: ${response.statusText}`);
      return [];
    }

    const data = (await response.json()) as SerperPlacesResponse;
    const places = data.places ?? [];

    console.warn(`[web-search] Serper Places returned ${places.length} places`);
    return places
      .filter((p): p is typeof p & { title: string } => typeof p.title === "string")
      .slice(0, numResults)
      .map((p) => ({
        title: p.title,
        address: p.address,
        phone: p.phoneNumber,
        rating: p.rating,
        ratingCount: p.ratingCount,
        priceLevel: p.priceLevel,
        category: p.category,
        cid: p.cid,
        latitude: p.latitude,
        longitude: p.longitude,
      }));
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.warn("[web-search] Serper Places request timed out");
    } else {
      console.warn("[web-search] Serper Places error:", error instanceof Error ? error.message : "unknown");
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

  // Detect if results contain structured place data (pipe-delimited Address/Phone/Rating fields)
  const isPlaceData = results.some((r) => r.snippet && /Address:/.test(r.snippet));

  const formatted = results
    .map((r, i) => {
      if (isPlaceData && r.snippet) {
        // Structured place result — format each field on its own line for clarity
        const parts = [`[${i + 1}] ${r.title}`];
        const fields = r.snippet.split(" | ");
        for (const field of fields) {
          parts.push(`    ${field.trim()}`);
        }
        if (r.url) parts.push(`    Map: ${r.url}`);
        return parts.join("\n");
      } else {
        // Standard web result
        const parts = [`[${i + 1}] ${r.title}`];
        if (r.snippet) parts.push(`    ${r.snippet}`);
        if (r.url) parts.push(`    Source: ${r.url}`);
        if (r.date) parts.push(`    Date: ${r.date}`);
        return parts.join("\n");
      }
    })
    .join("\n\n");

  const header = isPlaceData
    ? [
        "",
        "═══ VERIFIED PLACES RESULTS (Google Maps) ═══",
        "These are REAL places from a live Google Maps search with verified addresses, phone numbers, and ratings.",
        "You MUST present ALL of these places to the user with their full details (address, phone, rating, price).",
        "Do NOT ignore any results. Do NOT make up details not listed here. Do NOT add businesses not in this list.",
        "Format each result clearly with name, address, phone number, rating, and price level when available.",
        "",
      ]
    : [
        "",
        "═══ VERIFIED WEB SEARCH RESULTS ═══",
        "These are REAL results from a live Google search. You MUST use these results to answer.",
        "Do NOT ignore these results. Do NOT make up your own business names or addresses.",
        "Present ONLY the businesses listed below. Add no others.",
        "",
      ];

  return [
    ...header,
    formatted,
    "",
    isPlaceData ? "═══ END VERIFIED PLACES ═══" : "═══ END VERIFIED RESULTS ═══",
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
