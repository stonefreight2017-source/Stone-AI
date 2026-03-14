# Wiz's Immune System — Full Specification

> Quality gates that prevent the Experience OS from degrading agent performance.
> Wiz (Royal Guard) operates all immune system functions.

---

## Design Philosophy

The immune system exists because learning systems can learn the wrong things. Without guardrails:
- A pattern extracted from a fluke success could become standard practice.
- Gradual behavioral drift could go undetected until quality collapses.
- Cross-domain contamination could cause a backend pattern to corrupt frontend decisions.

Wiz's immune system prevents all of these. It is conservative by design — better to slow down learning than to learn wrong.

---

## 1. Baseline Snapshots

### Purpose
Freeze agent performance metrics before Experience OS activates, creating a reference point for drift detection.

### Procedure

1. **Trigger:** First time Experience OS is activated for an agent.
2. **Initial snapshot:** Sparse (most fields null) because there's no history yet.
3. **Real baseline:** Taken automatically at the 25-entry mark, when enough data exists for meaningful metrics.
4. **Refresh:** Baseline is optionally refreshed every 90 days if founder approves. Old baseline is archived, not overwritten.

### Storage Format

File: `~/palace/experience/{agent-slug}/baselines.json`

```json
{
  "agent": "backend-engineer",
  "baselines": [
    {
      "snapshot_id": "baseline-uuid",
      "snapshot_date": "2026-03-08T00:00:00.000Z",
      "snapshot_type": "initial|25-entry|90-day-refresh",
      "entry_count_at_snapshot": 25,
      "metrics": {
        "average_quality_score": 7.2,
        "quality_score_stddev": 1.4,
        "average_completion_time_ms": 12000,
        "completion_time_stddev": 3500,
        "retry_rate": 0.12,
        "escalation_rate": 0.04,
        "approval_rate": 0.76,
        "rejection_rate": 0.08,
        "revision_rate": 0.16,
        "average_confidence": 3.8,
        "calibration_gap": 0.4,
        "task_type_distribution": {
          "code-build": 0.48,
          "code-fix": 0.32,
          "code-refactor": 0.12,
          "schema-change": 0.08
        }
      },
      "behavioral_fingerprint": {
        "common_approaches": [
          "reproduce-first for code-fix",
          "schema-then-api for code-build"
        ],
        "vocabulary_sample": [
          "implemented", "refactored", "validated", "tested"
        ],
        "average_output_length_chars": 2400,
        "typical_file_patterns": [
          "src/app/api/**/*.ts",
          "src/lib/**/*.ts"
        ],
        "pattern_count_active": 0,
        "pattern_count_candidate": 0
      }
    }
  ],
  "current_baseline_id": "baseline-uuid"
}
```

### Rules
- Baselines are IMMUTABLE once taken. They are reference points, not moving targets.
- The `current_baseline_id` points to the baseline used for drift comparison. Updated only on 90-day refresh.
- All baselines are retained (never deleted) for long-term trend analysis.

---

## 2. Quarantine Lifecycle

### Purpose
New patterns must prove themselves before influencing agent behavior. Quarantine prevents premature adoption of unreliable patterns.

### Lifecycle Stages

```
DISCOVERED → CANDIDATE → TESTING → ACTIVE
                ↓                    ↑
            REJECTED ← ← ← ← ← ← ←
                ↓
          ARCHIVED (with reason)
```

### Stage Details

#### CANDIDATE (Entry Point)
- Pattern is created by D2 pattern extraction or cross-domain synthesis.
- Stored in `candidates.json`.
- NOT available to agents during task execution.
- Wiz reviews candidate within 24 hours (next cron run).

**Wiz Review Checklist:**
1. Does the pattern contradict any active pattern? → If yes, route to contradiction resolution.
2. Is the evidence count >= 5? → If no, hold in candidate status until more evidence accumulates.
3. Is the domain_scope correctly assigned? → If no, reassign.
4. Is the rule clearly stated and actionable? → If no, rewrite.

#### TESTING (Probation)
- Pattern passes Wiz's review and enters testing.
- NOW available to agents, but marked as `status: "testing"`.
- Must be successfully applied 5 times (10 for cross-domain) without negative user signal.
- "Successfully applied" means: agent used the pattern AND the task received `approved` or `no-signal` (neutral or better).
- Counter: `testing_applications: 0, testing_successes: 0, testing_failures: 0`.

#### ACTIVE (Graduated)
- Testing threshold met.
- Moved from `candidates.json` to `patterns.json`.
- Full status: available to agents, contributes to strategy selection, influences retrieval ranking.

#### REJECTED
- Any testing application receives `rejected` or `re-dispatched` signal → pattern is rejected.
- OR Wiz's review identifies a fundamental flaw.
- Rejected patterns are logged to `_audit/quarantine-log.jsonl` with reason.
- Rejected patterns can be RESUBMITTED with modifications (new ID, `supersedes` field points to original).

