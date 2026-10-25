"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { depot, orders, sequenceRoute, type Point } from "@/lib/lastmile";
import { makeMaze, solveMaze } from "@/lib/maze";
import { resolvePenalty } from "@/lib/penalty";
import { COLS, potholes, ROWS, simulate, type Run } from "@/lib/swarm-sim";
import { Kit, Model, useDisposal, type V3 } from "./kit";
import { briefPad, exhibitPad, useOwn, type LandmarkProps } from "./landmark";
import { along, smooth, span, useLevel, usePlay } from "./motion";
import { Tiles } from "./tiles";

/*
 * The Algorithms district's five landmarks. Each is modelled on what its
 * project is and reacts once when it is in focus. Where the portfolio holds
 * the project's own algorithm (maze search, route sequencing, the zoned
 * coverage study), the reaction runs that code, so what moves is what the
 * adapted demonstration computes; the labels in the panel say which is which.
 * Under reduced motion every reaction jumps to its end state.
 */

/* ---------- Mazera: a maze board, searched breadth-first ---------- */
const MAZE_N = 9;
const MAZE_CELL = 2 / MAZE_N;

export function Mazera({ palette: p, active, dim, reduced }: LandmarkProps) {
  const { maze, open, rank, pathRank, total, pathLen } = useMemo(() => {
    const maze = makeMaze(7, MAZE_N, MAZE_N);
    const trace = solveMaze(maze, "BFS");
    const rank = new Map<number, number>();
    trace.visited.forEach((id, i) => rank.set(id, i));
    const pathRank = new Map<number, number>();
    trace.path.forEach((id, i) => pathRank.set(id, i));
    const open: number[] = [];
    maze.cells.forEach((wall, id) => {
      if (!wall) open.push(id);
    });
    return { maze, open, rank, pathRank, total: trace.visited.length, pathLen: trace.path.length };
  }, []);
  const at = (id: number): [number, number] => [((id % MAZE_N) - (MAZE_N - 1) / 2) * MAZE_CELL, (Math.floor(id / MAZE_N) - (MAZE_N - 1) / 2) * MAZE_CELL];
  const model = useMemo(() => {
    const k = new Kit();
    exhibitPad(k, p, 2.2, 2.2);
    k.box(p.concrete, [2.02, 0.03, 2.02], [0, 0.06, 0]);
    maze.cells.forEach((wall, id) => {
      if (!wall) return;
      const [x, z] = at(id);
      k.box(p.card, [MAZE_CELL * 0.98, 0.09, MAZE_CELL * 0.98], [x, 0.09, z], { r: 0.012 });
    });
    const [sx, sz] = at(maze.start);
    const [gx, gz] = at(maze.goal);
    k.box(p.lime, [MAZE_CELL * 0.8, 0.035, MAZE_CELL * 0.8], [sx, 0.09, sz]);
    k.cyl(p.charcoal, 0.012, 0.3, [gx, 0.09, gz], { seg: 6 });
    k.box(p.coral, [0.12, 0.08, 0.012], [gx + 0.06, 0.31, gz]);
    return k.build();
  }, [p, maze]);
  useDisposal(model);
  const run = usePlay(active, reduced, 3.4);
  const cells = useMemo<V3[]>(
    () =>
      open.map((id) => {
        const [x, z] = at(id);
        return [x, 0.0975, z] as V3;
      }),
    [open],
  );
  const colour = useMemo(() => {
    const searched = new THREE.Color(p.powder.color);
    const route = new THREE.Color(p.lime.color);
    return (i: number, t: number, out: THREE.Color) => {
      const id = open[i];
      const r = rank.get(id);
      if (r !== undefined && r / total <= span(t, 0, 0.62)) out.copy(searched);
      const pr = pathRank.get(id);
      if (pr !== undefined && pr / pathLen <= span(t, 0.62, 1)) out.copy(route);
      return true;
    };
  }, [p, open, rank, pathRank, total, pathLen]);
  return (
    <group>
      <Model model={model} swap={dim ? p.card : null} />
      <Tiles cells={cells} width={MAZE_CELL * 0.94} height={0.015} depth={MAZE_CELL * 0.94} base="#ebe5d9" t={run} dim={dim} colour={colour} />
    </group>
  );
}

/* ---------- PathAble: stairs that block, a ramp route that does not ---------- */
const ACCESS_ROUTE: V3[] = [
  [-0.85, 0.1, 0.85],
  [0.85, 0.1, 0.85],
  [0.85, 0.1, -0.85],
];

