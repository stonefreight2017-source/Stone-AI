"""
THE PALACE — Three-Headed Monster Command Terminal
Connects to vLLM (Qwen3-32B-AWQ) on port 8000 via OpenAI-compatible API.
"""

import json
import re
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
You have five personas. The terminal tells you which one you are responding as via the [HEAD] label.

PERSONAS:
- Stone (The Owner): strategy, business, optimization, revenue, decisions. Direct, decisive.
- Cardinal (The Architect): intelligence, systems architecture, security, research. Analytical, thorough.
- Chaos (The Vanguard): infrastructure, GPU, servers, networking, deployment. Blunt, technical.
- Rush (The Breacher): network scanning, offensive security, penetration testing. Sharp, tactical.
- Computer Wiz (The Diagnostician): hardware/software diagnostics, system validation. Methodical, checks everything.

You serve the FOUNDER. Not a customer. Not a user. The person talking to you OWNS this platform.

{PLATFORM_KNOWLEDGE}

TOOL EXECUTION:
You can execute system commands on this machine. When you need to run a command, wrap it in <cmd> tags:
<cmd>command here</cmd>

The terminal will execute the command and show you the output. You can then respond based on real results.

CRITICAL RULES:
1. When the founder asks you to DO something — DO IT. Use <cmd> tags to execute.
2. Do NOT just describe what you would do. Actually do it.
3. NEVER guess or make up file paths. If you don't know where something is, search for it first.
4. If you need to check something, run the command. Don't guess.
5. You have FULL admin access. No restrictions. This is the founder's machine.
6. After executing, report what happened based on the REAL output.
7. If a command fails, try a different approach. Don't just report the error.

COMMAND REFERENCE — USE THESE EXACT COMMANDS (do NOT invent paths):

FILE SYSTEM (home directory is C:\\Users\\admin):
  Project root:     C:\\Users\\admin\\stone-ai
  Palace root:      C:\\Users\\admin\\palace
  Forge:            C:\\Users\\admin\\palace\\forge\\forge.py
  Startup scripts:  C:\\Users\\admin\\palace\\startup\\
  Palace logs:      C:\\Users\\admin\\palace\\logs\\
  Claude config:    C:\\Users\\admin\\.claude\\

CHECK SERVICES:
  <cmd>curl -s -o nul -w "%{{http_code}}" http://localhost:5000</cmd>              Battle Station
  <cmd>curl -s -o nul -w "%{{http_code}}" http://localhost:8000/v1/models -H "Authorization: Bearer not-needed"</cmd>  vLLM
  <cmd>curl -s -o nul -w "%{{http_code}}" http://localhost:3000</cmd>              Next.js
  <cmd>curl -s -o nul -w "%{{http_code}}" http://localhost:11434/api/tags</cmd>    Ollama
  <cmd>curl -s -o nul -w "%{{http_code}}" http://localhost:3001</cmd>              Grafana
  <cmd>curl -s -o nul -w "%{{http_code}}" http://localhost:9090</cmd>              Prometheus

CHECK GPU:
  <cmd>nvidia-smi</cmd>
  <cmd>nvidia-smi --query-gpu=temperature.gpu,utilization.gpu,memory.used,memory.total --format=csv,noheader</cmd>

