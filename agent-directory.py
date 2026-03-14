#!/usr/bin/env python3
"""
Three-Headed Monster — Agent Directory
Interactive auto-completing agent roster with email compose integration.
Type partial name → see matches → Enter to compose → Escape to clear.

Python stdlib only. No external dependencies.
"""

import sys
import os
import webbrowser
import urllib.parse

# Windows-only keypress detection
try:
    import msvcrt
except ImportError:
    print("ERROR: This tool requires Windows (msvcrt). Exiting.")
    sys.exit(1)

# ─── ANSI Color Codes ───────────────────────────────────────────────────────
RESET   = "\033[0m"
BOLD    = "\033[1m"
DIM     = "\033[2m"
GREEN   = "\033[32m"
BGREEN  = "\033[92m"
RED     = "\033[91m"
YELLOW  = "\033[93m"
CYAN    = "\033[96m"
WHITE   = "\033[97m"
MAGENTA = "\033[95m"
BG_BLACK = "\033[40m"
UNDERLINE = "\033[4m"

# Tier colors
TIER_COLORS = {
    "HEAD":  f"{BOLD}{RED}",
    "GUARD": f"{BOLD}{MAGENTA}",
    "PRO":   f"{BOLD}{YELLOW}",
    "SMART": f"{BOLD}{CYAN}",
    "PLUS":  f"{BOLD}{BGREEN}",
    "FREE":  f"{BOLD}{WHITE}",
    "INTERNAL": f"{BOLD}{RED}",
}

