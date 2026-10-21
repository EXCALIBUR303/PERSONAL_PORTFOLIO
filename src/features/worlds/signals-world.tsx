"use client";
import { useState } from "react";
import {
  BrainCircuit,
  SlidersHorizontal,
  Layers3,
  NotebookPen,
} from "lucide-react";
const stages = [
  {
    name: "Self-reported inputs",
    label: "11 inputs",
    icon: NotebookPen,
    description:
      "Seven objective lifestyle inputs and four subjective inputs enter the research questionnaire. They are self-reported signals, not diagnostic observations.",
  },
  {
    name: "Engineered signals",
    label: "18 features total",
    icon: SlidersHorizontal,
    description:
      "The backend normalizes and clips inputs, then derives seven additional features. Source comments and old trees differ; the active v5 arrays and metadata specify 18 features.",
  },
  {
    name: "Stacking ensemble",
    label: "XGBoost + LightGBM",
    icon: Layers3,
    description:
      "Two base learners feed a LogisticRegression meta-estimator. The API attempts to load the v5 artifact first and has older-model fallbacks. No trained model is loaded here.",
  },
  {
    name: "History & interpretation",
    label: "Research output",
    icon: BrainCircuit,
    description:
      "The source supports response explanations and SQLite history. A mixed/synthetic holdout does not establish real-student validity, and a separate lifestyle benchmark was substantially weaker.",
  },
];
export default function SignalsWorld() {
  const [selected, setSelected] = useState(0);
  const current = stages[selected];
  return (
    <div className="interactive-module signals-module">
      <div className="signal-world-heading">
        <span className="eyebrow">EXPLORE THE MODEL BOUNDARY</span>
        <h3>
          Signals need context.
          <br />
          <em>So do predictions.</em>
        </h3>
        <p>
          An explainer of the verified system. No health questionnaire is
          collected, and no risk prediction is generated here.
        </p>
      </div>
      <div
        className="signal-flow"
        role="group"
        aria-label="Student Burnout pipeline stages"
      >
        {stages.map((stage, i) => {
          const Icon = stage.icon;
          return (
            <button
              key={stage.name}
              aria-pressed={selected === i}
              onClick={() => setSelected(i)}
            >
              <span className="signal-node-index mono">0{i + 1}</span>
              <Icon size={36} strokeWidth={1.3} />
              <strong>{stage.name}</strong>
              <span>{stage.label}</span>
            </button>
          );
        })}
      </div>
      <div className="signal-inspector" aria-live="polite">
        <span className="eyebrow">SELECTED STAGE</span>
        <h3>{current.name}</h3>
        <p>{current.description}</p>
      </div>
      <div className="research-boundary">
        <BrainCircuit size={22} />
        <p>
          <strong>Research, not diagnosis.</strong> No clinical validation is
          established. See the source metadata and the evaluation limitations
          below; a single accuracy headline would omit important evidence.
        </p>
      </div>
    </div>
  );
}
