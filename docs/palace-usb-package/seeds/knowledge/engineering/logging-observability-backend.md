# Logging & Observability — Backend

## Palace Knowledge Seed — Advanced Backend Engineering

### Overview

Observability answers "what is happening in production right now?" through three pillars: logs, metrics, and traces. This seed covers structured logging with Pino, request tracing with correlation IDs, log levels, log aggregation patterns, and monitoring strategies for the Stone AI stack (Next.js 16, Vercel, PostgreSQL 16, Redis).

---

## 1. Structured Logging with Pino

### Setup

```typescript
// src/lib/logging/logger.ts
import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug'),
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label) {
      return { level: label };
    },
    bindings(bindings) {
      return {
        pid: bindings.pid,
        host: bindings.hostname,
        service: 'stone-ai',
        environment: process.env.NODE_ENV ?? 'development',
        version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
      };
    },
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'secret',
      'token',
      'apiKey',
      'creditCard',
      '*.password',
      '*.secret',
      '*.token',
    ],
    censor: '[REDACTED]',
  },
  // Pretty print in development
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
});

// Child loggers for different modules
export const dbLogger = logger.child({ module: 'database' });
export const authLogger = logger.child({ module: 'auth' });
export const aiLogger = logger.child({ module: 'ai' });
export const billingLogger = logger.child({ module: 'billing' });
export const cacheLogger = logger.child({ module: 'cache' });
```

### Log Levels Guide

```typescript
// Log level semantics for Stone AI:

// FATAL (60) — System is unusable. Founder alert REQUIRED.
logger.fatal({ err }, 'Database connection permanently lost');
logger.fatal({ err }, 'Encryption key missing — cannot decrypt data');

// ERROR (50) — Something failed that should have succeeded.
logger.error({ err, userId }, 'Stripe payment processing failed');
logger.error({ err, agentId }, 'AI provider returned invalid response');

// WARN (40) — Something unexpected but recoverable.
logger.warn({ userId, tier }, 'User exceeded daily token budget');
logger.warn({ provider: 'vllm' }, 'vLLM is slow — p99 > 5s');

// INFO (30) — Business events, state changes, milestones.
logger.info({ userId, tier }, 'User upgraded subscription');
logger.info({ agentId, tokens }, 'AI conversation completed');

// DEBUG (20) — Developer details for troubleshooting.
logger.debug({ query, params }, 'Database query executed');
logger.debug({ cacheKey, hit: true }, 'Cache hit');

// TRACE (10) — Very verbose, function-level tracing.
logger.trace({ fn: 'getAgent', args: { id: 5 } }, 'Function entry');
```

---

## 2. Correlation IDs and Request Tracing

```typescript
// src/lib/logging/context.ts
import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

interface RequestContext {
  correlationId: string;
  requestId: string;
  userId?: string;
  route?: string;
  method?: string;
  startTime: number;
  logger: pino.Logger;
}

const requestContextStorage = new AsyncLocalStorage<RequestContext>();

export function createRequestContext(
  req: Request,
  userId?: string
): RequestContext {
  const correlationId =
    req.headers.get('x-correlation-id') ?? randomUUID();
  const requestId = randomUUID();

  const url = new URL(req.url);

  const ctx: RequestContext = {
    correlationId,
    requestId,
    userId,
    route: url.pathname,
    method: req.method,
    startTime: Date.now(),
    logger: logger.child({
      correlationId,
      requestId,
      userId,
      route: url.pathname,
      method: req.method,
    }),
  };

  return ctx;
}

export function withRequestContext<T>(
  ctx: RequestContext,
  fn: () => Promise<T>
): Promise<T> {
  return requestContextStorage.run(ctx, fn);
}

export function getRequestContext(): RequestContext | undefined {
  return requestContextStorage.getStore();
}

export function getLogger(): pino.Logger {
  const ctx = getRequestContext();
  return ctx?.logger ?? logger;
}
```

### Middleware Integration

