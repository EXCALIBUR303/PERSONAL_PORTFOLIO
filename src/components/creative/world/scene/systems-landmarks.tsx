"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Kit, Model, useDisposal, type V3 } from "./kit";
import { briefPad, car, exhibitPad, letterTexture, useOwn, type LandmarkProps } from "./landmark";
import { along, smooth, span, tick, useLevel, usePlay } from "./motion";

/*
 * The Systems district's eight landmarks. Each is modelled on what the project
 * is, at a scale where its silhouette reads from the overview and its details
 * from the district view. Reactions are short, play only for the landmark in
 * focus, and never claim more than the project does.
 */

/* ---------- SmartPark: a multi-level garage ---------- */
const GL = [0.06, 0.5, 0.94, 1.38];
/** In at the street, up the three ramps, along the roof and into a free bay there. */
const GARAGE_PATH: V3[] = [
  [0.745, GL[0], 1.55],
  [0.745, GL[0], 0.82],
  [0.745, GL[1], -0.8],
  [0.745, GL[1], -0.92],
  [0.995, GL[1], -0.92],
  [0.995, GL[1], -0.8],
  [0.995, GL[2], 0.8],
  [0.995, GL[2], 0.92],
  [0.745, GL[2], 0.92],
  [0.745, GL[2], 0.8],
  [0.745, GL[3], -0.8],
  [0.45, GL[3], -0.8],
  [-0.45, GL[3], -0.8],
  [-0.45, GL[3], -0.46],
];

/** The second car follows the first up the ramps, then is handed the next free bay: across the middle lane to the other row. */
const GARAGE_PATH_2: V3[] = [
  ...GARAGE_PATH.slice(0, 11),
  [0.45, GL[3], -0.8],
  [0.45, GL[3], 0],
  [-0.45, GL[3], 0],
  [-0.45, GL[3], 0.36],
];

