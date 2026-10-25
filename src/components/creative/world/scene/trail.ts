import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { V3 } from "./kit";

/** One small block of a trail: its size and where its centre sits. */
export type Block = { size: V3; at: V3 };

const INDICES_PER_BOX = 36;

/**
 * A row of blocks drawn as one mesh, with a count of how many show. A path that
 * fills in step by step costs one draw call instead of one per block.
 */
export function useTrail(blocks: Block[]) {
  const geometry = useMemo(() => {
    const list = blocks.map(({ size, at }) => new THREE.BoxGeometry(...size).translate(...at));
    const merged = mergeGeometries(list, false)!;
    list.forEach((g) => g.dispose());
    return merged;
  }, [blocks]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
}

/** Shows the first `n` blocks of a trail (a fraction rounds down). */
export function showTrail(geometry: THREE.BufferGeometry, n: number) {
  geometry.setDrawRange(0, Math.max(0, Math.floor(n)) * INDICES_PER_BOX);
}
