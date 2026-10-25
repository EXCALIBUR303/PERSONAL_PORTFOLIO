"use client";
import { useMemo, useState } from "react";
import {
  ALGORITHMS,
  algorithmInfo,
  makeMaze,
  solveMaze,
  type Maze,
  type MazePattern,
  type SearchAlgorithm,
  type SearchTrace,
} from "@/lib/maze";
import { ChallengeShell, Choices } from "./challenge-shell";

type Round = { seed: number; pattern: MazePattern; a: SearchAlgorithm; b: SearchAlgorithm };
const rounds: Round[] = [
  { seed: 3, pattern: "open", a: "BFS", b: "A*" },
  { seed: 11, pattern: "random", a: "DFS", b: "BFS" },
  { seed: 24, pattern: "open", a: "Greedy", b: "Dijkstra" },
  { seed: 7, pattern: "random", a: "A*", b: "Bidirectional" },
];
const SIZE = { w: 21, h: 13 };

function MiniMaze({ maze, trace, label }: { maze: Maze; trace: SearchTrace; label: string }) {
  const seen = useMemo(() => new Set(trace.visited), [trace]);
  const path = useMemo(() => new Set(trace.path), [trace]);
  return (
    <div
      className="mm"
      role="img"
      aria-label={label}
      style={{ gridTemplateColumns: `repeat(${maze.width}, 1fr)`, aspectRatio: `${maze.width} / ${maze.height}` }}
    >
      {maze.cells.map((wall, i) => (
        <i
          key={i}
          data-k={
            i === maze.start ? "start" : i === maze.goal ? "goal" : wall ? "wall" : path.has(i) ? "path" : seen.has(i) ? "seen" : "open"
          }
        />
      ))}
    </div>
  );
}

