# Golden Seed I-1: Instruction Decomposition Parser

## Purpose
This is THE critical instruction-following seed. The single most common failure mode of smaller models is missing parts of multi-part instructions. The user asks for A, B, and C. The model delivers A and B but forgets C. Or delivers all three but misses the constraint that applied to B. This seed provides a systematic decomposition pipeline that converts any instruction — no matter how complex — into a numbered checklist BEFORE generating the response.

---

## The Decomposition Pipeline

### Step 1: Read the FULL Instruction
Do NOT start generating after reading the first sentence. Read the ENTIRE message first. Complex instructions front-load context and back-load critical constraints. If you start generating after the first sentence, you'll miss the constraint at the end.

**Anti-pattern:**
```
User: "Write a React component for a user profile card that shows name, avatar,
and bio. Use Tailwind for styling. Make it responsive. Don't use any external
libraries. The component should accept all data via props. Oh, and make the
avatar a circle with a fallback to initials if no image URL is provided."

Model starts writing after "shows name, avatar, and bio" and misses:
- Tailwind requirement
- Responsive requirement
- No external libraries constraint
- Props-only data pattern
- Avatar circle with initials fallback
```

### Step 2: Identify Each Distinct Requirement
Break the instruction into atomic requirements. Each requirement is ONE thing to deliver or ONE constraint to respect.

**From the example above:**
```
REQUIREMENTS:
R1. React component (not a page, not a hook — a component)
R2. For a user profile card (specific purpose)
R3. Shows name
R4. Shows avatar
R5. Shows bio
R6. Use Tailwind for styling
R7. Make it responsive
R8. Don't use any external libraries (NEGATIVE CONSTRAINT)
R9. Accept all data via props (architecture constraint)
R10. Avatar is circular
R11. Avatar has initials fallback when no image URL
```

### Step 3: Number Them
Literally number each requirement. This creates a checklist you can verify against before sending.

### Step 4: Identify Constraints
Separate WHAT TO DO from HOW TO DO IT and WHAT NOT TO DO:

```
DELIVERABLES (what to produce):
- D1: React component (R1)
- D2: Shows name, avatar, bio (R3, R4, R5)
- D3: Avatar with circle shape and initials fallback (R10, R11)

CONSTRAINTS (how to do it):
- C1: Use Tailwind (R6)
- C2: Responsive design (R7)
- C3: Props-only data (R9)

NEGATIVE CONSTRAINTS (what NOT to do):
- N1: No external libraries (R8)
```

### Step 5: Identify Format Requirements
Does the user want:
- Just code? Code + explanation? Code + usage example?
- A specific file structure?
- Specific naming conventions?
- TypeScript or JavaScript?

If not specified, use the project's conventions or reasonable defaults.

### Step 6: Generate Response Addressing Each Item
Work through the checklist systematically. As you generate, mentally check off each requirement.

### Step 7: Post-Generation Verification
Before sending, run the checklist:

```
VERIFICATION:
[x] R1:  React component — YES, functional component
[x] R2:  Profile card purpose — YES, named ProfileCard
[x] R3:  Shows name — YES, in h2 element
[x] R4:  Shows avatar — YES, img element
[x] R5:  Shows bio — YES, in p element
[x] R6:  Tailwind styling — YES, all styles are Tailwind classes
[x] R7:  Responsive — YES, uses responsive prefixes (sm:, md:, lg:)
[x] R8:  No external libraries — CHECKING... no imports beyond React — PASS
[x] R9:  Props only — YES, ProfileCardProps interface, no internal fetch
[x] R10: Avatar circle — YES, rounded-full class
[x] R11: Initials fallback — YES, conditional render with first letters

ALL PASS → Send response
```

---

## Decomposition Templates by Instruction Type

### Template A: Code Generation Request
```
Parse for:
1. What to build (component, function, API, page, etc.)
2. Inputs/parameters
3. Expected outputs/behavior
4. Technology constraints (language, framework, libraries)
5. Style constraints (naming, formatting, patterns)
6. Edge cases mentioned
7. What NOT to do
8. Format of response (just code? code + explanation? code + tests?)
```

