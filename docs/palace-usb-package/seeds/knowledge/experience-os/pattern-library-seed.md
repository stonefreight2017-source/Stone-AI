# Pattern Library — Cold Start Seeds

> Initial patterns to bootstrap the Experience OS from our actual build history.
> These patterns are pre-validated by founder experience and enter as `status: "active"` (skip quarantine).

---

## How These Seeds Work

1. On Experience OS activation, these patterns are loaded into `~/palace/experience/_global/seed-patterns.json`.
2. Each pattern is then copied to the relevant agent's `patterns.json` based on `domain_scope`.
3. Seeded patterns have `source: "seeded"` to distinguish them from extracted patterns.
4. They start with `confidence: 4` (high but not max — real experience can still override them).
5. If a seeded pattern proves wrong under real conditions, it follows normal demotion rules.

---

## Pattern Format

```json
{
  "id": "seed-XXX",
  "created": "2026-03-08T00:00:00.000Z",
  "last_validated": "2026-03-08T00:00:00.000Z",
  "rule": "human-readable rule",
  "evidence": "what happened that proved this",
  "evidence_count": 1,
  "success_rate": 1.0,
  "confidence": 4,
  "domain_scope": "backend|frontend|devops|security|strategy|cross-domain",
  "status": "active",
  "applications": 0,
  "last_applied": null,
  "tags": ["keyword1", "keyword2"],
  "failure_taxonomy": "category this pattern prevents",
  "source": "seeded",
  "supersedes": null,
  "superseded_by": null
}
```

---

## Seed Pattern 1: ESM const vs let

```json
{
  "id": "seed-001",
  "rule": "Always use `let` for variables that might be reassigned in ESM injected code. `const` in injected blocks causes silent failures when the variable needs reassignment downstream.",
  "evidence": "Multiple failures where const declarations in dynamically injected ESM code blocks caused runtime errors that syntax validation (node --check) did not catch.",
  "evidence_count": 3,
  "success_rate": 1.0,
  "confidence": 4,
  "domain_scope": "backend",
  "tags": ["esm", "const", "let", "injection", "runtime"],
  "failure_taxonomy": "logic_error"
}
```

## Seed Pattern 2: require() Fails in .mjs

```json
{
  "id": "seed-002",
  "rule": "Never use require() in .mjs files or ESM contexts. Always use dynamic import() instead. require() is not available in ESM and will throw ERR_REQUIRE_ESM.",
  "evidence": "Repeated failures when agents used require() in ESM modules. The fix was always the same: replace with await import().",
  "evidence_count": 5,
  "success_rate": 1.0,
  "confidence": 5,
  "domain_scope": "backend",
  "tags": ["esm", "require", "import", "mjs", "module"],
  "failure_taxonomy": "wrong_approach"
}
```

## Seed Pattern 3: PowerShell Quote Mangling

```json
{
  "id": "seed-003",
  "rule": "Avoid PowerShell for commands with complex or multi-nested string arguments. PowerShell mangles quotes in ways that are hard to debug. Use Node.js fs operations or Git Bash instead.",
  "evidence": "Multiple build tasks failed because PowerShell reinterpreted nested quotes in CLI commands. Switching to Node fs.writeFileSync or Git Bash resolved every instance.",
  "evidence_count": 4,
  "success_rate": 1.0,
  "confidence": 5,
  "domain_scope": "devops",
  "tags": ["powershell", "quotes", "escaping", "windows", "git-bash"],
  "failure_taxonomy": "wrong_approach"
}
```

## Seed Pattern 4: node --check Is Necessary But Not Sufficient

```json
{
  "id": "seed-004",
  "rule": "Syntax validation (node --check) catches parse errors but misses runtime errors. Always follow syntax check with actual execution or at minimum a dry-run import. Never declare 'done' based solely on syntax validation.",
  "evidence": "Golden Seed GS-7. Agents declared tasks complete after node --check passed, but runtime errors existed (undefined variables, wrong module paths, type mismatches).",
  "evidence_count": 6,
  "success_rate": 0.95,
  "confidence": 5,
  "domain_scope": "cross-domain",
  "tags": ["validation", "syntax", "runtime", "verification", "gs-7"],
  "failure_taxonomy": "logic_error"
}
```

