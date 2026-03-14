# Palace Status Panel UI — Technical Spec v1
## SUPERSEDED by palace-status-engine.js (v2 — Claude Code style)

> **v1 below is ARCHIVED.** The founder rejected bordered boxes and multi-color.
> The live spec is now `palace-status-engine.js` — plain text, 3 lines per agent,
> braille spinner, no boxes, no colors. Chaos: use that file, not this one.

## Cardinal (Head 2) — Spec for Chaos to Build

**Date**: 2026-03-08
**Directive**: D19 — Founder's Vision for Palace Interface
**Target**: `patch-palace.js` → injects into `palace.mjs`
**Runtime**: Node.js on Windows Terminal (ANSI escape codes, no browser)

---

## 1. THE PROBLEM

Current palace.mjs streams raw token output directly to stdout. When multiple heads respond, their output interleaves and scrolls endlessly. The founder has to read everything in real-time or lose it. There is no compact status view, no summary, no expand-on-demand.

## 2. THE SOLUTION — STATUS PANEL ARCHITECTURE

### 2.1 Screen Layout (Fixed Regions)

```
┌─ Stone ──────────────────────────────────────── ●  ─┐
│ Analyzing pricing strategy...                        │
└──────────────────────────────────────────────────────┘
┌─ Cardinal ───────────────────────────────────── ●  ─┐
│ Researching competitor landscape...                  │
└──────────────────────────────────────────────────────┘
┌─ Chaos ──────────────────────────────────────── ✓  ─┐
│ GPU audit complete — RTX 5090 nominal, VRAM 94%      │
└──────────────────────────────────────────────────────┘

────────────────────────────────────────────────────────
[Summary Area — completed results appear here]

> _
```

**Three fixed regions:**
1. **Status Panel** (top) — One box per active head. Fixed position. Updated in-place.
2. **Summary Area** (middle) — Completed results print here as scrollable text.
3. **Input Line** (bottom) — Prompt always visible.

### 2.2 Agent Colors (Already Defined in Palace)

| Head | Color | ANSI Code |
|------|-------|-----------|
| Stone | Yellow | `\x1b[33m` |
| Cardinal | Cyan | `\x1b[36m` |
| Chaos | Red | `\x1b[31m` |
| Reset | — | `\x1b[0m` |

Use whatever COLORS map palace.mjs already defines. Fall back to these if needed.

---

## 3. STATUS BOX RENDERING ENGINE

### 3.1 Core Concept: Cursor-Positioned In-Place Updates

Each agent gets a **fixed 3-line region** on screen. Status updates rewrite those 3 lines using ANSI cursor positioning — the screen never scrolls during agent work.

```javascript
// ANSI escape sequences needed
const ESC = '\x1b[';
const SAVE_CURSOR = ESC + 's';
const RESTORE_CURSOR = ESC + 'u';
const MOVE_TO = (row, col) => `${ESC}${row};${col}H`;
const CLEAR_LINE = ESC + '2K';
const HIDE_CURSOR = ESC + '?25l';
const SHOW_CURSOR = ESC + '?25h';
```

### 3.2 StatusPanel Class

