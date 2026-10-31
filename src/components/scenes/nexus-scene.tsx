"use client";
import { useState } from "react";
import { StepForward } from "lucide-react";
import { BARS, EPOCH_REVIEW, LOOP, NOT_CLAIMED, RUN, STATUS } from "./nexus-data";

/** The scene needs no 3D canvas; the registry still asks every scene for this. */
export const preloadCanvas = () => Promise.resolve();

type Tab = "loop" | "run" | "status";
const TABS: [Tab, string][] = [
  ["loop", "The loop"],
  ["run", "A recorded DEV run"],
  ["status", "What exists"],
];
const STATE_WORDS = { done: "Done", active: "In progress", blocked: "Blocked", planned: "Planned", empty: "Placeholder" } as const;

/**
 * NEXUS as the repository records it: the loop the agent runs in, the one recorded DEV comparison, and an honest
 * status board. Nothing here runs the project. The diagram is a drawn explanation, not a Habitat scene.
 */
export default function NexusScene() {
  const [tab, setTab] = useState<Tab>("loop");
  const [step, setStep] = useState(0);
  const [metric, setMetric] = useState<"success" | "spl">("success");
  const node = LOOP[step];
  return (
    <div className="lz-viz nx">
      <div className="lz-seg" role="group" aria-label="Exhibit part">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" aria-pressed={tab === id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {tab === "loop" && (
        <>
          <ol className="nx-loop" aria-label="One step of the loop">
            {LOOP.map((n, i) => (
              <li key={n.id}>
                <button type="button" className="nx-node" aria-current={i === step ? "step" : undefined} onClick={() => setStep(i)}>
                  <span className="nx-num mono">{i + 1}</span>
                  {n.label}
                </button>
              </li>
            ))}
          </ol>
          <p className="nx-says" aria-live="polite">
            <b>{node.label}.</b> {node.says}
          </p>
          <p className="lz-fine nx-source mono">From {node.source}</p>
          <div className="lz-actions">
            <button type="button" onClick={() => setStep((step + 1) % LOOP.length)}>
              <StepForward size={14} aria-hidden="true" /> Next part of the loop
            </button>
          </div>
        </>
      )}

      {tab === "run" && (
        <>
          <div className="lz-seg" role="group" aria-label="Measure">
            <button type="button" aria-pressed={metric === "success"} onClick={() => setMetric("success")}>
              Success rate
            </button>
            <button type="button" aria-pressed={metric === "spl"} onClick={() => setMetric("spl")}>
              Path efficiency (SPL)
            </button>
          </div>
          <ul className="nx-bars">
            {BARS.map((b) => {
              const [v, lo, hi] = b[metric];
              return (
                <li key={b.id} data-ppo={b.id === "ppo" || undefined}>
                  <span className="nx-bar-label">{b.label}</span>
                  <span className="nx-track" aria-hidden="true">
                    <span className="nx-fill" style={{ width: `${v * 100}%` }} />
                    {hi > lo && <span className="nx-ci" style={{ left: `${lo * 100}%`, width: `${(hi - lo) * 100}%` }} />}
                  </span>
                  <span className="nx-val mono">
                    {v.toFixed(2)}
                    {hi > lo && <small> ({lo.toFixed(2)} to {hi.toFixed(2)})</small>}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="lz-note">
            {RUN.tier}. {RUN.episodes} episodes on {RUN.scenes}; {RUN.steps}. Intervals are 95 percent. The oracle uses
            information the agent does not have, so it is a ceiling, not a rival.
          </p>
          <p className="lz-fine nx-source mono">From {RUN.sources}</p>
          <p className="lz-fine">
            {EPOCH_REVIEW.text} <span className="mono">{EPOCH_REVIEW.source}</span>
          </p>
        </>
      )}

      {tab === "status" && (
        <>
          <ul className="nx-status">
            {STATUS.map((s) => (
              <li key={s.label} data-state={s.state}>
                <span className="nx-badge mono">{STATE_WORDS[s.state]}</span>
                <b>{s.label}</b>
                <span>{s.says}</span>
              </li>
            ))}
          </ul>
          <p className="lz-note">Not claimed here:</p>
          <ul className="nx-not">
            {NOT_CLAIMED.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