## Seed Pattern 5: Scope Mismatch in Injected Code

```json
{
  "id": "seed-005",
  "rule": "When injecting code blocks into templates or dynamic contexts, declare and use all variables in the same contiguous block. Never assume a variable from an outer scope will be available in injected code.",
  "evidence": "Agents wrote code that referenced variables across injection boundaries, leading to ReferenceError at runtime. Consolidating declarations and usage into the same block fixed every case.",
  "evidence_count": 3,
  "success_rate": 1.0,
  "confidence": 4,
  "domain_scope": "backend",
  "tags": ["scope", "injection", "variables", "closure", "runtime"],
  "failure_taxonomy": "scope_miss"
}
```

## Seed Pattern 6: Global String Replacement

```json
{
  "id": "seed-006",
  "rule": "Use split().join() for global string replacement instead of .replace(), which only replaces the first occurrence. Alternatively, use .replaceAll() or .replace() with a global regex.",
  "evidence": "Multiple instances where agents used .replace('x', 'y') expecting all occurrences to be replaced. Only the first was replaced, causing subtle bugs.",
  "evidence_count": 3,
  "success_rate": 1.0,
  "confidence": 4,
  "domain_scope": "cross-domain",
  "tags": ["string", "replace", "split", "join", "global"],
  "failure_taxonomy": "logic_error"
}
```

## Seed Pattern 7: Verification Theater

```json
{
  "id": "seed-007",
  "rule": "Never declare a task complete without running the actual code in a real environment. Reading code, mental simulation, and syntax checks are 'verification theater' — they feel productive but miss real errors. The bar is: did you execute it and see it work?",
  "evidence": "8 consecutive failures traced to agents declaring success after reading/reviewing code without executing it. Every failure would have been caught by a single real execution.",
  "evidence_count": 8,
  "success_rate": 0.92,
  "confidence": 5,
  "domain_scope": "cross-domain",
  "tags": ["verification", "execution", "testing", "theater", "done-criteria"],
  "failure_taxonomy": "wrong_approach"
}
```

## Seed Pattern 8: D17 Pre-Action Checkpoint

```json
{
  "id": "seed-008",
  "rule": "If the supervisor (Claude) has read more than 2 files without dispatching an agent, it is a D17 violation — the supervisor is doing agent work. Stop, identify the correct specialist, and dispatch immediately.",
  "evidence": "Pattern observed where the supervisor would read 5-10 files 'to understand the problem' before dispatching, effectively doing the agent's exploration work. Dispatching earlier with clear scope produced better results.",
  "evidence_count": 4,
  "success_rate": 0.88,
  "confidence": 4,
  "domain_scope": "strategy",
  "tags": ["dispatch", "d17", "supervisor", "delegation", "checkpoint"],
  "failure_taxonomy": "wrong_approach"
}
```

## Seed Pattern 9: Zod .strict() on All Mutations

```json
{
  "id": "seed-009",
  "rule": "Every Zod schema used for mutation (POST, PUT, PATCH, DELETE) must use .strict() to reject unexpected fields. Without .strict(), attackers can inject extra fields that pass validation and reach the database.",
  "evidence": "Security audit finding. Multiple mutation endpoints accepted extra fields silently. Adding .strict() caught injection attempts during testing.",
  "evidence_count": 2,
  "success_rate": 1.0,
  "confidence": 5,
  "domain_scope": "security",
  "tags": ["zod", "strict", "validation", "mutation", "injection"],
  "failure_taxonomy": "security_gap"
}
```

## Seed Pattern 10: Avatar XSS via SVG Data URIs

```json
{
  "id": "seed-010",
  "rule": "Block SVG data URIs in user-uploadable image fields (avatars, profile images). Only allow png, jpeg, webp, gif base64 data URIs. SVG data URIs can contain embedded JavaScript that executes on render.",
  "evidence": "Discovered during security hardening. SVG data:image/svg+xml URIs can contain <script> tags or event handlers that execute XSS when rendered in an <img> or background-image.",
  "evidence_count": 1,
  "success_rate": 1.0,
  "confidence": 5,
  "domain_scope": "security",
  "tags": ["xss", "svg", "avatar", "data-uri", "sanitization"],
  "failure_taxonomy": "security_gap"
}
```

