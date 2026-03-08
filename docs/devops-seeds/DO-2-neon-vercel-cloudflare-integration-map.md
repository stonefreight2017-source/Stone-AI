# DO-2: Neon + Vercel + Cloudflare Integration Map

## Purpose
Operational reference for the Senior DevOps Engineer agent covering the full integration topology between Cloudflare (DNS/proxy), Vercel (hosting/compute), and Neon (database), plus the planned vLLM tunnel architecture. Grounded in actual config files and connection strings as of 2026-03-07.

## Current Infrastructure (from actual config)

### Service Inventory
| Service | Role | Plan | Region | Endpoint |
|---|---|---|---|---|
| **Cloudflare** | DNS + Reverse Proxy + SSL | Free (proxy ON) | Global edge | `stone-ai.net` |
| **Vercel** | App hosting + Serverless functions | Hobby | us-east-1 (auto) | `stone-ai-sooty.vercel.app` |
| **Neon** | PostgreSQL 16 + pgvector | Free/Basic | `us-east-1` (AWS) | `ep-wispy-truth-aivu1ada.c-4.us-east-1.aws.neon.tech` |
| **Clerk** | Authentication | Dev mode | Cloud | `clerk.stone-ai.net` / `*.clerk.accounts.dev` |
| **Stripe** | Payments | Test mode | Cloud | `api.stripe.com` |
| **Docker (local)** | Dev database + Redis | N/A | localhost | `stoneai-db:5432`, Redis `:6379` |

### Database Connection
```
# Production (Neon)
DATABASE_URL="postgresql://neondb_owner:***@ep-wispy-truth-aivu1ada.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Local Dev (Docker)
DATABASE_URL="postgresql://stoneai:stoneai_dev_2026@localhost:5432/stoneai"
```

**Prisma adapter**: `@prisma/adapter-pg` (PrismaPg) — uses raw `pg` driver with connection string from `DATABASE_URL`. Configured in `src/lib/db.ts`.

**Connection pooling status**: NOT enabled. Current URL uses direct connection (no `-pooler` suffix, no `?pgbouncer=true`). The health endpoint at `/api/admin/health` flags this as an info-level performance reminder.

## Architecture Diagram (text-based)

```
                         INTERNET
                            |
                            v
                 +-------------------+
                 |   Cloudflare      |
                 |   DNS + Proxy     |
                 |   SSL: Full       |
                 +-------------------+
                    |            |
          stone-ai.net    vllm.stone-ai.net
          (proxy ON)      (Cloudflare Tunnel)
                    |            |
                    v            v
         +----------------+   +------------------+
         |    Vercel       |   |  OMEN Workstation|
         |  Edge Network   |   |  RTX 5090        |
         +----------------+   |  vLLM Server      |
         | Middleware      |   |  :8000            |
         | (Edge Runtime)  |   +------------------+
         |  - Clerk auth   |         ^
         |  - Security hdrs|         |
         |  - CORS         |         | Cloudflare Tunnel
         +--------+--------+         | (cloudflared daemon)
                  |                   |
                  v                   |
         +----------------+          |
         | Serverless Fns  |         |
         | (Node.js)       |---------+
         |  - /api/chat    |  HTTP call to vllm.stone-ai.net
         |  - /api/agents  |  (when VLLM_BASE_URL is set)
         |  - /api/billing |
         |  - /api/admin   |
         +--------+--------+
                  |
                  | TLS (sslmode=require)
                  v
         +-------------------+
         |   Neon PostgreSQL  |
         |   us-east-1 AWS    |
         |   ep-wispy-truth   |
         +-------------------+
         | - PG 16 + pgvector |
         | - Auto-suspend     |
         | - Auto-scaling     |
         +--------------------+
```

## SSL/TLS Termination Points

```
Browser --> Cloudflare (TLS terminated at CF edge, re-encrypted to Vercel)
                |
                | Cloudflare SSL Mode: FULL
                | (CF validates Vercel's cert, encrypts CF<->Vercel)
                v
         Vercel (TLS terminated at Vercel edge)
                |
                | sslmode=require in DATABASE_URL
                v
         Neon (TLS terminated at Neon proxy)
```

