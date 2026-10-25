"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { SiteMode } from "@/components/mode";
import type { Scored } from "../retrieval-data";
import Stage3D, { type Framing } from "./stage";
import { Tag } from "./label";

const framing: Framing = {
  pro: { position: [1.0, 6.8, 12.4], target: [0.6, 0.7, 0.2] },
  creative: { position: [-8.5, 6.2, 9.8], target: [0.6, 0.7, 0.2] },
};

const R = 3.1;
const FENCE = new THREE.BoxGeometry(1.3, 1.5, 0.4);
const CORE = new THREE.Vector3(0, 1.5, 0);
const PEDESTAL = new THREE.Vector3(3.3, 1.35, 0.2);

/** Slot i of n on an arc on the document side of the chamber. */
function slot(i: number, n: number): THREE.Vector3 {
  const a = Math.PI * (0.62 + (0.76 * i) / Math.max(1, n - 1));
  return new THREE.Vector3(Math.cos(a) * R, 0.85, Math.sin(a) * R);
}
/** "lab-handbook.pdf · p. 2" becomes "lab · p. 2": short enough to sit above a slab. */
const shortName = (source: string) => source.replace(/^(\w+)[^\s]*/, "$1");
const faceCentre = (p: THREE.Vector3) => Math.atan2(-p.x, -p.z);

function Slab({
  item,
  target,
  rot,
  step,
  top,
  selected,
  onSelect,
  index,
}: {
  item: Scored;
  target: THREE.Vector3;
  rot: number;
  step: number;
  top: boolean;
  selected: boolean;
  onSelect: (i: number) => void;
  index: number;
}) {
  const group = useRef<THREE.Group>(null);
  const first = useRef(true);
  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    if (first.current) {
      g.position.copy(target);
      g.rotation.y = rot;
      first.current = false;
      return;
    }
    const k = 1 - Math.exp(-delta * 5);
    g.position.lerp(target, k);
    let turn = rot - g.rotation.y;
    turn = Math.atan2(Math.sin(turn), Math.cos(turn));
    g.rotation.y += turn * k;
  });
  const kw = Math.max(0.03, item.keyword) * 0.9;
  const dn = Math.max(0.03, item.dense) * 0.9;
  const hot = top && step >= 2;
  return (
    <group ref={group}>
      <RoundedBox
        args={[1.05, 1.25, 0.07]}
        radius={0.03}
        smoothness={3}
        castShadow
        onClick={(e) => {
          e.stopPropagation();
          onSelect(index);
        }}
      >
        <meshStandardMaterial color={hot ? "#fff3c2" : "#fbf8ee"} roughness={0.6} emissive={selected ? "#2f4bf5" : "#000000"} emissiveIntensity={selected ? 0.25 : 0} />
      </RoundedBox>
      {[0.38, 0.14, -0.1, -0.34].map((y, i) => (
        <mesh key={y} position={[i % 2 ? 0.05 : 0, y + 0.18, 0.045]}>
          <boxGeometry args={[0.72 - (i % 2) * 0.2, 0.05, 0.01]} />
          <meshStandardMaterial color="#b9b4a5" />
        </mesh>
      ))}
      {step >= 1 && (
        <>
          <mesh position={[-0.3, -0.62 + kw / 2 - 0.02, 0.13]}>
            <boxGeometry args={[0.14, kw, 0.1]} />
            <meshStandardMaterial color="#2f4bf5" />
          </mesh>
          <mesh position={[0.3, -0.62 + dn / 2 - 0.02, 0.13]}>
            <boxGeometry args={[0.14, dn, 0.1]} />
            <meshStandardMaterial color="#ff6538" />
          </mesh>
        </>
      )}
      <Tag text={shortName(item.source)} position={[0, 0.95, 0]} height={0.28} />
    </group>
  );
}

function Core({ active }: { active: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * (active ? 1.2 : 0.35);
  });
  return (
    <group position={CORE}>
      <group ref={ref}>
        <mesh>
          <icosahedronGeometry args={[0.62, 1]} />
          <meshStandardMaterial color="#2f4bf5" wireframe />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[0.38, 0]} />
          <meshStandardMaterial color="#8edbff" emissive="#2f4bf5" emissiveIntensity={active ? 1.1 : 0.4} />
        </mesh>
      </group>
      <mesh position={[0, -1.1, 0]}>
        <cylinderGeometry args={[0.16, 0.3, 0.9, 12]} />
        <meshStandardMaterial color="#cfc9b8" />
      </mesh>
    </group>
  );
}

