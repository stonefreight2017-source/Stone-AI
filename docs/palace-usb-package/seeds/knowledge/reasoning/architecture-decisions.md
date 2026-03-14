# Architecture Decisions

## Core Principle

Architecture decisions are the hardest to reverse. A wrong function can be rewritten in an hour. A wrong architecture lives with you for years. This seed provides decision trees for the choices that matter most, calibrated for the Next.js + Prisma + PostgreSQL stack.

## The Architecture Decision Template

Before any architecture choice:

```
1. WHAT PROBLEM AM I SOLVING?
   - State the problem in one sentence
   - Is this a current problem or anticipated future problem?
   - If future: how confident am I it will actually happen? (see Confidence Calibration)

2. WHAT ARE THE CONSTRAINTS?
   - Team size and expertise
   - Timeline
   - Budget
   - Existing infrastructure
   - User expectations

3. WHAT ARE THE OPTIONS?
   - List 2-3 genuinely different approaches
   - For each: cost to implement, cost to maintain, cost to reverse

4. WHICH OPTION HAS THE BEST WORST-CASE?
   - Not the best best-case — the best WORST-case
   - You're optimizing for survivability, not perfection
```

## Decision Tree: Monolith vs Microservices vs Modular Monolith

```
START: How many developers work on this codebase?

  ≤5 developers:
    → MONOLITH. Period. Microservices for small teams is self-inflicted pain.
    → The overhead of service boundaries, network calls, distributed debugging,
      and deployment coordination exceeds any benefit.

  6-20 developers:
    → MODULAR MONOLITH.
    → Single deployable, but with clear module boundaries.
    → Each module owns its domain, exposes interfaces, hides internals.
    → Can be split into services LATER if needed (and it probably won't be).

  >20 developers:
    → CONSIDER microservices, but only if:
      [] Teams need to deploy independently (not just work independently)
      [] Different parts need different scaling characteristics
      [] Different parts need different tech stacks
    → If none of these: modular monolith still wins.

  THE HEURISTIC: "You probably don't need microservices."
  - If you're asking "should we use microservices?" the answer is almost always no.
  - Microservices solve ORGANIZATIONAL problems (team autonomy at scale),
    not technical problems.
  - If you don't have the organizational problem, you don't need the solution.
```

## Decision Tree: When to Use Event-Driven Architecture

```
DO use events when:
  [] Action A needs to trigger Actions B, C, D but doesn't need their results
  [] You need an audit trail of everything that happened
  [] Different parts of the system need to react to the same event differently
  [] You need to replay history (event sourcing)
  [] Components should be decoupled (publisher doesn't know about subscribers)

  Examples in Stone AI:
  - User signs up → send welcome email, create default bestie, log analytics
  - Subscription changes → update access, notify billing, log event
  - Agent conversation → save to DB, update usage counter, check rate limits

DON'T use events when:
  [] You need a synchronous response (user is waiting)
  [] The "event" only has one consumer (just call the function)
  [] You can't tolerate eventual consistency
  [] Your team isn't experienced with async debugging

  The trap: Event-driven architecture makes simple flows complex.
  Request → Process → Response is easier to debug than
  Request → Emit Event → Handler 1 → Handler 2 → Eventually Consistent Response
```

## Decision Tree: When to Use CQRS

```
CQRS = Command Query Responsibility Segregation
(Different models for reading vs writing data)

DO use CQRS when:
  [] Read patterns are vastly different from write patterns
  [] Read load is 10x+ write load
  [] Read queries need denormalized/aggregated data
  [] Write operations need strict validation and business rules

  Example: Stone AI agent catalog
  - WRITE: Admin creates/updates agent (complex validation, relationships)
  - READ: User lists agents (simple, denormalized, needs to be fast)
  - These are different enough to benefit from separate models

DON'T use CQRS when:
  [] Read and write use basically the same data shape
  [] You're doing simple CRUD
  [] Your team hasn't used CQRS before and the deadline is tight

  MOST of Stone AI is CRUD. CQRS is overkill for:
  - User settings, conversation messages, referral codes, forum posts
```

## Decision Tree: When to Use DDD

```
See the dedicated domain-driven-design.md seed for full coverage.

Quick heuristic:
  - >3 entities with complex relationships? → DDD helps
  - Simple CRUD with no business logic? → DDD is overhead
  - Multiple teams working on the same domain? → DDD is essential
```

