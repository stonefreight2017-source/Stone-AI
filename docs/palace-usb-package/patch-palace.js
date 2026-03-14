#!/usr/bin/env node
// patch-palace.js — Stone AI Palace Patcher (FINAL v2)
// Run: node patch-palace.js [--dry-run]
// Agents: Stone (Head 1), Chaos (#44), Computer Wiz (#45)
// P-1: --dry-run writes to .preview instead of overwriting palace.mjs
// P-2: Post-patch node --check syntax validation
// P-4: Cross-file contract check against install-palace-tools.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ─── P-1: DRY-RUN MODE ───────────────────────────────────────────────
const DRY_RUN = process.argv.includes('--dry-run');
if (DRY_RUN) {
  console.log('[DRY-RUN] Preview mode — will write to .preview files, not overwrite originals.');
}

// ─── CONFIG ───────────────────────────────────────────────────────────
const PALACE_DIR = 'C:\\Users\\admin\\palace';
const PALACE_MJS = path.join(PALACE_DIR, 'palace.mjs');
const PALACE_MJS_OUT = DRY_RUN ? path.join(PALACE_DIR, 'palace.preview.mjs') : PALACE_MJS;
const BACKUP_MJS = path.join(PALACE_DIR, 'palace.mjs.backup');
const SEEDS_DIR = path.join(PALACE_DIR, 'seeds');
const STARTUP_BAT = path.join(PALACE_DIR, 'palace-startup.bat');
const STARTUP_FOLDER = path.join(
  process.env.APPDATA || 'C:\\Users\\admin\\AppData\\Roaming',
  'Microsoft\\Windows\\Start Menu\\Programs\\Startup'
);

let warnings = [];
let successes = [];

function log(msg) { console.log(`[PATCH] ${msg}`); }
function warn(msg) { warnings.push(msg); console.log(`[WARN]  ${msg}`); }
function ok(msg) { successes.push(msg); console.log(`[OK]    ${msg}`); }

// ─── HELPERS ──────────────────────────────────────────────────────────

// Robust replacement: tries exact string first, falls back to regex
function safeReplace(source, label, exactStr, regexFallback, replacement) {
  if (source.includes(exactStr)) {
    source = source.replace(exactStr, replacement);
    ok(`${label} (exact match)`);
    return source;
  }
  if (regexFallback) {
    const match = source.match(regexFallback);
    if (match) {
      source = source.replace(regexFallback, replacement);
      ok(`${label} (regex match)`);
      return source;
    }
  }
  warn(`${label} — target not found, skipping`);
  return source;
}

function safeReplaceAll(source, label, find, replacement) {
  if (source.includes(find)) {
    source = source.split(find).join(replacement);
    ok(`${label}`);
    return source;
  }
  warn(`${label} — target not found, skipping`);
  return source;
}

