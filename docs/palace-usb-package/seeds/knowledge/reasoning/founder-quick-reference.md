# Founder Quick Reference

## Purpose

This is the founder's cheat sheet — the fast-access document for common commands, agent capabilities, system status checks, and quick troubleshooting. When you need an answer in 30 seconds, not 30 minutes, this is the document you reach for.

## Why This Matters

The founder shouldn't have to dig through multi-page manuals for routine operations. This reference puts the most-used information at your fingertips. Print it, pin it, bookmark it — this is your daily driver.

---

## Quick System Status Commands

### One-Line Health Checks

```bash
# Is GPU alive?
nvidia-smi

# Is vLLM running?
curl -s http://localhost:8000/health && echo " OK" || echo " DOWN"

# Is Docker/PG running?
docker exec stoneai-db pg_isready

# Is Redis running?
redis-cli ping

# Quick inference test
curl -s http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"Qwen/Qwen2.5-32B-Instruct-AWQ","messages":[{"role":"user","content":"ping"}],"max_tokens":10}' | python -m json.tool

# GPU temperature
nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader

# GPU memory usage
nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader

# Disk space
df -h / | tail -1

# All services status (run all checks)
echo "=== GPU ===" && nvidia-smi --query-gpu=name,temperature.gpu,memory.used,memory.total --format=csv,noheader && \
echo "=== vLLM ===" && (curl -s http://localhost:8000/health > /dev/null && echo "UP" || echo "DOWN") && \
echo "=== PostgreSQL ===" && (docker exec stoneai-db pg_isready 2>/dev/null && echo "UP" || echo "DOWN") && \
echo "=== Redis ===" && (redis-cli ping 2>/dev/null || echo "DOWN") && \
echo "=== Disk ===" && df -h / | tail -1
```

---

## Agent Roster Quick Reference

### Tier Breakdown

| Tier | Price | Agent Count | Access Range |
|------|-------|-------------|-------------|
| FREE | $0 | 4 agents | Agents 1-4 |
| STARTER | $19.99/mo | 16 agents | Agents 1-16 |
| PLUS | $49.99/mo | 30 agents | Agents 1-30 |
| SMART | $99.99/mo | 39 agents | Agents 1-39 |
| PRO | $200/mo | 38 agents | Agents 1-38 (all public) |

### Special Agents (Not Public)

