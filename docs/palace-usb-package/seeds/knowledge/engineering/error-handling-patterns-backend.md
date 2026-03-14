# Error Handling Patterns — Backend

## Palace Knowledge Seed — Advanced Backend Engineering

### Overview

Robust error handling is the difference between a production system that recovers gracefully and one that confuses users and leaks information. This seed covers error hierarchies, custom error classes, error codes, retry logic, circuit breakers, graceful degradation, and patterns for the Stone AI stack (Next.js 16, Prisma 7.4.2, TypeScript, Clerk, Stripe, vLLM, Anthropic).

---

## 1. Error Hierarchy

### Base Error Classes

```typescript
// src/lib/errors/base.ts

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: Date;
  public readonly correlationId?: string;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    options?: {
      isOperational?: boolean;
      details?: Record<string, unknown>;
      cause?: Error;
      correlationId?: string;
    }
  ) {
    super(message, { cause: options?.cause });
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = options?.isOperational ?? true;
    this.details = options?.details;
    this.timestamp = new Date();
    this.correlationId = options?.correlationId;

    // Capture stack trace, excluding constructor
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
        ...(this.correlationId && { correlationId: this.correlationId }),
      },
    };
  }
}
```

### Specific Error Types

```typescript
// src/lib/errors/types.ts

// 400 — Bad Request
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, 'VALIDATION_ERROR', {
      isOperational: true,
      details,
    });
  }
}

// 401 — Unauthorized
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR', { isOperational: true });
  }
}

// 403 — Forbidden
export class AuthorizationError extends AppError {
  constructor(
    message: string = 'Insufficient permissions',
    details?: { requiredTier?: string; userTier?: string }
  ) {
    super(message, 403, 'AUTHORIZATION_ERROR', {
      isOperational: true,
      details,
    });
  }
}

// 404 — Not Found
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} with id '${id}' not found` : `${resource} not found`,
      404,
      'NOT_FOUND',
      { isOperational: true, details: { resource, id } }
    );
  }
}

// 409 — Conflict
export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 409, 'CONFLICT', { isOperational: true, details });
  }
}

// 429 — Too Many Requests
export class RateLimitError extends AppError {
  public readonly retryAfter: number;

  constructor(retryAfter: number, limitType: string) {
    super('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED', {
      isOperational: true,
      details: { retryAfter, limitType },
    });
    this.retryAfter = retryAfter;
  }
}

// 500 — Internal Server Error
export class InternalError extends AppError {
  constructor(message: string, cause?: Error) {
    super(message, 500, 'INTERNAL_ERROR', {
      isOperational: false,
      cause,
    });
  }
}

// 502 — Bad Gateway (upstream service failure)
export class UpstreamError extends AppError {
  constructor(service: string, cause?: Error) {
    super(`Upstream service failed: ${service}`, 502, 'UPSTREAM_ERROR', {
      isOperational: true,
      details: { service },
      cause,
    });
  }
}

// 503 — Service Unavailable
export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service temporarily unavailable') {
    super(message, 503, 'SERVICE_UNAVAILABLE', { isOperational: true });
  }
}

// Domain-specific errors
export class TierAccessError extends AuthorizationError {
  constructor(requiredTier: string, userTier: string, resource: string) {
    super(`Access to ${resource} requires ${requiredTier} tier or higher`, {
      requiredTier,
      userTier,
      resource,
    });
    this.code = 'TIER_ACCESS_DENIED';
  }
}

export class AIProviderError extends UpstreamError {
  constructor(
    provider: 'vllm' | 'anthropic',
    message: string,
    cause?: Error
  ) {
    super(`${provider}: ${message}`, cause);
    this.code = 'AI_PROVIDER_ERROR';
    this.details = { ...this.details, provider };
  }
}

export class PaymentError extends AppError {
  constructor(message: string, stripeError?: unknown) {
    super(message, 402, 'PAYMENT_ERROR', {
      isOperational: true,
      details: { stripeError },
    });
  }
}
```

---

## 2. Error Codes Registry

```typescript
// src/lib/errors/codes.ts

