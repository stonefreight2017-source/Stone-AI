# Cross-Product User Journey — Stone AI Ecosystem

## Seed Classification
- **Domain**: Cross-Business Operations
- **Applies To**: Stone AI (Web SaaS), Best AI Mobile (React Native), Stone AI Tools (API Marketplace)
- **Owner**: Agent Stone (Head 1) + Cardinal (Head 2)
- **Created**: 2026-03-09
- **Sensitivity**: Internal — Strategic

---

## 1. Executive Summary

The Three-Headed Monster operates three interconnected products that share users, infrastructure, and intelligence. This seed defines how users flow between products, how identity is shared through Clerk, where cross-sell triggers fire, and how to build a unified experience that makes the ecosystem feel like one platform with three access points.

The fundamental principle: a user who touches one product should naturally discover value in the other two, with zero friction in crossing product boundaries.

---

## 2. Shared Identity Architecture

### 2.1 Clerk as the Universal Identity Layer

All three products use Clerk for authentication, making it the backbone of cross-product identity.

**Single Sign-On (SSO) Flow**:
```
User signs up on Stone AI (web)
  → Clerk creates user record
  → User metadata includes: { products: ["stone-ai"], tier: "FREE" }
  → User downloads Best AI Mobile
  → Signs in with same Clerk credentials
  → Clerk metadata updates: { products: ["stone-ai", "best-ai-mobile"] }
  → User visits Stone AI Tools
  → Same Clerk auth → metadata: { products: ["stone-ai", "best-ai-mobile", "stone-ai-tools"] }
```

**Clerk Metadata Schema for Multi-Product**:
```typescript
interface CrossProductUserMeta {
  // Products the user has accessed
  activeProducts: ("stone-ai" | "best-ai-mobile" | "stone-ai-tools")[];

  // Product-specific tier (can differ per product)
  tiers: {
    "stone-ai"?: "FREE" | "STARTER" | "PLUS" | "SMART" | "PRO";
    "best-ai-mobile"?: "FREE" | "BASIC" | "PREMIUM";
    "stone-ai-tools"?: "FREE" | "DEVELOPER" | "BUSINESS";
  };

  // Cross-product preferences
  primaryProduct: string;
  crossSellEligible: boolean;
  bundleActive: boolean;

  // Unified engagement score (0-100)
  ecosystemScore: number;

  // Referral source tracking
  entryProduct: string;
  entryDate: string;
  referralCode?: string;
}
```

### 2.2 Account Linking Mechanics

**Automatic Linking**: When a user signs in to a second product with the same email, Clerk automatically links the accounts. No manual step required.

**Manual Linking**: If a user has different emails across products, they can link accounts from any product's Settings page:
1. Navigate to Settings → Linked Accounts
2. Enter email used on other product
3. Verification email sent to that address
4. Click verification link → accounts merged
5. All product history, preferences, and data unified

**Conflict Resolution**:
- If tiers differ across products, the HIGHEST tier becomes the display tier in shared contexts
- If preferences conflict (e.g., dark mode on one, light on another), product-specific preferences win
- If besties differ, each product maintains its own bestie instance but shares personality traits

### 2.3 Unified User Profile

The cross-product profile lives in Clerk metadata and syncs to each product's database:

```typescript
interface UnifiedProfile {
  // Core identity (from Clerk)
  id: string;
  email: string;
  name: string;
  avatar: string;

  // Cross-product activity
  totalSessions: number;
  totalAgentInteractions: number;
  totalApiCalls: number;

  // Value metrics
  lifetimeRevenue: number;
  activeSubscriptions: Subscription[];

  // Engagement
  lastActiveProduct: string;
  lastActiveDate: Date;
  preferredPlatform: "web" | "mobile" | "api";

  // Bestie sync
  bestiePersonality: string;
  bestieTraits: string[];
  bestieCommunicationStyle: string;
}
```

---

