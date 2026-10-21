export type SearchAlgorithm = "BFS" | "DFS" | "Dijkstra" | "A*";
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
export function makeMaze(seed = 1, width = 21, height = 13): Maze {
  let value = seed >>> 0;
  const random = () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
  const cells = Array<boolean>(width * height).fill(true);
  const start = width + 1,
    goal = (height - 2) * width + width - 2;
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
      let best = 0;
      for (let i = 1; i < open.length; i++)
        if (
          distances[open[i]] + (algorithm === "A*" ? heuristic(open[i]) : 0) <
          distances[open[best]] +
            (algorithm === "A*" ? heuristic(open[best]) : 0)
        )
          best = i;
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
