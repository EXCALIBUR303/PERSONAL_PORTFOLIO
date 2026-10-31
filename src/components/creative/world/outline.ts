import { Projector } from "./camera";
import { CHART_SHAPES, establishingPose, PLACEMENTS, poseFor, type Stage } from "./layout";

/**
 * The world's footprint on screen, without any 3D code: the outline of every
 * island and the foot of every station, as the overview camera sees them. The
 * loading skeleton draws it, and the mode transition's fragments land on it, so
 * both agree with the real world to within a few pixels (the same projection
 * the station buttons use). Positions are CSS pixels of the stage.
 */
export type Island = { id: "studio" | "systems" | "algorithms" | "intelligence"; points: [number, number][] };
export type Foot = { slug: string; x: number; y: number; visible: boolean };
export type WorldOutline = { width: number; height: number; islands: Island[]; feet: Foot[] };

/** Samples per rounded outline: enough to read as a curve, few enough to stay cheap. */
const SAMPLES = 56;
/** Where the surface of each island sits (world y), so the outline lies on its top edge. */
const TOP = { studio: 1.05, systems: 0.55, algorithms: 0.45, intelligence: 0.45 } as const;

/** A rounded rectangle's outline as points, clockwise from the top left. */
function roundedRect(cx: number, cz: number, hx: number, hz: number, r: number): [number, number][] {
  const radius = Math.min(r, hx, hz);
  const corners: [number, number, number][] = [
    [cx - hx + radius, cz - hz + radius, Math.PI],
    [cx + hx - radius, cz - hz + radius, -Math.PI / 2],
    [cx + hx - radius, cz + hz - radius, 0],
    [cx - hx + radius, cz + hz - radius, Math.PI / 2],
  ];
  const per = Math.max(2, Math.round(SAMPLES / 4));
  const pts: [number, number][] = [];
  corners.forEach(([x, z, from]) => {
    for (let i = 0; i <= per; i++) {
      const a = from + (i / per) * (Math.PI / 2);
      pts.push([x + radius * Math.cos(a), z + radius * Math.sin(a)]);
    }
  });
  return pts;
}

/**
 * Which `CHART_SHAPES` belong to which island: the Studio's podium first, then
 * Systems, then the Algorithms plates and pier, and Intelligence's bowl last.
 */
function tagged() {
  const shapes = CHART_SHAPES;
  const out: { id: Island["id"]; shape: (typeof shapes)[number] }[] = [];
  shapes.forEach((shape, i) => {
    const id: Island["id"] = i === 0 ? "studio" : i === 1 ? "systems" : i === shapes.length - 1 ? "intelligence" : "algorithms";
    out.push({ id, shape });
  });
  return out;
}

const proj = new Projector();

/** `opening`: as the opening shot starts, before it settles (the camera on a first view of the map moves in from there). */
export function worldOutline(width: number, height: number, opening = false): WorldOutline {
  const stage: Stage = { width, height, insetRight: 0 };
  const goal = poseFor({ kind: "overview" }, stage);
  proj.set(opening ? establishingPose(goal) : goal, width, height);
  const islands: Island[] = tagged().map(({ id, shape: [cx, cz, hx, hz, r] }) => ({
    id,
    points: roundedRect(cx, cz, hx, hz, r).map(([x, z]) => {
      const p = proj.project(x, TOP[id], z);
      return [p.x, p.y] as [number, number];
    }),
  }));
  const feet: Foot[] = Object.values(PLACEMENTS).map((p) => {
    const foot = proj.project(p.base[0], p.base[1] + 0.03, p.base[2] + p.size[2] / 2 + 0.04);
    return { slug: p.slug, x: foot.x, y: foot.y, visible: foot.visible && foot.x > 4 && foot.x < width - 4 && foot.y > 4 && foot.y < height - 4 };
  });
  return { width, height, islands, feet };
}

/** An outline as an SVG path. */
export const outlinePath = (points: [number, number][]) =>
  `M ${points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ")} Z`;
