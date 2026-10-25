"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { deg } from "../camera";
import { DISTRICTS, DISTRICT_ORDER, STUDIO } from "../layout";
import { stations } from "../../studio/stations";
import { circle, Kit, Model, useDisposal, type V3 } from "./kit";
import { useOwn } from "./landmark";
import { span, useLevel, usePlay } from "./motion";
import type { Palette } from "./palette";

/*
 * The Studio: the archipelago's headquarters on its own round podium, raised
 * above the districts so it reads first. A U-shaped pavilion round a small
 * courtyard: a two-storey back wing with lit workspaces behind glass and an
 * exhibition wall of twenty plaques (one per station, lit in the district's
 * colour once visited in this tab); a low east wing with vertical fins; and on
 * the west a tall prow whose front wall carries the oculus, the brand's spark
 * as the tracery of a round lit window. Each bridge leaves through a gate in
 * its district's colour.
 */
const TURN = deg(10);
const top = STUDIO.top;

/** Angle (from +x towards +z) at which the bridge to a district leaves the podium. */
export function bridgeAngle(id: (typeof DISTRICT_ORDER)[number]) {
  const f = DISTRICTS[id];
  return Math.atan2(f.centre[2] + f.landing[2], f.centre[0] + f.landing[0]);
}

/** A prism: a profile drawn in (a, y), extruded `width` across and centred on it. `along` says which world axis a runs on. */
function prism(profile: [number, number][], width: number, along: "x" | "z"): THREE.BufferGeometry {
  const shape = new THREE.Shape(profile.map(([a, y]) => new THREE.Vector2(a, y)));
  const g = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: false });
  g.translate(0, 0, -width / 2);
  if (along === "z") g.rotateY(-Math.PI / 2);
  return g;
}

function buildPodium(p: Palette) {
  const k = new Kit();
  const R = STUDIO.radius;
  // The podium is built like the districts: a body, a dark cut line and a top skin, over tapering strata.
  k.slab(p.stuWall, circle(0, 0, R, 72), -0.35, top - 0.1 + 0.35);
  k.slab(p.charcoal, circle(0, 0, R + 0.004, 72), top - 0.1, 0.025);
  k.slab(p.stuTop, circle(0, 0, R, 72), top - 0.075, 0.075);
  k.slab(p.plaster, circle(0, 0, R * 0.84, 64), top, 0.025);
  k.torus(p.lime, R * 0.915, 0.034, [0, top + 0.012, 0], { seg: 80 });
  k.cyl(p.stuBand, R * 0.6, 0.7, [0, -1.05, 0], { top: R * 0.9, seg: 56 });
  k.cyl(p.stuDeep, R * 0.34, 0.8, [0, -1.85, 0], { top: R * 0.58, seg: 44 });
  k.cyl(p.stuBand, R * 0.16, 0.7, [0, -2.55, 0], { top: R * 0.33, seg: 32 });
  // Paths from the entrance and to each gate, set into the paving.
  const paths = [deg(80), ...DISTRICT_ORDER.map(bridgeAngle)];
  for (const a of paths) {
    const len = R * 0.6;
    const r = R * 0.44;
    k.box(p.sand, [len, 0.02, 0.62], [Math.cos(a) * (r + len / 2 - 0.4), top + 0.02, Math.sin(a) * (r + len / 2 - 0.4)], {
      ry: -a,
    });
  }
  // Trees and lamps round the plaza, clear of the building and the paths.
  for (const t of [20, 200, 228, 268, 342]) {
    const a = deg(t);
    const x = Math.cos(a) * R * 0.8;
    const z = Math.sin(a) * R * 0.8;
    k.cyl(p.trunk, 0.045, 0.34, [x, top, z], { seg: 8 });
    k.sphere(t % 2 ? p.sage : p.olive, 0.3, [x, top + 0.58, z], { seg: 12, squash: 1.12 });
    k.cyl(p.plaster, 0.2, 0.06, [x, top, z], { seg: 16 });
  }
  for (const t of [64, 96]) {
    const a = deg(t);
    const x = Math.cos(a) * R * 0.76;
    const z = Math.sin(a) * R * 0.76;
    k.cyl(p.charcoal, 0.018, 0.62, [x, top, z], { seg: 8 });
    k.sphere(p.lamp, 0.055, [x, top + 0.66, z], { seg: 10 });
  }
  // A gate where each bridge leaves: two posts and a lintel in the district's colour.
  const accents = { systems: p.coral, algorithms: p.cobalt, intelligence: p.violet };
  for (const id of DISTRICT_ORDER) {
    const a = bridgeAngle(id);
    const r = R * 0.9;
    const cx = Math.cos(a) * r;
    const cz = Math.sin(a) * r;
    const sx = -Math.sin(a);
    const sz = Math.cos(a);
    for (const s of [-1, 1]) k.box(p.charcoal, [0.07, 0.95, 0.07], [cx + sx * s * 0.58, top, cz + sz * s * 0.58]);
    k.box(accents[id], [0.1, 0.09, 1.3], [cx, top + 0.95, cz], { ry: -a });
  }
  return k.build();
}