export function PathAble({ palette: p, active, dim, reduced }: LandmarkProps) {
  const warn = useOwn(p.amber);
  const route = useOwn(p.lime);
  const model = useMemo(() => {
    const k = new Kit();
    exhibitPad(k, p, 2.2, 2.2);
    k.box(p.concrete, [2.02, 0.03, 2.02], [0, 0.06, 0]);
    k.box(p.card, [0.7, 0.7, 0.6], [-0.55, 0.09, -0.5], { r: 0.03 });
    k.box(p.card, [0.5, 0.45, 0.5], [0.15, 0.09, -0.6], { r: 0.03 });
    k.box(p.card, [0.6, 0.3, 0.5], [0.3, 0.09, 0.3], { r: 0.03 });
    k.box(p.glassDark, [0.4, 0.12, 0.012], [-0.55, 0.4, -0.195]);
    // Stairs across the direct way from the entrance to the destination.
    for (let i = 0; i < 3; i++) k.box(p.concrete, [0.18, 0.04 + i * 0.04, 0.6], [-0.14 + i * 0.14, 0.09, 0.14 - i * 0.14], { ry: Math.PI / 4 });
    // The accessible way: a flat strip round the edge.
    for (let i = 0; i < ACCESS_ROUTE.length - 1; i++) {
      const a = ACCESS_ROUTE[i];
      const b = ACCESS_ROUTE[i + 1];
      const len = Math.hypot(b[0] - a[0], b[2] - a[2]);
      const yaw = Math.atan2(b[2] - a[2], b[0] - a[0]);
      k.box(route, [len + 0.1, 0.012, 0.1], [(a[0] + b[0]) / 2, 0.09, (a[2] + b[2]) / 2], { ry: -yaw });
    }
    // Entrance and destination markers.
    k.cyl(p.charcoal, 0.03, 0.04, [-0.85, 0.09, 0.85], { seg: 12 });
    k.cyl(p.coral, 0.06, 0.02, [0.85, 0.09, -0.85], { seg: 16 });
    // Barrier posts on the stairs, in the warning colour.
    for (const [x, z] of [
      [-0.33, 0.33],
      [0.33, -0.33],
    ])
      k.box(warn, [0.07, 0.2, 0.07], [x, 0.09, z], { r: 0.01 });
    return k.build();
  }, [p, route, warn]);
  useDisposal(model);
  const run = usePlay(active, reduced, 3.4);
  const lit = useLevel(active, reduced, 0.3, 0.6);
  const mover = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const t = run.current;
    warn.setValues({ emissiveIntensity: 0.05 + Math.sin(Math.PI * span(t, 0, 0.3)) * 1.1 * lit.current });
    route.setValues({ emissiveIntensity: 0.16 + smooth(span(t, 0.18, 0.4)) * 0.8 });
    const g = mover.current;
    if (g) {
      g.visible = active && t > 0.28;
      const at = along(ACCESS_ROUTE, smooth(span(t, 0.28, 1)));
      g.position.set(at.x, at.y + 0.04, at.z);
    }
  });
  return (
    <group>
      <Model model={model} swap={dim ? p.card : null} />
      <mesh ref={mover} visible={false} material={p.lime} castShadow>
        <sphereGeometry args={[0.06, 14, 10]} />
      </mesh>
    </group>
  );
}

/* ---------- Last Mile: a depot, eight parcels and a delivery loop ---------- */
const toLocal = (pt: Point): V3 => [((pt.x - 50) / 50) * 0.85, 0.07, ((pt.y - 50) / 50) * 0.85];
const LOOP = (() => {
  const points = [depot, ...orders];
  const { route } = sequenceRoute(points, "insertion");
  const order = route.length && route[route.length - 1] === route[0] ? route : [...route, route[0]];
  return order.map((i) => toLocal(points[i]));
})();

