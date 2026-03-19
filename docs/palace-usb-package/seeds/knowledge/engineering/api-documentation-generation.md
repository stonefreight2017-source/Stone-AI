# API Documentation Generation

## Palace Knowledge Seed — Advanced Backend Engineering

### Overview

Good API documentation accelerates development and reduces support burden. This seed covers generating OpenAPI specs from code, Swagger UI integration, type-safe API clients, zod-to-openapi transformation, and automated documentation generation for the Stone AI stack (Next.js 16, TypeScript, Zod).

---

## 1. Zod-to-OpenAPI

### Setup

```typescript
// src/lib/docs/openapi.ts
import { OpenAPIRegistry, OpenApiGeneratorV3, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Extend Zod with OpenAPI metadata
extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

// Register security schemes
registry.registerComponent('securitySchemes', 'BearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Clerk session token',
});

registry.registerComponent('securitySchemes', 'ApiKeyAuth', {
  type: 'apiKey',
  in: 'header',
  name: 'Authorization',
  description: 'Stone AI API key (Bearer sai_...)',
});
```

### Schema Registration

```typescript
// src/lib/docs/schemas.ts

// Register reusable schemas
const TierSchema = z.enum(['FREE', 'STARTER', 'PLUS', 'SMART', 'PRO']).openapi({
  description: 'User subscription tier',
  example: 'PLUS',
});

const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string().openapi({ example: 'VAL_3001' }),
    message: z.string().openapi({ example: 'Validation failed' }),
    details: z.record(z.unknown()).optional(),
    correlationId: z.string().uuid().optional(),
  }),
}).openapi('ErrorResponse');

const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  total: z.number().int(),
  totalPages: z.number().int(),
}).openapi('Pagination');

// Agent schemas
const AgentSchema = z.object({
  id: z.number().int(),
  number: z.number().int().min(1).max(38),
  name: z.string(),
  description: z.string(),
  tier: TierSchema,
  avatarUrl: z.string().url().nullable(),
  isActive: z.boolean(),
  capabilities: z.array(z.string()),
}).openapi('Agent');

const AgentListResponseSchema = z.object({
  agents: z.array(AgentSchema),
  total: z.number().int(),
}).openapi('AgentListResponse');

// Chat schemas
const ChatMessageSchema = z.object({
  message: z.string().min(1).max(10000).openapi({
    description: 'User message to send to the agent',
    example: 'How do I set up Prisma with PostgreSQL?',
  }),
  agentId: z.number().int().positive().openapi({
    description: 'The agent to chat with (1-38)',
    example: 1,
  }),
  conversationId: z.string().uuid().optional().openapi({
    description: 'Continue an existing conversation',
  }),
}).strict().openapi('ChatMessage');

const ChatResponseSchema = z.object({
  response: z.string(),
  conversationId: z.string().uuid(),
  usage: z.object({
    inputTokens: z.number().int(),
    outputTokens: z.number().int(),
    provider: z.enum(['vllm', 'anthropic']),
  }),
}).openapi('ChatResponse');

// Register all schemas
registry.register('Tier', TierSchema);
registry.register('Error', ErrorResponseSchema);
registry.register('Agent', AgentSchema);
registry.register('ChatMessage', ChatMessageSchema);
registry.register('ChatResponse', ChatResponseSchema);
```

### Route Registration

