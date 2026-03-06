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
  "general-coding-assistant": {
    capabilities: [
      "Write, debug, and refactor code in any major language",
      "Explain complex code patterns and algorithms",
      "Perform code reviews with actionable feedback",
      "Generate unit tests and documentation",
      "Help with architecture decisions and best practices",
    ],
    businessUse:
      "Use this agent as your on-demand programming partner. It writes production-quality code, debugs issues, explains complex patterns, and handles code reviews. Perfect for freelance developers, bootcamp students, or anyone who codes.",
  },
  "writing-editing": {
    capabilities: [
      "Write articles, essays, emails, and reports",
      "Edit and proofread for clarity, grammar, and style",
      "Adapt writing tone for different audiences",
      "Create outlines and content structures",
      "Coach on writing improvement and technique",
    ],
    businessUse:
      "Use this agent to run a writing or editing business. It drafts, edits, and polishes any format — from blog posts to executive reports. Charge for the deliverables; the agent does the heavy lifting.",
  },
  "health-wellness-coach": {
    capabilities: [
      "Design customized workout and fitness programs",
      "Create nutrition plans and meal prep strategies",
      "Guide sleep optimization and stress management",
      "Build sustainable habit-formation roadmaps",
      "Provide evidence-based wellness education",
    ],
    businessUse:
      "Use this agent to support personal wellness coaching. It designs fitness programs, nutrition guides, and wellness plans. Great for health coaches who want AI-assisted client programs.",
  },
  "academic-tutor": {
    capabilities: [
      "Explain concepts across any academic subject",
      "Create study plans and exam preparation strategies",
      "Help with essay structure and writing technique",
      "Break down complex problems step-by-step",
      "Adapt teaching style to learning level",
    ],
    businessUse:
      "Use this agent to offer tutoring services. It explains any subject at any level, creates study plans, and helps with essay writing. Ideal for tutoring businesses or parents helping kids.",
  },
  "ecommerce-store-builder": {
    capabilities: [
      "Build complete Shopify/WooCommerce store plans",
      "Write high-converting product descriptions",
      "Design email marketing flows and automations",
      "Optimize product pages for conversion",
      "Plan inventory and fulfillment strategies",
    ],
    businessUse:
      "Use this agent to launch and optimize e-commerce stores. It handles store setup planning, product copy, email flows, and conversion optimization. Charge clients for complete store builds.",
  },
  "legal-basics-reviewer": {
    capabilities: [
      "Review contracts and highlight key terms and risks",
      "Guide business formation decisions (LLC, Corp, etc.)",
      "Explain employment law basics and compliance",
      "Draft basic legal documents and templates",
      "Break down intellectual property considerations",
    ],
    businessUse:
      "Use this agent for preliminary legal document review and business formation guidance. It reviews contracts, explains legal concepts, and creates templates. Always recommend professional attorney review for final decisions.",
  },
  "real-estate-investing": {
    capabilities: [
      "Analyze rental property potential and ROI",
      "Evaluate market conditions and trends",
      "Guide financing and mortgage strategy decisions",
      "Plan property management approaches",
      "Break down tax implications of real estate investments",
    ],
    businessUse:
      "Use this agent to evaluate real estate deals and build investment strategies. It runs property analysis, market comparisons, and ROI projections. Ideal for investors and real estate professionals.",
  },
  "podcast-production": {
    capabilities: [
      "Plan complete podcast launch strategy",
      "Create episode outlines and show notes",
      "Guide recording setup and editing workflow",
      "Develop guest booking and outreach strategies",
      "Build audience growth and monetization plans",
    ],
    businessUse:
      "Use this agent to launch and grow podcasts. It handles everything from concept to monetization strategy. Offer podcast consulting services powered by this agent.",
  },
  "digital-marketing-strategist": {
    capabilities: [
      "Build comprehensive digital marketing strategies",
      "Plan paid ad campaigns across Meta, Google, TikTok, LinkedIn",
      "Design organic social media content calendars",
      "Create SMMA client proposals and pricing",
      "Analyze marketing metrics and optimize campaigns",
    ],
    businessUse:
      "Use this agent to run a digital marketing agency. It creates strategies, plans campaigns, writes ad copy, and builds client proposals. The complete marketing brain for agency operators.",
  },
  "video-content-strategist": {
    capabilities: [
      "Develop YouTube channel strategies and content plans",
      "Write video scripts and outline structures",
      "Plan short-form content for TikTok, Reels, and Shorts",
      "Optimize titles, thumbnails, and descriptions for discovery",
      "Design monetization and brand deal strategies",
    ],
    businessUse:
      "Use this agent to build a video production business or grow your own channel. It plans content, writes scripts, optimizes for algorithms, and develops monetization strategies.",
  },
  "personal-finance-advisor": {
    capabilities: [
      "Create personalized budgeting plans and savings strategies",
      "Guide debt payoff strategy selection and execution",
      "Explain investment basics and retirement account options",
      "Build emergency fund and financial safety net roadmaps",
      "Analyze spending patterns and suggest optimizations",
    ],
    businessUse:
      "Use this agent to offer financial coaching services. It builds budgets, debt payoff plans, and investment education programs. Ideal for financial coaches who want AI-assisted client support.",
  },
  "hr-people-operations": {
    capabilities: [
      "Design hiring processes and interview frameworks",
      "Create performance review templates and OKR systems",
      "Build employee onboarding and retention programs",
      "Guide HR compliance and employment law basics",
      "Draft job descriptions, offer letters, and HR policies",
    ],
    businessUse:
      "Use this agent to provide HR consulting services. It builds hiring frameworks, performance systems, and compliance checklists. Perfect for HR consultants or small business owners managing teams.",
  },
  "project-management-coach": {
    capabilities: [
      "Build project plans with timelines and milestones",
      "Guide Agile/Scrum implementation and sprint planning",
      "Create stakeholder communication and reporting templates",
      "Design risk management and mitigation strategies",
      "Optimize team productivity and meeting structures",
    ],
    businessUse:
      "Use this agent to offer project management consulting. It builds project plans, implements Agile frameworks, and creates communication systems. Ideal for PMO consultants and team leads.",
  },
  "translation-localization": {
    capabilities: [
      "Translate content between languages with cultural adaptation",
      "Guide website and app localization strategy",
      "Create multilingual marketing and business communications",
      "Advise on international expansion and market entry",
      "Review translations for cultural sensitivity and accuracy",
    ],
    businessUse:
      "Use this agent to offer translation and localization services. It handles multilingual content, cultural adaptation, and internationalization strategy. Charge for professional translation with AI assistance.",
  },
  "dispatch-agent": {
    capabilities: [
      "Design dispatch and logistics workflows for service businesses",
      "Create scheduling systems and route optimization plans",
      "Build driver/technician management SOPs",
      "Generate customer communication templates for service updates",
      "Analyze operational metrics and efficiency opportunities",
    ],
    businessUse:
      "Use this agent to run dispatch operations for any service business — delivery, field service, transportation. It designs workflows, optimizes routes, and builds the SOPs that keep operations running smoothly at scale.",
  },
  "sales-agent": {
    capabilities: [
      "Write sales scripts and objection-handling frameworks",
      "Design sales pipelines and CRM workflows",
      "Create proposal templates with pricing strategies",
      "Develop lead qualification criteria and scoring models",
      "Build sales training materials and playbooks",
    ],
    businessUse:
      "Use this agent to build and optimize your sales operation. It writes scripts, designs pipelines, creates proposals, and trains your approach. Whether you are a solo founder selling or building a sales team, this agent delivers ready-to-use sales assets.",
  },
  "claims-agent": {
    capabilities: [
      "Guide insurance claims filing and documentation",
      "Analyze policy coverage and identify applicable provisions",
      "Create claims status tracking and follow-up systems",
      "Draft appeals for denied or underpaid claims",
      "Build claims management SOPs for agencies",
    ],
    businessUse:
      "Use this agent to navigate insurance claims efficiently. It guides documentation, analyzes coverage, drafts appeals, and builds management systems. Reduce processing time and improve claim outcomes.",
  },
  "compliance-agent": {
    capabilities: [
      "Audit business operations against regulatory requirements",
      "Create compliance checklists and monitoring schedules",
      "Draft policies and procedures for regulatory adherence",
      "Analyze regulatory changes and assess business impact",
      "Build compliance training materials for teams",
    ],
    businessUse:
      "Use this agent to stay compliant without hiring a compliance team. It audits operations, creates policies, monitors regulatory changes, and builds training materials. Critical for businesses in regulated industries.",
  },
  "platform-onboarding": {
    capabilities: [
      "Guide new users through every Stone AI feature",
      "Match user goals to the right AI agents",
      "Teach prompt engineering for maximum agent effectiveness",
      "Create personalized adoption roadmaps",
      "Demonstrate how to use agents for complete business workflows",
    ],
    businessUse:
      "Your personal guide to mastering Stone AI. This agent walks you through every feature, recommends the right agents for your goals, teaches you how to get the best results, and builds a custom plan for how to use AI in your business.",
  },
  "enterprise-implementation": {
    capabilities: [
      "Design enterprise deployment architectures for Stone AI",
      "Create security and compliance documentation for enterprise buyers",
      "Build change management and adoption plans",
      "Design API integration strategies for existing business systems",
      "Develop ROI models and business cases for enterprise AI adoption",
    ],
    businessUse:
      "Use this agent to plan and execute enterprise-scale Stone AI deployments. It handles architecture, compliance documentation, change management, and integration strategy. The bridge between our platform and large organization requirements.",
  },
  "bestie-companion-base": {
    capabilities: [
      "Provide personalized emotional support and companionship",
      "Remember user preferences, history, and conversation context",
      "Adapt communication style to match user personality",
      "Offer encouragement and accountability for personal goals",
      "Create a safe space for thinking through ideas and challenges",
    ],
    businessUse:
      "Your personal AI companion that remembers you and grows with every conversation. Unlike task-focused agents, your Bestie builds a relationship — offering support, accountability, and genuine conversation. The emotional anchor of Stone AI.",
  },
};
