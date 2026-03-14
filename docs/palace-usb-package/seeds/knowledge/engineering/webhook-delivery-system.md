# Webhook Delivery System for Stone AI Tools

## Seed Classification
- **Domain**: Backend Engineering / Event Systems
- **Platform**: Stone AI Tools (tools.stone-ai.net)
- **Complexity**: Advanced
- **Prerequisites**: HTTP, cryptography, queue systems, retry patterns
- **Last Updated**: 2026-03-09

---

## 1. Webhook System Overview

### Why Webhooks?

Stone AI Tools delivers events to customer endpoints when significant actions occur — agent completions, billing events, usage thresholds. This enables developers to build reactive integrations without polling.

```
Webhook Delivery Flow:

  Event Source          Queue              Delivery Engine        Customer
  ──────────           ─────              ────────────────       ────────
  Agent completes ──► Event Queue ──► Webhook Worker ──► POST https://customer.com/webhook
  Usage threshold ──►              ├── Sign payload      ├── Verify signature
  Payment event   ──►              ├── Set headers       ├── Process event
  Key revoked     ──►              └── Track delivery    └── Return 2xx
                                        │
                                        ▼
                                   Delivery Log
                                   (success/failure)
```

### Supported Event Types

```typescript
const WEBHOOK_EVENT_TYPES = {
  // Agent events
  'agent.invocation.completed': 'Agent finished processing a request',
  'agent.invocation.failed':    'Agent invocation failed',
  'agent.invocation.timeout':   'Agent invocation timed out',

  // Usage events
  'usage.threshold.reached':    'Usage hit a threshold (50%, 75%, 90%, 100%)',
  'usage.limit.reached':        'Monthly usage limit reached',

  // Billing events
  'billing.invoice.created':    'New invoice generated',
  'billing.payment.succeeded':  'Payment successfully processed',
  'billing.payment.failed':     'Payment attempt failed',
  'billing.subscription.updated': 'Subscription plan changed',

  // Security events
  'api_key.created':            'New API key created',
  'api_key.revoked':            'API key revoked',
  'api_key.leaked':             'API key detected in public repository',

  // Account events
  'account.suspended':          'Account suspended',
  'account.reactivated':        'Account reactivated',
} as const;

type WebhookEventType = keyof typeof WEBHOOK_EVENT_TYPES;
```

---

## 2. Webhook Data Model

```prisma
model Webhook {
  id            String          @id @default(cuid())
  tenantId      String
  url           String          // Customer endpoint URL
  description   String?

  // Event filtering
  events        String[]        // Event types to deliver
  active        Boolean         @default(true)

  // Security
  secret        String          // HMAC signing secret (encrypted at rest)

  // Delivery config
  version       String          @default("1")  // Payload format version
  maxRetries    Int             @default(5)
  timeoutMs     Int             @default(30000)

  // Metadata
  metadata      Json            @default("{}")

  // Stats (denormalized for dashboard)
  successCount  Int             @default(0)
  failureCount  Int             @default(0)
  lastDeliveryAt DateTime?
  lastStatus    Int?            // Last HTTP status code

  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  tenant        Tenant          @relation(fields: [tenantId], references: [id])
  deliveries    WebhookDelivery[]

  @@index([tenantId, active])
  @@index([tenantId])
  @@map("webhooks")
}

model WebhookDelivery {
  id            String          @id @default(cuid())
  webhookId     String
  eventType     String
  eventId       String          // Unique event identifier

  // Payload
  payload       Json

  // Delivery status
  status        DeliveryStatus  @default(PENDING)
  attempts      Int             @default(0)
  maxAttempts   Int             @default(5)

  // Response tracking
  lastStatusCode Int?
  lastResponseBody String?     // Truncated to 1KB
  lastResponseMs  Int?
  lastError       String?

  // Timing
  scheduledFor  DateTime        @default(now())
  firstAttemptAt DateTime?
  lastAttemptAt  DateTime?
  completedAt   DateTime?

  createdAt     DateTime        @default(now())

  webhook       Webhook         @relation(fields: [webhookId], references: [id])

  @@index([webhookId, status])
  @@index([status, scheduledFor])
  @@index([eventId])
  @@map("webhook_deliveries")
}

enum DeliveryStatus {
  PENDING
  DELIVERING
  SUCCEEDED
  FAILED
  EXHAUSTED   // All retries used
}
```

