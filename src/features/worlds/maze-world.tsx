"use client";
import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { Pause, Play, RotateCcw, Shuffle, SkipForward } from "lucide-react";
import {
  ALGORITHMS,
  algorithmInfo,
  makeMaze,
  solveMaze,
  type MazePattern,
  type SearchAlgorithm,
} from "@/lib/maze";
import SpatialView from "./spatial-view";
export default function MazeWorld() {
  const [seed, setSeed] = useState(17),
    [algorithm, setAlgorithm] = useState<SearchAlgorithm>("BFS"),
    [cursor, setCursor] = useState(0),
    [running, setRunning] = useState(false),
    [speed, setSpeed] = useState(90),
    [inspect, setInspect] = useState(0),
    [pattern, setPattern] = useState<MazePattern>("random"),
    [guess, setGuess] = useState<SearchAlgorithm | "">(""),
    [revealed, setRevealed] = useState(false);
  const { maze, trace, all } = useMemo(() => {
    const maze = makeMaze(seed, 21, 13, pattern);
    const all = Object.fromEntries(
      ALGORITHMS.map((name) => [name, solveMaze(maze, name)]),
    ) as Record<SearchAlgorithm, ReturnType<typeof solveMaze>>;
    return { maze, trace: all[algorithm], all };
  }, [seed, algorithm, pattern]);
  const fewest = ALGORITHMS.reduce((best, name) =>
    all[name].visited.length < all[best].visited.length ? name : best,
  );
  const bestCount = all[fewest].visited.length;
  const guessCount = guess ? all[guess].visited.length : 0;
  const verdict =
    guess && guessCount === bestCount
      ? guess === fewest
        ? `Right: ${fewest} explored the fewest cells (${bestCount}).`
        : `Right: ${guess} ties for the fewest, at ${bestCount} cells.`
      : `Not quite: ${fewest} explored the fewest cells (${bestCount}); ${guess} needed ${guessCount}.`;
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
            {ALGORITHMS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Grid
          <select
            value={pattern}
            onChange={(event) => {
              setPattern(event.target.value as MazePattern);
              reset();
              setInspect(0);
              setRevealed(false);
            }}
          >
            <option value="random">Generated maze</option>
            <option value="open">Open field</option>
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
              setRevealed(false);
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
      <p className="maze-explain" aria-live="polite">
        <b>{algorithmInfo[algorithm].label}.</b>{" "}
        {algorithmInfo[algorithm].blurb}
      </p>
      <section
        className="maze-challenge"
        aria-labelledby="maze-challenge-title"
      >
        <h3 id="maze-challenge-title">Challenge: predict, then run</h3>
        <p>
          On this {pattern === "open" ? "open field" : "maze"}, which algorithm
          explores the fewest cells before it reaches the goal? On a generated
          maze there is often only one route, so switch the grid to Open field
          to see the algorithms diverge.
        </p>
        <div className="maze-guesses" role="group" aria-label="Your prediction">
          {ALGORITHMS.map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={guess === name}
              onClick={() => {
                setGuess(name);
                setRevealed(false);
              }}
            >
              {name}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="button button-lime"
          disabled={!guess}
          onClick={() => setRevealed(true)}
        >
          Run all six
        </button>
        {revealed && (
          <div role="status" className="maze-results">
            <p>{verdict}</p>
            <table>
              <thead>
                <tr>
                  <th scope="col">Algorithm</th>
                  <th scope="col">Cells explored</th>
                  <th scope="col">Path (steps)</th>
                  <th scope="col">Shortest path?</th>
                </tr>
              </thead>
              <tbody>
                {ALGORITHMS.map((name) => (
                  <tr key={name} data-best={name === fewest || undefined}>
                    <th scope="row">{name}</th>
                    <td>{all[name].visited.length}</td>
                    <td>{all[name].path.length - 1}</td>
                    <td>
                      {all[name].path.length === all.BFS.path.length
                        ? "Yes"
                        : "No"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="module-disclaimer">
        Local TypeScript demonstration of source-verified algorithms. The search
        computes a trace first; Start, Pause, and speed control its
        visualization. Four-connected, unweighted grid. DFS and Greedy do not
        guarantee a shortest path.
      </p>
    </div>
  );
}
