"use client";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useMode } from "@/components/mode";
import {
  cappedRul,
  fitPreprocessor,
  makeFleet,
  PLOTTED,
  publishedResults,
  RESULTS_COMMIT,
  RUL_CAP,
  scale,
  sensorName,
  wear,
  WINDOW,
  windowSplit,
  windowStats,
  type Engine,
  type Preprocessor,
} from "@/lib/rul-sim";
import { SceneToolbar, useSceneControls } from "./scene-controls";
import { useWebGL } from "./use-webgl";

const EngineCanvas = dynamic(() => import("./three/engine-canvas"), {
  ssr: false,
  loading: () => <div className="s3-loading mono">Loading the 3D engine…</div>,
});

const steps = [
  "Sensor data",
  "Engine split",
  "Scale and filter",
  "30-cycle window",
  "Target",
  "Published results",
] as const;
const COLORS = ["#2f4bf5", "#ff6538", "#8a5cf6"];
const W = 600;
const H = 190;
const PAD = { l: 44, r: 12, t: 12, b: 26 };
const px = (cycle: number, life: number) =>
  PAD.l + ((cycle - 1) / (life - 1)) * (W - PAD.l - PAD.r);
const py = (v: number, lo: number, hi: number) =>
  PAD.t + (1 - (v - lo) / (hi - lo || 1)) * (H - PAD.t - PAD.b);

function line(
  values: number[],
  life: number,
  lo: number,
  hi: number,
  upTo = values.length,
) {
  return values
    .slice(0, upTo)
    .map(
      (v, i) =>
        `${i ? "L" : "M"}${px(i + 1, life).toFixed(1)} ${py(v, lo, hi).toFixed(1)}`,
    )
    .join("");
}

function Axis({
  life,
  lo,
  hi,
  label,
}: {
  life: number;
  lo: string;
  hi: string;
  label: string;
}) {
  return (
    <g className="rul-axis">
      <line x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} />
      <line x1={PAD.l} x2={PAD.l} y1={PAD.t} y2={H - PAD.b} />
      <text x={PAD.l - 6} y={PAD.t + 8} textAnchor="end">
        {hi}
      </text>
      <text x={PAD.l - 6} y={H - PAD.b} textAnchor="end">
        {lo}
      </text>
      <text x={PAD.l} y={H - 6}>
        cycle 1
      </text>
      <text x={W - PAD.r} y={H - 6} textAnchor="end">
        cycle {life}
      </text>
      <text x={(W + PAD.l) / 2} y={H - 6} textAnchor="middle">
        {label}
      </text>
    </g>
  );
}

/** Step 1: the three plotted sensors, raw, each on its own vertical scale. */
function RawChart({ engine, cycle }: { engine: Engine; cycle: number }) {
  const rowH = (H - PAD.t - PAD.b) / 3;
  return (
    <svg
      className="rul-chart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Raw readings of ${PLOTTED.map(sensorName).join(", ")} for made-up engine ${engine.unit}, up to cycle ${cycle} of ${engine.life}.`}
    >
      {PLOTTED.map((s, i) => {
        const values = engine.readings.map((r) => r[s]);
        const lo = Math.min(...values);
        const hi = Math.max(...values);
        const top = PAD.t + i * rowH;
        const y = (v: number) =>
          top + 4 + (1 - (v - lo) / (hi - lo || 1)) * (rowH - 8);
        const d = values
          .slice(0, cycle)
          .map(
            (v, c) =>
              `${c ? "L" : "M"}${px(c + 1, engine.life).toFixed(1)} ${(hi === lo ? top + rowH / 2 : y(v)).toFixed(1)}`,
          )
          .join("");
        return (
          <g key={s}>
            <text
              className="rul-row-label"
              x={PAD.l - 6}
              y={top + rowH / 2 + 3}
              textAnchor="end"
              fill={COLORS[i]}
            >
              {sensorName(s).replace("sensor_", "s")}
            </text>
            <path d={d} fill="none" stroke={COLORS[i]} strokeWidth={1.4} />
          </g>
        );
      })}
      <line
        className="rul-cursor"
        x1={px(cycle, engine.life)}
        x2={px(cycle, engine.life)}
        y1={PAD.t}
        y2={H - PAD.b}
      />
      <Axis
        life={engine.life}
        lo=""
        hi=""
        label="raw values, each row on its own scale"
      />
    </svg>
  );
}

