"use client";
import { useMemo, type ComponentType } from "react";
import * as THREE from "three";
import { ALGORITHMS_PIER, ALGORITHMS_PLATES, BOWL, DISTRICTS, PLACEMENTS, type Placement } from "../layout";
import { circle, Kit, Model, useDisposal, type V3 } from "./kit";
import { Placed, tree, type LandmarkProps } from "./landmark";
import { LastMile, Mazera, ParkScan, PathAble, Penalty } from "./algorithms-landmarks";
import { Aeris, Burnout, Maintenance, Resume, RobotDog, Sigsmith, Swarmmind } from "./intelligence-landmarks";
import type { Palette } from "./palette";
import { rect, terrace } from "./systems";

/*
 * The Algorithms and Intelligence districts as study models: their island
 * silhouettes are the intended ones (a graph of square nodes; a ring campus),
 * and each landmark is a white-card massing of the form it will take. They are
 * placeholders for this review, so the whole world can be judged while one
 * district is finished in detail.
 */
const local = (p: Placement, d: "algorithms" | "intelligence"): V3 => {
  const c = DISTRICTS[d].centre;
  return [p.base[0] - c[0], p.base[1] - c[1], p.base[2] - c[2]];
};

/** A slender deck between two points (a graph edge). */
function edge(k: Kit, m: THREE.Material, a: V3, b: V3, width = 0.34) {
  const dx = b[0] - a[0];
  const dz = b[2] - a[2];
  const run = Math.hypot(dx, dz);
  const yaw = Math.atan2(dz, dx);
  const pitch = Math.atan2(b[1] - a[1], run);
  k.box(m, [Math.hypot(run, b[1] - a[1]), 0.06, width], [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 0.03, (a[2] + b[2]) / 2], {
    ry: -yaw,
    rz: pitch,
  });
}

/** A beam from the edge of one plate to the edge of another: a graph edge, kept clear of the landmarks. */
function link(k: Kit, m: THREE.Material, a: V3, ah: number, b: V3, bh: number) {
  const dx = b[0] - a[0];
  const dz = b[2] - a[2];
  const run = Math.hypot(dx, dz);
  const ux = dx / run;
  const uz = dz / run;
  const out = (h: number) => h / Math.max(Math.abs(ux), Math.abs(uz)) - 0.04;
  const s0 = out(ah);
  const s1 = run - out(bh);
  edge(k, m, [a[0] + ux * s0, a[1] + 0.01, a[2] + uz * s0], [a[0] + ux * s1, b[1] + 0.01, a[2] + uz * s1]);
}

/*
 * Algorithms is a graph: five separate plates at different heights, one per
 * project, joined by slender beams (the edges), with a small landing pier where
 * the Studio's bridge arrives. The plates float; nothing joins them but the
 * beams.
 */
