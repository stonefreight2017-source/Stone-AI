import { BACKDROP_POOL, type PoolBackdrop } from "@/components/backdrops/backdrop-pool";

export function validateNameKey(key: string): { valid: boolean; normalized: string; error?: string } {
  const normalized = key.toLowerCase().replace(/[^a-z]/g, "").slice(0, 8);
  if (!normalized.length) return { valid: false, normalized: "", error: "Enter at least 1 letter" };
  return { valid: true, normalized };
}

export function getUnlockedBackdrops(nameKey: string): PoolBackdrop[] {
  const { valid, normalized } = validateNameKey(nameKey);
  if (!valid) return [];

  const unlocked = new Set<string>();
  const families = ["ember", "frost", "neon", "earth", "twilight", "solar", "storm", "coral", "void", "prism"];

  for (let pos = 0; pos < normalized.length; pos++) {
    const cc = normalized.charCodeAt(pos);
    const f1 = families[(cc + pos * 7) % 10];
    const f2 = families[(cc + pos * 3 + 5) % 10];
    const f1Items = BACKDROP_POOL.filter(b => b.family === f1);
    const f2Items = BACKDROP_POOL.filter(b => b.family === f2);
    unlocked.add(f1Items[(cc * (pos + 1)) % f1Items.length].id);
    unlocked.add(f1Items[(cc * (pos + 2) + 3) % f1Items.length].id);
    unlocked.add(f2Items[(cc * (pos + 1) + 7) % f2Items.length].id);
  }

  return BACKDROP_POOL.filter(b => unlocked.has(b.id));
}

export function getBackdropSeedInfo(nameKey: string) {
  const backdrops = getUnlockedBackdrops(nameKey);
  return {
    normalized: validateNameKey(nameKey).normalized,
    primaryFamilies: [...new Set(backdrops.map(b => b.family))],
    totalUnlocked: backdrops.length,
    backdrops,
  };
}
