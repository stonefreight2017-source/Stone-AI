# Resource Allocation Framework — Multi-Product Operations

## Seed Classification
- **Domain**: Cross-Business Operations
- **Applies To**: Stone AI (Web SaaS), Best AI Mobile (React Native), Stone AI Tools (API Marketplace)
- **Owner**: Agent Stone (Head 1) + Cardinal (Head 2)
- **Created**: 2026-03-09
- **Sensitivity**: Internal — Strategic

---

## 1. Executive Summary

Three products competing for one founder's time, limited engineering resources, and a finite marketing budget. This seed defines how to allocate resources across Stone AI, Best AI Mobile, and Stone AI Tools at each stage of growth, with clear prioritization frameworks and decision criteria for when to shift resources between products.

---

## 2. Resource Categories

### 2.1 Founder Time

The scarcest resource. Cannot be scaled without delegation.

**Weekly Time Budget (60 hours/week)**:
```
Strategic thinking & decisions:  10 hours (non-delegatable)
Product development oversight:   15 hours (partially delegatable)
Marketing & growth:               8 hours (delegatable to agents)
Support & operations:             5 hours (delegatable to agents)
Admin & business ops:             5 hours (partially delegatable)
Learning & research:              5 hours (non-delegatable)
Buffer / emergencies:             7 hours
Cross-product coordination:       5 hours
```

### 2.2 Engineering Capacity

Measured in "effort points" per week. Currently founder + AI agents.

**Weekly Capacity**: ~40 effort points
```
Complex tasks (new features, architecture): 3 points each
Simple tasks (bug fixes, UI tweaks): 1 point each
Modify tasks (updates to existing): 2 points each
Research/investigation: 1-2 points each
```

### 2.3 Marketing Budget

Monthly marketing budget scales with revenue.

**Budget Rule**: Marketing spend = 20-30% of MRR
```
At $5K MRR:  $1,000-1,500/month
At $10K MRR: $2,000-3,000/month
At $25K MRR: $5,000-7,500/month
At $50K MRR: $10,000-15,000/month
```

### 2.4 Infrastructure Budget

Fixed + variable costs. See shared-infrastructure-management.md for details.

```
Fixed: ~$150/month (Vercel, domains, basic services)
Variable: $100-700/month (cloud AI, scaling)
Total: $250-850/month (current)
```

---

## 3. Allocation by Growth Stage

### 3.1 Stage 1: Stone AI Only (Current)

**100% focus on Stone AI until stable product-market fit.**

```
Founder Time:
  Stone AI:  90%
  Best AI:   5% (planning only)
  Tools:     5% (planning only)

Engineering:
  Stone AI:  95%
  Best AI:   5% (architecture decisions)
  Tools:     0%

Marketing:
  Stone AI:  100%
  Best AI:   0%
  Tools:     0%
```

**Exit Criteria for Stage 1**:
- [ ] Stone AI MRR > $5,000
- [ ] Monthly churn < 5%
- [ ] 500+ active users
- [ ] Core features stable (agents, bestie, billing, forum)
- [ ] Support volume manageable (<20 tickets/week)

### 3.2 Stage 2: Stone AI + Tools Launch (~Week 18)

**Stone AI is primary revenue. Tools launches to capture developer market.**

```
Founder Time:
  Stone AI:  60%
  Best AI:   10% (development begins)
  Tools:     25%
  Cross-product: 5%

Engineering:
  Stone AI:  50% (maintenance + growth features)
  Tools:     40% (launch features)
  Best AI:   10% (foundation)

Marketing:
  Stone AI:  70%
  Tools:     30% (developer marketing: docs, GitHub, DevRel)
  Best AI:   0%
```

**Exit Criteria for Stage 2**:
- [ ] Tools launched with API docs, auth, rate limiting
- [ ] 100+ developer signups on Tools
- [ ] Stone AI MRR > $8,000
- [ ] Best AI MVP scope defined and architectured

