"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { SiteMode } from "@/components/mode";
import { trot, type DogCommand } from "../dog-data";
import Stage3D, { type Framing } from "./stage";

const INK = "#17171d";
const BODY = "#e9a38a";
const framing: Framing = {
  pro: { position: [2.9, 1.9, 3.2], target: [0, 0.45, 0] },
  creative: { position: [-3.1, 1.15, 3.1], target: [0.2, 0.55, 0] },
};
const HIPS: [number, number, number][] = [
  [0.42, 0, 0.2],
  [0.42, 0, -0.2],
  [-0.42, 0, 0.2],
  [-0.42, 0, -0.2],
];
const UPPER = 0.32;
const LOWER = 0.32;

type Leg = { abd: THREE.Group; hip: THREE.Group; knee: THREE.Group };

function LegMesh({ at, legRef }: { at: [number, number, number]; legRef: (leg: Leg) => void }) {
  const abd = useRef<THREE.Group>(null);
  const hip = useRef<THREE.Group>(null);
  const knee = useRef<THREE.Group>(null);
  return (
    <group
      position={at}
      ref={(node) => {
        if (node && abd.current && hip.current && knee.current)
          legRef({ abd: abd.current, hip: hip.current, knee: knee.current });
      }}
    >
      <group ref={abd}>
        <group ref={hip}>
          <mesh castShadow>
            <sphereGeometry args={[0.07, 12, 12]} />
            <meshStandardMaterial color={INK} />
          </mesh>
          <mesh position={[0, -UPPER / 2, 0]} castShadow>
            <capsuleGeometry args={[0.05, UPPER - 0.1, 4, 8]} />
            <meshStandardMaterial color={BODY} />
          </mesh>
          <group ref={knee} position={[0, -UPPER, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.055, 12, 12]} />
              <meshStandardMaterial color={INK} />
            </mesh>
            <mesh position={[0, -LOWER / 2, 0]} castShadow>
              <capsuleGeometry args={[0.04, LOWER - 0.08, 4, 8]} />
              <meshStandardMaterial color={INK} />
            </mesh>
            <mesh position={[0, -LOWER, 0]} castShadow>
              <sphereGeometry args={[0.055, 12, 12]} />
              <meshStandardMaterial color="#2f4bf5" />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

const MARKERS: [number, number][] = [
  [2, 1.5], [-3, -2], [4, -3], [-1, 3.5], [5, 2], [-4.5, 1], [1, -4], [-2.5, -4.5],
];

function Dog({
  command,
  joints,
}: {
  command: DogCommand;
  joints: React.RefObject<number[]>;
}) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Mesh>(null);
  const grid = useRef<THREE.Group>(null);
  const markers = useRef<THREE.Group>(null);
  const legs = useRef<(Leg | null)[]>([null, null, null, null]);
  const sim = useRef({ x: 0, z: 0, yaw: 0, speed: 0, turn: 0, phase: 0 });
  const targets = useMemo(() => new Array(12).fill(0) as number[], []);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const s = sim.current;
    const k = 1 - Math.exp(-delta * 4);
    s.speed += (command.speed - s.speed) * k;
    s.turn += (command.turn - s.turn) * k;
    const amount = Math.min(1, Math.abs(s.speed) / 0.6 + Math.abs(s.turn) * 0.6);
    s.phase += delta * 9 * amount * (s.speed < -0.02 ? -1 : 1);
    s.yaw += s.turn * delta * 1.1;
    s.x += Math.cos(s.yaw) * s.speed * delta * 1.4;
    s.z -= Math.sin(s.yaw) * s.speed * delta * 1.4;

    trot(s.phase, amount, s.turn, targets);
    legs.current.forEach((leg, i) => {
      if (!leg) return;
      leg.abd.rotation.x = targets[i * 3];
      leg.hip.rotation.z = targets[i * 3 + 1];
      leg.knee.rotation.z = targets[i * 3 + 2];
    });
    if (joints.current) targets.forEach((v, i) => (joints.current[i] = v));
    if (root.current) root.current.rotation.y = s.yaw;
    if (body.current) {
      body.current.position.y = 0.7 + amount * 0.025 * Math.abs(Math.sin(s.phase * 2));
      body.current.rotation.x = s.turn * 0.06;
    }
    if (tail.current) tail.current.rotation.y = Math.sin(s.phase * 2) * 0.4 * amount + 0.1;
    // The dog stays centred and the ground moves under it.
    if (grid.current) grid.current.position.set(-(s.x % 1), 0, -(s.z % 1));
    markers.current?.children.forEach((child, i) => {
      const [mx, mz] = MARKERS[i];
      const wrap = (v: number) => ((((v + 6) % 12) + 12) % 12) - 6;
      child.position.set(wrap(mx - s.x), 0, wrap(mz - s.z));
    });
  });

  return (
    <>
      <group ref={grid}>
        <gridHelper args={[16, 16, INK, "#b9b3a3"]} />
      </group>
      <group ref={markers}>
        {MARKERS.map((_, i) => (
          <mesh key={i} position={[0, 0.15, 0]} castShadow>
            <coneGeometry args={[0.1, 0.3, 12]} />
            <meshStandardMaterial color={i % 2 ? "#ff6538" : "#2f4bf5"} />
          </mesh>
        ))}
      </group>
      <group ref={root}>
        <group ref={body} position={[0, 0.7, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.0, 0.24, 0.42]} />
            <meshStandardMaterial color={BODY} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.13, 0]} castShadow>
            <boxGeometry args={[0.6, 0.04, 0.3]} />
            <meshStandardMaterial color={INK} />
          </mesh>
          <group position={[0.58, 0.14, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.26, 0.2, 0.24]} />
              <meshStandardMaterial color={BODY} />
            </mesh>
            {[0.07, -0.07].map((z) => (
              <mesh key={z} position={[0.131, 0.03, z]}>
                <boxGeometry args={[0.01, 0.04, 0.04]} />
                <meshStandardMaterial color={INK} />
              </mesh>
            ))}
            {[0.08, -0.08].map((z) => (
              <mesh key={z} position={[-0.04, 0.15, z]} rotation={[0, 0, -0.2]} castShadow>
                <coneGeometry args={[0.04, 0.12, 4]} />
                <meshStandardMaterial color={INK} />
              </mesh>
            ))}
          </group>
          <mesh ref={tail} position={[-0.55, 0.08, 0]} rotation={[0, 0, 0.7]} castShadow>
            <capsuleGeometry args={[0.025, 0.22, 4, 8]} />
            <meshStandardMaterial color={INK} />
          </mesh>
          {HIPS.map((at, i) => (
            <LegMesh
              key={i}
              at={[at[0], -0.1, at[2]]}
              legRef={(leg) => (legs.current[i] = leg)}
            />
          ))}
        </group>
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} receiveShadow>
        <circleGeometry args={[7, 48]} />
        <meshStandardMaterial color="#efeadf" />
      </mesh>
    </>
  );
}

export default function DogCanvas({
  command,
  joints,
  mode,
  paused,
  resetKey,
  fallback,
}: {
  command: DogCommand;
  joints: React.RefObject<number[]>;
  mode: SiteMode;
  paused: boolean;
  resetKey: number;
  fallback: React.ReactNode;
}) {
  return (
    <Stage3D
      framing={framing}
      mode={mode}
      paused={paused}
      resetKey={resetKey}
      distance={[2.5, 9]}
      label={`3D robot dog, currently: ${command.reply.replace(".", "").toLowerCase()}. The command steps beside it describe the same thing.`}
      fallback={fallback}
    >
      <Dog command={command} joints={joints} />
    </Stage3D>
  );
}
