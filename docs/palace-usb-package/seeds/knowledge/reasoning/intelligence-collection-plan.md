# Intelligence Collection Plan

> Cardinal Seed — Intelligence Architecture
> Classification: Intelligence Operations / Collection Management
> Operates independently on OMEN without cloud dependencies

---

## Purpose

Intelligence without a collection plan is ad hoc guessing. A collection plan defines WHAT intelligence is needed, WHERE to find it, HOW to collect it, and HOW to evaluate what you've gathered. Cardinal operates as the founder's intelligence service — this seed provides the operational framework.

---

## 1. Collection Requirements

### What Are Collection Requirements?

Collection requirements (CRs) are specific intelligence questions that need answers. They drive all collection activity. Without CRs, you collect noise instead of signal.

### Priority Intelligence Requirements (PIRs)

PIRs are the most critical intelligence questions for the founder's decision-making:

**Stone AI PIRs (Current)**

| PIR # | Question | Priority | Update Frequency |
|-------|----------|----------|-----------------|
| PIR-1 | What are our top 3 competitors' next strategic moves? | Critical | Monthly |
| PIR-2 | How is the AI regulation landscape evolving in our key markets? | High | Monthly |
| PIR-3 | What technology shifts could change the competitive basis in our market? | High | Quarterly |
| PIR-4 | What is our current product-market fit signal? (NPS, retention, growth) | Critical | Weekly |
| PIR-5 | What are the emerging customer needs we're not addressing? | High | Monthly |
| PIR-6 | Where is the AI infrastructure cost curve heading? (GPU, API, cloud) | Medium | Quarterly |
| PIR-7 | What is the health of our key dependencies? (Vercel, Clerk, Stripe, Neon) | High | Weekly |
| PIR-8 | What are the top risks to our business continuity? | Critical | Monthly |

### Specific Intelligence Requirements (SIRs)

SIRs are the detailed questions that support each PIR:

**Supporting PIR-1 (Competitor moves)**:
- SIR-1.1: What features have competitors shipped in the last 30 days?
- SIR-1.2: What job postings have competitors published? (new roles = new direction)
- SIR-1.3: Have any competitors raised funding or made acquisitions?
- SIR-1.4: What pricing changes have competitors made?
- SIR-1.5: What partnerships or integrations have competitors announced?

**Supporting PIR-4 (Product-market fit)**:
- SIR-4.1: What is the weekly active user count and trend?
- SIR-4.2: What is the free-to-paid conversion rate and trend?
- SIR-4.3: What are users saying in support tickets and reviews?
- SIR-4.4: What features have the highest and lowest adoption?
- SIR-4.5: What is the 30/60/90-day retention by cohort?

### Collection Requirement Lifecycle

```
IDENTIFY → VALIDATE → ASSIGN → COLLECT → PROCESS → DELIVER → EVALUATE

1. Identify: What does the founder need to know?
2. Validate: Is this actually important? Is it collectible?
3. Assign: Which collection method and source?
4. Collect: Execute the collection
5. Process: Filter, organize, analyze
6. Deliver: Present to the founder
7. Evaluate: Was the intelligence useful? Update CRs accordingly.
```

---

## 2. Source Reliability Rating

### Why Rate Sources?

Not all sources are equal. A patent filing is more reliable than a Twitter rumor. A financial filing is more reliable than a blog post's revenue estimate. Source reliability ratings prevent bad intelligence from driving good decisions.

### The Admiralty Rating System (Adapted)

Rate every source on two dimensions:

**Source Reliability** (How trustworthy is the source in general?)

| Rating | Label | Criteria |
|--------|-------|----------|
| A | Completely Reliable | No doubt about authenticity, trustworthiness, or competence. Official filings, direct measurement, verified data. |
| B | Usually Reliable | Minor reservations. Reputable industry analyst, established journalist, well-known expert. |
| C | Fairly Reliable | Some reservations about trustworthiness or competence. Trade press, mid-tier analysts, unverified industry contacts. |
| D | Not Usually Reliable | Significant doubt. Anonymous sources, biased parties, unverified social media accounts. |
| E | Unreliable | Doubt about authenticity and competence. Rumor mills, known-biased sources, unattributed claims. |
| F | Cannot Be Judged | New source with no track record. Evaluate after multiple interactions. |

