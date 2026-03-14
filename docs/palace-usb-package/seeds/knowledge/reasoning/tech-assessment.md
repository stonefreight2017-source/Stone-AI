# Technology Assessment Framework

## Core Principle

Every technology is a tradeoff. This framework evaluates technologies by what matters for adoption decisions: does it solve a real problem, what's the adoption trajectory, what are the switching costs, who maintains it, and how does it fail?

## The Evaluation Template

```
TECHNOLOGY: [Name and version]
CATEGORY: [Language, framework, service, tool, protocol]

1. PROBLEM SOLVED
   - What specific problem does this address?
   - How was this problem solved before?
   - Is the improvement 2x better or 10x better?
   - 2x = nice to have, 10x = worth switching

2. ADOPTION CURVE
   - Where on the adoption curve: Innovators → Early Adopters →
     Early Majority → Late Majority → Laggards?
   - Is adoption accelerating or decelerating?
   - Are PRAGMATISTS using it in production? (Not just enthusiasts demoing it)

3. SWITCHING COSTS
   - Cost to adopt: learning curve, migration effort, tooling changes
   - Cost to leave: lock-in, data portability, team retraining
   - Is the switching cost WORTH the improvement?

4. BACKING
   - Who maintains it? (Individual, startup, big company, community)
   - Funding model: VC-backed (may pivot), open-source (may stall),
     big company (may abandon), foundation (most stable)
   - Bus factor: If the lead maintainer leaves, what happens?

5. FAILURE MODES
   - How does it fail? (Crashes, data loss, performance degradation, security)
   - What's the recovery path from each failure mode?
   - What's the blast radius? (One feature breaks vs entire system down)
   - Community track record: How have they handled past incidents?
```

## Quick Assessment Scorecard

Rate each dimension 1-5:

```
Problem-Solution Fit:    [1-5]  Does it REALLY solve our problem?
Maturity:                [1-5]  Production-ready? Battle-tested?
Ecosystem:               [1-5]  Libraries, plugins, integrations?
Team Fit:                [1-5]  Can our team use it effectively?
Exit Cost:               [1-5]  Can we leave if needed? (5 = easy exit)
Maintenance Burden:      [1-5]  How much ongoing effort? (5 = low burden)

Total: __/30

>24: Strong adopt
18-24: Adopt with awareness of weaknesses
12-18: Adopt only if specific advantage outweighs risks
<12: Avoid or defer
```

## Applied: Assessing Technologies in Stone AI's Stack

### Next.js 16

```
Problem Solved: Full-stack React with SSR, API routes, built-in optimization
  Before: Separate React frontend + Express/Fastify backend
  Improvement: 5-10x developer productivity for full-stack web apps

Adoption Curve: Early Majority — widely used in production
  Pragmatists? YES — used by major companies in production

Switching Costs:
  To adopt: Moderate (React knowledge transfers, Next.js specifics to learn)
  To leave: HIGH (file-based routing, API routes, server components are
            all Next.js-specific. Leaving = rewriting routing and server layer)

Backing: Vercel (VC-funded company). Risk: Vercel could pivot, but Next.js
         is open-source with strong community momentum.

Failure Modes:
  - Build failures: recoverable, rollback deploy
  - Runtime errors: standard React error handling
  - Vercel outage: affects hosting, not framework. Can deploy elsewhere.

Score: 26/30 — Strong adopt. The right choice for Stone AI.
```

### Prisma 7

```
Problem Solved: Type-safe database access with migrations
  Before: Raw SQL or less type-safe ORMs
  Improvement: 3-5x in developer experience and bug prevention

Adoption Curve: Early Majority
  Pragmatists? YES — widely used in production

Switching Costs:
  To adopt: Low-moderate (schema DSL, client API to learn)
  To leave: MODERATE (schema migration format is Prisma-specific,
            client API throughout codebase, but SQL underneath is portable)

Backing: Prisma (VC-funded). Risk: Could pivot, but schema + migrations
         are portable to raw SQL if needed.

Failure Modes:
  - Connection pool exhaustion: common under load, tunable
  - Migration failures: manual recovery possible
  - Query performance: $queryRaw escape hatch available

Score: 24/30 — Strong adopt. Good fit for the stack.
```

### vLLM (Local Inference)

```
Problem Solved: Run large language models locally without cloud API costs
  Before: All inference via cloud APIs (expensive, rate-limited)
  Improvement: 10x cost reduction for bulk inference

Adoption Curve: Early Adopters — production-capable but rapidly evolving
  Pragmatists? SOME — mostly at companies with ML infrastructure

Switching Costs:
  To adopt: HIGH (requires GPU hardware, model management, optimization)
  To leave: LOW (switch to cloud API, remove vLLM routing)

Backing: Open-source community, strong academic backing
  Risk: Fast-moving, API changes between versions

Failure Modes:
  - GPU OOM: model too large for VRAM
  - Latency spikes under load: queue management needed
  - Model quality: dependent on the model loaded, not vLLM itself

Score: 20/30 — Adopt with awareness. Worth it for cost control,
         but maintain cloud fallback.
```

## Red Flags When Evaluating Technology

```
[] "It works great in the demo" — Demos hide complexity. Ask about edge cases.
[] Only enthusiasts use it — If no pragmatists are in production, it's not ready.
[] Single maintainer — Bus factor of 1. What happens when they burn out?
[] VC-funded with no revenue — Technology may be abandoned if company pivots.
[] "Rewrite everything" required — If adoption requires rewriting, the cost is too high.
[] No error handling docs — If the docs only show happy paths, the failure modes are unknown.
[] Breaking changes every release — Team will spend time upgrading instead of building.
```

## Green Flags

```
[] Used in production by companies your size — They've found the edge cases for you.
[] Active community with responsive maintainers — Problems get fixed.
[] Clear migration path from your current stack — Low adoption cost.
[] Boring technology — Well-understood, predictable, reliable.
[] Multiple implementations/providers — No vendor lock-in.
```

## The "Boring Technology" Heuristic

```
RULE: Default to boring technology. Only use exciting technology when
      the boring option genuinely can't solve the problem.

BORING (prefer):               EXCITING (justify first):
  PostgreSQL                     NewSQL databases
  Redis                          Custom caching layers
  React                          New UI frameworks
  REST                           GraphQL
  Monolith                       Microservices
  Server-side rendering          Client-side SPA
  SQL                            NoSQL

BORING wins because:
  - Failure modes are well-documented
  - Debugging tools are mature
  - Hiring is easier
  - Stack Overflow has answers
  - Edge cases are discovered and documented
```

## Integration

- **Architecture Decisions** use this framework for technology selection
- **Trend vs Noise** helps distinguish real technological shifts from hype
- **Second-Order Effects** predicts consequences of technology adoption
- **Theory of Constraints** identifies if technology is actually the bottleneck
