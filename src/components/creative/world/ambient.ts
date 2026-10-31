"use client";
import { useSyncExternalStore } from "react";
import type { Tier } from "./quality";

/*
 * Ambient motion of the Creative studio: the slow life the world has while the visitor does nothing. In the 3D world,
 * landmarks float a few pixels, the Studio's light breathes, a light travels along one bridge at a time and the key
 * light drifts; over it, on the compositor (world.css), cloud shadows cross the map and the explorable stations'
 * markers take turns to ripple. The 2D map has its own CSS version (map-2d.css).
 *
 * There is no loop of its own. The world canvas renders on demand; `AmbientClock` (scene/ambient-clock.tsx) keeps
 * asking the canvas for frames while the ambient motion is on, and stops asking the moment it is off, so an idle
 * page costs nothing when the map is off screen, the tab is hidden, the visitor has paused motion or asked the
 * system for reduced motion. Everything that moves reads the shared numbers below in its own `useFrame`; nothing
 * sets React state per frame.
 *
 * Levels follow the world's quality tier:
 *   full    high and medium: continuous slow motion, drawn at the ambient rate (30 by default) while it is on;
 *           medium leaves out the finer details (`ambient.rich`: the sway, the lights' tail and halo, the light drift)
 *   events  low tier: no continuous 3D motion; a light crosses a bridge every few seconds, and the canvas draws
 *           only while it does (the compositor's clouds and ripples still run)
 *   saver   a visitor who asks to save data: as events, half as often
 *   off     reduced motion: nothing moves (interaction cues stay)
 */
export type AmbientLevel = "full" | "events" | "saver" | "off";

export function ambientLevel(tier: Tier, reduced: boolean): AmbientLevel {
  if (reduced) return "off";
  const nav = typeof navigator === "undefined" ? null : (navigator as Navigator & { connection?: { saveData?: boolean } });
  if (nav?.connection?.saveData) return "saver";
  return tier === "low" ? "events" : "full";
}

/**
 * How often the full level draws: every display frame (60) or every other one (30). At 30 the loop still runs once
 * per display frame, but the scene is drawn on alternate frames only, and always on every frame while the visitor is
 * interacting (a hover, a selection or a camera move: `ambient.busyUntil`), so responsiveness does not change.
 * `?ambient=30` or `?ambient=60` overrides the default, for comparing the two.
 */
export type AmbientRate = 60 | 30;
export const DEFAULT_RATE: AmbientRate = 30;
export function ambientRate(): AmbientRate {
  try {
    const q = new URLSearchParams(window.location.search).get("ambient");
    if (q === "30") return 30;
    if (q === "60") return 60;
  } catch {
    // No override.
  }
  return DEFAULT_RATE;
}

/** Seconds between the starts of two events, and how long one lasts, for the event levels. */
export const EVENT_GAP = { events: 5.5, saver: 11 } as const;
export const EVENT_LENGTH = 2.6;

/** The shared clock and what is on screen. Written by the clock and the stage; read in `useFrame`. */
export const ambient = {
  /** The level the canvas is running at (set by the clock from its props). */
  level: "off" as AmbientLevel,
  /** The high tier only: the finer details (the landmarks' sway, the bridge lights' tail and halo, the key light's drift). */
  rich: false,
  /** Seconds of ambient time. In the full level it advances only while the motion runs, so it resumes where it stopped. */
  t: 0,
  /** 0 to 1: how much of the ambient motion is showing (eases in and out, so pausing never jumps). */
  amount: 0,
  /** Whether the stage is on screen (an IntersectionObserver in world-stage.tsx). */
  visible: true,
  /** The bridge a light is crossing (0 systems, 1 algorithms, 2 intelligence), and how far it has got, 0 to 1. */
  bridge: { index: -1, u: 0 },
  /** Until when (performance.now) the visitor's own input is being drawn: those frames are never skipped. */
  busyUntil: 0,
  /** Asks the canvas for a frame; set by the clock while it is mounted. */
  kick: null as null | (() => void),
};

/** Whether ambient motion should be running now (the visitor's pause, the stage on screen and the tab visible). */
/** Marks the next `ms` as the visitor's own motion (a camera move, a hover): drawn at the full rate. */
export const markBusy = (ms = 700) => {
  ambient.busyUntil = Math.max(ambient.busyUntil, performance.now() + ms);
};

export const ambientWanted = () =>
  ambient.level !== "off" && !paused && ambient.visible && (typeof document === "undefined" || !document.hidden);

/*
 * The visitor's own pause ("Pause motion"). It is kept for the visit (sessionStorage), so it holds across a switch to
 * Professional and back, and it never overrides reduced motion, which is off whatever this says.
 */
const KEY = "studio-motion-paused";
let paused = (() => {
  try {
    return typeof sessionStorage !== "undefined" && sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
})();
const listeners = new Set<() => void>();
export function setAmbientPaused(value: boolean) {
  paused = value;
  try {
    if (value) sessionStorage.setItem(KEY, "1");
    else sessionStorage.removeItem(KEY);
  } catch {
    // Storage can be blocked; the pause still holds for this page.
  }
  listeners.forEach((cb) => cb());
  ambient.kick?.();
}
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
export const useAmbientPaused = () => useSyncExternalStore(subscribe, () => paused, () => false);

/** A stable pseudo-random number from 0 to 1 for a name, so each landmark has its own phase and period. */
export function seedOf(name: string) {
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10007) / 10007;
}
