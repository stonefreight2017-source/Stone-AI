# Developer Portal Design for Stone AI Tools

## Seed Classification
- **Domain**: Backend Engineering / Developer Experience
- **Platform**: Stone AI Tools (tools.stone-ai.net)
- **Complexity**: Advanced
- **Prerequisites**: API design, frontend architecture, technical writing
- **Last Updated**: 2026-03-09

---

## 1. Developer Portal Architecture

### Portal Components

```
Developer Portal Structure:

tools.stone-ai.net/
├── /                       # Landing page + value prop
├── /docs                   # Documentation hub
│   ├── /docs/getting-started    # Quickstart guide
│   ├── /docs/api/v1/           # Interactive API reference
│   ├── /docs/sdks/             # SDK guides (TS, Python, Go)
│   ├── /docs/guides/           # How-to guides
│   ├── /docs/concepts/         # Architecture concepts
│   ├── /docs/errors/           # Error code reference
│   ├── /docs/rate-limits       # Rate limiting docs
│   ├── /docs/webhooks          # Webhook reference
│   └── /docs/changelog         # API changelog
├── /dashboard              # Authenticated developer dashboard
│   ├── /dashboard/overview      # Usage overview
│   ├── /dashboard/api-keys      # API key management
│   ├── /dashboard/usage         # Detailed usage analytics
│   ├── /dashboard/webhooks      # Webhook management
│   ├── /dashboard/billing       # Billing & plan management
│   ├── /dashboard/team          # Team members
│   └── /dashboard/settings      # Account settings
├── /agents                 # Agent marketplace/catalog
│   ├── /agents/:agentId         # Agent detail page
│   └── /agents/categories/      # Category browsing
├── /playground             # Interactive API playground
├── /pricing                # Pricing page
├── /status                 # API status page
└── /blog                   # Developer blog
```

### Technology Stack

```
Portal Tech Stack:

Frontend:        Next.js 16 + TypeScript + Tailwind
API Reference:   Custom OpenAPI renderer (Mintlify-inspired)
Code Examples:   Shiki syntax highlighting, multi-language tabs
Playground:      Monaco editor + real API calls
Authentication:  Clerk (shared with Stone AI main app)
Search:          Algolia DocSearch
Analytics:       PostHog (developer journey tracking)
```

---

## 2. Interactive API Documentation

### 2.1 API Reference Page Design

```typescript
// File: src/app/docs/api/[version]/[...slug]/page.tsx

interface ApiReferencePage {
  endpoint: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    summary: string;
    description: string;
    tags: string[];
    deprecated?: boolean;
  };
  parameters: Parameter[];
  requestBody?: RequestBody;
  responses: Response[];
  codeExamples: CodeExample[];
  tryIt: TryItConfig;  // Interactive "Try It" panel
}

// Each endpoint page has three columns:
// Left: Description + parameters
// Center: Code examples (multi-language)
// Right: Try It panel (live API calls)

/*
┌────────────────────────────────────────────────────────────────┐
│ POST /v1/agents/{agentId}/invoke                               │
├──────────────────┬─────────────────────┬───────────────────────┤
│                  │                     │                       │
│ Description      │ Code Examples       │ Try It                │
│                  │                     │                       │
│ Send a prompt to │ [TypeScript] [Python]│ Agent ID: [________] │
│ an AI agent and  │ [Go] [cURL]         │                       │
│ receive response │                     │ Prompt:               │
│                  │ ```typescript       │ [________________]    │
│ Parameters:      │ const res = await   │ [________________]    │
│ • agentId (path) │   client.agents     │                       │
│   required       │   .invoke(          │ Options:              │
│                  │     'agent_writer', │ Max Tokens: [1000]    │
│ Request Body:    │     {               │ Temperature: [0.7]    │
│ • prompt (string)│       prompt: '...' │ Format: [text ▼]      │
│   required       │     }               │                       │
│   1-32000 chars  │   );               │ [▶ Send Request]      │
│                  │ ```                 │                       │
│ • context (obj)  │                     │ Response:             │
│   optional       │                     │ 200 OK (342ms)        │
│                  │                     │ {                     │
│ • options (obj)  │                     │   "content": "..."    │
│   optional       │                     │   "usage": { ... }    │
│                  │                     │ }                     │
│                  │                     │                       │
│ Responses:       │                     │                       │
│ 200 - Success    │                     │                       │
│ 401 - Unauth     │                     │                       │
│ 429 - Rate limit │                     │                       │
│                  │                     │                       │
└──────────────────┴─────────────────────┴───────────────────────┘
*/
```

