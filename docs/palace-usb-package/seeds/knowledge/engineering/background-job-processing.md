# Background Job Processing

## Palace Knowledge Seed — Advanced Backend Engineering

### Overview

Background job processing handles work that is too slow, unreliable, or resource-intensive to run inline with an HTTP request. This seed covers job queues with BullMQ/Redis, scheduled tasks, retry strategies, dead letter queues, job prioritization, and patterns specific to the Stone AI stack (Next.js 16, Vercel, Redis, PostgreSQL).

---

## 1. Why Background Jobs?

In Stone AI, several operations should not block API responses:

- **AI token counting and cost allocation** — Aggregate usage after conversations
- **Email notifications** — Subscription confirmations, alerts via Three-Headed Monster alert system
- **Webhook delivery retries** — External integrations that fail
- **Report generation** — Usage analytics, admin reports
- **Image processing** — Avatar resizing, backdrop optimization
- **Stripe reconciliation** — Sync billing state with database
- **Scheduled tasks** — Monthly Chaos Toys List, subscription renewal checks

---

## 2. BullMQ Setup

### Installation and Configuration

```typescript
// src/lib/queue/connection.ts
import { Queue, Worker, QueueScheduler } from 'bullmq';
import IORedis from 'ioredis';

// Shared Redis connection for all queues
const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
  retryStrategy(times: number) {
    return Math.min(times * 50, 2000);
  },
});

// Connection for subscribers (separate from publishers per Redis best practice)
const subscriberConnection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export { connection, subscriberConnection };
```

### Queue Definitions

```typescript
// src/lib/queue/queues.ts
import { Queue, QueueEvents } from 'bullmq';
import { connection } from './connection';

// Define all application queues
export const emailQueue = new Queue('email', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { age: 24 * 3600, count: 1000 },
    removeOnFail: { age: 7 * 24 * 3600, count: 5000 },
  },
});

export const aiProcessingQueue = new Queue('ai-processing', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 5000 },
    removeOnComplete: { age: 3600 },
    removeOnFail: { age: 48 * 3600 },
  },
});

export const usageTrackingQueue = new Queue('usage-tracking', {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { age: 3600 },
  },
});

export const webhookQueue = new Queue('webhooks', {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: { age: 12 * 3600 },
    removeOnFail: { age: 30 * 24 * 3600 },
  },
});

export const scheduledQueue = new Queue('scheduled', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
});

// Queue events for monitoring
export const emailQueueEvents = new QueueEvents('email', { connection });
export const aiQueueEvents = new QueueEvents('ai-processing', { connection });
```

---

## 3. Job Types and Producers

### Type-Safe Job Definitions

```typescript
// src/lib/queue/job-types.ts

// Email jobs
interface SendEmailJob {
  type: 'send-email';
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
}

interface FounderAlertJob {
  type: 'founder-alert';
  alertType: string;
  title: string;
  body: string;
  source: 'stone' | 'cardinal' | 'chaos' | 'wiz';
}

// AI processing jobs
interface TokenCountJob {
  type: 'token-count';
  conversationId: string;
  userId: string;
  agentId: number;
  provider: 'vllm' | 'anthropic';
  inputTokens: number;
  outputTokens: number;
}

interface EmbeddingGenerationJob {
  type: 'embedding-generation';
  contentId: string;
  contentType: 'forum-post' | 'help-article' | 'agent-prompt';
  text: string;
}

// Usage tracking jobs
interface UsageAggregationJob {
  type: 'usage-aggregation';
  userId: string;
  period: 'hourly' | 'daily' | 'monthly';
  timestamp: string;
}

interface CostAllocationJob {
  type: 'cost-allocation';
  userId: string;
  provider: 'vllm' | 'anthropic';
  tokens: number;
  costUsd: number;
  conversationId: string;
}

// Webhook jobs
interface WebhookDeliveryJob {
  type: 'webhook-delivery';
  url: string;
  payload: unknown;
  headers: Record<string, string>;
  webhookId: string;
}

// Scheduled jobs
interface SubscriptionCheckJob {
  type: 'subscription-check';
  checkType: 'renewal' | 'expiration' | 'trial-end';
}

interface ChaosToysListJob {
  type: 'chaos-toys-list';
  scheduledDate: string;
}

type AnyJob =
  | SendEmailJob
  | FounderAlertJob
  | TokenCountJob
  | EmbeddingGenerationJob
  | UsageAggregationJob
  | CostAllocationJob
  | WebhookDeliveryJob
  | SubscriptionCheckJob
  | ChaosToysListJob;
```

