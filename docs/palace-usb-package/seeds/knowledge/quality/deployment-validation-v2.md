# Enhanced Deployment Validation — Wiz v3 Seed

> Computer Wiz (Royal Guard — The Diagnostician)
> Seed Class: Quality / Deployment Validation
> Version: 3.0 — Full Software + Hardware Diagnostic Coverage
> Created: 2026-03-09

---

## 1. Philosophy: Deploy Is Not Done Until It's Verified

Pushing code to production is only half the job. The other half — the half most teams skip — is verifying that the deployment actually works. Every deploy is guilty until proven innocent. Wiz treats every deployment as a suspect that must pass interrogation before being trusted with real users.

**The Deployment Validation Protocol:**
1. **Pre-deploy:** Environment and dependency checks
2. **Deploy:** Push code, monitor for build/deploy errors
3. **Post-deploy:** Smoke tests, health checks, metric validation
4. **Sustained:** Monitor for 15-60 minutes for delayed failures
5. **Rollback ready:** Always have a one-click rollback plan BEFORE deploying

---

## 2. Smoke Test Design

### 2.1 What Smoke Tests Are

Smoke tests are the minimum set of tests that prove the application is fundamentally working after a deployment. They test the critical path — the things that, if broken, mean the entire application is unusable.

**Smoke tests are NOT:**
- Comprehensive test suites (those run in CI before deploy)
- Performance tests (those have separate infrastructure)
- Edge case tests (those are for integration/unit testing)

**Smoke tests ARE:**
- Fast (complete in < 60 seconds total)
- Critical path only (auth works, main page loads, core API responds)
- Run against the actual deployed environment
- Automated and repeatable

### 2.2 Stone AI Critical Path Smoke Tests

```typescript
// scripts/smoke-test.ts
// Run after every deployment: npx tsx scripts/smoke-test.ts

const BASE_URL = process.env.SMOKE_TEST_URL || 'https://stone-ai.net';
const TIMEOUT = 10000; // 10 seconds per test

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, passed: true, duration: Date.now() - start });
    console.log(`  ✓ ${name} (${Date.now() - start}ms)`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, duration: Date.now() - start, error: msg });
    console.error(`  ✗ ${name}: ${msg} (${Date.now() - start}ms)`);
  }
}

async function fetchWithTimeout(url: string, options?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

async function runSmokeTests() {
  console.log(`\nSmoke Testing: ${BASE_URL}\n`);

  // 1. Homepage loads
  await test('Homepage returns 200', async () => {
    const res = await fetchWithTimeout(BASE_URL);
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
    const html = await res.text();
    if (!html.includes('Stone AI')) throw new Error('Missing expected content');
  });

  // 2. Health endpoint
  await test('Health check passes', async () => {
    const res = await fetchWithTimeout(`${BASE_URL}/api/health`);
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
    const data = await res.json();
    if (data.status !== 'healthy') throw new Error(`Status: ${data.status}`);
  });

  // 3. Static assets load
  await test('Static assets accessible', async () => {
    const res = await fetchWithTimeout(`${BASE_URL}/_next/static/`, { method: 'HEAD' });
    // 404 is fine (directory listing), we just need the server to respond
    if (res.status >= 500) throw new Error(`Status: ${res.status}`);
  });

  // 4. Auth endpoint responds
  await test('Auth endpoint responds', async () => {
    const res = await fetchWithTimeout(`${BASE_URL}/api/auth/session`);
    // 401 is expected without auth token — just verify it responds
    if (res.status >= 500) throw new Error(`Status: ${res.status}`);
  });

  // 5. Database connectivity (via API)
  await test('Database reachable via API', async () => {
    const res = await fetchWithTimeout(`${BASE_URL}/api/health`);
    const data = await res.json();
    if (!data.database || data.database !== 'connected') {
      throw new Error(`Database: ${data.database || 'unknown'}`);
    }
  });

  // 6. API route responds with correct content type
  await test('API returns JSON', async () => {
    const res = await fetchWithTimeout(`${BASE_URL}/api/health`);
    const contentType = res.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new Error(`Content-Type: ${contentType}`);
    }
  });

  // 7. Security headers present
  await test('Security headers present', async () => {
    const res = await fetchWithTimeout(BASE_URL);
    const required = ['x-frame-options', 'x-content-type-options'];
    for (const header of required) {
      if (!res.headers.get(header)) {
        throw new Error(`Missing header: ${header}`);
      }
    }
  });

  // 8. No mixed content (HTTPS)
  await test('HTTPS enforced', async () => {
    const res = await fetchWithTimeout(BASE_URL);
    const url = new URL(res.url);
    if (url.protocol !== 'https:') {
      throw new Error(`Protocol: ${url.protocol}`);
    }
  });

  // Summary
  console.log('\n--- Summary ---');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  console.log(`Passed: ${passed}/${results.length} | Failed: ${failed} | Duration: ${totalDuration}ms`);

  if (failed > 0) {
    console.error('\nFAILED TESTS:');
    results.filter(r => !r.passed).forEach(r => {
      console.error(`  ${r.name}: ${r.error}`);
    });
    process.exit(1);
  }

  console.log('\nAll smoke tests passed.');
}

runSmokeTests().catch(err => {
  console.error('Smoke test runner failed:', err);
  process.exit(1);
});
```

