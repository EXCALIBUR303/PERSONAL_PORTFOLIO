import { test, expect } from "@playwright/test";
import {
  ALGORITHMS,
  algorithmInfo,
  makeMaze,
  solveMaze,
} from "../src/lib/maze";
import {
  depot,
  selectOrders,
  sequenceRoute,
  spanningTree,
} from "../src/lib/lastmile";
import { splitEngines } from "../src/lib/leakage";
import { COLS, ROWS, potholes, simulate } from "../src/lib/swarm-sim";
import { resolvePenalty } from "../src/lib/penalty";
import { projects } from "../src/data/projects";
import { skills } from "../src/data/skills";

test("generated mazes are reproducible, solvable, and return valid shortest paths", () => {
  for (const seed of [1, 2, 17, 42, 99, 1000]) {
    const maze = makeMaze(seed);
    expect(makeMaze(seed)).toEqual(maze);
    const bfs = solveMaze(maze, "BFS");
    expect(bfs.path[0]).toBe(maze.start);
    expect(bfs.path.at(-1)).toBe(maze.goal);
    for (const algorithm of ALGORITHMS) {
      const trace = solveMaze(maze, algorithm);
      expect(new Set(trace.visited).size).toBe(trace.visited.length);
      expect(trace.path[0]).toBe(maze.start);
      expect(trace.path.at(-1)).toBe(maze.goal);
      trace.path.forEach((id, i) => {
        expect(maze.cells[id]).toBe(false);
        if (i) {
          const previous = trace.path[i - 1];
          expect(
            Math.abs((previous % maze.width) - (id % maze.width)) +
              Math.abs(
                Math.floor(previous / maze.width) - Math.floor(id / maze.width),
              ),
          ).toBe(1);
        }
      });
      if (algorithmInfo[algorithm].shortest)
        expect(trace.path.length).toBe(bfs.path.length);
      else expect(trace.path.length).toBeGreaterThanOrEqual(bfs.path.length);
    }
  }
  const field = makeMaze(3, 21, 13, "open");
  expect(field.cells.filter((wall) => !wall).length).toBe(19 * 11);
  const direct = solveMaze(field, "Greedy");
  expect(direct.path.length).toBe(solveMaze(field, "BFS").path.length);
  expect(direct.visited.length).toBeLessThan(
    solveMaze(field, "BFS").visited.length,
  );
  const open = {
    width: 3,
    height: 3,
    cells: Array<boolean>(9).fill(false),
    start: 0,
    goal: 8,
  };
  expect(solveMaze(open, "BFS").path.length - 1).toBe(4);
  expect(solveMaze(open, "A*").path.length - 1).toBe(4);
});

test("penalty resolution is deterministic and respects the disclosed power limit", () => {
  expect(resolvePenalty("Center", 65, 0)).toEqual({
    keeper: "Left",
    result: "Goal",
  });
  expect(resolvePenalty("Left", 65, 0)).toEqual({
    keeper: "Left",
    result: "Saved",
  });
  expect(resolvePenalty("Right", 91, 0).result).toBe("Wide");
  expect(resolvePenalty("Right", 65, 1).result).toBe("Saved");
  expect(resolvePenalty("Center", 65, 2).result).toBe("Saved");
});

test("project and skill references remain valid, and public claims have evidence", () => {
  expect(new Set(projects.map((p) => p.slug)).size).toBe(projects.length);
  for (const project of projects) {
    const ids = new Set(project.architecture.nodes.map((n) => n.id));
    expect(ids.size).toBe(project.architecture.nodes.length);
    for (const [from, to] of project.architecture.edges) {
      expect(ids.has(from)).toBe(true);
      expect(ids.has(to)).toBe(true);
    }
    if (project.sourceVisibility === "public") {
      expect(project.sources.length).toBeGreaterThan(0);
      expect(project.sourceCommit).toMatch(/^[a-f0-9]{40}$/);
      project.sources.forEach((s) =>
        expect(s.url).toContain(`/blob/${project.sourceCommit}/`),
      );
    } else {
      expect(project.githubUrl).toBeNull();
      expect(project.sources).toEqual([]);
    }
  }
  for (const skill of skills)
    if (skill.projectSlug)
      expect(
        projects.some((project) => project.slug === skill.projectSlug),
      ).toBe(true);
});

test("Last Mile sample: knapsack never loses to greedy, exact routes are shortest, and the tree is a lower bound", () => {
  let greedyLoses = 0;
  for (let capacity = 4; capacity <= 20; capacity++) {
    const greedy = selectOrders("greedy", capacity),
      best = selectOrders("knapsack", capacity);
    expect(best.value).toBeGreaterThanOrEqual(greedy.value);
    expect(best.weight).toBeLessThanOrEqual(capacity);
    expect(greedy.weight).toBeLessThanOrEqual(capacity);
    if (best.value > greedy.value) greedyLoses++;
    const points = [depot, ...best.chosen];
    const exact = sequenceRoute(points, "exact");
    expect(exact.route[0]).toBe(0);
    expect(new Set(exact.route).size).toBe(points.length);
    const { weight: tree } = spanningTree(points);
    expect(tree).toBeLessThanOrEqual(exact.length + 1e-9);
    for (const strategy of ["nearest", "insertion", "twoopt"] as const) {
      const other = sequenceRoute(points, strategy);
      expect(new Set(other.route).size).toBe(points.length);
      expect(other.length).toBeGreaterThanOrEqual(exact.length - 1e-9);
    }
    expect(sequenceRoute(points, "twoopt").length).toBeLessThanOrEqual(
      sequenceRoute(points, "insertion").length + 1e-9,
    );
  }
  expect(greedyLoses).toBeGreaterThan(0);
});

test("Swarm sample: zones cover the lot with less repeated work than independent robots", () => {
  const zones = simulate("zones"),
    alone = simulate("independent");
  for (const run of [zones, alone]) {
    const last = run.frames.at(-1)!;
    expect(last.covered).toBe(COLS * ROWS);
    expect(last.found).toBe(potholes.length);
  }
  expect(zones.frames.at(-1)!.redundant).toBe(0);
  expect(alone.frames.at(-1)!.redundant).toBeGreaterThan(0);
  expect(zones.frames.length).toBeLessThan(alone.frames.length);
});

test("Leakage sample: a row split shares engines across sets, an engine split never does", () => {
  for (const seed of [1, 2, 3, 4, 5]) {
    expect(splitEngines("engine", seed).shared).toBe(0);
    expect(splitEngines("row", seed).shared).toBeGreaterThan(0);
  }
});
