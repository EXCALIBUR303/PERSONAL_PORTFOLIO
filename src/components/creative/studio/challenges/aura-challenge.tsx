"use client";
import { useState } from "react";
import { auraPart, hopText, requestRoute, type AuraPartId } from "@/components/scenes/aura-data";
import { ChallengeShell, Choices } from "./challenge-shell";

type Service = "github" | "ai" | "store";
const zones: AuraPartId[] = ["github-zone", "ailab", "software"];
const services: { id: Service; label: string }[] = [
  { id: "github", label: "GitHub service" },
  { id: "ai", label: "AI and voice" },
  { id: "store", label: "SQLite store" },
];

/** Which line of text describes a hop, for the request route. */
function hopFor(step: AuraPartId, index: number, last: number): string {
  if (index === 0) return hopText.out;
  if (index === last) return hopText.back;
  if (step === "bridge") return hopText.bridge;
  if (step === "router") return hopText.router;
  return hopText[step] ?? "";
}

export default function AuraChallenge({ onDone }: { onDone: () => void }) {
  const [zone, setZone] = useState<AuraPartId>("github-zone");
  const [guess, setGuess] = useState<Service | null>(null);
  const part = auraPart(zone);
  const hops = requestRoute(zone);
  const answer = part.service as Service;
  const revealed = guess !== null;
  return (
    <ChallengeShell
      heading="Follow a request down the bridge"
      ask={
        <>
          In AURA the web layer never talks to GitHub, the AI or the disk itself. Pick a zone, then say which native Swift
          service answers a request that starts there.
        </>
      }
      revealed={revealed}
      changed={
        <>
          A request leaves <b>{part.label}</b> in the web layer, crosses the typed bridge, and is dispatched by the router.
        </>
      }
      result={
        <>
          It ends at <b>{auraPart(answer).label}</b>
          {guess === answer ? ", as you picked." : "."}
          <ol className="ch-trace">
            {hops.map((step, i) => (
              <li key={`${step}-${i}`}>
                <b>{auraPart(step).label}</b> — {hopFor(step, i, hops.length - 1)}
              </li>
            ))}
          </ol>
        </>
      }
      why={
        <>
          {auraPart(answer).text} The web layer only sends typed, versioned messages; privileged work such as the GitHub
          token or the local store stays behind the bridge in Swift.
        </>
      }
      real={
        <>
          AURA&apos;s source defines a versioned bridge with 52 request methods and 18 push events, a provider-neutral AI
          service and on-device speech. The audit read this structure and ran its test suites; the app itself was not run,
          hosted-model inference and microphone use were not verified, and nothing from AURA runs here.
        </>
      }
      kind="illustration"
      onAgain={() => setGuess(null)}
      againLabel="Choose again"
    >
      <Choices
        label="Start from this zone"
        value={zone}
        onPick={(id) => {
          setZone(id);
          setGuess(null);
        }}
        options={zones.map((id) => ({ id, label: auraPart(id).label }))}
      />
      <Choices
        label="Which native service answers?"
        value={guess}
        onPick={(id) => {
          setGuess(id);
          onDone();
        }}
        locked={revealed}
        correct={answer}
        options={services}
      />
    </ChallengeShell>
  );
}
