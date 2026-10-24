"use client";
import { gsap } from "gsap";
import {
  CUE_SECONDS,
  SCANNER_SECONDS,
  clamp01,
  easeOut,
  emitProgress,
  passProgress,
  scanFraction,
  slit,
  transition,
  within,
  type Direction,
} from "./state";

export const SCANNER_MS = Math.round(SCANNER_SECONDS * 1000);

// The scanner shares the clock with the browser's own transition animations
// (the snapshots' hold, the shared-element morphs), which run in real time.
// GSAP's lag smoothing would slow its clock after a long frame and let the two
// drift apart, so it is off: a slow device skips frames but stays in step.
// GSAP is only used by the mode transition, so this affects nothing else.
gsap.ticker.lagSmoothing(0);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * The page half of the scanner transition, as CSS variables on <html> that
 * world-shift.css turns into the two snapshots' clip, scale and filter, and
 * that position the scanner lines in the SVG frame:
 *   --sc-l, --sc-r     the scanners' x in pixels
 *   --sc-cl, --sc-cr   the clip of the upper snapshot, in its own (scaled) pixels
 *   --sc-top-t, --sc-top-f, --sc-bottom-f   transform and filters
 *   --sc-beam-o        scanner opacity
 * The upper snapshot is the one inside the slit: the new Creative page going
 * out, the old Creative page coming back.
 */
export function paintScanner(root: HTMLElement) {
  const p = transition.progress;
  const { width } = transition;
  const cx = width / 2;
  const { l, r } = slit();
  const f = scanFraction(p);
  const out = transition.direction === "to-creative";
  // Upper layer scale: the arriving Creative page settles from slightly large;
  // the departing Creative page is compressed into the closing slit.
  const top = out ? lerp(1.035, 1, easeOut(clamp01((p - 0.2) / 0.75))) : lerp(1, 0.965, f);
  const local = (x: number) => cx + (x - cx) / top;
  const s = root.style;
  s.setProperty("--sc-l", `${l.toFixed(1)}px`);
  s.setProperty("--sc-r", `${r.toFixed(1)}px`);
  s.setProperty("--sc-cl", `${local(l).toFixed(1)}px`);
  s.setProperty("--sc-cr", `${local(r).toFixed(1)}px`);
  s.setProperty("--sc-top-t", `scale(${top.toFixed(4)})`);
  // Professional recedes a little as Creative opens; Creative drains of colour as it closes.
  s.setProperty("--sc-top-f", out ? "none" : `saturate(${(1 - 0.6 * f).toFixed(3)})`);
  s.setProperty("--sc-bottom-f", out ? `brightness(${(1 - 0.05 * f).toFixed(3)}) saturate(${(1 - 0.25 * f).toFixed(3)})` : "none");
  const beam = out ? within(p, "scan") > 0 && f < 0.999 : p > 0.06 && p < 0.86;
  s.setProperty("--sc-beam-o", beam ? "1" : "0");
}

/** The acknowledgement beat. It plays before the snapshot is taken. */
export function cueTimeline(onDone: () => void) {
  return gsap.fromTo(
    transition,
    { cue: 0 },
    { cue: 1, duration: CUE_SECONDS, ease: "none", onUpdate: emitProgress, onComplete: onDone },
  );
}

/**
 * The master timeline. It moves `transition.progress` in a straight line; all
 * easing lives in the renderers, so the choreography stays in one table and
 * any frame can be reproduced by setting `progress`.
 */
export function scannerTimeline(root: HTMLElement) {
  return gsap
    .timeline({
      onUpdate: () => {
        paintScanner(root);
        emitProgress();
      },
    })
    .fromTo(transition, { progress: 0 }, { progress: 1, duration: SCANNER_SECONDS, ease: "none" }, 0);
}

const MORPH_ID = "sc-morph";

/**
 * Times each shared element's morph to the moment a scanner passes it, so the
 * interface rearranges as the line crosses it rather than all at once. The
 * browser animates the morph itself; this only sets when and how long.
 */
export function writeMorphTimings(names: Map<string, number>, direction: Direction) {
  const rules: string[] = [];
  for (const [name, x] of names) {
    const start = Math.max(0, passProgress(x, direction) * SCANNER_SECONDS - 0.06);
    const duration = Math.max(0.28, Math.min(0.56, SCANNER_SECONDS - start));
    const timing = `animation-delay:${Math.round(start * 1000)}ms;animation-duration:${Math.round(duration * 1000)}ms`;
    // Two attribute selectors, so these outrank the general ws-morph timing in world-shift.css.
    const at = "html[data-scanner][data-shift]";
    rules.push(
      `${at}::view-transition-group(${name}),${at}::view-transition-old(${name}),${at}::view-transition-new(${name}){${timing}}`,
    );
  }
  let style = document.getElementById(MORPH_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = MORPH_ID;
    document.head.appendChild(style);
  }
  style.textContent = rules.join("\n");
}

export const clearMorphTimings = () => document.getElementById(MORPH_ID)?.remove();

/** Where a page's background pattern starts, in viewport pixels. */
export function gridOrigin() {
  const box = document.querySelector(".portfolio-root")?.getBoundingClientRect();
  return { x: box?.left ?? 0, y: box?.top ?? 0 };
}