### Storage

**candidates.json:**
```json
[
  {
    "id": "pattern-uuid",
    "status": "candidate|testing|rejected",
    "created": "ISO-8601",
    "rule": "...",
    "evidence_count": 5,
    "domain_scope": "backend",
    "wiz_reviewed": false,
    "wiz_review_date": null,
    "wiz_notes": null,
    "testing_started": null,
    "testing_applications": 0,
    "testing_successes": 0,
    "testing_failures": 0,
    "rejection_reason": null,
    "supersedes": null
  }
]
```

**_audit/quarantine-log.jsonl (append-only):**
```json
{"timestamp": "ISO-8601", "pattern_id": "uuid", "action": "reviewed|promoted|rejected|resubmitted", "reason": "...", "wiz_agent": "wiz"}
```

### Thresholds (Tunable by Phase 4 Meta-Learning)

| Parameter | Default | Min | Max |
|---|---|---|---|
| Testing success threshold | 5 | 3 | 10 |
| Cross-domain testing threshold | 10 | 5 | 15 |
| Minimum evidence count | 5 | 3 | 10 |
| Wiz review deadline | 24 hours | 1 hour | 72 hours |

---

## 3. Kill Switch

### Purpose
Per-agent experience reset when an agent's learned behavior becomes harmful. Surgical — only the named agent is affected.

### Command
```
/reset-experience [agent-slug]
```

### Execution Steps

1. **Validate:** Confirm `agent-slug` exists in `~/palace/experience/`.
2. **Archive:** Copy entire `experience/{agent-slug}/` to `experience/_archive/{agent-slug}-{ISO-timestamp}/`.
3. **Clear:** Delete all files in `experience/{agent-slug}/` and recreate empty directory with fresh structure:
   ```
   {agent-slug}/
   ├── journal.jsonl      (empty)
   ├── patterns.json      (seeded patterns only — reload from seed-patterns.json)
   ├── candidates.json    (empty array)
   ├── baselines.json     (empty — will rebuild at 25 entries)
   ├── strategies.json    (empty)
   └── meta/
       ├── calibration.json  (reset)
       ├── health-reports/   (empty)
       └── syntheses/        (empty)
   ```
4. **Log:** Write to `_audit/kill-switch-log.jsonl`:
   ```json
   {
     "timestamp": "ISO-8601",
     "agent": "agent-slug",
     "triggered_by": "founder|wiz-auto",
     "reason": "description of why reset was needed",
     "archive_path": "experience/_archive/agent-slug-2026-03-08T00:00:00Z/",
     "entries_archived": 342,
     "patterns_lost": 12
   }
   ```
5. **Notify:** Alert founder that reset is complete, with count of archived entries and patterns.

### Recovery

If the reset was a mistake:
1. Copy archived directory back to `experience/{agent-slug}/`.
2. Log restoration in `_audit/kill-switch-log.jsonl` with `action: "restored"`.

### Auto-Trigger Conditions

Wiz can auto-trigger kill switch (without founder command) ONLY if:
- Agent's quality_score average drops below 3.0 over 10 consecutive entries.
- Agent has 3+ active patterns with `contradiction_flags >= 3`.
- Drift detection shows > 40% deviation from baseline (2x the alert threshold).

Auto-triggers are logged with `triggered_by: "wiz-auto"` and founder is immediately notified.

---

## 4. Drift Detection

### Purpose
Detect when an agent's behavior has changed significantly from its baseline, which might indicate beneficial learning or harmful drift.

### Schedule
Monthly, run as a cron job. Also triggered on-demand by `/check-drift [agent-slug]`.

### Algorithm

#### Step 1: Generate Current Fingerprint

From the last 30 days of journal entries, compute:

```json
{
  "period": "2026-02-08 to 2026-03-08",
  "metrics": {
    "average_quality_score": 7.8,
    "quality_score_stddev": 1.1,
    "average_completion_time_ms": 10500,
    "retry_rate": 0.08,
    "escalation_rate": 0.02,
    "approval_rate": 0.82
  },
  "behavioral": {
    "common_approaches": ["..."],
    "average_output_length_chars": 2800,
    "task_type_distribution": {"...": "..."},
    "pattern_usage_rate": 0.65,
    "new_patterns_adopted": 3
  }
}
```

#### Step 2: Compare Against Baseline

For each metric, compute deviation:
```
deviation = abs(current - baseline) / baseline
```

#### Step 3: Compute Aggregate Drift Score

