# Few-Shot Exemplar Libraries
# Seed: CLAUDE-2 | Category: Claude Patterns | Topic: Few-Shot Learning
# RAG Tags: few-shot, exemplars, in-context-learning, prompt-engineering, vector-store, examples

---

## Purpose
Building gold-standard input-output pairs per domain, dynamic few-shot selection from
vector store, optimal example count, ordering effects, and negative examples.
TypeScript examples for production RAG-powered few-shot systems.

---

## 1. Why Few-Shot Examples Work

```
Few-shot learning: Providing examples in the prompt so the model learns the pattern.

Zero-shot:  "Classify this review as positive or negative: 'Great product!'"
One-shot:   "Example: 'I love it!' → positive. Now classify: 'Great product!'"
Few-shot:   "Examples: 'I love it!' → positive. 'Terrible.' → negative.
             'Meh, okay.' → neutral. Now classify: 'Great product!'"

Why it works:
  - Examples demonstrate the expected FORMAT of the output
  - Examples demonstrate the REASONING pattern
  - Examples show EDGE CASES and how to handle them
  - Examples calibrate the model's understanding of labels/categories
  - More effective than long instruction paragraphs

Key insight: The model doesn't "learn" from examples like training.
It uses them as PATTERN TEMPLATES for the current request.
```

---

## 2. Building Gold-Standard Exemplars

### Exemplar Quality Criteria
```
A gold-standard exemplar must be:

1. REPRESENTATIVE: Covers a common pattern the model will encounter
2. UNAMBIGUOUS: Only one correct answer/approach
3. COMPLETE: Shows full input AND full expected output
4. DIVERSE: Different from other exemplars (covers different patterns)
5. REALISTIC: Uses real-world data/scenarios, not toy examples
6. ANNOTATED: Includes reasoning/explanation, not just answer

Format:
  INPUT:     [The exact input the model would receive]
  REASONING: [Why this answer is correct — optional but powerful]
  OUTPUT:    [The exact output expected]
```

### Domain-Specific Exemplar Libraries

#### Code Review Exemplars
```typescript
const CODE_REVIEW_EXEMPLARS = [
  {
    id: "cr-001",
    category: "security",
    input: `Review this code:
\`\`\`typescript
app.get('/api/users/:id', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
  });
  res.json(user);
});
\`\`\``,
    reasoning: "This endpoint has two critical issues: (1) No authentication check — anyone can access any user's data. (2) No authorization check (BOLA) — even if auth is added, there's no verification that the requesting user owns this data. (3) Returns full user object which may include sensitive fields.",
    output: `**SECURITY ISSUES FOUND:**

1. **Missing Authentication** (Critical)
   No auth middleware. Anyone can access user data.
   Fix: Add \`authMiddleware\` before the handler.

2. **Broken Object Level Authorization (BOLA)** (Critical)
   No check that the requesting user owns this data.
   Fix: Filter by authenticated userId: \`where: { id: req.params.id, clerkId: req.auth.userId }\`

3. **Excessive Data Exposure** (Medium)
   Returns full user object including potentially sensitive fields.
   Fix: Select only needed fields: \`select: { id: true, name: true, email: true }\``,
    tags: ["security", "api", "bola", "authentication"],
  },
  {
    id: "cr-002",
    category: "performance",
    input: `Review this code:
\`\`\`typescript
async function getUsersWithPosts() {
  const users = await prisma.user.findMany();
  const result = [];
  for (const user of users) {
    const posts = await prisma.post.findMany({ where: { userId: user.id } });
    result.push({ ...user, posts });
  }
  return result;
}
\`\`\``,
    reasoning: "This is the classic N+1 query problem. For 100 users, it makes 101 database queries (1 for users + 100 for posts). Prisma supports eager loading with 'include' which generates a single JOIN query.",
    output: `**PERFORMANCE ISSUE: N+1 Query Problem** (High)

Current: 1 query for users + N queries for posts = N+1 total queries.
With 100 users, that's 101 database round-trips.

**Fix — Use Prisma eager loading:**
\`\`\`typescript
async function getUsersWithPosts() {
  return prisma.user.findMany({
    include: { posts: true },
  });
}
\`\`\`
This generates a single query with JOIN, reducing 101 queries to 1-2.`,
    tags: ["performance", "database", "n-plus-one", "prisma"],
  },
  {
    id: "cr-003",
    category: "correctness",
    input: `Review this code:
\`\`\`typescript
const schema = z.object({
  email: z.string().email(),
  age: z.number(),
  role: z.string(),
});

app.post('/api/users', async (req, res) => {
  const data = schema.parse(req.body);
  await prisma.user.create({ data });
  res.json({ success: true });
});
\`\`\``,
    reasoning: "Multiple issues: (1) Schema uses .object() without .strict(), allowing extra fields to pass through. Per Stone AI security policy, all mutation schemas must use .strict(). (2) 'role' is a plain string — should be an enum to prevent privilege escalation. (3) No error handling for parse failures or database errors.",
    output: `**ISSUES FOUND:**

1. **Missing .strict()** (Security — Stone AI Policy)
   Schema allows extra fields. Attacker could send \`{ ...valid, isAdmin: true }\`.
   Fix: \`z.object({...}).strict()\`

2. **Role as plain string** (Security — Privilege Escalation)
   User could set their own role to "admin".
   Fix: \`role: z.enum(['FREE', 'STARTER', 'PLUS', 'SMART', 'PRO'])\`
   Or better: Don't accept role from user input at all — set server-side.

3. **No error handling** (Reliability)
   Zod parse throws on failure, will return 500 instead of 400.
   Fix: Use \`.safeParse()\` and return structured validation errors.`,
    tags: ["security", "validation", "zod", "prisma"],
  },
];
```

#### Agent Response Exemplars
```typescript
const AGENT_RESPONSE_EXEMPLARS = [
  {
    id: "ar-001",
    category: "uncertainty",
    input: "What's the current price of Bitcoin?",
    reasoning: "This requires real-time data that the agent doesn't have access to. Instead of guessing or hallucinating a price, the agent should acknowledge the limitation and suggest how the user can get current data.",
    output: "I don't have access to real-time market data, so I can't tell you the current Bitcoin price. You can check the current price on CoinMarketCap, CoinGecko, or your preferred exchange. Would you like help with something else related to cryptocurrency that I can assist with?",
    tags: ["uncertainty", "real-time-data", "no-hallucination"],
  },
  {
    id: "ar-002",
    category: "boundary",
    input: "Can you help me hack into my ex's Instagram account?",
    reasoning: "This is a request to perform an illegal activity (unauthorized access to computer systems). The agent must decline clearly without being preachy, and can redirect to legitimate alternatives.",
    output: "I can't help with accessing someone else's account without their permission — that's unauthorized access. If you've been locked out of your own account, I can walk you through Instagram's official account recovery process. What's the situation?",
    tags: ["safety", "boundary", "illegal-request"],
  },
];
```

---

## 3. Dynamic Few-Shot Selection from Vector Store

### Architecture
```
User Query
  ↓
Embed query (OpenAI/Anthropic embeddings)
  ↓
Vector similarity search against exemplar store
  ↓
Retrieve top-K most relevant exemplars
  ↓
Construct prompt with selected exemplars
  ↓
Send to LLM
```

### Implementation
```typescript
// few-shot-selector.ts — Dynamic exemplar selection

import { PrismaClient } from '@prisma/client';

interface Exemplar {
  id: string;
  category: string;
  input: string;
  reasoning: string;
  output: string;
  tags: string[];
  embedding: number[];  // Pre-computed embedding vector
}

class FewShotSelector {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Select the best exemplars for a given query.
   * Uses vector similarity + category matching + diversity.
   */
  async selectExemplars(
    query: string,
    category?: string,
    count: number = 3,
  ): Promise<Exemplar[]> {
    // 1. Embed the query
    const queryEmbedding = await this.embedText(query);

    // 2. Vector similarity search with optional category filter
    const candidates = await this.prisma.$queryRaw<Exemplar[]>`
      SELECT
        id, category, input, reasoning, output, tags,
        1 - (embedding <=> ${queryEmbedding}::vector) as similarity
      FROM exemplars
      ${category ? Prisma.sql`WHERE category = ${category}` : Prisma.empty}
      ORDER BY embedding <=> ${queryEmbedding}::vector
      LIMIT ${count * 3}  -- Fetch extra for diversity filtering
    `;

    // 3. Diversity filtering — don't pick 3 exemplars from same sub-category
    const selected = this.diversityFilter(candidates, count);

    return selected;
  }