### Job Producers

```typescript
// src/lib/queue/producers.ts
import {
  emailQueue,
  aiProcessingQueue,
  usageTrackingQueue,
  webhookQueue,
  scheduledQueue,
} from './queues';

export class JobProducer {
  // Email jobs
  static async sendEmail(
    to: string,
    subject: string,
    template: string,
    data: Record<string, unknown>
  ): Promise<string> {
    const job = await emailQueue.add(
      'send-email',
      { type: 'send-email', to, subject, template, data },
      {
        priority: 2, // Normal priority
        jobId: `email-${Date.now()}-${to}`, // Dedup key
      }
    );
    return job.id!;
  }

  static async sendFounderAlert(
    alertType: string,
    title: string,
    body: string,
    source: 'stone' | 'cardinal' | 'chaos' | 'wiz'
  ): Promise<string> {
    const job = await emailQueue.add(
      'founder-alert',
      { type: 'founder-alert', alertType, title, body, source },
      {
        priority: 1, // High priority — founder alerts go first
      }
    );
    return job.id!;
  }

  // AI processing
  static async trackTokenUsage(
    conversationId: string,
    userId: string,
    agentId: number,
    provider: 'vllm' | 'anthropic',
    inputTokens: number,
    outputTokens: number
  ): Promise<string> {
    const job = await aiProcessingQueue.add(
      'token-count',
      {
        type: 'token-count',
        conversationId,
        userId,
        agentId,
        provider,
        inputTokens,
        outputTokens,
      },
      {
        // Deduplicate: same conversation + same message won't double-count
        jobId: `tokens-${conversationId}-${Date.now()}`,
      }
    );
    return job.id!;
  }

  static async generateEmbedding(
    contentId: string,
    contentType: 'forum-post' | 'help-article' | 'agent-prompt',
    text: string
  ): Promise<string> {
    const job = await aiProcessingQueue.add(
      'embedding-generation',
      { type: 'embedding-generation', contentId, contentType, text },
      {
        priority: 3, // Lower priority than real-time operations
        jobId: `embed-${contentType}-${contentId}`,
      }
    );
    return job.id!;
  }

  // Usage tracking
  static async aggregateUsage(
    userId: string,
    period: 'hourly' | 'daily' | 'monthly'
  ): Promise<string> {
    const job = await usageTrackingQueue.add(
      'usage-aggregation',
      {
        type: 'usage-aggregation',
        userId,
        period,
        timestamp: new Date().toISOString(),
      },
      {
        jobId: `usage-${userId}-${period}-${new Date().toISOString().slice(0, 13)}`,
      }
    );
    return job.id!;
  }

  // Webhook delivery
  static async deliverWebhook(
    url: string,
    payload: unknown,
    headers: Record<string, string>,
    webhookId: string
  ): Promise<string> {
    const job = await webhookQueue.add(
      'webhook-delivery',
      { type: 'webhook-delivery', url, payload, headers, webhookId },
      { priority: 2 }
    );
    return job.id!;
  }
}
```

---

## 4. Workers (Consumers)

### Email Worker

```typescript
// src/lib/queue/workers/email-worker.ts
import { Worker, Job } from 'bullmq';
import { subscriberConnection } from '../connection';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.ALERT_EMAIL,
    pass: process.env.ALERT_EMAIL_APP_PASSWORD,
  },
});

const emailWorker = new Worker(
  'email',
  async (job: Job) => {
    switch (job.name) {
      case 'send-email':
        return await handleSendEmail(job);
      case 'founder-alert':
        return await handleFounderAlert(job);
      default:
        throw new Error(`Unknown email job: ${job.name}`);
    }
  },
  {
    connection: subscriberConnection,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000, // 10 emails per second max
    },
  }
);

async function handleSendEmail(job: Job): Promise<{ sent: boolean }> {
  const { to, subject, template, data } = job.data;

  const html = renderEmailTemplate(template, data);

  await transporter.sendMail({
    from: `"Stone AI" <${process.env.ALERT_EMAIL}>`,
    to,
    subject,
    html,
  });

  return { sent: true };
}

async function handleFounderAlert(job: Job): Promise<{ sent: boolean }> {
  const { alertType, title, body, source } = job.data;

  await transporter.sendMail({
    from: process.env.ALERT_EMAIL,
    to: process.env.ALERT_EMAIL, // Founder receives at same address
    subject: `[${source.toUpperCase()}] ${title}`,
    html: `
      <h2>${title}</h2>
      <p><strong>Source:</strong> ${source}</p>
      <p><strong>Type:</strong> ${alertType}</p>
      <hr />
      <div>${body}</div>
      <hr />
      <p style="color: #888;">Sent by Stone AI Alert System at ${new Date().toISOString()}</p>
    `,
  });

  return { sent: true };
}

// Error handling
emailWorker.on('failed', (job, err) => {
  console.error(`Email job ${job?.id} failed:`, err.message);
  if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
    // Final failure — move to dead letter
    moveToDeadLetter('email', job.data, err);
  }
});

emailWorker.on('completed', (job) => {
  console.log(`Email job ${job.id} completed`);
});

export { emailWorker };
```