```typescript
// src/lib/logging/middleware.ts

export function withLogging(handler: RouteHandler): RouteHandler {
  return async (req: Request, context?: any): Promise<Response> => {
    const userId = auth()?.userId;
    const ctx = createRequestContext(req, userId ?? undefined);

    return withRequestContext(ctx, async () => {
      ctx.logger.info(
        {
          userAgent: req.headers.get('user-agent'),
          contentLength: req.headers.get('content-length'),
          ip: req.headers.get('x-forwarded-for')?.split(',')[0],
        },
        'Request started'
      );

      try {
        const response = await handler(req, context);
        const duration = Date.now() - ctx.startTime;

        ctx.logger.info(
          {
            statusCode: response.status,
            duration,
            contentLength: response.headers.get('content-length'),
          },
          'Request completed'
        );

        // Add tracing headers
        response.headers.set('X-Correlation-ID', ctx.correlationId);
        response.headers.set('X-Request-ID', ctx.requestId);

        // Warn on slow requests
        if (duration > 3000) {
          ctx.logger.warn(
            { duration, threshold: 3000 },
            'Slow request detected'
          );
        }

        return response;
      } catch (error: any) {
        const duration = Date.now() - ctx.startTime;

        ctx.logger.error(
          {
            err: error,
            duration,
            statusCode: error.statusCode ?? 500,
          },
          'Request failed'
        );

        throw error;
      }
    });
  };
}

// Combine with error handling
export function withObservability(handler: RouteHandler): RouteHandler {
  return withLogging(withErrorHandling(handler));
}
```

---

## 3. Database Query Logging

```typescript
// src/lib/logging/prisma-logging.ts

// Prisma event-based logging
export function setupPrismaLogging(prisma: PrismaClient): void {
  prisma.$on('query' as any, (e: any) => {
    const log = getLogger();

    if (e.duration > 1000) {
      log.warn(
        {
          query: e.query,
          params: e.params,
          duration: e.duration,
          target: e.target,
        },
        'Slow database query'
      );
    } else {
      log.debug(
        {
          query: e.query.slice(0, 200),
          duration: e.duration,
        },
        'Database query'
      );
    }
  });

  prisma.$on('error' as any, (e: any) => {
    dbLogger.error(
      {
        message: e.message,
        target: e.target,
      },
      'Database error'
    );
  });
}

// Query performance tracking
class QueryPerformanceTracker {
  private queries: { query: string; duration: number; timestamp: number }[] = [];
  private maxEntries = 1000;

  record(query: string, duration: number): void {
    this.queries.push({
      query: query.slice(0, 200),
      duration,
      timestamp: Date.now(),
    });

    if (this.queries.length > this.maxEntries) {
      this.queries = this.queries.slice(-this.maxEntries);
    }
  }

  getSlowQueries(thresholdMs: number = 500): typeof this.queries {
    return this.queries.filter((q) => q.duration > thresholdMs);
  }

  getStats() {
    if (this.queries.length === 0) return null;

    const durations = this.queries.map((q) => q.duration).sort((a, b) => a - b);
    return {
      count: durations.length,
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      p50: durations[Math.floor(durations.length * 0.5)],
      p95: durations[Math.floor(durations.length * 0.95)],
      p99: durations[Math.floor(durations.length * 0.99)],
      max: durations[durations.length - 1],
    };
  }
}

export const queryTracker = new QueryPerformanceTracker();
```

---

## 4. AI Provider Logging

```typescript
// src/lib/logging/ai-logging.ts

interface AIRequestLog {
  provider: 'vllm' | 'anthropic';
  model: string;
  agentId: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  latencyMs: number;
  success: boolean;
  error?: string;
  userId: string;
  conversationId: string;
}

export function logAIRequest(data: AIRequestLog): void {
  const log = getLogger();

  if (data.success) {
    log.info(
      {
        ai: {
          provider: data.provider,
          model: data.model,
          agentId: data.agentId,
          tokens: {
            input: data.inputTokens,
            output: data.outputTokens,
            total: data.totalTokens,
          },
          latencyMs: data.latencyMs,
        },
        userId: data.userId,
        conversationId: data.conversationId,
      },
      'AI request completed'
    );

    // Warn on expensive requests
    if (data.totalTokens > 10000) {
      log.warn(
        {
          totalTokens: data.totalTokens,
          userId: data.userId,
          agentId: data.agentId,
        },
        'High token usage in single request'
      );
    }

    // Warn on slow responses
    if (data.latencyMs > 10_000) {
      log.warn(
        {
          provider: data.provider,
          latencyMs: data.latencyMs,
          model: data.model,
        },
        'Slow AI response'
      );
    }
  } else {
    log.error(
      {
        ai: {
          provider: data.provider,
          model: data.model,
          error: data.error,
          latencyMs: data.latencyMs,
        },
      },
      'AI request failed'
    );
  }
}
```

