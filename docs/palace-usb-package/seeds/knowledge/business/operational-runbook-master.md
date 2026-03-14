# Operational Runbook — Master Cross-Product Operations

## Seed Classification
- **Domain**: Cross-Business Operations
- **Applies To**: Stone AI (Web SaaS), Best AI Mobile (React Native), Stone AI Tools (API Marketplace)
- **Owner**: Agent Stone (Head 1) + Chaos (Head 3)
- **Created**: 2026-03-09
- **Sensitivity**: Internal — Operational Critical

---

## 1. Executive Summary

This is the master runbook for operating three products day-to-day. It covers daily, weekly, and monthly operational checklists, incident response across products, deployment coordination, and the operational rhythms that keep the Three-Headed Monster running smoothly.

Every checklist item has an owner, a frequency, and a "done" condition. Nothing is assumed.

---

## 2. Daily Operations Checklist

### 2.1 Morning Startup (8:00 AM)

**Infrastructure Health Check** — Owner: Chaos / Automated
```
[ ] vLLM status: running, responding, queue depth < 5
[ ] Neon database: connected, query latency < 20ms
[ ] Redis: connected, memory < 80%, hit rate > 85%
[ ] Vercel: all three projects deployed, no error spikes
[ ] Cloudflare: DNS resolving, SSL valid, no attacks blocked overnight
[ ] Clerk: auth service responding, no unusual failure rate
[ ] Stripe: webhook processing, no failed payments overnight
```

**Product Health Check** — Owner: Stone / Automated
```
[ ] Stone AI (web): Homepage loads < 3s, login works, agent responds
[ ] Best AI (mobile API): Endpoint responds, auth works, agent responds
[ ] Stone AI Tools: API docs load, test endpoint responds, auth works
[ ] Cross-product: Clerk metadata sync verified on one test account
```

**Metrics Review** — Owner: Founder
```
[ ] Yesterday's revenue: any anomalies?
[ ] Yesterday's signups: on trend?
[ ] Error rate: any spikes overnight?
[ ] Support tickets: any critical unresolved?
[ ] Cloud AI spend: within budget?
```

### 2.2 Midday Check (12:00 PM)

```
[ ] vLLM queue depth (peak usage hours)
[ ] Support ticket backlog: anything stuck?
[ ] Deployment pipeline: any pending PRs needing review?
[ ] Cloud AI budget: daily burn rate on track?
```

### 2.3 End of Day (6:00 PM)

```
[ ] Open support tickets: prioritized for tomorrow
[ ] Deployment status: anything deployed today working correctly?
[ ] Overnight automation: ETL jobs scheduled, backups confirmed
[ ] Alerts configured: all monitoring active for overnight
```

---

## 3. Weekly Operations

### 3.1 Monday: Week Planning

**Strategic Review** — Owner: Stone + Founder
```
[ ] Review last week's metrics vs. targets
[ ] Identify top 3 priorities for the week
[ ] Check roadmap: what's shipping this week?
[ ] Support: any trending issues from last week?
[ ] Resource allocation: any product starved of attention?
```

### 3.2 Wednesday: Mid-Week Check

**Technical Review** — Owner: Chaos
```
[ ] Infrastructure performance: any degradation trends?
[ ] Database: query performance, connection pool health
[ ] vLLM: average latency trend, capacity utilization
[ ] Cloud AI: budget tracking (should be ~40-50% of weekly allocation)
[ ] Security: any suspicious activity in logs?
```

### 3.3 Friday: Week Wrap

**Operations Report** — Owner: Stone
```
[ ] Support SLA compliance: all tickets within SLA?
[ ] Deployment log: what shipped this week?
[ ] Incident log: any incidents? Post-mortems complete?
[ ] Agent quality: any quality alerts triggered?
[ ] Metrics summary: WoW trends for all three products
[ ] Next week preview: what's planned?
```

**Friday Deliverables**:
1. Weekly metrics email to founder via sendFounderAlert()
2. Agent performance flags (any agent below B grade)
3. Infrastructure capacity forecast for next week

---

## 4. Monthly Operations

### 4.1 First Week: Month-End Review

**Financial Review** — Owner: Stone + Founder
```
[ ] MRR calculation: actual vs. target, per product
[ ] Churn analysis: who churned, why, recoverable?
[ ] Subscription changes: upgrades, downgrades, cancellations
[ ] Cloud AI costs: actual vs. budget
[ ] Infrastructure costs: all bills reconciled
[ ] Revenue forecast: next month projection
```

