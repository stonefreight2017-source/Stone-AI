/**
 * Prompt Templates / Starters
 *
 * Predefined starter prompts per agent category to help new users
 * know what to ask each agent. Templates are public (no auth required).
 */

export interface PromptTemplate {
  id: string;
  title: string;
  prompt: string;
  category: string;
  agentSlug?: string;
}

// ═══════════════════════════════════════════
// Category-level starter prompts
// ═══════════════════════════════════════════

const BUSINESS_TEMPLATES: PromptTemplate[] = [
  {
    id: "biz-1",
    title: "Validate My Business Idea",
    prompt: "I have a business idea and need help validating it. Can you walk me through market size, target audience, competitive landscape, and a quick feasibility check?",
    category: "BUSINESS",
  },
  {
    id: "biz-2",
    title: "Build a Revenue Model",
    prompt: "Help me design a revenue model for my business. I need pricing tiers, projected margins, and a path to profitability within 12 months.",
    category: "BUSINESS",
  },
  {
    id: "biz-3",
    title: "Create a Go-To-Market Plan",
    prompt: "I'm launching a new product. Help me create a go-to-market plan covering launch timeline, channels, initial traction strategy, and key milestones.",
    category: "BUSINESS",
  },
  {
    id: "biz-4",
    title: "Optimize My Operations",
    prompt: "My business is running but inefficient. Help me identify bottlenecks, automate repetitive tasks, and streamline operations for better margins.",
    category: "BUSINESS",
  },
  {
    id: "biz-5",
    title: "Scale My Client Acquisition",
    prompt: "I need more clients. Help me build a systematic client acquisition pipeline with outreach scripts, follow-up sequences, and conversion tracking.",
    category: "BUSINESS",
  },
];

const CONTENT_TEMPLATES: PromptTemplate[] = [
  {
    id: "cnt-1",
    title: "Plan a Content Calendar",
    prompt: "Help me create a 30-day content calendar for my brand. I need topics, formats, posting schedule, and content pillars that drive engagement.",
    category: "CONTENT",
  },
  {
    id: "cnt-2",
    title: "Write a Blog Post Outline",
    prompt: "I need an SEO-optimized blog post outline on a topic in my niche. Include target keywords, headings, key points, and a compelling hook.",
    category: "CONTENT",
  },
  {
    id: "cnt-3",
    title: "Repurpose Content Across Platforms",
    prompt: "I have a long-form piece of content. Help me repurpose it into 5+ formats: social posts, email newsletter, video script, carousel, and thread.",
    category: "CONTENT",
  },
  {
    id: "cnt-4",
    title: "Build an SEO Keyword Strategy",
    prompt: "Help me build a keyword strategy for my website. I need primary keywords, long-tail variations, search intent mapping, and content gaps to fill.",
    category: "CONTENT",
  },
  {
    id: "cnt-5",
    title: "Create a Content Distribution Plan",
    prompt: "I'm creating great content but nobody sees it. Help me build a distribution plan covering organic channels, communities, syndication, and amplification tactics.",
    category: "CONTENT",
  },
];

const MARKETING_TEMPLATES: PromptTemplate[] = [
  {
    id: "mkt-1",
    title: "Write a Sales Funnel",
    prompt: "Help me design a complete sales funnel: lead magnet, landing page copy, email sequence, and call-to-action strategy for maximum conversions.",
    category: "MARKETING",
  },
  {
    id: "mkt-2",
    title: "Craft High-Converting Ad Copy",
    prompt: "I need ad copy for my product. Help me write headlines, body copy, and CTAs for Facebook, Google, and Instagram ads with A/B test variants.",
    category: "MARKETING",
  },
  {
    id: "mkt-3",
    title: "Build an Email Sequence",
    prompt: "Create a 7-email welcome/nurture sequence for new subscribers. Include subject lines, body copy, CTAs, and optimal send timing.",
    category: "MARKETING",
  },
  {
    id: "mkt-4",
    title: "Design a Launch Campaign",
    prompt: "I'm launching a new product next month. Help me plan a launch campaign with pre-launch buzz, launch day strategy, and post-launch follow-up.",
    category: "MARKETING",
  },
  {
    id: "mkt-5",
    title: "Optimize My Landing Page",
    prompt: "Review my landing page strategy and help me improve the headline, value proposition, social proof, and CTA placement for higher conversions.",
    category: "MARKETING",
  },
];

const EDUCATION_TEMPLATES: PromptTemplate[] = [
  {
    id: "edu-1",
    title: "Design an Online Course",
    prompt: "Help me structure an online course. I need module breakdown, lesson outlines, learning objectives, and engagement strategies to reduce drop-off.",
    category: "EDUCATION",
  },
  {
    id: "edu-2",
    title: "Analyze a Research Paper",
    prompt: "I have a research paper I need analyzed. Help me break down the methodology, evaluate the evidence quality, identify limitations, and extract actionable insights.",
    category: "EDUCATION",
  },
  {
    id: "edu-3",
    title: "Build a Membership Community",
    prompt: "Help me plan a membership community: pricing model, content strategy, engagement loops, onboarding flow, and retention tactics.",
    category: "EDUCATION",
  },
  {
    id: "edu-4",
    title: "Create a Study Plan",
    prompt: "I need to learn a complex topic efficiently. Help me create a structured study plan with resources, milestones, practice exercises, and knowledge checks.",
    category: "EDUCATION",
  },
];

