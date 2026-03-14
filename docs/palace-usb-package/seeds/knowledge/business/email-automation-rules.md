# Email Automation Rules — Palace Workflow Engine

## Classification: PALACE INTERNAL — All Heads & Royal Guards
## Version: 1.0 | Date: March 2026
## Owner: Executive Inbox Manager — Three-Headed Monster Operations

---

## 1. Automation Architecture

### 1.1 Rule Engine Overview

The Palace email automation engine processes events through a rule pipeline:

```
Event → Match Rules → Execute Actions → Log → Monitor
```

Every automation rule follows a standard structure:

```javascript
const rule = {
  id: "rule-001",
  name: "Deployment Alert",
  enabled: true,
  trigger: {
    type: "event",      // event | schedule | threshold | email_received
    source: "vercel",
    condition: (event) => event.type === "deployment.completed",
  },
  action: {
    type: "send_email",
    template: "operationalAlertTemplate",
    params: { severity: "info", title: "Deployment Complete" },
    priority: "P2",
  },
  rateLimit: {
    maxPerHour: 5,
    cooldownMinutes: 10,
  },
  schedule: null, // Only for schedule-type triggers
};
```

### 1.2 Rule Categories

| Category | Description | Example |
|----------|-------------|---------|
| **Scheduled** | Time-based triggers | Daily health report at 08:00 |
| **Event-driven** | System events | Deployment completed, error spike |
| **Threshold** | Metric crosses limit | Error rate > 5%, CPU > 90% |
| **Email-triggered** | Inbound email matches pattern | @ command received, founder reply |
| **Composite** | Multiple conditions AND/OR | Error spike AND founder not notified in 24h |

---

## 2. Scheduled Sends

### 2.1 Daily Status Report

```javascript
const dailyStatusRule = {
  id: "sched-daily-status",
  name: "Daily Status Report",
  trigger: {
    type: "schedule",
    cron: "0 8 * * *",        // 08:00 every day
    timezone: "America/New_York",
  },
  action: async () => {
    const health = await collectSystemHealth();
    const alerts = await getAlertsSince(24); // hours
    const metrics = await getDailyMetrics();

    await sendFounderAlert({
      alertType: "health.report",
      title: "DAILY STATUS",
      subject: `Daily Status — ${health.overall} — ${new Date().toLocaleDateString()}`,
      htmlBody: systemHealthTemplate({
        systems: health.systems,
        overallStatus: health.overall,
        uptime: health.uptime,
        alerts24h: alerts.length,
        activeUsers: metrics.activeUsers,
      }),
      fromName: "Palace Daily Status",
    });
  },
};
```

**Daily status collects:**
- All system health checks (Vercel, Neon DB, Clerk, Stripe, vLLM)
- Alert count from previous 24 hours
- Active user count
- Revenue snapshot
- Pending actions from yesterday

### 2.2 Weekly Review

```javascript
const weeklyReviewRule = {
  id: "sched-weekly-review",
  name: "Weekly Review Summary",
  trigger: {
    type: "schedule",
    cron: "0 18 * * 0",        // Sunday 18:00
    timezone: "America/New_York",
  },
  action: async () => {
    const weekStart = getWeekStart();
    const highlights = await getWeekHighlights(weekStart);
    const metrics = await getWeeklyMetrics(weekStart);
    const agentWork = await getAgentActivity(weekStart);
    const upcoming = await getUpcomingActions();

    await sendFounderAlert({
      alertType: "digest.weekly",
      title: "WEEKLY DIGEST",
      subject: `Weekly Digest — Week of ${weekStart.toLocaleDateString()}`,
      htmlBody: weeklyDigestTemplate({
        weekOf: weekStart.toLocaleDateString(),
        highlights,
        metrics,
        agentActivity: agentWork,
        upcomingActions: upcoming,
        issuesResolved: await getResolvedIssues(weekStart),
      }),
      fromName: "Palace Weekly Digest",
    });
  },
};
```

### 2.3 Monthly Reports

