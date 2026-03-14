# Advanced TypeScript Patterns for Next.js SaaS Applications

> Palace Knowledge Seed -- Engineering Division
> Classification: Core TypeScript Architecture Patterns
> Target: Senior engineers building production Next.js + Prisma + Zod SaaS platforms

---

## 1. Generic Constraints

Generics with constraints enforce that type parameters meet structural requirements at compile time. This eliminates runtime checks and guarantees API contracts.

### Basic Constraint

```typescript
// Ensures T has an `id` field -- works for any entity
function getEntityId<T extends { id: string }>(entity: T): string {
  return entity.id;
}

// Usage with Prisma models
const userId = getEntityId({ id: "usr_123", name: "Stone", plan: "PRO" });
const agentId = getEntityId({ id: "agt_007", specialty: "security" });
```

### Constrained Key Access

```typescript
// K must be an actual key of T -- prevents accessing nonexistent properties
function pluck<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

interface User {
  id: string;
  email: string;
  plan: "FREE" | "STARTER" | "PLUS" | "SMART" | "PRO";
  createdAt: Date;
}

const plan = pluck<User, "plan">({ id: "1", email: "a@b.com", plan: "PRO", createdAt: new Date() }, "plan");
// type of plan is "FREE" | "STARTER" | "PLUS" | "SMART" | "PRO"
```

### Multiple Constraints with Intersection

```typescript
interface HasTimestamps {
  createdAt: Date;
  updatedAt: Date;
}

interface HasOwner {
  userId: string;
}

// T must have both timestamps AND an owner
function auditLog<T extends HasTimestamps & HasOwner>(entity: T): string {
  return `User ${entity.userId} last modified at ${entity.updatedAt.toISOString()}`;
}
```

### Constructor Constraint

```typescript
// Constrain T to something that can be instantiated with `new`
function createInstance<T>(ctor: new (...args: any[]) => T, ...args: any[]): T {
  return new ctor(...args);
}

class NotificationService {
  constructor(public channel: string) {}
}

const svc = createInstance(NotificationService, "email");
// svc is typed as NotificationService
```

---

## 2. Conditional Types

Conditional types select one of two possible types based on a condition. They are the `if/else` of the type system.

### Basic Conditional

```typescript
type IsString<T> = T extends string ? true : false;

type A = IsString<"hello">; // true
type B = IsString<42>;      // false
```

### API Response Typing

```typescript
// Different response shapes based on whether the request includes expansion
type ApiResponse<T, Expand extends boolean = false> =
  Expand extends true
    ? { data: T; _embedded: Record<string, unknown>; _links: Record<string, string> }
    : { data: T };

// Narrow function return based on the expand flag
async function fetchAgent<E extends boolean = false>(
  id: string,
  options?: { expand?: E }
): Promise<ApiResponse<Agent, E>> {
  const res = await fetch(`/api/agents/${id}?expand=${options?.expand ?? false}`);
  return res.json();
}

// Caller gets precise type
const slim = await fetchAgent("agt_1");               // { data: Agent }
const full = await fetchAgent("agt_1", { expand: true }); // { data: Agent; _embedded: ...; _links: ... }
```

### Inferring Within Conditions

```typescript
// Extract the resolved type from a Promise
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

type X = UnwrapPromise<Promise<string>>;  // string
type Y = UnwrapPromise<number>;           // number

// Extract element type from an array
type ElementOf<T> = T extends (infer E)[] ? E : never;

type Z = ElementOf<string[]>;  // string
```

### Recursive Conditional Types

```typescript
// Deeply unwrap nested promises
type DeepUnwrap<T> = T extends Promise<infer U> ? DeepUnwrap<U> : T;

type Nested = Promise<Promise<Promise<string>>>;
type Flat = DeepUnwrap<Nested>; // string
```

---

## 3. Mapped Types

Mapped types transform every property of an existing type according to a rule.

### Making All Fields Optional for PATCH Endpoints

```typescript
// Built-in Partial does this, but here is the mechanism
type PatchPayload<T> = {
  [K in keyof T]?: T[K];
};

interface AgentConfig {
  name: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

type AgentPatch = PatchPayload<AgentConfig>;
// { name?: string; model?: string; temperature?: number; maxTokens?: number }
```

