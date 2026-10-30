"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { trot } from "@/components/scenes/dog-data";
import { H as MAP_H, W as MAP_W, AGENTS, STEPS, simulate as searchRun, survivors, walls, type Frame } from "@/components/scenes/swarm-data";
import { cappedRul, makeFleet } from "@/lib/rul-sim";
import { Kit, Model, useDisposal, type V3 } from "./kit";
import { briefPad, exhibitPad, useOwn, type LandmarkProps } from "./landmark";
import { along, smooth, span, useLevel, usePlay } from "./motion";
import { Tiles } from "./tiles";

/*
 * The Intelligence district's seven landmarks, modelled on what each project
 * is. Where the portfolio already holds a project's own illustration data (the
 * engine fleet, the robot-dog trot, the SWARMMIND search map), the reaction
 * runs that code, so the landmark and the exhibit agree. AERIS, Resume Screener
 * and the two blueprints are illustrations with no run behind them, and the
 * panel says so. Under reduced motion every reaction jumps to its end state.
 */

/* ---------- Predictive Maintenance: a test engine, a fleet rack and a life gauge ---------- */
let fleetCache: ReturnType<typeof makeFleet> | null = null;
const fleet = () => (fleetCache ??= makeFleet(7));
const RACK: V3[] = Array.from({ length: 12 }, (_, i) => [0.1 + (i % 4) * 0.23, 0.115, 0.06 + Math.floor(i / 4) * 0.23] as V3);

export function Maintenance({ palette: p, active, dim, reduced }: LandmarkProps) {
  const f = fleet();
  const heat = useOwn(p.coral);
  const model = useMemo(() => {
    const k = new Kit();
    exhibitPad(k, p, 1.9, 1.7);
    k.box(p.concrete, [1.8, 0.05, 1.55], [0, 0.06, 0]);
    // The test engine on its stand: shell, intake fan, a hot section and a nozzle.
    for (const x of [-0.7, -0.2]) k.box(p.charcoal, [0.06, 0.2, 0.3], [x, 0.11, -0.35]);
    k.cyl(p.card, 0.21, 0.8, [-0.45, 0.45, -0.35], { rz: Math.PI / 2, centre: true, seg: 28 });
    k.cyl(p.steel, 0.25, 0.07, [-0.88, 0.45, -0.35], { rz: Math.PI / 2, centre: true, seg: 28 });
    for (let i = 0; i < 6; i++) k.box(p.charcoal, [0.02, 0.4, 0.03], [-0.915, 0.25, -0.35], { rx: (i * Math.PI) / 3 });
    k.cyl(heat, 0.215, 0.2, [-0.2, 0.45, -0.35], { rz: Math.PI / 2, centre: true, seg: 28 });
    k.cyl(p.steel, 0.16, 0.22, [-0.02, 0.45, -0.35], { rz: Math.PI / 2, centre: true, top: 0.1, seg: 24 });
    // The life gauge: a post and an empty scale.
    k.box(p.charcoal, [0.12, 0.6, 0.1], [0.78, 0.11, -0.35]);
    k.box(p.card, [0.08, 0.5, 0.012], [0.78, 0.16, -0.298]);
    return k.build();
  }, [p, heat]);
  useDisposal(model);
  const run = usePlay(active, reduced, 4);
  const colour = useMemo(() => {
    const validation = new THREE.Color("#f2b544");
    const training = new THREE.Color("#a7c9f0");
    return (i: number, t: number, out: THREE.Color) => {
      if (t < 0.08 + i * 0.015) return true;
      out.copy(f.validation.includes(i + 1) ? validation : training);
      return true;
    };
  }, [f]);
  const fill = useRef<THREE.Mesh>(null);
  const fillMat = useOwn(p.lime);
  useFrame(() => {
    const t = run.current;
    // The featured engine ages: its capped remaining life falls as the run goes on.
    const cycle = span(t, 0.35, 1) * f.featured.life;
    const rul = cappedRul(f.featured.life, cycle) / 125;
    const wear = span(t, 0.35, 1);
    heat.setValues({ emissive: "#ff6a3d", emissiveIntensity: active ? 0.1 + wear * 1.1 : 0 });
    fillMat.setValues({ color: wear > 0.75 ? "#f2b544" : "#c8f13b", emissive: wear > 0.75 ? "#f2b544" : "#a6cf1f", emissiveIntensity: 0.3 });
    const m = fill.current;
    if (m) {
      const h = Math.max(0.02, Math.min(1, rul)) * 0.48;
      m.scale.y = h;
      m.position.y = 0.16 + h / 2;
      m.visible = active || reduced;
    }
  });
  return (
    <group>
      <Model model={model} swap={dim ? p.card : null} />
      <Tiles cells={RACK} width={0.19} height={0.04} depth={0.19} base="#ebe5d9" t={run} dim={dim} colour={colour} />
      <mesh ref={fill} position={[0.78, 0.4, -0.29]} material={dim ? p.card : fillMat}>
        <boxGeometry args={[0.06, 1, 0.012]} />
      </mesh>
    </group>
  );
}

