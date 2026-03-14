# Event-Driven Architecture

## Palace Knowledge Seed — Advanced Backend Engineering

### Overview

Event-driven architecture (EDA) decouples components by having them communicate through events rather than direct calls. This seed covers event sourcing, CQRS, event bus design, saga orchestration, and eventual consistency patterns — all implemented in TypeScript for the Stone AI stack (Next.js 16, Prisma 7.4.2, PostgreSQL 16, Redis).

---

## 1. Core Concepts

### What Is an Event?

An event is an immutable record that something happened. Events are past-tense, factual, and carry the data needed by consumers.

```typescript
// src/lib/events/types.ts
interface DomainEvent<T = unknown> {
  id: string;
  type: string;
  aggregateId: string;
  aggregateType: string;
  version: number;
  timestamp: Date;
  data: T;
  metadata: EventMetadata;
}

interface EventMetadata {
  correlationId: string;
  causationId: string | null;
  userId: string | null;
  source: string;
  traceId: string;
}

// Concrete event types
interface UserCreatedEvent extends DomainEvent<{
  email: string;
  name: string;
  tier: 'FREE' | 'STARTER' | 'PLUS' | 'SMART' | 'PRO';
}> {
  type: 'user.created';
  aggregateType: 'User';
}

interface SubscriptionChangedEvent extends DomainEvent<{
  previousTier: string;
  newTier: string;
  stripeSubscriptionId: string;
  effectiveDate: string;
}> {
  type: 'subscription.changed';
  aggregateType: 'Subscription';
}

interface AgentMessageEvent extends DomainEvent<{
  agentId: number;
  conversationId: string;
  messageRole: 'user' | 'assistant';
  tokenCount: number;
  provider: 'vllm' | 'anthropic';
}> {
  type: 'agent.message.sent';
  aggregateType: 'Conversation';
}
```

### Why Events Matter for Stone AI

Stone AI has 44 agents, Stripe billing, Clerk auth, and dual AI providers. Events let these systems communicate without tight coupling:

- User upgrades tier → Event triggers agent access update, billing record, analytics
- Agent conversation completes → Event triggers token counting, usage tracking, cost allocation
- Clerk webhook fires → Event normalizes the external webhook into an internal domain event

---

## 2. Event Bus Implementation

### In-Process Event Bus

For a Next.js serverless environment, an in-process event bus handles synchronous event dispatch within a single request lifecycle.

```typescript
// src/lib/events/event-bus.ts
import { randomUUID } from 'crypto';

type EventHandler<T = unknown> = (event: DomainEvent<T>) => Promise<void>;

class EventBus {
  private handlers = new Map<string, EventHandler[]>();
  private middlewares: EventMiddleware[] = [];

  on<T>(eventType: string, handler: EventHandler<T>): () => void {
    const existing = this.handlers.get(eventType) || [];
    existing.push(handler as EventHandler);
    this.handlers.set(eventType, existing);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(eventType) || [];
      const index = handlers.indexOf(handler as EventHandler);
      if (index > -1) handlers.splice(index, 1);
    };
  }

  use(middleware: EventMiddleware): void {
    this.middlewares.push(middleware);
  }

  async emit<T>(event: DomainEvent<T>): Promise<void> {
    // Run middlewares
    for (const mw of this.middlewares) {
      await mw(event);
    }

    const handlers = this.handlers.get(event.type) || [];
    const wildcardHandlers = this.handlers.get('*') || [];
    const allHandlers = [...handlers, ...wildcardHandlers];

    if (allHandlers.length === 0) {
      console.warn(`[EventBus] No handlers for event type: ${event.type}`);
      return;
    }

    // Execute all handlers concurrently
    const results = await Promise.allSettled(
      allHandlers.map((handler) => handler(event))
    );

    // Log failures but don't throw — event bus should be resilient
    for (const result of results) {
      if (result.status === 'rejected') {
        console.error(
          `[EventBus] Handler failed for ${event.type}:`,
          result.reason
        );
      }
    }
  }

  async emitSequential<T>(event: DomainEvent<T>): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];
    for (const handler of handlers) {
      await handler(event); // Throws on first failure — intentional
    }
  }
}

type EventMiddleware = (event: DomainEvent) => Promise<void>;

// Singleton for the application
export const eventBus = new EventBus();
```

### Event Factory

