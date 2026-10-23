export type SearchAlgorithm =
  "BFS" | "DFS" | "Dijkstra" | "A*" | "Greedy" | "Bidirectional";
export type MazePattern = "random" | "open";
export const ALGORITHMS: SearchAlgorithm[] = [
  "BFS",
  "DFS",
  "Dijkstra",
  "A*",
  "Greedy",
  "Bidirectional",
];
/** Plain-language behaviour of each solver, shown next to the demo. */
export const algorithmInfo: Record<
  SearchAlgorithm,
  { label: string; blurb: string; shortest: boolean }
> = {
  BFS: {
    label: "Breadth-first",
    blurb:
      "Spreads out one step at a time, so the first time it reaches the goal it has found a shortest route.",
    shortest: true,
  },
  DFS: {
    label: "Depth-first",
    blurb:
      "Follows one corridor as far as it goes, then backs up. It can wander a long way, and the path it finds is not guaranteed to be shortest.",
    shortest: false,
  },
  Dijkstra: {
    label: "Dijkstra",
    blurb:
      "Always expands the cheapest known cell. Every step costs the same on this grid, so it behaves like breadth-first and finds a shortest path.",
    shortest: true,
  },
  "A*": {
    label: "A*",
    blurb:
      "Dijkstra plus a Manhattan-distance guess towards the goal. It usually explores fewer cells and still finds a shortest path.",
    shortest: true,
  },
  Greedy: {
    label: "Greedy best-first",
    blurb:
      "Follows only the guess towards the goal. It can explore very few cells, but the path it finds is not guaranteed to be shortest.",
    shortest: false,
  },
  Bidirectional: {
    label: "Bidirectional",
    blurb:
      "Searches from the start and from the goal at once and stops where the two meet, which finds a shortest path.",
    shortest: true,
  },
};
export type Maze = {
  width: number;
  height: number;
  cells: boolean[];
  start: number;
  goal: number;
};
export type SearchTrace = {
  visited: number[];
  path: number[];
  distances: Record<number, number>;
};
// Independent TypeScript implementations of the standard algorithms verified in
// Mazera. Grid movement is four-connected and unweighted, as in the source.
export function makeMaze(
  seed = 1,
  width = 21,
  height = 13,
  pattern: MazePattern = "random",
): Maze {
  let value = seed >>> 0;
  const random = () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
  const cells = Array<boolean>(width * height).fill(true);
  const start = width + 1,
    goal = (height - 2) * width + width - 2;
  if (pattern === "open") {
    for (let y = 1; y < height - 1; y++)
      for (let x = 1; x < width - 1; x++) cells[y * width + x] = false;
    return { width, height, cells, start, goal };
  }
  const stack = [start];
  cells[start] = false;
  while (stack.length) {
    const current = stack[stack.length - 1],
      x = current % width,
      y = Math.floor(current / width);
    const neighbors = [
      [2, 0],
      [-2, 0],
      [0, 2],
      [0, -2],
    ]
      .map(([dx, dy]) => ({ x: x + dx, y: y + dy }))
      .filter(
        (p) =>
          p.x > 0 &&
          p.x < width - 1 &&
          p.y > 0 &&
          p.y < height - 1 &&
          cells[p.y * width + p.x],
      );
    if (!neighbors.length) {
      stack.pop();
      continue;
    }
    const next = neighbors[Math.floor(random() * neighbors.length)];
    const id = next.y * width + next.x;
    cells[Math.floor((y + next.y) / 2) * width + Math.floor((x + next.x) / 2)] =
      false;
    cells[id] = false;
    stack.push(id);
  }
  return { width, height, cells, start, goal };
}
export function solveMaze(maze: Maze, algorithm: SearchAlgorithm): SearchTrace {
  if (algorithm === "Bidirectional") return solveBidirectional(maze);
  return solveSingle(maze, algorithm);
}
const STEPS = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];
function solveBidirectional(maze: Maze): SearchTrace {
  const { width, height, cells, start, goal } = maze;
  const dist = [new Map([[start, 0]]), new Map([[goal, 0]])];
  const parent = [new Map<number, number>(), new Map<number, number>()];
  const frontier = [[start], [goal]];
  const visited: number[] = [];
  let best: { total: number; from: number; to: number; side: 0 | 1 } | null =
    null;
  while (frontier[0].length && frontier[1].length && !best) {
    const side: 0 | 1 = frontier[0].length <= frontier[1].length ? 0 : 1,
      other = 1 - side,
      next: number[] = [];
    for (const current of frontier[side]) {
      visited.push(current);
      const x = current % width,
        y = Math.floor(current / width);
      for (const [dx, dy] of STEPS) {
        const nx = x + dx,
          ny = y + dy,
          id = ny * width + nx;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height || cells[id])
          continue;
        const here = dist[side].get(current)! + 1;
        if (dist[other].has(id)) {
          const total = here + dist[other].get(id)!;
          if (!best || total < best.total)
            best = { total, from: current, to: id, side };
        }
        if (dist[side].has(id)) continue;
        dist[side].set(id, here);
        parent[side].set(id, current);
        next.push(id);
      }
    }
    frontier[side] = next;
  }
  const distances: Record<number, number> = {};
  for (const id of new Set([...dist[0].keys(), ...dist[1].keys()]))
    distances[id] = Math.min(
      dist[0].get(id) ?? Infinity,
      dist[1].get(id) ?? Infinity,
    );
  const path: number[] = [];
  if (best) {
    const startSide = best.side === 0 ? best.from : best.to,
      goalSide = best.side === 0 ? best.to : best.from;
    for (let id: number | undefined = startSide; id !== undefined;) {
      path.unshift(id);
      id = parent[0].get(id);
    }
    for (let id: number | undefined = goalSide; id !== undefined;) {
      path.push(id);
      id = parent[1].get(id);
    }
  }
  return { visited, path, distances };
}
function solveSingle(maze: Maze, algorithm: SearchAlgorithm): SearchTrace {
  const { width, height, cells, start, goal } = maze;
  const open = [start],
    closed = new Set<number>(),
    discovered = new Set([start]);
  const parent = new Map<number, number>();
  const distances: Record<number, number> = { [start]: 0 };
  const visited: number[] = [];
  const heuristic = (id: number) =>
    Math.abs((id % width) - (goal % width)) +
    Math.abs(Math.floor(id / width) - Math.floor(goal / width));
  let cursor = 0;
  while (algorithm === "BFS" ? cursor < open.length : open.length > 0) {
    let current: number;
    if (algorithm === "BFS") current = open[cursor++];
    else if (algorithm === "DFS") current = open.pop()!;
    else {
      const score = (id: number) =>
        algorithm === "Greedy"
          ? heuristic(id)
          : distances[id] + (algorithm === "A*" ? heuristic(id) : 0);
      let best = 0;
      for (let i = 1; i < open.length; i++)
        if (score(open[i]) < score(open[best])) best = i;
      current = open.splice(best, 1)[0];
    }
    if (closed.has(current)) continue;
    closed.add(current);
    visited.push(current);
    if (current === goal) break;
    const x = current % width,
      y = Math.floor(current / width);
    for (const [dx, dy] of [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ]) {
      const nx = x + dx,
        ny = y + dy,
        id = ny * width + nx;
      if (
        nx < 0 ||
        nx >= width ||
        ny < 0 ||
        ny >= height ||
        cells[id] ||
        closed.has(id)
      )
        continue;
      const nextDistance = distances[current] + 1;
      if (algorithm === "BFS" || algorithm === "DFS") {
        if (discovered.has(id)) continue;
        discovered.add(id);
        parent.set(id, current);
        distances[id] = nextDistance;
        open.push(id);
      } else if (algorithm === "Greedy") {
        if (discovered.has(id)) continue;
        discovered.add(id);
        parent.set(id, current);
        distances[id] = nextDistance;
        open.push(id);
      } else if (distances[id] === undefined || nextDistance < distances[id]) {
        parent.set(id, current);
        distances[id] = nextDistance;
        open.push(id);
      }
    }
  }
  const path: number[] = [];
  if (closed.has(goal)) {
    let id = goal;
    path.push(id);
    while (id !== start) {
      const previous = parent.get(id);
      if (previous === undefined) break;
      id = previous;
      path.push(id);
    }
    path.reverse();
  }
  return { visited, path, distances };
}
