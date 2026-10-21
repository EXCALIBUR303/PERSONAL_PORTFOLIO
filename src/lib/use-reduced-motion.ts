"use client";
import { useSyncExternalStore } from "react";
const query = "(prefers-reduced-motion: reduce)";
function subscribe(onChange: () => void) {
  const preference = window.matchMedia(query);
  preference.addEventListener("change", onChange);
  return () => preference.removeEventListener("change", onChange);
}
function snapshot() {
  return window.matchMedia(query).matches;
}
// Observe live preference changes, including while an exploration is running.
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, snapshot, () => true);
}
