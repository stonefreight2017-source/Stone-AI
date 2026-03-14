# Experience Operating System — Core Specification v1.0

> The cognitive machinery that lets Palace agents LEARN FROM EXPERIENCE.
> Not static knowledge — dynamic growth. Every interaction makes agents smarter.

---

## Architecture Overview

The Experience OS is a four-phase system layered onto Palace agents running on vLLM/Qwen 32B at the OMEN. Each phase builds on the previous. Phase 1 ships first and is fully self-contained. Phases 2-4 activate as journal data accumulates.

**Design Principles:**
- Filesystem-first: no database dependency for core learning (JSON/JSONL files)
- Context-budget-aware: Experience OS overhead stays under 4K tokens per call
- Latency-safe: no feature adds more than 500ms to dispatch
- VRAM-neutral: all experience processing is text-based (no embeddings in Phase 1)
- Surgically isolated: per-agent experiences, no cross-contamination without explicit synthesis

**Directory Structure:**
```
~/palace/experience/
├── {agent-slug}/
│   ├── journal.jsonl          # Append-only experience log
│   ├── patterns.json          # Extracted patterns (graduated from quarantine)
│   ├── candidates.json        # Quarantined candidate patterns
│   ├── baselines.json         # Behavioral fingerprint snapshots
│   ├── strategies.json        # Adaptive strategy library (Phase 3)
│   └── meta/
│       ├── calibration.json   # Self-assessment accuracy tracking
│       ├── health-reports/    # Monthly health reports from Wiz
│       └── syntheses/         # Cross-domain hypotheses (Phase 3)
├── _global/
│   ├── seed-patterns.json     # Cold-start patterns from Stone's Pattern Library
│   ├── taxonomy.json          # Failure/success category definitions
│   └── config.json            # System-wide thresholds and tuning knobs
└── _audit/
    ├── quarantine-log.jsonl   # All quarantine decisions
    ├── purge-log.jsonl        # All hard deletions
    └── drift-reports/         # Monthly drift detection results
```

---

## PHASE 1 — FOUNDATION

Phase 1 is the minimum viable learning system. It ships first and operates independently. All subsequent phases are additive layers on top of Phase 1 data.

### D1: Experience Journaling

**Trigger:** After every meaningful interaction where an agent produces deliverable output.

**"Meaningful" definition:** Any task that took more than a trivial lookup. Specifically:
- Any dispatched build task (code, config, content)
- Any research task that produced a deliverable
- Any strategic recommendation or analysis
- Any escalation or re-dispatch
- NOT: simple file reads, status checks, or single-line responses

**Journal Entry Schema:**

```json
{
  "id": "uuid-v4",
  "timestamp": "2026-03-08T14:30:00.000Z",
  "agent": "agent-slug",
  "session_id": "session-identifier",
  "task_type": "one of the defined categories below",
  "input_summary": "concise description of what was asked (max 200 chars)",
  "approach": "strategy chosen and reasoning (max 500 chars)",
  "output_summary": "what was delivered (max 300 chars)",
  "files_touched": ["list/of/file/paths.ts"],
  "quality_score": 7,
  "quality_rationale": "why this score — specific evidence (max 200 chars)",
  "user_signal": "approved|rejected|revised|no-signal",
  "signal_timestamp": null,
  "failure_points": [],
  "lessons": [],
  "patterns_applied": ["pattern-id-1"],
  "patterns_discovered": [],
  "confidence": 4,
  "context_tokens_used": 1200,
  "execution_time_ms": 4500,
  "retries": 0,
  "escalated": false,
  "infrastructure": {
    "vram_peak_mb": null,
    "latency_spike": false,
    "resource_contention": false
  },
  "tier": "hot",
  "relevance_score": 1.0,
  "last_accessed": "2026-03-08T14:30:00.000Z",
  "reuse_count": 0,
  "contradiction_flags": 0
}
```