### 2.2 Multi-Language Code Examples

```typescript
// File: src/components/docs/code-examples.tsx

interface CodeExample {
  language: 'typescript' | 'python' | 'go' | 'curl';
  label: string;
  code: string;
}

function generateCodeExamples(endpoint: EndpointSpec): CodeExample[] {
  return [
    {
      language: 'curl',
      label: 'cURL',
      code: generateCurlExample(endpoint),
    },
    {
      language: 'typescript',
      label: 'TypeScript',
      code: generateTypeScriptExample(endpoint),
    },
    {
      language: 'python',
      label: 'Python',
      code: generatePythonExample(endpoint),
    },
    {
      language: 'go',
      label: 'Go',
      code: generateGoExample(endpoint),
    },
  ];
}

function generateCurlExample(endpoint: EndpointSpec): string {
  const { method, path } = endpoint;
  const parts = [
    `curl -X ${method} "https://api.tools.stone-ai.net${path}"`,
    `  -H "Authorization: Bearer $STONE_AI_API_KEY"`,
    `  -H "Content-Type: application/json"`,
  ];

  if (endpoint.requestBody) {
    parts.push(`  -d '${JSON.stringify(endpoint.requestBody.example, null, 2)}'`);
  }

  return parts.join(' \\\n');
}

function generateTypeScriptExample(endpoint: EndpointSpec): string {
  if (endpoint.operationId === 'invokeAgent') {
    return `import StoneAITools from '@stone-ai/tools-sdk';

const client = new StoneAITools();

const response = await client.agents.invoke('agent_writer', {
  prompt: 'Write a blog post about AI in healthcare',
  options: {
    maxTokens: 2000,
    temperature: 0.7,
    format: 'markdown',
  },
});

console.log(response.content);
console.log('Tokens used:', response.usage.totalTokens);`;
  }
  // ... more examples per operation
}

function generatePythonExample(endpoint: EndpointSpec): string {
  if (endpoint.operationId === 'invokeAgent') {
    return `from stone_ai_tools import StoneAITools

client = StoneAITools()

response = client.agents.invoke("agent_writer",
    prompt="Write a blog post about AI in healthcare",
    options={
        "max_tokens": 2000,
        "temperature": 0.7,
        "format": "markdown",
    },
)

print(response.content)
print(f"Tokens used: {response.usage.total_tokens}")`;
  }
  // ... more examples per operation
}
```

### 2.3 Try It Panel (Live API Calls)

```typescript
// File: src/components/docs/try-it-panel.tsx

'use client';

import { useState, useCallback } from 'react';
import { MonacoEditor } from '@/components/editors/monaco';

interface TryItPanelProps {
  endpoint: EndpointSpec;
  defaultParams?: Record<string, string>;
}

export function TryItPanel({ endpoint, defaultParams }: TryItPanelProps) {
  const [apiKey, setApiKey] = useState('');
  const [params, setParams] = useState(defaultParams ?? {});
  const [body, setBody] = useState(
    endpoint.requestBody?.example
      ? JSON.stringify(endpoint.requestBody.example, null, 2)
      : ''
  );
  const [response, setResponse] = useState<TryItResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const sendRequest = useCallback(async () => {
    setLoading(true);
    const start = performance.now();

    try {
      // Build URL with path params
      let url = `https://api.tools.stone-ai.net${endpoint.path}`;
      for (const [key, value] of Object.entries(params)) {
        url = url.replace(`{${key}}`, encodeURIComponent(value));
      }

      const options: RequestInit = {
        method: endpoint.method,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      };

      if (body && ['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
        options.body = body;
      }

      const res = await fetch(url, options);
      const responseBody = await res.json();
      const duration = Math.round(performance.now() - start);

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        body: responseBody,
        duration,
      });
    } catch (error) {
      setResponse({
        status: 0,
        statusText: 'Network Error',
        headers: {},
        body: { error: error instanceof Error ? error.message : 'Unknown error' },
        duration: Math.round(performance.now() - start),
      });
    } finally {
      setLoading(false);
    }
  }, [apiKey, params, body, endpoint]);

  return (
    <div className="try-it-panel">
      {/* API Key input */}
      <div className="mb-4">
        <label>API Key</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sat_..."
          className="w-full p-2 border rounded font-mono text-sm"
        />
      </div>

      {/* Path parameters */}
      {endpoint.pathParams?.map((param) => (
        <div key={param.name} className="mb-2">
          <label>{param.name}</label>
          <input
            value={params[param.name] ?? ''}
            onChange={(e) => setParams({ ...params, [param.name]: e.target.value })}
            placeholder={param.example ?? param.name}
            className="w-full p-2 border rounded font-mono text-sm"
          />
        </div>
      ))}

      {/* Request body editor */}
      {endpoint.requestBody && (
        <div className="mb-4">
          <label>Request Body</label>
          <MonacoEditor
            value={body}
            onChange={setBody}
            language="json"
            height={200}
          />
        </div>
      )}

      {/* Send button */}
      <button
        onClick={sendRequest}
        disabled={loading || !apiKey}
        className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Sending...' : 'Send Request'}
      </button>

      {/* Response display */}
      {response && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <StatusBadge code={response.status} />
            <span className="text-sm text-gray-500">{response.duration}ms</span>
          </div>
          <MonacoEditor
            value={JSON.stringify(response.body, null, 2)}
            language="json"
            height={300}
            readOnly
          />
        </div>
      )}
    </div>
  );
}
```

---

## 3. API Key Management

### 3.1 Dashboard API Key UI

```typescript
// File: src/app/dashboard/api-keys/page.tsx