/** Steps 3 and 4: values after the training-only scaler, on one 0–1 axis. */
function ScaledChart({
  engine,
  pre,
  cycle,
  window: showWindow,
}: {
  engine: Engine;
  pre: Preprocessor;
  cycle: number;
  window: boolean;
}) {
  const lo = -0.1;
  const hi = 1.1;
  const kept = new Set(pre.kept);
  const start = cycle - WINDOW + 1;
  return (
    <svg
      className="rul-chart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Scaled readings of the kept plotted sensors up to cycle ${cycle}${showWindow ? `, with the 30-cycle window from cycle ${start} to ${cycle} highlighted` : ""}.`}
    >
      {showWindow && (
        <rect
          className="rul-window"
          x={px(start, engine.life)}
          y={PAD.t}
          width={px(cycle, engine.life) - px(start, engine.life)}
          height={H - PAD.t - PAD.b}
        />
      )}
      {[0, 1].map((v) => (
        <line
          key={v}
          className="rul-grid"
          x1={PAD.l}
          x2={W - PAD.r}
          y1={py(v, lo, hi)}
          y2={py(v, lo, hi)}
        />
      ))}
      {PLOTTED.map((s, i) =>
        kept.has(s) ? (
          <path
            key={s}
            d={line(
              engine.readings.map((r) => scale(pre, s, r[s])),
              engine.life,
              lo,
              hi,
              cycle,
            )}
            fill="none"
            stroke={COLORS[i]}
            strokeWidth={showWindow && i > 0 ? 1 : 1.4}
            opacity={showWindow && i > 0 ? 0.35 : 1}
          />
        ) : null,
      )}
      <line
        className="rul-cursor"
        x1={px(cycle, engine.life)}
        x2={px(cycle, engine.life)}
        y1={PAD.t}
        y2={H - PAD.b}
      />
      <Axis
        life={engine.life}
        lo="0"
        hi="1"
        label="scaled with the training engines' min and max"
      />
    </svg>
  );
}

/** Step 5: the training label, cycles left capped at 125. */
function TargetChart({ engine, cycle }: { engine: Engine; cycle: number }) {
  const values = Array.from({ length: engine.life }, (_, c) =>
    cappedRul(engine.life, c + 1),
  );
  const now = cappedRul(engine.life, cycle);
  return (
    <svg
      className="rul-chart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Training label for engine ${engine.unit}: ${now} cycles at cycle ${cycle}. The label stays at 125 until 125 cycles remain, then falls to zero at failure.`}
    >
      <line
        className="rul-grid"
        x1={PAD.l}
        x2={W - PAD.r}
        y1={py(RUL_CAP, 0, 140)}
        y2={py(RUL_CAP, 0, 140)}
      />
      <path
        d={line(values, engine.life, 0, 140)}
        fill="none"
        stroke="#2bb673"
        strokeWidth={1.8}
      />
      <circle
        cx={px(cycle, engine.life)}
        cy={py(now, 0, 140)}
        r={5}
        fill="#2bb673"
        stroke="#17171d"
      />
      <line
        className="rul-cursor"
        x1={px(cycle, engine.life)}
        x2={px(cycle, engine.life)}
        y1={PAD.t}
        y2={H - PAD.b}
      />
      <Axis
        life={engine.life}
        lo="0"
        hi="125+"
        label="label: min(cycles left, 125)"
      />
    </svg>
  );
}

