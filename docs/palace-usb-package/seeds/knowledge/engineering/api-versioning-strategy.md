# API Versioning Strategy for Stone AI Tools

## Seed Classification
- **Domain**: Backend Engineering / API Design
- **Platform**: Stone AI Tools (tools.stone-ai.net)
- **Complexity**: Intermediate
- **Prerequisites**: REST API design, HTTP protocol
- **Last Updated**: 2026-03-09

---

## 1. Versioning Strategy Overview

### The Challenge

Stone AI Tools is an API marketplace. Developers build products on our API. Breaking their integrations costs them money and costs us customers. Yet the API must evolve — new agents, new features, new capabilities.

### Chosen Approach: URL Path Versioning (Primary) + Date-Based Header (Secondary)

```
Strategy Decision:

┌──────────────────┬────────────────┬──────────────┬───────────────┐
│ Approach         │ Discoverability│ Cache-Friendly│ Implementation│
├──────────────────┼────────────────┼──────────────┼───────────────┤
│ URL Path (/v1/)  │ ★★★★★         │ ★★★★★        │ ★★★★☆         │
│ Query Param (?v=)│ ★★★★☆         │ ★★☆☆☆        │ ★★★★★         │
│ Header (Accept)  │ ★★☆☆☆         │ ★★★☆☆        │ ★★★☆☆         │
│ Header (Custom)  │ ★★★☆☆         │ ★★★☆☆        │ ★★★★☆         │
└──────────────────┴────────────────┴──────────────┴───────────────┘

Primary: URL path versioning → /v1/agents, /v2/agents
  - Most visible to developers
  - Works with all HTTP clients, CDN caching
  - Clear in documentation and examples

Secondary: Date-based header → X-API-Version: 2025-01-01
  - For minor, non-breaking changes within a major version
  - Inspired by Stripe's approach
  - Allows gradual rollout of new behavior
```

### Version Lifecycle

```
Version States:

  ┌─────────┐     ┌──────────┐     ┌──────────────┐     ┌─────────┐
  │  Alpha  │────►│   Beta   │────►│  Stable (GA) │────►│Deprecated│
  │ /alpha/ │     │  /beta/  │     │    /v1/      │     │  /v1/    │
  └─────────┘     └──────────┘     └──────────────┘     └────┬────┘
                                                              │
       No SLA        Best effort      Full SLA            │ Sunset
       May break     Minor breaks     Backward compat     ▼
       No support    Limited support   Full support   ┌─────────┐
                                                      │ Retired │
                                                      │ (410)   │
                                                      └─────────┘
```

---

## 2. What Constitutes a Breaking Change

### 2.1 Breaking Changes (Require Major Version Bump)

```
BREAKING — These trigger v1 → v2:

✗ Removing an endpoint
✗ Removing a response field
✗ Changing the type of a response field (string → number)
✗ Renaming a response field
✗ Changing the meaning/behavior of a field
✗ Adding a new required request field
✗ Changing authentication mechanism
✗ Changing error response format
✗ Reducing rate limits for existing tiers
✗ Changing pagination format
✗ Removing an enum value from a response field
```

### 2.2 Non-Breaking Changes (Minor Version / Date Version)

```
NON-BREAKING — These can ship within v1:

✓ Adding a new endpoint
✓ Adding an optional request parameter
✓ Adding a new response field
✓ Adding a new enum value to a request field
✓ Adding a new webhook event type
✓ Increasing rate limits
✓ Adding a new error code (as long as existing codes unchanged)
✓ Adding new agent tiers
✓ Relaxing validation (accepting more input than before)
✓ Adding new headers to responses
```

### 2.3 Gray Areas (Use Date Versioning)

```
GRAY AREA — Use X-API-Version date header:

~ Changing default values (e.g., default pageSize from 20 to 50)
~ Changing error messages (same code, different text)
~ Adding validation (stricter input checking)
~ Changing sort order of results
~ Deprecating a field (still present, marked deprecated)
```

---

## 3. URL Path Versioning Implementation

### 3.1 Route Structure

