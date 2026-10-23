/**
 * A small, fixed delivery example used by the Last Mile DAA walkthrough.
 *
 * Last Mile DAA chains a distance stage, MST zoning, knapsack order selection
 * and route sequencing (Held-Karp when small, otherwise cheapest insertion with
 * 2-opt). This file re-implements simplified versions of those ideas on nine
 * sample orders so a visitor can see the trade-offs. It is not the project's
 * Python solver and its numbers are not results from that solver.
 */
export type Point = { x: number; y: number };
export type Order = Point & {
  id: string;
  weight: number;
  value: number;
};

export const depot: Point = { x: 50, y: 50 };

/** Sample orders. Weight and value are illustrative units, not real parcels. */
export const orders: Order[] = [
  { id: "A", x: 18, y: 22, weight: 4, value: 10 },
  { id: "B", x: 82, y: 18, weight: 5, value: 12 },
  { id: "C", x: 90, y: 62, weight: 3, value: 7 },
  { id: "D", x: 70, y: 86, weight: 6, value: 13 },
  { id: "E", x: 38, y: 80, weight: 2, value: 4 },
  { id: "F", x: 10, y: 66, weight: 5, value: 9 },
  { id: "G", x: 32, y: 42, weight: 4, value: 6 },
  { id: "H", x: 62, y: 34, weight: 3, value: 4 },
];

export type SelectionStrategy = "greedy" | "knapsack";
export type SequenceStrategy = "nearest" | "insertion" | "twoopt" | "exact";

export const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

export type Selection = {
  chosen: Order[];
  weight: number;
  value: number;
};

/** Greedy by value per unit of weight, the kind of baseline a knapsack is compared with. */
export function selectGreedy(capacity: number): Selection {
  const chosen: Order[] = [];
  let weight = 0;
  const ranked = [...orders].sort(
    (a, b) =>
      b.value / b.weight - a.value / a.weight || a.id.localeCompare(b.id),
  );
  for (const order of ranked)
    if (weight + order.weight <= capacity) {
      chosen.push(order);
      weight += order.weight;
    }
  return summarise(chosen);
}

/** 0/1 knapsack by dynamic programming: the best total value that fits. */
export function selectKnapsack(capacity: number): Selection {
  const n = orders.length;
  const table = Array.from({ length: n + 1 }, () =>
    Array<number>(capacity + 1).fill(0),
  );
  for (let i = 1; i <= n; i++) {
    const { weight, value } = orders[i - 1];
    for (let c = 0; c <= capacity; c++) {
      table[i][c] = table[i - 1][c];
      if (weight <= c)
        table[i][c] = Math.max(table[i][c], table[i - 1][c - weight] + value);
    }
  }
  const chosen: Order[] = [];
  let c = capacity;
  for (let i = n; i >= 1; i--)
    if (table[i][c] !== table[i - 1][c]) {
      chosen.unshift(orders[i - 1]);
      c -= orders[i - 1].weight;
    }
  return summarise(chosen);
}

function summarise(chosen: Order[]): Selection {
  return {
    chosen,
    weight: chosen.reduce((sum, o) => sum + o.weight, 0),
    value: chosen.reduce((sum, o) => sum + o.value, 0),
  };
}

export const selectOrders = (strategy: SelectionStrategy, capacity: number) =>
  strategy === "greedy" ? selectGreedy(capacity) : selectKnapsack(capacity);

/* ---------- route sequencing ---------- */

/** Node 0 is the depot; 1..n are the chosen orders. A route is a node order that starts at 0. */
export const routeLength = (points: Point[], route: number[]) => {
  let total = 0;
  for (let i = 0; i < route.length; i++)
    total += dist(points[route[i]], points[route[(i + 1) % route.length]]);
  return total;
};

function nearest(points: Point[]): number[] {
  const route = [0];
  const left = new Set(points.map((_, i) => i).slice(1));
  while (left.size) {
    const last = points[route[route.length - 1]];
    let best = -1;
    for (const i of left)
      if (best < 0 || dist(last, points[i]) < dist(last, points[best]))
        best = i;
    route.push(best);
    left.delete(best);
  }
  return route;
}