| Agent | Role | Access |
|-------|------|--------|
| Stone (#43) | Head 1 — Strategy & Operations | Internal only |
| Chaos (#44) | Head 3 — Infrastructure & Vanguard | Founder only |
| Computer Wiz | Royal Guard — Diagnostics | Founder only |
| Rush | Royal Guard — Network Penetration | Founder only |
| Cardinal | Head 2 — Intelligence & Architecture | Internal only |

### Pricing Quick Reference

```
MONTHLY PLANS:
  FREE:    $0
  STARTER: $19.99  (promo: $9.99 first month)
  PLUS:    $49.99  (promo: $14.99 trial)
  SMART:   $99.99  (promo: $39.99 growth)
  PRO:     $200

ANNUAL PLANS:
  SMART Annual: $84.99/mo (save 15%)
  PRO Annual:   $170/mo (save 15%)
```

---

## Common Operations

### Start vLLM

```bash
python -m vllm.entrypoints.openai.api_server \
  --model Qwen/Qwen2.5-32B-Instruct-AWQ \
  --quantization awq \
  --gpu-memory-utilization 0.90 \
  --max-model-len 8192 \
  --host 0.0.0.0 \
  --port 8000
```

### Stop vLLM

```bash
# Graceful: Ctrl+C in the terminal running vLLM
# Force: Find and kill the process
taskkill /F /IM python.exe /FI "WINDOWTITLE eq *vllm*"
```

### Restart Docker Services

```bash
docker restart stoneai-db
docker exec stoneai-db pg_isready  # Verify
```

### Start Dev Server

```bash
cd C:\Users\stone\stone-ai
npm run dev
# Opens at http://localhost:3000
```

### Deploy to Vercel

```bash
cd C:\Users\stone\stone-ai
git add -A && git commit -m "description"
git push origin main
# Vercel auto-deploys from main
```

### Run Database Migration

```bash
cd C:\Users\stone\stone-ai
npx prisma migrate dev --name "migration_name"
# For production:
npx prisma migrate deploy
```

### Generate Prisma Client

```bash
npx prisma generate
```

### Check Vercel Deployment Status

```bash
# Via Vercel CLI (if installed)
vercel ls

# Or check Vercel dashboard:
# https://vercel.com/dashboard
```

---

## Three-Headed Monster Commands

### Send Founder Alert

```typescript
// From any API route or server action:
import { sendFounderAlert } from '@/lib/email';

await sendFounderAlert({
  alertType: 'system.critical',  // or system.warning, system.info
  title: 'Subject line',
  body: 'Alert details here',
  source: 'stone'  // or 'cardinal', 'chaos', 'wiz'
});
```

### Email Command Format (Future — Inbound)

```
Subject: @STONE check agent performance
Subject: @CHAOS server status report
Subject: @CARDINAL competitive analysis update
Subject: No prefix = informational, no action needed
```

### Chaos Monthly Toys List Schedule

```
Frequency: Every 30 days
First delivery: 2026-03-08
Next delivery: 2026-04-07
Delivery method: sendFounderAlert() with [TOYS] prefix
```

---

## Quick Troubleshooting

### "vLLM is not responding"

```
1. curl http://localhost:8000/health
2. If connection refused → vLLM process died. Restart it.
3. If timeout → vLLM is hung. Kill and restart.
4. If 500 error → Check vLLM terminal for error details.
5. If GPU not found → nvidia-smi. If that fails, restart PC.
```

### "Responses are slow"

```
1. nvidia-smi → Check GPU temp (> 80°C = throttling)
2. nvidia-smi → Check VRAM (> 95% = swapping)
3. Check concurrent requests (> 4 = contention)
4. Check context length (> 4096 tokens = slower)
5. Restart vLLM to clear any memory leaks
```

### "Agent is giving wrong answers"

```
1. Is it ALL agents or just one?
   All = model/vLLM issue. One = prompt issue.
2. Check the system prompt for errors
3. Test with temperature 0.1 (more deterministic)
4. Compare against Claude API output
5. If persistent: Recertify the agent
```

### "Database connection failed"

```
1. docker ps → Is stoneai-db running?
2. docker logs stoneai-db → Check for errors
3. docker restart stoneai-db → Restart
4. docker exec stoneai-db pg_isready → Verify
5. If still failing: docker stop stoneai-db && docker start stoneai-db
```

### "Vercel deployment failed"

```
1. Check Vercel dashboard for build logs
2. Common causes:
   - TypeScript error → Fix the type error
   - Missing env var → Add to Vercel settings
   - Build timeout → Optimize build or increase timeout
   - Dependency issue → Check package.json
3. git push origin main → Trigger new deployment
```

### "Users can't log in"

```
1. Check Clerk dashboard for status
2. Verify CLERK env vars in Vercel
3. Check if Clerk is in dev mode vs production
4. Current: Dev mode (prod mode pending)
```

### "Payments not working"

```
1. Check Stripe dashboard for errors
2. Verify STRIPE env vars in Vercel
3. Check if Stripe is in test mode vs live
4. Current: Test mode (live mode pending)
```

---

## Key URLs & Dashboards

```
PRODUCTION:
  Site: https://stone-ai.net
  Fallback: https://stone-ai-sooty.vercel.app
  DNS: Cloudflare dashboard

DASHBOARDS:
  Vercel: https://vercel.com/dashboard
  Clerk: https://dashboard.clerk.com
  Stripe: https://dashboard.stripe.com
  Neon: https://console.neon.tech
  GitHub: https://github.com/stonefreight2017-source/Stone-AI

LOCAL:
  Dev server: http://localhost:3000
  vLLM: http://localhost:8000
  PG: localhost:5432
  Redis: localhost:6379

CREDENTIALS:
  Location: C:\Users\stone\Desktop\STONE_AI_CREDENTIALS_AND_INFO.txt
```

---

## Feature Status Overview

### Built & Deployed

```
[x] Chat system (multi-agent)
[x] Agent system (40 agents, tiered access)
[x] Billing (Stripe integration, test mode)
[x] Settings page
[x] Forum
[x] Help system
[x] Admin panel
[x] Bestie system (1 per paid tier, Enterprise=2)
[x] Onboarding flow
[x] Referral system
[x] Backdrops (15 preset + 3 premium + 100 pool)
[x] SVG Avatars
[x] Emotes (24)
[x] OG/Golden Egg badges
[x] Rate limiting
[x] AES-256-GCM encryption
[x] CSP headers
[x] Audit logging
[x] Zod validation
```

### Pending

```
[ ] Clerk production mode
[ ] Stripe live mode
[ ] ANTHROPIC_API_KEY on Vercel
[ ] Best AI mobile app (~18 weeks post-launch)
[ ] Stone AI Tools (tools.stone-ai.net)
```

---

## Security Quick Reference

### Security Principles (Always)

```
- Zod .strict() on ALL mutation schemas
- No raw body bypass ever
- SVG data URIs blocked (avatars: png/jpeg/webp/gif only)
- Easter egg claims on User model (survives bestie deletion)
- Badges: server-side only, no direct write endpoints
- Referrals: @@unique enforced
- Audit new features for OWASP top 10
- Rate limiting on all public endpoints
- AES-256-GCM for sensitive data
- CSP headers configured
```

### If You Suspect a Security Issue

```
1. DON'T PANIC
2. Document what you see
3. If active breach: Take affected service offline
4. Check logs for unauthorized access
5. Change credentials if compromised
6. Full security audit before resuming
```

---

## Key File Locations

```
Project root:     C:\Users\stone\stone-ai
Prisma schema:    C:\Users\stone\stone-ai\prisma\schema.prisma
API routes:       C:\Users\stone\stone-ai\src\app\api\
Components:       C:\Users\stone\stone-ai\src\components\
Lib/utils:        C:\Users\stone\stone-ai\src\lib\
Hooks config:     C:\Users\stone\.claude\hooks\run_hook.cmd
Palace seeds:     C:\Users\stone\stone-ai\docs\palace-usb-package\seeds\
Credentials:      C:\Users\stone\Desktop\STONE_AI_CREDENTIALS_AND_INFO.txt
Memory:           C:\Users\stone\.claude\projects\C--Users-stone\memory\MEMORY.md
```

---

## Emergency Contacts / Fallbacks

```
Palace down?     → Claude API fallback activates automatically
                 → Vercel serves Claude Haiku
                 → Users experience reduced quality but service continues

GPU dead?        → Same as above, plus order replacement hardware

Vercel down?     → stone-ai-sooty.vercel.app (fallback domain)
                 → Check Vercel status: https://www.vercel-status.com

Neon down?       → Check Neon status page
                 → Local PG (stoneai-db) for development continuity

Cloudflare down? → Direct to Vercel URL (bypass DNS proxy)

Everything down? → It's probably a global internet event. Wait it out.
```

This is your daily weapon. Keep it close, keep it current, keep it working.
