# RAG Knowledge Graph Fusion

## Purpose
Vector similarity retrieval finds semantically similar text. Knowledge graphs find structurally related entities. Combining both produces retrieval that understands both MEANING and RELATIONSHIPS. This seed covers GraphRAG, entity extraction, relationship mapping, graph-augmented retrieval, and hybrid pgvector/graph patterns.

---

## Why Graphs + Vectors

### What Vector Search Misses
- **Multi-hop reasoning**: "What projects does the manager of the billing team lead?" requires traversing: query → billing team → manager → projects
- **Structured relationships**: "All agents with tier SMART or above" is a graph query, not a similarity query
- **Temporal chains**: "What happened after the migration failed?" requires ordering events by causality
- **Negation/exclusion**: "Features NOT available on the FREE plan" — vectors find features ABOUT the free plan

### What Graph Search Misses
- **Semantic similarity**: "How do I fix authentication errors?" — no entity to traverse, need semantic match
- **Fuzzy matching**: User says "login issues" but your graph has "authentication" — vectors bridge this
- **Unstructured reasoning**: Long-form explanations, tutorials, guides — better as vector-retrieved text

### The Fusion Advantage
```
Query → [Vector Search] → Semantically relevant chunks
      → [Graph Search]  → Structurally related entities + context
      → [Fusion Layer]  → Combined, de-duplicated, ranked results
      → [LLM]           → Answer with both depth AND structure
```

---

## Entity Extraction Pipeline

### Extracting Entities from Text

```typescript
interface Entity {
  name: string;
  type: string;          // person, organization, concept, feature, technology, etc.
  aliases: string[];     // Alternative names
  properties: Record<string, string>;
}

interface Relationship {
  source: string;        // Entity name
  target: string;        // Entity name
  type: string;          // manages, depends_on, implements, etc.
  properties: Record<string, string>;
}

interface ExtractionResult {
  entities: Entity[];
  relationships: Relationship[];
}

async function extractEntitiesAndRelationships(
  text: string,
  llmEndpoint: string
): Promise<ExtractionResult> {
  const prompt = `Extract all entities and relationships from the following text.

TEXT:
${text}

Output as JSON with this exact structure:
{
  "entities": [
    {
      "name": "EntityName",
      "type": "person|organization|concept|feature|technology|event|location",
      "aliases": ["alternative names"],
      "properties": {"key": "value"}
    }
  ],
  "relationships": [
    {
      "source": "SourceEntityName",
      "target": "TargetEntityName",
      "type": "manages|depends_on|implements|contains|created_by|part_of|related_to",
      "properties": {"key": "value"}
    }
  ]
}

Rules:
- Entity names should be normalized (consistent casing, no abbreviations unless standard)
- Include ALL meaningful relationships, not just obvious ones
- Type should be from the provided lists, or a clear custom type
- Properties capture important attributes (dates, versions, quantities)`;

  const response = await callLLM(prompt, llmEndpoint);
  return JSON.parse(response);
}
```

### Batch Processing for Knowledge Base Ingestion

```typescript
async function buildKnowledgeGraph(
  documents: Array<{ id: string; content: string }>,
  llmEndpoint: string,
  batchSize: number = 5
): Promise<{ entities: Map<string, Entity>; relationships: Relationship[] }> {
  const allEntities = new Map<string, Entity>();
  const allRelationships: Relationship[] = [];

  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize);

    const results = await Promise.all(
      batch.map((doc) =>
        extractEntitiesAndRelationships(doc.content, llmEndpoint)
      )
    );

    for (const result of results) {
      // Merge entities (deduplicate by normalized name)
      for (const entity of result.entities) {
        const key = entity.name.toLowerCase();
        const existing = allEntities.get(key);
        if (existing) {
          // Merge aliases and properties
          existing.aliases = [...new Set([...existing.aliases, ...entity.aliases])];
          existing.properties = { ...existing.properties, ...entity.properties };
        } else {
          allEntities.set(key, entity);
        }
      }

      // Add relationships (deduplicate)
      for (const rel of result.relationships) {
        const isDuplicate = allRelationships.some(
          (r) =>
            r.source.toLowerCase() === rel.source.toLowerCase() &&
            r.target.toLowerCase() === rel.target.toLowerCase() &&
            r.type === rel.type
        );
        if (!isDuplicate) {
          allRelationships.push(rel);
        }
      }
    }
  }

  return { entities: allEntities, relationships: allRelationships };
}
```

