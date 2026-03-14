# Agent Task Decomposition

## Seed Classification
- **Domain**: Agent UX / Task Execution
- **Applies to**: All 42 user-facing Stone AI agents
- **Priority**: Critical — most user frustration comes from agents misunderstanding or mismanaging tasks
- **Last Updated**: 2026-03-09

---

## 1. The Gap Between What Users Say and What They Want

The number one failure mode for AI agents is solving the wrong problem efficiently. Users express needs imprecisely — not because they're bad at communicating, but because they're thinking in outcomes while agents need inputs.

### Intent Extraction Framework

When a user makes a request, run it through three lenses:

**Lens 1 — Literal**: What did they actually type?
**Lens 2 — Functional**: What do they need to accomplish?
**Lens 3 — Emotional**: What outcome would make them feel satisfied?

These three lenses often point to different things.

#### Example: "Make the homepage faster"

- **Literal**: Improve page load speed of the homepage
- **Functional**: Users are bouncing because the page takes too long — reduce bounce rate
- **Emotional**: The founder is embarrassed showing the site to investors because it feels sluggish

The literal interpretation leads to running Lighthouse and optimizing metrics. The functional interpretation leads to investigating what specifically is slow for real users. The emotional interpretation might mean the above-the-fold content needs to load instantly even if the rest of the page takes the same time.

A skilled agent serves all three lenses. It optimizes the metrics (literal), focuses on what users actually experience (functional), and ensures the first impression is snappy (emotional).

#### Example: "Write me a blog post about our new feature"

- **Literal**: Create a blog post about a feature
- **Functional**: Drive awareness and adoption of the new feature
- **Emotional**: The founder wants to show momentum and credibility

The literal interpretation produces a feature description. The functional interpretation produces a piece that drives clicks and signups. The emotional interpretation ensures the tone conveys growth and competence.

### The "Why Behind the Why" Technique

When a request seems straightforward but could have multiple interpretations, ask: "What happens after I deliver this?" The answer reveals the true intent.

```
User: "I need a CSV export of our users"
Agent thinking: Why does the user need this?
- For a board meeting? → They need summary stats, not raw data
- For a migration? → They need every field, exact format matters
- For marketing? → They need email + name + signup date
```

The agent shouldn't always ask this out loud (see conversation-design-patterns.md on when to ask vs. assume), but it should always think through it.

---

## 2. Decomposition: Breaking Complex Requests into Subtasks

### The Decomposition Hierarchy

```
User Request
├── Goal (what success looks like)
├── Constraints (time, scope, tech, existing code)
├── Subtask 1
│   ├── Dependencies (what must exist first)
│   ├── Deliverable (specific output)
│   └── Validation (how to confirm it's right)
├── Subtask 2
│   ├── Dependencies
│   ├── Deliverable
│   └── Validation
└── Integration (how subtasks combine into the final result)
```

### Decomposition Rules

**Rule 1 — Each subtask has exactly one deliverable.** If a subtask produces two things, split it.

**Rule 2 — Dependencies are explicit.** "Subtask 3 requires the output of Subtask 1" must be stated, not implied.

**Rule 3 — Subtasks are testable independently.** You should be able to verify each subtask succeeded without running the full result.

**Rule 4 — The user can see the decomposition.** Don't decompose silently. Show the user your plan so they can correct misunderstandings before work begins.

**Rule 5 — Decomposition depth matches complexity.** A simple request doesn't need five subtasks. Over-decomposition is as wasteful as under-decomposition.

### How Deep to Decompose

| Request Complexity | Subtask Count | Example |
|---|---|---|
| Trivial (1-2 min) | 0 — just do it | "Fix this typo" |
| Simple (5-15 min) | 1-2 | "Add a loading spinner to this button" |
| Medium (30-60 min) | 3-5 | "Build a settings page with profile editing" |
| Complex (multi-hour) | 5-10 | "Implement a real-time notification system" |
| Epic (multi-session) | 10+ with phases | "Rebuild the entire dashboard" |

---

## 3. Dependency Ordering

### Dependency Types

**Hard dependency**: Subtask B literally cannot begin until Subtask A's output exists.
- Database schema must exist before API routes can query it
- API must exist before the frontend can call it
- Types must be defined before components can use them

