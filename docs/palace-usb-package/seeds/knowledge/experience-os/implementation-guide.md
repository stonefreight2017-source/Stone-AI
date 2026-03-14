# Experience OS — Implementation Guide

> How to build and run the Experience OS on the OMEN with vLLM + Qwen 2.5 32B AWQ.
> Pure filesystem, no database dependency, zero VRAM overhead.

---

## File Structure

```
~/palace/
├── experience/                          # Root for all Experience OS data
│   ├── _global/
│   │   ├── seed-patterns.json           # Cold-start patterns (from pattern-library-seed.md)
│   │   ├── taxonomy.json                # Failure/success category definitions
│   │   ├── config.json                  # System-wide thresholds (tunable)
│   │   └── infrastructure-events.jsonl  # VRAM peaks, latency spikes, resource contention
│   ├── _audit/
│   │   ├── quarantine-log.jsonl         # All quarantine decisions (append-only)
│   │   ├── purge-log.jsonl              # All hard deletions (append-only)
│   │   ├── kill-switch-log.jsonl        # All reset events (append-only)
│   │   ├── contradiction-queue.json     # Active contradictions awaiting resolution
│   │   ├── drift-reports/               # Monthly drift reports per agent
│   │   └── health-reports/              # System-wide monthly health reports
│   ├── _archive/                        # Kill switch archives
│   │   └── {agent-slug}-{timestamp}/    # Archived agent data after reset
│   ├── backend-engineer/
│   │   ├── journal.jsonl                # Append-only experience log
│   │   ├── patterns.json                # Active patterns (graduated from quarantine)
│   │   ├── candidates.json              # Candidate/testing patterns
│   │   ├── baselines.json               # Behavioral fingerprint snapshots
│   │   ├── strategies.json              # Adaptive strategy library (Phase 3)
│   │   └── meta/
│   │       ├── calibration.json         # Self-assessment accuracy tracking
│   │       ├── health-reports/          # Per-agent monthly health reports
│   │       └── syntheses/               # Cross-domain hypotheses
│   ├── frontend-engineer/
│   │   └── (same structure)
│   ├── stone/
│   │   └── (same structure)
│   └── ... (one directory per agent that has entries)
```

**Key decisions:**
- JSONL (newline-delimited JSON) for journals — append-only, no read-modify-write race conditions.
- Regular JSON for patterns, baselines, config — small files that are read-modify-write but infrequently.
- Agent directories are created on demand (first journal write), not pre-created.

---

## Initialization

### Step 1: Create Directory Structure

