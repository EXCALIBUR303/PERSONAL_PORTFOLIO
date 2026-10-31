import { passProgress, type Region, type Tile } from "./state";

/**
 * Professional regions that the scanner cuts into tiles on the way to Creative.
 *
 * A region is a block of the Professional page that is given its own view-transition name, so its old
 * snapshot is a separate image on top of the page's. The page is revealed behind it as a scanner passes;
 * the region itself stays until its tiles are cut away one by one (a clip-path made of the tiles that are
 * left), and each tile that goes becomes a 3D fragment that flies on (components/scanner). Nothing is split
 * into letters: whole tiles of the block lift off.
 *
 * Names exist only on Professional elements, so they can never pair with an element of the Creative page and
 * morph into it.
 */
const REGIONS: [id: string, selector: string][] = [
  ["head", ".hx-copy h1"],
  ["lede", ".hx-lede"],
  ["actions", ".hx-actions"],
  ["facts", ".hx-facts"],
  ["visual", ".hx-visual"],
];
const MIN_W = 80;
const MIN_H = 24;
export const REGION_ATTR = "data-ws-region";
const vtName = (id: string) => `ws-pro-${id}`;

/** A fixed pseudo-random value from two integers, so a run's tiles are the same every time. */
const hash = (a: number, b: number) => {
  let t = Math.imul(a + 1, 0x9e3779b1) ^ Math.imul(b + 7, 0x85ebca6b);
  t = Math.imul(t ^ (t >>> 15), 0x2c1b3c6d);
  return ((t ^ (t >>> 12)) >>> 0) / 4294967296;
};

/** A region's tiles: a grid about `size` px across, each with the progress at which a scanner has cut it free. */
export function tilesOf(box: { x: number; y: number; w: number; h: number }, size: number, width: number): Tile[] {
  const cols = Math.max(1, Math.round(box.w / size));
  const rows = Math.max(1, Math.round(box.h / size));
  const tw = box.w / cols;
  const th = box.h / rows;
  const tiles: Tile[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const x = box.x + c * tw;
      const y = box.y + r * th;
      // A tile lets go just after the plane has crossed its centre, the nearer rows a little before the others. The lag
      // is short: the half the plane has already crossed is cut out of the snapshot at once (cutClip), so a long lag
      // would leave a half tile missing before its fragment lifts.
      const lag = 0.004 + hash(c, r) * 0.014 + r * 0.002;
      const h = hash(c * 3 + 1, r * 5 + 2);
      tiles.push({ x, y, w: tw, h: th, pass: passProgress(x + tw / 2, "to-creative", width) + lag, tone: h < 0.68 ? 0 : h < 0.9 ? 1 : 2 });
    }
  return tiles;
}

/**
 * Finds the regions on screen and plans their tiles, at most `limit` regions and about `budget` tiles in all.
 * Pure reading: it names nothing yet (see `nameRegions`).
 */
export function planRegions(limit: number, budget: number, width: number, height: number): Region[] {
  if (limit <= 0 || budget <= 0) return [];
  const found: { id: string; box: DOMRect }[] = [];
  for (const [id, selector] of REGIONS) {
    if (found.length >= limit) break;
    const el = document.querySelector<HTMLElement>(selector);
    if (!el) continue;
    const box = el.getBoundingClientRect();
    const onScreen = box.bottom > 0 && box.top < height && box.right > 0 && box.left < width;
    if (!onScreen || box.width < MIN_W || box.height < MIN_H) continue;
    found.push({ id, box });
  }
  // Only the part of a region that is on screen is cut.
  const boxes = found.map(({ id, box }) => {
    const x = Math.max(0, box.left);
    const y = Math.max(0, box.top);
    return { id, x, y, w: Math.min(width, box.right) - x, h: Math.min(height, box.bottom) - y, full: box };
  });
  // Tiles keep one size, so the fragments stay small next to the page; a region whose tiles would go over the
  // budget is left whole (the plane reveals it like the rest of the page) rather than cut into bigger pieces.
  const size = width < 640 ? 34 : 44;
  const regions: Region[] = [];
  let used = 0;
  for (const b of boxes) {
    const tiles = tilesOf(b, size, width);
    if (used + tiles.length > budget) continue;
    used += tiles.length;
    regions.push({ id: b.id, x: b.full.left, y: b.full.top, w: b.full.width, h: b.full.height, tiles });
  }
  return regions;
}

/** Gives each region's element its own view-transition name, just before the old page is captured. */
export function nameRegions(regions: Region[]) {
  for (const region of regions) {
    const el = document.querySelector<HTMLElement>(REGIONS.find(([id]) => id === region.id)![1]);
    if (!el) continue;
    el.style.setProperty("view-transition-name", vtName(region.id));
    el.setAttribute(REGION_ATTR, region.id);
  }
}

/** Removes every region name (they only exist for a run; the cuts are cleared with the scanner's variables). */
export function clearRegions() {
  for (const el of document.querySelectorAll<HTMLElement>(`[${REGION_ATTR}]`)) {
    el.style.removeProperty("view-transition-name");
    el.removeAttribute(REGION_ATTR);
    if (!el.getAttribute("style")) el.removeAttribute("style");
  }
}

/**
 * The clip of a region's old snapshot at `progress`: the tiles that have not been cut yet, as one path (so
 * neighbouring tiles leave no seam), in the snapshot's own pixels. "none" before the first tile goes and an
 * empty inset once all of them have.
 *
 * `slit` is the open space between the planes, in viewport pixels. The part of a tile the plane has already
 * crossed is cut out at once, so no Professional text is ever seen inside the opening over Creative; the rest
 * of the tile goes when its fragment lifts.
 */
export function cutClip(region: Region, progress: number, slit?: { l: number; r: number }): string {
  let left = 0;
  let whole = true;
  let d = "";
  const rect = (x0: number, x1: number, t: Tile) => {
    if (x1 - x0 < 0.5) return;
    d += `M${(x0 - region.x).toFixed(1)} ${(t.y - region.y).toFixed(1)}h${(x1 - x0).toFixed(1)}v${t.h.toFixed(1)}h${(x0 - x1).toFixed(1)}Z`;
  };
  for (const t of region.tiles) {
    if (progress >= t.pass) continue;
    left++;
    const x1 = t.x + t.w;
    if (!slit || slit.r - slit.l < 1 || x1 <= slit.l || t.x >= slit.r) {
      rect(t.x, x1, t);
      continue;
    }
    whole = false;
    rect(t.x, Math.min(x1, slit.l), t);
    rect(Math.max(t.x, slit.r), x1, t);
  }
  if (left === region.tiles.length && whole) return "none";
  if (left === 0 || !d) return "inset(100%)";
  return `path("${d}")`;
}
