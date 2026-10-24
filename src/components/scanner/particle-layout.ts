import type { Direction } from "@/lib/transition/state";
import { passProgress } from "@/lib/transition/state";

/**
 * Where every particle starts and ends, worked out once per run. Positions are
 * screen pixels (x right, y down) with z toward the viewer, so the grid ends
 * line up exactly with the page's own background grid.
 *
 * Going to Creative a particle starts as a small marker on the Professional
 * grid and flies to a place in one of the Creative forms (an asterisk, a
 * scribble, a sticker ring, or loose confetti). Coming back it starts in a form,
 * drifts toward the aperture, and is snapped onto the grid once a scanner
 * passes it.
 */
export const GRID = 48;
export const KINDS = 4;
const INK = "#17171d";
const COBALT = "#2f4bf5";
const FORM_COLOURS = {
  asterisk: ["#ff6538", "#ff8fc0", "#ff6538", "#ffb38a"],
  scribble: ["#c8f13b", "#2f4bf5", "#8edbff", "#c8f13b"],
  ring: ["#ff8fc0", "#8edbff", "#c8f13b", "#cdbdff"],
  confetti: ["#c8f13b", "#ff8fc0", "#ff6538", "#8edbff", "#2f4bf5", "#ffe27a"],
};
/** Which shapes each form prefers: 0 cube, 1 octahedron, 2 tetrahedron, 3 ring. */
const FORM_KINDS: Record<keyof typeof FORM_COLOURS, number[]> = {
  asterisk: [0, 2, 0, 1],
  scribble: [1, 0, 1, 3],
  ring: [3, 1, 3, 0],
  confetti: [0, 1, 2, 3],
};

export type V3 = { x: number; y: number; z: number };
export type Particle = {
  kind: number;
  /** Marker on the Professional grid. */
  grid: V3;
  /** Place in a Creative form. */
  form: V3;
  gridColour: string;
  formColour: string;
  gridSize: number;
  formSize: number;
  /** Tumble axis and amount. */
  axis: V3;
  spin: number;
  /** How high the flight arcs, in pixels. */
  lift: number;
  /** Progress at which a scanner passes this particle. */
  pass: number;
  /** 0 to 1, for small per-particle offsets. */
  seed: number;
};

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Particle count: clear and countable on a laptop, fewer on small screens. */
export const countFor = (width: number) => (width >= 1000 ? 168 : width >= 640 ? 120 : 84);

type Slot = { x: number; y: number; z: number; colour: string; size: number; kind: number };

/** The Creative forms, laid out for the viewport. */
function formSlots(W: number, H: number, n: number, random: () => number): Slot[] {
  const portrait = H > W * 1.15;
  const m = Math.min(W, H);
  const small = W < 640;
  const k = small ? 0.8 : 1;
  const slots: Slot[] = [];
  const take = (share: number) => Math.round(n * share);
  const pick = <T,>(list: T[], i: number) => list[i % list.length];

  // An asterisk, the studio's mark: six arms from a centre.
  const aN = take(0.3);
  const ac = portrait ? { x: W * 0.3, y: H * 0.27 } : { x: W * 0.23, y: H * 0.35 };
  const ar = Math.max(72, m * (portrait ? 0.22 : 0.19));
  for (let i = 0; i < aN; i++) {
    // Spaced along six arms, starting clear of the centre, so the mark stays
    // airy and text behind it stays readable.
    const arm = i % 6;
    const t = 0.24 + 0.76 * (Math.floor(i / 6) / Math.max(1, Math.ceil(aN / 6) - 1));
    const a = -Math.PI / 2 + (arm * Math.PI) / 3;
    slots.push({
      x: ac.x + Math.cos(a) * ar * t,
      y: ac.y + Math.sin(a) * ar * t,
      z: 20 + 50 * (1 - t),
      colour: pick(FORM_COLOURS.asterisk, i),
      size: (10 + 7 * (1 - t)) * k,
      kind: pick(FORM_KINDS.asterisk, i),
    });
  }
  // A scribble across the lower part, like the hand-drawn underlines.
  const sN = take(0.34);
  const waves = portrait ? 2 : 3;
  for (let i = 0; i < sN; i++) {
    const t = i / Math.max(1, sN - 1);
    const x = W * (0.08 + 0.84 * t);
    const phase = t * waves * Math.PI * 2;
    slots.push({
      x,
      y: H * (portrait ? 0.82 : 0.8) + Math.sin(phase) * H * (portrait ? 0.045 : 0.065),
      z: Math.cos(phase) * 70,
      colour: pick(FORM_COLOURS.scribble, i),
      size: (11 + 5 * random()) * k,
      kind: pick(FORM_KINDS.scribble, i),
    });
  }
  // A sticker ring.
  const rN = take(0.2);
  const rc = portrait ? { x: W * 0.72, y: H * 0.53 } : { x: W * 0.78, y: H * 0.34 };
  const rr = Math.max(52, m * (portrait ? 0.16 : 0.12));
  for (let i = 0; i < rN; i++) {
    const a = (i / rN) * Math.PI * 2;
    slots.push({
      x: rc.x + Math.cos(a) * rr,
      y: rc.y + Math.sin(a) * rr,
      z: 40 + Math.sin(a) * 50,
      colour: pick(FORM_COLOURS.ring, i),
      size: (13 + 4 * random()) * k,
      kind: pick(FORM_KINDS.ring, i),
    });
  }
  // Loose confetti for the rest.
  while (slots.length < n) {
    const i = slots.length;
    slots.push({
      x: W * (0.06 + 0.88 * random()),
      y: H * (0.1 + 0.8 * random()),
      z: (random() - 0.5) * 320,
      colour: pick(FORM_COLOURS.confetti, i),
      size: (10 + 12 * random()) * k,
      kind: pick(FORM_KINDS.confetti, i),
    });
  }
  return slots.slice(0, n);
}