## Seed Pattern 11: Prisma Unique Constraints Over App-Level Checks

```json
{
  "id": "seed-011",
  "rule": "Enforce uniqueness at the Prisma schema level (@@unique) rather than checking in application code. App-level unique checks have race conditions — two concurrent requests can both pass the check and create duplicates.",
  "evidence": "Referral system had duplicate referral codes despite app-level uniqueness check. Adding @@unique to the Prisma model eliminated the race condition.",
  "evidence_count": 2,
  "success_rate": 1.0,
  "confidence": 5,
  "domain_scope": "backend",
  "tags": ["prisma", "unique", "constraint", "race-condition", "database"],
  "failure_taxonomy": "logic_error"
}
```

## Seed Pattern 12: Easter Egg Claims on User Model

```json
{
  "id": "seed-012",
  "rule": "Store easter egg claims (found/discovered status) on the User model, not on related models like Bestie. If the related model is deleted and recreated, claims stored there are lost. User model persists through feature resets.",
  "evidence": "Easter egg discovery status was lost when besties were deleted and recreated. Moving claims to User model fixed the persistence issue.",
  "evidence_count": 1,
  "success_rate": 1.0,
  "confidence": 4,
  "domain_scope": "backend",
  "tags": ["easter-egg", "persistence", "user-model", "claims", "data-modeling"],
  "failure_taxonomy": "scope_miss"
}
```

## Seed Pattern 13: Badge Logic Server-Side Only

```json
{
  "id": "seed-013",
  "rule": "Badge grant/revoke logic must be server-side only with no direct write endpoints exposed to the client. Badges are trust signals — client-side badge management is a privilege escalation vector.",
  "evidence": "Architecture decision during badge system design. Server-side-only enforcement prevents users from granting themselves badges.",
  "evidence_count": 1,
  "success_rate": 1.0,
  "confidence": 5,
  "domain_scope": "security",
  "tags": ["badges", "server-side", "privilege", "trust", "authorization"],
  "failure_taxonomy": "security_gap"
}
```

## Seed Pattern 14: CSP Headers Before Feature Launch

```json
{
  "id": "seed-014",
  "rule": "Set Content Security Policy headers before launching any feature that renders user content or loads external resources. Retrofitting CSP after launch breaks things. Setting it first constrains development in the right direction.",
  "evidence": "CSP was part of the security hardening phase. Features built after CSP was in place required fewer security fixes than features built before.",
  "evidence_count": 2,
  "success_rate": 0.90,
  "confidence": 4,
  "domain_scope": "security",
  "tags": ["csp", "headers", "security", "content-security-policy", "launch"],
  "failure_taxonomy": "security_gap"
}
```

## Seed Pattern 15: Rate Limiting Before Auth Check Order

```json
{
  "id": "seed-015",
  "rule": "Apply rate limiting before authentication checks in middleware. If rate limiting comes after auth, unauthenticated requests bypass rate limiting entirely, enabling brute-force attacks on auth endpoints.",
  "evidence": "Architecture review identified that rate-limit-after-auth leaves the auth endpoint itself unprotected. Reordering middleware fixed the gap.",
  "evidence_count": 1,
  "success_rate": 1.0,
  "confidence": 4,
  "domain_scope": "security",
  "tags": ["rate-limiting", "auth", "middleware", "order", "brute-force"],
  "failure_taxonomy": "security_gap"
}
```

## Seed Pattern 16: Clerk Session Check Before Business Logic

```json
{
  "id": "seed-016",
  "rule": "Always verify the Clerk session before executing any business logic in API routes. If session check fails, return 401 immediately. Never run queries or mutations for unauthenticated requests — it wastes resources and leaks timing information.",
  "evidence": "Multiple API routes were executing database queries before checking authentication, leaking response time differences that could reveal data existence.",
  "evidence_count": 3,
  "success_rate": 1.0,
  "confidence": 5,
  "domain_scope": "backend",
  "tags": ["clerk", "auth", "session", "api", "early-return"],
  "failure_taxonomy": "security_gap"
}
```

## Seed Pattern 17: Cloudflare Proxy + SSL Full Strict

