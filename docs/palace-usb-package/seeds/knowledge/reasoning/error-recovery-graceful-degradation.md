# Error Recovery & Graceful Degradation
# Seed: CLAUDE-4 | Category: Claude Patterns | Topic: Resilience Patterns
# RAG Tags: retry, exponential-backoff, fallback-chain, circuit-breaker, timeout, partial-success, graceful-degradation

---

## Purpose
Retry strategies with exponential backoff, fallback chains (model A to model B to cache),
partial-success handling, timeout management, and circuit breaker patterns for LLM calls.
TypeScript examples for production Stone AI agent infrastructure.

---

## 1. The Resilience Hierarchy

```
Level 1: RETRY (same operation, same service)
  "Try again — it might work this time"
  Use for: Transient errors (network blips, rate limits, 503s)

Level 2: FALLBACK (different approach, same goal)
  "Try a different way to get the same result"
  Use for: Service degradation, model unavailability

Level 3: PARTIAL SUCCESS (reduced quality, still useful)
  "Give the user something, even if it's not everything"
  Use for: Non-critical components failing

Level 4: GRACEFUL FAILURE (honest communication)
  "Tell the user what happened and what to do"
  Use for: Unrecoverable errors, complete service failure

NEVER: Silent failure or hallucinated success
  "Pretend everything is fine when it's not"
```

---

## 2. Retry with Exponential Backoff

### The Pattern
```
Attempt 1: Immediate
Attempt 2: Wait 1 second
Attempt 3: Wait 2 seconds
Attempt 4: Wait 4 seconds
Attempt 5: Wait 8 seconds (give up after this)

With jitter (randomization to prevent thundering herd):
Attempt 1: Immediate
Attempt 2: Wait 1.0 + random(0, 0.5) seconds
Attempt 3: Wait 2.0 + random(0, 1.0) seconds
Attempt 4: Wait 4.0 + random(0, 2.0) seconds
```

### Implementation
```typescript
// retry.ts — Production retry with exponential backoff and jitter

interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitterFactor: number;        // 0-1, percentage of delay to randomize
  retryableErrors: string[];   // Error codes/messages to retry on
  onRetry?: (attempt: number, error: Error, delayMs: number) => void;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  jitterFactor: 0.25,
  retryableErrors: [
    'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT',
    'RATE_LIMIT', '429', '503', '502', '500',
    'overloaded', 'capacity',
  ],
};

async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {},
): Promise<T> {
  const cfg = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= cfg.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Check if error is retryable
      const errorStr = String(error);
      const isRetryable = cfg.retryableErrors.some(
        re => errorStr.includes(re)
      );

      if (!isRetryable || attempt === cfg.maxAttempts) {
        throw error;
      }

      // Calculate delay with exponential backoff + jitter
      const exponentialDelay = cfg.baseDelayMs * Math.pow(2, attempt - 1);
      const cappedDelay = Math.min(exponentialDelay, cfg.maxDelayMs);
      const jitter = cappedDelay * cfg.jitterFactor * Math.random();
      const totalDelay = cappedDelay + jitter;

      cfg.onRetry?.(attempt, lastError, totalDelay);

      await new Promise(resolve => setTimeout(resolve, totalDelay));
    }
  }

  throw lastError;
}

// Usage
const response = await withRetry(
  () => callLLM(prompt, { model: 'claude-sonnet' }),
  {
    maxAttempts: 3,
    baseDelayMs: 1000,
    onRetry: (attempt, error, delay) => {
      console.warn(`LLM call failed (attempt ${attempt}), retrying in ${delay}ms:`, error.message);
    },
  }
);
```

### Retry Decision Matrix
```
Error Type              | Retry? | Strategy
------------------------|--------|---------------------------
Network timeout         | YES    | Exponential backoff
Rate limit (429)        | YES    | Respect Retry-After header
Server error (500)      | YES    | Exponential backoff, max 3
Server overloaded (503) | YES    | Longer backoff, max 5
Bad request (400)       | NO     | Fix the request, don't retry
Unauthorized (401)      | NO     | Refresh token, then retry once
Forbidden (403)         | NO     | Permission issue, don't retry
Not found (404)         | NO     | Resource doesn't exist
Validation error        | NO     | Fix input, don't retry
Model context overflow  | NO     | Reduce input, don't retry
```

---

## 3. Fallback Chains

