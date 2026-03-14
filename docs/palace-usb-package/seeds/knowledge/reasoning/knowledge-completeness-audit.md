# Knowledge Completeness Audit

## Purpose

This seed defines the methodology for auditing seed coverage across the Palace's knowledge base. It provides gap identification techniques, domain coverage scoring, missing capability detection, and a systematic approach to ensuring the Palace's knowledge is comprehensive enough for operational independence.

## Why This Matters

A Palace with knowledge gaps is a Palace that fails silently. Users don't know what an agent doesn't know — they just get bad answers. Systematic auditing catches gaps before users find them, ensuring every agent has the knowledge seeds it needs to perform at its certified level.

---

## Audit Framework Overview

### The Three Dimensions of Knowledge Completeness

```
Dimension 1: BREADTH — Does the Palace cover all required domains?
  └── Every agent's specialty has seed coverage
  └── Cross-domain connections are documented
  └── No orphaned domains (agents without knowledge support)

Dimension 2: DEPTH — Is each domain covered sufficiently?
  └── Basic concepts are covered
  └── Intermediate techniques are covered
  └── Advanced topics are covered for premium tiers
  └── Edge cases and exceptions are documented

Dimension 3: FRESHNESS — Is the knowledge current?
  └── No outdated facts or deprecated practices
  └── Industry changes are reflected
  └── New tools and techniques are included
  └── Seasonal or time-sensitive content is updated
```

### Audit Cycle

```
CONTINUOUS (Daily):
  - Automated gap detection from user queries
  - Flag queries where agents produce low-confidence responses

WEEKLY:
  - Review flagged queries for gap patterns
  - Prioritize gaps by user impact

MONTHLY:
  - Full domain coverage scoring
  - Cross-reference agent capabilities vs seed coverage
  - Generate gap report for founder

QUARTERLY:
  - Deep audit of all seeds
  - Freshness review
  - Strategic gap analysis (what capabilities SHOULD we add?)

ANNUALLY:
  - Complete knowledge architecture review
  - Roadmap for next year's knowledge expansion
```

---

## Gap Identification Methodology

### Method 1: Coverage Matrix Analysis

Create a matrix mapping agents to knowledge seeds:

```
                    | Seed A | Seed B | Seed C | Seed D | Seed E |
Agent 1 (Writing)   |   X    |   X    |        |        |   X    |
Agent 2 (Code)      |        |   X    |   X    |   X    |        |
Agent 3 (Fitness)   |        |        |        |   X    |   X    |
Agent 4 (Finance)   |   X    |        |   X    |        |        |
...

GAPS: Agent 3 has only 2 seeds — investigate if domain is underserved
GAPS: Seed C covers 2 agents — check if it should be split into domain-specific versions
```

### Method 2: Query Failure Analysis

Monitor and categorize queries where agents underperform:

```python
class QueryFailureAnalyzer:
    def analyze_failures(self, agent_name: str, period_days: int = 30):
        """
        Categorize failure modes for an agent over a time period.

        Failure categories:
        1. KNOWLEDGE_GAP — Agent doesn't know the answer (no relevant seed)
        2. DEPTH_GAP — Agent knows the topic but lacks detail
        3. FRESHNESS_GAP — Agent has outdated information
        4. INTEGRATION_GAP — Agent can't connect concepts across domains
        5. EDGE_CASE_GAP — Agent fails on unusual but valid scenarios
        """
        failures = self.get_low_confidence_responses(agent_name, period_days)

        categorized = {
            "knowledge_gap": [],
            "depth_gap": [],
            "freshness_gap": [],
            "integration_gap": [],
            "edge_case_gap": []
        }

        for failure in failures:
            category = self.classify_failure(failure)
            categorized[category].append(failure)

        return categorized
```

### Method 3: Systematic Domain Decomposition

Break each agent's domain into sub-domains and check coverage:

