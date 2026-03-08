# DO-1: Vercel Deployment Pipeline & Environment Configuration

## Purpose
Operational reference for the Senior DevOps Engineer agent covering Stone AI's complete Vercel deployment pipeline, build process, environment variable map, and rollback procedures. Grounded in actual config files as of 2026-03-07.

## Current Infrastructure (from actual config)

### Project Identity
- **Vercel Project**: `stone-ai` (ID: `prj_V9QMh0OBV68wfoseauBDTpQlCFv3`)
- **Vercel Org**: `team_92Utnyr3e5TaB3DgdHDJ3KfH` (stonefreight2017-sources-projects)
- **GitHub Repo**: `stonefreight2017-source/Stone-AI`
- **Framework**: Next.js 15.5.12 (App Router, TypeScript)
- **Production URL**: `https://stone-ai.net`
- **Fallback URL**: `https://stone-ai-sooty.vercel.app`
- **No `vercel.json`** — all config lives in `next.config.ts` and Vercel dashboard

### Build Pipeline
```
package.json scripts:
  "dev":         "next dev"
  "build":       "prisma generate && next build"
  "postinstall": "prisma generate"
  "start":       "next start"
  "lint":        "eslint"
```

**Build command on Vercel**: `prisma generate && next build`
- `prisma generate` creates the Prisma Client in `src/generated/prisma/` (output configured in schema.prisma)
- `next build` compiles the Next.js app (pages, API routes, middleware)
- `postinstall` hook ensures `prisma generate` runs after every `npm install` (covers Vercel's install step)

### Turbo Cache (Vercel)
Production env includes Turbo remote caching:
```
TURBO_CACHE=remote:rw
TURBO_DOWNLOAD_LOCAL_ENABLED=true
TURBO_REMOTE_ONLY=true
TURBO_RUN_SUMMARY=true
NX_DAEMON=false
```
This accelerates repeat builds by caching unchanged build artifacts remotely.

## Architecture Diagram (text-based)

```
 Developer Workstation
       |
       | git push origin main
       v
 GitHub (stonefreight2017-source/Stone-AI)
       |
       | Webhook trigger
       v
 Vercel Build Pipeline
  +----------------------------------+
  | 1. npm install                   |
  |    -> postinstall: prisma generate|
  | 2. prisma generate && next build |
  |    -> Compiles App Router pages  |
  |    -> Bundles API routes         |
  |    -> Compiles middleware.ts      |
  | 3. Deploy to Vercel Edge Network |
  +----------------------------------+
       |
       +--- Production (main branch) --> stone-ai.net
       |       via Cloudflare DNS proxy
       |
       +--- Preview (PR/other branches) --> *.vercel.app
               direct Vercel URL
```

### Deployment Environments

| Environment | Trigger | URL | Database | Notes |
|---|---|---|---|---|
| **Production** | Push to `main` | `stone-ai.net` | Neon prod (ep-wispy-truth) | Cloudflare proxied |
| **Preview** | Pull request / non-main push | `*.vercel.app` | Should use Neon branch (currently shares prod) | Auto-generated URL |
| **Local Dev** | `npm run dev` | `localhost:3000` | Docker `stoneai-db` (:5432) or Neon | `.env` file |

## Environment Variable Map

### Database (Neon PostgreSQL)
| Variable | Service | Dev Value | Prod Value |
|---|---|---|---|
| `DATABASE_URL` | Neon / local PG | `postgresql://stoneai:stoneai_dev_2026@localhost:5432/stoneai` | `postgresql://neondb_owner:***@ep-wispy-truth-aivu1ada.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require` |

### Authentication (Clerk)
| Variable | Scope | Notes |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Client | `pk_test_*` (dev mode) — needs `pk_live_*` for prod |
| `CLERK_SECRET_KEY` | Server | `sk_test_*` (dev mode) — needs `sk_live_*` for prod |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Client | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Client | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Client | `/app` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Client | `/app` |

### Payments (Stripe)
| Variable | Scope | Notes |
|---|---|---|
| `STRIPE_SECRET_KEY` | Server | `sk_test_*` — needs live key for real payments |
| `STRIPE_WEBHOOK_SECRET` | Server | `whsec_*` — must match Stripe dashboard endpoint |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client | `pk_test_*` |
| `STRIPE_PRICE_STARTER` | Server | Monthly price ID |
| `STRIPE_PRICE_PLUS` | Server | Monthly price ID |
| `STRIPE_PRICE_SMART` | Server | Monthly price ID |
| `STRIPE_PRICE_PRO` | Server | Monthly price ID |
| `STRIPE_PRICE_*_6MO` | Server | 6-month price IDs (10% off) |
| `STRIPE_PRICE_*_ANNUAL` | Server | Annual price IDs (20% off) |
| `STRIPE_UPGRADE_COUPON_ID` | Server | Coupon for upgrade discounts |

### AI / Inference
| Variable | Scope | Notes |
|---|---|---|
| `VLLM_BASE_URL` | Server | `http://127.0.0.1:8000/v1` locally; cloud endpoint at scale |
| `VLLM_MODEL` | Server | `meta-llama/Llama-3.1-70B-Instruct` |
| `VLLM_MAX_CONCURRENT` | Server | `10` — max parallel inference requests |
| `VLLM_API_KEY` | Server | Not needed for local; required for cloud providers |
| `OPENAI_API_KEY` | Server | Cloud fallback (currently GPT-4o) |
| `OPENAI_MODEL` | Server | `gpt-4o` |
| `ANTHROPIC_API_KEY` | Server | Claude for SMART mode — **NOT YET SET ON VERCEL** |
| `SMART_MODEL` | Server | `claude-sonnet-4-20250514` (default in code) |
| `LOCAL_FALLBACK_MODEL` | Server | `claude-haiku-4-5-20251001` — used on Vercel when vLLM is localhost |

### App Config
| Variable | Scope | Notes |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Client | `http://localhost:3000` (dev) / `https://stone-ai.net` (prod) |
| `ADMIN_EMAILS` | Server | Comma-separated emails for `/app/admin` access |
| `MEMORY_EXTRACT_FREQUENCY` | Server | Optional — set to `3` at high load to reduce extraction frequency |
| `CORS_ALLOWED_ORIGINS` | Server | Defaults to `https://stone-ai.net,https://app.stone-ai.net,https://www.stone-ai.net` |

### Vercel System Variables (auto-injected)
| Variable | Purpose |
|---|---|
| `VERCEL` | `"1"` when running on Vercel — used in `ai.ts` to detect cloud environment |
| `VERCEL_ENV` | `production` / `preview` / `development` |
| `VERCEL_URL` | Auto-assigned deployment URL |
| `VERCEL_TARGET_ENV` | Target environment for the deployment |
| `VERCEL_GIT_*` | Git metadata (commit SHA, branch, author, PR ID) |
| `VERCEL_OIDC_TOKEN` | OIDC token for Vercel integrations |

## Middleware (Edge Runtime)

`src/middleware.ts` runs on Vercel's Edge Network (not Node.js serverless):
- **Clerk authentication** — protects all non-public routes
- **Security headers** — HSTS, CSP, X-Frame-Options, CORP, COOP, COEP
- **CORS** — allowlisted origins for `/api/v1/*` (external API)
- **Cache-Control** — `no-store` on all API routes
- Relaxes COEP/COOP/CSP on `/sign-in` and `/sign-up` for Clerk iframes

The middleware matcher excludes static files (`_next`, images, fonts) for performance.

### next.config.ts Hardened Headers
Additional headers set via `next.config.ts` (defense-in-depth, complements middleware):
- `X-DNS-Prefetch-Control: off`
- `X-Download-Options: noopen`
- `X-Permitted-Cross-Domain-Policies: none`
- API routes: `Cache-Control: no-store, no-cache, must-revalidate, private`
- `poweredByHeader: false`
- Turbopack root pinned to `process.cwd()` (fixes monorepo-like detection issues)

## Operations Playbook

### Deploy to Production
```bash
git push origin main
# Vercel auto-builds and deploys. Monitor at https://vercel.com/stonefreight2017-sources-projects/stone-ai
```

### Deploy Preview (for testing)
```bash
git checkout -b feature/my-change
git push origin feature/my-change
# Vercel creates a preview deployment with a unique URL
# Preview URL appears in the GitHub PR checks
```

### Rollback Procedure
1. **Vercel Dashboard** > Deployments > Find last known-good deployment > "Promote to Production"
2. **CLI alternative**: `vercel rollback` (requires Vercel CLI installed)
3. **Git revert** (preferred for traceability):
   ```bash
   git revert HEAD
   git push origin main
   # Triggers new build with reverted code
   ```
4. **Instant rollback**: Vercel keeps previous deployment artifacts. Promoting a previous deployment is near-instant (no rebuild).

### Build Cache Behavior
- Vercel caches `node_modules` and `.next/cache` between builds
- Turbo remote cache enabled (`TURBO_CACHE=remote:rw`) for faster rebuilds
- To force a clean build: Vercel Dashboard > Settings > General > "Clear Build Cache" or redeploy with `vercel --force`
- `prisma generate` runs on every build (postinstall + build script) — ensures generated client matches schema

### Vercel Function Configuration
- **Default timeout**: 10s (Hobby plan) / 60s (Pro plan)
- **Max body size**: 4.5 MB (serverless functions)
- **Streaming**: `/api/chat` uses `streamText()` with streaming responses — Vercel supports this natively
- **No edge functions declared** — all API routes run as Node.js serverless functions
- **Middleware runs at edge** — Clerk auth + security headers execute before serverless functions

### Critical: Vercel + Local vLLM Incompatibility
The `ai.ts` module detects `process.env.VERCEL` and auto-falls back to Claude Haiku when `VLLM_BASE_URL` points to localhost. This is by design — Vercel serverless functions cannot reach a local machine. When the OMEN with RTX 5090 is set up with Cloudflare Tunnel (`vllm.stone-ai.net`), update `VLLM_BASE_URL` on Vercel to that tunnel URL.

## DO / DON'T Rules

### DO
- Always set `ANTHROPIC_API_KEY` on Vercel (currently missing — SMART mode depends on it)
- Use Vercel's environment variable scoping (Production / Preview / Development) to isolate secrets
- Monitor build times — if builds exceed 5 minutes, investigate dependency bloat or missing cache
- Use `vercel env pull` to sync Vercel env vars to local `.env.vercel` for debugging
- Keep `.env*` in `.gitignore` (currently enforced)
- Run `prisma generate` as part of build — the generated client is NOT committed to git
- Test preview deployments before merging to main

### DON'T
- Don't commit `.env`, `.env.local`, or `.env.vercel` to git (contains real secrets)
- Don't set `VLLM_BASE_URL=http://127.0.0.1:8000/v1` on Vercel production — it will silently fall back to Claude Haiku, burning cloud credits
- Don't skip `prisma generate` in the build — the app will fail with missing Prisma Client errors
- Don't use `vercel.json` for headers — they're managed in `next.config.ts` and `middleware.ts` for consistency
- Don't deploy without confirming Stripe webhook secret matches the endpoint URL (prod vs preview)
- Don't assume preview deployments use a separate database — currently they share the production Neon instance (use Neon branching to fix this)
- Don't hardcode model names in env vars across environments — use the defaults in `ai.ts` and only override when intentionally changing providers
