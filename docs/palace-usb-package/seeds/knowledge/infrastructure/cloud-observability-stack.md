# Cloud Observability Stack
# Seed: INFRA-7 | Category: Cloud Architecture | Topic: Observability & Monitoring
# RAG Tags: prometheus, grafana, opentelemetry, jaeger, elk, loki, alerting, sli, slo, sla, incident-management

---

## Purpose
Complete observability stack: metrics (Prometheus), visualization (Grafana), tracing
(OpenTelemetry/Jaeger), logging (ELK/Loki), alerting strategies, SLI/SLO/SLA definitions,
and incident management integration. You cannot optimize what you cannot measure.

---

## 1. The Three Pillars of Observability

```
METRICS — Aggregated numerical measurements over time
  "How many requests per second? What's the P99 latency? CPU at 73%."
  Tools: Prometheus, CloudWatch, Datadog, Grafana Mimir

LOGS — Discrete events with context
  "User clerk_abc got error 500 at 14:23:07 on endpoint /api/chat."
  Tools: ELK Stack, Grafana Loki, CloudWatch Logs, Splunk

TRACES — Request flow across services
  "Request abc123 took 340ms: API (5ms) → Auth (20ms) → DB (280ms) → Cache (10ms) → Response (25ms)"
  Tools: Jaeger, Zipkin, OpenTelemetry, AWS X-Ray, Datadog APM

BONUS PILLAR — PROFILES (emerging)
  "Function processChat() consumed 40% of CPU for 200ms"
  Tools: Pyroscope, Parca, continuous profiling

The key insight: Each pillar answers different questions.
Metrics tell you SOMETHING is wrong.
Logs tell you WHAT went wrong.
Traces tell you WHERE it went wrong.
```

---

## 2. OpenTelemetry — The Universal Standard

### Why OpenTelemetry
```
OpenTelemetry (OTel) is the CNCF standard for telemetry:
  - Vendor-neutral: Same instrumentation works with any backend
  - All three pillars: Metrics, logs, and traces in one SDK
  - Auto-instrumentation: Automatic tracing for HTTP, DB, gRPC, etc.
  - Wide adoption: Every major observability vendor supports it
  - Future-proof: Change backends without changing application code

Architecture:
  App → OTel SDK → OTel Collector → Backend(s)
                                      ├── Prometheus (metrics)
                                      ├── Jaeger (traces)
                                      ├── Loki (logs)
                                      └── Any OTLP-compatible backend
```

### OpenTelemetry Setup (Node.js / TypeScript)
```typescript
// tracing.ts — Initialize BEFORE any other imports
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

const sdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: 'stone-ai-api',
    [ATTR_SERVICE_VERSION]: process.env.APP_VERSION || '1.0.0',
    'deployment.environment': process.env.NODE_ENV || 'development',
  }),

  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
  }),

  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/metrics',
    }),
    exportIntervalMillis: 15000,  // Export metrics every 15s
  }),

  instrumentations: [
    getNodeAutoInstrumentations({
      // Auto-instrument HTTP, Express, pg, redis, etc.
      '@opentelemetry/instrumentation-http': {
        ignoreIncomingPaths: ['/health', '/ready'],  // Don't trace health checks
      },
      '@opentelemetry/instrumentation-pg': {
        enhancedDatabaseReporting: true,  // Include SQL in spans
      },
    }),
  ],
});

sdk.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  sdk.shutdown().then(() => process.exit(0)).catch(() => process.exit(1));
});
```

