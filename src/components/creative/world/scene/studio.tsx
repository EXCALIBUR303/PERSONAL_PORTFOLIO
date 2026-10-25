"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { deg } from "../camera";
import { AZ, DISTRICTS, DISTRICT_ORDER, STUDIO } from "../layout";
import { circle, Kit, Model, useDisposal, type V3 } from "./kit";
import { useOwn } from "./landmark";
import { markShadows, tick, useLevel } from "./motion";
import type { Palette } from "./palette";

/*
 * The Studio: the archipelago's headquarters on its own round island. A lit
 * glass ground floor, a white upper volume turned against it with the brand's
 * lime stripe, a roof deck with a small pavilion and pergola, and the brand's
 * lime spark as its sign. Bridges leave the podium for each district.
 */
const TURN = deg(10);
const UPPER = deg(14);
const top = STUDIO.top;

/** Rotate a point in the ground plane. */
const rot = (x: number, z: number, a: number): [number, number] => [
  x * Math.cos(a) + z * Math.sin(a),
  -x * Math.sin(a) + z * Math.cos(a),
];

/** Angle (from +x towards +z) at which the bridge to a district leaves the podium. */
export function bridgeAngle(id: (typeof DISTRICT_ORDER)[number]) {
  const f = DISTRICTS[id];
  return Math.atan2(f.centre[2] + f.landing[2], f.centre[0] + f.landing[0]);
}

function buildPodium(p: Palette) {
  const k = new Kit();
  const R = STUDIO.radius;
  k.slab(p.stuWall, circle(0, 0, R, 72), -0.35, 0.865);
  k.slab(p.charcoal, circle(0, 0, R + 0.004, 72), 0.515, 0.025);
  k.slab(p.stuTop, circle(0, 0, R, 72), 0.54, 0.08);
  k.slab(p.plaster, circle(0, 0, R * 0.84, 64), top, 0.025);
  k.torus(p.lime, R * 0.915, 0.034, [0, top + 0.012, 0], { seg: 80 });
  k.cyl(p.stuBand, R * 0.6, 0.7, [0, -1.05, 0], { top: R * 0.9, seg: 56 });
  k.cyl(p.stuDeep, R * 0.26, 0.62, [0, -1.67, 0], { top: R * 0.57, seg: 44 });
  // Paths from the entrance and to each bridge, set into the paving.
  const paths = [deg(80), ...DISTRICT_ORDER.map(bridgeAngle)];
  for (const a of paths) {
    const len = R * 0.6;
    const r = R * 0.44;
    k.box(p.sand, [len, 0.02, 0.62], [Math.cos(a) * (r + len / 2 - 0.4), top + 0.02, Math.sin(a) * (r + len / 2 - 0.4)], {
      ry: -a,
    });
  }
  // Trees, lamps and benches around the plaza, clear of the paths.
  const trees = [20, 110, 132, 200, 228, 268, 342];
  for (const t of trees) {
    const a = deg(t);
    const x = Math.cos(a) * R * 0.8;
    const z = Math.sin(a) * R * 0.8;
    k.cyl(p.trunk, 0.045, 0.34, [x, top, z], { seg: 8 });
    k.sphere(t % 2 ? p.sage : p.olive, 0.3, [x, top + 0.58, z], { seg: 12, squash: 1.12 });
    k.cyl(p.plaster, 0.2, 0.06, [x, top, z], { seg: 16 });
  }
  for (const t of [66, 94]) {
    const a = deg(t);
    const x = Math.cos(a) * R * 0.73;
    const z = Math.sin(a) * R * 0.73;
    k.cyl(p.charcoal, 0.018, 0.62, [x, top, z], { seg: 8 });
    k.sphere(p.lamp, 0.055, [x, top + 0.66, z], { seg: 10 });
  }
  for (const t of [150, 250]) {
    const a = deg(t);
    k.box(p.brass, [0.5, 0.05, 0.16], [Math.cos(a) * R * 0.66, top + 0.16, Math.sin(a) * R * 0.66], { ry: -a + Math.PI / 2 });
    k.box(p.charcoal, [0.46, 0.16, 0.12], [Math.cos(a) * R * 0.66, top, Math.sin(a) * R * 0.66], { ry: -a + Math.PI / 2 });
  }
  // Gyroscope plinth (the rings turn separately).
  const g = deg(122);
  k.cyl(p.concrete, 0.2, 0.26, [Math.cos(g) * GYRO_R, top, Math.sin(g) * GYRO_R], { seg: 20 });
  return k.build();
}
const GYRO_R = STUDIO.radius * 0.66;

