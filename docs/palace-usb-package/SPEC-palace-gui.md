# Palace GUI — Architecture Specification

## Cardinal (Head 2) — Definitive Build Spec for Frontend Engineer + Chaos
## Date: 2026-03-08
## Directive: D19 — Option C — Custom Local Web App

---

## 0. DECISION SUMMARY

The founder chose Option C: a custom local web application running on the OMEN (The Palace). This replaces the terminal-only Palace CLI with a browser-based GUI while keeping the CLI alive for power users. The GUI is the founder's daily driver — it must be clean, fast, and feel like a product, not a prototype.

**Port: 9000** (avoids 8000=vLLM text, 8001=vLLM vision, 3000=Open WebUI, 7777=Palace Bridge)

**Tech Stack:**
- **Backend**: Fastify (faster than Express, native JSON schema validation, built-in WebSocket)
- **Frontend**: Vanilla HTML/CSS/JS with Web Components. No React. No build step. Ship raw files. If a component gets complex enough to warrant it, the Frontend Engineer may introduce Lit (Web Components library, <7KB). That is the ceiling — no React, no Vue, no Svelte.
- **Streaming**: Server-Sent Events (SSE) for chat responses. WebSocket for status panel updates.
- **Styling**: Single CSS file. One accent color (Palace gold: `#D4A84B`). Dark background (`#1a1a1a`). Monospace for chat. Sans-serif for UI chrome. Claude Code's density, not ChatGPT's whitespace.

---

## 1. FILE STRUCTURE

```
C:\Users\admin\palace\palace-gui\
├── server.js                  # Fastify server — entry point
├── package.json               # Dependencies: fastify, @fastify/static, @fastify/websocket, @fastify/cors
├── config.js                  # Ports, vLLM endpoints, agent list, Palace identity
│
├── routes/
│   ├── chat.js                # POST /api/chat — streams response via SSE
│   ├── agents.js              # GET /api/agents — returns agent list with metadata
│   ├── upload.js              # POST /api/upload — handles drag-and-drop media
│   ├── status.js              # WebSocket /ws/status — real-time agent status updates
│   └── system.js              # GET /api/system — Palace health (GPU, VRAM, uptime)
│
├── services/
│   ├── vllm-client.js         # HTTP client for vLLM (text + vision), streaming parser
│   ├── whisper-client.js      # HTTP client for faster-whisper STT
│   ├── agent-router.js        # Maps agent name → system prompt + model config
│   ├── conversation-store.js  # In-memory conversation history (per agent, per session)
│   └── media-handler.js       # File type detection, image→base64, audio→whisper pipeline
│
├── public/
│   ├── index.html             # Single page — the entire GUI
│   ├── styles.css             # One file. Dark theme. Palace identity.
│   ├── app.js                 # Main application logic, routing, state management
│   │
│   ├── components/
│   │   ├── chat-view.js       # Chat message list, streaming text renderer
│   │   ├── agent-selector.js  # Sidebar/dropdown agent picker with search
│   │   ├── status-panel.js    # Collapsible agent status cards (Claude Code style)
│   │   ├── media-drop.js      # Drag-and-drop overlay + file attachment bar
│   │   ├── home-dashboard.js  # Home screen with business access points
│   │   ├── input-bar.js       # Message input with send button, media attach, agent @mention
│   │   └── screensaver.js     # Trina tribute — activates on idle
│   │
│   └── assets/
│       ├── palace-logo.svg    # Concept E insignia
│       ├── trina.jpg          # Trina photo for screensaver (founder provides)
│       └── wallpaper.png      # Palace wallpaper (already exists: palace_wallpaper.png)
│
└── data/
    ├── agent-identities.json  # Symlink or copy from seeds/agent-identities.json
    └── system-prompts/        # Per-agent system prompts (loaded from agent-identities.json)
```

**Total: ~20 files.** No build step. `node server.js` and open `http://localhost:9000`.

