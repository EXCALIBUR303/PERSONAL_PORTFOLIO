"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import { useReducedMotion } from "@/lib/use-reduced-motion";

type Mode = "unsafe" | "safe";
type Step = {
  text: string;
  car1: string;
  car2: string;
  bay: string;
  bayTone: "free" | "locked" | "taken" | "conflict";
};

const steps: Record<Mode, Step[]> = {
  unsafe: [
    {
      text: "Car 1 asks: is bay A07 free?",
      car1: "Reads: free",
      car2: "Waiting its turn",
      bay: "Free",
      bayTone: "free",
    },
    {
      text: "Car 2 asks the same thing before Car 1 has written anything.",
      car1: "Reads: free",
      car2: "Reads: free",
      bay: "Free",
      bayTone: "free",
    },
    {
      text: "Car 1 writes: A07 is mine.",
      car1: "Writes A07",
      car2: "Still thinks it is free",
      bay: "Occupied by Car 1",
      bayTone: "taken",
    },
    {
      text: "Car 2 writes: A07 is mine.",
      car1: "Parks in A07",
      car2: "Writes A07",
      bay: "Occupied by Car 1 and Car 2",
      bayTone: "conflict",
    },
  ],
  safe: [
    {
      text: "Car 1 locks A07's row and reads it: free.",
      car1: "Holds the lock",
      car2: "Waiting its turn",
      bay: "Free, locked by Car 1",
      bayTone: "locked",
    },
    {
      text: "Car 2 asks for A07 and has to wait for the lock.",
      car1: "Holds the lock",
      car2: "Waits",
      bay: "Free, locked by Car 1",
      bayTone: "locked",
    },
    {
      text: "Car 1 writes A07, commits, and the lock is released.",
      car1: "Parks in A07",
      car2: "Lock released",
      bay: "Occupied by Car 1",
      bayTone: "taken",
    },
    {
      text: "Car 2 reads A07 again: occupied. It is offered another bay.",
      car1: "Parks in A07",
      car2: "Re-reads: occupied",
      bay: "Occupied by Car 1",
      bayTone: "taken",
    },
  ],
};

const nodes = [
  "Floor map UI",
  "FastAPI",
  "Allocation transaction",
  "Parking session",
  "Tariff billing",
];

/**
 * Hero visualisation for the Systems lens (SmartPark DBMS). An illustrative,
 * step-by-step sequence of the documented idea: row-locked allocation. It does
 * not touch the project's database.
 */
export default function LensSystems() {
  const [mode, setMode] = useState<Mode>("unsafe");
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const reduced = useReducedMotion();
  const list = steps[mode];
  const current = list[step];

  useEffect(() => {
    if (!playing || reduced) return;
    if (step >= list.length - 1) {
      return;
    }
    const timer = window.setTimeout(() => setStep((s) => s + 1), 1500);
    return () => window.clearTimeout(timer);
  }, [playing, reduced, step, list.length]);

  const done = step >= list.length - 1;
  return (
    <div className="lz-viz lz-seq">
      <ol className="lz-stages" aria-label="SmartPark request path">
        {nodes.map((node, i) => (
          <li key={node} aria-current={i === 2 ? "step" : undefined}>
            <span>{i + 1}</span>
            {node}
          </li>
        ))}
      </ol>
      <div className="lz-seg" role="group" aria-label="Allocation method">
        <button
          type="button"
          aria-pressed={mode === "unsafe"}
          onClick={() => {
            setMode("unsafe");
            setStep(0);
            setPlaying(false);
          }}
        >
          Check, then write
        </button>
        <button
          type="button"
          aria-pressed={mode === "safe"}
          onClick={() => {
            setMode("safe");
            setStep(0);
            setPlaying(false);
          }}
        >
          Row-locked allocation
        </button>
      </div>
      <div className="lz-actors" aria-live="polite">
        <div className="lz-actor">
          <span>Car 1</span>
          <b>{current.car1}</b>
        </div>
        <div className={`lz-bay lz-bay-${current.bayTone}`}>
          <span>Bay A07 record</span>
          <b>{current.bay}</b>
        </div>
        <div className="lz-actor">
          <span>Car 2</span>
          <b>{current.car2}</b>
        </div>
      </div>
      <p className="lz-step-text">
        <span>
          Step {step + 1} of {list.length}
        </span>
        {current.text}
      </p>
      {done && (
        <p
          className={`lz-verdict ${mode === "unsafe" ? "lz-bad" : "lz-good"}`}
          role="status"
        >
          {mode === "unsafe"
            ? "Conflict: two parking sessions now claim one bay."
            : "Safe: only one session holds the bay."}
        </p>
      )}
      <div className="lz-actions">
        <button
          type="button"
          aria-label="Previous step"
          disabled={step === 0}
          onClick={() => {
            setPlaying(false);
            setStep(step - 1);
          }}
        >
          <ArrowLeft size={15} />
        </button>
        <button
          type="button"
          aria-label={playing && !done ? "Pause sequence" : "Play sequence"}
          onClick={() => {
            if (done) setStep(0);
            setPlaying(!(playing && !done));
          }}
        >
          {playing && !done ? <Pause size={15} /> : <Play size={15} />}
        </button>
        <button
          type="button"
          aria-label="Next step"
          disabled={done}
          onClick={() => {
            setPlaying(false);
            setStep(step + 1);
          }}
        >
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
