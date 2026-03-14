# Knowledge Maintenance Schedule — Systematic Care for the Palace Brain

## Purpose

This seed defines the daily, weekly, monthly, and quarterly maintenance tasks that keep the Palace's knowledge base healthy, accurate, and effective. Knowledge is not a static asset — it decays, drifts, and becomes stale without active maintenance. This schedule ensures nothing slips through the cracks.

---

## Core Philosophy

Maintenance is not glamorous work, but it is the difference between a system that degrades over time and one that improves. The Palace treats knowledge maintenance the way a pilot treats pre-flight checklists: every item, every time, no shortcuts.

### Maintenance Principles

1. **Scheduled beats reactive**: Fix problems before they affect users, not after
2. **Automated where possible**: If a check can be automated, automate it
3. **Prioritized by impact**: Maintain high-traffic seeds first, low-traffic seeds on a longer cycle
4. **Documented always**: Every maintenance action is logged for accountability and pattern analysis
5. **Founder-informed**: Major maintenance decisions (seed retirement, major revisions) require founder awareness

---

## Daily Maintenance Tasks (Automated)

### D-1: Freshness Score Recalculation

**What**: Recalculate freshness scores for all seeds based on their topic volatility category and time since last update.

**How**:
```
For each seed:
  freshness = max(0, 1.0 - (months_since_update * volatility_decay_rate))
  if freshness crossed a threshold since yesterday: flag for review
```

**Output**: List of seeds that crossed freshness thresholds (Green→Yellow, Yellow→Orange, Orange→Red)

**Time**: < 1 minute (automated)

### D-2: Error Rate Check

**What**: Review the previous 24 hours of query processing and flag any seeds associated with elevated error rates.

**How**:
- Pull all queries where a seed was retrieved but the response was rated poorly
- Calculate per-seed error rates
- Flag any seed with error rate > 2x its historical average

**Output**: Error rate report, flagged seeds

**Time**: < 2 minutes (automated)

### D-3: Retrieval Pattern Analysis

**What**: Track which seeds were retrieved most/least in the past 24 hours.

**How**:
- Count retrievals per seed
- Compare to 7-day rolling average
- Flag unusual spikes or drops (> 2 standard deviations)

**Output**: Daily retrieval heatmap, anomaly flags

**Time**: < 1 minute (automated)

### D-4: New Query Classification

**What**: Classify any new query types that did not match existing categories in the query taxonomy.

**How**:
- Review unclassified queries from the past 24 hours
- Attempt automatic classification using embedding similarity
- Queue truly novel queries for weekly manual review

**Output**: Updated query taxonomy, list of unclassifiable queries

**Time**: < 3 minutes (automated)

### D-5: Infrastructure Health Summary

**What**: Generate a daily health summary of the systems that support knowledge delivery.

**How**: Pull metrics from performance monitoring system:
- Database response times (seed retrieval)
- Embedding search performance
- Cache hit rates
- Storage utilization

**Output**: Daily infrastructure health report

**Time**: < 1 minute (automated)

---

## Weekly Maintenance Tasks (Automated + Review)

### W-1: Seed Quality Score Recalculation

**What**: Recalculate composite quality scores for all seeds using the five-dimension assessment (accuracy, depth, freshness, utility, clarity).

**Schedule**: Every Monday

**How**:
- Pull updated metrics for each dimension
- Calculate composite scores
- Rank all seeds by quality tier
- Flag seeds that changed tiers (especially downgrades)

**Output**: Weekly quality scorecard, tier change alerts

**Time**: 10 minutes (automated calculation + 15 minutes human review)

### W-2: Failure Cluster Analysis

**What**: Group the past week's query failures by topic, agent, and failure category to identify systematic problems.

**Schedule**: Every Monday

**How**:
- Aggregate failure logs from the past 7 days
- Cluster by similarity (topic, agent, error type)
- Rank clusters by frequency and impact
- Generate improvement candidates for the top 3 clusters

