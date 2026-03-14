/**
 * Alert system types for Three-Headed Monster founder notifications.
 *
 * Agents (Chaos, Stone, Cardinal, system) fire alerts to the founder's inbox
 * via Gmail SMTP. Each alert has a priority, type, and structured payload.
 */

export enum AlertPriority {
  P0 = "P0", // Critical — immediate action required
  P1 = "P1", // High — action needed within hours
  P2 = "P2", // Medium — informational, review when available
  P3 = "P3", // Low — routine / test
}

export enum AlertAgent {
  CHAOS = "chaos",
  STONE = "stone",
  CARDINAL = "cardinal",
  SYSTEM = "system",
}

/**
 * All known alert types across the Three-Headed Monster.
 * Grouped by originating agent.
 */
export enum AlertType {
  // --- Chaos (infrastructure) ---
  DEPLOY_FAILED = "deploy.failed",
  DEPLOY_SUCCESS = "deploy.success",
  DB_CONNECTION_LOST = "db.connection_lost",
  DB_MIGRATION_ERROR = "db.migration_error",
  DB_SLOW_QUERY = "db.slow_query",
  REDIS_DOWN = "redis.down",
  RATE_LIMIT_SPIKE = "rate_limit.spike",
  ERROR_RATE_HIGH = "error_rate.high",
  MEMORY_USAGE_HIGH = "memory.high",
  CPU_USAGE_HIGH = "cpu.high",
  SSL_CERT_EXPIRY = "ssl.cert_expiry",
  UPTIME_DOWN = "uptime.down",
  ENV_DRIFT = "env.drift",

  // --- Stone (strategy / operations) ---
  REVENUE_MILESTONE = "revenue.milestone",
  CHURN_SPIKE = "churn.spike",
  SIGNUP_SURGE = "signup.surge",
  AGENT_ERROR_PATTERN = "agent.error_pattern",
  QUOTA_EXHAUSTION = "quota.exhaustion",
  ESCALATION = "escalation",
  STRIPE_WEBHOOK_FAIL = "stripe.webhook_fail",
  USER_REPORT = "user.report",

  // --- Cardinal (intelligence + legal + advertising) ---
  COMPETITOR_ALERT = "competitor.alert",
  MARKET_SHIFT = "market.shift",
  SEO_RANKING_CHANGE = "seo.ranking_change",
  LEGAL_COMPLIANCE = "legal.compliance",
  RESEARCH_COMPLETE = "research.complete",
  SEED_DELIVERABLE = "seed.deliverable",
  CONTENT_APPROVAL = "content.approval",
  CONTENT_APPROVED = "content.approved",
  CONTENT_REJECTED = "content.rejected",
  CONTENT_CHANGES_REQUESTED = "content.changes_requested",
  CONTENT_ROLLED = "content.rolled",

  // --- System ---
  TEST = "test",
  HEALTH_CHECK = "health.check",
  SECURITY_ALERT = "security.alert",
  AUDIT_ANOMALY = "audit.anomaly",
  CRON_FAILURE = "cron.failure",
  BACKUP_STATUS = "backup.status",
  API_KEY_EXPIRY = "api_key.expiry",
  UNKNOWN = "unknown",

  // --- Inbox Manager ---
  DAILY_DIGEST = "inbox.daily_digest",
  WEEKLY_SUMMARY = "inbox.weekly_summary",
  SLA_BREACH = "inbox.sla_breach",
  AUTO_RESPONSE_SENT = "inbox.auto_response_sent",
  NEW_ENTERPRISE_LEAD = "inbox.new_enterprise_lead",
  SOCIAL_NOTABLE = "inbox.social_notable",
}

export interface AlertMetadata {
  [key: string]: string | number | boolean | null;
}

export interface AlertPayload {
  agent: AlertAgent;
  priority: AlertPriority;
  alertType: AlertType;
  title: string;
  body: string;
  metadata?: AlertMetadata;
}

export interface AlertResult {
  success: boolean;
  alertId: string;
  error?: string;
}
