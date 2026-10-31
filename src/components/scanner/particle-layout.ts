import type { Box, Direction, Layout, Panel, Region, Row, WorldFootprint } from "@/lib/transition/state";
import { TIMINGS, apertureRadius, collectRadius, passProgress } from "@/lib/transition/state";
import { countFor } from "@/lib/transition/quality";

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
type Point = {
  x: number;
  y: number;
  colour: string | null;
  onPanel: boolean;
  /** A landing on the world: its shape, size and turn (a dash lies along its outline). */
  landing?: { kind: number; size: number; angle: number; stretch: number };
  /** A place on a line of Professional text: which row, and its place along it. */
  row?: { index: number; at: number };
};

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
  /** At rest on a contour: the turn that lays a dash along it, and how much longer than wide it is. */
  endAngle: number;
  endStretch: number;
  /** How high a release arcs, in pixels. */
  lift: number;
  /** Progress at which a scanner passes it: release going out, placement coming back. */
  pass: number;
  /** Going out: a tile cut from a Professional region. It is a flat plate (startW by startH) until it lands. */
  plate: boolean;
  startW: number;
  startH: number;
  /** Where a plate goes in: a point just inside the aperture, on the line to its landing. */
  mouth: V3;
  /** Coming back: how it lies where it starts (a dash along an island's outline), and its length ratio. */
  startAngle: number;
  startStretch: number;
  /** Coming back: lands on a row of text (true) or on the grid; the progress at which it leaves the ring. */
  row: boolean;
  arrive: number;
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

export { countFor };

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
  /** Going out: the Professional regions being cut into tiles. */
  regions: Region[];
  /** Coming back: where the scanner locked on. */
  anchor: { x: number; y: number };
  /** Share of the layout's fragments to draw (the quality tier). */
  fragments: number;
};

/** The fewest fragments a run draws: one seed for each station still needs a home. */
const MIN_FRAGMENTS = 40;
const PAPER_TILE = "#fbfaf3";
const TILE_TONES = [PAPER_TILE, COBALT, ORANGE];

/**
 * The run's particles with their starting places. Destinations need the new
 * page, which only exists once the transition has captured the old one, so
 * they are added later by `assignEnds`.
 */
export function startRun({ W, H, direction, oldLayout, oldOrigin, regions, fragments }: RunInput): Particle[] {
  const n = Math.max(MIN_FRAGMENTS, Math.round(countFor(W) * fragments));
  const random = rng(20261024);
  const out = direction === "to-creative";
  const small = W < 640;
  const C = { x: W / 2, y: H / 2 };
  const maxDist = Math.hypot(C.x, C.y);

  // Going out, the tiles cut from the regions come first; open grid and block borders fill the rest.
  const tiles = out ? regions.flatMap((r) => r.tiles).slice(0, Math.max(0, n - 30)) : [];
  // Coming back, the islands' outlines and the stations give up most fragments, then the other blocks' edges.
  const fromWorld = !out && oldLayout.world ? worldLandings(oldLayout.world, Math.round(n * 0.62), W, H) : [];
  const places = out
    ? placesOn(oldLayout, "grid", oldOrigin, W, H, n - tiles.length, random)
    : [...fromWorld, ...placesOn(oldLayout, "dots", oldOrigin, W, H, n - fromWorld.length, random)].slice(0, n);

  const make = (place: Point, i: number): Particle => {
    const a = random() * Math.PI * 2;
    const b = Math.acos(2 * random() - 1);
    const startColour = out
      ? place.onPanel
        ? INK
        : i % 7 === 0
          ? ORANGE
          : COBALT
      : (place.colour ?? CREATIVE[i % CREATIVE.length]);
    const L = !out ? place.landing : undefined;
    return {
      // Going out the shape follows the destination (set later); coming back
      // an island's dashes and the stations keep their own shape, the rest are cubes and diamonds.
      kind: out ? 0 : L ? L.kind : i % 5 < 3 ? 0 : 1,
      start: { x: place.x, y: place.y, z: 0 },
      end: { x: place.x, y: place.y, z: 0 },
      slot: { x: place.x, y: C.y, z: 0 },
      startColour,
      endColour: startColour,
      startSize: out ? (small ? 6 : 7) : L ? L.size * 0.85 : place.onPanel ? (small ? 9 : 11) : small ? 6 : 8,
      endSize: out ? (small ? 9 : 12) : small ? 6 : 7,
      axis: { x: Math.sin(b) * Math.cos(a), y: Math.sin(b) * Math.sin(a), z: Math.cos(b) },
      spin: 1.6 + random() * 2.6,
      endAngle: 0,
      endStretch: 1,
      lift: 50 + random() * 110,
      pass: out ? passProgress(place.x, direction, W) : 1,
      plate: false,
      startW: 0,
      startH: 0,
      mouth: { x: C.x, y: C.y, z: 0 },
      startAngle: L ? L.angle : 0,
      startStretch: L ? L.stretch : 1,
      row: false,
      arrive: 1,
      order: Math.hypot(place.x - C.x, place.y - C.y) / maxDist,
      seed: random(),
    };
  };
  const parts = places.map(make);
  tiles.forEach((t, k) => {
    const part = make({ x: t.x + t.w / 2, y: t.y + t.h / 2, colour: null, onPanel: true }, places.length + k);
    parts.push({
      ...part,
      kind: 0,
      plate: true,
      startW: t.w,
      startH: t.h,
      startSize: Math.min(t.w, t.h),
      startColour: TILE_TONES[t.tone],
      endColour: TILE_TONES[t.tone],
      pass: t.pass,
    });
  });
  return parts;
}

