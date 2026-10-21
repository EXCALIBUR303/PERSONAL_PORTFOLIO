"use client";
import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { Pause, Play, RotateCcw, Shuffle, SkipForward } from "lucide-react";
import { makeMaze, solveMaze, type SearchAlgorithm } from "@/lib/maze";
import SpatialView from "./spatial-view";
export default function MazeWorld() {
  const [seed, setSeed] = useState(17),
    [algorithm, setAlgorithm] = useState<SearchAlgorithm>("BFS"),
    [cursor, setCursor] = useState(0),
    [running, setRunning] = useState(false),
    [speed, setSpeed] = useState(90),
    [inspect, setInspect] = useState(0);
  const { maze, trace } = useMemo(() => {
    const maze = makeMaze(seed);
    return { maze, trace: solveMaze(maze, algorithm) };
  }, [seed, algorithm]);
  const reduced = useReducedMotion();
  const finished = cursor >= trace.visited.length,
    visited = new Set(trace.visited.slice(0, cursor)),
    path = new Set(finished ? trace.path : []);
  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(
      () => {
        const next = reduced
          ? trace.visited.length
          : Math.min(cursor + 1, trace.visited.length);
        setCursor(next);
        if (next === trace.visited.length) setRunning(false);
      },
      reduced ? 0 : speed,
    );
    return () => clearTimeout(timer);
  }, [cursor, running, speed, trace, reduced]);
  useEffect(() => {
    const pause = () => {
      if (document.hidden) setRunning(false);
    };
    document.addEventListener("visibilitychange", pause);
    return () => document.removeEventListener("visibilitychange", pause);
  }, []);
  const reset = () => {
    setRunning(false);
    setCursor(0);
  };
  return (
    <div className="interactive-module maze-module">
      <div className="module-toolbar">
        <label>
          Algorithm
          <select
            value={algorithm}
            onChange={(event) => {
              setAlgorithm(event.target.value as SearchAlgorithm);
              reset();
            }}
          >
            {(["BFS", "DFS", "Dijkstra", "A*"] as const).map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        <label>
          Trace speed
          <input
            type="range"
            min="20"
            max="200"
            step="10"
            value={220 - speed}
            onChange={(event) => setSpeed(220 - Number(event.target.value))}
          />
        </label>
        <div className="module-actions">
          <button
            className="button button-lime"
            onClick={() => {
              if (finished) setCursor(0);
              setRunning(!running);
            }}
          >
            {running ? <Pause size={15} /> : <Play size={15} />}{" "}
            {running ? "Pause" : "Start"}
          </button>
          <button
            className="icon-button"
            onClick={() => {
              setRunning(false);
              setCursor(Math.min(cursor + 1, trace.visited.length));
            }}
            aria-label="Step search"
          >
            <SkipForward size={17} />
          </button>
          <button
            className="icon-button"
            onClick={reset}
            aria-label="Reset maze search"
          >
            <RotateCcw size={17} />
          </button>
          <button
            className="button button-outline"
            onClick={() => {
              setSeed(seed + 1);
              reset();
              setInspect(0);
            }}
          >
            <Shuffle size={15} />
            New maze
          </button>
        </div>
      </div>
      <SpatialView
        kind="maze"
        maze={maze}
        visited={Array.from(visited)}
        path={Array.from(path)}
        selected={inspect}
        onSelect={setInspect}
        fallback={
          <svg
            className="maze-grid-svg"
            viewBox={`0 0 ${maze.width * 22} ${maze.height * 22}`}
            role="img"
            aria-label={`Maze grid. ${cursor} cells explored. ${finished ? `Solution path contains ${trace.path.length} cells.` : "Start the search or step through visited cells."}`}
          >
            {maze.cells.map((wall, id) => (
              <rect
                key={id}
                x={(id % maze.width) * 22 + 1}
                y={Math.floor(id / maze.width) * 22 + 1}
                width="20"
                height="20"
                rx="3"
                className={
                  wall
                    ? "maze-wall"
                    : id === maze.start
                      ? "maze-start"
                      : id === maze.goal
                        ? "maze-goal"
                        : path.has(id)
                          ? "maze-path"
                          : visited.has(id)
                            ? "maze-visited"
                            : "maze-open"
                }
              />
            ))}
            <text
              x={(maze.start % maze.width) * 22 + 11}
              y={Math.floor(maze.start / maze.width) * 22 + 15}
              textAnchor="middle"
            >
              S
            </text>
            <text
              x={(maze.goal % maze.width) * 22 + 11}
              y={Math.floor(maze.goal / maze.width) * 22 + 15}
              textAnchor="middle"
            >
              G
            </text>
          </svg>
        }
      />
      <div className="maze-readout">
        <div>
          <span className="mono">VISITED CELLS</span>
          <strong>
            {cursor} <small>/ {trace.visited.length}</small>
          </strong>
        </div>
        <div>
          <span className="mono">PATH LENGTH</span>
          <strong>
            {finished ? trace.path.length - 1 : "—"} <small>steps</small>
          </strong>
        </div>
        <div className="maze-cell-inspector">
          <label>
            Inspect cell
            <select
              value={inspect}
              onChange={(event) => setInspect(Number(event.target.value))}
            >
              {maze.cells.map((_, id) => (
                <option key={id} value={id}>
                  ({id % maze.width}, {Math.floor(id / maze.width)})
                </option>
              ))}
            </select>
          </label>
          <span>
            {maze.cells[inspect]
              ? "Wall"
              : path.has(inspect)
                ? "Solution path"
                : visited.has(inspect)
                  ? `Visited · distance ${trace.distances[inspect]}`
                  : "Open · not visited"}
          </span>
        </div>
        <p role="status">
          {running
            ? "Exploring the search trace…"
            : finished
              ? "Search complete. The solution path is highlighted."
              : "Ready. Press Start or step through the trace."}
        </p>
      </div>
      <div className="module-legend">
        <span>
          <i className="legend-visited" />
          Visited
        </span>
        <span>
          <i className="legend-path" />
          Solution
        </span>
        <span>S / Start</span>
        <span>G / Goal</span>
      </div>
      <p className="module-disclaimer">
        Local TypeScript demonstration of source-verified algorithms. The search
        computes a trace first; Start, Pause, and speed control its
        visualization. Four-connected, unweighted grid. DFS does not guarantee a
        shortest path.
      </p>
    </div>
  );
}
