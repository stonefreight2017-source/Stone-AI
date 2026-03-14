# SDK Generation Patterns for Stone AI Tools

## Seed Classification
- **Domain**: Backend Engineering / Developer Tools
- **Platform**: Stone AI Tools (tools.stone-ai.net)
- **Complexity**: Advanced
- **Prerequisites**: OpenAPI, TypeScript, Python, Go basics, package publishing
- **Last Updated**: 2026-03-09

---

## 1. SDK Generation Strategy Overview

### Why Auto-Generate SDKs?

Stone AI Tools serves developers who want to integrate AI agents into their applications. Hand-writing SDKs for every language is expensive and error-prone. Instead, we generate SDKs from our OpenAPI specification, ensuring consistency across all languages.

```
SDK Generation Pipeline:

┌──────────────┐     ┌─────────────────┐     ┌───────────────┐
│  OpenAPI 3.1 │────►│  Code Generator  │────►│  Generated    │
│  Spec (SSOT) │     │  (per language)  │     │  SDK Code     │
└──────────────┘     └─────────────────┘     └───────┬───────┘
                                                      │
                                              ┌───────┴───────┐
                                              │  Post-Process  │
                                              │  + Customize   │
                                              └───────┬───────┘
                                                      │
                              ┌────────────────────────┼────────────────────────┐
                              ▼                        ▼                        ▼
                     ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
                     │  TypeScript  │        │   Python     │        │     Go       │
                     │  @stone-ai/  │        │  stone-ai-   │        │  stone-ai-go │
                     │  tools-sdk   │        │  tools       │        │              │
                     └──────┬───────┘        └──────┬───────┘        └──────┬───────┘
                            │                       │                       │
                            ▼                       ▼                       ▼
                         npm                     PyPI                  Go Modules
```

### Generator Selection

```
Generator Comparison:

+-------------------+------------------+-----------+------------+
| Generator         | Languages        | Quality   | Customize  |
+-------------------+------------------+-----------+------------+
| openapi-generator | 50+ languages    | Medium    | Templates  |
| Stainless         | TS, Python, Go   | High      | Config     |
| Speakeasy         | TS, Python, Go   | High      | Config     |
| Custom (ours)     | TS first         | Highest   | Full       |
+-------------------+------------------+-----------+------------+

Decision: Hybrid approach
- TypeScript: Custom generator (highest quality, our primary audience)
- Python: Stainless-style generator with custom templates
- Go: openapi-generator with heavy post-processing
```

---

## 2. OpenAPI Specification as Single Source of Truth

### 2.1 Spec Structure

