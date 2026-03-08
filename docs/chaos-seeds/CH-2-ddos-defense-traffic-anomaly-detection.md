# CH-2: DDoS Defense & Traffic Anomaly Detection
**Agent**: Chaos (Agent #44) | **Priority**: P0 | **Date**: 2026-03-07
**Stack**: Cloudflare (proxy ON, SSL Full), Vercel, Next.js, Neon DB, Redis, Kali WSL2

---

## 1. Attack Surface Inventory

### Public Endpoints (All routed through Cloudflare)

| Surface | URL/Path | Risk Level | Notes |
|---|---|---|---|
| Main app | stone-ai.net/* | HIGH | All user traffic |
| API routes | stone-ai.net/api/* | CRITICAL | AI inference, auth, data |
| Chat/inference | /api/chat, /api/agents/* | CRITICAL | Expensive compute per request |
| Auth endpoints | /api/auth/* (Clerk) | HIGH | Credential stuffing target |
| Forum | /api/forum/* | MEDIUM | Content injection |
| Billing | /api/billing/* (Stripe) | HIGH | Financial data |
| Admin | /api/admin/* | CRITICAL | Must be invisible to public |
| Webhook receivers | /api/webhooks/* | HIGH | Clerk, Stripe callbacks |
| Static assets | /_next/static/* | LOW | CDN cached |
| Tools site | tools.stone-ai.net | MEDIUM | Future surface |
| Cloudflare Tunnel | Tunnel to OMEN | CRITICAL | Direct path to inference GPU |

### Hidden Surfaces (not publicly routed but exist)

| Surface | Risk | Mitigation |
|---|---|---|
| Neon DB connection string | CRITICAL | Only accessible via Vercel env vars |
| Redis :6379 | HIGH | Bound to localhost/Docker network only |
| vLLM :8000/:8001 | CRITICAL | Only accessible via Cloudflare Tunnel |
| Docker MCP servers | MEDIUM | Internal network only |

---

## 2. Cloudflare WAF Configuration Hardening

### Baseline Rules (implement immediately)

#### 2a. Managed Rulesets (enable all)
```
Cloudflare Dashboard → Security → WAF → Managed Rules
├── Cloudflare Managed Ruleset: ON (all rules)
├── Cloudflare OWASP Core Ruleset: ON (paranoia level 2)
├── Cloudflare Leaked Credentials Detection: ON
└── Cloudflare Free Managed Ruleset: ON
```

#### 2b. Custom WAF Rules

**Rule 1: Block non-US traffic to admin endpoints**
```
Expression: (http.request.uri.path contains "/api/admin" and not ip.geoip.country in {"US"})
Action: Block
```

**Rule 2: Challenge suspicious bot traffic on API**
```
Expression: (http.request.uri.path contains "/api/" and cf.bot_management.score lt 30)
Action: Managed Challenge
```

**Rule 3: Block known bad user agents**
```
Expression: (http.user_agent contains "sqlmap" or
             http.user_agent contains "nikto" or
             http.user_agent contains "dirbuster" or
             http.user_agent contains "gobuster" or
             http.user_agent contains "nuclei" or
             http.user_agent eq "")
Action: Block
```

**Rule 4: Protect inference endpoints from abuse**
```
Expression: (http.request.uri.path contains "/api/chat" and
             http.request.method eq "POST" and
             cf.bot_management.score lt 20)
Action: Block
```

**Rule 5: Rate limit authentication endpoints**
```
Expression: (http.request.uri.path contains "/api/auth")
Characteristics: ip.src
Rate: 20 requests per 10 seconds
Action: Block for 600 seconds
```

#### 2c. Security Headers (set in Cloudflare Transform Rules)
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

#### 2d. SSL/TLS Hardening
```
Minimum TLS Version: 1.2
Opportunistic Encryption: ON
TLS 1.3: ON
Automatic HTTPS Rewrites: ON
Always Use HTTPS: ON
```

---

## 3. L7 Attack Patterns Specific to AI Platforms

### 3a. Prompt Flooding
**Pattern**: Attacker sends massive number of long prompts to exhaust GPU compute.
**Signature**: High volume POST to /api/chat with large request bodies.
**Impact**: Single expensive request can occupy GPU for 10-30 seconds.

**Defense**:
```
- Max request body size: 4KB for chat endpoints (Cloudflare rule)
- Max prompt tokens: 2048 (application-level validation)
- Queue depth limit: reject when >20 pending (vLLM config)
```

### 3b. Credential Stuffing via Clerk
**Pattern**: Automated login attempts using leaked credential databases.
**Signature**: High volume POST to /api/auth with varied credentials.
**Defense**: Clerk's built-in bot detection + Cloudflare rate limiting (Rule 5 above).

### 3c. Scraping/Enumeration
**Pattern**: Crawling all agent endpoints to map capabilities.
**Signature**: Sequential GET requests to /api/agents/1, /api/agents/2, etc.
**Defense**: Rate limit per IP, require auth for enumeration endpoints.

### 3d. Slow Loris / Low-and-Slow
**Pattern**: Open many connections, send data very slowly, exhaust connection pool.
**Signature**: Many connections from same IP with low data rate.
**Defense**: Cloudflare's reverse proxy handles this natively — it buffers complete requests before forwarding to origin.

### 3e. WebSocket Abuse (if chat uses WS)
**Pattern**: Open hundreds of WebSocket connections per IP.
**Defense**: Limit WebSocket connections per IP (Cloudflare + application level).

### 3f. Model Extraction
**Pattern**: Systematic querying to reconstruct model behavior/weights.
**Signature**: High volume, varied prompts from single source, saving all responses.
**Defense**: Per-user daily token limits, response watermarking awareness, anomaly detection on query patterns.

---

## 4. Traffic Baseline Modeling & Anomaly Thresholds

### Establish Baselines (first 30 days of production)

| Metric | Expected Baseline | Yellow Alert | Red Alert |
|---|---|---|---|
| Requests/minute (total) | 50-200 | >500 | >2000 |
| Requests/minute (per IP) | 1-10 | >30 | >100 |
| POST /api/chat per minute | 5-20 | >50 | >200 |
| Unique IPs per hour | 20-100 | >500 | >2000 |
| 4xx error rate | <5% | >15% | >30% |
| 5xx error rate | <0.5% | >2% | >5% |
| Avg response time | 200-500ms (non-AI) | >2s | >5s |
| Request body size (avg) | 500B-2KB | >5KB | >10KB |
| Bandwidth out/hour | 100MB-1GB | >5GB | >20GB |

### Monitoring Implementation
```bash
# Cloudflare Analytics API — pull every 5 minutes
# Store in Redis for real-time dashboarding
# Alert via Nodemailer when thresholds breached

# Key Cloudflare GraphQL queries:
# - httpRequests1mGroups (requests by status code, country, bot score)
# - firewallEventsAdaptiveGroups (WAF blocks and challenges)
# - healthCheckEventsGroups (origin health)
```

### Anomaly Detection Logic
```python
# Simple statistical anomaly detection
# Compare current 5-min window to rolling 7-day average for same time slot

def is_anomalous(current_value, rolling_avg, rolling_stddev):
    z_score = (current_value - rolling_avg) / max(rolling_stddev, 1)
    if z_score > 3:    # Red alert
        return "RED"
    elif z_score > 2:  # Yellow alert
        return "YELLOW"
    return "NORMAL"
```

---

## 5. Automated Response Playbooks

### Playbook 1: Volume Spike (>5x baseline in 5 minutes)
```
1. [AUTO] Enable Cloudflare "Under Attack Mode" via API
2. [AUTO] Send alert to 3headedm@gmail.com
3. [AUTO] Log all IPs hitting rate limits
4. [MANUAL] Review Cloudflare Analytics for attack pattern
5. [MANUAL] Create targeted WAF rule if pattern identified
6. [AUTO] Disable Under Attack Mode after 30min if traffic normalizes
```

### Playbook 2: Targeted API Abuse (single endpoint >10x baseline)
```
1. [AUTO] Enable endpoint-specific rate limit (stricter)
2. [AUTO] Challenge all requests to affected endpoint
3. [AUTO] Alert founder
4. [MANUAL] Check if legitimate traffic spike (new feature launch, etc.)
5. [MANUAL] Block offending IPs/ASNs if malicious
```

### Playbook 3: GPU Exhaustion Attack (inference queue >50)
```
1. [AUTO] Reject new inference requests with 503 + retry-after header
2. [AUTO] Activate cloud fallback (OpenAI gpt-4o-mini)
3. [AUTO] Alert founder (cost implications)
4. [AUTO] Log all IPs making inference requests during window
5. [MANUAL] Identify and block abusive accounts
6. [AUTO] Resume local inference when queue drains to <10
```

### Playbook 4: Credential Stuffing (auth endpoint >50 failures/min)
```
1. [AUTO] Block IP for 1 hour after 10 failed auth attempts
2. [AUTO] Enable Clerk's enhanced bot protection
3. [AUTO] Challenge all auth requests with Managed Challenge
4. [AUTO] Alert founder
5. [MANUAL] Review for compromised accounts
```

### Under Attack Mode API Toggle
```bash
# Enable
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/{zone_id}/settings/security_level" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"value":"under_attack"}'

# Disable (return to medium)
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/{zone_id}/settings/security_level" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"value":"medium"}'
```

---

## 6. API Rate Limiting Architecture

### Per-Tier Rate Limits

| Tier | Chat requests/min | API calls/min | Max prompt tokens | Daily token budget |
|---|---|---|---|---|
| FREE | 3 | 30 | 1024 | 10K |
| STARTER | 10 | 60 | 2048 | 100K |
| PLUS | 20 | 120 | 4096 | 500K |
| SMART | 30 | 180 | 4096 | 1M |
| PRO | 60 | 300 | 8192 | 5M |

### Per-Endpoint Rate Limits (Cloudflare Rules)

| Endpoint Pattern | Rate | Window | Action |
|---|---|---|---|
| /api/chat | 60/min per IP | 1 min | Block 60s |
| /api/auth/* | 20/min per IP | 1 min | Block 600s |
| /api/admin/* | 10/min per IP | 1 min | Block 3600s |
| /api/billing/* | 10/min per IP | 1 min | Block 300s |
| /api/forum/* | 30/min per IP | 1 min | Block 60s |
| /api/* (catch-all) | 120/min per IP | 1 min | Challenge |

### Application-Level Rate Limiting (Redis)
```typescript
// Already have Redis — use it for precise per-user limits
// Key pattern: ratelimit:{userId}:{endpoint}:{minute}

import { Redis } from 'ioredis';

async function checkRateLimit(userId: string, endpoint: string, limit: number): Promise<boolean> {
  const key = `ratelimit:${userId}:${endpoint}:${Math.floor(Date.now() / 60000)}`;
  const current = await redis.incr(key);
  if (current === 1) await redis.expire(key, 120); // 2 min TTL
  return current <= limit;
}
```

### Layered Defense Model
```
Layer 1: Cloudflare Edge (IP-based, bot score, geographic)
   ↓ passes
Layer 2: Vercel Middleware (auth check, basic rate limit)
   ↓ passes
Layer 3: API Route (Redis per-user rate limit, tier enforcement)
   ↓ passes
Layer 4: vLLM (queue depth limit, timeout)
```

---

## 7. Post-Attack Forensics Protocol

### Immediate (within 1 hour of attack end)
1. **Capture**: Export Cloudflare Security Events for the attack window
2. **Preserve**: Download raw access logs from Cloudflare Logpush
3. **Identify**: Top attacking IPs, ASNs, countries, user agents
4. **Quantify**: Total blocked requests, cost of any cloud fallback usage

### Analysis (within 24 hours)
5. **Pattern**: What endpoint was targeted? What was the attack signature?
6. **Effectiveness**: Did rate limits trigger? At what threshold?
7. **Gaps**: Did any attack traffic reach origin? How much?
8. **Impact**: User-facing errors? Downtime duration? Revenue impact?

### Hardening (within 48 hours)
9. **Permanent blocks**: Add identified bad ASNs/IP ranges to WAF blocklist
10. **Rule updates**: Create targeted WAF rule for the specific attack pattern
11. **Threshold tuning**: Adjust rate limits based on actual attack volume
12. **Baseline update**: Re-calculate traffic baselines post-incident

### Documentation Template
```markdown
## Incident Report: [DATE]
- **Attack type**: [L7 flood / credential stuffing / prompt abuse / etc.]
- **Duration**: [start time] to [end time]
- **Volume**: [X requests total, Y requests/sec peak]
- **Target**: [endpoint(s)]
- **Source**: [X unique IPs, top ASNs, top countries]
- **Detection time**: [how long until detected]
- **Mitigation time**: [how long until mitigated]
- **User impact**: [downtime, errors, degraded service]
- **Cost**: [cloud fallback cost, if any]
- **Actions taken**: [rules added, IPs blocked, etc.]
- **Lessons learned**: [what to improve]
```

---

## 8. Kali WSL2 Self-Testing Procedures

### Prerequisites
```bash
# In Kali WSL2
sudo apt update && sudo apt install -y \
  nikto nmap sqlmap wapiti zaproxy \
  gobuster dirb hydra slowhttptest \
  python3-pip
pip3 install requests aiohttp
```

### Test 1: Port Scan & Service Discovery
```bash
# Should only see 80/443 (everything else behind Cloudflare)
nmap -sV -p- stone-ai.net
# Expected: Only Cloudflare IPs, ports 80/443
```

### Test 2: WAF Bypass Attempts
```bash
# SQL injection probes (should be blocked by WAF)
sqlmap -u "https://stone-ai.net/api/search?q=test" --batch --level=3

# XSS probes
wapiti -u https://stone-ai.net -m xss,sql,exec --scope page
```

### Test 3: Rate Limit Verification
```bash
# Verify rate limits actually trigger
for i in $(seq 1 100); do
  curl -s -o /dev/null -w "%{http_code}\n" \
    "https://stone-ai.net/api/chat" \
    -X POST -H "Content-Type: application/json" \
    -d '{"message":"test"}'
done | sort | uniq -c
# Expected: First N return 200/401, then 429 or Cloudflare challenge
```

### Test 4: Slow HTTP Attack
```bash
# Test resilience to slow loris (should be absorbed by Cloudflare)
slowhttptest -c 500 -H -g -o slowhttp_results \
  -i 10 -r 200 -t GET -u https://stone-ai.net -p 3
# Expected: Cloudflare terminates slow connections, origin unaffected
```

### Test 5: Directory Enumeration
```bash
# Verify no hidden admin paths are exposed
gobuster dir -u https://stone-ai.net \
  -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt \
  -t 10 --delay 500ms
# Expected: Only known public paths return 200
```

### Test 6: Authentication Brute Force
```bash
# Verify auth rate limiting works (use test account only)
hydra -l test@test.com -P /usr/share/wordlists/rockyou.txt \
  stone-ai.net https-post-form \
  "/api/auth/login:email=^USER^&password=^PASS^:Invalid" \
  -t 4 -w 30
# Expected: Blocked after 10-20 attempts
```

### Testing Schedule
| Test | Frequency | Window |
|---|---|---|
| Port scan | Monthly | Off-peak hours |
| WAF bypass | Monthly | Off-peak hours |
| Rate limit verify | After any rate limit change | Anytime |
| Slow HTTP | Quarterly | Off-peak hours |
| Full pentest suite | Quarterly | Scheduled maintenance window |

### IMPORTANT: Testing Safety Rules
- ALWAYS test against staging/preview deployments first
- NEVER run DDoS volume tests against production Cloudflare — they may blacklist your IP
- Use low thread counts and delays to avoid triggering real protections
- Document all tests and results
- Alert founder before running any aggressive tests

---

## Summary: Implementation Priority

| Action | Priority | Effort | Impact |
|---|---|---|---|
| Enable Cloudflare Managed Rulesets | P0 | 15 min | HIGH |
| Deploy custom WAF rules (5 rules above) | P0 | 30 min | HIGH |
| Implement Redis rate limiting | P0 | 2 hours | CRITICAL |
| Set up traffic baseline monitoring | P1 | 4 hours | HIGH |
| Create automated alert system | P1 | 3 hours | HIGH |
| Build Under Attack Mode automation | P1 | 2 hours | MEDIUM |
| First Kali self-test | P1 | 2 hours | MEDIUM |
| Quarterly pentest schedule | P2 | 30 min to schedule | MEDIUM |
