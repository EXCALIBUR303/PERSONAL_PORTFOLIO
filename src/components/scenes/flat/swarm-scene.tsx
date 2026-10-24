"use client";
import { useEffect, useMemo, useState } from "react";
import { Pause, Play, RotateCcw, StepForward } from "lucide-react";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const W = 18;
const H = 11;
const AGENTS = 4;
const STEPS = 90;
const walls = new Set([
  ...[2, 3, 4, 5, 6].map((y) => y * W + 6),
  ...[4, 5, 6, 7, 8].map((y) => y * W + 12),
  ...[9, 10, 11].map((x) => 2 * W + x),
]);
const survivors = [3 * W + 15, 8 * W + 3, 1 * W + 9, 9 * W + 16, 5 * W + 9, 7 * W + 14];
type Strategy = "random" | "frontier";

/** Seeded generator so every visitor sees the same run. */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const neighbours = (c: number) =>
  [c - W, c + W, c % W ? c - 1 : -1, (c + 1) % W ? c + 1 : -1].filter((n) => n >= 0 && n < W * H && !walls.has(n));

function sense(c: number, seen: Set<number>) {
  const x = c % W, y = Math.floor(c / W);
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < W && ny >= 0 && ny < H) seen.add(ny * W + nx);
    }
}
/** First step towards the nearest unseen cell nobody else is heading for. */
function towardFrontier(start: number, seen: Set<number>, claimed: Set<number>) {
  const prev = new Map<number, number>([[start, -1]]);
  const queue = [start];
  while (queue.length) {
    const c = queue.shift()!;
    if (!seen.has(c) && !claimed.has(c)) {
      claimed.add(c);
      let step = c;
      while (prev.get(step) !== start && prev.get(step) !== -1) step = prev.get(step)!;
      return step;
    }
    for (const n of neighbours(c)) if (!prev.has(n)) { prev.set(n, c); queue.push(n); }
  }
  return start;
}

function simulate(strategy: Strategy) {
  const random = rng(7);
  let agents = Array.from({ length: AGENTS }, (_, i) => i * W);
  const seen = new Set<number>();
  agents.forEach((a) => sense(a, seen));
  const frames = [{ agents, seen: new Set(seen) }];
  for (let t = 0; t < STEPS; t++) {
    const claimed = new Set<number>();
    agents = agents.map((a) => {
      if (strategy === "frontier") return towardFrontier(a, seen, claimed);
      const options = neighbours(a);
      return options[Math.floor(random() * options.length)] ?? a;
    });
    agents.forEach((a) => sense(a, seen));
    frames.push({ agents, seen: new Set(seen) });
  }
  return frames;
}
const open = W * H - walls.size;

export default function SwarmScene() {
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
  const coverage = (f: (typeof frames)[number]) => Math.round(([...f.seen].filter((c) => !walls.has(c)).length / open) * 100);
  const found = (f: (typeof frames)[number]) => survivors.filter((s) => f.seen.has(s)).length;
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
