# Palace GUI Visual Spec — Cloned from Claude Code CLI

**Source**: Reverse-engineered from Claude Code v2.1.72 (`cli.js`) + web research.
**Purpose**: Chaos uses this to build the Palace GUI with pixel-perfect fidelity to the Claude Code terminal aesthetic.

---

## 1. RENDERING FRAMEWORK

Claude Code uses **React + Ink** (terminal React renderer) with **Yoga WASM** for flexbox layout. The Palace GUI should replicate this with a web-based React app using CSS flexbox, styled to look like a terminal.

---

## 2. COMPLETE COLOR SYSTEM

Claude Code has **6 themes**. The Palace GUI should use the **dark theme** (`_h5` in source). All colors below are extracted directly from the source code.

### 2.1 Dark Theme (PRIMARY — use this)

| Token Name | RGB Value | Hex Equivalent | Usage |
|---|---|---|---|
| `claude` | `rgb(215,119,87)` | `#D77757` | Claude brand coral — ✻ symbol, agent names, links |
| `claudeShimmer` | `rgb(235,159,127)` | `#EB9F7F` | Shimmer animation on claude elements |
| `text` | `rgb(255,255,255)` | `#FFFFFF` | Primary text color |
| `inverseText` | `rgb(0,0,0)` | `#000000` | Text on light backgrounds |
| `inactive` | `rgb(153,153,153)` | `#999999` | Dimmed/inactive text |
| `inactiveShimmer` | `rgb(193,193,193)` | `#C1C1C1` | Shimmer on inactive |
| `subtle` | `rgb(80,80,80)` | `#505050` | Very dim elements |
| `success` | `rgb(78,186,101)` | `#4EBA65` | Success states, checkmarks |
| `error` | `rgb(255,107,128)` | `#FF6B80` | Error states |
| `warning` | `rgb(255,193,7)` | `#FFC107` | Warning states |
| `warningShimmer` | `rgb(255,223,57)` | `#FFDF39` | Warning shimmer |
| `info` | — | — | (uses `text` color) |
| `permission` | `rgb(177,185,249)` | `#B1B9F9` | Permission prompts |
| `permissionShimmer` | `rgb(207,215,255)` | `#CFD7FF` | Permission shimmer |
| `suggestion` | `rgb(177,185,249)` | `#B1B9F9` | Suggestions |
| `remember` | `rgb(177,185,249)` | `#B1B9F9` | Memory operations |
| `autoAccept` | `rgb(175,135,255)` | `#AF87FF` | Auto-accept mode |
| `merged` | `rgb(175,135,255)` | `#AF87FF` | Merged PRs |
| `bashBorder` | `rgb(253,93,177)` | `#FD5DB1` | Bash command borders |
| `planMode` | `rgb(72,150,140)` | `#48968C` | Plan mode indicator |
| `ide` | `rgb(71,130,200)` | `#4782C8` | IDE integration |
| `promptBorder` | `rgb(136,136,136)` | `#888888` | Input prompt border |
| `promptBorderShimmer` | `rgb(166,166,166)` | `#A6A6A6` | Prompt border shimmer |
| `professionalBlue` | `rgb(106,155,204)` | `#6A9BCC` | Professional accent |
| `fastMode` | `rgb(255,120,20)` | `#FF7814` | Fast mode indicator |
| `fastModeShimmer` | `rgb(255,165,70)` | `#FFA546` | Fast mode shimmer |
| `briefLabelYou` | `rgb(122,180,232)` | `#7AB4E8` | "You" label |
| `briefLabelClaude` | `rgb(215,119,87)` | `#D77757` | "Claude" label |
| `chromeYellow` | `rgb(251,188,4)` | `#FBBC04` | Chrome/highlight yellow |

### 2.2 Dark Theme — Background Colors

| Token | RGB | Hex | Usage |
|---|---|---|---|
| `clawd_background` | `rgb(0,0,0)` | `#000000` | Main background |
| `userMessageBackground` | `rgb(55,55,55)` | `#373737` | User message bg |
| `bashMessageBackgroundColor` | `rgb(65,60,65)` | `#413C41` | Bash output bg |
| `memoryBackgroundColor` | `rgb(55,65,70)` | `#374146` | Memory block bg |
| `selectionBackground` | `rgb(38,58,94)` | `#263A5E` | Selected text bg |

