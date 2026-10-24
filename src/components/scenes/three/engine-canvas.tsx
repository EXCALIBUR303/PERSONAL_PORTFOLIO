"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { SiteMode } from "@/components/mode";
import { SENSORS } from "@/lib/rul-sim";
import Stage3D, { type Framing } from "./stage";

const INK = "#17171d";
const PAPER = "#fbfaf5";
const STEEL = "#c9c6bd";
const FRESH = new THREE.Color("#8d9bb3");
const ORANGE = new THREE.Color("#ff6538");
const GREY = "#bdb8ab";

const framing: Framing = {
  pro: { position: [5.2, 2.2, 5.9], target: [0.45, -0.4, 0] },
  creative: { position: [6.4, 1.7, 4.6], target: [-0.1, -0.2, 0] },
};

/** Axial positions (x) of the stages, front (inlet) to back (exhaust). */
const FAN_X = 1.55;
const LPC = [1.15, 0.95, 0.75];
const HPC = [0.5, 0.35, 0.2, 0.05, -0.1];
const COMBUSTOR_X = -0.38;
const TURBINE = [-0.68, -0.86, -1.04, -1.22];

/** A thin disc of blades turning about the engine axis. */
function Disc({ x, radius, blades, color, spin }: { x: number; radius: number; blades: number; color: THREE.ColorRepresentation; spin: number }) {
  return (
    <group position={[x, 0, 0]} userData={{ spin }}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius * 0.32, radius * 0.32, 0.05, 20]} />
        <meshStandardMaterial color={INK} roughness={0.5} />
      </mesh>
      {Array.from({ length: blades }, (_, i) => (
        <group key={i} rotation={[(i / blades) * Math.PI * 2, 0, 0]}>
          <mesh position={[0, radius * 0.64, 0]} rotation={[0, 0.45, 0]}>
            <boxGeometry args={[radius * 0.13, radius * 0.66, 0.05]} />
            <meshStandardMaterial color={color} roughness={0.35} metalness={0.25} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * A cut-away turbofan: inlet fan, two compressor sections, a combustor and the
 * turbine, inside a nacelle drawn open on the viewer's side. It is generic
 * engine anatomy, drawn to show where C-MAPSS-style data comes from, and is
 * not a model of any real engine. The hot section's tint (steel to orange)
 * follows the made-up engine's wear; the ring of 21 dots stands for the 21 sensor channels, not
 * their physical positions.
 */
function Turbofan({
  wear,
  paused,
  dropped,
  plotted,
  health,
}: {
  wear: number;
  paused: boolean;
  dropped: Set<number>;
  plotted: Map<number, string>;
  health: number | null;
}) {
  const rotor = useRef<THREE.Group>(null);
  const hot = useMemo(() => FRESH.clone().lerp(ORANGE, Math.min(1, wear)), [wear]);
  useFrame((_, delta) => {
    if (paused || !rotor.current) return;
    rotor.current.children.forEach((child) => {
      const spin = (child.userData.spin as number | undefined) ?? 0;
      child.rotation.x += delta * spin;
    });
  });
  const healthArc = useMemo(
    () => (health === null ? null : new THREE.TorusGeometry(1.3, 0.035, 8, 96, Math.max(0.001, health) * Math.PI * 2)),
    [health],
  );
  useEffect(() => () => healthArc?.dispose(), [healthArc]);

  return (
    <group>
      {/* nacelle, open on the near side */}
      <mesh position={[0.65, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.12, 1.05, 2.1, 64, 1, true, Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color={PAPER} roughness={0.45} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[1.7, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[1.12, 0.06, 12, 64]} />
        <meshStandardMaterial color={INK} roughness={0.4} />
      </mesh>
      {/* core casing, also cut away */}
      <mesh position={[-0.35, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.6, 0.5, 2.2, 48, 1, true, Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color={STEEL} roughness={0.5} metalness={0.2} side={THREE.DoubleSide} />
      </mesh>
      {/* shaft and spinner */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 3.6, 12]} />
        <meshStandardMaterial color={INK} />
      </mesh>
      <mesh position={[1.82, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.28, 0.5, 24]} />
        <meshStandardMaterial color={INK} roughness={0.35} />
      </mesh>
      <mesh position={[-1.75, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.3, 0.8, 24]} />
        <meshStandardMaterial color={STEEL} roughness={0.4} metalness={0.3} />
      </mesh>
      {/* rotating stages: the fan, compressors and turbine */}
      <group ref={rotor}>
        <Disc x={FAN_X} radius={1.0} blades={16} color={PAPER} spin={4} />
        {LPC.map((x) => (
          <Disc key={x} x={x} radius={0.62} blades={14} color={STEEL} spin={4} />
        ))}
        {HPC.map((x, i) => (
          <Disc key={x} x={x} radius={0.55 - i * 0.02} blades={18} color={hot} spin={9} />
        ))}
        {TURBINE.map((x, i) => (
          <Disc key={x} x={x} radius={0.46 + i * 0.03} blades={16} color={hot} spin={i < 2 ? 9 : 4} />
        ))}
      </group>
      {/* combustor */}
      <mesh position={[COMBUSTOR_X, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.36, 0.09, 12, 48]} />
        <meshStandardMaterial color={hot} emissive={hot} emissiveIntensity={0.35 + wear * 0.6} roughness={0.4} />
      </mesh>
      {/* 21 sensor channels, as a ring of dots around the inlet */}
      <group position={[1.75, 0, 0]}>
        {Array.from({ length: SENSORS }, (_, s) => {
          const a = (s / SENSORS) * Math.PI * 2;
          const color = plotted.get(s) ?? (dropped.has(s) ? GREY : INK);
          return (
            <mesh key={s} position={[0.04, Math.cos(a) * 1.22, Math.sin(a) * 1.22]}>
              <sphereGeometry args={[plotted.has(s) ? 0.06 : 0.04, 12, 12]} />
              <meshStandardMaterial
                color={color}
                emissive={plotted.has(s) ? color : "#000000"}
                emissiveIntensity={plotted.has(s) ? 0.5 : 0}
                transparent={dropped.has(s)}
                opacity={dropped.has(s) ? 0.35 : 1}
              />
            </mesh>
          );
        })}
      </group>
      {/* remaining-life ring for the target step: full at 125 cycles or more */}
      {healthArc && (
        <mesh geometry={healthArc} position={[0.1, 0, 0]} rotation={[0, Math.PI / 2, Math.PI / 2]}>
          <meshStandardMaterial color="#2bb673" emissive="#2bb673" emissiveIntensity={0.4} />
        </mesh>
      )}
      {/* stand */}
      {[0.9, -0.9].map((x) => (
        <mesh key={x} position={[x, -1.22, 0]} castShadow>
          <boxGeometry args={[0.16, 0.34, 0.5]} />
          <meshStandardMaterial color={INK} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.4, 0]} receiveShadow>
        <circleGeometry args={[3.2, 48]} />
        <meshStandardMaterial color="#e7e2d6" />
      </mesh>
    </group>
  );
}

export default function EngineCanvas({
  mode,
  paused,
  resetKey,
  fallback,
  wear,
  dropped,
  plotted,
  health,
}: {
  mode: SiteMode;
  paused: boolean;
  resetKey: number;
  fallback: React.ReactNode;
  wear: number;
  dropped: Set<number>;
  plotted: Map<number, string>;
  health: number | null;
}) {
  return (
    <Stage3D
      framing={framing}
      mode={mode}
      paused={paused}
      resetKey={resetKey}
      distance={[4, 14]}
      label="Illustrative cut-away turbofan: fan, compressors, combustor and turbine. The hot section shifts from steel to orange as the made-up engine wears. A ring of 21 dots at the inlet stands for the sensor channels; dropped channels fade. The panels below give the same information as text and charts."
      fallback={fallback}
    >
      <Turbofan wear={wear} paused={paused} dropped={dropped} plotted={plotted} health={health} />
    </Stage3D>
  );
}