```typescript
// src/lib/docs/routes.ts

// Agents
registry.registerPath({
  method: 'get',
  path: '/api/agents',
  tags: ['Agents'],
  summary: 'List all agents',
  description: 'Returns agents available to the authenticated user based on their tier.',
  security: [{ BearerAuth: [] }],
  responses: {
    200: {
      description: 'List of agents',
      content: {
        'application/json': {
          schema: AgentListResponseSchema,
        },
      },
    },
    401: {
      description: 'Authentication required',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/agents/{id}',
  tags: ['Agents'],
  summary: 'Get agent details',
  request: {
    params: z.object({
      id: z.coerce.number().int().positive(),
    }),
  },
  security: [{ BearerAuth: [] }],
  responses: {
    200: {
      description: 'Agent details',
      content: {
        'application/json': { schema: AgentSchema },
      },
    },
    403: {
      description: 'Agent not available on your tier',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
    404: {
      description: 'Agent not found',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
    },
  },
});

// Chat
registry.registerPath({
  method: 'post',
  path: '/api/chat',
  tags: ['Chat'],
  summary: 'Send a message to an agent',
  description: 'Send a message and receive a response. For streaming, use /api/chat/stream.',
  security: [{ BearerAuth: [] }, { ApiKeyAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': { schema: ChatMessageSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'Agent response',
      content: {
        'application/json': { schema: ChatResponseSchema },
      },
    },
    429: {
      description: 'Rate limit exceeded',
      content: {
        'application/json': { schema: ErrorResponseSchema },
      },
      headers: {
        'Retry-After': {
          schema: { type: 'integer' },
          description: 'Seconds until rate limit resets',
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/chat/stream',
  tags: ['Chat'],
  summary: 'Stream a chat response (SSE)',
  description: 'Returns a Server-Sent Events stream with token-by-token AI response.',
  security: [{ BearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': { schema: ChatMessageSchema },
      },
    },
  },
  responses: {
    200: {
      description: 'SSE stream of chat events',
      content: {
        'text/event-stream': {
          schema: z.string().openapi({
            description: 'Server-Sent Events stream',
            example: 'data: {"type":"text","content":"Hello"}\n\n',
          }),
        },
      },
    },
  },
});

// Search
registry.registerPath({
  method: 'get',
  path: '/api/search',
  tags: ['Search'],
  summary: 'Search across content',
  request: {
    query: z.object({
      q: z.string().min(1).max(200),
      type: z.enum(['all', 'agents', 'forum', 'help']).default('all'),
      mode: z.enum(['text', 'semantic', 'hybrid']).default('text'),
      limit: z.coerce.number().min(1).max(50).default(10),
    }),
  },
  security: [{ BearerAuth: [] }],
  responses: {
    200: {
      description: 'Search results',
      content: {
        'application/json': {
          schema: z.object({
            query: z.string(),
            mode: z.string(),
            results: z.array(z.object({
              id: z.string(),
              type: z.string(),
              title: z.string(),
              snippet: z.string(),
              rank: z.number(),
            })),
            total: z.number().int(),
          }),
        },
      },
    },
  },
});
```

---

## 2. Generate OpenAPI Spec

```typescript
// src/lib/docs/generate.ts

export function generateOpenAPISpec() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'Stone AI API',
      version: '1.0.0',
      description: `
Stone AI provides access to 38 AI agents across 5 subscription tiers.

## Authentication
- **Session-based**: Clerk JWT tokens for web app
- **API Key**: \`Bearer sai_...\` for programmatic access (PLUS+ tier)

## Rate Limits
Rate limits vary by tier. See response headers:
- \`X-RateLimit-Limit\`: Max requests in window
- \`X-RateLimit-Remaining\`: Remaining requests
- \`Retry-After\`: Seconds until reset (on 429)

## Tiers
| Tier | Agents | Price |
|------|--------|-------|
| FREE | 4 | $0 |
| STARTER | 16 | $19.99/mo |
| PLUS | 30 | $49.99/mo |
| SMART | 39 | $99.99/mo |
| PRO | 38 | $200/mo |
      `.trim(),
      contact: {
        name: 'Stone AI',
        url: 'https://stone-ai.net',
      },
    },
    servers: [
      {
        url: 'https://stone-ai.net',
        description: 'Production',
      },
      {
        url: 'http://localhost:3000',
        description: 'Development',
      },
    ],
    tags: [
      { name: 'Agents', description: 'AI agent management' },
      { name: 'Chat', description: 'Chat with AI agents' },
      { name: 'Search', description: 'Content search' },
      { name: 'User', description: 'User profile and settings' },
      { name: 'Forum', description: 'Community forum' },
      { name: 'Billing', description: 'Subscription management' },
    ],
  });
}
```

### API Route to Serve Spec

```typescript
// src/app/api/docs/openapi.json/route.ts
import { generateOpenAPISpec } from '@/lib/docs/generate';

