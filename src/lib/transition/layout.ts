import { worldOutline } from "@/components/creative/world/outline";
import type { Box, Layout, Panel, Row, WorldFootprint } from "./state";

/**
 * Reads a page's structure for the scanner's particles: the bordered blocks on
 * screen (panels, cards, the Creative islands and notes) and the text and
 * controls particles should keep clear of. Particles lift off the blocks of the
 * page being left and assemble on the blocks of the page arriving, so they draw
 * the real layout rather than shapes laid over it.
 *
 * Runs twice per transition: at the click, and inside the transition once the
 * new page has rendered. It only reads the DOM.
 */
const MIN_W = 120;
const MIN_H = 40;
const MIN_AREA = 20_000;
const MAX_PANELS = 8;
/** Text and controls particles keep clear of, so nothing sits over words. */
const AVOID =
  "main :is(h1, h2, h3, h4, p, li, dt, dd, figcaption, blockquote, label, button, input, select, textarea, a, img)";

/** A strong version of a block's fill (peach becomes orange), or null for paper, white or ink. */
function vivid(css: string): string | null {
  const match = css.match(/rgba?\(([^)]+)\)/);
  if (!match) return null;
  const [r, g, b, a = 1] = match[1]
    .split(/[\s,/]+/)
    .filter(Boolean)
    .map(Number);
  if (a < 0.5) return null;
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const d = max - min;
  const l = (max + min) / 2;
  if (d < 0.04) return null;
  const s = d / (1 - Math.abs(2 * l - 1));
  if (s < 0.25) return null;
  let h = max === R ? ((G - B) / d) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  return `hsl(${h}, 85%, 56%)`;
}

const bordered = (style: CSSStyleDeclaration) =>
  (
    [
      [style.borderTopWidth, style.borderTopStyle],
      [style.borderRightWidth, style.borderRightStyle],
      [style.borderBottomWidth, style.borderBottomStyle],
      [style.borderLeftWidth, style.borderLeftStyle],
    ] as const
  ).filter(([width, kind]) => parseFloat(width) >= 1 && kind !== "none" && kind !== "hidden").length >= 3;

const overlap = (a: Box, b: Box) => {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  if (w <= 0 || h <= 0) return 0;
  const inter = w * h;
  return inter / (a.w * a.h + b.w * b.h - inter);
};

/**
 * Reads the page's structure. It only decorates a transition, so a page it
 * cannot read gives an empty layout (the particles then use the surface
 * pattern alone) rather than an error that would stop the mode switch.
 */
export function measureLayout(): Layout {
  try {
    return read();
  } catch {
    return { panels: [], avoid: [] };
  }
}

function read(): Layout {
  const W = innerWidth;
  const H = innerHeight;
  const onScreen = (box: DOMRect) => box.bottom > 0 && box.top < H && box.right > 0 && box.left < W;

  type Found = { panel: Panel; box: Box; area: number };
  const found: Found[] = [];
  for (const el of document.querySelectorAll<HTMLElement>("main *")) {
    const box = el.getBoundingClientRect();
    if (box.width < MIN_W || box.height < MIN_H || box.width * box.height < MIN_AREA) continue;
    if (!onScreen(box) || (box.width > W * 0.96 && box.height > H * 0.9)) continue;
    // Controls are not structure, however large.
    if (el.closest("a, button, [role='button'], label, input, select, textarea")) continue;
    const style = getComputedStyle(el);
    if (!bordered(style) || style.visibility === "hidden" || style.opacity === "0") continue;
    // The layout box, without a transform that is only on its way in (the
    // arriving interface starts slightly lowered and scaled): its centre less
    // the translation, its untransformed size, and any turn it keeps.
    let rot = 0;
    let tx = 0;
    let ty = 0;
    if (style.transform && style.transform !== "none") {
      const m = new DOMMatrixReadOnly(style.transform);
      rot = Math.atan2(m.b, m.a);
      tx = m.e;
      ty = m.f;
    }
    const w = el.offsetWidth || box.width;
    const h = el.offsetHeight || box.height;
    const panel: Panel = {
      cx: box.left + box.width / 2 - tx,
      cy: box.top + box.height / 2 - ty,
      w,
      h,
      rot: Math.abs(rot) < 0.002 ? 0 : rot,
      r: Math.min(parseFloat(style.borderTopLeftRadius) || 0, 26, Math.min(w, h) / 2),
      colour: vivid(style.backgroundColor),
    };
    found.push({ panel, box: { x: panel.cx - w / 2, y: panel.cy - h / 2, w, h }, area: w * h });
  }
  // The largest blocks first; a wrapper that is nearly the same box as one
  // already chosen adds nothing.
  found.sort((a, b) => b.area - a.area);
  const chosen: Found[] = [];
  for (const item of found) {
    if (chosen.length >= MAX_PANELS) break;
    if (chosen.some((c) => overlap(c.box, item.box) > 0.8)) continue;
    chosen.push(item);
  }

  const avoid: Box[] = [];
  const pad = 8;
  const add = (box: DOMRect) => {
    if (box.width > 0 && box.height > 0 && onScreen(box))
      avoid.push({ x: box.left - pad, y: box.top - pad, w: box.width + pad * 2, h: box.height + pad * 2 });
  };
  document.querySelectorAll(AVOID).forEach((el) => add(el.getBoundingClientRect()));
  document.querySelectorAll(".site-header, .c-header").forEach((el) => add(el.getBoundingClientRect()));
  return { panels: chosen.map((c) => c.panel), avoid, world: readWorld(), rows: readRows() };
}