```javascript
class StatusPanel {
  constructor() {
    this.agents = {};        // { name: { row, status, color, state, fullOutput, summary } }
    this.panelStartRow = 1;  // first row of status panel
    this.summaryStartRow = 0; // calculated after panel setup
    this.panelWidth = Math.min(process.stdout.columns || 80, 60);
  }

  // Register an agent for this request
  addAgent(name, color) {
    const index = Object.keys(this.agents).length;
    this.agents[name] = {
      row: this.panelStartRow + (index * 3), // 3 lines per box
      color: color,
      state: 'idle',       // idle | working | done
      status: 'Waiting...', // current status cue (SHORT text)
      fullOutput: '',       // full streaming output (hidden)
      summary: '',          // final summary (shown on completion)
    };
    this.summaryStartRow = this.panelStartRow + (Object.keys(this.agents).length * 3) + 1;
  }

  // Render one agent's box at its fixed position
  renderBox(name) {
    const agent = this.agents[name];
    if (!agent) return;

    const w = this.panelWidth;
    const color = agent.color;
    const reset = '\x1b[0m';
    const stateIcon = agent.state === 'done' ? '✓' : agent.state === 'working' ? '●' : '○';

    // Truncate status to fit box width (w - 6 for borders and padding)
    const maxStatus = w - 6;
    const statusText = agent.status.length > maxStatus
      ? agent.status.slice(0, maxStatus - 3) + '...'
      : agent.status.padEnd(maxStatus);

    // Top border with name
    const nameTag = `─ ${name} `;
    const topRight = ` ${stateIcon}  ─┐`;
    const topFill = '─'.repeat(Math.max(0, w - nameTag.length - topRight.length - 2));

    process.stdout.write(MOVE_TO(agent.row, 1) + CLEAR_LINE);
    process.stdout.write(`${color}┌${nameTag}${topFill}${topRight}${reset}`);

    // Content line
    process.stdout.write(MOVE_TO(agent.row + 1, 1) + CLEAR_LINE);
    process.stdout.write(`${color}│${reset} ${statusText} ${color}│${reset}`);

    // Bottom border
    process.stdout.write(MOVE_TO(agent.row + 2, 1) + CLEAR_LINE);
    process.stdout.write(`${color}└${'─'.repeat(w - 2)}┘${reset}`);
  }

  // Update an agent's status cue (called frequently during streaming)
  updateStatus(name, statusText) {
    if (!this.agents[name]) return;
    this.agents[name].status = statusText;
    this.agents[name].state = 'working';
    process.stdout.write(SAVE_CURSOR + HIDE_CURSOR);
    this.renderBox(name);
    process.stdout.write(RESTORE_CURSOR + SHOW_CURSOR);
  }

  // Mark agent as done with a summary
  complete(name, summary) {
    if (!this.agents[name]) return;
    this.agents[name].state = 'done';
    this.agents[name].status = summary.split('\n')[0].slice(0, 50); // first line, truncated
    this.agents[name].summary = summary;
    process.stdout.write(SAVE_CURSOR + HIDE_CURSOR);
    this.renderBox(name);
    process.stdout.write(RESTORE_CURSOR + SHOW_CURSOR);
  }

  // Render all boxes (called once at start of multi-head request)
  renderAll() {
    process.stdout.write(HIDE_CURSOR);
    for (const name of Object.keys(this.agents)) {
      this.renderBox(name);
    }
    // Draw separator line
    const sep = '─'.repeat(this.panelWidth);
    process.stdout.write(MOVE_TO(this.summaryStartRow, 1) + sep);
    process.stdout.write(SHOW_CURSOR);
    // Move cursor below panel for summary output
    process.stdout.write(MOVE_TO(this.summaryStartRow + 1, 1));
  }

  // Clear panel (after all agents done and summaries printed)
  clear() {
    this.agents = {};
  }
}
```

### 3.3 Key ANSI Behavior Notes for Chaos

- `\x1b[s` / `\x1b[u` — Save/restore cursor. Essential for updating boxes without losing the user's input position.
- `\x1b[ROW;COLh` — Absolute cursor positioning. Row 1 is top of visible area.
- `\x1b[2K` — Clear entire current line before rewriting.
- `\x1b[?25l` / `\x1b[?25h` — Hide/show cursor during redraws to prevent flicker.
- **Windows Terminal supports all of these.** CMD does not. Palace runs in Windows Terminal, so we are clear.
- Use `process.stdout.rows` and `process.stdout.columns` for terminal dimensions.

---

## 4. TOKEN BUFFERING AND STATUS EXTRACTION

### 4.1 The Problem

