# Search Implementation

## Palace Knowledge Seed — Advanced Backend Engineering

### Overview

Search is foundational for Stone AI — users search agents, forum posts, help articles, and conversations. This seed covers full-text search with PostgreSQL tsvector/tsquery, search ranking, fuzzy matching, autocomplete, and pgvector semantic search. All patterns use PostgreSQL 16 with Prisma 7.4.2.

---

## 1. PostgreSQL Full-Text Search Setup

### Schema

```sql
-- Add tsvector columns for searchable tables
ALTER TABLE agents ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(system_prompt, '')), 'C')
  ) STORED;

CREATE INDEX idx_agents_search ON agents USING GIN (search_vector);

ALTER TABLE forum_posts ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(body, '')), 'B')
  ) STORED;

CREATE INDEX idx_forum_posts_search ON forum_posts USING GIN (search_vector);

ALTER TABLE help_articles ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(tags::text, '')), 'C')
  ) STORED;

CREATE INDEX idx_help_articles_search ON help_articles USING GIN (search_vector);
```

### Basic Search Query

```typescript
// src/lib/search/full-text.ts
import { prisma } from '@/lib/prisma';

interface SearchResult {
  id: string;
  type: 'agent' | 'forum_post' | 'help_article';
  title: string;
  snippet: string;
  rank: number;
  highlights: string;
}

export async function searchAgents(
  query: string,
  userTier: string,
  limit: number = 10
): Promise<SearchResult[]> {
  const sanitized = sanitizeSearchQuery(query);
  const tsquery = buildTsQuery(sanitized);
  const agentLimit = getAgentLimit(userTier);

  const results = await prisma.$queryRaw<SearchResult[]>`
    SELECT
      id::text,
      'agent' as type,
      name as title,
      ts_headline(
        'english',
        description,
        to_tsquery('english', ${tsquery}),
        'MaxWords=30, MinWords=15, StartSel=<mark>, StopSel=</mark>'
      ) as snippet,
      ts_rank_cd(search_vector, to_tsquery('english', ${tsquery}), 32) as rank,
      ts_headline(
        'english',
        name || ' ' || description,
        to_tsquery('english', ${tsquery}),
        'MaxFragments=3, MaxWords=10, StartSel=<mark>, StopSel=</mark>'
      ) as highlights
    FROM agents
    WHERE search_vector @@ to_tsquery('english', ${tsquery})
      AND is_active = true
      AND number <= ${agentLimit}
      AND is_royal_guard = false
    ORDER BY rank DESC
    LIMIT ${limit}
  `;

  return results;
}

export async function searchForumPosts(
  query: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ results: SearchResult[]; total: number }> {
  const tsquery = buildTsQuery(sanitizeSearchQuery(query));

  const [results, countResult] = await Promise.all([
    prisma.$queryRaw<SearchResult[]>`
      SELECT
        fp.id::text,
        'forum_post' as type,
        fp.title,
        ts_headline(
          'english', fp.body,
          to_tsquery('english', ${tsquery}),
          'MaxWords=40, MinWords=20, StartSel=<mark>, StopSel=</mark>'
        ) as snippet,
        ts_rank_cd(fp.search_vector, to_tsquery('english', ${tsquery}), 32)
          + (ln(greatest(fp.view_count, 1)) * 0.1) as rank,
        '' as highlights
      FROM forum_posts fp
      WHERE fp.search_vector @@ to_tsquery('english', ${tsquery})
        AND fp.is_published = true
        AND fp.deleted_at IS NULL
      ORDER BY rank DESC
      LIMIT ${limit} OFFSET ${offset}
    `,
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM forum_posts
      WHERE search_vector @@ to_tsquery('english', ${tsquery})
        AND is_published = true
        AND deleted_at IS NULL
    `,
  ]);

  return { results, total: Number(countResult[0].count) };
}
```

### Query Building and Sanitization

```typescript
// src/lib/search/query-builder.ts

export function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/[^\w\s-]/g, ' ')  // Remove special characters
    .replace(/\s+/g, ' ')        // Collapse whitespace
    .trim()
    .slice(0, 200);               // Limit length
}

