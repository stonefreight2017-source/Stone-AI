// palace-status-engine.js — Cardinal's Design, Chaos Injects This
// ================================================================
// Replicates EXACTLY what the founder sees in Claude Code:
//
//   Stone analyzing pricing strategy
//     ⠋ 3 tools used · 1.2K tokens
//     Reading seeds/stone-seeds.md
//
//   Cardinal researching competitors
//     ⠋ 7 tools used · 4.8K tokens
//     Writing docs/competitor-analysis.md
//
// That's it. No boxes. No borders. No colors. Three lines per agent.
// Spinner updates in place via ANSI cursor control. Screen doesn't scroll.
// ================================================================

// ─── ANSI ESCAPE SEQUENCES ──────────────────────────────────────
const HIDE_CURSOR    = '\x1b[?25l';
const SHOW_CURSOR    = '\x1b[?25h';
const CLEAR_LINE     = '\x1b[2K';
const CURSOR_TO_COL1 = '\r';
const MOVE_UP        = (n) => `\x1b[${n}A`;

// ─── BRAILLE SPINNER (same as Claude Code) ──────────────────────
const SPIN = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];

// ─── THE ENGINE ─────────────────────────────────────────────────
//
// How it works:
//   1. addAgent() registers agents. Each gets 3 lines + 1 blank = 4 lines.
//   2. start() prints N blank lines to "reserve" screen space, then
//      moves cursor back up. The cursor LIVES at the TOP of the block.
//   3. Every 80ms, _render() overwrites those lines from top to bottom
//      using \r + CLEAR_LINE on each line, then \n to advance.
//      After writing all lines, MOVE_UP brings cursor back to the top.
//   4. When all agents complete, finish() moves cursor BELOW the block.
//
// This means:
//   - Cursor is always at line 0 of our block (top-left)
//   - _render writes downward, then jumps back up
//   - Nothing outside our block ever gets touched
//   - No save/restore needed — we own the cursor position entirely

class StatusEngine {
  constructor() {
    this.agents = [];       // [{ name, header, detail, tools, tokens, done, summary, spinIdx }]
    this.timer = null;
    this.totalLines = 0;    // how many lines our block occupies
    this.started = false;
    this.finished = false;
  }

  addAgent(name, headerText) {
    this.agents.push({
      name,
      header: headerText,
      detail: '',
      tools: 0,
      tokens: 0,
      done: false,
      summary: '',
      spinIdx: 0,
    });
  }

  start() {
    if (this.started) return;
    this.started = true;

    // Calculate total lines: 3 per agent + 1 blank between each pair
    const n = this.agents.length;
    this.totalLines = (n * 3) + Math.max(0, n - 1);

    // Reserve screen space: print blank lines, then move back up
    process.stdout.write(HIDE_CURSOR);
    for (let i = 0; i < this.totalLines; i++) {
      process.stdout.write('\n');
    }
    process.stdout.write(MOVE_UP(this.totalLines));

    // Cursor is now at the top of our reserved block.
    // Initial render
    this._render();

    // Spinner tick every 80ms
    this.timer = setInterval(() => {
      for (const agent of this.agents) {
        if (!agent.done) {
          agent.spinIdx = (agent.spinIdx + 1) % SPIN.length;
        }
      }
      this._render();
    }, 80);
  }

  update(name, opts) {
    const agent = this._find(name);
    if (!agent || agent.done) return;
    if (opts.detail !== undefined) agent.detail = opts.detail;
    if (opts.toolsDelta)           agent.tools += opts.toolsDelta;
    if (opts.tokensDelta)          agent.tokens += opts.tokensDelta;
  }

  updateHeader(name, text) {
    const agent = this._find(name);
    if (agent) agent.header = text;
  }

  complete(name, summaryText) {
    const agent = this._find(name);
    if (!agent) return;
    agent.done = true;
    agent.summary = summaryText || 'Done';
    this._render();

    if (this.agents.every(a => a.done)) {
      this.finish();
    }
  }

  finish() {
    if (this.finished) return;
    this.finished = true;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this._render();
    // Move cursor below our block so normal output resumes
    // Cursor is at top of block after _render, so move down totalLines
    for (let i = 0; i < this.totalLines; i++) {
      process.stdout.write('\n');
    }
    process.stdout.write(SHOW_CURSOR);
  }

  // ── INTERNAL ────────────────────────────────────────────────

  _find(name) {
    return this.agents.find(a => a.name === name);
  }

  _render() {
    // Cursor is at line 0 of our block (guaranteed by start() and by
    // the MOVE_UP at the end of each _render call).
    const cols = process.stdout.columns || 80;
    const lines = [];

    for (let i = 0; i < this.agents.length; i++) {
      const a = this.agents[i];

      // Line 1: Header
      lines.push(this._trunc(a.header, cols));

      // Line 2: Spinner + stats
      const icon = a.done ? '\u2713' : SPIN[a.spinIdx];
      const toolStr = a.tools > 0 ? `${a.tools} tools used \u00b7 ` : '';
      const tokStr = this._fmtTokens(a.tokens);
      lines.push(this._trunc(`  ${icon} ${toolStr}${tokStr} tokens`, cols));

      // Line 3: Detail or summary
      const detailText = a.done ? a.summary : a.detail;
      lines.push(this._trunc(detailText ? `  ${detailText}` : '', cols));

      // Blank separator (not after last agent)
      if (i < this.agents.length - 1) {
        lines.push('');
      }
    }

    // Write all lines from current cursor position (top of block)
    let buf = '';
    for (let i = 0; i < lines.length; i++) {
      buf += CURSOR_TO_COL1 + CLEAR_LINE + lines[i];
      if (i < lines.length - 1) buf += '\n';
    }
    process.stdout.write(buf);

    // Move cursor back to top of block
    if (lines.length > 1) {
      process.stdout.write(MOVE_UP(lines.length - 1));
    }
    process.stdout.write(CURSOR_TO_COL1);
  }

