# Instruction Decomposition & Parsing
# Seed: CLAUDE-1 | Category: Claude Patterns | Topic: Instruction Analysis
# RAG Tags: instruction-parsing, decomposition, checklist, constraint-extraction, format-detection, prompt-templates

---

## Purpose
How to parse complex, multi-part instructions into actionable checklists. Identify
implicit requirements, extract constraints, detect expected output formats, and handle
ambiguous instructions. Prompt templates and TypeScript examples for production use.

---

## 1. Why Instruction Decomposition Matters

```
Real-world instructions are MESSY:
  "Build a dashboard that shows user analytics with charts,
   make it look good, add export to CSV, and make sure it's fast.
   Oh and it needs to work on mobile."

This single sentence contains:
  - 5 distinct requirements
  - 2 implicit constraints (performance, responsive)
  - 0 specific metrics or acceptance criteria
  - Multiple ambiguous terms ("look good", "fast")

Without decomposition, agents:
  - Miss requirements (forget CSV export)
  - Misinterpret ambiguity ("look good" = ?)
  - Don't know when they're done
  - Can't report progress accurately
```

---

## 2. The DICE Framework (Decompose, Identify, Constrain, Execute)

### Step 1: DECOMPOSE — Break into atomic requirements
```
Input: "Build a user dashboard with analytics charts, CSV export, mobile-friendly, and fast loading"

Decomposition:
  R1: Build a dashboard page/component
  R2: Display user analytics data
  R3: Render data as charts (visualization)
  R4: Export data to CSV format
  R5: Responsive design (mobile-friendly)
  R6: Performance optimization (fast loading)

Rule: Each requirement should be independently testable.
"Build a dashboard with analytics" → TWO requirements (dashboard + analytics)
```

### Step 2: IDENTIFY — Find implicit requirements
```
Explicit requirements: What the user said
Implicit requirements: What the user assumed you'd know

Common implicit requirements:
  - Authentication (dashboard = logged-in users only)
  - Error handling (what if analytics API is down?)
  - Loading states (what shows while data loads?)
  - Empty states (what if user has no data?)
  - Accessibility (screen readers, keyboard navigation)
  - SEO (probably not needed for dashboard, but consider)
  - Testing (unit tests? integration tests?)
  - TypeScript types (if TypeScript project)
  - Security (who can see whose analytics?)

For the dashboard example:
  R7 (implicit): Require authentication
  R8 (implicit): Handle loading/error/empty states
  R9 (implicit): Authorization (user sees only their data)
  R10 (implicit): Type safety
```

### Step 3: CONSTRAIN — Extract boundaries and acceptance criteria
```
Convert ambiguous requirements into measurable constraints:

"Make it fast" →
  C1: First Contentful Paint < 1.5s
  C2: Time to Interactive < 3s
  C3: Largest Contentful Paint < 2.5s
  C4: Charts render in < 500ms after data loads

"Make it look good" →
  C5: Follow existing design system (shadcn/ui)
  C6: Consistent spacing and typography
  C7: Appropriate color palette for data visualization
  C8: No layout shifts during loading

"Work on mobile" →
  C9: Usable at 320px viewport width
  C10: Charts resize/reflow for mobile
  C11: Touch-friendly interactive elements (min 44px tap targets)

When constraints are truly ambiguous, ASK:
  "You mentioned 'fast' — do you have a specific target?
   I'll aim for < 2s initial load unless you specify otherwise."
```

### Step 4: EXECUTE — Ordered checklist with dependencies
```
Final execution checklist:

Phase 1: Foundation
  □ R1: Create dashboard page at /dashboard
  □ R7: Add authentication guard (Clerk middleware)
  □ R10: Define TypeScript interfaces for analytics data

Phase 2: Data Layer
  □ R2: Build analytics API endpoint
  □ R9: Scope data query to authenticated user
  □ R8: Implement loading/error/empty states

Phase 3: Visualization
  □ R3: Implement chart components (Recharts or Chart.js)
  □ C7: Apply consistent color palette
  □ R5/C9-C11: Make charts responsive

Phase 4: Features
  □ R4: Add CSV export functionality
  □ C5-C6: Polish UI consistency

Phase 5: Performance
  □ R6/C1-C4: Optimize loading performance
  □ Add suspense boundaries, lazy loading

Phase 6: Validation
  □ Test on mobile viewports
  □ Test with empty data
  □ Test with large datasets
  □ Test auth guard (unauthenticated redirect)
```

