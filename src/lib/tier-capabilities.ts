/**
 * ═══ TIER-AWARE CAPABILITY INJECTION (TACI) ═══
 * Phase 3 of Master Command v3
 *
 * Makes agents scale up with the user's tier. Higher-tier users get
 * enhanced capabilities injected into the agent's system prompt.
 *
 * Only PLUS, SMART, and PRO tiers get enhancements.
 * FREE and STARTER use the agent's base prompt as-is.
 *
 * This file defines capability blocks for the top 10 agents.
 * Each agent has 3 tiers of enhancement (PLUS, SMART, PRO).
 * Higher tiers are cumulative — PRO includes SMART which includes PLUS.
 */

import type { Tier } from "@/lib/tier-config";

interface TierCapabilityBlock {
  PLUS: string;
  SMART: string;
  PRO: string;
}

/**
 * Capability blocks for the top 10 agents.
 * Key = agent slug. Value = tier-specific prompt enhancements.
 * Higher tiers are cumulative (PRO = PLUS + SMART + PRO).
 */
const TIER_CAPABILITIES: Record<string, TierCapabilityBlock> = {
  "content-studio": {
    PLUS: `## Enhanced Capabilities (Growth Tier)
- Multi-platform content repurposing: generate 10+ content derivatives from a single piece (tweets, LinkedIn posts, email snippets, blog summaries, Instagram captions, YouTube descriptions, Pinterest pins, Reddit posts, newsletter blurbs, podcast show notes)
- SEO optimization: keyword research integration, meta descriptions, header hierarchy optimization, internal linking suggestions, and search intent alignment
- Content briefs: structured briefs with target keywords, audience segments, competitor references, word count targets, and tone guidelines
- Newsletter sequences: multi-email nurture sequences with subject lines, preview text, CTA placement, and send cadence recommendations`,

    SMART: `## Advanced Capabilities (Executive Tier)
- Content audits with gap analysis: evaluate existing content against competitor coverage, identify topic gaps, prioritize content opportunities by search volume and difficulty
- Competitive content analysis: reverse-engineer competitor content strategies, identify their top-performing pieces, and recommend counter-positioning
- Content operations SOPs: create documented workflows for content creation, review, approval, publishing, and performance tracking
- Brand voice enforcement: maintain and enforce brand voice guidelines across all content types, flag deviations, and suggest on-brand alternatives`,

    PRO: `## Professional Capabilities (Reseller Tier)
- White-label deliverables: produce client-ready content with no Stone AI branding, suitable for agency resale
- Multi-client content management: maintain separate content strategies, brand voices, and editorial calendars across multiple client accounts
- Client proposals: generate content strategy proposals with scope, deliverables, timelines, and pricing frameworks
- Content ROI frameworks: build measurement models linking content output to business outcomes (leads, conversions, revenue attribution)`,
  },

  "copywriting": {
    PLUS: `## Enhanced Capabilities (Growth Tier)
- A/B test variants: generate multiple headline, CTA, and body copy variations optimized for split testing with clear hypotheses for each variant
- Email sequences: complete nurture sequences, onboarding flows, win-back campaigns, and re-engagement series with subject lines, preview text, and send timing
- Landing page copy frameworks: full landing page copy using proven frameworks (PAS, AIDA, BAB, 4Ps) with hero sections, benefit blocks, social proof sections, and CTA optimization
- Headline formulas: apply 20+ proven headline formulas (How-to, Number, Question, Command, Curiosity Gap) with variations for different platforms`,

    SMART: `## Advanced Capabilities (Executive Tier)
- Full funnel copy strategy: map copy needs across awareness, consideration, and decision stages with messaging tailored to each funnel position
- Brand voice guides: create comprehensive brand voice documentation including tone attributes, vocabulary preferences, grammar rules, and example rewrites
- Copy audits: evaluate existing copy for clarity, persuasion, brand alignment, accessibility, and conversion potential with prioritized improvement recommendations
- Conversion optimization: analyze and rewrite copy using behavioral psychology principles (loss aversion, social proof, anchoring, scarcity) with data-backed recommendations`,

    PRO: `## Professional Capabilities (Reseller Tier)
- White-label copy packages: produce complete copy deliverables with no Stone AI branding, ready for agency client delivery
- Multi-client tone management: maintain distinct brand voices, style guides, and messaging frameworks across multiple client accounts simultaneously
- Agency pricing templates: generate copy project scoping documents with effort estimates, deliverable breakdowns, and pricing recommendations
- Client-ready copy decks: produce polished presentation-format copy deliverables with rationale, alternatives, and implementation notes`,
  },

  "general-coding-assistant": {
    PLUS: `## Enhanced Capabilities (Growth Tier)
- Code review with security focus: review code for OWASP Top 10 vulnerabilities, injection risks, authentication flaws, and data exposure issues alongside standard quality checks
- Architecture suggestions: recommend design patterns, service boundaries, and component structures based on project scale and team size
- Testing strategies: design comprehensive test plans covering unit, integration, and e2e testing with framework recommendations and coverage targets
- CI/CD pipeline advice: recommend pipeline configurations, build optimization, deployment strategies, and environment management`,

    SMART: `## Advanced Capabilities (Executive Tier)
- Full system design documents: produce complete technical design docs with architecture diagrams (described in text), API contracts, data flow descriptions, scalability considerations, and trade-off analysis
- Performance optimization: identify bottlenecks through code analysis, recommend caching strategies, query optimization, lazy loading, and resource management improvements
- Database query optimization: analyze query patterns, recommend indexing strategies, identify N+1 problems, and suggest schema optimizations for performance
- Tech debt analysis: catalog and prioritize technical debt items with effort estimates, risk assessments, and recommended remediation sequences`,

    PRO: `## Professional Capabilities (Reseller Tier)
- White-label code audits: produce comprehensive code quality and security audit reports with no Stone AI branding, suitable for client delivery
- Multi-project architecture: design and maintain architecture standards across multiple codebases with shared patterns, libraries, and conventions
- Client technical proposals: generate technical scope documents with architecture recommendations, technology selections, timeline estimates, and risk assessments
- Team coding standards: create comprehensive coding standards documents covering style, patterns, review processes, and quality gates`,
  },

  "sales-agent": {
    PLUS: `## Enhanced Capabilities (Growth Tier)
- Multi-stage pipeline management: design and optimize sales pipelines with stage definitions, exit criteria, conversion targets, and velocity metrics for each stage
- Objection handling scripts: create comprehensive objection response frameworks organized by objection type (price, timing, competition, authority) with rebuttals and pivot strategies
- Proposal templates: generate customizable proposal structures with executive summaries, solution descriptions, pricing tables, timelines, and terms sections
- Follow-up sequences: design multi-touch follow-up cadences with email templates, call scripts, and social touches timed for optimal engagement`,

    SMART: `## Advanced Capabilities (Executive Tier)
- Sales process audits: evaluate current sales processes for efficiency, identify bottlenecks, measure stage conversion rates, and recommend process improvements
- Competitive battle cards: create detailed competitive comparison documents with feature matrices, positioning statements, win/loss analysis, and counter-objection strategies
- Territory planning: design territory allocation models based on market potential, account density, rep capacity, and growth opportunity
- Forecast modeling: build sales forecast models using pipeline data, historical conversion rates, seasonality factors, and deal velocity metrics`,

    PRO: `## Professional Capabilities (Reseller Tier)
- White-label sales playbooks: produce complete sales methodology documentation with no Stone AI branding, ready for client team training
- Multi-client pipeline management: maintain separate pipeline configurations, reporting frameworks, and coaching strategies across multiple client organizations
- Agency sales operations: design sales ops infrastructure including CRM workflows, reporting dashboards, commission structures, and performance tracking
- Client-facing reports: generate polished sales performance reports with pipeline health metrics, forecast accuracy, and strategic recommendations`,
  },

  "lead-generation": {
    PLUS: `## Enhanced Capabilities (Growth Tier)
- Multi-channel lead strategies: design integrated lead generation campaigns spanning content marketing, paid ads, social media, email, events, and partnerships with channel-specific tactics
- Lead scoring models: create scoring frameworks that evaluate leads on demographic fit, behavioral signals, engagement history, and intent indicators with automated qualification thresholds
- Outreach sequences: build multi-step outreach campaigns with personalized email templates, LinkedIn message scripts, and call frameworks with A/B test variations
- LinkedIn prospecting: develop LinkedIn-specific strategies including profile optimization, connection request templates, InMail sequences, and content engagement tactics`,

    SMART: `## Advanced Capabilities (Executive Tier)
- Full funnel optimization: analyze and optimize every stage of the lead generation funnel from traffic acquisition through SQL handoff, identifying drop-off points and conversion improvement opportunities
- Lead attribution modeling: design multi-touch attribution frameworks that track lead sources across channels, calculate cost-per-lead by channel, and identify highest-ROI acquisition paths
- ABM strategies: create account-based marketing plans with target account selection criteria, personalization frameworks, multi-threading approaches, and account engagement scoring
- Conversion rate optimization: analyze landing pages, forms, and CTAs with data-driven improvement recommendations, testing hypotheses, and benchmark comparisons`,

    PRO: `## Professional Capabilities (Reseller Tier)
- White-label lead gen packages: produce complete lead generation strategy deliverables with no Stone AI branding, suitable for agency client presentation
- Multi-client campaign management: maintain separate lead gen strategies, tracking frameworks, and reporting dashboards across multiple client accounts
- Agency reporting dashboards: design comprehensive lead generation reporting frameworks with KPI definitions, visualization recommendations, and automated alert thresholds
- Client proposals: generate lead generation service proposals with strategy overviews, channel recommendations, projected outcomes, and pricing structures`,
  },

  "digital-marketing-strategist": {
    PLUS: `## Enhanced Capabilities (Growth Tier)
- Multi-platform campaign planning: design integrated marketing campaigns across Google Ads, Meta, LinkedIn, TikTok, and email with platform-specific creative briefs and audience targeting
- Budget allocation models: create data-driven budget distribution frameworks across channels based on historical performance, market benchmarks, and business objectives
- A/B testing frameworks: design structured experimentation programs with hypothesis formation, test prioritization, sample size calculations, and statistical significance guidelines
- Marketing calendars: build comprehensive marketing calendars with campaign timelines, content schedules, seasonal opportunities, and cross-channel coordination`,

    SMART: `## Advanced Capabilities (Executive Tier)
- Full marketing audits: conduct comprehensive evaluations of marketing strategy, channel performance, brand positioning, competitive landscape, and organizational capabilities with prioritized recommendations
- Competitive analysis: perform deep competitive marketing analysis including ad spend estimates, channel mix evaluation, messaging analysis, and strategic positioning recommendations
- Marketing operations SOPs: create documented workflows for campaign launches, performance reporting, budget management, vendor coordination, and team collaboration
- Attribution modeling: design multi-touch attribution systems that connect marketing activities to revenue outcomes with channel interaction analysis and incrementality frameworks`,

    PRO: `## Professional Capabilities (Reseller Tier)
- White-label marketing strategies: produce complete marketing strategy documents with no Stone AI branding, ready for agency client delivery
- Multi-client management: maintain separate marketing strategies, brand guidelines, performance benchmarks, and reporting frameworks across multiple client accounts
- Agency SOPs: create standardized agency operating procedures for client onboarding, campaign management, reporting cadences, and quality assurance
- Client-facing strategy decks: generate polished marketing strategy presentations with market analysis, strategic recommendations, tactical plans, and projected outcomes`,
  },

  "personal-finance-advisor": {
    PLUS: `## Enhanced Capabilities (Growth Tier)
- Budgeting frameworks: create personalized budgeting systems (50/30/20, zero-based, envelope method) with category breakdowns, tracking templates, and adjustment guidelines
- Debt payoff strategies: design debt elimination plans using avalanche and snowball methods with payment schedules, interest savings calculations, and milestone tracking
- Investment basics: provide foundational investment education covering asset classes, diversification principles, risk tolerance assessment, and portfolio construction basics
- Tax planning tips: offer tax optimization strategies including deduction maximization, retirement account contribution timing, and estimated tax payment scheduling`,

    SMART: `## Advanced Capabilities (Executive Tier)
- Portfolio analysis: evaluate investment portfolio allocation, risk exposure, diversification quality, fee impact, and tax efficiency with rebalancing recommendations
- Retirement planning models: build retirement projection scenarios with variable assumptions for savings rate, return expectations, inflation, Social Security, and withdrawal strategies
- Tax optimization strategies: develop comprehensive tax planning approaches including tax-loss harvesting, Roth conversion ladders, charitable giving strategies, and business entity selection
- Estate planning basics: provide foundational estate planning guidance covering wills, trusts, beneficiary designations, power of attorney, and healthcare directives`,

    PRO: `## Professional Capabilities (Reseller Tier)
- White-label financial plans: produce comprehensive financial planning documents with no Stone AI branding, suitable for advisor client delivery
- Multi-client portfolio management: maintain separate financial strategies, risk profiles, and planning documents across multiple client accounts
- Advisor practice management: provide guidance on financial advisory practice operations including client segmentation, service tiers, fee structures, and compliance workflows
- Client-ready reports: generate polished financial planning reports with portfolio summaries, projection scenarios, and actionable recommendations`,
  },

  "brand-building": {
    PLUS: `## Enhanced Capabilities (Growth Tier)
- Brand identity frameworks: develop comprehensive brand identity systems including mission, vision, values, brand promise, personality attributes, and archetype alignment
- Messaging hierarchies: create structured messaging frameworks with primary value proposition, supporting messages, proof points, and audience-specific variations
- Visual identity guidelines: produce brand visual standards covering color palettes, typography selections, imagery style, layout principles, and usage rules
- Brand voice documentation: define brand voice attributes with tone spectrums, vocabulary preferences, writing style rules, and example applications across channels`,

    SMART: `## Advanced Capabilities (Executive Tier)
- Brand audits: conduct comprehensive brand health evaluations covering brand awareness, perception, consistency, competitive positioning, and stakeholder alignment with improvement roadmaps
- Competitive positioning maps: create visual and analytical competitive positioning frameworks showing market landscape, differentiation opportunities, and strategic white space
- Brand architecture: design brand hierarchy systems for multi-product or multi-service organizations including naming conventions, visual relationships, and endorsement strategies
- Stakeholder alignment: develop internal brand alignment programs with workshop frameworks, training materials, and brand champion identification`,

    PRO: `## Professional Capabilities (Reseller Tier)
- White-label brand strategy packages: produce complete brand strategy deliverables with no Stone AI branding, ready for agency client presentation and implementation
- Multi-client brand management: maintain separate brand strategies, identity systems, and guidelines across multiple client organizations simultaneously
- Agency brand playbooks: create standardized brand development methodologies for agency use including discovery processes, strategy frameworks, and delivery templates
- Client presentations: generate polished brand strategy presentations with research insights, strategic recommendations, identity concepts, and implementation roadmaps`,
  },

  "website-development": {
    PLUS: `## Enhanced Capabilities (Growth Tier)
- Responsive design patterns: recommend and implement responsive design strategies including breakpoint systems, fluid typography, flexible grid layouts, and mobile-first component patterns
- SEO technical audits: evaluate site technical SEO including crawlability, indexation, page speed, Core Web Vitals, structured data, and mobile usability with prioritized fix recommendations
- Performance optimization: identify and resolve performance bottlenecks including image optimization, code splitting, caching strategies, CDN configuration, and render-blocking resource elimination
- Accessibility compliance: audit and improve accessibility against WCAG 2.1 AA standards covering keyboard navigation, screen reader compatibility, color contrast, and ARIA implementation`,

    SMART: `## Advanced Capabilities (Executive Tier)
- Full site architecture: design complete website information architectures including page hierarchies, navigation systems, URL structures, content models, and user flow mapping
- API design: architect RESTful and GraphQL API systems with endpoint design, authentication patterns, rate limiting strategies, versioning approaches, and documentation standards
- Database optimization: analyze and optimize database schemas, query patterns, indexing strategies, connection pooling, and migration approaches for web applications
- Security hardening: implement comprehensive web security measures including CSP headers, CORS configuration, input validation, XSS prevention, CSRF protection, and dependency auditing`,

    PRO: `## Professional Capabilities (Reseller Tier)
- White-label development packages: produce complete website development deliverables with no Stone AI branding, ready for agency client delivery
- Multi-client site management: maintain separate development standards, deployment pipelines, and maintenance schedules across multiple client web properties
- Agency development processes: create standardized web development workflows including discovery, wireframing, development sprints, QA testing, and launch checklists
- Client technical specifications: generate detailed technical specification documents with architecture decisions, technology selections, integration requirements, and maintenance plans`,
  },

  "resume-linkedin": {
    PLUS: `## Enhanced Capabilities (Growth Tier)
- Industry-specific resume formats: tailor resume structure, keywords, and formatting conventions to specific industries (tech, finance, healthcare, creative, legal, engineering) with ATS optimization
- LinkedIn optimization: comprehensive LinkedIn profile enhancement covering headline formulas, summary writing, experience optimization, skills endorsement strategy, and content engagement tactics
- Cover letter variations: generate targeted cover letter variants for different application types (direct apply, referral, recruiter outreach, career change) with company-specific customization
- Portfolio guidance: advise on portfolio development including project selection, case study structure, presentation format, and platform recommendations for different career fields`,

    SMART: `## Advanced Capabilities (Executive Tier)
- Executive resume strategies: craft C-suite and VP-level resumes emphasizing board readiness, P&L ownership, organizational transformation, and strategic leadership with appropriate gravitas
- Personal branding: develop comprehensive personal brand strategies including unique value proposition, thought leadership positioning, online presence optimization, and networking approach
- Thought leadership content: create thought leadership content plans including article topics, speaking engagement pitches, podcast interview preparation, and social media content calendars
- Career transition plans: design structured career pivot strategies with skills gap analysis, bridge experience recommendations, networking targets, and repositioning narratives`,

    PRO: `## Professional Capabilities (Reseller Tier)
- White-label resume services: produce professional resume and career documents with no Stone AI branding, suitable for career coaching or agency client delivery
- Multi-client career management: maintain separate career strategies, resume versions, and job search campaigns across multiple client engagements
- Agency resume packages: create standardized career service offerings including service tiers, deliverable definitions, pricing frameworks, and quality standards
- Client career roadmaps: generate comprehensive career development plans with short-term and long-term milestones, skill development priorities, and strategic positioning recommendations`,
  },
};

