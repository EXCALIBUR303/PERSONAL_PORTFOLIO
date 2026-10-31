/**
 * What was checked for each project, in plain words.
 *
 * "Ran" means something was executed at the audited commit. "Read" means it was
 * established from source or documentation only. "Not checked" lists what was
 * not run or could not be verified. Entries are short summaries of a repository
 * audit (October 2026); a passing test suite is not a working application.
 */
export type ClaimClass =
  | "original logic"
  | "adapted algorithm"
  | "simplified simulation"
  | "illustrative walkthrough"
  | "design-stage"
  | "link-out only";

export type ProjectEvidence = {
  claimClass: ClaimClass;
  ran: string[];
  read: string[];
  notChecked: string[];
  caveat: string;
  /** 7-character commit the audit ran against, or null when the demo is the portfolio's own. */
  auditedCommit: string | null;
};

export const claimClassNote: Record<ClaimClass, string> = {
  "original logic": "Logic written for this portfolio.",
  "adapted algorithm":
    "An algorithm adapted from the project, re-implemented here.",
  "simplified simulation":
    "A simplified model of the idea. It is not the project's own run.",
  "illustrative walkthrough":
    "Made-up sample data that shows how the idea behaves.",
  "design-stage": "A design on paper. Nothing is implemented to run.",
  "link-out only": "Described here; the project is opened elsewhere.",
};

