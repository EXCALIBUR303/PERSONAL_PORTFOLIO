"use client";
import { useState } from "react";
import { Crosshair, Move3D, Pause, Play, RotateCcw } from "lucide-react";
import { useReducedMotion } from "@/lib/use-reduced-motion";

export type SceneControls = ReturnType<typeof useSceneControls>;

/** Pause and camera-reset state for a 3D scene. Reduced motion starts paused. */
export function useSceneControls() {
  const reduced = useReducedMotion();
  const [choice, setChoice] = useState<boolean | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const paused = choice ?? reduced;
  const [following, setFollowing] = useState(false);
  return {
    /** Camera-follow, for scenes that have something moving to follow. */
    following,
    toggleFollow: () => setFollowing(!following),
    paused,
    togglePause: () => setChoice(!paused),
    resetKey,
    reset: () => setResetKey((key) => key + 1),
  };
}

export function SceneToolbar({
  controls,
  followLabel,
}: {
  controls: SceneControls;
  /** Names what the camera follows; the Follow button shows only when set. */
  followLabel?: string;
}) {
  return (
    <div className="s3-toolbar">
      <span className="mono">
        <Move3D size={13} aria-hidden="true" /> Drag to rotate · scroll or pinch to zoom
      </span>
      <div className="lz-actions">
        <button type="button" onClick={controls.togglePause}>
          {controls.paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
          {controls.paused ? "Resume motion" : "Pause motion"}
        </button>
        {followLabel && (
          <button type="button" aria-pressed={controls.following} onClick={controls.toggleFollow}>
            <Crosshair size={14} aria-hidden="true" /> {controls.following ? "Stop following" : `Follow ${followLabel}`}
          </button>
        )}
        <button type="button" onClick={controls.reset}>
          <RotateCcw size={14} aria-hidden="true" /> Reset view
        </button>
      </div>
    </div>
  );
}
