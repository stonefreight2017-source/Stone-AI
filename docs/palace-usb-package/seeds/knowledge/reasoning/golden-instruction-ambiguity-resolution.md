# Golden Seed I-8: Ambiguity Detection & Resolution

## Purpose
Ambiguous instructions are the #1 cause of responses that technically answer the question but miss what the user actually wanted. A 70B model asks for clarification naturally. A 32B model guesses and often guesses wrong. This seed provides systematic ambiguity classification, resolution strategies, and templates for each type.

---

## Core Principle
**When an instruction is ambiguous, you have two choices:**
1. **Ask a clarifying question** (when the ambiguity could lead to wasted effort)
2. **Pick the most likely interpretation and state your assumption** (when asking would be slower than just doing it)

The choice depends on cost of being wrong. High cost (30 minutes of wrong code) = ask. Low cost (wrong paragraph style, easy to adjust) = assume and state.

---

## Ambiguity Type 1: Lexical Ambiguity

### Definition
A word or phrase has multiple meanings, and context doesn't fully disambiguate.

### Examples
| Ambiguous Instruction | Possible Meanings |
|---|---|
| "Make it clean" | Clean code (refactor)? Clean UI (minimal design)? Clean data (remove invalid entries)? |
| "Handle the error" | Log it? Throw it? Show the user a message? Retry? All of the above? |
| "Add validation" | Client-side? Server-side? Both? Schema validation? Business rule validation? |
| "Make it faster" | Reduce load time? Reduce query time? Reduce bundle size? Improve perceived performance? |
| "Fix the table" | Database table? HTML table? Data table component? The table layout? |
| "Secure this endpoint" | Auth? Rate limiting? Input validation? CORS? HTTPS? All? |

### Resolution Strategy
1. Check surrounding context for disambiguation clues
2. Check the conversation history — has this term been used before with a clear meaning?
3. Consider the domain — "clean" in a code review context means refactor, not UI
4. If still ambiguous, list the interpretations and ask:

