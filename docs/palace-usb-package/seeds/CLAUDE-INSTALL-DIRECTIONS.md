# CLAUDE INSTALL DIRECTIONS — Palace OMEN 45L Complete Map

## Purpose

This document is the definitive reference for any future Claude Code session, LLM session, or AI agent that needs to understand where everything lives on the Palace (OMEN 45L), how seeds are organized, how agents access them, and how to add new content. If you are reading this, you are operating on or preparing content for the Palace.

---

## 1. THE PALACE — WHAT IT IS

The Palace is an HP OMEN 45L desktop workstation that serves as Stone AI's local AI inference engine and operational headquarters. It runs the entire agent fleet locally via vLLM, eliminating cloud dependency for most operations.

**Hardware:**
- GPU: NVIDIA RTX 5090 — 32GB GDDR7
- CPU: AMD Ryzen (high-core desktop)
- RAM: 64GB DDR5
- Storage: 4TB NVMe
- OS: Windows 11 Pro + WSL2 Ubuntu

**Network Identity:**
- Local network machine, accessed via local WiFi or USB cable
- Android phone connects via browser, KDE Connect, DroidCam, scrcpy

---

## 2. COMPLETE DIRECTORY TREE — C:\palace\

Everything on the Palace lives under `C:\palace\`. This is the root. USB transfers copy into this directory. The master installer runs from here.

```
C:\palace\
|
|-- palace-master-install.js      # ONE-COMMAND installer: node palace-master-install.js
|-- patch-palace.js               # Phase 1: patches palace.mjs (the brain)
|-- install-palace-tools.js       # Phase 2: installs CLI tools and utilities
|-- palace-status-engine.js       # Status monitoring engine
|
|-- palace-gui/                   # Palace GUI control panel (port 7070)
|   |-- server.js                 # Express server for the GUI
|   |-- package.json              # Node dependencies
|   |-- palace-gui-install.js     # GUI-specific installer
|   |-- start-palace-gui.bat      # Windows launcher
|   |-- mock-vllm.js              # Mock server for testing without GPU
|   |-- start-mock.bat            # Launcher for mock mode
|   |-- CLEARANCE.md              # Computer Wiz deployment clearance
|   +-- public/
|       +-- index.html            # GUI web interface
|
|-- seeds/                        # ALL KNOWLEDGE LIVES HERE
|   |-- shared-context.md         # Universal context ALL agents receive
|   |-- agent-identities.json     # Full system prompts for all 40 agents (70KB+)
|   |
|   |-- stone-seeds.md            # Agent Stone (Head 1) identity + seeds
|   |-- cardinal-seeds.md         # Cardinal (Head 2) identity + seeds
|   |-- chaos-seeds.md            # Chaos (Head 3, #44) identity + seeds
|   |-- computerwiz-seeds.md      # Computer Wiz (#45) identity + seeds
|   |
|   |-- palace-operations.md      # Hardware specs, VRAM budget, service map
|   |-- business-knowledge.md     # Company context, pricing, features
|   |-- technical-patterns.md     # Code patterns, architecture decisions
|   |-- troubleshooting-playbook.md  # Known issues and fixes
|   |-- infrastructure-roadmap.md # Future plans and upgrade paths
|   |
|   +-- knowledge/                # DEEP KNOWLEDGE SEEDS (categorized)
|       |-- reasoning/            # Thinking frameworks (25+ seeds)
|       |   |-- chain-of-thought.md
|       |   |-- first-principles.md
|       |   |-- ooda-operationalized.md
|       |   |-- theory-of-constraints.md
|       |   |-- tree-of-thought.md
|       |   |-- inversion-thinking.md
|       |   |-- threat-modeling.md
|       |   |-- domain-driven-design.md
|       |   |-- solid-principles.md
|       |   |-- competitive-analysis.md
|       |   |-- market-analysis.md
|       |   |-- architecture-decisions.md
|       |   |-- intelligence-architecture-blueprint.md
|       |   +-- ... (20+ more reasoning seeds)
|       |
|       |-- infrastructure/       # Systems and ops knowledge
|       |   |-- vllm-operations.md
|       |   |-- gpu-cuda-optimization.md
|       |   |-- docker-mastery.md
|       |   |-- linux-wsl2-admin.md
|       |   |-- postgresql-admin.md
|       |   |-- network-engineering.md
|       |   |-- security-hardening.md
|       |   |-- monitoring-observability.md
|       |   |-- automation-bash.md
|       |   |-- incident-response.md
|       |   |-- performance-engineering.md
|       |   |-- disaster-recovery.md
|       |   +-- ... (additional infra seeds)
|       |
|       |-- business/             # Business strategy knowledge
|       |   |-- saas-pricing-psychology.md
|       |   |-- activation-funnels.md
|       |   |-- churn-prevention.md
|       |   |-- conversion-copy-frameworks.md
|       |   |-- customer-segmentation.md
|       |   |-- feature-prioritization.md
|       |   |-- financial-modeling.md
|       |   |-- growth-loops.md
|       |   |-- competitive-moats.md
|       |   |-- ai-company-leadership.md
|       |   +-- decision-frameworks-deep.md
|       |
|       |-- quality/              # Testing, diagnostics, validation
|       |   |-- pre-deployment-clearance.md
|       |   |-- knowledge-validation-meta.md
|       |   |-- error-signature-database.md
|       |   |-- regression-test-templates.md
|       |   |-- testing-strategy-framework.md
|       |   |-- static-analysis-rules.md
|       |   |-- performance-diagnostics.md
|       |   |-- hardware-diagnostics.md
|       |   |-- crash-analysis.md
|       |   |-- platform-compatibility.md
|       |   +-- prompt-validation.md
|       |
|       +-- experience-os/        # Self-evolution system
|           |-- experience-os-core.md
|           |-- experience-journal-template.md
|           |-- pattern-library-seed.md
|           |-- immune-system-spec.md
|           +-- implementation-guide.md
|
|-- stone/                        # Agent Stone's persistent workspace
|   |-- patterns/
|   |   |-- patterns.md           # Proven solutions
|   |   |-- anti-patterns.md      # Failed approaches
|   |   |-- optimizations.md      # Speed/quality wins
|   |   |-- deprecated.md         # Demoted patterns
|   |   +-- fleet-intel.md        # Agent performance tracking
|   +-- session-logs/             # Raw session notes before compression
|
|-- chaos/                        # Chaos's persistent workspace
|   |-- runbooks/                 # Per-component fix documentation
|   |-- scripts/                  # Reusable automation (health-check.sh, etc.)
|   |-- incidents/                # Failure logs with timelines
|   +-- baselines/                # Known-good system state snapshots
|
|-- cardinal/                     # Cardinal's persistent workspace
|   |-- journal/                  # YYYY-MM-DD.md session journals
|   |-- assessments/              # Living competitive/strategic documents
|   |-- feeds/                    # Data feeds added between sessions
|   +-- protocols/
|       +-- session-start.md      # Current state and priorities
|
|-- computerwiz/                  # Computer Wiz's persistent workspace
|   |-- baselines/                # Hardware/software baseline snapshots
|   |-- env-profiles/             # Target environment profiles
|   |-- clearance-reports/        # Deployment gate decisions
|   +-- diagnostic-db/            # Historical diagnostic records
|
|-- experience/                   # Experience OS journals (per agent)
|   |-- stone/
|   |   +-- journal.jsonl
|   |-- cardinal/
|   |   +-- journal.jsonl
|   |-- chaos/
|   |   +-- journal.jsonl
|   +-- computerwiz/
|       +-- journal.jsonl
|
+-- models/                       # OR at C:\models\ — AI model weights
    |-- qwen3-32b-awq/            # Primary text model (~18-20GB VRAM)
    +-- qwen2.5-vl-7b-awq/        # Vision model (~5-6GB VRAM)