### AI Processing Worker

```typescript
// src/lib/queue/workers/ai-worker.ts
import { Worker, Job } from 'bullmq';
import { subscriberConnection } from '../connection';
import { prisma } from '@/lib/prisma';

const aiWorker = new Worker(
  'ai-processing',
  async (job: Job) => {
    switch (job.name) {
      case 'token-count':
        return await handleTokenCount(job);
      case 'embedding-generation':
        return await handleEmbeddingGeneration(job);
      default:
        throw new Error(`Unknown AI job: ${job.name}`);
    }
  },
  {
    connection: subscriberConnection,
    concurrency: 3,
    limiter: {
      max: 5,
      duration: 1000,
    },
  }
);

async function handleTokenCount(job: Job): Promise<void> {
  const { conversationId, userId, agentId, provider, inputTokens, outputTokens } =
    job.data;

  // Calculate cost
  const costPerInputToken = provider === 'vllm' ? 0 : 0.000003; // Anthropic pricing
  const costPerOutputToken = provider === 'vllm' ? 0 : 0.000015;
  const totalCost =
    inputTokens * costPerInputToken + outputTokens * costPerOutputToken;

  // Upsert usage record
  await prisma.$executeRaw`
    INSERT INTO token_usage (
      user_id, conversation_id, agent_id, provider,
      input_tokens, output_tokens, cost_usd, recorded_at
    ) VALUES (
      ${userId}, ${conversationId}, ${agentId}, ${provider},
      ${inputTokens}, ${outputTokens}, ${totalCost}, NOW()
    )
  `;

  // Update daily aggregate
  await prisma.$executeRaw`
    INSERT INTO daily_usage (user_id, date, total_tokens, total_cost, message_count)
    VALUES (
      ${userId}, CURRENT_DATE,
      ${inputTokens + outputTokens}, ${totalCost}, 1
    )
    ON CONFLICT (user_id, date) DO UPDATE SET
      total_tokens = daily_usage.total_tokens + ${inputTokens + outputTokens},
      total_cost = daily_usage.total_cost + ${totalCost},
      message_count = daily_usage.message_count + 1
  `;

  // Report progress
  await job.updateProgress(100);
}

async function handleEmbeddingGeneration(job: Job): Promise<void> {
  const { contentId, contentType, text } = job.data;

  await job.updateProgress(10);

  // Generate embedding via local vLLM or Anthropic
  const embedding = await generateEmbedding(text);

  await job.updateProgress(70);

  // Store in pgvector
  await prisma.$executeRaw`
    INSERT INTO content_embeddings (content_id, content_type, embedding, updated_at)
    VALUES (
      ${contentId}, ${contentType},
      ${embedding}::vector, NOW()
    )
    ON CONFLICT (content_id, content_type) DO UPDATE SET
      embedding = EXCLUDED.embedding,
      updated_at = NOW()
  `;

  await job.updateProgress(100);
}

async function generateEmbedding(text: string): Promise<string> {
  // Call embedding model — would use vLLM locally or fallback to API
  const response = await fetch(`${process.env.VLLM_URL}/v1/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'text-embedding-model',
      input: text.slice(0, 8192), // Truncate to max tokens
    }),
  });

  const result = await response.json();
  return `[${result.data[0].embedding.join(',')}]`;
}

aiWorker.on('failed', (job, err) => {
  console.error(`AI job ${job?.id} failed after ${job?.attemptsMade} attempts:`, err);
});

