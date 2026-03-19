# Technical Writing Standards

## Seed Classification
- **Domain**: Copywriting / Technical Documentation
- **Relevance**: Stone AI API docs, changelogs, error messages, developer guides, in-app copy
- **Last Updated**: 2026-03-09

---

## API Documentation Voice

### Principles

Technical documentation has one job: help the reader accomplish their goal as fast as possible. Every word that doesn't serve that goal is noise.

**The 5 Rules of Technical Copy**:

1. **Clarity over cleverness** — Never sacrifice understanding for personality
2. **Specificity over vagueness** — "Returns a JSON object with user_id (string) and created_at (ISO 8601 timestamp)" not "Returns user data"
3. **Consistency over variety** — Use the same term for the same concept everywhere. If you call it "agent" in one place, don't call it "bot" in another.
4. **Scannable over readable** — Headers, code blocks, tables, bullet points. Developers scan; they don't read.
5. **Actionable over informational** — Every section should answer "what do I DO with this information?"

### API Reference Style Guide

#### Endpoint Documentation Template

```markdown
## Create Agent Session

Creates a new session for the specified agent.

### Request

`POST /api/v1/agents/{agent_id}/sessions`

#### Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| agent_id | string | Yes | The unique identifier for the agent (e.g., `ag_copywriter_01`) |

#### Headers

| Header | Value | Required |
|---|---|---|
| Authorization | Bearer {api_key} | Yes |
| Content-Type | application/json | Yes |

#### Body Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| context | string | No | null | Initial context for the session |
| memory_enabled | boolean | No | true | Whether the agent retains session memory |
| max_tokens | integer | No | 4096 | Maximum response length |

#### Example Request

```bash
curl -X POST https://api.stone-ai.net/v1/agents/ag_copywriter_01/sessions \
  -H "Authorization: Bearer sk_live_abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "context": "SaaS product targeting small businesses",
    "memory_enabled": true,
    "max_tokens": 4096
  }'
```

### Response

#### Success (201 Created)

```json
{
  "id": "sess_abc123def456",
  "agent_id": "ag_copywriter_01",
  "created_at": "2026-03-09T14:30:00Z",
  "memory_enabled": true,
  "status": "active"
}
```

#### Error Responses

| Status | Code | Description |
|---|---|---|
| 400 | invalid_request | Missing or invalid parameters |
| 401 | unauthorized | Invalid or missing API key |
| 404 | agent_not_found | The specified agent_id does not exist |
| 429 | rate_limited | Too many requests. Retry after the time specified in Retry-After header |
```

#### Writing Rules for API Docs

1. **Start every endpoint section with a one-sentence description** of what it does
2. **List all parameters in a table** — never bury parameters in prose
3. **Always include example requests AND responses** — developers learn by example
4. **Show error responses** — developers spend more time debugging than building
5. **Use realistic example data** — not "foo", "bar", "test123"
6. **Include code samples in multiple languages** when possible (curl, JavaScript, Python)
7. **Version your documentation** — `/v1/` should have its own docs distinct from `/v2/`
8. **Mark deprecated endpoints clearly** with migration instructions

### Authentication Documentation

Authentication docs are the FIRST thing developers read. Make them bulletproof.

```markdown
## Authentication

All API requests require a Bearer token in the Authorization header.

### Getting Your API Key

1. Log in to your Stone AI dashboard
2. Navigate to Settings → API Keys
3. Click "Generate New Key"
4. Copy the key immediately — it won't be shown again

### Using Your API Key

Include it in every request header:

```bash
Authorization: Bearer sk_live_your_api_key_here
```

### Key Types

| Type | Prefix | Permissions |
|---|---|---|
| Live key | sk_live_ | Full access to your account |
| Test key | sk_test_ | Sandbox access only, no billing |

### Security Best Practices

- Never expose API keys in client-side code
- Store keys in environment variables, not source code
- Rotate keys every 90 days
- Use test keys for development and CI/CD
- Revoke compromised keys immediately in your dashboard
```