## Applied to Next.js + Prisma Stack

### File Structure Decision

```
OPTION A: Feature-based (recommended for Stone AI)
  src/
    features/
      chat/
        components/
        api/
        hooks/
        types.ts
      billing/
        components/
        api/
        hooks/
        types.ts

OPTION B: Layer-based
  src/
    components/
    api/
    hooks/
    types/

DECISION: Feature-based for features that are self-contained (chat, billing,
agents). Layer-based for shared infrastructure (auth, database, UI primitives).
Hybrid approach — features own their stuff, shared things live in common layers.
```

### API Route Design

```
DECISION TREE:

Is this a simple CRUD operation?
  YES → Route handler with Prisma query
    → src/app/api/[resource]/route.ts
    → Validate with Zod .strict()
    → Direct Prisma call

  NO → Does it involve business logic?
    YES → Service layer between route and Prisma
      → src/lib/services/[domain].ts
      → Route handler calls service, service calls Prisma
      → Business rules live in service, not in route or Prisma

    Does it involve multiple database operations?
      YES → Use Prisma transaction
        → prisma.$transaction([...])
        → All succeed or all fail

    Does it call external services (AI, Stripe, Clerk)?
      YES → Separate client wrapper
        → src/lib/clients/[service].ts
        → Handle errors, retries, timeouts in the wrapper
        → Route/service uses the wrapper, never calls external directly
```

### State Management Decision

```
Where should state live?

SERVER STATE (data from API):
  → React Query / SWR / Next.js server components
  → Never in local state for data that comes from the server
  → Cache, revalidate, deduplicate automatically

CLIENT STATE (UI state):
  → useState for component-local
  → useContext for small shared state (theme, locale)
  → Zustand for complex shared state (chat interface, multi-step forms)
  → NEVER Redux — it's overkill for this scale

URL STATE (filters, pagination, search):
  → useSearchParams
  → The URL IS the state — shareable, bookmarkable, back-button works

FORM STATE:
  → React Hook Form for complex forms (settings, onboarding)
  → useState for simple forms (search, single input)
  → Server Actions for mutations when possible
```

### Database Schema Decisions

```
When to add an index:
  [] Column appears in WHERE clauses frequently
  [] Column is used in JOIN conditions
  [] Column is used in ORDER BY
  [] Table has >1000 rows (below this, full scan is fine)
  [] Query appears in hot paths (dashboard, chat)

When NOT to add an index:
  [] Table is write-heavy and reads are rare
  [] Column has very low cardinality (boolean columns)
  [] Table is small and will stay small

When to denormalize:
  [] A query joins 4+ tables and runs on every page load
  [] Read performance matters more than write consistency
  [] The denormalized data changes rarely

When to keep normalized:
  [] Data changes frequently
  [] Consistency is critical (billing, auth)
  [] You're not sure yet (normalize first, denormalize when needed)
```

## Architecture Anti-Patterns

### 1. Resume-Driven Development
Choosing technology because it's impressive, not because it solves your problem.
**Fix:** "Would the simplest solution work? If yes, use it."

### 2. Premature Abstraction
Creating abstractions before you have 3 concrete use cases.
**Fix:** "Duplication is cheaper than the wrong abstraction." Wait for patterns to emerge.

### 3. Distributed Monolith
Microservices that all deploy together and can't function independently.
**Fix:** If services can't be deployed independently, merge them back into a monolith.

### 4. Golden Hammer
Using the same tool/pattern for everything.
**Fix:** Each problem gets the tool that fits. Not every nail needs the same hammer.

### 5. Speculative Generality
Building for requirements you don't have yet.
**Fix:** "YAGNI — You Aren't Gonna Need It." Build for today's requirements. Refactor when real requirements arrive.

## Decision Record Template

For significant architecture decisions, document them:

```
DECISION: [What was decided]
DATE: [When]
CONTEXT: [What problem prompted this]
OPTIONS CONSIDERED: [What alternatives existed]
CHOSEN: [Which option and WHY]
CONSEQUENCES: [What this means going forward]
REVIEW DATE: [When to re-evaluate]
```

## Integration

- Use **First Principles** to challenge architecture assumptions
- Use **Tree of Thought** to evaluate multiple architecture options
- Use **Second-Order Effects** to project consequences of architecture choices
- Use **Theory of Constraints** to identify which architecture element is the bottleneck
- Use **Complexity Recognition** to classify the problem before choosing architecture
