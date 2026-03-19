# I-2: Golden Instruction — Output Format Templates
# Exact templates for every common output format
# Palace USB Package — Golden Seed

---

## PURPOSE
Consistent, well-formatted output is critical for agent usability. This seed
provides exact templates the agent can follow for every common output type.
No guessing about structure — just fill in the slots. Each template includes
an example and format rules.

---

## 1. JSON RESPONSE FORMAT

### API Success Response (Single Resource)
```json
{
  "data": {
    "id": "usr_abc123",
    "type": "user",
    "attributes": {
      "name": "Stone",
      "email": "stone@stone-ai.net",
      "tier": "PRO",
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-03-10T14:22:00.000Z"
    }
  },
  "meta": {
    "requestId": "req_xyz789",
    "timestamp": "2025-03-10T14:22:05.000Z"
  }
}
```

### API Success Response (Collection)
```json
{
  "data": [
    {
      "id": "usr_abc123",
      "name": "Stone",
      "email": "stone@stone-ai.net"
    },
    {
      "id": "usr_def456",
      "name": "Cardinal",
      "email": "cardinal@stone-ai.net"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### API Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address",
        "code": "invalid_string"
      },
      {
        "field": "name",
        "message": "Required",
        "code": "required"
      }
    ]
  },
  "meta": {
    "requestId": "req_xyz789",
    "timestamp": "2025-03-10T14:22:05.000Z"
  }
}
```

### Format Rules
```
- Always use camelCase for keys
- Always include "data" wrapper for success
- Always include "error" wrapper for errors
- Dates in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
- IDs should be strings (not numbers) for future flexibility
- Pagination metadata included for all list endpoints
- Error details should be an array (multiple errors possible)
- Never include null fields — omit them instead
```

---

## 2. MARKDOWN TABLE FORMAT

### Standard Comparison Table
```markdown
| Feature | Free | Starter | Plus | Smart | Pro |
|---------|------|---------|------|-------|-----|
| Agents | 4 | 16 | 30 | 39 | 38 |
| AI Model | Haiku | Haiku | Haiku | Sonnet | Sonnet |
| Bestie | No | 1 | 1 | 1 | 1 |
| Price/mo | $0 | $19.99 | $49.99 | $99.99 | $200 |
```

### Status Table
```markdown
| Task | Owner | Status | Due | Notes |
|------|-------|--------|-----|-------|
| Fix login bug | Backend Eng | ✅ Done | Mar 8 | Deployed to prod |
| Add search | Frontend Eng | 🔄 In Progress | Mar 12 | API ready, UI pending |
| Update pricing | Copywriter | ⏳ Queued | Mar 15 | Waiting on final numbers |
| Load testing | DevOps | ❌ Blocked | Mar 14 | Needs staging env |
```

### Format Rules
```
- Align columns with consistent spacing
- Use header row with separator (|---|)
- Keep cell content concise (< 30 chars per cell ideally)
- Use status indicators: ✅ ❌ 🔄 ⏳ ⚠️
- Left-align text, right-align numbers
- Sort by most relevant dimension (status, priority, or date)
```

---

## 3. BULLET LIST FORMAT

### Informational List
```markdown
Key findings from the security audit:

- **Input validation**: All API endpoints use Zod .strict() schemas. No raw body access.
- **Authentication**: Clerk middleware applied to all protected routes. Token validation on every request.
- **Authorization**: User ownership checked on all data-modifying endpoints. Admin routes require role check.
- **Encryption**: Sensitive fields encrypted with AES-256-GCM at rest. All traffic over TLS 1.3.
- **Dependencies**: npm audit shows 0 critical, 2 moderate vulnerabilities (both in dev dependencies).
```

### Action Item List
```markdown
Action items from today's session:

- [ ] Deploy the avatar fix to production (priority: high)
- [ ] Add rate limiting to the search endpoint (priority: medium)
- [ ] Update Prisma from 7.3 to 7.4.2 (priority: low)
- [ ] Write E2E tests for the checkout flow (priority: medium)
- [x] Fix the CORS configuration for avatars (completed)
```

