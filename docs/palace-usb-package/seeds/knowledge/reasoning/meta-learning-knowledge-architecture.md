# Meta-Learning & Knowledge Architecture
# Seed: REASON-3 | Category: Critical Thinking | Topic: Knowledge Design
# RAG Tags: meta-learning, knowledge-graph, spaced-repetition, rag-design, seed-quality, knowledge-architecture

---

## Purpose
The capstone seed that makes all other seeds more effective. How to structure knowledge
for maximum retrieval, spaced repetition theory applied to AI agents, knowledge graph
design, seed quality metrics, and principles for building future seed waves.

---

## 1. Why Knowledge Architecture Matters

### The Problem
```
Raw knowledge is useless without structure.
An agent with 1000 facts but no organization is SLOWER than one with 100 well-organized facts.

The difference between a junior and senior engineer isn't knowledge volume —
it's knowledge ARCHITECTURE: knowing which knowledge to apply WHEN, and
having it organized for instant retrieval.

Goals of knowledge architecture:
  1. RETRIEVABILITY: Can the right knowledge be found when needed?
  2. COMPOSABILITY: Can knowledge pieces combine to solve novel problems?
  3. ACCURACY: Is the knowledge correct and current?
  4. ACTIONABILITY: Does the knowledge lead to concrete actions?
  5. EFFICIENCY: Is knowledge stored without redundancy?
```

---

## 2. Knowledge Structure for Maximum Retrieval

### The SCARS Framework (for every knowledge unit)
```
S — SITUATION:  When does this knowledge apply?
    "When building an API endpoint that handles user data..."

C — CONTEXT:    What background is needed?
    "Given that Stone AI uses Zod .strict() for all mutations..."

A — ACTION:     What should be done?
    "Validate all input with Zod schema before processing..."

R — RESULT:     What's the expected outcome?
    "Invalid requests return 400 with structured error details..."

S — SIGNALS:    How do you know this is the right knowledge to apply?
    "Triggered by: new API endpoint, user input handling, mutation route"

This structure enables:
  - RAG retrieval via situation/signal matching
  - Agent decision-making via context matching
  - Action execution via concrete steps
  - Verification via expected results
```

### Optimal Knowledge Unit Size
```
Too small: "Use gp3 instead of gp2" (no context, no reasoning)
Too large: 500-page AWS documentation (can't be processed effectively)

Optimal: 300-500 lines per seed
  - Complete enough to act on without external references
  - Focused enough to retrieve accurately
  - Structured enough to parse quickly
  - Deep enough to handle edge cases

Each seed should answer ONE question deeply:
  "How do I optimize AWS costs?" → cloud-cost-optimization.md
  "How do I defend against prompt injection?" → ai-ml-security.md

NOT: "Everything about AWS" (too broad)
NOT: "Use S3 Intelligent-Tiering" (too narrow, no context)
```

### Tagging Strategy for RAG
```
Every seed needs THREE levels of tags:

Level 1 — DOMAIN TAGS (broad):
  cloud, security, reasoning, frontend, backend, database

Level 2 — TOPIC TAGS (specific):
  aws, terraform, prompt-injection, bayesian, react, prisma

Level 3 — TRIGGER TAGS (situational):
  cost-optimization, api-security, decision-making, deployment

Tag placement:
  - In the seed header (RAG Tags line) for indexing
  - In section headers for sub-topic retrieval
  - In code comments for implementation-level retrieval

Example retrieval flow:
  User query: "How should I handle cold starts in Lambda?"
  RAG matches: "lambda" (Level 2) + "cold-start" (Level 3)
  Returns: aws-serverless-architecture.md, Section 1 (Lambda Deep Dive)
```

---

## 3. Knowledge Graph Design for Agents

### Agent Knowledge Graph Structure
```
The seed library is not a flat collection — it's a GRAPH.

Nodes = Seeds (knowledge units)
Edges = Relationships between seeds

Relationship types:
  DEPENDS_ON:    "api-security-advanced" depends on "zero-trust-architecture"
  EXTENDS:       "aws-serverless" extends "aws-core-services"
  CONFLICTS:     (rare) Two approaches that can't coexist
  COMPLEMENTS:   "adversarial-thinking" complements "api-security"
  SUPERSEDES:    New seed replaces outdated one
  SPECIALIZES:   "prompt-injection" specializes "ai-ml-security"

Graph enables:
  1. When agent retrieves one seed, automatically suggest related seeds
  2. Conflict detection: Don't recommend two conflicting approaches
  3. Dependency ordering: Read foundational seeds before advanced ones
  4. Gap detection: Find areas with no seed coverage
```