---

## Changelog Writing

### Changelog Principles

A changelog is a communication tool, not a commit log. It exists to help users understand what changed and whether it affects them.

### Changelog Format

```markdown
## [1.5.0] — 2026-03-09

### Added
- Agent collaboration mode: agents can now share context and work together on complex tasks
- Bulk session export: download all session data as JSON from Settings → Data
- Support for 6 additional languages in Bestie companion

### Changed
- Improved response time for Data Analyst agent by 40%
- Dashboard now loads 3x faster on mobile devices
- Updated pricing page layout for better tier comparison

### Fixed
- Fixed an issue where agent memory would occasionally reset between sessions
- Resolved a bug where the Copywriter agent would duplicate paragraphs in long-form content
- Fixed timezone handling in scheduled reports (now correctly uses user's local timezone)

### Security
- Patched XSS vulnerability in custom backdrop uploads (reported by security researcher — thank you!)
- Added rate limiting to password reset endpoint (max 5 requests per hour)

### Deprecated
- The `/v1/chat` endpoint is deprecated and will be removed in v2.0. Use `/v1/agents/{id}/sessions` instead.
- Legacy webhook format will stop working on 2026-06-01. See migration guide: [link]

### Removed
- Removed the beta "Quick Chat" feature. All functionality has been merged into agent sessions.
```

### Changelog Writing Rules

1. **Group by type**: Added, Changed, Fixed, Security, Deprecated, Removed
2. **User-facing language**: "Improved response time" not "Optimized database query performance on the agent inference pipeline"
3. **Quantify when possible**: "40% faster" not "significantly faster"
4. **Link to details**: For complex changes, link to a blog post or documentation page
5. **Include breaking changes prominently**: Use bold or a separate section for anything that requires user action
6. **Date every release**: ISO 8601 format (YYYY-MM-DD)
7. **Keep it scannable**: One line per change. Details go in linked pages.
8. **Credit security reporters**: Build goodwill with the security community

### Changelog Anti-Patterns

- "Various bug fixes and performance improvements" — Useless. Be specific.
- "Updated dependencies" — Only mention if it affects the user
- Internal refactoring — Don't include unless it changed user-facing behavior
- "Fixed a bug" — WHICH bug? What was the symptom?

---

## Error Message Copy

### Error Message Principles

Error messages are the MOST IMPORTANT copy in your product. They appear when users are frustrated, confused, or blocked. Every error is a chance to either help them recover or lose them forever.

### The Error Message Formula

**What happened + Why + What to do next**

Bad: "Error 500"
Better: "Something went wrong"
Best: "We couldn't save your changes because the server is temporarily overloaded. Your work is safe — try again in a few seconds."

### Error Message Categories

#### Validation Errors (User Did Something Wrong)

**Tone**: Helpful, not blaming. Never say "you made an error."

```
Bad:  "Invalid email address"
Good: "That doesn't look like an email address. Check for typos?"

Bad:  "Password too short"
Good: "Password needs at least 8 characters. You're at 5."

Bad:  "Required field"
Good: "We need your email to create your account."

Bad:  "Invalid input"
Good: "Agent names can only contain letters, numbers, and hyphens."
```

#### System Errors (We Broke Something)

**Tone**: Honest, apologetic, actionable.

```
Bad:  "Internal Server Error"
Good: "Something went wrong on our end. We've been notified and are looking into it. Try again in a minute."

Bad:  "Service Unavailable"
Good: "Stone AI is temporarily down for maintenance. We'll be back in about 15 minutes. Status updates: status.stone-ai.net"

Bad:  "Request timeout"
Good: "This is taking longer than expected. Your request is still processing — check back in a moment, or try a simpler request."
```

#### Permission Errors (Access Denied)

**Tone**: Clear, directional — tell them what to do to get access.

