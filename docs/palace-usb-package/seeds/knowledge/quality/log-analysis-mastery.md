# Log Analysis Mastery — Wiz v3 Seed

> Computer Wiz (Royal Guard — The Diagnostician)
> Seed Class: Quality / Log Analysis
> Version: 3.0 — Full Software + Hardware Diagnostic Coverage
> Created: 2026-03-09

---

## 1. Philosophy: Logs Are the Crime Scene

Every bug, every crash, every performance anomaly leaves traces in logs. The difference between a developer who spends 4 hours debugging and one who solves it in 10 minutes is usually: the fast one knows how to read logs. Wiz reads logs like a detective reads a crime scene — looking for timelines, patterns, anomalies, and causal chains.

**The Four Questions Every Log Investigation Answers:**
1. **WHEN** did the problem start? (Timeline)
2. **WHAT** changed? (Trigger)
3. **WHERE** in the stack did it fail? (Component)
4. **WHY** did it fail? (Root cause)

---

## 2. Pattern Recognition in Logs

### 2.1 Error Clustering

Errors rarely come alone. A single root cause often produces a cascade of related errors. The skill is grouping errors into clusters and finding the root of each cluster.

**Clustering Strategy:**
```
Raw Errors (chronological):
  14:05:01 — Prisma: Connection pool timeout
  14:05:01 — API: /api/chat returned 500
  14:05:02 — Prisma: Connection pool timeout
  14:05:02 — API: /api/agents returned 500
  14:05:02 — Middleware: Auth check failed (timeout)
  14:05:03 — Frontend: Fetch error on /api/chat

Clustered:
  ROOT: Prisma connection pool timeout (14:05:01)
  ├── EFFECT: API /api/chat 500 (14:05:01)
  ├── EFFECT: API /api/agents 500 (14:05:02)
  ├── EFFECT: Middleware auth timeout (14:05:02)
  └── EFFECT: Frontend fetch error (14:05:03)

  DIAGNOSIS: Database connection issue. Check Neon status, connection limits.
```

**Clustering Techniques:**

```bash
# Count error types (find the most common)
grep -i "error" app.log | sed 's/[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}T[0-9:.]*Z//g' | sort | uniq -c | sort -rn | head -20

# Group by timestamp window (errors per minute)
grep -i "error" app.log | cut -d'T' -f1-2 | cut -d':' -f1-2 | sort | uniq -c | sort -rn

# Find first occurrence of each error type
grep -i "error" app.log | sort -t'|' -k2 -u | head -20

# Find error bursts (>5 errors in same second)
grep -i "error" app.log | cut -d' ' -f1 | uniq -c | sort -rn | awk '$1 > 5'
```

### 2.2 Frequency Analysis

```bash
# Errors per hour (spot trends)
grep -i "error" app.log | awk -F'T' '{print substr($2,1,2)":00"}' | sort | uniq -c

# Example output:
#   12 08:00   ← low
#   15 09:00   ← low
#   145 10:00  ← SPIKE! What happened at 10am?
#   23 11:00   ← settling
#   14 12:00   ← normal

# Errors by day of week
grep -i "error" app.log | awk -F'T' '{print $1}' | while read date; do
  date -d "$date" +%A 2>/dev/null || echo "$date"
done | sort | uniq -c | sort -rn

# Response codes distribution
grep "HTTP" access.log | grep -oP 'HTTP/\d\.\d" \K\d{3}' | sort | uniq -c | sort -rn

# Slow requests (>1 second)
grep -P '"duration":\s*[1-9]\d{3,}' app.log | head -20
```

### 2.3 Anomaly Detection Patterns

```bash
# Find NEW errors (errors that appeared today but not yesterday)
comm -13 <(grep -i "error" yesterday.log | sed 's/[0-9T:.Z-]*//g' | sort -u) \
         <(grep -i "error" today.log | sed 's/[0-9T:.Z-]*//g' | sort -u)

# Find sudden frequency changes
# Compare error count this hour vs same hour yesterday
THIS_HOUR=$(grep -ic "error" <(grep "$(date +%Y-%m-%dT%H)" app.log))
# vs
YESTERDAY=$(grep -ic "error" <(grep "$(date -d yesterday +%Y-%m-%dT%H)" app.log))
echo "Today: $THIS_HOUR, Yesterday: $YESTERDAY"

# Find log gaps (periods with NO logs — process may have crashed)
awk -F'T' '{print $1"T"substr($2,1,5)}' app.log | uniq -c | awk '$1==0 || prev && $2!=prev+1 {print "GAP at "$2} {prev=$2}'
```