---

## 3. Webhook Event Emission

```typescript
// File: src/services/webhook-emitter.ts

interface WebhookEvent {
  id: string;          // Unique event ID (idempotency key)
  type: WebhookEventType;
  tenantId: string;
  timestamp: string;   // ISO 8601
  data: Record<string, unknown>;
}

class WebhookEmitter {
  /**
   * Emit an event to all matching webhooks for a tenant.
   * Non-blocking — queues delivery jobs.
   */
  async emit(tenantId: string, eventType: WebhookEventType, data: Record<string, unknown>): Promise<void> {
    const event: WebhookEvent = {
      id: `evt_${randomUUID().replace(/-/g, '')}`,
      type: eventType,
      tenantId,
      timestamp: new Date().toISOString(),
      data,
    };

    // Find all active webhooks for this tenant that subscribe to this event type
    const webhooks = await db.raw.webhook.findMany({
      where: {
        tenantId,
        active: true,
        events: { has: eventType },
      },
    });

    if (webhooks.length === 0) return;

    // Create delivery records and queue jobs
    const deliveries = await db.raw.webhookDelivery.createManyAndReturn({
      data: webhooks.map(webhook => ({
        webhookId: webhook.id,
        eventType: event.type,
        eventId: event.id,
        payload: buildPayload(event, webhook.version),
        maxAttempts: webhook.maxRetries,
      })),
    });

    // Queue delivery jobs
    for (const delivery of deliveries) {
      await jobQueue.add('webhook:deliver', {
        deliveryId: delivery.id,
      }, {
        attempts: 1, // We handle retries ourselves
        removeOnComplete: true,
      });
    }

    metrics.counter('webhook.events_emitted', {
      eventType,
      webhookCount: webhooks.length.toString(),
    });
  }
}

function buildPayload(event: WebhookEvent, version: string): object {
  return {
    id: event.id,
    type: event.type,
    api_version: version,
    created_at: event.timestamp,
    data: event.data,
  };
}
```

---

## 4. Webhook Delivery Engine

### 4.1 Delivery Worker

