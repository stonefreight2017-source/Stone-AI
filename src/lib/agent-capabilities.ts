/**
 * Capabilities and business use cases for each agent.
 * Mapped by slug for easy merging with agent definitions.
 */
export const AGENT_CAPABILITIES: Record<
  string,
  { capabilities: string[]; businessUse: string }
> = {
  "ai-automation-agency": {
    capabilities: [
      "Generate client proposals with pricing and scope",
      "Design complete automation workflows step-by-step",
      "Write cold outreach sequences for client acquisition",
      "Build SOPs for team delivery and scaling",
      "Analyze client processes and identify automation ROI",
    ],
    businessUse:
      "Use this agent to run an AI automation agency. It writes your proposals, designs your workflows, generates outreach to find clients, and builds the SOPs your team needs to deliver. Rent this agent and start selling automation services to businesses.",
  },
  "vertical-ai-saas": {
    capabilities: [
      "Validate SaaS ideas with market sizing and competitor analysis",
      "Design MVP feature sets with technical architecture",
      "Write go-to-market launch plans with pricing strategy",
      "Generate investor pitch frameworks and financial models",
      "Plan development sprints with cost estimates",
    ],
    businessUse:
      "Use this agent to plan, validate, and launch your own AI SaaS product. It does the market research, designs the architecture, plans the launch, and helps you avoid the mistakes that kill 90% of startups. Consult this agent before writing a single line of code.",
  },
  smma: {
    capabilities: [
      "Create complete client content calendars",
      "Write social media ad copy for any platform",
      "Generate client reporting templates with KPI analysis",
      "Build onboarding SOPs for new clients",
      "Design service packages with profitable pricing",
    ],
    businessUse:
      "Use this agent to run a social media marketing agency. It creates content calendars, writes ad copy, builds client reports, and designs your service packages. Your clients get professional-grade deliverables. You scale without hiring a strategist.",
  },
  dropshipping: {
    capabilities: [
      "Research and validate winning products with margin analysis",
      "Write high-converting product descriptions",
      "Design Facebook/TikTok ad strategies with creative angles",
      "Optimize store layout for conversion",
      "Calculate unit economics and scaling profitability",
    ],
    businessUse:
      "Use this agent to find products, write listings, design ad campaigns, and calculate your margins. It does the research that takes hours in minutes. Run it before every product launch to validate before you spend on ads.",
  },
  "print-on-demand": {
    capabilities: [
      "Research profitable micro-niches with competition analysis",
      "Generate design concepts and creative briefs",
      "Write SEO-optimized listing titles and descriptions",
      "Plan seasonal content calendars",
      "Analyze marketplace trends and opportunities",
    ],
    businessUse:
      "Use this agent to find niches, plan designs, and optimize listings across Etsy, Amazon Merch, Redbubble, and more. It turns your POD side hustle into a system that scales to hundreds of designs.",
  },
  "brand-building": {
    capabilities: [
      "Develop complete brand identity frameworks",
      "Write brand voice guidelines and messaging",
      "Create positioning strategies against competitors",
      "Generate taglines, mission statements, and brand copy",
      "Design brand architecture for multi-product businesses",
    ],
    businessUse:
      "Use this agent to build brands for yourself or clients. It creates the full brand playbook — positioning, voice, messaging, visual direction — that agencies charge $10K+ for. Offer brand strategy as a service using this agent as your brain.",
  },
  "lead-generation": {
    capabilities: [
      "Build cold email infrastructure and sequences",
      "Create lead magnet concepts and landing page copy",
      "Design CRM workflows and lead scoring systems",
      "Write qualification frameworks and sales scripts",
      "Set up deliverability monitoring and optimization",
    ],
    businessUse:
      "Use this agent to run a lead generation business. It builds your outbound systems, writes the sequences, designs the funnels, and optimizes deliverability. Sell leads to businesses at $50-500 per qualified appointment.",
  },
  "youtube-automation": {
    capabilities: [
      "Write complete video scripts with hooks and retention",
      "Research profitable niches with RPM estimates",
      "Generate thumbnail concepts and title variations",
      "Plan content calendars and series strategies",
      "Design automation workflows for faceless channels",
    ],
    businessUse:
      "Use this agent to build and scale YouTube channels — with or without showing your face. It writes scripts, plans content, and designs the team systems needed to publish consistently. Run multiple channels as a business.",
  },
  "content-studio": {
    capabilities: [
      "Create editorial calendars across all platforms",
      "Write blog posts, newsletters, and social content",
      "Design content repurposing systems (1 piece → 15 derivatives)",
      "Build SEO-driven content strategies",
      "Generate content briefs for team members",
    ],
    businessUse:
      "Use this agent to run a content agency or manage content in-house. It plans, writes, and repurposes content across every platform. One strategy session produces a month of content. Offer content services to clients at scale.",
  },
  "youtube-video-editor": {
    capabilities: [
      "Create detailed edit instruction documents",
      "Design retention-optimized pacing guides",
      "Write hook sequences for first 30 seconds",
      "Generate shot lists and B-roll suggestions",
      "Build editing SOPs for team consistency",
    ],
    businessUse:
      "Use this agent to direct video editing without being an editor. Hand its edit notes to freelance editors for consistent, retention-optimized output. Run a video editing service using this agent for creative direction.",
  },
  "short-form-content": {
    capabilities: [
      "Write scroll-stopping hooks for any niche",
      "Identify best clips from long-form content",
      "Optimize captions and hashtags per platform",
      "Design posting schedules for maximum reach",
      "Create viral content frameworks and templates",
    ],
    businessUse:
      "Use this agent to offer short-form content services. It writes hooks, identifies clips, optimizes for each platform, and produces content plans. Clients get more reach. You deliver faster. Scale to 10+ clients.",
  },
  "niche-blog-affiliate": {
    capabilities: [
      "Research keywords with competition and volume analysis",
      "Write SEO-optimized articles with proper structure",
      "Design site architecture for topical authority",
      "Create affiliate content with conversion optimization",
      "Plan content calendars targeting search intent",
    ],
    businessUse:
      "Use this agent to build passive income websites. It finds the keywords, writes the articles, structures the site, and optimizes for affiliate conversions. Build a portfolio of niche sites generating recurring ad and affiliate revenue.",
  },
  "high-ticket-funnel": {
    capabilities: [
      "Write VSL and webinar scripts with closing sequences",
      "Create high-converting landing page copy",
      "Design email sequences for launch and evergreen funnels",
      "Build application and qualification frameworks",
      "Generate objection-handling scripts for sales calls",
    ],
    businessUse:
      "Use this agent to build funnels for yourself or clients. It writes the VSL, designs the email sequence, creates the landing page, and scripts the sales call. Offer funnel building as a $5K-15K service. The agent does the strategy; you (or a team) implements.",
  },
  "paid-ads": {
    capabilities: [
      "Write platform-specific ad copy with variations",
      "Design campaign architectures and audience strategies",
      "Create creative briefs for ad designers",
      "Build scaling protocols with budget recommendations",
      "Analyze ad performance and recommend optimizations",
    ],
    businessUse:
      "Use this agent to manage paid ads for clients. It writes the copy, designs the campaigns, creates testing frameworks, and recommends optimizations. Charge $1,500-5,000/month per client for ad management powered by this agent.",
  },
  "social-media-management": {
    capabilities: [
      "Create platform-specific content calendars",
      "Write post copy with hooks and CTAs",
      "Design engagement and growth strategies",
      "Build analytics reports with insights",
      "Plan hashtag and content pillar strategies",
    ],
    businessUse:
      "Use this agent to manage social media for clients. It creates the calendars, writes the posts, plans the strategy, and interprets the analytics. Take on 5-10 clients and deliver consistent, strategic content.",
  },
  copywriting: {
    capabilities: [
      "Write sales pages, emails, and ad copy",
      "Generate multiple headline and hook variations",
      "Create persuasive sequences using proven frameworks",
      "Optimize existing copy for higher conversion",
      "Build brand voice guides and copy standards",
    ],
    businessUse:
      "Use this agent as your copywriting partner. It writes sales pages, email sequences, and ad copy using proven persuasion frameworks. Offer copywriting services to businesses — the agent drafts, you polish and deliver.",
  },
  "community-education": {
    capabilities: [
      "Design complete course curricula with modules and lessons",
      "Create membership tier structures with retention mechanics",
      "Write launch sequences and founding member offers",
      "Build community engagement systems and gamification",
      "Plan live event calendars and workshop frameworks",
    ],
    businessUse:
      "Use this agent to build and launch a paid community or online course. It designs the curriculum, structures the membership tiers, writes the launch sequence, and builds the engagement systems that keep members paying month after month.",
  },
  "website-development": {
    capabilities: [
      "Design system architecture and database schemas",
      "Generate production-quality code (React, Node.js, Python)",
      "Plan deployment pipelines and infrastructure",
      "Debug and optimize existing applications",
      "Create technical specifications and documentation",
    ],
    businessUse:
      "Use this agent to build websites and apps for clients. It architects the system, writes the code, plans the deployment, and helps you debug. Offer web development services with an AI-powered development partner that works 24/7.",
  },
  "automation-scripts": {
    capabilities: [
      "Build API integrations between any two platforms",
      "Create web scraping and data extraction systems",
      "Design n8n/Zapier workflows with error handling",
      "Write scheduled automation scripts (Python, Node.js)",
      "Build data processing and reporting pipelines",
    ],
    businessUse:
      "Use this agent to sell automation services. It builds the integrations, writes the scripts, and designs the workflows. Clients pay $500-5,000 per automation. You deliver using this agent as your technical co-pilot.",
  },
  "data-analytics": {
    capabilities: [
      "Write SQL queries for any business question",
      "Design dashboards and visualization strategies",
      "Perform statistical analysis and trend identification",
      "Build KPI frameworks for any business model",
      "Create automated reporting systems",
    ],
    businessUse:
      "Use this agent to offer data analytics consulting. It writes the queries, designs the dashboards, and interprets the data. Help businesses make data-driven decisions — charge $2,000-10,000/month for analytics retainers.",
  },
  cybersecurity: {
    capabilities: [
      "Conduct security audit assessments",
      "Write hardening guides for servers and applications",
      "Design compliance implementation roadmaps (GDPR, HIPAA, SOC 2)",
      "Create incident response plans and playbooks",
      "Review code and configurations for vulnerabilities",
    ],
    businessUse:
      "Use this agent to offer cybersecurity consulting. It conducts assessments, writes hardening guides, and builds compliance roadmaps. Small businesses need security but can't afford a full-time expert — you fill that gap with this agent.",
  },
  "trading-signals": {
    capabilities: [
      "Teach technical analysis frameworks and chart patterns",
      "Design risk management systems with position sizing",
      "Create signal format templates and delivery workflows",
      "Build trading journal frameworks for performance tracking",
      "Develop educational content about market analysis",
    ],
    businessUse:
      "Use this agent to build a trading education and signal service. It teaches the frameworks, designs the risk management systems, and creates the signal templates. Build a subscriber community around market analysis education. Note: Not financial advice.",
  },
  "resume-linkedin": {
    capabilities: [
      "Write ATS-optimized resumes with achievement bullets",
      "Optimize LinkedIn profiles for visibility and inbound opportunities",
      "Create compelling cover letters targeted to specific roles",
      "Design career positioning and personal brand strategies",
      "Keyword-optimize professional documents for any industry",
    ],
    businessUse:
      "Use this agent to run a resume writing business. It writes ATS-optimized resumes, LinkedIn profiles, and cover letters. Charge $200-1,500 per client. The agent handles the writing; you handle the client relationship.",
  },
  // New agents below
  "startup-launcher": {
    capabilities: [
      "Validate startup ideas with lean canvas and market sizing",
      "Design MVPs with feature prioritization",
      "Create pitch decks and investor outreach strategies",
      "Build financial models and revenue projections",
      "Plan go-to-market strategies with customer acquisition funnels",
    ],
    businessUse:
      "Use this agent as your startup co-founder brain. It validates your idea, designs the MVP, builds the pitch deck, models the financials, and plans the launch. Every first-time founder needs a strategic advisor — this agent fills that role 24/7.",
  },
  "engineering-architect": {
    capabilities: [
      "Design system architectures for scalable applications",
      "Create infrastructure diagrams and deployment plans",
      "Plan database schemas and API contracts",
      "Evaluate build vs buy decisions with cost analysis",
      "Design CI/CD pipelines and DevOps workflows",
    ],
    businessUse:
      "Use this agent for technical architecture consulting. It designs the system, plans the infrastructure, and makes the build-vs-buy calls that save months of rework. Offer fractional CTO services to startups using this agent as your technical backbone.",
  },
  "structural-engineer": {
    capabilities: [
      "Analyze structural requirements and load calculations",
      "Review building plans for structural considerations",
      "Generate material specifications and cost estimates",
      "Create inspection checklists and compliance documentation",
      "Advise on foundation, framing, and structural systems",
    ],
    businessUse:
      "Use this agent for preliminary structural analysis and documentation support. It handles calculations, generates checklists, and assists with material specifications. Ideal for contractors and project managers who need quick structural guidance. Note: Final engineering requires licensed PE review.",
  },
};