### LLM Fallback Chain for Stone AI
```typescript
// fallback-chain.ts — Multi-model fallback for Stone AI agents

interface LLMProvider {
  name: string;
  model: string;
  endpoint: string;
  priority: number;        // Lower = higher priority
  maxLatencyMs: number;
  costPer1KTokens: number;
}

const LLM_PROVIDERS: LLMProvider[] = [
  {
    name: 'vLLM Local',
    model: 'qwen-2.5-32b-awq',
    endpoint: 'http://omen:8000/v1',
    priority: 1,
    maxLatencyMs: 30000,
    costPer1KTokens: 0,      // Self-hosted
  },
  {
    name: 'Anthropic Cloud',
    model: 'claude-sonnet',
    endpoint: 'https://api.anthropic.com/v1',
    priority: 2,
    maxLatencyMs: 60000,
    costPer1KTokens: 3.0,
  },
  {
    name: 'Anthropic Haiku',
    model: 'claude-haiku',
    endpoint: 'https://api.anthropic.com/v1',
    priority: 3,
    maxLatencyMs: 30000,
    costPer1KTokens: 0.25,
  },
];

interface FallbackResult<T> {
  result: T;
  provider: string;
  attempts: Array<{
    provider: string;
    error?: string;
    latencyMs: number;
  }>;
  degraded: boolean;         // True if used non-primary provider
}

async function callWithFallback<T>(
  buildRequest: (provider: LLMProvider) => Promise<T>,
  providers: LLMProvider[] = LLM_PROVIDERS,
): Promise<FallbackResult<T>> {
  const attempts: FallbackResult<T>['attempts'] = [];
  const sortedProviders = [...providers].sort((a, b) => a.priority - b.priority);

  for (const provider of sortedProviders) {
    const startTime = Date.now();

    try {
      // Apply timeout per provider
      const result = await Promise.race([
        buildRequest(provider),
        timeout(provider.maxLatencyMs, `${provider.name} timeout`),
      ]);

      attempts.push({
        provider: provider.name,
        latencyMs: Date.now() - startTime,
      });

      return {
        result: result as T,
        provider: provider.name,
        attempts,
        degraded: provider.priority > 1,
      };
    } catch (error) {
      attempts.push({
        provider: provider.name,
        error: String(error),
        latencyMs: Date.now() - startTime,
      });

      console.warn(`Provider ${provider.name} failed:`, error);
      // Continue to next provider
    }
  }

  // All providers failed
  throw new AllProvidersFailedError(
    `All ${sortedProviders.length} LLM providers failed`,
    attempts,
  );
}

function timeout(ms: number, message: string): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(message)), ms)
  );
}

// Usage in Stone AI agent
async function generateAgentResponse(
  agentId: number,
  prompt: string,
  userId: string,
): Promise<AgentResponse> {
  const result = await callWithFallback(async (provider) => {
    const response = await callLLM({
      model: provider.model,
      endpoint: provider.endpoint,
      prompt,
      maxTokens: 2000,
    });
    return response;
  });

  if (result.degraded) {
    // Log degradation for monitoring
    await telemetry.recordEvent('llm.degraded_response', {
      agentId,
      userId,
      primaryProvider: LLM_PROVIDERS[0].name,
      usedProvider: result.provider,
      attempts: result.attempts.length,
    });
  }

  return {
    text: result.result.text,
    model: result.provider,
    degraded: result.degraded,
  };
}
```

### Cached Response Fallback
```typescript
// When ALL LLM providers fail, serve cached responses

import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function getResponseWithCacheFallback(
  agentId: number,
  userMessage: string,
  userId: string,
): Promise<AgentResponse> {
  try {
    // Try live LLM response
    const liveResponse = await generateAgentResponse(agentId, userMessage, userId);

    // Cache successful response for future fallback
    const cacheKey = `agent:${agentId}:response:${hashMessage(userMessage)}`;
    await redis.setex(cacheKey, 86400, JSON.stringify(liveResponse)); // 24h cache

    return liveResponse;
  } catch (error) {
    // All LLM providers failed — try cache
    const cacheKey = `agent:${agentId}:response:${hashMessage(userMessage)}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      const cachedResponse = JSON.parse(cached);
      return {
        ...cachedResponse,
        cached: true,
        cacheNote: "This response was served from cache due to temporary service issues. It may not reflect the latest information.",
      };
    }

    // No cache — graceful failure
    return {
      text: "I'm experiencing technical difficulties and can't process your request right now. Please try again in a few minutes. If this persists, contact support.",
      model: 'fallback',
      degraded: true,
      error: true,
    };
  }
}
```

---

## 4. Circuit Breaker Pattern

### Why Circuit Breakers?
```
Without circuit breaker:
  Provider is down → Every request tries provider → Times out → Falls back
  100 requests/minute × 30s timeout = ALL requests slow for ALL users

