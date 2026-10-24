"use client";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Pause, Play, RotateCcw, Shuffle, StepForward } from "lucide-react";
import { useMode } from "@/components/mode";
import {
  ALGORITHMS,
  algorithmInfo,
  makeMaze,
  solveMaze,
  type Maze,
  type MazePattern,
  type SearchAlgorithm,
} from "@/lib/maze";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { SceneToolbar, useSceneControls } from "./scene-controls";
import { useWebGL } from "./use-webgl";

const MazeCanvas = dynamic(() => import("./three/maze-canvas"), {
  ssr: false,
  loading: () => <div className="s3-loading mono">Loading the 3D maze…</div>,
});

const SPEEDS = [
  { label: "Slow", ms: 120 },
  { label: "Normal", ms: 55 },
  { label: "Fast", ms: 20 },
];

/** Flat drawing of the same state, used without WebGL. */
function FlatMaze({ maze, visited, path }: { maze: Maze; visited: number[]; path: number[] }) {
  const seen = new Set(visited);
  const onPath = new Set(path);
  const C = 16;
  return (
    <svg className="lz-maze-svg" viewBox={`0 0 ${maze.width * C} ${maze.height * C}`} role="img" aria-label="Maze search, drawn flat">
      {maze.cells.map((wall, id) => (
        <rect
          key={id}
          x={(id % maze.width) * C}
          y={Math.floor(id / maze.width) * C}
          width={C}
          height={C}
          className={`lz-cell ${wall ? "lz-wall" : onPath.has(id) ? "lz-path" : seen.has(id) ? "lz-seen" : "lz-open"}`}
        />
      ))}
    </svg>
  );
}

/**
 * Mazera in 3D. The six solvers are the TypeScript versions in lib/maze; every
 * one is solved up front so each chip can show how many cells it needed here.
 */
export default function MazeScene() {
  const [mode] = useMode();
  const webgl = useWebGL();
  const controls = useSceneControls();
  const reduced = useReducedMotion();
  const [seed, setSeed] = useState(17);
  const [pattern, setPattern] = useState<MazePattern>("random");
  const [algorithm, setAlgorithm] = useState<SearchAlgorithm>("A*");
  const [cursor, setCursor] = useState<number | null>(null);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const maze = useMemo(() => makeMaze(seed, 21, 13, pattern), [seed, pattern]);
  const traces = useMemo(
    () => Object.fromEntries(ALGORITHMS.map((name) => [name, solveMaze(maze, name)])) as Record<SearchAlgorithm, ReturnType<typeof solveMaze>>,
    [maze],
  );
  const trace = traces[algorithm];
  const total = trace.visited.length;
  // Reduced motion shows the finished search until the visitor plays it.
  const shown = Math.min(cursor ?? (reduced ? total : 0), total);
  const finished = shown >= total;
  const running = playing && !finished && !(reduced && cursor === null);

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(
      () => setCursor(Math.min(total, shown + Math.max(1, Math.ceil(total / 160)))),
      SPEEDS[speed].ms,
    );
    return () => window.clearTimeout(timer);
  }, [running, shown, total, speed]);

  const visited = useMemo(() => trace.visited.slice(0, shown), [trace, shown]);
  const path = finished ? trace.path : [];
  const restart = () => {
    setCursor(0);
    setPlaying(true);
  };
  const pick = (name: SearchAlgorithm) => {
    setAlgorithm(name);
    restart();
  };
  const info = algorithmInfo[algorithm];

  const flat = <FlatMaze maze={maze} visited={visited} path={path} />;
  return (
    <div className="lz-viz lz-maze s3-maze">
      <SceneToolbar controls={controls} />
      {webgl ? (
        <MazeCanvas
          maze={maze}
          visited={visited}
          path={path}
          mode={mode}
          paused={controls.paused}
          resetKey={controls.resetKey}
          fallback={flat}
        />
      ) : webgl === false ? (
        flat
      ) : (
        <div className="s3-loading mono">Checking for 3D support…</div>
      )}
      <div className="lz-chips" role="group" aria-label="Search algorithm">
        {ALGORITHMS.map((name) => (
          <button key={name} type="button" aria-pressed={algorithm === name} onClick={() => pick(name)}>
            {name} <small>{traces[name].visited.length} cells</small>
          </button>
        ))}
      </div>
      <div className="lz-row">
        <div className="lz-actions">
          <button type="button" onClick={() => (finished ? restart() : setPlaying(!running))}>
            {running ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
            {running ? "Pause search" : finished ? "Replay search" : "Play search"}
          </button>
          <button type="button" disabled={finished} onClick={() => { setPlaying(false); setCursor(Math.min(total, shown + 1)); }}>
            <StepForward size={14} aria-hidden="true" /> Step
          </button>
          <button type="button" onClick={() => { setPlaying(false); setCursor(0); }}>
            <RotateCcw size={14} aria-hidden="true" /> Reset search
          </button>
          <button type="button" onClick={() => { setSeed((s) => s + 1); restart(); }}>
            <Shuffle size={14} aria-hidden="true" /> New maze
          </button>
        </div>
        <div className="lz-seg" role="group" aria-label="Grid">
          {(["random", "open"] as const).map((p) => (
            <button key={p} type="button" aria-pressed={pattern === p} onClick={() => { setPattern(p); restart(); }}>
              {p === "random" ? "Maze" : "Open field"}
            </button>
          ))}
        </div>
      </div>
      <div className="lz-row">
        <label className="s3-speed mono">
          <span>Speed: {SPEEDS[speed].label}</span>
          <input type="range" min={0} max={2} step={1} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} />
        </label>
        <dl className="lz-stats" aria-live="polite">
          <div>
            <dt>Explored</dt>
            <dd>
              {shown}
              <small> / {total}</small>
            </dd>
          </div>
          <div>
            <dt>Path</dt>
            <dd>{finished ? <>{Math.max(0, trace.path.length - 1)}<small> steps</small></> : "…"}</dd>
          </div>
        </dl>
      </div>
      <p className="lz-note">
        <b>{info.label}.</b> {info.blurb}
      </p>
    </div>
  );
}
