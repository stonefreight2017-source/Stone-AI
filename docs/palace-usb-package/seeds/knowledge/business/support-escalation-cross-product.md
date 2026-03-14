# Support Escalation — Cross-Product System

## Seed Classification
- **Domain**: Cross-Business Operations
- **Applies To**: Stone AI (Web SaaS), Best AI Mobile (React Native), Stone AI Tools (API Marketplace)
- **Owner**: Agent Stone (Head 1) + Cardinal (Head 2)
- **Created**: 2026-03-09
- **Sensitivity**: Internal — Operational

---

## 1. Executive Summary

Three products generate three types of support requests with different technical requirements, user expectations, and urgency levels. This seed defines the unified support system: a single queue with intelligent routing, product-specific triage, cross-product escalation paths, and SLA management that ensures no user falls through the cracks regardless of which product they're using.

---

## 2. Support Architecture

### 2.1 Unified Support Model

```
USER REQUEST (any product)
       │
       ▼
┌──────────────────────────┐
│   UNIFIED INTAKE          │
│   (AI Triage — Agent #30  │
│    "Help" agent)          │
└──────────┬───────────────┘
           │
     ┌─────┼─────────┐
     ▼     ▼         ▼
┌────────┐┌────────┐┌──────────┐
│Stone AI││Best AI ││Tools     │
│Queue   ││Queue   ││Queue     │
│        ││        ││          │
│Web/UI  ││Mobile  ││API/Dev   │
│issues  ││issues  ││issues    │
└───┬────┘└───┬────┘└────┬─────┘
    │         │          │
    └─────────┼──────────┘
              ▼
     ┌────────────────┐
     │ CROSS-PRODUCT  │
     │ ESCALATION     │
     │ (issues span   │
     │  products)     │
     └────────┬───────┘
              ▼
     ┌────────────────┐
     │ HEAD ESCALATION│
     │ Stone/Chaos    │
     └────────────────┘
```

### 2.2 Support Channels