```
Bad:  "403 Forbidden"
Good: "You don't have access to this agent. It's available on the Plus plan ($49.99/mo). [Upgrade →]"

Bad:  "Unauthorized"
Good: "Your session has expired. [Log in again →] to continue."

Bad:  "Feature not available"
Good: "The Strategy agent is available on the Smart plan and above. You're currently on Starter. [See upgrade options →]"
```

#### Network Errors (Connection Issues)

**Tone**: Calm, informative, recovery-focused.

```
Bad:  "Network error"
Good: "Looks like you're offline. We've saved your work locally — it'll sync when you're back online."

Bad:  "Connection refused"
Good: "Can't reach Stone AI right now. Check your internet connection and try again. If this keeps happening, check status.stone-ai.net."
```

### Error Message Checklist

- [ ] Does it explain what happened (in plain language)?
- [ ] Does it avoid blaming the user?
- [ ] Does it tell the user what to do next?
- [ ] Does it provide a recovery path (link, button, retry)?
- [ ] Is it free of technical jargon (no error codes in the UI)?
- [ ] Is it specific enough to act on (not "something went wrong")?
- [ ] Does it preserve the user's work when possible?
- [ ] Is the tone appropriate for the severity?

---

## Tooltip and Helper Text

### Tooltip Principles

Tooltips exist to prevent confusion, not to explain obvious things. If your UI needs a tooltip on every element, the UI needs redesigning.

### When to Use Tooltips

**Use tooltips for**:
- Technical terms the user might not know
- Non-obvious icons or buttons
- Form fields with specific requirements
- Features that behave unexpectedly

**Don't use tooltips for**:
- Self-explanatory labels ("Email", "Password")
- Primary navigation
- Commonly understood UI patterns (close button, back arrow)
- Information that should be in the main UI text

### Tooltip Writing Rules

1. **Maximum 150 characters** — if you need more, use inline help or a help link
2. **Start with a verb** when explaining an action: "Exports your session history as a JSON file"
3. **Start with a noun** when defining a concept: "The unique identifier for this agent session"
4. **No periods** at the end of single-sentence tooltips
5. **No redundancy** — don't repeat the label. If the button says "Export", the tooltip shouldn't start with "Export..."

### Tooltip Examples for Stone AI

```
Button: [Memory Toggle]
Tooltip: "When on, this agent remembers previous conversations"

Label: "Max Tokens"
Tooltip: "Maximum response length. 1 token ≈ 4 characters. Default: 4,096"

Icon: 🔒 (next to agent name)
Tooltip: "This agent is available on the Smart plan and above"

Button: [Collaborate]
Tooltip: "Share this session's context with another agent"

Label: "API Key"
Tooltip: "Your secret key for API access. Never share this publicly"
```

### Helper Text (Below Form Fields)

Helper text appears below or beside form fields to provide persistent guidance.

```
[Email field]
Helper: "We'll use this for account recovery and important updates only"

[Password field]
Helper: "At least 8 characters with one number and one special character"

[Agent Name field]
Helper: "Letters, numbers, and hyphens only. 3-50 characters."

[Webhook URL field]
Helper: "We'll send POST requests to this URL when events occur. Must use HTTPS."

[API Key field]
Helper: "Starts with sk_live_ or sk_test_. Find yours in Settings → API Keys."
```

---

## Developer Guide Writing

### Guide Structure

Every developer guide follows the same arc: Context → Setup → Implementation → Verification → Troubleshooting.