/** The building, at the podium's centre; it is drawn at STUDIO.scale. */
function buildBuilding(p: Palette, interior: THREE.Material, spark: THREE.Material) {
  const k = new Kit([0, 0, 0], TURN);
  // The courtyard floor and the back wing's plate.
  k.box(p.sand, [1.7, 0.03, 2.1], [0, 0, 0.55], { r: 0.01 });
  k.box(p.card, [3.9, 0.06, 1.4], [0, 0, -0.85]);

  // ---- Back wing: lit workspaces on the ground floor, the exhibition wall above. ----
  k.box(p.card, [3.9, 0.84, 0.25], [0, 0.06, -1.425]);
  for (const s of [-1, 1]) k.box(p.card, [0.2, 0.84, 1.1], [s * 1.85, 0.06, -0.95]);
  k.box(interior, [3.5, 0.78, 0.78], [0, 0.06, -0.89]);
  // Desks and screens, seen through the glass.
  for (const x of [-1.2, -0.45, 0.35, 1.1]) {
    k.box(p.charcoal, [0.5, 0.04, 0.2], [x, 0.3, -0.62]);
    k.box(p.glassDark, [0.3, 0.2, 0.02], [x, 0.34, -0.74]);
  }
  k.box(p.glassClear, [3.5, 0.78, 0.012], [0, 0.06, -0.3]);
  for (let x = -1.75; x <= 1.76; x += 0.35) k.box(p.steel, [0.02, 0.8, 0.026], [x, 0.06, -0.3]);
  k.box(p.steel, [3.54, 0.03, 0.04], [0, 0.84, -0.3]);
  // Upper floor and its exhibition board.
  k.box(p.card, [3.9, 0.8, 1.05], [0, 0.9, -1.025], { r: 0.02 });
  k.box(p.charcoal, [2.6, 0.66, 0.02], [0.5, 0.97, -0.49]);
  k.box(p.lime, [2.6, 0.018, 0.026], [0.5, 1.64, -0.49]);
  // The sloped roof sheet: high to the west where the prow stands, low to the east.
  k.add(p.card, prism([[-1.95, 0], [1.95, 0], [1.95, 0.22], [-1.95, 0.78]], 1.05, "x"), [0, 1.7, -1.025]);
  k.box(p.roof, [4.0, 0.05, 1.2], [0, 2.18, -1.0], { rz: -Math.atan2(0.56, 3.9) });

  // ---- East wing: low, with vertical fins on its outer face. ----
  k.box(p.card, [1.1, 0.9, 1.8], [1.35, 0.06, 0.4], { r: 0.02 });
  k.box(p.glassDark, [0.02, 0.4, 1.5], [0.795, 0.3, 0.4]);
  k.box(p.roof, [1.14, 0.03, 1.84], [1.35, 0.96, 0.4]);
  for (let z = -0.42; z <= 1.2; z += 0.18) k.box(p.card, [0.07, 0.86, 0.045], [1.93, 0.06, z]);
  k.box(p.lime, [0.014, 0.018, 1.84], [1.9, 0.92, 0.4]);

  // ---- The prow: a tall west wing with a sloped roof, and the oculus on its front wall. ----
  k.add(p.card, prism([[-1.55, 0.06], [1.7, 0.06], [1.7, 1.95], [-1.55, 2.6]], 1.1, "z"), [-1.35, 0, 0]);
  k.box(p.roof, [1.16, 0.045, 3.4], [-1.35, 2.25, 0.05], { rx: Math.atan2(0.65, 3.25) });
  k.box(p.glassDark, [0.02, 0.5, 2.0], [-0.795, 0.32, 0.5]);
  k.box(p.glassDark, [0.02, 0.5, 2.0], [-0.795, 1.05, 0.5]);
  for (const z of [-0.9, 1.2]) k.box(p.lime, [0.03, 1.2, 0.03], [-0.795, 0.2, z]);
  // The oculus.
  const oz = 1.71;
  const oy = 1.18;
  k.torus(p.charcoal, 0.47, 0.05, [-1.35, oy, oz], { rx: 0, seg: 48 });
  k.cyl(interior, 0.43, 0.05, [-1.35, oy, oz - 0.005], { rx: Math.PI / 2, centre: true, seg: 40 });
  for (let i = 0; i < 4; i++) k.box(spark, [0.84, 0.065, 0.03], [-1.35, oy - 0.0325, oz + 0.03], { rz: (i * Math.PI) / 4 });
  k.cyl(spark, 0.07, 0.04, [-1.35, oy, oz + 0.03], { rx: Math.PI / 2, centre: true, seg: 16 });

  // ---- Courtyard furniture: a bench and a small tree. ----
  k.box(p.brass, [0.5, 0.05, 0.16], [0.1, 0.16, 1.05]);
  k.box(p.charcoal, [0.46, 0.16, 0.12], [0.1, 0.03, 1.05]);
  k.cyl(p.trunk, 0.04, 0.3, [0.45, 0.03, 0.3], { seg: 8 });
  k.sphere(p.sage, 0.26, [0.45, 0.58, 0.3], { seg: 12, squash: 1.12 });
  return k.build();
}

