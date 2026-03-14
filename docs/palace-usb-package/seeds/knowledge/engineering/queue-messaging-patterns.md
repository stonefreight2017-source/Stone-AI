# Queue & Messaging Patterns

## Palace Knowledge Seed — Advanced Backend Engineering

### Overview

Message queues decouple producers from consumers, enable asynchronous processing, and improve system resilience. This seed covers pub/sub, fan-out, request-reply, dead letters, idempotent consumers, and practical implementations for Stone AI (Next.js 16, Redis, PostgreSQL 16).

---

## 1. Core Messaging Patterns

### Point-to-Point (Work Queue)

One producer, one consumer per message. Used for task distribution.

```typescript
// src/lib/messaging/work-queue.ts
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

export class WorkQueue<T> {
  constructor(private name: string) {}

  async enqueue(message: T, priority: number = 0): Promise<void> {
    const envelope = {
      id: randomUUID(),
      data: message,
      priority,
      enqueuedAt: Date.now(),
    };

    // Use sorted set for priority queue
    await redis.zadd(
      `wq:${this.name}`,
      priority,
      JSON.stringify(envelope)
    );
  }

  async dequeue(): Promise<{ id: string; data: T } | null> {
    // Atomically pop the highest priority item (lowest score)
    const result = await redis.zpopmin(`wq:${this.name}`);

    if (!result || result.length === 0) return null;

    const envelope = JSON.parse(result[0]);
    return { id: envelope.id, data: envelope.data };
  }

  async size(): Promise<number> {
    return redis.zcard(`wq:${this.name}`);
  }
}

// Usage
const tokenQueue = new WorkQueue<{
  userId: string;
  tokens: number;
  provider: string;
}>('token-tracking');

await tokenQueue.enqueue({
  userId: 'user-123',
  tokens: 500,
  provider: 'vllm',
});
```

---

## 2. Pub/Sub Pattern

One-to-many: publish events that multiple consumers can process independently.

```typescript
// src/lib/messaging/pubsub.ts

interface PubSubMessage<T = unknown> {
  id: string;
  channel: string;
  data: T;
  publishedAt: number;
  publisher: string;
}

export class TypedPubSub {
  private subscriber: Redis;
  private publisher: Redis;
  private handlers = new Map<string, Set<(msg: PubSubMessage) => Promise<void>>>();

  constructor() {
    this.subscriber = new Redis(process.env.REDIS_URL!);
    this.publisher = new Redis(process.env.REDIS_URL!);

    this.subscriber.on('message', async (channel, message) => {
      const handlers = this.handlers.get(channel);
      if (!handlers) return;

      const parsed = JSON.parse(message) as PubSubMessage;

      for (const handler of handlers) {
        try {
          await handler(parsed);
        } catch (error) {
          console.error(`[PubSub] Handler error on ${channel}:`, error);
        }
      }
    });
  }

  async publish<T>(channel: string, data: T, publisher: string = 'api'): Promise<void> {
    const message: PubSubMessage<T> = {
      id: randomUUID(),
      channel,
      data,
      publishedAt: Date.now(),
      publisher,
    };

    await this.publisher.publish(channel, JSON.stringify(message));
  }

  async subscribe<T>(
    channel: string,
    handler: (msg: PubSubMessage<T>) => Promise<void>
  ): Promise<() => void> {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());
      await this.subscriber.subscribe(channel);
    }

    this.handlers.get(channel)!.add(handler as any);

    return () => {
      const handlers = this.handlers.get(channel);
      if (handlers) {
        handlers.delete(handler as any);
        if (handlers.size === 0) {
          this.handlers.delete(channel);
          this.subscriber.unsubscribe(channel);
        }
      }
    };
  }
}

export const pubsub = new TypedPubSub();

// Usage: Publish tier change event
await pubsub.publish('user.tier.changed', {
  userId: 'user-123',
  oldTier: 'STARTER',
  newTier: 'PLUS',
});

// Multiple consumers
await pubsub.subscribe('user.tier.changed', async (msg) => {
  // Consumer 1: Update agent access cache
  await invalidateAgentAccessCache(msg.data.userId);
});

await pubsub.subscribe('user.tier.changed', async (msg) => {
  // Consumer 2: Send notification
  await sendTierChangeNotification(msg.data.userId, msg.data.newTier);
});

await pubsub.subscribe('user.tier.changed', async (msg) => {
  // Consumer 3: Update analytics
  await recordTierChangeMetric(msg.data);
});
```

