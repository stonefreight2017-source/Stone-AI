# OpenAPI Specification Patterns for Stone AI Tools

## Seed Classification
- **Domain**: Backend Engineering / API Design
- **Platform**: Stone AI Tools (tools.stone-ai.net)
- **Complexity**: Intermediate
- **Prerequisites**: REST API design, JSON Schema
- **Last Updated**: 2026-03-09

---

## 1. OpenAPI 3.1 Overview

### Why 3.1 Over 3.0?

```
OpenAPI 3.1 Advantages:

- Full JSON Schema compatibility (draft 2020-12)
- `type` can be an array: type: [string, null]
- `const` keyword support
- `$ref` alongside other keywords
- Better webhooks support
- Content negotiation improvements

Stone AI Tools uses 3.1 because:
1. SDK generators produce better types
2. JSON Schema compatibility simplifies validation
3. Webhook definitions are first-class
4. Null handling is cleaner
```

---

## 2. Spec Organization

### 2.1 File Structure

```
api/
├── openapi.yaml              # Root spec (references all parts)
├── paths/
│   ├── agents.yaml           # /agents endpoints
│   ├── agents-invoke.yaml    # /agents/{id}/invoke
│   ├── usage.yaml            # /usage endpoints
│   ├── webhooks.yaml         # /webhooks endpoints
│   └── api-keys.yaml         # /api-keys endpoints
├── schemas/
│   ├── agent.yaml            # Agent schema
│   ├── invoke.yaml           # Invoke request/response
│   ├── usage.yaml            # Usage schemas
│   ├── webhook.yaml          # Webhook schemas
│   ├── error.yaml            # Error response schema
│   └── pagination.yaml       # Pagination schema
├── parameters/
│   └── common.yaml           # Shared parameters
├── responses/
│   └── errors.yaml           # Shared error responses
├── examples/
│   ├── agents.yaml           # Agent examples
│   └── invoke.yaml           # Invoke examples
└── webhooks/
    └── events.yaml           # Webhook event definitions
```

### 2.2 Root Spec with References

```yaml
# File: api/openapi.yaml

openapi: 3.1.0
info:
  title: Stone AI Tools API
  version: "1.0.0"
  description: |
    Access Stone AI's 42+ AI agents via API. Build AI-powered applications
    with our marketplace of specialized agents for coding, security, writing,
    analysis, and more.

    ## Authentication
    All API requests require authentication via API key:
    ```
    Authorization: Bearer sat_your_api_key
    ```

    ## Rate Limiting
    Every response includes rate limit headers. See [Rate Limits](/docs/rate-limits).

    ## Errors
    All errors follow a standard format. See [Error Codes](/docs/errors).
  contact:
    name: Stone AI Tools Support
    email: support@stone-ai.net
    url: https://tools.stone-ai.net/support
  license:
    name: Proprietary
  x-logo:
    url: https://tools.stone-ai.net/logo.png

servers:
  - url: https://api.tools.stone-ai.net/v1
    description: Production
  - url: https://sandbox.tools.stone-ai.net/v1
    description: Sandbox (mock responses, no billing)

security:
  - ApiKeyAuth: []

tags:
  - name: Agents
    description: |
      Browse the agent catalog and invoke AI agents. Each agent specializes
      in a specific task — from code review to content writing.
  - name: Usage
    description: Track API usage, view billing periods, and monitor quotas.
  - name: Webhooks
    description: |
      Set up outbound webhooks to receive notifications when events occur
      (agent completions, usage alerts, billing events).
  - name: API Keys
    description: Manage API keys for authentication.

paths:
  /agents:
    $ref: './paths/agents.yaml#/list'
  /agents/{agentId}:
    $ref: './paths/agents.yaml#/get'
  /agents/{agentId}/invoke:
    $ref: './paths/agents-invoke.yaml#/invoke'
  /usage:
    $ref: './paths/usage.yaml#/current'
  /usage/summary:
    $ref: './paths/usage.yaml#/summary'
  /webhooks:
    $ref: './paths/webhooks.yaml#/collection'
  /webhooks/{webhookId}:
    $ref: './paths/webhooks.yaml#/item'
  /api-keys:
    $ref: './paths/api-keys.yaml#/collection'
  /api-keys/{keyId}:
    $ref: './paths/api-keys.yaml#/item'

webhooks:
  agentCompleted:
    $ref: './webhooks/events.yaml#/agentCompleted'
  usageThreshold:
    $ref: './webhooks/events.yaml#/usageThreshold'

components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: Authorization
      description: |
        Bearer token authentication. Include your API key in the
        Authorization header:
        ```
        Authorization: Bearer sat_your_api_key_here
        ```

  schemas:
    $ref: './schemas/_index.yaml'

  parameters:
    $ref: './parameters/common.yaml'

  responses:
    $ref: './responses/errors.yaml'
```

