/**
 * Bestie Avatar Generation — Trait-to-Visual Mapping
 *
 * Users never pick their avatar's appearance directly. Instead, their choices
 * throughout creation (purpose, traits, style, expertise, path) are translated
 * into visual attributes that produce a unique anime-style character portrait.
 *
 * The mapping is deterministic: same personality config = same visual description.
 * DALL-E 3 generates a crisp, consistent anime avatar from the description.
 */

import type { BestieTrait, BestieStyle, BestieExpertise, BestiePath } from "@/lib/bestie-validators";

// ── Visual attribute types ──

interface VisualAttributes {
  hairLength: string;
  hairStyle: string;
  hairColor: string;
  eyeStyle: string;
  glasses: boolean;
  glassesType?: string;
  hat: boolean;
  hatType?: string;
  attire: string;
  accessories: string[];
  expression: string;
  backgroundHint: string;
  colorPalette: string;
  bodyType: string;
}

// ── Trait → Visual mappings ──

const TRAIT_VISUALS: Record<BestieTrait, Partial<VisualAttributes>> = {
  empathetic: { expression: "warm caring smile with gentle eyes", eyeStyle: "large expressive soft eyes", colorPalette: "warm pastels" },
  witty: { expression: "playful smirk with a twinkle in their eye", accessories: ["small ear cuff"] },
  direct: { expression: "confident knowing gaze", hairStyle: "clean well-kept", eyeStyle: "sharp focused eyes" },
  nurturing: { expression: "soft motherly/fatherly smile", attire: "cozy comfortable sweater", colorPalette: "earth tones" },
  adventurous: { hat: true, hatType: "casual beanie", accessories: ["woven bracelet"], expression: "excited bright grin", colorPalette: "vibrant warm" },
  intellectual: { glasses: true, glassesType: "stylish rectangular frames", expression: "thoughtful contemplative look", accessories: ["book tucked under arm"] },
  playful: { expression: "big cheerful grin with tongue slightly out", hairColor: "with subtle colorful streaks", accessories: ["fun pins on clothing"] },
  calm: { expression: "serene peaceful half-smile", hairStyle: "flowing and relaxed", colorPalette: "cool blues and greens" },
  motivating: { expression: "determined inspiring smile", attire: "fitted athletic-casual", colorPalette: "bold red and orange accents" },
  creative: { hairStyle: "artistically tousled", accessories: ["paint-stained fingers", "creative jewelry"], colorPalette: "eclectic vibrant" },
  loyal: { expression: "steady trustworthy smile", eyeStyle: "deep sincere eyes", attire: "classic reliable look" },
  sarcastic: { expression: "raised eyebrow with half-smile", glasses: true, glassesType: "trendy round frames" },
  analytical: { glasses: true, glassesType: "thin metal rectangular glasses", expression: "focused calculating gaze", attire: "neat button-up shirt" },
  spontaneous: { hairStyle: "windswept messy", expression: "wide excited eyes", accessories: ["mismatched earrings"], colorPalette: "bright contrasting" },
  protective: { bodyType: "strong solid build", expression: "watchful caring look", attire: "sturdy jacket" },
  philosophical: { expression: "deep thoughtful distant gaze", accessories: ["simple meaningful pendant"], hairStyle: "slightly long and thoughtful" },
  competitive: { expression: "fierce confident smirk", attire: "sporty sharp athleisure", accessories: ["wristband"] },
  chill: { expression: "relaxed easygoing smile", hairStyle: "casual effortless", attire: "oversized hoodie", colorPalette: "muted ocean tones" },
};

const STYLE_VISUALS: Record<BestieStyle, Partial<VisualAttributes>> = {
  casual: { attire: "trendy casual streetwear", hairStyle: "natural and relaxed" },
  supportive: { attire: "warm comfortable knit top", expression: "open welcoming smile" },
  intellectual: { attire: "smart casual with blazer", glasses: true, glassesType: "sophisticated dark frames" },
  hype: { attire: "bold colorful fashion-forward outfit", accessories: ["statement earrings"], colorPalette: "electric neon accents" },
  blunt: { attire: "simple no-nonsense clean outfit", expression: "direct straightforward gaze", hairStyle: "sharp clean cut" },
  gentle: { attire: "soft flowing pastel clothing", expression: "tender gentle smile", hairStyle: "soft waves", colorPalette: "soft pastels and cream" },
  professional: { attire: "crisp business casual blazer and shirt", hairStyle: "polished and neat", glasses: true, glassesType: "modern minimalist frames" },
  storyteller: { attire: "bohemian layered clothing", accessories: ["interesting vintage ring", "patterned scarf"], hairStyle: "slightly long and characterful" },
};

const PATH_VISUALS: Record<BestiePath, Partial<VisualAttributes>> = {
  friend: { attire: "casual comfortable everyday clothes", backgroundHint: "cozy living room or cafe" },
  colleague: { attire: "sharp business professional attire", backgroundHint: "modern office with city view", hairStyle: "polished professional" },
  hybrid: { attire: "smart-casual versatile outfit", backgroundHint: "stylish modern workspace with personal touches" },
  tutor: { attire: "academic smart-casual with rolled sleeves", glasses: true, glassesType: "professorial round glasses", backgroundHint: "warm library or study", accessories: ["pen behind ear"] },
};