```json
{
  "id": "seed-017",
  "rule": "When using Cloudflare DNS proxy (orange cloud ON), set SSL mode to Full (Strict). Flexible mode creates a redirect loop with Vercel. Full without Strict allows MITM between Cloudflare and origin.",
  "evidence": "Deployment debugging session. SSL mode mismatch caused redirect loops that were hard to diagnose because the symptom looked like a Next.js config issue.",
  "evidence_count": 1,
  "success_rate": 1.0,
  "confidence": 5,
  "domain_scope": "devops",
  "tags": ["cloudflare", "ssl", "vercel", "dns", "redirect-loop"],
  "failure_taxonomy": "wrong_approach"
}
```

## Seed Pattern 18: AES-256-GCM for Data at Rest

```json
{
  "id": "seed-018",
  "rule": "Use AES-256-GCM (not CBC) for encrypting sensitive data at rest. GCM provides authenticated encryption — it detects tampering. CBC requires a separate HMAC step that is easy to forget or implement incorrectly.",
  "evidence": "Architecture decision during encryption implementation. GCM was chosen over CBC for its built-in authentication, reducing the surface area for implementation errors.",
  "evidence_count": 1,
  "success_rate": 1.0,
  "confidence": 5,
  "domain_scope": "security",
  "tags": ["aes", "gcm", "encryption", "at-rest", "authenticated"],
  "failure_taxonomy": "security_gap"
}
```

## Seed Pattern 19: Tailwind Class Conflicts with shadcn/ui

```json
{
  "id": "seed-019",
  "rule": "When customizing shadcn/ui components with Tailwind, use the cn() utility to merge classes. Direct className overrides can be silently ignored because Tailwind doesn't guarantee specificity order. cn() from class-variance-authority resolves conflicts correctly.",
  "evidence": "Frontend tasks where custom styles appeared not to apply to shadcn/ui components. Using cn() to merge instead of override fixed every case.",
  "evidence_count": 3,
  "success_rate": 1.0,
  "confidence": 4,
  "domain_scope": "frontend",
  "tags": ["tailwind", "shadcn", "cn", "classname", "merge"],
  "failure_taxonomy": "logic_error"
}
```

## Seed Pattern 20: Next.js App Router — Server vs Client Boundaries

```json
{
  "id": "seed-020",
  "rule": "In Next.js App Router, 'use client' must be at the top of the file, before any imports. A component that uses hooks (useState, useEffect, etc.) MUST be a client component. Parent components importing client components do NOT automatically become client components — they remain server components unless they also have 'use client'.",
  "evidence": "Multiple frontend tasks produced hydration errors or 'useState is not a function' errors from incorrect server/client boundary placement.",
  "evidence_count": 4,
  "success_rate": 0.95,
  "confidence": 5,
  "domain_scope": "frontend",
  "tags": ["nextjs", "app-router", "use-client", "server-component", "hydration"],
  "failure_taxonomy": "logic_error"
}
```

## Seed Pattern 21: Prisma Client Generation After Schema Changes

```json
{
  "id": "seed-021",
  "rule": "After any change to schema.prisma, always run `npx prisma generate` before running the application or tests. The Prisma Client is generated code — it doesn't auto-update when the schema file changes. Forgetting this step causes type errors and missing field errors that look like schema bugs but are stale client bugs.",
  "evidence": "Multiple incidents where agents modified schema.prisma and then reported 'field not found' errors. Running prisma generate resolved every instance.",
  "evidence_count": 5,
  "success_rate": 1.0,
  "confidence": 5,
  "domain_scope": "backend",
  "tags": ["prisma", "generate", "schema", "client", "stale"],
  "failure_taxonomy": "missing_context"
}
```

## Seed Pattern 22: Vercel Environment Variable Gotcha

```json
{
  "id": "seed-022",
  "rule": "Vercel environment variables set in the dashboard are NOT available during build time unless explicitly marked for the build environment. Variables prefixed with NEXT_PUBLIC_ are embedded at build time and cannot be changed without redeployment. Server-only variables (no NEXT_PUBLIC_ prefix) are available at runtime only.",
  "evidence": "Deployment issues where API keys worked locally but not in production. The variable was set in Vercel but not flagged for the correct environment (Production vs Preview vs Development).",
  "evidence_count": 2,
  "success_rate": 1.0,
  "confidence": 4,
  "domain_scope": "devops",
  "tags": ["vercel", "env", "NEXT_PUBLIC", "build-time", "runtime"],
  "failure_taxonomy": "missing_context"
}
```