### Remapping Keys with `as`

```typescript
// Create event handler types from a union of event names
type EventHandlers<Events extends string> = {
  [E in Events as `on${Capitalize<E>}`]: (payload: unknown) => void;
};

type ChatEvents = EventHandlers<"message" | "typing" | "disconnect">;
// { onMessage: ...; onTyping: ...; onDisconnect: ... }
```

### Filtering Properties by Value Type

```typescript
// Keep only properties whose value extends a target type
type PickByValue<T, V> = {
  [K in keyof T as T[K] extends V ? K : never]: T[K];
};

interface UserRow {
  id: string;
  name: string;
  age: number;
  isActive: boolean;
  createdAt: Date;
}

type StringFields = PickByValue<UserRow, string>;
// { id: string; name: string }
```

### Deep Readonly

```typescript
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepReadonly<T[K]>
    : T[K];
};

const config: DeepReadonly<{ db: { host: string; port: number } }> = {
  db: { host: "localhost", port: 5432 },
};

// config.db.host = "other"; // Error: Cannot assign to 'host' because it is a read-only property
```

---

## 4. Template Literal Types

Template literal types build string types from other string types using template literal syntax.

### API Route Builder

```typescript
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type ApiVersion = "v1" | "v2";
type Resource = "users" | "agents" | "subscriptions" | "chats";

type ApiEndpoint = `/${ApiVersion}/${Resource}`;
// "/v1/users" | "/v1/agents" | "/v1/subscriptions" | ... (all 8 combos)

type RouteKey = `${Uppercase<HttpMethod>} ${ApiEndpoint}`;
// "GET /v1/users" | "POST /v1/agents" | ... (all 40 combos)
```

### Environment Variable Keys

```typescript
type EnvPrefix = "NEXT_PUBLIC" | "CLERK" | "STRIPE" | "DATABASE";

type EnvKey<P extends string, S extends string> = `${P}_${Uppercase<S>}`;

type ClerkEnv = EnvKey<"CLERK", "publishable_key" | "secret_key">;
// "CLERK_PUBLISHABLE_KEY" | "CLERK_SECRET_KEY"

// Type-safe env access
function getEnv<K extends string>(key: K): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env: ${key}`);
  return val;
}
```

### CSS Class Builder Types

```typescript
type Size = "sm" | "md" | "lg" | "xl";
type Variant = "primary" | "secondary" | "ghost" | "destructive";

type ButtonClass = `btn-${Variant}` | `btn-${Size}`;
// "btn-primary" | "btn-secondary" | "btn-ghost" | "btn-destructive" | "btn-sm" | "btn-md" | "btn-lg" | "btn-xl"

type SpacingDirection = "t" | "b" | "l" | "r" | "x" | "y";
type SpacingValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16;
type TailwindPadding = `p${SpacingDirection}-${SpacingValue}`;
// "pt-0" | "pt-1" | ... | "py-16" -- all 72 combinations
```

---

## 5. The `satisfies` Operator

`satisfies` validates that an expression matches a type WITHOUT widening it. You get both type safety and literal inference.

### Config Objects

```typescript
type RouteConfig = {
  [path: string]: {
    auth: boolean;
    roles?: ("user" | "admin" | "founder")[];
    rateLimit?: number;
  };
};

// WITHOUT satisfies: type is RouteConfig, all keys are `string`
const routesBad: RouteConfig = {
  "/api/chat": { auth: true, rateLimit: 60 },
  "/api/admin": { auth: true, roles: ["admin", "founder"] },
};

// WITH satisfies: keys are literal, values are validated
const routes = {
  "/api/chat": { auth: true, rateLimit: 60 },
  "/api/admin": { auth: true, roles: ["admin", "founder"] },
} satisfies RouteConfig;

// routes["/api/chat"] -- autocompletes! TypeScript knows the exact keys
// routes["/api/chat"].rateLimit -- type is `number`, not `number | undefined`
```

### Theme Configuration

```typescript
type ThemeColors = Record<string, string>;

const palette = {
  background: "#0a0a0a",
  foreground: "#ffffff",
  primary: "#6d28d9",
  accent: "#f59e0b",
  destructive: "#ef4444",
} satisfies ThemeColors;