```javascript
// experience-init.mjs
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const EXPERIENCE_ROOT = join(process.env.HOME || process.env.USERPROFILE, 'palace', 'experience');

function initExperienceOS() {
  // Create core directories
  const dirs = ['_global', '_audit', '_audit/drift-reports', '_audit/health-reports', '_archive'];
  for (const dir of dirs) {
    mkdirSync(join(EXPERIENCE_ROOT, dir), { recursive: true });
  }

  // Write default config
  const configPath = join(EXPERIENCE_ROOT, '_global', 'config.json');
  if (!existsSync(configPath)) {
    writeFileSync(configPath, JSON.stringify({
      version: '1.0.0',
      thresholds: {
        hot_tier_size: 50,
        warm_tier_max: 500,
        forgetting_decay_rate: 0.10,           // 10% per 30 days
        forgetting_purge_threshold: 0.1,
        feedback_decay_halflife_days: 60,
        pattern_weight_ceiling: 3.0,
        quarantine_success_threshold: 5,
        quarantine_crossdomain_threshold: 10,
        pattern_min_evidence: 5,
        pattern_extraction_trigger: 25,         // entries between extractions
        exploration_budget: 0.10,               // 10% of tasks
        drift_alert_threshold: 0.20,
        drift_critical_threshold: 0.40,
        overconfidence_window: 5,               // consecutive entries
        overconfidence_gap: 2,                  // points
        context_budget_tokens: 4000,
        latency_budget_ms: 500
      },
      created: new Date().toISOString()
    }, null, 2));
  }

  // Write taxonomy
  const taxonomyPath = join(EXPERIENCE_ROOT, '_global', 'taxonomy.json');
  if (!existsSync(taxonomyPath)) {
    writeFileSync(taxonomyPath, JSON.stringify({
      failure_categories: [
        { id: 'logic_error', description: 'Code or reasoning is wrong' },
        { id: 'scope_miss', description: 'Did not address all requirements' },
        { id: 'missing_context', description: 'Lacked information needed for task' },
        { id: 'wrong_approach', description: 'Chose fundamentally wrong strategy' },
        { id: 'communication_gap', description: 'Output did not match what was asked' },
        { id: 'integration_error', description: 'Works alone, breaks with other components' },
        { id: 'performance_issue', description: 'Functionally correct but too slow or heavy' },
        { id: 'security_gap', description: 'Missing security consideration' }
      ],
      task_types: [
        'code-build', 'code-fix', 'code-refactor', 'config-change',
        'schema-change', 'security-audit', 'research', 'strategy',
        'content-create', 'troubleshoot', 'escalation', 'infrastructure',
        'user-interaction', 'synthesis', 'code-review', 'drift-detection',
        'quarantine-review', 'contradiction-resolution'
      ]
    }, null, 2));
  }

  // Initialize empty contradiction queue
  const contradictionPath = join(EXPERIENCE_ROOT, '_audit', 'contradiction-queue.json');
  if (!existsSync(contradictionPath)) {
    writeFileSync(contradictionPath, '[]');
  }

  console.log('Experience OS initialized at:', EXPERIENCE_ROOT);
}

export { initExperienceOS, EXPERIENCE_ROOT };
```

### Step 2: Load Seed Patterns

Run the loader from `pattern-library-seed.md` to populate `_global/seed-patterns.json` and distribute to agent directories.

### Step 3: Verify

```bash
# Quick health check
ls ~/palace/experience/_global/
# Should show: config.json  infrastructure-events.jsonl  seed-patterns.json  taxonomy.json

ls ~/palace/experience/_audit/
# Should show: contradiction-queue.json  drift-reports/  health-reports/  kill-switch-log.jsonl  purge-log.jsonl  quarantine-log.jsonl
```

---

## Core Operations

### Operation 1: Write a Journal Entry

Called after every meaningful agent task completion.

```javascript
// experience-journal.mjs
import { appendFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

const EXPERIENCE_ROOT = join(process.env.HOME || process.env.USERPROFILE, 'palace', 'experience');

function writeJournalEntry(agentSlug, entry) {
  const agentDir = join(EXPERIENCE_ROOT, agentSlug);
  mkdirSync(agentDir, { recursive: true });

  const journalPath = join(agentDir, 'journal.jsonl');

  const fullEntry = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    tier: 'hot',
    relevance_score: 1.0,
    last_accessed: new Date().toISOString(),
    reuse_count: 0,
    contradiction_flags: 0,
    ...entry // agent-provided fields override defaults
  };

  // Enforce 2KB max
  let serialized = JSON.stringify(fullEntry);
  if (serialized.length > 2048) {
    // Truncate in priority order
    if (fullEntry.approach && fullEntry.approach.length > 250) {
      fullEntry.approach = fullEntry.approach.substring(0, 247) + '...';
    }
    if (fullEntry.lessons && fullEntry.lessons.length > 2) {
      fullEntry.lessons = fullEntry.lessons.slice(0, 2);
    }
    if (fullEntry.failure_points && fullEntry.failure_points.length > 2) {
      fullEntry.failure_points = fullEntry.failure_points.slice(0, 2);
    }
    serialized = JSON.stringify(fullEntry);
  }

  try {
    appendFileSync(journalPath, serialized + '\n', 'utf-8');
  } catch (err) {
    // Fire-and-forget: log error but never block task completion
    console.error(`[ExperienceOS] Journal write failed for ${agentSlug}:`, err.message);
  }
}

export { writeJournalEntry };
```

