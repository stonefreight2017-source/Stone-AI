# STONE AI — Cardinal Marketing Agent Reminder Protocol

## Classification: PALACE INTERNAL — Cardinal (Head 2) + Founder
## Version: 1.1 | Date: March 2026
## Owner: Cardinal (Head 2) — Intelligence & Systems Architecture
## Enforcement: Mandatory — No content publishes without Founder approval

---

## 1. Purpose

Ensure the Founder is notified when marketing content is awaiting approval before a scheduled posting window. Cardinal acts as the approval gatekeeper — no marketing content reaches any platform without explicit Founder authorization.

The Founder must be able to **see the full visual mockup** of every advertisement in color via email at **3headedm@gmail.com** before any content is posted. This is non-negotiable — text summaries alone are insufficient.

---

## 2. Reminder Requirement

Cardinal must send a reminder notification to the Founder if a content approval request remains pending **one hour before** a scheduled posting time.

Content is organized in **batches** — grouped by brand and platform. Each batch is sent as a single visual HTML email containing full-color mockups of every content piece, so the Founder can see exactly what each advertisement will look like on each platform.

---

## 3. Posting Windows

| Window | Post Time | Reminder Time |
|--------|-----------|---------------|
| Morning | 09:00 AM ET | 08:00 AM ET |
| Afternoon | 01:00 PM ET | 12:00 PM ET |
| Evening | 07:00 PM ET | 06:00 PM ET |

**Timezone**: America/New_York (consistent with all Palace automation — see email-automation-rules.md §6)

---

## 4. Reminder Timing

If approval has not been received, Cardinal must send a reminder email **exactly 1 hour** before the scheduled posting time.

### Example Reminder Schedule

| Scheduled Post Time | Reminder Sent At |
|---------------------|------------------|
| 09:00 AM ET | 08:00 AM ET |
| 01:00 PM ET | 12:00 PM ET |
| 07:00 PM ET | 06:00 PM ET |

### Quiet Hours Interaction

- The 08:00 AM reminder falls **after** quiet hours end (07:00 AM per email-automation-rules.md §6) — sends normally.
- If a posting window is added that would require a reminder during quiet hours (23:00–07:00), the reminder **bypasses quiet hours** as it is time-sensitive Founder-action-required content (treated as P1).

---

## 5. Content Brands & Handles

All 5 brands under the Stone AI ecosystem produce marketing content:

| Brand | Email Handle | Platforms |
|-------|-------------|-----------|
| **Stone AI** (main product) | app.stone-ai.net@stone-ai.net | Instagram, Facebook, TikTok, Bluesky |
| **Stone AI Tools** (dev platform) | stoneaitools@stone-ai.net | X/Twitter, Instagram, Threads, TikTok, LinkedIn, Reddit, Pinterest |
| **Best AI** (companion brand) | bestAI@stone-ai.net | All 10 platforms |
| **Best AI Mobile** (mobile app) | mybestAIapp@stone-ai.net | 9 platforms |
| **Stone AI Corporate** | StoneAI2026@outlook.com | X, LinkedIn, YouTube, Reddit, Threads, Discord, Product Hunt, GitHub |

### Content Creation Responsibilities

| Head / Agent | Content Domain |
|-------------|----------------|
| **Stone** (Head 1) | Business strategy, positioning, revenue-focused posts |
| **Cardinal** (Head 2) | Technical/competitive intelligence posts |
| **Marketing Strategist** | Brand voice, platform optimization, visual mockups |

All three contribute content, but **no content from any source publishes without Founder approval**.

---

## 6. Reminder Email Content

### Subject Line

```
Stone AI Content Approval Pending
```

### Visual Mockup Requirement

**The reminder email MUST include full-color HTML visual mockups** of every content piece in the batch. The Founder must see exactly what each advertisement will look like on each platform — with platform-specific styling (Instagram post frame, Twitter/X card, TikTok vertical, LinkedIn post, Reddit thread, etc.), brand colors, and actual copy.

