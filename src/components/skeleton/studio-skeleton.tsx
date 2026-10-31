"use client";
import { useMemo } from "react";
import { outlinePath, worldOutline } from "../creative/world/outline";
import type { GatePhase } from "./use-skeleton-gate";

/**
 * The studio map's loading skeleton: the islands, drawn from the world's own
 * layout (the same projection the real world and its station buttons use), so
 * it has the footprint of what is coming. The station buttons are real and
 * already in place, so they are not part of the skeleton.
 *
 * It is decoration: hidden from assistive technology and not focusable. The
 * region announces itself through `aria-busy` and one status line, owned by
 * the stage.
 */
const TONE = {
  studio: { fill: "#ece6d6", stroke: "#17171d" },
  systems: { fill: "#ffe2d2", stroke: "#e8532a" },
  algorithms: { fill: "#d7edff", stroke: "#2f4bff" },
  intelligence: { fill: "#e9e0ff", stroke: "#7a4ee6" },
} as const;

export default function StudioSkeleton({ width, height, phase, opening }: { width: number; height: number; phase: GatePhase; opening: boolean }) {
  const world = useMemo(() => worldOutline(width, height, opening), [width, height, opening]);
  return (
    <div className="sk-layer" data-phase={phase} aria-hidden="true" inert>
      <svg className="sk-svg" viewBox={`0 0 ${width} ${height}`} width={width} height={height}>
        {world.islands.map((island, i) => (
          <path
            key={i}
            d={outlinePath(island.points)}
            fill={TONE[island.id].fill}
            fillOpacity={0.6}
            stroke={TONE[island.id].stroke}
            strokeOpacity={0.45}
            strokeWidth={1.5}
            strokeDasharray="6 5"
            strokeLinejoin="round"
          />
        ))}
      </svg>
      <span className="sk-shimmer" />
      <span className="sk-edge" />
    </div>
  );
}
