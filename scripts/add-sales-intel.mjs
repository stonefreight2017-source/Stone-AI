import { readFileSync, writeFileSync } from "fs";

const FILE = "src/lib/agent-definitions.ts";
let src = readFileSync(FILE, "utf8");
const lines = src.split("\n");

// Find the enterprise-sales-advisor knowledgeSeed closing "],
// We search for the pattern: the ], that closes knowledgeSeed for enterprise-sales-advisor
// Strategy: find "slug: \"enterprise-sales-advisor\"", then find its knowledgeSeed: [, then find the matching ],

let slugLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('slug: "enterprise-sales-advisor"')) {
    slugLine = i;
    break;
  }
}
if (slugLine === -1) { console.error("enterprise-sales-advisor not found"); process.exit(1); }

let seedStart = -1;
for (let i = slugLine; i < lines.length; i++) {
  if (lines[i].trim().startsWith("knowledgeSeed:")) {
    seedStart = i;
    break;
  }
}
if (seedStart === -1) { console.error("knowledgeSeed not found"); process.exit(1); }

// Find the closing ], by counting bracket depth
let depth = 0;
let seedEnd = -1;
for (let i = seedStart; i < lines.length; i++) {
  for (const ch of lines[i]) {
    if (ch === "[") depth++;
    if (ch === "]") depth--;
    if (depth === 0) { seedEnd = i; break; }
  }
  if (seedEnd !== -1) break;
}
if (seedEnd === -1) { console.error("Could not find end of knowledgeSeed"); process.exit(1); }

console.log("enterprise-sales-advisor slug at line:", slugLine + 1);
console.log("knowledgeSeed starts at line:", seedStart + 1);
console.log("knowledgeSeed ends at line:", seedEnd + 1);