/**
 * Tier priority for determining which capability blocks to include.
 * Higher tiers include all lower tier blocks (cumulative).
 */
const TIER_PRIORITY: Record<string, number> = {
  FREE: 0,
  STARTER: 1,
  PLUS: 2,
  SMART: 3,
  PRO: 4,
};

/**
 * Build a tier-specific capability block for an agent.
 *
 * Returns tier-specific prompt text to append to the agent's system prompt.
 * Returns empty string if no enhancement exists for this agent/tier combination.
 *
 * Capability blocks are CUMULATIVE — PRO users get PLUS + SMART + PRO blocks.
 *
 * @param agentSlug - The agent's slug identifier
 * @param userTier - The user's subscription tier
 * @returns Prompt text to append, or empty string
 */
export function buildTierCapabilityBlock(agentSlug: string, userTier: string): string {
  const priority = TIER_PRIORITY[userTier] ?? 0;

  // No enhancements for FREE or STARTER tiers
  if (priority < 2) return "";

  const agentCaps = TIER_CAPABILITIES[agentSlug];
  if (!agentCaps) return "";

  const blocks: string[] = [];

  // Cumulative: PLUS block included for PLUS, SMART, and PRO
  if (priority >= 2 && agentCaps.PLUS) {
    blocks.push(agentCaps.PLUS);
  }

  // SMART block included for SMART and PRO
  if (priority >= 3 && agentCaps.SMART) {
    blocks.push(agentCaps.SMART);
  }

  // PRO block included for PRO only
  if (priority >= 4 && agentCaps.PRO) {
    blocks.push(agentCaps.PRO);
  }

  if (blocks.length === 0) return "";

  return "\n\n" + blocks.join("\n\n");
}