**Task Type Categories:**

| Category | Used By | Examples |
|---|---|---|
| `code-build` | Frontend, Backend, DB Engineer | New feature, component, API route |
| `code-fix` | Frontend, Backend, DB Engineer | Bug fix, error resolution |
| `code-refactor` | Frontend, Backend, DB Engineer | Restructure, optimize, clean up |
| `config-change` | DevOps, Security | Env vars, deploy config, headers |
| `schema-change` | DB Engineer | Migration, model update |
| `security-audit` | Security | Vulnerability check, hardening |
| `research` | Cardinal, Explore | Competitor analysis, tech research |
| `strategy` | Stone, Cardinal | Business decision, optimization |
| `content-create` | Copywriting, Content | Marketing copy, documentation |
| `troubleshoot` | Any | Debugging, diagnosis |
| `escalation` | Stone | Re-dispatch, override, conflict resolution |
| `infrastructure` | Chaos, DevOps | Server, network, resource management |
| `user-interaction` | User-facing agents | Chat response, bestie interaction |
| `synthesis` | Cardinal, Stone | Cross-domain analysis, pattern synthesis |

**Journaling Rules:**
1. Journal entry is written AFTER task completion, never during.
2. Entry must be appended to `journal.jsonl` (one JSON object per line, newline-delimited).
3. Maximum entry size: 2KB. If `approach` or `lessons` would exceed limits, truncate with `[truncated]` marker.
4. If the agent crashes mid-task, the dispatching supervisor writes a minimal failure entry with `quality_score: 1` and `failure_points: ["agent-crash"]`.
5. Journal writes are fire-and-forget — a failed write never blocks task completion.

**Write Implementation (pseudo-code for palace.mjs integration):**
```javascript
async function writeJournalEntry(agentSlug, entry) {
  const journalPath = path.join(PALACE_DIR, 'experience', agentSlug, 'journal.jsonl');
  await fs.mkdir(path.dirname(journalPath), { recursive: true });
  const line = JSON.stringify({ ...entry, id: crypto.randomUUID() }) + '\n';
  await fs.appendFile(journalPath, line, 'utf-8');
}
```

---

### D6: Memory Architecture

Three-tier memory system that balances context budget against knowledge retention.

#### Hot Tier (Always Available)
- **Contents:** Last 50 journal entries per agent, sorted by recency.
- **Access pattern:** Loaded into context at dispatch time. Agent always has recent history.
- **Token budget:** ~2K tokens (50 entries x ~40 tokens each when compressed to summaries).
- **Format in context:**
  ```
  RECENT EXPERIENCE (last 50):
  - [2026-03-08] code-build: Built referral system API. Score: 8. Lesson: validate unique constraints at Prisma level, not app level.
  - [2026-03-07] code-fix: Fixed ESM import error. Score: 9. Pattern applied: dynamic-import-esm.
  ...
  ```
- **Compression rule:** Each entry is summarized to one line (max 150 chars) for context injection. Full entry remains in JSONL for detailed retrieval.

#### Warm Tier (Retrieved on Demand)
- **Contents:** Entries 51-500 per agent.
- **Access pattern:** Before starting a task, agent queries warm tier for top 3 most relevant past experiences by task_type match.
- **Retrieval method (Phase 1 — no embeddings):**
  1. Filter by matching `task_type`.
  2. Score by keyword overlap between current `input_summary` and stored entries.
  3. Boost entries with `quality_score >= 7` and `user_signal: "approved"`.
  4. Penalize entries with `contradiction_flags > 0`.
  5. Return top 3 by combined score.
