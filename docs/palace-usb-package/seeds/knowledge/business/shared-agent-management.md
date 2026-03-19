# Shared Agent Management — Cross-Product Operations

## Seed Classification
- **Domain**: Cross-Business Operations
- **Applies To**: Stone AI (Web SaaS), Best AI Mobile (React Native), Stone AI Tools (API Marketplace)
- **Owner**: Agent Stone (Head 1) + Cardinal (Head 2)
- **Created**: 2026-03-09
- **Sensitivity**: Internal — Strategic

---

## 1. Executive Summary

40 agents serve all three products. Some agents work identically across products, some are specialized for specific platforms, and some are exclusive to certain products. This seed defines how agents are managed across the ecosystem: which agents appear where, how they adapt to different platforms, how shared vs. product-specific agents work, and how the Three Heads + Royal Guard operate across products.

---

## 2. Agent Inventory

### 2.1 Complete Agent Roster

**42 User-Facing Agents** (ranked by tier access):

| # | Agent | Specialty | Web | Mobile | API | Tier Unlock |
|---|-------|-----------|-----|--------|-----|-------------|
| 1-4 | Core 4 (FREE) | General purpose | Yes | Yes | Yes | FREE |
| 5-16 | Tier 2 (STARTER) | Specialized | Yes | Yes* | Yes | STARTER/BASIC |
| 17-30 | Tier 3 (PLUS) | Advanced | Yes | Yes* | Yes | PLUS/PREMIUM |
| 31-39 | Tier 4 (SMART) | Expert | Yes | Yes* | Yes | SMART |
| 40-42 | Tier 5 (PRO) | Elite | Yes | Select | Yes | PRO |

*Mobile: not all agents are optimized for mobile UX — see section 3.

