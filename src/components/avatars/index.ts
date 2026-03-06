export { default as SVGAvatar, SVGAvatar as SVGAvatarComponent } from "./SVGAvatar";
export { default as AvatarBuilder, AvatarBuilder as AvatarBuilderComponent } from "./AvatarBuilder";
export {
  type AvatarConfig,
  DEFAULT_AVATAR_CONFIG,
  COLOR_PALETTES,
  SHAPE_OPTIONS,
  PATTERN_OPTIONS,
  EYES_OPTIONS,
  MOUTH_OPTIONS,
  ACCESSORY_OPTIONS,
  EXPRESSION_OPTIONS,
} from "./avatar-parts";
export { generateAvatarFromName, generateRandomAvatar } from "@/lib/avatar-generator";