/* ---------- Robot Dog: speech, intent, gait ---------- */
const CHAIN: V3[] = [-0.7, -0.35, 0, 0.35, 0.7].map((x) => [x, 0.1, 0.62] as V3);
const LEG_AT: [number, number][] = [
  [0.2, 0.1],
  [0.2, -0.1],
  [-0.2, 0.1],
  [-0.2, -0.1],
];

export function RobotDog({ palette: p, active, dim, reduced }: LandmarkProps) {
  const model = useMemo(() => {
    const k = new Kit();
    exhibitPad(k, p, 1.9, 1.7);
    k.box(p.concrete, [1.8, 0.05, 1.5], [0, 0.06, 0]);
    k.cyl(p.plaster, 0.55, 0.05, [0, 0.11, -0.15], { seg: 40 });
    // The dog's body and head; the legs are drawn separately because they move.
    k.box(p.card, [0.52, 0.14, 0.24], [0, 0.4, -0.15], { r: 0.03 });
    k.box(p.coral, [0.5, 0.025, 0.2], [0, 0.54, -0.15]);
    k.box(p.card, [0.17, 0.13, 0.16], [0.34, 0.47, -0.15], { r: 0.03 });
    k.box(p.charcoal, [0.04, 0.03, 0.12], [0.43, 0.49, -0.15]);
    k.box(p.card, [0.2, 0.05, 0.05], [-0.33, 0.47, -0.15], { rz: 0.5 });
    k.cyl(p.charcoal, 0.02, 0.2, [0.3, 0.55, -0.15], { seg: 6 });
    return k.build();
  }, [p]);
  useDisposal(model);
  const run = usePlay(active, reduced, 4);
  const legs = useRef<{ hip: THREE.Group | null; knee: THREE.Group | null }[]>([]);
  const body = useRef<THREE.Group>(null);
  const phase = useRef(0);
  const out = useMemo(() => Array(12).fill(0) as number[], []);
  const cells = CHAIN;
  const colour = useMemo(() => {
    const lit = new THREE.Color("#c8f13b");
    return (i: number, t: number, o: THREE.Color) => {
      if (t > 0.05 + i * 0.1) o.copy(lit);
      return true;
    };
  }, []);
  useFrame((_, delta) => {
    const t = run.current;
    const amount = reduced ? 0.7 * (active ? 1 : 0) : smooth(span(t, 0.5, 0.65)) * (1 - smooth(span(t, 0.92, 1))) * 0.9;
    if (!reduced && t > 0 && t < 1) phase.current += Math.min(0.05, delta) * 9;
    trot(phase.current, amount, 0, out);
    legs.current.forEach((l, i) => {
      if (l.hip) l.hip.rotation.z = -out[i * 3 + 1];
      if (l.knee) l.knee.rotation.z = -out[i * 3 + 2] * 0.9 - 0.3;
    });
    if (body.current) body.current.position.y = Math.abs(Math.sin(phase.current)) * 0.02 * amount;
  });
  return (
    <group>
      <Model model={model} swap={dim ? p.card : null} />
      <Tiles cells={cells} width={0.12} height={0.05} depth={0.12} base="#ebe5d9" t={run} dim={dim} colour={colour} />
      <group ref={body}>
        {LEG_AT.map(([x, z], i) => (
          <group key={i} position={[x, 0.4, z - 0.15]} ref={(g) => void (legs.current[i] = { ...(legs.current[i] ?? { knee: null }), hip: g })}>
            <mesh position={[0, -0.09, 0]} material={dim ? p.card : p.card} castShadow>
              <boxGeometry args={[0.05, 0.18, 0.05]} />
            </mesh>
            <group position={[0, -0.18, 0]} ref={(g) => void (legs.current[i] = { ...(legs.current[i] ?? { hip: null }), knee: g })}>
              <mesh position={[0, -0.09, 0]} material={dim ? p.card : p.charcoal} castShadow>
                <boxGeometry args={[0.04, 0.18, 0.04]} />
              </mesh>
            </group>
          </group>
        ))}
      </group>
    </group>
  );
}

