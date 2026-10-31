/**
 * Shared state of a mode transition. Two numbers drive everything a renderer
 * draws: `cue` (0 to 1, the short acknowledgement before the page snapshot is
 * taken) and `progress` (0 to 1, the transition itself). Renderers are pure
 * functions of them and of `direction`, so any frame can be reproduced by
 * setting the numbers, and the choreography lives in one table (TIMINGS).
 *
 * Who owns what during a transition:
 *   GSAP            the master timeline: moves `cue` and `progress`, paints the
 *                   CSS variables the page snapshots read (lib/transition/scanner.ts)
 *   React Three     the particles, the background band and the 3D camera
 *                   (components/scanner/scanner-canvas.tsx)
 *   Anime.js        the drawn SVG details: reticle, aperture, alignment frame
 *                   (components/scanner/scanner-frame.tsx), seeked by GSAP
 *   Motion          the new page's own interface settling into place
 *                   (components/shift-intro.ts)
 *   View Transition the two page snapshots and the shared-element morph
 */
export type Direction = "to-creative" | "to-pro";
export type TransitionStyle = "scanner" | "portal" | "ring" | "none";

/** The acknowledgement beat before the page is captured, in seconds. */
export const CUE_SECONDS = 0.14;
/**
 * The two directions are separate choreographies, so each has its own length and its own beats. Every
 * renderer reads them from here (nothing else holds a duration), and any of them can be changed in one place.
 *
 * `phases` are the three structural beats every layer shares, as fractions of `progress`:
 *   aim     the instrument forms and, going back, the fragments are collected and aligned
 *   scan    the two scanners cross the viewport (`slit()` and `passProgress()` follow this window)
 *   settle  the new page is fully revealed; the aperture locks; the overlay clears
 * `beats` are the narrative steps inside them, used by the particles and the drawn frame.
 */
export type Beat = readonly [number, number];
export type Timing = {
  /** Length of the main timeline, in seconds (the cue before it and the capture are extra). */
  seconds: number;
  phases: { aim: Beat; scan: Beat; settle: Beat };
  beats: Record<string, Beat>;
};
export const TIMINGS: Record<Direction, Timing> = {
  // Professional to Creative: lock, decompose (the planes cut selected regions into tiles), portal (the aperture
  // opens into a tunnel and Creative arrives from depth), assemble (tiles emerge and land on the map), resolve.
  "to-creative": {
    seconds: 1.9,
    phases: { aim: [0, 0.2], scan: [0.2, 0.7], settle: [0.7, 1] },
    beats: {
      lock: [0, 0.12],
      decompose: [0.2, 0.62],
      portal: [0.16, 0.66],
      assemble: [0.4, 0.88],
      resolve: [0.86, 1],
    },
  },
  // Creative to Professional: anchor (a scanner locks on a point of the world), collect (the world gives up
  // fragments that gather on a ring), align (they travel to the baselines of the Professional text), close
  // (brackets close in and the rows become type), lock, resolve. There is no tunnel.
  "to-pro": {
    seconds: 1.8,
    phases: { aim: [0, 0.34], scan: [0.34, 0.82], settle: [0.82, 1] },
    beats: {
      anchor: [0, 0.12],
      collect: [0.06, 0.34],
      align: [0.26, 0.58],
      close: [0.34, 0.82],
      lock: [0.8, 0.94],
      resolve: [0.9, 1],
    },
  },
};
export type Phase = "aim" | "scan" | "settle";
export const timing = (direction: Direction = transition.direction) => TIMINGS[direction];
export const secondsFor = (direction: Direction = transition.direction) => TIMINGS[direction].seconds;

