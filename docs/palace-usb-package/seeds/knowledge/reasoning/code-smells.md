# Code Smells

## Core Principle

Code smells are patterns that indicate deeper design problems. They're not bugs — the code works. But they signal that the code will become harder to maintain, extend, and debug over time. Detecting smells early prevents technical debt from compounding.

## Detection and Refactoring Guide

### 1. Long Method / Function

**Detection:** Function exceeds 20-30 lines. You need to scroll to see it all. It does multiple distinct things.

**Why it's bad:** Hard to test, hard to name, hard to reuse parts of it.

**Refactoring move:** Extract Method — pull each logical section into its own function.

```typescript
// SMELL: One function doing everything
async function handleUserSignup(data: SignupData) {
  // Validate input (10 lines)
  // Create user in DB (5 lines)
  // Send welcome email (8 lines)
  // Create default bestie (12 lines)
  // Log analytics event (5 lines)
  // Return response (3 lines)
}

// FIXED: Each concern is a separate function
async function handleUserSignup(data: SignupData) {
  const validated = validateSignupData(data);
  const user = await createUser(validated);
  await Promise.all([
    sendWelcomeEmail(user),
    createDefaultBestie(user.id),
    logAnalyticsEvent('signup', user.id),
  ]);
  return formatSignupResponse(user);
}
```

### 2. Feature Envy

**Detection:** A function accesses data from another object/module more than its own. It's reaching into someone else's domain.

**Why it's bad:** Logic is in the wrong place. Changes to the other object break this function.

**Refactoring move:** Move Method — put the logic where the data lives.

```typescript
// SMELL: BillingService reaching into User's internals
function calculateDiscount(user: User) {
  if (user.subscription.tier === 'PRO' && user.subscription.annualBilling) {
    return user.subscription.basePrice * 0.15;
  }
  if (user.referralCount > 5) {
    return user.subscription.basePrice * 0.05;
  }
  return 0;
}

// FIXED: Discount logic lives on Subscription where the data is
class SubscriptionService {
  calculateDiscount(subscription: Subscription, referralCount: number): number {
    if (subscription.tier === 'PRO' && subscription.annualBilling) {
      return subscription.basePrice * 0.15;
    }
    if (referralCount > 5) {
      return subscription.basePrice * 0.05;
    }
    return 0;
  }
}
```

### 3. God Object / God Module

**Detection:** One file/class/module that everything depends on. It knows about everything and does everything. Over 500 lines. Imported by most of the codebase.

**Why it's bad:** Any change risks breaking unrelated features. Impossible to test in isolation.

**Refactoring move:** Extract Class/Module — split by responsibility.

```typescript
// SMELL: lib/utils.ts with 50 exports covering auth, billing, formatting, AI, etc.
// Every file imports from utils.ts
// utils.ts is 2000 lines

// FIXED: Split by domain
// lib/auth/utils.ts — auth-specific utilities
// lib/billing/utils.ts — billing calculations
// lib/format/utils.ts — formatting helpers
// lib/ai/utils.ts — AI provider utilities
```

### 4. Primitive Obsession

**Detection:** Using strings, numbers, or booleans to represent domain concepts. Passing raw primitives through multiple functions instead of creating a type.

**Why it's bad:** No validation at the type level. Easy to pass the wrong string to the right parameter.

**Refactoring move:** Replace Primitive with Value Object/Type.

```typescript
// SMELL: Primitives everywhere
function createSubscription(
  userId: string,
  tier: string,
  price: number,
  currency: string,
  interval: string,
) { ... }

// Can call with createSubscription("user1", "INVALID_TIER", -50, "fake", "never")

// FIXED: Domain types enforce validity
type SubscriptionTier = 'FREE' | 'STARTER' | 'PLUS' | 'SMART' | 'PRO';
type Currency = 'USD' | 'EUR' | 'GBP';
type BillingInterval = 'monthly' | 'annual';

interface CreateSubscriptionInput {
  userId: string;
  tier: SubscriptionTier;
  priceInCents: number; // Always cents, never dollars
  currency: Currency;
  interval: BillingInterval;
}

function createSubscription(input: CreateSubscriptionInput) { ... }
```

### 5. Shotgun Surgery

**Detection:** A single logical change requires edits in 5+ files. Adding a new agent tier requires changes in: schema, API, frontend, billing, permissions, tests, docs.

**Why it's bad:** Easy to miss a file. High risk of incomplete changes.

**Refactoring move:** Consolidate — put related logic together so one change = one file.

```typescript
// SMELL: Tier info scattered across 6 files
// schema.prisma — tier enum
// lib/permissions.ts — tier access rules
// lib/billing.ts — tier prices
// components/PricingTable.tsx — tier display
// api/agents/route.ts — tier checks
// lib/constants.ts — tier agent counts

// FIXED: Single source of truth
// lib/tiers/config.ts
export const TIER_CONFIG = {
  FREE: { agents: 4, price: 0, features: [...] },
  STARTER: { agents: 16, price: 1999, features: [...] },
  PLUS: { agents: 30, price: 4999, features: [...] },
  SMART: { agents: 39, price: 9999, features: [...] },
  PRO: { agents: 38, price: 20000, features: [...] },
} as const;

// All other files import from TIER_CONFIG
// Adding a tier = editing ONE file
```

### 6. Data Clumps

**Detection:** The same group of parameters appears together in multiple function signatures.

**Why it's bad:** If one parameter changes, every function signature changes.

**Refactoring move:** Extract Parameter Object.