// palette.primary is type `string` AND you get autocomplete for the key names
// palette.typo -- Error at compile time (unlike plain Record<string, string>)
```

### Pricing Tier Definitions

```typescript
type PlanId = "FREE" | "STARTER" | "PLUS" | "SMART" | "PRO";

interface PlanDefinition {
  price: number;
  annualPrice?: number;
  agentCount: number;
  features: string[];
}

const plans = {
  FREE:    { price: 0,      agentCount: 4,  features: ["basic-chat"] },
  STARTER: { price: 19.99,  agentCount: 16, features: ["basic-chat", "bestie"] },
  PLUS:    { price: 49.99,  agentCount: 30, features: ["basic-chat", "bestie", "forum"] },
  SMART:   { price: 99.99,  annualPrice: 79.99, agentCount: 39, features: ["basic-chat", "bestie", "forum", "smart-agents"] },
  PRO:     { price: 200,    annualPrice: 170,   agentCount: 42, features: ["basic-chat", "bestie", "forum", "smart-agents", "pro-exclusive"] },
} satisfies Record<PlanId, PlanDefinition>;

// plans.SMART.annualPrice is `number`, not `number | undefined` -- TS knows it exists
```

---

## 6. `as const` Assertions

`as const` makes TypeScript infer the narrowest possible literal types and marks everything readonly.

### Literal Union from Array

```typescript
const PLANS = ["FREE", "STARTER", "PLUS", "SMART", "PRO"] as const;
type Plan = (typeof PLANS)[number];
// "FREE" | "STARTER" | "PLUS" | "SMART" | "PRO"

// Now you can use the array at runtime AND the type at compile time
function isValidPlan(s: string): s is Plan {
  return (PLANS as readonly string[]).includes(s);
}
```

### Enum-like Objects

```typescript
const AgentTier = {
  FREE: 0,
  STARTER: 1,
  PLUS: 2,
  SMART: 3,
  PRO: 4,
} as const;

type AgentTierName = keyof typeof AgentTier;      // "FREE" | "STARTER" | "PLUS" | "SMART" | "PRO"
type AgentTierLevel = (typeof AgentTier)[AgentTierName]; // 0 | 1 | 2 | 3 | 4

function hasAccess(userTier: AgentTierLevel, requiredTier: AgentTierLevel): boolean {
  return userTier >= requiredTier;
}
```

### Route Definitions

```typescript
const ROUTES = {
  home: "/",
  chat: "/chat",
  agents: "/agents",
  settings: "/settings",
  admin: "/admin",
  billing: "/billing",
  forum: "/forum",
  help: "/help",
} as const;

type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
// "/" | "/chat" | "/agents" | "/settings" | "/admin" | "/billing" | "/forum" | "/help"

function navigate(path: RoutePath) {
  // Only valid routes accepted
}

navigate(ROUTES.chat);   // OK
// navigate("/typo");     // Error
```

---

## 7. Discriminated Unions

Discriminated unions use a common literal property (the discriminant) to narrow types in branches. Essential for event systems, state machines, and API responses.

### Agent Action System

```typescript
type AgentAction =
  | { type: "chat.message";   agentId: string; content: string; timestamp: Date }
  | { type: "chat.typing";    agentId: string; isTyping: boolean }
  | { type: "agent.error";    agentId: string; error: string; code: number }
  | { type: "agent.complete"; agentId: string; tokensUsed: number; duration: number };

function handleAction(action: AgentAction) {
  switch (action.type) {
    case "chat.message":
      // TypeScript knows: action has `content` and `timestamp`
      console.log(`[${action.timestamp.toISOString()}] ${action.content}`);
      break;
    case "chat.typing":
      // TypeScript knows: action has `isTyping`
      updateTypingIndicator(action.agentId, action.isTyping);
      break;
    case "agent.error":
      // TypeScript knows: action has `error` and `code`
      reportError(action.agentId, action.code, action.error);
      break;
    case "agent.complete":
      // TypeScript knows: action has `tokensUsed` and `duration`
      logUsage(action.agentId, action.tokensUsed, action.duration);
      break;
  }
}
```

### API Result Type

```typescript
type Result<T, E = Error> =
  | { ok: true; data: T }
  | { ok: false; error: E };