export function Garage({ palette: p, active, dim, reduced }: LandmarkProps) {
  const light = useOwn(p.lamp);
  const sign = useMemo(() => new THREE.MeshStandardMaterial({ map: letterTexture("P", "#2f4bff", "#ffffff"), roughness: 0.6 }), []);
  useEffect(
    () => () => {
      sign.map?.dispose();
      sign.dispose();
    },
    [sign],
  );
  const model = useMemo(() => {
    const k = new Kit();
    exhibitPad(k, p, 2.5, 2.1);
    const dx = -0.27;
    const dw = 1.7;
    const dd = 1.85;
    for (let i = 1; i < 4; i++) {
      k.box(p.concrete, [dw, 0.07, dd], [dx, GL[i] - 0.07, 0], { r: 0.015 });
      for (const z of [-0.45, 0.45]) k.box(light, [1.5, 0.012, 0.035], [dx, GL[i] - 0.082, z]);
    }
    for (let i = 0; i < 3; i++)
      for (const x of [-1.05, -0.27, 0.5]) for (const z of [-0.85, 0.85]) k.box(p.plaster, [0.07, GL[i + 1] - GL[i] - 0.07, 0.07], [x, GL[i], z]);
    for (let i = 1; i < 4; i++) {
      const y = GL[i];
      k.box(p.card, [dw, 0.13, 0.03], [dx, y, dd / 2 - 0.015]);
      k.box(p.coral, [dw + 0.006, 0.035, 0.036], [dx, y + 0.05, dd / 2 - 0.015]);
      k.box(p.card, [0.03, 0.13, dd], [dx - dw / 2 + 0.015, y, 0]);
      k.box(p.coral, [0.036, 0.035, dd + 0.006], [dx - dw / 2 + 0.015, y + 0.05, 0]);
      k.box(p.card, [dw, 0.13, 0.03], [dx, y, -dd / 2 + 0.015]);
    }
    // Zig-zag ramps on the east side: one lane climbs north, the other south.
    const ramp = (x: number, low: number, high: number, north: boolean) => {
      const run = 1.6;
      const len = Math.hypot(run, high - low);
      const a = Math.atan2(high - low, run) * (north ? 1 : -1);
      k.box(p.concrete, [0.25, 0.05, len], [x, (low + high) / 2 - 0.025, 0], { rx: a });
      k.box(p.card, [0.03, 0.12, len], [x + (x > 0.85 ? 0.13 : -0.13), (low + high) / 2 - 0.02, 0], { rx: a });
    };
    ramp(0.745, GL[0], GL[1], true);
    ramp(0.995, GL[1], GL[2], false);
    ramp(0.745, GL[2], GL[3], true);
    for (const [y, z] of [
      [GL[1], -0.92],
      [GL[2], 0.92],
      [GL[3], -0.92],
    ])
      k.box(p.concrete, [0.52, 0.07, 0.25], [0.87, y - 0.07, z]);
    // Parked cars: one bay on deck 2 is left free for the car that arrives.
    const tones = [p.coral, p.card, p.steel, p.sage, p.peach];
    const parked: [number, number, number][] = [
      [-0.85, 0, 0.46],
      [-0.45, 0, 0.46],
      [0.05, 0, -0.46],
      [-0.85, 1, 0.46],
      [-0.05, 1, 0.46],
      [0.3, 1, -0.46],
      [-0.85, 2, -0.46],
      [-0.45, 2, 0.46],
      [-0.85, 3, 0.46],
      [-0.05, 3, -0.46],
      [0.3, 3, 0.46],
    ];
    parked.forEach(([x, level, z], i) => car(k, p, x, GL[level], z, tones[i % tones.length], "z"));
    for (const x of [-1.05, -0.65, -0.25, 0.15, 0.55]) for (const z of [-0.46, 0.46]) k.box(p.marking, [0.012, 0.004, 0.42], [x, GL[3], z]);
    // Roof lamps: they light up with the decks.
    for (const z of [-0.78, 0.78]) {
      k.box(p.charcoal, [0.022, 0.34, 0.022], [-1.04, GL[3], z]);
      k.box(light, [0.12, 0.03, 0.06], [-0.99, GL[3] + 0.34, z]);
    }
    // Booth at the ramp, and the P sign.
    k.box(p.card, [0.11, 0.2, 0.11], [1.19, GL[0], 0.97], { r: 0.015 });
    k.box(p.coral, [0.125, 0.03, 0.125], [1.19, GL[0] + 0.2, 0.97]);
    k.box(p.charcoal, [0.025, 0.72, 0.025], [-1.18, GL[0], 0.98]);
    k.box(sign, [0.26, 0.26, 0.025], [-1.18, 0.62, 0.995]);
    return k.build();
  }, [p, light, sign]);
  useDisposal(model);
  const arrival = useMemo(() => {
    const k = new Kit();
    car(k, p, 0, 0, 0, p.lime, "z");
    return k.build();
  }, [p]);
  const second = useMemo(() => {
    const k = new Kit();
    car(k, p, 0, 0, 0, p.amber, "z");
    return k.build();
  }, [p]);
  useDisposal(second);
  useDisposal(arrival);

  const lit = useLevel(active, reduced, 0.25, 0.6);
  const run = usePlay(active, reduced, 3.6);
  const mover = useRef<THREE.Group>(null);
  const mover2 = useRef<THREE.Group>(null);
  const arm = useRef<THREE.Group>(null);
  const heading = useRef(Math.PI);
  const heading2 = useRef(Math.PI);
  useFrame((_, delta) => {
    light.setValues({ emissiveIntensity: 0.12 + lit.current * 2.2 });
    const t = run.current;
    const g = mover.current;
    if (g) {
      g.visible = active && t > 0;
      const at = along(GARAGE_PATH, smooth(t));
      g.position.set(at.x, at.y + 0.02, at.z);
      const diff = Math.atan2(Math.sin(at.heading - heading.current), Math.cos(at.heading - heading.current));
      heading.current = t < 0.02 || reduced ? at.heading : heading.current + diff * (1 - Math.exp(-tick(delta) * 12));
      g.rotation.y = heading.current;
    }
    const g2 = mover2.current;
    if (g2) {
      const t2 = span(t, 0.16, 1);
      g2.visible = active && t2 > 0;
      const at = along(GARAGE_PATH_2, smooth(t2));
      g2.position.set(at.x, at.y + 0.02, at.z);
      const diff = Math.atan2(Math.sin(at.heading - heading2.current), Math.cos(at.heading - heading2.current));
      heading2.current = t2 < 0.02 || reduced ? at.heading : heading2.current + diff * (1 - Math.exp(-tick(delta) * 12));
      g2.rotation.y = heading2.current;
    }
    if (arm.current) {
      const open = active ? smooth(span(t, 0, 0.09)) * (1 - smooth(span(t, 0.22, 0.32))) : 0;
      arm.current.rotation.z = -1.25 * open;
    }
  });
  return (
    <group>
      <Model model={model} swap={dim ? p.card : null} />
      <group ref={arm} position={[1.15, GL[0] + 0.19, 0.97]}>
        <mesh position={[-0.25, 0, 0]} material={dim ? p.card : p.coral} castShadow>
          <boxGeometry args={[0.5, 0.025, 0.025]} />
        </mesh>
      </group>
      <group ref={mover} visible={false}>
        <Model model={arrival} receive={false} />
      </group>
      <group ref={mover2} visible={false}>
        <Model model={second} receive={false} />
      </group>
    </group>
  );
}