```yaml
agent: "WritingCoach"
domain: "Writing and Communication"

sub_domains:
  essay_writing:
    covered: true
    seeds: ["writing-fundamentals.md", "essay-structure.md"]
    depth: "intermediate"
    gaps: ["Advanced rhetorical analysis"]

  creative_writing:
    covered: partial
    seeds: ["creative-writing-basics.md"]
    depth: "basic"
    gaps: ["Poetry techniques", "Screenplay format", "Novel structure"]

  business_writing:
    covered: true
    seeds: ["business-communication.md", "email-writing.md"]
    depth: "intermediate"
    gaps: ["Grant writing", "Technical documentation"]

  academic_writing:
    covered: partial
    seeds: ["research-writing.md"]
    depth: "basic"
    gaps: ["Citation styles deep dive", "Literature review methodology"]

  editing:
    covered: false
    seeds: []
    depth: "none"
    gaps: ["Self-editing techniques", "Proofreading checklist", "Style guides"]

overall_coverage: 60%
priority_gaps: ["editing (entire sub-domain missing)", "creative writing depth"]
```

### Method 4: Competitor Capability Comparison

Compare Palace agent capabilities against what competitors offer:

```
COMPARISON: Writing Coach Agent vs Market
=========================================
Feature                  | Palace | ChatGPT | Jasper | Grammarly |
-------------------------|--------|---------|--------|-----------|
Grammar correction       |   Y    |    Y    |   Y    |     Y     |
Style suggestions        |   Y    |    Y    |   Y    |     Y     |
Tone adjustment          |   Y    |    Y    |   Y    |     P     |
SEO optimization         |   N    |    P    |   Y    |     N     |
Plagiarism awareness     |   N    |    P    |   N    |     Y     |
Genre-specific guidance  |   P    |    Y    |   P    |     N     |
Multi-language support   |   N    |    Y    |   P    |     Y     |

Y=Yes, N=No, P=Partial

GAPS IDENTIFIED: SEO optimization, plagiarism awareness, multi-language
PRIORITY: SEO optimization (high user demand)
```

---

## Domain Coverage Scoring

### Scoring Formula

```
Domain Coverage Score = (B * 0.4) + (D * 0.35) + (F * 0.25)

Where:
  B = Breadth Score (0-100)
      = (sub_domains_covered / total_sub_domains) * 100

  D = Depth Score (0-100)
      = weighted average of depth per sub-domain
        none=0, basic=33, intermediate=66, advanced=100

  F = Freshness Score (0-100)
      = (seeds_updated_within_90_days / total_seeds) * 100
```

### Scoring Thresholds

| Score Range | Rating | Action Required |
|-------------|--------|-----------------|
| 90-100 | Excellent | Maintain and iterate |
| 80-89 | Good | Address minor gaps when convenient |
| 70-79 | Adequate | Schedule gap-filling within 30 days |
| 60-69 | Below Standard | Priority gap-filling within 14 days |
| Below 60 | Critical | Immediate action — agent may need suspension |

### Per-Agent Coverage Report Template

```
KNOWLEDGE COVERAGE REPORT
=========================
Agent: [Name] (#[Number])
Audit Date: [Date]
Auditor: [Name]

BREADTH:
  Sub-domains identified: [N]
  Sub-domains covered: [N] ([%])
  Uncovered sub-domains:
    - [Sub-domain 1]: [Priority: HIGH/MED/LOW]
    - [Sub-domain 2]: [Priority: HIGH/MED/LOW]

DEPTH:
  Average depth score: [0-100]
  Sub-domains at "advanced": [N]
  Sub-domains at "intermediate": [N]
  Sub-domains at "basic": [N]
  Sub-domains at "none": [N]

FRESHNESS:
  Total seeds: [N]
  Updated within 90 days: [N] ([%])
  Oldest seed: [Name] ([Age in days])

OVERALL SCORE: [0-100] — [Rating]

TOP 3 GAPS (by priority):
  1. [Gap description] — Impact: [HIGH/MED/LOW]
  2. [Gap description] — Impact: [HIGH/MED/LOW]
  3. [Gap description] — Impact: [HIGH/MED/LOW]

RECOMMENDED ACTIONS:
  1. [Create seed for X]
  2. [Deepen coverage of Y]
  3. [Update seed Z]
```

---

## Missing Capability Detection

### Proactive Detection Methods

#### Method A: User Intent Analysis

Analyze what users are trying to accomplish and check if agents can support it:

