# Executive Inbox Manager — Full Operational Manual

## Classification: PALACE INTERNAL — All Heads & Royal Guards
## Version: 1.0 | Date: March 2026
## Owner: Executive Inbox Manager (EIM) — Three-Headed Monster Operations

---

## 1. EIM Mission Statement

The Executive Inbox Manager is the Palace's communication nerve center. Every email that enters or leaves the Palace passes through the EIM's classification, routing, and tracking pipeline. The EIM ensures the founder receives actionable intelligence — not noise — and that every Palace agent can send alerts, receive commands, and maintain communication discipline.

The EIM operates on one principle: **the founder's attention is the scarcest resource in the Palace. Guard it.**

---

## 2. System Architecture

### 2.1 Technical Stack

```
┌─────────────────────────────────────────────┐
│              Palace Email System             │
├──────────────┬──────────────────────────────┤
│   OUTBOUND   │          INBOUND             │
│  (Nodemailer)│        (ImapFlow)            │
│              │                              │
│  Gmail SMTP  │       Gmail IMAP             │
│  Port 587    │       Port 993              │
│  TLS/STARTTLS│       TLS                   │
├──────────────┴──────────────────────────────┤
│        Shared Credentials                    │
│  Account: 3headedm@gmail.com                │
│  Auth: App Password (16-char)               │
│  Both sender AND receiver                   │
└─────────────────────────────────────────────┘
```

### 2.2 Core Dependencies

```javascript
// Outbound (sending alerts)
import nodemailer from "nodemailer";

// Inbound (reading emails)
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
```

### 2.3 Connection Configuration

```javascript
// IMAP (Inbound)
const IMAP_CONFIG = {
  host: "imap.gmail.com",
  port: 993,
  secure: true,
  auth: {
    user: "3headedm@gmail.com",
    pass: "<APP_PASSWORD>", // 16-char Google App Password
  },
  logger: false,
};

// SMTP (Outbound)
const SMTP_CONFIG = {
  service: "gmail",
  auth: {
    user: "3headedm@gmail.com",
    pass: "<APP_PASSWORD>",
  },
};
```

### 2.4 Credential Security

- App Password is a 16-character Google-issued credential (no spaces when stored in code)
- Stored in environment variables for production: `PALACE_EMAIL_PASS`
- Never committed to git repositories
- Rotation: every 90 days or immediately if compromised
- The App Password grants IMAP/SMTP access only — it cannot change account settings, reset passwords, or access Google Cloud services

---

## 3. Email Triage — Priority Classification System

### 3.1 Priority Levels

| Priority | Color | Label | SLA | Description |
|----------|-------|-------|-----|-------------|
| **P0** | RED | URGENT | Immediate | @ commands, security alerts, system down, revenue impact |
| **P1** | YELLOW | IMPORTANT | < 15 min | Founder replies to Palace Intel, escalated issues |
| **P2** | CYAN | NORMAL | < 1 hour | Regular correspondence, status updates |
| **P3** | GRAY | INFO | Daily digest | Newsletters, informational, no action required |

### 3.2 Classification Algorithm

```javascript
function classifyPriority(email) {
  const subject = (email.subject || "").toLowerCase();
  const from = (email.from || "").toLowerCase();

  // P0: @ commands from founder (D13 protocol)
  if (email.parsedCommand?.isCommand) return "P0";

  // P0: Security-related keywords
  if (subject.includes("security") || subject.includes("breach") || subject.includes("urgent")) return "P0";

  // P0: Revenue-impacting
  if (subject.includes("payment failed") || subject.includes("stripe") && subject.includes("error")) return "P0";

  // P1: Replies to Palace emails
  if (email.isReply && from.includes("3headedm")) return "P1";

  // P1: Known important senders
  if (from.includes("clerk") || from.includes("vercel") || from.includes("neon")) return "P1";

  // P2: Regular Palace correspondence
  if (from.includes("3headedm") || from.includes("stone")) return "P2";

  // P3: Everything else
  return "P3";
}
```

### 3.3 Triage Decision Tree

