# Developer Experience Optimization for Stone AI Tools

## Seed Classification
- **Domain**: Backend Engineering / Developer Relations
- **Platform**: Stone AI Tools (tools.stone-ai.net)
- **Complexity**: Intermediate
- **Prerequisites**: API design, UX principles, technical writing
- **Last Updated**: 2026-03-09

---

## 1. The North Star Metric: Time to First Successful Call

### Measuring Developer Success

```
TTFC (Time to First Call) Funnel:

  Visit landing page          ← 100% (awareness)
       │
  Create account              ← 60% (intent)
       │
  Generate API key            ← 45% (activation)
       │
  Make first API call         ← 30% (engagement)
       │
  First SUCCESSFUL call       ← 25% (success) ← THIS IS THE METRIC
       │
  Second day return           ← 15% (retention)
       │
  Paid conversion             ← 5% (revenue)

Target TTFC: Under 5 minutes from signup
Industry benchmark: 15-30 minutes
```

### Tracking Implementation

```typescript
// File: src/services/developer-metrics.ts

interface OnboardingMilestones {
  signedUp: number;           // Timestamp
  createdApiKey: number;      // Timestamp
  firstApiCall: number;       // Timestamp
  firstSuccessfulCall: number; // Timestamp
  firstAgentInvoke: number;   // Timestamp
  installedSdk: number;       // Detected from User-Agent
}

class DeveloperMetrics {
  async trackMilestone(tenantId: string, milestone: keyof OnboardingMilestones): Promise<void> {
    const key = `onboarding:${tenantId}`;
    const existing = await redis.hget(key, milestone);

    if (existing) return; // Already tracked

    const now = Date.now();
    await redis.hset(key, milestone, now.toString());
    await redis.expire(key, 90 * 24 * 60 * 60); // 90 day TTL

    // Calculate TTFC if this is the success milestone
    if (milestone === 'firstSuccessfulCall') {
      const signedUp = parseInt(await redis.hget(key, 'signedUp') ?? '0', 10);
      if (signedUp > 0) {
        const ttfcMs = now - signedUp;
        const ttfcMinutes = Math.round(ttfcMs / 60_000);

        metrics.histogram('developer.ttfc_minutes', {}, ttfcMinutes);

        logger.info('Developer TTFC recorded', {
          tenantId,
          ttfcMinutes,
          ttfcMs,
        });

        // Alert if TTFC is too high (investigate friction)
        if (ttfcMinutes > 30) {
          metrics.counter('developer.ttfc_over_30min', {});
        }
      }
    }

    metrics.counter('developer.milestone_reached', { milestone });
  }

  async getOnboardingFunnel(period: string): Promise<FunnelReport> {
    // Aggregate milestone data for analytics dashboard
    const tenants = await db.raw.tenant.findMany({
      where: {
        createdAt: {
          gte: new Date(`${period}-01`),
          lt: new Date(`${period}-01`).setMonth(new Date(`${period}-01`).getMonth() + 1),
        },
      },
      select: { id: true },
    });

    const milestoneData: Record<string, number> = {
      signedUp: tenants.length,
      createdApiKey: 0,
      firstApiCall: 0,
      firstSuccessfulCall: 0,
      firstAgentInvoke: 0,
      installedSdk: 0,
    };

    for (const tenant of tenants) {
      const data = await redis.hgetall(`onboarding:${tenant.id}`);
      for (const milestone of Object.keys(milestoneData)) {
        if (data[milestone]) milestoneData[milestone]++;
      }
    }

    return {
      period,
      totalSignups: tenants.length,
      funnel: milestoneData,
      conversionRates: {
        signupToKey: milestoneData.createdApiKey / milestoneData.signedUp,
        keyToCall: milestoneData.firstApiCall / milestoneData.createdApiKey,
        callToSuccess: milestoneData.firstSuccessfulCall / milestoneData.firstApiCall,
      },
    };
  }
}
```

---

## 2. Onboarding Flow

### 2.1 Post-Signup Experience