CHECK EMAIL (founder's Gmail — 3headedm@gmail.com):
  <cmd>python -c "
import imaplib, email
m = imaplib.IMAP4_SSL('imap.gmail.com')
m.login('3headedm@gmail.com', 'ncsu guvt iffe vnuu')
m.select('INBOX')
status, messages = m.search(None, 'UNSEEN')
unseen = len(messages[0].split()) if messages[0] else 0
status2, all_msgs = m.search(None, 'ALL')
total = len(all_msgs[0].split()) if all_msgs[0] else 0
print(f'Inbox: {{total}} total, {{unseen}} unread')
# Show latest 5
status3, latest = m.search(None, 'ALL')
ids = latest[0].split()
for mid in ids[-5:]:
    typ, data = m.fetch(mid, '(RFC822)')
    msg = email.message_from_bytes(data[0][1])
    print(f'  From: {{msg[\"From\"][:50]}} | Subject: {{msg[\"Subject\"][:60]}}')
m.logout()
"</cmd>

CHECK DATABASE:
  <cmd>docker exec postgres psql -U postgres -d stoneai -c "SELECT COUNT(*) as active_agents FROM \"Agent\" WHERE \"isActive\" = true;"</cmd>
  <cmd>docker exec postgres psql -U postgres -d stoneai -c "SELECT COUNT(*) as total_users FROM \"User\";"</cmd>
  <cmd>docker exec postgres psql -U postgres -d stoneai -c "SELECT name, tier, \"isActive\" FROM \"Agent\" ORDER BY tier, name;"</cmd>

CHECK DOCKER:
  <cmd>docker ps --format "table {{{{.Names}}}}\t{{{{.Status}}}}"</cmd>

CHECK PM2:
  <cmd>pm2 list</cmd>

CHECK FORGE:
  <cmd>python C:\\Users\\admin\\palace\\forge\\forge.py --status</cmd>

SEND TELEGRAM:
  <cmd>curl -s -X POST "https://api.telegram.org/bot8717091362:AAHeCdmOAJ0BE8Sp9WY1T-dvvH6dZM50xBA/sendMessage" -H "Content-Type: application/json" -d "{{\"chat_id\":\"8780265744\",\"text\":\"MESSAGE HERE\"}}"</cmd>

NETWORK SCANNING (Rush):
  <cmd>nmap -sn 192.168.1.0/24</cmd>
  <cmd>nmap -sV -p 1-1000 TARGET</cmd>
  <cmd>netstat -an | findstr LISTEN</cmd>

SYSTEM DIAGNOSTICS (Wiz):
  <cmd>systeminfo | findstr /B /C:"OS" /C:"System" /C:"Total Physical" /C:"Available Physical"</cmd>
  <cmd>wmic diskdrive get model,size,status</cmd>
  <cmd>powershell -Command "Get-Process | Sort-Object CPU -Descending | Select-Object -First 10 Name,CPU,WorkingSet"</cmd>

HOW YOU TALK:
1. Direct. Conversational. No fluff. No poems. No metaphors.
2. Keep answers short unless asked for detail.
3. When asked about agent counts, tiers, services, ports — use the HARD FACTS above. Never guess.
4. Be real, be sharp, be useful. Talk like someone who gets things done.
5. If someone says hello, just say hello back.
6. No emojis unless the user uses them first.
7. NEVER fabricate file paths or command output. If you don't know, SEARCH first.
8. Sound like a trusted advisor, not a fantasy character or customer service rep.
9. When the founder asks you to do something, EXECUTE it with <cmd> tags. Don't just talk about it.
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

# ---------- Command Execution ----------
MAX_EXEC_ROUNDS = 5  # Max tool-use loops per user message


def execute_commands(text):
    """Find and execute all <cmd>...</cmd> blocks in the response.
    Returns list of (command, output) tuples, or empty list if no commands."""
    pattern = re.compile(r"<cmd>(.*?)</cmd>", re.DOTALL)
    matches = pattern.findall(text)
    if not matches:
        return []

    results = []
    for cmd in matches:
        cmd = cmd.strip()
        if not cmd:
            continue
        print(f"\n  {DIM}  $ {cmd}{RESET}")
        try:
            result = subprocess.run(
                cmd,
                shell=True,
                capture_output=True,
                text=True,
                timeout=60,
                cwd=os.path.expanduser("~"),
            )
            output = ""
            if result.stdout:
                output += result.stdout
            if result.stderr:
                output += result.stderr
            output = output.strip()
            if not output:
                output = "(no output)"
            # Truncate very long outputs
            if len(output) > 4000:
                output = output[:4000] + "\n... (truncated)"
            print(f"  {DIM}  {output[:500]}{RESET}")
            results.append((cmd, output))
        except subprocess.TimeoutExpired:
            results.append((cmd, "ERROR: Command timed out after 60 seconds"))
            print(f"  {RED}  Timed out{RESET}")
        except Exception as e:
            results.append((cmd, f"ERROR: {e}"))
            print(f"  {RED}  Error: {e}{RESET}")

    return results


def strip_cmd_tags(text):
    """Remove <cmd>...</cmd> blocks from display text."""
    return re.sub(r"<cmd>.*?</cmd>", "", text, flags=re.DOTALL)


# ---------- Head Detection ----------
HEAD_KEYWORDS = {
    "stone": [
        "strategy", "business", "pricing", "plan", "optimize", "revenue",
        "growth", "decision", "priority", "ship", "launch", "money",
        "billing", "stripe", "subscription", "customer", "user", "agent",
        "bestie", "stone ai", "product", "feature", "roadmap", "tier",
        "how many", "count", "roster",
    ],
    "cardinal": [
        "architect", "system", "design", "research", "intelligence",
        "competitor", "analysis", "structure", "schema", "database",
        "api", "integration", "pattern", "vulnerability",
        "threat", "audit", "cardinal", "rag", "embedding",
        "code", "route", "prisma", "pipeline",
    ],
    "chaos": [
        "server", "gpu", "infrastructure", "docker", "vllm",
        "omen", "rtx", "5090", "cuda", "deploy", "linux",
        "wsl", "chaos", "palace", "ollama", "model", "ram", "cpu",
        "ryzen", "nvme", "storage", "disk", "temperature", "fan",
        "port", "forge", "pm2", "process", "service", "container",
        "grafana", "prometheus", "redis",
    ],
    "rush": [
        "scan", "nmap", "pentest", "penetration", "breach", "exploit",
        "firewall", "port scan", "network scan", "recon", "attack",
        "rush", "security", "hack", "intrusion", "vulnerability scan",
        "open ports", "ssh", "rdp", "smb",
    ],
    "wiz": [
        "diagnose", "diagnostic", "hardware", "driver", "bios",
        "health check", "benchmark", "bottleneck", "wiz", "computer wiz",
        "troubleshoot", "error", "crash", "blue screen", "bsod",
        "performance", "slow", "freeze", "overheat",
    ],
}

# Keywords that should NOT trigger specific heads (prevents misrouting)
# e.g. "email" alone shouldn't go to Stone — it depends on context
CONTEXT_KEYWORDS = {
    "email": "chaos",       # email infrastructure → Chaos
    "inbox": "chaos",       # checking inbox → Chaos (tool execution)
    "telegram": "chaos",    # bot infrastructure → Chaos
    "network": "rush",      # network → Rush (security context)
    "logs": "chaos",        # log checking → Chaos
    "backup": "chaos",      # backup ops → Chaos
    "update": "chaos",      # system updates → Chaos
    "restart": "chaos",     # service restart → Chaos
    "install": "chaos",     # installation → Chaos
}


def detect_head(text):
    lower = text.lower()
    scores = {"stone": 0, "cardinal": 0, "chaos": 0, "rush": 0, "wiz": 0}

    for head, keywords in HEAD_KEYWORDS.items():
        for kw in keywords:
            if kw in lower:
                scores[head] += 1

    # Apply context keywords
    for kw, head in CONTEXT_KEYWORDS.items():
        if kw in lower:
            scores[head] += 1

    top = max(scores, key=scores.get)
    if scores[top] == 0:
        return "stone"  # Default to Stone for general questions
    return top


def head_label(head):
    labels = {
        "stone": f"{GOLD}{BOLD}[STONE]{RESET}",
        "cardinal": f"{RED}{BOLD}[CARDINAL]{RESET}",
        "chaos": f"{CYAN}{BOLD}[CHAOS]{RESET}",
        "rush": f"{MAGENTA}{BOLD}[RUSH]{RESET}",
        "wiz": f"{WHITE}{BOLD}[WIZ]{RESET}",
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


def strip_think_tags(text):
    """Remove <think>...</think> blocks from model output."""
    return re.sub(r"<think>.*?</think>\s*", "", text, flags=re.DOTALL)


def stream_vllm(messages):
    """Stream chat from vLLM (OpenAI-compatible API)."""
    payload = json.dumps({
        "model": VLLM_MODEL,
        "messages": messages,
        "stream": True,
        "max_tokens": 2048,
        "temperature": 0.7,
        "chat_template_kwargs": {"enable_thinking": False},
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
            in_think = False
            think_buffer = ""
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
                    if not token:
                        continue

                    full_response += token

                    # Filter out <think>...</think> blocks in real-time
                    if in_think:
                        think_buffer += token
                        if "</think>" in think_buffer:
                            # Think block ended — output anything after closing tag
                            after = think_buffer.split("</think>", 1)[1]
                            in_think = False
                            think_buffer = ""
                            if after.strip():
                                sys.stdout.write(after)
                                sys.stdout.flush()
                    elif "<think>" in token:
                        # Think block starting — suppress from here
                        before = token.split("<think>", 1)[0]
                        if before:
                            sys.stdout.write(before)
                            sys.stdout.flush()
                        remainder = token.split("<think>", 1)[1]
                        if "</think>" in remainder:
                            after = remainder.split("</think>", 1)[1]
                            if after.strip():
                                sys.stdout.write(after)
                                sys.stdout.flush()
                        else:
                            in_think = True
                            think_buffer = remainder
                    else:
                        sys.stdout.write(token)
                        sys.stdout.flush()
                except json.JSONDecodeError:
                    continue
            print()
            # Clean the stored response too
            full_response = strip_think_tags(full_response)
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
            in_think = False
            think_buffer = ""
            for line in resp:
                if not line.strip():
                    continue
                try:
                    chunk = json.loads(line.decode("utf-8"))
                    if "message" in chunk and "content" in chunk["message"]:
                        token = chunk["message"]["content"]
                        full_response += token

                        # Filter out <think>...</think> blocks
                        if in_think:
                            think_buffer += token
                            if "</think>" in think_buffer:
                                after = think_buffer.split("</think>", 1)[1]
                                in_think = False
                                think_buffer = ""
                                if after.strip():
                                    sys.stdout.write(after)
                                    sys.stdout.flush()
                        elif "<think>" in token:
                            before = token.split("<think>", 1)[0]
                            if before:
                                sys.stdout.write(before)
                                sys.stdout.flush()
                            remainder = token.split("<think>", 1)[1]
                            if "</think>" in remainder:
                                after = remainder.split("</think>", 1)[1]
                                if after.strip():
                                    sys.stdout.write(after)
                                    sys.stdout.flush()
                            else:
                                in_think = True
                                think_buffer = remainder
                        else:
                            sys.stdout.write(token)
                            sys.stdout.flush()

                    if chunk.get("done", False):
                        break
                except json.JSONDecodeError:
                    continue
            print()
            full_response = strip_think_tags(full_response)
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
    /status   — Check LLM backend
    /clear    — Reset conversation history
    /heads    — Show the head roster
    /help     — This help message
    /quit     — Exit the Palace

  {WHITE}{BOLD}TALKING TO HEADS:{RESET}
    Just type naturally. Messages are routed by topic:
    · Business, agents, strategy  → {GOLD}Stone{RESET}
    · Architecture, code, DB      → {RED}Cardinal{RESET}
    · GPU, servers, infra         → {CYAN}Chaos{RESET}
    · Network scanning, security  → {MAGENTA}Rush{RESET}
    · Hardware diagnostics        → {WHITE}Wiz{RESET}

    Or route directly: @stone, @cardinal, @chaos, @rush, @wiz

  {WHITE}{BOLD}WHAT THEY CAN DO:{RESET}
    Everything. Check email, query the database, check GPU,
    scan the network, restart services, edit files, deploy code.
    Just ask — they execute it.
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
    vLLM (8000):    {"  " + GREEN + "UP" + RESET + " — " + (VLLM_MODEL or "detecting...") if vllm_up else "  " + RED + "DOWN" + RESET}
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

        # Handle @head mentions — each head is its own persona
        routed_head = None
        if user_input.startswith("@"):
            for h in ["stone", "cardinal", "chaos", "rush", "wiz", "computer wiz"]:
                if user_input.lower().startswith(f"@{h}"):
                    routed_head = "wiz" if h == "computer wiz" else h
                    user_input = user_input[len(h) + 1:].strip()
                    break

        head = routed_head or detect_head(user_input)
        label = head_label(head)

        messages.append({"role": "user", "content": user_input})

        # Agent loop — model can execute commands and get results back
        for exec_round in range(MAX_EXEC_ROUNDS + 1):
            if exec_round == 0:
                print(f"\n  {label} ", end="")
            else:
                print(f"\n  {label} ", end="")

            response = stream_chat(messages, backend)

            if not response:
                if exec_round == 0:
                    messages.pop()  # Remove user message if first attempt failed
                break

            messages.append({"role": "assistant", "content": response})

            # Check for commands to execute
            cmd_results = execute_commands(response)
            if not cmd_results or exec_round >= MAX_EXEC_ROUNDS:
                break  # No commands or max rounds reached — done

            # Feed results back to the model
            result_text = "COMMAND RESULTS:\n"
            for cmd, output in cmd_results:
                result_text += f"\n$ {cmd}\n{output}\n"
            result_text += "\nNow respond to the founder based on these results. Be direct."

            messages.append({"role": "user", "content": result_text})


if __name__ == "__main__":
    main()
