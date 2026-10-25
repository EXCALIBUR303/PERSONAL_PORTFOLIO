"use client";
import { useMemo } from "react";
import * as THREE from "three";
import { DISTRICTS, PLACEMENTS, type Placement } from "../layout";
import { circle, Kit, Model, useDisposal, type V3 } from "./kit";
import { Placed, tree } from "./landmark";
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

function buildAlgorithms(p: Palette) {
  const k = new Kit(DISTRICTS.algorithms.centre);
  const g = { top: p.algTop, wall: p.algWall };
  terrace(k, rect(-5.1, -5.1, 5.1, 5.1, 0.8), -0.5, 0, g, p.charcoal);
  k.slab(p.algBand, rect(-4.5, -4.5, 4.5, 4.5, 0.6), -0.9, 0.4);
  k.slab(p.algDeep, rect(-3.6, -3.6, 3.6, 3.6, 0.5), -1.25, 0.35);
  const slugs = ["mazera-ai-maze-solver", "pathable", "last-mile-daa", "football-penalty-shootout", "parkscan-swarm"];
  const nodes = Object.fromEntries(slugs.map((s) => [s, local(PLACEMENTS[s], "algorithms")]));
  // Graph edges first, so the node plinths sit on top of their ends.
  const pairs: [string, string][] = [
    ["mazera-ai-maze-solver", "pathable"],
    ["mazera-ai-maze-solver", "last-mile-daa"],
    ["pathable", "football-penalty-shootout"],
    ["last-mile-daa", "football-penalty-shootout"],
    ["parkscan-swarm", "mazera-ai-maze-solver"],
    ["parkscan-swarm", "football-penalty-shootout"],
  ];
  for (const [a, b] of pairs) edge(k, p.card, [nodes[a][0], nodes[a][1] + 0.01, nodes[a][2]], [nodes[b][0], nodes[b][1] + 0.01, nodes[b][2]]);
  for (const s of slugs) {
    const [x, y, z] = nodes[s];
    const w = s === "parkscan-swarm" ? 2.0 : 2.4;
    if (y > 0.02) terrace(k, rect(x - w / 2, z - w / 2, x + w / 2, z + w / 2, 0.16), 0, y, g, p.charcoal);
  }
  // A fine grid etched into the base: the atlas.
  for (let i = -4; i <= 4; i++) {
    k.box(p.algWall, [9.4, 0.004, 0.018], [0, 0.002, i]);
    k.box(p.algWall, [0.018, 0.004, 9.4], [i, 0.002, 0]);
  }
  for (const [x, z] of [
    [-4.4, 0.1],
    [4.4, 0.1],
    [0.1, -4.4],
  ])
    tree(k, p, x, 0, z, 0.85, p.olive);
  return k.build();
}

function buildIntelligence(p: Palette) {
  const k = new Kit(DISTRICTS.intelligence.centre);
  const g = { top: p.intTop, wall: p.intWall };
  const R = DISTRICTS.intelligence.half[0];
  terrace(k, circle(0, 0, R, 72), -0.5, 0, g, p.charcoal);
  // The ring promenade, raised a step above the courtyard.
  terrace(k, circle(0, 0, R, 72), 0, 0.25, g, p.charcoal, { holes: [circle(0, 0, R - 0.95, 72).reverse()] });
  k.slab(p.intBand, circle(0, 0, R - 0.55, 64), -0.9, 0.4);
  k.slab(p.intDeep, circle(0, 0, R - 1.5, 56), -1.3, 0.4);
  // The courtyard's test field.
  k.slab(p.lavender, circle(0, -0.3, 1.8, 56), 0, 0.012);
  k.torus(p.violet, 1.8, 0.012, [0, 0.012, -0.3], { seg: 72 });
  for (const r of [0.7, 1.25]) k.torus(p.intWall, r, 0.008, [0, 0.014, -0.3], { seg: 56 });
  // Pavilion pads on the promenade.
  for (const s of ["predictive-maintenance", "quadruped-rl", "aeris", "swarmmind", "sigsmith", "student-burnout-ai", "resume-screener"]) {
    const [x, , z] = local(PLACEMENTS[s], "intelligence");
    const [w, , d] = PLACEMENTS[s].size;
    k.box(p.intTop, [w + 0.2, 0.25, d + 0.2], [x, 0, z], { r: 0.08 });
  }
  for (const a of [10, 100, 170, 250, 330]) {
    const r = (a * Math.PI) / 180;
    tree(k, p, Math.cos(r) * (R - 0.5), 0.25, Math.sin(r) * (R - 0.5), 0.8, a % 20 ? p.sage : p.olive);
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
  reduced,
}: {
  id: "algorithms" | "intelligence";
  palette: Palette;
  hot: string | null;
  selected: string | null;
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
      {slugs.map((slug) => (
        <Placed key={slug} slug={slug} active={hot === slug || selected === slug} reduced={reduced}>
          <Massing slug={slug} palette={palette} />
        </Placed>
      ))}
    </group>
  );
}