async function safeFetch<T>(url: string): Promise<Result<T, string>> {
  try {
    const res = await fetch(url);
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const data: T = await res.json();
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

// Usage -- narrowing is automatic
const result = await safeFetch<User[]>("/api/users");
if (result.ok) {
  // result.data is User[]
  renderUsers(result.data);
} else {
  // result.error is string
  showError(result.error);
}
```

### Subscription State Machine

```typescript
type SubscriptionState =
  | { status: "trialing";  trialEndsAt: Date; plan: Plan }
  | { status: "active";    currentPeriodEnd: Date; plan: Plan }
  | { status: "past_due";  retryAt: Date; failCount: number; plan: Plan }
  | { status: "canceled";  canceledAt: Date; accessUntil: Date }
  | { status: "expired";   expiredAt: Date };

function getAccessLevel(sub: SubscriptionState): number {
  switch (sub.status) {
    case "trialing":
    case "active":
      return plans[sub.plan].agentCount; // sub.plan is available
    case "past_due":
      return sub.failCount < 3 ? plans[sub.plan].agentCount : 4; // Degrade after 3 failures
    case "canceled":
      return new Date() < sub.accessUntil ? 4 : 0; // Grace period
    case "expired":
      return 0;
  }
}
```

---

## 8. Type Guards (User-Defined)

Type guards are functions that return `x is Type`, letting TypeScript narrow types in conditional blocks.

### Runtime Model Validation

```typescript
interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

function isChatMessage(val: unknown): val is ChatMessage {
  if (typeof val !== "object" || val === null) return false;
  const obj = val as Record<string, unknown>;
  return (
    typeof obj.id === "string" &&
    typeof obj.content === "string" &&
    typeof obj.createdAt === "string" &&
    (obj.role === "user" || obj.role === "assistant" || obj.role === "system")
  );
}

// Usage in API route
export async function POST(req: Request) {
  const body = await req.json();
  if (!isChatMessage(body)) {
    return Response.json({ error: "Invalid message format" }, { status: 400 });
  }
  // body is now ChatMessage -- fully typed
  await saveMessage(body);
}
```

### Assertion Functions

```typescript
// Throws instead of returning boolean -- narrows in the current scope
function assertDefined<T>(val: T | null | undefined, name: string): asserts val is T {
  if (val === null || val === undefined) {
    throw new Error(`Expected ${name} to be defined, got ${val}`);
  }
}

async function getUser(clerkId: string) {
  const user = await prisma.user.findUnique({ where: { clerkId } });
  assertDefined(user, "user");
  // user is now User (not User | null)
  return user;
}
```

### Discriminant Guard Factory

```typescript
// Factory that creates type guards for discriminated unions
function isActionType<T extends AgentAction["type"]>(type: T) {
  return (action: AgentAction): action is Extract<AgentAction, { type: T }> => {
    return action.type === type;
  };
}

const isErrorAction = isActionType("agent.error");
const isMessageAction = isActionType("chat.message");

// Usage
const actions: AgentAction[] = getActions();
const errors = actions.filter(isErrorAction);
// errors is (AgentAction & { type: "agent.error" })[] -- fully narrowed
```

---

## 9. Branded Types (Nominal Typing)

TypeScript uses structural typing, meaning two types with identical shapes are interchangeable. Branded types add a phantom property to prevent mixing up structurally identical values.

### ID Safety

```typescript
// Brand utility
type Brand<T, B extends string> = T & { readonly __brand: B };

type UserId = Brand<string, "UserId">;
type AgentId = Brand<string, "AgentId">;
type ChatId = Brand<string, "ChatId">;

// Constructor functions
function UserId(id: string): UserId { return id as UserId; }
function AgentId(id: string): AgentId { return id as AgentId; }
function ChatId(id: string): ChatId { return id as ChatId; }

// Now these are incompatible even though both are strings
function getAgent(id: AgentId): Promise<Agent> { /* ... */ }
function getUser(id: UserId): Promise<User> { /* ... */ }

const uid = UserId("usr_123");
const aid = AgentId("agt_456");

getAgent(aid); // OK
// getAgent(uid); // Error: UserId is not assignable to AgentId
```

### Validated Strings

```typescript
type Email = Brand<string, "Email">;
type NonEmptyString = Brand<string, "NonEmptyString">;
type PositiveInt = Brand<number, "PositiveInt">;

function validateEmail(input: string): Email {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(input)) throw new Error(`Invalid email: ${input}`);
  return input as Email;
}

function positiveInt(n: number): PositiveInt {
  if (!Number.isInteger(n) || n <= 0) throw new Error(`Not a positive integer: ${n}`);
  return n as PositiveInt;
}

// API endpoint that requires validated inputs
async function createUser(email: Email, maxAgents: PositiveInt) {
  // No need to re-validate -- the types guarantee it was validated at the boundary
  await prisma.user.create({ data: { email, maxAgents } });
}
```

---

## 10. Zod Schema Inference

Zod schemas define runtime validation. `z.infer<>` extracts the TypeScript type from the schema, keeping a single source of truth.

### Request Validation

```typescript
import { z } from "zod";

const CreateAgentSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  model: z.enum(["qwen-local", "claude-sonnet", "claude-haiku"]),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().int().positive().max(4096).default(1024),
  systemPrompt: z.string().max(4000).optional(),
}).strict(); // .strict() blocks unknown keys -- security directive D7