export { aiWorker };
```

---

## 5. Retry Strategies

### Exponential Backoff with Jitter

```typescript
// src/lib/queue/retry-strategies.ts

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffType: 'exponential' | 'linear' | 'fixed';
  jitter: boolean;
}

const RETRY_CONFIGS: Record<string, RetryConfig> = {
  email: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30_000,
    backoffType: 'exponential',
    jitter: true,
  },
  webhook: {
    maxAttempts: 5,
    baseDelay: 3000,
    maxDelay: 300_000, // 5 minutes
    backoffType: 'exponential',
    jitter: true,
  },
  'ai-processing': {
    maxAttempts: 2,
    baseDelay: 5000,
    maxDelay: 30_000,
    backoffType: 'fixed',
    jitter: false,
  },
  'usage-tracking': {
    maxAttempts: 5,
    baseDelay: 2000,
    maxDelay: 60_000,
    backoffType: 'exponential',
    jitter: true,
  },
};

function calculateDelay(config: RetryConfig, attempt: number): number {
  let delay: number;

  switch (config.backoffType) {
    case 'exponential':
      delay = config.baseDelay * Math.pow(2, attempt - 1);
      break;
    case 'linear':
      delay = config.baseDelay * attempt;
      break;
    case 'fixed':
      delay = config.baseDelay;
      break;
  }

  // Cap at max delay
  delay = Math.min(delay, config.maxDelay);

  // Add jitter (up to 25% randomness)
  if (config.jitter) {
    const jitterRange = delay * 0.25;
    delay += Math.random() * jitterRange;
  }

  return Math.floor(delay);
}

// Custom backoff strategy for BullMQ
export function createBackoffStrategy(queueName: string) {
  const config = RETRY_CONFIGS[queueName] || RETRY_CONFIGS.email;

  return {
    type: 'custom' as const,
    delay: (attemptsMade: number) => calculateDelay(config, attemptsMade),
  };
}
```

### Per-Error Retry Logic

```typescript
// src/lib/queue/error-classifier.ts

interface ErrorClassification {
  retryable: boolean;
  category: 'transient' | 'permanent' | 'rate-limit' | 'timeout';
  suggestedDelay?: number;
}

function classifyError(error: Error): ErrorClassification {
  const message = error.message.toLowerCase();

  // Rate limit errors — retry with longer delay
  if (message.includes('429') || message.includes('rate limit')) {
    return {
      retryable: true,
      category: 'rate-limit',
      suggestedDelay: 60_000, // 1 minute
    };
  }

  // Timeout errors — retry normally
  if (message.includes('timeout') || message.includes('econnreset')) {
    return {
      retryable: true,
      category: 'timeout',
    };
  }

  // Server errors — retry
  if (message.includes('500') || message.includes('502') || message.includes('503')) {
    return { retryable: true, category: 'transient' };
  }

  // Auth errors — don't retry
  if (message.includes('401') || message.includes('403')) {
    return { retryable: false, category: 'permanent' };
  }

  // Validation errors — don't retry
  if (message.includes('400') || message.includes('validation')) {
    return { retryable: false, category: 'permanent' };
  }

  // Default: retry
  return { retryable: true, category: 'transient' };
}

// Use in worker
async function processWithClassification(
  job: Job,
  processor: (job: Job) => Promise<void>
): Promise<void> {
  try {
    await processor(job);
  } catch (error: any) {
    const classification = classifyError(error);

    if (!classification.retryable) {
      // Move to dead letter immediately — no more retries
      await moveToDeadLetter(job.queueName, job.data, error);
      // Return without throwing — job completes (won't retry)
      console.warn(
        `Job ${job.id} hit permanent error, moved to DLQ:`,
        error.message
      );
      return;
    }

    if (classification.suggestedDelay) {
      // Change the job's backoff delay for the next retry
      await job.changeDelay(classification.suggestedDelay);
    }

    throw error; // Let BullMQ handle the retry
  }
}
```

---

## 6. Dead Letter Queues

```typescript
// src/lib/queue/dead-letter.ts
import { prisma } from '@/lib/prisma';

interface DeadLetterEntry {
  id: string;
  queue: string;
  jobName: string;
  jobData: unknown;
  error: string;
  errorStack: string;
  attempts: number;
  failedAt: Date;
  retryCount: number;
}

