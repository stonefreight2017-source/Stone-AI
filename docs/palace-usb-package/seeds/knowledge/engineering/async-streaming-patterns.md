# Async & Streaming Patterns for AI SaaS

> Palace Engineering Seed — Senior Frontend Engineer
> Stack: TypeScript, Next.js 16, Vercel AI SDK, Prisma, Redis
> Context: Stone AI — vLLM + Qwen (local), Claude Sonnet (cloud), Haiku (fallback), streaming chat

---

## Table of Contents

1. [Async/Await Composition](#1-asyncawait-composition)
2. [Promise.all vs Promise.allSettled](#2-promiseall-vs-promiseallsettled)
3. [AbortController for Chat Cancel](#3-abortcontroller-for-chat-cancel)
4. [Try/Catch Composition Patterns](#4-trycatch-composition-patterns)
5. [Retry with Exponential Backoff](#5-retry-with-exponential-backoff)
6. [Race Condition Prevention](#6-race-condition-prevention)
7. [ReadableStream & TransformStream](#7-readablestream--transformstream)
8. [Vercel AI SDK streamText Internals](#8-vercel-ai-sdk-streamtext-internals)
9. [Think-Token Filtering as Stream Transform](#9-think-token-filtering-as-stream-transform)
10. [Server-Sent Events (SSE)](#10-server-sent-events-sse)
11. [WebSocket vs SSE Decision Tree](#11-websocket-vs-sse-decision-tree)
12. [Backpressure Handling](#12-backpressure-handling)
13. [Connection Pooling](#13-connection-pooling)
14. [Timeout Handling at Every Layer](#14-timeout-handling-at-every-layer)

---

## 1. Async/Await Composition

### Sequential vs Parallel — Know the Difference

```typescript
// WRONG: Sequential when operations are independent
// Total time: fetchUser(200ms) + fetchAgents(150ms) + fetchUsage(100ms) = 450ms
async function loadDashboard(userId: string) {
  const user = await fetchUser(userId);
  const agents = await fetchAgents(user.tier);
  const usage = await fetchUsage(userId);
  return { user, agents, usage };
}

// RIGHT: Parallel when operations are independent
// Total time: max(200ms, 150ms, 100ms) = 200ms
async function loadDashboard(userId: string) {
  const [user, agents, usage] = await Promise.all([
    fetchUser(userId),
    fetchAgents(), // Don't need user.tier? Run in parallel
    fetchUsage(userId),
  ]);
  return { user, agents, usage };
}

// RIGHT: Sequential when operations depend on each other
async function loadDashboard(userId: string) {
  // Step 1: Need user first (for tier)
  const user = await fetchUser(userId);

  // Step 2: These depend on user but not on each other — parallelize
  const [agents, usage, bestie] = await Promise.all([
    fetchAgents(user.tier),
    fetchUsage(userId),
    fetchBestie(userId),
  ]);

  return { user, agents, usage, bestie };
}
```

### Nested Async with Proper Error Propagation

```typescript
// Pattern: Each layer adds context to errors
async function handleChatMessage(
  userId: string,
  conversationId: string,
  content: string
): Promise<AssistantMessage> {
  // Validate ownership
  const conversation = await getConversation(conversationId, userId);
  if (!conversation) {
    throw new AppError('CONVERSATION_NOT_FOUND', 'Conversation not found', 404);
  }

  // Save user message
  const userMessage = await saveMessage({
    conversationId,
    role: 'user',
    content,
  });

  // Get AI response (this is where it gets nested)
  try {
    const aiResponse = await generateAIResponse({
      conversation,
      messages: [...conversation.messages, userMessage],
    });

    // Save assistant message
    const assistantMessage = await saveMessage({
      conversationId,
      role: 'assistant',
      content: aiResponse.content,
      tokenCount: aiResponse.usage.totalTokens,
    });

    // Update usage counters (fire-and-forget — don't block response)
    void updateUsageCounters(userId, aiResponse.usage).catch((err) => {
      console.error('Failed to update usage counters:', err);
    });

    return assistantMessage;
  } catch (err) {
    // Save error state on the conversation
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastError: err instanceof Error ? err.message : 'Unknown error' },
    });
    throw err; // Re-throw — let the route handler deal with HTTP response
  }
}
```

### The Pipeline Pattern

```typescript
// Compose async operations as a pipeline
type AsyncStep<TIn, TOut> = (input: TIn) => Promise<TOut>;

async function pipeline<T>(
  initial: T,
  ...steps: AsyncStep<any, any>[]
): Promise<any> {
  let result: any = initial;
  for (const step of steps) {
    result = await step(result);
  }
  return result;
}

// Usage: processing a chat message through stages
const result = await pipeline(
  rawInput,
  validateInput,        // string -> ValidatedInput
  moderateContent,      // ValidatedInput -> ModeratedInput
  buildPrompt,          // ModeratedInput -> Prompt
  callAIProvider,       // Prompt -> AIResponse
  filterThinkTokens,    // AIResponse -> CleanResponse
  saveToDatabase,       // CleanResponse -> SavedMessage
);
```

---

## 2. Promise.all vs Promise.allSettled

### Promise.all: Fail Fast

```typescript
// Use when ALL results are required — if one fails, you can't proceed
async function loadChatPage(userId: string, conversationId: string) {
  try {
    const [user, conversation, subscription] = await Promise.all([
      fetchUser(userId),           // Need to know who's chatting
      fetchConversation(conversationId), // Need the conversation
      fetchSubscription(userId),   // Need to check tier limits
    ]);

    // All three succeeded — proceed
    return { user, conversation, subscription };
  } catch (err) {
    // ONE failed — the whole page can't render
    // Promise.all rejects with the FIRST error
    throw new Error(`Failed to load chat: ${err}`);
  }
}
```

### Promise.allSettled: Partial Results OK

```typescript
// Use when some results are optional — degrade gracefully
async function loadDashboard(userId: string) {
  const results = await Promise.allSettled([
    fetchUser(userId),              // Required
    fetchRecentConversations(userId), // Nice to have
    fetchUsageStats(userId),        // Nice to have
    fetchAnnouncements(),           // Nice to have
    fetchBestieStatus(userId),      // Nice to have
  ]);

  const [userResult, convosResult, statsResult, announcementsResult, bestieResult] = results;

  // User is required — throw if it failed
  if (userResult.status === 'rejected') {
    throw new Error('Failed to load user data');
  }

  return {
    user: userResult.value,
    conversations: convosResult.status === 'fulfilled' ? convosResult.value : [],
    stats: statsResult.status === 'fulfilled' ? statsResult.value : null,
    announcements: announcementsResult.status === 'fulfilled' ? announcementsResult.value : [],
    bestie: bestieResult.status === 'fulfilled' ? bestieResult.value : null,
  };
}

// Helper: Extract settled results with type safety
function getSettledValue<T>(
  result: PromiseSettledResult<T>,
  fallback: T
): T {
  return result.status === 'fulfilled' ? result.value : fallback;
}

function getSettledError(
  result: PromiseSettledResult<unknown>
): Error | null {
  return result.status === 'rejected'
    ? (result.reason instanceof Error ? result.reason : new Error(String(result.reason)))
    : null;
}
```

### Real Example: Multi-Provider AI Fallback

```typescript
// Stone AI: try vLLM (local) → Claude Sonnet (cloud) → Haiku (fallback)
async function getAIResponseWithFallback(
  prompt: string,
  options: AIOptions
): Promise<AIResponse> {
  const providers = [
    { name: 'vLLM', fn: () => callVLLM(prompt, options) },
    { name: 'Claude Sonnet', fn: () => callClaude(prompt, { ...options, model: 'sonnet' }) },
    { name: 'Claude Haiku', fn: () => callClaude(prompt, { ...options, model: 'haiku' }) },
  ];

  const errors: Array<{ provider: string; error: Error }> = [];

  for (const provider of providers) {
    try {
      const response = await provider.fn();
      if (errors.length > 0) {
        // Log that we fell back (but still succeeded)
        console.warn(
          `AI response succeeded via ${provider.name} after ${errors.length} failures:`,
          errors.map((e) => `${e.provider}: ${e.error.message}`)
        );
      }
      return response;
    } catch (err) {
      errors.push({
        provider: provider.name,
        error: err instanceof Error ? err : new Error(String(err)),
      });
    }
  }

  // All providers failed
  throw new AggregateError(
    errors.map((e) => e.error),
    `All AI providers failed: ${errors.map((e) => `${e.provider}: ${e.error.message}`).join(', ')}`
  );
}
```

---

## 3. AbortController for Chat Cancel

### Client-Side: Cancel Button

```typescript
'use client';

function useCancelableChat(conversationId: string) {
  const controllerRef = useRef<AbortController | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    // Abort any previous in-flight request
    controllerRef.current?.abort();

    const controller = new AbortController();
    controllerRef.current = controller;
    setIsStreaming(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, message: content }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Check if aborted between reads
        if (controller.signal.aborted) {
          await reader.cancel();
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        // Process chunk...
        useAppStore.getState().appendStreamChunk(chunk);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // User clicked cancel — this is expected, not an error
        console.log('Stream cancelled by user');
        return;
      }
      // Actual error — rethrow or handle
      throw err;
    } finally {
      if (controllerRef.current === controller) {
        setIsStreaming(false);
        controllerRef.current = null;
      }
    }
  }, [conversationId]);

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setIsStreaming(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  return { sendMessage, cancel, isStreaming };
}

// In the component:
function ChatInput() {
  const { sendMessage, cancel, isStreaming } = useCancelableChat(conversationId);

  return (
    <div className="flex gap-2">
      <textarea ref={inputRef} disabled={isStreaming} />
      {isStreaming ? (
        <Button onClick={cancel} variant="destructive">
          Stop
        </Button>
      ) : (
        <Button onClick={() => sendMessage(inputRef.current!.value)}>
          Send
        </Button>
      )}
    </div>
  );
}
```

### Server-Side: Detecting Client Disconnection

```typescript
// app/api/chat/route.ts
export async function POST(request: NextRequest) {
  const { signal } = request; // NextRequest exposes the abort signal

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        const aiStream = await callAIProvider(prompt, { signal });

        for await (const token of aiStream) {
          // Check if client disconnected
          if (signal.aborted) {
            console.log('Client disconnected, stopping AI generation');
            break;
          }

          controller.enqueue(encoder.encode(token));
        }
      } catch (err) {
        if (signal.aborted) {
          // Client disconnected — clean up silently
          return;
        }
        controller.enqueue(encoder.encode(`[ERROR] ${err}`));
      } finally {
        controller.close();
      }
    },

    cancel() {
      // Called when the client closes the connection
      console.log('Stream cancelled by client');
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
```

### AbortController Composition (Timeout + User Cancel)

```typescript
// Combine multiple abort reasons
function createCompositeAbort(
  timeoutMs: number,
  userSignal?: AbortSignal
): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();

  // Timeout abort
  const timeoutId = setTimeout(() => {
    controller.abort(new Error(`Timeout after ${timeoutMs}ms`));
  }, timeoutMs);

  // User abort (forward from parent signal)
  const onUserAbort = () => {
    controller.abort(userSignal?.reason ?? new Error('User cancelled'));
  };
  userSignal?.addEventListener('abort', onUserAbort);

  const cleanup = () => {
    clearTimeout(timeoutId);
    userSignal?.removeEventListener('abort', onUserAbort);
  };

  // Clean up when this controller aborts
  controller.signal.addEventListener('abort', cleanup, { once: true });

  return { signal: controller.signal, cleanup };
}

// Usage:
async function callAIWithTimeout(prompt: string, userSignal?: AbortSignal) {
  const { signal, cleanup } = createCompositeAbort(60_000, userSignal);

  try {
    return await fetch('https://ai-provider.com/chat', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
      signal,
    });
  } finally {
    cleanup();
  }
}
```

---

## 4. Try/Catch Composition Patterns

### Pattern 1: Nested Try/Catch (Specific Recovery)

```typescript
// Each layer catches and handles its own errors
async function processMessage(userId: string, content: string) {
  let conversation: Conversation;

  try {
    conversation = await getOrCreateConversation(userId);
  } catch (err) {
    // DB error — can't proceed at all
    throw new AppError('DB_ERROR', 'Failed to access conversation', 500, err);
  }

  let aiResponse: string;
  try {
    aiResponse = await callAIProvider(content);
  } catch (err) {
    // AI provider failed — try fallback
    try {
      aiResponse = await callFallbackProvider(content);
    } catch (fallbackErr) {
      // Both providers failed
      throw new AppError(
        'AI_UNAVAILABLE',
        'All AI providers are currently unavailable',
        503,
        fallbackErr
      );
    }
  }

  try {
    return await saveMessage(conversation.id, aiResponse);
  } catch (err) {
    // Response generated but save failed — log and return anyway
    console.error('Failed to save message:', err);
    return { content: aiResponse, saved: false };
  }
}
```

### Pattern 2: Flattened with Early Returns

```typescript
// Avoid deep nesting by returning early
async function processMessage(userId: string, content: string) {
  const conversationResult = await tryCatch(() => getOrCreateConversation(userId));
  if (conversationResult.error) {
    throw new AppError('DB_ERROR', 'Failed to access conversation', 500);
  }

  const aiResult = await tryCatch(() => callAIProvider(content));
  if (aiResult.error) {
    const fallbackResult = await tryCatch(() => callFallbackProvider(content));
    if (fallbackResult.error) {
      throw new AppError('AI_UNAVAILABLE', 'AI providers unavailable', 503);
    }
    return fallbackResult.data;
  }

  return aiResult.data;
}
```

### Pattern 3: Result Type (Rust-Inspired)

```typescript
// No try/catch — errors are values
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

async function tryCatch<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return ok(await fn());
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
}

// Usage: composing results without try/catch
async function handleChat(userId: string, content: string): Promise<Result<Message>> {
  const userResult = await tryCatch(() => fetchUser(userId));
  if (!userResult.ok) return err(new AppError('AUTH', 'User not found'));

  const user = userResult.value;
  if (user.messageCount >= user.tierLimit) {
    return err(new AppError('LIMIT', 'Message limit reached'));
  }

  const aiResult = await tryCatch(() => callAI(content));
  if (!aiResult.ok) {
    // Try fallback
    const fallback = await tryCatch(() => callFallbackAI(content));
    if (!fallback.ok) return err(new AppError('AI', 'All providers failed'));
    return ok({ role: 'assistant', content: fallback.value });
  }

  return ok({ role: 'assistant', content: aiResult.value });
}

// In the route handler:
export async function POST(request: NextRequest) {
  const result = await handleChat(userId, content);

  if (!result.ok) {
    const status = result.error instanceof AppError ? result.error.status : 500;
    return NextResponse.json({ error: result.error.message }, { status });
  }

  return NextResponse.json(result.value);
}
```

### Custom AppError Class

```typescript
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 500,
    public cause?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: this.stack,
        cause: this.cause instanceof Error ? this.cause.message : this.cause,
      }),
    };
  }
}
```

---

## 5. Retry with Exponential Backoff

```typescript
interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors?: (error: unknown) => boolean;
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
  signal?: AbortSignal;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if signal is aborted
      if (opts.signal?.aborted) throw error;

      // Don't retry on last attempt
      if (attempt === opts.maxRetries) break;

      // Check if error is retryable
      if (opts.retryableErrors && !opts.retryableErrors(error)) {
        throw error; // Non-retryable — fail immediately
      }

      // Calculate delay with jitter
      const exponentialDelay = opts.baseDelayMs * Math.pow(opts.backoffMultiplier, attempt);
      const jitter = Math.random() * opts.baseDelayMs * 0.5; // 0-50% jitter
      const delay = Math.min(exponentialDelay + jitter, opts.maxDelayMs);

      opts.onRetry?.(error, attempt + 1, delay);

      // Wait with abort support
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(resolve, delay);
        opts.signal?.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(opts.signal!.reason);
        }, { once: true });
      });
    }
  }

  throw lastError;
}

// --- Usage: AI provider calls ---
async function callAIWithRetry(prompt: string, signal?: AbortSignal) {
  return withRetry(
    () => callAIProvider(prompt),
    {
      maxRetries: 2,
      baseDelayMs: 2000,
      retryableErrors: (err) => {
        if (err instanceof Error) {
          // Retry on rate limits and server errors
          if (err.message.includes('429')) return true;
          if (err.message.includes('500')) return true;
          if (err.message.includes('503')) return true;
          if (err.message.includes('ECONNRESET')) return true;
          if (err.message.includes('ETIMEDOUT')) return true;
        }
        // Don't retry on 400 (bad request), 401 (auth), 403 (forbidden)
        return false;
      },
      onRetry: (err, attempt, delay) => {
        console.warn(
          `AI call failed (attempt ${attempt}), retrying in ${delay}ms:`,
          err instanceof Error ? err.message : err
        );
      },
      signal,
    }
  );
}

// --- Usage: Database connections ---
async function queryWithRetry<T>(
  queryFn: () => Promise<T>,
  label: string
): Promise<T> {
  return withRetry(queryFn, {
    maxRetries: 3,
    baseDelayMs: 500,
    maxDelayMs: 5000,
    retryableErrors: (err) => {
      if (err instanceof Error) {
        // Prisma connection errors
        if (err.message.includes('P1001')) return true; // Can't reach DB
        if (err.message.includes('P1002')) return true; // DB timed out
        if (err.message.includes('P1008')) return true; // Operations timed out
        if (err.message.includes('P1017')) return true; // Server closed connection
        if (err.message.includes('connection pool')) return true;
      }
      return false;
    },
    onRetry: (err, attempt, delay) => {
      console.warn(`DB query "${label}" failed, retry ${attempt} in ${delay}ms`);
    },
  });
}

// Usage:
const user = await queryWithRetry(
  () => prisma.user.findUnique({ where: { id: userId } }),
  'fetchUser'
);
```

---

## 6. Race Condition Prevention

### Concurrent Chat Messages

```typescript
// Problem: User sends "Hello" then "How are you?" before first response arrives
// Both messages trigger AI responses — they interleave and corrupt the conversation

// Solution: Serial queue
class MessageQueue {
  private queue: Array<() => Promise<void>> = [];
  private processing = false;

  async enqueue(task: () => Promise<void>): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          await task();
          resolve();
        } catch (err) {
          reject(err);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift()!;
      await task();
    }

    this.processing = false;
  }
}

// Usage in hook:
function useSerialChat(conversationId: string) {
  const queueRef = useRef(new MessageQueue());

  const sendMessage = useCallback(
    (content: string) => {
      return queueRef.current.enqueue(async () => {
        // Each message waits for the previous to complete
        await sendAndStreamMessage(conversationId, content);
      });
    },
    [conversationId]
  );

  return { sendMessage };
}
```

### Double-Click Guard

```typescript
// Prevent double-click on payment button, delete button, etc.
function useOnce<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  const pendingRef = useRef(false);

  return useCallback(
    (async (...args: Parameters<T>) => {
      if (pendingRef.current) return;
      pendingRef.current = true;
      try {
        return await fn(...args);
      } finally {
        pendingRef.current = false;
      }
    }) as T,
    [fn]
  );
}

// Usage:
function SubscribeButton({ planId }: { planId: string }) {
  const handleSubscribe = useOnce(
    useCallback(async () => {
      const { url } = await createCheckoutSession(planId);
      window.location.href = url;
    }, [planId])
  );

  return <button onClick={handleSubscribe}>Subscribe</button>;
}
```

### Stale Request Cancellation

```typescript
// Only the most recent request's result should be used
function useLatestRequest<T>(fetcher: (signal: AbortSignal) => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async () => {
    // Abort previous
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher(controller.signal);
      // Only update if this is still the latest request
      if (!controller.signal.aborted) {
        setData(result);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [fetcher]);

  useEffect(() => {
    return () => controllerRef.current?.abort();
  }, []);

  return { data, error, loading, execute };
}

// Usage: Agent search with debounce
function AgentSearch() {
  const [query, setQuery] = useState('');

  const { data: agents, loading, execute } = useLatestRequest(
    useCallback(
      (signal: AbortSignal) =>
        fetch(`/api/agents?search=${encodeURIComponent(query)}`, { signal })
          .then((r) => r.json()),
      [query]
    )
  );

  useEffect(() => {
    const timer = setTimeout(execute, 300); // 300ms debounce
    return () => clearTimeout(timer);
  }, [query, execute]);

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      {loading && <Spinner />}
      {agents?.map((a: Agent) => <AgentCard key={a.id} agent={a} />)}
    </div>
  );
}
```

---

## 7. ReadableStream & TransformStream

### Creating a ReadableStream

```typescript
// Basic: convert an async generator to a ReadableStream
function generatorToStream<T>(
  generator: AsyncGenerator<T>
): ReadableStream<T> {
  return new ReadableStream<T>({
    async pull(controller) {
      const { done, value } = await generator.next();
      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
    cancel() {
      generator.return(undefined);
    },
  });
}

// Usage:
async function* generateTokens(prompt: string): AsyncGenerator<string> {
  const response = await callAI(prompt);
  for await (const token of response) {
    yield token;
  }
}

const stream = generatorToStream(generateTokens('Hello'));
```

### TransformStream: Pipeline Processing

```typescript
// Transform: filter think tokens from AI stream
function createThinkTokenFilter(): TransformStream<string, string> {
  let insideThinkBlock = false;

  return new TransformStream<string, string>({
    transform(chunk, controller) {
      let output = '';
      let i = 0;

      while (i < chunk.length) {
        if (!insideThinkBlock) {
          const thinkStart = chunk.indexOf('<think>', i);
          if (thinkStart === -1) {
            output += chunk.slice(i);
            break;
          }
          output += chunk.slice(i, thinkStart);
          insideThinkBlock = true;
          i = thinkStart + 7; // skip '<think>'
        } else {
          const thinkEnd = chunk.indexOf('</think>', i);
          if (thinkEnd === -1) {
            break; // Still inside think block, skip rest
          }
          insideThinkBlock = false;
          i = thinkEnd + 8; // skip '</think>'
        }
      }

      if (output.length > 0) {
        controller.enqueue(output);
      }
    },
  });
}

// Transform: add SSE formatting
function createSSETransform(): TransformStream<string, Uint8Array> {
  const encoder = new TextEncoder();

  return new TransformStream({
    transform(chunk, controller) {
      const sseMessage = `data: ${JSON.stringify({ content: chunk })}\n\n`;
      controller.enqueue(encoder.encode(sseMessage));
    },
    flush(controller) {
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
    },
  });
}

// Compose transforms into a pipeline
function createChatStream(aiStream: ReadableStream<string>): ReadableStream<Uint8Array> {
  return aiStream
    .pipeThrough(createThinkTokenFilter())
    .pipeThrough(createSSETransform());
}

// In route handler:
export async function POST(request: NextRequest) {
  const aiStream = await getAIStream(prompt);
  const processedStream = createChatStream(aiStream);

  return new Response(processedStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}
```

### Tee: Split a Stream

```typescript
// Read a stream for both response AND logging
const [responseStream, logStream] = aiStream.tee();

// Send one to the client
const response = new Response(responseStream.pipeThrough(createSSETransform()));

// Process the other for logging (fire-and-forget)
void (async () => {
  const reader = logStream.getReader();
  let fullContent = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    fullContent += value;
  }
  // Save complete response to DB
  await saveMessage(conversationId, fullContent);
})();

return response;
```

---

## 8. Vercel AI SDK streamText Internals

```typescript
// Vercel AI SDK wraps the complexity of streaming AI responses
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

// Basic usage
export async function POST(request: NextRequest) {
  const { messages, conversationId } = await request.json();

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    messages,
    maxTokens: 4096,
    temperature: 0.7,

    // System prompt
    system: `You are Agent #${agentNumber} of Stone AI...`,

    // Called when stream starts
    onStart: () => {
      console.log('Stream started for conversation:', conversationId);
    },

    // Called for each token
    onToken: (token) => {
      // Optional: real-time processing
    },

    // Called when stream completes
    onFinish: async ({ text, usage, finishReason }) => {
      // Save to database after streaming completes
      await prisma.message.create({
        data: {
          conversationId,
          role: 'assistant',
          content: text,
          tokenCount: usage.totalTokens,
        },
      });

      // Update usage counters
      await prisma.usage.update({
        where: { userId },
        data: {
          tokensUsed: { increment: usage.totalTokens },
          messageCount: { increment: 1 },
        },
      });
    },
  });

  // Return the stream response
  return result.toDataStreamResponse();
}

// Under the hood, streamText:
// 1. Calls the AI provider's streaming API
// 2. Wraps the response in a ReadableStream
// 3. Adds protocol markers (Vercel AI SDK data stream protocol)
// 4. Handles abort signals, errors, and cleanup
// 5. Fires lifecycle callbacks (onStart, onToken, onFinish)

// Custom stream processing with streamText
const result = streamText({
  model: anthropic('claude-sonnet-4-20250514'),
  messages,

  // Transform the stream before sending to client
  experimental_transform: smoothStream({
    delayInMs: 20, // Smooth token delivery for natural feel
  }),
});

// Access the raw stream for custom processing
const reader = result.textStream.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  // Custom processing per token
}

// Or consume as an async iterable
for await (const textPart of result.textStream) {
  process.stdout.write(textPart);
}
```

### Client-Side with useChat Hook

```typescript
'use client';

import { useChat } from 'ai/react';

function ChatPanel({ conversationId }: { conversationId: string }) {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    error,
    reload,
    setMessages,
  } = useChat({
    api: '/api/chat',
    body: { conversationId },
    id: conversationId,

    onResponse: (response) => {
      if (response.status === 429) {
        toast.error('Rate limit reached. Please wait.');
      }
    },

    onFinish: (message) => {
      // Message fully streamed — update local state, analytics, etc.
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages.list(conversationId),
      });
    },

    onError: (error) => {
      toast.error(error.message || 'Something went wrong');
    },
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {messages.map((m) => (
          <ChatMessage key={m.id} role={m.role} content={m.content} />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="border-t p-4 flex gap-2">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Message..."
          className="flex-1"
        />
        {isLoading ? (
          <Button onClick={stop} variant="destructive">Stop</Button>
        ) : (
          <Button type="submit">Send</Button>
        )}
      </form>

      {error && (
        <div className="p-2 text-red-500 flex items-center gap-2">
          <span>{error.message}</span>
          <Button onClick={reload} size="sm">Retry</Button>
        </div>
      )}
    </div>
  );
}
```

---

## 9. Think-Token Filtering as Stream Transform

Stone AI uses Qwen 2.5 32B via vLLM, which includes `<think>...</think>` reasoning blocks. These must be stripped from user-facing output while optionally logged for debugging.

```typescript
// src/lib/stream/think-filter.ts

interface ThinkFilterOptions {
  /** If true, collected think content is passed to onThink callback */
  captureThinkContent?: boolean;
  /** Called with complete think blocks for logging/debugging */
  onThink?: (content: string) => void;
}

export function createThinkFilter(
  options: ThinkFilterOptions = {}
): TransformStream<string, string> {
  let buffer = '';
  let insideThink = false;
  let thinkContent = '';

  return new TransformStream({
    transform(chunk, controller) {
      buffer += chunk;
      let output = '';

      while (buffer.length > 0) {
        if (!insideThink) {
          const thinkIdx = buffer.indexOf('<think>');

          if (thinkIdx === -1) {
            // No <think> tag found — but it might be partially at the end
            // Keep the last 6 chars in buffer in case "<think" spans chunks
            if (buffer.length > 6) {
              output += buffer.slice(0, -6);
              buffer = buffer.slice(-6);
            }
            break;
          }

          // Output everything before <think>
          output += buffer.slice(0, thinkIdx);
          buffer = buffer.slice(thinkIdx + 7); // skip '<think>'
          insideThink = true;
          thinkContent = '';
        } else {
          const endIdx = buffer.indexOf('</think>');

          if (endIdx === -1) {
            // Still inside think block
            if (options.captureThinkContent) {
              thinkContent += buffer;
            }
            buffer = '';
            break;
          }

          // Found end of think block
          if (options.captureThinkContent) {
            thinkContent += buffer.slice(0, endIdx);
            options.onThink?.(thinkContent);
          }
          buffer = buffer.slice(endIdx + 8); // skip '</think>'
          insideThink = false;
        }
      }

      if (output.length > 0) {
        controller.enqueue(output);
      }
    },

    flush(controller) {
      // Stream ended — flush remaining buffer (if not inside think)
      if (!insideThink && buffer.length > 0) {
        controller.enqueue(buffer);
      }
      if (insideThink && options.captureThinkContent) {
        // Think block was never closed — log it anyway
        options.onThink?.(thinkContent + buffer);
      }
    },
  });
}

// Usage in route handler:
export async function POST(request: NextRequest) {
  const aiStream = await callVLLM(prompt);
  const thinkLogs: string[] = [];

  const filteredStream = aiStream.pipeThrough(
    createThinkFilter({
      captureThinkContent: true,
      onThink: (content) => {
        thinkLogs.push(content);
        // In dev: log reasoning for debugging
        if (process.env.NODE_ENV === 'development') {
          console.log('[THINK]', content.slice(0, 200));
        }
      },
    })
  );

  return new Response(
    filteredStream.pipeThrough(createSSETransform()),
    {
      headers: { 'Content-Type': 'text/event-stream' },
    }
  );
}
```

---

## 10. Server-Sent Events (SSE)

### Server Implementation

```typescript
// Full SSE implementation with heartbeat and typed events
type SSEEvent =
  | { type: 'token'; data: { content: string } }
  | { type: 'status'; data: { status: 'thinking' | 'generating' | 'done' } }
  | { type: 'error'; data: { message: string; code: string } }
  | { type: 'usage'; data: { promptTokens: number; completionTokens: number } }
  | { type: 'heartbeat'; data: {} };

function createSSEStream(
  generator: AsyncGenerator<SSEEvent>,
  signal?: AbortSignal
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      // Heartbeat to keep connection alive
      const heartbeatInterval = setInterval(() => {
        if (!signal?.aborted) {
          controller.enqueue(
            encoder.encode(`: heartbeat\n\n`) // SSE comment
          );
        }
      }, 15000);

      try {
        for await (const event of generator) {
          if (signal?.aborted) break;

          const sseMessage = [
            `event: ${event.type}`,
            `data: ${JSON.stringify(event.data)}`,
            '', // Double newline to end the event
            '', // (one from join, one explicit)
          ].join('\n');

          controller.enqueue(encoder.encode(sseMessage));
        }
      } catch (err) {
        if (!signal?.aborted) {
          const errorEvent = `event: error\ndata: ${JSON.stringify({
            message: err instanceof Error ? err.message : 'Unknown error',
            code: 'STREAM_ERROR',
          })}\n\n`;
          controller.enqueue(encoder.encode(errorEvent));
        }
      } finally {
        clearInterval(heartbeatInterval);
        controller.close();
      }
    },
  });
}

// Route handler
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const body = await request.json();

  async function* chatGenerator(): AsyncGenerator<SSEEvent> {
    yield { type: 'status', data: { status: 'thinking' } };

    const aiStream = await callAI(body.prompt);

    yield { type: 'status', data: { status: 'generating' } };

    for await (const token of aiStream) {
      yield { type: 'token', data: { content: token } };
    }

    yield {
      type: 'usage',
      data: {
        promptTokens: aiStream.usage.promptTokens,
        completionTokens: aiStream.usage.completionTokens,
      },
    };

    yield { type: 'status', data: { status: 'done' } };
  }

  const stream = createSSEStream(chatGenerator(), request.signal);

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
```

### Client Implementation

```typescript
// Typed SSE client
function useSSEChat(conversationId: string) {
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'idle' | 'thinking' | 'generating' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // EventSource is GET-only, so for POST we use fetch + manual SSE parsing
  const sendMessage = useCallback(async (message: string) => {
    setContent('');
    setStatus('thinking');
    setError(null);

    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, message }),
    });

    if (!response.ok) {
      setError(`HTTP ${response.status}`);
      setStatus('idle');
      return;
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Parse SSE messages from buffer
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? ''; // Keep incomplete line

      let eventType = '';
      let data = '';

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          eventType = line.slice(7);
        } else if (line.startsWith('data: ')) {
          data = line.slice(6);
        } else if (line === '' && eventType && data) {
          // End of event — process it
          const parsed = JSON.parse(data);

          switch (eventType) {
            case 'token':
              setContent(prev => prev + parsed.content);
              break;
            case 'status':
              setStatus(parsed.status);
              break;
            case 'error':
              setError(parsed.message);
              break;
          }

          eventType = '';
          data = '';
        }
      }
    }

    setStatus('done');
  }, [conversationId]);

  return { content, status, error, sendMessage };
}
```

---

## 11. WebSocket vs SSE Decision Tree

```
What does your feature need?
│
├── Server → Client only (AI streaming responses)?
│   └── USE SSE
│       - Simpler protocol (HTTP-based)
│       - Automatic reconnection built into EventSource
│       - Works through proxies, CDNs, Cloudflare
│       - No special server infrastructure
│       - Stone AI: this is what we use for chat
│
├── Bidirectional real-time (multiplayer, live collaboration)?
│   └── USE WEBSOCKET
│       - True duplex: both sides send at any time
│       - Lower overhead per message (no HTTP headers)
│       - Required for: collaborative editing, gaming, live cursors
│
├── Client → Server frequent updates (typing indicators, cursor position)?
│   └── USE WEBSOCKET
│       - SSE is server→client only; would need separate POST requests
│       - WebSocket sends both ways on one connection
│
├── Infrequent updates with simple payload (notifications)?
│   └── USE SSE
│       - Simpler setup, less infrastructure
│       - HTTP/2 multiplexing reduces connection overhead
│
├── Need to work through corporate firewalls / strict proxies?
│   └── USE SSE (or long-polling fallback)
│       - WebSocket upgrade can be blocked by proxies
│       - SSE is standard HTTP — rarely blocked
│
└── Scaling to 10K+ concurrent connections?
    ├── SSE: Each connection is an HTTP request — managed by your HTTP server
    └── WebSocket: Needs sticky sessions or a pub/sub layer (Redis, etc.)

Stone AI Decision: SSE for all AI streaming.
- Chat responses: SSE (server→client streaming)
- Message sending: Regular POST (client→server)
- Notifications: Future consideration (SSE or polling)
- No WebSocket needed until we add multiplayer/collab features
```

---

## 12. Backpressure Handling

### What is Backpressure?

When a producer generates data faster than the consumer can process it. In AI streaming: the AI generates tokens faster than the client can render them.

```typescript
// ReadableStream with backpressure awareness
function createBackpressureAwareStream(
  source: AsyncGenerator<string>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    // pull() is called only when the consumer is ready for more data
    // This naturally handles backpressure — if the client is slow,
    // pull() isn't called, so we don't read from the source
    async pull(controller) {
      const { done, value } = await source.next();

      if (done) {
        controller.close();
        return;
      }

      controller.enqueue(encoder.encode(value));
    },

    cancel() {
      source.return(undefined);
    },
  });
}

