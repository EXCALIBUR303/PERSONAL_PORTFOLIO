"use client";
import { useState } from "react";
import { Activity, Database, Layers3, Cpu } from "lucide-react";
import SpatialView from "./spatial-view";
import LensIntelligence from "@/components/lens/lens-intelligence";
const models = {
  XGBoost:
    "Summary features from the shared 30-cycle context form a tabular baseline.",
  LSTM: "A recurrent sequence model learns from the same per-engine windows.",
  GRU: "A gated recurrent model provides a second sequence-model comparison.",
  Transformer:
    "A small attention-based model is included in the public research pipeline.",
};
const modules = [
  {
    title: "Trajectory inputs",
    icon: Database,
    description:
      "C-MAPSS provides simulated turbofan trajectories: engine, cycle, three settings, and twenty-one sensor columns.",
  },
  {
    title: "Shared preprocessing",
    icon: Layers3,
    description:
      "Engines split before fitting. Training-only filters/scalers persist, and windows never cross engine boundaries.",
  },
  {
    title: "Model & serving boundary",
    icon: Cpu,
    description:
      "Four model families share context. The API uses persisted preprocessing and returns point estimates without calibrated confidence.",
  },
];
const valueAt = (cycle: number) =>
  Math.max(0, Math.min(125, 125 - cycle + Math.sin(cycle / 12) * 6));
const points = Array.from({ length: 51 }, (_, i) => {
  const cycle = i * 2.5;
  return `${45 + (cycle / 125) * 540},${215 - (valueAt(cycle) / 125) * 170}`;
}).join(" ");
export default function MaintenanceWorld() {
  const [cycle, setCycle] = useState(45),
    [model, setModel] = useState<keyof typeof models>("XGBoost"),
    [selected, setSelected] = useState(0);
  const value = Math.round(valueAt(cycle));
  return (
    <div className="interactive-module maintenance-module">
      <section className="mm-split" aria-labelledby="mm-split-title">
        <h3 id="mm-split-title">
          The protocol that matters most: split by engine
        </h3>
        <LensIntelligence />
      </section>
      <div className="module-toolbar">
        <div>
          <span className="eyebrow">
            SYMBOLIC ENGINE / COMPUTATIONAL MODULES
          </span>
          <p>
            A spatial metaphor for the pipeline, not a calibrated physical twin.
          </p>
        </div>
        <label>
          Model guide
          <select
            value={model}
            onChange={(event) =>
              setModel(event.target.value as keyof typeof models)
            }
          >
            {Object.keys(models).map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
      </div>
      <SpatialView
        kind="maintenance"
        selected={selected}
        onSelect={setSelected}
        fallback={
          <div className="maintenance-symbol" aria-hidden="true">
            <div className="turbine-shell">
              {Array.from({ length: 15 }, (_, i) => (
                <i key={i} style={{ "--i": i } as React.CSSProperties} />
              ))}
            </div>
            <span className="turbine-marker marker-one">INPUT</span>
            <span className="turbine-marker marker-two">CONTEXT</span>
            <span className="turbine-marker marker-three">ESTIMATE</span>
            <Activity size={55} />
          </div>
        }
      />
      <div
        className="maintenance-module-buttons"
        role="group"
        aria-label="Engine pipeline modules"
      >
        {modules.map((module, i) => {
          const Icon = module.icon;
          return (
            <button
              key={module.title}
              aria-pressed={selected === i}
              onClick={() => setSelected(i)}
            >
              <Icon size={18} />
              {module.title}
            </button>
          );
        })}
      </div>
      <div className="maintenance-inspector" aria-live="polite">
        <h3>{modules[selected].title}</h3>
        <p>{modules[selected].description}</p>
        <p>
          <strong>{model}:</strong> {models[model]} This selection changes the
          guide only; no model inference runs here.
        </p>
      </div>
      <div className="rul-chart-layout">
        <div>
          <div className="rul-chart-label mono">
            ILLUSTRATIVE TRAJECTORY / SYNTHETIC DATA
          </div>
          <svg
            className="rul-chart"
            viewBox="0 0 640 260"
            role="img"
            aria-label={`Synthetic remaining-life illustration. Selected cycle ${cycle}, illustrative remaining life ${value} cycles. Not a model prediction.`}
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <line
                key={i}
                x1="45"
                y1={45 + i * 42.5}
                x2="585"
                y2={45 + i * 42.5}
                className="chart-grid"
              />
            ))}
            <polyline points={points} className="rul-line" />
            <line
              x1={45 + (cycle / 125) * 540}
              y1="35"
              x2={45 + (cycle / 125) * 540}
              y2="215"
              className="chart-cursor"
            />
            <circle
              cx={45 + (cycle / 125) * 540}
              cy={215 - (valueAt(cycle) / 125) * 170}
              r="6"
              className="chart-point"
            />
            <text x="45" y="240">
              0
            </text>
            <text x="500" y="240">
              125 / CYCLE
            </text>
            <text x="10" y="47">
              125
            </text>
            <text x="20" y="219">
              0
            </text>
          </svg>
          <label className="cycle-slider">
            Inspection cycle{" "}
            <input
              type="range"
              min="0"
              max="125"
              value={cycle}
              onChange={(event) => setCycle(Number(event.target.value))}
            />
            <output>{cycle}</output>
          </label>
        </div>
        <aside className="synthetic-reading">
          <span className="eyebrow">SIMULATED VALUE</span>
          <strong>
            {value}
            <span> cycles</span>
          </strong>
          <p>
            For explanation only. This curve is generated locally and is
            independent of the selected model guide.
          </p>
        </aside>
      </div>
      <p className="module-disclaimer">
        No model checkpoint, sensor feed, or production inference is loaded.
        C-MAPSS itself is simulated degradation data; this separate synthetic
        curve is not a repository evaluation result.
      </p>
    </div>
  );
}
