# R-3: Golden Reasoning — Self-Verification Checklists
# Post-answer verification checklists per domain
# Palace USB Package — Golden Seed

---

## PURPOSE
The biggest gap between 32B and 70B+ models isn't knowledge — it's self-checking.
Larger models naturally verify their answers; smaller models skip verification and
output the first plausible result. These checklists force systematic verification
AFTER generating an answer, catching errors before they reach the user.

**Protocol**: Generate answer → Run checklist → Fix any failures → Output final answer.

---

## 1. CODE GENERATION VERIFICATION

### After writing ANY code, check:

**Syntax & Structure**
```
□ Does it have correct syntax? (matching brackets, semicolons, quotes)
□ Are all variables declared before use?
□ Are all imports present and correct?
□ Does the function signature match its usage?
□ Are TypeScript types correct and complete?
```

**Logic & Correctness**
```
□ Does the happy path work? (trace through with sample input)
□ What happens with null/undefined input?
□ What happens with empty input (empty string, empty array, 0)?
□ What happens with extremely large input?
□ What happens with duplicate values?
□ Are array indices correct? (off-by-one is the #1 code bug)
□ Does the comparison use correct operator? (=== not ==, >= not >)
□ Are boolean conditions correct? (De Morgan's law: !(A && B) = !A || !B)
```

**Error Handling**
```
□ Are try/catch blocks around operations that can fail?
□ Are async operations awaited?
□ Does error handling provide useful messages?
□ Are errors logged AND handled (not just caught and swallowed)?
□ Is there a fallback for network failures?
```

**Security (for any code touching user data)**
```
□ Is user input validated before use?
□ Is output encoded/escaped before rendering?
□ Are database queries parameterized (not string-concatenated)?
□ Are file paths validated (no path traversal)?
□ Are secrets kept out of client-side code?
□ Are permissions checked server-side?
```

**Performance**
```
□ No database queries inside loops (N+1)?
□ No unnecessary re-renders in React components?
□ Large data sets paginated?
□ Expensive computations cached?
□ No memory leaks (event listeners, intervals cleaned up)?
```

**Project Conventions (Stone AI specific)**
```
□ Using Zod .strict() for mutation schemas?
□ Following the existing file naming pattern?
□ Using existing utility functions (not reinventing)?
□ Consistent with existing error handling patterns?
□ TypeScript strict mode compatible?
```

---

## 2. API DESIGN VERIFICATION

### After designing ANY API endpoint, check:

**URL & Method**
```
□ Resource name is plural noun? (/users not /user, /getUsers)
□ HTTP method matches operation? (GET=read, POST=create, PUT=replace, PATCH=update, DELETE=delete)
□ No verbs in URL? (/users not /getUsers, /createUser)
□ Nested resources max 2 levels? (/users/:id/posts, NOT /users/:id/posts/:id/comments)
□ Query parameters for filtering/sorting? (not path parameters)
```

**Request**
```
□ Request body schema defined (Zod)?
□ Required vs optional fields clearly specified?
□ Input validation rejects bad data BEFORE processing?
□ File upload size limits set?
□ Content-Type header required?
```

**Response**
```
□ Correct HTTP status code for each outcome?
  - 200 for success with body
  - 201 for created with Location header
  - 204 for success without body
  - 400 for bad input
  - 401 for unauthenticated
  - 403 for unauthorized
  - 404 for not found
  - 422 for validation errors
  - 429 for rate limited
  - 500 for server errors
□ Response format consistent? (always { data: ... } or { error: ... })
□ Error responses include helpful message?
□ No sensitive data leaked in error responses?
□ Pagination included for list endpoints?
```

**Auth & Security**
```
□ Authentication required? (middleware applied)
□ Authorization checked? (user owns the resource)
□ Rate limiting configured?
□ CORS configured correctly?
□ Input sanitized against injection?
```

---

## 3. DATABASE SCHEMA VERIFICATION

### After designing ANY schema change, check:

**Structure**
```
□ Table/column names are snake_case? (PostgreSQL convention)
□ Primary key defined? (id with appropriate type)
□ Foreign keys have corresponding index?
□ NOT NULL on fields that must always have values?
□ DEFAULT values set where appropriate?
□ Created_at and updated_at timestamps included?
□ Unique constraints where business logic requires uniqueness?
```

**Data Integrity**
```
□ Can this data be orphaned? (foreign key ON DELETE behavior)
  - CASCADE: delete children when parent deleted
  - SET NULL: set FK to null when parent deleted
  - RESTRICT: prevent parent deletion if children exist
□ Are enum values complete? (won't need to add values frequently?)
□ Is the data type correct for the value range?
  - Use TEXT not VARCHAR (PostgreSQL — no performance difference)
  - Use BIGINT for IDs that might exceed 2 billion
  - Use TIMESTAMPTZ not TIMESTAMP (always store timezone)
  - Use NUMERIC for money (never FLOAT)
□ Are there any circular dependencies?
```

