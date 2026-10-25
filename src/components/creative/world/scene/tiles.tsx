"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { V3 } from "./kit";

/** A grid of thin tiles drawn as one instanced mesh and recoloured from a function while a reaction runs. */
export function Tiles({
  cells,
  width,
  height,
  depth,
  base,
  t,
  dim,
  colour,
}: {
  cells: V3[];
  width: number;
  height: number;
  depth: number;
  base: string;
  t: { current: number };
  dim: boolean;
  colour: (i: number, t: number, out: THREE.Color) => boolean;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const invalidate = useThree((s) => s.invalidate);
  const geometry = useMemo(() => new THREE.BoxGeometry(width, height, depth), [width, height, depth]);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.92 }), []);
  const last = useRef(-1);
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );
  const paint = useMemo(() => {
    const baseColour = new THREE.Color(base);
    const card = new THREE.Color("#fbf9f4");
    const out = new THREE.Color();
    return (m: THREE.InstancedMesh, now: number) => {
      for (let i = 0; i < cells.length; i++) {
        out.copy(dim ? card : baseColour);
        if (!dim) colour(i, now, out);
        m.setColorAt(i, out);
      }
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    };
  }, [cells, base, dim, colour]);
  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const d = new THREE.Object3D();
    cells.forEach((c, i) => {
      d.position.set(c[0], c[1], c[2]);
      d.updateMatrix();
      m.setMatrixAt(i, d.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
    last.current = -1;
    paint(m, t.current);
    invalidate();
  }, [cells, geometry, paint, t, invalidate]);
  useFrame(() => {
    const m = mesh.current;
    if (!m || last.current === t.current) return;
    last.current = t.current;
    paint(m, t.current);
  });
  return <instancedMesh ref={mesh} args={[geometry, material, cells.length]} receiveShadow frustumCulled={false} />;
}