```typescript
// src/lib/events/factory.ts
import { randomUUID } from 'crypto';

export function createEvent<T>(
  type: string,
  aggregateType: string,
  aggregateId: string,
  data: T,
  options?: {
    correlationId?: string;
    causationId?: string;
    userId?: string;
    source?: string;
    version?: number;
  }
): DomainEvent<T> {
  return {
    id: randomUUID(),
    type,
    aggregateId,
    aggregateType,
    version: options?.version ?? 1,
    timestamp: new Date(),
    data,
    metadata: {
      correlationId: options?.correlationId ?? randomUUID(),
      causationId: options?.causationId ?? null,
      userId: options?.userId ?? null,
      source: options?.source ?? 'stone-ai-api',
      traceId: randomUUID(),
    },
  };
}

// Usage
const event = createEvent(
  'subscription.changed',
  'Subscription',
  subscriptionId,
  {
    previousTier: 'STARTER',
    newTier: 'PLUS',
    stripeSubscriptionId: 'sub_xxx',
    effectiveDate: new Date().toISOString(),
  },
  { userId: clerkUserId, correlationId: requestCorrelationId }
);
```

### Redis-Backed Event Bus (Distributed)

For events that need to cross process boundaries (multiple Vercel function invocations), use Redis Streams.

```typescript
// src/lib/events/redis-event-bus.ts
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

export class RedisEventBus {
  private consumerGroup: string;
  private consumerId: string;

  constructor(consumerGroup: string) {
    this.consumerGroup = consumerGroup;
    this.consumerId = `consumer-${randomUUID().slice(0, 8)}`;
  }

  async publish(event: DomainEvent): Promise<string> {
    const streamKey = `events:${event.aggregateType.toLowerCase()}`;

    // XADD to the stream
    const messageId = await redis.xadd(
      streamKey,
      '*',
      'event', JSON.stringify(event),
      'type', event.type,
      'aggregateId', event.aggregateId,
      'timestamp', event.timestamp.toISOString()
    );

    return messageId;
  }

  async subscribe(
    aggregateType: string,
    handler: (event: DomainEvent) => Promise<void>
  ): Promise<void> {
    const streamKey = `events:${aggregateType.toLowerCase()}`;

    // Create consumer group if it doesn't exist
    try {
      await redis.xgroup('CREATE', streamKey, this.consumerGroup, '0', 'MKSTREAM');
    } catch (err: any) {
      if (!err.message.includes('BUSYGROUP')) throw err;
    }

    // Read loop
    while (true) {
      const results = await redis.xreadgroup(
        'GROUP', this.consumerGroup, this.consumerId,
        'COUNT', 10,
        'BLOCK', 5000,
        'STREAMS', streamKey, '>'
      );

      if (!results) continue;

      for (const [, messages] of results) {
        for (const [messageId, fields] of messages) {
          const eventData = fields[1]; // 'event' field value
          const event = JSON.parse(eventData) as DomainEvent;

          try {
            await handler(event);
            await redis.xack(streamKey, this.consumerGroup, messageId);
          } catch (error) {
            console.error(`Failed to process event ${messageId}:`, error);
            // Message stays in pending — will be reclaimed later
          }
        }
      }
    }
  }

  // Reclaim pending messages that haven't been acknowledged
  async reclaimStale(
    aggregateType: string,
    maxIdleMs: number = 60_000
  ): Promise<DomainEvent[]> {
    const streamKey = `events:${aggregateType.toLowerCase()}`;

    const pending = await redis.xpending(
      streamKey,
      this.consumerGroup,
      '-', '+', 100
    );

    const staleEvents: DomainEvent[] = [];

    for (const [messageId, , idleTime] of pending) {
      if (Number(idleTime) > maxIdleMs) {
        const claimed = await redis.xclaim(
          streamKey,
          this.consumerGroup,
          this.consumerId,
          maxIdleMs,
          messageId
        );

        for (const [, fields] of claimed) {
          staleEvents.push(JSON.parse(fields[1]));
        }
      }
    }

    return staleEvents;
  }
}
```

---

## 3. Event Sourcing

### Core Concept

Instead of storing current state, store the sequence of events that led to that state. The current state is derived by replaying events.

### Event Store with PostgreSQL

```sql
-- prisma/migrations/event_store.sql
CREATE TABLE event_store (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_id UUID NOT NULL,
  aggregate_type VARCHAR(100) NOT NULL,
  event_type VARCHAR(200) NOT NULL,
  version INTEGER NOT NULL,
  data JSONB NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_aggregate_version
    UNIQUE (aggregate_id, version)
);

CREATE INDEX idx_event_store_aggregate
  ON event_store (aggregate_id, version ASC);

CREATE INDEX idx_event_store_type
  ON event_store (event_type, created_at DESC);

CREATE INDEX idx_event_store_correlation
  ON event_store ((metadata->>'correlationId'));
```

