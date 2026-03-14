# API Monitoring & Observability for Stone AI Tools

## Seed Classification
- **Domain**: Backend Engineering / DevOps
- **Platform**: Stone AI Tools (tools.stone-ai.net)
- **Complexity**: Advanced
- **Prerequisites**: Distributed systems, metrics, logging, tracing
- **Last Updated**: 2026-03-09

---

## 1. Observability Strategy

### Three Pillars

```
Observability Pillars:

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Metrics   │     │   Logging   │     │   Tracing   │
│             │     │             │     │             │
│ What is     │     │ What        │     │ How does a  │
│ happening?  │     │ happened?   │     │ request     │
│             │     │             │     │ flow?       │
│ Counters    │     │ Structured  │     │ Distributed │
│ Histograms  │     │ JSON logs   │     │ trace spans │
│ Gauges      │     │ Log levels  │     │ Trace IDs   │
│             │     │             │     │             │
│ Prometheus  │     │ Loki/ELK    │     │ Tempo/Jaeger│
│ + Grafana   │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## 2. Request Tracing

### 2.1 Distributed Trace Context

```typescript
// File: src/gateway/tracing/trace-context.ts

import { trace, context, SpanKind, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('stone-ai-gateway', '1.0.0');

async function traceRequest(req: GatewayRequest, handler: () => Promise<void>): Promise<void> {
  const span = tracer.startSpan('gateway.request', {
    kind: SpanKind.SERVER,
    attributes: {
      'http.method': req.raw.method,
      'http.url': req.raw.url,
      'http.route': req.routeMatch?.route.pattern ?? 'unknown',
      'tenant.id': req.tenantId ?? 'unknown',
      'api.version': req.metadata.apiVersion as string ?? 'unknown',
      'gateway.request_id': req.metadata.requestId as string,
    },
  });

  try {
    await context.with(trace.setSpan(context.active(), span), handler);

    span.setAttributes({
      'http.status_code': (req.metadata.responseStatusCode as number) ?? 0,
      'gateway.cache_status': (req.metadata.cacheStatus as string) ?? 'BYPASS',
    });

    if ((req.metadata.responseStatusCode as number) >= 400) {
      span.setStatus({ code: SpanStatusCode.ERROR });
    }
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    span.recordException(error as Error);
    throw error;
  } finally {
    span.end();
  }
}

// Child spans for pipeline stages
async function traceStage(stageName: string, fn: () => Promise<any>): Promise<any> {
  const span = tracer.startSpan(`gateway.stage.${stageName}`, {
    kind: SpanKind.INTERNAL,
  });

  try {
    const result = await context.with(trace.setSpan(context.active(), span), fn);
    return result;
  } catch (error) {
    span.setStatus({ code: SpanStatusCode.ERROR });
    span.recordException(error as Error);
    throw error;
  } finally {
    span.end();
  }
}

// Upstream proxy tracing
async function traceUpstream(service: string, fn: () => Promise<any>): Promise<any> {
  const span = tracer.startSpan(`upstream.${service}`, {
    kind: SpanKind.CLIENT,
    attributes: {
      'upstream.service': service,
    },
  });

  try {
    const result = await context.with(trace.setSpan(context.active(), span), fn);
    span.setAttributes({
      'upstream.status_code': result.statusCode,
      'upstream.response_time_ms': result.responseTime,
    });
    return result;
  } catch (error) {
    span.setStatus({ code: SpanStatusCode.ERROR });
    throw error;
  } finally {
    span.end();
  }
}
```

### 2.2 Trace Visualization

```
Example trace for POST /v1/agents/security-scanner/invoke:

gateway.request (total: 2,345ms)
├── gateway.stage.request-id (0.1ms)
├── gateway.stage.authentication (3ms)
│   └── redis.get tenant:apikey:hash (1ms)
├── gateway.stage.tenant-resolve (2ms)
├── gateway.stage.rate-limit (1ms)
│   └── redis.evalsha token_bucket (0.5ms)
├── gateway.stage.route-match (0.2ms)
├── gateway.stage.request-validate (1ms)
├── gateway.stage.metering (0.5ms)
│   └── redis.pipeline usage_counters (0.3ms)
├── upstream.agent-executor (2,330ms) ★ bottleneck
│   ├── agent.load-model (50ms)
│   ├── agent.inference (2,250ms) ★ AI processing
│   └── agent.format-response (30ms)
├── gateway.stage.response-transform (0.5ms)
└── gateway.stage.cache-set (1ms)
```

---

## 3. Latency Percentiles

### 3.1 Latency Tracking

```typescript
// File: src/gateway/metrics/latency-tracker.ts

// Record latency at multiple granularities
function recordLatency(req: GatewayRequest, responseTimeMs: number): void {
  const labels = {
    method: req.raw.method,
    route: req.routeMatch?.route.id ?? 'unknown',
    status: String(Math.floor((req.metadata.responseStatusCode as number) / 100) * 100),
    version: req.metadata.apiVersion as string ?? 'unknown',
    tenant_plan: req.metadata.tenantPlan as string ?? 'unknown',
  };

  // Overall request duration
  metrics.histogram('gateway.request.duration_ms', labels, responseTimeMs);

  // Per-stage durations (from request metadata)
  const stageDurations = req.metadata.stageDurations as Record<string, number> ?? {};
  for (const [stage, duration] of Object.entries(stageDurations)) {
    metrics.histogram('gateway.stage.duration_ms', { stage, ...labels }, duration);
  }

  // Upstream duration (agent processing time)
  if (req.metadata.upstreamDuration) {
    metrics.histogram('gateway.upstream.duration_ms', {
      service: req.routeMatch?.route.upstream.service ?? 'unknown',
    }, req.metadata.upstreamDuration as number);
  }
}
```

### 3.2 SLO Definitions

```yaml
# SLO Configuration

slos:
  - name: API Availability
    description: Percentage of non-5xx responses
    target: 99.9%
    window: 30d
    indicator:
      good: http_status < 500
      total: all_requests
    alerting:
      burn_rate_1h: 14.4   # 1-hour burn rate before alert
      burn_rate_6h: 6.0    # 6-hour burn rate

  - name: API Latency (p95)
    description: 95th percentile response time
    target:
      list_agents: 500ms
      invoke_agent: 5000ms
      get_usage: 1000ms
    window: 30d

  - name: API Latency (p99)
    description: 99th percentile response time
    target:
      list_agents: 2000ms
      invoke_agent: 15000ms
      get_usage: 3000ms
    window: 30d

  - name: Webhook Delivery
    description: Percentage of webhooks delivered within 30 seconds
    target: 99.5%
    window: 30d
```

---

## 4. Error Rate Tracking

### 4.1 Error Classification

```typescript
// File: src/gateway/metrics/error-tracker.ts

type ErrorCategory =
  | 'auth_failure'        // 401/403
  | 'validation'          // 422
  | 'rate_limited'        // 429
  | 'not_found'           // 404
  | 'client_error'        // Other 4xx
  | 'upstream_error'      // 502/503/504
  | 'gateway_error'       // 500
  | 'timeout';            // Request timeout

function categorizeError(statusCode: number, error?: Error): ErrorCategory {
  if (error instanceof CircuitOpenError) return 'upstream_error';
  if (statusCode === 401 || statusCode === 403) return 'auth_failure';
  if (statusCode === 404) return 'not_found';
  if (statusCode === 422) return 'validation';
  if (statusCode === 429) return 'rate_limited';
  if (statusCode === 502 || statusCode === 503 || statusCode === 504) return 'upstream_error';
  if (statusCode === 500) return 'gateway_error';
  if (statusCode >= 400 && statusCode < 500) return 'client_error';
  return 'gateway_error';
}

function recordError(req: GatewayRequest, statusCode: number, error?: Error): void {
  const category = categorizeError(statusCode, error);

  metrics.counter('gateway.errors', {
    category,
    status: statusCode.toString(),
    route: req.routeMatch?.route.id ?? 'unknown',
    tenant: req.tenantId ?? 'unknown',
  });

  // Error rate (for SLO calculation)
  metrics.counter('gateway.requests.total', {
    route: req.routeMatch?.route.id ?? 'unknown',
  });

  if (statusCode >= 500) {
    metrics.counter('gateway.requests.error', {
      route: req.routeMatch?.route.id ?? 'unknown',
    });
  }
}
```

---

## 5. SLO/SLA Dashboards

### 5.1 Grafana Dashboard Configuration

```json
{
  "dashboard": {
    "title": "Stone AI Tools - API SLOs",
    "panels": [
      {
        "title": "Availability SLO (target: 99.9%)",
        "type": "gauge",
        "targets": [{
          "expr": "1 - (sum(rate(gateway_requests_error_total[30d])) / sum(rate(gateway_requests_total[30d])))",
          "legendFormat": "Availability"
        }],
        "thresholds": {
          "steps": [
            { "value": 0.999, "color": "green" },
            { "value": 0.995, "color": "yellow" },
            { "value": 0, "color": "red" }
          ]
        }
      },
      {
        "title": "Error Budget Remaining",
        "type": "stat",
        "targets": [{
          "expr": "1 - ((sum(rate(gateway_requests_error_total[30d])) / sum(rate(gateway_requests_total[30d]))) / 0.001)",
          "legendFormat": "Budget Remaining"
        }]
      },
      {
        "title": "Latency Percentiles (Agent Invocation)",
        "type": "timeseries",
        "targets": [
          {
            "expr": "histogram_quantile(0.50, rate(gateway_request_duration_ms_bucket{route='invoke-agent'}[5m]))",
            "legendFormat": "p50"
          },
          {
            "expr": "histogram_quantile(0.95, rate(gateway_request_duration_ms_bucket{route='invoke-agent'}[5m]))",
            "legendFormat": "p95"
          },
          {
            "expr": "histogram_quantile(0.99, rate(gateway_request_duration_ms_bucket{route='invoke-agent'}[5m]))",
            "legendFormat": "p99"
          }
        ]
      },
      {
        "title": "Error Rate by Category",
        "type": "timeseries",
        "targets": [{
          "expr": "sum(rate(gateway_errors_total[5m])) by (category)",
          "legendFormat": "{{category}}"
        }]
      },
      {
        "title": "Requests per Second by Route",
        "type": "timeseries",
        "targets": [{
          "expr": "sum(rate(gateway_request_duration_ms_count[1m])) by (route)",
          "legendFormat": "{{route}}"
        }]
      },
      {
        "title": "Circuit Breaker Status",
        "type": "table",
        "targets": [{
          "expr": "gateway_circuit_breaker_state",
          "legendFormat": "{{service}}"
        }]
      }
    ]
  }
}
```

---

## 6. Alerting Rules

### 6.1 Critical Alerts

```yaml
# File: monitoring/alerts.yml

groups:
  - name: stone-ai-tools-critical
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: |
          sum(rate(gateway_requests_error_total[5m])) /
          sum(rate(gateway_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "API error rate above 5%"
          description: "Error rate is {{ $value | humanizePercentage }} over the last 5 minutes"

      # SLO burn rate (fast burn)
      - alert: SLOBurnRateHigh
        expr: |
          sum(rate(gateway_requests_error_total[1h])) /
          sum(rate(gateway_requests_total[1h])) > (1 - 0.999) * 14.4
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "SLO burn rate critical - will exhaust error budget in < 2 hours"

      # High latency
      - alert: HighLatencyP95
        expr: |
          histogram_quantile(0.95, rate(gateway_request_duration_ms_bucket{route="invoke-agent"}[5m])) > 10000
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Agent invocation p95 latency above 10 seconds"

      # Circuit breaker open
      - alert: CircuitBreakerOpen
        expr: gateway_circuit_breaker_state == 2
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Circuit breaker OPEN for {{ $labels.service }}"

      # Rate limiter at capacity
      - alert: RateLimiterSaturated
        expr: |
          sum(rate(gateway_rate_limit_exceeded_total[5m])) /
          sum(rate(gateway_rate_limit_checked_total[5m])) > 0.3
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "30%+ of requests are being rate limited"

      # Webhook delivery failures
      - alert: WebhookDeliveryFailures
        expr: |
          sum(rate(webhook_delivery_exhausted_total[1h])) > 10
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "High webhook delivery failure rate"

      # Database connection pool exhaustion
      - alert: DBConnectionPoolExhausted
        expr: prisma_pool_active_connections / prisma_pool_max_connections > 0.9
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Database connection pool at 90%+ capacity"
```

---

## 7. Structured Logging

### 7.1 Log Format

```typescript
// File: src/lib/logging/logger.ts

import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  serializers: {
    err: pino.stdSerializers.err,
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
      },
    }),
  },
  // Redact sensitive fields
  redact: {
    paths: [
      'req.headers.authorization',
      'apiKey',
      'password',
      'secret',
      '*.apiKey',
      '*.password',
      '*.secret',
    ],
    censor: '[REDACTED]',
  },
});