```
Email arrives →
  ├─ Has @ prefix in subject? → P0 (route to agent)
  ├─ Contains security keywords? → P0 (alert founder immediately)
  ├─ Is "Re:" to Palace Intel? → P1 (extract founder directive)
  ├─ From infrastructure provider? → P1 (may need action)
  ├─ From Palace email address? → P2 (internal ops)
  └─ Everything else → P3 (batch into daily digest)
```

---

## 4. Inbound Processing Pipeline

### 4.1 Pipeline Stages

```
Raw Email → Parse → Classify → Extract → Route → Acknowledge → Track
```

**Stage 1: Parse**
- Connect via IMAP, fetch message source
- Parse with `mailparser` to extract structured data
- Extract: Date, From, To, Subject, Body (plain + HTML), Attachments, Message-ID, In-Reply-To

**Stage 2: Classify**
- Apply priority classification (Section 3)
- Detect email type: command, reply, alert, informational
- Tag with metadata: isReply, isCommand, parsedCommand, priority

**Stage 3: Extract**
- For commands: parse agent name and command body
- For replies: strip quoted content, extract founder's actual text
- For alerts: extract severity, affected system, error details

**Stage 4: Route**
- Commands → target agent's processing queue
- Replies → context-aware response handler
- Alerts → priority-based notification system

**Stage 5: Acknowledge**
- P0 commands: immediate acknowledgment email
- P1 replies: processed confirmation within 15 minutes
- P2/P3: no acknowledgment (would create noise)

**Stage 6: Track**
- Log every processed email: timestamp, priority, action taken, resolution status
- Thread tracking: link related emails into conversation threads

### 4.2 IMAP Connection Patterns

```javascript
// Pattern: One-shot fetch (connect, fetch, disconnect)
async function fetchEmails(query) {
  const client = new ImapFlow(IMAP_CONFIG);
  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      // ... fetch operations ...
    } finally {
      lock.release(); // ALWAYS release the lock
    }
    await client.logout();
  } catch (err) {
    console.error("IMAP Error:", err.message);
    try { await client.logout(); } catch {}
  }
}
```

**Critical IMAP rules:**
1. Always acquire and release mailbox locks
2. Always logout after operations (even on error)
3. Never leave connections open — Gmail has a 15-connection limit per account
4. Use UID-based operations (not sequence numbers) for reliable message identification
5. Fetch only what you need: don't download full source if you only need headers

### 4.3 Email Body Extraction

```javascript
// Strip HTML to plain text
function stripHtml(html) {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .trim();
}

// Extract founder's reply (strip quoted original)
function extractReplyText(text) {
  const lines = text.split("\n");
  const replyLines = [];
  for (const line of lines) {
    // Stop at "On ... wrote:" or "> " quoted lines
    if (/^On .+ wrote:$/i.test(line.trim())) break;
    if (/^-{5,}\s*(Forwarded|Original)/i.test(line.trim())) break;
    if (line.trim().startsWith(">")) continue;
    replyLines.push(line);
  }
  return replyLines.join("\n").trim();
}
```

### 4.4 Search Operations

```javascript
// Search for unseen (unread) messages
const unseenUids = await client.search({ seen: false });

// Search for messages from a specific sender
const fromUids = await client.search({ from: "stone@example.com" });

// Search by date range
const recentUids = await client.search({
  since: new Date("2026-03-01"),
  before: new Date("2026-03-10"),
});

// Combined search
const urgentUnread = await client.search({
  seen: false,
  subject: "URGENT",
});

// Search for flagged/starred messages
const flaggedUids = await client.search({ flagged: true });
```

---

## 5. Outbound Processing Pipeline

### 5.1 Alert Types

| Alert Type | Template | Trigger | Recipient | Frequency |
|------------|----------|---------|-----------|-----------|
| `palace.intel` | Dark header, gold accent | Strategic briefing | Founder | As needed |
| `ops.alert` | Severity-colored header | System event | Founder | Immediate for P0 |
| `seed.deliverable` | Report format | Seed completion | Founder | Per batch |
| `health.report` | Dashboard style | Scheduled | Founder | Daily |
| `revenue.alert` | Green/red indicators | Revenue event | Founder | Immediate |
| `security.alert` | Red header, bold | Security event | Founder | Immediate |
| `diagnostic.report` | Technical detail | Wiz assessment | Founder | On request |
| `command.ack` | Minimal confirmation | @ command received | Founder | Immediate |
| `toys.list` | Product catalog | 30-day cycle | Founder | Monthly |
| `digest.daily` | Summary format | End of day | Founder | Daily |
| `digest.weekly` | Summary format | End of week | Founder | Weekly |