```typescript
// File: src/gateway/routing/version-routes.ts

// All versioned routes
const V1_ROUTES = {
  prefix: '/v1',
  routes: [
    'GET    /agents',
    'GET    /agents/:agentId',
    'POST   /agents/:agentId/invoke',
    'GET    /usage',
    'GET    /usage/summary',
    'GET    /webhooks',
    'POST   /webhooks',
    'PUT    /webhooks/:webhookId',
    'DELETE /webhooks/:webhookId',
    'GET    /api-keys',
    'POST   /api-keys',
    'DELETE /api-keys/:keyId',
  ],
};

// V2 adds new endpoints AND modifies some V1 responses
const V2_ROUTES = {
  prefix: '/v2',
  routes: [
    // All V1 routes carry forward (with modifications)
    ...V1_ROUTES.routes,
    // New V2-only endpoints
    'POST   /agents/:agentId/invoke/batch',
    'GET    /agents/:agentId/sessions',
    'POST   /agents/:agentId/sessions',
    'GET    /analytics/overview',
    'GET    /analytics/agents',
  ],
};
```

### 3.2 Version Resolution Middleware

```typescript
// File: src/gateway/middleware/version-resolver.ts

interface VersionConfig {
  current: string;        // Current stable version
  supported: string[];    // All supported versions
  deprecated: string[];   // Versions with sunset dates
  retired: string[];      // Versions that return 410
  default: string;        // Version to use if none specified
}

const VERSION_CONFIG: VersionConfig = {
  current: 'v1',
  supported: ['v1'],
  deprecated: [],
  retired: [],
  default: 'v1',
};

async function resolveVersion(req: GatewayRequest): Promise<PipelineResult> {
  const path = req.raw.url ?? '';

  // Extract version from URL path
  const versionMatch = path.match(/^\/(v\d+)\//);

  if (!versionMatch) {
    // No version in URL — use default
    req.metadata.apiVersion = VERSION_CONFIG.default;
    req.metadata.versionSource = 'default';
    return { action: 'continue' };
  }

  const version = versionMatch[1];

  // Check if version is retired (410 Gone)
  if (VERSION_CONFIG.retired.includes(version)) {
    return {
      action: 'short-circuit',
      statusCode: 410,
      body: {
        error: {
          code: 'version_retired',
          message: `API version ${version} has been retired. Please upgrade to ${VERSION_CONFIG.current}.`,
          migration_guide: `https://tools.stone-ai.net/docs/migration/${version}-to-${VERSION_CONFIG.current}`,
          current_version: VERSION_CONFIG.current,
        },
      },
    };
  }

  // Check if version is supported
  if (!VERSION_CONFIG.supported.includes(version) &&
      !VERSION_CONFIG.deprecated.includes(version)) {
    return {
      action: 'short-circuit',
      statusCode: 404,
      body: {
        error: {
          code: 'version_not_found',
          message: `API version ${version} does not exist. Available versions: ${VERSION_CONFIG.supported.join(', ')}`,
        },
      },
    };
  }

  req.metadata.apiVersion = version;
  req.metadata.versionSource = 'url';

  // Check date-based sub-version from header
  const dateVersion = req.raw.headers['x-api-version'] as string | undefined;
  if (dateVersion) {
    req.metadata.dateVersion = dateVersion;
  }

  return { action: 'continue' };
}
```

---

## 4. Deprecation Policy

### 4.1 Deprecation Timeline

```
Deprecation Process:

Month 0:  New version (v2) released alongside old version (v1)
          v1 status: STABLE (no changes)

Month 3:  v1 moves to DEPRECATED
          - Deprecation header added to all v1 responses
          - Email notification to all v1 API key users
          - Docs updated with migration guide

Month 6:  Second email notification
          - Dashboard warning for v1 users
          - v1 rate limits reduced by 25%

Month 9:  Final email notification
          - v1 rate limits reduced by 50%
          - Dashboard shows countdown

Month 12: v1 moves to RETIRED (Sunset)
          - All v1 requests return 410 Gone
          - Redirect to migration guide

Minimum Deprecation Period: 12 months for major versions
Minimum Deprecation Period: 3 months for minor date versions
```

### 4.2 Sunset Headers

```typescript
// File: src/gateway/middleware/deprecation-headers.ts