// ─── MAIN ─────────────────────────────────────────────────────────────
function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   STONE AI — PALACE PATCHER (FINAL)                 ║');
  console.log('║   Stone (Head 1) + Chaos (#44) + Wiz (#45)          ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');

  // ─── STEP 0: Verify palace.mjs exists ─────────────────────────────
  if (!fs.existsSync(PALACE_MJS)) {
    console.error(`[FATAL] palace.mjs not found at ${PALACE_MJS}`);
    console.error('        Make sure you are running this on the OMEN.');
    process.exit(1);
  }
  log('Found palace.mjs');

  // ─── STEP 1: BACKUP ──────────────────────────────────────────────
  fs.copyFileSync(PALACE_MJS, BACKUP_MJS);
  ok('1. Backup created → palace.mjs.backup');

  let src = fs.readFileSync(PALACE_MJS, 'utf-8');
  const originalLength = src.length;

  // ─── STEP 2: FIX MODEL PATH ──────────────────────────────────────
  if (src.includes('qwen2.5-32b-awq')) {
    src = src.split('qwen2.5-32b-awq').join('qwen3-32b-awq');
    ok('2. Model path: qwen2.5-32b-awq → qwen3-32b-awq');
  } else if (src.includes('qwen3-32b-awq')) {
    ok('2. Model path already correct (qwen3-32b-awq)');
  } else {
    warn('2. Model path — neither old nor new model string found');
  }

  // ─── STEP 2B: CONST → LET FOR TRIMMED & CURRENTHEADS ────────────
  // Name routing (Step 3) reassigns these, so they must be `let` not `const`.
  // Only converts the FIRST occurrence (the declaration), not any later usage.
  // GS-5: Idempotent — skips if already `let`.

  if (src.includes('let trimmed') && !src.includes('const trimmed')) {
    ok('2B-a. trimmed already declared with let (skipping)');
  } else if (src.includes('const trimmed')) {
    // GS-8: split/join replaces ALL occurrences — .replace() only hits the first!
    const beforeCount = (src.match(/const trimmed/g) || []).length;
    src = src.split('const trimmed').join('let trimmed');
    ok(`2B-a. const trimmed → let trimmed (${beforeCount} occurrence${beforeCount > 1 ? 's' : ''} replaced)`);
  } else {
    warn('2B-a. trimmed declaration — not found as const or let');
  }

  if (src.includes('let currentHeads') && !src.includes('const currentHeads')) {
    ok('2B-b. currentHeads already declared with let (skipping)');
  } else if (src.includes('const currentHeads')) {
    // GS-8: split/join replaces ALL occurrences — .replace() only hits the first!
    const beforeCount = (src.match(/const currentHeads/g) || []).length;
    src = src.split('const currentHeads').join('let currentHeads');
    ok(`2B-b. const currentHeads → let currentHeads (${beforeCount} occurrence${beforeCount > 1 ? 's' : ''} replaced)`);
  } else {
    warn('2B-b. currentHeads declaration — not found as const or let');
  }

  // ─── STEP 3: NAME ROUTING WITHOUT SLASHES ────────────────────────
  // We insert name detection code BEFORE the regular message handler.
  // Look for the comment anchor and the chat call that follows it.

  const nameRoutingCode = `
    // ─── NAME ROUTING (patched by patch-palace.js) ───────────────
    const nameRouteResult = (function(input) {
      const lower = input.toLowerCase().trim();

      // "all" → all three heads
      if (/^all\\b/.test(lower)) {
        return { heads: ['stone', 'cardinal', 'chaos'], stripped: input.replace(/^all\\s*/i, '').trim() };
      }

      // Two names with "and"
      const andMatch = lower.match(/^(stone|cardinal|chaos|wiz|computer\\s*wiz)\\s+and\\s+(stone|cardinal|chaos|wiz|computer\\s*wiz)\\b/);
      if (andMatch) {
        const nameMap = (n) => (n === 'wiz' || n.startsWith('computer')) ? 'stone' : n;
        const h1 = nameMap(andMatch[1].trim());
        const h2 = nameMap(andMatch[2].trim());
        const heads = [...new Set([h1, h2])];
        const stripped = input.replace(/^(stone|cardinal|chaos|wiz|computer\\s*wiz)\\s+and\\s+(stone|cardinal|chaos|wiz|computer\\s*wiz)\\s*/i, '').trim();
        return { heads, stripped };
      }

      // Single names
      if (/^stones?\\b/.test(lower)) {
        return { heads: ['stone'], stripped: input.replace(/^stones?\\s*/i, '').trim() };
      }
      if (/^cardinal\\b/.test(lower)) {
        return { heads: ['cardinal'], stripped: input.replace(/^cardinal\\s*/i, '').trim() };
      }
      if (/^chaos\\b/.test(lower)) {
        return { heads: ['chaos'], stripped: input.replace(/^chaos\\s*/i, '').trim() };
      }
      if (/^computer\\s*wiz\\b/.test(lower)) {
        return { heads: ['stone'], stripped: input.replace(/^computer\\s*wiz\\s*/i, '').trim() };
      }
      if (/^wiz\\b/.test(lower)) {
        return { heads: ['stone'], stripped: input.replace(/^wiz\\s*/i, '').trim() };
      }

      return null; // no name detected
    })(trimmed);

    if (nameRouteResult) {
      currentHeads = nameRouteResult.heads;
      trimmed = nameRouteResult.stripped || trimmed;
    }
    // ─── END NAME ROUTING ────────────────────────────────────────
`;

  // Strategy: find the "Regular message" comment and inject before the chat call
  // Try multiple anchor patterns
  let injected = false;

  // Idempotency: skip if already patched
  if (src.includes('NAME ROUTING (patched by patch-palace.js)')) {
    ok('3. Name routing already present (skipping)');
    injected = true;
  }

  // Pattern 1: Look for the exact comment + await chat line
  const regularMsgPattern1 = /(\s*\/\/\s*Regular message[^\n]*\n)(\s*await\s+chat\s*\(\s*trimmed)/;
  if (!injected && regularMsgPattern1.test(src)) {  // GS-5 FIX: check !injected to respect idempotency guard
    src = src.replace(regularMsgPattern1, `$1${nameRoutingCode}\n$2`);
    injected = true;
  }

  // Pattern 2: Just find "await chat(trimmed, currentHeads, convo)" near end of file
  if (!injected) {
    // Find the LAST occurrence of await chat(trimmed — that's the regular message handler
    const chatCallPattern = /(\n)([ \t]*)(await\s+chat\s*\(\s*trimmed\s*,\s*currentHeads\s*,\s*convo\s*\))/g;
    let lastMatch = null;
    let match;
    while ((match = chatCallPattern.exec(src)) !== null) {
      lastMatch = match;
    }
    if (lastMatch) {
      const indent = lastMatch[2];
      const indentedRouting = nameRoutingCode.split('\n').map(line => indent + line).join('\n');
      const insertPos = lastMatch.index;
      src = src.slice(0, insertPos) + '\n' + indentedRouting + '\n' + src.slice(insertPos);
      injected = true;
    }
  }

  if (injected) {
    ok('3. Name routing (without slashes) injected before regular message handler');
  } else {
    warn('3. Name routing — could not find injection point');
  }

  // ─── STEP 4: DEFAULT TO STONE ONLY ───────────────────────────────
  // Find initial currentHeads assignment that sets all three heads
  const allHeadsPatterns = [
    "currentHeads = ['stone', 'cardinal', 'chaos']",
    'currentHeads = ["stone", "cardinal", "chaos"]',
    "currentHeads = [`stone`, `cardinal`, `chaos`]",
  ];

  let defaultChanged = false;
  for (const pattern of allHeadsPatterns) {
    if (src.includes(pattern)) {
      // Only replace the FIRST occurrence (the initialization), not /all command
      const idx = src.indexOf(pattern);
      // Check context: we want the initialization, not the /all case
      // Replace only the first one
      src = src.slice(0, idx) + "currentHeads = ['stone']" + src.slice(idx + pattern.length);
      defaultChanged = true;
      break;
    }
  }

  // Also try regex for variations
  if (!defaultChanged) {
    const initRegex = /(let|const|var)\s+currentHeads\s*=\s*\[['"`]stone['"`]\s*,\s*['"`]cardinal['"`]\s*,\s*['"`]chaos['"`]\s*\]/;
    if (initRegex.test(src)) {
      src = src.replace(initRegex, "$1 currentHeads = ['stone']");
      defaultChanged = true;
    }
  }

  if (defaultChanged) {
    ok("4. Default heads changed to ['stone'] only");
  } else {
    warn('4. Default heads — could not find all-three initialization');
  }

  // ─── STEP 5: CLEAN HEAD LABEL ────────────────────────────────────
  // Replace [${varName}] with ${varName}: — tries multiple variable names
  // and bracket-space variants. If all fail, logs diagnostic context.

  let step5Fixed = false;

  // Try exact bracket patterns with multiple variable names
  const bracketVarNames = ['label', 'head', 'name', 'agent'];
  for (const varName of bracketVarNames) {
    // Tight brackets: [${varName}]
    const tight = `[\${${varName}}]`;
    if (src.includes(tight)) {
      src = src.split(tight).join(`\${${varName}}:`);
      ok(`5. Head label format [\${${varName}}] → \${${varName}}:`);
      step5Fixed = true;
    }
    // Spaced brackets: [ ${varName} ]
    const spaced = `[ \${${varName}} ]`;
    if (src.includes(spaced)) {
      src = src.split(spaced).join(`\${${varName}}:`);
      ok(`5. Head label format (spaced) [ \${${varName}} ] → \${${varName}}:`);
      step5Fixed = true;
    }
  }

  // Regex fallback: match any [${...}] pattern near process.stdout.write
  if (!step5Fixed) {
    const bracketVarRegex = /\[\$\{(\w+)\}\]/g;
    let regexMatch;
    let bracketVarsFound = [];
    while ((regexMatch = bracketVarRegex.exec(src)) !== null) {
      bracketVarsFound.push({ full: regexMatch[0], varName: regexMatch[1], index: regexMatch.index });
    }
    if (bracketVarsFound.length > 0) {
      // Check if any are near a process.stdout.write (within 200 chars)
      for (const bv of bracketVarsFound) {
        const nearby = src.slice(Math.max(0, bv.index - 200), bv.index + 200);
        if (nearby.includes('process.stdout.write')) {
          src = src.split(bv.full).join(`\${${bv.varName}}:`);
          ok(`5. Head label format (regex) ${bv.full} → \${${bv.varName}}:`);
          step5Fixed = true;
          break;
        }
      }
      // If none near stdout.write, replace all bracket-var patterns anyway
      if (!step5Fixed) {
        for (const bv of bracketVarsFound) {
          src = src.split(bv.full).join(`\${${bv.varName}}:`);
        }
        ok(`5. Head label format (regex, all occurrences) — fixed ${bracketVarsFound.length} bracket-var patterns`);
        step5Fixed = true;
      }
    }
  }

  if (!step5Fixed) {
    // Diagnostic: show lines containing process.stdout.write so we know the actual format
    const srcLines = src.split('\n');
    const stdoutLines = [];
    for (let i = 0; i < srcLines.length && stdoutLines.length < 5; i++) {
      if (srcLines[i].includes('process.stdout.write')) {
        stdoutLines.push(`  L${i + 1}: ${srcLines[i].trim().slice(0, 120)}`);
      }
    }
    warn('5. Head label format — no bracket-var pattern found. Diagnostic — process.stdout.write lines:\n' +
      (stdoutLines.length > 0 ? stdoutLines.join('\n') : '  (none found)'));
  }

  // ─── STEP 6: REMOVE TIMING LINE ──────────────────────────────────
  // Find console.log with 'elapsed' and comment it out
  const timingPatterns = [
    /([ \t]*)(console\.log\([^)]*elapsed[^)]*\);?)/g,
    /([ \t]*)(console\.log\([^)]*inputTokens[^)]*\);?)/g,
    /([ \t]*)(console\.log\(`[^`]*elapsed[^`]*`\);?)/g,
  ];

  let timingFound = false;
  for (const pat of timingPatterns) {
    if (pat.test(src)) {
      src = src.replace(pat, '$1// [PATCHED OUT] $2');
      timingFound = true;
    }
    pat.lastIndex = 0; // reset regex
  }

  if (timingFound) {
    ok('6. Timing/token console.log lines commented out');
  } else {
    warn('6. Timing line — pattern not found');
  }

  // ─── STEP 7: THINK TOKEN FILTER ON FOLLOW-UPS ────────────────────
  // The follow-up streamChat has a bare process.stdout.write(token) without think filtering.
  // We need to find it and wrap it with the same think filter used in the main callback.
  // Resilient approach: broad detection of streamChat calls, flexible callback param names.

  const thinkFilterCallback = `((function() { let _tfs = { inThink: false, buf: '' }; return (token) => {
            // Think token filter (patched — closure-based, no this)
            const st = _tfs;
            const combined = st.buf + token;
            if (st.inThink) {
              const endIdx = combined.indexOf('</think>');
              if (endIdx !== -1) {
                st.inThink = false;
                st.buf = '';
                const after = combined.slice(endIdx + 8);
                if (after) process.stdout.write(after);
              } else {
                st.buf = combined.slice(-16);
              }
            } else {
              const startIdx = combined.indexOf('<think>');
              if (startIdx !== -1) {
                st.inThink = true;
                const before = combined.slice(0, startIdx);
                st.buf = combined.slice(startIdx);
                if (before) process.stdout.write(before);
              } else {
                st.buf = '';
                process.stdout.write(token);
              }
            }; }; })())`;  // GS-1 FIX: added }; to close arrow body + function body

  let followUpFixed = false;

  // Phase 1: Find ALL streamChat calls in the source for diagnostic context
  const streamChatCallRegex = /\bstreamChat\s*\(/g;
  let streamChatLocations = [];
  let scMatch;
  while ((scMatch = streamChatCallRegex.exec(src)) !== null) {
    // Grab surrounding context (up to 300 chars after the match start)
    const snippet = src.slice(scMatch.index, scMatch.index + 300).split('\n').slice(0, 5).join(' ').trim();
    streamChatLocations.push({ index: scMatch.index, snippet: snippet.slice(0, 150) });
  }

  // Phase 2: Flexible detection — match any callback param name writing to stdout
  // Tries: token, t, chunk, data, text, msg, s, c
  const callbackParamNames = ['token', 't', 'chunk', 'data', 'text', 'msg', 's', 'c'];
  const paramAlternation = callbackParamNames.join('|');

  // Pattern A: streamChat(anything..., (param) => process.stdout.write(param))
  // Permissive on parameter count — uses [\s\S] with lazy match up to the callback
  const flexPatternArrow = new RegExp(
    `(\\bstreamChat\\s*\\()[\\s\\S]*?\\(\\s*(${paramAlternation})\\s*\\)\\s*=>\\s*process\\.stdout\\.write\\(\\s*\\2\\s*\\)\\s*\\)`,
    'g'
  );

  // Pattern B: streamChat(anything..., (param) => { process.stdout.write(param); })
  const flexPatternBlock = new RegExp(
    `(\\bstreamChat\\s*\\()[\\s\\S]*?\\(\\s*(${paramAlternation})\\s*\\)\\s*=>\\s*\\{\\s*process\\.stdout\\.write\\(\\s*\\2\\s*\\)\\s*;?\\s*\\}\\s*\\)`,
    'g'
  );

  // Phase 3: Try flexible patterns — skip the first match (main handler already has filter)
  for (const flexPat of [flexPatternArrow, flexPatternBlock]) {
    let flexMatch;
    let matchNum = 0;
    while ((flexMatch = flexPat.exec(src)) !== null) {
      matchNum++;
      if (matchNum > 1) {
        // This is a follow-up streamChat — replace the bare callback
        const fullMatch = flexMatch[0];
        const paramName = flexMatch[2];
        // Reconstruct: everything up to the callback param gets kept, callback gets replaced
        const callbackRegex = new RegExp(
          `\\(\\s*${paramName}\\s*\\)\\s*=>\\s*(?:\\{\\s*)?process\\.stdout\\.write\\(\\s*${paramName}\\s*\\)\\s*;?\\s*(?:\\}\\s*)?\\)$`
        );
        const replaced = fullMatch.replace(callbackRegex, `${thinkFilterCallback})`);
        if (replaced !== fullMatch) {
          src = src.slice(0, flexMatch.index) + replaced + src.slice(flexMatch.index + fullMatch.length);
          ok(`7. Think token filter added to follow-up streamChat (param: ${paramName})`);
          followUpFixed = true;
          break;
        }
      }
    }
    if (followUpFixed) break;
  }

  // Phase 4: Broadest fallback — find ANY bare (param) => process.stdout.write(param) after the first one
  if (!followUpFixed) {
    const broadPattern = new RegExp(
      `\\(\\s*(${paramAlternation})\\s*\\)\\s*=>\\s*(?:\\{\\s*)?process\\.stdout\\.write\\(\\s*\\1\\s*\\)`,
      'g'
    );
    let broadMatch;
    let broadCount = 0;
    let broadLastIdx = -1;
    let broadLastMatch = null;
    while ((broadMatch = broadPattern.exec(src)) !== null) {
      broadCount++;
      if (broadCount > 1) {
        broadLastIdx = broadMatch.index;
        broadLastMatch = broadMatch[0];
      }
    }
    if (broadLastIdx !== -1 && broadLastMatch) {
      const before = src.slice(0, broadLastIdx);
      const after = src.slice(broadLastIdx + broadLastMatch.length);
      src = before + thinkFilterCallback + after;
      ok('7. Think token filter added to follow-up callback (broad match)');
      followUpFixed = true;
    }
  }

  if (!followUpFixed) {
    // Diagnostic: show all streamChat call signatures found
    let diagLines = streamChatLocations.map((loc, i) =>
      `  streamChat #${i + 1} (char ${loc.index}): ${loc.snippet}`
    );
    if (diagLines.length === 0) {
      diagLines = ['  (no streamChat calls found in source)'];
    }
    // Also show lines with process.stdout.write for context
    const srcLines = src.split('\n');
    const writeLines = [];
    for (let i = 0; i < srcLines.length && writeLines.length < 5; i++) {
      if (srcLines[i].includes('process.stdout.write')) {
        writeLines.push(`  L${i + 1}: ${srcLines[i].trim().slice(0, 120)}`);
      }
    }
    warn('7. Follow-up streamChat — could not find bare write callback.\n' +
      '  Diagnostic — streamChat calls found:\n' + diagLines.join('\n') +
      '\n  Diagnostic — process.stdout.write lines:\n' +
      (writeLines.length > 0 ? writeLines.join('\n') : '  (none found)'));
  }

  // ─── STEP 8: BLOCK MODEL TOOL EXECUTION ──────────────────────────
  // Safe approach: make extractToolCalls always return empty array
  // This is safer than commenting out multi-line blocks which can break syntax

  let toolBlocked = false;

  // Inject return [] as first line inside extractToolCalls so it never executes
  if (src.includes('PATCHED — no auto tool exec')) {
    ok('8. Tool execution already blocked (skipping)');
    toolBlocked = true;
  } else if (src.includes('function extractToolCalls')) {
    src = src.replace(
      /function\s+extractToolCalls\s*\([^)]*\)\s*\{/,
      'function extractToolCalls() { return []; /* PATCHED — no auto tool exec */'
    );
    toolBlocked = true;
  }

  // Also: if toolCalls.length > 0 → change to if (false)
  if (src.includes('toolCalls.length > 0')) {
    src = src.replace(/toolCalls\.length\s*>\s*0/g, 'false /* PATCHED — tool exec disabled */');
    toolBlocked = true;
  }
  if (src.includes('toolCalls.length')) {
    src = src.replace(/if\s*\(\s*toolCalls\.length\s*\)/g, 'if (false /* PATCHED */)');
    toolBlocked = true;
  }

  if (toolBlocked) {
    ok('8. Model tool auto-execution blocked (safe method)');
  } else {
    warn('8. extractToolCalls — pattern not found');
  }

  // ─── STEP 9: STRIP XML TAGS FROM OUTPUT ──────────────────────────
  // Add XML stripping to the main streaming callback
  // We inject a line that strips <response>, </response>, <tool>, </tool>
  // Find process.stdout.write(token) or process.stdout.write(before/after/combined) in the main handler
  // and wrap with tag stripping.

  // Instead of trying to modify the complex callback, we monkey-patch process.stdout.write
  // by injecting a filter at the top of the chat function.

  // ─── STEP 9: STRIP XML TAGS FROM OUTPUT ──────────────────────────
  // Safe approach: find all process.stdout.write calls in the streaming callbacks
  // and add tag stripping inline. Don't inject new code blocks that could break syntax.

  // Replace the main streaming write to strip tags
  const xmlTags = ['<response>', '</response>', '<tool>', '</tool>', '<tool_call>', '</tool_call>', '<function_call>', '</function_call>'];

  // Add a global helper function at the top of the file (after imports, before config)
  const stripperFunc = `
// ─── XML TAG STRIPPER (patched by patch-palace.js) ───
function stripXmlTags(text) {
  return text.replace(/<\\/?(?:response|tool|tool_call|function_call|thinking|think)>/gi, '');
}
`;

  // Insert after the first line that has 'use strict' or after the imports
  // Idempotency: skip if already patched
  if (src.includes('function stripXmlTags')) {
    ok('9a. stripXmlTags already present (skipping)');
  } else if (src.includes("import ") || src.includes("require(")) {
    // Find end of imports/requires block — insert after the color/config section
    const configAnchor = "function c(color, text)";
    if (src.includes(configAnchor)) {
      const idx = src.indexOf(configAnchor);
      src = src.slice(0, idx) + stripperFunc + '\n' + src.slice(idx);
      ok('9a. stripXmlTags helper function added');
    } else {
      // Fallback: insert near top
      const firstNewline = src.indexOf('\n');
      src = src.slice(0, firstNewline + 1) + stripperFunc + src.slice(firstNewline + 1);
      ok('9a. stripXmlTags helper function added (top of file)');
    }
  }

  // Now wrap process.stdout.write calls in the streaming callbacks to use stripXmlTags
  // Find: process.stdout.write(COLORS[color] + tokenBuffer + COLORS.reset)
  // Replace with stripped version
  if (src.includes('COLORS[color] + tokenBuffer + COLORS.reset')) {
    src = src.replace(
      /process\.stdout\.write\(COLORS\[color\] \+ tokenBuffer \+ COLORS\.reset\)/g,
      'process.stdout.write(COLORS[color] + stripXmlTags(tokenBuffer) + COLORS.reset)'
    );
    ok('9b. XML stripping added to main token output');
  }

  // Also strip from: process.stdout.write(COLORS[color] + after + COLORS.reset)
  if (src.includes('COLORS[color] + after + COLORS.reset')) {
    src = src.replace(
      /process\.stdout\.write\(COLORS\[color\] \+ after \+ COLORS\.reset\)/g,
      'process.stdout.write(COLORS[color] + stripXmlTags(after) + COLORS.reset)'
    );
    ok('9c. XML stripping added to after-think output');
  }

  // ─── STEP 9d: FINAL OUTPUT SANITIZER (catch ANY leaked think tags) ───
  // GS-5: Idempotent — checks for marker before injecting.
  // This monkey-patches process.stdout.write to strip any leaked <think>/<thinking> tags
  // as an absolute last line of defense.

  const finalSanitizerFunc = `
// ─── FINAL OUTPUT SANITIZER (patched by patch-palace.js) ───
// Last-resort filter: catches ANY leaked think/thinking tags before they reach the screen.
(function() {
  const _origWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = function(chunk, encoding, callback) {
    if (typeof chunk === 'string') {
      chunk = chunk.replace(/<\\/?(?:think|thinking)>/gi, '');
    }
    return _origWrite(chunk, encoding, callback);
  };
})();
`;

  if (src.includes('FINAL OUTPUT SANITIZER (patched by patch-palace.js)')) {
    ok('9d. Final output sanitizer already present (skipping)');
  } else if (src.includes('function stripXmlTags')) {
    // Insert right after stripXmlTags function
    const stripIdx = src.indexOf('function stripXmlTags');
    const afterStrip = src.indexOf('\n}', stripIdx);
    if (afterStrip !== -1) {
      src = src.slice(0, afterStrip + 2) + '\n' + finalSanitizerFunc + src.slice(afterStrip + 2);
      ok('9d. Final output sanitizer injected (monkey-patches process.stdout.write)');
    } else {
      warn('9d. Final output sanitizer — could not find stripXmlTags closing brace');
    }
  } else {
    warn('9d. Final output sanitizer — stripXmlTags not found, cannot anchor');
  }

  // ─── WRITE PATCHED FILE ──────────────────────────────────────────
  fs.writeFileSync(PALACE_MJS_OUT, src, 'utf-8');
  ok(`palace.mjs patched (${originalLength} → ${src.length} bytes)${DRY_RUN ? ' [PREVIEW]' : ''}`);

  // ─── STEP 10: WRITE SEED FILES (from full seed files in seeds/ directory) ───
  if (!fs.existsSync(SEEDS_DIR)) {
    fs.mkdirSync(SEEDS_DIR, { recursive: true });
  }

  const seedFiles = [
    'stone-seeds.md',
    'cardinal-seeds.md',
    'chaos-seeds.md',
    'computerwiz-seeds.md',
    'shared-context.md',
    'agent-identities.json'
  ];

  const patchSeedsDir = path.join(__dirname, 'seeds');
  for (let _si = 0; _si < seedFiles.length; _si++) {
    const filename = seedFiles[_si];
    const srcPath = path.join(patchSeedsDir, filename);
    const destPath = path.join(SEEDS_DIR, filename);
    if (fs.existsSync(srcPath)) {
      const seedContent = fs.readFileSync(srcPath, 'utf-8');
      fs.writeFileSync(destPath, seedContent, 'utf-8');
      ok(`10. Seed written → seeds/${filename} (${seedContent.length} bytes)`);
    } else {
      warn(`10. Seed source not found: ${srcPath}`);
    }
  }

  // ─── STEP 11: UPDATE start-vllm.sh ───────────────────────────────
  const vllmScript = `#!/bin/bash
# start-vllm.sh — Stone AI vLLM launcher for The Palace
# Generated by patch-palace.js

MODEL_PATH="/mnt/c/models/qwen3-32b-awq"
PORT=8000

echo "Starting vLLM with \${MODEL_PATH}..."
echo "Port: \${PORT} | Max model len: 32768"

export VLLM_FLASH_ATTN_VERSION=2

/home/vllm-env/bin/python -m vllm.entrypoints.openai.api_server \\
  --model "\${MODEL_PATH}" \\
  --port \${PORT} \\
  --quantization awq_marlin \\
  --max-model-len 32768 \\
  --dtype auto \\
  --trust-remote-code \\
  --gpu-memory-utilization 0.92 \\
  --enforce-eager
`;

  try {
    // Write via WSL so it has proper Unix line endings and lives in the right place
    const escapedScript = vllmScript.replace(/'/g, "'\\''");
    execSync(`wsl bash -c 'echo '"'"'${vllmScript.replace(/'/g, "'\\''")}'"'"' > /home/start-vllm.sh && chmod +x /home/start-vllm.sh'`, { stdio: 'pipe' });
    ok('11. start-vllm.sh written to /home/start-vllm.sh via WSL');
  } catch (e) {
    // Fallback: write it as a Windows file and note it needs to be copied
    try {
      // Try a simpler WSL approach
      const scriptB64 = Buffer.from(vllmScript).toString('base64');
      execSync(`wsl bash -c "echo '${scriptB64}' | base64 -d > /home/start-vllm.sh && chmod +x /home/start-vllm.sh"`, { stdio: 'pipe' });
      ok('11. start-vllm.sh written to /home/start-vllm.sh via WSL (base64)');
    } catch (e2) {
      // Last resort: write locally
      const localVllm = path.join(PALACE_DIR, 'start-vllm.sh');
      fs.writeFileSync(localVllm, vllmScript.replace(/\r\n/g, '\n'), 'utf-8');
      warn('11. WSL not available — start-vllm.sh written to palace dir. Copy to /home/ in WSL manually.');
    }
  }

  // ─── STEP 12: CREATE AUTO-START BAT ──────────────────────────────
  const startupBat = `@echo off
REM palace-startup.bat — Auto-start Palace on boot
REM Generated by patch-palace.js

echo Starting vLLM in WSL...
start "" wsl bash -c "tmux new-session -d -s vllm 'bash /home/start-vllm.sh'"

echo Waiting 15 seconds for vLLM to initialize...
timeout /t 15 /nobreak >nul

echo Starting Palace...
start "" wt -d "C:\\Users\\admin\\palace" node palace.mjs

echo Palace is live.
`;

  fs.writeFileSync(STARTUP_BAT, startupBat, 'utf-8');
  ok('12a. palace-startup.bat written');

  // Copy to Windows Startup folder
  try {
    if (fs.existsSync(STARTUP_FOLDER)) {
      const startupDest = path.join(STARTUP_FOLDER, 'palace-startup.bat');
      fs.copyFileSync(STARTUP_BAT, startupDest);
      ok(`12b. Copied to Startup folder → ${startupDest}`);
    } else {
      warn(`12b. Startup folder not found at ${STARTUP_FOLDER}`);
    }
  } catch (e) {
    warn(`12b. Could not copy to Startup folder: ${e.message}`);
  }

  // ─── STEPS 13-18: MULTIMEDIA COMMANDS (UNIFIED BLOCK) ──────────
  // ALL slash commands injected as ONE block using _palaceCmd flag pattern.
  // NO `continue` statements — works regardless of loop context.
  // NO `else if` chaining between separate injections — single block.
  // The _palaceCmd flag lets us skip the name routing + chat() call below.
  // GS-5: Idempotent — checks for single marker. GS-1: Brace-balanced.
  // FIX F: Vision model = Qwen2.5-VL-7B-AWQ on port 8001 (not qwen3-32b-awq).

  const multimediaBlock = `
    // ─── MULTIMEDIA COMMANDS (patched by patch-palace.js v2) ─────────
    let _palaceCmd = false;

    // /mic or /voice — Speech-to-text
    if (trimmed === '/mic' || trimmed === '/voice') {
      _palaceCmd = true;
      const { execSync: _exec } = await import('child_process');
      process.stdout.write('\\n\uD83C\uDFA4 Listening... (speak now)\\n');
      try {
        const transcript = _exec('powershell -File "C:\\\\Users\\\\admin\\\\palace\\\\scripts\\\\listen.ps1"', { encoding: 'utf-8', timeout: 30000 }).trim();
        if (transcript) {
          process.stdout.write('Heard: ' + transcript + '\\n\\n');
          await chat(transcript, currentHeads, convo);
        } else {
          process.stdout.write('No speech detected.\\n');
        }
      } catch (_e) {
        process.stdout.write('Voice capture failed: ' + _e.message + '\\n');
      }
    }

    // /image or /pic — Analyze image via vision model
    if (!_palaceCmd && (trimmed.startsWith('/image ') || trimmed.startsWith('/pic '))) {
      _palaceCmd = true;
      const _imgParts = trimmed.replace(/^\\/(?:image|pic)\\s+/, '').trim();
      const _imgPathMatch = _imgParts.match(/^"([^"]+)"|^(\\S+)/);
      const _imgPath = _imgPathMatch ? (_imgPathMatch[1] || _imgPathMatch[2]) : null;
      const _imgPrompt = _imgParts.slice((_imgPathMatch ? _imgPathMatch[0].length : 0)).trim() || 'Describe this image in detail.';

      if (_imgPath) {
        try {
          const _fs = await import('fs');
          const _imgBuf = _fs.default.readFileSync(_imgPath);
          const _imgB64 = _imgBuf.toString('base64');
          const _ext = _imgPath.split('.').pop().toLowerCase();
          const _mime = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp' }[_ext] || 'image/png';

          process.stdout.write('\\n\uD83D\uDDBC\uFE0F  Analyzing image...\\n\\n');
          const _vResp = await fetch('http://localhost:8001/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'Qwen2.5-VL-7B-AWQ',
              messages: [{ role: 'user', content: [
                { type: 'image_url', image_url: { url: 'data:' + _mime + ';base64,' + _imgB64 } },
                { type: 'text', text: _imgPrompt }
              ]}],
              max_tokens: 2048
            })
          });
          const _vData = await _vResp.json();
          const _vText = _vData.choices?.[0]?.message?.content || 'No response from vision model.';
          process.stdout.write(_vText + '\\n');
        } catch (_e) {
          process.stdout.write('Image analysis failed: ' + _e.message + '\\n');
        }
      } else {
        process.stdout.write('Usage: /image <path> [prompt]\\n');
      }
    }

    // /screen — Capture screen and analyze
    if (!_palaceCmd && trimmed === '/screen') {
      _palaceCmd = true;
      const { execSync: _execS } = await import('child_process');
      process.stdout.write('\\n\uD83D\uDCF8 Capturing screen...\\n\\n');
      try {
        const _ssPath = _execS('powershell -File "C:\\\\Users\\\\admin\\\\palace\\\\scripts\\\\screenshot.ps1"', { encoding: 'utf-8', timeout: 15000 }).trim();
        const _fsS = await import('fs');
        const _ssBuf = _fsS.default.readFileSync(_ssPath);
        const _ssB64 = _ssBuf.toString('base64');

        const _ssResp = await fetch('http://localhost:8001/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'Qwen2.5-VL-7B-AWQ',
            messages: [{ role: 'user', content: [
              { type: 'image_url', image_url: { url: 'data:image/png;base64,' + _ssB64 } },
              { type: 'text', text: 'Describe what you see on this screen capture.' }
            ]}],
            max_tokens: 2048
          })
        });
        const _ssData = await _ssResp.json();
        const _ssText = _ssData.choices?.[0]?.message?.content || 'No response from vision model.';
        process.stdout.write(_ssText + '\\n');
      } catch (_e) {
        process.stdout.write('Screen capture failed: ' + _e.message + '\\n');
      }
    }

    // /clip — Clipboard image analysis
    if (!_palaceCmd && trimmed === '/clip') {
      _palaceCmd = true;
      const { execSync: _execC } = await import('child_process');
      process.stdout.write('\\n\uD83D\uDCCB Getting clipboard image...\\n\\n');
      try {
        const _cbPath = _execC('powershell -File "C:\\\\Users\\\\admin\\\\palace\\\\scripts\\\\clipboard.ps1"', { encoding: 'utf-8', timeout: 15000 }).trim();
        const _fsC = await import('fs');
        const _cbBuf = _fsC.default.readFileSync(_cbPath);
        const _cbB64 = _cbBuf.toString('base64');

        const _cbResp = await fetch('http://localhost:8001/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'Qwen2.5-VL-7B-AWQ',
            messages: [{ role: 'user', content: [
              { type: 'image_url', image_url: { url: 'data:image/png;base64,' + _cbB64 } },
              { type: 'text', text: 'Describe what you see in this clipboard image.' }
            ]}],
            max_tokens: 2048
          })
        });
        const _cbData = await _cbResp.json();
        const _cbText = _cbData.choices?.[0]?.message?.content || 'No response from vision model.';
        process.stdout.write(_cbText + '\\n');
      } catch (_e) {
        process.stdout.write('Clipboard image failed: ' + _e.message + '\\n');
      }
    }

    // /doc — Read and analyze document
    if (!_palaceCmd && trimmed.startsWith('/doc ')) {
      _palaceCmd = true;
      const _docParts = trimmed.replace(/^\\/doc\\s+/, '').trim();
      const _docPathMatch = _docParts.match(/^"([^"]+)"|^(\\S+)/);
      const _docPath = _docPathMatch ? (_docPathMatch[1] || _docPathMatch[2]) : null;

      if (_docPath) {
        try {
          const _fsD = await import('fs');
          const _pathD = await import('path');
          const _ext = _pathD.default.extname(_docPath).toLowerCase();
          let _docText = '';

          _docText = _fsD.default.readFileSync(_docPath, 'utf-8');
          if (_ext === '.pdf') {
            process.stdout.write('Note: PDF text extraction is basic (raw read). Complex PDFs may not render cleanly.\\n');
          }

          if (_docText && _docText.length > 0) {
            if (_docText.length > 8000) {
              _docText = _docText.slice(0, 8000) + '\\n[... truncated at 8000 chars ...]';
            }
            process.stdout.write('\\n\uD83D\uDCC4 Reading document (' + _docText.length + ' chars)...\\n\\n');
            await chat('Here is a document I want you to analyze:\\n\\n' + _docText, currentHeads, convo);
          } else {
            process.stdout.write('Document is empty or could not be read.\\n');
          }
        } catch (_e) {
          process.stdout.write('Document read failed: ' + _e.message + '\\n');
        }
      } else {
        process.stdout.write('Usage: /doc <path>\\n');
      }
    }

    // /video — Extract frame and analyze via vision model
    if (!_palaceCmd && trimmed.startsWith('/video ')) {
      _palaceCmd = true;
      const _vidParts = trimmed.replace(/^\\/video\\s+/, '').trim();
      const _vidPathMatch = _vidParts.match(/^"([^"]+)"|^(\\S+)/);
      const _vidPath = _vidPathMatch ? (_vidPathMatch[1] || _vidPathMatch[2]) : null;

      if (_vidPath) {
        try {
          const { execSync: _execV } = await import('child_process');
          const _fsV = await import('fs');
          const _framePath = 'C:\\\\Users\\\\admin\\\\palace\\\\temp\\\\video_frame.png';

          _fsV.default.mkdirSync('C:\\\\Users\\\\admin\\\\palace\\\\temp', { recursive: true });

          process.stdout.write('\\n\uD83C\uDFAC Extracting frame from video...\\n\\n');
          _execV('ffmpeg -ss 5 -i "' + _vidPath + '" -frames:v 1 -y ' + _framePath, { timeout: 30000 });

          const _vidBuf = _fsV.default.readFileSync(_framePath);
          const _vidB64 = _vidBuf.toString('base64');

          const _vidResp = await fetch('http://localhost:8001/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'Qwen2.5-VL-7B-AWQ',
              messages: [{ role: 'user', content: [
                { type: 'image_url', image_url: { url: 'data:image/png;base64,' + _vidB64 } },
                { type: 'text', text: 'Describe what you see in this video frame.' }
              ]}],
              max_tokens: 2048
            })
          });
          const _vidData = await _vidResp.json();
          const _vidText = _vidData.choices?.[0]?.message?.content || 'No response from vision model.';
          process.stdout.write(_vidText + '\\n');
        } catch (_e) {
          process.stdout.write('Video analysis failed: ' + _e.message + '\\n');
        }
      } else {
        process.stdout.write('Usage: /video <path>\\n');
      }
    }
    // /info or /company — Stone AI company reference
    if (!_palaceCmd && (trimmed === '/info' || trimmed === '/company')) {
      _palaceCmd = true;
      process.stdout.write('\\n');
      process.stdout.write('\\x1b[1;36m' + '='.repeat(60) + '\\x1b[0m\\n');
      process.stdout.write('\\x1b[1;36m  STONE AI — Company Reference\\x1b[0m\\n');
      process.stdout.write('\\x1b[1;36m' + '='.repeat(60) + '\\x1b[0m\\n\\n');

      process.stdout.write('\\x1b[1;33m  INFRASTRUCTURE\\x1b[0m\\n');
      process.stdout.write('  Production .... stone-ai.net (Vercel + Cloudflare)\\n');
      process.stdout.write('  Fallback ...... stone-ai-sooty.vercel.app\\n');
      process.stdout.write('  GitHub ........ stonefreight2017-source/Stone-AI\\n');
      process.stdout.write('  Database ...... Neon (PostgreSQL 16 + pgvector)\\n');
      process.stdout.write('  Auth .......... Clerk (dev mode)\\n');
      process.stdout.write('  Payments ...... Stripe (test mode)\\n');
      process.stdout.write('  Docker ........ stoneai-db (:5432)\\n');
      process.stdout.write('  Redis ......... :6379\\n');
      process.stdout.write('  Domain ........ stone-ai.net (Cloudflare DNS, proxy ON, SSL Full)\\n\\n');

      process.stdout.write('\\x1b[1;33m  AI MODELS\\x1b[0m\\n');
      process.stdout.write('  Local AI ...... vLLM + Qwen 2.5 32B AWQ (OMEN:8000)\\n');
      process.stdout.write('  Vision AI ..... Qwen2.5-VL-7B-AWQ (OMEN:8001)\\n');
      process.stdout.write('  Cloud AI ...... Anthropic Claude Sonnet (smart), Haiku (fallback)\\n\\n');

      process.stdout.write('\\x1b[1;33m  TECH STACK\\x1b[0m\\n');
      process.stdout.write('  Next.js, TypeScript, Tailwind, shadcn/ui, Prisma, PostgreSQL\\n\\n');

      process.stdout.write('\\x1b[1;33m  BUSINESSES\\x1b[0m\\n');
      process.stdout.write('  Stone AI ...... live (stone-ai.net)\\n');
      process.stdout.write('  Best AI ....... mobile app (in development)\\n');
      process.stdout.write('  Stone AI Tools  tools.stone-ai.net\\n\\n');

      process.stdout.write('\\x1b[1;33m  PRICING TIERS\\x1b[0m\\n');
      process.stdout.write('  FREE .......... $0\\n');
      process.stdout.write('  STARTER ....... $19.99/mo\\n');
      process.stdout.write('  PLUS .......... $49.99/mo\\n');
      process.stdout.write('  SMART ......... $99.99/mo (annual $79.99)\\n');
      process.stdout.write('  PRO ........... $200/mo (annual $170)\\n\\n');

      process.stdout.write('\\x1b[1;33m  AGENTS & COMMS\\x1b[0m\\n');
      process.stdout.write('  Agents ........ 44 total (42 user-facing + Stone internal + Chaos founder-only)\\n');
      process.stdout.write('  Email ......... 3headedm@gmail.com\\n\\n');

      process.stdout.write('\\x1b[1;33m  CREDENTIALS\\x1b[0m\\n');
      process.stdout.write('  Location ...... C:\\\\Users\\\\admin\\\\Desktop\\\\STONE_AI_CREDENTIALS_AND_INFO.txt\\n\\n');
      process.stdout.write('\\x1b[1;36m' + '='.repeat(60) + '\\x1b[0m\\n');
    }

    // /agents — List all 44 Stone AI agents grouped by tier (patched by patch-palace.js — agents-v2)
    if (!_palaceCmd && trimmed === '/agents') {
      _palaceCmd = true;
      process.stdout.write('\\n');
      process.stdout.write('\\x1b[1;36m' + '='.repeat(64) + '\\x1b[0m\\n');
      process.stdout.write('\\x1b[1;36m  STONE AI — ALL 44 AGENTS + ROYAL GUARD\\x1b[0m\\n');
      process.stdout.write('\\x1b[1;36m' + '='.repeat(64) + '\\x1b[0m\\n\\n');
      process.stdout.write('\\x1b[1;32m  FREE ($0) — 4 agents:\\x1b[0m\\n');
      process.stdout.write('     1. Platform Onboarding Concierge\\n');
      process.stdout.write('     2. AI Bestie Companion\\n');
      process.stdout.write('     3. Health & Wellness Coach\\n');
      process.stdout.write('     4. Academic Tutor\\n\\n');
      process.stdout.write('\\x1b[1;33m  STARTER ($19.99) / PLUS ($49.99) — 13 agents:\\x1b[0m\\n');
      process.stdout.write('     5. Content Studio\\n');
      process.stdout.write('     6. Copywriting\\n');
      process.stdout.write('     7. Print on Demand\\n');
      process.stdout.write('     8. Brand Building\\n');
      process.stdout.write('     9. Niche Blog & Affiliate\\n');
      process.stdout.write('    10. Sales Agent\\n');
      process.stdout.write('    11. Resume & LinkedIn\\n');
      process.stdout.write('    12. Writing & Editing Coach\\n');
      process.stdout.write('    13. General Coding Assistant\\n');
      process.stdout.write('    14. Podcast Production\\n');
      process.stdout.write('    15. Personal Finance Advisor\\n');
      process.stdout.write('    16. Project Management Coach\\n');
      process.stdout.write('    17. Community & Education Platform\\n\\n');
      process.stdout.write('\\x1b[1;35m  SMART ($99.99) — 21 agents:\\x1b[0m\\n');
      process.stdout.write('    18. AI Automation Agency\\n');
      process.stdout.write('    19. Vertical AI SaaS\\n');
      process.stdout.write('    20. Dropshipping\\n');
      process.stdout.write('    21. Lead Generation\\n');
      process.stdout.write('    22. High Ticket Funnel\\n');
      process.stdout.write('    23. Research Synthesis\\n');
      process.stdout.write('    24. Website Development\\n');
      process.stdout.write('    25. Automation Scripts\\n');
      process.stdout.write('    26. Data Analytics\\n');
      process.stdout.write('    27. Trading Signals\\n');
      process.stdout.write('    28. Dispatch Agent\\n');
      process.stdout.write('    29. Claims Agent\\n');
      process.stdout.write('    30. Compliance Agent\\n');
      process.stdout.write('    31. E-Commerce Store Builder\\n');
      process.stdout.write('    32. Legal Basics\\n');
      process.stdout.write('    33. Real Estate Investment\\n');
      process.stdout.write('    34. Digital Marketing Strategist\\n');
      process.stdout.write('    35. Video Content Strategist\\n');
      process.stdout.write('    36. HR & People Ops\\n');
      process.stdout.write('    37. Translation & Localization\\n');
      process.stdout.write('    38. Executive Inbox Manager\\n\\n');
      process.stdout.write('\\x1b[1;31m  PRO ($200) — 4 agents:\\x1b[0m\\n');
      process.stdout.write('    39. Cybersecurity Consultant\\n');
      process.stdout.write('    40. Startup Launcher\\n');
      process.stdout.write('    41. Engineering Architect\\n');
      process.stdout.write('    42. Structural Support Engineer\\n\\n');
      process.stdout.write('\\x1b[1;37;40m  THE PALACE (Three-Headed Monster + Royal Guard):\\x1b[0m\\n');
      process.stdout.write('    H1. \\x1b[1;33mStone\\x1b[0m (Head 1 \\x1b[2m\\xe2\\x80\\x94 The Owner\\x1b[0m)\\n');
      process.stdout.write('    H2. \\x1b[1;35mCardinal\\x1b[0m (Head 2 \\x1b[2m\\xe2\\x80\\x94 The Architect\\x1b[0m)\\n');
      process.stdout.write('    H3. \\x1b[1;31mChaos\\x1b[0m (Head 3 \\x1b[2m\\xe2\\x80\\x94 The Vanguard\\x1b[0m)\\n');
      process.stdout.write('    RG. \\x1b[1;36mComputer Wiz\\x1b[0m (\\x1b[2mThe Royal Guard\\x1b[0m)\\n\\n');
      process.stdout.write('\\x1b[1;36m  Type an agent name to route: e.g. "cybersecurity help me"\\x1b[0m\\n');
      process.stdout.write('\\x1b[1;36m' + '='.repeat(64) + '\\x1b[0m\\n\\n');
    }

    // ─── AGENT SLUG ROUTING — route by agent name prefix ─────────
    // Loads full system prompts from agent-identities.json if available.
    // Falls back to slug-based routing. GS-5: idempotent — safe to run twice.
    if (!_palaceCmd && !nameRouteResult) {
      let _agentSlugMap = {};
      const _agentIdPath = 'C:\\\\Users\\\\admin\\\\palace\\\\seeds\\\\agent-identities.json';
      try {
        const _aiFs = await import('fs');
        if (_aiFs.default.existsSync(_agentIdPath)) {
          const _agents = JSON.parse(_aiFs.default.readFileSync(_agentIdPath, 'utf-8'));
          const _slugAliases = {
            'platform-onboarding': ['onboarding', 'getting started'],
            'bestie-companion-base': ['bestie', 'companion'],
            'health-wellness-coach': ['health', 'wellness', 'fitness'],
            'academic-tutor': ['tutor', 'homework', 'academic'],
            'content-studio': ['content'],
            'copywriting': ['copywriting', 'copy'],
            'print-on-demand': ['print', 'merch', 'print on demand'],
            'brand-building': ['brand'],
            'niche-blog-affiliate': ['blog', 'affiliate', 'niche blog'],
            'sales-agent': ['sales'],
            'resume-linkedin': ['resume', 'linkedin'],
            'writing-editing': ['writing', 'editor', 'writing coach'],
            'general-coding-assistant': ['coding', 'code', 'general coding', 'coding assistant'],
            'podcast-production': ['podcast'],
            'personal-finance-advisor': ['finance', 'money', 'personal finance'],
            'project-management-coach': ['project', 'pm', 'project management'],
            'community-education': ['community', 'education platform'],
            'ai-automation-agency': ['ai agency', 'ai automation'],
            'vertical-ai-saas': ['saas', 'vertical ai'],
            'dropshipping': ['dropship', 'dropshipping'],
            'lead-generation': ['lead gen', 'leads', 'lead generation'],
            'high-ticket-funnel': ['funnel', 'high ticket'],
            'research-synthesis': ['research'],
            'website-development': ['website', 'web dev'],
            'automation-scripts': ['automation', 'scripts'],
            'data-analytics': ['data', 'analytics', 'data analytics'],
            'trading-signals': ['trading', 'signals', 'stocks'],
            'dispatch-agent': ['dispatch'],
            'claims-agent': ['claims'],
            'compliance-agent': ['compliance'],
            'ecommerce-store-builder': ['ecommerce', 'store', 'shopify', 'e-commerce'],
            'legal-basics-reviewer': ['legal', 'lawyer', 'contract'],
            'real-estate-investing': ['real estate', 'property'],
            'digital-marketing-strategist': ['marketing', 'digital marketing'],
            'video-content-strategist': ['video'],
            'hr-people-operations': ['hr', 'hiring', 'people', 'people ops'],
            'translation-localization': ['translate', 'translation'],
            'executive-inbox-manager': ['inbox', 'email manager', 'executive inbox'],
            'cybersecurity': ['cyber', 'security', 'cybersecurity'],
            'startup-launcher': ['startup'],
            'engineering-architect': ['engineer', 'architecture', 'engineering architect'],
            'structural-engineer': ['structural']
          };
          for (let _ai = 0; _ai < _agents.length; _ai++) {
            const _a = _agents[_ai];
            const aliases = _slugAliases[_a.slug] || [_a.slug.replace(/-/g, ' ')];
            for (let _ali = 0; _ali < aliases.length; _ali++) {
              _agentSlugMap[aliases[_ali]] = _a.systemPrompt;
            }
          }
        }
      } catch (_loadErr) {
        /* fall through to empty map — no agent routing if file missing */
      }

      const _lower = trimmed.toLowerCase();
      let _matchedAgent = null;
      let _matchedKey = null;

      // Try multi-word matches first (longer keys first for greedy matching)
      const _sortedKeys = Object.keys(_agentSlugMap).sort((a, b) => b.length - a.length);
      for (let _ki = 0; _ki < _sortedKeys.length; _ki++) {
        const _k = _sortedKeys[_ki];
        if (_lower.startsWith(_k + ' ') || _lower === _k) {
          _matchedAgent = _agentSlugMap[_k];
          _matchedKey = _k;
          break;
        }
      }

      if (_matchedAgent) {
        _palaceCmd = true;
        const _agentPrompt = trimmed.slice(_matchedKey.length).trim() || 'How can you help me?';
        process.stdout.write('\\n\\x1b[1;36m[Routing to: ' + _matchedKey.charAt(0).toUpperCase() + _matchedKey.slice(1) + ']\\x1b[0m\\n\\n');
        // Send to vLLM with the agent specialty injected as system context
        try {
          const _aResp = await fetch('http://localhost:8000/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'qwen3-32b-awq',
              messages: [
                { role: 'system', content: _matchedAgent + ' Do NOT output XML tags, think tags, or tool tags. Respond naturally and directly.' },
                { role: 'user', content: _agentPrompt }
              ],
              max_tokens: 4096,
              stream: true
            })
          });

          const _aReader = _aResp.body.getReader();
          const _aDecoder = new TextDecoder();
          let _aDone = false;
          let _aInThink = false;
          let _aBuf = '';
          while (!_aDone) {
            const { value: _aChunk, done: _aChunkDone } = await _aReader.read();
            _aDone = _aChunkDone;
            if (_aChunk) {
              const _aText = _aDecoder.decode(_aChunk, { stream: true });
              const _aLines = _aText.split('\\n');
              for (let _li = 0; _li < _aLines.length; _li++) {
                const _aLine = _aLines[_li].trim();
                if (!_aLine.startsWith('data: ') || _aLine === 'data: [DONE]') { /* skip */ }
                else {
                  try {
                    const _aJson = JSON.parse(_aLine.slice(6));
                    const _aToken = _aJson.choices?.[0]?.delta?.content || '';
                    if (_aToken) {
                      const _combined = _aBuf + _aToken;
                      if (_aInThink) {
                        const _endIdx = _combined.indexOf('</think>');
                        if (_endIdx !== -1) {
                          _aInThink = false;
                          _aBuf = '';
                          const _after = _combined.slice(_endIdx + 8);
                          if (_after) process.stdout.write(_after);
                        } else {
                          _aBuf = _combined.slice(-16);
                        }
                      } else {
                        const _startIdx = _combined.indexOf('<think>');
                        if (_startIdx !== -1) {
                          _aInThink = true;
                          const _before = _combined.slice(0, _startIdx);
                          _aBuf = _combined.slice(_startIdx);
                          if (_before) process.stdout.write(_before);
                        } else {
                          _aBuf = '';
                          process.stdout.write(_aToken.replace(/<\\/?(?:think|thinking)>/gi, ''));
                        }
                      }
                    }
                  } catch (_pe) { /* skip parse errors */ }
                }
              }
            }
          }
          process.stdout.write('\\n');
        } catch (_aErr) {
          process.stdout.write('Agent routing failed: ' + _aErr.message + '\\n');
        }
      }
    }
    // /home — Business dashboard (auto-displays on boot)
    if (!_palaceCmd && trimmed === '/home') {
      _palaceCmd = true;
      if (typeof global._palaceHome === 'function') {
        global._palaceHome();
      }
    }
    // ─── END MULTIMEDIA COMMANDS ─────────────────────────────────────
`;

  if (src.includes('MULTIMEDIA COMMANDS (patched by patch-palace.js v2)')) {
    ok('13-18. Multimedia commands already present (skipping)');
  } else {
    // Clean up any old individual command blocks from v1 before injecting unified block
    const oldMarkers = [
      'VOICE INPUT (patched by patch-palace.js)',
      'IMAGE INPUT (patched by patch-palace.js)',
      'SCREEN CAPTURE (patched by patch-palace.js)',
      'CLIPBOARD IMAGE (patched by patch-palace.js)',
      'DOCUMENT INPUT (patched by patch-palace.js)',
      'VIDEO INPUT (patched by patch-palace.js)',
    ];
    for (const marker of oldMarkers) {
      if (src.includes(marker)) {
        warn('13-18. Found old v1 command block (' + marker.split('(')[0].trim() + ') — will need manual cleanup on OMEN');
      }
    }

    // GS-8 FIX: SINGLE-POINT INJECTION — multimedia block + guard in ONE replacement.
    // The old approach injected the multimedia block at one point and the _palaceCmd guard
    // at another point. If those points were in different scopes, _palaceCmd was undefined
    // at the guard (ReferenceError). The fix: REPLACE the `await chat(trimmed, ...)` call
    // with the multimedia block + guarded chat call as ONE contiguous block. This guarantees
    // _palaceCmd is declared and read in the SAME lexical scope.

    const chatCallExact = 'await chat(trimmed, currentHeads, convo)';
    let mmInjected = false;

    if (src.includes(chatCallExact)) {
      // Find the LAST occurrence — that's the regular message handler
      const lastChatIdx = src.lastIndexOf(chatCallExact);

      // Check if already guarded (idempotency)
      const contextBefore = src.slice(Math.max(0, lastChatIdx - 60), lastChatIdx);
      if (!contextBefore.includes('_palaceCmd')) {
        // Replace the chat call with: multimedia block + guarded chat call
        // ALL IN ONE replacement — same scope guaranteed
        const replacement = multimediaBlock + '\n    if (!_palaceCmd) { ' + chatCallExact + '; }';
        src = src.slice(0, lastChatIdx)
          + replacement
          + src.slice(lastChatIdx + chatCallExact.length);
        mmInjected = true;
        ok('13-18. Multimedia block + _palaceCmd guard injected as SINGLE block (same-scope guaranteed)');
      } else {
        ok('13-18. Chat call already guarded by _palaceCmd (skipping)');
        mmInjected = true;
      }
    }

    if (!mmInjected) {
      warn('13-18. Multimedia commands — could not find "await chat(trimmed, currentHeads, convo)" injection point');
    }
  }

  // ─── STEP 20: STATUS ENGINE CLASS INJECTION (Cardinal Design, Chaos Integration) ──
  // Injects the StatusEngine class near the top of palace.mjs.
  // Claude Code-style display: 3 lines per agent, braille spinner, ANSI in-place updates.
  // Single-head mode passes through normally. Panel only for multi-head (/all, two names).
  // Also injects extractActivityHint helper for pulling status cues from streaming tokens.
  // GS-5: Idempotent — checks marker. GS-1: Brace-balanced (verified: 10 open, 10 close).

  const statusEngineClass = `
// ─── STATUS ENGINE (patched by patch-palace.js — Cardinal Design, Chaos Integration) ──
// Claude Code-style display: 3 lines per agent, braille spinner, ANSI in-place.
// Single-head = clean passthrough. Multi-head = stacked status panel.
(function() {
  const _HIDE_CURSOR    = '\\x1b[?25l';
  const _SHOW_CURSOR    = '\\x1b[?25h';
  const _CLEAR_LINE     = '\\x1b[2K';
  const _CURSOR_TO_COL1 = '\\r';
  const _MOVE_UP        = (n) => '\\x1b[' + n + 'A';
  const _SPIN = ['\\u280b','\\u2819','\\u2839','\\u2838','\\u283c','\\u2834','\\u2826','\\u2827','\\u2807','\\u280f'];

  class StatusEngine {
    constructor() {
      this.agents = [];
      this.timer = null;
      this.totalLines = 0;
      this.started = false;
      this.finished = false;
    }

    addAgent(name, headerText) {
      this.agents.push({
        name: name,
        header: headerText,
        detail: '',
        tools: 0,
        tokens: 0,
        done: false,
        summary: '',
        spinIdx: 0
      });
    }

    start() {
      if (this.started) return;
      this.started = true;
      const n = this.agents.length;
      this.totalLines = (n * 3) + Math.max(0, n - 1);
      process.stdout.write(_HIDE_CURSOR);
      for (let i = 0; i < this.totalLines; i++) {
        process.stdout.write('\\n');
      }
      process.stdout.write(_MOVE_UP(this.totalLines));
      this._render();
      const self = this;
      this.timer = setInterval(function() {
        for (let ai = 0; ai < self.agents.length; ai++) {
          if (!self.agents[ai].done) {
            self.agents[ai].spinIdx = (self.agents[ai].spinIdx + 1) % _SPIN.length;
          }
        }
        self._render();
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
      let allDone = true;
      for (let ai = 0; ai < this.agents.length; ai++) {
        if (!this.agents[ai].done) { allDone = false; break; }
      }
      if (allDone) this.finish();
    }

    finish() {
      if (this.finished) return;
      this.finished = true;
      if (this.timer) { clearInterval(this.timer); this.timer = null; }
      this._render();
      for (let i = 0; i < this.totalLines; i++) {
        process.stdout.write('\\n');
      }
      process.stdout.write(_SHOW_CURSOR);
    }

    _find(name) {
      for (let ai = 0; ai < this.agents.length; ai++) {
        if (this.agents[ai].name === name) return this.agents[ai];
      }
      return null;
    }

    _render() {
      const cols = process.stdout.columns || 80;
      const lines = [];
      for (let i = 0; i < this.agents.length; i++) {
        const a = this.agents[i];
        lines.push(this._trunc(a.header, cols));
        const icon = a.done ? '\\u2713' : _SPIN[a.spinIdx];
        const toolStr = a.tools > 0 ? a.tools + ' tools used \\u00b7 ' : '';
        const tokStr = this._fmtTokens(a.tokens);
        lines.push(this._trunc('  ' + icon + ' ' + toolStr + tokStr + ' tokens', cols));
        const detailText = a.done ? a.summary : a.detail;
        lines.push(this._trunc(detailText ? '  ' + detailText : '', cols));
        if (i < this.agents.length - 1) lines.push('');
      }
      let buf = '';
      for (let i = 0; i < lines.length; i++) {
        buf += _CURSOR_TO_COL1 + _CLEAR_LINE + lines[i];
        if (i < lines.length - 1) buf += '\\n';
      }
      process.stdout.write(buf);
      if (lines.length > 1) process.stdout.write(_MOVE_UP(lines.length - 1));
      process.stdout.write(_CURSOR_TO_COL1);
    }

    _trunc(text, maxCols) {
      if (!text) return '';
      return text.length > maxCols ? text.slice(0, maxCols - 1) : text;
    }

    _fmtTokens(n) {
      if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
      return String(n);
    }
  }

  global._PalaceStatusEngine = StatusEngine;
})();

// ─── ACTIVITY HINT EXTRACTOR (patched by patch-palace.js — Cardinal Design) ──
function _extractActivityHint(buffer, lastHint) {
  const fileMatch = buffer.match(/[\\w\\-\\/]+\\.\\w{1,5}/);
  if (fileMatch) return 'Processing ' + fileMatch[0];
  const actMatch = buffer.match(
    /\\b(analyzing|reading|writing|checking|building|reviewing|comparing)\\b/i
  );
  if (actMatch) return actMatch[1][0].toUpperCase() + actMatch[1].slice(1) + '...';
  return lastHint;
}
`;

  if (src.includes('STATUS ENGINE (patched by patch-palace.js')) {
    ok('20. StatusEngine already present (skipping)');
  } else {
    // Remove old StatusPanel if present (upgrade path)
    if (src.includes('STATUS PANEL (patched by patch-palace.js')) {
      const oldPanelStart = src.indexOf('// ─── STATUS PANEL (patched by patch-palace.js');
      const oldPanelEnd = src.indexOf('})();', oldPanelStart);
      if (oldPanelStart !== -1 && oldPanelEnd !== -1) {
        src = src.slice(0, oldPanelStart) + src.slice(oldPanelEnd + 5);
        ok('20a. Removed old StatusPanel (upgrading to StatusEngine)');
      }
    }

    // Inject after the FINAL OUTPUT SANITIZER or stripXmlTags
    const sanitizerMarker = 'FINAL OUTPUT SANITIZER (patched by patch-palace.js)';
    const stripXmlMarker = 'function stripXmlTags';
    let engineInjected = false;

    if (src.includes(sanitizerMarker)) {
      const sanitizerIdx = src.indexOf(sanitizerMarker);
      const afterSanitizer = src.indexOf('})();', sanitizerIdx);
      if (afterSanitizer !== -1) {
        const insertAt = afterSanitizer + 5;
        src = src.slice(0, insertAt) + '\n' + statusEngineClass + src.slice(insertAt);
        engineInjected = true;
      }
    } else if (src.includes(stripXmlMarker)) {
      const stripIdx = src.indexOf(stripXmlMarker);
      const afterStrip = src.indexOf('\n}', stripIdx);
      if (afterStrip !== -1) {
        src = src.slice(0, afterStrip + 2) + '\n' + statusEngineClass + src.slice(afterStrip + 2);
        engineInjected = true;
      }
    }

    if (!engineInjected) {
      const funcIdx = src.indexOf('function c(');
      if (funcIdx !== -1) {
        src = src.slice(0, funcIdx) + statusEngineClass + '\n' + src.slice(funcIdx);
        engineInjected = true;
      }
    }

    if (engineInjected) {
      ok('20. StatusEngine class + extractActivityHint injected (global._PalaceStatusEngine)');
    } else {
      warn('20. StatusEngine — could not find injection point');
    }
  }

  // ─── STEP 21: STATUS ENGINE HOOKS — MULTI-HEAD CHAT LOOP WRAPPING ──
  // Wraps the guarded chat call so multi-head requests use the StatusEngine
  // with buffered output + spinner display. Single-head passes through cleanly.
  // After all heads complete, prints compact summaries. /expand shows full output.
  // GS-5: Idempotent — checks marker. GS-1: Brace-balanced (verified: 14 open, 14 close).
  // GS-8: Same scope — _palaceCmd, trimmed, currentHeads all in scope.

  const engineHookCode = `
    // ─── STATUS ENGINE HOOKS (patched by patch-palace.js — Cardinal Design, Chaos Integration) ──
    // Multi-head: StatusEngine panel with buffered output. Single-head: clean passthrough.
    if (currentHeads.length > 1 && global._PalaceStatusEngine) {
      const _engine = new global._PalaceStatusEngine();
      global._palaceOutputs = {};
      for (let _hi = 0; _hi < currentHeads.length; _hi++) {
        _engine.addAgent(currentHeads[_hi], currentHeads[_hi] + ' thinking...');
        global._palaceOutputs[currentHeads[_hi]] = '';
      }
      _engine.start();

      for (let _hi = 0; _hi < currentHeads.length; _hi++) {
        const _headName = currentHeads[_hi];
        _engine.updateHeader(_headName, _headName + ' responding...');
        let _lastHint = '';

        // Call chat with a single-head array, capturing output via global
        const _origWrite = process.stdout.write;
        let _headBuf = '';
        process.stdout.write = function(chunk) {
          if (typeof chunk === 'string') {
            _headBuf += chunk;
            global._palaceOutputs[_headName] = (_palaceOutputs[_headName] || '') + chunk;
            _lastHint = _extractActivityHint(chunk, _lastHint);
            _engine.update(_headName, {
              tokensDelta: chunk.length,
              detail: _lastHint
            });
          }
          return true;
        };

        try {
          await chat(trimmed, [_headName], convo);
        } finally {
          process.stdout.write = _origWrite;
        }

        const _outLines = (_headBuf || '').split('\\n').filter(function(l) { return l.trim(); });
        const _summary = (_outLines[0] || 'Done').replace(/[#*_\`]/g, '').trim().slice(0, 60);
        _engine.complete(_headName, _summary);
      }

      // Print compact summaries after panel closes
      console.log('');
      for (let _hi = 0; _hi < currentHeads.length; _hi++) {
        const _hName = currentHeads[_hi];
        const _hOut = global._palaceOutputs[_hName] || '';
        const _hLines = _hOut.split('\\n').filter(function(l) { return l.trim(); }).slice(0, 5);
        console.log(_hName + ':');
        for (let _li = 0; _li < _hLines.length; _li++) {
          console.log('  ' + _hLines[_li].trim());
        }
        console.log('');
      }
    } else {
      // Single-head: clean passthrough, no panel
      await chat(trimmed, currentHeads, convo);
    }
`;

  if (src.includes('STATUS ENGINE HOOKS (patched by patch-palace.js')) {
    ok('21. StatusEngine hooks already present (skipping)');
  } else {
    // Remove old STATUS PANEL HOOKS if present
    if (src.includes('STATUS PANEL HOOKS (patched by patch-palace.js')) {
      // Old hooks wrapped the guarded chat call — we need to find and remove them
      const oldHookStart = src.indexOf('// ─── STATUS PANEL HOOKS (patched by patch-palace.js');
      if (oldHookStart !== -1) {
        // Find the block boundaries — it's inline, replace the whole guarded section
        // The old code wrapped: panelHookCode + guardedChat + panelDoneCode
        // We'll find and replace the entire wrapped block
        const oldHookBlockEnd = src.indexOf('global._palacePanel.render(); }', oldHookStart);
        if (oldHookBlockEnd !== -1) {
          const blockEnd = oldHookBlockEnd + 'global._palacePanel.render(); }'.length;
          src = src.slice(0, oldHookStart) + 'if (!_palaceCmd) { await chat(trimmed, currentHeads, convo); }' + src.slice(blockEnd);
          ok('21a. Removed old StatusPanel hooks (upgrading to StatusEngine hooks)');
        }
      }
    }

    // Replace the guarded chat call with the engine hook code
    const guardedChat = 'if (!_palaceCmd) { await chat(trimmed, currentHeads, convo); }';
    if (src.includes(guardedChat)) {
      src = src.replace(guardedChat, 'if (!_palaceCmd) {\n' + engineHookCode + '\n    }');
      ok('21. StatusEngine hooks injected — multi-head panel + single-head passthrough');
    } else {
      warn('21. StatusEngine hooks — could not find guarded chat call');
    }
  }

  // ─── STEP 22: DRAG-AND-DROP FILE DETECTION ─────────────────────
  // When user drags a file into Windows Terminal, it pastes the path.
  // Detect paths (drive letter, UNC, or quoted paths) and auto-process
  // based on file extension. Injected into the multimedia block.
  // GS-5: Idempotent. GS-1: Brace-balanced. GS-9: Unified block.

  const dragDropCode = `
    // ─── DRAG-AND-DROP FILE DETECTION (patched by patch-palace.js — D19 Build 2) ───
    // Detect dragged file paths (Windows Terminal pastes the path on drag)
    if (!_palaceCmd) {
      const _ddTrimmed = trimmed.replace(/^["']|["']$/g, '').trim();
      const _isDrivePath = /^[A-Za-z]:\\\\/.test(_ddTrimmed) || /^[A-Za-z]:\\//.test(_ddTrimmed);
      const _isUNC = _ddTrimmed.startsWith('\\\\\\\\');
      if ((_isDrivePath || _isUNC) && _ddTrimmed.indexOf(' ') === -1 || /^"[^"]+"$/.test(trimmed)) {
        const _ddPath = _ddTrimmed;
        const _ddExt = _ddPath.split('.').pop().toLowerCase();
        const _imgExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'];
        const _docExts = ['txt', 'md', 'csv', 'json', 'pdf', 'log', 'xml', 'html', 'js', 'ts', 'py'];
        const _audioExts = ['mp3', 'wav', 'm4a', 'ogg', 'flac', 'wma'];
        const _videoExts = ['mp4', 'avi', 'mkv', 'mov', 'webm', 'wmv'];

        try {
          const _ddFs = await import('fs');
          if (_ddFs.default.existsSync(_ddPath)) {
            _palaceCmd = true;

            if (_imgExts.includes(_ddExt)) {
              // Image → send to vision model
              process.stdout.write('\\n\\x1b[1;36m[Auto-detected image: ' + _ddPath + ']\\x1b[0m\\n');
              const _ddBuf = _ddFs.default.readFileSync(_ddPath);
              const _ddB64 = _ddBuf.toString('base64');
              const _ddMime = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp' }[_ddExt] || 'image/png';
              process.stdout.write('\\x1b[2mAnalyzing with vision model...\\x1b[0m\\n\\n');
              const _ddResp = await fetch('http://localhost:8001/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  model: 'Qwen2.5-VL-7B-AWQ',
                  messages: [{ role: 'user', content: [
                    { type: 'image_url', image_url: { url: 'data:' + _ddMime + ';base64,' + _ddB64 } },
                    { type: 'text', text: 'Describe this image in detail.' }
                  ]}],
                  max_tokens: 2048
                })
              });
              const _ddData = await _ddResp.json();
              process.stdout.write((_ddData.choices?.[0]?.message?.content || 'No response from vision model.') + '\\n');

            } else if (_docExts.includes(_ddExt)) {
              // Document → read and send to text model
              process.stdout.write('\\n\\x1b[1;36m[Auto-detected document: ' + _ddPath + ']\\x1b[0m\\n');
              let _ddText = _ddFs.default.readFileSync(_ddPath, 'utf-8');
              if (_ddText.length > 8000) {
                _ddText = _ddText.slice(0, 8000) + '\\n[... truncated at 8000 chars ...]';
              }
              process.stdout.write('\\x1b[2mReading ' + _ddText.length + ' chars...\\x1b[0m\\n\\n');
              await chat('Here is a document I want you to analyze:\\n\\n' + _ddText, currentHeads, convo);

            } else if (_audioExts.includes(_ddExt)) {
              // Audio → transcribe with whisper, send text to model
              process.stdout.write('\\n\\x1b[1;36m[Auto-detected audio: ' + _ddPath + ']\\x1b[0m\\n');
              process.stdout.write('\\x1b[2mTranscribing with whisper...\\x1b[0m\\n\\n');
              try {
                const { execSync: _ddExec } = await import('child_process');
                const _ddTranscript = _ddExec('whisper "' + _ddPath.replace(/"/g, '\\\\"') + '" --model small --output_format txt --output_dir C:\\\\Users\\\\admin\\\\palace\\\\temp', { encoding: 'utf-8', timeout: 120000 }).trim();
                const _ddTxtPath = 'C:\\\\Users\\\\admin\\\\palace\\\\temp\\\\' + _ddPath.split('\\\\').pop().replace(/\\.[^.]+$/, '.txt');
                const _ddAudioText = _ddFs.default.existsSync(_ddTxtPath) ? _ddFs.default.readFileSync(_ddTxtPath, 'utf-8') : _ddTranscript;
                if (_ddAudioText) {
                  process.stdout.write('Transcript:\\n' + _ddAudioText + '\\n\\n');
                  await chat('Here is an audio transcript I want you to analyze:\\n\\n' + _ddAudioText, currentHeads, convo);
                } else {
                  process.stdout.write('No transcript generated.\\n');
                }
              } catch (_ddAudioErr) {
                process.stdout.write('Audio transcription failed: ' + _ddAudioErr.message + '\\nMake sure whisper is installed (pip install openai-whisper).\\n');
              }

            } else if (_videoExts.includes(_ddExt)) {
              // Video → extract frame + audio, analyze both
              process.stdout.write('\\n\\x1b[1;36m[Auto-detected video: ' + _ddPath + ']\\x1b[0m\\n');
              const { execSync: _ddExecV } = await import('child_process');
              const _ddFramePath = 'C:\\\\Users\\\\admin\\\\palace\\\\temp\\\\dd_frame.png';
              _ddFs.default.mkdirSync('C:\\\\Users\\\\admin\\\\palace\\\\temp', { recursive: true });

              // Extract frame at 5 seconds
              process.stdout.write('\\x1b[2mExtracting frame...\\x1b[0m\\n');
              try {
                _ddExecV('ffmpeg -ss 5 -i "' + _ddPath + '" -frames:v 1 -y ' + _ddFramePath, { timeout: 30000, stdio: 'pipe' });
                const _ddVBuf = _ddFs.default.readFileSync(_ddFramePath);
                const _ddVB64 = _ddVBuf.toString('base64');
                const _ddVResp = await fetch('http://localhost:8001/v1/chat/completions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    model: 'Qwen2.5-VL-7B-AWQ',
                    messages: [{ role: 'user', content: [
                      { type: 'image_url', image_url: { url: 'data:image/png;base64,' + _ddVB64 } },
                      { type: 'text', text: 'Describe what you see in this video frame.' }
                    ]}],
                    max_tokens: 2048
                  })
                });
                const _ddVData = await _ddVResp.json();
                process.stdout.write('\\n\\x1b[1;33mFrame analysis:\\x1b[0m\\n' + (_ddVData.choices?.[0]?.message?.content || 'No response.') + '\\n');
              } catch (_ddVErr) {
                process.stdout.write('Frame extraction failed: ' + _ddVErr.message + '\\n');
              }

            } else {
              process.stdout.write('\\n\\x1b[1;36m[Detected file: ' + _ddPath + ' (.' + _ddExt + ')]\\x1b[0m\\n');
              process.stdout.write('Unsupported file type. Supported: images, documents, audio, video.\\n');
              _palaceCmd = false;
            }
          }
        } catch (_ddErr) {
          // Not a valid file path or other error — fall through to normal handling
        }
      }
    }
    // ─── END DRAG-AND-DROP DETECTION ─────────────────────────────────
`;

  // Also build the /paste and /expand commands to add to the multimedia block
  const pasteCommand = `
    // /paste — Clipboard content (image or text) analysis
    if (!_palaceCmd && (trimmed === '/paste')) {
      _palaceCmd = true;
      const { execSync: _execPaste } = await import('child_process');
      process.stdout.write('\\n\\x1b[1;36mChecking clipboard...\\x1b[0m\\n');
      try {
        // First try image from clipboard
        const _pasteImgScript = 'Add-Type -Assembly System.Windows.Forms; $img = [System.Windows.Forms.Clipboard]::GetImage(); if ($img) { $p = \\"C:\\\\Users\\\\admin\\\\palace\\\\temp\\\\paste_clip.png\\"; $img.Save($p); Write-Output $p } else { Write-Output \\"NO_IMAGE\\" }';
        const _pasteResult = _execPaste('powershell -Command "' + _pasteImgScript + '"', { encoding: 'utf-8', timeout: 10000 }).trim();

        if (_pasteResult && _pasteResult !== 'NO_IMAGE' && !_pasteResult.includes('NO_IMAGE')) {
          // Got an image
          const _pasteFs = await import('fs');
          const _pasteBuf = _pasteFs.default.readFileSync(_pasteResult);
          const _pasteB64 = _pasteBuf.toString('base64');
          process.stdout.write('\\x1b[2mFound clipboard image, analyzing...\\x1b[0m\\n\\n');
          const _pasteResp = await fetch('http://localhost:8001/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'Qwen2.5-VL-7B-AWQ',
              messages: [{ role: 'user', content: [
                { type: 'image_url', image_url: { url: 'data:image/png;base64,' + _pasteB64 } },
                { type: 'text', text: 'Describe what you see in this clipboard image.' }
              ]}],
              max_tokens: 2048
            })
          });
          const _pasteData = await _pasteResp.json();
          process.stdout.write((_pasteData.choices?.[0]?.message?.content || 'No response from vision model.') + '\\n');
        } else {
          // Try text from clipboard
          const _pasteText = _execPaste('powershell -Command "Get-Clipboard"', { encoding: 'utf-8', timeout: 5000 }).trim();
          if (_pasteText) {
            process.stdout.write('\\x1b[2mFound clipboard text (' + _pasteText.length + ' chars)...\\x1b[0m\\n\\n');
            await chat('Here is content from my clipboard:\\n\\n' + _pasteText, currentHeads, convo);
          } else {
            process.stdout.write('Clipboard is empty.\\n');
          }
        }
      } catch (_pasteErr) {
        process.stdout.write('Clipboard access failed: ' + _pasteErr.message + '\\n');
      }
    }
`;

  const expandCommand = `
    // /expand — Show full buffered output from multi-head StatusEngine runs
    if (!_palaceCmd && trimmed.startsWith('/expand')) {
      _palaceCmd = true;
      const _expArg = trimmed.replace(/^\\/expand\\s*/, '').trim().toLowerCase() || 'all';
      const _expOutputs = global._palaceOutputs || {};
      if (_expArg === 'all') {
        let _found = false;
        const _expKeys = Object.keys(_expOutputs);
        for (let _ei = 0; _ei < _expKeys.length; _ei++) {
          _found = true;
          console.log('\\n=== ' + _expKeys[_ei].toUpperCase() + ' ===');
          console.log(_expOutputs[_expKeys[_ei]]);
        }
        if (!_found) {
          process.stdout.write('\\nNo multi-head output buffered yet. Run a multi-head query first (e.g. "all what is our status").\\n');
        }
      } else if (_expOutputs[_expArg]) {
        console.log('\\n=== ' + _expArg.toUpperCase() + ' ===');
        console.log(_expOutputs[_expArg]);
      } else {
        process.stdout.write('\\nNo output found for: ' + _expArg + '\\n');
        process.stdout.write('Usage: /expand [stone|cardinal|chaos|all]\\n');
      }
    }
`;

  // ─── STEP 22-23: INJECT DRAG-AND-DROP + /PASTE + /EXPAND ──────
  // These go inside the multimedia command block.
  // Drag-and-drop goes BEFORE the first if (!_palaceCmd) check.
  // /paste and /expand go as additional command handlers.
  // GS-5: Idempotent — check markers. GS-9: Unified block.

  if (src.includes('DRAG-AND-DROP FILE DETECTION (patched by patch-palace.js')) {
    ok('22. Drag-and-drop detection already present (skipping)');
  } else {
    // Insert drag-and-drop after the _palaceCmd declaration but before first command
    const ddAnchor = 'let _palaceCmd = false;';
    if (src.includes(ddAnchor)) {
      const ddIdx = src.indexOf(ddAnchor);
      const insertAt = ddIdx + ddAnchor.length;
      src = src.slice(0, insertAt) + '\n' + dragDropCode + src.slice(insertAt);
      ok('22. Drag-and-drop file detection injected after _palaceCmd declaration');
    } else {
      warn('22. Drag-and-drop — could not find _palaceCmd declaration anchor');
    }
  }

  if (src.includes('/paste')) {
    ok('23a. /paste command already present (skipping)');
  } else {
    // Insert /paste before the END MULTIMEDIA COMMANDS marker
    const endMmMarker = '// ─── END MULTIMEDIA COMMANDS';
    if (src.includes(endMmMarker)) {
      const endIdx = src.indexOf(endMmMarker);
      src = src.slice(0, endIdx) + pasteCommand + '\n    ' + src.slice(endIdx);
      ok('23a. /paste command injected');
    } else {
      warn('23a. /paste — could not find END MULTIMEDIA COMMANDS marker');
    }
  }

  if (src.includes('/expand')) {
    ok('23b. /expand command already present (skipping)');
  } else {
    const endMmMarker2 = '// ─── END MULTIMEDIA COMMANDS';
    if (src.includes(endMmMarker2)) {
      const endIdx2 = src.indexOf(endMmMarker2);
      src = src.slice(0, endIdx2) + expandCommand + '\n    ' + src.slice(endIdx2);
      ok('23b. /expand command injected');
    } else {
      warn('23b. /expand — could not find END MULTIMEDIA COMMANDS marker');
    }
  }

  // ─── STEP 24: WATCH FOLDER SETUP ──────────────────────────────
  // Create C:\Users\admin\palace\inbox\ and inject a watcher that
  // checks every 5 seconds for new files and auto-processes them.
  // The watcher is injected as a setInterval at the top level.
  // GS-5: Idempotent. GS-1: Brace-balanced.

  const watchFolderCode = `
// ─── INBOX WATCH FOLDER (patched by patch-palace.js — D19 Build 2) ────
// Watches C:\\Users\\admin\\palace\\inbox\\ for new files every 5 seconds.
// New files are auto-processed based on extension, then moved to inbox\\processed\\.
(async function() {
  const { default: _wFs } = await import('node:fs');
  const { default: _wPath } = await import('node:path');
  const _inboxDir = 'C:\\\\Users\\\\admin\\\\palace\\\\inbox';
  const _processedDir = _wPath.join(_inboxDir, 'processed');

  // Create dirs if needed
  try {
    _wFs.mkdirSync(_inboxDir, { recursive: true });
    _wFs.mkdirSync(_processedDir, { recursive: true });
  } catch (_e) { /* dirs may already exist */ }

  const _processedSet = new Set();

  setInterval(async () => {
    try {
      const _files = _wFs.readdirSync(_inboxDir).filter(f => !_wFs.statSync(_wPath.join(_inboxDir, f)).isDirectory());
      for (const _file of _files) {
        if (_processedSet.has(_file)) { /* skip */ }
        else {
          _processedSet.add(_file);
          const _fPath = _wPath.join(_inboxDir, _file);
          const _fExt = _file.split('.').pop().toLowerCase();
          const _imgExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'];
          const _docExts = ['txt', 'md', 'csv', 'json', 'pdf', 'log'];
          const _audioExts = ['mp3', 'wav', 'm4a', 'ogg'];
          const _videoExts = ['mp4', 'avi', 'mkv', 'mov', 'webm'];

          process.stdout.write('\\n\\x1b[1;35m[Inbox] New file: ' + _file + '\\x1b[0m\\n');

          if (_imgExts.includes(_fExt)) {
            try {
              const _iBuf = _wFs.readFileSync(_fPath);
              const _iB64 = _iBuf.toString('base64');
              const _iMime = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp' }[_fExt] || 'image/png';
              const _iResp = await fetch('http://localhost:8001/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  model: 'Qwen2.5-VL-7B-AWQ',
                  messages: [{ role: 'user', content: [
                    { type: 'image_url', image_url: { url: 'data:' + _iMime + ';base64,' + _iB64 } },
                    { type: 'text', text: 'A file was dropped into the inbox. Describe this image.' }
                  ]}],
                  max_tokens: 2048
                })
              });
              const _iData = await _iResp.json();
              process.stdout.write((_iData.choices?.[0]?.message?.content || 'No response.') + '\\n');
            } catch (_iErr) {
              process.stdout.write('Image analysis failed: ' + _iErr.message + '\\n');
            }
          } else if (_docExts.includes(_fExt)) {
            try {
              let _dText = _wFs.readFileSync(_fPath, 'utf-8');
              if (_dText.length > 8000) _dText = _dText.slice(0, 8000) + '\\n[truncated]';
              process.stdout.write('\\x1b[2mDocument: ' + _dText.length + ' chars\\x1b[0m\\n');
              process.stdout.write(_dText.slice(0, 500) + '\\n...(use /doc to analyze fully)\\n');
            } catch (_dErr) {
              process.stdout.write('Document read failed: ' + _dErr.message + '\\n');
            }
          } else if (_audioExts.includes(_fExt)) {
            process.stdout.write('Audio file detected. Use: /doc or drag the file to transcribe.\\n');
          } else if (_videoExts.includes(_fExt)) {
            process.stdout.write('Video file detected. Use: /video "' + _fPath + '" to analyze.\\n');
          } else {
            process.stdout.write('Unknown file type (.' + _fExt + '). Supported: images, docs, audio, video.\\n');
          }

          // Move to processed
          try {
            _wFs.renameSync(_fPath, _wPath.join(_processedDir, _file));
          } catch (_mvErr) { /* file may be locked */ }
        }
      }
    } catch (_wErr) { /* inbox dir may not exist yet */ }
  }, 5000);
})();
`;

  if (src.includes('INBOX WATCH FOLDER (patched by patch-palace.js')) {
    ok('24. Inbox watch folder already present (skipping)');
  } else {
    // Inject after the StatusEngine class or after the sanitizer
    const engineMarker = 'global._PalaceStatusEngine = StatusEngine;';
    const oldPanelMarker = 'global._palacePanel = _panel;';
    const sanitizerEnd = 'FINAL OUTPUT SANITIZER';
    let watchInjected = false;

    // Try new StatusEngine marker first, fall back to old panel marker
    const watchAnchor = src.includes(engineMarker) ? engineMarker : (src.includes(oldPanelMarker) ? oldPanelMarker : null);
    if (watchAnchor) {
      const anchorEnd = src.indexOf(watchAnchor);
      const afterAnchor = src.indexOf('})();', anchorEnd);
      if (afterAnchor !== -1) {
        const insertAt = afterAnchor + 5;
        src = src.slice(0, insertAt) + '\n' + watchFolderCode + src.slice(insertAt);
        watchInjected = true;
      }
    }

    if (!watchInjected && src.includes(sanitizerEnd)) {
      const sIdx = src.indexOf(sanitizerEnd);
      const afterS = src.indexOf('})();', sIdx);
      if (afterS !== -1) {
        const insertAt = afterS + 5;
        src = src.slice(0, insertAt) + '\n' + watchFolderCode + src.slice(insertAt);
        watchInjected = true;
      }
    }

    if (watchInjected) {
      ok('24. Inbox watch folder injected (C:\\Users\\admin\\palace\\inbox\\, 5s interval)');
    } else {
      warn('24. Inbox watch folder — could not find injection point');
    }
  }

  // ─── STEP 25: CREATE INBOX DIRECTORY ON OMEN ──────────────────
  // Ensure the inbox and temp directories exist on the target machine
  const inboxDir = path.join(PALACE_DIR, 'inbox');
  const inboxProcessedDir = path.join(inboxDir, 'processed');
  const tempDir = path.join(PALACE_DIR, 'temp');

  try {
    fs.mkdirSync(inboxDir, { recursive: true });
    fs.mkdirSync(inboxProcessedDir, { recursive: true });
    fs.mkdirSync(tempDir, { recursive: true });
    ok('25. Created inbox/, inbox/processed/, and temp/ directories');
  } catch (dirErr) {
    warn('25. Directory creation: ' + dirErr.message + ' (will be created on OMEN)');
  }

  // ─── STEP 26: /HOME BUSINESS DASHBOARD + AUTO-DISPLAY ───────
  // Injects global._palaceHome() for the founder's business dashboard.
  // Called by /home slash command AND auto-displayed on boot after banner.
  // GS-5: Idempotent — checks marker. GS-1: Brace-balanced (verified).

  const homeDashboardCode = `
// ─── HOME DASHBOARD (patched by patch-palace.js — /home command) ─────
(function() {
  global._palaceHome = function() {
    const DIM = '\\x1b[2m';
    const RESET = '\\x1b[0m';
    const BOLD = '\\x1b[1m';
    const w = process.stdout.write.bind(process.stdout);

    w('\\n');
    w(BOLD + '  THE PALACE — Home' + RESET + '\\n');
    w('  ' + '-'.repeat(56) + '\\n\\n');

    w(BOLD + '  THE BUSINESSES' + RESET + '\\n');
    w('    Stone AI         stone-ai.net                   LIVE\\n');
    w('    Best AI          Mobile app                     IN DEV (~18wk)\\n');
    w('    Stone AI Tools   tools.stone-ai.net             PRE-LAUNCH\\n\\n');

    w(BOLD + '  MONEY' + RESET + '\\n');
    w('    Stripe           dashboard.stripe.com           ' + DIM + 'TEST MODE' + RESET + '\\n');
    w('    Pricing          FREE/$0  STARTER/$19.99  PLUS/$49.99\\n');
    w('                     SMART/$99.99  PRO/$200\\n\\n');

    w(BOLD + '  USERS' + RESET + '\\n');
    w('    Clerk            dashboard.clerk.com            ' + DIM + 'DEV MODE' + RESET + '\\n\\n');

    w(BOLD + '  WEBSITE' + RESET + '\\n');
    w('    Vercel           vercel.com                     ' + DIM + 'auto-deploys from GitHub' + RESET + '\\n');
    w('    Live             stone-ai.net\\n');
    w('    Fallback         stone-ai-sooty.vercel.app\\n\\n');

    w(BOLD + '  DATABASE' + RESET + '\\n');
    w('    Neon             console.neon.tech              ' + DIM + 'PostgreSQL 16 + pgvector' + RESET + '\\n');
    w('    Local Docker     stoneai-db :5432\\n\\n');

    w(BOLD + '  CODE' + RESET + '\\n');
    w('    GitHub           github.com/stonefreight2017-source/Stone-AI\\n\\n');

    w(BOLD + '  DOMAIN' + RESET + '\\n');
    w('    Cloudflare       dash.cloudflare.com            ' + DIM + 'proxy ON, SSL Full' + RESET + '\\n\\n');

    w(BOLD + '  AI' + RESET + '\\n');
    w('    Local            vLLM + Qwen 2.5 32B AWQ       ' + DIM + 'port 8000' + RESET + '\\n');
    w('    Vision           Qwen2.5-VL-7B-AWQ             ' + DIM + 'port 8001' + RESET + '\\n');
    w('    Cloud            Claude Sonnet / Haiku fallback\\n\\n');

    w(BOLD + '  EMAIL' + RESET + '\\n');
    w('    Alerts           3headedm@gmail.com\\n\\n');

    w(BOLD + '  CREDENTIALS' + RESET + '\\n');
    w('    Location         C:\\\\Users\\\\admin\\\\Desktop\\\\STONE_AI_CREDENTIALS_AND_INFO.txt\\n\\n');

    w(BOLD + '  GO-LIVE BLOCKERS' + RESET + '\\n');
    w('    [ ] Clerk        Switch to production\\n');
    w('    [ ] Stripe       Switch to live keys\\n');
    w('    [ ] Anthropic    ANTHROPIC_API_KEY on Vercel\\n');
    w('    [ ] Social       Secure social media handles\\n');
    w('    [ ] Trademarks   File trademarks ($2,100)\\n\\n');
    w('  ' + '-'.repeat(56) + '\\n');
    w(DIM + '  Type /home anytime to see this again.' + RESET + '\\n\\n');
  };
})();
`;

  if (src.includes('HOME DASHBOARD (patched by patch-palace.js')) {
    ok('26a. Home dashboard function already present (skipping)');
  } else {
    const panelGlobalMarker = 'global._palacePanel = _panel;';
    const watchMarkerStr = 'INBOX WATCH FOLDER (patched by patch-palace.js';
    let homeInjected = false;

    if (src.includes(watchMarkerStr)) {
      const wIdx = src.indexOf(watchMarkerStr);
      const afterWatch = src.indexOf('})();', wIdx);
      if (afterWatch !== -1) {
        const insertAt = afterWatch + 5;
        src = src.slice(0, insertAt) + '\n' + homeDashboardCode + src.slice(insertAt);
        homeInjected = true;
      }
    }

    if (!homeInjected && src.includes(panelGlobalMarker)) {
      const pIdx = src.indexOf(panelGlobalMarker);
      const afterP = src.indexOf('})();', pIdx);
      if (afterP !== -1) {
        const insertAt = afterP + 5;
        src = src.slice(0, insertAt) + '\n' + homeDashboardCode + src.slice(insertAt);
        homeInjected = true;
      }
    }

    if (!homeInjected && src.includes('function stripXmlTags')) {
      const sIdx = src.indexOf('function stripXmlTags');
      const afterS = src.indexOf('\n}', sIdx);
      if (afterS !== -1) {
        src = src.slice(0, afterS + 2) + '\n' + homeDashboardCode + src.slice(afterS + 2);
        homeInjected = true;
      }
    }

    if (homeInjected) {
      ok('26a. Home dashboard function injected (global._palaceHome)');
    } else {
      warn('26a. Home dashboard — could not find injection point');
    }
  }

  // ─── STEP 26B: AUTO-DISPLAY /HOME ON BOOT ──────────────────────
  // Inject global._palaceHome() call before the main input loop.
  // GS-5: Idempotent — checks marker.

  const homeAutoDisplay = `
    // ─── AUTO HOME DASHBOARD (patched by patch-palace.js — boot display) ───
    if (typeof global._palaceHome === 'function') {
      global._palaceHome();
    }
`;

  if (src.includes('AUTO HOME DASHBOARD (patched by patch-palace.js')) {
    ok('26b. Auto home display on boot already present (skipping)');
  } else {
    let bootInjected = false;

    const rlQuestionPattern = /(\s*)(rl\.question\s*\(|rl\.prompt\s*\()/;
    const rlMatch = src.match(rlQuestionPattern);
    if (rlMatch) {
      const rlIdx = src.indexOf(rlMatch[0]);
      src = src.slice(0, rlIdx) + homeAutoDisplay + '\n' + src.slice(rlIdx);
      bootInjected = true;
    }

    if (!bootInjected) {
      const lineEventPattern = /rl\.on\s*\(\s*['"]line['"]/;
      const lineMatch = src.match(lineEventPattern);
      if (lineMatch) {
        const lineIdx = src.indexOf(lineMatch[0]);
        src = src.slice(0, lineIdx) + homeAutoDisplay + '\n' + src.slice(lineIdx);
        bootInjected = true;
      }
    }

    if (!bootInjected) {
      const whilePattern = /while\s*\(\s*true\s*\)/;
      const whileMatch = src.match(whilePattern);
      if (whileMatch) {
        const whileIdx = src.indexOf(whileMatch[0]);
        src = src.slice(0, whileIdx) + homeAutoDisplay + '\n' + src.slice(whileIdx);
        bootInjected = true;
      }
    }

    if (bootInjected) {
      ok('26b. Auto home display injected before main input loop (shows on boot)');
    } else {
      warn('26b. Auto home display — could not find input loop anchor (manual hookup needed on OMEN)');
    }
  }

  // Re-write patched file with all new features included
  fs.writeFileSync(PALACE_MJS_OUT, src, 'utf-8');
  ok(`palace.mjs re-written with D19 features (${src.length} bytes)${DRY_RUN ? ' [PREVIEW]' : ''}`);

  // ─── P-2: POST-PATCH SYNTAX CHECK ────────────────────────────────
  log('Running post-patch syntax check (node --check)...');
  try {
    execSync(`node --check "${PALACE_MJS_OUT}"`, { encoding: 'utf8', stdio: 'pipe' });
    ok('P-2. POST-PATCH: palace.mjs passes syntax check (node --check)');
  } catch (syntaxErr) {
    console.error('[FATAL] palace.mjs FAILED syntax check after patching!');
    console.error(syntaxErr.stderr || syntaxErr.stdout || syntaxErr.message);
    if (!DRY_RUN) {
      // Restore backup
      fs.copyFileSync(BACKUP_MJS, PALACE_MJS);
      console.error('[RESTORED] palace.mjs restored from backup');
    }
    process.exit(1);
  }

  // ─── P-2B: POST-PATCH RUNTIME ERROR CHECK ──────────────────────────
  // GS-7: node --check only catches syntax errors, NOT runtime TypeErrors.
  // const reassignment is a RUNTIME error. Grep the patched source to catch it.
  log('Running post-patch runtime error scan...');
  const runtimeSrc = fs.readFileSync(PALACE_MJS_OUT, 'utf-8');
  const constTrimmedRemaining = (runtimeSrc.match(/const trimmed/g) || []).length;
  const constCurrentHeadsRemaining = (runtimeSrc.match(/const currentHeads/g) || []).length;
  if (constTrimmedRemaining > 0 || constCurrentHeadsRemaining > 0) {
    console.error(`[FATAL] Runtime TypeError will occur! Found ${constTrimmedRemaining} "const trimmed" and ${constCurrentHeadsRemaining} "const currentHeads" in patched file.`);
    if (!DRY_RUN) {
      fs.copyFileSync(BACKUP_MJS, PALACE_MJS);
      console.error('[RESTORED] palace.mjs restored from backup');
    }
    process.exit(1);
  }
  ok('P-2B. POST-PATCH: No const reassignment time-bombs found (0 const trimmed, 0 const currentHeads)');

  // ─── P-2C: _palaceCmd SCOPE VALIDATION ────────────────────────────
  // GS-7/GS-8: Verify that every usage of _palaceCmd has a corresponding
  // declaration in the same scope. Practical check: count `let _palaceCmd`
  // declarations vs `_palaceCmd` usages, and verify they appear in a
  // contiguous block (declaration before first usage, no large gap).
  log('Running _palaceCmd scope validation...');
  const palaceCmdDeclarations = (runtimeSrc.match(/let _palaceCmd\b/g) || []).length;
  const palaceCmdUsages = (runtimeSrc.match(/\b_palaceCmd\b/g) || []).length;
  const palaceCmdGuards = (runtimeSrc.match(/if\s*\(\s*!_palaceCmd\s*\)/g) || []).length;

  if (palaceCmdDeclarations === 0 && palaceCmdUsages === 0) {
    // No multimedia injection — that's fine
    ok('P-2C. _palaceCmd: not present (no multimedia commands injected — OK)');
  } else if (palaceCmdDeclarations === 0 && palaceCmdUsages > 0) {
    console.error(`[FATAL] _palaceCmd used ${palaceCmdUsages} times but NEVER declared! ReferenceError will occur.`);
    if (!DRY_RUN) {
      fs.copyFileSync(BACKUP_MJS, PALACE_MJS);
      console.error('[RESTORED] palace.mjs restored from backup');
    }
    process.exit(1);
  } else {
    // Verify declaration comes BEFORE first usage
    const declIdx = runtimeSrc.indexOf('let _palaceCmd');
    const firstUseIdx = runtimeSrc.indexOf('_palaceCmd');
    // firstUseIdx should equal declIdx (the declaration IS the first occurrence)
    if (firstUseIdx === declIdx) {
      ok(`P-2C. _palaceCmd scope: ${palaceCmdDeclarations} declaration(s), ${palaceCmdUsages} total references, ${palaceCmdGuards} guard(s) — declaration is first occurrence (OK)`);
    } else if (firstUseIdx < declIdx) {
      console.error(`[FATAL] _palaceCmd used at char ${firstUseIdx} but declared at char ${declIdx} — usage before declaration!`);
      if (!DRY_RUN) {
        fs.copyFileSync(BACKUP_MJS, PALACE_MJS);
        console.error('[RESTORED] palace.mjs restored from backup');
      }
      process.exit(1);
    } else {
      ok(`P-2C. _palaceCmd scope: ${palaceCmdDeclarations} declaration(s), ${palaceCmdUsages} total references, ${palaceCmdGuards} guard(s) — OK`);
    }
  }

  // ─── P-4: CROSS-FILE CONTRACT CHECK ──────────────────────────────
  log('Running cross-file contract check...');
  try {
    const patcherDir = path.dirname(process.argv[1] || __filename);
    const installToolsPath = path.join(patcherDir, 'install-palace-tools.js');
    if (fs.existsSync(installToolsPath)) {
      const installSrc = fs.readFileSync(installToolsPath, 'utf-8');
      // Check: both files should reference the same scripts directory
      const patcherRefScripts = src.includes('scripts\\\\listen.ps1') || src.includes('scripts/listen.ps1');
      const installerRefScripts = installSrc.includes("SCRIPTS") && installSrc.includes("path.join(PALACE, 'scripts')");
      if (patcherRefScripts && installerRefScripts) {
        ok('P-4. Cross-file contract: patcher and installer both reference palace/scripts/ (OK)');
      } else {
        warn('P-4. Cross-file contract: script path mismatch between patcher and installer');
      }
      // Check: vision model port consistency
      const patcherPort8001 = src.includes('localhost:8001');
      if (patcherPort8001) {
        ok('P-4. Vision model endpoint: port 8001 referenced (OK)');
      }
    } else {
      warn('P-4. install-palace-tools.js not found — skipping contract check');
    }
  } catch (contractErr) {
    warn('P-4. Cross-file contract check error: ' + contractErr.message);
  }

  // ─── STEP 19: SUMMARY ────────────────────────────────────────────
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   PATCH COMPLETE — SUMMARY                              ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`  Successes: ${successes.length}`);
  successes.forEach(s => console.log(`    ✓ ${s}`));
  console.log('');
  if (warnings.length > 0) {
    console.log(`  Warnings: ${warnings.length}`);
    warnings.forEach(w => console.log(`    ⚠ ${w}`));
    console.log('');
  }
  console.log('  Files modified/created:');
  console.log(`    • ${PALACE_MJS} (patched)`);
  console.log(`    • ${BACKUP_MJS} (backup)`);
  console.log(`    • ${SEEDS_DIR}/stone-seeds.md`);
  console.log(`    • ${SEEDS_DIR}/cardinal-seeds.md`);
  console.log(`    • ${SEEDS_DIR}/chaos-seeds.md`);
  console.log(`    • ${SEEDS_DIR}/computerwiz-seeds.md`);
  console.log(`    • ${SEEDS_DIR}/shared-context.md`);
  console.log(`    • ${SEEDS_DIR}/agent-identities.json`);
  console.log(`    • /home/start-vllm.sh (WSL)`);
  console.log(`    • ${STARTUP_BAT}`);
  console.log('');
  console.log('  SLASH COMMANDS:');
  console.log('    /mic or /voice  — Speech-to-text → sends to active head(s)');
  console.log('    /image <path>   — Analyze image file via vision model');
  console.log('    /pic <path>     — Alias for /image');
  console.log('    /screen         — Capture screen → vision model analysis');
  console.log('    /clip           — Clipboard image → vision model analysis');
  console.log('    /doc <path>     — Read document → send to text model');
  console.log('    /video <path>   — Extract frame → vision model analysis');
  console.log('    /paste          — Auto-detect clipboard content (image or text)');
  console.log('    /expand [name]  — Show full buffered output (stone/cardinal/chaos/all)');
  console.log('    /home           — Business dashboard (auto-displays on boot)');
  console.log('    /info           — Stone AI company reference card');
  console.log('    /agents         — List all 44 agents with tiers and categories');
  console.log('');
  console.log('  D19 — STATUS ENGINE (Claude Code-style):');
  console.log('    • Multi-head: 3-line display per agent (header / spinner+tokens / activity hint)');
  console.log('    • Braille spinner updates in-place via ANSI. No boxes. No bloat.');
  console.log('    • Single-head: clean passthrough (no panel)');
  console.log('    • /expand to see full buffered output from any agent');
  console.log('    • Engine on global._PalaceStatusEngine, outputs on global._palaceOutputs');
  console.log('');
  console.log('  D19 — SEAMLESS MEDIA INPUT:');
  console.log('    • Drag-and-drop: drag any file into terminal → auto-detect & process');
  console.log('    • /paste: clipboard image or text → auto-analyze');
  console.log('    • Inbox: drop files in C:\\Users\\admin\\palace\\inbox\\ → auto-process');
  console.log('    • Supported: images, docs, audio (whisper), video (ffmpeg)');
  console.log('');
  console.log('  NEXT STEPS:');
  console.log('    1. Run: node palace.mjs');
  console.log('    2. Type "stone what\'s our status" (no slash needed)');
  console.log('    3. Type "cardinal analyze our pricing" (no slash needed)');
  console.log('    4. Type "chaos check gpu" (no slash needed)');
  console.log('    5. Slash commands still work: /stone, /cardinal, /chaos, /all');
  console.log('    6. New: /mic, /voice, /image, /pic, /screen, /clip, /doc, /video, /info, /agents');
  console.log('    7. D19: /home, /paste, /expand, drag-and-drop, inbox watcher');
  console.log('    8. Agent routing: "cybersecurity help me", "coding fix this", etc.');
  console.log('');
  console.log('  REQUIRED TOOLS (place in C:\\Users\\admin\\palace\\scripts\\):');
  console.log('    • listen.ps1      — Speech recognition via Windows Speech API');
  console.log('    • screenshot.ps1  — Screen capture, returns temp file path');
  console.log('    • clipboard.ps1   — Clipboard image grab, returns temp file path');
  console.log('    • whisper          — pip install openai-whisper (for audio transcription)');
  console.log('    • ffmpeg           — For video frame extraction');
  console.log('');
  console.log('  The Palace is ready. 🏰');
  console.log('');
}

main();