```yaml
# File: api/openapi.yaml
openapi: 3.1.0
info:
  title: Stone AI Tools API
  version: "1.0.0"
  description: Access Stone AI's agents via API
  contact:
    name: Stone AI Tools Support
    email: support@stone-ai.net
    url: https://tools.stone-ai.net/support
  license:
    name: Proprietary
    url: https://tools.stone-ai.net/terms

servers:
  - url: https://api.tools.stone-ai.net/v1
    description: Production
  - url: https://sandbox.tools.stone-ai.net/v1
    description: Sandbox

security:
  - ApiKeyAuth: []

tags:
  - name: Agents
    description: Browse and invoke AI agents
  - name: Usage
    description: Track API usage and billing
  - name: Webhooks
    description: Manage outbound webhooks
  - name: API Keys
    description: Manage API keys

paths:
  /agents:
    get:
      operationId: listAgents
      tags: [Agents]
      summary: List available agents
      description: Returns a paginated list of AI agents accessible with your plan.
      parameters:
        - $ref: '#/components/parameters/PageParam'
        - $ref: '#/components/parameters/PageSizeParam'
        - name: category
          in: query
          schema:
            type: string
            enum: [productivity, coding, writing, analysis, creative, security]
        - name: tier
          in: query
          schema:
            $ref: '#/components/schemas/AgentTier'
      responses:
        '200':
          description: List of agents
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AgentListResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '429':
          $ref: '#/components/responses/RateLimited'

  /agents/{agentId}/invoke:
    post:
      operationId: invokeAgent
      tags: [Agents]
      summary: Invoke an AI agent
      description: |
        Send a prompt to an AI agent and receive a response.
        Smart agents require SMART tier or higher.
      parameters:
        - name: agentId
          in: path
          required: true
          schema:
            type: string
          description: The unique identifier of the agent
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/InvokeAgentRequest'
            examples:
              simple:
                summary: Simple text prompt
                value:
                  prompt: "Analyze this code for security vulnerabilities"
                  context:
                    language: "typescript"
                    code: "const query = `SELECT * FROM users WHERE id = ${userId}`"
              with_options:
                summary: With configuration options
                value:
                  prompt: "Write a blog post about AI in healthcare"
                  options:
                    maxTokens: 2000
                    temperature: 0.7
                    format: "markdown"
      responses:
        '200':
          description: Agent response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AgentResponse'
        '400':
          $ref: '#/components/responses/ValidationError'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/InsufficientTier'
        '429':
          $ref: '#/components/responses/RateLimited'
        '503':
          $ref: '#/components/responses/ServiceUnavailable'

components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: Authorization
      description: "API key prefixed with 'Bearer '. Example: Bearer sat_abc123..."

  schemas:
    AgentTier:
      type: string
      enum: [free, starter, plus, smart, pro]
      description: The subscription tier required to access the agent

    Agent:
      type: object
      required: [id, name, description, tier, category]
      properties:
        id:
          type: string
          description: Unique agent identifier
          example: "agent_security_scanner"
        name:
          type: string
          description: Display name
          example: "Security Scanner"
        description:
          type: string
          description: What the agent does
        tier:
          $ref: '#/components/schemas/AgentTier'
        category:
          type: string
          enum: [productivity, coding, writing, analysis, creative, security]
        capabilities:
          type: array
          items:
            type: string
          description: List of agent capabilities
        inputSchema:
          type: object
          description: JSON Schema for the agent's expected input
        maxTokens:
          type: integer
          description: Maximum output tokens
        averageResponseTime:
          type: number
          description: Average response time in seconds

    InvokeAgentRequest:
      type: object
      required: [prompt]
      properties:
        prompt:
          type: string
          minLength: 1
          maxLength: 32000
          description: The input prompt for the agent
        context:
          type: object
          additionalProperties: true
          description: Additional context for the agent
        options:
          type: object
          properties:
            maxTokens:
              type: integer
              minimum: 1
              maximum: 8000
              default: 1000
            temperature:
              type: number
              minimum: 0
              maximum: 2
              default: 0.7
            format:
              type: string
              enum: [text, markdown, json, html]
              default: text
            stream:
              type: boolean
              default: false
              description: Enable streaming response

    AgentResponse:
      type: object
      required: [id, agentId, content, usage]
      properties:
        id:
          type: string
          description: Unique response identifier
        agentId:
          type: string
        content:
          type: string
          description: The agent's response content
        format:
          type: string
          enum: [text, markdown, json, html]
        usage:
          $ref: '#/components/schemas/UsageInfo'
        metadata:
          type: object
          properties:
            model:
              type: string
            processingTime:
              type: number
              description: Processing time in milliseconds

    UsageInfo:
      type: object
      properties:
        promptTokens:
          type: integer
        completionTokens:
          type: integer
        totalTokens:
          type: integer
        cost:
          type: number
          description: Cost in USD for this request

    AgentListResponse:
      type: object
      required: [data, pagination]
      properties:
        data:
          type: array
          items:
            $ref: '#/components/schemas/Agent'
        pagination:
          $ref: '#/components/schemas/Pagination'

    Pagination:
      type: object
      required: [page, pageSize, total, totalPages]
      properties:
        page:
          type: integer
        pageSize:
          type: integer
        total:
          type: integer
        totalPages:
          type: integer

    ApiError:
      type: object
      required: [error]
      properties:
        error:
          type: object
          required: [code, message, request_id]
          properties:
            code:
              type: string
            message:
              type: string
            request_id:
              type: string
            docs_url:
              type: string
            details:
              type: object
            errors:
              type: array
              items:
                type: object
                properties:
                  field:
                    type: string
                  message:
                    type: string
                  code:
                    type: string

  parameters:
    PageParam:
      name: page
      in: query
      schema:
        type: integer
        minimum: 1
        default: 1
    PageSizeParam:
      name: pageSize
      in: query
      schema:
        type: integer
        minimum: 1
        maximum: 100
        default: 20

  responses:
    Unauthorized:
      description: Authentication failed
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ApiError'
    RateLimited:
      description: Rate limit exceeded
      headers:
        Retry-After:
          schema:
            type: integer
        X-RateLimit-Limit:
          schema:
            type: integer
        X-RateLimit-Remaining:
          schema:
            type: integer
        X-RateLimit-Reset:
          schema:
            type: integer
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ApiError'
    ValidationError:
      description: Request validation failed
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ApiError'
    InsufficientTier:
      description: Your plan does not include access to this agent
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ApiError'
    ServiceUnavailable:
      description: Agent service temporarily unavailable
      headers:
        Retry-After:
          schema:
            type: integer
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ApiError'
```

---

## 3. TypeScript SDK Generation

### 3.1 Generated SDK Structure

