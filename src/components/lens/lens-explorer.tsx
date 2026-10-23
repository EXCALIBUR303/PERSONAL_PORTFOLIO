"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { stations, type DeskMode } from "../desk-data";
import LensAlgorithms from "./lens-algorithms";
import LensIntelligence from "./lens-intelligence";
import LensSystems from "./lens-systems";

/** One lens: its visualisation with a plain statement of what it is and why it is here. */
export function LensStage({ mode }: { mode: DeskMode }) {
  const station = stations.find((item) => item.id === mode)!;
  return (
    <div
      className="lz"
      style={{ "--station-accent": station.accent } as React.CSSProperties}
    >
      <header className="lz-head">
        <span className="lz-badge">{station.badge}</span>
        <h2>{station.title}</h2>
      </header>
      {mode === "systems" ? (
        <LensSystems />
      ) : mode === "algorithms" ? (
        <LensAlgorithms />
      ) : (
        <LensIntelligence />
      )}
      <div className="lz-caption">
        <p>
          <b>What you are seeing.</b> {station.seeing}
        </p>
        <p>
          <b>Why it is here.</b> {station.why}
        </p>
        <Link href={`/projects/${station.slug}/`} prefetch={false}>
          Open {station.project}
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

/** Lens picker plus the selected lens. Used by the Professional hero. */
export default function LensExplorer({
  mode,
  onModeChange,
}: {
  mode: DeskMode;
  onModeChange: (mode: DeskMode) => void;
}) {
  return (
    <div className="lz-explorer">
      <div
        className="hx-lenses"
        role="group"
        aria-label="Engineering desk discipline"
      >
        {stations.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={mode === item.id}
            onClick={() => onModeChange(item.id)}
            style={{ "--lens-accent": item.accent } as React.CSSProperties}
          >
            <item.icon size={17} aria-hidden="true" />
            {item.label}
          </button>
        ))}
      </div>
      <LensStage key={mode} mode={mode} />
    </div>
  );
}
