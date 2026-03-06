/**
 * Geo-specific compliance system.
 * Detects user's country via Cloudflare CF-IPCountry header and returns
 * the applicable legal framework. Each country's rules apply ONLY to
 * users in that country — never cross-applied.
 *
 * On Vercel behind Cloudflare, the CF-IPCountry header is set at the edge
 * and cannot be spoofed by the client.
 */

export type Jurisdiction =
  | "US"       // United States (federal + state-specific)
  | "EU"       // European Union (GDPR)
  | "UK"       // United Kingdom (UK GDPR + Online Safety Act)
  | "CA"       // Canada (PIPEDA + AIDA)
  | "AU"       // Australia (Privacy Act + Online Safety Act)
  | "BR"       // Brazil (LGPD)
  | "JP"       // Japan (APPI)
  | "KR"       // South Korea (PIPA)
  | "IN"       // India (DPDP Act)
  | "RU"       // Russia (Federal Law on Personal Data)
  | "CN"       // China (PIPL + CAC regulations)
  | "DEFAULT"; // Fallback — strictest common standard

/** Country code to jurisdiction mapping */
const COUNTRY_TO_JURISDICTION: Record<string, Jurisdiction> = {
  // United States
  US: "US",
  // EU member states
  AT: "EU", BE: "EU", BG: "EU", HR: "EU", CY: "EU", CZ: "EU", DK: "EU",
  EE: "EU", FI: "EU", FR: "EU", DE: "EU", GR: "EU", HU: "EU", IE: "EU",
  IT: "EU", LV: "EU", LT: "EU", LU: "EU", MT: "EU", NL: "EU", PL: "EU",
  PT: "EU", RO: "EU", SK: "EU", SI: "EU", ES: "EU", SE: "EU",
  // EEA (same GDPR rules)
  IS: "EU", LI: "EU", NO: "EU",
  // UK
  GB: "UK",
  // Canada
  CA: "CA",
  // Australia
  AU: "AU",
  // Brazil
  BR: "BR",
  // Japan
  JP: "JP",
  // South Korea
  KR: "KR",
  // India
  IN: "IN",
  // Russia
  RU: "RU",
  // China
  CN: "CN",
};

export interface ComplianceRules {
  jurisdiction: Jurisdiction;
  countryCode: string;

  /** Whether AI must disclose it's AI at session start */
  requiresAiDisclosure: boolean;
  /** Interval in ms to re-show AI disclosure (0 = not required) */
  redisclosureIntervalMs: number;

  /** Must show crisis resources when distress detected */
  requiresCrisisProtocol: boolean;
  /** Crisis resources specific to this jurisdiction */
  crisisResources: string;

  /** Minimum age requirement */
  minimumAge: number;
  /** Whether parental consent is required for minors */
  requiresParentalConsent: boolean;

  /** Data deletion request deadline (days to fulfill) */
  dataDeletionDeadlineDays: number;

  /** Whether explicit consent is needed before data processing */
  requiresExplicitConsent: boolean;
  /** Whether user must be able to opt out of AI processing */
  requiresAiOptOut: boolean;

  /** Whether data must stay within jurisdiction borders */
  requiresDataLocalization: boolean;

  /** Content restrictions specific to jurisdiction */
  contentRestrictions: string[];
}

const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