export const phaseOf = (progress: number, direction: Direction = transition.direction): Phase => {
  const { phases } = TIMINGS[direction];
  return (Object.keys(phases) as Phase[]).find((p) => progress < phases[p][1]) ?? "settle";
};

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** A block of a page, in viewport pixels: centre, layout size, turn and corner radius. */
export type Panel = {
  cx: number;
  cy: number;
  w: number;
  h: number;
  /** Rotation in radians (a tilted sticky note, for example). */
  rot: number;
  r: number;
  /** A strong colour taken from the block's fill, or null for a neutral block. */
  colour: string | null;
};
/** A box particles keep clear of (text, buttons, the header). */
export type Box = { x: number; y: number; w: number; h: number };
/**
 * Where the 3D world's islands and stations will be drawn, in viewport pixels,
 * for a page that has the studio map on screen (Creative). Fragments land on
 * these, so the world is assembled from them.
 */
export type WorldFootprint = {
  islands: { id: "studio" | "systems" | "algorithms" | "intelligence"; points: [number, number][] }[];
  feet: { slug: string; x: number; y: number }[];
};
/** A line of Professional text, as the rule it sits on: where it starts, how long it is and its tone. */
export type Row = { x: number; y: number; w: number; tone: "ink" | "cobalt" };
/**
 * One piece of a Professional region that the scanner cuts away: a rectangle in viewport pixels, the progress
 * at which the plane has cut it free, and a tone for the fragment it becomes.
 */
export type Tile = { x: number; y: number; w: number; h: number; pass: number; tone: number };
/** A named Professional block (headline, lede, facts, scene) whose old snapshot is cut into tiles. */
export type Region = { id: string; x: number; y: number; w: number; h: number; tiles: Tile[] };
/**
 * What a page looks like to the particles: its blocks, the boxes to keep clear of, and, for a page that has
 * them, the world's islands and stations (Creative) or the baselines of its text (Professional).
 */
export type Layout = { panels: Panel[]; avoid: Box[]; world?: WorldFootprint; rows?: Row[] };
const emptyLayout = (): Layout => ({ panels: [], avoid: [] });

/**
 * Radius of the aperture, in pixels: large enough to lead the transition
 * (about three quarters of a laptop screen's height across), smaller on phones.
 */
export const apertureRadius = (width: number, height: number) =>
  Math.round(Math.min(340, Math.max(110, Math.min(height * 0.38, width * (width < height ? 0.42 : 0.27)))));
/** Radius of the ring the fragments gather on around the anchor, coming back to Professional. */
export const collectRadius = (width: number, height: number) => Math.max(90, Math.min(250, Math.min(width, height) * 0.28));
/** 0 to 1 across one phase. */
export const within = (progress: number, phase: Phase, direction: Direction = transition.direction) => {
  const [a, b] = TIMINGS[direction].phases[phase];
  return clamp01((progress - a) / (b - a));
};
/** 0 to 1 across a narrative beat of the direction. */
export const beat = (progress: number, name: string, direction: Direction = transition.direction) => {
  const [a, b] = TIMINGS[direction].beats[name];
  return clamp01((progress - a) / (b - a));
};
export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export const transition = {
  running: false,
  /** Increments for every run, so layers can rebuild for it. */
  run: 0,
  style: "none" as TransitionStyle,
  direction: "to-creative" as Direction,
  /** The acknowledgement before the snapshot (0 to 1). */
  cue: 0,
  /** Fraction of the transition played (0 to 1). */
  progress: 0,
  /** True once the page snapshot exists and the main timeline is playing. */
  started: false,
  /** Where the click happened, in viewport pixels. */
  ox: 0,
  oy: 0,
  /** Viewport size at the start of the run. */
  width: 1440,
  height: 900,
  /**
   * Where each page's background grid sits in the viewport (its origin in
   * pixels), so particles and the background band line up with the real page.
   */
  oldOrigin: { x: 0, y: 0 },
  newOrigin: { x: 0, y: 0 },
  /**
   * The blocks of the page being left (measured at the click) and of the page
   * arriving (measured once it has rendered, inside the transition). Particles
   * lift off the first and assemble on the second.
   */
  oldLayout: emptyLayout(),
  newLayout: emptyLayout(),
  /** Going to Creative: the Professional regions being cut into tiles (named for the view transition). */
  regions: [] as Region[],
  /** Coming back: the point the scanner locks on (the selected station, the map's centre or the screen's), in viewport pixels. */
  anchor: { x: 720, y: 450 },
  /** Visual quality of this run, decided before it starts (lib/transition/quality.ts). */
  tier: "high" as "high" | "medium" | "low",
};