```javascript
const monthlyReportRule = {
  id: "sched-monthly-report",
  name: "Monthly Operations Report",
  trigger: {
    type: "schedule",
    cron: "0 10 1 * *",       // 1st of month at 10:00
    timezone: "America/New_York",
  },
  action: async () => {
    const lastMonth = getPreviousMonth();

    const report = {
      revenue: await getMonthlyRevenue(lastMonth),
      users: await getMonthlyUserGrowth(lastMonth),
      infrastructure: await getInfrastructureReport(lastMonth),
      agents: await getAgentPerformanceReport(lastMonth),
      seeds: await getSeedDeploymentReport(lastMonth),
      incidents: await getIncidentReport(lastMonth),
    };

    await sendFounderAlert({
      alertType: "digest.monthly",
      title: "MONTHLY REPORT",
      subject: `Monthly Report — ${lastMonth.name} ${lastMonth.year}`,
      htmlBody: monthlyReportTemplate(report),
      fromName: "Palace Monthly Operations",
    });
  },
};
```

### 2.4 Chaos Toys List (D14)

```javascript
const toysListRule = {
  id: "sched-chaos-toys",
  name: "Chaos Monthly Toys List",
  trigger: {
    type: "schedule",
    // Every 30 days from March 8, 2026
    // Approximated with cron: 8th of every month at 12:00
    cron: "0 12 8 * *",
    timezone: "America/New_York",
  },
  action: async () => {
    // Chaos compiles recommendations based on current hardware and needs
    const recommendations = await chaosCompileToysList();

    await sendFounderAlert({
      alertType: "seed.deliverable",
      title: "TOYS",
      subject: `${getCurrentMonth()} ${getCurrentYear()} — Hardware & Software Recommendations`,
      htmlBody: toysListTemplate({
        month: getCurrentMonth(),
        year: getCurrentYear(),
        items: recommendations,
        totalBudget: recommendations.reduce((sum, r) => sum + (typeof r.price === "number" ? r.price : 0), 0),
      }),
      fromName: "Chaos — Infrastructure Vanguard",
    });
  },
};
```

---

## 3. Trigger-Based Automations

### 3.1 Deployment Alerts

```javascript
const deploymentAlertRules = [
  {
    id: "trigger-deploy-success",
    name: "Deployment Success Alert",
    trigger: {
      type: "event",
      source: "vercel",
      condition: (event) => event.type === "deployment.completed" && event.state === "READY",
    },
    action: async (event) => {
      await sendFounderAlert({
        alertType: "ops.alert",
        title: "DEPLOY",
        subject: `Deployment Success — ${event.name} → ${event.url}`,
        htmlBody: operationalAlertTemplate({
          severity: "success",
          title: "Deployment Completed Successfully",
          description: `${event.name} has been deployed to ${event.url}`,
          details: `Build: ${event.buildId}\nCommit: ${event.gitCommit}\nDuration: ${event.buildDuration}s`,
          timestamp: new Date().toISOString(),
          source: "Vercel",
        }),
        fromName: "Palace Deployment Monitor",
      });
    },
    rateLimit: { maxPerHour: 10, cooldownMinutes: 2 },
  },
  {
    id: "trigger-deploy-fail",
    name: "Deployment Failure Alert",
    trigger: {
      type: "event",
      source: "vercel",
      condition: (event) => event.type === "deployment.completed" && event.state === "ERROR",
    },
    action: async (event) => {
      // Deployment failures are P0 — send immediately
      await sendFounderAlert({
        alertType: "ops.alert",
        title: "DEPLOY FAIL",
        subject: `DEPLOYMENT FAILED — ${event.name}`,
        htmlBody: operationalAlertTemplate({
          severity: "critical",
          title: "Deployment Failed",
          description: `Build failed for ${event.name}. Immediate attention required.`,
          details: `Build: ${event.buildId}\nError: ${event.errorMessage || "See Vercel dashboard"}\nCommit: ${event.gitCommit}`,
          timestamp: new Date().toISOString(),
          source: "Vercel",
        }),
        fromName: "Palace Deployment Monitor",
      });
    },
    rateLimit: { maxPerHour: 5, cooldownMinutes: 5 },
  },
];
```