export function LastMile({ palette: p, active, dim, reduced }: LandmarkProps) {
  const lane = useOwn(p.steel);
  const model = useMemo(() => {
    const k = new Kit();
    briefPad(k, p.concrete, 2.2, 2.2);
    k.box(p.plaster, [2.0, 0.02, 2.0], [0, 0.03, 0]);
    for (let i = 0; i < LOOP.length - 1; i++) {
      const a = LOOP[i];
      const b = LOOP[i + 1];
      const len = Math.hypot(b[0] - a[0], b[2] - a[2]);
      const yaw = Math.atan2(b[2] - a[2], b[0] - a[0]);
      k.box(lane, [len, 0.01, 0.045], [(a[0] + b[0]) / 2, 0.05, (a[2] + b[2]) / 2], { ry: -yaw });
    }
    // The depot, and one parcel per order (taller where it is heavier).
    const [dx, , dz] = toLocal(depot);
    k.box(p.card, [0.34, 0.22, 0.3], [dx, 0.05, dz], { r: 0.02 });
    k.box(p.coral, [0.36, 0.03, 0.32], [dx, 0.27, dz]);
    orders.forEach((o) => {
      const [x, , z] = toLocal(o);
      k.box(p.card, [0.1, 0.05 + o.weight * 0.018, 0.1], [x, 0.05, z], { r: 0.012 });
    });
    return k.build();
  }, [p, lane]);
  useDisposal(model);
  const run = usePlay(active, reduced, 3.8);
  const van = useRef<THREE.Group>(null);
  useFrame(() => {
    const t = run.current;
    lane.setValues({ color: active ? "#c8f13b" : "#a9b0b9", emissive: "#a6cf1f", emissiveIntensity: active ? 0.4 : 0 });
    const g = van.current;
    if (g) {
      g.visible = active && t > 0;
      const at = along(LOOP, smooth(t));
      g.position.set(at.x, at.y, at.z);
      g.rotation.y = at.heading - Math.PI / 2;
    }
  });
  return (
    <group>
      <Model model={model} swap={dim ? p.card : null} />
      <group ref={van} visible={false}>
        <mesh position={[0, 0.05, 0]} material={p.charcoal} castShadow>
          <boxGeometry args={[0.1, 0.08, 0.17]} />
        </mesh>
        <mesh position={[0, 0.1, -0.02]} material={p.lime} castShadow>
          <boxGeometry args={[0.09, 0.04, 0.1]} />
        </mesh>
      </group>
    </group>
  );
}

/* ---------- ParkScan Swarm: three robots sweeping a lot in zones ---------- */
let zoned: Run | null = null;
const zonedRun = () => (zoned ??= simulate("zones"));
const LOT_CELL = 2 / COLS;
const lotAt = (x: number, y: number): V3 => [(x + 0.5 - COLS / 2) * LOT_CELL, 0.068, (y + 0.5 - ROWS / 2) * LOT_CELL];