---

## 3. Constraint Extraction Patterns

### Constraint Taxonomy
```typescript
interface Constraint {
  type: 'functional' | 'performance' | 'security' | 'design' | 'compatibility' | 'business';
  requirement: string;
  measurable: boolean;
  metric?: string;
  threshold?: string | number;
  priority: 'must' | 'should' | 'could' | 'wont';  // MoSCoW
}

// Example extraction
function extractConstraints(instruction: string): Constraint[] {
  const constraints: Constraint[] = [];

  // Performance keywords → performance constraints
  const perfKeywords = /\b(fast|quick|performant|responsive|snappy|instant|speed|latency)\b/i;
  if (perfKeywords.test(instruction)) {
    constraints.push({
      type: 'performance',
      requirement: 'Optimized load time',
      measurable: true,
      metric: 'LCP',
      threshold: '2.5s',
      priority: 'should',
    });
  }

  // Security keywords → security constraints
  const secKeywords = /\b(secure|auth|permission|role|admin|private|encrypted)\b/i;
  if (secKeywords.test(instruction)) {
    constraints.push({
      type: 'security',
      requirement: 'Authentication and authorization required',
      measurable: true,
      metric: 'Auth coverage',
      threshold: '100%',
      priority: 'must',
    });
  }

  // Mobile keywords → compatibility constraints
  const mobileKeywords = /\b(mobile|responsive|tablet|phone|touch|viewport)\b/i;
  if (mobileKeywords.test(instruction)) {
    constraints.push({
      type: 'compatibility',
      requirement: 'Mobile-responsive layout',
      measurable: true,
      metric: 'Minimum viewport width',
      threshold: '320px',
      priority: 'must',
    });
  }

  // Export keywords → functional constraints
  const exportKeywords = /\b(export|download|csv|pdf|excel|print)\b/i;
  if (exportKeywords.test(instruction)) {
    constraints.push({
      type: 'functional',
      requirement: 'Data export capability',
      measurable: true,
      metric: 'Export formats supported',
      priority: 'must',
    });
  }

  return constraints;
}
```

---

## 4. Format Detection

### Detecting Expected Output Format
```typescript
// Detect what format the user expects based on instruction cues

type OutputFormat =
  | 'code'           // "Build", "Implement", "Create component"
  | 'analysis'       // "Analyze", "Review", "Evaluate"
  | 'plan'           // "Plan", "Design", "Architect"
  | 'list'           // "List", "Enumerate", "What are the..."
  | 'comparison'     // "Compare", "vs", "difference between"
  | 'fix'            // "Fix", "Debug", "Resolve", "Why is...broken"
  | 'explanation'    // "Explain", "How does", "Why does"
  | 'decision'       // "Should I", "Which is better", "Recommend"
  | 'migration';     // "Migrate", "Upgrade", "Convert"

function detectOutputFormat(instruction: string): OutputFormat {
  const lower = instruction.toLowerCase();

  // Code output expected
  if (/\b(build|implement|create|write|code|component|function|endpoint|api)\b/.test(lower)) {
    return 'code';
  }

  // Fix/debug
  if (/\b(fix|debug|resolve|broken|error|bug|issue|crash|failing)\b/.test(lower)) {
    return 'fix';
  }

  // Plan/architecture
  if (/\b(plan|design|architect|strategy|roadmap|approach)\b/.test(lower)) {
    return 'plan';
  }

  // Comparison
  if (/\b(compare|versus|vs\.?|difference|better|pros.cons|tradeoff)\b/.test(lower)) {
    return 'comparison';
  }

  // Decision
  if (/\b(should|recommend|which|choose|pick|decide|option)\b/.test(lower)) {
    return 'decision';
  }

  // Analysis
  if (/\b(analyze|review|evaluate|assess|audit|inspect)\b/.test(lower)) {
    return 'analysis';
  }

  // List
  if (/\b(list|enumerate|what are|name all|show all)\b/.test(lower)) {
    return 'list';
  }

  // Explanation
  if (/\b(explain|how does|why does|what is|describe|overview)\b/.test(lower)) {
    return 'explanation';
  }

  // Migration
  if (/\b(migrate|upgrade|convert|move|transition|port)\b/.test(lower)) {
    return 'migration';
  }

  return 'explanation'; // Default
}

// Format-specific response templates
const FORMAT_TEMPLATES: Record<OutputFormat, string> = {
  code: `