### Format Rules
```
- Bold key terms at the start of each bullet
- One idea per bullet (don't combine multiple points)
- Use sub-bullets for supporting details (max 2 levels)
- Action items use checkbox format: - [ ] or - [x]
- Include priority/owner when relevant
- Limit to 7±2 items (human working memory limit)
```

---

## 4. NUMBERED STEPS FORMAT

### How-To Instructions
```markdown
## How to Deploy to Production

1. **Verify all tests pass locally**
   ```bash
   npm run test
   npm run build
   ```

2. **Create a pull request**
   ```bash
   git push -u origin feature/your-branch
   gh pr create --title "feat: description" --body "Summary of changes"
   ```

3. **Wait for CI checks to pass**
   - All tests must be green
   - Build must succeed
   - Preview deployment must be reviewed

4. **Request review from team**
   - Tag the relevant team member
   - Include screenshots for UI changes

5. **Merge after approval**
   - Squash and merge (default)
   - Delete the branch after merge

6. **Verify production deployment**
   - Check Vercel deployment status
   - Smoke test the affected feature
   - Monitor error rates for 15 minutes
```

### Format Rules
```
- Bold the action in each step (what to DO)
- Include code snippets where the user needs to type something
- Sub-items for details or conditions
- Keep steps sequential (each depends on previous)
- Number of steps: 3-10 (more than 10 → break into phases)
- Include verification after critical steps
```

---

## 5. CODE BLOCK WITH EXPLANATION

### Code with Inline Comments
```typescript
// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { updateUserSchema } from "@/lib/schemas";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Step 1: Authenticate the request
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  // Step 2: Verify the user is updating their own profile
  if (params.id !== userId) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Cannot modify another user" } },
      { status: 403 }
    );
  }

  // Step 3: Validate the request body
  const body = await request.json();
  const result = updateUserSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid data", details: result.error.issues } },
      { status: 422 }
    );
  }

  // Step 4: Update the user in the database
  const user = await prisma.user.update({
    where: { id: userId },
    data: result.data,
    select: { id: true, name: true, email: true, updatedAt: true },
  });

  // Step 5: Return the updated user
  return NextResponse.json({ data: user });
}
```

### Code with Preceding Explanation
```markdown
The fix requires two changes:

**1. Add null check in the avatar service** (`src/lib/services/avatar.ts`, line 42):

The `processAvatar` function assumes `avatar.url` is always defined, but it can
be undefined when the upload webhook hasn't fired yet. Adding a null check
prevents the TypeError.

```typescript
// Before (broken):
const imageUrl = avatar.url.replace("raw/", "processed/");

// After (fixed):
if (!avatar.url) {
  throw new AppError("Avatar not yet processed. Try again in a moment.", 409);
}
const imageUrl = avatar.url.replace("raw/", "processed/");
```

**2. Handle the new error in the route handler** (`src/app/api/avatars/route.ts`):

```typescript
try {
  const result = await avatarService.processAvatar(avatarId);
  return NextResponse.json({ data: result });
} catch (error) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: { code: "PROCESSING", message: error.message } },
      { status: error.statusCode }
    );
  }
  throw error; // Re-throw unexpected errors
}
```
```

### Format Rules
```
- Always specify the file path above the code block
- Use the correct language identifier for syntax highlighting
- Include comments for non-obvious logic (not obvious code)
- Show "before" and "after" for changes
- Keep code examples runnable (not pseudocode) unless explicitly stated
- Include imports when they're needed to understand the code
- Highlight the specific lines that matter with comments
```

---

## 6. COMPARISON CHART FORMAT

