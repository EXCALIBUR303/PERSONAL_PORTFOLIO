"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { animate, createDrawable } from "animejs";
import { onPrewarm, portal, subscribePortal } from "@/lib/world-shift";
import { requestedStyle } from "@/lib/transition/state";
import { useWebGL } from "@/components/scenes/use-webgl";

const PortalCanvas = dynamic(() => import("./portal-canvas"), { ssr: false });

const SPARKS = 10;

/**
 * Full-screen layer above the page for the World Shift portal ride. It stays
 * empty until the visitor shows intent (pointer near the mode switch, focus on
 * it) or the browser is idle, then loads the 3D canvas once and keeps it. The
 * layer is only visible while a shift runs (world-shift.css); the View
 * Transition shows it live above both page snapshots. Anime.js draws the
 * short spark lines at the switch when a ride starts; GSAP owns the ride.
 */
export default function PortalLayer() {
  const webgl = useWebGL();
  const [load, setLoad] = useState(false);
  const sparks = useRef<SVGSVGElement>(null);
  const running = useSyncExternalStore(subscribePortal, () => portal.running, () => false);

  useEffect(() => {
    // The portal ride is the earlier transition, kept for comparison: it loads
    // only when asked for (?transition=portal).
    const capable =
      "startViewTransition" in document &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches &&
      requestedStyle() === "portal";
    if (!capable) return;
    const off = onPrewarm(() => setLoad(true));
    // Touch screens have no hover, so also load once the page has settled,
    // well after its own scenes have started.
    let idle = 0;
    const later = window.setTimeout(() => {
      idle = window.requestIdleCallback
        ? window.requestIdleCallback(() => setLoad(true), { timeout: 4000 })
        : window.setTimeout(() => setLoad(true), 0);
    }, 5000);
    return () => {
      off();
      window.clearTimeout(later);
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, []);

  useEffect(() => {
    const svg = sparks.current;
    if (!running || !svg) return;
    svg.style.left = `${portal.ox}px`;
    svg.style.top = `${portal.oy}px`;
    svg.dataset.next = portal.next;
    const lines = createDrawable(svg.querySelectorAll("line"));
    const run = animate(lines, {
      draw: ["0 0", "0 1", "1 1"],
      duration: 460,
      ease: "outQuad",
    });
    return () => {
      run.revert();
    };
  }, [running]);

  return (
    <div className="ws-portal" aria-hidden="true">
      {load && webgl && <PortalCanvas />}
      <svg ref={sparks} className="ws-sparks" viewBox="-60 -60 120 120">
        {Array.from({ length: SPARKS }, (_, i) => {
          const a = (i / SPARKS) * Math.PI * 2;
          // Rounded so server and browser print the same attribute values.
          const at = (r: number, f: (v: number) => number) => Math.round(f(a) * r * 100) / 100;
          const outer = i % 2 ? 44 : 36;
          return (
            <line key={i} x1={at(20, Math.cos)} y1={at(20, Math.sin)} x2={at(outer, Math.cos)} y2={at(outer, Math.sin)} />
          );
        })}
      </svg>
    </div>
  );
}