// Centralized error code registry
export const ERROR_CODES = {
  // Authentication (1xxx)
  AUTH_REQUIRED: { code: 'AUTH_1001', message: 'Authentication required' },
  AUTH_EXPIRED: { code: 'AUTH_1002', message: 'Session expired' },
  AUTH_INVALID_TOKEN: { code: 'AUTH_1003', message: 'Invalid authentication token' },
  AUTH_CLERK_WEBHOOK_INVALID: { code: 'AUTH_1004', message: 'Invalid Clerk webhook signature' },

  // Authorization (2xxx)
  TIER_ACCESS_DENIED: { code: 'AUTHZ_2001', message: 'Tier upgrade required' },
  AGENT_ACCESS_DENIED: { code: 'AUTHZ_2002', message: 'Agent not available on your tier' },
  ADMIN_REQUIRED: { code: 'AUTHZ_2003', message: 'Admin access required' },
  BESTIE_LIMIT_REACHED: { code: 'AUTHZ_2004', message: 'Bestie limit reached for your tier' },

  // Validation (3xxx)
  INVALID_INPUT: { code: 'VAL_3001', message: 'Invalid input' },
  MISSING_FIELD: { code: 'VAL_3002', message: 'Required field missing' },
  INVALID_FORMAT: { code: 'VAL_3003', message: 'Invalid data format' },
  MESSAGE_TOO_LONG: { code: 'VAL_3004', message: 'Message exceeds maximum length' },

  // AI Provider (4xxx)
  VLLM_UNAVAILABLE: { code: 'AI_4001', message: 'Local AI provider unavailable' },
  ANTHROPIC_ERROR: { code: 'AI_4002', message: 'Cloud AI provider error' },
  TOKEN_BUDGET_EXCEEDED: { code: 'AI_4003', message: 'Daily token budget exceeded' },
  MODEL_OVERLOADED: { code: 'AI_4004', message: 'AI model is currently overloaded' },

  // Payment (5xxx)
  PAYMENT_FAILED: { code: 'PAY_5001', message: 'Payment processing failed' },
  SUBSCRIPTION_INVALID: { code: 'PAY_5002', message: 'Invalid subscription state' },
  STRIPE_WEBHOOK_ERROR: { code: 'PAY_5003', message: 'Stripe webhook processing failed' },

  // Data (6xxx)
  NOT_FOUND: { code: 'DATA_6001', message: 'Resource not found' },
  CONFLICT: { code: 'DATA_6002', message: 'Resource conflict' },
  DATABASE_ERROR: { code: 'DATA_6003', message: 'Database operation failed' },

  // Rate Limiting (7xxx)
  RATE_LIMIT_API: { code: 'RATE_7001', message: 'API rate limit exceeded' },
  RATE_LIMIT_AI: { code: 'RATE_7002', message: 'AI message rate limit exceeded' },
  RATE_LIMIT_UPLOAD: { code: 'RATE_7003', message: 'Upload rate limit exceeded' },

  // System (9xxx)
  INTERNAL: { code: 'SYS_9001', message: 'Internal server error' },
  SERVICE_UNAVAILABLE: { code: 'SYS_9002', message: 'Service temporarily unavailable' },
  CONFIGURATION_ERROR: { code: 'SYS_9003', message: 'System configuration error' },
} as const;
```

---

## 3. Global Error Handler

```typescript
// src/lib/errors/handler.ts

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    correlationId?: string;
  };
}

