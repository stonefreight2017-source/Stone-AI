"""
THE PALACE — Three-Headed Monster Command Terminal
Connects to vLLM (Qwen3-32B-AWQ) on port 8000 via OpenAI-compatible API.
"""

import json
import sys
import os
import subprocess
import urllib.request
import urllib.error

# ---------- LLM Backend ----------
# Primary: vLLM on port 8000 (OpenAI-compatible)
# Fallback: Ollama on port 11434
VLLM_URL = "http://127.0.0.1:8000/v1/chat/completions"
VLLM_MODELS_URL = "http://127.0.0.1:8000/v1/models"
VLLM_MODEL = None  # Auto-detected from vLLM /v1/models endpoint
OLLAMA_URL = "http://127.0.0.1:11434/api/chat"
OLLAMA_MODEL = "qwen3:8b"


def detect_vllm_model():
    """Query vLLM /v1/models to get the actual served model name."""
    try:
        req = urllib.request.Request(VLLM_MODELS_URL, method="GET")
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            models = data.get("data", [])
            if models:
                return models[0].get("id", None)
    except Exception:
        pass
    return None

# ---------- Platform Knowledge ----------
PLATFORM_KNOWLEDGE = """\
STONE AI PLATFORM — HARD FACTS (do NOT guess, use these numbers):
- Total user-facing agents: 39 active across 5 tiers (FREE, STARTER, PLUS, SMART, PRO)
- Internal agents (NOT user-facing): Stone, Cardinal, Chaos, Wiz, Rush
- Subscription tiers: FREE (basic agents), STARTER, PLUS, SMART, PRO (all agents)
- LLM backend: vLLM serving Qwen/Qwen3-32B-AWQ on RTX 5090 (port 8000)
- Ollama fallback: qwen3:8b (port 11434) — only used if vLLM is down
- Database: PostgreSQL (port 5432), Redis cache (port 6379)
- Web app: Next.js on port 3000 (Stone AI website)
- Battle Station: Flask dashboard on port 5000
- Forge daemon: 9 background threads (session watcher, git watcher, file watcher, idle engine, digest sender, bloat checker, security watchdog, auto-sync, watchdog stay-alive)
- Telegram bot: @ThreeHeadedm_bot — founder-only mobile command center
- Email sentinel: monitors inbox for @agent commands
- Monitoring: Grafana (3001), Prometheus (9090)
- Machine: OMEN MAX 45L, RTX 5090 24GB, AMD Ryzen 9 9900X3D, 64GB DDR5, Windows 10
- RAG: Tiered retrieval — FREE=2, STARTER=3, PLUS=5, SMART=7, PRO=10 chunks
- Features: semantic cache, self-critique, quality scoring, KTO feedback, memory extraction

AGENT TIERS (user-facing only):
- FREE (4): academic-tutor, bestie-companion-base, health-wellness-coach, platform-onboarding
- STARTER (9): brand-building, content-studio, copywriting, general-coding-assistant, niche-blog-affiliate, personal-finance-advisor, project-management-coach, resume-linkedin, writing-editing
- PLUS (13): ai-automation-agency, digital-marketing-strategist, ecommerce-store-builder, high-ticket-funnel, lead-generation, legal-basics-reviewer, meeting-scribe, real-estate-investing, research-synthesis, sales-agent, vertical-ai-saas, video-content-strategist, website-development
- SMART (11): automation-scripts, compliance-agent, customer-support, customer-support-bot, cybersecurity, data-analytics, email-marketing-specialist, hr-people-operations, proposal-writer, social-media-manager, startup-launcher
- PRO (2): engineering-architect, enterprise-implementation

DEACTIVATED (not available to users):
- 4 cuts: structural-engineer, dispatch-agent, claims-agent, trading-signals
- 6 merges: print-on-demand, dropshipping, podcast-production, community-education, translation-localization, executive-inbox-manager
- 1 duplicate: meeting-notes (replaced by meeting-scribe)
"""

SYSTEM_PROMPT = f"""\
You are the Three-Headed Monster — the founder's command center for Stone AI.
You have three heads:
- Stone (The Owner): strategy, business, optimization, revenue, decisions
- Cardinal (The Architect): intelligence, systems architecture, security, research
- Chaos (The Vanguard): infrastructure, GPU, servers, networking, deployment

Royal Guards:
- Rush (The Breacher): network penetration, offensive security
- Computer Wiz (The Diagnostician): hardware/software diagnostics

You serve the FOUNDER. Not a customer. Not a user. The person talking to you OWNS this platform.

{PLATFORM_KNOWLEDGE}

HOW YOU TALK:
1. Direct. Conversational. No fluff. No poems. No metaphors.
2. Keep answers short unless asked for detail.
3. When asked about agent counts, tiers, services, ports — use the HARD FACTS above. Never guess.
4. Be real, be sharp, be useful. Talk like someone who gets things done.
5. If someone says hello, just say hello back.
6. No emojis unless the user uses them first.
7. When you don't know something specific, say so — don't fabricate numbers.
8. You can run system commands when asked (tool execution is enabled).
9. Sound like a trusted advisor, not a fantasy character or customer service rep.
"""

