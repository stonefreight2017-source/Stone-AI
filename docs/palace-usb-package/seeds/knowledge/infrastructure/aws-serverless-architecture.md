# AWS Serverless Architecture
# Seed: INFRA-2 | Category: Cloud Architecture | Provider: AWS Serverless
# RAG Tags: lambda, api-gateway, step-functions, eventbridge, sqs, sns, dynamodb, serverless, cost-modeling

---

## Purpose
Deep-dive into AWS serverless architecture patterns. Lambda internals, API Gateway selection,
event-driven patterns, Step Functions orchestration, and DynamoDB single-table design.
Every agent recommending serverless must understand cold starts, cost crossover points,
and the real-world gotchas.

---

## 1. Lambda Deep Dive

### Execution Model
```
Request arrives
  → Is there a warm container?
    YES → Route to warm container (HOT START: <1ms overhead)
    NO  → Create new execution environment (COLD START)
         1. Download deployment package (or pull container image)
         2. Create execution environment (microVM via Firecracker)
         3. Initialize runtime (Node.js/Python/Java/etc.)
         4. Run initialization code (INIT phase — outside handler)
         5. Execute handler function (INVOKE phase)

IMPORTANT: Code in INIT phase runs ONCE per container, not per invocation.
Put DB connections, SDK clients, config loading in INIT phase.
```

### Cold Start Optimization — The Complete Strategy

```typescript
// BAD — connection created every invocation
export const handler = async (event: APIGatewayProxyEvent) => {
  const db = new Pool({ connectionString: process.env.DATABASE_URL });
  const result = await db.query('SELECT * FROM users WHERE id = $1', [event.pathParameters?.id]);
  await db.end();
  return { statusCode: 200, body: JSON.stringify(result.rows) };
};

// GOOD — connection reused across warm invocations
import { Pool } from 'pg';

// INIT phase — runs once per container
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,                    // Lambda = 1 concurrent request per container
  idleTimeoutMillis: 120000, // Keep alive between invocations
});

export const handler = async (event: APIGatewayProxyEvent) => {
  const result = await db.query('SELECT * FROM users WHERE id = $1', [event.pathParameters?.id]);
  return { statusCode: 200, body: JSON.stringify(result.rows) };
};
```

### Lambda Layers
```
Layer structure:
  layer.zip
  └── nodejs/
      └── node_modules/
          ├── @prisma/client/
          ├── zod/
          └── shared-utils/

Benefits:
  - Shared across multiple functions
  - Reduces deployment package size
  - Independent versioning
  - Up to 5 layers per function
  - Total unzipped size limit: 250MB

When to use layers vs. bundling:
  Layer: shared dependencies across 5+ functions
  Bundle: function-specific dependencies, faster cold starts (fewer files to decompress)
```

### Provisioned Concurrency
```
Use when:
  - P99 latency SLA < 100ms
  - User-facing synchronous APIs
  - Payment processing, authentication flows
  - Regulatory requirements for response time

Cost model:
  Provisioned concurrency price: $0.000004646 per GB-second (always running)
  + Regular invocation price:    $0.0000166667 per GB-second (when executing)

  Example: 100 provisioned instances, 1024MB, 24/7
  = 100 * 1GB * 86400s * 30days * $0.000004646
  = $1,203/month for zero cold starts

  Compare to: EC2 t3.medium = $30/month (but you manage it)

  Decision: Only use PC when cold start latency is a BUSINESS problem, not a tech preference.
```

### Power Tuning
```
Use AWS Lambda Power Tuning (Step Functions-based tool):
  1. Deploy: https://github.com/alexcasalboni/aws-lambda-power-tuning
  2. Run against your function with representative payload
  3. Get cost vs. duration graph

  Common findings:
  - CPU-bound functions: sweet spot at 1769MB (1 vCPU)
  - I/O-bound functions: 256-512MB is usually optimal
  - Memory-bound functions: scale linearly with memory setting

  The tool often reveals that 1024MB is cheaper than 256MB
  because the function completes 4x faster at 4x the memory price = same cost, better UX.
```

