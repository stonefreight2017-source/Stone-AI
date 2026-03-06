/**
 * Knowledge seeds for Platform Onboarding Concierge and Digital Marketing Strategist.
 * Run with: npx tsx scripts/seed-knowledge.ts (or integrate into seed-agents.ts)
 *
 * Generated 2026-03-06 — verified, practical, expert-level content.
 */

export const ONBOARDING_SEEDS = [
  {
    agentSlug: "platform-onboarding-concierge",
    title: "Stone AI Platform Architecture Overview",
    content: `Stone AI is a full-stack SaaS platform built on Next.js 16 with the App Router, TypeScript, Tailwind CSS, and shadcn/ui components. The application is deployed on Vercel with a Neon PostgreSQL database (project: holy-lake-88840425) that includes pgvector for embedding-based search.

Authentication is handled by Clerk, which manages user sessions, sign-up/sign-in flows, and organization membership. Clerk middleware protects all /app/* routes and exposes the userId via auth() in server components and API routes. The platform currently runs in Clerk development mode with plans to switch to production keys (pk_live_, sk_live_) before full launch.

Billing uses Stripe in test mode with 5 subscription tiers: FREE ($0), STARTER ($19.99/mo), PLUS ($49.99/mo), SMART ($99.99/mo), and PRO ($200/mo). Each tier is available in three billing periods — monthly, 6-month (10% discount), and annual (20% discount) — except Reseller and Enterprise which are yearly only at 5% off. Stripe webhooks at /api/stripe/webhook handle subscription lifecycle events including creation, updates, cancellations, and payment failures.

The platform hosts 43 AI agents (42 user-facing plus 1 internal Stone agent) organized by tier: FREE gets 4 agents, PLUS gets 13, SMART gets 22, and PRO gets 4 exclusive agents. Each agent has a slug, system prompt, knowledge seeds, and analytics tracking. The cross-referral system allows agents to recommend other agents when a query falls outside their domain.

The Bestie companion feature is a personal AI companion with persistent memory, warm-themed UI, and ICF/NBHWC coaching ethics guardrails. Besties are tier-gated: FREE and STARTER get 1 each, PLUS gets 2, SMART gets 3, and PRO gets 5. BestieProfile stores personality, tone, and memory configuration.

The data layer uses Prisma 7.4 as the ORM with models for User, Agent, Conversation, Message, AgentKnowledgeChunk, BestieProfile, Subscription, and more. The AgentKnowledgeChunk table stores embeddings generated via pgvector for semantic search during agent conversations. Redis (running as a Windows service on port 6379) handles rate limiting and session caching.

Key directories: /src/app for pages and layouts, /src/app/api for API routes, /src/lib for shared utilities (db.ts, stripe.ts, clerk.ts), /src/components for UI components, and /prisma for schema and migrations.`,
    source: "Stone Intelligence Research",
  },
  {
    agentSlug: "platform-onboarding-concierge",
    title: "Troubleshooting Common Deployment Issues",
    content: `This guide covers the most frequent deployment problems encountered when running Stone AI on Vercel with Cloudflare DNS and Clerk authentication.

**500 Errors from proxy.ts**: The most common production error originates in the AI proxy route (/api/chat/proxy.ts or similar). Root causes include: (1) missing or expired OPENAI_API_KEY environment variable in Vercel — verify in Settings > Environment Variables; (2) the vLLM local endpoint is unreachable from Vercel's edge network — ensure the cloud fallback to GPT-4o is properly configured; (3) request body exceeding Vercel's 4.5MB serverless function limit — implement streaming responses with ReadableStream. Debug by checking Vercel Function Logs under the Deployments tab.

**Clerk dev-browser-missing Error**: This appears when Clerk's development mode token cookie is absent. Causes: (1) accessing the production URL while Clerk is still in dev mode — dev keys only work on localhost; (2) browser extensions stripping cookies — test in incognito; (3) middleware misconfiguration — ensure clerkMiddleware() is in middleware.ts at the project root, not inside /src. Fix: switch to Clerk production keys or add the deployment URL to Clerk's allowed origins in the dashboard.

**Cloudflare Proxy Conflicts**: When Cloudflare's orange-cloud proxy is enabled for Vercel-hosted domains, several issues arise: (1) SSL certificate conflicts — Cloudflare issues its own cert which can clash with Vercel's; set SSL mode to "Full (Strict)" in Cloudflare; (2) redirect loops — disable Cloudflare's "Always Use HTTPS" if Vercel already forces HTTPS; (3) WebSocket connections for streaming chat may be interrupted — create a Page Rule to bypass Cloudflare caching for /api/* routes. For DNS records, CNAME to cname.vercel-dns.com with proxy enabled.

**Vercel Build Failures**: Common causes: (1) TypeScript strict mode catching errors ignored locally — run 'npx tsc --noEmit' before pushing; (2) missing environment variables at build time — Prisma generate needs DATABASE_URL during build, add it to Vercel env vars; (3) dependency version mismatches — delete node_modules and package-lock.json, reinstall, and commit the fresh lockfile. Check Vercel build logs for the exact failing step.

**DNS Propagation Delays**: After updating Cloudflare DNS records, changes can take 1-48 hours globally. Use 'dig stone-ai.net +trace' or dnschecker.org to verify propagation. If your ISP caches stale records, flush local DNS with 'ipconfig /flushdns' on Windows or switch to 1.1.1.1/8.8.8.8 as your DNS resolver. Cloudflare's TTL is typically 300 seconds for proxied records and respects the set TTL for DNS-only (gray cloud) records.`,
    source: "Stone Intelligence Research",
  },
  {
    agentSlug: "platform-onboarding-concierge",
    title: "Setting Up Local Development Environment",
    content: `This guide walks through setting up Stone AI for local development on Windows with all required services.

**Prerequisites**: Install Node.js 20+ (LTS recommended — verify with 'node -v'), Git, and Docker Desktop for Windows. Ensure WSL2 is enabled if using Docker's Linux containers.

**Step 1 — Clone and Install**:
Clone the repository from GitHub (stonefreight2017-source/Stone-AI). Run 'npm install' in the project root. If you encounter native module errors (e.g., bcrypt, sharp), ensure you have Windows Build Tools: 'npm install --global windows-build-tools' or install Visual Studio Build Tools with the C++ workload.

**Step 2 — PostgreSQL via Docker**:
Run a PostgreSQL 16 container with pgvector: 'docker run -d --name stoneai-db -e POSTGRES_USER=stoneai -e POSTGRES_PASSWORD=<password> -e POSTGRES_DB=stoneai -p 5432:5432 pgvector/pgvector:pg16'. Verify connectivity: 'psql -h localhost -U stoneai -d stoneai'. The production database is on Neon (holy-lake-88840425) but local dev should use this Docker instance to avoid polluting production data.

**Step 3 — Redis**:
Redis runs as a Windows service on port 6379. Verify it's running: 'redis-cli ping' should return PONG. If not installed, download Redis 3.0.504 for Windows from the MSI archive or use Docker: 'docker run -d --name redis -p 6379:6379 redis:7-alpine'. Redis handles rate limiting and caching in the application.

**Step 4 — Environment Variables**:
Copy '.env.example' to '.env' and configure: DATABASE_URL=postgresql://stoneai:<password>@localhost:5432/stoneai, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... (from Clerk dashboard, Development instance), CLERK_SECRET_KEY=sk_test_..., STRIPE_SECRET_KEY=sk_test_... (test mode), STRIPE_WEBHOOK_SECRET=whsec_... (from Stripe CLI or dashboard), OPENAI_API_KEY=sk-... (for GPT-4o cloud fallback), REDIS_URL=redis://localhost:6379, NEXT_PUBLIC_APP_URL=http://localhost:3000.

**Step 5 — Database Setup**:
Run 'npx prisma generate' to create the Prisma client, then 'npx prisma db push' to sync the schema (or 'npx prisma migrate dev' for migration history). Seed the database: 'npx tsx scripts/seed-agents.ts' to populate all 43 agents and their knowledge chunks.

**Step 6 — Stripe CLI for Webhooks**:
Install the Stripe CLI, login with 'stripe login', then forward webhooks: 'stripe listen --forward-to localhost:3000/api/stripe/webhook'. Copy the webhook signing secret (whsec_...) to your .env.

**Step 7 — Run the Dev Server**:
'npm run dev' starts Next.js on localhost:3000. Verify: homepage loads, Clerk sign-in works, agent list populates, and chat streaming functions. Use 'npx prisma studio' to inspect database records visually at localhost:5555.`,
    source: "Stone Intelligence Research",
  },
  {
    agentSlug: "platform-onboarding-concierge",
    title: "Stripe Billing Integration Walkthrough",
    content: `Stone AI uses Stripe for subscription billing with 5 tiers across multiple billing periods. This guide covers the complete integration architecture.

**Product and Price Structure**:
Each tier (FREE, STARTER, PLUS, SMART, PRO) has prices for monthly, 6-month, and annual billing. Monthly prices are base rates; 6-month gets 10% off and annual gets 20% off. This creates 12 active price objects in Stripe (FREE has no paid price). A 15% coupon is also configured for promotional use. In test mode, use card number 4242 4242 4242 4242 with any future expiry and any CVC.

**Subscription Creation Flow**:
1. User selects a tier and billing period on the /app/billing page.
2. Frontend calls POST /api/stripe/checkout with { priceId, billingPeriod }.
3. The API route creates a Stripe Checkout Session with mode: 'subscription', the selected price, and metadata linking the Clerk userId.
4. User is redirected to Stripe's hosted checkout page.
5. On success, Stripe redirects to /app/billing?success=true.
6. The checkout.session.completed webhook fires and the backend creates/updates the user's Subscription record in the database with the Stripe subscription ID, tier, and period end date.

**Webhook Handling** (/api/stripe/webhook):
The endpoint verifies the webhook signature using STRIPE_WEBHOOK_SECRET (whsec_7Zk...). Critical events handled: checkout.session.completed (new subscription), customer.subscription.updated (plan changes, renewals), customer.subscription.deleted (cancellation), invoice.payment_failed (payment issues). Each handler updates the local Subscription model and may trigger email notifications. The webhook endpoint ID is we_1T7aq... and the URL is https://stone-ai.net/api/stripe/webhook.

**Tier Upgrades and Downgrades**:
Upgrades are immediate — Stripe prorates the remaining time on the current period and charges the difference. The API calls stripe.subscriptions.update() with the new priceId and proration_behavior: 'create_prorations'. Downgrades take effect at period end — set proration_behavior: 'none' and update the subscription with cancel_at_period_end logic, then create the new subscription starting at the current period's end.

**Test vs Live Mode Switching**:
When ready for production: (1) Create all products/prices in Stripe live mode (matching the test mode structure exactly); (2) Update STRIPE_SECRET_KEY to sk_live_...; (3) Update NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to pk_live_...; (4) Create a new webhook endpoint in live mode pointing to stone-ai.net/api/stripe/webhook and update STRIPE_WEBHOOK_SECRET; (5) Update all priceId references in the codebase or config. Never mix test and live keys — Stripe will reject cross-mode API calls.

**Coupon and Promotion Codes**:
The 15% coupon is configured in Stripe and can be applied during checkout by passing discounts: [{ coupon: 'COUPON_ID' }] to the Checkout Session. Promotion codes (user-facing coupon codes) can be enabled with allow_promotion_codes: true on the session.`,
    source: "Stone Intelligence Research",
  },
  {
    agentSlug: "platform-onboarding-concierge",
    title: "Agent Knowledge System Architecture",
    content: `Stone AI's agent knowledge system provides each of the 43 agents with domain-specific information stored as vector embeddings for semantic retrieval during conversations.

**Database Schema**:
The AgentKnowledgeChunk table (Prisma model) stores knowledge entries with fields: id (UUID), agentId (FK to Agent), title (string), content (text, 300-600 words per chunk), source (string, e.g., "seed" or "Stone Intelligence Research"), embedding (vector(1536) via pgvector), createdAt, and updatedAt. The embedding column uses the pgvector extension and stores OpenAI text-embedding-ada-002 (or equivalent) 1536-dimensional vectors.

**Seed Generation**:
Knowledge seeds are authored as TypeScript arrays with { title, content, source } objects. Each agent has 8-14 seeds covering its domain expertise. Seeds are loaded during database seeding via 'npx tsx scripts/seed-agents.ts', which iterates over AGENT_DEFINITIONS and creates AgentKnowledgeChunk records for agents with zero existing chunks. The source field is set to "seed" for initial seeds and "Stone Intelligence Research" for generated content.

**Embedding Generation**:
When a knowledge chunk is created or updated, an embedding is generated by calling the OpenAI embeddings API (model: text-embedding-ada-002) with the chunk's content. The resulting 1536-float vector is stored in the embedding column. For batch operations, embeddings can be generated in parallel with rate limiting to stay within API quotas.

**Retrieval During Conversations**:
When a user sends a message to an agent, the system: (1) generates an embedding of the user's query; (2) performs a cosine similarity search against the agent's knowledge chunks using pgvector's <=> operator; (3) retrieves the top 3-5 most relevant chunks; (4) injects them into the system prompt as context before the LLM generates a response. The SQL looks like: SELECT title, content FROM "AgentKnowledgeChunk" WHERE "agentId" = $1 ORDER BY embedding <=> $2 LIMIT 5.

**Per-Agent Analytics**:
The admin dashboard tracks per-agent usage metrics including: total conversations, 7-day and 30-day conversation counts, unique user counts, and trend indicators (increasing/decreasing/stable). These metrics are computed from the Conversation and Message tables and displayed in the /app/admin agents section.

**Cross-Referral System**:
Agents can recommend other agents when a query falls outside their expertise. Each agent definition includes a capabilities array describing its strengths. When the LLM detects an out-of-scope query, it references the capabilities of all agents and suggests the most appropriate alternative. For example, the Digital Marketing Strategist might refer a user to the SEO Specialist for technical SEO questions. This is implemented as a prompt instruction rather than hard-coded rules, allowing flexible routing.

**Adding New Knowledge**:
To add knowledge to an existing agent: (1) create seed objects in a seeds file; (2) run a script that inserts them into AgentKnowledgeChunk; (3) generate embeddings for the new chunks. The system checks for existing chunks to avoid duplicates — it only seeds agents with zero existing knowledge entries.`,
    source: "Stone Intelligence Research",
  },
  {
    agentSlug: "platform-onboarding-concierge",
    title: "Bestie Companion Feature Guide",
    content: `The Bestie companion is Stone AI's personal AI companion feature, offering users a persistent, emotionally intelligent conversational partner with professional coaching ethics built in.

**BestieProfile Model**:
Each Bestie is stored as a BestieProfile record with fields: id, userId (FK to Clerk user), name, personality (JSON object describing traits, tone, communication style), avatar (URL or identifier), memoryConfig (JSON for persistence settings), createdAt, and updatedAt. The personality field stores structured attributes selected during creation — warmth level, humor style, directness, areas of focus, and conversational approach.

**CRUD API** (/api/bestie/*):
POST /api/bestie — creates a new BestieProfile, enforcing tier limits (FREE: 1, STARTER: 1, PLUS: 2, SMART: 3, PRO: 5). Returns 403 if the user has reached their tier's cap. GET /api/bestie — lists all Besties for the authenticated user. GET /api/bestie/[id] — retrieves a specific Bestie with its profile and recent conversation history. PATCH /api/bestie/[id] — updates personality or name. DELETE /api/bestie/[id] — soft-deletes the Bestie and archives conversation data.

**Three-Step Creator** (/app/bestie/create):
Step 1 (Name & Avatar): User names their Bestie and selects a visual representation. Step 2 (Personality): User picks traits from a curated attribute set — communication style (direct, gentle, playful), emotional approach (empathetic, analytical, motivational), and focus areas (career, wellness, creativity, relationships, personal growth). Step 3 (Review & Launch): Summary screen showing the configured Bestie before creation. The warm-themed UI uses amber/gold accent colors distinct from the main app's design.

**Streaming Chat** (/app/bestie/[id]/chat):
Chat uses server-sent events (SSE) for real-time streaming responses. The system prompt incorporates the BestieProfile's personality configuration, recent conversation memory, and safety guardrails. Messages are stored in the database for persistence across sessions, giving the Bestie long-term memory of past conversations.

**Safety Standards (Inviolable)**:
The Bestie system enforces non-negotiable safety standards: (1) Anti-dependency protocol — the Bestie periodically encourages real-world connections and professional help when appropriate; (2) Crisis detection — messages indicating self-harm, abuse, or emergency trigger an immediate response with hotline numbers and a recommendation to contact professionals; (3) No medical/legal/financial advice — the Bestie clearly states it cannot replace licensed professionals; (4) Boundary enforcement — the Bestie will not engage in romantic or sexual conversation.

**ICF/NBHWC Coaching Ethics**:
The Bestie follows International Coaching Federation and National Board for Health & Wellness Coaching ethical guidelines: client autonomy (never tells users what to do, asks powerful questions instead), confidentiality awareness (reminds users that conversations are stored digitally), scope of practice (refers to professionals for clinical issues), and cultural sensitivity. The litigation shield includes disclaimers in the UI that the Bestie is an AI companion, not a licensed therapist or counselor.

**Monitoring**:
The /api/admin/health endpoint tracks Bestie metrics: total active Besties, creation rate, average conversations per Bestie, and scaling alerts when resource usage approaches limits. This helps the admin team anticipate infrastructure needs as the feature scales.`,
    source: "Stone Intelligence Research",
  },
  {
    agentSlug: "platform-onboarding-concierge",
    title: "Security Configuration Guide",
    content: `Stone AI implements enterprise-grade security across multiple layers. This guide covers each security mechanism and its configuration.

**Content Security Policy (CSP) Headers**:
CSP is configured in next.config.js (or middleware.ts) to prevent XSS and data injection attacks. Key directives: default-src 'self'; script-src 'self' 'unsafe-inline' https://clerk.stone-ai.net https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://img.clerk.com; connect-src 'self' https://api.clerk.com https://api.stripe.com https://api.openai.com; frame-src https://js.stripe.com. The 'unsafe-inline' for scripts is required by Next.js hydration but should be replaced with nonces in production for maximum security.

**CORS Configuration**:
API routes set Access-Control-Allow-Origin to the specific domain (https://stone-ai.net) rather than wildcard (*). Preflight OPTIONS requests are handled explicitly. The middleware checks the Origin header and rejects requests from unauthorized domains. For development, localhost:3000 is also allowed.

**Redis Rate Limiting**:
Rate limiting uses Redis (localhost:6379) with a sliding window algorithm. Configuration per endpoint: /api/chat/* — 30 requests per minute per user (prevents LLM abuse); /api/stripe/* — 10 requests per minute; /api/forum/* — 20 requests per minute for posts, 60 for reads; /api/bestie/* — 20 requests per minute. The implementation stores request timestamps as sorted sets in Redis with keys like ratelimit:{userId}:{endpoint}. When the limit is exceeded, the API returns 429 Too Many Requests with a Retry-After header.

**AES-256-GCM Encryption**:
Sensitive data at rest (API keys, user preferences with PII, Bestie conversation memory) is encrypted using AES-256-GCM. The encryption key is stored as an environment variable (ENCRYPTION_KEY), never in code. Each encrypted value stores the IV (initialization vector) prepended to the ciphertext, ensuring unique encryption even for identical plaintext. The implementation uses Node.js crypto module: crypto.createCipheriv('aes-256-gcm', key, iv).

**Audit Logging**:
Critical actions are logged to an audit table: admin access, subscription changes, agent configuration modifications, failed authentication attempts, and rate limit violations. Each log entry includes: timestamp, userId, action, resource, IP address, and user agent. The admin dashboard at /app/admin displays recent audit events. Logs are retained for 90 days by default.

**Input Sanitization**:
All user inputs are sanitized before database storage and LLM submission. HTML is stripped using a whitelist approach (DOMPurify or similar). SQL injection is prevented by Prisma's parameterized queries. Prompt injection is mitigated by separating user input from system prompts with clear delimiters and instructing the LLM to treat user messages as data, not instructions. Forum posts go through additional Markdown sanitization.

**Admin Access Control**:
The /app/admin section is protected by a role check — only users with isAdmin: true in the database can access admin routes. The canAccessAgent() utility function verifies tier-based agent access, preventing users from accessing agents above their subscription tier. The internal Stone agent is completely hidden from non-admin users.`,
    source: "Stone Intelligence Research",
  },
  {
    agentSlug: "platform-onboarding-concierge",
    title: "DNS and Domain Management Guide",
    content: `Stone AI uses Cloudflare for DNS management with Vercel as the hosting platform. This guide covers the complete domain setup and common troubleshooting scenarios.

**Cloudflare Nameserver Configuration**:
The domain stone-ai.net is registered with nameservers pointing to Cloudflare (zone ID: 21039435df68787ce74e19adba6742be). Cloudflare provides DDoS protection, CDN caching, and SSL termination. The nameservers were assigned during Cloudflare onboarding and must remain unchanged at the registrar for Cloudflare DNS to function.

**DNS Records for Vercel**:
Primary records: (1) stone-ai.net — CNAME to cname.vercel-dns.com (proxied, orange cloud); (2) www.stone-ai.net — CNAME to cname.vercel-dns.com (proxied); (3) app.stone-ai.net — CNAME to cname.vercel-dns.com (proxied). For subdomains planned but not yet active: tools.stone-ai.net, api.stone-ai.net, blog.stone-ai.net — these will also CNAME to Vercel when deployed. Each subdomain must also be added as a custom domain in the Vercel project settings.

**Vercel Custom Domain Setup**:
In the Vercel dashboard: Settings > Domains > Add Domain. Add both stone-ai.net and www.stone-ai.net. Vercel automatically provisions SSL certificates via Let's Encrypt. The primary domain should be stone-ai.net with www redirecting to it (or vice versa — configure the redirect in Vercel). Vercel verifies domain ownership via the CNAME record.

**SSL Certificate Configuration**:
With Cloudflare proxy enabled, there are two SSL connections: browser-to-Cloudflare and Cloudflare-to-Vercel. Set Cloudflare SSL mode to "Full (Strict)" — this ensures Cloudflare validates Vercel's certificate. "Flexible" mode causes redirect loops because Vercel forces HTTPS but Cloudflare connects via HTTP. Always use Full (Strict) with Vercel.

**Proxy Mode Effects**:
Orange cloud (proxied): Traffic routes through Cloudflare's network, enabling CDN caching, DDoS protection, and WAF rules. However, it hides the origin IP (Vercel) and can interfere with WebSocket connections used by streaming chat. Gray cloud (DNS only): Traffic goes directly to Vercel, bypassing Cloudflare's security features but avoiding potential compatibility issues. Recommendation: Use orange cloud for static pages and gray cloud for API/WebSocket endpoints if streaming issues arise.

**ISP Blocking Workarounds**:
Some ISPs block or filter traffic to certain domains, especially newly registered ones. Symptoms: site loads on mobile data but not home WiFi. Solutions: (1) Change DNS resolver to 1.1.1.1 (Cloudflare) or 8.8.8.8 (Google) — 'netsh interface ip set dns "Ethernet" static 1.1.1.1' on Windows; (2) Flush DNS cache: 'ipconfig /flushdns'; (3) Check if the domain is on any blocklists using mxtoolbox.com; (4) Contact ISP if the block persists. Cloudflare's proxy helps here since the actual traffic routes through Cloudflare's IP ranges, which ISPs are unlikely to block.

**Propagation Verification**:
After DNS changes, verify propagation: (1) 'nslookup stone-ai.net 1.1.1.1' for Cloudflare DNS; (2) 'nslookup stone-ai.net 8.8.8.8' for Google DNS; (3) dnschecker.org for global propagation status; (4) 'curl -I https://stone-ai.net' to check response headers. Cloudflare proxied records propagate within minutes; non-proxied records follow TTL settings (default 3600 seconds). Vercel domain verification may take up to 24 hours in rare cases.`,
    source: "Stone Intelligence Research",
  },
];