**Three TLS hops**:
1. **Browser <-> Cloudflare**: Cloudflare's edge cert (auto-provisioned, Universal SSL)
2. **Cloudflare <-> Vercel**: Vercel's cert (`*.vercel.app`). Cloudflare SSL mode MUST be "Full" (not "Flexible") to avoid redirect loops
3. **Vercel <-> Neon**: Neon requires `sslmode=require`. TLS is enforced on all Neon connections

## Service Responsibility Boundaries

### Cloudflare Owns
- DNS resolution for `stone-ai.net` and subdomains
- DDoS protection (layer 3/4 + layer 7 via proxy)
- SSL certificate for the domain (Universal SSL)
- HTTP/2 and HTTP/3 protocol negotiation
- Cloudflare Tunnel for `vllm.stone-ai.net` (planned)
- Browser caching hints (but Vercel/Next.js controls actual Cache-Control headers)
- Bot management and challenge pages

### Vercel Owns
- Application hosting (serverless functions + static assets)
- Build pipeline (triggered by GitHub webhook)
- Edge middleware execution (Clerk auth, security headers)
- SSL certificate for `*.vercel.app`
- Serverless function execution (Node.js 20 runtime)
- Preview deployments for PRs
- Environment variable management per environment
- Function timeout enforcement (10s hobby / 60s pro)

### Neon Owns
- PostgreSQL database hosting
- Connection management and auto-suspend (scales to zero when idle)
- Automatic backups and point-in-time recovery
- pgvector extension for embeddings (`AgentKnowledgeChunk.embedding`)
- Branch management (can create DB branches for preview deployments)
- Connection pooling endpoint (available but NOT currently used)

## Neon Connection Details

### Connection String Anatomy
```
postgresql://neondb_owner:<password>@ep-wispy-truth-aivu1ada.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require
             ^^^^^^^^^^^^^           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ ^^^^^^ ^^^^^^^^^^^^^^^
             role                    endpoint (compute)                                    db     TLS required
```

- **Endpoint**: `ep-wispy-truth-aivu1ada` — this is the Neon compute endpoint
- **Region**: `c-4.us-east-1.aws` — US East 1, AWS
- **Database**: `neondb` (default)
- **Role**: `neondb_owner` (full privileges)

### Connection Pooling (NOT currently enabled)
To enable pooling, change the connection string to use the pooler endpoint:
```
# Pooler endpoint format (Neon provides this in dashboard):
postgresql://neondb_owner:<password>@ep-wispy-truth-aivu1ada-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require
                                                             ^^^^^^^
                                                             add -pooler suffix
```
Or append `?pgbouncer=true` to the existing URL. The health endpoint checks for this and flags it.

**When to enable**: At 100+ concurrent users or when DB connection errors appear. Neon free tier supports ~100 connections max.

### Prisma Client Setup (src/lib/db.ts)
```typescript
// Uses @prisma/adapter-pg for direct PostgreSQL connection
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
// Singleton pattern: cached in globalThis for dev (avoids connection leak on hot reload)
```

### Neon Auto-Suspend
Neon computes auto-suspend after 5 minutes of inactivity (free tier). First query after suspend incurs a **cold start of 500ms-2s**. This is the "Neon cold start" that affects first-request latency.

**Mitigation options**:
1. Set Neon auto-suspend to a longer timeout (paid plans)
2. Use a cron job to ping the DB every 4 minutes (keeps compute warm)
3. Accept cold starts as a cost tradeoff on free tier

## vLLM Tunnel Architecture (Planned)

### Current State
- `VLLM_BASE_URL` on Vercel points to `http://127.0.0.1:8000/v1`
- `ai.ts` detects `VERCEL=1` + localhost URL and falls back to Claude Haiku
- All LOCAL mode requests on Vercel use cloud credits (Claude Haiku)

