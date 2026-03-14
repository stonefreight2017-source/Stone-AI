# Static Analysis Rules
## ESLint, TypeScript Strict, Custom Rules, and Pre-Commit Chain

Version: 1.0 | Stack: Next.js 16 + Prisma 7 + TypeScript Strict

---

## 1. ESLINT CONFIGURATION

### Critical Rules (MUST enable)
```jsonc
// .eslintrc.json — essential rules for our stack
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/strict-type-checked"
  ],
  "plugins": ["@typescript-eslint"],
  "parserOptions": {
    "project": "./tsconfig.json"
  },
  "rules": {
    // PROMISE SAFETY — prevents unhandled rejections
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-misused-promises": "error",
    // ↑ Catches: onClick={async () => {}} without error handling
    // ↑ Catches: forgotten await on async function call

    // TYPE SAFETY
    "@typescript-eslint/strict-boolean-expressions": "error",
    // ↑ Catches: if (value) when value could be 0 or ""
    "@typescript-eslint/consistent-type-imports": ["error", {
      "prefer": "type-imports",
      "fixStyle": "inline-type-imports"
    }],
    // ↑ Ensures: import type { X } from './y' — prevents circular dep issues

    // NO UNSAFE PATTERNS
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-non-null-assertion": "warn",
    "@typescript-eslint/no-unnecessary-condition": "error",

    // CONSISTENCY
    "@typescript-eslint/naming-convention": ["error",
      { "selector": "interface", "format": ["PascalCase"] },
      { "selector": "typeAlias", "format": ["PascalCase"] },
      { "selector": "enum", "format": ["PascalCase"] }
    ],

    // IMPORT ORDER
    "import/order": ["error", {
      "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
      "newlines-between": "always",
      "alphabetize": { "order": "asc" }
    }]
  }
}
```

### Rules Explanation Quick Reference
```
| Rule                          | What it catches                           | Why critical      |
|-------------------------------|-------------------------------------------|--------------------|
| no-floating-promises          | async fn called without await or .catch   | Silent failures    |
| no-misused-promises           | Promise in boolean context, void handlers | Logic bugs         |
| strict-boolean-expressions    | if(str) when str could be ""              | Subtle bugs        |
| consistent-type-imports       | import X from './y' when only type needed | Bundle size, cycles|
| no-explicit-any               | any type usage                            | Type safety bypass |
| no-unnecessary-condition      | if(x) when x is always truthy             | Dead code          |
```

---

## 2. TYPESCRIPT STRICT CONFIGURATION

### tsconfig.json Strict Options
```jsonc
{
  "compilerOptions": {
    // STANDARD STRICT
    "strict": true,
    // ↑ Enables: strictNullChecks, strictFunctionTypes, strictBindCallApply,
    //   strictPropertyInitialization, noImplicitAny, noImplicitThis,
    //   alwaysStrict, useUnknownInCatchVariables

    // ADDITIONAL STRICT — beyond "strict": true
    "noUncheckedIndexedAccess": true,
    // ↑ arr[0] is T | undefined, not T
    // ↑ Catches: accessing array/object index without null check
    // ↑ Example: const first = items[0]; first.name → ERROR (might be undefined)

    "exactOptionalPropertyTypes": true,
    // ↑ { x?: string } means x can be missing but NOT explicitly undefined
    // ↑ Catches: obj.x = undefined when x is optional (should use delete obj.x)

    "noPropertyAccessFromIndexSignature": true,
    // ↑ Forces bracket notation for index signatures: obj["key"] not obj.key
    // ↑ Makes it clear when you're accessing a dynamic key

    "noImplicitReturns": true,
    // ↑ Every code path must return a value

    "noFallthroughCasesInSwitch": true,
    // ↑ switch cases must break/return

    "forceConsistentCasingInFileNames": true,
    // ↑ CRITICAL for Windows → Linux deploy (case-insensitive dev, sensitive prod)
  }
}
```

