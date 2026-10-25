"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { CHART_SHAPES, DISTRICTS, PLACEMENTS } from "../layout";
import { bridgeAngle } from "./studio";

/*
 * The chart table the archipelago floats over: a survey chart far below the
 * islands, drawn in one shader so it costs a single draw call and stays crisp
 * at any distance. A pool of warm light sits under the world and falls off to a
 * cool slate at the edges; contour lines follow each island's real outline and
 * widen with distance; sparse survey crosses and the bridges' own axes, run on
 * across the chart, tie it to the architecture. Each island's shadow is thrown
 * well away from it by the low sun, so the height reads. Fog fades the sheet
 * into the slate at the edge (the stage's own haze colour).
 */
export const SHEET_Y = -10;
/** Direction towards the key light (the same light that casts the real shadows): azimuth as before, 40 degrees up. */
export const SUN = new THREE.Vector3(-0.572, 0.643, 0.509).normalize();

/** The chart's three tones, from the pool under the world out to the cool edge. */
export const CHART = { pool: "#ebe5d9", mid: "#d9d6cd", edge: "#b4bbbd" };

const MAX_SHAPES = 12;

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
  uniform vec3 uPool;
  uniform vec3 uMid;
  uniform vec3 uEdge;
  uniform vec3 uInk;
  uniform vec3 uLight;
  uniform vec4 uShape[${MAX_SHAPES}];
  uniform float uRound[${MAX_SHAPES}];
  uniform vec4 uShadow[4];
  uniform vec2 uAxis[3];
  uniform vec4 uShoal[3];
  varying vec3 vWorld;

  float sdRound(vec2 p, vec4 s, float r) {
    vec2 q = abs(p - s.xy) - s.zw + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }
  float aa(float v, float w) { return 1.0 - smoothstep(0.0, w, v); }

  void main() {
    vec2 p = vWorld.xz;
    // The pool of light: warm under the world, cool slate at the edge.
    float rr = length(p - uLight.xy);
    float R = uLight.z;
    vec3 col = mix(uPool, uMid, smoothstep(0.0, R * 0.55, rr));
    col = mix(col, uEdge, smoothstep(R * 0.5, R * 1.15, rr));
    float pool = 1.0 - smoothstep(R * 0.35, R * 0.8, rr);

    // Contours follow the islands' outlines and widen with distance.
    float d = 1e3;
    for (int i = 0; i < ${MAX_SHAPES}; i++) {
      if (uShape[i].z > 0.0) d = min(d, sdRound(p, uShape[i], uRound[i]));
    }
    float s = sqrt(max(d, 0.0)) * 1.5;
    float line = aa(abs(fract(s - 0.5) - 0.5) / max(fwidth(s), 1e-4), 1.1);
    float reach = 1.0 - smoothstep(7.0, 15.0, d);
    col *= 1.0 - 0.014 * min(floor(s), 5.0) * reach;
    col = mix(col, uInk, line * reach * 0.06 * step(0.0, d));

    // Far shoals: contour clusters with no geometry, unbuilt sites further off.
    for (int i = 0; i < 3; i++) {
      float ds = length(p - uShoal[i].xy);
      float rs = ds / 0.9;
      float rl = aa(abs(fract(rs) - 0.5) / max(fwidth(rs), 1e-4), 1.0);
      float within = 1.0 - smoothstep(uShoal[i].z * 0.6, uShoal[i].z, ds);
      col = mix(col, uInk, rl * within * uShoal[i].w);
    }

    // Survey crosses, only inside the pool.
    vec2 q = (fract(p / 10.0 + 0.5) - 0.5) * 10.0;
    float w = max(fwidth(p.x), 1e-3);
    float cx = (1.0 - smoothstep(0.03, 0.03 + w, abs(q.y))) * (1.0 - smoothstep(0.35, 0.35 + w, abs(q.x)));
    float cy = (1.0 - smoothstep(0.03, 0.03 + w, abs(q.x))) * (1.0 - smoothstep(0.35, 0.35 + w, abs(q.y)));
    col = mix(col, uInk, max(cx, cy) * pool * 0.07);

    // The bridges' axes, run on across the chart as dashed construction lines.
    for (int i = 0; i < 3; i++) {
      vec2 dir = uAxis[i];
      float along = dot(p, dir);
      float perp = abs(p.x * dir.y - p.y * dir.x);
      float onAxis = aa(perp / max(fwidth(perp), 1e-4), 1.0) * step(5.0, along) * step(along, R * 1.1);
      float dash = step(fract(along * 0.55), 0.5);
      col = mix(col, uInk, onAxis * dash * (1.0 - smoothstep(R * 0.35, R * 0.9, along)) * 0.07);
    }

    // Island shadows, cool, thrown away from the key light.
    for (int i = 0; i < 4; i++) {
      float ds = length(p - uShadow[i].xy);
      float sh = 1.0 - smoothstep(uShadow[i].z * 0.2, uShadow[i].z, ds);
      col = mix(col, col * vec3(0.62, 0.68, 0.78), min(1.0, sh * sh * uShadow[i].w * 1.3));
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
      [...shadowAt(0, 0.4, 0), 6.4, 0.18],
      [...shadowAt(s[0], s[1], s[2]), 10.5, 0.2],
      [...shadowAt(a[0], a[1], a[2]), 8.8, 0.18],
      [...shadowAt(i[0], i[1], i[2]), 9, 0.2],
    ].map(([x, z, r, k]) => new THREE.Vector4(x, z, r, k));
    const shapes = Array.from({ length: MAX_SHAPES }, (_, n) => {
      const c = CHART_SHAPES[n];
      return c ? new THREE.Vector4(c[0], c[1], c[2], c[3]) : new THREE.Vector4(0, 0, 0, 0);
    });
    const rounds = Array.from({ length: MAX_SHAPES }, (_, n) => (CHART_SHAPES[n] ? CHART_SHAPES[n][4] : 0));
    const axes = [DISTRICTS.systems.id, DISTRICTS.algorithms.id, DISTRICTS.intelligence.id].map((id) => {
      const a2 = bridgeAngle(id);
      return new THREE.Vector2(Math.cos(a2), Math.sin(a2));
    });
    // Shoals sit well out in the empty corners of the overview.
    const shoals = [
      [-14.6, 16.2, 6.2, 0.05],
      [21.3, -7.5, 6.8, 0.05],
      [-16.1, -18.3, 6.0, 0.045],
    ].map(([x, z, r, k]) => new THREE.Vector4(x, z, r, k));
    return new THREE.ShaderMaterial({
      fog: true,
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.fog,
        {
          uPool: { value: new THREE.Color(CHART.pool) },
          uMid: { value: new THREE.Color(CHART.mid) },
          uEdge: { value: new THREE.Color(CHART.edge) },
          uInk: { value: new THREE.Color("#2b3039") },
          uLight: { value: new THREE.Vector3(-1.5, 0.5, 30) },
          uShape: { value: shapes },
          uRound: { value: rounds },
          uShadow: { value: shadows },
          uAxis: { value: axes },
          uShoal: { value: shoals },
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

/** A soft dark pool, drawn once and shared by every footprint. */
function groundingTexture() {
  const size = 64;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(size / 2, size / 2, size * 0.18, size / 2, size / 2, size / 2);
  grad.addColorStop(0, "rgba(52,44,40,0.26)");
  grad.addColorStop(0.55, "rgba(52,44,40,0.12)");
  grad.addColorStop(1, "rgba(40,34,30,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * Contact grounding: a faint shadow pool under each landmark's footprint, where
 * walls meet the ground. It is ambient occlusion without a post-processing pass:
 * one texture, one draw call for all twenty.
 */
export function Grounding() {
  const texture = useMemo(() => groundingTexture(), []);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
        fog: false,
      }),
    [texture],
  );
  const geometry = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    for (const p of Object.values(PLACEMENTS)) {
      const w = p.size[0] * 1.3;
      const d = p.size[2] * 1.3;
      const g = new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2).translate(p.base[0], p.base[1] + 0.012, p.base[2]);
      parts.push(g);
    }
    const merged = new THREE.BufferGeometry();
    const pos: number[] = [];
    const uv: number[] = [];
    for (const g of parts) {
      const ng = g.toNonIndexed();
      pos.push(...(ng.attributes.position.array as Float32Array));
      uv.push(...(ng.attributes.uv.array as Float32Array));
      g.dispose();
      ng.dispose();
    }
    merged.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    merged.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    return merged;
  }, []);
  useEffect(
    () => () => {
      texture.dispose();
      material.dispose();
      geometry.dispose();
    },
    [texture, material, geometry],
  );
  return <mesh geometry={geometry} material={material} renderOrder={1} />;
}