### 2.3 Dark Theme — Diff Colors

| Token | RGB | Hex | Usage |
|---|---|---|---|
| `diffAdded` | `rgb(34,92,43)` | `#225C2B` | Added line bg |
| `diffRemoved` | `rgb(122,41,54)` | `#7A2936` | Removed line bg |
| `diffAddedDimmed` | `rgb(71,88,74)` | `#47584A` | Added dimmed |
| `diffRemovedDimmed` | `rgb(105,72,77)` | `#69484D` | Removed dimmed |
| `diffAddedWord` | `rgb(56,166,96)` | `#38A660` | Added word highlight |
| `diffRemovedWord` | `rgb(179,89,107)` | `#B3596B` | Removed word highlight |

### 2.4 Dark Theme — Subagent Colors (for multi-agent display)

| Color Name | RGB | Hex |
|---|---|---|
| `red` | `rgb(220,38,38)` | `#DC2626` |
| `blue` | `rgb(37,99,235)` | `#2563EB` |
| `green` | `rgb(22,163,74)` | `#16A34A` |
| `yellow` | `rgb(202,138,4)` | `#CA8A04` |
| `purple` | `rgb(147,51,234)` | `#9333EA` |
| `orange` | `rgb(234,88,12)` | `#EA580C` |
| `pink` | `rgb(219,39,119)` | `#DB2777` |
| `cyan` | `rgb(8,145,178)` | `#0891B2` |

### 2.5 Dark Theme — Rate Limit Bar

| Token | RGB | Hex |
|---|---|---|
| `rate_limit_fill` | `rgb(177,185,249)` | `#B1B9F9` |
| `rate_limit_empty` | `rgb(80,83,112)` | `#505370` |

### 2.6 Rainbow Colors (for special effects)

| Color | Base RGB | Shimmer RGB |
|---|---|---|
| Red | `rgb(235,95,87)` | `rgb(250,155,147)` |
| Orange | `rgb(245,139,87)` | `rgb(255,185,137)` |
| Yellow | `rgb(250,195,95)` | `rgb(255,225,155)` |
| Green | `rgb(145,200,130)` | `rgb(185,230,180)` |
| Blue | `rgb(130,170,220)` | `rgb(180,205,240)` |
| Indigo | `rgb(155,130,200)` | `rgb(195,180,230)` |
| Violet | `rgb(200,130,180)` | `rgb(230,180,210)` |

### 2.7 System Spinner Colors (Blue variant)

| Token | RGB | Hex |
|---|---|---|
| `claudeBlue_FOR_SYSTEM_SPINNER` | `rgb(147,165,255)` | `#93A5FF` |
| `claudeBlueShimmer_FOR_SYSTEM_SPINNER` | `rgb(177,195,255)` | `#B1C3FF` |

---

## 3. UNICODE SYMBOLS — Complete Character Map

All symbols extracted from the source code with usage counts and contexts.

### 3.1 Primary Status Indicators