// Standard log entry for every request
interface RequestLog {
  requestId: string;
  tenantId: string;
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  route: string;
  version: string;
  userAgent: string;
  ip: string;
  cacheStatus: string;
  rateLimitRemaining: number;
  upstream: {
    service: string;
    duration: number;
    retries: number;
  };
  error?: {
    code: string;
    message: string;
  };
}
```

### 7.2 Log Levels

```
Log Level Usage:

ERROR:  Unexpected failures requiring investigation
        - Database connection failures
        - Unhandled exceptions
        - Data corruption detected

WARN:   Expected failures or degraded conditions
        - Circuit breaker state changes
        - Rate limit exceeded
        - Retry attempts
        - Slow queries (>1s)

INFO:   Normal operations (1 per request)
        - Request completed (with summary)
        - Service started/stopped
        - Configuration changes

DEBUG:  Detailed operational data (dev/staging only)
        - Individual pipeline stage timing
        - Cache hits/misses
        - Query details
```

---

## 8. Health Monitoring

### 8.1 Synthetic Monitoring

```typescript
// File: src/monitoring/synthetic-checks.ts

/**
 * Synthetic checks that run every minute from multiple regions.
 * Simulates real developer requests to detect issues proactively.
 */

const SYNTHETIC_CHECKS = [
  {
    name: 'list-agents',
    method: 'GET' as const,
    url: '/v1/agents',
    expectedStatus: 200,
    maxLatency: 500,
    validate: (body: any) => Array.isArray(body.data),
  },
  {
    name: 'invoke-agent',
    method: 'POST' as const,
    url: '/v1/agents/ping-agent/invoke', // Lightweight test agent
    body: { prompt: 'synthetic-check-ping' },
    expectedStatus: 200,
    maxLatency: 5000,
    validate: (body: any) => body.content !== undefined,
  },
  {
    name: 'auth-check',
    method: 'GET' as const,
    url: '/v1/agents',
    noAuth: true,
    expectedStatus: 401,
    maxLatency: 100,
  },
];