### Template B: Debugging Request
```
Parse for:
1. What's the symptom (error message, unexpected behavior, performance)
2. What's the expected behavior
3. What's been tried already
4. What code/config is relevant
5. What environment (versions, platform, hosting)
6. Any constraints on the fix (don't change X, must be backwards compatible)
```

### Template C: Explanation Request
```
Parse for:
1. What to explain
2. Depth level (overview, detailed, exhaustive)
3. Audience (beginner, intermediate, expert)
4. Format preference (prose, bullets, examples, comparison)
5. Scope boundaries (just X, or X and how it relates to Y)
6. Context (why they're asking — this affects what aspects to emphasize)
```

### Template D: Review/Audit Request
```
Parse for:
1. What to review (code, architecture, security, copy, strategy)
2. Scope (this file, this module, the whole app)
3. Focus areas (if specified: performance, security, readability, etc.)
4. Severity of feedback (quick scan vs. thorough audit)
5. Format of feedback (inline comments, summary, categorized list)
6. What to ignore (if specified)
```

### Template E: Multi-Step Task Request
```
Parse for:
1. Each distinct step
2. Dependencies between steps (Step 3 needs Step 2's output)
3. Constraints that apply to specific steps
4. Constraints that apply to ALL steps
5. Success criteria for each step
6. Overall success criteria
7. Delivery format (all at once? step by step?)
```

---

## Common Decomposition Failures

### Failure 1: Merging Distinct Requirements
**Instruction:** "Create a login form and a signup form"
**Wrong decomposition:** "R1: Create forms for auth"
**Right decomposition:** "R1: Create login form. R2: Create signup form."
**Why it matters:** They're two deliverables. Merging them leads to building one and forgetting the other, or building a hybrid that's neither.

### Failure 2: Missing Implicit Requirements
**Instruction:** "Build an API endpoint for updating user settings"
**Wrong decomposition:** "R1: Create PATCH /api/settings endpoint"
**Right decomposition:**
```
R1: Create PATCH /api/settings endpoint
R2: (implicit) Add authentication check
R3: (implicit) Add input validation
R4: (implicit) Add error handling
R5: (implicit) Return appropriate status codes
```
**Why it matters:** The user expects production-quality code. Implicit requirements are part of the professional standard. (See Seed I-3 for domain-specific implicit constraints.)

### Failure 3: Missing Constraints Buried in Text
**Instruction:** "Write a Python script that processes the CSV file. It should be fast because we run it on 10M rows. Oh and we're on Python 3.8 so no walrus operator."
**Wrong decomposition:** "R1: Python CSV processor"
**Right decomposition:**
```
R1: Python script for CSV processing
R2: Performance-optimized (10M rows)
R3: Python 3.8 compatible
R4: (constraint) No walrus operator (:=)
```
**Why it matters:** The Python version constraint and performance requirement are buried in casual language. Missing them means delivering code that doesn't work in their environment or is too slow.

### Failure 4: Treating Compound Sentences as Single Requirements
**Instruction:** "Make the button bigger and change its color to blue, also add a loading spinner when clicked"
**Wrong decomposition:** "R1: Update button styling and behavior"
**Right decomposition:**
```
R1: Increase button size
R2: Change button color to blue
R3: Add loading spinner on click
```
**Why it matters:** Three distinct changes. Missing any one means the user has to ask again.

### Failure 5: Ignoring Format/Structure Requirements
**Instruction:** "Explain the difference between REST and GraphQL. Use a comparison table and keep it under 300 words."
**Wrong decomposition:** "R1: Explain REST vs GraphQL"
**Right decomposition:**
```
R1: Explain differences between REST and GraphQL
R2: (format) Use a comparison table
R3: (constraint) Under 300 words
```
**Why it matters:** A 500-word prose essay about REST vs GraphQL, no matter how accurate, fails requirements R2 and R3.

---

## Complex Instruction Decomposition: Worked Example

### The Instruction
"Refactor the user authentication module. It currently uses cookies but we need to switch to JWT tokens stored in HTTP-only cookies. Keep the existing API contracts so the frontend doesn't need to change. Add refresh token support with 7-day expiry. Access tokens should expire in 15 minutes. Don't break the existing tests. Also add a logout endpoint that invalidates the refresh token. Oh, and make sure the JWT secret comes from an environment variable, not hardcoded. Use the jose library for JWT operations."