---

## 2. API Gateway — REST vs. HTTP API

### Decision Matrix
```
Feature                    | REST API         | HTTP API
---------------------------|------------------|------------------
Price per million requests | $3.50            | $1.00 (71% cheaper)
WebSocket support          | YES              | NO
Usage plans / API keys     | YES              | NO
Request validation         | YES (JSON Schema)| NO (validate in Lambda)
Caching                    | Built-in         | NO (use CloudFront)
WAF integration            | YES              | NO
Custom domain              | YES              | YES
Authorizers                | Lambda, Cognito  | Lambda, JWT (native)
Request/response transform | VTL templates    | NO
Private API (VPC only)     | YES              | NO
Max timeout                | 29 seconds       | 29 seconds

RECOMMENDATION:
  - HTTP API for 90% of cases (cheaper, faster, simpler)
  - REST API when you need: WAF, caching, request validation, usage plans, VTL transforms
```

### API Gateway + Lambda Integration Pattern
```typescript
// Typed Lambda handler with API Gateway v2 (HTTP API)
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  tier: z.enum(['FREE', 'STARTER', 'PLUS', 'SMART', 'PRO']),
}).strict();  // .strict() per Stone AI security policy

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    if (!event.body) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing body' }) };
    }

    const parsed = CreateUserSchema.safeParse(JSON.parse(event.body));
    if (!parsed.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Validation failed', details: parsed.error.issues }),
      };
    }

    const user = await createUser(parsed.data);

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    };
  } catch (error) {
    console.error('CreateUser error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
```

---

## 3. Step Functions — Orchestration

### When to Use
- Multi-step workflows with error handling and retries
- Workflows lasting longer than Lambda's 15-minute timeout
- Human-in-the-loop approval processes
- Parallel processing with aggregation
- Saga pattern for distributed transactions

### Standard vs. Express
```
Standard Workflows:
  - Max duration: 1 year
  - Exactly-once execution
  - $0.025 per 1,000 state transitions
  - Use for: long-running, durable workflows

Express Workflows:
  - Max duration: 5 minutes
  - At-least-once execution
  - $0.00001667 per GB-second (like Lambda pricing)
  - Use for: high-volume, short-duration event processing
```

### Saga Pattern for Distributed Transactions
```json
{
  "Comment": "Order Processing Saga",
  "StartAt": "ReserveInventory",
  "States": {
    "ReserveInventory": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456:function:reserve-inventory",
      "ResultPath": "$.inventoryReservation",
      "Catch": [{
        "ErrorEquals": ["States.ALL"],
        "Next": "OrderFailed"
      }],
      "Next": "ProcessPayment"
    },
    "ProcessPayment": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456:function:process-payment",
      "ResultPath": "$.paymentResult",
      "Catch": [{
        "ErrorEquals": ["States.ALL"],
        "Next": "ReleaseInventory"
      }],
      "Next": "FulfillOrder"
    },
    "FulfillOrder": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456:function:fulfill-order",
      "Catch": [{
        "ErrorEquals": ["States.ALL"],
        "Next": "RefundPayment"
      }],
      "End": true
    },
    "RefundPayment": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456:function:refund-payment",
      "Next": "ReleaseInventory"
    },
    "ReleaseInventory": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:123456:function:release-inventory",
      "Next": "OrderFailed"
    },
    "OrderFailed": {
      "Type": "Fail",
      "Error": "OrderProcessingFailed",
      "Cause": "One or more steps in the order saga failed"
    }
  }
}
```

### Map State for Parallel Processing
```json
{
  "ProcessAllItems": {
    "Type": "Map",
    "ItemsPath": "$.items",
    "MaxConcurrency": 40,
    "Iterator": {
      "StartAt": "ProcessItem",
      "States": {
        "ProcessItem": {
          "Type": "Task",
          "Resource": "arn:aws:lambda:...:process-item",
          "Retry": [{
            "ErrorEquals": ["States.TaskFailed"],
            "IntervalSeconds": 2,
            "MaxAttempts": 3,
            "BackoffRate": 2.0
          }],
          "End": true
        }
      }
    },
    "Next": "AggregateResults"
  }
}
```

