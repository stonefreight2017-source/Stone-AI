/* Type declarations for Vanta.js effect modules */

declare module "vanta/dist/vanta.waves.min" {
  const WAVES: (opts: Record<string, unknown>) => { destroy: () => void };
  export default WAVES;
}

declare module "vanta/dist/vanta.birds.min" {
  const BIRDS: (opts: Record<string, unknown>) => { destroy: () => void };
  export default BIRDS;
}

declare module "vanta/dist/vanta.fog.min" {
  const FOG: (opts: Record<string, unknown>) => { destroy: () => void };
  export default FOG;
}

declare module "vanta/dist/vanta.net.min" {
  const NET: (opts: Record<string, unknown>) => { destroy: () => void };
  export default NET;
}
