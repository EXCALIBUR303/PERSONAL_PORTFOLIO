"use client";
import { useMemo, useState } from "react";
import { Shuffle } from "lucide-react";
import { ENGINES, WINDOWS, splitEngines, type SplitMode } from "@/lib/leakage";

const stages = [
  "Sensor data",
  "Engine split",
  "Preprocessing",
  "30-cycle windows",
  "Four models",
  "Point-estimate API",
];
const W = 26,
  H = 17,
  GAP = 3,
  LEFT = 54;

/**
 * Hero visualisation for the Intelligence lens (Predictive Maintenance). It
 * shows the single most important idea of that project's protocol: split by
 * engine before fitting. Sample data only; no model runs.
 */
export default function LensIntelligence() {
  const [mode, setMode] = useState<SplitMode>("row");
  const [seed, setSeed] = useState(1);
  const { grid, shared, validationWindows } = useMemo(
    () => splitEngines(mode, seed),
    [mode, seed],
  );
  return (
    <div className="lz-viz lz-split">
      <ol className="lz-stages" aria-label="Pipeline stages">
        {stages.map((stage, i) => (
          <li key={stage} aria-current={i === 1 ? "step" : undefined}>
            <span>{i + 1}</span>
            {stage}
          </li>
        ))}
      </ol>
      <div className="lz-seg" role="group" aria-label="How to split the data">
        <button
          type="button"
          aria-pressed={mode === "row"}
          onClick={() => setMode("row")}
        >
          Split by window
        </button>
        <button
          type="button"
          aria-pressed={mode === "engine"}
          onClick={() => setMode("engine")}
        >
          Split by engine
        </button>
        <button
          type="button"
          className="lz-ghost"
          onClick={() => setSeed(seed + 1)}
        >
          <Shuffle size={14} />
          Reshuffle
        </button>
      </div>
      <svg
        className="lz-split-svg"
        viewBox={`0 0 ${LEFT + WINDOWS * (W + GAP) + 82} ${ENGINES * (H + GAP) + 4}`}
        role="img"
        aria-label={`Twelve sample engines split ${mode === "row" ? "by window" : "by engine"}. ${shared} of ${ENGINES} engines appear in both training and validation.`}
      >
        {grid.map((row, e) => {
          const both = row.includes("train") && row.includes("validation");
          return (
            <g key={e} transform={`translate(0 ${e * (H + GAP) + 2})`}>
              <text x={0} y={12} className="lz-axis">
                Engine {String(e + 1).padStart(2, "0")}
              </text>
              {row.map((side, w) => (
                <rect
                  key={w}
                  x={LEFT + w * (W + GAP)}
                  y={0}
                  width={W}
                  height={H}
                  rx={3}
                  className={`lz-win lz-${side}`}
                />
              ))}
              {both && (
                <text
                  x={LEFT + WINDOWS * (W + GAP) + 6}
                  y={12}
                  className="lz-flag"
                >
                  on both sides
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="lz-row">
        <div className="lz-legend">
          <span>
            <i className="lz-train" /> Training
          </span>
          <span>
            <i className="lz-validation" /> Validation
          </span>
        </div>
        <dl className="lz-stats">
          <div>
            <dt>Engines on both sides</dt>
            <dd className={shared ? "lz-bad" : "lz-good"}>
              {shared}
              <small> / {ENGINES}</small>
            </dd>
          </div>
          <div>
            <dt>Validation windows</dt>
            <dd>{validationWindows}</dd>
          </div>
        </dl>
      </div>
      <p className="lz-note" aria-live="polite">
        {mode === "row" ? (
          <>
            <b>Leaky.</b> Windows from the same engine look almost alike, so
            validating on them tests memory, not generalisation.
          </>
        ) : (
          <>
            <b>Clean.</b> Whole engines are held out before any fitting, so
            validation uses engines the model has never seen. This is the
            project&apos;s protocol.
          </>
        )}
      </p>
    </div>
  );
}
