"use client";
import { useEffect, useLayoutEffect, type RefObject } from "react";
import { animate as animeAnimate, createDrawable, createScope, stagger } from "animejs";
import { animate, type AnimationPlaybackControls } from "motion/react";
import { arrivalDelay, arrivedByScanner, arrivedByShift } from "@/lib/world-shift";
import { passProgress, secondsFor, timing, transition, whenStarted } from "@/lib/transition/state";

/**
 * Entrance for a mode's home after a World Shift (and, for Creative, on first
 * load). Ownership is split so no two engines touch the same element:
 *   Anime.js  the drawn SVG strokes (Creative scribbles, Professional grid lines)
 *   Motion    the interface itself settling into place
 * After the Precision Scanner, each block arrives as a scanner passes it, so the
 * layout assembles behind the line rather than all at once.
 */
const ARRIVALS = {
  creative: {
    selector: ".c-island, .c-pin, .c-progress, .c-brief",
    from: { opacity: 0, y: 18, scale: 0.94 },
    to: { opacity: 1, y: 0, scale: 1 },
    ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
    duration: 0.46,
  },
  pro: {
    selector: ".hx-copy > *, .hx-visual",
    from: { opacity: 0, x: -14 },
    to: { opacity: 1, x: 0 },
    ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    duration: 0.38,
  },
};

export function useShiftIntro(
  root: RefObject<HTMLElement | null>,
  mode: "pro" | "creative",
  { onLoad = false }: { onLoad?: boolean } = {},
) {
  // Interface arrival (Motion). A layout effect, so the starting state is set
  // before the new page is first painted (after the scanner, once its timeline starts).
  useLayoutEffect(() => {
    const el = root.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const shifted = arrivedByShift(mode);
    if (!shifted && !(onLoad && mode === "creative")) return;
    const spec = ARRIVALS[mode];
    const targets = [...el.querySelectorAll<HTMLElement>(spec.selector)];
    if (!targets.length) return;
    const running: AnimationPlaybackControls[] = [];
    const reset = () =>
      targets.forEach((t) => {
        t.style.removeProperty("opacity");
        t.style.removeProperty("transform");
      });
    const play = (delayFor: (t: HTMLElement, i: number) => number) =>
      targets.forEach((t, i) => {
        const motion = animate(t, spec.to, { delay: delayFor(t, i), duration: spec.duration, ease: spec.ease });
        running.push(motion);
        motion.finished.then(() => {
          t.style.removeProperty("opacity");
          t.style.removeProperty("transform");
        });
      });
    const hide = () => targets.forEach((t) => running.push(animate(t, spec.from, { duration: 0 })));

    if (shifted && arrivedByScanner()) {
      // Each block arrives as a scanner reaches its centre. All of it waits until the snapshot exists: the new page
      // is hidden behind the scanners until the main timeline runs, and reading the blocks' boxes or writing their
      // starting state inside the capture frame would make the browser recalculate and lay out the page again there.
      // If the run ends before it starts, nothing has been hidden and the page is simply there.
      whenStarted(() => {
        const centres = targets.map((t) => {
          const box = t.getBoundingClientRect();
          return box.left + box.width / 2;
        });
        hide();
        play((_, i) => Math.max(0, passProgress(centres[i]) - transition.progress) * secondsFor() + 0.04);
      });
      return () => {
        running.forEach((r) => r.stop());
        reset();
      };
    }
    hide();
    const wait = shifted ? arrivalDelay() / 1000 : 0;
    play((_, i) => wait + 0.12 + i * 0.05);
    return () => {
      running.forEach((r) => r.stop());
      reset();
    };
  }, [root, mode, onLoad]);

  // Drawn strokes (Anime.js).
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!onLoad && !arrivedByShift(mode)) return;
    // After the scanner, the strokes draw once the new page is fully revealed.
    const wait = arrivedByShift(mode)
      ? arrivedByScanner()
        ? Math.round(secondsFor() * timing().phases.scan[1] * 1000)
        : arrivalDelay()
      : 0;
    const draw = () =>
      createScope({ root }).add(() => {
        if (mode === "creative") {
          animeAnimate(createDrawable(".c-draw path"), {
            draw: ["0 0", "0 1"],
            duration: 650,
            delay: stagger(180, { start: 220 + wait }),
            ease: "inOutQuad",
          });
        } else {
          animeAnimate(createDrawable(".ws-grid line"), {
            draw: ["0 0", "0 1"],
            duration: 700,
            delay: stagger(25, { start: wait }),
            ease: "outQuad",
          });
        }
      });
    // After the scanner the scope is built once the snapshot exists: `createDrawable` reads the computed style of every
    // stroke, which inside the capture frame would recalculate the style of the whole new page a second time. The
    // strokes are not on screen before the main timeline starts (the new page is hidden behind the scanners).
    let scope: ReturnType<typeof draw> | null = null;
    if (arrivedByShift(mode) && arrivedByScanner()) whenStarted(() => (scope = draw()));
    else scope = draw();
    return () => scope?.revert();
  }, [root, mode, onLoad]);
}
