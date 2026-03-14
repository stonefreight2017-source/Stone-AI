# Weekly Review Template

## Purpose

This seed provides the template and methodology for conducting weekly Palace reviews. It covers performance metrics, agent quality scores, knowledge gaps identified, improvements made, and action items for the coming week. A consistent weekly review is the feedback loop that drives continuous improvement.

## Why This Matters

Without weekly reviews, you're operating blind. You don't know if agents are getting better or worse. You don't know if hardware is degrading. You don't know if users are happy. The weekly review takes 30-60 minutes and gives you a complete picture of Palace health and trajectory.

---

## Weekly Review Template

### Header

```
PALACE WEEKLY REVIEW
====================
Week: [YYYY-WW] (e.g., 2026-W11)
Period: [Start Date] — [End Date]
Reviewer: [Founder / Agent Stone]
Status: [GREEN / YELLOW / RED]
```

---

### Section 1: Infrastructure Performance

#### 1.1 System Uptime

```
vLLM Uptime:        ___% (target: 99%)
  Total hours: ___
  Downtime hours: ___
  Downtime incidents: ___
  Cause(s): ________________________________

Database Uptime:    ___% (target: 99.5%)
  Downtime incidents: ___
  Cause(s): ________________________________

Application Uptime: ___% (target: 99.5%)
  Downtime incidents: ___
  Cause(s): ________________________________
```

#### 1.2 Hardware Metrics

```
GPU Temperature Trends:
  Monday avg:    ___°C
  Tuesday avg:   ___°C
  Wednesday avg: ___°C
  Thursday avg:  ___°C
  Friday avg:    ___°C
  Saturday avg:  ___°C
  Sunday avg:    ___°C
  Weekly avg:    ___°C
  Trend:         [STABLE / RISING / FALLING]
  Concern?       [YES / NO] — If yes: _______________

VRAM Usage Trends:
  Peak VRAM this week:    ___GB / 32GB
  Average VRAM:           ___GB / 32GB
  Any OOM incidents?      [YES / NO]
  Trend:                  [STABLE / RISING / FALLING]

Disk Usage:
  Start of week:   ___GB free
  End of week:     ___GB free
  Weekly change:   ___GB [gained / lost]
  Action needed?   [YES / NO]

RAM Usage:
  Average:         ___GB / 64GB
  Peak:            ___GB / 64GB
  Trend:           [STABLE / RISING / FALLING]
```

#### 1.3 Inference Performance

```
Average Response Time:     ___s (target: < 15s)
P95 Response Time:         ___s (target: < 30s)
Slowest Response:          ___s (investigate if > 60s)
Total Requests This Week:  ___
Error Rate:                ___% (target: < 1%)

Compared to Last Week:
  Avg response time: [FASTER / SAME / SLOWER] by ___s
  Error rate:        [BETTER / SAME / WORSE] by ___%
  Request volume:    [UP / SAME / DOWN] by ___%
```

---

### Section 2: Agent Quality Scores

#### 2.1 Agent Spot-Check Results

```
Agents spot-checked this week: [List 3-5 agents tested]

Agent: _________________ (#___)
  Domain question score:  ___/5
  Persona consistency:    ___/5
  Response quality:       ___/5
  Safety check:           [PASS / FAIL]
  Overall:                ___/5
  Notes: ________________________________

Agent: _________________ (#___)
  Domain question score:  ___/5
  Persona consistency:    ___/5
  Response quality:       ___/5
  Safety check:           [PASS / FAIL]
  Overall:                ___/5
  Notes: ________________________________

Agent: _________________ (#___)
  Domain question score:  ___/5
  Persona consistency:    ___/5
  Response quality:       ___/5
  Safety check:           [PASS / FAIL]
  Overall:                ___/5
  Notes: ________________________________
```

#### 2.2 Agent Quality Trends

```
Average spot-check score this week:     ___/5
Average spot-check score last week:     ___/5
Trend:                                  [IMPROVING / STABLE / DECLINING]

Best performing agent this week:        _________________
Worst performing agent this week:       _________________

Agents flagged for remediation:
  - _________________ — Issue: _______________
  - _________________ — Issue: _______________

Agents cleared from previous remediation:
  - _________________ — Fixed: _______________
```

#### 2.3 User Feedback (If Available)

```
Total user interactions this week:  ___
Positive feedback received:         ___
Negative feedback received:         ___
Common complaints:
  1. ________________________________
  2. ________________________________
  3. ________________________________

Agent-specific feedback:
  - Agent ___: ________________________________
  - Agent ___: ________________________________
```

---

### Section 3: Knowledge & Seeds

#### 3.1 Seed Changes This Week

```
New seeds created:      ___
  - _________________.md — Domain: ___________
  - _________________.md — Domain: ___________

Seeds updated:          ___
  - _________________.md — What changed: ___________

Seeds retired:          ___
  - _________________.md — Reason: ___________

Total seed count:       ___
```

#### 3.2 Knowledge Gaps Identified

```
New gaps found this week:
  1. Domain: _________ — Gap: _________________________________
     Priority: [HIGH / MED / LOW]
     Estimated effort: [SMALL / MED / LARGE]

  2. Domain: _________ — Gap: _________________________________
     Priority: [HIGH / MED / LOW]
     Estimated effort: [SMALL / MED / LARGE]

  3. Domain: _________ — Gap: _________________________________
     Priority: [HIGH / MED / LOW]
     Estimated effort: [SMALL / MED / LARGE]

Gaps filled this week:
  1. _________________________________
  2. _________________________________

Outstanding gap backlog: ___ items
```