Reference implementation: `ad-batch-1-visual.html` in the stone-ai repo root — this is the established format from the initial batch sent to the Founder.

### Body Template

The email body combines the approval metadata with the visual batch:

```
[3HM HEADER — Stone Intelligence branding]

Ad Content — Batch [N]
[X] Visual Mockups | AWAITING APPROVAL
Nothing gets posted until you approve. Reply to approve, reject, or request changes.

Scheduled Post Time: [time — e.g., 09:00 AM ET]

[BRAND SECTION: STONE AI]
[Full-color HTML mockups for each platform — Instagram carousel, Facebook post, TikTok storyboard, etc.]

[BRAND SECTION: STONE AI TOOLS]
[Full-color HTML mockups...]

[BRAND SECTION: BEST AI]
[Full-color HTML mockups...]

[BRAND SECTION: BEST AI MOBILE]
[Full-color HTML mockups...]

[BRAND SECTION: STONE AI CORPORATE]
[Full-color HTML mockups...]

[BATCH SUMMARY TABLE — pieces per brand, platforms covered]

Reply with one of the following:

  APPROVE — Content will be published at the scheduled posting time.
  REJECT — Content will be discarded and logged as rejected.
  REQUEST CHANGES — Content will be held and returned for revision.

If approval is not received before the scheduled posting window, the content will automatically be held until the next available posting window.
```

### Email Delivery Method

```bash
# Generate the visual HTML batch file, then send via the established script:
npx tsx scripts/send-email.ts \
  --to "3headedm@gmail.com" \
  --subject "[3HM] Ad Content Batch [N] — [X] Pieces Across All Brands — AWAITING APPROVAL" \
  --file "./ad-batch-[N]-visual.html"
```

This uses the `scripts/send-email.ts` script with the `--file` flag for HTML body delivery (established in Batch 1).

---

## 7. Posting Safeguard Rule

**Cardinal may NOT publish any content without Founder approval. No exceptions.**

### Hold-and-Roll Logic

If approval is still pending after the posting time passes:
1. The content is **automatically moved** to the next available posting window.
2. The content **remains in pending approval status**.
3. A new reminder will be sent 1 hour before the next posting window.
4. This cycle repeats until the Founder responds with APPROVE, REJECT, or REQUEST CHANGES.

### Next-Window Resolution Table

| Missed Window | Content Rolls To | New Reminder At |
|---------------|-------------------|-----------------|
| 09:00 AM | 01:00 PM same day | 12:00 PM |
| 01:00 PM | 07:00 PM same day | 06:00 PM |
| 07:00 PM | 09:00 AM next day | 08:00 AM next day |

---

## 8. Founder Response Handling

| Response | Action | Status |
|----------|--------|--------|
| **APPROVE** | Content is published at the current/next posting window. Founder may also use `@STONE post batch [N]` to trigger execution. | `approved` |
| **REJECT** | Content is discarded. Logged with rejection timestamp. | `rejected` |
| **REQUEST CHANGES** | Content is held and returned to the originating head/agent for revision. Re-enters the approval queue after revision. | `revision_requested` |

### Per-Item vs Batch Approval

- **Batch approval**: `APPROVE` — approves all items in the batch.
- **Per-item approval**: `APPROVE [content-id]` — approves a specific item while others remain pending.
- **Partial rejection**: `REJECT [content-id]` — rejects specific items; remaining items stay pending.
- **Mixed responses**: The Founder may approve some, reject some, and request changes on others in a single reply.

### Response Detection

Founder responses are detected via:
- **Email reply** to the batch email at 3headedm@gmail.com (parsed per D13 command routing — see email-automation-rules.md §4)
- **@ command**: `@CARDINAL APPROVE [batch-id or content-id]` / `@CARDINAL REJECT [id]` / `@CARDINAL CHANGES [id]`
- **Execution command**: `@STONE post batch [N]` — triggers Stone to execute approved content
- Response keywords are case-insensitive and matched from the reply body.

---

## 9. Logging Requirement

Cardinal must log the following for every content approval cycle:

| Field | Description | Example |
|-------|-------------|---------|
| `batch_id` | Batch identifier | `batch-001` |
| `content_id` | Unique identifier for the content item | `mkt-2026-03-10-001` |
| `brand` | Which of the 5 brands | `stone-ai` / `stone-ai-tools` / `best-ai` / `best-ai-mobile` / `stone-ai-corporate` |
| `platform` | Target platform | `instagram` / `twitter` / `tiktok` / etc. |
| `content_format` | Content type | `carousel` / `post` / `video-15s` / `infographic` / etc. |
| `content_summary` | Brief description of the content | `40 agents carousel post` |
| `drafted_by` | Who created the content | `stone` / `cardinal` / `marketing-strategist` |
| `original_post_time` | First scheduled posting window | `2026-03-10T09:00:00-05:00` |
| `reminder_email_timestamp` | When the reminder was sent | `2026-03-10T08:00:00-05:00` |
| `visual_html_file` | Path to the HTML mockup file | `ad-batch-1-visual.html` |
| `approval_status` | Current status | `pending` / `approved` / `rejected` / `revision_requested` |
| `founder_response_timestamp` | When the Founder responded | `2026-03-10T08:15:00-05:00` |
| `final_posting_decision` | Whether the content was ultimately posted | `posted` / `held` / `discarded` |
| `actual_posting_time` | Actual time content was published (if approved) | `2026-03-10T09:00:00-05:00` |
| `roll_count` | Number of times content rolled to next window | `0` |
| `smtp_message_id` | SMTP confirmation from send-email.ts | `<08d71962-...@gmail.com>` |
| `notes` | Any additional context | `Approved on first reminder` |

### Log Storage

- **Primary**: Palace log at `~/palace/logs/cardinal/marketing-approvals.jsonl` (append-only, per C-22 journal protocol)
- **Backup**: Cardinal journal entry at `~/palace/experience/cardinal/journal.jsonl` (per EOS protocol)

### Log Entry Format

```jsonl
{
  "batch_id": "batch-001",
  "content_id": "mkt-2026-03-10-001",
  "brand": "stone-ai",
  "platform": "instagram",
  "content_format": "carousel",
  "content_summary": "44 AI agents one platform — carousel with agent categories",
  "drafted_by": "marketing-strategist",
  "original_post_time": "2026-03-10T09:00:00-05:00",
  "reminder_timestamps": ["2026-03-10T08:00:00-05:00"],
  "visual_html_file": "ad-batch-1-visual.html",
  "approval_status": "approved",
  "founder_response": "APPROVE",
  "founder_response_timestamp": "2026-03-10T08:15:00-05:00",
  "final_posting_decision": "posted",
  "actual_posting_time": "2026-03-10T09:00:00-05:00",
  "roll_count": 0,
  "smtp_message_id": "<08d71962-f427-8320-6d40-ed26edf06827@gmail.com>",
  "notes": null
}
```

---

## 10. Automation Rule Definition

Integration with the Palace email automation engine (see email-automation-rules.md §10):