let cachedSpec: object | null = null;

export async function GET() {
  if (!cachedSpec) {
    cachedSpec = generateOpenAPISpec();
  }

  return Response.json(cachedSpec, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
```

---

## 3. Swagger UI

```typescript
// src/app/api/docs/page.tsx
// Simple Swagger UI page
export default function ApiDocsPage() {
  return (
    <html>
      <head>
        <title>Stone AI API Documentation</title>
        <link
          rel="stylesheet"
          href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"
        />
      </head>
      <body>
        <div id="swagger-ui" />
        <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              SwaggerUIBundle({
                url: '/api/docs/openapi.json',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                  SwaggerUIBundle.presets.apis,
                  SwaggerUIBundle.SwaggerUIStandalonePreset
                ],
                layout: 'StandaloneLayout',
              });
            `,
          }}
        />
      </body>
    </html>
  );
}
```

---

## 4. Type-Safe API Client Generation

```typescript
// scripts/generate-api-client.ts

// Generate TypeScript client from OpenAPI spec
// Using openapi-typescript

// npx openapi-typescript http://localhost:3000/api/docs/openapi.json -o src/lib/api/types.ts

// Usage with fetch wrapper
import type { paths } from '@/lib/api/types';

type AgentListResponse = paths['/api/agents']['get']['responses']['200']['content']['application/json'];
type ChatRequest = paths['/api/chat']['post']['requestBody']['content']['application/json'];
type ChatResponse = paths['/api/chat']['post']['responses']['200']['content']['application/json'];

// Type-safe fetch wrapper
async function apiGet<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}

// Usage
const agents = await apiGet<AgentListResponse>('/api/agents', sessionToken);
```

---

## 5. Automated Doc Testing

```typescript
// __tests__/docs/openapi-validation.test.ts
import { describe, it, expect } from 'vitest';

describe('OpenAPI Spec', () => {
  it('should generate valid OpenAPI 3.0 document', () => {
    const spec = generateOpenAPISpec();
    expect(spec.openapi).toBe('3.0.3');
    expect(spec.info.title).toBe('Stone AI API');
    expect(Object.keys(spec.paths).length).toBeGreaterThan(0);
  });

  it('should include all registered paths', () => {
    const spec = generateOpenAPISpec();
    const paths = Object.keys(spec.paths);

    expect(paths).toContain('/api/agents');
    expect(paths).toContain('/api/agents/{id}');
    expect(paths).toContain('/api/chat');
    expect(paths).toContain('/api/chat/stream');
    expect(paths).toContain('/api/search');
  });

  it('should require authentication on protected routes', () => {
    const spec = generateOpenAPISpec();
    const chatEndpoint = spec.paths['/api/chat'].post;

    expect(chatEndpoint.security).toBeDefined();
    expect(chatEndpoint.security.length).toBeGreaterThan(0);
  });

  it('should document error responses', () => {
    const spec = generateOpenAPISpec();
    const agentDetail = spec.paths['/api/agents/{id}'].get;

    expect(agentDetail.responses['403']).toBeDefined();
    expect(agentDetail.responses['404']).toBeDefined();
  });
});
```

---

## 6. Inline Documentation Pattern

```typescript
// src/app/api/agents/route.ts

/**
 * @openapi
 * /api/agents:
 *   get:
 *     summary: List available agents
 *     tags: [Agents]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Agent list filtered by user tier
 */
export const GET = withObservability(
  requireAuth(async (req: AuthenticatedRequest) => {
    // Route handler implementation
  })
);
```

---

## Summary

| Tool | Purpose | Stone AI Usage |
|------|---------|---------------|
| zod-to-openapi | Generate spec from Zod schemas | All API schemas |
| Swagger UI | Interactive documentation | `/api/docs` |
| openapi-typescript | Type-safe client generation | API client types |
| Spec validation | Automated testing | CI/CD pipeline |

API documentation is generated directly from Zod validation schemas — the same schemas that validate runtime data also produce accurate documentation. Single source of truth.