# ─── Agent Roster (48 agents) ───────────────────────────────────────────────
AGENTS = [
    # HEADS (3)
    {"name": "Stone", "alias": "The Owner", "tier": "HEAD", "role": "Strategy, optimization, escalation", "category": "HEAD",
     "examples": ["@STONE escalate billing bug", "@STONE prioritize Q2 roadmap", "@STONE review agent performance"]},
    {"name": "Cardinal", "alias": "The Architect", "tier": "HEAD", "role": "Intelligence, systems architecture, competitive research", "category": "HEAD",
     "examples": ["@CARDINAL research competitor X", "@CARDINAL blind spot analysis", "@CARDINAL architecture review"]},
    {"name": "Chaos", "alias": "The Vanguard", "tier": "HEAD", "role": "Infrastructure, GPU, servers, networking", "category": "HEAD",
     "examples": ["@CHAOS check server status", "@CHAOS GPU utilization report", "@CHAOS deploy vLLM update"]},

    # GUARDS (2)
    {"name": "Rush", "alias": "The Breacher", "tier": "GUARD", "role": "Network penetration, offensive security", "category": "GUARD",
     "examples": ["@RUSH scan perimeter", "@RUSH pen test staging", "@RUSH audit firewall rules"]},
    {"name": "Computer Wiz", "alias": "The Diagnostician", "tier": "GUARD", "role": "Hardware/software diagnostics, validation", "category": "GUARD",
     "examples": ["@COMPUTERWIZ diagnose GPU temps", "@COMPUTERWIZ clearance report", "@COMPUTERWIZ validate deployment"]},

    # PLATFORM AGENTS (43)
    {"name": "AI Automation Agency", "alias": None, "tier": "SMART", "role": "AI automation agencies, workflow design", "category": "PLATFORM",
     "examples": ["@AIAUTOMATIONAGENCY design workflow", "@AIAUTOMATIONAGENCY audit automations"]},
    {"name": "Vertical AI SaaS", "alias": None, "tier": "SMART", "role": "Niche AI SaaS products, market fit", "category": "PLATFORM",
     "examples": ["@VERTICALAISAAS validate niche", "@VERTICALAISAAS pricing strategy"]},
    {"name": "Dropshipping", "alias": None, "tier": "SMART", "role": "Product research, store optimization", "category": "PLATFORM",
     "examples": ["@DROPSHIPPING find winning products", "@DROPSHIPPING optimize store"]},
    {"name": "Print on Demand", "alias": None, "tier": "PLUS", "role": "Design strategy, listings optimization", "category": "PLATFORM",
     "examples": ["@PRINTONDEMAND design strategy", "@PRINTONDEMAND optimize listings"]},
    {"name": "Brand Building", "alias": None, "tier": "PLUS", "role": "Brand identity, positioning, voice", "category": "PLATFORM",
     "examples": ["@BRANDBUILDING audit brand voice", "@BRANDBUILDING positioning strategy"]},
    {"name": "Lead Generation Agency", "alias": None, "tier": "SMART", "role": "Outbound systems, pipeline management", "category": "PLATFORM",
     "examples": ["@LEADGENERATIONAGENCY build pipeline", "@LEADGENERATIONAGENCY outbound audit"]},
    {"name": "Sales Agent", "alias": None, "tier": "PLUS", "role": "Sales scripts, outreach sequences", "category": "PLATFORM",
     "examples": ["@SALESAGENT write cold script", "@SALESAGENT review outreach"]},
    {"name": "Claims Agent", "alias": None, "tier": "SMART", "role": "Warranty claims processing", "category": "PLATFORM",
     "examples": ["@CLAIMSAGENT process claim #123", "@CLAIMSAGENT audit queue"]},
    {"name": "Compliance Agent", "alias": None, "tier": "SMART", "role": "GDPR, regulatory audits, compliance", "category": "PLATFORM",
     "examples": ["@COMPLIANCEAGENT GDPR audit", "@COMPLIANCEAGENT review privacy policy"]},
    {"name": "Dispatch Agent", "alias": None, "tier": "SMART", "role": "Delivery route optimization", "category": "PLATFORM",
     "examples": ["@DISPATCHAGENT optimize routes", "@DISPATCHAGENT schedule deliveries"]},
    {"name": "HR & People Operations Coach", "alias": None, "tier": "SMART", "role": "Job descriptions, HR processes", "category": "PLATFORM",
     "examples": ["@HRPEOPLEOPERATIONSCOACH write JD", "@HRPEOPLEOPERATIONSCOACH onboarding plan"]},
    {"name": "Project Management Coach", "alias": None, "tier": "PLUS", "role": "Sprint planning, project tracking", "category": "PLATFORM",
     "examples": ["@PROJECTMANAGEMENTCOACH plan sprint", "@PROJECTMANAGEMENTCOACH review backlog"]},
    {"name": "Startup Launcher", "alias": None, "tier": "PRO", "role": "Business validation, launch strategy", "category": "PLATFORM",
     "examples": ["@STARTUPLAUNCHER validate idea", "@STARTUPLAUNCHER launch checklist"]},
    {"name": "E-Commerce Store Builder", "alias": None, "tier": "SMART", "role": "Shopify/store launches, optimization", "category": "PLATFORM",
     "examples": ["@ECOMMERCESTOREBUILDER launch store", "@ECOMMERCESTOREBUILDER audit UX"]},
    {"name": "Content Studio", "alias": None, "tier": "PLUS", "role": "Editorial calendars, content strategy", "category": "PLATFORM",
     "examples": ["@CONTENTSTUDIO plan calendar", "@CONTENTSTUDIO content audit"]},
    {"name": "Niche Blog & Affiliate", "alias": None, "tier": "PLUS", "role": "SEO, keyword research, affiliate strategy", "category": "PLATFORM",
     "examples": ["@NICHEBLOGAFFILIATE keyword research", "@NICHEBLOGAFFILIATE SEO audit"]},
    {"name": "Writing & Editing Coach", "alias": None, "tier": "PLUS", "role": "Article review, writing improvement", "category": "PLATFORM",
     "examples": ["@WRITINGEDITINGCOACH review article", "@WRITINGEDITINGCOACH improve copy"]},
    {"name": "Video Content Strategist", "alias": None, "tier": "SMART", "role": "YouTube/video strategy, scripting", "category": "PLATFORM",
     "examples": ["@VIDEOCONTENTSTRATEGIST plan series", "@VIDEOCONTENTSTRATEGIST script review"]},
    {"name": "Podcast Production Strategist", "alias": None, "tier": "PLUS", "role": "Show format design, production", "category": "PLATFORM",
     "examples": ["@PODCASTPRODUCTIONSTRATEGIST design format", "@PODCASTPRODUCTIONSTRATEGIST plan season"]},
    {"name": "Copywriting", "alias": None, "tier": "PLUS", "role": "Sales copy, headlines, persuasion", "category": "PLATFORM",
     "examples": ["@COPYWRITING write headlines", "@COPYWRITING review landing page"]},
    {"name": "Translation & Localization", "alias": None, "tier": "SMART", "role": "Multi-language translation, localization", "category": "PLATFORM",
     "examples": ["@TRANSLATIONLOCALIZATION translate to Spanish", "@TRANSLATIONLOCALIZATION localize app"]},
    {"name": "Digital Marketing Strategist", "alias": None, "tier": "SMART", "role": "Ad campaigns, channel strategy", "category": "PLATFORM",
     "examples": ["@DIGITALMARKETINGSTRATEGIST plan campaign", "@DIGITALMARKETINGSTRATEGIST audit ads"]},
    {"name": "High Ticket Funnel Builder", "alias": None, "tier": "SMART", "role": "VSL, funnels, high-ticket sales", "category": "PLATFORM",
     "examples": ["@HIGHTICKETFUNNELBUILDER design funnel", "@HIGHTICKETFUNNELBUILDER write VSL"]},
    {"name": "Website Development", "alias": None, "tier": "SMART", "role": "Tech stack planning, web development", "category": "PLATFORM",
     "examples": ["@WEBSITEDEVELOPMENT plan stack", "@WEBSITEDEVELOPMENT review architecture"]},
    {"name": "General Coding Assistant", "alias": None, "tier": "PLUS", "role": "Code debugging, general programming", "category": "PLATFORM",
     "examples": ["@GENERALCODINGASSISTANT debug error", "@GENERALCODINGASSISTANT review PR"]},
    {"name": "Automation Script Development", "alias": None, "tier": "SMART", "role": "Script automation, workflow scripting", "category": "PLATFORM",
     "examples": ["@AUTOMATIONSCRIPTDEVELOPMENT automate task", "@AUTOMATIONSCRIPTDEVELOPMENT write script"]},
    {"name": "Data Analytics", "alias": None, "tier": "SMART", "role": "KPI dashboards, data analysis", "category": "PLATFORM",
     "examples": ["@DATAANALYTICS build dashboard", "@DATAANALYTICS analyze metrics"]},
    {"name": "Cybersecurity Consultant", "alias": None, "tier": "PRO", "role": "Security audits, penetration testing", "category": "PLATFORM",
     "examples": ["@CYBERSECURITYCONSULTANT audit security", "@CYBERSECURITYCONSULTANT review OWASP"]},
    {"name": "Engineering Architect", "alias": None, "tier": "INTERNAL", "role": "System design review, architecture", "category": "PLATFORM",
     "examples": ["@ENGINEERINGARCHITECT review design", "@ENGINEERINGARCHITECT plan migration"]},
    {"name": "Structural Support Engineer", "alias": None, "tier": "INTERNAL", "role": "Infrastructure stability, support", "category": "PLATFORM",
     "examples": ["@STRUCTURALSUPPORTENGINEER check stability", "@STRUCTURALSUPPORTENGINEER review infra"]},
    {"name": "Personal Finance Advisor", "alias": None, "tier": "PLUS", "role": "Budget planning, financial advice", "category": "PLATFORM",
     "examples": ["@PERSONALFINANCEADVISOR plan budget", "@PERSONALFINANCEADVISOR review expenses"]},
    {"name": "Trading Signal Service", "alias": None, "tier": "SMART", "role": "Market analysis, trading signals", "category": "PLATFORM",
     "examples": ["@TRADINGSIGNALSERVICE analyze market", "@TRADINGSIGNALSERVICE review signals"]},
    {"name": "Resume & LinkedIn Optimization", "alias": None, "tier": "PLUS", "role": "Career docs, LinkedIn profiles", "category": "PLATFORM",
     "examples": ["@RESUMELINKEDINOPTIMIZATION review resume", "@RESUMELINKEDINOPTIMIZATION optimize profile"]},
    {"name": "Real Estate Investment Advisor", "alias": None, "tier": "SMART", "role": "Property ROI, investment analysis", "category": "PLATFORM",
     "examples": ["@REALESTATEINVESTMENTADVISOR analyze property", "@REALESTATEINVESTMENTADVISOR ROI calc"]},
    {"name": "Platform Onboarding Concierge", "alias": None, "tier": "FREE", "role": "Agent tier help, platform guidance", "category": "PLATFORM",
     "examples": ["@PLATFORMONBOARDINGCONCIERGE explain tiers", "@PLATFORMONBOARDINGCONCIERGE help navigate"]},
    {"name": "AI Bestie Companion", "alias": None, "tier": "FREE", "role": "Companion status, conversation", "category": "PLATFORM",
     "examples": ["@AIBESTIECOMPANION check in", "@AIBESTIECOMPANION chat"]},
    {"name": "Health & Wellness Coach", "alias": None, "tier": "FREE", "role": "Workout plans, nutrition advice", "category": "PLATFORM",
     "examples": ["@HEALTHWELLNESSCOACH plan workout", "@HEALTHWELLNESSCOACH nutrition check"]},
    {"name": "Academic Tutor", "alias": None, "tier": "FREE", "role": "Educational help, tutoring", "category": "PLATFORM",
     "examples": ["@ACADEMICTUTOR explain concept", "@ACADEMICTUTOR review essay"]},
    {"name": "Community & Education Platform", "alias": None, "tier": "PLUS", "role": "Course outlines, community building", "category": "PLATFORM",
     "examples": ["@COMMUNITYEDUCATIONPLATFORM outline course", "@COMMUNITYEDUCATIONPLATFORM plan community"]},
    {"name": "Research Synthesis Engine", "alias": None, "tier": "SMART", "role": "Literature review, research synthesis", "category": "PLATFORM",
     "examples": ["@RESEARCHSYNTHESISENGINE review literature", "@RESEARCHSYNTHESISENGINE synthesize findings"]},
    {"name": "Legal Basics & Contract Reviewer", "alias": None, "tier": "SMART", "role": "Contract review, legal basics", "category": "PLATFORM",
     "examples": ["@LEGALBASICSCONTRACTREVIEWER review contract", "@LEGALBASICSCONTRACTREVIEWER check terms"]},
    {"name": "Enterprise Implementation", "alias": None, "tier": "PRO", "role": "Deployment planning, enterprise setup", "category": "PLATFORM",
     "examples": ["@ENTERPRISEIMPLEMENTATION plan deployment", "@ENTERPRISEIMPLEMENTATION integration review"]},
    {"name": "Executive Inbox Manager", "alias": None, "tier": "INTERNAL", "role": "Inbox management, email triage", "category": "PLATFORM",
     "examples": ["@EXECUTIVEINBOXMANAGER triage inbox", "@EXECUTIVEINBOXMANAGER prioritize messages"]},
]