```javascript
function computeDriftScore(current, baseline) {
  const weights = {
    quality_score: 0.25,        // most important
    completion_time: 0.15,
    retry_rate: 0.15,
    escalation_rate: 0.15,
    approval_rate: 0.15,
    output_length: 0.05,
    task_distribution: 0.10
  };

  let totalDrift = 0;
  for (const [metric, weight] of Object.entries(weights)) {
    const deviation = Math.abs(current[metric] - baseline[metric]) / (baseline[metric] || 1);
    totalDrift += deviation * weight;
  }

  return totalDrift; // 0.0 = identical, 1.0 = 100% different
}
```

#### Step 4: Classify Drift

| Drift Score | Classification | Action |
|---|---|---|
| 0.00 - 0.10 | Stable | No action. Log only. |
| 0.10 - 0.20 | Minor drift | Log. Include in monthly health report. |
| 0.20 - 0.30 | Significant drift | **ALERT**: Wiz generates audit report for founder review. |
| 0.30 - 0.40 | Major drift | Alert + Wiz reviews all patterns adopted since last baseline. |
| 0.40+ | Critical drift | Alert + Auto-trigger kill switch consideration. |

#### Step 5: Determine Drift Direction

Drift can be positive (agent is getting better) or negative (agent is degrading):

```
If quality_score increased AND (retry_rate decreased OR approval_rate increased):
  → Positive drift (learning is working)
If quality_score decreased AND (retry_rate increased OR approval_rate decreased):
  → Negative drift (something went wrong)
Otherwise:
  → Mixed drift (some metrics improved, others degraded — needs human review)
```

**Positive drift above 0.20 still triggers an alert** — even beneficial change should be understood, not just accepted.

### Output: Drift Report

Stored in `_audit/drift-reports/{agent-slug}-{date}.json`:

```json
{
  "agent": "backend-engineer",
  "report_date": "2026-03-08",
  "period_analyzed": "2026-02-08 to 2026-03-08",
  "baseline_used": "baseline-uuid",
  "drift_score": 0.23,
  "drift_classification": "significant",
  "drift_direction": "positive",
  "metric_deviations": {
    "quality_score": { "baseline": 7.2, "current": 7.8, "deviation": 0.083, "direction": "improved" },
    "retry_rate": { "baseline": 0.12, "current": 0.08, "deviation": 0.333, "direction": "improved" },
    "completion_time": { "baseline": 12000, "current": 10500, "deviation": 0.125, "direction": "improved" },
    "output_length": { "baseline": 2400, "current": 2800, "deviation": 0.167, "direction": "increased" }
  },
  "patterns_adopted_this_period": ["pattern-uuid-1", "pattern-uuid-2"],
  "recommendation": "Drift is positive. Agent is improving. No action needed. Consider refreshing baseline at next 90-day window.",
  "requires_founder_review": true
}
```

---

## 5. Contradiction Resolution Protocol

### Purpose
When a new pattern contradicts an existing active pattern, resolve the contradiction before either can influence agent behavior.

### Detection

Run on every new pattern (candidate or testing):

```javascript
function detectContradiction(newPattern, activePatterns) {
  const sameDomain = activePatterns.filter(p =>
    p.domain_scope === newPattern.domain_scope ||
    p.domain_scope === 'cross-domain' ||
    newPattern.domain_scope === 'cross-domain'
  );

  for (const existing of sameDomain) {
    const overlap = keywordOverlap(newPattern.rule, existing.rule);
    if (overlap > 0.70) {
      // High keyword overlap = they're about the same topic
      // Now check if they prescribe different actions
      if (prescribesDifferentAction(newPattern.rule, existing.rule)) {
        return { contradicts: existing, overlap_score: overlap };
      }
    }
  }
  return null;
}
```

`prescribesDifferentAction` is a heuristic: looks for opposing keywords (e.g., "always" vs "never", "before" vs "after", "use X" vs "avoid X"). Not perfect, but catches the obvious cases. Edge cases go to human review.

### Resolution Queue

Contradictions are stored in `_audit/contradiction-queue.json`:

```json
[
  {
    "id": "contradiction-uuid",
    "detected_date": "ISO-8601",
    "new_pattern": { "id": "...", "rule": "..." },
    "existing_pattern": { "id": "...", "rule": "..." },
    "overlap_score": 0.78,
    "status": "pending|resolved",
    "resolution": null,
    "resolved_by": null,
    "resolved_date": null
  }
]
```

### Resolution Options

| Option | When to Use | Effect |
|---|---|---|
| **Keep existing** | New pattern has less evidence or lower success rate | New pattern is rejected. Existing unchanged. |
| **Replace** | New pattern has substantially more evidence AND higher success rate | Existing pattern gets `superseded_by: new.id`. New pattern activated. |
| **Merge** | Patterns are complementary, not truly contradictory | Create a merged pattern that incorporates both. Both originals get `superseded_by: merged.id`. |
| **Escalate** | Unclear which is better, or domain is critical (security) | Both patterns frozen. Founder decides. |
| **Scope split** | Patterns are both correct but for different sub-contexts | Narrow each pattern's tags/scope so they don't overlap. Both remain active. |

