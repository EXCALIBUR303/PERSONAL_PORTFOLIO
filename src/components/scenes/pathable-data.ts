/**
 * A made-up campus. The 2D map and the 3D campus both read this file, so the
 * routing is identical in both.
 * A made-up campus. PathAble's own campus examples are fictional as well. */
export const places = {
  gate: { label: "Main gate", x: 8, y: 52 },
  quad: { label: "Quad", x: 34, y: 52 },
  library: { label: "Library", x: 58, y: 22 },
  cafe: { label: "Cafe", x: 60, y: 78 },
  lab: { label: "CS lab", x: 90, y: 30 },
  hostel: { label: "Hostel", x: 90, y: 80 },
  carpark: { label: "Car park", x: 70, y: 95 },
} as const;
export type Place = keyof typeof places;
export type Feature = "flat" | "stairs" | "steep" | "ramp";
export const paths: { id: string; a: Place; b: Place; feature: Feature }[] = [
  { id: "gate-quad", a: "gate", b: "quad", feature: "flat" },
  { id: "quad-library", a: "quad", b: "library", feature: "stairs" },
  { id: "quad-cafe", a: "quad", b: "cafe", feature: "flat" },
  { id: "cafe-library", a: "cafe", b: "library", feature: "ramp" },
  { id: "library-lab", a: "library", b: "lab", feature: "flat" },
  { id: "cafe-hostel", a: "cafe", b: "hostel", feature: "steep" },
  { id: "hostel-lab", a: "hostel", b: "lab", feature: "flat" },
  { id: "cafe-carpark", a: "cafe", b: "carpark", feature: "flat" },
  { id: "carpark-hostel", a: "carpark", b: "hostel", feature: "flat" },
];
export const profiles = {
  walk: { label: "Walking", avoids: [] as Feature[] },
  wheel: { label: "Wheelchair", avoids: ["stairs", "steep"] as Feature[] },
  slope: { label: "Avoid steep slopes", avoids: ["steep"] as Feature[] },
};
export type Profile = keyof typeof profiles;
export const length = (a: Place, b: Place) =>
  Math.hypot(places[a].x - places[b].x, places[a].y - places[b].y);

/** Dijkstra over the paths this profile may use. */
export function route(from: Place, to: Place, avoid: Feature[], closed: Set<string>) {
  const usable = paths.filter((p) => !avoid.includes(p.feature) && !closed.has(p.id));
  const dist: Record<string, number> = { [from]: 0 };
  const prev: Record<string, { place: Place; path: string }> = {};
  const open = new Set<Place>(Object.keys(places) as Place[]);
  while (open.size) {
    let at: Place | null = null;
    for (const p of open) if (dist[p] !== undefined && (at === null || dist[p] < dist[at])) at = p;
    if (at === null || at === to) break;
    open.delete(at);
    for (const p of usable) {
      const next = p.a === at ? p.b : p.b === at ? p.a : null;
      if (!next || !open.has(next)) continue;
      const d = dist[at] + length(p.a, p.b);
      if (dist[next] === undefined || d < dist[next]) {
        dist[next] = d;
        prev[next] = { place: at, path: p.id };
      }
    }
  }
  if (dist[to] === undefined) return null;
  const used: string[] = [];
  const stops: Place[] = [to];
  for (let at: Place = to; at !== from; at = prev[at].place) {
    used.unshift(prev[at].path);
    stops.unshift(prev[at].place);
  }
  return { used, stops, total: dist[to] };
}


/* ---------- 3D helpers ---------- */

/** Map units (0-100) to scene units. */
export const SCALE = 0.14;
export const worldX = (x: number) => (x - 50) * SCALE;
export const worldZ = (y: number) => (y - 50) * SCALE;

/**
 * How high a path rises along its length (t from 0 to 1). The campus is flat
 * and every feature is drawn as a local fixture on its path: stairs and the
 * ramp both carry the walker over the same low platform, and the steep path
 * crosses a short, sharp mound. Heights are illustrative; only the feature
 * labels come from the routing data.
 */
export function heightAt(feature: Feature, t: number): number {
  const ease = (a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)));
  const bump = (a: number, b: number, c: number, d: number) => Math.min(ease(a, b), 1 - ease(c, d));
  switch (feature) {
    case "stairs": {
      const k = bump(0.3, 0.45, 0.55, 0.7);
      return (Math.round(k * 5) / 5) * 0.5;
    }
    case "ramp":
      return bump(0.12, 0.45, 0.55, 0.88) * 0.5;
    case "steep": {
      const k = bump(0.38, 0.48, 0.52, 0.62);
      return k * k * (3 - 2 * k) * 0.9;
    }
    default:
      return 0;
  }
}

export type Sample = { x: number; y: number; z: number };

/** Points along one path, from `from` to the other end, with their heights. */
export function samplePath(id: string, from: Place, n = 28): Sample[] {
  const p = paths.find((q) => q.id === id)!;
  const a = places[from];
  const b = places[p.a === from ? p.b : p.a];
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    // Heights are symmetric, so direction only changes the order of the points.
    return {
      x: worldX(a.x + (b.x - a.x) * t),
      z: worldZ(a.y + (b.y - a.y) * t),
      y: heightAt(p.feature, t),
    };
  });
}

/** The whole route as one polyline, ready for a walker to follow. */
export function routeSamples(stops: Place[], used: string[]): Sample[] {
  return used.flatMap((id, i) => {
    const s = samplePath(id, stops[i]);
    return i ? s.slice(1) : s;
  });
}