interface ApiKeyView {
  id: string;
  name: string;
  prefix: string;       // "sat_XXXXXXXX"
  scopes: string[];
  lastUsedAt: string | null;
  createdAt: string;
  expiresAt: string | null;
  ipAllowlist: string[];
}

// Key creation shows the full key ONCE, then only the prefix
// Clear warning: "Copy this key now. You won't be able to see it again."

/*
Dashboard: API Keys
─────────────────────────────────────────────────

[+ Create API Key]

┌────────────────────────────────────────────────┐
│ Default API Key                                 │
│ sat_abc12345...                                 │
│ Scopes: agents:read, agents:invoke              │
│ Last used: 2 hours ago                          │
│ Created: Mar 1, 2026                            │
│ Expires: Never                                  │
│                                    [Revoke]     │
├────────────────────────────────────────────────┤
│ Production Key                                  │
│ sat_xyz98765...                                 │
│ Scopes: agents:read, agents:invoke, usage:read  │
│ Last used: 5 minutes ago                        │
│ Created: Mar 5, 2026                            │
│ Expires: Jun 5, 2026                            │
│ IP Allowlist: 203.0.113.0/24                    │
│                                    [Revoke]     │
└────────────────────────────────────────────────┘
*/
```

### 3.2 Key Creation Flow

```typescript
// File: src/app/api/dashboard/api-keys/route.ts

import { z } from 'zod';

const CreateApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.enum([
    'agents:read',
    'agents:invoke',
    'usage:read',
    'webhooks:read',
    'webhooks:write',
    'api-keys:read',
    'api-keys:write',
  ])).min(1),
  expiresIn: z.enum(['30d', '90d', '365d', 'never']).optional(),
  ipAllowlist: z.array(z.string().ip()).optional(),
}).strict();

export async function POST(req: Request) {
  const tenantId = await requireAuth(req);
  const body = CreateApiKeySchema.parse(await req.json());

  const queries = tenantQueries(tenantId);
  const result = await queries.createApiKey({
    name: body.name,
    scopes: body.scopes,
    expiresAt: body.expiresIn !== 'never'
      ? new Date(Date.now() + parseDuration(body.expiresIn!))
      : undefined,
    ipAllowlist: body.ipAllowlist ?? [],
    userId: req.auth.userId,
  });

  // Return full key only on creation
  return Response.json({
    id: result.id,
    name: result.name,
    key: result.key,  // ONLY shown once
    prefix: result.keyPrefix,
    scopes: result.scopes,
    expiresAt: result.expiresAt,
  }, { status: 201 });
}
```

---

## 4. Usage Dashboard

### 4.1 Usage Overview

```
Dashboard: Usage Overview
─────────────────────────────────────────────────

Billing Period: March 2026          Plan: PLUS

API Calls This Month
████████████████████░░░░░░░░░░ 67,432 / 100,000

[Sparkline graph showing daily usage over 30 days]

