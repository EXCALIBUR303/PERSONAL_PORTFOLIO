import type { Box, Direction, Layout, Panel } from "@/lib/transition/state";
import { passProgress } from "@/lib/transition/state";

/**
 * Where every particle starts and ends, worked out per run from the two pages'
 * real structure (lib/transition/layout.ts). Positions are screen pixels (x
 * right, y down) with z toward the viewer.
 *
 * Going to Creative a particle starts as a small marker on Professional's
 * structure: the border of a panel, or a node of the blueprint grid in open
 * space. When a scanner passes, it is released and flies a short arc to a place
 * on Creative's structure: the dashed edge of an island, the note, or a paper
 * dot in open space, taking that block's colour.
 *
 * Coming back a particle starts on Creative's structure, is gathered onto the
 * alignment axis above the column it will land in, and is placed onto
 * Professional's structure (a panel border or a grid node) as a scanner passes.
 *
 * Particles never sit on text: open-space places avoid every heading, line of
 * copy and control, and block borders surround text rather than cross it.
 */
export const GRID = 48;
/** Paper dot pitch on the Creative surface (every other dot is used). */
const DOT = 22;
/** Shapes: 0 cube, 1 octahedron, 2 ring. */
export const KINDS = 3;

const INK = "#17171d";
const COBALT = "#2f4bf5";
const ORANGE = "#ff6538";
const CREATIVE = ["#c8f13b", "#ff8fc0", "#8edbff", "#ff6538", "#2f4bf5", "#ffd84d", "#b69cff"];
/** The paper dots' own colours, for shapes that settle in open space on the Creative surface. */
const PAPER = ["#c8f13b", "#ff8fc0", "#8edbff", "#17171d"];

export type V3 = { x: number; y: number; z: number };
type Point = { x: number; y: number; colour: string | null; onPanel: boolean };