async function moveToDeadLetter(
  queue: string,
  jobData: unknown,
  error: Error
): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO dead_letter_queue (
      queue_name, job_data, error_message, error_stack,
      failed_at, retry_count
    ) VALUES (
      ${queue},
      ${JSON.stringify(jobData)}::jsonb,
      ${error.message},
      ${error.stack ?? ''},
      NOW(),
      0
    )
  `;
}

// Admin API to inspect and retry dead letters
async function getDeadLetters(
  queue?: string,
  limit: number = 50
): Promise<DeadLetterEntry[]> {
  const rows = await prisma.$queryRaw<any[]>`
    SELECT * FROM dead_letter_queue
    WHERE (${queue}::text IS NULL OR queue_name = ${queue})
    ORDER BY failed_at DESC
    LIMIT ${limit}
  `;

  return rows;
}

async function retryDeadLetter(id: string): Promise<boolean> {
  const entry = await prisma.$queryRaw<any[]>`
    SELECT * FROM dead_letter_queue WHERE id = ${id}::uuid LIMIT 1
  `;

  if (entry.length === 0) return false;

  const dl = entry[0];
  const queueMap: Record<string, Queue> = {
    email: emailQueue,
    'ai-processing': aiProcessingQueue,
    'usage-tracking': usageTrackingQueue,
    webhooks: webhookQueue,
  };

  const targetQueue = queueMap[dl.queue_name];
  if (!targetQueue) return false;

  // Re-add to the original queue
  await targetQueue.add(
    dl.job_data.type || 'retry',
    dl.job_data,
    { priority: 3 } // Lower priority for retries
  );

  // Update retry count
  await prisma.$executeRaw`
    UPDATE dead_letter_queue
    SET retry_count = retry_count + 1, last_retry_at = NOW()
    WHERE id = ${id}::uuid
  `;

  return true;
}

async function purgeDeadLetters(
  olderThanDays: number = 30
): Promise<number> {
  const result = await prisma.$executeRaw`
    DELETE FROM dead_letter_queue
    WHERE failed_at < NOW() - INTERVAL '${olderThanDays} days'
  `;

  return result;
}
```

---

## 7. Job Prioritization

### Priority Levels

```typescript
// src/lib/queue/priorities.ts

// BullMQ priorities: lower number = higher priority
export enum JobPriority {
  CRITICAL = 1,   // Founder alerts, security events
  HIGH = 2,       // User-facing operations (auth, billing)
  NORMAL = 3,     // Standard background work
  LOW = 4,        // Analytics, aggregation
  BULK = 5,       // Batch operations, cleanup
}

// Priority-aware producer
export class PriorityProducer {
  static async addJob(
    queue: Queue,
    name: string,
    data: unknown,
    priority: JobPriority = JobPriority.NORMAL,
    options?: Partial<JobsOptions>
  ): Promise<Job> {
    return queue.add(name, data, {
      priority,
      ...options,
    });
  }
}

// Usage
await PriorityProducer.addJob(
  emailQueue,
  'founder-alert',
  { type: 'founder-alert', title: 'Server Down', body: '...', source: 'chaos' },
  JobPriority.CRITICAL
);

await PriorityProducer.addJob(
  usageTrackingQueue,
  'usage-aggregation',
  { type: 'usage-aggregation', userId: 'user-1', period: 'daily' },
  JobPriority.LOW
);
```

### Dynamic Priority Adjustment

```typescript
// Bump priority for jobs that have been waiting too long
async function promoteStalledJobs(queue: Queue, maxWaitMs: number = 300_000): Promise<number> {
  const waiting = await queue.getWaiting(0, 100);
  let promoted = 0;

  for (const job of waiting) {
    const waitTime = Date.now() - job.timestamp;
    if (waitTime > maxWaitMs && (job.opts.priority ?? 3) > 1) {
      // Promote by reducing priority number
      await job.changePriority({
        priority: Math.max(1, (job.opts.priority ?? 3) - 1),
      });
      promoted++;
    }
  }

  return promoted;
}
```

---

## 8. Scheduled Tasks (Cron-Like)

### Repeatable Jobs with BullMQ

