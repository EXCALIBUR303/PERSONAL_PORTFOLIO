export type Aim = "Left" | "Center" | "Right";
// Deliberately deterministic: this original demo does not imply a trained agent.
export function resolvePenalty(aim: Aim, power: number, round: number) {
  const keeper = (["Left", "Right", "Center"] as const)[round % 3];
  const result = power > 90 ? "Wide" : aim === keeper ? "Saved" : "Goal";
  return { keeper, result } as const;
}