With circuit breaker:
  Provider is down → First few requests fail → Circuit OPENS
  Subsequent requests immediately skip to fallback (no timeout wait)
  After cooldown → Circuit half-opens → Test with one request
  If test succeeds → Circuit closes → Normal operation resumes
```

### Implementation
```typescript
// circuit-breaker.ts

enum CircuitState {
  CLOSED = 'CLOSED',       // Normal operation
  OPEN = 'OPEN',           // Failing, skip to fallback
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

interface CircuitBreakerConfig {
  failureThreshold: number;    // Failures before opening
  resetTimeoutMs: number;      // Time before trying again
  successThreshold: number;    // Successes in half-open to close
  monitorWindowMs: number;     // Window for counting failures
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime: number = 0;
  private config: CircuitBreakerConfig;

  constructor(
    private name: string,
    config?: Partial<CircuitBreakerConfig>,
  ) {
    this.config = {
      failureThreshold: 5,
      resetTimeoutMs: 30000,     // 30 seconds
      successThreshold: 2,
      monitorWindowMs: 60000,    // 1 minute
      ...config,
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if circuit should transition
    this.checkStateTransition();

    switch (this.state) {
      case CircuitState.OPEN:
        throw new CircuitOpenError(
          `Circuit breaker '${this.name}' is OPEN. Service unavailable.`
        );

      case CircuitState.HALF_OPEN:
        try {
          const result = await operation();
          this.onSuccess();
          return result;
        } catch (error) {
          this.onFailure();
          throw error;
        }

      case CircuitState.CLOSED:
        try {
          const result = await operation();
          this.onSuccess();
          return result;
        } catch (error) {
          this.onFailure();
          throw error;
        }
    }
  }

  private checkStateTransition(): void {
    if (this.state === CircuitState.OPEN) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure >= this.config.resetTimeoutMs) {
        this.state = CircuitState.HALF_OPEN;
        this.successes = 0;
        console.info(`Circuit '${this.name}': OPEN → HALF_OPEN (testing recovery)`);
      }
    }
  }

  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      if (this.successes >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.failures = 0;
        console.info(`Circuit '${this.name}': HALF_OPEN → CLOSED (recovered)`);
      }
    } else {
      this.failures = 0; // Reset on success
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      console.warn(`Circuit '${this.name}': → OPEN (${this.failures} failures)`);
    }

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      console.warn(`Circuit '${this.name}': HALF_OPEN → OPEN (test request failed)`);
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}

// Usage with LLM providers
const vllmCircuit = new CircuitBreaker('vllm-local', {
  failureThreshold: 3,
  resetTimeoutMs: 60000,   // 1 minute cooldown
});

const anthropicCircuit = new CircuitBreaker('anthropic-cloud', {
  failureThreshold: 5,
  resetTimeoutMs: 30000,
});

async function callLLMWithCircuitBreaker(prompt: string): Promise<string> {
  // Try vLLM first (with circuit breaker)
  try {
    return await vllmCircuit.execute(() =>
      callVLLM(prompt)
    );
  } catch (error) {
    if (error instanceof CircuitOpenError) {
      console.info('vLLM circuit open, skipping to Anthropic');
    }
  }

  // Fallback to Anthropic (with circuit breaker)
  try {
    return await anthropicCircuit.execute(() =>
      callAnthropic(prompt, 'claude-sonnet')
    );
  } catch (error) {
    if (error instanceof CircuitOpenError) {
      console.info('Anthropic circuit open, using Haiku');
    }
  }

  // Last resort: Haiku (no circuit breaker — always try)
  return await callAnthropic(prompt, 'claude-haiku');
}
```

---

## 5. Partial Success Handling

### When Partial Success Makes Sense
```
Scenario: Dashboard with 5 data widgets
  Widget 1: User stats      → SUCCESS
  Widget 2: Agent usage      → SUCCESS
  Widget 3: Revenue chart    → FAILED (Stripe API down)
  Widget 4: Chat history     → SUCCESS
  Widget 5: System health    → FAILED (monitoring API timeout)

WRONG approach: Show error page because 2/5 widgets failed
RIGHT approach: Show 3 working widgets + "temporarily unavailable" for 2
```

### Implementation
```typescript
// partial-success.ts