/* ---------- AURA: a studio of zones around a companion ---------- */
const AURA_C: V3 = [-0.45, 0.16, 0.05];
export function Aura({ palette: p, active, dim, reduced }: LandmarkProps) {
  const orb = useOwn(p.paper, (m) => m.emissive.set("#c8f13b"));
  const leds = useOwn(p.lamp);
  const segments = useMemo(() => Array.from({ length: 5 }, () => p.lime.clone()), [p]);
  useEffect(() => () => segments.forEach((m) => m.dispose()), [segments]);
  const model = useMemo(() => {
    const k = new Kit();
    exhibitPad(k, p, 2.8, 2.2);
    const [cx, , cz] = AURA_C;
    k.cyl(p.sand, 0.95, 0.1, [cx, 0.06, cz], { seg: 48 });
    k.torus(p.coral, 0.95, 0.012, [cx, 0.16, cz], { seg: 64 });
    const tones = [p.coralSoft, p.peach, p.card, p.sand];
    [45, 135, 225, 315].forEach((d, i) => {
      const a = (d * Math.PI) / 180;
      const x = cx + Math.cos(a) * 0.62;
      const z = cz + Math.sin(a) * 0.62;
      k.cyl(tones[i], 0.21, 0.37, [x, 0.16, z], { seg: 28 });
      k.cyl(p.glassDark, 0.214, 0.09, [x, 0.33, z], { seg: 28 });
      k.cyl(p.charcoal, 0.232, 0.035, [x, 0.53, z], { seg: 28 });
    });
    k.cyl(p.brass, 0.06, 0.3, [cx, 0.16, cz], { seg: 16 });
    // The typed bridge to the native services, on two posts.
    for (const x of [0.62, 0.98]) k.box(p.charcoal, [0.035, 0.34, 0.035], [x, 0.06, cz]);
    k.box(p.charcoal, [0.6, 0.02, 0.15], [0.78, 0.39, cz]);
    k.box(p.charcoal, [0.36, 0.72, 0.46], [1.2, 0.06, cz], { r: 0.02 });
    for (const x of [1.1, 1.2, 1.3]) k.box(leds, [0.014, 0.42, 0.02], [x, 0.2, cz + 0.235]);
    return k.build();
  }, [p, leds]);
  useDisposal(model);

  const glow = useLevel(active, reduced, 0.25, 0.6);
  const run = usePlay(active, reduced, 1.4);
  const halo = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    orb.setValues({ emissiveIntensity: 0.1 + glow.current * 1.4 });
    leds.setValues({ emissiveIntensity: 0.25 + glow.current * 1.8 });
    segments.forEach((m, i) => {
      // The request travels along the bridge, segment by segment.
      const on = active ? span(run.current, i / 6, i / 6 + 0.25) : 0;
      m.setValues({ emissiveIntensity: 0.05 + on * 2.2 * glow.current });
    });
    if (halo.current && !reduced && glow.current > 0) {
      halo.current.rotation.z += tick(delta) * 1.6 * glow.current;
      state.invalidate();
    }
  });
  const [cx, , cz] = AURA_C;
  return (
    <group>
      <Model model={model} swap={dim ? p.card : null} />
      <mesh position={[cx, 0.63, cz]} material={dim ? p.card : orb} castShadow>
        <sphereGeometry args={[0.17, 24, 16]} />
      </mesh>
      <mesh ref={halo} position={[cx, 0.63, cz]} rotation={[1.25, 0.2, 0]} material={dim ? p.card : p.lime}>
        <torusGeometry args={[0.27, 0.012, 6, 48]} />
      </mesh>
      {segments.map((m, i) => (
        <mesh key={i} position={[0.53 + i * 0.104, 0.42, cz]} material={dim ? p.card : m}>
          <boxGeometry args={[0.094, 0.025, 0.11]} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- Private Local AI: a document vault ---------- */
const VAULT: V3 = [-0.3, 0.06, -0.05];
export function Vault({ palette: p, active, dim, reduced }: LandmarkProps) {
  const status = useOwn(p.coral, (m) => m.emissive.set("#ee8466"));
  const card = useOwn(p.card, (m) => m.emissive.set("#f4ffd6"));
  const model = useMemo(() => {
    const k = new Kit();
    exhibitPad(k, p, 2.2, 2.1);
    const [vx, , vz] = VAULT;
    k.cyl(p.concrete, 0.86, 0.12, [vx, 0.06, vz], { seg: 56 });
    k.cyl(p.plaster, 0.6, 0.9, [vx, 0.18, vz], { seg: 56 });
    for (const h of [0.22, 0.45, 0.68]) k.torus(p.charcoal, 0.603, 0.008, [vx, 0.18 + h, vz], { seg: 64 });
    k.cyl(p.concrete, 0.64, 0.06, [vx, 1.08, vz], { seg: 56 });
    k.sphere(p.plaster, 0.5, [vx, 1.14, vz], { seg: 32, squash: 0.32 });
    k.cyl(p.steel, 0.3, 0.05, [vx, 0.6, vz + 0.6], { rx: Math.PI / 2, centre: true, seg: 40 });
    k.torus(p.brass, 0.3, 0.024, [vx, 0.6, vz + 0.625], { rx: 0, seg: 48 });
    for (const y of [0.45, 0.75]) k.box(p.charcoal, [0.06, 0.08, 0.05], [vx - 0.32, y - 0.04, vz + 0.6]);
    // Shelves of notes beside the vault.
    for (const x of [0.56, 0.99]) k.box(p.charcoal, [0.03, 0.64, 0.3], [x, 0.06, -0.3]);
    const docs = [p.card, p.peach, p.paper, p.sand];
    [0.18, 0.39, 0.6].forEach((y, row) => {
      k.box(p.charcoal, [0.46, 0.02, 0.3], [0.775, y, -0.3]);
      for (let i = 0; i < 3; i++)
        k.box(docs[(row + i) % docs.length], [0.11, 0.035 + ((row + i) % 2) * 0.02, 0.22], [0.64 + i * 0.13, y + 0.02, -0.3]);
    });
    k.box(p.charcoal, [0.14, 0.3, 0.1], [0.78, 0.06, 0.55]);
    k.box(p.charcoal, [0.2, 0.02, 0.16], [0.78, 0.36, 0.55]);
    return k.build();
  }, [p]);
  useDisposal(model);

  const open = useLevel(active, reduced, 0.5, 0.6);
  const wheel = useRef<THREE.Group>(null);
  const cite = useRef<THREE.Mesh>(null);
  useFrame(() => {
    // The door wheel turns, the light goes from coral to lime and a cited note lifts.
    const t = smooth(open.current);
    if (wheel.current) wheel.current.rotation.z = t * Math.PI;
    status.setValues({
      color: t > 0.5 ? "#c8f13b" : "#ee8466",
      emissive: t > 0.5 ? "#a6cf1f" : "#ee8466",
      emissiveIntensity: 0.25 + t * 0.6,
    });
    card.setValues({ emissiveIntensity: t * 0.55 });
    if (cite.current) cite.current.position.y = 0.52 + t * 0.2;
  });
  const [vx, , vz] = VAULT;
  return (
    <group>
      <Model model={model} swap={dim ? p.card : null} />
      <group ref={wheel} position={[vx, 0.6, vz + 0.66]}>
        <mesh material={dim ? p.card : p.brass}>
          <torusGeometry args={[0.13, 0.014, 6, 32]} />
        </mesh>
        {[0, 60, 120].map((d) => (
          <mesh key={d} rotation={[0, 0, (d * Math.PI) / 180]} material={dim ? p.card : p.brass}>
            <boxGeometry args={[0.26, 0.02, 0.02]} />
          </mesh>
        ))}
      </group>
      <mesh position={[vx, 0.98, vz + 0.62]} material={dim ? p.card : status}>
        <sphereGeometry args={[0.035, 12, 8]} />
      </mesh>
      <mesh ref={cite} position={[0.78, 0.52, 0.55]} rotation={[-0.35, 0, 0]} material={dim ? p.card : card} castShadow>
        <boxGeometry args={[0.2, 0.26, 0.012]} />
      </mesh>
    </group>
  );
}

/* ---------- LifeOS: a personal workstation ---------- */
export function Workstation({ palette: p, active, dim, reduced }: LandmarkProps) {
  const screens = useOwn(p.glassDark, (m) => m.emissive.set("#cfe6ff"));
  const shade = useOwn(p.lamp);
  const model = useMemo(() => {
    const k = new Kit();
    briefPad(k, p.sysPave, 1.9, 1.7);
    k.box(p.card, [1.72, 0.07, 1.36], [0, 0.88, 0.02], { r: 0.015 });
    k.box(p.coral, [1.726, 0.03, 1.366], [0, 0.9, 0.02]);
    for (const x of [-0.8, 0.8]) for (const z of [-0.6, 0.6]) k.box(p.charcoal, [0.045, 0.85, 0.045], [x, 0.03, z]);
    k.box(p.sand, [1.52, 0.74, 0.06], [0, 0.03, -0.56]);
    const cards = [p.coralSoft, p.limeSoft, p.powder];
    [-0.45, 0, 0.45].forEach((x, col) => {
      k.box(p.charcoal, [0.36, 0.012, 0.012], [x, 0.67, -0.525]);
      for (let r = 0; r < 3 - (col === 2 ? 1 : 0); r++)
        if (!(col === 0 && r === 2)) k.box(cards[(col + r) % 3], [0.16, 0.1, 0.012], [x, 0.52 - r * 0.13, -0.524]);
    });
    k.box(p.card, [0.96, 0.04, 0.4], [0, 0.38, -0.12]);
    for (const x of [-0.44, 0.44]) k.box(p.charcoal, [0.03, 0.35, 0.36], [x, 0.03, -0.12]);
    for (const x of [-0.17, 0.17]) {
      k.box(screens, [0.3, 0.19, 0.015], [x, 0.47, -0.25]);
      k.box(p.charcoal, [0.03, 0.07, 0.03], [x, 0.42, -0.255]);
    }
    k.box(p.charcoal, [0.22, 0.04, 0.22], [0, 0.22, 0.24]);
    k.box(p.charcoal, [0.22, 0.24, 0.03], [0, 0.26, 0.36]);
    k.cyl(p.steel, 0.02, 0.19, [0, 0.03, 0.24], { seg: 8 });
    k.cyl(p.charcoal, 0.04, 0.02, [0.39, 0.42, -0.2], { seg: 12 });
    k.box(p.charcoal, [0.015, 0.22, 0.015], [0.39, 0.44, -0.2]);
    k.cyl(shade, 0.06, 0.07, [0.39, 0.64, -0.17], { top: 0.02, seg: 14 });
    k.cyl(p.coral, 0.08, 0.13, [-0.7, 0.03, 0.45], { seg: 14 });
    k.sphere(p.sage, 0.13, [-0.7, 0.27, 0.45], { seg: 12 });
    return k.build();
  }, [p, screens, shade]);
  useDisposal(model);
  const on = useLevel(active, reduced, 0.25, 0.6);
  const move = usePlay(active, reduced, 1.2);
  const moving = useRef<THREE.Mesh>(null);
  useFrame(() => {
    screens.setValues({ emissiveIntensity: on.current * 0.85 });
    shade.setValues({ emissiveIntensity: 0.2 + on.current * 1.2 });
    const m = moving.current;
    if (m) {
      // A task card moves from the first column to the last.
      const t = smooth(move.current);
      m.position.set(-0.45 + t * 0.9, 0.31 + Math.sin(t * Math.PI) * 0.09, -0.516);
    }
  });
  return (
    <group>
      <Model model={model} swap={dim ? p.card : null} />
      <mesh ref={moving} position={[-0.45, 0.31, -0.516]} material={dim ? p.card : p.coralSoft}>
        <boxGeometry args={[0.16, 0.1, 0.012]} />
      </mesh>
    </group>
  );
}

/* ---------- Burnout Backend: a blueprint of an API ---------- */
const RACKS = [-0.5, -0.12, 0.26];
const ROUTES: V3[][] = RACKS.map((x) => [
  [x, 0.02, -0.04],
  [x, 0.02, 0.14],
  [0.5, 0.02, 0.14],
  [0.5, 0.02, 0.33],
]);
export function BlueprintApi({ palette: p, active, dim, reduced }: LandmarkProps) {
  const ink = useMemo(
    () => new THREE.LineDashedMaterial({ color: "#2f4bff", dashSize: 0.05, gapSize: 0.035, transparent: true, opacity: 0.75 }),
    [],
  );
  const solid = useMemo(() => new THREE.LineBasicMaterial({ color: "#2f4bff", transparent: true, opacity: 0.85 }), []);
  useEffect(
    () => () => {
      ink.dispose();
      solid.dispose();
    },
    [ink, solid],
  );
  const model = useMemo(() => {
    const k = new Kit();
    k.box(p.card, [1.75, 0.012, 1.45], [0, 0, 0]);
    k.line(ink, [
      [-0.81, 0.016, -0.66],
      [0.81, 0.016, -0.66],
      [0.81, 0.016, 0.66],
      [-0.81, 0.016, 0.66],
      [-0.81, 0.016, -0.66],
    ]);
    for (const x of RACKS) {
      k.box(p.blueprint, [0.34, 0.85, 0.46], [x, 0.012, -0.28]);
      k.edges(solid, [0.34, 0.85, 0.46], [x, 0.012, -0.28]);
      for (let i = 1; i < 5; i++)
        k.line(ink, [
          [x - 0.17, 0.012 + i * 0.17, -0.05],
          [x + 0.17, 0.012 + i * 0.17, -0.05],
        ]);
    }
    for (const x of [0.3, 0.7]) {
      k.box(p.blueprint, [0.06, 0.52, 0.06], [x, 0.012, 0.35]);
      k.edges(solid, [0.06, 0.52, 0.06], [x, 0.012, 0.35]);
    }
    k.box(p.blueprint, [0.46, 0.06, 0.08], [0.5, 0.532, 0.35]);
    k.edges(solid, [0.46, 0.06, 0.08], [0.5, 0.532, 0.35]);
    ROUTES.forEach((r) => k.line(ink, r));
    return k.build();
  }, [p, ink, solid]);
  useDisposal(model);
  const glow = useLevel(active, reduced, 0.25, 0.6);
  const run = usePlay(active, reduced, 1.6);
  const packet = useRef<THREE.Mesh>(null);
  useFrame(() => {
    // The drawing darkens, and one request goes out to a rack and back.
    const g = glow.current;
    ink.setValues({ opacity: 0.75 + g * 0.25 });
    solid.setValues({ opacity: 0.85 + g * 0.15 });
    const m = packet.current;
    if (m) {
      m.visible = active && !reduced && run.current > 0 && run.current < 1;
      const t = run.current < 0.5 ? smooth(run.current * 2) : smooth(2 - run.current * 2);
      const at = along([...ROUTES[1]].reverse(), t);
      m.position.set(at.x, at.y + 0.03, at.z);
    }
  });
  return (
    <group>
      <Model model={model} swap={dim ? p.card : null} cast={false} />
      <mesh ref={packet} visible={false} material={p.cobalt}>
        <boxGeometry args={[0.055, 0.055, 0.055]} />
      </mesh>
    </group>
  );
}

/* ---------- Cycoil: a used-oil collection kiosk ---------- */
const DROP_PATH: V3[] = [
  [-0.06, 0.3, -0.2],
  [0.38, 0.3, -0.2],
  [0.5, 0.22, -0.2],
];
export function Kiosk({ palette: p, active, dim, reduced }: LandmarkProps) {
  const screen = useOwn(p.glassDark, (m) => m.emissive.set("#e9ffd0"));
  const model = useMemo(() => {
    const k = new Kit();
    briefPad(k, p.sysPave, 1.9, 1.5);
    k.box(p.charcoal, [0.74, 0.05, 0.58], [-0.42, 0.03, -0.05]);
    k.box(p.card, [0.72, 0.8, 0.56], [-0.42, 0.06, -0.05], { r: 0.05 });
    k.box(p.coral, [0.86, 0.035, 0.36], [-0.42, 0.78, 0.32], { rx: 0.25 });
    k.box(p.sand, [0.62, 0.04, 0.12], [-0.42, 0.36, 0.28]);
    k.box(screen, [0.26, 0.17, 0.015], [-0.42, 0.45, 0.232]);
    k.cyl(p.steel, 0.025, 0.16, [-0.85, 0.42, -0.05], { rz: Math.PI / 2, centre: true, seg: 10 });
    k.cyl(p.steel, 0.05, 0.08, [-0.95, 0.38, -0.05], { top: 0.02, seg: 12 });
    k.sphere(p.brass, 0.07, [-0.42, 0.95, -0.05], { seg: 14 });
    k.cyl(p.brass, 0.065, 0.12, [-0.42, 0.97, -0.05], { top: 0.0, seg: 14 });
    k.cyl(p.brass, 0.17, 0.4, [0.22, 0.03, 0.42], { seg: 24 });
    for (const y of [0.15, 0.31]) k.torus(p.charcoal, 0.172, 0.01, [0.22, y, 0.42], { seg: 32 });
    k.cyl(p.steel, 0.22, 0.72, [0.6, 0.03, -0.25], { seg: 28 });
    k.sphere(p.steel, 0.22, [0.6, 0.75, -0.25], { seg: 24, squash: 0.35 });
    k.box(p.glassDark, [0.07, 0.5, 0.02], [0.6, 0.12, -0.035]);
    k.cyl(p.steel, 0.025, 0.46, [0.16, 0.3, -0.2], { rz: Math.PI / 2, centre: true, seg: 10 });
    return k.build();
  }, [p, screen]);
  useDisposal(model);
  const on = useLevel(active, reduced, 0.25, 0.6);
  const run = usePlay(active, reduced, 1.8);
  const drop = useRef<THREE.Mesh>(null);
  const level = useRef<THREE.Mesh>(null);
  useFrame(() => {
    // The screen wakes, a drop runs down the pipe and the tank's level rises a little.
    screen.setValues({ emissiveIntensity: on.current * 0.8 });
    const t = run.current;
    if (drop.current) {
      drop.current.visible = active && !reduced && t > 0.05 && t < 0.7;
      const at = along(DROP_PATH, smooth(span(t, 0.05, 0.7)));
      drop.current.position.set(at.x, at.y + 0.045, at.z);
    }
    if (level.current) {
      const fill = 0.22 + (active ? smooth(span(t, 0.6, 1)) * 0.16 : 0);
      level.current.scale.y = fill;
      level.current.position.y = 0.12 + fill / 2;
    }
  });
  return (
    <group>
      <Model model={model} swap={dim ? p.card : null} />
      <mesh ref={drop} visible={false} material={p.brass}>
        <sphereGeometry args={[0.035, 12, 8]} />
      </mesh>
      <mesh ref={level} position={[0.6, 0.23, -0.022]} material={dim ? p.card : p.brass}>
        <boxGeometry args={[0.05, 1, 0.012]} />
      </mesh>
    </group>
  );
}

/* ---------- Green Mobility: a shuttle stop and bike rack ---------- */
/** The street's shuttle lane, in this landmark's own (unscaled) units. */
const LANE_Z = 1.04;
export function Mobility({ palette: p, active, dim, reduced }: LandmarkProps) {
  const light = useOwn(p.lamp);
  const model = useMemo(() => {
    const k = new Kit();
    briefPad(k, p.sysPave, 2.7, 1.5);
    for (const x of [-1.05, -0.05]) k.box(p.charcoal, [0.04, 0.6, 0.04], [x, 0.03, -0.42]);
    k.box(p.card, [1.2, 0.05, 0.5], [-0.55, 0.63, -0.3], { r: 0.01 });
    k.box(p.moss, [1.1, 0.04, 0.42], [-0.55, 0.68, -0.3]);
    k.box(p.glass, [1.0, 0.42, 0.02], [-0.55, 0.12, -0.5]);
    k.box(p.brass, [0.62, 0.04, 0.14], [-0.55, 0.2, -0.38]);
    for (const x of [-0.8, -0.3]) k.box(p.charcoal, [0.03, 0.17, 0.12], [x, 0.03, -0.38]);
    k.box(light, [0.9, 0.012, 0.05], [-0.55, 0.616, -0.28]);
    k.box(p.charcoal, [0.025, 0.68, 0.025], [0.15, 0.03, 0.12]);
    k.cyl(p.sage, 0.11, 0.025, [0.15, 0.78, 0.12], { rx: Math.PI / 2, centre: true, seg: 24 });
    k.torus(p.lime, 0.11, 0.012, [0.15, 0.78, 0.136], { rx: 0, seg: 32 });
    const frames = [p.coral, p.sage, p.powder];
    [0.55, 0.75, 0.95].forEach((x, i) => {
      for (const dz of [-0.11, 0.11]) k.torus(p.charcoal, 0.085, 0.01, [x, 0.115, -0.25 + dz], { rx: 0, ry: Math.PI / 2, seg: 20 });
      k.box(frames[i], [0.014, 0.014, 0.22], [x, 0.17, -0.25]);
      k.box(p.charcoal, [0.03, 0.012, 0.06], [x, 0.21, -0.2]);
      k.box(p.charcoal, [0.08, 0.012, 0.012], [x, 0.23, -0.34]);
    });
    k.box(p.charcoal, [0.62, 0.02, 0.02], [0.75, 0.16, -0.42]);
    k.box(p.sage, [0.13, 0.36, 0.1], [1.15, 0.03, 0.32], { r: 0.02 });
    k.box(p.lime, [0.06, 0.03, 0.012], [1.15, 0.3, 0.375]);
    return k.build();
  }, [p, light]);
  useDisposal(model);
  const shuttle = useMemo(() => {
    const k = new Kit();
    k.box(p.charcoal, [0.86, 0.06, 0.32], [0, 0.03, 0]);
    k.box(p.card, [0.95, 0.3, 0.4], [0, 0.07, 0], { r: 0.07 });
    k.box(p.glassDark, [0.955, 0.11, 0.405], [0, 0.22, 0]);
    k.box(p.sage, [0.955, 0.045, 0.405], [0, 0.12, 0]);
    for (const x of [-0.3, 0.3]) for (const z of [-0.17, 0.17]) k.cyl(p.ink, 0.065, 0.05, [x, 0.065, z], { rx: Math.PI / 2, centre: true, seg: 14 });
    return k.build();
  }, [p]);
  useDisposal(shuttle);
  // The shuttle leaves its charging bay for the stop, and backs into the bay again after.
  const go = useLevel(active, reduced, 1.6, 1.2);
  const lit = useLevel(active, reduced, 0.3, 0.6);
  const bus = useRef<THREE.Group>(null);
  useFrame(() => {
    light.setValues({ emissiveIntensity: 0.12 + lit.current * 1.3 });
    if (bus.current) bus.current.position.x = 1.05 - smooth(go.current) * 1.6;
  });
  return (
    <group>
      <Model model={model} swap={dim ? p.card : null} />
      <group ref={bus} position={[1.05, 0.012, LANE_Z]}>
        <Model model={shuttle} swap={dim ? p.card : null} />
      </group>
    </group>
  );
}

/* ---------- RupeeRise: a board of choices with a coin ---------- */
const TILES: [number, number][] = [
  [-0.5, 0.5],
  [-0.25, 0.5],
  [0, 0.5],
  [0, 0.25],
  [0, 0],
  [0.25, 0.5],
  [0.5, 0.5],
  [0.5, 0.25],
];
const TOKEN_PATH: V3[] = [
  [-0.5, 0.16, 0.58],
  [-0.25, 0.16, 0.58],
  [0, 0.16, 0.58],
  [0.25, 0.16, 0.58],
  [0.5, 0.16, 0.58],
  [0.5, 0.16, 0.33],
];
export function CoinBoard({ palette: p, active, dim, reduced }: LandmarkProps) {
  const tall = useOwn(p.coral, (m) => m.emissive.set("#ee8466"));
  const model = useMemo(() => {
    const k = new Kit();
    briefPad(k, p.sysPave, 1.7, 1.7);
    k.box(p.card, [1.36, 0.06, 1.36], [0, 0.03, 0.08], { r: 0.02 });
    TILES.forEach(([x, z], i) => k.box(i % 2 ? p.sand : p.peach, [0.2, 0.02, 0.2], [x, 0.09, z + 0.08]));
    k.box(p.sand, [0.16, 0.35, 0.16], [-0.42, 0.09, -0.42]);
    k.box(p.coralSoft, [0.16, 0.55, 0.16], [-0.18, 0.09, -0.42]);
    k.box(tall, [0.16, 0.78, 0.16], [0.06, 0.09, -0.42]);
    k.box(p.concrete, [0.32, 0.06, 0.14], [0.45, 0.09, -0.35]);
    return k.build();
  }, [p, tall]);
  useDisposal(model);
  const glow = useLevel(active, reduced, 0.25, 0.6);
  const run = usePlay(active, reduced, 1.8);
  const coin = useRef<THREE.Group>(null);
  const token = useRef<THREE.Mesh>(null);
  useFrame(() => {
    // A token takes one branch of the board and the coin turns once.
    tall.setValues({ emissiveIntensity: glow.current * 0.35 });
    if (coin.current) coin.current.rotation.y = smooth(run.current) * Math.PI * 2;
    if (token.current) {
      const at = along(TOKEN_PATH, active ? smooth(run.current) : 0);
      const hop = active && !reduced ? Math.abs(Math.sin(run.current * Math.PI * 5)) * 0.06 : 0;
      token.current.position.set(at.x, at.y + hop, at.z);
    }
  });
  return (
    <group>
      <Model model={model} swap={dim ? p.card : null} />
      <group ref={coin} position={[0.45, 0.42, -0.35]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={dim ? p.card : p.brass} castShadow>
          <cylinderGeometry args={[0.26, 0.26, 0.05, 40]} />
        </mesh>
        <mesh position={[0, 0, 0.027]} material={dim ? p.card : p.charcoal}>
          <torusGeometry args={[0.19, 0.012, 6, 40]} />
        </mesh>
      </group>
      <mesh ref={token} position={[-0.5, 0.16, 0.58]} material={dim ? p.card : p.lime} castShadow>
        <sphereGeometry args={[0.05, 14, 10]} />
      </mesh>
    </group>
  );
}