**Information Accuracy** (How reliable is this SPECIFIC piece of information?)

| Rating | Label | Criteria |
|--------|-------|----------|
| 1 | Confirmed | Confirmed by other independent sources or direct observation. |
| 2 | Probably True | Not confirmed but consistent with known information from reliable sources. |
| 3 | Possibly True | Not confirmed, not contradicted, but from a source of unknown reliability. |
| 4 | Doubtfully True | Inconsistent with other information or from unreliable source. |
| 5 | Improbable | Contradicted by other information from reliable sources. |
| 6 | Cannot Be Judged | No basis for evaluation. |

### Combined Rating Examples

| Intelligence | Source | Rating | Interpretation |
|-------------|--------|--------|----------------|
| Competitor raised $50M Series B | SEC filing | A1 | Confirmed fact from most reliable source |
| Competitor working on voice feature | LinkedIn job posting for Voice Engineer | B2 | Reliable source, probably true |
| Competitor losing customers | Reddit comment | D3 | Unreliable source, possibly true |
| Competitor planning acquisition | Anonymous tweet | E4 | Unreliable, doubtful — track but don't act |
| Competitor revenue is $10M ARR | Industry analyst estimate | B3 | Usually reliable source, but estimate not confirmed |

### Rating Application Rules

1. **Never act on single-source intelligence below B2**: Require confirmation
2. **Always note the rating when reporting to founder**: "Competitor is building X (B2 — job posting evidence)"
3. **Upgrade ratings as confirmation arrives**: D3 → B2 when confirmed by second independent source
4. **Downgrade ratings when contradicted**: B2 → C4 if new evidence contradicts
5. **Separate source reliability from information accuracy**: A great source can relay bad info; a poor source can accidentally share truth

---

## 3. The Intelligence Cycle

### Overview

The intelligence cycle is the process of converting raw information into actionable intelligence:

```
┌─────────────┐
│  DIRECTION   │ ← Founder's priorities drive collection
└──────┬──────┘
       ▼
┌─────────────┐
│ COLLECTION   │ ← Gather information from sources
└──────┬──────┘
       ▼
┌─────────────┐
│ PROCESSING   │ ← Filter, organize, translate
└──────┬──────┘
       ▼
┌─────────────┐
│  ANALYSIS    │ ← Synthesize, assess, conclude
└──────┬──────┘
       ▼
┌─────────────┐
│DISSEMINATION │ ← Deliver to founder
└──────┬──────┘
       ▼
┌─────────────┐
│  FEEDBACK    │ ← Was it useful? What's needed next?
└──────────────┘
       │
       └──────→ Back to DIRECTION (cycle repeats)
```

### Phase 1: Direction

The founder's decisions, concerns, and upcoming choices determine what intelligence to collect:

- Before a pricing decision: Collect competitor pricing intelligence
- Before market expansion: Collect regulatory and market size intelligence
- Before a technology decision: Collect technology assessment intelligence
- Ongoing: Collect threat monitoring intelligence

Cardinal maintains the PIR/SIR list and updates it based on the founder's evolving needs.

### Phase 2: Collection

Execute collection plans using available methods:

**Passive collection** (always running):
- Google Alerts
- RSS feeds
- Social media monitoring
- Review platform monitoring
- Automated web change detection

**Active collection** (triggered by specific CRs):
- Targeted web research
- Patent database searches
- Job posting analysis
- Financial filing review
- Conference/event monitoring

**Network collection** (relationship-based):
- Industry contacts
- Community participation
- Event networking
- Expert consultations

### Phase 3: Processing

Raw collection is messy. Processing makes it usable:

1. **Filter**: Remove duplicates, irrelevant items, confirmed noise
2. **Organize**: Categorize by PIR/SIR, tag with metadata (date, source, rating)
3. **Translate**: Convert technical jargon, foreign language, or coded language into clear English
4. **Index**: Store in a retrievable format (intelligence log/database)

### Phase 4: Analysis

This is where information becomes intelligence:

**Descriptive analysis**: What happened? (Timeline of events)
**Diagnostic analysis**: Why did it happen? (Cause analysis)
**Predictive analysis**: What will happen next? (Forecasting)
**Prescriptive analysis**: What should we do? (Recommendations)

