import type { District } from "../identity";
import { HubFlag, StudioBuilding, Gate } from "./landmarks";
import { stations, type Station } from "./stations";

/*
 * Geometry of the campus. Every district is a 9 x 9 ground plate drawn in a
 * 640 x 440 box; the three boxes sit in a 1200 x 690 stage around the Studio.
 * These numbers are the single source for the drawing, the buttons and the
 * station preview, so they always agree.
 */
export const PLATE = { w: 640, h: 440, u: 39.8, ox: 320, oy: 62, thick: 16, n: 9 };
const C = Math.sqrt(3) / 2;
export const plateXY = (gx: number, gy: number): [number, number] => [
  PLATE.ox + (gx - gy) * PLATE.u * C,
  PLATE.oy + ((gx + gy) * PLATE.u) / 2,
];

export const STAGE = { w: 1200, h: 716 };
/** Where each district's box sits in the stage, in stage units. */
export const islands: Record<District, { x: number; y: number; w: number }> = {
  systems: { x: 0, y: 8, w: 580 },
  algorithms: { x: 620, y: 8, w: 580 },
  intelligence: { x: 310, y: 300, w: 580 },
};
export const STUDIO = { x: 600, y: 262 };
export const GATE = { x: 120, y: 640 };

/** A point on a district plate, as a percentage of the stage (before any zoom). */
export function stagePoint(district: District, sx: number, sy: number): [number, number] {
  const box = islands[district];
  const k = box.w / PLATE.w;
  return [((box.x + sx * k) / STAGE.w) * 100, ((box.y + sy * k) / STAGE.h) * 100];
}
export const stationPoint = (s: Station) => stagePoint(s.district, ...plateXY(...s.at));
export const hubPoint = (d: District) => stagePoint(d, ...plateXY(4.5, 4.5));

/**
 * The street plan gives each district its own character: Systems has one main
 * street with spurs, Algorithms a crossing of two streets (a grid), Intelligence
 * a spine running the other way.
 */
type Pt = [number, number];
export function routeFor(s: Station): Pt[] {
  const [gx, gy] = s.at;
  const hub: Pt = [4.5, 4.5];
  if (s.district === "systems") return [[gx, gy], [gx, 4.5], hub];
  if (s.district === "intelligence") return [[gx, gy], [4.5, gy], hub];
  return Math.abs(gy - 4.5) <= Math.abs(gx - 4.5)
    ? [[gx, gy], [gx, 4.5], hub]
    : [[gx, gy], [4.5, gy], hub];
}
const streets: Record<District, Pt[][]> = {
  systems: [[[0.4, 4.5], [8.6, 4.5]]],
  algorithms: [[[0.4, 4.5], [8.6, 4.5]], [[4.5, 0.4], [4.5, 8.6]]],
  intelligence: [[[4.5, 0.4], [4.5, 8.6]]],
};

const pts = (list: Pt[]) => list.map(([gx, gy]) => plateXY(gx, gy).map((n) => n.toFixed(1)).join(",")).join(" ");

/** The ground: slab, tiles, the district's own surface detail, the streets and the plaza. */
export function Plate({
  district,
  active,
}: {
  district: District;
  /** Slug whose street should light up. */
  active: string | null;
}) {
  const { n } = PLATE;
  const corner = (gx: number, gy: number, drop = 0) => {
    const [x, y] = plateXY(gx, gy);
    return `${x.toFixed(1)},${(y + drop).toFixed(1)}`;
  };
  const top = [corner(0, 0), corner(n, 0), corner(n, n), corner(0, n)].join(" ");
  const left = [corner(0, n), corner(n, n), corner(n, n, PLATE.thick), corner(0, n, PLATE.thick)].join(" ");
  const right = [corner(n, 0), corner(n, n), corner(n, n, PLATE.thick), corner(n, 0, PLATE.thick)].join(" ");
  const grid: string[] = [];
  for (let i = 1; i < n; i++) {
    grid.push(`M${corner(i, 0)} L${corner(i, n)}`, `M${corner(0, i)} L${corner(n, i)}`);
  }
  const route = active ? stations.find((s) => s.slug === active && s.district === district) : undefined;
  const hub = plateXY(4.5, 4.5);
  return (
    <g className={`pl pl-${district}`}>
      <polygon className="pl-left" points={left} />
      <polygon className="pl-right" points={right} />
      <polygon className="pl-top" points={top} />
      <path className="pl-grid" d={grid.join(" ")} />
      <Detail district={district} />
      {/* streets: outline, tarmac, centre line */}
      <g className="pl-streets">
        {streets[district].map((line, i) => (
          <polyline key={`o${i}`} className="pl-road-edge" points={pts(line)} />
        ))}
        {stations
          .filter((s) => s.district === district)
          .map((s) => (
            <polyline key={`e${s.slug}`} className="pl-road-edge" points={pts(routeFor(s))} />
          ))}
        {streets[district].map((line, i) => (
          <polyline key={`t${i}`} className="pl-road" points={pts(line)} />
        ))}
        {stations
          .filter((s) => s.district === district)
          .map((s) => (
            <polyline key={`r${s.slug}`} className="pl-road" points={pts(routeFor(s))} />
          ))}
        {streets[district].map((line, i) => (
          <polyline key={`c${i}`} className="pl-road-mid" points={pts(line)} />
        ))}
        {route && <polyline className="pl-road-hot" points={pts(routeFor(route))} />}
      </g>
      <g transform={`translate(${hub[0].toFixed(1)} ${hub[1].toFixed(1)}) scale(0.9)`} className="pl-hub">
        <HubFlag color={`var(--d-${district})`} />
      </g>
    </g>
  );
}