async function runSyntheticCheck(check: SyntheticCheck): Promise<CheckResult> {
  const start = Date.now();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Synthetic-Check': 'true',
  };

  if (!check.noAuth) {
    headers['Authorization'] = `Bearer ${SYNTHETIC_API_KEY}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${check.url}`, {
      method: check.method,
      headers,
      body: check.body ? JSON.stringify(check.body) : undefined,
      signal: AbortSignal.timeout(check.maxLatency * 2),
    });

    const latency = Date.now() - start;
    const body = await response.json().catch(() => null);

    const passed =
      response.status === check.expectedStatus &&
      latency <= check.maxLatency &&
      (!check.validate || check.validate(body));

    return {
      name: check.name,
      passed,
      statusCode: response.status,
      latency,
      region: CURRENT_REGION,
      timestamp: new Date().toISOString(),
      error: passed ? undefined : `Expected ${check.expectedStatus}, got ${response.status}. Latency: ${latency}ms`,
    };
  } catch (error) {
    return {
      name: check.name,
      passed: false,
      latency: Date.now() - start,
      region: CURRENT_REGION,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

---

## Summary

Stone AI Tools observability stack:

1. **Distributed Tracing**: OpenTelemetry traces through gateway → stages → upstream services
2. **Latency Percentiles**: p50/p95/p99 per route, per tenant plan, per API version
3. **Error Tracking**: Categorized errors (auth, validation, rate limit, upstream, gateway) with rates
4. **SLO/SLA Dashboards**: 99.9% availability target with error budget burn rate tracking
5. **Alerting**: Multi-tier alerts (critical, warning) for error rate, latency, circuit breakers, connection pools
6. **Structured Logging**: JSON logs with sensitive field redaction, request-level correlation
7. **Synthetic Monitoring**: Minute-by-minute probes from multiple regions simulating real developer usage
8. **Health Probes**: Liveness, readiness, and detailed health endpoints for orchestration