---

## 4. EventBridge — Event Bus

### Core Patterns

#### Pattern: Event-Driven Microservices
```
User Service → EventBridge (event bus) → Rules:
  ├── Rule: "user.created" → Lambda: SendWelcomeEmail
  ├── Rule: "user.created" → Lambda: InitializeFreeTier
  ├── Rule: "user.created" → SQS: AnalyticsQueue
  ├── Rule: "user.upgraded" → Lambda: ProcessTierUpgrade
  └── Rule: "user.deleted" → Step Functions: CleanupWorkflow

Event structure:
{
  "source": "stone-ai.user-service",
  "detail-type": "user.created",
  "detail": {
    "userId": "user_abc123",
    "email": "stone@example.com",
    "tier": "FREE",
    "timestamp": "2026-03-10T00:00:00Z"
  }
}
```

#### Pattern: Scheduled Events (Cron Replacement)
```
EventBridge Schedule:
  rate(5 minutes)  → Lambda: HealthCheck
  rate(1 hour)     → Lambda: CleanupExpiredSessions
  cron(0 2 * * ? *) → Lambda: NightlyBackupVerification
  cron(0 9 1 * ? *) → Lambda: MonthlyBillingReport
```

#### Pattern: Cross-Account Event Routing
```
Account A (Production) → EventBridge → Event Bus Policy → Account B (Analytics)
  - Production emits events
  - Analytics account receives copy of all events
  - No direct cross-account Lambda invocation needed
  - Clean boundary between operational and analytical workloads
```

---

## 5. SQS/SNS Patterns

### SQS Standard vs. FIFO
```
Standard Queue:
  - At-least-once delivery (may get duplicates)
  - Best-effort ordering
  - Nearly unlimited throughput
  - Use for: background jobs, notifications, decoupling

FIFO Queue:
  - Exactly-once processing
  - Strict ordering within message group
  - 3,000 msg/s with batching (300 without)
  - Use for: financial transactions, inventory, command ordering
  - REQUIRES: MessageGroupId and MessageDeduplicationId
```

### Dead Letter Queue Pattern
```typescript
// SQS consumer with DLQ handling
import { SQSHandler, SQSRecord } from 'aws-lambda';

export const handler: SQSHandler = async (event) => {
  const failedRecords: SQSRecord[] = [];

  for (const record of event.Records) {
    try {
      const body = JSON.parse(record.body);
      await processMessage(body);
    } catch (error) {
      console.error(`Failed to process message ${record.messageId}:`, error);
      failedRecords.push(record);
    }
  }

  // Partial batch failure — only retry failed messages
  if (failedRecords.length > 0) {
    return {
      batchItemFailures: failedRecords.map(r => ({
        itemIdentifier: r.messageId,
      })),
    };
  }
};

// DLQ alarm — alert when messages land in DLQ
// CloudWatch Alarm: ApproximateNumberOfMessagesVisible > 0 on DLQ
// Action: SNS → PagerDuty/Slack
```

### Fan-Out Pattern: SNS + SQS
```
SNS Topic: "order-completed"
  ├── SQS: email-queue       → Lambda: SendConfirmation
  ├── SQS: analytics-queue   → Lambda: TrackConversion
  ├── SQS: inventory-queue   → Lambda: UpdateStock
  └── SQS: partner-queue     → Lambda: NotifyPartner

Benefits:
  - Each consumer processes independently
  - Each has its own DLQ
  - Each can scale independently
  - Adding new consumers = subscribe new SQS queue (no code changes)
```

---

## 6. DynamoDB Single-Table Design

### The Philosophy
```
Relational thinking:  One entity type per table, JOIN at query time
DynamoDB thinking:    Multiple entity types per table, pre-JOIN at write time

Why single table?
  - DynamoDB charges per table (provisioned capacity per table)
  - Transactions can span items in one table (but not across tables)
  - Fewer tables = fewer CloudFormation resources = simpler infrastructure
  - All access patterns served by PK/SK + GSIs
```