### 2.3 Running Smoke Tests

```bash
# After Vercel deploy
SMOKE_TEST_URL=https://stone-ai.net npx tsx scripts/smoke-test.ts

# Against preview deployment
SMOKE_TEST_URL=https://stone-ai-xxx.vercel.app npx tsx scripts/smoke-test.ts

# In CI/CD (add to GitHub Actions)
# - name: Smoke Tests
#   run: SMOKE_TEST_URL=${{ steps.deploy.outputs.url }} npx tsx scripts/smoke-test.ts
```

---

## 3. Canary Deployment Validation

### 3.1 Canary Strategy for Vercel

Vercel doesn't have built-in canary deployments, but you can achieve similar results:

```
Strategy: Preview Deploy → Validate → Promote to Production

1. Push to branch → Vercel creates preview deployment
2. Run smoke tests against preview URL
3. Manual or automated review of preview
4. Merge to main → Vercel deploys to production
5. Run smoke tests against production
6. Monitor metrics for 30 minutes
7. If problems → rollback (instant on Vercel)

Vercel Rollback:
  Dashboard → Deployments → find last good deployment → ⋮ → Promote to Production
  CLI: vercel rollback
```

### 3.2 Metrics to Watch During Canary

```
First 5 minutes after deploy:
  [ ] Error rate (should not increase >2x baseline)
  [ ] Response time p95 (should not increase >50%)
  [ ] CPU/Memory (should not spike >30% above baseline)
  [ ] No new error types in logs

5-30 minutes after deploy:
  [ ] Error rate stabilized to baseline
  [ ] Response time returned to baseline
  [ ] No memory growth trend (leak detection)
  [ ] User-facing functionality verified (manual spot-check)

30-60 minutes after deploy:
  [ ] All metrics nominal
  [ ] No customer reports
  [ ] Cron jobs executing successfully
  [ ] Background tasks completing
```

### 3.3 Rollback Triggers

```
IMMEDIATE ROLLBACK (no deliberation):
  - Error rate > 5x baseline for > 2 minutes
  - Health check failing
  - Database migration caused data corruption
  - Auth completely broken (no users can log in)
  - Payment processing broken

INVESTIGATE THEN ROLLBACK (5-minute window):
  - Error rate > 2x baseline sustained
  - Response time p95 > 3x baseline
  - New error type appearing at high rate
  - Specific feature broken that was supposed to work

MONITOR (don't rollback yet):
  - Slight error rate increase (< 2x baseline)
  - Response time slightly elevated
  - Isolated errors for specific edge cases
  - Expected behavioral changes from the deploy
```

