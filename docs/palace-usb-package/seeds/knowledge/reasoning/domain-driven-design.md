# Domain-Driven Design — Practical for SaaS

## Core Principle

DDD is about aligning your code structure with your business reality. The most important insight: DIFFERENT PARTS OF YOUR BUSINESS USE THE SAME WORDS TO MEAN DIFFERENT THINGS. Recognizing this prevents the tangled, everything-connects-to-everything codebase.

## The Key Insight: User =/= Customer =/= Account

```
In Stone AI:
- "User" in AUTH context = someone who can log in (Clerk identity)
- "User" in BILLING context = someone with a subscription (Stripe customer)
- "User" in CHAT context = someone sending messages (conversation participant)
- "User" in ADMIN context = someone with a role (admin/user/founder)

These are NOT the same thing. They have different:
- Properties (auth user has tokens, billing user has payment methods)
- Behaviors (auth user logs in, billing user upgrades tiers)
- Lifecycles (auth user exists before billing user — free tier has no Stripe)
- Rules (auth user can be suspended, billing user can be refunded)

When you treat them as ONE User model with everything on it,
you get a God Object that every part of the system depends on.
```

## Bounded Contexts in a Next.js App

A Bounded Context is a boundary within which a term has a specific meaning. In Next.js, these map naturally to feature areas:

```
CONTEXT: Identity (Auth)
  Models: AuthUser, Session, Role
  Owns: Login, logout, session management, role checks
  Uses: Clerk
  Files: src/features/auth/**, src/app/api/auth/**

CONTEXT: Billing
  Models: Customer, Subscription, Invoice, PaymentMethod
  Owns: Tier management, payments, invoicing, promos
  Uses: Stripe
  Files: src/features/billing/**, src/app/api/billing/**

CONTEXT: Conversation (Chat)
  Models: Conversation, Message, AgentSession
  Owns: Chat flow, message history, AI routing
  Uses: vLLM, Anthropic API
  Files: src/features/chat/**, src/app/api/chat/**

CONTEXT: Agent Catalog
  Models: Agent, AgentCategory, TierAccess
  Owns: Agent definitions, tier permissions, agent discovery
  Files: src/features/agents/**, src/app/api/agents/**

CONTEXT: Social (Forum + Referrals)
  Models: Post, Comment, ReferralCode, ReferralClaim
  Owns: Forum, referral system, community features
  Files: src/features/social/**, src/app/api/forum/**, src/app/api/referrals/**

CONTEXT: Companion (Bestie)
  Models: Bestie, CommStyle, Trait, BestiePath
  Owns: Bestie creation, customization, companion interactions
  Files: src/features/bestie/**, src/app/api/bestie/**
```

## Context Mapping: How Contexts Communicate

Contexts NEVER reach into each other's internals. They communicate through defined interfaces:

```
PATTERN: Anti-Corruption Layer
  When Context A needs data from Context B, it translates B's model
  into A's terms. A never uses B's types directly.

EXAMPLE:
  Chat context needs to know user's tier (from Billing context).

  WRONG:
    // In chat code, directly importing billing types
    import { Subscription } from '@/features/billing/types';
    const sub = await getSubscription(userId);
    if (sub.tier === 'SMART') { ... }

  RIGHT:
    // Chat context defines what it needs
    interface ChatUserAccess {
      maxAgents: number;
      aiProvider: 'vllm' | 'anthropic';
    }

    // Translation layer converts billing → chat terms
    function getChatAccess(userId: string): ChatUserAccess {
      const tier = await billingService.getUserTier(userId);
      return {
        maxAgents: TIER_CONFIG[tier].agents,
        aiProvider: tier === 'SMART' || tier === 'PRO' ? 'anthropic' : 'vllm',
      };
    }
```

## Only the Parts That Matter

Full DDD has many concepts. For a SaaS at Stone AI's scale, use ONLY these:

### USE: Bounded Contexts
Separate your code into feature areas with clear boundaries. This is the highest-value DDD concept.

### USE: Ubiquitous Language
Use the SAME TERMS in code that the business uses. If the business says "tier," the code says `tier`, not `plan` or `level` or `subscriptionType`.

### USE: Aggregates (simplified)
An aggregate is a cluster of objects that must be consistent together. In Prisma terms: a model and its required relations.

```
AGGREGATE: Bestie
  Root: Bestie model
  Contains: CommStyle, Traits, Path
  Rule: Bestie is always created with a CommStyle
  Rule: Traits are always set as a group, never individually

  → When creating a Bestie, use prisma.$transaction to ensure
    all parts are created together or none are.
```

### USE: Domain Events (lightweight)
When something important happens, emit an event so other contexts can react WITHOUT coupling.

```typescript
// Instead of Chat context directly calling Billing and Analytics:
async function sendMessage(userId: string, message: string) {
  const response = await getAIResponse(message);
  await saveMessage(userId, message, response);

  // Emit event — other contexts handle themselves
  emitEvent('message.sent', {
    userId,
    agentId: currentAgent.id,
    tokenCount: response.tokens,
    timestamp: new Date(),
  });
}

// Billing context listens and updates usage
onEvent('message.sent', async (data) => {
  await incrementUsage(data.userId, data.tokenCount);
});

// Analytics context listens and logs
onEvent('message.sent', async (data) => {
  await logInteraction(data);
});
```

### SKIP: Entity/Value Object distinction
At this scale, Prisma models ARE your entities. Don't add another layer.

### SKIP: Repository Pattern
Prisma IS the repository. Don't wrap it unless you need to swap databases (you don't).

### SKIP: Domain Services
At this scale, your API route handlers and service functions ARE domain services. Don't add ceremony.

### SKIP: Specification Pattern
Use Zod schemas for validation. Don't build a custom specification framework.

## Practical DDD Checklist for New Features

When building a new feature:

```
1. Which context does this belong to?
   → If it spans contexts, it's TWO features, not one.

2. What are the domain terms?
   → Use them in code. No translation needed when reading code.

3. What must be consistent together?
   → That's your aggregate. Use transactions.

4. What other contexts need to know?
   → That's a domain event. Don't couple them directly.

5. What data does this context need from others?
   → Define an interface for it. Don't import their types.
```

## Anti-Patterns to Avoid

### 1. The Shared Database Trap
```
BAD: Every context queries the same User table directly.
     Change the User table → break 6 contexts.

BETTER: Each context has a view or projection of User
        with only the fields it needs.
```

### 2. The Anemic Domain Model
```
BAD: All logic in API route handlers, models are just data bags.
     Business rules scattered across 20 route files.

BETTER: Business rules live near the data they operate on.
        Route handlers orchestrate, they don't contain logic.
```

### 3. The Big Ball of Mud
```
BAD: No boundaries. Any file imports from any other file.
     Circular dependencies. Everything changes together.

BETTER: Clear boundaries. Imports only cross boundaries
        through defined interfaces.
```

## Integration

- **Architecture Decisions** determine how contexts are deployed
- **SOLID Principles** apply within each context
- **Code Smells** often indicate context boundary violations
- **Scope Control** prevents context creep during development