/* ---------- SWARMMIND: the same search, two ways, side by side ---------- */
let searchCache: { random: Frame[]; frontier: Frame[] } | null = null;
const searches = () => (searchCache ??= { random: searchRun("random"), frontier: searchRun("frontier") });
const SC = 0.085;
const Z_RANDOM = 0.5;
const Z_FRONTIER = -0.5;
const mapCell = (c: number, z0: number): V3 => [((c % MAP_W) - (MAP_W - 1) / 2) * SC, 0.075, z0 + (Math.floor(c / MAP_W) - (MAP_H - 1) / 2) * SC];
const OPEN: number[] = Array.from({ length: MAP_W * MAP_H }, (_, i) => i).filter((c) => !walls.has(c));

export function Swarmmind({ palette: p, active, dim, reduced }: LandmarkProps) {
  const runs = searches();
  const model = useMemo(() => {
    const k = new Kit();
    exhibitPad(k, p, 1.8, 1.8);
    k.box(p.concrete, [1.66, 0.03, 2.0], [0, 0.06, 0]);
    for (const z0 of [Z_RANDOM, Z_FRONTIER]) {
      k.box(p.plaster, [MAP_W * SC + 0.04, 0.012, MAP_H * SC + 0.04], [0, 0.09, z0]);
      walls.forEach((c) => {
        const [x, , z] = mapCell(c, z0);
        k.box(p.charcoal, [SC * 0.95, 0.07, SC * 0.95], [x, 0.09, z]);
      });
    }
    return k.build();
  }, [p]);
  useDisposal(model);
  const run = usePlay(active, reduced, 5);
  const cells = useMemo<V3[]>(() => OPEN.flatMap((c) => [mapCell(c, Z_RANDOM), mapCell(c, Z_FRONTIER)]).map((v) => [v[0], 0.1, v[2]] as V3), []);
  const colour = useMemo(() => {
    const seenRandom = new THREE.Color("#a7c9f0");
    const seenFrontier = new THREE.Color("#c8f13b");
    return (i: number, t: number, out: THREE.Color) => {
      const step = Math.min(STEPS, Math.floor(t * STEPS));
      const cell = OPEN[i >> 1];
      const frames = i & 1 ? runs.frontier : runs.random;
      if (frames[step].seen.has(cell)) out.copy(i & 1 ? seenFrontier : seenRandom);
      return true;
    };
  }, [runs]);
  const agents = useRef<(THREE.Mesh | null)[]>([]);
  const finds = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(() => {
    const t = run.current;
    const step = Math.min(STEPS, Math.floor(t * STEPS));
    [runs.random, runs.frontier].forEach((frames, side) => {
      const z0 = side === 0 ? Z_RANDOM : Z_FRONTIER;
      frames[step].agents.forEach((a, i) => {
        const m = agents.current[side * AGENTS + i];
        if (!m) return;
        m.visible = active && t > 0;
        const v = mapCell(a, z0);
        m.position.set(v[0], 0.15, v[2]);
      });
      survivors.forEach((s, i) => {
        const m = finds.current[side * survivors.length + i];
        if (m) m.visible = active && frames[step].seen.has(s);
      });
    });
  });
  return (
    <group>
      <Model model={model} swap={dim ? p.card : null} />
      <Tiles cells={cells} width={SC * 0.9} height={0.012} depth={SC * 0.9} base="#e4e0e8" t={run} dim={dim} colour={colour} />
      {[0, 1].flatMap((side) =>
        Array.from({ length: AGENTS }, (_, i) => (
          <mesh key={`a${side}${i}`} ref={(m) => void (agents.current[side * AGENTS + i] = m)} visible={false} material={side ? p.violet : p.cobalt} castShadow>
            <sphereGeometry args={[0.034, 10, 8]} />
          </mesh>
        )),
      )}
      {[0, 1].flatMap((side) =>
        survivors.map((s, i) => {
          const v = mapCell(s, side === 0 ? Z_RANDOM : Z_FRONTIER);
          return (
            <mesh key={`s${side}${i}`} ref={(m) => void (finds.current[side * survivors.length + i] = m)} visible={false} position={[v[0], 0.13, v[2]]} material={p.amber}>
              <cylinderGeometry args={[0.025, 0.025, 0.05, 8]} />
            </mesh>
          );
        }),
      )}
    </group>
  );
}

