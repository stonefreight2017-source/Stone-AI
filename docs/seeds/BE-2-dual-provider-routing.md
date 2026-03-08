# BE-2: vLLM / Cloud Dual-Provider Routing Logic

## Purpose
Definitive reference for how Stone AI routes AI inference requests between the local vLLM server (Stone Engine) and cloud providers (Anthropic Claude). Covers model selection, tier-based routing, token budgets, failover logic, and cost protection mechanisms.

## Key Patterns (from actual codebase)

### Provider Architecture (src/lib/ai.ts)

Two providers are instantiated at module level:

```typescript
// LOCAL provider -- OpenAI-compatible API pointing at vLLM
const vllm = createOpenAI({
  baseURL: process.env.VLLM_BASE_URL ?? "http://localhost:8000/v1",
  apiKey: process.env.VLLM_API_KEY ?? "not-needed",
  name: "vllm",
});

// CLOUD provider -- Anthropic Claude
const cloud = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
});
```

### The getModel() Function -- Single Decision Point

All model selection flows through `getModel(mode, tierLocalModel?)`:

```
IF mode === "SMART":
  -> cloud("claude-sonnet-4-20250514")   [or SMART_MODEL env override]

IF mode === "LOCAL":
  IF running on Vercel AND vLLM URL is localhost:
    -> cloud("claude-haiku-4-5-20251001")  [or LOCAL_FALLBACK_MODEL env override]
  ELSE:
    -> vllm(tierLocalModel ?? "meta-llama/Llama-3.1-70B-Instruct")
```

Detection logic for Vercel: `process.env.VERCEL` is truthy AND base URL contains "localhost" or "127.0.0.1".

### Mode Definitions

| Mode | Provider | Model | Cost to Company | User Sees |
|---|---|---|---|---|
| LOCAL | vLLM (self-hosted) | Llama 3.1 70B Instruct | $0 (GPU electricity only) | "Stone Engine" |
| SMART | Anthropic Cloud | Claude Sonnet 4 | ~$0.018-0.037/msg | "Cloud AI" |
| LOCAL on Vercel | Anthropic Cloud (fallback) | Claude Haiku 4.5 | ~$0.003/msg | "Stone Engine" (transparent) |
| PRIORITY | (PRO only, reserved) | TBD | TBD | TBD |

### Tier-Based Token Budgets

From `src/lib/tier-config.ts`, each tier has separate LOCAL and SMART token limits:

| Tier | LOCAL maxTokens | SMART maxTokens | SMART context msgs | SMART msgs/day | SMART tokens/month |
|---|---|---|---|---|---|
| FREE | 1,200 | 800 | 5 | 0 (5 lifetime) | 50K |
| STARTER | 2,500 | 1,500 | 10 | 10 | 500K |
| PLUS | 3,500 | 2,000 | 15 | 15 | 1.2M |
| SMART | 6,000 | 2,500 | 20 | 30 | 2.5M |
| PRO | 8,000 | 3,000 | 25 | 50 | 4M |

The chat route applies the correct limit:
```typescript
maxOutputTokens: mode === "SMART" && tierConfig.limits.smartMaxResponseTokens > 0
  ? tierConfig.limits.smartMaxResponseTokens
  : tierConfig.limits.maxResponseTokens
```

### SMART Context Window Compression

SMART mode sends FEWER past messages to the cloud to control input token costs:
```typescript
const contextLimit = mode === "SMART" && tierConfig.limits.smartContextMessages > 0
  ? tierConfig.limits.smartContextMessages  // Smaller window for SMART
  : tierConfig.perks.contextMessages;       // Full window for LOCAL
```

LOCAL context windows: FREE=15, STARTER=25, PLUS=40, SMART=60, PRO=80.
SMART context windows: FREE=5, STARTER=10, PLUS=15, SMART=20, PRO=25.

### Cost Protection: The SMART Quota System

SMART mode has a 4-layer cost protection stack (all in `src/lib/quota.ts`):

1. **Daily message cap** (`smartMessagesPerDay`): Hard limit per tier. FREE tier uses lifetime credits instead (5 total, one-time).
2. **Monthly token budget** (`smartTokensPerMonth`): Estimates tokens as `smartRequests * 3000` and blocks when exceeding the cap.
3. **Cost multiplier**: Each SMART message counts as 3x against the daily message quota (`SMART_COST_MULTIPLIER = 3`).
4. **Overage credit packs**: When quota is hit, the error response offers purchasable credits ($1.99/10, $3.99/25, $6.99/50).

### FREE Tier Lifetime Credits

FREE users get exactly 5 SMART messages ever (stored as `smartCreditsRemaining` on User model). Once depleted, they cannot use SMART mode without upgrading. The `decrementFreeSmartCredits()` function atomically decrements this counter.

### Failover Logic

The failover is environment-based, not runtime-based:

- **Dev (local machine)**: vLLM at localhost:8000 handles LOCAL. If vLLM is down, requests fail (no automatic cloud failover for dev).
- **Prod (Vercel)**: `getModel("LOCAL")` detects Vercel + localhost URL and automatically routes to Claude Haiku as fallback. This is transparent to the user.
- **Future cloud vLLM**: When `VLLM_BASE_URL` points to a cloud provider (Together, Fireworks, Groq), LOCAL mode uses that provider directly. No code changes needed -- the OpenAI-compatible interface is identical.

There is NO runtime health-check failover (e.g., "if vLLM times out, try cloud"). The chat route wraps `streamText()` in a try/catch and returns a plain text error message on failure, rather than silently falling back to cloud (which would create unexpected costs).

### vLLM Health Monitoring (src/lib/vllm.ts)