### 3.2 Error Spike Detection

```javascript
const errorSpikeRule = {
  id: "trigger-error-spike",
  name: "Error Rate Spike Alert",
  trigger: {
    type: "threshold",
    metric: "error_rate_5min",
    threshold: 0.05,           // 5% error rate
    comparison: "greater_than",
    window: "5m",
    minSamples: 10,            // Need at least 10 requests to trigger
  },
  action: async (metric) => {
    await sendFounderAlert({
      alertType: "ops.alert",
      title: "ERROR SPIKE",
      subject: `Error Rate Spike — ${(metric.value * 100).toFixed(1)}% (threshold: 5%)`,
      htmlBody: operationalAlertTemplate({
        severity: "critical",
        title: `Error Rate: ${(metric.value * 100).toFixed(1)}%`,
        description: `Error rate has exceeded the 5% threshold over the last 5 minutes. ${metric.sampleCount} requests, ${metric.errorCount} errors.`,
        details: metric.topErrors?.map(e => `${e.count}x ${e.message}`).join("\n"),
        timestamp: new Date().toISOString(),
        source: "Error Rate Monitor",
      }),
      fromName: "Palace Error Monitor",
    });
  },
  rateLimit: { maxPerHour: 3, cooldownMinutes: 15 },
};
```

### 3.3 Revenue Milestone Alerts

```javascript
const revenueMilestoneRule = {
  id: "trigger-revenue-milestone",
  name: "Revenue Milestone Alert",
  trigger: {
    type: "threshold",
    metric: "monthly_revenue",
    milestones: [100, 500, 1000, 5000, 10000, 25000, 50000, 100000],
    comparison: "crosses",
  },
  action: async (metric) => {
    await sendFounderAlert({
      alertType: "revenue.alert",
      title: "MILESTONE",
      subject: `Revenue Milestone — $${metric.milestone.toLocaleString()} MRR Reached!`,
      htmlBody: revenueAlertTemplate({
        type: "milestone",
        amount: metric.currentMrr * 100,
        currency: "usd",
        event: `MRR crossed $${metric.milestone.toLocaleString()}`,
        mrr: metric.currentMrr,
        change: metric.changeFromLast,
      }),
      fromName: "Palace Revenue Monitor",
    });
  },
  rateLimit: { maxPerHour: 1, cooldownMinutes: 60 },
};
```

### 3.4 New Subscription / Churn Alerts

```javascript
const subscriptionRules = [
  {
    id: "trigger-new-sub",
    name: "New Subscription Alert",
    trigger: {
      type: "event",
      source: "stripe",
      condition: (event) => event.type === "customer.subscription.created",
    },
    action: async (event) => {
      const sub = event.data.object;
      await sendFounderAlert({
        alertType: "revenue.alert",
        title: "NEW SUB",
        subject: `New Subscription — ${sub.plan?.nickname || "Unknown Plan"}`,
        htmlBody: revenueAlertTemplate({
          type: "new_subscription",
          amount: sub.plan?.amount || 0,
          currency: sub.currency,
          customerEmail: sub.customer_email,
          plan: sub.plan?.nickname,
          event: "New Subscription Created",
        }),
        fromName: "Stripe Revenue Monitor",
      });
    },
    rateLimit: { maxPerHour: 20, cooldownMinutes: 1 },
  },
  {
    id: "trigger-churn",
    name: "Subscription Cancelled Alert",
    trigger: {
      type: "event",
      source: "stripe",
      condition: (event) => event.type === "customer.subscription.deleted",
    },
    action: async (event) => {
      const sub = event.data.object;
      await sendFounderAlert({
        alertType: "revenue.alert",
        title: "CHURN",
        subject: `Subscription Cancelled — ${sub.plan?.nickname || "Unknown Plan"}`,
        htmlBody: revenueAlertTemplate({
          type: "cancellation",
          amount: sub.plan?.amount || 0,
          currency: sub.currency,
          customerEmail: sub.customer_email,
          plan: sub.plan?.nickname,
          event: "Subscription Cancelled",
        }),
        fromName: "Stripe Revenue Monitor",
      });
    },
    rateLimit: { maxPerHour: 20, cooldownMinutes: 1 },
  },
];
```