---

## 4. Health Check Design

### 4.1 Health Check Patterns

```
Three health endpoints, three purposes:

/health (or /api/health) — LIVENESS
  "Is the process alive and responding?"
  Returns 200 if the server can handle HTTP requests.
  Does NOT check dependencies.
  Used by: process managers, basic uptime monitors.
  Should be: fast (<50ms), no external calls.

/ready (or /api/ready) — READINESS
  "Can this instance handle real traffic?"
  Returns 200 only if ALL dependencies are reachable.
  Checks: database, auth service, AI provider, Redis.
  Used by: load balancers, canary validation.
  Can be: slower (up to 5s timeout per dependency).

/live (or /api/live) — DEEP HEALTH
  "Is everything working correctly?"
  Runs lightweight functional tests.
  Checks: can read from DB, can validate a token, can reach AI.
  Used by: deployment validation, monitoring dashboards.
  Should be: thorough but not destructive.
```

### 4.2 Health Check Implementation

```typescript
// app/api/health/route.ts — Liveness + Readiness combined
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: Record<string, {
    status: 'pass' | 'fail';
    duration: number;
    message?: string;
  }>;
}

async function checkDatabase(): Promise<{ ok: boolean; duration: number; error?: string }> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, duration: Date.now() - start };
  } catch (error) {
    return {
      ok: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkExternalService(
  name: string,
  url: string,
  timeout = 5000
): Promise<{ ok: boolean; duration: number; error?: string }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return { ok: res.ok, duration: Date.now() - start };
  } catch (error) {
    return {
      ok: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const deep = url.searchParams.get('deep') === 'true';

  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev',
    uptime: process.uptime(),
    checks: {},
  };

  // Always check database
  const db = await checkDatabase();
  health.checks.database = {
    status: db.ok ? 'pass' : 'fail',
    duration: db.duration,
    message: db.error,
  };

  // Deep check: verify external services
  if (deep) {
    const clerkCheck = await checkExternalService(
      'clerk',
      'https://api.clerk.com/v1/health'
    );
    health.checks.clerk = {
      status: clerkCheck.ok ? 'pass' : 'fail',
      duration: clerkCheck.duration,
      message: clerkCheck.error,
    };

    // Add more deep checks as needed:
    // AI provider, Redis, etc.
  }

  // Determine overall status
  const failedChecks = Object.values(health.checks).filter(c => c.status === 'fail');
  if (failedChecks.length > 0) {
    // If database is down, we're unhealthy
    if (health.checks.database?.status === 'fail') {
      health.status = 'unhealthy';
    } else {
      health.status = 'degraded';
    }
  }

  const statusCode = health.status === 'unhealthy' ? 503 : 200;
  return Response.json(health, { status: statusCode });
}
```

### 4.3 Health Check Best Practices

```
DO:
  ✓ Return fast (< 1 second for liveness, < 10 seconds for deep)
  ✓ Return structured JSON (not just "OK")
  ✓ Include version/commit SHA (know what's deployed)
  ✓ Include uptime (detect restart loops)
  ✓ Check all critical dependencies in readiness
  ✓ Return appropriate HTTP status codes (200 = healthy, 503 = unhealthy)
  ✓ Cache dependency checks briefly (don't hammer DB with health checks)

DON'T:
  ✗ Make health checks require authentication (monitors can't auth)
  ✗ Do heavy computation in health checks (they're called frequently)
  ✗ Modify data in health checks (side effects)
  ✗ Return 200 when something is broken (defeats the purpose)
  ✗ Include sensitive information (connection strings, credentials)
  ✗ Let health check failures cascade (a failing health check shouldn't kill the app)
```

---

## 5. Dependency Verification Chains

### 5.1 Dependency Map for Stone AI

