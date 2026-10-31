"use client";
import { gsap } from "gsap";
import { flushSync } from "react-dom";
import {
  clearMorphTimings,
  clearScannerVars,
  cueTimeline,
  gridOrigin,
  paintScanner,
  resetCuts,
  scannerMs,
  scannerTimeline,
  writeMorphTimings,
} from "./transition/scanner";
import { findAnchor, measureLayout } from "./transition/layout";
import { clearRegions, nameRegions, planRegions } from "./transition/regions";
import { QUALITY, RunProbe, chooseTier, countFor, recordRun } from "./transition/quality";
import {
  dropStarted,
  emitProgress,
  emitTransition,
  flushStarted,
  layerReady,
  requestedStyle,
  transition,
  type Direction,
} from "./transition/state";

/**
 * World Shift: the transition between Professional and Creative mode.
 *
 * The browser's View Transitions API keeps a snapshot of the old page while
 * the new one renders underneath, so nothing reloads and the route and page
 * state stay as they are. Three ways to animate it:
 *
 * Precision Scanner (default). A short cue acknowledges the click before the
 * snapshot is taken; then one GSAP timeline plays the scanner. Going to
 * Creative an aperture opens from the centre into two scanners moving outward,
 * the Creative page shows inside the widening slit and grid particles break
 * loose into colourful forms. Coming back two scanners close in from the edges,
 * the Professional page shows outside the closing slit and the particles are
 * pulled into the page grid. See lib/transition for the shared state.
 *
 * Portal ride (`?transition=portal`, the earlier version). A 3D portal at the
 * switch that the camera dives through.
 *
 * Ring reveal (fallback). A circle reveals the new page from the switch.
 *
 * A second click while a shift runs ends the first one at once and starts
 * again. Without View Transitions, or with reduced motion, the mode simply
 * changes.
 *
 * Lifecycle of a scanner run, with the state that marks each step:
 *   start    `transition.running`, `data-scanner` on <html>, cue tween playing
 *   capture  startViewTransition: old snapshot taken, new page rendered
 *   run      `transition.started`, the main GSAP timeline playing
 *   finish   the view transition's `finished` promise: everything is cleared
 *   cancel   a new switch, or a failed transition: everything is cleared at once
 */
type Origin = { x: number; y: number };
type Transition = { ready: Promise<void>; finished: Promise<void>; skipTransition: () => void };

let active: Transition | null = null;
let timeline: gsap.core.Timeline | null = null;
let cue: gsap.core.Tween | null = null;
let lastShift = { mode: "", at: -Infinity, delay: 0, scanner: false };
/** The mode the running shift is heading for (null when none runs). */
let heading: string | null = null;

/**
 * Where a switch would end up: the mode a running shift is heading for, else the mode on the page. The mode is
 * applied only once the old page has been captured, so for the first part of a run the page still shows the mode
 * being left, and a click asking to stay in it must not be taken as "already there".
 */
export const shiftHeading = () => heading ?? document.documentElement.dataset.mode ?? null;

/**
 * A visitor asks for the mode the page still shows while a run toward the other one has not applied it yet. If the
 * run is still in its cue (nothing captured), it is dropped and the page simply stays; returns false when it is past
 * that (the capture's update will apply the other mode), and the caller starts a shift back.
 */
export function stayInMode(): boolean {
  if (!cue) return false;
  cancel(document.documentElement);
  return true;
}
/** Removes the guards (watchdog, hidden-page listener) of the run in progress. */
let guardOff: (() => void) | null = null;
/** A run that has not finished this long after the click is ended by force. */
export const WATCHDOG_MS = 3200;

export const SHIFT_MS = 760;
/** Length of the portal ride, in seconds. */
const RIDE = 0.92;
/** Camera distance from the wall at rest, and where the ride ends. */
export const REST_Z = 10;
export const END_Z = -9;
/** Radius of the formed portal in pixels, seen from rest: smaller on phones. */
const portalRadius = () => Math.min(118, Math.max(70, innerWidth * 0.22));

// Lets browser checks slow the timeline down in development only.
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  (window as Window & { __worldShiftGsap?: typeof gsap }).__worldShiftGsap = gsap;
  (window as Window & { __transition?: typeof transition }).__transition = transition;
}

/**
 * Shared state of the portal ride. GSAP tweens these numbers; the 3D layer
 * reads them every frame and `paint` turns them into CSS variables. Lengths are
 * screen pixels as seen from the camera's resting distance.
 */