```
@stone-ai/tools-sdk/
├── src/
│   ├── index.ts              # Main entry point
│   ├── client.ts             # StoneAITools client class
│   ├── resources/
│   │   ├── agents.ts         # Agents resource
│   │   ├── usage.ts          # Usage resource
│   │   ├── webhooks.ts       # Webhooks resource
│   │   └── api-keys.ts       # API Keys resource
│   ├── types/
│   │   ├── agents.ts         # Agent types
│   │   ├── usage.ts          # Usage types
│   │   ├── common.ts         # Shared types
│   │   └── errors.ts         # Error types
│   ├── core/
│   │   ├── http-client.ts    # HTTP client with retry/timeout
│   │   ├── auth.ts           # Authentication handling
│   │   ├── pagination.ts     # Auto-pagination helpers
│   │   ├── streaming.ts      # SSE streaming support
│   │   └── errors.ts         # Error classes
│   └── _generated/
│       └── version.ts        # Auto-generated version info
├── package.json
├── tsconfig.json
├── README.md
└── CHANGELOG.md
```

### 3.2 Generated Client Code

```typescript
// File: sdk/typescript/src/client.ts (generated)

import { HttpClient, HttpClientConfig } from './core/http-client';
import { AgentsResource } from './resources/agents';
import { UsageResource } from './resources/usage';
import { WebhooksResource } from './resources/webhooks';
import { ApiKeysResource } from './resources/api-keys';

export interface StoneAIToolsConfig {
  /** API key for authentication. Can also use STONE_AI_API_KEY env variable. */
  apiKey?: string;

  /** Base URL for the API. Defaults to https://api.tools.stone-ai.net/v1 */
  baseUrl?: string;

  /** Request timeout in milliseconds. Default: 30000 */
  timeout?: number;

  /** Maximum number of retries. Default: 2 */
  maxRetries?: number;

  /** Custom fetch implementation (for testing or Node.js < 18) */
  fetch?: typeof fetch;

  /** Custom headers added to every request */
  defaultHeaders?: Record<string, string>;
}

export class StoneAITools {
  private httpClient: HttpClient;

  /** Interact with AI agents */
  readonly agents: AgentsResource;

  /** Track API usage */
  readonly usage: UsageResource;

  /** Manage outbound webhooks */
  readonly webhooks: WebhooksResource;

  /** Manage API keys */
  readonly apiKeys: ApiKeysResource;

  constructor(config: StoneAIToolsConfig = {}) {
    const apiKey = config.apiKey ?? process.env.STONE_AI_API_KEY;

    if (!apiKey) {
      throw new Error(
        'API key is required. Pass it as `apiKey` in config or set the STONE_AI_API_KEY environment variable.'
      );
    }

    this.httpClient = new HttpClient({
      baseUrl: config.baseUrl ?? 'https://api.tools.stone-ai.net/v1',
      apiKey,
      timeout: config.timeout ?? 30_000,
      maxRetries: config.maxRetries ?? 2,
      fetch: config.fetch,
      defaultHeaders: config.defaultHeaders,
    });

    this.agents = new AgentsResource(this.httpClient);
    this.usage = new UsageResource(this.httpClient);
    this.webhooks = new WebhooksResource(this.httpClient);
    this.apiKeys = new ApiKeysResource(this.httpClient);
  }
}

export default StoneAITools;
```

### 3.3 Generated Resource Classes