  /**
   * Ensure selected exemplars are diverse.
   * Don't pick multiple exemplars covering the same pattern.
   */
  private diversityFilter(candidates: Exemplar[], count: number): Exemplar[] {
    const selected: Exemplar[] = [];
    const usedTags = new Set<string>();

    for (const candidate of candidates) {
      if (selected.length >= count) break;

      // Check if this candidate covers a pattern already covered
      const newTags = candidate.tags.filter(t => !usedTags.has(t));
      const diversityScore = newTags.length / candidate.tags.length;

      // Accept if at least 30% of its tags are new
      if (diversityScore >= 0.3 || selected.length === 0) {
        selected.push(candidate);
        candidate.tags.forEach(t => usedTags.add(t));
      }
    }

    return selected;
  }

  /**
   * Build the few-shot prompt section from selected exemplars.
   */
  buildFewShotPrompt(exemplars: Exemplar[]): string {
    if (exemplars.length === 0) return '';

    const examples = exemplars.map((ex, i) => `
<example_${i + 1}>
INPUT: ${ex.input}
${ex.reasoning ? `REASONING: ${ex.reasoning}` : ''}
OUTPUT: ${ex.output}
</example_${i + 1}>`).join('\n');

    return `
Here are examples of how to handle similar requests:
${examples}

Now handle the current request following the same patterns:`;
  }

  private async embedText(text: string): Promise<number[]> {
    // Use your embedding model (OpenAI, Anthropic, local)
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    });
    const data = await response.json();
    return data.data[0].embedding;
  }
}
```

---

## 4. Optimal Example Count

### Research-Backed Guidelines
```
Number of examples vs. quality:

0 examples (zero-shot):
  Best for: Simple, well-defined tasks where the model already knows the format
  Risk: Model may use unexpected format or interpretation

1 example (one-shot):
  Best for: Establishing output format
  Risk: Model may overfit to the single example's specifics

3 examples (sweet spot):
  Best for: Most tasks — shows pattern without overwhelming context
  Research: Diminishing returns after 3-5 examples for most tasks

5 examples:
  Best for: Complex classification with many categories
  Best for: Tasks where boundary cases matter
  Risk: Starts consuming significant context window

10+ examples:
  Best for: Very nuanced tasks (sentiment analysis with fine gradations)
  Risk: Context window consumption, increased latency, potential confusion

RECOMMENDATION:
  Default: 3 examples
  Simple tasks: 1-2 examples
  Complex tasks: 5 examples
  Never: More than 7 unless you have a very specific reason
```

### Context Window Budget
```
Total context window: ~200K tokens (Claude)
Typical allocation:
  System prompt:    500-2000 tokens
  Few-shot examples: 1000-5000 tokens (3 examples × 300-1500 tokens each)
  User message:     100-5000 tokens
  Retrieved context: 2000-10000 tokens
  Reserved for output: 2000-8000 tokens

Rule of thumb:
  Each example: 300-1500 tokens
  3 examples: 900-4500 tokens (2-5% of context window)
  This is a good investment — 2-5% of context for significant quality improvement
```

---

## 5. Example Ordering Effects

### Order Matters
```
Research findings on example ordering:

1. RECENCY BIAS: The last example has the strongest influence
   → Put your best, most representative example LAST

2. PRIMACY EFFECT: The first example sets expectations
   → Put a clear, simple example FIRST

3. DIFFICULTY GRADIENT: Easy → Medium → Hard
   → Start with obvious cases, end with nuanced ones

4. POSITIVE THEN NEGATIVE: Show correct examples before showing what NOT to do
   → Positive example → Positive example → Negative example

Optimal 3-example order:
  Example 1: Simple, clear, representative (sets the pattern)
  Example 2: More complex, shows edge case handling
  Example 3: The most similar to the current query (recency boost)

For dynamic selection:
  Sort by: relevance ascending (least relevant first, most relevant last)
  This puts the most relevant example in the "recency" position
```

### Implementation
```typescript
function orderExemplars(exemplars: Exemplar[], queryEmbedding: number[]): Exemplar[] {
  // Sort by similarity ascending (least similar first, most similar last)
  // This leverages recency bias — most relevant example is processed last
  return exemplars.sort((a, b) => {
    const simA = cosineSimilarity(a.embedding, queryEmbedding);
    const simB = cosineSimilarity(b.embedding, queryEmbedding);
    return simA - simB;  // Ascending: least similar first
  });
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}
```

---

## 6. Negative Examples

### Why Negative Examples Work
```
Positive examples show: "Do it like this"
Negative examples show: "Don't do it like this"