```
Stone AI Dependency Chain:
┌──────────────────────────────────────────────────────┐
│  Vercel (Hosting)                                     │
│  ├── Cloudflare (DNS + CDN + SSL)                    │
│  ├── Neon (PostgreSQL + pgvector)                    │
│  │   └── Connection via pooler URL (PgBouncer)       │
│  ├── Clerk (Authentication)                           │
│  │   └── Clerk Dashboard + API                       │
│  ├── Stripe (Payments — test mode)                   │
│  │   └── Webhooks to /api/webhooks/stripe            │
│  ├── AI Providers                                     │
│  │   ├── vLLM + Qwen 2.5 32B AWQ (local/OMEN)      │
│  │   ├── Anthropic Claude Sonnet (cloud/SMART)       │
│  │   └── Claude Haiku (Vercel fallback)              │
│  └── GitHub (Source + CI/CD)                         │
│      └── stonefreight2017-source/Stone-AI            │
└──────────────────────────────────────────────────────┘
```

### 5.2 Dependency Verification Script

```typescript
// scripts/verify-dependencies.ts
// Run before or after deploy to verify all external services

interface DependencyCheck {
  name: string;
  critical: boolean; // If true, deploy should not proceed
  check: () => Promise<{ ok: boolean; latency: number; details?: string }>;
}

const dependencies: DependencyCheck[] = [
  {
    name: 'Neon Database',
    critical: true,
    check: async () => {
      const start = Date.now();
      try {
        // Direct connection test
        const res = await fetch(process.env.HEALTH_URL + '/api/health');
        const data = await res.json();
        return {
          ok: data.checks?.database?.status === 'pass',
          latency: Date.now() - start,
          details: data.checks?.database?.message,
        };
      } catch (e) {
        return { ok: false, latency: Date.now() - start, details: String(e) };
      }
    },
  },
  {
    name: 'Clerk Auth',
    critical: true,
    check: async () => {
      const start = Date.now();
      try {
        const res = await fetch('https://api.clerk.com/v1/health');
        return { ok: res.ok, latency: Date.now() - start };
      } catch (e) {
        return { ok: false, latency: Date.now() - start, details: String(e) };
      }
    },
  },
  {
    name: 'Stripe API',
    critical: false, // Degraded but functional without payments
    check: async () => {
      const start = Date.now();
      try {
        const res = await fetch('https://api.stripe.com/v1/', {
          headers: { 'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}` },
        });
        return { ok: res.status !== 500, latency: Date.now() - start };
      } catch (e) {
        return { ok: false, latency: Date.now() - start, details: String(e) };
      }
    },
  },
  {
    name: 'Cloudflare DNS',
    critical: true,
    check: async () => {
      const start = Date.now();
      try {
        const res = await fetch('https://cloudflare-dns.com/dns-query?name=stone-ai.net&type=A', {
          headers: { 'Accept': 'application/dns-json' },
        });
        const data = await res.json();
        return {
          ok: data.Status === 0 && data.Answer?.length > 0,
          latency: Date.now() - start,
          details: `Resolved to: ${data.Answer?.map((a: any) => a.data).join(', ')}`,
        };
      } catch (e) {
        return { ok: false, latency: Date.now() - start, details: String(e) };
      }
    },
  },
  {
    name: 'Anthropic API',
    critical: false, // Fallback to Haiku
    check: async () => {
      const start = Date.now();
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': process.env.ANTHROPIC_API_KEY || '',
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'ping' }],
          }),
        });
        return { ok: res.ok, latency: Date.now() - start };
      } catch (e) {
        return { ok: false, latency: Date.now() - start, details: String(e) };
      }
    },
  },
];