`getVllmStatus()` checks vLLM server health by querying:
- `/v1/models` -- returns loaded model name
- `/metrics` -- Prometheus endpoint for tokens/sec and GPU cache utilization

Used by `/api/admin/health` to report infrastructure status. Not used for routing decisions.

### Model Registry (src/lib/vllm.ts)

Five curated models in `MODEL_REGISTRY` for the local GPU (RTX 5090 target):
- Llama 3.1 70B (recommended, 22GB VRAM)
- Llama 3.3 70B (multilingual)
- Mistral Large 2 123B (slow, 28GB)
- DeepSeek V3 67B (fast, code-focused)
- Qwen 2.5 72B (multilingual)

All tiers currently use Llama 3.1 70B as `localModel`. The field exists per-tier in `TIER_CONFIG` for future differentiation.

### Token Usage Recording

After every response, `recordTokenUsage()` upserts a `UsageRecord` tracking:
- `tokensIn` / `tokensOut` -- actual token counts from model response
- `localRequests` / `smartRequests` -- request count by mode
- Keyed by `userId + billingCycleStart` (monthly rollup)

The admin health endpoint uses these to estimate monthly API costs:
```
estimatedSmartCost = smartRequests * 1500 * $0.01 / 1000
estimatedLocalCost = localRequests * 1500 * $0.002 / 1000
```

### Memory Extraction Uses LOCAL Only

Agent memory extraction (post-response, async) always calls `getModel("LOCAL")` regardless of what mode the user's message used. This ensures memory extraction never incurs cloud costs:
```typescript
const model = gm("LOCAL");
const result = await st({ model, messages: [...], maxOutputTokens: 500 });
```

### Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| VLLM_BASE_URL | http://localhost:8000/v1 | vLLM server endpoint |
| VLLM_API_KEY | "not-needed" | vLLM auth (needed for cloud providers) |
| VLLM_MODEL | meta-llama/Llama-3.1-70B-Instruct | Default local model ID |
| VLLM_MAX_CONCURRENT | 10 | Max concurrent vLLM requests |
| ANTHROPIC_API_KEY | "" | Anthropic API key for SMART + Vercel fallback |
| SMART_MODEL | claude-sonnet-4-20250514 | Cloud model for SMART mode |
| LOCAL_FALLBACK_MODEL | claude-haiku-4-5-20251001 | Cloud fallback when vLLM unavailable on Vercel |
| EMBEDDING_MODEL | (unset) | Embedding model for RAG (uses hash fallback if unset) |
| VERCEL | (auto-set) | Detected by getModel() for failover logic |

## DO / DON'T Rules

- **DO** use `getModel(mode, tierConfig.localModel)` as the single entry point for model selection. Never construct providers manually in routes.
- **DO** apply both `maxOutputTokens` (per-tier) and context window limits (per-mode) on every inference call.
- **DO** check SMART quota BEFORE rate limiting and general quota (fail fast on the most restrictive limit).
- **DO** use LOCAL mode for all background/internal inference (memory extraction, auto-titling). Never spend cloud tokens on system tasks.
- **DO** include `creditPacks` and `suggestion: "LOCAL"` in SMART quota error responses to guide users.
- **DO** record token usage via `recordTokenUsage()` after every successful response for billing accuracy.
- **DON'T** add runtime failover from LOCAL to SMART without explicit cost analysis -- each SMART message costs 5-18x more than LOCAL.
- **DON'T** change `SMART_COST_MULTIPLIER` without recalculating margin tables in tier-config.ts comments.
- **DON'T** assume vLLM is available in production -- always handle the Vercel+localhost case.
- **DON'T** add new cloud models without updating the cost estimates in admin health and the margin calculations in tier-config.ts.
- **DON'T** trust client-sent `mode` values beyond the Zod enum validation -- tier access is always re-checked server-side.

## Quick Reference

```
User sends message with mode=LOCAL
  -> getOrCreateUser() -> getTierConfig()
  -> isModeAllowed(tier, "LOCAL") -- always true
  -> checkQuota() -> checkRateLimit()
  -> getModel("LOCAL", tierConfig.localModel)
     -> On Vercel? -> cloud(haiku)
     -> Else?      -> vllm(llama-70b)
  -> streamText({ maxOutputTokens: tierConfig.limits.maxResponseTokens })

User sends message with mode=SMART
  -> getOrCreateUser() -> getTierConfig()
  -> isModeAllowed(tier, "SMART") -- true for all tiers
  -> checkSmartQuota(userId, tier)
     -> FREE: check smartCreditsRemaining > 0
     -> Paid: check smartMessagesSentToday < smartMessagesPerDay AND monthly token budget
  -> checkRateLimit() -> checkQuota()
  -> getModel("SMART")
     -> cloud(claude-sonnet-4)
  -> streamText({ maxOutputTokens: tierConfig.limits.smartMaxResponseTokens })
  -> incrementSmartUsage() (counts as 3x daily messages)
```

| Key File | Purpose |
|---|---|
| src/lib/ai.ts | Provider instantiation, getModel(), SYSTEM_PROMPT |
| src/lib/vllm.ts | vLLM health check, model registry, config |
| src/lib/tier-config.ts | Per-tier token limits, SMART caps, cost multiplier |
| src/lib/quota.ts | SMART quota check, daily/monthly usage tracking |
| src/lib/embeddings.ts | RAG embedding generation (uses vLLM or hash fallback) |
| src/app/api/chat/route.ts | Primary chat route (12-step pattern) |
| src/app/api/bestie/chat/route.ts | Bestie chat (mirrors chat route) |
| src/app/api/v1/chat/route.ts | External API chat (API key auth, PRO only) |