export function handleApiError(
  error: unknown,
  correlationId?: string
): Response {
  // Known operational errors
  if (error instanceof AppError) {
    // Log operational errors at warn level
    if (error.isOperational) {
      console.warn(
        `[${error.code}] ${error.message}`,
        error.details ?? '',
        error.correlationId ?? correlationId ?? ''
      );
    } else {
      // Non-operational (programmer) errors — log at error level
      console.error(
        `[CRITICAL] ${error.code}: ${error.message}`,
        error.stack,
        error.cause
      );
    }

    const body: ErrorResponse = error.toJSON();
    if (correlationId) body.error.correlationId = correlationId;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (error instanceof RateLimitError) {
      headers['Retry-After'] = String(error.retryAfter);
    }

    return new Response(JSON.stringify(body), {
      status: error.statusCode,
      headers,
    });
  }

  // Prisma errors
  if (isPrismaError(error)) {
    return handlePrismaError(error, correlationId);
  }

  // Zod validation errors
  if (isZodError(error)) {
    return handleZodError(error, correlationId);
  }

  // Unknown errors — never expose details to client
  console.error('[UNKNOWN_ERROR]', error);

  return new Response(
    JSON.stringify({
      error: {
        code: 'SYS_9001',
        message: 'An unexpected error occurred',
        ...(correlationId && { correlationId }),
      },
    }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
}

// Prisma error mapping
function handlePrismaError(error: any, correlationId?: string): Response {
  const prismaCode = error.code;

  switch (prismaCode) {
    case 'P2002': // Unique constraint violation
      return new Response(
        JSON.stringify({
          error: {
            code: 'DATA_6002',
            message: 'A record with this value already exists',
            details: { field: error.meta?.target },
            correlationId,
          },
        }),
        { status: 409 }
      );

    case 'P2025': // Record not found
      return new Response(
        JSON.stringify({
          error: {
            code: 'DATA_6001',
            message: 'Record not found',
            correlationId,
          },
        }),
        { status: 404 }
      );

    case 'P2024': // Connection pool timeout
      console.error('[DB] Connection pool timeout:', error.message);
      return new Response(
        JSON.stringify({
          error: {
            code: 'SYS_9002',
            message: 'Service temporarily unavailable. Please retry.',
            correlationId,
          },
        }),
        { status: 503, headers: { 'Retry-After': '5' } }
      );

    default:
      console.error(`[Prisma ${prismaCode}]`, error.message);
      return new Response(
        JSON.stringify({
          error: {
            code: 'DATA_6003',
            message: 'A database error occurred',
            correlationId,
          },
        }),
        { status: 500 }
      );
  }
}

// Zod error mapping
function handleZodError(error: any, correlationId?: string): Response {
  const issues = error.issues.map((issue: any) => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));

  return new Response(
    JSON.stringify({
      error: {
        code: 'VAL_3001',
        message: 'Validation failed',
        details: { issues },
        correlationId,
      },
    }),
    { status: 400 }
  );
}

function isPrismaError(error: any): boolean {
  return error?.constructor?.name === 'PrismaClientKnownRequestError' ||
    error?.code?.startsWith?.('P');
}

function isZodError(error: any): boolean {
  return error?.constructor?.name === 'ZodError' || error?.issues;
}
```

---

## 4. API Route Error Wrapper

```typescript
// src/lib/errors/with-error-handling.ts
import { randomUUID } from 'crypto';

type RouteHandler = (
  req: Request,
  context?: any
) => Promise<Response>;

export function withErrorHandling(handler: RouteHandler): RouteHandler {
  return async (req: Request, context?: any): Promise<Response> => {
    const correlationId = randomUUID();

    try {
      const response = await handler(req, context);

      // Add correlation ID to all responses
      response.headers.set('X-Correlation-ID', correlationId);

      return response;
    } catch (error) {
      const response = handleApiError(error, correlationId);
      response.headers.set('X-Correlation-ID', correlationId);
      return response;
    }
  };
}

// Usage
// src/app/api/agents/[id]/route.ts
export const GET = withErrorHandling(async (req, { params }) => {
  const { id } = await params;
  const { userId } = auth();

  if (!userId) {
    throw new AuthenticationError();
  }

  const agent = await prisma.agent.findUnique({
    where: { id: parseInt(id) },
  });

  if (!agent) {
    throw new NotFoundError('Agent', id);
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!hasAgentAccess(user!.tier, agent.tier)) {
    throw new TierAccessError(agent.tier, user!.tier, `Agent #${agent.number}`);
  }

  return Response.json(agent);
});
```

---

## 5. Retry Logic

```typescript
// src/lib/errors/retry.ts

interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoff: 'exponential' | 'linear' | 'fixed';
  retryOn?: (error: unknown) => boolean;
  onRetry?: (error: unknown, attempt: number) => void;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelay: 500,
  maxDelay: 10_000,
  backoff: 'exponential',
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: Partial<RetryOptions>
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = attempt === config.maxAttempts;

      // Check if this error is retryable
      if (config.retryOn && !config.retryOn(error)) {
        throw error; // Not retryable — throw immediately
      }

      if (isLastAttempt) {
        throw error; // No more retries
      }

      // Calculate delay
      let delay: number;
      switch (config.backoff) {
        case 'exponential':
          delay = Math.min(
            config.baseDelay * Math.pow(2, attempt - 1),
            config.maxDelay
          );
          // Add jitter
          delay += Math.random() * delay * 0.1;
          break;
        case 'linear':
          delay = Math.min(config.baseDelay * attempt, config.maxDelay);
          break;
        case 'fixed':
          delay = config.baseDelay;
          break;
      }

      config.onRetry?.(error, attempt);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error('Unreachable');
}