async function verifyDependencies() {
  console.log('\n=== Dependency Verification ===\n');

  let criticalFailure = false;

  for (const dep of dependencies) {
    const result = await dep.check();
    const status = result.ok ? 'PASS' : (dep.critical ? 'FAIL (CRITICAL)' : 'FAIL (non-critical)');
    const icon = result.ok ? '[OK]' : '[!!]';

    console.log(`${icon} ${dep.name}: ${status} (${result.latency}ms)`);
    if (result.details) console.log(`     ${result.details}`);

    if (!result.ok && dep.critical) {
      criticalFailure = true;
    }
  }

  console.log('\n--- Result ---');
  if (criticalFailure) {
    console.error('CRITICAL DEPENDENCY FAILURE — DO NOT DEPLOY');
    process.exit(1);
  } else {
    console.log('All critical dependencies verified.');
  }
}

verifyDependencies().catch(err => {
  console.error('Dependency verification failed:', err);
  process.exit(1);
});
```

### 5.3 Dependency Failure Response Matrix

| Dependency | If Down | User Impact | Response |
|-----------|---------|-------------|----------|
| Neon DB | Block deploy, rollback if post-deploy | Total outage | Immediate rollback |
| Clerk Auth | Block deploy | No login, no access | Immediate rollback |
| Stripe | Proceed with warning | Can't subscribe/upgrade | Monitor, fix async |
| Cloudflare | Cannot deploy (DNS) | Site unreachable | Check Cloudflare status |
| Anthropic API | Proceed | Falls back to Haiku | Monitor AI quality |
| vLLM (local) | Proceed | Falls back to cloud AI | Not relevant for Vercel deploy |
| GitHub | Cannot trigger deploy | No CI/CD | Wait for GitHub recovery |
| Vercel | Cannot deploy | Site may be affected | Check Vercel status |

---

## 6. Environment Parity Checks

### 6.1 The Parity Problem

```
"Works in dev, broken in prod" — caused by environment differences:

Common Drift Points:
├── Node.js version (local v20 vs Vercel v22)
├── Environment variables (different values, missing vars)
├── Database schema (migration not applied in prod)
├── Dependencies (devDependencies used at runtime)
├── File system (local has files that deploy doesn't)
├── Network (local has no CORS, prod does)
├── Authentication (dev uses test keys, prod uses real)
└── Feature flags (enabled in dev, disabled in prod)
```

### 6.2 Environment Parity Checklist

```bash
# Node.js version parity
echo "Local: $(node -v)"
# Vercel: check package.json engines or .nvmrc
cat .nvmrc 2>/dev/null || grep '"node"' package.json

# Environment variable parity
# List required env vars (from .env.example or documentation)
# For each: verify it exists in Vercel dashboard for both Preview and Production

# Database schema parity
npx prisma migrate status
# Should show: "Database schema is up to date!"
# If not: migrations need to be applied

# Dependency parity
npm ci --dry-run  # Verify lockfile is in sync
npm ls --all 2>&1 | grep -c "ERR"  # Count dependency errors

# Build parity (build locally with prod settings)
NODE_ENV=production npm run build
# If build fails locally with prod settings, it'll fail on Vercel too
```

### 6.3 Environment Drift Detection Script

```bash
#!/bin/bash
# scripts/check-env-parity.sh
# Compare local environment against production expectations

echo "=== Environment Parity Check ==="

# 1. Node version
LOCAL_NODE=$(node -v)
EXPECTED_NODE=$(cat .nvmrc 2>/dev/null || echo "v22")
if [[ "$LOCAL_NODE" != "$EXPECTED_NODE"* ]]; then
  echo "[WARN] Node version mismatch: local=$LOCAL_NODE expected=$EXPECTED_NODE"
else
  echo "[OK] Node version: $LOCAL_NODE"
fi

# 2. Required environment variables
REQUIRED_VARS=(
  "DATABASE_URL"
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
  "CLERK_SECRET_KEY"
  "STRIPE_SECRET_KEY"
  "STRIPE_WEBHOOK_SECRET"
  "ENCRYPTION_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "[FAIL] Missing: $var"
  else
    echo "[OK] Set: $var (${#!var} chars)"
  fi
done

# 3. Prisma schema
echo ""
npx prisma migrate status 2>&1 | tail -3

# 4. Build check
echo ""
echo "Running production build check..."
NODE_ENV=production npx next build 2>&1 | tail -5
```

---

## 7. Vercel-Specific Deployment Validation

### 7.1 Vercel Deployment Lifecycle

```
Push to GitHub
  ↓
Vercel Webhook Triggered
  ↓
Build Phase:
  ├── Install dependencies (npm ci)
  ├── Run build command (next build)
  ├── Generate serverless functions
  └── Upload static assets to CDN
  ↓
Deploy Phase:
  ├── Create new deployment URL
  ├── Assign to preview (branch) or production (main)
  └── Update DNS/routing
  ↓
Validation Window:
  ├── Run smoke tests (YOUR responsibility)
  ├── Check Vercel deployment status
  └── Monitor for errors
  ↓
Stable / Rollback
```

### 7.2 Vercel CLI Deployment Commands

```bash
# Check deployment status
npx vercel ls --limit 5

# Get deployment details
npx vercel inspect <deployment-url>

# View deployment logs
npx vercel logs <deployment-url> --follow

# Rollback to previous production deployment
npx vercel rollback

# Promote a preview deployment to production
npx vercel promote <deployment-url>

# Environment variables (check what's set)
npx vercel env ls
npx vercel env ls production
npx vercel env ls preview
```

### 7.3 Vercel Deployment Validation Checklist

```
PRE-DEPLOY:
  [ ] All tests passing locally (npm test)
  [ ] Production build succeeds locally (npm run build)
  [ ] Environment variables verified for target environment
  [ ] Database migrations applied (npx prisma migrate deploy)
  [ ] No console.log debugging left in code
  [ ] Dependencies audited (npm audit)
  [ ] Bundle size checked (not significantly larger than previous)

POST-DEPLOY (within 5 minutes):
  [ ] Vercel deployment status is "Ready"
  [ ] Smoke tests passing against deployment URL
  [ ] Health endpoint returning healthy
  [ ] Homepage loads correctly
  [ ] Auth flow works (sign in → dashboard)
  [ ] Core feature works (create a chat, get AI response)
  [ ] No new errors in Vercel function logs
  [ ] SSL/HTTPS working (no certificate errors)

SUSTAINED MONITORING (15-60 minutes):
  [ ] Error rate stable (not increasing)
  [ ] Response times stable
  [ ] No memory growth in function metrics
  [ ] Cron jobs still running
  [ ] Webhook endpoints responding (Stripe, Clerk)
  [ ] No user-reported issues
```

### 7.4 Vercel Rollback Process

```
WHEN TO ROLLBACK:
  Any critical smoke test fails after deploy.
  Error rate > 5x normal within 5 minutes.
  Health check failing.
  Auth completely broken.

HOW TO ROLLBACK:
  Option 1 (Dashboard — fastest):
    Vercel Dashboard → Project → Deployments
    → Find last known-good deployment (green checkmark)
    → Click ⋮ → "Promote to Production"
    → Confirm

  Option 2 (CLI):
    npx vercel rollback
    # Rolls back to previous production deployment

  Option 3 (Git revert):
    git revert HEAD
    git push origin main
    # Triggers new deployment with reverted code
    # Slower but creates audit trail

AFTER ROLLBACK:
  1. Verify rollback succeeded (smoke tests)
  2. Investigate what went wrong
  3. Fix the issue in a branch
  4. Re-deploy when fixed
  5. Document in incident log
```

---

## 8. Pre-Deployment Clearance Report (Wiz Template)

Every production deployment should have a clearance report from Wiz:

```markdown
## Deployment Clearance Report
Date: [date]
Deployment: [commit SHA / PR number]
Cleared by: Computer Wiz (Royal Guard)

### Pre-Flight Checks
| Check | Status | Notes |
|-------|--------|-------|
| Local build passes | PASS/FAIL | |
| Tests passing | PASS/FAIL | X/Y tests |
| DB migrations | PASS/SKIP | Migration name or "No migrations" |
| Env vars verified | PASS/FAIL | All required vars present |
| Bundle size | PASS/WARN | XXX KB (delta: +/-XX KB) |
| Security audit | PASS/WARN | npm audit results |
| Dependency check | PASS/FAIL | No conflicts |

### Dependency Verification
| Service | Status | Latency | Notes |
|---------|--------|---------|-------|
| Neon Database | UP/DOWN | XXms | |
| Clerk Auth | UP/DOWN | XXms | |
| Stripe API | UP/DOWN | XXms | |
| Cloudflare | UP/DOWN | XXms | |
| AI Provider | UP/DOWN | XXms | |

### Risk Assessment
- Change scope: [small/medium/large]
- Database changes: [yes/no]
- Auth changes: [yes/no]
- Payment changes: [yes/no]
- Risk level: [low/medium/high]
- Rollback plan: [documented/not documented]

### Clearance Decision
[ ] CLEARED FOR DEPLOYMENT
[ ] BLOCKED — [reason]
[ ] CLEARED WITH CONDITIONS — [conditions]

### Post-Deploy Validation Plan
1. [specific smoke tests to run]
2. [specific metrics to monitor]
3. [rollback trigger conditions]
```

---

## 9. Continuous Deployment Safety Net

### 9.1 GitHub Actions Integration

```yaml
# .github/workflows/deploy-validation.yml
name: Deploy Validation

on:
  deployment_status:
    types: [completed]

jobs:
  smoke-test:
    if: github.event.deployment_status.state == 'success'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install dependencies
        run: npm ci

      - name: Run smoke tests
        env:
          SMOKE_TEST_URL: ${{ github.event.deployment_status.target_url }}
        run: npx tsx scripts/smoke-test.ts

      - name: Notify on failure
        if: failure()
        run: |
          echo "Smoke tests FAILED for deployment: ${{ github.event.deployment_status.target_url }}"
          # Add notification (email, Slack, etc.)
```

### 9.2 Deployment Frequency and Safety

```
Stone AI Deployment Safety Rules:

1. NO deployments on Fridays after 3pm (weekend risk)
2. NO deployments during peak hours (10am-12pm, 2pm-4pm) unless emergency
3. Database migrations deploy SEPARATELY from app code
   - Migration first → verify → then app code
4. Major features behind feature flags
5. Maximum 1 production deploy per hour (avoid deploy storm)
6. Every deploy has a designated "watcher" for 30 minutes
7. Rollback always available within 60 seconds
```

---

## 10. Post-Deployment Monitoring Integration

### 10.1 What to Monitor After Every Deploy

```
Minute 0-5:   Smoke tests, health checks, error rate
Minute 5-15:  Response time percentiles, new error types
Minute 15-30: Memory trends, connection pool usage
Minute 30-60: Full stability confirmation, user reports
Hour 1-24:    Cron jobs, scheduled tasks, background processing
```

### 10.2 Deployment Metric Comparison

```
Compare these metrics (this deploy vs last deploy):

Error Rate:
  Before: X errors/min
  After:  Y errors/min
  Delta:  +/-Z% (acceptable: < 20% increase)

Response Time (p95):
  Before: X ms
  After:  Y ms
  Delta:  +/-Z% (acceptable: < 30% increase)

Memory Usage:
  Before: X MB average
  After:  Y MB average
  Delta:  +/-Z% (acceptable: < 20% increase, no upward trend)

Bundle Size:
  Before: X KB
  After:  Y KB
  Delta:  +/-Z KB (warn: > 50KB increase, block: > 200KB increase)
```

---

*This seed is the gatekeeper. No deployment reaches users without passing Wiz's validation. Every deploy is guilty until proven innocent.*
