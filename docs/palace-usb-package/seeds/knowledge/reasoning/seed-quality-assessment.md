# Seed Quality Assessment — Evaluation, Freshness, and Pruning Framework

## Purpose

This seed teaches the Palace how to evaluate the quality of its own knowledge seeds, score them for freshness, measure depth and coverage, detect redundancy across seeds, and make pruning decisions. A knowledge base is only as good as its worst seed — one bad seed retrieved at the wrong moment can ruin a user interaction. This framework ensures every seed earns its place.

---

## Core Philosophy

Seeds are not permanent. They are living documents that must justify their existence with data. A seed that was excellent six months ago might be mediocre today because the topic evolved, user needs shifted, or better approaches emerged. The Palace does not hoard knowledge — it curates it.

### The Three Laws of Seed Quality

1. **Every seed must be retrievable**: A seed that is never used is dead weight. It consumes storage, pollutes search results, and creates false confidence in coverage.
2. **Every seed must be accurate**: A seed with outdated or incorrect information is worse than no seed at all. Wrong answers delivered confidently destroy user trust.
3. **Every seed must be deep enough**: A seed that gives surface-level answers when users need depth is a tease. It creates the impression the Palace understands a topic when it actually does not.

---

## Quality Evaluation Framework

### Dimension 1: Accuracy (Weight: 30%)

How factually correct is the information in this seed?

#### Assessment Methods

**Automated Fact-Checking**
- Cross-reference key claims against authoritative sources
- Flag any statistics, dates, or version numbers that may have changed
- Check code examples for syntax correctness and best-practice adherence

**Expert Review**
- Founder or designated expert reviews seed content
- Domain-specific claims verified against current standards
- Edge cases and exceptions checked for completeness

**User Feedback Integration**
- Track corrections submitted by users after seed-powered responses
- If users consistently correct information from a specific seed, that seed is degrading
- Weight recent corrections more heavily than old confirmations

#### Accuracy Score

```
accuracy = (verified_claims / total_claims) * (1 - correction_rate)
```

- **A (0.95-1.00)**: Excellent. All claims verified, no user corrections.
- **B (0.85-0.94)**: Good. Minor updates needed, rare corrections.
- **C (0.70-0.84)**: Acceptable. Several claims need verification.
- **D (0.50-0.69)**: Poor. Significant inaccuracies detected.
- **F (< 0.50)**: Failed. Seed is actively providing wrong information.

### Dimension 2: Depth (Weight: 25%)

How thoroughly does this seed cover its topic?

#### Depth Assessment Criteria

1. **Concept Coverage**: Does the seed explain the foundational concepts, not just the surface-level how-to?
2. **Nuance Handling**: Does the seed address edge cases, exceptions, and "it depends" scenarios?
3. **Practical Application**: Does the seed include concrete examples, code samples, or step-by-step procedures?
4. **Decision Guidance**: Does the seed help users make choices, not just list options?
5. **Troubleshooting**: Does the seed anticipate common problems and provide solutions?

#### Depth Scoring

```
DEPTH LEVELS:
├── Level 1: Surface (explains WHAT)
│   Score: 0.2
│   Example: "Tailwind CSS is a utility-first CSS framework."
├── Level 2: Procedural (explains HOW)
│   Score: 0.4
│   Example: "To use Tailwind, install it with npm and configure tailwind.config.js..."
├── Level 3: Analytical (explains WHY)
│   Score: 0.6
│   Example: "Tailwind's utility-first approach reduces CSS bundle size because..."
├── Level 4: Contextual (explains WHEN and WHERE)
│   Score: 0.8
│   Example: "Use Tailwind when your team values rapid prototyping. Avoid when..."
└── Level 5: Mastery (explains WHAT IF and WHAT ELSE)
    Score: 1.0
    Example: "If you outgrow Tailwind's defaults, here's how to extend the design system..."
```

A quality seed should achieve Level 4 minimum, with Level 5 sections for the most common use cases.

### Dimension 3: Freshness (Weight: 20%)

How current is the information in this seed?

#### Freshness Scoring Model

Every seed has a freshness score that decays over time based on the volatility of its topic.

```
TOPIC VOLATILITY CATEGORIES:
├── Evergreen (decay: 2% per month)
│   Examples: Logic, mathematics, communication principles, security fundamentals
├── Stable (decay: 5% per month)
│   Examples: Database design, networking concepts, business strategy
├── Active (decay: 10% per month)
│   Examples: Web frameworks, cloud services, API patterns
├── Volatile (decay: 20% per month)
│   Examples: AI/ML tools, trending technologies, social media platforms
└── Ephemeral (decay: 40% per month)
    Examples: Specific version documentation, current pricing, regulatory changes
```