---

## 2. PAGE / COMPONENT BREAKDOWN

### 2.1 Home Dashboard (`home-dashboard.js`)

The landing page. Shows everything the founder manages, organized by category. Not a chat — a command center.

```
┌──────────────────────────────────────────────────────┐
│  THE PALACE                           [Concept E]    │
│                                                      │
│  ┌─ STONE AI ──────┐  ┌─ BEST AI ──────┐           │
│  │ stone-ai.net    │  │ Mobile App     │           │
│  │ Admin Panel     │  │ Status: ~18wk  │           │
│  │ Vercel Deploy   │  │ Roadmap        │           │
│  │ Neon DB         │  └────────────────┘           │
│  │ Stripe          │                                │
│  └─────────────────┘  ┌─ TOOLS ────────┐           │
│                        │ tools.stone-ai │           │
│  ┌─ THE PALACE ────┐  │ Status: Launch │           │
│  │ GPU: 94% free   │  └────────────────┘           │
│  │ vLLM: Running   │                                │
│  │ Agents: 44      │  ┌─ QUICK ACTIONS ─┐          │
│  │ Whisper: Ready  │  │ [Chat]          │          │
│  │ Bridge: Active  │  │ [System Status] │          │
│  └─────────────────┘  │ [Deploy]        │          │
│                        └─────────────────┘          │
└──────────────────────────────────────────────────────┘
```

Cards are clickable. "Chat" navigates to the chat view. External links open in browser tabs. Palace status card auto-refreshes via WebSocket.

### 2.2 Chat View (`chat-view.js` + `input-bar.js`)

The primary interface. Full-screen chat with a selected agent.

```
┌─ Agent: Stone ──────────────────────── [≡ Agents] ──┐
│                                                      │
│  ┌─ Status ─────────────────────────────────── [v] ─┐
│  │  Stone analyzing pricing strategy                 │
│  │    ⠋ 3 tools · 1.2K tokens                       │
│  │    Reading seeds/stone-seeds.md                   │
│  └───────────────────────────────────────────────────┘
│                                                      │
│  ── Stone ──────────────────────────────────────     │
│  Here's the pricing analysis you requested...        │
│                                                      │
│  ── You ────────────────────────────────────────     │
│  Analyze current pricing strategy                    │
│                                                      │
│  ── Stone ──────────────────────────────────────     │
│  [Earlier message...]                                │
│                                                      │
├──────────────────────────────────────────────────────┤
│  [📎] Type a message... @agent_name     [Send ▶]    │
│  ┌ Attached: screenshot.png (245KB) [x] ┐           │
└──────────────────────────────────────────────────────┘
```

Key behaviors:
- **Streaming**: Tokens appear character-by-character as SSE events arrive. No waiting for full response.
- **Status panel**: Collapses to one line when idle. Expands during agent work. Exactly mirrors the Claude Code terminal style from `palace-status-engine.js`.
- **Agent switch**: Click the `[Agents]` button or type `@agentname` at the start of a message. Conversation history is per-agent.
- **Markdown rendering**: Messages render basic markdown (bold, code blocks, lists). Use a lightweight parser — no heavy library. DOMPurify for sanitization.
- **Auto-scroll**: Scrolls to bottom on new tokens. Pauses auto-scroll if user scrolls up.

### 2.3 Agent Selector (`agent-selector.js`)

Slide-out panel from the right (or a modal on smaller screens).

```
┌─ AGENTS ──────────────────────────┐
│  [Search agents...]               │
│                                   │
│  ── THREE HEADS ──                │
│  ● Stone (The Owner)              │
│  ● Cardinal (The Architect)       │
│  ○ Chaos (The Hidden Blade)       │
│                                   │
│  ── BUSINESS ──                   │
│  ○ Platform Onboarding            │
│  ○ Financial Analyst              │
│  ○ ...                            │
│                                   │
│  ── CREATIVE ──                   │
│  ○ Content Writer                 │
│  ○ Copywriter                     │
│  ○ ...                            │
│                                   │
│  44 agents · PRO tier             │
└───────────────────────────────────┘
```