- **Token budget:** ~1K tokens (3 entries x ~300 tokens each with lessons expanded).
- **Implementation:**
  ```javascript
  function retrieveRelevantExperience(agentSlug, currentTask, limit = 3) {
    const journal = readJSONL(journalPath(agentSlug));
    const warm = journal.slice(50, 500);
    const scored = warm
      .filter(e => e.task_type === currentTask.task_type || keywordOverlap(e, currentTask) > 0.3)
      .map(e => ({
        ...e,
        retrieval_score: keywordOverlap(e, currentTask)
          + (e.quality_score >= 7 ? 0.3 : 0)
          + (e.user_signal === 'approved' ? 0.2 : 0)
          - (e.contradiction_flags * 0.5)
          - relevanceDecay(e)
      }))
      .sort((a, b) => b.retrieval_score - a.retrieval_score);
    return scored.slice(0, limit);
  }
  ```

#### Cold Tier (Compressed Archive)
- **Contents:** Entries 500+ per agent.
- **Storage:** Compressed to summary-only format:
  ```json
  {
    "id": "original-id",
    "timestamp": "ISO-8601",
    "task_type": "code-build",
    "one_liner": "Built auth middleware with rate limiting",
    "quality_score": 8,
    "user_signal": "approved",
    "key_lesson": "Always check Clerk session before rate limit to avoid double-counting",
    "patterns": ["clerk-session-first"],
    "reuse_count": 3
  }
  ```
- **Access pattern:** Exact match only — retrieved when a specific pattern ID or lesson keyword is explicitly queried.
- **Token budget:** 0 tokens unless explicitly retrieved (then max 500 tokens for the retrieved entry).

#### Forgetting Curve

Entries lose relevance over time unless actively reused:

```
relevance = base_relevance * (0.9 ^ months_since_last_access)
```

- **Base relevance** = `quality_score / 10`
- **Months since last access** = floor((now - last_accessed) / 30 days)
- **Reuse resets the clock:** Every time an entry's pattern is applied or its lesson is referenced, `last_accessed` updates to now.
- **Purge threshold:** Entries with `relevance < 0.1` are eligible for cold-tier compression.
- **Exception:** Entries with `user_signal: "rejected"` have 2x decay rate (learn from failures faster, but let them fade faster too).

#### Memory Audit

Weekly automated check (cron job):
1. Random sample 5 cold-tier entries per agent.
2. For each: would this entry have been useful in the last 7 days of tasks? (keyword match against recent journal entries)
3. If 2+ entries would have been useful: forgetting curve is too aggressive — reduce decay rate by 0.02.
4. If 0 entries would have been useful: forgetting curve is appropriate, no change.
5. Log audit results to `_audit/` directory.

#### Purge Mechanism

Hard deletion criteria (entry is permanently removed from all tiers):
1. **Founder rejection:** Entry's approach was explicitly rejected by founder AND replacement approach succeeded.
2. **Contradiction threshold:** Entry has 3+ contradiction flags from newer, validated patterns.
3. **Proven-bad marker:** Stone or Wiz manually marks an entry as `proven-bad`.

Purge process:
1. Entry is logged to `_audit/purge-log.jsonl` with reason before deletion.
2. Any patterns derived from purged entries are flagged for review.
3. If a purged entry was the sole evidence for a pattern, that pattern is demoted to `candidate` status.

#### Infrastructure State Tracking

Alongside agent experiences, the system records infrastructure events:
```json
{
  "timestamp": "ISO-8601",
  "event_type": "vram_peak|latency_spike|resource_contention|oom_kill",
  "details": "vLLM VRAM hit 23.5GB during 32K context generation",
  "affected_agents": ["backend-engineer"],
  "task_ids": ["journal-entry-id"]
}
```

Stored in `~/palace/experience/_global/infrastructure-events.jsonl`. Referenced when an agent's poor performance correlates with infrastructure stress (prevents false negative signals).

---

### D7: Feedback Loops

Every piece of feedback — explicit or implicit — routes back to the journal entry that produced it, creating a closed learning loop.

#### Explicit Signals