```typescript
// File: sdk/typescript/src/resources/agents.ts (generated)

import { HttpClient } from '../core/http-client';
import { AutoPaginator } from '../core/pagination';
import type {
  Agent,
  AgentListParams,
  InvokeAgentRequest,
  AgentResponse,
  AgentListResponse,
} from '../types/agents';

export class AgentsResource {
  constructor(private client: HttpClient) {}

  /**
   * List available agents
   *
   * Returns a paginated list of AI agents accessible with your plan.
   *
   * @example
   * ```typescript
   * const agents = await stoneAI.agents.list({ category: 'coding' });
   * for (const agent of agents.data) {
   *   console.log(agent.name, agent.tier);
   * }
   * ```
   */
  async list(params?: AgentListParams): Promise<AgentListResponse> {
    return this.client.get<AgentListResponse>('/agents', { query: params });
  }

  /**
   * Auto-paginate through all agents
   *
   * @example
   * ```typescript
   * for await (const agent of stoneAI.agents.listAutoPaginate({ category: 'coding' })) {
   *   console.log(agent.name);
   * }
   * ```
   */
  listAutoPaginate(params?: AgentListParams): AutoPaginator<Agent> {
    return new AutoPaginator<Agent>(
      (page) => this.list({ ...params, page }),
      (response) => response.data,
      (response) => response.pagination
    );
  }

  /**
   * Get a specific agent by ID
   *
   * @example
   * ```typescript
   * const agent = await stoneAI.agents.get('agent_security_scanner');
   * console.log(agent.capabilities);
   * ```
   */
  async get(agentId: string): Promise<Agent> {
    return this.client.get<Agent>(`/agents/${encodeURIComponent(agentId)}`);
  }

  /**
   * Invoke an AI agent
   *
   * Send a prompt to an AI agent and receive a response.
   *
   * @example
   * ```typescript
   * const response = await stoneAI.agents.invoke('agent_code_reviewer', {
   *   prompt: 'Review this TypeScript code for best practices',
   *   context: { code: myCode, language: 'typescript' },
   *   options: { maxTokens: 2000, format: 'markdown' },
   * });
   * console.log(response.content);
   * ```
   */
  async invoke(agentId: string, request: InvokeAgentRequest): Promise<AgentResponse> {
    return this.client.post<AgentResponse>(
      `/agents/${encodeURIComponent(agentId)}/invoke`,
      { body: request, timeout: 120_000 } // Longer timeout for AI calls
    );
  }

  /**
   * Invoke an agent with streaming response
   *
   * @example
   * ```typescript
   * const stream = stoneAI.agents.invokeStream('agent_writer', {
   *   prompt: 'Write a blog post about AI',
   * });
   *
   * for await (const chunk of stream) {
   *   process.stdout.write(chunk.content);
   * }
   * ```
   */
  invokeStream(
    agentId: string,
    request: Omit<InvokeAgentRequest, 'options'> & {
      options?: Omit<InvokeAgentRequest['options'], 'stream'>;
    }
  ): AsyncIterable<AgentStreamChunk> {
    return this.client.stream<AgentStreamChunk>(
      `/agents/${encodeURIComponent(agentId)}/invoke`,
      {
        body: { ...request, options: { ...request.options, stream: true } },
        timeout: 120_000,
      }
    );
  }
}
```

### 3.4 HTTP Client Core

```typescript
// File: sdk/typescript/src/core/http-client.ts (generated)

import {
  StoneAIError,
  AuthenticationError,
  RateLimitError,
  ValidationError,
  NotFoundError,
  ServerError,
} from './errors';

export interface HttpClientConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  maxRetries: number;
  fetch?: typeof fetch;
  defaultHeaders?: Record<string, string>;
}

interface RequestOptions {
  query?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
}

export class HttpClient {
  private config: HttpClientConfig;
  private fetchFn: typeof fetch;

  constructor(config: HttpClientConfig) {
    this.config = config;
    this.fetchFn = config.fetch ?? globalThis.fetch;
  }

  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, options);
  }

  async post<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, options);
  }

  async put<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', path, options);
  }

  async patch<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', path, options);
  }

  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, options);
  }

  async *stream<T>(path: string, options?: RequestOptions): AsyncIterable<T> {
    const url = this.buildUrl(path, options?.query);
    const headers = this.buildHeaders(options?.headers);
    headers['Accept'] = 'text/event-stream';

    const response = await this.fetchFn(url, {
      method: 'POST',
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(options?.timeout ?? this.config.timeout),
    });

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new StoneAIError('No response body for stream');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') return;
          try {
            yield JSON.parse(data) as T;
          } catch {
            // Skip malformed lines
          }
        }
      }
    }
  }

  private async request<T>(
    method: string,
    path: string,
    options?: RequestOptions
  ): Promise<T> {
    const url = this.buildUrl(path, options?.query);
    const headers = this.buildHeaders(options?.headers);
    const timeout = options?.timeout ?? this.config.timeout;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const response = await this.fetchFn(url, {
          method,
          headers,
          body: options?.body ? JSON.stringify(options.body) : undefined,
          signal: AbortSignal.timeout(timeout),
        });

        if (response.ok) {
          return await response.json() as T;
        }

        // Don't retry client errors (except 429 and 409)
        if (response.status < 500 && response.status !== 429 && response.status !== 409) {
          await this.handleErrorResponse(response);
        }

        // Retry on 429 with Retry-After
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') ?? '1', 10);
          await this.sleep(retryAfter * 1000);
          continue;
        }

        // Retry on 5xx
        lastError = await this.buildError(response);
        if (attempt < this.config.maxRetries) {
          await this.sleep(this.backoff(attempt));
          continue;
        }

        throw lastError;
      } catch (error) {
        if (error instanceof StoneAIError) throw error;
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.config.maxRetries) {
          await this.sleep(this.backoff(attempt));
          continue;
        }
      }
    }

    throw lastError ?? new StoneAIError('Request failed after all retries');
  }

  private buildUrl(path: string, query?: Record<string, unknown>): string {
    const url = new URL(path, this.config.baseUrl);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }

  private buildHeaders(extra?: Record<string, string>): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': `stone-ai-tools-sdk/typescript/1.0.0`,
      'X-SDK-Version': '1.0.0',
      ...this.config.defaultHeaders,
      ...extra,
    };
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    throw await this.buildError(response);
  }

  private async buildError(response: Response): Promise<StoneAIError> {
    let body: any;
    try {
      body = await response.json();
    } catch {
      body = { error: { code: 'unknown', message: response.statusText } };
    }

    const error = body?.error ?? {};
    const message = error.message ?? 'An unknown error occurred';
    const code = error.code ?? 'unknown';
    const requestId = error.request_id;

    switch (response.status) {
      case 401:
        return new AuthenticationError(message, code, requestId);
      case 403:
        return new AuthenticationError(message, code, requestId);
      case 404:
        return new NotFoundError(message, code, requestId);
      case 422:
        return new ValidationError(message, code, requestId, error.errors);
      case 429:
        return new RateLimitError(
          message,
          code,
          requestId,
          parseInt(response.headers.get('Retry-After') ?? '0', 10),
          parseInt(response.headers.get('X-RateLimit-Limit') ?? '0', 10)
        );
      default:
        if (response.status >= 500) {
          return new ServerError(message, code, requestId);
        }
        return new StoneAIError(message, code, requestId);
    }
  }

  private backoff(attempt: number): number {
    return Math.min(1000 * Math.pow(2, attempt), 10_000) + Math.random() * 1000;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 3.5 Error Classes

```typescript
// File: sdk/typescript/src/core/errors.ts (generated)

