"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { useEffect, useRef } from "react";
import * as THREE from "three";

function ObjectScene({ animated }: { animated: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { invalidate } = useThree();
  useEffect(() => {
    invalidate();
    if (!animated) return;
    // Cap idle rendering at 30fps and clear the scheduler whenever inactive.
    const timer = window.setInterval(invalidate, 1000 / 30);
    return () => window.clearInterval(timer);
  }, [animated, invalidate]);
  useFrame(({ clock, pointer }, delta) => {
    if (!group.current || !animated) return;
    const time = clock.getElapsedTime();
    const t = Math.min(delta, 0.05);
    group.current.rotation.x = THREE.MathUtils.damp(
      group.current.rotation.x,
      0.35 + pointer.y * 0.16,
      3,
      t,
    );
    group.current.rotation.y = THREE.MathUtils.damp(
      group.current.rotation.y,
      -0.25 + pointer.x * 0.2 + Math.sin(time * 0.17) * 0.12,
      3,
      t,
    );
    group.current.position.y = Math.sin(time * 0.65) * 0.07;
  });
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 4]} intensity={3} color="#f1eaff" />
      <pointLight position={[-4, -1, 2]} intensity={20} color="#b7ff55" />
      <Environment resolution={64} frames={1}>
        <Lightformer
          position={[0, 4, 3]}
          scale={[5, 3, 1]}
          intensity={5}
          color="white"
        />
        <Lightformer
          position={[-4, 0, 1]}
          scale={[2, 5, 1]}
          intensity={3}
          color="#b9a1ff"
        />
        <Lightformer
          position={[4, -2, 1]}
          scale={[3, 2, 1]}
          intensity={4}
          color="#d4fa80"
        />
      </Environment>
      <group ref={group} rotation={[0.35, -0.25, -0.25]}>
        <mesh rotation={[0.1, 0.2, 0]}>
          <torusKnotGeometry args={[1.25, 0.41, 150, 24, 2, 3]} />
          <meshPhysicalMaterial
            color="#a587ed"
            metalness={0.7}
            roughness={0.21}
            clearcoat={1}
            clearcoatRoughness={0.15}
          />
        </mesh>
        <mesh position={[1.55, 1.1, 0.35]}>
          <sphereGeometry args={[0.25, 24, 24]} />
          <meshStandardMaterial
            color="#dbff73"
            metalness={0.3}
            roughness={0.2}
          />
        </mesh>
        <mesh position={[-1.5, -1.3, 0.5]}>
          <icosahedronGeometry args={[0.28, 0]} />
          <meshStandardMaterial
            color="#ff936b"
            metalness={0.3}
            roughness={0.27}
          />
        </mesh>
        <mesh rotation={[1.2, 0.4, -0.5]}>
          <torusGeometry args={[2.15, 0.008, 6, 100]} />
          <meshBasicMaterial color="#888f78" transparent opacity={0.6} />
        </mesh>
      </group>
    </>
  );
}
export default function Sculpture({
  animated,
  onReady,
}: {
  animated: boolean;
  onReady: () => void;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 6.8], fov: 43 }}
      dpr={[1, 1.5]}
      frameloop="demand"
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        onReady();
      }}
      aria-hidden="true"
    >
      <ObjectScene animated={animated} />
    </Canvas>
  );
}