---

## 5. Metrics Collection

```typescript
// src/lib/logging/metrics.ts

interface MetricPoint {
  name: string;
  value: number;
  tags: Record<string, string>;
  timestamp: number;
}

class MetricsCollector {
  private counters = new Map<string, number>();
  private gauges = new Map<string, number>();
  private histograms = new Map<string, number[]>();

  // Counters: monotonically increasing
  increment(name: string, tags?: Record<string, string>, amount: number = 1): void {
    const key = this.makeKey(name, tags);
    this.counters.set(key, (this.counters.get(key) ?? 0) + amount);
  }

  // Gauges: current value
  gauge(name: string, value: number, tags?: Record<string, string>): void {
    const key = this.makeKey(name, tags);
    this.gauges.set(key, value);
  }

  // Histograms: distribution of values
  histogram(name: string, value: number, tags?: Record<string, string>): void {
    const key = this.makeKey(name, tags);
    const existing = this.histograms.get(key) ?? [];
    existing.push(value);
    // Keep last 10000 values
    if (existing.length > 10000) existing.splice(0, existing.length - 10000);
    this.histograms.set(key, existing);
  }

  // Timer helper
  startTimer(): () => number {
    const start = Date.now();
    return () => Date.now() - start;
  }

  getSnapshot(): {
    counters: Record<string, number>;
    gauges: Record<string, number>;
    histograms: Record<string, { p50: number; p95: number; p99: number; avg: number }>;
  } {
    const histogramStats: Record<string, any> = {};
    for (const [key, values] of this.histograms) {
      const sorted = [...values].sort((a, b) => a - b);
      histogramStats[key] = {
        p50: sorted[Math.floor(sorted.length * 0.5)] ?? 0,
        p95: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
        p99: sorted[Math.floor(sorted.length * 0.99)] ?? 0,
        avg: sorted.reduce((a, b) => a + b, 0) / sorted.length || 0,
      };
    }

    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: histogramStats,
    };
  }

  private makeKey(name: string, tags?: Record<string, string>): string {
    if (!tags) return name;
    const tagStr = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return `${name}{${tagStr}}`;
  }
}

export const metrics = new MetricsCollector();

// Common metric recording
export function recordApiMetrics(
  route: string,
  method: string,
  statusCode: number,
  durationMs: number
): void {
  const tags = { route, method, status: String(statusCode) };

  metrics.increment('http.requests.total', tags);
  metrics.histogram('http.request.duration_ms', durationMs, { route, method });

  if (statusCode >= 400) {
    metrics.increment('http.errors.total', tags);
  }
}

export function recordAIMetrics(
  provider: string,
  tokens: number,
  durationMs: number,
  success: boolean
): void {
  metrics.increment('ai.requests.total', { provider, success: String(success) });
  metrics.increment('ai.tokens.total', { provider }, tokens);
  metrics.histogram('ai.request.duration_ms', durationMs, { provider });
}
```

---

## 6. Health Check and Status Endpoint

```typescript
// src/app/api/health/route.ts

export async function GET() {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkRedis(),
    checkAIProviders(),
  ]);

  const results = {
    status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
    checks: {
      database: resolveCheck(checks[0]),
      redis: resolveCheck(checks[1]),
      ai: resolveCheck(checks[2]),
    },
    metrics: metrics.getSnapshot(),
  };

  // Determine overall status
  const checkValues = Object.values(results.checks);
  if (checkValues.some((c) => c.status === 'unhealthy')) {
    results.status = 'unhealthy';
  } else if (checkValues.some((c) => c.status === 'degraded')) {
    results.status = 'degraded';
  }

  return Response.json(results, {
    status: results.status === 'unhealthy' ? 503 : 200,
    headers: { 'Cache-Control': 'no-store' },
  });
}

async function checkDatabase(): Promise<{ status: string; latencyMs: number }> {
  const start = Date.now();
  await prisma.$queryRaw`SELECT 1`;
  return { status: 'healthy', latencyMs: Date.now() - start };
}

async function checkRedis(): Promise<{ status: string; latencyMs: number }> {
  const start = Date.now();
  await redis.ping();
  return { status: 'healthy', latencyMs: Date.now() - start };
}

async function checkAIProviders(): Promise<{
  vllm: string;
  anthropic: string;
}> {
  return {
    vllm: circuitBreakers.vllm.getState().state === 'open' ? 'degraded' : 'healthy',
    anthropic: circuitBreakers.anthropic.getState().state === 'open' ? 'degraded' : 'healthy',
  };
}

function resolveCheck(result: PromiseSettledResult<any>) {
  if (result.status === 'fulfilled') return result.value;
  return { status: 'unhealthy', error: result.reason?.message };
}
```

