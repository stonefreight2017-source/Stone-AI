/**
 * Environment variable validation.
 * Validates all required environment variables at startup.
 * Prevents silent failures from missing config.
 *
 * Inspired by 1Password's strict startup validation.
 */

interface EnvRule {
  key: string;
  required: boolean;
  description: string;
}

const ENV_RULES: EnvRule[] = [
  // Database
  { key: "DATABASE_URL", required: true, description: "PostgreSQL connection string" },

  // Clerk Auth
  { key: "CLERK_SECRET_KEY", required: true, description: "Clerk backend secret key" },
  { key: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", required: true, description: "Clerk frontend key" },

  // LLM
  { key: "VLLM_BASE_URL", required: false, description: "vLLM server URL (default: http://127.0.0.1:8000/v1)" },
  { key: "VLLM_MODEL", required: false, description: "vLLM model ID" },

  // Stripe (required for billing)
  { key: "STRIPE_SECRET_KEY", required: false, description: "Stripe secret key" },
  { key: "STRIPE_WEBHOOK_SECRET", required: false, description: "Stripe webhook signing secret" },

  // Admin
  { key: "ADMIN_EMAILS", required: false, description: "Comma-separated admin email list" },

  // Redis
  { key: "REDIS_HOST", required: false, description: "Redis host (default: 127.0.0.1)" },
  { key: "REDIS_PORT", required: false, description: "Redis port (default: 6379)" },

  // Encryption
  { key: "ENCRYPTION_KEY", required: false, description: "AES-256 encryption key (base64)" },
];

/**
 * Validate environment at startup. Logs warnings for missing optional vars,
 * throws for missing required vars.
 */
export function validateEnvironment(): void {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const rule of ENV_RULES) {
    if (!process.env[rule.key]) {
      if (rule.required) {
        missing.push(`${rule.key} — ${rule.description}`);
      } else {
        warnings.push(`${rule.key} — ${rule.description}`);
      }
    }
  }

  if (warnings.length > 0) {
    console.warn(
      `[ENV] Optional variables not set:\n  ${warnings.join("\n  ")}`
    );
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n  ${missing.join("\n  ")}\n\nSet these in your .env file.`
    );
  }
}