export const portal = {
  running: false,
  /** Mode being entered; the rings are styled for it. */
  next: "creative" as "pro" | "creative",
  ox: 0,
  oy: 0,
  ringR: 0,
  camZ: REST_Z,
  /** Scale of the world beyond the portal: it starts deeper and arrives at 1. */
  inK: 0.72,
  /** Seconds since the shift began, for ring spin and sparks. */
  t: 0,
};

if (typeof window !== "undefined" && process.env.NODE_ENV === "development")
  (window as Window & { __portal?: typeof portal }).__portal = portal;

const portalListeners = new Set<() => void>();
const emit = () => portalListeners.forEach((cb) => cb());
export const subscribePortal = (cb: () => void) => {
  portalListeners.add(cb);
  return () => {
    portalListeners.delete(cb);
  };
};

let portalReady = false;
/** Called by the portal layer once its 3D canvas exists (or is lost). */
export const setPortalReady = (ready: boolean) => {
  portalReady = ready;
  if (process.env.NODE_ENV === "development")
    (window as Window & { __portalReady?: boolean }).__portalReady = ready;
};
const warmers = new Set<() => void>();
/** Ask the transition layers to load, e.g. when the pointer nears the switch. */
export const prewarmPortal = () => warmers.forEach((cb) => cb());
export const onPrewarm = (cb: () => void) => {
  warmers.add(cb);
  return () => {
    warmers.delete(cb);
  };
};

/**
 * Where the camera is sideways, in pixels at the wall. It travels on the
 * straight line from its resting point into the portal mouth, so the portal
 * holds still on screen while it grows and the wall only ever expands around
 * it (never uncovering an edge of the page snapshot). Past the mouth it runs
 * down the tunnel's axis.
 */
export function cameraOffset(width = innerWidth, height = innerHeight) {
  const u = Math.min(1, Math.max(0, 1 - portal.camZ / REST_Z));
  return { u, x: (portal.ox - width / 2) * u, y: (portal.oy - height / 2) * u };
}

/** True for a component that mounted as part of a shift into `mode` just now. */
export const arrivedByShift = (mode: string) =>
  lastShift.mode === mode && performance.now() - lastShift.at < 600;
/** True when that shift was the scanner, so arrivals can be timed to it. */
export const arrivedByScanner = () => lastShift.scanner;
/** Extra delay for arrival animations after a portal ride. */
export const arrivalDelay = () => lastShift.delay;

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

const VARS = [
  "--ws-x", "--ws-y", "--ws-r", "--ws-w", "--ws-old", "--ws-ms",
  "--ws-cr", "--ws-cx", "--ws-cy", "--ws-in-t", "--ws-out-t",
  "--sc-l", "--sc-r", "--sc-cl", "--sc-cr", "--sc-top-t", "--sc-top-f", "--sc-bottom-f",
];
function clear(root: HTMLElement) {
  heading = null;
  delete root.dataset.shift;
  delete root.dataset.portal;
  delete root.dataset.scanner;
  for (const v of VARS) root.style.removeProperty(v);
  if (!root.getAttribute("style")) root.removeAttribute("style");
  for (const el of document.querySelectorAll<HTMLElement>("[data-ws-card]")) {
    el.style.removeProperty("view-transition-name");
    el.style.removeProperty("view-transition-class");
    if (!el.getAttribute("style")) el.removeAttribute("style");
  }
  clearRegions();
  clearScannerVars();
  resetCuts();
  if (!root.getAttribute("style")) root.removeAttribute("style");
  clearMorphTimings();
}

/** Resets the shared scanner state and tells the layers the run is over. */
function endScannerRun() {
  const was = transition.running;
  Object.assign(transition, { running: false, started: false, style: "none", cue: 0, progress: 0 });
  dropStarted();
  if (was) {
    emitProgress();
    emitTransition();
  }
}

/**
 * Turns the camera state into the CSS that moves the two page snapshots.
 * The wall (Professional) is a plane at z = 0: from distance z it appears
 * scaled by REST_Z / z about the point the camera faces, which keeps the
 * portal fixed while it grows. The world beyond is scaled by `inK` and slides
 * from under the portal to the centre as the camera closes in, so it arrives
 * exactly in place. The clip circle is given in that snapshot's own pixels.
 */