```typescript
// src/lib/events/event-store.ts
import { prisma } from '@/lib/prisma';

export class EventStore {
  async append(
    aggregateId: string,
    events: DomainEvent[],
    expectedVersion: number
  ): Promise<void> {
    // Optimistic concurrency control
    await prisma.$transaction(async (tx) => {
      // Check current version
      const latest = await tx.$queryRaw<[{ max_version: number }]>`
        SELECT COALESCE(MAX(version), 0) as max_version
        FROM event_store
        WHERE aggregate_id = ${aggregateId}::uuid
        FOR UPDATE
      `;

      const currentVersion = latest[0].max_version;

      if (currentVersion !== expectedVersion) {
        throw new ConcurrencyError(
          `Expected version ${expectedVersion}, got ${currentVersion}` +
          ` for aggregate ${aggregateId}`
        );
      }

      // Append events with incrementing versions
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        const version = expectedVersion + i + 1;

        await tx.$executeRaw`
          INSERT INTO event_store (
            aggregate_id, aggregate_type, event_type,
            version, data, metadata
          ) VALUES (
            ${aggregateId}::uuid,
            ${event.aggregateType},
            ${event.type},
            ${version},
            ${JSON.stringify(event.data)}::jsonb,
            ${JSON.stringify(event.metadata)}::jsonb
          )
        `;
      }
    });
  }

  async getEvents(
    aggregateId: string,
    fromVersion: number = 0
  ): Promise<DomainEvent[]> {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT * FROM event_store
      WHERE aggregate_id = ${aggregateId}::uuid
        AND version > ${fromVersion}
      ORDER BY version ASC
    `;

    return rows.map((row) => ({
      id: row.id,
      type: row.event_type,
      aggregateId: row.aggregate_id,
      aggregateType: row.aggregate_type,
      version: row.version,
      timestamp: row.created_at,
      data: row.data,
      metadata: row.metadata,
    }));
  }

  async getEventsByType(
    eventType: string,
    since?: Date,
    limit: number = 100
  ): Promise<DomainEvent[]> {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT * FROM event_store
      WHERE event_type = ${eventType}
        AND (${since}::timestamptz IS NULL OR created_at > ${since})
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return rows.map(mapRowToEvent);
  }
}

class ConcurrencyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConcurrencyError';
  }
}
```

### Aggregate Root Pattern

```typescript
// src/lib/events/aggregate.ts
export abstract class AggregateRoot {
  private uncommittedEvents: DomainEvent[] = [];
  protected version: number = 0;

  get id(): string {
    return this._id;
  }

  constructor(private _id: string) {}

  protected apply(event: DomainEvent): void {
    this.when(event);
    this.version++;
    this.uncommittedEvents.push({ ...event, version: this.version });
  }

  protected abstract when(event: DomainEvent): void;

  getUncommittedEvents(): DomainEvent[] {
    return [...this.uncommittedEvents];
  }

  clearUncommittedEvents(): void {
    this.uncommittedEvents = [];
  }

  loadFromHistory(events: DomainEvent[]): void {
    for (const event of events) {
      this.when(event);
      this.version = event.version;
    }
  }
}

// Concrete aggregate
class ConversationAggregate extends AggregateRoot {
  private messages: { role: string; tokenCount: number }[] = [];
  private totalTokens: number = 0;
  private agentId: number = 0;
  private status: 'active' | 'archived' = 'active';

  static create(
    id: string,
    agentId: number,
    userId: string
  ): ConversationAggregate {
    const conversation = new ConversationAggregate(id);
    conversation.apply(
      createEvent('conversation.started', 'Conversation', id, {
        agentId,
        userId,
        startedAt: new Date().toISOString(),
      })
    );
    return conversation;
  }

  addMessage(role: string, tokenCount: number, provider: string): void {
    if (this.status === 'archived') {
      throw new Error('Cannot add messages to archived conversation');
    }

    this.apply(
      createEvent('conversation.message.added', 'Conversation', this.id, {
        role,
        tokenCount,
        provider,
        messageIndex: this.messages.length,
      })
    );
  }

  archive(): void {
    this.apply(
      createEvent('conversation.archived', 'Conversation', this.id, {
        totalTokens: this.totalTokens,
        messageCount: this.messages.length,
      })
    );
  }

  protected when(event: DomainEvent): void {
    switch (event.type) {
      case 'conversation.started':
        this.agentId = (event.data as any).agentId;
        break;
      case 'conversation.message.added':
        const data = event.data as any;
        this.messages.push({ role: data.role, tokenCount: data.tokenCount });
        this.totalTokens += data.tokenCount;
        break;
      case 'conversation.archived':
        this.status = 'archived';
        break;
    }
  }
}
```

### Repository Pattern for Event-Sourced Aggregates

```typescript
// src/lib/events/repository.ts
export class EventSourcedRepository<T extends AggregateRoot> {
  constructor(
    private eventStore: EventStore,
    private factory: (id: string) => T
  ) {}

