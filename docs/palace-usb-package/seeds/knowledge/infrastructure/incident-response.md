# Incident Response — Palace Infrastructure Seed

> Chaos (Head 3) — Palace USB Knowledge Seed
> For Palace agents running on OMEN hardware without Claude Code supervision.
> Every command is copy-paste ready. Every section is self-contained.

---

## 1. Severity Classification

| Severity | Definition | Response Time | Examples |
|---|---|---|---|
| **S1 — Total Outage** | Service completely unavailable | Immediate | DB down, vLLM crashed, DNS failure |
| **S2 — Major Degradation** | Service partially working, significant impact | < 30 minutes | Extreme latency, 50%+ errors, auth broken |
| **S3 — Minor Issue** | Limited impact, workaround exists | < 4 hours | One agent failing, slow responses, cosmetic bugs |
| **S4 — Cosmetic** | No functional impact | Next session | UI glitch, log noise, non-critical warning |

### Actions Per Severity

**S1 — Total Outage**
1. Alert founder immediately (sendFounderAlert)
2. Identify failed component (master-health.sh)
3. Attempt automatic restart
4. If restart fails, escalate to manual recovery
5. Post-incident: mandatory post-mortem

**S2 — Major Degradation**
1. Log alert with details
2. Identify root cause
3. Apply fix or workaround
4. Alert founder with summary
5. Monitor for recurrence

**S3 — Minor Issue**
1. Log the issue
2. Investigate when convenient
3. Fix in next maintenance window
4. Document in session notes

**S4 — Cosmetic**
1. Log it
2. Fix when time permits
3. No alert needed

---

## 2. Triage Script

```bash
#!/bin/bash
# triage.sh — Quick system assessment during an incident
set -uo pipefail

echo "=========================================="
echo "  INCIDENT TRIAGE — $(date)"
echo "=========================================="

echo ""
echo "=== 1. SERVICE STATUS ==="
echo -n "vLLM:       "
curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:8000/health 2>/dev/null || echo "UNREACHABLE"
echo ""

echo -n "PostgreSQL: "
docker exec stoneai-db pg_isready -U postgres 2>&1 | tail -1

echo -n "Redis:      "
docker exec stoneai-redis redis-cli ping 2>&1

echo -n "Docker:     "
docker ps --format "{{.Names}}: {{.Status}}" 2>/dev/null || echo "Docker not responding"

echo ""
echo "=== 2. RESOURCES ==="
echo "CPU Load: $(uptime | awk -F'load average:' '{print $2}')"
echo "RAM:      $(free -h | grep Mem | awk '{print $3 "/" $2 " (" int($3/$2*100) "%)"}')"
echo "Swap:     $(free -h | grep Swap | awk '{print $3 "/" $2}')"
echo "Disk:     $(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 ")"}')"

echo ""
echo "=== 3. GPU ==="
if nvidia-smi > /dev/null 2>&1; then
  nvidia-smi --query-gpu=temperature.gpu,utilization.gpu,memory.used,memory.total --format=csv,noheader
else
  echo "nvidia-smi NOT RESPONDING"
fi

echo ""
echo "=== 4. RECENT ERRORS ==="
echo "--- vLLM (last 5 errors) ---"
grep -i "error\|exception\|fail" /var/log/vllm/vllm-server.log 2>/dev/null | tail -5 || echo "No log file or no errors"

echo ""
echo "--- Docker events (last 10) ---"
docker events --since 10m --until 0s --format "{{.Time}} {{.Action}} {{.Actor.Attributes.name}}" 2>/dev/null | tail -10 || echo "No events"

echo ""
echo "--- System (last 5 kernel messages) ---"
dmesg 2>/dev/null | tail -5 || journalctl -k -n 5 --no-pager 2>/dev/null || echo "No kernel messages"

echo ""
echo "=== 5. NETWORK ==="
echo "Listening ports:"
ss -tlnp 2>/dev/null | grep -E ":(3000|5432|6379|8000|8001|80|443) "

echo ""
echo "=========================================="
echo "  TRIAGE COMPLETE"
echo "=========================================="
```

---

## 3. Root Cause Analysis

### 5 Whys Method

Start with the symptom and ask "why" five times:

```
Symptom: vLLM is returning 503 errors
Why 1: vLLM process crashed
Why 2: CUDA out of memory error
Why 3: A request with 32K context arrived while 3 other long-context requests were active
Why 4: max-num-seqs was set to 64, allowing too many concurrent long requests
Why 5: We tuned for throughput without considering worst-case VRAM per sequence

Root cause: max-num-seqs too high for the max-model-len setting
Fix: Reduce max-num-seqs to 16 for 32K context, or reduce max-model-len
Prevention: Calculate max concurrent sequences based on VRAM budget before deploy
```

### Timeline Reconstruction