### Custom Spans and Metrics
```typescript
import { trace, metrics, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('stone-ai-api');
const meter = metrics.getMeter('stone-ai-api');

// Custom metrics
const requestCounter = meter.createCounter('http.requests.total', {
  description: 'Total HTTP requests',
});

const requestDuration = meter.createHistogram('http.request.duration_ms', {
  description: 'HTTP request duration in milliseconds',
  unit: 'ms',
});

const activeAgentSessions = meter.createUpDownCounter('agent.sessions.active', {
  description: 'Currently active agent sessions',
});

// Custom span for business logic
async function processAgentChat(userId: string, agentId: number, message: string) {
  return tracer.startActiveSpan('agent.chat.process', async (span) => {
    try {
      span.setAttributes({
        'user.id': userId,
        'agent.id': agentId,
        'message.length': message.length,
      });

      // Child span for LLM call
      const response = await tracer.startActiveSpan('llm.generate', async (llmSpan) => {
        llmSpan.setAttributes({
          'llm.model': 'qwen-2.5-32b-awq',
          'llm.provider': 'vllm',
          'llm.input_tokens': estimateTokens(message),
        });

        const result = await callLLM(message);

        llmSpan.setAttributes({
          'llm.output_tokens': result.tokenCount,
          'llm.latency_ms': result.latencyMs,
        });
        llmSpan.end();
        return result;
      });

      // Record metrics
      requestCounter.add(1, { 'agent.id': String(agentId), 'status': 'success' });
      requestDuration.record(response.latencyMs, { 'agent.id': String(agentId) });

      span.setStatus({ code: SpanStatusCode.OK });
      return response;

    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: String(error) });
      span.recordException(error as Error);
      requestCounter.add(1, { 'agent.id': String(agentId), 'status': 'error' });
      throw error;
    } finally {
      span.end();
    }
  });
}
```

---

## 3. Prometheus — Metrics Collection

### Prometheus Architecture
```
Scrape targets (apps expose /metrics endpoint)
       ↓
  Prometheus Server (scrapes targets every 15-30s)
       ↓
  TSDB (time-series database, local storage)
       ↓
  PromQL queries ← Grafana dashboards
       ↓
  Alertmanager → PagerDuty, Slack, Email

For scale:
  Prometheus → Remote Write → Thanos/Mimir/Cortex (long-term storage, HA, multi-cluster)
```

### PromQL Essentials
```promql
# Request rate (per second, averaged over 5 minutes)
rate(http_requests_total{service="stone-ai-api"}[5m])

# Error rate percentage
sum(rate(http_requests_total{status=~"5.."}[5m]))
/ sum(rate(http_requests_total[5m])) * 100

# P95 latency (using histogram)
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{service="stone-ai-api"}[5m]))

# P99 latency
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket{service="stone-ai-api"}[5m]))

# Saturation — CPU usage per pod
avg by (pod) (rate(container_cpu_usage_seconds_total{namespace="production"}[5m]))
/ avg by (pod) (container_spec_cpu_quota{namespace="production"} / container_spec_cpu_period{namespace="production"}) * 100

# Active agent sessions
agent_sessions_active{environment="production"}

# LLM token throughput
sum(rate(llm_tokens_total{provider="vllm"}[5m]))

# Memory usage percentage
(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes)
/ node_memory_MemTotal_bytes * 100
```

### The USE Method (Infrastructure Metrics)
```
For every RESOURCE (CPU, memory, disk, network):
  U — Utilization: Percentage of time the resource is busy
  S — Saturation:  Amount of work the resource can't service (queue depth)
  E — Errors:      Count of error events

Example PromQL queries:
  CPU Utilization:    avg(rate(node_cpu_seconds_total{mode!="idle"}[5m]))
  CPU Saturation:     avg(node_load15) / count(node_cpu_seconds_total{mode="idle"})
  Disk Utilization:   (node_filesystem_size_bytes - node_filesystem_avail_bytes) / node_filesystem_size_bytes
  Disk Saturation:    rate(node_disk_io_time_weighted_seconds_total[5m])
  Network Errors:     rate(node_network_receive_errs_total[5m]) + rate(node_network_transmit_errs_total[5m])
```