/** Jurisdiction-specific compliance configurations */
const COMPLIANCE_RULES: Record<Jurisdiction, Omit<ComplianceRules, "jurisdiction" | "countryCode">> = {
  US: {
    requiresAiDisclosure: true,
    redisclosureIntervalMs: THREE_HOURS_MS, // NY AI Companion Safeguards Act
    requiresCrisisProtocol: true,           // CA SB 243
    crisisResources: "988 Suicide & Crisis Lifeline (call or text 988), Crisis Text Line (text HOME to 741741), or call 911",
    minimumAge: 18,                         // Our own policy (COPPA floor is 13)
    requiresParentalConsent: false,         // 18+ only = no minors
    dataDeletionDeadlineDays: 30,           // CCPA: 45 days, we do 30
    requiresExplicitConsent: false,         // US has no GDPR-style consent mandate (except CCPA opt-out)
    requiresAiOptOut: false,
    requiresDataLocalization: false,
    contentRestrictions: [],
  },
  EU: {
    requiresAiDisclosure: true,             // EU AI Act Article 52
    redisclosureIntervalMs: 0,              // No periodic re-disclosure required
    requiresCrisisProtocol: true,
    crisisResources: "Contact your local emergency services (112 in EU) or visit https://www.iasp.info/resources/Crisis_Centres/",
    minimumAge: 16,                         // GDPR Article 8 (member states can lower to 13)
    requiresParentalConsent: true,          // Under 16 per GDPR
    dataDeletionDeadlineDays: 30,           // GDPR: "without undue delay" / 30 days
    requiresExplicitConsent: true,          // GDPR Article 6/7
    requiresAiOptOut: true,                 // GDPR Article 22 — right not to be subject to automated decision-making
    requiresDataLocalization: false,        // Allowed with adequate safeguards (SCCs)
    contentRestrictions: ["right_to_be_forgotten"],
  },
  UK: {
    requiresAiDisclosure: true,             // UK AI regulation framework
    redisclosureIntervalMs: 0,
    requiresCrisisProtocol: true,
    crisisResources: "Samaritans: 116 123 (free, 24/7), Crisis Text Line: text SHOUT to 85258, or call 999",
    minimumAge: 13,                         // UK GDPR Age Appropriate Design Code
    requiresParentalConsent: true,
    dataDeletionDeadlineDays: 30,           // UK GDPR
    requiresExplicitConsent: true,          // UK GDPR
    requiresAiOptOut: true,
    requiresDataLocalization: false,
    contentRestrictions: ["online_safety_act"],
  },
  CA: {
    requiresAiDisclosure: true,             // AIDA (Artificial Intelligence and Data Act)
    redisclosureIntervalMs: 0,
    requiresCrisisProtocol: true,
    crisisResources: "Canada Suicide Prevention Service: 1-833-456-4566, Crisis Text Line: text HOME to 686868",
    minimumAge: 18,                         // Our policy
    requiresParentalConsent: false,
    dataDeletionDeadlineDays: 30,           // PIPEDA
    requiresExplicitConsent: true,          // PIPEDA requires meaningful consent
    requiresAiOptOut: false,
    requiresDataLocalization: false,
    contentRestrictions: [],
  },
  AU: {
    requiresAiDisclosure: true,
    redisclosureIntervalMs: 0,
    requiresCrisisProtocol: true,
    crisisResources: "Lifeline Australia: 13 11 14, Beyond Blue: 1300 22 4636, Kids Helpline: 1800 55 1800",
    minimumAge: 16,                         // Online Safety Act focus on minors
    requiresParentalConsent: true,
    dataDeletionDeadlineDays: 30,
    requiresExplicitConsent: false,         // Privacy Act uses "reasonable" standard
    requiresAiOptOut: false,
    requiresDataLocalization: false,
    contentRestrictions: ["esafety_commissioner"],
  },
  BR: {
    requiresAiDisclosure: true,
    redisclosureIntervalMs: 0,
    requiresCrisisProtocol: true,
    crisisResources: "CVV (Centro de Valorização da Vida): 188 or chat at www.cvv.org.br",
    minimumAge: 18,
    requiresParentalConsent: false,
    dataDeletionDeadlineDays: 15,           // LGPD is stricter
    requiresExplicitConsent: true,          // LGPD requires legal basis
    requiresAiOptOut: true,                 // LGPD Article 20
    requiresDataLocalization: false,
    contentRestrictions: [],
  },
  JP: {
    requiresAiDisclosure: true,
    redisclosureIntervalMs: 0,
    requiresCrisisProtocol: true,
    crisisResources: "TELL Lifeline: 03-5774-0992, Yorisoi Hotline: 0120-279-338",
    minimumAge: 18,
    requiresParentalConsent: false,
    dataDeletionDeadlineDays: 30,           // APPI
    requiresExplicitConsent: true,          // APPI requires consent for sensitive data
    requiresAiOptOut: false,
    requiresDataLocalization: false,        // Allowed with safeguards
    contentRestrictions: [],
  },
  KR: {
    requiresAiDisclosure: true,
    redisclosureIntervalMs: 0,
    requiresCrisisProtocol: true,
    crisisResources: "Korea Suicide Prevention Center: 1393, Mental Health Crisis Line: 1577-0199",
    minimumAge: 14,                         // PIPA
    requiresParentalConsent: true,          // Under 14
    dataDeletionDeadlineDays: 5,            // PIPA is very strict on deletion
    requiresExplicitConsent: true,          // PIPA
    requiresAiOptOut: true,                 // PIPA automated decision rights
    requiresDataLocalization: false,
    contentRestrictions: [],
  },
  IN: {
    requiresAiDisclosure: true,
    redisclosureIntervalMs: 0,
    requiresCrisisProtocol: true,
    crisisResources: "AASRA: 9820466726, iCall: 9152987821, Vandrevala Foundation: 1860-2662-345",
    minimumAge: 18,                         // DPDP Act
    requiresParentalConsent: true,          // Under 18 per DPDP
    dataDeletionDeadlineDays: 30,
    requiresExplicitConsent: true,          // DPDP Act
    requiresAiOptOut: false,
    requiresDataLocalization: true,         // DPDP may require for certain categories
    contentRestrictions: [],
  },
  RU: {
    requiresAiDisclosure: true,
    redisclosureIntervalMs: 0,
    requiresCrisisProtocol: true,
    crisisResources: "Phone of Trust: 8-800-2000-122 (free), Emergency: 112",
    minimumAge: 18,
    requiresParentalConsent: false,
    dataDeletionDeadlineDays: 30,
    requiresExplicitConsent: true,          // Federal Law No. 152-FZ
    requiresAiOptOut: false,
    requiresDataLocalization: true,         // Russian data must be stored in Russia
    contentRestrictions: ["roskomnadzor"],
  },
  CN: {
    requiresAiDisclosure: true,             // CAC generative AI regulations
    redisclosureIntervalMs: 0,
    requiresCrisisProtocol: true,
    crisisResources: "Beijing Psychological Crisis Research and Intervention Center: 010-82951332, Emergency: 120",
    minimumAge: 14,                         // PIPL
    requiresParentalConsent: true,          // Under 14
    dataDeletionDeadlineDays: 15,           // PIPL
    requiresExplicitConsent: true,          // PIPL requires separate consent for sensitive data
    requiresAiOptOut: true,                 // PIPL Article 24
    requiresDataLocalization: true,         // PIPL requires data localization
    contentRestrictions: ["cac_content_rules", "socialist_core_values"],
  },
  DEFAULT: {
    requiresAiDisclosure: true,
    redisclosureIntervalMs: 0,
    requiresCrisisProtocol: true,
    crisisResources: "If you are in crisis, please contact your local emergency services or visit https://findahelpline.com/",
    minimumAge: 18,
    requiresParentalConsent: false,
    dataDeletionDeadlineDays: 30,
    requiresExplicitConsent: true,          // Default to strictest — require consent
    requiresAiOptOut: true,
    requiresDataLocalization: false,
    contentRestrictions: [],
  },
};