| Symbol | Unicode | Name | Usage | Color |
|---|---|---|---|---|
| `●` | U+25CF | Black Circle | Active/in-progress status bullet, main message marker | `claude` (#D77757) or `ansi:cyan` |
| `✻` | U+273B | Teardrop-Spoked Asterisk | Claude thinking/response marker, "Sauteed for Xm Xs" | `claude` (#D77757) |
| `⎿` | U+23BF | Dentistry Symbol Light Down and Horizontal | Result/child connector (indented 2 spaces before) | `text` or `dimColor` |
| `○` | U+25CB | White Circle | Pending/idle status | default |
| `◐` | U+25D0 | Circle with Left Half Black | Partial progress | — |
| `◉` | U+25C9 | Fisheye | Focused/selected | — |
| `✓` | U+2713 | Check Mark | Success/completed | `success` (#4EBA65) |
| `✗` | U+2717 | Ballot X | Failure | `error` (#FF6B80) |
| `✘` | U+2718 | Heavy Ballot X | Hard failure | `error` |
| `✔` | U+2714 | Heavy Check Mark | Confirmed success | `success` |

### 3.2 Navigation & Arrows

| Symbol | Unicode | Name | Count in Source |
|---|---|---|---|
| `→` | U+2192 | Rightwards Arrow | 225 |
| `←` | U+2190 | Leftwards Arrow | 26 |
| `↑` | U+2191 | Upwards Arrow | 21 |
| `↓` | U+2193 | Downwards Arrow | 29 |
| `❯` | U+276F | Heavy Right-Pointing Angle Quotation Mark | 2 |
| `⏵` | U+23F5 | Black Medium Right-Pointing Triangle | 8 |
| `▶` | U+25B6 | Black Right-Pointing Triangle | 8 |
| `►` | U+25BA | Black Right-Pointing Pointer | 4 |
| `↻` | U+21BB | Clockwise Open Circle Arrow | Refresh/retry |

### 3.3 Dots & Separators

| Symbol | Unicode | Name | Count | Usage |
|---|---|---|---|---|
| `•` | U+2022 | Bullet | 81 | List items |
| `·` | U+00B7 | Middle Dot | 327 | Separator (metadata: "17 tool uses · 55.5k tokens · 3m 5s") |
| `∙` | U+2219 | Bullet Operator | — | Alternative dot |
| `…` | U+2026 | Horizontal Ellipsis | 222 | Truncation |
| `—` | U+2014 | Em Dash | 516 | Text separator |

### 3.4 Block/Progress Characters

| Symbol | Unicode | Name | Usage |
|---|---|---|---|
| `█` | U+2588 | Full Block | Progress bar fill |
| `▀` | U+2580 | Upper Half Block | — |
| `▄` | U+2584 | Lower Half Block | — |
| `▌` | U+258C | Left Half Block | — |
| `▐` | U+2590 | Right Half Block | — |
| `■` | U+25A0 | Black Square | Status indicator |
| `▪` | U+25AA | Black Small Square | Compact status |

### 3.5 Special Symbols

| Symbol | Unicode | Name | Usage |
|---|---|---|---|
| `↯` | U+21AF | Downwards Zigzag Arrow | Error/crash indicator |
| `⧉` | U+29C9 | Two Joined Squares | Window/copy indicator |
| `×` | U+00D7 | Multiplication Sign | Close/cancel |

### 3.6 Macbook vs Other Platforms

| Platform | Recording Dot |
|---|---|
| macOS (darwin) | `⏺` (U+23FA, Black Circle for Record) |
| Other (Windows/Linux) | `●` (U+25CF, Black Circle) |

---

## 4. SPINNER ANIMATION

### 4.1 Spinner Frames

The spinner cycles through these characters during thinking:

**Standard terminals:**
```
["·", "✢", "*", "✶", "✻", "✽"]
```

**macOS:**
```
["·", "✢", "✳", "✶", "✻", "✽"]
```

**Ghostty terminal:**
```
["·", "✢", "✳", "✶", "✻", "*"]
```

### 4.2 Loading Bar Spinner (alternative)

```
["·|·", "·/·", "·—·", "·\\·"]
```

### 4.3 Shimmer Animation

Colors alternate between base and shimmer variant at a **50ms animation loop interval**.
Example: `claude` (#D77757) ↔ `claudeShimmer` (#EB9F7F)

The shimmer creates a gentle pulsing/breathing effect on active elements.

---

## 5. LAYOUT STRUCTURE

### 5.1 Main Message Block

```
● Agent(Name: Task description here)
  ⎿  Done (17 tool uses · 55.5k tokens · 3m 5s)
  (ctrl+o to expand)
```

**Breakdown:**
- `●` — 1 character, colored `claude` (#D77757) or `ansi:cyan`
- ` ` — 1 space separator
- `Agent(Name: Task description)` — text content
- Next line: `  ⎿  ` — 2 spaces + connector + 2 spaces (total 6 chars indent)
- `Done (...)` — completion text, dimColor
- Next line: `  (ctrl+o to expand)` — 2 spaces + dim hint text

### 5.2 Thinking/Response Block

```
✻ Thinking…
```
- `✻` colored `claude` (#D77757)
- ` ` space
- `Thinking…` in dimColor italic

### 5.3 Completion Status Line

```
✻ Sautéed for 2m 54s
```
- `✻` colored `claude`
- Random past-tense verb from completion list
- Duration formatted by `uK()` function

### 5.4 Memory Write Block

```
● Wrote 1 memory (ctrl+o to expand)
```
- `●` colored
- "Wrote" (capitalized when first item) / "wrote" (lowercase otherwise)
- Count + "memory" (singular) or "memories" (plural)

### 5.5 Hook Execution

```
  ⎿  Ran 2 PreToolUse hooks (0.3s)
     ⎿ hook-name (0.1s)
     ⎿ hook-name (0.2s)
```
- Nested connectors: parent at 2-space indent, children at 5-space indent
- Child connector: `⎿` (single, not double-spaced)

### 5.6 Tool Result (collapsed)

```
  ⎿  [result summary, truncated if needed]
```

---

## 6. TYPOGRAPHY

### 6.1 Font

Claude Code runs in the terminal, so it inherits the terminal's monospace font. For SVG rendering (screenshots/exports), the source specifies:

```
fontFamily: "Menlo, Monaco, monospace"
fontSize: 14
lineHeight: 22
paddingX: 24
paddingY: 24
```

**For Palace GUI, use:**
- **Primary**: `"Menlo, Monaco, 'Cascadia Code', 'Fira Code', 'JetBrains Mono', Consolas, monospace"`
- **Size**: 14px
- **Line height**: 22px (1.57 ratio)

### 6.2 Text Rendering

- **Bold**: Used for emphasis, agent names
- **Italic**: Used for thinking text, dim labels
- **dimColor**: Reduces opacity/brightness of text (CSS: `opacity: 0.6` or lighter color)

---

## 7. BOX-DRAWING CHARACTERS — Table/Border System

### 7.1 Border Styles Available

**Single (default for most UI):**
```
┌─────────────────┐
│ Content here     │
├─────────────────┤
│ More content     │
└─────────────────┘
```
Characters: `┌` `─` `┐` `│` `├` `┤` `└` `┘` `┬` `┴` `┼`

**Bold (used for emphasis borders):**
```
┏━━━━━━━━━━━━━━━━━┓
┃ Content here     ┃
┣━━━━━━━━━━━━━━━━━┫
┃ More content     ┃
┗━━━━━━━━━━━━━━━━━┛
```
Characters: `┏` `━` `┓` `┃` `┣` `┫` `┗` `┛` `┳` `┻` `╋`

**Round (used for softer UI):**
```
╭─────────────────╮
│ Content here     │
╰─────────────────╯
```
Characters: `╭` `─` `╮` `│` `╯` `╰`

**Double (used for strong borders):**
```
╔═════════════════╗
║ Content here     ║
╠═════════════════╣
║ More content     ║
╚═════════════════╝
```

### 7.2 Horizontal Rules / Separators

Default separator character: `─` (U+2500, Box Drawings Light Horizontal)
Width: fills available terminal width minus padding

### 7.3 Clawd ASCII Art (Logo)

```
┌─────────╱
 ) CC ✻ ┊╱
└───────╱
```
Full version:
```
┌──────────┐
 ) CC ✻ ┊ (
└──────────┘
```

---

## 8. DURATION FORMATTING (function `uK`)

```
0ms        → "0s"
<1ms       → "0.Xs" (1 decimal)
<60000ms   → "Xs" (rounded seconds)
>=60000ms  → "Xm Xs"
>=3600000ms → "Xh Xm Xs"
>=86400000ms → "Xd Xh Xm Xs"
```

Examples: `0s`, `3s`, `1m 5s`, `3m 5s`, `1h 23m 45s`

---

## 9. TOKEN FORMATTING (function `mK`)

- Under 1000: displayed as-is (e.g., `847 tokens`)
- 1000+: uses compact notation with `k` suffix (e.g., `55.5k tokens`)
- Always lowercase

---

## 10. COMPLETION STATUS FORMAT

The "Done" line follows this exact template:

```
Done ({tool_count} tool use{s} · {token_count} tokens · {duration})
```

Example: `Done (17 tool uses · 55.5k tokens · 3m 5s)`
- Separator: ` · ` (space + middle dot U+00B7 + space)
- "1 tool use" (singular) vs "N tool uses" (plural)

---

## 11. THINKING VERBS

### 11.1 Present Tense (shown during thinking)

Full list (173 verbs):
```
Baking, Beaming, Beboppin', Befuddling, Billowing, Blanching, Bloviating,
Boogieing, Boondoggling, Booping, Bootstrapping, Brewing, Bunning, Burrowing,
Calculating, Canoodling, Caramelizing, Cascading, Catapulting, Cerebrating,
Channeling, Channelling, Choreographing, Churning, Clauding, Coalescing,
Cogitating, Combobulating, Composing, Computing, Concocting, Considering,
Contemplating, Cooking, Crafting, Creating, Crunching, Crystallizing,
Cultivating, Deciphering, Deliberating, Determining, Dilly-dallying,
Discombobulating, Doing, Doodling, Drizzling, Ebbing, Effecting, Elucidating,
Embellishing, Enchanting, Envisioning, Evaporating, Fermenting, Fiddle-faddling,
Finagling, Flambéing, Flibbertigibbeting, Flowing, Flummoxing, Fluttering,
Forging, Forming, Frolicking, Frosting, Gallivanting, Galloping, Garnishing,
Generating, Gesticulating, Germinating, Gitifying, Grooving, Gusting,
Harmonizing, Hashing, Hatching, Herding, Honking, Hullaballooing, Hyperspacing,
Ideating, Imagining, Improvising, Incubating, Inferring, Infusing, Ionizing,
Jitterbugging, Julienning, Kneading, Leavening, Levitating, Lollygagging,
Manifesting, Marinating, Meandering, Metamorphosing, Misting, Moonwalking,
Moseying, Mulling, Mustering, Musing, Nebulizing, Nesting, Newspapering,
Noodling, Nucleating, Orbiting, Orchestrating, Osmosing, Perambulating,
Percolating, Perusing, Philosophising, Photosynthesizing, Pollinating,
Pondering, Pontificating, Pouncing, Precipitating, Prestidigitating,
Processing, Proofing, Propagating, Puttering, Puzzling, Quantumizing,
Razzle-dazzling, Razzmatazzing, Recombobulating, Reticulating, Roosting,
Ruminating, Sautéing, Scampering, Schlepping, Scurrying, Seasoning,
Shenaniganing, Shimmying, Simmering, Skedaddling, Sketching, Slithering,
Smooshing, Sock-hopping, Spelunking, Spinning, Sprouting, Stewing,
Sublimating, Swirling, Swooping, Symbioting, Synthesizing, Tempering,
Thinking, Thundering, Tinkering, Tomfoolering, Topsy-turvying, Transfiguring,
Transmuting, Twisting, Undulating, Unfurling, Unravelling, Vibing, Waddling,
Wandering, Warping, Whatchamacalliting, Whirlpooling, Whirring, Whisking,
Wibbling, Working, Wrangling, Zesting, Zigzagging
```

### 11.2 Past Tense (shown on completion)

```
Baked, Brewed, Churned, Cogitated, Cooked, Crunched, Sautéed, Worked
```

Format: `✻ {past_tense_verb} for {duration}`
Example: `✻ Sautéed for 2m 54s`

---

## 12. INTERACTIVE ELEMENTS

### 12.1 Expand/Collapse

- **Keybinding**: `ctrl+o` (mapped to `app:toggleTranscript`)
- **Display**: `(ctrl+o to expand)` shown in dimColor
- **Collapsed**: Shows summary line only
- **Expanded**: Shows full transcript/details

### 12.2 Other Keybindings

| Key | Action |
|---|---|
| `ctrl+o` | Toggle transcript (expand/collapse) |
| `ctrl+shift+o` | Toggle teammate preview |
| `ctrl+d` | Exit app |
| `ctrl+t` | Toggle todos |
| `ctrl+r` | History |

---

## 13. TASK STATUS INDICATORS

| Status | Icon | Color |
|---|---|---|
| `completed` | `✓` (tick) | `success` (#4EBA65) |
| `in_progress` | `■` (squareSmallFilled) | `claude` (#D77757) |
| `pending` | `□` (squareSmall/○) | default/none |

---

## 14. PASSES / BRANDING ELEMENT

Claude Code shows this branding block in certain views:

```
[✻] [✻] [✻]
```

Three `✻` symbols in brackets, all colored `claude` (#D77757), with dimColor on brackets.

---

## 15. PALACE GUI IMPLEMENTATION NOTES

### 15.1 CSS Variables (recommended)

```css
:root {
  /* Core */
  --bg-primary: #000000;
  --bg-user-message: #373737;
  --bg-bash: #413C41;
  --bg-memory: #374146;
  --bg-selection: #263A5E;

  /* Text */
  --text-primary: #FFFFFF;
  --text-dim: #999999;
  --text-subtle: #505050;
  --text-inverse: #000000;

  /* Brand */
  --claude-coral: #D77757;
  --claude-coral-shimmer: #EB9F7F;
  --claude-blue: #93A5FF;
  --claude-blue-shimmer: #B1C3FF;

  /* Semantic */
  --color-success: #4EBA65;
  --color-error: #FF6B80;
  --color-warning: #FFC107;
  --color-warning-shimmer: #FFDF39;
  --color-permission: #B1B9F9;
  --color-permission-shimmer: #CFD7FF;
  --color-auto-accept: #AF87FF;
  --color-bash-border: #FD5DB1;
  --color-plan-mode: #48968C;
  --color-fast-mode: #FF7814;
  --color-fast-shimmer: #FFA546;
  --color-prompt-border: #888888;
  --color-professional-blue: #6A9BCC;

  /* Diff */
  --diff-added: #225C2B;
  --diff-removed: #7A2936;
  --diff-added-word: #38A660;
  --diff-removed-word: #B3596B;

  /* Subagent palette */
  --agent-red: #DC2626;
  --agent-blue: #2563EB;
  --agent-green: #16A34A;
  --agent-yellow: #CA8A04;
  --agent-purple: #9333EA;
  --agent-orange: #EA580C;
  --agent-pink: #DB2777;
  --agent-cyan: #0891B2;

  /* Rate limit */
  --rate-fill: #B1B9F9;
  --rate-empty: #505370;

  /* Typography */
  --font-mono: "Menlo", "Monaco", "Cascadia Code", "Fira Code", "JetBrains Mono", "Consolas", monospace;
  --font-size: 14px;
  --line-height: 22px;

  /* Spacing */
  --indent-connector: 6ch; /* "  ⎿  " = 2+1+2+1 chars */
  --indent-nested: 5ch;    /* "     ⎿ " nested child */
}
```

### 15.2 Shimmer Animation CSS

```css
@keyframes shimmer {
  0%, 100% { color: var(--claude-coral); }
  50% { color: var(--claude-coral-shimmer); }
}

.shimmer {
  animation: shimmer 1s ease-in-out infinite;
}

/* For accessibility: respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .shimmer { animation: none; }
}
```

### 15.3 Key Component Structure

```
<div class="message-block">
  <span class="status-bullet claude-color">●</span>
  <span class="message-content">Agent(Name: Task description)</span>
</div>
<div class="result-line dim">
  <span class="connector">  ⎿  </span>
  <span>Done (17 tool uses · 55.5k tokens · 3m 5s)</span>
</div>
<div class="expand-hint dim">
  <span>  (ctrl+o to expand)</span>
</div>
```

---

## 16. LIGHT THEME REFERENCE (for future use)

Light theme (`qh5`) key differences:

| Token | RGB | Hex |
|---|---|---|
| `claude` | `rgb(215,119,87)` | `#D77757` | (same as dark!) |
| `text` | `rgb(0,0,0)` | `#000000` |
| `inverseText` | `rgb(255,255,255)` | `#FFFFFF` |
| `inactive` | `rgb(102,102,102)` | `#666666` |
| `success` | `rgb(44,122,57)` | `#2C7A39` |
| `error` | `rgb(171,43,63)` | `#AB2B3F` |
| `warning` | `rgb(150,108,30)` | `#966C1E` |
| `permission` | `rgb(87,105,247)` | `#5769F7` |
| `bashBorder` | `rgb(255,0,135)` | `#FF0087` |
| `userMessageBackground` | `rgb(240,240,240)` | `#F0F0F0` |

---

**END OF VISUAL SPEC**

This document was reverse-engineered from Claude Code v2.1.72 source (`cli.js`).
All color values, symbols, and layout patterns are directly extracted from the production code.
