# Pre-Deployment Clearance Protocol
## Ordered Gate System — Every Gate Must Pass Before Proceeding

Version: 1.0 | Stack: Next.js 16 + Prisma 7 + Clerk + Stripe + vLLM | Platform: Vercel

---

## GATE 0: CODE INTEGRITY

### 0.1 Build Passes
```bash
# Run from project root
npm run build

# Expected: "Compiled successfully"
# FAIL conditions:
#   - Any "Error:" in output → STOP
#   - Any "Warning:" → LOG but continue (unless security-related)
#   - Exit code != 0 → STOP
```

### 0.2 Type-Check Clean
```bash
npx tsc --noEmit

# ZERO errors required. Not "only 3 errors." ZERO.
# Common blockers:
#   - "not assignable to type" → fix the type, don't use 'as any'
#   - "possibly undefined" → add null check or assert with evidence
#   - "implicit any" → add explicit type annotation
```

### 0.3 Lint Clean
```bash
npm run lint

# ZERO errors. Warnings acceptable only if pre-existing.
# New warnings from changed files → fix before deploy.
```

**Gate 0 Evidence Required:**
- [ ] Screenshot or log of clean build output
- [ ] Screenshot or log of `tsc --noEmit` with 0 errors
- [ ] Screenshot or log of lint with 0 new warnings
- [ ] Timestamp of each check

---

## GATE 1: ENVIRONMENT VERIFICATION

### 1.1 Environment Variables Checklist
```
Decision tree for env verification:

START → Which environment?
  │
  ├─ LOCAL (.env.local)
  │   ├─ DATABASE_URL points to local/dev DB? → ✓
  │   ├─ CLERK keys are DEV keys (start with pk_test_/sk_test_)? → ✓
  │   ├─ STRIPE keys are TEST keys (start with sk_test_/pk_test_)? → ✓
  │   ├─ NEXT_PUBLIC_* vars all present? → ✓
  │   └─ No production secrets in .env.local? → ✓
  │
  ├─ PREVIEW (Vercel preview deployments)
  │   ├─ DATABASE_URL points to Neon branch (not main)? → ✓
  │   ├─ Clerk/Stripe keys match preview config? → ✓
  │   └─ Preview-specific overrides applied? → ✓
  │
  └─ PRODUCTION (Vercel production)
      ├─ DATABASE_URL points to Neon main branch? → ✓
      ├─ CLERK keys are LIVE (pk_live_/sk_live_)? → ✓
      ├─ STRIPE keys are LIVE? → ✓
      ├─ ANTHROPIC_API_KEY present and valid? → ✓
      ├─ All NEXT_PUBLIC_* vars set in Vercel dashboard? → ✓
      └─ No test keys in production? → CRITICAL CHECK
```

### 1.2 Env Var Validation Script Template
```typescript
// lib/env-check.ts — run at build time
const REQUIRED_VARS = [
  'DATABASE_URL',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
] as const;

function validateEnv() {
  const missing = REQUIRED_VARS.filter(v => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(`Missing env vars: ${missing.join(', ')}`);
  }
  // Detect test/live contamination
  if (process.env.NODE_ENV === 'production') {
    if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
      throw new Error('CRITICAL: Test Stripe key in production');
    }
    if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_test_')) {
      throw new Error('CRITICAL: Test Clerk key in production');
    }
  }
}
```

**Gate 1 Evidence Required:**
- [ ] Env validation script ran without errors
- [ ] No test keys in production config
- [ ] All required vars present for target environment
- [ ] Timestamp

---

## GATE 2: DATABASE READINESS

### 2.1 Migration Status
```bash
# Check for pending migrations
npx prisma migrate status

# Expected: "Database schema is up to date"
# If pending migrations exist:
#   1. Review migration SQL
#   2. Check for destructive operations (DROP, ALTER column type)
#   3. If destructive → require explicit founder approval
#   4. Apply: npx prisma migrate deploy
```

### 2.2 Schema Drift Detection
```bash
# Check if schema.prisma matches DB
npx prisma db pull --print | diff - prisma/schema.prisma

# Any diff = STOP. Schema has drifted.
# Resolution:
#   - If DB ahead of schema → pull changes, review, commit
#   - If schema ahead of DB → run migrate deploy
#   - If both changed → manual reconciliation required
```

### 2.3 Seed Data Integrity
```
Checklist:
  [ ] Default tiers exist (FREE, STARTER, PLUS, SMART, PRO)
  [ ] All 40 agents have records in DB
  [ ] Agent tier assignments match pricing table
  [ ] Backdrop pool populated (15 preset + 3 premium + 100 pool)
  [ ] Emote set complete (24 emotes)
```

