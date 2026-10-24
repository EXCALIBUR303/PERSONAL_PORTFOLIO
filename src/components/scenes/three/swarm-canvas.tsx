"use client";
import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { SiteMode } from "@/components/mode";
import { H, W, survivors, walls, type Frame } from "../swarm-data";
import Stage3D, { type Framing } from "./stage";
import { Tag } from "./label";

const S = 0.68;
const cx = (c: number) => ((c % W) - (W - 1) / 2) * S;
const cz = (c: number) => (Math.floor(c / W) - (H - 1) / 2) * S;
export const AGENT_COLORS = ["#ff6538", "#2f4bf5", "#e0399a", "#17a05b"];

const framing: Framing = {
  pro: { position: [0, 10.5, 9.8], target: [0, 0, 0.2] },
  creative: { position: [-8.5, 9, 8.5], target: [0, 0, 0.2] },
};

const FOG = new THREE.Color("#cdc8b9");
const SEEN = new THREE.Color("#8edbff");

/** Ground tiles: fog until a searcher has sensed them, then light blue. */
function Terrain({ seen }: { seen: Set<number> }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const cells = useMemo(() => Array.from({ length: W * H }, (_, c) => c).filter((c) => !walls.has(c)), []);
  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const d = new THREE.Object3D();
    cells.forEach((c, i) => {
      const lit = seen.has(c);
      d.position.set(cx(c), lit ? 0.04 : 0, cz(c));
      d.scale.set(1, lit ? 1.6 : 1, 1);
      d.updateMatrix();
      m.setMatrixAt(i, d.matrix);
      m.setColorAt(i, lit ? SEEN : FOG);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [cells, seen]);
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, cells.length]} receiveShadow>
      <boxGeometry args={[S * 0.94, 0.05, S * 0.94]} />
      <meshStandardMaterial roughness={0.9} />
    </instancedMesh>
  );
}

function Walls() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const list = useMemo(() => [...walls], []);
  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const d = new THREE.Object3D();
    list.forEach((c, i) => {
      d.position.set(cx(c), 0.35, cz(c));
      d.updateMatrix();
      m.setMatrixAt(i, d.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  }, [list]);
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, list.length]} castShadow receiveShadow>
      <boxGeometry args={[S * 0.96, 0.7, S * 0.96]} />
      <meshStandardMaterial color="#8d8a7d" roughness={0.9} />
    </instancedMesh>
  );
}

function Survivor({ cell, found }: { cell: number; found: boolean }) {
  return (
    <group position={[cx(cell), 0, cz(cell)]}>
      {found ? (
        <>
          <mesh position={[0, 0.3, 0]} castShadow>
            <sphereGeometry args={[0.2, 16, 12]} />
            <meshStandardMaterial color="#c8f13b" emissive="#9ed100" emissiveIntensity={0.7} />
          </mesh>
          <mesh position={[0, 1.1, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 1.6, 6]} />
            <meshBasicMaterial color="#c8f13b" />
          </mesh>
        </>
      ) : (
        <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.16, 0.22, 20]} />
          <meshBasicMaterial color="#8a8678" />
        </mesh>
      )}
    </group>
  );
}

function Rover({ cell, color, label, selected, onSelect }: { cell: number; color: string; label: string; selected: boolean; onSelect: () => void }) {
  const group = useRef<THREE.Group>(null);
  const first = useRef(true);
  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const tx = cx(cell);
    const tz = cz(cell);
    if (first.current) {
      g.position.set(tx, 0.08, tz);
      first.current = false;
      return;
    }
    const dx = tx - g.position.x;
    const dz = tz - g.position.z;
    const k = 1 - Math.exp(-delta * 12);
    g.position.x += dx * k;
    g.position.z += dz * k;
    if (Math.hypot(dx, dz) > 0.05) {
      let turn = -Math.atan2(dz, dx) - g.rotation.y;
      turn = Math.atan2(Math.sin(turn), Math.cos(turn));
      g.rotation.y += turn * k;
    }
  });
  return (
    <group
      ref={group}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <RoundedBox args={[0.42, 0.18, 0.3]} radius={0.05} position={[0, 0.16, 0]} castShadow>
        <meshStandardMaterial color={color} roughness={0.5} />
      </RoundedBox>
      <mesh position={[0.04, 0.3, 0]} castShadow>
        <sphereGeometry args={[0.1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#f4f1e6" />
      </mesh>
      {[[-0.14, 0.17], [0.14, 0.17], [-0.14, -0.17], [0.14, -0.17]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.06, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.05, 10]} />
          <meshStandardMaterial color="#1c1d24" />
        </mesh>
      ))}
      {selected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.34, 0.4, 24]} />
          <meshBasicMaterial color="#17171d" />
        </mesh>
      )}
      <Tag text={label} position={[0, 0.62, 0]} height={0.28} tone={color} />
    </group>
  );
}

export default function SwarmCanvas({
  frames,
  step,
  selected,
  onSelect,
  mode,
  paused,
  resetKey,
  busy,
  fallback,
}: {
  frames: Frame[];
  step: number;
  selected: number | null;
  onSelect: (i: number | null) => void;
  mode: SiteMode;
  paused: boolean;
  resetKey: number;
  busy: boolean;
  fallback: React.ReactNode;
}) {
  const frame = frames[step];
  const trails = useMemo(
    () =>
      frame.agents.map((_, i) => {
        const pts: THREE.Vector3[] = [];
        let last = -1;
        for (let t = 0; t <= step; t++) {
          const c = frames[t].agents[i];
          if (c === last) continue;
          last = c;
          pts.push(new THREE.Vector3(cx(c), 0.12 + i * 0.012, cz(c)));
        }
        return pts;
      }),
    [frames, step, frame.agents],
  );
  return (
    <Stage3D
      framing={framing}
      mode={mode}
      paused={paused}
      resetKey={resetKey}
      busy={busy}
      distance={[5, 22]}
      label="3D search area with four numbered searchers leaving coloured trails. Cells they have sensed turn light blue, walls are grey blocks, and survivors become green beacons when found. The counts beside it give the same progress."
      fallback={fallback}
    >
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} receiveShadow>
        <planeGeometry args={[W * S + 1.2, H * S + 1.2]} />
        <meshStandardMaterial color="#b9b4a5" />
      </mesh>
      <Terrain seen={frame.seen} />
      <Walls />
      {survivors.map((s) => (
        <Survivor key={s} cell={s} found={frame.seen.has(s)} />
      ))}
      {trails.map(
        (pts, i) =>
          pts.length > 1 && (
            <Line key={i} points={pts} color={AGENT_COLORS[i]} lineWidth={selected === i ? 5 : 2.4} transparent opacity={selected === null || selected === i ? 1 : 0.35} />
          ),
      )}
      {frame.agents.map((cell, i) => (
        <Rover key={i} cell={cell} color={AGENT_COLORS[i]} label={String(i + 1)} selected={selected === i} onSelect={() => onSelect(selected === i ? null : i)} />
      ))}
    </Stage3D>
  );
}
