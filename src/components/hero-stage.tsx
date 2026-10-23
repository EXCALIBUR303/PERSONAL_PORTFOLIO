"use client";
import dynamic from "next/dynamic";
import {
  Component,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { MoveUpRight, Pause, Play, Plus, Minus, RotateCcw } from "lucide-react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import type { DeskMode } from "./desk-data";
import type { StageApi, StageVariant } from "./sculpture";

const Sculpture = dynamic(() => import("./sculpture"), { ssr: false });

class SceneBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/* Flat poster of each lens: shown while the scene loads, on devices that opt out, and without WebGL. */
const knot = (() => {
  const points: string[] = [];
  for (let i = 0; i <= 120; i++) {
    const t = (i / 120) * Math.PI * 2;
    const x = 200 + 38 * (Math.sin(t) + 2 * Math.sin(2 * t));
    const y = 150 + 38 * (Math.cos(t) - 2 * Math.cos(2 * t)) * -0.8;
    points.push(`${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return points.join("");
})();
function StagePoster({ mode }: { mode: DeskMode }) {
  const bars = Array.from({ length: 25 }, (_, i) => {
    const gx = (i % 5) - 2,
      gz = Math.floor(i / 5) - 2,
      h = (((i * 7) % 5) + 1) * 9 + 8;
    const cx = 200 + (gx - gz) * 30,
      cy = 150 + (gx + gz) * 15;
    return { cx, cy, h, lit: [0, 5, 10, 11, 12, 17, 22, 23, 24].includes(i) };
  }).sort((a, b) => a.cy - b.cy);
  return (
    <svg
      className="hx-poster-art"
      viewBox="0 0 400 340"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <ellipse
        cx="200"
        cy="292"
        rx="150"
        ry="26"
        fill="var(--hx-base, #ece8dd)"
      />
      <ellipse
        cx="200"
        cy="284"
        rx="132"
        ry="20"
        stroke="var(--station-accent)"
      />
      {mode === "systems" && (
        <g>
          <ellipse
            cx="200"
            cy="150"
            rx="148"
            ry="46"
            transform="rotate(-16 200 150)"
          />
          <ellipse
            cx="200"
            cy="150"
            rx="120"
            ry="58"
            transform="rotate(34 200 150)"
            stroke="var(--station-accent)"
            strokeWidth="9"
          />
          <ellipse
            cx="200"
            cy="150"
            rx="92"
            ry="30"
            transform="rotate(-62 200 150)"
          />
          <circle cx="200" cy="150" r="40" fill="currentColor" />
        </g>
      )}
      {mode === "algorithms" && (
        <g>
          {bars.map((b, i) => (
            <g key={i}>
              <path
                d={`M${b.cx} ${b.cy - b.h - 15}l30 15l-30 15l-30 -15z`}
                fill={
                  b.lit ? "var(--station-accent)" : "var(--hx-bar, #c9ced2)"
                }
              />
              <path
                d={`M${b.cx - 30} ${b.cy - b.h}v${b.h}l30 15v-${b.h}z`}
                fill="var(--hx-bar, #c9ced2)"
              />
              <path
                d={`M${b.cx + 30} ${b.cy - b.h}v${b.h}l-30 15v-${b.h}z`}
                fill="var(--hx-bar, #c9ced2)"
              />
            </g>
          ))}
        </g>
      )}
      {mode === "computation" && (
        <path d={knot} stroke="var(--station-accent)" strokeWidth="14" />
      )}
      {mode === "computation" && <path d={knot} strokeWidth="2.5" />}
    </svg>
  );
}

export default function HeroStage({
  mode,
  variant = "pro",
}: {
  mode: DeskMode;
  variant?: StageVariant;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const api = useRef<StageApi | null>(null);
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(true);
  const [paused, setPaused] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [ready, setReady] = useState(false);
  const [coarse, setCoarse] = useState(false);
  const [checked, setChecked] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    // Meaningful HTML first; the GPU scene is an enhancement initialised at idle.
    const initialize = () => {
      const test = document.createElement("canvas");
      const gl = test.getContext("webgl2") || test.getContext("webgl");
      const connection = (
        navigator as Navigator & { connection?: { saveData?: boolean } }
      ).connection;
      const isCoarse = matchMedia("(pointer: coarse)").matches;
      const constrained = isCoarse || Boolean(connection?.saveData);
      setSupported(Boolean(gl));
      setCoarse(isCoarse);
      setEnabled(Boolean(gl) && !constrained);
      setChecked(true);
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    };
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(initialize, { timeout: 1500 })
      : window.setTimeout(initialize, 100);
    const idleSupported = Boolean(window.requestIdleCallback);
    let inView = true;
    const update = () => setVisible(inView && !document.hidden);
    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        update();
      },
      { rootMargin: "80px" },
    );
    if (frame.current) observer.observe(frame.current);
    document.addEventListener("visibilitychange", update);
    return () => {
      if (idleSupported) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  const live = supported && enabled && !failed;
  // If the GPU scene never reports ready (context creation stalled), fall back
  // to the static study instead of showing "Preparing…" forever.
  useEffect(() => {
    if (!live || ready) return;
    const timer = window.setTimeout(() => setFailed(true), 15000);
    return () => window.clearTimeout(timer);
  }, [live, ready]);
  const interactive = live && ready;
  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!interactive || !api.current) return;
    const step = 0.2;
    const handled = {
      ArrowLeft: () => api.current?.rotate(-step, 0),
      ArrowRight: () => api.current?.rotate(step, 0),
      ArrowUp: () => api.current?.rotate(0, -step),
      ArrowDown: () => api.current?.rotate(0, step),
      "+": () => api.current?.zoom(0.85),
      "=": () => api.current?.zoom(0.85),
      "-": () => api.current?.zoom(1.18),
      "0": () => api.current?.reset(),
    }[event.key];
    if (handled) {
      event.preventDefault();
      handled();
    }
  };
  const state = !checked
    ? "loading"
    : failed || !supported
      ? "unavailable"
      : !enabled
        ? "static"
        : ready
          ? "live"
          : "loading";
  const hint = {
    live: coarse
      ? "Drag sideways to rotate. The page still scrolls."
      : "Drag to rotate · arrows rotate · +/− zoom",
    loading: "Preparing the 3D model…",
    static: "Static form study. 3D is optional on this device.",
    unavailable: "3D isn’t available here. Showing a static form study.",
  }[state];
  return (
    <div
      className={`hx-stage hx-stage-${variant}`}
      ref={frame}
      data-state={state}
    >
      <div
        className="hx-canvas-wrap"
        tabIndex={interactive ? 0 : undefined}
        role="group"
        aria-label={
          interactive
            ? `Interactive 3D model of the ${mode} lens. Arrow keys rotate, plus and minus zoom, zero resets.`
            : `Illustration of the ${mode} lens`
        }
        onKeyDown={onKey}
      >
        <div className="hx-poster" aria-hidden="true">
          <StagePoster mode={mode} />
        </div>
        {live && (
          <div className="hx-canvas">
            <SceneBoundary onError={() => setFailed(true)}>
              <Sculpture
                mode={mode}
                variant={variant}
                resetKey={resetKey}
                maxDpr={coarse ? 1.5 : 2}
                animated={visible && !paused && !reduced}
                onReady={() => setReady(true)}
                onError={() => setFailed(true)}
                apiRef={api}
              />
            </SceneBoundary>
          </div>
        )}
        <span className="hx-badge mono">
          <i aria-hidden="true" />
          {state === "live" ? "LIVE 3D" : "FORM STUDY"}
        </span>
      </div>
      <div className="hx-toolbar">
        <span className="hx-hint mono" role="status">
          {hint}
        </span>
        <div className="hx-tools">
          {interactive && (
            <>
              <button
                type="button"
                aria-label="Zoom out"
                onClick={() => api.current?.zoom(1.18)}
              >
                <Minus size={15} />
              </button>
              <button
                type="button"
                aria-label="Zoom in"
                onClick={() => api.current?.zoom(0.85)}
              >
                <Plus size={15} />
              </button>
              <button
                type="button"
                aria-label="Reset sculpture view"
                onClick={() => {
                  api.current?.reset();
                  setResetKey((key) => key + 1);
                }}
              >
                <RotateCcw size={15} />
              </button>
              {!reduced && (
                <button
                  type="button"
                  onClick={() => setPaused(!paused)}
                  aria-label={paused ? "Play sculpture" : "Pause sculpture"}
                >
                  {paused ? <Play size={15} /> : <Pause size={15} />}
                </button>
              )}
            </>
          )}
          {supported && !enabled && !failed && (
            <button
              type="button"
              className="enable-3d"
              onClick={() => setEnabled(true)}
            >
              Try in 3D <MoveUpRight size={13} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