---

## 3. Fan-Out Pattern

Distribute one message to multiple independent queues.

```typescript
// src/lib/messaging/fan-out.ts

interface FanOutConfig {
  sourceChannel: string;
  targets: {
    queue: string;
    filter?: (data: any) => boolean;
    transform?: (data: any) => any;
  }[];
}

export class FanOutRouter {
  private configs: FanOutConfig[] = [];

  addRoute(config: FanOutConfig): void {
    this.configs.push(config);
  }

  async route(channel: string, data: unknown): Promise<number> {
    const config = this.configs.find((c) => c.sourceChannel === channel);
    if (!config) return 0;

    let dispatched = 0;

    for (const target of config.targets) {
      // Apply filter
      if (target.filter && !target.filter(data)) continue;

      // Apply transformation
      const payload = target.transform ? target.transform(data) : data;

      // Enqueue to target
      await redis.rpush(
        `queue:${target.queue}`,
        JSON.stringify({
          id: randomUUID(),
          data: payload,
          source: channel,
          enqueuedAt: Date.now(),
        })
      );

      dispatched++;
    }

    return dispatched;
  }
}

// Configure fan-out for subscription events
const subscriptionRouter = new FanOutRouter();

subscriptionRouter.addRoute({
  sourceChannel: 'subscription.created',
  targets: [
    { queue: 'email-welcome', transform: (d) => ({ to: d.email, tier: d.tier }) },
    { queue: 'analytics-events', transform: (d) => ({ event: 'new_subscription', ...d }) },
    { queue: 'agent-access-update', transform: (d) => ({ userId: d.userId, tier: d.tier }) },
    {
      queue: 'founder-alerts',
      filter: (d) => d.tier === 'PRO', // Only alert on PRO subscriptions
      transform: (d) => ({
        title: 'New PRO subscription!',
        body: `User ${d.email} upgraded to PRO`,
      }),
    },
  ],
});
```

---

## 4. Request-Reply Pattern

Synchronous request-reply over asynchronous messaging.

```typescript
// src/lib/messaging/request-reply.ts

export class RequestReplyClient {
  private pendingRequests = new Map<
    string,
    { resolve: (value: any) => void; reject: (error: any) => void; timer: NodeJS.Timeout }
  >();

  constructor(private replyChannel: string) {
    // Listen for replies
    pubsub.subscribe(this.replyChannel, async (msg) => {
      const pending = this.pendingRequests.get(msg.data.correlationId);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingRequests.delete(msg.data.correlationId);

        if (msg.data.error) {
          pending.reject(new Error(msg.data.error));
        } else {
          pending.resolve(msg.data.result);
        }
      }
    });
  }

  async request<TReq, TRes>(
    channel: string,
    data: TReq,
    timeoutMs: number = 30_000
  ): Promise<TRes> {
    const correlationId = randomUUID();

    return new Promise<TRes>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(correlationId);
        reject(new Error(`Request timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pendingRequests.set(correlationId, { resolve, reject, timer });

      pubsub.publish(channel, {
        correlationId,
        replyTo: this.replyChannel,
        data,
      });
    });
  }
}

// Server side: handle requests
class RequestReplyServer {
  async handleRequests<TReq, TRes>(
    channel: string,
    handler: (data: TReq) => Promise<TRes>
  ): Promise<void> {
    await pubsub.subscribe(channel, async (msg) => {
      const { correlationId, replyTo, data } = msg.data as any;

      try {
        const result = await handler(data);
        await pubsub.publish(replyTo, { correlationId, result });
      } catch (error: any) {
        await pubsub.publish(replyTo, {
          correlationId,
          error: error.message,
        });
      }
    });
  }
}

// Usage: request AI response through messaging
const aiClient = new RequestReplyClient('ai-replies');

const response = await aiClient.request('ai-requests', {
  agentId: 5,
  message: 'Hello',
  userId: 'user-123',
});
```

---

## 5. Idempotent Consumers

Ensure messages are processed exactly once, even with retries.

```typescript
// src/lib/messaging/idempotent.ts

export class IdempotentConsumer {
  private processingLockTTL = 30; // seconds

