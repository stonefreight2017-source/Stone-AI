# Monitoring & Observability — Palace Infrastructure Seed

> Chaos (Head 3) — Palace USB Knowledge Seed
> For Palace agents running on OMEN hardware without Claude Code supervision.
> Every command is copy-paste ready. Every section is self-contained.

---

## 1. Health Checks — Every Service

### HTTP Endpoint Check

```bash
#!/bin/bash
# check-http.sh <url> <service-name>
URL="${1:?Usage: check-http.sh <url> <name>}"
NAME="${2:-service}"
TIMEOUT=5

http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$URL" 2>/dev/null || echo "000")

if [ "$http_code" = "200" ]; then
  echo "OK: $NAME (HTTP $http_code)"
  exit 0
elif [ "$http_code" = "000" ]; then
  echo "FAIL: $NAME — connection refused or timeout"
  exit 1
else
  echo "WARN: $NAME (HTTP $http_code)"
  exit 1
fi
```

### TCP Port Check

```bash
#!/bin/bash
# check-port.sh <host> <port> <service-name>
HOST="${1:?Usage: check-port.sh <host> <port> <name>}"
PORT="${2:?}"
NAME="${3:-service}"
TIMEOUT=3

if timeout $TIMEOUT bash -c "echo > /dev/tcp/$HOST/$PORT" 2>/dev/null; then
  echo "OK: $NAME ($HOST:$PORT)"
  exit 0
else
  echo "FAIL: $NAME ($HOST:$PORT) — not responding"
  exit 1
fi
```

### Process Existence Check

```bash
#!/bin/bash
# check-process.sh <process-name>
PROCESS="${1:?Usage: check-process.sh <process-name>}"

if pgrep -f "$PROCESS" > /dev/null; then
  pid=$(pgrep -f "$PROCESS" | head -1)
  echo "OK: $PROCESS running (PID $pid)"
  exit 0
else
  echo "FAIL: $PROCESS not running"
  exit 1
fi
```

### Disk Space Check

```bash
#!/bin/bash
# check-disk.sh <mount-point> <warn-percent> <crit-percent>
MOUNT="${1:-/}"
WARN="${2:-80}"
CRIT="${3:-90}"

usage=$(df -h "$MOUNT" | tail -1 | awk '{print $5}' | tr -d '%')

if [ "$usage" -ge "$CRIT" ]; then
  echo "CRITICAL: Disk $MOUNT at ${usage}%"
  exit 2
elif [ "$usage" -ge "$WARN" ]; then
  echo "WARNING: Disk $MOUNT at ${usage}%"
  exit 1
else
  echo "OK: Disk $MOUNT at ${usage}%"
  exit 0
fi
```

### Composite Health Check (Stone AI Master)

```bash
#!/bin/bash
# master-health.sh — Check all Stone AI services
set -uo pipefail

FAILED=0
RESULTS=""

check() {
  local name="$1"
  local cmd="$2"
  result=$(eval "$cmd" 2>&1)
  status=$?
  RESULTS+="$result\n"
  if [ $status -ne 0 ]; then
    FAILED=$((FAILED + 1))
  fi
}

# vLLM
check "vLLM" "curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://localhost:8000/health | grep -q 200 && echo 'OK: vLLM' || echo 'FAIL: vLLM'"

# PostgreSQL
check "PostgreSQL" "docker exec stoneai-db pg_isready -U postgres > /dev/null 2>&1 && echo 'OK: PostgreSQL' || echo 'FAIL: PostgreSQL'"

# Redis
check "Redis" "docker exec stoneai-redis redis-cli ping 2>/dev/null | grep -q PONG && echo 'OK: Redis' || echo 'FAIL: Redis'"

# Next.js (if running locally)
check "Next.js" "curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://localhost:3000 | grep -qE '200|307' && echo 'OK: Next.js' || echo 'WARN: Next.js not running locally'"

# GPU
check "GPU" "nvidia-smi > /dev/null 2>&1 && echo 'OK: GPU accessible' || echo 'FAIL: GPU not accessible'"

# Disk
check "Disk" "$(dirname $0)/check-disk.sh / 80 90"

echo "=== Stone AI Health Report ==="
echo -e "$RESULTS"
echo "============================="
if [ $FAILED -gt 0 ]; then
  echo "STATUS: $FAILED check(s) FAILED"
  exit 1
else
  echo "STATUS: ALL HEALTHY"
  exit 0
fi
```

