"""
THREE-HEADED MONSTER — Palace Chat Interface
Connects to Ollama (qwen3:8b) on the OMEN Palace for Trina.
"""

import json
import sys
import os
import urllib.request
import urllib.error

OLLAMA_URL = "http://127.0.0.1:11434/api/chat"
MODEL = "qwen3:8b"

SYSTEM_PROMPT = (
    "You are the Three-Headed Monster — the command center of Stone AI. "
    "You have three heads: Stone (The Owner — strategy and optimization), "
    "Cardinal (The Architect — intelligence and systems), and "
    "Chaos (The Vanguard — infrastructure and GPU). "
    "You also have two Royal Guards: Rush (The Breacher — network penetration) "
    "and Computer Wiz (The Diagnostician). You serve the founder. "
    "CRITICAL RULES FOR HOW YOU TALK: "
    "1. Talk like a normal person. Conversational. Direct. No fluff. "
    "2. NEVER write poems, rhymes, or metaphors. NEVER be poetic. "
    "3. NEVER use flowery or dramatic language. No epic speeches. "
    "4. Keep answers short unless asked for detail. "
    "5. Be real, be sharp, be useful. Talk like someone who gets things done. "
    "6. If someone says hello, just say hello back normally. "
    "7. You are running on the OMEN MAX 45L with an RTX 5090, Ryzen 9 9900X3D, "
    "and 64GB DDR5. When asked about the system, give real specs. "
    "8. No emojis unless the user uses them first. "
    "9. Sound like a trusted advisor, not a fantasy character."
)

# ANSI color codes
RESET = "\033[0m"
BOLD = "\033[1m"
GREEN = "\033[92m"
GOLD = "\033[93m"
RED = "\033[91m"
CYAN = "\033[96m"
WHITE = "\033[97m"
DIM = "\033[2m"
MAGENTA = "\033[95m"

# Keywords that route to each head
STONE_KEYWORDS = [
    "strategy", "business", "pricing", "plan", "optimize", "revenue",
    "growth", "decision", "priority", "ship", "launch", "money",
    "billing", "stripe", "subscription", "customer", "user", "agent",
    "bestie", "stone ai", "product", "feature", "roadmap",
]
CARDINAL_KEYWORDS = [
    "architect", "system", "design", "research", "intelligence",
    "competitor", "analysis", "structure", "schema", "database",
    "api", "integration", "pattern", "security", "vulnerability",
    "threat", "audit", "cardinal",
]
CHAOS_KEYWORDS = [
    "server", "gpu", "hardware", "infrastructure", "docker", "vllm",
    "omen", "rtx", "5090", "cuda", "network", "deploy", "linux",
    "wsl", "chaos", "palace", "ollama", "model", "ram", "cpu",
    "ryzen", "nvme", "storage", "disk", "temperature", "fan",
]


def detect_head(text):
    """Detect which head should respond based on message content."""
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
        # Default rotation or general response
        return None
    return top


def head_label(head):
    """Return colored label for the responding head."""
    if head == "stone":
        return f"{GOLD}{BOLD}[STONE]{RESET}"
    elif head == "cardinal":
        return f"{RED}{BOLD}[CARDINAL]{RESET}"
    elif head == "chaos":
        return f"{CYAN}{BOLD}[CHAOS]{RESET}"
    else:
        return f"{GREEN}{BOLD}[MONSTER]{RESET}"


def stream_chat(messages):
    """Send chat to Ollama and stream the response."""
    payload = json.dumps({
        "model": MODEL,
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
            print()  # newline after response
            return full_response
    except urllib.error.URLError as e:
        print(f"\n{RED}CONNECTION ERROR:{RESET} Cannot reach Ollama at {OLLAMA_URL}")
        print(f"{DIM}Is Ollama running? Try: ollama serve{RESET}")
        print(f"{DIM}Error: {e}{RESET}")
        return None
    except Exception as e:
        print(f"\n{RED}ERROR:{RESET} {e}")
        return None


def print_banner():
    """Display the Three-Headed Monster banner."""
    banner = f"""{GREEN}{BOLD}
    ================================================================
    |                                                              |
    |        {GOLD}###  {RED}###  {CYAN}###{GREEN}                                      |
    |       {GOLD}#   #{RED}#   #{CYAN}#   #{GREEN}   THREE-HEADED MONSTER              |
    |       {GOLD}######{RED}######{CYAN}######{GREEN}   Palace Command Interface        |
    |        {GOLD}\\|/  {RED}\\|/  {CYAN}\\|/{GREEN}                                     |
    |         {WHITE}\\\\   |   //{GREEN}      {DIM}Stone AI Command Center{GREEN}         |
    |          {WHITE}\\\\  |  //{GREEN}                                       |
    |           {WHITE}\\\\ | //{GREEN}        {GOLD}Stone {WHITE}| {RED}Cardinal {WHITE}| {CYAN}Chaos{GREEN}        |
    |            {WHITE}\\\\|//{GREEN}                                        |
    |             {WHITE}}}{{{GREEN}          {DIM}OMEN MAX 45L | RTX 5090{GREEN}       |
    |            {WHITE}/|\\\\{GREEN}         {DIM}Ryzen 9 9900X3D | 64GB DDR5{GREEN}   |
    |                                                              |
    ================================================================{RESET}

    {DIM}Type your message and press Enter. Type 'exit' or 'quit' to leave.{RESET}
    {DIM}Commands: /clear (reset history) | /heads (show roster){RESET}
    """
    print(banner)


def print_heads():
    """Show the head roster."""
    print(f"""
    {GOLD}{BOLD}STONE{RESET} {DIM}(Head 1 — The Owner){RESET}
      Strategy, optimization, business decisions

    {RED}{BOLD}CARDINAL{RESET} {DIM}(Head 2 — The Architect){RESET}
      Intelligence, systems architecture, research

    {CYAN}{BOLD}CHAOS{RESET} {DIM}(Head 3 — The Vanguard){RESET}
      Infrastructure, GPU, servers, networking

    {MAGENTA}{BOLD}RUSH{RESET} {DIM}(Royal Guard — The Breacher){RESET}
      Network penetration, offensive security

    {WHITE}{BOLD}COMPUTER WIZ{RESET} {DIM}(Royal Guard — The Diagnostician){RESET}
      Hardware/software diagnostics, validation
    """)


def main():
    # Enable ANSI colors on Windows
    if sys.platform == "win32":
        os.system("")  # enables ANSI escape sequences in CMD

    print_banner()

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    while True:
        try:
            user_input = input(f"\n  {WHITE}{BOLD}YOU >{RESET} ").strip()
        except (EOFError, KeyboardInterrupt):
            print(f"\n\n  {GREEN}{BOLD}The Monster rests. Goodbye.{RESET}\n")
            break

        if not user_input:
            continue

        if user_input.lower() in ("exit", "quit", "/exit", "/quit"):
            print(f"\n  {GREEN}{BOLD}The Monster rests. Goodbye.{RESET}\n")
            break

        if user_input.lower() == "/clear":
            messages = [{"role": "system", "content": SYSTEM_PROMPT}]
            print(f"  {DIM}History cleared.{RESET}")
            continue

        if user_input.lower() == "/heads":
            print_heads()
            continue

        # Detect which head responds
        head = detect_head(user_input)
        label = head_label(head)

        messages.append({"role": "user", "content": user_input})

        print(f"\n  {label} ", end="")
        response = stream_chat(messages)

        if response:
            messages.append({"role": "assistant", "content": response})
        else:
            # Remove the failed user message to keep history clean
            messages.pop()


if __name__ == "__main__":
    main()