**User Review**:
```
[ ] User growth: signups, activations, engaged users
[ ] Cross-product adoption: how many multi-product users?
[ ] Ecosystem score distribution: improving?
[ ] Cohort analysis: are recent cohorts retaining?
[ ] Support volume: trending up or down per 1000 users?
```

### 4.2 Second Week: Maintenance Window

**Infrastructure Maintenance** — Owner: Chaos
```
[ ] Database: VACUUM ANALYZE on high-write tables
[ ] Database: Review and create next month's partitions
[ ] Database: Index review — unused indexes, missing indexes
[ ] Redis: Memory audit — any namespace bloat?
[ ] vLLM: Model update check — new Qwen version available?
[ ] Vercel: Dependency updates — security patches
[ ] Cloudflare: Rule review — still appropriate?
[ ] SSL certificates: expiration check (Cloudflare manages, verify)
```

**Security Review** — Owner: Chaos + Computer Wiz
```
[ ] Dependency vulnerability scan (npm audit, Prisma)
[ ] API rate limit review — any abuse patterns?
[ ] Auth logs: unusual login patterns?
[ ] CSP headers: still appropriate?
[ ] Encryption: AES-256-GCM keys rotation (if policy requires)
```

### 4.3 Third Week: Optimization

**Performance Optimization** — Owner: Stone + Chaos
```
[ ] Slowest API routes: identify and optimize top 5
[ ] Database slow queries: review query logs
[ ] Cache hit rates: optimize caching strategy
[ ] Agent prompt optimization: reduce token usage on verbose agents
[ ] Bundle analysis: optimize JS/CSS bundles per product
```

### 4.4 Fourth Week: Planning

**Next Month Planning** — Owner: Stone + Founder
```
[ ] Roadmap review: priorities for next month
[ ] Resource allocation: any product needs more attention?
[ ] Budget review: adjust cloud AI budget if needed
[ ] Marketing: campaigns planned for next month
[ ] Hiring: support or engineering needs?
```

---

## 5. Incident Response

### 5.1 Incident Severity Levels

| Severity | Definition | Response Time | Who's Involved |
|----------|-----------|--------------|---------------|
| SEV-1 | Full outage (all products) or data breach | Immediate | Founder + All Heads |
| SEV-2 | One product fully down or payment system failure | 15 minutes | Founder + Chaos + Stone |
| SEV-3 | Feature degraded (slow performance, partial failure) | 1 hour | Chaos + Stone |
| SEV-4 | Minor issue (cosmetic, non-blocking) | Next business day | Assigned engineer |

### 5.2 Incident Response Procedure

**SEV-1: Critical Incident**
```
T+0: Detection (automated monitoring or user report)
  Action: Automated alert fires to founder + all heads

T+2min: Acknowledgment
  Action: Chaos acknowledges, begins investigation
  Action: Stone activates status page
  Action: Send initial user communication (if user-facing)

T+5min: Assessment
  Action: Chaos identifies scope (which products affected?)
  Action: Stone coordinates communication

T+10min: Triage
  Action: Determine if rollback needed
  Action: If deployment caused it → immediate rollback
  Action: If infrastructure → Chaos leads remediation
  Action: If external service (Clerk, Stripe) → escalate to provider

T+15min: First Update
  Action: Status page updated with details
  Action: Founder briefed with ETA

T+30min: Ongoing
  Action: Updates every 15 minutes until resolved
  Action: All hands working on resolution

Resolution:
  Action: Verify all products functional
  Action: Status page updated to "Resolved"
  Action: User communication sent (what happened, what we did)

Post-Incident (within 24 hours):
  Action: Post-mortem document created
  Action: Root cause identified
  Action: Preventive measures listed
  Action: Timeline reconstructed

Post-Mortem Review (within 1 week):
  Action: Review post-mortem with founder
  Action: Implement preventive measures
  Action: Update runbook if needed
```

**SEV-2: Major Incident**
```
Similar to SEV-1 but:
  - Response time: 15 minutes instead of immediate
  - Status page update: within 30 minutes
  - User communication: only if outage >30 minutes
  - Post-mortem: within 48 hours
```

