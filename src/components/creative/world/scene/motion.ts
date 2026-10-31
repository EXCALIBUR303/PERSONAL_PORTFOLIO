"use client";
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

/*
 * Landmark reactions. The world renders only on demand, so a reaction keeps
 * the canvas drawing while it moves and stops asking once it settles; an idle
 * world costs nothing. Under reduced motion every reaction jumps to its end
 * state (lights on, parts in place) with no movement.
 */

/*
 * The light and the architecture stand still, so the shadow map does not need
 * drawing again when only the camera moves. Anything that moves a part marks
 * it, and the canvas redraws the shadows on the next frame only.
 */
let shadowsDirty = true;
export const markShadows = () => {
  shadowsDirty = true;
};
export const takeShadows = () => {
  const dirty = shadowsDirty;
  shadowsDirty = false;
  return dirty;
};

/** Frame time, clamped so the first frame after an idle spell does not jump. */
export const tick = (delta: number) => Math.min(0.05, Math.max(0, delta));

/** A level that rises to 1 while `on` and falls back to 0 after. */
export function useLevel(on: boolean, reduced: boolean, up = 0.28, down = 0.5) {
  const level = useRef(0);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => invalidate(), [on, invalidate]);
  useFrame((_, delta) => {
    const goal = on ? 1 : 0;
    if (level.current === goal) return;
    if (reduced) level.current = goal;
    else {
      const step = tick(delta) / (on ? up : down);
      level.current = on ? Math.min(1, level.current + step) : Math.max(0, level.current - step);
    }
    markShadows();
    invalidate();
  });
  return level;
}

/**
 * A one-shot run from 0 to 1 over `seconds`, started each time `on` turns
 * true. It rests at 1 while `on` stays true and returns to 0 when it turns off.
 */
export function usePlay(on: boolean, reduced: boolean, seconds: number, replay?: boolean) {
  const t = useRef(0);
  const running = useRef(false);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (on) {
      t.current = reduced ? 1 : 0;
      running.current = !reduced;
    } else {
      running.current = false;
      t.current = 0;
    }
    markShadows();
    invalidate();
  }, [on, reduced, replay, invalidate]);
  useFrame((_, delta) => {
    if (!running.current) return;
    t.current = Math.min(1, t.current + tick(delta) / seconds);
    if (t.current >= 1) running.current = false;
    markShadows();
    invalidate();
  });
  return t;
}

export const smooth = (t: number) => t * t * (3 - 2 * t);
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** The part of a run between two moments, as 0..1. */
export const span = (t: number, from: number, to: number) => clamp01((t - from) / (to - from));

/** A point along a polyline by length, with the direction of travel. */
export function along(points: [number, number, number][], t: number) {
  const lengths: number[] = [];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const [ax, ay, az] = points[i - 1];
    const [bx, by, bz] = points[i];
    const l = Math.hypot(bx - ax, by - ay, bz - az);
    lengths.push(l);
    total += l;
  }
  let d = clamp01(t) * total;
  for (let i = 1; i < points.length; i++) {
    const l = lengths[i - 1];
    if (d <= l || i === points.length - 1) {
      const k = l ? Math.min(1, d / l) : 0;
      const [ax, ay, az] = points[i - 1];
      const [bx, by, bz] = points[i];
      return {
        x: ax + (bx - ax) * k,
        y: ay + (by - ay) * k,
        z: az + (bz - az) * k,
        heading: Math.atan2(bx - ax, bz - az),
      };
    }
    d -= l;
  }
  const [x, y, z] = points[points.length - 1];
  return { x, y, z, heading: 0 };
}