  _trunc(text, maxCols) {
    if (!text) return '';
    return text.length > maxCols ? text.slice(0, maxCols - 1) : text;
  }

  _fmtTokens(n) {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  }
}


// ================================================================
// INTEGRATION GUIDE FOR CHAOS
// ================================================================
//
// Chaos: this is the COMPLETE injectable pattern. Here's exactly
// what you put into patch-palace.js as a new step.
//
// ── STEP 1: Inject StatusEngine class into palace.mjs ──────────
//
// Find the top of palace.mjs (after imports). Inject the StatusEngine
// class and helpers above (everything from "const HIDE_CURSOR" through
// the end of the class). Use the same safeReplace / idempotency
// pattern. Marker: "// PALACE_STATUS_ENGINE"
//
// ── STEP 2: Inject extractActivityHint helper ──────────────────
//
//   function extractActivityHint(buffer, lastHint) {
//     const fileMatch = buffer.match(/[\w\-\/]+\.\w{1,5}/);
//     if (fileMatch) return 'Processing ' + fileMatch[0];
//     const actMatch = buffer.match(
//       /\b(analyzing|reading|writing|checking|building|reviewing|comparing)\b/i
//     );
//     if (actMatch) return actMatch[1][0].toUpperCase() + actMatch[1].slice(1) + '...';
//     return lastHint;
//   }
//
// ── STEP 3: Wrap the chat() head loop ──────────────────────────
//
// BEFORE (existing palace.mjs pattern):
//
//   for (const head of currentHeads) {
//     // ... messages setup ...
//     await streamChat(url, messages, convo, (token) => {
//       process.stdout.write(stripThinkTokens(token));  // or similar
//     });
//     // ... tool extraction etc ...
//   }
//
// AFTER (what Chaos injects — wraps the existing loop):
//
//   // ── STATUS ENGINE (multi-head only) ──
//   const _usePanel = currentHeads.length > 1;
//   let _engine = null;
//   if (_usePanel) {
//     _engine = new StatusEngine();
//     for (const h of currentHeads) _engine.addAgent(h, h + ' thinking...');
//     _engine.start();
//   }
//   global._palaceOutputs = {};
//
//   for (const head of currentHeads) {
//     if (_engine) _engine.updateHeader(head, head + ' responding...');
//     let _lastHint = '';
//     global._palaceOutputs[head] = '';
//
//     // ... existing messages setup stays exactly as-is ...
//
//     await streamChat(url, messages, convo, (token) => {
//       global._palaceOutputs[head] += token;
//       if (_engine) {
//         // Buffer mode: don't print, just update the status line
//         _lastHint = extractActivityHint(token, _lastHint);
//         _engine.update(head, {
//           tokensDelta: token.length,
//           detail: _lastHint,
//         });
//       } else {
//         // Single-head mode: print as before
//         process.stdout.write(stripThinkTokens(token));
//       }
//     });
//
//     // ... existing tool extraction stays as-is ...
//
//     if (_engine) {
//       const out = global._palaceOutputs[head] || '';
//       const line1 = out.split('\\n').find(l => l.trim()) || 'Done';
//       _engine.complete(head, line1.replace(/[#*_`]/g, '').trim().slice(0, 60));
//     }
//   }
//
//   // After all heads, print clean summaries
//   if (_engine) {
//     console.log('');
//     for (const head of currentHeads) {
//       const out = global._palaceOutputs[head] || '';
//       const lines = out.split('\\n').filter(l => l.trim()).slice(0, 5);
//       console.log(head + ':');
//       for (const l of lines) console.log('  ' + l.trim());
//       console.log('');
//     }
//   }
//
// ── STEP 4: Hook tool counting ─────────────────────────────────
//
// Wherever extractToolCalls() is called in the loop, add:
//   if (_engine) _engine.update(head, { toolsDelta: 1 });
//
// ── STEP 5: /expand command ────────────────────────────────────
//
// In the slash-command handler (where /quit, /heads, etc live):
//
//   if (trimmed.startsWith('/expand')) {
//     const t = trimmed.split(/\s+/)[1]?.toLowerCase();
//     const o = global._palaceOutputs || {};
//     if (t === 'all') {
//       for (const [n, txt] of Object.entries(o)) {
//         console.log('\\n=== ' + n.toUpperCase() + ' ===');
//         console.log(txt);
//       }
//     } else if (o[t]) {
//       console.log('\\n=== ' + t.toUpperCase() + ' ===');
//       console.log(o[t]);
//     } else {
//       console.log('Usage: /expand stone|cardinal|chaos|all');
//     }
//     continue;
//   }
//
// ================================================================
// THAT'S IT. ~120 lines of injected code total.
// No React. No blessed. No ink. Just ANSI escape codes.
// ================================================================

module.exports = { StatusEngine, SPIN };
