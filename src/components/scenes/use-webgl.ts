"use client";
import { useSyncExternalStore } from "react";

let cached: boolean | null = null;
function probe() {
  if (cached !== null) return cached;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    cached = Boolean(gl);
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    cached = false;
  }
  return cached;
}
const noop = () => () => {};

/** null on the server and before hydration, then whether WebGL is available. */
export function useWebGL() {
  return useSyncExternalStore<boolean | null>(noop, probe, () => null);
}