### 3.3 Stage 3: All Three Products (~Week 24-30)

**All products live. Shift to balanced growth.**

```
Founder Time:
  Stone AI:  40%
  Best AI:   25%
  Tools:     20%
  Cross-product: 15%

Engineering:
  Stone AI:  35%
  Best AI:   35% (launch + early iteration)
  Tools:     20%
  Cross-product: 10%

Marketing:
  Stone AI:  50%
  Best AI:   30%
  Tools:     20%
```

**Exit Criteria for Stage 3**:
- [ ] All three products live and stable
- [ ] Combined MRR > $15,000
- [ ] Multi-product users > 10%
- [ ] Bundle pricing launched

### 3.4 Stage 4: Ecosystem Optimization (Month 9+)

**Products stable. Focus shifts to cross-product and optimization.**

```
Founder Time:
  Stone AI:  30%
  Best AI:   20%
  Tools:     15%
  Cross-product: 25%
  Strategic: 10%

Engineering:
  Stone AI:  30%
  Best AI:   25%
  Tools:     20%
  Cross-product: 25%

Marketing:
  Stone AI:  40%
  Best AI:   30%
  Tools:     20%
  Cross-product: 10% (bundle, ecosystem campaigns)
```

---

## 4. Prioritization Framework

### 4.1 The RICE-E Framework (RICE + Ecosystem Impact)

Modified RICE framework that accounts for cross-product impact:

```
Score = (Reach × Impact × Ecosystem × Confidence) / Effort

Reach: How many users does this affect? (1-10)
Impact: How much does it improve their experience? (1-10)
Ecosystem: Does this benefit multiple products? (1x single, 1.5x two, 2x all three)
Confidence: How sure are we this will work? (0.5 low, 0.8 medium, 1.0 high)
Effort: Engineer-weeks to complete (1-10)
```

**Example Prioritization**:
| Task | Reach | Impact | Ecosystem | Confidence | Effort | Score |
|------|-------|--------|-----------|-----------|--------|-------|
| Shared auth (Clerk multi-product) | 10 | 8 | 2.0 | 1.0 | 3 | 53.3 |
| Mobile push notifications | 4 | 6 | 1.0 | 0.8 | 2 | 9.6 |
| API rate limiting | 6 | 7 | 1.0 | 1.0 | 2 | 21.0 |
| Bundle pricing page | 8 | 9 | 2.0 | 0.8 | 4 | 28.8 |
| Forum dark mode | 3 | 3 | 1.0 | 1.0 | 1 | 9.0 |
| Cross-product bestie sync | 7 | 8 | 2.0 | 0.8 | 5 | 17.9 |

### 4.2 Decision Matrix: Where to Invest Next

When deciding between investing in Product A vs Product B:

```
1. Which product has higher marginal revenue potential?
   (Revenue per effort point invested)

2. Which product is closest to a key milestone?
   (Don't leave products 90% done)

3. Which product's users are most at risk?
   (Churn prevention > new features)

4. Which investment has cross-product benefits?
   (Shared infrastructure > product-specific features)

5. Which product has competitive pressure?
   (React to competitor moves when necessary)
```

### 4.3 Anti-Patterns to Avoid

**Peanut Buttering**: Spreading resources so thin that nothing ships.
```
Rule: No product gets less than 15% of engineering time.
If you can't afford 15% on a product, don't launch it yet.
```

**Shiny Object Syndrome**: Constantly shifting to the newest product.
```
Rule: The primary revenue product (Stone AI) never drops below 30% of resources
until another product contributes >30% of revenue.
```

**Perfection Paralysis**: Waiting for one product to be "perfect" before starting the next.
```
Rule: "Good enough to launch" is 80% of features working well.
The remaining 20% ships in the first month post-launch.
```

**Revenue Chasing**: Over-investing in the product with the most revenue at the expense of growth products.
```
Rule: Allocate based on FUTURE revenue potential, not just current revenue.
Best AI and Tools need investment now to generate revenue later.
```