- `●` = has conversation history this session. `○` = fresh.
- Search is instant client-side filter. Type "code" and see Code Assistant, Web Developer, etc.
- Categories pulled from `agent-identities.json` `category` field.
- Clicking an agent switches the chat view to that agent immediately.

### 2.4 Media Drop Zone (`media-drop.js`)

- Drag a file anywhere on the chat view — a full-screen overlay appears: "Drop to attach"
- Supported: images (png/jpg/webp/gif), documents (pdf/txt/md), audio (wav/mp3/m4a), video (mp4/webm)
- Images: converted to base64, sent to vision model (port 8001) alongside the text prompt
- Audio: sent to faster-whisper for transcription, transcript injected into the text prompt
- Documents: read as text, included in the prompt context
- Video: frame extraction (1 frame/sec), sent to vision model
- Attachments show as a bar below the input with filename, size, and [x] to remove

### 2.5 Status Panel (`status-panel.js`)

Mirrors the `StatusEngine` from `palace-status-engine.js`, but rendered in HTML instead of ANSI:

```html
<div class="status-panel collapsed">
  <div class="status-agent">
    <div class="status-header">Stone analyzing pricing strategy</div>
    <div class="status-stats">⠋ 3 tools · 1.2K tokens</div>
    <div class="status-detail">Reading seeds/stone-seeds.md</div>
  </div>
</div>
```

- Collapsed by default (shows one line: agent name + "working..." or "idle")
- Expands on click or automatically when agent is actively streaming
- Braille spinner animated via CSS or JS interval (same `SPIN` array from status engine)
- Updates via WebSocket from `/ws/status`

### 2.6 Screensaver / Trina Tribute (`screensaver.js`)

- Activates after 5 minutes of inactivity (configurable)
- Displays Trina's photo (if provided) with a subtle glow/pulse animation
- Palace wallpaper as background
- Concept E insignia watermark
- "The Palace — Built for the Family" text
- Any keyboard/mouse input dismisses it instantly
- If no Trina photo exists, shows Palace wallpaper + Concept E + clock

---

## 3. DATA FLOW

### 3.1 Chat Message Flow

```
User types message
        │
        ▼
[input-bar.js] ──POST──▶ /api/chat
        │                    │
        │                    ▼
        │              [routes/chat.js]
        │                    │
        │              Looks up agent system prompt
        │              via agent-router.js
        │                    │
        │              Builds OpenAI-format messages array:
        │              [{ role: "system", content: systemPrompt },
        │               ...conversationHistory,
        │               { role: "user", content: userMessage }]
        │                    │
        │              Has media attachments?
        │              ├─ YES: route to vLLM vision (port 8001)
        │              │       with image_url content blocks
        │              └─ NO: route to vLLM text (port 8000)
        │                    │
        │                    ▼
        │              [vllm-client.js]
        │              POST http://localhost:8000/v1/chat/completions
        │              { stream: true, ... }
        │                    │
        │                    ▼
        │              vLLM returns SSE stream:
        │              data: {"choices":[{"delta":{"content":"token"}}]}
        │                    │
        │              Server pipes each chunk as SSE to client:
        │              ◄──SSE──  event: token\ndata: {"content":"tok"}\n\n
        │                    │
        ▼                    ▼
[chat-view.js]         [status.js WebSocket]
 Appends token          Broadcasts status update:
 to message DOM         { agent, tokens, tools, detail }
        │                    │
        ▼                    ▼
 Message complete      [status-panel.js]
 Add to history         Updates spinner, stats
 Store in               Marks complete when
 conversation-store     stream ends
```

### 3.2 Media Upload Flow