---

## 4. Founder Command Auto-Routing (D13)

### 4.1 Command Processing Pipeline

When an email with an @ prefix subject line is detected:

```javascript
async function processFounderCommand(email) {
  const { agent, command, isKnownAgent } = email.parsedCommand;

  // Step 1: Log the command
  logCommand({
    uid: email.uid,
    agent,
    command,
    receivedAt: new Date(),
    status: "received",
  });

  // Step 2: Acknowledge receipt immediately
  await sendCommandAcknowledgment(agent, command);

  // Step 3: Mark original email as read
  await markAsRead(email.uid);

  // Step 4: Route to agent
  if (!isKnownAgent) {
    await sendFounderAlert({
      alertType: "ops.alert",
      title: "CMD ERROR",
      subject: `Unknown Agent — @${agent}`,
      htmlBody: operationalAlertTemplate({
        severity: "warning",
        title: `Unknown Agent: @${agent}`,
        description: `Command "${command}" was addressed to unknown agent "${agent}". Known agents: STONE, CARDINAL, CHAOS, WIZ, RUSH.`,
        timestamp: new Date().toISOString(),
        source: "Command Router",
      }),
      fromName: "Palace Command Router",
    });
    return;
  }

  // Step 5: Dispatch to agent handler
  const handler = AGENT_HANDLERS[agent];
  try {
    const result = await handler.handler(command);

    // Step 6: Report completion
    await sendFounderAlert({
      alertType: "command.ack",
      title: "CMD COMPLETE",
      subject: `@${agent} — Command Completed: ${command.substring(0, 50)}`,
      htmlBody: commandCompletionTemplate({ agent, command, result }),
      fromName: `${handler.name}`,
    });

    logCommand({ uid: email.uid, status: "completed", result });
  } catch (err) {
    // Step 6b: Report failure
    await sendFounderAlert({
      alertType: "ops.alert",
      title: "CMD FAILED",
      subject: `@${agent} — Command Failed: ${command.substring(0, 50)}`,
      htmlBody: operationalAlertTemplate({
        severity: "critical",
        title: `Command Failed: @${agent} ${command}`,
        description: err.message,
        details: err.stack,
        timestamp: new Date().toISOString(),
        source: `${handler.name}`,
      }),
      fromName: "Palace Command Router",
    });

    logCommand({ uid: email.uid, status: "failed", error: err.message });
  }
}
```

### 4.2 Informational vs Action Emails

Per D13: emails WITHOUT the @ prefix are informational — no action required.

```javascript
function isActionRequired(subject) {
  // @ prefix = command requiring action
  if (subject.match(/^@\w+/)) return true;

  // Everything else = informational
  return false;
}

async function processInboundEmail(email) {
  if (email.parsedCommand?.isCommand) {
    // This is an @ command — process it
    await processFounderCommand(email);
  } else if (email.isReply) {
    // This is a reply to a Palace email — extract and route
    await processFounderReply(email);
  } else {
    // Informational — log and move on
    logEmail({ uid: email.uid, type: "informational", subject: email.subject });
  }
}
```

---

## 5. Escalation Rules

### 5.1 Escalation Hierarchy

```
Level 1: Agent handles autonomously (within its scope)
Level 2: Stone reviews (agent reports inability or crosses 2 failures)
Level 3: Founder alerted (Stone can't resolve, or P0 event)
```

### 5.2 When to Alert Immediately (No Batching)

- **P0 events**: Any security breach, system down, payment processing failure
- **Founder @ commands**: Always immediate acknowledgment
- **Revenue loss events**: Failed charges > $50, churn of SMART/PRO tier
- **Data integrity issues**: Database errors, migration failures
- **Authentication failures**: Clerk down, OAuth errors affecting users

### 5.3 When to Batch

- **P2 deployment successes**: Batch hourly if multiple deploys
- **P3 informational**: Always batch into daily digest
- **Metric updates**: Only alert on threshold crosses, not regular updates
- **Agent task completions**: Batch into daily summary unless founder asked for status