/** Step 2: twelve made-up engines as bars, split by engine or (leaky) by window. */
function SplitChart({
  fleet,
  mode,
}: {
  fleet: ReturnType<typeof makeFleet>;
  mode: "engine" | "window";
}) {
  const longest = Math.max(...fleet.engines.map((e) => e.life));
  const leaky = useMemo(() => windowSplit(fleet, 1), [fleet]);
  const rowH = 14;
  const height = fleet.engines.length * rowH + 8;
  const unit = (W - 120) / longest;
  return (
    <svg
      className="rul-chart rul-split"
      viewBox={`0 0 ${W} ${height}`}
      role="img"
      aria-label={
        mode === "engine"
          ? `${fleet.validation.length} of ${fleet.engines.length} engines held out whole for validation.`
          : "Windows assigned at random: every engine ends up on both sides."
      }
    >
      {fleet.engines.map((e, i) => {
        const y = 4 + i * rowH;
        const held = fleet.validation.includes(e.unit);
        return (
          <g key={e.unit}>
            <text className="rul-row-label" x={64} y={y + 10} textAnchor="end">
              engine {String(e.unit).padStart(2, "0")}
            </text>
            {mode === "engine" ? (
              <rect
                x={70}
                y={y + 2}
                width={e.life * unit}
                height={rowH - 5}
                rx={2}
                className={held ? "rul-val" : "rul-train"}
              />
            ) : (
              leaky[i].map((side, w) => (
                <rect
                  key={w}
                  x={70 + w * WINDOW * unit}
                  y={y + 2}
                  width={WINDOW * unit - 1.5}
                  height={rowH - 5}
                  rx={1.5}
                  className={side === "validation" ? "rul-val" : "rul-train"}
                />
              ))
            )}
            {e.unit === fleet.featured.unit && (
              <text className="rul-row-label" x={74 + e.life * unit} y={y + 10}>
                ← followed here
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

const fmt = (v: number) => v.toFixed(3);

export default function MaintenanceScene() {
  const [mode] = useMode();
  const webgl = useWebGL();
  const controls = useSceneControls();
  const fleet = useMemo(() => makeFleet(), []);
  const pre = useMemo(() => fitPreprocessor(fleet), [fleet]);
  const engine = fleet.featured;
  const [step, setStep] = useState(0);
  const [cycle, setCycle] = useState(Math.round(engine.life * 0.85));
  const [split, setSplit] = useState<"engine" | "window">("engine");
  const [subset, setSubset] = useState<"FD001" | "FD004">("FD001");

  const dropped = useMemo(
    () => new Set(step >= 2 ? pre.dropped.map((d) => d.sensor) : []),
    [step, pre],
  );
  const plotted = useMemo(
    () => new Map(PLOTTED.map((s, i) => [s, COLORS[i]] as const)),
    [],
  );
  const label = cappedRul(engine.life, cycle);
  const stats = useMemo(
    () =>
      windowStats(
        engine.readings
          .slice(cycle - WINDOW, cycle)
          .map((r) => scale(pre, PLOTTED[0], r[PLOTTED[0]])),
      ),
    [engine, pre, cycle],
  );
  const leakyShared = useMemo(
    () =>
      windowSplit(fleet, 1).filter(
        (row) => row.includes("train") && row.includes("validation"),
      ).length,
    [fleet],
  );
  const usesCycle = step !== 1 && step !== 5;
  const rows = publishedResults[subset];
  const worst = Math.max(...rows.map((r) => r.rmse[0] + r.rmse[1]));

  return (
    <div className="lz-viz s3-rul">
      <SceneToolbar controls={controls} />
      {webgl ? (
        <EngineCanvas
          mode={mode}
          paused={controls.paused}
          resetKey={controls.resetKey}
          fallback={null}
          wear={wear(cycle, engine.life)}
          dropped={dropped}
          plotted={plotted}
          health={step === 4 ? label / RUL_CAP : null}
        />
      ) : webgl === null ? (
        <div className="s3-loading mono">Checking for 3D support…</div>
      ) : null}

      <ol className="rul-steps" aria-label="Pipeline steps">
        {steps.map((name, i) => (
          <li key={name}>
            <button
              type="button"
              aria-current={i === step ? "step" : undefined}
              onClick={() => setStep(i)}
            >
              <span>{i + 1}</span>
              {name}
            </button>
          </li>
        ))}
      </ol>

      <div className="rul-panel">
        {step === 0 && <RawChart engine={engine} cycle={cycle} />}
        {step === 1 && (
          <>
            <div className="lz-seg" role="group" aria-label="How to split">
              <button
                type="button"
                aria-pressed={split === "engine"}
                onClick={() => setSplit("engine")}
              >
                Split by engine
              </button>
              <button
                type="button"
                aria-pressed={split === "window"}
                onClick={() => setSplit("window")}
              >
                Split by window (leaky)
              </button>
            </div>
            <SplitChart fleet={fleet} mode={split} />
            <div className="lz-row">
              <div className="lz-legend">
                <span>
                  <i className="rul-train" /> Training
                </span>
                <span>
                  <i className="rul-val" /> Validation
                </span>
              </div>
              <dl className="lz-stats">
                <div>
                  <dt>Engines on both sides</dt>
                  <dd className={split === "engine" ? "lz-good" : "lz-bad"}>
                    {split === "engine" ? 0 : leakyShared}
                    <small> / {fleet.engines.length}</small>
                  </dd>
                </div>
              </dl>
            </div>
          </>
        )}
        {(step === 2 || step === 3) && (
          <ScaledChart
            engine={engine}
            pre={pre}
            cycle={cycle}
            window={step === 3}
          />
        )}
        {step === 2 && (
          <p className="rul-dropped mono">
            Kept {pre.kept.length} of 21 · dropped{" "}
            {pre.dropped
              .map(
                (d) =>
                  `${sensorName(d.sensor)} (${d.reason === "variance" ? "flat" : "two values"})`,
              )
              .join(", ")}
          </p>
        )}
        {step === 3 && (
          <dl
            className="rul-stats"
            aria-label={`Window summary of ${sensorName(PLOTTED[0])}`}
          >
            {Object.entries(stats).map(([name, value]) => (
              <div key={name}>
                <dt>{name}</dt>
                <dd>{fmt(value)}</dd>
              </div>
            ))}
          </dl>
        )}
        {step === 4 && (
          <>
            <TargetChart engine={engine} cycle={cycle} />
            <dl className="lz-stats">
              <div>
                <dt>Label at cycle {cycle}</dt>
                <dd>
                  {label}
                  <small> cycles</small>
                </dd>
              </div>
              <div>
                <dt>Actual cycles left</dt>
                <dd>
                  {engine.life - cycle}
                  <small> cycles</small>
                </dd>
              </div>
            </dl>
          </>
        )}
        {step === 5 && (
          <>
            <div className="lz-seg" role="group" aria-label="C-MAPSS subset">
              {(["FD001", "FD004"] as const).map((name) => (
                <button
                  key={name}
                  type="button"
                  aria-pressed={subset === name}
                  onClick={() => setSubset(name)}
                >
                  {name}
                </button>
              ))}
            </div>
            <div className="rul-table">
              <table className="rul-results">
                <caption className="sr-only">
                  {subset} test-set results committed in the repository, mean ±
                  standard deviation over three seeds
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Model</th>
                    <th scope="col">MAE</th>
                    <th scope="col">RMSE</th>
                    <th scope="col">NASA score</th>
                    <th scope="col" aria-hidden="true" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.model}>
                      <th scope="row">{r.model}</th>
                      <td>
                        {fmt(r.mae[0])} <small>± {fmt(r.mae[1])}</small>
                      </td>
                      <td>
                        {fmt(r.rmse[0])} <small>± {fmt(r.rmse[1])}</small>
                      </td>
                      <td>
                        {fmt(r.nasa[0])} <small>± {fmt(r.nasa[1])}</small>
                      </td>
                      <td className="rul-bar" aria-hidden="true">
                        <svg viewBox="0 0 100 10" preserveAspectRatio="none">
                          <rect
                            x={0}
                            y={2}
                            width={(r.rmse[0] / worst) * 100}
                            height={6}
                            rx={1}
                          />
                          <line
                            x1={((r.rmse[0] - r.rmse[1]) / worst) * 100}
                            x2={((r.rmse[0] + r.rmse[1]) / worst) * 100}
                            y1={5}
                            y2={5}
                          />
                        </svg>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <a
              className="rul-source"
              href={`https://github.com/EXCALIBUR303/rul-predictive-maintenance/blob/${RESULTS_COMMIT}/results/${subset}/model_comparison.csv`}
              target="_blank"
              rel="noreferrer"
            >
              results/{subset}/model_comparison.csv{" "}
              <ArrowUpRight size={13} aria-hidden="true" />
            </a>
          </>
        )}

        {usesCycle && (
          <label className="s3-speed mono rul-cycle">
            <span>
              Cycle {cycle} of {engine.life}
            </span>
            <input
              type="range"
              min={WINDOW}
              max={engine.life}
              value={cycle}
              onChange={(e) => setCycle(Number(e.target.value))}
            />
          </label>
        )}

        <p className="lz-note" aria-live="polite">
          {step === 0 && (
            <>
              <b>One made-up engine, run to failure.</b> Each row of C-MAPSS
              data has an engine number, a cycle, three settings and 21 sensors,
              and the repository checks that 26-column schema. Here engine{" "}
              {engine.unit} fails after {engine.life} cycles. Move the cycle
              slider: {sensorName(PLOTTED[0])} drifts up,{" "}
              {sensorName(PLOTTED[1])} drifts down, and {sensorName(PLOTTED[2])}{" "}
              never changes. The engine above tints orange as its made-up wear
              grows.
            </>
          )}
          {step === 1 && (
            <>
              <b>Split before anything is fitted.</b> The repository shuffles
              engine numbers and holds out 20% of whole engines (
              {fleet.validation.length} of {fleet.engines.length} here).
              Splitting windows at random instead puts almost every engine on
              both sides, so validation would score engines the model has
              already seen.
            </>
          )}
          {step === 2 && (
            <>
              <b>Fit on training engines only.</b> Min–max scaling is fitted on
              the training engines, so the held-out engine can stray past 0 or
              1. Sensors whose scaled training values have no variance, or two
              values at most, are dropped; on the engine, their dots fade. FD004
              also clusters six operating regimes first; FD001 has one.
            </>
          )}
          {step === 3 && (
            <>
              <b>Thirty cycles of context.</b> Windows never cross from one
              engine to another. XGBoost gets seven numbers per feature column
              for each window, shown here for {sensorName(PLOTTED[0])} (slope
              per cycle, delta = last − first). The LSTM, GRU and Transformer
              read the same 30 rows directly.
            </>
          )}
          {step === 4 && (
            <>
              <b>What the models learn to predict.</b> The label is the cycles
              left before failure, capped at 125, so early, healthy cycles all
              count as 125. These are the made-up engine&apos;s true labels;
              nothing here is a prediction. The green ring on the engine shows
              the label against the cap.
            </>
          )}
          {step === 5 && (
            <>
              <b>Results from the repository, not from this page.</b> Mean ±
              standard deviation over seeds 42, 1337 and 2026 on the official{" "}
              {subset} test set. Lower is better for all three. The NASA score
              penalises predicting too much remaining life more than too little.
              On wider screens, bars show RMSE with its spread. The API returns a single
              estimate between 0 and 125 with no confidence value.
            </>
          )}
        </p>
        <div className="lz-actions">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep(step - 1)}
          >
            <ArrowLeft size={14} aria-hidden="true" /> Back
          </button>
          <button
            type="button"
            disabled={step === steps.length - 1}
            onClick={() => setStep(step + 1)}
          >
            Next step <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
