import { angleDelta, copyPose, smoothDamp, type Pose } from "./camera";

/**
 * The one owner of the studio world's camera. Every move goes through here;
 * nothing else writes the camera. It eases on a critically damped spring, so a
 * new goal mid-flight bends the path instead of restarting it, and it can also
 * run one timed move (entering an exhibit). While the 3D canvas is mounted the
 * canvas steps the rig inside its own frame, so the camera and the HTML labels
 * are updated in the same frame; before that the rig runs its own frames.
 */
type Driver = { request: () => void };
type Listener = (pose: Pose) => void;
type Tween = {
  from: Pose;
  to: Pose;
  start: number;
  duration: number;
  ease: (t: number) => number;
  done?: () => void;
};

const KEYS = ["tx", "ty", "tz", "dist", "az", "el", "fov"] as const;
type Key = (typeof KEYS)[number];

const get = (p: Pose, k: Key) =>
  k === "tx" ? p.target[0] : k === "ty" ? p.target[1] : k === "tz" ? p.target[2] : p[k];
function put(p: Pose, k: Key, v: number) {
  if (k === "tx") p.target[0] = v;
  else if (k === "ty") p.target[1] = v;
  else if (k === "tz") p.target[2] = v;
  else p[k] = v;
}
/** Settled once every part is this close to its goal (world units, radians, degrees). */
const EPS: Record<Key, number> = { tx: 0.002, ty: 0.002, tz: 0.002, dist: 0.004, az: 0.0004, el: 0.0004, fov: 0.01 };

export class Rig {
  pose: Pose;
  private goal: Pose;
  private vel = Object.fromEntries(KEYS.map((k) => [k, { v: 0 }])) as Record<Key, { v: number }>;
  private tween: Tween | null = null;
  private last = 0;
  private active = false;
  private raf = 0;
  private driver: Driver | null = null;
  private listeners = new Set<Listener>();
  /** Seconds the spring takes to cover most of a move. */
  smoothTime = 0.42;

  constructor(initial: Pose) {
    this.pose = copyPose(initial);
    this.goal = copyPose(initial);
  }

  get moving() {
    return this.active;
  }

  /** Jump to a pose with no motion (first frame, reduced motion, a resized stage). */
  snap(pose: Pose) {
    this.tween = null;
    this.pose = copyPose(pose);
    this.goal = copyPose(pose);
    KEYS.forEach((k) => (this.vel[k].v = 0));
    this.emit();
    this.driver?.request();
  }

  /** Ease towards a pose, carrying on from the current velocity. */
  glide(pose: Pose, smoothTime = 0.42) {
    if (this.tween) {
      // A timed move was running; continue from wherever it reached.
      this.tween = null;
    }
    this.smoothTime = smoothTime;
    this.goal = copyPose(pose);
    this.wake();
  }

  /** A timed move with its own easing. `done` runs once it arrives (not if interrupted). */
  fly(pose: Pose, duration: number, ease: (t: number) => number, done?: () => void) {
    KEYS.forEach((k) => (this.vel[k].v = 0));
    this.goal = copyPose(pose);
    this.tween = { from: copyPose(this.pose), to: copyPose(pose), start: performance.now(), duration, ease, done };
    this.wake();
  }

  /** Advance to `now` (ms). Returns true while still moving. */
  step(now: number): boolean {
    const dt = Math.min(0.05, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    if (!this.active) return false;
    const tw = this.tween;
    if (tw) {
      const t = Math.min(1, Math.max(0, (now - tw.start) / tw.duration));
      const k = tw.ease(t);
      for (const key of KEYS) {
        const a = get(tw.from, key);
        const b = get(tw.to, key);
        put(this.pose, key, key === "az" ? a + angleDelta(a, b) * k : a + (b - a) * k);
      }
      this.emit();
      if (t >= 1) {
        this.tween = null;
        this.active = false;
        tw.done?.();
        return false;
      }
      return true;
    }
    let settled = true;
    for (const key of KEYS) {
      const current = get(this.pose, key);
      let goal = get(this.goal, key);
      if (key === "az") goal = current + angleDelta(current, goal);
      const next = smoothDamp(current, goal, this.vel[key], this.smoothTime, dt);
      put(this.pose, key, next);
      if (Math.abs(next - goal) > EPS[key] || Math.abs(this.vel[key].v) > EPS[key] * 4) settled = false;
    }
    if (settled) {
      this.pose = copyPose(this.goal);
      KEYS.forEach((k) => (this.vel[k].v = 0));
      this.active = false;
    }
    this.emit();
    return !settled;
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** The 3D canvas takes over stepping while it is mounted. */
  attach(driver: Driver) {
    this.driver = driver;
    cancelAnimationFrame(this.raf);
    driver.request();
  }
  detach(driver: Driver) {
    if (this.driver !== driver) return;
    this.driver = null;
    if (this.active) this.loop();
  }

  private wake() {
    if (!this.active) {
      this.active = true;
      this.last = performance.now();
    }
    if (this.driver) this.driver.request();
    else this.loop();
  }

  private loop() {
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(() => {
      if (this.driver) return;
      if (this.step(performance.now())) this.loop();
    });
  }

  private emit() {
    this.listeners.forEach((l) => l(this.pose));
  }
}
