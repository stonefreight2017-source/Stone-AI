export const WEBSITE_DEV_SEEDS = [
  {
    title: "Next.js 16 Production Deployment on Vercel — proxy.ts, Build Config, and Common Failures",
    content: `Next.js 16 renamed middleware.ts to proxy.ts. This is a breaking change that catches teams upgrading from Next.js 14/15. The file must be located at src/proxy.ts (if using src directory) or proxy.ts at the project root. Vercel's build system expects this exact location — placing it elsewhere causes silent failures where no middleware executes.

Build configuration requires a properly typed next.config.ts (TypeScript configs are now standard). Critical settings include the turbopack.root property — set it to process.cwd() to fix root detection when parent directories contain lockfiles, which causes Turbopack panics during builds. Disable poweredByHeader for security. The build script must run prisma generate before next build: "build": "prisma generate && next build". Add "postinstall": "prisma generate" so Vercel's dependency installation step generates the Prisma client automatically.

Environment variables on Vercel are scoped to Preview, Production, or Development. Common mistake: setting a variable only for Production and wondering why preview deployments fail. Sensitive values (STRIPE_SECRET_KEY, DATABASE_URL, CLERK_SECRET_KEY) must never have the "Expose to client" checkbox enabled. Client-side variables must be prefixed with NEXT_PUBLIC_. Vercel encrypts all environment variables at rest and injects them at build time for NEXT_PUBLIC_ vars and at runtime for server-only vars.

Common build failures and their fixes: (1) "Module not found" for @/lib/* paths — ensure tsconfig.json paths alias matches src directory structure. (2) Turbopack panic on Windows — add turbopack.root to next.config.ts. (3) "PrismaClientInitializationError" — missing prisma generate in build script. (4) Type errors that pass locally but fail on Vercel — Vercel runs strict TypeScript checking; fix by running "next build" locally first. (5) Edge runtime errors — proxy.ts runs on Edge by default; imported modules must be Edge-compatible (no Node.js fs, path, etc.). (6) Build cache corruption — trigger clean build by going to Project Settings > General > Build Cache and clicking "Clear". (7) Memory exceeded — for large projects, set NODE_OPTIONS=--max-old-space-size=4096 in environment variables.

The proxy.ts matcher config controls which routes invoke the middleware. Use negative lookahead to skip static assets: "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)" and always include "/(api|trpc)(.*)" to ensure API routes are processed.`,
    source: "Stone Intelligence Research"
  },
  {
    title: "Clerk Authentication Integration — Dev vs Production Mode and Common Debugging",
    content: `Clerk uses two distinct key sets: test keys (pk_test_*, sk_test_*) and live keys (pk_live_*, sk_live_*). Test keys create a development instance with relaxed security — it injects a __clerk_db_jwt cookie and uses a dev-browser session that requires specific network conditions. Live keys enforce production security with proper session tokens.

The most common Clerk error in development is "dev-browser-missing" or "__clerk_db_jwt cookie missing." This occurs when: (1) Cloudflare proxy (orange cloud) is enabled on your DNS record — Cloudflare strips or interferes with Clerk's development cookies. Fix: set DNS to grey cloud (DNS only, no proxy) during development. (2) Your ISP's security appliance (e.g., CUJO on Spectrum) performs TLS SNI inspection and blocks the .clerk.accounts.dev domain. Fix: use a VPN or add a firewall exception. (3) Cross-origin issues — ensure NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in .env.local matches your Clerk instance.

Sign-up and sign-in black screen debugging: This typically means the Clerk components are loading but can't reach the Clerk API. Check browser DevTools Network tab for blocked requests to clerk.accounts.dev. Common causes: Content Security Policy headers blocking Clerk domains (you need connect-src and frame-src to include https://*.clerk.accounts.dev), ad blockers intercepting the requests, or incorrect NEXT_PUBLIC_CLERK_SIGN_IN_URL / NEXT_PUBLIC_CLERK_SIGN_UP_URL environment variables.

Switching from dev to production: (1) In Clerk Dashboard, create a production instance. (2) Replace pk_test_ and sk_test_ with pk_live_ and sk_live_ in Vercel environment variables. (3) Update the Clerk Frontend API URL — production uses clerk.yourdomain.com instead of *.clerk.accounts.dev. (4) Set up a CNAME record: clerk.yourdomain.com pointing to frontend-api.clerk.dev. (5) Update CSP headers to reference your production Clerk domain instead of *.clerk.accounts.dev.

In proxy.ts, use clerkMiddleware with createRouteMatcher to define public routes. Auth pages (/sign-in, /sign-up) need relaxed Cross-Origin policies — delete Cross-Origin-Embedder-Policy, Cross-Origin-Opener-Policy, and Cross-Origin-Resource-Policy headers for these paths, or Clerk's iframe-based auth flow will break. The Stripe webhook endpoint must also be public since it receives unsigned-origin POST requests from Stripe's servers.`,
    source: "Stone Intelligence Research"
  },
  {
    title: "Cloudflare DNS + Vercel Hosting — Proxy Modes, SSL, and Integration Pitfalls",
    content: `When using Cloudflare DNS with Vercel hosting, the proxy toggle (orange vs grey cloud) fundamentally changes how traffic flows. Orange cloud (Proxied): traffic goes Client -> Cloudflare -> Vercel. Cloudflare terminates TLS, applies WAF rules, and re-encrypts to Vercel. Grey cloud (DNS Only): traffic goes Client -> Vercel directly. Cloudflare only provides DNS resolution.

SSL mode selection is critical and the most common source of redirect loops or certificate errors. Full (Strict): Cloudflare encrypts to origin and validates the certificate. This is the correct setting for Vercel since Vercel provides valid SSL certificates. Full: Cloudflare encrypts to origin but doesn't validate the cert — works but less secure. Flexible: Cloudflare connects to origin via HTTP (unencrypted). This causes infinite redirect loops with Vercel because Vercel sees HTTP, redirects to HTTPS, Cloudflare proxies HTTPS back as HTTP, and the cycle repeats. Never use Flexible with Vercel.

How Cloudflare proxy breaks Clerk dev mode: Clerk's development instance uses a __clerk_db_jwt cookie with specific domain attributes. When Cloudflare proxies the request, it may strip, modify, or fail to pass through cookies that Clerk needs. Additionally, Clerk's dev-browser mechanism makes requests to *.clerk.accounts.dev which expects a direct connection. The Cloudflare proxy can interfere with the WebSocket connections and cookie handling that Clerk uses during development. Solution: during development, set the DNS record for your dev domain to grey cloud (DNS only). Switch to orange cloud only in production with live Clerk keys.

DNS propagation typically takes 1-5 minutes with Cloudflare (since you're using their nameservers), but can take up to 48 hours for the NS delegation itself when first setting up. When switching from grey to orange cloud or vice versa, changes usually propagate within 5 minutes. Use "dig yourdomain.com +short" or "nslookup yourdomain.com" to verify propagation. When proxied (orange), dig returns Cloudflare IP addresses (104.x.x.x or 172.x.x.x range), not Vercel's IPs.

Common DNS records for a Vercel + Cloudflare setup: (1) A record: @ -> 76.76.21.21 (Vercel's anycast IP). (2) CNAME: www -> cname.vercel-dns.com. (3) CNAME: app -> cname.vercel-dns.com. For Clerk production: CNAME: clerk -> frontend-api.clerk.dev (must be grey cloud / DNS only). Vercel requires you to add the domain in the Vercel dashboard and may ask you to verify ownership via a TXT record. If using Cloudflare proxy, make sure to disable Cloudflare's "Always Use HTTPS" redirect rule as Vercel handles this.`,
    source: "Stone Intelligence Research"
  },
  {
    title: "Vercel Deployment Troubleshooting — Build Failures, Cache, and Rollback Procedures",
    content: `Vercel build failures fall into predictable categories. The most common with Next.js 16 + Prisma + TypeScript projects:

Type errors: Vercel runs "next build" which performs full type checking. Errors that don't surface during "next dev" (which uses Turbopack with lazy type checking) will fail the build. Always run "next build" locally before pushing. Common culprits: unused imports with side effects, implicit any types, and mismatched return types in API routes.

Turbopack panics: Next.js 16 uses Turbopack by default. Known issues include memory allocation failures on large projects and root directory detection bugs. Add turbopack.root: process.cwd() to next.config.ts. If panics persist, try building without Turbopack by setting TURBOPACK=0 in Vercel environment variables (falls back to webpack). Report Turbopack crashes to the Next.js GitHub since the team actively fixes these.

Prisma generation failures: The build script must include "prisma generate" before "next build". Without it, the generated Prisma client doesn't exist and imports fail. Use postinstall hook as backup: "postinstall": "prisma generate". If using Prisma's driver adapter pattern (e.g., @prisma/adapter-pg for Neon), ensure the adapter package is in dependencies (not devDependencies) since Vercel needs it at runtime.

Cache clearing: Vercel aggressively caches node_modules, .next build output, and Prisma's generated client. Stale caches cause "module not found" errors after dependency updates. Clear via: Vercel Dashboard > Project Settings > General > scroll to "Build Cache" > click "Clear and Redeploy". Alternatively, add a dummy environment variable change to force a fresh install.

Redeployment triggers: Any push to the connected git branch triggers a build. For manual redeployment: Vercel Dashboard > Deployments > click the three-dot menu on any deployment > "Redeploy". Check "Use existing build cache" to speed up, or uncheck it for a clean build. For CI/CD: use the Vercel CLI "vercel --prod" or trigger via webhook.

Rollback procedures: Every Vercel deployment is immutable and preserved. To rollback: go to Deployments, find the last working deployment, click three-dot menu > "Promote to Production." This is instant (no rebuild needed) — it just repoints the production URL to that deployment's artifacts. Always verify the rollback by checking the deployment's URL directly (e.g., stone-ai-abc123.vercel.app) before promoting.

Checking build logs: Vercel Dashboard > Deployments > click the failed deployment > "Building" tab shows real-time logs. The "Source" tab shows which git commit triggered it. Filter logs by "Error" to quickly find the failure point. For serverless function runtime errors (not build errors), check the "Runtime Logs" tab or use "vercel logs --prod" from the CLI.`,
    source: "Stone Intelligence Research"
  },
  {
    title: "Favicon and Brand Asset Implementation in Next.js App Directory",
    content: `Next.js App Router has specific conventions for favicons and icons. The file-based metadata API uses the app directory root to automatically generate meta tags.

File placement and priority: Place favicon files in src/app/ (if using src directory) or app/ at the root. Next.js recognizes these filenames: favicon.ico (classic 16x16/32x32 multi-size ICO, served at /favicon.ico), icon.svg or icon.png (modern browsers prefer SVG; generates <link rel="icon"> tag), icon.tsx or icon.js (dynamic icon generation via ImageResponse), apple-icon.png (generates <link rel="apple-touch-icon">), and opengraph-image.png or twitter-image.png for social sharing.

Browser caching is the most frustrating issue with favicons. Browsers aggressively cache favicons, often ignoring standard cache headers. Solutions: (1) Hard refresh with Ctrl+Shift+R doesn't always clear favicon cache. (2) Navigate directly to /favicon.ico and force refresh there. (3) Chrome: go to chrome://history, search for your domain, delete those entries to clear the icon cache. (4) Add a version query parameter during development: <link rel="icon" href="/favicon.ico?v=2">. (5) In production, rely on the fact that new deployments get new URLs on Vercel — the CDN cache resets per deployment.

Best practice setup for a production site: Keep both favicon.ico (for legacy browser compatibility, especially older versions of Safari and IE/Edge Legacy) AND icon.svg (for modern browsers that support SVG favicons with dark mode media queries). Place favicon.ico in src/app/favicon.ico and icon.svg in public/favicon.svg with an explicit metadata export in layout.tsx. The public directory approach gives you more control over caching headers.

PWA manifest icons require explicit configuration. Create a manifest.json or site.webmanifest in the public directory with icons array specifying multiple sizes: 192x192, 512x512, and optionally 48x48, 72x72, 96x96, 144x144, 384x384. Each entry needs src, sizes, type, and purpose fields. The purpose field should be "any" for standard icons and "maskable" for Android adaptive icons (with safe zone padding). Reference the manifest in layout.tsx metadata: manifest: "/site.webmanifest".

Meta tags for comprehensive coverage: Next.js generates many automatically from file-based conventions, but for full control use the metadata export in layout.tsx. Key tags: icons.icon (array of {url, sizes, type}), icons.apple (Apple touch icons), icons.shortcut (shortcut icon). For Open Graph and Twitter cards, use opengraph-image.png and twitter-image.png files in the app directory, or set metadataBase and use the openGraph and twitter metadata fields.

Common gotcha: If both public/favicon.ico and src/app/favicon.ico exist, the app directory version takes precedence. But static files in public/ are served at the root path, so they can conflict. Remove duplicates and choose one location. For SVG favicons, the public/ directory approach is often cleaner since Next.js doesn't auto-process SVG through its icon pipeline as reliably as ICO/PNG.`,
    source: "Stone Intelligence Research"
  },
  {
    title: "ISP and Firewall Blocking of Newly Registered Domains — CUJO, TLS Inspection, and Bypasses",
    content: `Newly registered domains (less than 30 days old) are frequently blocked by ISP-level security appliances, enterprise firewalls, and DNS filtering services. This creates a maddening debugging experience where your site works on mobile data but not on home WiFi, or works for some users but not others.

CUJO AI (Spectrum/Charter): Spectrum deploys CUJO AI security appliances at the network edge. These devices maintain a domain reputation database and automatically block newly registered domains as potential phishing/malware sites. Symptoms: the site loads on mobile data, loads via VPN, but shows a blank page or connection reset on Spectrum WiFi. No error page is shown — the connection simply fails or hangs. CUJO operates at the TLS SNI (Server Name Indication) layer, meaning it reads the domain name from the TLS handshake before encryption is established and can block based on that alone.

TLS SNI inspection: When your browser connects to a website via HTTPS, the domain name is sent in plaintext as part of the TLS Client Hello message (before encryption begins). Security appliances like CUJO, OpenDNS, and corporate firewalls read this SNI field and check it against blocklists. This is why even Cloudflare proxy (which hides your origin IP) doesn't help — the SNI still shows your domain name. Encrypted Client Hello (ECH) is a developing standard that encrypts the SNI field, but it's not yet widely deployed.

How Cloudflare proxy partially helps: With Cloudflare proxy enabled (orange cloud), your traffic goes through Cloudflare's network. Some security appliances whitelist Cloudflare's IP ranges, so the connection succeeds even if the domain itself is new. However, if the appliance inspects SNI (like CUJO does), the proxy doesn't help because the domain name is still visible in the TLS handshake.

Workarounds and solutions: (1) Time: Most ISP blocklists automatically delist domains after 14-30 days if no malicious activity is detected. Submit your domain to Google Safe Browsing (transparencyreport.google.com/safe-browsing) and VirusTotal to build positive reputation. (2) VPN: Route traffic through a VPN (Mullvad, Tailscale, WireGuard) to bypass ISP-level filtering entirely. (3) Twingate or Cloudflare Access: For development teams, these zero-trust network tools tunnel traffic around ISP blocks. (4) DNS change: Switch from ISP default DNS to 1.1.1.1 (Cloudflare) or 8.8.8.8 (Google). This bypasses DNS-level blocking but not SNI inspection. (5) Contact ISP: Call Spectrum/your ISP and request the domain be whitelisted. This rarely works quickly but is worth doing for the record.

For production launches: Register your domain at least 30 days before launch. Set up a basic landing page immediately to start building domain reputation. Submit to Google Search Console, Bing Webmaster Tools, and major security reputation services. Enable Cloudflare proxy from day one — even a "coming soon" page through Cloudflare builds positive reputation data. Consider using an established domain (like a .com) rather than newer TLDs (.ai, .dev, .app) which face more scrutiny from security appliances.`,
    source: "Stone Intelligence Research"
  },
  {
    title: "Prisma ORM with Neon PostgreSQL — Driver Adapters, Connection Pooling, and Serverless Migrations",
    content: `Prisma 7.x with Neon PostgreSQL requires the driver adapter pattern for optimal serverless performance. The standard Prisma connection approach opens a direct TCP connection to Postgres, which is incompatible with serverless cold starts (connection overhead) and connection limits (each serverless instance opens its own connection).

Driver adapter setup: Install @prisma/adapter-pg and pg packages. In your Prisma client initialization file, create a pg Pool pointing to Neon's connection string, then wrap it with PrismaPg adapter: "import { PrismaPg } from '@prisma/adapter-pg'; import { Pool } from 'pg'; const pool = new Pool({ connectionString: process.env.DATABASE_URL }); const adapter = new PrismaPg(pool); const prisma = new PrismaClient({ adapter });". The schema.prisma datasource block needs only provider = "postgresql" — the connection URL is handled by the adapter at runtime, not at schema level.

Connection pooling on Neon: Neon provides built-in connection pooling via their proxy. Your DATABASE_URL should use the pooled connection string format: postgres://user:pass@ep-xxx-yyy-pooler.region.aws.neon.tech/dbname?sslmode=require. Note the "-pooler" suffix in the hostname — this routes through PgBouncer. For direct connections (needed for migrations), use the non-pooler URL: postgres://user:pass@ep-xxx-yyy.region.aws.neon.tech/dbname. Set DIRECT_URL in your .env for migrations and DATABASE_URL for runtime queries.

Schema migrations on serverless (Vercel + Neon): Never run "prisma migrate deploy" during the Vercel build step — it adds latency and can fail on concurrent builds. Instead: (1) Run migrations locally or in CI using the DIRECT_URL (non-pooled connection). (2) Use "prisma migrate deploy" (not "prisma migrate dev") for production — it only applies pending migrations without generating new ones. (3) For Neon branching workflows: create a branch, apply migration to the branch, test, then merge the branch and apply to main. Prisma generate must still run at build time: "build": "prisma generate && next build".

pgvector setup for AI/embeddings: Add the pgvector extension on Neon (enabled by default on newer projects, or run CREATE EXTENSION IF NOT EXISTS vector). In schema.prisma, declare vector columns using Unsupported("vector(1536)") type (for OpenAI ada-002 dimensions) or the appropriate dimension count. For similarity search, use raw SQL via prisma.$queryRaw since Prisma doesn't have native vector operators. Example: "SELECT id, content, 1 - (embedding <=> $1::vector) as similarity FROM items ORDER BY embedding <=> $1::vector LIMIT 10". The <=> operator computes cosine distance. Create an IVFFlat or HNSW index for performance: "CREATE INDEX ON items USING hnsw (embedding vector_cosine_ops)".

Singleton pattern for serverless: In development, hot module reloading creates multiple Prisma clients. Use the standard singleton: "const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }; export const db = globalForPrisma.prisma || new PrismaClient({ adapter }); if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;". This prevents "Too many clients" errors during development while allowing proper connection cleanup in production.`,
    source: "Stone Intelligence Research"
  },
  {
    title: "Stripe Integration in Next.js — Webhooks, Mode Switching, and Subscription Management",
    content: `Stripe integration in a Next.js app follows a three-part pattern: client-side checkout initiation, server-side webhook processing, and database state synchronization. Each part has specific pitfalls.

Webhook configuration: Create a webhook endpoint at /api/stripe/webhook. This route must read the raw request body (not parsed JSON) for signature verification. Use req.text() instead of req.json(): "const body = await req.text(); const signature = req.headers.get('stripe-signature'); const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);". In the Stripe Dashboard, set the webhook URL to https://yourdomain.com/api/stripe/webhook and select events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, and invoice.payment_failed.

Webhook signature verification is non-negotiable. The STRIPE_WEBHOOK_SECRET (whsec_*) is unique per endpoint — if you recreate the endpoint, you get a new secret. The constructEvent function computes HMAC-SHA256 of the raw body with the webhook secret and compares it to the stripe-signature header. This prevents attackers from sending fake events to your webhook. The signature has a timestamp tolerance (default 300 seconds) — if your server clock is off, verification fails silently.

Test vs live mode switching: Stripe maintains completely separate environments. All entities (products, prices, customers, subscriptions, webhook endpoints) exist only in their mode. Switching to live mode requires: (1) Create all products and prices again in live mode — IDs will be different. (2) Update all price ID mappings in your tier configuration. (3) Create a new webhook endpoint in live mode — you get a new whsec_ secret. (4) Update environment variables: STRIPE_SECRET_KEY (sk_live_*), STRIPE_PUBLISHABLE_KEY (pk_live_*), STRIPE_WEBHOOK_SECRET (new whsec_*), and all STRIPE_PRICE_* IDs. (5) Never mix test and live keys — Stripe API will return "No such price" errors if a test price ID is used with a live secret key.

Subscription management pattern: Map Stripe price IDs to your application tiers using a configuration function. When checkout.session.completed fires, retrieve the subscription to get the price ID, map it to a tier, and update the user record. For subscription updates (plan changes), the customer.subscription.updated event fires — check the new price ID and update the tier accordingly. On subscription deletion, downgrade to FREE tier. For failed payments, set status to PAST_DUE and implement a grace period before downgrading.

Stripe status to app status mapping: Stripe's subscription statuses (active, past_due, canceled, unpaid, incomplete, incomplete_expired, trialing, paused) should map to your simpler model. A proven mapping: active/trialing -> ACTIVE, past_due/unpaid -> PAST_DUE, canceled -> CANCELED, incomplete/incomplete_expired/paused -> INACTIVE. Always handle edge cases: a subscription can be updated multiple times rapidly (plan change triggers both updated and checkout events), so use idempotent database updates.`,
    source: "Stone Intelligence Research"
  },
  {
    title: "Redis Rate Limiting — Windows Setup, Serverless Fallback, and Middleware Patterns",
    content: `Redis-backed rate limiting provides distributed, persistent request throttling across multiple server instances. For local development on Windows, install Redis as a Windows service (Redis 3.0.504 for Windows or use WSL2 with a modern Redis). The service runs on port 6379 by default and survives reboots.

Sliding window algorithm: The most effective pattern for API rate limiting uses Redis sorted sets (ZSET). Each request adds a timestamped entry. Before allowing a request: (1) ZREMRANGEBYSCORE removes entries older than the window (e.g., 60 seconds). (2) ZCARD counts remaining entries. (3) If count < limit, ZADD the new entry. (4) EXPIRE sets a TTL slightly longer than the window (e.g., 70 seconds) for automatic cleanup. Wrap all operations in a pipeline for atomicity. This approach handles burst traffic naturally — each request sees the true count of requests in the last 60 seconds.

In-memory fallback for serverless: On Vercel's serverless platform, localhost Redis is unreachable since each function runs in an isolated container. Two options: (1) Use managed Redis (Upstash is designed for serverless — pay-per-request, no persistent connections needed). (2) Fall back to in-memory rate limiting using a Map<string, { timestamps: number[] }> with periodic cleanup. The fallback is per-instance only — a determined attacker could hit different serverless instances to bypass limits. In production, always ensure Redis (Upstash or similar) is available.

Connection pattern for serverless: Use a lazy singleton with aggressive error handling. Initialize the Redis connection only when first needed (lazyConnect: true), set connectTimeout to 2000ms, maxRetriesPerRequest to 1, and enableOfflineQueue to false. If Redis fails to connect, set a flag to skip future connection attempts and fall back to in-memory. This prevents every request from waiting 2+ seconds for a Redis timeout.

Middleware pattern for Next.js proxy.ts: Rate limiting in proxy.ts is tricky because the Edge Runtime has limited module support. Instead, implement rate limiting at the API route level. In each route handler: extract the client IP (use x-vercel-forwarded-for on Vercel — it's set by the edge and can't be spoofed by clients, unlike x-forwarded-for), construct a rate limit key (e.g., "rl:chat:{userId}" or "rl:api:{ip}"), and call your rate limiter. Return 429 with Retry-After header if blocked.

Concurrent request limiting: Beyond requests-per-minute, limit concurrent in-flight requests per user. This prevents a single user from consuming all serverless function slots. Use Redis INCR/DECR with a safety TTL (e.g., 120 seconds). INCR the key before processing, DECR when done. If the count exceeds the limit, DECR immediately and return 429. The TTL is a safety net — if a function crashes without DECR, the slot auto-frees. Monitor for "stale slots" where the TTL expires, indicating crashes or timeouts in your handlers.

Rate limit tiers: Different user tiers should have different limits. Example: FREE users get 10 requests/minute, STARTER gets 20, PLUS gets 40, SMART gets 60, PRO gets 100. Implement this by passing the user's tier to the rate limit function and looking up the corresponding limit. Store tier-to-limit mappings in a configuration file, not hardcoded in route handlers.`,
    source: "Stone Intelligence Research"
  },
  {
    title: "Content Security Policy Headers for Clerk, Stripe, and Cloudflare Integration",
    content: `Content Security Policy (CSP) is a critical defense-in-depth mechanism that controls which resources the browser is allowed to load. Getting it right with third-party services like Clerk, Stripe, and Cloudflare requires careful directive configuration.

Base CSP structure for a Next.js + Clerk + Stripe app: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.yourdomain.com https://*.clerk.accounts.dev https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://clerk.yourdomain.com https://*.clerk.accounts.dev https://api.stripe.com https://challenges.cloudflare.com wss:; frame-src 'self' https://clerk.yourdomain.com https://*.clerk.accounts.dev https://js.stripe.com https://challenges.cloudflare.com; worker-src 'self' blob:; form-action 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'".

Clerk requirements: In development mode (pk_test_ keys), Clerk loads from *.clerk.accounts.dev. In production (pk_live_ keys), it loads from clerk.yourdomain.com. Both domains need to be in script-src (Clerk loads JavaScript), connect-src (API calls), and frame-src (Clerk uses iframes for its sign-in/sign-up components). The 'unsafe-inline' and 'unsafe-eval' in script-src are needed because Clerk injects inline scripts. For stricter CSP, use nonce-based script loading, but this requires custom Clerk configuration and middleware support.

Stripe requirements: Stripe Elements and Checkout use iframes from js.stripe.com (add to frame-src) and make API calls to api.stripe.com (add to connect-src). If using Stripe.js directly, add https://js.stripe.com to script-src as well.

Cloudflare challenge requirements: When Cloudflare's Bot Management or Under Attack mode is active, it injects challenge pages via challenges.cloudflare.com. Add this domain to script-src, connect-src, and frame-src. Without these, Cloudflare challenges display as blank pages, and users can't complete CAPTCHAs.

Auth pages need special treatment: Sign-in and sign-up pages render Clerk components that use iframes and cross-origin requests extensively. The strict Cross-Origin-Embedder-Policy (COEP), Cross-Origin-Opener-Policy (COOP), and Cross-Origin-Resource-Policy (CORP) headers break Clerk's auth flow. In your proxy.ts middleware, detect auth page paths and delete these three headers for those routes. Some teams also remove the CSP header entirely for auth pages, though a relaxed CSP is preferable to none.

Implementation location: Apply CSP in proxy.ts (middleware) rather than next.config.ts headers. Middleware gives you route-conditional logic — apply strict CSP on most pages, relaxed CSP on auth pages. The next.config.ts headers() function is static and applies to all matching routes without conditional logic. For defense-in-depth, use next.config.ts for non-CSP security headers (X-DNS-Prefetch-Control, X-Download-Options, X-Permitted-Cross-Domain-Policies) and proxy.ts for the dynamic CSP.

Testing CSP: Open browser DevTools Console tab. CSP violations appear as error messages like "Refused to load script from 'X' because it violates the Content-Security-Policy directive 'script-src...'". Use report-uri or report-to directives (pointing to a logging endpoint) to collect violations in production without blocking. Start with Content-Security-Policy-Report-Only header to test without breaking functionality, then switch to Content-Security-Policy when confident.`,
    source: "Stone Intelligence Research"
  }
];
