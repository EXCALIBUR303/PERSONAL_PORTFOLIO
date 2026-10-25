"use client";
import { useMemo, useState } from "react";
import { length, paths, places, profiles, route, type Feature, type Place, type Profile } from "@/components/scenes/pathable-data";
import { ChallengeShell, Choices } from "./challenge-shell";

type Candidate = { key: string; stops: Place[]; ids: string[]; total: number };

/** Every route from a to b that never revisits a place, shortest first. */
function candidates(from: Place, to: Place): Candidate[] {
  const out: Candidate[] = [];
  const walk = (at: Place, stops: Place[], ids: string[], total: number) => {
    if (at === to) {
      out.push({ key: stops.join(">"), stops, ids, total });
      return;
    }
    for (const p of paths) {
      const next = p.a === at ? p.b : p.b === at ? p.a : null;
      if (!next || stops.includes(next)) continue;
      walk(next, [...stops, next], [...ids, p.id], total + length(p.a, p.b));
    }
  };
  walk(from, [from], [], 0);
  return out.sort((x, y) => x.total - y.total);
}

const featureWord: Record<Feature, string> = {
  flat: "flat",
  stairs: "stairs",
  steep: "a steep slope",
  ramp: "a ramp",
};

export default function PathableChallenge({ onDone }: { onDone: () => void }) {
  const [profile, setProfile] = useState<Profile>("wheel");
  const [guess, setGuess] = useState<string | null>(null);
  const options = useMemo(() => candidates("gate", "lab").slice(0, 4), []);
  const avoid = profiles[profile].avoids;
  const best = useMemo(() => route("gate", "lab", avoid, new Set()), [avoid]);
  const answerKey = best ? best.stops.join(">") : null;
  const revealed = guess !== null;

  const verdicts = options.map((option) => {
    const blocked = option.ids
      .map((id) => paths.find((p) => p.id === id)!)
      .find((p) => avoid.includes(p.feature));
    return { option, blocked };
  });
  const name = (p: Place) => places[p].label;
  return (
    <ChallengeShell
      heading="The shortest route is not always yours"
      ask={
        <>
          Plan a trip from the <b>Main gate</b> to the <b>CS lab</b> on the made-up campus. Pick the travel profile, then pick
          the route PathAble&apos;s rules would choose.
        </>
      }
      revealed={revealed}
      changed={
        <>
          For the <b>{profiles[profile].label}</b> profile the router removes every path with{" "}
          {avoid.length ? avoid.map((f) => featureWord[f]).join(" or ") : "no excluded feature"} and searches what is left.
        </>
      }
      result={
        best ? (
          <>
            The chosen route is <b>{best.stops.map(name).join(" → ")}</b>
            {guess === answerKey ? ", the one you picked." : "."}
          </>
        ) : (
          <>No route exists for this profile.</>
        )
      }
      why={
        <ul className="ch-verdicts">
          {verdicts.map(({ option, blocked }) => (
            <li key={option.key} data-chosen={option.key === answerKey ? "" : undefined}>
              <span>{option.stops.map(name).join(" → ")}</span>{" "}
              <em>
                {blocked
                  ? `Rejected: uses ${featureWord[blocked.feature]} between ${name(blocked.a)} and ${name(blocked.b)}.`
                  : option.key === answerKey
                    ? "Chosen: the shortest route this profile can use."
                    : "Allowed, but longer than the chosen route."}
              </em>
            </li>
          ))}
        </ul>
      }
      real={
        <>
          PathAble routes on a graph with accessibility constraints and reroutes after reviewed community reports. Its own
          campus examples are fictional, and this is a simplified re-implementation: in the audit, 22 of 504 route queries
          chose a different route under the project&apos;s own cost model, although both agreed on which places were
          reachable. The campus here is not surveyed geography, and nothing here guarantees a real route is accessible.
        </>
      }
      kind="simplified logic"
      onAgain={() => setGuess(null)}
      againLabel="Choose again"
    >
      <Choices
        label="Travel profile"
        value={profile}
        onPick={(id) => {
          setProfile(id);
          setGuess(null);
        }}
        options={(Object.keys(profiles) as Profile[]).map((id) => ({ id, label: profiles[id].label }))}
      />
      <Choices
        label="Which route will the rules choose?"
        value={guess}
        onPick={(id) => {
          setGuess(id);
          onDone();
        }}
        locked={revealed}
        correct={answerKey}
        options={options.map((option) => ({
          id: option.key,
          label: (
            <>
              {option.stops.map(name).join(" → ")}
              <small className="mono"> · {Math.round(option.total)} units</small>
            </>
          ),
        }))}
      />
    </ChallengeShell>
  );
}