### 5.2 sendFounderAlert() — Core Outbound Function

```javascript
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "3headedm@gmail.com",
    pass: "<APP_PASSWORD>",
  },
});

/**
 * Send an alert to the founder.
 * @param {Object} options
 * @param {string} options.alertType - One of the alert types above
 * @param {string} options.title - Subject line prefix in brackets
 * @param {string} options.subject - Full subject line
 * @param {string} options.htmlBody - Complete HTML email body
 * @param {string} options.fromName - Display name for From field
 * @param {string[]} [options.attachments] - Optional file attachments
 */
async function sendFounderAlert({ alertType, title, subject, htmlBody, fromName, attachments }) {
  const fullSubject = `[${title}] ${subject}`;

  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <3headedm@gmail.com>`,
      to: "3headedm@gmail.com",
      subject: fullSubject,
      html: htmlBody,
      attachments: attachments || [],
    });

    console.log(`Alert sent: ${fullSubject}`);
    console.log(`MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`Failed to send alert: ${err.message}`);
    return { success: false, error: err.message };
  }
}
```

### 5.3 Formatting Standards

**Subject line format:**
```
[CATEGORY] Description — Optional Context
```

Examples:
- `[PALACE INTEL] Batch 22 Capabilities Report — Executive Inbox Manager`
- `[SECURITY] Unauthorized Login Attempt — Rush Alert`
- `[TOYS] March 2026 Hardware & Software Recommendations — Chaos`
- `[OPS] Daily Health Report — All Systems Nominal`

**From name format:**
```
"Agent Name — Role" <3headedm@gmail.com>
```

Examples:
- `"Stone & Cardinal — Palace Intelligence" <3headedm@gmail.com>`
- `"Chaos — Infrastructure Vanguard" <3headedm@gmail.com>`
- `"Computer Wiz — Diagnostics" <3headedm@gmail.com>`
- `"Rush — Security Operations" <3headedm@gmail.com>`

### 5.4 Rate Limiting Rules

- Maximum 50 emails per hour (Gmail SMTP limit consideration)
- P0 alerts: send immediately, no batching
- P1 alerts: send within 15 minutes, can batch 2-3 related alerts
- P2 alerts: batch into hourly digest if more than 3 pending
- P3 alerts: always batch into daily digest
- Never send more than 5 emails in a 5-minute window (anti-spam)
- If rate limit approached, queue lower-priority emails for next window

---

## 6. Command Parsing — D13 Protocol Implementation

### 6.1 Command Format

Per Directive D13:
```
Subject: @AGENT ACTION — details
```

- `@` prefix = this is a command requiring action
- No `@` prefix = informational, no action needed
- Agent name is CASE-INSENSITIVE
- Everything after agent name is the command body

### 6.2 Recognized Agents

| Agent | Role | Command Examples |
|-------|------|------------------|
| `@STONE` | Head 1 — Strategy | `@STONE escalate billing bug`, `@STONE review agent performance` |
| `@CARDINAL` | Head 2 — Intelligence | `@CARDINAL research competitor X`, `@CARDINAL analyze market Y` |
| `@CHAOS` | Head 3 — Infrastructure | `@CHAOS check server status`, `@CHAOS deploy update` |
| `@WIZ` | Royal Guard — Diagnostics | `@WIZ run health check`, `@WIZ diagnose slow queries` |
| `@RUSH` | Royal Guard — Security | `@RUSH scan for vulnerabilities`, `@RUSH check SSH tunnels` |

### 6.3 Command Parser Implementation

```javascript
const COMMAND_AGENTS = ["STONE", "CARDINAL", "CHAOS", "WIZ", "RUSH"];

function parseCommand(subject) {
  if (!subject) return { isCommand: false };

  const match = subject.match(/^@(\w+)\s+(.*)/i);
  if (!match) return { isCommand: false };

  const agentName = match[1].toUpperCase();
  const command = match[2].trim();

  return {
    isCommand: true,
    agent: agentName,
    command,
    requiresAction: true,
    isKnownAgent: COMMAND_AGENTS.includes(agentName),
    warning: !COMMAND_AGENTS.includes(agentName)
      ? `Unknown agent "${agentName}"`
      : undefined,
  };
}
```

### 6.4 Command Processing Flow

```
Email with @ subject arrives →
  1. Parse command (extract agent + action)
  2. Validate agent name against known roster
  3. If unknown agent → log warning, still process
  4. Classify as P0 (immediate processing)
  5. Send acknowledgment: "Command received: @AGENT action"
  6. Route to target agent's handler
  7. Agent processes and reports result
  8. Send completion report to founder
```

### 6.5 Command Acknowledgment Template

```javascript
async function acknowledgeCommand(parsedCommand, originalEmail) {
  const ackHtml = `
    <div style="font-family: sans-serif; background: #111; color: #e0e0e0; padding: 20px;">
      <h2 style="color: #4fc3f7;">Command Received</h2>
      <p><strong>Agent:</strong> ${parsedCommand.agent}</p>
      <p><strong>Command:</strong> ${parsedCommand.command}</p>
      <p><strong>Status:</strong> Processing...</p>
      <p style="color: #888; font-size: 12px;">
        Received: ${new Date().toISOString()} |
        Original UID: ${originalEmail.uid}
      </p>
    </div>
  `;

  await sendFounderAlert({
    alertType: "command.ack",
    title: "CMD ACK",
    subject: `@${parsedCommand.agent} — Command Acknowledged`,
    htmlBody: ackHtml,
    fromName: "Palace Command Router",
  });
}
```

---

## 7. Reply Detection & Directive Extraction

### 7.1 Identifying Founder Replies

The founder replies to Palace Intel briefings via the same Gmail account. Detection:

1. Subject starts with "Re:" (case-insensitive)
2. In-Reply-To header references a Palace-sent Message-ID
3. Body contains quoted Palace Intel content

### 7.2 Reply Text Extraction

Gmail wraps the original email in a quoted block. The EIM must strip this to get the founder's actual words:

```
Founder's actual reply text     ← EXTRACT THIS
                                ← blank line
On Mon, Mar 9, 2026 at ...     ← STOP HERE
> Original Palace Intel         ← IGNORE
> content continues             ← IGNORE
```

Extraction patterns to detect end of reply:
- `On <date> <sender> wrote:` — Gmail format
- `---------- Forwarded message ----------` — Forward indicator
- Lines starting with `>` — Quoted content
- `From:` / `To:` / `Date:` / `Subject:` headers in body — Outlook format

### 7.3 Directive Detection in Replies

After extracting the reply text, scan for actionable content:

```javascript
function detectDirectives(replyText) {
  const directives = [];
  const lines = replyText.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    // Direct commands: "Do X", "Build X", "Fix X", "Change X"
    if (/^(do|build|fix|change|add|remove|update|deploy|check|run|stop|start)/i.test(trimmed)) {
      directives.push({ type: "command", text: trimmed });
    }

    // Approval: "Approved", "Yes", "Go ahead", "Ship it"
    if (/^(approved|yes|go ahead|ship it|do it|proceed|green light)/i.test(trimmed)) {
      directives.push({ type: "approval", text: trimmed });
    }

    // Rejection: "No", "Don't", "Stop", "Hold"
    if (/^(no|don't|stop|hold|wait|pause|cancel|reject)/i.test(trimmed)) {
      directives.push({ type: "rejection", text: trimmed });
    }

    // Question: ends with "?"
    if (trimmed.endsWith("?")) {
      directives.push({ type: "question", text: trimmed });
    }
  }

  return directives;
}
```

---

## 8. Auto-Response Rules

### 8.1 What Gets Auto-Acknowledged

| Trigger | Auto-Response | Delay |
|---------|--------------|-------|
| @ command received | "Command received, processing..." | Immediate |
| Founder reply to P0 alert | "Reply received, acting on it" | Immediate |
| New deployment alert from Vercel | "Deployment noted, monitoring" | 5 min |

### 8.2 What Needs Human Review

| Trigger | Action | Why |
|---------|--------|-----|
| Founder asks a question | Queue for agent response | Questions need thoughtful answers |
| Founder rejects a recommendation | Escalate to Stone | Need strategy adjustment |
| Unknown sender emails the address | Log but don't respond | Could be spam or external |
| Attachment received | Log, don't auto-process | Security: never auto-execute attachments |

### 8.3 Auto-Response Template

```javascript
async function autoAcknowledge(email, message) {
  if (email.priority === "P3") return; // Never auto-reply to P3

  await sendFounderAlert({
    alertType: "command.ack",
    title: "ACK",
    subject: `Re: ${email.subject}`,
    htmlBody: `
      <div style="font-family: sans-serif; background: #111; color: #ccc; padding: 16px;">
        <p>${message}</p>
        <p style="color: #666; font-size: 11px;">Auto-acknowledged by EIM at ${new Date().toISOString()}</p>
      </div>
    `,
    fromName: "Executive Inbox Manager",
  });
}
```

---

## 9. Email Threading & Context Preservation

### 9.1 Thread Tracking

Gmail naturally threads emails via Message-ID and In-Reply-To headers. The EIM maintains a thread map:

```javascript
// Thread tracking structure
const threadMap = new Map();

// When sending an email:
const info = await transporter.sendMail({
  from: "...",
  to: "...",
  subject: "[PALACE INTEL] Topic",
  html: "...",
  messageId: `palace-${Date.now()}@3headedm.gmail.com`, // Custom Message-ID
});

threadMap.set(info.messageId, {
  subject: "[PALACE INTEL] Topic",
  sentAt: new Date(),
  alertType: "palace.intel",
  expectsReply: true,
});

// When receiving a reply:
// Check parsed.inReplyTo against threadMap
if (threadMap.has(parsed.inReplyTo)) {
  const thread = threadMap.get(parsed.inReplyTo);
  // This reply is in response to our Palace Intel briefing
  // Route accordingly
}
```

### 9.2 Conversation Context

For multi-turn conversations (founder replies, EIM responds, founder replies again), maintain context:

```javascript
const conversationContext = {
  threadId: "palace-123@3headedm.gmail.com",
  topic: "Batch 22 Deployment",
  messages: [
    { direction: "outbound", timestamp: "...", summary: "Sent batch 22 report" },
    { direction: "inbound", timestamp: "...", summary: "Founder approved with notes" },
    { direction: "outbound", timestamp: "...", summary: "Acknowledged, deploying" },
  ],
  status: "awaiting_confirmation",
};
```

---

## 10. Scheduling — Digest & Batch Operations

### 10.1 Scheduled Reports

| Report | Schedule | Content |
|--------|----------|---------|
| **Daily Health** | 08:00 local | System status, overnight alerts, pending actions |
| **Daily Digest** | 20:00 local | All P2/P3 events, summary of P0/P1 actions taken |
| **Weekly Summary** | Sunday 18:00 | Week's highlights, metrics, upcoming actions |
| **Monthly Review** | 1st of month | KPIs, revenue, infrastructure health, agent performance |
| **Toys List** | Every 30 days | Chaos hardware/software recommendations (D14) |

### 10.2 Implementing Schedules

For a Node.js service running continuously (future state):

```javascript
import { CronJob } from "cron";

// Daily health report at 8 AM
new CronJob("0 8 * * *", async () => {
  await sendDailyHealthReport();
}, null, true, "America/New_York");

// Daily digest at 8 PM
new CronJob("0 20 * * *", async () => {
  await sendDailyDigest();
}, null, true, "America/New_York");

// Weekly summary on Sundays at 6 PM
new CronJob("0 18 * * 0", async () => {
  await sendWeeklySummary();
}, null, true, "America/New_York");
```

For current CLI-based operation (run manually or via Task Scheduler on Windows):

```batch
@echo off
:: Schedule in Windows Task Scheduler
:: Action: cmd /c "node C:\Users\stone\stone-ai\inbox-manager.mjs --check"
:: Trigger: Every hour, starting at 8:00 AM
```

### 10.3 Alert Batching

```javascript
const alertQueue = {
  P0: [], // Never batched — send immediately
  P1: [], // Batch window: 15 minutes
  P2: [], // Batch window: 1 hour
  P3: [], // Batch window: until daily digest
};

function queueAlert(priority, alert) {
  if (priority === "P0") {
    sendImmediately(alert);
    return;
  }
  alertQueue[priority].push(alert);
}

// Flush P1 every 15 minutes
setInterval(() => {
  if (alertQueue.P1.length > 0) {
    sendBatchedAlerts("P1", alertQueue.P1);
    alertQueue.P1 = [];
  }
}, 15 * 60 * 1000);

// Flush P2 every hour
setInterval(() => {
  if (alertQueue.P2.length > 0) {
    sendBatchedAlerts("P2", alertQueue.P2);
    alertQueue.P2 = [];
  }
}, 60 * 60 * 1000);
```

---

## 11. Integration with Three-Headed Monster

### 11.1 Routing Commands to Correct Head

```javascript
const AGENT_HANDLERS = {
  STONE: {
    name: "Agent Stone (Head 1 — The Owner)",
    handles: ["escalate", "review", "prioritize", "optimize", "strategy", "decision"],
    handler: async (command) => {
      // Stone handles strategy, escalation, optimization
      console.log(`[STONE] Processing: ${command}`);
    },
  },
  CARDINAL: {
    name: "Cardinal (Head 2 — The Architect)",
    handles: ["research", "analyze", "investigate", "compare", "model", "forecast"],
    handler: async (command) => {
      // Cardinal handles intelligence, analysis, architecture
      console.log(`[CARDINAL] Processing: ${command}`);
    },
  },
  CHAOS: {
    name: "Chaos (Head 3 — The Vanguard, Agent #44)",
    handles: ["deploy", "server", "gpu", "docker", "network", "infrastructure", "toys"],
    handler: async (command) => {
      // Chaos handles infrastructure, hardware, networking
      console.log(`[CHAOS] Processing: ${command}`);
    },
  },
  WIZ: {
    name: "Computer Wiz (Royal Guard — Diagnostician)",
    handles: ["diagnose", "health", "performance", "memory", "disk", "process"],
    handler: async (command) => {
      // Wiz handles diagnostics, health checks, clearance reports
      console.log(`[WIZ] Processing: ${command}`);
    },
  },
  RUSH: {
    name: "Rush (Royal Guard — Network Penetration)",
    handles: ["scan", "vulnerability", "ssh", "tunnel", "firewall", "packet", "pentest"],
    handler: async (command) => {
      // Rush handles security testing, network operations
      console.log(`[RUSH] Processing: ${command}`);
    },
  },
};

async function routeCommand(parsedCommand) {
  const handler = AGENT_HANDLERS[parsedCommand.agent];
  if (!handler) {
    console.warn(`No handler for agent: ${parsedCommand.agent}`);
    return;
  }

  console.log(`Routing to ${handler.name}: "${parsedCommand.command}"`);
  await handler.handler(parsedCommand.command);
}
```

### 11.2 Cross-Head Communication

When a command affects multiple heads:
1. Parse the command scope
2. Identify primary owner (the @ agent)
3. Primary owner leads; others support
4. Each head reports independently to founder (D10)
5. EIM consolidates into a unified briefing

Example: `@CHAOS deploy update` might require:
- Chaos: handles the actual deployment
- Wiz: runs post-deployment health check
- Stone: reviews deployment impact on business metrics

The EIM coordinates this by sending the primary command to Chaos, then triggering follow-up checks with Wiz and Stone after Chaos reports completion.

---

## 12. Gmail IMAP/SMTP Technical Reference

### 12.1 Gmail App Password Setup

1. Go to Google Account > Security > 2-Step Verification (must be enabled)
2. At bottom of 2-Step Verification page, click "App passwords"
3. Select app: "Mail" / Device: "Other (Custom)" — name it "Palace EIM"
4. Google generates a 16-character password (shown with spaces, store without)
5. This password works for BOTH IMAP and SMTP

### 12.2 IMAP Settings

| Setting | Value |
|---------|-------|
| Server | imap.gmail.com |
| Port | 993 |
| Security | TLS (implicit) |
| Auth | PLAIN (user + app password) |
| Mailboxes | INBOX, [Gmail]/Sent Mail, [Gmail]/Drafts, [Gmail]/Trash, [Gmail]/Spam |

### 12.3 SMTP Settings

| Setting | Value |
|---------|-------|
| Server | smtp.gmail.com |
| Port | 587 (STARTTLS) or 465 (implicit TLS) |
| Security | STARTTLS (port 587) |
| Auth | PLAIN (user + app password) |
| Daily limit | ~500 emails/day for free accounts |

### 12.4 Gmail Label Mapping

Gmail labels map to IMAP folders:

```javascript
// Accessing different mailboxes
await client.getMailboxLock("INBOX");          // Primary inbox
await client.getMailboxLock("[Gmail]/Sent Mail"); // Sent items
await client.getMailboxLock("[Gmail]/Drafts");    // Drafts
await client.getMailboxLock("[Gmail]/Trash");     // Trash
await client.getMailboxLock("[Gmail]/Spam");      // Spam

// Custom labels appear as top-level folders
await client.getMailboxLock("Palace");           // Custom "Palace" label
await client.getMailboxLock("Palace/Commands");  // Nested label
```

### 12.5 Connection Limits

- Gmail allows 15 simultaneous IMAP connections per account
- Each ImapFlow instance = 1 connection
- ALWAYS disconnect after use: `await client.logout()`
- Connection timeout: ~30 minutes idle before Gmail drops it
- Reconnection pattern: catch errors, wait 5 seconds, reconnect

---

## 13. Error Handling & Resilience

### 13.1 Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `AUTHENTICATIONFAILED` | Wrong password or 2FA issue | Regenerate app password |
| `ECONNREFUSED` | Can't reach Gmail | Check internet, firewall |
| `ENOTFOUND` | DNS resolution failed | Check DNS settings |
| `Too many connections` | >15 IMAP connections | Close unused connections |
| `FETCH failed` | Message deleted during fetch | Skip and continue |
| `Connection timed out` | Network issue or Gmail overload | Retry with backoff |

### 13.2 Retry Pattern

```javascript
async function withRetry(fn, maxRetries = 3, delayMs = 5000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      console.error(`Attempt ${attempt}/${maxRetries} failed: ${err.message}`);
      if (attempt === maxRetries) throw err;
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }
}

// Usage
const emails = await withRetry(() => checkInbox(10));
```

### 13.3 Graceful Degradation

If IMAP is unavailable:
1. Log the failure with timestamp
2. Queue outbound alerts (SMTP may still work)
3. Retry every 5 minutes for 1 hour
4. After 1 hour: send P0 alert via SMTP: "IMAP connection lost — inbound email processing suspended"
5. Continue retrying every 15 minutes
6. When restored: process all accumulated unread emails

---

## 14. Nodemailer Patterns for Rich HTML Emails

### 14.1 Transport Configuration

```javascript
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: "3headedm@gmail.com", pass: "<APP_PASSWORD>" },
  pool: true,           // Reuse connections for multiple sends
  maxConnections: 3,    // Limit concurrent connections
  maxMessages: 10,      // Max messages per connection before reconnect
  rateLimit: 5,         // Max 5 messages per second
});

// Verify connection on startup
transporter.verify((err, success) => {
  if (err) console.error("SMTP verify failed:", err.message);
  else console.log("SMTP ready to send");
});
```

### 14.2 Sending with Attachments

```javascript
await transporter.sendMail({
  from: '"Palace Operations" <3headedm@gmail.com>',
  to: "3headedm@gmail.com",
  subject: "[REPORT] Weekly Summary",
  html: "<h1>Weekly Report</h1>...",
  attachments: [
    {
      filename: "report.pdf",
      path: "/path/to/report.pdf",
    },
    {
      filename: "metrics.json",
      content: JSON.stringify(metricsData, null, 2),
      contentType: "application/json",
    },
    {
      filename: "logo.png",
      path: "/path/to/logo.png",
      cid: "logo@palace", // Reference in HTML as <img src="cid:logo@palace">
    },
  ],
});
```

### 14.3 HTML Email Best Practices

- Use inline CSS (no external stylesheets — email clients strip `<link>` tags)
- Use tables for layout (flexbox/grid not supported in many email clients)
- Keep total email size under 102KB (Gmail clips larger emails)
- Test with Litmus or Email on Acid for cross-client rendering
- Always provide plain text fallback
- Use web-safe fonts: Arial, Helvetica, Georgia, Times New Roman
- Inline images via CID or use hosted URLs (data URIs blocked by many clients)

---

## 15. Monitoring & Operational Health

### 15.1 Health Check Script

```javascript
async function eiHealthCheck() {
  const results = {
    imap: false,
    smtp: false,
    timestamp: new Date().toISOString(),
  };

  // Test IMAP
  try {
    const client = new ImapFlow(IMAP_CONFIG);
    await client.connect();
    await client.logout();
    results.imap = true;
  } catch (err) {
    results.imapError = err.message;
  }

  // Test SMTP
  try {
    await transporter.verify();
    results.smtp = true;
  } catch (err) {
    results.smtpError = err.message;
  }

  return results;
}
```

### 15.2 Metrics to Track

- Emails processed per day (inbound)
- Emails sent per day (outbound)
- Average processing latency (time from receive to route)
- Error rate (failed connections, failed sends)
- P0 response time (target: < 60 seconds)
- Command success rate (commands received vs commands completed)
- Thread tracking accuracy (replies matched to original threads)

---

## 16. Future Enhancements

### 16.1 Phase 2: Gmail API (OAuth2)
- Replace IMAP with Gmail API for push notifications
- Real-time webhook when new email arrives (no polling)
- Better label management (auto-label by category)
- Richer search with Gmail's query language

### 16.2 Phase 3: Multi-Channel
- SMS notifications for P0 alerts (Twilio)
- Push notifications via mobile app (Best AI)
- Slack/Discord integration for team alerts
- Voice alerts via text-to-speech for critical events

### 16.3 Phase 4: AI-Powered Triage
- Use Qwen 2.5 (local vLLM) to classify emails
- Natural language command parsing (no @ prefix needed)
- Sentiment analysis on founder replies
- Auto-draft responses for common queries
- Predictive routing based on email content

---

## Appendix A: Complete CLI Reference

```
Usage: node inbox-manager.mjs [command]

Commands:
  --check [N]        Fetch latest N emails (default: 10)
  --unread           Fetch only unread emails
  --commands         Find @ prefix commands (D13 protocol)
  --replies          Find founder replies to Palace Intel
  --mark-read UID    Mark email as read by UID
  --mark-unread UID  Mark email as unread by UID
  --help             Show help

Priority Classification:
  P0 (RED)    — @ commands, security alerts, urgent
  P1 (YELLOW) — Founder replies to Palace Intel
  P2 (CYAN)   — Regular correspondence
  P3 (GRAY)   — Informational, newsletters
```

## Appendix B: Quick Start

```bash
# Install dependencies
npm install imapflow mailparser nodemailer

# Check inbox
node inbox-manager.mjs --check

# Check for unread
node inbox-manager.mjs --unread

# Find commands
node inbox-manager.mjs --commands

# Find replies
node inbox-manager.mjs --replies

# Mark as read
node inbox-manager.mjs --mark-read 42
```

## Appendix C: Integration with sendFounderAlert()

The inbox-manager.mjs exports all functions for use by other Palace scripts:

```javascript
import { checkInbox, findCommands, findReplies, getUnread, markAsRead } from "./inbox-manager.mjs";

// Check for new commands
const commands = await findCommands(20);
for (const cmd of commands) {
  console.log(`@${cmd.parsedCommand.agent}: ${cmd.parsedCommand.command}`);
  await markAsRead(cmd.uid);
}
```

---

*Executive Inbox Manager — Three-Headed Monster Operations*
*Classification: PALACE INTERNAL | Version 1.0 | March 2026*