---

## 2. Establishing Baselines

### Why Baselines Matter

You can't detect anomalies without knowing what "normal" looks like. Collect baseline metrics during normal operation.

### Baseline Collection Script

```bash
#!/bin/bash
# collect-baseline.sh — Run for 24+ hours to establish normal patterns
set -euo pipefail

OUTPUT="/var/log/baseline-$(date +%Y%m%d).csv"
echo "timestamp,cpu_pct,mem_used_mb,mem_total_mb,gpu_util,gpu_temp,gpu_vram_used,disk_pct,vllm_status,db_status,redis_status" > "$OUTPUT"

while true; do
  ts=$(date '+%Y-%m-%d %H:%M:%S')

  # CPU (average across all cores)
  cpu=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d. -f1)

  # Memory
  mem_used=$(free -m | grep Mem | awk '{print $3}')
  mem_total=$(free -m | grep Mem | awk '{print $2}')

  # GPU
  gpu_util=$(nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits 2>/dev/null || echo "N/A")
  gpu_temp=$(nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader,nounits 2>/dev/null || echo "N/A")
  gpu_vram=$(nvidia-smi --query-gpu=memory.used --format=csv,noheader,nounits 2>/dev/null || echo "N/A")

  # Disk
  disk=$(df -h / | tail -1 | awk '{print $5}' | tr -d '%')

  # Service status (1=up, 0=down)
  vllm=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:8000/health 2>/dev/null | grep -q 200 && echo 1 || echo 0)
  db=$(docker exec stoneai-db pg_isready -U postgres > /dev/null 2>&1 && echo 1 || echo 0)
  redis=$(docker exec stoneai-redis redis-cli ping 2>/dev/null | grep -q PONG && echo 1 || echo 0)

  echo "$ts,$cpu,$mem_used,$mem_total,$gpu_util,$gpu_temp,$gpu_vram,$disk,$vllm,$db,$redis" >> "$OUTPUT"

  sleep 60  # Collect every minute
done
```

### Time-of-Day Patterns

Stone AI traffic patterns (expected):
- **Low**: 2AM-6AM (maintenance window)
- **Medium**: 6AM-9AM, 6PM-10PM
- **High**: 9AM-6PM (peak usage)
- **Spike risk**: Product launches, marketing campaigns

### Deviation Triggers

| Metric | Normal | Warning | Critical |
|---|---|---|---|
| CPU % | 20-60% | > 80% for 5 min | > 95% for 2 min |
| RAM used | 40-70% | > 85% | > 95% |
| GPU util | 10-70% | > 90% for 10 min | N/A (expected under load) |
| GPU temp | 50-75C | > 80C | > 85C |
| Disk used | < 70% | > 80% | > 90% |
| vLLM latency | 0.5-5s | > 10s | > 30s or timeout |
| DB connections | 5-30 | > 80 | > 95 |
| Redis memory | < 200MB | > 220MB | > 250MB (eviction starts) |

---

## 3. Log Aggregation

### Structured JSON Logging

Always log in JSON format for easy parsing:

```json
{
  "timestamp": "2024-01-15T12:30:45.123Z",
  "level": "error",
  "service": "vllm-proxy",
  "message": "Request timeout after 120s",
  "request_id": "req_abc123",
  "user_id": "user_xyz",
  "model": "qwen3-32b-awq",
  "latency_ms": 120000,
  "error": "ETIMEDOUT"
}
```

### Log Levels

| Level | When to Use | Example |
|---|---|---|
| `error` | Service-affecting issues requiring attention | DB connection failed, OOM |
| `warn` | Degraded but functional, or approaching limits | High latency, disk 85% |
| `info` | Normal significant operations | Service started, backup complete |
| `debug` | Detailed operational data | Request/response details, cache hit/miss |

### Centralizing Docker Container Logs

```bash
# View all container logs in one terminal
docker compose logs -f --tail 50

# Per-service log files
docker compose logs -f db > /var/log/stone-ai/db.log 2>&1 &
docker compose logs -f redis > /var/log/stone-ai/redis.log 2>&1 &

# Or configure Docker logging driver
# /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "50m",
    "max-file": "5"
  }
}
```

