import type { District } from "../identity";
import { copyPose, deg, eye, Projector, type Pose, type Vec3 } from "./camera";

/*
 * The studio world's composition, in world units (about a metre of model
 * scale; y is up). The Studio stands at the origin and the three districts sit
 * around it as floating islands: Systems upper left, Algorithms upper right,
 * Intelligence in front, as on the 2D map. Landmarks are modelled to the
 * footprints given here, so the HTML buttons laid over them (and the camera
 * framings) come from the same numbers as the geometry.
 */

/** Overview turn: buildings show a lit left face (south) and a shaded right face (east). */
export const AZ = deg(32);
const R: [number, number] = [Math.cos(AZ), -Math.sin(AZ)];
const F: [number, number] = [-Math.sin(AZ), -Math.cos(AZ)];
/** A world point from overview screen directions: u to the right, v away from the viewer. */
const view = (u: number, v: number, y = 0): Vec3 => [u * R[0] + v * F[0], y, u * R[1] + v * F[1]];

export type DistrictFrame = {
  id: District;
  /** Centre of the island's top, in world units. */
  centre: Vec3;
  /** Half extents of the island in x and z (its radius twice, for a round one). */
  half: [number, number];
  round?: boolean;
  /** Landmarks here are modelled at this scale. */
  scale: number;
  /** Lowest and highest y of what the camera should keep in view, relative to the centre. */
  span: [number, number];
  /** Where the bridge from the Studio lands, relative to the centre. */
  landing: Vec3;
  /** Small turn of the camera when this district is focused, so each gets its own angle. */
  turn: number;
};

export const DISTRICTS: Record<District, DistrictFrame> = {
  systems: {
    id: "systems",
    centre: view(-11.5, 4.2, 0),
    half: [6.4, 5.3],
    scale: 1.2,
    span: [-0.6, 2.4],
    landing: [6.25, 0.45, -0.35],
    turn: deg(-7),
  },
  algorithms: {
    id: "algorithms",
    centre: view(11.5, 4.2, 0.35),
    half: [5.1, 5.85],
    scale: 1,
    span: [-1.0, 1.9],
    landing: [-3.95, 0, 5.0],
    turn: deg(7),
  },
  intelligence: {
    id: "intelligence",
    centre: view(0, -11.2, -0.35),
    half: [5.2, 5.2],
    round: true,
    scale: 1,
    span: [-0.5, 2.0],
    landing: [-2.76, 0, -4.41],
    turn: deg(0),
  },
};
export const DISTRICT_ORDER: District[] = ["systems", "algorithms", "intelligence"];

/** The Studio: a round podium at the origin; its building faces the viewer. */
export const STUDIO = {
  /** Podium top. The Studio stands higher than the districts, so it reads as the anchor. */
  top: 1.05,
  radius: 3.9,
  /** The building is modelled at this scale on the podium. */
  scale: 1.3,
  /** The building's box, for framing and the button laid over it. */
  min: [-2.7, 1.05, -2.1] as Vec3,
  max: [2.7, 4.75, 2.3] as Vec3,
  /** Where its name plate floats: above the prow and its oculus. */
  anchor: [0, 6.3, 0] as Vec3,
};

/** One landmark's footprint: centre of its base, its width, height and depth, and its model scale. */
export type Placement = { slug: string; district: District; base: Vec3; size: Vec3; scale: number };

