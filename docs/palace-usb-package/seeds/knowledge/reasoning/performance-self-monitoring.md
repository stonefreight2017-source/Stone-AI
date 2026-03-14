# Performance Self-Monitoring — Response Quality, Latency, and Degradation Detection

## Purpose

This seed teaches the Palace how to monitor its own performance in real time. The Palace must track response quality metrics, measure latency at every stage of the pipeline, interpret user satisfaction signals, and detect degradation before users notice it. A system that cannot monitor itself cannot improve itself — and it certainly cannot run autonomously.

---

## Core Philosophy

Performance monitoring is not about dashboards and graphs. It is about answering one question at all times: "Is the Palace performing at or above its expected level right now?" If yes, continue. If no, diagnose and fix before the user feels it.

### Monitoring Principles

1. **Real-Time Over Historical**: Knowing you were fast yesterday does not help if you are slow right now. Monitoring must be current.
2. **Alerts Over Dashboards**: Nobody stares at dashboards. The system must push alerts when something is wrong.
3. **Leading Over Lagging**: Detect degradation in its early stages, not after users complain.
4. **Signal Over Noise**: Alert fatigue kills monitoring systems. Only alert on actionable conditions.
5. **Automated Over Manual**: If a human must check something regularly, it will eventually be missed. Automate the check.

---

## Response Quality Metrics

### Metric 1: Factual Accuracy

How often does the Palace provide correct information?

**Measurement approaches:**

- **Automated verification**: For queries with verifiable answers (code output, math, factual lookups), automatically check correctness
- **User correction tracking**: Count instances where users correct the Palace's response
- **Seed alignment scoring**: How well does the response align with the authoritative seed content?
- **Confidence-accuracy calibration**: When the Palace says it is 90% confident, is it right 90% of the time?

**Target**: > 95% for factual queries, > 85% for analysis/recommendation queries

**Alert threshold**: < 90% over any 1-hour window

### Metric 2: Relevance

Does the Palace answer the question that was actually asked?

**Measurement approaches:**

- **Intent match scoring**: Compare detected intent against the topic of the response
- **Follow-up analysis**: If the user immediately rephrases, the first response missed the intent
- **Conversation depth**: Relevant responses lead to deeper exploration; irrelevant ones lead to restarts
- **Bounce rate**: User asks one question and leaves — possible relevance failure

**Target**: > 90% intent match rate

**Alert threshold**: > 15% rephrase rate in any 1-hour window

### Metric 3: Completeness

Does the response contain everything the user needs, or do they have to ask follow-up questions for basic information?

**Measurement approaches:**

- **Follow-up prediction**: If the Palace can predict likely follow-ups and address them preemptively, the response is more complete
- **Information density**: Ratio of useful information to total response length
- **Task completion**: For actionable queries, can the user complete their task with just this response?

**Target**: > 75% single-response task completion for straightforward queries

**Alert threshold**: > 40% immediate follow-up rate

### Metric 4: Coherence

Is the response well-structured, logically consistent, and easy to follow?

**Measurement approaches:**

- **Structural analysis**: Proper use of paragraphs, lists, code blocks, and headers
- **Logical flow**: Does the response build from premise to conclusion?
- **Contradiction detection**: Does any part of the response contradict another part?
- **Reading level appropriateness**: Is the complexity matched to the user's demonstrated level?

**Target**: Coherence score > 0.85 (composite of structural, logical, and consistency checks)

### Metric 5: Tone Appropriateness

Does the response match the expected tone for the agent and context?

**Measurement approaches:**

- **Sentiment alignment**: Agent tone should match its personality profile
- **Context sensitivity**: Serious questions should not get playful answers
- **Consistency**: Tone should remain stable throughout a conversation
- **User preference matching**: Returning users develop expectations about tone

**Target**: Tone match > 0.80 against agent personality profile

---

## Latency Tracking

### The Response Pipeline

Every response goes through a pipeline. Each stage has a time budget:

```
RESPONSE PIPELINE STAGES:
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  Stage 1: Request Ingestion        Budget: 50ms          │
│  ├── Parse request                                       │
│  ├── Authenticate user                                   │
│  └── Rate limit check                                    │
│                                                          │
│  Stage 2: Intent Classification    Budget: 100ms         │
│  ├── Classify query type                                 │
│  ├── Determine complexity                                │
│  └── Select agent                                        │
│                                                          │
│  Stage 3: Context Assembly         Budget: 200ms         │
│  ├── Retrieve conversation history                       │
│  ├── Fetch user profile                                  │
│  ├── Search seed library                                 │
│  └── Assemble prompt                                     │
│                                                          │
│  Stage 4: Inference                Budget: varies        │
│  ├── Send to model (vLLM/Claude)                        │
│  ├── Stream tokens                                       │
│  └── Handle retries if needed                            │
│                                                          │
│  Stage 5: Post-Processing          Budget: 100ms         │
│  ├── Safety check                                        │
│  ├── Format response                                     │
│  ├── Log metrics                                         │
│  └── Deliver to user                                     │
│                                                          │
│  TOTAL BUDGET:                                           │
│  Simple query: < 3 seconds                               │
│  Complex query: < 10 seconds                             │
│  Code generation: < 15 seconds                           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Latency Metrics

| Metric | Description | Target | Alert |
|--------|-------------|--------|-------|
| Time to First Token (TTFT) | Time from request to first response token | < 500ms | > 1000ms |
| Total Response Time | Time from request to last response token | < 5s simple, < 15s complex | > 2x target |
| Stage Latency | Time spent in each pipeline stage | Within stage budget | > 2x budget |
| Queue Wait Time | Time request spends waiting before processing | < 100ms | > 500ms |
| Model Inference Time | Raw time spent in the language model | Varies by model | > historical p95 |
| Seed Retrieval Time | Time to search and retrieve relevant seeds | < 200ms | > 500ms |

### Latency Percentiles

Do not monitor only averages. Averages hide problems.

```
LATENCY MONITORING:
├── p50 (median): What the typical user experiences
├── p90: What 10% of users experience — this is where problems start
├── p95: Degradation signal — if p95 spikes, investigate
├── p99: Tail latency — catches intermittent infrastructure issues
└── max: Worst case — should never exceed 30 seconds for any query
```

### Time-Based Latency Analysis

Track latency patterns over time to detect:

- **Load-dependent degradation**: Does latency increase during peak hours?
- **Model warmup issues**: Is the first query after idle significantly slower?
- **Resource contention**: Do multiple concurrent requests slow each other down?
- **Gradual creep**: Is average latency slowly increasing week over week? (Memory leaks, index bloat, etc.)

---

## User Satisfaction Signals

### Explicit Signals

These are direct user actions that indicate satisfaction or dissatisfaction:

| Signal | Interpretation | Weight |
|--------|---------------|--------|
| Thumbs up / positive rating | Direct satisfaction | High |
| Thumbs down / negative rating | Direct dissatisfaction | High |
| "Thank you" / gratitude expression | Satisfied | Medium |
| "That's wrong" / correction | Dissatisfied with accuracy | High |
| Positive emoji reaction | Mild satisfaction | Low |
| Report/flag | Serious dissatisfaction | Critical |

### Implicit Signals

These are behavioral patterns that indicate satisfaction without the user explicitly stating it:

| Signal | Positive Interpretation | Negative Interpretation |
|--------|------------------------|------------------------|
| Conversation continues | Engaged, getting value | Could be trying to get a good answer |
| Conversation ends after 1 exchange | Question answered completely | OR gave up |
| User returns within 7 days | Trust in the system | — |
| User rephrases immediately | — | First response missed intent |
| User asks for more detail | Interested, wants depth | — |
| User abandons mid-response | — | Response was unhelpful or too slow |
| User switches agents | — | Current agent was wrong choice |
| Long time between messages | Thinking / implementing | OR distracted / gave up |

### Satisfaction Scoring

Combine explicit and implicit signals into a per-conversation satisfaction score:

```
satisfaction = (
  explicit_positive * 1.0 +
  explicit_negative * -1.0 +
  implicit_positive * 0.5 +
  implicit_negative * -0.5
) / total_signals