interface DeprecationInfo {
  version: string;
  deprecated: boolean;
  sunsetDate?: string;      // ISO 8601
  migrationUrl?: string;
  replacedBy?: string;
}

const DEPRECATION_MAP: Record<string, DeprecationInfo> = {
  // Example: v1 deprecated in favor of v2
  // 'v1': {
  //   version: 'v1',
  //   deprecated: true,
  //   sunsetDate: '2027-03-01T00:00:00Z',
  //   migrationUrl: 'https://tools.stone-ai.net/docs/migration/v1-to-v2',
  //   replacedBy: 'v2',
  // },
};

async function addDeprecationHeaders(req: GatewayRequest, res: GatewayResponse): Promise<void> {
  const version = req.metadata.apiVersion as string;
  const info = DEPRECATION_MAP[version];

  if (!info?.deprecated) return;

  // Standard headers (RFC 8594 — The Sunset HTTP Header Field)
  res.setHeader('Deprecation', 'true');
  res.setHeader('Sunset', info.sunsetDate!);

  // Link to migration guide
  res.setHeader('Link', [
    `<${info.migrationUrl}>; rel="successor-version"`,
    `<${info.migrationUrl}>; rel="deprecation"; type="text/html"`,
  ].join(', '));

  // Custom informational headers
  res.setHeader('X-API-Deprecated', 'true');
  res.setHeader('X-API-Sunset-Date', info.sunsetDate!);
  if (info.replacedBy) {
    res.setHeader('X-API-Replaced-By', info.replacedBy);
  }
}
```

### 4.3 Deprecation Notifications

```typescript
// File: src/services/deprecation-notifier.ts

class DeprecationNotifier {
  /**
   * Notify all tenants using a deprecated version.
   * Run as a scheduled job.
   */
  async notifyDeprecatedVersionUsers(version: string): Promise<void> {
    // Find tenants that made requests with this version in the last 30 days
    const activeTenants = await db.raw.$queryRaw<Array<{ tenantId: string; billingEmail: string }>>`
      SELECT DISTINCT t.id as "tenantId", t.billing_email as "billingEmail"
      FROM usage_records ur
      JOIN tenants t ON t.id = ur.tenant_id
      WHERE ur.created_at > NOW() - INTERVAL '30 days'
      AND ur.metadata->>'apiVersion' = ${version}
      AND t.status = 'ACTIVE'
    `;

    const info = DEPRECATION_MAP[version];
    if (!info) return;

    for (const tenant of activeTenants) {
      await sendEmail(tenant.billingEmail, 'api-version-deprecated', {
        version: info.version,
        sunsetDate: info.sunsetDate,
        migrationUrl: info.migrationUrl,
        replacedBy: info.replacedBy,
      });

      await auditLogger.log({
        tenantId: tenant.tenantId,
        action: 'deprecation.notified',
        resource: 'api_version',
        resourceId: version,
        details: { sunsetDate: info.sunsetDate },
      });
    }

    logger.info('Deprecation notifications sent', {
      version,
      tenantCount: activeTenants.length,
    });
  }
}
```

---

## 5. Migration Guides

### 5.1 Migration Guide Template

```markdown
# Migrating from v1 to v2

## Overview
API v2 introduces [brief summary]. v1 will be sunset on [date].

## Timeline
- **Now**: v2 is available alongside v1
- **[date]**: v1 deprecated — deprecation headers added
- **[date]**: v1 sunset — returns 410 Gone

## Breaking Changes

### 1. Agent Response Format
The `content` field is now an object instead of a string.

**v1 Response:**
```json
{
  "content": "The analysis shows..."
}
```

**v2 Response:**
```json
{
  "content": {
    "text": "The analysis shows...",
    "format": "markdown",
    "citations": []
  }
}
```

**Migration**: Access content via `response.content.text` instead of `response.content`.

### 2. Pagination Changes
Cursor-based pagination replaces offset-based.

**v1**: `GET /v1/agents?page=2&pageSize=20`
**v2**: `GET /v2/agents?cursor=abc123&limit=20`