The LLM streams tokens one at a time. We cannot show raw tokens in the status box — that would be the same scrolling mess. We need to:

1. **Buffer tokens** into the `fullOutput` string (hidden from screen)
2. **Extract status cues** from the stream to show in the box
3. **Generate a summary** when streaming completes

### 4.2 Status Cue Strategy

Replace the current `process.stdout.write(token)` callback with a buffering callback:

```javascript
function createStatusCallback(panel, agentName) {
  let buffer = '';
  let sentenceBuffer = '';
  let lastCueTime = 0;
  const CUE_INTERVAL_MS = 500; // update status cue at most every 500ms

  return (token) => {
    // Accumulate full output (hidden)
    buffer += token;
    sentenceBuffer += token;

    // Extract status cues at intervals
    const now = Date.now();
    if (now - lastCueTime > CUE_INTERVAL_MS) {
      lastCueTime = now;
      const cue = extractCue(sentenceBuffer);
      if (cue) {
        panel.updateStatus(agentName, cue);
        sentenceBuffer = ''; // reset for next cue
      }
    }

    // Store full output for expansion
    panel.agents[agentName].fullOutput = buffer;
  };
}

// Extract a short status cue from buffered text
function extractCue(text) {
  // Take the last complete sentence or clause
  // Strip any markdown, keep it under 50 chars
  const cleaned = text
    .replace(/[#*_`]/g, '')     // strip markdown
    .replace(/\n+/g, ' ')       // flatten newlines
    .trim();

  if (!cleaned) return null;

  // Find last sentence boundary
  const sentences = cleaned.split(/[.!?]\s+/);
  const lastSentence = sentences[sentences.length - 1] || cleaned;

  // Truncate to 50 chars
  return lastSentence.length > 50
    ? lastSentence.slice(0, 47) + '...'
    : lastSentence;
}
```

### 4.3 Summary Generation on Completion

When streaming ends for an agent, generate a summary from the full output:

```javascript
function generateSummary(fullOutput, maxLines = 5) {
  // Strategy: Take first paragraph or first N sentences
  const lines = fullOutput
    .replace(/<\/?(?:think|thinking|response|tool|tool_call)>/gi, '')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length <= maxLines) return lines.join('\n');

  // Take first maxLines non-empty lines
  return lines.slice(0, maxLines).join('\n') + '\n  [...more — type /expand ' + 'NAME to see full]';
}
```

---

## 5. EXPANSION SYSTEM

### 5.1 Commands

| Command | Action |
|---------|--------|
| `/expand stone` | Print Stone's full output to summary area |
| `/expand cardinal` | Print Cardinal's full output to summary area |
| `/expand chaos` | Print Chaos's full output to summary area |
| `/expand all` | Print all agents' full outputs |

### 5.2 Implementation

Add to the slash command handler block (the `_palaceCmd` pattern already in patch-palace.js):

```javascript
if (!_palaceCmd && trimmed.startsWith('/expand')) {
  _palaceCmd = true;
  const expandTarget = trimmed.replace('/expand', '').trim().toLowerCase();
  const panel = global._palacePanel; // stored globally so /expand can access it

  if (!panel || Object.keys(panel.agents).length === 0) {
    process.stdout.write('No agent output to expand.\n');
  } else if (expandTarget === 'all') {
    for (const [name, agent] of Object.entries(panel.agents)) {
      process.stdout.write(`\n═══ ${name.toUpperCase()} — Full Output ═══\n`);
      process.stdout.write(agent.fullOutput || '(no output)\n');
      process.stdout.write('\n');
    }
  } else if (panel.agents[expandTarget]) {
    process.stdout.write(`\n═══ ${expandTarget.toUpperCase()} — Full Output ═══\n`);
    process.stdout.write(panel.agents[expandTarget].fullOutput || '(no output)\n');
    process.stdout.write('\n');
  } else {
    process.stdout.write(`Unknown agent: ${expandTarget}. Use: /expand stone|cardinal|chaos|all\n`);
  }
}
```

### 5.3 State Storage

The panel instance MUST persist between prompt cycles so `/expand` can access the last run's output:

```javascript
global._palacePanel = panel; // set after each multi-head request
```

---

## 6. MULTI-AGENT SIMULTANEOUS DISPLAY

### 6.1 How `chat()` Currently Works

The current `chat(trimmed, currentHeads, convo)` function iterates over `currentHeads` and calls `streamChat` for each head **sequentially**. Each head's tokens stream to stdout one at a time.

### 6.2 What Changes for Parallel Display

Modify the `chat()` function to:

1. **Before streaming starts**: Create a StatusPanel, add all active heads, call `renderAll()`
2. **Replace token callbacks**: Each head gets a `createStatusCallback(panel, headName)` instead of `process.stdout.write(token)`
3. **Run heads in parallel**: Use `Promise.all()` instead of sequential `for` loop (if heads hit different endpoints or the API supports it — otherwise keep sequential but use the status panel for each)
4. **On each head completion**: Call `panel.complete(name, summary)`, then print summary to the summary area
5. **After all heads done**: Print all summaries, restore cursor to input line

### 6.3 Sequential Heads with Status Panel (v1 — simpler)

If keeping sequential execution (v1 recommended — simpler, avoids race conditions):

```javascript
async function chat(input, heads, convo) {
  const panel = new StatusPanel();

  // Register all heads
  for (const head of heads) {
    panel.addAgent(head, COLORS[head] || COLORS.reset);
  }

  // Reserve screen space and render empty boxes
  // Print enough newlines to make room for the panel
  const panelHeight = heads.length * 3 + 2; // 3 per box + separator + gap
  process.stdout.write('\n'.repeat(panelHeight));
  // Scroll up to position panel at top of reserved space
  process.stdout.write(`\x1b[${panelHeight}A`);

  panel.panelStartRow = /* current cursor row — see note below */;
  panel.renderAll();

  for (const head of heads) {
    panel.updateStatus(head, 'Thinking...');

    const callback = createStatusCallback(panel, head);

    // Call existing streamChat with our buffering callback
    await streamChat(input, head, convo, callback);

    // Generate summary
    const summary = generateSummary(panel.agents[head].fullOutput);
    panel.complete(head, summary);

    // Print summary below panel
    process.stdout.write(MOVE_TO(panel.summaryStartRow + 1, 1));
    process.stdout.write(`\n${COLORS[head] || ''}${head}:${COLORS.reset || ''} ${summary}\n`);
  }

  global._palacePanel = panel;
}
```

**Note on cursor row**: Getting the current absolute cursor row in Node.js requires querying the terminal with `\x1b[6n` and reading the response from stdin. For v1, a simpler approach: track a relative offset. Or use the **alternate screen buffer** approach below.

### 6.4 Cursor Row Detection (Practical Approach)

```javascript
function getCursorRow() {
  return new Promise((resolve) => {
    const wasRaw = process.stdin.isRaw;
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', (data) => {
      const match = data.toString().match(/\x1b\[(\d+);(\d+)R/);
      process.stdin.setRawMode(wasRaw);
      resolve(match ? parseInt(match[1]) : 1);
    });
    process.stdout.write('\x1b[6n'); // request cursor position
  });
}
```

---

## 7. CHANGES TO `patch-palace.js`

### 7.1 New Step: Inject StatusPanel Class

**Where**: After the `stripXmlTags` function injection (Step 9a).
**What**: Inject the `StatusPanel` class, `createStatusCallback`, `extractCue`, `generateSummary`, ANSI constants, and `getCursorRow` as top-level declarations in palace.mjs.
**Idempotency marker**: `// PALACE STATUS PANEL (patched by patch-palace.js)`