```
Developer Onboarding Steps:

Step 1: Welcome + Quick Setup (30 seconds)
┌─────────────────────────────────────────────┐
│ Welcome to Stone AI Tools!                   │
│                                              │
│ Let's get you set up in 3 steps:             │
│                                              │
│ 1. ✅ Account created                        │
│ 2. 🔑 Create your API key                   │
│ 3. 🚀 Make your first API call              │
│                                              │
│ What are you building?                       │
│ [○ SaaS product] [○ Internal tool]          │
│ [○ Mobile app]   [○ Just exploring]         │
│                                              │
│ Primary language?                            │
│ [TypeScript] [Python] [Go] [Other]          │
│                                              │
│ [Continue →]                                 │
└─────────────────────────────────────────────┘

Step 2: API Key Creation (15 seconds)
┌─────────────────────────────────────────────┐
│ Your API Key                                 │
│                                              │
│ ┌─────────────────────────────────────────┐ │
│ │ sat_7kBxR2mN4pQ9vW1yZ3cA5eG8hJ0lT6uI │ │
│ │                              [📋 Copy] │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ ⚠️ Copy this key now. You won't see it      │
│ again. Store it in your environment          │
│ variables:                                   │
│                                              │
│ export STONE_AI_API_KEY="sat_7kBxR2..."     │
│                                              │
│ [I've saved my key →]                        │
└─────────────────────────────────────────────┘

Step 3: First Call (tailored to chosen language)
┌─────────────────────────────────────────────┐
│ Make Your First Call                         │
│                                              │
│ Install the SDK:                             │
│ ┌───────────────────────────────────────┐   │
│ │ npm install @stone-ai/tools-sdk       │   │
│ └───────────────────────────────────────┘   │
│                                              │
│ Try this code:                               │
│ ┌───────────────────────────────────────┐   │
│ │ import StoneAITools from '@stone-ai/  │   │
│ │   tools-sdk';                         │   │
│ │                                       │   │
│ │ const client = new StoneAITools();    │   │
│ │                                       │   │
│ │ const res = await client.agents       │   │
│ │   .invoke('security-scanner', {       │   │
│ │     prompt: 'Check this code...',     │   │
│ │   });                                 │   │
│ │                                       │   │
│ │ console.log(res.content);             │   │
│ └───────────────────────────────────────┘   │
│                                              │
│ Or try it right here:                        │
│ [Open Playground →]                          │
│                                              │
│ [Skip to Dashboard →]                        │
└─────────────────────────────────────────────┘
```

### 2.2 Contextual Onboarding Checklist

```typescript
// File: src/components/dashboard/onboarding-checklist.tsx

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action: string;    // Button text
  href: string;
}

function OnboardingChecklist({ tenantId }: { tenantId: string }) {
  const steps: OnboardingStep[] = [
    {
      id: 'create-key',
      title: 'Create an API key',
      description: 'Generate your first API key to authenticate requests',
      completed: hasApiKey,
      action: 'Create Key',
      href: '/dashboard/api-keys',
    },
    {
      id: 'first-call',
      title: 'Make your first API call',
      description: 'Use the playground or SDK to invoke an agent',
      completed: hasFirstCall,
      action: 'Open Playground',
      href: '/playground',
    },
    {
      id: 'install-sdk',
      title: 'Install an SDK',
      description: 'Add the TypeScript, Python, or Go SDK to your project',
      completed: hasInstalledSdk,
      action: 'View SDKs',
      href: '/docs/sdks',
    },
    {
      id: 'setup-webhook',
      title: 'Set up a webhook (optional)',
      description: 'Receive notifications when agent tasks complete',
      completed: hasWebhook,
      action: 'Create Webhook',
      href: '/dashboard/webhooks',
    },
  ];

  const completedCount = steps.filter(s => s.completed).length;

  // Hide checklist after all steps completed
  if (completedCount === steps.length) return null;

  return (
    <div className="border rounded-lg p-4 mb-6 bg-blue-50">
      <h3 className="font-semibold">Getting Started ({completedCount}/{steps.length})</h3>
      <div className="mt-3 space-y-2">
        {steps.map(step => (
          <div key={step.id} className="flex items-center gap-3">
            {step.completed ? (
              <CheckCircle className="text-green-500" />
            ) : (
              <Circle className="text-gray-300" />
            )}
            <div className="flex-1">
              <span className={step.completed ? 'line-through text-gray-400' : ''}>
                {step.title}
              </span>
            </div>
            {!step.completed && (
              <Link href={step.href} className="text-sm text-blue-600 hover:underline">
                {step.action}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 3. Error Messages That Help

### 3.1 Error Message Design Principles

```
Good Error Messages Have:

1. WHAT went wrong (clear, specific)
2. WHY it happened (context)
3. HOW to fix it (actionable next step)
4. WHERE to learn more (docs link)

BAD:  { "error": "forbidden" }
GOOD: {
  "error": {
    "code": "insufficient_scope",
    "message": "This API key does not have the 'agents:invoke' scope required for this endpoint.",
    "help": "Create a new API key with the 'agents:invoke' scope, or update your existing key.",
    "docs_url": "https://tools.stone-ai.net/docs/authentication#scopes",
    "request_id": "req_abc123"
  }
}
```

### 3.2 Error Response Catalog

```typescript
// File: src/lib/errors/error-catalog.ts

const ERROR_CATALOG: Record<string, ErrorDefinition> = {
  // Authentication errors
  missing_api_key: {
    status: 401,
    message: 'No API key provided.',
    help: 'Include your API key in the Authorization header: Authorization: Bearer sat_...',
    docs: '/docs/authentication',
  },
  invalid_api_key: {
    status: 401,
    message: 'The API key provided is invalid or has been revoked.',
    help: 'Check that you\'re using the correct API key. You can create a new one in the dashboard.',
    docs: '/docs/authentication',
  },
  expired_api_key: {
    status: 401,
    message: 'This API key has expired.',
    help: 'Create a new API key in your dashboard at tools.stone-ai.net/dashboard/api-keys',
    docs: '/docs/authentication#key-expiry',
  },

  // Scope errors
  insufficient_scope: {
    status: 403,
    message: (required: string[], has: string[]) =>
      `This API key has scopes [${has.join(', ')}] but this endpoint requires [${required.join(', ')}].`,
    help: 'Create a new API key with the required scopes, or add scopes to your existing key.',
    docs: '/docs/authentication#scopes',
  },

  // Tier errors
  tier_not_authorized: {
    status: 403,
    message: (agentTier: string, userTier: string) =>
      `This agent requires the ${agentTier} tier, but your plan is ${userTier}.`,
    help: 'Upgrade your plan to access this agent.',
    docs: '/pricing',
    extra: { upgrade_url: 'https://tools.stone-ai.net/pricing' },
  },

  // Rate limiting
  rate_limit_exceeded: {
    status: 429,
    message: (limit: number, resetIn: number) =>
      `Rate limit of ${limit} requests per minute exceeded. Resets in ${resetIn} seconds.`,
    help: 'Wait for the rate limit to reset, implement exponential backoff, or upgrade your plan for higher limits.',
    docs: '/docs/rate-limits',
  },

  // Validation errors
  validation_error: {
    status: 422,
    message: 'Request validation failed.',
    help: 'Check the errors array below for specific field issues.',
    docs: '/docs/api/v1',
  },

  prompt_too_long: {
    status: 422,
    message: (length: number, max: number) =>
      `Prompt is ${length.toLocaleString()} characters but maximum is ${max.toLocaleString()}.`,
    help: 'Shorten your prompt or split it into multiple requests.',
    docs: '/docs/guides/prompt-length',
  },

  // Usage errors
  quota_exceeded: {
    status: 429,
    message: (used: number, limit: number) =>
      `Monthly quota exceeded: ${used.toLocaleString()} of ${limit.toLocaleString()} calls used.`,
    help: 'Upgrade your plan for a higher monthly limit, or wait until the next billing period.',
    docs: '/docs/rate-limits#monthly-quota',
    extra: { upgrade_url: 'https://tools.stone-ai.net/pricing' },
  },

  // Server errors
  agent_unavailable: {
    status: 503,
    message: 'The requested agent is temporarily unavailable.',
    help: 'This is usually temporary. Retry your request after the Retry-After period.',
    docs: '/docs/errors/503',
  },
  agent_timeout: {
    status: 504,
    message: 'The agent did not respond within the timeout period.',
    help: 'Try again with a shorter prompt or lower maxTokens. If this persists, contact support.',
    docs: '/docs/errors/504',
  },
};