### Log Search Patterns

```bash
# Find errors in vLLM logs
grep -i "error\|exception\|fail\|oom" /var/log/vllm/vllm-server.log | tail -20

# Find slow requests (if logging latency)
grep "latency_ms" /var/log/stone-ai/api.log | awk -F'"latency_ms":' '{print $2}' | sort -n | tail -10

# Count errors per hour
grep "error" /var/log/vllm/vllm-server.log | awk '{print $1}' | cut -dT -f1-2 | uniq -c | sort -rn

# Find patterns around a timestamp
grep "2024-01-15T12:3" /var/log/vllm/vllm-server.log
```

---

## 4. Alerting

### Threshold-Based Alerts

```bash
#!/bin/bash
# alert-check.sh — Run via cron every 2 minutes
set -uo pipefail

ALERT_FILE="/tmp/last-alert"
COOLDOWN=300  # 5 minutes between repeated alerts

should_alert() {
  local key="$1"
  local file="${ALERT_FILE}-${key}"
  if [ -f "$file" ]; then
    last=$(cat "$file")
    now=$(date +%s)
    if [ $((now - last)) -lt $COOLDOWN ]; then
      return 1  # Still in cooldown
    fi
  fi
  date +%s > "$file"
  return 0
}

alert() {
  local severity="$1"
  local message="$2"
  local key="$3"

  if should_alert "$key"; then
    echo "[$(date)] [$severity] $message" >> /var/log/stone-ai/alerts.log

    # Future: integrate with sendFounderAlert() for email
    # For now, just log
    echo "ALERT [$severity]: $message"
  fi
}

# GPU temperature
gpu_temp=$(nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader,nounits 2>/dev/null || echo "0")
if [ "$gpu_temp" -gt 85 ]; then
  alert "CRITICAL" "GPU temperature ${gpu_temp}C" "gpu-temp"
elif [ "$gpu_temp" -gt 80 ]; then
  alert "WARNING" "GPU temperature ${gpu_temp}C" "gpu-temp"
fi

# Disk space
disk_pct=$(df -h / | tail -1 | awk '{print $5}' | tr -d '%')
if [ "$disk_pct" -gt 90 ]; then
  alert "CRITICAL" "Disk usage ${disk_pct}%" "disk"
elif [ "$disk_pct" -gt 80 ]; then
  alert "WARNING" "Disk usage ${disk_pct}%" "disk"
fi

# vLLM health
vllm_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:8000/health 2>/dev/null || echo "000")
if [ "$vllm_status" != "200" ]; then
  alert "CRITICAL" "vLLM unhealthy (HTTP $vllm_status)" "vllm"
fi

# DB health
if ! docker exec stoneai-db pg_isready -U postgres > /dev/null 2>&1; then
  alert "CRITICAL" "PostgreSQL not ready" "db"
fi

# Memory
mem_pct=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100)}')
if [ "$mem_pct" -gt 95 ]; then
  alert "CRITICAL" "RAM usage ${mem_pct}%" "memory"
elif [ "$mem_pct" -gt 85 ]; then
  alert "WARNING" "RAM usage ${mem_pct}%" "memory"
fi
```

### Alert Fatigue Prevention

| Strategy | Implementation |
|---|---|
| **Cooldown period** | Don't re-alert for same issue within 5 minutes |
| **Severity levels** | Only page for CRITICAL, log for WARNING |
| **Grouped alerts** | Bundle related alerts (GPU temp + vLLM slow = one alert) |
| **Auto-resolve** | Log when issue clears ("GPU temperature back to normal") |
| **Maintenance windows** | Suppress alerts during scheduled maintenance (2AM-4AM) |

### Severity Levels

| Severity | Response | Examples |
|---|---|---|
| **S1 - CRITICAL** | Immediate action. Alert founder. | Total outage, DB down, data loss risk |
| **S2 - WARNING** | Investigate within 30 minutes | High latency, disk 85%, elevated errors |
| **S3 - INFO** | Review next session | Backup completed, service restarted automatically |
| **S4 - DEBUG** | Log only, no action | Cache miss rates, individual request timing |

---

## 5. Shell-Based Monitoring

### Watch Loops