  async load(aggregateId: string): Promise<T> {
    const events = await this.eventStore.getEvents(aggregateId);

    if (events.length === 0) {
      throw new Error(`Aggregate ${aggregateId} not found`);
    }

    const aggregate = this.factory(aggregateId);
    aggregate.loadFromHistory(events);
    return aggregate;
  }

  async save(aggregate: T): Promise<void> {
    const events = aggregate.getUncommittedEvents();

    if (events.length === 0) return;

    const expectedVersion = (aggregate as any).version - events.length;

    await this.eventStore.append(aggregate.id, events, expectedVersion);

    // Publish events after successful persistence
    for (const event of events) {
      await eventBus.emit(event);
    }

    aggregate.clearUncommittedEvents();
  }
}

// Usage
const conversationRepo = new EventSourcedRepository<ConversationAggregate>(
  new EventStore(),
  (id) => new ConversationAggregate(id)
);

// In an API route
const conversation = ConversationAggregate.create(
  randomUUID(),
  agentId,
  userId
);
conversation.addMessage('user', 150, 'vllm');
conversation.addMessage('assistant', 450, 'vllm');
await conversationRepo.save(conversation);
```

---

## 4. CQRS (Command Query Responsibility Segregation)

### Concept

Separate the write model (commands/events) from the read model (queries/projections). Writes go through aggregates and events. Reads come from optimized projections.

### Command Side

```typescript
// src/lib/cqrs/commands.ts
interface Command {
  type: string;
  payload: unknown;
  metadata: {
    userId: string;
    correlationId: string;
    timestamp: Date;
  };
}

type CommandHandler<T extends Command> = (command: T) => Promise<void>;

class CommandBus {
  private handlers = new Map<string, CommandHandler<any>>();

  register<T extends Command>(
    commandType: string,
    handler: CommandHandler<T>
  ): void {
    if (this.handlers.has(commandType)) {
      throw new Error(`Handler already registered for ${commandType}`);
    }
    this.handlers.set(commandType, handler);
  }

  async dispatch<T extends Command>(command: T): Promise<void> {
    const handler = this.handlers.get(command.type);
    if (!handler) {
      throw new Error(`No handler for command: ${command.type}`);
    }
    await handler(command);
  }
}

export const commandBus = new CommandBus();

// Register handlers
commandBus.register('UpgradeTier', async (command) => {
  const { userId, newTier, stripeSubscriptionId } = command.payload as any;

  // Load aggregate
  const subscription = await subscriptionRepo.load(userId);

  // Execute business logic
  subscription.upgradeTier(newTier, stripeSubscriptionId);

  // Persist events
  await subscriptionRepo.save(subscription);
});
```

### Query Side — Projections

```typescript
// src/lib/cqrs/projections.ts

// Projections listen to events and update read-optimized views
class UserDashboardProjection {
  constructor() {
    eventBus.on('subscription.changed', this.onSubscriptionChanged.bind(this));
    eventBus.on('agent.message.sent', this.onAgentMessage.bind(this));
    eventBus.on('user.created', this.onUserCreated.bind(this));
  }

  private async onUserCreated(event: DomainEvent): Promise<void> {
    const data = event.data as any;
    await prisma.userDashboardView.create({
      data: {
        userId: event.aggregateId,
        email: data.email,
        name: data.name,
        currentTier: data.tier,
        totalMessages: 0,
        totalTokensUsed: 0,
        agentsAccessed: [],
        lastActiveAt: event.timestamp,
      },
    });
  }

  private async onSubscriptionChanged(event: DomainEvent): Promise<void> {
    const data = event.data as any;
    await prisma.userDashboardView.update({
      where: { userId: event.aggregateId },
      data: {
        currentTier: data.newTier,
        tierChangedAt: new Date(data.effectiveDate),
      },
    });
  }

  private async onAgentMessage(event: DomainEvent): Promise<void> {
    const data = event.data as any;
    await prisma.$executeRaw`
      UPDATE user_dashboard_view
      SET total_messages = total_messages + 1,
          total_tokens_used = total_tokens_used + ${data.tokenCount},
          agents_accessed = array_append(
            CASE WHEN ${data.agentId} = ANY(agents_accessed)
              THEN agents_accessed
              ELSE agents_accessed
            END,
            ${data.agentId}
          ),
          last_active_at = NOW()
      WHERE user_id = ${event.metadata.userId}
    `;
  }
}

