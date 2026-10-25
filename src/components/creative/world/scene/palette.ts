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
    roof: std("#7b848d", 0.78, 0.15),
    charcoal: std("#2b3039", 0.66),
    ink: std("#1d2027", 0.55),
    road: std("#454a52", 0.96),
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
    cyan: std("#5fd3e6", 0.5, 0, { emissive: "#5fd3e6", emissiveIntensity: 0.35 }),
    amber: std("#f2b544", 0.6, 0, { emissive: "#f2b544", emissiveIntensity: 0.3 }),
    cobalt: std("#2f4bff", 0.55, 0, { emissive: "#2f4bff", emissiveIntensity: 0.12 }),
    // Planting
    sage: std("#9fae86", 1),
    olive: std("#6f8467", 1),
    moss: std("#b3bf96", 1),
    trunk: std("#7d6c5b", 0.9),
    // Systems: warm campus
    sysTop: std("#e9dccb", 0.93),
    sysPave: std("#dccab4", 0.92),
    sysWall: std("#b98f74", 0.95),
    sysBand: std("#a57b62", 0.96),
    sysDeep: std("#8d6a55", 0.97),
    coral: std("#ee8466", 0.7),
    coralSoft: std("#f6bba3", 0.84),
    peach: std("#fbd8c4", 0.88),
    sand: std("#e9d9c3", 0.9),
    // Algorithms: cool atlas
    algTop: std("#e3e7e9", 0.93),
    algWall: std("#9fb0bf", 0.95),
    algBand: std("#8ea1b3", 0.96),
    algDeep: std("#7a8ea3", 0.97),
    powder: std("#a7c9f0", 0.8),
    // Intelligence: lavender lab
    intTop: std("#e7e2ea", 0.93),
    intWall: std("#a99fbc", 0.95),
    intBand: std("#978cb0", 0.96),
    intDeep: std("#83789f", 0.97),
    lavender: std("#d5c5f2", 0.82),
    violet: std("#7a4ee6", 0.6),
    // Studio
    stuTop: std("#efece4", 0.92),
    stuWall: std("#bcbfa9", 0.95),
    stuBand: std("#a8ad92", 0.96),
    stuDeep: std("#8f9579", 0.97),
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