---

## 3. Schema Design Best Practices

### 3.1 Consistent Object Structure

```yaml
# File: api/schemas/agent.yaml

Agent:
  type: object
  required:
    - id
    - name
    - description
    - tier
    - category
  properties:
    id:
      type: string
      description: Unique agent identifier
      example: "agent_security_scanner"
      readOnly: true

    name:
      type: string
      description: Human-readable display name
      example: "Security Scanner"

    description:
      type: string
      description: Brief description of what the agent does
      example: "Analyze code for OWASP Top 10 vulnerabilities"

    tier:
      $ref: '#/AgentTier'

    category:
      $ref: '#/AgentCategory'

    capabilities:
      type: array
      items:
        type: string
      description: List of specific capabilities
      example: ["sql-injection", "xss", "csrf", "auth-bypass"]

    inputSchema:
      type: object
      description: JSON Schema describing the agent's expected input format
      additionalProperties: true

    outputFormats:
      type: array
      items:
        type: string
        enum: [text, markdown, json, html]
      default: [text]

    maxTokens:
      type: integer
      description: Maximum output tokens the agent can generate
      example: 4000

    supportsStreaming:
      type: boolean
      description: Whether this agent supports streaming responses
      default: false

    averageResponseTime:
      type: number
      description: Average response time in seconds
      example: 2.3
      readOnly: true

    rating:
      type: number
      description: Average user rating (1-5)
      minimum: 0
      maximum: 5
      example: 4.5
      readOnly: true

    reviewCount:
      type: integer
      description: Number of user reviews
      readOnly: true

AgentTier:
  type: string
  enum: [free, starter, plus, smart, pro]
  description: |
    The minimum subscription tier required to access this agent.
    - `free` — Available on all plans
    - `starter` — Requires STARTER plan or higher
    - `plus` — Requires PLUS plan or higher
    - `smart` — Requires SMART plan or higher
    - `pro` — Requires PRO plan or higher

AgentCategory:
  type: string
  enum:
    - productivity
    - coding
    - writing
    - analysis
    - creative
    - security
    - data
    - communication
    - research
    - business
  description: The primary category of the agent
```

### 3.2 Request/Response Schemas

```yaml
# File: api/schemas/invoke.yaml

InvokeAgentRequest:
  type: object
  required:
    - prompt
  properties:
    prompt:
      type: string
      minLength: 1
      maxLength: 32000
      description: |
        The input prompt for the agent. Content depends on the agent type.
        See each agent's documentation for expected input format.
      examples:
        - "Review this TypeScript code for security vulnerabilities"
        - "Write a blog post about machine learning in healthcare"

    context:
      type: object
      additionalProperties: true
      description: |
        Additional context for the agent. Structure depends on the agent.
        Common fields: `language`, `code`, `url`, `data`.
      example:
        language: "typescript"
        code: "const query = `SELECT * FROM users WHERE id = ${userId}`"

    options:
      $ref: '#/InvokeOptions'

InvokeOptions:
  type: object
  description: Configuration options for the invocation
  properties:
    maxTokens:
      type: integer
      minimum: 1
      maximum: 8000
      default: 1000
      description: Maximum number of tokens in the response

    temperature:
      type: number
      minimum: 0
      maximum: 2
      default: 0.7
      description: |
        Sampling temperature. Lower values are more deterministic,
        higher values are more creative.

    format:
      type: string
      enum: [text, markdown, json, html]
      default: text
      description: Desired output format

    stream:
      type: boolean
      default: false
      description: |
        Enable streaming response via Server-Sent Events.
        When true, response is delivered as a stream of chunks.

AgentResponse:
  type: object
  required:
    - id
    - agentId
    - content
    - usage
  properties:
    id:
      type: string
      description: Unique response identifier
      example: "resp_abc123def456"

    agentId:
      type: string
      description: The agent that generated this response
      example: "agent_security_scanner"

    content:
      type: string
      description: The agent's response content

    format:
      type: string
      enum: [text, markdown, json, html]
      description: The format of the content

    usage:
      $ref: '#/UsageInfo'

    metadata:
      type: object
      properties:
        model:
          type: string
          description: The underlying model used
        processingTime:
          type: number
          description: Processing time in milliseconds

UsageInfo:
  type: object
  required:
    - promptTokens
    - completionTokens
    - totalTokens
    - cost
  properties:
    promptTokens:
      type: integer
      description: Number of tokens in the prompt
    completionTokens:
      type: integer
      description: Number of tokens in the response
    totalTokens:
      type: integer
      description: Total tokens used
    cost:
      type: number
      description: Cost in USD for this request
      example: 0.0042
```

### 3.3 Pagination Schema

