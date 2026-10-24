"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { SiteMode } from "@/components/mode";
import {
  bays,
  DECK_Y,
  parked,
  ROW_Z,
  bayById,
  OTHER_BAY,
  TARGET_BAY,
  type Bay,
  type Pose,
  type Ray,
  type Tone,
  type View,
} from "../smartpark-data";
import Stage3D, { type Framing } from "./stage";

const framing: Framing = {
  pro: { position: [-0.5, 10.5, 13.2], target: [-0.6, 0.4, -0.2] },
  creative: { position: [-9.5, 8.5, 9.5], target: [-0.6, 0.4, -0.2] },
};

const toneColor: Record<Tone, string> = {
  free: "#cfe6d3",
  locked: "#ffc94d",
  taken: "#8fb0ff",
  conflict: "#ff5a36",
};
const BAY_W = 1.0;
const BAY_D = 1.8;

/** Drives a car towards a pose: along x first, then z, turning as it goes. */
function Car({ pose, color }: { pose: Pose; color: string }) {
  const group = useRef<THREE.Group>(null);
  const first = useRef(true);
  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    if (first.current) {
      g.position.set(pose.x, pose.y ?? 0, pose.z);
      g.rotation.y = pose.rot;
      first.current = false;
      return;
    }
    const speed = 2.6 * delta;
    const dx = pose.x - g.position.x;
    const dz = pose.z - g.position.z;
    let heading = pose.rot;
    if (Math.abs(dx) > 0.02) {
      g.position.x += Math.sign(dx) * Math.min(Math.abs(dx), speed);
      heading = dx > 0 ? 0 : Math.PI;
    } else if (Math.abs(dz) > 0.02) {
      g.position.z += Math.sign(dz) * Math.min(Math.abs(dz), speed);
      heading = dz > 0 ? -Math.PI / 2 : Math.PI / 2;
    }
    g.position.y = pose.y ?? 0;
    let turn = heading - g.rotation.y;
    turn = Math.atan2(Math.sin(turn), Math.cos(turn));
    g.rotation.y += turn * (1 - Math.exp(-delta * 9));
  });
  return (
    <group ref={group}>
      <RoundedBox args={[0.98, 0.24, 0.52]} radius={0.07} smoothness={3} position={[0, 0.22, 0]} castShadow>
        <meshStandardMaterial color={color} roughness={0.45} metalness={0.15} />
      </RoundedBox>
      <RoundedBox args={[0.5, 0.2, 0.44]} radius={0.07} smoothness={3} position={[-0.06, 0.42, 0]} castShadow>
        <meshStandardMaterial color="#e9eef7" roughness={0.25} metalness={0.1} />
      </RoundedBox>
      {[[-0.3, 0.27], [0.3, 0.27], [-0.3, -0.27], [0.3, -0.27]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.1, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.1, 14]} />
          <meshStandardMaterial color="#1c1d24" roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0.5, 0.24, 0]}>
        <boxGeometry args={[0.02, 0.06, 0.4]} />
        <meshStandardMaterial color="#fff6c8" emissive="#fff0a0" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

/** One parking bay: floor patch, painted edges, and a selectable hit area. */
function BaySlot({
  bay,
  tone,
  selected,
  onSelect,
}: {
  bay: Bay;
  tone: Tone | "plain";
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const color = tone === "plain" ? "#e6e1d3" : toneColor[tone];
  return (
    <group position={[bay.x, bay.y, bay.z]}>
      <mesh
        position={[0, 0.115, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(bay.id);
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "")}
        receiveShadow
      >
        <boxGeometry args={[BAY_W - 0.06, 0.03, BAY_D - 0.1]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * BAY_W) / 2, 0.125, 0]}>
          <boxGeometry args={[0.05, 0.02, BAY_D - 0.1]} />
          <meshStandardMaterial color="#fffdf5" />
        </mesh>
      ))}
      {selected && (
        <mesh position={[0, 0.16, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.52, 0.6, 4, 1, Math.PI / 4]} />
          <meshBasicMaterial color="#2f4bf5" />
        </mesh>
      )}
    </group>
  );
}