┌───────────────────────────────────────────────┐
│ Top Agents by Usage                            │
│                                                │
│ Security Scanner    ████████████████  12,456    │
│ Code Reviewer       ███████████       8,923     │
│ Content Writer      ████████          6,102     │
│ Data Analyzer       █████             3,891     │
│ Other (12 agents)   ████              2,560     │
└───────────────────────────────────────────────┘

┌──────────────────────┬────────────────────────┐
│ Response Times       │ Error Rate              │
│                      │                         │
│ p50: 234ms          │ 4xx: 2.1%               │
│ p95: 1,203ms        │ 5xx: 0.03%              │
│ p99: 3,456ms        │ Success: 97.87%         │
│                      │                         │
│ [Line chart]         │ [Line chart]            │
└──────────────────────┴────────────────────────┘
```

### 4.2 Usage Analytics API

```typescript
// File: src/app/api/dashboard/usage/route.ts

export async function GET(req: Request) {
  const tenantId = await requireAuth(req);
  const { searchParams } = new URL(req.url);

  const period = searchParams.get('period') ?? getCurrentBillingPeriod();
  const granularity = searchParams.get('granularity') ?? 'daily';

  const queries = tenantQueries(tenantId);

  const [summary, timeSeries, topAgents, errorBreakdown] = await Promise.all([
    queries.getUsageSummary(period),
    queries.getUsageTimeSeries(period, granularity),
    queries.getTopAgentsByUsage(period, 10),
    queries.getErrorBreakdown(period),
  ]);

  const tenant = await db.raw.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    select: { monthlyApiLimit: true, plan: true },
  });

  return Response.json({
    period,
    plan: tenant.plan,
    limit: tenant.monthlyApiLimit,
    summary: {
      totalRequests: summary._sum.requestCount ?? 0,
      totalTokens: summary._sum.tokenCount ?? 0,
      totalCost: (summary._sum.costMicros ?? 0) / 1_000_000,
      percentUsed: Math.round(
        ((summary._sum.requestCount ?? 0) / tenant.monthlyApiLimit) * 100
      ),
    },
    timeSeries,
    topAgents,
    errorBreakdown,
  });
}
```

---

## 5. Getting Started Guide

### 5.1 Quickstart Page

```markdown
# Getting Started with Stone AI Tools

## 1. Get Your API Key