### Target Architecture
```
Vercel Serverless Function
    |
    | HTTPS request to vllm.stone-ai.net/v1/chat/completions
    v
Cloudflare Edge (vllm.stone-ai.net)
    |
    | Cloudflare Tunnel (encrypted)
    v
cloudflared daemon (on OMEN)
    |
    | localhost forward
    v
vLLM Server (OMEN, RTX 5090)
    :8000/v1/chat/completions
    Model: meta-llama/Llama-3.1-70B-Instruct
```

### Setup Steps
1. Install `cloudflared` on OMEN workstation
2. Authenticate: `cloudflared tunnel login`
3. Create tunnel: `cloudflared tunnel create vllm-tunnel`
4. Configure `~/.cloudflared/config.yml`:
   ```yaml
   tunnel: <tunnel-id>
   credentials-file: ~/.cloudflared/<tunnel-id>.json
   ingress:
     - hostname: vllm.stone-ai.net
       service: http://localhost:8000
     - service: http_status:404
   ```
5. Add DNS record: `cloudflared tunnel route dns vllm-tunnel vllm.stone-ai.net`
6. Run: `cloudflared tunnel run vllm-tunnel` (or install as service)
7. Update Vercel env: `VLLM_BASE_URL=https://vllm.stone-ai.net/v1`

### Tunnel Security Considerations
- Cloudflare Tunnel does NOT expose any ports on OMEN — all traffic is outbound
- Add Cloudflare Access policy to restrict `vllm.stone-ai.net` to Vercel's IP ranges only
- Set `VLLM_API_KEY` on both OMEN (vLLM server) and Vercel to authenticate requests
- Monitor tunnel health via Cloudflare Zero Trust dashboard

## Common Failure Modes

### 1. Cloudflare Cache Interfering with API Responses
**Symptom**: Stale data returned from API routes, or POST requests getting cached responses.
**Cause**: Cloudflare caching is ON by default for proxy mode.
**Fix**: Already mitigated — `middleware.ts` sets `Cache-Control: no-store, no-cache, must-revalidate, private` on all `/api/*` routes. Cloudflare respects these headers. If issues persist, add a Cloudflare Page Rule: `stone-ai.net/api/*` -> Cache Level: Bypass.

