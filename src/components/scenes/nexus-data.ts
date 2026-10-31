/*
 * NEXUS, as recorded in its repository at commit 1defebc (2026-10-26). Every number here is copied from a
 * committed file named beside it; nothing is estimated or invented. The repository is private, so the files
 * are named but not linked.
 */

export type LoopNode = { id: string; label: string; says: string; source: string };

export const LOOP: LoopNode[] = [
  {
    id: "world",
    label: "Simulated home",
    says: "Habitat-Sim and Habitat-Lab, behind one adapter. The task is PointGoal: reach a goal given only as a distance and a bearing.",
    source: "nexus/simulation/adapters/habitat/; Phase 3 and 5 reports",
  },
  {
    id: "observe",
    label: "What the agent sees",
    says: "The blind agent sees the direction and distance to the goal and its own previous action, nothing else. Depth and colour cameras are planned for Phase 9 and are not built.",
    source: "docs/phase_reports/phase_07.md",
  },
  {
    id: "policy",
    label: "Policy",
    says: "A small actor-critic network (84,005 parameters) trained with PPO: advantages by GAE, a clipped objective, checkpoints at 0, 1, 5, 10, 25, 50, 75 and 100 percent of the budget.",
    source: "docs/phase_reports/phase_07.md; nexus/training/",
  },
  {
    id: "act",
    label: "Action",
    says: "One of four moves: forward, turn left, turn right or stop. The evaluator is the same for every agent, learned or scripted.",
    source: "docs/phase_reports/phase_06.md",
  },
  {
    id: "score",
    label: "Scoring",
    says: "Success, SPL (how direct the path was) and SoftSPL, each checked against Habitat's own scoring code, with confidence intervals.",
    source: "docs/phase_reports/phase_05.md and 06.md",
  },
];

export type Bar = { id: string; label: string; success: [number, number, number]; spl: [number, number, number]; note: string };

/** [value, low, high] of the 95 percent interval. The same 100 episodes for every row. */
export const BARS: Bar[] = [
  { id: "random", label: "Random moves", success: [0, 0, 0], spl: [0, 0, 0], note: "random_uniform" },
  { id: "bug", label: "Scripted heuristic (Bug)", success: [0.33, 0.24, 0.42], spl: [0.237, 0.161, 0.317], note: "heuristic_bug" },
  { id: "ppo", label: "Trained blind PPO agent (DEV run)", success: [0.6, 0.5, 0.69], spl: [0.43, 0.36, 0.5], note: "stochastic evaluation, last checkpoint" },
  { id: "oracle", label: "Perfect shortest path (oracle)", success: [1, 1, 1], spl: [0.988, 0.983, 0.993], note: "uses information the agent does not have" },
];

export const RUN = {
  tier: "DEV, not a reportable result",
  episodes: 100,
  steps: "999,936 training steps, 4 parallel environments, 1 training seed",
  scenes: "Habitat's three small test scenes (train and evaluation scenes are kept apart)",
  sources: "results/aggregates/pointnav_dev_ppo_blind_mlp_v1/ and pointnav_smoke_baselines_v1/",
};

export const EPOCH_REVIEW = {
  text: "A review before the real experiments halved PPO's epochs from 4 to 2 as a test. Success on the same 100 episodes fell from 0.60 and 0.55 to 0.22 and 0.16 (with 4 and 8 environments), so the epochs stayed at 4.",
  source: "results/aggregates/a004_review_dev_2x2_v1/ (one training seed per cell)",
};

export type Phase = { label: string; state: "done" | "active" | "blocked" | "planned" | "empty"; says: string };

export const STATUS: Phase[] = [
  { label: "Phases 0 to 7", state: "done", says: "Architecture, Habitat compatibility, repository foundation, simulator adapter, PointGoal task and metrics, baselines and evaluation, PPO core. Each has a written report in the repository." },
  { label: "Phase 8", state: "active", says: "PPO PointGoal experiments. The aggregator, three experiment configs and a pre-registered pass rule are written." },
  { label: "Phase 8 data", state: "blocked", says: "Waiting on the owner's own download of the licensed HM3D scenes. No real experiment has run, so no real result exists yet." },
  { label: "Phases 9 to 24", state: "planned", says: "Depth and colour perception, memory, mapping, exploration, object search, language, a research interface. Not started." },
  { label: "Empty packages", state: "empty", says: "The memory, mapping, exploration, language, services and registry packages exist as placeholders with no code yet." },
];

export const NOT_CLAIMED = [
  "No physical robot, and no hardware test of any kind",
  "No trained-navigation result beyond the one DEV run above",
  "No HM3D result, reward curve or success rate for the real experiments",
  "No scene images: the test scenes carry a non-commercial licence, so none are shown here",
];
