"use client";
import { lazyView } from "./lazy-view";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import { useMode } from "@/components/mode";
import LensSystems from "@/components/lens/lens-systems";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { SceneToolbar, useSceneControls } from "./scene-controls";
import { useWebGL } from "./use-webgl";
import { describeBay, steps, viewFor, type Mode } from "./smartpark-data";

const GarageCanvas = lazyView(() => import("./three/garage-canvas"), () => <div className="s3-loading mono">Loading the 3D garage…</div>);
/** Fetches the 3D canvas code early, so a scene built during a mode switch is ready at once. */
export const preloadCanvas = () => GarageCanvas.preload();

const nodes = ["Floor map UI", "FastAPI", "Allocation transaction", "Parking session", "Tariff billing"];

/**
 * SmartPark in 3D: two cars ask for one bay in a small garage. The words come
 * from the project page's step list; the picture is an illustration made for
 * this portfolio and never touches the project's database.
 */
export default function SmartParkScene() {
  const [mode3d] = useMode();
  const webgl = useWebGL();
  const controls = useSceneControls();
  const reduced = useReducedMotion();
  const [mode, setMode] = useState<Mode>("unsafe");
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  // Cars take a moment to drive; keep rendering through it even when paused.
  const [moving, setMoving] = useState(false);
  const list = steps[mode];
  const current = list[step];
  const view = viewFor(mode, step);
  const done = step >= list.length - 1;

  const settle = useRef(0);
  // Every change of step or method sets the cars driving for a moment.
  const goto = useCallback((next: number) => {
    setStep(next);
    setMoving(true);
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => setMoving(false), 2600);
  }, []);
  useEffect(() => () => window.clearTimeout(settle.current), []);
  useEffect(() => {
    if (!playing || reduced || done) return;
    const timer = window.setTimeout(() => goto(step + 1), 2400);
    return () => window.clearTimeout(timer);
  }, [playing, reduced, step, done, goto]);

  if (webgl === false) return <LensSystems />;
  const pick = (next: Mode) => {
    setMode(next);
    goto(0);
    setPlaying(false);
  };
  return (
    <div className="lz-viz lz-seq s3-garage">
      <ol className="lz-stages" aria-label="SmartPark request path">
        {nodes.map((node, i) => (
          <li key={node} aria-current={i === 2 ? "step" : undefined}>
            <span>{i + 1}</span>
            {node}
          </li>
        ))}
      </ol>
      <SceneToolbar controls={controls} />
      {webgl ? (
        <GarageCanvas
          view={view}
          selected={selected}
          onSelect={setSelected}
          mode={mode3d}
          paused={controls.paused}
          resetKey={controls.resetKey}
          busy={moving || playing}
          fallback={<div className="s3-loading mono">The 3D garage could not start. Use the steps below.</div>}
        />
      ) : (
        <div className="s3-loading mono">Checking for 3D support…</div>
      )}
      <p className="lz-note s3-selection" aria-live="polite">
        {selected ? describeBay(selected, view) : "Select any bay in the garage to read its state. Bay A07 is the one both cars want."}
      </p>
      <div className="lz-seg" role="group" aria-label="Allocation method">
        <button type="button" aria-pressed={mode === "unsafe"} onClick={() => pick("unsafe")}>
          Check, then write
        </button>
        <button type="button" aria-pressed={mode === "safe"} onClick={() => pick("safe")}>
          Row-locked allocation
        </button>
      </div>
      <div className="lz-actors" aria-live="polite">
        <div className="lz-actor">
          <span>Car 1 (orange)</span>
          <b>{current.car1}</b>
        </div>
        <div className={`lz-bay lz-bay-${current.bayTone}`}>
          <span>Bay A07 record</span>
          <b>{current.bay}</b>
        </div>
        <div className="lz-actor">
          <span>Car 2 (blue)</span>
          <b>{current.car2}</b>
        </div>
      </div>
      <p className="lz-step-text">
        <span>
          Step {step + 1} of {list.length}
        </span>
        {current.text}
      </p>
      {done && (
        <p className={`lz-verdict ${mode === "unsafe" ? "lz-bad" : "lz-good"}`} role="status">
          {mode === "unsafe" ? "Conflict: two parking sessions now claim one bay." : "Safe: only one session holds the bay."}
        </p>
      )}
      <div className="lz-actions">
        <button type="button" aria-label="Previous step" disabled={step === 0} onClick={() => { setPlaying(false); goto(step - 1); }}>
          <ArrowLeft size={15} />
        </button>
        <button
          type="button"
          aria-label={playing && !done ? "Pause sequence" : "Play sequence"}
          onClick={() => {
            if (done) goto(0);
            setPlaying(!(playing && !done));
          }}
        >
          {playing && !done ? <Pause size={15} /> : <Play size={15} />}
        </button>
        <button type="button" aria-label="Next step" disabled={done} onClick={() => { setPlaying(false); goto(step + 1); }}>
          <ArrowRight size={15} />
        </button>
      </div>
      <p className="lz-note">
        Illustration: the garage layout and the other cars are drawn for scale. The sequence is the documented idea of row-locked allocation, not a live view of the project&apos;s database. The check-then-write branch is illustrative and is not code from the project; in the project the second session is handed the next free bay.
      </p>
    </div>
  );
}
