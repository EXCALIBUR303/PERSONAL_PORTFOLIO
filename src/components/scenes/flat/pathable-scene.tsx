"use client";
import { useMemo, useState } from "react";

/** A made-up campus. PathAble's own campus examples are fictional as well. */
const places = {
  gate: { label: "Main gate", x: 8, y: 52 },
  quad: { label: "Quad", x: 34, y: 52 },
  library: { label: "Library", x: 58, y: 22 },
  cafe: { label: "Cafe", x: 60, y: 78 },
  lab: { label: "CS lab", x: 90, y: 30 },
  hostel: { label: "Hostel", x: 90, y: 80 },
  carpark: { label: "Car park", x: 70, y: 95 },
} as const;
type Place = keyof typeof places;
type Feature = "flat" | "stairs" | "steep" | "ramp";
const paths: { id: string; a: Place; b: Place; feature: Feature }[] = [
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
const profiles = {
  walk: { label: "Walking", avoids: [] as Feature[] },
  wheel: { label: "Wheelchair", avoids: ["stairs", "steep"] as Feature[] },
  slope: { label: "Avoid steep slopes", avoids: ["steep"] as Feature[] },
};
type Profile = keyof typeof profiles;
const length = (a: Place, b: Place) =>
  Math.hypot(places[a].x - places[b].x, places[a].y - places[b].y);

/** Dijkstra over the paths this profile may use. */
function route(from: Place, to: Place, avoid: Feature[], closed: Set<string>) {
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

export default function PathAbleScene() {
  const [profile, setProfile] = useState<Profile>("walk");
  const [blocked, setBlocked] = useState(false);
  const closed = useMemo(() => new Set(blocked ? ["cafe-library"] : []), [blocked]);
  const result = useMemo(() => route("gate", "lab", profiles[profile].avoids, closed), [profile, closed]);
  const used = new Set(result?.used ?? []);
  const avoided = profiles[profile].avoids;
  return (
    <div className="lz-viz fl-pathable">
      <div className="lz-seg" role="group" aria-label="Travel profile">
        {(Object.keys(profiles) as Profile[]).map((p) => (
          <button key={p} type="button" aria-pressed={profile === p} onClick={() => setProfile(p)}>
            {profiles[p].label}
          </button>
        ))}
      </div>
      <svg className="fl-map" viewBox="0 0 100 100" role="img" aria-label={`Campus map. Route from the main gate to the CS lab for ${profiles[profile].label}.`}>
        <rect width="100" height="100" className="fl-ground" />
        {paths.map((p) => {
          const a = places[p.a], b = places[p.b];
          const off = avoided.includes(p.feature) || closed.has(p.id);
          return (
            <g key={p.id}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="fl-edge" data-feature={p.feature} data-off={off || undefined} data-used={used.has(p.id) || undefined} />
              {p.feature !== "flat" && (
                <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 2} textAnchor="middle" className="fl-small">
                  {closed.has(p.id) ? "reported blocked" : p.feature}
                </text>
              )}
            </g>
          );
        })}
        {(Object.keys(places) as Place[]).map((id) => (
          <g key={id} className="fl-stop">
            <circle cx={places[id].x} cy={places[id].y} r={3.6} data-end={id === "gate" || id === "lab" || undefined} />
            <text x={places[id].x} y={places[id].y - 5.5} textAnchor="middle" className="fl-small">{places[id].label}</text>
          </g>
        ))}
      </svg>
      <div className="lz-row">
        <label className="fl-check">
          <input type="checkbox" checked={blocked} onChange={(e) => setBlocked(e.target.checked)} />
          Community report: the cafe ramp is blocked
        </label>
        <dl className="lz-stats" aria-live="polite">
          <div>
            <dt>Route</dt>
            <dd>{result ? <>{result.total.toFixed(0)}<small> m*</small></> : "none"}</dd>
          </div>
        </dl>
      </div>
      <p className="lz-note" aria-live="polite">
        {result
          ? `${profiles[profile].label}: ${result.stops.map((p) => places[p].label).join(" → ")}.`
          : "No route for this profile with that report in place."}{" "}
        {avoided.length ? `Paths with ${avoided.join(" or ")} are left out before the search runs.` : "Every path is allowed, so the stairs win."}{" "}
        *Map units, not measured distances.
      </p>
    </div>
  );
}
