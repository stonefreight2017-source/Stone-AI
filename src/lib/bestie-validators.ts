import { z } from "zod";

export const BESTIE_LANGUAGES = [
  "en",
  "zh",
  "es",
  "hi",
  "fr",
  "ar",
] as const;

export type BestieLanguage = (typeof BESTIE_LANGUAGES)[number];

export const BESTIE_LANGUAGE_LABELS: Record<BestieLanguage, string> = {
  en: "English",
  zh: "Mandarin Chinese",
  es: "Spanish",
  hi: "Hindi",
  fr: "French",
  ar: "Arabic",
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
] as const;

export const BESTIE_STYLES = [
  "casual",
  "supportive",
  "intellectual",
  "hype",
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
] as const;

export type BestieTrait = (typeof BESTIE_TRAITS)[number];
export type BestieStyle = (typeof BESTIE_STYLES)[number];
export type BestieExpertise = (typeof BESTIE_EXPERTISE)[number];

export const createBestieSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(20, "Name must be 20 characters or less")
    .regex(/^[a-zA-Z0-9 _-]+$/, "Name can only contain letters, numbers, spaces, hyphens, and underscores"),
  traits: z
    .array(z.enum(BESTIE_TRAITS))
    .length(3, "Pick exactly 3 personality traits"),
  style: z.enum(BESTIE_STYLES),
  expertise: z
    .array(z.enum(BESTIE_EXPERTISE))
    .min(1, "Pick at least 1 expertise area")
    .max(3, "Pick at most 3 expertise areas"),
  avatarEmoji: z.string().min(1).max(4).default("\uD83D\uDC9C"),
  language: z.enum(BESTIE_LANGUAGES).default("en"),
  aboutMe: z.object({
    name: z.string().max(50).optional(),
    birthday: z.string().max(20).optional(),
    siblings: z.string().max(100).optional(),
    location: z.string().max(100).optional(),
    favorites: z.string().max(200).optional(),
    other: z.string().max(500).optional(),
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