```markdown
# [Guide Title]: [What You'll Build]

## Overview
[2-3 sentences: What this guide covers, who it's for, what you'll have at the end]

**Prerequisites:**
- [Requirement 1, with link to setup if needed]
- [Requirement 2]
- [Estimated time: X minutes]

## Step 1: [Setup / Installation]
[Brief explanation of what this step accomplishes]

```bash
[command]
```

[Expected output or verification step]

## Step 2: [Core Implementation]
[Brief explanation]

```javascript
[code with comments explaining non-obvious parts]
```

**What's happening here:**
- Line 3: [explanation]
- Line 7: [explanation]

## Step 3: [Configuration / Customization]
[Brief explanation with code]

## Step 4: [Testing / Verification]
[How to verify everything works]

```bash
[test command]
```

**Expected output:**
```
[what they should see]
```

## Troubleshooting

### [Common Problem 1]
**Symptom:** [What the user sees]
**Cause:** [Why it happens]
**Fix:** [How to fix it]

### [Common Problem 2]
**Symptom:** [What the user sees]
**Cause:** [Why it happens]
**Fix:** [How to fix it]

## Next Steps
- [Link to related guide]
- [Link to API reference]
- [Link to advanced usage]
```

### Developer Guide Writing Rules

1. **Test every code sample** — copy-paste your own code samples and verify they work
2. **Show expected output** after every step — developers need to verify they're on track
3. **Include error scenarios** — what goes wrong and how to fix it
4. **Use consistent formatting** — same code block style, same heading hierarchy, every time
5. **Link to prerequisites** — don't assume they have Node.js installed; link to the install guide
6. **Version pin dependencies** — `npm install stone-ai-sdk@2.1.0` not `npm install stone-ai-sdk`
7. **Progressive disclosure** — start simple, add complexity. Don't dump the advanced config in step 1.
8. **One task per guide** — "How to set up webhooks" not "How to set up webhooks, handle errors, and build a dashboard"

### Code Sample Rules

1. **Complete and runnable** — no pseudo-code. The sample should work if copy-pasted.
2. **Well-commented** — explain the WHY, not the WHAT. `// Retry on 429` not `// call the API`
3. **Error handling included** — real code handles errors. Show it.
4. **Realistic data** — use example.com for URLs, realistic-looking IDs, sensible parameters
5. **Language-appropriate style** — follow community conventions for each language (camelCase in JS, snake_case in Python)

### Code Comment Style

```javascript
// Good: Explains WHY
// Retry with exponential backoff because the rate limiter
// returns 429 during burst traffic
const response = await retryWithBackoff(() => client.createSession(agentId));

// Bad: Explains WHAT (the code already says what)
// Create a session for the agent
const response = await client.createSession(agentId);

// Good: Warns about a non-obvious gotcha
// NOTE: agent_id is case-sensitive. "ag_Copywriter_01" ≠ "ag_copywriter_01"
const agent = await client.getAgent(agentId);

// Bad: Obvious
// Check if agent exists
if (agent) {
```

---

## In-App Copy (UI Text / Microcopy)

### Button Copy

| Action | Good | Bad |
|---|---|---|
| Create | "Create Agent" | "Submit" |
| Delete | "Delete Session" | "Remove" (ambiguous) |
| Save | "Save Changes" | "Save" (save what?) |
| Cancel | "Cancel" or "Discard Changes" | "Go Back" |
| Upgrade | "Upgrade to Plus" | "Buy" |
| Export | "Export as JSON" | "Download" (format?) |

### Empty State Copy

Empty states appear when there's no data to show. They're a chance to guide the user.

```
Agent Sessions (empty):
"No sessions yet. Start a conversation with any agent to create your first session."
[Start a Session →]

Dashboard (new user):
"Welcome to Stone AI. Your agents are ready — pick one to start building."
[Browse Agents →]

Search results (no matches):
"No agents match '{query}'. Try a different search, or browse all 40 agents."
[Browse All Agents →]

Activity feed (empty):
"Nothing here yet. As you use Stone AI, your activity will appear here."
```

### Confirmation Dialog Copy