```javascript
const contentApprovalReminderRules = [
  {
    id: "cardinal-mkt-reminder-0900",
    name: "Marketing Content Reminder — 09:00 AM Window",
    enabled: true,
    trigger: {
      type: "schedule",
      cron: "0 8 * * *",          // 08:00 AM daily
      timezone: "America/New_York",
    },
    condition: async () => {
      // Check if any content is pending approval for the 09:00 AM window
      const pending = await getPendingBatch({ postTime: "09:00" });
      return pending !== null;
    },
    action: async () => {
      const pendingBatch = await getPendingBatch({ postTime: "09:00" });
      if (pendingBatch) {
        // Send the full visual HTML batch email
        const batchHtmlFile = await generateBatchVisualHtml(pendingBatch);
        await sendBatchApprovalEmail({
          batchId: pendingBatch.id,
          htmlFile: batchHtmlFile,
          scheduledTime: "09:00 AM ET",
          pieceCount: pendingBatch.items.length,
        });
        await logApprovalReminder(pendingBatch.id, new Date());
      }
    },
    rateLimit: { maxPerHour: 3, cooldownMinutes: 5 },
  },
  {
    id: "cardinal-mkt-reminder-1300",
    name: "Marketing Content Reminder — 01:00 PM Window",
    enabled: true,
    trigger: {
      type: "schedule",
      cron: "0 12 * * *",         // 12:00 PM daily
      timezone: "America/New_York",
    },
    condition: async () => {
      const pending = await getPendingBatch({ postTime: "13:00" });
      return pending !== null;
    },
    action: async () => {
      const pendingBatch = await getPendingBatch({ postTime: "13:00" });
      if (pendingBatch) {
        const batchHtmlFile = await generateBatchVisualHtml(pendingBatch);
        await sendBatchApprovalEmail({
          batchId: pendingBatch.id,
          htmlFile: batchHtmlFile,
          scheduledTime: "01:00 PM ET",
          pieceCount: pendingBatch.items.length,
        });
        await logApprovalReminder(pendingBatch.id, new Date());
      }
    },
    rateLimit: { maxPerHour: 3, cooldownMinutes: 5 },
  },
  {
    id: "cardinal-mkt-reminder-1900",
    name: "Marketing Content Reminder — 07:00 PM Window",
    enabled: true,
    trigger: {
      type: "schedule",
      cron: "0 18 * * *",         // 06:00 PM daily
      timezone: "America/New_York",
    },
    condition: async () => {
      const pending = await getPendingBatch({ postTime: "19:00" });
      return pending !== null;
    },
    action: async () => {
      const pendingBatch = await getPendingBatch({ postTime: "19:00" });
      if (pendingBatch) {
        const batchHtmlFile = await generateBatchVisualHtml(pendingBatch);
        await sendBatchApprovalEmail({
          batchId: pendingBatch.id,
          htmlFile: batchHtmlFile,
          scheduledTime: "07:00 PM ET",
          pieceCount: pendingBatch.items.length,
        });
        await logApprovalReminder(pendingBatch.id, new Date());
      }
    },
    rateLimit: { maxPerHour: 3, cooldownMinutes: 5 },
  },
];

// Hold-and-roll rule: runs at each posting window to move unapproved content
const contentHoldAndRollRules = [
  {
    id: "cardinal-mkt-hold-roll-0900",
    name: "Hold & Roll — 09:00 AM Window",
    trigger: { type: "schedule", cron: "5 9 * * *", timezone: "America/New_York" },
    action: async () => await rollPendingBatch("09:00", "13:00"),
  },
  {
    id: "cardinal-mkt-hold-roll-1300",
    name: "Hold & Roll — 01:00 PM Window",
    trigger: { type: "schedule", cron: "5 13 * * *", timezone: "America/New_York" },
    action: async () => await rollPendingBatch("13:00", "19:00"),
  },
  {
    id: "cardinal-mkt-hold-roll-1900",
    name: "Hold & Roll — 07:00 PM Window",
    trigger: { type: "schedule", cron: "5 19 * * *", timezone: "America/New_York" },
    action: async () => await rollPendingBatch("19:00", "09:00+1"),  // Next day 09:00
  },
];
```

### Support Functions