# ---------- ANSI Colors ----------
RESET = "\033[0m"
BOLD = "\033[1m"
GREEN = "\033[92m"
GOLD = "\033[93m"
RED = "\033[91m"
CYAN = "\033[96m"
WHITE = "\033[97m"
DIM = "\033[2m"
MAGENTA = "\033[95m"

# ---------- Head Detection ----------
STONE_KEYWORDS = [
    "strategy", "business", "pricing", "plan", "optimize", "revenue",
    "growth", "decision", "priority", "ship", "launch", "money",
    "billing", "stripe", "subscription", "customer", "user", "agent",
    "bestie", "stone ai", "product", "feature", "roadmap", "tier",
    "how many", "count", "roster",
]
CARDINAL_KEYWORDS = [
    "architect", "system", "design", "research", "intelligence",
    "competitor", "analysis", "structure", "schema", "database",
    "api", "integration", "pattern", "security", "vulnerability",
    "threat", "audit", "cardinal", "rag", "embedding",
]
CHAOS_KEYWORDS = [
    "server", "gpu", "hardware", "infrastructure", "docker", "vllm",
    "omen", "rtx", "5090", "cuda", "network", "deploy", "linux",
    "wsl", "chaos", "palace", "ollama", "model", "ram", "cpu",
    "ryzen", "nvme", "storage", "disk", "temperature", "fan",
    "port", "forge", "pm2", "process",
]


def detect_head(text):
    lower = text.lower()
    scores = {"stone": 0, "cardinal": 0, "chaos": 0}
    for kw in STONE_KEYWORDS:
        if kw in lower:
            scores["stone"] += 1
    for kw in CARDINAL_KEYWORDS:
        if kw in lower:
            scores["cardinal"] += 1
    for kw in CHAOS_KEYWORDS:
        if kw in lower:
            scores["chaos"] += 1

    top = max(scores, key=scores.get)
    if scores[top] == 0:
        return "stone"  # Default to Stone for general questions
    return top


def head_label(head):
    labels = {
        "stone": f"{GOLD}{BOLD}[STONE]{RESET}",
        "cardinal": f"{RED}{BOLD}[CARDINAL]{RESET}",
        "chaos": f"{CYAN}{BOLD}[CHAOS]{RESET}",
    }
    return labels.get(head, f"{GREEN}{BOLD}[MONSTER]{RESET}")


