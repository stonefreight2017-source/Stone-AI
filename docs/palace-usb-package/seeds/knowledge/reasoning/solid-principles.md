# SOLID Principles — Decision Rules

## Core Principle

SOLID principles are not rules to memorize. They're DECISION RULES you apply when writing or reviewing code. Before every class, module, or function, ask the relevant question. If the answer is wrong, refactor.

## S — Single Responsibility Principle

**Decision question:** "Does this module have exactly ONE reason to change?"

A "reason to change" means one stakeholder or one business requirement that could trigger a modification.

**How to check:**
```
1. List who/what could cause this module to change:
   - UI designer wants different layout? → That's a reason
   - Business rules change? → That's a different reason
   - Database schema changes? → That's a third reason

2. If more than one → split the module
```

**TypeScript example — violation:**
```typescript
// BAD: This component has 3 reasons to change
// 1. Display logic changes (UI)
// 2. Business rules change (pricing)
// 3. API contract changes (data fetching)
export function PricingPage() {
  const res = await fetch('/api/pricing');
  const tiers = await res.json();

  const discountedTiers = tiers.map(t => ({
    ...t,
    price: t.annual ? t.price * 0.85 : t.price, // Business rule
  }));

  return (
    <div className="grid grid-cols-5 gap-4">
      {discountedTiers.map(tier => (
        <div key={tier.id} className="rounded-lg border p-6">
          <h3>{tier.name}</h3>
          <p>${tier.price}/mo</p>
        </div>
      ))}
    </div>
  );
}
```

**Fixed:**
```typescript
// Data fetching — changes when API changes
async function fetchTiers(): Promise<Tier[]> {
  const res = await fetch('/api/pricing');
  return res.json();
}

// Business logic — changes when pricing rules change
function applyDiscounts(tiers: Tier[]): Tier[] {
  return tiers.map(t => ({
    ...t,
    price: t.annual ? t.price * 0.85 : t.price,
  }));
}

// Display — changes when UI changes
function TierCard({ tier }: { tier: Tier }) {
  return (
    <div className="rounded-lg border p-6">
      <h3>{tier.name}</h3>
      <p>${tier.price}/mo</p>
    </div>
  );
}

// Composition — assembles the parts
export async function PricingPage() {
  const tiers = await fetchTiers();
  const discounted = applyDiscounts(tiers);
  return (
    <div className="grid grid-cols-5 gap-4">
      {discounted.map(t => <TierCard key={t.id} tier={t} />)}
    </div>
  );
}
```

## O — Open/Closed Principle

**Decision question:** "Can I add new behavior WITHOUT modifying existing code?"

Modules should be open for extension, closed for modification.

**How to check:**
```
1. Imagine a new requirement (e.g., new agent tier, new AI provider)
2. How many existing files do you need to EDIT?
3. If more than 1-2 → the design isn't open for extension
```

**TypeScript example — violation:**
```typescript
// BAD: Adding a new AI provider requires editing this function
function getAIResponse(provider: string, prompt: string) {
  if (provider === 'anthropic') {
    return callAnthropic(prompt);
  } else if (provider === 'vllm') {
    return callVLLM(prompt);
  } else if (provider === 'openai') { // Had to modify existing code
    return callOpenAI(prompt);
  }
  throw new Error('Unknown provider');
}
```

**Fixed:**
```typescript
// GOOD: Adding a provider = adding a new entry, not editing logic
interface AIProvider {
  name: string;
  generateResponse(prompt: string): Promise<string>;
}

const providers: Map<string, AIProvider> = new Map();

function registerProvider(provider: AIProvider) {
  providers.set(provider.name, provider);
}

function getAIResponse(providerName: string, prompt: string) {
  const provider = providers.get(providerName);
  if (!provider) throw new Error(`Unknown provider: ${providerName}`);
  return provider.generateResponse(prompt);
}

// Adding a new provider — no existing code modified
registerProvider({
  name: 'anthropic',
  generateResponse: (prompt) => callAnthropic(prompt),
});
registerProvider({
  name: 'vllm',
  generateResponse: (prompt) => callVLLM(prompt),
});
```

**When to NOT apply O/C:**
- When you have only 2 cases and a third is unlikely
- When the abstraction would be more complex than the if/else
- When requirements are still unclear (premature abstraction)

## L — Liskov Substitution Principle

**Decision question:** "Can I swap any implementation for another without breaking the calling code?"

If code works with a base type, it must work with any subtype without knowing the difference.

**How to check:**
```
1. Find every place the base type is used
2. Replace it with each subtype
3. Does it still work correctly?
4. Does it maintain the same guarantees (return types, error handling)?
```

**TypeScript example — violation:**
```typescript
// BAD: ReadOnlyUser breaks code that expects full User behavior
interface User {
  getName(): string;
  setName(name: string): void;
}

class RegularUser implements User {
  getName() { return this.name; }
  setName(name: string) { this.name = name; }
}

class ReadOnlyUser implements User {
  getName() { return this.name; }
  setName(name: string) {
    throw new Error("Can't modify read-only user"); // BREAKS LSP
  }
}

// This function works with RegularUser but crashes with ReadOnlyUser
function updateUserName(user: User, name: string) {
  user.setName(name); // Crashes if ReadOnlyUser
}
```