/** The building, at the podium's centre; it is drawn at STUDIO.scale. */
function buildBuilding(p: Palette, interior: THREE.Material) {
  const k = new Kit([0, 0, 0], TURN);
  // Ground floor: a glass pavilion with a warm, lit interior.
  k.box(p.card, [3.2, 0.06, 2.2], [0.1, 0, 0.12], { r: 0.02 });
  k.box(interior, [2.9, 0.94, 1.9], [0.1, 0.06, 0.12]);
  k.box(p.glassClear, [2.96, 0.94, 0.02], [0.1, 0.06, 1.085]);
  k.box(p.glassClear, [0.02, 0.94, 1.96], [1.565, 0.06, 0.12]);
  for (let x = -1.33; x <= 1.53; x += 0.358) k.box(p.steel, [0.024, 0.94, 0.03], [x, 0.06, 1.095]);
  for (let z = -0.82; z <= 1.07; z += 0.378) k.box(p.steel, [0.03, 0.94, 0.024], [1.575, 0.06, z]);
  k.box(p.steel, [2.98, 0.035, 0.04], [0.1, 0.97, 1.095]);
  k.box(p.steel, [0.04, 0.035, 1.98], [1.575, 0.97, 0.12]);
  // Entrance: door, lime frame, canopy.
  k.box(p.glassDark, [0.52, 0.76, 0.04], [0.1, 0.06, 1.11]);
  k.box(p.lime, [0.62, 0.05, 0.05], [0.1, 0.82, 1.12]);
  k.box(p.lime, [0.05, 0.76, 0.05], [-0.19, 0.06, 1.12]);
  k.box(p.lime, [0.05, 0.76, 0.05], [0.39, 0.06, 1.12]);
  k.box(p.card, [1.3, 0.045, 0.62], [0.1, 1.0, 1.38], { r: 0.012 });
  k.box(p.plaster, [1.0, 0.04, 0.3], [0.1, -0.03, 1.38]);
  // A slim floor slab between the floors.
  k.box(p.card, [3.32, 0.1, 2.3], [0.08, 1.0, 0.12], { r: 0.025 });
  k.box(p.charcoal, [3.33, 0.016, 2.31], [0.08, 1.0, 0.12]);

  // Upper floor, turned against the ground floor; it cantilevers to the east.
  const up = (x: number, y: number, z: number, size: V3, m: THREE.Material, r = 0) => {
    const [rx, rz] = rot(x, z, UPPER);
    k.box(m, size, [rx, y, rz], { ry: UPPER, r });
  };
  up(0.25, 1.1, 0, [3.5, 0.8, 1.6], p.card, 0.03);
  up(0.25, 1.36, 0, [3.52, 0.27, 1.62], p.glassDark);
  up(0.25, 1.14, 0, [3.52, 0.05, 1.62], p.lime);
  for (let x = -1.42; x <= 1.95; x += 0.28) up(x, 1.33, 0.82, [0.035, 0.33, 0.07], p.card);
  up(0.25, 1.9, 0, [3.62, 0.06, 1.72], p.card, 0.02);
  up(0.25, 1.9, 0, [3.63, 0.014, 1.73], p.charcoal);
  // The observation balcony off the east end.
  up(2.33, 1.5, 0, [0.68, 0.05, 1.3], p.card, 0.01);
  up(2.66, 1.55, 0, [0.02, 0.24, 1.3], p.glassClear);
  for (const z of [-0.64, 0.64]) up(2.33, 1.55, z, [0.66, 0.24, 0.02], p.glassClear);
  up(2.66, 1.78, 0, [0.03, 0.02, 1.32], p.steel);

  // Roof deck: a lit pavilion, a white pergola and a light railing.
  up(-0.85, 1.96, -0.05, [1.12, 0.5, 0.82], interior);
  up(-0.85, 1.96, 0.37, [1.14, 0.5, 0.02], p.glassClear);
  for (let i = 0; i < 4; i++) up(-1.35 + i * 0.33, 1.96, 0.38, [0.025, 0.5, 0.025], p.steel);
  up(-0.85, 2.46, -0.05, [1.28, 0.05, 0.98], p.card, 0.01);
  for (let i = 0; i < 5; i++) up(0.18 + i * 0.27, 2.42, 0.0, [0.045, 0.045, 1.22], p.card);
  for (const [x, z] of [
    [0.18, -0.58],
    [0.18, 0.58],
    [1.26, -0.58],
    [1.26, 0.58],
  ])
    up(x, 1.96, z, [0.03, 0.46, 0.03], p.steel);
  for (let x = -1.45; x <= 1.96; x += 0.31) {
    up(x, 1.96, 0.79, [0.016, 0.2, 0.016], p.steel);
    up(x, 1.96, -0.79, [0.016, 0.2, 0.016], p.steel);
  }
  up(0.25, 2.15, 0.79, [3.45, 0.018, 0.018], p.steel);
  up(0.25, 2.15, -0.79, [3.45, 0.018, 0.018], p.steel);
  up(1.96, 2.15, 0, [0.018, 0.018, 1.6], p.steel);
  // Sign mast.
  up(1.55, 1.96, -0.35, [0.045, 0.74, 0.045], p.steel);
  return k.build();
}

