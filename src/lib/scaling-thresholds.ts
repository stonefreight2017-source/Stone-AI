/**
 * ═══════════════════════════════════════════════════════════════
 * SCALING THRESHOLDS & SYSTEM HEALTH MONITOR
 * ═══════════════════════════════════════════════════════════════
 *
 * This file defines scaling triggers, health checks, and security
 * audit routines. When thresholds are crossed, warnings are logged
 * to the audit system and returned via /api/admin/health.
 *
 * SCALING ROADMAP (act on these in order):
 *
 * ┌─────────────────┬─────────────────────────────────────────────┐
 * │ Users           │ Action Required                             │
 * ├─────────────────┼─────────────────────────────────────────────┤
 * │ 0-50            │ Current setup works. Local vLLM fine.       │
 * │ 50-100          │ Monitor vLLM latency. May need cloud.       │
 * │ 100-500         │ SWITCH LOCAL MODE TO CLOUD PROVIDER.        │
 * │                 │ Change VLLM_BASE_URL to Together/Fireworks. │
 * │                 │ Upgrade Neon plan.                          │
 * │ 500-2,000       │ Upgrade OpenAI usage tier.                  │
 * │                 │ Add message queue for memory extraction.    │
 * │                 │ Redis: switch to Upstash/managed.           │
 * │ 2,000-10,000    │ Multiple inference endpoints + load balance │
 * │                 │ Separate worker for memory extraction.      │
 * │                 │ Use smaller model (8B) for extraction.      │
 * │                 │ Connection pooling (PgBouncer/Neon pooler). │
 * │ 10,000+         │ Dedicated infrastructure team.              │
 * │                 │ CDN for static assets. Edge caching.        │
 * │                 │ Multi-region deployment.                    │
 * └─────────────────┴─────────────────────────────────────────────┘
 */

export interface ScalingThreshold {
  metric: string;
  warningAt: number;
  criticalAt: number;
  unit: string;
  action: string;
}

export const SCALING_THRESHOLDS: ScalingThreshold[] = [
  {
    metric: "daily_active_users",
    warningAt: 50,
    criticalAt: 100,
    unit: "users",
    action: "Switch VLLM_BASE_URL to cloud provider (Together AI, Fireworks, or Groq). Current local GPU cannot handle this load.",
  },
  {
    metric: "concurrent_requests",
    warningAt: 10,
    criticalAt: 25,
    unit: "simultaneous",
    action: "Local vLLM maxed out. Move to cloud inference endpoint with auto-scaling.",
  },
  {
    metric: "avg_response_latency_ms",
    warningAt: 8000,
    criticalAt: 15000,
    unit: "ms",
    action: "Model inference too slow. Check vLLM health, GPU utilization, or switch to faster cloud endpoint.",
  },
  {
    metric: "daily_messages_total",
    warningAt: 5000,
    criticalAt: 20000,
    unit: "messages/day",
    action: "High message volume. Ensure cloud inference is active. Monitor OpenAI rate limits. Consider batching memory extraction.",
  },
  {
    metric: "memory_extractions_per_hour",
    warningAt: 500,
    criticalAt: 2000,
    unit: "extractions/hour",
    action: "Memory extraction creating GPU pressure. Reduce frequency (every 3rd message) or use smaller model (Llama 8B) for extraction.",
  },
  {
    metric: "db_connections",
    warningAt: 15,
    criticalAt: 25,
    unit: "connections",
    action: "Approaching Neon connection limit. Upgrade plan or enable connection pooling via Neon pooler endpoint.",
  },
  {
    metric: "redis_memory_mb",
    warningAt: 200,
    criticalAt: 400,
    unit: "MB",
    action: "Redis memory growing. Review rate limit key expiry. Consider switching to managed Redis (Upstash).",
  },
  {
    metric: "monthly_token_spend_usd",
    warningAt: 5000,
    criticalAt: 20000,
    unit: "USD/month",
    action: "High cloud API spend. Review per-user quotas. Ensure tier pricing covers costs. Consider negotiating volume pricing.",
  },
  {
    metric: "error_rate_percent",
    warningAt: 2,
    criticalAt: 5,
    unit: "%",
    action: "Elevated error rate. Check logs for patterns — DB timeouts, model failures, rate limit storms.",
  },
  {
    metric: "bestie_profiles_total",
    warningAt: 1000,
    criticalAt: 5000,
    unit: "profiles",
    action: "Large bestie profile count. Monitor AgentMemory table growth. Consider memory pruning job (keep latest 100 per bestie-user).",
  },
];