const LIME = "#c8f13b";
const ISLAND = { studio: INK, systems: "#e8532a", algorithms: "#2f4bff", intelligence: "#7a4ee6" } as const;

/**
 * Landings on the studio map: one seed (a diamond) on the foot of every
 * station, and dashes laid along the outline of every island, in its district's
 * colour. Only what is inside the viewport counts, so a map that is partly
 * below the fold still gets the right share of fragments.
 */
function worldLandings(world: WorldFootprint, n: number, W: number, H: number): Point[] {
  const small = W < 640;
  const inView = (x: number, y: number) => x > 8 && x < W - 8 && y > 8 && y < H - 8;
  const seeds: Point[] = world.feet
    .filter((f) => inView(f.x, f.y))
    .map((f) => ({ x: f.x, y: f.y, colour: LIME, onPanel: true, landing: { kind: 1, size: small ? 10 : 13, angle: 0, stretch: 1 } }));

  // Candidate points along each outline, a few pixels apart, with the outline's direction there.
  type Candidate = { x: number; y: number; angle: number };
  const groups = world.islands.map((island) => {
    const pts = island.points;
    const list: Candidate[] = [];
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[(i + 1) % pts.length];
      const length = Math.hypot(x1 - x0, y1 - y0);
      const angle = Math.atan2(y1 - y0, x1 - x0);
      const steps = Math.max(1, Math.round(length / 6));
      for (let k = 0; k < steps; k++) {
        const x = x0 + ((x1 - x0) * k) / steps;
        const y = y0 + ((y1 - y0) * k) / steps;
        if (inView(x, y)) list.push({ x, y, angle });
      }
    }
    return { id: island.id, list };
  });
  const budget = Math.max(0, n - seeds.length);
  const total = groups.reduce((sum, g) => sum + g.list.length, 0) || 1;
  const dashes: Point[] = [];
  for (const group of groups) {
    const quota = Math.min(group.list.length, Math.round((budget * group.list.length) / total));
    for (let k = 0; k < quota; k++) {
      const c = group.list[Math.min(group.list.length - 1, Math.floor(((k + 0.5) * group.list.length) / quota))];
      dashes.push({ x: c.x, y: c.y, colour: ISLAND[group.id], onPanel: true, landing: { kind: 0, size: small ? 7 : 9, angle: c.angle, stretch: 2.8 } });
    }
  }
  return [...seeds, ...dashes];
}

/** Places along the lines of Professional text: evenly spaced ticks on each row, fewer on long pages. */
function rowSlots(rows: Row[], budget: number, tick: number): Point[] {
  const want = rows.map((r) => Math.max(2, Math.round(r.w / tick)));
  const total = want.reduce((a, b) => a + b, 0) || 1;
  const share = total > budget ? budget / total : 1;
  const slots: Point[] = [];
  rows.forEach((row, index) => {
    const count = Math.max(2, Math.round(want[index] * share));
    for (let k = 0; k < count; k++)
      slots.push({
        x: row.x + ((k + 0.5) * row.w) / count,
        y: row.y,
        colour: row.tone === "cobalt" ? COBALT : INK,
        onPanel: true,
        row: { index, at: k / count },
      });
  });
  return slots;
}

/**
 * Gives each particle a destination on the new page.
 *
 * Going out, pairs are chosen greedily in the order the scanners reach the particles, preferring a destination in
 * nearly the same column, so every path is short and runs with the scanner rather than across it; a tile can only
 * land as a box (a dash on an island), since it is a box in flight.
 *
 * Coming back, destinations are the rows of Professional text first and the page's grid after; sources and
 * destinations are both sorted left to right and paired in order, so no two paths cross. Each particle also
 * gets its place on the ring around the anchor, where it waits before travelling to its row.
 */