export class StoneAIError extends Error {
  constructor(
    message: string,
    public code: string = 'unknown',
    public requestId?: string
  ) {
    super(message);
    this.name = 'StoneAIError';
  }
}

export class AuthenticationError extends StoneAIError {
  constructor(message: string, code: string, requestId?: string) {
    super(message, code, requestId);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends StoneAIError {
  constructor(
    message: string,
    code: string,
    requestId: string | undefined,
    public retryAfter: number,
    public limit: number
  ) {
    super(message, code, requestId);
    this.name = 'RateLimitError';
  }
}

export class ValidationError extends StoneAIError {
  constructor(
    message: string,
    code: string,
    requestId: string | undefined,
    public fieldErrors?: Array<{ field: string; message: string; code: string }>
  ) {
    super(message, code, requestId);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends StoneAIError {
  constructor(message: string, code: string, requestId?: string) {
    super(message, code, requestId);
    this.name = 'NotFoundError';
  }
}

export class ServerError extends StoneAIError {
  constructor(message: string, code: string, requestId?: string) {
    super(message, code, requestId);
    this.name = 'ServerError';
  }
}
```

### 3.6 Auto-Pagination

```typescript
// File: sdk/typescript/src/core/pagination.ts (generated)

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export class AutoPaginator<T> implements AsyncIterable<T> {
  constructor(
    private fetchPage: (page: number) => Promise<unknown>,
    private extractItems: (response: unknown) => T[],
    private extractPagination: (response: unknown) => PaginationInfo
  ) {}

  async *[Symbol.asyncIterator](): AsyncIterator<T> {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.fetchPage(page);
      const items = this.extractItems(response);
      const pagination = this.extractPagination(response);

      for (const item of items) {
        yield item;
      }

      hasMore = page < pagination.totalPages;
      page++;
    }
  }

  /** Collect all items into an array */
  async toArray(): Promise<T[]> {
    const items: T[] = [];
    for await (const item of this) {
      items.push(item);
    }
    return items;
  }
}
```

---

## 4. Python SDK Generation

### 4.1 Generated Python SDK Structure

```
stone-ai-tools/
├── src/
│   └── stone_ai_tools/
│       ├── __init__.py
│       ├── client.py              # Sync + Async clients
│       ├── resources/
│       │   ├── __init__.py
│       │   ├── agents.py
│       │   ├── usage.py
│       │   ├── webhooks.py
│       │   └── api_keys.py
│       ├── types/
│       │   ├── __init__.py
│       │   ├── agents.py          # Pydantic models
│       │   ├── usage.py
│       │   └── common.py
│       ├── _core/
│       │   ├── __init__.py
│       │   ├── http_client.py
│       │   ├── auth.py
│       │   ├── pagination.py
│       │   ├── streaming.py
│       │   └── errors.py
│       └── _version.py
├── pyproject.toml
├── README.md
└── CHANGELOG.md
```

### 4.2 Generated Python Client

```python
# File: sdk/python/src/stone_ai_tools/client.py (generated)

from __future__ import annotations

import os
import httpx
from typing import Optional

from .resources.agents import AgentsResource, AsyncAgentsResource
from .resources.usage import UsageResource, AsyncUsageResource
from .resources.webhooks import WebhooksResource, AsyncWebhooksResource
from .resources.api_keys import ApiKeysResource, AsyncApiKeysResource
from ._core.http_client import SyncHttpClient, AsyncHttpClient


class StoneAITools:
    """Synchronous Stone AI Tools API client.

    Example:
        ```python
        from stone_ai_tools import StoneAITools

        client = StoneAITools(api_key="sat_...")
        response = client.agents.invoke("agent_writer", prompt="Write about AI")
        print(response.content)
        ```
    """

    agents: AgentsResource
    usage: UsageResource
    webhooks: WebhooksResource
    api_keys: ApiKeysResource

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: str = "https://api.tools.stone-ai.net/v1",
        timeout: float = 30.0,
        max_retries: int = 2,
        http_client: Optional[httpx.Client] = None,
    ) -> None:
        api_key = api_key or os.environ.get("STONE_AI_API_KEY")
        if not api_key:
            raise ValueError(
                "API key is required. Pass api_key or set STONE_AI_API_KEY env variable."
            )

        self._client = SyncHttpClient(
            base_url=base_url,
            api_key=api_key,
            timeout=timeout,
            max_retries=max_retries,
            http_client=http_client,
        )

        self.agents = AgentsResource(self._client)
        self.usage = UsageResource(self._client)
        self.webhooks = WebhooksResource(self._client)
        self.api_keys = ApiKeysResource(self._client)

    def close(self) -> None:
        """Close the HTTP client."""
        self._client.close()

    def __enter__(self) -> "StoneAITools":
        return self

    def __exit__(self, *args) -> None:
        self.close()


class AsyncStoneAITools:
    """Async Stone AI Tools API client.

    Example:
        ```python
        import asyncio
        from stone_ai_tools import AsyncStoneAITools

        async def main():
            async with AsyncStoneAITools(api_key="sat_...") as client:
                response = await client.agents.invoke("agent_writer", prompt="Write about AI")
                print(response.content)

        asyncio.run(main())
        ```
    """

    agents: AsyncAgentsResource
    usage: AsyncUsageResource
    webhooks: AsyncWebhooksResource
    api_keys: AsyncApiKeysResource

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: str = "https://api.tools.stone-ai.net/v1",
        timeout: float = 30.0,
        max_retries: int = 2,
        http_client: Optional[httpx.AsyncClient] = None,
    ) -> None:
        api_key = api_key or os.environ.get("STONE_AI_API_KEY")
        if not api_key:
            raise ValueError(
                "API key is required. Pass api_key or set STONE_AI_API_KEY env variable."
            )

