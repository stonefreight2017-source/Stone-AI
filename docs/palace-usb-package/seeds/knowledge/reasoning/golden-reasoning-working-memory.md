# R-9: Golden Reasoning — Working Memory Management
# Periodic summarization anchors for long reasoning chains
# Palace USB Package — Golden Seed

---

## PURPOSE
LLMs lose track of context in long reasoning chains. By the time they're on step 8
of a complex task, they've "forgotten" what they established in step 2. This seed
provides templates for maintaining working memory: periodic summarization anchors,
progress tracking, and drift detection. This is especially critical for the 32B
model, which has less effective context utilization than larger models.

---

## THE WORKING MEMORY PROTOCOL

### Core Rule
Every 3-5 reasoning steps, insert a summarization anchor:
```
WORKING MEMORY CHECKPOINT:
  So far I've established:
    1. [Key fact/decision from earlier]
    2. [Key fact/decision from earlier]
    3. [Key fact/decision from earlier]
  Current focus: [What I'm working on now]
  Next: [What comes after this]
  Open questions: [Unresolved items]
```

This forces the model to consolidate context and prevents drift.

---

## TEMPLATE 1: MULTI-FILE CODE REVIEW

### For reviewing changes across 3+ files

```
FILE REVIEW TRACKER:

Files to review: [list all files]
Files reviewed: [✅ / ❌]

── Reviewing File 1: src/app/api/users/route.ts ──
Findings:
  - [finding 1]
  - [finding 2]
Cross-file notes:
  - [references UserService from lib/services/user.ts — check consistency]
  - [uses UserSchema from lib/schemas.ts — verify schema matches]

── CHECKPOINT after File 1 ──
WORKING MEMORY:
  Established: UserService has method getUserById that returns nullable User
  Concern: Error handling inconsistent — some routes throw, others return null
  Carry forward: Check if UserService.getUserById is called correctly in File 3

── Reviewing File 2: src/lib/services/user.ts ──
Findings:
  - [finding 1]
  - [connects to what we saw in File 1: getUserById returns null on not-found]
Cross-file notes:
  - [uses prisma.user.findUnique — need to verify Prisma schema matches]

── CHECKPOINT after File 2 ──
WORKING MEMORY:
  Established:
    1. getUserById returns null (not throw) on not-found
    2. Route handler in File 1 doesn't check for null → potential bug
    3. UserService validates input with Zod before querying
  Updated concern: File 1 needs null check for getUserById result
  Carry forward: Verify Prisma schema has all fields UserService expects

── Reviewing File 3: prisma/schema.prisma ──
[continue pattern...]

── FINAL SUMMARY ──
ACCUMULATED FINDINGS:
  Critical:
    1. [File 1, line X]: Missing null check on getUserById result
  Important:
    2. [File 2, line Y]: Error thrown without proper HTTP status
  Minor:
    3. [File 3]: Index missing on frequently-queried column
  Cross-file issues:
    4. File 1 expects User.role to be string, File 3 defines it as enum
```

---

## TEMPLATE 2: COMPLEX DEBUGGING SESSION

### For debugging that spans multiple files/systems