Analysis methods (from other Cardinal seeds):
- SIFT filtering (Weak Signal Detection seed)
- ACH — Analysis of Competing Hypotheses (Competitive Intelligence seed)
- Pattern recognition (Pattern Recognition Advanced seed)
- Scenario mapping (Scenario Planning seed)
- Decision analysis (Strategic Decision Analysis seed)

### Phase 5: Dissemination

Deliver intelligence in the right format to the right person at the right time:

| Intelligence Type | Format | Recipient | Timing |
|------------------|--------|-----------|--------|
| Threat alert | Flash brief (1 paragraph) | Founder | Immediate |
| Weekly scan | Bullet summary | Founder | Monday morning |
| Monthly assessment | Full brief (2-3 pages) | Founder | First of month |
| Decision support | Decision brief template | Founder | Before decision deadline |
| Deep dive | Comprehensive analysis | Founder | On request |

### Phase 6: Feedback

After delivery, evaluate:
- Did the intelligence answer the question?
- Was it timely enough to be useful?
- Was the confidence level appropriate?
- What additional information is needed?
- Should any CRs be updated?

---

## 4. Analytical Confidence Levels

### The Problem of False Precision

"Competitor X will launch a voice feature in Q3" sounds authoritative but may be based on thin evidence. Confidence levels communicate how much the founder should trust the analysis.

### Confidence Framework

| Level | Label | Meaning | Evidence Required |
|-------|-------|---------|-------------------|
| 1 | Low Confidence | More likely wrong than right | Thin evidence, logical inference, single source |
| 2 | Moderate Confidence | More likely right than wrong | Multiple sources, pattern support, but significant gaps |
| 3 | High Confidence | Strong basis for assessment | Multiple confirmed sources, strong pattern match, minimal contradicting evidence |
| 4 | Very High Confidence | Nearly certain | Direct evidence from multiple A/B-rated sources, no contradicting evidence |

### Using Confidence Levels

**In intelligence reports**:
- "Competitor X is building a voice feature (HIGH CONFIDENCE — based on 3 voice engineer hires, a voice-related patent filing, and CEO comments at a conference)"
- "Competitor Y may be exploring an acquisition (LOW CONFIDENCE — based on a single anonymous report and unusual hiring pause)"

**In recommendations**:
- HIGH CONFIDENCE intelligence → recommend action
- MODERATE CONFIDENCE → recommend preparation, await confirmation
- LOW CONFIDENCE → recommend monitoring, no action yet

### Factors That Increase Confidence

1. Multiple independent sources confirming the same assessment
2. Assessment consistent with established patterns
3. Physical evidence (filings, job postings, code commits) vs opinions
4. Source reliability rating of A or B
5. Assessment has been stable over multiple collection cycles

### Factors That Decrease Confidence

1. Single source or correlated sources
2. Assessment contradicts established patterns (could be correct — but uncertainty is higher)
3. Evidence is indirect, speculative, or opinion-based
4. Source reliability rating of D or E
5. Assessment keeps changing as new information arrives

### Communicating Uncertainty

Words to use for different confidence levels:

| Confidence | Language |
|-----------|----------|
| Very High | "We assess that..." "The evidence confirms..." |
| High | "We judge that..." "Evidence strongly suggests..." |
| Moderate | "We believe that..." "Evidence indicates..." |
| Low | "We cannot confirm but..." "Preliminary evidence suggests..." |
| Very Low | "It is possible that..." "Unconfirmed reports suggest..." |

**Never say**: "We know for certain" (intelligence is never 100%), "Trust me" (show the evidence), or present speculation as fact.

---

## 5. Intelligence Collection Plan Template

### Master Collection Plan