// Query service reads from projections
class UserDashboardQueryService {
  async getUserDashboard(userId: string) {
    const view = await prisma.userDashboardView.findUnique({
      where: { userId },
    });

    if (!view) throw new NotFoundError('User dashboard not found');

    return {
      user: {
        name: view.name,
        email: view.email,
        tier: view.currentTier,
        memberSince: view.createdAt,
      },
      usage: {
        totalMessages: view.totalMessages,
        totalTokens: view.totalTokensUsed,
        uniqueAgentsUsed: view.agentsAccessed.length,
      },
      activity: {
        lastActive: view.lastActiveAt,
        tierChangedAt: view.tierChangedAt,
      },
    };
  }
}
```

---

## 5. Saga Pattern (Process Managers)

### Concept

Sagas coordinate long-running business processes that span multiple aggregates or services. They listen for events and issue commands.

### Subscription Upgrade Saga

```typescript
// src/lib/sagas/subscription-upgrade-saga.ts

interface SagaState {
  id: string;
  status: 'started' | 'processing' | 'completed' | 'compensating' | 'failed';
  steps: SagaStep[];
  currentStep: number;
  data: Record<string, unknown>;
}

interface SagaStep {
  name: string;
  status: 'pending' | 'completed' | 'failed' | 'compensated';
  executedAt?: Date;
  error?: string;
}

class SubscriptionUpgradeSaga {
  private state: SagaState;

  constructor(
    private sagaId: string,
    private userId: string,
    private newTier: string,
    private stripeSubscriptionId: string
  ) {
    this.state = {
      id: sagaId,
      status: 'started',
      steps: [
        { name: 'validateTierChange', status: 'pending' },
        { name: 'updateStripeSubscription', status: 'pending' },
        { name: 'updateUserTier', status: 'pending' },
        { name: 'updateAgentAccess', status: 'pending' },
        { name: 'sendConfirmation', status: 'pending' },
      ],
      currentStep: 0,
      data: {},
    };
  }

  async execute(): Promise<SagaState> {
    this.state.status = 'processing';

    try {
      // Step 1: Validate
      await this.step('validateTierChange', async () => {
        const user = await prisma.user.findUnique({
          where: { clerkId: this.userId },
          select: { tier: true },
        });

        if (!user) throw new Error('User not found');
        if (user.tier === this.newTier) {
          throw new Error('Already on this tier');
        }

        this.state.data.previousTier = user.tier;
      });

      // Step 2: Update Stripe
      await this.step('updateStripeSubscription', async () => {
        // Stripe API call would go here
        // For now, simulate
        this.state.data.stripeConfirmation = `conf_${Date.now()}`;
      });

      // Step 3: Update user tier in DB
      await this.step('updateUserTier', async () => {
        await prisma.user.update({
          where: { clerkId: this.userId },
          data: { tier: this.newTier },
        });
      });

      // Step 4: Update agent access
      await this.step('updateAgentAccess', async () => {
        const agentLimit = getTierAgentLimit(this.newTier);
        await eventBus.emit(
          createEvent('agent.access.updated', 'User', this.userId, {
            tier: this.newTier,
            agentLimit,
          })
        );
      });

      // Step 5: Send confirmation
      await this.step('sendConfirmation', async () => {
        await eventBus.emit(
          createEvent('notification.send', 'User', this.userId, {
            type: 'subscription_upgraded',
            tier: this.newTier,
            previousTier: this.state.data.previousTier,
          })
        );
      });

      this.state.status = 'completed';
    } catch (error) {
      this.state.status = 'compensating';
      await this.compensate();
    }

    // Persist saga state
    await this.persistState();

    return this.state;
  }

  private async step(
    name: string,
    fn: () => Promise<void>
  ): Promise<void> {
    const stepIndex = this.state.steps.findIndex((s) => s.name === name);
    try {
      await fn();
      this.state.steps[stepIndex].status = 'completed';
      this.state.steps[stepIndex].executedAt = new Date();
      this.state.currentStep = stepIndex + 1;
    } catch (error: any) {
      this.state.steps[stepIndex].status = 'failed';
      this.state.steps[stepIndex].error = error.message;
      throw error;
    }
  }

  private async compensate(): Promise<void> {
    // Walk backwards through completed steps and undo them
    for (let i = this.state.currentStep - 1; i >= 0; i--) {
      const step = this.state.steps[i];
      if (step.status !== 'completed') continue;

      try {
        switch (step.name) {
          case 'updateUserTier':
            await prisma.user.update({
              where: { clerkId: this.userId },
              data: { tier: this.state.data.previousTier as string },
            });
            break;

          case 'updateStripeSubscription':
            // Revert Stripe subscription
            break;

          case 'updateAgentAccess':
            const prevLimit = getTierAgentLimit(
              this.state.data.previousTier as string
            );
            await eventBus.emit(
              createEvent('agent.access.updated', 'User', this.userId, {
                tier: this.state.data.previousTier,
                agentLimit: prevLimit,
              })
            );
            break;
        }

        step.status = 'compensated';
      } catch (compensationError) {
        // Compensation failed — log and alert
        console.error(
          `CRITICAL: Saga ${this.state.id} compensation failed at step ${step.name}`,
          compensationError
        );
        this.state.status = 'failed';
        // Emit critical alert for manual intervention
        await eventBus.emit(
          createEvent('saga.compensation.failed', 'Saga', this.state.id, {
            stepName: step.name,
            error: String(compensationError),
          })
        );
        return;
      }
    }
  }