Normalize to 0.0 - 1.0 range
```

### Aggregate Satisfaction Tracking

```
SATISFACTION DASHBOARD:
╔══════════════════════════════════════════╗
║  REAL-TIME SATISFACTION MONITOR          ║
╠══════════════════════════════════════════╣
║                                          ║
║  Last 1 hour:   0.78 (↑ from 0.74)     ║
║  Last 24 hours: 0.76 (stable)           ║
║  Last 7 days:   0.75 (↑ from 0.72)     ║
║  Last 30 days:  0.74 (↑ from 0.71)     ║
║                                          ║
║  BY AGENT (Last 24h):                    ║
║  Agent 01: 0.82  Agent 15: 0.79         ║
║  Agent 05: 0.80  Agent 22: 0.68 ⚠️     ║
║  Agent 12: 0.78  Agent 31: 0.72         ║
║                                          ║
║  BY TIER (Last 24h):                     ║
║  FREE:    0.71  PLUS:   0.78            ║
║  STARTER: 0.74  SMART:  0.80            ║
║                                          ║
║  ALERT: Agent 22 below threshold         ║
║                                          ║
╚══════════════════════════════════════════╝
```

---

## Degradation Detection

### What Is Degradation?

Degradation is when system performance drops below established baselines. It can be:

- **Sudden**: A component fails, latency spikes, error rate jumps
- **Gradual**: Performance slowly worsens over days or weeks
- **Intermittent**: Performance is fine most of the time but periodically drops
- **Localized**: Only one agent, one query type, or one user segment is affected

### Detection Methods

#### 1. Threshold Alerts

The simplest form — if a metric crosses a predefined line, alert.

```
THRESHOLD CONFIGURATION:
├── Response quality < 0.70    → ALERT: Quality degradation
├── TTFT > 1000ms              → ALERT: Latency spike
├── Error rate > 5%            → ALERT: Error surge
├── Satisfaction < 0.65        → ALERT: User experience degradation
├── Escalation rate > 20%      → ALERT: Agent failure
├── GPU utilization > 95%      → ALERT: Resource saturation
└── Context window overflow > 1% → ALERT: Context management issue
```

#### 2. Anomaly Detection

Statistical methods that detect unusual patterns without predefined thresholds:

- **Z-score monitoring**: If a metric deviates more than 2 standard deviations from its rolling mean, flag it
- **Seasonal decomposition**: Account for time-of-day and day-of-week patterns before flagging anomalies
- **Changepoint detection**: Identify moments when the statistical properties of a metric series change

#### 3. Trend Analysis

Detect gradual degradation that threshold alerts miss:

```python
# Pseudo-code for trend detection
def detect_trend(metric_series, window=7):
    slope = linear_regression(metric_series[-window:]).slope
    if slope < -0.01:  # 1% decline per day
        return "DEGRADING"
    elif slope > 0.01:
        return "IMPROVING"
    else:
        return "STABLE"
```

#### 4. Correlation Analysis

When one metric degrades, check correlated metrics:

- Latency spike + error rate increase = infrastructure problem
- Quality drop + no latency change = knowledge or prompt problem
- Satisfaction drop + no quality change = UX or personality problem
- Single-agent degradation + others stable = agent-specific issue

### Degradation Response Protocol

```
SEVERITY LEVELS:
├── SEV-1: CRITICAL
│   Conditions: System partially or fully down, data loss risk, safety failure
│   Response time: Immediate (< 5 minutes)
│   Actions: Page founder, activate emergency procedures, rollback if possible
│   Notifications: Founder alert via email, in-app banner for users
│
├── SEV-2: HIGH
│   Conditions: Major quality degradation, latency > 3x normal, single agent down
│   Response time: < 30 minutes
│   Actions: Investigate root cause, implement fix or workaround
│   Notifications: Founder notification, affected users see degraded mode notice
│
├── SEV-3: MEDIUM
│   Conditions: Noticeable quality dip, latency > 1.5x normal, elevated error rate
│   Response time: < 4 hours
│   Actions: Root cause analysis, schedule fix
│   Notifications: Founder notified in daily summary
│
└── SEV-4: LOW
    Conditions: Minor metric deviation, single-user issue, cosmetic problem
    Response time: < 24 hours
    Actions: Log, investigate during next maintenance window
    Notifications: Included in weekly report