### Knowledge Graph Implementation
```typescript
// knowledge-graph.ts — Seed relationship registry

interface SeedNode {
  id: string;               // e.g., "INFRA-1"
  file: string;             // e.g., "aws-core-services-patterns.md"
  domain: string;           // e.g., "infrastructure"
  tags: string[];           // RAG tags
  dependencies: string[];   // Seeds that should be read first
  related: string[];        // Seeds that complement this one
  supersedes?: string;      // Older seed this replaces
}

const KNOWLEDGE_GRAPH: SeedNode[] = [
  {
    id: "INFRA-1",
    file: "aws-core-services-patterns.md",
    domain: "infrastructure",
    tags: ["aws", "ec2", "s3", "lambda", "iam", "vpc", "rds", "dynamodb"],
    dependencies: [],
    related: ["INFRA-2", "INFRA-6", "INFRA-7"],
  },
  {
    id: "INFRA-2",
    file: "aws-serverless-architecture.md",
    domain: "infrastructure",
    tags: ["lambda", "api-gateway", "step-functions", "sqs", "sns", "dynamodb"],
    dependencies: ["INFRA-1"],
    related: ["INFRA-6", "SEC-3"],
  },
  {
    id: "SEC-1",
    file: "ai-ml-security.md",
    domain: "security",
    tags: ["prompt-injection", "guardrails", "jailbreak", "llm-security"],
    dependencies: [],
    related: ["SEC-3", "REASON-1", "GOLD-1"],
  },
  {
    id: "GOLD-1",
    file: "golden-i-dont-know-triggers.md",
    domain: "reasoning",
    tags: ["hallucination", "uncertainty", "retrieval", "confidence"],
    dependencies: [],
    related: ["GOLD-2", "REASON-3"],
  },
  // ... all seeds registered
];

// Query: "What seeds should I read to understand API security?"
function getReadingPath(targetId: string): SeedNode[] {
  const target = KNOWLEDGE_GRAPH.find(s => s.id === targetId);
  if (!target) return [];

  const path: SeedNode[] = [];
  const visited = new Set<string>();

  function addWithDeps(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const node = KNOWLEDGE_GRAPH.find(s => s.id === id);
    if (!node) return;
    for (const dep of node.dependencies) {
      addWithDeps(dep);
    }
    path.push(node);
  }

  addWithDeps(targetId);
  return path;
}

// getReadingPath("SEC-3") returns: [INFRA-1 (dependency), SEC-3]
```

---

## 4. Spaced Repetition Applied to AI Agents

### The Forgetting Curve Problem
```
Humans forget 80% of new information within 24 hours without reinforcement.
AI agents don't "forget" but they have an analogous problem:

CONTEXT WINDOW DISPLACEMENT:
  As conversation grows, earlier context is pushed out or compressed.
  Knowledge from seed retrieval at the start of a task becomes
  less "present" as the agent processes more information.

RELEVANCE DECAY:
  A seed retrieved at the start of a multi-step task may become
  less relevant as the task evolves. But PARTS of it may become
  MORE relevant later.

INTERFERENCE:
  Multiple retrieved seeds may contain conflicting patterns.
  The last-read seed has recency bias in the agent's processing.
```

### Spaced Retrieval Strategy
```
Apply spaced repetition principles to RAG:

1. INITIAL RETRIEVAL: Pull relevant seeds at task start

2. PROGRESSIVE RETRIEVAL: As the task evolves, pull more specific seeds
   Step 1: General architecture seed
   Step 2: Specific service seed
   Step 3: Security seed for that service
   Step 4: Testing/validation seed

3. REINFORCEMENT: Re-retrieve critical information at decision points
   Before writing code: re-retrieve security patterns
   Before deploying: re-retrieve deployment checklist
   Before presenting: re-retrieve quality criteria

4. INTERLEAVING: Mix knowledge from different domains
   Don't retrieve 5 infrastructure seeds in a row.
   Interleave: infra → security → infra → testing → security
   This creates stronger cross-domain connections.
```

---

## 5. Seed Quality Metrics