interface ComponentResult<T> {
  name: string;
  status: 'success' | 'error' | 'timeout' | 'degraded';
  data?: T;
  error?: string;
  fallbackUsed?: boolean;
}

async function loadDashboard(userId: string): Promise<{
  components: ComponentResult<unknown>[];
  overallStatus: 'healthy' | 'degraded' | 'critical';
}> {
  // Load all components in parallel with individual timeouts
  const components = await Promise.allSettled([
    withTimeout(loadUserStats(userId), 5000, 'user-stats'),
    withTimeout(loadAgentUsage(userId), 5000, 'agent-usage'),
    withTimeout(loadRevenue(userId), 5000, 'revenue'),
    withTimeout(loadChatHistory(userId), 5000, 'chat-history'),
    withTimeout(loadSystemHealth(), 5000, 'system-health'),
  ]);

  const results: ComponentResult<unknown>[] = components.map((result, i) => {
    const names = ['user-stats', 'agent-usage', 'revenue', 'chat-history', 'system-health'];

    if (result.status === 'fulfilled') {
      return {
        name: names[i],
        status: 'success' as const,
        data: result.value,
      };
    } else {
      return {
        name: names[i],
        status: 'error' as const,
        error: result.reason?.message || 'Unknown error',
      };
    }
  });

  // Determine overall status
  const successCount = results.filter(r => r.status === 'success').length;
  const overallStatus =
    successCount === results.length ? 'healthy' :
    successCount >= results.length * 0.5 ? 'degraded' :
    'critical';

  return { components: results, overallStatus };
}

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  name: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${name} timed out after ${ms}ms`)), ms)
    ),
  ]);
}
```

---

## 6. Timeout Management

### Timeout Strategy
```
Timeout hierarchy (from shortest to longest):

Database queries:     5 seconds
  └── If it takes >5s, the query is wrong, not slow

Cache operations:     1 second
  └── Cache MUST be fast, otherwise it's worse than no cache

Internal APIs:        10 seconds
  └── Service-to-service calls within your infrastructure

LLM calls (Haiku):   30 seconds
  └── Haiku is fast, if it takes >30s something is wrong

LLM calls (Sonnet):  60 seconds
  └── Complex reasoning takes time, but >60s = likely stuck

LLM calls (vLLM):    30 seconds
  └── Local inference, should be fast

External APIs:        15 seconds
  └── Stripe, Clerk, etc.

Total request:        90 seconds
  └── Maximum time user should wait for any response
  └── If >90s, return partial result or "processing" status
```

### Timeout Implementation
```typescript
// timeout-manager.ts

const TIMEOUT_CONFIG = {
  database: 5000,
  cache: 1000,
  internalApi: 10000,
  llmHaiku: 30000,
  llmSonnet: 60000,
  llmLocal: 30000,
  externalApi: 15000,
  totalRequest: 90000,
} as const;

class TimeoutManager {
  private requestStart: number;
  private requestTimeout: number;

  constructor(requestTimeoutMs: number = TIMEOUT_CONFIG.totalRequest) {
    this.requestStart = Date.now();
    this.requestTimeout = requestTimeoutMs;
  }

  /**
   * Get remaining time budget for this request.
   */
  getRemainingMs(): number {
    const elapsed = Date.now() - this.requestStart;
    return Math.max(0, this.requestTimeout - elapsed);
  }

  /**
   * Get timeout for a specific operation type, capped by remaining budget.
   */
  getTimeout(type: keyof typeof TIMEOUT_CONFIG): number {
    const operationTimeout = TIMEOUT_CONFIG[type];
    const remaining = this.getRemainingMs();
    return Math.min(operationTimeout, remaining);
  }

  /**
   * Check if there's enough time remaining for an operation.
   */
  hasTimeFor(type: keyof typeof TIMEOUT_CONFIG): boolean {
    const needed = TIMEOUT_CONFIG[type];
    const remaining = this.getRemainingMs();
    return remaining >= needed * 0.5; // Need at least 50% of typical time
  }
}

// Usage in request handler
async function handleChatRequest(req: Request, res: Response) {
  const tm = new TimeoutManager();

  // Step 1: Auth check (uses cache timeout)
  const user = await withTimeout(
    authenticateUser(req),
    tm.getTimeout('cache'),
    'auth'
  );

  // Step 2: Load chat context (uses database timeout)
  const context = await withTimeout(
    loadChatContext(user.id),
    tm.getTimeout('database'),
    'context'
  );

  // Step 3: LLM call (uses remaining time, capped by LLM timeout)
  if (!tm.hasTimeFor('llmLocal')) {
    // Not enough time for a proper LLM call
    return res.status(200).json({
      text: "I'm processing your request but it's taking longer than usual. Please try again.",
      timeout: true,
    });
  }

  const response = await withTimeout(
    callLLMWithCircuitBreaker(buildPrompt(context, req.body.message)),
    tm.getTimeout('llmLocal'),
    'llm'
  );

  return res.json({ text: response, model: 'ok' });
}
```

