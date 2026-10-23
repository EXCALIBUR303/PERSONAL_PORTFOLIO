/**
 * A tiny re-creation of the ParkScan Swarm idea for this site.
 *
 * ParkScan Swarm has three centrally coordinated simulated robots inspect a
 * 150 by 100 metre parking lot and map potholes. This file simulates the same
 * shape of problem on a 30 by 20 grid of 5 metre cells so the effect of
 * splitting the lot into zones is visible. It is a separate, much simpler
 * simulation: no charging, no ROS 2, no MQTT, and its numbers are not outputs
 * of the project's simulator or its benchmarks.
 */
export const COLS = 30;
export const ROWS = 20;
export const ROBOTS = 3;
export type Strategy = "zones" | "independent";

/** Potholes placed by hand so every run is the same. Cell coordinates. */
export const potholes: [number, number][] = [
  [3, 3],
  [8, 15],
  [12, 6],
  [14, 17],
  [17, 2],
  [19, 11],
  [22, 8],
  [24, 16],
  [27, 4],
  [28, 13],
  [5, 10],
  [11, 12],
  [21, 18],
  [26, 9],
];

const starts: [number, number][] = [
  [0, 0],
  [14, 0],
  [29, 0],
];

export type Frame = {
  robots: [number, number][];
  covered: number;
  redundant: number;
  found: number;
};
export type Run = {
  frames: Frame[];
  /** Tick at which each cell was first covered, or -1 if never. */
  firstCovered: Int16Array;
  /** Tick at which each pothole was first detected, or -1. */
  foundAt: number[];
  /** Which robot found each pothole, or -1. */
  foundBy: number[];
};

const idx = (x: number, y: number) => y * COLS + x;

/** Zone owner of a cell for the central allocator: three vertical strips. */
const zoneOf = (x: number) =>
  Math.min(ROBOTS - 1, Math.floor(x / (COLS / ROBOTS)));

export function simulate(strategy: Strategy): Run {
  const own = Array.from({ length: ROBOTS }, () => new Uint8Array(COLS * ROWS));
  const robots = starts.map(([x, y]) => [x, y] as [number, number]);
  const firstCovered = new Int16Array(COLS * ROWS).fill(-1);
  const foundAt = potholes.map(() => -1);
  const foundBy = potholes.map(() => -1);
  const frames: Frame[] = [];
  let covered = 0,
    redundant = 0,
    found = 0;

  const cover = (r: number, tick: number) => {
    const [rx, ry] = robots[r];
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const x = rx + dx,
          y = ry + dy;
        if (x < 0 || y < 0 || x >= COLS || y >= ROWS) continue;
        if (strategy === "zones" && zoneOf(x) !== r) continue;
        const i = idx(x, y);
        if (own[r][i]) continue;
        own[r][i] = 1;
        if (firstCovered[i] < 0) {
          firstCovered[i] = tick;
          covered++;
        } else redundant++;
        potholes.forEach(([px, py], k) => {
          if (px === x && py === y && foundAt[k] < 0) {
            foundAt[k] = tick;
            foundBy[k] = r;
            found++;
          }
        });
      }
  };

  const wanted = (r: number, x: number, y: number) =>
    !own[r][idx(x, y)] && (strategy === "independent" || zoneOf(x) === r);

  /** Step one cell towards the nearest cell this robot has not covered yet. */
  const move = (r: number) => {
    const [sx, sy] = robots[r];
    const seen = new Int32Array(COLS * ROWS).fill(-2);
    const queue: number[] = [];
    seen[idx(sx, sy)] = -1;
    queue.push(idx(sx, sy));
    const dirs = [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ];
    for (let head = 0; head < queue.length; head++) {
      const cur = queue[head],
        cx = cur % COLS,
        cy = Math.floor(cur / COLS);
      if ((cx !== sx || cy !== sy) && wanted(r, cx, cy)) {
        let step = cur;
        while (seen[step] !== idx(sx, sy)) step = seen[step];
        robots[r] = [step % COLS, Math.floor(step / COLS)];
        return true;
      }
      for (const [dx, dy] of dirs) {
        const nx = cx + dx,
          ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
        if (seen[idx(nx, ny)] !== -2) continue;
        seen[idx(nx, ny)] = cur;
        queue.push(idx(nx, ny));
      }
    }
    return false;
  };

  for (let r = 0; r < ROBOTS; r++) {
    if (strategy === "zones") robots[r] = [Math.floor((r * COLS) / ROBOTS), 0];
    cover(r, 0);
  }
  frames.push({
    robots: robots.map((p) => [...p] as [number, number]),
    covered,
    redundant,
    found,
  });
  for (let tick = 1; tick < 900 && covered < COLS * ROWS; tick++) {
    let moved = false;
    for (let r = 0; r < ROBOTS; r++) {
      if (move(r)) moved = true;
      cover(r, tick);
    }
    frames.push({
      robots: robots.map((p) => [...p] as [number, number]),
      covered,
      redundant,
      found,
    });
    if (!moved) break;
  }
  return { frames, firstCovered, foundAt, foundBy };
}