### Why Each Strict Option Matters
```
noUncheckedIndexedAccess:
  // WITHOUT (dangerous):
  const user = users[0]; // type: User
  user.name; // compiles but crashes if users is empty

  // WITH (safe):
  const user = users[0]; // type: User | undefined
  user?.name; // forced to handle undefined

exactOptionalPropertyTypes:
  // WITHOUT:
  interface Config { theme?: 'light' | 'dark' }
  const c: Config = { theme: undefined }; // allowed but wrong

  // WITH:
  const c: Config = { theme: undefined }; // ERROR
  const c: Config = {}; // correct — theme is missing, not undefined

forceConsistentCasingInFileNames:
  // Catches: import { X } from './MyFile' when file is 'myFile.ts'
  // Works on Windows (case-insensitive), CRASHES on Linux (case-sensitive)
  // This option catches it at compile time on Windows
```

---

## 3. CUSTOM RULES WORTH WRITING

### Rule: No Raw SQL Outside queryRaw
```typescript
/**
 * ESLint custom rule: prisma-no-raw-sql
 * Ensures all raw SQL goes through Prisma's queryRaw/executeRaw
 * Prevents SQL injection from ad-hoc query construction
 */

// Detection patterns (for manual/grep-based checking):
const RAW_SQL_PATTERNS = [
  /`SELECT\s/i,
  /`INSERT\s/i,
  /`UPDATE\s/i,
  /`DELETE\s/i,
  /`DROP\s/i,
  /`ALTER\s/i,
  /`CREATE\s/i,
  // Exclude prisma.$queryRaw and prisma.$executeRaw
];

// Grep command to find violations:
// grep -rn "SELECT\|INSERT\|UPDATE\|DELETE" src/ --include="*.ts" | grep -v "queryRaw\|executeRaw\|prisma\.\$"

// ESLint rule skeleton:
// module.exports = {
//   create(context) {
//     return {
//       TemplateLiteral(node) {
//         const text = context.getSourceCode().getText(node);
//         if (/SELECT|INSERT|UPDATE|DELETE/i.test(text)) {
//           // Check parent chain for prisma.$queryRaw
//           if (!isInsidePrismaRaw(node)) {
//             context.report({ node, message: 'Raw SQL must use prisma.$queryRaw' });
//           }
//         }
//       }
//     };
//   }
// };
```

### Rule: No process.env Outside lib/env.ts
```typescript
/**
 * All env var access should go through a centralized env module
 * Prevents: typos in env var names, missing validation, scattered access
 */

// Detection:
// grep -rn "process\.env\." src/ --include="*.ts" | grep -v "lib/env" | grep -v "node_modules"

// Pattern to enforce:
// lib/env.ts — single source of truth
// export const env = {
//   DATABASE_URL: requireEnv('DATABASE_URL'),
//   CLERK_SECRET: requireEnv('CLERK_SECRET_KEY'),
//   STRIPE_SECRET: requireEnv('STRIPE_SECRET_KEY'),
// };
//
// function requireEnv(name: string): string {
//   const val = process.env[name];
//   if (!val) throw new Error(`Missing env: ${name}`);
//   return val;
// }

// Everywhere else: import { env } from '@/lib/env';
// NEVER: process.env.WHATEVER
```

### Rule: No Response.json() Without Status
```typescript
/**
 * Every API response must have an explicit status code
 * Prevents: accidental 200 for error responses
 */

// BAD:
// return Response.json({ error: 'Not found' }); // sends 200!

// GOOD:
// return Response.json({ error: 'Not found' }, { status: 404 });

// Detection regex:
// /Response\.json\([^)]+\)(?!\s*,\s*\{)/
// Matches Response.json(data) without a second argument

// Grep:
// grep -rn "Response\.json(" src/app/api/ --include="*.ts" | grep -v "status:"
```

---

## 4. AST CHECKS — Structural Violations

### API Route Without Zod = Violation
```typescript
/**
 * Every POST/PUT/PATCH API route MUST validate input with Zod
 * Check: does the route handler call .parse() or .safeParse()?
 */

// Detection script:
// 1. Find all route.ts files with POST/PUT/PATCH exports
// 2. Check if they import from 'zod'
// 3. Check if they call .parse() or .safeParse()

// Grep-based detection:
// Step 1: Find POST routes
// grep -rl "export.*async.*function.*POST\|export.*POST" src/app/api/ --include="*.ts"