---

## 7. Audit Logging

```typescript
// src/lib/logging/audit.ts

interface AuditEntry {
  action: string;
  actor: {
    userId: string;
    role: string;
    ip?: string;
  };
  resource: {
    type: string;
    id: string;
  };
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
}

export async function auditLog(entry: AuditEntry): Promise<void> {
  const ctx = getRequestContext();

  // Always log to structured logger
  logger.info(
    {
      audit: true,
      ...entry,
      correlationId: ctx?.correlationId,
      timestamp: new Date().toISOString(),
    },
    `AUDIT: ${entry.action}`
  );

  // Persist to database
  try {
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        actorId: entry.actor.userId,
        actorRole: entry.actor.role,
        actorIp: entry.actor.ip,
        resourceType: entry.resource.type,
        resourceId: entry.resource.id,
        changesBefore: entry.changes?.before
          ? JSON.stringify(entry.changes.before)
          : null,
        changesAfter: entry.changes?.after
          ? JSON.stringify(entry.changes.after)
          : null,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        correlationId: ctx?.correlationId,
      },
    });
  } catch (error) {
    // Audit log failure should not break the request
    logger.error({ err: error }, 'Failed to persist audit log');
  }
}

// Usage
await auditLog({
  action: 'SUBSCRIPTION_UPGRADED',
  actor: { userId, role: 'user', ip: clientIp },
  resource: { type: 'Subscription', id: subscriptionId },
  changes: {
    before: { tier: 'STARTER' },
    after: { tier: 'PLUS' },
  },
});

// Security-sensitive actions
await auditLog({
  action: 'ADMIN_USER_VIEWED',
  actor: { userId: adminId, role: 'admin', ip: clientIp },
  resource: { type: 'User', id: targetUserId },
  metadata: { reason: 'Support ticket #12345' },
});
```

---

## 8. Log Aggregation for Vercel

```typescript
// src/lib/logging/vercel-drain.ts

// Vercel Log Drains forward logs to external services
// Configure via Vercel dashboard or API

// For custom drain endpoint:
// src/app/api/logs/drain/route.ts
export async function POST(req: Request) {
  const secret = req.headers.get('x-vercel-verify');
  if (secret !== process.env.LOG_DRAIN_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  const logs = await req.json();

  // Process logs — forward to your logging service
  for (const log of logs) {
    // Store in PostgreSQL for analysis
    await prisma.$executeRaw`
      INSERT INTO log_entries (
        level, message, source, timestamp, data
      ) VALUES (
        ${log.level ?? 'info'},
        ${log.message?.slice(0, 1000) ?? ''},
        ${log.source ?? 'vercel'},
        ${new Date(log.timestamp).toISOString()}::timestamptz,
        ${JSON.stringify(log)}::jsonb
      )
    `;
  }

  return new Response('OK');
}
```

---

## 9. Error and Performance Dashboards