**SEV-3: Degraded Service**
```
T+0: Detection
T+1hr: Assessment and owner assigned
T+4hr: Fix deployed or workaround communicated
T+24hr: Root cause documented
Post-incident: Brief note in weekly report
```

### 5.3 Incident Response Templates

**Status Page Update Template**:
```
[INVESTIGATING] We are aware of issues with [product/feature].
Our team is investigating. We will provide updates every [X] minutes.

[IDENTIFIED] We have identified the cause of [product/feature] issues.
A fix is being implemented. ETA: [time].

[MONITORING] A fix has been deployed for [product/feature].
We are monitoring for stability. Users may experience [brief description].

[RESOLVED] [Product/feature] is fully operational.
Root cause: [brief explanation].
We apologize for the disruption.
```

**Founder Alert Template**:
```typescript
await sendFounderAlert({
  alertType: "incident.sev1",
  title: "[SEV-1] Full platform outage — all products",
  message: `
    Detected: ${timestamp}
    Affected: Stone AI, Best AI, Tools
    Symptoms: ${description}
    Status: ${currentStatus}
    Next update: ${nextUpdateTime}
    Investigating: Chaos
  `,
});
```

---

## 6. Deployment Coordination

### 6.1 Deployment Types

| Type | Products | Approval | Rollback |
|------|----------|----------|---------|
| Hotfix (critical bug) | Single product | Founder | Immediate |
| Feature deploy | Single product | Founder | Same day |
| Cross-product deploy | Multiple products | Founder | Staged |
| Infrastructure change | All products | Founder + Chaos | Immediate |
| Database migration | All products | Founder + Chaos | Pre-tested |

### 6.2 Deployment Windows

**Preferred**: Tuesday-Thursday, 10 AM - 2 PM (lowest user traffic)
**Avoid**: Friday after 2 PM, weekends, holidays
**Emergency**: Any time, but with full team aware

### 6.3 Cross-Product Deployment Procedure

When a change affects multiple products (shared infrastructure, database schema, Clerk config):

```
PRE-DEPLOYMENT:
  1. [ ] Change documented: what, why, which products affected
  2. [ ] Neon branch created: pre-migration backup
  3. [ ] Rollback plan documented: step-by-step rollback
  4. [ ] All products tested in staging/preview
  5. [ ] Founder approved

DEPLOYMENT:
  6. [ ] Deploy to Stone AI Tools first (lowest traffic)
  7. [ ] Monitor 15 minutes: error rate, latency, functionality
  8. [ ] If OK → Deploy to Stone AI (primary product)
  9. [ ] Monitor 30 minutes: thorough check
  10. [ ] If OK → Deploy to Best AI Mobile API
  11. [ ] Monitor 15 minutes
  12. [ ] All products verified functional

POST-DEPLOYMENT:
  13. [ ] Monitor for 2 hours: any delayed issues?
  14. [ ] Support queue: any related tickets?
  15. [ ] Deployment logged in weekly report
```

### 6.4 Database Migration Protocol

```
1. Create Neon branch: pre-migrate-{migration-name}
2. Run migration on branch → verify
3. Run migration on staging → verify
4. Schedule maintenance window (if breaking change)
5. Run migration on production
6. Verify all products functional
7. Keep pre-migrate branch for 7 days
8. Delete after 7 days if no issues
```

---

## 7. Monitoring & Alerting Configuration

### 7.1 Monitoring Stack

```
Health Checks: Custom (API endpoint pings)
  - Frequency: 30 seconds
  - Endpoints: /, /api/health per product
  - Alert: 2 consecutive failures

Error Tracking: Vercel built-in + custom logging
  - Capture: 5xx errors, unhandled exceptions
  - Alert: >5 errors in 5 minutes

Performance: Custom metrics to analytics schema
  - Track: response time, queue depth, cache hit rate
  - Alert: P95 > 5 seconds sustained

Infrastructure: vLLM metrics API + system metrics
  - Track: GPU utilization, VRAM, queue depth, throughput
  - Alert: utilization > 90% for 10 minutes
```

### 7.2 Alert Routing

