"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { DISTRICTS } from "../layout";
import { circle, Kit, Model, useDisposal } from "./kit";
import type { Palette } from "./palette";

/*
 * The table the archipelago floats over: a drafting sheet far below the
 * islands. It carries the technical texture (a survey grid, drawn in the
 * shader so it stays crisp at any distance), a soft colour field under each
 * island, and each island's shadow, thrown well away from it by the low sun so
 * the height reads. Fog fades the sheet from warm paper near the viewer to a
 * cool haze far away.
 */
export const SHEET_Y = -10;
/** Direction towards the key light (the same light that casts the real shadows). */
export const SUN = new THREE.Vector3(-0.45, 0.8, 0.4).normalize();

const vertex = /* glsl */ `
  #include <fog_pars_vertex>
  varying vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vec4 mvPosition = viewMatrix * world;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;
const fragment = /* glsl */ `
  #include <common>
  #include <fog_pars_fragment>
  uniform vec3 uPaper;
  uniform vec3 uInk;
  uniform vec4 uShadow[4];
  uniform vec4 uField[4];
  uniform vec3 uTint[4];
  varying vec3 vWorld;

  float grid(vec2 p, float spacing, float width) {
    vec2 q = p / spacing;
    vec2 w = max(fwidth(q), vec2(1e-4));
    vec2 d = abs(fract(q - 0.5) - 0.5) / w;
    return 1.0 - clamp(min(d.x, d.y) / width, 0.0, 1.0);
  }

  void main() {
    vec2 p = vWorld.xz;
    vec3 col = uPaper;
    for (int i = 0; i < 4; i++) {
      float d = length(p - uField[i].xy);
      float f = 1.0 - smoothstep(0.0, uField[i].z, d);
      col = mix(col, uTint[i], f * f * uField[i].w);
      // Survey contours in a band around each field.
      float r = d / 1.35;
      float ring = 1.0 - clamp(abs(fract(r) - 0.5) / max(fwidth(r), 1e-4) / 1.2, 0.0, 1.0);
      float band = smoothstep(uField[i].z * 0.42, uField[i].z * 0.6, d) * (1.0 - smoothstep(uField[i].z * 0.8, uField[i].z * 1.05, d));
      col = mix(col, uInk, ring * band * 0.05);
    }
    // Fine lines fade where they would crowd into a moire.
    float fine = clamp(1.6 - length(fwidth(p)) * 2.2, 0.0, 1.0);
    col = mix(col, uInk, grid(p, 1.0, 0.9) * 0.05 * fine + grid(p, 5.0, 1.1) * 0.085);
    for (int i = 0; i < 4; i++) {
      float d = length(p - uShadow[i].xy);
      float s = 1.0 - smoothstep(uShadow[i].z * 0.2, uShadow[i].z, d);
      col *= 1.0 - s * s * uShadow[i].w;
    }
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

/** Where an island's shadow lands on the sheet. */
function shadowAt(x: number, y: number, z: number): [number, number] {
  const h = y - SHEET_Y;
  return [x - (SUN.x / SUN.y) * h, z - (SUN.z / SUN.y) * h];
}

export function Sheet() {
  const material = useMemo(() => {
    const s = DISTRICTS.systems.centre;
    const a = DISTRICTS.algorithms.centre;
    const i = DISTRICTS.intelligence.centre;
    const shadows = [
      [...shadowAt(0, 0.3, 0), 6.2, 0.15],
      [...shadowAt(s[0], s[1], s[2]), 10, 0.16],
      [...shadowAt(a[0], a[1], a[2]), 8.6, 0.15],
      [...shadowAt(i[0], i[1], i[2]), 8.8, 0.16],
    ].map(([x, z, r, k]) => new THREE.Vector4(x, z, r, k));
    const fields = [
      [0, 0, 9, 0.5],
      [s[0], s[2], 15, 0.55],
      [a[0], a[2], 13.5, 0.55],
      [i[0], i[2], 14.5, 0.55],
    ].map(([x, z, r, k]) => new THREE.Vector4(x, z, r, k));
    const tints = ["#e9f2c8", "#f7d9c9", "#d3e2f3", "#e3d9f3"].map((c) => new THREE.Color(c));
    return new THREE.ShaderMaterial({
      fog: true,
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.fog,
        {
          uPaper: { value: new THREE.Color("#f3eee4") },
          uInk: { value: new THREE.Color("#2b3039") },
          uShadow: { value: shadows },
          uField: { value: fields },
          uTint: { value: tints },
        },
      ]),
      vertexShader: vertex,
      fragmentShader: fragment,
    });
  }, []);
  const geometry = useMemo(() => new THREE.PlaneGeometry(420, 420, 1, 1).rotateX(-Math.PI / 2), []);
  useEffect(
    () => () => {
      material.dispose();
      geometry.dispose();
    },
    [material, geometry],
  );
  return <mesh geometry={geometry} material={material} position={[0, SHEET_Y, 0]} renderOrder={-1} />;
}

/** A few far, small platforms: they give the world a scale beyond its edges. */
export function Distant({ palette }: { palette: Palette }) {
  const model = useMemo(() => {
    const k = new Kit();
    const spots: [number, number, number, number][] = [
      [-44, -7.4, -16, 2.4],
      [-34, -8.2, -40, 1.8],
      [42, -7.8, -34, 2.1],
      [50, -7.2, 6, 1.6],
      [-52, -8.0, 16, 2.0],
      [16, -8.4, -58, 2.2],
    ];
    spots.forEach(([x, y, z, r], n) => {
      k.slab(palette.plaster, circle(x, z, r, 28), y - 0.5, 0.5);
      k.cyl(palette.concrete, r * 0.8, 0.7, [x, y - 1.2, z], { top: r * 0.98, seg: 28 });
      k.cyl(palette.concrete, r * 0.45, 0.6, [x, y - 1.8, z], { top: r * 0.78, seg: 24 });
      if (n % 2 === 0) {
        k.box(palette.card, [r * 0.7, r * 0.55, r * 0.6], [x - r * 0.2, y, z], { r: 0.06 });
        k.box(palette.card, [r * 0.35, r * 0.9, r * 0.35], [x + r * 0.35, y, z - r * 0.2], { r: 0.05 });
      } else {
        k.cyl(palette.trunk, 0.06, 0.4, [x, y, z]);
        k.sphere(palette.sage, r * 0.32, [x, y + 0.55 + r * 0.2, z]);
      }
    });
    return k.build();
  }, [palette]);
  useDisposal(model);
  return <Model model={model} cast={false} receive={false} />;
}