### Operation 2: Retrieve Relevant Experience (Pre-Dispatch)

Called before dispatching an agent to inject relevant past experience.

```javascript
// experience-retrieval.mjs
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const EXPERIENCE_ROOT = join(process.env.HOME || process.env.USERPROFILE, 'palace', 'experience');

function readJSONL(filePath) {
  if (!existsSync(filePath)) return [];
  const content = readFileSync(filePath, 'utf-8').trim();
  if (!content) return [];
  return content.split('\n').map(line => {
    try { return JSON.parse(line); }
    catch { return null; }
  }).filter(Boolean);
}

function keywordOverlap(entryA, entryB) {
  const wordsA = new Set(
    `${entryA.input_summary || ''} ${entryA.task_type || ''} ${(entryA.tags || []).join(' ')}`
      .toLowerCase().split(/\s+/).filter(w => w.length > 3)
  );
  const wordsB = new Set(
    `${entryB.input_summary || ''} ${entryB.task_type || ''} ${(entryB.tags || []).join(' ')}`
      .toLowerCase().split(/\s+/).filter(w => w.length > 3)
  );

  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let overlap = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) overlap++;
  }
  return overlap / Math.max(wordsA.size, wordsB.size);
}

function relevanceDecay(entry) {
  const daysSinceAccess = (Date.now() - new Date(entry.last_accessed).getTime()) / (1000 * 60 * 60 * 24);
  const monthsSinceAccess = daysSinceAccess / 30;
  return 1 - Math.pow(0.9, monthsSinceAccess); // returns amount of decay (0 = no decay)
}

/**
 * Retrieve experience context for an agent about to start a task.
 * Returns a string ready to inject into the agent's prompt.
 * Total output stays under 4K tokens (~16K chars).
 */
function getExperienceContext(agentSlug, currentTask) {
  const startTime = Date.now();
  const journalPath = join(EXPERIENCE_ROOT, agentSlug, 'journal.jsonl');
  const patternsPath = join(EXPERIENCE_ROOT, agentSlug, 'patterns.json');

  const entries = readJSONL(journalPath);
  const patterns = existsSync(patternsPath)
    ? JSON.parse(readFileSync(patternsPath, 'utf-8'))
    : [];

  // HOT TIER: last 50 entries, compressed to one-liners
  const hotEntries = entries.slice(-50);
  const hotSummaries = hotEntries.map(e =>
    `- [${e.timestamp?.substring(0, 10)}] ${e.task_type}: ${e.output_summary || 'no summary'}. Score: ${e.quality_score}. ${e.lessons?.length ? 'Lesson: ' + e.lessons[0] : ''}`
  ).join('\n');

  // WARM TIER: entries 51-500, retrieve top 3 by relevance
  const warmEntries = entries.slice(Math.max(0, entries.length - 500), Math.max(0, entries.length - 50));
  const warmRetrieved = warmEntries
    .map(e => ({
      ...e,
      _score: (e.task_type === currentTask.task_type ? 0.5 : 0)
        + keywordOverlap(e, currentTask)
        + (e.quality_score >= 7 ? 0.3 : 0)
        + (e.user_signal === 'approved' ? 0.2 : 0)
        - (e.contradiction_flags * 0.5)
        - relevanceDecay(e)
    }))
    .sort((a, b) => b._score - a._score)
    .slice(0, 3);

  const warmSummaries = warmRetrieved.map(e =>
    `- [${e.timestamp?.substring(0, 10)}] ${e.task_type}: ${e.input_summary}\n  Approach: ${e.approach}\n  Result: Score ${e.quality_score}, Signal: ${e.user_signal}\n  Lessons: ${(e.lessons || []).join('; ')}`
  ).join('\n');

  // ACTIVE PATTERNS: all active patterns for this agent
  const activePatterns = patterns
    .filter(p => p.status === 'active')
    .map(p => `- [${p.id}] ${p.rule} (confidence: ${p.confidence}, success: ${(p.success_rate * 100).toFixed(0)}%)`)
    .join('\n');

  // SELF-ASSESSMENT PROMPT
  const selfAssessment = `Before submitting output, assess:
1. Rate this 1-10 against task requirements.
2. List 2 things that could be wrong.
3. If confidence < 3, flag for supervisor review.`;

  // Assemble context block
  const context = `=== EXPERIENCE OS CONTEXT ===

RECENT EXPERIENCE (last ${hotEntries.length} tasks):
${hotSummaries || '(no history yet)'}

RELEVANT PAST EXPERIENCE:
${warmSummaries || '(no relevant past experience found)'}

ACTIVE PATTERNS:
${activePatterns || '(no patterns yet — using seed patterns)'}

SELF-ASSESSMENT PROTOCOL:
${selfAssessment}

=== END EXPERIENCE OS CONTEXT ===`;

  const elapsed = Date.now() - startTime;
  if (elapsed > 500) {
    console.warn(`[ExperienceOS] Retrieval took ${elapsed}ms (over 500ms budget). Consider reducing journal size for ${agentSlug}.`);
  }

  // Rough token estimate: 1 token ≈ 4 chars
  const estimatedTokens = Math.ceil(context.length / 4);
  if (estimatedTokens > 4000) {
    console.warn(`[ExperienceOS] Context is ~${estimatedTokens} tokens (over 4K budget). Truncating warm tier.`);
    // Fallback: drop warm tier to stay under budget
    return context.replace(/RELEVANT PAST EXPERIENCE:[\s\S]*?ACTIVE PATTERNS:/,
      'RELEVANT PAST EXPERIENCE:\n(truncated to stay under token budget)\n\nACTIVE PATTERNS:');
  }

  return context;
}

export { getExperienceContext, readJSONL };
```

### Operation 3: Route Feedback Signal

Called when the founder or supervisor provides feedback on agent output.

```javascript
// experience-feedback.mjs
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { readJSONL } from './experience-retrieval.mjs';

const EXPERIENCE_ROOT = join(process.env.HOME || process.env.USERPROFILE, 'palace', 'experience');

const SIGNAL_ADJUSTMENTS = {
  approved: 2,
  rejected: -3,
  revised: -1,
  're-dispatched': -2
};

const GRADE_SCORES = { A: 10, B: 8, C: 6, D: 4, F: 1 };

function routeSignal(agentSlug, signal, sessionId = null) {
  const journalPath = join(EXPERIENCE_ROOT, agentSlug, 'journal.jsonl');
  const entries = readJSONL(journalPath);

  if (entries.length === 0) return;

  // Find the target entry: match by session_id if provided, otherwise most recent
  let targetIdx = entries.length - 1;
  if (sessionId) {
    const idx = entries.findLastIndex(e => e.session_id === sessionId);
    if (idx >= 0) targetIdx = idx;
  }

  const target = entries[targetIdx];

  // Apply signal
  if (signal.type === 'grade' && GRADE_SCORES[signal.value]) {
    target.quality_score = GRADE_SCORES[signal.value];
    target.user_signal = `graded-${signal.value}`;
  } else if (SIGNAL_ADJUSTMENTS[signal.type] !== undefined) {
    target.quality_score = Math.max(1, Math.min(10,
      target.quality_score + SIGNAL_ADJUSTMENTS[signal.type]
    ));
    target.user_signal = signal.type;
  }

  target.signal_timestamp = new Date().toISOString();

  if (signal.type === 're-dispatched') {
    target.escalated = true;
  }

  // Write back (rewrite entire journal — acceptable for <500 entries)
  const output = entries.map(e => JSON.stringify(e)).join('\n') + '\n';
  writeFileSync(journalPath, output, 'utf-8');

  // Check if quality_score changed by 3+ points — flag derived patterns
  // (implementation depends on pattern tracking, omitted for brevity)

  return target;
}

export { routeSignal };
```

---

## Integration Points in palace.mjs / Palace GUI

### Where to Hook

