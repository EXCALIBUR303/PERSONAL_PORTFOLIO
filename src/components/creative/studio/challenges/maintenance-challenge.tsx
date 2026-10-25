"use client";
import { useState } from "react";
import { publishedResults, RESULTS_COMMIT } from "@/lib/rul-sim";
import { ChallengeShell, Choices } from "./challenge-shell";

type Dataset = "FD001" | "FD004";
type Metric = "mae" | "rmse" | "nasa";
const metricName: Record<Metric, string> = {
  mae: "mean absolute error",
  rmse: "root mean squared error",
  nasa: "NASA score",
};
const metricNote: Record<Metric, string> = {
  mae: "the average miss, in engine cycles",
  rmse: "like the average miss, but large misses count much more",
  nasa: "a penalty that punishes late predictions (over-estimating life) harder than early ones",
};

export default function MaintenanceChallenge({ onDone }: { onDone: () => void }) {
  const [dataset, setDataset] = useState<Dataset>("FD004");
  const [metric, setMetric] = useState<Metric>("mae");
  const [guess, setGuess] = useState<string | null>(null);
  const rows = publishedResults[dataset];
  const ranked = [...rows].sort((a, b) => a[metric][0] - b[metric][0]);
  const best = ranked[0];
  // A gap smaller than the spread across seeds is not a clear win.
  const rivals = ranked.slice(1).filter((r) => r[metric][0] - best[metric][0] <= best[metric][1] + r[metric][1]);
  const revealed = guess !== null;
  const reset = () => setGuess(null);
  return (
    <ChallengeShell
      heading="Which model made the smallest error?"
      ask={
        <>
          The project trained four models on NASA&apos;s simulated jet-engine data and saved the test results. Pick a dataset
          and a way of scoring, then pick the model with the lowest error.
        </>
      }
      revealed={revealed}
      changed={
        <>
          You are reading saved results for <b>{dataset}</b>, scored by <b>{metricName[metric]}</b> ({metricNote[metric]}),
          averaged over three random seeds.
        </>
      }
      result={
        <>
          <b>{best.model}</b> has the lowest {metricName[metric]} on {dataset}
          {guess === best.model ? ", as you picked" : ""}: {best[metric][0].toFixed(metric === "nasa" ? 0 : 2)} ±{" "}
          {best[metric][1].toFixed(metric === "nasa" ? 0 : 2)}.
          <table className="ch-table">
            <caption className="sr-only">Saved test results, mean and spread over three seeds</caption>
            <thead>
              <tr>
                <th scope="col">Model</th>
                <th scope="col">Mean</th>
                <th scope="col">Spread over seeds</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((r) => (
                <tr key={r.model} data-top={r.model === best.model ? "" : undefined}>
                  <th scope="row">{r.model}</th>
                  <td>{r[metric][0].toFixed(metric === "nasa" ? 0 : 2)}</td>
                  <td>± {r[metric][1].toFixed(metric === "nasa" ? 0 : 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      }
      why={
        rivals.length ? (
          <>
            The gap between {best.model} and {rivals.map((r) => r.model).join(" and ")} is smaller than the seeds disagree with
            each other, so the ordering is not a clear win. Changing the score or the dataset can change the winner, which is why
            the project reports all three scores and both datasets.
          </>
        ) : (
          <>
            On this dataset and score, {best.model} is ahead by more than the spread across seeds. Change the score or the dataset
            to see whether it stays ahead.
          </>
        )
      }
      real={
        <>
          The project trains XGBoost, Transformer, LSTM and GRU models on NASA C-MAPSS with an engine-grouped split, a sensor
          filter and a capped remaining-life label. In the audit, retraining FD001 and FD004 reproduced the tracked result
          files. These numbers are copied from the project&apos;s committed results at commit {RESULTS_COMMIT.slice(0, 7)}; the
          portfolio trains and predicts nothing.
        </>
      }
      kind="saved results"
      onAgain={reset}
      againLabel="Choose again"
    >
      <Choices
        label="Dataset"
        value={dataset}
        onPick={(id) => {
          setDataset(id);
          reset();
        }}
        options={[
          { id: "FD001", label: "FD001 · one condition" },
          { id: "FD004", label: "FD004 · six conditions" },
        ]}
      />
      <Choices
        label="Scoring"
        value={metric}
        onPick={(id) => {
          setMetric(id);
          reset();
        }}
        options={[
          { id: "mae", label: "Mean absolute error" },
          { id: "rmse", label: "Root mean squared error" },
          { id: "nasa", label: "NASA score" },
        ]}
      />
      <Choices
        label="Which model has the lowest error?"
        value={guess}
        onPick={(id) => {
          setGuess(id);
          onDone();
        }}
        locked={revealed}
        correct={best.model}
        options={rows.map((r) => ({ id: r.model, label: r.model }))}
      />
    </ChallengeShell>
  );
}