**Performance**
```
□ Indexes on columns used in WHERE clauses?
□ Indexes on columns used in JOIN conditions?
□ Indexes on columns used in ORDER BY?
□ Composite index for multi-column queries? (column order matters)
□ No unnecessary indexes? (each index slows writes)
□ Will this table grow unbounded? (need archival/partitioning strategy?)
```

**Migration Safety**
```
□ Can this migration run without downtime?
  - Adding column: OK (if nullable or has default)
  - Dropping column: DANGEROUS (deploy new code first, then drop)
  - Renaming column: DANGEROUS (use @map in Prisma)
  - Adding NOT NULL to existing column: DANGEROUS (backfill first)
□ Is the migration reversible?
□ Data migration included if restructuring?
□ Have I tested on a copy of production data?
```

---

## 4. ARCHITECTURE DECISION VERIFICATION

### After making ANY architecture recommendation, check:

**Requirements Fit**
```
□ Does this actually solve the stated problem?
□ Am I solving today's problem or an imagined future problem?
□ Is this the simplest solution that works?
□ Could a simpler approach work "for now"?
```

**Feasibility**
```
□ Does the team have the skills for this?
□ Can this be built within the timeline?
□ Are the dependencies/services available and affordable?
□ Does this work with the existing tech stack?
```

**Scalability**
```
□ What happens at 10x current load?
□ What happens at 100x current load?
□ Where is the first bottleneck?
□ Can individual components scale independently?
```

**Failure Modes**
```
□ What happens when the database is down?
□ What happens when an external API is slow/down?
□ What happens when disk is full?
□ What happens when memory is exhausted?
□ Is there a single point of failure?
□ What's the recovery procedure for each failure?
```

**Reversibility**
```
□ How hard is it to change this decision later?
□ Are we locked into a vendor?
□ Can we migrate away if needed?
□ What data format decisions are we committing to?
```

**Cost**
```
□ What's the monthly cost at current scale?
□ What's the monthly cost at 10x scale?
□ Are there free tier limits we might hit?
□ Are there hidden costs (bandwidth, support, training)?
```

---

## 5. SECURITY IMPLEMENTATION VERIFICATION

### After implementing ANY security measure, check:

**Authentication**
```
□ Can I bypass authentication?
  - Try accessing protected routes without a token
  - Try with an expired token
  - Try with a malformed token
  - Try with another user's token
□ Are passwords hashed with bcrypt/argon2 (NOT MD5/SHA)?
□ Are login attempts rate-limited?
□ Are sessions properly invalidated on logout?
□ Is MFA properly enforced when enabled?
```

**Authorization**
```
□ Can user A see user B's data?
  - Change the ID in the URL
  - Change the ID in the request body
  - Change the ID in the query parameter
□ Can a regular user access admin endpoints?
  - Try calling admin API routes directly
  - Not just hidden in UI — checked server-side
□ Can a user escalate their own role?
□ Are all mutation endpoints authorized (not just read)?
```

**Input Validation**
```
□ What happens with script tags in input? (<script>alert('xss')</script>)
□ What happens with SQL in input? (' OR '1'='1)
□ What happens with path traversal? (../../../etc/passwd)
□ What happens with oversized input? (1MB of text in a name field)
□ What happens with special characters? (null bytes, unicode, emojis)
□ Is validation applied on the SERVER, not just the client?
```

**Data Protection**
```
□ Is sensitive data encrypted at rest? (PII, payment info)
□ Is all traffic over HTTPS? (no HTTP fallback?)
□ Are API keys/secrets in environment variables (not code)?
□ Are secrets excluded from git? (.gitignore includes .env)
□ Do error messages hide internal details from clients?
□ Are logs free of sensitive data? (no passwords, tokens, PII in logs)
```

**Headers & Configuration**
```
□ Content-Security-Policy set?
□ Strict-Transport-Security set? (HSTS)
□ X-Content-Type-Options: nosniff?
□ X-Frame-Options: DENY (or CSP frame-ancestors)?
□ Referrer-Policy configured?
□ CORS restricted to known origins? (not *)
```

---

## 6. REACT COMPONENT VERIFICATION

### After writing ANY React component, check:

**Rendering**
```
□ Does it render without errors in both server and client?
□ Does it handle loading state?
□ Does it handle error state?
□ Does it handle empty state (no data)?
□ Is there a key prop on all mapped elements?
□ Are there any conditional renders that could cause hydration mismatch?
```