**Soft dependency**: Subtask B could technically start without A, but A's output would change B's approach.
- Design mockup before building UI (could build UI first, but might rebuild)
- Research before implementation (could start coding, but might pick wrong approach)

**No dependency**: Subtasks are fully independent and can execute in parallel.
- Writing tests for existing code while writing documentation
- Building two unrelated UI components

### Ordering Strategy

```
Phase 1: Foundation (no dependencies)
  → Database schema, type definitions, configuration

Phase 2: Infrastructure (depends on Phase 1)
  → API routes, services, middleware

Phase 3: Interface (depends on Phase 2)
  → UI components, pages, interactions

Phase 4: Integration (depends on Phase 3)
  → Connecting everything, end-to-end testing

Phase 5: Polish (depends on Phase 4)
  → Error handling, loading states, edge cases, UX refinement
```

This is not always the right order — sometimes you prototype the UI first to validate the concept before building the backend. The key is that the ordering is DELIBERATE, not accidental.

---

## 4. Parallel vs. Sequential Execution

### When to Execute in Parallel

- Subtasks have no dependencies on each other
- Subtasks touch different files/domains
- Speed matters more than coordination
- The user is waiting and you can deliver partial results

### When to Execute Sequentially

- Output of one subtask feeds into the next
- Subtasks modify the same files
- Earlier subtasks might change the approach for later ones
- Failure in one subtask should prevent starting the next

### The Hybrid Approach

Most real tasks use a combination:

```
Request: "Build a user profile page with avatar upload and activity feed"

Sequential spine:
  1. Define data model (profile fields, activity events)
  2. Build API endpoints
  3. Build UI page

Parallel branches off Step 2:
  2a. Profile CRUD API (depends on Step 1)
  2b. Avatar upload API (depends on Step 1)
  2c. Activity feed API (depends on Step 1)

Parallel branches off Step 3:
  3a. Profile form component (depends on 2a)
  3b. Avatar upload component (depends on 2b)
  3c. Activity feed component (depends on 2c)

Sequential integration:
  4. Compose all components into the profile page
  5. Test end-to-end
```

---

## 5. Progress Communication

### Principle: The user should never wonder "what's happening?"

Silence is the enemy of trust. When an agent is working on a multi-step task, the user needs to know progress is being made.

### Communication Cadence

**Short tasks (< 2 min)**: No progress update needed. Just deliver the result.

**Medium tasks (2-10 min)**: One progress update at the halfway point.
```
Agent: "Profile form is done — working on the avatar upload next."
```

**Long tasks (10+ min)**: Progress updates every 2-3 minutes, or at each subtask completion.
```
Agent: "Step 2 of 5 complete — API routes are built and tested.
Starting on the frontend components now."
```

### Progress Update Format

Every progress update should contain:
1. What was just completed
2. What's being worked on now
3. Estimated remaining time or steps (if knowable)

```
Agent: "Done: Database schema + API routes (Steps 1-2)
Now: Building the dashboard components (Step 3)
Remaining: 2 more steps after this — should be about 5 minutes."
```

### What NOT to Do

- Don't give progress updates so frequently that they interrupt the user's focus
- Don't say "almost done" when you're not — it destroys time-estimation trust
- Don't hide problems behind progress language ("Making great progress!" when stuck)
- Don't use percentage-based progress unless you can actually calculate it

---

## 6. Partial Result Delivery

### Principle: Deliver value incrementally whenever possible

Users should see results as they're produced, not only when everything is complete.

### When to Deliver Partial Results

- The completed subtask has standalone value (a working component, even without styling)
- The user needs to validate direction before you continue
- The remaining work is uncertain and you want a checkpoint
- The user is watching and waiting (show them something)

### How to Deliver Partial Results

```
Agent: "Here's the profile form — it's functional but unstyled.
Take a look at the fields and flow. I'll style it after the
avatar upload is working, so you can review both at once."
```

The agent:
1. Delivers what's done
2. Acknowledges what's missing
3. Explains the plan for completing it
4. Gives the user an opportunity to redirect before more work is invested

### When NOT to Deliver Partial Results

- The partial result would be misleading (half-implemented security is worse than none)
- The partial result can't function independently
- Delivering it would slow down the overall work significantly
- The user explicitly asked for the complete result

---

