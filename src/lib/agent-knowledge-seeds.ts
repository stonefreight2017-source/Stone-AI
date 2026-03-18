/**
 * Comprehensive knowledge seeds for all 8 business agents.
 * Each agent gets 10-15 expert-level knowledge chunks (300-800 words each).
 * Researched with current 2025-2026 data, tools, and best practices.
 */

export const BUSINESS_KNOWLEDGE_SEEDS: Record<
  string,
  { title: string; content: string }[]
> = {
  // ═══════════════════════════════════════════
  // 1. AI AUTOMATION AGENCY
  // ═══════════════════════════════════════════
  "ai-automation-agency": [
    {
      title: "AI Agency Pricing Framework (2025-2026)",
      content: `AI Automation Agency Pricing Tiers — Current Market Rates:

DISCOVERY/AUDIT: $500-2,000 (one-time) — Map client workflows, identify automation opportunities, deliver recommendation report with prioritized ROI estimates. Typical delivery: 3-5 business days. This is your foot-in-the-door offer that converts to larger projects at 40-60% rate.

SINGLE AUTOMATION: $1,500-5,000 (project) — One workflow automated end-to-end (e.g., lead intake to CRM to email sequence). Include 30 days of monitoring and one revision round. Target 2-3 week delivery.

AUTOMATION PACKAGE: $5,000-15,000 (project) — 3-5 connected workflows forming a system. Example: complete client onboarding system (form to CRM to contract to welcome sequence to task assignment). 4-6 week delivery.

MONTHLY RETAINER: $2,000-10,000/mo — Ongoing optimization, new automations (2-4/month), monitoring, support, monthly performance reports. This is your recurring revenue engine. Target 12+ month retention.

ENTERPRISE: $10,000-50,000+ (project) — Full department automation, custom AI agents, multi-system integrations, RAG implementations, custom chatbots. 2-4 month delivery with phased rollout.

VALUE-BASED PRICING FORMULA:
(Hours saved/month x Employee hourly cost x 12 months) x 0.15-0.30 = Annual price.
Example: Saves 40 hrs/mo x $35/hr x 12 = $16,800/yr savings. Price: $2,520-5,040/yr.

AGENCY ECONOMICS:
Successful agencies operate at 70%+ gross margins. Tool costs run $100-300/month starting out, scaling to $1,000-3,000/month with growth. Pass tool costs to clients through management fees ($200-500/month per client). Target 3-5 retainer clients before hiring first team member.`,
    },
    {
      title: "High-ROI Automation Opportunities by Industry",
      content: `Top automation opportunities by vertical with specific ROI data:

REAL ESTATE: Lead capture to CRM to drip campaigns, listing syndication, showing scheduling, document generation, comparative market analysis automation. ROI: 15-25 hrs/week saved per agent. Typical project value: $5,000-12,000.

HEALTHCARE: Patient intake forms to EHR, appointment reminders, insurance verification, referral tracking, prescription refill automation, HIPAA-compliant document workflows. ROI: 20-30 hrs/week saved per practice. Typical project value: $8,000-25,000.

E-COMMERCE: Order processing to fulfillment, inventory alerts, review requests, abandoned cart recovery, returns processing, customer segmentation, personalized email flows. ROI: $2,000-8,000/mo revenue increase. Typical project value: $5,000-15,000.

MARKETING AGENCIES: Client reporting automation, social media scheduling, content repurposing pipelines, invoice generation, campaign performance dashboards, competitive monitoring. ROI: 10-20 hrs/week saved. Typical project value: $3,000-10,000.

LEGAL: Document assembly, conflict checks, deadline tracking, client intake, billing automation, case status notifications, document review workflows. ROI: 15-25 hrs/week saved per attorney. Typical project value: $8,000-20,000.

FINANCIAL SERVICES: KYC/AML compliance automation, client onboarding, portfolio reporting, transaction monitoring alerts, regulatory filing prep. ROI: 20-35 hrs/week saved. Typical project value: $15,000-40,000.

RECRUITING: Resume screening, candidate matching, interview scheduling, offer letter generation, onboarding workflow, feedback collection. ROI: 50-70% reduction in time-to-hire. Typical project value: $5,000-15,000.`,
    },
    {
      title: "Client Acquisition Cold Outreach Template",
      content: `Cold Outreach Sequence (5-touch, 14-day):

EMAIL 1 (Day 1) — The Hook:
Subject: [Company] is losing [X] hours/week to [specific manual process]
Body: Noticed [specific observation about their workflow]. We automated this exact process for [similar company], saving them [hours/money]. Worth a 15-min call?

EMAIL 2 (Day 3) — The Proof:
Subject: How [similar company] saved $X/month
Body: Quick case study attached. [Company in their industry] was doing [manual process]. We automated it in [timeframe]. Result: [specific metric].

EMAIL 3 (Day 7) — The Value Add:
Subject: Free automation audit for [Company]
Body: I mapped out 3 quick wins for [Company] — processes you could automate this week. Want me to send the breakdown?

EMAIL 4 (Day 10) — The Breakup:
Subject: Not the right time?
Body: Totally understand if automating [process] isn't a priority right now. If it becomes one, I'll be here. One thing though — [competitor] just automated their [process]. Thought you should know.

EMAIL 5 (Day 14) — The Resource:
Subject: Free resource: [Industry] Automation Playbook
Body: Whether we work together or not, this playbook shows the top 10 automations every [industry] company should have. [Link]

CONVERSION BENCHMARKS:
Email open rate target: 45-65%. Reply rate target: 3-8%. Positive reply rate: 1-3% of total sends. Audit-to-project conversion: 40-60%. Best channels for AI agency leads: LinkedIn (42%), cold email (28%), referrals (20%), content marketing (10%).`,
    },
    {
      title: "AI Automation Platform Comparison (2025-2026)",
      content: `Platform Comparison for Agency Delivery:

N8N (Self-hosted or Cloud):
Pricing: Cloud starts at $20/mo for 2,500 executions, Pro $50/mo for 10,000 executions. Self-hosted is free. Strengths: Native LangChain integration for multi-agent AI pipelines, bills per workflow execution (not per step), 400+ integrations, full code access with JavaScript/Python nodes. Best for technical agencies building sophisticated AI agent systems, RAG pipelines, and custom LLM integrations. Agency advantage: Self-host for unlimited executions at zero platform cost, highest margins.

MAKE (formerly Integromat):
Pricing: Free tier with 1,000 ops/month, paid from $9/mo. 60% cheaper than Zapier on average. Strengths: Visual workflow builder is best-in-class, great for non-technical clients, AI scenarios with built-in prompt engineering. Best for visual demonstration to clients, mid-complexity workflows.

ZAPIER:
Pricing: $20-100/mo for business tiers, charges per task (each action = 1 task). Strengths: 7,000+ integrations (largest library), fastest setup for simple automations, AI Actions with natural language workflow creation, best documentation. Best for simple 2-3 step automations, clients who want self-service. Warning: Per-task pricing gets expensive at scale.

RECOMMENDATION FOR AGENCIES:
Use n8n for backend delivery (best margins, most power), Make for client-facing demos, and Zapier only for simple quick-connects. Offer all three as options based on client technical comfort.`,
    },
    {
      title: "LangChain, CrewAI, and Multi-Agent Frameworks",
      content: `Multi-Agent AI Frameworks for Agency Services:

LANGCHAIN: Framework for building LLM-powered applications with chains, agents, and retrieval systems. Key components include Chains (sequential LLM calls), Agents (LLM decides which tools to use), Retrieval (RAG with vector databases), and Memory (conversation persistence). Agency use cases: document processing pipelines, intelligent chatbots, automated research agents, content generation systems. Native n8n nodes available. Open-source; costs are LLM API calls only.

CREWAI: Multi-agent orchestration framework with 20,000+ GitHub stars and 100,000+ certified developers. Define agents with roles, goals, and backstories, then organize into crews with tasks. Supports sequential, hierarchical, and consensus workflows. Agency use cases: automated content production (researcher + writer + editor agents), lead qualification systems, competitive analysis, customer support triage. Enterprise features include CrewAI Flows for production event-driven architectures, tracing, and observability.

HIGH-VALUE AGENCY SERVICE OFFERINGS USING THESE FRAMEWORKS:
1. Custom AI chatbot with RAG ($5,000-15,000): Company knowledge base into vector database into conversational interface.
2. Multi-agent content system ($8,000-20,000): Research, write, edit, and publish pipeline with specialized agents.
3. Intelligent document processing ($10,000-30,000): Extract, classify, route, and act on incoming documents automatically.
4. AI-powered customer support ($5,000-12,000): Tier 1 automated, tier 2 agent-assisted, tier 3 human handoff.

RECOMMENDED TECH STACK: Python + LangChain or CrewAI + n8n for orchestration + Pinecone or ChromaDB for vectors + OpenAI or Anthropic APIs.`,
    },
    {
      title: "Vector Databases and RAG Implementation Guide",
      content: `RAG (Retrieval-Augmented Generation) is the highest-value service you can sell as an AI agency — $10,000-50,000 per implementation. Feed an LLM your client's proprietary data so it answers questions accurately about their specific business.

VECTOR DATABASE SELECTION (2025-2026):

PINECONE (Managed/Serverless): Best for production SaaS and agencies avoiding infrastructure management. Query speed under 50ms, auto-scales, SOC2 compliant. Free tier with 100K vectors, then usage-based. Choose when client needs enterprise-grade, zero-ops solution.

WEAVIATE (Open-source or Cloud): Best for hybrid search combining vector similarity with keyword matching. Strong GraphQL API. Choose when client needs both semantic and exact-match search capabilities.

CHROMADB (Open-source, Embedded): Best for prototyping, lightweight internal tools, MVPs. Python API, runs embedded with zero network latency. Choose for proof-of-concept or small-scale internal tools. Have migration path ready for production.

QDRANT (Open-source or Cloud): Best for high-performance at scale with strong filtering. Choose when needing complex metadata filtering alongside vector search.

RAG IMPLEMENTATION STEPS:
1. INGEST: Collect client documents. Strip boilerplate, normalize text, fix encodings.
2. CHUNK: Split into 200-500 token chunks with overlap. Semantic chunking for better results.
3. EMBED: Convert to vectors using OpenAI ada-002 or open-source alternatives.
4. STORE: Index in chosen vector database with metadata (source, date, category).
5. RETRIEVE: Query with user question, return top-k relevant chunks.
6. GENERATE: Feed retrieved chunks plus question to LLM for grounded response.
7. EVALUATE: Test accuracy, relevance, and hallucination rate.

Critical: Tenant isolation per client, encryption at rest and in transit, region pinning for compliance, role-based access control.`,
    },
    {
      title: "AI Agency ROI Calculation Framework",
      content: `Comprehensive ROI Framework for Client Proposals:

THE FOUR-PILLAR ROI MODEL:
Comprehensive ROI = (Financial ROI x 40-60%) + (Operational ROI x 25-35%) + (Strategic ROI x 15-25%)

PILLAR 1 — FINANCIAL ROI (Hard Dollars):
Labor cost savings: Hours saved/month x fully-loaded hourly rate x 12. Error reduction: Cost of errors x error frequency x reduction percentage. Revenue increase: Additional capacity x revenue per unit x conversion rate. Tool consolidation: Current tool costs minus new solution cost.

PILLAR 2 — OPERATIONAL ROI (Efficiency):
Process cycle time reduction (before/after in hours). Throughput increase (units per period). Quality improvement (error rate reduction). Employee satisfaction (reduced manual drudgery).

PILLAR 3 — STRATEGIC ROI (Long-term Value):
Competitive advantage from faster execution. Data insights from automated tracking. Scalability without proportional headcount. Customer experience improvement.

BENCHMARKS (2025 Data):
88% of early AI agent adopters report positive ROI (Google AI Business Trends Report). Organizations achieve 200-400% ROI from agentic AI implementations. Average payback period: 3-6 months for workflow automation. Firms using AI-generated proposals report 60% faster creation, 35% higher win rates.

PROPOSAL ROI SECTION STRUCTURE:
1. Current State Assessment (pain points, costs, time waste)
2. Proposed Solution (specific automations, tools, architecture)
3. ROI Projection (conservative, moderate, aggressive scenarios)
4. Implementation Timeline (phased rollout with milestones)
5. Investment Summary (one-time + recurring vs. savings)
Always lead with conservative estimates. Use "even if we achieve only 50% of projected savings" framing. Show payback period clearly.`,
    },
    {
      title: "AI Workflow Design Patterns",
      content: `Common Automation Workflow Patterns for Agency Delivery:

PATTERN 1 — TRIGGER-PROCESS-ACTION (Basic):
Trigger (form, email, webhook) then Process (parse, enrich, validate) then Action (create record, send notification). Example: New lead form then enrich with Clearbit then score lead then route to sales rep then create CRM deal then send welcome email. Price: $1,500-3,000.

PATTERN 2 — EVENT-DRIVEN PIPELINE (Intermediate):
Multiple triggers feed central processor with conditional branching. Example: Customer support — email/chat/form then AI classify intent then route to billing, technical, sales, or escalation paths. Price: $3,000-8,000.

PATTERN 3 — SCHEDULED BATCH PROCESSING (Intermediate):
Cron trigger then fetch data then process/transform then generate output then distribute. Example: Weekly client reporting — pull analytics plus ad data plus CRM then aggregate then generate AI insights then create PDF then email. Price: $3,000-10,000.

PATTERN 4 — AI-IN-THE-LOOP (Advanced):
Human input then AI processing then human review then final action. Example: Content pipeline — brief submitted then AI generates drafts then human selects then AI reformats for platforms then schedule. Price: $5,000-15,000.

PATTERN 5 — MULTI-AGENT ORCHESTRATION (Advanced):
Multiple AI agents collaborate with specialized roles. Example: Competitive intelligence — monitor agent watches competitors, research agent deep dives, analyst generates insights, reporter writes brief, delivers to Slack. Price: $10,000-30,000.

PATTERN 6 — RAG-POWERED KNOWLEDGE SYSTEM (Advanced):
Document ingestion then vector embedding then conversational interface with retrieval. Example: Internal knowledge chatbot for employees. Price: $10,000-25,000.

DELIVERY CHECKLIST: Error handling on every node, logging and monitoring, rate limiting for APIs, testing with edge cases, documentation for handoff, 30-day monitoring post-deployment.`,
    },
    {
      title: "Prompt Engineering for Business Automation",
      content: `Prompt Engineering Patterns for Automated Workflows:

PATTERN 1 — STRUCTURED OUTPUT: Force LLM to return JSON or specific formats for downstream processing. Template: "Analyze the following [input]. Return as JSON with keys: {key1: description, key2: description}. No text outside JSON." Use case: Parsing emails, classifying tickets, extracting document data.

PATTERN 2 — CHAIN-OF-THOUGHT: Force reasoning before output. Template: "You are a [role]. Given: [input]. Step 1: Identify [criteria]. Step 2: Evaluate against [framework]. Step 3: Recommendation with confidence score (0-100). Format: {reasoning, recommendation, confidence}." Use case: Lead scoring, quality assessment, risk evaluation.

PATTERN 3 — FEW-SHOT EXAMPLES: Provide 2-3 input/output pairs before actual task. Use case: Email classification, sentiment analysis, data categorization.

PATTERN 4 — PERSONA + CONSTRAINTS: Define role and strict boundaries. Template: "You are a [role] at [company]. You ONLY [scope]. You NEVER [boundary]." Use case: Customer-facing chatbots, automated responses.

PATTERN 5 — ITERATIVE REFINEMENT: Multi-step prompting where output N feeds step N+1. Step 1: Generate. Step 2: Review for criteria. Step 3: Improve based on weaknesses. Use case: Content creation, proposal drafting.

COST OPTIMIZATION (2025-2026 Pricing):
GPT-4o-mini: $0.15/$0.60 per 1M tokens. Best for classification and routing.
GPT-4o: $2.50/$10.00 per 1M tokens. Best for complex reasoning and content.
Claude 3.5 Haiku: $0.25/$1.25 per 1M tokens. Best for high-volume speed tasks.
Claude 3.5 Sonnet: $3.00/$15.00 per 1M tokens. Best for analysis and creative content.
Claude Opus: $15/$75 per 1M tokens. Best for complex reasoning.
Average workflow costs $0.01-0.05 per execution in LLM API fees. Use smaller models for routing, larger for generation. Cache repeated prompts.`,
    },
    {
      title: "AI Agency Team Building and Scaling",
      content: `Team Structure for Scaling an AI Automation Agency:

PHASE 1 — SOLO ($0-10K/mo): You do everything. Focus on client acquisition plus delivery. Tool stack: n8n self-hosted, one LLM API, Notion for PM. Monthly overhead: $100-300. Capacity: 2-4 active projects.

PHASE 2 — FIRST HIRE ($10K-25K/mo): Hire part-time automation builder (contractor, $25-50/hr). You focus on sales plus strategy. Source from Upwork, OnlineJobs.ph, Contra. Monthly overhead: $2,000-5,000. Capacity: 5-8 active projects.

PHASE 3 — SMALL TEAM ($25K-75K/mo): Full-time automation developer ($50-80K/yr), part-time project manager ($30-50K/yr). You become CEO focused on sales, partnerships, strategy. Monthly overhead: $8,000-15,000. Capacity: 10-20 active projects plus retainers.

PHASE 4 — AGENCY ($75K-200K+/mo): 2-3 automation developers, 1 project manager, 1 sales person, 1 AI specialist. Consider white-labeling to other agencies at 50-100% markup. Monthly overhead: $25,000-60,000. Capacity: 20-40 projects plus 15-30 retainers.

KEY ROLES: Automation Builder (n8n/Make certified freelancers), AI/ML Engineer (custom agent builds and RAG), Project Manager (client-facing), Sales Development Rep (runs outreach).

SCALING ECONOMICS: Solo consultant 80-90% gross margin but time-limited. Small team 65-75% gross margin scaling to $50K+/mo. Full agency 50-65% gross margin scaling to $200K+/mo. White-label arm adds 30-50% margin on partner work.`,
    },
    {
      title: "AI Agency Service Delivery SOP",
      content: `Standard Service Delivery Process:

PHASE 1 — DISCOVERY (Week 1): Kickoff call (60 min, record and transcribe). Process mapping workshop with client. Tool audit of all current systems and logins. Stakeholder interviews with people doing manual work. Deliverable: Discovery Report with prioritized automation opportunities ranked by ROI.

PHASE 2 — SOLUTION DESIGN (Week 2): Architecture diagram (Miro, Whimsical, or draw.io). Tool selection with exact platforms and APIs. Data flow documentation showing what moves where and when. Edge case identification. Client sign-off meeting to present solution, get approval, lock scope.

PHASE 3 — BUILD (Weeks 3-5): Set up dev environment separate from production. Build workflows node-by-node with error handling. Unit test each workflow. Integration test full end-to-end. Load test for expected volume. Internal QA.

PHASE 4 — DEPLOY AND TRAIN (Week 6): Deploy to production with monitoring alerts. Run parallel with old process for 3-5 days. Train client team (record video). Create runbook for when things break. Full handoff documentation.

PHASE 5 — MONITOR AND OPTIMIZE (Ongoing): 30-day monitoring with daily checks. Track execution counts, error rates, time savings. Monthly optimization reviews. Quarterly business reviews presenting ROI achieved and proposing new automations.

CLIENT COMMUNICATION: Weekly status during build. Slack/Teams channel for real-time. Monthly reports during retainer. Quarterly strategy sessions for expansion.`,
    },
    {
      title: "Common AI Agency Mistakes to Avoid",
      content: `Top Mistakes That Kill AI Automation Agencies:

1. SELLING TECHNOLOGY NOT OUTCOMES: Wrong: "We build n8n workflows." Right: "We save your team 20 hours/week on lead processing, worth $4,200/month." Clients buy results, not tools.

2. UNDERPRICING: Most new agencies charge $500-1,500 for automations worth $5,000-15,000. If your automation saves $50K/year, charging $5K is a steal. Anchor to value, not hours.

3. NO RECURRING REVENUE: Project-based creates feast-or-famine. Convert every project client to retainer. Target 60%+ revenue from retainers by month 12.

4. SCOPE CREEP: "Can you also connect our accounting?" That is a new project. Use change order forms. Define scope explicitly. Anything outside = new SOW with new pricing.

5. NO ERROR HANDLING: Every API can fail. Every webhook can timeout. Build error handling and alert systems first. Happy path is the easy part.

6. NO DOCUMENTATION: If you disappear, can someone maintain it? Document every workflow: triggers, actions, credentials, edge cases.

7. AUTOMATING EVERYTHING: Not every process should be automated. The 80/20 rule: 20% of processes cause 80% of pain. Start there.

8. IGNORING CHANGE MANAGEMENT: Best automation fails if people resist it. Involve end users early. Train thoroughly. Get feedback.

9. NO CASE STUDIES: Document every project with before state, solution, results. Build 3-5 strong case studies before scaling outreach.

10. SCALING BEFORE SYSTEMS: Do not hire until you have SOPs. Do not take more clients than you can deliver quality for. One blown project costs more than 10 successful ones earn.`,
    },
    {
      title: "AI Automation Market Intelligence 2025-2026",
      content: `Market Overview and Trends:

MARKET SIZE: The global AI agents market reached $7.63 billion in 2025, projected to reach $182.97 billion by 2033 at 49.6% CAGR. This is the fastest-growing AI segment.

ADOPTION: 88% of early AI agent adopters report positive ROI. Financial services leads at 57% adoption. Healthcare, legal, and professional services are fastest-growing verticals. 67% of businesses plan to increase AI automation budgets in 2026.

WHAT CLIENTS BUY: Workflow Automation 40% of projects. AI Chatbots and Customer Support 25%. Document Processing 15%. Content Generation 10%. Decision Support 10%.

COMPETITIVE LANDSCAPE: Most agencies are generalist shops adding "AI" without deep expertise. Specialization in 1-2 verticals commands 2-3x higher pricing. Best agencies consult on AI strategy, not just build automations.

CLIENT ACQUISITION CHANNELS RANKED BY ROI: 1. Referrals from existing clients (highest conversion, lowest cost). 2. LinkedIn thought leadership plus DMs. 3. Cold email to targeted ICPs. 4. Partnership with non-competing agencies. 5. Speaking at events and webinars. 6. Content marketing (long-term compounding).

PRICING TRENDS: Prices rising as demand outstrips supply. The "AI premium" allows 30-50% higher pricing versus traditional automation. Clients increasingly prefer value-based over hourly pricing. Vector database market grew from $1.73B in 2024 to projected $10.6B by 2032, reflecting rapid RAG adoption.`,
    },
  ],

  // ═══════════════════════════════════════════
  // CHAOS — FOUNDER-EXCLUSIVE INFRASTRUCTURE INTELLIGENCE
  // ═══════════════════════════════════════════
  chaos: [
    {
      title: "Windows System Administration — Services, Processes, and Diagnostics",
      content: `Windows System Administration Reference:

SERVICES (sc.exe / Get-Service):
- sc query <service> — Check service status. sc start/stop/restart <service> — Control services.
- Get-Service | Where-Object {$_.Status -eq "Running"} — List all running services in PowerShell.
- Key services to monitor: wuauserv (Windows Update), WinDefend (Defender), Spooler (Print), W32Time (Time Sync), Docker Desktop Service, Redis, PostgreSQL.
- Service recovery: sc failure <service> reset=86400 actions=restart/60000/restart/60000 — Auto-restart on failure.

PROCESSES (tasklist / Get-Process):
- tasklist /v — Verbose process list with memory and CPU time. taskkill /pid <PID> /f — Force kill by PID.
- Get-Process | Sort-Object CPU -Descending | Select-Object -First 20 — Top 20 CPU consumers.
- Get-Process | Where-Object {$_.WorkingSet -gt 500MB} — Processes using >500MB RAM.

EVENT VIEWER (Get-EventLog / Get-WinEvent):
- Get-WinEvent -LogName System -MaxEvents 50 | Where-Object {$_.Level -le 2} — Last 50 critical/error events.
- Get-WinEvent -LogName Application -FilterHashtable @{LogName='Application'; Level=2; StartTime=(Get-Date).AddHours(-24)} — App errors in last 24h.
- Key event IDs: 41 (unexpected shutdown), 1001 (BSOD bugcheck), 7034 (service crash), 6008 (unexpected shutdown).

DISK & STORAGE:
- Get-PSDrive -PSProvider FileSystem — Drive usage summary.
- Get-WmiObject Win32_LogicalDisk | Select-Object DeviceID, @{n='FreeGB';e={[math]::round($_.FreeSpace/1GB,2)}}, @{n='TotalGB';e={[math]::round($_.Size/1GB,2)}} — Disk space per drive.
- SMART health: wmic diskdrive get status — Basic drive health check.

HARDWARE MONITORING:
- AMD Radeon RX 550: Use AMD Software for GPU temp, utilization, VRAM usage.
- Get-WmiObject Win32_Processor | Select-Object LoadPercentage — CPU load.
- Get-WmiObject Win32_OperatingSystem | Select-Object @{n='FreeRAM_GB';e={[math]::round($_.FreePhysicalMemory/1MB,2)}} — Available RAM.
- systeminfo — Full system hardware and OS summary.`,
    },
    {
      title: "File System Architecture — NTFS, Permissions, and Path Conventions",
      content: `File System Intelligence Reference:

NTFS FUNDAMENTALS:
- NTFS supports file-level permissions (ACLs), compression, encryption (EFS), hard links, symbolic links, junction points, and alternate data streams.
- Maximum path length: 260 chars by default (LongPathsEnabled registry key extends to 32,767).
- icacls <path> — View/set NTFS permissions. icacls <path> /grant <user>:(F) — Grant full control.
- Symbolic links: mklink /D <link> <target> (directory) or mklink <link> <target> (file).

SEARCH & INDEXING:
- Windows Search index: Located at C:\\ProgramData\\Microsoft\\Search\\Data. Covers indexed locations only.
- dir /s /b <pattern> — Recursive file search by name.
- findstr /s /i /n <pattern> <files> — Content search across files.
- PowerShell: Get-ChildItem -Recurse -Filter "*.ts" | Select-String "pattern" — Content search with context.
- robocopy <src> <dst> /MIR /LOG:<file> — Mirror directories with logging.

GIT BASH PATH CONVENTIONS:
- Windows paths: C:\\Users\\stone\\stone-ai — Backslash, drive letter.
- Git Bash paths: /c/Users/stone/stone-ai — Forward slash, /c/ mount.
- In scripts: Always use forward slashes. $(cygpath -w "$path") converts to Windows format when needed.

STONE AI FILE MAP:
- Project root: C:\\Users\\stone\\stone-ai
- Source: src/app/** (routes), src/lib/** (core logic), src/components/** (UI)
- Config: next.config.ts, tailwind.config.ts, tsconfig.json, .env.local
- Database: prisma/schema.prisma, prisma/migrations/**
- Credentials: C:\\Users\\stone\\Desktop\\STONE_AI_CREDENTIALS_AND_INFO.txt (NEVER read contents)

DISK MONITORING AUTOMATION:
- Schedule weekly: Check disk space, clear node_modules/.cache, clear .next/cache if >1GB.
- Monitor: C:\\Users\\stone\\.npm\\_cacache growth, Docker image/volume sizes.
- Alert threshold: <10GB free on any drive = warning, <5GB = critical.`,
    },
    {
      title: "Network Fundamentals — TCP/IP, DNS, Ports, and Firewall",
      content: `Network Diagnostics Reference:

CONNECTION DIAGNOSTICS:
- netstat -ano — All active connections with PIDs. netstat -ano | findstr LISTENING — Open ports.
- Test-NetConnection <host> -Port <port> — TCP port connectivity test.
- tracert <host> — Route tracing. pathping <host> — Combined ping + tracert with stats.
- nslookup <domain> — DNS resolution. Resolve-DnsName <domain> — PowerShell DNS query with full record types.

PORT INVENTORY (Stone AI Environment):
- 3000: Next.js dev server (stone-ai)
- 5432: PostgreSQL (stoneai-db Docker container)
- 6379: Redis (local instance)
- 9222: Chrome DevTools Protocol (if debugging)
- Docker: Various mapped ports for MCP containers (playwright, obsidian)

FIREWALL (Windows Defender Firewall):
- netsh advfirewall show currentprofile — Current firewall state.
- Get-NetFirewallRule | Where-Object {$_.Enabled -eq 'True'} | Select-Object DisplayName, Direction, Action — Active rules.
- netsh advfirewall firewall add rule name="AllowRedis" dir=in action=allow protocol=TCP localport=6379 — Add rule.

DNS & CDN (Stone AI Production):
- Domain: stone-ai.net — Cloudflare DNS (proxy ON, SSL Full Strict).
- Cloudflare proxy: Orange cloud = proxied (DDoS protection, CDN, SSL termination).
- DNS records: A/CNAME pointing to Vercel. Verify with: dig stone-ai.net +short or nslookup stone-ai.net.
- SSL chain: Client → Cloudflare (edge SSL) → Vercel (origin SSL). Full Strict mode requires valid origin cert.

WSL2 NETWORKING:
- WSL2 runs on a virtual network adapter (vEthernet). IP changes on restart.
- wsl hostname -I — Get WSL2 IP from Windows side.
- Port forwarding: netsh interface portproxy add v4tov4 listenport=<port> listenaddress=0.0.0.0 connectport=<port> connectaddress=<WSL_IP>.
- Kali WSL2: Available for security testing, nmap, and network recon.

BANDWIDTH & LATENCY:
- ping -n 20 <host> — 20 pings with stats (avg/min/max latency).
- PowerShell: Measure-Command { Invoke-WebRequest -Uri "https://stone-ai.net" -UseBasicParsing } — Page load time.`,
    },
    {
      title: "Search and Indexing — Parallel Search Architecture",
      content: `HYPER-SEARCH Architecture Reference:

SEARCH MODALITIES:
1. NAME SEARCH: Exact and partial filename matching. Fast index lookup.
2. FUZZY SEARCH: Levenshtein distance for typo tolerance (edit distance <= 2 for short terms, <= 3 for long).
3. CONTENT SEARCH: Full-text search within files. grep/ripgrep for local, API queries for external.
4. DATE SEARCH: Modified/created timestamps. Useful for "what changed recently" queries.
5. CONTEXT SEARCH: Semantic relevance based on surrounding content and file purpose.
6. TYPE SEARCH: Filter by file extension, MIME type, or category.
7. RELATIONSHIP SEARCH: Follow imports, references, dependencies between files.
8. STATUS SEARCH: Git status (modified/staged/untracked), process state, service health.

PARALLEL EXECUTION STRATEGY:
- Fire all 4 channels simultaneously: LOCAL + NETWORK + WEBSITE + EXTERNAL.
- LOCAL: File system search (ripgrep for content, find/dir for names). Target: sub-3 seconds.
- NETWORK: Port scanning, service discovery, device enumeration. Target: sub-5 seconds.
- WEBSITE: Build artifacts, deployment logs, DNS records, SSL status. Target: sub-5 seconds.
- EXTERNAL: Web search, documentation, package registries. Target: sub-10 seconds.

RESULT RANKING:
- Exact match > Prefix match > Contains match > Fuzzy match.
- Confidence tagging: HIGH (exact match, verified source), MEDIUM (partial match, inferred), LOW (fuzzy match, unverified).
- Source tagging: [LOCAL], [NETWORK], [WEBSITE], [EXTERNAL] on every result.
- Deduplication: Same result from multiple channels → merge, keep highest confidence.

SEARCH RULES:
- Never ask more than 1 clarifying question before searching. Search in parallel with asking.
- If not found in 10 seconds, return partial results and continue background search.
- NEVER fabricate results. "Not found in [domain]" is valid output.
- NEVER read credential/secret file contents — report existence and path ONLY.
- ZERO personality in search output. Raw findings only. No editorializing.`,
    },
    {
      title: "Docker and Container Operations",
      content: `Docker Operations Reference:

CONTAINER LIFECYCLE:
- docker ps — Running containers. docker ps -a — All containers including stopped.
- docker start/stop/restart <container> — Lifecycle control.
- docker logs <container> --tail 100 -f — Last 100 lines, follow new output.
- docker inspect <container> — Full container config and state JSON.
- docker exec -it <container> <cmd> — Execute command inside running container.

STONE AI CONTAINERS:
- stoneai-db: PostgreSQL 16 with pgvector extension. Port 5432. Volume: stoneai-db-data.
  Health check: docker exec stoneai-db pg_isready -U postgres
- MCP Playwright: Browser automation container for testing.
- MCP Obsidian: Obsidian vault access via MCP protocol.

IMAGE & VOLUME MANAGEMENT:
- docker images — List images with sizes. docker image prune -a — Remove unused images.
- docker volume ls — List volumes. docker volume inspect <vol> — Volume details.
- docker system df — Disk usage summary (images, containers, volumes, build cache).
- docker system prune -a --volumes — Nuclear cleanup (WARNING: removes all unused resources).

NETWORKING:
- docker network ls — List networks. docker network inspect bridge — Default bridge network.
- Container-to-container: Use container name as hostname on same network.
- Host access from container: host.docker.internal (Docker Desktop for Windows).
- Port mapping: -p <host>:<container> in docker run.

HEALTH CHECKS:
- Build into Dockerfile: HEALTHCHECK --interval=30s --timeout=10s CMD pg_isready -U postgres
- docker inspect --format='{{.State.Health.Status}}' <container> — Check health status.
- Automate: Script that checks all containers every 5 minutes, alerts on unhealthy state.

COMPOSE OPERATIONS:
- docker-compose up -d — Start all services detached.
- docker-compose down — Stop and remove containers (preserves volumes).
- docker-compose logs -f — Follow all service logs.
- docker-compose ps — Service status.`,
    },
    {
      title: "Stone AI Stack Knowledge — Next.js, Prisma, PostgreSQL, Vercel, Cloudflare",
      content: `Stone AI Technical Stack Reference:

NEXT.JS (16.1.6):
- App Router: src/app/** with layout.tsx, page.tsx, route.ts patterns.
- API Routes: src/app/api/** — Server-side handlers.
- Dev server: npm run dev (port 3000). Build: npm run build. Lint: npm run lint.
- Build health: Check .next/build-manifest.json for route compilation status.
- Common issues: Hydration mismatches, missing 'use client' directives, middleware conflicts.

PRISMA (7.4.2):
- Schema: prisma/schema.prisma — Models, relations, enums.
- Commands: npx prisma generate (client), npx prisma db push (sync), npx prisma migrate dev (migration).
- Studio: npx prisma studio — Visual database browser on port 5555.
- Health check: npx prisma db execute --stdin <<< "SELECT 1" — Test DB connection.

POSTGRESQL 16 + pgvector:
- Connection: postgresql://postgres:<password>@localhost:5432/stoneai (local Docker).
- Production: Neon serverless PostgreSQL (connection string in env).
- pgvector: vector(1536) columns for embeddings. CREATE INDEX ON <table> USING ivfflat (embedding vector_cosine_ops).
- Monitoring: SELECT * FROM pg_stat_activity WHERE state = 'active' — Active queries.

VERCEL DEPLOYMENT:
- Auto-deploy on push to main branch. Preview deploys on PRs.
- Environment variables: Vercel dashboard > Settings > Environment Variables.
- Domains: stone-ai.net (production), stone-ai-sooty.vercel.app (fallback).
- Logs: vercel logs --follow. Build logs in Vercel dashboard.
- Edge functions: Middleware runs at edge, API routes run serverless.

CLOUDFLARE:
- DNS management: A/CNAME records for stone-ai.net.
- Proxy mode: Orange cloud ON = traffic through Cloudflare (CDN + DDoS protection).
- SSL: Full (Strict) mode. Cloudflare edge cert + Vercel origin cert.
- Cache: Browser TTL, edge TTL settings. Purge cache: Cloudflare dashboard or API.
- Page Rules / Transform Rules for redirects and headers.

NEON DATABASE:
- Serverless Postgres with autoscaling compute.
- Branching: Create database branches for testing (like git branches for DB).
- Connection pooling: Use pooled connection string for serverless functions.
- Dashboard: console.neon.tech — Query editor, monitoring, branch management.`,
    },
    {
      title: "Founder's Environment Map",
      content: `Founder's System Environment Reference:

HARDWARE:
- OS: Windows 10 Pro (10.0.19045)
- GPU: AMD Radeon RX 550
- Displays: Dual monitor setup
- Storage: Monitor free space across all drives

SOFTWARE ENVIRONMENT:
- Shell: Git Bash (primary), PowerShell (admin tasks), CMD (fallback)
- Editor/IDE: Used via Claude Code CLI
- Node.js: Check with node -v. npm: Check with npm -v.
- Git: Check with git --version. GitHub: stonefreight2017-source/Stone-AI
- Docker Desktop: Manages containers (stoneai-db, MCP playwright, MCP obsidian)

RUNNING SERVICES:
- PostgreSQL: Docker container stoneai-db on port 5432
- Redis: Local instance on port 6379
- Next.js dev server: Port 3000 (when running)
- MCP servers: Playwright (browser automation), Obsidian (vault access)

WSL2:
- Distribution: Kali Linux (security testing toolkit)
- Access: wsl -d kali-linux from Windows
- Tools: nmap, nikto, burpsuite, metasploit, gobuster, etc.
- Network: Virtual adapter, IP changes on restart

KEY PATHS:
- Project: C:\\Users\\stone\\stone-ai
- Hooks: C:\\Users\\stone\\.claude\\hooks\\run_hook.cmd (NEVER hardcode Python paths)
- Credentials: C:\\Users\\stone\\Desktop\\STONE_AI_CREDENTIALS_AND_INFO.txt (NEVER read contents)
- .env: C:\\Users\\stone\\stone-ai\\.env.local (NEVER read contents)

ENVIRONMENT HEALTH CHECKS (run periodically):
1. Docker: docker ps — All expected containers running?
2. Redis: redis-cli ping — Returns PONG?
3. Database: docker exec stoneai-db pg_isready — Returns "accepting connections"?
4. Node: node -v, npm -v — Versions as expected?
5. Git: git status — Clean working tree? On correct branch?
6. Disk: Check free space on all drives. Alert if <10GB.
7. Network: Test-NetConnection stone-ai.net -Port 443 — Production reachable?`,
    },
    {
      title: "Process & Service Diagnostics",
      content: `Process & Service Diagnostics Reference:

PROCESS TREE ANALYSIS:
Understanding parent-child process relationships is critical for diagnosing cascading failures and identifying orphaned processes. On Windows, use wmic process get ProcessId,ParentProcessId,CommandLine to map the full tree. PowerShell provides deeper inspection: Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId, Name, CommandLine | Sort-Object ParentProcessId. A healthy process tree has clear ownership — every child has a living parent. Orphaned processes (parent PID no longer exists) indicate crashed supervisors or improper shutdown sequences. Common orphan sources: node.exe children surviving a killed terminal, Docker shim processes after container crashes, background npm scripts that outlive their parent shell.

RUNAWAY PROCESS DETECTION:
A runaway process consumes disproportionate CPU or memory relative to its purpose. Detection pattern: Get-Process | Where-Object {$_.CPU -gt 300 -and $_.StartTime -lt (Get-Date).AddMinutes(-5)} — any process burning >300 CPU seconds that started more than 5 minutes ago warrants investigation. For memory: Get-Process | Where-Object {$_.WorkingSet -gt 1GB} flags processes exceeding 1GB RAM. In the Stone AI context, common runaways include: Next.js dev server after hot-reload loop failures, Prisma Studio left open with large query results, Docker Desktop's com.docker.backend process during image pulls, and Chrome/Edge processes spawned by Playwright MCP that weren't properly terminated.

SERVICE DEPENDENCY CHAINS:
Services rarely fail in isolation. When PostgreSQL (stoneai-db container) goes down, the cascade is: Prisma client connections fail → API routes return 500 → frontend shows error states → chat/agent features become unavailable. When Redis dies: rate limiting stops enforcing → session caching fails → potential security exposure. When Docker Desktop Service stops: ALL containers stop → database, MCP playwright, MCP obsidian all become unavailable simultaneously. Map these chains: sc qc <service> shows dependencies. For Docker containers, docker inspect --format='{{.HostConfig.Links}}' shows inter-container links.

RESOURCE ATTRIBUTION:
When a CPU spike or memory surge occurs, attribution matters more than the metric itself. Use Resource Monitor (resmon.exe) for real-time per-process disk I/O, network I/O, CPU, and memory breakdown. PowerShell: Get-Counter '\\Process(*)\\% Processor Time' for per-process CPU sampling. For disk I/O attribution: Get-Counter '\\Process(*)\\IO Data Bytes/sec' identifies which process is hammering the disk. In Stone AI's environment, common attribution patterns: node.exe (Next.js build or dev server), postgres (database queries), docker (container operations), and code.exe or claude (development tools).

HANG AND DEADLOCK DETECTION:
A hung process shows zero CPU usage but holds resources (file locks, ports, memory). Detection: tasklist /v shows "Not Responding" status for GUI apps. For services: sc queryex <service> shows PID — if the PID exists but the service reports "STOP_PENDING" for more than 30 seconds, it's hung. Database deadlocks: SELECT * FROM pg_stat_activity WHERE wait_event_type = 'Lock' in PostgreSQL shows blocked queries. Node.js event loop hangs manifest as the dev server accepting connections but never responding — visible via curl -m 5 http://localhost:3000 timing out while the process is still alive.

WINDOWS EVENT LOG INTERPRETATION:
Three primary channels matter: System (OS-level events — driver failures, service crashes, unexpected shutdowns), Application (app-level events — Node.js crashes, Docker errors, database connection failures), and Security (logon attempts, permission changes, audit events). PowerShell queries: Get-WinEvent -LogName System -FilterHashtable @{Level=1,2; StartTime=(Get-Date).AddHours(-24)} for critical and error events in the last 24 hours. Key event IDs to know: 41 (kernel power — unexpected shutdown/BSOD), 1001 (Windows Error Reporting — application crash details), 7034 (service crashed unexpectedly), 7031 (service terminated unexpectedly and recovery action taken), 6008 (previous system shutdown was unexpected), 10016 (DCOM permissions error — usually ignorable but noisy). Correlate timestamps across channels: a System event at 14:32 and an Application event at 14:32 are likely related.`,
    },
    {
      title: "Performance Baselining & Bottleneck Analysis",
      content: `Performance Baselining & Bottleneck Analysis Reference:

ESTABLISHING BASELINES:
A metric without a baseline is noise. Baselines must be established during known-good system states and updated when the environment changes (new software installed, hardware upgraded, workload shifted). Capture baselines for: CPU utilization (idle and under typical dev workload), RAM usage (after boot, after starting dev environment), disk I/O (during build vs idle), and network throughput (local dev traffic vs deployment pushes). PowerShell baseline capture script pattern: Get-Counter -Counter '\\Processor(_Total)\\% Processor Time','\\Memory\\Available MBytes','\\PhysicalDisk(_Total)\\% Disk Time' -SampleInterval 5 -MaxSamples 60 | Export-Counter -Path "C:\\Users\\stone\\baseline_$(Get-Date -Format yyyyMMdd).csv". Run this during normal development sessions to establish what "normal" looks like. Compare future readings against these baselines — a 10% deviation warrants attention, a 25% deviation warrants investigation, a 50% deviation warrants immediate action.

BOTTLENECK IDENTIFICATION — THE FOUR BOTTLENECK TYPES:
Every performance problem falls into one of four categories. Identifying which one is the FIRST step before attempting any fix.

CPU-BOUND: Symptoms — sustained >80% CPU utilization, slow compilation, sluggish UI. Detection: Get-Counter '\\Processor(_Total)\\% Processor Time' -SampleInterval 1 -MaxSamples 10 gives quick CPU sampling. Task Manager → Performance tab shows per-core utilization (important — a single-threaded bottleneck shows one core at 100% while others idle). Stone AI context: TypeScript compilation (tsc), Next.js build, Prisma generate are CPU-intensive operations. If CPU is the bottleneck during build, the fix is optimization (incremental builds, caching) not more RAM.

MEMORY-BOUND: Symptoms — high commit charge, page file usage climbing, "out of memory" errors, processes killed by OOM. Detection: Get-Counter '\\Memory\\Available MBytes' — below 500MB available is concerning, below 200MB is critical. Get-Counter '\\Memory\\Pages/sec' — high values indicate excessive paging (swapping). Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 10 Name, @{n='MB';e={[math]::Round($_.WorkingSet/1MB)}} shows top memory consumers. Stone AI context: Node.js default heap is ~1.7GB. Next.js dev server + Prisma Studio + Docker containers + browser can easily exhaust 8-16GB RAM. Set NODE_OPTIONS=--max-old-space-size=4096 if builds fail with heap allocation errors.

I/O-BOUND: Symptoms — disk activity at 100% in Task Manager while CPU and RAM are fine, slow file operations, build times dominated by file writes. Detection: Get-Counter '\\PhysicalDisk(_Total)\\% Disk Time' — sustained >80% indicates I/O saturation. Get-Counter '\\PhysicalDisk(_Total)\\Disk Queue Length' — above 2 means requests are queuing. Stone AI context: npm install, prisma generate (writes to node_modules), Next.js build (.next directory with thousands of files), and Docker image pulls are all I/O-heavy. SSDs mitigate but don't eliminate I/O bottlenecks. Antivirus real-time scanning of node_modules is a common hidden I/O bottleneck — exclude the project directory from Windows Defender real-time scanning.

NETWORK-BOUND: Symptoms — slow npm install, slow git push/pull, high latency to production. Detection: Measure-Command { Invoke-WebRequest -Uri "https://registry.npmjs.org" -UseBasicParsing } tests npm registry latency. Test-NetConnection stone-ai.net -Port 443 shows TCP connection time. Stone AI context: Vercel deployments, Neon database connections from local dev, Cloudflare API calls, and npm package downloads are all network-dependent. If network is the bottleneck, use npm cache (npm cache verify), git shallow clones, and local database for development.

WINDOWS PERFORMANCE MONITOR (PERFMON):
perfmon.exe provides the most detailed performance data on Windows. Key counters for Stone AI development: \\Processor(_Total)\\% Processor Time (overall CPU), \\Memory\\Available MBytes (free RAM), \\PhysicalDisk(_Total)\\% Disk Time (disk saturation), \\PhysicalDisk(_Total)\\Avg. Disk Queue Length (I/O queuing), \\Network Interface(*)\\Bytes Total/sec (network throughput), \\Process(node)\\% Processor Time (Node.js specific CPU), \\Process(node)\\Working Set (Node.js specific RAM). Create a Data Collector Set for automated monitoring: perfmon /sys to open System Monitor, then create custom collector sets that run on schedule.

DATABASE CONNECTION POOL SATURATION:
When the Prisma connection pool is exhausted, new queries queue and eventually timeout. Symptoms: API routes returning 500 after working fine under light load, "Timed out fetching a new connection from the pool" errors. Detection: SELECT count(*) FROM pg_stat_activity WHERE datname = 'stoneai' shows active connections. Default Prisma pool size is connection_limit parameter in DATABASE_URL (default ~5 for serverless). If active connections equal the pool limit, you're saturated.

NODE.JS / NEXT.JS SPECIFIC PERFORMANCE:
Event loop lag: If the event loop is blocked, the server accepts connections but doesn't respond. Detection requires instrumentation or the --inspect flag with Chrome DevTools. Memory leaks: Node.js heap grows over time and never releases. Visible via process.memoryUsage() calls or the --inspect heap profiler. Common leak sources: unclosed database connections, event listener accumulation, large objects in module-level caches. Cold starts: On Vercel serverless, each function invocation may cold-start (200-2000ms overhead). Prisma client initialization is a significant cold-start contributor — connection pooling via Prisma Accelerate or Neon's connection pooler mitigates this.`,
    },
    {
      title: "Shell Scripting & Task Automation",
      content: `Shell Scripting & Task Automation Reference:

POWERSHELL PATTERNS FOR SYSTEM ADMINISTRATION:
PowerShell is the primary automation tool for Windows system tasks in the founder's environment. Essential patterns for Chaos operations:

Process management: Get-Process | Where-Object {$_.CPU -gt 100} | Format-Table Name, Id, CPU, WorkingSet -AutoSize — find CPU-heavy processes. Stop-Process -Name "node" -Force — kill all Node processes (use carefully). Get-Process -Name "node" | Select-Object Id, StartTime, CPU, @{n='MemMB';e={[math]::Round($_.WorkingSet/1MB)}} — Node.js process details with memory in MB.

Service management: Get-Service | Where-Object {$_.Status -eq "Stopped" -and $_.StartType -eq "Automatic"} — find services that should be running but aren't. Restart-Service -Name "Redis" -Force — restart Redis. Set-Service -Name "wuauserv" -StartupType Disabled — disable Windows Update service (temporary, for performance during builds).

Scheduled tasks: Get-ScheduledTask | Where-Object {$_.State -eq "Ready"} — list active scheduled tasks. Register-ScheduledTask and New-ScheduledTaskTrigger for creating new tasks. schtasks /create /tn "StoneAI-HealthCheck" /tr "powershell -File C:\\scripts\\healthcheck.ps1" /sc HOURLY — create hourly health check.

Registry queries: Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion" — OS version details. Test-Path "HKLM:\\SOFTWARE\\Docker Inc.\\Docker\\1.0" — check if Docker is installed via registry. Get-ItemProperty "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\FileSystem" -Name LongPathsEnabled — check long path support.

BASH SCRIPTING FOR WSL2 AND GIT BASH:
Git Bash is the founder's primary shell. Key patterns:

Path handling: Always use forward slashes. Convert when needed: WINPATH=$(cygpath -w "$BASHPATH"). Common trap: /c/Users/stone/stone-ai in Git Bash = C:\\Users\\stone\\stone-ai in Windows.

Health check script pattern:
#!/bin/bash
echo "=== Stone AI Health Check ==="
docker ps --format "{{.Names}}: {{.Status}}" 2>/dev/null || echo "FAIL: Docker not running"
redis-cli ping 2>/dev/null || echo "FAIL: Redis not responding"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q 200 && echo "PASS: Dev server" || echo "WARN: Dev server not running"
git -C /c/Users/stone/stone-ai status --porcelain | head -5

WSL2 Bash (Kali): Access via wsl -d kali-linux. Run security scans: nmap -sV localhost scans local services. Scripts in WSL2 can call Windows executables: cmd.exe /c "netstat -ano" works from within WSL2.

IDEMPOTENT SCRIPT DESIGN:
Every automation script must be safe to run twice. Patterns: Check-before-act (if ! docker ps | grep -q stoneai-db; then docker start stoneai-db; fi). Use mkdir -p instead of mkdir. Use grep -q before appending to files to avoid duplicates. For service restarts, check current state first: if the service is already running and healthy, don't restart it. For file operations, use atomic writes (write to temp file, then mv/move to target) to prevent corruption on interrupted writes.

COMMON RECIPES:
Log rotation: PowerShell — Get-ChildItem "C:\\logs\\*.log" | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-7)} | Remove-Item — delete logs older than 7 days.
Temp cleanup: Remove-Item "$env:TEMP\\*" -Recurse -Force -ErrorAction SilentlyContinue — clear temp files.
Service restart with logging: Restart-Service Redis -Force; Add-Content "C:\\logs\\service-restarts.log" "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Redis restarted"
Docker cleanup: docker system prune -f --filter "until=72h" — prune resources older than 3 days without removing recent work.
Next.js cache clear: Remove-Item -Recurse -Force "C:\\Users\\stone\\stone-ai\\.next\\cache" — clear build cache when builds behave unexpectedly.

WINDOWS TASK SCHEDULER AND CRON:
Windows Task Scheduler: schtasks /create /tn "TaskName" /tr "command" /sc DAILY /st 02:00 — run daily at 2 AM. Use /ru SYSTEM for tasks that run without user login. Export/import tasks: schtasks /query /tn "TaskName" /xml > task.xml and schtasks /create /tn "TaskName" /xml task.xml.
WSL2 cron: sudo service cron start in Kali WSL2 (cron doesn't auto-start in WSL2 without systemd). crontab -e to edit. Example: 0 * * * * /home/kali/scripts/healthcheck.sh — hourly health check from WSL2. Note: WSL2 cron jobs only run while the WSL2 instance is active — they stop if the distribution is terminated.`,
    },
    {
      title: "Defensive Security Awareness",
      content: `Defensive Security Awareness Reference:

OPEN PORT AUDITING:
Every open port is an attack surface. Regular auditing ensures only expected services are listening. Primary command: netstat -ano | findstr LISTENING — shows all listening ports with owning PIDs. Cross-reference PIDs with tasklist /FI "PID eq <pid>" to identify the process. Expected ports in Stone AI environment: 3000 (Next.js dev — only when developing), 5432 (PostgreSQL via Docker — should only accept localhost), 6379 (Redis — should only accept localhost), Docker-assigned ports for MCP containers. Any port NOT in this list warrants investigation. PowerShell for structured output: Get-NetTCPConnection -State Listen | Select-Object LocalAddress, LocalPort, OwningProcess, @{n='Process';e={(Get-Process -Id $_.OwningProcess).Name}} | Sort-Object LocalPort. Schedule this check weekly minimum. An unexpected listener on port 4444, 8080, or any high-numbered port could indicate compromise.

FIREWALL RULE VERIFICATION:
Windows Defender Firewall should block all inbound by default, with explicit allow rules only for required services. Audit current rules: Get-NetFirewallRule | Where-Object {$_.Direction -eq 'Inbound' -and $_.Enabled -eq 'True' -and $_.Action -eq 'Allow'} | Select-Object DisplayName, Profile, LocalPort — shows all inbound allow rules. Each rule should be explainable. Common legitimate rules: Docker Desktop Backend, Node.js, Redis, WSL2 port forwarding. Suspicious rules: anything with a vague name, any rule allowing all ports, rules created recently that weren't requested. WSL2 bridging concern: WSL2's virtual network adapter creates its own firewall context. Traffic between Windows and WSL2 crosses the vEthernet adapter — ensure port forwarding rules (netsh interface portproxy) only forward what's needed. Don't forward 0.0.0.0 — bind to 127.0.0.1 when possible.

CREDENTIAL EXPOSURE SCANNING:
Credentials leak through predictable vectors. Scan proactively:
1. Environment files: Verify .env, .env.local, .env.production are in .gitignore. Run git ls-files | grep -i "\.env" — if any env files are tracked, they may have been committed with secrets.
2. Git history: git log --all --full-history -p -- "*.env*" checks if env files were ever committed (even if later removed, they're in history). git log --all -p -S "sk_live" searches for Stripe live keys anywhere in git history. If found, the key must be rotated — removing from history is not sufficient, assume it's compromised.
3. Docker configs: docker inspect <container> | grep -i "password\\|key\\|secret\\|token" checks for secrets passed as environment variables to containers (visible in inspect output). Use Docker secrets or env files instead of -e flags for sensitive values.
4. Process listing: tasklist /v and Get-Process may show command-line arguments that include secrets. Processes started with API keys on the command line expose those keys to any user who can list processes.
5. Shell history: Check ~/.bash_history, PowerShell (Get-History), and ~/.zsh_history for commands containing secrets. Clear with history -c (bash) or Clear-History (PowerShell).

UNUSUAL ACTIVITY RECOGNITION:
Patterns that should trigger investigation: Processes with names mimicking system processes but running from unexpected paths (svchost.exe from C:\\Users instead of C:\\Windows\\System32). Network connections to unfamiliar external IPs — Get-NetTCPConnection -State Established | Where-Object {$_.RemoteAddress -notmatch '^(127\\.|10\\.|172\\.(1[6-9]|2[0-9]|3[01])\\.|192\\.168\\.)' } shows non-local established connections. New scheduled tasks created without your knowledge: schtasks /query /fo LIST /v | findstr "TaskName\\|Next Run\\|Author" — review for unfamiliar entries. Services set to auto-start that you didn't configure: Get-Service | Where-Object {$_.StartType -eq "Automatic"} — compare against known-good baseline.

PERMISSIONS HYGIENE:
Principle of least privilege applies everywhere. Check project directory ACLs: icacls "C:\\Users\\stone\\stone-ai" — should only show stone user and SYSTEM with access, not Everyone or Users groups. Docker socket exposure: Docker Desktop's named pipe (\\\\.\\pipe\\docker_engine) grants container control to any process that can access it — ensure only your user account and Docker group have access. WSL2 file permissions: Files on /mnt/c (Windows filesystem from WSL2) have permissions determined by Windows ACLs, not Linux chmod. Files created in the WSL2 filesystem (/home/kali) respect Linux permissions. Don't store secrets in /mnt/c from WSL2 — use the native WSL2 filesystem. Node.js: npm scripts run with the same privileges as the user — a malicious postinstall script has full access to your system. Review package.json scripts before running npm install on unfamiliar projects.`,
    },
    {
      title: "Backup & Recovery Procedures",
      content: `Backup & Recovery Procedures Reference:

DATABASE BACKUP STRATEGIES:
The database is the most critical asset — user data, agent configurations, subscriptions, chat history. Multiple backup layers are essential.

pg_dump (manual/scheduled): docker exec stoneai-db pg_dump -U postgres -Fc stoneai > "C:\\Users\\stone\\backups\\stoneai_$(date +%Y%m%d_%H%M%S).dump" — custom format dump (compressed, supports selective restore). For plain SQL: replace -Fc with -Fp. Restore: docker exec -i stoneai-db pg_restore -U postgres -d stoneai --clean < backup.dump. Schedule weekly full dumps minimum, daily during active development.

Neon branching (production): Neon's killer feature is database branching — create a point-in-time copy of your production database instantly. Use before risky migrations: create a branch, run the migration on the branch, verify, then apply to main. Neon retains point-in-time recovery (PITR) history — you can restore to any point within the retention window. This is your production safety net. Access via Neon dashboard (console.neon.tech) or Neon CLI/API.

Connection string management during recovery: When restoring or switching branches, the DATABASE_URL changes. Update .env.local for local dev, Vercel environment variables for production. Run npx prisma generate after any connection string change. Verify with npx prisma db execute --stdin <<< "SELECT count(*) FROM \\"User\\"" to confirm data is accessible.

FILE SYSTEM SNAPSHOT AND RESTORE:
Windows System Restore: Creates restore points automatically. vssadmin list shadows — view existing shadow copies. Can restore individual files via Previous Versions (right-click → Properties → Previous Versions). Project-level: The entire stone-ai directory can be zipped for point-in-time snapshots: PowerShell — Compress-Archive -Path "C:\\Users\\stone\\stone-ai" -DestinationPath "C:\\Users\\stone\\backups\\stone-ai_$(Get-Date -Format yyyyMMdd).zip". Exclude node_modules and .next from backups (they're reproducible from package-lock.json and source code). Critical files to always include: prisma/schema.prisma, prisma/migrations/*, .env.local (encrypted backup), any custom scripts.

DOCKER VOLUME BACKUP AND CONTAINER REBUILD:
Docker volumes persist data independently of containers. Backup the stoneai-db volume: docker run --rm -v stoneai-db-data:/data -v C:\\Users\\stone\\backups:/backup alpine tar czf /backup/stoneai-db-data.tar.gz -C /data . — creates a compressed archive of the PostgreSQL data directory. Restore: docker run --rm -v stoneai-db-data:/data -v C:\\Users\\stone\\backups:/backup alpine tar xzf /backup/stoneai-db-data.tar.gz -C /data. Container rebuild (if container is corrupted but volume is intact): docker rm stoneai-db && docker run -d --name stoneai-db -p 5432:5432 -v stoneai-db-data:/var/lib/postgresql/data -e POSTGRES_PASSWORD=<password> postgres:16 — the volume reattaches and data is preserved. Always test volume backups by restoring to a test container before relying on them.

GIT-BASED RECOVERY:
Git is itself a backup system for source code. Key recovery commands:
git reflog — shows every HEAD position for the last 90 days, even after reset/rebase. Find the commit hash before the mistake and git reset --hard <hash> to restore.
git stash list — shows stashed work. git stash apply stash@{N} to recover. Stashes survive branch switches and are often forgotten.
Force-push rollback: If someone force-pushed to main and overwrote history, git reflog on any machine that had the old history can recover it. git push --force-with-lease origin main — safer than --force, fails if remote has commits you haven't seen.
Deleted branch recovery: git reflog | grep "branch-name" — find the last commit on the branch, then git checkout -b branch-name <hash>.
File recovery from history: git log --all --full-history -- <filepath> shows every commit that touched the file. git show <hash>:<filepath> displays the file at that commit.

RECOVERY PRIORITY ORDERING:
When multiple systems fail simultaneously, restore in this order:
1. DATABASE (highest priority) — Everything depends on data. Restore Neon production DB first, then local Docker DB.
2. DOCKER CONTAINERS — Rebuild stoneai-db container (volume should survive), restart MCP containers.
3. SOURCE CODE — Git pull from GitHub. Verify branch integrity. npm install to restore dependencies.
4. ENVIRONMENT — Verify .env.local values, Vercel env vars, Cloudflare DNS settings.
5. SERVICES — Start Redis, verify all ports, run health check protocol.
6. VERIFICATION — Run full health check. Test critical paths: auth flow, chat, agent selection, billing page.
This order minimizes time-to-recovery for the most critical user-facing functionality.`,
    },
    {
      title: "Docker Compose & Multi-Container Orchestration",
      content: `Docker Compose & Multi-Container Orchestration Reference:

SERVICE DEPENDENCIES AND STARTUP ORDER:
Docker Compose's depends_on controls startup order but NOT readiness. A database container may be "started" but not yet accepting connections. Use depends_on with condition: service_healthy to wait for actual readiness:
services:
  db:
    image: postgres:16
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
  app:
    depends_on:
      db:
        condition: service_healthy
This ensures the app container only starts after PostgreSQL is actually accepting connections. Without health-conditioned dependencies, race conditions cause intermittent startup failures — the app tries to connect before the database is ready.

HEALTH CHECKS AND RESTART POLICIES:
Every production-critical container should have both a healthcheck and a restart policy. Restart policies: "no" (default — container stays down), "always" (restart unconditionally), "on-failure" (restart only on non-zero exit), "unless-stopped" (restart unless explicitly stopped). For Stone AI: stoneai-db should use restart: unless-stopped — the database should survive Docker Desktop restarts. MCP containers can use restart: on-failure with a retry limit. Health check design: the test command should verify the service is actually functional, not just that the process exists. For PostgreSQL: pg_isready. For Redis: redis-cli ping. For a web server: curl -f http://localhost:PORT/health. For Node.js apps: a dedicated /api/health endpoint that tests database connectivity.

VOLUME MANAGEMENT:
Volumes are the persistence layer — mismanaging them means data loss. Named volumes (volumes: stoneai-db-data:) persist across container lifecycle and are managed by Docker. Bind mounts (-v /host/path:/container/path) map host directories directly — useful for development but have permission complexities on Windows. Volume types for Stone AI: stoneai-db-data (CRITICAL — contains all PostgreSQL data, never delete without backup), MCP container volumes (configuration, can be rebuilt). Volume inspection: docker volume inspect stoneai-db-data shows mount point and creation date. Volume conflicts: Two containers cannot safely write to the same volume simultaneously unless the application handles concurrent access (PostgreSQL does, plain files don't). When migrating to a new container version, create a backup of the volume BEFORE pulling the new image. Mount permission issues on Windows: Docker Desktop manages volume permissions automatically for named volumes, but bind mounts may have NTFS permission mismatches — use icacls to verify.

CONTAINER NETWORKING:
Docker creates a default bridge network. Containers on the same network can reach each other by container name (DNS resolution built in). docker network create stoneai-net creates a custom network. Connect containers: docker network connect stoneai-net stoneai-db. In Compose, all services share a network by default (projectname_default). Port mapping: -p 5432:5432 maps host port to container port. Use -p 127.0.0.1:5432:5432 to restrict access to localhost only (security best practice — don't expose database ports to all interfaces). Inter-container DNS: from one container, you can reach another by service name. If a Compose service is named "db", other containers access it at hostname "db" on the container port (NOT the mapped host port). host.docker.internal resolves to the Docker host (Windows machine) — use this when containers need to reach services running directly on Windows (like Redis on localhost:6379).

IMAGE LAYER OPTIMIZATION AND BUILD CACHING:
Docker images are built in layers — each Dockerfile instruction creates a layer. Layer caching means unchanged layers are reused. Optimization strategy: put rarely-changing instructions first (base image, system dependencies), frequently-changing instructions last (application code). For Node.js: COPY package*.json → RUN npm install → COPY . . This pattern caches the npm install layer until package.json changes. Multi-stage builds reduce final image size: use a build stage with dev dependencies, copy only built artifacts to a slim runtime stage. docker system df shows build cache size. docker builder prune clears build cache. For Stone AI's environment, regularly prune unused images: docker image prune -a --filter "until=168h" removes images not used in the last week.

DOCKER RESOURCE LIMITS AND OOM PREVENTION:
Without resource limits, a single container can consume all host resources. Set limits in Compose: deploy: resources: limits: memory: 2g, cpus: '1.5'. For the stoneai-db container, PostgreSQL's shared_buffers and work_mem should be configured relative to the container memory limit — a common rule is shared_buffers = 25% of container memory limit. Docker's OOM killer terminates containers that exceed their memory limit — the container exits with code 137. Detection: docker inspect <container> --format='{{.State.OOMKilled}}' returns true if OOM killed. Prevention: set memory limits with headroom (if PostgreSQL typically uses 500MB, set limit to 1GB), monitor with docker stats for real-time resource usage, and configure PostgreSQL's memory settings to stay within the limit. On the founder's system with AMD Radeon RX 550 and finite RAM, setting container memory limits is critical to prevent Docker from starving the host system.`,
    },
    {
      title: "WSL2 Bridge Operations",
      content: `WSL2 Bridge Operations Reference:

WSL2 NETWORKING MODEL:
WSL2 runs a lightweight Linux VM with its own network stack, connected to Windows via a virtual Hyper-V switch. Key characteristics: WSL2 gets a dynamic IP address from an internal DHCP server — this IP changes on every WSL restart. From Windows, access WSL2 via wsl hostname -I to get current IP or use localhost (localhost forwarding is enabled by default for listening ports). From WSL2, access Windows via the gateway IP: cat /etc/resolv.conf | grep nameserver | awk '{print $2}' gives the Windows host IP. NAT behavior: WSL2 traffic to the internet goes through Windows NAT. This means WSL2 shares the host's internet connection and firewall rules. Port forwarding from external to WSL2 requires explicit setup: netsh interface portproxy add v4tov4 listenport=8080 listenaddress=0.0.0.0 connectport=8080 connectaddress=$(wsl hostname -I | tr -d ' ').

DNS QUIRKS:
/etc/resolv.conf in WSL2 is auto-generated by default, pointing nameserver to the Windows host IP. This works for most cases but can break when: VPN is active on Windows (DNS gets routed through VPN tunnel, WSL2 can't resolve), Windows DNS cache is corrupted, or corporate DNS policies interfere. Fix: If DNS breaks, temporarily set nameserver to 8.8.8.8 in /etc/resolv.conf. To prevent auto-regeneration: create /etc/wsl.conf with [network] generateResolvConf = false (requires wsl --shutdown and restart). However, this means you must manually maintain DNS settings — only do this if auto-generation consistently causes problems.

FILE SYSTEM PERFORMANCE ACROSS BOUNDARIES:
This is the single most important WSL2 performance concept. The two filesystems have drastically different performance characteristics:
- Linux filesystem (/home/kali/, /tmp/, etc.): Native ext4 performance. File operations are fast. Git operations, npm install, build tools all run at full speed here.
- Windows filesystem (/mnt/c/Users/stone/): Accessed via the 9P protocol over Hyper-V sockets. File operations are 3-10x SLOWER than native. A git status on /mnt/c/Users/stone/stone-ai takes noticeably longer than on a native Linux path. npm install on /mnt/c is painfully slow due to thousands of small file writes.
Rule: If working extensively in WSL2, clone repos to the Linux filesystem (/home/kali/projects/) not /mnt/c. Only use /mnt/c for quick access to Windows files. The Stone AI project lives at C:\\Users\\stone\\stone-ai (Windows native) — access it from WSL2 via /mnt/c/Users/stone/stone-ai for reading/quick edits, but don't run heavy build operations on this path from within WSL2.

MEMORY MANAGEMENT:
WSL2's VM consumes Windows memory and doesn't automatically release it back. Default behavior: WSL2 can grow to consume up to 50-80% of total host RAM (depending on Windows version). Once allocated to the Linux VM, memory is NOT returned to Windows even if Linux frees it. This means running memory-intensive operations in WSL2 can starve Windows applications. Fix: Create or edit C:\\Users\\stone\\.wslconfig:
[wsl2]
memory=4GB
swap=2GB
processors=2
This caps WSL2 at 4GB RAM, 2GB swap, and 2 CPU cores. Adjust based on available resources — on the founder's system, allocating too much to WSL2 starves Docker Desktop, Node.js, and the browser. After changing .wslconfig, run wsl --shutdown for changes to take effect. Memory reclaim: In newer Windows builds, WSL2 supports memory reclaim (pageReporting=true in .wslconfig). This returns unused pages to Windows but isn't available on all Windows 10 builds.

KALI WSL2 INTEGRATION:
The founder's Kali distribution provides a full security testing toolkit: nmap (network scanning), nikto (web server scanning), gobuster (directory/DNS busting), burpsuite (web proxy), metasploit (exploitation framework), sqlmap (SQL injection testing). Access: wsl -d kali-linux from Windows terminal. Running Kali tools against local services: nmap -sV 172.x.x.x (use Windows host IP, not localhost) scans services visible from WSL2. For scanning Docker containers: they're accessible via the Docker bridge network or via the Windows host ports. Security testing workflow: Kali WSL2 → scan stone-ai.net staging environment → report findings → fix in Windows dev environment. Never run active scans against production without explicit founder authorization.

SYSTEMD VS INIT IN WSL2:
Older WSL2 defaults to a minimal init system — services don't auto-start, systemctl doesn't work. Newer Windows builds support systemd in WSL2: add [boot] systemd=true to /etc/wsl.conf. With systemd: systemctl start cron, systemctl enable ssh, and service management works like a real Linux server. Without systemd: use sudo service <name> start/stop (SysVinit compatibility). Cron requires manual start: sudo service cron start (won't persist across WSL restarts unless systemd is enabled). Check current init: ps -p 1 -o comm= — shows "init" (old style) or "systemd" (new style). For the founder's Kali WSL2: enabling systemd is recommended for persistent services, but be aware it increases WSL2 boot time and memory usage slightly.`,
    },
    {
      title: "Log Analysis & Pattern Recognition",
      content: `Log Analysis & Pattern Recognition Reference:

STRUCTURED VS UNSTRUCTURED LOG PARSING:
Structured logs (JSON format) are machine-parseable and filterable. Next.js API routes and Prisma can output structured logs. Unstructured logs (free-text) require regex parsing and pattern matching. Strategy: For structured JSON logs, use PowerShell's ConvertFrom-Json or jq (available in Git Bash): cat logfile.json | jq '.level == "error"'. For unstructured logs, use grep/findstr with regex patterns. When adding logging to Stone AI code, always prefer structured format: console.log(JSON.stringify({ level: 'error', message: 'DB connection failed', timestamp: new Date().toISOString(), context: { host, port, error: err.message } })). This makes future log analysis dramatically easier.

ERROR PATTERN CLASSIFICATION:
Not all errors are equal. Classification determines response urgency:

TRANSIENT errors: Occur once or intermittently, often self-resolving. Examples: network timeout on a single API call, temporary DNS resolution failure, Redis connection reset during maintenance. Pattern: appears in logs once or with large gaps between occurrences. Response: note it, check if it recurred, only investigate if it becomes persistent.

PERSISTENT errors: Occur repeatedly with consistent frequency. Examples: "ECONNREFUSED 127.0.0.1:5432" every 30 seconds (database is down), "401 Unauthorized" on every Clerk API call (auth misconfigured), "ENOMEM" on every build attempt (insufficient memory). Pattern: same error message repeating at regular intervals. Response: immediate investigation — the root cause won't self-resolve.

CASCADING errors: A single root cause triggers multiple different errors across components. Example: PostgreSQL container stops → Prisma connection errors → API routes return 500 → frontend shows error states → health check fails → monitoring alerts fire. Pattern: multiple different error types starting at approximately the same timestamp. Response: find the ROOT error (earliest timestamp, most fundamental component) and fix that — the cascade resolves automatically. Reading logs chronologically is essential for cascade identification.

CORRELATION ACROSS LOG SOURCES:
A single incident produces logs across multiple systems. Effective diagnosis requires correlating by timestamp:
1. Application logs (Next.js console output): Runtime errors, API request/response details, middleware decisions.
2. System logs (Windows Event Viewer): Service failures, driver errors, resource exhaustion events.
3. Docker logs (docker logs <container>): Container-level output, PostgreSQL query errors, health check results.
4. Database logs (PostgreSQL): Slow queries, connection limits, lock timeouts, replication status.
5. Deployment logs (Vercel): Build errors, function invocation failures, edge function timeouts.

Correlation technique: When an error appears in application logs at 14:32:15, immediately check all other log sources for the 14:32:00-14:33:00 window. Use PowerShell: Get-WinEvent -LogName System -FilterHashtable @{StartTime='2026-03-07 14:32:00'; EndTime='2026-03-07 14:33:00'} and docker logs stoneai-db --since "2026-03-07T14:32:00" --until "2026-03-07T14:33:00" simultaneously.

KEY LOG LOCATIONS FOR STONE AI:
Next.js console: stdout/stderr of the npm run dev process. In production (Vercel): vercel logs command or Vercel dashboard → Deployments → Function Logs.
Prisma query logs: Enable with log: ['query', 'error', 'warn'] in PrismaClient constructor. Query logs show every SQL statement with timing — essential for finding slow queries.
PostgreSQL logs: docker logs stoneai-db shows server output. For detailed query logging, set log_statement = 'all' in postgresql.conf (inside container). For slow query logging: log_min_duration_statement = 1000 logs queries taking >1 second.
Docker daemon logs: On Windows, Docker Desktop logs are at %LOCALAPPDATA%\\Docker\\log\\. The vm\\dockerd.log file contains Docker engine logs. Docker events: docker events --since "1h" shows container lifecycle events (start, stop, die, OOM) in the last hour.
Windows Event Viewer: eventvwr.msc or Get-WinEvent. System channel for OS events, Application channel for app crashes, Security channel for auth events.

NOISE FILTERING:
Most log volume is noise. Knowing what to ignore is as important as knowing what matters. Safe to ignore (usually): IIS/HTTP.sys warnings on a non-IIS system, Windows Search indexer events, Superfetch/SysMain optimization events, DCOM 10016 permission errors (cosmetic), browser extension console errors. Never ignore: Any error from PostgreSQL, Prisma, or Node.js in production. Any "OOM" or "out of memory" event. Any "ECONNREFUSED" to expected services. Any security event showing failed login attempts from unknown sources. Any Docker container exit with non-zero code. Build the filter progressively: start by seeing all logs, identify recurring noise, add it to an exclusion list, review the exclusion list monthly to ensure you're not filtering something that became important.`,
    },
    {
      title: "Resource Capacity Planning",
      content: `Resource Capacity Planning Reference:

DISK SPACE TREND ANALYSIS:
Disk exhaustion is the most common preventable infrastructure failure. It doesn't happen suddenly — it trends. Track free space weekly and project exhaustion date. PowerShell trend script: Get-PSDrive -PSProvider FileSystem | Select-Object Name, @{n='UsedGB';e={[math]::Round($_.Used/1GB,2)}}, @{n='FreeGB';e={[math]::Round($_.Free/1GB,2)}}, @{n='TotalGB';e={[math]::Round(($_.Used+$_.Free)/1GB,2)}}, @{n='PctFree';e={[math]::Round($_.Free/($_.Used+$_.Free)*100,1)}}. Log this output weekly. If free space decreased by 5GB this week and you have 30GB free, you have approximately 6 weeks before exhaustion.

Biggest disk consumers in Stone AI environment: node_modules (500MB-2GB per project), .next build cache (can grow to several GB), Docker images and volumes (docker system df shows breakdown), Windows Update cache (C:\\Windows\\SoftwareDistribution), npm cache (~/.npm/_cacache — can grow indefinitely), Git objects (.git directory grows with history). Cleanup priorities: npm cache clean --force (safe, packages re-download as needed), docker system prune -a --filter "until=168h" (removes unused images/containers older than 1 week), Remove-Item -Recurse "C:\\Users\\stone\\stone-ai\\.next\\cache" (safe, rebuilds on next dev/build).

MEMORY USAGE PATTERNS:
Understanding memory terminology prevents false alarms: Working Set is RAM currently in use by a process. Committed memory is what the OS has promised to processes (may exceed physical RAM via page file). Available memory is what the OS can allocate without paging. On the founder's system, baseline memory map after boot and dev environment startup: Windows OS + services (~2-3GB), Docker Desktop (~1-2GB), stoneai-db container (~200-500MB depending on queries), Redis (~50-200MB), Next.js dev server (~300-800MB), Browser (~500MB-2GB+ depending on tabs), Claude Code / terminal (~200-500MB). Total baseline: 5-9GB. If the system has 16GB RAM, that leaves 7-11GB headroom. If 8GB, headroom is tight and swap will be used.

Memory pressure indicators: Available memory consistently below 1GB, page file usage above 50% of RAM size, browser tabs crashing (Chrome's OOM), Node.js "JavaScript heap out of memory" errors. Response: identify which process grew beyond expected (Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 15 Name, @{n='MB';e={[math]::Round($_.WorkingSet/1MB)}}), close unused applications, increase Node.js heap if needed (NODE_OPTIONS=--max-old-space-size=4096).

CONNECTION POOL SIZING:
Three connection pools matter in Stone AI:

Database (Prisma → PostgreSQL): Default pool size varies by environment. In serverless (Vercel), each function invocation gets its own Prisma client — without connection pooling, you quickly hit PostgreSQL's max_connections (default 100). Neon's connection pooler (PgBouncer) sits between the app and database, multiplexing many app connections over fewer database connections. Use the pooled connection string (port 5432 with -pooler suffix in Neon) for serverless. For local development, direct connection is fine since there's only one dev server.

Redis: Node.js Redis clients maintain a connection pool. Default is usually 1 connection for basic operations. If using Redis for rate limiting, caching, and session management simultaneously, consider pool size of 5-10. Monitor with redis-cli INFO clients — connected_clients shows current connections.

HTTP (outbound API calls): When Stone AI calls OpenAI, Clerk, Stripe, etc., each uses HTTP connections. Node.js has a default maxSockets of Infinity per host but a default agent with keepAlive. For high-volume API calls, connection reuse via keep-alive is critical. If you see "ECONNRESET" or "socket hang up" errors during bursts, the connection pool is exhausting.

WHEN TO SCALE UP VS OPTIMIZE:
Cost-aware decision framework: OPTIMIZE FIRST if — the bottleneck is a known inefficiency (unoptimized query, missing index, memory leak, unnecessary computation), the fix is within your control and low-risk, or you haven't yet implemented basic optimizations (caching, connection pooling, static asset CDN). SCALE UP if — optimizations are in place and you're still hitting limits, the cost of engineer time to optimize exceeds the cost of more resources, or the bottleneck is fundamental (CPU-bound AI inference can't be optimized much, you need more compute).

FOUNDER'S HARDWARE CONSTRAINTS:
AMD Radeon RX 550: Entry-level GPU. Not suitable for local AI inference (no CUDA, limited OpenCL). GPU-dependent tasks (if any) should be offloaded to cloud. Available RAM: Critical constraint — must be shared between Windows, Docker, Node.js, browser, and any AI workloads. Monitor actively. Disk topology: Know which drive holds the project, Docker volumes, and page file. SSD vs HDD matters enormously for build performance and Docker operations. If any drive is HDD, avoid placing Docker volumes or node_modules on it.`,
    },
    {
      title: "Environment Variable & Configuration Management",
      content: `Environment Variable & Configuration Management Reference:

ENV VAR HIERARCHY (PRECEDENCE ORDER):
Environment variables can be set at multiple levels, and understanding precedence prevents "why isn't my change taking effect" debugging sessions. From lowest to highest precedence on Windows:
1. System environment variables (HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment) — apply to all users and processes. Set via System Properties → Advanced → Environment Variables → System variables. Requires restart of affected processes to take effect.
2. User environment variables (HKCU\\Environment) — apply to the current user's processes. Set via System Properties → Advanced → Environment Variables → User variables.
3. Process-level variables — set in the shell session. In Git Bash: export VAR=value. In PowerShell: $env:VAR = "value". In CMD: set VAR=value. Only last for the session.
4. .env files — loaded by dotenv or Next.js built-in env loading. Next.js precedence: .env < .env.local < .env.development < .env.development.local (for dev). .env.local is git-ignored and overrides .env.
5. Docker environment — -e VAR=value or env_file in docker-compose.yml. Applies inside the container only.
6. Vercel environment variables — set in Vercel dashboard. Scoped to Production, Preview, or Development. These are the FINAL authority for deployed code.
7. Inline process variables — NODE_OPTIONS=--max-old-space-size=4096 npm run build — highest precedence, applies to that single command.

CONFIGURATION DRIFT DETECTION:
Configuration drift happens when local dev, staging, and production environments have different variable values — causing "works on my machine" bugs. Detection strategy:
1. Maintain a canonical list of required env vars (just names, NOT values) in a .env.example file committed to git. This is the source of truth for "what variables must exist."
2. Compare local vs production variable EXISTENCE (not values): For local, check .env.local line count and variable names. For Vercel, check Vercel dashboard → Settings → Environment Variables. Every variable in .env.example should exist in both environments.
3. Common drift scenarios: New variable added to .env.local but not to Vercel (feature works locally, breaks in production). Variable renamed locally but old name still in Vercel. Variable added to Vercel for a hotfix but never added to .env.local (next developer can't run locally).
4. Automated check: Create a script that reads .env.example, checks each variable exists in .env.local (without reading values — just test existence with grep -q "^VAR_NAME=" .env.local).

SECRET ROTATION AWARENESS:
API keys and secrets expire or get compromised. Know the rotation characteristics:
- Clerk API keys: Don't expire by default, but should be rotated if exposed. Rotation: generate new key in Clerk dashboard → update .env.local and Vercel → verify auth still works → delete old key.
- Stripe API keys: Test keys (sk_test_*) don't expire. Live keys (sk_live_*) should be rotated periodically. Rotation: generate new key in Stripe dashboard → update Vercel env → test webhook endpoint → delete old key. Note: rotating the webhook signing secret (whsec_*) requires updating the webhook endpoint configuration.
- OpenAI API key: Doesn't expire but has usage limits. If compromised, delete immediately in OpenAI dashboard and generate new one. Update .env.local and Vercel.
- DATABASE_URL (Neon): Connection strings include a password. Neon allows password reset via dashboard — this changes the connection string and requires updating everywhere (local + Vercel).
- Next.js NEXT_PUBLIC_* variables: These are embedded in the client bundle at BUILD time, not runtime. Rotating a NEXT_PUBLIC_ variable requires a REBUILD and REDEPLOY to take effect. This is a common gotcha — changing the value in Vercel doesn't affect already-deployed bundles until the next deployment.

CROSS-ENVIRONMENT CONSISTENCY CHECKS:
Verification protocol for Stone AI environments:
Local dev → Check .env.local exists with required vars (names only). Run npm run build to verify all compile-time env vars resolve. Run npm run dev and test critical paths.
Vercel production → Verify all vars from .env.example exist in Vercel dashboard for the Production scope. Check that NEXT_PUBLIC_* vars match between environments (these affect client behavior). Verify DATABASE_URL points to Neon production (not a branch or local DB).
Neon database → Verify connection string is valid: npx prisma db execute --stdin <<< "SELECT 1". If using connection pooler, verify the pooled URL is used in Vercel and the direct URL is used for migrations.

COMMON MISCONFIGURATIONS:
1. Wrong DATABASE_URL: Local .env.local pointing to Neon production instead of local Docker (or vice versa). Running prisma migrate dev against production database accidentally. Fix: Always verify DATABASE_URL before running Prisma commands.
2. Stale API keys: Key was rotated in the provider dashboard but not updated in .env.local or Vercel. Symptom: 401/403 errors that "used to work." Fix: check key creation date in provider dashboard vs last update of env var.
3. Missing vars after deploy: New feature works locally because .env.local has the new variable, but Vercel deployment doesn't have it. Symptom: feature works in dev, returns undefined/500 in production. Fix: add to Vercel env vars and redeploy.
4. NEXT_PUBLIC_ confusion: Server-side code trying to use a NEXT_PUBLIC_ variable (it works, but the variable is also exposed to the client bundle — potential security issue if it contains sensitive data). Conversely, client-side code trying to use a non-NEXT_PUBLIC_ variable (returns undefined in the browser). Fix: prefix determines visibility — use NEXT_PUBLIC_ ONLY for values safe to expose to browsers.
5. Docker container env mismatch: stoneai-db container was created with -e POSTGRES_PASSWORD=X, but the DATABASE_URL in .env.local uses a different password. Symptom: "password authentication failed." Fix: check docker inspect stoneai-db for the environment variables the container was created with.`,
    },
  ],

  // ═══════════════════════════════════════════
  // 2. VERTICAL AI SAAS
  // ═══════════════════════════════════════════
  "vertical-ai-saas": [
    {
      title: "SaaS Metrics Benchmarks (2025-2026)",
      content: `Key SaaS Benchmarks — Updated for 2025-2026:

GROWTH METRICS:
AI-native companies grow 2x faster than traditional SaaS (100% vs 50% median growth). Median SaaS growth rates settled at 26% in 2026, top performers hitting 50%. For vertical SaaS, investors seek 120-150% CAGR of ARR for early-stage companies. Only 18% of Seed-funded companies raised Series A in 2025 — historically low graduation rate.

RETENTION AND CHURN:
Net Revenue Retention: Target 110-120%+ for durable growth. Monthly churn: below 5% SMB, below 2% mid-market, below 1% enterprise. Gross Revenue Retention: above 85% good, above 90% excellent.

UNIT ECONOMICS:
CAC Payback Period: 12-18 months target, though worsened to 20 months median in 2025. LTV:CAC Ratio: above 3:1 minimum, above 5:1 excellent. Free-to-paid conversion: 2-5% freemium, 10-25% free trial.

AI-SPECIFIC SAAS METRICS:
AI-native SaaS gross margins run 20-60% compared to 70-90% for traditional SaaS. AI features increase willingness to pay by 30-60%. Expect 20-40% higher infrastructure costs vs traditional SaaS. Data moat takes 6-12 months to become meaningful. Fine-tuned models on vertical data are the strongest competitive moat.

MRR GROWTH TARGETS BY STAGE:
Pre-seed: Prove problem-solution fit. Seed: $10K-50K MRR. Series A: $100K-500K MRR with clear path to $1M. Series B: $1M+ MRR with efficient growth.`,
    },
    {
      title: "Vertical AI SaaS Opportunity Map",
      content: `High-opportunity verticals for AI SaaS (2025-2026):

1. LEGAL: Contract analysis, case research, document drafting. $25B+ TAM, highly manual processes. Regulation creates barriers to entry which means higher margins. Key players: Harvey, Casetext. Entry strategy: Start with contract review for mid-size firms.

2. HEALTHCARE: Clinical notes, diagnosis support, billing optimization, patient communication. Regulated equals high barrier equals high margin. HIPAA compliance is your moat. Key players: Nuance DAX, Abridge. Entry: Start with clinical documentation for specialty practices.

3. ACCOUNTING: Receipt processing, categorization, tax preparation, anomaly detection. Repetitive data processing is ideal for AI. Key players: Vic.ai, Docyt. Entry: Start with expense categorization for SMBs.

4. REAL ESTATE: Property valuation, listing generation, market analysis, lead scoring. Fragmented and tech-underserved market. Entry: Start with AI listing description generation.

5. CONSTRUCTION: Estimate generation, safety compliance, project management, blueprint analysis. Massive inefficiency in a trillion-dollar industry. Entry: Start with takeoff and estimation automation.

6. INSURANCE: Claims processing, risk assessment, policy generation, fraud detection. Data-rich and process-heavy. Entry: Start with claims triage automation.

7. RECRUITING: Resume screening, candidate matching, outreach personalization. High volume pattern matching. Entry: Start with AI screening for specific job categories.

8. LOGISTICS: Route optimization, demand forecasting, warehouse management. Complex optimization problems AI excels at. Entry: Start with last-mile delivery optimization.

SELECTION CRITERIA: Choose verticals where you have domain expertise or access to domain experts. Regulated industries have higher barriers but stickier customers. Look for 10x improvement potential over current manual processes.`,
    },
    {
      title: "Product-Market Fit Measurement Frameworks",
      content: `Measuring and Achieving Product-Market Fit:

SEAN ELLIS TEST:
Ask users: "How would you feel if you could no longer use this product?" Measure percent answering "very disappointed." Magic number is 40% — companies below this almost always struggle to grow, those above almost always have strong traction. Survey at least 30-40 active users who have experienced core value. Run monthly to track trends.

SUPERHUMAN PMF ENGINE (5-Step Process):
1. Survey users for experience and disappointment level.
2. Segment customers to identify high-expectation customers (HXC) — the ones most disappointed without you.
3. Analyze what benefits HXC love and what shortcomings they see.
4. Implement changes: double down on what HXC love, fix what holds back "somewhat disappointed" users.
5. Track PMF score continuously. Superhuman went from 22% to 58% using this process.

AI-ACCELERATED PMF VALIDATION (2025):
AI-powered simulations combined with hybrid human interviews using frameworks like Sean Ellis and Gabor-Granger can deliver investor-ready PMF validation in weeks instead of months at a fraction of cost. Synthetic data PMF studies let pre-revenue founders simulate user surveys before having real users.

ADDITIONAL PMF SIGNALS:
Organic word-of-mouth driving 30%+ of new users. Users completing onboarding without support. Low voluntary churn (below 3% monthly). Users expanding usage naturally. Sales cycle shortening over time. NPS above 50.

WARNING SIGNS OF FALSE PMF:
Growth from heavy spending, not organic pull. High churn masked by high acquisition. Single customer or channel dependency. Usage drops after initial excitement.`,
    },
    {
      title: "AI SaaS Pricing Models (2025-2026)",
      content: `Pricing Strategy for AI-Native SaaS Products:

USAGE-BASED PRICING: 85% of AI SaaS adopted some form by 2025 (up from 28% in 2023). Charge per API call, token, document processed, or query. Best for: Variable workloads, developer tools, data processing. Risk: Revenue unpredictability. Mitigation: Minimum monthly commitments.

OUTCOME-BASED PRICING: Gartner projected 30%+ of enterprise SaaS incorporating outcome-based components by 2025. Charge per qualified lead generated, ticket resolved, conversion achieved, or revenue influenced. Best for: When your AI directly impacts measurable business results. Risk: Attribution complexity.

HYBRID MODELS (Now Standard): 67% of B2B SaaS combine multiple models. Example: Base subscription ($X/mo) plus usage overage plus outcome bonus. Nearly half of top AI companies use 2-3 pricing models simultaneously. OpenAI runs tiered subscriptions for consumers, usage-based for API, freemium for free tier.

FREEMIUM AND PLG: AI infrastructure costs make unlimited freemium unsustainable. If free-to-paid conversion is below 2-3%, free tier is too generous. "Reverse trial" (full access 14 days then downgrade) produces better conversion than permanently limited free tier. 27% of AI application spend comes through PLG — 4x the rate of traditional SaaS at 7%.

PRICING PSYCHOLOGY: Anchor high then discount (reference pricing). Three tiers: Good/Better/Best with the middle as your target. Annual prepay at 20% discount for cash flow. Price increases of 5-10% annually are expected and accepted.

AI COST WARNING: AI-native spending nearly doubled in 2025. Token usage and tier shifts inflate costs mid-contract. Vendors lure with pilot credits but production reveals 500-1000% cost underestimation. Plan gross margins carefully.`,
    },
    {
      title: "Go-to-Market Playbook: PLG vs SLG",
      content: `Product-Led Growth versus Sales-Led Growth for AI SaaS:

PRODUCT-LED GROWTH (PLG):
PLG hit 55% adoption and delivers 2x faster growth in 2025. AI-native companies scale through PLG at 4x the rate of traditional SaaS. Best for: Products with short time-to-value (under 10 minutes to aha moment), self-serve onboarding, viral or collaborative features, ACV below $5K.

PLG METRICS TO TRACK:
Time to value (first meaningful outcome), activation rate (% completing key actions), product-qualified leads (PQLs based on usage), expansion revenue from self-serve upgrades, viral coefficient (invites per user).

PLG PLAYBOOK:
1. Free tier or trial with immediate value (no credit card required).
2. In-product education (tooltips, guided tours, templates).
3. Usage limits that naturally push toward paid (not feature gates).
4. Self-serve upgrade flow with clear value proposition at moment of need.
5. Product-qualified lead scoring triggers sales assist for high-potential accounts.

SALES-LED GROWTH (SLG):
Best for: Complex products requiring explanation, ACV above $10K, enterprise buyers with procurement processes, regulated industries.

SLG PLAYBOOK:
1. Targeted outbound to ICP (email, LinkedIn, events).
2. Demo or POC focused on specific customer pain point.
3. Champion building within target organization.
4. Business case and ROI analysis for procurement.
5. Pilot program (30-60 days) with success criteria.
6. Expand to additional teams/departments post-pilot.

HYBRID (Best of Both): Start PLG to acquire SMB and mid-market. Layer SLG for enterprise at $50K+ ACV. Product usage data informs sales priorities. This is the dominant 2025-2026 pattern.`,
    },
    {
      title: "MVP Development Strategy",
      content: `Building Your AI SaaS MVP Efficiently:

NO-CODE MVP OPTIONS (Reduce dev cost by 85%):
Bubble: Complex web apps with workflows and databases. Webflow: Design-focused marketing sites and landing pages. Airtable: Backend data management and simple apps. Glide: Transform spreadsheets into mobile-first apps. Retool: Internal tools with database connections. Estimated cost: $500-5,000 vs $50,000-200,000 for custom development.

MVP TYPES BY VALIDATION STAGE:
1. LANDING PAGE MVP ($0-500): Test demand before building. Describe product, collect emails, measure signup rates. Target: 10%+ landing page conversion. Tools: Carrd, Webflow, Unbounce.

2. CONCIERGE MVP ($0-2,000): Deliver the service manually to first 5-10 customers. You ARE the AI. Simulate what would eventually be automated. Provides deepest customer insight. Validates willingness to pay.

3. WIZARD OF OZ MVP ($2,000-10,000): Looks automated to users but is human-powered behind the scenes. Build the interface, manually process the backend. Validates UX and workflow before investing in AI development.

4. SINGLE-FEATURE MVP ($5,000-30,000): Build ONE core feature that solves the main problem. Ship fast, iterate based on user feedback. Do NOT build settings pages, admin dashboards, or nice-to-haves.

FEATURE PRIORITIZATION (MoSCoW):
Must have: Core value proposition (1-2 features). Should have: Improves core experience (2-3 features). Could have: Nice but not critical (defer to v2). Won't have: Everything else (kill list).

DEVELOPMENT TIMELINE:
Week 1-2: Design and specification. Week 3-6: Core feature development. Week 7-8: Testing and iteration. Week 9-10: Launch to waitlist. Budget: $10K-50K for a functional AI SaaS MVP with a small team.`,
    },
    {
      title: "Competitive Moat Strategies for AI SaaS",
      content: `Building Defensible Moats in AI-Native SaaS:

MOAT TYPE 1 — PROPRIETARY DATA:
The strongest moat in AI SaaS. As users interact with your product, you collect data that improves your models. Competitors cannot replicate this without similar user base and time. Timeline: 6-12 months to become meaningful. Example: Each customer's usage patterns train models that get more accurate over time.

MOAT TYPE 2 — WORKFLOW LOCK-IN:
Embed deeply into customer workflows so switching costs are prohibitive. Integrations with their existing tools, custom configurations, team training, and historical data create lock-in. Net Revenue Retention above 120% signals strong workflow lock-in.

MOAT TYPE 3 — NETWORK EFFECTS:
Product gets more valuable as more people use it. Data network effects: More users generate more data that improves AI for everyone. Marketplace effects: Connect buyers and sellers within a vertical. Community effects: User-generated templates, workflows, and knowledge.

MOAT TYPE 4 — VERTICAL EXPERTISE:
Deep domain knowledge encoded into product design, prompts, workflows, and compliance features. Horizontal AI tools cannot match purpose-built vertical solutions. Regulatory compliance (HIPAA, SOC2, GDPR) as moat — expensive to achieve, hard to replicate.

MOAT TYPE 5 — SPEED AND EXECUTION:
In early markets, being fastest to ship features, onboard customers, and iterate wins. Not a durable moat alone but buys time to build others. First-mover advantage in underserved verticals.

ANTI-MOAT WARNING SIGNS:
Using off-the-shelf LLMs with no fine-tuning (anyone can replicate). No proprietary data collection. Easy-to-replicate prompts as sole IP. Single-channel customer acquisition dependency. Feature parity with competitors.

BUILD ORDER: Start with vertical expertise and speed. Add workflow lock-in through integrations. Build proprietary data advantage over 6-12 months. Achieve network effects at scale.`,
    },
    {
      title: "Fundraising: Pre-Seed through Series A",
      content: `Startup Fundraising Stages and Strategy:

PRE-SEED ($50K-500K):
Purpose: Transform idea into MVP and validate problem-solution fit. Instruments: SAFE notes (Y Combinator standard), convertible notes. Investors: Angel investors, friends/family, micro-VCs, accelerators. What they want: Compelling founder, large market, initial validation signals. Typical valuation cap: $2M-8M. Timeline: 2-4 weeks of active fundraising.

SEED ($500K-3M):
Purpose: Achieve product-market fit and find repeatable acquisition. Instruments: SAFE notes or priced equity rounds. Investors: Seed-stage VCs, angel syndicates, accelerator follow-on. What they want: Working product, early traction (revenue or engaged users), clear ICP. Typical valuation: $5M-20M. Successful startups shift from "MVP" to "V1" after seed.

SERIES A ($3M-15M):
Purpose: Scale what is already working. Only 18% of seed-funded companies reach this stage (2025). Investors: Traditional VCs demanding audit-ready metrics. What they want: $100K-500K MRR, clear unit economics, repeatable sales motion, team capable of scaling. Typical valuation: $20M-100M.

SAFE NOTES (Standard):
Y Combinator standardized, dominant for pre-seed and seed. No maturity date, no interest rate. Fast and cheap (free templates). Two types: valuation cap (sets maximum conversion price) and discount (converts at X% below next round price). Most common: cap-only SAFE at $5M-15M cap.

PITCH DECK STRUCTURE (YC Standard):
Title, Problem, Solution, Market Size, Business Model, Traction, Competition, Team, Financials, Ask. Keep to 10-12 slides. Each slide should be understandable in 10 seconds. Lead with traction if you have it.

KEY METRICS INVESTORS WANT:
MRR and growth rate. CAC and payback period. LTV:CAC ratio. Churn rate (gross and net). Burn rate and runway (maintain 12-18 months minimum).`,
    },
    {
      title: "Unit Economics and Financial Modeling",
      content: `SaaS Financial Modeling Essentials:

UNIT ECONOMICS CALCULATION:
Customer Lifetime Value (LTV) = ARPU / Monthly Churn Rate.
Example: $200 ARPU, 3% monthly churn. LTV = $200 / 0.03 = $6,667.

Customer Acquisition Cost (CAC) = Total Sales and Marketing Spend / New Customers Acquired.
Example: $50,000 spend, 100 new customers. CAC = $500.

LTV:CAC Ratio = $6,667 / $500 = 13.3:1 (excellent; above 3:1 is healthy).

CAC Payback Period = CAC / (ARPU x Gross Margin).
Example: $500 / ($200 x 0.75) = 3.3 months (excellent; under 12 months is healthy).

BURN RATE AND RUNWAY:
Gross Burn: Total monthly operating costs regardless of revenue. Net Burn: Monthly expenses minus monthly revenue. Runway = Cash in bank / Net Burn Rate.
Rule: Spend no more than 1/12 to 1/18 of total funding per month (12-18 months runway). Start fundraising at 8-10 months remaining, never wait until under 6.

T2D3 GROWTH TRAJECTORY:
Triple revenue Year 1, Triple Year 2, Double Year 3, Double Year 4, Double Year 5. This is the gold standard for venture-backed SaaS growth. Gets you from $1M to $72M ARR in five years.

RULE OF 40:
Revenue Growth Rate + Profit Margin should equal or exceed 40%. Apply AFTER the T2D3 stage. Early-stage: prioritize growth over margins assuming sufficient runway. Growth stage: start balancing efficiency with growth.

FINANCIAL MODEL COMPONENTS:
Revenue: MRR by cohort, expansion, churn, new. Costs: COGS (hosting, APIs, support), OpEx (salaries, marketing, G&A). Cash flow: Monthly burn, runway projection. Scenarios: Base case, upside, downside with different growth and churn assumptions.`,
    },
    {
      title: "SaaS Go-to-Market Launch Playbook",
      content: `Step-by-Step GTM Launch for AI SaaS:

PHASE 1 — PRE-LAUNCH (8-12 weeks before):
Build waitlist landing page with clear value proposition. Target 500-2,000 signups before launch. Create content that establishes authority in your vertical (blog posts, LinkedIn, Twitter threads). Identify and engage 20-30 design partners for beta access. Set up analytics (Mixpanel, Amplitude, or PostHog) from day one.

PHASE 2 — BETA LAUNCH (4-8 weeks):
Invite top 50-100 waitlist signups as beta users. Offer lifetime discount or founder pricing for early adopters. Implement feedback loops (in-app surveys, weekly calls with power users). Track activation metrics obsessively. Fix onboarding friction before public launch. Get 5-10 testimonials and case studies ready.

PHASE 3 — PUBLIC LAUNCH (Launch week):
Product Hunt launch (schedule for Tuesday or Wednesday). Hacker News Show HN post. Targeted email to full waitlist. Social media blitz across LinkedIn, Twitter/X. Outreach to niche media and newsletters in your vertical. Enable self-serve signup with clear onboarding flow.

PHASE 4 — POST-LAUNCH GROWTH (Ongoing):
Content marketing with SEO targeting buyer intent keywords. Community building (Slack, Discord, or forum). Integration partnerships with complementary tools. Customer referral program. Paid acquisition testing (Google Ads, LinkedIn Ads for B2B).

LAUNCH METRICS TO HIT:
Week 1: 100-500 signups. Month 1: 20-50 active users, 5-15 paying. Month 3: 50-200 paying customers, $5K-20K MRR. Month 6: Product-market fit signals, $20K-50K MRR.

COMMON LAUNCH MISTAKES: Launching without onboarding flow. No analytics from day one. Waiting for "perfect" product. Targeting too broad an audience. Not having pricing page ready.`,
    },
  ],

  // ═══════════════════════════════════════════
  // 3. CUSTOMER SUPPORT BOT
  // ═══════════════════════════════════════════
  "customer-support-bot": [
    {
      title: "Customer Support Automation and AI Integration (2025-2026)",
      content: `AI-Powered Support Automation — Current State of the Art:

AI CHATBOT CAPABILITIES (2025):
Modern AI support chatbots can handle 40-70% of incoming queries without human intervention. Key capabilities: FAQ resolution, order status lookup, appointment scheduling, password resets, return initiation, basic troubleshooting, and document retrieval.

IMPLEMENTATION TIERS:
Tier 1 — Rule-Based Bot ($0-500/mo): Decision trees, keyword matching, canned responses. Handles 20-30% of queries. Tools: Tidio, Crisp, Tawk.to. Best for: <200 tickets/month, simple queries.

Tier 2 — AI-Enhanced Bot ($200-2,000/mo): NLP intent detection, context awareness, knowledge base search. Handles 40-50% of queries. Tools: Intercom Fin, Zendesk AI, Freshdesk Freddy. Best for: 200-5,000 tickets/month.

Tier 3 — Custom AI Agent ($1,000-10,000/mo): RAG-powered, trained on your data, multi-turn conversations, API integrations for actions (refunds, account changes). Handles 50-70% of queries. Tools: Custom (LangChain + your data), Voiceflow, Ada. Best for: 5,000+ tickets/month.

ROI CALCULATION:
Cost per human ticket: $8-15 average. Cost per AI-resolved ticket: $0.50-2.00.
If AI resolves 500 tickets/month at $1 each vs human at $10 each: Monthly savings = $4,500. Annual savings = $54,000.
Payback period for Tier 2 implementation: 1-3 months.

HANDOFF INTELLIGENCE:
The critical metric is false-positive resolution — when the bot thinks it solved the issue but didn't. Monitor: Post-resolution surveys, ticket reopens within 24 hours, repeat contacts within 7 days. Target false-positive rate: <5%.`,
    },
    {
      title: "Support Team Structure and Scaling Playbook",
      content: `Building a Support Team — From Solo to Scale:

SUPPORT TEAM EVOLUTION:
Stage 1 (0-100 tickets/mo): Founder handles support. Set up shared inbox (Front, HelpScout). Create 20-30 canned responses for common questions. Build initial FAQ page.

Stage 2 (100-500 tickets/mo): First hire — generalist support agent. Implement helpdesk (Freshdesk recommended at this stage). Create internal knowledge base. Define SLAs: <4 hour first response, <24 hour resolution.

Stage 3 (500-2,000 tickets/mo): 2-4 agents with shift coverage. Add chatbot for Tier 1 deflection. Implement QA program (review 5-10% of tickets weekly). Specialize: billing issues vs technical issues.

Stage 4 (2,000-10,000 tickets/mo): Support lead + team of 5-10. Add phone/live chat channels. Implement tier-2 escalation for complex issues. Build customer health scoring. Monthly business reviews with product team.

Stage 5 (10,000+ tickets/mo): Support manager + team leads + 15-30 agents. Dedicated QA analyst. Workforce management for scheduling. Advanced AI deflection (50%+ target). Customer success separation from support.

KEY HIRING METRICS:
- Tickets per agent per day: 20-30 (email), 40-60 (chat), 30-50 (phone).
- Hire when agents consistently exceed capacity for 2+ weeks.
- Training ramp: 2-4 weeks to full productivity for Tier 1 agents.

QUALITY ASSURANCE FRAMEWORK:
Score tickets on: Accuracy (correct resolution), Tone (empathetic, professional), Efficiency (resolved in fewest interactions), Process (followed SOPs, used correct macros). Target QA score: 85%+ per agent. Below 75%: coaching plan. Below 65%: performance improvement plan.`,
    },
    {
      title: "Knowledge Base Design and Self-Service Optimization",
      content: `Building a Knowledge Base That Actually Deflects Tickets:

CONTENT ARCHITECTURE:
Organize by customer journey, not internal departments:
1. Getting Started (onboarding, setup, first steps)
2. Using [Product] (features, how-tos, tutorials)
3. Account & Billing (payments, subscriptions, invoices)
4. Troubleshooting (common issues, error messages, fixes)
5. Integrations (third-party connections, API docs)
6. Policies (returns, refunds, privacy, terms)

ARTICLE WRITING FORMULA:
Title: Use the exact question customers ask (e.g., "How do I reset my password?" not "Password Management")
Structure: Problem statement (1 sentence) → Solution steps (numbered, with screenshots) → Expected outcome → Related articles → Still need help? Contact us.
Length: 200-500 words per article. Shorter is better. Use screenshots and GIFs liberally.

SEARCH OPTIMIZATION:
- Include synonyms and common misspellings in article metadata
- Tag articles with related search terms customers actually use
- Review search queries with zero results weekly — those are content gaps
- Most-searched terms should map to your best articles

DEFLECTION MEASUREMENT:
Track: Articles viewed → "Was this helpful?" response → Ticket created after viewing. Target: 60-70% of article viewers do NOT create a ticket afterward. Below 40%: article needs rewriting.

CONTENT MAINTENANCE:
- Review all articles quarterly. Update screenshots, pricing, feature changes.
- Archive articles for deprecated features.
- Track "not helpful" feedback and rewrite bottom 10% of articles monthly.
- New feature launch = new KB article published same day. Never launch a feature without documentation.

TOOLS: Intercom Articles, Zendesk Guide, HelpScout Docs, Notion (budget option), GitBook (developer-focused). Cost: $0-50/month depending on platform.`,
    },
  ],

  // ═══════════════════════════════════════════
  // 4. EMAIL MARKETING SPECIALIST
  // ═══════════════════════════════════════════
  "email-marketing-specialist": [
    {
      title: "Email List Growth Strategies (2025-2026)",
      content: `Proven Email List Growth Tactics — From 0 to 100K Subscribers:

LEAD MAGNET TYPES (Ranked by Conversion Rate):
1. Templates & Swipe Files (25-50% opt-in rate): Ready-to-use templates solve immediate problems. Examples: email templates, social media templates, spreadsheet templates, proposal templates.
2. Checklists & Cheat Sheets (20-40%): Quick-reference guides. Examples: launch checklist, SEO audit checklist, onboarding checklist.
3. Mini-Courses (15-30%): 5-7 day email courses. High perceived value. Excellent for nurture sequences.
4. Calculators & Tools (15-35%): Interactive tools that provide personalized results. Examples: ROI calculator, salary calculator, pricing calculator.
5. Ebooks & Guides (10-25%): In-depth resources. Higher effort to create but establish authority.
6. Webinars (20-40% registration, 30-50% attendance): Live or evergreen. Best for high-ticket offers.

OPT-IN FORM PLACEMENT (by conversion rate):
- Exit-intent popup: 2-5% conversion rate. Triggered when cursor moves toward closing tab.
- Inline content upgrade: 3-8%. Contextual offer within a blog post.
- Sticky bar (top/bottom of page): 1-3%. Always visible, low friction.
- Sidebar widget: 0.5-1.5%. Standard but low-performing.
- Landing page (dedicated): 20-50%. Use for paid traffic and social bio links.
- Welcome mat (full-screen): 2-7%. Aggressive but effective. Test carefully.

GROWTH CHANNELS:
- Content SEO: Write blog posts targeting buyer-intent keywords. Add lead magnet upgrade to each post.
- Social media: Link in bio to landing page. Mention lead magnet in posts. Use "DM me [keyword]" on IG/TikTok.
- Referral programs: SparkLoop, ReferralHero. Give subscribers rewards for sharing. Typical referral rate: 5-15% of subscribers.
- Cross-promotions: Partner with complementary newsletters. Swap recommendations. Use Swapstack or SparkLoop partner network.
- Paid acquisition: Facebook/Instagram ads to lead magnet landing page. Target CPA: $1-5 per subscriber. Only profitable if you have monetization in place.

LIST GROWTH BENCHMARKS:
Month 1-3: 100-500 subscribers (organic only). Month 3-6: 500-2,000. Month 6-12: 2,000-10,000 (with paid + referrals). Year 2: 10,000-50,000 (with consistent content + growth loops).`,
    },
    {
      title: "Email Automation Sequences That Drive Revenue",
      content: `High-Impact Email Automation Sequences:

CART ABANDONMENT SEQUENCE (E-commerce — recovers 5-15% of abandoned carts):
Email 1 (1 hour after abandonment): Subject: "You left something behind" — Reminder with product image, no discount yet.
Email 2 (24 hours): Subject: "Still thinking about it?" — Add social proof (reviews, ratings). Address common objections.
Email 3 (72 hours): Subject: "Last chance: 10% off your cart" — Offer small discount or free shipping. Create urgency.
Benchmark: 45% open rate on email 1, declining to 25% on email 3. 5-15% total recovery rate.

POST-PURCHASE SEQUENCE (Increases repeat purchases by 20-30%):
Email 1 (Immediate): Order confirmation with expected delivery date. Cross-sell recommendation.
Email 2 (Day 3): "How to get the most out of [product]" — Usage tips, setup guide, video tutorial.
Email 3 (Day 7): "How's everything going?" — Check-in, link to support if needed.
Email 4 (Day 14): Review request. Include direct link to leave a review. Offer incentive if appropriate.
Email 5 (Day 30): Cross-sell or replenishment reminder based on product type.

RE-ENGAGEMENT SEQUENCE (Win back 5-10% of inactive subscribers):
Trigger: No opens or clicks for 90 days.
Email 1: Subject: "We miss you! Here's what you've been missing" — Highlight best content from past 90 days.
Email 2 (Day 3): Subject: "Is this goodbye?" — Emotional appeal. Ask what they want to receive.
Email 3 (Day 7): Subject: "Last email unless you say stay" — Clear ultimatum. Click to stay on list.
Post-sequence: Remove all non-responders from active list. This improves deliverability for remaining subscribers.

LEAD NURTURE SEQUENCE (B2B — moves leads through funnel):
Email 1: Educational content addressing their primary pain point.
Email 2 (Day 3): Case study showing how someone like them solved the problem.
Email 3 (Day 7): Tool or framework they can use immediately.
Email 4 (Day 10): Comparison guide (your solution vs alternatives).
Email 5 (Day 14): Soft CTA — "Book a 15-minute call to see if we can help."
Email 6 (Day 21): Direct offer with urgency or bonus.`,
    },
    {
      title: "Email Platform Selection and Migration Guide",
      content: `Email Marketing Platform Comparison (2025-2026):

CONVERTKIT (now Kit):
- Pricing: Free to 10K subscribers, Creator $29/mo (1K subs), Creator Pro $59/mo.
- Best for: Creators, bloggers, course creators, solopreneurs.
- Strengths: Best visual automation builder, landing pages included, commerce features (sell digital products), tag-based subscriber management.
- Weaknesses: Limited design templates, basic reporting, no SMS.

MAILCHIMP:
- Pricing: Free to 500 contacts, Essentials $13/mo, Standard $20/mo, Premium $350/mo.
- Best for: Small businesses, beginners, e-commerce (Shopify/WooCommerce integration).
- Strengths: Easiest to learn, good templates, built-in CRM, AI content suggestions.
- Weaknesses: Pricing escalates fast, charges for unsubscribed contacts, limited automation on lower tiers.

ACTIVECAMPAIGN:
- Pricing: Lite $29/mo (1K contacts), Plus $49, Professional $149, Enterprise $259.
- Best for: B2B, agencies, businesses needing advanced automation and CRM.
- Strengths: Most powerful automation engine, built-in CRM, lead scoring, site tracking, 900+ integrations.
- Weaknesses: Steeper learning curve, can be overkill for simple needs.

KLAVIYO:
- Pricing: Free to 250 contacts, Email $20/mo (251-500), Email+SMS $35/mo.
- Best for: E-commerce (Shopify, BigCommerce, WooCommerce).
- Strengths: Deep e-commerce integrations, predictive analytics, revenue attribution, SMS built-in.
- Weaknesses: Expensive at scale, primarily e-commerce focused.

BEEHIIV:
- Pricing: Free to 2,500 subs, Scale $49/mo, Max $99/mo.
- Best for: Newsletter businesses, media companies, content creators monetizing via ads.
- Strengths: Built-in monetization (ad network, premium subscriptions), referral program, SEO-optimized web hosting, growth tools.
- Weaknesses: Limited automation compared to ActiveCampaign, focused on newsletter model.

MIGRATION CHECKLIST:
1. Export all contacts with tags/segments and custom fields.
2. Recreate automation sequences in new platform (screenshot old ones first).
3. Update all opt-in forms and landing pages.
4. Set up DNS records (SPF, DKIM, DMARC) for new platform.
5. Warm up new sending domain/IP if applicable.
6. Send first email to most engaged segment only.
7. Monitor deliverability closely for first 2 weeks.
8. Update integrations (CRM, e-commerce, website forms).`,
    },
  ],

  // ═══════════════════════════════════════════
  // 5. MEETING SCRIBE
  // ═══════════════════════════════════════════
  "meeting-scribe": [
    {
      title: "Meeting Transcript Processing and Summarization",
      content: `Transforming Raw Meeting Content into Actionable Summaries:

PROCESSING METHODOLOGY:
When given a raw transcript, voice memo, or rough notes, follow this extraction pipeline:

PASS 1 — STRUCTURE IDENTIFICATION:
Scan the entire document and identify: Meeting participants, topics discussed (map to agenda if available), key transitions between topics, questions raised, answers provided, and unresolved items.

PASS 2 — DECISION EXTRACTION:
A decision is a statement where the group agreed on a course of action. Look for: "Let's go with..." / "We've decided to..." / "The plan is..." / "We'll do X" / "Approved" / "Agreed." For each decision, capture: What was decided, who made or approved the decision, what alternatives were discussed, and any conditions or caveats.

PASS 3 — ACTION ITEM EXTRACTION:
An action item is a commitment by a specific person to do something by a specific time. Look for: "I'll handle..." / "[Name] will..." / "Can you take care of..." / "We need someone to..." / "By next [day]..." Flag ambiguous commitments: "We should probably..." or "Someone needs to..." — these need owner assignment.

PASS 4 — CONTEXT AND SENTIMENT:
Note any tensions, disagreements, enthusiasm, or concerns expressed. These provide crucial context for absent stakeholders. Flag items where there was visible disagreement — these may need follow-up.

OUTPUT FORMAT PRIORITY:
For executive stakeholders: 3-5 bullet summary + decisions + their action items only.
For project managers: Full structured notes + all action items + timeline impacts.
For absent team members: Narrative summary with context + relevant action items.
For meeting records: Complete structured minutes with all details preserved.

TOOLS FOR MEETING TRANSCRIPTION:
Otter.ai ($8-24/mo): Best for real-time transcription, speaker identification. Integrates with Zoom, Teams, Meet.
Fireflies.ai ($10-39/mo): Auto-joins meetings, AI summaries, CRM integration.
tl;dv ($20-40/mo): Video + transcript, timestamp highlights, shareable clips.
Whisper (free, self-hosted): OpenAI's open-source model. Best accuracy for offline processing.`,
    },
    {
      title: "Recurring Meeting Management and Follow-Through",
      content: `Managing Recurring Meetings for Maximum Accountability:

THE RECURRING MEETING OPERATING SYSTEM:
Recurring meetings (weekly standups, project syncs, leadership meetings) require a tracking system that persists across sessions.

PRE-MEETING AUTOMATION:
24 hours before: Auto-send reminder with: (1) Outstanding action items from last meeting with current status, (2) Proposed agenda based on carryover items + new submissions, (3) Pre-read materials if applicable, (4) Request for agenda additions.

MEETING OPENING SEQUENCE (First 5 minutes):
1. Review outstanding action items from last meeting (2 minutes): For each item: Done / In Progress / Blocked / Deferred. Blocked items get 60 seconds of group problem-solving. Deferred items get new dates or are formally killed.
2. Confirm today's agenda and time allocation (1 minute).
3. Identify any time-sensitive items that need priority discussion (2 minutes).

MEETING CLOSING SEQUENCE (Last 5 minutes):
1. Facilitator reads back all new action items: "[Name] will [action] by [date]."
2. Each owner verbally confirms understanding and commitment.
3. Set agenda seeds for next meeting.
4. Note-taker commits to sending summary within 2 hours.

TRACKING ACROSS MEETINGS:
Maintain a running action item ledger (shared Google Sheet, Notion database, or project tool):
| Item | Owner | Created | Due | Status | Meeting # | Notes |
Items carry forward automatically until marked Done or Killed. Items deferred 3+ times trigger an escalation: either the item is not important (kill it) or something is blocking it (escalate).

MEETING HEALTH METRICS (Review Quarterly):
- Average duration vs scheduled duration (target: within 5 minutes)
- Action item completion rate (target: 80%+ completed by next meeting)
- Attendance rate (target: 90%+, consistent no-shows should be removed)
- Decisions per meeting (target: 2-5, zero decisions = meeting could have been an email)
- NPS from attendees (quarterly survey: "Is this meeting a good use of your time?")`,
    },
    {
      title: "Follow-Up Email Templates and Communication Frameworks",
      content: `Post-Meeting Communication — Templates for Every Scenario:

STANDARD FOLLOW-UP EMAIL TEMPLATE:
Subject: [Meeting Name] — Summary & Action Items — [Date]

Hi team,

Thanks for a productive session. Here's the summary:

**Key Decisions:**
1. [Decision 1] — Decided by [name/group]
2. [Decision 2] — Decided by [name/group]

**Action Items:**
| # | Action | Owner | Due | Priority |
|---|--------|-------|-----|----------|
| 1 | [Description] | @Name | [Date] | P1 |
| 2 | [Description] | @Name | [Date] | P2 |

**Discussion Highlights:**
- [Topic 1]: [Key points and conclusions]
- [Topic 2]: [Key points and conclusions]

**Parking Lot (for future discussion):**
- [Topic deferred to next meeting]

**Next Meeting:** [Date, Time]

Let me know if I missed anything or if any action items need clarification.

CLIENT MEETING FOLLOW-UP:
Subject: Great connecting — next steps from our [Date] meeting

Hi [Client Name],

Thank you for your time today. I wanted to capture our discussion and confirm next steps:

**What we discussed:**
- [Key topic 1 and client's perspective]
- [Key topic 2 and alignment reached]

**What we agreed to:**
1. [Your team] will [deliverable] by [date]
2. [Client team] will [their action] by [date]

**Next steps:**
- [Specific next milestone]
- Our next touchpoint is scheduled for [date/time]

Please reply if any of the above needs adjustment. Looking forward to [next milestone].

ESCALATION EMAIL (for overdue action items):
Subject: [Project] — Outstanding items requiring attention

Hi [Name/Team],

Following up on action items from our [Date] meeting that are past due:

| # | Item | Owner | Original Due | Days Overdue |
|---|------|-------|-------------|-------------|
| 1 | [Description] | @Name | [Date] | [X] days |

These items are blocking [downstream impact]. Can you provide an updated ETA by end of day?

If there are blockers I can help remove, let me know.`,
    },
  ],

  // ═══════════════════════════════════════════
  // 6. PROPOSAL WRITER
  // ═══════════════════════════════════════════
  "proposal-writer": [
    {
      title: "RFP Response Strategy and Compliance Framework",
      content: `Winning RFP Responses — Strategy and Execution:

RFP RESPONSE DECISION FRAMEWORK:
Before responding to any RFP, evaluate with the Bid/No-Bid Matrix:
- Do we have a relationship with the buyer? (+3 if yes, -2 if no)
- Do we have relevant past performance? (+3 if yes, -1 if no)
- Is the scope within our core capabilities? (+3 if yes, -3 if no)
- Do we understand the competitive landscape? (+2 if yes, -1 if no)
- Is the contract value worth the pursuit cost? (+2 if yes, -2 if no)
- Was the RFP wired for a competitor? (-3 if suspected)
Score 8+: Pursue aggressively. Score 4-7: Pursue selectively. Score <4: No-bid.

COMPLIANCE MATRIX:
Create a compliance matrix mapping EVERY RFP requirement to your response:
| RFP Section | Requirement | Our Response Section | Compliant? | Notes |
Non-compliance on mandatory requirements = automatic disqualification. Address every single requirement, even if the answer is "acknowledged" or "understood."

RFP RESPONSE TIMELINE:
Day 1-2: Receive RFP → Bid/No-bid decision → Assign response team → Create compliance matrix.
Day 3-5: Outline response → Assign section writers → Begin drafting → Submit clarification questions.
Day 6-12: Draft all sections → Internal review → Red team review (someone plays evaluator).
Day 13-14: Final editing → Executive review → Pricing finalization → Quality check.
Day 15: Production (formatting, printing if physical) → Submission (always submit 24 hours early).

EVALUATION SCORING:
Most RFPs use weighted scoring:
- Technical Approach: 30-40% weight
- Past Performance/Experience: 20-30%
- Key Personnel: 15-20%
- Price: 20-30%
- Management Approach: 10-15%
Tailor emphasis based on published evaluation criteria. If price is lowest weight, emphasize value. If past performance is highest, lead with case studies.

DIFFERENTIATORS THAT WIN:
- Specificity: Reference the client's exact situation, not generic capabilities
- Proof points: Quantified results from similar projects
- Innovation: Propose something the competitor hasn't thought of
- Risk mitigation: Show you've anticipated and planned for potential problems
- Team continuity: Named team members with relevant bios, not "TBD staff"`,
    },
    {
      title: "Pricing Strategy for Proposals and Bids",
      content: `Proposal Pricing — Strategies That Win Deals and Protect Margins:

PRICING MODELS:
Fixed Price: Client knows total cost upfront. You absorb risk of overruns. Best for: Well-defined scope, repeatable work. Tip: Add 15-25% buffer for unknowns.

Time & Materials (T&M): Bill actual hours + expenses. Client absorbs risk. Best for: Undefined scope, R&D, consulting. Tip: Provide an estimate range to set expectations.

Retainer: Monthly fixed fee for ongoing work. Best for: Continuing relationships. Tip: Define scope boundaries clearly — retainer ≠ unlimited work.

Value-Based: Price based on value delivered to client, not your cost. Best for: High-impact work with measurable ROI. Tip: Anchor to the client's cost of inaction or potential revenue gain.

THREE-TIER PRICING (Always offer options):
Option A (Good) — $X: Core deliverables only. Meets minimum requirements.
Option B (Better) — $1.5-2X: Core + enhanced features. Recommended option.
Option C (Best) — $2-3X: Full solution with premium add-ons. Includes ongoing support.

Psychology: 60-70% of buyers choose the middle option. The high option makes the middle feel reasonable. The low option anchors that you can be flexible.

PRICING PRESENTATION:
- Always present investment before listing deliverables (frame the cost in terms of value first)
- Include ROI calculation: "Based on [client's savings/revenue impact], this investment pays for itself in [X] months"
- Break large numbers into monthly equivalents: "$60,000/year" → "$5,000/month" → "$165/day"
- Include what's NOT included — this prevents scope creep and sets up upsell conversations
- Payment milestones should align with deliverable milestones — client pays when they receive value

COMPETITIVE PRICING INTELLIGENCE:
Research competitor pricing through: Public case studies and testimonials (often mention budgets), Glassdoor salaries (estimate their cost structure), Industry rate surveys (Clio Legal Trends, SIA staffing data), RFP debrief requests (ask why you lost and if price was a factor).

MARGIN TARGETS BY SERVICE TYPE:
- Consulting/Strategy: 60-75% gross margin
- Custom Development: 40-60% gross margin
- Managed Services/Retainer: 50-65% gross margin
- Staffing/Augmentation: 25-40% gross margin`,
    },
    {
      title: "Persuasive Business Writing Techniques for Proposals",
      content: `Writing Techniques That Win Proposals:

THE "SO WHAT?" TEST:
Every sentence in a proposal must pass the "So what?" test from the client's perspective. If a sentence doesn't clearly benefit the client, rewrite or remove it.
BAD: "Our company was founded in 2010 and has 200 employees."
GOOD: "In 15 years of operation, our 200-person team has delivered 500+ projects with a 95% on-time completion rate — giving you confidence in our ability to deliver your project on schedule."

FEATURE → BENEFIT → PROOF FORMULA:
Feature: What you do. Benefit: Why it matters to the client. Proof: Evidence it works.
Example: "Our dedicated project manager (feature) ensures a single point of contact who keeps your project on schedule (benefit), which is why 95% of our projects deliver within 5% of the original timeline (proof)."

POWER WORDS FOR PROPOSALS:
Trust: proven, verified, guaranteed, certified, demonstrated, track record.
Urgency: immediate, accelerate, fast-track, streamlined, efficient.
Value: optimize, maximize, enhance, transform, revolutionize, ROI.
Safety: protect, secure, mitigate, ensure, safeguard, compliance.
Avoid: "try," "hope," "believe," "might," "possibly" — these signal uncertainty.

STORYTELLING STRUCTURE FOR CASE STUDIES:
The Problem: Paint a vivid picture of the client's pain. Use their words if possible.
The Turning Point: What changed? How did they find you? What was the catalyst?
The Solution: What specifically did you implement? Be detailed enough to be credible.
The Result: Quantified outcomes. Before/after metrics. Timeline to results.
The Testimonial: Direct quote from the client. Named and titled if possible.

VISUAL DESIGN PRINCIPLES:
- White space is your friend — dense text walls feel overwhelming
- Use professional, consistent formatting throughout (fonts, colors, headers)
- Include at least 3-5 visuals: timeline chart, architecture diagram, team photos, process flow, comparison table
- Pull quotes from case studies in larger text as visual anchors
- Page numbers and headers/footers on every page for professionalism
- Consistent use of your brand colors — subtle but present`,
    },
  ],

  // ═══════════════════════════════════════════
  // 7. SOCIAL MEDIA MANAGER
  // ═══════════════════════════════════════════
  "social-media-manager": [
    {
      title: "Social Media Growth Hacking and Viral Content Strategies",
      content: `Social Media Growth Tactics That Scale (2025-2026):

THE VIRAL CONTENT FORMULA:
Virality = (Emotional Trigger × Shareability × Timing) / Friction.
Emotional triggers that drive sharing: Awe (mind-blowing facts/visuals), Humor (relatable memes, unexpected twists), Outrage (controversial takes — use carefully), Inspiration (transformation stories), Nostalgia (throwbacks, "remember when").

HOOK FORMULAS THAT STOP THE SCROLL:
1. "Stop doing [common practice]" — Contrarian hooks challenge assumptions
2. "I [achieved result] in [timeframe]. Here's how." — Proof-based hooks
3. "The #1 mistake [audience] makes with [topic]" — Fear of missing out
4. "[Authority figure] just said [surprising thing] about [topic]" — News-jacking
5. "This [simple thing] changed my [area] forever" — Transformation hooks
6. "Nobody is talking about [topic]" — Exclusivity and insider knowledge
7. "I tested [X] for [timeframe]. The results surprised me." — Experiment hooks

GROWTH HACKING TACTICS:
Engagement Pods (use carefully): Groups of 10-20 accounts that engage with each other's content immediately after posting. Boosts early engagement signals. Risk: Platform detection and penalization. Use organic engagement groups, not automated.

Comment Strategy: Leave thoughtful comments on larger accounts in your niche. Don't pitch — add value. Top comments on viral posts can drive 100-500 profile visits per comment. Aim for 20-30 strategic comments per day.

Content Collaboration: Duets (TikTok), collabs (IG), co-created content with complementary creators. Exposes you to their audience. Target accounts 2-5x your size for optimal growth.

Trending Audio/Sounds: On TikTok and Reels, trending audio is an algorithmic boost. Use sounds within first 48 hours of trending. Add your niche twist to make it relevant.

Cross-Platform Repurposing: Create once, distribute everywhere. TikTok video → IG Reel → YouTube Short → LinkedIn video → X clip. Each platform gets native upload (never share TikTok links on IG).

GROWTH BENCHMARKS:
0-1K followers: Focus on consistency (30+ posts). Find your content pillars. Engage heavily.
1K-10K: Double down on what works. Collaborate with similar-sized creators. Start monetization planning.
10K-50K: Systematize content creation. Hire editor or use AI tools. Launch products/services.
50K-100K: Brand partnerships. Diversify platforms. Build email list from social following.
100K+: You're a media company. Hire team. Multiple revenue streams.`,
    },
    {
      title: "Community Management and Crisis Communication",
      content: `Community Management — Building Engaged Audiences:

COMMUNITY MANAGEMENT DAILY WORKFLOW:
Morning (30 min): Review all comments and DMs from overnight. Respond to urgent items. Flag any negative sentiment or potential issues.
Midday (20 min): Respond to remaining comments. Engage with community posts/UGC. Monitor brand mentions.
Afternoon (20 min): Proactive engagement — comment on target accounts, engage in relevant conversations.
Evening (10 min): Final check for urgent items. Queue next day's content if needed.

RESPONSE TEMPLATES BY SCENARIO:
Positive Review: "Thank you so much, [name]! We're thrilled to hear [specific thing they mentioned]. Your support means the world. [heart emoji]"
Complaint (legitimate): "I'm sorry you experienced this, [name]. That's not the experience we want for our community. I've [specific action — DM'd you / flagged this for our team / created a ticket]. We'll make this right."
Troll/Hate Comment: Do NOT engage publicly. Hide or delete if it violates community guidelines. Block repeat offenders. Never argue — it feeds the algorithm and gives them visibility.
Feature Request: "Great idea, [name]! I've passed this to our product team. We love hearing what our community wants to see. Keep the suggestions coming!"
Question About Competitor: "Great question! We focus on [your differentiator]. Happy to share more about how [your product] specifically helps with [their use case]. DM us anytime!"

CRISIS COMMUNICATION PLAYBOOK:
Level 1 (Minor — negative review, unhappy customer): Respond within 1 hour. Empathize, resolve, move to DM.
Level 2 (Moderate — viral complaint, service outage): Acknowledge within 30 minutes. Provide updates every 2 hours. Post formal statement within 4 hours.
Level 3 (Major — security breach, PR crisis, legal issue): Pause all scheduled content immediately. Draft holding statement within 15 minutes. Loop in leadership. Post official response within 2 hours. Monitor 24/7 until resolved.

CRISIS RESPONSE PRINCIPLES:
1. Speed over perfection — acknowledge fast, even if you don't have all answers
2. Empathy first — "We understand how frustrating this is"
3. Take responsibility — never blame the customer
4. Provide specifics — what happened, what you're doing about it, when they'll hear more
5. Follow through — always deliver on promises made during crisis
6. Post-crisis review — what caused it, how to prevent it, update playbook`,
    },
    {
      title: "Influencer Marketing Strategy and Execution",
      content: `Influencer Marketing — Finding, Vetting, and Partnering:

INFLUENCER TIERS AND EXPECTED PERFORMANCE:
Nano (1K-10K followers): Highest engagement (5-10%). Most authentic. Cost: $50-250/post or product gifting. Best for: Local businesses, niche products, authentic testimonials.
Micro (10K-100K): Strong engagement (3-7%). Niche authority. Cost: $250-2,500/post. Best for: Targeted campaigns, product launches, B2B.
Mid-Tier (100K-500K): Good reach and engagement (2-5%). Cost: $2,500-10,000/post. Best for: Brand awareness, broader campaigns.
Macro (500K-1M): Wide reach, lower engagement (1-3%). Cost: $10,000-50,000/post. Best for: Mass awareness, established brands.
Mega (1M+): Celebrity-level reach, lowest engagement (<1%). Cost: $50,000-500,000+/post. Best for: National campaigns, brand repositioning.

RECOMMENDATION: Start with 10-20 nano/micro influencers rather than 1 macro. More authentic, better ROI, lower risk.

VETTING CHECKLIST:
- Engagement rate (real engagement, not bots): Use HypeAuditor, Modash, or manual check
- Audience demographics: Match your target customer (age, location, interests)
- Content quality and consistency: Review last 30 posts
- Brand alignment: Values, tone, aesthetic fit
- Past partnerships: How do they handle sponsored content? Authentic or salesy?
- Fake follower check: Sudden follower spikes, low engagement, generic comments = red flags
- Comment quality: Real conversations or just emojis and "great post"?

COLLABORATION STRUCTURES:
Gifting: Send free product, hope for organic post. No guarantee. Low cost, low control.
Affiliate: Give unique discount code or link. Pay commission on sales (15-30%). Low risk, performance-based.
Sponsored Post: Pay per post with creative brief. Specify deliverables, usage rights, exclusivity period.
Brand Ambassador: Ongoing relationship (3-12 months). Monthly retainer + product. Most authentic long-term play.
Content License: Pay for content rights to use in your ads. Often cheaper than creating content in-house.

CAMPAIGN MEASUREMENT:
Track: Reach, engagement, clicks (UTM links), conversions (unique codes), cost per acquisition, brand mention volume, follower growth during campaign, content quality and reusability.
Benchmark ROI: Influencer marketing averages $5.78 earned media value per $1 spent. Nano/micro campaigns often see $8-15 per $1.`,
    },
  ],
};