        self._client = AsyncHttpClient(
            base_url=base_url,
            api_key=api_key,
            timeout=timeout,
            max_retries=max_retries,
            http_client=http_client,
        )

        self.agents = AsyncAgentsResource(self._client)
        self.usage = AsyncUsageResource(self._client)
        self.webhooks = AsyncWebhooksResource(self._client)
        self.api_keys = AsyncApiKeysResource(self._client)

    async def close(self) -> None:
        await self._client.close()

    async def __aenter__(self) -> "AsyncStoneAITools":
        return self

    async def __aexit__(self, *args) -> None:
        await self.close()
```

### 4.3 Generated Pydantic Types

```python
# File: sdk/python/src/stone_ai_tools/types/agents.py (generated)

from __future__ import annotations
from typing import Optional, Literal
from pydantic import BaseModel, Field


class Agent(BaseModel):
    id: str = Field(description="Unique agent identifier")
    name: str = Field(description="Display name")
    description: str = Field(description="What the agent does")
    tier: Literal["free", "starter", "plus", "smart", "pro"]
    category: Literal["productivity", "coding", "writing", "analysis", "creative", "security"]
    capabilities: list[str] = Field(default_factory=list)
    input_schema: Optional[dict] = Field(None, alias="inputSchema")
    max_tokens: Optional[int] = Field(None, alias="maxTokens")
    average_response_time: Optional[float] = Field(None, alias="averageResponseTime")

    model_config = {"populate_by_name": True}


class InvokeOptions(BaseModel):
    max_tokens: int = Field(1000, ge=1, le=8000, alias="maxTokens")
    temperature: float = Field(0.7, ge=0, le=2)
    format: Literal["text", "markdown", "json", "html"] = "text"
    stream: bool = False


class InvokeAgentRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=32000)
    context: Optional[dict] = None
    options: Optional[InvokeOptions] = None