---

## 5. Marketing Budget Allocation

### 5.1 Channel Allocation by Product

**Stone AI (Web)**:
| Channel | % of Budget | Monthly ($1K budget) | Purpose |
|---------|------------|---------------------|---------|
| Content/SEO | 30% | $300 | Long-term organic growth |
| Google Ads | 25% | $250 | Targeted acquisition |
| Social Media | 20% | $200 | Brand awareness |
| Referral Program | 15% | $150 | Word-of-mouth |
| PR/Product Hunt | 10% | $100 | Launch moments |

**Best AI (Mobile)**:
| Channel | % of Budget | Monthly ($500 budget) | Purpose |
|---------|------------|----------------------|---------|
| App Store Optimization | 25% | $125 | Organic discovery |
| Apple Search Ads | 30% | $150 | Targeted mobile acquisition |
| Social (TikTok/Instagram) | 25% | $125 | Visual demos |
| Influencer | 15% | $75 | Trust + reach |
| Cross-sell (organic) | 5% | $25 | Existing user conversion |

**Stone AI Tools (API)**:
| Channel | % of Budget | Monthly ($300 budget) | Purpose |
|---------|------------|----------------------|---------|
| Developer content | 35% | $105 | Blog posts, tutorials |
| GitHub/open source | 25% | $75 | SDK, examples, sponsorships |
| Developer communities | 20% | $60 | Reddit, HN, Discord |
| Documentation | 15% | $45 | Best-in-class docs |
| Conference/meetups | 5% | $15 | Networking |

### 5.2 CAC Targets by Product

| Product | Target CAC | Maximum CAC | LTV:CAC Target |
|---------|-----------|-------------|---------------|
| Stone AI | $25 | $50 | 10:1 |
| Best AI | $8 | $20 | 8:1 |
| Tools | $15 | $35 | 12:1 |
| Cross-product (bundle) | $35 | $70 | 15:1 |

### 5.3 Budget Reallocation Triggers

Shift marketing budget between products when:
```
Trigger: One product's CAC exceeds maximum
  Action: Reduce spend on that product's expensive channels
  Redirect to: Product with best CAC:LTV ratio

Trigger: One product hits growth ceiling (market saturation)
  Action: Shift 20% of that product's budget to growth products
  Redirect to: Product with most headroom

Trigger: Cross-sell conversion rate > 15%
  Action: Increase cross-sell budget from each product
  Redirect to: Cross-product campaigns

Trigger: Seasonal opportunity (e.g., back to school, New Year)
  Action: Temporarily increase relevant product's budget by 50%
  Source: Buffer/reserve budget
```

---

## 6. Engineering Resource Allocation

### 6.1 Sprint Planning (2-Week Sprints)

**Sprint Capacity**: ~80 effort points per sprint (40/week × 2)

**Allocation Template (Stage 3: All Products Live)**:
```
Sprint Points: 80 total

Stone AI:     28 points (35%)
  - 1 complex feature (3 pts)
  - 4 modifications (8 pts)
  - 5 bug fixes (5 pts)
  - 2 research tasks (4 pts)
  - Maintenance/ops (8 pts)

Best AI:      28 points (35%)
  - 1 complex feature (3 pts)
  - 4 modifications (8 pts)
  - 4 bug fixes (4 pts)
  - 2 research tasks (4 pts)
  - Maintenance/ops (9 pts)

Tools:        16 points (20%)
  - 1 modification (2 pts)
  - 3 bug fixes (3 pts)
  - 1 research task (2 pts)
  - Maintenance/ops (5 pts)
  - Documentation (4 pts)

Cross-Product: 8 points (10%)
  - Shared infrastructure (4 pts)
  - Cross-product features (4 pts)
```

### 6.2 Emergency Reallocation

When a product has an emergency (critical bug, security issue, outage):

