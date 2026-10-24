"use client";
import { useMemo, useState } from "react";
import { paths, places, profiles, route, type Place, type Profile } from "../pathable-data";

export default function PathAbleFlat() {
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