```typescript
// SMELL: Same 4 params everywhere
function logEvent(userId: string, eventType: string, timestamp: Date, metadata: object) { ... }
function validateEvent(userId: string, eventType: string, timestamp: Date, metadata: object) { ... }
function storeEvent(userId: string, eventType: string, timestamp: Date, metadata: object) { ... }

// FIXED: Parameter object
interface AnalyticsEvent {
  userId: string;
  eventType: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

function logEvent(event: AnalyticsEvent) { ... }
function validateEvent(event: AnalyticsEvent) { ... }
function storeEvent(event: AnalyticsEvent) { ... }
```

### 7. Divergent Change

**Detection:** One file changes for multiple, unrelated reasons. User model changes when auth logic changes AND when billing changes AND when profile changes.

**Why it's bad:** High change frequency = high bug frequency. Unrelated changes conflict.

**Refactoring move:** Extract into separate modules, each with one reason to change.

### 8. Parallel Inheritance Hierarchies

**Detection:** Every time you add a subclass in one hierarchy, you have to add one in another.

**Why it's bad:** Duplication. Forgetting to add to both hierarchies causes bugs.

**Refactoring move:** Merge hierarchies or use composition instead of inheritance.

### 9. Speculative Generality

**Detection:** Abstract base classes, interfaces, or patterns that are only implemented once. "We might need this later."

**Why it's bad:** Complexity without benefit. The abstraction is probably wrong because you don't have enough examples.

**Refactoring move:** Collapse Hierarchy — inline the abstraction. Add it back when you have 3 concrete uses.

```typescript
// SMELL: Abstract factory for something that's only ever one thing
interface AIProvider {
  generateResponse(prompt: string): Promise<string>;
}
class AnthropicProvider implements AIProvider { ... }
class AIProviderFactory {
  static create(type: string): AIProvider { ... }
}

// If you ONLY use Anthropic + vLLM, you don't need a factory.
// FIXED: Direct implementation
const anthropic = new AnthropicClient(config);
const vllm = new VLLMClient(config);

// Add the abstraction when you add a THIRD provider
```

### 10. Dead Code

**Detection:** Functions, variables, imports, or entire files that are never called/used. Commented-out code "just in case."

**Why it's bad:** Confuses readers. Increases cognitive load. May have side effects during refactoring if someone mistakes it for live code.

**Refactoring move:** Delete it. Git has history if you need it back.

### 11. Middle Man

**Detection:** A class/function that does nothing except delegate to another.

**Why it's bad:** Extra indirection with no value. Makes the call chain harder to follow.

**Refactoring move:** Remove Middle Man — call the real thing directly.

```typescript
// SMELL: Service that just passes through
class UserService {
  async getUser(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }
  async updateUser(id: string, data: any) {
    return prisma.user.update({ where: { id }, data });
  }
}

// If UserService adds NO business logic, it's a middle man.
// Call Prisma directly from the route handler.
// Add the service layer when business logic appears.
```

### 12. Inappropriate Intimacy

**Detection:** Two modules access each other's internal details. Circular imports. Module A imports private helpers from Module B.

**Why it's bad:** Tight coupling. Can't change one without breaking the other.

**Refactoring move:** Define a clean interface between modules. Hide internals.

### 13. Comments as Deodorant

**Detection:** Comments explaining WHAT the code does (not WHY). Long comments compensating for unclear code.

**Why it's bad:** The code should be self-explanatory. Comments go stale when code changes.

**Refactoring move:** Rename variables/functions to explain intent. Extract complex logic into well-named functions.

```typescript
// SMELL
// Check if user can access this agent
if (user.tier >= agent.minTier && user.status === 'active' && !agent.disabled) {

// FIXED: Self-documenting
const canAccessAgent = userHasRequiredTier(user, agent)
  && user.status === 'active'
  && agent.isEnabled;
```

### 14. Magic Numbers / Strings

**Detection:** Literal values in code without explanation. `if (count > 42)`, `role === "admin"`.

**Why it's bad:** No one knows why 42. If the number changes, you have to find every occurrence.

**Refactoring move:** Extract to named constant.

```typescript
// SMELL
if (agents.length > 38) throw new Error('Too many agents');

// FIXED
const MAX_PUBLIC_AGENTS = 38;
if (agents.length > MAX_PUBLIC_AGENTS) throw new Error('Too many agents');
```

### 15. Boolean Parameters

**Detection:** Functions that take boolean flags to change behavior.

**Why it's bad:** Callers can't tell what `true` or `false` means without reading the implementation. The function is doing two things.

**Refactoring move:** Split into two functions with descriptive names.

```typescript
// SMELL
function getAgents(includeHidden: boolean) { ... }
getAgents(true);  // What does true mean?
getAgents(false); // What does false mean?

// FIXED
function getPublicAgents() { ... }
function getAllAgentsIncludingHidden() { ... }
```

## Quick Detection Checklist

When reviewing any code, scan for:

```
[] Any function over 30 lines? → Long Method
[] Any file over 300 lines? → God Object candidate
[] Same parameters in 3+ functions? → Data Clumps
[] Raw strings for domain concepts? → Primitive Obsession
[] Commented-out code? → Dead Code
[] Comments explaining "what" not "why"? → Comments as Deodorant
[] Magic numbers? → Extract constants
[] Boolean parameters? → Split functions
[] One change requires 5+ file edits? → Shotgun Surgery
[] Unused imports/functions? → Dead Code
```

## Integration

- Apply during **Code Review** (grade agents on smell detection)
- Use **SOLID Principles** as the fix framework for many smells
- **Theory of Constraints** helps prioritize which smells to fix first
- **Second-Order Effects** predicts what happens if you DON'T fix a smell
