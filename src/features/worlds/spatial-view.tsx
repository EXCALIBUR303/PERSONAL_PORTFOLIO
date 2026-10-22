"use client";
import dynamic from "next/dynamic";
import { Component, useEffect, useState, type ReactNode } from "react";
import { Box, Grid2X2, Move3D, RotateCcw } from "lucide-react";
import type { Maze } from "@/lib/maze";
export type SpatialProps = {
  kind: "maze" | "parking" | "maintenance" | "process";
  cameraView?: "isometric" | "top";
  resetKey?: number;
  maze?: Maze;
  visited?: number[];
  path?: number[];
  selected?: number;
  onSelect?: (index: number) => void;
  slots?: string[];
};
const Scene = dynamic(() => import("./world-scene"), { ssr: false });
class Boundary extends Component<
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
export default function SpatialView({
  fallback,
  ...props
}: SpatialProps & { fallback: ReactNode }) {
  const [cameraView, setCameraView] = useState<"isometric" | "top">(
    "isometric",
  );
  const [resetKey, setResetKey] = useState(0);
  const [supported, setSupported] = useState(false),
    [enabled, setEnabled] = useState(false),
    [ready, setReady] = useState(false);
  useEffect(() => {
    const initialize = () => {
      const test = document.createElement("canvas"),
        gl = test.getContext("webgl2") || test.getContext("webgl");
      setSupported(Boolean(gl));
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
      const connection = (
        navigator as Navigator & { connection?: { saveData?: boolean } }
      ).connection;
      setEnabled(
        Boolean(gl) &&
          matchMedia(
            "(pointer:fine) and (prefers-reduced-motion:no-preference)",
          ).matches &&
          !connection?.saveData,
      );
    };
    const idle = Boolean(window.requestIdleCallback);
    const task = idle
      ? window.requestIdleCallback(initialize, { timeout: 1200 })
      : window.setTimeout(initialize, 150);
    return () => {
      if (idle) window.cancelIdleCallback(task);
      else window.clearTimeout(task);
    };
  }, []);
  return (
    <div className="spatial-view">
      <div className="spatial-view-toolbar">
        <span className="mono">
          <Move3D size={13} />
          {enabled
            ? "DRAG TO ORBIT / SCROLL TO ZOOM"
            : "TECHNICAL VIEW / ALL CONTROLS WORK IN 2D"}
        </span>
        <div role="group" aria-label="Visualization mode">
          <button
            aria-pressed={!enabled}
            onClick={() => {
              setEnabled(false);
              setReady(false);
            }}
          >
            <Grid2X2 size={13} />
            2D
          </button>
          <button
            aria-pressed={enabled}
            disabled={!supported}
            onClick={() => setEnabled(true)}
            aria-label="Enable 3D view"
          >
            <Box size={13} />
            3D
          </button>
        </div>
      </div>
      {enabled && (
        <div
          className="scene-camera-controls"
          role="group"
          aria-label="3D camera controls"
        >
          <button
            aria-pressed={cameraView === "isometric"}
            onClick={() => {
              setCameraView("isometric");
              setResetKey((key) => key + 1);
            }}
          >
            Isometric
          </button>
          <button
            aria-pressed={cameraView === "top"}
            onClick={() => {
              setCameraView("top");
              setResetKey((key) => key + 1);
            }}
          >
            Top view
          </button>
          <button
            onClick={() => {
              setCameraView("isometric");
              setResetKey((key) => key + 1);
            }}
          >
            <RotateCcw size={12} /> Reset camera
          </button>
        </div>
      )}
      <div className="spatial-stage">
        {(!enabled || !ready) && (
          <div className="spatial-fallback">{fallback}</div>
        )}
        {enabled && (
          <Boundary
            fallback={<div className="spatial-fallback">{fallback}</div>}
          >
            <div
              className="spatial-canvas"
              aria-label="Optional 3D view; use the surrounding controls for keyboard access"
              role="img"
            >
              <Scene
                {...props}
                cameraView={cameraView}
                resetKey={resetKey}
                onReady={() => setReady(true)}
              />
            </div>
          </Boundary>
        )}
      </div>
    </div>
  );
}