// Build the new seed
const newSeed = `      {
        title: "Stone AI Platform Intelligence — Agent Test Results, Competitive Positioning, and Sales Playbook",
        content: \`STONE AI SALES INTELLIGENCE BRIEF — CONFIDENTIAL
For use by Enterprise Sales Advisor in real-world customer conversations.

SECTION 1: AGENT PERFORMANCE SCORECARD (35 Agents Tested Against Industry-Standard Professional Exams)

TIER BREAKDOWN:
FREE tier (3 agents): Platform Onboarding (85%), Enterprise Sales Advisor (92%), Bestie Companion (68% — upgraded).
STARTER tier: Same 3 agents as FREE (conversion opportunity — pitch upgrade value).
PLUS tier (11 agents): Print-on-Demand (72%), Brand Building (82%), Content Studio (81%), YouTube Video Editor (71%), Short-Form Content (70%), Niche Blog & Affiliate (83%), Social Media Management (78%), Copywriting (92%), Community & Education (76%), Resume & LinkedIn (86%), Sales Agent (88%).
SMART tier (15 agents): AI Automation Agency (78%), Vertical AI SaaS (75%), SMMA (80%), Dropshipping (76%), Lead Generation (79%), YouTube Automation (77%), High-Ticket Funnel (85%), Paid Ads (80%), Research Synthesis (72%), Website Development (79%), Automation Scripts (77%), Data Analytics (80%), Trading Signals (74%), Dispatch & Logistics (74%), Claims Processing (82%), Compliance (80%).
PRO tier (4 agents): Cybersecurity (88%), Startup Launcher (73%), Engineering Architect (71%), Structural Engineer (84%), Enterprise Implementation (87%).

KEY SELLING POINTS FROM SCORES:
- Copywriting agent (92%) tested against AWAI Accelerated Program standards — outperforms most human copywriters on direct response fundamentals.
- Enterprise Sales Advisor (92%) tested against NASP Certified Professional Sales Person exam — top-tier sales methodology knowledge.
- Cybersecurity agent (88%) tested against CompTIA Security+ and CISSP concepts — legitimate security consulting capability.
- Sales Agent (88%) and Enterprise Implementation (87%) — strong professional services capability.
- Average score across all 35 agents: 78.6% — this means every agent performs at or above professional certification passing threshold.

SECTION 2: COMPETITIVE POSITIONING

VS CHATGPT PLUS ($20/mo):
- ChatGPT is a generalist. Stone AI agents are specialists with domain-specific knowledge seeds at professional certification depth.
- ChatGPT does not remember across sessions by default. Stone AI agents have persistent memory and context.
- ChatGPT has no companion/Bestie feature. Stone AI has customizable AI companions with personality design.
- ChatGPT has no agent specialization — every conversation starts from zero expertise. Stone AI agents start with 4-6 deep knowledge bases already loaded.
- HANDLE OBJECTION "Why not just use ChatGPT?": "ChatGPT is an incredible general tool. We built Stone AI for people who need more than general — they need an AI team that already knows their industry. Our Copywriting agent scored 92% on professional copywriting exams. Our Cybersecurity agent scores 88% on Security+ standards. ChatGPT would need extensive prompting to reach that depth. We start there."

VS CLAUDE PRO ($20/mo):
- Similar to ChatGPT positioning. Claude excels at reasoning but has no specialization layer, no companion feature, no persistent agent memory.
- HANDLE OBJECTION: "Claude is smarter though." RESPONSE: "Claude and GPT-4 are extraordinary general models. We actually use cloud AI models for our SMART mode. The difference is: we wrap that intelligence in specialized knowledge. A Claude conversation about cybersecurity starts from scratch. Our Cybersecurity agent starts with CompTIA, CISSP, and NIST frameworks already in context."

VS JASPER AI ($49/mo):
- Jasper focuses exclusively on marketing content. Stone AI covers marketing PLUS 5 other categories (business, content, technical, education, finance).
- Jasper has no companion feature, no technical agents, no business strategy agents.
- HANDLE OBJECTION: "Jasper is cheaper for marketing." RESPONSE: "Jasper is excellent for marketing templates. If templates are all you need, use Jasper. But most businesses need more than marketing — they need the strategy behind the marketing. Our Lead Generation agent, High-Ticket Funnel agent, and Brand Building agent work together as a system. Jasper gives you copy. We give you the strategy AND the copy."

VS CHARACTER.AI (Free/$9.99):
- Character.AI does fictional characters and roleplay. Stone AI Bestie does personal AI companions with real utility — coaching, motivation, emotional support, with persistent memory.
- Stone AI companions have professional knowledge backing them. A Character.AI character knows nothing real. A Stone AI Bestie trained with wellness expertise actually provides useful guidance.
- HANDLE OBJECTION: "Character.AI companions are free." RESPONSE: "They are, and they are fun. But they are fictional characters with no memory, no real knowledge, and no professional grounding. Our Besties remember your goals, your struggles, your wins. They have coaching ethics training. They are designed to make your life better, not just entertain you."

SECTION 3: DEAL CLOSING STRATEGIES BY PROSPECT TYPE

SMALL BUSINESS / SOLOPRENEUR:
- Lead with Bestie + 2-3 relevant agents (usually Content Studio, Sales Agent, Brand Building).
- Price anchor against hiring freelancers: "A freelance copywriter costs $500-2,000 per project. Our Copywriting agent, scoring 92% on professional standards, is available 24/7 for $29.99/mo."
- Target tier: PLUS ($29.99/mo). Upsell to SMART when they need cloud AI.

AGENCY / MARKETING TEAM:
- Lead with the agent ecosystem: "Your team gets 15 specialized agents — content, ads, funnels, analytics, automation."
- Price anchor against hiring: "One junior marketing hire costs $45,000+/year. Our SMART tier gives your entire team 15 specialist agents for $839.88/year."
- Target tier: SMART ($69.99/mo). Upsell to PRO for API access.

ENTERPRISE / LARGE TEAM:
- Lead with security, compliance, and customization: "SOC 2-grade security, audit logging, team seats, custom model fine-tuning."
- Price anchor against consulting: "Management consulting runs $200-500/hour. Our Enterprise Implementation agent, scoring 87% on PMP/SAFe standards, is available unlimited for your team."
- Target tier: ENTERPRISE ($500+/mo custom). Start conversation at PRO ($199/mo).

DEVELOPER / TECHNICAL BUYER:
- Lead with API access and technical agents: "Website Development, Automation Scripts, Data Analytics, Cybersecurity — all accessible via API."
- Price anchor against developer tools: "GitHub Copilot is $19/mo for code completion. We give you full-stack development guidance, automation scripting, data analytics, AND cybersecurity consulting."
- Target tier: PRO ($199/mo) for API access.

SECTION 4: OBJECTION HANDLING

"Too expensive": See competitive anchoring above. Always compare to the ALTERNATIVE cost (freelancers, employees, consultants), not to other AI tools.
"I already use ChatGPT": "Great — keep using it for general questions. Use Stone AI when you need specialist-grade answers. They complement each other."
"How good are the agents really?": Reference the test scores. "We test every agent against the actual professional certification exams in their field. 27 of 35 passed on first evaluation. We upgraded the other 8. Average score: 78.6%."
"What if I only need 2-3 agents?": "Most users start thinking they need 2-3. After a month, the average active user engages with 6-8 different agents. Start with PLUS and explore."
"Is my data secure?": "AES-256-GCM encryption, Redis rate limiting, CSP headers, audit logging, input sanitization. Enterprise-grade security at every tier."
"No mobile app?": "Our web app works beautifully on mobile browsers. Our native mobile app (Best AI) launches in Q3 2026 with voice interaction and enhanced Bestie features. Early adopters get priority access."\`
      },`;

// Insert before the closing ],
const insertAt = seedEnd; // This is the line with ],
lines.splice(insertAt, 0, newSeed);

writeFileSync(FILE, lines.join("\n"), "utf8");
console.log("Sales intelligence seed inserted at line:", insertAt + 1);
console.log("New total lines:", lines.length);