type CreateAgentInput = z.infer<typeof CreateAgentSchema>;
// {
//   name: string;
//   description?: string | undefined;
//   model: "qwen-local" | "claude-sonnet" | "claude-haiku";
//   temperature: number;
//   maxTokens: number;
//   systemPrompt?: string | undefined;
// }

// Usage in Next.js API route
export async function POST(req: Request) {
  const body = await req.json();
  const parsed = CreateAgentSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  // parsed.data is CreateAgentInput -- fully typed and validated
  const agent = await createAgent(parsed.data);
  return Response.json({ data: agent }, { status: 201 });
}
```

### Composable Schemas

```typescript
// Base schema shared across create and update
const AgentBaseSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  model: z.enum(["qwen-local", "claude-sonnet", "claude-haiku"]),
});

// Create requires all fields
const AgentCreateSchema = AgentBaseSchema.extend({
  systemPrompt: z.string().max(4000),
}).strict();

// Update makes everything optional
const AgentUpdateSchema = AgentBaseSchema.partial().extend({
  systemPrompt: z.string().max(4000).optional(),
}).strict();

type AgentCreate = z.infer<typeof AgentCreateSchema>;
type AgentUpdate = z.infer<typeof AgentUpdateSchema>;

// Discriminated union schema
const WebhookEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("subscription.created"), planId: z.string(), userId: z.string() }),
  z.object({ type: z.literal("subscription.canceled"), subscriptionId: z.string(), reason: z.string().optional() }),
  z.object({ type: z.literal("payment.failed"), invoiceId: z.string(), amount: z.number() }),
]);

type WebhookEvent = z.infer<typeof WebhookEventSchema>;
```

### Zod with Prisma

```typescript
import { Prisma } from "@prisma/client";