// Pre-configured retry strategies
export const retryStrategies = {
  database: (fn: () => Promise<any>) =>
    withRetry(fn, {
      maxAttempts: 3,
      baseDelay: 500,
      backoff: 'exponential',
      retryOn: (error: any) =>
        error?.code === 'P2024' || // Pool timeout
        error?.message?.includes('ECONNRESET'),
    }),

  aiProvider: (fn: () => Promise<any>) =>
    withRetry(fn, {
      maxAttempts: 2,
      baseDelay: 2000,
      backoff: 'fixed',
      retryOn: (error: any) => {
        const status = error?.status ?? error?.statusCode;
        return status === 429 || status === 502 || status === 503;
      },
    }),

  webhook: (fn: () => Promise<any>) =>
    withRetry(fn, {
      maxAttempts: 5,
      baseDelay: 1000,
      maxDelay: 30_000,
      backoff: 'exponential',
    }),
};
```

---

## 6. Circuit Breaker Pattern

Prevents cascading failures by stopping calls to a failing service.

```typescript
// src/lib/errors/circuit-breaker.ts

enum CircuitState {
  CLOSED = 'closed',     // Normal operation
  OPEN = 'open',         // Failing — reject all calls
  HALF_OPEN = 'half-open', // Testing recovery
}

interface CircuitBreakerConfig {
  failureThreshold: number;   // Failures before opening
  resetTimeout: number;       // ms before trying half-open
  halfOpenMaxAttempts: number; // Test requests in half-open
  monitorWindow: number;      // ms window for counting failures
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private halfOpenAttempts = 0;

  constructor(
    private name: string,
    private config: CircuitBreakerConfig = {
      failureThreshold: 5,
      resetTimeout: 30_000,
      halfOpenMaxAttempts: 3,
      monitorWindow: 60_000,
    }
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should transition
    this.evaluateState();

    if (this.state === CircuitState.OPEN) {
      throw new ServiceUnavailableError(
        `Circuit breaker '${this.name}' is open — service unavailable`
      );
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private evaluateState(): void {
    if (this.state === CircuitState.OPEN) {
      // Check if reset timeout has elapsed
      if (Date.now() - this.lastFailureTime >= this.config.resetTimeout) {
        this.state = CircuitState.HALF_OPEN;
        this.halfOpenAttempts = 0;
        console.log(`[CircuitBreaker:${this.name}] Transitioning to HALF_OPEN`);
      }
    }
  }

  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenAttempts++;
      if (this.halfOpenAttempts >= this.config.halfOpenMaxAttempts) {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        console.log(`[CircuitBreaker:${this.name}] Recovered — CLOSED`);
      }
    } else {
      this.successCount++;
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      // Failed during recovery — back to open
      this.state = CircuitState.OPEN;
      console.warn(`[CircuitBreaker:${this.name}] Recovery failed — OPEN`);
    } else if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      console.warn(
        `[CircuitBreaker:${this.name}] Threshold reached (${this.failureCount}/${this.config.failureThreshold}) — OPEN`
      );
    }
  }

  getState(): { state: CircuitState; failures: number; name: string } {
    return {
      state: this.state,
      failures: this.failureCount,
      name: this.name,
    };
  }
}

// Pre-configured circuit breakers
export const circuitBreakers = {
  vllm: new CircuitBreaker('vllm', {
    failureThreshold: 3,
    resetTimeout: 15_000,
    halfOpenMaxAttempts: 2,
    monitorWindow: 30_000,
  }),

  anthropic: new CircuitBreaker('anthropic', {
    failureThreshold: 5,
    resetTimeout: 30_000,
    halfOpenMaxAttempts: 3,
    monitorWindow: 60_000,
  }),

  stripe: new CircuitBreaker('stripe', {
    failureThreshold: 5,
    resetTimeout: 60_000,
    halfOpenMaxAttempts: 2,
    monitorWindow: 120_000,
  }),

  database: new CircuitBreaker('database', {
    failureThreshold: 10,
    resetTimeout: 10_000,
    halfOpenMaxAttempts: 5,
    monitorWindow: 30_000,
  }),
};
```

### Using Circuit Breakers with AI Providers

```typescript
// src/lib/ai/provider.ts