```
DEBUG SESSION TRACKER:

Bug: [description of the problem]
Reproduction: [steps to reproduce]

── Investigation Step 1: Check error logs ──
Found: [what the logs say]
Hypothesis: [what this suggests]

── Investigation Step 2: Check the specific code path ──
Found: [what the code shows]
Updated hypothesis: [refined based on new info]

── CHECKPOINT ──
WORKING MEMORY:
  Bug: Users see 500 error when saving profile with custom avatar
  Confirmed:
    1. Error is "TypeError: Cannot read property 'url' of undefined"
    2. Occurs in src/lib/services/avatar.ts line 42
    3. The 'avatar' object is sometimes undefined when it shouldn't be
  Eliminated:
    - NOT a database issue (avatar record exists)
    - NOT a permissions issue (user is authenticated)
  Current hypothesis: Race condition between avatar upload and profile save
  Next: Check if upload completion callback fires before save

── Investigation Step 3: Check async flow ──
Found: [what the async investigation reveals]

── Investigation Step 4: Check the upload handler ──
Found: [what we see in the upload code]

── CHECKPOINT ──
WORKING MEMORY:
  Bug: Avatar URL undefined during profile save
  Root cause identified:
    1. Upload returns pre-signed URL immediately (not the final URL)
    2. Profile save fires before upload processing completes
    3. The avatar.url is populated by a webhook AFTER processing
    4. Save reads avatar.url before webhook fires → undefined
  Fix approach: Wait for webhook confirmation before allowing save
    OR: Use the pre-signed URL as temporary, update on webhook
  Next: Implement fix

── Fix Implementation ──
[code changes]

── VERIFICATION CHECKPOINT ──
WORKING MEMORY:
  Bug: Avatar URL undefined during profile save (FIXED)
  Fix: Added polling loop that waits for avatar.url to be populated
    (max 10s timeout with user-visible progress indicator)
  Verified:
    □ Bug no longer reproduces
    □ Normal (non-avatar) saves still work
    □ Timeout case shows user-friendly error
    □ No performance regression on save without avatar change
  Remaining: Add test to prevent regression
```

---

## TEMPLATE 3: ARCHITECTURAL DISCUSSION

### For multi-step architecture decisions

```
ARCHITECTURE DECISION TRACKER:

Question: [What architecture decision are we making?]

── Analysis Step 1: Requirements gathering ──
Requirements:
  - [req 1]
  - [req 2]
  - [req 3]

── Analysis Step 2: Options evaluation ──
Option A: [description]
Option B: [description]
Option C: [description]

── CHECKPOINT ──
WORKING MEMORY:
  Decision: How to implement real-time notifications
  Requirements established:
    1. Must work on Vercel (serverless)
    2. Must support 1000 concurrent users
    3. Must deliver within 2 seconds
    4. Must handle reconnection
  Options:
    A: Pusher (managed WebSocket service)
    B: Server-Sent Events via edge function
    C: Polling every 5 seconds
  Eliminated: C (polling) — too slow for 2-second requirement
  Remaining: A (Pusher) vs B (SSE)
  Next: Compare cost and complexity

── Analysis Step 3: Cost comparison ──
Pusher: [cost analysis]
SSE: [cost analysis]

── Analysis Step 4: Complexity comparison ──
Pusher: [complexity analysis]
SSE: [complexity analysis]

── CHECKPOINT ──
WORKING MEMORY:
  Decision: Real-time notifications — Pusher vs SSE
  Established:
    1. Pusher: $49/mo for 100K connections, simpler implementation
    2. SSE: Free (Vercel edge), but reconnection handling is manual
    3. Pusher handles scaling, SSE needs custom logic
    4. Both meet the 2-second requirement
  Leaning toward: Pusher (simpler, managed, predictable cost)
  Concern: Vendor lock-in with Pusher
  Next: Make recommendation with migration strategy

── Recommendation ──
[final recommendation with justification]
References back to all checkpoints to ensure consistency.
```

---

## TEMPLATE 4: MULTI-STEP CALCULATIONS

### For calculations spanning multiple stages

