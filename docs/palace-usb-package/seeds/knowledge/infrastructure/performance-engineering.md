# Performance Engineering — Palace Infrastructure Seed

> Chaos (Head 3) — Palace USB Knowledge Seed
> For Palace agents running on OMEN hardware without Claude Code supervision.
> Every command is copy-paste ready. Every section is self-contained.

---

## 1. Profiling Tools

### System-Level Profiling

```bash
# CPU profiling with perf (Linux)
sudo perf top  # Live top functions by CPU usage
sudo perf record -g -p <pid> -- sleep 30  # Record 30s profile
sudo perf report  # View the recording

# IO profiling
iostat -x 1 5  # Extended IO stats every 1s for 5 iterations
# Key columns:
# %util — device utilization (>80% = saturated)
# await — average IO wait time in ms (>10ms on SSD = slow)
# r/s, w/s — reads/writes per second

# Network profiling
sar -n DEV 1 5  # Network stats per interface
# Or simpler:
cat /proc/net/dev  # Raw counters
```

### Node.js Profiling

```bash
# Start with inspector
node --inspect server.js
# Connect Chrome DevTools: chrome://inspect

# CPU profile for 30 seconds
node --prof server.js
# Generates isolate-*.log
node --prof-process isolate-*.log > profile.txt

# Heap snapshot (memory leaks)
# In running process, send signal:
kill -USR1 <pid>  # Generates heap snapshot

# Memory usage tracking
node -e "console.log(process.memoryUsage())"
# {rss, heapTotal, heapUsed, external, arrayBuffers}
```

### PostgreSQL Profiling (pg_stat_statements)

```sql
-- Enable the extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Top queries by total execution time
SELECT
  LEFT(query, 100) AS query,
  calls,
  ROUND(total_exec_time::numeric / 1000, 2) AS total_sec,
  ROUND(mean_exec_time::numeric, 2) AS mean_ms,
  rows,
  ROUND(100.0 * shared_blks_hit / GREATEST(shared_blks_hit + shared_blks_read, 1), 1) AS cache_hit_pct
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;

-- Queries with worst cache hit ratio (hitting disk)
SELECT
  LEFT(query, 100),
  calls,
  shared_blks_hit,
  shared_blks_read,
  ROUND(100.0 * shared_blks_hit / GREATEST(shared_blks_hit + shared_blks_read, 1), 1) AS hit_pct
FROM pg_stat_statements
WHERE shared_blks_hit + shared_blks_read > 100
ORDER BY hit_pct ASC
LIMIT 10;
```

### GPU Profiling

```bash
# Real-time GPU monitoring
nvidia-smi dmon -s pucvmet -d 1
# p=power, u=utilization, c=clocks, v=vram, m=memory controller, e=encoder, t=temperature

# Detailed query
nvidia-smi --query-gpu=timestamp,name,temperature.gpu,utilization.gpu,utilization.memory,memory.used,memory.total,power.draw --format=csv -l 1

# For vLLM specifically, check the /metrics endpoint
curl -s http://localhost:8000/metrics | grep -E "throughput|latency|cache"
```

---

## 2. Bottleneck Identification

### The USE Method

For every resource, check:
- **U**tilization: How busy is it? (0-100%)
- **S**aturation: How much excess work is queued?
- **E**rrors: Any error events?

| Resource | Utilization | Saturation | Errors |
|---|---|---|---|
| **CPU** | `top`, `mpstat` | Load average > cores | `dmesg` |
| **RAM** | `free -h` (available) | Swap usage | OOM in `dmesg` |
| **GPU** | `nvidia-smi` (util %) | vLLM waiting queue | CUDA errors |
| **GPU VRAM** | `nvidia-smi` (memory) | KV cache full | OOM errors |
| **Disk IO** | `iostat` (%util) | `iostat` (avgqu-sz) | `dmesg` IO errors |
| **Network** | `sar -n DEV` | `ss -s` (queues) | Interface errors |
| **DB connections** | `pg_stat_activity` | Wait events | Connection refused |

### Amdahl's Law (Quick Version)

If you optimize a component that accounts for X% of total time, the maximum speedup is:

```
Speedup = 1 / ((1 - X/100) + (X/100) / improvement_factor)
```

Example: vLLM inference is 80% of request time. Making it 2x faster:
```
Speedup = 1 / (0.2 + 0.8/2) = 1 / 0.6 = 1.67x
```

**Implication**: Optimize the biggest bottleneck first. Small components don't matter much.

### Finding the Bottleneck

