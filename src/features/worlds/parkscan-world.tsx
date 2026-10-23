"use client";
import { useEffect, useMemo, useState } from "react";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import {
  COLS,
  ROBOTS,
  ROWS,
  potholes,
  simulate,
  type Strategy,
} from "@/lib/swarm-sim";

const CELL = 18;
const colours = ["#2f4bf5", "#ff6538", "#17a35a"];
const label: Record<Strategy, { name: string; blurb: string }> = {
  zones: {
    name: "Zones from a central allocator",
    blurb:
      "The lot is split into three strips and each robot sweeps only its own strip. This is the shape of ParkScan's allocator.",
  },
  independent: {
    name: "Robots that do not share a map",
    blurb:
      "Every robot heads for the nearest cell it has not covered itself, so they keep re-covering each other's ground.",
  },
};

/**
 * ParkScan Swarm re-creation: three simulated robots inspect a lot and find
 * potholes. Only the effect of allocation is shown. It is a separate, small
 * simulation, clearly labelled SIMULATED, like the project's own dashboard.
 */
export default function ParkScanWorld() {
  const [strategy, setStrategy] = useState<Strategy>("zones");
  const [tick, setTick] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(3);
  const reduced = useReducedMotion();
  const runs = useMemo(
    () => ({ zones: simulate("zones"), independent: simulate("independent") }),
    [],
  );
  const run = runs[strategy];
  const last = run.frames.length - 1;
  const at = Math.min(tick, last);
  const frame = run.frames[at];
  const done = at >= last;

  useEffect(() => {
    if (!playing || reduced || done) return;
    const timer = window.setTimeout(
      () => setTick((value) => Math.min(last, value + speed)),
      60,
    );
    return () => window.clearTimeout(timer);
  }, [playing, reduced, done, tick, speed, last]);

  const pick = (next: Strategy) => {
    setStrategy(next);
    setTick(0);
    setPlaying(false);
  };
  const other = runs[strategy === "zones" ? "independent" : "zones"];
  const finalFrame = run.frames[last];

  return (
    <div className="interactive-module ps-module">
      <div className="lz-seg" role="group" aria-label="Allocation strategy">
        {(Object.keys(label) as Strategy[]).map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={strategy === key}
            onClick={() => pick(key)}
          >
            {label[key].name}
          </button>
        ))}
      </div>
      <div className="ps-stage">
        <svg
          className="ps-lot"
          viewBox={`0 0 ${COLS * CELL} ${ROWS * CELL}`}
          role="img"
          aria-label={`Simulated parking lot, 150 by 100 metres. Tick ${at}. ${frame.covered} of ${COLS * ROWS} cells covered and ${frame.found} of ${potholes.length} potholes found.`}
        >
          {Array.from({ length: COLS * ROWS }, (_, i) => {
            const t = run.firstCovered[i];
            const seen = t >= 0 && t <= at;
            return (
              <rect
                key={i}
                x={(i % COLS) * CELL}
                y={Math.floor(i / COLS) * CELL}
                width={CELL - 1}
                height={CELL - 1}
                className={seen ? "ps-cell ps-seen" : "ps-cell"}
              />
            );
          })}
          {strategy === "zones" &&
            [1, 2].map((k) => (
              <line
                key={k}
                x1={(k * COLS * CELL) / ROBOTS}
                x2={(k * COLS * CELL) / ROBOTS}
                y1={0}
                y2={ROWS * CELL}
                className="ps-zone"
              />
            ))}
          {potholes.map(([x, y], i) => {
            const found = run.foundAt[i] >= 0 && run.foundAt[i] <= at;
            return (
              <g
                key={i}
                transform={`translate(${x * CELL + CELL / 2} ${y * CELL + CELL / 2})`}
              >
                <circle
                  r={found ? 6 : 4}
                  className={found ? "ps-hole ps-found" : "ps-hole"}
                />
              </g>
            );
          })}
          {frame.robots.map(([x, y], i) => (
            <g
              key={i}
              transform={`translate(${x * CELL + CELL / 2} ${y * CELL + CELL / 2})`}
            >
              <rect
                x={-7}
                y={-7}
                width={14}
                height={14}
                rx={3}
                fill={colours[i]}
                className="ps-robot"
              />
              <text y={4} textAnchor="middle" className="ps-robot-label">
                {i + 1}
              </text>
            </g>
          ))}
        </svg>
        <span className="ps-badge" aria-hidden="true">
          SIMULATED
        </span>
      </div>
      <div className="lz-row">
        <dl className="lz-stats">
          <div>
            <dt>Covered</dt>
            <dd>
              {Math.round((frame.covered / (COLS * ROWS)) * 100)}
              <small>%</small>
            </dd>
          </div>
          <div>
            <dt>Potholes found</dt>
            <dd>
              {frame.found}
              <small> / {potholes.length}</small>
            </dd>
          </div>
          <div>
            <dt>Repeated work</dt>
            <dd className={frame.redundant ? "lz-bad" : "lz-good"}>
              {frame.redundant}
              <small> cells</small>
            </dd>
          </div>
          <div>
            <dt>Tick</dt>
            <dd>{at}</dd>
          </div>
        </dl>
        <div className="lz-actions">
          <button
            type="button"
            aria-label={
              playing && !done ? "Pause simulation" : "Play simulation"
            }
            onClick={() => {
              if (done) setTick(0);
              setPlaying(!(playing && !done));
            }}
          >
            {playing && !done ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <button
            type="button"
            aria-label="Step simulation"
            onClick={() => {
              setPlaying(false);
              setTick(Math.min(last, at + 1));
            }}
          >
            <SkipForward size={15} />
          </button>
          <button
            type="button"
            aria-label="Reset simulation"
            onClick={() => {
              setPlaying(false);
              setTick(0);
            }}
          >
            <RotateCcw size={15} />
          </button>
          <label className="ps-speed">
            Speed
            <input
              type="range"
              min={1}
              max={8}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            />
          </label>
        </div>
      </div>
      <p className="lz-note" aria-live="polite">
        <b>{label[strategy].name}.</b> {label[strategy].blurb}{" "}
        {done ? (
          <>
            Finished in {last} ticks with {finalFrame.redundant} cells of
            repeated work, against {other.frames.length - 1} ticks and{" "}
            {other.frames.at(-1)!.redundant} for the other strategy.
          </>
        ) : (
          "Press play, or step through one tick at a time."
        )}
      </p>
      <p className="module-disclaimer">
        Simulation. A small stand-in for the coordination idea: a 150 by 100
        metre lot as 5 metre cells, three robots with a 15 metre swath, and 14
        fixed potholes. ParkScan Swarm itself adds charging bays, MQTT, PostGIS
        and an optional ROS 2 backend; its simulator and benchmarks are not run
        here and these numbers are not theirs.
      </p>
    </div>
  );
}