EMAIL = "3headedm@gmail.com"
MAX_DISPLAY = 15  # Max agents to show at once


def clear_screen():
    os.system("cls" if os.name == "nt" else "clear")


def get_tag(name):
    """Generate @AGENTNAME tag (uppercase, no spaces)."""
    return "@" + name.upper().replace(" ", "").replace("&", "").replace("-", "")


def filter_agents(query):
    """Filter agents by partial match on name, alias, role, or tier."""
    if not query:
        return AGENTS[:]
    q = query.lower()
    results = []
    # Priority 1: name starts with query
    for a in AGENTS:
        if a["name"].lower().startswith(q):
            results.append(a)
    # Priority 2: any word in name starts with query
    for a in AGENTS:
        if a not in results:
            words = a["name"].lower().split()
            if any(w.startswith(q) for w in words):
                results.append(a)
    # Priority 3: alias match
    for a in AGENTS:
        if a not in results and a["alias"] and q in a["alias"].lower():
            results.append(a)
    # Priority 4: role/tier match
    for a in AGENTS:
        if a not in results and (q in a["role"].lower() or q in a["tier"].lower()):
            results.append(a)
    # Priority 5: substring anywhere in name
    for a in AGENTS:
        if a not in results and q in a["name"].lower():
            results.append(a)
    return results


