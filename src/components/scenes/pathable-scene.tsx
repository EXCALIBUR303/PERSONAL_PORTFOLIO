"use client";
import { lazyView } from "./lazy-view";
import { useCallback, useMemo, useState } from "react";
import { Footprints } from "lucide-react";
import { useMode } from "@/components/mode";
import PathAbleFlat from "./flat/pathable-scene";
import { SceneToolbar, useSceneControls } from "./scene-controls";
import { useWebGL } from "./use-webgl";
import { places, profiles, route, routeSamples, type Place, type Profile } from "./pathable-data";

const CampusCanvas = lazyView(() => import("./three/campus-canvas"), () => <div className="s3-loading mono">Loading the 3D campus…</div>);
/** Fetches the 3D canvas code early, so a scene built during a mode switch is ready at once. */
export const preloadCanvas = () => CampusCanvas.preload();

const destinations: Place[] = ["library", "lab", "hostel", "cafe", "carpark"];

/**
 * PathAble in 3D. The campus is made up, as are PathAble's own examples. The
 * route comes from the same routing code as the flat map: paths a profile may
 * not use are removed before the search runs. Stairs and the steep path are
 * drawn as local fixtures; heights are illustrative.
 */
export default function PathAbleScene() {
  const [mode] = useMode();
  const webgl = useWebGL();
  const controls = useSceneControls();
  const [profile, setProfile] = useState<Profile>("walk");
  const [to, setTo] = useState<Place>("lab");
  const [blocked, setBlocked] = useState(false);
  const [walkKey, setWalkKey] = useState(0);
  const [walking, setWalking] = useState(false);
  const closed = useMemo(() => new Set(blocked ? ["cafe-library"] : []), [blocked]);
  const avoided = profiles[profile].avoids;
  const result = useMemo(() => route("gate", to, avoided, closed), [to, avoided, closed]);
  const samples = useMemo(() => (result ? routeSamples(result.stops, result.used) : []), [result]);
  const used = useMemo(() => new Set(result?.used ?? []), [result]);

  const walk = () => {
    setWalking(true);
    setWalkKey((k) => k + 1);
  };
  const done = useCallback(() => setWalking(false), []);
  const change = (fn: () => void) => {
    fn();
    // A new profile or destination replays the walk so the change is visible.
    walk();
  };

  if (webgl === false) return <PathAbleFlat />;
  return (
    <div className="lz-viz fl-pathable s3-campus">
      <div className="lz-seg" role="group" aria-label="Travel profile">
        {(Object.keys(profiles) as Profile[]).map((p) => (
          <button key={p} type="button" aria-pressed={profile === p} onClick={() => change(() => setProfile(p))}>
            {profiles[p].label}
          </button>
        ))}
      </div>
      <SceneToolbar controls={controls} followLabel="the walker" />
      {webgl ? (
        <CampusCanvas
          avoid={avoided}
          closed={closed}
          used={used}
          samples={samples}
          to={to}
          walkKey={walkKey}
          wheelchair={profile === "wheel"}
          following={controls.following}
          onWalkDone={done}
          onPick={(id) => id !== "gate" && change(() => setTo(id))}
          mode={mode}
          paused={controls.paused}
          resetKey={controls.resetKey}
          busy={walking}
          fallback={<PathAbleFlat />}
        />
      ) : (
        <div className="s3-loading mono">Checking for 3D support…</div>
      )}
      <div className="lz-chips" role="group" aria-label="Destination">
        {destinations.map((id) => (
          <button key={id} type="button" aria-pressed={to === id} onClick={() => change(() => setTo(id))}>
            {places[id].label}
          </button>
        ))}
      </div>
      <div className="lz-row">
        <label className="fl-check">
          <input type="checkbox" checked={blocked} onChange={(e) => change(() => setBlocked(e.target.checked))} />
          Community report: the cafe ramp is blocked
        </label>
        <div className="lz-actions">
          <button type="button" onClick={walk} disabled={!result}>
            <Footprints size={14} aria-hidden="true" /> Walk the route
          </button>
        </div>
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
        {avoided.length
          ? `Paths with ${avoided.join(" or ")} are left out before the search runs, drawn pale with a red cross.`
          : "Every path is allowed, so the shortest one wins, stairs included."}{" "}
        *Map units, not measured distances. The campus, its heights and the people are drawn for this portfolio.
      </p>
    </div>
  );
}