### 5.4 Escalation Timing

```javascript
const ESCALATION_TIMERS = {
  P0: {
    initialAlert: 0,           // Immediate
    followUpIfNoAck: 15,       // 15 minutes — re-alert if no founder acknowledgment
    escalateExternal: 60,      // 60 minutes — consider SMS/phone (future)
  },
  P1: {
    initialAlert: 0,           // Immediate (within 15-min batch window)
    followUpIfNoAck: 60,       // 1 hour
    escalateExternal: null,    // Don't escalate beyond email
  },
  P2: {
    initialAlert: 60,          // Batch hourly
    followUpIfNoAck: null,     // Don't follow up
    escalateExternal: null,
  },
  P3: {
    initialAlert: "daily",     // Daily digest only
    followUpIfNoAck: null,
    escalateExternal: null,
  },
};
```

---

## 6. Quiet Hours Configuration

### 6.1 Default Quiet Hours

```javascript
const QUIET_HOURS = {
  enabled: true,
  start: "23:00",              // 11 PM local time
  end: "07:00",                // 7 AM local time
  timezone: "America/New_York",

  // P0 alerts ALWAYS bypass quiet hours
  bypassForP0: true,

  // During quiet hours, P1-P3 are queued for morning delivery
  queueLowerPriority: true,

  // Morning burst: all queued emails sent at this time
  morningDelivery: "07:15",

  // Weekend rules
  weekendQuietHours: {
    enabled: false,            // Founder works weekends — no extra quiet hours
    saturdayStart: null,
    sundayStart: null,
  },
};
```

### 6.2 Quiet Hours Implementation

```javascript
function isQuietHours() {
  if (!QUIET_HOURS.enabled) return false;

  const now = new Date();
  const localHour = now.getHours();
  const localMinute = now.getMinutes();
  const currentTime = localHour * 60 + localMinute;

  const [startH, startM] = QUIET_HOURS.start.split(":").map(Number);
  const [endH, endM] = QUIET_HOURS.end.split(":").map(Number);
  const startTime = startH * 60 + startM;
  const endTime = endH * 60 + endM;

  // Handle overnight range (e.g., 23:00 - 07:00)
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime < endTime;
  }
  return currentTime >= startTime && currentTime < endTime;
}

async function sendWithQuietHours(alertData) {
  if (alertData.priority === "P0" || !isQuietHours()) {
    // Send immediately
    await sendFounderAlert(alertData);
  } else {
    // Queue for morning delivery
    emailQueue.push({
      ...alertData,
      queuedAt: new Date(),
      deliverAfter: getNextMorningDelivery(),
    });
    console.log(`Queued email for morning delivery: ${alertData.subject}`);
  }
}
```

---

## 7. Rate Limiting

### 7.1 Global Rate Limits

```javascript
const RATE_LIMITS = {
  // Per hour maximums
  maxEmailsPerHour: 50,       // Gmail soft limit awareness
  maxP0PerHour: 10,           // Cap P0 to prevent alert fatigue
  maxPerRecipientPerHour: 30, // Per-recipient limit

  // Per window maximums
  maxInFiveMinutes: 5,        // Anti-burst protection
  maxPerDay: 200,             // Daily ceiling

  // Cooldown periods (minutes)
  sameTriggerCooldown: 10,    // Same trigger can't fire again for 10 min
  sameTemplateCooldown: 5,    // Same template type has 5-min cooldown

  // Deduplication
  dedupeWindow: 60,           // Don't send duplicate content within 60 min
};
```

### 7.2 Rate Limiter Implementation