| Signal | Source | Strength | Effect on quality_score |
|---|---|---|---|
| `approved` | Founder accepts output | Strong positive (+) | +2 (capped at 10) |
| `rejected` | Founder rejects output | Strong negative (-) | -3 (floored at 1) |
| `revised` | Founder modifies output | Moderate negative (-) | -1 |
| `re-dispatched` | Supervisor re-dispatches | Failure signal | -2, `escalated: true` |
| `graded` | Supervisor gives A-F grade | Calibrated signal | Maps to score: A=10, B=8, C=6, D=4, F=1 |

**Signal application process:**
1. Signal arrives (e.g., founder says "rejected" or supervisor grades "B").
2. Find the originating journal entry by `session_id` + `agent` + recency.
3. Update `user_signal` field and adjust `quality_score`.
4. Set `signal_timestamp` to now.
5. If the adjustment changes `quality_score` by 3+ points, flag all patterns derived from this entry for review.

#### Implicit Signals

Derived automatically from observable behavior:

| Signal | Measurement | Interpretation |
|---|---|---|
| Completion time | `execution_time_ms` | Trending down = improving. Trending up = struggling or tasks getting harder. |
| Retry count | `retries` field | 0 = clean execution. 1 = minor issue. 2+ = significant struggle. |
| Escalation | `escalated` field | Agent couldn't handle it — routing or capability failure. |
| Context usage | `context_tokens_used` | Trending up without task complexity increase = potential bloat. |

**Implicit signal processing:**
```javascript
function deriveImplicitSignals(entry, agentHistory) {
  const avgTime = average(agentHistory.filter(e => e.task_type === entry.task_type).map(e => e.execution_time_ms));
  const signals = {};

  if (entry.execution_time_ms < avgTime * 0.7) signals.speed = 'improving';
  if (entry.execution_time_ms > avgTime * 1.5) signals.speed = 'struggling';
  if (entry.retries >= 2) signals.reliability = 'struggling';
  if (entry.escalated) signals.routing = 'failure';

  return signals;
}
```

#### Signal Routing Rules

1. Every signal tags back to exactly one journal entry. No orphan signals.
2. If a signal applies to multiple entries (e.g., a multi-step task), it applies to the LAST entry in the chain.
3. Signals received more than 7 days after the originating entry are tagged as `delayed_signal: true` and given 50% weight.
4. Contradictory signals on the same entry (e.g., `approved` then `rejected`) — latest signal wins, previous signal is logged but overwritten.

#### Decay Rate

Feedback influence halves every 60 days:
```
effective_influence = raw_influence * (0.5 ^ (days_since_signal / 60))
```

This prevents ancient feedback from permanently dominating pattern weights. A pattern validated 6 months ago with no recent confirmation is worth 1/8 of its original influence.

#### Ceiling Rule

No single pattern gets more than 3x weight regardless of reinforcement count.

```
pattern_weight = min(base_weight * reinforcement_count, base_weight * 3)
```

This prevents runaway reinforcement where a frequently-used pattern becomes immune to challenge by newer, potentially better approaches.

---

### D3: Self-Assessment

Every agent runs self-assessment before submitting output. This is the quality gate that catches problems before the founder sees them.

#### Assessment Protocol

Before submitting any deliverable, the agent internally processes:

```
SELF-ASSESSMENT:
1. Rate this output 1-10 against the task requirements.
2. List 2 specific things that could be wrong with this output.
3. If confidence < 3, flag for supervisor review before delivery.
4. Check: does this output contradict any active patterns? If yes, note which ones.
```

**This assessment is included in the journal entry**, not in the output to the user. It's internal metacognition.

#### Calibration Tracking

The system tracks how well each agent's self-scores predict actual outcomes:

```json
{
  "agent": "backend-engineer",
  "calibration_window": "last-100-entries",
  "average_self_score": 7.2,
  "average_user_signal_score": 6.8,
  "calibration_gap": 0.4,
  "overconfidence_streak": 0,
  "underconfidence_streak": 2,
  "accuracy_trend": "improving"
}
```