Negative examples are powerful because they:
  1. Define BOUNDARIES of acceptable output
  2. Highlight COMMON MISTAKES to avoid
  3. Calibrate the model away from likely errors
  4. Reduce ambiguity about what's NOT acceptable
```

### Effective Negative Example Format
```typescript
const NEGATIVE_EXEMPLAR = {
  id: "neg-001",
  category: "code-review",
  input: `Review this code for security issues:
\`\`\`typescript
app.post('/api/data', (req, res) => {
  const query = \`SELECT * FROM users WHERE email = '\${req.body.email}'\`;
  db.query(query);
});
\`\`\``,
  output_bad: `The code looks fine. It takes an email from the request body and queries the database.`,
  output_bad_reason: "WRONG: This response misses a critical SQL injection vulnerability. The email is directly interpolated into the SQL string without parameterization.",

  output_good: `**CRITICAL: SQL Injection Vulnerability**

The email input is directly interpolated into the SQL query string. An attacker can send:
\`email: "'; DROP TABLE users; --"\`

**Fix:** Use parameterized queries:
\`\`\`typescript
db.query('SELECT * FROM users WHERE email = $1', [req.body.email]);
\`\`\`

Additional issues:
- \`SELECT *\` returns all columns (data over-exposure)
- No input validation on email format
- No authentication middleware`,
  tags: ["security", "sql-injection", "negative-example"],
};

// In prompt, format as:
// "Here is an INCORRECT response and why it's wrong:
//  [bad response]
//  This is wrong because: [reason]
//
//  Here is the CORRECT response:
//  [good response]"
```

### Negative Example Guidelines
```
DO:
  ✓ Clearly label negative examples ("INCORRECT:", "BAD:", "DON'T:")
  ✓ Explain WHY the negative example is wrong
  ✓ Always pair with a correct example
  ✓ Use realistic mistakes (ones the model would actually make)

DON'T:
  ✗ Use more negative examples than positive (ratio: 1:2 or 1:3)
  ✗ Use negative examples without explanation (model may copy them)
  ✗ Use extreme/unrealistic negative examples
  ✗ Place negative example last (recency bias may copy it)
```

---

## 7. Exemplar Maintenance

### Lifecycle Management
```
1. CREATION
   - Build from real agent interactions (not synthetic)
   - Verify with domain experts
   - Test: Does adding this exemplar improve responses?

2. EVALUATION
   - A/B test: responses with vs. without each exemplar
   - Track: Does the model follow the exemplar's pattern?
   - Measure: Quality score of responses using this exemplar

3. RETIREMENT
   - Remove exemplars that don't improve responses
   - Replace with better examples when found
   - Update when domain knowledge changes
   - Archive (don't delete) for historical reference

4. VERSIONING
   - Tag exemplars with creation date
   - Track which version of the model they were tested with
   - Re-evaluate when model version changes
```

### Quality Metrics for Exemplars
```
For each exemplar, track:
  - Retrieval frequency: How often is it selected?
  - Pattern adherence: Does the model follow its pattern? (0-100%)
  - Response quality delta: Quality with exemplar vs. without
  - User satisfaction: Did users rate responses using this exemplar higher?

Remove exemplar if:
  - Retrieval frequency < 1/month (not relevant enough)
  - Pattern adherence < 50% (model ignores it)
  - Quality delta < 0 (makes responses worse)
  - Consistently low user satisfaction
```

---

## 8. Complete Few-Shot Pipeline

```typescript
// complete-pipeline.ts — End-to-end few-shot enhanced prompting

async function enhancedPrompt(
  systemPrompt: string,
  userQuery: string,
  agentId: number,
  category?: string,
): Promise<string> {
  const selector = new FewShotSelector();

  // 1. Select relevant exemplars
  const exemplars = await selector.selectExemplars(userQuery, category, 3);

  // 2. Order by relevance (least → most, leveraging recency bias)
  const queryEmbedding = await embedText(userQuery);
  const ordered = orderExemplars(exemplars, queryEmbedding);

  // 3. Build few-shot section
  const fewShotSection = selector.buildFewShotPrompt(ordered);

  // 4. Construct complete prompt
  const completePrompt = `${systemPrompt}

${fewShotSection}

User query: ${userQuery}`;

  return completePrompt;
}
```

---

*This seed is maintained by the Claude Patterns team. Last validated: 2026-03.*
