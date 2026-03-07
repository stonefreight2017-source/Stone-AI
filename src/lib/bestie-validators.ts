import { z } from "zod";

export const BESTIE_LANGUAGES = [
  "en",
  "zh",
  "es",
  "hi",
  "fr",
  "ar",
  "pt",
  "ja",
  "bn",
  "de",
] as const;

export type BestieLanguage = (typeof BESTIE_LANGUAGES)[number];

export const BESTIE_LANGUAGE_LABELS: Record<BestieLanguage, string> = {
  en: "English",
  zh: "Mandarin Chinese",
  es: "Spanish",
  hi: "Hindi",
  fr: "French",
  ar: "Arabic",
  pt: "Portuguese",
  ja: "Japanese",
  bn: "Bengali",
  de: "German",
};

export const BESTIE_TRAITS = [
  "empathetic",
  "witty",
  "direct",
  "nurturing",
  "adventurous",
  "intellectual",
  "playful",
  "calm",
  "motivating",
  "creative",
  "loyal",
  "sarcastic",
  "analytical",
  "spontaneous",
  "protective",
  "philosophical",
  "competitive",
  "chill",
] as const;

export const BESTIE_STYLES = [
  "casual",
  "supportive",
  "intellectual",
  "hype",
  "blunt",
  "gentle",
  "professional",
  "storyteller",
] as const;

export const BESTIE_EXPERTISE = [
  "wellness",
  "career",
  "relationships",
  "creativity",
  "fitness",
  "finance",
  "tech",
  "philosophy",
  "everyday",
  "parenting",
  "cooking",
  "music",
  "sports",
  "spirituality",
  "humor",
  "travel",
] as const;

export type BestieTrait = (typeof BESTIE_TRAITS)[number];
export type BestieStyle = (typeof BESTIE_STYLES)[number];
export type BestieExpertise = (typeof BESTIE_EXPERTISE)[number];

/**
 * Bestie path — determines the UI theme, default traits, and mode behavior.
 * "friend" = warm/casual theme, always-on friend mode
 * "colleague" = professional/office theme, business-hours mode
 * "hybrid" = both — switches between friend/colleague based on schedule
 * "tutor" = educational theme, learning-focused
 */
export const BESTIE_PATHS = ["friend", "colleague", "hybrid", "tutor"] as const;
export type BestiePath = (typeof BESTIE_PATHS)[number];

export const BESTIE_PATH_LABELS: Record<BestiePath, string> = {
  friend: "Best Friend",
  colleague: "Business Partner",
  hybrid: "Best Friend + Business Partner",
  tutor: "Tutor & Mentor",
};

/**
 * Schedule config for hybrid besties — when to be friend vs colleague.
 * Times are in user's local timezone.
 */
export const scheduleSchema = z.object({
  businessDays: z.array(z.number().min(0).max(6)).default([1, 2, 3, 4, 5]), // Mon-Fri
  businessStart: z.string().default("09:00"), // HH:MM
  businessEnd: z.string().default("17:00"),
  timezone: z.string().default("America/New_York"),
});

export type BestieSchedule = z.infer<typeof scheduleSchema>;

export const createBestieSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(20, "Name must be 20 characters or less")
    .regex(/^[a-zA-Z0-9 _-]+$/, "Name can only contain letters, numbers, spaces, hyphens, and underscores"),
  path: z.enum(BESTIE_PATHS).default("friend"),
  traits: z
    .array(z.enum(BESTIE_TRAITS))
    .max(5, "Pick at most 5 personality traits")
    .default([]),
  styles: z.array(z.enum(BESTIE_STYLES)).min(1).max(2),
  expertise: z
    .array(z.enum(BESTIE_EXPERTISE))
    .max(5, "Pick at most 5 topics")
    .default([]),
  avatarEmoji: z.string().min(1).max(100000).refine(val => val.length <= 10 || /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(val), "Invalid avatar format").default("\uD83D\uDC9C"),
  language: z.enum(BESTIE_LANGUAGES).default("en"),
  purposes: z.array(z.string().max(30)).max(3).default([]),
  bgTheme: z.string().max(30).default("pure-dark"),
  schedule: scheduleSchema.optional(),
  aboutMe: z.object({
    name: z.string().max(50).optional(),
    birthday: z.string().max(20).optional(),
    siblings: z.string().max(100).optional(),
    location: z.string().max(100).optional(),
    favorites: z.string().max(200).optional(),
    other: z.string().max(500).optional(),
  }).optional(),
  voicePrefs: z.object({
    autoEnable: z.boolean().default(false),
    speed: z.enum(["slow", "normal", "fast"]).default("normal"),
    pitch: z.enum(["low", "medium", "high"]).default("medium"),
    autoSpeak: z.boolean().default(false),
  }).optional(),
  safetyNet: z.object({
    enabled: z.boolean().default(false),
    curfewTime: z.string().max(5).optional(),
    contacts: z.array(z.object({
      name: z.string().max(50),
      phone: z.string().max(20).optional(),
      relationship: z.string().max(30).optional(),
    })).max(5).default([]),
    message: z.string().max(200).optional(),
  }).optional(),
  autoText: z.object({
    enabled: z.boolean().default(false),
    rules: z.array(z.object({
      trigger: z.string().max(50),
      contact: z.string().max(50),
      template: z.string().max(200),
    })).max(10).default([]),
  }).optional(),
});

export const updateBestieSchema = createBestieSchema.partial();

export const bestieChatSchema = z.object({
  conversationId: z.string().cuid(),
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(4000, "Message is too long (max 4,000 characters)")
    .refine((val) => val.trim().length > 0, "Message cannot be only whitespace"),
  mode: z.enum(["LOCAL", "SMART"]).default("LOCAL"),
});