### Two-Option Comparison
```markdown
## Pusher vs Server-Sent Events (SSE)

| | Pusher | SSE |
|---|---|---|
| **Protocol** | WebSocket (via library) | HTTP streaming |
| **Direction** | Bi-directional | Server → Client only |
| **Cost** | $49/mo (Starter) | Free (Vercel included) |
| **Complexity** | Low (managed service) | Medium (custom implementation) |
| **Reconnection** | Automatic | Manual (need to implement) |
| **Scaling** | Handled by Pusher | Manual (edge function limits) |
| **Vendor lock-in** | Medium | None |
| **Best for** | Real-time chat, collaboration | Notifications, live updates |

**Recommendation**: Pusher for Stone AI — the managed scaling and automatic
reconnection justify the cost given our serverless architecture.
```

### Format Rules
```
- Include the recommendation at the bottom (not just comparison)
- Bold the dimension names in the left column
- Use brief values (< 20 chars per cell)
- Highlight the winning option per row when there's a clear winner
- Include cost if it's a relevant dimension
```

---

## 7. PROS/CONS TABLE FORMAT

```markdown
## Approach: Migrating from REST to GraphQL

### Pros
- **Reduced over-fetching**: Clients request exactly the fields they need
- **Single endpoint**: One URL instead of dozens of REST endpoints
- **Self-documenting**: Schema provides built-in documentation
- **Frontend flexibility**: Frontend team can iterate without backend changes
- **Type generation**: Auto-generate TypeScript types from schema

### Cons
- **Learning curve**: Team needs to learn GraphQL (estimated 2 weeks ramp-up)
- **Caching complexity**: HTTP caching doesn't work naturally (POST requests)
- **N+1 risk**: Naive resolvers create N+1 database queries (need DataLoader)
- **Security**: Complex queries can cause denial-of-service (need query depth limiting)
- **Overkill for simple APIs**: Adds complexity for straightforward CRUD

### Verdict
**Do not migrate at this time.** Stone AI's API is primarily consumed by our own
frontend. REST is working well. The learning curve and caching complexity
outweigh the benefits for our current use case.
```

### Format Rules
```
- Bold the first phrase of each pro/con (scannable)
- Match the number of pros and cons roughly (balanced analysis)
- Include a verdict/recommendation
- Be honest about downsides (don't sugarcoat)
- Order by importance (most impactful first)
```

---

## 8. EXECUTIVE SUMMARY FORMAT

```markdown
## Executive Summary: Q1 2025 Infrastructure Review

**Bottom line**: Infrastructure costs are $635/mo serving 10K users ($0.06/user).
AI API costs are 83% of total spend. Self-hosted Qwen reduces this to near-zero
for most requests.

**Key metrics**:
- Uptime: 99.95% (target: 99.9%) ✅
- Average response time: 180ms (target: <500ms) ✅
- Monthly cost: $635 (budget: $800) ✅
- Active users: 10,247 (target: 10,000) ✅

**Top 3 risks**:
1. AI API costs scale linearly with users — need to migrate more traffic to self-hosted
2. Database approaching connection pool limit during peak hours
3. Single point of failure on Clerk for authentication

**Recommended actions**:
1. Increase vLLM traffic allocation from 60% to 80% (saves ~$200/mo)
2. Implement PgBouncer for connection pooling (prevents outage risk)
3. Add auth fallback strategy for Clerk outage scenario

**Timeline**: All actions completable within 2 weeks.
```

### Format Rules
```
- Start with "Bottom line" (the one sentence a busy reader needs)
- Key metrics with target comparison (✅/❌)
- Risks numbered and prioritized
- Actions are specific and actionable (not vague)
- Include timeline
- Total length: half a page to one page maximum
- No technical jargon (readable by non-technical stakeholders)
```

---

## 9. ERROR REPORT FORMAT