```
USER INTENT MAP — Writing Coach
================================
Intent Category          | Supported? | Confidence |
------------------------|------------|------------|
Write an essay          |    YES     |    HIGH    |
Improve my writing      |    YES     |    HIGH    |
Write a resume          |    PARTIAL |    MED     |
Write a business plan   |    PARTIAL |    LOW     |
Write poetry            |    PARTIAL |    LOW     |
Write a speech          |    YES     |    MED     |
Edit my document        |    NO      |    N/A     |
Translate my text       |    NO      |    N/A     |
Write social media copy |    PARTIAL |    LOW     |
Write product descriptions|  NO      |    N/A     |

DETECTION: 4 unsupported intents, 4 partially supported
ACTION: Prioritize by user demand frequency
```

#### Method B: Taxonomy-Based Gap Detection

Use established domain taxonomies to check coverage:

```
BLOOM'S TAXONOMY CHECK — Per Agent
====================================
For each agent's domain, verify the agent can:

Level 1 — Remember: Recall basic facts and concepts
  [ ] Agent can define key terms
  [ ] Agent can list fundamental concepts
  [ ] Agent can identify standard practices

Level 2 — Understand: Explain ideas or concepts
  [ ] Agent can explain why things work
  [ ] Agent can summarize approaches
  [ ] Agent can compare alternatives

Level 3 — Apply: Use information in new situations
  [ ] Agent can guide through real scenarios
  [ ] Agent can adapt advice to context
  [ ] Agent can solve typical problems

Level 4 — Analyze: Draw connections among ideas
  [ ] Agent can break down complex problems
  [ ] Agent can identify root causes
  [ ] Agent can compare trade-offs

Level 5 — Evaluate: Justify a stance or decision
  [ ] Agent can critique approaches
  [ ] Agent can recommend best options
  [ ] Agent can assess quality

Level 6 — Create: Produce new or original work
  [ ] Agent can help generate original content
  [ ] Agent can design solutions
  [ ] Agent can develop frameworks
```

#### Method C: Failure Mode Enumeration

Systematically list ways each agent might fail:

```
FAILURE MODES — Writing Coach
===============================
1. User asks about a writing style the agent doesn't know
   → Mitigation: Seed covers all major styles
   → Current status: PARTIAL (missing screenwriting, grant writing)

2. User provides text in a language the agent doesn't support
   → Mitigation: Agent acknowledges limitation and suggests alternatives
   → Current status: COVERED (graceful refusal)

3. User asks for feedback on highly technical writing
   → Mitigation: Agent applies general writing principles
   → Current status: PARTIAL (weak on scientific/medical writing)

4. User expects the agent to act as a plagiarism checker
   → Mitigation: Agent explains it cannot check plagiarism
   → Current status: NOT COVERED (agent might attempt it poorly)

5. User asks for SEO-optimized content
   → Mitigation: Agent has SEO writing knowledge
   → Current status: NOT COVERED (no SEO seed)
```

---

## Audit Execution Procedure

### Step-by-Step Audit Process

#### Phase 1: Inventory (1-2 hours)

1. List all knowledge seeds currently in the Palace
2. Map each seed to the agents it supports
3. Identify seeds that don't map to any agent (orphan seeds)
4. Identify agents with fewer than 3 supporting seeds

```bash
# Quick inventory script
echo "=== Seed Inventory ==="
ls -la docs/palace-usb-package/seeds/knowledge/reasoning/ | wc -l
echo ""
echo "=== Seeds per category ==="
for dir in docs/palace-usb-package/seeds/knowledge/*/; do
    count=$(ls "$dir" 2>/dev/null | wc -l)
    echo "$(basename $dir): $count seeds"
done
```

#### Phase 2: Coverage Mapping (2-4 hours)

1. For each of the 44 agents, list its domain and sub-domains
2. Check which seeds cover each sub-domain
3. Score breadth, depth, and freshness
4. Generate per-agent coverage reports

#### Phase 3: Gap Analysis (2-3 hours)

1. Compile all gaps from coverage reports
2. Deduplicate (many agents may share gaps)
3. Prioritize by:
   - User impact (how many users would benefit?)
   - Agent tier (higher tiers get priority)
   - Effort to fill (quick wins first)
   - Strategic importance (aligns with business goals?)

#### Phase 4: Remediation Plan (1-2 hours)

1. For each priority gap, define:
   - What seed(s) need to be created
   - What existing seeds need deepening
   - What seeds need freshness updates
2. Assign effort estimates
3. Create a backlog ordered by priority
4. Set deadlines for critical gaps

#### Phase 5: Verification (1 hour)