function Detail({ district }: { district: District }) {
  const p = (gx: number, gy: number) => plateXY(gx, gy).map((v) => v.toFixed(1)).join(" ");
  if (district === "systems") {
    // Workshop floor: heavy panel seams every three tiles, rivets, and a cable run.
    const seams: string[] = [];
    for (const i of [3, 6]) seams.push(`M${p(i, 0)} L${p(i, 9)}`, `M${p(0, i)} L${p(9, i)}`);
    const rivets = [3, 6].flatMap((a) => [3, 6].map((b) => plateXY(a, b)));
    return (
      <g className="pl-detail">
        <path className="pl-seam" d={seams.join(" ")} />
        {rivets.map(([x, y], i) => (
          <circle key={i} className="pl-rivet" cx={x} cy={y} r={2.2} />
        ))}
        <path className="pl-cable" d={`M${p(0.6, 8.2)} L${p(3.2, 8.2)} L${p(3.2, 6.8)} L${p(6.4, 6.8)} L${p(6.4, 8.6)}`} />
      </g>
    );
  }
  if (district === "algorithms") {
    // Atlas sheet: contour rings and coordinate ticks along the edges.
    const rings = [1.4, 2.4, 3.4].map((r) => {
      const [cx, cy] = plateXY(6.3, 6.9);
      return <ellipse key={r} className="pl-contour" cx={cx} cy={cy} rx={r * PLATE.u * C * 1.1} ry={r * PLATE.u * 0.55} />;
    });
    const ticks = Array.from({ length: 9 }, (_, i) => {
      const [x, y] = plateXY(i + 0.5, 0);
      return (
        <text key={i} className="pl-tick" x={x + 4} y={y - 4}>
          {String.fromCharCode(65 + i)}
        </text>
      );
    });
    return (
      <g className="pl-detail">
        {rings}
        {ticks}
      </g>
    );
  }
  // Lab: dot lattice and a few circuit traces.
  const dots: [number, number][] = [];
  for (let a = 0.5; a < 9; a += 1) for (let b = 0.5; b < 9; b += 1) dots.push(plateXY(a, b));
  return (
    <g className="pl-detail">
      {dots.map(([x, y], i) => (
        <circle key={i} className="pl-dot" cx={x} cy={y} r={1.1} />
      ))}
      <path className="pl-trace" d={`M${p(0.6, 7.6)} L${p(2.6, 7.6)} L${p(2.6, 6.4)} L${p(5.6, 6.4)}`} />
      <path className="pl-trace" d={`M${p(8.4, 1.4)} L${p(6.4, 1.4)} L${p(6.4, 3.4)} L${p(8.4, 3.4)}`} />
      <circle className="pl-via" cx={plateXY(5.6, 6.4)[0]} cy={plateXY(5.6, 6.4)[1]} r={3} />
      <circle className="pl-via" cx={plateXY(8.4, 3.4)[0]} cy={plateXY(8.4, 3.4)[1]} r={3} />
    </g>
  );
}

/** Roads between the districts and the Studio, drawn under the islands. */
export function Connectors() {
  const toStage = ([x, y]: [number, number]) => [(x / 100) * STAGE.w, (y / 100) * STAGE.h] as const;
  const studio: [number, number] = [STUDIO.x, STUDIO.y];
  const links = (["systems", "algorithms", "intelligence"] as District[]).map((d) => {
    const [x, y] = toStage(hubPoint(d));
    const mx = (x + studio[0]) / 2;
    return { d, path: `M${x},${y} C${mx},${y} ${studio[0]},${(y + studio[1]) / 2} ${studio[0]},${studio[1] + 10}` };
  });
  const gate = `M${GATE.x},${GATE.y} C${GATE.x + 150},${GATE.y - 40} ${STUDIO.x - 160},${STUDIO.y + 90} ${STUDIO.x},${STUDIO.y + 30}`;
  return (
    <svg className="c-connect" viewBox={`0 0 ${STAGE.w} ${STAGE.h}`} aria-hidden="true" focusable="false">
      <path className="cn-edge" d={gate} />
      {links.map((l) => (
        <path key={l.d} className="cn-edge" d={l.path} />
      ))}
      <path className="cn-line" d={gate} />
      {links.map((l) => (
        <path key={l.d} className="cn-line" d={l.path} />
      ))}
      {/* Ambient (map-2d.css): a short district-coloured light travels from the Studio along one link at a time. */}
      {links.map((l, i) => (
        <path key={`flow-${l.d}`} className="cn-flow" data-district={l.d} d={l.path} pathLength={100} style={{ animationDelay: `${i * 3.4}s` }} />
      ))}
    </svg>
  );
}

/** The Studio building and the entrance gate are drawn at stage scale. */
export function StudioArt() {
  return (
    <svg viewBox="-70 -110 140 140" className="c-glyph c-glyph-studio" aria-hidden="true" focusable="false">
      <StudioBuilding />
    </svg>
  );
}
export function GateArt() {
  return (
    <svg viewBox="-40 -50 80 60" className="c-glyph" aria-hidden="true" focusable="false">
      <Gate />
    </svg>
  );
}