```
User drops image onto chat
        │
        ▼
[media-drop.js]
 Reads file as ArrayBuffer
 Shows preview in attachment bar
        │
        ▼
User clicks Send (message + attachment)
        │
        ▼
[input-bar.js] ──POST multipart──▶ /api/upload
        │                              │
        │                              ▼
        │                        [routes/upload.js]
        │                        Saves to temp dir
        │                        Returns { fileId, type, url }
        │                              │
        ▼                              │
[input-bar.js] ──POST──▶ /api/chat    │
  { message, attachments: [fileId] }   │
        │                              │
        ▼                              ▼
  [routes/chat.js]               [media-handler.js]
   Resolves fileId                Detects type:
   to file path                   ├─ image → base64 encode → vision model
                                  ├─ audio → whisper STT → text transcript
                                  ├─ video → extract frames → vision model
                                  └─ doc → read text → inject into prompt
```

### 3.3 Agent Status Flow (WebSocket)

```
Client connects to ws://localhost:9000/ws/status
        │
        ▼
[status.js route]
 Registers client connection
        │
 During any /api/chat stream:
   On each token batch:
     broadcast({ type: "update", agent, tokens, detail })
   On stream complete:
     broadcast({ type: "complete", agent, summary })
   On error:
     broadcast({ type: "error", agent, message })
        │
        ▼
[status-panel.js]
 Receives WebSocket messages
 Updates DOM in real-time
```

---

## 4. API ROUTES

### 4.1 REST Endpoints

| Method | Path | Purpose | Request | Response |
|--------|------|---------|---------|----------|
| `GET` | `/` | Serve `index.html` | — | HTML |
| `GET` | `/api/agents` | List all 44 agents | — | `[{ slug, name, tier, category }]` |
| `GET` | `/api/agents/:slug` | Agent detail | — | `{ slug, name, tier, category, systemPrompt }` |
| `POST` | `/api/chat` | Send message, get streaming response | `{ agent, message, attachments?, history? }` | SSE stream |
| `POST` | `/api/upload` | Upload media file | `multipart/form-data` | `{ fileId, type, size, name }` |
| `GET` | `/api/system` | Palace system status | — | `{ gpu, vram, uptime, models, agents }` |
| `GET` | `/api/conversations/:agent` | Get conversation history for agent | — | `[{ role, content, timestamp }]` |
| `DELETE` | `/api/conversations/:agent` | Clear conversation history | — | `{ cleared: true }` |

### 4.2 WebSocket Endpoints

| Path | Purpose | Message Format |
|------|---------|---------------|
| `/ws/status` | Real-time agent status | `{ type: "update"|"complete"|"error", agent, tokens?, tools?, detail?, summary? }` |

### 4.3 SSE Stream Format (`/api/chat`)

```
event: token
data: {"content":"Hello"}

event: token
data: {"content":" world"}

event: status
data: {"tokens":42,"tools":1,"detail":"Processing request"}

event: done
data: {"totalTokens":1847,"model":"Qwen/Qwen2.5-32B-Instruct-AWQ"}

event: error
data: {"message":"vLLM connection refused","code":"VLLM_DOWN"}
```

---

## 5. KEY DESIGN DECISIONS

### 5.1 Why Fastify over Express

- 2-3x faster request handling (matters for streaming)
- Built-in JSON schema validation (no Zod dependency for this project)
- First-class WebSocket plugin (`@fastify/websocket`)
- Native TypeScript types without installing extra packages
- Encapsulated plugin system keeps routes clean

### 5.2 Why Vanilla JS over React

- Zero build step. Edit a file, refresh the browser.
- The OMEN does not need webpack/vite/turbopack for a local-only app.
- Web Components (`customElements.define`) give component encapsulation without a framework.
- Total JS payload stays under 50KB. React alone is 45KB gzipped.
- The Frontend Engineer can ship in hours, not days.