### SDK Updates
Update your SDK to the latest version:
```bash
npm install @stone-ai/tools-sdk@latest
pip install stone-ai-tools --upgrade
go get github.com/stonefreight2017-source/stone-ai-go@latest
```
```

### 5.2 Automated Migration Detection

```typescript
// File: src/services/migration-helper.ts

class MigrationHelper {
  /**
   * Analyze a tenant's API usage and generate a personalized migration report.
   */
  async generateMigrationReport(
    tenantId: string,
    fromVersion: string,
    toVersion: string
  ): Promise<MigrationReport> {
    // Get all endpoints this tenant uses
    const usedEndpoints = await db.withTenant(tenantId, (tx) =>
      tx.usageRecord.groupBy({
        by: ['endpoint', 'method'],
        where: {
          tenantId,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        _count: true,
      })
    );

    // Cross-reference with breaking changes
    const breakingChanges = BREAKING_CHANGES[`${fromVersion}-to-${toVersion}`] ?? [];

    const affectedEndpoints = usedEndpoints
      .filter(ep =>
        breakingChanges.some(bc =>
          bc.endpoint === ep.endpoint && bc.method === ep.method
        )
      )
      .map(ep => ({
        endpoint: ep.endpoint,
        method: ep.method,
        requestCount: ep._count,
        changes: breakingChanges.filter(bc =>
          bc.endpoint === ep.endpoint && bc.method === ep.method
        ),
      }));

    return {
      tenantId,
      fromVersion,
      toVersion,
      totalEndpointsUsed: usedEndpoints.length,
      affectedEndpoints: affectedEndpoints.length,
      details: affectedEndpoints,
      estimatedEffort: this.estimateEffort(affectedEndpoints),
      migrationGuideUrl: `https://tools.stone-ai.net/docs/migration/${fromVersion}-to-${toVersion}`,
    };
  }

  private estimateEffort(affected: any[]): string {
    if (affected.length === 0) return 'none';
    if (affected.length <= 2) return 'low';
    if (affected.length <= 5) return 'medium';
    return 'high';
  }
}
```

---

## 6. Backward Compatibility Patterns

### 6.1 Additive Changes Only

```typescript
// SAFE: Adding new optional fields
// v1 response: { id, name, tier }
// v1.1 response: { id, name, tier, category }  ← New field, backward compatible

// SAFE: Adding new optional query parameter
// v1: GET /agents?page=1
// v1.1: GET /agents?page=1&category=coding  ← New param, backward compatible

// SAFE: Adding new enum value to request
// v1: format: "text" | "markdown"
// v1.1: format: "text" | "markdown" | "html"  ← New option, backward compatible
```

### 6.2 Response Envelope Stability

```typescript
// The response envelope NEVER changes within a major version

// Standard success response
interface SuccessResponse<T> {
  data: T;
  pagination?: Pagination;
}

// Standard error response
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    request_id: string;
    docs_url?: string;
    details?: Record<string, unknown>;
    errors?: ValidationError[];
  };
}

// These interfaces are FROZEN within a major version.
// Changes to the envelope = major version bump.
```

### 6.3 Date-Based Sub-Versioning for Behavioral Changes

```typescript
// File: src/gateway/middleware/date-version.ts

// Date versions allow behavioral changes within a major version
// Developers can pin to a date to get consistent behavior

interface DateVersionBehavior {
  date: string;
  changes: {
    id: string;
    description: string;
    apply: (req: GatewayRequest, res: GatewayResponse) => void;
  }[];
}

const DATE_VERSIONS: DateVersionBehavior[] = [
  {
    date: '2025-06-01',
    changes: [
      {
        id: 'default-page-size-50',
        description: 'Default page size changed from 20 to 50',
        apply: (req) => {
          if (!req.raw.query?.pageSize) {
            req.metadata.defaultPageSize = 50;
          }
        },
      },
    ],
  },
  {
    date: '2025-09-01',
    changes: [
      {
        id: 'stricter-prompt-validation',
        description: 'Prompts are validated for minimum quality',
        apply: (req) => {
          req.metadata.strictPromptValidation = true;
        },
      },
    ],
  },
];