function buildAlgorithms(p: Palette) {
  const k = new Kit(DISTRICTS.algorithms.centre);
  const g = { top: p.algTop, wall: p.algWall };
  const slugs = Object.keys(ALGORITHMS_PLATES);
  const nodes = Object.fromEntries(slugs.map((s) => [s, local(PLACEMENTS[s], "algorithms")]));
  const pier: V3 = [ALGORITHMS_PIER.x, 0, ALGORITHMS_PIER.z];
  // Edges first, so the plates sit on top of their ends.
  const pairs: [string, string][] = [
    ["mazera-ai-maze-solver", "pathable"],
    ["mazera-ai-maze-solver", "last-mile-daa"],
    ["pathable", "football-penalty-shootout"],
    ["last-mile-daa", "football-penalty-shootout"],
    ["parkscan-swarm", "mazera-ai-maze-solver"],
    ["parkscan-swarm", "football-penalty-shootout"],
  ];
  for (const [a, b] of pairs) link(k, p.card, nodes[a], ALGORITHMS_PLATES[a], nodes[b], ALGORITHMS_PLATES[b]);
  // The pier: a small landing joined to the nearest plate.
  link(k, p.card, pier, ALGORITHMS_PIER.half, nodes["last-mile-daa"], ALGORITHMS_PLATES["last-mile-daa"]);
  terrace(k, rect(pier[0] - ALGORITHMS_PIER.half, pier[2] - ALGORITHMS_PIER.half, pier[0] + ALGORITHMS_PIER.half, pier[2] + ALGORITHMS_PIER.half, 0.2), -0.5, 0, g, p.charcoal);
  k.slab(p.algBand, rect(pier[0] - 0.5, pier[2] - 0.5, pier[0] + 0.5, pier[2] + 0.5, 0.15), -0.95, 0.45);
  for (const s of slugs) {
    const [x, y, z] = nodes[s];
    const h = ALGORITHMS_PLATES[s];
    terrace(k, rect(x - h, z - h, x + h, z + h, 0.25), -0.5, y, g, p.charcoal);
    k.slab(p.algBand, rect(x - h + 0.4, z - h + 0.4, x + h - 0.4, z + h - 0.4, 0.2), -1.0, 0.5);
    k.slab(p.algDeep, rect(x - h + 0.85, z - h + 0.85, x + h - 0.85, z + h - 0.85, 0.15), -1.4, 0.4);
    // A fine grid etched into each plate: the atlas.
    for (let i = -2; i <= 2; i++) {
      k.box(p.algWall, [h * 2 - 0.5, 0.004, 0.014], [x, y + 0.002, z + i * (h / 2.6)]);
      k.box(p.algWall, [0.014, 0.004, h * 2 - 0.5], [x + i * (h / 2.6), y + 0.002, z]);
    }
  }
  for (const [s, dx, dz] of [
    ["mazera-ai-maze-solver", -1.35, 1.35],
    ["pathable", 1.15, -1.15],
    ["football-penalty-shootout", 1.15, 1.15],
  ] as [string, number, number][]) {
    const [x, y, z] = nodes[s];
    tree(k, p, x + dx, y, z + dz, 0.8, p.olive);
  }
  return k.build();
}

/*
 * Intelligence is a bowl: a low rim, the terrace the stations stand on, and a
 * sunken court at the centre, so the district looks inward at its subject.
 */
function buildIntelligence(p: Palette) {
  const k = new Kit(DISTRICTS.intelligence.centre);
  const g = { top: p.intTop, wall: p.intWall };
  const { rim, terrace: step, court } = BOWL;
  // Strata under the whole island, then the court floor, the terrace and the rim over them.
  k.slab(p.intBand, circle(0, 0, rim.outer - 0.55, 64), -1.0, 0.5);
  k.slab(p.intDeep, circle(0, 0, rim.outer - 1.5, 56), -1.4, 0.4);
  terrace(k, circle(0, 0, step.inner + 0.1, 64), -0.5, court.top, { top: p.intCourt, wall: p.intWall }, p.charcoal);
  terrace(k, circle(0, 0, rim.inner + 0.1, 72), -0.5, step.top, { top: p.intStep, wall: p.intWall }, p.charcoal, { holes: [circle(0, 0, step.inner, 64).reverse()] });
  terrace(k, circle(0, 0, rim.outer, 72), -0.5, rim.top, g, p.charcoal, { holes: [circle(0, 0, rim.inner, 72).reverse()] });
  k.torus(p.violet, (rim.inner + rim.outer) / 2, 0.012, [0, rim.top + 0.012, 0], { seg: 96 });
  // The court's test field: lavender disc, a violet ring and two finer ones.
  const cy = court.top + 0.004;
  k.slab(p.lavender, circle(0, 0, 1.9, 56), cy, 0.012);
  k.torus(p.violet, 1.9, 0.012, [0, cy + 0.014, 0], { seg: 72 });
  for (const r of [0.7, 1.3]) k.torus(p.intWall, r, 0.008, [0, cy + 0.016, 0], { seg: 56 });
  k.cyl(p.intTop, 0.45, 0.1, [0, court.top, 0], { seg: 32 });
  // Pavilion pads on the terrace.
  for (const s of ["predictive-maintenance", "quadruped-rl", "aeris", "swarmmind", "sigsmith", "student-burnout-ai", "resume-screener"]) {
    const [x, , z] = local(PLACEMENTS[s], "intelligence");
    const [w, , d] = PLACEMENTS[s].size;
    k.box(p.intPad, [w + 0.2, 0.03, d + 0.2], [x, step.top, z], { r: 0.02 });
  }
  for (const a of [10, 100, 170, 250, 330]) {
    const r = (a * Math.PI) / 180;
    tree(k, p, Math.cos(r) * (rim.inner + 0.45), rim.top, Math.sin(r) * (rim.inner + 0.45), 0.8, a % 20 ? p.sage : p.olive);
  }
  return k.build();
}