```markdown
## Error Report: Avatar Upload Failure

**Severity**: High (affects all users uploading avatars)
**First detected**: 2025-03-10 14:22 UTC
**Status**: Resolved

### Symptoms
- Users see "Something went wrong" when saving profile with new avatar
- Error rate on /api/avatars endpoint: 100% (up from 0%)
- No errors on other endpoints

### Root Cause
The avatar processing webhook URL was changed during Cloudflare configuration
cleanup, causing the webhook to deliver to a 404 endpoint. Uploaded avatars
were never processed, so `avatar.url` remained null.

### Impact
- **Duration**: 3 hours 15 minutes
- **Users affected**: ~45 users attempted avatar upload during window
- **Data loss**: None (uploads are preserved in storage, just not processed)

### Resolution
1. Restored correct webhook URL in Cloudflare configuration
2. Reprocessed 45 pending avatar uploads
3. Added webhook URL to infrastructure-as-code (prevents recurrence)
4. Added monitoring alert for webhook delivery failures

### Prevention
- Webhook endpoints now managed in version control (not manual config)
- Alert triggers if webhook delivery failure rate exceeds 1%
- Added integration test that verifies webhook endpoint is reachable
```

### Format Rules
```
- Start with severity and status
- Separate symptoms (what users see) from root cause (what actually happened)
- Quantify impact (duration, users, data loss)
- Resolution is specific steps taken
- Prevention is what changes to avoid recurrence
- Write for future readers (someone investigating a similar issue)
```

---

## 10. API DOCUMENTATION FORMAT

```markdown
## POST /api/users

Create a new user account.

### Authentication
Required. Bearer token in Authorization header.

### Request

**Headers**
| Header | Required | Value |
|--------|----------|-------|
| Authorization | Yes | Bearer {token} |
| Content-Type | Yes | application/json |

**Body**
```json
{
  "name": "string (required, 1-100 chars)",
  "email": "string (required, valid email)",
  "tier": "string (optional, one of: FREE, STARTER, PLUS, SMART, PRO)"
}
```

### Response

**201 Created**
```json
{
  "data": {
    "id": "usr_abc123",
    "name": "Stone",
    "email": "stone@stone-ai.net",
    "tier": "FREE",
    "createdAt": "2025-03-10T14:22:00.000Z"
  }
}
```

**400 Bad Request** — Invalid input
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required"
  }
}
```

**409 Conflict** — Email already registered
```json
{
  "error": {
    "code": "CONFLICT",
    "message": "A user with this email already exists"
  }
}
```

**429 Too Many Requests** — Rate limit exceeded
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests",
    "retryAfter": 30
  }
}
```

### Example

```bash
curl -X POST https://stone-ai.net/api/users \
  -H "Authorization: Bearer sk_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{"name": "Stone", "email": "stone@stone-ai.net"}'
```
```

### Format Rules
```
- Method + path as heading
- One-line description
- Auth requirements stated first
- Request: headers table, body with types and constraints
- Response: every possible status code with example body
- Include curl example for quick testing
- Consistent structure across all endpoints
```

---

## 11. COMMIT MESSAGE FORMAT

### Standard Commit
```
feat(auth): add OAuth2 login with Google provider

Implement Google OAuth2 login flow using Clerk's social connection.
Users can now sign in with their Google account in addition to
email/password. Includes redirect handling and error states.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

### Bug Fix Commit
```
fix(api): handle null avatar URL in profile save

The avatar.url field can be undefined when the upload webhook
hasn't completed processing. Added null check with 409 response
to prevent TypeError crash. Users now see a retry prompt.

Fixes #234

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

### Format Rules
```
- Type: feat, fix, docs, style, refactor, perf, test, chore, ci, build
- Scope in parentheses: (auth), (api), (ui), (db), (billing)
- Subject line: imperative mood, lowercase, no period, < 72 chars
- Blank line between subject and body
- Body: explain WHY (not just what), wrap at 72 chars
- Footer: "Fixes #N" for issue references
- Co-Author line for AI-assisted commits
```

---

## 12. PR DESCRIPTION FORMAT