```bash
# Step 1: What's the user-visible symptom?
# "API response takes 5 seconds"

# Step 2: Break down the time
time curl -s http://localhost:3000/api/chat -d '...'
# Total: 5.2s

# Step 3: Measure each component
time curl -s http://localhost:8000/v1/chat/completions -d '...'
# vLLM: 4.8s (92% of time — this is the bottleneck)

time docker exec stoneai-db psql -U postgres -c "SELECT 1"
# DB: 0.01s (negligible)

# Step 4: Is it the bottleneck or is it saturated?
curl -s http://localhost:8000/metrics | grep waiting
# If waiting > 0, vLLM is saturated — need more capacity

# Step 5: Optimize the bottleneck
# For vLLM: reduce context, use FP8 KV cache, reduce concurrent requests
```

---

## 3. Caching

### Redis Patterns

#### Cache-Aside (Lazy Loading)

```
1. App checks Redis for cached data
2. Cache HIT → return cached data
3. Cache MISS → query DB, store in Redis, return data
```

```bash
# Set with TTL
docker exec stoneai-redis redis-cli SET "user:abc123" '{"name":"Stone"}' EX 3600

# Get
docker exec stoneai-redis redis-cli GET "user:abc123"

# Check TTL remaining
docker exec stoneai-redis redis-cli TTL "user:abc123"
```

#### Write-Through

```
1. App writes to Redis AND DB simultaneously
2. Reads always hit Redis first
3. Guaranteed consistency (no stale data)
```

#### Cache Invalidation

```bash
# Delete specific key
docker exec stoneai-redis redis-cli DEL "user:abc123"

# Delete by pattern
docker exec stoneai-redis redis-cli --scan --pattern "user:*" | xargs -L 1 docker exec stoneai-redis redis-cli DEL

# Flush entire cache (CAREFUL)
docker exec stoneai-redis redis-cli FLUSHDB
```

### Redis Configuration for Stone AI

```bash
# Memory limit and eviction
docker exec stoneai-redis redis-cli CONFIG SET maxmemory 256mb
docker exec stoneai-redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
# allkeys-lru: Evict least recently used keys when memory is full

# Check memory
docker exec stoneai-redis redis-cli INFO memory | grep -E "used_memory_human|maxmemory_human"

# Check hit rate
docker exec stoneai-redis redis-cli INFO stats | grep -E "keyspace_hits|keyspace_misses"
```

### Eviction Policies

| Policy | Behavior | Use When |
|---|---|---|
| `noeviction` | Return error when full | Data must never be lost |
| `allkeys-lru` | Evict least recently used | General caching (Stone AI default) |
| `volatile-lru` | Evict LRU among keys with TTL | Mix of cache + persistent data |
| `allkeys-random` | Evict random keys | When access patterns are uniform |

### HTTP Caching

```nginx
# nginx caching for static assets
location /static/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_cache_valid 200 1d;  # Cache 200 responses for 1 day
    add_header Cache-Control "public, max-age=86400";
    add_header X-Cache-Status $upstream_cache_status;
}

# No caching for API
location /api/ {
    proxy_pass http://127.0.0.1:3000;
    add_header Cache-Control "no-store";
    proxy_no_cache 1;
}
```

### CDN Caching (Cloudflare)

Stone AI uses Cloudflare with proxy ON:
- Static assets (CSS, JS, images): cached at edge automatically
- API responses: not cached (Cache-Control: no-store)
- Page rules can override per-path caching behavior

```bash
# Purge Cloudflare cache (via API)
curl -X POST "https://api.cloudflare.com/client/v4/zones/ZONE_ID/purge_cache" \
  -H "Authorization: Bearer CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"purge_everything":true}'
```

---

## 4. Load Testing

### HTTP Load Testing with hey

```bash
# Install
go install github.com/rakyll/hey@latest
# Or download binary from https://github.com/rakyll/hey

# Basic load test (200 requests, 10 concurrent)
hey -n 200 -c 10 http://localhost:3000/api/health

# Sustained load (30 seconds, 5 concurrent)
hey -z 30s -c 5 http://localhost:3000/api/health

# POST request with body
hey -n 100 -c 5 -m POST \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}],"model":"qwen3-32b-awq","max_tokens":50}' \
  http://localhost:8000/v1/chat/completions
```

### HTTP Load Testing with wrk

```bash
# Install
sudo apt install wrk

# Basic load test (2 threads, 10 connections, 30 seconds)
wrk -t2 -c10 -d30s http://localhost:3000/api/health

# With custom script for POST
wrk -t2 -c5 -d30s -s post.lua http://localhost:8000/v1/chat/completions
```

### PostgreSQL Load Testing with pgbench

```bash
# Initialize test tables
docker exec stoneai-db pgbench -U postgres -i stoneai

# Run benchmark (10 clients, 60 seconds)
docker exec stoneai-db pgbench -U postgres -c 10 -T 60 stoneai

# Read-only workload
docker exec stoneai-db pgbench -U postgres -c 10 -T 60 -S stoneai

# Key metrics:
# tps (transactions per second) — higher is better
# latency average — lower is better
```

