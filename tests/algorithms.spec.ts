import { test, expect } from "@playwright/test";
import { makeMaze, solveMaze, type SearchAlgorithm } from "../src/lib/maze";
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
    for (const algorithm of [
      "BFS",
      "DFS",
      "Dijkstra",
      "A*",
    ] as SearchAlgorithm[]) {
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
      if (algorithm !== "DFS") expect(trace.path.length).toBe(bfs.path.length);
    }
  }
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