// Schema that matches Prisma's create input
const UserCreateSchema = z.object({
  clerkId: z.string(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  plan: z.enum(["FREE", "STARTER", "PLUS", "SMART", "PRO"]).default("FREE"),
}).strict();

type UserCreateInput = z.infer<typeof UserCreateSchema>;

// Ensure Zod output is compatible with Prisma input
const _typeCheck: Prisma.UserCreateInput = {} as UserCreateInput;
// If this errors, the schemas are out of sync
```

---

## 11. Extract, Exclude, Omit, Pick

These built-in utility types carve subsets from existing types.

### Extract and Exclude (for unions)

```typescript
type AllEvents =
  | { type: "user.created"; userId: string }
  | { type: "user.deleted"; userId: string }
  | { type: "agent.invoked"; agentId: string; tokens: number }
  | { type: "payment.received"; amount: number; currency: string }
  | { type: "payment.failed"; amount: number; reason: string };

// Pull out only payment events
type PaymentEvent = Extract<AllEvents, { type: `payment.${string}` }>;
// { type: "payment.received"; ... } | { type: "payment.failed"; ... }

// Remove payment events
type NonPaymentEvent = Exclude<AllEvents, { type: `payment.${string}` }>;
// user.created | user.deleted | agent.invoked

// Extract specific event
type UserCreatedEvent = Extract<AllEvents, { type: "user.created" }>;
// { type: "user.created"; userId: string }
```

### Pick and Omit (for objects)

```typescript
interface FullUser {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  plan: string;
  stripeCustomerId: string | null;
  encryptedApiKey: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Public-facing user -- strip sensitive fields
type PublicUser = Omit<FullUser, "clerkId" | "stripeCustomerId" | "encryptedApiKey">;

// Minimal user for lists
type UserSummary = Pick<FullUser, "id" | "name" | "plan">;

// Combine with Partial for update payloads
type UserUpdate = Partial<Pick<FullUser, "name" | "email">>;
```

### Practical Composition

```typescript
// Build a type that requires `id` but makes everything else optional
type UpdatePayload<T extends { id: string }> = Pick<T, "id"> & Partial<Omit<T, "id">>;

type AgentUpdate2 = UpdatePayload<{
  id: string;
  name: string;
  model: string;
  temperature: number;
}>;
// { id: string; name?: string; model?: string; temperature?: number }
```

---

## 12. Module Augmentation

Module augmentation extends third-party or framework types without modifying their source code. Critical for adding custom properties to Next.js, Clerk, Prisma, and other libraries.

### Extending Next.js Request

```typescript
// src/types/next.d.ts
import "next";

declare module "next" {
  interface NextRequest {
    userId?: string;
    userPlan?: "FREE" | "STARTER" | "PLUS" | "SMART" | "PRO";
  }
}
```

### Extending Clerk Session Claims

```typescript
// src/types/clerk.d.ts
export {};

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      plan: "FREE" | "STARTER" | "PLUS" | "SMART" | "PRO";
      role: "user" | "admin" | "founder";
      stripeCustomerId?: string;
    };
  }
}
```

### Extending Process.env

```typescript
// src/types/env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string;
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
    CLERK_SECRET_KEY: string;
    STRIPE_SECRET_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
    ANTHROPIC_API_KEY: string;
    NEXT_PUBLIC_APP_URL: string;
    NODE_ENV: "development" | "production" | "test";
    ENCRYPTION_KEY: string;
  }
}

// Now process.env.DATABASE_URL is `string`, not `string | undefined`
// Missing keys cause a compile error if you have strict checks
```

### Extending Prisma Client

```typescript
// src/types/prisma.d.ts
import { PrismaClient } from "@prisma/client";

declare module "@prisma/client" {
  interface PrismaClient {
    $metrics: {
      json(): Promise<{
        counters: Array<{ key: string; value: number }>;
        gauges: Array<{ key: string; value: number }>;
        histograms: Array<{ key: string; value: { buckets: number[] } }>;
      }>;
    };
  }
}
```

---

## 13. Async Typing Patterns

### Typed Server Actions (Next.js App Router)

```typescript
// Type-safe server action with error handling
type ServerActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

// Generic server action wrapper
function createAction<TInput, TOutput>(
  schema: z.ZodSchema<TInput>,
  handler: (input: TInput) => Promise<TOutput>
): (input: TInput) => Promise<ServerActionResult<TOutput>> {
  return async (rawInput) => {
    const parsed = schema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message, code: "VALIDATION" };
    }
    try {
      const data = await handler(parsed.data);
      return { success: true, data };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      return { success: false, error: message, code: "INTERNAL" };
    }
  };
}

// Usage
const updateProfile = createAction(
  z.object({ name: z.string().min(1), email: z.string().email() }),
  async (input) => {
    return prisma.user.update({
      where: { id: getCurrentUserId() },
      data: input,
    });
  }
);
```

### Typed API Client

```typescript
// Map of endpoint to request/response types
interface ApiMap {
  "GET /api/agents": { response: Agent[]; query: { plan?: Plan } };
  "POST /api/agents": { response: Agent; body: CreateAgentInput };
  "GET /api/agents/:id": { response: Agent; params: { id: string } };
  "PATCH /api/agents/:id": { response: Agent; params: { id: string }; body: AgentUpdate };
  "DELETE /api/agents/:id": { response: void; params: { id: string } };
}

type ApiEndpoint = keyof ApiMap;

// Type-safe fetch wrapper
async function api<E extends ApiEndpoint>(
  endpoint: E,
  options: Omit<ApiMap[E], "response">
): Promise<ApiMap[E]["response"]> {
  // Build URL, set body, etc. based on options
  const res = await fetch(buildUrl(endpoint, options));
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json();
}