```typescript
// File: src/workers/webhook-delivery-worker.ts

class WebhookDeliveryWorker {
  async processDelivery(deliveryId: string): Promise<void> {
    const delivery = await db.raw.webhookDelivery.findUniqueOrThrow({
      where: { id: deliveryId },
      include: { webhook: true },
    });

    if (delivery.status === 'SUCCEEDED' || delivery.status === 'EXHAUSTED') {
      return; // Already done
    }

    const webhook = delivery.webhook;

    // Build the request
    const payloadStr = JSON.stringify(delivery.payload);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = this.signPayload(payloadStr, timestamp, webhook.secret);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'StoneAI-Webhooks/1.0',
      'X-Webhook-Id': webhook.id,
      'X-Webhook-Event': delivery.eventType,
      'X-Webhook-Delivery': delivery.id,
      'X-Webhook-Timestamp': timestamp,
      'X-Webhook-Signature': signature,
      'X-Webhook-Signature-256': this.signPayloadSha256(payloadStr, timestamp, webhook.secret),
    };

    // Mark as delivering
    await db.raw.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: 'DELIVERING',
        attempts: { increment: 1 },
        firstAttemptAt: delivery.firstAttemptAt ?? new Date(),
        lastAttemptAt: new Date(),
      },
    });

    try {
      const startTime = Date.now();

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: payloadStr,
        signal: AbortSignal.timeout(webhook.timeoutMs),
        redirect: 'follow',
      });

      const responseTime = Date.now() - startTime;

      // Read response body (truncated)
      let responseBody: string;
      try {
        responseBody = (await response.text()).slice(0, 1024);
      } catch {
        responseBody = '';
      }

      if (response.ok) {
        // Success (2xx)
        await this.markSuccess(delivery, response.status, responseBody, responseTime);
        await this.updateWebhookStats(webhook.id, true, response.status);
      } else {
        // Non-2xx response
        await this.handleFailure(delivery, webhook, response.status, responseBody, responseTime);
        await this.updateWebhookStats(webhook.id, false, response.status);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Network error, timeout, etc.
      await this.handleFailure(delivery, webhook, null, null, null, errorMessage);
      await this.updateWebhookStats(webhook.id, false, null);
    }
  }

  private async markSuccess(
    delivery: WebhookDelivery,
    statusCode: number,
    responseBody: string,
    responseMs: number
  ): Promise<void> {
    await db.raw.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: 'SUCCEEDED',
        lastStatusCode: statusCode,
        lastResponseBody: responseBody,
        lastResponseMs: responseMs,
        completedAt: new Date(),
      },
    });

    metrics.counter('webhook.delivery_success', { eventType: delivery.eventType });
    metrics.histogram('webhook.delivery_latency_ms', { eventType: delivery.eventType }, responseMs);
  }

  private async handleFailure(
    delivery: WebhookDelivery,
    webhook: Webhook,
    statusCode: number | null,
    responseBody: string | null,
    responseMs: number | null,
    error?: string
  ): Promise<void> {
    const newAttempts = delivery.attempts + 1;
    const exhausted = newAttempts >= delivery.maxAttempts;

    await db.raw.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: exhausted ? 'EXHAUSTED' : 'PENDING',
        lastStatusCode: statusCode,
        lastResponseBody: responseBody?.slice(0, 1024),
        lastResponseMs: responseMs,
        lastError: error,
        completedAt: exhausted ? new Date() : null,
        scheduledFor: exhausted ? undefined : this.getRetryTime(newAttempts),
      },
    });

    if (!exhausted) {
      // Schedule retry
      const delay = this.getRetryDelayMs(newAttempts);
      await jobQueue.add('webhook:deliver', { deliveryId: delivery.id }, {
        delay,
        attempts: 1,
      });

      metrics.counter('webhook.delivery_retry', {
        eventType: delivery.eventType,
        attempt: newAttempts.toString(),
      });
    } else {
      // All retries exhausted
      metrics.counter('webhook.delivery_exhausted', { eventType: delivery.eventType });

      // Notify tenant if a critical event delivery failed completely
      if (this.isCriticalEvent(delivery.eventType)) {
        await this.notifyDeliveryFailure(webhook.tenantId, delivery);
      }

      // Auto-disable webhook after too many consecutive failures
      await this.checkAutoDisable(webhook.id);
    }
  }

  /**
   * Exponential backoff with jitter for retries.
   *
   * Attempt 1: ~30 seconds
   * Attempt 2: ~2 minutes
   * Attempt 3: ~10 minutes
   * Attempt 4: ~1 hour
   * Attempt 5: ~6 hours
   */
  private getRetryDelayMs(attempt: number): number {
    const baseDelays = [30_000, 120_000, 600_000, 3_600_000, 21_600_000];
    const base = baseDelays[Math.min(attempt - 1, baseDelays.length - 1)];
    const jitter = Math.random() * base * 0.2; // 20% jitter
    return base + jitter;
  }

  private getRetryTime(attempt: number): Date {
    return new Date(Date.now() + this.getRetryDelayMs(attempt));
  }

  private isCriticalEvent(eventType: string): boolean {
    return ['api_key.leaked', 'account.suspended', 'billing.payment.failed'].includes(eventType);
  }

  private async checkAutoDisable(webhookId: string): Promise<void> {
    // Count recent consecutive failures
    const recentDeliveries = await db.raw.webhookDelivery.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { status: true },
    });

    const consecutiveFailures = recentDeliveries
      .findIndex(d => d.status === 'SUCCEEDED');

    // If last 10 deliveries all failed, disable the webhook
    if (consecutiveFailures === -1 && recentDeliveries.length >= 10) {
      await db.raw.webhook.update({
        where: { id: webhookId },
        data: {
          active: false,
          metadata: {
            autoDisabledAt: new Date().toISOString(),
            autoDisabledReason: 'consecutive_failures',
          },
        },
      });

      const webhook = await db.raw.webhook.findUnique({
        where: { id: webhookId },
        select: { tenantId: true, url: true },
      });

      if (webhook) {
        await sendEmail(webhook.tenantId, 'webhook-auto-disabled', {
          url: webhook.url,
          reason: '10 consecutive delivery failures',
        });
      }
    }
  }

  private async updateWebhookStats(
    webhookId: string,
    success: boolean,
    statusCode: number | null
  ): Promise<void> {
    await db.raw.webhook.update({
      where: { id: webhookId },
      data: {
        [success ? 'successCount' : 'failureCount']: { increment: 1 },
        lastDeliveryAt: new Date(),
        lastStatus: statusCode,
      },
    });
  }

  /**
   * Sign payload for webhook verification.
   * Uses HMAC-SHA1 (v1) format: "sha1=HEXDIGEST"
   */
  private signPayload(payload: string, timestamp: string, secret: string): string {
    const signatureBody = `${timestamp}.${payload}`;
    const hmac = createHmac('sha1', secret).update(signatureBody).digest('hex');
    return `sha1=${hmac}`;
  }

  /**
   * Sign payload with SHA-256 (v2) format: "sha256=HEXDIGEST"
   */
  private signPayloadSha256(payload: string, timestamp: string, secret: string): string {
    const signatureBody = `${timestamp}.${payload}`;
    const hmac = createHmac('sha256', secret).update(signatureBody).digest('hex');
    return `sha256=${hmac}`;
  }
}
```