---

## 3. Cross-Service Correlation

### 3.1 Timestamp Matching

When a problem spans multiple services, timestamps are your primary correlation tool.

```bash
# Correlate events across services within a 2-second window
# Service A log:
# 2026-03-09T14:05:01.234Z [api] POST /api/chat started — requestId=abc123

# Service B log:
# 2026-03-09T14:05:01.456Z [prisma] Query SELECT "Message".* WHERE "chatId" = ... — duration=890ms

# Service C log:
# 2026-03-09T14:05:02.345Z [clerk] Token validation for user_xxx — 200 OK

# Correlate: extract timestamp range around incident
START="2026-03-09T14:05:00"
END="2026-03-09T14:05:05"

for logfile in api.log prisma.log clerk.log; do
  echo "=== $logfile ==="
  awk -v start="$START" -v end="$END" '$1 >= start && $1 <= end' "$logfile"
done
```

### 3.2 Request ID Tracing

Request IDs are the gold standard for cross-service correlation. Every request gets a unique ID that flows through all services.

```typescript
// Middleware to inject request ID (Next.js)
// middleware.ts
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

export function middleware(request: Request) {
  const requestId = request.headers.get('x-request-id') || nanoid();
  const response = NextResponse.next();
  response.headers.set('x-request-id', requestId);

  // Log with request ID
  console.log(JSON.stringify({
    requestId,
    method: request.method,
    url: request.url,
    timestamp: new Date().toISOString(),
  }));

  return response;
}
```

```bash
# Trace a request across all logs
REQUEST_ID="abc123"
grep "$REQUEST_ID" api.log prisma.log auth.log

# Full request timeline
grep "$REQUEST_ID" *.log | sort -t'T' -k2

# Example output:
# api.log:2026-03-09T14:05:01.234Z requestId=abc123 POST /api/chat started
# auth.log:2026-03-09T14:05:01.300Z requestId=abc123 token validated user=user_xxx
# prisma.log:2026-03-09T14:05:01.350Z requestId=abc123 query started
# prisma.log:2026-03-09T14:05:02.240Z requestId=abc123 query completed 890ms
# api.log:2026-03-09T14:05:02.280Z requestId=abc123 POST /api/chat completed 1046ms
```

### 3.3 Distributed Tracing Concepts

```
Request Flow Through Stone AI:
Browser → Vercel Edge → Next.js Middleware → API Route → Prisma → Neon DB
                                                      → Clerk API
                                                      → vLLM / Claude API

Each hop adds latency. Distributed tracing shows:
- Total request duration
- Duration of each hop
- Which hop is the bottleneck
- Whether hops are sequential or parallel

Simple DIY Tracing:
┌─ Request Start (T0) ─────────────────────────────────────────────┐
│  ├─ Auth Check (T0+50ms) ──────── (T0+120ms) 70ms               │
│  ├─ DB Query (T0+125ms) ──────────────── (T0+450ms) 325ms ← SLOW│
│  ├─ AI Call (T0+455ms) ────────────────────────── (T0+1200ms)    │
│  └─ Response (T0+1210ms) ─── Total: 1210ms                      │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. Structured Logging Design

### 4.1 Why Structured Logging

Unstructured: `Error: Failed to create message for user john in chat abc123`
Structured: `{"level":"error","message":"Failed to create message","userId":"john","chatId":"abc123","error":"UNIQUE_VIOLATION","timestamp":"2026-03-09T14:05:01Z"}`

Structured logs are:
- **Searchable:** `jq 'select(.level == "error" and .userId == "john")'`
- **Aggregatable:** Count errors by type, user, endpoint
- **Parseable:** Machines can read them. Dashboards can display them.
- **Correlatable:** Fields like requestId, userId link events together

### 4.2 Structured Logging Implementation

```typescript
// lib/logger.ts — Stone AI structured logger
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogContext {
  requestId?: string;
  userId?: string;
  action?: string;
  duration?: number;
  error?: string;
  [key: string]: unknown;
}

