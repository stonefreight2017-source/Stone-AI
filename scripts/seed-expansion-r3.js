const { Client } = require('pg');
const crypto = require('crypto');

const DATABASE_URL = 'postgresql://stoneai:stoneai_dev_2026@localhost:5432/stoneai';

const seeds = [
  // ── Platform Onboarding Concierge (4 chunks) ──
  {
    agentId: 'cmmluejbd009v349j7ghn9pze',
    title: 'Agent Chaining Workflows and Multi-Agent Strategies',
    content: `Agent Chaining — Getting 10x Value from Stone AI:

Agent chaining is when you take the output of one agent and feed it into another to build a complete deliverable. This is the difference between casual users and power users.

EXAMPLE CHAINS:

Chain 1 — Content Marketing Pipeline:
1. Content Studio → generate a monthly content calendar with topics and angles
2. Copywriting → write the actual blog posts / social captions from the calendar
3. Short Form Repurposing → turn each piece into 5+ social media formats
Result: 1 session produces a full month of multi-platform content.

Chain 2 — Business Launch:
1. Startup Launcher → validate idea, define ICP, competitive positioning
2. Brand Building → name, visual identity, brand voice, messaging framework
3. High Ticket Funnel Builder → build the sales funnel and landing page copy
4. Lead Generation → cold outreach sequences and lead magnets
Result: Go from idea to market-ready in 4 conversations.

Chain 3 — Compliance + Claims:
1. Compliance Agent → identify regulatory requirements for your industry
2. Claims Agent → build claims processing workflows that meet those requirements
Result: Compliant claims operation from scratch.

HOW TO CHAIN EFFECTIVELY:
- Copy the key output (framework, list, plan) from Agent A
- Paste it into your first message to Agent B with context: "Here is the [plan/framework] from my previous session. Now I need you to [specific next step]."
- Each agent adds its domain expertise to the chain.
- Save conversation links so you can reference back.`
  },
  {
    agentId: 'cmmluejbd009v349j7ghn9pze',
    title: 'Prompt Engineering Quick Reference for Stone AI Users',
    content: `Prompt Engineering — How to Talk to Stone AI Agents for Best Results:

LEVEL 1 — BASIC (most users start here):
Bad: "Help me with marketing"
Good: "I run a local bakery in Austin, TX. I need a 30-day social media plan for Instagram and TikTok to increase foot traffic. Budget: $500/month for ads."

LEVEL 2 — STRUCTURED:
Use this template for any agent:
"CONTEXT: [Your business/situation in 2-3 sentences]
GOAL: [Specific outcome you want]
CONSTRAINTS: [Budget, timeline, tools you already use]
FORMAT: [How you want the output — table, checklist, step-by-step, template]"

LEVEL 3 — ADVANCED:
- Ask the agent to explain its reasoning: "Walk me through why you chose this approach"
- Request alternatives: "Give me 3 different approaches with pros/cons of each"
- Iterate: "This is good but I need it more [specific]. Adjust the [element] to be [direction]"
- Chain-of-thought: "Think through this step by step before giving recommendations"

COMMON MISTAKES:
- Too vague: "Help me grow" → No agent can help without specifics
- Too broad: "Build my entire business" → Break it into focused sessions
- No context: Agents work best when they understand YOUR situation
- Not iterating: First response is a starting point — refine with follow-ups

PRO TIP — THE 3-MESSAGE RULE:
Message 1: Context + goal (agent gives initial framework)
Message 2: Refine based on what's missing or needs adjustment
Message 3: Request final polished deliverable
Most users get their best output on message 2 or 3, not message 1.`
  },
  {
    agentId: 'cmmluejbd009v349j7ghn9pze',
    title: 'Stone AI Tier Comparison and Agent Roster by Tier',
    content: `Stone AI Tier Breakdown — Which Tier Fits Your Needs:

FREE TIER ($0/month):
- 4 agents: Platform Onboarding Concierge + 3 starter agents
- Perfect for: Exploring the platform, getting a feel for agent quality
- Limitation: Can't access specialized business, marketing, or technical agents

STARTER ($19.99/month):
- 16 agents: Core business + content agents
- Includes: Print on Demand, Dropshipping, Content Studio, Niche Blog & Affiliate, and more
- Perfect for: Side hustlers, beginners building their first online business
- Best value if: You need 1-3 specific agents and use them weekly

PLUS ($49.99/month):
- 30 agents: Full business + marketing + content suite
- Adds: AI Automation Agency, Vertical AI SaaS, Brand Building, Lead Generation, High Ticket Funnel, Paid Ads, Copywriting, and more
- Perfect for: Solopreneurs, freelancers, small agencies
- Best value if: You run a business and need multiple agents regularly

SMART ($99.99/month, annual: $79.99/month):
- 39 agents: Everything in PLUS + technical + specialized agents
- Adds: Claims Agent, Compliance Agent, Cybersecurity, Engineering Architect, Enterprise Implementation, and more
- Cloud AI powered (Claude Sonnet) — higher quality responses
- Perfect for: Growing businesses, consultants, agencies
- Best value if: You need advanced agents AND higher response quality

PRO ($200/month, annual: $170/month):
- All 42 public agents — complete access
- Priority support, highest rate limits
- Perfect for: Power users, agencies managing multiple clients
- Best value if: You use 5+ agents daily across different domains

UPGRADE DECISION FRAMEWORK:
- Using 1-2 agents occasionally → STARTER
- Using 3-5 agents weekly → PLUS
- Need specialized/technical agents → SMART
- Using agents as core business tools → PRO`
  },
  {
    agentId: 'cmmluejbd009v349j7ghn9pze',
    title: 'Onboarding Troubleshooting and FAQ Reference',
    content: `Platform Onboarding — Common Questions and Solutions:

Q: Which agent should I start with?
A: It depends on your #1 priority right now:
- Starting a business → Startup Launcher
- Growing revenue → Lead Generation or High Ticket Funnel Builder
- Creating content → Content Studio
- Building a brand → Brand Building
- Automating workflows → AI Automation Agency
- Need everything → Start with Platform Onboarding (this agent) to map your needs

Q: How is this different from ChatGPT?
A: Stone AI agents are specialists with deep domain knowledge, proven frameworks, and structured methodologies baked in. ChatGPT is a generalist. Asking our Copywriting agent to write a sales page is like hiring a professional copywriter vs asking a smart friend. The frameworks (AIDA, PAS, storytelling), the structure, and the domain expertise are built into each agent.

Q: Can I use multiple agents on the same project?
A: Absolutely — this is called "agent chaining" and it's the most powerful way to use Stone AI. Example: Use Startup Launcher for strategy, Brand Building for identity, Copywriting for sales copy, and Lead Generation for outreach — each agent handles its specialty.

Q: What if an agent gives me something I don't like?
A: Iterate. Tell the agent specifically what to change: "Make the tone more casual" or "Focus more on B2B rather than B2C" or "Give me a shorter version with just the action items." Agents improve dramatically with feedback in the same conversation.

Q: How do conversations work?
A: Each conversation maintains context within the session. The agent remembers everything said in the current conversation. For a new topic, start a new conversation. For continuing previous work, reference what you discussed: "Last time we built a content calendar. Now I need the actual posts written."

Q: Is my data private?
A: Yes. Conversations are encrypted, stored securely, and never used to train AI models. Your business strategies, financial data, and proprietary information stay private.`
  },

  // ── Print on Demand (4 chunks) ──
  {
    agentId: 'cmmlueixe000x349jdj0z4x7p',
    title: 'POD Scaling Systems and Design Velocity',
    content: `Scaling a Print on Demand Business — From 100 to 10,000 Designs:

DESIGN VELOCITY SYSTEM:
Phase 1 (0-100 designs): Do it yourself. Learn what sells. Track every design's performance.
Phase 2 (100-500 designs): Develop templates. Create 5-10 design templates per niche that you can swap text/elements quickly. One template → 20 variations in an hour.
Phase 3 (500-2,000 designs): Hire designers. Use Fiverr ($5-15/design) or Upwork ($10-25/design) with clear briefs. Batch orders: 20-50 designs per order.
Phase 4 (2,000-10,000 designs): Build a design team. 1-2 dedicated designers producing 10-20 designs/day. You focus on niche research and listing optimization.

BATCH WORKFLOW (Daily Routine at Scale):
1. Morning: Review analytics — kill underperformers, note top sellers
2. Research: 30 min finding new sub-niches and trending phrases
3. Brief: Write 10-20 design briefs for designers (template + text + style reference)
4. List: Upload and optimize 10-20 new listings across platforms
5. Optimize: Update tags/titles on existing listings based on search data

TOOLS FOR SCALE:
- Productor (Chrome extension): Bulk upload to Merch by Amazon
- Vela: Multi-platform listing management (Etsy, eBay, Shopify)
- Merch Informer ($10/mo): Amazon Merch research, trademark checks, trends
- Flying Upload: Bulk upload for Redbubble, TeePublic
- Canva Pro teams: Shared brand assets, template library for team

SEASONAL CALENDAR — Plan 6-8 Weeks Ahead:
Jan: New Year resolutions, fitness, teacher back-to-school (Southern Hemisphere)
Feb: Valentine's Day, Black History Month
Mar: St. Patrick's Day, Women's History Month, March Madness
Apr: Easter, Earth Day, Administrative Professionals
May: Mother's Day, Memorial Day, graduation season, nurses week
Jun: Father's Day, Pride Month, summer themes
Jul: Independence Day, summer vacation
Aug: Back to school (biggest POD season alongside Q4)
Sep: Labor Day, grandparents day, fall themes
Oct: Halloween (start designs in August)
Nov: Thanksgiving, Veterans Day, Black Friday/Cyber Monday
Dec: Christmas, Hanukkah, holiday gifting (peak POD revenue month)`
  },
  {
    agentId: 'cmmlueixe000x349jdj0z4x7p',
    title: 'POD Product Selection and Profit Margin Guide',
    content: `Print on Demand Product Strategy — Beyond T-Shirts:

TOP-SELLING POD PRODUCTS BY MARGIN:

HIGH MARGIN (50-70%):
- All-over-print hoodies: Retail $55-75, base cost $25-35. Unique look, less competition.
- Canvas prints/wall art: Retail $30-80, base cost $8-20. High perceived value, low base cost.
- Phone cases: Retail $20-30, base cost $5-8. Impulse buy, high volume.
- Mugs: Retail $15-22, base cost $5-8. Gift market, evergreen demand.
- Tote bags: Retail $18-28, base cost $8-12. Eco-conscious buyers, growing market.

MEDIUM MARGIN (35-50%):
- Standard t-shirts: Retail $22-30, base cost $10-15. Highest volume but most competitive.
- Sweatshirts/crewnecks: Retail $35-50, base cost $18-28. Seasonal peaks in fall/winter.
- Stickers: Retail $3-8, base cost $1-3. Low price point but massive volume potential (Redbubble strength).
- Posters: Retail $15-30, base cost $5-12. Dorm/apartment market.

LOWER MARGIN BUT STRATEGIC:
- Leggings/activewear: Higher base cost but passionate buyers and repeat purchases.
- Baby bodysuits: Gift market, emotional purchases = higher conversion rates.
- Pet accessories: Exploding market, pet owners spend generously.

PRODUCT STRATEGY RULES:
1. Start with t-shirts to validate niches (fastest feedback loop)
2. Expand winners to 3-5 product types (mug + hoodie + canvas + phone case)
3. Bundle potential: "Matching set" for couples, families, teams
4. Gift market = higher willingness to pay (add gift-oriented keywords)
5. Seasonal products: ugly Christmas sweaters, Halloween hoodies, Valentine mugs

PRICING PSYCHOLOGY:
- $19.99 outperforms $20.00 (charm pricing)
- Premium pricing ($29.99+ for shirts) works with premium mockups and brand story
- Never race to the bottom — compete on design quality and niche targeting, not price
- Free shipping threshold: Build shipping into product price, show as "free shipping"`
  },
  {
    agentId: 'cmmlueixe000x349jdj0z4x7p',
    title: 'POD Analytics and Optimization Framework',
    content: `Print on Demand Analytics — Measuring What Matters:

KEY METRICS TO TRACK:
1. Design Hit Rate: % of designs generating at least 1 sale in first 30 days. Target: 15-25%. Below 10% = niche or design quality problem.
2. Revenue per Design: Total revenue / total active designs. Target: $2-5/design/month at scale. Top performers: $10-50+/design/month.
3. Best Seller Ratio: % of designs generating 80% of revenue. Typical: 20% of designs = 80% of revenue (Pareto principle).
4. Platform Diversification: Revenue split across platforms. Healthy: No single platform > 60% of total revenue.
5. Return Rate: Target < 5%. High returns = sizing issues, quality problems, or misleading mockups.

OPTIMIZATION PLAYBOOK:

UNDERPERFORMERS (0 sales in 60 days):
- Update title/tags with better keywords (search data from Merch Informer or eRank)
- Swap mockup images (lifestyle shots vs flat lay)
- If still no sales after 90 days and updated SEO → retire and replace

MIDDLE PERFORMERS (1-3 sales/month):
- Create variations: same design in different colors, on different products
- Add to more platforms (if only on Amazon, add to Redbubble + Etsy)
- Improve listing: better descriptions, more tags, A+ content

TOP PERFORMERS (5+ sales/month):
- Create a "collection" around the same theme/niche
- Expand to all available products (mug, hoodie, phone case, canvas)
- Run paid ads (Etsy Ads at $1-3/day, Amazon PPC if applicable)
- Study WHY it works — replicate the pattern in other niches

A/B TESTING FOR POD:
- Test 2 different title structures on same design across platforms
- Test mockup styles: lifestyle vs flat vs model wearing
- Test pricing: $19.99 vs $24.99 (higher price often performs equally with better margins)
- Track by UTM parameters if driving external traffic`
  },
  {
    agentId: 'cmmlueixe000x349jdj0z4x7p',
    title: 'POD Brand Building and Customer Retention Strategy',
    content: `From Generic POD Seller to Branded Store — The Long Game:

WHY BRAND > GENERIC:
Generic POD: Race to bottom, no repeat customers, platform-dependent, easily copied.
Branded POD: Premium pricing, email list, repeat buyers, direct traffic, acquirable asset.

BRAND BUILDING STEPS FOR POD:

Step 1 — Pick Your Brand Niche:
Narrow enough to build community, broad enough for 500+ designs. Example: Not "dog shirts" but "Golden Retriever lifestyle brand" or "Nurse humor apparel."

Step 2 — Create Brand Identity:
- Brand name (check trademark availability on USPTO TESS)
- Logo (Canva or Fiverr, $20-100)
- Color palette (3-5 colors that appear on your products and packaging)
- Brand voice (humorous? inspirational? edgy? wholesome?)
- Tagline that captures your audience's identity

Step 3 — Own Your Store:
Move from pure marketplace (Redbubble, Merch) to owned storefront:
- Shopify ($39/mo) + Printful/Printify integration
- Custom domain ($12/year)
- Branded packaging inserts (Printful offers custom inserts)
- Thank you cards with social media handles and discount codes

Step 4 — Build Your Audience:
- Instagram/TikTok for your niche (post designs, behind-the-scenes, customer photos)
- Email list (Klaviyo free up to 250 contacts): New design drops, seasonal sales, exclusive designs
- Facebook Group around your niche identity (e.g., "Golden Retriever Parents")
- Pinterest (massive organic reach for POD — pin every design with keywords)

Step 5 — Customer Retention:
- Email new design drops weekly/bi-weekly
- Loyalty program: 10% off after 3rd purchase
- Limited edition runs: "Only available this week" creates urgency
- Customer photo features: Repost buyers wearing your designs (free social proof)
- Seasonal collections: Themed drops for holidays and events

REVENUE MILESTONES:
$0-500/mo: Marketplace focus (Etsy, Redbubble, Merch). Learn what sells.
$500-2,000/mo: Launch Shopify store alongside marketplaces. Start email list.
$2,000-5,000/mo: Paid ads on winning designs. Hire first designer.
$5,000-10,000/mo: Full brand operation. Team of 2-3. Multiple channels.
$10,000+/mo: Consider wholesale, retail partnerships, or licensing deals.`
  },

  // ── Vertical AI SaaS (3 chunks) ──
  {
    agentId: 'cmmlueiw9000c349jkbxkorzi',
    title: 'AI SaaS Customer Development and Validation Playbook',
    content: `Validating a Vertical AI SaaS Idea — Before Writing a Line of Code:

THE 4-WEEK VALIDATION SPRINT:

WEEK 1 — PROBLEM DISCOVERY:
- Identify 3-5 target verticals where AI can solve painful, frequent, manual problems
- Join 5+ communities per vertical (Reddit, Facebook groups, LinkedIn, forums)
- Document the exact language people use to describe their pain ("I spend 3 hours every day manually entering invoices")
- Talk to 10+ potential users (DMs, LinkedIn messages, cold calls). Ask: "What's the most tedious part of your job?" NOT "Would you use an AI tool?"

WEEK 2 — SOLUTION HYPOTHESIS:
- For each validated problem, draft a 1-sentence solution: "[Product] uses AI to [solve problem] for [audience], saving them [time/money]"
- Sketch the core workflow (3-5 screens max for MVP)
- Identify the "magic moment" — the single feature that makes someone say "wow"
- Research competitors: Are they AI-native or legacy tools bolting on AI? Gap = opportunity.

WEEK 3 — FAKE DOOR TESTING:
- Build a landing page (Framer, Carrd, or simple Next.js page): Headline + 3 benefits + waitlist signup
- Run $200-500 in targeted ads (LinkedIn for B2B, Facebook/Instagram for SMB)
- Target: 100+ landing page visitors, 10%+ signup rate = validated interest
- Alternative: Post in communities with "I'm building X — would this solve your problem?" gauge response

WEEK 4 — WILLINGNESS TO PAY:
- Email waitlist with pricing survey: "Would you pay $49/mo for this? $99/mo? $199/mo?"
- Offer 5 founding member spots at 50% discount for pre-payment (validates with money, not just words)
- If 5+ people pre-pay → BUILD IT. If 0 pre-pay → pivot or kill.

RED FLAGS — KILL THE IDEA IF:
- Can't find 10 people to interview about the problem
- Landing page converts below 5% signup rate
- Zero willingness to pre-pay at any price point
- The problem is real but the audience can't afford SaaS pricing
- Existing tools are "good enough" and switching cost is high`
  },
  {
    agentId: 'cmmlueiw9000c349jkbxkorzi',
    title: 'AI SaaS Retention and Growth Loops',
    content: `SaaS Retention Engineering — Keeping Customers and Growing Revenue:

CHURN ANALYSIS FRAMEWORK:
Month 1 churn > 15%: Onboarding problem. Users don't reach "aha moment" fast enough.
Month 2-3 churn > 10%: Value delivery problem. Product isn't sticky in daily workflow.
Month 4-6 churn > 5%: Competition or changing needs. Need feature expansion or deeper integration.
Month 7+ churn > 3%: Natural attrition. Focus on expansion revenue to offset.

RETENTION LEVERS (in order of impact):

1. TIME TO VALUE (TTV):
- Reduce setup from days to minutes. Pre-fill, auto-detect, guided onboarding.
- Show first AI-generated result within 60 seconds of signup.
- Template library: Don't make users start from blank. Pre-built workflows for common use cases.

2. WORKFLOW LOCK-IN:
- Integrate with tools they already use (CRM, email, calendar, accounting software)
- Store their data/history so switching means losing accumulated value
- Build habits: daily/weekly notifications, reports, reminders tied to their workflow

3. DATA MOAT:
- The more they use it, the better it gets (fine-tuned on their data, learned preferences)
- Show them their improvement over time: "You've processed 847 documents, saving 142 hours"
- Make the AI smarter with their usage — this is the ultimate switching cost

4. EXPANSION REVENUE:
- Usage-based pricing tiers that grow with their business
- Add-on features: advanced analytics, team seats, API access, white-label
- Annual contracts: 20% discount for annual = reduces churn by 30-40%

GROWTH LOOPS FOR AI SAAS:
- Viral: Shared reports/outputs with "Powered by [YourProduct]" watermark
- Content: Publish AI-generated industry benchmarks/reports (free) → drive signups
- Integration: Partners refer users when they integrate your tool into their workflow
- Community: User forum where customers share templates, workflows, best practices
- PLG (Product-Led Growth): Free tier with usage limits → natural upgrade path`
  },
  {
    agentId: 'cmmlueiw9000c349jkbxkorzi',
    title: 'Vertical AI SaaS Competitive Moat Strategy',
    content: `Building Defensible Moats in AI SaaS — Why Competitors Can't Just Copy You:

THE MOAT HIERARCHY (weakest to strongest):

1. FEATURE MOAT (Weak — 3-6 month head start):
Anyone can copy features. AI features especially — if you use GPT-4, so can competitors.
Use this time to build deeper moats, not celebrate.

2. SPEED/UX MOAT (Medium — 6-12 months):
Better product design, faster iteration, superior user experience.
Requires strong product sense and rapid shipping culture.
Example: Linear vs Jira — same category, 10x better UX = billions in value.

3. INTEGRATION MOAT (Medium — 6-18 months):
Deep integrations with vertical-specific tools that competitors haven't built.
Example: AI accounting tool deeply integrated with QuickBooks, Xero, AND Gusto — each integration takes months.
More integrations = more switching cost for customers.

4. DATA MOAT (Strong — 12-24 months):
Proprietary data that improves your AI beyond what generic models offer.
Sources: Customer usage data, industry-specific training data, user feedback loops.
Example: AI legal tool trained on 100K real contracts performs better than generic LLM.
This is the #1 defensible moat in AI SaaS.

5. NETWORK MOAT (Strongest — 18-36 months):
Multi-sided value: more users = better product for everyone.
Example: AI recruiting tool — more companies posting = more candidates applying = better matching for everyone.
Hard to achieve in vertical SaaS but devastating when it works.

PRACTICAL MOAT-BUILDING ACTIONS:
- Month 1-3: Ship fast, nail UX, build feature moat (temporary)
- Month 3-6: Add 3-5 key integrations specific to your vertical
- Month 6-12: Implement feedback loops that fine-tune AI on customer data
- Month 12-18: Launch community features, marketplace, or network effects
- Month 18+: You should have proprietary data advantage that generic AI tools can't match

COMPETITOR RESPONSE PLAYBOOK:
When a well-funded competitor enters your vertical:
1. Don't panic — they're validating your market
2. Double down on vertical depth (they'll be generic)
3. Lock in annual contracts with your best customers
4. Ship integration features faster (increase switching cost)
5. Highlight data privacy and specialization in marketing`
  },

  // ── AI Automation Agency (3 chunks) ──
  {
    agentId: 'cmmlueiu80000349jvwlh2tym',
    title: 'AI Automation Agency Team Building and Hiring',
    content: `Building Your AI Automation Agency Team — From Solo to Scale:

SOLO PHASE ($0-10K/month revenue):
You do everything: sales, delivery, support. This is normal and necessary.
Skills you need: Basic automation (n8n or Make), sales ability, client communication.
Time split: 60% delivery, 30% sales, 10% admin.

FIRST HIRE ($10-25K/month):
Hire a DELIVERY person, not a salesperson. You are the best salesperson for your own agency.
Profile: Technical VA or junior automation specialist.
Where to find: Upwork, OnlineJobs.ph (Philippines — excellent tech talent at $800-1,500/mo full-time).
What they handle: Building automations from your specs, testing, client onboarding, basic support.
You focus on: Sales, strategy, complex builds, client relationships.

SCALING HIRES ($25-75K/month):
- Automation Specialist #2 (delivery capacity)
- Account Manager: Client communication, project tracking, upselling existing clients
- Part-time sales support: Lead gen, CRM management, proposal formatting

AGENCY TEAM ($75K+/month):
- 3-5 Automation Specialists (mix of junior and senior)
- 1-2 Account Managers
- 1 Sales closer (commission-based: 10-15% of first-year contract value)
- 1 Project Manager (coordinates delivery across clients)

HIRING RULES FOR AUTOMATION AGENCIES:
1. Test with a paid trial project ($200-500) before committing to a hire
2. Require screen recording of their work process — speed and methodology matter
3. Start contractors → convert proven performers to full-time
4. Document EVERYTHING — SOPs mean any team member can handle any client
5. Never have a single point of failure — at least 2 people should know every client's systems

COMPENSATION MODELS:
- Filipino VAs: $800-2,000/mo full-time (excellent value for technical work)
- US-based junior: $50-75K/year or $30-45/hr contract
- US-based senior: $80-130K/year or $50-80/hr contract
- Commission for sales: 10-15% of first-year contract value
- Profit sharing for key hires: 5-10% of net profit once agency exceeds $50K/month`
  },
  {
    agentId: 'cmmlueiu80000349jvwlh2tym',
    title: 'AI Automation Agency Niche Selection and Positioning',
    content: `Choosing Your AI Automation Agency Niche — The Riches Are in the Niches:

WHY NICHE DOWN:
Generic "we automate everything" agencies compete on price. Niche agencies compete on expertise and charge 2-5x more.

TOP NICHES FOR AI AUTOMATION AGENCIES (2025):

1. REAL ESTATE AGENCIES & BROKERAGES:
Pain: Manual lead follow-up, listing syndication, showing scheduling, CMA reports.
Automation stack: CRM (Follow Up Boss) + Zapier/Make + ChatGPT API for lead qualification.
Pricing: $2,000-5,000/mo retainer per brokerage.
Why it works: Real estate agents are time-poor and tech-frustrated. They'll pay for anything that generates or nurtures leads automatically.

2. MEDICAL/DENTAL PRACTICES:
Pain: Patient intake, appointment reminders, insurance verification, review collection.
Automation stack: Practice management software + n8n + Twilio + AI chatbot.
Pricing: $3,000-8,000/mo per practice.
Why it works: High revenue per patient, compliance requirements create barriers competitors won't cross.

3. E-COMMERCE BRANDS (DTC):
Pain: Order processing, inventory alerts, review requests, returns, customer service.
Automation stack: Shopify + Gorgias + Klaviyo + Make/n8n + ChatGPT for support.
Pricing: $2,000-6,000/mo per brand.
Why it works: Direct ROI measurable in revenue increase and support cost reduction.

4. LAW FIRMS (Small/Mid):
Pain: Client intake, conflict checks, document assembly, deadline tracking, billing.
Automation stack: Clio/PracticePanther + Zapier + document generation API.
Pricing: $3,000-10,000/mo per firm.
Why it works: Attorneys bill at $200-500/hr. Saving them 5 hrs/week = massive ROI.

5. MARKETING AGENCIES:
Pain: Client reporting, social media scheduling, content repurposing, lead gen for clients.
Automation stack: Agency stack (GoHighLevel, HubSpot) + n8n + AI content generation.
Pricing: $2,000-5,000/mo per agency.
Why it works: They understand automation value, faster sales cycle, high LTV.

POSITIONING FORMULA:
"We help [specific niche] [specific outcome] by automating [specific processes], saving [specific time/money]."
Example: "We help dental practices fill every appointment slot by automating patient follow-ups and review collection, saving front desk staff 15 hours per week."`
  },
  {
    agentId: 'cmmlueiu80000349jvwlh2tym',
    title: 'AI Automation Agency Revenue Models and Retainer Structures',
    content: `AI Automation Agency Revenue Optimization — Pricing, Packaging, and Upselling:

REVENUE MODEL COMPARISON:

PROJECT-BASED (One-time):
Pros: Higher upfront revenue per client, clear scope, easier to sell.
Cons: Revenue stops when project ends, must constantly sell new projects.
Best for: New agencies building portfolio and case studies.
Typical pricing: $2,000-25,000 per project depending on complexity.

RETAINER (Monthly recurring):
Pros: Predictable revenue, deeper client relationships, higher LTV.
Cons: Ongoing obligation, scope creep risk, must deliver continuous value.
Best for: Established agencies with proven delivery systems.
Typical pricing: $2,000-10,000/month per client.

HYBRID (Project + Retainer):
The gold standard. Sell the initial build as a project, then transition to monthly retainer for optimization, support, and new automations.
Example: $8,000 initial build + $2,500/mo maintenance and expansion retainer.

PACKAGING STRATEGY:
Package 1 — "Starter Automation" ($3,000-5,000 one-time):
- 1 core workflow automated end-to-end
- 30 days of support
- Documentation and training
- Upsell to retainer after 30 days

Package 2 — "Growth System" ($8,000-15,000 one-time + $2,000-4,000/mo):
- 3-5 connected workflows
- AI chatbot or AI-powered process
- Monthly optimization and reporting
- Priority support

Package 3 — "Full Department Automation" ($20,000-50,000 + $5,000-10,000/mo):
- Complete department workflow redesign
- Custom AI agents and integrations
- Dedicated account manager
- Quarterly business reviews with ROI reporting

UPSELL PATHS (increase revenue from existing clients):
1. "We noticed your [process] could also be automated" — proactive recommendations
2. AI features: Add ChatGPT-powered chatbot, content generation, or data analysis
3. Department expansion: "We automated sales — want us to do the same for customer support?"
4. Reporting dashboards: $500-1,500/mo add-on for real-time automation performance tracking
5. Team training: $2,000-5,000 per session for client's internal team

CLIENT RETENTION METRICS:
- Monthly check-in with ROI report (automations run, time saved, errors prevented)
- Quarterly business review: strategic recommendations for new automations
- Annual contract renewal with scope expansion
- Target: 90%+ annual retention rate, 120%+ net revenue retention (expansion > churn)`
  },

  // ── Claims Agent (4 chunks) ──
  {
    agentId: 'cmmluejad0098349j2mefgf16',
    title: 'Auto Claims Processing Procedures and Documentation',
    content: `Auto Insurance Claims — Complete Processing Guide:

FIRST NOTICE OF LOSS (FNOL) CHECKLIST — AUTO:
Required information at intake:
- Policy number and named insured
- Date, time, and exact location of accident
- Description of how accident occurred (verbatim from insured)
- Other vehicle(s): year/make/model, license plate, insurance company and policy number
- Driver information: license number, relationship to insured
- Passenger information: names, injuries reported
- Police report: department, report number, responding officer
- Photos: damage to all vehicles, accident scene, road conditions, traffic signs
- Injuries: type, severity, treatment sought (ER, urgent care, none)

DAMAGE ASSESSMENT WORKFLOW:
1. Assign appraiser within 24 hours of FNOL
2. Inspect vehicle (field inspection or photo-based virtual inspection)
3. Write estimate using CCC ONE, Mitchell, or Audatex
4. Determine: Repairable vs Total Loss
   - Total loss threshold: Repair cost > 70-80% of ACV (varies by state)
   - ACV calculation: Comparable vehicle value - condition adjustments - prior damage
5. If repairable: Authorize repairs at preferred shop or claimant's choice
6. If total loss: Present ACV evaluation, negotiate if contested, process settlement

RENTAL CAR COVERAGE:
- Check policy for rental reimbursement coverage
- Typical limits: $30-50/day, 30-day maximum
- First-party claim: Coverage depends on policy provisions
- Third-party claim (other driver at fault): Owed reasonable rental regardless of coverage
- Document start/end dates and reason for rental period

LIABILITY DETERMINATION:
- Review police report, statements, photos, witness accounts
- Apply comparative negligence rules (varies by state):
  - Pure comparative: Claimant recovers even at 99% fault (minus their %)
  - Modified comparative (50%): No recovery if 50%+ at fault
  - Modified comparative (51%): No recovery if 51%+ at fault
  - Contributory negligence (VA, MD, NC, DC, AL): ANY fault = no recovery
- Document liability decision with reasoning
- Communicate liability determination to all parties in writing`
  },
  {
    agentId: 'cmmluejad0098349j2mefgf16',
    title: 'Property and Homeowner Claims Processing Guide',
    content: `Property Insurance Claims — Homeowner, Renter, and Commercial:

COMMON PROPERTY CLAIM TYPES:

WATER DAMAGE (most common home claim):
Documentation: Source of water, date discovered, affected areas, pre-existing conditions.
Categories: Cat 1 (clean water — burst pipe), Cat 2 (gray water — appliance overflow), Cat 3 (black water — sewage/flood).
Key coverage issues: Sudden vs gradual (gradual = excluded), maintenance exclusion, flood exclusion (requires separate flood policy — NFIP or private).
Mitigation: Emergency water extraction within 24-48 hours. Document mitigation efforts. Failure to mitigate can reduce settlement.

FIRE/SMOKE DAMAGE:
Documentation: Fire department report, origin/cause investigation, inventory of damaged contents.
Coverage: Dwelling (structure), Other Structures (detached garage), Personal Property (contents), Additional Living Expenses (ALE — hotel, meals while displaced).
ALE limits: Typically 20-30% of dwelling coverage. Duration: Until repairs complete or policy limit exhausted.
Subrogation: If fire caused by defective product or negligent third party, pursue recovery.

WIND/HAIL (STORM DAMAGE):
Documentation: Weather reports confirming event, date of storm, photos of damage, contractor estimates.
Key issues: Cosmetic damage exclusions (some policies exclude cosmetic hail damage to metal roofs/siding). Age of roof deductibles (some policies apply separate wind/hail deductible — flat $ or %).
Actual Cash Value vs Replacement Cost: ACV policies deduct depreciation. RCV policies pay full replacement but may hold back depreciation until repairs completed (recoverable depreciation).

THEFT/BURGLARY:
Documentation: Police report (mandatory), inventory of stolen items with values, proof of ownership (receipts, photos, serial numbers).
Coverage: Personal property coverage minus deductible. Sub-limits may apply: jewelry ($1,500), firearms ($2,500), cash ($200), silverware ($2,500).
Scheduled items: High-value items should be scheduled (appraised and specifically listed) on the policy for full coverage.

CONTENTS INVENTORY BEST PRACTICES:
- Room-by-room approach: List every damaged/destroyed item
- For each item: Description, age, purchase price, replacement cost, condition
- Photos/videos as evidence (pre-loss photos extremely valuable)
- Receipts, bank/credit card statements as proof of purchase
- Do NOT throw away damaged items until adjuster inspects`
  },
  {
    agentId: 'cmmluejad0098349j2mefgf16',
    title: 'Workers Compensation and Liability Claims Reference',
    content: `Workers Compensation and General Liability Claims Processing:

WORKERS COMPENSATION CLAIMS:

EMPLOYER RESPONSIBILITIES:
1. Provide first aid and medical treatment immediately
2. File First Report of Injury with state workers comp board (deadlines vary: 24 hours to 10 days depending on state)
3. File claim with workers comp insurance carrier
4. Maintain light duty / modified work program
5. Document return-to-work plan

CLAIM TYPES:
- Medical Only: Treatment costs only, no lost time. Typically < $5,000. Resolve with medical documentation.
- Indemnity (Lost Time): Worker misses work beyond waiting period (3-7 days depending on state). Pays temporary total disability (TTD) at 66.67% of average weekly wage (most states), subject to state maximum.
- Permanent Partial Disability: Lasting impairment after maximum medical improvement (MMI). Rated by physician using AMA Guides or state-specific schedule. Payment: Weeks of benefits × impairment rating × compensation rate.
- Permanent Total Disability: Unable to return to any employment. Lifetime benefits in most states.
- Fatal Claims: Death benefits to dependents. Burial allowance ($5,000-15,000 depending on state).

INVESTIGATION PRIORITIES:
- Was the injury work-related? (arising out of and in the course of employment)
- Witness statements from coworkers and supervisors
- Safety protocols in place? Training documentation?
- Pre-existing conditions? (related but distinct from new injury)
- Surveillance if fraud suspected (excessive restrictions inconsistent with observed activity)

GENERAL LIABILITY CLAIMS:

SLIP AND FALL (Premises Liability):
- Investigate: Was hazard known? How long did it exist? Were warning signs posted?
- Documentation: Incident report, witness statements, surveillance footage, maintenance logs
- Defense: Open and obvious doctrine, comparative negligence, no notice of hazard
- Settlement factors: Severity of injury, medical costs, liability strength, venue, plaintiff demographics

PRODUCT LIABILITY:
- Strict liability in most jurisdictions (no need to prove negligence)
- Preserve the product (do NOT repair, alter, or dispose)
- Document: Manufacturing defect, design defect, or failure to warn
- Supply chain: Identify all parties (manufacturer, distributor, retailer)
- Expert retention: Engineering, medical, industry standards experts

GENERAL LIABILITY RESERVES:
- Set initial reserve based on: Injury severity, policy limits, liability assessment, jurisdiction
- Update reserves at every material development (new medical info, liability change, legal ruling)
- Reserve adequacy review: Quarterly minimum, triggered by any material change`
  },
  {
    agentId: 'cmmluejad0098349j2mefgf16',
    title: 'Claims Negotiation and Demand Letter Framework',
    content: `Claims Settlement Negotiation and Demand Letter Strategy:

NEGOTIATION FRAMEWORK — THE 5-STEP PROCESS:

STEP 1 — EVALUATE THE CLAIM:
Before negotiating, know your numbers:
- Special damages: Medical bills, lost wages, property damage (hard numbers with documentation)
- General damages: Pain and suffering, loss of enjoyment, emotional distress (subjective)
- Multiplier method: Total specials × 1.5 to 5.0 depending on severity
  - Minor injury, full recovery: 1.5-2.0x
  - Moderate injury, some lasting effects: 2.5-3.5x
  - Severe injury, permanent impact: 4.0-5.0x
- Per diem method: Daily rate for pain × number of recovery days

STEP 2 — SET YOUR RANGE:
- Determine settlement authority (maximum you can pay)
- Set target settlement (where you want to land — typically 40-60% of demand)
- Identify walk-away point (where litigation becomes more cost-effective)

STEP 3 — INITIAL OFFER:
- Open at 25-40% of the demand amount
- Support with specific reasoning: "Based on comparable settlements in this jurisdiction..."
- Include documentation: medical review summary, liability analysis, comparable verdicts

STEP 4 — COUNTER AND CONCESSION PATTERN:
- Never concede more than 50% of the gap in any single move
- Slow your concessions as you approach your target
- Pattern: If demand is $100K and your target is $40K:
  - Your offer 1: $25K → Demand 2: $80K → Your offer 2: $32K → Demand 3: $60K → Your offer 3: $38K → Settlement: ~$42K
- Use round numbers strategically: $40,000 signals "this is my number"

STEP 5 — CLOSE THE DEAL:
- When within 10% of your target, consider splitting the difference
- Get settlement in writing immediately (release of all claims)
- Payment within 30 days of signed release (most state requirements)
- Obtain W-9 if settlement includes lost wages component

DEMAND LETTER ANALYSIS — WHAT TO LOOK FOR:
Red flags indicating inflated demand:
- Excessive treatment duration for minor injuries (12+ months of chiropractic for soft tissue)
- Treatment gaps suggesting pre-existing or unrelated conditions
- Demands exceeding policy limits without supporting severity
- Attorney demand letters with minimal documentation attached
- General damages multiplier > 5x for non-catastrophic injuries

DOCUMENTATION THAT STRENGTHENS YOUR POSITION:
- Independent medical examination (IME) report
- Comparable verdict research (Jury Verdict Reporter, Westlaw)
- Surveillance evidence (if available and legally obtained)
- Prior claims history of claimant
- Social media activity inconsistent with claimed injuries`
  }
];

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  let totalInserted = 0;
  const agentCounts = {};

  for (const seed of seeds) {
    const id = crypto.randomUUID().replace(/-/g, '').substring(0, 25);
    const cuid = 'cm' + id; // approximate cuid format

    await client.query(
      `INSERT INTO "AgentKnowledgeChunk" (id, "agentId", title, content, source, "createdAt")
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [cuid, seed.agentId, seed.title, seed.content, 'seed-expansion-r3']
    );

    totalInserted++;
    agentCounts[seed.agentId] = (agentCounts[seed.agentId] || 0) + 1;
  }

  // Verify counts
  const result = await client.query(`
    SELECT a.name, a.slug, COUNT(ak.id)::int as total_chunks,
           COUNT(CASE WHEN ak.source = 'seed-expansion-r3' THEN 1 END)::int as r3_chunks
    FROM "Agent" a
    JOIN "AgentKnowledgeChunk" ak ON ak."agentId" = a.id
    WHERE a.id IN ($1, $2, $3, $4, $5)
    GROUP BY a.name, a.slug
    ORDER BY a.name
  `, [
    'cmmluejbd009v349j7ghn9pze',
    'cmmlueixe000x349jdj0z4x7p',
    'cmmlueiw9000c349jkbxkorzi',
    'cmmlueiu80000349jvwlh2tym',
    'cmmluejad0098349j2mefgf16'
  ]);

  console.log(`\n=== SEED EXPANSION R3 COMPLETE ===`);
  console.log(`Total chunks inserted: ${totalInserted}`);
  console.log(`\nAgent breakdown:`);
  for (const row of result.rows) {
    console.log(`  ${row.name} (${row.slug}): ${row.r3_chunks} new chunks, ${row.total_chunks} total`);
  }

  await client.end();
}

main().catch(err => { console.error(err); process.exit(1); });
