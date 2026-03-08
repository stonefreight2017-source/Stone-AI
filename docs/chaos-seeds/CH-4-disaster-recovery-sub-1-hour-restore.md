# CH-4: Disaster Recovery & Sub-1-Hour Full Restore
**Agent**: Chaos (Agent #44) | **Priority**: P1 | **Date**: 2026-03-07
**Targets**: RTO < 1 hour, RPO < 5 minutes

---

## 1. Full System Dependency Map

```
┌─────────────────────────────────────────────────────────────┐
│                     CLOUDFLARE                               │
│  DNS → stone-ai.net (proxy ON)                              │
│  WAF, DDoS protection, SSL termination                      │
│  Tunnel → OMEN PC (inference)                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │  VERCEL  │────→│   NEON DB    │     │  OMEN PC     │    │
│  │          │     │  PostgreSQL  │     │  vLLM        │    │
│  │ Next.js  │────→│  + pgvector  │     │  RTX 5090    │    │
│  │ App      │     │              │     │  Docker      │    │
│  │          │────→│  PgBouncer   │     │  Redis       │    │
│  └──────────┘     └──────────────┘     └──────────────┘    │
│       │                                       ↑             │
│       │           ┌──────────────┐            │             │
│       ├──────────→│   CLERK      │     CF Tunnel            │
│       │           │   Auth       │            │             │
│       │           └──────────────┘     ┌──────┴───────┐    │
│       │           ┌──────────────┐     │ Cloudflare   │    │
│       ├──────────→│   STRIPE     │     │ Tunnel       │    │
│       │           │   Payments   │     └──────────────┘    │
│       │           └──────────────┘                          │
│       │           ┌──────────────┐                          │
│       └──────────→│   OPENAI     │                          │
│                   │   Fallback AI│                          │
│                   └──────────────┘                          │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   GITHUB     │  │  NODEMAILER  │  │  CLOUDFLARE  │     │
│  │   Source     │  │  Alerts      │  │  R2 (future) │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Service Dependency Chain (failure cascade order)
```
Cloudflare DOWN → Everything down (DNS, CDN, tunnel)
Vercel DOWN     → App unavailable, API routes fail
Neon DOWN       → No data access, auth fails, chat history lost
Clerk DOWN      → No login/signup, existing sessions may work
Stripe DOWN     → No payments, subscriptions stale but functional
OMEN DOWN       → No local AI, cloud fallback activates
Redis DOWN      → Rate limiting fails, caching fails, degraded perf
GitHub DOWN     → No deploys, but app stays running
```

---

## 2. Per-Service Recovery Procedures (Ranked by Business Impact)

### TIER 0 — CRITICAL (restore within 15 minutes)

#### 2a. Cloudflare (DNS + CDN + WAF + Tunnel)
**Failure mode**: DNS propagation issue, account suspension, region outage
**RPO**: N/A (stateless edge, config-only)
**Recovery**:
```
1. Check Cloudflare status: https://www.cloudflarestatus.com/
2. If account issue → Contact support (Enterprise), switch DNS to direct
3. If regional outage → Cloudflare handles automatically (Anycast)
4. Emergency DNS failover:
   - Point stone-ai.net directly to Vercel IP (bypass Cloudflare)
   - Registrar: Update NS records (propagation: 5-60 min)
   - Lose: WAF, DDoS protection, tunnel to OMEN
   - Gain: Basic availability
```

**Backup config**: Export all Cloudflare settings via API quarterly
```bash
# Export zone settings
curl -X GET "https://api.cloudflare.com/client/v4/zones/{zone_id}/settings" \
  -H "Authorization: Bearer {token}" > cf_zone_settings_backup.json

# Export DNS records
curl -X GET "https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records" \
  -H "Authorization: Bearer {token}" > cf_dns_backup.json

# Export WAF rules
curl -X GET "https://api.cloudflare.com/client/v4/zones/{zone_id}/firewall/rules" \
  -H "Authorization: Bearer {token}" > cf_waf_backup.json
```

#### 2b. Neon Database
**Failure mode**: Region outage, data corruption, accidental deletion
**RPO**: < 5 minutes (WAL-based continuous backup)
**Recovery options**:

```
Option 1: Point-in-time restore (Neon native) — fastest
  1. Neon Console → Project → Branches → Restore
  2. Select timestamp (any point within restore window)
  3. Neon creates new branch at that timestamp
  4. Update DATABASE_URL to new branch endpoint
  5. Redeploy Vercel with new connection string
  Time: 2-5 minutes

Option 2: Branch from backup point
  1. Neon Console → Create Branch → From: main, At: [timestamp]
  2. New branch becomes production
  3. Update connection strings
  Time: 1-3 minutes

Option 3: Full restore from pg_dump backup
  1. Retrieve latest pg_dump from backup storage (R2/local)
  2. Create new Neon project
  3. pg_restore into new project
  4. Update all connection strings
  5. Redeploy
  Time: 15-45 minutes (depending on DB size)
```

#### 2c. Vercel (Application Hosting)
**Failure mode**: Build failure, deployment corruption, platform outage
**Recovery**:
```
1. If bad deploy → Vercel Dashboard → Deployments → Promote previous deployment
   Time: 30 seconds

2. If platform outage → Check https://www.vercel-status.com/
   - Wait for resolution (Vercel has multi-region redundancy)
   - Alternative: Deploy to Cloudflare Pages as emergency fallback
   Time: 15-30 minutes for CF Pages deploy

3. Emergency local serve:
   - Clone from GitHub
   - npm run build && npm run start on OMEN
   - Point Cloudflare DNS to OMEN IP via tunnel
   Time: 10-15 minutes
```

### TIER 1 — HIGH (restore within 30 minutes)

#### 2d. OMEN PC (Local Inference)
**Failure mode**: Hardware failure, Docker crash, vLLM crash, power loss
**Recovery**:
```
1. vLLM crash → Docker auto-restart handles it
   docker compose restart vllm
   Time: 30 seconds

2. Docker daemon crash →
   sudo systemctl restart docker
   docker compose up -d
   Time: 1-2 minutes

3. GPU failure → Cloud fallback auto-activates
   - No manual action needed for user-facing service
   - Diagnose GPU: nvidia-smi, check logs, reseat if needed
   Time: 0 (automatic fallback) + repair time

4. Full system crash / power loss →
   - UPS should handle brief outages
   - After power restore: boot, Docker auto-starts, vLLM auto-starts
   - Verify: curl http://localhost:8000/health
   Time: 5-10 minutes after power restore

5. Hardware failure (motherboard, etc.) →
   - Cloud fallback handles inference
   - Order replacement parts
   Time: 0 (service continues) + hardware repair time
```

#### 2e. Redis
**Failure mode**: Container crash, data loss, OOM
**Recovery**:
```
1. Container crash →
   docker restart redis
   Time: 5 seconds

2. Data loss → Redis is cache/rate-limit only (no persistent critical data)
   - Restart container, caches rebuild on demand
   - Rate limit counters reset (acceptable)
   Time: 5 seconds

3. OOM → Increase memory limit in docker-compose.yml
   Time: 1 minute
```

### TIER 2 — MEDIUM (restore within 1 hour)

#### 2f. Clerk (Authentication)
**Failure mode**: Clerk platform outage
**Recovery**:
```
1. Check https://status.clerk.com/
2. Existing authenticated sessions continue working (JWT-based)
3. New logins/signups will fail during outage
4. No action possible — wait for Clerk resolution
5. Alternative (emergency): Disable auth requirement, show maintenance page
```

#### 2g. Stripe (Payments)
**Failure mode**: Stripe platform outage
**Recovery**:
```
1. Check https://status.stripe.com/
2. Existing subscriptions continue (cached in DB)
3. New payments/upgrades will fail
4. No action needed — subscriptions are stored in Neon
5. Webhook backlog processes automatically when Stripe recovers
```

---

## 3. Automated Health Check & Failover Triggers

### Health Check Script (runs every 60 seconds via cron on OMEN)

```bash
#!/bin/bash
# /opt/stone-ai/health-check.sh

ALERT_EMAIL="3headedm@gmail.com"
LOG_FILE="/var/log/stone-ai-health.log"

check_service() {
    local name=$1
    local url=$2
    local expected_code=$3
    local timeout=${4:-10}

    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time $timeout "$url")
    if [ "$code" != "$expected_code" ]; then
        echo "[$(date)] FAIL: $name returned $code (expected $expected_code)" >> $LOG_FILE
        send_alert "$name is DOWN (HTTP $code)"
        return 1
    fi
    return 0
}