## Seed Pattern 23: One Specialty Per Dispatch

```json
{
  "id": "seed-023",
  "rule": "Never combine work from two different specialist domains in a single agent dispatch. If a task touches frontend AND backend, that is TWO dispatches. Multi-domain dispatches produce lower quality output because the agent's prompt is split across concerns.",
  "evidence": "Directive D2 Rule 1. Multiple instances where combined frontend+backend dispatches produced work that was mediocre in both areas. Splitting into focused dispatches improved quality in every case.",
  "evidence_count": 6,
  "success_rate": 0.90,
  "confidence": 5,
  "domain_scope": "strategy",
  "tags": ["dispatch", "specialist", "focus", "d2", "single-domain"],
  "failure_taxonomy": "wrong_approach"
}
```

## Seed Pattern 24: Sequential When Dependent

```json
{
  "id": "seed-024",
  "rule": "When tasks have dependencies, dispatch sequentially: DB schema before API routes before UI components. Parallel dispatch of dependent tasks leads to integration errors because later agents don't have the outputs of earlier agents.",
  "evidence": "Directive D2 Rule 4. Frontend agents building against API contracts that didn't exist yet produced code that had to be rewritten after the backend was done.",
  "evidence_count": 3,
  "success_rate": 1.0,
  "confidence": 5,
  "domain_scope": "strategy",
  "tags": ["dispatch", "sequential", "dependency", "d2", "order"],
  "failure_taxonomy": "integration_error"
}
```

---

## Loading These Seeds

Implementation for `palace.mjs` or activation script:

```javascript
const fs = require('fs');
const path = require('path');

const SEEDS_FILE = path.join(__dirname, 'seed-patterns.json');
const EXPERIENCE_DIR = path.join(process.env.HOME, 'palace', 'experience');

function loadSeedPatterns() {
  const seeds = JSON.parse(fs.readFileSync(SEEDS_FILE, 'utf-8'));

  // Write to global seeds
  const globalDir = path.join(EXPERIENCE_DIR, '_global');
  fs.mkdirSync(globalDir, { recursive: true });
  fs.writeFileSync(
    path.join(globalDir, 'seed-patterns.json'),
    JSON.stringify(seeds, null, 2)
  );

  // Distribute to agent directories by domain_scope
  const domainToAgents = {
    'backend': ['backend-engineer'],
    'frontend': ['frontend-engineer'],
    'security': ['security-engineer', 'wiz'],
    'devops': ['devops-engineer'],
    'strategy': ['stone', 'cardinal'],
    'cross-domain': [] // cross-domain seeds go to ALL agents
  };

  for (const seed of seeds) {
    const targetAgents = seed.domain_scope === 'cross-domain'
      ? Object.values(domainToAgents).flat()
      : (domainToAgents[seed.domain_scope] || []);

    for (const agent of targetAgents) {
      const agentDir = path.join(EXPERIENCE_DIR, agent);
      fs.mkdirSync(agentDir, { recursive: true });
      const patternsFile = path.join(agentDir, 'patterns.json');
      const existing = fs.existsSync(patternsFile)
        ? JSON.parse(fs.readFileSync(patternsFile, 'utf-8'))
        : [];

      if (!existing.find(p => p.id === seed.id)) {
        existing.push(seed);
        fs.writeFileSync(patternsFile, JSON.stringify(existing, null, 2));
      }
    }
  }

  console.log(`Loaded ${seeds.length} seed patterns into Experience OS.`);
}

module.exports = { loadSeedPatterns };
```

---

## Seed Maintenance Rules

1. Seeded patterns are NOT immune to demotion. If real experience contradicts a seed, the seed is demoted like any other pattern.
2. Seeds start with `applications: 0` — they need to prove themselves in practice.
3. A seeded pattern that goes 60 days without being applied gets flagged for relevance review.
4. Founder can add new seeds at any time by adding to this file and re-running the loader.
5. Seed IDs use the `seed-XXX` prefix to distinguish them from extracted patterns (`pattern-XXX`).