```javascript
class EmailRateLimiter {
  constructor() {
    this.sentLog = [];        // { timestamp, alertType, subject, hash }
    this.triggerLog = new Map(); // triggerId -> last fire time
  }

  canSend(alertData) {
    const now = Date.now();
    this.cleanup(now);

    // Check global hourly limit
    const lastHour = this.sentLog.filter(e => now - e.timestamp < 3600000);
    if (lastHour.length >= RATE_LIMITS.maxEmailsPerHour) {
      console.warn("Rate limit: hourly maximum reached");
      return { allowed: false, reason: "hourly_limit" };
    }

    // Check 5-minute burst limit
    const lastFive = this.sentLog.filter(e => now - e.timestamp < 300000);
    if (lastFive.length >= RATE_LIMITS.maxInFiveMinutes) {
      console.warn("Rate limit: burst protection triggered");
      return { allowed: false, reason: "burst_limit" };
    }

    // Check deduplication
    const contentHash = hashContent(alertData.subject + alertData.htmlBody);
    const duplicate = this.sentLog.find(
      e => e.hash === contentHash && now - e.timestamp < RATE_LIMITS.dedupeWindow * 60000
    );
    if (duplicate) {
      console.warn("Rate limit: duplicate content detected");
      return { allowed: false, reason: "duplicate" };
    }

    // Check trigger cooldown
    if (alertData.triggerId) {
      const lastFire = this.triggerLog.get(alertData.triggerId);
      if (lastFire && now - lastFire < RATE_LIMITS.sameTriggerCooldown * 60000) {
        return { allowed: false, reason: "trigger_cooldown" };
      }
    }

    return { allowed: true };
  }

  record(alertData) {
    this.sentLog.push({
      timestamp: Date.now(),
      alertType: alertData.alertType,
      subject: alertData.subject,
      hash: hashContent(alertData.subject + alertData.htmlBody),
    });
    if (alertData.triggerId) {
      this.triggerLog.set(alertData.triggerId, Date.now());
    }
  }

  cleanup(now) {
    // Remove entries older than 24 hours
    this.sentLog = this.sentLog.filter(e => now - e.timestamp < 86400000);
  }
}

const rateLimiter = new EmailRateLimiter();
```

---

## 8. Priority Queue System

### 8.1 Queue Architecture

```
P0 → Immediate send (bypass queue)
P1 → 15-minute batch window
P2 → 60-minute batch window
P3 → Daily digest (batch until EOD)
```

### 8.2 Queue Implementation

```javascript
class PriorityEmailQueue {
  constructor() {
    this.queues = {
      P1: { items: [], flushInterval: 15 * 60 * 1000 },    // 15 min
      P2: { items: [], flushInterval: 60 * 60 * 1000 },    // 1 hour
      P3: { items: [], flushInterval: null },                // Manual flush (daily)
    };
    this.startTimers();
  }

  add(priority, emailData) {
    if (priority === "P0") {
      // P0: Immediate — bypass the queue entirely
      return this.sendImmediate(emailData);
    }
    this.queues[priority].items.push({
      ...emailData,
      queuedAt: new Date(),
    });
  }

  async sendImmediate(emailData) {
    const check = rateLimiter.canSend(emailData);
    if (!check.allowed) {
      console.warn(`P0 rate limited (${check.reason}) — forcing send anyway`);
      // P0 always sends, even if rate limited (founder safety)
    }
    await sendFounderAlert(emailData);
    rateLimiter.record(emailData);
  }

  async flush(priority) {
    const queue = this.queues[priority];
    if (queue.items.length === 0) return;

    if (queue.items.length === 1) {
      // Single item — send as-is
      await sendFounderAlert(queue.items[0]);
    } else {
      // Multiple items — send as batched digest
      await this.sendBatchDigest(priority, queue.items);
    }

    rateLimiter.record({ alertType: `batch.${priority}` });
    queue.items = [];
  }

  async sendBatchDigest(priority, items) {
    const itemSummaries = items.map(i => `
      <div style="background: #1a1a2e; border-left: 3px solid #4fc3f7; padding: 10px 14px; margin: 8px 0; border-radius: 0 6px 6px 0;">
        <div style="color: #e0e0e0; font-weight: 600;">${i.subject || i.title}</div>
        <div style="color: #888; font-size: 12px;">${new Date(i.queuedAt).toLocaleTimeString()}</div>
      </div>
    `).join("");

    await sendFounderAlert({
      alertType: `digest.${priority.toLowerCase()}`,
      title: `${priority} DIGEST`,
      subject: `${priority} Digest — ${items.length} Items`,
      htmlBody: `
        <div style="background: #111; border: 1px solid #333; border-radius: 10px; padding: 20px;">
          <h2 style="color: #4fc3f7; margin: 0 0 16px 0;">${priority} Alert Digest</h2>
          <p style="color: #888;">${items.length} alerts batched over the last ${priority === "P1" ? "15 minutes" : priority === "P2" ? "hour" : "day"}</p>
          ${itemSummaries}
        </div>
      `,
      fromName: "Palace Alert Digest",
    });
  }

  startTimers() {
    // P1: flush every 15 minutes
    setInterval(() => this.flush("P1"), this.queues.P1.flushInterval);

    // P2: flush every hour
    setInterval(() => this.flush("P2"), this.queues.P2.flushInterval);

    // P3 is flushed manually at daily digest time
  }

  async flushDailyDigest() {
    await this.flush("P3");
  }
}

const emailQueue = new PriorityEmailQueue();
```