```
DISPATCH FLOW:
                                          ┌─────────────────────┐
  Task arrives ──► Pre-dispatch hook ──►  │ getExperienceContext │ ──► Inject into agent prompt
                                          └─────────────────────┘
                          │
                          ▼
                  Agent executes task
                          │
                          ▼
                  ┌───────────────────┐
                  │ Self-assessment   │ (agent runs internally before output)
                  │ (D3 protocol)     │
                  └───────────────────┘
                          │
                          ▼
                  Output delivered to user/supervisor
                          │
                          ▼
                  ┌───────────────────┐
                  │ writeJournalEntry │ (async, fire-and-forget)
                  └───────────────────┘
                          │
                          ▼ (later, when feedback arrives)
                  ┌───────────────────┐
                  │ routeSignal       │
                  └───────────────────┘
```

### In palace.mjs (Pseudo-Integration)

```javascript
import { getExperienceContext } from './experience/experience-retrieval.mjs';
import { writeJournalEntry } from './experience/experience-journal.mjs';
import { routeSignal } from './experience/experience-feedback.mjs';

async function dispatchAgent(agentSlug, task) {
  const startTime = Date.now();

  // PRE-DISPATCH: Get experience context
  const experienceContext = getExperienceContext(agentSlug, task);

  // Build full prompt with experience injected
  const fullPrompt = `${agentIdentityPrompt(agentSlug)}

${experienceContext}

TASK:
${task.description}

SCOPE: ${task.scope}
SUCCESS CRITERIA: ${task.successCriteria}
BOUNDARIES: ${task.boundaries}`;

  // Execute agent
  const result = await callVLLM(fullPrompt);
  const executionTime = Date.now() - startTime;

  // POST-COMPLETION: Write journal entry (fire-and-forget)
  writeJournalEntry(agentSlug, {
    agent: agentSlug,
    session_id: task.sessionId,
    task_type: task.type,
    input_summary: task.description.substring(0, 200),
    approach: result.approach || 'not specified',
    output_summary: result.summary || 'not specified',
    files_touched: result.filesTouched || [],
    quality_score: result.selfScore || 5,
    quality_rationale: result.selfRationale || '',
    confidence: result.confidence || 3,
    context_tokens_used: result.tokensUsed || 0,
    execution_time_ms: executionTime,
    retries: result.retries || 0,
    lessons: result.lessons || [],
    patterns_applied: result.patternsApplied || [],
    failure_points: result.failurePoints || [],
    user_signal: 'no-signal',
    infrastructure: {
      vram_peak_mb: getVRAMPeak(),
      latency_spike: executionTime > 30000,
      resource_contention: false
    }
  });

  return result;
}

// Called when supervisor grades agent work
function gradeAgent(agentSlug, grade, sessionId) {
  routeSignal(agentSlug, { type: 'grade', value: grade }, sessionId);
}

// Called when founder approves/rejects
function founderSignal(agentSlug, signal, sessionId) {
  routeSignal(agentSlug, { type: signal }, sessionId);
}
```

---

## Background Processing (Cron Jobs)

These run as separate Node.js scripts, not inline with agent dispatch.

### Cron Schedule

```
# Experience OS background processing
# Add to crontab or run via Node.js scheduler

# Pattern extraction: check every hour if any agent has 25+ new entries since last extraction
0 * * * *    node ~/palace/experience/cron/pattern-extraction.mjs

# Memory audit: weekly on Sunday at 3 AM
0 3 * * 0    node ~/palace/experience/cron/memory-audit.mjs

# Drift detection + health reports: first of every month at 4 AM
0 4 1 * *    node ~/palace/experience/cron/drift-detection.mjs
0 5 1 * *    node ~/palace/experience/cron/health-report.mjs

# Wiz candidate review: daily at 2 AM
0 2 * * *    node ~/palace/experience/cron/quarantine-review.mjs
```

### Pattern Extraction Script (Outline)