  async process<T>(
    messageId: string,
    handler: (data: T) => Promise<void>,
    data: T
  ): Promise<{ processed: boolean; duplicate: boolean }> {
    const processedKey = `processed:${messageId}`;
    const lockKey = `processing:${messageId}`;

    // Check if already processed
    const alreadyProcessed = await redis.exists(processedKey);
    if (alreadyProcessed) {
      return { processed: false, duplicate: true };
    }

    // Acquire processing lock (prevents concurrent processing)
    const lockAcquired = await redis.set(
      lockKey,
      '1',
      'EX',
      this.processingLockTTL,
      'NX'
    );

    if (!lockAcquired) {
      // Another consumer is processing this message
      return { processed: false, duplicate: false };
    }

    try {
      await handler(data);

      // Mark as processed (keep for 24 hours for dedup window)
      await redis.setex(processedKey, 86400, '1');

      return { processed: true, duplicate: false };
    } finally {
      // Release lock
      await redis.del(lockKey);
    }
  }
}

const idempotentConsumer = new IdempotentConsumer();

// Usage
async function handleTokenUsageMessage(msg: PubSubMessage): Promise<void> {
  await idempotentConsumer.process(
    msg.id,
    async (data) => {
      await prisma.$executeRaw`
        INSERT INTO token_usage (user_id, tokens, provider, recorded_at)
        VALUES (${data.userId}, ${data.tokens}, ${data.provider}, NOW())
      `;
    },
    msg.data
  );
}
```

---

## 6. Dead Letter Queue

```typescript
// src/lib/messaging/dead-letter.ts

export class DeadLetterQueue {
  private maxRetries: number;

  constructor(
    private queueName: string,
    maxRetries: number = 3
  ) {
    this.maxRetries = maxRetries;
  }

  async processWithDLQ<T>(
    messageId: string,
    data: T,
    handler: (data: T) => Promise<void>
  ): Promise<void> {
    const retryKey = `retry-count:${this.queueName}:${messageId}`;
    const retryCount = parseInt((await redis.get(retryKey)) ?? '0');

    try {
      await handler(data);
      // Success — clean up retry counter
      await redis.del(retryKey);
    } catch (error: any) {
      if (retryCount >= this.maxRetries) {
        // Move to dead letter queue
        await redis.rpush(
          `dlq:${this.queueName}`,
          JSON.stringify({
            messageId,
            data,
            error: error.message,
            retryCount,
            failedAt: Date.now(),
          })
        );
        await redis.del(retryKey);
        console.error(
          `[DLQ] Message ${messageId} moved to dead letter after ${retryCount} retries`
        );
      } else {
        // Increment retry counter and re-enqueue
        await redis.incr(retryKey);
        await redis.expire(retryKey, 3600);

        // Re-enqueue with delay
        const delay = Math.pow(2, retryCount) * 1000;
        setTimeout(async () => {
          await redis.rpush(
            `queue:${this.queueName}`,
            JSON.stringify({ id: messageId, data })
          );
        }, delay);
      }
    }
  }

  async getDLQSize(): Promise<number> {
    return redis.llen(`dlq:${this.queueName}`);
  }

  async peekDLQ(count: number = 10): Promise<any[]> {
    const items = await redis.lrange(`dlq:${this.queueName}`, 0, count - 1);
    return items.map((item) => JSON.parse(item));
  }

  async replayDLQ(count: number = 10): Promise<number> {
    let replayed = 0;

    for (let i = 0; i < count; i++) {
      const item = await redis.lpop(`dlq:${this.queueName}`);
      if (!item) break;

      const parsed = JSON.parse(item);
      await redis.rpush(
        `queue:${this.queueName}`,
        JSON.stringify({ id: parsed.messageId, data: parsed.data })
      );
      replayed++;
    }

    return replayed;
  }
}
```

---

## 7. PostgreSQL-Based Message Queue

For environments without Redis, PostgreSQL can serve as a message queue using `SKIP LOCKED`.

```typescript
// src/lib/messaging/pg-queue.ts

export class PgMessageQueue {
  async publish(
    channel: string,
    data: unknown,
    options?: { delay?: number; priority?: number }
  ): Promise<string> {
    const visibleAt = options?.delay
      ? new Date(Date.now() + options.delay)
      : new Date();

    const result = await prisma.$queryRaw<[{ id: string }]>`
      INSERT INTO message_queue (channel, data, priority, visible_at, status)
      VALUES (
        ${channel},
        ${JSON.stringify(data)}::jsonb,
        ${options?.priority ?? 0},
        ${visibleAt},
        'pending'
      )
      RETURNING id::text
    `;

    return result[0].id;
  }