function paint(root: HTMLElement) {
  const p = portal;
  const cx = innerWidth / 2;
  const cy = innerHeight / 2;
  const cam = cameraOffset();
  const near = p.camZ <= 0.25;
  const k = near ? 40 : REST_Z / p.camZ;
  const r = near ? Math.hypot(innerWidth, innerHeight) : p.ringR * k;
  // Centre of the world beyond, on screen.
  const ix = p.ox + (cx - p.ox) * cam.u;
  const iy = p.oy + (cy - p.oy) * cam.u;
  root.style.setProperty("--ws-out-t", `translate(${(-k * cam.x).toFixed(2)}px, ${(-k * cam.y).toFixed(2)}px) scale(${k.toFixed(4)})`);
  root.style.setProperty("--ws-in-t", `translate(${(ix - cx).toFixed(2)}px, ${(iy - cy).toFixed(2)}px) scale(${p.inK.toFixed(4)})`);
  root.style.setProperty("--ws-cx", `${(cx + (p.ox - ix) / p.inK).toFixed(2)}px`);
  root.style.setProperty("--ws-cy", `${(cy + (p.oy - iy) / p.inK).toFixed(2)}px`);
  root.style.setProperty("--ws-cr", `${(r / p.inK).toFixed(2)}px`);
}

/**
 * Project cards on screen get a shared name so they morph between layouts.
 * Returns each name with its centre x, for timing the morph to the scanner.
 */
function nameCards(slugs?: Set<string>) {
  const named = new Map<string, number>();
  for (const el of document.querySelectorAll<HTMLElement>("[data-ws-card]")) {
    const slug = el.dataset.wsCard!;
    const box = el.getBoundingClientRect();
    const onScreen = box.bottom > 0 && box.top < innerHeight && box.width > 0;
    const name = `ws-card-${slug}`;
    if (!onScreen || named.has(name) || (slugs && !slugs.has(slug))) continue;
    el.style.setProperty("view-transition-name", name);
    el.style.setProperty("view-transition-class", "ws-morph");
    named.set(name, box.left + box.width / 2);
  }
  return named;
}
const slugsOf = (names: Map<string, number>) => new Set([...names.keys()].map((n) => n.replace(/^ws-card-/, "")));

/** Keeps the visitor at the same section when the page changes beneath them. */
const SECTIONS = ["contact", "about", "skills", "projects"];
function sectionInView() {
  if (scrollY < 200) return null;
  return SECTIONS.find((id) => {
    const top = document.getElementById(id)?.getBoundingClientRect().top;
    return top !== undefined && top < innerHeight * 0.4;
  }) ?? null;
}

/** Stops whatever is running and clears its traces, so a new shift starts clean. */
function cancel(root: HTMLElement) {
  guardOff?.();
  guardOff = null;
  cue?.kill();
  cue = null;
  timeline?.kill();
  timeline = null;
  const vt = active;
  active = null;
  vt?.skipTransition();
  portal.running = false;
  endScannerRun();
  clear(root);
}

export function worldShift(next: string, apply: () => void, origin?: Origin) {
  const root = document.documentElement;
  const start = (document as Document & {
    startViewTransition?: (update: () => void) => Transition;
  }).startViewTransition?.bind(document);

  cancel(root);

  if (reduced() || !start) {
    lastShift = { mode: next, at: performance.now(), delay: 0, scanner: false };
    if (!reduced()) {
      // No View Transitions: a short colour cross-fade instead (modes.css).
      root.classList.add("mode-switching");
      window.setTimeout(() => root.classList.remove("mode-switching"), 350);
    }
    apply();
    return;
  }

  heading = next;
  const x = origin?.x ?? innerWidth - 80;
  const y = origin?.y ?? 32;
  const section = sectionInView();
  // A keyboard visitor keeps focus on the switch: the header is replaced, so
  // focus moves to the same option in the new one.
  const keepFocus = !!(document.activeElement as HTMLElement | null)?.closest?.("[data-mode-option]");
  const style = requestedStyle();

  if (style === "scanner" && layerReady("frame")) {
    scannerShift(root, start, next, apply, { x, y }, section, keepFocus);
    return;
  }
  ringOrPortalShift(root, start, next, apply, { x, y }, section, keepFocus, style === "portal" && portalReady);
}

function settleFocus(next: string, keepFocus: boolean) {
  if (!keepFocus) return;
  document.querySelector<HTMLElement>(`[data-mode-option="${next}"]`)?.focus({ preventScroll: true });
}

