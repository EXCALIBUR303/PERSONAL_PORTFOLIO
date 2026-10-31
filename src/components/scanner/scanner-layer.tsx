"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { onPrewarm } from "@/lib/world-shift";
import { requestedStyle, setLayerReady, subscribeTransition, transition } from "@/lib/transition/state";
import { useWebGL } from "@/components/scenes/use-webgl";
import { preloadHeroScene } from "@/components/scenes/registry";
import { probeWebGL } from "@/components/creative/world/quality";
import ScannerFrame from "./scanner-frame";

const ScannerCanvas = dynamic(() => import("./scanner-canvas"), { ssr: false });

/**
 * Creative's typefaces are not preloaded (most visitors never switch). Asking
 * for them on intent means the first switch does not wait for them.
 */
function warmCreativeFonts() {
  const style = getComputedStyle(document.body);
  const display = style.getPropertyValue("--font-instrument").trim();
  const body = style.getPropertyValue("--font-familjen").trim();
  const faces = [
    display && `400 1em ${display}`,
    display && `italic 400 1em ${display}`,
    body && `400 1em ${body}`,
    body && `600 1em ${body}`,
    body && `700 1em ${body}`,
  ].filter(Boolean) as string[];
  faces.forEach((face) => document.fonts?.load(face).catch(() => {}));
}

/**
 * Low-power devices, or a visitor asking to save data, get the scanner's drawn
 * frame without the 3D particles: the same choreography, much less work.
 */
function prefersLite() {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  return (
    (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) ||
    (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 2) ||
    nav.connection?.saveData === true
  );
}

/**
 * Full-viewport layer for the Precision Scanner. The drawn frame (SVG, cheap)
 * is always ready, so even the first click gets the scanner; the 3D particles
 * load when the visitor shows intent (pointer or focus on the mode switch) or
 * once the page has settled, and join from the next run on. A new WebGL canvas
 * compiles on the GPU, which would stall a transition in progress, so the
 * particles never start loading while one is running. Without WebGL, or on a
 * low-power device, the scanner runs with the frame alone.
 *
 * The layer never blocks the page: no pointer events, hidden from assistive
 * technology, and visible only while a transition runs (world-shift.css).
 */
export default function ScannerLayer() {
  const webgl = useWebGL();
  // A software renderer (no GPU, as with hardware acceleration turned off) would draw the particles on the CPU and
  // stall the transition; it gets the drawn frame only, as the studio map gets its 2D version (world/quality.ts).
  const gpu = webgl === true && !probeWebGL().software;
  const [load, setLoad] = useState(false);
  useEffect(() => {
    const capable =
      "startViewTransition" in document &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches &&
      requestedStyle() === "scanner";
    if (!capable) return;
    setLayerReady("frame", true);
    let waiting: (() => void) | null = null;
    const lite = prefersLite();
    const arm = () => {
      warmCreativeFonts();
      // From Creative, the Professional hero scene is built on the way back:
      // fetching its code now means the switch never waits on a download.
      if (document.documentElement.dataset.mode === "creative") preloadHeroScene();
      // From Professional, the studio map asks once whether the device has WebGL when it first mounts (a throwaway
      // context, a few milliseconds); asking now keeps that out of the switch's capture frame.
      else probeWebGL();
      if (lite) return;
      if (!transition.running) return setLoad(true);
      if (waiting) return;
      waiting = subscribeTransition(() => {
        if (transition.running) return;
        waiting?.();
        waiting = null;
        setLoad(true);
      });
    };
    const off = onPrewarm(arm);
    // After the page's own scenes have started, so it never competes with them.
    let idle = 0;
    const later = window.setTimeout(() => {
      idle = window.requestIdleCallback
        ? window.requestIdleCallback(arm, { timeout: 4000 })
        : window.setTimeout(arm, 0);
    }, 5000);
    return () => {
      off();
      waiting?.();
      window.clearTimeout(later);
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      setLayerReady("frame", false);
    };
  }, []);
  return (
    <div className="sc-layer" aria-hidden="true">
      {load && gpu && <ScannerCanvas />}
      <ScannerFrame />
    </div>
  );
}
