"use client";
import { useMemo, type ComponentType } from "react";
import * as THREE from "three";
import { DISTRICTS } from "../layout";
import { Kit, Model, roundRect, useDisposal } from "./kit";
import { car, lamp, Placed, tree, type LandmarkProps } from "./landmark";
import type { Palette } from "./palette";
import { Aura, BlueprintApi, CoinBoard, Garage, Kiosk, Mobility, ServiceNote, Vault, Workstation } from "./systems-landmarks";

/*
 * Systems, "the workshop campus": a terraced island that climbs away from the
 * viewer in three steps, so every landmark stays in sight. The exhibits stand
 * on the top terrace, a boulevard runs along the middle one to the plaza where
 * the Studio's bridge lands, and the street and its shuttle lane run along the
 * front. Retaining walls and the island's sides are built like layers of
 * model board: a body, a dark cut line and a top skin.
 */
export const rect = (x0: number, z0: number, x1: number, z1: number, r: number) =>
  roundRect((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, r);

/** A block of model board from `bottom` to `top`, with a cut line under its top skin. */
export function terrace(
  k: Kit,
  outline: [number, number][],
  bottom: number,
  top: number,
  g: { top: THREE.Material; wall: THREE.Material },
  line: THREE.Material,
  o: { holes?: [number, number][][] } = {},
) {
  k.slab(g.wall, outline, bottom, top - 0.1 - bottom, o);
  k.slab(line, outline, top - 0.1, 0.022, o);
  k.slab(g.top, outline, top - 0.078, 0.078, o);
}

function railing(k: Kit, p: Palette, x0: number, x1: number, y: number, z: number, gaps: number[]) {
  const clear = (x: number) => gaps.every((g) => Math.abs(x - g) > 0.45);
  for (let x = x0; x <= x1 + 1e-6; x += 0.34) if (clear(x)) k.box(p.charcoal, [0.02, 0.2, 0.02], [x, y, z]);
  const cuts = [x0 - 0.01, ...gaps.flatMap((g) => [g - 0.42, g + 0.42]), x1 + 0.01].sort((a, b) => a - b);
  for (let i = 0; i < cuts.length; i += 2) {
    const a = cuts[i];
    const b = cuts[i + 1];
    if (b > a) k.box(p.charcoal, [b - a, 0.018, 0.018], [(a + b) / 2, y + 0.19, z]);
  }
}

function stairs(k: Kit, p: Palette, x: number, y0: number, zFront: number, depth: number) {
  for (let i = 0; i < 4; i++) k.box(p.sysPave, [0.7, (i + 1) * 0.1125, depth], [x, y0, zFront - (i + 0.5) * depth]);
}

function buildGround(p: Palette) {
  const k = new Kit(DISTRICTS.systems.centre);
  const g = { top: p.sysTop, wall: p.sysWall };
  // The body and lower terrace, the middle terrace with its east bastion, the upper terrace.
  terrace(k, rect(-6.1, -5.25, 6.1, 5.25, 0.75), -0.55, 0, g, p.charcoal);
  terrace(k, rect(-6.1, -5.25, 6.1, 1.95, 0.7), 0, 0.45, g, p.charcoal);
  terrace(k, rect(4.9, -1.35, 6.8, 0.6, 0.24), 0, 0.45, g, p.charcoal);
  k.slab(p.sysBand, rect(5.0, -1.25, 6.7, 0.5, 0.2), -0.32, 0.32);
  terrace(k, rect(-5.75, -5.25, 5.6, -1.45, 0.65), 0.45, 0.9, g, p.charcoal);
  // Below: stepped plinths taper away, so the island floats.
  // Strata: three darker bands, each cut off from the one above by a dark line.
  k.slab(p.sysBand, rect(-5.7, -4.9, 5.7, 4.9, 0.65), -0.95, 0.45);
  k.slab(p.charcoal, rect(-5.7, -4.9, 5.7, 4.9, 0.65), -0.5, 0.02);
  k.slab(p.sysDeep, rect(-4.9, -4.1, 4.9, 4.1, 0.55), -1.4, 0.45);
  k.slab(p.charcoal, rect(-4.9, -4.1, 4.9, 4.1, 0.55), -0.95, 0.02);
  k.slab(p.sysBand, rect(-3.6, -3.0, 3.6, 3.0, 0.45), -1.8, 0.4);
  k.slab(p.charcoal, rect(-3.6, -3.0, 3.6, 3.0, 0.45), -1.4, 0.02);

  // Panel seams across the terraces, as on a workshop floor.
  const seam = (x0: number, x1: number, z0: number, z1: number, y: number) => {
    for (let x = Math.ceil(x0); x < x1; x += 1.2) k.box(p.sysWall, [0.016, 0.004, z1 - z0], [x, y, (z0 + z1) / 2]);
    for (let z = Math.ceil(z0); z < z1; z += 1.2) k.box(p.sysWall, [x1 - x0, 0.004, 0.016], [(x0 + x1) / 2, y, z]);
  };
  seam(-5.4, 5.3, -5.0, -1.55, 0.9);
  seam(-5.8, 5.9, -1.35, 1.85, 0.45);
  seam(-5.8, 5.8, 2.05, 4.55, 0);

  // Boulevard, sidewalks and the plaza where the bridge lands.
  k.slab(p.road, rect(-3.5, -0.62, 5.0, 0.22, 0.05), 0.45, 0.012);
  k.slab(p.sysPave, rect(-3.5, -0.94, 5.0, -0.62, 0.04), 0.45, 0.008);
  k.slab(p.sysPave, rect(-3.5, 0.22, 3.1, 0.52, 0.04), 0.45, 0.008);
  for (let x = -3.2; x <= 4.7; x += 0.45) k.box(p.marking, [0.2, 0.004, 0.035], [x, 0.462, -0.2]);
  k.slab(p.sysPave, rect(5.0, -1.3, 6.75, 0.55, 0.22), 0.45, 0.01);
  k.box(p.coral, [0.12, 0.95, 0.12], [5.3, 0.46, -1.05], { r: 0.02 });
  k.box(p.charcoal, [0.14, 0.02, 0.14], [5.3, 1.41, -1.05]);
  k.cyl(p.concrete, 0.16, 0.12, [5.55, 0.46, 0.28], { seg: 18 });
  k.torus(p.brass, 0.14, 0.014, [5.55, 0.74, 0.28], { rx: 0.4, seg: 32 });
  k.torus(p.brass, 0.1, 0.012, [5.55, 0.74, 0.28], { rx: -0.6, ry: 0.8, seg: 28 });

  // The street along the front, with the shuttle lane, and the loop that carries it up the east side to the plaza.
  k.slab(p.road, rect(-5.4, 4.6, 5.85, 5.1, 0.12), 0, 0.012);
  for (const z of [4.64, 5.06]) k.box(p.marking, [10.8, 0.004, 0.022], [0.2, 0.012, z]);
  for (let x = -5.0; x <= 5.2; x += 0.5) k.box(p.marking, [0.22, 0.004, 0.03], [x, 0.012, 4.85]);
  k.slab(p.road, rect(5.45, 2.3, 5.85, 5.1, 0.05), 0, 0.012);
  k.box(p.road, [0.4, 0.02, 1.15], [5.65, 0.215, 2.42], { rx: Math.atan2(0.45, 1.0) });
  k.slab(p.road, rect(5.45, 0.5, 5.85, 1.95, 0.04), 0.45, 0.012);
  for (let z = 2.6; z <= 4.4; z += 0.5) k.box(p.marking, [0.03, 0.004, 0.22], [5.65, 0.012, z]);
  // Service conduit along the upper terrace's front: a trench with cyan data dashes (it never leaves the island).
  k.box(p.charcoal, [8.6, 0.01, 0.1], [0.3, 0.9, -1.72]);
  for (let x = -3.9; x <= 4.4; x += 0.42) k.box(p.cyan, [0.18, 0.006, 0.036], [x, 0.91, -1.72]);

  // Stairs between the terraces, and railings along their edges.
  stairs(k, p, -1.75, 0, 2.85, 0.225);
  stairs(k, p, 2.05, 0, 2.85, 0.225);
  stairs(k, p, -1.85, 0.45, -0.65, 0.2);
  stairs(k, p, 2.1, 0.45, -0.65, 0.2);
  railing(k, p, -5.4, 5.3, 0.9, -1.5, [-1.85, 2.1]);
  railing(k, p, -5.75, 5.75, 0.45, 1.9, [-1.75, 2.05]);

  // Planting, lamps and a couple of parked cars.
  for (const x of [-2.4, 0.7]) tree(k, p, x, 0.45, 0.38, 0.85, x > 0 ? p.olive : p.sage);
  for (const [x, z] of [
    [-5.45, -1.8],
    [5.3, -1.8],
    [6.45, -1.05],
    [6.45, 0.35],
  ])
    tree(k, p, x, z < -1.45 ? 0.9 : 0.45, z, 0.95);
  for (const x of [-4.6, 0, 4.6]) tree(k, p, x, 0.9, -4.78, 0.8, x === 0 ? p.olive : p.sage);
  for (const [x, z] of [
    [-5.6, 2.45],
    [-5.6, 3.7],
  ])
    tree(k, p, x, 0, z, 0.9, z > 3 ? p.olive : p.sage);
  for (const x of [-2.6, -0.6, 1.4, 3.4]) lamp(k, p, x, 0.458, -0.82);
  for (const x of [-3.0, 3.0]) lamp(k, p, x, 0.012, 4.52);
  car(k, p, -1.7, 0.457, -0.42, p.coral, "x");
  car(k, p, 1.9, 0.457, 0.02, p.steel, "x");
  car(k, p, -3.8, 0.012, 4.85, p.card, "x");
  return k.build();
}

const LANDMARKS: [string, ComponentType<LandmarkProps>][] = [
  ["smart-parking-dbms", Garage],
  ["aura", Aura],
  ["private-local-ai", Vault],
  ["lifeos", Workstation],
  ["burnout-backend", BlueprintApi],
  ["uco-recovery-station", Kiosk],
  ["green-mobility", Mobility],
  ["rupeerise", CoinBoard],
];

export function Systems({
  palette,
  hot,
  selected,
  matching,
  reduced,
}: {
  palette: Palette;
  hot: string | null;
  selected: string | null;
  matching: Set<string>;
  reduced: boolean;
}) {
  const ground = useMemo(() => buildGround(palette), [palette]);
  useDisposal(ground);
  return (
    <group>
      <Model model={ground} />
      <ServiceNote palette={palette} active={selected === "private-local-ai" || hot === "private-local-ai"} replay={selected === "private-local-ai"} reduced={reduced} />
      {LANDMARKS.map(([slug, Landmark]) => {
        const active = hot === slug || selected === slug;
        return (
          <Placed key={slug} slug={slug} active={active} reduced={reduced}>
            <Landmark palette={palette} active={active} dim={!matching.has(slug)} reduced={reduced} replay={selected === slug} />
          </Placed>
        );
      })}
    </group>
  );
}