// Step 2: From those files, check for Zod usage
// For each file from step 1:
//   grep -l "\.parse\(\|\.safeParse\(\|z\.\|zod" $file || echo "VIOLATION: $file"

// AST check pseudocode:
// for file in api_routes:
//   if has_mutation_export(file) and not has_zod_validation(file):
//     report("API route without Zod validation: " + file)
```

### Prisma Model Without Audit Trail = Violation
```typescript
/**
 * Every Prisma model that stores user data MUST have:
 * - createdAt DateTime @default(now())
 * - updatedAt DateTime @updatedAt
 *
 * Exceptions: pure junction tables, enum-like lookup tables
 */

// Detection: parse schema.prisma
// grep -B1 -A20 "^model " prisma/schema.prisma | grep -v "createdAt\|updatedAt"
// Then verify each model has both fields

// Models that MUST have audit trail:
const AUDITED_MODELS = [
  'User', 'Subscription', 'ChatSession', 'ChatMessage',
  'Bestie', 'Referral', 'Setting', 'ForumPost', 'ForumComment',
];

// Models exempt from audit trail:
const EXEMPT_MODELS = [
  '_prisma_migrations', // Prisma internal
];
```

---

## 5. PRE-COMMIT HOOK CHAIN

### Hook Execution Order
```bash
#!/bin/bash
# .husky/pre-commit — execute in strict order, fail fast

set -e  # Exit on first failure

echo "Pre-commit checks starting..."

# STEP 1: Lint staged files only (fast)
echo "[1/5] Linting..."
npx lint-staged

# STEP 2: Type-check (checks entire project, not just staged)
echo "[2/5] Type-checking..."
npx tsc --noEmit

# STEP 3: Run tests affected by changed files
echo "[3/5] Running affected tests..."
npx vitest related --run $(git diff --cached --name-only --diff-filter=ACMR | grep -E '\.(ts|tsx)$' | tr '\n' ' ')

# STEP 4: Schema validation (if Prisma files changed)
if git diff --cached --name-only | grep -q "prisma/"; then
  echo "[4/5] Validating Prisma schema..."
  npx prisma validate
else
  echo "[4/5] Prisma schema unchanged, skipping..."
fi

# STEP 5: Security check (no secrets in staged files)
echo "[5/5] Checking for secrets..."
if git diff --cached --name-only | xargs grep -l "sk_live_\|sk_test_\|PRIVATE_KEY" 2>/dev/null; then
  echo "ERROR: Possible secret detected in staged files!"
  exit 1
fi

echo "All pre-commit checks passed."
```

### lint-staged Configuration
```jsonc
// package.json or .lintstagedrc.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix --max-warnings 0",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ],
    "prisma/schema.prisma": [
      "npx prisma format"
    ]
  }
}
```

### Secret Detection Patterns
```bash
# Patterns to scan for in pre-commit:
SECRET_PATTERNS=(
  "sk_live_"           # Stripe live secret key
  "sk_test_"           # Stripe test secret key (shouldn't be committed either)
  "pk_live_"           # Stripe live publishable key
  "PRIVATE.KEY"        # Generic private key
  "-----BEGIN.*KEY"    # PEM-encoded keys
  "password\s*="       # Hardcoded passwords
  "secret\s*="         # Hardcoded secrets
  "token\s*="          # Hardcoded tokens
  "AIza"               # Google API key prefix
  "AKIA"               # AWS access key prefix
)

# Files to ALWAYS exclude from commits:
# .env, .env.local, .env.production
# *.pem, *.key, *.p12
# credentials.json, service-account.json
```

---

## 6. QUICK REFERENCE: Analysis Severity Levels

```
BLOCK COMMIT (error):
  - no-floating-promises violation
  - no-misused-promises violation
  - TypeScript errors (any)
  - Secret detected in staged files
  - API route without Zod validation
  - Prisma schema validation failure

WARN BUT ALLOW (warning):
  - no-explicit-any (in test files only)
  - no-non-null-assertion (with justification comment)
  - Missing audit trail on new model (may be intentional)

AUTOFIX:
  - Import order
  - Consistent type imports
  - Prettier formatting
  - Prisma schema formatting
```