function insertion(points: Point[]): number[] {
  if (points.length < 3) return points.map((_, i) => i);
  let far = 1;
  for (let i = 2; i < points.length; i++)
    if (dist(points[0], points[i]) > dist(points[0], points[far])) far = i;
  const route = [0, far];
  const left = new Set(points.map((_, i) => i).filter((i) => i && i !== far));
  while (left.size) {
    let pick = -1,
      at = 0,
      cost = Infinity;
    for (const k of left)
      for (let i = 0; i < route.length; i++) {
        const a = points[route[i]],
          b = points[route[(i + 1) % route.length]];
        const extra = dist(a, points[k]) + dist(points[k], b) - dist(a, b);
        if (extra < cost) {
          cost = extra;
          pick = k;
          at = i + 1;
        }
      }
    route.splice(at, 0, pick);
    left.delete(pick);
  }
  return route;
}

function twoOpt(points: Point[], start: number[]): number[] {
  const route = [...start];
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 1; i < route.length - 1; i++)
      for (let j = i + 1; j < route.length; j++) {
        const next = [
          ...route.slice(0, i),
          ...route.slice(i, j + 1).reverse(),
          ...route.slice(j + 1),
        ];
        if (routeLength(points, next) < routeLength(points, route) - 1e-9) {
          route.splice(0, route.length, ...next);
          improved = true;
        }
      }
  }
  return route;
}

/** Held-Karp dynamic programming: the exact shortest round trip for a small set. */
function heldKarp(points: Point[]): number[] {
  const n = points.length;
  if (n <= 2) return points.map((_, i) => i);
  const m = n - 1,
    full = 1 << m;
  const cost = Array.from({ length: full }, () =>
    Array<number>(m).fill(Infinity),
  );
  const from = Array.from({ length: full }, () => Array<number>(m).fill(-1));
  for (let j = 0; j < m; j++) cost[1 << j][j] = dist(points[0], points[j + 1]);
  for (let mask = 1; mask < full; mask++)
    for (let j = 0; j < m; j++) {
      if (!(mask & (1 << j)) || cost[mask][j] === Infinity) continue;
      for (let k = 0; k < m; k++) {
        if (mask & (1 << k)) continue;
        const next = mask | (1 << k),
          candidate = cost[mask][j] + dist(points[j + 1], points[k + 1]);
        if (candidate < cost[next][k]) {
          cost[next][k] = candidate;
          from[next][k] = j;
        }
      }
    }
  let end = 0,
    best = Infinity;
  for (let j = 0; j < m; j++) {
    const total = cost[full - 1][j] + dist(points[j + 1], points[0]);
    if (total < best) {
      best = total;
      end = j;
    }
  }
  const route: number[] = [];
  let mask = full - 1,
    at = end;
  while (at >= 0) {
    route.unshift(at + 1);
    const previous = from[mask][at];
    mask &= ~(1 << at);
    at = previous;
  }
  return [0, ...route];
}

/** Minimum spanning tree weight (Prim). The tree is a lower bound for any round trip. */
export function spanningTree(points: Point[]) {
  const edges: [number, number][] = [];
  if (points.length < 2) return { edges, weight: 0 };
  const inTree = new Set([0]);
  let weight = 0;
  while (inTree.size < points.length) {
    let best: [number, number] | null = null,
      bestCost = Infinity;
    for (const a of inTree)
      for (let b = 0; b < points.length; b++) {
        if (inTree.has(b)) continue;
        const d = dist(points[a], points[b]);
        if (d < bestCost) {
          bestCost = d;
          best = [a, b];
        }
      }
    if (!best) break;
    edges.push(best);
    inTree.add(best[1]);
    weight += bestCost;
  }
  return { edges, weight };
}

export function sequenceRoute(points: Point[], strategy: SequenceStrategy) {
  const route =
    strategy === "nearest"
      ? nearest(points)
      : strategy === "insertion"
        ? insertion(points)
        : strategy === "twoopt"
          ? twoOpt(points, insertion(points))
          : heldKarp(points);
  return { route, length: routeLength(points, route) };
}

export const sequenceInfo: Record<
  SequenceStrategy,
  { label: string; blurb: string }
> = {
  nearest: {
    label: "Nearest neighbour",
    blurb:
      "A simple baseline: always drive to the closest stop that is left. Quick, but it can leave a long return trip.",
  },
  insertion: {
    label: "Cheapest insertion",
    blurb:
      "Start with a short loop and keep adding the stop that lengthens the loop the least.",
  },
  twoopt: {
    label: "Insertion + 2-opt",
    blurb:
      "Take the insertion route and keep reversing stretches of it while that makes the trip shorter.",
  },
  exact: {
    label: "Exact (Held-Karp)",
    blurb:
      "Checks every ordering through dynamic programming. Exact, but the work grows quickly, so it only suits small sets of stops.",
  },
};