```javascript
async function getPendingBatch({ postTime }) {
  // Query content queue for a batch with:
  //   status = "pending" (at least one item pending)
  //   scheduled_post_time = postTime
  // Returns { id, items: [{ id, brand, platform, format, summary, draftedBy }], ... } or null
}

async function generateBatchVisualHtml(batch) {
  // Generate full-color HTML mockups for every content piece in the batch
  // Organized by brand section (Stone AI → Tools → Best AI → Mobile → Corporate)
  // Each piece gets platform-specific visual mockup (IG frame, X card, TikTok vertical, etc.)
  // Uses brand colors: Stone AI (#d4af37), Tools (#22d3ee), Best AI (#a78bfa), Mobile (#ec4899), Corporate (#f59e0b)
  // Reference: ad-batch-1-visual.html for established format
  // Returns file path to generated HTML
  const filePath = `./ad-batch-${batch.id}-visual.html`;
  await writeFile(filePath, renderBatchHtml(batch));
  return filePath;
}

async function sendBatchApprovalEmail({ batchId, htmlFile, scheduledTime, pieceCount }) {
  // Send via the established email delivery method:
  // npx tsx scripts/send-email.ts --to "3headedm@gmail.com" \
  //   --subject "[3HM] Ad Content Batch ${batchId} — ${pieceCount} Pieces Across All Brands — AWAITING APPROVAL" \
  //   --file "${htmlFile}"
  const { exec } = require('child_process');
  const subject = `[3HM] Ad Content Batch ${batchId} — ${pieceCount} Pieces Across All Brands — AWAITING APPROVAL`;
  exec(`npx tsx scripts/send-email.ts --to "3headedm@gmail.com" --subject "${subject}" --file "${htmlFile}"`);
}

async function rollPendingBatch(missedWindow, nextWindow) {
  const batch = await getPendingBatch({ postTime: missedWindow });
  if (!batch) return;
  batch.scheduledPostTime = nextWindow;
  batch.rollCount += 1;
  await updateBatchSchedule(batch);
  await logContentRoll(batch.id, missedWindow, nextWindow);
}

async function logApprovalReminder(batchId, timestamp) {
  // Append to ~/palace/logs/cardinal/marketing-approvals.jsonl
}

async function logContentRoll(batchId, fromWindow, toWindow) {
  // Append roll event to log
}
```

---

## 11. Visual Batch Email Format

The batch email is a **full HTML document** with visual mockups, NOT a simple text email. The established format (from Batch 1) uses:

### Design System

| Element | Value |
|---------|-------|
| Background | `#050508` (near-black) |
| Font stack | Inter, Playfair Display (headings), Space Grotesk (hero text), Raleway (masthead) |
| Stone AI brand color | `#d4af37` (gold) |
| Stone AI Tools color | `#22d3ee` (cyan) |
| Best AI color | `#a78bfa` (purple) |
| Best AI Mobile color | `#ec4899` (pink) |
| Corporate color | `#f59e0b` (amber) |
| Max width | 680px |

### Structure

```
[HEADER — "Stone Intelligence" masthead with gold border]
[TITLE — "Ad Content — Batch N"]
[STATUS — "X Visual Mockups | AWAITING APPROVAL"]

[BRAND SECTION — STONE AI]
  [Platform label — e.g., "INSTAGRAM — Carousel Post"]
  [Full visual mockup in platform frame — profile pic, username, content area, caption, hashtags]
  [Repeat for each platform...]

[BRAND SECTION — STONE AI TOOLS]
  [Same pattern...]

[BRAND SECTION — BEST AI]
  [Same pattern...]

[BRAND SECTION — BEST AI MOBILE]
  [Same pattern...]

[BRAND SECTION — STONE AI CORPORATE]
  [Same pattern...]

[BATCH SUMMARY TABLE — pieces per brand, platforms covered, total count]
[APPROVAL CTA — "Reply APPROVE, REJECT, or REQUEST CHANGES"]
[FOOTER — "Stone Intelligence · Three-Headed Monster · 2026"]
```

### Platform Mockup Styles

Each platform mockup is styled to look like the actual platform:
- **Instagram**: Black background, circular profile pic, carousel dots, caption with @handle, hashtags
- **Facebook**: Dark blue-gray, profile with avatar, link preview card, "Learn More" button
- **TikTok**: Vertical 9:16 format, black background, overlay text, @handle
- **Twitter/X**: `#15202b` background, avatar, verified badge, tweet text
- **LinkedIn**: Dark card, company logo, promoted badge, link preview
- **Threads**: `#181818` background, circular avatar, post text
- **Reddit**: `#1a1a1b` background, subreddit header, upvote count
- **Bluesky**: `#161920` background, avatar, handle
- **Discord**: `#36393f` background, embed with gold accent border
- **Product Hunt**: Launch card with upvote button, category tags
- **Pinterest**: Vertical infographic pin with category breakdown

