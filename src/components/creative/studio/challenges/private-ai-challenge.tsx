"use client";
import { useMemo, useState } from "react";
import { passages, questions, scoreQuestion } from "@/components/scenes/retrieval-data";
import { ChallengeShell, Choices } from "./challenge-shell";

const RRF_K = 20;
const MEANING_WEIGHT = 1.0;
const KEYWORD_WEIGHT = 0.5;

export default function PrivateAiChallenge({ onDone }: { onDone: () => void }) {
  const [q, setQ] = useState(0);
  const [guess, setGuess] = useState<string | null>(null);
  const scored = useMemo(() => scoreQuestion(q), [q]);
  const ordered = [...scored].sort((a, b) => a.place - b.place);
  const top = ordered[0];
  const revealed = guess !== null;
  return (
    <ChallengeShell
      heading="Pick the note that gets cited"
      ask={
        <>
          Choose a question, then pick the made-up note you expect the assistant to cite first. Five sample notes stand in for
          your files.
        </>
      }
      revealed={revealed}
      changed={
        <>
          The question is scored against all five notes twice: once for meaning and once for keywords. The two rankings are
          then fused into one.
        </>
      }
      result={
        <>
          The first citation is <b>{top.source}</b>
          {guess === top.source ? ", the note you picked." : "."}
          <table className="ch-table">
            <caption className="sr-only">Ranks and fused score for each note</caption>
            <thead>
              <tr>
                <th scope="col">Final</th>
                <th scope="col">Note</th>
                <th scope="col">Meaning rank</th>
                <th scope="col">Keyword rank</th>
                <th scope="col">Fused</th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((row) => (
                <tr key={row.source} data-top={row.place === 0 ? "" : undefined}>
                  <td>{row.place + 1}</td>
                  <th scope="row">{row.source}</th>
                  <td>{row.denseRank + 1}</td>
                  <td>{row.lexicalRank === null ? "dropped" : row.lexicalRank + 1}</td>
                  <td>{row.fused.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      }
      why={
        <>
          Each note scores <code>1.0 / (20 + meaning rank) + 0.5 / (20 + keyword rank)</code>, counting ranks from zero, and a
          keyword candidate far below the best keyword score is dropped. Combining ranks instead of raw scores lets a note that
          is good on one list and fair on the other beat a note that is only good on one.
        </>
      }
      real={
        <>
          Private Local AI retrieves with a dense embedding search and BM25 keywords, fuses them with these weights, cites the
          file and page, and fences retrieved text as untrusted, all on the machine. Here the meaning score is a stand-in word
          overlap because no embedding model runs in the browser, and no language model writes an answer.
        </>
      }
      kind="sample data"
      onAgain={() => setGuess(null)}
      againLabel="Ask again"
    >
      <Choices
        label="Question"
        value={String(q)}
        onPick={(id) => {
          setQ(Number(id));
          setGuess(null);
        }}
        options={questions.map((text, i) => ({ id: String(i), label: text }))}
      />
      <Choices
        label="Which note is cited first?"
        value={guess}
        onPick={(id) => {
          setGuess(id);
          onDone();
        }}
        locked={revealed}
        correct={top.source}
        options={passages.map((p) => ({ id: p.source, label: p.source }))}
      />
    </ChallengeShell>
  );
}

/** Optional experiment: change the keyword weight and see whether the order moves. */
export function PrivateAiExperiment() {
  const [q, setQ] = useState(0);
  const [weight, setWeight] = useState(KEYWORD_WEIGHT);
  const scored = useMemo(() => scoreQuestion(q), [q]);
  const rank = (w: number) =>
    scored
      .map((row) => ({
        row,
        fused:
          MEANING_WEIGHT / (RRF_K + row.denseRank) + (row.lexicalRank === null ? 0 : w / (RRF_K + row.lexicalRank)),
      }))
      .sort((a, b) => b.fused - a.fused || a.row.denseRank - b.row.denseRank);
  const now = rank(weight);
  const project = rank(KEYWORD_WEIGHT);
  const moved = now[0].row.source !== project[0].row.source;
  return (
    <div className="ch ch-exp">
      <p className="ch-kind mono">Optional experiment · changes a real input</p>
      <h3>What if keywords counted more?</h3>
      <p className="ch-ask">
        <b>Your move.</b> The project gives keyword matches half the weight of meaning matches. Slide the keyword weight and
        watch the order of the five sample notes.
      </p>
      <Choices
        label="Question"
        value={String(q)}
        onPick={(id) => setQ(Number(id))}
        options={questions.map((text, i) => ({ id: String(i), label: text }))}
      />
      <label className="ch-slider">
        <span>
          Keyword weight <b>{weight.toFixed(2)}</b>
          {weight === KEYWORD_WEIGHT ? " (the project's setting)" : ""}
        </span>
        <input
          type="range"
          min={0}
          max={3}
          step={0.25}
          value={weight}
          onChange={(e) => setWeight(Number(e.target.value))}
        />
      </label>
      <ol className="ch-order" aria-live="polite">
        {now.map(({ row, fused }) => (
          <li key={row.source}>
            <span>{row.source}</span> <small className="mono">{fused.toFixed(4)}</small>
          </li>
        ))}
      </ol>
      <p className="ch-fine">
        {moved
          ? `At this weight the first citation changes from ${project[0].row.source} to ${now[0].row.source}.`
          : "At this weight the first citation stays the same. Five short notes rarely disagree; a real library has far more to rank."}{" "}
        Sample notes and a stand-in meaning score, run through the project&apos;s fusion rule. This is not Private Local AI running.
      </p>
    </div>
  );
}
