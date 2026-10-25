"use client";
import type { ChallengeId } from "../stations";
import AuraChallenge from "./aura-challenge";
import MaintenanceChallenge from "./maintenance-challenge";
import MazeraChallenge, { MazeraExperiment } from "./mazera-challenge";
import PathableChallenge from "./pathable-challenge";
import PrivateAiChallenge, { PrivateAiExperiment } from "./private-ai-challenge";
import SmartParkChallenge from "./smartpark-challenge";

/** The optional challenge for an exhibit. Each one runs on logic or data the exhibit already uses. */
export function ChallengePanel({ id, onDone }: { id: ChallengeId; onDone: () => void }) {
  switch (id) {
    case "smartpark":
      return <SmartParkChallenge onDone={onDone} />;
    case "mazera":
      return <MazeraChallenge onDone={onDone} />;
    case "pathable":
      return <PathableChallenge onDone={onDone} />;
    case "aura":
      return <AuraChallenge onDone={onDone} />;
    case "private-ai":
      return <PrivateAiChallenge onDone={onDone} />;
    case "maintenance":
      return <MaintenanceChallenge onDone={onDone} />;
  }
}

/** Experiments only exist where a real input can be changed and the result recomputed. */
export function ExperimentPanel({ id }: { id: ChallengeId }) {
  if (id === "mazera") return <MazeraExperiment />;
  if (id === "private-ai") return <PrivateAiExperiment />;
  return null;
}
export const hasExperiment = (id: ChallengeId) => id === "mazera" || id === "private-ai";
