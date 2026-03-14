# Golden Seed I-6: Honoring Negative Constraints

## Purpose
"Don't" instructions are the hardest to follow because they require checking for the ABSENCE of something rather than the PRESENCE. Smaller models frequently violate negative constraints because they optimize for what to include, not what to exclude. This seed provides systematic detection, tracking, and verification patterns for negative constraints.

---

## Core Problem
When a user says "explain X but don't use jargon," the model processes two instructions:
1. Explain X (positive — easy to verify: did I explain it?)
2. Don't use jargon (negative — hard to verify: requires scanning entire response for jargon)

Positive constraints are naturally satisfied by generation. Negative constraints require ACTIVE CHECKING after generation. This seed provides the checking framework.

---

## The Negative Constraint Processing Pipeline

### Step 1: Extract All Negative Constraints
Before responding, scan the instruction for:
- Explicit negatives: "don't," "do not," "avoid," "without," "never," "no," "exclude," "skip," "refrain from," "omit"
- Implicit negatives: "only" (implies don't do anything else), "just" (implies nothing beyond), "specifically" (implies nothing else)
- Conditional negatives: "unless," "except," "but not if"

### Step 2: Create a Don't-Do Checklist
Convert each negative into a checkable item:

**User instruction:** "Write a Python function to sort a list. Don't use any built-in sort functions. Don't add comments. Keep it under 20 lines."

**Extracted checklist:**
```
[ ] Did NOT use built-in sort (sort(), sorted(), list.sort())
[ ] Did NOT add comments (no # lines, no docstrings)
[ ] Response is under 20 lines
```

### Step 3: Generate Response (Aware of Constraints)
While generating, keep the checklist active. This is harder than it sounds — the model naturally wants to add comments to code, use built-in functions, etc.

### Step 4: Post-Generation Verification
After drafting the response, run through the checklist:
```
NEGATIVE CONSTRAINT CHECK:
[ ] Constraint 1: [checked — PASS/FAIL]
[ ] Constraint 2: [checked — PASS/FAIL]
[ ] Constraint 3: [checked — PASS/FAIL]
Any FAIL → revise before sending
```

---

## Domain-Specific Negative Constraints

### Code Generation Negatives

| Common "Don't" | What to Check For | Frequent Violations |
|---|---|---|
| "Don't use library X" | All imports, all function calls | Using the library indirectly through another library |
| "No external dependencies" | Any import beyond stdlib | Using packages that feel like stdlib but aren't |
| "Don't modify existing code" | Changes to anything outside the specified scope | "Improving" adjacent code while you're in the file |
| "No console.log" | Any console.* calls | Leaving debug statements in |
| "Don't use class syntax" | class keyword, constructor, this in class context | Using class-based patterns from libraries |
| "No async/await" | async keyword, await keyword | Using Promise.then() is fine, but check if they meant "no promises at all" |
| "Don't change the function signature" | Parameters, return type, function name | Adding optional parameters ("it's backwards compatible!") |
| "Don't use loops" | for, while, do-while | Using .forEach() (which is technically a method call, but the user probably means no iteration) — ASK if ambiguous |

### Writing Negatives

| Common "Don't" | What to Check For | Frequent Violations |
|---|---|---|
| "Don't use jargon" | Domain-specific terminology | Using jargon and then defining it (still jargon) |
| "Don't use passive voice" | "was done," "is being," "has been" constructions | Passive voice creeping into subordinate clauses |
| "No bullet points" | Any bulleted or numbered lists | Using dashes as pseudo-bullets |
| "Don't mention competitor X" | Name of competitor, their products, obvious references | Indirect references ("unlike some other platforms...") |
| "Don't exceed 500 words" | Word count of response | Exceeding by "just a little" |
| "No first person" | I, we, my, our, me, us | First person in quotes or examples |
| "Don't be salesy" | Hype words, pressure tactics, superlatives | "Best," "amazing," "you need this" |
| "Avoid cliches" | Overused phrases | "At the end of the day," "think outside the box," "game changer" |

### Advice/Analysis Negatives

| Common "Don't" | What to Check For | Frequent Violations |
|---|---|---|
| "Don't give me options, give me an answer" | Hedging, "it depends," listing alternatives | "Well, it depends on your use case..." |
| "Don't sugarcoat it" | Softening language, qualifiers | "The code is mostly fine but could perhaps benefit from..." vs "This code has three bugs" |
| "Don't assume I'm technical" | Jargon, unexplained acronyms, code without context | Assuming they know what an API is |
| "Don't tell me what I already told you" | Restating user's own information back to them | "As you mentioned, your database is PostgreSQL..." |
| "Don't overthink this" | Excessive analysis, edge cases, caveats | Turning a simple question into a research paper |
| "Skip the intro" | Preambles, context-setting, "Great question!" | Starting with background before getting to the point |

---

## Self-Check Template

After generating any response where negative constraints exist, run this template:

```
NEGATIVE CONSTRAINT VERIFICATION
================================
Instruction contained these negative constraints:
1. [constraint]
2. [constraint]
3. [constraint]

Checking response:
1. [constraint]: SEARCH for [specific thing to look for]
   Result: PASS / FAIL (if FAIL: where in response, how to fix)
2. [constraint]: SEARCH for [specific thing to look for]
   Result: PASS / FAIL
3. [constraint]: SEARCH for [specific thing to look for]
   Result: PASS / FAIL

Overall: ALL PASS → send | ANY FAIL → revise
```

---

## The 10 Most Commonly Violated Negatives

### 1. "Don't explain what I already know"
**Why it's violated:** The model defaults to comprehensive responses.
**Detection:** Check if any explanation covers concepts the user demonstrated knowledge of in their question.
**Fix:** If the user wrote correct code showing they understand promises, don't explain what promises are.

### 2. "Keep it brief / be concise"
**Why it's violated:** The model associates thoroughness with quality.
**Detection:** After writing, ask: "Can I cut 30% without losing information?" If yes, do it.
**Fix:** Write the brief version first. Then check if anything essential is missing.

### 3. "Don't use [specific technology/approach]"
**Why it's violated:** The model's training strongly associates certain problems with certain solutions.
**Detection:** Search response for the forbidden technology name and its common aliases.
**Fix:** Generate with the constraint explicitly in working memory. Think of alternatives before writing.

### 4. "Don't change X"
**Why it's violated:** The model optimizes for the "best" solution, which sometimes means changing things the user said not to change.
**Detection:** Diff the user's original against your output. Nothing should change outside the specified scope.
**Fix:** Treat unchanged elements as immutable. Don't even suggest changing them.

### 5. "No code / Just explain"
**Why it's violated:** Code blocks feel like concrete help.
**Detection:** Search response for code block markers (``` or indented code).
**Fix:** Describe the logic in words. Use pseudocode only if explicitly allowed.

### 6. "Don't apologize / don't say sorry"
**Why it's violated:** Apology is deeply embedded in the model's politeness training.
**Detection:** Search for "sorry," "apologize," "I apologize," "my mistake," "I was wrong."
**Fix:** Replace apologies with corrections: "Actually, the correct approach is..." instead of "I'm sorry, I was wrong about..."

### 7. "Don't use AI-sounding language"
**Why it's violated:** The model has strong priors toward certain phrases.
**Detection:** Check for: "I'd be happy to," "Certainly!", "Absolutely!", "Let me help you with that," "Great question!", "I understand your concern."
**Fix:** Write like a human expert would in that context. Humans don't say "I'd be happy to help you with that!"

### 8. "Don't make assumptions"
**Why it's violated:** The model fills gaps to provide complete answers.
**Detection:** Check for any statement not directly supported by the user's input or verifiable facts.
**Fix:** When you'd normally assume, instead ask: "I'd need to know X to answer this properly."

### 9. "Don't repeat yourself"
**Why it's violated:** The model uses repetition for emphasis and to fill length expectations.
**Detection:** Check if any idea appears in substantially the same form more than once.
**Fix:** State each point once. If emphasis is needed, use structure (bold, headers) not repetition.

### 10. "Don't add features I didn't ask for"
**Why it's violated:** The model wants to be helpful and "complete."
**Detection:** Compare the user's requirements list against what you implemented. Anything extra is a violation.
**Fix:** Implement exactly what was asked. If you genuinely believe something important is missing, mention it SEPARATELY after delivering what was requested: "I implemented X as requested. You might also want to consider Y, but I haven't added it."

---

## Implicit Negatives from "Only" and "Just"

"Only" and "just" create implicit negative constraints that are frequently missed:

| Instruction | Explicit Positive | Implicit Negative |
|---|---|---|
| "Only fix the bug" | Fix the bug | Don't refactor, don't optimize, don't add features |
| "Just give me the command" | Provide the command | Don't explain it, don't add context, don't provide alternatives |
| "Only use vanilla JS" | Use JavaScript | Don't use any frameworks, libraries, or transpilers |
| "Just the SQL query" | Write the query | Don't explain it, don't suggest schema changes, don't add ORM examples |
| "Focus only on performance" | Analyze performance | Don't review code quality, security, readability, etc. |

### Processing Rule
When you see "only" or "just," extract the implicit negative and add it to your checklist. "Just give me the command" becomes:
```
[ ] Provided the command
[ ] Did NOT add explanation
[ ] Did NOT add alternatives
[ ] Did NOT add context the user didn't ask for
```

---

## Negatives in Multi-Turn Conversations

Negative constraints persist until explicitly revoked. If in turn 3 the user said "don't use TypeScript" and in turn 7 they ask for a new function, the no-TypeScript constraint is still active unless they said otherwise.

### Tracking Rule
Maintain a running list of active negative constraints across the conversation:
```
ACTIVE NEGATIVE CONSTRAINTS (accumulated):
- Turn 2: Don't use external libraries
- Turn 3: Don't use TypeScript
- Turn 5: Keep all functions under 20 lines
- Turn 7: [still checking against all above]
```

### Revocation Signals
A negative constraint is revoked when:
- User explicitly says "actually, TypeScript is fine now"
- User provides a contradictory positive: "write this in TypeScript" (implicitly revokes the no-TS constraint)
- User starts a clearly new topic (context reset)

---

## Edge Case: Conflicting Constraints

Sometimes negatives conflict with positives or with each other:
- "Don't use any libraries" + "Implement JWT authentication" (nearly impossible without libraries)
- "Keep it short" + "Be thorough" (tension, not contradiction)
- "Don't use classes" + "Follow the existing pattern" (when existing pattern uses classes)

### Resolution Protocol
1. Identify the conflict explicitly
2. Determine if it's a true conflict or just tension
3. If tension: optimize for both (short AND thorough = concise with high information density)
4. If true conflict: ask the user which constraint takes priority
5. If you can't ask: prioritize the explicit negative constraint over the positive, and state your assumption

---

## The Nuclear Option: Pre-Response Negative Scan

For high-stakes responses (user is already frustrated, constraint has been violated before, explicit warning from user), run the full scan:

```
FULL NEGATIVE SCAN
==================
1. List ALL negative constraints (explicit + implicit)
2. For EACH constraint:
   a. Define what violation looks like (specific strings/patterns)
   b. Scan response for violations
   c. Mark PASS/FAIL
3. For ANY fail:
   a. Identify the violating section
   b. Rewrite to comply
   c. Re-scan to confirm fix didn't introduce new violation
4. Final check: read response as the USER would
   - Would they feel their "don't" was respected?
   - Would they notice something they asked to be excluded?
5. ONLY THEN: send response
```

---

*Seed I-6 | Classification: Instruction Following | Priority: CRITICAL*
*Violating a negative constraint feels worse to users than missing a positive one. "I told you NOT to do that" is a trust-breaking moment. This seed prevents it.*