### The RED Method (Service Metrics)
```
For every SERVICE (API, microservice, endpoint):
  R — Rate:      Requests per second
  E — Errors:    Failed requests per second
  D — Duration:  Distribution of request latencies

Example PromQL queries:
  Rate:     sum(rate(http_requests_total{service="stone-ai-api"}[5m]))
  Errors:   sum(rate(http_requests_total{service="stone-ai-api",status=~"5.."}[5m]))
  Duration: histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket{service="stone-ai-api"}[5m])) by (le))
```

---

## 4. Grafana Dashboards

### Dashboard Design Principles
```
1. TOP-LEVEL OVERVIEW
   Row 1: Key business metrics (active users, revenue, agent interactions)
   Row 2: RED metrics (request rate, error rate, P95 latency)
   Row 3: Infrastructure health (CPU, memory, disk, network)

2. SERVICE-LEVEL DASHBOARDS
   One dashboard per service (API, worker, database, cache)
   Include: rate, errors, duration, saturation, dependencies

3. ALERT-FOCUSED PANELS
   SLO burn rate gauge (green → yellow → red)
   Error budget remaining (percentage)
   Top 5 error types (table)

4. INVESTIGATION DASHBOARDS
   Detailed metrics for debugging
   Log panels inline with metrics
   Trace exemplar links (click metric point → see trace)
```

### Grafana Dashboard JSON Example
```json
{
  "title": "Stone AI — API Overview",
  "uid": "stone-ai-api",
  "panels": [
    {
      "title": "Request Rate",
      "type": "timeseries",
      "targets": [{
        "expr": "sum(rate(http_requests_total{service=\"stone-ai-api\"}[5m]))",
        "legendFormat": "requests/sec"
      }],
      "gridPos": { "h": 8, "w": 8, "x": 0, "y": 0 }
    },
    {
      "title": "Error Rate (%)",
      "type": "gauge",
      "targets": [{
        "expr": "sum(rate(http_requests_total{service=\"stone-ai-api\",status=~\"5..\"}[5m])) / sum(rate(http_requests_total{service=\"stone-ai-api\"}[5m])) * 100"
      }],
      "fieldConfig": {
        "defaults": {
          "thresholds": {
            "steps": [
              { "value": 0, "color": "green" },
              { "value": 1, "color": "yellow" },
              { "value": 5, "color": "red" }
            ]
          },
          "max": 100,
          "unit": "percent"
        }
      },
      "gridPos": { "h": 8, "w": 8, "x": 8, "y": 0 }
    },
    {
      "title": "P95 Latency",
      "type": "timeseries",
      "targets": [{
        "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{service=\"stone-ai-api\"}[5m])) by (le))",
        "legendFormat": "P95"
      }, {
        "expr": "histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket{service=\"stone-ai-api\"}[5m])) by (le))",
        "legendFormat": "P99"
      }],
      "gridPos": { "h": 8, "w": 8, "x": 16, "y": 0 }
    }
  ]
}
```

---

## 5. Distributed Tracing (Jaeger)

### Trace Anatomy
```
Trace ID: abc123 (one end-to-end request)
├── Span: API Gateway (5ms)
│   └── Span: Auth Middleware (20ms)
│       └── Span: Clerk Token Validation (15ms)
├── Span: Route Handler /api/chat (300ms)
│   ├── Span: Zod Validation (1ms)
│   ├── Span: Prisma Query - Get User (25ms)
│   │   └── Span: PostgreSQL SELECT (20ms)
│   ├── Span: Rate Limit Check (3ms)
│   │   └── Span: Redis GET (2ms)
│   ├── Span: LLM Generation (250ms)          ← BOTTLENECK
│   │   ├── Span: vLLM API Call (240ms)
│   │   └── Span: Response Parsing (10ms)
│   └── Span: Prisma Query - Save Chat (15ms)
│       └── Span: PostgreSQL INSERT (12ms)
└── Span: Response Serialization (3ms)

Total: 340ms, bottleneck clearly visible in LLM generation
```