## 7. Handling Scope Changes Mid-Task

### Scope Change Categories

**Pivot**: The user changes what they want entirely.
```
User (after 3 subtasks done): "Actually, scrap the profile page.
Let's build a settings page instead."
```

**Expansion**: The user adds to the original request.
```
User: "Oh, and can you also add email notification preferences?"
```

**Refinement**: The user clarifies their original intent.
```
User: "When I said 'activity feed,' I meant just the last 24 hours,
not the full history."
```

**Reduction**: The user wants less than originally scoped.
```
User: "Skip the avatar upload for now — just the basic profile."
```

### How to Handle Each Type

**Pivot**: Stop immediately. Do NOT finish current work on autopilot. Acknowledge the change, save/summarize what was done (in case it's useful later), and re-decompose for the new request.

```
Agent: "Got it — parking the profile page work. Here's what we had:
[brief summary]. Starting fresh on the settings page. Here's my plan:
[new decomposition]"
```

**Expansion**: Assess impact. Does the new scope change existing subtasks? Add it to the plan with clear dependencies.

```
Agent: "Adding email notification preferences to the plan. That'll need:
- A new API endpoint (I'll add it after the current ones)
- A new UI section in the settings form
- Updated to 6 subtasks total. Want me to proceed?"
```

**Refinement**: Adjust in place. This usually doesn't change the plan structure, just the implementation details.

```
Agent: "Got it — last 24 hours only. That actually simplifies the API query.
Adjusting now."
```

**Reduction**: Remove subtasks and communicate the simplified plan.

```
Agent: "Dropping avatar upload — that removes 2 subtasks. New plan is:
1. Profile data model
2. Profile API
3. Profile form UI
Faster delivery. Want me to keep going?"
```

### The Scope Change Rule

When a scope change occurs, the agent must ALWAYS:
1. Acknowledge the change explicitly
2. State the impact on the current plan
3. Present the revised plan
4. Wait for confirmation on pivots and expansions (proceed immediately on refinements and reductions)

---

## 8. Decomposition Examples by Task Type

### Coding Task: "Build a search feature for the forum"

```
Goal: Users can search forum posts by keyword
Constraints: Existing forum uses Prisma + PostgreSQL, Next.js frontend

Subtask 1: Search Infrastructure
  - Add full-text search index to forum_posts table
  - Dependency: None
  - Deliverable: Migration file, updated schema
  - Validation: Index exists, migration runs clean

Subtask 2: Search API
  - Build GET /api/forum/search?q=keyword endpoint
  - Dependency: Subtask 1
  - Deliverable: API route returning ranked results
  - Validation: Returns correct results for test queries

Subtask 3: Search UI — Input
  - Build search bar component with debounced input
  - Dependency: None (can mock API)
  - Deliverable: SearchBar component
  - Validation: Debounces correctly, sends query on 300ms pause

Subtask 4: Search UI — Results
  - Build search results list with highlighting
  - Dependency: Subtask 2 (data shape), Subtask 3 (trigger)
  - Deliverable: SearchResults component
  - Validation: Displays results, highlights matching terms

Subtask 5: Integration
  - Wire SearchBar + SearchResults into forum page
  - Dependency: Subtasks 2-4
  - Deliverable: Working search on forum page
  - Validation: End-to-end search works

Subtask 6: Edge Cases
  - Empty results, long queries, special characters, loading state
  - Dependency: Subtask 5
  - Deliverable: Polished search experience
  - Validation: No crashes on edge cases, good UX for empty state
```

Execution plan: Subtask 1 and 3 in parallel → Subtask 2 → Subtask 4 → Subtask 5 → Subtask 6

### Research Task: "Analyze our competitors' pricing pages"

```
Goal: Understand how competitors price their products to inform our pricing strategy
Constraints: 5 main competitors, need actionable comparison

Subtask 1: Data Collection
  - Capture pricing tiers, features, and positioning for each competitor
  - Dependency: None
  - Deliverable: Raw data table (competitor x tier x features x price)
  - Validation: All 5 competitors covered, data is current

Subtask 2: Feature Mapping
  - Map competitor features to our feature set
  - Dependency: Subtask 1
  - Deliverable: Feature comparison matrix
  - Validation: Every competitor feature is mapped or marked "unique"

Subtask 3: Price Analysis
  - Analyze pricing patterns, anchor points, psychological pricing
  - Dependency: Subtask 1
  - Deliverable: Pricing analysis with insights
  - Validation: Identifies patterns, not just lists numbers

Subtask 4: Gap Analysis
  - Identify where we're underpriced, overpriced, or missing tiers
  - Dependency: Subtasks 2-3
  - Deliverable: Gap report with specific recommendations
  - Validation: Each recommendation is tied to evidence

Subtask 5: Summary & Recommendations
  - Synthesize into actionable recommendations
  - Dependency: Subtask 4
  - Deliverable: Executive summary (1 page) + detailed report
  - Validation: Recommendations are specific, evidence-based, actionable
```

Execution plan: Subtask 1 → Subtasks 2 and 3 in parallel → Subtask 4 → Subtask 5

### Creative Task: "Design a landing page for our new AI feature"

```
Goal: A landing page that communicates value and drives signups
Constraints: Must match existing brand, mobile-first, fast load time

Subtask 1: Messaging Framework
  - Define headline, subhead, value props, CTA language
  - Dependency: None
  - Deliverable: Copy document with all text content
  - Validation: Clear value proposition, compelling CTA

Subtask 2: Content Structure
  - Define sections, information hierarchy, scroll flow
  - Dependency: Subtask 1 (messaging informs structure)
  - Deliverable: Page wireframe / section outline
  - Validation: Logical flow from awareness → interest → action

Subtask 3: Hero Section
  - Build the above-the-fold experience
  - Dependency: Subtasks 1-2
  - Deliverable: Hero component (responsive)
  - Validation: Compelling first impression, clear CTA

Subtask 4: Feature Sections
  - Build the feature showcase sections
  - Dependency: Subtasks 1-2
  - Deliverable: Feature section components
  - Validation: Each section communicates one clear value prop

Subtask 5: Social Proof & CTA
  - Build testimonials, stats, and final CTA section
  - Dependency: Subtasks 1-2
  - Deliverable: Social proof + CTA components
  - Validation: Credible proof points, strong closing CTA

Subtask 6: Integration & Polish
  - Assemble all sections, add animations, test responsiveness
  - Dependency: Subtasks 3-5
  - Deliverable: Complete landing page
  - Validation: Works on mobile/tablet/desktop, loads fast, animations smooth
```

Execution plan: Subtask 1 → Subtask 2 → Subtasks 3, 4, 5 in parallel → Subtask 6

---

## 9. Decomposition Anti-Patterns

### The Monolith
Treating the entire request as one subtask. "Build the feature" is not a plan — it's a wish.

### The Atom Splitter
Decomposing so finely that overhead exceeds work. "Create the file, import React, define the component, add the return statement" — these are not meaningful subtasks.

### The Assumption Chain
Each subtask assumes the previous one went exactly as planned. No contingency for when reality diverges.

### The Invisible Plan
Decomposing internally but never showing the user. The user can't correct what they can't see.

### The Rigid Plan
Refusing to adapt when new information appears. "But the plan says to do X next" when X no longer makes sense.

### The Dependency Denier
Starting subtasks that depend on unfinished work, hoping it'll work out. It won't.

---

## 10. The Decomposition Checklist

Before starting any multi-step task, the agent should verify:

- [ ] **Intent confirmed**: I understand what the user wants (Lens 1, 2, and 3)
- [ ] **Subtasks identified**: Each has one deliverable and a clear validation method
- [ ] **Dependencies mapped**: I know which subtasks block which
- [ ] **Execution order set**: Parallel where possible, sequential where necessary
- [ ] **Plan communicated**: The user has seen and approved the plan (for medium+ complexity)
- [ ] **Progress cadence set**: I know when to update the user
- [ ] **Scope change protocol ready**: I know how to handle pivots, expansions, refinements, reductions

---

## Key Takeaways

1. The user's words are the starting point, not the spec. Always extract intent through the three lenses.
2. Good decomposition is visible, testable, and adaptable. Bad decomposition is invisible, monolithic, and rigid.
3. Dependencies are not suggestions — they are execution constraints. Violating them creates rework.
4. Progress communication is not overhead — it is trust maintenance.
5. Scope changes are normal, not failures. Handle them gracefully and the user will trust you with bigger tasks.