send_alert() {
    # Use Node.js Nodemailer script
    node /opt/stone-ai/send-alert.js "$1"
}

# Check all services
check_service "Stone AI Web" "https://stone-ai.net" "200"
check_service "Neon DB" "https://stone-ai.net/api/health/db" "200"
check_service "vLLM GPU 0" "http://localhost:8000/health" "200" 5
check_service "vLLM GPU 1" "http://localhost:8001/health" "200" 5
check_service "Redis" "http://localhost:6379" "000" 2  # Redis doesn't HTTP, check via redis-cli
redis-cli ping > /dev/null 2>&1 || send_alert "Redis is DOWN"

# Check GPU health
gpu_temp=$(nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader,nounits 2>/dev/null)
if [ -z "$gpu_temp" ]; then
    send_alert "CRITICAL: GPU not responding to nvidia-smi"
elif [ "$gpu_temp" -gt 90 ]; then
    send_alert "WARNING: GPU temperature ${gpu_temp}C (threshold: 90C)"
fi

# Check disk space
disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$disk_usage" -gt 90 ]; then
    send_alert "WARNING: Disk usage at ${disk_usage}%"
fi
```

### Failover Triggers (automated)

| Trigger | Condition | Auto-Action |
|---|---|---|
| vLLM unresponsive | Health check fails 3x consecutive | Route to cloud fallback |
| GPU thermal | >90C sustained 5 min | Reduce batch size, alert |
| GPU OOM | CUDA OOM error in logs | Restart vLLM with lower max-model-len |
| Neon latency spike | P95 > 2s for 5 min | Alert, check for long queries |
| Disk full | >90% | Alert, run archival job |
| High error rate | >5% 5xx in 5 min | Alert, check Vercel function logs |

---

## 4. Backup Schedule & Verification

### Backup Matrix

| What | Method | Frequency | Retention | Storage |
|---|---|---|---|---|
| Database (full) | pg_dump via Neon | Daily 3AM EST | 30 days | Local + R2 |
| Database (incremental) | Neon WAL (automatic) | Continuous | Per Neon plan | Neon managed |
| Database (PITR) | Neon branching | On-demand | Per restore window | Neon managed |
| Application code | GitHub | Every commit | Forever | GitHub |
| Environment variables | Manual export | Weekly + on change | 5 versions | Encrypted local |
| Cloudflare config | API export | Weekly | 4 versions | Encrypted local |
| Docker compose files | GitHub | Every change | Forever | GitHub |
| vLLM model weights | Hugging Face cache | On download | Latest version | OMEN local disk |
| Redis data | No backup (cache only) | N/A | N/A | N/A |

### Daily Backup Script
```bash
#!/bin/bash
# /opt/stone-ai/backup.sh — runs daily at 3AM EST