### Jaeger Deployment
```yaml
# docker-compose for local Jaeger (all-in-one)
services:
  jaeger:
    image: jaegertracing/all-in-one:1.54
    ports:
      - "16686:16686"    # Jaeger UI
      - "4317:4317"      # OTLP gRPC
      - "4318:4318"      # OTLP HTTP
    environment:
      - COLLECTOR_OTLP_ENABLED=true
      - SPAN_STORAGE_TYPE=badger    # Local storage (use Elasticsearch for prod)
      - BADGER_EPHEMERAL=false
      - BADGER_DIRECTORY_VALUE=/badger/data
      - BADGER_DIRECTORY_KEY=/badger/key
    volumes:
      - jaeger-data:/badger

# Production: Use Jaeger with Elasticsearch or OpenSearch backend
# Or use Grafana Tempo (better integration with Grafana stack)
```

---

## 6. Log Aggregation

### ELK vs. Loki Decision
```
ELK (Elasticsearch + Logstash + Kibana):
  Pros: Full-text search, complex queries, mature ecosystem
  Cons: Resource-hungry (RAM), complex to operate, expensive at scale
  Use when: Need complex log analysis, compliance/audit requirements

Grafana Loki:
  Pros: 10x cheaper than ELK, native Grafana integration, label-based (like Prometheus)
  Cons: No full-text indexing (grep-like search), less flexible queries
  Use when: Already using Grafana, cost-sensitive, label-based filtering sufficient

RECOMMENDATION: Loki for most teams. ELK only if you need full-text search or existing investment.
```

### Structured Logging
```typescript
// ALWAYS use structured logging — never console.log("User " + id + " error")

import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level(label) { return { level: label }; },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'body.password', 'body.token'],
    censor: '[REDACTED]',
  },
});

// Usage
logger.info({
  event: 'agent.chat.completed',
  userId: 'clerk_abc',
  agentId: 1,
  latencyMs: 340,
  tokensUsed: 450,
  model: 'qwen-2.5-32b-awq',
}, 'Agent chat response generated');

logger.error({
  event: 'agent.chat.failed',
  userId: 'clerk_abc',
  agentId: 1,
  error: error.message,
  stack: error.stack,
  retryCount: 2,
}, 'Agent chat generation failed after retries');

// Output (JSON — machine-parseable):
// {"level":"info","time":"2026-03-10T12:00:00.000Z","event":"agent.chat.completed",
//  "userId":"clerk_abc","agentId":1,"latencyMs":340,"tokensUsed":450,
//  "model":"qwen-2.5-32b-awq","msg":"Agent chat response generated"}
```

---

## 7. SLI / SLO / SLA Definitions

### Terminology
```
SLI (Service Level Indicator):
  A MEASUREMENT of service behavior.
  Example: "The proportion of requests completed in < 500ms"
  Formula: good_events / total_events

SLO (Service Level Objective):
  A TARGET value for an SLI.
  Example: "99.9% of requests should complete in < 500ms"
  Internal commitment, drives engineering priorities.

SLA (Service Level Agreement):
  A CONTRACT with customers about service reliability.
  Example: "99.9% uptime, or customer gets credits"
  SLA ≤ SLO always. Set SLO stricter than SLA to have safety margin.

Error Budget:
  The acceptable amount of unreliability.
  If SLO = 99.9%, Error Budget = 0.1% = 43.2 minutes/month
  Use error budget for: deployments, experiments, maintenance
  Error budget exhausted → freeze deployments, fix reliability
```

### Stone AI SLO Examples
```yaml
# SLO definitions for Stone AI services
slos:
  - name: "API Availability"
    sli: "Proportion of non-5xx responses"
    target: 99.9%      # 43.2 min/month downtime budget
    window: 30 days
    alert_burn_rate: 14.4x  # Alert if burning budget 14.4x faster than sustainable

  - name: "API Latency"
    sli: "Proportion of requests < 500ms"
    target: 99.0%      # 1% of requests can exceed 500ms
    window: 30 days
    percentile: P95

  - name: "Agent Response Time"
    sli: "Proportion of agent responses < 5000ms"
    target: 95.0%      # LLM calls are inherently slower
    window: 30 days

  - name: "Chat Delivery"
    sli: "Proportion of messages successfully delivered"
    target: 99.99%     # Critical — messages must not be lost
    window: 30 days

# Error budget calculation:
#   API Availability: 99.9% → 0.1% budget → 43.2 min/month
#   30-day window: 43,200 seconds in budget
#   If 10,000 requests/day → 10 errors/day sustainable
#   If burning at 14.4x: will exhaust budget in ~2 days → ALERT
```