### 2. Cloudflare SSL Mode Mismatch
**Symptom**: Infinite redirect loops (ERR_TOO_MANY_REDIRECTS).
**Cause**: Cloudflare SSL set to "Flexible" instead of "Full".
**Fix**: Cloudflare dashboard > SSL/TLS > set to "Full" (not "Full (Strict)" unless using a Cloudflare Origin Certificate on Vercel, which isn't standard).

### 3. Neon Cold Starts
**Symptom**: First request after idle period takes 1-3 seconds; subsequent requests are fast.
**Cause**: Neon auto-suspends compute after 5 min inactivity (free tier).
**Fix**: Accept for now. At scale, upgrade Neon plan and increase auto-suspend timeout. A keepalive cron (Vercel Cron or external) hitting `/api/health` keeps both Vercel functions and Neon warm.

### 4. Neon Connection Exhaustion
**Symptom**: `too many clients already` or `remaining connection slots are reserved` errors.
**Cause**: Serverless functions open new connections per invocation; Neon free tier caps at ~100.
**Fix**: Enable connection pooling (see Neon Connection Pooling section above). The Prisma PrismaPg adapter works with pooled connections.

### 5. Vercel Function Timeout
**Symptom**: 504 Gateway Timeout on `/api/chat` for long responses.
**Cause**: Hobby plan has 10s function timeout. Streaming responses keep the connection alive but the total execution time is still capped.
**Fix**: Upgrade to Vercel Pro (60s timeout) or use streaming (already implemented via `streamText()`) which resets the timeout on each chunk. For very long responses, the streaming approach should stay within limits.

### 6. Vercel + vLLM Localhost Fallback
**Symptom**: LOCAL mode on production uses Claude Haiku instead of Llama 70B.
**Cause**: `VLLM_BASE_URL` is `http://127.0.0.1:8000/v1` and `VERCEL=1` is set — `ai.ts` deliberately falls back.
**Fix**: This is by design until Cloudflare Tunnel is set up. Once tunnel is live, update `VLLM_BASE_URL` to `https://vllm.stone-ai.net/v1` on Vercel.

### 7. Stripe Webhook Mismatch
**Symptom**: Stripe webhook events fail with 400/401; subscription status not updating.
**Cause**: `STRIPE_WEBHOOK_SECRET` doesn't match the endpoint configured in Stripe dashboard, or the webhook URL points to preview deployment instead of production.
**Fix**: Ensure Stripe webhook endpoint is `https://stone-ai.net/api/stripe/webhook` (not the Vercel URL). Verify `STRIPE_WEBHOOK_SECRET` matches.

### 8. Preview Deployment Database Pollution
**Symptom**: Test data from preview deployments appears in production.
**Cause**: Preview deployments currently share the same `DATABASE_URL` as production.
**Fix**: Use Neon branching — create a Neon branch for each preview deployment. Set the branch's connection string as `DATABASE_URL` in Vercel's Preview environment scope.

## Operations Playbook

### Check Integration Health
```bash
# From local machine with Vercel CLI
vercel env pull  # Sync env vars to .env.vercel

# Hit the health endpoint (requires admin auth via Clerk)
curl -H "Authorization: Bearer <clerk-session-token>" https://stone-ai.net/api/admin/health
```

The health endpoint reports:
- `performance.infraStatus.databasePooling`: "direct" or "enabled"
- `performance.infraStatus.clerkMode`: "development" or "production"
- `performance.infraStatus.stripeMode`: "test" or "live"
- `performance.infraStatus.vllmConnected` / `isLocalVllm`: whether vLLM is reachable
- `scaling.alerts`: threshold-based warnings for DAU, connections, spend

### DNS Verification
```bash
# Verify Cloudflare proxy is active (should show Cloudflare IPs, not Vercel)
dig stone-ai.net +short
# Expected: 104.21.x.x or 172.67.x.x (Cloudflare IPs)

# Verify SSL chain
curl -vI https://stone-ai.net 2>&1 | grep -E "SSL|subject|issuer"
# Should show Cloudflare-issued cert
```

### Database Connectivity Test
```bash
# Test Neon connection from local
psql "postgresql://neondb_owner:***@ep-wispy-truth-aivu1ada.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require" -c "SELECT 1"

# Check connection count (from psql)
SELECT count(*) FROM pg_stat_activity;
```

### Cloudflare Tunnel Status (once set up)
```bash
# On OMEN workstation
cloudflared tunnel info vllm-tunnel
cloudflared tunnel run vllm-tunnel  # Start/restart

# Verify from outside
curl https://vllm.stone-ai.net/v1/models
```

## DO / DON'T Rules

### DO
- Keep Cloudflare SSL mode at "Full" — never "Flexible"
- Set separate `DATABASE_URL` for Vercel Preview vs Production environments
- Use Neon branching for preview deployments to avoid polluting production data
- Monitor the `/api/admin/health` endpoint weekly for scaling alerts
- Enable Neon connection pooling before reaching 100 concurrent users
- Set up Cloudflare Page Rule to bypass cache on `/api/*` as a safety net
- Keep Vercel and Neon in the same AWS region (us-east-1) to minimize latency
- Use `sslmode=require` in all Neon connection strings — never disable TLS
- Plan for Vercel Pro upgrade when function timeouts become an issue

### DON'T
- Don't set Cloudflare SSL to "Flexible" — it causes infinite redirect loops with Vercel
- Don't expose the Neon connection string in client-side code (NEXT_PUBLIC_ prefix)
- Don't run database migrations from Vercel builds — run them manually or via CI
- Don't assume Neon is always warm — first request after 5 min idle has cold start latency
- Don't point `VLLM_BASE_URL` to localhost on Vercel and expect it to work — it falls back silently
- Don't create Cloudflare Tunnel without Access policies — restrict to Vercel's egress IPs
- Don't ignore the health endpoint's pooling warning — connection exhaustion will crash the app at scale
- Don't use Cloudflare "Full (Strict)" SSL unless you install a Cloudflare Origin Certificate on Vercel (unnecessary complexity)
- Don't cache API responses at Cloudflare level — all API routes must be `Cache-Control: no-store`