/** Local footprints, relative to the district centre (x east, z south). */
const local: Record<District, [slug: string, x: number, y: number, z: number, w: number, h: number, d: number][]> = {
  systems: [
    // Upper terrace: the three exhibits.
    ["smart-parking-dbms", -3.75, 0.9, -3.15, 2.5, 1.5, 2.1],
    ["aura", 0.15, 0.9, -3.2, 2.8, 1.2, 2.2],
    ["private-local-ai", 3.95, 0.9, -3.2, 2.2, 1.4, 2.1],
    // Middle terrace, either end of the boulevard.
    ["lifeos", -4.55, 0.45, 0.05, 1.9, 1.05, 1.7],
    ["burnout-backend", 4.15, 0.45, 1.05, 1.7, 1.1, 1.4],
    // Lower terrace: the street.
    ["uco-recovery-station", -3.85, 0, 3.55, 1.9, 1.0, 1.5],
    ["green-mobility", 0.1, 0, 3.6, 2.7, 0.8, 1.5],
    ["rupeerise", 3.95, 0, 3.5, 1.7, 1.0, 1.7],
  ],
  algorithms: [
    ["mazera-ai-maze-solver", -2.55, 0.8, -2.55, 2.2, 0.7, 2.2],
    ["pathable", 2.55, 0.35, -2.55, 2.2, 0.9, 2.2],
    ["last-mile-daa", -2.55, 0.2, 2.55, 2.2, 0.8, 2.2],
    ["football-penalty-shootout", 2.55, 0.6, 2.55, 2.2, 0.7, 2.2],
    ["parkscan-swarm", 0, 0.5, 0, 2.0, 0.5, 2.0],
  ],
  intelligence: [
    ["predictive-maintenance", -2.75, 0.25, -2.0, 1.9, 1.1, 1.7],
    ["quadruped-rl", 2.75, 0.25, -2.0, 1.9, 0.9, 1.7],
    ["aeris", -3.6, 0.25, 0.75, 1.7, 1.2, 1.7],
    ["swarmmind", 3.6, 0.25, 0.75, 1.8, 0.6, 1.8],
    ["sigsmith", -2.2, 0.25, 3.25, 1.6, 0.9, 1.4],
    ["student-burnout-ai", 2.2, 0.25, 3.25, 1.6, 0.9, 1.4],
    ["resume-screener", 0, 0.25, 3.85, 1.7, 0.9, 1.3],
  ],
};

export const PLACEMENTS: Record<string, Placement> = Object.fromEntries(
  (Object.keys(local) as District[]).flatMap((district) =>
    local[district].map(([slug, x, y, z, w, h, d]) => {
      const { centre: c, scale } = DISTRICTS[district];
      return [
        slug,
        { slug, district, base: [c[0] + x, c[1] + y, c[2] + z] as Vec3, size: [w * scale, h * scale, d * scale] as Vec3, scale },
      ];
    }),
  ),
);


/* ---------------- district terrain, shared by the scene and the chart ---------------- */

/** Algorithms is a graph: one plate per project (half-width, local to the island) and a landing pier for the Studio's bridge. */
export const ALGORITHMS_PLATES: Record<string, number> = {
  "mazera-ai-maze-solver": 1.65,
  pathable: 1.4,
  "last-mile-daa": 1.4,
  "football-penalty-shootout": 1.4,
  "parkscan-swarm": 1.2,
};
export const ALGORITHMS_PIER = { x: -3.95, z: 5.0, half: 0.85 };

/** Intelligence is a bowl: a low rim, the terrace the stations stand on, and a sunken court (radii and top heights). */
export const BOWL = {
  rim: { inner: 4.3, outer: 5.2, top: 0.45 },
  terrace: { inner: 2.6, top: 0.25 },
  court: { top: -0.5 },
};

/** Island outlines on the ground, in world units: centre, half extents and corner radius. The chart's contours follow them. */
export const CHART_SHAPES: [cx: number, cz: number, hx: number, hz: number, r: number][] = (() => {
  const shapes: [number, number, number, number, number][] = [[0, 0, STUDIO.radius, STUDIO.radius, STUDIO.radius]];
  const s = DISTRICTS.systems.centre;
  shapes.push([s[0], s[2], 6.1, 5.25, 0.75]);
  const a = DISTRICTS.algorithms.centre;
  for (const [slug, half] of Object.entries(ALGORITHMS_PLATES)) {
    const p = local.algorithms.find((l) => l[0] === slug)!;
    shapes.push([a[0] + p[1], a[2] + p[3], half, half, 0.25]);
  }
  shapes.push([a[0] + ALGORITHMS_PIER.x, a[2] + ALGORITHMS_PIER.z, ALGORITHMS_PIER.half, ALGORITHMS_PIER.half, 0.2]);
  const i = DISTRICTS.intelligence.centre;
  shapes.push([i[0], i[2], BOWL.rim.outer, BOWL.rim.outer, BOWL.rim.outer]);
  return shapes;
})();

