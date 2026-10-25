"use client";
import { useEffect } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/*
 * A small modelling kit. A model is described as a list of primitives, each
 * with a material; `build()` merges everything that shares a material into one
 * geometry, so a landmark of fifty pieces costs a handful of draw calls.
 * Positions put a box's or cylinder's base at y (models are stacked from the
 * ground up); spheres and tori are placed by their centre.
 */
export type V3 = [number, number, number];
export type Part = { geometry: THREE.BufferGeometry; material: THREE.Material };
export type LinePart = { geometry: THREE.BufferGeometry; material: THREE.LineBasicMaterial | THREE.LineDashedMaterial };

const unitBox = new THREE.BoxGeometry(1, 1, 1);
const rounded = new Map<string, THREE.BufferGeometry>();
function roundedBox(w: number, h: number, d: number, r: number) {
  const key = `${w.toFixed(3)}:${h.toFixed(3)}:${d.toFixed(3)}:${r.toFixed(3)}`;
  let g = rounded.get(key);
  if (!g) {
    g = new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3));
    rounded.set(key, g);
  }
  return g;
}

const m4 = new THREE.Matrix4();
const q = new THREE.Quaternion();
const euler = new THREE.Euler();
const pv = new THREE.Vector3();
const sv = new THREE.Vector3();

type Turn = { rx?: number; ry?: number; rz?: number };

export class Kit {
  private groups = new Map<THREE.Material, THREE.BufferGeometry[]>();
  private lineGroups = new Map<THREE.Material, THREE.BufferGeometry[]>();

  /** Everything added is moved by `origin` and turned by `turn` around it. */
  constructor(
    private origin: V3 = [0, 0, 0],
    private turn = 0,
  ) {}

  private place(geometry: THREE.BufferGeometry, pos: V3, rot: V3 = [0, 0, 0], scale: V3 = [1, 1, 1]) {
    const g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    euler.set(rot[0], rot[1], rot[2]);
    q.setFromEuler(euler);
    m4.compose(pv.set(pos[0], pos[1], pos[2]), q, sv.set(scale[0], scale[1], scale[2]));
    g.applyMatrix4(m4);
    if (this.turn) g.rotateY(this.turn);
    g.translate(this.origin[0], this.origin[1], this.origin[2]);
    return g;
  }