/* ---------- AERIS: a planned route over a grid, flown in simulation ---------- */
const GRID = 7;
const GC = 0.21;
const BLOCKS = new Set([1 * GRID + 3, 2 * GRID + 3, 3 * GRID + 1, 3 * GRID + 5, 4 * GRID + 3, 5 * GRID + 5]);
const gridAt = (c: number, y = 0.1): V3 => [((c % GRID) - (GRID - 1) / 2) * GC, y, (Math.floor(c / GRID) - (GRID - 1) / 2) * GC];

/** 8-connected A* with octile distance, no corner cutting: the planner's shape, on a small fixed grid. */
function plan(start: number, goal: number) {
  const open = new Map<number, number>([[start, 0]]);
  const g = new Map<number, number>([[start, 0]]);
  const prev = new Map<number, number>();
  const h = (c: number) => {
    const dx = Math.abs((c % GRID) - (goal % GRID));
    const dy = Math.abs(Math.floor(c / GRID) - Math.floor(goal / GRID));
    return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
  };
  open.set(start, h(start));
  while (open.size) {
    const cur = [...open.entries()].sort((a, b) => a[1] - b[1])[0][0];
    if (cur === goal) break;
    open.delete(cur);
    const x = cur % GRID;
    const y = Math.floor(cur / GRID);
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) continue;
        const n = ny * GRID + nx;
        if (BLOCKS.has(n)) continue;
        if (dx && dy && (BLOCKS.has(y * GRID + nx) || BLOCKS.has(ny * GRID + x))) continue;
        const cost = (g.get(cur) ?? 0) + (dx && dy ? Math.SQRT2 : 1);
        if (cost < (g.get(n) ?? Infinity)) {
          g.set(n, cost);
          prev.set(n, cur);
          open.set(n, cost + h(n));
        }
      }
  }
  const path = [goal];
  while (path[0] !== start && prev.has(path[0])) path.unshift(prev.get(path[0])!);
  return path;
}
const AERIS_PATH = plan(6 * GRID + 0, 0 * GRID + 6);