// Fully typed
const agents = await api("GET /api/agents", { query: { plan: "PRO" } });
// agents is Agent[]
```

### Typed Event Emitter

```typescript
type EventMap = {
  "chat:message": { chatId: string; content: string; role: "user" | "assistant" };
  "chat:error": { chatId: string; error: string };
  "agent:start": { agentId: string; model: string };
  "agent:complete": { agentId: string; tokens: number; durationMs: number };
};

class TypedEmitter<T extends Record<string, unknown>> {
  private listeners = new Map<keyof T, Set<Function>>();

  on<K extends keyof T>(event: K, handler: (payload: T[K]) => void): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler);
  }

  off<K extends keyof T>(event: K, handler: (payload: T[K]) => void): void {
    this.listeners.get(event)?.delete(handler);
  }

  emit<K extends keyof T>(event: K, payload: T[K]): void {
    this.listeners.get(event)?.forEach((fn) => fn(payload));
  }
}

const bus = new TypedEmitter<EventMap>();

bus.on("chat:message", (payload) => {
  // payload.chatId, payload.content, payload.role -- all typed
});

bus.emit("agent:complete", { agentId: "agt_1", tokens: 500, durationMs: 1200 });
// bus.emit("agent:complete", { agentId: "agt_1" }); // Error: missing tokens and durationMs
```

---

## 14. Advanced Utility Patterns

### Type-Safe Object.keys

```typescript
// Object.keys returns string[], not (keyof T)[]. This wrapper fixes that.
function typedKeys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

const config = { host: "localhost", port: 5432, ssl: true };
const keys = typedKeys(config); // ("host" | "port" | "ssl")[]
```

### Exhaustive Switch Check

```typescript
// Place at the end of a switch to ensure every case is handled
function exhaustive(value: never): never {
  throw new Error(`Unhandled value: ${JSON.stringify(value)}`);
}

type Plan = "FREE" | "STARTER" | "PLUS" | "SMART" | "PRO";

function getPlanColor(plan: Plan): string {
  switch (plan) {
    case "FREE":    return "gray";
    case "STARTER": return "blue";
    case "PLUS":    return "purple";
    case "SMART":   return "gold";
    case "PRO":     return "red";
    default:        return exhaustive(plan);
    // If you add a new plan but forget the case, TypeScript errors here
  }
}
```

### Builder Pattern with Fluent Types

```typescript
class QueryBuilder<T extends Record<string, unknown>, Selected extends keyof T = never> {
  private _select: string[] = [];
  private _where: string[] = [];

  select<K extends keyof T>(...keys: K[]): QueryBuilder<T, Selected | K> {
    this._select.push(...(keys as string[]));
    return this as unknown as QueryBuilder<T, Selected | K>;
  }

  where(clause: string): this {
    this._where.push(clause);
    return this;
  }

  execute(): Promise<Pick<T, Selected>[]> {
    // Build and run SQL
    return Promise.resolve([]);
  }
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  plan: string;
  createdAt: Date;
}

const results = await new QueryBuilder<UserRow>()
  .select("id", "name", "plan")
  .where("plan = 'PRO'")
  .execute();

// results is Pick<UserRow, "id" | "name" | "plan">[]
// results[0].email -- Error: email not selected
```

### Readonly Tuple Types for Middleware

```typescript
type Middleware<TInput, TOutput> = (input: TInput) => TOutput | Promise<TOutput>;

type Chain<TInput, TOutput> = [
  first: Middleware<TInput, any>,
  ...middle: Middleware<any, any>[],
  last: Middleware<any, TOutput>,
];

// Pipe function that chains middleware
function pipe<A, B>(m1: Middleware<A, B>): Middleware<A, B>;
function pipe<A, B, C>(m1: Middleware<A, B>, m2: Middleware<B, C>): Middleware<A, C>;
function pipe<A, B, C, D>(m1: Middleware<A, B>, m2: Middleware<B, C>, m3: Middleware<C, D>): Middleware<A, D>;
function pipe(...middlewares: Middleware<any, any>[]): Middleware<any, any> {
  return async (input) => {
    let result = input;
    for (const mw of middlewares) {
      result = await mw(result);
    }
    return result;
  };
}

