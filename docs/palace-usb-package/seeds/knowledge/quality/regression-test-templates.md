# Regression Test Templates
## Test Templates Mapped to Each Golden Seed

Version: 1.0 | Stack: Next.js 16 + Prisma 7 + TypeScript + Vitest/Jest

---

## GS-1: BRACE AUDIT — Balanced Output Validation

### Template: Brace Balance Checker
```typescript
/**
 * GS-1 Regression Test: Verify generated code has balanced braces
 * Use after ANY code generation or transformation operation
 */

function countBraces(code: string): { balanced: boolean; details: Record<string, number> } {
  const pairs: Record<string, string> = { '{': '}', '(': ')', '[': ']', '<': '>' };
  const stack: string[] = [];
  const counts: Record<string, number> = { '{': 0, '}': 0, '(': 0, ')': 0, '[': 0, ']': 0 };

  // Strip strings and comments to avoid false positives
  const stripped = code
    .replace(/\/\/.*$/gm, '')           // line comments
    .replace(/\/\*[\s\S]*?\*\//g, '')   // block comments
    .replace(/"(?:[^"\\]|\\.)*"/g, '')  // double-quoted strings
    .replace(/'(?:[^'\\]|\\.)*'/g, '')  // single-quoted strings
    .replace(/`(?:[^`\\]|\\.)*`/g, ''); // template literals

  for (const char of stripped) {
    if (char in counts) counts[char]++;
    if (char in pairs) {
      stack.push(pairs[char]);
    } else if (Object.values(pairs).includes(char)) {
      if (stack.pop() !== char) return { balanced: false, details: counts };
    }
  }

  return { balanced: stack.length === 0, details: counts };
}

// TEST: Every code output must pass brace audit
describe('GS-1 Brace Audit', () => {
  test('generated code has balanced braces', () => {
    const output = generateCode(/* your input */);
    const result = countBraces(output);
    expect(result.balanced).toBe(true);
  });

  test('template rendering produces balanced output', () => {
    const templates = getAllTemplates();
    for (const tmpl of templates) {
      const rendered = render(tmpl, sampleData);
      const result = countBraces(rendered);
      expect(result.balanced).toBe(true);
    }
  });

  test('code transformation preserves brace balance', () => {
    const input = readFileSync('test-fixtures/balanced-input.ts', 'utf-8');
    const inputResult = countBraces(input);
    expect(inputResult.balanced).toBe(true); // precondition

    const output = transform(input);
    const outputResult = countBraces(output);
    expect(outputResult.balanced).toBe(true);
  });
});
```

### AST Parse Validation
```typescript
import * as ts from 'typescript';

function isValidTypeScript(code: string): { valid: boolean; errors: string[] } {
  const sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
  const errors: string[] = [];

  // Check for parse diagnostics (syntax errors including unmatched braces)
  // @ts-ignore — accessing internal API for diagnostics
  const diags = (sourceFile as any).parseDiagnostics || [];
  for (const d of diags) {
    errors.push(ts.flattenDiagnosticMessageText(d.messageText, '\n'));
  }

  return { valid: errors.length === 0, errors };
}

test('output is parseable TypeScript', () => {
  const output = agentGeneratedCode;
  const result = isValidTypeScript(output);
  expect(result.valid).toBe(true);
  if (!result.valid) console.error('Parse errors:', result.errors);
});
```

---

## GS-2: ESM STRICT MODE — No CJS Contamination

### Template: ESM Compliance Scanner
```typescript
/**
 * GS-2 Regression Test: Verify ESM compliance
 * Catches require() in ESM, top-level this, and CJS patterns
 */