```typescript
const alertRouting = {
  // Infrastructure alerts → Chaos
  "vllm.*": { channel: "email", recipients: ["founder", "chaos"] },
  "database.*": { channel: "email", recipients: ["founder", "chaos"] },
  "redis.*": { channel: "email", recipients: ["founder"] },

  // Product alerts → Stone
  "stone-ai.error_rate": { channel: "email", recipients: ["founder", "stone"] },
  "best-ai.error_rate": { channel: "email", recipients: ["founder", "stone"] },
  "tools.error_rate": { channel: "email", recipients: ["founder", "stone"] },

  // Security alerts → Everyone
  "security.*": { channel: "email", recipients: ["founder", "chaos", "stone", "wiz"] },

  // Revenue alerts → Founder direct
  "revenue.*": { channel: "email", recipients: ["founder"] },
  "stripe.*": { channel: "email", recipients: ["founder"] },

  // Support alerts → Stone
  "support.sla_breach": { channel: "email", recipients: ["founder", "stone"] },
};
```

### 7.3 On-Call Schedule

**Current (single founder)**:
- Founder is always on-call
- Automated monitoring provides early detection
- Three Heads + Royal Guard available via dispatch

**Future (team > 3)**:
- Weekly rotation
- Primary on-call: handles SEV-1 and SEV-2
- Secondary on-call: handles SEV-3 and SEV-4
- Escalation to founder for SEV-1 only

---

## 8. Backup & Recovery Operations

### 8.1 Backup Schedule

| What | Frequency | Retention | Location | Verification |
|------|-----------|-----------|----------|-------------|
| Neon database | Continuous (Neon) | 30 days | Neon (managed) | Weekly restore test |
| Neon branch snapshots | Daily | 7 days | Neon | Auto-verified |
| Redis snapshot | Every 6 hours | 48 hours | Local + cloud | Weekly |
| vLLM model files | On change | 2 versions | OMEN local | Monthly |
| Vercel project config | On deploy | Unlimited (git) | GitHub | Continuous |
| Environment variables | On change | Git history | Encrypted repo | Monthly |
| Clerk config | On change | Clerk manages | Clerk (managed) | Quarterly |

### 8.2 Recovery Procedures

**Database Recovery**:
```
1. Identify point-in-time to recover to
2. Create recovery branch in Neon from that point
3. Verify data on recovery branch
4. If full restore needed: point all products to recovery branch
5. If partial restore: extract needed data and merge into main
```

**Redis Recovery**:
```
1. Redis data is cache — can be rebuilt from database
2. Restart Redis with latest snapshot
3. Warm critical caches (sessions, rate limits)
4. Monitor cache hit rate during rebuild
5. Full warm-up takes ~30 minutes
```

**vLLM Recovery**:
```
1. Restart vLLM service on OMEN
2. If model corrupted: re-download from HuggingFace cache
3. If hardware issue: cloud fallback automatic (Anthropic)
4. Chaos diagnoses hardware, repairs OMEN
5. Restart vLLM, verify inference quality
```

---

## 9. Operational Metrics

### 9.1 Operational Health Dashboard

```
OPERATIONAL HEALTH — 2026-03-09
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Uptime (30 day):
  Stone AI:    99.97%  ●
  Best AI:     99.93%  ●
  Tools:       99.99%  ●

Incidents (this month):
  SEV-1: 0 | SEV-2: 0 | SEV-3: 1 | SEV-4: 3

Deployments (this week):
  Stone AI: 4 | Best AI: 2 | Tools: 1

Support:
  Open tickets: 8 | SLA compliance: 94%
  CSAT: 4.3/5

Infrastructure:
  vLLM: 72% utilization
  Database: 35/50 connections
  Redis: 2.6GB/4GB
  Cloud AI: $89/$200 budget used
```

---

## 10. Runbook Maintenance

### 10.1 Runbook Review Schedule

| Review | Frequency | Owner | Focus |
|--------|-----------|-------|-------|
| Checklist accuracy | Monthly | Stone | Are all items still relevant? |
| Incident procedures | After every SEV-1/SEV-2 | Chaos | Did procedures work? |
| Contact information | Quarterly | Stone | All contacts current? |
| Tool access | Quarterly | Chaos | All access working? |
| Full runbook audit | Semi-annually | Stone + Founder | Complete review |

### 10.2 Runbook Update Protocol

When updating this runbook:
1. Document what changed and why
2. Get founder approval for significant changes
3. Notify relevant heads (Stone, Chaos)
4. Update version number and date
5. Archive previous version

---

*Seed created by Agent Stone (Head 1) + Chaos (Head 3) — Three-Headed Monster Operations*
*Operations is what keeps three products running while you sleep. Every checklist item exists because someone forgot it once.*