export function Aeris({ palette: p, active, dim, reduced }: LandmarkProps) {
  const model = useMemo(() => {
    const k = new Kit();
    briefPad(k, p.concrete, 1.7, 1.7);
    k.box(p.plaster, [1.52, 0.02, 1.52], [0, 0.03, 0]);
    BLOCKS.forEach((c) => {
      const [x, , z] = gridAt(c, 0.05);
      k.box(p.card, [GC * 0.9, 0.12 + (c % 3) * 0.05, GC * 0.9], [x, 0.05, z], { r: 0.015 });
    });
    const [sx, , sz] = gridAt(AERIS_PATH[0], 0.05);
    const [gx, , gz] = gridAt(AERIS_PATH[AERIS_PATH.length - 1], 0.05);
    k.cyl(p.charcoal, 0.09, 0.012, [sx, 0.05, sz], { seg: 20 });
    k.torus(p.lime, 0.09, 0.012, [gx, 0.065, gz], { seg: 24 });
    return k.build();
  }, [p]);
  useDisposal(model);
  const run = usePlay(active, reduced, 4);
  const cells = useMemo(() => Array.from({ length: GRID * GRID }, (_, c) => gridAt(c, 0.062)), []);
  const colour = useMemo(() => {
    const flown = new THREE.Color("#5fd3e6");
    return (i: number, t: number, out: THREE.Color) => {
      const r = AERIS_PATH.indexOf(i);
      if (r >= 0 && r / (AERIS_PATH.length - 1) <= span(t, 0.1, 0.9)) out.copy(flown);
      return true;
    };
  }, []);
  const drone = useRef<THREE.Group>(null);
  const rotors = useRef<(THREE.Mesh | null)[]>([]);
  const spin = useRef(0);
  const route = useMemo(() => AERIS_PATH.map((c) => gridAt(c, 0.3)), []);
  const lit = useLevel(active, reduced, 0.3, 0.5);
  useFrame((_, delta) => {
    const t = run.current;
    const g = drone.current;
    if (g) {
      g.visible = active || reduced;
      const at = along(route, smooth(span(t, 0.1, 0.9)));
      g.position.set(at.x, at.y + Math.sin(spin.current * 0.3) * 0.01, at.z);
    }
    if (!reduced && lit.current > 0) spin.current += Math.min(0.05, delta) * 40;
    rotors.current.forEach((m) => m && (m.rotation.y = spin.current));
  });
  return (
    <group>
      <Model model={model} swap={dim ? p.card : null} />
      <Tiles cells={cells} width={GC * 0.92} height={0.008} depth={GC * 0.92} base="#ebe5d9" t={run} dim={dim} colour={colour} />
      <group ref={drone} visible={false}>
        <mesh material={dim ? p.card : p.charcoal} castShadow>
          <boxGeometry args={[0.1, 0.035, 0.1]} />
        </mesh>
        {[
          [0.07, 0.07],
          [-0.07, 0.07],
          [0.07, -0.07],
          [-0.07, -0.07],
        ].map(([x, z], i) => (
          <mesh key={i} ref={(m) => void (rotors.current[i] = m)} position={[x, 0.03, z]} material={dim ? p.card : p.cyan}>
            <boxGeometry args={[0.1, 0.006, 0.014]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ---------- Resume Screener: redact, check evidence, cap the score ---------- */
export function Resume({ palette: p, active, dim, reduced }: LandmarkProps) {
  const model = useMemo(() => {
    const k = new Kit();
    briefPad(k, p.concrete, 1.7, 1.3);
    k.box(p.plaster, [1.56, 0.02, 1.16], [0, 0.03, 0]);
    // The stack of (synthetic) documents.
    for (let i = 0; i < 4; i++) k.box(p.card, [0.3, 0.014, 0.4], [-0.55, 0.05 + i * 0.016, 0.02], { ry: (i - 1.5) * 0.06 });
    // The redaction gate.
    for (const z of [-0.26, 0.26]) k.box(p.charcoal, [0.05, 0.4, 0.05], [-0.1, 0.05, z]);
    k.box(p.charcoal, [0.05, 0.05, 0.57], [-0.1, 0.45, 0]);
    // The evidence check: a plinth with a lens.
    k.box(p.concrete, [0.2, 0.12, 0.2], [0.3, 0.05, 0]);
    k.torus(p.steel, 0.07, 0.014, [0.3, 0.3, 0], { seg: 24 });
    k.box(p.steel, [0.016, 0.1, 0.016], [0.34, 0.2, 0.04], { rz: 0.8 });
    // The score gauge, with its cap marked.
    k.box(p.charcoal, [0.12, 0.55, 0.08], [0.68, 0.05, 0]);
    k.box(p.card, [0.07, 0.46, 0.012], [0.68, 0.09, 0.047]);
    k.box(p.coral, [0.12, 0.012, 0.012], [0.68, 0.09 + 0.46 * 0.72, 0.052]);
    return k.build();
  }, [p]);
  useDisposal(model);
  const run = usePlay(active, reduced, 3.6);
  const doc = useRef<THREE.Group>(null);
  const bars = useRef<THREE.Mesh>(null);
  const fill = useRef<THREE.Mesh>(null);
  const fillMat = useOwn(p.lime);
  useFrame(() => {
    const t = run.current;
    const g = doc.current;
    if (g) {
      g.visible = active || reduced;
      const x = -0.55 + 0.85 * smooth(span(t, 0, 0.65));
      g.position.set(x, 0.14, 0.02);
    }
    if (bars.current) bars.current.scale.x = Math.max(0.001, smooth(span(t, 0.28, 0.4)));
    const level = 0.6 * smooth(span(t, 0.7, 1));
    if (fill.current) {
      fill.current.visible = active || reduced;
      fill.current.scale.y = Math.max(0.01, level * 0.46);
      fill.current.position.y = 0.09 + (level * 0.46) / 2;
    }
    fillMat.setValues({ emissiveIntensity: 0.3 });
  });
  return (
    <group>
      <Model model={model} swap={dim ? p.card : null} />
      <group ref={doc} visible={false}>
        <mesh material={p.card} castShadow>
          <boxGeometry args={[0.3, 0.014, 0.4]} />
        </mesh>
        <mesh ref={bars} position={[0, 0.012, -0.04]} material={p.ink}>
          <boxGeometry args={[0.2, 0.01, 0.045]} />
        </mesh>
      </group>
      <mesh ref={fill} visible={false} position={[0.68, 0.2, 0.054]} material={dim ? p.card : fillMat}>
        <boxGeometry args={[0.06, 1, 0.012]} />
      </mesh>
    </group>
  );
}

/* ---------- The two blueprints: a design drawn on paper, with nothing behind it ---------- */
function useGhost(active: boolean, reduced: boolean) {
  const run = usePlay(active, reduced, 1.8);
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    // The drawing stands up briefly and settles back: a design, not a running system.
    const k = 0.35 + 0.65 * Math.sin(Math.PI * run.current);
    if (group.current) group.current.scale.y = reduced ? 0.35 : active ? Math.max(0.35, k) : 0.35;
  });
  return group;
}

function blueprintSheet(p: { card: THREE.Material; blueprint: THREE.Material }, ink: THREE.Material, solid: THREE.LineBasicMaterial, w: number, d: number) {
  const k = new Kit();
  k.box(p.card, [w, 0.012, d], [0, 0, 0]);
  k.line(ink as THREE.LineDashedMaterial, [
    [-w / 2 + 0.06, 0.016, -d / 2 + 0.06],
    [w / 2 - 0.06, 0.016, -d / 2 + 0.06],
    [w / 2 - 0.06, 0.016, d / 2 - 0.06],
    [-w / 2 + 0.06, 0.016, d / 2 - 0.06],
    [-w / 2 + 0.06, 0.016, -d / 2 + 0.06],
  ]);
  return { k, solid };
}

function useInk() {
  const ink = useMemo(
    () => new THREE.LineDashedMaterial({ color: "#2f4bff", dashSize: 0.05, gapSize: 0.035, transparent: true, opacity: 1 }),
    [],
  );
  const solid = useMemo(() => new THREE.LineBasicMaterial({ color: "#2f4bff", transparent: true, opacity: 1 }), []);
  useEffect(
    () => () => {
      ink.dispose();
      solid.dispose();
    },
    [ink, solid],
  );
  return { ink, solid };
}

/** Student Burnout AI: a questionnaire, an ensemble of models and a history, in drawing only. */
export function Burnout({ palette: p, active, dim, reduced }: LandmarkProps) {
  const { ink, solid } = useInk();
  const ghost = useGhost(active, reduced);
  const sheet = useMemo(() => {
    const { k } = blueprintSheet(p, ink, solid, 1.5, 1.2);
    return k.build();
  }, [p, ink, solid]);
  useDisposal(sheet);
  const solids = useMemo(() => {
    const k = new Kit();
    // The questionnaire: a stack of thin sheets.
    for (let i = 0; i < 3; i++) {
      k.box(p.blueprint, [0.4, 0.04, 0.3], [-0.45, 0.012 + i * 0.05, 0.1]);
      k.edges(solid, [0.4, 0.04, 0.3], [-0.45, 0.012 + i * 0.05, 0.1]);
    }
    // An ensemble of three models.
    for (const x of [-0.05, 0.15, 0.35]) {
      k.box(p.blueprint, [0.14, 0.45, 0.14], [x, 0.012, -0.2]);
      k.edges(solid, [0.14, 0.45, 0.14], [x, 0.012, -0.2]);
    }
    // The personal history.
    k.box(p.blueprint, [0.3, 0.1, 0.22], [0.45, 0.012, 0.3]);
    k.edges(solid, [0.3, 0.1, 0.22], [0.45, 0.012, 0.3]);
    k.line(ink, [
      [-0.3, 0.03, 0.1],
      [0.15, 0.03, 0.1],
      [0.15, 0.03, -0.1],
    ]);
    k.line(ink, [
      [0.15, 0.03, 0.0],
      [0.45, 0.03, 0.0],
      [0.45, 0.03, 0.2],
    ]);
    return k.build();
  }, [p, ink, solid]);
  useDisposal(solids);
  return (
    <group>
      <Model model={sheet} swap={dim ? p.card : null} />
      <group ref={ghost}>
        <Model model={solids} swap={dim ? p.card : null} />
      </group>
    </group>
  );
}

/** SIGSMITH: a locked contract, an evaluation frame and rule cards, as a drawing; nothing is built. */
export function Sigsmith({ palette: p, active, dim, reduced }: LandmarkProps) {
  const { ink, solid } = useInk();
  const ghost = useGhost(active, reduced);
  const sheet = useMemo(() => {
    const { k } = blueprintSheet(p, ink, solid, 1.5, 1.3);
    return k.build();
  }, [p, ink, solid]);
  useDisposal(sheet);
  const solids = useMemo(() => {
    const k = new Kit();
    // The locked task and evaluation contract: a plinth with a lock block.
    k.box(p.blueprint, [0.42, 0.08, 0.34], [-0.4, 0.012, -0.2]);
    k.edges(solid, [0.42, 0.08, 0.34], [-0.4, 0.012, -0.2]);
    k.box(p.blueprint, [0.14, 0.14, 0.1], [-0.4, 0.092, -0.2]);
    k.edges(solid, [0.14, 0.14, 0.1], [-0.4, 0.092, -0.2]);
    // The planned execution check: an open frame.
    k.box(p.blueprint, [0.05, 0.34, 0.05], [0.25, 0.012, -0.2]);
    k.box(p.blueprint, [0.05, 0.34, 0.05], [0.65, 0.012, -0.2]);
    k.box(p.blueprint, [0.45, 0.05, 0.05], [0.45, 0.35, -0.2]);
    for (const [x, y, w, h] of [
      [0.25, 0.012, 0.05, 0.34],
      [0.65, 0.012, 0.05, 0.34],
      [0.45, 0.35, 0.45, 0.05],
    ])
      k.edges(solid, [w, h, 0.05], [x, y, -0.2]);
    // Rule cards leaning against it.
    for (let i = 0; i < 4; i++) {
      k.box(p.blueprint, [0.26, 0.01, 0.18], [-0.35 + i * 0.07, 0.012 + i * 0.012, 0.3], { rx: -0.04 });
      k.edges(solid, [0.26, 0.01, 0.18], [-0.35 + i * 0.07, 0.012 + i * 0.012, 0.3]);
    }
    k.line(ink, [
      [-0.4, 0.03, -0.03],
      [-0.4, 0.03, 0.15],
    ]);
    k.line(ink, [
      [0.1, 0.03, 0.3],
      [0.45, 0.03, 0.3],
      [0.45, 0.03, -0.1],
    ]);
    return k.build();
  }, [p, ink, solid]);
  useDisposal(solids);
  return (
    <group>
      <Model model={sheet} swap={dim ? p.card : null} />
      <group ref={ghost}>
        <Model model={solids} swap={dim ? p.card : null} />
      </group>
    </group>
  );
}
