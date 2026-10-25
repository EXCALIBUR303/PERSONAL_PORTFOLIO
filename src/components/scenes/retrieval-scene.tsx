"use client";
import { lazyView } from "./lazy-view";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { useMode } from "@/components/mode";
import RetrievalFlat from "./flat/retrieval-scene";
import { questions, scoreQuestion, steps } from "./retrieval-data";
import { SceneToolbar, useSceneControls } from "./scene-controls";
import { useWebGL } from "./use-webgl";

const VaultCanvas = lazyView(() => import("./three/vault-canvas"), () => <div className="s3-loading mono">Loading the 3D vault…</div>);
/** Fetches the 3D canvas code early, so a scene built during a mode switch is ready at once. */
export const preloadCanvas = () => VaultCanvas.preload();

const notes = [
  "The notes are cut into passages, each remembering its file and section or page.",
  "Each passage gets a keyword (BM25) score, the blue bar, and a meaning score, the orange bar. *The meaning match here is a word-overlap stand-in; no embedding model runs.",
  "The two rankings are fused with weighted Reciprocal Rank Fusion, as the project does: 1.0 / (20 + meaning rank) + 0.5 / (20 + keyword rank), after dropping keyword hits below 0.35 of the best. The passages are then ordered by that fused score.",
  "The best passage is wrapped as untrusted text, so instructions inside a document are treated as data.",
  "The answer is the passage itself, quoted with its source. In the real app a local model writes the answer and cites it.",
];

/**
 * Private Local AI as a chamber of sample passages around a retrieval core.
 * The notes and the scoring are the same sample data as the flat walkthrough.
 * Nothing here is the project's index or anyone's files, and no model runs.
 */
export default function RetrievalScene() {
  const [mode] = useMode();
  const webgl = useWebGL();
  const controls = useSceneControls();
  const [q, setQ] = useState(0);
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const scored = useMemo(() => scoreQuestion(q), [q]);
  const top = useMemo(() => scored.find((s) => s.place === 0)!, [scored]);
  const pick = selected !== null ? scored[selected] : null;
  const [moving, setMoving] = useState(false);
  const go = (next: number) => {
    setStep(next);
    setMoving(true);
    window.setTimeout(() => setMoving(false), 1800);
  };

  if (webgl === false) return <RetrievalFlat />;
  return (
    <div className="lz-viz fl-rag s3-vault">
      <div className="lz-seg" role="group" aria-label="Question">
        {questions.map((text, i) => (
          <button key={text} type="button" aria-pressed={q === i} onClick={() => { setQ(i); setSelected(null); go(0); }}>
            {text}
          </button>
        ))}
      </div>
      <ol className="lz-stages" aria-label="Retrieval steps">
        {steps.map((name, i) => (
          <li key={name} aria-current={i === step ? "step" : undefined}>
            <span>{i + 1}</span>
            {name}
          </li>
        ))}
      </ol>
      <SceneToolbar controls={controls} />
      {webgl ? (
        <VaultCanvas
          scored={scored}
          step={step}
          selected={selected}
          onSelect={setSelected}
          mode={mode}
          paused={controls.paused}
          resetKey={controls.resetKey}
          busy={moving}
          fallback={<RetrievalFlat />}
        />
      ) : (
        <div className="s3-loading mono">Checking for 3D support…</div>
      )}
      <p className="lz-note s3-selection" aria-live="polite">
        {pick
          ? `${pick.source}: “${pick.text}”${step >= 1 ? ` Keyword ${pick.keyword.toFixed(2)}, meaning* ${pick.dense.toFixed(2)}, fused ${pick.total.toFixed(2)} of the best.` : ""}`
          : "Select a passage in the chamber to read it."}
      </p>
      {step >= 1 && step < 3 && (
        <table className="fl-table">
          <caption className="sr-only">Passage scores for this question</caption>
          <thead>
            <tr><th scope="col">Passage</th><th scope="col">Keyword</th><th scope="col">Meaning*</th>{step >= 2 && <th scope="col">Fused</th>}</tr>
          </thead>
          <tbody>
            {[...scored].sort((a, b) => (step >= 2 ? a.place - b.place : 0)).map((s) => (
              <tr key={s.source} data-top={step >= 2 && s === top ? "" : undefined}>
                <th scope="row">{s.source}</th>
                <td>{s.keyword.toFixed(2)}</td>
                <td>{s.dense.toFixed(2)}</td>
                {step >= 2 && <td>{s.total.toFixed(2)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {step === 3 && (
        <pre className="fl-fence" aria-live="polite">{`<<<RETRIEVED, UNTRUSTED: ${top.source}>>>\n${top.text}\n<<<END RETRIEVED>>>`}</pre>
      )}
      {step === 4 && (
        <div className="fl-answer" aria-live="polite">
          <p>“{top.text}”</p>
          <span className="mono">Source: {top.source}</span>
        </div>
      )}
      <p className="lz-note">{notes[step]}</p>
      <div className="lz-actions">
        <button type="button" disabled={step === 0} onClick={() => go(step - 1)}>
          <ArrowLeft size={14} aria-hidden="true" /> Back
        </button>
        <button type="button" disabled={step === steps.length - 1} onClick={() => go(step + 1)}>
          Next step <ArrowRight size={14} aria-hidden="true" />
        </button>
        <button type="button" onClick={() => go(0)}>
          <RotateCcw size={14} aria-hidden="true" /> Reset
        </button>
      </div>
      <p className="lz-note">Sample data: the notes and the scores are made up for this demo and are not the project&apos;s index or anyone&apos;s files.</p>
    </div>
  );
}
