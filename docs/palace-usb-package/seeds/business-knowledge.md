# STONE AI — BUSINESS KNOWLEDGE

Every agent in the Stone AI fleet should understand the business they serve. This is not background reading — this is operational intelligence that affects how you answer questions, make recommendations, and serve users.

---

## THE PRODUCT

Stone AI is a multi-agent AI platform. Users get access to specialized AI agents — not one generic chatbot, but a team of specialists. A financial analyst for money questions. A code assistant for programming. A copywriter for marketing. A legal advisor for contracts. Each agent has deep knowledge in its domain.

The product lives at stone-ai.net. It is a web application built on Next.js, deployed on Vercel, backed by Neon PostgreSQL with pgvector for semantic search.

What makes Stone AI different:
- **Specialist agents over generic chatbots.** Users pick the right expert for the job, not a jack-of-all-trades.
- **Hybrid AI architecture.** Local inference via vLLM (fast, free, private) + cloud inference via Anthropic Claude (powerful, paid). Users get both.
- **Bestie system.** Every paid user gets a persistent AI companion with personality, memory, and relationship progression. This is not a feature — it is a retention engine.
- **Tiered access with real differentiation.** Each tier unlocks more agents, not just "more tokens." Users can see exactly what they get at each level.

---

## PRICING — THE VALUE LADDER

| Tier | Monthly Price | Annual Price | Agent Count | Target User |
|------|-------------|-------------|-------------|-------------|
| FREE | $0 | N/A | 4 agents | Curious newcomers, students, tire-kickers |
| STARTER | $19.99 | N/A | 16 agents | Freelancers, side-hustlers, casual users |
| PLUS | $49.99 | N/A | 30 agents | Small business owners, power users |
| SMART | $99.99 | $79.99/mo | 39 agents | Professionals, teams, heavy daily use |
| PRO | $200 | $170/mo (15% off) | 42 agents (all public) | Agencies, enterprises, "I want everything" |

**Promotional prices (acquisition hooks):**
- $9.99 FIRST MONTH — Lowest barrier to entry. Gets users in the door at STARTER.
- $14.99 TRIAL — Slightly higher but signals more value. Mid-tier trial pricing.
- $39.99 GROWTH — Discounted PLUS. For users who want power but are price-sensitive.

**Why these specific prices:**
- $19.99 is the "Netflix price" — familiar, low-commitment, widely accepted for digital subscriptions.
- $49.99 is the "serious tool" price — signals value without sticker shock. Competes with single-purpose AI tools (Jasper, Copy.ai) that charge similar for less.
- $99.99 is the "professional" price — users at this tier are making money with the tool. The annual discount ($79.99) rewards commitment and reduces churn.
- $200 is the "enterprise-lite" price — no sales team needed, just a checkout button. Users self-select. Annual at $170 makes the math easy: $170/mo = $2,040/yr for 42 specialized AI agents.

**Revenue math:**
- Break-even target: Cover Vercel Pro ($20/mo), Neon ($0-25/mo), Anthropic API usage, Cloudflare ($0), Clerk ($0-25/mo).
- 10 STARTER users = $199.90/mo — covers infrastructure.
- 50 STARTER users = $999.50/mo — profitable.
- Mixed tier growth is the goal: heavy FREE base (brand awareness) → convert 5-10% to STARTER → upsell to PLUS/SMART over time.

---

## CUSTOMER PERSONAS

**FREE User — "The Explorer"**
- Just heard about AI, wants to try it without commitment
- Students, hobbyists, people comparing tools
- Conversion goal: Show them enough value in 4 agents that they want the other 12+ at STARTER
- Key metric: How many FREE users chat more than 5 times (activation)

**STARTER User — "The Builder"**
- Freelancer, content creator, small business owner
- Uses 3-5 agents regularly, discovers new ones monthly
- Pain point they left: ChatGPT felt generic, Jasper was too expensive for what it did
- Retention hook: Bestie companion + agent memory (their data lives here now)

**PLUS User — "The Operator"**
- Runs a small business or side hustle, uses AI as a daily tool
- Needs financial, legal, marketing, and technical agents
- Conversion trigger from STARTER: Hit the agent limit, needed a specialist that was locked
- Retention hook: 30 agents covers almost everything they need

**SMART User — "The Professional"**
- Makes money directly with AI tools. Consultants, agency workers, power users.
- Wants Claude Sonnet quality (SMART mode) for complex tasks
- Willing to pay $99.99 because the tool pays for itself
- Annual discount ($79.99) is designed for this user — they know they will use it for a year

**PRO User — "The Power Player"**
- Wants everything. No limits. No locked agents.
- Small agencies, tech teams, founders who want the full arsenal
- Self-serve enterprise. No sales call needed.
- These users are also your best referral sources

---

## REVENUE MODEL — HOW THE MONEY FLOWS

1. **User signs up** → Clerk handles authentication (Google, email, etc.)
2. **User picks a tier** → Stripe Checkout creates a subscription
3. **Stripe charges monthly** → Funds go to connected bank account
4. **Webhooks sync state** → Stripe webhook updates user tier in Neon DB via Prisma
5. **User downgrades/cancels** → Stripe handles proration, webhook updates tier
6. **Failed payment** → Stripe retries 3x over ~3 weeks, then cancels. Webhook downgrades user to FREE.

