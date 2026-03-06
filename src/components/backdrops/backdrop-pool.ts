// ─── Name-Seeded Backdrop Pool ──────────────────────────────────────────────
// 100 pure-CSS gradient backdrops in 10 families of 10.
// Programmatically generated from family color configs.
// Zero runtime cost — no JS animation frames, no WebGL, no external deps.

export interface PoolBackdrop {
  id: string;            // "pool-ember-drift", "pool-frost-shatter", etc.
  name: string;          // "Ember Drift", "Frost Shatter"
  family: string;        // "ember", "frost", etc.
  description: string;
  previewClass: string;  // Tailwind gradient for thumbnail
  gradientCSS: string;   // Full CSS gradient string for rendering
  animationName: string; // One of the existing animation class names
}

// ─── Family Definitions ─────────────────────────────────────────────────────

interface FamilyConfig {
  family: string;
  animationName: string;
  // RGB ranges: [rMin, rMax, gMin, gMax, bMin, bMax]
  colorRange: [number, number, number, number, number, number];
  names: [string, string, string, string, string, string, string, string, string, string];
  descriptions: string[];
  previewFrom: string;
  previewVia: string;
}

const POSITIONS = [
  "top_left", "top_right", "bottom_left", "bottom_right", "center",
  "top", "bottom", "center_left", "center_right", "top_left",
];