```bash
# Live service dashboard (refreshes every 5s)
watch -n 5 'echo "=== Stone AI Status ===" && \
  echo -n "vLLM: " && curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health && \
  echo -n "  DB: " && docker exec stoneai-db pg_isready -U postgres 2>&1 | tail -1 && \
  echo -n "  Redis: " && docker exec stoneai-redis redis-cli ping 2>&1 && \
  echo "=== Resources ===" && \
  echo "CPU: $(top -bn1 | grep Cpu | awk "{print \$2}")%" && \
  echo "RAM: $(free -h | grep Mem | awk "{print \$3}")/$(free -h | grep Mem | awk "{print \$2}")" && \
  nvidia-smi --query-gpu=temperature.gpu,utilization.gpu,memory.used --format=csv,noheader 2>/dev/null'
```

### Metric Files for Simple Dashboards

```bash
#!/bin/bash
# metrics-writer.sh — Write metrics to files for easy reading
METRICS_DIR="/var/run/stone-ai-metrics"
mkdir -p "$METRICS_DIR"

while true; do
  # Write individual metric files
  nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader,nounits > "$METRICS_DIR/gpu_temp" 2>/dev/null
  nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits > "$METRICS_DIR/gpu_util" 2>/dev/null
  nvidia-smi --query-gpu=memory.used --format=csv,noheader,nounits > "$METRICS_DIR/gpu_vram" 2>/dev/null
  free -m | grep Mem | awk '{print $3}' > "$METRICS_DIR/ram_used_mb"
  df -h / | tail -1 | awk '{print $5}' | tr -d '%' > "$METRICS_DIR/disk_pct"
  curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:8000/health > "$METRICS_DIR/vllm_status" 2>/dev/null

  # Composite status
  echo "$(date '+%H:%M:%S') GPU=$(cat $METRICS_DIR/gpu_temp)C RAM=$(cat $METRICS_DIR/ram_used_mb)MB DISK=$(cat $METRICS_DIR/disk_pct)% vLLM=$(cat $METRICS_DIR/vllm_status)" >> "$METRICS_DIR/timeline.log"

  sleep 10
done
```

### Reading Metrics

```bash
# Quick status read
cat /var/run/stone-ai-metrics/gpu_temp   # Just the number
cat /var/run/stone-ai-metrics/timeline.log | tail -5  # Last 5 readings

# Use in conditionals
if [ "$(cat /var/run/stone-ai-metrics/gpu_temp)" -gt 80 ]; then
  echo "GPU too hot!"
fi
```

---

## 6. vLLM-Specific Monitoring

### Prometheus Metrics Endpoint

```bash
# vLLM exposes /metrics in Prometheus format
curl -s http://localhost:8000/metrics

# Key metrics to track:
# vllm:num_requests_running     — Currently processing
# vllm:num_requests_waiting     — Queued
# vllm:gpu_cache_usage_perc     — KV cache utilization
# vllm:avg_prompt_throughput_tps — Input tokens/sec
# vllm:avg_generation_throughput_tps — Output tokens/sec
```

### Extract vLLM Metrics Script

```bash
#!/bin/bash
# vllm-metrics.sh — Parse and display key vLLM metrics
METRICS=$(curl -s http://localhost:8000/metrics 2>/dev/null)

if [ -z "$METRICS" ]; then
  echo "FAIL: Cannot reach vLLM metrics endpoint"
  exit 1
fi

extract() {
  echo "$METRICS" | grep "^$1 " | awk '{print $2}'
}

echo "=== vLLM Metrics ==="
echo "Running requests:   $(extract 'vllm:num_requests_running')"
echo "Waiting requests:   $(extract 'vllm:num_requests_waiting')"
echo "KV cache usage:     $(extract 'vllm:gpu_cache_usage_perc')"
echo "Prompt throughput:  $(extract 'vllm:avg_prompt_throughput_tps_per_second') tok/s"
echo "Gen throughput:     $(extract 'vllm:avg_generation_throughput_tps_per_second') tok/s"
```

---

## 7. Database Monitoring

### PostgreSQL Key Metrics

