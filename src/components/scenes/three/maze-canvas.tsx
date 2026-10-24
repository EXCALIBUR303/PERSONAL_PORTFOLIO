"use client";
import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { SiteMode } from "@/components/mode";
import type { Maze } from "@/lib/maze";
import Stage3D, { type Framing } from "./stage";

const S = 0.62;
const framing: Framing = {
  pro: { position: [0, 11.8, 7.6], target: [0, 0, 0.4] },
  creative: { position: [-8.5, 7.5, 9], target: [0, 0, 0] },
};
const colors = {
  wall: new THREE.Color("#17171d"),
  open: new THREE.Color("#f1efe6"),
  seen: new THREE.Color("#8edbff"),
  frontier: new THREE.Color("#2f4bf5"),
  path: new THREE.Color("#d9f542"),
};

const cellPos = (maze: Maze, id: number) =>
  new THREE.Vector3(
    ((id % maze.width) - (maze.width - 1) / 2) * S,
    0,
    (Math.floor(id / maze.width) - (maze.height - 1) / 2) * S,
  );

function Cells({ maze, visited, path }: { maze: Maze; visited: number[]; path: number[] }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const invalidate = useThree((s) => s.invalidate);
  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const seen = new Set(visited);
    const onPath = new Set(path);
    const last = visited[visited.length - 1];
    const o = new THREE.Object3D();
    maze.cells.forEach((wall, id) => {
      const h = wall ? 0.7 : onPath.has(id) ? 0.22 : seen.has(id) ? 0.1 : 0.05;
      const p = cellPos(maze, id);
      o.position.set(p.x, h / 2, p.z);
      o.scale.set(S * 0.94, h, S * 0.94);
      o.updateMatrix();
      m.setMatrixAt(id, o.matrix);
      m.setColorAt(
        id,
        wall
          ? colors.wall
          : onPath.has(id)
            ? colors.path
            : id === last && !path.length
              ? colors.frontier
              : seen.has(id)
                ? colors.seen
                : colors.open,
      );
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    invalidate();
  }, [maze, visited, path, invalidate]);
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, maze.cells.length]} castShadow receiveShadow>
      <boxGeometry />
      <meshStandardMaterial roughness={0.8} />
    </instancedMesh>
  );
}

/** A marker that walks the finished path, so the route reads as a route. */
function Runner({ maze, path }: { maze: Maze; path: number[] }) {
  const ball = useRef<THREE.Mesh>(null);
  const points = useMemo(() => path.map((id) => cellPos(maze, id)), [maze, path]);
  const t = useRef(0);
  useLayoutEffect(() => {
    t.current = 0;
  }, [points]);
  useFrame((_, delta) => {
    const b = ball.current;
    if (!b || points.length < 2) return;
    t.current = (t.current + delta * 8) % (points.length + 6);
    const i = Math.min(Math.floor(t.current), points.length - 1);
    const j = Math.min(i + 1, points.length - 1);
    b.position.lerpVectors(points[i], points[j], Math.min(1, t.current - i));
    b.position.y = 0.42 + Math.abs(Math.sin(t.current * Math.PI)) * 0.12;
  });
  if (points.length < 2) return null;
  return (
    <mesh ref={ball} position={[points[0].x, 0.42, points[0].z]} castShadow>
      <sphereGeometry args={[0.2, 20, 20]} />
      <meshStandardMaterial color="#ff6538" />
    </mesh>
  );
}

function Flag({ maze, id, color }: { maze: Maze; id: number; color: string }) {
  const p = cellPos(maze, id);
  return (
    <group position={[p.x, 0, p.z]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 1, 8]} />
        <meshStandardMaterial color="#17171d" />
      </mesh>
      <mesh position={[0.17, 0.85, 0]} castShadow>
        <boxGeometry args={[0.32, 0.22, 0.03]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

export default function MazeCanvas({
  maze,
  visited,
  path,
  mode,
  paused,
  resetKey,
  fallback,
}: {
  maze: Maze;
  visited: number[];
  path: number[];
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
      distance={[6, 24]}
      label="3D maze. Explored cells rise and turn blue; the final path rises further and turns lime. The counts beside it give the same information."
      fallback={fallback}
    >
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[maze.width * S + 1, maze.height * S + 1]} />
        <meshStandardMaterial color="#e7e2d6" />
      </mesh>
      <Cells maze={maze} visited={visited} path={path} />
      <Flag maze={maze} id={maze.start} color="#2f4bf5" />
      <Flag maze={maze} id={maze.goal} color="#ff6538" />
      {!paused && <Runner maze={maze} path={path} />}
    </Stage3D>
  );
}
