# Real-Time Features

## Palace Knowledge Seed — Advanced Backend Engineering

### Overview

Real-time features bring Stone AI to life — streaming AI responses, typing indicators, presence, and live notifications. This seed covers WebSocket patterns, Server-Sent Events (SSE), real-time chat implementation, presence indicators, and connection management for the Stone AI stack (Next.js 16, Vercel, Redis).

---

## 1. SSE for AI Streaming

Server-Sent Events are ideal for one-directional streaming (server to client), perfect for AI response streaming.

```typescript
// src/app/api/chat/stream/route.ts
import { z } from 'zod';

const chatSchema = z.object({
  message: z.string().min(1).max(10000),
  agentId: z.number().int().positive(),
  conversationId: z.string().uuid().optional(),
}).strict();

export const POST = withObservability(
  requireAuth(async (req: AuthenticatedRequest) => {
    const body = chatSchema.parse(await req.json());
    const { userId, tier } = req.auth;

    // Validate agent access
    if (!canAccessAgent(tier, body.agentId)) {
      throw new TierAccessError('required tier', tier, `Agent #${body.agentId}`);
    }

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial event
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'start', conversationId: body.conversationId })}\n\n`)
          );

          // Stream AI response
          const aiStream = await getStreamingAIResponse(
            body.agentId,
            body.message,
            userId
          );

          let totalTokens = 0;

          for await (const chunk of aiStream) {
            if (chunk.type === 'text') {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'text', content: chunk.text })}\n\n`)
              );
            } else if (chunk.type === 'usage') {
              totalTokens = chunk.totalTokens;
            }
          }

          // Send completion event
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'done',
              usage: { totalTokens },
            })}\n\n`)
          );

          controller.close();

          // Background: track usage
          safeAsync(
            () => trackTokenUsage(userId, body.agentId, totalTokens),
            'token-tracking'
          );
        } catch (error: any) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              message: error.message ?? 'An error occurred',
            })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    });
  })
);
```

### AI Provider Streaming

```typescript
// src/lib/ai/streaming.ts

interface StreamChunk {
  type: 'text' | 'usage' | 'error';
  text?: string;
  totalTokens?: number;
  error?: string;
}

async function* getStreamingAIResponse(
  agentId: number,
  message: string,
  userId: string
): AsyncGenerator<StreamChunk> {
  const agent = await getAgent(agentId);
  const systemPrompt = agent.systemPrompt;

  // Try vLLM first
  try {
    yield* streamFromVLLM(systemPrompt, message);
    return;
  } catch (error) {
    console.warn('[AI] vLLM streaming failed, falling back to Anthropic');
  }

  // Fallback to Anthropic
  yield* streamFromAnthropic(systemPrompt, message);
}

async function* streamFromVLLM(
  systemPrompt: string,
  message: string
): AsyncGenerator<StreamChunk> {
  const response = await fetch(`${process.env.VLLM_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.VLLM_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      stream: true,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) throw new Error(`vLLM error: ${response.status}`);

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let totalTokens = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') continue;

      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          yield { type: 'text', text: content };
        }
        if (parsed.usage) {
          totalTokens = parsed.usage.total_tokens;
        }
      } catch {
        // Skip malformed chunks
      }
    }
  }

  yield { type: 'usage', totalTokens };
}

async function* streamFromAnthropic(
  systemPrompt: string,
  message: string
): AsyncGenerator<StreamChunk> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
      stream: true,
    }),
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let totalTokens = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;

      try {
        const event = JSON.parse(line.slice(6));

        if (event.type === 'content_block_delta') {
          yield { type: 'text', text: event.delta.text };
        } else if (event.type === 'message_delta') {
          totalTokens =
            (event.usage?.input_tokens ?? 0) + (event.usage?.output_tokens ?? 0);
        }
      } catch {
        // Skip
      }
    }
  }

  yield { type: 'usage', totalTokens };
}
```

---

## 2. Client-Side SSE Consumer

```typescript
// src/lib/chat/stream-client.ts

interface ChatStreamOptions {
  message: string;
  agentId: number;
  conversationId?: string;
  onText: (text: string) => void;
  onDone: (usage: { totalTokens: number }) => void;
  onError: (error: string) => void;
  signal?: AbortSignal;
}

export async function streamChat(options: ChatStreamOptions): Promise<void> {
  const response = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: options.message,
      agentId: options.agentId,
      conversationId: options.conversationId,
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    const error = await response.json();
    options.onError(error.error?.message ?? 'Stream failed');
    return;
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;

      try {
        const event = JSON.parse(line.slice(6));

        switch (event.type) {
          case 'text':
            options.onText(event.content);
            break;
          case 'done':
            options.onDone(event.usage);
            break;
          case 'error':
            options.onError(event.message);
            break;
        }
      } catch {
        // Skip malformed events
      }
    }
  }
}
```

---

## 3. Presence System

```typescript
// src/lib/realtime/presence.ts