DATE=$(date +%Y-%m-%d)
BACKUP_DIR="/opt/stone-ai/backups"
R2_BUCKET="stone-ai-backups"

# Database backup
pg_dump "$DIRECT_DATABASE_URL" --format=custom --compress=9 \
  -f "$BACKUP_DIR/db-$DATE.dump"

# Verify backup is valid
pg_restore --list "$BACKUP_DIR/db-$DATE.dump" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    send_alert "CRITICAL: Database backup verification FAILED for $DATE"
    exit 1
fi

# Upload to Cloudflare R2 (when configured)
# aws s3 cp "$BACKUP_DIR/db-$DATE.dump" "s3://$R2_BUCKET/db/$DATE.dump" \
#   --endpoint-url "https://<account>.r2.cloudflarestorage.com"

# Environment variables backup (encrypted)
env | grep -E "^(DATABASE|CLERK|STRIPE|OPENAI|NEXT)" | \
  openssl enc -aes-256-cbc -salt -pbkdf2 -pass file:/opt/stone-ai/.backup-key \
  -out "$BACKUP_DIR/env-$DATE.enc"

# Cleanup old local backups (keep 7 days locally)
find "$BACKUP_DIR" -name "*.dump" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.enc" -mtime +7 -delete

echo "[$(date)] Backup completed: db-$DATE.dump" >> /var/log/stone-ai-backup.log
```

### Weekly Backup Verification
```bash
#!/bin/bash
# /opt/stone-ai/verify-backup.sh — runs weekly