/** White-card massing for one landmark, from the kind of thing it is. */
function massing(slug: string, p: Palette) {
  const k = new Kit();
  const m = p.card;
  const a = p.concrete;
  switch (slug) {
    case "mazera-ai-maze-solver":
      k.box(a, [2.0, 0.06, 2.0], [0, 0, 0]);
      for (const [x, z, w, d] of [
        [0, -0.97, 2.0, 0.06],
        [0, 0.97, 2.0, 0.06],
        [-0.97, 0, 0.06, 2.0],
        [0.97, 0, 0.06, 2.0],
        [-0.4, -0.35, 0.06, 1.2],
        [0.3, 0.3, 1.0, 0.06],
        [0.35, -0.55, 0.06, 0.8],
        [-0.55, 0.6, 0.8, 0.06],
      ])
        k.box(m, [w, 0.32, d], [x, 0.06, z]);
      break;
    case "pathable":
      k.box(m, [0.7, 0.75, 0.6], [-0.55, 0, -0.45], { r: 0.03 });
      k.box(m, [0.55, 0.45, 0.8], [0.55, 0, -0.35], { r: 0.03 });
      k.box(m, [0.9, 0.3, 0.5], [0.0, 0, 0.55], { r: 0.03 });
      k.box(a, [0.3, 0.05, 1.2], [-0.15, 0, 0.0], { rx: 0.1 });
      break;
    case "last-mile-daa":
      k.box(m, [1.1, 0.55, 0.8], [-0.35, 0, -0.35], { r: 0.03 });
      k.box(m, [0.55, 0.24, 0.26], [0.55, 0, 0.45], { r: 0.04 });
      for (const [x, z] of [
        [0.2, 0.1],
        [0.35, -0.2],
        [0.6, -0.05],
      ])
        k.box(a, [0.16, 0.14, 0.16], [x, 0, z]);
      break;
    case "football-penalty-shootout":
      k.box(p.moss, [1.5, 0.03, 1.0], [0, 0, 0]);
      k.torus(m, 0.95, 0.12, [0, 0.12, 0], { seg: 40 });
      k.box(m, [0.04, 0.3, 0.5], [0.65, 0.03, 0]);
      break;
    case "parkscan-swarm":
      k.box(a, [1.7, 0.03, 1.7], [0, 0, 0]);
      for (let i = -3; i <= 3; i++) k.box(m, [0.02, 0.004, 0.5], [i * 0.24, 0.03, -0.45]);
      for (const [x, z] of [
        [-0.4, 0.3],
        [0.2, 0.45],
        [0.5, -0.1],
      ])
        k.cyl(m, 0.1, 0.12, [x, 0.03, z], { seg: 16 });
      k.cyl(m, 0.03, 0.6, [-0.7, 0.03, 0.7], { seg: 8 });
      break;
    case "predictive-maintenance":
      k.box(a, [1.5, 0.35, 0.8], [0, 0, 0], { r: 0.03 });
      k.cyl(m, 0.28, 0.9, [0, 0.62, 0], { rz: Math.PI / 2, centre: true, seg: 28 });
      k.cyl(m, 0.36, 0.06, [-0.47, 0.62, 0], { rz: Math.PI / 2, centre: true, seg: 28 });
      break;
    case "quadruped-rl":
      k.box(a, [1.6, 0.03, 1.4], [0, 0, 0]);
      k.box(m, [0.6, 0.18, 0.28], [0, 0.32, 0], { r: 0.05 });
      for (const [x, z] of [
        [-0.22, -0.1],
        [0.22, -0.1],
        [-0.22, 0.1],
        [0.22, 0.1],
      ])
        k.box(m, [0.05, 0.3, 0.05], [x, 0.03, z]);
      k.box(m, [0.16, 0.14, 0.18], [0.36, 0.42, 0], { r: 0.04 });
      break;
    case "aeris":
      k.cyl(a, 0.6, 0.04, [0, 0, 0], { seg: 32 });
      k.cyl(m, 0.035, 0.9, [-0.45, 0, -0.4], { seg: 8 });
      k.box(m, [0.36, 0.06, 0.36], [0.1, 0.75, 0.1], { r: 0.02 });
      for (const [x, z] of [
        [-0.08, -0.08],
        [0.28, -0.08],
        [-0.08, 0.28],
        [0.28, 0.28],
      ])
        k.cyl(m, 0.1, 0.012, [x, 0.82, z], { seg: 16 });
      break;
    case "swarmmind":
      k.box(a, [1.6, 0.05, 1.6], [0, 0, 0]);
      for (const s of [-1, 1]) {
        k.box(m, [1.6, 0.12, 0.04], [0, 0.05, s * 0.78]);
        k.box(m, [0.04, 0.12, 1.6], [s * 0.78, 0.05, 0]);
      }
      for (const [x, z] of [
        [-0.4, -0.3],
        [0.1, 0.35],
        [0.45, -0.2],
        [-0.15, 0.1],
      ])
        k.sphere(m, 0.07, [x, 0.12, z], { seg: 10 });
      break;
    case "sigsmith":
    case "student-burnout-ai":
      k.box(p.card, [1.5, 0.012, 1.2], [0, 0, 0]);
      k.box(p.blueprint, [0.7, 0.55, 0.5], [-0.2, 0.012, -0.1]);
      k.box(p.blueprint, [0.4, 0.35, 0.4], [0.45, 0.012, 0.2]);
      break;
    case "resume-screener":
      k.box(m, [1.0, 0.45, 0.6], [-0.2, 0, -0.1], { r: 0.03 });
      k.box(m, [0.08, 0.6, 0.08], [0.55, 0, -0.25]);
      k.box(m, [0.08, 0.6, 0.08], [0.55, 0, 0.25]);
      k.box(m, [0.08, 0.06, 0.58], [0.55, 0.6, 0]);
      break;
  }
  return k.build();
}