Sign up at [tools.stone-ai.net](https://tools.stone-ai.net) and create
your first API key in the dashboard.

## 2. Install the SDK

```bash
# TypeScript / JavaScript
npm install @stone-ai/tools-sdk

# Python
pip install stone-ai-tools

# Go
go get github.com/stonefreight2017-source/stone-ai-go
```

## 3. Make Your First API Call

```typescript
import StoneAITools from '@stone-ai/tools-sdk';

const client = new StoneAITools({
  apiKey: 'sat_your_api_key_here',
});

// List available agents
const agents = await client.agents.list();
console.log(`Found ${agents.data.length} agents`);

// Invoke an agent
const response = await client.agents.invoke('agent_code_reviewer', {
  prompt: 'Review this code for security issues',
  context: {
    language: 'typescript',
    code: `const query = "SELECT * FROM users WHERE id = " + userId;`,
  },
});

console.log(response.content);
// Output: "⚠️ SQL Injection Vulnerability Detected..."
```

## 4. Explore the Agent Catalog

Browse all available agents at [tools.stone-ai.net/agents](/agents).
Each agent has detailed documentation, including:
- What it does
- Required subscription tier
- Input/output format
- Example usage

## 5. Set Up Webhooks (Optional)

Get notified when long-running agent tasks complete:

```typescript
const webhook = await client.webhooks.create({
  url: 'https://your-app.com/webhooks/stone-ai',
  events: ['agent.completed', 'agent.failed'],
});
```

## Next Steps

- [API Reference](/docs/api/v1) — Full endpoint documentation
- [Rate Limits](/docs/rate-limits) — Understanding rate limiting
- [Error Handling](/docs/errors) — Error codes and troubleshooting
- [Pricing](/pricing) — Compare plans and features
```

### 5.2 Time-to-First-Call Optimization

```typescript
// Track how long it takes developers to make their first successful API call
// This is the #1 metric for developer experience

// File: src/services/developer-onboarding-tracker.ts

class OnboardingTracker {
  async trackSignup(tenantId: string): Promise<void> {
    await redis.set(`onboarding:${tenantId}:signup`, Date.now().toString());
  }

  async trackFirstApiKey(tenantId: string): Promise<void> {
    await redis.set(`onboarding:${tenantId}:first_key`, Date.now().toString());
  }

  async trackFirstApiCall(tenantId: string): Promise<void> {
    const existing = await redis.get(`onboarding:${tenantId}:first_call`);
    if (existing) return; // Already tracked

    await redis.set(`onboarding:${tenantId}:first_call`, Date.now().toString());

    // Calculate time-to-first-call
    const signupTime = await redis.get(`onboarding:${tenantId}:signup`);
    if (signupTime) {
      const ttfc = Date.now() - parseInt(signupTime, 10);
      metrics.histogram('onboarding.time_to_first_call_minutes', {}, ttfc / 60_000);
      logger.info('Time to first call', {
        tenantId,
        minutes: Math.round(ttfc / 60_000),
      });
    }
  }

  async trackFirstSuccessfulCall(tenantId: string): Promise<void> {
    const existing = await redis.get(`onboarding:${tenantId}:first_success`);
    if (existing) return;

    await redis.set(`onboarding:${tenantId}:first_success`, Date.now().toString());

    const signupTime = await redis.get(`onboarding:${tenantId}:signup`);
    if (signupTime) {
      const ttfs = Date.now() - parseInt(signupTime, 10);
      metrics.histogram('onboarding.time_to_first_success_minutes', {}, ttfs / 60_000);
    }
  }
}
```

---

## 6. Agent Catalog / Marketplace

### 6.1 Agent Discovery Page

```
Agent Catalog:
─────────────────────────────────────────────────

[Search agents...]  [Category ▼] [Tier ▼] [Sort ▼]

Featured Agents
┌──────────────────┬──────────────────┬──────────────────┐
│ 🔒 Security      │ 📝 Content       │ 📊 Data          │
│    Scanner        │    Writer         │    Analyzer       │
│                   │                   │                   │
│ Analyze code for  │ Generate blog     │ Analyze datasets  │
│ vulnerabilities   │ posts, docs, copy │ and find insights │
│                   │                   │                   │
│ Tier: FREE        │ Tier: STARTER     │ Tier: PLUS        │
│ Avg: 1.2s         │ Avg: 3.4s         │ Avg: 5.1s         │
│ ★★★★☆ (4.2)      │ ★★★★★ (4.8)      │ ★★★★☆ (4.5)      │
└──────────────────┴──────────────────┴──────────────────┘

All Agents (42 available)

Coding
├── Code Reviewer          [FREE]     Review code quality and best practices
├── Bug Finder             [STARTER]  Static analysis for common bugs
├── Refactoring Assistant  [PLUS]     Suggest refactoring improvements
└── Architecture Advisor   [SMART]    High-level architecture guidance

Security
├── Security Scanner       [FREE]     Scan code for OWASP vulnerabilities
├── Dependency Auditor     [STARTER]  Check dependencies for CVEs
└── Penetration Tester     [PRO]      Comprehensive security testing

Writing
├── Blog Writer            [STARTER]  Generate blog posts and articles
├── Technical Writer       [PLUS]     API docs and technical content
└── Copywriter             [SMART]    Marketing and sales copy
```

### 6.2 Agent Detail Page

```typescript
// File: src/app/agents/[agentId]/page.tsx

interface AgentDetailPage {
  agent: {
    id: string;
    name: string;
    description: string;
    longDescription: string;  // Markdown
    tier: AgentTier;
    category: string;
    capabilities: string[];
    inputSchema: JsonSchema;
    outputFormat: string;
    averageResponseTime: number;
    rating: number;
    reviewCount: number;
    usageCount: number;
  };
  pricing: {
    costPerCall: number;     // Estimated cost
    includedInPlans: string[];
  };
  examples: {
    title: string;
    input: unknown;
    output: string;
  }[];
  reviews: Review[];
}

/*
Agent Detail Page Layout:

┌─────────────────────────────────────────────────────┐
│ Security Scanner                    Tier: FREE       │
│ Scan code for OWASP vulnerabilities                  │
│                                                      │
│ ★★★★☆ 4.2 (156 reviews)  |  Used 45,678 times      │
│                                                      │
│ [Try in Playground]  [View API Docs]                 │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ## What It Does                                      │
│ The Security Scanner agent analyzes your code for    │
│ common security vulnerabilities from the OWASP       │
│ Top 10 list. It supports TypeScript, Python, Go,     │
│ Java, and C#.                                        │
│                                                      │
│ ## Capabilities                                      │
│ • SQL injection detection                            │
│ • XSS vulnerability scanning                         │
│ • Authentication bypass detection                    │
│ • Insecure deserialization                           │
│ • SSRF detection                                     │
│                                                      │
│ ## Example                                           │
│ Input:                                               │
│ ```json                                              │
│ {                                                    │
│   "prompt": "Scan this code for vulnerabilities",    │
│   "context": {                                       │
│     "language": "typescript",                        │
│     "code": "const q = `SELECT * FROM ...`"          │
│   }                                                  │
│ }                                                    │
│ ```                                                  │
│                                                      │
│ Output:                                              │
│ "⚠️ **SQL Injection** detected on line 1..."         │
│                                                      │
│ ## Pricing                                           │
│ Included in: FREE, STARTER, PLUS, PRO                │
│ Estimated cost: ~$0.001 per call                     │
│                                                      │
│ ## Reviews                                           │
│ ★★★★★ "Great for catching basic vulnerabilities"     │
│ ★★★★☆ "Fast and accurate for TypeScript projects"    │
│ ★★★☆☆ "Could be better at detecting complex bugs"   │
│                                                      │
└─────────────────────────────────────────────────────┘
*/
```

---

## 7. Interactive Playground

### 7.1 Playground Architecture

```typescript
// File: src/app/playground/page.tsx

'use client';

import { useState } from 'react';
import { MonacoEditor } from '@/components/editors/monaco';

export default function PlaygroundPage() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [context, setContext] = useState('{}');
  const [options, setOptions] = useState({
    maxTokens: 1000,
    temperature: 0.7,
    format: 'text' as const,
  });
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // ... implementation

  return (
    <div className="grid grid-cols-2 h-screen">
      {/* Left: Input */}
      <div className="p-4 border-r overflow-y-auto">
        <h2>Agent Playground</h2>

        {/* Agent selector */}
        <AgentSelector
          value={selectedAgent}
          onChange={setSelectedAgent}
        />

        {/* Prompt input */}
        <label>Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={6}
          className="w-full p-3 border rounded font-mono"
          placeholder="Enter your prompt..."
        />

        {/* Context editor */}
        <label>Context (JSON)</label>
        <MonacoEditor
          value={context}
          onChange={setContext}
          language="json"
          height={150}
        />

        {/* Options */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <label>Max Tokens</label>
            <input
              type="number"
              value={options.maxTokens}
              onChange={(e) => setOptions({ ...options, maxTokens: parseInt(e.target.value) })}
            />
          </div>
          <div>
            <label>Temperature</label>
            <input
              type="range"
              min={0} max={2} step={0.1}
              value={options.temperature}
              onChange={(e) => setOptions({ ...options, temperature: parseFloat(e.target.value) })}
            />
            <span>{options.temperature}</span>
          </div>
          <div>
            <label>Format</label>
            <select
              value={options.format}
              onChange={(e) => setOptions({ ...options, format: e.target.value as any })}
            >
              <option value="text">Text</option>
              <option value="markdown">Markdown</option>
              <option value="json">JSON</option>
              <option value="html">HTML</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleInvoke}
          disabled={loading || !selectedAgent || !prompt}
          className="w-full mt-4 py-3 bg-blue-600 text-white rounded-lg"
        >
          {loading ? 'Running...' : 'Run Agent'}
        </button>

        {/* Generated code snippet */}
        {selectedAgent && prompt && (
          <CodeSnippetGenerator
            agentId={selectedAgent}
            prompt={prompt}
            context={context}
            options={options}
          />
        )}
      </div>

      {/* Right: Output */}
      <div className="p-4 overflow-y-auto bg-gray-50">
        {response && (
          <>
            <ResponseHeader response={response} />
            <ResponseContent response={response} />
            <UsageInfo usage={response.usage} />
          </>
        )}
      </div>
    </div>
  );
}
```

---

## 8. Search Implementation

### 8.1 Documentation Search

```typescript
// File: src/lib/docs/search-indexer.ts