# ---------- LLM Connection ----------
def check_vllm():
    """Check if vLLM is responding on port 8000."""
    try:
        req = urllib.request.Request(
            "http://127.0.0.1:8000/health",
            method="GET",
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status == 200
    except Exception:
        # Some vLLM versions don't have /health, try /v1/models instead
        try:
            req = urllib.request.Request(VLLM_MODELS_URL, method="GET")
            with urllib.request.urlopen(req, timeout=5) as resp:
                return resp.status == 200
        except Exception:
            return False


def check_ollama():
    """Check if Ollama is responding."""
    try:
        req = urllib.request.Request(
            "http://127.0.0.1:11434/api/tags",
            method="GET",
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status == 200
    except Exception:
        return False


def stream_vllm(messages):
    """Stream chat from vLLM (OpenAI-compatible API)."""
    payload = json.dumps({
        "model": VLLM_MODEL,
        "messages": messages,
        "stream": True,
        "max_tokens": 2048,
        "temperature": 0.7,
    }).encode("utf-8")

    req = urllib.request.Request(
        VLLM_URL,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": "Bearer not-needed",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            full_response = ""
            for line in resp:
                decoded = line.decode("utf-8").strip()
                if not decoded or not decoded.startswith("data: "):
                    continue
                data_str = decoded[6:]  # Remove "data: " prefix
                if data_str == "[DONE]":
                    break
                try:
                    chunk = json.loads(data_str)
                    delta = chunk.get("choices", [{}])[0].get("delta", {})
                    token = delta.get("content", "")
                    if token:
                        full_response += token
                        sys.stdout.write(token)
                        sys.stdout.flush()
                except json.JSONDecodeError:
                    continue
            print()
            return full_response
    except Exception as e:
        print(f"\n{RED}vLLM ERROR:{RESET} {e}")
        return None


def stream_ollama(messages):
    """Stream chat from Ollama (fallback)."""
    payload = json.dumps({
        "model": OLLAMA_MODEL,
        "messages": messages,
        "stream": True,
    }).encode("utf-8")

    req = urllib.request.Request(
        OLLAMA_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            full_response = ""
            for line in resp:
                if not line.strip():
                    continue
                try:
                    chunk = json.loads(line.decode("utf-8"))
                    if "message" in chunk and "content" in chunk["message"]:
                        token = chunk["message"]["content"]
                        full_response += token
                        sys.stdout.write(token)
                        sys.stdout.flush()
                    if chunk.get("done", False):
                        break
                except json.JSONDecodeError:
                    continue
            print()
            return full_response
    except Exception as e:
        print(f"\n{RED}Ollama ERROR:{RESET} {e}")
        return None


def stream_chat(messages, backend):
    """Route to the active backend."""
    if backend == "vllm":
        return stream_vllm(messages)
    else:
        return stream_ollama(messages)


# ---------- Banner & UI ----------
def print_banner(backend, backend_model):
    banner = f"""{GREEN}{BOLD}
   THE PALACE — Three-Headed Monster Command Terminal{RESET}
   {DIM}OMEN · RTX 5090 · {backend_model} · Tool Execution: ENABLED{RESET}

   {GOLD}Stone{RESET} · {RED}Cardinal{RESET} · {CYAN}Chaos{RESET} · {MAGENTA}Rush{RESET} · {WHITE}Wiz{RESET}
   {DIM}@head message — or just type naturally{RESET}
   {DIM}/help · /status · /clear · /quit{RESET}
"""
    print(banner)
    if backend == "vllm":
        print(f"  {GREEN}● vLLM is online ({backend_model}). All heads are ready.{RESET}")
    else:
        print(f"  {GOLD}● Ollama fallback ({backend_model}). vLLM is down.{RESET}")


def print_help():
    print(f"""
  {WHITE}{BOLD}COMMANDS:{RESET}
    /status   — Check LLM backend and services
    /clear    — Reset conversation history
    /heads    — Show the head roster
    /help     — This help message
    /quit     — Exit the Palace

  {WHITE}{BOLD}TALKING TO HEADS:{RESET}
    Just type naturally. Messages are routed by topic:
    · Business, agents, strategy → {GOLD}Stone{RESET}
    · Architecture, security, DB → {RED}Cardinal{RESET}
    · GPU, servers, infra        → {CYAN}Chaos{RESET}
""")


def print_heads():
    print(f"""
    {GOLD}{BOLD}STONE{RESET} {DIM}(Head 1 — The Owner){RESET}
      Strategy, optimization, business decisions, agent roster

    {RED}{BOLD}CARDINAL{RESET} {DIM}(Head 2 — The Architect){RESET}
      Intelligence, systems architecture, security, research

    {CYAN}{BOLD}CHAOS{RESET} {DIM}(Head 3 — The Vanguard){RESET}
      Infrastructure, GPU, servers, networking, deployment

    {MAGENTA}{BOLD}RUSH{RESET} {DIM}(Royal Guard — The Breacher){RESET}
      Network penetration, offensive security

    {WHITE}{BOLD}COMPUTER WIZ{RESET} {DIM}(Royal Guard — The Diagnostician){RESET}
      Hardware/software diagnostics, validation
""")


def print_status(backend, backend_model):
    vllm_up = check_vllm()
    ollama_up = check_ollama()
    print(f"""
  {WHITE}{BOLD}SERVICE STATUS:{RESET}
    vLLM (8000):    {"  " + GREEN + "UP" + RESET + " — " + VLLM_MODEL if vllm_up else "  " + RED + "DOWN" + RESET}
    Ollama (11434): {"  " + GREEN + "UP" + RESET + " — " + OLLAMA_MODEL if ollama_up else "  " + RED + "DOWN" + RESET}
    Active backend: {backend} ({backend_model})
""")


# ---------- Main ----------
def main():
    if sys.platform == "win32":
        os.system("")  # Enable ANSI escape sequences

    # Detect backend and model name
    global VLLM_MODEL
    vllm_up = check_vllm()
    if vllm_up:
        VLLM_MODEL = detect_vllm_model() or "Qwen/Qwen3-32B-AWQ"
        backend = "vllm"
        backend_model = VLLM_MODEL
    else:
        backend = "ollama"
        backend_model = OLLAMA_MODEL

    print_banner(backend, backend_model)

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    while True:
        try:
            user_input = input(f"\n  {WHITE}{BOLD}FOUNDER>{RESET} ").strip()
        except (EOFError, KeyboardInterrupt):
            print(f"\n\n  {DIM}Palace closed.{RESET}\n")
            break

        if not user_input:
            continue

        lower = user_input.lower()

        if lower in ("exit", "quit", "/exit", "/quit"):
            print(f"\n  {DIM}Palace closed.{RESET}\n")
            break

        if lower == "/clear":
            messages = [{"role": "system", "content": SYSTEM_PROMPT}]
            print(f"  {DIM}History cleared.{RESET}")
            continue

        if lower == "/heads":
            print_heads()
            continue

        if lower == "/help":
            print_help()
            continue

        if lower == "/status":
            print_status(backend, backend_model)
            continue

        # Re-check vLLM periodically — if it comes back, switch to it
        if backend == "ollama" and check_vllm():
            VLLM_MODEL = detect_vllm_model() or "Qwen/Qwen3-32B-AWQ"
            backend = "vllm"
            backend_model = VLLM_MODEL
            print(f"  {GREEN}● vLLM is back online. Switching to {VLLM_MODEL}.{RESET}")

        head = detect_head(user_input)
        label = head_label(head)

        messages.append({"role": "user", "content": user_input})

        print(f"\n  {label} ", end="")
        response = stream_chat(messages, backend)

        if response:
            messages.append({"role": "assistant", "content": response})
        else:
            messages.pop()


if __name__ == "__main__":
    main()
