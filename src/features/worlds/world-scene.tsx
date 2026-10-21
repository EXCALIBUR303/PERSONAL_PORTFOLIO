"use client";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, OrthographicCamera } from "@react-three/drei";
import { useEffect, useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import type { SpatialProps } from "./spatial-view";
import type { Maze } from "@/lib/maze";
function Camera() {
  const { size } = useThree();
  return (
    <OrthographicCamera
      makeDefault
      position={[12, 16, 14]}
      zoom={Math.min(size.width / 16, size.height / 10)}
      near={0.1}
      far={100}
    />
  );
}
function MazeBlocks({
  maze,
  visited = [],
  path = [],
  selected,
  onSelect,
}: SpatialProps & { maze: Maze }) {
  const mesh = useRef<THREE.InstancedMesh>(null),
    { invalidate } = useThree();
  useLayoutEffect(() => {
    if (!mesh.current) return;
    const object = new THREE.Object3D();
    maze.cells.forEach((wall, id) => {
      const h = wall ? 0.62 : 0.045;
      object.position.set(
        ((id % maze.width) - maze.width / 2) * 0.6,
        h / 2,
        (Math.floor(id / maze.width) - maze.height / 2) * 0.6,
      );
      object.scale.set(0.56, h, 0.56);
      object.updateMatrix();
      mesh.current!.setMatrixAt(id, object.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    invalidate();
  }, [maze, invalidate]);
  useEffect(() => {
    if (!mesh.current) return;
    const seen = new Set(visited),
      solution = new Set(path);
    maze.cells.forEach((wall, id) => {
      const color =
        id === selected
          ? "#f0c785"
          : id === maze.start
            ? "#66d9b5"
            : id === maze.goal
              ? "#ee9c8e"
              : solution.has(id)
                ? "#d5f86e"
                : seen.has(id)
                  ? "#8a79cb"
                  : wall
                    ? "#667d7a"
                    : "#263d3a";
      mesh.current!.setColorAt(id, new THREE.Color(color));
    });
    if (mesh.current.instanceColor)
      mesh.current.instanceColor.needsUpdate = true;
    invalidate();
  }, [maze, visited, path, selected, invalidate]);
  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, maze.cells.length]}
      onClick={(event) => {
        if (event.instanceId !== undefined) onSelect?.(event.instanceId);
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.55} metalness={0.2} />
    </instancedMesh>
  );
}
function Parking({ slots = [], selected = 0, onSelect }: SpatialProps) {
  return (
    <group>
      {slots.map((status, i) => {
        const x = ((i % 6) - 2.5) * 1.4,
          z = (Math.floor(i / 6) - 1.5) * 1.6,
          color =
            i === selected
              ? "#f6d29b"
              : status === "Free"
                ? "#79bba0"
                : status === "Reserved"
                  ? "#b4a1dc"
                  : "#e99a88";
        return (
          <group key={i} position={[x, 0, z]} onClick={() => onSelect?.(i)}>
            <mesh position={[0, 0.025, 0]}>
              <boxGeometry args={[1.15, 0.05, 1.4]} />
              <meshStandardMaterial color={color} roughness={0.75} />
            </mesh>
            {status === "Occupied" && (
              <>
                <mesh position={[0, 0.3, 0]}>
                  <boxGeometry args={[0.65, 0.45, 1]} />
                  <meshStandardMaterial
                    color="#d4e9e3"
                    metalness={0.4}
                    roughness={0.35}
                  />
                </mesh>
                <mesh position={[0, 0.56, -0.03]}>
                  <boxGeometry args={[0.55, 0.1, 0.5]} />
                  <meshStandardMaterial color="#3a5362" metalness={0.35} />
                </mesh>
              </>
            )}
          </group>
        );
      })}
      <mesh position={[0, -0.06, 0]}>
        <boxGeometry args={[9.2, 0.1, 7.5]} />
        <meshStandardMaterial color="#1d302b" />
      </mesh>
    </group>
  );
}
function Engine({ selected = 0, onSelect }: SpatialProps) {
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      {[0, 1, 2].map((i) => (
        <group
          key={i}
          position={[0, (i - 1) * 2.3, 0]}
          onClick={() => onSelect?.(i)}
        >
          <mesh>
            <cylinderGeometry
              args={[
                i === 1 ? 1.55 : 1.2,
                i === 1 ? 1.55 : 1.2,
                1.7,
                28,
                1,
                true,
              ]}
            />
            <meshStandardMaterial
              color={i === selected ? "#bda4f1" : "#61737c"}
              metalness={0.55}
              roughness={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.86, 0]}>
            <torusGeometry args={[i === 1 ? 1.55 : 1.2, 0.1, 10, 40]} />
            <meshStandardMaterial
              color="#d8e6e1"
              metalness={0.6}
              roughness={0.25}
            />
          </mesh>
          {Array.from({ length: 8 }, (_, n) => (
            <mesh
              key={n}
              rotation={[0, (n * Math.PI) / 4, 0]}
              position={[
                Math.cos((n * Math.PI) / 4) * 0.6,
                0,
                Math.sin((n * Math.PI) / 4) * 0.6,
              ]}
            >
              <boxGeometry args={[1.2, 0.09, 0.2]} />
              <meshStandardMaterial color="#b4cbc4" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
function Process({ selected = 0, onSelect }: SpatialProps) {
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <group
          key={i}
          position={[(i - 1) * 3.1, 0, 0]}
          onClick={() => onSelect?.(i)}
        >
          <mesh position={[0, 1, 0]}>
            <cylinderGeometry args={[0.8, 0.85, 2, 28]} />
            <meshStandardMaterial
              color={i === selected ? "#f5ae85" : "#7c8d8a"}
              metalness={0.45}
              roughness={0.3}
            />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 2.05, 0]}>
            <torusGeometry args={[0.77, 0.1, 10, 32]} />
            <meshStandardMaterial color="#e8d7b4" />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <boxGeometry args={[2, 0.1, 2]} />
            <meshStandardMaterial color="#344741" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
export default function WorldScene({
  onReady,
  ...props
}: SpatialProps & { onReady: () => void }) {
  return (
    <Canvas
      orthographic
      camera={{ position: [12, 16, 14], zoom: 35, near: 0.1, far: 100 }}
      dpr={[1, 1.5]}
      frameloop="demand"
      gl={{ antialias: true, powerPreference: "low-power" }}
      onCreated={onReady}
    >
      <color attach="background" args={["#14211f"]} />
      <ambientLight intensity={1.1} />
      <directionalLight position={[5, 8, 5]} intensity={2.3} color="#e3dfef" />
      <pointLight position={[-5, 4, 2]} intensity={18} color="#99dbc8" />
      <Camera />
      {props.kind === "maze" && props.maze ? (
        <MazeBlocks {...props} maze={props.maze} />
      ) : props.kind === "parking" ? (
        <Parking {...props} />
      ) : props.kind === "maintenance" ? (
        <Engine {...props} />
      ) : (
        <Process {...props} />
      )}
      <OrbitControls
        enableDamping={false}
        minZoom={12}
        maxZoom={90}
        maxPolarAngle={Math.PI * 0.46}
        minPolarAngle={0.2}
      />
    </Canvas>
  );
}