export function ParkScan({ palette: p, active, dim, reduced }: LandmarkProps) {
  const sim = zonedRun();
  const model = useMemo(() => {
    const k = new Kit();
    briefPad(k, p.concrete, 2.2, 1.7);
    k.box(p.road, [2.04, 0.03, 1.4], [0, 0.03, 0]);
    // Bay lines, charging posts and the antenna of the central coordinator.
    for (let x = -0.9; x <= 0.91; x += 0.3) k.box(p.marking, [0.008, 0.004, 0.2], [x, 0.062, -0.5]);
    k.cyl(p.charcoal, 0.015, 0.45, [-0.95, 0.03, 0.6], { seg: 6 });
    k.sphere(p.cyan, 0.04, [-0.95, 0.5, 0.6], { seg: 10 });
    for (const x of [-0.7, 0, 0.7]) k.box(p.steel, [0.1, 0.05, 0.05], [x, 0.03, 0.74]);
    return k.build();
  }, [p]);
  useDisposal(model);
  const cells = useMemo(() => {
    const out: V3[] = [];
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) out.push(lotAt(x, y));
    return out;
  }, []);
  const run = usePlay(active, reduced, 4.2);
  const frames = sim.frames.length;
  const colour = useMemo(() => {
    const seen = new THREE.Color("#5fd3e6");
    return (i: number, t: number, out: THREE.Color) => {
      const first = sim.firstCovered[i];
      if (first >= 0 && first <= Math.floor(t * (frames - 1))) out.lerp(seen, 0.7);
      return true;
    };
  }, [sim, frames]);
  const robots = useRef<(THREE.Mesh | null)[]>([]);
  const finds = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(() => {
    const t = run.current;
    const f = sim.frames[Math.min(frames - 1, Math.floor(t * (frames - 1)))];
    robots.current.forEach((m, i) => {
      if (!m) return;
      m.visible = active && t > 0;
      const r = f.robots[i];
      const at = lotAt(r[0], r[1]);
      m.position.set(at[0], 0.1, at[2]);
    });
    finds.current.forEach((m, i) => {
      if (!m) return;
      m.visible = active && t > 0 && sim.foundAt[i] >= 0 && sim.foundAt[i] <= Math.floor(t * (frames - 1));
    });
  });
  return (
    <group>
      <Model model={model} swap={dim ? p.card : null} />
      <Tiles cells={cells} width={LOT_CELL * 0.92} height={0.012} depth={LOT_CELL * 0.92} base="#4a4f58" t={run} dim={dim} colour={colour} />
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(m) => void (robots.current[i] = m)} visible={false} material={p.lime} castShadow>
          <boxGeometry args={[0.1, 0.07, 0.1]} />
        </mesh>
      ))}
      {potholes.map(([x, y], i) => {
        const at = lotAt(x, y);
        return (
          <mesh key={i} ref={(m) => void (finds.current[i] = m)} visible={false} position={[at[0], 0.075, at[2]]} material={p.amber}>
            <cylinderGeometry args={[0.03, 0.03, 0.02, 10]} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ---------- Penalty Shootout: one kick, one dive ---------- */
export function Penalty({ palette: p, active, dim, reduced }: LandmarkProps) {
  const net = useOwn(p.card);
  const model = useMemo(() => {
    const k = new Kit();
    briefPad(k, p.concrete, 2.2, 2.2);
    k.box(p.moss, [2.0, 0.025, 2.0], [0, 0.03, 0]);
    for (const z of [-0.55, 0.9]) k.box(p.marking, [1.7, 0.004, 0.015], [0, 0.056, z]);
    k.torus(p.marking, 0.3, 0.006, [0, 0.058, 0.9], { seg: 32, arc: Math.PI, rz: 0, rx: Math.PI / 2 });
    // The goal: posts, bar and a back net.
    for (const x of [-0.45, 0.45]) k.box(p.card, [0.035, 0.34, 0.035], [x, 0.055, -0.62]);
    k.box(p.card, [0.935, 0.035, 0.035], [0, 0.395, -0.62]);
    k.box(net, [0.88, 0.3, 0.012], [0, 0.07, -0.78]);
    k.box(p.marking, [0.03, 0.004, 0.03], [0, 0.058, 0.3]);
    return k.build();
  }, [p, net]);
  useDisposal(model);
  // One shot, resolved by the study's own deterministic rule: aim right at moderate power, first round.
  const shot = useMemo(() => resolvePenalty("Right", 70, 0), []);
  const dir = (side: string) => (side === "Left" ? -1 : side === "Right" ? 1 : 0);
  const run = usePlay(active, reduced, 2.2);
  const ball = useRef<THREE.Mesh>(null);
  const keeper = useRef<THREE.Group>(null);
  useFrame(() => {
    const t = run.current;
    const kick = smooth(span(t, 0.1, 0.55));
    const b = ball.current;
    if (b) {
      // From the spot to the top-right corner, in an arc.
      b.position.set(0.3 * dir("Right") * kick, 0.075 + 0.18 * kick + Math.sin(Math.PI * kick) * 0.16, 0.3 + (-0.9 - 0.3) * kick);
      b.rotation.x = -kick * 9;
    }
    const kp = keeper.current;
    if (kp) {
      const dive = smooth(span(t, 0.2, 0.6));
      kp.position.set(0.28 * dir(shot.keeper) * dive, 0.06 + Math.sin(Math.PI * dive) * 0.06, -0.58);
      kp.rotation.z = -1.2 * dir(shot.keeper) * dive;
    }
    net.setValues({ emissive: "#c8f13b", emissiveIntensity: shot.result === "Goal" ? Math.sin(Math.PI * span(t, 0.5, 0.9)) * 0.6 : 0 });
  });
  return (
    <group>
      <Model model={model} swap={dim ? p.card : null} />
      <mesh ref={ball} position={[0, 0.075, 0.3]} material={dim ? p.card : p.card} castShadow>
        <sphereGeometry args={[0.045, 14, 10]} />
      </mesh>
      <group ref={keeper} position={[0, 0.06, -0.58]}>
        <mesh position={[0, 0.12, 0]} material={dim ? p.card : p.coral} castShadow>
          <boxGeometry args={[0.09, 0.17, 0.05]} />
        </mesh>
        <mesh position={[0, 0.25, 0]} material={dim ? p.card : p.peach} castShadow>
          <sphereGeometry args={[0.04, 10, 8]} />
        </mesh>
      </group>
    </group>
  );
}

