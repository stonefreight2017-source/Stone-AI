export interface EmoteDefinition {
  id: string;
  emoji: string;
  label: string;
  animationClass: string;
  category: "reaction" | "mood" | "celebration" | "expression";
}

export const EMOTE_CATEGORIES = [
  { key: "reaction" as const, label: "Reactions" },
  { key: "mood" as const, label: "Moods" },
  { key: "celebration" as const, label: "Celebrations" },
  { key: "expression" as const, label: "Expressions" },
] as const;

export const EMOTES: EmoteDefinition[] = [
  // Reactions (for forum posts, chat)
  { id: "fire", emoji: "\uD83D\uDD25", label: "Fire", animationClass: "emote-bounce", category: "reaction" },
  { id: "100", emoji: "\uD83D\uDCAF", label: "100", animationClass: "emote-pop", category: "reaction" },
  { id: "brain", emoji: "\uD83E\uDDE0", label: "Big Brain", animationClass: "emote-pulse", category: "reaction" },
  { id: "rocket", emoji: "\uD83D\uDE80", label: "Rocket", animationClass: "emote-launch", category: "reaction" },
  { id: "clap", emoji: "\uD83D\uDC4F", label: "Clap", animationClass: "emote-shake", category: "reaction" },
  { id: "eyes", emoji: "\uD83D\uDC40", label: "Eyes", animationClass: "emote-peek", category: "reaction" },

  // Moods
  { id: "chill", emoji: "\uD83D\uDE0E", label: "Chill", animationClass: "emote-float", category: "mood" },
  { id: "think", emoji: "\uD83E\uDD14", label: "Thinking", animationClass: "emote-tilt", category: "mood" },
  { id: "love", emoji: "\uD83D\uDE0D", label: "Love It", animationClass: "emote-heartbeat", category: "mood" },
  { id: "mindblown", emoji: "\uD83E\uDD2F", label: "Mind Blown", animationClass: "emote-explode", category: "mood" },
  { id: "laugh", emoji: "\uD83D\uDE02", label: "Dying", animationClass: "emote-shake", category: "mood" },
  { id: "hug", emoji: "\uD83E\uDD17", label: "Hug", animationClass: "emote-squeeze", category: "mood" },

  // Celebrations
  { id: "party", emoji: "\uD83C\uDF89", label: "Party", animationClass: "emote-confetti", category: "celebration" },
  { id: "trophy", emoji: "\uD83C\uDFC6", label: "Trophy", animationClass: "emote-shine", category: "celebration" },
  { id: "star", emoji: "\u2B50", label: "Star", animationClass: "emote-spin", category: "celebration" },
  { id: "gem", emoji: "\uD83D\uDC8E", label: "Gem", animationClass: "emote-sparkle", category: "celebration" },
  { id: "crown", emoji: "\uD83D\uDC51", label: "Crown", animationClass: "emote-float", category: "celebration" },
  { id: "flex", emoji: "\uD83D\uDCAA", label: "Flex", animationClass: "emote-pump", category: "celebration" },

  // Expressions
  { id: "salute", emoji: "\uD83E\uDEE1", label: "Salute", animationClass: "emote-nod", category: "expression" },
  { id: "chef", emoji: "\uD83E\uDD0C", label: "Chef's Kiss", animationClass: "emote-kiss", category: "expression" },
  { id: "skull", emoji: "\uD83D\uDC80", label: "Dead", animationClass: "emote-fade", category: "expression" },
  { id: "goat", emoji: "\uD83D\uDC10", label: "GOAT", animationClass: "emote-bounce", category: "expression" },
  { id: "wave", emoji: "\uD83D\uDC4B", label: "Wave", animationClass: "emote-wave", category: "expression" },
  { id: "pray", emoji: "\uD83D\uDE4F", label: "Please", animationClass: "emote-bow", category: "expression" },
];

export function getEmoteById(id: string): EmoteDefinition | undefined {
  return EMOTES.find((e) => e.id === id);
}

export function getEmotesByCategory(category: EmoteDefinition["category"]): EmoteDefinition[] {
  return EMOTES.filter((e) => e.category === category);
}
