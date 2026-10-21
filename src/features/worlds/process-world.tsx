"use client";
import { useState } from "react";
import { Droplets, Scale, ScanLine, Palette } from "lucide-react";
import SpatialView from "./spatial-view";
const gates = [
  {
    name: "Weight gate",
    icon: Scale,
    description:
      "The source first applies the minimum-weight gate. Below-threshold drips are ignored and do not count as offences.",
  },
  {
    name: "Capacitance & contamination",
    icon: ScanLine,
    description:
      "The classifier checks the oil capacitance band and contamination boundary before the color-quality gate. Thresholds remain uncalibrated placeholders.",
  },
  {
    name: "Color-quality gate",
    icon: Palette,
    description:
      "Color completes the classifier decision. Accepted, rejected, and ignored outcomes feed deposit and ledger transactions; no physical filtration stage is claimed.",
  },
];
const states = {
  Accepted:
    "Illustrates a sample passing the documented gates. No hardware reading or payment is generated.",
  Rejected:
    "Illustrates a rejected sample. The real API coordinates offence and ledger logic inside transactions.",
  Ignored:
    "Illustrates a below-weight sample. Source rules explicitly avoid counting these drips as offences.",
};
export default function ProcessWorld() {
  const [selected, setSelected] = useState(0),
    [state, setState] = useState<keyof typeof states>("Accepted");
  return (
    <div className="interactive-module process-module">
      <div className="module-toolbar">
        <div>
          <span className="eyebrow">SENSE → CLASSIFY → RECORD</span>
          <p>
            A software process guide. Calibration is still a real-world task.
          </p>
        </div>
        <label>
          Illustrative outcome
          <select
            value={state}
            onChange={(event) =>
              setState(event.target.value as keyof typeof states)
            }
          >
            {Object.keys(states).map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>
      <SpatialView
        kind="process"
        selected={selected}
        onSelect={setSelected}
        fallback={
          <div className="process-stage-visual" aria-hidden="true">
            <span className="process-flow-line" />
            {gates.map((gate, i) => {
              const Icon = gate.icon;
              return (
                <div
                  key={gate.name}
                  className={`process-tower ${selected === i ? "selected" : ""}`}
                >
                  <span className="process-tower-cap" />
                  <div>
                    <Icon size={35} />
                    <b>0{i + 1}</b>
                  </div>
                  <strong>{["WEIGH", "CLASSIFY", "CHECK"][i]}</strong>
                </div>
              );
            })}
            <span className={`pour-sample sample-${state.toLowerCase()}`}>
              <Droplets size={28} />
            </span>
          </div>
        }
      />
      <div
        className="process-gates"
        role="group"
        aria-label="Sensor classifier gates"
      >
        {gates.map((gate, i) => (
          <button
            key={gate.name}
            aria-pressed={selected === i}
            onClick={() => setSelected(i)}
          >
            <span className="mono">0{i + 1}</span>
            {gate.name}
          </button>
        ))}
      </div>
      <div className="process-inspector" aria-live="polite">
        <div>
          <span className="eyebrow">SELECTED GATE</span>
          <h3>{gates[selected].name}</h3>
          <p>{gates[selected].description}</p>
        </div>
        <aside>
          <span className={`outcome outcome-${state.toLowerCase()}`}>
            {state} / illustrative
          </span>
          <p>{states[state]}</p>
        </aside>
      </div>
      <p className="module-disclaimer">
        Symbolic objects represent software gates, not verified purification
        machinery. No real sensors, environmental measurements, financial
        transfers, or calibrated classification are connected.
      </p>
    </div>
  );
}