### 7.2 Modified Step: Replace `chat()` Token Callback

**Where**: The existing `streamChat` call inside `chat()`.
**What**: Wrap the existing chat flow:
- Before the head loop: create panel, render boxes
- Replace `process.stdout.write(token)` callbacks with `createStatusCallback(panel, head)`
- After each head: call `panel.complete()`, print summary
- After all heads: set `global._palacePanel = panel`

**Strategy**: Find the `for` loop over `currentHeads` inside `chat()` and wrap it. Same `safeReplace` pattern used by existing steps.

### 7.3 New Step: Inject `/expand` Command

**Where**: Inside the multimedia commands block (Step 13-18 area), using the `_palaceCmd` flag pattern.
**What**: Add the `/expand` handler from Section 5.2.
**Idempotency marker**: check for `'/expand'` in src.

### 7.4 Injection Order in patch-palace.js

1. Step 9a: stripXmlTags (existing)
2. **Step 9e (NEW)**: StatusPanel class + helpers
3. Step 13-18: Multimedia commands (existing) — add `/expand` to this block
4. **Step 19 (NEW)**: Wrap chat() function's streaming logic with panel integration

---

## 8. SINGLE-HEAD MODE

When only one head is active (e.g., just Stone after the default change), the status panel should still work but with a single box. This keeps the UX consistent. However, for v1 it is acceptable to skip the panel for single-head mode and fall back to current behavior. The founder's pain point is multi-head chaos.