### Multi-Window Burn Rate Alerting
```yaml
# Prometheus alerting rules for SLO burn rate
groups:
  - name: slo_burn_rate
    rules:
      # Fast burn: 2% budget consumed in 1 hour → page immediately
      - alert: APIHighErrorBurnRate_1h
        expr: |
          (
            sum(rate(http_requests_total{service="stone-ai-api",status=~"5.."}[1h]))
            / sum(rate(http_requests_total{service="stone-ai-api"}[1h]))
          ) > (14.4 * 0.001)
        for: 2m
        labels:
          severity: critical
          slo: api_availability
        annotations:
          summary: "API error rate burning SLO budget at 14.4x rate"
          description: "At this rate, entire monthly error budget exhausted in ~2 days"

      # Slow burn: 5% budget consumed in 6 hours → ticket
      - alert: APIHighErrorBurnRate_6h
        expr: |
          (
            sum(rate(http_requests_total{service="stone-ai-api",status=~"5.."}[6h]))
            / sum(rate(http_requests_total{service="stone-ai-api"}[6h]))
          ) > (6 * 0.001)
        for: 5m
        labels:
          severity: warning
          slo: api_availability
        annotations:
          summary: "API error rate elevated — slow SLO budget burn"

      # Latency burn rate
      - alert: APIHighLatencyBurnRate
        expr: |
          (
            1 - (
              sum(rate(http_request_duration_seconds_bucket{service="stone-ai-api",le="0.5"}[1h]))
              / sum(rate(http_request_duration_seconds_count{service="stone-ai-api"}[1h]))
            )
          ) > (14.4 * 0.01)
        for: 2m
        labels:
          severity: critical
          slo: api_latency
```

---

## 8. Alerting Strategy

### Alert Hierarchy
```
Level 1 — PAGE (wake someone up):
  - Service completely down (0 successful requests)
  - SLO burn rate > 14.4x (exhausting budget in < 2 days)
  - Data loss detected
  - Security incident
  Route: PagerDuty → Phone call + SMS

Level 2 — URGENT (address within 1 hour):
  - SLO burn rate > 6x (exhausting budget in < 5 days)
  - Error rate > 5% sustained for 10 minutes
  - Response time P95 > 2x normal
  - Disk > 90%
  Route: Slack #alerts-urgent + PagerDuty (no phone)

Level 3 — WARNING (address within 1 business day):
  - SLO burn rate > 3x
  - Error rate > 1% sustained for 30 minutes
  - CPU > 80% sustained for 30 minutes
  - Memory > 85%
  - Certificate expiring within 7 days
  Route: Slack #alerts-warning

Level 4 — INFO (review weekly):
  - Cost anomaly detected
  - New dependency version available
  - Approaching quota limits
  - Performance degradation trends
  Route: Slack #alerts-info
```

### Alert Anti-Patterns
```
1. ALERTING ON CAUSES, NOT SYMPTOMS
   BAD:  Alert when CPU > 80%
   GOOD: Alert when request latency > SLO threshold
   Why:  High CPU that doesn't impact users isn't an incident

2. TOO MANY ALERTS (Alert Fatigue)
   BAD:  100 alerts/day → team ignores all alerts
   GOOD: < 5 pages/week, each actionable
   Rule: If alert fires and no human action needed → delete the alert

3. NO RUNBOOK
   BAD:  "Error rate high" (what do I do?)
   GOOD: "Error rate high — see runbook: wiki/runbook/api-errors"

4. MISSING CONTEXT
   BAD:  "Pod restart detected"
   GOOD: "Pod stone-ai-api-5d8f restarted 3x in 10min. Last log: OOMKilled. Memory limit: 512Mi, usage at kill: 510Mi. Dashboard: [link]"
```