  private async persistState(): Promise<void> {
    await prisma.$executeRaw`
      INSERT INTO saga_state (id, type, state, created_at, updated_at)
      VALUES (
        ${this.state.id}::uuid,
        'SubscriptionUpgrade',
        ${JSON.stringify(this.state)}::jsonb,
        NOW(), NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        state = EXCLUDED.state,
        updated_at = NOW()
    `;
  }
}

function getTierAgentLimit(tier: string): number {
  const limits: Record<string, number> = {
    FREE: 4,
    STARTER: 16,
    PLUS: 30,
    SMART: 39,
    PRO: 42,
  };
  return limits[tier] ?? 4;
}
```

---

## 6. Eventual Consistency

### Handling Read-After-Write

In an event-sourced system, projections may lag behind writes. Handle this gracefully.

```typescript
// src/lib/events/consistency.ts

// Strategy 1: Causal consistency — include version in response
interface WriteResponse<T> {
  data: T;
  version: number; // Client can pass this back to ensure read consistency
}

// Strategy 2: Poll until projection catches up
async function waitForProjection(
  aggregateId: string,
  expectedVersion: number,
  maxWaitMs: number = 5000
): Promise<boolean> {
  const startTime = Date.now();
  const pollInterval = 100;

  while (Date.now() - startTime < maxWaitMs) {
    const projection = await prisma.userDashboardView.findUnique({
      where: { userId: aggregateId },
      select: { projectionVersion: true },
    });

    if (projection && projection.projectionVersion >= expectedVersion) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  return false; // Timed out — serve stale data with warning
}

// Strategy 3: Synchronous projection for critical reads
async function handleSubscriptionChange(event: DomainEvent): Promise<void> {
  // Synchronous: runs in the same transaction context
  await prisma.$transaction([
    prisma.user.update({
      where: { clerkId: event.aggregateId },
      data: { tier: (event.data as any).newTier },
    }),
    prisma.userDashboardView.update({
      where: { userId: event.aggregateId },
      data: {
        currentTier: (event.data as any).newTier,
        projectionVersion: event.version,
      },
    }),
  ]);
}
```

### Idempotent Event Handlers

```typescript
// src/lib/events/idempotency.ts

async function idempotentHandler(
  eventId: string,
  handlerName: string,
  handler: () => Promise<void>
): Promise<void> {
  // Check if already processed
  const existing = await prisma.$queryRaw<any[]>`
    SELECT 1 FROM processed_events
    WHERE event_id = ${eventId}::uuid
      AND handler_name = ${handlerName}
    LIMIT 1
  `;

  if (existing.length > 0) {
    console.log(`Event ${eventId} already processed by ${handlerName}`);
    return;
  }

  // Process and mark as done atomically
  await prisma.$transaction(async (tx) => {
    await handler();

    await tx.$executeRaw`
      INSERT INTO processed_events (event_id, handler_name, processed_at)
      VALUES (${eventId}::uuid, ${handlerName}, NOW())
      ON CONFLICT DO NOTHING
    `;
  });
}

// Usage
eventBus.on('subscription.changed', async (event) => {
  await idempotentHandler(event.id, 'updateDashboard', async () => {
    await prisma.userDashboardView.update({
      where: { userId: event.aggregateId },
      data: { currentTier: (event.data as any).newTier },
    });
  });
});
```

---

## 7. Event-Driven Patterns for Next.js API Routes

### Webhook-to-Event Bridge

```typescript
// src/app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix';
import { eventBus, createEvent } from '@/lib/events';

export async function POST(req: Request) {
  const payload = await req.text();
  const headers = Object.fromEntries(req.headers.entries());

  // Verify webhook signature
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  let evt: any;

  try {
    evt = wh.verify(payload, {
      'svix-id': headers['svix-id'],
      'svix-timestamp': headers['svix-timestamp'],
      'svix-signature': headers['svix-signature'],
    });
  } catch {
    return new Response('Invalid signature', { status: 401 });
  }

  // Bridge: external webhook → internal domain event
  const eventMap: Record<string, string> = {
    'user.created': 'user.created',
    'user.updated': 'user.profile.updated',
    'user.deleted': 'user.deleted',
    'session.created': 'user.session.started',
  };

  const internalEventType = eventMap[evt.type];
  if (!internalEventType) {
    return new Response('Unhandled event type', { status: 200 });
  }

  const domainEvent = createEvent(
    internalEventType,
    'User',
    evt.data.id,
    evt.data,
    { source: 'clerk-webhook' }
  );

  await eventBus.emit(domainEvent);

  return new Response('OK', { status: 200 });
}
```

### Event-Driven API Response

```typescript
// src/app/api/conversations/[id]/messages/route.ts
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;
  const { message, agentId } = await req.json();

  const correlationId = randomUUID();

  // Emit event for the user message
  await eventBus.emit(
    createEvent('agent.message.sent', 'Conversation', conversationId, {
      agentId,
      conversationId,
      messageRole: 'user',
      tokenCount: estimateTokens(message),
      provider: 'none',
    }, { correlationId, userId: auth().userId! })
  );

  // Process AI response...
  const aiResponse = await getAgentResponse(agentId, message);

  // Emit event for the assistant message
  await eventBus.emit(
    createEvent('agent.message.sent', 'Conversation', conversationId, {
      agentId,
      conversationId,
      messageRole: 'assistant',
      tokenCount: aiResponse.tokenCount,
      provider: aiResponse.provider,
    }, { correlationId, userId: auth().userId! })
  );

  return Response.json({
    message: aiResponse.content,
    meta: { correlationId },
  });
}
```

---

## 8. Snapshots for Performance

```typescript
// src/lib/events/snapshots.ts