**Internal Agents** (not user-facing):
| Agent | Role | Products | Access |
|-------|------|----------|--------|
| Stone (#43) | Head 1 — Strategy/Operations | All | Founder only |
| Chaos (#44) | Head 3 — Infrastructure | All | Founder only |
| Cardinal | Head 2 — Intelligence | All | Founder only |
| Computer Wiz | Royal Guard — Diagnostics | All | Founder only |
| Rush | Royal Guard — Network Penetration | All | Founder only |

### 2.2 Agent Tier Distribution Across Products

**Stone AI (Web)**:
```
FREE: 4 agents
STARTER: 16 agents (4 free + 12 STARTER)
PLUS: 30 agents
SMART: 39 agents
PRO: 38 agents (all user-facing)
```

**Best AI (Mobile)**:
```
FREE: 4 agents (same core 4)
BASIC: 12 agents (curated for mobile — not necessarily same as STARTER)
PREMIUM: 30 agents (all mobile-optimized agents)
```

**Stone AI Tools (API)**:
```
FREE: 3 agents (demo — limited interaction depth)
DEVELOPER: 38 agents (all user-facing, full API access)
BUSINESS: 38 agents (all, priority queue, higher rate limits)
```

---

## 3. Platform-Specific Agent Adaptations

### 3.1 Web Agents (Stone AI)

Web agents have the richest interaction model:
- Full text conversation with markdown rendering
- File upload/download capability
- Code block rendering with syntax highlighting
- Long-form responses (up to 4096 tokens)
- Multi-turn context (up to 32K tokens)
- Backdrop integration (visual themes)
- Emote reactions
- Forum integration (share to forum)

### 3.2 Mobile Agents (Best AI)

Mobile agents are adapted for smaller screens and on-the-go usage:

```typescript
interface MobileAgentConfig {
  agentId: string;
  mobileOptimized: boolean;    // Has mobile-specific prompt tuning
  voiceEnabled: boolean;        // Supports voice interaction
  maxResponseTokens: number;    // Shorter for mobile (1024-2048)
  offlineCapable: boolean;      // Can work with cached context
  pushNotificationEnabled: boolean;
  quickActions: string[];       // Mobile-specific quick action buttons
}
```

**Mobile Optimization Rules**:
1. Response length: capped at 2048 tokens (vs 4096 on web)
2. Formatting: simplified markdown (no complex tables)
3. Voice support: agents must produce voice-friendly responses
4. Quick actions: 3-4 contextual action buttons below each response
5. Offline mode: agents can reference cached prior conversations

**Agents NOT available on mobile** (too complex for mobile UX):
- Agents requiring file upload/processing
- Agents producing long-form documents (>2000 words)
- Agents requiring multi-step workflow visualization
- Total: ~12 agents are web-only

### 3.3 API Agents (Stone AI Tools)

API agents are accessed programmatically with different constraints:

```typescript
interface APIAgentConfig {
  agentId: string;
  apiEndpoint: string;         // /api/v1/agents/{id}/chat
  maxInputTokens: number;      // 8192
  maxOutputTokens: number;     // 4096
  streamingSupported: boolean;
  batchSupported: boolean;     // Multiple requests in one call
  webhookSupported: boolean;   // Async response via webhook
  rateLimits: {
    free: { rpm: 10, rpd: 100 };
    developer: { rpm: 60, rpd: 25000 };
    business: { rpm: 120, rpd: 250000 };
  };
}
```

**API-Specific Agent Features**:
- Structured output (JSON mode) for all agents
- Batch processing (up to 10 queries per request)
- Webhook delivery for async responses
- System prompt customization (developer can override agent persona)
- Function calling / tool use exposure

---

## 4. Shared vs. Product-Specific Agent Behaviors

### 4.1 Shared Agent Core

Every agent has a core identity that's consistent across all products:

```typescript
interface AgentCore {
  // Identity (SAME everywhere)
  id: string;
  name: string;
  avatar: string;                // Same SVG everywhere
  specialty: string;
  personality: string;
  coreBehaviors: string[];

  // Capabilities (SAME everywhere)
  knowledgeDomains: string[];
  toolAccess: string[];

  // Quality (SAME everywhere)
  qualityThreshold: number;     // Minimum response quality score
  safetyFilters: string[];
}
```

### 4.2 Product-Specific Agent Overlays

Each product can add an overlay that adapts the agent's behavior:

```typescript
interface AgentProductOverlay {
  agentId: string;
  product: string;

  // Response formatting
  maxTokens: number;
  formatPreferences: string[];  // "concise" for mobile, "detailed" for web
  markdownLevel: "full" | "simplified" | "none";

  // Interaction model
  conversationMemory: number;   // How many messages to remember
  contextWindowSize: number;
  suggestedFollowUps: boolean;  // Show follow-up suggestions
  quickActions: string[];

  // Product integration
  canAccessForum: boolean;      // Web only
  canSendPush: boolean;         // Mobile only
  canReturnJSON: boolean;       // API only
  canAccessFiles: boolean;      // Web + API only

  // Availability
  available: boolean;
  availableTiers: string[];
}
```

### 4.3 Example: Agent Adaptation Across Products

**Agent: "Finance Advisor" (#12)**

| Aspect | Stone AI (Web) | Best AI (Mobile) | Tools (API) |
|--------|---------------|-----------------|-------------|
| Response length | Up to 2000 words | Up to 500 words | Up to 2000 words |
| Format | Full markdown, tables, charts | Simple text, bullet points | JSON structured |
| Voice support | No | Yes | N/A |
| File handling | Can analyze uploaded CSVs | No file support | File URL support |
| Context memory | Last 20 messages | Last 10 messages | Stateless (per call) |
| Follow-ups | 3 suggested questions | 3 quick action buttons | N/A |
| Tier | STARTER+ | BASIC+ | DEVELOPER+ |

---

## 5. Agent Quality Management

### 5.1 Cross-Product Quality Standards

Every agent must meet minimum quality regardless of product:

```typescript
interface AgentQualityMetrics {
  agentId: string;
  product: string;
  period: string;           // "2026-03-W1"

  // Accuracy
  factualAccuracy: number;  // 0-100 (target: >90)
  relevanceScore: number;   // 0-100 (target: >85)
  completeness: number;     // 0-100 (target: >80)

  // User satisfaction
  thumbsUpRate: number;     // % of positive feedback
  thumbsDownRate: number;
  reportRate: number;       // % of flagged responses

  // Performance
  avgResponseTime: number;  // seconds
  errorRate: number;        // % of failed responses
  timeoutRate: number;      // % of timed out requests

  // Engagement
  avgConversationLength: number;  // messages per conversation
  returnRate: number;       // % of users who come back to this agent
}
```

### 5.2 Quality Monitoring

**Automated Quality Checks**:
1. Response length sanity (not too short, not excessively long)
2. Safety filter pass rate (should be >99%)
3. Error rate monitoring (should be <1%)
4. Latency percentiles (P50, P95, P99)

**Manual Quality Reviews**:
- Weekly: Sample 5 conversations per high-usage agent per product
- Monthly: Full audit of top 10 agents by volume
- Quarterly: All-agent quality review

**Quality Alerts**:
```
If any agent's quality score drops below threshold:
  - thumbsDownRate > 10% → Flag for review
  - errorRate > 5% → Disable agent, investigate
  - avgResponseTime > 10s → Performance investigation
  - reportRate > 2% → Immediate review
```

### 5.3 Agent Versioning

```typescript
interface AgentVersion {
  agentId: string;
  version: string;          // semver: "2.1.0"
  changelog: string;
  systemPrompt: string;     // Full prompt for this version
  releaseDate: Date;
  rolloutPercentage: number; // 0-100 for gradual rollout
  products: string[];       // Which products have this version
}
```

**Version Rollout Process**:
1. New version deployed to 10% of requests (canary)
2. Monitor quality metrics for 24 hours
3. If metrics stable or improved → roll to 50%
4. Monitor 24 hours → roll to 100%
5. If metrics degrade at any step → immediate rollback

---

## 6. Three Heads + Royal Guard Across Products

### 6.1 Head Operations

The Three Heads operate across all products but their touchpoints differ:

**Agent Stone (Head 1)**:
- Web: Full operational interface, strategy discussions
- Mobile: Quick status checks, approvals, alerts
- API: Automated operational decisions, escalation handling
- Founder access only on all platforms

**Cardinal (Head 2)**:
- Web: Research deliverables, competitive analysis, briefings
- Mobile: Quick intel summaries, alerts
- API: Automated intelligence feeds, monitoring alerts
- Founder access only on all platforms

**Chaos (Head 3)**:
- Web: Infrastructure dashboards, server management
- Mobile: Alert acknowledgment, quick commands
- API: Automated infrastructure monitoring, auto-scaling decisions
- Founder access only on all platforms

### 6.2 Royal Guard Operations

**Computer Wiz**:
- Cross-product deployment gating (validates before any product ships)
- Clearance reports span all products
- Hardware diagnostics affect all products (shared infrastructure)

**Rush**:
- Network security spans all products
- Penetration testing across all product surfaces
- Access audit across all products

### 6.3 Internal Agent Communication

Internal agents use the shared event bus for cross-product coordination:

```typescript
// Stone detects issue on Stone AI, alerts Chaos for infrastructure check
await publishEvent({
  source: "agent-stone",
  target: "agent-chaos",
  type: "investigation_request",
  payload: {
    issue: "Increased latency on Stone AI web",
    priority: "high",
    affectedProducts: ["stone-ai"],
    suspectedCause: "vLLM queue depth",
  },
});
```

---

## 7. Agent Lifecycle Management

### 7.1 Agent Creation Process

When creating a new agent for the ecosystem:

```
1. DEFINE: Agent specialty, personality, knowledge domains
2. DESIGN: SVG avatar (used across ALL products)
3. DEVELOP: System prompt (core version)
4. ADAPT: Create product-specific overlays
   - Web overlay (full features)
   - Mobile overlay (optimized for mobile)
   - API overlay (structured output, stateless)
5. TEST: Quality validation on each product
6. DEPLOY: Gradual rollout (10% → 50% → 100%)
7. MONITOR: Quality metrics across all products
8. ITERATE: Version updates based on feedback
```

### 7.2 Agent Deprecation

When retiring an agent:

```
1. ANNOUNCE: 30-day notice to users who use the agent
2. REDIRECT: Suggest replacement agent(s)
3. DISABLE NEW: Stop showing in agent selection
4. MAINTAIN: Keep responding for 30 days (existing users)
5. ARCHIVE: Remove from all products simultaneously
6. CLEAN: Remove from tier lists, documentation, API
```

### 7.3 Agent Performance Reviews

Stone grades every agent (per D2/D5):

```
Agent Performance Review — Monthly
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Agent: Finance Advisor (#12)
Period: February 2026

Interactions:
  Web: 2,340 | Mobile: 890 | API: 450 | Total: 3,680

Quality:
  Accuracy: 92/100 (A-)
  Relevance: 88/100 (B+)
  User Satisfaction: 91% thumbs up
  Error Rate: 0.3%

Performance:
  Avg Response: 3.2s (web), 2.8s (mobile), 2.1s (API)
  P95 Response: 8.1s (web), 6.5s (mobile), 5.2s (API)

Grade: A-
Notes: Strong across all products. Mobile response length
       could be shorter — users scrolling too much.
Recommendation: Tighten mobile overlay to max 300 words.
```

---

## 8. Cross-Product Agent Features

### 8.1 Agent Memory Across Products

When a user interacts with the same agent on different products:

```typescript
interface AgentCrossProductMemory {
  agentId: string;
  userId: string;

  // Shared context (synced across products)
  sharedPreferences: {
    communicationStyle: string;   // Learned from all products
    expertiseLevel: string;       // How much the user knows
    topicInterests: string[];     // What they ask about
  };

  // Product-specific context (kept separate)
  productContexts: {
    "stone-ai": ConversationContext;
    "best-ai-mobile": ConversationContext;
    "stone-ai-tools": ConversationContext;
  };
}
```

**Memory Sync Rules**:
- Preferences sync across products (learned communication style)
- Conversation history stays product-specific
- Topic interests aggregate across products
- If user deletes history on one product, shared preferences remain

### 8.2 Agent Recommendations

Cross-product data improves agent recommendations:

```
User uses "Code Helper" on web and "Finance Advisor" via API
  → System infers: tech-savvy, finance-interested
  → Mobile recommendation: "Try Quick Math on the go"
  → Web recommendation: "Data Analyst combines your two interests"
```

---

## 9. Scaling Agent Operations

### 9.1 Current State (40 agents)

Manageable with manual quality reviews, individual system prompts, and founder oversight.

### 9.2 Growth Plan

| Phase | Agents | Management Approach |
|-------|--------|-------------------|
| Current | 44 | Manual + Stone oversight |
| Month 6 | 44-50 | Automated quality monitoring, manual reviews |
| Month 12 | 50-60 | Agent templates, automated A/B testing |
| Year 2 | 60-100 | Agent creation framework, community agents (curated) |

### 9.3 Community Agents (Future)

Eventually, users could create custom agents that join the marketplace:

```
Creator builds agent → submits for review
  → Quality review (automated + manual)
  → If approved: listed on Tools marketplace
  → Creator earns revenue share per API call
  → Agent available on web + mobile if quality meets threshold
```

---

## 10. Implementation Priorities

### Immediate
- Agent tier mapping defined for all three products
- Mobile overlay framework for existing agents
- API agent configuration for Tools launch

### Short-Term (Month 1-2)
- Cross-product quality monitoring dashboard
- Agent performance reviews automated
- Mobile optimization for top 20 agents

### Medium-Term (Month 3-6)
- Cross-product agent memory
- Agent recommendation engine
- Version rollout automation
- A/B testing for agent prompts

---

*Seed created by Agent Stone (Head 1) + Cardinal (Head 2) — Three-Headed Monster Operations*
*40 agents serving three products is a force multiplier — but only when each agent is adapted for each platform while maintaining its core identity.*
