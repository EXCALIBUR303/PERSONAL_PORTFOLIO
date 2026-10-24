"use client";
import { useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { createDrawable, createTimeline, stagger } from "animejs";
import {
  apertureRadius,
  clamp01,
  easeOut,
  subscribeProgress,
  subscribeTransition,
  slit,
  transition,
  type Direction,
} from "@/lib/transition/state";

/**
 * The drawn half of the scanner transition, in SVG. One structure leads: a
 * large aperture made of two half-rings, each carrying a scanner line along its
 * straight edge.
 *
 *   Going to Creative the aperture forms at the centre, its vertical diameter
 *   lights up and it splits: each half leads its scanner outward to the edge.
 *   Coming back the two halves enter from the edges, close in along the
 *   alignment axis and lock into one aperture at the centre, which then clears.
 *
 * Each scanner carries the outer half of the ring on its line, so the two
 * directions are one shape opening and closing.
 *
 * Supporting details stay small: a reticle that locks on to the switch, short
 * chevrons that show the direction, a readout, and, coming back, corner marks
 * as the layout settles.
 *
 * Anime.js owns every stroke and transform here, through two paused timelines
 * that GSAP seeks on each update (`cue` and `progress`), so a frame is fully
 * determined by those two numbers. The riders (each scanner with its half) are
 * placed by CSS variables GSAP paints (--sc-l, --sc-r), not by Anime.js.
 *
 * Timeline time is normalised: 1000 = the whole cue, or the whole transition,
 * so the phase table in lib/transition/state.ts reads directly as positions
 * (aim 0 to 200, scan 200 to 700, settle 700 to 1000).
 */
const NS = 1000;
type Palette = {
  plane: string;
  halo: string;
  segA: string;
  segB: string;
  third: string;
  major: string;
  core: string;
  ink: string;
};
const palette: Record<Direction, Palette> = {
  "to-creative": {
    plane: "#2f4bf5",
    halo: "#c8f13b",
    segA: "#2f4bf5",
    segB: "#ff6538",
    third: "#c8f13b",
    major: "#ff6538",
    core: "#ff6538",
    ink: "#17171d",
  },
  "to-pro": {
    plane: "#17171d",
    halo: "#8edbff",
    segA: "#2f4bf5",
    segB: "#17171d",
    third: "#8edbff",
    major: "#2f4bf5",
    core: "#2f4bf5",
    ink: "#17171d",
  },
};

/** Draw windows of the two coloured segments on each half, before and after the scan. */
type Window = [number, number];
const SEGMENTS: Record<"l" | "r", Record<"a" | "b", [Window, Window]>> = {
  // Both halves are drawn top to bottom; sliding the left half's windows
  // forward and the right half's back turns the whole ring the same way.
  l: { a: [[0.04, 0.4], [0.14, 0.5]], b: [[0.56, 0.92], [0.64, 1]] },
  r: { a: [[0.14, 0.5], [0.04, 0.4]], b: [[0.64, 1], [0.56, 0.92]] },
};
const span = ([a, b]: Window) => `${a} ${b}`;
const mid = ([a, b]: Window) => `${(a + b) / 2} ${(a + b) / 2}`;

const snapshot = () => (transition.running && transition.style === "scanner" ? transition.run : 0);

export default function ScannerFrame() {
  const run = useSyncExternalStore(subscribeTransition, snapshot, () => 0);
  if (!run) return null;
  return <Frame key={run} />;
}

function Frame() {
  const svg = useRef<SVGSVGElement>(null);
  const readout = useRef<SVGTextElement>(null);
  const leftX = useRef<SVGTextElement>(null);
  const rightX = useRef<SVGTextElement>(null);
  const beam = useRef<SVGGElement>(null);
  // Read once: a run keeps the geometry it started with.
  const { width: W, height: H, direction, ox, oy } = transition;
  const out = direction === "to-creative";
  const c = palette[direction];
  const cx = W / 2;
  const cy = H / 2;
  const small = Math.min(W, H) < 560;
  const R = apertureRadius(W, H);
  const TICKS = small ? 24 : 36;
  const seg = small ? 5 : 8;
  const halo = small ? 16 : 26;

  useLayoutEffect(() => {
    const root = svg.current;
    if (!root) return;
    const q = <T extends Element>(sel: string) => [...root.querySelectorAll<T>(sel)];
    const draw = (sel: string) => createDrawable(q<SVGGeometryElement>(sel));

    // The cue: the reticle closes on the switch and a line reaches for the centre.
    // composition "none": the two timelines share a few targets (the link and the
    // reticle) and must not cancel each other; the seek order below decides.
    const cue = createTimeline({ autoplay: false, defaults: { ease: "outCubic", composition: "none" } })
      .set(draw(".sc-reticle-arm, .sc-link"), { draw: "0 0" }, 0)
      .add(q(".sc-reticle"), { scale: [1.9, 1], rotate: [45, 0], opacity: [0, 1], duration: 700 }, 0)
      .add(draw(".sc-reticle-arm"), { draw: ["0 0", "0 1"], duration: 600 }, 0)
      .add(draw(".sc-link"), { draw: ["0 0", "0 0.35"], duration: 1000, ease: "linear" }, 0);

    const main = createTimeline({ autoplay: false, defaults: { ease: "inOutQuad", composition: "none" } })
      // Starting state of everything this timeline draws or reveals later.
      .set(draw(".sc-fine, .sc-halo-arc, .sc-tick, .sc-plane-core, .sc-lock, .sc-corner, .sc-stub"), { draw: "0 0" }, 0)
      .set(draw(".sc-seg-a, .sc-seg-b"), { draw: "0 0" }, 0)
      .set(q(".sc-label, .sc-iris, .sc-inner, .sc-dot, .sc-chev, .sc-plane-glow, .sc-hbeam"), { opacity: 0 }, 0)
      // The link finishes reaching the aperture, then the reticle and link let go.
      .add(draw(".sc-link"), { draw: ["0 0.35", "0 1"], duration: 120, ease: "outQuad" }, 0)
      .add(q(".sc-link, .sc-reticle"), { opacity: [1, 0], duration: 110 }, 130)
      .add(q(".sc-label"), { opacity: [0, 1], duration: 90 }, 60)
      // The halves draw in: fine ring, glow, ticks, then the coloured segments.
      .add(draw(".sc-fine"), { draw: ["0 0", "0 1"], duration: 140, ease: "inOutSine" }, 0)
      .add(draw(".sc-halo-arc"), { draw: ["0 0", "0 1"], duration: 160, ease: "inOutSine" }, 20)
      .add(draw(".sc-tick"), { draw: ["0 0", "0 1"], duration: 60, delay: stagger(1.6) }, 30);
    for (const half of ["l", "r"] as const)
      for (const name of ["a", "b"] as const) {
        const [from, to] = SEGMENTS[half][name];
        const target = draw(`.sc-half[data-half="${half}"] .sc-seg-${name}`);
        main
          .add(target, { draw: [mid(from), span(from)], duration: 150, ease: "outCubic" }, 40)
          // During the scan the ring keeps turning as its halves travel.
          .add(target, { draw: [span(from), span(to)], duration: 500, ease: "linear" }, 200);
      }

    if (out) {
      main
        // Aim: the core and iris form, and chevrons show which way it will open.
        .add(q(".sc-dot"), { opacity: [0, 1], scale: [0, 1], duration: 70, ease: "outBack(2)" }, 10)
        .add(draw(".sc-stub"), { draw: ["0 0", "0 1"], duration: 80 }, 20)
        .add(q(".sc-inner"), { opacity: [0, 1], rotate: [-40, 0], scale: [0.8, 1], duration: 160 }, 10)
        .add(q(".sc-iris"), { opacity: [0, 1], rotate: [-140, 0], scale: [0.6, 1], duration: 180, ease: "outCubic" }, 0)
        .add(q(".sc-chev"), { opacity: [0, 1], duration: 60 }, 110)
        .add(q(".sc-rider-l .sc-chev"), { translateX: [0, -12, 0], duration: 90 }, 120)
        .add(q(".sc-rider-r .sc-chev"), { translateX: [0, 12, 0], duration: 90 }, 120)
        // Fire: the vertical diameter lights up and becomes the two scanners;
        // the core lets go and the halves start to part.
        .add(draw(".sc-plane-core"), { draw: ["0.5 0.5", "0 1"], duration: 70, ease: "outQuad" }, 180)
        .add(q(".sc-plane-glow"), { opacity: [0, 1], duration: 60 }, 190)
        .add(q(".sc-dot"), { scale: [1, 2.4], opacity: [1, 0], duration: 90, ease: "outQuad" }, 195)
        .add(q(".sc-stub"), { opacity: [1, 0], duration: 60 }, 200)
        .add(q(".sc-iris"), { rotate: [0, 150], scale: [1, 1.8], opacity: [1, 0], duration: 160, ease: "inQuad" }, 200)
        .add(q(".sc-inner"), { rotate: [0, 80], scale: [1, 1.5], opacity: [1, 0], duration: 140, ease: "inQuad" }, 205)
        .add(q(".sc-label"), { opacity: [1, 0], duration: 80 }, 280)
        .add(q(".sc-chev"), { opacity: [1, 0], duration: 80 }, 420)
        // Settle: the halves have left the screen.
        .add(q(".sc-half, .sc-plane"), { opacity: [1, 0], duration: 60 }, 700);
    } else {
      main
        // Aim: the scanner lines draw down at the edges, a faint target marks
        // where the halves will lock, and the alignment axis reaches out from it.
        .add(draw(".sc-plane-core"), { draw: ["0 0", "0 1"], duration: 140, ease: "outQuad" }, 30)
        .add(q(".sc-plane-glow"), { opacity: [0, 1], duration: 80 }, 100)
        .add(q(".sc-inner"), { opacity: [0, 0.45], rotate: [-30, 0], duration: 160 }, 20)
        .add(q(".sc-dot"), { opacity: [0, 0.6], scale: [0, 1], duration: 80 }, 60)
        .add(draw(".sc-stub"), { draw: ["0 0", "0 1"], duration: 80 }, 80)
        .add(q(".sc-hbeam"), { opacity: [0, 1], duration: 60 }, 80)
        .add(q(".sc-chev"), { opacity: [0, 1], duration: 60 }, 120)
        // Scan: the halves close in (CSS) while the target turns slowly.
        .add(q(".sc-inner"), { rotate: [0, 90], duration: 500, ease: "linear" }, 200)
        .add(q(".sc-chev"), { opacity: [1, 0], duration: 80 }, 560)
        // Settle: the scanners meet, the halves close and the aperture locks, then the layout's
        // corners are marked and everything clears.
        .add(q(".sc-plane, .sc-hbeam"), { opacity: [1, 0], duration: 50 }, 690)
        .add(draw(".sc-lock"), { draw: ["0 0", "0 1"], duration: 70, ease: "outQuad" }, 700)
        .add(q(".sc-iris"), { opacity: [0, 1], scale: [1.5, 1], rotate: [-120, 0], duration: 100, ease: "outBack(2)" }, 700)
        .add(q(".sc-inner"), { opacity: [0.45, 1], duration: 60 }, 700)
        .add(q(".sc-dot"), { opacity: [0.6, 1], scale: [1, 1.8, 1], duration: 110 }, 705)
        .add(draw(".sc-corner"), { draw: ["0 0", "0 1"], duration: 90, delay: stagger(12) }, 740)
        .add(q(".sc-label"), { opacity: [1, 0], duration: 80 }, 820)
        .add(q(".sc-half, .sc-core"), { scale: [1, 0.86], opacity: [1, 0], duration: 120, ease: "inQuad" }, 860)
        .add(q(".sc-corner"), { opacity: [1, 0], duration: 80 }, 900);
    }

    const pct = (v: number) => String(Math.round(v * 100)).padStart(3, "0");
    const coord = (v: number) => String(Math.round(Math.min(Math.max(v, 0), W))).padStart(4, "0");
    const beamLines = beam.current ? [...beam.current.querySelectorAll("line")] : [];
    const seek = () => {
      // Whichever timeline is current is applied last, so it wins on shared targets.
      if (transition.started) {
        cue.seek(transition.cue * NS);
        main.seek(transition.progress * NS);
      } else {
        main.seek(transition.progress * NS);
        cue.seek(transition.cue * NS);
      }
      const { l, r } = slit();
      if (readout.current) readout.current.textContent = `SCAN ${pct(transition.progress)}%`;
      // The coordinates only show once the two lines are apart enough to read them.
      const apart = r - l > 170;
      if (leftX.current) leftX.current.textContent = apart ? `x ${coord(l)}` : "";
      if (rightX.current) rightX.current.textContent = apart ? `x ${coord(r)}` : "";
      // Coming back, the alignment axis reaches out from the centre and then
      // spans the closing slit.
      if (!out && beamLines.length) {
        const k = easeOut(clamp01((transition.progress - 0.08) / 0.12));
        const x1 = (cx - (cx - l) * k).toFixed(1);
        const x2 = (cx + (r - cx) * k).toFixed(1);
        beamLines.forEach((line) => {
          line.setAttribute("x1", x1);
          line.setAttribute("x2", x2);
        });
      }
    };
    seek();
    root.dataset.armed = "true";
    const off = subscribeProgress(seek);
    return () => {
      off();
      cue.revert();
      main.revert();
    };
  }, [out, W, cx]);

  /** A half of the aperture's ring, drawn top to bottom, centred on its rider's line. */
  const halfArc = (r: number, side: "l" | "r") =>
    `M 0 ${cy - r} A ${r} ${r} 0 0 ${side === "l" ? 0 : 1} 0 ${cy + r}`;
  const arc = (r: number, from: number, sweep: number) => {
    const a = (from * Math.PI) / 180;
    const b = ((from + sweep) * Math.PI) / 180;
    return `M ${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(b)} ${cy + r * Math.sin(b)}`;
  };
  const labelY = cy + R + 44 < H - 20 ? cy + R + 44 : cy - R - 34;

  return (
    <svg ref={svg} className="sc-frame-svg" viewBox={`0 0 ${W} ${H}`} width={W} height={H} data-dir={direction}>
      <defs>
        {(["l", "r"] as const).map((side) => (
          <linearGradient key={side} id={`sc-glow-${side}`} x1={side === "l" ? "1" : "0"} x2={side === "l" ? "0" : "1"} y1="0" y2="0">
            <stop offset="0" stopColor={c.halo} stopOpacity="0.4" />
            <stop offset="1" stopColor={c.halo} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>

      {/* the link from the switch to the centre */}
      <path className="sc-link" d={`M ${ox} ${oy} L ${cx} ${cy}`} stroke={out ? c.major : c.core} strokeWidth={1.5} />

      {/* reticle locking on to the switch */}
      <g className="sc-reticle sc-spin">
        <circle cx={ox} cy={oy} r={30} fill="none" stroke="none" />
        {[
          [-1, -1],
          [1, -1],
          [-1, 1],
          [1, 1],
        ].map(([sx, sy], i) => (
          <path
            key={i}
            className="sc-reticle-arm"
            d={`M ${ox + sx * 26} ${oy + sy * 12} L ${ox + sx * 26} ${oy + sy * 26} L ${ox + sx * 12} ${oy + sy * 26}`}
            stroke={out ? c.major : c.core}
            strokeWidth={3}
          />
        ))}
      </g>

      {/* coming back: the alignment axis between the closing scanners */}
      {!out && (
        <g ref={beam} className="sc-hbeam">
          <line x1={cx} y1={cy} x2={cx} y2={cy} stroke={c.halo} strokeWidth={small ? 6 : 9} strokeOpacity={0.45} />
          <line x1={cx} y1={cy} x2={cx} y2={cy} stroke={c.segA} strokeWidth={1.5} strokeDasharray="10 6" />
        </g>
      )}

      {/* the centre of the aperture: target, iris and core */}
      <g className="sc-core sc-spin">
        <circle cx={cx} cy={cy} r={R + 30} fill="none" stroke="none" />
        <circle className="sc-lock" cx={cx} cy={cy} r={R} stroke={c.core} strokeWidth={small ? 2.5 : 3.5} />
        <g className="sc-inner sc-spin">
          <circle cx={cx} cy={cy} r={R * 0.64} stroke={c.ink} strokeDasharray="3 9" strokeWidth={1.5} />
        </g>
        <g className="sc-iris sc-spin">
          <circle cx={cx} cy={cy} r={R * 0.42 + 6} fill="none" stroke="none" />
          {[c.segA, c.segB, c.third].map((colour, i) => (
            <path key={i} d={arc(R * 0.42, i * 120 - 90, 70)} stroke={colour} strokeWidth={small ? 3.5 : 5} />
          ))}
        </g>
        {[0, 90, 180, 270].map((deg) => {
          const a = (deg * Math.PI) / 180;
          return (
            <path
              key={deg}
              className="sc-stub"
              d={`M ${cx + 20 * Math.cos(a)} ${cy + 20 * Math.sin(a)} L ${cx + 36 * Math.cos(a)} ${cy + 36 * Math.sin(a)}`}
              stroke={c.ink}
              strokeWidth={1.5}
            />
          );
        })}
        <g className="sc-dot sc-spin">
          <circle cx={cx} cy={cy} r={13} stroke={c.core} strokeWidth={1.5} />
          <circle cx={cx} cy={cy} r={5} fill={c.core} stroke="none" />
        </g>
      </g>

      {/* the two riders: a scanner line carrying a half of the aperture, placed by --sc-l and --sc-r */}
      {(["l", "r"] as const).map((rider) => {
        // Which way this scanner travels, and the lit side behind it. Each
        // scanner carries the outer half of the ring: going out the halves lead
        // their scanners to the edges; coming back they follow them in, and
        // close into one ring where the scanners meet.
        const travel = (rider === "l") === out ? -1 : 1;
        const behind = -travel;
        const reach = (out ? R : 0) + 34;
        return (
          <g key={rider} className={`sc-rider sc-rider-${rider}`}>
            <g className="sc-plane">
              <g className="sc-plane-glow">
                <rect x={behind > 0 ? 0 : -72} y={0} width={72} height={H} fill={`url(#sc-glow-${behind > 0 ? "r" : "l"})`} />
                <path d={`M 0 0 L 0 ${H}`} stroke={c.halo} strokeWidth={small ? 8 : 12} strokeOpacity={0.5} />
                {[cy - R, cy + R].map((y) => (
                  <path key={y} d={`M ${travel * 11} ${y} L ${-travel * 5} ${y - 8} L ${-travel * 5} ${y + 8} Z`} fill={c.major} stroke="none" />
                ))}
                <text
                  ref={rider === "l" ? leftX : rightX}
                  x={behind * 10}
                  y={28}
                  textAnchor={behind > 0 ? "start" : "end"}
                  fill={c.ink}
                >
                  x 0000
                </text>
              </g>
              <path className="sc-plane-core" d={`M 0 0 L 0 ${H}`} stroke={c.plane} strokeWidth={small ? 2 : 2.5} />
            </g>
            <g className="sc-half sc-spin" data-half={rider}>
              <circle cx={0} cy={cy} r={R + 30} fill="none" stroke="none" />
              <path className="sc-halo-arc" d={halfArc(R, rider)} stroke={c.halo} strokeWidth={halo} strokeOpacity={0.42} />
              <path className="sc-fine" d={halfArc(R, rider)} stroke={c.ink} strokeWidth={1.25} />
              {Array.from({ length: TICKS }, (_, i) => {
                const a = (rider === "l" ? Math.PI / 2 : -Math.PI / 2) + (Math.PI * (i + 0.5)) / TICKS;
                const major = i % 6 === 2;
                const r0 = R + 8;
                const r1 = R + (major ? 22 : 14);
                return (
                  <line
                    key={i}
                    className="sc-tick"
                    x1={r0 * Math.cos(a)}
                    y1={cy + r0 * Math.sin(a)}
                    x2={r1 * Math.cos(a)}
                    y2={cy + r1 * Math.sin(a)}
                    stroke={major ? c.major : c.ink}
                    strokeWidth={major ? 2 : 1.2}
                  />
                );
              })}
              <path className="sc-seg-a" d={halfArc(R - 2, rider)} stroke={c.segA} strokeWidth={seg} />
              <path className="sc-seg-b" d={halfArc(R - 2, rider)} stroke={c.segB} strokeWidth={seg} />
            </g>
            {/* chevrons ahead of the scanner (and its half, going out), pointing the way it travels */}
            <g className="sc-chev">
              {[0, 12].map((step) => {
                const x = travel * (reach + step);
                return (
                  <path
                    key={step}
                    d={`M ${x - travel * 7} ${cy - 9} L ${x} ${cy} L ${x - travel * 7} ${cy + 9}`}
                    stroke={c.major}
                    strokeWidth={2.5}
                  />
                );
              })}
            </g>
          </g>
        );
      })}

      {/* coming back: the corners of the settled layout */}
      {!out &&
        [
          [18, 18, 1, 1],
          [W - 18, 18, -1, 1],
          [18, H - 18, 1, -1],
          [W - 18, H - 18, -1, -1],
        ].map(([x, y, dx, dy], i) => {
          const size = small ? 22 : 34;
          return <path key={i} className="sc-corner" d={`M ${x} ${y + dy * size} L ${x} ${y} L ${x + dx * size} ${y}`} stroke={c.ink} strokeWidth={2} />;
        })}

      <g className="sc-label">
        <text x={cx} y={labelY} textAnchor="middle" fill={c.ink}>
          {out ? "PROFESSIONAL → CREATIVE" : "CREATIVE → PROFESSIONAL"}
        </text>
        <text ref={readout} x={cx} y={labelY + 17} textAnchor="middle" fill={out ? c.segA : c.core}>
          SCAN 000%
        </text>
      </g>
    </svg>
  );
}
