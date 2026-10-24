"use client";
import { useCallback, useEffect, useRef } from "react";
import { auraParts, type AuraPartId } from "./aura-data";
import type { LabelPoint } from "./three/aura-canvas";

/** Gap from the stage edge to a callout, and the height each callout reserves. */
const GUTTER = 10;
const ROW = 25;
const ELBOW = 18;
/** Below this stage width the callouts become numbered markers on the parts. */
const COMPACT = 520;
/** How far past the centre a part must move before its callout changes side. */
const SWITCH = 0.08;
/** Closest two numbered markers may sit on a narrow stage. */
const MARKER_GAP = 22;

type Nodes = {
  box: HTMLDivElement | null;
  label: Partial<Record<AuraPartId, HTMLElement | null>>;
  lead: Partial<Record<AuraPartId, SVGPathElement | null>>;
  dot: Partial<Record<AuraPartId, SVGCircleElement | null>>;
  focus: HTMLElement | null;
  focusLead: SVGPathElement | null;
};

/** Finds each part's callout, line and dot inside the overlay once. */
function collect(box: HTMLDivElement): Nodes {
  const nodes: Nodes = {
    box,
    label: {},
    lead: {},
    dot: {},
    focus: box.querySelector<HTMLElement>(".s3-focus"),
    focusLead: box.querySelector<SVGPathElement>(".s3-focus-lead"),
  };
  for (const { id } of auraParts) {
    nodes.label[id] = box.querySelector<HTMLElement>(`.s3-label[data-part="${id}"]`);
    nodes.lead[id] = box.querySelector<SVGPathElement>(`g[data-part="${id}"] path`);
    nodes.dot[id] = box.querySelector<SVGCircleElement>(`g[data-part="${id}"] circle`);
  }
  return nodes;
}

/**
 * Annotation layout for the AURA studio. On a wide stage every part gets a
 * callout in a column at the left or right edge, joined to the part by a thin
 * elbow line, so no text sits on the model itself. Callouts on one side are
 * spread so they never overlap, and they glide rather than jump as the studio
 * turns. On a narrow stage each part only shows its number, matching the
 * numbered buttons under the scene, and only the part in focus (hovered, or
 * else selected) gets a named callout.
 */
