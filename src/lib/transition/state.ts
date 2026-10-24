/**
 * Shared state of a mode transition. Two numbers drive everything a renderer
 * draws: `cue` (0 to 1, the short acknowledgement before the page snapshot is
 * taken) and `progress` (0 to 1, the transition itself). Renderers are pure
 * functions of them and of `direction`, so any frame can be reproduced by
 * setting the numbers, and the choreography lives in one table (PHASES).
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
/** The transition itself, in seconds: about 2 s from click to rest with the cue and capture. */
export const SCANNER_SECONDS = 1.8;

/**
 * The beats of the transition as fractions of `progress`.
 *   aim     going to Creative the aperture forms and the page's structure is
 *           marked; coming back the two scanner halves enter and the particles
 *           gather on the alignment axis
 *   scan    the scanners cross the viewport; particles are released (or
 *           placed) as a scanner passes them
 *   settle  particles finish assembling and clear; coming back the aperture
 *           locks; the overlay clears
 */
export const PHASES = {
  aim: [0, 0.2],
  scan: [0.2, 0.7],
  settle: [0.7, 1],
} as const;
export type Phase = keyof typeof PHASES;

export const phaseOf = (progress: number): Phase =>
  (Object.keys(PHASES) as Phase[]).find((p) => progress < PHASES[p][1]) ?? "settle";

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
/** What a page looks like to the particles: its blocks, and the boxes to keep clear of. */
export type Layout = { panels: Panel[]; avoid: Box[] };
const emptyLayout = (): Layout => ({ panels: [], avoid: [] });

/**
 * Radius of the aperture, in pixels: large enough to lead the transition
 * (about three quarters of a laptop screen's height across), smaller on phones.
 */
export const apertureRadius = (width: number, height: number) =>
  Math.round(Math.min(340, Math.max(110, Math.min(height * 0.38, width * (width < height ? 0.42 : 0.27)))));
/** 0 to 1 across one phase. */
export const within = (progress: number, phase: Phase) =>
  clamp01((progress - PHASES[phase][0]) / (PHASES[phase][1] - PHASES[phase][0]));
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
  const [a, b] = PHASES.scan;
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
