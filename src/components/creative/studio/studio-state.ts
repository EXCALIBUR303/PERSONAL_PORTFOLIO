"use client";
import { useCallback, useSyncExternalStore } from "react";
import type { District } from "../identity";

/*
 * Small stores for the studio map, all private to this browser tab:
 *   saved       the station, district and view the visitor left the map in
 *   exhibit     which exhibit is open, carried in the address as ?exhibit=slug
 *   challenges  the optional challenges the visitor revealed
 * Nothing here is sent anywhere, and session storage is gone when the tab closes.
 */
export type StudioView = "map" | "list";
export type Saved = { slug: string | null; focus: District | "all"; view: StudioView };

const KEY = "portfolio-studio";
const DEFAULT: Saved = { slug: null, focus: "all", view: "map" };
const DISTRICT_IDS = ["systems", "algorithms", "intelligence"];

/* ---------- saved selection ---------- */
const savedListeners = new Set<() => void>();
let savedRaw: string | null = null;
let savedCache: Saved = DEFAULT;

function readSaved(): Saved {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(KEY);
  } catch {
    return savedCache;
  }
  if (raw === savedRaw) return savedCache;
  savedRaw = raw;
  try {
    const parsed = (raw ? JSON.parse(raw) : {}) as Partial<Saved>;
    savedCache = {
      slug: typeof parsed.slug === "string" ? parsed.slug : null,
      focus: DISTRICT_IDS.includes(parsed.focus as string) ? (parsed.focus as District) : "all",
      view: parsed.view === "list" ? "list" : "map",
    };
  } catch {
    savedCache = DEFAULT;
  }
  return savedCache;
}
function writeSaved(next: Saved) {
  const raw = JSON.stringify(next);
  try {
    sessionStorage.setItem(KEY, raw);
  } catch {
    // Storage can be blocked. Keep the choice in memory so the map still reacts.
    savedRaw = raw;
    savedCache = next;
  }
  savedListeners.forEach((l) => l());
}
function subscribeSaved(l: () => void) {
  savedListeners.add(l);
  window.addEventListener("storage", l);
  return () => {
    savedListeners.delete(l);
    window.removeEventListener("storage", l);
  };
}
export function useSaved() {
  const saved = useSyncExternalStore(subscribeSaved, readSaved, () => DEFAULT);
  const update = useCallback((patch: Partial<Saved>) => writeSaved({ ...readSaved(), ...patch }), []);
  return [saved, update] as const;
}

/* ---------- the open exhibit, in the address ---------- */
const URL_EVENT = "studio-url";
let pushedByUs = false;
let scrollBefore = 0;

const readExhibit = () => new URLSearchParams(window.location.search).get("exhibit");
function subscribeUrl(l: () => void) {
  window.addEventListener("popstate", l);
  window.addEventListener(URL_EVENT, l);
  return () => {
    window.removeEventListener("popstate", l);
    window.removeEventListener(URL_EVENT, l);
  };
}
const notifyUrl = () => window.dispatchEvent(new Event(URL_EVENT));

/**
 * Opening an exhibit adds one history entry, so the browser's Back button
 * closes it. Switching to a neighbouring exhibit replaces that entry. A page
 * opened straight on ?exhibit=… has no earlier entry of ours to go back to, so
 * closing it just clears the address.
 */
export function useExhibitParam() {
  const exhibit = useSyncExternalStore(subscribeUrl, readExhibit, () => null);
  const open = useCallback((slug: string) => {
    const url = `${window.location.pathname}?exhibit=${encodeURIComponent(slug)}`;
    if (readExhibit()) {
      window.history.replaceState(null, "", url);
    } else {
      scrollBefore = window.scrollY;
      window.history.pushState(null, "", url);
      pushedByUs = true;
    }
    notifyUrl();
  }, []);
  const close = useCallback(() => {
    if (pushedByUs) {
      pushedByUs = false;
      window.history.back();
    } else {
      window.history.replaceState(null, "", window.location.pathname + window.location.hash);
      notifyUrl();
    }
  }, []);
  return { exhibit, open, close, scrollBefore: () => scrollBefore };
}

/* ---------- finished challenges ---------- */
const DONE_KEY = "portfolio-studio-challenges";
const doneListeners = new Set<() => void>();
let doneRaw: string | null = null;
let doneCache: string[] = [];
const EMPTY: string[] = [];

function readDone(): string[] {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(DONE_KEY);
  } catch {
    return doneCache;
  }
  if (raw === doneRaw) return doneCache;
  doneRaw = raw;
  try {
    const parsed = raw ? (JSON.parse(raw) as unknown) : EMPTY;
    doneCache = Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : EMPTY;
  } catch {
    doneCache = EMPTY;
  }
  return doneCache;
}
function writeDone(next: string[]) {
  const raw = JSON.stringify(next);
  try {
    sessionStorage.setItem(DONE_KEY, raw);
  } catch {
    doneRaw = raw;
    doneCache = next;
  }
  doneListeners.forEach((l) => l());
}
function subscribeDone(l: () => void) {
  doneListeners.add(l);
  window.addEventListener("storage", l);
  return () => {
    doneListeners.delete(l);
    window.removeEventListener("storage", l);
  };
}
export function useChallenges() {
  const done = useSyncExternalStore(subscribeDone, readDone, () => EMPTY);
  const mark = useCallback((slug: string) => {
    const current = readDone();
    if (!current.includes(slug)) writeDone([...current, slug]);
  }, []);
  const clear = useCallback(() => writeDone([]), []);
  return { done, mark, clear };
}