function scannerShift(
  root: HTMLElement,
  start: (update: () => void) => Transition,
  next: string,
  apply: () => void,
  { x, y }: Origin,
  section: string | null,
  keepFocus: boolean,
) {
  const direction: Direction = next === "creative" ? "to-creative" : "to-pro";
  const tier = chooseTier();
  const quality = QUALITY[tier];
  const oldLayout = measureLayout();
  Object.assign(transition, {
    running: true,
    run: transition.run + 1,
    style: "scanner",
    direction,
    cue: 0,
    progress: 0,
    started: false,
    ox: x,
    oy: y,
    width: innerWidth,
    height: innerHeight,
    oldOrigin: gridOrigin(),
    newOrigin: gridOrigin(),
    oldLayout,
    newLayout: { panels: [], avoid: [] },
    tier,
    regions: [],
    anchor: { x: innerWidth / 2, y: innerHeight / 2 },
  });
  // Going out, selected Professional regions are cut into tiles (phones cut two of them); coming back, the
  // scanner locks on a point of the world (the selected station, the map's centre or the screen's).
  if (direction === "to-creative")
    transition.regions = planRegions(
      Math.min(quality.regions, innerWidth < 640 ? 2 : 5),
      Math.round(countFor(innerWidth) * quality.fragments * 0.85),
      innerWidth,
      innerHeight,
    );
  else transition.anchor = findAnchor(oldLayout);
  const probe = new RunProbe();
  // However the run ends, the visitor must end up in the mode they chose with the page free to use. If it has not
  // finished in WATCHDOG_MS, or the tab is hidden while it runs (frames stop, so it would resume mid-motion later),
  // it is ended at once and the mode is applied if the transition had not got that far.
  let applied = false;
  const finishNow = () => {
    if (!transition.running) return;
    cancel(root);
    if (!applied) {
      applied = true;
      lastShift = { mode: next, at: performance.now(), delay: 0, scanner: false };
      flushSync(apply);
      settleFocus(next, keepFocus);
    }
  };
  const onHidden = () => document.hidden && finishNow();
  // A resize changes the geometry every layer was built for (the viewport, the page's structure), so the run ends
  // rather than draw a scanner that no longer fits. A phone's address bar showing or hiding is not a resize.
  const onResize = () => {
    if (Math.abs(innerWidth - transition.width) > 1 || Math.abs(innerHeight - transition.height) > 140) finishNow();
  };
  const watchdog = window.setTimeout(finishNow, WATCHDOG_MS);
  document.addEventListener("visibilitychange", onHidden);
  window.addEventListener("resize", onResize);
  guardOff = () => {
    window.clearTimeout(watchdog);
    document.removeEventListener("visibilitychange", onHidden);
    window.removeEventListener("resize", onResize);
  };
  root.dataset.shift = next;
  root.dataset.scanner = direction;
  root.style.setProperty("--ws-ms", `${scannerMs(direction)}ms`);
  paintScanner(root);
  emitTransition();
  emitProgress();

  // The cue plays on the live page, before anything is captured, so the click
  // is answered at once even if rendering the other mode takes a moment.
  cue = cueTimeline(() => {
    cue = null;
    const cards = nameCards();
    const morphs = new Map(cards);
    morphs.set("ws-header", transition.width / 2);
    writeMorphTimings(morphs, direction);
    performance.mark("ws:cue-end");
    nameRegions(transition.regions);
    performance.mark("ws:regions-named");
    // The marks cost nothing and show in a performance trace: where the capture frame's time goes (the other mode's
    // render, naming the shared elements, reading the new page's structure).
    const update = () => {
      performance.mark("ws:update");
      applied = true;
      lastShift = { mode: next, at: performance.now(), delay: 0, scanner: true };
      // The switch that was used is part of the header being replaced. Removing the focused element makes the browser
      // bring the old page's style and layout up to date first, a full pass inside the capture frame that is thrown
      // away at once. The old page has been captured by now, so letting go of focus changes nothing on screen, and
      // settleFocus moves it to the same option in the new header.
      const focused = document.activeElement as HTMLElement | null;
      if (focused?.closest?.("[data-mode-option]")) focused.blur();
      flushSync(apply);
      performance.mark("ws:rendered");
      if (section) document.getElementById(section)?.scrollIntoView({ block: "start", behavior: "instant" });
      nameCards(slugsOf(cards));
      transition.newOrigin = gridOrigin();
      performance.mark("ws:named");
      transition.newLayout = measureLayout();
      performance.mark("ws:measured");
      settleFocus(next, keepFocus);
    };
    const vt = start(update);
    active = vt;
    vt.ready
      .then(() => {
        if (active !== vt) return;
        transition.started = true;
        timeline = scannerTimeline(root, { tick: (now) => probe.tick(now), stalled: finishNow });
        flushStarted();
      })
      .catch(() => {});
    vt.finished.finally(() => {
      if (active !== vt) return;
      active = null;
      guardOff?.();
      guardOff = null;
      timeline?.kill();
      timeline = null;
      // A run that played to its end tells the next one how this device coped (lib/transition/quality.ts).
      if (transition.progress >= 0.97) recordRun(probe.finish());
      endScannerRun();
      clear(root);
    });
  });
}

