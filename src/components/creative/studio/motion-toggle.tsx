"use client";
import { Pause, Play } from "lucide-react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { setAmbientPaused, useAmbientPaused } from "../world/ambient";

/**
 * Pauses the studio map's ambient motion (the 3D world's and the 2D map's), for the visit. It sits in the map's toolbar,
 * which is always in reach (a button pinned inside the map could be below the fold on a phone, where the map is taller
 * than the screen). Motion that runs for more
 * than five seconds needs a way to stop it (WCAG 2.2.2). Hover, selection and camera moves still respond: only the
 * motion that plays by itself stops. Under reduced motion nothing plays by itself, so there is nothing to pause.
 */
export function MotionToggle() {
  const reduced = useReducedMotion();
  const paused = useAmbientPaused();
  if (reduced) return null;
  return (
    <div className="c-tools-group c-motion-group">
      <button type="button" className="c-motion" onClick={() => setAmbientPaused(!paused)}>
        {paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
        <span className="c-view-label">{paused ? "Resume motion" : "Pause motion"}</span>
      </button>
    </div>
  );
}