/* ---------- the exhibition wall: twenty plaques, one per station ---------- */

type Cell = { slug: string; position: V3; district: "systems" | "algorithms" | "intelligence" };
function plaqueCells(): Cell[] {
  const groups = (["systems", "algorithms", "intelligence"] as const).map((id) => stations.filter((s) => s.district === id));
  const cols = groups.map((g) => Math.ceil(g.length / 2));
  const pitch = 0.17;
  const gap = 0.16;
  const total = cols.reduce((a, c) => a + (c - 1) * pitch, 0) + gap * 2;
  let x = 0.5 - total / 2;
  const cells: Cell[] = [];
  groups.forEach((g, gi) => {
    g.forEach((s, i) => {
      const row = i < cols[gi] ? 0 : 1;
      const col = row === 0 ? i : i - cols[gi];
      cells.push({ slug: s.slug, district: s.district, position: [x + col * pitch, 1.24 - row * 0.2, -0.472] });
    });
    x += (cols[gi] - 1) * pitch + gap;
  });
  return cells;
}

const ACCENT = { systems: "#ee8466", algorithms: "#2f4bff", intelligence: "#7a4ee6" } as const;

function Wall({ visited, pulse, reduced }: { visited: string[]; pulse: boolean; reduced: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const invalidate = useThree((s) => s.invalidate);
  const cells = useMemo(() => plaqueCells(), []);
  const geometry = useMemo(() => new THREE.BoxGeometry(0.13, 0.15, 0.014), []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.9 }), []);
  const seen = useMemo(() => new Set(visited), [visited]);
  // On selection the visited plaques brighten once, one after another.
  const run = usePlay(pulse, reduced, 1.5);
  const painted = useRef(0);
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );
  const paint = useMemo(() => {
    const paper = new THREE.Color("#ece6d8");
    const colour = new THREE.Color();
    const white = new THREE.Color("#ffffff");
    return (m: THREE.InstancedMesh, t: number) => {
      let k = 0;
      cells.forEach((c, i) => {
        if (!seen.has(c.slug)) {
          m.setColorAt(i, paper);
          return;
        }
        colour.set(ACCENT[c.district]).lerp(paper, 0.18);
        if (t > 0 && t < 1) colour.lerp(white, Math.sin(Math.PI * span(t, k * 0.08, k * 0.08 + 0.4)) * 0.75);
        k++;
        m.setColorAt(i, colour);
      });
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    };
  }, [cells, seen]);
  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const dummy = new THREE.Object3D();
    cells.forEach((c, i) => {
      dummy.position.set(...c.position);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
    paint(m, 0);
    invalidate();
  }, [cells, paint, invalidate]);
  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    const t = run.current;
    if (t > 0 && t < 1) {
      paint(m, t);
      painted.current = 1;
    } else if (painted.current) {
      paint(m, 0);
      painted.current = 0;
    }
  });
  return (
    // The plaques are positioned in the building's own frame (turned and scaled with it, by the parent group).
    <instancedMesh ref={mesh} args={[geometry, material, cells.length]} castShadow={false} receiveShadow={false} frustumCulled={false} />
  );
}

export function Studio({
  palette,
  active,
  selected,
  reduced,
  visited,
}: {
  palette: Palette;
  active: boolean;
  selected: boolean;
  reduced: boolean;
  visited: string[];
}) {
  // The Studio owns its interior light and sign, so it can brighten on its own.
  const interior = useOwn(palette.interior);
  const spark = useOwn(palette.lime);
  const podium = useMemo(() => buildPodium(palette), [palette]);
  useDisposal(podium);
  const building = useMemo(() => buildBuilding(palette, interior, spark), [palette, interior, spark]);
  useDisposal(building);
  const glow = useLevel(active, reduced, 0.3, 0.7);
  useFrame(() => {
    const g = glow.current;
    interior.setValues({ emissiveIntensity: 0.7 + g * 0.35 });
    spark.setValues({ emissiveIntensity: 0.3 + g * 0.55 });
  });
  return (
    <group>
      <Model model={podium} />
      <group position={[0, top, 0]} scale={STUDIO.scale}>
        <Model model={building} />
        <group rotation={[0, TURN, 0]}>
          <Wall visited={visited} pulse={selected} reduced={reduced} />
        </group>
      </group>
    </group>
  );
}