```
Rule: Product in emergency gets up to 50% of total sprint capacity
Source: Borrow from lowest-priority items across all products
Duration: Maximum 1 sprint — if longer, it's a structural problem

Example:
  Tools has critical API outage → gets 40 points this sprint
  Stone AI: 20 points (core maintenance only)
  Best AI: 15 points (core maintenance only)
  Cross-product: 5 points (critical only)
```

---

## 7. Time Management for Founder

### 7.1 Daily Schedule Template

```
7:00-8:00   Morning routine + metrics review (all products)
8:00-10:00  Deep work: highest priority product task
10:00-10:30 Support triage: quick ticket review
10:30-12:30 Deep work: second priority product task
12:30-1:30  Lunch + learning/research
1:30-3:30   Cross-product work: features, integrations, coordination
3:30-4:00   Agent dispatch review: grade agent outputs
4:00-5:00   Marketing: content, campaigns, community
5:00-5:30   Operations: deployment, monitoring check
5:30-6:00   End-of-day: plan tomorrow, close tickets
6:00+       Strategic thinking (when inspired, not forced)
```

### 7.2 Weekly Rhythm

```
Monday:    Planning + Stone AI focus
Tuesday:   Best AI focus + deployments
Wednesday: Tools focus + cross-product
Thursday:  Mixed work + marketing
Friday:    Operations review + strategic planning
Weekend:   Optional: research, learning, experiments
```

### 7.3 Context Switching Minimization

**Rule**: Maximum 2 product context switches per day.
```
Morning: Product A deep work (2+ hours uninterrupted)
Afternoon: Product B deep work (2+ hours uninterrupted)
End of day: Cross-product / operations (can context switch)

NEVER: 30-minute chunks alternating between products
  This kills productivity and quality.
```

---

## 8. Delegation Framework

### 8.1 What the Founder Does vs. Delegates

| Activity | Founder Does | Delegates To |
|----------|-------------|-------------|
| Product vision & roadmap | Decides | Stone presents options |
| Feature prioritization | Approves | Stone recommends |
| Code review (critical) | Reviews | Specialist agents build |
| Marketing strategy | Decides | Marketing Strategist executes |
| Marketing copy | Approves | Copywriter creates |
| Support (Tier 3+) | Handles | Help agent handles Tier 0-2 |
| Infrastructure decisions | Approves | Chaos recommends + executes |
| Financial decisions | Decides | Stone presents data |
| Hiring decisions | Decides | Stone/Cardinal research |
| Competitive intelligence | Reviews | Cardinal gathers + analyzes |

### 8.2 Escalation to Founder

Only these things should interrupt the founder:
1. **Revenue impact**: Anything affecting MRR (billing bugs, churn spike)
2. **Security**: Any potential breach or vulnerability
3. **Outage**: SEV-1 or SEV-2 across any product
4. **Legal**: Compliance issues, DMCA, legal threats
5. **Strategic decisions**: Product direction, pricing changes, partnerships

Everything else can wait for the next scheduled review window.

---

## 9. Resource Allocation Reviews

### 9.1 Weekly Review (5 minutes)

```
Quick check:
  - Is any product blocked on resources?
  - Is any product over/under allocated?
  - Any emergency reallocation needed?
```

### 9.2 Monthly Review (30 minutes)

```
Deep review:
  - Revenue per product vs. resource allocation
  - Engineering velocity per product
  - Marketing ROI per product
  - Adjust allocation for next month
```

### 9.3 Quarterly Review (2 hours)

```
Strategic review:
  - Full resource allocation vs. results analysis
  - Product lifecycle stage assessment
  - Budget reallocation for next quarter
  - Hiring needs assessment
  - Infrastructure scaling plan
```

---

*Seed created by Agent Stone (Head 1) + Cardinal (Head 2) — Three-Headed Monster Operations*
*Resources are finite. The founder's time is the most finite of all. Every hour must go where it creates the most value across the ecosystem.*
