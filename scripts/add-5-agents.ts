import "dotenv/config";
import { db } from "../src/lib/db";

const agents = [
  {
    slug: "customer-support",
    name: "Customer Support Bot Builder",
    requiredTier: "SMART" as const,
    category: "BUSINESS" as const,
    isActive: true,
    sortOrder: 50,
    icon: "headset",
    description: "Design and deploy customer support chatbots",
    systemPrompt:
      "You are a Customer Support Bot Builder specialist. You help users design, build, and deploy customer support chatbots for their businesses. You provide templates for greeting flows, FAQ responses, escalation rules, and multi-channel deployment strategies.",
  },
  {
    slug: "social-media-manager",
    name: "Social Media Manager",
    requiredTier: "SMART" as const,
    category: "MARKETING" as const,
    isActive: true,
    sortOrder: 51,
    icon: "share-2",
    description: "Plan content calendars and optimize social presence",
    systemPrompt:
      "You are a Social Media Manager. You help users plan content calendars, write posts for all platforms (Instagram, TikTok, LinkedIn, X/Twitter, Facebook), analyze engagement metrics, develop hashtag strategies, and optimize posting schedules for maximum reach.",
  },
  {
    slug: "email-marketing-specialist",
    name: "Email Marketing Specialist",
    requiredTier: "SMART" as const,
    category: "MARKETING" as const,
    isActive: true,
    sortOrder: 52,
    icon: "mail",
    description: "Build email sequences and optimize campaigns",
    systemPrompt:
      "You are an Email Marketing Specialist. You help users build email sequences, write newsletters, design drip campaigns, segment audiences, optimize subject lines, improve open rates, and choose the right email platform.",
  },
  {
    slug: "proposal-writer",
    name: "Proposal & RFP Writer",
    requiredTier: "SMART" as const,
    category: "BUSINESS" as const,
    isActive: true,
    sortOrder: 53,
    icon: "file-text",
    description: "Write winning proposals and RFP responses",
    systemPrompt:
      "You are a Proposal and RFP Writer. You help users write winning business proposals, respond to RFPs, create pitch documents, and structure executive summaries. You provide templates with sections for scope, timeline, pricing, differentiators, and next steps.",
  },
  {
    slug: "meeting-notes",
    name: "Meeting Notes & Action Items",
    requiredTier: "PLUS" as const,
    category: "BUSINESS" as const,
    isActive: true,
    sortOrder: 54,
    icon: "clipboard",
    description: "Summarize meetings and extract action items",
    systemPrompt:
      "You are a Meeting Notes specialist. You help users summarize meetings, extract action items with owners and deadlines, create follow-up email drafts, and organize decisions made. You structure notes with attendees, agenda, discussion, decisions, and next steps.",
  },
];

async function main() {
  for (const a of agents) {
    await db.agent.upsert({
      where: { slug: a.slug },
      create: a,
      update: {
        name: a.name,
        isActive: true,
        systemPrompt: a.systemPrompt,
        requiredTier: a.requiredTier,
        category: a.category,
        sortOrder: a.sortOrder,
        icon: a.icon,
        description: a.description,
      },
    });
    console.log("Upserted:", a.slug);
  }
  const count = await db.agent.count({ where: { isActive: true } });
  console.log("Total active agents:", count);
  await db.$disconnect();
}

main();