# 1. Restore latest backup to a Neon test branch
# 2. Run basic query to verify data integrity
# 3. Count rows in key tables
# 4. Compare with production counts
# 5. Report results

LATEST_BACKUP=$(ls -t /opt/stone-ai/backups/db-*.dump | head -1)

# Create test branch in Neon (or use local Docker PG)
docker run -d --name pg-verify -e POSTGRES_PASSWORD=verify \
  -p 5433:5432 postgres:16

sleep 5

pg_restore -h localhost -p 5433 -U postgres -d postgres \
  --no-owner "$LATEST_BACKUP" 2>/dev/null

# Verify key tables
for table in users chat_messages agents subscriptions; do
  count=$(psql -h localhost -p 5433 -U postgres -t -c \
    "SELECT count(*) FROM $table" 2>/dev/null)
  echo "$table: $count rows"
done

docker rm -f pg-verify
```

---

## 5. DNS Failover Configuration

### Primary DNS (Cloudflare)
```
stone-ai.net    → Cloudflare proxy → Vercel
                → Cloudflare Tunnel → OMEN (inference)
```

### Failover DNS (if Cloudflare is down)
```
Option 1: Point directly to Vercel
  A record → 76.76.21.21 (Vercel)
  CNAME → cname.vercel-dns.com

Option 2: Point to fallback Vercel URL
  Use stone-ai-sooty.vercel.app directly

Option 3: Point to OMEN (emergency static site)
  A record → OMEN public IP (via ISP)
  Requires: Nginx serving static build on OMEN
```

### DNS Failover Procedure (manual, <5 min)
```
1. Log into domain registrar
2. Change NS records from Cloudflare to registrar's DNS
3. Add A record pointing to Vercel (76.76.21.21)
4. TTL propagation: already low if CF TTL was set to 1min
5. Users access stone-ai.net directly via Vercel
6. AI inference falls back to OpenAI (tunnel unavailable)
```

---

## 6. Quarterly DR Drill Framework

### Drill Types (rotate quarterly)

| Quarter | Drill Type | What to Test |
|---|---|---|
| Q1 | Database Restore | PITR to 30 min ago, verify data integrity |
| Q2 | Inference Failover | Kill vLLM, verify cloud fallback works |
| Q3 | Full Outage Simulation | Simulate Vercel down, deploy to CF Pages |
| Q4 | Security Incident | Simulate compromise, rotate all credentials |

### Drill Procedure Template
```
PRE-DRILL (24 hours before)
1. Notify if anyone else has access
2. Take fresh backup
3. Document current state (user count, message count, etc.)

DRILL EXECUTION
1. Simulate failure at [TIME]
2. Start timer
3. Execute recovery procedure
4. Verify service restored
5. Stop timer → record actual RTO
6. Verify data integrity → record actual RPO

POST-DRILL (same day)
1. Document: actual RTO vs target, actual RPO vs target
2. Issues encountered
3. Procedure updates needed
4. Schedule follow-up for any failed steps
```

### Success Criteria

| Metric | Target | Acceptable | Fail |
|---|---|---|---|
| Detection time | < 1 min (automated) | < 5 min | > 5 min |
| RTO (full recovery) | < 30 min | < 60 min | > 60 min |
| RPO (data loss) | 0 | < 5 min | > 5 min |
| User impact duration | < 5 min | < 15 min | > 15 min |

---

## 7. Single-Command Recovery Scripts

### Recover Database (PITR)
```bash
#!/bin/bash
# /opt/stone-ai/recover-db.sh
# Usage: ./recover-db.sh "2026-03-07T10:00:00Z"

TIMESTAMP=$1
echo "Restoring Neon database to $TIMESTAMP..."

# Using Neon CLI (install: npm i -g neonctl)
neonctl branches create \
  --project-id $NEON_PROJECT_ID \
  --name "recovery-$(date +%s)" \
  --parent main \
  --at "$TIMESTAMP"

echo "Branch created. Update DATABASE_URL in Vercel to new endpoint."
echo "Then run: vercel --prod"
```

### Recover vLLM
```bash
#!/bin/bash
# /opt/stone-ai/recover-vllm.sh

