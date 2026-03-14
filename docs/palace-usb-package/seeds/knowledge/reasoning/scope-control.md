# Scope Control

## Core Principle

Every task has three zones: what's explicitly asked, what's implied but unstated, and what's adjacent but out of scope. Do the first. Clarify the second. Ignore the third. Scope creep is the #1 killer of productivity for AI agents and humans alike.

## The Three Zones

```
ZONE 1 — EXPLICIT (DO THIS)
  What was directly asked for.
  "Add a loading spinner to the chat page"
  → Add a loading spinner to the chat page. Done.

ZONE 2 — IMPLIED (CLARIFY THIS)
  Reasonable interpretations that weren't stated.
  "Add a loading spinner" — implied questions:
  → Where exactly? (Initial load? Each message? Both?)
  → What style? (Match existing design system?)
  → When does it stop? (On response received? On render complete?)
  ACTION: Ask or make a reasonable choice and state the assumption.

ZONE 3 — ADJACENT (IGNORE THIS)
  Related work that wasn't asked for.
  "While adding the spinner, I noticed the chat page could use
   better error handling, the CSS could be cleaned up, and the
   message component should be refactored."
  ACTION: Note it. Don't do it. It's out of scope.
  If it's important: mention it after completing the actual task.
```

## The Scope Decision Checklist

Before starting ANY task:

```
1. RESTATE the task in one sentence.
   "I'm going to [specific action] to [specific outcome]."

2. LIST what's explicitly required.
   - [Deliverable 1]
   - [Deliverable 2]

3. LIST implied requirements and your assumptions.
   - "I'm assuming [X] because [reasoning]"
   - If uncertain, ASK before building.

4. LIST what's adjacent but OUT of scope.
   - "I noticed [Y] but that's not part of this task."
   - "Improving [Z] would be nice but isn't required."

5. SET a completion criteria.
   "This task is DONE when [specific, measurable condition]."
```

## Scope Creep Detection

You're scope-creeping when:

```
[] You're fixing something that wasn't broken before you started
[] You're refactoring code that works and wasn't part of the task
[] You've been working for 2x the expected time
[] You're adding "nice to have" features while core isn't done
[] You say "while I'm here, I might as well..."
[] You've touched more than 3 files for a task that should touch 1-2
[] You're solving a problem you discovered during this task (not the original problem)
```

## The "While I'm Here" Trap

```
SCENARIO: You're fixing a bug in the billing route. While reading the code,
you notice the error handling is inconsistent across all API routes.

WRONG:
  "While I'm here, let me standardize error handling across all routes."
  Result: 3-hour billing bug fix becomes a 2-day error handling refactor.
  The original bug might not even get fixed properly.

RIGHT:
  1. Fix the billing bug (the actual task)
  2. Note the error handling inconsistency
  3. After completing the task, mention: "I noticed error handling is
     inconsistent across API routes. That should be a separate task."
  4. Create a new task for the error handling work if it matters
```

## Scope Control for Different Task Types

### Bug Fixes
```
SCOPE: Fix the specific bug. Verify it's fixed. Done.
NOT IN SCOPE: Refactoring the surrounding code, adding tests for
unrelated code, improving performance of adjacent features.

EXCEPTION: If the bug fix requires changing a public interface,
the scope expands to update callers of that interface.
```

### Feature Development
```
SCOPE: Build what was specified. Meet acceptance criteria. Done.
NOT IN SCOPE: Additional features "that would be nice," optimizations
for hypothetical future scale, supporting edge cases nobody asked about.

EXCEPTION: Security and basic error handling are ALWAYS in scope,
even if not explicitly stated.
```

### Refactoring
```
SCOPE: Improve code structure without changing behavior.
NOT IN SCOPE: Adding features, fixing unrelated bugs, changing
functionality. If tests break, you changed behavior.

EXCEPTION: If refactoring reveals a bug, note it and fix it
separately. Don't mix refactoring and bug fixes in one change.
```

## Communicating Scope Decisions

When you encounter adjacent work:

```
TEMPLATE:
"I completed [the actual task]. During this work, I noticed:
  - [Adjacent issue 1]: [Brief description]. Should this be addressed separately?
  - [Adjacent issue 2]: [Brief description]. Low priority but worth noting.

These are outside the scope of this task but may be worth tracking."
```

This shows thoroughness WITHOUT scope creep. You observed the issues, you didn't get derailed by them.

## Integration

- **Chain of Thought** Step 1 ("What is being asked?") is scope definition
- **Complexity Triage** determines how much scope is appropriate
- **Theory of Constraints** helps when scope must be cut — cut what's NOT the constraint
- **Dependency Mapping** reveals when scope must expand (a dependency is broken)