**Gate 2 Evidence Required:**
- [ ] `prisma migrate status` output showing up-to-date
- [ ] No schema drift detected
- [ ] Seed data verification query results
- [ ] Timestamp

---

## GATE 3: HEALTH ENDPOINT VERIFICATION

### 3.1 Health Check Implementation
```typescript
// app/api/health/route.ts — minimum viable health check
export async function GET() {
  const checks = {
    server: true,
    database: false,
    timestamp: new Date().toISOString(),
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (e) {
    checks.database = false;
  }

  const healthy = checks.server && checks.database;
  return Response.json(checks, { status: healthy ? 200 : 503 });
}
```

### 3.2 Health Verification Commands
```bash
# Local
curl -s http://localhost:3000/api/health | jq .

# Production
curl -s https://stone-ai.net/api/health | jq .

# Expected response:
# { "server": true, "database": true, "timestamp": "..." }
# Status: 200

# FAIL conditions:
#   - Status != 200 → STOP deployment
#   - database: false → check DATABASE_URL and Neon status
#   - Timeout (>5s) → check cold start / connection pooling
```

**Gate 3 Evidence Required:**
- [ ] Health endpoint returns 200 with all checks passing
- [ ] Response time < 2 seconds
- [ ] Timestamp

---

## GATE 4: SMOKE TEST SUITE

### 4.1 Five Critical Smoke Tests
```
TEST 1 — HEALTH: GET /api/health → 200
TEST 2 — AUTH:   GET /api/auth/check → valid session or 401 (not 500)
TEST 3 — AGENT:  POST /api/chat with valid agent → streamed response starts
TEST 4 — WEBHOOK: POST /api/webhooks/stripe with test sig → 200 (not 400/500)
TEST 5 — DB READ: GET /api/agents → returns agent list (not empty, not error)
```

### 4.2 Smoke Test Script Template
```bash
#!/bin/bash
BASE_URL="${1:-https://stone-ai.net}"
PASS=0
FAIL=0

smoke() {
  local name="$1" method="$2" url="$3" expected="$4"
  status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url")
  if [ "$status" = "$expected" ]; then
    echo "PASS: $name (HTTP $status)"
    ((PASS++))
  else
    echo "FAIL: $name (expected $expected, got $status)"
    ((FAIL++))
  fi
}

smoke "Health"    GET  "$BASE_URL/api/health"   200
smoke "Auth"      GET  "$BASE_URL/api/auth/check" 401  # 401 expected when not authed
smoke "Agents"    GET  "$BASE_URL/api/agents"    200

echo ""
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -gt 0 ] && exit 1 || exit 0
```

**Gate 4 Evidence Required:**
- [ ] All 5 smoke tests passing
- [ ] Response times logged for each
- [ ] Timestamp

---

## GATE 5: CANARY RAMP

### 5.1 Ramp Schedule
```
Stage 1:  1% traffic  → monitor 5 minutes  → check metrics
Stage 2:  5% traffic  → monitor 10 minutes → check metrics
Stage 3: 25% traffic  → monitor 15 minutes → check metrics
Stage 4: 100% traffic → monitor 30 minutes → declare stable

Vercel handles traffic splitting automatically via deployment promotion.
For manual control: use Vercel's "Instant Rollback" feature.
```

### 5.2 Metrics to Monitor at Each Stage
```
| Metric               | Baseline | Warn      | Critical (→ Rollback) |
|----------------------|----------|-----------|----------------------|
| Error rate           | <0.1%    | >0.3%     | >0.5%                |
| P50 latency          | <200ms   | >400ms    | >800ms               |
| P99 latency          | <1000ms  | >2000ms   | >4000ms              |
| 5xx rate             | <0.01%   | >0.05%    | >0.1%                |
| Memory usage         | <256MB   | >384MB    | >512MB               |
| DB connection pool   | <50%     | >70%      | >85%                 |
| Edge function cold   | <100ms   | >250ms    | >500ms               |
```

---

## GATE 6: ROLLBACK DECISION TREE

```
TRIGGER CHECK (at any canary stage):
  │
  ├─ Error rate > 0.5%? ────────────────────────────── YES → ROLLBACK NOW
  ├─ P99 latency > 2x baseline? ───────────────────── YES → ROLLBACK NOW
  ├─ Any 5xx on critical path (auth, billing, chat)? → YES → ROLLBACK NOW
  ├─ DB connection pool > 85%? ─────────────────────── YES → ROLLBACK NOW
  ├─ Users reporting broken functionality? ──────────── YES → ROLLBACK NOW
  │
  ├─ Error rate 0.3%-0.5%? ─────── HOLD current stage, investigate for 10 min
  │   ├─ Trending down → cautiously continue ramp
  │   └─ Stable or trending up → ROLLBACK
  │
  └─ All metrics green → proceed to next ramp stage
```