/** The brand's spark: eight lime spokes on the mast, facing the viewer's side. */
function Spark({ material }: { material: THREE.Material }) {
  const [x, z] = rot(1.55, -0.35, UPPER);
  const [wx, wz] = rot(x, z, TURN);
  const spokes = useMemo(() => [0, 45, 90, 135].map((d) => deg(d)), []);
  return (
    <group position={[wx, 3.08, wz]} rotation={[0, AZ, 0]}>
      {spokes.map((a) => (
        <mesh key={a} rotation={[0, 0, a]} material={material} castShadow>
          <boxGeometry args={[0.78, 0.13, 0.07]} />
        </mesh>
      ))}
    </group>
  );
}

function Gyroscope({ material, active, reduced }: { material: THREE.Material; active: boolean; reduced: boolean }) {
  const g = deg(122);
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const spin = useLevel(active, reduced, 0.3, 1.2);
  useFrame((state, delta) => {
    if (reduced || spin.current === 0) return;
    const dt = tick(delta) * spin.current;
    rings.current.forEach((r, i) => {
      if (!r) return;
      r.rotation.y += dt * (1.4 + i * 0.7);
      r.rotation.x += dt * (0.6 - i * 0.25);
    });
    markShadows();
    state.invalidate();
  });
  return (
    <group position={[Math.cos(g) * GYRO_R, top + 0.62, Math.sin(g) * GYRO_R]}>
      {[0.25, 0.19, 0.13].map((r, i) => (
        <mesh key={r} ref={(m) => void (rings.current[i] = m)} rotation={[i * 0.9, i * 0.6, 0]} material={material} castShadow>
          <torusGeometry args={[r, 0.014, 6, 36]} />
        </mesh>
      ))}
    </group>
  );
}

export function Studio({ palette, active, reduced }: { palette: Palette; active: boolean; reduced: boolean }) {
  // The Studio owns its interior light and sign, so it can brighten on its own.
  const interior = useOwn(palette.interior);
  const spark = useOwn(palette.lime);
  const podium = useMemo(() => buildPodium(palette), [palette]);
  useDisposal(podium);
  const building = useMemo(() => buildBuilding(palette, interior), [palette, interior]);
  useDisposal(building);
  const glow = useLevel(active, reduced, 0.3, 0.7);
  useFrame(() => {
    const g = glow.current;
    interior.setValues({ emissiveIntensity: 0.7 + g * 0.6 });
    spark.setValues({ emissiveIntensity: 0.16 + g * 0.55 });
  });
  return (
    <group>
      <Model model={podium} />
      <group position={[0, top, 0]} scale={STUDIO.scale}>
        <Model model={building} />
        <Spark material={spark} />
      </group>
      <Gyroscope material={palette.brass} active={active} reduced={reduced} />
    </group>
  );
}
