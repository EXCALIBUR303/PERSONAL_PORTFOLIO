"use client";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { SiteMode } from "@/components/mode";
import type { Maze } from "@/lib/maze";
import Stage3D, { type Framing } from "./stage";

/** Size of one grid cell in scene units. */
const S = 0.62;
/** Wall thickness, height and edge rounding. */
const T = S * 0.5;
const H = 0.58;
const ROUND = 0.07;
/** Tile heights: plain floor, explored, and the path stones above them. */
const FLOOR = 0.05;
const SEEN = 0.09;
const STONE = 0.16;

const framing: Framing = {
  pro: { position: [0, 11.2, 8.4], target: [0, 0, 0.3] },
  creative: { position: [-9.4, 8.8, 10.2], target: [0, 0, 0] },
};
const colors = {
  open: new THREE.Color("#f1efe6"),
  seen: new THREE.Color("#8edbff"),
  frontier: new THREE.Color("#2f4bf5"),
};

const cellX = (maze: Maze, x: number) => (x - (maze.width - 1) / 2) * S;
const cellZ = (maze: Maze, y: number) => (y - (maze.height - 1) / 2) * S;
const cellPos = (maze: Maze, id: number) =>
  new THREE.Vector3(cellX(maze, id % maze.width), 0, cellZ(maze, Math.floor(id / maze.width)));

/**
 * Walls as continuous rounded slabs. Each straight stretch of wall cells is one
 * box running centre to centre; bare corners and lone pillars are small posts.
 * Where stretches cross they overlap, so junctions read as one solid wall
 * rather than a row of separate blocks. Built once per maze and merged into a
 * single geometry, so it is one draw call.
 */
function buildWalls(maze: Maze): THREE.BufferGeometry | null {
  const { width, height, cells } = maze;
  const wall = (x: number, y: number) => x >= 0 && y >= 0 && x < width && y < height && cells[y * width + x];
  const covered = new Uint8Array(width * height);
  const parts: THREE.BufferGeometry[] = [];
  const add = (cx: number, cz: number, sx: number, sz: number) => {
    // Sunk by the rounding radius so the rounded base is below the floor.
    const box = new RoundedBoxGeometry(sx, H + ROUND, sz, 3, ROUND);
    box.translate(cx, (H - ROUND) / 2, cz);
    parts.push(box);
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!wall(x, y) || wall(x - 1, y)) continue;
      let n = 1;
      while (wall(x + n, y)) n++;
      if (n < 2) continue;
      for (let i = 0; i < n; i++) covered[y * width + x + i] = 1;
      add(cellX(maze, x + (n - 1) / 2), cellZ(maze, y), (n - 1) * S + T, T);
    }
  }
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (!wall(x, y) || wall(x, y - 1)) continue;
      let n = 1;
      while (wall(x, y + n)) n++;
      if (n < 2) continue;
      for (let i = 0; i < n; i++) covered[(y + i) * width + x] = 1;
      add(cellX(maze, x), cellZ(maze, y + (n - 1) / 2), T, (n - 1) * S + T);
    }
  }
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      if (wall(x, y) && !covered[y * width + x]) add(cellX(maze, x), cellZ(maze, y), T, T);

  if (!parts.length) return null;
  const merged = mergeGeometries(parts, false);
  parts.forEach((part) => part.dispose());
  return merged;
}

function Walls({ maze }: { maze: Maze }) {
  const geometry = useMemo(() => buildWalls(maze), [maze]);
  useEffect(() => () => geometry?.dispose(), [geometry]);
  if (!geometry) return null;
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color="#2c2c3a" roughness={0.38} metalness={0.08} />
    </mesh>
  );
}

/** One tile per cell, under the walls too, so the floor reads as one surface. */
function Floor({ maze, visited, path }: { maze: Maze; visited: number[]; path: number[] }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const invalidate = useThree((s) => s.invalidate);
  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const seen = new Set(visited);
    const last = visited[visited.length - 1];
    const o = new THREE.Object3D();
    maze.cells.forEach((wall, id) => {
      const explored = !wall && seen.has(id);
      const h = explored ? SEEN : FLOOR;
      const p = cellPos(maze, id);
      o.position.set(p.x, h / 2 - 0.02, p.z);
      o.scale.set(S * 0.95, h + 0.04, S * 0.95);
      o.updateMatrix();
      m.setMatrixAt(id, o.matrix);
      m.setColorAt(
        id,
        explored ? (id === last && !path.length ? colors.frontier : colors.seen) : colors.open,
      );
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    invalidate();
  }, [maze, visited, path, invalidate]);
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, maze.cells.length]} receiveShadow>
      <boxGeometry />
      <meshStandardMaterial roughness={0.8} />
    </instancedMesh>
  );
}

/** The solved route as raised, softly glowing stones. */
function PathStones({ maze, path }: { maze: Maze; path: number[] }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const invalidate = useThree((s) => s.invalidate);
  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const o = new THREE.Object3D();
    path.forEach((id, i) => {
      const p = cellPos(maze, id);
      o.position.set(p.x, STONE / 2, p.z);
      o.scale.set(S * 0.72, STONE, S * 0.72);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
    invalidate();
  }, [maze, path, invalidate]);
  if (!path.length) return null;
  return (
    // Remounted when the route length changes, because the instance count is fixed.
    <instancedMesh key={path.length} ref={mesh} args={[undefined, undefined, path.length]} castShadow>
      <boxGeometry />
      <meshStandardMaterial color="#d9f542" emissive="#d9f542" emissiveIntensity={0.28} roughness={0.5} />
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
    b.position.y = STONE + 0.2 + Math.abs(Math.sin(t.current * Math.PI)) * 0.12;
  });
  if (points.length < 2) return null;
  return (
    <mesh ref={ball} position={[points[0].x, STONE + 0.2, points[0].z]} castShadow>
      <sphereGeometry args={[0.17, 24, 24]} />
      <meshStandardMaterial color="#ff6538" roughness={0.35} />
    </mesh>
  );
}

function Flag({ maze, id, color }: { maze: Maze; id: number; color: string }) {
  const p = cellPos(maze, id);
  return (
    <group position={[p.x, 0, p.z]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 1, 10]} />
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
      label="3D maze with continuous walls. Explored cells rise and turn blue; the final path appears as raised lime stones. The counts beside it give the same information."
      fallback={fallback}
    >
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]} receiveShadow>
        <planeGeometry args={[maze.width * S + 1, maze.height * S + 1]} />
        <meshStandardMaterial color="#e2dccd" />
      </mesh>
      <Floor maze={maze} visited={visited} path={path} />
      <Walls maze={maze} />
      <PathStones maze={maze} path={path} />
      <Flag maze={maze} id={maze.start} color="#2f4bf5" />
      <Flag maze={maze} id={maze.goal} color="#ff6538" />
      {!paused && <Runner maze={maze} path={path} />}
    </Stage3D>
  );
}