function log(level: LogLevel, message: string, context: LogContext = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: 'stone-ai',
    environment: process.env.NODE_ENV || 'development',
    ...context,
  };

  // In production: JSON for machine parsing
  // In development: human-readable
  if (process.env.NODE_ENV === 'production') {
    console.log(JSON.stringify(entry));
  } else {
    const color = {
      debug: '\x1b[36m',  // cyan
      info: '\x1b[32m',   // green
      warn: '\x1b[33m',   // yellow
      error: '\x1b[31m',  // red
      fatal: '\x1b[35m',  // magenta
    }[level];
    console.log(`${color}[${level.toUpperCase()}]\x1b[0m ${message}`, context);
  }
}

export const logger = {
  debug: (msg: string, ctx?: LogContext) => log('debug', msg, ctx),
  info: (msg: string, ctx?: LogContext) => log('info', msg, ctx),
  warn: (msg: string, ctx?: LogContext) => log('warn', msg, ctx),
  error: (msg: string, ctx?: LogContext) => log('error', msg, ctx),
  fatal: (msg: string, ctx?: LogContext) => log('fatal', msg, ctx),
};

// Usage:
// logger.info('Chat message created', { requestId, userId, chatId, duration: 45 });
// logger.error('Failed to create message', { requestId, userId, chatId, error: err.message });
```

### 4.3 Log Levels — When to Use Each

| Level | When | Example | Deployed? |
|-------|------|---------|-----------|
| `debug` | Detailed diagnostic info, variable values | "Prisma query params: {where: {id: 'x'}}" | Dev only |
| `info` | Normal operations, milestones | "User logged in", "Chat created" | Yes |
| `warn` | Unexpected but handled, degraded | "Rate limit approaching", "Retry attempt 2/3" | Yes |
| `error` | Operation failed, needs attention | "Payment failed", "DB query timeout" | Yes + alert |
| `fatal` | System cannot continue | "Database unreachable", "Out of memory" | Yes + page |

### 4.4 Essential Context Fields

Every log entry should include (when available):

```json
{
  "timestamp": "2026-03-09T14:05:01.234Z",
  "level": "error",
  "message": "Human-readable description",
  "service": "stone-ai",
  "environment": "production",
  "requestId": "req_abc123",
  "userId": "user_xxx",
  "action": "createMessage",
  "path": "/api/chat",
  "method": "POST",
  "statusCode": 500,
  "duration": 1234,
  "error": "UNIQUE_VIOLATION",
  "stack": "Error: ...\n    at ...",
  "metadata": {}
}
```

---

## 5. Log Aggregation Strategies

### 5.1 Vercel Logs (Stone AI Production)

```bash
# Vercel CLI log streaming
npx vercel logs stone-ai --follow

# Filter by function
npx vercel logs stone-ai --follow --output raw | grep "api/chat"

# Vercel dashboard:
# Project → Deployments → [deployment] → Functions tab → click function → logs
# Or: Project → Logs tab (real-time log viewer)

# Vercel log limitations:
# - Retained for 1 hour (Hobby), 3 days (Pro), 14 days (Enterprise)
# - No search across deployments
# - No aggregation or alerting
# - Structured logs (JSON) display better than console.log strings
```

### 5.2 ELK Stack (Elasticsearch, Logstash, Kibana)

```
Architecture:
App → Logstash (ingest/transform) → Elasticsearch (store/index) → Kibana (visualize)

When to use: Large-scale, multiple services, need search + dashboards + alerts
Cost: Self-hosted (heavy infra) or Elastic Cloud ($$)
Stone AI relevance: Post-launch if log volume warrants it
```

**Key Kibana queries:**
```
# Find errors in last hour
level: "error" AND @timestamp > now-1h

# Find all events for a user
userId: "user_xxx"

# Find slow requests
duration > 1000 AND path: "/api/*"

# Error rate by endpoint
level: "error" | stats count() by path
```

### 5.3 Grafana Loki (Lightweight Alternative)

```
Architecture:
App → Promtail (agent) → Loki (store) → Grafana (visualize)

