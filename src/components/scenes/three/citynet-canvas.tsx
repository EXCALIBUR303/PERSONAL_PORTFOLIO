"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { SiteMode } from "@/components/mode";
import { depot, dist, orders, type Order, type Point } from "@/lib/lastmile";
import Stage3D, { type Framing, type FollowTarget } from "./stage";
import { Tag } from "./label";

const SCALE = 0.13;
const wx = (x: number) => (x - 50) * SCALE;
const wz = (y: number) => (y - 50) * SCALE;

const framing: Framing = {
  pro: { position: [0, 10.5, 11], target: [0, 0, 0.4] },
  creative: { position: [-9, 9, 9], target: [0, 0, 0.4] },
};

/** A road between two map points: one flat slab, so it reads as a graph edge. */
function Road({ a, b, color, width = 0.2, label }: { a: Point; b: Point; color: string; width?: number; label?: string }) {
  const x1 = wx(a.x), z1 = wz(a.y), x2 = wx(b.x), z2 = wz(b.y);
  const len = Math.hypot(x2 - x1, z2 - z1);
  return (
    <group>
      <mesh position={[(x1 + x2) / 2, 0.05, (z1 + z2) / 2]} rotation={[0, -Math.atan2(z2 - z1, x2 - x1), 0]} receiveShadow>
        <boxGeometry args={[len, 0.05, width]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {label && <Tag text={label} position={[(x1 + x2) / 2, 0.55, (z1 + z2) / 2]} height={0.34} />}
    </group>
  );
}

/** Quiet city blocks, kept away from the stops so they never hide the graph. */
function Blocks() {
  const blocks = useMemo(() => {
    const all = [{ x: 50, y: 50 }, ...orders];
    const out: { x: number; z: number; w: number; h: number; d: number; c: string }[] = [];
    let seed = 11;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let gx = 6; gx < 100; gx += 14)
      for (let gy = 6; gy < 100; gy += 14) {
        if (all.some((p) => Math.hypot(p.x - gx, p.y - gy) < 13)) continue;
        out.push({ x: wx(gx), z: wz(gy), w: 1.0 + rnd() * 0.5, d: 1.0 + rnd() * 0.5, h: 0.2 + rnd() * 0.55, c: ["#e2ddcc", "#d8d3c2", "#e8e3d4"][Math.floor(rnd() * 3)] });
      }
    return out;
  }, []);
  return (
    <group>
      {blocks.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, b.z]} castShadow receiveShadow>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial color={b.c} roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

function Parcel({ order, state, caption }: { order: Order; state: "plain" | "chosen" | "left"; caption?: string }) {
  const s = 0.26 + order.weight * 0.045;
  const color = state === "left" ? "#bdb8a8" : state === "chosen" ? "#ff6538" : "#d9a066";
  return (
    <group position={[wx(order.x), 0, wz(order.y)]}>
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <cylinderGeometry args={[0.55, 0.55, 0.08, 24]} />
        <meshStandardMaterial color={state === "chosen" ? "#2f4bf5" : "#cfc9b8"} />
      </mesh>
      <RoundedBox args={[s, s, s]} radius={0.04} position={[0, 0.1 + s / 2, 0]} castShadow>
        <meshStandardMaterial color={color} roughness={0.7} />
      </RoundedBox>
      {state === "left" && (
        <group position={[0, 0.9, 0]}>
          {[Math.PI / 4, -Math.PI / 4].map((r) => (
            <mesh key={r} rotation={[0, 0, r]}>
              <boxGeometry args={[0.45, 0.07, 0.07]} />
              <meshStandardMaterial color="#8a8678" />
            </mesh>
          ))}
        </group>
      )}
      <Tag text={caption ? `${order.id} · ${caption}` : order.id} position={[0, 1.45, 0]} height={0.36} tone={state === "chosen" ? "#2f4bf5" : "#17171d"} />
    </group>
  );
}

function Van({ loop, running, runKey, followRef, tracking }: { loop: THREE.Vector3[]; running: boolean; runKey: number; followRef: FollowTarget; tracking: boolean }) {
  const group = useRef<THREE.Group>(null);
  const t = useRef(0);
  const lastKey = useRef(runKey);
  const lengths = useMemo(() => {
    const segs = loop.slice(1).map((p, i) => p.distanceTo(loop[i]));
    return { segs, total: segs.reduce((a, b) => a + b, 0) };
  }, [loop]);
  const tmp = useRef(new THREE.Vector3());
  useFrame((_, delta) => {
    const g = group.current;
    if (!g || loop.length < 2) return;
    if (lastKey.current !== runKey) {
      lastKey.current = runKey;
      t.current = 0;
    }
    if (running) t.current = (t.current + delta * 1.6) % Math.max(0.001, lengths.total);
    else t.current = 0;
    let d = t.current;
    let i = 0;
    while (i < lengths.segs.length - 1 && d > lengths.segs[i]) d -= lengths.segs[i++];
    const a = loop[i];
    const b = loop[i + 1];
    const f = lengths.segs[i] ? d / lengths.segs[i] : 0;
    g.position.set(a.x + (b.x - a.x) * f, 0.1, a.z + (b.z - a.z) * f);
    g.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
    if (running && tracking) {
      tmp.current.copy(g.position);
      followRef.current = tmp.current;
    } else followRef.current = null;
  });
  const start = loop[0];
  return (
    <group ref={group} position={start ? [start.x, 0.1, start.z] : [0, 0.1, 0]}>
      <RoundedBox args={[0.9, 0.42, 0.5]} radius={0.06} position={[-0.1, 0.34, 0]} castShadow>
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </RoundedBox>
      <RoundedBox args={[0.32, 0.32, 0.46]} radius={0.06} position={[0.42, 0.3, 0]} castShadow>
        <meshStandardMaterial color="#2f4bf5" />
      </RoundedBox>
      <mesh position={[-0.1, 0.4, 0.255]}>
        <boxGeometry args={[0.6, 0.12, 0.01]} />
        <meshStandardMaterial color="#2f4bf5" />
      </mesh>
      {[[-0.4, 0.27], [0.35, 0.27], [-0.4, -0.27], [0.35, -0.27]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.1, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.1, 14]} />
          <meshStandardMaterial color="#1c1d24" />
        </mesh>
      ))}
    </group>
  );
}

