"use client";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { questions, scoreQuestion, steps } from "../retrieval-data";

export default function RetrievalFlat() {
  const [q, setQ] = useState(0);
  const [step, setStep] = useState(0);
  const scored = useMemo(() => {
    return [...scoreQuestion(q)].sort((a, b) => a.place - b.place);
  }, [q]);
  const top = scored[0];
  const list = step >= 2 ? scored : scoreQuestion(q);
  return (
    <div className="lz-viz fl-rag">
      <div className="lz-seg" role="group" aria-label="Question">
        {questions.map((text, i) => (
          <button key={text} type="button" aria-pressed={q === i} onClick={() => { setQ(i); setStep(0); }}>
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
      {step < 3 ? (
        <ul className="fl-passages" aria-live="polite">
          {list.map((p, i) => (
            <li key={p.source} data-top={step >= 2 && i === 0 || undefined}>
              <span className="mono">{p.source}</span>
              <p>{p.text}</p>
              {step >= 1 && (
                <div className="fl-scores mono">
                  <span>keyword {p.keyword.toFixed(2)}</span>
                  <span>meaning* {p.dense.toFixed(2)}</span>
                  {step >= 2 && <b>fused {p.total.toFixed(2)}</b>}
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : step === 3 ? (
        <pre className="fl-fence" aria-live="polite">
          {`<<<RETRIEVED, UNTRUSTED: ${top.source}>>>\n${top.text}\n<<<END RETRIEVED>>>`}
        </pre>
      ) : (
        <div className="fl-answer" aria-live="polite">
          <p>“{top.text}”</p>
          <span className="mono">Source: {top.source}</span>
        </div>
      )}
      <p className="lz-note">
        {[
          "The notes are cut into passages, each remembering its file and section or page.",
          "Each passage gets a keyword (BM25) score and a meaning score. *The meaning match here is a word-overlap stand-in; no embedding model runs.",
          "The two rankings are fused with weighted Reciprocal Rank Fusion, as the project does: 1.0 / (20 + meaning rank) + 0.5 / (20 + keyword rank), after dropping keyword hits below 0.35 of the best. The passages are then ordered by that fused score.",
          "The best passage is wrapped as untrusted text, so instructions inside a document are treated as data.",
          "The answer is the passage itself, quoted with its source. In the real app a local model writes the answer and cites it.",
        ][step]}
      </p>
      <div className="lz-actions">
        <button type="button" disabled={step === 0} onClick={() => setStep(step - 1)}>
          <ArrowLeft size={14} aria-hidden="true" /> Back
        </button>
        <button type="button" disabled={step === steps.length - 1} onClick={() => setStep(step + 1)}>
          Next step <ArrowRight size={14} aria-hidden="true" />
        </button>
        <button type="button" onClick={() => setStep(0)}>
          <RotateCcw size={14} aria-hidden="true" /> Reset
        </button>
      </div>
    </div>
  );
}