```javascript
// cron/pattern-extraction.mjs
// Runs hourly. For each agent, checks if 25+ new entries since last extraction.
// If yes, clusters entries by task_type, identifies recurring factors, creates candidate patterns.

import { readJSONL } from '../experience-retrieval.mjs';
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const EXPERIENCE_ROOT = join(process.env.HOME || process.env.USERPROFILE, 'palace', 'experience');
const EXTRACTION_TRIGGER = 25;

function run() {
  const agents = readdirSync(EXPERIENCE_ROOT)
    .filter(d => !d.startsWith('_')); // skip _global, _audit, _archive

  for (const agent of agents) {
    const journalPath = join(EXPERIENCE_ROOT, agent, 'journal.jsonl');
    const entries = readJSONL(journalPath);

    // Check last extraction marker
    const metaPath = join(EXPERIENCE_ROOT, agent, 'meta', 'last-extraction.json');
    const lastExtraction = existsSync(metaPath)
      ? JSON.parse(readFileSync(metaPath, 'utf-8'))
      : { entry_count: 0 };

    const newEntries = entries.length - lastExtraction.entry_count;
    if (newEntries < EXTRACTION_TRIGGER) continue;

    console.log(`[PatternExtraction] ${agent}: ${newEntries} new entries. Running extraction.`);

    // Cluster by task_type
    const clusters = {};
    const recentEntries = entries.slice(-100); // analyze last 100
    for (const entry of recentEntries) {
      const type = entry.task_type || 'unknown';
      if (!clusters[type]) clusters[type] = [];
      clusters[type].push(entry);
    }

    // For each cluster with 5+ entries, look for patterns
    for (const [taskType, clusterEntries] of Object.entries(clusters)) {
      if (clusterEntries.length < 5) continue;

      // Find common lessons in successful entries
      const successes = clusterEntries.filter(e => e.quality_score >= 7);
      const failures = clusterEntries.filter(e => e.quality_score <= 4);

      // Extract common keywords from lessons (simplified — production would use TF-IDF)
      const lessonCounts = {};
      for (const entry of successes) {
        for (const lesson of (entry.lessons || [])) {
          const key = lesson.toLowerCase().trim();
          lessonCounts[key] = (lessonCounts[key] || 0) + 1;
        }
      }

      // Lessons appearing in 3+ successful entries become candidate patterns
      for (const [lesson, count] of Object.entries(lessonCounts)) {
        if (count >= 3) {
          createCandidatePattern(agent, {
            rule: lesson,
            evidence_count: count,
            task_type: taskType,
            domain_scope: inferDomain(agent)
          });
        }
      }
    }

    // Update extraction marker
    writeFileSync(metaPath, JSON.stringify({
      entry_count: entries.length,
      last_extraction: new Date().toISOString()
    }, null, 2));
  }
}

function inferDomain(agentSlug) {
  const map = {
    'backend-engineer': 'backend',
    'frontend-engineer': 'frontend',
    'db-engineer': 'backend',
    'security-engineer': 'security',
    'devops-engineer': 'devops',
    'stone': 'strategy',
    'cardinal': 'strategy',
    'chaos': 'infrastructure',
    'wiz': 'security'
  };
  return map[agentSlug] || 'cross-domain';
}

function createCandidatePattern(agentSlug, patternData) {
  // Implementation: append to agent's candidates.json
  // Check for contradiction with existing patterns first
  // See immune-system-spec.md for full quarantine lifecycle
  console.log(`[PatternExtraction] New candidate for ${agentSlug}: ${patternData.rule.substring(0, 80)}...`);
}

run();
```

---

## VRAM Impact Analysis

| Operation | VRAM Usage | Reason |
|---|---|---|
| Journal write | 0 MB | File append, no model involved |
| Experience retrieval | 0 MB | Text processing (grep + JSON parse) |
| Pattern extraction (cron) | 0 MB | Text processing only |
| Drift detection (cron) | 0 MB | Numeric computation only |
| Self-assessment | 0 MB additional | Uses the same model call as the task itself |

**Total VRAM overhead: 0 MB.** Experience OS is entirely text-based in Phase 1. The model processes the experience context as part of its normal prompt, which is already budgeted in the 32K context window.

