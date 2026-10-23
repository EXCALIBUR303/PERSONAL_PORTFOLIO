"use client";
import { useEffect, useRef } from "react";
import { useInView, useReducedMotion } from "motion/react";

/**
 * Small looping canvas sketches that stand in for each project's idea.
 * They are illustrations of the documented concept, not recordings of the
 * real systems, and the UI says so wherever they appear.
 */
export type AnimKind =
  | "mst"
  | "swarm"
  | "dog"
  | "flock"
  | "drone"
  | "chat"
  | "heatmap"
  | "orbit"
  | "maze"
  | "route"
  | "slots"
  | "bars"
  | "pulse"
  | "scan"
  | "shot";

export const animForSlug: Record<string, AnimKind> = {
  "last-mile-daa": "mst",
  "parkscan-swarm": "swarm",
  "quadruped-rl": "dog",
  swarmmind: "flock",
  aeris: "drone",
  "private-local-ai": "chat",
  lifeos: "heatmap",
  aura: "orbit",
  "mazera-ai-maze-solver": "maze",
  pathable: "route",
  "green-mobility": "route",
  "smart-parking-dbms": "slots",
  "predictive-maintenance": "bars",
  rupeerise: "bars",
  "student-burnout-ai": "pulse",
  "burnout-backend": "pulse",
  "uco-recovery-station": "scan",
  "resume-screener": "scan",
  sigsmith: "scan",
  "football-penalty-shootout": "shot",
};

type Pal = Record<
  "ink" | "paper" | "cobalt" | "lime" | "pink" | "tan" | "sky",
  string
>;
type Ctx = CanvasRenderingContext2D;
type Pt = [number, number];
const W = 240;
const H = 150;

function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
const r0 = rng(11);
const PTS: Pt[] = Array.from({ length: 9 }, () => [
  22 + r0() * 196,
  20 + r0() * 110,
]);
const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const MST: Pt[] = (() => {
  const inTree = [0];
  const edges: Pt[] = [];
  while (inTree.length < PTS.length) {
    let best: Pt = [0, 0];
    let bd = Infinity;
    for (const a of inTree)
      for (let b = 0; b < PTS.length; b++) {
        if (inTree.includes(b)) continue;
        const d = dist(PTS[a], PTS[b]);
        if (d < bd) {
          bd = d;
          best = [a, b];
        }
      }
    edges.push(best);
    inTree.push(best[1]);
  }
  return edges;
})();

const GC = 16;
const GR = 10;
const CS = 15;
const rg = rng(5);
const WALL: boolean[][] = Array.from({ length: GR }, (_, y) =>
  Array.from(
    { length: GC },
    (_, x) => x + y > 1 && x + y < GC + GR - 3 && rg() < 0.28,
  ),
);
const BFS = (() => {
  const d: number[][] = WALL.map((row) => row.map(() => -1));
  const parent = new Map<string, string>();
  const queue: Pt[] = [[0, 0]];
  d[0][0] = 0;
  while (queue.length) {
    const [x, y] = queue.shift() as Pt;
    for (const [dx, dy] of [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ] as Pt[]) {
      const nx = x + dx,
        ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= GC || ny >= GR) continue;
      if (WALL[ny][nx] || d[ny][nx] >= 0) continue;
      d[ny][nx] = d[y][x] + 1;
      parent.set(`${nx},${ny}`, `${x},${y}`);
      queue.push([nx, ny]);
    }
  }
  let goal: Pt = [GC - 1, GR - 1];
  if (d[GR - 1][GC - 1] < 0) {
    let best = 0;
    d.forEach((row, y) =>
      row.forEach((v, x) => {
        if (v > best) {
          best = v;
          goal = [x, y];
        }
      }),
    );
  }
  const path: Pt[] = [];
  let key: string | undefined = `${goal[0]},${goal[1]}`;
  while (key) {
    const [x, y] = key.split(",").map(Number);
    path.unshift([x, y]);
    key = parent.get(key);
  }
  return { d, path, max: Math.max(...d.flat()) };
})();
const gx = (x: number) => x * CS;
const gy = (y: number) => y * CS;