export const boxOf = (p: Placement): [Vec3, Vec3] => [
  [p.base[0] - p.size[0] / 2, p.base[1], p.base[2] - p.size[2] / 2],
  [p.base[0] + p.size[0] / 2, p.base[1] + p.size[1], p.base[2] + p.size[2] / 2],
];
/** Where a station's marker floats: a little above the top of its landmark. */
export const anchorOf = (p: Placement): Vec3 => [p.base[0], p.base[1] + p.size[1] + 0.32, p.base[2]];

/** Where each district's name plate sits, and which way it reads from there: beside the island, never on it. */
export const PLATES: Record<District, { at: Vec3; align: "left" | "right" | "below" }> = {
  systems: {
    at: [DISTRICTS.systems.centre[0] - 5.4, -1.8, DISTRICTS.systems.centre[2] + 6.8],
    align: "below",
  },
  algorithms: {
    at: [DISTRICTS.algorithms.centre[0] + 3.6, -0.9, DISTRICTS.algorithms.centre[2] + 5.7],
    align: "below",
  },
  intelligence: {
    at: [DISTRICTS.intelligence.centre[0] - 6.3, -0.6, DISTRICTS.intelligence.centre[2] + 0.6],
    align: "left",
  },
};
export const plateOf = (d: District): Vec3 => PLATES[d].at;

/** The island's outline (eight points round a round one), top and bottom, for framing. */
function districtPoints(d: District, pad = 0): Vec3[] {
  const f = DISTRICTS[d];
  const pts: Vec3[] = [];
  const ring: [number, number][] = f.round
    ? Array.from({ length: 8 }, (_, i) => [Math.cos((i * Math.PI) / 4), Math.sin((i * Math.PI) / 4)])
    : [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ];
  for (const [sx, sz] of ring)
    for (const y of f.span)
      pts.push([f.centre[0] + sx * (f.half[0] + pad), f.centre[1] + y, f.centre[2] + sz * (f.half[1] + pad)]);
  return pts;
}
function boxPoints(min: Vec3, max: Vec3, pad = 0): Vec3[] {
  const pts: Vec3[] = [];
  for (const x of [min[0] - pad, max[0] + pad])
    for (const y of [min[1], max[1]])
      for (const z of [min[2] - pad, max[2] + pad]) pts.push([x, y, z]);
  return pts;
}
const studioPoints = (pad = 0) => boxPoints([-STUDIO.radius, -0.6, -STUDIO.radius], [STUDIO.radius, STUDIO.max[1], STUDIO.radius], pad);

/* ---------------- camera framings ---------------- */

export type Stage = {
  width: number;
  height: number;
  /** Pixels on the right covered by the docked panel. */
  insetRight: number;
  /** Pixels at the bottom covered by the tablet sheet. */
  insetBottom?: number;
};
/** What the visitor is looking at; the camera pose follows from it. */
export type Shot =
  | { kind: "overview" }
  | { kind: "district"; district: District }
  | { kind: "station"; slug: string; within: "district" | "overview" }
  | { kind: "studio" }
  | { kind: "approach"; slug: string };

const FOV = 26;
const proj = new Projector();