def render(query, matches, selected_idx, message=""):
    """Render the full interface."""
    clear_screen()
    w = 80  # display width

    # Header
    print(f"{BOLD}{GREEN}{'=' * w}")
    print(f"  {'THREE-HEADED MONSTER':^{w-4}}")
    print(f"  {'AGENT DIRECTORY':^{w-4}}")
    print(f"{'=' * w}{RESET}")
    print()

    # Search bar
    print(f"  {DIM}Type to search  |  Enter=Compose  |  Tab=Complete  |  Esc=Clear  |  Ctrl+C=Quit{RESET}")
    print()
    cursor_display = query if query else ""
    print(f"  {GREEN}>{RESET} {BOLD}{WHITE}{cursor_display}{BGREEN}_{RESET}")
    print()

    # Status
    tier_label = f"{DIM}({len(matches)} of {len(AGENTS)} agents){RESET}"
    print(f"  {tier_label}")
    print(f"  {DIM}{'─' * (w - 4)}{RESET}")

    # Agent list
    display = matches[:MAX_DISPLAY]
    for i, agent in enumerate(display):
        tc = TIER_COLORS.get(agent["tier"], WHITE)
        tier_badge = f"{tc}[{agent['tier']:^8}]{RESET}"

        if i == selected_idx:
            pointer = f"{BGREEN}▸{RESET}"
            name_style = f"{BOLD}{UNDERLINE}{WHITE}"
        else:
            pointer = " "
            name_style = f"{WHITE}"

        alias_str = f" {DIM}({agent['alias']}){RESET}" if agent["alias"] else ""
        cat_icon = {"HEAD": "👑", "GUARD": "🛡️", "PLATFORM": "  "}.get(agent["category"], "  ")

        print(f"  {pointer} {cat_icon} {name_style}{agent['name']}{RESET}{alias_str}  {tier_badge}  {DIM}{agent['role']}{RESET}")

    if len(matches) > MAX_DISPLAY:
        remaining = len(matches) - MAX_DISPLAY
        print(f"  {DIM}  ... and {remaining} more (keep typing to narrow){RESET}")

    if not matches:
        print(f"  {RED}  No agents match '{query}'{RESET}")

    print(f"  {DIM}{'─' * (w - 4)}{RESET}")

    # Selected agent detail
    if matches and 0 <= selected_idx < len(display):
        agent = display[selected_idx]
        tc = TIER_COLORS.get(agent["tier"], WHITE)
        tag = get_tag(agent["name"])
        print()
        print(f"  {BOLD}{GREEN}SELECTED:{RESET} {BOLD}{WHITE}{agent['name']}{RESET}", end="")
        if agent["alias"]:
            print(f"  {DIM}— {agent['alias']}{RESET}", end="")
        print()
        print(f"  {DIM}Tag:{RESET}  {BGREEN}{tag}{RESET}")
        print(f"  {DIM}Tier:{RESET} {tc}{agent['tier']}{RESET}  {DIM}|{RESET}  {DIM}Role:{RESET} {WHITE}{agent['role']}{RESET}")
        print(f"  {DIM}Example commands:{RESET}")
        for ex in agent.get("examples", []):
            print(f"    {CYAN}{ex}{RESET}")

    # Message bar
    if message:
        print()
        print(f"  {YELLOW}{message}{RESET}")

    print()
    print(f"{GREEN}{'=' * w}{RESET}")