---

## 9. Incident Management Integration

### Incident Response Flow
```
Alert fires (PagerDuty)
  → On-call acknowledges (5 min SLA)
  → Open incident channel (Slack #inc-YYYYMMDD-NNN)
  → Assess severity:
      SEV1: Total outage, data loss, security breach
      SEV2: Major degradation, >50% of users affected
      SEV3: Minor degradation, <10% of users affected
  → Communicate:
      Internal: Slack channel updates every 15 min
      External: Status page update (if customer-facing)
  → Mitigate (focus on RESTORING service, not root cause)
      Rollback? Scale up? Failover? Feature flag off?
  → Resolve
  → Post-incident review (within 48 hours)
      Timeline, root cause, action items, lessons learned
      Blameless — focus on systems, not people
```

### Status Page Integration
```typescript
// Automated status page updates from alerting
import { StatusPage } from './statuspage-client';

const statusPage = new StatusPage(process.env.STATUSPAGE_API_KEY!);

async function handleSev1Alert(alert: Alert) {
  // Create incident on status page
  await statusPage.createIncident({
    name: `Service Degradation — ${alert.service}`,
    status: 'investigating',
    impact_override: 'major',
    component_ids: [getComponentId(alert.service)],
    body: `We are investigating reports of degraded performance for ${alert.service}. We will provide updates as we learn more.`,
  });

  // Notify via Slack
  await slack.postMessage({
    channel: '#incidents',
    text: `*SEV1 INCIDENT DECLARED*\n*Service*: ${alert.service}\n*Impact*: ${alert.description}\n*Dashboard*: ${alert.dashboardUrl}\n*Runbook*: ${alert.runbookUrl}`,
  });

  // Notify founder via email (Three-Headed Monster protocol)
  await sendFounderAlert({
    alertType: 'incident.sev1',
    title: `SEV1: ${alert.service} — ${alert.description}`,
    body: `Severity 1 incident detected. On-call engaged. Status page updated.`,
  });
}
```

---

## 10. Observability Stack Recommendations

### Small Team (< 5 engineers)
```
Metrics:  CloudWatch / GCP Cloud Monitoring (managed, no ops overhead)
Logs:     CloudWatch Logs / Cloud Logging (managed)
Traces:   AWS X-Ray / Cloud Trace (managed)
Alerts:   CloudWatch Alarms → SNS → Email/Slack
Cost:     $50-200/month

Upgrade path: When you outgrow managed tools → migrate to Grafana Cloud
```

### Medium Team (5-20 engineers)
```
Metrics:  Grafana Cloud (free tier: 10K metrics)
Logs:     Grafana Loki (via Grafana Cloud)
Traces:   Grafana Tempo (via Grafana Cloud)
Dashboards: Grafana
Alerts:   Grafana Alerting → PagerDuty → Slack
Cost:     $200-1000/month

Why Grafana Cloud: Unified stack, no infrastructure to manage,
generous free tier, excellent community dashboards
```

### Large Team (20+ engineers)
```
Metrics:  Prometheus + Thanos/Mimir (self-hosted for scale + cost control)
Logs:     Elasticsearch + Kibana or Loki at scale
Traces:   Jaeger with Elasticsearch backend or Tempo
Dashboards: Grafana (self-hosted)
Alerts:   Alertmanager → PagerDuty → Slack → StatusPage
Cost:     $1000-5000/month (mostly infrastructure)

Why self-hosted: Cost control at scale (managed services get expensive above 100K series)
Tradeoff: Need dedicated SRE to manage the observability stack itself
```

---

*This seed is maintained by the SRE team. Last validated: 2026-03.*