// TransformStream with buffering for burst handling
function createBufferedTransform(
  maxBufferSize: number = 64 * 1024 // 64KB buffer
): TransformStream<Uint8Array, Uint8Array> {
  let buffer = new Uint8Array(0);

  return new TransformStream(
    {
      transform(chunk, controller) {
        // Accumulate chunks
        const combined = new Uint8Array(buffer.length + chunk.length);
        combined.set(buffer);
        combined.set(chunk, buffer.length);

        if (combined.length >= maxBufferSize) {
          // Buffer full — flush everything
          controller.enqueue(combined);
          buffer = new Uint8Array(0);
        } else {
          buffer = combined;
        }
      },

      flush(controller) {
        if (buffer.length > 0) {
          controller.enqueue(buffer);
        }
      },
    },
    // Queuing strategy: limit internal queue to prevent memory issues
    new ByteLengthQueuingStrategy({ highWaterMark: maxBufferSize }),
    new ByteLengthQueuingStrategy({ highWaterMark: maxBufferSize })
  );
}

// Client-side: batch DOM updates to reduce render pressure
function useStreamRenderer() {
  const [displayText, setDisplayText] = useState('');
  const bufferRef = useRef('');
  const rafRef = useRef<number>(0);

  const appendChunk = useCallback((chunk: string) => {
    bufferRef.current += chunk;

    // Batch updates at 60fps instead of per-token
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        setDisplayText(prev => prev + bufferRef.current);
        bufferRef.current = '';
        rafRef.current = 0;
      });
    }
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { displayText, appendChunk };
}
```

---

## 13. Connection Pooling

### Prisma Connection Pool

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],

    // Connection pool is configured in the DATABASE_URL or here
    datasourceUrl: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// In the DATABASE_URL (Neon with pgbouncer):
// postgresql://user:pass@host/db?pgbouncer=true&connection_limit=10&pool_timeout=20

// Connection pool sizing:
// Vercel Serverless: connection_limit=10 (each function instance gets its own pool)
// Neon: Uses pgbouncer by default — connections are multiplexed
// Stone AI production: ?pgbouncer=true&connection_limit=5&pool_timeout=10
```