```
CALCULATION TRACKER:

Goal: [What are we calculating?]

── Step 1: [First calculation] ──
Input: [values]
Calculation: [formula and work]
Result: [intermediate result]

── Step 2: [Second calculation] ──
Input: [values including Step 1 result]
Calculation: [formula and work]
Result: [intermediate result]

── CHECKPOINT ──
WORKING MEMORY:
  Calculating: Monthly infrastructure cost for 10K users
  Established so far:
    1. Hosting (Vercel Pro): $20/mo
    2. Database (Neon Pro): $19/mo + usage (~$30/mo at 10K users)
    3. Auth (Clerk): 10K MAU = $0 (within free tier)
  Running total: $69/mo
  Remaining to calculate: AI API costs, CDN, email service, monitoring

── Step 3: AI API costs ──
Input: 10K users × 20% active daily × 5 AI requests/day
Calculation: 10,000 users × 200 requests/day × 30 days = 6M requests/month
  Average 1,000 tokens per request
  Using Qwen 2.5 32B (self-hosted): $0 marginal cost
  Fallback to Claude Haiku (10% of requests): 600K × 1K tokens
    Input: 600M tokens × $0.25/1M = $150
    Output: 300M tokens × $1.25/1M = $375
  AI total: $525/mo
Result: AI costs = $525/mo

── CHECKPOINT ──
WORKING MEMORY:
  Monthly cost calculation for 10K users:
    1. Hosting: $20
    2. Database: $49
    3. Auth: $0
    4. AI API: $525
  Running total: $594/mo
  Remaining: CDN ($0 on Cloudflare), email (~$15), monitoring (~$26)

── Step 4: Final total ──
Total: $594 + $0 + $15 + $26 = $635/mo
Per-user cost: $635 / 10,000 = $0.0635/user/month

── VERIFICATION ──
  Sanity check: $635/mo for 10K users = $0.06/user
  If average revenue per user is ~$30/mo → margin is >99% on infrastructure
  But: AI costs dominate (83% of total) → AI usage is the key variable
  If self-hosted AI handles more: costs drop significantly
```

---

## TEMPLATE 5: MULTI-TASK PROJECT EXECUTION

### For tracking multiple parallel workstreams

```
PROJECT TRACKER:

Goal: [Overall project goal]
Tasks:
  T1: [Task 1 — assigned to Agent X]
  T2: [Task 2 — assigned to Agent Y]
  T3: [Task 3 — assigned to Agent Z]
  T4: [Task 4 — depends on T1 + T2]

── T1 Started ──
Status: In progress
Key decisions: [any decisions made]

── T2 Started ──
Status: In progress
Key decisions: [any decisions made]

── CHECKPOINT ──
PROJECT MEMORY:
  Overall: Building user dashboard feature
  T1 (Database): ✅ Schema defined, migration written
    Key output: New Dashboard model with userId FK
  T2 (API): 🔄 In progress — building /api/dashboard endpoints
    Dependency: Uses Dashboard model from T1 ✅ (T1 complete)
    Key decision: Using cursor-based pagination
  T3 (Frontend): ⏳ Waiting — depends on T2 API contract
    Blocker: Need API response shape from T2
  T4 (Integration): ⏳ Waiting — depends on T1 + T2

  Cross-task issues:
    - T2 needs to export API types for T3 to consume
    - T1 migration must run before T2 can test

  Next actions:
    - T2: Complete API, export response types
    - T3: Can start on static UI while waiting for API
    - T4: Scheduled after T2 + T3 complete

── T2 Completed ──
Status: Complete
Output: 4 API endpoints, response types exported

── CHECKPOINT ──
PROJECT MEMORY:
  T1 (Database): ✅ Complete — Dashboard model + migration
  T2 (API): ✅ Complete — 4 endpoints, types exported
  T3 (Frontend): 🔄 Starting — has API types from T2
  T4 (Integration): ⏳ Waiting on T3

  No blockers. T3 can proceed.
```

---

## DRIFT DETECTION PATTERNS

### What is Drift?
Drift occurs when the reasoning subtly shifts away from the original goal.
Common in long conversations and complex tasks.

### Pattern 1: Goal Drift
```
DETECTION: Current work no longer connects to the original goal.

Example:
  Original goal: "Fix the login bug"
  Step 1: Investigate login endpoint ✅
  Step 2: Notice auth middleware could be improved ⚠️
  Step 3: Start refactoring auth middleware ❌ DRIFT
  Step 4: Redesign the entire auth system ❌❌ SEVERE DRIFT

FIX: At each checkpoint, ask: "Does this directly advance the original goal?"
If not → park it and return to the original goal.
```