/**
 * Security checks to run periodically.
 */
export interface SecurityCheck {
  id: string;
  name: string;
  severity: "info" | "warning" | "critical";
  description: string;
}

export const SECURITY_CHECKS: SecurityCheck[] = [
  {
    id: "injection_attempts",
    name: "Prompt Injection Attempts",
    severity: "warning",
    description: "Count of detected injection attempts in last 24h. Spike may indicate targeted attack.",
  },
  {
    id: "banned_access_attempts",
    name: "Banned User Access Attempts",
    severity: "warning",
    description: "Banned users trying to access the system. May indicate ban evasion.",
  },
  {
    id: "rate_limit_hits",
    name: "Rate Limit Triggers",
    severity: "info",
    description: "Users hitting rate limits. High numbers may indicate abuse or too-tight limits.",
  },
  {
    id: "concurrent_blocks",
    name: "Concurrency Blocks",
    severity: "info",
    description: "Users blocked for too many simultaneous requests.",
  },
  {
    id: "quota_exhaustions",
    name: "Quota Exhaustion Rate",
    severity: "info",
    description: "Users hitting daily/monthly limits. High rate = users want higher tiers (good) or limits too low.",
  },
  {
    id: "memory_poisoning",
    name: "Memory Poisoning Attempts",
    severity: "critical",
    description: "Attempts to inject tier/role/access data into agent memory. Blocked by sanitizer.",
  },
  {
    id: "api_key_abuse",
    name: "API Key Anomalies",
    severity: "warning",
    description: "API keys with unusual usage patterns (volume spikes, odd hours).",
  },
  {
    id: "stale_concurrency_slots",
    name: "Stale Concurrency Slots",
    severity: "warning",
    description: "Concurrency slots not released (crashed requests). Redis TTL should auto-clean, but check for leaks.",
  },
];

/**
 * Performance optimization reminders.
 * These are checked by the admin health endpoint and flagged when relevant.
 */
export const PERFORMANCE_REMINDERS = [
  {
    condition: "vLLM on localhost",
    check: () => {
      const url = process.env.VLLM_BASE_URL ?? "http://localhost:8000/v1";
      return url.includes("localhost") || url.includes("127.0.0.1");
    },
    message: "LOCAL mode is hitting localhost vLLM. Fine for <50 users. When scaling, change VLLM_BASE_URL to a cloud endpoint (Together AI: https://api.together.xyz/v1, Fireworks: https://api.fireworks.ai/inference/v1).",
    severity: "info" as const,
  },
  {
    condition: "Redis on localhost",
    check: () => {
      const host = process.env.REDIS_HOST ?? "127.0.0.1";
      return host === "127.0.0.1" || host === "localhost";
    },
    message: "Redis is on localhost. Works for single-instance deployment. For multi-instance or serverless, switch to Upstash (serverless Redis) or managed Redis.",
    severity: "info" as const,
  },
  {
    condition: "No OpenAI key",
    check: () => !process.env.OPENAI_API_KEY,
    message: "No OPENAI_API_KEY set. SMART mode will fail. Set this for cloud fallback.",
    severity: "critical" as const,
  },
  {
    condition: "Clerk in dev mode",
    check: () => {
      const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
      return key.startsWith("pk_test_");
    },
    message: "Clerk is in dev/test mode. Switch to production keys (pk_live_, sk_live_) before going live.",
    severity: "warning" as const,
  },
  {
    condition: "Stripe in test mode",
    check: () => {
      const key = process.env.STRIPE_SECRET_KEY ?? "";
      return key.startsWith("sk_test_");
    },
    message: "Stripe is in test mode. Switch to live keys and re-create products before accepting real payments.",
    severity: "warning" as const,
  },
  {
    condition: "No DATABASE_URL pooler",
    check: () => {
      const url = process.env.DATABASE_URL ?? "";
      return !url.includes("pooler") && !url.includes("pgbouncer");
    },
    message: "Database URL is not using connection pooling. For >100 users, use Neon's pooler endpoint (?pgbouncer=true) to avoid exhausting connections.",
    severity: "info" as const,
  },
  {
    condition: "Memory extraction on every message",
    check: () => {
      // This is always true until we add the frequency config
      return !process.env.MEMORY_EXTRACT_FREQUENCY;
    },
    message: "Memory extraction runs on every qualifying message. Set MEMORY_EXTRACT_FREQUENCY=3 to extract every 3rd message when load increases.",
    severity: "info" as const,
  },
];