```

---

## Infrastructure Metrics

### GPU Monitoring (vLLM)

| Metric | Description | Target | Alert |
|--------|-------------|--------|-------|
| GPU Utilization | Processing load | 60-85% | > 95% or < 10% |
| VRAM Usage | Memory consumption | < 90% | > 95% |
| GPU Temperature | Thermal status | < 80C | > 85C |
| Inference Throughput | Tokens per second | > 50 tok/s | < 30 tok/s |
| Queue Depth | Pending inference requests | < 10 | > 50 |

### Database Monitoring

| Metric | Description | Target | Alert |
|--------|-------------|--------|-------|
| Query Latency (p95) | Database response time | < 50ms | > 200ms |
| Connection Pool Usage | Active connections | < 80% | > 90% |
| Disk Usage | Storage consumption | < 80% | > 90% |
| Replication Lag | If applicable | < 1s | > 5s |
| Slow Queries | Queries exceeding threshold | 0 per hour | > 5 per hour |

### Network Monitoring

| Metric | Description | Target | Alert |
|--------|-------------|--------|-------|
| API Response Time | End-to-end HTTP response | < 200ms | > 500ms |
| Error Rate (5xx) | Server errors | < 0.1% | > 1% |
| Error Rate (4xx) | Client errors (may indicate bugs) | < 5% | > 10% |
| Bandwidth Usage | Network throughput | Below limit | > 80% limit |
| DNS Resolution | Domain lookup time | < 50ms | > 200ms |

---

## Monitoring Data Retention

```
RETENTION POLICY:
├── Real-time metrics (1-second granularity): 1 hour
├── Minute-level aggregates: 7 days
├── Hourly aggregates: 90 days
├── Daily aggregates: 2 years
├── Monthly aggregates: Indefinite
├── Alert history: 1 year
├── Incident reports: Indefinite
└── Raw conversation logs: Per privacy policy
```

---

## Self-Monitoring Health Check

The monitoring system itself must be monitored:

1. **Is data flowing?** — If no new data points arrive for 5 minutes, the collection system may be down
2. **Are alerts working?** — Send a test alert daily to verify the alert pipeline
3. **Is storage growing normally?** — Unexpected growth or shrinkage indicates collection issues
4. **Are calculations correct?** — Run known-value test data through the metrics pipeline periodically

---

## Integration Points

- **self-improvement-protocols.md**: Monitoring provides the metrics that drive improvement decisions
- **quality-regression-detection.md**: Regression detection is a subset of degradation detection
- **emergency-operations-procedures.md**: SEV-1 and SEV-2 alerts trigger emergency procedures
- **self-diagnostic-routines.md**: Diagnostic routines use monitoring data to identify issues
- **growth-metrics-tracking.md**: Performance metrics are inputs to growth tracking
- **agent-evolution-framework.md**: Agent performance metrics drive evolution priorities

---

## Summary

Performance self-monitoring is the Palace's nervous system. It tracks response quality across five dimensions (accuracy, relevance, completeness, coherence, tone), measures latency at every pipeline stage, interprets both explicit and implicit user satisfaction signals, and detects degradation through thresholds, anomaly detection, trend analysis, and correlation. Infrastructure metrics ensure the hardware and services backing the Palace are healthy. The monitoring system monitors itself. Alerts are severity-graded with clear response protocols. The founder receives daily summaries and immediate alerts for critical issues. A Palace that cannot monitor itself cannot improve itself — and it certainly cannot run autonomously.