```yaml
# File: api/schemas/pagination.yaml

Pagination:
  type: object
  required:
    - page
    - pageSize
    - total
    - totalPages
  properties:
    page:
      type: integer
      description: Current page number (1-indexed)
      minimum: 1
      example: 1
    pageSize:
      type: integer
      description: Number of items per page
      minimum: 1
      maximum: 100
      example: 20
    total:
      type: integer
      description: Total number of items across all pages
      example: 42
    totalPages:
      type: integer
      description: Total number of pages
      example: 3

PaginatedResponse:
  description: Base schema for paginated list responses
  type: object
  required:
    - data
    - pagination
  properties:
    data:
      type: array
      items: {}  # Overridden by specific responses
    pagination:
      $ref: '#/Pagination'
```

### 3.4 Error Schema with Discriminators

```yaml
# File: api/schemas/error.yaml

ApiError:
  type: object
  required:
    - error
  properties:
    error:
      type: object
      required:
        - code
        - message
        - request_id
      properties:
        code:
          type: string
          description: Machine-readable error code
          example: "rate_limit_exceeded"
        message:
          type: string
          description: Human-readable error message
          example: "Rate limit of 1000 requests per minute exceeded"
        help:
          type: string
          description: Actionable guidance on how to resolve the error
          example: "Wait for the rate limit to reset or upgrade your plan"
        request_id:
          type: string
          description: Unique request identifier for debugging
          example: "req_abc123"
        docs_url:
          type: string
          format: uri
          description: Link to relevant documentation
          example: "https://tools.stone-ai.net/docs/rate-limits"
        details:
          type: object
          additionalProperties: true
          description: Additional context about the error
        errors:
          type: array
          description: Field-level validation errors
          items:
            type: object
            required:
              - field
              - message
            properties:
              field:
                type: string
                description: The field that caused the error
                example: "prompt"
              message:
                type: string
                description: Description of the validation error
                example: "Must be at least 1 character"
              code:
                type: string
                description: Error code for this specific validation
                example: "too_short"
```

---

## 4. Reusable Components

### 4.1 Common Parameters

```yaml
# File: api/parameters/common.yaml

PageParam:
  name: page
  in: query
  description: Page number (1-indexed)
  schema:
    type: integer
    minimum: 1
    default: 1

PageSizeParam:
  name: pageSize
  in: query
  description: Number of items per page
  schema:
    type: integer
    minimum: 1
    maximum: 100
    default: 20

SortParam:
  name: sort
  in: query
  description: Sort order
  schema:
    type: string
    default: "-createdAt"
    pattern: "^-?[a-zA-Z]+"

AgentIdParam:
  name: agentId
  in: path
  required: true
  description: Unique agent identifier
  schema:
    type: string
    pattern: "^agent_[a-z0-9_]+$"
  example: "agent_security_scanner"
```

### 4.2 Common Responses

```yaml
# File: api/responses/errors.yaml

Unauthorized:
  description: Authentication failed or API key is missing/invalid
  content:
    application/json:
      schema:
        $ref: '../schemas/error.yaml#/ApiError'
      examples:
        missing_key:
          summary: No API key provided
          value:
            error:
              code: "missing_api_key"
              message: "No API key provided"
              help: "Include your API key in the Authorization header: Bearer sat_..."
              docs_url: "https://tools.stone-ai.net/docs/authentication"
        invalid_key:
          summary: Invalid API key
          value:
            error:
              code: "invalid_api_key"
              message: "The API key provided is invalid or has been revoked"

RateLimited:
  description: Rate limit exceeded
  headers:
    Retry-After:
      schema:
        type: integer
      description: Seconds until the rate limit resets
    X-RateLimit-Limit:
      schema:
        type: integer
      description: Maximum requests per minute for your plan
    X-RateLimit-Remaining:
      schema:
        type: integer
      description: Remaining requests in the current window
    X-RateLimit-Reset:
      schema:
        type: integer
      description: Unix timestamp when the rate limit resets
  content:
    application/json:
      schema:
        $ref: '../schemas/error.yaml#/ApiError'
      example:
        error:
          code: "rate_limit_exceeded"
          message: "Rate limit of 1000 requests per minute exceeded for PLUS plan"
          help: "Wait for the rate limit to reset or upgrade for higher limits"
          docs_url: "https://tools.stone-ai.net/docs/rate-limits"

ValidationError:
  description: Request validation failed
  content:
    application/json:
      schema:
        $ref: '../schemas/error.yaml#/ApiError'
      example:
        error:
          code: "validation_error"
          message: "Request validation failed"
          errors:
            - field: "prompt"
              message: "Required field is missing"
              code: "required"
```

---

## 5. Examples

### 5.1 Rich Examples Per Endpoint

