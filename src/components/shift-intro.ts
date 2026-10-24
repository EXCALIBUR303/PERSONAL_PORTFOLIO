"use client";
import { useEffect, type RefObject } from "react";
import { animate, createDrawable, createScope, stagger } from "animejs";
import { arrivalDelay, arrivedByShift } from "@/lib/world-shift";

/**
 * Entrance for a mode's home after a World Shift (and, for Creative, on first
 * load). Anime.js owns only these annotation and settle animations, scoped to
 * one root and reverted on unmount; GSAP owns the shift itself and Motion owns
 * component state, so no two engines touch the same element.
 */
export function useShiftIntro(
  root: RefObject<HTMLElement | null>,
  mode: "pro" | "creative",
  { onLoad = false }: { onLoad?: boolean } = {},
) {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!onLoad && !arrivedByShift(mode)) return;
    // After a portal ride, wait until the portal has opened over this world.
    const wait = arrivedByShift(mode) ? arrivalDelay() : 0;
    const scope = createScope({ root }).add(() => {
      if (mode === "creative") {
        animate(createDrawable(".c-draw path"), {
          draw: ["0 0", "0 1"],
          duration: 650,
          delay: stagger(180, { start: 220 + wait }),
          ease: "inOutQuad",
        });
        animate(".c-island", {
          y: [22, 0],
          rotate: { from: stagger([-3, 3]), to: 0 },
          scale: [0.96, 1],
          duration: 620,
          delay: stagger(80, { start: 120 + wait }),
          ease: "outBack(1.4)",
          onComplete: (self) => self.revert(),
        });
      } else {
        animate(createDrawable(".ws-grid line"), {
          draw: ["0 0", "0 1"],
          duration: 700,
          delay: stagger(25, { start: wait }),
          ease: "outQuad",
        });
        animate(".hx-copy > *", {
          y: [14, 0],
          opacity: [0, 1],
          duration: 420,
          delay: stagger(60, { start: 160 + wait }),
          ease: "outQuad",
          onComplete: (self) => self.revert(),
        });
      }
    });
    return () => scope.revert();
  }, [root, mode, onLoad]);
}