function dot(c: Ctx, x: number, y: number, rad: number, fill: string, p: Pal) {
  c.beginPath();
  c.arc(x, y, rad, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
  c.lineWidth = 2;
  c.strokeStyle = p.ink;
  c.stroke();
}
function rect(
  c: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  p: Pal,
  stroke = true,
) {
  c.fillStyle = fill;
  c.fillRect(x, y, w, h);
  if (stroke) {
    c.lineWidth = 2;
    c.strokeStyle = p.ink;
    c.strokeRect(x, y, w, h);
  }
}
function walls(c: Ctx, p: Pal) {
  for (let y = 0; y < GR; y++)
    for (let x = 0; x < GC; x++)
      if (WALL[y][x])
        rect(c, gx(x) + 1, gy(y) + 1, CS - 2, CS - 2, p.ink, p, false);
}
function poly(c: Ctx, pts: Pt[], close = false) {
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  if (close) c.closePath();
}

const DRAW: Record<AnimKind, (c: Ctx, t: number, p: Pal) => void> = {
  mst(c, t, p) {
    const k = (t % (MST.length * 0.45 + 1.6)) / 0.45;
    c.lineWidth = 1;
    c.strokeStyle = p.ink;
    c.globalAlpha = 0.18;
    PTS.forEach((a, i) =>
      PTS.slice(i + 1, i + 3).forEach((b) => {
        c.beginPath();
        c.moveTo(a[0], a[1]);
        c.lineTo(b[0], b[1]);
        c.stroke();
      }),
    );
    c.globalAlpha = 1;
    c.lineWidth = 3;
    c.strokeStyle = p.cobalt;
    const on = new Set([0]);
    MST.forEach(([a, b], i) => {
      if (i > k) return;
      const f = Math.min(1, k - i);
      const A = PTS[a],
        B = PTS[b];
      c.beginPath();
      c.moveTo(A[0], A[1]);
      c.lineTo(A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f);
      c.stroke();
      if (f >= 1) on.add(b);
    });
    PTS.forEach((q, i) =>
      dot(c, q[0], q[1], 6, on.has(i) ? p.lime : p.paper, p),
    );
  },
  swarm(c, t, p) {
    c.strokeStyle = p.ink;
    c.lineWidth = 1.5;
    for (let x = 10; x < W; x += 22) {
      c.beginPath();
      c.moveTo(x, 4);
      c.lineTo(x, 26);
      c.moveTo(x, H - 26);
      c.lineTo(x, H - 4);
      c.stroke();
    }
    const lanes = [42, 75, 108];
    const cols = [p.cobalt, p.tan, p.pink];
    const holes: Pt[] = [
      [50, 42],
      [160, 42],
      [95, 75],
      [200, 75],
      [30, 108],
      [135, 108],
    ];
    const fx = 12 + ((t % 6) / 6) * 216;
    holes.forEach(([hx, hy]) => {
      if (fx > hx) dot(c, hx, hy + 9, 4, p.lime, p);
    });
    lanes.forEach((y, i) => {
      const x = fx - i * 4;
      c.globalAlpha = 0.25;
      c.fillStyle = cols[i];
      c.beginPath();
      poly(
        c,
        [
          [x + 6, y],
          [x + 30, y - 10],
          [x + 30, y + 10],
        ],
        true,
      );
      c.fill();
      c.globalAlpha = 1;
      rect(c, x - 7, y - 7, 14, 14, cols[i], p);
    });
  },
  dog(c, t, p) {
    const by = 62 + Math.sin(t * 12) * 2;
    c.strokeStyle = p.ink;
    c.lineWidth = 2;
    c.setLineDash([8, 8]);
    c.lineDashOffset = t * 60;
    c.beginPath();
    c.moveTo(0, 124);
    c.lineTo(W, 124);
    c.stroke();
    c.setLineDash([]);
    const hips = [70, 92, 148, 170];
    const phase = [0, Math.PI, Math.PI, 0];
    hips.forEach((hx, i) => {
      const a = Math.sin(t * 6 + phase[i]) * 0.5;
      const kx = hx + Math.sin(a) * 30;
      const ky = by + 12 + Math.cos(a) * 30;
      const b = a - 0.5 - Math.max(0, Math.sin(t * 6 + phase[i])) * 0.6;
      c.lineWidth = 5;
      c.lineCap = "round";
      c.strokeStyle = p.ink;
      c.beginPath();
      c.moveTo(hx, by + 12);
      c.lineTo(kx, ky);
      c.lineTo(kx - Math.sin(b) * 26, Math.min(122, ky + Math.cos(b) * 26));
      c.stroke();
      dot(c, kx, ky, 3.5, p.lime, p);
    });
    rect(c, 56, by - 4, 128, 22, p.cobalt, p);
    rect(c, 182, by - 18, 30, 22, p.cobalt, p);
    dot(c, 203, by - 8, 2.5, p.lime, p);
  },
  flock(c, t, p) {
    for (let i = 0; i < 22; i++) {
      const ph = i * 0.9;
      const cx = 120 + Math.cos(t * 0.8 + ph * 0.1) * 70;
      const cy = 75 + Math.sin(t * 1.1 + ph * 0.1) * 40;
      const x = cx + Math.cos(ph * 3 + t) * (14 + (i % 5) * 6);
      const y = cy + Math.sin(ph * 2 + t) * (10 + (i % 4) * 5);
      c.save();
      c.translate(x, y);
      c.rotate(t * 0.8 + ph * 0.1 + Math.PI / 2);
      c.beginPath();
      poly(
        c,
        [
          [7, 0],
          [-5, -4],
          [-5, 4],
        ],
        true,
      );
      c.fillStyle = i % 3 ? p.paper : p.cobalt;
      c.fill();
      c.lineWidth = 1.5;
      c.strokeStyle = p.ink;
      c.stroke();
      c.restore();
    }
  },
  drone(c, t, p) {
    walls(c, p);
    const n = BFS.path.length;
    const k = (t * 6) % (n + 8);
    c.strokeStyle = p.pink;
    c.lineWidth = 4;
    c.lineJoin = "round";
    c.beginPath();
    poly(
      c,
      BFS.path
        .slice(0, Math.min(n, Math.floor(k) + 1))
        .map(([x, y]): Pt => [gx(x) + CS / 2, gy(y) + CS / 2]),
    );
    c.stroke();
    const [hx, hy] = BFS.path[Math.min(n - 1, Math.floor(k))];
    const X = gx(hx) + CS / 2;
    const Y = gy(hy) + CS / 2;
    c.strokeStyle = p.ink;
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(X - 8, Y - 8);
    c.lineTo(X + 8, Y + 8);
    c.moveTo(X + 8, Y - 8);
    c.lineTo(X - 8, Y + 8);
    c.stroke();
    (
      [
        [-8, -8],
        [8, 8],
        [8, -8],
        [-8, 8],
      ] as Pt[]
    ).forEach(([a, b]) => dot(c, X + a, Y + b, 3, p.lime, p));
    const [ex, ey] = BFS.path[n - 1];
    dot(c, gx(ex) + CS / 2, gy(ey) + CS / 2, 5, p.lime, p);
  },
  maze(c, t, p) {
    const k = (t * 9) % (BFS.max + 14);
    BFS.d.forEach((row, y) =>
      row.forEach((v, x) => {
        if (v >= 0 && v <= k) {
          c.globalAlpha = 0.55;
          rect(c, gx(x) + 1, gy(y) + 1, CS - 2, CS - 2, p.sky, p, false);
          c.globalAlpha = 1;
        }
      }),
    );
    walls(c, p);
    if (k > BFS.max)
      BFS.path.forEach(([x, y]) =>
        rect(c, gx(x) + 4, gy(y) + 4, CS - 8, CS - 8, p.lime, p),
      );
  },
  route(c, t, p) {
    const order = [0, 3, 5, 2, 7, 8];
    const stairs = PTS[4];
    c.lineWidth = 1;
    c.strokeStyle = p.ink;
    c.globalAlpha = 0.2;
    PTS.forEach((a) =>
      PTS.forEach((b) => {
        if (dist(a, b) < 70) {
          c.beginPath();
          c.moveTo(a[0], a[1]);
          c.lineTo(b[0], b[1]);
          c.stroke();
        }
      }),
    );
    c.globalAlpha = 1;
    const k = (t * 1.4) % (order.length + 1.5);
    c.lineWidth = 4;
    c.strokeStyle = p.cobalt;
    c.setLineDash([6, 5]);
    c.lineDashOffset = -t * 30;
    c.beginPath();
    poly(
      c,
      order.filter((_, i) => i <= k).map((n) => PTS[n]),
    );
    c.stroke();
    c.setLineDash([]);
    PTS.forEach((q, i) => {
      if (i === 4) return;
      const at = order.indexOf(i);
      dot(c, q[0], q[1], 5, at >= 0 && at <= k ? p.pink : p.paper, p);
    });
    rect(c, stairs[0] - 8, stairs[1] - 8, 16, 16, p.tan, p);
  },
  chat(c, t, p) {
    const k = t % 5;
    const bubbles = [
      { x: 14, y: 14, w: 130, side: 0, at: 0.2 },
      { x: 96, y: 52, w: 130, side: 1, at: 1.6 },
      { x: 14, y: 96, w: 110, side: 0, at: 3 },
    ];
    bubbles.forEach((b, i) => {
      if (k < b.at) return;
      const typing = k < b.at + 0.9 && b.side === 1;
      rect(c, b.x, b.y, b.w, 34, b.side ? p.cobalt : p.paper, p);
      if (typing)
        [0, 1, 2].forEach((j) =>
          dot(
            c,
            b.x + 20 + j * 14,
            b.y + 17 + Math.sin(t * 10 + j) * 3,
            3,
            p.lime,
            p,
          ),
        );
      else {
        c.fillStyle = b.side ? p.paper : p.ink;
        c.fillRect(b.x + 10, b.y + 10, b.w - 30 - i * 8, 5);
        c.fillRect(b.x + 10, b.y + 20, b.w * 0.45, 5);
        if (b.side) rect(c, b.x + b.w - 22, b.y + 18, 12, 8, p.lime, p);
      }
    });
  },
  heatmap(c, t, p) {
    const cols = 14,
      rows = 7,
      s = 15,
      ox = 15,
      oy = 18;
    const n = Math.floor(((t % 5) / 4) * cols * rows);
    const hr = rng(3);
    for (let i = 0; i < cols * rows; i++) {
      const x = Math.floor(i / rows),
        y = i % rows,
        v = hr(),
        on = i < n;
      c.globalAlpha = on ? 0.35 + v * 0.65 : 1;
      rect(
        c,
        ox + x * s,
        oy + y * s,
        s - 3,
        s - 3,
        on ? (v > 0.8 ? p.cobalt : p.lime) : p.paper,
        p,
        false,
      );
      c.globalAlpha = 1;
      c.lineWidth = 1;
      c.strokeStyle = p.ink;
      c.strokeRect(ox + x * s, oy + y * s, s - 3, s - 3);
    }
  },
  orbit(c, t, p) {
    const cx = 120,
      cy = 75;
    c.strokeStyle = p.ink;
    c.lineWidth = 1;
    const rings: [number, number, number][] = [
      [90, 26, 0.3],
      [70, 40, -0.6],
      [50, 50, 1.1],
    ];
    const fills = [p.cobalt, p.lime, p.pink];
    rings.forEach(([rx, ry, rot], i) => {
      c.globalAlpha = 0.35;
      c.beginPath();
      c.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
      c.stroke();
      c.globalAlpha = 1;
      const a = t * (1 + i * 0.5) + i * 2;
      const x = rx * Math.cos(a),
        y = ry * Math.sin(a);
      dot(
        c,
        cx + x * Math.cos(rot) - y * Math.sin(rot),
        cy + x * Math.sin(rot) + y * Math.cos(rot),
        6,
        fills[i],
        p,
      );
    });
    c.save();
    c.translate(cx, cy);
    c.rotate(t * 0.6);
    rect(c, -14, -14, 28, 28, p.tan, p);
    c.restore();
  },
  slots(c, t, p) {
    const hr = rng(9);
    for (let i = 0; i < 20; i++) {
      const x = 14 + (i % 10) * 22,
        y = i < 10 ? 18 : 92;
      const occupied = Math.sin(t * 1.3 + hr() * 9) > 0.1;
      c.strokeStyle = p.ink;
      c.lineWidth = 2;
      c.strokeRect(x, y, 18, 40);
      if (occupied) rect(c, x + 3, y + 6, 12, 26, i % 3 ? p.cobalt : p.tan, p);
    }
  },
  bars(c, t, p) {
    for (let i = 0; i < 12; i++) {
      const h = 20 + (Math.sin(t * 2 + i * 0.6) * 0.5 + 0.5) * (100 - i * 5);
      rect(c, 12 + i * 18, 136 - h, 12, h, i % 4 === 3 ? p.tan : p.lime, p);
    }
    c.strokeStyle = p.cobalt;
    c.lineWidth = 3;
    c.beginPath();
    for (let x = 0; x <= W; x += 6)
      c.lineTo(x, 26 + (x / W) * 90 + Math.sin(x / 15 + t * 3) * 4);
    c.stroke();
  },
  pulse(c, t, p) {
    for (let i = 0; i < 4; i++) {
      const k = (t * 0.6 + i / 4) % 1;
      c.globalAlpha = 1 - k;
      c.lineWidth = 3;
      c.strokeStyle = i % 2 ? p.cobalt : p.ink;
      c.beginPath();
      c.arc(120, 75, 8 + k * 80, 0, Math.PI * 2);
      c.stroke();
    }
    c.globalAlpha = 1;
    dot(c, 120, 75, 12, p.pink, p);
  },
  scan(c, t, p) {
    rect(c, 70, 10, 100, 130, p.paper, p);
    c.fillStyle = p.ink;
    for (let i = 0; i < 9; i++)
      c.fillRect(82, 26 + i * 12, 60 + ((i * 37) % 20), 4);
    const y = 14 + (Math.sin(t * 2) * 0.5 + 0.5) * 120;
    c.globalAlpha = 0.5;
    c.fillStyle = p.lime;
    c.fillRect(64, y - 6, 112, 12);
    c.globalAlpha = 1;
    c.strokeStyle = p.cobalt;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(60, y);
    c.lineTo(180, y);
    c.stroke();
  },
  shot(c, t, p) {
    rect(c, 70, 18, 100, 52, p.paper, p);
    c.strokeStyle = p.ink;
    c.lineWidth = 1;
    for (let i = 1; i < 6; i++) {
      c.beginPath();
      c.moveTo(70 + i * 16.6, 18);
      c.lineTo(70 + i * 16.6, 70);
      c.stroke();
    }
    const k = (t * 0.8) % 1.6;
    const f = Math.min(1, k / 0.9);
    const zone = Math.floor((t * 0.8) / 1.6) % 3;
    const tx = 87 + zone * 33.4;
    const x = 120 + (tx - 120) * f;
    const y = 132 - (132 - 44) * f - Math.sin(f * Math.PI) * 26;
    c.fillStyle = p.sky;
    c.globalAlpha = 0.5;
    c.fillRect(70 + zone * 33.4, 18, 33.4, 52);
    c.globalAlpha = 1;
    dot(c, x, y, 7 - f * 2, p.lime, p);
    rect(c, 108, 132, 24, 6, p.tan, p);
  },
};

function palette(): Pal {
  const s = getComputedStyle(
    document.querySelector(".portfolio-root") ?? document.documentElement,
  );
  const g = (n: string, fallback: string) =>
    s.getPropertyValue(n).trim() || fallback;
  return {
    ink: g("--mini-ink", "#17171d"),
    paper: g("--mini-paper", "#ffffff"),
    cobalt: g("--mini-cobalt", "#3155f5"),
    lime: g("--mini-lime", "#d9f542"),
    pink: g("--mini-pink", "#ff8fc0"),
    tan: g("--mini-tan", "#ff6538"),
    sky: g("--mini-sky", "#8edbff"),
  };
}

export default function MiniAnim({
  kind,
  label,
  className = "",
}: {
  kind: AnimKind;
  label: string;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const inView = useInView(ref, { margin: "80px" });
  const reduce = useReducedMotion();
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    // Backing store follows the displayed width, so large posters stay crisp.
    let scale = 0;
    const fit = () => {
      const next = Math.max(1, (cv.clientWidth || W) * dpr) / W;
      if (Math.abs(next - scale) < 0.01) return;
      scale = next;
      cv.width = Math.round(W * scale);
      cv.height = Math.round(H * scale);
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
    };
    fit();
    const draw = DRAW[kind];
    let pal = palette();
    const paint = (t: number) => {
      fit();
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      draw(ctx, t, pal);
      ctx.restore();
    };
    // Repaint with fresh colours when the mode (and its tokens) changes.
    const watcher = new MutationObserver(() => {
      pal = palette();
      if (!inView || reduce) paint(3.2);
    });
    watcher.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-mode"],
    });
    if (!inView || reduce) {
      paint(3.2);
      return () => watcher.disconnect();
    }
    let raf = 0;
    const start = performance.now();
    const frame = (now: number) => {
      if (!document.hidden) paint((now - start) / 1000);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      watcher.disconnect();
    };
  }, [kind, inView, reduce]);
  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={label}
      className={`mini-anim ${className}`}
    />
  );
}