export default function VaultCanvas({
  scored,
  step,
  selected,
  onSelect,
  mode,
  paused,
  resetKey,
  busy,
  fallback,
}: {
  scored: Scored[];
  step: number;
  selected: number | null;
  onSelect: (i: number | null) => void;
  mode: SiteMode;
  paused: boolean;
  resetKey: number;
  busy: boolean;
  fallback: React.ReactNode;
}) {
  const n = scored.length;
  const rank = useMemo(() => {
    const order = scored.map((s, i) => i).sort((a, b) => scored[a].place - scored[b].place);
    return order.reduce<number[]>((r, idx, place) => ((r[idx] = place), r), []);
  }, [scored]);
  const topIndex = rank.indexOf(0);
  const targets = scored.map((_, i) => {
    const place = step >= 2 ? rank[i] : i;
    const p = slot(place, n);
    if (step >= 2 && i === topIndex) p.y += 0.3;
    if (step >= 4 && i === topIndex) return PEDESTAL.clone();
    return p;
  });
  const beams = scored.map((s, i) => ({
    from: targets[i].clone(),
    weight: step >= 2 ? s.total : (s.keyword + s.dense) / 2,
  }));
  return (
    <Stage3D
      framing={framing}
      mode={mode}
      paused={paused}
      resetKey={resetKey}
      busy={busy}
      distance={[5, 18]}
      label="3D chamber with five sample passages arranged around a central retrieval core. Bars show each passage's keyword and meaning scores; at the end the best passage moves to a pedestal with its source. A table below gives the same scores."
      fallback={fallback}
    >
      {/* chamber */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <cylinderGeometry args={[5.2, 5.2, 0.1, 64]} />
        <meshStandardMaterial color="#dcd8ca" />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5.0, 5.12, 64]} />
        <meshBasicMaterial color="#2f4bf5" />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[5.1, 40, 18, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#8edbff" transparent opacity={0.07} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <Tag text="sample data · demo boundary" position={[0, 0.25, 5.35]} tone="#2f4bf5" height={0.34} />
      <Core active={step >= 1} />
      {scored.map((s, i) => (
        <Slab
          key={s.source}
          item={s}
          index={i}
          target={targets[i]}
          rot={step >= 4 && i === topIndex ? 0 : faceCentre(targets[i])}
          step={step}
          top={i === topIndex}
          selected={selected === i}
          onSelect={(k) => onSelect(selected === k ? null : k)}
        />
      ))}
      {step >= 1 &&
        step < 4 &&
        beams.map((b, i) => (
          <Line
            key={scored[i].source}
            points={[b.from, CORE]}
            color={i === topIndex && step >= 2 ? "#ff6538" : "#2f4bf5"}
            lineWidth={1 + b.weight * 4}
            transparent
            opacity={0.25 + b.weight * 0.6}
          />
        ))}
      {/* output pedestal */}
      <mesh position={[3.3, 0.45, 0.2]} castShadow>
        <cylinderGeometry args={[0.55, 0.7, 0.9, 24]} />
        <meshStandardMaterial color="#cfc9b8" />
      </mesh>
      <Tag text="answer" position={[3.3, 0.05, 1.0]} height={0.3} />
      {step === 3 && (
        <lineSegments position={targets[topIndex].toArray()} rotation={[0, faceCentre(targets[topIndex]), 0]}>
          <edgesGeometry args={[FENCE]} />
          <lineBasicMaterial color="#e0391a" />
        </lineSegments>
      )}
      {step === 3 && <Tag text="untrusted text" position={[targets[topIndex].x, targets[topIndex].y - 1.0, targets[topIndex].z]} tone="#e0391a" height={0.3} />}
      {step >= 4 && <Line points={[PEDESTAL.clone().add(new THREE.Vector3(0, 0.9, 0)), PEDESTAL.clone().add(new THREE.Vector3(0, 1.3, 0))]} color="#ff6538" lineWidth={3} />}
    </Stage3D>
  );
}