---

## 9. Monitoring & Alerting on the Alert System Itself

### 9.1 Meta-Monitoring

The EIM must monitor its own health — if the alert system fails, the founder gets no alerts.

```javascript
const EIM_HEALTH = {
  lastSuccessfulSend: null,
  lastSuccessfulFetch: null,
  consecutiveFailures: 0,
  totalSent24h: 0,
  totalFetched24h: 0,
};

// If 3 consecutive sends fail, something is wrong
function checkEimHealth() {
  if (EIM_HEALTH.consecutiveFailures >= 3) {
    // Try alternative notification (console log, file write)
    console.error("EIM CRITICAL: 3 consecutive send failures. Email system may be down.");
    // Write to local file as fallback
    writeFileSync("/tmp/eim-alert.txt",
      `EIM DOWN at ${new Date().toISOString()}. ${EIM_HEALTH.consecutiveFailures} consecutive failures.`
    );
  }
}
```

### 9.2 Self-Healing

```javascript
async function eiSelfHeal() {
  // Test IMAP connection
  try {
    const client = new ImapFlow(IMAP_CONFIG);
    await client.connect();
    await client.logout();
    EIM_HEALTH.lastSuccessfulFetch = new Date();
  } catch (err) {
    console.error("IMAP self-heal: connection failed, will retry in 5 min");
  }

  // Test SMTP connection
  try {
    await transporter.verify();
    EIM_HEALTH.lastSuccessfulSend = new Date();
  } catch (err) {
    console.error("SMTP self-heal: verification failed");
    // Recreate transporter
    recreateTransporter();
  }
}

// Run self-heal every 30 minutes
setInterval(eiSelfHeal, 30 * 60 * 1000);
```

---

## 10. Rule Registry & Management

### 10.1 Complete Rule Registry

```javascript
const AUTOMATION_RULES = [
  // Scheduled
  dailyStatusRule,
  weeklyReviewRule,
  monthlyReportRule,
  toysListRule,

  // Event-driven
  ...deploymentAlertRules,
  ...subscriptionRules,

  // Threshold
  errorSpikeRule,
  revenueMilestoneRule,

  // Email-triggered
  commandProcessingRule,
  replyProcessingRule,
];

// Rule management
function enableRule(ruleId) {
  const rule = AUTOMATION_RULES.find(r => r.id === ruleId);
  if (rule) rule.enabled = true;
}

function disableRule(ruleId) {
  const rule = AUTOMATION_RULES.find(r => r.id === ruleId);
  if (rule) rule.enabled = false;
}

function listRules() {
  return AUTOMATION_RULES.map(r => ({
    id: r.id,
    name: r.name,
    enabled: r.enabled,
    type: r.trigger.type,
  }));
}
```

### 10.2 Adding Custom Rules

The founder can request new automation rules via @ command:

```
@STONE add alert rule: notify me when any user upgrades to PRO tier
```

Stone would then define the rule and submit it for founder approval before activating.

---

*Email Automation Rules — Three-Headed Monster Palace Operations*
*Classification: PALACE INTERNAL | Version 1.0 | March 2026*
