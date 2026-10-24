/**
 * The robot-dog simulation. The README documents the chain speech → intent
 * (speed, turn and a reply) → mode controller → PPO policy (12 joint targets)
 * → MuJoCo. Here a keyword matcher stands in for the language model and a
 * hand-written trot stands in for the trained policy.
 */
export type DogCommand = {
  id: "walk" | "back" | "left" | "right" | "stop";
  label: string;
  phrase: string;
  speed: number;
  turn: number;
  reply: string;
  mode: string;
};

export const dogCommands: DogCommand[] = [
  { id: "walk", label: "Walk forward", phrase: "walk forward", speed: 0.6, turn: 0, reply: "Walking forward.", mode: "Policy walking" },
  { id: "back", label: "Back up", phrase: "back up a bit", speed: -0.35, turn: 0, reply: "Backing up.", mode: "Policy walking" },
  { id: "left", label: "Turn left", phrase: "turn left", speed: 0.15, turn: 0.8, reply: "Turning left.", mode: "Policy walking" },
  { id: "right", label: "Turn right", phrase: "turn right", speed: 0.15, turn: -0.8, reply: "Turning right.", mode: "Policy walking" },
  { id: "stop", label: "Stop", phrase: "stop", speed: 0, turn: 0, reply: "Stopping.", mode: "Stand" },
];

/** Keyword stand-in for the language model. Returns null when nothing matches. */
export function matchCommand(text: string): DogCommand | null {
  const t = text.toLowerCase();
  const find = (id: DogCommand["id"]) => dogCommands.find((c) => c.id === id)!;
  if (/\b(stop|halt|stay|freeze|stand)\b/.test(t)) return find("stop");
  if (/\bleft\b/.test(t)) return find("left");
  if (/\bright\b/.test(t)) return find("right");
  if (/\b(back|backward|backwards|reverse)\b/.test(t)) return find("back");
  if (/\b(walk|forward|go|come|move|ahead)\b/.test(t)) return find("walk");
  return null;
}

export const pipeline = [
  { id: "speech", label: "Speech", note: "Whisper turns audio into text" },
  { id: "intent", label: "Intent", note: "A local model returns speed, turn and a reply" },
  { id: "controller", label: "Mode controller", note: "Chooses policy walking or another mode" },
  { id: "policy", label: "PPO policy", note: "Outputs 12 target joint angles" },
  { id: "sim", label: "Simulation", note: "MuJoCo runs the physics under PD control" },
] as const;

/** Leg order: front-left, front-right, back-left, back-right. */
export const LEGS = ["FL", "FR", "BL", "BR"] as const;
const PHASE = [0, Math.PI, Math.PI, 0];

/**
 * Hand-written trot: twelve joint targets (abduction, hip, knee per leg) for a
 * gait phase. `amount` is 0 when standing and 1 at full stride.
 */
export function trot(phase: number, amount: number, turn: number, out: number[]) {
  LEGS.forEach((_, leg) => {
    const p = phase + PHASE[leg];
    const side = leg % 2 === 0 ? 1 : -1;
    const stride = amount * (1 - 0.5 * side * turn);
    out[leg * 3] = 0.04 * side + 0.05 * turn * amount;
    out[leg * 3 + 1] = 0.45 * stride * Math.sin(p);
    out[leg * 3 + 2] = -0.35 - 0.6 * amount * Math.max(0, Math.cos(p));
  });
  return out;
}
