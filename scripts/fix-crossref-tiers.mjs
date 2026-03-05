import { readFileSync, writeFileSync } from "fs";

const FILE = "src/lib/agent-definitions.ts";
let src = readFileSync(FILE, "utf8");

// Replace the agent directory entries with tier-tagged versions
// Each replacement is exact string match

const replacements = [
  // Directory entries - add tier tags
  [
    '1. AI Automation Agency — AI-powered business automation, chatbots, n8n/Make workflows, API integrations',
    '1. AI Automation Agency [SMART] — AI-powered business automation, chatbots, n8n/Make workflows, API integrations'
  ],
  [
    '2. Vertical AI SaaS Strategist — SaaS product strategy, vertical-market AI solutions, MVP validation',
    '2. Vertical AI SaaS Strategist [SMART] — SaaS product strategy, vertical-market AI solutions, MVP validation'
  ],
  [
    '3. SMMA Consultant — Social media marketing agency building, client acquisition, service delivery',
    '3. SMMA Consultant [SMART] — Social media marketing agency building, client acquisition, service delivery'
  ],
  [
    '4. Dropshipping Strategist — Product research, store building, supplier management, e-commerce scaling',
    '4. Dropshipping Strategist [SMART] — Product research, store building, supplier management, e-commerce scaling'
  ],
  [
    '5. Print on Demand Strategist — POD niche selection, design strategy, listing optimization, multi-platform scaling',
    '5. Print on Demand Strategist [PLUS] — POD niche selection, design strategy, listing optimization, multi-platform scaling'
  ],
  [
    '6. Brand Strategist — Brand identity, positioning, messaging, visual direction, brand architecture',
    '6. Brand Strategist [PLUS] — Brand identity, positioning, messaging, visual direction, brand architecture'
  ],
  [
    '7. Lead Generation Strategist — Outbound systems, lead magnets, appointment setting, pipeline building',
    '7. Lead Generation Strategist [SMART] — Outbound systems, lead magnets, appointment setting, pipeline building'
  ],
  [
    '8. YouTube Automation Strategist — YouTube channel building, faceless/automated channels, content strategy',
    '8. YouTube Automation Strategist [SMART] — YouTube channel building, faceless/automated channels, content strategy'
  ],
  [
    '9. Content Strategist — Multi-format content creation, editorial planning, content operations',
    '9. Content Strategist [PLUS] — Multi-format content creation, editorial planning, content operations'
  ],
  [
    '10. YouTube Video Editor — Video pacing, retention editing, visual storytelling, post-production',
    '10. YouTube Video Editor [PLUS] — Video pacing, retention editing, visual storytelling, post-production'
  ],
  [
    '11. Short-Form Content Strategist — TikTok, Instagram Reels, YouTube Shorts optimization and creation',
    '11. Short-Form Content Strategist [PLUS] — TikTok, Instagram Reels, YouTube Shorts optimization and creation'
  ],
  [
    '12. Niche Blog & Affiliate Strategist — SEO-driven blogs, affiliate marketing, passive income content sites',
    '12. Niche Blog & Affiliate Strategist [PLUS] — SEO-driven blogs, affiliate marketing, passive income content sites'
  ],
  [
    '13. High-Ticket Funnel Architect — Sales funnels for high-ticket offers ($3K-$50K+), conversion optimization',
    '13. High-Ticket Funnel Architect [SMART] — Sales funnels for high-ticket offers ($3K-$50K+), conversion optimization'
  ],
  [
    '14. Paid Advertising Strategist — Facebook/Meta, Google, TikTok, LinkedIn, YouTube ad campaigns and PPC',
    '14. Paid Advertising Strategist [SMART] — Facebook/Meta, Google, TikTok, LinkedIn, YouTube ad campaigns and PPC'
  ],
  [
    '15. Social Media Manager — Organic social growth, engagement strategy, platform-specific optimization',
    '15. Social Media Manager [PLUS] — Organic social growth, engagement strategy, platform-specific optimization'
  ],
  [
    '16. Copywriter — Direct response copy, sales pages, email sequences, ad copy, brand messaging',
    '16. Copywriter [PLUS] — Direct response copy, sales pages, email sequences, ad copy, brand messaging'
  ],
  [
    '17. Community & Education Architect — Paid communities, online courses, membership platforms',
    '17. Community & Education Architect [PLUS] — Paid communities, online courses, membership platforms'
  ],
  [
    '18. Research Synthesis Specialist — Academic research analysis, knowledge management, evidence-based insights',
    '18. Research Synthesis Specialist [SMART] — Academic research analysis, knowledge management, evidence-based insights'
  ],
  [
    '19. Full-Stack Web Developer — Web architecture, code generation, performance optimization, modern frameworks',
    '19. Full-Stack Web Developer [SMART] — Web architecture, code generation, performance optimization, modern frameworks'
  ],
  [
    '20. Automation Script Developer — Custom scripts, API integrations, workflow automation, Python/Node tooling',
    '20. Automation Script Developer [SMART] — Custom scripts, API integrations, workflow automation, Python/Node tooling'
  ],
  [
    '21. Data Analyst — Data analysis, visualization, dashboards, business intelligence, SQL/Python analytics',
    '21. Data Analyst [SMART] — Data analysis, visualization, dashboards, business intelligence, SQL/Python analytics'
  ],
  [
    '22. Cybersecurity Consultant — Security assessments, vulnerability analysis, infrastructure hardening, compliance',
    '22. Cybersecurity Consultant [PRO] — Security assessments, vulnerability analysis, infrastructure hardening, compliance'
  ],
  [
    '23. Trading Analyst — Technical analysis, risk management, trading systems, signal service operations',
    '23. Trading Analyst [SMART] — Technical analysis, risk management, trading systems, signal service operations'
  ],
  [
    '24. Resume & LinkedIn Optimizer — Resume writing, LinkedIn optimization, career branding, job search strategy',
    '24. Resume & LinkedIn Optimizer [PLUS] — Resume writing, LinkedIn optimization, career branding, job search strategy'
  ],
  [
    '25. Startup Advisor — Idea validation, MVP design, fundraising, pitch decks, go-to-market strategy',
    '25. Startup Advisor [PRO] — Idea validation, MVP design, fundraising, pitch decks, go-to-market strategy'
  ],
  [
    '26. Engineering Architect — System design, infrastructure planning, CAD/technical documentation, engineering',
    '26. Engineering Architect [PRO] — System design, infrastructure planning, CAD/technical documentation, engineering'
  ],
  [
    '27. Structural Engineering Consultant — Structural analysis, building systems, material selection, construction docs',
    '27. Structural Engineering Consultant [PRO] — Structural analysis, building systems, material selection, construction docs'
  ],
  [
    '28. Dispatch & Logistics Agent — Fleet management, route optimization, freight brokerage, field service dispatch',
    '28. Dispatch & Logistics Agent [SMART] — Fleet management, route optimization, freight brokerage, field service dispatch'
  ],
  [
    '29. Sales Agent — B2B/B2C sales strategy, pipeline management, closing techniques, CRM optimization',
    '29. Sales Agent [PLUS] — B2B/B2C sales strategy, pipeline management, closing techniques, CRM optimization'
  ],
  [
    '30. Claims Processing Agent — Insurance claims (auto, property, health), warranty claims, dispute resolution',
    '30. Claims Processing Agent [SMART] — Insurance claims (auto, property, health), warranty claims, dispute resolution'
  ],
  [
    '31. Compliance & Regulatory Agent — GDPR, HIPAA, SOX, PCI-DSS, SOC 2, AML/KYC, regulatory frameworks',
    '31. Compliance & Regulatory Agent [SMART] — GDPR, HIPAA, SOX, PCI-DSS, SOC 2, AML/KYC, regulatory frameworks'
  ],
  [
    '32. Platform Onboarding Concierge — Stone AI platform guidance, feature tours, tier recommendations',
    '32. Platform Onboarding Concierge [FREE] — Stone AI platform guidance, feature tours, tier recommendations'
  ],
  [
    '33. Enterprise Implementation Architect — Enterprise deployment, custom integrations, migration planning',
    '33. Enterprise Implementation Architect [PRO] — Enterprise deployment, custom integrations, migration planning'
  ],
  [
    '34. Enterprise Sales Advisor — Enterprise plan configuration, ROI analysis, procurement guidance',
    '34. Enterprise Sales Advisor [FREE] — Enterprise plan configuration, ROI analysis, procurement guidance'
  ],
  [
    '35. Bestie Companion — Personal AI friend, emotional support, casual conversation (at /app/bestie)',
    '35. Bestie Companion [FREE] — Personal AI friend, emotional support, casual conversation (at /app/bestie)'
  ],
];

