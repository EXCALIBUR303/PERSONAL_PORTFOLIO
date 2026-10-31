"use client";
import { useEffect, useState } from "react";

/**
 * When a loading skeleton may show, and how it leaves. Content that is ready
 * before `SKELETON_DELAY_MS` never shows one; content that is not ready by then
 * gets its skeleton, which leaves with a wipe the moment the content is ready
 * (no minimum display time). Past `SLOW_MS` the region says plainly that it is
 * taking longer than usual.
 *
 *   idle      waiting, nothing shown yet (a short wait looks like the plain surface)
 *   shown     the skeleton is on screen
 *   wiping    content is ready; the skeleton is leaving
 *   done      nothing to show
 */
export const SKELETON_DELAY_MS = 150;
/** How long a leaving wipe takes; the CSS transition uses the same value. */
export const WIPE_MS = 320;
export const WIPE_REDUCED_MS = 120;
/** How long a status line waits before appearing, so brief waits show no text. */
export const STATUS_MS = 1000;
export const SLOW_MS = 8000;
export type GatePhase = "idle" | "shown" | "wiping" | "done";

const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export function useSkeletonGate(ready: boolean, hold = false) {
  const [delayed, setDelayed] = useState(false);
  const [left, setLeft] = useState(false);
  const [status, setStatus] = useState(false);
  const [slow, setSlow] = useState(false);

  // The phase follows from three facts, so no state is set while rendering or in the body of an effect.
  // While `hold` is set (a mode transition is running) the skeleton is already in place beneath it, so the
  // fragments hand over to it at rest; but no clock starts until the visitor can see it.
  const phase: GatePhase = ready ? (delayed ? (left ? "done" : "wiping") : "done") : delayed || hold ? "shown" : "idle";

  useEffect(() => {
    if (ready || delayed) return;
    // Under a running transition the skeleton is already in place; otherwise it waits out the delay.
    const id = window.setTimeout(() => setDelayed(true), hold ? 0 : SKELETON_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [ready, delayed, hold]);

  useEffect(() => {
    if (!ready || !delayed || left) return;
    const id = window.setTimeout(() => setLeft(true), reducedMotion() ? WIPE_REDUCED_MS : WIPE_MS);
    return () => window.clearTimeout(id);
  }, [ready, delayed, left]);

  // The status line and the "taking longer" notice only count time a skeleton has been on screen.
  useEffect(() => {
    if (phase !== "shown" || hold) return;
    const a = window.setTimeout(() => setStatus(true), STATUS_MS);
    const b = window.setTimeout(() => setSlow(true), SLOW_MS);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, [phase, hold]);

  return { phase, status: status && phase === "shown", slow: slow && phase === "shown" };
}