```typescript
// src/lib/queue/scheduled.ts
import { scheduledQueue } from './queues';

export async function registerScheduledJobs(): Promise<void> {
  // Daily usage aggregation — every day at midnight UTC
  await scheduledQueue.add(
    'daily-usage-aggregation',
    { type: 'daily-aggregation' },
    {
      repeat: {
        pattern: '0 0 * * *', // Cron: midnight daily
      },
      jobId: 'daily-usage-agg', // Prevent duplicates
    }
  );

  // Hourly token cost sync
  await scheduledQueue.add(
    'hourly-cost-sync',
    { type: 'cost-sync' },
    {
      repeat: {
        pattern: '0 * * * *', // Every hour
      },
      jobId: 'hourly-cost-sync',
    }
  );

  // Subscription expiration check — every 6 hours
  await scheduledQueue.add(
    'subscription-check',
    { type: 'subscription-check', checkType: 'expiration' },
    {
      repeat: {
        pattern: '0 */6 * * *',
      },
      jobId: 'sub-expiration-check',
    }
  );

  // Monthly Chaos Toys List — 8th of every month
  await scheduledQueue.add(
    'chaos-toys-list',
    { type: 'chaos-toys-list' },
    {
      repeat: {
        pattern: '0 9 8 * *', // 9 AM UTC on the 8th
      },
      jobId: 'chaos-toys-monthly',
    }
  );

  // Stale session cleanup — every 4 hours
  await scheduledQueue.add(
    'session-cleanup',
    { type: 'session-cleanup' },
    {
      repeat: {
        pattern: '0 */4 * * *',
      },
      jobId: 'session-cleanup',
    }
  );

  // Dead letter queue retry — every 30 minutes
  await scheduledQueue.add(
    'dlq-retry',
    { type: 'dlq-retry' },
    {
      repeat: {
        pattern: '*/30 * * * *',
      },
      jobId: 'dlq-retry',
    }
  );

  console.log('[Scheduler] All repeatable jobs registered');
}
```

### Scheduled Worker

```typescript
// src/lib/queue/workers/scheduled-worker.ts
import { Worker, Job } from 'bullmq';
import { subscriberConnection } from '../connection';

const scheduledWorker = new Worker(
  'scheduled',
  async (job: Job) => {
    const startTime = Date.now();
    console.log(`[Scheduled] Running: ${job.name}`);

    switch (job.name) {
      case 'daily-usage-aggregation':
        await runDailyAggregation();
        break;

      case 'hourly-cost-sync':
        await runCostSync();
        break;

      case 'subscription-check':
        await checkSubscriptions(job.data.checkType);
        break;

      case 'chaos-toys-list':
        await generateChaosToysList();
        break;

      case 'session-cleanup':
        await cleanupStaleSessions();
        break;

      case 'dlq-retry':
        await retryDeadLetterBatch();
        break;

      default:
        console.warn(`Unknown scheduled job: ${job.name}`);
    }

    const duration = Date.now() - startTime;
    console.log(`[Scheduled] Completed: ${job.name} in ${duration}ms`);

    return { duration };
  },
  {
    connection: subscriberConnection,
    concurrency: 1, // Scheduled jobs run one at a time
  }
);

async function runDailyAggregation(): Promise<void> {
  // Aggregate yesterday's usage per user
  await prisma.$executeRaw`
    INSERT INTO monthly_usage (user_id, month, total_tokens, total_cost, total_messages)
    SELECT
      user_id,
      date_trunc('month', CURRENT_DATE) as month,
      SUM(total_tokens),
      SUM(total_cost),
      SUM(message_count)
    FROM daily_usage
    WHERE date = CURRENT_DATE - INTERVAL '1 day'
    GROUP BY user_id
    ON CONFLICT (user_id, month) DO UPDATE SET
      total_tokens = monthly_usage.total_tokens + EXCLUDED.total_tokens,
      total_cost = monthly_usage.total_cost + EXCLUDED.total_cost,
      total_messages = monthly_usage.total_messages + EXCLUDED.total_messages
  `;
}

async function checkSubscriptions(
  checkType: 'renewal' | 'expiration' | 'trial-end'
): Promise<void> {
  if (checkType === 'expiration') {
    // Find users whose subscriptions expire in the next 3 days
    const expiring = await prisma.$queryRaw<any[]>`
      SELECT u.clerk_id, u.email, u.tier, s.current_period_end
      FROM users u
      JOIN subscriptions s ON u.id = s.user_id
      WHERE s.current_period_end BETWEEN NOW() AND NOW() + INTERVAL '3 days'
        AND s.status = 'active'
        AND NOT s.cancel_at_period_end
    `;

    for (const user of expiring) {
      await JobProducer.sendEmail(
        user.email,
        'Your Stone AI subscription is renewing soon',
        'subscription-renewal-reminder',
        {
          tier: user.tier,
          renewalDate: user.current_period_end,
        }
      );
    }
  }
}

async function cleanupStaleSessions(): Promise<void> {
  const deleted = await prisma.$executeRaw`
    DELETE FROM active_sessions
    WHERE last_seen_at < NOW() - INTERVAL '24 hours'
  `;
  console.log(`[Cleanup] Removed ${deleted} stale sessions`);
}

scheduledWorker.on('failed', (job, err) => {
  console.error(`Scheduled job ${job?.name} failed:`, err);
  // Critical scheduled jobs failing should alert the founder
  if (job?.name === 'subscription-check' || job?.name === 'daily-usage-aggregation') {
    JobProducer.sendFounderAlert(
      'system.error',
      `Scheduled Job Failed: ${job.name}`,
      `Error: ${err.message}\nAttempts: ${job.attemptsMade}`,
      'stone'
    ).catch(console.error);
  }
});

export { scheduledWorker };
```