### The Decomposition
```
DELIVERABLES:
D1. Refactor auth module from cookie-based to JWT-based authentication
D2. JWT tokens stored in HTTP-only cookies (not localStorage, not regular cookies)
D3. Refresh token support with 7-day expiry
D4. Access token with 15-minute expiry
D5. Logout endpoint that invalidates refresh token
D6. Use jose library for JWT operations

CONSTRAINTS:
C1. Keep existing API contracts (frontend-facing interfaces unchanged)
C2. Don't break existing tests
C3. JWT secret from environment variable (not hardcoded)

IMPLICIT REQUIREMENTS:
I1. Token rotation on refresh (security best practice)
I2. Secure cookie flags (HTTPOnly, SameSite, Secure)
I3. Error handling for expired/invalid tokens
I4. Migration path from old cookies to new JWT cookies (existing sessions)

VERIFICATION CHECKLIST:
[ ] JWT tokens generated using jose library
[ ] Stored in HTTP-only cookies
[ ] Access token: 15-min expiry
[ ] Refresh token: 7-day expiry
[ ] Logout invalidates refresh token
[ ] API contracts unchanged (same request/response shape)
[ ] Existing tests still pass
[ ] JWT secret from process.env
[ ] jose library used (not jsonwebtoken)
[ ] Secure cookie flags set
[ ] Token refresh endpoint works
[ ] Expired token returns 401
[ ] Invalid token returns 401
```

### What a 32B Model Typically Misses
Without decomposition, a 32B model typically delivers:
- JWT auth (D1) ✓
- Forgets HTTP-only cookie storage (D2) — puts token in response body instead
- Implements refresh tokens (D3) ✓ but with wrong expiry
- Forgets the 15-minute access token expiry (D4) — uses 1 hour default
- Misses the logout endpoint entirely (D5)
- Uses jsonwebtoken library instead of jose (D6) — missed the specific library constraint
- Changes the API response format, breaking frontend (C1)
- Hardcodes the JWT secret in the example (C3)

That's 6 out of 9 explicit requirements missed. Decomposition catches all of them.

---

## The Speed vs. Thoroughness Balance

Decomposition takes time. Not every message needs the full pipeline.

### Full Decomposition (Steps 1-7)
Use when:
- Instruction has 3+ distinct requirements
- Instruction contains negative constraints
- Instruction involves code generation or modification
- User has corrected you before in this conversation
- The task would take significant time if done wrong

### Quick Decomposition (Steps 1-3)
Use when:
- Instruction is a simple question
- Only 1-2 requirements
- No constraints beyond the obvious
- Low cost of minor misses (easy to adjust)

### Skip Decomposition
Use when:
- Single-sentence factual question
- Yes/no question
- Conversational turn (greeting, acknowledgment)
- Follow-up that adds to a clear existing task

---

## Integration with Other Seeds

This seed is the ENTRY POINT to the response pipeline. After decomposition:
1. **Check constraints against Seed I-3** (Domain Constraint Checklists) — add implicit constraints
2. **Check for negative constraints using Seed I-6** (Negative Constraints) — extract all "don'ts"
3. **Check for ambiguity using Seed I-8** (Ambiguity Resolution) — resolve before generating
4. **Calibrate response length using Seed I-5** (Length Calibration) — match depth to request type
5. **Match tone using Seed I-4** (Tone Register) — detect and apply appropriate tone

The decomposition checklist is the BACKBONE of every response. Every other seed refines what this seed structures.

---

## The Decomposition Mantra

**Read everything. Parse everything. Number everything. Check everything.**

If every instruction is decomposed before responding, the most common quality failures — missed requirements, ignored constraints, incomplete deliverables — become nearly impossible.

---

*Seed I-1 | Classification: Instruction Following | Priority: MAXIMUM*
*This seed is the foundation of instruction following. Without decomposition, every other quality improvement is built on sand. With it, quality becomes systematic and verifiable.*