### Reference File

The canonical template is `ad-batch-1-visual.html` (462 lines) in the stone-ai repo root. All future batches must follow this format.

---

## 12. Boundary Clarification

Per Cardinal's seed boundaries (cardinal-seeds.md):
- Cardinal does **NOT** execute marketing campaigns — that is the Marketing Strategist agent's domain.
- Cardinal **DOES** provide the approval gateway, reminder system, and logging infrastructure as part of its intelligence and systems architecture role.
- Cardinal acts as the **gatekeeper** between content creation and publication, ensuring the Founder retains final authority over all public-facing content.

### Workflow

```
Content Creation (parallel by head/agent):
  Stone drafts business/strategy/positioning posts
  Cardinal drafts technical/competitive intelligence posts
  Marketing Strategist handles brand voice, platform optimization, visual mockups
    ↓
All content assembled into a visual HTML batch (organized by brand)
    ↓
Batch enters approval queue (status: pending)
    ↓
Cardinal monitors the queue against posting windows
    ↓
1 hour before posting: Cardinal sends full visual HTML batch to 3headedm@gmail.com
    ↓
Founder reviews mockups in email — sees exactly what each ad looks like
    ↓
Founder responds: APPROVE / REJECT / REQUEST CHANGES
  → If APPROVE: Founder sends @STONE post batch [N] to execute
  → If REJECT: Content discarded, logged
  → If REQUEST CHANGES: Content returned to originating head/agent for revision
  → If NO RESPONSE: Content held, rolled to next window, new reminder sent
```

---

## 13. Rule Registry Integration

Add to the `AUTOMATION_RULES` array in email-automation-rules.md §10:

```javascript
const AUTOMATION_RULES = [
  // ... existing rules ...

  // Cardinal Marketing Approval Reminders
  ...contentApprovalReminderRules,
  ...contentHoldAndRollRules,
];
```

---

## 14. Batch 1 Reference (Established Precedent)

Batch 1 was the first content batch sent to the Founder on March 8, 2026:
- **38 content pieces** across 5 brands and all platforms
- **SMTP confirmed**: Message ID `<08d71962-f427-8320-6d40-ed26edf06827@gmail.com>` via `250 2.0.0 OK`
- **Visual HTML file**: `ad-batch-1-visual.html` (462 lines, full-color platform mockups)
- **Text backup**: `tmp-ad-proposal.txt` (161 lines, plain text version)
- **Subject line pattern**: `[3HM] Ad Content Batch 1 — 38 Pieces Across All Brands — AWAITING APPROVAL`
- **Delivery method**: `npx tsx scripts/send-email.ts --to "3headedm@gmail.com" --subject "..." --file "./ad-batch-1-visual.html"`

All future batches follow this precedent.

---

## 15. Enforcement Summary

| Rule | Enforcement |
|------|-------------|
| No content publishes without Founder approval | **ABSOLUTE — no override** |
| Reminder includes full visual HTML mockups | Founder must SEE what ads look like in color |
| Reminder sent 1 hour before posting window | Automated via cron schedule |
| Unapproved content rolls to next window | Automated via hold-and-roll rules |
| Content organized in batches by brand | 5 brands, each with distinct handles and platforms |
| All actions logged with SMTP message IDs | Append-only JSONL log |
| 3 heads contribute content, 1 gateway | Stone (strategy), Cardinal (intel), Marketing Strategist (brand voice) |
| Cardinal does not execute marketing — only gates it | Per cardinal-seeds.md boundaries |
| Email delivery via scripts/send-email.ts --file | Established in Batch 1 |
| Founder response parsed from email reply or @ command | Per D13 email command protocol |
| Execution via @STONE post batch [N] | Stone handles publishing after Founder approval |

---

*Cardinal Marketing Agent Reminder Protocol — Three-Headed Monster Palace Operations*
*Classification: PALACE INTERNAL | Version 1.1 | March 2026*