---

## 9. Vercel-Compatible Patterns

Since Vercel serverless functions have execution time limits, long-running workers need alternative approaches.

### API Route as Job Trigger

```typescript
// src/app/api/cron/daily-aggregation/route.ts
// Triggered by Vercel Cron or external scheduler

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    await runDailyAggregation();
    return Response.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error('Daily aggregation failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/daily-aggregation",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/subscription-check",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 */4 * * *"
    }
  ]
}
```

### Inline Background Processing (No External Queue)

For simple background tasks that can finish within Vercel's function timeout:

```typescript
// src/lib/background.ts

// Fire-and-forget pattern for Vercel
export function runInBackground(fn: () => Promise<void>): void {
  // In Vercel, waitUntil() extends the function lifetime
  // without blocking the response
  if (typeof globalThis.__NEXT_WAIT_UNTIL === 'function') {
    globalThis.__NEXT_WAIT_UNTIL(fn());
  } else {
    // Fallback: just run it (may get cut off in serverless)
    fn().catch(console.error);
  }
}

// Usage in API route
export async function POST(req: Request) {
  const data = await req.json();

  // Respond immediately
  const response = { id: '123', status: 'accepted' };

  // Background: track usage, send notification
  runInBackground(async () => {
    await trackTokenUsage(data.conversationId, data.tokens);
    await updateDashboardProjection(data.userId);
  });

  return Response.json(response);
}
```

### Database-Backed Job Queue (No Redis Required)