export default function MazeraChallenge({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(0);
  const [guess, setGuess] = useState<"a" | "b" | "same" | null>(null);
  const round = rounds[n % rounds.length];
  const maze = useMemo(() => makeMaze(round.seed, SIZE.w, SIZE.h, round.pattern), [round]);
  const a = useMemo(() => solveMaze(maze, round.a), [maze, round.a]);
  const b = useMemo(() => solveMaze(maze, round.b), [maze, round.b]);
  const na = a.visited.length;
  const nb = b.visited.length;
  const close = Math.abs(na - nb) <= Math.max(na, nb) * 0.03;
  const truth: "a" | "b" | "same" = close ? "same" : na < nb ? "a" : "b";
  const revealed = guess !== null;
  const info = (x: SearchAlgorithm) => algorithmInfo[x];
  const fewer = truth === "a" ? round.a : round.b;
  const more = truth === "a" ? round.b : round.a;
  return (
    <ChallengeShell
      heading="Which search looks at fewer cells?"
      ask={
        <>
          The same {round.pattern === "open" ? "open field" : "generated maze"} is solved twice, once by {round.a} and once by{" "}
          {round.b}. Which one explores fewer cells before it reaches the goal?
        </>
      }
      revealed={revealed}
      changed={
        <>
          Both algorithms ran on the same grid. The shaded cells are the ones each search explored; the dark line is the
          path it returned.
        </>
      }
      result={
        <>
          {round.a} explored <b>{na}</b> cells and found a path of <b>{a.path.length ? a.path.length - 1 : "no"}</b> steps.{" "}
          {round.b} explored <b>{nb}</b> and found <b>{b.path.length ? b.path.length - 1 : "no"}</b> steps.{" "}
          {truth === "same" ? "About the same amount of searching." : `${fewer} explored fewer cells.`}
        </>
      }
      why={
        truth === "same" ? (
          <>
            On this grid the two searches have little to disagree about. {info(round.a).blurb} {info(round.b).blurb}
          </>
        ) : (
          <>
            {info(fewer).blurb} {info(more).blurb}
          </>
        )
      }
      real={
        <>
          Mazera compares six search algorithms on generated mazes. This page re-implements them independently. On 327
          audited grids the path lengths matched the original for BFS, Dijkstra, A* and Bidirectional search; the number
          of cells explored differs from the original, so treat these counts as this page&apos;s own.
        </>
      }
      kind="re-implemented algorithm"
      onAgain={() => {
        setN(n + 1);
        setGuess(null);
      }}
      againLabel="Another grid"
    >
      <div className="mm-pair">
        <figure>
          <MiniMaze maze={maze} trace={revealed ? a : { visited: [], path: [], distances: {} }} label={`${round.a} on the grid`} />
          <figcaption className="mono">{round.a}</figcaption>
        </figure>
        <figure>
          <MiniMaze maze={maze} trace={revealed ? b : { visited: [], path: [], distances: {} }} label={`${round.b} on the grid`} />
          <figcaption className="mono">{round.b}</figcaption>
        </figure>
      </div>
      <Choices
        label="Which explores fewer cells?"
        value={guess}
        onPick={(id) => {
          setGuess(id);
          onDone();
        }}
        locked={revealed}
        correct={truth}
        options={[
          { id: "a", label: round.a },
          { id: "b", label: round.b },
          { id: "same", label: "About the same" },
        ]}
      />
    </ChallengeShell>
  );
}

/** Optional experiment: all six algorithms on one grid that the visitor shapes. */
export function MazeraExperiment() {
  const [pattern, setPattern] = useState<MazePattern>("open");
  const [seed, setSeed] = useState(5);
  const maze = useMemo(() => makeMaze(seed, SIZE.w, SIZE.h, pattern), [seed, pattern]);
  const rows = useMemo(
    () =>
      ALGORITHMS.map((name) => {
        const trace = solveMaze(maze, name);
        return { name, explored: trace.visited.length, steps: trace.path.length ? trace.path.length - 1 : null };
      }),
    [maze],
  );
  const shortest = Math.min(...rows.filter((r) => r.steps !== null).map((r) => r.steps as number));
  const most = Math.max(...rows.map((r) => r.explored));
  return (
    <div className="ch ch-exp">
      <p className="ch-kind mono">Optional experiment · changes real inputs</p>
      <h3>All six on one grid</h3>
      <p className="ch-ask">
        <b>Your move.</b> Change the grid and watch the counts move. Open fields show the gap between searches most
        clearly; a perfect maze has a single route, so they agree on the path.
      </p>
      <div className="ch-choices" role="group" aria-label="Grid">
        {(["open", "random"] as const).map((p) => (
          <button key={p} type="button" aria-pressed={pattern === p} onClick={() => setPattern(p)}>
            {p === "open" ? "Open field" : "Generated maze"}
          </button>
        ))}
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} type="button" aria-pressed={seed === s} onClick={() => setSeed(s)} disabled={pattern === "open"} title={pattern === "open" ? "An open field has no random walls" : undefined}>
            Seed {s}
          </button>
        ))}
      </div>
      <table className="ch-table">
        <caption className="sr-only">Cells explored and steps in the path, for six algorithms</caption>
        <thead>
          <tr>
            <th scope="col">Algorithm</th>
            <th scope="col">Cells explored</th>
            <th scope="col">Path steps</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <th scope="row">
                {r.name}
                {!algorithmInfo[r.name].shortest && <small> · not guaranteed shortest</small>}
              </th>
              <td>
                <span className="ch-bar" style={{ width: `${(r.explored / most) * 100}%` }} aria-hidden="true" />
                <b>{r.explored}</b>
              </td>
              <td>
                {r.steps ?? "none"}
                {r.steps !== null && r.steps === shortest ? " ✓" : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="ch-fine">
        Re-implemented algorithms running here; explored counts differ from the original Mazera application, whose path
        lengths they matched on 327 audited grids. A tick marks the shortest path found on this grid.
      </p>
    </div>
  );
}