function buildErrorResponse(
  code: string,
  requestId: string,
  extra?: Record<string, unknown>
): ApiErrorResponse {
  const def = ERROR_CATALOG[code];
  if (!def) {
    return {
      error: {
        code: 'unknown_error',
        message: 'An unexpected error occurred.',
        request_id: requestId,
        docs_url: 'https://tools.stone-ai.net/docs/errors',
      },
    };
  }

  const message = typeof def.message === 'function'
    ? def.message(...(extra?.args as any[] ?? []))
    : def.message;

  return {
    error: {
      code,
      message,
      help: def.help,
      request_id: requestId,
      docs_url: `https://tools.stone-ai.net${def.docs}`,
      ...(def.extra ?? {}),
      ...(extra ?? {}),
    },
  };
}
```

---

## 4. Interactive Playground

### 4.1 Playground Features

```
Playground Capabilities:

1. Agent Selection    → Browse and select from all available agents
2. Input Builder      → Form-based input with JSON editor fallback
3. Live Execution     → Real API calls with your API key
4. Response Display   → Formatted output with syntax highlighting
5. Code Generation    → Generate SDK code from your playground session
6. History            → Last 50 playground sessions saved
7. Share              → Generate shareable links (with sanitized keys)
8. Diff View          → Compare two agent responses side-by-side
```

### 4.2 Code Generation from Playground

```typescript
// File: src/components/playground/code-generator.tsx

function generateCodeFromPlayground(session: PlaygroundSession): Record<string, string> {
  const { agentId, prompt, context, options } = session;

  return {
    typescript: `import StoneAITools from '@stone-ai/tools-sdk';

const client = new StoneAITools();

const response = await client.agents.invoke('${agentId}', {
  prompt: ${JSON.stringify(prompt)},${context ? `
  context: ${JSON.stringify(context, null, 2)},` : ''}${options ? `
  options: ${JSON.stringify(options, null, 2)},` : ''}
});

console.log(response.content);`,

    python: `from stone_ai_tools import StoneAITools

client = StoneAITools()

response = client.agents.invoke("${agentId}",
    prompt=${JSON.stringify(prompt)},${context ? `
    context=${JSON.stringify(context)},` : ''}${options ? `
    options=${JSON.stringify(options)},` : ''}
)

print(response.content)`,

    curl: `curl -X POST "https://api.tools.stone-ai.net/v1/agents/${agentId}/invoke" \\
  -H "Authorization: Bearer $STONE_AI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({ prompt, context, options }, null, 2)}'`,
  };
}
```

---

## 5. Postman Collection

### 5.1 Auto-Generated Postman Collection

```typescript
// File: scripts/generate-postman.ts

function generatePostmanCollection(): PostmanCollection {
  const spec = loadOpenApiSpec();

  return {
    info: {
      name: 'Stone AI Tools API',
      description: 'Complete API collection for Stone AI Tools. Import into Postman to get started quickly.',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    auth: {
      type: 'bearer',
      bearer: [{ key: 'token', value: '{{STONE_AI_API_KEY}}' }],
    },
    variable: [
      {
        key: 'baseUrl',
        value: 'https://api.tools.stone-ai.net/v1',
        description: 'API base URL. Change to sandbox.tools.stone-ai.net/v1 for testing.',
      },
      {
        key: 'STONE_AI_API_KEY',
        value: '',
        description: 'Your Stone AI Tools API key',
      },
    ],
    event: [
      {
        listen: 'prerequest',
        script: {
          exec: [
            'if (!pm.variables.get("STONE_AI_API_KEY")) {',
            '  console.warn("Set your STONE_AI_API_KEY in the collection variables!");',
            '}',
          ],
        },
      },
    ],
    item: [
      {
        name: 'Quick Start',
        description: 'Try these requests first to get started',
        item: [
          buildPostmanRequest('List Agents', 'GET', '/agents', null, 'List all available AI agents'),
          buildPostmanRequest('Invoke Agent', 'POST', '/agents/security-scanner/invoke',
            { prompt: 'Scan this code: function login(u, p) { return db.query("SELECT * FROM users WHERE name=\'" + u + "\'"); }' },
            'Invoke the Security Scanner agent'
          ),
          buildPostmanRequest('Check Usage', 'GET', '/usage/summary', null, 'View your API usage'),
        ],
      },
      // ... more folders from spec
    ],
  };
}
```

---

## 6. SDK Quick Start Guides

### 6.1 TypeScript Quick Start

```markdown
# TypeScript SDK Quick Start

## Installation

```bash
npm install @stone-ai/tools-sdk
# or
yarn add @stone-ai/tools-sdk
# or
pnpm add @stone-ai/tools-sdk
```

## Configuration

Set your API key as an environment variable:

```bash
export STONE_AI_API_KEY="sat_your_key_here"
```

Or pass it directly:

```typescript
const client = new StoneAITools({ apiKey: 'sat_...' });
```

## Common Patterns

### List available agents
```typescript
const agents = await client.agents.list({ category: 'coding' });
```

### Invoke with streaming
```typescript
const stream = client.agents.invokeStream('agent_writer', {
  prompt: 'Write a blog post about TypeScript 5.0',
});

for await (const chunk of stream) {
  process.stdout.write(chunk.content);
}
```

### Error handling
```typescript
import { RateLimitError, AuthenticationError } from '@stone-ai/tools-sdk';

try {
  await client.agents.invoke('agent_test', { prompt: '...' });
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter}s`);
  } else if (error instanceof AuthenticationError) {
    console.log('Check your API key');
  }
}
```

### Auto-pagination
```typescript
for await (const agent of client.agents.listAutoPaginate()) {
  console.log(agent.name, agent.tier);
}
```
```