interface Snapshot<T> {
  aggregateId: string;
  version: number;
  state: T;
  createdAt: Date;
}

class SnapshotStore {
  async save<T>(
    aggregateId: string,
    version: number,
    state: T
  ): Promise<void> {
    await prisma.$executeRaw`
      INSERT INTO event_snapshots (aggregate_id, version, state, created_at)
      VALUES (${aggregateId}::uuid, ${version}, ${JSON.stringify(state)}::jsonb, NOW())
      ON CONFLICT (aggregate_id) DO UPDATE SET
        version = EXCLUDED.version,
        state = EXCLUDED.state,
        created_at = NOW()
    `;
  }

  async load<T>(aggregateId: string): Promise<Snapshot<T> | null> {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT * FROM event_snapshots
      WHERE aggregate_id = ${aggregateId}::uuid
      LIMIT 1
    `;

    if (rows.length === 0) return null;

    return {
      aggregateId: rows[0].aggregate_id,
      version: rows[0].version,
      state: rows[0].state as T,
      createdAt: rows[0].created_at,
    };
  }
}

// Repository with snapshot support
class SnapshotAwareRepository<T extends AggregateRoot> {
  private snapshotInterval = 50; // Snapshot every 50 events

  constructor(
    private eventStore: EventStore,
    private snapshotStore: SnapshotStore,
    private factory: (id: string) => T,
    private stateExtractor: (aggregate: T) => unknown
  ) {}

  async load(aggregateId: string): Promise<T> {
    const snapshot = await this.snapshotStore.load(aggregateId);
    const aggregate = this.factory(aggregateId);

    let fromVersion = 0;

    if (snapshot) {
      // Restore from snapshot
      (aggregate as any).restoreFromSnapshot(snapshot.state, snapshot.version);
      fromVersion = snapshot.version;
    }

    // Replay events after snapshot
    const events = await this.eventStore.getEvents(aggregateId, fromVersion);
    aggregate.loadFromHistory(events);

    return aggregate;
  }

  async save(aggregate: T): Promise<void> {
    const events = aggregate.getUncommittedEvents();
    if (events.length === 0) return;

    const expectedVersion = (aggregate as any).version - events.length;
    await this.eventStore.append(aggregate.id, events, expectedVersion);

    // Check if snapshot is needed
    if ((aggregate as any).version % this.snapshotInterval === 0) {
      const state = this.stateExtractor(aggregate);
      await this.snapshotStore.save(
        aggregate.id,
        (aggregate as any).version,
        state
      );
    }

    for (const event of events) {
      await eventBus.emit(event);
    }

    aggregate.clearUncommittedEvents();
  }
}
```

---

## 9. Testing Event-Driven Systems

```typescript
// __tests__/events/subscription-saga.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

class TestEventBus {
  public emittedEvents: DomainEvent[] = [];
  private handlers = new Map<string, EventHandler[]>();

  async emit(event: DomainEvent): Promise<void> {
    this.emittedEvents.push(event);
    const handlers = this.handlers.get(event.type) || [];
    for (const handler of handlers) {
      await handler(event);
    }
  }

  on(type: string, handler: EventHandler): void {
    const existing = this.handlers.get(type) || [];
    existing.push(handler);
    this.handlers.set(type, existing);
  }

  getEventsOfType(type: string): DomainEvent[] {
    return this.emittedEvents.filter((e) => e.type === type);
  }

  reset(): void {
    this.emittedEvents = [];
  }
}

describe('ConversationAggregate', () => {
  it('should produce correct events on message', () => {
    const conversation = ConversationAggregate.create(
      'conv-1',
      1,
      'user-1'
    );

    conversation.addMessage('user', 100, 'vllm');
    conversation.addMessage('assistant', 300, 'vllm');

    const events = conversation.getUncommittedEvents();

    expect(events).toHaveLength(3);
    expect(events[0].type).toBe('conversation.started');
    expect(events[1].type).toBe('conversation.message.added');
    expect(events[2].type).toBe('conversation.message.added');
    expect((events[2].data as any).tokenCount).toBe(300);
  });

  it('should reject messages on archived conversation', () => {
    const conversation = ConversationAggregate.create(
      'conv-2',
      1,
      'user-1'
    );
    conversation.archive();

    expect(() =>
      conversation.addMessage('user', 100, 'vllm')
    ).toThrow('Cannot add messages to archived conversation');
  });
});

describe('Subscription Upgrade Saga', () => {
  let testBus: TestEventBus;

  beforeEach(() => {
    testBus = new TestEventBus();
  });

  it('should emit agent access event on successful upgrade', async () => {
    const saga = new SubscriptionUpgradeSaga(
      'saga-1',
      'user-1',
      'PLUS',
      'sub_xxx'
    );

    const result = await saga.execute();

    expect(result.status).toBe('completed');
    expect(result.steps.every((s) => s.status === 'completed')).toBe(true);
  });
});
```

---

## 10. Production Considerations

### Event Schema Evolution

```typescript
// Version events for backward compatibility
interface EventV1 {
  type: 'user.created';
  version: 1;
  data: { email: string; name: string };
}

interface EventV2 {
  type: 'user.created';
  version: 2;
  data: { email: string; name: string; tier: string; source: string };
}

// Upcaster transforms old events to new format
function upcastUserCreated(event: DomainEvent): DomainEvent {
  if (event.version === 1) {
    return {
      ...event,
      version: 2,
      data: {
        ...(event.data as any),
        tier: 'FREE', // Default for v1 events
        source: 'unknown',
      },
    };
  }
  return event;
}
```

### Dead Letter Queue for Failed Events

```typescript
// src/lib/events/dead-letter.ts
async function moveToDeadLetter(
  event: DomainEvent,
  error: Error,
  handlerName: string
): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO dead_letter_events (
      event_id, event_type, event_data, handler_name,
      error_message, error_stack, failed_at, retry_count
    ) VALUES (
      ${event.id}::uuid, ${event.type},
      ${JSON.stringify(event)}::jsonb, ${handlerName},
      ${error.message}, ${error.stack ?? ''}, NOW(), 0
    )
  `;
}

// Retry dead letters
async function retryDeadLetters(
  maxRetries: number = 3
): Promise<{ processed: number; failed: number }> {
  const deadLetters = await prisma.$queryRaw<any[]>`
    SELECT * FROM dead_letter_events
    WHERE retry_count < ${maxRetries}
    ORDER BY failed_at ASC
    LIMIT 50
  `;

  let processed = 0;
  let failed = 0;

  for (const dl of deadLetters) {
    try {
      const event = dl.event_data as DomainEvent;
      await eventBus.emit(event);

      await prisma.$executeRaw`
        DELETE FROM dead_letter_events WHERE id = ${dl.id}::uuid
      `;
      processed++;
    } catch (error) {
      await prisma.$executeRaw`
        UPDATE dead_letter_events
        SET retry_count = retry_count + 1,
            last_retry_at = NOW()
        WHERE id = ${dl.id}::uuid
      `;
      failed++;
    }
  }

  return { processed, failed };
}
```

---

## Summary

| Pattern | When to Use | Stone AI Application |
|---------|-------------|---------------------|
| Event Bus (in-process) | Single request lifecycle | API routes, webhook handlers |
| Event Bus (Redis Streams) | Cross-process communication | Background workers, scheduled tasks |
| Event Sourcing | Audit trail, temporal queries | Conversation history, billing events |
| CQRS | Read/write performance mismatch | Dashboard views, analytics |
| Sagas | Multi-step business processes | Subscription upgrades, onboarding |
| Snapshots | Long event streams | High-activity conversations |
| Dead Letter Queue | Fault tolerance | Failed webhook processing |

Event-driven architecture enables Stone AI to scale its 44-agent system while maintaining clean separation of concerns and reliable state management.