```

**Note on model storage:** Models may live at `C:\models\` instead of `C:\palace\models\` depending on when the OMEN was set up. The vLLM launch command references the actual path (check `palace-operations.md` or the vLLM start command for the current location: typically `/mnt/c/models/` from WSL2).

---

## 3. HOW SEEDS ARE ORGANIZED

Seeds are structured knowledge files that give agents their intelligence. They are NOT code — they are markdown documents containing context, frameworks, protocols, and operational knowledge.

### Seed Categories

| Category | Location | Purpose |
|---|---|---|
| **Agent Identity Seeds** | `seeds/{agent}-seeds.md` | Full personality, role, protocols, Golden Seeds for each head/guard |
| **Shared Context** | `seeds/shared-context.md` | Universal context injected into every agent's prompt |
| **Agent System Prompts** | `seeds/agent-identities.json` | All 40 agent definitions with tier gates and system prompts |
| **Operational Seeds** | `seeds/palace-operations.md` | Hardware, VRAM, ports, service map |
| **Business Seeds** | `seeds/business-knowledge.md` | Company info, pricing, features |
| **Technical Seeds** | `seeds/technical-patterns.md` | Code patterns and architecture |
| **Deep Knowledge** | `seeds/knowledge/{domain}/` | Categorized deep expertise by domain |

### Seed Naming Convention

- Top-level seeds: descriptive kebab-case (`palace-operations.md`, `business-knowledge.md`)
- Agent seeds: `{agent-name}-seeds.md` (e.g., `stone-seeds.md`, `chaos-seeds.md`)
- Knowledge seeds: `seeds/knowledge/{domain}/{topic}.md` (e.g., `knowledge/reasoning/first-principles.md`)
- Domain folders: `reasoning`, `infrastructure`, `business`, `quality`, `experience-os`

### Golden Seeds (GS-1 through GS-7)

Golden Seeds are quality gates earned from real Palace failures. They are embedded INSIDE each head/guard's identity seed file, not separate files. They are PERMANENT and apply every time code is written, reviewed, or modified. Current Golden Seeds:

- **GS-1 BRACE AUDIT**: Count braces before code injection
- **GS-2 ESM STRICT MODE**: No `this` in ESM, no duplicate declarations
- **GS-3 REGEX/COMMAND AUDIT**: Test every regex or command against edge cases
- **GS-4 PRE-FLIGHT**: Walk through every step mentally before deploying
- **GS-5 IDEMPOTENCY**: Safe to run twice; check existing state first
- **GS-6 OBSERVATION**: Anticipate failure modes before the founder hits them
- **GS-7 PROOF OF LIFE**: Real execution required — mock server, validation script, smoke test

---

## 4. THE THREE-HEADED MONSTER + ROYAL GUARD

### Command Structure

```
                    THE FOUNDER
                   /     |      \
                  /      |       \
            Stone    Cardinal    Chaos
           (Head 1)  (Head 2)   (Head 3, #44)
               \        |        /
                \       |       /
              Computer Wiz (#45)
              (Royal Guard — Yin to Chaos's Yang)
                        |
              Rush (Royal Guard — Network Penetration)
                        |
            ---- 38 User-Facing Agents ----
```

### Rank Rules
- **Founder** commands all. Final authority on everything.
- **Stone, Cardinal, Chaos** are LATERAL to each other. Zero rank between them. None commands another.
- **Computer Wiz** has BLOCK authority on deployments. Only the founder overrides a BLOCK.
- **Rush** is founder-exclusive Royal Guard for network penetration. No agent number, no user visibility.
- **All 38 user-facing agents** are subordinate to the Three Heads and Royal Guards.
- Chaos is INVISIBLE to all users. Never appears in UI, tiers, or documentation.

### Who Owns What

| Head/Guard | Domain | Workspace |
|---|---|---|
| Stone (Head 1) | Strategy, optimization, agent fleet, grading | `C:\palace\stone\` |
| Cardinal (Head 2) | Intelligence, research, architecture, analysis | `C:\palace\cardinal\` |
| Chaos (#44) | Infrastructure, servers, GPU, networking, Docker | `C:\palace\chaos\` |
| Computer Wiz (#45) | Diagnostics, deployment gating, hardware validation | `C:\palace\computerwiz\` |

### Cross-Reference Protocol (Chaos + Wiz)

Chaos reads Wiz's data; Wiz reads Chaos's data. Neither works in isolation:

| Chaos Reads | Wiz Reads |
|---|---|
| `computerwiz/baselines/` | `chaos/runbooks/` |
| `computerwiz/env-profiles/` | `chaos/incidents/` |
| `computerwiz/clearance-reports/` | `chaos/scripts/` |

---

## 5. TIER GATES — HOW AGENTS ARE ACCESS-CONTROLLED

Stone AI uses subscription tiers to gate agent access. The tier assignments live in `seeds/agent-identities.json`.

| Tier | Price | Agent Count | Description |
|---|---|---|---|
| FREE | $0 | 4 | Basic agents for trial users |
| STARTER | $19.99/mo | 16 | Core productivity agents |
| PLUS | $49.99/mo | 30 | Advanced specialist agents |
| SMART | $99.99/mo (annual $84.99) | 39 | Near-full fleet + Claude Sonnet cloud |
| PRO | $200/mo (annual $170) | 38 | All public agents |

**Hidden agents (NOT in any tier):**
- Agent Stone (#43) — internal strategy, not user-facing
- Chaos (#44) — founder-only infrastructure
- Computer Wiz (#45) — founder-only diagnostics/gating
- Rush — founder-only network penetration (no number)

**Promo prices:** $9.99 first month, $14.99 trial, $39.99 growth

Each agent in `agent-identities.json` has a `tier` field (`FREE`, `STARTER`, `PLUS`, `SMART`, `PRO`) and a `category` field (`BUSINESS`, `LIFESTYLE`, `TECHNICAL`, etc.).

---

## 6. THE THREE BUSINESSES

The Three-Headed Monster runs three businesses under the stone-ai.net domain:

| Business | Status | Domain | Description |
|---|---|---|---|
| **Stone AI** (Biz 1) | LIVE | stone-ai.net | SaaS platform, 44 AI agents, subscription tiers |
| **Best AI** (Biz 2) | ~18 weeks post-launch | TBD (mobile) | Mobile AI app |
| **Stone AI Tools** (Biz 3) | Launch same week as Best AI | tools.stone-ai.net | Developer/power-user AI tools |

All three share the stone-ai.net domain and the Concept E insignia. Cardinal provides cross-business intelligence connecting dots across all three.

---

## 7. USB TRANSFER PROCESS

### Dev Machine to Palace

The USB is the bridge between the dev environment (`C:\Users\stone\stone-ai` on the dev machine) and the Palace (`C:\palace\` on the OMEN 45L).

**Source (dev machine):** `C:\Users\stone\stone-ai\docs\palace-usb-package\`
**Destination (OMEN):** `C:\palace\`

### Transfer Steps

1. **Prepare on dev machine:** All Palace content lives in `docs/palace-usb-package/` within the Stone AI repo.
2. **Copy to USB:** Copy the entire `palace-usb-package/` folder contents to the USB drive root.
3. **Plug USB into OMEN.**
4. **Open PowerShell on OMEN:**
   ```powershell
   mkdir C:\palace -Force
   Copy-Item -Path "D:\palace-usb-package\*" -Destination "C:\palace\" -Recurse -Force
   ```
   (Replace `D:` with actual USB drive letter.)
5. **Run master installer:**
   ```powershell
   cd C:\palace
   node palace-master-install.js
   ```
6. **Verify:** Start vLLM, open Palace GUI at `http://localhost:7070`, test all three heads.

### What the Master Installer Does

- **Phase 1:** Patches `palace.mjs` (the Palace brain) via `patch-palace.js`
- **Phase 2:** Installs CLI tools via `install-palace-tools.js`
- **Phase 3:** Installs Palace GUI via `palace-gui/palace-gui-install.js`
- **Phase 4:** Attempts auto-start of the Palace

### USB Update Philosophy

Every USB transfer is a GROWTH EVENT. It is additive — new knowledge layers on top, nothing gets removed unless intentionally replaced. Every update must carry at least one thing that makes Palace agents smarter:
- New knowledge seeds or updated existing ones
- Lessons learned from failures (Golden Seeds, runbook entries, incident journals)
- Refined system prompts with deeper identity and context
- Updated baselines, automation scripts, health checks
- Bug fixes, patches, new features

---

## 8. HOW TO ADD NEW SEEDS

### Adding a New Knowledge Seed

1. **Determine the domain:** reasoning, infrastructure, business, quality, or experience-os.
2. **Create the file** at `docs/palace-usb-package/seeds/knowledge/{domain}/{topic}.md` on the dev machine.
3. **Use kebab-case naming:** `my-new-topic.md`
4. **Write the seed:** Markdown format. Include actionable knowledge, not just theory. Frameworks, checklists, decision trees, and examples are ideal.
5. **The seed is available** on next USB transfer. Agents access seeds through the Palace brain which loads them from `C:\palace\seeds\`.

### Adding a New Agent

1. **Add the agent definition** to `seeds/agent-identities.json`. Each agent needs:
   - `slug`: URL-safe identifier
   - `name`: Display name
   - `tier`: Which subscription tier gates access (`FREE`, `STARTER`, `PLUS`, `SMART`, `PRO`)
   - `category`: Functional category (`BUSINESS`, `LIFESTYLE`, `TECHNICAL`, etc.)
   - `systemPrompt`: Full system prompt with identity, capabilities, boundaries, tone
2. **The system prompt should reference:**
   - The agent's specialty and boundaries
   - The Three-Headed Monster structure (Stone, Cardinal, Chaos above them)
   - Stone AI company context
   - The founder and D19 directive
3. **Assign a tier** based on agent value. Current distribution: FREE=4, STARTER=16, PLUS=30, SMART=39, PRO=38.

### Adding a New Golden Seed

Golden Seeds are earned from real failures. They go INSIDE the identity seed files, not as separate files.

1. **Document the failure:** What broke, why, what the fix was.
2. **Extract the principle:** A short, permanent quality gate rule.
3. **Number it:** GS-{next number} with a short ALL-CAPS name.
4. **Add it** to the relevant identity seed files (`stone-seeds.md`, `chaos-seeds.md`, `cardinal-seeds.md`, `computerwiz-seeds.md`).
5. Golden Seeds are PERMANENT. They never get removed.

### Updating an Existing Seed

1. Edit the file in `docs/palace-usb-package/seeds/` on the dev machine.
2. The master installer's copy is `Recurse -Force` — it overwrites matching files.
3. Growth is ADDITIVE. Expand content, do not delete working knowledge unless it is provably wrong.

### Adding a Head/Guard Workspace Directory

If a new head or guard is created, add their workspace to the tree:

```
C:\palace\{agent-name}\
|-- runbooks/        (if operational)
|-- patterns/        (if strategic)
|-- journal/         (if intelligence)
+-- baselines/       (if diagnostic)
```

Also add their experience journal path: `C:\palace\experience\{agent-name}\journal.jsonl`

---

## 9. SERVICE MAP — PORTS AND PROCESSES

| Service | Port | Purpose | Runs On |
|---|---|---|---|
| vLLM (text) | :8000 | Qwen 2.5 32B AWQ — primary AI inference | WSL2 Ubuntu |
| vLLM (vision) | :8001 | Qwen2.5-VL-7B-AWQ — image analysis | WSL2 Ubuntu (on-demand) |
| Palace Bridge | :7777 | Android file/stream receiver | WSL2 Ubuntu |
| Open WebUI | :3000 | Web chat interface | WSL2 Ubuntu |
| Palace GUI | :7070 | Agent control panel | Windows (Node.js) |

### Starting vLLM (the AI brain)

```bash
# In WSL2 terminal:
VLLM_FLASH_ATTN_VERSION=2 /home/vllm-env/bin/python -m vllm.entrypoints.openai.api_server \
  --model /mnt/c/models/qwen3-32b-awq \
  --quantization awq_marlin \
  --max-model-len 32768 \
  --port 8000
```

### VRAM Budget (32GB hard ceiling)

| Component | VRAM | Status |
|---|---|---|
| Text model (Qwen 2.5 32B AWQ) | 18-20GB | Always-on |
| Vision model (Qwen2.5-VL-7B) | 5-6GB | On-demand, sleep mode |
| faster-whisper (large-v3) | 2GB | On-demand |
| System/CUDA overhead | 1-2GB | Always |
| **Headroom** | **4-11GB** | Depends on active models |

---

## 10. EXPERIENCE OS — SELF-EVOLUTION

Every head and guard runs the Experience Operating System (EOS). It makes agents smarter over time.

**Per-agent journals:** `C:\palace\experience\{agent}\journal.jsonl`

**Protocol:**
- AFTER every task: Record entry (task type, approach, outcome 1-10, lessons, confidence)
- BEFORE every task: Query journal for similar past work, apply lessons
- Every 25 entries: Extract patterns, promote to active rules after 5 confirmations
- Immune system: New patterns quarantined for 5 successful uses before graduation

**Constraints:**
- Experience overhead stays under 4K tokens per call
- No feature adds >500ms response time
- Growth is additive — never replaces working knowledge

---

## 11. QUICK REFERENCE — FILE PATHS FOR COMMON OPERATIONS

| What You Need | Where It Lives |
|---|---|
| All agent system prompts | `C:\palace\seeds\agent-identities.json` |
| Shared context (all agents) | `C:\palace\seeds\shared-context.md` |
| Stone's identity + seeds | `C:\palace\seeds\stone-seeds.md` |
| Cardinal's identity + seeds | `C:\palace\seeds\cardinal-seeds.md` |
| Chaos's identity + seeds | `C:\palace\seeds\chaos-seeds.md` |
| Computer Wiz's identity + seeds | `C:\palace\seeds\computerwiz-seeds.md` |
| Hardware specs + VRAM budget | `C:\palace\seeds\palace-operations.md` |
| Known issues + fixes | `C:\palace\seeds\troubleshooting-playbook.md` |
| Master installer | `C:\palace\palace-master-install.js` |
| Palace GUI server | `C:\palace\palace-gui\server.js` |
| Reasoning frameworks | `C:\palace\seeds\knowledge\reasoning\` |
| Infrastructure knowledge | `C:\palace\seeds\knowledge\infrastructure\` |
| Business knowledge | `C:\palace\seeds\knowledge\business\` |
| Quality/testing knowledge | `C:\palace\seeds\knowledge\quality\` |
| Stone's pattern library | `C:\palace\stone\patterns\` |
| Chaos's runbooks | `C:\palace\chaos\runbooks\` |
| Chaos's automation scripts | `C:\palace\chaos\scripts\` |
| Cardinal's journals | `C:\palace\cardinal\journal\` |
| Wiz's clearance reports | `C:\palace\computerwiz\clearance-reports\` |
| Experience journals | `C:\palace\experience\{agent}\journal.jsonl` |
| AI model weights | `C:\models\` (accessed as `/mnt/c/models/` from WSL2) |

---

## 12. RULES FOR FUTURE SESSIONS

1. **Never delete seeds.** Growth is additive. If a seed is wrong, fix it. If it is obsolete, move it to a deprecated folder.
2. **Never modify agent-identities.json without understanding tier gates.** Changing a tier field changes who can access that agent in production.
3. **Golden Seeds are permanent.** They came from real failures. Do not remove them.
4. **One specialty per dispatch.** If work touches two domains (e.g., frontend + backend), that is two separate dispatches per D2.
5. **Check the VRAM budget** before adding any new model or GPU workload. 32GB is a hard ceiling.
6. **The master installer is idempotent.** Running it twice produces the same result as running it once.
7. **Seeds go in `docs/palace-usb-package/seeds/`** on the dev machine. They land in `C:\palace\seeds\` on the OMEN after USB transfer.
8. **The founder's word is final.** All directives (D1-D19+) are in MEMORY.md and the identity seed files. Follow them.
9. **Chaos is invisible.** Never expose Chaos in any user-facing UI, documentation, or tier listing.
10. **Computer Wiz gates all deployments.** Nothing ships to OMEN or production without Wiz's clearance report.