export async function getAIResponse(
  agentId: number,
  message: string,
  userId: string
): Promise<AIResponse> {
  const agent = await getAgent(agentId);

  // Try vLLM first (local, free)
  try {
    return await circuitBreakers.vllm.execute(() =>
      callVLLM(agent, message)
    );
  } catch (error) {
    console.warn('[AI] vLLM failed, falling back to Anthropic:', error);
  }

  // Fallback to Anthropic
  try {
    return await circuitBreakers.anthropic.execute(() =>
      callAnthropic(agent, message)
    );
  } catch (error) {
    // Both providers failed
    throw new AIProviderError(
      'anthropic',
      'All AI providers are currently unavailable. Please try again later.',
      error instanceof Error ? error : undefined
    );
  }
}
```

---

## 7. Error Boundary for Async Operations

```typescript
// src/lib/errors/async-boundary.ts

// Safe wrapper for fire-and-forget operations
export function safeAsync(
  fn: () => Promise<void>,
  context: string
): void {
  fn().catch((error) => {
    console.error(`[SafeAsync:${context}]`, error);
    // Don't rethrow — this is a background operation
  });
}

// Safe wrapper that captures the error
export async function safeExecute<T>(
  fn: () => Promise<T>,
  fallback: T,
  context: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error(`[SafeExecute:${context}]`, error);
    return fallback;
  }
}

// Usage
export async function POST(req: Request) {
  const result = await processMessage(message);

  // Non-critical operations — don't fail the request
  safeAsync(
    () => trackTokenUsage(userId, result.tokens),
    'token-tracking'
  );

  safeAsync(
    () => updateLastActiveTime(userId),
    'activity-tracking'
  );

  // Critical with fallback
  const agentConfig = await safeExecute(
    () => getAgentFromCache(agentId),
    DEFAULT_AGENT_CONFIG, // fallback
    'agent-config-fetch'
  );

  return Response.json(result);
}
```

---

## 8. Graceful Degradation

```typescript
// src/lib/errors/degradation.ts

interface FeatureFlag {
  name: string;
  isEnabled: boolean;
  fallback?: () => any;
}

class GracefulDegradation {
  private disabledFeatures = new Set<string>();

  async disableFeature(name: string, reason: string): Promise<void> {
    this.disabledFeatures.add(name);
    await redis.sadd('disabled-features', name);
    console.warn(`[Degradation] Feature '${name}' disabled: ${reason}`);
  }

  async enableFeature(name: string): Promise<void> {
    this.disabledFeatures.delete(name);
    await redis.srem('disabled-features', name);
  }

  async isFeatureEnabled(name: string): Promise<boolean> {
    // Check local cache first
    if (this.disabledFeatures.has(name)) return false;

    // Check Redis
    const disabled = await redis.sismember('disabled-features', name);
    return !disabled;
  }

  async withDegradation<T>(
    featureName: string,
    primary: () => Promise<T>,
    fallback: () => Promise<T> | T
  ): Promise<T> {
    if (!(await this.isFeatureEnabled(featureName))) {
      return await fallback();
    }

    try {
      return await primary();
    } catch (error) {
      console.warn(
        `[Degradation] Feature '${featureName}' failed, using fallback:`,
        error
      );
      // Auto-disable after failure
      await this.disableFeature(featureName, String(error));
      return await fallback();
    }
  }
}

export const degradation = new GracefulDegradation();

// Usage: Search with fallback
const results = await degradation.withDegradation(
  'semantic-search',
  // Primary: pgvector semantic search
  async () => {
    const embedding = await generateEmbedding(query);
    return prisma.$queryRaw`
      SELECT * FROM content
      ORDER BY embedding <=> ${embedding}::vector
      LIMIT 10
    `;
  },
  // Fallback: basic text search
  async () => {
    return prisma.content.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { body: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 10,
    });
  }
);
```

---

## 9. Error Reporting and Alerting

```typescript
// src/lib/errors/reporting.ts