// Index documentation content for search using Algolia
interface DocSearchRecord {
  objectID: string;
  title: string;
  description: string;
  content: string;       // Full text content
  url: string;
  type: 'guide' | 'api-reference' | 'concept' | 'error' | 'changelog';
  section: string;
  tags: string[];
  version: string;
  hierarchy: {
    lvl0: string;
    lvl1: string;
    lvl2?: string;
    lvl3?: string;
  };
}

async function indexDocumentation(): Promise<void> {
  const records: DocSearchRecord[] = [];

  // Index API reference
  const spec = loadOpenApiSpec();
  for (const [path, methods] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      records.push({
        objectID: `api-${method}-${path}`,
        title: `${method.toUpperCase()} ${path}`,
        description: operation.summary,
        content: operation.description ?? '',
        url: `/docs/api/v1/${operation.operationId}`,
        type: 'api-reference',
        section: 'API Reference',
        tags: operation.tags,
        version: 'v1',
        hierarchy: {
          lvl0: 'API Reference',
          lvl1: operation.tags[0],
          lvl2: `${method.toUpperCase()} ${path}`,
        },
      });
    }
  }

  // Index guides
  const guides = await loadAllGuides();
  for (const guide of guides) {
    records.push({
      objectID: `guide-${guide.slug}`,
      title: guide.title,
      description: guide.description,
      content: guide.content,
      url: `/docs/guides/${guide.slug}`,
      type: 'guide',
      section: 'Guides',
      tags: guide.tags,
      version: 'v1',
      hierarchy: {
        lvl0: 'Guides',
        lvl1: guide.category,
        lvl2: guide.title,
      },
    });
  }

  // Index error codes
  for (const [code, info] of Object.entries(ERROR_CATALOG)) {
    records.push({
      objectID: `error-${code}`,
      title: `Error: ${code}`,
      description: info.message,
      content: `${info.message}\n\nHTTP Status: ${info.status}\n\n${info.resolution ?? ''}`,
      url: `/docs/errors/${code}`,
      type: 'error',
      section: 'Errors',
      tags: ['error', code],
      version: 'v1',
      hierarchy: {
        lvl0: 'Errors',
        lvl1: `${info.status}xx`,
        lvl2: code,
      },
    });
  }

  await algoliaIndex.replaceAllObjects(records);
}
```

---

## 9. Postman Collection Generation

```typescript
// File: scripts/generate-postman-collection.ts