/** Grid intersections in view. Most sit on the major lines, so the field reads as the grid itself. */
function gridNodes(W: number, H: number, origin: { x: number; y: number }, random: () => number) {
  const major: { x: number; y: number }[] = [];
  const minor: { x: number; y: number }[] = [];
  const i0 = Math.ceil((16 - origin.x) / GRID);
  const j0 = Math.ceil((16 - origin.y) / GRID);
  for (let i = i0; origin.x + i * GRID < W - 16; i++)
    for (let j = j0; origin.y + j * GRID < H - 16; j++) {
      const node = { x: origin.x + i * GRID, y: origin.y + j * GRID };
      (i % 5 === 0 || j % 5 === 0 ? major : minor).push(node);
    }
  const shuffle = <T,>(list: T[]) => {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };
  return { major: shuffle(major), minor: shuffle(minor) };
}

/** Screen x of a point at depth z, seen by the camera at rest. */
export const projectX = (x: number, z: number, W: number, D: number) => W / 2 + ((x - W / 2) * D) / (D - z);
export const projectY = (y: number, z: number, H: number, D: number) => H / 2 + ((y - H / 2) * D) / (D - z);

/** How far a particle in a form drifts toward the aperture before the scan (to Professional). */
export const DRIFT = 0.22;

export function layoutRun({
  W,
  H,
  D,
  direction,
  origin,
}: {
  W: number;
  H: number;
  D: number;
  direction: Direction;
  /** Origin of the Professional page's grid: old page going out, new page coming back. */
  origin: { x: number; y: number };
}): Particle[] {
  const n = countFor(W);
  const random = rng(20261024);
  const slots = formSlots(W, H, n, random);
  const nodes = gridNodes(W, H, origin, random);
  const pool = [...nodes.major.slice(0, Math.round(n * 0.7)), ...nodes.minor].slice(0, n);
  const gridSize = W < 640 ? 6 : 7;
  const make = (slot: Slot, node: { x: number; y: number }, i: number): Particle => {
    const a = random() * Math.PI * 2;
    const b = Math.acos(2 * random() - 1);
    return {
      kind: slot.kind,
      grid: { x: node.x, y: node.y, z: 0 },
      form: { x: slot.x, y: slot.y, z: slot.z },
      gridColour: i % 5 < 3 ? INK : COBALT,
      formColour: slot.colour,
      gridSize,
      formSize: slot.size,
      axis: { x: Math.sin(b) * Math.cos(a), y: Math.sin(b) * Math.sin(a), z: Math.cos(b) },
      spin: 2.4 + random() * 3.2,
      lift: 60 + random() * 150,
      pass: 0,
      seed: random(),
    };
  };

  if (direction === "to-creative") {
    // Pair grid markers with form places from left to right, so each one flies
    // a short, readable path and the left scanner releases the left side.
    const sortedNodes = [...pool].sort((p, q) => p.x - q.x);
    const sortedSlots = [...slots].sort((p, q) => p.x - q.x);
    return sortedSlots.map((slot, i) => {
      const particle = make(slot, sortedNodes[i % sortedNodes.length], i);
      particle.pass = passProgress(particle.grid.x, direction, W);
      return particle;
    });
  }

  // Back to Professional: each particle is caught where it has drifted to, and
  // snapped onto the free grid node nearest that place.
  const all = [...nodes.major, ...nodes.minor];
  const taken = new Set<number>();
  return slots.map((slot, i) => {
    const cx = W / 2;
    const cy = H / 2;
    const dx = slot.x + (cx - slot.x) * DRIFT;
    const dy = slot.y + (cy - slot.y) * DRIFT;
    const dz = slot.z * (1 - DRIFT);
    const sx = projectX(dx, dz, W, D);
    const sy = projectY(dy, dz, H, D);
    let best = -1;
    let bestD = Infinity;
    all.forEach((node, k) => {
      if (taken.has(k)) return;
      const d = (node.x - sx) ** 2 + (node.y - sy) ** 2;
      if (d < bestD) {
        bestD = d;
        best = k;
      }
    });
    taken.add(best);
    const particle = make(slot, all[best] ?? { x: sx, y: sy }, i);
    particle.pass = passProgress(sx, direction, W);
    return particle;
  });
}