/** Landmarks modelled in detail; the rest are still white-card massings. */
const DETAILED: Record<string, ComponentType<LandmarkProps>> = {
  "mazera-ai-maze-solver": Mazera,
  pathable: PathAble,
  "last-mile-daa": LastMile,
  "parkscan-swarm": ParkScan,
  "football-penalty-shootout": Penalty,
  "predictive-maintenance": Maintenance,
  "quadruped-rl": RobotDog,
  swarmmind: Swarmmind,
  aeris: Aeris,
  "resume-screener": Resume,
  "student-burnout-ai": Burnout,
  sigsmith: Sigsmith,
};

function Massing({ slug, palette }: { slug: string; palette: Palette }) {
  const model = useMemo(() => massing(slug, palette), [slug, palette]);
  useDisposal(model);
  return <Model model={model} />;
}

export function StudyDistrict({
  id,
  palette,
  hot,
  selected,
  matching,
  reduced,
}: {
  id: "algorithms" | "intelligence";
  palette: Palette;
  hot: string | null;
  selected: string | null;
  matching: Set<string>;
  reduced: boolean;
}) {
  const ground = useMemo(() => (id === "algorithms" ? buildAlgorithms(palette) : buildIntelligence(palette)), [id, palette]);
  useDisposal(ground);
  const slugs = Object.values(PLACEMENTS)
    .filter((p) => p.district === id)
    .map((p) => p.slug);
  return (
    <group>
      <Model model={ground} />
      {slugs.map((slug) => {
        const active = hot === slug || selected === slug;
        const Landmark = DETAILED[slug];
        return (
          <Placed key={slug} slug={slug} active={active} reduced={reduced}>
            {Landmark ? (
              <Landmark palette={palette} active={active} dim={!matching.has(slug)} reduced={reduced} />
            ) : (
              <Massing slug={slug} palette={palette} />
            )}
          </Placed>
        );
      })}
    </group>
  );
}