### Auto-Resolution Rules

Wiz can auto-resolve (without founder) if:
1. Evidence count difference is > 3x (clear winner by data volume).
2. Success rate difference is > 0.2 (clear winner by quality).
3. Neither pattern is in the `security` domain (security contradictions always escalate).

Otherwise, escalate to founder.

### Post-Resolution

1. Log resolution to `_audit/quarantine-log.jsonl`.
2. Update affected patterns' statuses.
3. If any agent has both patterns in their active set, update their `patterns.json`.
4. If resolution created a merged pattern, it enters quarantine like any new pattern.

---

## 6. Monthly Health Report

### Purpose
Regular summary of the immune system's observations, for founder review.

### Schedule
Generated monthly by cron, stored in `experience/{agent-slug}/meta/health-reports/{YYYY-MM}.json`.

### Report Format

```json
{
  "agent": "backend-engineer",
  "report_period": "2026-02",
  "generated_date": "2026-03-01T00:00:00.000Z",
  "summary": {
    "total_entries_this_month": 34,
    "total_entries_all_time": 187,
    "tier_distribution": { "hot": 50, "warm": 137, "cold": 0 }
  },
  "quality_metrics": {
    "average_quality_score": 7.6,
    "quality_trend": "improving",
    "approval_rate": 0.79,
    "rejection_rate": 0.06,
    "retry_rate": 0.09
  },
  "learning_metrics": {
    "patterns_active": 8,
    "patterns_in_testing": 2,
    "patterns_rejected_this_month": 1,
    "patterns_graduated_this_month": 1,
    "pattern_usage_rate": 0.62
  },
  "calibration": {
    "self_assessment_accuracy": 0.85,
    "calibration_gap": 0.3,
    "overconfidence_flag": false,
    "underconfidence_flag": false
  },
  "drift": {
    "drift_score": 0.15,
    "drift_classification": "minor",
    "drift_direction": "positive"
  },
  "immune_actions_this_month": {
    "quarantine_reviews": 3,
    "contradictions_detected": 0,
    "kill_switches_triggered": 0,
    "memory_audits_run": 4,
    "purges_executed": 0
  },
  "concerns": [
    "None this month."
  ],
  "recommendations": [
    "Agent is trending positively. Consider reducing quarantine threshold from 5 to 4 applications."
  ]
}
```

### Aggregated Health Report

In addition to per-agent reports, Wiz generates a system-wide summary:

```json
{
  "report_period": "2026-02",
  "agents_active": 8,
  "total_entries_system_wide": 412,
  "best_performing_agent": { "agent": "security-engineer", "avg_score": 8.4 },
  "worst_performing_agent": { "agent": "frontend-engineer", "avg_score": 6.1 },
  "system_concerns": [
    "frontend-engineer quality trending downward for 2 consecutive months. Recommend pattern review."
  ],
  "immune_system_health": {
    "quarantine_backlog": 0,
    "unresolved_contradictions": 0,
    "overdue_reviews": 0
  }
}
```

Stored in `experience/_audit/health-reports/system-{YYYY-MM}.json`.

---

## Immune System Cron Schedule

| Job | Frequency | Description |
|---|---|---|
| Wiz candidate review | Daily | Review any unreviewed candidates in all agents' `candidates.json` |
| Memory audit | Weekly | Random sample 5 cold-tier entries per agent, check forgetting accuracy |
| Drift detection | Monthly | Behavioral fingerprint comparison for all active agents |
| Health report generation | Monthly | Per-agent and system-wide health reports |
| Baseline refresh check | Every 90 days | Flag agents eligible for baseline refresh, present to founder |

---

## Emergency Procedures

### Cascade Failure
If 3+ agents show critical drift simultaneously:
1. Wiz flags as **system-level issue** (not individual agent problem).
2. All Experience OS processing is PAUSED (journaling continues, but pattern extraction and strategy selection stop).
3. Founder is alerted with full drift reports for all affected agents.
4. Resume only on founder command.

### False Positive Storm
If Wiz generates 5+ contradiction alerts in one day:
1. Likely indicates a fundamental assumption changed (e.g., tech stack migration).
2. Wiz pauses contradiction detection and presents batch report to founder.
3. Founder can bulk-resolve or authorize baseline refresh for affected domains.

### Immune System Self-Check
Monthly, Wiz audits its own operations:
- How many false positives did drift detection generate? (alerts where founder took no action)
- How many true negatives were missed? (quality drops that drift detection didn't catch)
- Adjust drift thresholds based on these findings (within bounds: 0.10-0.40 for alert threshold).
