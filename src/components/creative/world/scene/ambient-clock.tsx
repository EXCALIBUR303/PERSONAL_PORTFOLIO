"use client";
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { stations } from "../../studio/stations";
import { ambient, ambientWanted, EVENT_GAP, EVENT_LENGTH, markBusy, type AmbientLevel, type AmbientRate } from "../ambient";
import { markShadows, tick } from "./motion";

/**
 * The explorable stations (exhibits), district by district as the map reads: the ones that sway a little in the full
 * level, and whose markers take turns to ripple (world.css, `--amb-i`).
 */
export const FEATURED = stations.filter((s) => s.tier === "exhibit").map((s) => s.slug);
/** Seconds between two lights setting off along the bridges, and how long one takes to cross. */
const CROSS_EVERY = 3.4;
const CROSS_FOR = 2.6;
/** How often the shadow map is redrawn while landmarks float: they move a few pixels over several seconds. */
const SHADOW_EVERY_MS = 220;

/**
 * Drives the ambient motion from inside the world canvas's own loop (see ../ambient.ts). Each frame it advances the
 * ambient clock and works out whose turn it is, then asks for the next frame only while there is something to show.
 * In the event levels the canvas sleeps between events; a timeout wakes it for the next one (it requests a single
 * frame of the existing loop, it does not run a loop of its own).
 */
export function AmbientClock({ level, shadows, rate, rich }: { level: AmbientLevel; shadows: boolean; rate: AmbientRate; rich: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  const wake = useRef(0);
  const lastShadow = useRef(0);
  const origin = useRef(0);

  useEffect(() => {
    ambient.level = level;
    ambient.rich = rich;
    origin.current = performance.now();
    const kick = () => {
      markBusy(400);
      invalidate();
    };
    ambient.kick = kick;
    const onVisibility = () => {
      if (!document.hidden) kick();
    };
    document.addEventListener("visibilitychange", onVisibility);
    kick();
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearTimeout(wake.current);
      if (ambient.kick === kick) ambient.kick = null;
      ambient.level = "off";
      ambient.rich = false;
      ambient.amount = 0;
      ambient.bridge.index = -1;
    };
  }, [level, rich, invalidate]);

  useFrame((state, delta) => {
    if (level === "off") return;
    const want = ambientWanted();
    const dt = tick(delta);
    // The motion fades in over 0.8 s and out over 0.5 s, so starting, pausing and scrolling away never jump.
    ambient.amount = want ? Math.min(1, ambient.amount + dt / 0.8) : Math.max(0, ambient.amount - dt / 0.5);
    const showing = ambient.amount > 0;

    if (level === "full") {
      if (want) ambient.t += dt;
      const t = ambient.t;
      ambient.bridge.index = Math.floor(t / CROSS_EVERY) % 3;
      ambient.bridge.u = (t % CROSS_EVERY) / CROSS_FOR;
      if (showing) {
        state.invalidate();
        const now = performance.now();
        if (shadows && now - lastShadow.current > SHADOW_EVERY_MS) {
          lastShadow.current = now;
          markShadows();
        }
      }
      return;
    }

    // Event levels: a light crosses one bridge every few seconds; between crossings nothing moves and nothing is drawn.
    const gap = EVENT_GAP[level];
    const seconds = (performance.now() - origin.current) / 1000;
    const phase = seconds % gap;
    const n = Math.floor(seconds / gap);
    ambient.t = seconds;
    window.clearTimeout(wake.current);
    if (want && phase < EVENT_LENGTH) {
      ambient.bridge.index = n % 3;
      ambient.bridge.u = phase / EVENT_LENGTH;
      state.invalidate();
    } else {
      ambient.bridge.index = -1;
      if (want) wake.current = window.setTimeout(() => invalidate(), (gap - phase) * 1000 + 16);
    }
  }, -3);

  return level !== "off" && rate === 30 ? <HalfRate /> : null;
}

/**
 * The 30-frames-a-second option (the default, for every level that draws). A subscriber with a positive priority takes over drawing from the canvas (react-three
 * -fiber then no longer draws by itself), so it can leave out every other frame. It is not a loop of its own: it runs
 * in the canvas's frames, and draws on all of them while the visitor is interacting or the motion is fading in or out.
 */
function HalfRate() {
  const odd = useRef(false);
  useFrame(({ gl, scene, camera }) => {
    odd.current = !odd.current;
    if (odd.current || performance.now() < ambient.busyUntil || ambient.amount < 0.98) gl.render(scene, camera);
  }, 1);
  return null;
}