### Pattern 2: Scope Drift
```
DETECTION: Task scope keeps expanding beyond original boundaries.

Example:
  Original scope: "Add a loading spinner to the dashboard"
  Drift: "While I'm here, let me also fix the layout..."
  More drift: "And the color scheme could be improved..."
  Severe drift: "Actually let me redesign the whole page..."

FIX: Write down the scope at the start. Check it at every checkpoint.
"Am I still within the original scope? If not, STOP."
```

### Pattern 3: Assumption Drift
```
DETECTION: Early assumptions are forgotten or contradicted later.

Example:
  Step 1: "We can't use WebSocket because we're on Vercel"
  Step 5: "Let's implement a WebSocket server"
  → Forgot the constraint from Step 1

FIX: Working memory checkpoints carry forward ALL constraints and assumptions.
```

### Pattern 4: Context Drift
```
DETECTION: Mixing up details from different parts of the conversation.

Example:
  Earlier: Discussing User model (has email field)
  Later: Discussing Post model, accidentally referencing "Post.email"
  → Confused attributes between models

FIX: Each checkpoint explicitly names the current entity/context.
"Currently working on: Post model (fields: title, content, authorId)"
```

### Drift Detection Checklist (Run Every 5 Steps)
```
□ GOAL: Am I still working toward the original goal?
□ SCOPE: Am I still within the defined scope?
□ ASSUMPTIONS: Am I honoring all constraints from earlier?
□ CONTEXT: Am I referencing the correct entities/variables?
□ CONSISTENCY: Does my current statement contradict anything I said earlier?
□ PROGRESS: Am I actually moving forward, or going in circles?
```

---

## WORKING MEMORY BEST PRACTICES

### For the 32B Model

```
1. CHECKPOINT FREQUENCY:
   - Simple tasks: Every 5 steps
   - Complex tasks: Every 3 steps
   - Multi-file tasks: After every file
   - Calculations: After every intermediate result

2. WHAT TO INCLUDE IN CHECKPOINTS:
   - Confirmed facts (not hypotheses)
   - Decisions made (and why)
   - Current focus (what you're working on)
   - Open items (what's unresolved)
   - Carry-forward items (things to check later)

3. WHAT TO EXCLUDE:
   - Detailed code (summarize the finding, not the code)
   - Exploration dead-ends (only note if relevant to not repeating)
   - Verbose explanations (keep it concise)

4. FORMAT:
   - Numbered lists for established facts
   - Status indicators: ✅ done, 🔄 in progress, ⏳ waiting, ❌ failed
   - Clear separation between "established" and "uncertain"

5. RECOVERY:
   If you feel lost or confused mid-reasoning:
   → STOP
   → Write a full checkpoint from scratch
   → Re-read it
   → Continue from the checkpoint
```

---

## QUICK REFERENCE: ANCHOR PHRASES

Use these phrases to trigger working memory management:

```
"Let me consolidate what I know so far..."
"Before moving on, let me verify my understanding..."
"Working memory check: I've established [1], [2], [3]. Now working on [4]."
"Quick checkpoint: Original goal was [X]. Current progress: [Y]. Next: [Z]."
"Drift check: Am I still on track? Original scope was [X]."
"Carrying forward from earlier: [constraint/fact that's still relevant]."
```

---

## USAGE GUIDE

This seed is critical for any task that involves:
- Reviewing or modifying 3+ files
- Debugging sessions with multiple investigation steps
- Architecture discussions with multiple trade-offs
- Calculations with 3+ intermediate steps
- Project coordination across multiple agents/tasks

**Embedding hint**: The core protocol and drift detection patterns are the
primary retrieval units. Domain templates are secondary — retrieve the one
matching the current task type.

**Key insight**: Working memory management is what separates a 32B model that
produces good output from one that drifts and contradicts itself. The overhead
of periodic checkpoints is far less than the cost of restarting after drift.