// Also need to replace the routing instruction
const oldRouting = 'Never guess or improvise outside your domain. Always route users to the right specialist with confidence and a clear explanation of why that agent is the best fit.';

const newRouting = `TIER-AWARE ROUTING:
When recommending an agent, check the tier tag [FREE/PLUS/SMART/PRO]. If the recommended agent requires a higher tier than the user may have:
- Still recommend the agent (the user needs to know the right resource exists)
- Mention the tier requirement: "Our [Agent Name] specializes in that — they are available on the [TIER] plan and above."
- For the current conversation, provide what basic guidance you can without going deep into the other agent's domain
- If the user's need is urgent and the right agent is tier-locked, suggest they visit /app/billing to explore upgrade options

Never guess or improvise outside your domain. Always route users to the right specialist with confidence and a clear explanation of why that agent is the best fit.`;

let count = 0;
for (const [oldStr, newStr] of replacements) {
  const before = src.length;
  src = src.replaceAll(oldStr, newStr);
  if (src.length !== before) count++;
}

// Replace routing instruction
const routingCount = (src.match(new RegExp(oldRouting.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
src = src.replaceAll(oldRouting, newRouting);

writeFileSync(FILE, src, "utf8");
console.log("Directory entries updated:", count, "/ 35");
console.log("Routing instructions updated:", routingCount, "instances");
console.log("Done.");