function applyDateVersion(req: GatewayRequest): void {
  const requestedDate = req.metadata.dateVersion as string | undefined;

  // If no date version specified, use latest behavior
  if (!requestedDate) {
    for (const version of DATE_VERSIONS) {
      for (const change of version.changes) {
        change.apply(req, {} as any);
      }
    }
    return;
  }

  // Apply only changes up to the requested date
  for (const version of DATE_VERSIONS) {
    if (version.date <= requestedDate) {
      for (const change of version.changes) {
        change.apply(req, {} as any);
      }
    }
  }
}
```

---

## 7. Version Testing Strategy

### 7.1 Multi-Version Test Suite

```typescript
// File: tests/versioning/multi-version.test.ts

describe('API Version Compatibility', () => {
  const versions = ['v1'];

  for (const version of versions) {
    describe(`${version}`, () => {
      test('listAgents returns expected schema', async () => {
        const response = await fetch(`${BASE_URL}/${version}/agents`, {
          headers: { Authorization: `Bearer ${TEST_API_KEY}` },
        });

        const body = await response.json();

        // Schema validation against that version's OpenAPI spec
        const spec = loadSpec(version);
        const valid = validateAgainstSpec(body, spec, 'AgentListResponse');
        expect(valid.errors).toEqual([]);
      });

      test('invokeAgent returns expected schema', async () => {
        const response = await fetch(`${BASE_URL}/${version}/agents/test/invoke`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${TEST_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: 'Hello' }),
        });

        const body = await response.json();
        const spec = loadSpec(version);
        const valid = validateAgainstSpec(body, spec, 'AgentResponse');
        expect(valid.errors).toEqual([]);
      });
    });
  }
});
```

### 7.2 Breaking Change Detection in CI

```yaml
# File: .github/workflows/api-breaking-changes.yml

name: API Breaking Change Detection

on:
  pull_request:
    paths:
      - 'api/openapi.yaml'

jobs:
  check-breaking:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Check for breaking changes
        run: |
          npx @redocly/cli diff \
            --base origin/main:api/openapi.yaml \
            --head api/openapi.yaml \
            --fail-on-incompatible

      - name: Comment on PR if breaking
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: '⚠️ This PR contains breaking API changes. If intentional, this requires a major version bump (v1 → v2) and a migration guide.'
            });
```

---

## 8. Documentation Integration

### 8.1 Version Selector in Docs

```typescript
// Developer portal shows version-specific documentation
// Each version has its own OpenAPI spec rendered by Redoc/Stoplight

const DOC_VERSIONS = [
  { version: 'v1', spec: '/specs/v1/openapi.yaml', status: 'stable' },
  // { version: 'v2', spec: '/specs/v2/openapi.yaml', status: 'beta' },
];

// Docs URL structure:
// https://tools.stone-ai.net/docs/api/v1/...
// https://tools.stone-ai.net/docs/api/v2/...
```

### 8.2 Changelog Format

```markdown
# API Changelog

## 2026-03-09 (v1)
### Added
- `category` field on Agent objects
- `GET /v1/analytics/overview` endpoint

### Changed
- Default page size increased from 20 to 50 (X-API-Version: 2026-03-09)

### Deprecated
- `GET /v1/usage/daily` — use `GET /v1/usage/summary?granularity=daily` instead
  Sunset: 2026-09-09
```

---

## Summary

Stone AI Tools API versioning strategy:

1. **URL Path Versioning** (`/v1/`) for major versions — clear, cacheable, universally understood
2. **Date-Based Headers** for behavioral changes within a version — gradual, pin-able
3. **12-Month Deprecation** minimum for major versions with proactive notifications
4. **Breaking Change Detection** in CI prevents accidental breaks
5. **Personalized Migration Reports** help tenants understand their upgrade path
6. **Additive-Only Changes** within a version keep the API stable
7. **Sunset Headers** (RFC 8594) on every response for deprecated versions

The goal: developers build on Stone AI Tools with confidence that their integrations will not break unexpectedly.