function measure(points: Vec3[], pose: Pose, W: number, H: number) {
  proj.set(pose, W, H);
  let l = Infinity;
  let r = -Infinity;
  let t = Infinity;
  let b = -Infinity;
  for (const p of points) {
    const s = proj.project(p[0], p[1], p[2]);
    l = Math.min(l, s.x);
    r = Math.max(r, s.x);
    t = Math.min(t, s.y);
    b = Math.max(b, s.y);
  }
  return { l, r, t, b };
}

/**
 * The closest pose at this turn and height angle that keeps every point inside
 * the stage's free area (with margins), centred in it.
 */
function fit(points: Vec3[], base: Pose, stage: Stage, mx: number, my: number): Pose {
  const pose = copyPose(base);
  const W = stage.width;
  const H = stage.height;
  const left = mx * W;
  const right = W - stage.insetRight - mx * W;
  const top = my * H;
  const bottom = H - (stage.insetBottom ?? 0) - my * H;
  const cx = (left + right) / 2;
  const cy = (top + bottom) / 2;
  for (let pass = 0; pass < 4; pass++) {
    let lo = 2;
    let hi = 600;
    for (let i = 0; i < 28; i++) {
      pose.dist = (lo + hi) / 2;
      const m = measure(points, pose, W, H);
      if (m.r - m.l <= right - left && m.b - m.t <= bottom - top) hi = pose.dist;
      else lo = pose.dist;
    }
    pose.dist = hi;
    const m = measure(points, pose, W, H);
    const wpp = (2 * pose.dist * Math.tan(deg(pose.fov) / 2)) / H;
    const offX = ((m.l + m.r) / 2 - cx) * wpp;
    const offY = (-((m.t + m.b) / 2 - cy) * wpp) / Math.sin(pose.el);
    pose.target[0] += Math.cos(pose.az) * offX - Math.sin(pose.az) * offY;
    pose.target[2] += -Math.sin(pose.az) * offX - Math.cos(pose.az) * offY;
  }
  return pose;
}

const WORLD_POINTS = [...studioPoints(), ...districtPoints("systems"), ...districtPoints("algorithms"), ...districtPoints("intelligence")];
const centreOf = (pts: Vec3[]): Vec3 => {
  const s = pts.reduce((a, p) => [a[0] + p[0], a[1] + p[1], a[2] + p[2]] as Vec3, [0, 0, 0] as Vec3);
  return [s[0] / pts.length, 0.4, s[2] / pts.length];
};


/* ---------------- keeping the subject in view ---------------- */

function rayHitsBox(o: Vec3, d: Vec3, min: Vec3, max: Vec3, tmax: number) {
  let t0 = 0;
  let t1 = tmax;
  for (let i = 0; i < 3; i++) {
    if (Math.abs(d[i]) < 1e-9) {
      if (o[i] < min[i] || o[i] > max[i]) return false;
    } else {
      let a = (min[i] - o[i]) / d[i];
      let b = (max[i] - o[i]) / d[i];
      if (a > b) [a, b] = [b, a];
      t0 = Math.max(t0, a);
      t1 = Math.min(t1, b);
      if (t0 > t1) return false;
    }
  }
  return true;
}

/** The point of a landmark the camera must see: a little above the middle of its body. */
const subjectOf = (p: Placement): Vec3 => [p.base[0], p.base[1] + p.size[1] * 0.6, p.base[2]];

/**
 * The landmark (or the Studio) that stands between this pose's camera and the
 * station's subject, if any. Boxes are shrunk a little so a grazing line past a
 * corner does not count.
 */
export function viewBlockedBy(pose: Pose, slug: string): string | null {
  const subject = PLACEMENTS[slug];
  if (!subject) return null;
  const o = eye(pose);
  const target = subjectOf(subject);
  const d: Vec3 = [target[0] - o[0], target[1] - o[1], target[2] - o[2]];
  const len = Math.hypot(...d);
  const dir: Vec3 = [d[0] / len, d[1] / len, d[2] / len];
  const shrink = (min: Vec3, max: Vec3, k: number): [Vec3, Vec3] => [
    [min[0] + k, min[1], min[2] + k],
    [max[0] - k, max[1] - k * 0.5, max[2] - k],
  ];
  for (const other of Object.values(PLACEMENTS)) {
    if (other.slug === slug) continue;
    const [min, max] = shrink(...boxOf(other), 0.25);
    if (rayHitsBox(o, dir, min, max, len * 0.97)) return other.slug;
  }
  const [smin, smax] = shrink(STUDIO.min, STUDIO.max, 0.5);
  if (rayHitsBox(o, dir, smin, smax, len * 0.97)) return "studio";
  return null;
}

