"use client";
import { useId, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";

/**
 * What kind of thing a challenge runs on. Said on every result, so a visitor
 * can tell logic that really runs from sample data, saved results or a picture.
 */
export type ChallengeKind =
  | "re-implemented algorithm"
  | "simplified logic"
  | "sample data"
  | "saved results"
  | "illustration";

const kindNote: Record<ChallengeKind, string> = {
  "re-implemented algorithm":
    "A standard algorithm re-implemented for this portfolio. It runs for real in your browser, but it is not the project's own code.",
  "simplified logic":
    "A simplified version of the idea that really runs here. It is not the project's code and it does not touch the project's systems.",
  "sample data":
    "Made-up sample data, run through logic modelled on the project. Nothing private and no model is involved.",
  "saved results":
    "Numbers copied from the project's committed result files. Nothing is predicted or trained here.",
  illustration:
    "An illustration of the project's documented structure. The project itself is not running.",
};

/**
 * The shape every challenge shares. A challenge is always optional and has no
 * score. Once the visitor commits to an answer it states, in order: what
 * changed, the result, why, what the real project does, and what this is.
 */
export function ChallengeShell({
  heading,
  ask,
  children,
  revealed,
  changed,
  result,
  why,
  real,
  kind,
  onAgain,
  againLabel = "Try another",
}: {
  heading: string;
  ask: ReactNode;
  children: ReactNode;
  revealed: boolean;
  changed: ReactNode;
  result: ReactNode;
  why: ReactNode;
  real: ReactNode;
  kind: ChallengeKind;
  onAgain?: () => void;
  againLabel?: string;
}) {
  const id = useId();
  return (
    <div className="ch" aria-labelledby={`${id}-h`}>
      <p className="ch-kind mono">
        Optional · no score · about a minute
      </p>
      <h3 id={`${id}-h`}>{heading}</h3>
      <p className="ch-ask">
        <b>Your move.</b> {ask}
      </p>
      <div className="ch-body">{children}</div>
      <div className="ch-answer" role="status" aria-live="polite">
        {revealed && (
          <dl>
            <div>
              <dt>What changed</dt>
              <dd>{changed}</dd>
            </div>
            <div data-key>
              <dt>Result</dt>
              <dd>{result}</dd>
            </div>
            <div>
              <dt>Why</dt>
              <dd>{why}</dd>
            </div>
            <div>
              <dt>What the real project does</dt>
              <dd>{real}</dd>
            </div>
            <div>
              <dt>What this is</dt>
              <dd>
                <strong className="evidence-chip">{kind}</strong> {kindNote[kind]}
              </dd>
            </div>
          </dl>
        )}
        {revealed && onAgain && (
          <button type="button" className="c-btn c-btn-paper ch-again" onClick={onAgain}>
            <RotateCcw size={14} aria-hidden="true" /> {againLabel}
          </button>
        )}
      </div>
    </div>
  );
}

/** A row of answer buttons. Choosing one is the commitment; the answer is revealed at once. */
export function Choices<T extends string>({
  label,
  options,
  value,
  onPick,
  locked,
  correct,
}: {
  label: string;
  options: { id: T; label: ReactNode }[];
  value: T | null;
  onPick: (id: T) => void;
  locked?: boolean;
  /** Once revealed, the option that is right. */
  correct?: T | null;
}) {
  return (
    <div className="ch-choices" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={value === option.id}
          data-right={locked && correct === option.id ? "" : undefined}
          data-wrong={locked && value === option.id && correct !== option.id ? "" : undefined}
          disabled={locked && value !== option.id && correct !== option.id}
          onClick={() => onPick(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