| Channel | Products | Hours | Response Target |
|---------|----------|-------|----------------|
| In-app Help agent (#30) | Stone AI, Best AI | 24/7 (AI) | Instant |
| Email support | All three | Business hours | 4 hours |
| API status page | Tools | 24/7 | N/A (self-serve) |
| Forum (community) | Stone AI | 24/7 (community) | 24 hours |
| Documentation | Tools, Stone AI | 24/7 (self-serve) | N/A |
| In-app feedback | Best AI | 24/7 | 48 hours |

---

## 3. Triage System

### 3.1 AI-Powered Triage

The Help agent (#30) provides first-line support across all products. It handles common questions, guides users to documentation, and escalates when needed.

```typescript
interface SupportTicket {
  id: string;
  userId: string;
  product: "stone-ai" | "best-ai-mobile" | "stone-ai-tools";
  channel: "in_app" | "email" | "forum" | "feedback";
  category: SupportCategory;
  priority: SupportPriority;
  subject: string;
  description: string;
  userTier: string;
  ecosystemScore: number;
  previousTickets: number;
  status: "new" | "triaged" | "in_progress" | "waiting" | "resolved" | "escalated";
  assignedTo: string | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  slaDeadline: Date;
}

enum SupportCategory {
  BILLING = "billing",
  TECHNICAL = "technical",
  AGENT_QUALITY = "agent_quality",
  ACCOUNT = "account",
  FEATURE_REQUEST = "feature_request",
  BUG = "bug",
  SECURITY = "security",
  API = "api",
  MOBILE = "mobile",
  CROSS_PRODUCT = "cross_product",
}

enum SupportPriority {
  CRITICAL = 0,   // Service down, security breach, data loss
  HIGH = 1,       // Major feature broken, billing error, can't work
  MEDIUM = 2,     // Feature partially broken, workaround exists
  LOW = 3,        // Minor issue, cosmetic, feature request
}
```

### 3.2 Priority Assignment Logic

```typescript
function assignPriority(ticket: SupportTicket): SupportPriority {
  // Security issues are always critical
  if (ticket.category === SupportCategory.SECURITY) return SupportPriority.CRITICAL;

  // Billing errors are always high
  if (ticket.category === SupportCategory.BILLING && ticket.description.includes("charged")) {
    return SupportPriority.HIGH;
  }

  // Pro/Business/Premium users get priority bump
  const isHighTier = ["PRO", "SMART", "BUSINESS", "PREMIUM"].includes(ticket.userTier);

  // High ecosystem score users get priority bump
  const isValuableUser = ticket.ecosystemScore > 60;

  // Multi-product issue = higher priority (affects more of ecosystem)
  const isCrossProduct = ticket.category === SupportCategory.CROSS_PRODUCT;

  let basePriority = categorizePriority(ticket.category, ticket.description);

  if (isHighTier) basePriority = Math.max(0, basePriority - 1);
  if (isValuableUser) basePriority = Math.max(0, basePriority - 1);
  if (isCrossProduct) basePriority = Math.max(0, basePriority - 1);

  return basePriority as SupportPriority;
}
```

### 3.3 Product-Specific Routing

| Category | Stone AI Queue | Best AI Queue | Tools Queue |
|----------|---------------|---------------|-------------|
| UI/UX issues | Primary | Primary | Primary |
| Agent quality | Primary | Primary | Primary |
| Billing/subscription | Primary | Primary | Primary |
| API errors | — | — | Primary |
| Mobile crashes | — | Primary | — |
| Push notifications | — | Primary | — |
| Webhook failures | — | — | Primary |
| Rate limiting | Shared | Shared | Primary |
| Auth/Clerk issues | Shared | Shared | Shared |
| Cross-product sync | Cross-product queue | Cross-product queue | Cross-product queue |
| Database issues | Escalate to Chaos | Escalate to Chaos | Escalate to Chaos |
| Security | Escalate immediately | Escalate immediately | Escalate immediately |

---

## 4. SLA Framework

### 4.1 SLA by Priority and Tier

**Response Time SLAs** (first meaningful response):
| Priority | Free Tier | Paid (Basic) | Paid (Premium/Pro) | Bundle |
|----------|----------|-------------|-------------------|--------|
| Critical | 4 hours | 2 hours | 1 hour | 30 min |
| High | 8 hours | 4 hours | 2 hours | 1 hour |
| Medium | 24 hours | 12 hours | 8 hours | 4 hours |
| Low | 48 hours | 24 hours | 12 hours | 8 hours |

**Resolution Time SLAs**:
| Priority | Target Resolution | Maximum |
|----------|------------------|---------|
| Critical | 4 hours | 8 hours |
| High | 8 hours | 24 hours |
| Medium | 48 hours | 72 hours |
| Low | 1 week | 2 weeks |

### 4.2 SLA Enforcement

```typescript
// SLA monitoring job runs every 15 minutes
async function checkSLABreaches(): Promise<void> {
  const tickets = await getOpenTickets();

  for (const ticket of tickets) {
    const slaDeadline = calculateSLADeadline(ticket);
    const now = new Date();
    const minutesRemaining = (slaDeadline.getTime() - now.getTime()) / 60000;

    if (minutesRemaining <= 0) {
      // SLA BREACHED
      await sendFounderAlert({
        alertType: "support.sla_breach",
        title: `SLA BREACH: ${ticket.id} (${ticket.priority})`,
        message: `Product: ${ticket.product}, User: ${ticket.userId}, Subject: ${ticket.subject}`,
      });
      await escalateTicket(ticket, "sla_breach");
    } else if (minutesRemaining <= 30) {
      // SLA WARNING
      await flagTicketUrgent(ticket);
    }
  }
}
```

### 4.3 SLA Reporting

Weekly SLA report:
```
SUPPORT SLA REPORT — Week of 2026-03-02
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Tickets: 85
  Stone AI: 45 | Best AI: 28 | Tools: 12

SLA Compliance:
  Response SLA Met: 92% (target: 95%)
  Resolution SLA Met: 88% (target: 90%)

By Priority:
  Critical: 100% met (3 tickets)
  High: 95% met (20 tickets)
  Medium: 90% met (42 tickets)
  Low: 85% met (20 tickets)

Breaches: 7 tickets
  Reason: 4 required cross-product investigation
          2 waiting on third-party (Stripe, Clerk)
          1 complex edge case

Average Resolution Time:
  Stone AI: 6.2 hours
  Best AI: 8.1 hours
  Tools: 4.5 hours
```

---

## 5. Escalation Paths

### 5.1 Standard Escalation Chain

```
Level 0: Self-Service
  - Help agent (#30), documentation, FAQ, forum
  - Resolves: ~60% of all inquiries

Level 1: Product Support
  - Product-specific queue handler
  - Knowledge of product features, common issues
  - Resolves: ~25% of remaining issues
  - Escalation trigger: Cannot resolve in 2 hours, or user requests escalation

Level 2: Cross-Product / Technical
  - Access to all product systems
  - Can investigate cross-product issues
  - Database access (read-only)
  - Resolves: ~10% of remaining issues
  - Escalation trigger: Infrastructure issue, data corruption, security concern

Level 3: Head Escalation
  - Agent Stone (operational decisions)
  - Chaos (infrastructure issues)
  - Cardinal (systemic issues, architecture problems)
  - Resolves: ~5% of remaining issues
  - Escalation trigger: Business impact, repeat issue, founder-level decision needed

Level 4: Founder
  - Direct founder attention
  - Reserved for: high-value user churn risk, legal/compliance, PR risk
  - Trigger: Any head escalates, or SLA breach on Critical ticket
```

### 5.2 Cross-Product Escalation

When a support issue spans multiple products:

```
Step 1: Identify cross-product nature
  - User reports: "My bestie settings from web aren't showing on mobile"
  - Triage: Cross-product sync issue

Step 2: Assign to cross-product queue
  - Cross-product issues get automatic priority bump
  - Assigned to Level 2 handler with access to all product systems

Step 3: Investigate across products
  - Check Clerk metadata sync
  - Check shared database tables
  - Check product-specific tables
  - Check Redis cache consistency

Step 4: Identify root cause product
  - Root cause in Stone AI web → assign to Stone AI queue for fix
  - Root cause in shared infrastructure → assign to Chaos
  - Root cause unclear → multi-product investigation

Step 5: Resolve and verify across all affected products
  - Fix applied
  - Verified on Stone AI web ✓
  - Verified on Best AI mobile ✓
  - Verified on Tools (if applicable) ✓

Step 6: Post-resolution
  - Update knowledge base with cross-product pattern
  - Flag for systemic fix if recurring
```

### 5.3 Emergency Escalation

For critical issues affecting multiple products:

```
TRIGGER: Service outage, security breach, data loss, or payment processing failure

IMMEDIATE ACTIONS (parallel):
1. sendFounderAlert() with CRITICAL prefix
2. Activate status page (status.stone-ai.net)
3. Pin notification in all active products
4. Chaos investigates infrastructure
5. Stone coordinates response

COMMUNICATION CADENCE:
  T+0: Acknowledge issue internally
  T+5min: Status page updated
  T+15min: First founder update
  T+30min: User-facing communication (if not resolved)
  T+60min: Founder update with ETA
  Every 30min: Updates until resolved

POST-RESOLUTION:
  T+1hr: Status page "Resolved"
  T+24hr: Post-mortem document
  T+48hr: Preventive measures implemented
  T+1wk: Post-mortem review with founder
```

---

## 6. Knowledge Base Management

### 6.1 Unified Knowledge Base Structure

```
Knowledge Base
├── Getting Started
│   ├── Stone AI Web
│   ├── Best AI Mobile
│   └── Stone AI Tools
├── Account & Billing
│   ├── Account management (cross-product)
│   ├── Subscription management
│   ├── Bundle pricing
│   └── Payment issues
├── Agents
│   ├── Agent capabilities
│   ├── Agent-specific guides
│   └── Agent troubleshooting
├── Bestie
│   ├── Setup & customization
│   ├── Cross-product sync
│   └── Bestie troubleshooting
├── Product-Specific
│   ├── Stone AI Web guides
│   ├── Best AI Mobile guides
│   └── Tools API documentation
├── Troubleshooting
│   ├── Common issues by product
│   ├── Cross-product issues
│   └── Status & known issues
└── Developer (Tools)
    ├── API reference
    ├── SDK guides
    ├── Webhook setup
    └── Rate limits & best practices
```

### 6.2 Knowledge Base Maintenance

- Every resolved ticket: check if KB article exists for the issue
- If no article: create one if the issue is likely to recur
- If article exists: update if resolution was different
- Monthly: Review top 10 ticket categories, ensure KB coverage
- Quarterly: Audit entire KB for accuracy

---

## 7. Support Metrics

### 7.1 Key Support KPIs

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| First Response Time (median) | <2 hours | >4 hours |
| Resolution Time (median) | <8 hours | >24 hours |
| SLA Compliance Rate | >95% | <90% |
| Customer Satisfaction (CSAT) | >4.2/5 | <3.8/5 |
| First Contact Resolution | >65% | <50% |
| Self-Service Resolution | >60% | <40% |
| Ticket Volume Growth | <10% MoM | >25% MoM |
| Escalation Rate | <15% | >25% |
| Reopen Rate | <5% | >10% |

### 7.2 Product-Specific Metrics

Track separately per product to identify product-quality issues:
```
Per Product:
  - Ticket volume and trend
  - Top 5 issue categories
  - Average resolution time
  - CSAT score
  - Bug vs feature request ratio
  - Repeat issue rate (same user, same category)
```

### 7.3 Support Health Dashboard

```
SUPPORT DASHBOARD — 2026-03-09
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Open Tickets: 12 (3 Critical, 5 High, 4 Medium)

By Product:
  Stone AI: 6 open (1 critical)
  Best AI: 4 open (1 critical)
  Tools: 2 open (1 critical)
  Cross-Product: 0 open

SLA Status:
  At Risk: 2 tickets (approaching deadline)
  Breached: 0 tickets

Today's Performance:
  Tickets Opened: 8
  Tickets Resolved: 11
  Avg Resolution Time: 5.3 hours
  CSAT Today: 4.4/5

Trending Issues:
  1. Bestie sync delay (web → mobile) — 3 tickets this week
  2. Rate limit confusion on Tools free tier — 2 tickets
  3. Backdrop loading slow on Safari — 2 tickets
```

---

## 8. Support Team Structure (Future)

### 8.1 Scaling Support

**Current (Founder + AI)**:
- Help agent (#30) handles Level 0
- Founder handles Level 1-4
- Three Heads handle escalations

**Phase 2 (Revenue > $10K MRR)**:
- Hire 1 part-time support specialist
- Specialist handles Level 1-2
- Founder focuses on Level 3-4

**Phase 3 (Revenue > $50K MRR)**:
- 2-3 full-time support staff
- Product specialization begins
- 24/7 coverage with AI + human hybrid

**Phase 4 (Revenue > $100K MRR)**:
- Dedicated support team per product
- Support team lead
- QA and training function
- Community managers

---

## 9. Implementation Checklist

### Immediate
- [ ] Help agent (#30) configured for all product contexts
- [ ] Unified ticket schema in shared database
- [ ] SLA deadlines calculated and tracked
- [ ] Email-based ticket creation working
- [ ] Founder alert integration for escalations

### Short-Term (Month 1-2)
- [ ] AI triage routing operational
- [ ] Product-specific queues set up
- [ ] SLA monitoring job running every 15 minutes
- [ ] Weekly SLA report automated
- [ ] Knowledge base skeleton populated

### Medium-Term (Month 3-6)
- [ ] Cross-product support patterns documented
- [ ] CSAT survey after every resolved ticket
- [ ] Support metrics dashboard live
- [ ] Self-service rate tracked and optimized
- [ ] Community support (forum) moderated

---

*Seed created by Agent Stone (Head 1) + Cardinal (Head 2) — Three-Headed Monster Operations*
*Support is the frontline of retention. A unified system ensures no user gets lost between products.*