/** The turns tried, in order, when the straight-on framing is blocked: small, then larger, either way, then a steeper look. */
const TURNS = [0, 12, -12, 24, -24, 36, -36].map(deg);

export function poseFor(shot: Shot, stage: Stage): Pose {
  const aspect = stage.width / stage.height;
  const portrait = aspect < 0.95;
  switch (shot.kind) {
    case "overview": {
      if (portrait) {
        // A phone frames the Studio with the near edge of each district round it;
        // the district buttons and the station strips below take the visitor further.
        const hub = [...studioPoints(5.2)];
        const base: Pose = { target: [0, 0.6, 0], dist: 40, az: AZ, el: deg(52), fov: FOV };
        return fit(hub, base, { ...stage, insetRight: 0 }, 0.02, 0.04);
      }
      // Squarer stages look down a little more steeply, so the world uses their height.
      const el = deg(48 + 12 * Math.min(1, Math.max(0, (1.6 - aspect) / 0.6)));
      const base: Pose = { target: centreOf(WORLD_POINTS), dist: 60, az: AZ, el, fov: FOV };
      return fit(WORLD_POINTS, base, { ...stage, insetRight: 0 }, 0.03, 0.045);
    }
    case "district": {
      const f = DISTRICTS[shot.district];
      const pts = districtPoints(shot.district, 0.4);
      const base: Pose = { target: [...f.centre] as Vec3, dist: 30, az: AZ + f.turn, el: deg(44), fov: FOV };
      return fit(pts, base, { ...stage, insetRight: 0 }, 0.035, 0.045);
    }
    case "station": {
      const p = PLACEMENTS[shot.slug];
      if (!p) return poseFor({ kind: "overview" }, stage);
      const f = DISTRICTS[p.district];
      const [min, max] = boxOf(p);
      const pad = shot.within === "district" ? 2.4 : 4.6;
      const base: Pose = {
        target: [p.base[0], p.base[1] + p.size[1] / 2, p.base[2]],
        dist: 20,
        az: AZ + f.turn * (shot.within === "district" ? 1 : 0.5),
        el: deg(shot.within === "district" ? 40 : 44),
        fov: FOV,
      };
      const pts = boxPoints(min, max, pad);
      // Straight on if the subject is in view; otherwise the smallest turn (then a steeper look) that clears it.
      let first: Pose | null = null;
      for (const lift of [0, 4]) {
        for (const turn of TURNS) {
          const pose = fit(pts, { ...base, az: base.az + turn, el: base.el + deg(lift) }, stage, 0.05, 0.08);
          first ??= pose;
          if (!viewBlockedBy(pose, shot.slug)) return pose;
        }
      }
      return first!;
    }
    case "studio": {
      const base: Pose = { target: [0, 1.9, 0], dist: 20, az: AZ, el: deg(31), fov: FOV };
      return fit(studioPoints(1.0), base, stage, 0.05, 0.06);
    }
    case "approach": {
      const p = PLACEMENTS[shot.slug];
      const from = poseFor({ kind: "station", slug: shot.slug, within: "district" }, stage);
      if (!p) return from;
      return {
        ...from,
        target: [p.base[0], p.base[1] + p.size[1] * 0.45, p.base[2]],
        dist: from.dist * 0.4,
        el: from.el - deg(6),
        fov: FOV + 6,
      };
    }
  }
}