/** Extra distance past the edges, so a scanner fully leaves or enters the view. */
const MARGIN = 48;

/** How far the scanners have crossed (0 to 1), eased. */
export const scanFraction = (progress = transition.progress) => easeInOut(within(progress, "scan"));

/**
 * The open slit between the two scanners, in viewport pixels.
 *   to-creative  opens from the centre outward; the new (Creative) page shows
 *                inside it
 *   to-pro       closes from the edges inward; the old (Creative) page shows
 *                inside it, and the new (Professional) page everywhere else
 */
export function slit(width = transition.width, progress = transition.progress) {
  const f = scanFraction(progress);
  const half = width / 2 + MARGIN;
  const cx = width / 2;
  return transition.direction === "to-creative"
    ? { l: cx - f * half, r: cx + f * half }
    : { l: -MARGIN + f * half, r: width + MARGIN - f * half };
}

/** Inverse of the in-out ease (both halves are quadratics). */
const easeInOutInverse = (y: number) => (y < 0.5 ? Math.sqrt(y / 2) : 1 - Math.sqrt((1 - y) / 2));

/**
 * The value of `progress` at which a scanner passes x. Everything that reacts
 * to the scanner (particles, shared elements, arriving interface) uses this,
 * so they all agree with the line the visitor sees.
 */
export function passProgress(x: number, direction = transition.direction, width = transition.width) {
  const half = width / 2 + MARGIN;
  const f =
    direction === "to-creative"
      ? Math.abs(x - width / 2) / half
      : (x < width / 2 ? x + MARGIN : width + MARGIN - x) / half;
  const [a, b] = TIMINGS[direction].phases.scan;
  return a + easeInOutInverse(clamp01(f)) * (b - a);
}

const listeners = new Set<() => void>();
/** Structural changes: a run starts, its direction is set, a run ends. */
export const emitTransition = () => listeners.forEach((cb) => cb());
export const subscribeTransition = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

const progressListeners = new Set<() => void>();
/** Called from the GSAP timeline's update, every frame of a run. */
export const emitProgress = () => progressListeners.forEach((cb) => cb());
export const subscribeProgress = (cb: () => void) => {
  progressListeners.add(cb);
  return () => {
    progressListeners.delete(cb);
  };
};

/**
 * Work that has to wait until the snapshot exists and the main timeline runs,
 * such as interface arrivals timed to the scanner. Runs at once if already
 * started; dropped if the run ends first.
 */
let startQueue: (() => void)[] = [];
export const whenStarted = (cb: () => void) => {
  if (!transition.running) return;
  if (transition.started) cb();
  else startQueue.push(cb);
};
export const flushStarted = () => {
  const queue = startQueue;
  startQueue = [];
  queue.forEach((cb) => cb());
};
export const dropStarted = () => {
  startQueue = [];
};

/** Layers that can render a transition tell the controller when they are ready. */
const ready = { frame: false, particles: false };
export type Layer = keyof typeof ready;
export const setLayerReady = (layer: Layer, value: boolean) => {
  ready[layer] = value;
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development")
    (window as Window & { __layersReady?: typeof ready }).__layersReady = ready;
};
export const layerReady = (layer: Layer) => ready[layer];

/**
 * Which transition to play. The scanner is the default; `?transition=portal`
 * or localStorage "portfolio-transition" = "portal" brings back the earlier
 * portal ride, for comparison.
 */
export function requestedStyle(): "scanner" | "portal" {
  try {
    const query = new URLSearchParams(location.search).get("transition");
    const stored = localStorage.getItem("portfolio-transition");
    return (query ?? stored) === "portal" ? "portal" : "scanner";
  } catch {
    return "scanner";
  }
}