```markdown
## Summary
- Add Google OAuth2 login support via Clerk social connections
- Handle redirect flow and error states for failed authentication
- Add E2E test for complete OAuth login flow

## Changes
- `src/app/sign-in/page.tsx`: Added Google login button with Clerk's SocialButton component
- `src/middleware.ts`: Added /api/auth/callback/google to public routes
- `src/lib/auth.ts`: Added helper for extracting OAuth provider from session
- `tests/e2e/auth.spec.ts`: E2E test for Google OAuth flow

## Test plan
- [ ] Sign in with Google account on staging
- [ ] Verify redirect back to dashboard after auth
- [ ] Verify error message when Google auth is cancelled
- [ ] Verify existing email/password login still works
- [ ] Run full E2E test suite

## Screenshots
[Include before/after screenshots for UI changes]

---
Generated with [Claude Code](https://claude.com/claude-code)
```

### Format Rules
```
- Summary: 1-3 bullet points (what and why)
- Changes: list of files with one-line description each
- Test plan: checkbox list of verification steps
- Screenshots: for any UI changes
- Keep total length under 500 words
- Don't repeat the commit messages — summarize the overall change
```

---

## 13. AGENT REPORT FORMAT (STONE AI SPECIFIC)

### Agent Task Report
```markdown
## Agent Report: Senior Backend Engineer

**Task**: Implement user search endpoint with full-text search
**Duration**: 12 minutes
**Files modified**: 3

### What was done
1. Created `/api/users/search` endpoint with GET method
2. Added PostgreSQL full-text search using `tsvector` and `ts_rank`
3. Implemented cursor-based pagination for search results
4. Added rate limiting (30 req/min) to search endpoint
5. Added Zod schema for search query validation

### Files changed
| File | Change |
|------|--------|
| `src/app/api/users/search/route.ts` | New file — search endpoint |
| `prisma/migrations/20250310_add_search_index/migration.sql` | New — GIN index |
| `src/lib/schemas/search.ts` | New — Zod validation schema |

### Testing
- ✅ Search by name returns correct results
- ✅ Search by email returns correct results
- ✅ Pagination works correctly (cursor-based)
- ✅ Rate limiting triggers at 31st request
- ✅ Empty search returns empty array (not error)
- ✅ Authorization: users only see results within their org

### Known limitations
- Full-text search is English-only (need to add language support later)
- Search results limited to 100 per query (pagination handles more)

### Grade request
Ready for Stone's review and grading.
```

### Format Rules
```
- Agent identity at top
- Task description in one line
- Duration for tracking efficiency
- What was done as numbered list
- Files changed as table
- Testing results with pass/fail indicators
- Known limitations stated explicitly
- Grade request for Stone's review
```

---

## 14. TROUBLESHOOTING GUIDE FORMAT

```markdown
## Troubleshooting: "Cannot connect to database"

### Quick fix (try first)
```bash
# Check if database is running
docker ps | grep stoneai-db

# If not running, start it
docker start stoneai-db
```

### Common causes

**1. Database container not running**
- Symptom: `ECONNREFUSED` on port 5432
- Fix: `docker start stoneai-db`

**2. Wrong connection string**
- Symptom: `password authentication failed`
- Fix: Check `.env` file matches database credentials
  ```
  DATABASE_URL=postgresql://user:password@localhost:5432/stoneai
  ```

**3. Port conflict**
- Symptom: Another process on port 5432
- Fix: `lsof -i :5432` to find conflicting process, then kill or change port

**4. Connection pool exhausted**
- Symptom: `too many connections` error
- Fix: Restart the application, or increase `connection_limit` in Prisma schema

### Still stuck?
Run diagnostics:
```bash
# Test direct connection
psql postgresql://user:password@localhost:5432/stoneai -c "SELECT 1"

# Check Prisma connection
npx prisma db pull
```
```

### Format Rules
```
- Quick fix first (most common solution)
- Numbered causes with symptom + fix pairs
- Include actual commands to run
- "Still stuck?" section with deeper diagnostics
- Most common causes first, rare causes last
```

---

## USAGE GUIDE

When generating ANY output:
1. Identify the output type
2. Retrieve the matching template
3. Fill in the template with actual content
4. Verify formatting matches the template rules

**Embedding hint**: Each numbered format (## N.) is an independent retrieval unit.
The format name is the retrieval key. Agent should retrieve the template matching
the requested output type.