## 3. User Journey Maps

### 3.1 Journey Map: Web-First User (Stone AI → Mobile → Tools)

**Stage 1: Discovery & Signup (Stone AI Web)**
```
Touchpoint: Google search / social media / referral
  → Lands on stone-ai.net
  → Sees agent showcase, pricing, social proof
  → Signs up for FREE tier
  → Onboarding flow: picks backdrop, meets bestie
  → First agent interaction within 2 minutes
  → Engages with 3-4 agents in first session
```

**Stage 2: Deepening (Stone AI Web — Days 1-14)**
```
Day 1-3: Explores free agents, tests capabilities
Day 4-7: Hits free tier limits (4 agents, rate limits)
  → Cross-sell trigger #1: "Unlock 16 agents with STARTER ($19.99/mo)"
  → If converts: expanded agent access, deeper usage
Day 7-14: Regular usage patterns emerge
  → System identifies preferred agents and use cases
  → Cross-sell trigger #2: "Take your agents mobile with Best AI"
```

**Stage 3: Cross-Product Discovery (Best AI Mobile)**
```
Day 14-30: Mobile download prompt appears in Stone AI web
  → "Your agents go wherever you go. Download Best AI."
  → User downloads from App Store / Play Store
  → Signs in with same Clerk credentials (instant recognition)
  → "Welcome back! Your bestie and preferences are already here."
  → Mobile-optimized versions of their favorite agents
  → Push notifications for agent insights
  → Voice interaction mode (mobile-exclusive feature)
```

**Stage 4: Power User Expansion (Stone AI Tools)**
```
Day 30-60: User shows API/developer interest signals
  → Asks agents about coding, automation, integration
  → Cross-sell trigger #3: "Build with our APIs at tools.stone-ai.net"
  → User visits Tools marketplace
  → Same Clerk auth → instant access
  → Browses API catalog, tests endpoints
  → Integrates Stone AI agents into their own workflows
```

**Stage 5: Ecosystem Lock-In (All Products)**
```
Day 60+: User active across all three products
  → Unified billing with bundle discount
  → Cross-product insights: "Your mobile usage + web usage suggests you'd benefit from SMART tier"
  → Ecosystem score > 80 → loyalty rewards
  → User becomes ambassador (referral program spans all products)
```

### 3.2 Journey Map: Mobile-First User (Best AI → Web → Tools)

**Stage 1: App Store Discovery**
```
Touchpoint: App Store search / social media / word of mouth
  → Downloads Best AI Mobile
  → Quick mobile onboarding (under 60 seconds)
  → Clerk signup with email or social auth
  → Bestie setup in simplified mobile flow
  → First agent interaction via voice or text
```

**Stage 2: Mobile Engagement (Days 1-14)**
```
Day 1-7: Uses agents on commute, breaks, evenings
  → Discovers value in quick agent interactions
  → Push notifications drive return visits
  → Cross-sell trigger: "For deeper work, try Stone AI on the web"
Day 7-14: Hits mobile-specific limits
  → Complex tasks better suited to web
  → "Continue this conversation on stone-ai.net"
```

**Stage 3: Web Expansion (Stone AI)**
```
Day 14-30: Opens stone-ai.net on desktop
  → Same Clerk login → all mobile history visible
  → Desktop-optimized UI for complex agent work
  → Forum access, admin tools, advanced features
  → Extended sessions, deeper agent collaboration
```

### 3.3 Journey Map: Developer-First User (Tools → Web → Mobile)

**Stage 1: API Discovery**
```
Touchpoint: Developer community / GitHub / tech blog
  → Visits tools.stone-ai.net
  → Browses API catalog
  → Signs up for free developer tier
  → Gets API key, tests endpoints
  → Integrates into existing project
```