const EXPERTISE_ACCENTS: Partial<Record<BestieExpertise, Partial<VisualAttributes>>> = {
  tech: { accessories: ["wireless earbuds"], backgroundHint: "clean modern tech setup" },
  fitness: { bodyType: "athletic toned build", attire: "fitted athletic wear" },
  music: { accessories: ["headphones around neck"], backgroundHint: "music studio vibes" },
  cooking: { accessories: ["flour dusted apron hint"], backgroundHint: "warm kitchen" },
  finance: { attire: "sharp tailored vest", accessories: ["elegant watch"] },
  travel: { accessories: ["travel charm bracelet"], backgroundHint: "scenic world map pins" },
  sports: { attire: "sporty casual jersey-inspired", bodyType: "athletic build" },
  creativity: { accessories: ["art supplies nearby"], hairStyle: "creatively styled with color accent" },
  spirituality: { accessories: ["simple mala beads or bracelet"], colorPalette: "warm golden and purple" },
};

// ── Merge attributes with priority layering ──

function mergeVisuals(...layers: Partial<VisualAttributes>[]): VisualAttributes {
  const base: VisualAttributes = {
    hairLength: "medium length",
    hairStyle: "natural and stylish",
    hairColor: "natural tone",
    eyeStyle: "expressive anime eyes",
    glasses: false,
    hat: false,
    attire: "modern casual clothing",
    accessories: [],
    expression: "friendly warm smile",
    backgroundHint: "soft gradient",
    colorPalette: "balanced warm and cool",
    bodyType: "average build",
  };

  for (const layer of layers) {
    if (layer.hairLength) base.hairLength = layer.hairLength;
    if (layer.hairStyle) base.hairStyle = layer.hairStyle;
    if (layer.hairColor) base.hairColor = layer.hairColor;
    if (layer.eyeStyle) base.eyeStyle = layer.eyeStyle;
    if (layer.glasses) { base.glasses = true; base.glassesType = layer.glassesType || base.glassesType; }
    if (layer.hat) { base.hat = true; base.hatType = layer.hatType || base.hatType; }
    if (layer.attire) base.attire = layer.attire;
    if (layer.accessories) base.accessories = [...base.accessories, ...layer.accessories];
    if (layer.expression) base.expression = layer.expression;
    if (layer.backgroundHint) base.backgroundHint = layer.backgroundHint;
    if (layer.colorPalette) base.colorPalette = layer.colorPalette;
    if (layer.bodyType) base.bodyType = layer.bodyType;
  }

  // Dedupe accessories
  base.accessories = [...new Set(base.accessories)];

  return base;
}

// ── Build visual attributes from personality config ──

export function buildVisualAttributes(config: {
  traits: BestieTrait[];
  style?: BestieStyle;
  expertise: BestieExpertise[];
  path?: BestiePath;
  purposes?: string[];
}): VisualAttributes {
  const layers: Partial<VisualAttributes>[] = [];

  // Path sets the baseline look
  if (config.path) {
    layers.push(PATH_VISUALS[config.path]);
  }

  // Style refines the overall aesthetic
  if (config.style) {
    layers.push(STYLE_VISUALS[config.style]);
  }

  // Traits add personality-specific details (most impactful)
  for (const trait of config.traits) {
    layers.push(TRAIT_VISUALS[trait]);
  }

  // Primary expertise adds accents
  if (config.expertise.length > 0) {
    const primary = config.expertise[0];
    const accent = EXPERTISE_ACCENTS[primary];
    if (accent) layers.push(accent);
  }

  return mergeVisuals(...layers);
}

// ── Generate DALL-E prompt from visual attributes ──

export function buildAvatarPrompt(attrs: VisualAttributes): string {
  const parts: string[] = [];

  parts.push("High quality anime-style character portrait, bust shot, clean digital art");
  parts.push(`${attrs.bodyType}, ${attrs.hairLength} ${attrs.hairStyle} hair in ${attrs.hairColor}`);
  parts.push(`${attrs.eyeStyle}`);
  parts.push(`${attrs.expression}`);
  parts.push(`Wearing ${attrs.attire}`);

  if (attrs.glasses && attrs.glassesType) {
    parts.push(`Wearing ${attrs.glassesType}`);
  }
  if (attrs.hat && attrs.hatType) {
    parts.push(`Wearing a ${attrs.hatType}`);
  }
  if (attrs.accessories.length > 0) {
    parts.push(`With ${attrs.accessories.join(", ")}`);
  }

  parts.push(`Color palette: ${attrs.colorPalette}`);
  parts.push(`Background: ${attrs.backgroundHint}`);
  parts.push("Professional anime illustration, vibrant, detailed, sharp lines, beautiful lighting");
  parts.push("Single character only, centered composition, looking at viewer");
  parts.push("Studio quality, no text, no watermark, no signature");

  return parts.join(". ") + ".";
}

/**
 * Full pipeline: personality config -> DALL-E prompt string
 */
export function generateAvatarPrompt(config: {
  traits: BestieTrait[];
  style?: BestieStyle;
  expertise: BestieExpertise[];
  path?: BestiePath;
  purposes?: string[];
}): { prompt: string; attributes: VisualAttributes } {
  const attributes = buildVisualAttributes(config);
  const prompt = buildAvatarPrompt(attributes);
  return { prompt, attributes };
}