echo "Restarting vLLM inference..."
docker compose -f /opt/stone-ai/docker-compose.yml restart vllm
sleep 10

# Verify
if curl -s http://localhost:8000/health | grep -q "ok"; then
    echo "vLLM recovered successfully"
else
    echo "vLLM failed to recover. Cloud fallback is active."
    echo "Check: docker logs vllm --tail 50"
fi
```

### Recover Everything (nuclear option)
```bash
#!/bin/bash
# /opt/stone-ai/recover-all.sh
# Full system recovery from scratch

echo "=== FULL SYSTEM RECOVERY ==="

# 1. Docker services
echo "[1/5] Starting Docker services..."
docker compose -f /opt/stone-ai/docker-compose.yml up -d
sleep 10

# 2. Verify Redis
echo "[2/5] Checking Redis..."
redis-cli ping || echo "WARNING: Redis not responding"

# 3. Verify vLLM
echo "[3/5] Checking vLLM..."
curl -s http://localhost:8000/health || echo "WARNING: vLLM not responding"

# 4. Verify Cloudflare Tunnel
echo "[4/5] Checking Cloudflare Tunnel..."
docker logs cloudflared --tail 5 2>&1 | grep -q "connected" && \
  echo "Tunnel connected" || echo "WARNING: Tunnel not connected"

# 5. Verify external services
echo "[5/5] Checking external services..."
curl -s -o /dev/null -w "%{http_code}" https://stone-ai.net

echo "=== Recovery complete. Check warnings above. ==="
```

---

## 8. Credential Recovery Protocol

### Credential Inventory

| Credential | Location | Backup Location |
|---|---|---|
| Neon DB connection strings | Vercel env vars | STONE_AI_CREDENTIALS_AND_INFO.txt |
| Clerk API keys | Vercel env vars | Credentials file |
| Stripe API keys | Vercel env vars | Credentials file |
| OpenAI API key | Vercel env vars | Credentials file |
| Cloudflare API token | OMEN env / scripts | Credentials file |
| GitHub token | OMEN git config | Credentials file |
| Nodemailer SMTP creds | OMEN env | Credentials file |
| Domain registrar login | N/A | Credentials file |

### Credential File Location
```
Primary:  C:\Users\stone\Desktop\STONE_AI_CREDENTIALS_AND_INFO.txt
Backup:   [Should create encrypted copy in separate location]
```

### Rotation Protocol (after any suspected compromise)
```
1. Neon: Dashboard → Settings → Reset password → Update Vercel env
2. Clerk: Dashboard → API Keys → Rotate → Update Vercel env
3. Stripe: Dashboard → Developers → API Keys → Roll → Update Vercel env
4. OpenAI: Platform → API Keys → Create new → Revoke old → Update Vercel env
5. Cloudflare: Profile → API Tokens → Roll → Update local scripts
6. GitHub: Settings → Developer settings → Tokens → Regenerate
7. Redeploy Vercel after all env vars updated
8. Update credentials file
9. Verify all services functional
```

### CRITICAL: Single Points of Failure for Credentials
- **Vercel account**: If compromised, ALL env vars exposed. Enable 2FA.
- **Gmail (3headedm@gmail.com)**: Recovery email for most services. Enable 2FA + app passwords.
- **Cloudflare account**: Controls DNS for everything. Enable 2FA.

---

## Summary: Recovery Time Estimates

| Scenario | Expected RTO | Expected RPO | Auto/Manual |
|---|---|---|---|
| vLLM crash | 30 seconds | 0 | Auto (Docker restart) |
| GPU failure | 0 (fallback) | 0 | Auto (cloud fallback) |
| Redis crash | 5 seconds | N/A (cache) | Auto (Docker restart) |
| Bad Vercel deploy | 30 seconds | 0 | Manual (promote previous) |
| Neon outage | 5-15 minutes | < 5 min | Manual (PITR branch) |
| Cloudflare outage | 5-60 minutes | 0 | Manual (DNS failover) |
| Full OMEN failure | 0 (for users) | 0 | Auto (cloud fallback) |
| Credential compromise | 30-60 minutes | 0 | Manual (rotation) |
| Complete wipe (worst case) | 45-90 minutes | < 5 min | Manual (full restore) |