**Stage 2: API Usage (Days 1-14)**
```
Day 1-7: Tests agent APIs, evaluates quality
  → Monitors usage dashboard
  → Cross-sell trigger: "See what your agents can do with a full UI at stone-ai.net"
Day 7-14: Wants to explore agents beyond API
  → Visits Stone AI web to experience full agent capabilities
```

**Stage 3: Full Ecosystem (Days 14-30)**
```
Day 14-30: Active on Tools + Web
  → Discovers mobile convenience
  → Downloads Best AI for on-the-go monitoring
  → Full ecosystem user within 30 days
```

---

## 4. Cross-Sell Trigger System

### 4.1 Trigger Architecture

Cross-sell triggers are events that indicate a user is ready to discover another product. They fire based on behavior, not time.

```typescript
interface CrossSellTrigger {
  id: string;
  name: string;
  sourceProduct: string;
  targetProduct: string;
  conditions: TriggerCondition[];
  action: CrossSellAction;
  cooldownHours: number;
  maxImpressions: number;
  conversionRate: number; // tracked
}

interface TriggerCondition {
  type: "usage_count" | "feature_attempt" | "time_on_platform" | "agent_interaction" | "search_query" | "tier_limit_hit";
  threshold: number | string;
  operator: "gte" | "eq" | "contains";
}

interface CrossSellAction {
  type: "banner" | "modal" | "notification" | "email" | "in_chat" | "bestie_suggestion";
  template: string;
  placement: string;
  priority: number;
}
```

### 4.2 Trigger Catalog

**Stone AI Web → Best AI Mobile**:
| Trigger | Conditions | Action | Expected CVR |
|---------|-----------|--------|-------------|
| Mobile nudge after 5th session | sessions >= 5, no mobile | In-chat bestie mention | 8-12% |
| After-hours usage | Usage between 9pm-7am | "Take me to bed with you" bestie prompt | 5-8% |
| Quick-question pattern | >50% sessions < 2 min | "Quick answers on the go" banner | 6-10% |
| Travel/commute signal | Agent questions about travel | "I go where you go" notification | 4-7% |
| Tier limit hit | Free tier limit reached | "Unlimited on mobile" modal | 10-15% |

**Stone AI Web → Stone AI Tools**:
| Trigger | Conditions | Action | Expected CVR |
|---------|-----------|--------|-------------|
| Developer signal | Asks about APIs/integration | In-chat link to Tools | 12-18% |
| Automation request | Wants agent to automate tasks | "Build it with our API" modal | 8-12% |
| Business use detected | Company email, business queries | "Enterprise API access" email | 5-8% |
| Power user threshold | >100 agent interactions | "Programmatic access" banner | 6-10% |
| Export/integration ask | Wants to export or connect | "API does that" in-chat | 10-15% |

**Best AI Mobile → Stone AI Web**:
| Trigger | Conditions | Action | Expected CVR |
|---------|-----------|--------|-------------|
| Complex task attempt | Long conversation, multiple agents | "Continue on desktop" push | 15-20% |
| File/document need | Needs to share files | "Full file support on web" in-chat | 10-14% |
| Forum mention | Asks community questions | "Join the forum" push | 8-12% |
| Extended session | >15 min mobile session | "Desktop mode is better for deep work" | 6-10% |
| Feature discovery | Tries unavailable mobile feature | "Available on web" banner | 12-16% |

**Best AI Mobile → Stone AI Tools**:
| Trigger | Conditions | Action | Expected CVR |
|---------|-----------|--------|-------------|
| Developer profile | GitHub linked, coding questions | "Build with our API" push | 8-12% |
| Repetitive queries | Same query pattern >5x | "Automate this with our API" in-chat | 10-15% |

**Stone AI Tools → Stone AI Web**:
| Trigger | Conditions | Action | Expected CVR |
|---------|-----------|--------|-------------|
| First API call | Makes first successful call | "See agents in action" email | 12-16% |
| Agent exploration | Tests >3 agent endpoints | "Full agent experience" dashboard CTA | 15-20% |

