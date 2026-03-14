# Output Format Discipline

## Core Principle

Consistent output format is a proxy for consistent thinking. When the format drifts, the reasoning drifts. For smaller models, explicit format instructions are essential — they don't have the intuition to "just know" the right format for each situation.

## Format Instructions That Qwen Reliably Follows

### Structured Headers

```
INSTRUCTION:
  "Structure your response with these exact headers in this order:
   ## Analysis
   ## Recommendation
   ## Implementation
   ## Risks"

WHY THIS WORKS:
  - Markdown headers are in training data extensively
  - Fixed header order prevents the model from skipping sections
  - Each section constrains what content belongs there
```

### Bullet Hierarchies

```
INSTRUCTION:
  "Use this hierarchy:
   - Top-level points (main ideas)
     - Supporting details
       - Specifics or examples"

WHY THIS WORKS:
  - Clear indentation rules prevent flat, unstructured lists
  - The 3-level limit prevents over-nesting
  - Each level has a defined purpose (idea → detail → evidence)
```

### Code Blocks

```
INSTRUCTION:
  "Always include:
   1. File path as a comment before each code block
   2. Language identifier after the opening backticks
   3. Complete, runnable code (no '...' or 'rest of code here')"

EXAMPLE:
  // src/app/api/chat/route.ts
  ```typescript
  export async function POST(req: Request) {
    // Complete implementation here
  }
  ```

WHY THIS WORKS:
  - File path gives context without needing to ask
  - Language identifier enables syntax highlighting
  - "Complete code" rule prevents lazy truncation
```

### Confidence Markers

```
INSTRUCTION:
  "End every substantive response with:
   Confidence: [1-5]
   [If below 3, state what would raise it]"

WHY THIS WORKS:
  - Forces the model to self-evaluate
  - Makes uncertainty explicit
  - Gives the user a quick calibration signal
```

## Standard Response Formats by Agent Type

### Technical Agents (Backend, Frontend, DB)

```
## Understanding
[Restate the problem in your own words. 1-2 sentences.]

## Solution
[Explanation of approach. Why this approach.]

### Files Changed
- `path/to/file.ts` — [what changes]
- `path/to/other.ts` — [what changes]

### Code
[Code blocks with file paths and language identifiers]

## Verification
[How to verify this works. Test command or manual check.]

Confidence: X/5
```

### Strategic Agents (Stone, Cardinal)

```
## Situation
[Current state. Facts only.]

## Analysis
[What the facts mean. Frameworks applied.]

## Options
1. **[Option A]**: [Description, pros, cons]
2. **[Option B]**: [Description, pros, cons]
3. **[Option C]**: [Description, pros, cons]

## Recommendation
[Which option and WHY]

## Next Steps
- [Specific action 1]
- [Specific action 2]

Confidence: X/5
```

### Security Agents

```
## Threat
[What was found or assessed]

## Severity
[Critical / High / Medium / Low] — [Justification]

## Impact
[What happens if exploited]

## Remediation
[Specific steps to fix, in priority order]
1. [Immediate action]
2. [Short-term fix]
3. [Long-term prevention]

## Verification
[How to verify the fix works]
```

## Format Recovery When the Model Drifts

### Detection

```
FORMAT DRIFT SIGNS:
  - Missing headers that should be present
  - Response starts with code without analysis
  - Bullet points become long paragraphs
  - Confidence marker missing
  - Multiple topics mixed in one section
```

### Recovery Prompts

```
MILD DRIFT:
  "[Reminder: Use the standard response format with ## headers for
   each section.]"

MODERATE DRIFT:
  "Your response is missing the [Analysis/Verification/Confidence] section.
   Please restructure using the standard format."

SEVERE DRIFT:
  "Stop. Reset. Use this exact format:
   ## Understanding
   ## Solution
   ## Verification
   Confidence: X/5"
```

## Format Anti-Patterns

### 1. Wall of Text
```
PROBLEM: One giant paragraph with no structure.
FIX: "Break your response into sections using ## headers."
PREVENTION: System prompt mandates headers for responses over 3 sentences.
```

### 2. Endless Lists
```
PROBLEM: 20+ bullet points with no hierarchy or grouping.
FIX: "Group related points under sub-headers. Max 7 bullets per group."
PREVENTION: System prompt limits bullet points and requires grouping.
```

### 3. Code Without Context
```
PROBLEM: Code block dropped in with no explanation.
FIX: "Before every code block, state: what file, what it does, why this approach."
PREVENTION: Format template requires ## Understanding before ## Code.
```

### 4. Over-Hedging
```
PROBLEM: Every sentence includes "maybe," "possibly," "it depends."
FIX: "State your answer directly. Put caveats in a separate Risks section."
PREVENTION: Confidence marker at the end captures uncertainty without
            polluting the main content.
```

### 5. Format Theater
```
PROBLEM: Headers and structure present but content is thin/repetitive.
FIX: "Each section must contain unique, actionable information.
      If a section would be empty, omit it."
PREVENTION: Allow sections to be omitted when not applicable.
```

## Token-Efficient Formatting

When context window is limited:

```
COMPACT FORMAT (for short answers):
  [Answer]: [1-2 sentences]
  [Confidence]: [1-5]

STANDARD FORMAT (for medium answers):
  ## [Section headers]
  [Content]
  Confidence: X/5

FULL FORMAT (for complex answers):
  ## Understanding
  ## Analysis
  ## Solution
  ## Implementation
  ## Risks
  ## Verification
  Confidence: X/5
```

Match format complexity to answer complexity. Don't use full format for a simple question.

## Integration

- **Role Anchoring** defines which format each agent type uses
- **Context Window Optimization** determines format size (compact vs full)
- **Confidence Calibration** provides the confidence marker methodology
- **Self-Verification** uses format as a verification aid (missing sections = incomplete answer)