function ringOrPortalShift(
  root: HTMLElement,
  start: (update: () => void) => Transition,
  next: string,
  apply: () => void,
  { x, y }: Origin,
  section: string | null,
  keepFocus: boolean,
  usePortal: boolean,
) {
  let cards: Map<string, number> | undefined;
  const update = () => {
    lastShift = { mode: next, at: performance.now(), delay: usePortal ? 420 : 0, scanner: false };
    flushSync(apply);
    if (section) document.getElementById(section)?.scrollIntoView({ block: "start", behavior: "instant" });
    if (usePortal && cards) nameCards(slugsOf(cards));
    settleFocus(next, keepFocus);
  };

  root.dataset.shift = next;
  if (usePortal) {
    const forward = next === "creative";
    root.dataset.portal = forward ? "in" : "out";
    root.style.setProperty("--ws-ms", `${Math.round(RIDE * 1000)}ms`);
    Object.assign(portal, {
      running: true,
      next,
      ox: x,
      oy: y,
      t: 0,
      ...(forward
        ? { ringR: 0, camZ: REST_Z, inK: 0.72 }
        : { ringR: portalRadius(), camZ: END_Z, inK: 1 }),
    });
    paint(root);
    cards = nameCards();
    emit();
  } else {
    root.style.setProperty("--ws-x", `${x}px`);
    root.style.setProperty("--ws-y", `${y}px`);
    root.style.setProperty("--ws-r", "0px");
    root.style.setProperty("--ws-w", "0px");
    root.style.setProperty("--ws-old", "1");
  }

  const vt = start(update);
  active = vt;
  vt.ready
    .then(() => {
      if (active !== vt) return;
      timeline = usePortal ? rideTimeline(root, next === "creative") : ringTimeline(root, x, y);
    })
    .catch(() => {});
  vt.finished.finally(() => {
    if (active !== vt) return;
    active = null;
    timeline?.kill();
    timeline = null;
    portal.running = false;
    emit();
    clear(root);
  });
}

/**
 * The portal ride. Built forwards (Professional to Creative); the way back
 * plays the same timeline in reverse, so the camera retraces its path.
 */
function rideTimeline(root: HTMLElement, forward: boolean) {
  // Explicit start values, so the reversed ride has a path to retrace.
  const tl = gsap.timeline({ paused: true, onUpdate: () => paint(root) });
  tl.fromTo(portal, { ringR: 0 }, { ringR: portalRadius(), duration: 0.34, ease: "back.out(1.7)" }, 0.04)
    .fromTo(portal, { camZ: REST_Z }, { camZ: END_Z, duration: 0.66, ease: "power2.in" }, 0.26)
    .fromTo(portal, { inK: 0.72 }, { inK: 1, duration: 0.6, ease: "power1.out" }, 0.32)
    .fromTo(portal, { t: 0 }, { t: RIDE, duration: RIDE, ease: "none" }, 0);
  if (forward) tl.play(0);
  else tl.progress(1, true).reverse();
  return tl;
}

/** The fallback: a circle that reveals the new world from the switch. */
function ringTimeline(root: HTMLElement, x: number, y: number) {
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 40;
  return gsap
    .timeline()
    .to(root, { "--ws-r": `${radius}px`, duration: SHIFT_MS / 1000, ease: "power3.inOut" }, 0)
    .fromTo(root, { "--ws-w": "0px" }, { "--ws-w": "30px", duration: 0.22, ease: "power2.out" }, 0)
    .to(root, { "--ws-w": "0px", duration: 0.3, ease: "power2.in" }, 0.44)
    .to(root, { "--ws-old": 0.94, duration: SHIFT_MS / 1000, ease: "power2.inOut" }, 0);
}