**Output**: Failure cluster report with recommended actions

**Time**: 15 minutes (automated clustering + 20 minutes analysis)

### W-3: Redundancy Scan

**What**: Check for new redundancy between seeds, especially after any seeds were created or modified during the week.

**Schedule**: Every Wednesday

**How**:
- Run semantic similarity comparison on any modified seeds
- Update the overlap matrix
- Flag new overlaps above 70%

**Output**: Redundancy report, merge/consolidate candidates

**Time**: 5 minutes (automated)

### W-4: Stale Seed Review

**What**: Review seeds that entered the Yellow or Orange freshness zone during the past week.

**Schedule**: Every Friday

**How**:
- Pull list of seeds flagged by daily freshness checks
- For each: assess what has changed in the topic area
- Determine: update now, schedule update, or deprioritize
- Update seeds that can be updated quickly (< 30 minutes each)

**Output**: Stale seed disposition report, updated seeds

**Time**: 30-60 minutes depending on count

### W-5: Coverage Gap Update

**What**: Update the knowledge coverage map with the past week's query data.

**Schedule**: Every Friday

**How**:
- Integrate new query classifications into the coverage map
- Recalculate coverage percentages per domain
- Identify domains with declining coverage scores
- Update gap prioritization rankings

**Output**: Updated coverage map, gap priority changes

**Time**: 10 minutes (automated)

---

## Monthly Maintenance Tasks (Founder Review Required)

### M-1: Full Seed Library Audit

**What**: Comprehensive review of the entire seed library — quality scores, utilization, freshness, and redundancy.

**Schedule**: First Monday of each month

**Deliverables**:
1. Complete seed scorecard (all seeds, all dimensions)
2. Top 10 seeds by quality (exemplars)
3. Bottom 10 seeds by quality (action required)
4. Seeds recommended for pruning (with justification)
5. Seeds recommended for creation (with priority ranking)
6. Quality trend analysis (is the library getting better or worse?)

**Founder action required**: Approve pruning candidates, approve creation priorities

**Time**: 2 hours (automated compilation + 1 hour founder review)

### M-2: Agent Performance vs Knowledge Review

**What**: Cross-reference agent performance metrics with the seeds they use most frequently. Identify whether agent performance issues are caused by knowledge gaps vs prompt issues.

**Schedule**: Second Monday of each month

**Deliverables**:
1. Agent-seed dependency map
2. Agents whose performance is limited by seed quality
3. Seeds whose quality is dragging down agent performance
4. Recommendations: improve seed, improve prompt, or both

**Time**: 1 hour (automated analysis + 30 minutes review)

### M-3: Competitor and Industry Update

**What**: Check major developments in the technology landscape that might require new seeds or updates to existing ones.

**Schedule**: Third Monday of each month

**Sources to check**:
- Major framework releases (Next.js, React, etc.)
- New security vulnerabilities or compliance requirements
- Emerging best practices in relevant domains
- Competitor capability changes

**Deliverables**:
1. List of topic areas requiring updates
2. Priority ranking based on user impact
3. Estimated effort for each update

**Time**: 1.5 hours

### M-4: Knowledge Architecture Review

**What**: Evaluate whether the current seed organization, categorization, and dependency structure is still effective.

**Schedule**: Last Monday of each month

**Questions to answer**:
- Are seeds easy to find via retrieval?
- Are categories still meaningful or do they need reorganization?
- Are there dependency bottlenecks (one seed that too many others depend on)?
- Is the seed library growing at a sustainable rate?

**Deliverables**: Architecture health report, reorganization recommendations (if any)

**Time**: 45 minutes

---

## Quarterly Maintenance Tasks (Strategic)

### Q-1: Strategic Knowledge Review

**What**: Step back from tactical maintenance and ask: "Is the Palace's knowledge strategy aligned with Stone AI's business strategy?"

**Schedule**: First week of each quarter

