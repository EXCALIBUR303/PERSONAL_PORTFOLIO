"use client";
import { useEffect, useMemo, useState } from "react";
import { Pause, Play, RotateCcw, StepForward } from "lucide-react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { H, W, STEPS, coverage, found, simulate, survivors, walls, type Strategy } from "../swarm-data";

export default function SwarmFlat() {
  const reduced = useReducedMotion();
  const [strategy, setStrategy] = useState<Strategy>("frontier");
  const [t, setT] = useState<number | null>(null);
  const [playing, setPlaying] = useState(true);
  const runs = useMemo(() => ({ random: simulate("random"), frontier: simulate("frontier") }), []);
  const frames = runs[strategy];
  const step = Math.min(t ?? (reduced ? STEPS : 0), STEPS);
  const running = playing && step < STEPS && !(reduced && t === null);
  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => setT(step + 1), 90);
    return () => window.clearTimeout(timer);
  }, [running, step]);
  const frame = frames[step];
  const C = 10;
  return (
    <div className="lz-viz fl-swarm">
      <div className="lz-seg" role="group" aria-label="Baseline">
        {(["random", "frontier"] as const).map((s) => (
          <button key={s} type="button" aria-pressed={strategy === s} onClick={() => { setStrategy(s); setT(0); setPlaying(true); }}>
            {s === "random" ? "Random walk" : "Frontier exploration"}
          </button>
        ))}
      </div>
      <svg className="fl-grid" viewBox={`0 0 ${W * C} ${H * C}`} role="img" aria-label={`Search grid at step ${step}: ${coverage(frame)}% explored, ${found(frame)} of ${survivors.length} survivors found.`}>
        {Array.from({ length: W * H }, (_, c) => (
          <rect key={c} x={(c % W) * C} y={Math.floor(c / W) * C} width={C} height={C} className={walls.has(c) ? "fl-wall" : frame.seen.has(c) ? "fl-seen" : "fl-fog"} />
        ))}
        {survivors.map((s) => (
          <circle key={s} cx={(s % W) * C + C / 2} cy={Math.floor(s / W) * C + C / 2} r={2.6} className={frame.seen.has(s) ? "fl-found" : "fl-hidden"} />
        ))}
        {frame.agents.map((a, i) => (
          <rect key={i} x={(a % W) * C + 1.5} y={Math.floor(a / W) * C + 1.5} width={C - 3} height={C - 3} rx={2} className="fl-agent" />
        ))}
      </svg>
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
