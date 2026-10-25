import * as THREE from "three";

/*
 * One material set for the whole world, so lighting and grading are decided
 * once instead of per object. The look is an architectural model: matte card
 * and plaster, painted metal, a little brass and glass, and warm light inside.
 * District colours are the brand accents taken down to pastel grounds, with
 * the saturated accent kept for small signal details.
 */
const std = (color: string, roughness = 0.88, metalness = 0, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });

export function makePalette() {
  return {
    // Neutrals
    paper: std("#f7f2ea", 0.9),
    card: std("#fbf9f4", 0.94),
    plaster: std("#ede6db", 0.92),
    concrete: std("#dcd6cc", 0.9),
    charcoal: std("#2b3039", 0.66),
    ink: std("#1d2027", 0.55),
    road: std("#4a4f58", 0.96),
    marking: std("#f4efe5", 0.8),
    steel: std("#a9b0b9", 0.42, 0.55),
    brass: std("#c59b57", 0.36, 0.7),
    glass: std("#93aebf", 0.1, 0.05, { envMapIntensity: 1.25 }),
    glassDark: std("#4f6475", 0.18, 0.05, { envMapIntensity: 1.1 }),
    /** Clear glazing over a lit interior. */
    glassClear: std("#d4e6ef", 0.05, 0.1, { transparent: true, opacity: 0.3, depthWrite: false, envMapIntensity: 1.5 }),
    /** A lit interior seen through glazing. */
    interior: std("#ffeccc", 0.85, 0, { emissive: "#ffc372", emissiveIntensity: 0.7 }),
    lamp: std("#fff6e4", 0.6, 0, { emissive: "#ffd9a0", emissiveIntensity: 0.9 }),
    // Brand signals
    lime: std("#c8f13b", 0.6, 0, { emissive: "#a6cf1f", emissiveIntensity: 0.16 }),
    limeSoft: std("#dcf28f", 0.75),
    cobalt: std("#2f4bff", 0.55, 0, { emissive: "#2f4bff", emissiveIntensity: 0.12 }),
    // Planting
    sage: std("#a7b78c", 0.95),
    olive: std("#8a9a6e", 0.95),
    moss: std("#b9c69d", 0.95),
    trunk: std("#7d6c5b", 0.9),
    // Systems: warm campus
    sysTop: std("#f0dccb", 0.92),
    sysPave: std("#e8d3bf", 0.92),
    sysWall: std("#d9b59e", 0.9),
    sysBand: std("#c99579", 0.88),
    sysDeep: std("#b8876f", 0.92),
    coral: std("#ee8466", 0.7),
    coralSoft: std("#f6bba3", 0.84),
    peach: std("#fbd8c4", 0.88),
    sand: std("#e9d9c3", 0.9),
    // Algorithms: cool atlas
    algTop: std("#dde7f3", 0.92),
    algWall: std("#b4c8df", 0.9),
    algBand: std("#98b2d3", 0.88),
    algDeep: std("#849fc2", 0.92),
    powder: std("#a7c9f0", 0.8),
    // Intelligence: lavender lab
    intTop: std("#e7def4", 0.92),
    intWall: std("#c9b9e8", 0.9),
    intBand: std("#b2a1dc", 0.88),
    intDeep: std("#9d8cca", 0.92),
    lavender: std("#d5c5f2", 0.82),
    violet: std("#7a4ee6", 0.6),
    // Studio
    stuTop: std("#f2eee4", 0.9),
    stuWall: std("#dcd6c6", 0.9),
    stuBand: std("#c8d0ab", 0.9),
    stuDeep: std("#b3bd94", 0.92),
    // Blueprint stations: white card, drawn in cobalt
    blueprint: std("#fbfaf6", 0.96, 0, { transparent: true, opacity: 0.92 }),
  };
}
export type Palette = ReturnType<typeof makePalette>;

/** Ground set per district, for the island builders. */
export const groundOf = (p: Palette, district: "systems" | "algorithms" | "intelligence" | "studio") =>
  district === "systems"
    ? { top: p.sysTop, wall: p.sysWall, band: p.sysBand, deep: p.sysDeep }
    : district === "algorithms"
      ? { top: p.algTop, wall: p.algWall, band: p.algBand, deep: p.algDeep }
      : district === "intelligence"
        ? { top: p.intTop, wall: p.intWall, band: p.intBand, deep: p.intDeep }
        : { top: p.stuTop, wall: p.stuWall, band: p.stuBand, deep: p.stuDeep };

export function disposePalette(p: Palette) {
  Object.values(p).forEach((m) => m.dispose());
}