### Redis Connection

```typescript
// src/lib/redis.ts
import { Redis } from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis {
  const client = new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 3) return null; // Stop retrying
      return Math.min(times * 200, 2000); // 200ms, 400ms, 600ms
    },
    enableReadyCheck: true,
    connectTimeout: 5000,
    // Connection pool: ioredis handles this internally
    // For high throughput, use Cluster mode or increase lazyConnect
    lazyConnect: true,
  });

  client.on('error', (err) => {
    console.error('Redis connection error:', err);
  });

  client.on('connect', () => {
    console.log('Redis connected');
  });

  return client;
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

// Usage patterns:
// Rate limiting
async function checkRateLimit(userId: string, limit: number, windowMs: number): Promise<boolean> {
  const key = `ratelimit:${userId}`;
  const current = await redis.incr(key);

  if (current === 1) {
    // First request in window — set expiry
    await redis.pexpire(key, windowMs);
  }

  return current <= limit;
}

// Caching with TTL
async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 60
): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached) as T;

  const fresh = await fetcher();
  await redis.setex(key, ttlSeconds, JSON.stringify(fresh));
  return fresh;
}
```

---

## 14. Timeout Handling at Every Layer

### The Timeout Stack

```
Client (90s total)
  └── API Route (60s maxDuration)
        ├── DB Query (5s)
        ├── AI Provider (60s)
        │     ├── vLLM (30s)
        │     ├── Claude Sonnet (45s)
        │     └── Haiku fallback (30s)
        └── Cache Ops (2s)
```