```yaml
# File: api/examples/invoke.yaml

invokeSecurityScanner:
  summary: Scan code for vulnerabilities
  value:
    prompt: "Scan this code for security vulnerabilities"
    context:
      language: "typescript"
      code: |
        app.get('/user', (req, res) => {
          const id = req.query.id;
          const user = db.query(`SELECT * FROM users WHERE id = ${id}`);
          res.json(user);
        });
    options:
      maxTokens: 2000
      format: "markdown"

invokeCodeReviewer:
  summary: Review code quality
  value:
    prompt: "Review this code for best practices and suggest improvements"
    context:
      language: "python"
      code: |
        def get_user(id):
            conn = sqlite3.connect('db.sqlite')
            result = conn.execute(f"SELECT * FROM users WHERE id={id}")
            return result.fetchone()
    options:
      maxTokens: 1500
      temperature: 0.3

invokeContentWriter:
  summary: Generate blog post
  value:
    prompt: "Write a 1000-word blog post about the future of AI in healthcare"
    options:
      maxTokens: 4000
      temperature: 0.8
      format: "markdown"

invokeWithStreaming:
  summary: Stream a long response
  value:
    prompt: "Write a detailed analysis of modern web frameworks"
    options:
      maxTokens: 4000
      stream: true
```

---

## 6. Webhook Definitions

```yaml
# File: api/webhooks/events.yaml

agentCompleted:
  post:
    summary: Agent Invocation Completed
    description: |
      Sent when an agent finishes processing a request.
      This is useful for asynchronous or long-running agent tasks.
    operationId: webhookAgentCompleted
    requestBody:
      content:
        application/json:
          schema:
            type: object
            required: [id, type, created_at, data]
            properties:
              id:
                type: string
                example: "evt_abc123"
              type:
                type: string
                const: "agent.invocation.completed"
              api_version:
                type: string
                example: "1"
              created_at:
                type: string
                format: date-time
              data:
                type: object
                properties:
                  invocationId:
                    type: string
                  agentId:
                    type: string
                  status:
                    type: string
                    enum: [completed, failed, timeout]
                  content:
                    type: string
                  usage:
                    $ref: '../schemas/invoke.yaml#/UsageInfo'

usageThreshold:
  post:
    summary: Usage Threshold Reached
    description: Sent when API usage hits a predefined threshold.
    operationId: webhookUsageThreshold
    requestBody:
      content:
        application/json:
          schema:
            type: object
            required: [id, type, created_at, data]
            properties:
              id:
                type: string
              type:
                type: string
                const: "usage.threshold.reached"
              created_at:
                type: string
                format: date-time
              data:
                type: object
                properties:
                  threshold:
                    type: string
                    enum: [usage_50_percent, usage_75_percent, usage_90_percent, usage_100_percent]
                  currentUsage:
                    type: integer
                  limit:
                    type: integer
                  percentUsed:
                    type: integer
```

---

## 7. Spec Validation and Linting

```yaml
# File: .redocly.yaml

extends:
  - recommended

rules:
  # Naming conventions
  operation-operationId: error
  operation-summary: error
  operation-description: warn
  tag-description: warn

  # Schema rules
  no-ambiguous-paths: error
  no-identical-paths: error
  path-parameters-defined: error

  # Security
  security-defined: error

  # Best practices
  no-example-value-and-externalValue: error
  no-enum-type-mismatch: error

  # Custom rules
  rule/require-request-id:
    subject:
      type: Response
    assertions:
      required:
        - x-request-id
```

---

## 8. Spec-Driven Development Workflow

```
Development Workflow:

1. DESIGN: Write/update OpenAPI spec
   └── Review spec changes in PR

2. VALIDATE: Lint spec with Redocly
   └── CI blocks merge if spec is invalid

3. DETECT: Check for breaking changes
   └── CI warns if breaking changes found

4. GENERATE: Auto-generate from spec
   ├── TypeScript SDK
   ├── Python SDK
   ├── Go SDK
   ├── Prism mock server
   ├── Postman collection
   └── Documentation site

5. IMPLEMENT: Build the API to match spec
   └── Integration tests verify spec compliance

6. VERIFY: Contract tests ensure API matches spec
   └── Prism proxy validates real responses
```

---

## Summary

OpenAPI specification patterns for Stone AI Tools:

1. **3.1 Standard**: Full JSON Schema compatibility, webhook support, clean null handling
2. **Modular Organization**: Split spec into paths, schemas, parameters, responses, examples
3. **Consistent Schemas**: Required fields explicit, descriptions on everything, rich examples
4. **Reusable Components**: Shared parameters, error responses, pagination used everywhere
5. **Rich Examples**: Multiple realistic examples per endpoint for documentation and testing
6. **Webhook Definitions**: First-class webhook event schemas in the spec
7. **Spec Validation**: Redocly linting + breaking change detection in CI
8. **Spec-Driven Development**: Spec is the single source of truth for SDKs, docs, mocks, and tests
