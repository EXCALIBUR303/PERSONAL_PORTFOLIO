"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { useEffect, useRef, type ComponentRef } from "react";
import * as THREE from "three";
import type { DeskMode } from "./engineering-desk";
function Controls({ resetKey }: { resetKey: number }) {
  const ref = useRef<ComponentRef<typeof OrbitControls>>(null);
  useEffect(() => {
    ref.current?.reset();
  }, [resetKey]);
  return (
    <OrbitControls
      ref={ref}
      enableDamping={false}
      enablePan={false}
      minDistance={5}
      maxDistance={11}
      minPolarAngle={0.4}
      maxPolarAngle={Math.PI * 0.68}
    />
  );
}
function ObjectScene({
  animated,
  mode,
}: {
  animated: boolean;
  mode: DeskMode;
}) {
  const group = useRef<THREE.Group>(null);
  const { invalidate } = useThree();
  useEffect(() => {
    invalidate();
    if (!animated) return;
    const timer = window.setInterval(invalidate, 1000 / 30);
    return () => window.clearInterval(timer);
  }, [animated, mode, invalidate]);
  useFrame(({ clock, pointer }, delta) => {
    if (!group.current || !animated) return;
    const t = Math.min(delta, 0.05);
    group.current.rotation.y = THREE.MathUtils.damp(
      group.current.rotation.y,
      -0.3 + pointer.x * 0.12 + Math.sin(clock.getElapsedTime() * 0.18) * 0.09,
      3,
      t,
    );
    group.current.position.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.045;
  });
  const color =
    mode === "systems"
      ? "#f6a55e"
      : mode === "algorithms"
        ? "#69d9e5"
        : "#b397ed";
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight
        castShadow
        position={[3, 7, 5]}
        intensity={3.4}
        color="#fff0df"
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.001}
      />
      <pointLight position={[-4, 2, 0]} intensity={22} color={color} />
      <Environment resolution={64} frames={1}>
        <Lightformer position={[0, 5, 2]} scale={[6, 3, 1]} intensity={5} />
        <Lightformer
          position={[-4, 1, 2]}
          scale={[2, 5, 1]}
          intensity={4}
          color="#b6d4e8"
        />
        <Lightformer
          position={[4, -1, 1]}
          scale={[3, 2, 1]}
          intensity={3}
          color="#f6b779"
        />
      </Environment>
      <group ref={group} rotation={[0.13, -0.3, -0.12]}>
        {mode === "computation" ? (
          <mesh castShadow rotation={[0.2, 0.15, 0]}>
            <torusKnotGeometry args={[1.18, 0.36, 144, 24, 2, 3]} />
            <meshPhysicalMaterial
              color="#9c83cc"
              metalness={0.78}
              roughness={0.2}
              clearcoat={0.7}
            />
          </mesh>
        ) : mode === "systems" ? (
          <group rotation={[0.2, 0, 0.35]}>
            <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[1.85, 0.12, 16, 80]} />
              <meshPhysicalMaterial
                color="#a9b5ba"
                metalness={0.95}
                roughness={0.23}
              />
            </mesh>
            <mesh castShadow rotation={[0.6, 0.4, 0.3]}>
              <torusGeometry args={[1.55, 0.19, 16, 80]} />
              <meshPhysicalMaterial
                color={color}
                metalness={0.7}
                roughness={0.25}
              />
            </mesh>
            <mesh castShadow rotation={[0.1, 1.2, 0.3]}>
              <torusGeometry args={[1.2, 0.09, 12, 70]} />
              <meshStandardMaterial
                color="#d1dadd"
                metalness={0.92}
                roughness={0.18}
              />
            </mesh>
            <mesh castShadow>
              <icosahedronGeometry args={[0.67, 1]} />
              <meshPhysicalMaterial
                color="#566772"
                metalness={0.85}
                roughness={0.15}
                clearcoat={1}
              />
            </mesh>
            {[0, 1, 2, 3].map((i) => (
              <group key={i} rotation={[0, (i * Math.PI) / 2, 0]}>
                <mesh castShadow position={[1.85, 0, 0]}>
                  <boxGeometry args={[0.36, 0.42, 0.3]} />
                  <meshStandardMaterial
                    color="#26333c"
                    metalness={0.8}
                    roughness={0.25}
                  />
                </mesh>
                <mesh position={[1.85, 0.23, 0]}>
                  <cylinderGeometry args={[0.08, 0.08, 0.08, 12]} />
                  <meshStandardMaterial
                    color="#d6e1e2"
                    metalness={0.9}
                    roughness={0.25}
                  />
                </mesh>
              </group>
            ))}
          </group>
        ) : (
          <group rotation={[0.25, 0.3, 0.1]}>
            {Array.from({ length: 25 }, (_, i) => {
              const x = ((i % 5) - 2) * 0.57,
                z = (Math.floor(i / 5) - 2) * 0.57,
                h = ((i * 7) % 5) * 0.19 + 0.15;
              return (
                <mesh key={i} castShadow position={[x, h / 2 - 0.6, z]}>
                  <boxGeometry args={[0.45, h, 0.45]} />
                  <meshStandardMaterial
                    color={
                      [0, 5, 10, 11, 12, 17, 22, 23, 24].includes(i)
                        ? color
                        : "#50616e"
                    }
                    metalness={0.65}
                    roughness={0.27}
                  />
                </mesh>
              );
            })}
            <mesh position={[0, -0.75, 0]} receiveShadow>
              <boxGeometry args={[3.2, 0.16, 3.2]} />
              <meshStandardMaterial
                color="#26313a"
                metalness={0.8}
                roughness={0.3}
              />
            </mesh>
            <mesh position={[0, 0.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[1.9, 0.018, 8, 70]} />
              <meshStandardMaterial color={color} metalness={0.6} />
            </mesh>
          </group>
        )}
        <mesh position={[0, -2.15, 0]} receiveShadow>
          <cylinderGeometry args={[2.25, 2.4, 0.24, 64]} />
          <meshStandardMaterial
            color="#27323b"
            metalness={0.75}
            roughness={0.35}
          />
        </mesh>
        <mesh position={[0, -2.28, 0]}>
          <cylinderGeometry args={[2.35, 2.35, 0.04, 64]} />
          <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
        </mesh>
        {Array.from({ length: 32 }, (_, i) => (
          <mesh
            key={i}
            position={[
              Math.cos((i * Math.PI) / 16) * 2.12,
              -2.02,
              Math.sin((i * Math.PI) / 16) * 2.12,
            ]}
            rotation={[-Math.PI / 2, 0, (i * Math.PI) / 16]}
          >
            <planeGeometry args={[0.025, i % 4 === 0 ? 0.15 : 0.07]} />
            <meshBasicMaterial color="#c6d1d6" />
          </mesh>
        ))}
      </group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -2.48, 0]}
        receiveShadow
      >
        <planeGeometry args={[30, 30]} />
        <shadowMaterial transparent opacity={0.25} />
      </mesh>
    </>
  );
}
export default function Sculpture({
  animated,
  onReady,
  mode = "systems",
  resetKey = 0,
}: {
  animated: boolean;
  onReady: () => void;
  mode?: DeskMode;
  resetKey?: number;
}) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 2.4, 7.4], fov: 43 }}
      dpr={[1, 1.5]}
      frameloop="demand"
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        onReady();
      }}
      aria-hidden="true"
    >
      <ObjectScene animated={animated} mode={mode} />
      <Controls resetKey={resetKey} />
    </Canvas>
  );
}
