"use client";
import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { SiteMode } from "@/components/mode";
import {
  paths,
  places,
  samplePath,
  worldX,
  worldZ,
  type Feature,
  type Place,
  type Sample,
} from "../pathable-data";
import Stage3D, { type Framing, type FollowTarget } from "./stage";
import { Tag } from "./label";

const framing: Framing = {
  pro: { position: [0.8, 10.2, 12.6], target: [0.8, 0.1, 0.1] },
  creative: { position: [-9, 8.5, 9.5], target: [0.3, 0.1, 0.1] },
};

const N = 40;
type State = "route" | "excluded" | "open";
const ribbon: Record<State, string> = { route: "#2f4bf5", excluded: "#cfc8b4", open: "#ffffff" };

/** One path as a row of small blocks that follow its height profile. */
function Ribbon({ id, feature, a, state }: { id: string; feature: Feature; a: Place; state: State }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const samples = useMemo(() => samplePath(id, a, N), [id, a]);
  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < N; i++) {
      const p = samples[i];
      const q = samples[i + 1];
      // Stairs are flat treads at stepped heights; everything else follows the slope.
      const top = feature === "stairs" ? p.y : (p.y + q.y) / 2;
      const len = Math.hypot(q.x - p.x, q.z - p.z) * 1.04;
      dummy.position.set((p.x + q.x) / 2, top / 2 + 0.02, (p.z + q.z) / 2);
      dummy.rotation.set(0, -Math.atan2(q.z - p.z, q.x - p.x), 0);
      dummy.scale.set(len, top + 0.06, 1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }, [samples, feature]);
  const width = state === "route" ? 0.62 : 0.5;
  const mid = samples[Math.floor(N / 2)];
  return (
    <group>
      <instancedMesh ref={mesh} args={[undefined, undefined, N]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, width]} />
        <meshStandardMaterial color={ribbon[state]} roughness={0.85} transparent opacity={state === "excluded" ? 0.7 : 1} />
      </instancedMesh>
      {state === "excluded" && (
        <group position={[mid.x, mid.y + 0.75, mid.z]}>
          {[Math.PI / 4, -Math.PI / 4].map((r) => (
            <mesh key={r} rotation={[0, 0, r]}>
              <boxGeometry args={[0.5, 0.08, 0.08]} />
              <meshStandardMaterial color="#e0391a" emissive="#e0391a" emissiveIntensity={0.4} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

const roof = "#2f4bf5";
/** A recognisable stand-in for each destination. Not architecture, just legible. */
function Building({ id, onPick, picked }: { id: Place; onPick: (id: Place) => void; picked: boolean }) {
  const p = places[id];
  const x = worldX(p.x);
  const z = worldZ(p.y);
  const handlers = {
    onClick: (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      onPick(id);
    },
  };
  const ring = picked ? (
    <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.9, 1.0, 40]} />
      <meshBasicMaterial color="#ff6538" />
    </mesh>
  ) : null;
  switch (id) {
    case "library":
      return (
        <group position={[x + 0.9, 0, z - 0.4]} {...handlers}>
          <RoundedBox args={[1.6, 0.8, 1.1]} radius={0.05} position={[0, 0.4, 0]} castShadow><meshStandardMaterial color="#f3efe3" /></RoundedBox>
          <mesh position={[0, 0.86, 0]} castShadow><boxGeometry args={[1.7, 0.1, 1.2]} /><meshStandardMaterial color={roof} /></mesh>
          {[-0.5, -0.17, 0.17, 0.5].map((dx) => <mesh key={dx} position={[dx, 0.4, 0.57]}><boxGeometry args={[0.12, 0.5, 0.02]} /><meshStandardMaterial color="#8edbff" /></mesh>)}
          {ring}
        </group>
      );
    case "lab":
      return (
        <group position={[x, 0, z - 0.9]} {...handlers}>
          <RoundedBox args={[1.2, 1.2, 1.0]} radius={0.05} position={[0, 0.6, 0]} castShadow><meshStandardMaterial color="#e9eef7" /></RoundedBox>
          <mesh position={[0.3, 1.5, 0]}><cylinderGeometry args={[0.02, 0.02, 0.6, 6]} /><meshStandardMaterial color="#17171d" /></mesh>
          {[0.25, 0.65, 1.0].map((y) => <mesh key={y} position={[0, y, 0.51]}><boxGeometry args={[0.9, 0.12, 0.02]} /><meshStandardMaterial color="#2f4bf5" emissive="#2f4bf5" emissiveIntensity={0.25} /></mesh>)}
          {ring}
        </group>
      );
    case "hostel":
      return (
        <group position={[x + 0.6, 0, z]} {...handlers}>
          <RoundedBox args={[1.0, 1.5, 1.4]} radius={0.05} position={[0, 0.75, 0]} castShadow><meshStandardMaterial color="#ffe9c9" /></RoundedBox>
          {[0.3, 0.75, 1.2].map((y) => [-0.25, 0.25].map((dx) => <mesh key={`${y}${dx}`} position={[dx, y, 0.71]}><boxGeometry args={[0.2, 0.2, 0.02]} /><meshStandardMaterial color="#8edbff" /></mesh>))}
          {ring}
        </group>
      );
    case "cafe":
      return (
        <group position={[x - 0.6, 0, z]} {...handlers}>
          <RoundedBox args={[1.0, 0.6, 0.8]} radius={0.05} position={[0, 0.3, 0]} castShadow><meshStandardMaterial color="#ffd9c7" /></RoundedBox>
          <mesh position={[0, 0.66, 0.5]} rotation={[0.35, 0, 0]}><boxGeometry args={[1.1, 0.04, 0.5]} /><meshStandardMaterial color="#ff6538" /></mesh>
          {ring}
        </group>
      );
    case "carpark":
      return (
        <group position={[x + 0.3, 0, z + 0.2]} {...handlers}>
          <mesh position={[0, 0.03, 0]} receiveShadow><boxGeometry args={[1.8, 0.05, 1.0]} /><meshStandardMaterial color="#b9b4a5" /></mesh>
          {[-0.55, 0, 0.55].map((dx, i) => <RoundedBox key={dx} args={[0.35, 0.14, 0.2]} radius={0.04} position={[dx, 0.12, 0]}><meshStandardMaterial color={["#8c93a6", "#c9a46a", "#6f8f86"][i]} /></RoundedBox>)}
          {ring}
        </group>
      );
    case "quad":
      return (
        <group position={[x, 0, z]} {...handlers}>
          <mesh position={[0, 0.02, 0]} receiveShadow><cylinderGeometry args={[1.0, 1.0, 0.04, 40]} /><meshStandardMaterial color="#cfe0b6" /></mesh>
          <mesh position={[0, 0.3, 0]} castShadow><cylinderGeometry args={[0.05, 0.07, 0.5, 8]} /><meshStandardMaterial color="#8a6b4a" /></mesh>
          <mesh position={[0, 0.7, 0]} castShadow><sphereGeometry args={[0.38, 14, 12]} /><meshStandardMaterial color="#6fa36a" /></mesh>
          {ring}
        </group>
      );
    default:
      return (
        <group position={[x - 0.5, 0, z]} {...handlers}>
          {[-0.5, 0.5].map((dz) => <mesh key={dz} position={[0, 0.5, dz]} castShadow><boxGeometry args={[0.14, 1.0, 0.14]} /><meshStandardMaterial color="#2f4bf5" /></mesh>)}
          <mesh position={[0, 1.0, 0]}><boxGeometry args={[0.16, 0.16, 1.2]} /><meshStandardMaterial color="#2f4bf5" /></mesh>
          {ring}
        </group>
      );
  }
}

/** The walker. It follows the route's samples at a steady pace and reports when it arrives. */
function Walker({
  samples,
  runKey,
  wheelchair,
  followRef,
  tracking,
  onDone,
}: {
  samples: Sample[];
  runKey: number;
  wheelchair: boolean;
  followRef: FollowTarget;
  tracking: boolean;
  onDone: () => void;
}) {
  const group = useRef<THREE.Group>(null);
  const progress = useRef(0);
  const live = useRef(false);
  const lastKey = useRef(-1);
  const point = useRef(new THREE.Vector3());
  useFrame((_, delta) => {
    const g = group.current;
    if (!g || samples.length < 2) return;
    if (lastKey.current !== runKey) {
      lastKey.current = runKey;
      progress.current = 0;
      live.current = true;
    }
    if (live.current) {
      progress.current += delta * 5.2;
      if (progress.current >= samples.length - 1) {
        progress.current = samples.length - 1;
        live.current = false;
        followRef.current = null;
        onDone();
      }
    }
    const i = Math.min(samples.length - 2, Math.floor(progress.current));
    const f = progress.current - i;
    const a = samples[i];
    const b = samples[i + 1];
    g.position.set(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f + 0.06, a.z + (b.z - a.z) * f);
    g.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
    if (live.current && tracking) {
      point.current.copy(g.position);
      followRef.current = point.current;
    } else if (!live.current) followRef.current = null;
  });
  const start = samples[0];
  return (
    <group ref={group} position={start ? [start.x, start.y, start.z] : [0, 0, 0]}>
      <mesh position={[0, 0.28, 0]} castShadow><capsuleGeometry args={[0.1, 0.22, 4, 10]} /><meshStandardMaterial color="#ff6538" /></mesh>
      <mesh position={[0, 0.6, 0]} castShadow><sphereGeometry args={[0.09, 12, 10]} /><meshStandardMaterial color="#ffd3b8" /></mesh>
      {wheelchair &&
        [-0.13, 0.13].map((dz) => (
          <mesh key={dz} position={[0, 0.16, dz]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.15, 0.025, 8, 20]} />
            <meshStandardMaterial color="#17171d" />
          </mesh>
        ))}
    </group>
  );
}

export type CampusProps = {
  avoid: Feature[];
  closed: Set<string>;
  used: Set<string>;
  samples: Sample[];
  to: Place;
  walkKey: number;
  wheelchair: boolean;
  following: boolean;
  onWalkDone: () => void;
  onPick: (id: Place) => void;
  mode: SiteMode;
  paused: boolean;
  resetKey: number;
  busy: boolean;
  fallback: React.ReactNode;
};

export default function CampusCanvas(props: CampusProps) {
  const follow = useRef<THREE.Vector3 | null>(null);
  const routePoints = useMemo(
    () => props.samples.map((s) => new THREE.Vector3(s.x, s.y + 0.2, s.z)),
    [props.samples],
  );
  return (
    <Stage3D
      framing={framing}
      mode={props.mode}
      paused={props.paused}
      resetKey={props.resetKey}
      busy={props.busy}
      follow={follow}
      distance={[6, 26]}
      label="3D campus with a route from the main gate to the chosen destination. Paths the chosen travel profile cannot use are drawn pale with a red cross, and the route is drawn as a blue line. The text beside the scene gives the same route in words."
      fallback={props.fallback}
    >
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[19, 17]} />
        <meshStandardMaterial color="#cfc9b6" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[17.6, 15.6]} />
        <meshStandardMaterial color="#dcd7c5" />
      </mesh>
      {paths.map((p) => {
        const state: State = props.used.has(p.id) ? "route" : props.avoid.includes(p.feature) || props.closed.has(p.id) ? "excluded" : "open";
        return <Ribbon key={p.id} id={p.id} feature={p.feature} a={p.a} state={state} />;
      })}
      {paths.filter((p) => p.feature !== "flat").map((p) => {
        const s = samplePath(p.id, p.a, 2)[1];
        const word = props.closed.has(p.id) ? "blocked" : p.feature;
        return <Tag key={p.id} text={word} position={[s.x, s.y + 1.15, s.z]} tone={props.closed.has(p.id) ? "#e0391a" : "#4b5262"} height={0.4} />;
      })}
      {(Object.keys(places) as Place[]).map((id) => (
        <group key={id}>
          <Building id={id} onPick={props.onPick} picked={id === props.to} />
          <Tag text={places[id].label} position={[worldX(places[id].x), 2.05, worldZ(places[id].y)]} tone={id === "gate" || id === props.to ? "#2f4bf5" : "#17171d"} />
        </group>
      ))}
      {routePoints.length > 1 && <Line points={routePoints} color="#2f4bf5" lineWidth={4} />}
      <Walker
        samples={props.samples}
        runKey={props.walkKey}
        wheelchair={props.wheelchair}
        followRef={follow}
        tracking={props.following}
        onDone={props.onWalkDone}
      />
    </Stage3D>
  );
}