```typescript
// src/lib/queue/pg-queue.ts
// For environments where Redis isn't available (pure Vercel + Neon)

interface PgJob {
  id: string;
  queue: string;
  name: string;
  data: unknown;
  priority: number;
  attempts: number;
  maxAttempts: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  runAt: Date;
  lockedAt: Date | null;
  lockedBy: string | null;
  completedAt: Date | null;
  failedAt: Date | null;
  error: string | null;
}

export class PgJobQueue {
  async enqueue(
    queue: string,
    name: string,
    data: unknown,
    options?: { priority?: number; delay?: number; maxAttempts?: number }
  ): Promise<string> {
    const runAt = options?.delay
      ? new Date(Date.now() + options.delay)
      : new Date();

    const rows = await prisma.$queryRaw<[{ id: string }]>`
      INSERT INTO job_queue (queue, name, data, priority, max_attempts, run_at)
      VALUES (
        ${queue}, ${name}, ${JSON.stringify(data)}::jsonb,
        ${options?.priority ?? 3}, ${options?.maxAttempts ?? 3}, ${runAt}
      )
      RETURNING id
    `;

    return rows[0].id;
  }

  async dequeue(
    queue: string,
    workerId: string,
    batchSize: number = 1
  ): Promise<PgJob[]> {
    // SELECT ... FOR UPDATE SKIP LOCKED is the key pattern
    const jobs = await prisma.$queryRaw<PgJob[]>`
      UPDATE job_queue
      SET status = 'processing',
          locked_at = NOW(),
          locked_by = ${workerId},
          attempts = attempts + 1
      WHERE id IN (
        SELECT id FROM job_queue
        WHERE queue = ${queue}
          AND status = 'pending'
          AND run_at <= NOW()
        ORDER BY priority ASC, run_at ASC
        LIMIT ${batchSize}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING *
    `;

    return jobs;
  }

  async complete(jobId: string): Promise<void> {
    await prisma.$executeRaw`
      UPDATE job_queue
      SET status = 'completed', completed_at = NOW(), locked_at = NULL, locked_by = NULL
      WHERE id = ${jobId}::uuid
    `;
  }

  async fail(jobId: string, error: string): Promise<void> {
    await prisma.$executeRaw`
      UPDATE job_queue
      SET
        status = CASE
          WHEN attempts >= max_attempts THEN 'failed'
          ELSE 'pending'
        END,
        error = ${error},
        failed_at = CASE WHEN attempts >= max_attempts THEN NOW() ELSE NULL END,
        locked_at = NULL,
        locked_by = NULL,
        run_at = CASE
          WHEN attempts < max_attempts
            THEN NOW() + (INTERVAL '1 second' * POWER(2, attempts))
          ELSE run_at
        END
      WHERE id = ${jobId}::uuid
    `;
  }

  // Reclaim jobs stuck in 'processing' for over 5 minutes
  async reclaimStale(staleMinutes: number = 5): Promise<number> {
    const result = await prisma.$executeRaw`
      UPDATE job_queue
      SET status = 'pending', locked_at = NULL, locked_by = NULL
      WHERE status = 'processing'
        AND locked_at < NOW() - INTERVAL '${staleMinutes} minutes'
    `;
    return result;
  }
}
```

---

## 10. Monitoring and Observability

```typescript
// src/lib/queue/monitoring.ts
import { Queue } from 'bullmq';

interface QueueMetrics {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

export async function getQueueMetrics(queue: Queue): Promise<QueueMetrics> {
  const [waiting, active, completed, failed, delayed, paused] =
    await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
      queue.isPaused(),
    ]);

  return {
    name: queue.name,
    waiting,
    active,
    completed,
    failed,
    delayed,
    paused,
  };
}

export async function getAllQueueMetrics(): Promise<QueueMetrics[]> {
  const queues = [emailQueue, aiProcessingQueue, usageTrackingQueue, webhookQueue, scheduledQueue];
  return Promise.all(queues.map(getQueueMetrics));
}

// Admin API endpoint
// src/app/api/admin/queues/route.ts
export async function GET(req: Request) {
  const { userId } = auth();
  if (!isAdmin(userId)) {
    return new Response('Forbidden', { status: 403 });
  }

  const metrics = await getAllQueueMetrics();
  return Response.json({ queues: metrics, timestamp: new Date().toISOString() });
}
```

---

## 11. Testing Background Jobs

```typescript
// __tests__/queue/email-worker.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the worker processing
describe('Email Worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send founder alert with correct format', async () => {
    const sendMail = vi.fn().mockResolvedValue({ messageId: 'test' });
    vi.mocked(transporter.sendMail).mockImplementation(sendMail);

    const job = {
      id: 'test-job-1',
      name: 'founder-alert',
      data: {
        type: 'founder-alert',
        alertType: 'system.error',
        title: 'Test Alert',
        body: 'Something happened',
        source: 'chaos',
      },
      attemptsMade: 0,
      updateProgress: vi.fn(),
    } as unknown as Job;

    await handleFounderAlert(job);

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: '[CHAOS] Test Alert',
      })
    );
  });

  it('should classify 429 errors as rate-limited', () => {
    const error = new Error('Request failed with status 429');
    const classification = classifyError(error);

    expect(classification.retryable).toBe(true);
    expect(classification.category).toBe('rate-limit');
    expect(classification.suggestedDelay).toBe(60_000);
  });

  it('should not retry 400 validation errors', () => {
    const error = new Error('400 Bad Request: validation failed');
    const classification = classifyError(error);

    expect(classification.retryable).toBe(false);
    expect(classification.category).toBe('permanent');
  });
});
```

---

## Summary

| Pattern | Use Case | Stone AI Application |
|---------|----------|---------------------|
| BullMQ + Redis | Full job queue with priorities | Email, AI processing, webhooks |
| Vercel Cron | Scheduled tasks on Vercel | Daily aggregation, cleanup |
| PG Queue (SKIP LOCKED) | No Redis available | Neon-only deployment |
| Exponential backoff | Transient failures | Webhook delivery, API calls |
| Dead Letter Queue | Permanent failure tracking | Failed emails, broken webhooks |
| Priority queues | Urgency ordering | Founder alerts > analytics |
| Fire-and-forget | Quick background tasks | Token counting, projection updates |

Background job processing keeps Stone AI responsive while handling complex, time-consuming operations reliably.