export function useCallouts(selected: AuraPartId, hovered: AuraPartId | null) {
  const focusRef = useRef({ selected, hovered });
  useEffect(() => {
    focusRef.current = { selected, hovered };
  }, [selected, hovered]);
  const nodes = useRef<Nodes>({
    box: null,
    label: {},
    lead: {},
    dot: {},
    focus: null,
    focusLead: null,
  });
  const state = useRef({
    compact: null as boolean | null,
    side: {} as Partial<Record<AuraPartId, number>>,
    x: {} as Partial<Record<AuraPartId, number>>,
    y: {} as Partial<Record<AuraPartId, number>>,
    width: {} as Partial<Record<AuraPartId, number>>,
    focusWidth: {} as Partial<Record<AuraPartId, number>>,
  });

  // Callout widths are measured once; web fonts arriving late change them.
  useEffect(() => {
    let live = true;
    document.fonts?.ready.then(() => {
      if (live) {
        state.current.width = {};
        state.current.focusWidth = {};
      }
    });
    return () => {
      live = false;
    };
  }, []);

  const place = useCallback((points: LabelPoint[], w: number, h: number, canvas: HTMLElement) => {
    // The overlay is the canvas's sibling inside the same stage.
    const box = canvas.closest(".s3-stage")?.querySelector<HTMLDivElement>(".s3-labels");
    if (!box) return;
    if (nodes.current.box !== box) nodes.current = collect(box);
    const n = nodes.current;
    const s = state.current;
    const compact = w < COMPACT;
    if (compact !== s.compact) {
      s.compact = compact;
      s.x = {};
      s.y = {};
      s.width = {};
      s.focusWidth = {};
      box.toggleAttribute("data-compact", compact);
    }
    const hide = (id: AuraPartId) => {
      const label = n.label[id];
      if (label) label.style.visibility = "hidden";
      n.lead[id]?.setAttribute("d", "");
      n.dot[id]?.setAttribute("r", "0");
    };

    if (compact) {
      const focus = focusRef.current.hovered ?? focusRef.current.selected;
      // Markers that would overlap one already placed are skipped; the part
      // in focus is placed first so its marker always shows.
      const placed: LabelPoint[] = [];
      const order = [...points].sort((a, b) => Number(b.id === focus) - Number(a.id === focus));
      for (const p of order) {
        const label = n.label[p.id];
        if (!label) continue;
        const clear =
          (!p.occluded || p.id === focus) &&
          placed.every((q) => Math.hypot(q.x - p.x, q.y - p.y) > MARKER_GAP);
        label.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) translate(-50%, -50%)`;
        label.style.visibility = p.visible && clear ? "visible" : "hidden";
        if (p.visible && clear) placed.push(p);
      }
      // One named callout for the part in focus, in the nearer edge column,
      // lifted above its marker so the line does not cover the model.
      const p = points.find((q) => q.id === focus);
      const el = n.focus;
      if (!el) return;
      if (!p?.visible) {
        el.style.visibility = "hidden";
        n.focusLead?.setAttribute("d", "");
        return;
      }
      // Only keep a measurement once the callout has laid out.
      const width = s.focusWidth[focus] || el.offsetWidth;
      if (width > 24) s.focusWidth[focus] = width;
      const left = p.x < w / 2;
      const x = left ? GUTTER : w - GUTTER - width;
      const y = Math.min(Math.max(p.y - 46, ROW / 2 + 4), h - ROW / 2 - 4);
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translateY(-50%)`;
      el.style.visibility = "visible";
      const end = left ? x + width + 3 : x - 3;
      const elbow = left ? end + 12 : end - 12;
      const tip = p.x + (left ? -11 : 11);
      n.focusLead?.setAttribute(
        "d",
        `M${tip.toFixed(1)} ${(p.y - 6).toFixed(1)}L${elbow.toFixed(1)} ${y.toFixed(1)}L${end.toFixed(1)} ${y.toFixed(1)}`,
      );
      return;
    }

    const columns: [LabelPoint[], LabelPoint[]] = [[], []];
    for (const p of points) {
      let side = s.side[p.id] ?? (p.x < w / 2 ? -1 : 1);
      if (side < 0 && p.x > w * (0.5 + SWITCH)) side = 1;
      if (side > 0 && p.x < w * (0.5 - SWITCH)) side = -1;
      s.side[p.id] = side;
      if (p.visible && n.label[p.id]) columns[side < 0 ? 0 : 1].push(p);
      else hide(p.id);
    }

    columns.forEach((column, c) => {
      const left = c === 0;
      column.sort((a, b) => a.y - b.y);
      // Keep each callout level with its part, pushed apart just enough.
      const ys = column.map((p) => p.y);
      const top = ROW / 2 + 4;
      const bottom = h - ROW / 2 - 4;
      for (let i = 0; i < ys.length; i++) ys[i] = Math.max(ys[i], i ? ys[i - 1] + ROW : top);
      for (let i = ys.length - 1; i >= 0; i--)
        ys[i] = Math.min(ys[i], i < ys.length - 1 ? ys[i + 1] - ROW : bottom);

      column.forEach((p, i) => {
        const label = n.label[p.id]!;
        const width = s.width[p.id] || label.offsetWidth;
        if (width > 24) s.width[p.id] = width;
        const goalX = left ? GUTTER : w - GUTTER - width;
        const x = s.x[p.id] === undefined ? goalX : s.x[p.id]! + (goalX - s.x[p.id]!) * 0.2;
        const y = s.y[p.id] === undefined ? ys[i] : s.y[p.id]! + (ys[i] - s.y[p.id]!) * 0.25;
        s.x[p.id] = x;
        s.y[p.id] = y;
        label.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translateY(-50%)`;
        label.style.visibility = "visible";
        // The line leaves the callout on the side facing the scene.
        const end = left ? x + width + 3 : x - 3;
        const elbow = left ? end + ELBOW : end - ELBOW;
        n.lead[p.id]?.setAttribute(
          "d",
          `M${p.x.toFixed(1)} ${p.y.toFixed(1)}L${elbow.toFixed(1)} ${y.toFixed(1)}L${end.toFixed(1)} ${y.toFixed(1)}`,
        );
        n.lead[p.id]?.parentElement?.toggleAttribute("data-occluded", p.occluded);
        const dot = n.dot[p.id];
        dot?.setAttribute("cx", p.x.toFixed(1));
        dot?.setAttribute("cy", p.y.toFixed(1));
        dot?.setAttribute("r", "2.5");
      });
    });
  }, []);

  return { place };
}

export function Callouts({
  selected,
  hovered,
}: {
  selected: AuraPartId;
  hovered: AuraPartId | null;
}) {
  const focus = hovered ?? selected;
  const focusIndex = auraParts.findIndex((p) => p.id === focus);
  const flags = (id: AuraPartId) => ({
    "data-active": selected === id || undefined,
    "data-hover": (hovered === id && selected !== id) || undefined,
  });
  return (
    <div className="s3-labels" aria-hidden="true">
      <svg className="s3-leads">
        {auraParts.map((p) => (
          <g key={p.id} data-part={p.id} {...flags(p.id)}>
            <path />
            <circle r={0} />
          </g>
        ))}
        <path className="s3-focus-lead" />
      </svg>
      {auraParts.map((p, i) => (
        <span key={p.id} className="s3-label" data-part={p.id} {...flags(p.id)}>
          <b>{i + 1}</b>
          <span>{p.label}</span>
        </span>
      ))}
      <span className="s3-label s3-focus" data-active={!hovered || hovered === selected || undefined}>
        <b>{focusIndex + 1}</b>
        <span>{auraParts[focusIndex].label}</span>
      </span>
    </div>
  );
}
