"use client";
import { useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { createDrawable, createTimeline, stagger } from "animejs";
import {
  subscribeProgress,
  subscribeTransition,
  slit,
  transition,
  type Direction,
} from "@/lib/transition/state";

/**
 * The drawn half of the scanner transition, in SVG: a reticle that locks on to
 * the switch, the central aperture, the alignment frame and crosshair, and the
 * two scanner lines. Anime.js owns every stroke and transform here, through two
 * paused timelines that GSAP seeks on each update (`cue` and `progress`), so a
 * frame is fully determined by those two numbers. The scanner lines are placed
 * by CSS variables GSAP paints (--sc-l, --sc-r), not by Anime.js.
 *
 * Timeline time is normalised: 1000 = the whole cue, or the whole transition,
 * so the phase table in lib/transition/state.ts reads directly as positions
 * (aim 0 to 200, scan 200 to 740, settle 740 to 1000).
 */
const NS = 1000;
const palette: Record<Direction, { line: string; accent: string; third: string; glow: string; text: string }> = {
  "to-creative": { line: "#2f4bf5", accent: "#ff6538", third: "#c8f13b", glow: "#c8f13b", text: "#17171d" },
  "to-pro": { line: "#17171d", accent: "#2f4bf5", third: "#17171d", glow: "#8edbff", text: "#17171d" },
};

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
  // Read once: a run keeps the geometry it started with.
  const { width: W, height: H, direction, ox, oy } = transition;
  const out = direction === "to-creative";
  const c = palette[direction];
  const cx = W / 2;
  const cy = H / 2;
  const small = Math.min(W, H) < 560;
  const R = Math.round(Math.min(186, Math.max(84, Math.min(W, H) * 0.2)));
  const TICKS = small ? 48 : 72;
  const corner = small ? 36 : 64;
  const inset = small ? 12 : 22;

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
      .set(draw(".sc-dial, .sc-tick, .sc-cross, .sc-corner, .sc-frame"), { draw: "0 0" }, 0)
      .set(draw(".sc-beam-line"), { draw: out ? "0.5 0.5" : "0 0" }, 0)
      .set(q(".sc-label, .sc-iris, .sc-inner, .sc-centre"), { opacity: 0 }, 0)
      .add(q(".sc-centre"), { opacity: [0, 1], duration: 80 }, 40)
      // The link finishes reaching the aperture, then the reticle and link let go.
      .add(draw(".sc-link"), { draw: ["0 0.35", "0 1"], duration: 140, ease: "outQuad" }, 0)
      .add(q(".sc-link, .sc-reticle"), { opacity: [1, 0], duration: 120 }, 150)
      .add(draw(".sc-dial"), { draw: ["0 0", "0 1"], duration: 170, ease: "inOutSine" }, out ? 10 : 40)
      .add(draw(".sc-tick"), { draw: ["0 0", "0 1"], duration: 70, delay: stagger(1.4) }, out ? 30 : 60)
      .add(q(".sc-label"), { opacity: [0, 1], duration: 90 }, 70);

    if (out) {
      main
        // Aim: the aperture assembles and alignment lines draw in toward it.
        .add(q(".sc-iris"), { rotate: [-140, 0], scale: [0.55, 1], opacity: [0, 1], duration: 200, ease: "outCubic" }, 0)
        .add(q(".sc-inner"), { rotate: [0, 60], opacity: [0, 1], duration: 200 }, 0)
        .add(draw(".sc-cross"), { draw: ["0 0", "0 1"], duration: 170, ease: "outQuad" }, 0)
        .add(draw(".sc-corner"), { draw: ["0 0", "0 1"], duration: 150, delay: stagger(20) }, 20)
        .add(draw(".sc-frame"), { draw: ["0 0", "0 1"], duration: 180 }, 20)
        // Scan: the aperture opens; its vertical diameter becomes the two scanners.
        .add(draw(".sc-beam-line"), { draw: ["0.5 0.5", "0 1"], duration: 70, ease: "outQuad" }, 200)
        .add(q(".sc-iris"), { rotate: [0, 170], scale: [1, 1.9], opacity: [1, 0], duration: 300, ease: "inQuad" }, 200)
        .add(q(".sc-inner"), { rotate: [60, 200], scale: [1, 2.1], opacity: [1, 0], duration: 320, ease: "inQuad" }, 210)
        .add(q(".sc-rings"), { scale: [1, 2.9], opacity: [1, 0], duration: 430, ease: "inQuad" }, 220)
        .add(q(".sc-cross"), { opacity: [1, 0], duration: 280 }, 250)
        .add(q(".sc-label"), { opacity: [1, 0], duration: 140 }, 560)
        .add(q(".sc-corner, .sc-frame"), { opacity: [1, 0], duration: 200 }, 600);
    } else {
      main
        // Aim: the aperture contracts out of a wide loose ring; scanners draw in at the edges.
        .add(q(".sc-aperture"), { scale: [2.4, 1], rotate: [-70, 0], opacity: [0, 1], duration: 200, ease: "outCubic" }, 0)
        .add(q(".sc-iris"), { rotate: [-200, 0], opacity: [0, 1], duration: 200, ease: "outCubic" }, 0)
        .add(q(".sc-inner"), { rotate: [0, -40], opacity: [0, 1], duration: 200 }, 0)
        .add(draw(".sc-beam-line"), { draw: ["0 0", "0 1"], duration: 150, ease: "outQuad" }, 40)
        // Scan: the crosshair is laid down behind the scanners as they close in.
        .add(draw(".sc-cross"), { draw: ["0 0", "0 1"], duration: 540, ease: "inOutQuad" }, 200)
        .add(q(".sc-iris"), { rotate: [0, 240], duration: 540, ease: "linear" }, 200)
        .add(q(".sc-inner"), { rotate: [-40, -160], duration: 540, ease: "linear" }, 200)
        // Settle: the scanners meet, the aperture locks, the frame snaps in, then all clears.
        .add(q(".sc-iris"), { rotate: [240, 360], duration: 90, ease: "outBack(2)" }, 740)
        .add(q(".sc-rings"), { scale: [1, 0.9, 1], duration: 120, ease: "outQuad" }, 740)
        .add(draw(".sc-corner"), { draw: ["0 0", "0 1"], duration: 110, delay: stagger(15) }, 760)
        .add(draw(".sc-frame"), { draw: ["0 0", "0 1"], duration: 120 }, 760)
        .add(q(".sc-aperture"), { scale: [1, 0.7], opacity: [1, 0], duration: 120, ease: "inQuad" }, 880)
        .add(q(".sc-cross, .sc-corner, .sc-frame, .sc-label"), { opacity: [1, 0], duration: 110 }, 890);
    }

    const pct = (v: number) => String(Math.round(v * 100)).padStart(3, "0");
    const coord = (v: number) => String(Math.round(Math.min(Math.max(v, 0), W))).padStart(4, "0");
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
    };
    seek();
    root.dataset.armed = "true";
    const off = subscribeProgress(seek);
    return () => {
      off();
      cue.revert();
      main.revert();
    };
  }, [out, W]);

  // A full ring of points on the iris arcs keeps the group's box centred, so it turns about its middle.
  const arc = (r: number, from: number, sweep: number) => {
    const a = (from * Math.PI) / 180;
    const b = ((from + sweep) * Math.PI) / 180;
    return `M ${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(b)} ${cy + r * Math.sin(b)}`;
  };
  const glowLeft = out ? 0 : -80;
  const glowRight = out ? -80 : 0;
  return (
    <svg ref={svg} className="sc-frame-svg" viewBox={`0 0 ${W} ${H}`} width={W} height={H} data-dir={direction}>
      <defs>
        <linearGradient id="sc-glow-r" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={c.glow} stopOpacity="0.38" />
          <stop offset="1" stopColor={c.glow} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="sc-glow-l" x1="1" x2="0" y1="0" y2="0">
          <stop offset="0" stopColor={c.glow} stopOpacity="0.38" />
          <stop offset="1" stopColor={c.glow} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* alignment frame: corner brackets and a dashed frame inside the viewport edge */}
      <rect className="sc-frame" x={inset} y={inset} width={W - inset * 2} height={H - inset * 2} stroke={c.line} />
      {[
        [inset, inset, 1, 1],
        [W - inset, inset, -1, 1],
        [inset, H - inset, 1, -1],
        [W - inset, H - inset, -1, -1],
      ].map(([x, y, dx, dy], i) => (
        <path key={i} className="sc-corner" d={`M ${x} ${y + dy * corner} L ${x} ${y} L ${x + dx * corner} ${y}`} stroke={c.line} />
      ))}

      {/* crosshair halves, each drawn from the viewport edge toward the centre */}
      <path className="sc-cross" d={`M 0 ${cy} L ${cx - R - 26} ${cy}`} stroke={c.line} />
      <path className="sc-cross" d={`M ${W} ${cy} L ${cx + R + 26} ${cy}`} stroke={c.line} />
      <path className="sc-cross" d={`M ${cx} 0 L ${cx} ${cy - R - 26}`} stroke={c.line} />
      <path className="sc-cross" d={`M ${cx} ${H} L ${cx} ${cy + R + 26}`} stroke={c.line} />

      {/* the link from the switch to the centre */}
      <path className="sc-link" d={`M ${ox} ${oy} L ${cx} ${cy}`} stroke={c.accent} />

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
            stroke={c.accent}
          />
        ))}
      </g>

      {/* the aperture */}
      <g className="sc-aperture sc-spin">
        <circle cx={cx} cy={cy} r={R * 2.3 + 30} fill="none" stroke="none" />
        <g className="sc-rings sc-spin">
          <circle cx={cx} cy={cy} r={R + 24} fill="none" stroke="none" />
          <circle className="sc-dial" cx={cx} cy={cy} r={R} stroke={c.line} />
          {Array.from({ length: TICKS }, (_, i) => {
            const a = (i / TICKS) * Math.PI * 2 - Math.PI / 2;
            const major = i % (TICKS / 12) === 0;
            const r0 = R + 6;
            const r1 = R + (major ? 22 : 13);
            return (
              <line
                key={i}
                className="sc-tick"
                x1={cx + r0 * Math.cos(a)}
                y1={cy + r0 * Math.sin(a)}
                x2={cx + r1 * Math.cos(a)}
                y2={cy + r1 * Math.sin(a)}
                stroke={major ? c.accent : c.line}
                strokeWidth={major ? 2 : 1.2}
              />
            );
          })}
        </g>
        <g className="sc-inner sc-spin">
          <circle cx={cx} cy={cy} r={R * 0.64} stroke={c.line} strokeDasharray="3 9" fill="none" strokeWidth={1.5} />
        </g>
        <g className="sc-iris sc-spin">
          <circle cx={cx} cy={cy} r={R * 0.82 + 4} fill="none" stroke="none" />
          {[c.line, c.accent, c.third].map((colour, i) => (
            <path key={i} d={arc(R * 0.82, i * 120 - 90, 78)} stroke={colour} strokeWidth={small ? 4 : 6} strokeLinecap="round" fill="none" />
          ))}
        </g>
        <path className="sc-centre" d={`M ${cx - 7} ${cy} L ${cx + 7} ${cy} M ${cx} ${cy - 7} L ${cx} ${cy + 7}`} stroke={c.line} strokeWidth={1.5} />
      </g>

      <g className="sc-label">
        <text x={cx} y={cy + R + 46} textAnchor="middle" fill={c.text}>
          {out ? "PROFESSIONAL → CREATIVE" : "CREATIVE → PROFESSIONAL"}
        </text>
        <text ref={readout} x={cx} y={cy + R + 64} textAnchor="middle" fill={c.line}>
          SCAN 000%
        </text>
      </g>

      {/* the two scanners, placed by --sc-l and --sc-r */}
      {(["l", "r"] as const).map((side) => (
        <g key={side} className={`sc-beam sc-beam-${side}`}>
          <rect x={side === "l" ? glowLeft : glowRight} y={0} width={80} height={H} fill={`url(#sc-glow-${(side === "l") === out ? "r" : "l"})`} />
          <path className="sc-beam-line" d={`M 0 0 L 0 ${H}`} stroke={c.line} strokeWidth={2.5} />
          <path d={`M -9 0 L 9 0 L 0 12 Z M -9 ${H} L 9 ${H} L 0 ${H - 12} Z`} fill={c.accent} />
          <text ref={side === "l" ? leftX : rightX} x={side === "l" ? (out ? 10 : -10) : out ? -10 : 10} y={30} textAnchor={(side === "l") === out ? "start" : "end"} fill={c.text}>
            x 0000
          </text>
        </g>
      ))}
    </svg>
  );
}