Advantages over ELK:
- Much lower resource usage (doesn't index log content)
- Labels-based querying (like Prometheus for logs)
- Native Grafana integration

LogQL examples:
{service="stone-ai"} |= "error"
{service="stone-ai"} | json | level="error" | duration > 1000
rate({service="stone-ai"} |= "error" [5m])
```

### 5.4 Simple File-Based Aggregation (Dev/Small Scale)

```bash
# Combine and sort multiple log files by timestamp
sort -t'T' -k1,2 api.log prisma.log auth.log > combined.log

# Tail multiple logs simultaneously
tail -f api.log prisma.log auth.log

# Rotate logs to prevent disk fill
# logrotate config (/etc/logrotate.d/stoneai):
# /var/log/stoneai/*.log {
#     daily
#     rotate 7
#     compress
#     delaycompress
#     missingok
#     notifempty
# }
```

---

## 6. Alert Threshold Tuning

### 6.1 Error Rate Alerting

```
Metric: Errors per minute (EPM)

Baseline: Measure normal EPM over 7 days
  Mon: avg 2 EPM, max 8 EPM
  Tue: avg 3 EPM, max 12 EPM
  Wed: avg 2 EPM, max 6 EPM
  ...
  Normal range: 0-15 EPM

Alert thresholds:
  WARNING: > 15 EPM sustained for 5 minutes (above normal max)
  CRITICAL: > 50 EPM sustained for 2 minutes (major incident)
  RESOLVED: < 10 EPM for 10 minutes

Anti-flap: Require sustained threshold breach.
  BAD:  Alert if ANY minute > 15 EPM → alerts constantly
  GOOD: Alert if 5 consecutive minutes > 15 EPM → real issues only
```

### 6.2 Latency Percentile Alerting

```
WHY percentiles, not averages:
  Average response time: 200ms  ← looks fine
  p50: 150ms                   ← half of requests are fast
  p95: 800ms                   ← 5% of users wait 800ms
  p99: 3500ms                  ← 1% of users wait 3.5 seconds!

  Average hides the tail. Percentiles reveal it.

Recommended thresholds for Stone AI:
  p50 > 300ms for 10 min → WARN (general slowness)
  p95 > 1000ms for 5 min → WARN (tail latency issue)
  p99 > 3000ms for 5 min → CRITICAL (severe for some users)
  p50 > 1000ms for 5 min → CRITICAL (everything is slow)
```

### 6.3 Resource-Based Alerts

```
Memory:
  > 80% used → WARN (start investigating)
  > 90% used → CRITICAL (likely OOM soon)
  Growing >5% per hour sustained → WARN (possible leak)

CPU:
  > 80% sustained 5 min → WARN
  > 95% sustained 2 min → CRITICAL

Disk:
  < 20% free → WARN
  < 10% free → CRITICAL
  < 5% free → EMERGENCY (things will break)

Database Connections:
  > 80% pool used → WARN
  > 95% pool used → CRITICAL (connection exhaustion imminent)
```

---

## 7. False Positive Reduction

### 7.1 Common False Positive Sources

| Alert | Why It's False | Fix |
|-------|---------------|-----|
| Error rate spike at 3am | Cron job / batch process normally errors on some items | Exclude known batch errors from alert metric |
| High latency during deploy | Vercel cold starts during deployment | Suppress alerts for 5 min after deploy |
| Memory spike after restart | Normal: loading caches, JIT compilation | Ignore first 5 minutes after restart |
| 500 errors on health checks | Health check hitting uninitialized service | Exclude health check path from error rate |
| CPU spike on build | Next.js build is CPU-intensive | Separate build metrics from runtime |

### 7.2 Alert Quality Framework

```
For EVERY alert, track:
  - Total alerts fired this week
  - How many were actionable (required human intervention)
  - How many were false positives (no real issue)
  - How many were duplicate (same root cause, multiple alerts)

Target: >80% actionable rate
  If below 80%: tighten thresholds, add context, merge duplicates

Alert fatigue kills: When teams get >10 false positives/day,
they start ignoring ALL alerts. Then a real incident gets missed.

The Wiz Rule: Every false positive alert must result in either:
  1. Threshold adjustment
  2. Alert condition refinement
  3. Alert removal (if not useful)
  Never leave a noisy alert in place.
```

### 7.3 Alert Deduplication

```
PROBLEM: Database connection pool alert fires 50 times in 2 minutes
  (every failed request triggers its own alert)

SOLUTION: Deduplication window
  - First alert fires immediately
  - Suppress identical alerts for N minutes
  - After window: send summary "Alert fired 50 times in last 5 minutes"

Implementation: Group alerts by (alert_name, service, error_type)
  Only fire once per group per dedup window
```

---

## 8. grep/jq Patterns for Log Analysis

### 8.1 grep Patterns

```bash
# Find all errors with context (3 lines before and after)
grep -B3 -A3 -i "error" app.log

# Find errors but exclude known noisy ones
grep -i "error" app.log | grep -v "favicon" | grep -v "robots.txt" | grep -v "health"

# Find requests slower than 1000ms
grep -P '"duration":\s*\d{4,}' app.log

# Find all 5xx responses
grep -P 'status[": ]*5\d\d' app.log

# Find all requests from a specific user
grep "user_xxx" app.log

# Count errors by type
grep -oP '"error":\s*"[^"]*"' app.log | sort | uniq -c | sort -rn

# Find lines between two timestamps
sed -n '/2026-03-09T14:00/,/2026-03-09T14:10/p' app.log

# Find repeated patterns (potential loops or retry storms)
grep -oP '"message":\s*"[^"]*"' app.log | sort | uniq -c | sort -rn | head -20

# Extract all unique error messages
grep -oP '(?<=Error: ).*' app.log | sort -u

# Find stack traces (lines starting with whitespace after "Error")
grep -A20 "Error:" app.log | grep -E "^\s+at "
```

### 8.2 jq Patterns (for JSON logs)

```bash
# Pretty print JSON log
cat app.log | jq '.'

# Filter by log level
cat app.log | jq 'select(.level == "error")'

# Filter by multiple conditions
cat app.log | jq 'select(.level == "error" and .path == "/api/chat")'

# Extract specific fields
cat app.log | jq '{timestamp, level, message, duration}'

# Find slow requests (duration > 1000ms)
cat app.log | jq 'select(.duration > 1000) | {timestamp, path, duration}'

# Count by error type
cat app.log | jq -r 'select(.level == "error") | .error // .message' | sort | uniq -c | sort -rn

# Average duration by endpoint
cat app.log | jq -r 'select(.duration != null) | "\(.path)\t\(.duration)"' | awk -F'\t' '{sum[$1]+=$2; count[$1]++} END {for (path in sum) printf "%s\t%.0f ms (n=%d)\n", path, sum[path]/count[path], count[path]}' | sort -t$'\t' -k2 -rn

# Timeline: errors per minute
cat app.log | jq -r 'select(.level == "error") | .timestamp[:16]' | sort | uniq -c

# Find request chains by requestId
REQUEST_ID="abc123"
cat app.log | jq "select(.requestId == \"$REQUEST_ID\")" | jq -s 'sort_by(.timestamp)'

# Extract unique user IDs who experienced errors
cat app.log | jq -r 'select(.level == "error") | .userId // empty' | sort -u

# Top 10 slowest requests
cat app.log | jq -s '[.[] | select(.duration != null)] | sort_by(-.duration) | .[0:10] | .[] | {path, duration, timestamp}'

# Error rate per 5-minute window
cat app.log | jq -r 'select(.level == "error") | .timestamp[:15] + "0"' | sort | uniq -c

# Find first and last occurrence of an error
cat app.log | jq -s '[.[] | select(.message == "Connection pool timeout")] | {first: .[0].timestamp, last: .[-1].timestamp, count: length}'
```

### 8.3 Combined Patterns

```bash
# Full incident investigation pipeline
# Step 1: Find the error
grep -m1 "Connection pool timeout" app.log
# Output: 2026-03-09T14:05:01.234Z {"level":"error","message":"Connection pool timeout"...}

# Step 2: Get the time window
START="2026-03-09T14:04"
END="2026-03-09T14:06"

# Step 3: Extract all events in that window
cat app.log | jq "select(.timestamp >= \"${START}\" and .timestamp <= \"${END}\")" | jq -s 'sort_by(.timestamp)'

# Step 4: Count by level
cat app.log | jq "select(.timestamp >= \"${START}\" and .timestamp <= \"${END}\")" | jq -r '.level' | sort | uniq -c

# Step 5: Find affected users
cat app.log | jq "select(.timestamp >= \"${START}\" and .timestamp <= \"${END}\" and .level == \"error\")" | jq -r '.userId // empty' | sort -u | wc -l

# Step 6: Timeline of events
cat app.log | jq -r "select(.timestamp >= \"${START}\" and .timestamp <= \"${END}\") | \"\(.timestamp) [\(.level)] \(.message)\""
```

---

## 9. Vercel-Specific Log Analysis

### 9.1 Vercel Function Logs

```bash
# Stream logs via CLI
npx vercel logs --follow

# Filter by status code
npx vercel logs --follow | grep -P '"statusCode":\s*5\d\d'

# Vercel log format (JSON):
# {
#   "id": "xxx",
#   "message": "...",
#   "timestamp": 1234567890,
#   "source": "lambda",
#   "projectId": "xxx",
#   "deploymentId": "xxx",
#   "statusCode": 200,
#   "path": "/api/chat",
#   "method": "POST",
#   "region": "iad1"
# }
```

### 9.2 Common Vercel Log Patterns

```
Pattern: "FUNCTION_INVOCATION_TIMEOUT"
  Cause: Function exceeded 10s (Hobby) or 60s (Pro) limit
  Fix: Optimize the slow operation, add timeout handling

Pattern: "EDGE_FUNCTION_INVOCATION_FAILED"
  Cause: Edge middleware error (middleware.ts)
  Fix: Check middleware.ts for unhandled errors

Pattern: "FUNCTION_PAYLOAD_TOO_LARGE"
  Cause: Request or response > 4.5MB
  Fix: Paginate, stream, or compress

Pattern: "COLD_START" followed by slow response
  Cause: New serverless instance spinning up
  Fix: Reduce bundle size, warm critical paths

Pattern: Repeated "ECONNRESET" to Neon
  Cause: Neon connection limit or cold compute
  Fix: Enable connection pooling, use PgBouncer URL
```

---

## 10. Log Investigation Playbook

### 10.1 The 5-Minute Log Investigation

```
MINUTE 1: Establish the symptom
  - What's the user/system reporting?
  - When did it start?
  - Is it ongoing or resolved?

MINUTE 2: Find the error
  - grep for the error message in application logs
  - Check the timestamp of first occurrence
  - Note the request ID if available

MINUTE 3: Establish timeline
  - What happened in the 60 seconds BEFORE the first error?
  - Any deployments? (Vercel deployment logs)
  - Any infrastructure changes? (DB, DNS, cert)
  - Any traffic spikes? (request volume)

MINUTE 4: Measure blast radius
  - How many users affected? (unique userId count)
  - Which endpoints affected? (path distribution)
  - What's the error rate? (errors/total requests)

MINUTE 5: Root cause hypothesis
  - Correlate across services (DB + API + Auth logs)
  - Find the FIRST error in the chain (not the symptoms)
  - Propose fix or escalation path
```

### 10.2 Post-Incident Log Review

```
After every incident, generate:

1. TIMELINE
   - First error: [timestamp]
   - Detection: [timestamp] (how long until noticed?)
   - Mitigation: [timestamp] (how long to fix?)
   - Resolution: [timestamp]

2. LOG EVIDENCE
   - Key log entries that identified the problem
   - Log entries that were misleading (false trails)
   - Log entries that were MISSING (need to add)

3. LOG IMPROVEMENTS
   - What additional logging would have helped?
   - What log level should be adjusted?
   - What alerts should be added/modified?
   - What correlation IDs are missing?

4. PATTERN LIBRARY UPDATE
   - Add the error signature to error-signature-database.md
   - Add the investigation path to this seed's playbook
   - Update alert thresholds if needed
```

---

## 11. Log Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | Better Approach |
|-------------|-------------|----------------|
| `console.log(data)` | No context, no level, not searchable | `logger.info('User created', { userId, action })` |
| Logging passwords/tokens | Security breach | Sanitize sensitive fields |
| `catch(e) { /* silent */ }` | Error hidden, never debugged | `catch(e) { logger.error('...', { error: e.message }) }` |
| Logging entire request body | PII exposure, log volume | Log only relevant fields |
| Different format per service | Can't correlate | Shared logger/format |
| No request ID | Can't trace across services | Inject requestId in middleware |
| Logging in hot loops | Log volume explosion, I/O bottleneck | Log summary after loop |
| Only logging errors | No context for when errors DO occur | Info logs for normal flow too |
| Timestamps without timezone | Ambiguous correlation | Always use ISO 8601 with Z or offset |

---

*This seed turns logs from noise into signal. Every incident leaves a trail — Wiz knows how to follow it.*
