/**
 * The toy search the SWARMMIND scenes share: a seeded 18 x 11 map, four
 * searchers, and two strategies. This is an illustration, not SWARMMIND output.
 */
export const W = 18;
export const H = 11;
export const AGENTS = 4;
export const STEPS = 90;
export const walls = new Set([
  ...[2, 3, 4, 5, 6].map((y) => y * W + 6),
  ...[4, 5, 6, 7, 8].map((y) => y * W + 12),
  ...[9, 10, 11].map((x) => 2 * W + x),
]);
export const survivors = [3 * W + 15, 8 * W + 3, 1 * W + 9, 9 * W + 16, 5 * W + 9, 7 * W + 14];
export type Strategy = "random" | "frontier";

/** Seeded generator so every visitor sees the same run. */
export function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const neighbours = (c: number) =>
  [c - W, c + W, c % W ? c - 1 : -1, (c + 1) % W ? c + 1 : -1].filter((n) => n >= 0 && n < W * H && !walls.has(n));

export function sense(c: number, seen: Set<number>) {
  const x = c % W, y = Math.floor(c / W);
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < W && ny >= 0 && ny < H) seen.add(ny * W + nx);
    }
}
/** First step towards the nearest unseen cell nobody else is heading for. */
export function towardFrontier(start: number, seen: Set<number>, claimed: Set<number>) {
  const prev = new Map<number, number>([[start, -1]]);
  const queue = [start];
  while (queue.length) {
    const c = queue.shift()!;
    if (!seen.has(c) && !claimed.has(c)) {
      claimed.add(c);
      let step = c;
      while (prev.get(step) !== start && prev.get(step) !== -1) step = prev.get(step)!;
      return step;
    }
    for (const n of neighbours(c)) if (!prev.has(n)) { prev.set(n, c); queue.push(n); }
  }
  return start;
}

export function simulate(strategy: Strategy) {
  const random = rng(7);
  let agents = Array.from({ length: AGENTS }, (_, i) => i * W);
  const seen = new Set<number>();
  agents.forEach((a) => sense(a, seen));
  const frames = [{ agents, seen: new Set(seen) }];
  for (let t = 0; t < STEPS; t++) {
    const claimed = new Set<number>();
    agents = agents.map((a) => {
      if (strategy === "frontier") return towardFrontier(a, seen, claimed);
      const options = neighbours(a);
      return options[Math.floor(random() * options.length)] ?? a;
    });
    agents.forEach((a) => sense(a, seen));
    frames.push({ agents, seen: new Set(seen) });
  }
  return frames;
}
export const open = W * H - walls.size;
export type Frame = { agents: number[]; seen: Set<number> };
export const coverage = (f: Frame) => Math.round(([...f.seen].filter((c) => !walls.has(c)).length / open) * 100);
export const found = (f: Frame) => survivors.filter((s) => f.seen.has(s)).length;