function generatePostmanCollection(spec: OpenAPISpec): PostmanCollection {
  return {
    info: {
      name: 'Stone AI Tools API',
      description: 'Official Postman collection for the Stone AI Tools API',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    auth: {
      type: 'bearer',
      bearer: [{ key: 'token', value: '{{STONE_AI_API_KEY}}' }],
    },
    variable: [
      { key: 'baseUrl', value: 'https://api.tools.stone-ai.net/v1' },
      { key: 'STONE_AI_API_KEY', value: '' },
    ],
    item: Object.entries(groupByTag(spec.paths)).map(([tag, endpoints]) => ({
      name: tag,
      item: endpoints.map((ep) => ({
        name: ep.summary,
        request: {
          method: ep.method.toUpperCase(),
          header: [{ key: 'Content-Type', value: 'application/json' }],
          url: {
            raw: `{{baseUrl}}${ep.path}`,
            host: ['{{baseUrl}}'],
            path: ep.path.split('/').filter(Boolean),
          },
          body: ep.requestBody
            ? {
                mode: 'raw',
                raw: JSON.stringify(ep.requestBody.example, null, 2),
              }
            : undefined,
        },
        response: [],
      })),
    })),
  };
}
```

---

## Summary

The Stone AI Tools developer portal is designed around one metric: **time-to-first-successful-API-call**. Every element serves that goal:

1. **Interactive API Reference**: Three-column layout with docs, code examples, and live "Try It" panels
2. **Multi-Language Examples**: TypeScript, Python, Go, and cURL examples auto-generated from OpenAPI spec
3. **API Key Management**: Simple creation flow with clear security practices (show once, prefix display)
4. **Usage Dashboard**: Real-time usage tracking, cost monitoring, and top-agent analytics
5. **Agent Catalog**: Browseable marketplace with ratings, examples, and tier information
6. **Interactive Playground**: Full-featured testing environment with code generation
7. **Search**: Algolia-powered search across docs, API reference, error codes, and guides
8. **Onboarding Tracking**: Time-to-first-call metrics drive continuous DX improvement

The portal is the front door of Stone AI Tools — it must make developers productive in minutes, not hours.
