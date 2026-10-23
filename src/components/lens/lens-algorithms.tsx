"use client";
import { useEffect, useMemo, useState } from "react";
import { Pause, Play, RotateCcw, Shuffle } from "lucide-react";
import {
  ALGORITHMS,
  algorithmInfo,
  makeMaze,
  solveMaze,
  type MazePattern,
  type SearchAlgorithm,
} from "@/lib/maze";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const CELL = 20;

/**
 * Hero visualisation for the Algorithms lens (Mazera). A real search runs on a
 * generated maze. Every algorithm is solved up front so the chips can show how
 * many cells each one needed on this maze.
 */
export default function LensAlgorithms() {
  const [seed, setSeed] = useState(17);
  const [pattern, setPattern] = useState<MazePattern>("random");
  const [algorithm, setAlgorithm] = useState<SearchAlgorithm>("A*");
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(true);
  const reduced = useReducedMotion();
  const maze = useMemo(() => makeMaze(seed, 21, 13, pattern), [seed, pattern]);
  const traces = useMemo(
    () =>
      Object.fromEntries(
        ALGORITHMS.map((name) => [name, solveMaze(maze, name)]),
      ) as Record<SearchAlgorithm, ReturnType<typeof solveMaze>>,
    [maze],
  );
  const trace = traces[algorithm];
  const total = trace.visited.length;
  const shown = reduced ? total : Math.min(cursor, total);
  const finished = shown >= total;
  const stride = Math.max(1, Math.ceil(total / 90));

  useEffect(() => {
    if (!playing || reduced || cursor >= total) return;
    const timer = window.setTimeout(
      () => setCursor((value) => Math.min(total, value + stride)),
      45,
    );
    return () => window.clearTimeout(timer);
  }, [playing, reduced, cursor, total, stride]);

  useEffect(() => {
    const pause = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", pause);
    return () => document.removeEventListener("visibilitychange", pause);
  }, []);

  const visited = useMemo(
    () => new Set(trace.visited.slice(0, shown)),
    [trace, shown],
  );
  const path = useMemo(
    () => new Set(finished ? trace.path : []),
    [finished, trace],
  );
  const pick = (name: SearchAlgorithm) => {
    setAlgorithm(name);
    setCursor(0);
    setPlaying(true);
  };

  const choosePattern = (next: MazePattern) => {
    setPattern(next);
    setCursor(0);
    setPlaying(true);
  };

  return (
    <div className="lz-viz lz-maze">
      <div className="lz-seg" role="group" aria-label="Grid type">
        <button
          type="button"
          aria-pressed={pattern === "random"}
          onClick={() => choosePattern("random")}
        >
          Maze
        </button>
        <button
          type="button"
          aria-pressed={pattern === "open"}
          onClick={() => choosePattern("open")}
        >
          Open field
        </button>
      </div>
      <div className="lz-chips" role="group" aria-label="Search algorithm">
        {ALGORITHMS.map((name) => (
          <button
            key={name}
            type="button"
            aria-pressed={algorithm === name}
            onClick={() => pick(name)}
          >
            <span>{name}</span>
            <small>{traces[name].visited.length} cells</small>
          </button>
        ))}
      </div>
      <svg
        className="lz-maze-svg"
        viewBox={`0 0 ${maze.width * CELL} ${maze.height * CELL}`}
        role="img"
        aria-label={`Maze search with ${algorithmInfo[algorithm].label}. ${shown} of ${total} cells explored.${finished ? ` Path found in ${trace.path.length - 1} steps.` : ""}`}
      >
        {maze.cells.map((wall, id) => {
          const x = (id % maze.width) * CELL,
            y = Math.floor(id / maze.width) * CELL;
          const state = wall
            ? "wall"
            : path.has(id)
              ? "path"
              : visited.has(id)
                ? "seen"
                : "open";
          return (
            <rect
              key={id}
              x={x + 0.5}
              y={y + 0.5}
              width={CELL - 1}
              height={CELL - 1}
              rx={3}
              className={`lz-cell lz-${state}`}
            />
          );
        })}
        {[
          [maze.start, "S"],
          [maze.goal, "G"],
        ].map(([id, label]) => (
          <g key={label}>
            <rect
              x={(Number(id) % maze.width) * CELL + 0.5}
              y={Math.floor(Number(id) / maze.width) * CELL + 0.5}
              width={CELL - 1}
              height={CELL - 1}
              rx={3}
              className="lz-end"
            />
            <text
              x={(Number(id) % maze.width) * CELL + CELL / 2}
              y={Math.floor(Number(id) / maze.width) * CELL + CELL / 2 + 4}
              textAnchor="middle"
              className="lz-end-text"
            >
              {label}
            </text>
          </g>
        ))}
      </svg>
      <div className="lz-row">
        <dl className="lz-stats">
          <div>
            <dt>Explored</dt>
            <dd>
              {shown}
              <small> / {total}</small>
            </dd>
          </div>
          <div>
            <dt>Path</dt>
            <dd>
              {finished ? trace.path.length - 1 : "–"}
              <small> steps</small>
            </dd>
          </div>
        </dl>
        <div className="lz-actions">
          <button
            type="button"
            aria-label={playing && !finished ? "Pause search" : "Play search"}
            onClick={() => {
              if (finished) setCursor(0);
              setPlaying(!(playing && !finished));
            }}
          >
            {playing && !finished ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <button
            type="button"
            aria-label="Replay search"
            onClick={() => {
              setCursor(0);
              setPlaying(true);
            }}
          >
            <RotateCcw size={15} />
          </button>
          <button
            type="button"
            onClick={() => {
              setSeed(seed + 1);
              setCursor(0);
              setPlaying(true);
            }}
          >
            <Shuffle size={15} />
            New maze
          </button>
        </div>
      </div>
      <p className="lz-note" aria-live="polite">
        <b>{algorithmInfo[algorithm].label}.</b>{" "}
        {algorithmInfo[algorithm].blurb}
      </p>
    </div>
  );
}