## Implementation
[Code with comments explaining key decisions]

## Usage
[How to use the code]

## Testing
[How to verify it works]`,

  fix: `
## Problem
[What's broken and why]

## Root Cause
[Technical explanation]

## Fix
[Code changes]

## Verification
[How to verify the fix]`,

  plan: `
## Goal
[What we're trying to achieve]

## Approach
[High-level strategy]

## Phases
[Ordered phases with deliverables]

## Risks
[What could go wrong]`,

  comparison: `
## Options
[Description of each option]

## Comparison Matrix
[Feature-by-feature comparison table]

## Recommendation
[Which to choose and why]`,

  decision: `
## Context
[What decision needs to be made]

## Options
[Available choices with pros/cons]

## Analysis
[Quantitative or qualitative comparison]

## Recommendation
[Clear recommendation with reasoning]`,

  analysis: `
## Findings
[What was discovered]

## Assessment
[Evaluation against criteria]

## Recommendations
[Suggested actions]`,

  list: `
## [Items]
1. [Item with brief description]
2. [Item with brief description]
...`,

  explanation: `
## Overview
[High-level explanation]

## Details
[Deep dive with examples]

## Key Takeaways
[Summary of important points]`,

  migration: `
## Current State
[What exists now]

## Target State
[What we're migrating to]

## Migration Steps
[Ordered steps with rollback plan]

## Verification
[How to verify success]`,
};
```

---

## 5. Handling Ambiguous Instructions

### Ambiguity Classification
```
Type 1: SCOPE AMBIGUITY
  "Improve the user experience"
  Problem: What aspect? Login? Navigation? Performance? Design?
  Resolution: Ask for specific area, or decompose into all areas and prioritize

Type 2: PRECISION AMBIGUITY
  "Make it faster"
  Problem: How fast? From what baseline? Which metric?
  Resolution: Propose specific targets, ask for confirmation

Type 3: PRIORITY AMBIGUITY
  "Add dark mode and fix the login bug"
  Problem: Which first? Are they equally important?
  Resolution: Bug fixes before features (unless instructed otherwise)

Type 4: CONTEXT AMBIGUITY
  "Update the API"
  Problem: Which API? What kind of update?
  Resolution: Identify the API from recent context, ask if unclear

Type 5: IMPLICIT STAKEHOLDER AMBIGUITY
  "Make the dashboard better"
  Problem: Better for who? Admin? End user? Developer?
  Resolution: Identify primary user, design for them
```

### Ambiguity Resolution Strategy
```typescript
// When to ask vs. when to assume

interface AmbiguityDecision {
  ambiguity: string;
  canAssume: boolean;
  assumption?: string;
  question?: string;
}

function resolveAmbiguity(instruction: string): AmbiguityDecision[] {
  const decisions: AmbiguityDecision[] = [];

  // SAFE TO ASSUME (common patterns with clear defaults):
  // - "Build X" without specifying language → Use project's language (TypeScript)
  // - "Fix bug" without specifying tests → Always add regression test
  // - "Add feature" without specifying auth → Use existing auth pattern
  // - "Make responsive" without breakpoints → Use standard breakpoints

  // MUST ASK (ambiguity with significant impact):
  // - Multiple valid approaches with different tradeoffs
  // - Requirements that significantly affect scope
  // - Destructive operations (delete, migrate, overwrite)
  // - Changes that affect other teams/systems

  return decisions;
}

// The 80/20 rule for ambiguity:
// 80% of the time: Make a reasonable assumption and STATE IT
//   "I'm assuming you want TypeScript with the existing project conventions."
//   "I'll use shadcn/ui components to match the existing design system."
//
// 20% of the time: Ask a focused question
//   "The dashboard could show daily, weekly, or monthly data by default.
//    Which timeframe is most useful for your users?"
//
// NEVER: Ask 10 questions before starting. Paralysis by clarification.
// INSTEAD: Start with assumptions, note them, ask critical questions only.
```

---

## 6. Multi-Part Instruction Parsing

### Parsing Complex Instructions
```typescript
// Parse multi-part instructions into structured checklist

interface ParsedInstruction {
  requirements: Requirement[];
  constraints: Constraint[];
  format: OutputFormat;
  priority: 'urgent' | 'normal' | 'low';
  assumptions: string[];
}

interface Requirement {
  id: string;
  description: string;
  type: 'functional' | 'non-functional';
  implicit: boolean;
  depends_on: string[];
}

function parseInstruction(raw: string): ParsedInstruction {
  // Split on natural language conjunctions
  const parts = raw
    .split(/(?:,\s*(?:and\s+)?|;\s*|\.\s+(?=[A-Z])|\band\b\s+(?=\w+\s))/i)
    .map(p => p.trim())
    .filter(p => p.length > 5);

  const requirements: Requirement[] = parts.map((part, i) => ({
    id: `R${i + 1}`,
    description: part,
    type: detectRequirementType(part),
    implicit: false,
    depends_on: [],
  }));

  // Add implicit requirements
  const implicit = detectImplicitRequirements(raw, requirements);
  requirements.push(...implicit);

  // Detect dependencies
  orderByDependency(requirements);

  return {
    requirements,
    constraints: extractConstraints(raw),
    format: detectOutputFormat(raw),
    priority: detectPriority(raw),
    assumptions: generateAssumptions(raw, requirements),
  };
}

function detectPriority(instruction: string): 'urgent' | 'normal' | 'low' {
  if (/\b(urgent|asap|immediately|critical|emergency|hotfix|now)\b/i.test(instruction)) {
    return 'urgent';
  }
  if (/\b(when you get a chance|low priority|nice to have|eventually|someday)\b/i.test(instruction)) {
    return 'low';
  }
  return 'normal';
}

function detectRequirementType(part: string): 'functional' | 'non-functional' {
  const nonFunctional = /\b(fast|secure|reliable|scalable|accessible|maintainable|testable|performant)\b/i;
  return nonFunctional.test(part) ? 'non-functional' : 'functional';
}

function detectImplicitRequirements(raw: string, existing: Requirement[]): Requirement[] {
  const implicit: Requirement[] = [];
  const hasAuth = existing.some(r => /auth|login|permission/i.test(r.description));
  const hasData = existing.some(r => /data|database|api|fetch|query/i.test(r.description));
  const hasUI = existing.some(r => /page|component|dashboard|form|modal/i.test(r.description));

  if (hasUI && !hasAuth) {
    implicit.push({
      id: `R${existing.length + implicit.length + 1}`,
      description: 'Implement authentication check (implicit)',
      type: 'non-functional',
      implicit: true,
      depends_on: [],
    });
  }

  if (hasData) {
    implicit.push({
      id: `R${existing.length + implicit.length + 1}`,
      description: 'Handle loading, error, and empty states (implicit)',
      type: 'functional',
      implicit: true,
      depends_on: [],
    });
  }

  if (hasUI) {
    implicit.push({
      id: `R${existing.length + implicit.length + 1}`,
      description: 'Ensure TypeScript type safety (implicit)',
      type: 'non-functional',
      implicit: true,
      depends_on: [],
    });
  }

  return implicit;
}
```

---

## 7. Prompt Templates for Instruction Parsing

### Self-Decomposition Prompt
```
When you receive a complex instruction, use this internal prompt:

"Before I start, let me decompose this instruction:

1. EXPLICIT requirements (what the user directly asked for):
   - [list each distinct requirement]

2. IMPLICIT requirements (what the user expects but didn't say):
   - [list each implicit requirement]

3. CONSTRAINTS (boundaries and quality expectations):
   - [list each constraint with measurable criteria]

4. ASSUMPTIONS I'm making:
   - [list each assumption]

5. QUESTIONS I need to ask (only if critical):
   - [list only blocking questions]

6. EXECUTION ORDER (with dependencies):
   - Phase 1: [foundation work]
   - Phase 2: [core features]
   - Phase 3: [polish and validation]"
```

### Validation Prompt
```
After completing work, validate against the decomposition:

"Let me verify I've addressed everything:

□ R1: [requirement] — [DONE/PARTIAL/MISSED]
□ R2: [requirement] — [DONE/PARTIAL/MISSED]
...

Constraints met:
□ C1: [constraint] — [MET/NOT MET]
□ C2: [constraint] — [MET/NOT MET]
...

Anything missed? [If yes, address before presenting]"
```

---

*This seed is maintained by the Claude Patterns team. Last validated: 2026-03.*