---

## 7. Error Communication Templates

### User-Facing Error Messages
```typescript
const ERROR_MESSAGES = {
  // LLM-specific errors
  llm_timeout: {
    user: "I need a moment to think about this. Could you try asking again?",
    internal: "LLM request timed out",
    action: "retry",
  },
  llm_overloaded: {
    user: "I'm handling a lot of requests right now. Please try again in a minute.",
    internal: "LLM provider overloaded",
    action: "wait_and_retry",
  },
  llm_all_failed: {
    user: "I'm having trouble connecting to my brain right now. Our team has been notified. Please try again shortly.",
    internal: "All LLM providers failed",
    action: "alert_ops",
  },

  // General service errors
  rate_limited: {
    user: "You've been sending a lot of messages! Take a breather and try again in a minute.",
    internal: "User rate limit exceeded",
    action: "enforce_wait",
  },
  maintenance: {
    user: "Stone AI is undergoing a quick tune-up. We'll be back in a few minutes!",
    internal: "Scheduled maintenance",
    action: "show_status_page",
  },

  // Data errors
  not_found: {
    user: "I couldn't find what you're looking for. It may have been moved or deleted.",
    internal: "Resource not found",
    action: "none",
  },
  permission_denied: {
    user: "You don't have access to this feature. Upgrade your plan to unlock it!",
    internal: "Insufficient tier/permissions",
    action: "show_upgrade",
  },

  // Catch-all
  unknown: {
    user: "Something unexpected happened. Our team has been notified. Please try again.",
    internal: "Unhandled error",
    action: "alert_ops_and_log",
  },
} as const;

function getUserErrorMessage(errorCode: keyof typeof ERROR_MESSAGES): string {
  return ERROR_MESSAGES[errorCode]?.user || ERROR_MESSAGES.unknown.user;
}
```

---

## 8. Resilience Testing

```typescript
// resilience-test.ts — Verify fallback chains work

describe('LLM Fallback Chain', () => {
  it('should fall back to Anthropic when vLLM is down', async () => {
    // Simulate vLLM failure
    mockVLLM.mockRejectedValue(new Error('Connection refused'));

    const result = await callLLMWithCircuitBreaker('test prompt');

    expect(result).toBeDefined();
    expect(mockAnthropic).toHaveBeenCalled();
  });

  it('should fall back to Haiku when both primary providers fail', async () => {
    mockVLLM.mockRejectedValue(new Error('Connection refused'));
    mockAnthropicSonnet.mockRejectedValue(new Error('Rate limited'));

    const result = await callLLMWithCircuitBreaker('test prompt');

    expect(result).toBeDefined();
    expect(mockAnthropicHaiku).toHaveBeenCalled();
  });

  it('should return cached response when all providers fail', async () => {
    mockVLLM.mockRejectedValue(new Error('Down'));
    mockAnthropicSonnet.mockRejectedValue(new Error('Down'));
    mockAnthropicHaiku.mockRejectedValue(new Error('Down'));

    // Pre-populate cache
    await redis.setex('agent:1:response:hash123', 86400, JSON.stringify({ text: 'cached' }));

    const result = await getResponseWithCacheFallback(1, 'test', 'user1');

    expect(result.cached).toBe(true);
    expect(result.text).toBe('cached');
  });

  it('should open circuit breaker after threshold failures', async () => {
    const breaker = new CircuitBreaker('test', { failureThreshold: 3 });

    // Fail 3 times
    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();
    }

    // Circuit should be open now
    expect(breaker.getState()).toBe(CircuitState.OPEN);

    // Next call should immediately fail without trying
    await expect(breaker.execute(() => Promise.resolve('ok'))).rejects.toThrow(CircuitOpenError);
  });
});
```

---

*This seed is maintained by the Claude Patterns team. Last validated: 2026-03.*
