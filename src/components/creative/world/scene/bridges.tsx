"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DISTRICTS, DISTRICT_ORDER, STUDIO } from "../layout";
import type { District } from "../../identity";
import { Kit, Model, useDisposal, type V3 } from "./kit";
import { useOwn } from "./landmark";
import { useLevel } from "./motion";
import { ambient } from "../ambient";
import type { Palette } from "./palette";
import { bridgeAngle } from "./studio";

/*
 * Slender arched bridges from the Studio's podium to each district. The deck
 * edge carries the district's colour, so the way to each one reads before its
 * name does. While Private Local AI is in focus the Systems bridge goes dark
 * (its lamps out, its edge dimmed): nothing leaves the island.
 */
/** The height of a bridge's deck at `t` (0 at the Studio, 1 at the district): a straight run with a gentle arch. */
const archOf = (a: V3, b: V3) => {
  const rise = Math.min(0.5, Math.hypot(b[0] - a[0], b[2] - a[2]) * 0.09);
  return (t: number) => a[1] + (b[1] - a[1]) * t + Math.sin(Math.PI * t) * rise;
};

/** Where each bridge starts (the Studio's podium) and ends (its district's landing). */
function bridgeEnds() {
  return DISTRICT_ORDER.map((id) => {
    const f = DISTRICTS[id];
    const angle = bridgeAngle(id);
    const r = STUDIO.radius - 0.2;
    const start: V3 = [Math.cos(angle) * r, STUDIO.top + 0.02, Math.sin(angle) * r];
    const end: V3 = [f.centre[0] + f.landing[0], f.centre[1] + f.landing[1] + 0.02, f.centre[2] + f.landing[2]];
    return { id, start, end };
  });
}

function deck(k: Kit, p: Palette, edge: THREE.Material, lamp: THREE.Material, a: V3, b: V3) {
  const dx = b[0] - a[0];
  const dz = b[2] - a[2];
  const run = Math.hypot(dx, dz);
  const yaw = Math.atan2(dz, dx);
  const n = Math.max(8, Math.round(run / 0.32));
  const height = archOf(a, b);
  const side = [-Math.sin(yaw), Math.cos(yaw)];
  for (let i = 0; i < n; i++) {
    const t0 = i / n;
    const t1 = (i + 1) / n;
    const tm = (t0 + t1) / 2;
    const y0 = height(t0);
    const y1 = height(t1);
    const seg = Math.hypot(run / n, y1 - y0) + 0.012;
    const pitch = Math.atan2(y1 - y0, run / n);
    const x = a[0] + dx * tm;
    const z = a[2] + dz * tm;
    const y = (y0 + y1) / 2;
    const turn = { ry: -yaw, rz: pitch };
    k.box(p.card, [seg, 0.08, 0.92], [x, y - 0.08, z], turn);
    k.box(p.charcoal, [seg, 0.05, 0.22], [x, y - 0.2, z], turn);
    for (const s of [-1, 1]) {
      k.box(edge, [seg, 0.02, 0.05], [x + side[0] * s * 0.445, y - 0.012, z + side[1] * s * 0.445], turn);
      k.box(p.charcoal, [seg, 0.018, 0.018], [x + side[0] * s * 0.43, y + 0.27, z + side[1] * s * 0.43], turn);
      if (i % 2 === 0)
        k.box(p.charcoal, [0.018, 0.28, 0.018], [x + side[0] * s * 0.43, y - 0.005, z + side[1] * s * 0.43]);
    }
    if (i === Math.round(n / 3) || i === Math.round((2 * n) / 3)) {
      const lx = x + side[0] * 0.43;
      const lz = z + side[1] * 0.43;
      k.box(p.charcoal, [0.024, 0.5, 0.024], [lx, y, lz]);
      k.sphere(lamp, 0.045, [lx, y + 0.53, lz], { seg: 10 });
    }
  }
}

const CORAL = new THREE.Color("#ee8466");
const UNLIT = new THREE.Color("#6d6460");

