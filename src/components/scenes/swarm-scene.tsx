"use client";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Pause, Play, RotateCcw, StepForward } from "lucide-react";
import { useMode } from "@/components/mode";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import SwarmFlat from "./flat/swarm-scene";
import { SceneToolbar, useSceneControls } from "./scene-controls";
import { STEPS, W, coverage, found, simulate, survivors, type Strategy } from "./swarm-data";
import { useWebGL } from "./use-webgl";

const SwarmCanvas = dynamic(() => import("./three/swarm-canvas"), {
  ssr: false,
  loading: () => <div className="s3-loading mono">Loading the 3D search area…</div>,
});
const NAMES = ["orange", "blue", "pink", "green"];

/**
 * SWARMMIND as a search area with four searchers. Both strategies are run up
 * front on a seeded toy map (swarm-data), so a replay is always identical.
 * This is an illustration of the two baselines, not SWARMMIND's own output.
 */
export default function SwarmScene() {
  const [mode] = useMode();
  const webgl = useWebGL();
  const controls = useSceneControls();
  const reduced = useReducedMotion();
  const [strategy, setStrategy] = useState<Strategy>("frontier");
  const [t, setT] = useState<number | null>(null);
  const [playing, setPlaying] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const runs = useMemo(() => ({ random: simulate("random"), frontier: simulate("frontier") }), []);
  const frames = runs[strategy];
  const step = Math.min(t ?? (reduced ? STEPS : 0), STEPS);
  const running = playing && step < STEPS && !(reduced && t === null);
  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => setT(step + 1), 110);
    return () => window.clearTimeout(timer);
  }, [running, step]);
  const frame = frames[step];

  if (webgl === false) return <SwarmFlat />;
  const trailCells = (i: number) => new Set(frames.slice(0, step + 1).map((f) => f.agents[i])).size;
  return (
    <div className="lz-viz fl-swarm s3-swarm">
      <div className="lz-seg" role="group" aria-label="Baseline">
        {(["random", "frontier"] as const).map((s) => (
          <button key={s} type="button" aria-pressed={strategy === s} onClick={() => { setStrategy(s); setT(0); setPlaying(true); }}>
            {s === "random" ? "Random walk" : "Frontier exploration"}
          </button>
        ))}
      </div>
      <SceneToolbar controls={controls} />
      {webgl ? (
        <SwarmCanvas
          frames={frames}
          step={step}
          selected={selected}
          onSelect={setSelected}
          mode={mode}
          paused={controls.paused}
          resetKey={controls.resetKey}
          busy={running}
          fallback={<SwarmFlat />}
        />
      ) : (
        <div className="s3-loading mono">Checking for 3D support…</div>
      )}
      <p className="lz-fine s3-selection" aria-live="polite">
        {selected !== null
          ? `Searcher ${selected + 1} (${NAMES[selected]}) is at column ${(frame.agents[selected] % W) + 1}, row ${Math.floor(frame.agents[selected] / W) + 1} and has stood on ${trailCells(selected)} different cells.`
          : "Select a searcher to highlight its trail. Searchers are numbered as well as coloured."}
      </p>
      <div className="lz-row">
        <div className="lz-actions">
          <button type="button" onClick={() => (step >= STEPS ? (setT(0), setPlaying(true)) : setPlaying(!running))}>
            {running ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
            {running ? "Pause" : step >= STEPS ? "Replay" : "Play"}
          </button>
          <button type="button" disabled={step >= STEPS} onClick={() => { setPlaying(false); setT(step + 1); }}>
            <StepForward size={14} aria-hidden="true" /> Step
          </button>
          <button type="button" onClick={() => { setPlaying(false); setT(0); }}>
            <RotateCcw size={14} aria-hidden="true" /> Reset
          </button>
        </div>
        <dl className="lz-stats" aria-live="polite">
          <div><dt>Step</dt><dd>{step}<small> / {STEPS}</small></dd></div>
          <div><dt>Explored</dt><dd>{coverage(frame)}<small>%</small></dd></div>
          <div><dt>Found</dt><dd>{found(frame)}<small> / {survivors.length}</small></dd></div>
        </dl>
      </div>
      <p className="lz-note">
        After {STEPS} steps on this map: random walk explores {coverage(runs.random[STEPS])}% and finds {found(runs.random[STEPS])}; frontier explores {coverage(runs.frontier[STEPS])}% and finds {found(runs.frontier[STEPS])}. These are this toy run only, not SWARMMIND results.
      </p>
    </div>
  );
}
