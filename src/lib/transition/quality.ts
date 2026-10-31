/**
 * Visual quality of the mode transition, decided before each run (never during one: a change in the middle of
 * a run would pop, which looks worse than a dropped frame).
 *
 * The tier comes from what the device can do, not from the size of the screen:
 *   - CPU cores and, where the browser reports it, memory
 *   - how many pixels the scanner canvas would fill (viewport x its pixel ratio, capped), since a 4K display
 *     costs more to fill than a laptop panel
 *   - a request to save data, or a battery that is low and not charging
 * and then it is corrected by what the last runs measured on this device: runs with many long frames step the
 * tier down, and a streak of clean runs steps it back up. The correction lives in sessionStorage, so it lasts
 * for the visit and nothing is stored beyond it.
 *
 * Screen size still sets how many fragments a layout needs (a phone shows fewer), but that is a layout
 * decision (particle-layout.ts), not a performance guess.
 *
 * The measuring uses the frames the master timeline already produces: no extra loop and no timer.
 */
export type Tier = "high" | "medium" | "low";

export type Quality = {
  tier: Tier;
  /** Share of the layout's fragment count to draw. */
  fragments: number;
  /** Depth frames behind the aperture (phones draw fewer than this, see scanner-canvas). */
  frames: number;
  /** Ink outlines around the fragments (a second instanced draw per shape). */
  outlines: boolean;
  /** Highest pixel ratio of the scanner canvas. */
  dprCap: number;
  /** Professional regions named for the view transition and cut into tiles (each one is an extra snapshot). */
  regions: number;
};

export const QUALITY: Record<Tier, Quality> = {
  high: { tier: "high", fragments: 1, frames: 5, outlines: true, dprCap: 1.5, regions: 5 },
  medium: { tier: "medium", fragments: 0.7, frames: 3, outlines: true, dprCap: 1.25, regions: 3 },
  low: { tier: "low", fragments: 0.4, frames: 0, outlines: false, dprCap: 1, regions: 0 },
};
const ORDER: Tier[] = ["low", "medium", "high"];

/** How many fragments a layout of this width needs at full quality: each one clearly visible on a laptop, fewer on small screens. */
export const countFor = (width: number) => (width >= 1000 ? 160 : width >= 640 ? 112 : 72);

const KEY = "ws-quality";
const OVERRIDE = "portfolio-quality";
type Memory = { bias: number; clean: number; last?: RunStats };
export type RunStats = { frames: number; interval: number; hz: number; slow: number; worst: number; median: number; p95: number; p99: number };

const read = (): Memory => {
  try {
    return { bias: 0, clean: 0, ...(JSON.parse(sessionStorage.getItem(KEY) ?? "{}") as Partial<Memory>) };
  } catch {
    return { bias: 0, clean: 0 };
  }
};
const write = (m: Memory) => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(m));
  } catch {
    /* storage can be unavailable; the tier then simply stays at the device's own */
  }
};

/** Best effort and Chromium-only: a low battery that is not charging steps the tier down. */
let lowBattery = false;
if (typeof navigator !== "undefined") {
  (navigator as Navigator & { getBattery?: () => Promise<{ charging: boolean; level: number }> })
    .getBattery?.()
    .then((b) => (lowBattery = !b.charging && b.level < 0.2))
    .catch(() => {});
}

type Signals = {
  cores?: number;
  memory?: number;
  saveData?: boolean;
  lowBattery?: boolean;
  /** Viewport pixels multiplied by the squared pixel ratio the canvas would use. */
  load: number;
};

/** The device's own tier from its signals, before any correction from measured runs. */
export function tierFor({ cores = 4, memory, saveData, lowBattery: low, load }: Signals): Tier {
  let score = cores >= 8 ? 2 : cores >= 4 ? 1 : 0;
  if (memory !== undefined) score = Math.min(score, memory <= 2 ? 0 : memory <= 4 ? 1 : 2);
  if (load > 8_000_000) score -= 1;
  if (low) score -= 1;
  if (saveData) score = 0;
  return ORDER[Math.max(0, Math.min(2, score))];
}

export function baseTier(): Tier {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const dpr = Math.min(window.devicePixelRatio || 1, QUALITY.high.dprCap);
  return tierFor({
    cores: nav.hardwareConcurrency,
    memory: nav.deviceMemory,
    saveData: nav.connection?.saveData === true || matchMedia("(prefers-reduced-data: reduce)").matches,
    lowBattery,
    load: innerWidth * innerHeight * dpr * dpr,
  });
}

/** Steps a tier down by n, never below low. */
export const stepDown = (tier: Tier, n: number): Tier => ORDER[Math.max(0, ORDER.indexOf(tier) - n)];

/**
 * The tier for the next run. `portfolio-quality` in localStorage ("high", "medium" or "low") overrides
 * everything: it is for testing and for a visitor who wants a particular level.
 */
export function chooseTier(): Tier {
  try {
    const forced = localStorage.getItem(OVERRIDE);
    if (forced === "high" || forced === "medium" || forced === "low") return forced;
  } catch {
    /* ignore */
  }
  return stepDown(baseTier(), read().bias);
}

/** What the last run measured on this device, for the report and the tests. */
export const lastRun = (): RunStats | undefined => read().last;

const pick = (sorted: number[], q: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))];

/** Summarises the gaps between a run's frames. The first frames follow the capture, so they are skipped. */
export function summarise(gaps: number[]): RunStats | null {
  const g = gaps.slice(2);
  if (g.length < 8) return null;
  const sorted = [...g].sort((a, b) => a - b);
  // The shortest gaps show the display's own interval; clamped to what real displays do (144 Hz to 60 Hz).
  const interval = Math.min(16.7, Math.max(6.9, pick(sorted, 0.1)));
  return {
    frames: g.length,
    interval: +interval.toFixed(2),
    hz: Math.round(1000 / interval),
    slow: g.filter((v) => v > interval * 1.5).length,
    worst: +sorted[sorted.length - 1].toFixed(1),
    median: +pick(sorted, 0.5).toFixed(1),
    p95: +pick(sorted, 0.95).toFixed(1),
    p99: +pick(sorted, 0.99).toFixed(1),
  };
}

/** Records a finished run and corrects the next run's tier: down after a rough run, up after three clean ones. */
export function recordRun(stats: RunStats | null) {
  if (!stats) return;
  const m = read();
  m.last = stats;
  if (stats.slow > 6 || stats.worst > 100) {
    m.bias = Math.min(2, m.bias + 1);
    m.clean = 0;
  } else if (stats.slow <= 2 && stats.worst < 50) {
    if (++m.clean >= 3) {
      m.bias = Math.max(0, m.bias - 1);
      m.clean = 0;
    }
  }
  write(m);
}

/**
 * Collects the gaps between a run's updates. `tick` is called from the master timeline's own update, so the
 * gaps are the browser's real frame intervals and no loop of its own exists.
 */
export class RunProbe {
  private last = 0;
  private gaps: number[] = [];
  tick(now = performance.now()) {
    if (this.last) this.gaps.push(now - this.last);
    this.last = now;
  }
  /** The longest gap since the previous tick, used to notice a stall. */
  get lastGap() {
    return this.gaps.length ? this.gaps[this.gaps.length - 1] : 0;
  }
  finish() {
    return summarise(this.gaps);
  }
}