interface ErrorReport {
  error: AppError | Error;
  context: {
    userId?: string;
    route?: string;
    method?: string;
    correlationId?: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class ErrorReporter {
  private errorCounts = new Map<string, number>();
  private alertThreshold = 10;
  private alertWindow = 300_000; // 5 minutes

  async report(report: ErrorReport): Promise<void> {
    const { error, context, severity } = report;

    // Structured log
    const logEntry = {
      level: severity === 'critical' ? 'fatal' : 'error',
      error: {
        name: error.name,
        message: error.message,
        code: error instanceof AppError ? error.code : 'UNKNOWN',
        stack: error.stack,
      },
      context,
      timestamp: new Date().toISOString(),
    };

    console.error(JSON.stringify(logEntry));

    // Track error frequency
    const errorKey = error instanceof AppError ? error.code : error.message;
    const count = (this.errorCounts.get(errorKey) ?? 0) + 1;
    this.errorCounts.set(errorKey, count);

    // Alert on critical or threshold breach
    if (severity === 'critical' || count >= this.alertThreshold) {
      await this.alertFounder(report, count);
      this.errorCounts.set(errorKey, 0); // Reset after alert
    }

    // Store in database for review
    if (severity !== 'low') {
      await this.persistError(report);
    }
  }

  private async alertFounder(
    report: ErrorReport,
    occurrences: number
  ): Promise<void> {
    const { error, context, severity } = report;

    await sendFounderAlert(
      `system.error.${severity}`,
      `[${severity.toUpperCase()}] ${error.message}`,
      [
        `Error: ${error.name} — ${error.message}`,
        `Code: ${error instanceof AppError ? error.code : 'N/A'}`,
        `Route: ${context.route ?? 'Unknown'}`,
        `Occurrences: ${occurrences}`,
        `Correlation ID: ${context.correlationId ?? 'N/A'}`,
        '',
        `Stack: ${error.stack?.split('\n').slice(0, 5).join('\n') ?? 'N/A'}`,
      ].join('\n'),
      'stone'
    );
  }

  private async persistError(report: ErrorReport): Promise<void> {
    try {
      await prisma.$executeRaw`
        INSERT INTO error_log (
          error_code, error_message, severity,
          user_id, route, correlation_id,
          stack_trace, created_at
        ) VALUES (
          ${report.error instanceof AppError ? report.error.code : 'UNKNOWN'},
          ${report.error.message},
          ${report.severity},
          ${report.context.userId ?? null},
          ${report.context.route ?? null},
          ${report.context.correlationId ?? null},
          ${report.error.stack ?? ''},
          NOW()
        )
      `;
    } catch {
      // Don't fail if error logging fails
    }
  }
}

export const errorReporter = new ErrorReporter();
```

---

## 10. Testing Error Handling

```typescript
// __tests__/errors/handler.test.ts
import { describe, it, expect } from 'vitest';

describe('Error Handling', () => {
  it('should return 404 for NotFoundError', () => {
    const error = new NotFoundError('Agent', '42');
    const response = handleApiError(error);

    expect(response.status).toBe(404);
  });

  it('should return 429 with Retry-After for RateLimitError', () => {
    const error = new RateLimitError(30, 'api-per-minute');
    const response = handleApiError(error);

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('30');
  });

  it('should not expose internal details for unknown errors', async () => {
    const error = new Error('database password leaked');
    const response = handleApiError(error);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error.message).toBe('An unexpected error occurred');
    expect(body.error.message).not.toContain('password');
  });

  it('should map Prisma P2002 to 409 Conflict', () => {
    const prismaError = { code: 'P2002', meta: { target: ['email'] } };
    const response = handlePrismaError(prismaError);

    expect(response.status).toBe(409);
  });
});

describe('Circuit Breaker', () => {
  it('should open after failure threshold', async () => {
    const breaker = new CircuitBreaker('test', {
      failureThreshold: 3,
      resetTimeout: 1000,
      halfOpenMaxAttempts: 1,
      monitorWindow: 5000,
    });

    const failingFn = async () => { throw new Error('fail'); };

    // Fail 3 times
    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(failingFn)).rejects.toThrow();
    }

    // Circuit should be open now
    expect(breaker.getState().state).toBe('open');

    // Next call should throw ServiceUnavailableError
    await expect(breaker.execute(failingFn)).rejects.toThrow(
      ServiceUnavailableError
    );
  });
});
```

---

## Summary

| Pattern | Purpose | Stone AI Use Case |
|---------|---------|------------------|
| Error hierarchy | Typed, structured errors | All API routes |
| Error codes | Client-parseable codes | Frontend error display |
| Global handler | Consistent error responses | `withErrorHandling` wrapper |
| Retry logic | Transient failure recovery | DB queries, AI provider calls |
| Circuit breaker | Prevent cascading failures | vLLM/Anthropic fallback chain |
| Graceful degradation | Feature fallbacks | Semantic search → text search |
| Error reporting | Monitoring + alerting | Founder alerts via email |

Every error in Stone AI is either operational (expected, handled gracefully) or programmer (unexpected, logged and alerted). The system never exposes internal details to clients and always provides actionable error codes.