---

## Storing the Graph in PostgreSQL

### Schema Design (pgvector + graph in the same DB)

```sql
-- Entity table with vector embeddings
CREATE TABLE kg_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  aliases TEXT[] DEFAULT '{}',
  properties JSONB DEFAULT '{}',
  description TEXT,
  embedding vector(1536),  -- For semantic search on entities
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, type)
);

-- Relationship table (the graph edges)
CREATE TABLE kg_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES kg_entities(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES kg_entities(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  weight FLOAT DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_id, target_id, type)
);

-- Link entities to source document chunks
CREATE TABLE kg_entity_sources (
  entity_id UUID NOT NULL REFERENCES kg_entities(id) ON DELETE CASCADE,
  chunk_id UUID NOT NULL,  -- References your document chunks table
  mention_count INT DEFAULT 1,
  PRIMARY KEY (entity_id, chunk_id)
);

-- Indexes for graph traversal
CREATE INDEX idx_rel_source ON kg_relationships(source_id);
CREATE INDEX idx_rel_target ON kg_relationships(target_id);
CREATE INDEX idx_rel_type ON kg_relationships(type);
CREATE INDEX idx_entity_type ON kg_entities(type);
CREATE INDEX idx_entity_embedding ON kg_entities USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### TypeScript Data Access Layer

```typescript
import { Pool } from 'pg';

class KnowledgeGraphStore {
  constructor(private pool: Pool) {}

  async upsertEntity(entity: Entity, embedding: number[]): Promise<string> {
    const result = await this.pool.query(
      `INSERT INTO kg_entities (name, type, aliases, properties, embedding)
       VALUES ($1, $2, $3, $4, $5::vector)
       ON CONFLICT (name, type) DO UPDATE SET
         aliases = ARRAY(SELECT DISTINCT unnest(kg_entities.aliases || $3)),
         properties = kg_entities.properties || $4,
         embedding = $5::vector,
         updated_at = NOW()
       RETURNING id`,
      [entity.name, entity.type, entity.aliases, JSON.stringify(entity.properties),
       JSON.stringify(embedding)]
    );
    return result.rows[0].id;
  }

  async addRelationship(
    sourceName: string,
    targetName: string,
    type: string,
    properties: Record<string, string> = {}
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO kg_relationships (source_id, target_id, type, properties)
       SELECT s.id, t.id, $3, $4
       FROM kg_entities s, kg_entities t
       WHERE LOWER(s.name) = LOWER($1) AND LOWER(t.name) = LOWER($2)
       ON CONFLICT (source_id, target_id, type) DO NOTHING`,
      [sourceName, targetName, type, JSON.stringify(properties)]
    );
  }

  // Graph traversal: find entities N hops away
  async traverseGraph(
    startEntityName: string,
    maxHops: number = 2,
    relationshipTypes?: string[]
  ): Promise<Array<{ entity: Entity; depth: number; path: string[] }>> {
    const typeFilter = relationshipTypes
      ? `AND r.type = ANY($3)`
      : '';

    const params: any[] = [startEntityName, maxHops];
    if (relationshipTypes) params.push(relationshipTypes);

    const result = await this.pool.query(
      `WITH RECURSIVE graph_walk AS (
        -- Base case: start entity
        SELECT e.id, e.name, e.type, e.aliases, e.properties,
               0 as depth, ARRAY[e.name] as path
        FROM kg_entities e
        WHERE LOWER(e.name) = LOWER($1)

        UNION ALL

        -- Recursive: traverse relationships
        SELECT e2.id, e2.name, e2.type, e2.aliases, e2.properties,
               gw.depth + 1, gw.path || e2.name
        FROM graph_walk gw
        JOIN kg_relationships r ON r.source_id = gw.id
        JOIN kg_entities e2 ON e2.id = r.target_id
        WHERE gw.depth < $2
          AND NOT e2.name = ANY(gw.path)  -- Prevent cycles
          ${typeFilter}
      )
      SELECT DISTINCT ON (name) * FROM graph_walk
      ORDER BY name, depth`,
      params
    );

    return result.rows.map((row) => ({
      entity: {
        name: row.name,
        type: row.type,
        aliases: row.aliases,
        properties: row.properties,
      },
      depth: row.depth,
      path: row.path,
    }));
  }

  // Semantic search on entities
  async findSimilarEntities(
    queryEmbedding: number[],
    topK: number = 10
  ): Promise<Array<Entity & { similarity: number }>> {
    const result = await this.pool.query(
      `SELECT name, type, aliases, properties,
              1 - (embedding <=> $1::vector) as similarity
       FROM kg_entities
       WHERE embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT $2`,
      [JSON.stringify(queryEmbedding), topK]
    );

    return result.rows;
  }
}
```

---

## Graph-Augmented Retrieval (The Fusion Pipeline)

### The Core Pattern

```typescript
interface GraphRAGResult {
  vectorChunks: Array<{ content: string; score: number }>;
  graphContext: string;
  entities: Entity[];
  mergedContext: string;
}

async function graphAugmentedRetrieval(
  query: string,
  queryEmbedding: number[],
  pool: Pool,
  llmEndpoint: string,
  config: {
    vectorTopK: number;
    graphHops: number;
    maxContextTokens: number;
  }
): Promise<GraphRAGResult> {
  const kg = new KnowledgeGraphStore(pool);

  // Step 1: Standard vector retrieval
  const vectorResults = await pool.query(
    `SELECT id, content, 1 - (embedding <=> $1::vector) as score
     FROM document_chunks
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    [JSON.stringify(queryEmbedding), config.vectorTopK]
  );