1. After gaps are filled, re-run the coverage scoring
2. Verify scores improved as expected
3. Run agent competency tests on the gap areas
4. Update the audit record

---

## Cross-Domain Gap Detection

Some gaps exist between domains, not within them:

### Integration Gaps

```
CROSS-DOMAIN GAP EXAMPLE:
  Agent A (Writing) knows how to write well
  Agent B (Marketing) knows marketing strategy
  BUT: Neither agent can help with "Write marketing copy"

RESOLUTION: Create a cross-domain seed that bridges writing + marketing
  OR: Ensure both agents' domain definitions overlap on copywriting
```

### Handoff Gaps

```
HANDOFF GAP EXAMPLE:
  User starts with Agent A (Research), gets initial findings
  User needs Agent B (Analysis) to process findings
  BUT: Agent B doesn't understand Agent A's output format

RESOLUTION: Standardize output/input formats between connected agents
  OR: Create a handoff protocol seed
```

### Compound Query Gaps

```
COMPOUND QUERY EXAMPLE:
  User asks: "Help me write a business plan with financial projections"
  This needs: Writing + Finance + Business Strategy

  No single agent covers this compound need.

RESOLUTION: Agent routing sends to primary domain (Business Strategy)
  Primary agent addresses what it can and redirects sub-tasks
```

---

## Automated Gap Detection System

### Low-Confidence Response Monitoring

```python
class GapDetector:
    def __init__(self, confidence_threshold: float = 0.6):
        self.threshold = confidence_threshold
        self.gap_log = []

    def monitor_response(self, agent_name: str, query: str,
                         response: str, confidence: float):
        """Log potential gaps when confidence is low."""
        if confidence < self.threshold:
            self.gap_log.append({
                "agent": agent_name,
                "query": query,
                "confidence": confidence,
                "timestamp": datetime.now(),
                "category": self.classify_gap(query, response)
            })

    def classify_gap(self, query: str, response: str) -> str:
        """Classify the type of gap detected."""
        hedging_phrases = ["I'm not sure", "I think", "it might be",
                          "I don't have specific", "generally speaking"]
        refusal_phrases = ["outside my area", "can't help with",
                          "not my specialty", "recommend asking"]

        if any(p in response.lower() for p in refusal_phrases):
            return "knowledge_gap"
        elif any(p in response.lower() for p in hedging_phrases):
            return "depth_gap"
        else:
            return "quality_gap"

    def generate_weekly_report(self) -> dict:
        """Generate a summary of detected gaps."""
        from collections import Counter
        agent_gaps = Counter(g["agent"] for g in self.gap_log)
        category_gaps = Counter(g["category"] for g in self.gap_log)

        return {
            "total_gaps": len(self.gap_log),
            "by_agent": dict(agent_gaps.most_common(10)),
            "by_category": dict(category_gaps),
            "top_queries": self._get_top_gap_queries()
        }
```

---

## Knowledge Freshness Protocol

### Freshness Scoring

```
SEED AGE     | FRESHNESS SCORE | ACTION
-------------|-----------------|------------------
< 30 days    | 100%            | None
30-60 days   | 90%             | Review next cycle
60-90 days   | 75%             | Schedule review
90-180 days  | 50%             | Priority review
> 180 days   | 25%             | Urgent update needed
> 365 days   | 0%              | Flag for rewrite or retirement
```

### Freshness Review Checklist

For each seed being reviewed for freshness:

```
[ ] Core concepts still accurate?
[ ] Tools/technologies mentioned still current?
[ ] Best practices still recommended by industry?
[ ] Examples still relevant and relatable?
[ ] Links/references still valid?
[ ] New developments in this area since last update?
[ ] Competing approaches emerged that should be mentioned?
[ ] User feedback suggests any corrections needed?
```

---

## Audit Deliverables

Each audit cycle produces:

1. **Coverage Matrix** — Updated mapping of seeds to agents
2. **Per-Agent Coverage Reports** — Individual scores and gaps
3. **Gap Priority List** — Ordered backlog of knowledge gaps
4. **Remediation Plan** — Timeline and assignments for filling gaps
5. **Trend Report** — How coverage has changed since last audit
6. **Founder Summary** — Executive summary with key decisions needed

The audit is the Palace's quality assurance for knowledge. Without it, knowledge degrades silently until agents start failing users.