### Stone AI Single-Table Example
```
Table: StoneAI

PK                  | SK                      | GSI1PK              | GSI1SK           | Data
--------------------|-------------------------|----------------------|------------------|--------
USER#clerk_abc      | PROFILE                 | EMAIL#stone@ai.com  | USER#clerk_abc   | {name, tier, createdAt}
USER#clerk_abc      | AGENT#1                 | TIER#FREE           | AGENT#1          | {name: "Helper", uses: 47}
USER#clerk_abc      | AGENT#44                | TIER#PRO             | AGENT#44         | {name: "Chaos", uses: 3}
USER#clerk_abc      | BESTIE                  | TIER#STARTER         | BESTIE           | {name, style, traits}
USER#clerk_abc      | CHAT#2026-03-10T12:00  | —                    | —                | {messages, agentId}
USER#clerk_abc      | SUB#sub_xyz             | STATUS#active        | RENEW#2026-04-10 | {stripe data}
REFERRAL#abc123     | REFERRED#clerk_def      | REFERRER#clerk_abc   | CREATED#2026-03  | {status, reward}

Access patterns served:
  1. Get user profile:        PK=USER#id, SK=PROFILE
  2. List user's agents:      PK=USER#id, SK begins_with "AGENT#"
  3. Get user by email:       GSI1, PK=EMAIL#email
  4. List all FREE agents:    GSI1, PK=TIER#FREE
  5. Find active subs:        GSI1, PK=STATUS#active
  6. Find expiring subs:      GSI1, PK=STATUS#active, SK begins_with "RENEW#2026-03"
  7. Get referral tree:       GSI1, PK=REFERRER#id
```

### Transactions
```typescript
import { DynamoDBDocumentClient, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';

// Upgrade user tier + update subscription atomically
const upgradeUserTier = async (userId: string, newTier: string, subId: string) => {
  await ddbDocClient.send(new TransactWriteCommand({
    TransactItems: [
      {
        Update: {
          TableName: 'StoneAI',
          Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
          UpdateExpression: 'SET tier = :tier, updatedAt = :now',
          ExpressionAttributeValues: { ':tier': newTier, ':now': new Date().toISOString() },
          ConditionExpression: 'attribute_exists(PK)',  // User must exist
        },
      },
      {
        Update: {
          TableName: 'StoneAI',
          Key: { PK: `USER#${userId}`, SK: `SUB#${subId}` },
          UpdateExpression: 'SET #status = :active, tier = :tier',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: { ':active': 'active', ':tier': newTier },
        },
      },
    ],
  }));
};
```

---

## 7. Serverless Cost Modeling

### Cost Comparison Calculator
```
Scenario: API handling 10M requests/month, avg 200ms, 256MB memory

Lambda:
  Compute:  10M * 0.2s * 0.25GB * $0.0000166667 = $8.33
  Requests: 10M * $0.20/1M = $2.00
  Total Lambda: $10.33/month

API Gateway (HTTP API):
  10M * $1.00/1M = $10.00/month

DynamoDB (On-Demand):
  10M reads * $0.25/1M = $2.50
  2M writes * $1.25/1M = $2.50
  Storage 10GB * $0.25 = $2.50
  Total DynamoDB: $7.50/month

TOTAL SERVERLESS: ~$28/month

Equivalent EC2:
  t3.medium (2 vCPU, 4GB): $30/month
  + ALB: $16/month + $0.008/LCU-hour
  + RDS t3.medium: $49/month
  + NAT Gateway: $32/month
  TOTAL EC2: ~$130/month (+ ops burden)

Crossover point: ~100M requests/month, serverless starts losing on cost
At 1B requests/month: Lambda alone = $100+, EC2 reserved = more cost-effective
```

### Hidden Costs to Watch
```
1. CloudWatch Logs:     Lambda logs EVERYTHING by default
   Fix: Set log retention (7 days for dev, 30 for staging, 90 for prod)
   Fix: Filter what you log, structured logging only

