# Knowledge Gap Detection — Automated Intelligence Coverage Analysis

## Purpose

This seed teaches the Palace how to systematically discover what it does not know. Knowledge gaps are the silent killers of AI system quality — they do not announce themselves. Users ask questions, get inadequate answers, and leave. The Palace never learns what went wrong because it did not know it was missing something. This seed builds the detection system that finds those gaps before users do.

---

## Core Philosophy

There are three types of knowledge gaps:

1. **Known gaps**: The Palace knows it does not have information about topic X. These are easy — they go on a list and get addressed.
2. **Unknown gaps**: The Palace does not realize it lacks information about topic Y. The user asks, gets a bad answer, and the Palace does not flag it because it thinks it answered adequately.
3. **Structural gaps**: The Palace has information about topic Z but it is organized, connected, or indexed in a way that makes it unretrievable when needed.

Type 1 is a to-do list. Type 2 is the real danger. Type 3 is an architecture problem. This seed addresses all three.

---

## Automated Gap Analysis Framework

### Layer 1: Query Coverage Mapping

Every query that enters the Palace gets classified and tracked. Over time, this builds a map of what users ask about and how well the Palace handles each category.

#### Classification Taxonomy

```
QUERY DOMAINS:
├── Technical
│   ├── Programming Languages (by language)
│   ├── Frameworks & Libraries (by framework)
│   ├── DevOps & Infrastructure
│   ├── Database & Data Engineering
│   ├── Security & Compliance
│   ├── Architecture & Design Patterns
│   └── Debugging & Troubleshooting
├── Business
│   ├── Strategy & Planning
│   ├── Marketing & Growth
│   ├── Finance & Pricing
│   ├── Legal & Compliance
│   ├── Operations & Processes
│   └── HR & Team Management
├── Creative
│   ├── Writing & Content
│   ├── Design & UX
│   ├── Branding & Identity
│   └── Media & Production
├── Personal
│   ├── Productivity & Workflows
│   ├── Learning & Skill Development
│   ├── Career & Professional Growth
│   └── Communication & Relationships
└── System
    ├── Palace Operations
    ├── Agent Capabilities
    ├── Account & Billing
    └── Feature Requests
```

#### Coverage Scoring

For each domain/subdomain, the Palace tracks:

```json
{
  "domain": "Technical > Programming Languages > Rust",
  "total_queries": 47,
  "successful_responses": 12,
  "partial_responses": 18,
  "failed_responses": 17,
  "coverage_score": 0.255,
  "trend": "increasing_demand",
  "relevant_seeds": ["code-smells.md"],
  "dedicated_seed": false,
  "last_assessed": "2026-03-09",
  "priority": "high",
  "notes": "Growing user demand, no dedicated seed, general programming seed insufficient"
}
```

Coverage score formula:
```
coverage = (successful * 1.0 + partial * 0.5) / total_queries
```

Thresholds:
- **Green (> 0.80)**: Well-covered. Maintain and refine.
- **Yellow (0.50-0.80)**: Partially covered. Improvement needed.
- **Red (< 0.50)**: Major gap. Prioritize seed creation.
- **Black (no data)**: Unknown territory. Needs probing.

### Layer 2: Seed-to-Query Alignment Analysis

This layer checks whether existing seeds actually map to the queries users are asking.

#### Alignment Matrix

For each seed, measure:

1. **Utilization Rate**: How often is this seed retrieved during query processing? A seed that is never used might be covering a topic nobody asks about, or it might be poorly indexed.
2. **Hit Rate**: When this seed IS retrieved, how often does it lead to a successful response? A frequently-used seed with low hit rate needs revision.
3. **Coverage Breadth**: What percentage of queries in this seed's domain does it actually address? A seed about "Python debugging" that only covers syntax errors is missing runtime errors, logic errors, performance issues, etc.
4. **Depth Adequacy**: When users ask follow-up questions after a seed-powered response, does the seed have enough depth to handle them? Shallow seeds cause users to hit walls quickly.

```
SEED ALIGNMENT REPORT:
┌─────────────────────────────┬───────┬──────┬───────┬───────┐
│ Seed                        │ Util% │ Hit% │ Bread │ Depth │
├─────────────────────────────┼───────┼──────┼───────┼───────┤
│ first-principles.md         │  34%  │  89% │  0.72 │  0.85 │
│ testing-strategy.md         │  28%  │  76% │  0.65 │  0.70 │
│ code-smells.md              │  45%  │  62% │  0.48 │  0.55 │
│ threat-modeling.md          │  12%  │  91% │  0.80 │  0.88 │
│ scenario-planning.md        │   3%  │  95% │  0.90 │  0.92 │
└─────────────────────────────┴───────┴──────┴───────┴───────┘

INTERPRETATION:
- code-smells.md: High utilization but low hit/breadth = needs expansion
- scenario-planning.md: Low utilization but high quality = indexing problem
- threat-modeling.md: Low utilization, high quality = niche but effective
```

