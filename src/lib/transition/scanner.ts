"use client";
import { gsap } from "gsap";
import {
  CUE_SECONDS,
  beat,
  easeInOut,
  easeOut,
  emitProgress,
  passProgress,
  scanFraction,
  secondsFor,
  slit,
  transition,
  within,
  type Direction,
} from "./state";
import { cutClip } from "./regions";

/** Length of a direction's main timeline, in milliseconds. */
export const scannerMs = (direction: Direction = transition.direction) => Math.round(secondsFor(direction) * 1000);
/** A gap between two updates longer than this means the page stalled; the run is then finished at once. */
export const STALL_MS = 400;

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
 * that carry the scanners (and the aperture halves riding them) in the SVG frame:
 *   --sc-l, --sc-r     the scanners' x in pixels
 *   --sc-cl, --sc-cr   the clip of the upper snapshot, in its own (scaled) pixels
 *   --sc-top-t, --sc-top-f, --sc-bottom-f   transform and filters
 * The upper snapshot is the one inside the slit: the new Creative page going
 * out, the old Creative page coming back.
 */
/** Scale the arriving Creative page starts at: it is seen deep inside the aperture and the camera moves in. */
const DEEP = 0.84;
const DEEP_SMALL = 0.9;
/** The last cut written for each region, so a frame that changes nothing writes nothing. */
const lastCut = new Map<string, string>();
export const resetCuts = () => lastCut.clear();

/**
 * Where the variables are written. Only the view transition's pseudo-elements and the scanner layer read them, so
 * they live on two rules of their own (`html::view-transition`, which the snapshots inherit from, and `.sc-layer`)
 * rather than on <html>: a custom property changed on <html> is inherited by every element of the page, and each
 * frame would recalculate the style of the whole document (about 1,600 elements, 5 to 6 ms on a fast laptop) for
 * values none of it uses. A browser that cannot parse the pseudo-element gets the old behaviour.
 */
type Vars = { snapshots: CSSStyleDeclaration; layer: CSSStyleDeclaration };
let vars: Vars | null = null;
function scannerVars(root: HTMLElement): Vars {
  if (vars?.snapshots.parentRule?.parentStyleSheet?.ownerNode?.isConnected) return vars;
  vars = { snapshots: root.style, layer: root.style };
  try {
    const el = document.createElement("style");
    el.id = "sc-vars";
    document.head.appendChild(el);
    const sheet = el.sheet!;
    sheet.insertRule("html::view-transition {}", 0);
    sheet.insertRule(".sc-layer {}", 1);
    vars = { snapshots: (sheet.cssRules[0] as CSSStyleRule).style, layer: (sheet.cssRules[1] as CSSStyleRule).style };
  } catch {
    document.getElementById("sc-vars")?.remove();
  }
  return vars;
}
/** Removes every variable the scanner wrote (they only exist for a run). */
export function clearScannerVars() {
  if (!vars) return;
  vars.snapshots.cssText = "";
  vars.layer.cssText = "";
}

export function paintScanner(root: HTMLElement) {
  const p = transition.progress;
  const { width } = transition;
  const cx = width / 2;
  const cy = transition.height / 2;
  const { l, r } = slit();
  const f = scanFraction(p);
  const aim = easeInOut(within(p, "aim"));
  const out = transition.direction === "to-creative";
  // Upper layer. Going out, Creative arrives from depth: small at first, then the camera moves in until it fills
  // the view. Coming back, the departing Creative page recedes toward the anchor the scanner locked on, then
  // is compressed into the closing slit.
  let top: number;
  let dx = 0;
  let dy = 0;
  if (out) top = lerp(width < 640 ? DEEP_SMALL : DEEP, 1, easeOut(beat(p, "portal")));
  else {
    top = 1 - 0.015 * easeInOut(beat(p, "collect")) - 0.02 * f;
    dx = (1 - top) * (transition.anchor.x - cx);
    dy = (1 - top) * (transition.anchor.y - cy);
  }
  const local = (x: number) => cx + (x - dx - cx) / top;
  const { snapshots: s, layer } = scannerVars(root);
  layer.setProperty("--sc-l", `${l.toFixed(1)}px`);
  layer.setProperty("--sc-r", `${r.toFixed(1)}px`);
  s.setProperty("--sc-cl", `${local(l).toFixed(1)}px`);
  s.setProperty("--sc-cr", `${local(r).toFixed(1)}px`);
  s.setProperty("--sc-top-t", dx || dy ? `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scale(${top.toFixed(4)})` : `scale(${top.toFixed(4)})`);
  // Light. Going out, Professional dims while the aperture forms, so the
  // scanner reads as light and Creative arrives fully lit inside the slit.
  // Coming back, Creative drains as it is gathered and compressed, and
  // Professional appears at full light outside the closing slit.
  if (out) {
    s.setProperty("--sc-top-f", "none");
    s.setProperty("--sc-bottom-f", `brightness(${(1 - 0.16 * aim).toFixed(3)}) saturate(${(1 - 0.3 * aim).toFixed(3)})`);
    // The Professional regions being cut into tiles: what is left of each.
    const open = { l, r };
    for (const region of transition.regions) {
      const clip = cutClip(region, p, open);
      if (lastCut.get(region.id) !== clip) {
        lastCut.set(region.id, clip);
        s.setProperty(`--sc-cut-${region.id}`, clip);
      }
    }
  } else {
    const drain = Math.max(0.5 * aim, f);
    s.setProperty("--sc-top-f", `brightness(${(1 - 0.14 * drain).toFixed(3)}) saturate(${(1 - 0.6 * drain).toFixed(3)})`);
    s.setProperty("--sc-bottom-f", "none");
  }
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
export function scannerTimeline(root: HTMLElement, hooks: { tick?: (now: number) => void; stalled?: () => void } = {}) {
  let previous = 0;
  return gsap
    .timeline({
      onUpdate: () => {
        // The gaps between updates are the browser's real frame intervals (the run's timing probe uses them), and a
        // gap this long means the page was suspended or blocked: the run is ended rather than resumed mid-motion.
        const now = performance.now();
        const stalled = previous > 0 && now - previous > STALL_MS;
        previous = now;
        hooks.tick?.(now);
        paintScanner(root);
        emitProgress();
        if (stalled) hooks.stalled?.();
      },
    })
    .fromTo(transition, { progress: 0 }, { progress: 1, duration: secondsFor(transition.direction), ease: "none" }, 0);
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
    const seconds = secondsFor(direction);
    const start = Math.max(0, passProgress(x, direction) * seconds - 0.06);
    const duration = Math.max(0.28, Math.min(0.56, seconds - start));
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