### Rollback Procedure
```bash
# Vercel instant rollback (preferred)
# Via dashboard: Deployments → Previous stable → "Instant Rollback"

# Via CLI:
vercel rollback [deployment-url]

# Post-rollback verification:
# 1. Run smoke suite against production URL
# 2. Verify health endpoint returns 200
# 3. Check error rate returns to baseline within 5 minutes
# 4. Notify team/founder of rollback with reason
```

---

## VERCEL-SPECIFIC CHECKS

### Edge Function Cold Start
```
Measurement:
  curl -w "time_total: %{time_total}\n" -o /dev/null -s https://stone-ai.net/api/health

  First request after deploy = cold start
  Acceptable: < 500ms cold, < 100ms warm
  If cold start > 1s → investigate middleware chain, bundle size
```

### ISR Cache Invalidation
```
After deploy, verify:
  1. Static pages show updated content (not stale cache)
  2. revalidatePath/revalidateTag working for dynamic content
  3. On-demand revalidation API functional

Test: Change a visible element → deploy → verify change visible
If stale content persists → manual purge or revalidation API call
```

### Middleware Order Verification
```
Middleware executes in this order (verify correct):
  1. Security headers (CSP, CORS)
  2. Rate limiting
  3. Clerk auth
  4. Route matching/rewrites

If auth runs before rate limiting → DDoS vector
If headers run after auth → security gap on auth endpoints
```

---

## PALACE-SPECIFIC CHECKS

### vLLM Health (OMEN Server)
```bash
# Check vLLM is responding
curl -s http://[OMEN_IP]:8000/health

# Check model loaded
curl -s http://[OMEN_IP]:8000/v1/models | jq '.data[0].id'
# Expected: Qwen 2.5 32B AWQ model ID

# Check inference works
curl -s http://[OMEN_IP]:8000/v1/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"[MODEL_ID]","prompt":"test","max_tokens":5}'
# Expected: valid completion response, latency < 2s
```

### Agent Identity Loading
```
Verify all 40 agents load correctly:
  1. Query agent list endpoint
  2. Confirm count = 44 (38 public + Stone + Chaos)
  3. Verify tier assignments match pricing table:
     - FREE: 4 agents
     - STARTER: 16 agents
     - PLUS: 30 agents
     - SMART: 39 agents
     - PRO: 38 agents (public)
     - Stone (#43) + Chaos (#44): internal only
  4. Verify agent prompts/identities are not empty strings
```

### Seed File Integrity
```bash
# Verify all seed files present and non-empty
find docs/palace-usb-package/seeds -name "*.md" | while read f; do
  size=$(wc -c < "$f")
  if [ "$size" -lt 100 ]; then
    echo "WARNING: $f is suspiciously small ($size bytes)"
  else
    echo "OK: $f ($size bytes)"
  fi
done
```

---

## EVIDENCE ARTIFACT TEMPLATE

```yaml
deployment_clearance:
  timestamp: "YYYY-MM-DDTHH:MM:SSZ"
  deployer: "[name]"
  commit: "[sha]"
  branch: "[branch]"
  gates:
    gate_0_code:
      build: PASS/FAIL
      typecheck: PASS/FAIL
      lint: PASS/FAIL
    gate_1_env:
      vars_present: PASS/FAIL
      no_test_in_prod: PASS/FAIL
    gate_2_db:
      migrations: PASS/FAIL
      no_drift: PASS/FAIL
    gate_3_health:
      status_200: PASS/FAIL
      response_time_ms: NNN
    gate_4_smoke:
      tests_passed: N/5
      failures: ["list if any"]
    gate_5_canary:
      stage_reached: "1%/5%/25%/100%"
      metrics_green: PASS/FAIL
  decision: DEPLOY/ROLLBACK
  notes: "any additional context"
```

---

## QUICK REFERENCE: Deploy Decision

```
Gate 0 (Code)    → Build + Types + Lint = CLEAN
Gate 1 (Env)     → All vars present, no test/live contamination
Gate 2 (DB)      → Migrations applied, no drift
Gate 3 (Health)  → Endpoint returns 200
Gate 4 (Smoke)   → 5/5 critical tests pass
Gate 5 (Canary)  → Ramp 1% → 5% → 25% → 100%, metrics green
Gate 6 (Decide)  → Error rate < 0.5% AND latency < 2x baseline

ALL GATES PASS → DEPLOY
ANY GATE FAILS → STOP AND FIX
```