### Layer 3: User Query Failure Analysis

This is the most critical layer. It directly examines queries that did not get satisfactory answers.

#### Failure Categories

**Category A: No Seed Match**
The query was about a topic with no relevant seed. The system had to rely entirely on base model knowledge. These are pure knowledge gaps.

Action: Log the topic, check frequency, prioritize seed creation.

**Category B: Seed Exists But Insufficient**
A relevant seed was retrieved but did not contain enough information to answer the query well. The seed is too shallow or too narrow.

Action: Flag the seed for expansion or revision.

**Category C: Multiple Seeds But No Synthesis**
The answer required combining information from multiple seeds, but the system failed to synthesize them effectively. The knowledge exists in pieces but is not connected.

Action: Create a bridging seed or improve the knowledge dependency graph.

**Category D: Seed Outdated**
A seed was retrieved and used, but the information was stale. The world changed, the seed did not.

Action: Trigger freshness review for the seed and related seeds.

**Category E: Right Knowledge, Wrong Format**
The Palace had the information but presented it in a way the user could not use. Too technical, too simple, wrong language, wrong format.

Action: This is not a knowledge gap but a delivery gap. Route to agent evolution framework.

#### Failure Logging Schema

```json
{
  "failure_id": "f-2026-0309-001",
  "timestamp": "2026-03-09T15:22:00Z",
  "query_hash": "a4b2c1d3...",
  "query_domain": "Technical > Programming Languages > Go",
  "failure_category": "A",
  "agent_used": "agent_07",
  "seeds_retrieved": [],
  "confidence_at_response": 0.35,
  "user_signal": "abandoned_conversation",
  "similar_failures": 8,
  "first_occurrence": "2026-02-15",
  "trend": "increasing",
  "recommended_action": "Create Go programming seed",
  "priority_score": 7.8
}
```

---

## Unknown-Unknown Identification

This is the hardest problem. How do you find gaps you do not know exist?

### Strategy 1: Negative Space Analysis

Look at what users are NOT asking about compared to what they should be asking about based on their profile and usage patterns.

Example: A user who frequently asks about Next.js, TypeScript, and deployment has never asked about testing. This does not mean they do not need testing help — it might mean they do not think the Palace can help with testing, or they have not hit a testing wall yet.

The Palace can proactively surface: "Based on your recent work, you might want to review testing strategies for your Next.js application."

### Strategy 2: Adjacent Domain Probing

For every well-covered domain, check the adjacent domains. Knowledge tends to cluster — if users ask about React, they will eventually ask about:
- State management (Redux, Zustand, Jotai)
- Testing (Jest, React Testing Library, Cypress)
- Performance (profiling, memoization, lazy loading)
- Deployment (Vercel, Netlify, Docker)
- Styling (CSS Modules, Tailwind, styled-components)

If any adjacent domain has no coverage, it is likely a latent gap waiting to surface.

### Strategy 3: Industry Trend Monitoring

New technologies, frameworks, and methodologies emerge constantly. The Palace should track:

- Trending topics on developer platforms (GitHub trending, HackerNews, dev.to)
- New framework releases and adoption curves
- Emerging security threats and compliance requirements
- Shifting industry best practices

Each trend gets a coverage check: "Do we have a seed for this? If it is growing in relevance, should we create one?"

### Strategy 4: Cross-User Pattern Analysis

Aggregate queries across all users to find:

- Topics that multiple users ask about but no single user asks enough to trigger individual gap detection
- Questions that consistently get partial answers — the knowledge exists but is scattered
- Emerging use cases that do not fit existing domain categories

### Strategy 5: Competitor Capability Comparison

What can other AI assistants do that the Palace cannot? This is not about copying — it is about ensuring coverage parity where it matters.

- Review competitor feature announcements
- Test competitor responses to the Palace's weakest query types
- Identify differentiators the Palace should maintain vs gaps it should close

---

## Coverage Mapping Architecture

### The Knowledge Map

The Palace maintains a living map of its knowledge coverage:

```
KNOWLEDGE COVERAGE MAP (simplified):
╔════════════════════════════════════════════╗
║            PALACE KNOWLEDGE MAP            ║
╠════════════════════════════════════════════╣
║                                            ║
║  ████████████░░░  Programming    (78%)     ║
║  ██████████░░░░░  Architecture   (67%)     ║
║  ████████████████  Security      (92%)     ║
║  ██████░░░░░░░░░  Marketing     (40%)     ║
║  ████████████░░░  Business      (75%)     ║
║  ████░░░░░░░░░░░  Creative      (28%)     ║
║  █████████████░░  Operations    (82%)     ║
║  ██████████░░░░░  Data Eng      (65%)     ║
║  ████████████████  Palace Ops    (95%)     ║
║  ██░░░░░░░░░░░░░  Mobile Dev    (15%)     ║
║                                            ║
║  Overall Coverage: 68.7%                   ║
║  Target Coverage:  85.0%                   ║
║  Gap to Close:     16.3%                   ║
║                                            ║
╚════════════════════════════════════════════╝
```

### Map Maintenance

The knowledge map updates:

- **Real-time**: Query classification adds data points
- **Daily**: Coverage scores recalculated
- **Weekly**: Unknown-unknown strategies run, new domains discovered
- **Monthly**: Full map review, priority reassessment

### Map Visualization Levels

1. **L0 — Executive**: Overall coverage percentage, top gaps, trend direction
2. **L1 — Domain**: Per-domain coverage with sub-domain breakdown
3. **L2 — Topic**: Individual topic coverage with query volume and success rates
4. **L3 — Query**: Individual query-level analysis with seed mapping

---

## Gap Prioritization Engine

Not all gaps are equal. The prioritization engine ranks gaps by:

### Factor 1: User Impact (Weight: 40%)

How many users are affected by this gap? How often do they encounter it?

```
impact = query_volume * (1 - coverage_score) * average_user_frustration
```

### Factor 2: Strategic Importance (Weight: 25%)

Does this gap affect the Palace's core value proposition? Is it in a growth area?

- Core functionality gap: 10x multiplier
- Growth area gap: 5x multiplier
- Nice-to-have gap: 1x multiplier

### Factor 3: Fill Difficulty (Weight: 20%)

How hard is it to close this gap?

- Single seed creation: Easy (1)
- Multiple seeds needed: Medium (3)
- Architecture change required: Hard (7)
- External data dependency: Very hard (10)

### Factor 4: Decay Risk (Weight: 15%)

Will this gap get worse over time if not addressed?

- Stable topic (math, logic): Low decay risk
- Fast-moving topic (AI/ML frameworks): High decay risk
- Trend-dependent topic (social media): Very high decay risk

### Priority Score

```
priority = (impact * 0.4) + (strategic * 0.25) + ((10 - difficulty) * 0.2) + (decay_risk * 0.15)
```

---

## Operational Procedures

### Daily Gap Detection Routine

1. Process all queries from the previous 24 hours
2. Classify any new query types not in the taxonomy
3. Update coverage scores for all affected domains
4. Flag any coverage score drops > 5%
5. Generate daily gap report

### Weekly Gap Analysis

1. Run unknown-unknown identification strategies
2. Cluster failure reports by topic and pattern
3. Generate gap prioritization rankings
4. Identify top 3 gaps for next improvement cycle
5. Update the knowledge map

### Monthly Gap Review

1. Full coverage map recalculation
2. Competitor capability comparison
3. Industry trend coverage assessment
4. Present gap report to founder with recommendations
5. Founder approves/reprioritizes gap closure plan

---

## Integration Points

This seed connects to:

- **self-improvement-protocols.md**: Gaps feed into the IMPROVE loop as improvement candidates
- **seed-quality-assessment.md**: Gap detection identifies seeds that need quality improvements
- **knowledge-maintenance-schedule.md**: Gap closure is a maintenance task
- **continuous-learning-pipeline.md**: Learning pipeline can automatically address some gaps
- **knowledge-dependency-graph.md**: Structural gaps are dependency graph problems
- **growth-metrics-tracking.md**: Coverage percentage is a key growth metric

---

## Summary

Knowledge gap detection is not a periodic audit — it is a continuous, automated process that ensures the Palace always knows what it does not know. The three-layer detection system (query coverage, seed alignment, failure analysis) catches known and structural gaps. The five unknown-unknown strategies (negative space, adjacent domains, trend monitoring, cross-user patterns, competitor comparison) find the hidden gaps.

Every gap gets measured, prioritized, and fed into the improvement pipeline. The knowledge map provides a living picture of coverage. The founder makes final decisions on which gaps to close and when. The Palace never stops looking for what it is missing.
