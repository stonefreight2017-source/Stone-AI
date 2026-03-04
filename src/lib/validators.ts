import { z } from "zod";

export const createConversationSchema = z.object({});

export const updateConversationSchema = z.object({
  title: z.string().min(1).max(200),
});

export const chatMessageSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(32000, "Message is too long (max 32,000 characters)")
    .refine((val) => val.trim().length > 0, "Message cannot be only whitespace"),
  conversationId: z.string().cuid(),
  mode: z.enum(["LOCAL", "SMART"]).default("LOCAL"),
});