export function Bridges({ palette, dark, reduced }: { palette: Palette; dark: boolean; reduced: boolean }) {
  // The Systems bridge has its own lamp and edge, so only it goes dark.
  const lamp = useOwn(palette.lamp);
  const edge = useOwn(palette.coral);
  const off = useLevel(dark, reduced, 0.35, 0.5);
  useFrame(() => {
    const k = off.current;
    lamp.setValues({ emissiveIntensity: 1.3 * (1 - k) });
    edge.setValues({ color: UNLIT.clone().lerpColors(CORAL, UNLIT, k * 0.9) });
  });
  const model = useMemo(() => {
    const k = new Kit();
    const edges: Record<District, THREE.Material> = {
      systems: edge,
      algorithms: palette.powder,
      intelligence: palette.lavender,
    };
    for (const { id, start, end } of bridgeEnds()) deck(k, palette, edges[id], id === "systems" ? lamp : palette.lamp, start, end);
    return k.build();
  }, [palette, edge, lamp]);
  useDisposal(model);
  return (
    <>
      <Model model={model} receive />
      <Crossings dark={dark} />
    </>
  );
}

/** The colour of the light that crosses each bridge: its district's accent, stronger than the deck edge. */
const CROSSING: Record<District, string> = { systems: "#ff7a4d", algorithms: "#4f6dff", intelligence: "#8f62f2" };

/**
 * Ambient (../ambient.ts): a small light leaves the Studio along one bridge at a time and travels to its district,
 * with a fainter one a little behind it, so the way from the centre to each district reads as a route. One bridge at
 * a time keeps it quiet. The Systems bridge has none while it is dark (Private Local AI in focus).
 */
function Crossings({ dark }: { dark: boolean }) {
  const parts = useMemo(() => {
    const bead = new THREE.SphereGeometry(0.15, 16, 12);
    const routes = bridgeEnds().map(({ id, start, end }) => {
      const head = new THREE.MeshBasicMaterial({ color: CROSSING[id], transparent: true, opacity: 0, toneMapped: false, depthWrite: false });
      const tail = head.clone();
      // A soft halo round the head, so the light reads at the overview's scale without being made larger itself.
      const halo = new THREE.MeshBasicMaterial({ color: CROSSING[id], transparent: true, opacity: 0, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending });
      return { id, start, end, arch: archOf(start, end), head, tail, halo };
    });
    return { bead, routes };
  }, []);
  useEffect(
    () => () => {
      parts.bead.dispose();
      for (const r of parts.routes) {
        r.head.dispose();
        r.tail.dispose();
        r.halo.dispose();
      }
    },
    [parts],
  );
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(() => {
    parts.routes.forEach((r, i) => {
      const head = meshes.current[i * 3];
      const tail = meshes.current[i * 3 + 1];
      const halo = meshes.current[i * 3 + 2];
      if (!head || !tail || !halo) return;
      const on = ambient.bridge.index === i && !(dark && r.id === "systems");
      const u = ambient.bridge.u;
      const place = (mesh: THREE.Mesh, material: THREE.MeshBasicMaterial, at: number, strength: number) => {
        const visible = on && at > 0 && at < 1;
        mesh.visible = visible;
        if (!visible) return;
        const x = r.start[0] + (r.end[0] - r.start[0]) * at;
        const z = r.start[2] + (r.end[2] - r.start[2]) * at;
        mesh.position.set(x, r.arch(at) + 0.05, z);
        // Fades in as it leaves the Studio and out as it arrives.
        material.opacity = strength * ambient.amount * Math.min(1, at * 6, (1 - at) * 6);
      };
      place(head, r.head, u, 0.95);
      // The halo and the trailing light are the finer detail (high tier only).
      place(halo, r.halo, ambient.rich ? u : 0, 0.3);
      place(tail, r.tail, ambient.rich ? u - 0.07 : 0, 0.4);
    });
  });
  return (
    <>
      {parts.routes.map((r, i) => (
        <group key={r.id}>
          <mesh ref={(m) => void (meshes.current[i * 3] = m)} geometry={parts.bead} material={r.head} visible={false} renderOrder={3} />
          <mesh ref={(m) => void (meshes.current[i * 3 + 1] = m)} geometry={parts.bead} material={r.tail} scale={0.65} visible={false} renderOrder={3} />
          <mesh ref={(m) => void (meshes.current[i * 3 + 2] = m)} geometry={parts.bead} material={r.halo} scale={2.6} visible={false} renderOrder={3} />
        </group>
      ))}
    </>
  );
}