const TECHNICAL_TEMPLATES: PromptTemplate[] = [
  {
    id: "tech-1",
    title: "Plan My Tech Stack",
    prompt: "Help me choose the right tech stack for my project. I need recommendations for frontend, backend, database, hosting, and deployment based on my requirements.",
    category: "TECHNICAL",
  },
  {
    id: "tech-2",
    title: "Automate a Workflow",
    prompt: "I have a manual process I want to automate. Help me map the steps, choose the right tools (n8n, Zapier, custom scripts), and design the automation flow.",
    category: "TECHNICAL",
  },
  {
    id: "tech-3",
    title: "Build a Data Dashboard",
    prompt: "I need a dashboard to track my KPIs. Help me define the metrics, design the layout, choose visualization types, and write the data queries.",
    category: "TECHNICAL",
  },
  {
    id: "tech-4",
    title: "Run a Security Audit",
    prompt: "Help me audit my application's security. Walk me through authentication, authorization, input validation, API security, and common vulnerability checks.",
    category: "TECHNICAL",
  },
  {
    id: "tech-5",
    title: "Debug a Technical Issue",
    prompt: "I'm stuck on a technical problem. Help me systematically debug it: gather information, form hypotheses, test solutions, and document the fix.",
    category: "TECHNICAL",
  },
];

const FINANCE_TEMPLATES: PromptTemplate[] = [
  {
    id: "fin-1",
    title: "Build a Financial Model",
    prompt: "Help me create a financial model for my business: revenue projections, cost structure, break-even analysis, and cash flow forecast for the next 12 months.",
    category: "FINANCE",
  },
  {
    id: "fin-2",
    title: "Analyze My Unit Economics",
    prompt: "Help me understand my unit economics: CAC, LTV, payback period, and contribution margin. Show me where I'm leaking money and how to fix it.",
    category: "FINANCE",
  },
  {
    id: "fin-3",
    title: "Plan My Pricing Strategy",
    prompt: "Help me set optimal pricing for my product. Analyze competitor pricing, willingness to pay, value metrics, and recommend a pricing structure.",
    category: "FINANCE",
  },
  {
    id: "fin-4",
    title: "Prepare for Fundraising",
    prompt: "I'm preparing to raise funding. Help me build a pitch deck outline, financial projections, valuation rationale, and investor Q&A preparation.",
    category: "FINANCE",
  },
];

// ═══════════════════════════════════════════
// All templates indexed by category
// ═══════════════════════════════════════════

const TEMPLATES_BY_CATEGORY: Record<string, PromptTemplate[]> = {
  BUSINESS: BUSINESS_TEMPLATES,
  CONTENT: CONTENT_TEMPLATES,
  MARKETING: MARKETING_TEMPLATES,
  EDUCATION: EDUCATION_TEMPLATES,
  TECHNICAL: TECHNICAL_TEMPLATES,
  FINANCE: FINANCE_TEMPLATES,
};

const ALL_TEMPLATES: PromptTemplate[] = [
  ...BUSINESS_TEMPLATES,
  ...CONTENT_TEMPLATES,
  ...MARKETING_TEMPLATES,
  ...EDUCATION_TEMPLATES,
  ...TECHNICAL_TEMPLATES,
  ...FINANCE_TEMPLATES,
];

// ═══════════════════════════════════════════
// Agent slug → category mapping (lazy loaded)
// ═══════════════════════════════════════════

let _agentCategoryCache: Map<string, string> | null = null;

async function getAgentCategory(agentSlug: string): Promise<string | null> {
  if (!_agentCategoryCache) {
    // Dynamically import to avoid circular deps
    const { AGENT_DEFINITIONS } = await import("@/lib/agent-definitions");
    _agentCategoryCache = new Map();
    for (const def of AGENT_DEFINITIONS) {
      _agentCategoryCache.set(def.slug, def.category);
    }
  }
  return _agentCategoryCache.get(agentSlug) ?? null;
}

/**
 * Get starter prompt templates for a specific agent (by slug).
 * Returns category-level templates matching that agent's category,
 * plus any agent-specific templates if they exist.
 */
export async function getTemplatesForAgent(agentSlug: string): Promise<PromptTemplate[]> {
  const category = await getAgentCategory(agentSlug);
  if (!category) return [];

  const categoryTemplates = TEMPLATES_BY_CATEGORY[category] ?? [];
  const agentSpecific = ALL_TEMPLATES.filter((t) => t.agentSlug === agentSlug);

  // Combine: agent-specific first, then category-level (deduped)
  const agentIds = new Set(agentSpecific.map((t) => t.id));
  return [...agentSpecific, ...categoryTemplates.filter((t) => !agentIds.has(t.id))];
}

/**
 * Get all available prompt templates.
 */
export function getAllTemplates(): PromptTemplate[] {
  return ALL_TEMPLATES;
}

/**
 * Get templates filtered by category.
 */
export function getTemplatesByCategory(category: string): PromptTemplate[] {
  return TEMPLATES_BY_CATEGORY[category.toUpperCase()] ?? [];
}
