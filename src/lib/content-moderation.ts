/**
 * Content moderation for Stone AI community forums.
 * Detects verbally abusive, harassing, and policy-violating content.
 * Flagged content is rejected immediately — never stored.
 */

// Severity levels for moderation actions
export type ModerationSeverity = "low" | "medium" | "high";

export interface ModerationResult {
  flagged: boolean;
  reason: string | null;
  severity: ModerationSeverity | null;
  matchedPattern: string | null;
}

// Abusive language patterns — ordered by severity
const ABUSE_PATTERNS: { pattern: RegExp; reason: string; severity: ModerationSeverity }[] = [
  // HIGH — slurs, threats, extreme hate speech
  { pattern: /\b(?:kill\s+(?:your|him|her|them|myself)|death\s+threat|i['']?ll\s+(?:murder|shoot|stab|hurt))\b/i, reason: "Threats of violence", severity: "high" },
  { pattern: /\b(?:k[i!1]ll?\s*y(?:ou|our)r?\s*s[e3]lf|go\s*d[i!1]e|hope\s*(?:you|u)\s*d[i!1]e)\b/i, reason: "Encouraging self-harm", severity: "high" },
  { pattern: /\b(?:n[i!1]gg[e3a]r|f[a@]gg?[o0]t|r[e3]t[a@]rd|sp[i!1]c|ch[i!1]nk|k[i!1]ke|tr[a@]nn(?:y|ie))\b/i, reason: "Hate speech / slurs", severity: "high" },
  { pattern: /\b(?:white\s*(?:power|supremac)|heil\s*hitler|nazi|gas\s*the)\b/i, reason: "Hate speech / extremism", severity: "high" },

  // MEDIUM — direct insults, harassment, targeted abuse
  { pattern: /\b(?:you(?:'re|r)?\s+(?:a\s+)?(?:stupid|idiot|moron|dumb(?:ass)?|loser|pathetic|worthless|trash|garbage|piece\s+of\s+(?:shit|crap)))\b/i, reason: "Direct personal insults", severity: "medium" },
  { pattern: /\b(?:stfu|shut\s+the\s+f[u*]+ck\s+up|go\s+f[u*]+ck\s+yourself)\b/i, reason: "Abusive language", severity: "medium" },
  { pattern: /\b(?:f[u*]+ck\s+(?:you|off|this|that)|f[u*]+cking\s+(?:idiot|stupid|moron|loser))\b/i, reason: "Abusive language", severity: "medium" },
  { pattern: /\b(?:(?:you|u)\s+(?:suck|blow)|eat\s+(?:shit|a\s+dick)|kiss\s+my\s+ass)\b/i, reason: "Abusive language", severity: "medium" },
  { pattern: /\b(?:i['']?ll\s+(?:find|track|dox|hack)\s+(?:you|u))\b/i, reason: "Threats / harassment", severity: "medium" },
  { pattern: /\b(?:your\s+(?:mom|mother|wife|daughter)\s+(?:is|should))\b/i, reason: "Targeted harassment", severity: "medium" },

  // LOW — general profanity, mild hostility
  { pattern: /\b(?:a[s$]+h[o0]le|b[i!1]tch|d[i!1]ck(?:head)?|c[u*]+nt|wh[o0]re|sl[u*]+t)\b/i, reason: "Profanity", severity: "low" },
  { pattern: /\b(?:scam(?:mer)?|fraud|rip\s*off|this\s+(?:app|site|service)\s+(?:is\s+)?(?:trash|garbage|shit|crap|sucks))\b/i, reason: "Hostile content", severity: "low" },
];

// Spam / self-promotion patterns
const SPAM_PATTERNS: { pattern: RegExp; reason: string }[] = [
  { pattern: /(?:https?:\/\/){2,}/i, reason: "Excessive links" },
  { pattern: /(?:buy|cheap|discount|free|click\s+here|visit\s+(?:my|our)|check\s+out\s+(?:my|our))\s+(?:https?:\/\/)/i, reason: "Spam / self-promotion" },
  { pattern: /(.{10,})\1{2,}/i, reason: "Repetitive content / spam" },
];

/**
 * Check content for abusive, harassing, or spam content.
 * Returns a moderation result indicating whether the content should be blocked.
 */
export function checkContentModeration(text: string): ModerationResult {
  const clean: ModerationResult = { flagged: false, reason: null, severity: null, matchedPattern: null };

  if (!text || text.trim().length === 0) return clean;

  // Normalize text for detection (handle common evasion like spaces between letters)
  const normalized = text
    .replace(/\s{2,}/g, " ")       // collapse multiple spaces
    .replace(/[*_~`]/g, "")        // strip markdown formatting
    .replace(/0/g, "o")            // common substitutions for evasion check
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/\$/g, "s")
    .replace(/@/g, "a");

  // Check abuse patterns (both original and normalized)
  for (const { pattern, reason, severity } of ABUSE_PATTERNS) {
    if (pattern.test(text) || pattern.test(normalized)) {
      return { flagged: true, reason, severity, matchedPattern: pattern.source.slice(0, 50) };
    }
  }

  // Check spam patterns
  for (const { pattern, reason } of SPAM_PATTERNS) {
    if (pattern.test(text)) {
      return { flagged: true, reason, severity: "low", matchedPattern: pattern.source.slice(0, 50) };
    }
  }

  return clean;
}

/**
 * Community guidelines policy text sent to users who violate content policies.
 */
export const POLICY_VIOLATION_MESSAGE = `Your content was flagged and removed for violating Stone AI Community Guidelines.

Our community standards prohibit:
• Hate speech, slurs, and discriminatory language
• Threats of violence or encouragement of self-harm
• Personal insults, harassment, and targeted abuse
• Excessive profanity directed at other users
• Spam, self-promotion, and repetitive content

Repeated violations may result in temporary or permanent suspension of your account.

If you believe this was a mistake, please contact support at Help & Support.`;

/**
 * Get the auto-response notification title based on severity.
 */
export function getViolationTitle(severity: ModerationSeverity): string {
  switch (severity) {
    case "high":
      return "Content Removed — Severe Policy Violation";
    case "medium":
      return "Content Removed — Community Guidelines Violation";
    case "low":
      return "Content Removed — Policy Reminder";
  }
}