// Usage
const processRequest = pipe(
  (req: Request) => req.json() as Promise<unknown>,        // Request -> unknown
  (body: unknown) => CreateAgentSchema.parse(body),         // unknown -> CreateAgentInput
  (input: CreateAgentInput) => createAgent(input),          // CreateAgentInput -> Agent
);
```

### Conditional Props in React Components

```typescript
// Button that requires `href` only when `as="a"`
type ButtonBaseProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
};

type ButtonAsButton = ButtonBaseProps & {
  as?: "button";
  href?: never;
  onClick?: () => void;
};

type ButtonAsLink = ButtonBaseProps & {
  as: "a";
  href: string;
  onClick?: never;
};

type ButtonProps = ButtonAsButton | ButtonAsLink;

function Button(props: ButtonProps) {
  if (props.as === "a") {
    return <a href={props.href} className={getClasses(props)}>{props.children}</a>;
  }
  return <button onClick={props.onClick} className={getClasses(props)}>{props.children}</button>;
}

// <Button as="a" href="/about">About</Button>    -- OK
// <Button as="a">About</Button>                   -- Error: href required
// <Button onClick={() => {}}>Click</Button>       -- OK
// <Button as="button" href="/x">Click</Button>    -- Error: href not allowed
```

### Polymorphic Component Props

```typescript
type PolymorphicProps<E extends React.ElementType, P = {}> = P &
  Omit<React.ComponentPropsWithoutRef<E>, keyof P | "as"> & {
    as?: E;
  };

type TextProps<E extends React.ElementType = "span"> = PolymorphicProps<E, {
  size?: "sm" | "md" | "lg";
  weight?: "normal" | "medium" | "bold";
}>;

function Text<E extends React.ElementType = "span">({ as, size, weight, ...rest }: TextProps<E>) {
  const Component = as || "span";
  return <Component {...rest} className={cn(sizeMap[size ?? "md"], weightMap[weight ?? "normal"])} />;
}

// All valid
// <Text>Hello</Text>
// <Text as="h1" size="lg">Title</Text>
// <Text as="a" href="/link">Link</Text>  -- href allowed because as="a"
// <Text as="span" href="/x">Bad</Text>   -- Error: href not valid on span
```

---

## 15. Type-Level Testing

### Compile-Time Assertions

```typescript
// Utility to assert two types are equal
type Equals<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

type Assert<T extends true> = T;

// Test your utility types at compile time
type _t1 = Assert<Equals<UnwrapPromise<Promise<string>>, string>>;          // Passes
type _t2 = Assert<Equals<ElementOf<number[]>, number>>;                     // Passes
type _t3 = Assert<Equals<PickByValue<{ a: string; b: number }, string>, { a: string }>>; // Passes
// type _t4 = Assert<Equals<string, number>>; // Would fail at compile time

// Ensure a schema type matches a Prisma type
type _schemaCheck = Assert<Equals<
  z.infer<typeof UserCreateSchema>,
  Pick<Prisma.UserCreateInput, "clerkId" | "email" | "name" | "plan">
>>;
```

---

## Quick Reference: When to Use What

| Pattern | Use When |
|---|---|
| Generic constraints | Enforcing structural requirements on type params |
| Conditional types | Return type depends on input type |
| Mapped types | Transforming all props of a type systematically |
| Template literals | Building string types from components |
| `satisfies` | Validating a value matches a type while keeping literal inference |
| `as const` | Deriving union types from runtime arrays/objects |
| Discriminated unions | Multiple related types sharing a tag field (events, states, results) |
| Type guards | Runtime narrowing with `is` or `asserts` |
| Branded types | Preventing accidental ID/value mixing |
| Zod inference | Single source of truth for runtime validation + compile-time types |
| Extract/Exclude | Filtering members of a union type |
| Pick/Omit | Selecting or removing object properties |
| Module augmentation | Extending third-party types (env, Clerk, Next.js) |
| Async patterns | Type-safe server actions, API clients, event emitters |
| Compile-time tests | Verifying utility types work correctly |

---

*Palace Knowledge Seed -- Senior Frontend Engineering Division*
*Stone AI Platform -- Advanced TypeScript Architecture*
