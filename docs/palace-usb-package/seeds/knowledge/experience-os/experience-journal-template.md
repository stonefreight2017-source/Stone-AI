# Experience Journal Templates

> Ready-to-use journal entry templates for each agent type.
> Each template pre-fills `task_type` categories and rubric criteria relevant to that role.

---

## How to Use These Templates

1. At task completion, the dispatching system selects the correct template based on agent type.
2. The agent fills in the dynamic fields (marked with `<<FILL>>`).
3. The completed entry is serialized to JSON and appended to `~/palace/experience/{agent-slug}/journal.jsonl`.
4. Maximum entry size: 2KB. Truncate `approach` and `lessons` fields first if over budget.

---

## Template 1: Head Template (Stone, Cardinal, Chaos)

**Used by:** Agent Stone (Head 1), Cardinal (Head 2), Chaos (#44)

**Pre-filled task_type options:**
- `strategy` — Business decisions, optimization recommendations
- `escalation` — Re-dispatch, conflict resolution, override
- `synthesis` — Cross-domain analysis, pattern synthesis
- `infrastructure` — (Chaos only) Server, network, resource management
- `research` — (Cardinal only) Competitive analysis, intelligence gathering

**Pre-filled rubric (Strategy/Escalation):**
| Component | Weight | Score <<FILL>> |
|---|---|---|
| Actionability — can founder act on this immediately? | 40% | /10 |
| Insight depth — goes beyond obvious? | 30% | /10 |
| Completeness — covers all angles? | 30% | /10 |

**Entry Template:**
```json
{
  "id": "<<AUTO>>",
  "timestamp": "<<AUTO>>",
  "agent": "<<agent-slug: stone|cardinal|chaos>>",
  "session_id": "<<AUTO>>",
  "task_type": "<<strategy|escalation|synthesis|infrastructure|research>>",
  "input_summary": "<<FILL: what was the strategic question or escalation trigger (max 200 chars)>>",
  "approach": "<<FILL: which framework was used (OODA, First Principles, Theory of Constraints, Inversion, etc.) and why (max 500 chars)>>",
  "output_summary": "<<FILL: what recommendation or action was taken (max 300 chars)>>",
  "files_touched": [],
  "quality_score": "<<FILL: 1-10 per rubric above>>",
  "quality_rationale": "<<FILL: specific evidence for the score (max 200 chars)>>",
  "user_signal": "no-signal",
  "signal_timestamp": null,
  "failure_points": ["<<FILL or empty>>"],
  "lessons": ["<<FILL: what to do differently, what framework worked/didn't>>"],
  "patterns_applied": ["<<FILL: pattern IDs used>>"],
  "patterns_discovered": ["<<FILL: any new patterns observed>>"],
  "confidence": "<<FILL: 1-5>>",
  "context_tokens_used": "<<AUTO>>",
  "execution_time_ms": "<<AUTO>>",
  "retries": 0,
  "escalated": false,
  "infrastructure": {
    "vram_peak_mb": null,
    "latency_spike": false,
    "resource_contention": false
  },
  "tier": "hot",
  "relevance_score": 1.0,
  "last_accessed": "<<AUTO>>",
  "reuse_count": 0,
  "contradiction_flags": 0,
  "_meta": {
    "template": "head",
    "rubric_scores": {
      "actionability": "<<FILL: 1-10>>",
      "insight_depth": "<<FILL: 1-10>>",
      "completeness": "<<FILL: 1-10>>"
    },
    "framework_used": "<<FILL: OODA|first-principles|theory-of-constraints|inversion|custom>>",
    "decision_outcome": "<<FILL: accepted|deferred|modified|rejected-by-founder>>"
  }
}
```

**Head-Specific Fields:**
- `_meta.framework_used` — Tracks which strategic framework was applied so the system can correlate frameworks with success rates.
- `_meta.decision_outcome` — Tracks what happened to the recommendation, separate from `user_signal` (which is about output quality, not decision adoption).

---

## Template 2: Royal Guard Template (Wiz)

**Used by:** Wiz (Quality Guardian, immune system operator)

**Pre-filled task_type options:**
- `security-audit` — Vulnerability assessment, hardening check
- `code-review` — Quality gate review, pattern compliance check
- `drift-detection` — Behavioral fingerprint comparison
- `quarantine-review` — Candidate pattern evaluation
- `contradiction-resolution` — Conflicting pattern adjudication

**Pre-filled rubric (Audit/Review):**
| Component | Weight | Score <<FILL>> |
|---|---|---|
| Thoroughness — all attack vectors / quality dimensions checked? | 40% | /10 |
| Accuracy — findings are real, not false positives? | 35% | /10 |
| Actionability — clear remediation steps? | 25% | /10 |

**Entry Template:**
```json
{
  "id": "<<AUTO>>",
  "timestamp": "<<AUTO>>",
  "agent": "wiz",
  "session_id": "<<AUTO>>",
  "task_type": "<<security-audit|code-review|drift-detection|quarantine-review|contradiction-resolution>>",
  "input_summary": "<<FILL: what was audited/reviewed (max 200 chars)>>",
  "approach": "<<FILL: checklist or methodology used (max 500 chars)>>",
  "output_summary": "<<FILL: findings summary — how many issues, severity (max 300 chars)>>",
  "files_touched": ["<<FILL: files reviewed>>"],
  "quality_score": "<<FILL: 1-10 per rubric above>>",
  "quality_rationale": "<<FILL>>",
  "user_signal": "no-signal",
  "signal_timestamp": null,
  "failure_points": ["<<FILL: any missed vulnerabilities discovered later>>"],
  "lessons": ["<<FILL>>"],
  "patterns_applied": ["<<FILL>>"],
  "patterns_discovered": ["<<FILL>>"],
  "confidence": "<<FILL: 1-5>>",
  "context_tokens_used": "<<AUTO>>",
  "execution_time_ms": "<<AUTO>>",
  "retries": 0,
  "escalated": false,
  "infrastructure": {
    "vram_peak_mb": null,
    "latency_spike": false,
    "resource_contention": false
  },
  "tier": "hot",
  "relevance_score": 1.0,
  "last_accessed": "<<AUTO>>",
  "reuse_count": 0,
  "contradiction_flags": 0,
  "_meta": {
    "template": "royal-guard",
    "rubric_scores": {
      "thoroughness": "<<FILL: 1-10>>",
      "accuracy": "<<FILL: 1-10>>",
      "actionability": "<<FILL: 1-10>>"
    },
    "findings_count": "<<FILL: total issues found>>",
    "severity_breakdown": {
      "critical": 0,
      "high": 0,
      "medium": 0,
      "low": 0,
      "info": 0
    },
    "false_positive_count": 0,
    "immune_system_action": "<<FILL: none|quarantine|kill-switch|drift-alert|contradiction-flag>>"
  }
}
```

**Wiz-Specific Fields:**
- `_meta.severity_breakdown` — Categorized findings for trend analysis.
- `_meta.false_positive_count` — Tracks Wiz's accuracy over time. High false positive rate = Wiz needs recalibration.
- `_meta.immune_system_action` — What immune system action, if any, was triggered by this review.

---

## Template 3: Builder Template (Frontend, Backend, DB Engineer)

**Used by:** Senior Frontend Engineer, Senior Backend Engineer, Senior Database Engineer

**Pre-filled task_type options:**
- `code-build` — New feature, component, API route, migration
- `code-fix` — Bug fix, error resolution
- `code-refactor` — Restructure, optimize, clean up
- `schema-change` — (DB Engineer only) Migration, model update

**Pre-filled rubric (Code Tasks):**
| Component | Weight | Score <<FILL>> |
|---|---|---|
| Correctness — does it work? Edge cases handled? | 40% | /10 |
| Style — follows project conventions? Clean, readable? | 20% | /10 |
| Security — no injection vectors? Input validated? Auth checked? | 20% | /10 |
| Completeness — all requirements addressed? No TODO stubs? | 20% | /10 |

**Entry Template:**
```json
{
  "id": "<<AUTO>>",
  "timestamp": "<<AUTO>>",
  "agent": "<<agent-slug: frontend-engineer|backend-engineer|db-engineer>>",
  "session_id": "<<AUTO>>",
  "task_type": "<<code-build|code-fix|code-refactor|schema-change>>",
  "input_summary": "<<FILL: what was the build/fix/refactor requirement (max 200 chars)>>",
  "approach": "<<FILL: architecture decision, file structure chosen, key design choices (max 500 chars)>>",
  "output_summary": "<<FILL: what was built/fixed/refactored (max 300 chars)>>",
  "files_touched": ["<<FILL: every file created or modified>>"],
  "quality_score": "<<FILL: 1-10 per rubric above>>",
  "quality_rationale": "<<FILL>>",
  "user_signal": "no-signal",
  "signal_timestamp": null,
  "failure_points": ["<<FILL: compilation errors, test failures, missed requirements>>"],
  "lessons": ["<<FILL: what to do differently, gotchas discovered>>"],
  "patterns_applied": ["<<FILL>>"],
  "patterns_discovered": ["<<FILL>>"],
  "confidence": "<<FILL: 1-5>>",
  "context_tokens_used": "<<AUTO>>",
  "execution_time_ms": "<<AUTO>>",
  "retries": "<<FILL: how many attempts before success>>",
  "escalated": false,
  "infrastructure": {
    "vram_peak_mb": null,
    "latency_spike": false,
    "resource_contention": false
  },
  "tier": "hot",
  "relevance_score": 1.0,
  "last_accessed": "<<AUTO>>",
  "reuse_count": 0,
  "contradiction_flags": 0,
  "_meta": {
    "template": "builder",
    "rubric_scores": {
      "correctness": "<<FILL: 1-10>>",
      "style": "<<FILL: 1-10>>",
      "security": "<<FILL: 1-10>>",
      "completeness": "<<FILL: 1-10>>"
    },
    "lines_added": "<<FILL>>",
    "lines_removed": "<<FILL>>",
    "files_created": [],
    "files_modified": [],
    "dependencies_added": [],
    "breaking_changes": false,
    "tests_written": false,
    "type_check_passed": "<<FILL: true|false|not-run>>"
  }
}
```

**Builder-Specific Fields:**
- `_meta.lines_added/removed` — Tracks code volume for effort estimation improvement.
- `_meta.breaking_changes` — Flags tasks that changed interfaces, helping predict integration issues.
- `_meta.type_check_passed` — Critical quality signal for TypeScript codebase.

---

## Template 4: Specialist Template (Security, DevOps, Financial)

**Used by:** Senior Security Engineer, Senior DevOps Engineer, Financial Analyst

**Pre-filled task_type options:**
- `security-audit` — (Security) Vulnerability check, hardening
- `config-change` — (Security, DevOps) Env vars, deploy config, headers, CORS
- `infrastructure` — (DevOps) CI/CD, deployment, monitoring
- `research` — (Financial) Market analysis, financial modeling
- `strategy` — (Financial) Budget recommendations, pricing analysis

**Pre-filled rubric (Specialist Tasks):**
| Component | Weight | Score <<FILL>> |
|---|---|---|
| Domain accuracy — technically correct for this specialty? | 40% | /10 |
| Risk awareness — risks identified and mitigated? | 30% | /10 |
| Implementation clarity — can someone else execute this? | 30% | /10 |

**Entry Template:**
```json
{
  "id": "<<AUTO>>",
  "timestamp": "<<AUTO>>",
  "agent": "<<agent-slug: security-engineer|devops-engineer|financial-analyst>>",
  "session_id": "<<AUTO>>",
  "task_type": "<<security-audit|config-change|infrastructure|research|strategy>>",
  "input_summary": "<<FILL: what was the security/infra/financial question (max 200 chars)>>",
  "approach": "<<FILL: methodology, frameworks, tools used (max 500 chars)>>",
  "output_summary": "<<FILL: what was delivered (max 300 chars)>>",
  "files_touched": ["<<FILL>>"],
  "quality_score": "<<FILL: 1-10 per rubric above>>",
  "quality_rationale": "<<FILL>>",
  "user_signal": "no-signal",
  "signal_timestamp": null,
  "failure_points": ["<<FILL>>"],
  "lessons": ["<<FILL>>"],
  "patterns_applied": ["<<FILL>>"],
  "patterns_discovered": ["<<FILL>>"],
  "confidence": "<<FILL: 1-5>>",
  "context_tokens_used": "<<AUTO>>",
  "execution_time_ms": "<<AUTO>>",
  "retries": 0,
  "escalated": false,
  "infrastructure": {
    "vram_peak_mb": null,
    "latency_spike": false,
    "resource_contention": false
  },
  "tier": "hot",
  "relevance_score": 1.0,
  "last_accessed": "<<AUTO>>",
  "reuse_count": 0,
  "contradiction_flags": 0,
  "_meta": {
    "template": "specialist",
    "rubric_scores": {
      "domain_accuracy": "<<FILL: 1-10>>",
      "risk_awareness": "<<FILL: 1-10>>",
      "implementation_clarity": "<<FILL: 1-10>>"
    },
    "specialty_domain": "<<FILL: security|devops|financial>>",
    "risk_level": "<<FILL: critical|high|medium|low|info>>",
    "compliance_frameworks": ["<<FILL: OWASP|SOC2|PCI|GDPR|none>>"],
    "rollback_plan": "<<FILL: description of rollback if this change fails>>",
    "monitoring_added": false
  }
}
```

**Specialist-Specific Fields:**
- `_meta.risk_level` — Every specialist task has a risk assessment. Patterns from high-risk tasks get extended quarantine.
- `_meta.compliance_frameworks` — Tags for regulatory compliance tracking.
- `_meta.rollback_plan` — Forces specialists to think about reversibility.

---

## Template 5: User-Facing Agent Template (All 42 Agents)

**Used by:** All 42 user-facing agents (chat agents, bestie, etc.)

**Pre-filled task_type options:**
- `user-interaction` — Chat response, conversation turn
- `content-create` — Generated content for user
- `troubleshoot` — Helping user solve a problem
- `research` — Looking something up for user

**Pre-filled rubric (User Interaction):**
| Component | Weight | Score <<FILL>> |
|---|---|---|
| Helpfulness — did it actually help the user? | 40% | /10 |
| Accuracy — information provided was correct? | 30% | /10 |
| Tone/Voice — matched expected personality? | 15% | /10 |
| Efficiency — didn't waste user's time? | 15% | /10 |

**Entry Template:**
```json
{
  "id": "<<AUTO>>",
  "timestamp": "<<AUTO>>",
  "agent": "<<agent-slug: one of the 42 user-facing agents>>",
  "session_id": "<<AUTO>>",
  "task_type": "<<user-interaction|content-create|troubleshoot|research>>",
  "input_summary": "<<FILL: what did the user ask/need (max 200 chars)>>",
  "approach": "<<FILL: how did the agent decide to respond (max 500 chars)>>",
  "output_summary": "<<FILL: what was the response/deliverable (max 300 chars)>>",
  "files_touched": [],
  "quality_score": "<<FILL: 1-10 per rubric above>>",
  "quality_rationale": "<<FILL>>",
  "user_signal": "no-signal",
  "signal_timestamp": null,
  "failure_points": ["<<FILL: misunderstandings, wrong info, tone breaks>>"],
  "lessons": ["<<FILL>>"],
  "patterns_applied": ["<<FILL>>"],
  "patterns_discovered": ["<<FILL>>"],
  "confidence": "<<FILL: 1-5>>",
  "context_tokens_used": "<<AUTO>>",
  "execution_time_ms": "<<AUTO>>",
  "retries": 0,
  "escalated": false,
  "infrastructure": {
    "vram_peak_mb": null,
    "latency_spike": false,
    "resource_contention": false
  },
  "tier": "hot",
  "relevance_score": 1.0,
  "last_accessed": "<<AUTO>>",
  "reuse_count": 0,
  "contradiction_flags": 0,
  "_meta": {
    "template": "user-facing",
    "rubric_scores": {
      "helpfulness": "<<FILL: 1-10>>",
      "accuracy": "<<FILL: 1-10>>",
      "tone_voice": "<<FILL: 1-10>>",
      "efficiency": "<<FILL: 1-10>>"
    },
    "user_tier": "<<FILL: FREE|STARTER|PLUS|SMART|PRO>>",
    "conversation_turns": "<<FILL: number of turns in this interaction>>",
    "user_sentiment": "<<FILL: positive|neutral|negative|unclear>>",
    "escalated_to_human": false,
    "bestie_mode": false,
    "language": "<<FILL: en|es|fr|de|ja|zh>>"
  }
}
```

**User-Facing-Specific Fields:**
- `_meta.user_tier` — Patterns may differ by user tier (PRO users may have different needs than FREE).
- `_meta.user_sentiment` — Inferred from interaction, helps correlate response strategies with user satisfaction.
- `_meta.conversation_turns` — Fewer turns for same outcome = better efficiency.
- `_meta.bestie_mode` — Whether this was a bestie interaction (different quality criteria apply).
- `_meta.language` — Patterns for non-English interactions may differ significantly.

---

## Template Selection Logic

```javascript
function selectTemplate(agentSlug) {
  const HEAD_AGENTS = ['stone', 'cardinal', 'chaos'];
  const ROYAL_GUARD = ['wiz'];
  const BUILDERS = ['frontend-engineer', 'backend-engineer', 'db-engineer'];
  const SPECIALISTS = ['security-engineer', 'devops-engineer', 'financial-analyst'];

  if (HEAD_AGENTS.includes(agentSlug)) return 'head';
  if (ROYAL_GUARD.includes(agentSlug)) return 'royal-guard';
  if (BUILDERS.includes(agentSlug)) return 'builder';
  if (SPECIALISTS.includes(agentSlug)) return 'specialist';
  return 'user-facing'; // default for all 42 user-facing agents
}
```

---

## Auto-Filled Fields Reference

Fields marked `<<AUTO>>` are filled by the journaling system, not the agent:

| Field | Source |
|---|---|
| `id` | `crypto.randomUUID()` |
| `timestamp` | `new Date().toISOString()` |
| `session_id` | Current session identifier from Palace dispatcher |
| `context_tokens_used` | Token counter from vLLM/API response |
| `execution_time_ms` | `Date.now() - taskStartTime` |
| `last_accessed` | Same as `timestamp` on creation |

---

## Size Budget Per Template

| Template | Typical Filled Size | Max Allowed |
|---|---|---|
| Head | ~800 bytes | 2,048 bytes |
| Royal Guard | ~900 bytes | 2,048 bytes |
| Builder | ~850 bytes | 2,048 bytes |
| Specialist | ~800 bytes | 2,048 bytes |
| User-Facing | ~750 bytes | 2,048 bytes |

If a filled template exceeds 2KB, truncate in this order:
1. `approach` — cut to 250 chars
2. `lessons` — keep only first 2 items
3. `failure_points` — keep only first 2 items
4. `output_summary` — cut to 150 chars