2. Data Transfer:       Cross-AZ, cross-region, internet egress
   Fix: Keep services in same AZ when possible
   Fix: Use VPC endpoints for AWS services

3. API Gateway:         REST API is 3.5x more expensive than HTTP API
   Fix: Use HTTP API unless you need REST-specific features

4. DynamoDB Scans:      Full table scans consume massive read capacity
   Fix: NEVER scan in production. Design access patterns around queries.

5. Step Functions:       Standard workflows charge per state transition
   Fix: Minimize states, use Express for high-volume short workflows
```

---

## 8. Serverless Anti-Patterns

### 1. Lambda Monolith
```
BAD: One Lambda function handling all API routes
  - 50MB deployment package
  - 3-second cold starts
  - Any change redeploys everything

GOOD: One function per route (or per resource group)
  - Small packages (< 5MB ideally)
  - Fast cold starts
  - Independent deployment and scaling
```

### 2. Synchronous Chain
```
BAD:  API Gateway → Lambda A → Lambda B → Lambda C → Response
  - Latency compounds
  - Any failure = total failure
  - Paying for Lambda A to wait for B and C

GOOD: API Gateway → Lambda A → {SQS|EventBridge} → Lambda B → {SQS|EventBridge} → Lambda C
  - Async where possible
  - Each function independent
  - Built-in retry and DLQ
```

### 3. Lambda for Everything
```
DON'T use Lambda for:
  - WebSocket connections (use API Gateway WebSocket API directly)
  - Long-running processes > 15min (use ECS/Fargate)
  - High-throughput stream processing (use Kinesis Data Firehose)
  - Static file serving (use S3 + CloudFront)
  - Container-based ML inference (use SageMaker or ECS)
```

### 4. Not Using Dead Letter Queues
```
Every async Lambda invocation MUST have a DLQ or on-failure destination.
Without it, failed events are silently dropped.

// serverless.yml / SAM template
Functions:
  ProcessOrder:
    Events:
      - SQS:
          Queue: !GetAtt OrderQueue.Arn
          BatchSize: 10
          FunctionResponseTypes:
            - ReportBatchItemFailures   # Partial batch failure support
    DeadLetterQueue:
      TargetArn: !GetAtt OrderDLQ.Arn
```

---

## 9. Testing Serverless Applications

```typescript
// Local testing with SAM CLI
// sam local invoke "MyFunction" -e event.json
// sam local start-api  (local API Gateway emulator)

// Unit testing Lambda handlers
import { handler } from './create-user';
import { APIGatewayProxyEventV2 } from 'aws-lambda';

describe('CreateUser Lambda', () => {
  it('should create user with valid input', async () => {
    const event: Partial<APIGatewayProxyEventV2> = {
      body: JSON.stringify({ email: 'test@stone-ai.net', name: 'Test', tier: 'FREE' }),
      requestContext: { http: { method: 'POST' } } as any,
    };

    const result = await handler(event as APIGatewayProxyEventV2);
    expect(result.statusCode).toBe(201);
  });

  it('should reject invalid tier', async () => {
    const event: Partial<APIGatewayProxyEventV2> = {
      body: JSON.stringify({ email: 'test@stone-ai.net', name: 'Test', tier: 'INVALID' }),
    };

    const result = await handler(event as APIGatewayProxyEventV2);
    expect(result.statusCode).toBe(400);
  });

  it('should reject extra fields (.strict())', async () => {
    const event: Partial<APIGatewayProxyEventV2> = {
      body: JSON.stringify({ email: 'test@stone-ai.net', name: 'Test', tier: 'FREE', admin: true }),
    };

    const result = await handler(event as APIGatewayProxyEventV2);
    expect(result.statusCode).toBe(400); // .strict() rejects unknown keys
  });
});
```

---

*This seed is maintained by the Cloud Architecture team. Last validated: 2026-03.*