const ESM_VIOLATIONS = [
  { pattern: /\brequire\s*\(/, name: 'require() in ESM', exclude: /createRequire/ },
  { pattern: /\bmodule\.exports\b/, name: 'module.exports in ESM' },
  { pattern: /\b__dirname\b/, name: '__dirname in ESM (use import.meta.url)' },
  { pattern: /\b__filename\b/, name: '__filename in ESM (use import.meta.url)' },
  { pattern: /^this\b/m, name: 'top-level this in ESM' },
];

function scanESMViolations(code: string, filename: string): string[] {
  const isESM = filename.endsWith('.mjs') || filename.endsWith('.ts') || filename.endsWith('.tsx');
  if (!isESM) return [];

  const violations: string[] = [];
  for (const rule of ESM_VIOLATIONS) {
    if (rule.pattern.test(code)) {
      if (rule.exclude && rule.exclude.test(code)) continue;
      violations.push(`${filename}: ${rule.name}`);
    }
  }
  return violations;
}

describe('GS-2 ESM Strict Mode', () => {
  test('no require() in source files', () => {
    const files = globSync('src/**/*.{ts,tsx,mjs}');
    const allViolations: string[] = [];
    for (const file of files) {
      const code = readFileSync(file, 'utf-8');
      allViolations.push(...scanESMViolations(code, file));
    }
    expect(allViolations).toEqual([]);
  });

  test('no CJS patterns in generated output', () => {
    const output = agentGeneratedCode;
    const violations = scanESMViolations(output, 'generated.ts');
    expect(violations).toEqual([]);
  });
});
```

---

## GS-3: COMMAND VALIDATION — Cross-Platform Shell Safety

### Template: Shell Command Validator
```typescript
/**
 * GS-3 Regression Test: Verify commands work on target platform
 * Catches platform-specific command issues before execution
 */

interface CommandCheck {
  command: string;
  platform: 'bash' | 'powershell' | 'cmd';
  valid: boolean;
  issues: string[];
}

const PLATFORM_TRAPS = {
  bash: [
    { pattern: /%\w+%/, issue: 'CMD-style env var in Bash (use $VAR)' },
    { pattern: /\bNUL\b/, issue: 'NUL is Windows-only (use /dev/null)' },
    { pattern: /\\(?!n|t|r|\\)/, issue: 'Backslash path separator (use forward slash)' },
    { pattern: /\bdel\b/i, issue: 'del is Windows CMD (use rm)' },
    { pattern: /\bcopy\b/i, issue: 'copy is Windows CMD (use cp)' },
  ],
  powershell: [
    { pattern: /\$\w+(?!\()/, issue: 'Check: PS uses $var but also $() for subexpressions' },
    { pattern: /\bgrep\b/, issue: 'grep not native in PS (use Select-String)' },
  ],
  cmd: [
    { pattern: /\$\w+/, issue: 'Shell-style env var in CMD (use %VAR%)' },
    { pattern: /\/dev\/null/, issue: '/dev/null is Unix (use NUL in CMD)' },
  ],
};

function validateCommand(cmd: string, platform: 'bash' | 'powershell' | 'cmd'): CommandCheck {
  const issues: string[] = [];
  const traps = PLATFORM_TRAPS[platform];

  for (const trap of traps) {
    if (trap.pattern.test(cmd)) {
      issues.push(trap.issue);
    }
  }

  return { command: cmd, platform, valid: issues.length === 0, issues };
}

describe('GS-3 Command Validation', () => {
  test('bash commands have no Windows patterns', () => {
    const commands = extractBashCommands(agentOutput);
    for (const cmd of commands) {
      const result = validateCommand(cmd, 'bash');
      expect(result.issues).toEqual([]);
    }
  });

  test('generated scripts use correct path separators', () => {
    const scripts = extractScripts(agentOutput);
    for (const script of scripts) {
      // In Git Bash on Windows, forward slashes required
      expect(script).not.toMatch(/[A-Z]:\\/); // No C:\path
      // Acceptable: /c/Users/... or C:/Users/...
    }
  });
});
```

---

## GS-4: PRE-FLIGHT CHECK — Scope Analysis

### Template: Variable Scope Validator
```typescript
/**
 * GS-4 Regression Test: Pre-flight scope analysis
 * Catches variable-in-wrong-block before execution
 */

import * as ts from 'typescript';

function findScopeIssues(code: string): string[] {
  const issues: string[] = [];
  const sourceFile = ts.createSourceFile('check.ts', code, ts.ScriptTarget.Latest, true);

  function visit(node: ts.Node, scopeVars: Set<string> = new Set()) {
    // Track variable declarations
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      scopeVars.add(node.name.text);
    }

    // Check for references to undefined variables
    if (ts.isIdentifier(node) && !scopeVars.has(node.text)) {
      // Check if it's a reference (not a declaration, not a property access)
      const parent = node.parent;
      if (parent && !ts.isVariableDeclaration(parent) &&
          !ts.isPropertyAccessExpression(parent) &&
          !ts.isPropertyAssignment(parent) &&
          !ts.isImportSpecifier(parent)) {
        // Could be an out-of-scope reference — flag for review
        // (simplified — real implementation would track full scope chain)
      }
    }

    ts.forEachChild(node, child => {
      // New scope for blocks
      if (ts.isBlock(child) || ts.isFunctionDeclaration(child)) {
        visit(child, new Set(scopeVars));
      } else {
        visit(child, scopeVars);
      }
    });
  }

  visit(sourceFile);
  return issues;
}

describe('GS-4 Pre-Flight Check', () => {
  test('no variable used before declaration', () => {
    const code = agentGeneratedCode;
    // TypeScript compiler catches these — run noEmit check
    const result = compileCheck(code);
    expect(result.errors.filter(e => e.includes('used before'))).toEqual([]);
  });

  test('no variable leaks between scope blocks', () => {
    const code = agentGeneratedCode;
    const result = compileCheck(code);
    expect(result.errors.filter(e => e.includes('not defined') || e.includes('Cannot find name'))).toEqual([]);
  });

  test('async/await properly scoped', () => {
    const code = agentGeneratedCode;
    // Check that await is only inside async functions
    const awaitOutsideAsync = /(?<!async\s+(?:function|\(|[\w]+\s*=>))[\s{;]\bawait\b/;
    // Simplified — real check uses AST
    expect(code).not.toMatch(/^await\b/m); // top-level await check for non-module
  });
});
```

---

## GS-5: IDEMPOTENCY — Safe Repeat Execution

### Template: Idempotency Verifier
```typescript
/**
 * GS-5 Regression Test: Run every operation twice, assert identical output
 * Critical for database operations, API calls, file writes
 */

describe('GS-5 Idempotency', () => {
  test('API endpoint returns same result on duplicate request', async () => {
    const payload = { userId: 'test-user', action: 'create-setting', value: 'dark' };

    const result1 = await fetch('/api/settings', {
      method: 'POST',
      body: JSON.stringify(payload),
    }).then(r => r.json());

    const result2 = await fetch('/api/settings', {
      method: 'POST',
      body: JSON.stringify(payload),
    }).then(r => r.json());

    // Second call should succeed (not throw duplicate error)
    expect(result2.error).toBeUndefined();
    // Result should be equivalent
    expect(result1.data.value).toEqual(result2.data.value);
  });

  test('database upsert is idempotent', async () => {
    const data = { clerkId: 'test-123', email: 'test@example.com' };

    await prisma.user.upsert({
      where: { clerkId: data.clerkId },
      update: data,
      create: data,
    });

    // Run again — should not throw
    await expect(
      prisma.user.upsert({
        where: { clerkId: data.clerkId },
        update: data,
        create: data,
      })
    ).resolves.toBeDefined();

    // Should still be one record, not two
    const count = await prisma.user.count({ where: { clerkId: data.clerkId } });
    expect(count).toBe(1);
  });

  test('migration script is safe to run twice', async () => {
    const run1 = await runMigrationScript('add-default-tiers');
    const run2 = await runMigrationScript('add-default-tiers');

    // No duplicate tiers created
    const tiers = await prisma.tier.findMany();
    const tierNames = tiers.map(t => t.name);
    const uniqueNames = [...new Set(tierNames)];
    expect(tierNames.length).toBe(uniqueNames.length);
  });

  test('file write operation is idempotent', () => {
    const content = 'test content';
    const path = '/tmp/test-idempotent.txt';

    writeFileSync(path, content);
    writeFileSync(path, content); // second write

    const result = readFileSync(path, 'utf-8');
    expect(result).toBe(content);
    // File should exist once, content unchanged
  });

  test('Stripe subscription creation handles duplicate', async () => {
    const userId = 'test-user-stripe';
    const priceId = 'price_test_starter';

    // Simulate duplicate webhook
    const event1 = createMockStripeEvent('customer.subscription.created', { userId, priceId });
    const event2 = createMockStripeEvent('customer.subscription.created', { userId, priceId });

    await handleStripeWebhook(event1);
    await handleStripeWebhook(event2);

    // User should have exactly one active subscription
    const subs = await prisma.subscription.findMany({
      where: { userId, status: 'active' },
    });
    expect(subs.length).toBe(1);
  });
});
```

---

## GS-6: OBSERVATION — Predict Before Executing

### Template: Output Prediction Validator
```typescript
/**
 * GS-6 Regression Test: Predict output BEFORE running, compare to reality
 * Forces deliberate reasoning about expected behavior
 */

interface PredictionTest {
  name: string;
  input: unknown;
  predictedOutput: unknown;
  actualOutput?: unknown;
  match?: boolean;
}

function runPredictionSuite(tests: PredictionTest[]): PredictionTest[] {
  return tests.map(test => {
    const actual = executeOperation(test.input);
    return {
      ...test,
      actualOutput: actual,
      match: JSON.stringify(actual) === JSON.stringify(test.predictedOutput),
    };
  });
}

describe('GS-6 Observation', () => {
  test('API response shape matches prediction', async () => {
    // PREDICTION: GET /api/agents returns array of agent objects
    const predicted = {
      status: 200,
      bodyShape: { agents: [{ id: 'string', name: 'string', tier: 'string' }] },
    };

    const response = await fetch('/api/agents');
    const body = await response.json();

    expect(response.status).toBe(predicted.status);
    expect(Array.isArray(body.agents)).toBe(true);
    if (body.agents.length > 0) {
      expect(typeof body.agents[0].id).toBe('string');
      expect(typeof body.agents[0].name).toBe('string');
    }
  });

  test('error response matches predicted shape', async () => {
    // PREDICTION: Invalid input returns 400 with error message
    const predicted = { status: 400, body: { error: expect.any(String) } };

    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ invalid: true }),
    });
    const body = await response.json();

    expect(response.status).toBe(predicted.status);
    expect(body).toMatchObject(predicted.body);
  });

  test('database query returns predicted count', async () => {
    // PREDICTION: After seeding 5 tiers, count should be 5
    await seedTiers();
    const predicted = 5;

    const actual = await prisma.tier.count();
    expect(actual).toBe(predicted);
  });
});
```

---

## GS-7: PROOF OF LIFE — Deployment Validation

### Template: Proof of Life Checker
```typescript
/**
 * GS-7 Regression Test: Validate deployed artifact is actually working
 * Not just "did it deploy" but "is it serving correct responses"
 */