interface PresenceData {
  userId: string;
  status: 'online' | 'away' | 'busy';
  lastSeen: number;
  currentPage?: string;
  currentAgent?: number;
}

export class PresenceManager {
  private heartbeatInterval = 30_000; // 30 seconds
  private staleThreshold = 90_000;     // 90 seconds

  async setPresence(
    userId: string,
    data: Partial<PresenceData>
  ): Promise<void> {
    const key = `presence:${userId}`;
    const presence: PresenceData = {
      userId,
      status: data.status ?? 'online',
      lastSeen: Date.now(),
      currentPage: data.currentPage,
      currentAgent: data.currentAgent,
    };

    await redis.setex(key, 120, JSON.stringify(presence));

    // Add to active users set
    await redis.zadd('active-users', Date.now(), userId);
  }

  async getPresence(userId: string): Promise<PresenceData | null> {
    const data = await redis.get(`presence:${userId}`);
    if (!data) return null;

    const presence = JSON.parse(data) as PresenceData;

    // Check if stale
    if (Date.now() - presence.lastSeen > this.staleThreshold) {
      return { ...presence, status: 'away' };
    }

    return presence;
  }

  async getOnlineUsers(limit: number = 50): Promise<PresenceData[]> {
    const cutoff = Date.now() - this.staleThreshold;

    // Get recently active users
    const userIds = await redis.zrangebyscore(
      'active-users',
      cutoff,
      '+inf',
      'LIMIT',
      0,
      limit
    );

    if (userIds.length === 0) return [];

    // Batch fetch presence data
    const pipeline = redis.pipeline();
    for (const userId of userIds) {
      pipeline.get(`presence:${userId}`);
    }

    const results = await pipeline.exec();

    return (results ?? [])
      .map(([, data]) => (data ? JSON.parse(data as string) : null))
      .filter(Boolean) as PresenceData[];
  }

  async removePresence(userId: string): Promise<void> {
    await redis.del(`presence:${userId}`);
    await redis.zrem('active-users', userId);
  }

  // Clean up stale entries
  async cleanup(): Promise<number> {
    const cutoff = Date.now() - this.staleThreshold * 2;
    const removed = await redis.zremrangebyscore('active-users', 0, cutoff);
    return removed;
  }
}

export const presenceManager = new PresenceManager();
```

### Presence API

```typescript
// src/app/api/presence/heartbeat/route.ts
export const POST = requireAuth(async (req: AuthenticatedRequest) => {
  const { currentPage, currentAgent } = await req.json();

  await presenceManager.setPresence(req.auth.userId, {
    status: 'online',
    currentPage,
    currentAgent,
  });

  return Response.json({ ok: true });
});

// src/app/api/presence/online/route.ts
export const GET = requireAuth(async () => {
  const online = await presenceManager.getOnlineUsers();
  return Response.json({
    count: online.length,
    users: online.map((u) => ({
      userId: u.userId,
      status: u.status,
    })),
  });
});
```

---

## 4. Typing Indicators

```typescript
// src/lib/realtime/typing.ts

export class TypingIndicatorManager {
  private typingTTL = 5; // seconds

  async setTyping(
    conversationId: string,
    userId: string,
    isTyping: boolean
  ): Promise<void> {
    const key = `typing:${conversationId}`;

    if (isTyping) {
      await redis.hset(key, userId, Date.now().toString());
      await redis.expire(key, this.typingTTL);
    } else {
      await redis.hdel(key, userId);
    }
  }

  async getTypingUsers(conversationId: string): Promise<string[]> {
    const key = `typing:${conversationId}`;
    const typing = await redis.hgetall(key);

    const now = Date.now();
    const activeTypers: string[] = [];

    for (const [userId, timestamp] of Object.entries(typing)) {
      if (now - Number(timestamp) < this.typingTTL * 1000) {
        activeTypers.push(userId);
      }
    }

    return activeTypers;
  }
}

export const typingManager = new TypingIndicatorManager();
```

---

## 5. Real-Time Notifications via SSE

```typescript
// src/app/api/notifications/stream/route.ts