/**
 * The studio map's islands and stations on screen, if the page has one. The
 * world itself is drawn later (its canvas never mounts during a run), so this
 * is computed from the world's own layout with the camera's opening pose, the
 * same projection the map's station buttons use.
 */
function readWorld(): WorldFootprint | undefined {
  const stage = document.querySelector<HTMLElement>(".w-stage");
  if (!stage) return undefined;
  const box = stage.getBoundingClientRect();
  if (box.width < 200 || box.height < 160) return undefined;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const world = worldOutline(box.width, box.height, !reduced);
  const shift = (x: number, y: number): [number, number] => [x + box.left, y + box.top];
  return {
    islands: world.islands.map((island) => ({ id: island.id, points: island.points.map(([x, y]) => shift(x, y)) })),
    feet: world.feet.filter((f) => f.visible).map((f) => ({ slug: f.slug, x: f.x + box.left, y: f.y + box.top })),
  };
}

/** Blocks of Professional text whose lines become rows of fragments, in reading order. */
const ROW_BLOCKS = ".hx-pro :is(h1, .hx-lede, .hx-proof, .hx-facts dd, .hx-actions a), main > :is(section, div) > :is(h1, h2)";
/** At most this many lines are used, so a long page does not turn into a wall of marks. */
const MAX_ROWS = 18;

/**
 * The baselines of the Professional text on screen: for each line of each block, where it starts, how long it
 * is and the y it sits on (found with a Range over the text, so wrapped lines are separate rows). Fragments
 * coming back from Creative line up on these, and the real text takes their place as a scanner passes.
 */
function readRows(): Row[] | undefined {
  const W = innerWidth;
  const H = innerHeight;
  const rows: Row[] = [];
  const blocks = document.querySelectorAll<HTMLElement>(ROW_BLOCKS);
  if (!blocks.length) return undefined;
  const range = document.createRange();
  for (const block of blocks) {
    if (rows.length >= MAX_ROWS) break;
    const outer = block.getBoundingClientRect();
    if (outer.bottom < 0 || outer.top > H || outer.width < 24) continue;
    const tone = block.matches("h1, h2, .hx-actions a") ? "cobalt" : "ink";
    const lines: { x: number; r: number; top: number; bottom: number }[] = [];
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.textContent?.trim()) continue;
      range.selectNodeContents(node);
      for (const r of range.getClientRects()) {
        if (r.width < 6 || r.height < 6) continue;
        // Pieces on the same line (an emphasised phrase, for example) join into one row.
        const line = lines.find((l) => Math.abs(l.bottom - r.bottom) < r.height * 0.4);
        if (line) {
          line.x = Math.min(line.x, r.left);
          line.r = Math.max(line.r, r.right);
        } else lines.push({ x: r.left, r: r.right, top: r.top, bottom: r.bottom });
      }
    }
    for (const l of lines.sort((a, b) => a.bottom - b.bottom)) {
      const y = l.bottom - (l.bottom - l.top) * 0.2;
      const x = Math.max(8, l.x);
      const w = Math.min(W - 8, l.r) - x;
      if (y > 8 && y < H - 8 && w >= 24) rows.push({ x, y, w, tone });
    }
  }
  range.detach?.();
  return rows.length ? rows.slice(0, MAX_ROWS) : undefined;
}

/**
 * Where the scanner locks on when leaving Creative: the selected station's foot if it is on screen, otherwise
 * the middle of the map, otherwise the middle of the screen.
 */
export function findAnchor(layout: Layout): { x: number; y: number } {
  const W = innerWidth;
  const H = innerHeight;
  const selected = document.querySelector<HTMLElement>('.w-pin[aria-pressed="true"]')?.dataset.station;
  const onScreen = (x: number, y: number) => x > 0 && x < W && y > 0 && y < H;
  // The station's marker as drawn now: selecting a station moves the camera, so the footprint (computed with the
  // map's opening pose) no longer says where it is on screen.
  const dot = selected ? document.querySelector<HTMLElement>(`.w-slot[data-slot="${CSS.escape(selected)}"] .w-dot`)?.getBoundingClientRect() : undefined;
  if (dot && dot.width > 0 && onScreen(dot.left + dot.width / 2, dot.top + dot.height / 2)) return { x: dot.left + dot.width / 2, y: dot.top + dot.height / 2 };
  const foot = selected ? layout.world?.feet.find((f) => f.slug === selected) : undefined;
  if (foot && onScreen(foot.x, foot.y)) return { x: foot.x, y: foot.y };
  const stage = document.querySelector<HTMLElement>(".w-stage")?.getBoundingClientRect();
  if (stage && stage.width > 200 && stage.bottom > 0 && stage.top < H) {
    const x = stage.left + stage.width / 2;
    const y = Math.max(stage.top, 0) + (Math.min(stage.bottom, H) - Math.max(stage.top, 0)) / 2;
    return { x, y };
  }
  return { x: W / 2, y: H / 2 };
}