---

## Performance Expectations

| Agent Journal Size | Retrieval Time | Notes |
|---|---|---|
| 0-50 entries | < 10ms | Hot tier only, minimal processing |
| 50-200 entries | < 50ms | Hot + warm tier, keyword matching |
| 200-500 entries | < 200ms | Full warm tier scan |
| 500+ entries | < 500ms | Cold tier compression kicks in, warm tier stays at 500 max |

If retrieval exceeds 500ms, the system falls back to hot-tier-only mode and logs a warning. At 500 entries per agent, that's approximately 1MB of JSONL per agent — well within filesystem performance.

---

## Troubleshooting

### Journal file growing too large
- Normal: at 500+ entries, cold-tier compression runs automatically.
- Emergency: `/reset-experience [agent-slug]` archives and starts fresh.
- Prevention: forgetting curve naturally prunes the warm tier over time.

### Retrieval too slow
- Check journal.jsonl file size. If > 5MB, something is wrong (entries should be max 2KB each, so 5MB = 2500+ entries without compression).
- Run cold-tier compression manually: `node ~/palace/experience/cron/compress-cold-tier.mjs [agent-slug]`
- Fallback: set `hot_tier_only: true` in agent config to skip warm tier retrieval.

### Patterns not being extracted
- Check `meta/last-extraction.json` — is the entry count advancing?
- Check if the agent has 25+ entries since last extraction.
- Check cron job logs for errors.
- Manual trigger: `node ~/palace/experience/cron/pattern-extraction.mjs --agent=[agent-slug] --force`

### Contradictions piling up
- Review `_audit/contradiction-queue.json`.
- Resolve manually or run Wiz's auto-resolution for clear winners.
- If too many contradictions: likely a fundamental approach changed — consider baseline refresh.

### Self-assessment wildly miscalibrated
- Check `meta/calibration.json` for the calibration gap.
- If overconfident: the -2 penalty should be auto-applied. If it's not working, check the feedback routing.
- Nuclear option: reset calibration data in `meta/calibration.json` to start fresh.

---

## Migration Path

### From current Stone AI (no Experience OS) to Phase 1

1. Run `experience-init.mjs` to create directory structure.
2. Load seed patterns from `pattern-library-seed.md`.
3. Add pre-dispatch hook to Palace dispatcher (inject experience context).
4. Add post-completion hook (write journal entry).
5. Add feedback routing (connect supervisor grading to journal entries).
6. Set up cron jobs for background processing.
7. Monitor for 1 week before considering Phase 2 activation.

### Phase 1 to Phase 2 (automatic)

No migration needed. Phase 2 activates automatically when an agent hits 25 entries. Pattern extraction begins, quarantine lifecycle starts.

### Phase 2 to Phase 3 (automatic)

No migration needed. Phase 3 activates when an agent has 10+ active patterns. Strategy selection begins.

### Phase 3 to Phase 4 (automatic, after 3 months)

No migration needed. Meta-learning begins analyzing the accumulated data.

---

## Quick Reference: Key File Paths

| What | Path |
|---|---|
| System config | `~/palace/experience/_global/config.json` |
| Seed patterns | `~/palace/experience/_global/seed-patterns.json` |
| Agent journal | `~/palace/experience/{agent}/journal.jsonl` |
| Agent patterns | `~/palace/experience/{agent}/patterns.json` |
| Agent baselines | `~/palace/experience/{agent}/baselines.json` |
| Contradiction queue | `~/palace/experience/_audit/contradiction-queue.json` |
| Drift reports | `~/palace/experience/_audit/drift-reports/{agent}-{date}.json` |
| Health reports (agent) | `~/palace/experience/{agent}/meta/health-reports/{YYYY-MM}.json` |
| Health reports (system) | `~/palace/experience/_audit/health-reports/system-{YYYY-MM}.json` |
| Kill switch log | `~/palace/experience/_audit/kill-switch-log.jsonl` |
| Purge log | `~/palace/experience/_audit/purge-log.jsonl` |