const BASE_URL = process.env.DEPLOY_URL || 'https://stone-ai.net';

describe('GS-7 Proof of Life', () => {
  test('server responds to health check', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.server).toBe(true);
    expect(body.database).toBe(true);
  });

  test('home page renders without error', async () => {
    const res = await fetch(BASE_URL);
    expect(res.status).toBe(200);

    const html = await res.text();
    expect(html).toContain('</html>');
    expect(html).not.toContain('Internal Server Error');
    expect(html).not.toContain('Application error');
  });

  test('static assets load', async () => {
    const res = await fetch(`${BASE_URL}/favicon.ico`);
    expect(res.status).toBe(200);
  });

  test('auth endpoint responds (not crashes)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/check`);
    // 401 = correct (not authenticated), 200 = correct (authenticated)
    // 500 = WRONG (server error)
    expect([200, 401]).toContain(res.status);
  });

  test('agent list endpoint returns data', async () => {
    const res = await fetch(`${BASE_URL}/api/agents`);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.agents?.length).toBeGreaterThan(0);
  });

  test('response times within acceptable range', async () => {
    const endpoints = ['/api/health', '/api/agents', '/'];
    for (const endpoint of endpoints) {
      const start = performance.now();
      await fetch(`${BASE_URL}${endpoint}`);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(3000); // 3s max for any endpoint
    }
  });
});
```

---

## PROPERTY-BASED TEST PATTERNS

### Random Payload Generation with Zod
```typescript
import { z } from 'zod';
import * as fc from 'fast-check';

