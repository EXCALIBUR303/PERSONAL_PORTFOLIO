"use client";
import { useState } from "react";
import { ChallengeShell, Choices } from "./challenge-shell";

type Rule = "check" | "lock";
type Outcome = "same" | "refused" | "next";

/**
 * Two sessions both ask for the last free bay. Each session first looks at the
 * bays, then books one. The order below is the unlucky one: both look before
 * either books. A row lock changes who may look at a bay while it is claimed.
 * This models the idea only; it is not the project's code or database.
 */
function simulate(rule: Rule) {
  const free = ["A07", "A08"];
  const claimed = new Map<string, string>();
  const locked = new Set<string>();
  const log: { text: string; a07: string; a08: string }[] = [];
  const snapshot = () => ({
    a07: claimed.get("A07") ?? (locked.has("A07") ? "locked by Car 1" : "free"),
    a08: claimed.get("A08") ?? "free",
  });
  const note = (text: string) => log.push({ text, ...snapshot() });
  const pick: Record<string, string | undefined> = {};

  if (rule === "check") {
    pick.car1 = free.find((b) => !claimed.has(b));
    note("Car 1 looks: A07 is free.");
    pick.car2 = free.find((b) => !claimed.has(b));
    note("Car 2 looks: A07 is free.");
    for (const n of [1, 2]) {
      const bay = pick[`car${n}`]!;
      const earlier = claimed.get(bay);
      claimed.set(bay, earlier ? `${earlier} and Car ${n}` : `Car ${n}`);
      note(`Car ${n} books ${bay}.`);
    }
  } else {
    pick.car1 = free.find((b) => !claimed.has(b) && !locked.has(b));
    locked.add(pick.car1!);
    note("Car 1 looks and locks the row for A07.");
    pick.car2 = free.find((b) => !claimed.has(b) && !locked.has(b));
    note("Car 2 looks: the locked row is skipped, so A08 is the next free bay.");
    claimed.set(pick.car1!, "Car 1");
    locked.delete(pick.car1!);
    note("Car 1 books A07 and releases the lock.");
    claimed.set(pick.car2!, "Car 2");
    note("Car 2 books A08.");
  }
  const outcome: Outcome = pick.car2 === pick.car1 ? "same" : "next";
  return { log, car1: pick.car1!, car2: pick.car2!, outcome };
}

export default function SmartParkChallenge({ onDone }: { onDone: () => void }) {
  const [rule, setRule] = useState<Rule>("check");
  const [guess, setGuess] = useState<Outcome | null>(null);
  const run = simulate(rule);
  const revealed = guess !== null;
  return (
    <ChallengeShell
      heading="Two cars, one last bay"
      ask={
        <>
          Cars 1 and 2 both ask for bay A07 at the same moment. Pick how the garage decides, then say what Car 2 ends up
          with.
        </>
      }
      revealed={revealed}
      changed={
        <ol className="ch-trace">
          {run.log.map((line, i) => (
            <li key={i}>
              {line.text}{" "}
              <span className="mono">
                A07: {line.a07} · A08: {line.a08}
              </span>
            </li>
          ))}
        </ol>
      }
      result={
        run.outcome === "same" ? (
          <>
            Both cars are booked into <b>{run.car1}</b>: a double booking. Nothing stopped the second write.
          </>
        ) : (
          <>
            Car 1 holds <b>{run.car1}</b> and Car 2 is handed <b>{run.car2}</b>. No double booking.{" "}
            {guess === "next"
              ? "That is the outcome you picked."
              : guess === "refused"
                ? "Car 2 is not refused: it is given the next free bay."
                : "Car 2 does not get the same bay."}
          </>
        )
      }
      why={
        rule === "check" ? (
          <>
            Looking and booking are two separate steps. If both sessions look before either books, both see A07 as free,
            and the database accepts both writes.
          </>
        ) : (
          <>
            The first session locks the row while it decides. The second session skips rows that are locked instead of
            waiting or colliding, so it moves on to the next free bay.
          </>
        )
      }
      real={
        <>
          SmartPark DBMS allocates with <code>FOR UPDATE SKIP LOCKED</code>. In its own two-session test the two sessions were
          given different bays, and the second one is handed the next free bay, not refused. The check-then-write
          branch here is an illustration and is not code from the project.
        </>
      }
      kind="simplified logic"
      onAgain={() => setGuess(null)}
      againLabel="Ask again"
    >
      <Choices
        label="How the garage decides"
        value={rule}
        onPick={(id) => {
          setRule(id);
          setGuess(null);
        }}
        options={[
          { id: "check", label: "Look, then book" },
          { id: "lock", label: "Lock the row first" },
        ]}
      />
      <Choices
        label="What does Car 2 end up with?"
        value={guess}
        onPick={(id) => {
          setGuess(id);
          onDone();
        }}
        locked={revealed}
        correct={run.outcome}
        options={[
          { id: "same", label: "The same bay, A07" },
          { id: "refused", label: "Nothing: it is refused" },
          { id: "next", label: "A different free bay" },
        ]}
      />
    </ChallengeShell>
  );
}