export const GET = requireAuth(async (req: AuthenticatedRequest) => {
  const { userId } = req.auth;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send heartbeat every 30s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30_000);

      // Poll Redis for notifications (in production, use Redis Pub/Sub)
      const pollInterval = setInterval(async () => {
        try {
          const notifications = await getUnreadNotifications(userId);

          for (const notification of notifications) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify(notification)}\n\n`
              )
            );
            await markNotificationDelivered(notification.id);
          }
        } catch (error) {
          console.error('[Notifications] Poll error:', error);
        }
      }, 2000); // Poll every 2 seconds

      // Cleanup on connection close
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        clearInterval(pollInterval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
});
```

---

## 6. Redis Pub/Sub for Real-Time

```typescript
// src/lib/realtime/pubsub.ts
import { Redis } from 'ioredis';

// Dedicated subscriber connection (can't use same connection for pub and sub)
const subscriber = new Redis(process.env.REDIS_URL!);
const publisher = new Redis(process.env.REDIS_URL!);

type MessageHandler = (channel: string, message: string) => void;

class PubSubManager {
  private handlers = new Map<string, Set<MessageHandler>>();

  constructor() {
    subscriber.on('message', (channel, message) => {
      const handlers = this.handlers.get(channel);
      if (handlers) {
        for (const handler of handlers) {
          try {
            handler(channel, message);
          } catch (err) {
            console.error('[PubSub] Handler error:', err);
          }
        }
      }
    });
  }

  async subscribe(channel: string, handler: MessageHandler): Promise<() => void> {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());
      await subscriber.subscribe(channel);
    }

    this.handlers.get(channel)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(channel);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.handlers.delete(channel);
          subscriber.unsubscribe(channel);
        }
      }
    };
  }

  async publish(channel: string, data: unknown): Promise<void> {
    await publisher.publish(channel, JSON.stringify(data));
  }
}

export const pubsub = new PubSubManager();

// Publish notification
await pubsub.publish(`notifications:${userId}`, {
  type: 'tier_upgraded',
  title: 'Subscription upgraded!',
  message: `You now have access to ${newTier} features.`,
  timestamp: Date.now(),
});

// Publish typing indicator
await pubsub.publish(`typing:${conversationId}`, {
  userId,
  isTyping: true,
});
```

---

## 7. Connection Management

```typescript
// src/lib/realtime/connections.ts

class ConnectionManager {
  private connections = new Map<string, {
    controller: ReadableStreamDefaultController;
    userId: string;
    connectedAt: number;
  }>();

  register(
    connectionId: string,
    userId: string,
    controller: ReadableStreamDefaultController
  ): void {
    this.connections.set(connectionId, {
      controller,
      userId,
      connectedAt: Date.now(),
    });
    metrics.gauge('realtime.connections', this.connections.size);
  }

  remove(connectionId: string): void {
    this.connections.delete(connectionId);
    metrics.gauge('realtime.connections', this.connections.size);
  }

  sendToUser(userId: string, data: unknown): void {
    const encoder = new TextEncoder();
    const message = `data: ${JSON.stringify(data)}\n\n`;

    for (const [, conn] of this.connections) {
      if (conn.userId === userId) {
        try {
          conn.controller.enqueue(encoder.encode(message));
        } catch {
          // Connection might be closed
        }
      }
    }
  }

  broadcast(data: unknown): void {
    const encoder = new TextEncoder();
    const message = `data: ${JSON.stringify(data)}\n\n`;

    for (const [, conn] of this.connections) {
      try {
        conn.controller.enqueue(encoder.encode(message));
      } catch {
        // Connection might be closed
      }
    }
  }

  getStats(): { total: number; uniqueUsers: number } {
    const uniqueUsers = new Set(
      Array.from(this.connections.values()).map((c) => c.userId)
    );
    return {
      total: this.connections.size,
      uniqueUsers: uniqueUsers.size,
    };
  }
}

export const connectionManager = new ConnectionManager();
```

---

## 8. Vercel Limitations and Workarounds

Vercel serverless functions have execution time limits. For long-lived connections:

```typescript
// Vercel Edge Runtime supports streaming but with limits
// Pro plan: 25 seconds for serverless, 30 seconds for edge
// Enterprise: configurable

// Strategy: Client-side reconnection with exponential backoff
class ReconnectingEventSource {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectDelay = 30_000;

  constructor(
    private url: string,
    private handlers: {
      onMessage: (data: any) => void;
      onError?: (error: Event) => void;
    }
  ) {
    this.connect();
  }

  private connect(): void {
    this.eventSource = new EventSource(this.url);

    this.eventSource.onmessage = (event) => {
      this.reconnectAttempts = 0; // Reset on successful message
      try {
        const data = JSON.parse(event.data);
        this.handlers.onMessage(data);
      } catch {
        // Skip malformed messages
      }
    };

    this.eventSource.onerror = (event) => {
      this.handlers.onError?.(event);
      this.eventSource?.close();

      // Reconnect with exponential backoff
      const delay = Math.min(
        1000 * Math.pow(2, this.reconnectAttempts),
        this.maxReconnectDelay
      );
      this.reconnectAttempts++;

      setTimeout(() => this.connect(), delay);
    };
  }

  close(): void {
    this.eventSource?.close();
    this.eventSource = null;
  }
}
```

---

## Summary

| Feature | Protocol | Stone AI Use Case |
|---------|----------|------------------|
| AI streaming | SSE | Real-time token-by-token AI responses |
| Notifications | SSE + Redis Pub/Sub | Tier changes, system alerts |
| Presence | Redis ZADD + polling | Online user count |
| Typing indicators | Redis hash + TTL | Chat UX |
| Connection management | In-memory registry | Targeted messaging |
| Reconnection | Client-side exponential backoff | Vercel timeout handling |

SSE is the primary real-time transport for Stone AI — it works through Vercel's edge runtime, requires no WebSocket infrastructure, and handles the most critical real-time need: streaming AI responses.