Freshness formula:
```
freshness = max(0, 1.0 - (months_since_update * decay_rate))
```

Example: A seed about Next.js (Active category, 10% decay) last updated 4 months ago:
```
freshness = 1.0 - (4 * 0.10) = 0.60 (Yellow zone — review needed)
```

#### Freshness Thresholds

- **Green (> 0.80)**: Fresh. No action needed.
- **Yellow (0.50-0.80)**: Aging. Schedule review within 2 weeks.
- **Orange (0.30-0.49)**: Stale. Review immediately. Flag responses using this seed.
- **Red (< 0.30)**: Expired. Do not use for responses until reviewed. Warn if retrieved.

### Dimension 4: Utility (Weight: 15%)

How useful is this seed in practice?

#### Utility Metrics

1. **Retrieval Frequency**: How often is this seed pulled during query processing?
2. **Response Contribution**: When retrieved, does it materially improve the response?
3. **User Satisfaction Correlation**: Are responses using this seed rated higher than those without it?
4. **Standalone Value**: Can this seed answer a query on its own, or does it always need other seeds?

#### Utility Score

```
utility = (retrieval_frequency_normalized * 0.3) +
          (response_contribution * 0.3) +
          (satisfaction_correlation * 0.25) +
          (standalone_value * 0.15)
```

### Dimension 5: Clarity (Weight: 10%)

How well-written and well-structured is this seed?

#### Clarity Assessment

1. **Organization**: Logical flow, clear sections, scannable structure
2. **Language**: Appropriate reading level, no unnecessary jargon
3. **Examples**: Concrete, relevant, correctly formatted
4. **Consistency**: Terminology matches other seeds, no contradictions
5. **Actionability**: Reader can apply the knowledge after reading

---

## Composite Quality Score

```
quality = (accuracy * 0.30) + (depth * 0.25) + (freshness * 0.20) + (utility * 0.15) + (clarity * 0.10)
```

### Quality Tiers

| Tier | Score Range | Action |
|------|-------------|--------|
| Platinum | 0.90 - 1.00 | Exemplar. Use as template for other seeds. |
| Gold | 0.80 - 0.89 | Strong. Minor refinements only. |
| Silver | 0.65 - 0.79 | Acceptable. Schedule improvement cycle. |
| Bronze | 0.50 - 0.64 | Below standard. Prioritize revision. |
| Scrap | < 0.50 | Failing. Immediate action: revise, merge, or retire. |

---

## Redundancy Detection

### The Redundancy Problem

As the seed library grows, seeds inevitably overlap. Some overlap is healthy — different angles on the same topic serve different query types. Too much overlap is wasteful and confusing — the system retrieves multiple seeds that say the same thing, wasting context window space.

### Detection Methods

#### 1. Semantic Similarity Analysis

Compare every seed against every other seed using embedding-based similarity:

```
For each pair (seed_A, seed_B):
  similarity = cosine_similarity(embed(seed_A), embed(seed_B))
  if similarity > 0.85: FLAG as potential duplicate
  if similarity > 0.70: FLAG as overlapping
  if similarity > 0.50: LOG as related
```

#### 2. Topic Overlap Matrix

Map each seed to its topic tags and find seeds with >70% topic overlap:

```
OVERLAP REPORT:
┌─────────────────────┬─────────────────────┬─────────┬──────────┐
│ Seed A              │ Seed B              │ Overlap │ Action   │
├─────────────────────┼─────────────────────┼─────────┼──────────┤
│ code-smells.md      │ testing-strategy.md │   32%   │ None     │
│ ooda-operational.md │ first-principles.md │   45%   │ Monitor  │
│ scope-control.md    │ complexity-triage.md│   78%   │ Review   │
│ [hypothetical A]    │ [hypothetical B]    │   91%   │ Merge    │
└─────────────────────┴─────────────────────┴─────────┴──────────┘
```

#### 3. Retrieval Conflict Analysis

When multiple seeds are retrieved for the same query, check if they provide:
- **Complementary information**: Good — different angles on the answer
- **Redundant information**: Bad — wasting context window
- **Contradictory information**: Critical — one of them is wrong

### Redundancy Resolution Actions

1. **No action**: < 50% overlap. Seeds are related but distinct.
2. **Cross-reference**: 50-70% overlap. Add pointers between seeds so the system knows they are related.
3. **Consolidate**: 70-85% overlap. Merge the overlapping sections into one seed, keep unique sections.
4. **Merge**: 85-95% overlap. Combine into a single, stronger seed. Redirect references.
5. **Retire**: > 95% overlap. Keep the better seed, retire the weaker one.

