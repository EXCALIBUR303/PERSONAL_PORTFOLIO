import type { CSSProperties, ReactNode } from "react";

/**
 * A tiny isometric drawing kit for the Creative studio map. Everything is plain
 * SVG polygons: no canvas, no WebGL, no dependency. Ground coordinates are
 * (x, y) and z is height; a point projects to screen as
 *   sx = (x - y) * cos 30deg,  sy = (x + y) / 2 - z.
 * Light comes from the upper left, so the left face is mid, the right face is
 * dark and the top is the pure colour. Faces take their shades from one colour
 * (--p) in CSS, so every object on the map shares the same lighting.
 */
const C = Math.sqrt(3) / 2;

export type P2 = [number, number];
export const iso = (x: number, y: number, z = 0): P2 => [(x - y) * C, (x + y) / 2 - z];
const at = ([x, y]: P2) => `${x.toFixed(2)},${y.toFixed(2)}`;
export const poly = (...points: P2[]) => points.map(at).join(" ");
const tone = (c: string): CSSProperties => ({ "--p": c }) as CSSProperties;

type BoxProps = { x: number; y: number; z?: number; w: number; d: number; h: number; c: string };

/** A rectangular block whose back-left ground corner is (x, y). */
export function Box({ x, y, z = 0, w, d, h, c }: BoxProps) {
  const top = poly(iso(x, y, z + h), iso(x + w, y, z + h), iso(x + w, y + d, z + h), iso(x, y + d, z + h));
  const left = poly(iso(x, y + d, z + h), iso(x + w, y + d, z + h), iso(x + w, y + d, z), iso(x, y + d, z));
  const right = poly(iso(x + w, y, z + h), iso(x + w, y + d, z + h), iso(x + w, y + d, z), iso(x + w, y, z));
  return (
    <g style={tone(c)}>
      <polygon className="iso-l" points={left} />
      <polygon className="iso-r" points={right} />
      <polygon className="iso-t" points={top} />
    </g>
  );
}

/** A ramp that climbs along +x from height z to z + h. */
export function Ramp({ x, y, z = 0, w, d, h, c }: BoxProps) {
  const slope = poly(iso(x, y, z), iso(x + w, y, z + h), iso(x + w, y + d, z + h), iso(x, y + d, z));
  const left = poly(iso(x, y + d, z), iso(x + w, y + d, z), iso(x + w, y + d, z + h));
  const right = poly(iso(x + w, y, z), iso(x + w, y + d, z), iso(x + w, y + d, z + h), iso(x + w, y, z + h));
  return (
    <g style={tone(c)}>
      <polygon className="iso-l" points={left} />
      <polygon className="iso-r" points={right} />
      <polygon className="iso-t" points={slope} />
    </g>
  );
}

/** A thin flat slab, used for floors, plinths and pads. */
export const Slab = (p: Omit<BoxProps, "h"> & { h?: number }) => <Box {...p} h={p.h ?? 3} />;

/** An upright cylinder. */
export function Cyl({
  cx,
  cy,
  z = 0,
  r,
  h,
  c,
}: {
  cx: number;
  cy: number;
  z?: number;
  r: number;
  h: number;
  c: string;
}) {
  const [bx, by] = iso(cx, cy, z);
  const [, ty] = iso(cx, cy, z + h);
  const rx = r * 1.2247;
  const ry = r * 0.7071;
  return (
    <g style={tone(c)}>
      <path
        className="iso-l"
        d={`M${bx - rx},${ty} L${bx - rx},${by} A${rx},${ry} 0 0 0 ${bx},${by + ry} L${bx},${ty + ry} Z`}
      />
      <path
        className="iso-r"
        d={`M${bx + rx},${ty} L${bx + rx},${by} A${rx},${ry} 0 0 1 ${bx},${by + ry} L${bx},${ty + ry} Z`}
      />
      <ellipse className="iso-t" cx={bx} cy={ty} rx={rx} ry={ry} />
    </g>
  );
}

/** A ball resting at height z (its centre is at z + r). */
export function Sphere({ cx, cy, z = 0, r, c }: { cx: number; cy: number; z?: number; r: number; c: string }) {
  const [sx, sy] = iso(cx, cy, z + r);
  return (
    <g style={tone(c)}>
      <circle className="iso-r" cx={sx} cy={sy} r={r} />
      <circle className="iso-l" cx={sx - r * 0.12} cy={sy - r * 0.1} r={r * 0.86} />
      <circle className="iso-t" cx={sx - r * 0.3} cy={sy - r * 0.32} r={r * 0.5} />
    </g>
  );
}

/** A circle of radius r drawn flat on the ground plane (a ring, a marker). */
export function Ring({
  cx,
  cy,
  z = 0,
  r,
  className = "iso-ring",
}: {
  cx: number;
  cy: number;
  z?: number;
  r: number;
  className?: string;
}) {
  const [sx, sy] = iso(cx, cy, z);
  return <ellipse className={className} cx={sx} cy={sy} rx={r * 1.2247} ry={r * 0.7071} />;
}

/** The soft contact shadow under an object: its footprint, pushed down and right. */
export function Shadow({ x, y, w, d, grow = 0 }: { x: number; y: number; w: number; d: number; grow?: number }) {
  const o = 5;
  return (
    <polygon
      className="iso-shadow"
      points={poly(
        iso(x - grow + o, y - grow + o),
        iso(x + w + grow + o, y - grow + o),
        iso(x + w + grow + o, y + d + grow + o),
        iso(x - grow + o, y + d + grow + o),
      )}
    />
  );
}

/*
 * Decals. Each wrapper maps flat 2D drawing onto one face of the isometric
 * world, so windows, screens, stripes and lettering sit on the surfaces they
 * belong to. In each, coordinates are the ones you would use for that face:
 *   LeftFace  (the face that looks down-left, plane y = const): u = x, v = up
 *   RightFace (the face that looks down-right, plane x = const): u = y, v = up
 *   TopFace   (plane z = const): u = x, v = y
 */
export function LeftFace({ y, z = 0, children }: { y: number; z?: number; children: ReactNode }) {
  return <g transform={`matrix(${C} 0.5 0 -1 ${-y * C} ${y / 2 - z})`}>{children}</g>;
}
export function RightFace({ x, z = 0, children }: { x: number; z?: number; children: ReactNode }) {
  return <g transform={`matrix(${-C} 0.5 0 -1 ${x * C} ${x / 2 - z})`}>{children}</g>;
}
export function TopFace({ z = 0, children }: { z?: number; children: ReactNode }) {
  return <g transform={`matrix(${C} 0.5 ${-C} 0.5 0 ${-z})`}>{children}</g>;
}

/** A thin pole, drawn as a very small box. */
export const Pole = ({ x, y, z = 0, h, c, s = 1.6 }: { x: number; y: number; z?: number; h: number; c: string; s?: number }) => (
  <Box x={x - s / 2} y={y - s / 2} z={z} w={s} d={s} h={h} c={c} />
);