  async consume(
    channel: string,
    handler: (id: string, data: unknown) => Promise<void>,
    batchSize: number = 5
  ): Promise<number> {
    const messages = await prisma.$queryRaw<any[]>`
      UPDATE message_queue
      SET status = 'processing',
          locked_at = NOW(),
          attempts = attempts + 1
      WHERE id IN (
        SELECT id FROM message_queue
        WHERE channel = ${channel}
          AND status = 'pending'
          AND visible_at <= NOW()
        ORDER BY priority DESC, created_at ASC
        LIMIT ${batchSize}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id::text, data
    `;

    let processed = 0;

    for (const msg of messages) {
      try {
        await handler(msg.id, msg.data);
        await prisma.$executeRaw`
          UPDATE message_queue
          SET status = 'completed', completed_at = NOW()
          WHERE id = ${msg.id}::uuid
        `;
        processed++;
      } catch (error: any) {
        const maxAttempts = 3;
        await prisma.$executeRaw`
          UPDATE message_queue
          SET
            status = CASE WHEN attempts >= ${maxAttempts} THEN 'failed' ELSE 'pending' END,
            error = ${error.message},
            locked_at = NULL,
            visible_at = NOW() + INTERVAL '1 second' * POWER(2, attempts)
          WHERE id = ${msg.id}::uuid
        `;
      }
    }

    return processed;
  }
}
```

---

## 8. Message Ordering and Partitioning

```typescript
// src/lib/messaging/ordered-queue.ts

// Ensure messages for the same entity are processed in order
export class OrderedQueue {
  async enqueue(
    partitionKey: string,
    data: unknown,
    sequence: number
  ): Promise<void> {
    const key = `oq:${partitionKey}`;

    await redis.zadd(key, sequence, JSON.stringify({
      id: randomUUID(),
      data,
      sequence,
      enqueuedAt: Date.now(),
    }));
  }

  async dequeueInOrder(partitionKey: string): Promise<any | null> {
    const key = `oq:${partitionKey}`;

    // Get the lowest sequence number (oldest message)
    const result = await redis.zpopmin(key);
    if (!result || result.length === 0) return null;

    return JSON.parse(result[0]);
  }
}

// Usage: Process user events in order
const orderedQueue = new OrderedQueue();

// Events for user-123 will be processed in sequence order
await orderedQueue.enqueue('user-123', { action: 'signup' }, 1);
await orderedQueue.enqueue('user-123', { action: 'verify_email' }, 2);
await orderedQueue.enqueue('user-123', { action: 'complete_onboarding' }, 3);
```

---

## 9. Monitoring

```typescript
// src/lib/messaging/monitoring.ts

export async function getQueueStats(): Promise<Record<string, {
  pending: number;
  processing: number;
  failed: number;
  dlqSize: number;
}>> {
  const channels = ['email', 'ai-processing', 'usage-tracking', 'webhooks'];
  const stats: Record<string, any> = {};

  for (const channel of channels) {
    const [pending, processing, failed, dlqSize] = await Promise.all([
      redis.llen(`queue:${channel}`),
      redis.scard(`processing:${channel}`),
      redis.llen(`failed:${channel}`),
      redis.llen(`dlq:${channel}`),
    ]);

    stats[channel] = { pending, processing, failed, dlqSize };
  }

  return stats;
}
```

---

## Summary

| Pattern | When to Use | Stone AI Use Case |
|---------|-------------|------------------|
| Work Queue | Task distribution | Token tracking, email sending |
| Pub/Sub | Event broadcasting | Tier changes, notifications |
| Fan-Out | Multi-consumer events | Subscription → email + analytics + access |
| Request-Reply | Async RPC | AI provider requests |
| Idempotent Consumer | Exactly-once processing | Billing events, token counting |
| Dead Letter Queue | Failed message handling | Webhook retries |
| PG Queue | No Redis available | Neon-only environments |
| Ordered Queue | Sequence-dependent events | User lifecycle events |

Messaging patterns let Stone AI handle complex event flows while keeping each component simple and independently scalable.
