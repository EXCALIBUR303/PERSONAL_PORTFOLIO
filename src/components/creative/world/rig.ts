import { angleDelta, copyPose, smoothDamp, type Pose } from "./camera";

/**
 * The one owner of the studio world's camera. Every move goes through here;
 * nothing else writes the camera. It eases on a critically damped spring, so a
 * new goal mid-flight bends the path instead of restarting it, and it can also
 * run one timed move (entering an exhibit). While the 3D canvas is mounted the
 * canvas steps the rig inside its own frame, so the camera and the HTML labels
 * are updated in the same frame; before that the rig runs its own frames.
 *
 * `pose` is where the camera is going; `shown` is `pose` plus a small, eased
 * lean towards the pointer (`look`). The canvas and the labels both read
 * `shown`, so pins stay on their landmarks while the world leans.
 */
type Driver = { request: () => void };
type Listener = (pose: Pose) => void;
type Tween = {
  from: Pose;
  to: Pose;
  start: number;
  duration: number;
  ease: (t: number) => number;
  /** Extra distance at the middle of the move, so a long flight lifts over what is between. */
  lift: number;
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

/** The lean, in radians, when the pointer is at the edge of the stage. */
const LEAN_AZ = 0.034;
const LEAN_EL = 0.016;
const LEAN_EPS = 0.0004;

export class Rig {
  pose: Pose;
  /** The pose the camera and labels use: `pose` with the pointer lean added. */
  shown: Pose;
  private lean = { x: 0, y: 0 };
  private leanGoal = { x: 0, y: 0 };
  private leanVel = { x: { v: 0 }, y: { v: 0 } };
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
    this.shown = copyPose(initial);
  }

  get moving() {
    return this.active;
  }

  /** Lean the view towards the pointer: x and y in -1..1 across the stage, (0, 0) to rest. */
  look(x: number, y: number) {
    this.leanGoal.x = Math.max(-1, Math.min(1, x));
    this.leanGoal.y = Math.max(-1, Math.min(1, y));
    this.wake();
  }

  /** Jump to a pose with no motion (first frame, reduced motion, a resized stage). */
  snap(pose: Pose) {
    this.tween = null;
    this.pose = copyPose(pose);
    this.goal = copyPose(pose);
    KEYS.forEach((k) => (this.vel[k].v = 0));
    this.lean = { x: 0, y: 0 };
    this.leanGoal = { x: 0, y: 0 };
    this.leanVel = { x: { v: 0 }, y: { v: 0 } };
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
  fly(pose: Pose, duration: number, ease: (t: number) => number, done?: () => void, lift = 0) {
    KEYS.forEach((k) => (this.vel[k].v = 0));
    this.goal = copyPose(pose);
    this.tween = { from: copyPose(this.pose), to: copyPose(pose), start: performance.now(), duration, ease, lift, done };
    this.wake();
  }

  /** Advance to `now` (ms). Returns true while still moving. */
  step(now: number): boolean {
    const dt = Math.min(0.05, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    if (!this.active) return false;
    const leaning = this.stepLean(dt);
    const tw = this.tween;
    if (tw) {
      const t = Math.min(1, Math.max(0, (now - tw.start) / tw.duration));
      const k = tw.ease(t);
      for (const key of KEYS) {
        const a = get(tw.from, key);
        const b = get(tw.to, key);
        put(this.pose, key, key === "az" ? a + angleDelta(a, b) * k : a + (b - a) * k);
      }
      if (tw.lift) this.pose.dist += tw.lift * Math.sin(Math.PI * t);
      if (t >= 1) {
        this.tween = null;
        this.active = leaning;
      }
      this.emit();
      if (t >= 1) {
        tw.done?.();
        return leaning;
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
      this.active = leaning;
    }
    this.emit();
    return !settled || leaning;
  }

  /** Eases the lean towards its goal; true while it is still moving. */
  private stepLean(dt: number) {
    const { lean, leanGoal, leanVel } = this;
    lean.x = smoothDamp(lean.x, leanGoal.x, leanVel.x, 0.55, dt);
    lean.y = smoothDamp(lean.y, leanGoal.y, leanVel.y, 0.55, dt);
    const moving =
      Math.abs(lean.x - leanGoal.x) > LEAN_EPS * 10 || Math.abs(lean.y - leanGoal.y) > LEAN_EPS * 10 || Math.abs(leanVel.x.v) > LEAN_EPS * 10 || Math.abs(leanVel.y.v) > LEAN_EPS * 10;
    if (!moving) {
      lean.x = leanGoal.x;
      lean.y = leanGoal.y;
      leanVel.x.v = 0;
      leanVel.y.v = 0;
    }
    return moving;
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
    const p = this.pose;
    const o = this.shown;
    o.target[0] = p.target[0];
    o.target[1] = p.target[1];
    o.target[2] = p.target[2];
    o.dist = p.dist;
    o.fov = p.fov;
    o.az = p.az - this.lean.x * LEAN_AZ;
    o.el = p.el + this.lean.y * LEAN_EL;
    this.listeners.forEach((l) => l(o));
  }
}