const FAMILIES: FamilyConfig[] = [
  {
    family: "ember",
    animationName: "backdrop-fire",
    colorRange: [150, 250, 30, 110, 5, 40],
    names: ["Ember Drift", "Ember Forge", "Ember Whisper", "Ember Pulse", "Ember Blaze", "Ember Glow", "Ember Tide", "Ember Flare", "Ember Rush", "Ember Dusk"],
    descriptions: [
      "Slow-drifting warm embers rising from below",
      "Glowing forge heat radiating from center",
      "Faint whisper of warmth along the edges",
      "Rhythmic pulse of deep red light",
      "Intense blaze of orange and crimson",
      "Soft ember glow fading at the horizon",
      "Tidal wave of warm amber tones",
      "Sudden flare of bright orange sparks",
      "Rushing heat from a distant furnace",
      "Dying embers at twilight's edge",
    ],
    previewFrom: "red-900/50",
    previewVia: "orange-950/40",
  },
  {
    family: "frost",
    animationName: "backdrop-ocean",
    colorRange: [10, 40, 70, 155, 155, 215],
    names: ["Frost Shatter", "Frost Veil", "Frost Gleam", "Frost Cascade", "Frost Whisper", "Frost Bloom", "Frost Edge", "Frost Drift", "Frost Haze", "Frost Crystal"],
    descriptions: [
      "Cracked ice shimmering in pale blue",
      "Thin veil of frost across the surface",
      "Gleaming frost catching faint light",
      "Cascading sheets of frozen blue",
      "Whisper of cold drifting through cyan",
      "Bloom of ice crystals forming slowly",
      "Sharp frost edge glinting in moonlight",
      "Gentle drift of snowflake patterns",
      "Hazy frost blurring the horizon",
      "Crystal-clear frozen geometry",
    ],
    previewFrom: "blue-900/50",
    previewVia: "cyan-950/40",
  },
  {
    family: "neon",
    animationName: "backdrop-aurora",
    colorRange: [188, 245, 22, 75, 168, 255],
    names: ["Neon Surge", "Neon Pulse", "Neon Wire", "Neon Haze", "Neon Spark", "Neon Grid", "Neon Flux", "Neon Bloom", "Neon Edge", "Neon Drift"],
    descriptions: [
      "Surging neon pink and cyan waves",
      "Pulsing neon lights in the dark",
      "Thin neon wireframe glow",
      "Hazy neon mist diffusing outward",
      "Sparking neon discharge bursts",
      "Grid of neon light lines",
      "Flowing neon flux patterns",
      "Blooming neon light pools",
      "Sharp neon edge highlights",
      "Drifting neon vapor trails",
    ],
    previewFrom: "pink-900/50",
    previewVia: "cyan-900/40",
  },
  {
    family: "earth",
    animationName: "backdrop-emerald",
    colorRange: [35, 75, 95, 165, 25, 65],
    names: ["Earth Root", "Earth Moss", "Earth Canopy", "Earth Fern", "Earth Vale", "Earth Glen", "Earth Thicket", "Earth Meadow", "Earth Ridge", "Earth Hollow"],
    descriptions: [
      "Deep roots spreading through dark soil",
      "Soft moss growing on ancient stone",
      "Canopy light filtering through leaves",
      "Unfurling fern fronds in green shade",
      "Quiet vale bathed in emerald light",
      "Hidden glen with dappled green glow",
      "Dense thicket of overlapping greens",
      "Open meadow stretching to the horizon",
      "Rocky ridge dusted with lichen",
      "Hollow tree lit from within",
    ],
    previewFrom: "green-900/50",
    previewVia: "emerald-950/40",
  },
  {
    family: "twilight",
    animationName: "backdrop-cosmic",
    colorRange: [65, 145, 15, 65, 130, 195],
    names: ["Twilight Veil", "Twilight Rift", "Twilight Bloom", "Twilight Haze", "Twilight Crown", "Twilight Spell", "Twilight Echo", "Twilight Shade", "Twilight Gleam", "Twilight Fade"],
    descriptions: [
      "Sheer veil of purple descending at dusk",
      "Rift of deep violet splitting the sky",
      "Bloom of twilight purple across clouds",
      "Hazy purple mist at the horizon",
      "Crown of amethyst light overhead",
      "Enchanting spell of indigo and violet",
      "Echoing purple waves in the dark",
      "Deep shade of twilight settling in",
      "Faint gleam of purple starlight",
      "Slowly fading twilight into night",
    ],
    previewFrom: "purple-900/50",
    previewVia: "indigo-950/40",
  },
  {
    family: "solar",
    animationName: "backdrop-sunset",
    colorRange: [195, 255, 155, 215, 8, 55],
    names: ["Solar Flare", "Solar Crown", "Solar Dust", "Solar Haze", "Solar Beam", "Solar Tide", "Solar Blaze", "Solar Mist", "Solar Peak", "Solar Dawn"],
    descriptions: [
      "Brilliant solar flare bursting outward",
      "Golden crown of sunlight at zenith",
      "Fine solar dust floating in warm air",
      "Hazy golden light diffusing slowly",
      "Direct beam of concentrated sunlight",
      "Tidal wave of golden warmth",
      "Blazing sun at high noon",
      "Misty golden morning light",
      "Peak sunlight at the summit",
      "First light of a golden dawn",
    ],
    previewFrom: "yellow-900/50",
    previewVia: "amber-950/40",
  },
  {
    family: "storm",
    animationName: "backdrop-ocean",
    colorRange: [35, 80, 45, 90, 75, 130],
    names: ["Storm Front", "Storm Surge", "Storm Veil", "Storm Break", "Storm Cloud", "Storm Drift", "Storm Wake", "Storm Edge", "Storm Deep", "Storm Grey"],
    descriptions: [
      "Approaching storm front darkening the sky",
      "Surging storm waves of slate blue",
      "Thin veil before the storm hits",
      "Brief break in heavy storm clouds",
      "Towering storm clouds in slate grey",
      "Drifting storm remnants after the rain",
      "Wake of a passing thunderstorm",
      "Sharp edge where storm meets clear sky",
      "Deep within the storm's dark heart",
      "Uniform grey of an overcast storm",
    ],
    previewFrom: "slate-800/50",
    previewVia: "slate-950/40",
  },
  {
    family: "coral",
    animationName: "backdrop-sunset",
    colorRange: [205, 255, 95, 178, 105, 158],
    names: ["Coral Reef", "Coral Blush", "Coral Tide", "Coral Glow", "Coral Mist", "Coral Dusk", "Coral Wave", "Coral Petal", "Coral Shell", "Coral Dawn"],
    descriptions: [
      "Vibrant coral reef colors shimmering",
      "Soft blush of coral pink light",
      "Tidal flow of warm coral tones",
      "Gentle glow of living coral",
      "Misty coral haze at sunset",
      "Coral tones deepening at dusk",
      "Wave of coral washing over sand",
      "Delicate coral petal unfurling",
      "Smooth coral shell iridescence",
      "Dawn breaking in coral and peach",
    ],
    previewFrom: "pink-800/50",
    previewVia: "rose-950/40",
  },
  {
    family: "void",
    animationName: "backdrop-cosmic",
    colorRange: [18, 60, 3, 30, 30, 90],
    names: ["Void Abyss", "Void Rift", "Void Echo", "Void Depth", "Void Hollow", "Void Shade", "Void Ink", "Void Chasm", "Void Murk", "Void Shroud"],
    descriptions: [
      "Bottomless abyss of near-black void",
      "Rift torn in the fabric of darkness",
      "Echo of light lost in the void",
      "Unfathomable depth of pure darkness",
      "Hollow space devoid of light",
      "Shade so deep it absorbs all color",
      "Ink-black void spreading outward",
      "Chasm of darkness with faint edges",
      "Murky void with barely-there glow",
      "Shroud of darkness wrapping everything",
    ],
    previewFrom: "zinc-950/70",
    previewVia: "indigo-950/20",
  },
  {
    family: "prism",
    animationName: "backdrop-aurora",
    colorRange: [120, 220, 60, 180, 80, 220],
    names: ["Prism Split", "Prism Arc", "Prism Facet", "Prism Beam", "Prism Shard", "Prism Glow", "Prism Ray", "Prism Halo", "Prism Ring", "Prism Spark"],
    descriptions: [
      "Light splitting into spectral bands",
      "Arcing prismatic rainbow effect",
      "Multi-faceted light refractions",
      "Concentrated beam of rainbow light",
      "Shattered prism casting color shards",
      "Soft prismatic glow from all angles",
      "Single ray dispersed into colors",
      "Halo of prismatic light around center",
      "Ring of spectral colors rotating",
      "Sparking prismatic discharge",
    ],
    previewFrom: "violet-900/40",
    previewVia: "emerald-900/30",
  },
];