### Quality Scoring Framework
```
Each seed is evaluated on 7 dimensions (1-10 each):

ACCURACY (weight: 25%)
  Is the information correct and current?
  Are code examples working and tested?
  Are external references valid?

ACTIONABILITY (weight: 20%)
  Can an agent immediately act on this knowledge?
  Are there concrete steps, not just theory?
  Are there decision frameworks, not just information?

RETRIEVABILITY (weight: 15%)
  Can RAG find this seed for the right queries?
  Are tags comprehensive and accurate?
  Is the title descriptive?

DEPTH (weight: 15%)
  Does it cover edge cases?
  Does it explain WHY, not just WHAT?
  Does it address common mistakes?

STRUCTURE (weight: 10%)
  Is it well-organized with clear sections?
  Can information be found by scanning headers?
  Are code examples properly formatted?

COMPOSABILITY (weight: 10%)
  Can this seed combine with others effectively?
  Does it reference related seeds?
  Does it use consistent terminology?

CURRENCY (weight: 5%)
  When was it last validated?
  Does it reference current versions of tools/services?
  Are deprecated approaches marked?

QUALITY SCORE = Weighted average of all dimensions
  9-10: Gold standard — reference for other seeds
  7-8:  Production quality — ready for agent use
  5-6:  Needs improvement — usable but has gaps
  3-4:  Significant issues — needs rewrite
  1-2:  Unusable — incorrect or severely outdated
```

### Seed Review Checklist
```
Before publishing any seed:
  □ Title clearly describes the knowledge domain
  □ RAG tags cover all relevant search terms
  □ Purpose section explains what agents will use this for
  □ Content is 300-500 lines (within range)
  □ Code examples are syntactically correct
  □ Code examples include error handling
  □ Anti-patterns are clearly marked
  □ Decision frameworks include "when to use" and "when NOT to use"
  □ External tools/services include version numbers
  □ Related seeds are referenced
  □ Last validation date is included
  □ No contradictions with other seeds
  □ Stone AI-specific examples where relevant
```

---

## 6. Knowledge Gap Detection

### Systematic Gap Analysis
```
Process for finding what's missing:

1. DOMAIN MAPPING
   List all domains the system operates in:
   ✓ Cloud infrastructure (AWS, GCP, Azure)
   ✓ Cybersecurity (AI security, supply chain, API, zero trust, DFIR)
   ✓ Critical thinking (adversarial, quantitative, meta-learning)
   ✓ Claude patterns (decomposition, few-shot, compression, error recovery)
   ✓ Golden seeds (hallucination, meta-reasoning, lookup, fallback, decomposition)
   ? Frontend patterns (React, Next.js, Tailwind)
   ? Backend patterns (Node.js, Prisma, API design)
   ? Database patterns (PostgreSQL, pgvector, migrations)
   ? DevOps (CI/CD, Docker, Vercel, monitoring)
   ? Business (pricing, growth, retention, analytics)
   ? Legal/Compliance (GDPR, CCPA, ToS, privacy)

2. FREQUENCY ANALYSIS
   What questions do agents encounter most?
   Track retrieval queries, find queries with no good matches.
   Those queries = knowledge gaps.

3. FAILURE ANALYSIS
   When agents give wrong answers, what knowledge was missing?
   Each incorrect response = potential seed topic.

4. CROSS-REFERENCE CHECK
   For each existing seed, what seeds SHOULD it reference?
   If the referenced seed doesn't exist, that's a gap.
```

### Priority Matrix for New Seeds
```
                    HIGH FREQUENCY ──────────────────→ LOW FREQUENCY
HIGH IMPACT ┌─────────────────────┬──────────────────────┐
            │ P1: BUILD NOW       │ P2: BUILD SOON       │
            │ Critical gaps that  │ Important but less    │
            │ agents hit daily    │ frequently needed     │
            │                     │                       │
            │ Example:            │ Example:              │
            │ - Next.js patterns  │ - Legal compliance    │
            │ - Prisma patterns   │ - Advanced SQL        │
            ├─────────────────────┼──────────────────────┤
            │ P3: SCHEDULE        │ P4: BACKLOG           │
            │ Common but less     │ Rare and niche        │
            │ critical knowledge  │                       │
            │                     │                       │
LOW IMPACT  │ Example:            │ Example:              │
            │ - CSS tricks        │ - Legacy migration    │
            │ - Git workflows     │ - Obscure protocols   │
            └─────────────────────┴──────────────────────┘
```

---

## 7. Principles for Future Seed Waves