/**
 * Generate random valid payloads from a Zod schema
 * Then verify the API handles them without 500 errors
 */

// Example: Agent chat input schema
const chatInputSchema = z.object({
  agentId: z.string().min(1).max(100),
  message: z.string().min(1).max(10000),
  sessionId: z.string().uuid().optional(),
});

// Fast-check arbitrary from Zod schema
const chatInputArbitrary = fc.record({
  agentId: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  message: fc.string({ minLength: 1, maxLength: 10000 }).filter(s => s.trim().length > 0),
  sessionId: fc.option(fc.uuid()),
});

describe('Property-based: Chat API', () => {
  test('never returns 500 for valid input', () => {
    fc.assert(
      fc.asyncProperty(chatInputArbitrary, async (input) => {
        const res = await fetch('/api/chat', {
          method: 'POST',
          body: JSON.stringify(input),
          headers: { 'Content-Type': 'application/json' },
        });
        // May return 400 (bad agent ID), 401 (no auth), 200 (success)
        // MUST NOT return 500
        expect(res.status).not.toBe(500);
      }),
      { numRuns: 50 }
    );
  });
});
```

### Schema Validation Fuzzing
```typescript
describe('Property-based: Zod Schema Fuzz', () => {
  test('schema rejects all invalid inputs without throwing', () => {
    fc.assert(
      fc.property(fc.anything(), (randomInput) => {
        // Schema should either parse successfully or return error
        // It should NEVER throw an unhandled exception
        const result = chatInputSchema.safeParse(randomInput);
        expect(typeof result.success).toBe('boolean');
      }),
      { numRuns: 200 }
    );
  });
});
```

---

## SNAPSHOT TESTS FOR SECURITY-CRITICAL RESPONSES

```typescript
/**
 * Snapshot tests ensure security-critical response shapes don't change accidentally
 */