// ─── Generator ──────────────────────────────────────────────────────────────

function lerp(min: number, max: number, t: number): number {
  return Math.round(min + (max - min) * t);
}

function generateBackdrops(): PoolBackdrop[] {
  const pool: PoolBackdrop[] = [];

  for (const cfg of FAMILIES) {
    const [rMin, rMax, gMin, gMax, bMin, bMax] = cfg.colorRange;

    for (let i = 0; i < 10; i++) {
      const slug = cfg.names[i].toLowerCase().replace(/\s+/g, "-");
      const id = `pool-${slug}`;

      // Generate 3 distinct color variations per backdrop using index offset
      const t1 = i / 10;
      const t2 = ((i + 3) % 10) / 10;
      const t3 = ((i + 7) % 10) / 10;

      const r1 = lerp(rMin, rMax, t1), g1 = lerp(gMin, gMax, t1), b1 = lerp(bMin, bMax, t1);
      const r2 = lerp(rMin, rMax, t2), g2 = lerp(gMin, gMax, t2), b2 = lerp(bMin, bMax, t2);
      const r3 = lerp(rMin, rMax, t3), g3 = lerp(gMin, gMax, t3), b3 = lerp(bMin, bMax, t3);

      // Vary opacity (0.04 - 0.20) and spread (45% - 65%)
      const a1 = +(0.10 + (i % 5) * 0.025).toFixed(3);
      const a2 = +(0.06 + ((i + 2) % 5) * 0.02).toFixed(3);
      const a3 = +(0.04 + ((i + 4) % 5) * 0.015).toFixed(3);

      const s1 = 45 + (i % 4) * 5;
      const s2 = 50 + ((i + 1) % 4) * 5;
      const s3 = 55 + ((i + 2) % 4) * 5;

      const pos1 = POSITIONS[i];
      const pos2 = POSITIONS[(i + 3) % 10];
      const pos3 = POSITIONS[(i + 7) % 10];

      const gradientCSS = `bg-[radial-gradient(ellipse_at_${pos1},rgba(${r1},${g1},${b1},${a1}),transparent_${s1}%),radial-gradient(ellipse_at_${pos2},rgba(${r2},${g2},${b2},${a2}),transparent_${s2}%),radial-gradient(ellipse_at_${pos3},rgba(${r3},${g3},${b3},${a3}),transparent_${s3}%)]`;

      pool.push({
        id,
        name: cfg.names[i],
        family: cfg.family,
        description: cfg.descriptions[i],
        previewClass: `bg-gradient-to-br from-${cfg.previewFrom} via-${cfg.previewVia} to-zinc-950`,
        gradientCSS,
        animationName: cfg.animationName,
      });
    }
  }

  return pool;
}

// ─── Exports ────────────────────────────────────────────────────────────────

export const BACKDROP_POOL: PoolBackdrop[] = generateBackdrops();

export function getPoolBackdrop(id: string): PoolBackdrop | undefined {
  return BACKDROP_POOL.find((b) => b.id === id);
}