---

## 7. Developer Feedback Loop

### 7.1 In-Context Feedback

```typescript
// File: src/components/docs/feedback-widget.tsx

function DocFeedbackWidget({ pageId }: { pageId: string }) {
  const [rating, setRating] = useState<'helpful' | 'not-helpful' | null>(null);
  const [feedback, setFeedback] = useState('');

  const submit = async () => {
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pageId,
        rating,
        feedback,
        url: window.location.href,
      }),
    });
  };

  return (
    <div className="border-t mt-8 pt-4">
      <p className="text-sm font-medium">Was this page helpful?</p>
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => setRating('helpful')}
          className={rating === 'helpful' ? 'bg-green-100' : ''}
        >
          Yes
        </button>
        <button
          onClick={() => setRating('not-helpful')}
          className={rating === 'not-helpful' ? 'bg-red-100' : ''}
        >
          No
        </button>
      </div>

      {rating === 'not-helpful' && (
        <div className="mt-2">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="What were you looking for?"
            className="w-full p-2 border rounded text-sm"
            rows={3}
          />
          <button onClick={submit} className="mt-2 text-sm text-blue-600">
            Send Feedback
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## 8. Status Page

```typescript
// File: src/app/status/page.tsx

// Public status page showing real-time API health

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage';
  latency: number;   // p95 in ms
  uptime: number;    // Last 30 days percentage
}

/*
Status Page Layout:

Stone AI Tools Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All Systems Operational ✅

API Gateway           ✅ Operational    p95: 45ms
Agent Execution       ✅ Operational    p95: 2.1s
Authentication        ✅ Operational    p95: 12ms
Webhook Delivery      ✅ Operational    p95: 340ms
Developer Dashboard   ✅ Operational    p95: 180ms

Uptime (Last 30 Days)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
API Gateway:       99.98%
Agent Execution:   99.95%
Authentication:    99.99%

Recent Incidents
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mar 5, 2026 — Agent latency increase (resolved)
Feb 28, 2026 — Webhook delivery delays (resolved)
*/
```

---

## Summary

Developer experience for Stone AI Tools is optimized around minimizing friction at every step:

1. **TTFC Tracking**: Time-to-first-successful-call is the north star metric, tracked per tenant
2. **Guided Onboarding**: 3-step wizard tailored by language preference, checklist in dashboard
3. **Helpful Errors**: Every error includes what happened, why, how to fix, and where to learn more
4. **Interactive Playground**: Test agents live with code generation for copy-paste integration
5. **Postman Collection**: One-click import for instant API exploration
6. **SDK Quick Starts**: Language-specific guides with common patterns and error handling
7. **Feedback Loops**: In-context doc feedback, TTFC funnel analysis, friction detection
8. **Status Page**: Public API health with latency percentiles and incident history

The goal is that a developer signs up, generates a key, and makes a successful API call in under 5 minutes — then never has to read docs again because the SDK is intuitive and errors are self-explanatory.
