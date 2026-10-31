"use client";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PLACEMENTS } from "../layout";
import type { Kit } from "./kit";
import { smooth, useLevel } from "./motion";
import { ambient, seedOf } from "../ambient";
import { FEATURED } from "./ambient-clock";
import type { Palette } from "./palette";

/** What every landmark is told: its materials, whether it is the one in focus, and whether a filter dims it. */
/** `replay` turns true when a landmark is chosen, so a reaction that began on hover starts again with the camera. */
export type LandmarkProps = { palette: Palette; active: boolean; dim: boolean; reduced: boolean; replay?: boolean };

/** A flat rounded frame around a footprint, drawn on the ground. */
function frameGeometry(w: number, d: number) {
  const outline = (hw: number, hd: number, r: number) => {
    const s = new THREE.Shape();
    s.moveTo(-hw + r, -hd);
    s.lineTo(hw - r, -hd);
    s.quadraticCurveTo(hw, -hd, hw, -hd + r);
    s.lineTo(hw, hd - r);
    s.quadraticCurveTo(hw, hd, hw - r, hd);
    s.lineTo(-hw + r, hd);
    s.quadraticCurveTo(-hw, hd, -hw, hd - r);
    s.lineTo(-hw, -hd + r);
    s.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
    return s;
  };
  const outer = outline(w / 2 + 0.24, d / 2 + 0.24, 0.22);
  outer.holes.push(outline(w / 2 + 0.13, d / 2 + 0.13, 0.14));
  return new THREE.ShapeGeometry(outer, 4).rotateX(-Math.PI / 2);
}

/**
 * How far a landmark floats either way, in world units (about 1.5 to 2 px at the overview framing on a laptop, so
 * 3 to 4 px from top to bottom, measured), and how far an explorable one turns either way, in radians (half a degree).
 */
const FLOAT = 0.08;
const SWAY = 0.009;

/**
 * Puts a landmark on its footprint. While it is in focus (hovered, focused or
 * selected) it lifts a little and a lime frame is drawn round it on the ground.
 *
 * Ambient motion (../ambient.ts): in the full level every landmark floats slowly on its own period and phase, so no
 * two move together, and the explorable ones turn a fraction of a degree. The station's button, marker and label
 * are DOM elements placed from the footprint, not from the moving group, so they never move with it (the markers'
 * turn-taking ripple is in world.css).
 */
export function Placed({ slug, active, reduced, children }: { slug: string; active: boolean; reduced: boolean; children: ReactNode }) {
  const p = PLACEMENTS[slug];
  const group = useRef<THREE.Group>(null);
  const lift = useLevel(active, reduced, 0.2, 0.32);
  const frame = useMemo(() => frameGeometry(p.size[0] / p.scale, p.size[2] / p.scale), [p]);
  const ink = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#c8f13b", transparent: true, opacity: 0, depthWrite: false }),
    [],
  );
  useEffect(
    () => () => {
      frame.dispose();
      ink.dispose();
    },
    [frame, ink],
  );
  const own = useMemo(() => {
    const seed = seedOf(slug);
    return { period: 5.8 + seed * 3.2, phase: seed * Math.PI * 2, turn: 11 + seed * 5, featured: FEATURED.indexOf(slug) };
  }, [slug]);
  useFrame(() => {
    const t = smooth(lift.current);
    const a = ambient.amount;
    const full = ambient.level === "full" && a > 0;
    const s = ambient.t;
    const float = full ? a * FLOAT * Math.sin((s * Math.PI * 2) / own.period + own.phase) : 0;
    const g = group.current;
    if (g) {
      g.position.y = p.base[1] + (reduced ? 0 : t * 0.06) + float;
      g.rotation.y = full && ambient.rich && own.featured >= 0 ? a * SWAY * Math.sin((s * Math.PI * 2) / own.turn + own.phase * 0.7) : 0;
    }
    ink.setValues({ opacity: t * 0.95 });
  });
  return (
    <group ref={group} name={slug} position={p.base} scale={p.scale}>
      <mesh geometry={frame} material={ink} position={[0, 0.012, 0]} renderOrder={2} />
      {children}
    </group>
  );
}

/**
 * A copy of a palette material that one landmark can animate on its own.
 * `setup` runs once on the new copy (an emissive colour, say).
 */
export function useOwn<T extends THREE.Material>(source: T, setup?: (material: T) => void): T {
  const own = useMemo(() => {
    const copy = source.clone() as T;
    setup?.(copy);
    return copy;
    // `setup` only shapes the first copy.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);
  useEffect(() => () => own.dispose(), [own]);
  return own;
}

/** Exhibit stations stand on a white plinth with a lime inlay, as on the 2D map. */
export function exhibitPad(k: Kit, p: Palette, w: number, d: number) {
  k.box(p.card, [w, 0.06, d], [0, 0, 0], { r: 0.03 });
  const inset = 0.1;
  const t = 0.05;
  const y = 0.06;
  k.box(p.lime, [w - inset * 2, 0.007, t], [0, y, -(d / 2 - inset)]);
  k.box(p.lime, [w - inset * 2, 0.007, t], [0, y, d / 2 - inset]);
  k.box(p.lime, [t, 0.007, d - inset * 2], [-(w / 2 - inset), y, 0]);
  k.box(p.lime, [t, 0.007, d - inset * 2], [w / 2 - inset, y, 0]);
}

/** Briefing stations stand on plain paving. */
export function briefPad(k: Kit, material: THREE.Material, w: number, d: number) {
  k.box(material, [w, 0.03, d], [0, 0, 0], { r: 0.02 });
}

/** A small car, parked along x or z. */
export function car(k: Kit, p: Palette, x: number, y: number, z: number, body: THREE.Material, along: "x" | "z") {
  const L = 0.36;
  const W = 0.17;
  const s = (a: number, b: number, c: number): [number, number, number] => (along === "z" ? [b, a, c] : [c, a, b]);
  k.box(p.charcoal, s(0.04, W - 0.03, L - 0.07), [x, y, z]);
  k.box(body, s(0.085, W, L), [x, y + 0.03, z], { r: 0.03 });
  k.box(p.glassDark, s(0.07, W - 0.025, L * 0.52), [x, y + 0.1, z], { r: 0.025 });
}

/** A low-poly tree. */
export function tree(k: Kit, p: Palette, x: number, y: number, z: number, size = 1, tone: THREE.Material = p.sage) {
  k.cyl(p.trunk, 0.04 * size, 0.3 * size, [x, y, z], { seg: 7 });
  k.sphere(tone, 0.26 * size, [x, y + 0.5 * size, z], { seg: 10, squash: 1.15 });
}

/** A street lamp. */
export function lamp(k: Kit, p: Palette, x: number, y: number, z: number) {
  k.cyl(p.charcoal, 0.016, 0.56, [x, y, z], { seg: 6 });
  k.sphere(p.lamp, 0.045, [x, y + 0.6, z], { seg: 8 });
}

/** A letter sign texture, drawn once. */
export function letterTexture(letter: string, background: string, ink: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  g.fillStyle = background;
  g.fillRect(0, 0, 64, 64);
  g.fillStyle = ink;
  g.font = "700 46px Inter, system-ui, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(letter, 32, 35);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