```typescript
// src/app/api/admin/observability/route.ts

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const hours = parseInt(searchParams.get('hours') ?? '24');
  const since = new Date(Date.now() - hours * 3600_000);

  const [errorStats, performanceStats, aiStats] = await Promise.all([
    getErrorStats(since),
    getPerformanceStats(since),
    getAIStats(since),
  ]);

  return Response.json({
    period: { hours, since: since.toISOString() },
    errors: errorStats,
    performance: performanceStats,
    ai: aiStats,
    circuitBreakers: {
      vllm: circuitBreakers.vllm.getState(),
      anthropic: circuitBreakers.anthropic.getState(),
      stripe: circuitBreakers.stripe.getState(),
    },
    metrics: metrics.getSnapshot(),
  });
}

async function getErrorStats(since: Date) {
  return prisma.$queryRaw`
    SELECT
      error_code,
      severity,
      COUNT(*) as count,
      MAX(created_at) as last_occurrence
    FROM error_log
    WHERE created_at > ${since}
    GROUP BY error_code, severity
    ORDER BY count DESC
    LIMIT 20
  `;
}

async function getPerformanceStats(since: Date) {
  return prisma.$queryRaw`
    SELECT
      route,
      method,
      COUNT(*) as request_count,
      AVG(duration_ms) as avg_duration,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration,
      PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ms) as p99_duration,
      COUNT(*) FILTER (WHERE status_code >= 500) as error_count
    FROM request_log
    WHERE created_at > ${since}
    GROUP BY route, method
    ORDER BY request_count DESC
    LIMIT 20
  `;
}

async function getAIStats(since: Date) {
  return prisma.$queryRaw`
    SELECT
      provider,
      COUNT(*) as request_count,
      SUM(input_tokens + output_tokens) as total_tokens,
      AVG(latency_ms) as avg_latency,
      SUM(cost_usd) as total_cost,
      COUNT(*) FILTER (WHERE success = false) as failures
    FROM ai_request_log
    WHERE created_at > ${since}
    GROUP BY provider
  `;
}
```

---

## 10. Alerting Rules

```typescript
// src/lib/logging/alerts.ts

interface AlertRule {
  name: string;
  condition: () => Promise<boolean>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cooldownMs: number;
  message: (data?: any) => string;
}

const alertRules: AlertRule[] = [
  {
    name: 'high-error-rate',
    condition: async () => {
      const count = parseInt(
        (await redis.get('metrics:errors-5m')) ?? '0'
      );
      return count > 50;
    },
    severity: 'critical',
    cooldownMs: 600_000, // 10 min cooldown
    message: () => 'Error rate exceeds 50 in 5 minutes',
  },
  {
    name: 'database-slow',
    condition: async () => {
      const stats = queryTracker.getStats();
      return stats !== null && stats.p99 > 5000;
    },
    severity: 'high',
    cooldownMs: 300_000,
    message: (data) => `Database P99 latency: ${data?.p99}ms (threshold: 5000ms)`,
  },
  {
    name: 'ai-circuit-open',
    condition: async () => {
      return (
        circuitBreakers.vllm.getState().state === 'open' &&
        circuitBreakers.anthropic.getState().state === 'open'
      );
    },
    severity: 'critical',
    cooldownMs: 60_000,
    message: () => 'ALL AI providers circuit breakers are OPEN',
  },
];

class AlertManager {
  private lastAlerted = new Map<string, number>();

  async evaluateRules(): Promise<void> {
    for (const rule of alertRules) {
      try {
        const triggered = await rule.condition();
        if (!triggered) continue;

        // Check cooldown
        const lastTime = this.lastAlerted.get(rule.name) ?? 0;
        if (Date.now() - lastTime < rule.cooldownMs) continue;

        // Fire alert
        this.lastAlerted.set(rule.name, Date.now());

        logger.warn(
          { alertName: rule.name, severity: rule.severity },
          `ALERT: ${rule.message()}`
        );

        if (rule.severity === 'critical' || rule.severity === 'high') {
          await sendFounderAlert(
            `alert.${rule.name}`,
            `[ALERT] ${rule.name}`,
            rule.message(),
            'stone'
          );
        }
      } catch (error) {
        logger.error({ err: error, rule: rule.name }, 'Alert evaluation failed');
      }
    }
  }
}

export const alertManager = new AlertManager();
```

---

## Summary

| Component | Tool | Purpose |
|-----------|------|---------|
| Structured logging | Pino | Fast, JSON-formatted logs |
| Correlation IDs | AsyncLocalStorage | Trace requests across functions |
| Query logging | Prisma events | Track slow queries |
| AI logging | Custom | Monitor provider health/cost |
| Metrics | In-memory collector | Counters, gauges, histograms |
| Health checks | `/api/health` | Uptime monitoring |
| Audit log | PostgreSQL | Security compliance |
| Alerting | Alert rules + email | Proactive incident detection |

Observability is not optional — it is the foundation that lets Stone AI detect issues before users report them, understand costs, and maintain the reliability that 40 agents depend on.