class UsageInfo(BaseModel):
    prompt_tokens: int = Field(alias="promptTokens")
    completion_tokens: int = Field(alias="completionTokens")
    total_tokens: int = Field(alias="totalTokens")
    cost: float

    model_config = {"populate_by_name": True}


class AgentResponse(BaseModel):
    id: str
    agent_id: str = Field(alias="agentId")
    content: str
    format: Optional[Literal["text", "markdown", "json", "html"]] = None
    usage: UsageInfo
    metadata: Optional[dict] = None

    model_config = {"populate_by_name": True}


class Pagination(BaseModel):
    page: int
    page_size: int = Field(alias="pageSize")
    total: int
    total_pages: int = Field(alias="totalPages")

    model_config = {"populate_by_name": True}


class AgentListResponse(BaseModel):
    data: list[Agent]
    pagination: Pagination
```

---

## 5. Go SDK Generation

### 5.1 Generated Go SDK Structure

```
stone-ai-go/
├── stoneai.go          # Main client
├── agents.go           # Agents resource
├── usage.go            # Usage resource
├── webhooks.go         # Webhooks resource
├── apikeys.go          # API keys resource
├── types.go            # All types
├── errors.go           # Error types
├── internal/
│   ├── client.go       # HTTP client
│   ├── pagination.go   # Pagination helper
│   └── streaming.go    # SSE streaming
├── go.mod
├── go.sum
├── README.md
└── CHANGELOG.md
```

### 5.2 Generated Go Client

```go
// File: sdk/go/stoneai.go (generated)

package stoneai

import (
	"net/http"
	"os"
	"time"

	"github.com/stonefreight2017-source/stone-ai-go/internal"
)

const defaultBaseURL = "https://api.tools.stone-ai.net/v1"

// Client is the Stone AI Tools API client.
type Client struct {
	Agents   *AgentsService
	Usage    *UsageService
	Webhooks *WebhooksService
	APIKeys  *APIKeysService

	httpClient *internal.HTTPClient
}

// Config holds configuration for the Stone AI Tools client.
type Config struct {
	// APIKey for authentication. Falls back to STONE_AI_API_KEY env variable.
	APIKey string

	// BaseURL for the API. Defaults to https://api.tools.stone-ai.net/v1
	BaseURL string

	// Timeout for requests. Default: 30 seconds.
	Timeout time.Duration

	// MaxRetries on retryable errors. Default: 2.
	MaxRetries int

	// HTTPClient allows providing a custom http.Client.
	HTTPClient *http.Client
}

// NewClient creates a new Stone AI Tools API client.
func NewClient(cfg *Config) (*Client, error) {
	if cfg == nil {
		cfg = &Config{}
	}

	apiKey := cfg.APIKey
	if apiKey == "" {
		apiKey = os.Getenv("STONE_AI_API_KEY")
	}
	if apiKey == "" {
		return nil, &ConfigError{Message: "API key is required"}
	}

	baseURL := cfg.BaseURL
	if baseURL == "" {
		baseURL = defaultBaseURL
	}

	timeout := cfg.Timeout
	if timeout == 0 {
		timeout = 30 * time.Second
	}

	maxRetries := cfg.MaxRetries
	if maxRetries == 0 {
		maxRetries = 2
	}

	httpClient := internal.NewHTTPClient(internal.HTTPClientConfig{
		BaseURL:    baseURL,
		APIKey:     apiKey,
		Timeout:    timeout,
		MaxRetries: maxRetries,
		HTTPClient: cfg.HTTPClient,
	})

	c := &Client{httpClient: httpClient}
	c.Agents = &AgentsService{client: httpClient}
	c.Usage = &UsageService{client: httpClient}
	c.Webhooks = &WebhooksService{client: httpClient}
	c.APIKeys = &APIKeysService{client: httpClient}

	return c, nil
}
```

---

## 6. SDK Versioning Strategy

### 6.1 Semantic Versioning

```
SDK Versioning Rules:

API Version: v1 (URL path)
SDK Version: Semantic Versioning (independent per language)

Version Mapping:
  API v1 → SDK 1.x.x (all languages)
  API v2 → SDK 2.x.x (all languages)

Breaking change in API → Major SDK version bump
New endpoint or field  → Minor SDK version bump
Bug fix / docs         → Patch SDK version bump

Example Timeline:
  API v1 launch    → TS 1.0.0, Python 1.0.0, Go 1.0.0
  New agent field  → TS 1.1.0, Python 1.1.0, Go 1.1.0
  Fix pagination   → TS 1.1.1, Python 1.1.1, Go 1.1.1
  API v2 launch    → TS 2.0.0, Python 2.0.0, Go 2.0.0
```

### 6.2 Generation Pipeline

```yaml
# File: .github/workflows/generate-sdks.yml

