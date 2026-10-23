"use client";
import { useCallback, useSyncExternalStore } from "react";

/**
 * Session-only exploration progress for Creative mode.
 *
 * It records two real things: which project pages this browser tab has opened,
 * and which mission steps (problem, try it, how it works, decisions) were
 * opened. It lives in sessionStorage, so it is private to this tab, is never
 * sent anywhere, and is gone when the tab closes. It is not a visitor count.
 */
const KEY = "portfolio-exploration";

export const missionSteps = [
  { id: "problem", label: "Discover the problem", short: "Problem" },
  { id: "try", label: "Try the demonstration", short: "Try it" },
  { id: "how", label: "Explore how it works", short: "How it works" },
  {
    id: "decisions",
    label: "Inspect the technical decisions",
    short: "Decisions",
  },
] as const;
export type MissionStep = (typeof missionSteps)[number]["id"];

type Progress = {
  projects: string[];
  steps: Record<string, MissionStep[]>;
};
const EMPTY: Progress = { projects: [], steps: {} };

const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cached: Progress = EMPTY;

function read(): Progress {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(KEY);
  } catch {
    return cached;
  }
  if (raw === cachedRaw) return cached;
  cachedRaw = raw;
  try {
    const parsed = raw ? (JSON.parse(raw) as Progress) : EMPTY;
    cached = Array.isArray(parsed.projects) && parsed.steps ? parsed : EMPTY;
  } catch {
    cached = EMPTY;
  }
  return cached;
}

function write(next: Progress) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage can be blocked. Keep the session in memory so the UI still reacts.
    cachedRaw = JSON.stringify(next);
    cached = next;
  }
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
};

export function useExploration() {
  const progress = useSyncExternalStore(subscribe, read, () => EMPTY);
  const markProject = useCallback((slug: string) => {
    const current = read();
    if (current.projects.includes(slug)) return;
    write({ ...current, projects: [...current.projects, slug] });
  }, []);
  const markStep = useCallback((slug: string, step: MissionStep) => {
    const current = read();
    const done = current.steps[slug] ?? [];
    const projects = current.projects.includes(slug)
      ? current.projects
      : [...current.projects, slug];
    if (done.includes(step) && projects === current.projects) return;
    write({
      projects,
      steps: {
        ...current.steps,
        [slug]: done.includes(step) ? done : [...done, step],
      },
    });
  }, []);
  const reset = useCallback(() => write(EMPTY), []);
  return {
    visited: progress.projects,
    stepsFor: (slug: string) => progress.steps[slug] ?? [],
    markProject,
    markStep,
    reset,
  };
}