/** A padlock made of a box and a torus: reads as "locked" without colour. */
function Padlock({ bay }: { bay: Bay }) {
  return (
    <group position={[bay.x, bay.y + 0.75, bay.z]}>
      <mesh castShadow>
        <boxGeometry args={[0.34, 0.26, 0.2]} />
        <meshStandardMaterial color="#1c1d24" />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <torusGeometry args={[0.1, 0.03, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#1c1d24" />
      </mesh>
    </group>
  );
}

/** Two crossed bars over a bay that two sessions claim. */
function Cross({ bay }: { bay: Bay }) {
  return (
    <group position={[bay.x, bay.y + 0.95, bay.z]}>
      {[Math.PI / 4, -Math.PI / 4].map((r) => (
        <mesh key={r} rotation={[0, 0, r]}>
          <boxGeometry args={[0.62, 0.09, 0.09]} />
          <meshStandardMaterial color="#e0391a" emissive="#e0391a" emissiveIntensity={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function Request({ from, to, kind, color }: { from: Pose; to: Bay; kind: Exclude<Ray, null>; color: string }) {
  const points = useMemo(
    () => [new THREE.Vector3(from.x, 0.9, from.z), new THREE.Vector3(to.x, 0.5, to.z)],
    [from.x, from.z, to.x, to.z],
  );
  // A blocked request stops short of the bay, where the lock is.
  const end = kind === "dashed" ? points[0].clone().lerp(points[1], 0.62) : points[1];
  return <Line points={[points[0], end]} color={color} lineWidth={2.4} dashed={kind === "dashed"} dashSize={0.18} gapSize={0.12} />;
}

function Pillar({ x, z, h }: { x: number; z: number; h: number }) {
  return (
    <mesh position={[x, h / 2, z]} castShadow>
      <boxGeometry args={[0.22, h, 0.22]} />
      <meshStandardMaterial color="#cfc9b8" />
    </mesh>
  );
}

function Garage() {
  const ramp = useMemo(() => {
    const len = Math.hypot(2.4, DECK_Y);
    return { len, angle: Math.atan2(DECK_Y, 2.4) };
  }, []);
  return (
    <group>
      {/* ground slab and kerb */}
      <mesh position={[-1, 0, 0]} receiveShadow>
        <boxGeometry args={[14, 0.2, 9]} />
        <meshStandardMaterial color="#d8d3c4" roughness={0.95} />
      </mesh>
      <mesh position={[-1, 0.105, 0]} receiveShadow>
        <boxGeometry args={[13.6, 0.01, 2.0]} />
        <meshStandardMaterial color="#b9b4a5" roughness={1} />
      </mesh>
      {[-4.45, 4.45].map((z) => (
        <mesh key={z} position={[-1, 0.2, z]} castShadow>
          <boxGeometry args={[14, 0.2, 0.12]} />
          <meshStandardMaterial color="#bdb7a6" />
        </mesh>
      ))}
      {/* deck over the north bays, on pillars */}
      <mesh position={[-0.05, DECK_Y - 0.12, ROW_Z.north - 0.05]} castShadow receiveShadow>
        <boxGeometry args={[7.2, 0.22, 3.1]} />
        <meshStandardMaterial color="#dcd7c8" roughness={0.9} />
      </mesh>
      {[-3.4, 3.4].flatMap((x) => [ROW_Z.north - 1.5, ROW_Z.north + 1.45].map((z) => <Pillar key={`${x}${z}`} x={x} z={z} h={DECK_Y - 0.2} />))}
      {/* ramp at the east end up to the deck */}
      <mesh position={[5.0, DECK_Y / 2 + 0.02, ROW_Z.north]} rotation={[0, 0, ramp.angle]} castShadow receiveShadow>
        <boxGeometry args={[ramp.len, 0.16, 2.0]} />
        <meshStandardMaterial color="#c9c4b4" />
      </mesh>
      {/* entrance gate at the west end */}
      {[-1.1, 1.1].map((z) => (
        <mesh key={z} position={[-6.6, 0.7, z]} castShadow>
          <boxGeometry args={[0.18, 1.4, 0.18]} />
          <meshStandardMaterial color="#2f4bf5" />
        </mesh>
      ))}
      <mesh position={[-6.6, 1.4, 0]} castShadow>
        <boxGeometry args={[0.2, 0.18, 2.4]} />
        <meshStandardMaterial color="#2f4bf5" />
      </mesh>
    </group>
  );
}

export default function GarageCanvas({
  view,
  selected,
  onSelect,
  mode,
  paused,
  resetKey,
  busy,
  fallback,
}: {
  view: View;
  selected: string | null;
  onSelect: (id: string) => void;
  mode: SiteMode;
  paused: boolean;
  resetKey: number;
  busy: boolean;
  fallback: React.ReactNode;
}) {
  const target = bayById(TARGET_BAY);
  const parkedBays = new Set(parked.map((p) => p.bay));
  const toneFor = (bay: Bay): Tone | "plain" => {
    if (bay.id === TARGET_BAY) return view.tone;
    if (bay.id === OTHER_BAY && view.otherTaken) return "taken";
    return parkedBays.has(bay.id) ? "taken" : "plain";
  };
  return (
    <Stage3D
      framing={framing}
      mode={mode}
      paused={paused}
      resetKey={resetKey}
      busy={busy}
      distance={[7, 26]}
      label="3D parking garage with two levels. Two cars ask for bay A07: one receives it and the other either conflicts with it or is offered another bay, depending on the allocation method. The step text beside the scene says the same."
      fallback={fallback}
    >
      <Garage />
      {bays.map((bay) => (
        <BaySlot key={bay.id} bay={bay} tone={toneFor(bay)} selected={selected === bay.id} onSelect={onSelect} />
      ))}
      {parked.map((p) => {
        const b = bayById(p.bay);
        return <Car key={p.bay} color={p.color} pose={{ x: b.x, z: b.z, y: b.y, rot: -Math.PI / 2 }} />;
      })}
      <Car color="#ff6538" pose={view.car1} />
      <Car color="#2f4bf5" pose={view.car2} />
      {view.locked && <Padlock bay={target} />}
      {view.tone === "conflict" && <Cross bay={target} />}
      {view.ray1 && <Request from={view.car1} to={target} kind={view.ray1} color="#ff6538" />}
      {view.ray2 && <Request from={view.car2} to={target} kind={view.ray2} color="#2f4bf5" />}
    </Stage3D>
  );
}