Stored in `meta/calibration.json` per agent, updated after every signal is received.

#### Overconfidence Detection

If an agent's self-score consistently exceeds the eventual user signal by 2+ points over 5 consecutive entries:

1. Agent is flagged as `overconfident`.
2. A `-2 confidence penalty` is applied to future self-assessments (agent's internal confidence is reduced).
3. The penalty persists until 5 consecutive entries show calibration gap < 1 point.
4. Overconfidence flags are visible in health reports.

#### Underconfidence Detection

If an agent's self-score consistently falls below user signal by 2+ points over 5 consecutive entries:

1. Agent is flagged as `underconfident`.
2. A `+1 confidence boost` is applied (lighter correction — underconfidence is less harmful).
3. Same exit criteria: 5 consecutive calibrated entries.

#### Task-Type Rubrics

Each task type has specific scoring criteria so self-assessment is structured, not vibes-based:

**Code Tasks (code-build, code-fix, code-refactor):**
| Score Component | Weight | Criteria |
|---|---|---|
| Correctness | 40% | Does it work? Does it handle edge cases? |
| Style | 20% | Follows project conventions? Clean, readable? |
| Security | 20% | No injection vectors? Input validated? Auth checked? |
| Completeness | 20% | All requirements addressed? No TODO stubs? |

**Strategy Tasks (strategy, escalation):**
| Score Component | Weight | Criteria |
|---|---|---|
| Actionability | 40% | Can the founder act on this immediately? |
| Insight depth | 30% | Goes beyond obvious? Reveals non-obvious connections? |
| Completeness | 30% | Covers all angles? No blind spots? |

**Research Tasks (research, synthesis):**
| Score Component | Weight | Criteria |
|---|---|---|
| Depth | 35% | Goes deep enough to be useful? |
| Accuracy | 35% | Claims are verifiable? Sources cited? |
| Relevance | 30% | Directly applicable to the question asked? |

**Content Tasks (content-create):**
| Score Component | Weight | Criteria |
|---|---|---|
| Clarity | 30% | Clear, concise, no fluff? |
| Persuasion | 30% | Compelling? Drives action? |
| Brand alignment | 20% | Matches Stone AI voice? |
| Completeness | 20% | All requested elements present? |

---

### Wiz's Immune System (Phase 1)

The immune system prevents Experience OS from degrading agent quality. Wiz (Royal Guard) operates these gates. Full specification in `immune-system-spec.md`.

#### Baseline Snapshots

Before Experience OS activates for any agent, freeze current performance metrics:
```json
{
  "agent": "agent-slug",
  "snapshot_date": "ISO-8601",
  "metrics": {
    "average_quality_score": null,
    "average_completion_time_ms": null,
    "retry_rate": null,
    "escalation_rate": null,
    "approval_rate": null
  },
  "behavioral_fingerprint": {
    "common_approaches": [],
    "vocabulary_sample": [],
    "average_output_length": null,
    "typical_file_patterns": []
  }
}
```

Since this is activation time, initial baselines will be sparse. They populate as the first 25 entries accumulate. The system uses the 25-entry mark as the "real" baseline.

#### Quarantine

New patterns discovered by D2 (Phase 2) start in `candidate` status:
1. Pattern created → status: `candidate`, stored in `candidates.json`.
2. Pattern must be successfully applied 5 times without negative user signal.
3. After 5 successes → status: `active`, moved to `patterns.json`.
4. If any application during quarantine receives `rejected` or `re-dispatched` → status: `rejected`, logged to `_audit/quarantine-log.jsonl`.
5. Rejected patterns can be re-submitted with modifications (new ID, linked to original).

#### Kill Switch

Per-agent experience reset without affecting other agents:
- **Command:** `/reset-experience [agent-slug]`
- **Effect:** Archives current `experience/{agent-slug}/` to `experience/_archive/{agent-slug}-{timestamp}/`, creates fresh empty directory.
- **Scope:** Only the named agent. All other agents unaffected.
- **Recovery:** Archived data can be restored manually if the reset was a mistake.

#### Drift Detection

Monthly behavioral fingerprint comparison:
1. Generate current fingerprint from last 30 days of journal entries.
2. Compare against baseline fingerprint.
3. Deviation metrics: approach vocabulary shift, output length change, quality score trend, task_type distribution change.
4. Deviation > 20% on any metric → trigger audit (see `immune-system-spec.md` for full algorithm).
5. Audit = Wiz reviews the drifted agent's recent patterns and journal entries, generates report for founder.

#### Scope Enforcement

Patterns are tagged by domain. Cross-domain contamination is blocked:
- A pattern extracted from `backend-engineer` journal entries gets `domain_scope: "backend"`.
- When `frontend-engineer` runs task, backend-scoped patterns are excluded from retrieval.
- Exception: Phase 3 D5 (Knowledge Synthesis) can explicitly create cross-domain patterns, but these get their own `domain_scope: "cross-domain"` tag and require additional quarantine (10 applications instead of 5).

#### Contradiction Detection

Before a new pattern is added (even as candidate):
1. Compare new pattern's `rule` against all active patterns in the same `domain_scope`.
2. If semantic overlap > 70% (keyword match in Phase 1) AND the rules suggest different actions → contradiction detected.
3. Contradicting patterns go to a review queue (stored in `_audit/contradiction-queue.json`).
4. Resolution options: keep existing, replace with new, merge, or escalate to founder.
5. Neither pattern activates until contradiction is resolved.

---

## PHASE 2 — INTELLIGENCE

**Activation:** Phase 2 activates automatically when an agent accumulates 25+ journal entries. No manual trigger needed.

### D2: Pattern Recognition

#### Trigger
Every 25 new journal entries per agent, the system runs pattern extraction. This is a batch process, not real-time.

#### Process

1. **Cluster:** Group last 100 entries by `task_type`.
2. **Identify recurring factors:**
   - Success factors: what do entries with `quality_score >= 7` AND `user_signal: approved` have in common?
   - Failure factors: what do entries with `quality_score <= 4` OR `user_signal: rejected` have in common?
3. **Extract rules:** For each cluster with 5+ entries showing the same factor, generate a pattern.
4. **Validate:** Check against existing patterns for contradiction (per immune system).
5. **Store:** New patterns go to `candidates.json` with `status: "candidate"`.

#### Minimum Sample Requirement

A pattern requires 5+ supporting journal entries before creation. This prevents overfitting on small data or one-off situations.

#### Pattern Object Schema

```json
{
  "id": "pattern-uuid",
  "created": "ISO-8601",
  "last_validated": "ISO-8601",
  "rule": "Always validate unique constraints at the Prisma schema level, not in application code",
  "evidence_count": 7,
  "evidence_ids": ["journal-entry-id-1", "journal-entry-id-2"],
  "success_rate": 0.86,
  "confidence": 4,
  "domain_scope": "backend",
  "status": "active",
  "applications": 12,
  "last_applied": "ISO-8601",
  "tags": ["prisma", "validation", "constraints"],
  "failure_taxonomy": "scope_miss",
  "source": "extracted|seeded|cross-domain",
  "supersedes": null,
  "superseded_by": null
}
```

#### Failure Taxonomy

Every failure is categorized to enable targeted improvement:

| Category | Definition | Example |
|---|---|---|
| `logic_error` | Code or reasoning is wrong | Off-by-one, wrong condition |
| `scope_miss` | Didn't address all requirements | Built 3 of 4 requested features |
| `missing_context` | Lacked information needed for task | Didn't know about existing util function |
| `wrong_approach` | Chose fundamentally wrong strategy | Used REST when WebSocket was needed |
| `communication_gap` | Output didn't match what was asked | Built the right thing, explained it wrong |
| `integration_error` | Works alone, breaks with other components | API works but frontend can't consume it |
| `performance_issue` | Functionally correct but too slow/heavy | Query works but takes 30s |
| `security_gap` | Missing security consideration | No input validation on public endpoint |

---

## PHASE 3 — BEHAVIOR

**Activation:** Phase 3 activates when an agent has 10+ active patterns. Enough learned behavior to start making strategic choices.

### D4: Adaptive Strategy Selection

#### Strategy Library

Each agent maintains a strategy library per task type:
```json
{
  "task_type": "code-fix",
  "strategies": [
    {
      "id": "strategy-1",
      "name": "reproduce-first",
      "description": "Reproduce the bug before attempting fix. Verify reproduction. Then fix. Then verify fix resolves reproduction.",
      "success_rate": 0.89,
      "sample_size": 18,
      "average_quality_score": 7.8,
      "last_used": "ISO-8601"
    },
    {
      "id": "strategy-2",
      "name": "read-and-reason",
      "description": "Read the error, trace the code path, reason about the cause, fix without reproduction.",
      "success_rate": 0.62,
      "sample_size": 13,
      "average_quality_score": 6.1,
      "last_used": "ISO-8601"
    }
  ]
}
```

#### Selection Algorithm

```
1. Match current task to task_type.
2. Retrieve strategies for that task_type, sorted by success_rate.
3. Roll exploration check: random(0, 1) < 0.10?
   - YES: pick a random non-default strategy (exploration).
   - NO: pick the highest success_rate strategy (exploitation).
4. Log selected strategy in journal entry's `approach` field.
5. After task completion, update strategy's success_rate and sample_size.
```

#### Exploration Budget

10% of tasks use a non-default strategy. This prevents local optima — the "best" strategy might only be best because alternatives haven't been tried enough.

Exploration is suppressed when:
- Task is explicitly marked `urgent` by founder.
- Agent's last 3 tasks all received `rejected` signal (stabilize before exploring).
- Task involves production data or security-critical operations.

### D5: Knowledge Synthesis

Cross-domain pattern matching — the highest-value, highest-risk phase.

#### Process

1. **Monthly scan:** Compare active patterns across all agents.
2. **Structural similarity:** Look for patterns that share the same structure but different domains.
   - Example: "validate at schema level, not app level" (backend) is structurally similar to "enforce constraints in CSS, not JS" (frontend).
3. **Hypothesis generation:** Create a cross-domain hypothesis:
   ```json
   {
     "id": "hypothesis-uuid",
     "source_patterns": ["pattern-id-1", "pattern-id-2"],
     "hypothesis": "Enforcement should happen at the lowest possible layer in any stack",
     "domain_scope": "cross-domain",
     "status": "untested",
     "test_count": 0,
     "success_count": 0
   }
   ```
4. **Testing:** Next time a relevant task appears in any domain, the hypothesis is flagged as a candidate approach.
5. **Promotion:** 10 successful applications → graduate to active cross-domain pattern.
6. **Discard:** 3 failures → discard hypothesis, log reasoning.

**Safety:** Cross-domain patterns get extended quarantine (10 applications, not 5) because they're higher-risk generalizations.

---

## PHASE 4 — ACCELERATION

**Activation:** Phase 4 activates after 3 months of Phase 2/3 operation. Requires substantial data to be meaningful.

### D8: Meta-Learning

The system learns about its own learning.

#### Monthly Meta-Analysis

Automated report answering:
1. **Which experience types improved performance most?** — Compare quality_score trends by task_type.
2. **Which patterns had highest ROI?** — Patterns with highest (success_rate * application_count).
3. **Is self-assessment calibrating better or worse?** — Calibration gap trend over 3 months.
4. **Are forgetting curves well-tuned?** — Memory audit results trend.
5. **What's the exploration budget producing?** — Compare exploration task outcomes vs exploitation.

#### Learning Rate Tracking

```json
{
  "agent": "agent-slug",
  "period": "2026-Q1",
  "learning_velocity": {
    "quality_score_improvement_per_month": 0.3,
    "retry_rate_reduction_per_month": -0.05,
    "new_patterns_per_month": 2.1,
    "pattern_graduation_rate": 0.7,
    "calibration_improvement": 0.1
  }
}
```

#### System Optimization

Based on meta-analysis, auto-adjust:
- **Forgetting curve decay rate:** If valuable entries are being lost, reduce decay.
- **Quarantine threshold:** If most candidates graduate, reduce to 3 applications. If many fail, increase to 7.
- **Pattern extraction trigger:** If 25 entries produces too few patterns, try 20. If too many low-quality patterns, try 30.
- **Exploration budget:** If exploration never beats exploitation, reduce to 5%. If it frequently does, increase to 15%.

All adjustments are logged and bounded (no parameter moves more than 20% in a single adjustment). Adjustments require Wiz's immune system approval.

---

## CONSTRAINTS (Non-Negotiable)

### Context Window Budget
- Experience OS overhead MUST stay under 4K tokens per call.
- Breakdown: Hot tier summaries (~2K) + Retrieved warm entries (~1K) + Active patterns (~800) + Self-assessment prompt (~200).
- If budget is exceeded, truncate warm tier entries first, then reduce hot tier to last 25 entries.

### Latency Budget
- No Experience OS feature adds more than 500ms to agent dispatch.
- Journal writing is async (fire-and-forget) — 0ms added to response.
- Retrieval is the bottleneck — at <500 entries per agent, grep + JSON parse stays well under 500ms.
- If retrieval exceeds 500ms, fall back to hot-tier-only mode.

### VRAM
- All experience processing is text-based. No embeddings, no vector math, no model calls for retrieval.
- Phase 1 semantic similarity = keyword overlap (tf-idf style, computed in JS).
- Future: Phase 5 (not specified here) could add lightweight embeddings if VRAM allows.

### Cold Start
- Seed initial patterns from Stone's Pattern Library and existing Golden Seeds.
- See `pattern-library-seed.md` for the cold-start pattern set.
- Seeded patterns start as `active` (not `candidate`) because they're pre-validated by founder experience.

### Compatibility
- Works with vLLM + Qwen 2.5 32B AWQ on the OMEN.
- Works with Anthropic Claude Sonnet (cloud mode) — journal entries are identical, retrieval is identical.
- Agent-specific directories mean the same agent running on different models writes to the same journal.
- No model-specific behavior — Experience OS is model-agnostic.

---

## Integration Summary

### Where Hooks Go in palace.mjs (or Palace GUI)

1. **Pre-dispatch hook:** Load hot tier + retrieve warm tier + inject active patterns into agent prompt.
2. **Post-completion hook:** Write journal entry (async). Run self-assessment (sync, before output delivery).
3. **Post-signal hook:** When user signal is received, route it back to journal entry.
4. **Cron hooks:**
   - Every 25 entries: pattern extraction (Phase 2).
   - Weekly: memory audit.
   - Monthly: drift detection, meta-analysis (Phase 4), knowledge synthesis (Phase 3).

### Token Budget Allocation Per Call

```
Total context window: 32,768 tokens (Qwen 32B)
├── System prompt + agent identity: ~2,000 tokens
├── Experience OS injection: ~4,000 tokens (HARD CAP)
│   ├── Hot tier summaries: ~2,000
│   ├── Warm tier retrievals: ~1,000
│   ├── Active patterns: ~800
│   └── Self-assessment prompt: ~200
├── Task context (user input, files, etc.): ~22,000 tokens
└── Generation budget: ~4,768 tokens
```

This allocation ensures Experience OS never crowds out the actual task.
