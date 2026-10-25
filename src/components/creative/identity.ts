import { animForSlug, type AnimKind } from "../mini-anim";

export type Tone = "sky" | "lime" | "peach" | "pink" | "butter" | "lilac";

/**
 * Each project keeps one colour identity across the pinboard card and its
 * detail page. It follows the kind of idea the sketch illustrates, so graph
 * and routing work reads cool, swarms and simulations read green, and so on.
 */
const toneForAnim: Record<AnimKind, Tone> = {
  mst: "sky",
  route: "butter",
  maze: "sky",
  swarm: "lime",
  flock: "lilac",
  drone: "sky",
  dog: "peach",
  shot: "lime",
  chat: "butter",
  heatmap: "pink",
  orbit: "lilac",
  slots: "lime",
  bars: "peach",
  pulse: "pink",
  scan: "lilac",
};

export const animKindFor = (slug: string): AnimKind =>
  animForSlug[slug] ?? "pulse";
export const toneFor = (slug: string): Tone => toneForAnim[animKindFor(slug)];

/** Deterministic small tilt so the pinboard looks placed by hand, but never reshuffles. */
export const tiltFor = (index: number) => ((index * 37) % 5) - 2;

export type District = "systems" | "algorithms" | "intelligence";

/** The three districts of the Creative studio map. Each project names its own district in the registry. */
export const districts: {
  id: District;
  label: string;
  blurb: string;
  lens: "systems" | "algorithms" | "computation";
}[] = [
  {
    id: "systems",
    label: "Systems",
    blurb: "Apps and databases where the pieces have to agree.",
    lens: "systems",
  },
  {
    id: "algorithms",
    label: "Algorithms",
    blurb: "Paths, plans and search you can watch.",
    lens: "algorithms",
  },
  {
    id: "intelligence",
    label: "Intelligence",
    blurb: "Data, models and agents, with their limits.",
    lens: "computation",
  },
];

/** The district is assigned explicitly on each project; it is never inferred from tags. */
export function districtFor(project: { district: District }): District {
  return project.district;
}