### Database Timeout (Prisma)

```typescript
// Per-query timeout
const user = await prisma.user.findUnique({
  where: { id: userId },
  // Prisma doesn't have per-query timeout — use AbortController
});

// Transaction timeout
await prisma.$transaction(
  async (tx) => {
    await tx.message.create({ data: messageData });
    await tx.usage.update({
      where: { userId },
      data: { messageCount: { increment: 1 } },
    });
  },
  {
    maxWait: 5000,  // Max time to wait for a connection from the pool
    timeout: 10000, // Max time for the entire transaction
  }
);

// Statement-level timeout via raw SQL
await prisma.$executeRaw`SET statement_timeout = '5000'`; // 5 seconds
const results = await prisma.message.findMany({
  where: { conversationId },
  orderBy: { createdAt: 'desc' },
  take: 100,
});
```

### AI Provider Timeout

```typescript
// Wrap AI calls with timeout
async function callAIWithTimeout(
  prompt: string,
  options: {
    provider: 'vllm' | 'sonnet' | 'haiku';
    signal?: AbortSignal;
  }
): Promise<AIResponse> {
  const timeouts: Record<string, number> = {
    vllm: 30_000,
    sonnet: 45_000,
    haiku: 30_000,
  };

  const timeoutMs = timeouts[options.provider] ?? 30_000;

  // Compose user cancel signal + timeout signal
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(
    () => timeoutController.abort(new Error(`AI provider timeout after ${timeoutMs}ms`)),
    timeoutMs
  );

  // If user already cancelled, abort immediately
  if (options.signal?.aborted) {
    clearTimeout(timeoutId);
    throw options.signal.reason;
  }

  // Forward user cancellation
  options.signal?.addEventListener('abort', () => {
    timeoutController.abort(options.signal!.reason);
  });

  try {
    const response = await fetch(getProviderUrl(options.provider), {
      method: 'POST',
      body: JSON.stringify({ prompt }),
      signal: timeoutController.signal,
    });

    if (!response.ok) {
      throw new Error(`AI provider returned ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}
