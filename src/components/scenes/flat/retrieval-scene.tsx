"use client";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";

/** Made-up notes. Nothing here comes from Private Local AI or anyone's files. */
const passages = [
  { source: "travel-notes.md § Visa", text: "The visa appointment is booked for the second week of March at the consulate." },
  { source: "travel-notes.md § Packing", text: "Pack the laptop charger, the adapter and printed copies of the hotel booking." },
  { source: "lab-handbook.pdf · p. 2", text: "Lab doors lock at nine in the evening; ask the technician for weekend access." },
  { source: "lab-handbook.pdf · p. 4", text: "Soldering stations must be switched off and the fume extractor left running for five minutes." },
  { source: "budget.csv · row 7", text: "Monthly budget for groceries is set to four thousand rupees, reviewed every Sunday." },
];
const questions = [
  "When do the lab doors lock?",
  "What should I pack for the trip?",
  "How much is the grocery budget?",
];
const STOP = new Set("the a an and of for to is are at in on what when how much should i be left every with".split(" "));
const words = (s: string) =>
  s.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter((w) => w && !STOP.has(w));

/** BM25 keyword score over the sample passages. */
function bm25(query: string[]) {
  const docs = passages.map((p) => words(p.text));
  const avg = docs.reduce((n, d) => n + d.length, 0) / docs.length;
  return docs.map((doc) =>
    query.reduce((score, term) => {
      const df = docs.filter((d) => d.includes(term)).length;
      if (!df) return score;
      const tf = doc.filter((w) => w === term).length;
      const idf = Math.log(1 + (docs.length - df + 0.5) / (df + 0.5));
      return score + (idf * tf * 2.2) / (tf + 1.2 * (0.25 + (0.75 * doc.length) / avg));
    }, 0),
  );
}
/** Stand-in for embedding similarity: cosine over word prefixes, so "lock" meets "locks". */
function overlap(query: string[]) {
  const stem = (w: string) => w.slice(0, 4);
  const q = new Set(query.map(stem));
  return passages.map((p) => {
    const d = new Set(words(p.text).map(stem));
    const shared = [...q].filter((w) => d.has(w)).length;
    return shared / Math.sqrt(q.size * d.size || 1);
  });
}
const normalise = (xs: number[]) => {
  const max = Math.max(...xs) || 1;
  return xs.map((x) => x / max);
};

const steps = ["Split", "Score", "Combine", "Fence", "Cite"] as const;

export default function RetrievalScene() {
  const [q, setQ] = useState(0);
  const [step, setStep] = useState(0);
  const scored = useMemo(() => {
    const query = words(questions[q]);
    const k = normalise(bm25(query));
    const d = normalise(overlap(query));
    return passages
      .map((p, i) => ({ ...p, keyword: k[i], dense: d[i], total: (k[i] + d[i]) / 2 }))
      .sort((a, b) => b.total - a.total);
  }, [q]);
  const top = scored[0];
  const list = step >= 2 ? scored : passages.map((p) => scored.find((s) => s.source === p.source)!);
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
                  {step >= 2 && <b>combined {p.total.toFixed(2)}</b>}
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
          "Each passage gets a keyword (BM25) score and a meaning score. *Here the meaning score is word overlap standing in for embeddings.",
          "The two scores are averaged and the passages ranked. Averaging is this demo's choice.",
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