export const evidence: Record<string, ProjectEvidence> = {
  "student-burnout-ai": {
    claimClass: "link-out only",
    ran: [
      "14 backend tests pass (network denied)",
      "The frontend build compiles without strict CI mode",
    ],
    read: [
      "A rule-based override sits on top of the model",
      "The repository's own report documents label leakage",
    ],
    notChecked: [
      "The frontend test cannot run (Jest cannot resolve react-router-dom 7)",
      "Model quality was not re-evaluated",
    ],
    caveat:
      "Link-out only. Not a clinical tool, and no live prediction is offered here.",
    auditedCommit: "8f80e29",
  },
  "mazera-ai-maze-solver": {
    claimClass: "adapted algorithm",
    ran: [
      "Parity on 327 generated grids: path lengths equal for BFS, Dijkstra, A* and Bidirectional",
      "The original application builds",
    ],
    read: ["Four-connected, unweighted grid"],
    notChecked: ["Explored-cell counts differ from the original's"],
    caveat:
      "Independent re-implementation. DFS and Greedy do not guarantee shortest paths.",
    auditedCommit: "6fad8ed",
  },
  "uco-recovery-station": {
    claimClass: "original logic",
    ran: [
      "API in keyless test mode on a throwaway database: flow 13/13, status 17/17, admin 34/34, invariants 10/10",
      "Kiosk and dashboard build",
    ],
    read: ["Classifier rules and an integer grams-and-paise ledger"],
    notChecked: [
      "Payment status requires owner verification: README and PAYMENTS.md differ, and no live payment path was exercised",
      "Sensor hardware (calibration pending)",
    ],
    caveat: "This exhibit performs no transactions.",
    auditedCommit: "4460814",
  },
  "smart-parking-dbms": {
    claimClass: "simplified simulation",
    ran: [
      "Migrations, SQL tests and 18 API tests on a throwaway database",
      "Two simultaneous sessions were given different bays",
    ],
    read: ["Allocation uses FOR UPDATE SKIP LOCKED"],
    notChecked: ["Authenticated browser flows", "The live deployment"],
    caveat:
      "Sample bays, not the project's database. The second car is handed the next free bay, and the check-then-write branch is illustrative.",
    auditedCommit: "f4fe6b1",
  },
  "predictive-maintenance": {
    claimClass: "adapted algorithm",
    ran: [
      "28 tests pass",
      "FD001 and FD004 retrained: tracked result files match the committed ones",
    ],
    read: [
      "Engine-grouped split, sensor filter, scaling fit on training engines, RUL cap 125, 30-cycle windows",
    ],
    notChecked: [
      "Four output files were not regenerated",
      "The project's FD001 download script no longer works with NASA's archive",
    ],
    caveat:
      "Synthetic engines in the scene; the results shown are from the committed files.",
    auditedCommit: "9bb3742",
  },
  "football-penalty-shootout": {
    claimClass: "original logic",
    ran: ["Aiming, power, scoring and reset are covered by portfolio browser tests"],
    read: [
      "The standalone Penalty Kings repository: Three.js and Rapier physics, a four-level keeper AI, replays, touch and keyboard input, 27 unit tests",
    ],
    notChecked: [
      "The standalone game was not built, run or tested here",
      "The repository has no licence file, so none of its code or assets are reused",
    ],
    caveat:
      "The playable demo here is a small independent study; the standalone 3D game is a separate project linked from this page.",
    auditedCommit: null,
  },
  "green-mobility": {
    claimClass: "adapted algorithm",
    ran: ["The web archive builds with Maven", "The CO2 formula was run"],
    read: ["Seat-capacity booking rules"],
    notChecked: [
      "The application was not deployed (it needs Tomcat and MySQL)",
      "No automated tests exist",
    ],
    caveat: "An academic application that runs locally only.",
    auditedCommit: "85ae0c5",
  },
  aeris: {
    claimClass: "simplified simulation",
    ran: ["1042 unit tests pass"],
    read: ["Autonomy modules are implemented; the README is out of date"],
    notChecked: [
      "PX4 and Gazebo simulation tiers were not run",
      "No trained results are committed",
    ],
    caveat: "Simulation research in progress; no physical flight.",
    auditedCommit: "b55ca2f",
  },
  nexus: {
    claimClass: "illustrative walkthrough",
    ran: [],
    read: [
      "Phase reports 0 to 7 and the source: simulator adapter, PointGoal scoring, baselines, evaluator and PPO core are implemented",
      "Committed DEV summaries: trained blind agent 0.60 success against the scripted heuristic's 0.33 on 100 episodes of three small test scenes",
    ],
    notChecked: [
      "No tests were run here; the reported 470 + 171 + 1 passing were not re-run",
      "Phase 8's real experiments have not run (HM3D download pending)",
    ],
    caveat:
      "A research platform in progress. The one trained result is a DEV run and not a reportable result.",
    auditedCommit: "1defebc",
  },
  rupeerise: {
    claimClass: "adapted algorithm",
    ran: ["448 backend tests on a throwaway database, 38 frontend tests"],
    read: ["A deterministic engine using fictional money"],
    notChecked: [
      "Browser end-to-end tests",
      "The private answer-key bundle is not in the repository",
    ],
    caveat: "A team project; fictional money only.",
    auditedCommit: "5ec8f7c",
  },
  "resume-screener": {
    claimClass: "adapted algorithm",
    ran: [
      "615 tests pass, 31 of them against PostgreSQL",
      "The redaction demo was reproduced",
    ],
    read: ["Evidence-constrained scoring and injection handling"],
    notChecked: ["Live-model scoring and the fairness harness were not run"],
    caveat: "Synthetic data only. Not an audit of any hiring process.",
    auditedCommit: "3d7e8f0",
  },
  "last-mile-daa": {
    claimClass: "adapted algorithm",
    ran: ["417 tests pass"],
    read: [
      "Pipeline: shortest paths, spanning tree, knapsack selection, route sequencing",
      "The benchmark figures match the committed result files",
    ],
    notChecked: [
      "Optimality is not claimed",
      "The application was not launched",
    ],
    caveat:
      "Simplified versions on sample stops, not outputs of the Python solver.",
    auditedCommit: "6f5e800",
  },
  "burnout-backend": {
    claimClass: "link-out only",
    ran: ["15 tests pass (network denied)", "The API starts with and without its model"],
    read: ["Route schemas, validation and storage"],
    notChecked: [
      "Model quality was not re-evaluated",
      "Chat and plan features that need an external API key",
    ],
    caveat:
      "Link-out only. Not a clinical tool, and no live prediction is offered here.",
    auditedCommit: "488d4c1",
  },
  sigsmith: {
    claimClass: "design-stage",
    ran: [],
    read: ["A design blueprint of five documents"],
    notChecked: ["No implementation exists"],
    caveat: "Design-stage. There is nothing to run.",
    auditedCommit: "11253c8",
  },
  swarmmind: {
    claimClass: "simplified simulation",
    ran: [
      "494 tests and the audit script pass",
      "The committed trained actors were re-run with no differences",
    ],
    read: ["The study uses 3 robots on a 10 x 10 grid against random and frontier baselines"],
    notChecked: ["Retraining (5 to 7 hours per run) was not attempted"],
    caveat:
      "Only simplified baselines run in the scene. No claim of emergent coordination.",
    auditedCommit: "e2269fe",
  },
  pathable: {
    claimClass: "simplified simulation",
    ran: ["Backend 341, frontend 41 and ML pipeline 10 tests pass (Linux containers)"],
    read: ["Constraint rules per travel profile"],
    notChecked: [
      "22 of 504 route queries differ from the project's cost model",
      "10 image tests fail on macOS only; browser end-to-end tests were not run",
    ],
    caveat:
      "Fictional campus and a simplified cost model. The project's hazard inference is disabled.",
    auditedCommit: "7d29bba",
  },
  "parkscan-swarm": {
    claimClass: "simplified simulation",
    ran: [
      "826 tests with PostGIS and MQTT, the smoke test and 74 web tests",
      "The benchmark re-run matched byte for byte",
    ],
    read: ["A central coordinator over MQTT and PostGIS"],
    notChecked: ["The ROS 2 backend image was not built"],
    caveat:
      "A separate, simplified simulation. The robots are centrally coordinated, not a decentralised swarm.",
    auditedCommit: "48f3176",
  },
  "quadruped-rl": {
    claimClass: "illustrative walkthrough",
    ran: [
      "101 tests pass",
      "The domain-randomisation benchmark table was reproduced",
      "5 of 6 evaluation checks pass",
    ],
    read: ["Speech, intent, controller, PPO policy and MuJoCo chain"],
    notChecked: [
      "Walking fast fails the foot-slip check",
      "The voice chain and any hardware were not run",
    ],
    caveat: "The gait shown is a hand-written animation, not the trained policy.",
    auditedCommit: "86c8d3d",
  },
  "private-local-ai": {
    claimClass: "illustrative walkthrough",
    ran: [
      "301 tests pass (fake embedder)",
      "The scene's rank fusion matches the project's own code on its sample passages",
    ],
    read: [
      "Weighted rank fusion of keyword and meaning matches; retrieved text is fenced as untrusted",
    ],
    notChecked: ["Real models and the end-to-end app were not run"],
    caveat:
      "Sample notes only. No embedding or language model runs in the scene.",
    auditedCommit: "091da75",
  },
  lifeos: {
    claimClass: "illustrative walkthrough",
    ran: ["Lint and the production build pass"],
    read: ["Local-first storage with optional encrypted sync"],
    notChecked: ["The app was not launched", "No tests exist"],
    caveat: "Heuristic insights, not a scheduling algorithm.",
    auditedCommit: "0d63cbb",
  },
  aura: {
    claimClass: "illustrative walkthrough",
    ran: [
      "242 Swift tests and 22 bridge and frontend tests pass",
      "Frontend typecheck passes",
    ],
    read: [
      "A versioned bridge with 52 request methods and 18 push events",
      "A provider-neutral AI service and on-device speech",
    ],
    notChecked: [
      "The app itself was not run",
      "Hosted-model inference and microphone and speaker acceptance",
    ],
    caveat:
      "An illustrative model of AURA's structure. Nothing from the app runs here.",
    auditedCommit: "895ebc3",
  },
};