### Seed Design Principles
```
1. ONE SEED = ONE QUESTION ANSWERED DEEPLY
   Not "everything about X" but "how to DO X well"

2. TEACH THE WHY, NOT JUST THE WHAT
   "Use gp3 instead of gp2" → bad
   "Use gp3 instead of gp2 because: 20% cheaper, higher baseline IOPS,
   no burst credits to manage, and identical max throughput" → good

3. INCLUDE ANTI-PATTERNS
   Knowing what NOT to do is as valuable as knowing what TO do.
   Every seed should have a "common mistakes" or "anti-patterns" section.

4. DECISION FRAMEWORKS OVER PRESCRIPTIONS
   "Always use Lambda" → bad (context-dependent)
   "Use Lambda when X, use Fargate when Y, use EC2 when Z" → good

5. CONCRETE OVER ABSTRACT
   "Validate input thoroughly" → too abstract
   "Use Zod .strict() with defined schemas on every mutation endpoint" → actionable

6. CROSS-REFERENCE OTHER SEEDS
   No seed is an island. Reference related seeds.
   Build the knowledge graph, not a flat file system.

7. INCLUDE STONE AI CONTEXT
   Generic knowledge is available everywhere.
   Our seeds should include Stone AI-specific applications.
   "Here's how this applies to our 40-agent architecture..."

8. DATE EVERYTHING
   "Best practice" without a date is useless.
   Technology changes. What was true in 2024 may not be true in 2027.
   Every seed has a "last validated" date.

9. PROGRESSIVE DEPTH
   Start with the 80% case (what most agents need most of the time).
   Then go deeper for the 20% of complex cases.
   Structure: Overview → Common patterns → Advanced patterns → Edge cases

10. MAKE RETRIEVAL EASY
    Clear titles, comprehensive tags, structured headers.
    An agent should find the right seed in <2 retrieval attempts.
```

### Seed Wave Planning
```
Wave 1 (Complete): Infrastructure + Security + Reasoning foundations
  24 seeds covering cloud, security, thinking, Claude patterns, golden seeds

Wave 2 (Next): Application Development
  - Next.js patterns and anti-patterns
  - React component architecture
  - Prisma schema design and query optimization
  - PostgreSQL performance tuning
  - TypeScript advanced patterns
  - Testing strategies (unit, integration, E2E)
  - Accessibility (a11y) standards

Wave 3: Operations & Business
  - CI/CD pipeline patterns
  - Docker optimization
  - Vercel deployment strategies
  - Monitoring and alerting playbook
  - Growth hacking strategies
  - Pricing optimization
  - Customer retention frameworks

Wave 4: Specialized
  - Mobile development (React Native / Flutter)
  - ML/AI model optimization
  - Legal compliance (GDPR, CCPA, accessibility)
  - Enterprise sales playbook
  - Competitive intelligence frameworks

Each wave: 15-25 seeds, 300-500 lines each, fully reviewed against quality metrics.
```

---

## 8. Knowledge Maintenance Protocol

### Ongoing Maintenance
```
MONTHLY:
  - Review seeds referenced in failed agent responses
  - Update code examples for library version changes
  - Check external links and references

QUARTERLY:
  - Full quality audit of all seeds (scoring framework)
  - Gap analysis against agent query logs
  - Remove or update deprecated content
  - Merge seeds that have too much overlap
  - Split seeds that have grown too large

ANNUALLY:
  - Major version update of all seeds
  - Architecture review of knowledge graph
  - Retire seeds for deprecated technologies
  - Plan next seed wave based on business evolution
```

### Version Control for Seeds
```
Seed versioning:
  v1.0 — Initial creation
  v1.1 — Minor updates (typos, clarifications)
  v1.2 — Code example updates
  v2.0 — Major rewrite (new patterns, restructured)

Track in git with meaningful commit messages:
  "Update aws-core-services: gp3 pricing change, add Graviton3 comparison"
  "Rewrite api-security-advanced: add GraphQL section, update OWASP 2023"

Every seed has a "Last validated" date in the footer.
If that date is >6 months old, the seed needs review.
```

---

## 9. The Meta-Learning Loop

```
The ultimate goal: A system that LEARNS HOW TO LEARN.

1. Agents use seeds to solve problems
2. Track which seeds were used and whether they helped
3. Seeds that are frequently retrieved but don't help → need improvement
4. Seeds that are never retrieved → need better tags or may be unnecessary
5. Queries with no matching seed → knowledge gap → new seed needed
6. Successful problem-solving patterns → new seeds or seed improvements
7. Failed problem-solving → post-mortem → seed creation or revision

This creates a FLYWHEEL:
  Better seeds → Better agent performance → Better feedback →
  Better seeds → Better agent performance → ...

The meta-learning seed (this document) ensures the flywheel keeps spinning.
Every person and agent building seeds should read this first.
```

---

*This seed is maintained by the Knowledge Architecture team. Last validated: 2026-03.*
