/**
 * Answer Bank Loader & Matcher — Golden Egg Architecture Integration
 *
 * Provides pre-verified answer injection into agent system prompts.
 * Phase 1: keyword overlap scoring. Phase 2 (future): vector similarity.
 *
 * Answer banks are loaded from C:\palace\seeds\answer-banks\{slug}.json
 * and cached in memory after first load. When a user query matches an
 * answer bank entry above the confidence threshold, the verified answer
 * is injected into the system prompt BEFORE RAG context, giving it
 * priority over retrieved knowledge chunks.
 *
 * @see golden-egg.ts — architecture this integrates with
 * @see embeddings.ts — RAG system this complements (answer bank > RAG > LLM)
 */

import { readFile } from "fs/promises";
import { join } from "path";

// ---------------------------------------------------------------------------
// 1. Interfaces
// ---------------------------------------------------------------------------

/** A single verified answer entry in an answer bank. */
export interface AnswerEntry {
  /** Unique identifier for this answer. */
  id: string;
  /** Human-readable trigger description (e.g., "pricing question"). */
  trigger: string;
  /** Keywords that signal this answer is relevant to the query. */
  keywords: string[];
  /** The verified answer text to inject into the prompt. */
  answer: string;
  /** Confidence level: HIGH, MODERATE, or LOW. */
  confidence: "HIGH" | "MODERATE" | "LOW";
  /** Source of the answer (e.g., "tier-config.ts", "official docs"). */
  source: string;
  /** Category for grouping (e.g., "pricing", "features", "support"). */
  category: string;
}

/** An answer bank for a specific agent. */
export interface AnswerBank {
  /** The agent slug this bank belongs to. */
  agentSlug: string;
  /** The Golden Egg type classification. */
  eggType: string;
  /** Schema version for forward compatibility. */
  version: number;
  /** The answer entries in this bank. */
  answers: AnswerEntry[];
}

/** Result of matching a query against an answer bank. */
export interface AnswerMatch {
  /** The matched answer entry. */
  entry: AnswerEntry;
  /** Match score from 0 to 1 (keyword overlap ratio). */
  score: number;
  /** Which keywords from the entry were found in the query. */
  matched: string[];
}

/** Options for answer matching. */
export interface MatchOptions {
  /** Minimum score threshold to consider a match (default: 0.3). */
  threshold?: number;
  /** Maximum number of matches to return (default: 1). */
  maxMatches?: number;
}

/** Options for building answer context. */
export interface AnswerContextOptions {
  /** Minimum score threshold (default: 0.3). */
  threshold?: number;
}

/** Stats about loaded answer banks. */
export interface AnswerBankStats {
  /** Number of answer banks currently cached. */
  banksLoaded: number;
  /** Total answer entries across all cached banks. */
  totalAnswers: number;
  /** Agent slugs with cached banks. */
  cachedSlugs: string[];
}

// ---------------------------------------------------------------------------
// 2. Constants
// ---------------------------------------------------------------------------

/** Base directory for answer bank JSON files. */
const ANSWER_BANK_DIR = "C:\\palace\\seeds\\answer-banks";

/** Default match threshold — minimum keyword overlap ratio to accept. */
const DEFAULT_THRESHOLD = 0.3;

// ---------------------------------------------------------------------------
// 3. In-memory cache
// ---------------------------------------------------------------------------

/**
 * Memory cache for loaded answer banks.
 * Key: agent slug. Value: loaded AnswerBank or null (file not found).
 * null entries are cached to avoid repeated filesystem lookups.
 */
const bankCache = new Map<string, AnswerBank | null>();

// ---------------------------------------------------------------------------
// 4. loadAnswerBank — Load answer bank from disk with caching
// ---------------------------------------------------------------------------

/**
 * Loads the answer bank for an agent from disk.
 * Returns the cached version if already loaded.
 * Returns null if no bank file exists for this agent.
 *
 * File location: C:\palace\seeds\answer-banks\{slug}.json
 *
 * @param agentSlug - The agent's URL slug (e.g., "copywriting")
 * @returns The answer bank or null if none exists
 */
export async function loadAnswerBank(
  agentSlug: string
): Promise<AnswerBank | null> {
  // Return cached result (including cached nulls)
  if (bankCache.has(agentSlug)) {
    return bankCache.get(agentSlug) ?? null;
  }

  const filePath = join(ANSWER_BANK_DIR, `${agentSlug}.json`);

  try {
    const raw = await readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw) as AnswerBank;

    // Basic validation
    if (
      !parsed.agentSlug ||
      !Array.isArray(parsed.answers) ||
      typeof parsed.version !== "number"
    ) {
      console.warn(
        `[answer-bank] Invalid answer bank format for "${agentSlug}" at ${filePath}`
      );
      bankCache.set(agentSlug, null);
      return null;
    }

    // Validate each entry has required fields
    const validAnswers = parsed.answers.filter(
      (a): a is AnswerEntry =>
        typeof a.id === "string" &&
        typeof a.trigger === "string" &&
        Array.isArray(a.keywords) &&
        a.keywords.length > 0 &&
        typeof a.answer === "string" &&
        typeof a.confidence === "string" &&
        typeof a.source === "string" &&
        typeof a.category === "string"
    );

    const bank: AnswerBank = {
      agentSlug: parsed.agentSlug,
      eggType: parsed.eggType ?? "UNKNOWN",
      version: parsed.version,
      answers: validAnswers,
    };

    bankCache.set(agentSlug, bank);
    return bank;
  } catch (err: unknown) {
    // ENOENT = file doesn't exist — expected for agents without answer banks
    if (
      err instanceof Error &&
      "code" in err &&
      (err as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      bankCache.set(agentSlug, null);
      return null;
    }

    // Other errors (parse failures, permission issues) — log and cache null
    console.warn(
      `[answer-bank] Failed to load answer bank for "${agentSlug}":`,
      err instanceof Error ? err.message : err
    );
    bankCache.set(agentSlug, null);
    return null;
  }
}