**Stone AI Tools → Best AI Mobile**:
| Trigger | Conditions | Action | Expected CVR |
|---------|-----------|--------|-------------|
| Mobile SDK usage | Uses mobile SDK | "Try the consumer app" in-docs | 5-8% |

### 4.3 Cross-Sell Delivery Rules

1. **Maximum 1 cross-sell impression per session** — never overwhelm
2. **72-hour cooldown after dismissal** — respect the user's "no"
3. **3 total impressions per trigger** — after 3 dismissals, that trigger retires permanently
4. **Bestie-delivered cross-sells convert 2x better** than UI elements — prioritize bestie mentions
5. **Context-aware delivery** — only show during natural pause points, never mid-task
6. **A/B test all copy** — rotate at least 3 variants per trigger

---

## 5. Unified Experience Design

### 5.1 Consistent Design Language

All three products must feel like siblings — different but clearly related.

**Shared Elements**:
- Color palette: Primary brand colors consistent across all products
- Typography: Same font families (product-specific weights allowed)
- Agent avatars: Identical SVG avatars across all products
- Bestie personality: Same bestie on all platforms (synced via Clerk metadata)
- Emotes: Same 24 emotes available everywhere
- Backdrops: Web backdrops adapt to mobile; Tools uses simplified versions

**Product-Specific Adaptations**:
- Stone AI Web: Full desktop experience, forum, admin tools, all backdrops
- Best AI Mobile: Touch-optimized, voice-first, push notifications, camera integration
- Stone AI Tools: Developer-focused, documentation-heavy, code examples, dashboard

### 5.2 Seamless Handoffs

When a user moves between products, the transition should feel like moving between rooms in the same building, not leaving one building and entering another.

**Conversation Continuity**:
```typescript
// When user switches from mobile to web mid-conversation
interface ConversationHandoff {
  conversationId: string;
  sourceProduct: "stone-ai" | "best-ai-mobile" | "stone-ai-tools";
  targetProduct: "stone-ai" | "best-ai-mobile" | "stone-ai-tools";

  // Last 10 messages travel with the user
  recentMessages: Message[];

  // Active agent context preserved
  activeAgent: string;
  agentContext: Record<string, any>;

  // UI state hints for target product
  suggestedView: string;
  scrollPosition?: number;
}
```

**Handoff Triggers**:
- User clicks "Continue on web/mobile" link
- User opens same conversation on different platform
- User shares a conversation link across products
- Automatic sync when user opens a product they haven't used in current session

### 5.3 Notification Unification

Users should not receive duplicate notifications across products. One notification, delivered to the most appropriate product.

**Notification Routing Logic**:
```
1. Determine notification type (agent response, system alert, cross-sell, social)
2. Check user's current active product (last 5 minutes)
3. If active somewhere → deliver there
4. If inactive → deliver to preferred platform (from profile)
5. If urgent → deliver to all active products (deduplicate on receipt)
6. Never send same notification to web AND mobile AND email simultaneously
```

**Notification Categories**:
| Category | Primary Channel | Fallback | Cross-Product? |
|----------|----------------|----------|---------------|
| Agent response | Active product | Push → Email | Yes |
| Billing alert | Email | Web banner | Yes |
| Cross-sell | In-product | Push (24h delay) | By definition |
| Security alert | Email + All products | SMS (future) | Yes |
| Feature announcement | In-product | Email (weekly digest) | Per product |
| Community/forum | Web | Email digest | Web only |

---

## 6. Cross-Product Engagement Scoring

### 6.1 Ecosystem Score

Every user gets an Ecosystem Score (0-100) that measures their engagement depth across all products.