```
Delete session:
Title: "Delete this session?"
Body: "This will permanently delete the session and all its messages. Agent memory from this session will be preserved."
Buttons: [Cancel] [Delete Session]

Downgrade plan:
Title: "Downgrade to {plan_name}?"
Body: "You'll lose access to {count} agents at the end of your current billing period ({date}). Your data and agent memory will be preserved."
Buttons: [Keep Current Plan] [Downgrade]

Cancel subscription:
Title: "Cancel your subscription?"
Body: "You'll keep access until {end_date}. After that, you'll move to the Free plan with 4 agents. Your data is preserved for 30 days."
Buttons: [Keep Subscription] [Cancel Subscription]
```

### Loading State Copy

```
Agent responding: "Thinking..." or "[Agent name] is working on it..."
Data loading: "Loading your dashboard..."
Export processing: "Preparing your export... This might take a moment for large datasets."
Search: "Searching across all agents..."
```

### Success State Copy

```
Session created: "Session started with {agent_name}"
Settings saved: "Settings saved"
Export complete: "Export ready — downloading now"
Upgrade complete: "Welcome to {plan_name}! You now have access to {count} agents."
Password changed: "Password updated successfully"
```

---

## Style Consistency

### Technical Writing Glossary for Stone AI

Maintain consistent terminology across ALL documentation:

| Term | Use | Don't Use |
|---|---|---|
| Agent | agent, AI agent | bot, chatbot, assistant |
| Session | session | conversation, chat, thread |
| Memory | agent memory | context, history, recall |
| Tier / Plan | plan, tier | level, package, bundle |
| Dashboard | dashboard | home, main page, control panel |
| API key | API key | token, secret, credential |
| Webhook | webhook | callback, hook, notification URL |
| Endpoint | endpoint | route, URL, path |
| Request | request | call, query, hit |
| Response | response | result, reply, output |

### Capitalization Rules

- **Product names**: Stone AI (always capitalized)
- **Agent names**: Capitalize when referring to specific agents (the Copywriter, the Data Analyst)
- **Plan names**: Capitalize (Free, Starter, Plus, Smart, Pro)
- **Feature names**: Capitalize when it's a branded feature (Bestie, Agent Memory), lowercase for generic features (dashboard, settings)
- **Technical terms**: Lowercase (API key, webhook, endpoint, JSON)
- **UI elements**: Capitalize menu items as they appear in the UI ("Go to Settings → API Keys")

### Number Formatting

- Spell out one through nine: "three agents", "five plans"
- Use numerals for 10+: "16 agents", "40 agents"
- Always use numerals with units: "4 GB", "30 days", "$19.99"
- Use commas for thousands: "2,000 founders" not "2000 founders"
- Percentages: "40%" not "40 percent" in technical docs

---

## Documentation Maintenance

### Doc Review Schedule

| Doc Type | Review Frequency | Owner |
|---|---|---|
| API reference | Every release | Backend team |
| Changelogs | Every release | Product team |
| Developer guides | Quarterly | DevRel |
| Error messages | Quarterly | Frontend team |
| In-app copy | As changed | Design team |
| Tooltips/helpers | Quarterly | Design team |

### Documentation Debt Indicators

- Users asking questions answered in the docs = docs are hard to find or poorly written
- Support tickets about documented features = docs are incomplete or unclear
- Developers copy-pasting from Stack Overflow instead of your docs = your docs are worse than Stack Overflow
- Outdated code samples = testing pipeline is broken

### Documentation Quality Metrics

| Metric | How to Measure | Target |
|---|---|---|
| Time to first API call | Track from doc page visit to first successful request | < 15 minutes |
| Support ticket deflection | Compare topics before/after doc updates | 30%+ reduction |
| Doc search success | Track search → page view → no immediate re-search | > 70% |
| Code sample copy rate | Track copy button clicks on code blocks | > 50% of visitors |
| Doc NPS | Periodic survey: "Was this page helpful?" | > 70% positive |

---

*This seed is part of the Stone AI Palace USB Package — Copywriting domain.*