**Recommendation for v1**: Panel activates only when `currentHeads.length > 1`. Single-head stays as-is.

---

## 9. EDGE CASES AND RISKS

| Risk | Mitigation |
|------|------------|
| Terminal too narrow for boxes | Use `process.stdout.columns`, minimum width 40, graceful degradation to no-box mode |
| Terminal resize during rendering | Listen to `process.stdout.on('resize')`, re-render panel |
| Cursor position race condition | Hide cursor during all panel updates, restore after |
| Long-running agent (>60s) | Status cue keeps updating so founder knows it is alive |
| fullOutput memory for very long responses | Cap at 50KB per agent, truncate oldest content |
| `\x1b[6n` cursor query timeout | Set 500ms timeout, fall back to row 1 |
| ESM strict mode (GS-2) | No `this` in injected code. StatusPanel methods use explicit references |
| Brace balance (GS-1) | Chaos MUST brace-audit the entire injection block before patching |
| Idempotency (GS-5) | Every new injection has a unique string marker checked before injection |

---

## 10. TESTING CHECKLIST FOR CHAOS

1. Single head (Stone only) — should work as current behavior (no panel in v1)
2. Two heads (Stone and Cardinal) — panel shows 2 boxes, status updates in place, summaries print below
3. All three heads — panel shows 3 boxes, no scrolling during work
4. `/expand stone` after completion — prints full output
5. `/expand all` — prints all full outputs
6. Rapid status updates — no flicker, cursor stays stable
7. `--dry-run` — writes to `.preview` file, does not touch palace.mjs
8. Run patcher twice — idempotent, second run changes nothing
9. `node --check palace.mjs` passes after patching (syntax valid)

---

## 11. FILES AFFECTED

| File | Change |
|------|--------|
| `patch-palace.js` | Add Steps 9e and 19. Extend multimedia block with `/expand`. |
| `palace.mjs` (via patch) | Receives StatusPanel class, modified chat() flow, /expand command |
| No new files needed | Everything goes into existing files |

---

**END OF SPEC**

Cardinal's assessment: This is achievable in a single patch-palace.js update. The core is ~150 lines of injected JavaScript (StatusPanel + helpers + /expand). The chat() modification is the trickiest part — Chaos should study the existing chat() function in palace.mjs on the OMEN to find exact anchor patterns before writing the replacement. The ANSI escape codes are well-supported in Windows Terminal. v1 keeps it sequential (no Promise.all) which avoids vLLM concurrency issues.

Chaos: Build it. GS-1 through GS-9 apply. Brace-audit before you ship.