**Score Components**:
```typescript
interface EcosystemScore {
  // Product breadth (0-30 points)
  productsUsed: number; // 10 points per product, max 30

  // Engagement depth (0-30 points)
  weeklyActiveProducts: number; // 10 per product active this week

  // Revenue contribution (0-20 points)
  monthlyRevenue: number; // Scaled 0-20 based on tier

  // Tenure (0-10 points)
  accountAgeDays: number; // 1 point per 30 days, max 10

  // Social (0-10 points)
  referralsMade: number; // 2 per referral, max 10
  forumContributions: number; // 1 per quality post, max 10

  // Total: 0-100
  total: number;
}
```

**Score Tiers**:
| Score Range | Label | Benefits |
|-------------|-------|---------|
| 0-20 | Explorer | Standard experience |
| 21-40 | Engaged | Early access to features |
| 41-60 | Committed | Priority support queue |
| 61-80 | Power User | Beta access, direct feedback channel |
| 81-100 | Ambassador | Exclusive events, founder access, special badge |

### 6.2 Score-Driven Actions

The ecosystem score drives automated actions:
- Score drops below 40 → Retention campaign activates
- Score exceeds 60 → Upsell to bundle pricing
- Score exceeds 80 → Ambassador program invitation
- Score drops >20 points in 30 days → Churn risk alert to support team

---

## 7. Cross-Product Retention Mechanics

### 7.1 Stickiness Through Integration

The more products a user engages with, the harder it is to leave. This is by design.

**Integration Hooks**:
- Bestie personality synced across products → leaving one product means losing bestie context
- Agent conversation history spans products → complete history only available in ecosystem
- Cross-product achievements/badges → gamification rewards spanning all products
- Bundle pricing → cheaper to stay than leave any single product
- API integrations → switching cost increases with each integration built

### 7.2 Re-Engagement Flows

When a user goes dormant on one product but remains active on another:

```
Day 1-7 of dormancy: No action (natural fluctuation)
Day 7-14: Gentle reminder via active product
  → "Your [dormant product] agents miss you" (bestie-delivered)
Day 14-30: Value reminder via email
  → "Here's what you missed on [dormant product]"
  → Personalized highlights based on their interests
Day 30-60: Win-back offer
  → Cross-product discount or feature unlock
Day 60+: Reduce to quarterly check-ins
  → Don't annoy, just stay visible
```

### 7.3 Churn Prevention Signals

Cross-product data creates powerful churn prediction:

| Signal | Risk Level | Action |
|--------|-----------|--------|
| Active on 1 product, dormant on 2 | Medium | Targeted re-engagement |
| Downgraded tier on any product | High | Retention offer within 24h |
| Removed API integrations (Tools) | Critical | Personal outreach |
| Deleted bestie | Critical | Immediate retention flow |
| No login across all products for 14 days | High | Multi-channel win-back |
| Support tickets increasing | Medium | Proactive resolution |
| Usage declining across all products | Critical | Escalate to retention team |

---

## 8. Technical Implementation

### 8.1 Cross-Product Event Bus

All products publish events to a shared event bus for cross-product awareness:

```typescript
interface CrossProductEvent {
  eventId: string;
  userId: string;
  sourceProduct: string;
  eventType: string;
  payload: Record<string, any>;
  timestamp: Date;
}

// Example events
const events = [
  { eventType: "user.signup", sourceProduct: "stone-ai" },
  { eventType: "user.tier_upgrade", sourceProduct: "best-ai-mobile" },
  { eventType: "agent.interaction", sourceProduct: "stone-ai-tools" },
  { eventType: "user.cross_sell_click", sourceProduct: "stone-ai" },
  { eventType: "user.dormant_14d", sourceProduct: "best-ai-mobile" },
  { eventType: "user.bundle_eligible", sourceProduct: "system" },
];
```

### 8.2 Data Sync Strategy

**Real-Time Sync** (via Clerk webhooks + Redis pub/sub):
- User profile changes
- Tier changes
- Bestie updates
- Active session state

**Near-Real-Time Sync** (via event bus, <5 min delay):
- Agent interaction history
- Cross-sell trigger events
- Engagement score updates