```bash
#!/bin/bash
# db-metrics.sh — Key PostgreSQL health metrics
DB_CMD="docker exec stoneai-db psql -U postgres -d stoneai -t -A"

echo "=== PostgreSQL Metrics ==="

# Active connections
echo -n "Connections: "
$DB_CMD -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"

# Connection utilization
echo -n "Conn usage: "
$DB_CMD -c "SELECT count(*) || '/' || setting FROM pg_stat_activity, pg_settings WHERE pg_settings.name = 'max_connections' GROUP BY setting;"

# Database size
echo -n "DB size: "
$DB_CMD -c "SELECT pg_size_pretty(pg_database_size('stoneai'));"

# Dead tuples (vacuum health)
echo "Top tables by dead tuples:"
$DB_CMD -c "SELECT relname, n_dead_tup FROM pg_stat_user_tables WHERE n_dead_tup > 100 ORDER BY n_dead_tup DESC LIMIT 5;"

# Cache hit ratio (should be > 99%)
echo -n "Cache hit ratio: "
$DB_CMD -c "SELECT ROUND(100.0 * sum(blks_hit) / GREATEST(sum(blks_hit) + sum(blks_read), 1), 2) || '%' FROM pg_stat_database WHERE datname = 'stoneai';"

# Oldest running query
echo -n "Longest active query: "
$DB_CMD -c "SELECT COALESCE(max(now() - query_start)::text, 'none') FROM pg_stat_activity WHERE state = 'active' AND query NOT LIKE 'autovacuum%';"
```

---

## 8. Redis Monitoring

```bash
#!/bin/bash
# redis-metrics.sh — Key Redis health metrics

REDIS_CMD="docker exec stoneai-redis redis-cli"

echo "=== Redis Metrics ==="

# Memory
echo -n "Memory used: "
$REDIS_CMD info memory | grep used_memory_human | cut -d: -f2 | tr -d '\r'

# Keys
echo -n "Total keys: "
$REDIS_CMD dbsize | awk '{print $2}'

# Connected clients
echo -n "Clients: "
$REDIS_CMD info clients | grep connected_clients | cut -d: -f2 | tr -d '\r'

# Hit rate
hits=$($REDIS_CMD info stats | grep keyspace_hits | cut -d: -f2 | tr -d '\r')
misses=$($REDIS_CMD info stats | grep keyspace_misses | cut -d: -f2 | tr -d '\r')
if [ "$((hits + misses))" -gt 0 ]; then
  ratio=$(echo "scale=2; $hits * 100 / ($hits + $misses)" | bc)
  echo "Hit rate: ${ratio}%"
else
  echo "Hit rate: N/A (no requests)"
fi

# Evictions
echo -n "Evictions: "
$REDIS_CMD info stats | grep evicted_keys | cut -d: -f2 | tr -d '\r'
```

---

## 9. Cron-Based Monitoring Setup

```bash
# Add to crontab (crontab -e)

# Master health check every 2 minutes
*/2 * * * * /usr/local/bin/master-health.sh >> /var/log/stone-ai/health.log 2>&1

# Alert checks every 2 minutes
*/2 * * * * /usr/local/bin/alert-check.sh >> /var/log/stone-ai/alerts.log 2>&1

# Detailed metrics every 5 minutes
*/5 * * * * /usr/local/bin/collect-metrics.sh >> /var/log/stone-ai/metrics.csv 2>&1

# Daily report at 6 AM
0 6 * * * /usr/local/bin/daily-report.sh >> /var/log/stone-ai/daily.log 2>&1

# Log rotation weekly
0 0 * * 0 /usr/local/bin/rotate-logs.sh >> /var/log/stone-ai/rotation.log 2>&1
```

---

## 10. Quick Reference Card

| Task | Command |
|---|---|
| Full health check | `/usr/local/bin/master-health.sh` |
| GPU temperature | `nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader,nounits` |
| vLLM metrics | `curl -s http://localhost:8000/metrics` |
| DB connections | `docker exec stoneai-db psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"` |
| Redis memory | `docker exec stoneai-redis redis-cli info memory \| grep used_memory_human` |
| Disk usage | `df -h` |
| RAM usage | `free -h` |
| Container stats | `docker stats --no-stream` |
| View alerts | `tail -20 /var/log/stone-ai/alerts.log` |
| View timeline | `tail -10 /var/run/stone-ai-metrics/timeline.log` |