**Questions**:
- Are we investing seed effort in the right domains?
- Are user needs shifting in ways our coverage does not reflect?
- Are there entirely new capability areas we should be building toward?
- Is the maintenance workload sustainable or growing too fast?

**Deliverables**: Strategic alignment report, recommended strategy adjustments

**Founder action**: Review and approve strategic direction

### Q-2: Maintenance Process Improvement

**What**: Review the maintenance process itself. Is it efficient? Are there steps that should be added, removed, or automated?

**Schedule**: Second week of each quarter

**Questions**:
- Which maintenance tasks catch real issues vs which are busywork?
- What manual tasks could be automated?
- Are maintenance frequencies right or should some be adjusted?
- What has fallen through the cracks despite the maintenance schedule?

**Deliverables**: Process improvement recommendations

### Q-3: Full Regression Test Suite Run

**What**: Run the complete regression test suite against the entire seed library.

**Schedule**: Third week of each quarter

**What it tests**:
- All benchmark queries produce expected quality responses
- No seed changes have introduced regressions
- New seeds interact correctly with existing seeds
- Cross-seed dependencies still work

**Output**: Full test report, regression findings, remediation plan

### Q-4: Knowledge Health Report to Founder

**What**: Comprehensive quarterly report on the state of the Palace's knowledge.

**Schedule**: Last week of each quarter

**Contents**:
1. Seed library size and growth rate
2. Overall quality trend (quarter-over-quarter)
3. Coverage map with trend arrows
4. Maintenance workload and efficiency
5. Major issues addressed and outstanding
6. Strategic recommendations for next quarter

---

## Maintenance Priority Matrix

When multiple maintenance tasks compete for attention:

| Priority | Category | Examples |
|----------|----------|----------|
| P0 | Safety-critical | Seed spreading misinformation, safety seed outdated |
| P1 | Active degradation | Seed with Red freshness still being retrieved, high error rate |
| P2 | User-facing quality | Bottom-10 seeds needing revision, coverage gaps in high-traffic areas |
| P3 | Efficiency | Redundancy reduction, architecture optimization |
| P4 | Growth | New seed creation for coverage expansion |
| P5 | Cosmetic | Clarity improvements, formatting standardization |

---

## Maintenance Logging

Every maintenance action is logged:

```json
{
  "task_id": "M-1-2026-03",
  "task_name": "Full Seed Library Audit",
  "execution_date": "2026-03-03",
  "executor": "automated + founder review",
  "findings": [
    "3 seeds below Bronze threshold",
    "2 new redundancy pairs detected",
    "Overall quality trend: +1.2% vs last month"
  ],
  "actions_taken": [
    "Flagged 3 seeds for revision",
    "Scheduled redundancy review for W-3",
    "No pruning this month"
  ],
  "founder_decisions": [
    "Approved revision of bottom 3 seeds",
    "Deferred new seed creation to next month"
  ],
  "next_scheduled": "2026-04-07"
}
```

---

## Integration Points

- **seed-quality-assessment.md**: Provides the quality metrics used in maintenance decisions
- **knowledge-gap-detection.md**: Feeds coverage gap updates into the maintenance pipeline
- **self-improvement-protocols.md**: Maintenance findings feed into the IMPROVE loop
- **knowledge-dependency-graph.md**: Dependency information guides maintenance priorities
- **feedback-integration-system.md**: User feedback triggers ad-hoc maintenance
- **autonomous-decision-boundaries.md**: Defines which maintenance actions need founder approval

---

## Summary

Knowledge maintenance is not optional — it is the operational heartbeat of the Palace's brain. Daily automated checks catch emerging issues. Weekly reviews identify patterns and trends. Monthly audits ensure comprehensive coverage and quality. Quarterly strategic reviews keep the knowledge base aligned with business goals. Every task has a schedule, a method, an output, and a log entry. The founder is informed of all major decisions and approves all structural changes. A well-maintained knowledge base is the foundation of everything the Palace does.