### vLLM Concurrent Testing

```bash
#!/bin/bash
# vllm-load-test.sh — Test vLLM under concurrent load
set -euo pipefail

CONCURRENT="${1:-5}"
REQUESTS="${2:-20}"
ENDPOINT="http://localhost:8000/v1/chat/completions"

echo "Testing vLLM: $REQUESTS requests, $CONCURRENT concurrent"

test_request() {
  local id=$1
  local start=$(date +%s%N)
  local status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 120 \
    -X POST "$ENDPOINT" \
    -H "Content-Type: application/json" \
    -d '{"model":"/mnt/c/models/qwen3-32b-awq","messages":[{"role":"user","content":"Write a haiku about AI."}],"max_tokens":100}')
  local end=$(date +%s%N)
  local duration_ms=$(( (end - start) / 1000000 ))
  echo "Request $id: HTTP $status, ${duration_ms}ms"
}

export -f test_request
export ENDPOINT

seq 1 $REQUESTS | xargs -P $CONCURRENT -I {} bash -c 'test_request {}'
```

---

## 5. Optimization Patterns

### Database Query Optimization

```sql
-- Step 1: Find slow queries
SELECT LEFT(query, 100), mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 5;

-- Step 2: EXPLAIN ANALYZE the slow query
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM messages WHERE user_id = 'abc' ORDER BY created_at DESC LIMIT 20;

-- Step 3: Add missing index
CREATE INDEX CONCURRENTLY idx_messages_user_created ON messages(user_id, created_at DESC);

-- Step 4: Verify improvement
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM messages WHERE user_id = 'abc' ORDER BY created_at DESC LIMIT 20;
-- Should show Index Scan instead of Seq Scan
```

### vLLM Throughput Optimization

| Lever | Action | Tradeoff |
|---|---|---|
| FP8 KV cache | `--kv-cache-dtype fp8_e5m2` | Minimal quality loss |
| Increase batch size | `--max-num-seqs 32-64` | Higher latency per request |
| Reduce context | `--max-model-len 16384` | Can't handle long inputs |
| Memory utilization | `--gpu-memory-utilization 0.92` | Risk of OOM on spikes |
| Disable eager mode | Remove `--enforce-eager` | CUDA graphs = faster |

### Next.js Performance

```bash
# Build analysis
ANALYZE=true npm run build
# Generates .next/analyze/ with bundle size visualization

# Key areas:
# - Large dependencies in client bundle
# - Unoptimized images
# - Missing dynamic imports for heavy components
# - Server components vs client components
```

---

## 6. Benchmarking Methodology

### Rules for Valid Benchmarks

1. **Warm up**: Run the test once to warm caches, then measure
2. **Isolate**: Don't run other workloads during the benchmark
3. **Repeat**: Run at least 3 times, report median
4. **Measure what matters**: Latency percentiles (p50, p95, p99) not just averages
5. **Document conditions**: Hardware, software versions, config, data size

### Latency Percentiles

```
p50 (median): Half of requests are faster than this
p95: 95% of requests are faster (5% are slower)
p99: 99% of requests are faster (1% are slower)
```

The p99 is often 5-10x the p50. Optimizing for p99 improves the worst user experience.

```bash
# Collect latency samples
for i in $(seq 1 100); do
  curl -s -o /dev/null -w "%{time_total}\n" http://localhost:8000/health
done | sort -n > latencies.txt

# Calculate percentiles
total=$(wc -l < latencies.txt)
p50=$(sed -n "$((total * 50 / 100))p" latencies.txt)
p95=$(sed -n "$((total * 95 / 100))p" latencies.txt)
p99=$(sed -n "$((total * 99 / 100))p" latencies.txt)
echo "p50=${p50}s p95=${p95}s p99=${p99}s"
```

---

## 7. Quick Reference Card

| Task | Command |
|---|---|
| CPU top processes | `ps aux --sort=-%cpu \| head -6` |
| Memory top processes | `ps aux --sort=-%mem \| head -6` |
| Disk IO stats | `iostat -x 1 3` |
| Network stats | `sar -n DEV 1 3` |
| GPU profiling | `nvidia-smi dmon -s pucvmet -d 1` |
| vLLM metrics | `curl -s http://localhost:8000/metrics` |
| DB slow queries | `SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;` |
| Redis hit rate | `docker exec stoneai-redis redis-cli INFO stats \| grep keyspace` |
| Redis memory | `docker exec stoneai-redis redis-cli INFO memory` |
| HTTP load test | `hey -n 200 -c 10 http://localhost:3000/api/health` |
| DB load test | `docker exec stoneai-db pgbench -U postgres -c 10 -T 60 stoneai` |
| Measure latency | `curl -s -o /dev/null -w "%{time_total}s\n" <url>` |
