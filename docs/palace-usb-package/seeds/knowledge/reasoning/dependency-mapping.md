# Dependency Mapping

## Core Principle

Every system is a directed graph of dependencies. Understanding the graph tells you: what to build first, what's hardest to change, where failures cascade, and where design bugs hide. "Draw the DAG" should be your first move on any multi-part problem.

## The Process

### Step 1: List All Components

```
For any system/feature/project, list every component:
  - Services, modules, functions
  - External dependencies (APIs, databases, third-party services)
  - Data flows (what produces data, what consumes it)
  - People/teams (who blocks whom)

Example — Stone AI Chat Feature:
  Components:
  1. Chat UI (frontend component)
  2. Chat API route (/api/chat)
  3. Auth middleware (Clerk)
  4. AI Router (picks vLLM vs Anthropic)
  5. vLLM client
  6. Anthropic client
  7. Message storage (Prisma/PostgreSQL)
  8. Rate limiter
  9. Tier permission check
```

### Step 2: Draw the Arrows

```
Arrow = "depends on" or "must happen before"

  Chat UI → Chat API route
  Chat API route → Auth middleware
  Chat API route → Rate limiter
  Chat API route → Tier permission check
  Chat API route → AI Router
  AI Router → vLLM client
  AI Router → Anthropic client
  Chat API route → Message storage
  Tier permission check → Auth middleware (needs userId)

DAG:
  Chat UI
    └→ Chat API route
         ├→ Auth middleware ←─┐
         ├→ Rate limiter      │
         ├→ Tier permission ──┘
         ├→ AI Router
         │    ├→ vLLM client
         │    └→ Anthropic client
         └→ Message storage
```

### Step 3: Find Cycles (Design Bugs)

```
RULE: A dependency graph should be a DAG (Directed Acyclic Graph).
      Cycles mean circular dependencies — a DESIGN BUG.

HOW TO DETECT:
  For each component, trace all paths forward.
  If you arrive back at the starting component → CYCLE.

COMMON CYCLES IN WEB APPS:
  - Module A imports from Module B, Module B imports from Module A
  - Service A calls Service B, which calls Service A for different data
  - Database triggers that update tables that trigger more updates

WHAT CYCLES MEAN:
  - The components are too tightly coupled
  - Changes to either component can break the other
  - Testing in isolation is impossible

HOW TO BREAK CYCLES:
  1. Extract the shared dependency into a third module
  2. Use events/callbacks instead of direct calls
  3. Merge the two components (they're actually one thing)
```

### Step 4: Find Leaves (Build First)

```
LEAVES = components with no dependencies (nothing pointing out)
These are the most independent components.

BUILD LEAVES FIRST because:
  - They can be built and tested independently
  - They don't block anything
  - They're the foundation everything else builds on

In the Chat example:
  Leaves: Auth middleware, vLLM client, Anthropic client, Message storage, Rate limiter
  These can all be built and tested in parallel.
```

### Step 5: Find Roots (Hardest Constraints)

```
ROOTS = components that everything depends on (many arrows pointing out)
These are the hardest constraints — changes here cascade everywhere.

ROOTS NEED:
  - The most careful design (changes are expensive)
  - The most thorough testing (failures cascade)
  - The earliest stability (everything else depends on them)

In the Chat example:
  Root: Auth middleware (everything depends on knowing who the user is)
  → Auth must be designed and stabilized FIRST
  → Auth API must be locked down before other components build against it
```

## Dependency Analysis Templates

### Feature Build Order

```
1. List all components
2. Draw dependencies
3. Find leaves → build these first (parallel, no blockers)
4. Find the next layer → components whose dependencies are all leaves
5. Continue layer by layer until you reach the root
6. The root component is built LAST (it orchestrates everything)

BUILD ORDER for Chat:
  Layer 0 (parallel): Auth, vLLM client, Anthropic client, DB storage, Rate limiter
  Layer 1: Tier permission check (needs Auth), AI Router (needs clients)
  Layer 2: Chat API route (needs everything from Layer 0-1)
  Layer 3: Chat UI (needs Chat API route)
```

### Failure Cascade Analysis

```
For each component, ask: "If this fails, what else fails?"

Auth middleware fails:
  → Chat API can't identify user → ALL requests fail
  → BLAST RADIUS: Complete outage of all authenticated features
  → PRIORITY: Highest. Must have fallback/graceful failure.

vLLM client fails:
  → AI Router falls back to Anthropic
  → BLAST RADIUS: Limited. Cost increase but service continues.
  → PRIORITY: Medium. Fallback exists.

Message storage fails:
  → Messages not saved but chat can continue
  → BLAST RADIUS: Data loss for current sessions
  → PRIORITY: High. Users lose conversation history.

Rate limiter fails:
  → All requests pass through → potential resource exhaustion
  → BLAST RADIUS: System overload, affects all users
  → PRIORITY: High. Fail CLOSED (deny requests if rate limiter is down).
```

### Change Impact Analysis

```
Before changing any component, trace the impact:

CHANGING: AI Router (adding a new AI provider)

Direct dependents: Chat API route
Indirect dependents: Chat UI (through API route)
NOT affected: Auth, Rate limiter, Message storage, Tier permission

IMPACT ASSESSMENT:
  - Chat API route may need new configuration → small change
  - Chat UI doesn't know about AI providers → no change
  - Tests for AI Router need update → medium effort
  - No cascading changes beyond direct dependents → low risk

CONCLUSION: Safe to change. Localized impact.
```

## Dependency Patterns to Watch For

### Hub and Spoke (Fragile Center)
```
Many components depend on one central component.
If the center fails, everything fails.

Detection: One component has 5+ incoming arrows.
Fix: Add redundancy to the center, or distribute its responsibilities.
```

### Chain (Serial Dependency)
```
A → B → C → D → E
Each component depends on exactly one other.
Failure at any point breaks everything downstream.

Detection: Long chains without parallel paths.
Fix: Add direct connections where possible (A → C bypasses B for some operations).
```

### Diamond (Merge Point)
```
A → B → D
A → C → D
D depends on both B and C.

Risk: B and C may have conflicting assumptions about what D needs.
Fix: Ensure B and C expose consistent interfaces to D.
```

## Quick Reference

```
BUILDING SOMETHING NEW:
  1. List components
  2. Draw DAG
  3. Build leaves first, roots last
  4. Parallelize independent components

DEBUGGING A FAILURE:
  1. Identify failed component
  2. Trace dependents (what else is affected?)
  3. Trace dependencies (what could have caused this?)
  4. Check the root of the dependency chain first

PLANNING A CHANGE:
  1. Identify the component changing
  2. Trace all dependents (direct and indirect)
  3. Assess impact on each dependent
  4. Change from leaves inward (least dependent first)
```

## Integration

- **Architecture Decisions** use dependency maps to evaluate designs
- **Theory of Constraints** finds the bottleneck in the dependency graph
- **Second-Order Effects** traces how changes cascade through dependencies
- **Testing Strategy** prioritizes tests based on dependency criticality
- **Scope Control** uses the DAG to define what's in and out of scope