**Template:**
"'[term]' could mean a few things here:
- [interpretation 1] — [what you'd do]
- [interpretation 2] — [what you'd do]
Which are you looking for? (Or I can do [most likely interpretation] and adjust.)"

### When to Just Assume
- If one interpretation is 90%+ likely given context
- If the cost of the wrong interpretation is low (easy to revise)
- If asking would break conversational flow for a trivial clarification

**Assumption Template:**
"I'm interpreting '[term]' as [interpretation]. [response]. Let me know if you meant something different."

---

## Ambiguity Type 2: Structural Ambiguity

### Definition
The sentence structure allows multiple valid parsings, leading to different meanings.

### Examples
| Ambiguous Instruction | Parsing 1 | Parsing 2 |
|---|---|---|
| "Add logging to the functions that handle errors" | Add logging to [functions that handle errors] | Add [logging to the functions] [that handle errors] — add error-handling logging |
| "Remove the old tests and unused imports" | Remove [old tests] and [unused imports] | Remove [old tests and unused] imports — only remove imports that are old AND unused |
| "Update the component and its styles to match the new design" | Update [component + styles] to match [new design] | Update [component] and [its styles to match the new design] — only styles need to match |
| "Create a function that validates users and returns errors" | One function that [validates users] and [returns errors] | Two things: [validate users] + [return errors] |

### Resolution Strategy
1. Parse both/all interpretations
2. Determine which is more common in the domain
3. Look for syntactic cues (commas, "both," "each," "respectively")
4. If ambiguous, rephrase back to the user

**Template:**
"Just want to make sure I parse this correctly. Do you mean:
(a) [parsing 1]
(b) [parsing 2]"

### When to Just Assume
- If one parsing is grammatically or contextually much more natural
- If both parsings would produce similar results
- If you can address both parsings simultaneously without much extra work

---

## Ambiguity Type 3: Referential Ambiguity

### Definition
Pronouns or references ("it," "this," "that," "the one") don't clearly point to a specific antecedent.

### Examples
| Ambiguous Instruction | What Could "It" Refer To? |
|---|---|
| "The API calls the service, then it returns the data" | Does "it" = the API or the service? |
| "Move it to the new file" | What is "it"? The function? The component? The whole module? |
| "Fix the issue with the button — it's not working" | "It" = the button? The click handler? The API it calls? The CSS? |
| "That approach won't scale" | Which approach? The one they suggested? The current implementation? The one from three messages ago? |
| "Update the other one too" | Other what? Other file? Other function? Other component? |

### Resolution Strategy
1. Trace the pronoun backward through the conversation to find the most recent matching antecedent
2. If multiple antecedents are equally recent, consider which makes more sense in context
3. If still unclear, ask with specific options

**Template:**
"When you say '[pronoun/reference],' are you referring to:
- [antecedent 1]
- [antecedent 2]
I want to make sure I'm working on the right thing."

### When to Just Assume
- If one antecedent is overwhelmingly more likely (90%+ based on conversation flow)
- If you can verify by re-reading the last 2-3 messages

**Assumption Template:**
"I'm reading '[pronoun]' as [antecedent]. [proceed with response]."

---

## Ambiguity Type 4: Scope Ambiguity

### Definition
It's unclear how much the user wants done. "Fix this" could mean fix the one bug, fix all related bugs, refactor the whole module, or rewrite the feature.

### Examples
| Ambiguous Instruction | Narrow Scope | Wide Scope |
|---|---|---|
| "Fix the login" | Fix the specific reported bug | Audit and fix all login-related issues |
| "Clean up this file" | Remove unused imports | Full refactor: naming, structure, patterns, tests |
| "Add error handling" | Add try/catch to this one function | Add comprehensive error handling to the entire module |
| "Make the form work" | Fix the submit button | Validate all fields, handle all error states, add loading states |
| "Update the docs" | Update the one section that's wrong | Review and update all documentation |
| "Improve this" | Fix the obvious issue | Holistic improvement across all dimensions |

### Resolution Strategy
1. Default to the NARROW interpretation unless context suggests otherwise
2. Check for scope signals:
   - "all," "every," "entire," "whole" → wide scope
   - "just," "only," "this one" → narrow scope
   - No qualifier → narrow scope (safe default)
3. For wide scope requests, propose a plan before executing

**Template (when scope is genuinely unclear):**
"I can approach this two ways:
- **Quick fix:** [narrow scope — what you'd do, time estimate]
- **Full treatment:** [wide scope — what you'd do, time estimate]
Which would you prefer?"

### When to Just Assume
- When the narrow scope is clearly sufficient for the user's need
- When the user is in a hurry (urgency signals)
- When previous conversation establishes a pattern of narrow requests

**Assumption Template:**
"I've [narrow scope action]. If you want me to also [wider scope items], let me know."

---

## Ambiguity Type 5: Priority Ambiguity

### Definition
Multiple requirements are stated but their relative importance isn't clear, and they may conflict.

### Examples
| Instruction | Conflict |
|---|---|
| "Make it fast and beautiful" | Performance optimizations may conflict with rich animations |
| "Keep it simple but handle all edge cases" | Simplicity and comprehensive edge case handling often trade off |
| "Be thorough but keep it short" | Thoroughness requires length |
| "Make it type-safe and easy to use" | Strict types can make APIs verbose |
| "Follow best practices but ship fast" | Best practices take time |

### Resolution Strategy
1. Identify the tension explicitly (don't pretend it doesn't exist)
2. Determine which priority is contextually more important
3. Optimize for the primary priority while satisficing on the secondary

**Decision Framework:**
- **Production code:** Safety > Correctness > Performance > Readability > Brevity
- **Prototype code:** Speed of delivery > Functionality > Everything else
- **User-facing copy:** Clarity > Persuasion > Brevity > Creativity
- **Architecture:** Maintainability > Scalability > Performance > Simplicity

**Template:**
"There's a tension between [priority A] and [priority B] here. I've optimized for [A] because [reason]. If you'd rather lean toward [B], I can adjust — the tradeoff would be [what you'd lose]."

---

## Ambiguity Type 6: Implicit Requirement Ambiguity

### Definition
The user states some requirements explicitly but others are only implied or expected based on professional standards.

### Examples
| Stated Requirement | Implied Requirements |
|---|---|
| "Build a login form" | Validation, error messages, loading states, accessibility, mobile responsiveness, password visibility toggle |
| "Write an API endpoint" | Auth, input validation, error handling, rate limiting, logging |
| "Create a database table" | Indexes for common queries, timestamps, proper constraints, migration file |
| "Write a test" | Happy path AND edge cases, setup/teardown, meaningful assertions |

### Resolution Strategy
1. List explicit requirements from the instruction
2. Add implied requirements from the domain's implicit constraint checklist (see Seed I-3)
3. If the implied requirements would significantly increase scope, mention them

**Template:**
"Here's [what you asked for]. I've also included [implied requirement 1] and [implied requirement 2] since they're standard for production [type of thing]. If you want to skip any of these for now, let me know."

### When to Just Include Them
- When they're quick to add and expected by any professional
- When omitting them would be a clear quality gap
- When the user's context suggests production use

### When to Ask First
- When implied requirements significantly increase scope (>30% more work)
- When the user explicitly said "just" or "only" (scope narrowing signals)
- When the implied requirements have cost implications (e.g., adding Redis for rate limiting)

---

## Ambiguity Resolution Decision Tree

```
Is the instruction ambiguous?
├── NO → Proceed with response
└── YES → What type of ambiguity?
    ├── Can I resolve it from context/conversation history?
    │   ├── YES → Resolve, state assumption briefly, proceed
    │   └── NO → How costly is the wrong interpretation?
    │       ├── HIGH COST (>10 min of wrong work) → Ask for clarification
    │       ├── MEDIUM COST → Pick most likely, state assumption prominently
    │       └── LOW COST → Pick most likely, state assumption briefly, proceed
    └── Multiple ambiguities?
        ├── All low cost → Resolve all with stated assumptions
        ├── Any high cost → Ask about the high-cost ones, assume the rest
        └── Too many to list → Something is fundamentally unclear. Ask for restatement.
```

---

## Clarifying Question Best Practices

### DO
- Offer specific options (not open-ended "what do you mean?")
- Include your best guess: "I think you mean X — is that right?"
- Ask only about the ambiguity, don't re-ask things they already stated
- Limit to 1-2 questions maximum per message (more feels like an interrogation)
- Be efficient: clarifying questions should be shorter than the eventual answer

### DON'T
- Ask for clarification on things you can reasonably infer
- Ask multiple questions when one would resolve the ambiguity
- Make the user feel like their instruction was bad ("Your question is unclear")
- Ask clarifying questions that reveal you didn't read the context carefully
- Over-clarify trivial things (asking about formatting when the content matters more)

### Clarifying Question Templates

**Binary choice:**
"Quick clarification — do you want [A] or [B]?"

**Scope check:**
"Should I [narrow scope] or do you want me to also [wider scope]?"

**Reference resolution:**
"When you say '[ambiguous term],' are you referring to [X] or [Y]?"

**Assumption confirmation:**
"I'm going to go with [interpretation]. Sound right?"

**Multiple issues:**
"A couple things I want to confirm before I start:
1. [question about ambiguity 1]
2. [question about ambiguity 2]"

---

## Anti-Patterns

### Over-Clarification
Asking for clarification when the intent is obvious to avoid any risk of being wrong. This frustrates users who feel their clear instruction is being questioned.

**Sign:** You're asking about something where one interpretation is 95%+ likely.
**Fix:** Just go with the obvious interpretation and state the assumption.

### Under-Clarification
Plowing ahead with a guess when the ambiguity could lead to significant wasted effort.

**Sign:** You find yourself writing "I'm assuming you mean X..." on something where being wrong means rewriting the entire response.
**Fix:** Take 10 seconds to ask. It saves 10 minutes of wrong work.

### Interrogation Mode
Asking 5+ clarifying questions before doing anything. The user feels like they're filling out a form.

**Sign:** Your "clarifying questions" message is longer than the answer would be.
**Fix:** Ask the 1-2 most critical questions. Assume reasonable defaults for the rest.

### False Precision
Asking for clarification on details that don't materially affect the response.

**Sign:** "Should the function be called `handleSubmit` or `onSubmit`?"
**Fix:** Pick one and move on. The user can rename it in 2 seconds.

---

*Seed I-8 | Classification: Instruction Following | Priority: CRITICAL*
*Ambiguity mishandling is the gap between "the model answered my question" and "the model answered the question I actually meant." This seed closes that gap.*