  // Step 2: Extract entities from query
  const queryEntities = await extractEntitiesAndRelationships(query, llmEndpoint);

  // Step 3: Find related entities via graph traversal
  const graphEntities: Array<{ entity: Entity; depth: number; path: string[] }> = [];
  for (const entity of queryEntities.entities) {
    const related = await kg.traverseGraph(entity.name, config.graphHops);
    graphEntities.push(...related);
  }

  // Step 4: Also do semantic entity search (catches aliases, fuzzy matches)
  const semanticEntities = await kg.findSimilarEntities(queryEmbedding, 10);

  // Step 5: Retrieve chunks linked to graph entities
  const entityIds = [...new Set([
    ...graphEntities.map((ge) => ge.entity.name),
    ...semanticEntities.map((se) => se.name),
  ])];

  const graphChunks = entityIds.length > 0 ? await pool.query(
    `SELECT DISTINCT c.content, c.id
     FROM document_chunks c
     JOIN kg_entity_sources kes ON kes.chunk_id = c.id
     JOIN kg_entities e ON e.id = kes.entity_id
     WHERE LOWER(e.name) = ANY($1)
     LIMIT 20`,
    [entityIds.map((n) => n.toLowerCase())]
  ) : { rows: [] };

  // Step 6: Build graph context summary
  const graphSummary = buildGraphContextSummary(graphEntities);

  // Step 7: Merge and deduplicate
  const allChunks = deduplicateChunks([
    ...vectorResults.rows.map((r: any) => ({ content: r.content, score: r.score, source: 'vector' })),
    ...graphChunks.rows.map((r: any) => ({ content: r.content, score: 0.7, source: 'graph' })),
  ]);

  const mergedContext = [
    `ENTITY RELATIONSHIPS:\n${graphSummary}`,
    `\nRETRIEVED CONTEXT:\n${allChunks.map((c) => c.content).join('\n---\n')}`,
  ].join('\n');

  return {
    vectorChunks: vectorResults.rows,
    graphContext: graphSummary,
    entities: graphEntities.map((ge) => ge.entity),
    mergedContext,
  };
}

function buildGraphContextSummary(
  entities: Array<{ entity: Entity; depth: number; path: string[] }>
): string {
  const lines: string[] = [];
  for (const { entity, path } of entities) {
    if (path.length > 1) {
      lines.push(`- ${path.join(' → ')} (${entity.type})`);
    } else {
      lines.push(`- ${entity.name} (${entity.type}): ${JSON.stringify(entity.properties)}`);
    }
  }
  return lines.join('\n');
}

