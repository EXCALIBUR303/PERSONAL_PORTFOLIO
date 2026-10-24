"use client";
import { gsap } from "gsap";
import { flushSync } from "react-dom";

/**
 * World Shift: the transition between Professional and Creative mode.
 *
 * The browser's View Transitions API keeps a snapshot of the old world while
 * the new one renders underneath. One GSAP timeline then drives a few CSS
 * variables on <html>: the radius of a circle that reveals the new world from
 * the switch, the width of the cobalt/orange ring on its edge, and how far the
 * old world recedes. The new world is live during the reveal, so its own
 * entrance (Anime.js annotations, see shift-intro) plays inside the circle.
 *
 * Nothing reloads and no route changes. A second click while a shift runs
 * finishes the first one immediately and starts again. Without View
 * Transitions, or with reduced motion, the mode simply changes.
 */
type Origin = { x: number; y: number };
type Transition = { ready: Promise<void>; finished: Promise<void>; skipTransition: () => void };

let active: Transition | null = null;
let timeline: gsap.core.Timeline | null = null;
let lastShift = { mode: "", at: -Infinity };

export const SHIFT_MS = 760;

// Lets browser checks slow the timeline down in development only.
if (typeof window !== "undefined" && process.env.NODE_ENV === "development")
  (window as Window & { __worldShiftGsap?: typeof gsap }).__worldShiftGsap = gsap;

/** True for a component that mounted as part of a shift into `mode` just now. */
export const arrivedByShift = (mode: string) =>
  lastShift.mode === mode && performance.now() - lastShift.at < 600;

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

function clear(root: HTMLElement) {
  delete root.dataset.shift;
  for (const v of ["--ws-x", "--ws-y", "--ws-r", "--ws-w", "--ws-old"])
    root.style.removeProperty(v);
}

export function worldShift(next: string, apply: () => void, origin?: Origin) {
  const root = document.documentElement;
  const start = (document as Document & {
    startViewTransition?: (update: () => void) => Transition;
  }).startViewTransition?.bind(document);

  timeline?.kill();
  active?.skipTransition();
  clear(root);

  if (reduced() || !start) {
    lastShift = { mode: next, at: performance.now() };
    if (!reduced()) {
      // No View Transitions: a short colour cross-fade instead (modes.css).
      root.classList.add("mode-switching");
      window.setTimeout(() => root.classList.remove("mode-switching"), 350);
    }
    apply();
    return;
  }

  const x = origin?.x ?? innerWidth - 80;
  const y = origin?.y ?? 32;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 40;
  root.dataset.shift = next;
  root.style.setProperty("--ws-x", `${x}px`);
  root.style.setProperty("--ws-y", `${y}px`);
  root.style.setProperty("--ws-r", "0px");
  root.style.setProperty("--ws-w", "0px");
  root.style.setProperty("--ws-old", "1");

  const transition = start(() => {
    lastShift = { mode: next, at: performance.now() };
    flushSync(apply);
  });
  active = transition;
  transition.ready
    .then(() => {
      timeline = gsap
        .timeline()
        .to(root, { "--ws-r": `${radius}px`, duration: SHIFT_MS / 1000, ease: "power3.inOut" }, 0)
        .fromTo(root, { "--ws-w": "0px" }, { "--ws-w": "30px", duration: 0.22, ease: "power2.out" }, 0)
        .to(root, { "--ws-w": "0px", duration: 0.3, ease: "power2.in" }, 0.44)
        .to(root, { "--ws-old": 0.94, duration: SHIFT_MS / 1000, ease: "power2.inOut" }, 0);
    })
    .catch(() => {});
  transition.finished.finally(() => {
    if (active !== transition) return;
    active = null;
    timeline?.kill();
    timeline = null;
    clear(root);
  });
}