export function assignEnds(
  parts: Particle[],
  {
    W,
    H,
    direction,
    newLayout,
    newOrigin,
    anchor,
  }: { W: number; H: number; direction: Direction; newLayout: Layout; newOrigin: { x: number; y: number }; anchor: { x: number; y: number } },
) {
  const out = direction === "to-creative";
  const random = rng(19970311);
  const small = W < 640;
  const C = { x: W / 2, y: H / 2 };

  if (!out) {
    const rows = newLayout.rows ?? [];
    const slots = rows.length ? rowSlots(rows, Math.round(parts.length * 0.8), small ? 26 : 32) : [];
    const rest = parts.length - slots.length;
    const dest = [...slots, ...(rest > 0 ? placesOn(newLayout, "grid", newOrigin, W, H, rest, random) : [])].slice(0, parts.length);
    const ring = collectRadius(W, H);
    const align = TIMINGS["to-pro"].beats.align;
    const maxDist = Math.hypot(W, H) / 2;
    const sources = parts.map((_, i) => i).sort((a, b) => parts[a].start.x - parts[b].start.x || parts[a].start.y - parts[b].start.y);
    const sinks = dest.map((_, k) => k).sort((a, b) => dest[a].x - dest[b].x || dest[a].y - dest[b].y);
    sources.forEach((i, rank) => {
      const part = parts[i];
      const place = dest[sinks[rank]] ?? dest[rank % dest.length];
      part.end = { x: place.x, y: place.y, z: 0 };
      part.row = !!place.row;
      part.endColour = place.onPanel ? (place.colour ?? INK) : i % 9 === 0 ? ORANGE : COBALT;
      part.endSize = place.row ? (small ? 6 : 7) : place.onPanel ? (small ? 5 : 6) : small ? 6 : 7;
      part.endStretch = place.row ? 4.2 : 1;
      // Waits on a ring around the anchor, at the angle it came from.
      const theta = Math.atan2(part.start.y - anchor.y, part.start.x - anchor.x);
      const jitter = (random() - 0.5) * 18;
      part.slot = {
        x: Math.max(14, Math.min(W - 14, anchor.x + (ring + jitter) * Math.cos(theta))),
        y: Math.max(14, Math.min(H - 14, anchor.y + (ring + jitter) * Math.sin(theta))),
        z: 0,
      };
      part.order = Math.min(1, Math.hypot(part.start.x - anchor.x, part.start.y - anchor.y) / maxDist);
      part.pass = passProgress(place.x, direction, W);
      // A tick lands on its row just ahead of the bracket that reveals the text there (about 90 ms before), so it marks
      // the line the type is set on rather than lying across the Creative page still showing; anything else is placed on
      // the grid as the bracket passes.
      part.arrive = place.row ? Math.min(part.pass - 0.02, Math.max(align[0] + 0.08, part.pass - 0.05)) : part.pass;
    });
    return;
  }

  // Going to Creative, a page with the studio map is assembled as the world: seeds on its stations, dashes on its islands.
  const landings = newLayout.world ? worldLandings(newLayout.world, parts.length, W, H) : [];
  const rest = parts.length - landings.length;
  const places = [...landings, ...(rest > 0 ? placesOn(newLayout, "dots", newOrigin, W, H, rest, random) : [])].slice(0, parts.length);
  const taken = new Array<boolean>(places.length).fill(false);
  const queue = parts
    .map((part, i) => ({ part, i }))
    .sort((a, b) => a.part.pass - b.part.pass);
  const R = apertureRadius(W, H);
  for (const { part, i } of queue) {
    let best = -1;
    let bestCost = Infinity;
    places.forEach((place, k) => {
      if (taken[k]) return;
      // A tile is a box in flight, so it lands as one (a dash on an island), never as a diamond or a ring.
      if (part.plate && ((place.landing && place.landing.kind !== 0) || (!place.landing && place.onPanel === false))) return;
      const dx = Math.abs(place.x - part.start.x);
      const dy = Math.abs(place.y - part.start.y);
      const cost = 2 * dx + dy;
      if (cost < bestCost) {
        bestCost = cost;
        best = k;
      }
    });
    if (best < 0) best = taken.findIndex((t) => !t);
    taken[best] = true;
    const place = places[best];
    part.end = { x: place.x, y: place.y, z: 0 };
    // On a block's edge it takes the block's colour; in open space it
    // becomes a small ring in a paper-dot colour.
    part.endColour = place.onPanel ? (place.colour ?? CREATIVE[i % CREATIVE.length]) : PAPER[i % PAPER.length];
    part.endSize = place.onPanel ? (small ? 10 : 12) : small ? 6 : 7;
    // Rings and diamonds along island edges, with a few cubes.
    part.kind = place.onPanel ? [1, 2, 1, 0][i % 4] : 2;
    if (place.landing) {
      part.kind = place.landing.kind;
      part.endSize = place.landing.size;
      part.endAngle = place.landing.angle;
      part.endStretch = place.landing.stretch;
    }
    if (part.plate) {
      part.kind = 0;
      // The mouth of the tunnel on the line from the centre to the landing: a tile goes in and comes out along it.
      const theta = Math.atan2(place.y - C.y, place.x - C.x);
      part.mouth = { x: C.x + 0.2 * R * Math.cos(theta), y: C.y + 0.2 * R * Math.sin(theta), z: 0 };
    }
  }
}
