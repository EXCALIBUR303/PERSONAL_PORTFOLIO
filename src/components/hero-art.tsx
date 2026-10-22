"use client";
import dynamic from "next/dynamic";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import type { DeskMode } from "./engineering-desk";
import { Pause, Play, MoveUpRight, RotateCcw } from "lucide-react";
const Sculpture = dynamic(() => import("./sculpture"), { ssr: false });
class SceneBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
function Fallback() {
  return (
    <div className="sculpture-fallback" aria-hidden="true">
      <div className="sculpture-ring ring-one" />
      <div className="sculpture-ring ring-two" />
      <div className="sculpture-ring ring-three" />
      <i className="orbit-dot" />
    </div>
  );
}
export default function HeroArt({ mode = "systems" }: { mode?: DeskMode }) {
  const frame = useRef<HTMLDivElement>(null);
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [paused, setPaused] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [ready, setReady] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    // Keep meaningful HTML first; initialize the optional GPU enhancement at idle.
    const initialize = () => {
      const test = document.createElement("canvas");
      const gl = test.getContext("webgl2") || test.getContext("webgl");
      setSupported(Boolean(gl));
      // Touch and data-saving devices opt in to the GPU enhancement.
      const connection = (
        navigator as Navigator & { connection?: { saveData?: boolean } }
      ).connection;
      const constrained =
        matchMedia("(pointer: coarse)").matches ||
        Boolean(connection?.saveData);
      setEnabled(Boolean(gl) && !constrained);
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
  return (
    <div className="hero-art" ref={frame}>
      <div className="art-grid" aria-hidden="true" />
      <div className="art-coordinate mono">
        {enabled
          ? "DRAG TO ORBIT / SCROLL TO ZOOM"
          : "2D FORM STUDY / ENGINEERING DESK"}
      </div>
      <div className="art-corner top-left" aria-hidden="true" />
      <div className="art-corner bottom-right" aria-hidden="true" />
      <div
        className="sculpture-stage"
        role="img"
        aria-label={`Interactive ${mode} sculpture; a spatial metaphor for the selected discipline`}
      >
        {(!supported || !enabled || !ready) && <Fallback />}
        {supported && enabled && (
          <SceneBoundary fallback={<Fallback />}>
            <Sculpture
              mode={mode}
              resetKey={resetKey}
              animated={visible && !paused && !reduced}
              onReady={() => setReady(true)}
            />
          </SceneBoundary>
        )}
      </div>
      <div className="art-sticker" aria-hidden="true">
        <span>BUILT WITH</span>
        <strong>
          exploration <MoveUpRight size={21} aria-hidden="true" />
        </strong>
      </div>
      <div className="art-bottom">
        {supported && enabled && (
          <button
            type="button"
            aria-label="Reset sculpture view"
            onClick={() => setResetKey((key) => key + 1)}
          >
            <RotateCcw size={14} />
          </button>
        )}
        <span className="mono">
          <i /> {enabled ? "REAL-TIME / THREE.JS" : "STATIC / CSS SCULPTURE"}
        </span>
        {supported && enabled && !reduced && (
          <button
            type="button"
            onClick={() => setPaused(!paused)}
            aria-label={paused ? "Play sculpture" : "Pause sculpture"}
          >
            {paused ? <Play size={14} /> : <Pause size={14} />}
          </button>
        )}
        {supported && !enabled ? (
          <button
            type="button"
            className="enable-3d"
            onClick={() => setEnabled(true)}
          >
            Try in 3D <MoveUpRight size={13} aria-hidden="true" />
          </button>
        ) : (
          <MoveUpRight size={16} aria-hidden="true" />
        )}
      </div>
    </div>
  );
}
