import { PrismaClient } from '../src/generated/prisma/client/index.js';

const db = new PrismaClient();

// Missing agents that need to be seeded (slug, name, description, category, requiredTier, icon, sortOrder)
const MISSING_AGENTS = [
  { slug: "academic-tutor", name: "Academic Tutor", description: "Personalized tutoring across subjects — explains concepts, creates study plans, helps with homework and exam prep.", category: "EDUCATION", requiredTier: "FREE", icon: "graduation-cap", sortOrder: 33 },
  { slug: "bestie-companion-base", name: "Bestie Companion", description: "Your personal AI companion that remembers you, grows with you, and supports your journey.", category: "LIFESTYLE", requiredTier: "STARTER", icon: "heart", sortOrder: 34 },
  { slug: "digital-marketing-strategist", name: "Digital Marketing Strategist", description: "Full-funnel digital marketing strategy — SEO, PPC, social, email, content marketing, and analytics.", category: "MARKETING", requiredTier: "PLUS", icon: "megaphone", sortOrder: 35 },
  { slug: "ecommerce-store-builder", name: "E-Commerce Store Builder", description: "Launch and optimize online stores — Shopify, WooCommerce, product listings, conversion optimization.", category: "BUSINESS", requiredTier: "PLUS", icon: "shopping-cart", sortOrder: 36 },
  { slug: "enterprise-implementation", name: "Enterprise Implementation", description: "Enterprise software deployment, change management, stakeholder alignment, and rollout planning.", category: "BUSINESS", requiredTier: "SMART", icon: "building", sortOrder: 37 },
  { slug: "general-coding-assistant", name: "General Coding Assistant", description: "Full-stack coding help — debugging, code review, architecture, any language or framework.", category: "TECHNICAL", requiredTier: "FREE", icon: "code", sortOrder: 38 },
  { slug: "health-wellness-coach", name: "Health & Wellness Coach", description: "Evidence-based wellness guidance — fitness, nutrition, sleep, stress management, habit building.", category: "LIFESTYLE", requiredTier: "STARTER", icon: "heart-pulse", sortOrder: 39 },
  { slug: "hr-people-operations", name: "HR & People Operations", description: "Hiring, onboarding, culture, performance reviews, HR compliance, team management.", category: "BUSINESS", requiredTier: "SMART", icon: "users", sortOrder: 40 },
  { slug: "legal-basics-reviewer", name: "Legal Basics Reviewer", description: "Contract review basics, business structure guidance, compliance checklists. Not legal advice.", category: "BUSINESS", requiredTier: "PLUS", icon: "scale", sortOrder: 41 },
  { slug: "personal-finance-advisor", name: "Personal Finance Advisor", description: "Budgeting, saving strategies, debt management, investment basics, retirement planning.", category: "FINANCE", requiredTier: "FREE", icon: "piggy-bank", sortOrder: 42 },
  { slug: "platform-onboarding", name: "Platform Onboarding Concierge", description: "Your personal guide to mastering Stone AI. Walks you through every feature and recommends the right agents.", category: "EDUCATION", requiredTier: "FREE", icon: "graduation-cap", sortOrder: 32 },
  { slug: "podcast-production", name: "Podcast Production", description: "Podcast strategy, episode planning, scripting, guest research, promotion, and monetization.", category: "CONTENT", requiredTier: "PLUS", icon: "mic", sortOrder: 43 },
  { slug: "project-management-coach", name: "Project Management Coach", description: "Agile, Scrum, Kanban, project planning, team coordination, deadline management, risk mitigation.", category: "BUSINESS", requiredTier: "STARTER", icon: "kanban", sortOrder: 44 },
  { slug: "real-estate-investing", name: "Real Estate Investing", description: "Property analysis, market research, deal evaluation, financing strategies, portfolio building.", category: "FINANCE", requiredTier: "SMART", icon: "home", sortOrder: 45 },
  { slug: "research-synthesis", name: "Research Synthesis", description: "Deep research, literature review, data synthesis, report generation, competitive intelligence.", category: "RESEARCH", requiredTier: "STARTER", icon: "search", sortOrder: 46 },
  { slug: "short-form-content", name: "Short-Form Content Creator", description: "TikTok, Reels, Shorts scripts and strategies — hooks, trends, viral formats.", category: "CONTENT", requiredTier: "FREE", icon: "video", sortOrder: 31 },
  { slug: "smma", name: "SMMA Agency Builder", description: "Social media marketing agency setup — client acquisition, service delivery, scaling.", category: "BUSINESS", requiredTier: "PLUS", icon: "trending-up", sortOrder: 30 },
  { slug: "stone", name: "Stone", description: "Internal business optimizer.", category: "INTERNAL", requiredTier: "PRO", icon: "gem", sortOrder: 99 },
  { slug: "translation-localization", name: "Translation & Localization", description: "Multi-language translation, cultural adaptation, localization strategy for global markets.", category: "CONTENT", requiredTier: "PLUS", icon: "globe", sortOrder: 47 },
  { slug: "video-content-strategist", name: "Video Content Strategist", description: "YouTube strategy, video scripting, thumbnail optimization, audience growth, monetization.", category: "CONTENT", requiredTier: "STARTER", icon: "video", sortOrder: 48 },
  { slug: "writing-editing", name: "Writing & Editing", description: "Professional writing, editing, proofreading — articles, books, proposals, academic papers.", category: "CONTENT", requiredTier: "FREE", icon: "pen-line", sortOrder: 49 },
  { slug: "youtube-automation", name: "YouTube Automation", description: "Faceless YouTube channels — niche selection, content pipeline, outsourcing, monetization.", category: "CONTENT", requiredTier: "PLUS", icon: "youtube", sortOrder: 29 },
  { slug: "youtube-video-editor", name: "YouTube Video Editor", description: "Video editing workflows, effects, transitions, color grading, audio mixing, export optimization.", category: "CONTENT", requiredTier: "STARTER", icon: "film", sortOrder: 28 },
  { slug: "paid-ads", name: "Paid Ad Management", description: "Google Ads, Facebook Ads, campaign optimization, ROAS tracking, ad creative strategy.", category: "MARKETING", requiredTier: "PLUS", icon: "target", sortOrder: 27 },
];

async function main() {
  // Get existing slugs
  const existing = await db.agent.findMany({ select: { slug: true } });
  const existingSlugs = new Set(existing.map(a => a.slug));

  const toInsert = MISSING_AGENTS.filter(a => !existingSlugs.has(a.slug));

  if (toInsert.length === 0) {
    console.log('All agents already exist.');
    return;
  }

  console.log(`Inserting ${toInsert.length} missing agents...`);

  for (const agent of toInsert) {
    await db.agent.create({
      data: {
        slug: agent.slug,
        name: agent.name,
        description: agent.description,
        category: agent.category,
        requiredTier: agent.requiredTier,
        icon: agent.icon,
        sortOrder: agent.sortOrder,
        systemPrompt: `You are ${agent.name}. ${agent.description}`,
        isActive: true,
      },
    });
    console.log(`  + ${agent.slug}`);
  }

  const total = await db.agent.count();
  console.log(`Done. Total agents in DB: ${total}`);
}

main().catch(console.error).finally(() => db.$disconnect());