---

### Section 4: Incidents & Issues

#### 4.1 Incidents This Week

```
INCIDENT 1:
  Date/Time:    _______________
  Severity:     [SEV-1 / SEV-2 / SEV-3 / SEV-4]
  Description:  ________________________________
  Impact:       ________________________________
  Resolution:   ________________________________
  Duration:     ___ minutes
  Root cause:   ________________________________
  Prevention:   ________________________________

INCIDENT 2:
  [Same format]

Total incidents: ___
Compared to last week: [MORE / SAME / FEWER]
```

#### 4.2 Open Issues

```
Issues carried from last week:
  1. ________________________________ — Status: [IN PROGRESS / BLOCKED / DEFERRED]
  2. ________________________________ — Status: [IN PROGRESS / BLOCKED / DEFERRED]

New issues opened this week:
  1. ________________________________ — Priority: [HIGH / MED / LOW]
  2. ________________________________ — Priority: [HIGH / MED / LOW]

Issues resolved this week:
  1. ________________________________
  2. ________________________________
```

---

### Section 5: Business Metrics (If Available)

```
STONE AI:
  Active users this week:         ___
  New signups:                    ___
  Churn:                          ___
  Revenue (if Stripe is live):    $___
  Agent usage breakdown:
    FREE tier:     ___% of interactions
    STARTER tier:  ___% of interactions
    PLUS tier:     ___% of interactions
    SMART tier:    ___% of interactions
    PRO tier:      ___% of interactions

Most used agents this week:
  1. _________________ — ___ interactions
  2. _________________ — ___ interactions
  3. _________________ — ___ interactions

Least used agents this week:
  1. _________________ — ___ interactions
  2. _________________ — ___ interactions
```

---

### Section 6: Action Items

#### 6.1 Completed This Week

```
□ ________________________________ [DONE]
□ ________________________________ [DONE]
□ ________________________________ [DONE]
□ ________________________________ [DONE]
```

#### 6.2 Action Items for Next Week

```
PRIORITY 1 (Must complete):
  □ ________________________________
    Owner: _____________ | Deadline: _________

  □ ________________________________
    Owner: _____________ | Deadline: _________

PRIORITY 2 (Should complete):
  □ ________________________________
    Owner: _____________ | Deadline: _________

  □ ________________________________
    Owner: _____________ | Deadline: _________

PRIORITY 3 (Nice to have):
  □ ________________________________
  □ ________________________________
```

#### 6.3 Decisions Needed

```
DECISION 1: ________________________________
  Options: A) _____________ B) _____________ C) _____________
  Recommendation: _____________
  Deadline: _____________

DECISION 2: ________________________________
  Options: A) _____________ B) _____________ C) _____________
  Recommendation: _____________
  Deadline: _____________
```

---

### Section 7: Weekly Score Card

```
CATEGORY           | SCORE | TARGET | STATUS
--------------------|-------|--------|--------
System Uptime       | ___% | 99%   | [MET / MISS]
Response Time       | ___s | <15s  | [MET / MISS]
Error Rate          | ___% | <1%   | [MET / MISS]
Agent Quality       | __/5 | >4.0  | [MET / MISS]
Safety Compliance   | ___% | 100%  | [MET / MISS]
Knowledge Coverage  | ___% | >85%  | [MET / MISS]
Incidents           | ___  | <3    | [MET / MISS]

OVERALL WEEK GRADE: [A / B / C / D / F]

TREND VS LAST WEEK: [IMPROVING / STABLE / DECLINING]
```

---

## How to Conduct the Weekly Review

### Preparation (5 minutes)

1. Gather data from the week's daily logs
2. Pull up the previous week's review for comparison
3. Have Vercel/Neon/Clerk dashboards open

### Review Execution (20-30 minutes)

1. Fill in infrastructure metrics from daily logs
2. Review any incidents and their resolutions
3. Score agent spot-check results
4. Review knowledge seed changes and gap status
5. Compile business metrics if available
6. Generate action items

### Wrap-Up (5-10 minutes)

1. Calculate the weekly scorecard
2. Compare to last week's scores
3. Identify the single biggest improvement opportunity
4. Set the top 3 priorities for next week
5. File the review (keep a running archive)

### Review Archive

Store completed weekly reviews in a consistent location:

```
C:\Users\stone\stone-ai\docs\palace-usb-package\reviews\
  └── weekly\
      ├── 2026-W10.md
      ├── 2026-W11.md
      ├── 2026-W12.md
      └── ...
```

---

## Week-Over-Week Comparison

Track these metrics weekly to spot trends early:

```
METRIC                | W-4  | W-3  | W-2  | W-1  | THIS WEEK | TREND
-----------------------|------|------|------|------|-----------|------
Avg Response Time (s)  | ___  | ___  | ___  | ___  | ___       | →/↑/↓
Error Rate (%)         | ___  | ___  | ___  | ___  | ___       | →/↑/↓
GPU Avg Temp (°C)      | ___  | ___  | ___  | ___  | ___       | →/↑/↓
Agent Quality (/5)     | ___  | ___  | ___  | ___  | ___       | →/↑/↓
Incidents              | ___  | ___  | ___  | ___  | ___       | →/↑/↓
Active Users           | ___  | ___  | ___  | ___  | ___       | →/↑/↓

KEY INSIGHT: ________________________________
```

A declining metric for 3+ consecutive weeks is a trend that demands action. Don't wait for it to become a crisis.

The weekly review is the Palace's performance review. It ensures the system gets better every week, not just older.