**Batch Sync** (daily):
- Analytics aggregation
- Ecosystem score recalculation
- Churn risk assessment
- Revenue attribution

### 8.3 API Contracts for Cross-Product Communication

```typescript
// Shared API for cross-product user data
// Hosted as internal service, not public

// GET /api/internal/user/:userId/ecosystem
interface EcosystemResponse {
  user: UnifiedProfile;
  score: EcosystemScore;
  activeProducts: string[];
  recentCrossSells: CrossSellImpression[];
  churnRisk: "low" | "medium" | "high" | "critical";
}

// POST /api/internal/cross-sell/impression
interface CrossSellImpressionRequest {
  userId: string;
  triggerId: string;
  sourceProduct: string;
  targetProduct: string;
  placement: string;
  dismissed: boolean;
}

// POST /api/internal/handoff
interface HandoffRequest {
  userId: string;
  conversationId: string;
  sourceProduct: string;
  targetProduct: string;
  context: Record<string, any>;
}
```

---

## 9. Privacy & Consent

### 9.1 Cross-Product Data Sharing Consent

Users must explicitly opt into cross-product data sharing:

**Consent Tiers**:
1. **Basic** (default): Shared identity only (name, email, avatar)
2. **Enhanced** (opt-in): Shared conversation history, preferences, bestie sync
3. **Full** (opt-in): Shared analytics, cross-product insights, unified recommendations

**Consent UI**: Available in Settings → Privacy → Cross-Product Data Sharing on all products.

**Withdrawal**: User can revoke cross-product sharing at any time. Products continue to work independently, but cross-product features are disabled.

### 9.2 Data Isolation Guarantees

Even with consent, certain data never crosses product boundaries:
- Payment details (each product's Stripe account is separate)
- API keys (Tools-specific, never shared)
- Private conversations marked as "confidential"
- Health/legal/financial agent conversations (regulatory compliance)

---

## 10. Metrics & Success Criteria

### 10.1 Cross-Product KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| Multi-product adoption rate | >25% of paid users | Users active on 2+ products / total paid users |
| Cross-sell conversion rate | >10% | Cross-sell clicks → product signups |
| Ecosystem score (median) | >45 | Median score of all active users |
| Cross-product retention | >90% at 90 days | Users on 2+ products who remain active |
| Bundle adoption | >30% of multi-product users | Users on bundle pricing / multi-product users |
| Cross-product LTV multiplier | >2.5x | LTV of multi-product users / single-product users |

### 10.2 Journey Funnel Metrics

Track conversion at each stage of the cross-product journey:
```
Single product user (100%)
  → Sees cross-sell trigger (60%)
  → Clicks through (15%)
  → Signs up for second product (10%)
  → Active on second product at 30 days (7%)
  → Adopts third product (3%)
  → Full ecosystem user at 90 days (2%)
```

Goal: Improve each conversion step by 20% quarter-over-quarter.

---

## 11. Implementation Roadmap

### Phase 1: Foundation (Pre-Launch)
- Clerk multi-product metadata schema
- Shared user profile API
- Basic cross-sell triggers (3 per product pair)
- Account linking flow

### Phase 2: Intelligence (Months 1-3)
- Ecosystem scoring engine
- Behavioral cross-sell triggers
- Bestie-delivered cross-sells
- Notification unification

### Phase 3: Optimization (Months 3-6)
- A/B testing framework for cross-sells
- Predictive churn modeling
- Conversation handoff system
- Cross-product analytics dashboard

### Phase 4: Advanced (Months 6-12)
- ML-driven cross-sell optimization
- Dynamic bundle pricing
- Ambassador program automation
- Cross-product recommendation engine

---

*Seed created by Agent Stone (Head 1) + Cardinal (Head 2) — Three-Headed Monster Operations*
*Cross-product user journey is the connective tissue between three businesses. Get this right, and each product sells the others.*