```

### Route-Level Timeout (Next.js)

```typescript
// app/api/chat/route.ts
export const runtime = 'nodejs';
export const maxDuration = 60; // Vercel Pro: up to 300s

export async function POST(request: NextRequest) {
  // The maxDuration tells Vercel when to kill this function
  // But you should also implement your own timeout for clean error handling

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort(new Error('Route handler timeout'));
  }, 55_000); // 55s — leave 5s buffer before Vercel kills us

  try {
    const result = await handleChat(request, controller.signal);
    return result;
  } catch (err) {
    if (err instanceof Error && err.message === 'Route handler timeout') {
      return NextResponse.json(
        { error: 'Request timed out. Please try again.' },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
```

### Client-Side Timeout

```typescript
// Global fetch wrapper with timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = 90_000, signal, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(new Error(`Request timeout after ${timeoutMs}ms`)),
    timeoutMs
  );

  // Forward external abort signal
  signal?.addEventListener('abort', () => controller.abort(signal.reason));

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    return response;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      // Was it our timeout or user cancel?
      if (signal?.aborted) throw err; // User cancel
      throw new Error(`Request to ${url} timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Usage:
const response = await fetchWithTimeout('/api/chat', {
  method: 'POST',
  body: JSON.stringify({ message }),
  timeoutMs: 90_000, // 90s for AI chat
  signal: userAbortController.signal,
});

// For regular API calls:
const agents = await fetchWithTimeout('/api/agents', {
  timeoutMs: 10_000, // 10s for simple reads
});
```

### Comprehensive Timeout Configuration

```typescript
// src/lib/config/timeouts.ts
export const TIMEOUTS = {
  // Database
  DB_QUERY: 5_000,           // 5s for simple queries
  DB_TRANSACTION: 10_000,    // 10s for transactions
  DB_POOL_WAIT: 5_000,       // 5s to get a connection from pool

  // Cache
  REDIS_OPERATION: 2_000,    // 2s for cache ops
  REDIS_CONNECT: 5_000,      // 5s to establish connection

  // AI Providers
  AI_VLLM: 30_000,           // 30s for local vLLM
  AI_SONNET: 45_000,         // 45s for Claude Sonnet
  AI_HAIKU: 30_000,          // 30s for Claude Haiku

  // API Routes
  ROUTE_CHAT: 55_000,        // 55s (buffer before Vercel's 60s)
  ROUTE_STANDARD: 10_000,    // 10s for non-streaming routes
  ROUTE_WEBHOOK: 15_000,     // 15s for webhook processing

  // Client
  CLIENT_CHAT: 90_000,       // 90s total for chat (includes streaming)
  CLIENT_API: 10_000,        // 10s for standard API calls
  CLIENT_UPLOAD: 30_000,     // 30s for file uploads

  // Middleware
  MIDDLEWARE_AUTH: 3_000,     // 3s for auth checks
} as const;
```

---

## Quick Reference: Pattern Selection

| Scenario | Pattern | Key Concern |
|----------|---------|-------------|
| AI chat streaming | SSE + TransformStream | Think-token filtering, backpressure |
| Multiple API calls | Promise.all / allSettled | Fail-fast vs graceful degradation |
| User clicks cancel | AbortController chain | Clean up at every layer |
| Provider failure | Retry with backoff + fallback chain | Jitter, retryable detection |
| Concurrent messages | Serial queue + abort previous | Order preservation |
| DB connection spike | Prisma pool + transaction timeout | Pool exhaustion prevention |
| Slow client | requestAnimationFrame batching | DOM render pressure |
| Error handling | Result type or AppError class | Typed errors, no silent swallowing |
| Stream processing | TransformStream pipeline | Composable, backpressure-aware |
| Timeout | Layered: DB < API < Route < Client | Each layer shorter than its parent |

---

*Seed maintained by Senior Frontend Engineer. Last updated: 2026-03-09.*