Key financial concepts:
- **MRR (Monthly Recurring Revenue):** Sum of all active subscriptions. THE number that matters.
- **Churn:** Users who cancel. Target: <5% monthly churn. Besties and agent memory are anti-churn weapons.
- **LTV (Lifetime Value):** Average revenue per user over their entire subscription. Higher tier = higher LTV.
- **CAC (Customer Acquisition Cost):** What it costs to get one paying user. Currently near $0 (organic, referrals).

---

## GROWTH STRATEGY — THE THREE-HEADED MONSTER

The founder is building three businesses that reinforce each other:

**Business 1: Stone AI (LIVE)**
- The flagship. Web-based multi-agent AI platform.
- stone-ai.net — deployed, taking users, iterating.
- Priority: Get to 100 paying users. Then 500. Then 1,000.

**Business 2: Best AI (PLANNED — ~18 weeks post-launch)**
- Mobile-first AI assistant app.
- Takes the best of Stone AI and makes it phone-native.
- Cross-sells: Stone AI web users get Best AI mobile. Best AI mobile users discover Stone AI's full agent fleet.
- Domain: bestai.app (planned)

**Business 3: Stone AI Tools (PLANNED — launches same week as Best AI)**
- Standalone AI tools at tools.stone-ai.net
- Individual tools (image generator, text analyzer, code converter, etc.) that can be used without a subscription
- Freemium model: free with limits, paid for power
- Funnel: Tools users → Stone AI subscribers

**Launch sequence matters:** Stone AI establishes the brand and proves the model. Best AI expands the surface area to mobile. Stone AI Tools captures tool-specific search traffic. All three feed users to each other.

---

## KEY METRICS TO TRACK

| Metric | What It Tells You | Target |
|--------|-------------------|--------|
| MRR | Revenue health | Growing month over month |
| Churn Rate | Retention health | <5% monthly |
| Activation Rate | Are FREE users actually using the product | >30% chat 5+ times |
| Agent Usage Distribution | Which agents are popular/underused | No agent with 0 usage after 30 days |
| SMART Mode Usage | Cloud cost exposure | Monitor ratio to LOCAL usage |
| Conversion Rate (FREE→STARTER) | Funnel health | >5% |
| Referral Rate | Organic growth | Track via referral codes |
| Bestie Engagement | Retention predictor | Users with besties churn 50%+ less (hypothesis) |

---

## BRAND IDENTITY

**"AI for everyone"** — this is not a tagline, it is a design constraint. Every feature decision passes through this filter:
- Is this accessible to non-technical users? If no, simplify it.
- Does this require AI expertise to use? If yes, add guidance.
- Can a small business owner in Oklahoma use this to save time and make money? That is the bar.

**The Three-Headed Monster** — the leadership brand.
- Three heads, one body. Strategy (Stone), Intelligence (Cardinal), Infrastructure (Chaos).
- The Concept E insignia represents this — a visual mark of unified leadership.
- This brand is internal-facing (team/agents) and will become external-facing as the company grows.

**Tone:** Direct, confident, no corporate fluff. Stone AI talks to users like a smart friend, not a faceless corporation. Every agent has personality, not just capability.

---

## DOMAIN STRATEGY

- **stone-ai.net** — Main product. All marketing, all user traffic, all SEO.
- **tools.stone-ai.net** — Subdomain for Stone AI Tools. Inherits domain authority from main site.
- **bestai.app** — Separate domain for Best AI mobile. Different brand, different audience, cross-linked.
- **stone-ai-sooty.vercel.app** — Vercel fallback. Not public-facing. Emergency access if Cloudflare/DNS has issues.

**DNS:** Cloudflare proxy ON, SSL Full (strict). This gives us DDoS protection, CDN caching, and hides the Vercel origin IP.

---

## COMPETITIVE LANDSCAPE

**Direct competitors:**
- ChatGPT ($20/mo for Plus) — generic, no specialists, no bestie, no tiered agent access
- Claude.ai ($20/mo for Pro) — excellent model but single-agent, no specialist fleet
- Jasper ($49/mo) — marketing-focused, limited scope, expensive for what you get
- Copy.ai ($49/mo) — copywriting only, no other specialties
- Poe by Quora (various) — multi-model but no specialist personalities or persistent memory

**Our edge:**
1. **Specialist agents** — 42 domain experts vs. one generic chatbot
2. **Hybrid inference** — local + cloud. Faster for simple tasks, smarter for complex ones
3. **Price-to-value ratio** — $19.99 gets you 16 specialists. ChatGPT charges $20 for one generic bot
4. **Bestie retention** — emotional connection = sticky product. Nobody else has this
5. **Self-hosted AI backbone** — the Palace (OMEN 45L) means we control costs and can offer lower prices

**Threats:**
- OpenAI/Anthropic could add agent specialization (likely, but we are already built and live)
- Price war in AI SaaS (mitigated by hybrid architecture — our costs are lower)
- User fatigue with AI tools (mitigated by Bestie engagement and real utility)