**Fixed:**
```typescript
// GOOD: Separate interfaces for separate capabilities
interface Readable {
  getName(): string;
}

interface Writable extends Readable {
  setName(name: string): void;
}

class RegularUser implements Writable {
  getName() { return this.name; }
  setName(name: string) { this.name = name; }
}

class ReadOnlyUser implements Readable {
  getName() { return this.name; }
  // No setName — doesn't promise what it can't deliver
}

function updateUserName(user: Writable, name: string) {
  user.setName(name); // Type system prevents passing ReadOnlyUser
}
```

## I — Interface Segregation Principle

**Decision question:** "Is any implementer forced to implement methods it doesn't use?"

Many small, specific interfaces beat one large, general interface.

**How to check:**
```
1. Look at each class implementing the interface
2. Are there methods that do nothing or throw "not implemented"?
3. If yes → the interface is too fat → split it
```

**TypeScript example — violation:**
```typescript
// BAD: All agents must implement everything, even if irrelevant
interface Agent {
  processText(input: string): string;
  processImage(input: Buffer): Buffer;
  processAudio(input: Buffer): Buffer;
  generateCode(prompt: string): string;
  analyzeSentiment(text: string): number;
}

// Most agents only do 1-2 of these
class CopywriterAgent implements Agent {
  processText(input: string) { return "..."; }
  processImage(input: Buffer) { throw new Error("Not supported"); } // WASTE
  processAudio(input: Buffer) { throw new Error("Not supported"); } // WASTE
  generateCode(prompt: string) { throw new Error("Not supported"); } // WASTE
  analyzeSentiment(text: string) { throw new Error("Not supported"); } // WASTE
}
```

**Fixed:**
```typescript
// GOOD: Small, focused interfaces
interface TextProcessor {
  processText(input: string): string;
}

interface CodeGenerator {
  generateCode(prompt: string): string;
}

interface SentimentAnalyzer {
  analyzeSentiment(text: string): number;
}

// Each agent implements only what it does
class CopywriterAgent implements TextProcessor {
  processText(input: string) { return "..."; }
}

class CodeAssistant implements TextProcessor, CodeGenerator {
  processText(input: string) { return "..."; }
  generateCode(prompt: string) { return "..."; }
}
```

## D — Dependency Inversion Principle

**Decision question:** "Does this module depend on concrete implementations or on abstractions?"

High-level modules should not depend on low-level modules. Both should depend on abstractions.

**How to check:**
```
1. Look at the import statements
2. Is the module importing specific implementations?
   (e.g., importing PrismaClient directly in a service)
3. If the implementation changes, does this module need to change?
4. If yes → inject the dependency instead of importing it
```

**TypeScript example — violation:**
```typescript
// BAD: Service directly depends on Prisma
import { PrismaClient } from '@prisma/client';

class UserService {
  private prisma = new PrismaClient();

  async getUser(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
// Can't test without a real database
// Can't swap to a different ORM without editing UserService
```

**Fixed:**
```typescript
// GOOD: Service depends on an abstraction
interface UserRepository {
  findById(id: string): Promise<User | null>;
}

class UserService {
  constructor(private repo: UserRepository) {}

  async getUser(id: string) {
    return this.repo.findById(id);
  }
}

// Prisma implementation
class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}

// Test implementation
class MockUserRepository implements UserRepository {
  async findById(id: string) {
    return { id, name: 'Test User' };
  }
}
```

**When to NOT apply DI in Next.js:**
- API route handlers that directly use Prisma for simple CRUD — the overhead isn't worth it
- Components that directly call APIs — React components aren't swappable anyway
- Apply DI where you need testability or where implementations might actually change

## SOLID Decision Flowchart

Before writing any module:

```
1. What reasons could cause this to change?
   → More than one? Split. (SRP)

2. What if I need to add a variant?
   → Need to edit existing code? Redesign for extension. (OCP)

3. Can all implementations be swapped freely?
   → Some break callers? Fix the interface hierarchy. (LSP)

4. Do implementers have unused methods?
   → Yes? Split the interface. (ISP)

5. Does this import concrete implementations?
   → Could those change? Inject abstractions. (DIP)
```

## Pragmatic Application

SOLID is a tool, not a religion. In a Next.js SaaS:

- **SRP**: Apply everywhere. It's always valuable.
- **OCP**: Apply to things that actually VARY (AI providers, tier definitions). Don't abstract things with one implementation.
- **LSP**: Apply to shared interfaces. Less relevant in a component-based UI.
- **ISP**: Apply to service interfaces. TypeScript makes this easy with union types.
- **DIP**: Apply to external dependencies (DB, AI, auth). Overkill for internal utilities.

## Integration

- **Code Smells** often indicate SOLID violations
- **Architecture Decisions** use SOLID as evaluation criteria
- **Testing Strategy** depends on SOLID (DIP enables mocking)
- **Domain-Driven Design** is SOLID applied at the domain level