```
INTELLIGENCE COLLECTION PLAN — [Quarter/Year]

PRIORITY INTELLIGENCE REQUIREMENTS:
1. [PIR-1]: [Question]
   Status: [Active / Answered / Deferred]
   Owner: Cardinal

2. [PIR-2]: [Question]
   ...

COLLECTION MATRIX:

| SIR | Source Type | Specific Source | Frequency | Method | Rating |
|-----|-----------|----------------|-----------|--------|--------|
| 1.1 | Digital | Competitor websites | Weekly | VisualPing | B2 |
| 1.2 | Professional | LinkedIn job postings | Bi-weekly | Manual scan | B2 |
| 1.3 | Financial | Crunchbase | Monthly | Alert + scan | A1 |
| 1.4 | Digital | Competitor pricing pages | Weekly | Screenshot archive | A1 |
| 1.5 | Media | Press releases, blogs | Weekly | RSS + alerts | B2 |
| 4.1 | Internal | Analytics dashboard | Weekly | Automated report | A1 |
| 4.2 | Internal | Stripe dashboard | Weekly | Manual review | A1 |
| 4.3 | Internal | Support tickets | Weekly | Review + categorize | A1 |
| 4.4 | Internal | Feature usage analytics | Monthly | Automated report | A1 |
| 4.5 | Internal | Cohort analysis | Monthly | Calculated | A2 |

RESOURCE ALLOCATION:
- Automated collection: [X hours/week to maintain]
- Manual collection: [Y hours/week to execute]
- Analysis: [Z hours/week to synthesize]

COLLECTION GAPS:
- [What we can't collect and why]
- [What we need but don't have a source for]
- [What we're collecting but not analyzing well]

PLAN REVIEW DATE: [When to update this plan]
```

---

## 6. Intelligence Failures — Learning from Mistakes

### Common Intelligence Failures

**Collection failure**: We didn't gather the right information
- Cause: Wrong CRs, insufficient sources, collection gaps
- Fix: Review CRs regularly, diversify sources, identify gaps proactively

**Analysis failure**: We had the data but drew the wrong conclusion
- Cause: Cognitive bias, insufficient analytical frameworks, groupthink
- Fix: Use structured analysis methods, seek disconfirming evidence, multiple perspectives

**Dissemination failure**: The intelligence existed but didn't reach the decision-maker in time
- Cause: Slow processing, wrong format, buried in noise
- Fix: Streamline reporting, prioritize by urgency, clear escalation paths

**Relevance failure**: The intelligence was accurate but didn't matter for the decision
- Cause: CRs not aligned with actual decisions, intelligence for intelligence's sake
- Fix: Tie every CR directly to a pending decision or known risk

### Post-Decision Intelligence Review

After every major decision, review:
1. What intelligence did we have?
2. Was it accurate? (Check against actual outcomes)
3. Was it timely? (Did we have it when we needed it?)
4. Was it sufficient? (Did we have enough to decide well?)
5. What did we miss? (What intelligence would have changed the decision?)
6. What should we do differently? (Update CRs, sources, or methods)

---

## 7. Operational Security for Intelligence

### Protecting Intelligence Methods and Sources

Intelligence has value only if competitors don't know what you know or how you know it.

**Protect your collection methods**:
- Don't publicly discuss your intelligence-gathering processes
- Don't reveal sources that gave you non-public insights
- Don't let competitors know which of their signals you're tracking

**Protect your analysis**:
- Strategic assessments are internal only
- Competitor profiles are confidential
- Scenario planning outputs stay within the Three-Headed Monster

**Protect your decisions**:
- Don't telegraph moves before you're ready
- Don't reveal your strategic logic to competitors
- Don't share intelligence-informed decisions without context (looks like intuition, not intelligence)

---

## 8. Integration with Other Cardinal Seeds

- **Weak Signal Detection**: Collection methods for emerging signals
- **Competitive Intelligence Operations**: OSINT collection specifically for competitors
- **Strategic Decision Analysis**: Intelligence as input to decision making
- **Scenario Planning Methodology**: Intelligence informing scenario probabilities
- **Risk Quantification Models**: Intelligence as input to risk assessment
- **Counter-Intelligence Basics**: Protecting intelligence operations
- **Information Warfare Defense**: Intelligence about information threats

---

## Summary

The intelligence collection plan turns Cardinal from a passive observer into an active intelligence service. The framework:

1. **Collection requirements**: Know exactly what intelligence you need and why
2. **Source reliability**: Rate every source to prevent bad intelligence from driving decisions
3. **Intelligence cycle**: Systematic process from direction through delivery and feedback
4. **Confidence levels**: Always communicate how much to trust the assessment
5. **Collection planning**: Organized, resourced, gap-aware collection operations
6. **Continuous improvement**: Learn from intelligence failures and improve the process

Cardinal does not guess. Cardinal collects, rates, analyzes, and advises — with stated confidence and transparent methodology. The founder decides with the best available intelligence.