---

## 5. Signature Verification (Customer Side)

### 5.1 Verification Guide

```typescript
// Documentation code example: How customers verify webhook signatures

import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,        // Raw request body
  signature: string,      // X-Webhook-Signature-256 header
  timestamp: string,      // X-Webhook-Timestamp header
  secret: string          // Your webhook secret
): boolean {
  // 1. Prevent replay attacks — reject old timestamps
  const timestampAge = Math.abs(Date.now() / 1000 - parseInt(timestamp, 10));
  if (timestampAge > 300) { // 5 minute tolerance
    console.error('Webhook timestamp too old');
    return false;
  }

  // 2. Compute expected signature
  const signatureBody = `${timestamp}.${payload}`;
  const expectedSignature = 'sha256=' +
    crypto.createHmac('sha256', secret)
      .update(signatureBody)
      .digest('hex');

  // 3. Constant-time comparison (prevents timing attacks)
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

// Express.js middleware example
app.post('/webhooks/stone-ai', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-webhook-signature-256'] as string;
  const timestamp = req.headers['x-webhook-timestamp'] as string;
  const payload = req.body.toString();

  if (!verifyWebhookSignature(payload, signature, timestamp, WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = JSON.parse(payload);
  console.log('Verified webhook event:', event.type);

  // Process the event
  switch (event.type) {
    case 'agent.invocation.completed':
      handleAgentCompletion(event.data);
      break;
    case 'usage.threshold.reached':
      handleUsageAlert(event.data);
      break;
  }

  // Always return 200 quickly
  res.status(200).json({ received: true });
});
```

---

## 6. Delivery Logs and Debugging

### 6.1 Delivery Log API

```typescript
// File: src/app/api/dashboard/webhooks/[webhookId]/deliveries/route.ts

export async function GET(
  req: Request,
  { params }: { params: { webhookId: string } }
) {
  const tenantId = await requireAuth(req);
  const { searchParams } = new URL(req.url);

  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20', 10);
  const status = searchParams.get('status') as DeliveryStatus | null;
  const eventType = searchParams.get('eventType');

  const where: any = {
    webhookId: params.webhookId,
    webhook: { tenantId }, // Ensure tenant ownership
  };

  if (status) where.status = status;
  if (eventType) where.eventType = eventType;

  const [deliveries, total] = await Promise.all([
    db.raw.webhookDelivery.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        eventType: true,
        eventId: true,
        status: true,
        attempts: true,
        maxAttempts: true,
        lastStatusCode: true,
        lastResponseMs: true,
        lastError: true,
        firstAttemptAt: true,
        lastAttemptAt: true,
        completedAt: true,
        createdAt: true,
      },
    }),
    db.raw.webhookDelivery.count({ where }),
  ]);

  return Response.json({
    data: deliveries,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}
```

### 6.2 Replay a Delivery

```typescript
// File: src/app/api/dashboard/webhooks/deliveries/[deliveryId]/replay/route.ts

export async function POST(
  req: Request,
  { params }: { params: { deliveryId: string } }
) {
  const tenantId = await requireAuth(req);

  const delivery = await db.raw.webhookDelivery.findFirst({
    where: {
      id: params.deliveryId,
      webhook: { tenantId },
    },
  });

  if (!delivery) {
    return Response.json({ error: 'not_found' }, { status: 404 });
  }

  // Create a new delivery with the same payload
  const replay = await db.raw.webhookDelivery.create({
    data: {
      webhookId: delivery.webhookId,
      eventType: delivery.eventType,
      eventId: delivery.eventId,
      payload: delivery.payload as any,
      maxAttempts: 1, // Single attempt for replays
    },
  });

  await jobQueue.add('webhook:deliver', { deliveryId: replay.id });

  return Response.json({ id: replay.id, status: 'queued' }, { status: 202 });
}
```