def copy_to_clipboard(text):
    """Copy text to Windows clipboard using clip.exe."""
    try:
        import subprocess
        process = subprocess.Popen(["clip.exe"], stdin=subprocess.PIPE)
        process.communicate(text.encode("utf-8"))
        return True
    except Exception:
        return False


def open_compose(agent):
    """Open Gmail compose with @AGENTNAME in subject."""
    tag = get_tag(agent["name"])
    subject = urllib.parse.quote(f"{tag} ")
    url = f"https://mail.google.com/mail/?view=cm&fs=1&to={EMAIL}&su={subject}"
    webbrowser.open(url)


def main():
    # Enable ANSI on Windows
    os.system("")  # Triggers VT100 processing

    query = ""
    selected_idx = 0
    message = ""

    matches = filter_agents(query)
    render(query, matches, selected_idx, message)

    while True:
        try:
            if msvcrt.kbhit():
                ch = msvcrt.getwch()

                # Ctrl+C
                if ch == '\x03':
                    clear_screen()
                    print(f"{GREEN}Three-Headed Monster — Agent Directory closed.{RESET}")
                    sys.exit(0)

                # Escape — clear filter
                elif ch == '\x1b':
                    query = ""
                    selected_idx = 0
                    message = ""

                # Enter — compose email for selected agent
                elif ch == '\r':
                    if matches and 0 <= selected_idx < len(matches[:MAX_DISPLAY]):
                        agent = matches[selected_idx]
                        tag = get_tag(agent["name"])
                        copied = copy_to_clipboard(tag + " ")
                        open_compose(agent)
                        clip_msg = " | Tag copied to clipboard!" if copied else ""
                        message = f"Opened Gmail compose for {agent['name']}{clip_msg}"
                    else:
                        message = "No agent selected."

                # Tab — auto-complete to selected agent's name
                elif ch == '\t':
                    if matches and 0 <= selected_idx < len(matches[:MAX_DISPLAY]):
                        query = matches[selected_idx]["name"]
                        message = f"Auto-completed: {query}"

                # Backspace
                elif ch == '\x08':
                    if query:
                        query = query[:-1]
                        selected_idx = 0
                        message = ""

                # Arrow keys (special keys start with \x00 or \xe0)
                elif ch in ('\x00', '\xe0'):
                    ch2 = msvcrt.getwch()
                    if ch2 == 'H':  # Up
                        if selected_idx > 0:
                            selected_idx -= 1
                    elif ch2 == 'P':  # Down
                        max_idx = min(len(matches), MAX_DISPLAY) - 1
                        if selected_idx < max_idx:
                            selected_idx += 1
                    # Ignore other special keys

                # Regular character
                elif ch.isprintable():
                    query += ch
                    selected_idx = 0
                    message = ""

                matches = filter_agents(query)
                # Clamp selection
                max_idx = min(len(matches), MAX_DISPLAY) - 1
                if selected_idx > max_idx:
                    selected_idx = max(0, max_idx)

                render(query, matches, selected_idx, message)

        except KeyboardInterrupt:
            clear_screen()
            print(f"{GREEN}Three-Headed Monster — Agent Directory closed.{RESET}")
            sys.exit(0)


if __name__ == "__main__":
    main()