  add(material: THREE.Material, geometry: THREE.BufferGeometry, pos: V3, rot?: V3, scale?: V3) {
    const g = this.place(geometry, pos, rot, scale);
    if (!g.attributes.uv) g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array((g.attributes.position.count) * 2), 2));
    const list = this.groups.get(material) ?? [];
    list.push(g);
    this.groups.set(material, list);
    return this;
  }

  /** A box standing on `pos` (its base centre). `r` rounds its edges. */
  box(material: THREE.Material, size: V3, pos: V3, o: Turn & { r?: number } = {}) {
    const [w, h, d] = size;
    const rot: V3 = [o.rx ?? 0, o.ry ?? 0, o.rz ?? 0];
    if (o.r) return this.add(material, roundedBox(w, h, d, o.r), [pos[0], pos[1] + h / 2, pos[2]], rot);
    return this.add(material, unitBox, [pos[0], pos[1] + h / 2, pos[2]], rot, [w, h, d]);
  }

  /** A cylinder (or cone, with `top`) standing on `pos`; `centre` places it by its middle instead. */
  cyl(material: THREE.Material, r: number, h: number, pos: V3, o: Turn & { top?: number; seg?: number; centre?: boolean } = {}) {
    const g = new THREE.CylinderGeometry(o.top ?? r, r, h, o.seg ?? 24);
    const y = o.centre ? pos[1] : pos[1] + h / 2;
    this.add(material, g, [pos[0], y, pos[2]], [o.rx ?? 0, o.ry ?? 0, o.rz ?? 0]);
    g.dispose();
    return this;
  }

  sphere(material: THREE.Material, r: number, pos: V3, o: { seg?: number; squash?: number } = {}) {
    const g = new THREE.SphereGeometry(1, o.seg ?? 18, Math.max(8, Math.round((o.seg ?? 18) * 0.66)));
    this.add(material, g, pos, [0, 0, 0], [r, r * (o.squash ?? 1), r]);
    g.dispose();
    return this;
  }

  torus(material: THREE.Material, radius: number, tube: number, pos: V3, o: Turn & { arc?: number; seg?: number } = {}) {
    const g = new THREE.TorusGeometry(radius, tube, 8, o.seg ?? 32, o.arc ?? Math.PI * 2);
    this.add(material, g, pos, [o.rx ?? Math.PI / 2, o.ry ?? 0, o.rz ?? 0]);
    g.dispose();
    return this;
  }

  /** An outline in the ground plane (x, z) raised by `height`, with its base at `y`. */
  slab(material: THREE.Material, outline: [number, number][], y: number, height: number, o: { bevel?: number; holes?: [number, number][][] } = {}) {
    const shape = new THREE.Shape(outline.map(([x, z]) => new THREE.Vector2(x, -z)));
    for (const hole of o.holes ?? []) shape.holes.push(new THREE.Path(hole.map(([x, z]) => new THREE.Vector2(x, -z))));
    const bevel = o.bevel ?? 0;
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: Math.max(0.001, height - bevel * 2),
      bevelEnabled: bevel > 0,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 1,
      curveSegments: 6,
    });
    g.rotateX(-Math.PI / 2);
    g.translate(0, bevel, 0);
    this.add(material, g, [0, y, 0]);
    g.dispose();
    return this;
  }

  /** Straight edges of a box, for blueprint drawings. */
  edges(material: THREE.LineBasicMaterial | THREE.LineDashedMaterial, size: V3, pos: V3, o: Turn = {}) {
    const g = new THREE.EdgesGeometry(new THREE.BoxGeometry(size[0], size[1], size[2]));
    const placed = this.place(g, [pos[0], pos[1] + size[1] / 2, pos[2]], [o.rx ?? 0, o.ry ?? 0, o.rz ?? 0]);
    g.dispose();
    const list = this.lineGroups.get(material) ?? [];
    list.push(placed);
    this.lineGroups.set(material, list);
    return this;
  }

  /** A polyline in world space, relative to the kit's origin. */
  line(material: THREE.LineBasicMaterial | THREE.LineDashedMaterial, points: V3[]) {
    const pts: number[] = [];
    for (let i = 0; i < points.length - 1; i++) pts.push(...points[i], ...points[i + 1]);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    const placed = this.place(g, [0, 0, 0]);
    g.dispose();
    const list = this.lineGroups.get(material) ?? [];
    list.push(placed);
    this.lineGroups.set(material, list);
    return this;
  }

  build(): { parts: Part[]; lines: LinePart[] } {
    const parts: Part[] = [];
    for (const [material, list] of this.groups) {
      const merged = mergeGeometries(list, false);
      list.forEach((g) => g.dispose());
      if (merged) {
        merged.computeBoundingSphere();
        parts.push({ geometry: merged, material });
      }
    }
    const lines: LinePart[] = [];
    for (const [material, list] of this.lineGroups) {
      const merged = mergeGeometries(list, false);
      list.forEach((g) => g.dispose());
      if (merged) {
        const ls = new THREE.LineSegments(merged);
        ls.computeLineDistances();
        lines.push({ geometry: ls.geometry, material: material as LinePart["material"] });
      }
    }
    this.groups.clear();
    this.lineGroups.clear();
    return { parts, lines };
  }
}

/** Releases a built model's geometry when it is rebuilt or unmounts. */
export function useDisposal(model: { parts: Part[]; lines: LinePart[] }) {
  useEffect(
    () => () => {
      model.parts.forEach((p) => p.geometry.dispose());
      model.lines.forEach((p) => p.geometry.dispose());
    },
    [model],
  );
}

export function Model({
  model,
  cast = true,
  receive = true,
  swap,
}: {
  model: { parts: Part[]; lines: LinePart[] };
  cast?: boolean;
  receive?: boolean;
  /** Draw every part in this one material instead (the white-card look of a dimmed landmark). */
  swap?: THREE.Material | null;
}) {
  return (
    <>
      {model.parts.map((p, i) => (
        <mesh key={i} geometry={p.geometry} material={swap ?? p.material} castShadow={cast} receiveShadow={receive} />
      ))}
      {model.lines.map((p, i) => (
        <lineSegments key={`l${i}`} geometry={p.geometry} material={p.material} />
      ))}
    </>
  );
}

/** A rounded rectangle outline in the ground plane, as points for `Kit.slab`. */
export function roundRect(cx: number, cz: number, w: number, d: number, r: number, steps = 5): [number, number][] {
  const pts: [number, number][] = [];
  const corners: [number, number, number][] = [
    [cx + w / 2 - r, cz - d / 2 + r, -Math.PI / 2],
    [cx + w / 2 - r, cz + d / 2 - r, 0],
    [cx - w / 2 + r, cz + d / 2 - r, Math.PI / 2],
    [cx - w / 2 + r, cz - d / 2 + r, Math.PI],
  ];
  for (const [x, z, a0] of corners)
    for (let i = 0; i <= steps; i++) {
      const a = a0 + (i / steps) * (Math.PI / 2);
      pts.push([x + Math.cos(a) * r, z + Math.sin(a) * r]);
    }
  return pts;
}

/** A circle (or regular polygon) outline in the ground plane. */
export function circle(cx: number, cz: number, r: number, steps = 48): [number, number][] {
  return Array.from({ length: steps }, (_, i) => {
    const a = (i / steps) * Math.PI * 2;
    return [cx + Math.cos(a) * r, cz + Math.sin(a) * r] as [number, number];
  });
}