export type Particle = {
  kind: number;
  start: V3;
  end: V3;
  /** Coming back: where it waits on the alignment axis, above its column. */
  slot: V3;
  startColour: string;
  endColour: string;
  startSize: number;
  endSize: number;
  /** Tumble axis, and the turn it rests at in a Creative place. */
  axis: V3;
  spin: number;
  /** How high a release arcs, in pixels. */
  lift: number;
  /** Progress at which a scanner passes it: release going out, placement coming back. */
  pass: number;
  /** 0 near the centre to 1 at the edges, for staggering appearance and clearing. */
  order: number;
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

/** Particle count: each one clearly visible on a laptop, fewer on small screens. */
export const countFor = (width: number) => (width >= 1000 ? 120 : width >= 640 ? 96 : 64);

const inside = (x: number, y: number, b: Box, pad = 0) =>
  x > b.x - pad && x < b.x + b.w + pad && y > b.y - pad && y < b.y + b.h + pad;
const panelBox = (p: Panel): Box => {
  // Axis-aligned bounds of a possibly turned block.
  const c = Math.abs(Math.cos(p.rot));
  const s = Math.abs(Math.sin(p.rot));
  const w = p.w * c + p.h * s;
  const h = p.w * s + p.h * c;
  return { x: p.cx - w / 2, y: p.cy - h / 2, w, h };
};

/** Length of a block's rounded outline. */
const perimeter = (p: Panel) => 2 * (p.w + p.h) - 8 * p.r + 2 * Math.PI * p.r;

/** The point a distance d along a block's rounded outline, clockwise from its top-left. */
function along(p: Panel, d: number) {
  const { w, h, r } = p;
  const sx = w - 2 * r;
  const sy = h - 2 * r;
  const q = (Math.PI * r) / 2;
  // Angle along a corner arc of length t.
  const a = (t: number) => (r > 0 ? t / r : 0);
  const segments: [number, (t: number) => [number, number]][] = [
    [sx, (t) => [-w / 2 + r + t, -h / 2]],
    [q, (t) => [w / 2 - r + r * Math.sin(a(t)), -h / 2 + r - r * Math.cos(a(t))]],
    [sy, (t) => [w / 2, -h / 2 + r + t]],
    [q, (t) => [w / 2 - r + r * Math.cos(a(t)), h / 2 - r + r * Math.sin(a(t))]],
    [sx, (t) => [w / 2 - r - t, h / 2]],
    [q, (t) => [-w / 2 + r - r * Math.sin(a(t)), h / 2 - r + r * Math.cos(a(t))]],
    [sy, (t) => [-w / 2, h / 2 - r - t]],
    [q, (t) => [-w / 2 + r - r * Math.cos(a(t)), -h / 2 + r - r * Math.sin(a(t))]],
  ];
  const total = perimeter(p);
  let rest = ((d % total) + total) % total;
  for (let k = 0; k < segments.length; k++) {
    const [length, at] = segments[k];
    if (rest <= length || k === segments.length - 1) {
      const [lx, ly] = at(Math.min(rest, length));
      const cos = Math.cos(p.rot);
      const sin = Math.sin(p.rot);
      return { x: p.cx + lx * cos - ly * sin, y: p.cy + lx * sin + ly * cos };
    }
    rest -= length;
  }
  return { x: p.cx, y: p.cy };
}

/**
 * Exactly n places on a page: points along its blocks' outlines (most of them,
 * never closer than `minGap`), then places in open space on the
 * page's own surface pattern (`ground`), then, only if a dense page leaves too
 * little open space, free places anywhere clear of text.
 */
function placesOn(
  layout: Layout,
  ground: "grid" | "dots",
  origin: { x: number; y: number },
  W: number,
  H: number,
  n: number,
  random: () => number,
): Point[] {
  const margin = 10;
  const visible = (x: number, y: number) => x > margin && x < W - margin && y > margin && y < H - margin;
  // The header moves on its own (a shared element); nothing lands on it.
  const header = layout.avoid.filter((b) => b.y < 120 && b.w > W * 0.5);
  const clearOfHeader = (x: number, y: number) => !header.some((b) => inside(x, y, b));

  const outlines: Point[] = [];
  const total = layout.panels.reduce((sum, p) => sum + perimeter(p), 0);
  const minGap = W < 640 ? 22 : 26;
  // The Creative surface gets almost everything on its blocks' edges: loose
  // shapes in open space would read as confetti. Professional keeps more on
  // the blueprint grid, which is its structure too.
  const budget = Math.round(n * (ground === "dots" ? 0.86 : 0.6));
  if (total > 0) {
    const gap = Math.max(minGap, total / budget);
    for (const panel of layout.panels) {
      const length = perimeter(panel);
      const count = Math.max(1, Math.round(length / gap));
      const offset = random() * (length / count);
      for (let k = 0; k < count; k++) {
        const { x, y } = along(panel, offset + (k * length) / count);
        if (visible(x, y) && clearOfHeader(x, y)) outlines.push({ x, y, colour: panel.colour, onPanel: true });
      }
    }
  }
  // Too many on screen (large blocks): keep an even spread.
  while (outlines.length > budget) outlines.splice(Math.floor(random() * outlines.length), 1);

  const blocked = (x: number, y: number) =>
    layout.panels.some((p) => inside(x, y, panelBox(p), 8)) || layout.avoid.some((b) => inside(x, y, b));
  const open: Point[] = [];
  const preferred: Point[] = [];
  const step = ground === "grid" ? GRID : DOT * 2;
  const ox = ground === "grid" ? origin.x : origin.x + DOT / 2;
  const oy = ground === "grid" ? origin.y : origin.y + DOT / 2;
  for (let i = Math.ceil((margin - ox) / step); ox + i * step < W - margin; i++)
    for (let j = Math.ceil((margin - oy) / step); oy + j * step < H - margin; j++) {
      const x = ox + i * step;
      const y = oy + j * step;
      if (blocked(x, y)) continue;
      // On the blueprint grid, nodes on the major lines come first, so the
      // markers read as the grid itself.
      const major = ground === "grid" && (i % 5 === 0 || j % 5 === 0);
      (major ? preferred : open).push({ x, y, colour: null, onPanel: false });
    }
  const shuffle = <T,>(list: T[]) => {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };
  const places = [...outlines, ...shuffle(preferred), ...shuffle(open)].slice(0, n);
  for (let tries = 0; places.length < n && tries < n * 40; tries++) {
    const x = margin + random() * (W - margin * 2);
    const y = margin + random() * (H - margin * 2);
    if (tries < n * 30 && blocked(x, y)) continue;
    places.push({ x, y, colour: null, onPanel: false });
  }
  return places;
}

export type RunInput = {
  W: number;
  H: number;
  direction: Direction;
  oldLayout: Layout;
  oldOrigin: { x: number; y: number };
};

/**
 * The run's particles with their starting places. Destinations need the new
 * page, which only exists once the transition has captured the old one, so
 * they are added later by `assignEnds`.
 */
export function startRun({ W, H, direction, oldLayout, oldOrigin }: RunInput): Particle[] {
  const n = countFor(W);
  const random = rng(20261024);
  const out = direction === "to-creative";
  const small = W < 640;
  const places = placesOn(oldLayout, out ? "grid" : "dots", oldOrigin, W, H, n, random);
  const C = { x: W / 2, y: H / 2 };
  const maxDist = Math.hypot(C.x, C.y);
  return places.map((place, i) => {
    const a = random() * Math.PI * 2;
    const b = Math.acos(2 * random() - 1);
    const startColour = out
      ? place.onPanel
        ? INK
        : i % 7 === 0
          ? ORANGE
          : COBALT
      : (place.colour ?? CREATIVE[i % CREATIVE.length]);
    return {
      // Going out the shape follows the destination (set later); coming back
      // only cubes and diamonds, which read as precise marks once aligned.
      kind: out ? 0 : i % 5 < 3 ? 0 : 1,
      start: { x: place.x, y: place.y, z: 0 },
      end: { x: place.x, y: place.y, z: 0 },
      slot: { x: place.x, y: C.y, z: 0 },
      startColour,
      endColour: startColour,
      startSize: out ? (small ? 6 : 7) : place.onPanel ? (small ? 9 : 11) : small ? 6 : 8,
      endSize: out ? (small ? 9 : 12) : small ? 6 : 7,
      axis: { x: Math.sin(b) * Math.cos(a), y: Math.sin(b) * Math.sin(a), z: Math.cos(b) },
      spin: 1.6 + random() * 2.6,
      lift: 50 + random() * 110,
      pass: out ? passProgress(place.x, direction, W) : 1,
      order: Math.hypot(place.x - C.x, place.y - C.y) / maxDist,
      seed: random(),
    };
  });
}

/**
 * Gives each particle a destination on the new page. Pairs are chosen greedily
 * in the order the scanners reach the particles, preferring a destination in
 * nearly the same column, so every path is short and runs with the scanner
 * rather than across it.
 */
export function assignEnds(
  parts: Particle[],
  { W, H, direction, newLayout, newOrigin }: { W: number; H: number; direction: Direction; newLayout: Layout; newOrigin: { x: number; y: number } },
) {
  const out = direction === "to-creative";
  const random = rng(19970311);
  const small = W < 640;
  const places = placesOn(newLayout, out ? "dots" : "grid", newOrigin, W, H, parts.length, random);
  const taken = new Array<boolean>(places.length).fill(false);
  const C = { x: W / 2, y: H / 2 };
  const queue = parts
    .map((part, i) => ({ part, i }))
    .sort((a, b) =>
      out ? a.part.pass - b.part.pass : Math.abs(b.part.start.x - C.x) - Math.abs(a.part.start.x - C.x),
    );
  for (const { part, i } of queue) {
    let best = -1;
    let bestCost = Infinity;
    places.forEach((place, k) => {
      if (taken[k]) return;
      const dx = Math.abs(place.x - part.start.x);
      const dy = Math.abs(place.y - part.start.y);
      const cost = out ? 2 * dx + dy : 3 * dx + 0.5 * dy;
      if (cost < bestCost) {
        bestCost = cost;
        best = k;
      }
    });
    taken[best] = true;
    const place = places[best];
    part.end = { x: place.x, y: place.y, z: 0 };
    if (out) {
      // On a block's edge it takes the block's colour; in open space it
      // becomes a small ring in a paper-dot colour.
      part.endColour = place.onPanel ? (place.colour ?? CREATIVE[i % CREATIVE.length]) : PAPER[i % PAPER.length];
      part.endSize = place.onPanel ? (small ? 10 : 12) : small ? 6 : 7;
      // Rings and diamonds along island edges, with a few cubes.
      part.kind = place.onPanel ? [1, 2, 1, 0][i % 4] : 2;
    } else {
      part.endColour = place.onPanel ? INK : i % 9 === 0 ? ORANGE : COBALT;
      part.endSize = place.onPanel ? (small ? 5 : 6) : small ? 6 : 7;
      // Gathered onto the axis above its column, the page's structure squeezed
      // toward the scanner's line, then spread back out as a scanner passes.
      const offset = Math.max(-H * 0.2, Math.min(H * 0.2, (place.y - C.y) * 0.3));
      part.slot = { x: place.x + (random() - 0.5) * 4, y: C.y + offset, z: 0 };
      part.pass = passProgress(place.x, direction, W);
      part.order = Math.abs(place.x - C.x) / C.x;
    }
  }
}