// ---------------------------------------------------------------------------
// 5. matchAnswer — Keyword overlap scoring
// ---------------------------------------------------------------------------

/**
 * Finds the best matching answer from an answer bank for a given query.
 *
 * Scoring algorithm (Phase 1 — keyword overlap):
 * 1. Normalize the query to lowercase and split into word tokens.
 * 2. For each answer entry, count how many of its keywords appear in the query tokens.
 * 3. Score = matched keywords / total keywords (0 to 1).
 * 4. Return the top match if its score exceeds the threshold.
 *
 * @param query - The user's message text
 * @param answerBank - The answer bank to search
 * @param options - Match options (threshold, maxMatches)
 * @returns The best match or null if no entry exceeds the threshold
 */
export function matchAnswer(
  query: string,
  answerBank: AnswerBank,
  options?: MatchOptions
): AnswerMatch | null {
  const threshold = options?.threshold ?? DEFAULT_THRESHOLD;

  if (!answerBank.answers.length) return null;

  // Normalize query: lowercase, strip punctuation, split into tokens
  const queryTokens = new Set(
    query
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 1) // Drop single-char tokens
  );

  if (queryTokens.size === 0) return null;

  let bestMatch: AnswerMatch | null = null;

  for (const entry of answerBank.answers) {
    const entryKeywords = entry.keywords.map((k) => k.toLowerCase());
    const matched: string[] = [];

    for (const keyword of entryKeywords) {
      // Support multi-word keywords: check if all words appear in the query
      const keywordParts = keyword.split(/\s+/);
      const allPartsFound = keywordParts.every((part) =>
        queryTokens.has(part)
      );

      if (allPartsFound) {
        matched.push(keyword);
      }
    }

    if (matched.length === 0) continue;

    const score = matched.length / entryKeywords.length;

    if (score < threshold) continue;

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { entry, score, matched };
    }
  }

  return bestMatch;
}

// ---------------------------------------------------------------------------
// 6. buildAnswerContext — High-level integration point
// ---------------------------------------------------------------------------

/**
 * High-level function for chat/route.ts integration.
 *
 * 1. Loads the answer bank for the agent (cached after first call).
 * 2. Matches the user query against the bank.
 * 3. If a match exceeds the threshold, returns a formatted context string
 *    for injection into the system prompt.
 * 4. If no match, returns null — the RAG pipeline handles it.
 *
 * The returned string is designed to sit between the base system prompt
 * and the RAG context block, giving verified answers priority.
 *
 * @param agentSlug - The agent's URL slug
 * @param userQuery - The user's message text
 * @param options - Context options (threshold)
 * @returns Formatted answer context string or null
 */
export async function buildAnswerContext(
  agentSlug: string,
  userQuery: string,
  options?: AnswerContextOptions
): Promise<string | null> {
  const bank = await loadAnswerBank(agentSlug);
  if (!bank) return null;

  const match = matchAnswer(userQuery, bank, {
    threshold: options?.threshold ?? DEFAULT_THRESHOLD,
  });

  if (!match) return null;

  // Format the verified answer for prompt injection
  return `\n\n<verified_answer>\nVERIFIED ANSWER (confidence: ${match.entry.confidence}): ${match.entry.answer}\nSource: ${match.entry.source}\n</verified_answer>\n\nUse the verified answer above as your primary response basis. You may supplement with additional context but do not contradict the verified answer.`;
}

// ---------------------------------------------------------------------------
// 7. getAnswerBankStats — Cache diagnostics
// ---------------------------------------------------------------------------

/**
 * Returns stats about currently loaded answer banks.
 * Useful for monitoring and debugging.
 */
export function getAnswerBankStats(): AnswerBankStats {
  let totalAnswers = 0;
  const cachedSlugs: string[] = [];

  for (const [slug, bank] of bankCache.entries()) {
    if (bank) {
      cachedSlugs.push(slug);
      totalAnswers += bank.answers.length;
    }
  }

  return {
    banksLoaded: cachedSlugs.length,
    totalAnswers,
    cachedSlugs,
  };
}

// ---------------------------------------------------------------------------
// 8. clearAnswerBankCache — Cache management
// ---------------------------------------------------------------------------

/**
 * Clears the answer bank cache. Useful for:
 * - Hot-reloading answer banks during development
 * - Forcing a re-read after answer bank files are updated
 *
 * @param agentSlug - Optional: clear only this agent's cache. If omitted, clears all.
 */
export function clearAnswerBankCache(agentSlug?: string): void {
  if (agentSlug) {
    bankCache.delete(agentSlug);
  } else {
    bankCache.clear();
  }
}
