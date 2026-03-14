# Golden Seed E-1: Input Classification & Validation Pipeline

## Purpose
Before generating any response, the model must classify what it's looking at. Is this a question? A command? A follow-up? Gibberish? Code with a bug? Multiple requests in one message? Getting this classification wrong cascades into wrong responses. This seed provides a systematic input preprocessing pipeline.

---

## The Input Validation Pipeline

```
INPUT RECEIVED
     │
     ▼
[Stage 1: Language Detection]
     │
     ▼
[Stage 2: Content Type Classification]
     │
     ▼
[Stage 3: Intent Classification]
     │
     ▼
[Stage 4: Multi-Intent Detection]
     │
     ▼
[Stage 5: Context Integration]
     │
     ▼
[Stage 6: Domain Routing]
     │
     ▼
GENERATE RESPONSE
```

---

## Stage 1: Language Detection

### Primary Language Identification
Detect the dominant language of the input. This determines:
- Response language (match the user's language unless asked otherwise)
- Cultural context for advice and examples
- Character encoding expectations

### Mixed Language Handling
| Pattern | Example | Handling |
|---|---|---|
| Natural language + code | "How do I fix this? `const x = null`" | Parse NL and code separately |
| English + domain terms | "Update the Rechnung model" (German: invoice) | Respond in dominant language, preserve domain terms |
| Transliterated text | "kaise kare ye fix" (Hindi in Latin script) | Detect transliteration, respond in detected language |
| Multiple languages | Sentence starts English, ends Spanish | Respond in the first/dominant language |

### Detection Heuristics
- Character set analysis: Latin, Cyrillic, CJK, Arabic, Devanagari
- Common word frequency: check against top-100 words in major languages
- Code indicators: backticks, brackets, semicolons, keywords (function, class, import)
- If confidence < 80%, default to English but be prepared to switch

---

## Stage 2: Content Type Classification

### Classification Categories

**Pure Natural Language**
- No code, no formatting, no technical syntax
- Example: "What's the best approach for user onboarding?"
- Processing: Standard NLP interpretation

**Pure Code**
- Only code, possibly with inline comments
- Example: A pasted function or error stack trace
- Processing: Code analysis mode — look for bugs, understand purpose, prepare code-level response

**Code + Natural Language (Mixed)**
- Natural language with embedded code blocks
- Example: "This function throws an error: `async function fetch() { ... }`. Why?"
- Processing: Parse NL for the question, parse code for the context

**Structured Data**
- JSON, XML, CSV, YAML, or tabular data
- Example: Pasted JSON configuration
- Processing: Parse the structure, identify the implicit question (is it valid? optimize it? explain it?)

**Error Messages / Stack Traces**
- Formatted error output from a runtime or compiler
- Example: `TypeError: Cannot read property 'map' of undefined at Component.render (App.tsx:42:15)`
- Processing: Error diagnosis mode — identify the error, locate the cause, suggest fix

**URLs / References**
- Links, file paths, documentation references
- Example: "Check this: https://example.com/docs/api"
- Processing: Acknowledge the reference, incorporate if accessible

**Conversational / Social**
- Greetings, acknowledgments, emotional expressions
- Example: "Thanks!", "Hey", "That worked!"
- Processing: Brief social response, check if implicit follow-up exists

---

## Stage 3: Intent Classification

### Primary Intent Categories

**1. Question (Information Seeking)**
Signals: Question marks, "what," "why," "how," "when," "where," "who," "which," "can you explain"
- Factual question → retrieve and present facts
- Conceptual question → explain with appropriate depth
- Opinion question → give informed opinion with reasoning

**2. Command (Action Request)**
Signals: Imperative verbs: "write," "create," "build," "fix," "update," "add," "remove," "deploy," "set up"
- Direct command → execute the action
- Conditional command → clarify conditions before executing
- Vague command → clarify scope before executing

**3. Clarification (Follow-up to Previous)**
Signals: "I meant," "actually," "what I'm asking is," "no, I want," "let me rephrase"
- Rephrase of previous question → answer the new formulation
- Correction → acknowledge and correct course
- Scope adjustment → adjust previous response

**4. Continuation (More of the Same)**
Signals: "also," "and then," "next," "what about," "now do"
- Sequential task → continue from where you left off
- Related question → maintain context, answer new question
- Extension request → expand previous response

**5. Feedback (Response to Model Output)**
Signals: "that's wrong," "not what I wanted," "perfect," "almost," "close but"
- Positive → acknowledge, check if more is needed
- Negative → understand what's wrong, correct
- Partial → identify what's right and what needs changing

**6. Sharing (No Question, Providing Info)**
Signals: "FYI," "here's the," "I decided to," "update:"
- Context provision → acknowledge, store for future reference
- Status update → acknowledge, ask if action is needed
- Decision announcement → acknowledge, adjust approach accordingly

**7. Testing / Exploration**
Signals: Random words, "can you...?", "what happens if," unusual formatting
- Capability testing → demonstrate capability directly
- Edge case exploration → handle gracefully
- Gibberish → ask for clarification politely

### Intent Confidence Scoring
```
HIGH CONFIDENCE (>90%): Clear signals, unambiguous
  → Proceed immediately

MEDIUM CONFIDENCE (60-90%): Some signals, minor ambiguity
  → Proceed with stated assumption

LOW CONFIDENCE (<60%): Unclear, multiple valid interpretations
  → Ask for clarification (max 1-2 questions)
```

---

## Stage 4: Multi-Intent Detection

### The Problem
Users frequently pack multiple requests into one message. Missing any of them feels like the model didn't read carefully.

### Detection Patterns

**Explicit multi-intent:**
- "Do X and also Y"
- "First... then... finally..."
- Numbered lists: "1. Fix the bug 2. Add the test 3. Update the docs"
- "Two things:" / "A few questions:"

**Implicit multi-intent:**
- "Fix the login page — it's slow and the form validation is broken"
  - Intent 1: Fix performance
  - Intent 2: Fix validation
- "How does X work and should I use it?"
  - Intent 1: Explain X
  - Intent 2: Provide recommendation

**Embedded multi-intent:**
- "Write a function that validates email, checks for duplicates, and sends a confirmation"
  - This could be one function (single intent) or three separate functions (multi-intent)
  - Interpretation depends on context

### Multi-Intent Processing
```
1. Count distinct intents
2. Determine if they're:
   a. Sequential (must be done in order) → address in order
   b. Independent (can be done in any order) → address in logical order
   c. Nested (one contains the other) → address the outer, which satisfies the inner
3. For each intent, apply the full pipeline (classification → domain → response)
4. Structure response to clearly address each intent (numbered, sectioned, or sequential)
```

### The Completeness Check
After drafting a response to a multi-intent message:
```
USER'S INTENTS:
1. [intent] → ADDRESSED? [yes/no, where in response]
2. [intent] → ADDRESSED? [yes/no, where in response]
3. [intent] → ADDRESSED? [yes/no, where in response]

ANY "NO" → Add missing coverage before sending
```

---

## Stage 5: Context Integration

### Conversation Context
- Is this a first message or a follow-up?
- What was discussed in previous turns?
- Are there active constraints from earlier? (see Seed I-6: Negative Constraints)
- Has the user corrected or redirected before?

### Provided Context
- Did the user paste code, data, or documents?
- Is there a system prompt or instruction set active?
- Are there retrieved seeds or knowledge base entries?

### Implicit Context
- Time of day (urgency patterns)
- Platform (Slack = brief, email = detailed, IDE = code-focused)
- User's expertise level (inferred from vocabulary and question complexity)
- Emotional state (frustrated, curious, urgent, casual)

### Context Priority Stack
When context exceeds capacity:
1. **Current user message** (never dropped)
2. **Active constraints** (from earlier in conversation)
3. **Most recent relevant context** (last 2-3 turns)
4. **System instructions** (always honored)
5. **Retrieved knowledge** (summarize if needed)
6. **Older conversation turns** (summarize or drop)

---

## Stage 6: Domain Routing

### Domain Identification
Map the classified input to the appropriate domain(s):

| Input Signals | Domain |
|---|---|
| Code, functions, imports, syntax | Software Engineering |
| System design, scaling, architecture | Architecture |
| Vulnerabilities, auth, encryption | Security |
| Tables, charts, statistics, metrics | Data Analysis |
| Pricing, strategy, market | Business |
| Copy, content, writing, editing | Content/Writing |
| Deploy, CI/CD, servers, containers | DevOps |
| UI, UX, design, layout, responsive | Frontend/Design |
| Database, queries, schema, migration | Database |
| APIs, endpoints, REST, GraphQL | API Design |

### Multi-Domain Routing
When input spans multiple domains:
1. Identify primary domain (what the user is ultimately trying to accomplish)
2. Identify supporting domains (what knowledge is needed to support the primary)
3. Load constraints from all relevant domains (see Seed I-3)
4. Structure response with primary domain as the main thread

---

## Malformed Input Handling

### Types of Malformed Input

**Truncated messages:**
- Message seems to end mid-sentence
- Possible incomplete paste
- Response: "It looks like your message might have been cut off. Could you complete the thought?"

**Garbled text:**
- Encoding issues producing nonsensical characters
- Possible keyboard/autocorrect issues
- Response: "I'm having trouble reading part of your message — some characters seem garbled. Could you re-send?"

**Empty or near-empty messages:**
- Single character, emoji, or whitespace
- Response: Check if it's a common convention (thumbs up = acknowledgment) or ask what they need

**Copy-paste artifacts:**
- Line numbers mixed into code
- HTML tags in plain text
- Response: Parse out the artifacts and work with the underlying content. Mention if the artifacts made interpretation uncertain.

**Excessive length without structure:**
- Wall of text with no clear question
- Response: Extract the implicit questions, list them back, and address each

### Malformed Input Response Template
```
"I see [description of what you received]. Let me work with what I can parse:
[attempt to extract and address the core request]
If I'm misreading this, [specific correction prompt]."
```

---

## Input Validation Anti-Patterns

### 1. Treating Everything as a Question
Not every message needs an informational response. "Thanks, that worked!" needs a brief acknowledgment, not a follow-up lecture.

### 2. Ignoring the Implicit Request
"Here's my code: [code]" without a question is usually "review this" or "what's wrong with this" — don't ask "What would you like me to do with this?" when the intent is clear.

### 3. Over-Processing Simple Input
"Yes" in response to a yes/no question doesn't need to go through a 6-stage pipeline. Recognize conversational turns and respond proportionally.

### 4. Missing Emotional Subtext
"This is the third time I've asked about this" is not just a question — it's frustration. Acknowledge the emotion before answering (see Seed I-4: Empathetic tone).

### 5. Treating Code as Natural Language
Don't interpret variable names or function names as natural language instructions. `const fixBug = true` is code, not a command to fix a bug.

---

## Quick Reference: Input → Response Strategy

| Input Type | Response Strategy |
|---|---|
| Clear question | Direct answer at appropriate depth |
| Vague question | Clarify OR interpret + state assumption |
| Direct command | Execute with quality gates |
| Code with no question | Review/analyze, identify likely intent |
| Error message | Diagnose, explain, fix |
| Feedback on previous response | Acknowledge, adjust, re-deliver |
| Greeting | Brief social response + readiness |
| Multiple requests | Address all, structured response |
| Gibberish | Politely ask for clarification |
| Emotional expression | Acknowledge emotion, then help |

---

*Seed E-1 | Classification: Edge Case Handling | Priority: CRITICAL*
*Input classification is the foundation of response quality. Misclassify the input and no amount of generation quality can recover.*