export function buildTsQuery(query: string): string {
  const words = query.split(/\s+/).filter((w) => w.length > 1);

  if (words.length === 0) return '';

  // Use prefix matching for the last word (autocomplete behavior)
  // AND between all words
  return words
    .map((word, i) => {
      const escaped = word.replace(/'/g, "''");
      // Last word gets prefix matching
      if (i === words.length - 1) {
        return `${escaped}:*`;
      }
      return escaped;
    })
    .join(' & ');
}

// For phrase matching
export function buildPhraseQuery(query: string): string {
  const words = sanitizeSearchQuery(query).split(/\s+/);
  return words.map((w) => w.replace(/'/g, "''")).join(' <-> ');
}

// For OR matching (more lenient)
export function buildOrQuery(query: string): string {
  const words = sanitizeSearchQuery(query).split(/\s+/).filter((w) => w.length > 1);
  return words.map((w) => w.replace(/'/g, "''")).join(' | ');
}
```

---

## 2. Search Ranking and Relevance

```typescript
// src/lib/search/ranking.ts

// Custom ranking that combines text relevance with business signals
export async function searchWithRanking(
  query: string,
  options: {
    type?: string;
    userTier?: string;
    limit?: number;
    boostRecent?: boolean;
  }
): Promise<SearchResult[]> {
  const tsquery = buildTsQuery(sanitizeSearchQuery(query));
  const limit = options.limit ?? 20;

  const results = await prisma.$queryRaw<SearchResult[]>`
    WITH search_results AS (
      SELECT
        id::text,
        'forum_post' as type,
        title,
        body as content,
        search_vector,
        view_count,
        created_at,
        -- Text relevance (0-1 range, normalized)
        ts_rank_cd(search_vector, to_tsquery('english', ${tsquery}), 32) as text_rank,
        -- Recency boost (1.0 for today, decays over 30 days)
        GREATEST(0, 1.0 - EXTRACT(EPOCH FROM (NOW() - created_at)) / (30 * 86400)) as recency_score,
        -- Popularity boost (logarithmic)
        ln(GREATEST(view_count, 1)) / 10.0 as popularity_score
      FROM forum_posts
      WHERE search_vector @@ to_tsquery('english', ${tsquery})
        AND is_published = true
    )
    SELECT
      id,
      type,
      title,
      ts_headline(
        'english', content,
        to_tsquery('english', ${tsquery}),
        'MaxWords=30, MinWords=15, StartSel=<mark>, StopSel=</mark>'
      ) as snippet,
      (
        text_rank * 0.6 +
        ${options.boostRecent ? Prisma.sql`recency_score * 0.25` : Prisma.sql`0`} +
        popularity_score * 0.15
      ) as rank,
      '' as highlights
    FROM search_results
    ORDER BY rank DESC
    LIMIT ${limit}
  `;

  return results;
}
```

---

## 3. Fuzzy Matching

```typescript
// src/lib/search/fuzzy.ts

// Install: CREATE EXTENSION pg_trgm;

export async function fuzzySearch(
  query: string,
  table: string,
  column: string,
  limit: number = 10
): Promise<{ id: string; value: string; similarity: number }[]> {
  const sanitized = sanitizeSearchQuery(query);

  // Trigram similarity search
  const results = await prisma.$queryRaw<any[]>`
    SELECT
      id::text,
      ${Prisma.raw(column)} as value,
      similarity(${Prisma.raw(column)}, ${sanitized}) as similarity
    FROM ${Prisma.raw(table)}
    WHERE similarity(${Prisma.raw(column)}, ${sanitized}) > 0.1
    ORDER BY similarity DESC
    LIMIT ${limit}
  `;

  return results;
}

// Combined: full-text + fuzzy fallback
export async function searchWithFallback(
  query: string,
  table: string
): Promise<SearchResult[]> {
  const tsquery = buildTsQuery(sanitizeSearchQuery(query));

  // Try full-text first
  const ftsResults = await prisma.$queryRaw<SearchResult[]>`
    SELECT id::text, title, description as snippet,
           ts_rank(search_vector, to_tsquery('english', ${tsquery})) as rank
    FROM ${Prisma.raw(table)}
    WHERE search_vector @@ to_tsquery('english', ${tsquery})
    ORDER BY rank DESC
    LIMIT 10
  `;

  if (ftsResults.length >= 3) return ftsResults;

  // Fall back to fuzzy/trigram for typo tolerance
  const fuzzyResults = await prisma.$queryRaw<SearchResult[]>`
    SELECT id::text, title, description as snippet,
           similarity(title, ${sanitizeSearchQuery(query)}) as rank
    FROM ${Prisma.raw(table)}
    WHERE similarity(title, ${sanitizeSearchQuery(query)}) > 0.15
    ORDER BY rank DESC
    LIMIT 10
  `;

  // Merge, deduplicate, re-rank
  const seen = new Set(ftsResults.map((r) => r.id));
  const combined = [...ftsResults];

  for (const r of fuzzyResults) {
    if (!seen.has(r.id)) {
      combined.push({ ...r, rank: r.rank * 0.7 }); // Discount fuzzy results
    }
  }

  return combined.sort((a, b) => b.rank - a.rank).slice(0, 10);
}
```

---

## 4. Autocomplete

```typescript
// src/lib/search/autocomplete.ts

export async function autocomplete(
  prefix: string,
  category: 'agents' | 'forum' | 'help',
  limit: number = 5
): Promise<{ id: string; title: string; type: string }[]> {
  const sanitized = sanitizeSearchQuery(prefix);
  if (sanitized.length < 2) return [];

  const tsquery = sanitized.split(/\s+/)
    .filter((w) => w.length > 1)
    .map((w) => `${w}:*`)
    .join(' & ');

  if (!tsquery) return [];

  switch (category) {
    case 'agents':
      return prisma.$queryRaw`
        SELECT id::text, name as title, 'agent' as type
        FROM agents
        WHERE search_vector @@ to_tsquery('english', ${tsquery})
          AND is_active = true
          AND is_royal_guard = false
        ORDER BY ts_rank(search_vector, to_tsquery('english', ${tsquery})) DESC
        LIMIT ${limit}
      `;

    case 'forum':
      return prisma.$queryRaw`
        SELECT id::text, title, 'forum_post' as type
        FROM forum_posts
        WHERE search_vector @@ to_tsquery('english', ${tsquery})
          AND is_published = true
        ORDER BY ts_rank(search_vector, to_tsquery('english', ${tsquery})) DESC,
                 view_count DESC
        LIMIT ${limit}
      `;

    case 'help':
      return prisma.$queryRaw`
        SELECT id::text, title, 'help_article' as type
        FROM help_articles
        WHERE search_vector @@ to_tsquery('english', ${tsquery})
        ORDER BY ts_rank(search_vector, to_tsquery('english', ${tsquery})) DESC
        LIMIT ${limit}
      `;

    default:
      return [];
  }
}

// API route with caching
// src/app/api/search/autocomplete/route.ts
export const GET = withObservability(async (req) => {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const category = (searchParams.get('category') ?? 'agents') as any;

  if (q.length < 2) {
    return Response.json([]);
  }

  // Cache autocomplete results briefly
  const cacheKey = `autocomplete:${category}:${q.toLowerCase()}`;
  const cached = await redis.get(cacheKey);
  if (cached) return Response.json(JSON.parse(cached));

  const results = await autocomplete(q, category);

  await redis.setex(cacheKey, 30, JSON.stringify(results)); // 30s cache

  return Response.json(results);
});
```

---

## 5. Semantic Search with pgvector

```typescript
// src/lib/search/semantic.ts

// Prerequisites: CREATE EXTENSION vector;

export async function semanticSearch(
  query: string,
  contentType: string,
  limit: number = 10,
  similarityThreshold: number = 0.7
): Promise<{
  id: string;
  title: string;
  snippet: string;
  similarity: number;
}[]> {
  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query);

  const results = await prisma.$queryRaw<any[]>`
    SELECT
      c.id::text,
      c.title,
      LEFT(c.body, 200) as snippet,
      1 - (ce.embedding <=> ${queryEmbedding}::vector) as similarity
    FROM content_embeddings ce
    JOIN ${Prisma.raw(contentType)} c ON c.id = ce.content_id
    WHERE ce.content_type = ${contentType}
      AND 1 - (ce.embedding <=> ${queryEmbedding}::vector) > ${similarityThreshold}
    ORDER BY ce.embedding <=> ${queryEmbedding}::vector
    LIMIT ${limit}
  `;

  return results;
}

// Hybrid search: combine full-text and semantic
export async function hybridSearch(
  query: string,
  options: {
    contentType?: string;
    limit?: number;
    ftsWeight?: number;  // 0-1, weight for full-text results
    semanticWeight?: number; // 0-1, weight for semantic results
  } = {}
): Promise<SearchResult[]> {
  const { limit = 10, ftsWeight = 0.4, semanticWeight = 0.6 } = options;

  const [ftsResults, semanticResults] = await Promise.all([
    searchForumPosts(query, limit * 2),
    semanticSearch(query, 'forum_posts', limit * 2),
  ]);

  // Normalize scores to 0-1 range
  const maxFtsRank = Math.max(...ftsResults.results.map((r) => r.rank), 0.001);
  const maxSemRank = Math.max(...semanticResults.map((r) => r.similarity), 0.001);

  // Merge results with weighted scoring
  const scoreMap = new Map<string, { result: any; score: number }>();

  for (const r of ftsResults.results) {
    const normalizedScore = (r.rank / maxFtsRank) * ftsWeight;
    scoreMap.set(r.id, { result: r, score: normalizedScore });
  }

  for (const r of semanticResults) {
    const normalizedScore = (r.similarity / maxSemRank) * semanticWeight;
    const existing = scoreMap.get(r.id);

    if (existing) {
      existing.score += normalizedScore; // Boost items appearing in both
    } else {
      scoreMap.set(r.id, {
        result: {
          id: r.id,
          type: 'forum_post',
          title: r.title,
          snippet: r.snippet,
          rank: 0,
          highlights: '',
        },
        score: normalizedScore,
      });
    }
  }

  return Array.from(scoreMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => ({ ...item.result, rank: item.score }));
}
```

---

## 6. Universal Search API

```typescript
// src/app/api/search/route.ts
import { z } from 'zod';

const searchSchema = z.object({
  q: z.string().min(1).max(200),
  type: z.enum(['all', 'agents', 'forum', 'help']).default('all'),
  mode: z.enum(['text', 'semantic', 'hybrid']).default('text'),
  limit: z.coerce.number().min(1).max(50).default(10),
  offset: z.coerce.number().min(0).default(0),
});

export const GET = withObservability(
  requireAuth(async (req: AuthenticatedRequest) => {
    const { searchParams } = new URL(req.url);
    const params = searchSchema.parse(Object.fromEntries(searchParams));

    const { userId, tier } = req.auth;

    // Semantic search requires PLUS+ tier
    if (params.mode === 'semantic' || params.mode === 'hybrid') {
      const features = getTierFeatures(tier);
      if (!features.hasSemanticSearch) {
        throw new TierAccessError('PLUS', tier, 'semantic search');
      }
    }

    let results: SearchResult[];

    switch (params.mode) {
      case 'semantic':
        results = (await semanticSearch(
          params.q,
          params.type === 'all' ? 'forum_posts' : params.type,
          params.limit
        )) as any;
        break;

      case 'hybrid':
        results = await hybridSearch(params.q, { limit: params.limit });
        break;

      case 'text':
      default:
        if (params.type === 'all' || params.type === 'agents') {
          results = await searchAgents(params.q, tier, params.limit);
        } else if (params.type === 'forum') {
          const { results: r } = await searchForumPosts(
            params.q, params.limit, params.offset
          );
          results = r;
        } else {
          results = [];
        }
    }

    return Response.json({
      query: params.q,
      mode: params.mode,
      results,
      total: results.length,
    });
  })
);
```

---

## 7. Testing Search

```typescript
// __tests__/search/full-text.test.ts

describe('Search Query Builder', () => {
  it('should sanitize dangerous characters', () => {
    expect(sanitizeSearchQuery("hello' OR 1=1; --")).toBe('hello OR 11 --');
  });

  it('should build AND query with prefix on last word', () => {
    expect(buildTsQuery('stone ai chat')).toBe('stone & ai & chat:*');
  });

  it('should handle single word', () => {
    expect(buildTsQuery('agent')).toBe('agent:*');
  });

  it('should filter short words', () => {
    expect(buildTsQuery('a the stone')).toBe('the & stone:*');
  });
});
```

---

## Summary

| Feature | Implementation | Stone AI Use Case |
|---------|---------------|------------------|
| Full-text search | tsvector + GIN index | Agent/forum/help search |
| Weighted ranking | setweight A/B/C | Title > body > metadata |
| Fuzzy matching | pg_trgm | Typo tolerance |
| Autocomplete | Prefix tsquery | Search-as-you-type |
| Semantic search | pgvector cosine distance | PLUS+ tier content discovery |
| Hybrid search | FTS + semantic merge | Best of both worlds |
| Search caching | Redis 30s TTL | Autocomplete performance |

PostgreSQL provides production-grade search without external services. pgvector adds semantic understanding for paid tiers, creating a natural upsell path.