**State Management**
```
□ Is state stored at the correct level? (not too high, not too low)
□ Are controlled inputs properly connected? (value + onChange)
□ Does state reset when it should? (key prop on parent, useEffect deps)
□ Are derived values computed (not stored as separate state)?
□ No infinite re-render loops? (useEffect dependencies correct)
```

**Performance**
```
□ Expensive components wrapped in React.memo? (if parent re-renders often)
□ Expensive computations in useMemo? (if deps change rarely)
□ Callbacks passed to children wrapped in useCallback?
□ No state updates during render?
□ Large lists virtualized?
```

**Accessibility**
```
□ Interactive elements are focusable? (button, a, input — not div with onClick)
□ Images have alt text?
□ Form inputs have labels?
□ Color contrast sufficient? (4.5:1 for text)
□ Keyboard navigation works? (Tab, Enter, Escape)
□ aria-labels on icon-only buttons?
```

**Cleanup**
```
□ useEffect cleanup functions handle unmount?
□ Event listeners removed on cleanup?
□ Intervals/timeouts cleared on cleanup?
□ AbortController used for fetch cleanup?
□ Subscriptions unsubscribed on cleanup?
```

---

## 7. BUSINESS ANALYSIS VERIFICATION

### After ANY business recommendation, check:

**Numbers**
```
□ Does the math actually add up? (recalculate)
□ Are the assumptions stated explicitly?
□ Are percentages calculated correctly? (base rate matters)
□ Is the comparison apples-to-apples? (same time period, same scope)
□ Are there hidden costs or revenue not accounted for?
```

**Logic**
```
□ Is this correlation or causation? (did I prove causation?)
□ Am I suffering from survivorship bias? (only looking at successes)
□ Am I anchored to a number that might be wrong?
□ Have I considered the base rate? (rare events are rare even with indicators)
□ Am I confusing revenue with profit?
```

**Feasibility**
```
□ Do we have the resources to execute this?
□ What's the opportunity cost? (what are we NOT doing?)
□ How long until we see results?
□ What if it doesn't work? (downside risk)
□ Can we test this with a smaller investment first?
```

---

## 8. DOCUMENTATION VERIFICATION

### After writing ANY documentation, check:

```
□ Would a new developer understand this without additional context?
□ Are code examples tested and working?
□ Are version numbers current?
□ Are links valid and pointing to correct targets?
□ Is the structure scannable? (headings, lists, code blocks)
□ Are prerequisites listed?
□ Are common errors/troubleshooting included?
□ Is there a "quick start" for impatient readers?
```

---

## 9. DEPLOYMENT VERIFICATION

### Before ANY deployment, check:

```
□ Tests pass? (full suite, not just changed tests)
□ Build succeeds locally? (npm run build)
□ Environment variables set for target environment?
□ Database migrations run successfully?
□ No console.log statements in production code?
□ No TODO/FIXME that should be resolved?
□ Preview/staging deployment tested?
□ Rollback plan documented?
□ Monitoring/alerting in place?
□ Team notified of deployment?
```

---

## 10. COMMUNICATION/RESPONSE VERIFICATION

### Before delivering ANY response to the user, check:

```
□ Did I actually answer the question asked? (not a related but different question)
□ Is my response actionable? (not just theoretical)
□ Did I provide specific file paths, commands, or code? (not vague guidance)
□ Are my code examples complete and runnable? (not pseudocode unless asked)
□ Did I explain WHY, not just WHAT?
□ Did I mention risks or caveats?
□ Is the response the right length? (not too verbose, not too terse)
□ Did I avoid hallucinating package names, API signatures, or version numbers?
□ If I'm not sure about something, did I say so?
□ Is the most important information first?
```

---

## META: VERIFICATION PROTOCOL

### How to Use These Checklists

**For the 32B model / agent:**
1. Generate your answer normally
2. BEFORE outputting, identify which checklist(s) apply
3. Run through EVERY item on the checklist
4. Fix any failures you find
5. If you can't verify an item, note it as an assumption
6. Output the verified answer

**When to use multiple checklists:**
- Writing an API endpoint → Checklist 1 (Code) + Checklist 2 (API) + Checklist 5 (Security)
- Designing a feature → Checklist 4 (Architecture) + Checklist 3 (Database) + Checklist 6 (React)
- Code review → Checklist 1 (Code) + domain-specific checklist

**The 80/20 Rule of Verification:**
The 5 items that catch the most bugs across ALL domains:
1. What happens with null/undefined/empty input?
2. Is the user properly authenticated AND authorized?
3. Does the error path work, not just the happy path?
4. Did I actually test/trace through the code, not just eyeball it?
5. Does my answer match what was actually asked?

**Embedding hint**: Each numbered section (## N.) is an independent retrieval unit.
The section title is the retrieval key. Agents should retrieve the checklist
matching their current task domain.
