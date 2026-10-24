"use client";
import { gsap } from "gsap";
import { flushSync } from "react-dom";

/**
 * World Shift: the transition between Professional and Creative mode.
 *
 * The browser's View Transitions API keeps a snapshot of the old world while
 * the new one renders underneath, so nothing reloads and the route and page
 * state stay as they are. On top of that there are two ways to animate:
 *
 * Portal ride (when the 3D portal layer is loaded). Professional is a wall
 * with a portal in it at the mode switch; Creative lies beyond it. One GSAP
 * timeline moves a virtual camera: the portal forms, then the camera dives
 * straight into it and on down a tunnel of rings. The same camera numbers drive the 3D
 * rings (components/portal) and the CSS that moves the two page snapshots, so
 * the opening in the page and the rings around it stay locked together.
 * Creative to Professional plays the same path backwards: the camera pulls back
 * out and the Creative world shrinks into the portal. Elements that exist in
 * both worlds (the header, and project cards on screen) morph from their old
 * place to their new one while this happens.
 *
 * Ring reveal (fallback, when the 3D layer is not ready or has no WebGL). A
 * circle reveals the new world from the switch with a cobalt/orange edge.
 *
 * A second click while a shift runs finishes the first one immediately and
 * starts again. Without View Transitions, or with reduced motion, the mode
 * simply changes.
 */
type Origin = { x: number; y: number };
type Transition = { ready: Promise<void>; finished: Promise<void>; skipTransition: () => void };

let active: Transition | null = null;
let timeline: gsap.core.Timeline | null = null;
let lastShift = { mode: "", at: -Infinity, portal: false };

export const SHIFT_MS = 760;
/** Length of the portal ride, in seconds. */
const RIDE = 0.92;
/** Camera distance from the wall at rest, and where the ride ends. */
export const REST_Z = 10;
export const END_Z = -9;
/** Radius of the formed portal in pixels, seen from rest: smaller on phones. */
const portalRadius = () => Math.min(118, Math.max(70, innerWidth * 0.22));

// Lets browser checks slow the timeline down in development only.
if (typeof window !== "undefined" && process.env.NODE_ENV === "development")
  (window as Window & { __worldShiftGsap?: typeof gsap }).__worldShiftGsap = gsap;

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
/** Ask the portal layer to load, e.g. when the pointer nears the switch. */
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
/** Extra delay for arrival animations, so they play as the portal opens. */
export const arrivalDelay = () => (lastShift.portal ? 420 : 0);

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

const VARS = [
  "--ws-x", "--ws-y", "--ws-r", "--ws-w", "--ws-old", "--ws-ms",
  "--ws-cr", "--ws-cx", "--ws-cy", "--ws-in-t", "--ws-out-t",
];
function clear(root: HTMLElement) {
  delete root.dataset.shift;
  delete root.dataset.portal;
  for (const v of VARS) root.style.removeProperty(v);
  if (!root.getAttribute("style")) root.removeAttribute("style");
  for (const el of document.querySelectorAll<HTMLElement>("[data-ws-card]")) {
    el.style.removeProperty("view-transition-name");
    el.style.removeProperty("view-transition-class");
    if (!el.getAttribute("style")) el.removeAttribute("style");
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

/** Project cards on screen get a shared name so they morph between layouts. */
function nameCards(slugs?: Set<string>) {
  const named = new Set<string>();
  for (const el of document.querySelectorAll<HTMLElement>("[data-ws-card]")) {
    const slug = el.dataset.wsCard!;
    const box = el.getBoundingClientRect();
    const onScreen = box.bottom > 0 && box.top < innerHeight && box.width > 0;
    if (!onScreen || named.has(slug) || (slugs && !slugs.has(slug))) continue;
    el.style.setProperty("view-transition-name", `ws-card-${slug}`);
    el.style.setProperty("view-transition-class", "ws-morph");
    named.add(slug);
  }
  return named;
}

/** Keeps the visitor at the same section when the page changes beneath them. */
const SECTIONS = ["contact", "about", "skills", "projects"];
function sectionInView() {
  if (scrollY < 200) return null;
  return SECTIONS.find((id) => {
    const top = document.getElementById(id)?.getBoundingClientRect().top;
    return top !== undefined && top < innerHeight * 0.4;
  }) ?? null;
}

export function worldShift(next: string, apply: () => void, origin?: Origin) {
  const root = document.documentElement;
  const start = (document as Document & {
    startViewTransition?: (update: () => void) => Transition;
  }).startViewTransition?.bind(document);

  timeline?.kill();
  timeline = null;
  active?.skipTransition();
  portal.running = false;
  clear(root);

  if (reduced() || !start) {
    lastShift = { mode: next, at: performance.now(), portal: false };
    if (!reduced()) {
      // No View Transitions: a short colour cross-fade instead (modes.css).
      root.classList.add("mode-switching");
      window.setTimeout(() => root.classList.remove("mode-switching"), 350);
    }
    apply();
    return;
  }

  const x = origin?.x ?? innerWidth - 80;
  const y = origin?.y ?? 32;
  const usePortal = portalReady;
  const section = sectionInView();
  let cards: Set<string> | undefined;
  const update = () => {
    lastShift = { mode: next, at: performance.now(), portal: usePortal };
    flushSync(apply);
    if (section) document.getElementById(section)?.scrollIntoView({ block: "start" });
    if (usePortal) nameCards(cards);
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

  const transition = start(update);
  active = transition;
  transition.ready
    .then(() => {
      if (active !== transition) return;
      timeline = usePortal ? rideTimeline(root, next === "creative") : ringTimeline(root, x, y);
    })
    .catch(() => {});
  transition.finished.finally(() => {
    if (active !== transition) return;
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