function deduplicateChunks(
  chunks: Array<{ content: string; score: number; source: string }>
): Array<{ content: string; score: number; source: string }> {
  const seen = new Set<string>();
  const unique: typeof chunks = [];
  for (const chunk of chunks) {
    const key = chunk.content.substring(0, 200);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(chunk);
    }
  }
  return unique.sort((a, b) => b.score - a.score);
}
```

---

## Community Detection for Document Clustering

### Leiden/Louvain Style Clustering via SQL

```typescript
// Simplified community detection using connected components
// For production, use a proper graph library or Neo4j
async function detectCommunities(
  pool: Pool
): Promise<Map<string, string[]>> {
  // Get all relationships
  const result = await pool.query(
    `SELECT s.name as source_name, t.name as target_name, r.type
     FROM kg_relationships r
     JOIN kg_entities s ON s.id = r.source_id
     JOIN kg_entities t ON t.id = r.target_id`
  );

  // Build adjacency list
  const adjacency = new Map<string, Set<string>>();
  for (const row of result.rows) {
    if (!adjacency.has(row.source_name)) adjacency.set(row.source_name, new Set());
    if (!adjacency.has(row.target_name)) adjacency.set(row.target_name, new Set());
    adjacency.get(row.source_name)!.add(row.target_name);
    adjacency.get(row.target_name)!.add(row.source_name);
  }

  // Connected components via BFS
  const visited = new Set<string>();
  const communities = new Map<string, string[]>();
  let communityId = 0;

  for (const node of adjacency.keys()) {
    if (visited.has(node)) continue;

    const community: string[] = [];
    const queue = [node];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      community.push(current);

      for (const neighbor of adjacency.get(current) || []) {
        if (!visited.has(neighbor)) queue.push(neighbor);
      }
    }

    communities.set(`community_${communityId++}`, community);
  }

  return communities;
}

// Generate community summaries for high-level retrieval
async function generateCommunitySummaries(
  communities: Map<string, string[]>,
  pool: Pool,
  llmEndpoint: string
): Promise<Map<string, string>> {
  const summaries = new Map<string, string>();

  for (const [communityId, members] of communities) {
    if (members.length < 2) continue;

    // Get entity details
    const entities = await pool.query(
      `SELECT name, type, properties FROM kg_entities
       WHERE LOWER(name) = ANY($1)`,
      [members.map((m) => m.toLowerCase())]
    );

    // Get relationships within community
    const rels = await pool.query(
      `SELECT s.name as source, t.name as target, r.type
       FROM kg_relationships r
       JOIN kg_entities s ON s.id = r.source_id
       JOIN kg_entities t ON t.id = r.target_id
       WHERE LOWER(s.name) = ANY($1) AND LOWER(t.name) = ANY($1)`,
      [members.map((m) => m.toLowerCase())]
    );

    const prompt = `Summarize this group of related entities and their relationships in 2-3 sentences:
Entities: ${entities.rows.map((e: any) => `${e.name} (${e.type})`).join(', ')}
Relationships: ${rels.rows.map((r: any) => `${r.source} --[${r.type}]--> ${r.target}`).join(', ')}`;

    const summary = await callLLM(prompt, llmEndpoint);
    summaries.set(communityId, summary);
  }

  return summaries;
}
```

---

## Decision Matrix: Graph vs Vector vs Hybrid

| Query Type | Best Approach | Example |
|---|---|---|
| "What is X?" | Vector | "What is a RAG pipeline?" |
| "How does X relate to Y?" | Graph | "How does Clerk auth relate to our billing?" |
| "List all X that have property Y" | Graph | "All agents at SMART tier or above" |
| "Explain X in the context of Y" | Hybrid | "Explain rate limiting in our auth system" |
| "What happened after X?" | Graph (temporal) | "What happened after the DB migration?" |
| Broad exploratory questions | Hybrid + communities | "Tell me about our security architecture" |
| Specific factual lookup | Vector | "What port does Redis run on?" |

---

## Anti-Patterns

- **Over-extracting entities**: Every noun is not an entity. Extract only meaningful domain entities.
- **Ignoring entity resolution**: "Clerk", "Clerk Auth", "ClerkJS" are the same entity. Normalize.
- **Flat graph (no types)**: Without typed relationships, traversal returns noise. Always type edges.
- **Graph without vectors**: Pure graph retrieval misses semantic similarity. Always combine.
- **Not updating the graph**: Knowledge graph is stale the moment you add new documents without re-extracting.
- **Deep traversal without pruning**: 5-hop traversal returns the entire graph. Cap at 2-3 hops.

---

## Key Takeaways

- Graph + vector retrieval covers structural AND semantic relevance
- Entity extraction is the expensive part — do it at ingestion, not query time
- PostgreSQL can serve as both your vector store and graph store (no Neo4j required for moderate scale)
- Community detection enables hierarchical summarization for broad queries
- Always type your relationships — untyped edges are noise
- Start with vector-only, add graph when you hit multi-hop or structural query failures