### 5.3 Why SSE over WebSocket for Chat

- SSE is unidirectional (server→client) which is exactly what streaming tokens requires.
- Native browser `EventSource` API — no library needed.
- Automatic reconnection built into the protocol.
- WebSocket is reserved for bidirectional status panel updates where the client may send control messages (expand/collapse, subscribe to specific agents).

### 5.4 Why In-Memory Conversation Store (Not a Database)

- This is a single-user local app. One founder, one machine.
- Conversations reset on server restart — acceptable for v1.
- No SQLite, no Redis, no Prisma. Just a `Map<agentSlug, Message[]>`.
- Future: persist to JSON files in `data/conversations/` if the founder wants history across restarts.

### 5.5 Styling Philosophy

- **One accent color**: Palace gold `#D4A84B` for active elements, highlights, the Concept E insignia.
- **Background**: `#1a1a1a` (near-black). Chat messages on `#242424`. Input bar on `#2a2a2a`.
- **Text**: `#e0e0e0` primary. `#888888` secondary/muted.
- **Font**: `"Berkeley Mono", "JetBrains Mono", "Fira Code", monospace` for chat. `"Inter", system-ui, sans-serif` for UI labels.
- **Density**: Claude Code density. Messages are tight — no 48px padding between them. Status panels are 3 lines. The sidebar is narrow. Information-dense, not social-media-airy.
- **No gradients, no shadows, no rounded cards.** Flat. Borders are `1px solid #333`. That is the visual vocabulary.

### 5.6 Agent Routing Logic

`agent-router.js` loads `agent-identities.json` on startup. When a chat request comes in:

1. Look up agent by slug
2. Return the agent's `systemPrompt` field
3. For the Three Heads (Stone, Cardinal, Chaos): prepend the shared context from `seeds/shared-context.md`
4. For vision-capable requests (has image attachment): route to port 8001 instead of 8000
5. For audio attachments: pipe through whisper first, then text model

The router does NOT make model decisions beyond text vs. vision. All text goes to Qwen 2.5 32B on port 8000. All vision goes to Qwen2.5-VL-7B on port 8001.

---

## 6. STARTUP AND DEPLOYMENT

### 6.1 Installation (One-Time)

```bash
cd C:\Users\admin\palace
mkdir palace-gui && cd palace-gui
npm init -y
npm install fastify @fastify/static @fastify/websocket @fastify/cors @fastify/multipart
```

That is the entire dependency list. Five packages.

### 6.2 Running

```bash
node server.js
# Palace GUI running on http://localhost:9000
```

### 6.3 Integration with Palace Startup

Add to `palace-startup.bat` (already exists in the Palace):
```bat
:: Palace GUI
start "Palace GUI" cmd /c "cd C:\Users\admin\palace\palace-gui && node server.js"
```

The GUI starts alongside vLLM, Open WebUI, and Palace Bridge. The founder opens `http://localhost:9000` in any browser.

---

## 7. IMPLEMENTATION PRIORITY (BUILD ORDER)

The Frontend Engineer and Chaos should build in this order. Each phase is independently testable.

| Phase | What | Files | Est. Time |
|-------|------|-------|-----------|
| **P1** | Server + chat streaming | `server.js`, `config.js`, `routes/chat.js`, `services/vllm-client.js`, `services/agent-router.js` | 2-3 hrs |
| **P2** | Basic chat UI | `index.html`, `styles.css`, `app.js`, `components/chat-view.js`, `components/input-bar.js` | 2-3 hrs |
| **P3** | Agent selector + routing | `routes/agents.js`, `components/agent-selector.js`, `services/conversation-store.js` | 1-2 hrs |
| **P4** | Status panel (WebSocket) | `routes/status.js`, `components/status-panel.js` | 1-2 hrs |
| **P5** | Media upload + drag-drop | `routes/upload.js`, `services/media-handler.js`, `components/media-drop.js` | 2-3 hrs |
| **P6** | Home dashboard | `components/home-dashboard.js`, `routes/system.js` | 1-2 hrs |
| **P7** | Screensaver + branding | `components/screensaver.js`, assets | 1 hr |
| **P8** | Whisper integration | `services/whisper-client.js` | 1 hr |