/**
 * Detect user's jurisdiction from request headers.
 * Uses Cloudflare's CF-IPCountry header (set at edge, not spoofable).
 * Falls back to Vercel's x-vercel-ip-country, then DEFAULT.
 */
export function getJurisdiction(headers: Headers): Jurisdiction {
  // Cloudflare sets this at the edge — trustworthy
  const cfCountry = headers.get("cf-ipcountry")?.toUpperCase();
  if (cfCountry && cfCountry !== "XX" && cfCountry !== "T1") {
    return COUNTRY_TO_JURISDICTION[cfCountry] ?? "DEFAULT";
  }

  // Vercel also provides geo headers
  const vercelCountry = headers.get("x-vercel-ip-country")?.toUpperCase();
  if (vercelCountry) {
    return COUNTRY_TO_JURISDICTION[vercelCountry] ?? "DEFAULT";
  }

  return "DEFAULT";
}

/**
 * Get the raw ISO country code from headers.
 */
export function getCountryCode(headers: Headers): string {
  const cfCountry = headers.get("cf-ipcountry")?.toUpperCase();
  if (cfCountry && cfCountry !== "XX" && cfCountry !== "T1") return cfCountry;

  const vercelCountry = headers.get("x-vercel-ip-country")?.toUpperCase();
  if (vercelCountry) return vercelCountry;

  return "UNKNOWN";
}

/**
 * Get the full compliance rules for the user's jurisdiction.
 * This is the primary API — call it in API routes to determine
 * what legal framework applies to the current request.
 */
export function getComplianceRules(headers: Headers): ComplianceRules {
  const jurisdiction = getJurisdiction(headers);
  const countryCode = getCountryCode(headers);
  const rules = COMPLIANCE_RULES[jurisdiction];

  return {
    ...rules,
    jurisdiction,
    countryCode,
  };
}

/**
 * Get crisis resources for the user's jurisdiction.
 * Used in Bestie safety standard and chat error states.
 */
export function getCrisisResources(headers: Headers): string {
  const rules = getComplianceRules(headers);
  return rules.crisisResources;
}

/**
 * Check if the jurisdiction requires explicit consent before AI processing.
 * EU (GDPR), Brazil (LGPD), Japan (APPI), etc. require this.
 */
export function requiresExplicitConsent(headers: Headers): boolean {
  return getComplianceRules(headers).requiresExplicitConsent;
}

/**
 * Get the disclosure re-show interval for the user's jurisdiction.
 * Returns 0 if periodic re-disclosure is not required.
 * US (NY law) requires every 3 hours.
 */
export function getRedisclosureInterval(headers: Headers): number {
  return getComplianceRules(headers).redisclosureIntervalMs;
}