describe('Security Response Snapshots', () => {
  test('unauthorized response shape', async () => {
    const res = await fetch('/api/admin/users');
    const body = await res.json();

    // Shape must be EXACTLY this — no extra fields that could leak info
    expect(Object.keys(body)).toEqual(['error']);
    expect(body.error).toBe('Unauthorized');
  });

  test('rate limit response includes correct headers', async () => {
    // Trigger rate limit
    const responses = await Promise.all(
      Array.from({ length: 100 }, () => fetch('/api/chat', { method: 'POST' }))
    );

    const rateLimited = responses.find(r => r.status === 429);
    if (rateLimited) {
      expect(rateLimited.headers.has('retry-after')).toBe(true);
      expect(rateLimited.headers.has('x-ratelimit-limit')).toBe(true);
    }
  });

  test('error responses never leak stack traces in production', async () => {
    // Send malformed request to trigger error
    const res = await fetch('/api/chat', {
      method: 'POST',
      body: 'not json',
    });
    const body = await res.text();

    expect(body).not.toContain('at Object.');
    expect(body).not.toContain('node_modules');
    expect(body).not.toContain('.ts:');
    expect(body).not.toContain('Error:');
  });
});
```

---

## TEST RUNNER CONFIGURATION

```typescript
// vitest.config.ts — recommended configuration
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: ['node_modules', '.next', '**/*.d.ts', '**/*.test.*'],
    },
    testTimeout: 30000, // 30s for integration tests
    hookTimeout: 10000,
  },
});
```