---

## Pruning Criteria

### When to Prune

A seed should be considered for pruning when:

1. **Zero retrieval** in 90 days: Nobody is asking about this topic.
2. **Consistently low utility** (< 0.3 for 60 days): The seed is retrieved but does not help.
3. **Accuracy failed** (< 0.5): The seed is spreading misinformation.
4. **Redundancy score > 90%**: Another seed covers everything this one does, but better.
5. **Topic deprecated**: The technology or concept the seed covers is no longer relevant.

### Pruning Process

Pruning is NOT deletion. It is a graduated process:

```
PRUNING STAGES:
├── Stage 1: Deprioritize
│   Lower the seed's retrieval priority
│   Monitor for 30 days
│   If retrieval stays zero: proceed to Stage 2
│
├── Stage 2: Archive
│   Move seed to archive directory
│   Remove from active retrieval index
│   Keep for historical reference
│   Monitor for 60 days for any references
│
├── Stage 3: Retire
│   Mark seed as retired
│   Log retirement reason and date
│   Keep in cold storage for potential revival
│   Remove all active references
│
└── Stage 4: Delete (Founder approval required)
    Permanent removal from all storage
    Only after 90 days in retired state
    Requires explicit founder authorization
```

### Never Prune

Some seeds are exempt from pruning regardless of metrics:

- Seeds required by safety guardrails
- Seeds that define Palace core behavior
- Seeds specified by the founder as permanent
- Seeds that serve as dependencies for other active seeds

---

## Quality Review Schedule

### Continuous (Automated)

- Freshness score recalculation for all seeds
- Retrieval and utility metric updates
- Redundancy scanning on new seed creation

### Weekly (Automated with Report)

- Top 10 and bottom 10 seeds by quality score
- Seeds crossing freshness thresholds
- New redundancy flags

### Monthly (Founder Review)

- Full quality scorecard for all seeds
- Pruning candidates with recommendations
- New seed creation priorities based on gap analysis
- Quality trend analysis (are seeds getting better or worse overall?)

### Quarterly (Strategic Review)

- Seed library size and growth rate assessment
- Architecture review: Is the seed organization still effective?
- Category rebalancing: Are some domains over-seeded and others under-seeded?
- Benchmark: Run the full test suite against the seed library

---

## Quality Improvement Playbook

### Improving Accuracy

1. Identify specific claims that are incorrect or outdated
2. Research current correct information
3. Update the seed with citations where possible
4. Add a "Last Verified" timestamp
5. Run the seed through the regression test to ensure the fix did not break other aspects

### Improving Depth

1. Identify which depth levels the seed is missing (WHAT, HOW, WHY, WHEN/WHERE, WHAT IF)
2. Research the missing levels
3. Add sections with clear headers for each level
4. Include examples at each depth level
5. Verify the expanded seed does not exceed useful length (diminishing returns past ~25KB)

### Improving Freshness

1. Check the seed's topic volatility category
2. Research what has changed since last update
3. Update facts, version numbers, best practices
4. Update or add examples to reflect current standards
5. Reset the freshness timestamp

### Improving Utility

1. Analyze queries where the seed was retrieved but did not help
2. Identify the gap between what the query needed and what the seed provided
3. Add the missing information or restructure for better retrieval
4. Improve the seed's metadata for better indexing
5. Test with the failing queries to confirm improvement

### Improving Clarity

1. Read the seed from a beginner's perspective
2. Simplify complex language where possible
3. Add visual structures (tables, diagrams, lists)
4. Ensure examples are self-contained and runnable
5. Check that section headers accurately describe section content

---

## Integration Points

- **knowledge-gap-detection.md**: Quality assessment feeds gap detection — low-quality seeds in high-demand areas are effective gaps
- **self-improvement-protocols.md**: Seed quality improvements are managed through the IMPROVE loop
- **knowledge-maintenance-schedule.md**: Quality reviews are scheduled maintenance tasks
- **knowledge-dependency-graph.md**: Quality changes can cascade through dependent seeds
- **continuous-learning-pipeline.md**: New seeds from the learning pipeline enter quality assessment immediately
- **growth-metrics-tracking.md**: Average seed quality is a growth metric

---

## Summary

Seed quality assessment is the immune system of the Palace's knowledge base. It continuously evaluates every seed across five dimensions (accuracy, depth, freshness, utility, clarity), detects redundancy, and prunes dead weight. No seed gets a permanent pass — every seed must prove its value with data. The quality tiers (Platinum through Scrap) give clear signals for action. The pruning process is graduated and reversible. The founder has final authority on all major quality decisions. The goal is a lean, accurate, deep knowledge base where every seed earns its place.
