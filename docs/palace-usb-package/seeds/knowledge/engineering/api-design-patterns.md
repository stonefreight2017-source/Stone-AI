# Production API Design Patterns — Next.js App Router

> Stone AI Backend Engineering Seed
> Senior Backend Engineer — Palace Knowledge Base
> Last updated: 2026-03-09

---

## Table of Contents

1. [The 12-Step API Route Pattern](#1-the-12-step-api-route-pattern)
2. [Error Response Standards](#2-error-response-standards)
3. [Rate Limiting](#3-rate-limiting)
4. [Cursor Pagination with Prisma](#4-cursor-pagination-with-prisma)
5. [Zod .strict() Validation](#5-zod-strict-validation)
6. [Webhook Design](#6-webhook-design)
7. [Streaming with Vercel AI SDK](#7-streaming-with-vercel-ai-sdk)
8. [Idempotency Keys](#8-idempotency-keys)
9. [CORS Configuration](#9-cors-configuration)
10. [Request Logging](#10-request-logging)
11. [Common Pitfalls](#11-common-pitfalls)
12. [Quick Reference Checklist](#12-quick-reference-checklist)

---

## 1. The 12-Step API Route Pattern

Every API route in Stone AI follows this exact sequence. No steps are skipped. No steps are reordered. This is the backbone of every `route.ts` file.

```
Step 1:  Extract & Parse Request
Step 2:  Authenticate (Clerk)
Step 3:  Authorize (role/tier check)
Step 4:  Validate Input (Zod .strict())
Step 5:  Rate Limit
Step 6:  Idempotency Check
Step 7:  Load Dependencies (DB records, external state)
Step 8:  Business Logic
Step 9:  Persist (DB write, side effects)
Step 10: Emit Events (webhooks, logs, analytics)
Step 11: Format Response
Step 12: Return with Headers
```

### Full Implementation

```typescript
// src/app/api/agents/[agentId]/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { checkIdempotency, setIdempotency } from "@/lib/idempotency";
import { logRequest } from "@/lib/request-logger";
import { APIError, errorResponse } from "@/lib/api-errors";

// --- Zod schema defined OUTSIDE the handler (parsed once) ---
const ChatInputSchema = z.object({
  message: z.string().min(1).max(4000),
  conversationId: z.string().uuid().optional(),
}).strict();

type ChatInput = z.infer<typeof ChatInputSchema>;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    // ── Step 1: Extract & Parse Request ──
    const { agentId } = await params;
    const body = await req.json().catch(() => null);
    const idempotencyKey = req.headers.get("x-idempotency-key");

    // ── Step 2: Authenticate ──
    const { userId } = await auth();
    if (!userId) {
      throw new APIError("UNAUTHORIZED", "Authentication required", 401);
    }

    // ── Step 3: Authorize ──
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, tier: true, role: true },
    });

    if (!user) {
      throw new APIError("NOT_FOUND", "User account not found", 404);
    }

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: { id: true, name: true, requiredTier: true },
    });

    if (!agent) {
      throw new APIError("NOT_FOUND", "Agent not found", 404);
    }

    if (!tierSatisfies(user.tier, agent.requiredTier)) {
      throw new APIError(
        "FORBIDDEN",
        `Agent "${agent.name}" requires ${agent.requiredTier} tier or above`,
        403
      );
    }

    // ── Step 4: Validate Input ──
    const parsed = ChatInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new APIError(
        "VALIDATION_ERROR",
        "Invalid request body",
        400,
        parsed.error.flatten().fieldErrors
      );
    }
    const input: ChatInput = parsed.data;

    // ── Step 5: Rate Limit ──
    const rateLimitResult = await rateLimit({
      key: `chat:${user.id}`,
      limit: 60,
      window: 60, // 60 requests per 60 seconds
    });

    if (!rateLimitResult.allowed) {
      throw new APIError(
        "RATE_LIMITED",
        "Too many requests. Try again later.",
        429,
        { retryAfter: rateLimitResult.retryAfter }
      );
    }

    // ── Step 6: Idempotency Check ──
    if (idempotencyKey) {
      const cached = await checkIdempotency(idempotencyKey);
      if (cached) {
        return NextResponse.json(cached.response, {
          status: cached.status,
          headers: { "x-idempotent-replay": "true" },
        });
      }
    }

    // ── Step 7: Load Dependencies ──
    let conversation = input.conversationId
      ? await prisma.conversation.findFirst({
          where: { id: input.conversationId, userId: user.id },
        })
      : null;

    // ── Step 8: Business Logic ──
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { userId: user.id, agentId: agent.id },
      });
    }

    const aiResponse = await generateAgentResponse({
      agentId: agent.id,
      message: input.message,
      conversationId: conversation.id,
    });

    // ── Step 9: Persist ──
    const [userMsg, assistantMsg] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: "user",
          content: input.message,
        },
      }),
      prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: "assistant",
          content: aiResponse.text,
        },
      }),
    ]);

    // ── Step 10: Emit Events ──
    await logRequest({
      requestId,
      userId: user.id,
      method: "POST",
      path: `/api/agents/${agentId}/chat`,
      status: 200,
      duration: Date.now() - startTime,
    });

    // ── Step 11: Format Response ──
    const responseBody = {
      success: true,
      data: {
        conversationId: conversation.id,
        message: {
          id: assistantMsg.id,
          role: "assistant" as const,
          content: aiResponse.text,
          createdAt: assistantMsg.createdAt,
        },
      },
      meta: {
        requestId,
        rateLimit: {
          remaining: rateLimitResult.remaining,
          reset: rateLimitResult.reset,
        },
      },
    };

    // ── Step 12: Return with Headers ──
    if (idempotencyKey) {
      await setIdempotency(idempotencyKey, responseBody, 200);
    }

    return NextResponse.json(responseBody, {
      status: 200,
      headers: {
        "x-request-id": requestId,
        "x-ratelimit-remaining": String(rateLimitResult.remaining),
        "x-ratelimit-reset": String(rateLimitResult.reset),
      },
    });
  } catch (error) {
    return errorResponse(error, requestId, startTime);
  }
}
```

### Why This Order Matters

- **Auth before validation**: Never waste CPU parsing input for unauthenticated requests.
- **Authorization before rate limit**: Prevents attackers from consuming rate limit tokens with invalid credentials.
- **Rate limit before idempotency**: An attacker replaying the same idempotency key to DoS you still gets rate limited.
- **Idempotency before business logic**: Saves the expensive work if we already have a cached result.
- **Persist before emit**: Never send events about state changes that haven't been committed.

---

## 2. Error Response Standards

Every error response in Stone AI follows the same envelope. No exceptions. Clients parse one shape.

### Error Envelope

```typescript
// src/lib/api-errors.ts
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "CONFLICT"
  | "IDEMPOTENCY_MISMATCH"
  | "PAYMENT_REQUIRED"
  | "INTERNAL_ERROR"
  | "SERVICE_UNAVAILABLE"
  | "GATEWAY_TIMEOUT";

interface ErrorResponseBody {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
}

export class APIError extends Error {
  constructor(
    public code: ErrorCode,
    public override message: string,
    public status: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "APIError";
  }
}

export function errorResponse(
  error: unknown,
  requestId: string,
  startTime?: number
): NextResponse<ErrorResponseBody> {
  // Known API errors
  if (error instanceof APIError) {
    return NextResponse.json(
      {
        success: false as const,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details && { details: error.details }),
        },
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
        },
      },
      { status: error.status, headers: { "x-request-id": requestId } }
    );
  }

  // Zod validation errors (safety net if thrown directly)
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false as const,
        error: {
          code: "VALIDATION_ERROR" as ErrorCode,
          message: "Request validation failed",
          details: error.flatten().fieldErrors,
        },
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 400, headers: { "x-request-id": requestId } }
    );
  }

  // Prisma known errors
  if (isPrismaError(error)) {
    return handlePrismaError(error, requestId);
  }

  // Unknown errors — NEVER leak internals
  console.error(`[${requestId}] Unhandled error:`, error);
  return NextResponse.json(
    {
      success: false as const,
      error: {
        code: "INTERNAL_ERROR" as ErrorCode,
        message: "An unexpected error occurred",
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    },
    { status: 500, headers: { "x-request-id": requestId } }
  );
}

function isPrismaError(error: unknown): error is { code: string; meta?: Record<string, unknown> } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as any).code === "string" &&
    (error as any).code.startsWith("P")
  );
}

function handlePrismaError(
  error: { code: string; meta?: Record<string, unknown> },
  requestId: string
) {
  const map: Record<string, { status: number; code: ErrorCode; message: string }> = {
    P2002: { status: 409, code: "CONFLICT", message: "A record with this value already exists" },
    P2025: { status: 404, code: "NOT_FOUND", message: "Record not found" },
    P2003: { status: 400, code: "VALIDATION_ERROR", message: "Referenced record does not exist" },
  };

  const mapped = map[error.code];
  if (mapped) {
    return NextResponse.json(
      {
        success: false as const,
        error: { code: mapped.code, message: mapped.message },
        meta: { requestId, timestamp: new Date().toISOString() },
      },
      { status: mapped.status, headers: { "x-request-id": requestId } }
    );
  }

  // Unmapped Prisma error — treat as internal
  console.error(`[${requestId}] Prisma error ${error.code}:`, error);
  return NextResponse.json(
    {
      success: false as const,
      error: { code: "INTERNAL_ERROR" as ErrorCode, message: "Database error" },
      meta: { requestId, timestamp: new Date().toISOString() },
    },
    { status: 500, headers: { "x-request-id": requestId } }
  );
}
```

### HTTP Status Code Reference

| Status | Code Constant         | When to Use                                    |
|--------|-----------------------|------------------------------------------------|
| 200    | —                     | Successful read/update                         |
| 201    | —                     | Successful creation                            |
| 204    | —                     | Successful deletion (no body)                  |
| 400    | VALIDATION_ERROR      | Bad input, missing fields, wrong types         |
| 401    | UNAUTHORIZED          | No auth token, expired session                 |
| 403    | FORBIDDEN             | Authenticated but insufficient tier/role       |
| 404    | NOT_FOUND             | Resource doesn't exist or user can't see it    |
| 409    | CONFLICT              | Duplicate unique constraint                    |
| 429    | RATE_LIMITED          | Too many requests                              |
| 500    | INTERNAL_ERROR        | Unhandled exception (NEVER leak stack traces)  |
| 502    | GATEWAY_TIMEOUT       | Upstream service (vLLM, Anthropic) unreachable |
| 503    | SERVICE_UNAVAILABLE   | Planned maintenance or overload                |

---

## 3. Rate Limiting

Stone AI uses two rate limiting strategies depending on the endpoint type.

### Token Bucket (for chat/AI endpoints)

Best for bursty traffic. Allows short bursts but enforces an average rate.

```typescript
// src/lib/rate-limit.ts
import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

interface RateLimitOptions {
  key: string;
  limit: number;       // max tokens in bucket
  window: number;       // refill period in seconds
  cost?: number;        // tokens consumed per request (default 1)
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;        // Unix timestamp when bucket refills
  retryAfter?: number;  // seconds until next allowed request
}

export async function rateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  const { key, limit, window, cost = 1 } = opts;
  const now = Date.now();
  const windowMs = window * 1000;
  const redisKey = `rl:tb:${key}`;

  // Lua script for atomic token bucket
  const luaScript = `
    local key = KEYS[1]
    local limit = tonumber(ARGV[1])
    local window_ms = tonumber(ARGV[2])
    local now = tonumber(ARGV[3])
    local cost = tonumber(ARGV[4])

    local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
    local tokens = tonumber(bucket[1])
    local last_refill = tonumber(bucket[2])

    -- Initialize bucket if it doesn't exist
    if tokens == nil then
      tokens = limit
      last_refill = now
    end

    -- Refill tokens based on elapsed time
    local elapsed = now - last_refill
    local refill = math.floor(elapsed * limit / window_ms)
    tokens = math.min(limit, tokens + refill)
    last_refill = last_refill + math.floor(refill * window_ms / limit)

    local allowed = 0
    if tokens >= cost then
      tokens = tokens - cost
      allowed = 1
    end

    redis.call('HMSET', key, 'tokens', tokens, 'last_refill', last_refill)
    redis.call('PEXPIRE', key, window_ms * 2)

    return { allowed, tokens, last_refill }
  `;

  const result = await redis.eval(
    luaScript, 1, redisKey,
    limit, windowMs, now, cost
  ) as [number, number, number];

  const [allowed, remaining, lastRefill] = result;
  const reset = Math.ceil((lastRefill + windowMs) / 1000);

  return {
    allowed: allowed === 1,
    remaining,
    reset,
    ...(allowed === 0 && {
      retryAfter: Math.max(1, reset - Math.floor(now / 1000)),
    }),
  };
}
```

### Sliding Window (for general API endpoints)

More accurate than fixed windows, prevents the boundary burst problem.

```typescript
export async function rateLimitSlidingWindow(opts: RateLimitOptions): Promise<RateLimitResult> {
  const { key, limit, window } = opts;
  const now = Date.now();
  const windowMs = window * 1000;
  const redisKey = `rl:sw:${key}`;

  const luaScript = `
    local key = KEYS[1]
    local limit = tonumber(ARGV[1])
    local window_ms = tonumber(ARGV[2])
    local now = tonumber(ARGV[3])

    -- Remove expired entries
    redis.call('ZREMRANGEBYSCORE', key, 0, now - window_ms)

    -- Count current requests in window
    local count = redis.call('ZCARD', key)

    if count < limit then
      -- Add this request
      redis.call('ZADD', key, now, now .. ':' .. math.random(1000000))
      redis.call('PEXPIRE', key, window_ms)
      return { 1, limit - count - 1 }
    else
      return { 0, 0 }
    end
  `;

  const result = await redis.eval(
    luaScript, 1, redisKey,
    limit, windowMs, now
  ) as [number, number];

  const [allowed, remaining] = result;

  return {
    allowed: allowed === 1,
    remaining,
    reset: Math.ceil((now + windowMs) / 1000),
    ...(allowed === 0 && { retryAfter: Math.ceil(windowMs / 1000) }),
  };
}
```

### Rate Limit Tiers

```typescript
// src/lib/rate-limit-config.ts
export const RATE_LIMITS = {
  chat: {
    FREE:    { limit: 10,  window: 60 },
    STARTER: { limit: 30,  window: 60 },
    PLUS:    { limit: 60,  window: 60 },
    SMART:   { limit: 120, window: 60 },
    PRO:     { limit: 240, window: 60 },
  },
  api: {
    FREE:    { limit: 30,   window: 60 },
    STARTER: { limit: 100,  window: 60 },
    PLUS:    { limit: 300,  window: 60 },
    SMART:   { limit: 600,  window: 60 },
    PRO:     { limit: 1200, window: 60 },
  },
  webhooks: {
    // Webhooks from Stripe/Clerk are not user-rate-limited
    // but we cap total throughput to prevent abuse
    global: { limit: 500, window: 60 },
  },
} as const;
```

---

## 4. Cursor Pagination with Prisma

Never use offset pagination in production. It gets slower as the offset grows because the DB still scans skipped rows. Cursor pagination is O(1) for any page.

### The Pattern

```typescript
// src/lib/pagination.ts
import { z } from "zod";

export const CursorPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  direction: z.enum(["forward", "backward"]).default("forward"),
}).strict();

export type CursorPaginationInput = z.infer<typeof CursorPaginationSchema>;

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
    prevCursor: string | null;
    count: number;
  };
}

export function buildCursorQuery<T extends { id: string }>(
  input: CursorPaginationInput
) {
  const { cursor, limit, direction } = input;

  return {
    take: (direction === "forward" ? 1 : -1) * (limit + 1), // +1 to detect hasMore
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1, // skip the cursor item itself
    }),
    orderBy: { createdAt: "desc" as const },
  };
}

export function paginateResults<T extends { id: string }>(
  items: T[],
  input: CursorPaginationInput
): PaginatedResponse<T> {
  const { limit, direction } = input;
  const hasMore = items.length > limit;

  // Trim the extra item we fetched for hasMore detection
  if (hasMore) {
    items = direction === "forward"
      ? items.slice(0, limit)
      : items.slice(1);
  }

  return {
    data: items,
    pagination: {
      hasMore,
      nextCursor: hasMore && items.length > 0
        ? items[items.length - 1].id
        : null,
      prevCursor: input.cursor || null,
      count: items.length,
    },
  };
}
```

### Usage in a Route

```typescript
// src/app/api/conversations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import {
  CursorPaginationSchema,
  buildCursorQuery,
  paginateResults,
} from "@/lib/pagination";
import { APIError, errorResponse } from "@/lib/api-errors";

export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const { userId } = await auth();
    if (!userId) throw new APIError("UNAUTHORIZED", "Auth required", 401);

    const user = await prisma.user.findUniqueOrThrow({
      where: { clerkId: userId },
      select: { id: true },
    });

    // Parse pagination from query params
    const url = new URL(req.url);
    const paginationInput = CursorPaginationSchema.parse({
      cursor: url.searchParams.get("cursor") ?? undefined,
      limit: url.searchParams.get("limit") ?? 20,
      direction: url.searchParams.get("direction") ?? "forward",
    });

    const cursorQuery = buildCursorQuery(paginationInput);

    const conversations = await prisma.conversation.findMany({
      where: { userId: user.id },
      ...cursorQuery,
      select: {
        id: true,
        agentId: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });

    const result = paginateResults(conversations, paginationInput);

    return NextResponse.json({
      success: true,
      ...result,
      meta: { requestId },
    });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
```

### Composite Cursors

For tables where you sort by something other than `id`, encode a composite cursor:

```typescript
export function encodeCompositeCursor(values: Record<string, string | number | Date>): string {
  return Buffer.from(JSON.stringify(values)).toString("base64url");
}

export function decodeCompositeCursor(cursor: string): Record<string, string> {
  return JSON.parse(Buffer.from(cursor, "base64url").toString("utf-8"));
}

// Usage: sort by createdAt + id for stable ordering
const cursor = encodeCompositeCursor({
  createdAt: lastItem.createdAt.toISOString(),
  id: lastItem.id,
});
```

---

## 5. Zod .strict() Validation

Every mutation schema uses `.strict()`. This rejects any extra fields the client sends. It blocks mass assignment attacks, prevents accidental field injection, and catches client bugs early.

### Schema Definition Patterns

```typescript
// src/lib/validations/agent-chat.ts
import { z } from "zod";

// ── Base schemas (reusable atoms) ──
const MessageContent = z.string()
  .min(1, "Message cannot be empty")
  .max(4000, "Message cannot exceed 4000 characters")
  .transform((s) => s.trim());

const UUID = z.string().uuid("Invalid ID format");

const Tier = z.enum(["FREE", "STARTER", "PLUS", "SMART", "PRO"]);

// ── Mutation schemas (.strict() ALWAYS) ──
export const CreateConversationSchema = z.object({
  agentId: UUID,
  title: z.string().max(100).optional(),
}).strict();

export const SendMessageSchema = z.object({
  message: MessageContent,
  conversationId: UUID,
  parentMessageId: UUID.optional(), // for threading
}).strict();

export const UpdateConversationSchema = z.object({
  title: z.string().min(1).max(100),
}).strict();

// ── Query schemas (.strict() on query params too) ──
export const ListConversationsQuery = z.object({
  cursor: UUID.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  agentId: UUID.optional(),
}).strict();

// ── Nested object validation ──
export const UserProfileUpdateSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  preferences: z.object({
    theme: z.enum(["light", "dark", "system"]).optional(),
    language: z.enum(["en", "es", "fr", "de", "ja", "ko"]).optional(),
    notifications: z.object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
    }).strict().optional(),
  }).strict().optional(),
}).strict();

// ── Array validation ──
export const BulkDeleteSchema = z.object({
  ids: z.array(UUID).min(1).max(50),
}).strict();
```

### Validation Middleware Helper

```typescript
// src/lib/validate.ts
import { z, ZodSchema } from "zod";
import { APIError } from "@/lib/api-errors";

export function validateBody<T>(schema: ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new APIError(
      "VALIDATION_ERROR",
      "Invalid request body",
      400,
      result.error.flatten().fieldErrors as Record<string, unknown>
    );
  }
  return result.data;
}

export function validateQuery<T>(schema: ZodSchema<T>, params: URLSearchParams): T {
  const obj: Record<string, string> = {};
  params.forEach((value, key) => {
    obj[key] = value;
  });

  const result = schema.safeParse(obj);
  if (!result.success) {
    throw new APIError(
      "VALIDATION_ERROR",
      "Invalid query parameters",
      400,
      result.error.flatten().fieldErrors as Record<string, unknown>
    );
  }
  return result.data;
}
```

### Why .strict() and Not .passthrough() or .strip()

| Method         | Extra fields | Behavior                       | Use case          |
|----------------|--------------|--------------------------------|-------------------|
| `.strict()`    | Rejected     | Throws error on unknown keys   | Mutations (SAFE)  |
| `.strip()`     | Silently removed | No error, fields dropped    | Legacy compat     |
| `.passthrough()` | Kept       | Passes unknown keys through    | NEVER in mutations |

`.strict()` is the only safe default for mutations. If a client sends `{ "message": "hi", "role": "admin" }` and you use `.strip()`, the `role` field is silently ignored — but you never find out the client is buggy or malicious. With `.strict()`, the request fails immediately and the client knows it sent something wrong.

---

## 6. Webhook Design

### Receiving Webhooks (Stripe)

```typescript
// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { logRequest } from "@/lib/request-logger";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// CRITICAL: Stripe needs the raw body for signature verification
// Next.js App Router gives us this by default — do NOT parse as JSON first
export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    const body = await req.text(); // raw body, NOT .json()
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    // Verify signature — this throws if invalid
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error(`[${requestId}] Stripe signature verification failed:`, err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Idempotency: Stripe can retry. Check if we've processed this event.
    const existing = await prisma.webhookEvent.findUnique({
      where: { externalId: event.id },
    });

    if (existing) {
      console.log(`[${requestId}] Duplicate webhook event: ${event.id}`);
      return NextResponse.json({ received: true }); // 200 so Stripe stops retrying
    }

    // Record the event BEFORE processing (crash safety)
    await prisma.webhookEvent.create({
      data: {
        externalId: event.id,
        source: "stripe",
        type: event.type,
        payload: JSON.parse(body),
        status: "PROCESSING",
      },
    });

    // Route to handler
    await handleStripeEvent(event, requestId);

    // Mark as processed
    await prisma.webhookEvent.update({
      where: { externalId: event.id },
      data: { status: "PROCESSED", processedAt: new Date() },
    });

    await logRequest({
      requestId,
      method: "POST",
      path: "/api/webhooks/stripe",
      status: 200,
      duration: Date.now() - startTime,
      meta: { eventType: event.type },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`[${requestId}] Webhook processing error:`, error);

    // Still return 200 for some errors to prevent infinite retries
    // Only return 5xx if we want Stripe to retry
    return NextResponse.json(
      { error: "Processing failed" },
      { status: 500 } // Stripe will retry
    );
  }
}

async function handleStripeEvent(event: Stripe.Event, requestId: string) {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;

    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    case "invoice.payment_failed":
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;

    default:
      console.log(`[${requestId}] Unhandled event type: ${event.type}`);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;
  const tierMap: Record<string, string> = {
    [process.env.STRIPE_STARTER_PRICE_ID!]: "STARTER",
    [process.env.STRIPE_PLUS_PRICE_ID!]: "PLUS",
    [process.env.STRIPE_SMART_PRICE_ID!]: "SMART",
    [process.env.STRIPE_PRO_PRICE_ID!]: "PRO",
  };

  const tier = tierMap[priceId] || "FREE";

  await prisma.user.update({
    where: { stripeCustomerId: customerId },
    data: {
      tier,
      stripeSubscriptionId: subscription.id,
      stripeSubscriptionStatus: subscription.status,
    },
  });
}
```

### Receiving Webhooks (Clerk)

```typescript
// src/app/api/webhooks/clerk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const svixId = req.headers.get("svix-id") ?? "";
  const svixTimestamp = req.headers.get("svix-timestamp") ?? "";
  const svixSignature = req.headers.get("svix-signature") ?? "";

  const wh = new Webhook(webhookSecret);
  let event: { type: string; data: Record<string, any> };

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "user.created":
      await prisma.user.create({
        data: {
          clerkId: event.data.id,
          email: event.data.email_addresses[0]?.email_address ?? "",
          displayName: `${event.data.first_name ?? ""} ${event.data.last_name ?? ""}`.trim(),
          tier: "FREE",
        },
      });
      break;

    case "user.deleted":
      await prisma.user.update({
        where: { clerkId: event.data.id },
        data: { deletedAt: new Date() },  // soft delete
      });
      break;
  }

  return NextResponse.json({ received: true });
}
```

---

## 7. Streaming with Vercel AI SDK

### Streaming Chat Responses

```typescript
// src/app/api/agents/[agentId]/stream/route.ts
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { streamText, convertToCoreMessages } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { APIError, errorResponse } from "@/lib/api-errors";
import { rateLimit } from "@/lib/rate-limit";

const StreamChatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().min(1).max(4000),
  })).min(1).max(50),
  conversationId: z.string().uuid(),
}).strict();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const requestId = crypto.randomUUID();

  try {
    const { userId } = await auth();
    if (!userId) throw new APIError("UNAUTHORIZED", "Auth required", 401);

    const { agentId } = await params;
    const body = await req.json();
    const input = StreamChatSchema.parse(body);

    const user = await prisma.user.findUniqueOrThrow({
      where: { clerkId: userId },
      select: { id: true, tier: true },
    });

    // Rate limit check (costs 2 tokens for streaming — it's more expensive)
    const rl = await rateLimit({
      key: `stream:${user.id}`,
      limit: 30,
      window: 60,
      cost: 2,
    });
    if (!rl.allowed) {
      throw new APIError("RATE_LIMITED", "Too many requests", 429);
    }

    const agent = await prisma.agent.findUniqueOrThrow({
      where: { id: agentId },
      select: { id: true, systemPrompt: true, model: true },
    });

    // Determine model based on agent config and user tier
    const model = selectModel(agent.model, user.tier);

    const result = streamText({
      model: anthropic(model),
      system: agent.systemPrompt,
      messages: convertToCoreMessages(input.messages),
      maxTokens: 2048,
      temperature: 0.7,

      // Called when stream completes — persist the full response
      async onFinish({ text, usage }) {
        await prisma.$transaction([
          prisma.message.create({
            data: {
              conversationId: input.conversationId,
              role: "user",
              content: input.messages[input.messages.length - 1].content,
            },
          }),
          prisma.message.create({
            data: {
              conversationId: input.conversationId,
              role: "assistant",
              content: text,
              meta: {
                model,
                promptTokens: usage.promptTokens,
                completionTokens: usage.completionTokens,
              },
            },
          }),
        ]);
      },
    });

    // Return the streaming response with custom headers
    return result.toDataStreamResponse({
      headers: {
        "x-request-id": requestId,
        "x-ratelimit-remaining": String(rl.remaining),
      },
    });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

function selectModel(agentModel: string, userTier: string): string {
  // SMART tier and above get Claude Sonnet, others get Haiku
  if (["SMART", "PRO"].includes(userTier)) {
    return "claude-sonnet-4-20250514";
  }
  return "claude-haiku-4-20250414";
}
```

### Client-Side Streaming Consumption

```typescript
// src/hooks/use-agent-chat.ts
"use client";
import { useChat } from "@ai-sdk/react";

export function useAgentChat(agentId: string, conversationId: string) {
  const chat = useChat({
    api: `/api/agents/${agentId}/stream`,
    body: { conversationId },
    headers: {
      "x-idempotency-key": undefined, // streaming is not idempotent
    },

    onError(error) {
      console.error("Stream error:", error);
      // The error object contains the parsed error response
    },

    onFinish(message) {
      // Optimistically update the conversation list
      // The server already persisted via onFinish callback
    },
  });

  return chat;
}
```

---

## 8. Idempotency Keys

Idempotency prevents duplicate actions when clients retry requests. Critical for payment operations and any state-changing endpoint.

```typescript
// src/lib/idempotency.ts
import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

const IDEMPOTENCY_TTL = 60 * 60 * 24; // 24 hours

interface CachedResponse {
  response: unknown;
  status: number;
}

export async function checkIdempotency(key: string): Promise<CachedResponse | null> {
  const cached = await redis.get(`idem:${key}`);
  if (!cached) return null;

  try {
    return JSON.parse(cached) as CachedResponse;
  } catch {
    // Corrupted cache entry — delete it and proceed
    await redis.del(`idem:${key}`);
    return null;
  }
}

export async function setIdempotency(
  key: string,
  response: unknown,
  status: number
): Promise<void> {
  await redis.setex(
    `idem:${key}`,
    IDEMPOTENCY_TTL,
    JSON.stringify({ response, status })
  );
}

// Lock-based idempotency for concurrent requests with the same key
export async function withIdempotency<T>(
  key: string,
  fn: () => Promise<{ response: T; status: number }>
): Promise<{ response: T; status: number; replayed: boolean }> {
  // Check cache first
  const cached = await checkIdempotency(key);
  if (cached) {
    return { response: cached.response as T, status: cached.status, replayed: true };
  }

  // Acquire lock to prevent concurrent duplicate processing
  const lockKey = `idem:lock:${key}`;
  const lockAcquired = await redis.set(lockKey, "1", "EX", 30, "NX");

  if (!lockAcquired) {
    // Another request is processing this key — wait and return cached result
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const result = await checkIdempotency(key);
    if (result) {
      return { response: result.response as T, status: result.status, replayed: true };
    }
    // If still no result after waiting, the other request may have failed
    // Fall through to process normally
  }

  try {
    const result = await fn();
    await setIdempotency(key, result.response, result.status);
    return { ...result, replayed: false };
  } finally {
    await redis.del(lockKey);
  }
}
```

### Usage

```typescript
// In any POST/PUT/PATCH handler:
const idempotencyKey = req.headers.get("x-idempotency-key");

if (idempotencyKey) {
  const result = await withIdempotency(idempotencyKey, async () => {
    // ... your business logic ...
    return { response: responseBody, status: 201 };
  });

  return NextResponse.json(result.response, {
    status: result.status,
    headers: {
      ...(result.replayed && { "x-idempotent-replay": "true" }),
    },
  });
}
```

### Client-Side

```typescript
// Generate a key per user action, not per retry
const idempotencyKey = `${userId}-${action}-${Date.now()}`;

// Retry with the SAME key
await fetch("/api/billing/subscribe", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-idempotency-key": idempotencyKey,
  },
  body: JSON.stringify({ priceId }),
});
```

---

## 9. CORS Configuration

### Next.js App Router CORS

```typescript
// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";

const ALLOWED_ORIGINS = [
  "https://stone-ai.net",
  "https://www.stone-ai.net",
  "https://tools.stone-ai.net",
  ...(process.env.NODE_ENV === "development" ? ["http://localhost:3000"] : []),
];

function corsHeaders(origin: string | null): Record<string, string> {
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : "",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, x-idempotency-key, x-request-id",
    "Access-Control-Expose-Headers":
      "x-request-id, x-ratelimit-remaining, x-ratelimit-reset, x-idempotent-replay",
    "Access-Control-Max-Age": "86400",
    "Access-Control-Allow-Credentials": "true",
  };
}

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const origin = req.headers.get("origin");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(origin),
    });
  }

  // Continue with the request, adding CORS headers to response
  const response = NextResponse.next();
  const headers = corsHeaders(origin);
  Object.entries(headers).forEach(([key, value]) => {
    if (value) response.headers.set(key, value);
  });

  return response;
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

### Per-Route CORS (for webhook endpoints that need different rules)

```typescript
// Webhook routes should NOT have CORS at all — they're server-to-server
// Remove them from the CORS middleware matcher or handle explicitly:

export async function OPTIONS() {
  // Webhooks don't need CORS preflight
  return new NextResponse(null, { status: 405 });
}
```

---

## 10. Request Logging

### Structured Request Logger

```typescript
// src/lib/request-logger.ts
import { prisma } from "@/lib/prisma";

interface RequestLogEntry {
  requestId: string;
  userId?: string;
  method: string;
  path: string;
  status: number;
  duration: number;
  userAgent?: string;
  ip?: string;
  meta?: Record<string, unknown>;
}

export async function logRequest(entry: RequestLogEntry): Promise<void> {
  // Fire-and-forget: don't block the response on logging
  try {
    // Log to stdout in structured JSON for Vercel log drain
    const logLine = {
      level: entry.status >= 500 ? "error" : entry.status >= 400 ? "warn" : "info",
      timestamp: new Date().toISOString(),
      requestId: entry.requestId,
      userId: entry.userId ?? null,
      method: entry.method,
      path: entry.path,
      status: entry.status,
      duration: entry.duration,
      ...(entry.meta && { meta: entry.meta }),
    };

    console.log(JSON.stringify(logLine));

    // Persist to DB for audit trail (non-blocking)
    // Only persist mutations and errors — reads are too high volume
    if (entry.method !== "GET" || entry.status >= 400) {
      prisma.auditLog.create({
        data: {
          requestId: entry.requestId,
          userId: entry.userId,
          action: `${entry.method} ${entry.path}`,
          status: entry.status,
          duration: entry.duration,
          metadata: entry.meta ?? {},
        },
      }).catch((err) => {
        console.error("Audit log write failed:", err);
      });
    }
  } catch (err) {
    // Logging should NEVER crash a request
    console.error("Request logging failed:", err);
  }
}
```

### Request Timing Utility

```typescript
// src/lib/timing.ts
export class RequestTimer {
  private marks: Map<string, number> = new Map();
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  mark(label: string): void {
    this.marks.set(label, Date.now());
  }

  since(label: string): number {
    const markTime = this.marks.get(label);
    if (!markTime) return -1;
    return Date.now() - markTime;
  }

  total(): number {
    return Date.now() - this.startTime;
  }

  // Returns Server-Timing header value
  toServerTiming(): string {
    const entries: string[] = [];
    let prev = this.startTime;

    for (const [label, time] of this.marks) {
      entries.push(`${label};dur=${time - prev}`);
      prev = time;
    }

    entries.push(`total;dur=${this.total()}`);
    return entries.join(", ");
  }
}

// Usage in a route:
// const timer = new RequestTimer();
// timer.mark("auth");
// ... auth logic ...
// timer.mark("validate");
// ... validation ...
// timer.mark("query");
// ... db query ...
//
// return NextResponse.json(data, {
//   headers: { "Server-Timing": timer.toServerTiming() },
// });
```

---

## 11. Common Pitfalls

### 1. Forgetting to await params in App Router

```typescript
// WRONG — params is a Promise in Next.js 15+
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id; // undefined or error
}

// CORRECT
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

### 2. Parsing JSON before webhook signature verification

```typescript
// WRONG — .json() consumes the body, signature verification fails
const body = await req.json();
stripe.webhooks.constructEvent(JSON.stringify(body), sig, secret); // different bytes

// CORRECT — use .text() for raw body
const body = await req.text();
stripe.webhooks.constructEvent(body, sig, secret);
const parsed = JSON.parse(body); // parse AFTER verification
```

### 3. Not handling Prisma transaction rollbacks

```typescript
// WRONG — if step 2 fails, step 1 is NOT rolled back
await prisma.order.create({ data: orderData });
await prisma.payment.create({ data: paymentData }); // throws

// CORRECT — atomic transaction
await prisma.$transaction([
  prisma.order.create({ data: orderData }),
  prisma.payment.create({ data: paymentData }),
]);

// CORRECT — interactive transaction for complex logic
await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: orderData });
  if (order.total > 0) {
    await tx.payment.create({ data: { ...paymentData, orderId: order.id } });
  }
});
```

### 4. Leaking internal errors to clients

```typescript
// WRONG
catch (error) {
  return NextResponse.json({ error: error.message }, { status: 500 });
  // Could expose: "connect ECONNREFUSED 10.0.0.5:5432" or SQL queries
}

// CORRECT — use the error handler from Section 2
catch (error) {
  return errorResponse(error, requestId); // maps to safe messages
}
```

### 5. Race conditions in subscription tier checks

```typescript
// WRONG — TOCTOU: tier could change between check and use
const user = await prisma.user.findUnique({ where: { id }, select: { tier: true } });
if (user.tier === "PRO") {
  await prisma.agentAccess.create({ ... }); // user might have been downgraded
}

// CORRECT — use a transaction with a fresh read
await prisma.$transaction(async (tx) => {
  const user = await tx.user.findUniqueOrThrow({
    where: { id },
    select: { tier: true },
  });
  if (user.tier !== "PRO") throw new APIError("FORBIDDEN", "PRO tier required", 403);
  await tx.agentAccess.create({ ... });
});
```

### 6. Unbounded queries

```typescript
// WRONG — could return millions of rows
const messages = await prisma.message.findMany({
  where: { conversationId },
});

// CORRECT — always limit
const messages = await prisma.message.findMany({
  where: { conversationId },
  take: 50,
  orderBy: { createdAt: "desc" },
});
```

---

## 12. Quick Reference Checklist

Use this before shipping any new API route.

```
[ ] Route follows the 12-step pattern (auth → validate → query → respond)
[ ] Zod schema uses .strict() for all mutation inputs
[ ] Error responses use the standard envelope (Section 2)
[ ] Rate limiting applied with correct tier config
[ ] Idempotency key supported for POST/PUT/PATCH (non-streaming)
[ ] Cursor pagination used instead of offset (for list endpoints)
[ ] Request logging fires (non-blocking, structured JSON)
[ ] Prisma queries have take/limit bounds
[ ] No internal error messages leaked to clients
[ ] params is awaited (Next.js 15+ App Router)
[ ] Webhook routes verify signatures with raw body (.text(), not .json())
[ ] Webhook events are deduplicated by external ID
[ ] DB writes that must be atomic use $transaction
[ ] CORS headers set correctly (API routes only, not webhooks)
[ ] TypeScript strict mode — no `any` escapes without a comment explaining why
[ ] Server-Timing header included for performance debugging
```

---

## Appendix: File Map

Where these patterns live in Stone AI:

```
src/
├── app/
│   ├── api/
│   │   ├── agents/[agentId]/
│   │   │   ├── chat/route.ts        # 12-step pattern, non-streaming
│   │   │   └── stream/route.ts      # Vercel AI SDK streaming
│   │   ├── conversations/route.ts   # Cursor pagination
│   │   ├── webhooks/
│   │   │   ├── stripe/route.ts      # Stripe webhook receiver
│   │   │   └── clerk/route.ts       # Clerk webhook receiver
│   │   └── billing/
│   │       └── subscribe/route.ts   # Idempotency key usage
│   └── middleware.ts                # CORS, Clerk auth
├── lib/
│   ├── api-errors.ts               # APIError class, errorResponse()
│   ├── rate-limit.ts               # Token bucket + sliding window
│   ├── rate-limit-config.ts        # Tier-based limits
│   ├── idempotency.ts              # Redis-backed idempotency
│   ├── pagination.ts               # Cursor pagination helpers
│   ├── request-logger.ts           # Structured logging
│   ├── timing.ts                   # RequestTimer + Server-Timing
│   ├── validate.ts                 # validateBody(), validateQuery()
│   └── prisma.ts                   # Prisma client singleton
└── validations/
    └── *.ts                        # Zod schemas per domain
```