```bash
#!/bin/bash
# timeline.sh — Reconstruct what happened in the last N minutes
MINUTES="${1:-30}"

echo "=== Timeline: Last $MINUTES minutes ==="
echo ""

# System events
echo "--- System Events ---"
journalctl --since "$MINUTES minutes ago" --no-pager -p warning 2>/dev/null | head -20

# Docker events
echo ""
echo "--- Docker Events ---"
docker events --since "${MINUTES}m" --until 0s 2>/dev/null | head -20

# vLLM errors
echo ""
echo "--- vLLM Errors ---"
SINCE=$(date -d "$MINUTES minutes ago" '+%Y-%m-%dT%H:%M:%S' 2>/dev/null || date -v-${MINUTES}M '+%Y-%m-%dT%H:%M:%S')
grep "$SINCE\|error\|Error\|FAIL\|OOM" /var/log/vllm/vllm-server.log 2>/dev/null | tail -20

# Alert log
echo ""
echo "--- Alerts ---"
tail -20 /var/log/stone-ai/alerts.log 2>/dev/null
```

### Change Correlation

The most likely cause of an incident is the most recent change.

```bash
# What changed recently?

# Git — recent commits
cd /path/to/stone-ai && git log --oneline -10

# Docker — recent image pulls/builds
docker images --format "{{.Repository}}:{{.Tag}} {{.CreatedAt}}" | head -10

# Config files — recently modified
find /etc/nginx /etc/docker -name "*.conf" -mmin -60 2>/dev/null

# System packages — recent installs/updates
cat /var/log/apt/history.log | tail -30 2>/dev/null

# Environment variables — check if .env was modified
ls -la /path/to/stone-ai/.env
```

---

## 4. Common Incident Patterns

### Disk Full

**Symptom**: Services crashing, writes failing, "No space left on device"

**Diagnosis**:
```bash
df -h  # Which filesystem is full?
du -sh /var/log/* | sort -rh | head -10  # Biggest log dirs
du -sh /var/lib/docker/* | sort -rh | head -5  # Docker disk usage
docker system df  # Docker-specific breakdown
```

**Fix**:
```bash
# Quick relief
sudo find /var/log -name "*.gz" -mtime +7 -delete  # Old compressed logs
docker system prune -f  # Unused Docker objects
sudo journalctl --vacuum-size=100M  # Trim journal

# Find big files
find / -type f -size +100M -exec ls -lh {} \; 2>/dev/null | head -10
```

**Prevention**: Cron job for disk cleanup, log rotation, monitoring alert at 80%

### OOM (Out of Memory)

**Symptom**: Process killed by kernel, `dmesg` shows OOM messages

**Diagnosis**:
```bash
dmesg | grep -i "oom\|out of memory" | tail -10
# Shows which process was killed and why

free -h  # Current memory state
ps aux --sort=-%mem | head -6  # Top memory consumers
```

**Fix**:
```bash
# Immediate: restart the killed service
# Long-term: increase RAM or reduce memory usage

# For vLLM: reduce --gpu-memory-utilization or --max-num-seqs
# For PostgreSQL: reduce shared_buffers or work_mem
# For Node.js: set --max-old-space-size=4096
```

**Prevention**: Set `.wslconfig` memory limits, tune `oom_score_adj` to protect critical services

### Connection Exhaustion

**Symptom**: "too many connections" from PostgreSQL, new requests rejected

**Diagnosis**:
```sql
-- Current connections
SELECT count(*), state FROM pg_stat_activity GROUP BY state;

-- Who's connected
SELECT usename, application_name, client_addr, state, count(*)
FROM pg_stat_activity
GROUP BY usename, application_name, client_addr, state
ORDER BY count DESC;

-- Idle in transaction (blocking vacuum and consuming connections)
SELECT pid, now() - xact_start AS duration, query
FROM pg_stat_activity
WHERE state = 'idle in transaction'
ORDER BY duration DESC;
```

**Fix**:
```sql
-- Kill idle-in-transaction connections older than 10 minutes
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle in transaction'
AND now() - xact_start > interval '10 minutes';
```

**Prevention**: Connection pooling (Prisma pool or PgBouncer), `idle_in_transaction_session_timeout`

### DNS Failure

**Symptom**: External API calls fail, "could not resolve host"

**Diagnosis**:
```bash
# Test DNS
nslookup google.com
dig google.com
cat /etc/resolv.conf
```

**Fix**:
```bash
# Quick fix
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf

# WSL2: may need to restart
# wsl --shutdown (from PowerShell)
```

### Certificate Expiry

**Symptom**: HTTPS errors, browser security warnings

**Diagnosis**:
```bash
# Check cert expiry
echo | openssl s_client -servername stone-ai.net -connect stone-ai.net:443 2>/dev/null | openssl x509 -noout -enddate
# Or
sudo certbot certificates
```

