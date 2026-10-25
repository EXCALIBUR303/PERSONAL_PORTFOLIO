/**
 * The studio world's camera as plain numbers. One rig moves it (rig.ts); the
 * WebGL scene copies it into a three.js camera every frame, and the HTML
 * station buttons are placed with the same projection, so the two always
 * agree. Nothing here imports three.js: the buttons, labels and keyboard model
 * work before the 3D code has loaded, and without it.
 */
export type Vec3 = [number, number, number];

export type Pose = {
  /** The point the camera looks at. */
  target: Vec3;
  /** Distance from the target. */
  dist: number;
  /** Turn around the vertical axis in radians; 0 looks north from the south. */
  az: number;
  /** Angle above the ground in radians. */
  el: number;
  /** Vertical field of view in degrees. */
  fov: number;
};

export const deg = (d: number) => (d * Math.PI) / 180;

export function eye(p: Pose): Vec3 {
  const c = Math.cos(p.el);
  return [
    p.target[0] + p.dist * c * Math.sin(p.az),
    p.target[1] + p.dist * Math.sin(p.el),
    p.target[2] + p.dist * c * Math.cos(p.az),
  ];
}

export const copyPose = (p: Pose): Pose => ({ ...p, target: [...p.target] as Vec3 });

/** A point on screen, in CSS pixels of the stage, and how far in front of the camera it is. */
export type ScreenPoint = { x: number; y: number; depth: number; visible: boolean };

/**
 * A perspective projection with the camera's up axis fixed to world up, the
 * same as three.js `camera.lookAt`. Build one per frame and project many points.
 */
export class Projector {
  width = 1;
  height = 1;
  private ex = 0;
  private ey = 0;
  private ez = 0;
  private r = [1, 0, 0];
  private u = [0, 1, 0];
  private f = [0, 0, -1];
  private sx = 1;
  private sy = 1;

  set(pose: Pose, width: number, height: number) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    const [ex, ey, ez] = eye(pose);
    this.ex = ex;
    this.ey = ey;
    this.ez = ez;
    let fx = pose.target[0] - ex;
    let fy = pose.target[1] - ey;
    let fz = pose.target[2] - ez;
    const fl = Math.hypot(fx, fy, fz) || 1;
    fx /= fl;
    fy /= fl;
    fz /= fl;
    // right = forward x up(0,1,0)
    let rx = -fz;
    let rz = fx;
    const rl = Math.hypot(rx, rz) || 1;
    rx /= rl;
    rz /= rl;
    // up = right x forward
    const ux = -rz * fy;
    const uy = rz * fx - rx * fz;
    const uz = rx * fy;
    this.f = [fx, fy, fz];
    this.r = [rx, 0, rz];
    this.u = [ux, uy, uz];
    const t = Math.tan(deg(pose.fov) / 2);
    this.sy = 1 / t;
    this.sx = 1 / (t * (this.width / this.height));
    return this;
  }

  project(x: number, y: number, z: number, out?: ScreenPoint): ScreenPoint {
    const dx = x - this.ex;
    const dy = y - this.ey;
    const dz = z - this.ez;
    const depth = dx * this.f[0] + dy * this.f[1] + dz * this.f[2];
    const vx = dx * this.r[0] + dy * this.r[1] + dz * this.r[2];
    const vy = dx * this.u[0] + dy * this.u[1] + dz * this.u[2];
    const d = Math.max(depth, 1e-4);
    const nx = (vx * this.sx) / d;
    const ny = (vy * this.sy) / d;
    const p = out ?? { x: 0, y: 0, depth: 0, visible: false };
    p.x = ((nx + 1) / 2) * this.width;
    p.y = ((1 - ny) / 2) * this.height;
    p.depth = depth;
    p.visible = depth > 0.1 && nx > -1.15 && nx < 1.15 && ny > -1.15 && ny < 1.15;
    return p;
  }

  /** Screen rectangle around a world box given by its min and max corners. */
  box(min: Vec3, max: Vec3) {
    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;
    const p: ScreenPoint = { x: 0, y: 0, depth: 0, visible: false };
    for (let i = 0; i < 8; i++) {
      this.project(i & 1 ? max[0] : min[0], i & 2 ? max[1] : min[1], i & 4 ? max[2] : min[2], p);
      left = Math.min(left, p.x);
      right = Math.max(right, p.x);
      top = Math.min(top, p.y);
      bottom = Math.max(bottom, p.y);
    }
    return { left, top, right, bottom };
  }
}

/**
 * Critically damped smoothing that keeps its velocity when the goal changes
 * mid-flight (the approximation Unity's SmoothDamp uses). Stable for any frame
 * time, so a slow frame never overshoots.
 */
export function smoothDamp(current: number, goal: number, velocity: { v: number }, smoothTime: number, dt: number) {
  const omega = 2 / Math.max(1e-4, smoothTime);
  const x = omega * dt;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const change = current - goal;
  const temp = (velocity.v + omega * change) * dt;
  velocity.v = (velocity.v - omega * temp) * exp;
  return goal + (change + temp) * exp;
}

/** The shortest signed turn from one angle to another. */
export const angleDelta = (from: number, to: number) => Math.atan2(Math.sin(to - from), Math.cos(to - from));

export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeInCubic = (t: number) => t * t * t;
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