---

## 7. Webhook Testing Endpoint

```typescript
// File: src/app/api/dashboard/webhooks/[webhookId]/test/route.ts

export async function POST(
  req: Request,
  { params }: { params: { webhookId: string } }
) {
  const tenantId = await requireAuth(req);

  const webhook = await db.raw.webhook.findFirst({
    where: { id: params.webhookId, tenantId },
  });

  if (!webhook) {
    return Response.json({ error: 'not_found' }, { status: 404 });
  }

  // Send a test event
  const testEvent = {
    id: `evt_test_${randomUUID().replace(/-/g, '')}`,
    type: 'test.ping',
    api_version: '1',
    created_at: new Date().toISOString(),
    data: {
      message: 'This is a test webhook from Stone AI Tools',
      webhook_id: webhook.id,
    },
  };

  const payloadStr = JSON.stringify(testEvent);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = signPayloadSha256(payloadStr, timestamp, webhook.secret);

  try {
    const startTime = Date.now();
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Event': 'test.ping',
        'X-Webhook-Timestamp': timestamp,
        'X-Webhook-Signature-256': signature,
      },
      body: payloadStr,
      signal: AbortSignal.timeout(10_000),
    });

    const responseTime = Date.now() - startTime;
    const responseBody = (await response.text()).slice(0, 1024);

    return Response.json({
      success: response.ok,
      statusCode: response.status,
      responseTime,
      responseBody,
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
```

---

## 8. Failure Notifications

```typescript
// File: src/services/webhook-failure-notifier.ts

class WebhookFailureNotifier {
  /**
   * Notify tenant when webhook deliveries consistently fail.
   * Run as a scheduled job every hour.
   */
  async checkFailingWebhooks(): Promise<void> {
    // Find webhooks with recent failures
    const failingWebhooks = await db.raw.$queryRaw<Array<{
      webhookId: string;
      tenantId: string;
      url: string;
      failureCount: number;
      billingEmail: string;
    }>>`
      SELECT
        w.id as "webhookId",
        w.tenant_id as "tenantId",
        w.url,
        COUNT(*) FILTER (WHERE wd.status IN ('FAILED', 'EXHAUSTED')) as "failureCount",
        t.billing_email as "billingEmail"
      FROM webhooks w
      JOIN webhook_deliveries wd ON wd.webhook_id = w.id
      JOIN tenants t ON t.id = w.tenant_id
      WHERE w.active = true
        AND wd.created_at > NOW() - INTERVAL '1 hour'
      GROUP BY w.id, w.tenant_id, w.url, t.billing_email
      HAVING COUNT(*) FILTER (WHERE wd.status IN ('FAILED', 'EXHAUSTED')) >= 5
    `;

    for (const webhook of failingWebhooks) {
      const alertKey = `webhook_failure_alert:${webhook.webhookId}`;
      const alreadyAlerted = await redis.get(alertKey);

      if (!alreadyAlerted) {
        await sendEmail(webhook.billingEmail, 'webhook-delivery-failing', {
          webhookUrl: webhook.url,
          failureCount: webhook.failureCount,
          dashboardUrl: `https://tools.stone-ai.net/dashboard/webhooks/${webhook.webhookId}`,
        });

        // Don't alert again for 6 hours
        await redis.set(alertKey, '1', 'EX', 6 * 60 * 60);
      }
    }
  }
}
```

---

## Summary

The Stone AI Tools webhook delivery system provides reliable event delivery:

1. **Event Types**: Agent, usage, billing, security, and account events
2. **Signed Payloads**: HMAC-SHA256 signatures with timestamp protection against replays
3. **Exponential Backoff**: 5 retry attempts over ~6 hours (30s, 2m, 10m, 1h, 6h)
4. **Delivery Logs**: Full history with status, response codes, latency, and error details
5. **Auto-Disable**: Webhooks automatically disabled after 10 consecutive failures with notification
6. **Testing**: Test endpoint for verifying webhook setup before going live
7. **Replay**: Re-deliver any past event with one click
8. **Failure Notifications**: Proactive email alerts when deliveries consistently fail