**Total estimate: 11-17 hours of build time.**

P1+P2 gets the founder chatting with an agent through the GUI. Everything after that is additive.

---

## 8. CONTRACTS BETWEEN COMPONENTS

These are the interfaces that the Frontend Engineer (client-side) and Chaos (server-side) must agree on. No deviation without Cardinal's review.

### 8.1 Chat Request (Client → Server)

```javascript
// POST /api/chat
{
  agent: "stone",                    // agent slug from agent-identities.json
  message: "Analyze pricing",        // user's text
  attachments: ["file_abc123"],      // optional, fileIds from /api/upload
}
```

### 8.2 Chat Response (Server → Client via SSE)

```javascript
// Each SSE event:
// event: token
// data: {"content":"partial text"}

// event: status
// data: {"tokens":142,"tools":0,"detail":"Generating response"}

// event: done
// data: {"totalTokens":1847,"model":"Qwen/Qwen2.5-32B-Instruct-AWQ","finishReason":"stop"}
```

### 8.3 Agent List (Server → Client)

```javascript
// GET /api/agents
[
  {
    slug: "stone",
    name: "Agent Stone",
    tier: "INTERNAL",
    category: "LEADERSHIP",
    description: "Head 1 — The Owner"
  },
  // ...43 more
]
```

### 8.4 Status Update (Server → Client via WebSocket)

```javascript
// ws://localhost:9000/ws/status
{
  type: "update",       // "update" | "complete" | "error"
  agent: "stone",       // agent slug
  tokens: 847,          // cumulative tokens this response
  tools: 2,             // cumulative tool calls
  detail: "Reading pricing data"  // current activity hint
}
```

### 8.5 Upload Response (Server → Client)

```javascript
// POST /api/upload → multipart/form-data
{
  fileId: "file_abc123",
  type: "image",         // "image" | "audio" | "video" | "document"
  size: 245000,
  name: "screenshot.png"
}
```

---

## 9. WHAT THIS SPEC DOES NOT COVER (Post-v1)

- Authentication (it is a local app — no auth needed for v1)
- Persistent conversation history across server restarts
- Multi-user access
- Custom agent creation through the GUI
- Tool use visualization (showing which tools the agent called)
- Mobile-responsive layout (this runs on the OMEN's monitors)
- TTS / voice output
- Three-head simultaneous dispatch from the GUI (v1 is one agent at a time)

---

## 10. FILE OWNERSHIP MAP (For Dispatch)

| Specialist | Owns | Does Not Touch |
|---|---|---|
| **Frontend Engineer** | `public/**` (all client files: HTML, CSS, JS, components) | `routes/`, `services/`, `server.js` |
| **Chaos** | `server.js`, `config.js`, `routes/**`, `services/**`, `package.json`, `data/` | `public/**` |
| **Cardinal** | This spec. Architecture review. Interface contracts. | Code files (read-only) |

No file is owned by two builders. If a contract needs to change, Cardinal arbitrates.

---

**END OF SPEC**

Cardinal's assessment: This is a clean, buildable architecture. Five npm dependencies. Twenty files. No build step. P1+P2 gets a working chat interface in under 6 hours. The rest is incremental. The contracts in Section 8 are the handshake between Frontend Engineer and Chaos — they build in parallel as long as they honor those interfaces.

Frontend Engineer: Start at P2. Build the client against the contract in Section 8. Mock the SSE stream until Chaos has P1 running.

Chaos: Start at P1. Get `server.js` serving and `/api/chat` streaming from vLLM. The Frontend Engineer will connect to you.

Build it.