export type CityProps = {
  points: Point[];
  chosenIds: Set<string>;
  stage: number;
  treeEdges: [number, number][];
  route: number[];
  driveKey: number;
  following: boolean;
  mode: SiteMode;
  paused: boolean;
  resetKey: number;
  busy: boolean;
  fallback: React.ReactNode;
};

export default function CityNetCanvas(p: CityProps) {
  const follow = useRef<THREE.Vector3 | null>(null);
  const loop = useMemo(() => {
    const seq = [...p.route, p.route[0]];
    return seq.map((i) => new THREE.Vector3(wx(p.points[i].x), 0.1, wz(p.points[i].y)));
  }, [p.route, p.points]);
  return (
    <Stage3D
      framing={framing}
      mode={p.mode}
      paused={p.paused}
      resetKey={p.resetKey}
      busy={p.busy}
      follow={follow}
      distance={[6, 24]}
      label="3D delivery district: a depot, eight parcels and the roads between them. The stages choose parcels for the van, join them with a minimum spanning tree, then drive a chosen route. The text beside the scene gives the same numbers."
      fallback={p.fallback}
    >
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color="#cfc9b6" />
      </mesh>
      <Blocks />
      {p.stage === 2 &&
        p.treeEdges.map(([a, b]) => (
          <Road key={`${a}-${b}`} a={p.points[a]} b={p.points[b]} color="#2f4bf5" label={dist(p.points[a], p.points[b]).toFixed(0)} />
        ))}
      {p.stage === 3 &&
        p.route.map((idx, k) => {
          const next = p.route[(k + 1) % p.route.length];
          return <Road key={`${idx}-${next}`} a={p.points[idx]} b={p.points[next]} color="#ff6538" width={0.26} label={dist(p.points[idx], p.points[next]).toFixed(0)} />;
        })}
      {orders.map((o) => {
        const chosen = p.chosenIds.has(o.id);
        const state = p.stage >= 1 ? (chosen ? "chosen" : "left") : "plain";
        return <Parcel key={o.id} order={o} state={state} caption={p.stage <= 1 ? `${o.weight}kg · ${o.value}` : undefined} />;
      })}
      <group position={[wx(depot.x), 0, wz(depot.y)]}>
        <RoundedBox args={[1.5, 0.7, 1.1]} radius={0.05} position={[0, 0.35, 0]} castShadow>
          <meshStandardMaterial color="#e9eef7" />
        </RoundedBox>
        <mesh position={[0, 0.76, 0]} castShadow>
          <boxGeometry args={[1.6, 0.1, 1.2]} />
          <meshStandardMaterial color="#2f4bf5" />
        </mesh>
        <Tag text="Depot" position={[0, 1.45, 0]} tone="#2f4bf5" height={0.4} />
      </group>
      <Van loop={loop} running={p.stage === 3} runKey={p.driveKey} followRef={follow} tracking={p.following} />
    </Stage3D>
  );
}