**Fix**:
```bash
sudo certbot renew --force-renewal
sudo nginx -s reload
```

**Prevention**: Certbot auto-renewal cron, monitoring alert 14 days before expiry

### Cascade Timeout

**Symptom**: All requests timing out, but individual services seem fine in isolation

**Diagnosis**: One slow dependency causes upstream timeouts to cascade

```bash
# Check each layer's response time
time curl -s http://localhost:8000/health  # vLLM
time curl -s http://localhost:3000/api/health  # Next.js
time docker exec stoneai-db psql -U postgres -c "SELECT 1"  # DB

# The slowest link is usually the culprit
```

**Fix**: Identify the slow layer, fix it, or add timeouts and circuit breakers so one slow service doesn't take down everything.

---

## 5. Recovery Playbooks

### Per-Service Restart

```bash
# vLLM
/usr/local/bin/vllm-restart.sh
# Or manually:
kill -SIGTERM $(cat /var/run/vllm.pid 2>/dev/null) 2>/dev/null; sleep 5
# (Then relaunch — see vllm-operations.md)

# PostgreSQL
docker compose restart db
# Verify: docker exec stoneai-db pg_isready -U postgres

# Redis
docker compose restart redis
# Verify: docker exec stoneai-redis redis-cli ping

# Next.js (local dev)
# Kill and restart: npm run dev

# nginx
sudo systemctl restart nginx
# Or reload: sudo nginx -s reload
```

### Data Recovery

```bash
# List available backups
ls -lht /var/backups/postgresql/

# Restore most recent backup
LATEST=$(ls -t /var/backups/postgresql/*.dump | head -1)
echo "Restoring from: $LATEST"

# Stop the app first (prevent writes during restore)
# Then restore:
docker exec -i stoneai-db pg_restore -U postgres --clean --if-exists -d stoneai < "$LATEST"

# Verify
docker exec stoneai-db psql -U postgres -d stoneai -c "SELECT count(*) FROM users;"
```

### Full Rollback

```bash
# 1. Identify the last known good state
git log --oneline -10  # Find the last good commit

# 2. Deploy the old version
git checkout <good-commit-hash>

# 3. Rebuild and restart
npm run build
# Restart services

# 4. Verify
curl -s http://localhost:3000/api/health
```

---

## 6. Post-Mortem Template

```markdown
# Incident Post-Mortem: [Brief Title]

## Summary
- **Date**: YYYY-MM-DD
- **Duration**: X minutes/hours
- **Severity**: S1/S2/S3
- **Impact**: [Who/what was affected]

## Timeline
- HH:MM — First alert / symptom noticed
- HH:MM — Investigation started
- HH:MM — Root cause identified
- HH:MM — Fix applied
- HH:MM — Service restored
- HH:MM — Monitoring confirmed stable

## Root Cause
[Clear explanation of what went wrong and why]

## Contributing Factors
- [Factor 1]
- [Factor 2]

## What Went Well
- [Good thing 1]
- [Good thing 2]

## What Went Poorly
- [Bad thing 1]
- [Bad thing 2]

## Action Items
- [ ] [Preventive measure 1] — Owner: [name] — Due: [date]
- [ ] [Preventive measure 2] — Owner: [name] — Due: [date]
- [ ] [Monitoring improvement] — Owner: [name] — Due: [date]
```

---

## 7. Escalation Matrix

### When Chaos Handles Alone
- S3 and S4 incidents
- Known issues with documented fixes
- Automatic recovery succeeds
- Scheduled maintenance tasks

### When to Alert Founder
- All S1 incidents
- S2 incidents lasting > 30 minutes
- Data loss or corruption (any severity)
- Security incidents (any severity)
- Repeated S3 incidents (same root cause 3+ times)
- Infrastructure costs exceeding budget
- Failed automated recovery

### Alert Format

```
SEVERITY: S1/S2
SERVICE: [affected service]
IMPACT: [what users experience]
STATUS: [investigating/mitigating/resolved]
ACTIONS TAKEN: [what's been done]
NEXT STEPS: [what's planned]
ETA: [if known]
```

---

## 8. Quick Reference Card

| Situation | First Action |
|---|---|
| Everything down | Run `triage.sh`, check Docker, check GPU |
| vLLM not responding | `curl localhost:8000/health`, check nvidia-smi, check logs |
| DB not responding | `docker exec stoneai-db pg_isready`, check container status |
| High latency | Check GPU temp, check queue depth, check DB slow queries |
| Disk full | `df -h`, clean logs/docker, find big files |
| OOM kill | `dmesg \| grep oom`, identify killed process, restart with lower memory |
| Can't reach internet | `cat /etc/resolv.conf`, try `nameserver 8.8.8.8` |
| SSL errors | `sudo certbot certificates`, renew if expired |
| Port conflict | `ss -tlnp \| grep :<port>`, kill conflicting process |
