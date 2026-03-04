import type { Tier, RequestMode } from "@/lib/tier-config";

// Structured error responses from /api/chat
export interface TierMismatchError {
  code: "TIER_MISMATCH";
  message: string;
  currentTier: Tier;
  requestedMode: RequestMode;
  requiredTier: Tier;
  allowedModes: RequestMode[];
  offer?: UpgradeOfferData | null;
}

export interface QuotaExceededError {
  code: "QUOTA_EXCEEDED";
  message: string;
  currentTier: Tier;
  usage: {
    messagesSentToday: number;
    tokensUsedThisMonth: number;
  };
  limit: {
    messagesPerDay: number;
    tokensPerMonth: number;
  };
  nextResetDate: string;
  offer?: UpgradeOfferData | null;
}

export interface RateLimitedError {
  code: "RATE_LIMITED";
  message: string;
  retryAfterMs: number;
}

export interface SmartQuotaExceededError {
  code: "SMART_QUOTA_EXCEEDED";
  message: string;
  smartUsage: { sent: number; limit: number };
  suggestion: string;
}

export interface ServiceUnavailableError {
  code: "SERVICE_UNAVAILABLE";
  message: string;
  canUpgradeForFallback: boolean;
}

export type ChatError =
  | TierMismatchError
  | QuotaExceededError
  | SmartQuotaExceededError
  | RateLimitedError
  | ServiceUnavailableError;

export interface UpgradeOfferData {
  id: string;
  targetTier: string;
  discountPct: number;
  expiresAt: string;
  timeRemainingMs: number;
}

// Conversation list item (from GET /api/conversations)
export interface ConversationListItem {
  id: string;
  title: string;
  updatedAt: string;
}

// Message from the API
export interface MessageData {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  mode: "LOCAL" | "SMART" | null;
  tokensIn: number | null;
  tokensOut: number | null;
  createdAt: string;
}
