import type { Box, Layout, Panel } from "./state";

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
  return { panels: chosen.map((c) => c.panel), avoid };
}