export const MARKETING_SEEDS = [
  {
    agentSlug: "digital-marketing-strategist",
    title: "SaaS Landing Page Optimization",
    content: `A high-converting SaaS landing page follows a proven structure that guides visitors from awareness to action. Every element must reduce friction and increase trust.

**Hero Section**:
The hero is your 5-second pitch. Structure: headline (value proposition, not feature list — "Build your AI team in minutes" beats "43 AI agents for business"), subheadline (how it works or who it's for), primary CTA button (high-contrast color, action verb — "Start Free" not "Submit"), and a product screenshot or demo video. Above the fold, never below. The headline should pass the "so what?" test — if a stranger reads it, they should immediately understand the benefit.

**Social Proof Placement**:
Place social proof immediately after the hero — logo bars ("Trusted by teams at..."), testimonial cards with real names and photos, aggregate stats ("10,000+ agents deployed"), or review badges. Social proof reduces perceived risk. For early-stage SaaS without big logos, use: number of users, beta tester quotes, or expert endorsements. Rotate testimonials that address different objections (cost, complexity, trust).

**Pricing Table Design**:
Display 3-4 tiers in columns with the recommended plan visually highlighted (slightly larger, different background, "Most Popular" badge). Each tier needs: plan name, price with billing period, 5-7 key features with checkmarks, and a CTA button. Use feature comparison tables below for detailed differences. Annual pricing should show the monthly equivalent with savings highlighted ("$49.99/mo — Save 20%"). Always include a free tier or trial to reduce commitment anxiety.

**CTA Strategy**:
Primary CTAs appear in the hero, after the pricing table, and in a sticky header/footer. Use consistent copy ("Start Free" everywhere, not different phrases). Secondary CTAs like "Watch Demo" or "See Pricing" should be lower-contrast. The CTA button color should appear nowhere else on the page — it needs to be the most visually distinct element. Add urgency only when authentic (limited beta spots, launch pricing expiring).

**A/B Testing Framework**:
Test one element at a time with sufficient traffic (minimum 1,000 visitors per variant for statistical significance). Priority order for testing: (1) headline copy, (2) CTA button text and color, (3) hero image vs. video, (4) pricing presentation, (5) social proof placement. Use tools like Vercel's built-in Edge Config for server-side A/B tests, or client-side tools like PostHog. Run tests for at least 2 weeks to account for day-of-week variance.

**Conversion Funnel Architecture**:
Map the full funnel: Landing Page > Sign Up (Clerk) > Onboarding Wizard > First Agent Chat > Subscription. Track drop-off at each stage using analytics events. The onboarding wizard (Stone AI's 5-step flow: welcome, goals, agent recommendations, bestie creation, launch) is critical — users who complete onboarding convert to paid at 3-5x the rate of those who skip it. Optimize each step independently.`,
    source: "Stone Intelligence Research",
  },
  {
    agentSlug: "digital-marketing-strategist",
    title: "SEO for AI SaaS Products",
    content: `SEO for AI SaaS requires a strategy that targets both informational and transactional intent, building authority in a competitive and rapidly evolving market.

**Technical SEO Checklist**:
(1) Ensure all pages return proper status codes — 200 for content, 301 for permanent redirects, 404 for missing pages (never soft 404s). (2) Generate a dynamic sitemap.xml at /sitemap.xml using Next.js route handlers — include all public pages, agent listings, and blog posts. (3) Create robots.txt allowing Googlebot access to public pages while blocking /app/*, /api/*, and authenticated routes. (4) Implement canonical URLs on every page to prevent duplicate content. (5) Page speed: target Core Web Vitals — LCP under 2.5s, FID under 100ms, CLS under 0.1. Next.js Image component and dynamic imports help. (6) Mobile-first responsive design — Google indexes mobile version first.

**Meta Tags and Structured Data**:
Every page needs unique title (50-60 chars), meta description (150-160 chars), and Open Graph tags (og:title, og:description, og:image for social sharing). For agent pages, use structured data (JSON-LD) with SoftwareApplication schema: name, description, offers (pricing), applicationCategory ("BusinessApplication"), and aggregateRating when available. The homepage should use Organization schema. Blog posts use Article schema with author, datePublished, and dateModified.

**Keyword Strategy for AI Tools**:
Target three keyword tiers: (1) High-intent transactional — "AI business assistant," "AI marketing agent," "AI writing tool for teams" (competitive but high conversion); (2) Informational mid-funnel — "how to use AI for small business," "AI vs human customer support," "best AI tools for startups" (build authority); (3) Long-tail specific — "AI agent that writes business plans," "AI companion for personal coaching," "AI tool for pricing strategy" (lower volume, higher conversion). Use Google Search Console and tools like Ahrefs or SEMrush to identify keywords where you already rank 5-20 and optimize those pages first.

**Content Strategy**:
Create a hub-and-spoke model: central pillar pages for each agent category (marketing AI, finance AI, coaching AI) linking to detailed agent-specific pages and related blog posts. Each agent's public profile page should be SEO-optimized with a unique description, use cases, and sample interactions. Blog content should target informational keywords with 1,500-2,500 word guides, updated quarterly.

**Local and Niche Directories**:
Submit to AI tool directories (There's An AI For That, Futurepedia, TopAI.tools, SaaSHub) — these provide backlinks and referral traffic. Create a complete profile on Product Hunt, G2, Capterra, and AlternativeTo. These directory listings also rank well for "[category] AI tools" searches, providing indirect SEO value. Stone AI Tools (tools.stone-ai.net) can serve as both a directory and an SEO play, attracting organic traffic that feeds the main product.`,
    source: "Stone Intelligence Research",
  },
  {
    agentSlug: "digital-marketing-strategist",
    title: "Email Marketing Automation for SaaS",
    content: `Email remains the highest-ROI marketing channel for SaaS, averaging $36 return per $1 spent. A well-designed automation system nurtures users from sign-up through expansion revenue.

**Welcome Sequence (Days 0-7)**:
Email 1 (Immediate): Welcome message, confirm account, set expectations — "Here's what you can do with Stone AI." Include a single CTA to complete onboarding. Email 2 (Day 1): "Meet your AI team" — highlight 3 agents most relevant to the user's stated goals (captured during onboarding). Email 3 (Day 3): Social proof + quick win — "Sarah used our Marketing Strategist to plan her Q1 campaign in 20 minutes." Include a case study or testimonial. Email 4 (Day 5): "Have you tried your Bestie?" — introduce the companion feature with an emotional hook. Email 5 (Day 7): "Your free tier includes..." — gentle upgrade nudge showing what they're missing. Each email should have exactly one CTA.

**Onboarding Drip (Days 7-30)**:
Triggered by user behavior, not just time. If user hasn't chatted with an agent by Day 3, send a "Getting started" tutorial. If they've used 1 agent, recommend a complementary one. If they've hit the free tier limit, show the upgrade path with specific benefits. Use event-based triggers from Clerk webhook events (sign-in, subscription change) and application events (first chat, agent switch, bestie creation).

**Re-engagement Campaigns**:
Target users inactive for 7, 14, and 30 days with escalating urgency. Day 7: "We miss you — here's what's new" (feature updates, new agents). Day 14: "Your AI team is waiting" with a time-limited offer (15% coupon code). Day 30: Final attempt — "Should we keep your account?" with a clear value restatement. After 30 days of inactivity with no response, reduce email frequency to monthly newsletters to avoid spam complaints.

**Segmentation Strategy**:
Segment by: (1) Subscription tier — FREE users get upgrade-focused content, paid users get feature adoption content; (2) Engagement level — power users get advanced tips and beta invites, light users get basic tutorials; (3) Use case — based on which agents they use most (marketing, finance, coaching, development); (4) Lifecycle stage — trial, active, at-risk, churned. Never send the same email to all segments.

**Platform Integration**:
For SendGrid: use the Marketing Campaigns API for bulk sends and the Transactional API (v3/mail/send) for triggered emails. Set up domain authentication (SPF, DKIM, DMARC) for stone-ai.net to ensure deliverability. For Zoho Campaigns: use the API to sync user data from the Stone AI database and trigger automations. Monitor deliverability metrics: aim for 95%+ delivery rate, 20%+ open rate, 2%+ click rate. Immediately suppress hard bounces and honor unsubscribes within 24 hours (CAN-SPAM compliance).

**Transactional Emails**:
These aren't marketing but are critical: subscription confirmation, payment receipt, plan change confirmation, password reset, and weekly usage summary. Keep these clean and branded but minimal — users expect them to be functional, not promotional. Include a small footer cross-sell at most.`,
    source: "Stone Intelligence Research",
  },
  {
    agentSlug: "digital-marketing-strategist",
    title: "Content Marketing for Developer Tools",
    content: `Content marketing for developer-facing and technical SaaS products requires authenticity, depth, and genuine utility. Developers are allergic to fluff and respond to content that solves real problems.

**Blog Strategy**:
Publish 2-4 posts per month across three categories: (1) Tutorials — step-by-step guides showing how to accomplish specific tasks with the product ("How to build a custom onboarding flow with Stone AI agents," "Automating your marketing plan with AI in 15 minutes"); (2) Thought leadership — opinionated takes on AI trends, backed by data or experience ("Why generic chatbots fail for business — and what agentic AI does differently"); (3) Changelog/updates — transparent product development updates showing momentum. Each post should be 1,500-3,000 words with code samples, screenshots, or diagrams where relevant.

**Documentation as Marketing**:
Comprehensive, well-organized documentation is both a retention tool and a marketing asset. Developers evaluate tools by their docs before signing up. Structure: Getting Started guide (5-minute quickstart), API Reference (every endpoint documented with examples), Guides (task-oriented walkthroughs), and a FAQ. Host docs at docs.stone-ai.net or within the app. Use actual code snippets that can be copied and run. Good docs rank well in search engines and reduce support burden.

**Tutorial and Educational Content**:
Create content at multiple skill levels. Beginner: "What is an AI agent and how can it help your business?" Intermediate: "Setting up Stone AI for your SaaS — integrating with your existing stack." Advanced: "Building custom knowledge bases for specialized AI agents." Publish tutorials on your blog and cross-post to DEV.to, Hashnode, and Medium (with canonical URL pointing to your site for SEO). Video tutorials on YouTube complement written content and capture a different audience segment.

**Community Building**:
Stone AI already has a forum feature — use it as a content engine. Seed the forum with quality posts from the team. Highlight interesting use cases. Create a "Show & Tell" category where users share how they're using agents. Community-generated content (questions, solutions, reviews) creates organic SEO value and reduces content creation burden. Consider a Discord or Slack community for real-time engagement — developer communities thrive on chat platforms.

**Content Distribution**:
Don't just publish — distribute. For each blog post: share on Twitter/X with a key insight (not just the link), post to relevant subreddits (r/artificial, r/SaaS, r/smallbusiness — follow each sub's self-promotion rules), submit to Hacker News (only genuinely interesting/technical posts), share in LinkedIn groups, and include in the weekly email newsletter. Repurpose long posts into Twitter threads, LinkedIn carousels, and short video summaries.

**Measuring Content ROI**:
Track: organic search traffic per post (Google Search Console), time on page (engagement quality), conversion events (sign-up clicks from blog), and referral traffic from distribution channels. Content that ranks on page 1 for a target keyword within 3 months is working. Content that generates sign-ups directly is gold. Update and consolidate underperforming posts rather than letting them decay — Google rewards fresh, comprehensive content.`,
    source: "Stone Intelligence Research",
  },
  {
    agentSlug: "digital-marketing-strategist",
    title: "Social Media Strategy for Tech Startups",
    content: `Social media for tech startups isn't about being everywhere — it's about being effective on 2-3 platforms where your audience actually lives.

**Platform Selection**:
For a B2C/B2B hybrid AI SaaS like Stone AI: (1) Twitter/X — primary platform for tech, AI, and startup audiences. Founders, developers, and early adopters are active here. Best for thought leadership, product updates, and community engagement. (2) LinkedIn — professional audience for B2B positioning. Decision-makers (small business owners, marketing managers) browse LinkedIn for tools. Best for case studies, business outcomes, and longer-form posts. (3) YouTube — for demos, tutorials, and product walkthroughs. AI tool demos perform well because people want to see the product in action. Skip TikTok and Instagram unless you have a visual consumer product — resource constraints mean focusing where ROI is highest.

**Content Calendar Framework**:
Plan content in weekly themes with daily post types. Monday: Product tip or feature highlight. Tuesday: Industry insight or AI news commentary. Wednesday: User story or testimonial. Thursday: Behind-the-scenes (building, team, decisions). Friday: Engagement post (question, poll, meme). Weekend: Repurpose best-performing content. Batch-create content weekly — spend 2 hours creating 5-7 posts, then schedule using Buffer, Hootsuite, or Typefully (for Twitter threads).

**Engagement Tactics**:
Respond to every comment within 4 hours during business hours. Join conversations on others' posts — don't just broadcast. Quote-tweet AI industry news with your take. Create threads that provide genuine value (5-10 tweet threads on topics like "How to choose the right AI tool for your business" or "What I learned building 43 AI agents"). Tag relevant people when sharing insights. Engagement rate matters more than follower count — 100 engaged followers beat 10,000 passive ones.

**Influencer and Creator Outreach**:
Identify 20-50 micro-influencers (5K-50K followers) in the AI tools, SaaS, and small business spaces. Offer: (1) free SMART or PRO tier access for an honest review; (2) affiliate partnership (15-20% recurring commission via the referral system); (3) co-created content (interview them using your agents, publish the results). Avoid paying for one-off sponsored posts — they don't convert for SaaS. Long-term affiliate relationships produce sustained referral traffic.

**Founder-Led Branding**:
The most effective social strategy for startups is founder-led content. Post as yourself, not just the brand account. Share the building journey: challenges, decisions, milestones, metrics (when appropriate). "Building in public" creates emotional investment from your audience. They root for you and become customers, evangelists, and defenders. Be authentic — share failures alongside wins. Founder accounts consistently outperform brand accounts in engagement rate by 3-5x on Twitter and LinkedIn.

**Analytics and Iteration**:
Track weekly: impressions, engagement rate (likes + comments + shares / impressions), profile visits, website clicks, and follower growth. Monthly: identify top 3 performing posts and understand why they worked. Double down on content types that perform. Kill formats that consistently underperform after 4 weeks of testing. Use UTM parameters on all links (utm_source=twitter&utm_medium=social&utm_campaign=launch) to track social traffic in your analytics.`,
    source: "Stone Intelligence Research",
  },
  {
    agentSlug: "digital-marketing-strategist",
    title: "Conversion Rate Optimization for SaaS",
    content: `Conversion rate optimization (CRO) for SaaS focuses on systematically improving the percentage of visitors who become users, and users who become paying customers. Small improvements compound dramatically at scale.

**Signup Flow Analysis**:
Map every step from landing page to first value delivery. For Stone AI: Visit landing page > Click "Start Free" > Clerk sign-up form > Onboarding wizard (5 steps) > First agent chat. Measure the conversion rate at each step. Industry benchmarks: landing page to sign-up: 2-5%, sign-up to onboarding complete: 40-60%, onboarding to first meaningful action: 60-80%. If any step drops below benchmark, it's your bottleneck. Use analytics events (PostHog, Mixpanel, or Vercel Analytics) to track each transition.

**Friction Reduction Tactics**:
(1) Reduce sign-up fields — Clerk supports social login (Google, GitHub) which eliminates password friction. Enable these alongside email signup. (2) Remove credit card requirement for free tier — requiring payment before value delivery kills conversion. (3) Defer non-essential onboarding steps — let users skip to the agent chat and circle back to bestie creation later. (4) Pre-fill where possible — if someone came from a marketing agent page, pre-select the Marketing Strategist in onboarding. (5) Show progress indicators — Stone AI's 5-step wizard should have a visible progress bar so users know how close they are to done.

**A/B Testing Framework**:
Run tests systematically using this process: (1) Identify — use analytics to find the weakest conversion point. (2) Hypothesize — "Changing the CTA from 'Sign Up' to 'Start Free' will increase click-through by 15% because it reduces perceived commitment." (3) Build — create the variant (Vercel Edge Middleware or client-side split). (4) Run — minimum 1,000 visitors per variant, 2 weeks minimum duration. (5) Analyze — use statistical significance calculator (minimum 95% confidence). (6) Implement or iterate. Test priority: highest-traffic, lowest-converting steps first.

**Pricing Page Optimization**:
The pricing page is often the highest-intent page with the worst conversion rate. Improvements: (1) Anchor with the recommended plan — highlight PLUS or SMART as "Most Popular" to steer away from FREE. (2) Show monthly price even for annual plans ("$39.99/mo billed annually" not "$479.88/year"). (3) Use feature names that communicate value, not technical specs ("Unlimited AI conversations" not "Unlimited API calls"). (4) Add a comparison table showing what each tier includes. (5) Include FAQ below pricing addressing cost objections ("Can I cancel anytime?" "What happens to my data?").

**Analytics Setup**:
Essential events to track: page_view (all pages), signup_started, signup_completed, onboarding_step_1 through onboarding_step_5, first_agent_chat, first_bestie_created, pricing_page_viewed, checkout_started, subscription_created, subscription_upgraded, subscription_cancelled. Implement as custom events in your analytics platform. Create a funnel visualization showing drop-off at each stage. Set up weekly automated reports comparing current vs. previous period.

**Quick Wins**:
These typically improve conversion within days: (1) Add trust badges near CTAs (SSL secure, money-back guarantee, "No credit card required"). (2) Add live chat or a help widget on the pricing page. (3) Show the number of active users ("Join 5,000+ teams using Stone AI"). (4) Reduce page load time — every 100ms of additional load time reduces conversion by ~1%. (5) Fix mobile layout issues — 50%+ of traffic is mobile.`,
    source: "Stone Intelligence Research",
  },
  {
    agentSlug: "digital-marketing-strategist",
    title: "Referral Program Design and Implementation",
    content: `Referral programs are the most cost-effective acquisition channel for SaaS — referred customers have 25% higher LTV and 18% lower churn than other channels. Stone AI already has a referral system schema and API; this guide covers optimization.

**Incentive Structure Design**:
The most effective SaaS referral incentives are two-sided (both referrer and referee benefit). Options ranked by effectiveness: (1) Give $10 credit, get $10 credit — simple, universal, easy to understand. (2) Give 1 month free, get 1 month free — higher perceived value, works well for subscription products. (3) Give a tier upgrade (e.g., 1 month of PLUS), get the same — showcases premium features and drives upgrade conversion. (4) Percentage discount — "Give 20% off, get 20% off first month" — aligns with existing coupon infrastructure. Avoid cash payouts for consumer SaaS — they attract low-quality referrals and create tax complications. Stone AI's 15% coupon can be repurposed as the referral incentive.

**Tracking Implementation**:
Stone AI's referral system includes sign-up tracking and settings UI. Key technical components: (1) Unique referral codes per user (stored in the User model, displayed in /app/settings). (2) Referral link format: https://stone-ai.net/?ref=USER_CODE — the ref parameter is captured at sign-up and stored in the new user's record. (3) Cookie-based attribution — store the ref code in a 30-day cookie so users who visit but sign up later still get attributed. (4) Server-side validation — verify the referral code is valid and not self-referral before crediting. (5) Reward fulfillment — on successful referee subscription (not just sign-up), apply credit/discount to both accounts via Stripe coupon or account credit.

**Viral Loop Architecture**:
The referral loop: User enjoys product > Shares referral link > Friend signs up > Both rewarded > Friend enjoys product > Shares their link. Maximize each step: (1) Make sharing effortless — pre-written share text for Twitter, email, and messaging apps accessible from the sidebar referral link. (2) Trigger share prompts at peak satisfaction moments — after a particularly helpful agent response, after completing onboarding, after first week of active use. (3) Show referral progress — "You've referred 3 friends and earned 3 months free" creates gamification. (4) Leaderboard for top referrers (optional) — works for competitive users.

**Referral Landing Pages**:
When someone clicks a referral link, they should land on a dedicated page that: (1) Mentions they were referred ("Your friend Sarah thinks you'll love Stone AI"). (2) Highlights the incentive ("You both get 1 month of PLUS free"). (3) Shows social proof specific to referrals ("Join 500+ users who were referred by friends"). (4) Has a single, prominent CTA to sign up. This page should be A/B tested against the standard landing page — personalized referral pages typically convert 2-3x higher than generic ones.

**Measuring Success**:
Track: referral links generated (awareness), referral link clicks (interest), referred sign-ups (action), referred paid conversions (revenue), viral coefficient (average referrals per user — if above 1.0, you have organic viral growth), and referral program ROI (revenue from referred customers vs. cost of incentives). A healthy referral program generates 15-30% of new sign-ups. If below 5%, the incentive isn't compelling enough or sharing is too difficult.

**Anti-Fraud Measures**:
Prevent abuse: (1) One referral credit per unique email/account. (2) Require the referee to be on a paid plan for at least 30 days before crediting the referrer. (3) IP-based duplicate detection. (4) Cap rewards (maximum 12 months free per referrer per year). (5) Manual review for accounts with unusually high referral rates.`,
    source: "Stone Intelligence Research",
  },
  {
    agentSlug: "digital-marketing-strategist",
    title: "Product Launch Playbook for SaaS",
    content: `A successful SaaS launch is a coordinated campaign spanning 4-6 weeks. This playbook covers pre-launch preparation through launch day execution and post-launch optimization.

**Pre-Launch Checklist (4-2 Weeks Before)**:
(1) Product readiness — all core features working, critical bugs fixed, error monitoring active (Vercel Analytics, Sentry). (2) Landing page live with email capture for waitlist. (3) Pricing finalized and Stripe configured (for Stone AI: switch from test to live mode, recreate all products/prices). (4) Authentication production-ready (Clerk: switch to pk_live_, sk_live_). (5) Content pipeline loaded — 3-5 blog posts scheduled, launch announcement draft ready. (6) Social media accounts warmed up with 2-4 weeks of pre-launch content. (7) Email list segmented (waitlist, beta testers, personal network). (8) Analytics and conversion tracking verified end-to-end. (9) Support documentation complete (FAQ, help center, common issues). (10) Legal: Terms of Service, Privacy Policy, cookie consent.

**Beta Testing Phase (2-1 Weeks Before)**:
Invite 50-100 beta testers from the waitlist. Priority: people who replied to emails (engaged), existing contacts (forgiving), and representative users across target personas. Give them SMART or PRO access free for 3 months. Collect feedback via: (1) In-app feedback widget, (2) Weekly 15-minute user interviews (5 minimum), (3) Usage analytics — which agents are popular, where do users drop off. Fix critical issues. Collect testimonials from happy beta users — these become launch day social proof.

**Press and Creator Outreach (2 Weeks Before)**:
Prepare a press kit: product description (50, 100, and 250 word versions), founder bio, product screenshots (5-8 showing key features), logo files, and a unique angle ("Local business owner builds AI platform with 43 specialized agents"). Reach out to: (1) AI/SaaS newsletters — Ben's Bites, TLDR, The Neuron, SaaS Weekly. (2) Tech bloggers covering AI tools. (3) YouTube creators who review SaaS products. (4) Podcast hosts in the small business/AI space. Offer exclusive early access or an interview. Send outreach 2 weeks before launch; follow up 3 days before with the launch date and link.

**Product Hunt Strategy**:
Product Hunt can drive 1,000-5,000 visitors on launch day. Preparation: (1) Create a maker profile and engage on PH for 2-4 weeks before launch (upvote, comment, genuinely participate). (2) Prepare the PH listing: catchy tagline (under 60 chars), 5 product images showing the UI, a 1-minute demo video, detailed description with problem/solution framing. (3) Schedule launch for Tuesday-Thursday (highest traffic days), midnight PT. (4) First comment: founder story explaining why you built this. (5) Rally supporters — share the link with beta testers, friends, social followers. Ask for genuine upvotes and comments, never fake engagement. (6) Respond to every comment within 1 hour.

**Launch Day Execution**:
Timeline: 12:00 AM PT — Product Hunt goes live, first comment posted. 6:00 AM — Social media announcement (Twitter, LinkedIn). 8:00 AM — Email blast to full list. 10:00 AM — Activate any paid promotion (if budget allows). Throughout the day: monitor server performance (Vercel dashboard), respond to PH comments, engage with social mentions, address support tickets immediately. Have a war room (Slack channel or Discord) with the team for real-time coordination.

**Post-Launch (Week 1-2)**:
(1) Send thank-you email to everyone who signed up on launch day. (2) Publish a launch recap blog post with metrics (if impressive). (3) Follow up with press contacts who didn't cover the launch — share traction numbers. (4) Analyze: which channels drove the most sign-ups, what was the conversion rate, which agents are most popular, where are users dropping off. (5) Prioritize fixes and improvements based on launch feedback. (6) Start planning the sustained growth phase — launch day is a spike, not a strategy.`,
    source: "Stone Intelligence Research",
  },
];