name: Generate SDKs

on:
  push:
    paths:
      - 'api/openapi.yaml'
    branches: [main]

jobs:
  validate-spec:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate OpenAPI spec
        run: npx @redocly/cli lint api/openapi.yaml

  generate-typescript:
    needs: validate-spec
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Generate TypeScript SDK
        run: |
          node scripts/generate-sdk.js --language typescript --spec api/openapi.yaml --output sdk/typescript/
      - name: Build
        working-directory: sdk/typescript
        run: npm ci && npm run build
      - name: Test
        working-directory: sdk/typescript
        run: npm test
      - name: Publish to npm
        if: startsWith(github.ref, 'refs/tags/sdk-ts-')
        working-directory: sdk/typescript
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

  generate-python:
    needs: validate-spec
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Generate Python SDK
        run: |
          python scripts/generate-sdk.py --language python --spec api/openapi.yaml --output sdk/python/
      - name: Test
        working-directory: sdk/python
        run: pip install -e ".[dev]" && pytest
      - name: Publish to PyPI
        if: startsWith(github.ref, 'refs/tags/sdk-py-')
        working-directory: sdk/python
        run: |
          pip install build twine
          python -m build
          twine upload dist/*
        env:
          TWINE_USERNAME: __token__
          TWINE_PASSWORD: ${{ secrets.PYPI_TOKEN }}

  generate-go:
    needs: validate-spec
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.22'
      - name: Generate Go SDK
        run: |
          node scripts/generate-sdk.js --language go --spec api/openapi.yaml --output sdk/go/
      - name: Test
        working-directory: sdk/go
        run: go test ./...
      - name: Tag for Go modules
        if: startsWith(github.ref, 'refs/tags/sdk-go-')
        run: |
          # Go modules use git tags for versioning
          git tag "sdk/go/${{ github.ref_name }}"
          git push origin "sdk/go/${{ github.ref_name }}"
```

---

## 7. SDK Testing Strategy

### 7.1 Contract Tests

```typescript
// File: sdk/typescript/tests/contract.test.ts

import { StoneAITools } from '../src';

// These tests run against a mock server that validates
// requests match the OpenAPI spec
describe('Contract Tests', () => {
  let client: StoneAITools;

  beforeAll(() => {
    client = new StoneAITools({
      apiKey: 'sat_test_key',
      baseUrl: 'http://localhost:4010', // Prism mock server
    });
  });

  test('listAgents sends correct request', async () => {
    const response = await client.agents.list({ category: 'coding', page: 1 });
    expect(response.data).toBeInstanceOf(Array);
    expect(response.pagination.page).toBe(1);
  });

  test('invokeAgent sends correct request body', async () => {
    const response = await client.agents.invoke('agent_test', {
      prompt: 'Hello world',
      options: { maxTokens: 100, temperature: 0.5 },
    });
    expect(response.content).toBeDefined();
    expect(response.usage.totalTokens).toBeGreaterThan(0);
  });

  test('handles 401 correctly', async () => {
    const badClient = new StoneAITools({
      apiKey: 'invalid',
      baseUrl: 'http://localhost:4010',
    });

    await expect(badClient.agents.list())
      .rejects
      .toThrow('AuthenticationError');
  });

  test('handles 429 with retry', async () => {
    // Prism returns 429 on first call, 200 on retry
    const response = await client.agents.list();
    expect(response.data).toBeDefined();
  });
});
```

---

## 8. Publishing Strategy

```
Package Names:

TypeScript: @stone-ai/tools-sdk (npm)
Python:     stone-ai-tools (PyPI)
Go:         github.com/stonefreight2017-source/stone-ai-go

Publishing Checklist:
1. Validate OpenAPI spec (lint + breaking change detection)
2. Generate SDK code
3. Run unit tests
4. Run contract tests against Prism mock server
5. Run integration tests against sandbox
6. Bump version (semver)
7. Generate CHANGELOG from conventional commits
8. Publish to package registry
9. Update docs site with new SDK version
10. Announce in developer portal changelog
```

---

## Summary

SDK generation for Stone AI Tools follows a principled approach:

1. **Single Source of Truth**: The OpenAPI 3.1 spec drives all SDK generation
2. **Language-Specific Quality**: Custom generator for TypeScript (primary audience), templated generators for Python and Go
3. **Developer Experience**: Auto-pagination, streaming, typed errors, env variable config, comprehensive examples
4. **Testing**: Contract tests ensure SDKs match the spec, integration tests verify end-to-end behavior
5. **Versioning**: SDKs version independently but track API versions for major bumps
6. **CI/CD**: Fully automated generation, testing, and publishing pipeline
