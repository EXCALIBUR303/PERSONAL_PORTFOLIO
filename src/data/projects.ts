export type WorldKind =
  | "signals"
  | "maze"
  | "process"
  | "parking"
  | "maintenance"
  | "penalty"
  | "architecture";
export type ArchitectureNode = {
  id: string;
  label: string;
  description: string;
};
export type Architecture = {
  kind: string;
  nodes: ArchitectureNode[];
  edges: [string, string][];
};
export type Evidence = { label: string; path: string; url: string };
export type Project = {
  id: string;
  slug: string;
  repository: string;
  title: string;
  tagline: string;
  description: string;
  categories: string[];
  stack: string[];
  status: string;
  kind: WorldKind;
  accent: string;
  featured: boolean;
  githubUrl: string | null;
  liveUrl: string | null;
  sourceVisibility: "public" | "private";
  interactionLabel: string;
  overview: string;
  problem: string;
  solution: string;
  features: string[];
  limitations: string[];
  architecture: Architecture;
  sources: Evidence[];
  sourceCommit: string | null;
  eyebrow: string;
};
// Public source was audited on 2026-10-21. Evidence is pinned to the inspected commits.
// The football entry describes only the independently implemented portfolio demo.
export const projects: Project[] = [
  {
    id: "student-burnout-ai",
    slug: "student-burnout-ai",
    repository: "student-burnout-ai",
    title: "Student Burnout AI",
    tagline: "A human signal.",
    description:
      "A student well-being research application connecting a self-reported lifestyle questionnaire with a model-processing and personal-history interface.",
    categories: ["AI/ML", "Web Development"],
    stack: [
      "React",
      "JavaScript",
      "FastAPI",
      "Python",
      "SQLite",
      "scikit-learn",
      "XGBoost",
      "LightGBM",
    ],
    status: "Research prototype",
    kind: "signals",
    accent: "#79dce5",
    featured: true,
    githubUrl: "https://github.com/EXCALIBUR303/student-burnout-ai",
    liveUrl: null,
    sourceVisibility: "public",
    interactionLabel: "Source-backed pipeline explorer",
    overview:
      "A student well-being research application connecting a self-reported lifestyle questionnaire with a model-processing and personal-history interface.",
    features: [
      "React questionnaire and dashboard pages",
      "FastAPI prediction, history, insights and feedback endpoints",
      "SQLite persistence and authenticated account flows",
      "v5 stacking ensemble: XGBoost + LightGBM → LogisticRegression meta-learner",
      "18 model features: 7 objective lifestyle, 4 subjective, 7 engineered",
    ],
    limitations: [
      "Not a clinical or diagnostic instrument; no clinical validation established.",
      "Mixed/synthetic-source holdout metrics do not establish real-student predictive validity.",
      "v5 metadata reports primary holdout accuracy 0.7672 and macro-F1 0.7932, but real-lifestyle benchmark accuracy 0.337 and macro-F1 0.168. Prefer not highlighting a single accuracy figure.",
      "Trainer comments initially claim 19 features; actual feature arrays, model metadata and inference source have 18.",
      "Source includes older duplicate frontend/backend trees; current primary backend main.py tries v5 artifact before v4/v3/legacy.",
      "No model training or backend execution was rerun during this portfolio audit.",
    ],
    architecture: {
      kind: "Reconstructed from verified source",
      nodes: [
        {
          id: "questionnaire",
          label: "Lifestyle questionnaire",
          description:
            "React collects lifestyle and subjective self-reported inputs; not a diagnosis.",
        },
        {
          id: "api",
          label: "FastAPI input boundary",
          description:
            "POST /predict validates inputs and uses the loaded model artifact.",
        },
        {
          id: "features",
          label: "Feature preparation",
          description:
            "Objective + subjective values are normalized/clipped, then 7 engineered features are added.",
        },
        {
          id: "ensemble",
          label: "Stacking model",
          description:
            "XGBoost and LightGBM base estimators feed a LogisticRegression meta-estimator. v5 is not calibration-wrapped.",
        },
        {
          id: "history",
          label: "Insights & history",
          description:
            "Prediction response, human-readable drivers and SQLite-backed history support the UI.",
        },
      ],
      edges: [
        ["questionnaire", "api"],
        ["api", "features"],
        ["features", "ensemble"],
        ["ensemble", "history"],
      ],
    },
    sources: [
      {
        label: "Frontend stack",
        path: "burnout-frontend/package.json",
        url: "https://github.com/EXCALIBUR303/student-burnout-ai/blob/8f80e29eaf152938cba8cd094bb94afacf107289/burnout-frontend/package.json",
      },
      {
        label: "API, model loading and inference",
        path: "burnout-backend/main.py",
        url: "https://github.com/EXCALIBUR303/student-burnout-ai/blob/8f80e29eaf152938cba8cd094bb94afacf107289/burnout-backend/main.py",
      },
      {
        label: "Training/model implementation",
        path: "burnout-backend/trainer_v5.py",
        url: "https://github.com/EXCALIBUR303/student-burnout-ai/blob/8f80e29eaf152938cba8cd094bb94afacf107289/burnout-backend/trainer_v5.py",
      },
      {
        label: "Feature list and reported evaluation limitations",
        path: "burnout-backend/model_meta_v5.json",
        url: "https://github.com/EXCALIBUR303/student-burnout-ai/blob/8f80e29eaf152938cba8cd094bb94afacf107289/burnout-backend/model_meta_v5.json",
      },
      {
        label: "Backend dependencies",
        path: "burnout-backend/requirements.txt",
        url: "https://github.com/EXCALIBUR303/student-burnout-ai/blob/8f80e29eaf152938cba8cd094bb94afacf107289/burnout-backend/requirements.txt",
      },
    ],
    sourceCommit: "8f80e29eaf152938cba8cd094bb94afacf107289",
    eyebrow: "Intelligent systems / research",
    problem:
      "A lifestyle questionnaire can collect many signals, but interpreting them responsibly requires an explicit model boundary and honest evaluation.",
    solution:
      "Connect the questionnaire, feature preparation, ensemble inference, and personal history while making the research and non-clinical limits visible.",
  },
  {
    id: "mazera-ai-maze-solver",
    slug: "mazera-ai-maze-solver",
    repository: "mazera-ai-maze-solver",
    title: "Mazera AI Maze Solver",
    tagline: "Every path has a story.",
    description:
      "A browser graph-search visualizer comparing traversal order and final paths through generated mazes.",
    categories: ["Algorithms", "Interactive Systems"],
    stack: ["React", "JavaScript", "Vite", "Bootstrap", "Lucide"],
    status: "Implemented visualizer",
    kind: "maze",
    accent: "#d5f86e",
    featured: true,
    githubUrl: "https://github.com/EXCALIBUR303/mazera-ai-maze-solver",
    liveUrl: null,
    sourceVisibility: "public",
    interactionLabel: "Adapted algorithm demonstration",
    overview:
      "A browser graph-search visualizer comparing traversal order and final paths through generated mazes.",
    features: [
      "BFS, DFS, Dijkstra, A*, Greedy Best-First and Bidirectional search are implemented functions",
      "A* and Greedy accept Manhattan or Euclidean heuristics",
      "Random DFS-carved, Spiral, Zigzag and Open Field generators",
      "Visited order, path length, nodes explored, measured execution duration",
      "Recent maze history in browser-local state",
    ],
    limitations: [
      "Grid movements are four-connected and unweighted; do not imply terrain costs or neural-network inference.",
      "DFS and Greedy are not shortest-path guarantees.",
      "Random generation includes an even-size goal connector.",
      "The portfolio may adapt these algorithms in TypeScript, but should identify the scene as an adapted educational demonstration rather than an embedded original app.",
      "No production demo URL was verified.",
    ],
    architecture: {
      kind: "Source-backed browser architecture",
      nodes: [
        {
          id: "generator",
          label: "Maze generator",
          description:
            "Creates a grid for Random, Spiral, Zigzag or Open Field patterns.",
        },
        {
          id: "solver",
          label: "Graph search",
          description: "Select one of six implemented solver functions.",
        },
        {
          id: "trace",
          label: "Search trace",
          description:
            "Solver returns visitedOrder, path, nodesExplored, pathLength and executionTime.",
        },
        {
          id: "animation",
          label: "Traversal visualization",
          description:
            "UI animates the trace independently of search execution.",
        },
        {
          id: "history",
          label: "Browser history",
          description: "Recent local maze runs are retained in the browser.",
        },
      ],
      edges: [
        ["generator", "solver"],
        ["solver", "trace"],
        ["trace", "animation"],
        ["animation", "history"],
      ],
    },
    sources: [
      {
        label: "Features and run instructions",
        path: "README.md",
        url: "https://github.com/EXCALIBUR303/mazera-ai-maze-solver/blob/6fad8eddc8ad8c5d216ff9eb11d11c270572fb24/README.md",
      },
      {
        label: "All six actual solver functions",
        path: "src/algorithms/solvers.js",
        url: "https://github.com/EXCALIBUR303/mazera-ai-maze-solver/blob/6fad8eddc8ad8c5d216ff9eb11d11c270572fb24/src/algorithms/solvers.js",
      },
      {
        label: "Actual maze generators",
        path: "src/utils/maze.js",
        url: "https://github.com/EXCALIBUR303/mazera-ai-maze-solver/blob/6fad8eddc8ad8c5d216ff9eb11d11c270572fb24/src/utils/maze.js",
      },
      {
        label: "Visualizer UI",
        path: "src/main.jsx",
        url: "https://github.com/EXCALIBUR303/mazera-ai-maze-solver/blob/6fad8eddc8ad8c5d216ff9eb11d11c270572fb24/src/main.jsx",
      },
      {
        label: "Verified stack",
        path: "package.json",
        url: "https://github.com/EXCALIBUR303/mazera-ai-maze-solver/blob/6fad8eddc8ad8c5d216ff9eb11d11c270572fb24/package.json",
      },
    ],
    sourceCommit: "6fad8eddc8ad8c5d216ff9eb11d11c270572fb24",
    eyebrow: "Search / explore / discover",
    problem:
      "Graph-search strategies can reach the same goal through very different traversal orders. Those decisions are hard to understand from a final path alone.",
    solution:
      "Generate an unweighted maze, compute a search trace, and make each visited cell and final path inspectable.",
  },
  {
    id: "uco-recovery-station",
    slug: "uco-recovery-station",
    repository: "uco-recovery-station",
    title: "Cycoil · UCO Recovery Station",
    tagline: "A second life for every drop.",
    description:
      "A used-cooking-oil recovery software platform combining a touchscreen kiosk, sensor-decision backend and fleet dashboard.",
    categories: ["Sustainability", "Engineering", "Web Development"],
    stack: [
      "TypeScript",
      "NestJS",
      "Prisma",
      "PostgreSQL",
      "Preact",
      "Vite",
      "Next.js",
    ],
    status: "Software prototype · hardware calibration pending",
    kind: "process",
    accent: "#f5a17d",
    featured: true,
    githubUrl: "https://github.com/EXCALIBUR303/uco-recovery-station",
    liveUrl: null,
    sourceVisibility: "public",
    interactionLabel: "Classifier guide · illustrative samples",
    overview:
      "A used-cooking-oil recovery software platform combining a touchscreen kiosk, sensor-decision backend and fleet dashboard.",
    features: [
      "Kiosk session and pairing flow",
      "Backend classifier gates weight, capacitance and color in that order",
      "Accepted, rejected and ignored deposit states; below-threshold drips never count as offences",
      "Transactional offence counting and blacklist handling",
      "Integer grams and paise; reserve/capture/release wallet ledger",
      "Machine telemetry, effective status and dashboard notifications",
      "Admin/renter scoping and rental billing",
    ],
    limitations: [
      "Sensor calibration thresholds are placeholders until measured on real hardware.",
      "README states real money is not moving; payments default to mock Razorpay until real configuration.",
      "README has stale/inconsistent statements about phone signup and telemetry auth; avoid broad claims of complete production readiness.",
      "Do not invent filtration or biodiesel hardware stages: source verifies the software deposit/classification/payment workflow, not physical purification machinery.",
      "No environmental impact reduction numbers are established.",
      "No external service or physical hardware was exercised in this audit.",
    ],
    architecture: {
      kind: "Reconstructed from verified software modules",
      nodes: [
        {
          id: "kiosk",
          label: "Touchscreen kiosk",
          description:
            "Preact/Vite UI manages language, session, pairing and pour states.",
        },
        {
          id: "sensors",
          label: "Sensor input",
          description:
            "Simulated capacitance, color and load-cell weight feed the API. Hardware calibration is pending.",
        },
        {
          id: "classifier",
          label: "Server classifier",
          description:
            "Weight threshold → oil capacitance band → contamination check → color-quality gate.",
        },
        {
          id: "ledger",
          label: "Deposit & wallet ledger",
          description:
            "Prisma/PostgreSQL transactions record accepted/rejected/ignored outcomes and ledger changes.",
        },
        {
          id: "dashboard",
          label: "Fleet dashboard",
          description:
            "Next.js views expose machine status, scoped activity, depositors and billing.",
        },
      ],
      edges: [
        ["kiosk", "sensors"],
        ["sensors", "classifier"],
        ["classifier", "ledger"],
        ["ledger", "dashboard"],
      ],
    },
    sources: [
      {
        label: "Current scope and important mock/calibration limitations",
        path: "README.md",
        url: "https://github.com/EXCALIBUR303/uco-recovery-station/blob/44608149de81cd50ab75ad56e120fbbc5c0e84e1/README.md",
      },
      {
        label: "Pure classifier and integer payout arithmetic",
        path: "apps/api/src/kiosk/sensor-classifier.ts",
        url: "https://github.com/EXCALIBUR303/uco-recovery-station/blob/44608149de81cd50ab75ad56e120fbbc5c0e84e1/apps/api/src/kiosk/sensor-classifier.ts",
      },
      {
        label: "Deposit/session and offence transactions",
        path: "apps/api/src/kiosk/kiosk.service.ts",
        url: "https://github.com/EXCALIBUR303/uco-recovery-station/blob/44608149de81cd50ab75ad56e120fbbc5c0e84e1/apps/api/src/kiosk/kiosk.service.ts",
      },
      {
        label: "Implemented data model",
        path: "apps/api/prisma/schema.prisma",
        url: "https://github.com/EXCALIBUR303/uco-recovery-station/blob/44608149de81cd50ab75ad56e120fbbc5c0e84e1/apps/api/prisma/schema.prisma",
      },
      {
        label: "NestJS/Prisma/PostgreSQL dependencies",
        path: "apps/api/package.json",
        url: "https://github.com/EXCALIBUR303/uco-recovery-station/blob/44608149de81cd50ab75ad56e120fbbc5c0e84e1/apps/api/package.json",
      },
      {
        label: "Kiosk dependencies",
        path: "apps/kiosk/package.json",
        url: "https://github.com/EXCALIBUR303/uco-recovery-station/blob/44608149de81cd50ab75ad56e120fbbc5c0e84e1/apps/kiosk/package.json",
      },
      {
        label: "Dashboard dependencies",
        path: "apps/dashboard/package.json",
        url: "https://github.com/EXCALIBUR303/uco-recovery-station/blob/44608149de81cd50ab75ad56e120fbbc5c0e84e1/apps/dashboard/package.json",
      },
    ],
    sourceCommit: "44608149de81cd50ab75ad56e120fbbc5c0e84e1",
    eyebrow: "Sustainable systems / Cycoil",
    problem:
      "A recovery station needs to distinguish sensor input, accepted deposits, and ledger state without pretending uncalibrated hardware is production-ready.",
    solution:
      "Coordinate kiosk sessions, documented sensor gates, transactional deposit records, and a fleet dashboard. Physical purification is outside the verified software scope.",
  },
  {
    id: "smart-parking-dbms",
    slug: "smart-parking-dbms",
    repository: "DBMS_SMART_PARKING",
    title: "SmartPark DBMS",
    tagline: "A place for everything.",
    description:
      "A multi-level parking allocation and billing system whose relational database enforces capacity, tariff and access rules.",
    categories: ["Web Development", "Databases", "Interactive Systems"],
    stack: [
      "Python",
      "FastAPI",
      "PostgreSQL 17",
      "SQL",
      "HTML",
      "CSS",
      "JavaScript",
    ],
    status: "Implemented academic system",
    kind: "parking",
    accent: "#9bcab8",
    featured: true,
    githubUrl: "https://github.com/EXCALIBUR303/DBMS_SMART_PARKING",
    liveUrl: null,
    sourceVisibility: "public",
    interactionLabel: "Local simulation · synthetic occupancy",
    overview:
      "A multi-level parking allocation and billing system whose relational database enforces capacity, tariff and access rules.",
    features: [
      "Facility → floor → zone → slot hierarchy",
      "Free, reserved, occupied and out-of-service bay states with selectable details",
      "Gate entry/exit and row-locked slot allocation",
      "Reservations, parking passes, tariff-derived billing, payment records and violations",
      "17 implemented relations documented in a generated schema",
      "RLS and role-scoped APIs; reporting views",
    ],
    limitations: [
      "Payments are recorded, not processed through a payment gateway.",
      "A portfolio floor map must label its occupancy fixtures as simulated and must not imply connection to the deployed database.",
      "No real facility operation or revenue/occupancy impact is established.",
      "The README lists an external demo, but available access did not allow independent verification. No working external demo is advertised here.",
    ],
    architecture: {
      kind: "Source-backed relational/application architecture",
      nodes: [
        {
          id: "map",
          label: "Floor map UI",
          description:
            "Plain HTML/CSS/ES modules expose bays, status filters and detail sheets.",
        },
        {
          id: "api",
          label: "FastAPI application",
          description:
            "Role-scoped endpoints and connection-pool transactions mediate operations.",
        },
        {
          id: "allocation",
          label: "Allocation transaction",
          description:
            "Database row locks and constraints prevent conflicting slot allocation.",
        },
        {
          id: "session",
          label: "Parking session",
          description:
            "Vehicle, bay, reservation and entry/exit records relate to a parking_session.",
        },
        {
          id: "billing",
          label: "Tariff billing",
          description:
            "A database function derives charges from effective tariffs; payment rows record receipts.",
        },
      ],
      edges: [
        ["map", "api"],
        ["api", "allocation"],
        ["allocation", "session"],
        ["session", "billing"],
      ],
    },
    sources: [
      {
        label: "Scope, architecture and documented demo",
        path: "README.md",
        url: "https://github.com/EXCALIBUR303/DBMS_SMART_PARKING/blob/f4fe6b10e8ed189fe02afcf9931f960cd5c8b87a/README.md",
      },
      {
        label: "Row-lock allocation and gate lifecycle",
        path: "db/migrations/006_gate_transactions.sql",
        url: "https://github.com/EXCALIBUR303/DBMS_SMART_PARKING/blob/f4fe6b10e8ed189fe02afcf9931f960cd5c8b87a/db/migrations/006_gate_transactions.sql",
      },
      {
        label: "17 actual relations and keys",
        path: "docs/database/RELATIONAL_SCHEMA.md",
        url: "https://github.com/EXCALIBUR303/DBMS_SMART_PARKING/blob/f4fe6b10e8ed189fe02afcf9931f960cd5c8b87a/docs/database/RELATIONAL_SCHEMA.md",
      },
      {
        label: "Actual bay states and filters",
        path: "web/js/slots.js",
        url: "https://github.com/EXCALIBUR303/DBMS_SMART_PARKING/blob/f4fe6b10e8ed189fe02afcf9931f960cd5c8b87a/web/js/slots.js",
      },
      {
        label: "API boundaries and permissions",
        path: "docs/API.md",
        url: "https://github.com/EXCALIBUR303/DBMS_SMART_PARKING/blob/f4fe6b10e8ed189fe02afcf9931f960cd5c8b87a/docs/API.md",
      },
    ],
    sourceCommit: "f4fe6b10e8ed189fe02afcf9931f960cd5c8b87a",
    eyebrow: "Databases / allocation",
    problem:
      "Concurrent arrivals, reservations, and billing share limited parking capacity. Inconsistent application state can lead to conflicting allocations.",
    solution:
      "Use relational constraints, row-locked allocation, and tariff-aware database operations behind a role-scoped API.",
  },
  {
    id: "predictive-maintenance",
    slug: "predictive-maintenance",
    repository: "rul-predictive-maintenance",
    title: "Predictive Maintenance",
    tagline: "Ahead of the curve.",
    description:
      "A leakage-safe remaining-useful-life research pipeline comparing four model families on NASA C-MAPSS FD001 and FD004.",
    categories: ["AI/ML", "Engineering"],
    stack: [
      "Python",
      "PyTorch",
      "XGBoost",
      "scikit-learn",
      "NumPy",
      "pandas",
      "FastAPI",
    ],
    status: "Reproducible research pipeline",
    kind: "maintenance",
    accent: "#b8a0f0",
    featured: true,
    githubUrl: "https://github.com/EXCALIBUR303/rul-predictive-maintenance",
    liveUrl: null,
    sourceVisibility: "public",
    interactionLabel: "Pipeline guide · synthetic readings",
    overview:
      "A leakage-safe remaining-useful-life research pipeline comparing four model families on NASA C-MAPSS FD001 and FD004.",
    features: [
      "26-column C-MAPSS schema validation: engine ID, cycle, 3 settings and 21 sensors",
      "Engine-level train/validation split before preprocessing",
      "Training-only sensor filtering and scaling; six KMeans operating regimes for FD004",
      "30-cycle per-engine windows and a 125-cycle target cap",
      "XGBoost summary-feature baseline versus LSTM, GRU and small Transformer",
      "Three fixed experiment seeds and committed per-seed/aggregate results",
      "FastAPI loads the same persisted preprocessor/window code for inference",
    ],
    limitations: [
      "C-MAPSS is simulated turbofan degradation data, not live industrial telemetry.",
      "Model checkpoints and raw data are not committed; portfolio must not pretend the full model is loaded.",
      "Predictions are point estimates; API explicitly returns no calibrated per-prediction confidence.",
      "Reported metrics belong to the repository experiments, not an independent reproduction in this audit.",
      "A digital twin and machine-component labels would be illustrative spatial metaphors for the pipeline, not a validated physical turbine replica.",
    ],
    architecture: {
      kind: "Source-backed ML pipeline",
      nodes: [
        {
          id: "data",
          label: "C-MAPSS trajectories",
          description:
            "FD001/FD004 sensor trajectories and official test labels are validated before use.",
        },
        {
          id: "split",
          label: "Engine-level split",
          description:
            "Training and validation engines separate before any fitting; official test remains held out.",
        },
        {
          id: "preprocess",
          label: "Training-only preprocessing",
          description:
            "Sensor filtering, MinMax scaling and optional FD004 KMeans regimes persist as artifacts.",
        },
        {
          id: "windows",
          label: "30-cycle context",
          description:
            "Window construction stays within each engine; XGBoost summaries and neural sequences share context.",
        },
        {
          id: "model",
          label: "Four model families",
          description:
            "XGBoost, LSTM, GRU and Transformer are compared using MAE, RMSE and NASA score.",
        },
        {
          id: "serve",
          label: "Point-estimate API",
          description:
            "Saved preprocessor, config and chosen model produce bounded RUL point estimates.",
        },
      ],
      edges: [
        ["data", "split"],
        ["split", "preprocess"],
        ["preprocess", "windows"],
        ["windows", "model"],
        ["model", "serve"],
      ],
    },
    sources: [
      {
        label: "Protocol and reported results",
        path: "README.md",
        url: "https://github.com/EXCALIBUR303/rul-predictive-maintenance/blob/9bb3742068623e99945a7ba9d66011e4c312eb37/README.md",
      },
      {
        label: "FD001 configuration",
        path: "configs/fd001.yaml",
        url: "https://github.com/EXCALIBUR303/rul-predictive-maintenance/blob/9bb3742068623e99945a7ba9d66011e4c312eb37/configs/fd001.yaml",
      },
      {
        label: "FD004 configuration",
        path: "configs/fd004.yaml",
        url: "https://github.com/EXCALIBUR303/rul-predictive-maintenance/blob/9bb3742068623e99945a7ba9d66011e4c312eb37/configs/fd004.yaml",
      },
      {
        label: "Train-fitted scaling and regime handling",
        path: "src/rul_pm/data/preprocess.py",
        url: "https://github.com/EXCALIBUR303/rul-predictive-maintenance/blob/9bb3742068623e99945a7ba9d66011e4c312eb37/src/rul_pm/data/preprocess.py",
      },
      {
        label: "Actual neural models",
        path: "src/rul_pm/models/torch_models.py",
        url: "https://github.com/EXCALIBUR303/rul-predictive-maintenance/blob/9bb3742068623e99945a7ba9d66011e4c312eb37/src/rul_pm/models/torch_models.py",
      },
      {
        label: "Artifact loading and point-confidence limitation",
        path: "src/rul_pm/api/app.py",
        url: "https://github.com/EXCALIBUR303/rul-predictive-maintenance/blob/9bb3742068623e99945a7ba9d66011e4c312eb37/src/rul_pm/api/app.py",
      },
      {
        label: "Reported FD001 measurements",
        path: "results/FD001/model_comparison.json",
        url: "https://github.com/EXCALIBUR303/rul-predictive-maintenance/blob/9bb3742068623e99945a7ba9d66011e4c312eb37/results/FD001/model_comparison.json",
      },
      {
        label: "Reported FD004 measurements",
        path: "results/FD004/model_comparison.json",
        url: "https://github.com/EXCALIBUR303/rul-predictive-maintenance/blob/9bb3742068623e99945a7ba9d66011e4c312eb37/results/FD004/model_comparison.json",
      },
    ],
    sourceCommit: "9bb3742068623e99945a7ba9d66011e4c312eb37",
    eyebrow: "Sensor data / remaining useful life",
    problem:
      "Remaining-useful-life comparisons can become misleading if information leaks between engines or preprocessing is fitted on evaluation data.",
    solution:
      "Split engines before fitting, preserve preprocessing artifacts, and compare a common 30-cycle context across four model families.",
  },
  {
    id: "football-penalty-shootout",
    slug: "football-penalty-shootout",
    repository: "FootBall_Penalty_Shootout",
    title: "Penalty Shootout",
    tagline: "One ball. Three possibilities.",
    description:
      "An original, playable penalty study. The listed football repository is private, so this experience is independently implemented.",
    categories: ["Interactive Systems"],
    stack: ["React", "TypeScript", "SVG"],
    status: "Independent portfolio study",
    kind: "penalty",
    accent: "#82cda0",
    featured: true,
    githubUrl: null,
    liveUrl: null,
    sourceVisibility: "private",
    interactionLabel: "Original playable demo · not the private game",
    overview:
      "Choose your shot, set the power and read the goalkeeper. This lightweight local game is an original portfolio interaction. The private football repository was not inspected or embedded, and no claims are made about its implementation.",
    features: [
      "Keyboard-operable aim and power controls",
      "Deterministic goalkeeper sequence and local scoring",
      "No network requests, account or saved game data",
    ],
    limitations: [
      "The private repository source was not read or reproduced.",
      "The controls, game rules and technology tags describe this portfolio study only.",
      "This is a small original demonstration, not a deployment of the private game.",
    ],
    architecture: {
      kind: "Architecture of this independent portfolio demo",
      nodes: [
        {
          id: "aim",
          label: "Shot controls",
          description:
            "Local React state records left, center or right aim and a power setting.",
        },
        {
          id: "flight",
          label: "Shot resolution",
          description:
            "A deterministic goalkeeper sequence and power bounds resolve each local shot.",
        },
        {
          id: "result",
          label: "Local scoreboard",
          description:
            "The SVG pitch and session-only score update; no backend is involved.",
        },
      ],
      edges: [
        ["aim", "flight"],
        ["flight", "result"],
      ],
    },
    sources: [],
    sourceCommit: null,
    eyebrow: "Play / aim / repeat",
    problem:
      "A portfolio game should offer a meaningful interaction without exposing a private project or pretending to run its source.",
    solution:
      "Build an original local penalty study with clear controls, deterministic shot resolution, and a session-only scoreboard.",
  },
  {
    id: "green-mobility",
    slug: "green-mobility",
    repository: "pbl6-green-mobility",
    title: "Campus Green Mobility",
    tagline: "More people. Fewer journeys.",
    description:
      "Campus EV-shuttle and shared-bike booking with atomic seat-capacity checks and estimated carbon savings.",
    categories: ["Sustainability", "Web Development"],
    stack: ["Java", "JSP", "JDBC", "MySQL", "Maven", "Tomcat", "Bootstrap"],
    status: "Academic application",
    kind: "architecture",
    accent: "#b9d895",
    featured: false,
    githubUrl: "https://github.com/EXCALIBUR303/pbl6-green-mobility",
    liveUrl: null,
    sourceVisibility: "public",
    interactionLabel: "Source-backed architecture explorer",
    overview:
      "Campus EV-shuttle and shared-bike booking with atomic seat-capacity checks and estimated carbon savings.",
    features: [
      "Server-rendered browse → confirm → atomic booking → history flow",
      "JDBC DAO and JavaBean model boundaries",
      "Atomic UPDATE WHERE booked_count < capacity prevents last-seat conflict",
      "Monthly archive/close-out and points/feedback code exists",
      "Carbon estimate uses distance × difference in simplified emission factors",
    ],
    limitations: [
      "Carbon values are estimates from simplified factors, not measured environmental savings.",
      "README has stale three-table descriptions although migrations add points, feedback and archives.",
      "Local Tomcat deployment documented; no verified external demo URL.",
      "Do not publish sample accounts or credentials from the public README.",
    ],
    architecture: {
      kind: "Reconstructed from source",
      nodes: [
        {
          id: "jsp",
          label: "JSP pages",
          description: "Server-rendered UI and session-based authentication.",
        },
        {
          id: "dao",
          label: "JDBC DAOs",
          description:
            "Java service/DAO layer handles students, slots and bookings.",
        },
        {
          id: "capacity",
          label: "Atomic booking",
          description:
            "A guarded UPDATE reserves capacity without overbooking.",
        },
        {
          id: "db",
          label: "MySQL records",
          description:
            "Bookings remain permanent; monthly archives snapshot counters.",
        },
        {
          id: "carbon",
          label: "Estimated CO₂",
          description:
            "Simplified per-km mode factors create an educational savings estimate.",
        },
      ],
      edges: [
        ["jsp", "dao"],
        ["dao", "capacity"],
        ["capacity", "db"],
        ["db", "carbon"],
      ],
    },
    sources: [
      {
        label: "Scope and academic stack",
        path: "README.md",
        url: "https://github.com/EXCALIBUR303/pbl6-green-mobility/blob/85ae0c58509590a1743d45e0c0c841b3087cc47f/README.md",
      },
      {
        label: "Explicitly simplified CO₂ formula",
        path: "src/main/java/com/woxsen/greenmobility/util/CarbonCalculator.java",
        url: "https://github.com/EXCALIBUR303/pbl6-green-mobility/blob/85ae0c58509590a1743d45e0c0c841b3087cc47f/src/main/java/com/woxsen/greenmobility/util/CarbonCalculator.java",
      },
      {
        label: "Capacity enforcement source",
        path: "src/main/java/com/woxsen/greenmobility/dao/SlotDAO.java",
        url: "https://github.com/EXCALIBUR303/pbl6-green-mobility/blob/85ae0c58509590a1743d45e0c0c841b3087cc47f/src/main/java/com/woxsen/greenmobility/dao/SlotDAO.java",
      },
    ],
    sourceCommit: "85ae0c58509590a1743d45e0c0c841b3087cc47f",
    eyebrow: "Mobility / booking systems",
    problem:
      "Understanding a technical project requires following its actual boundaries and implementation, rather than inferring a system from its title.",
    solution:
      "Campus EV-shuttle and shared-bike booking with atomic seat-capacity checks and estimated carbon savings.",
  },
  {
    id: "aeris",
    slug: "aeris",
    repository: "aeris",
    title: "AERIS",
    tagline: "Navigation, reconsidered.",
    description:
      "A simulated drone-autonomy research platform with mapping, planning, mission and learning modules above external PX4 flight control.",
    categories: ["Engineering", "Algorithms", "AI/ML"],
    stack: [
      "Python",
      "NumPy",
      "PyTorch",
      "Gymnasium",
      "PX4 SITL",
      "Gazebo Harmonic",
    ],
    status: "Simulation research · in progress",
    kind: "architecture",
    accent: "#96c6f0",
    featured: false,
    githubUrl: "https://github.com/EXCALIBUR303/aeris",
    liveUrl: null,
    sourceVisibility: "public",
    interactionLabel: "Source-backed architecture explorer",
    overview:
      "A simulated drone-autonomy research platform with mapping, planning, mission and learning modules above external PX4 flight control.",
    features: [
      "Implemented 8-connected A* with octile heuristic and configurable unknown-cell cost",
      "Mapping, localization, navigation, mission and evaluation source modules",
      "PPO implementation and feed-forward/recurrent networks described in phase-14 report",
      "FastSim and higher-fidelity simulation boundaries documented",
    ],
    limitations: [
      "README phase-2 status table is stale; phase reports through 14 and actual later source are the stronger evidence.",
      "Do not claim all 34 roadmap phases or physical autonomous flight are completed.",
      "Physical flight is explicitly out of scope.",
      "Phase-14 report retains a flaky simulation boot failure and says no Tier H runs in that phase; do not erase reported limitations.",
      "Research benchmarks were not independently rerun during this portfolio audit.",
    ],
    architecture: {
      kind: "Source-backed reconstruction; not a live simulator",
      nodes: [
        {
          id: "simulation",
          label: "Simulation boundary",
          description:
            "PX4 SITL and Gazebo are external, pinned simulation dependencies.",
        },
        {
          id: "mapping",
          label: "Perception & mapping",
          description:
            "Sensor projections, voxels and band-grid mapping expose navigation inputs.",
        },
        {
          id: "planning",
          label: "A* planner",
          description:
            "8-connected octile search never traverses occupied cells.",
        },
        {
          id: "policy",
          label: "Learning layer",
          description:
            "PyTorch PPO and recurrent networks are isolated to learning modules.",
        },
        {
          id: "mission",
          label: "Mission & evaluation",
          description:
            "Mission states, replay and metrics keep experiments inspectable.",
        },
      ],
      edges: [
        ["simulation", "mapping"],
        ["mapping", "planning"],
        ["mapping", "policy"],
        ["planning", "mission"],
        ["policy", "mission"],
      ],
    },
    sources: [
      {
        label: "Project boundaries; status table is stale",
        path: "README.md",
        url: "https://github.com/EXCALIBUR303/aeris/blob/b55ca2fb161b4b5d6f1be01bce70dcd8ea1539db/README.md",
      },
      {
        label: "Implemented A*",
        path: "aeris/autonomy/planning/astar.py",
        url: "https://github.com/EXCALIBUR303/aeris/blob/b55ca2fb161b4b5d6f1be01bce70dcd8ea1539db/aeris/autonomy/planning/astar.py",
      },
      {
        label: "Later implementation/report and limitations",
        path: "docs/phase_reports/phase-14.md",
        url: "https://github.com/EXCALIBUR303/aeris/blob/b55ca2fb161b4b5d6f1be01bce70dcd8ea1539db/docs/phase_reports/phase-14.md",
      },
      {
        label: "Package and optional dependency boundaries",
        path: "pyproject.toml",
        url: "https://github.com/EXCALIBUR303/aeris/blob/b55ca2fb161b4b5d6f1be01bce70dcd8ea1539db/pyproject.toml",
      },
    ],
    sourceCommit: "b55ca2fb161b4b5d6f1be01bce70dcd8ea1539db",
    eyebrow: "Simulation / autonomy research",
    problem:
      "Understanding a technical project requires following its actual boundaries and implementation, rather than inferring a system from its title.",
    solution:
      "A simulated drone-autonomy research platform with mapping, planning, mission and learning modules above external PX4 flight control.",
  },
  {
    id: "rupeerise",
    slug: "rupeerise",
    repository: "IIIT_HACKATHON",
    title: "RupeeRise",
    tagline: "Learn money by doing.",
    description:
      "A student financial-literacy platform using deterministic, fictional-money simulations and explainable learning progression.",
    categories: ["Web Development", "Interactive Systems"],
    stack: [
      "React",
      "TypeScript",
      "Vite",
      "Tailwind CSS",
      "FastAPI",
      "SQLAlchemy",
      "PostgreSQL",
      "Motion",
    ],
    status: "Team academic/hackathon project",
    kind: "architecture",
    accent: "#f0c57c",
    featured: false,
    githubUrl: "https://github.com/EXCALIBUR303/IIIT_HACKATHON",
    liveUrl: null,
    sourceVisibility: "public",
    interactionLabel: "Source-backed architecture explorer",
    overview:
      "A student financial-literacy platform using deterministic, fictional-money simulations and explainable learning progression.",
    features: [
      "Budget, savings, investing and financial-safety simulations",
      "Deterministic Python calculations; no LLM in numerical outcomes",
      "Adaptive learning/mastery and educator-class views",
      "Optional grounded tutor with deterministic fallback",
      "React/TypeScript frontend and modular FastAPI/PostgreSQL backend",
    ],
    limitations: [
      "Five-member team project; do not imply sole authorship or invent the owner's specific responsibility.",
      "README says built for IIIT Hyderabad Megathon 2026; no award or placement verified.",
      "Fictional money and educational simulations, not financial recommendations.",
      "Private answer-key bundle is excluded from public source; do not fetch it or imply production keys are present.",
      "Repository-stated test totals were not rerun in this audit.",
    ],
    architecture: {
      kind: "Reconstructed from verified public source",
      nodes: [
        {
          id: "spa",
          label: "React learning UI",
          description: "Persona-driven activities and visual feedback.",
        },
        {
          id: "api",
          label: "FastAPI monolith",
          description: "JSON/JWT API validates learner actions.",
        },
        {
          id: "engine",
          label: "Deterministic engine",
          description:
            "Budget, savings, investing and safety calculations use explicit rules.",
        },
        {
          id: "learning",
          label: "Mastery layer",
          description:
            "Scoring, misconception handling and adaptive rules select next activities.",
        },
        {
          id: "db",
          label: "PostgreSQL progress",
          description:
            "Learner progress, fictional ledger and class scope persist.",
        },
      ],
      edges: [
        ["spa", "api"],
        ["api", "engine"],
        ["engine", "learning"],
        ["learning", "db"],
      ],
    },
    sources: [
      {
        label: "Scope, team and limitations",
        path: "README.md",
        url: "https://github.com/EXCALIBUR303/IIIT_HACKATHON/blob/5ec8f7cada7bb187863aaeadc1182e8c1ea19361/README.md",
      },
      {
        label: "Actual frontend dependencies",
        path: "frontend/package.json",
        url: "https://github.com/EXCALIBUR303/IIIT_HACKATHON/blob/5ec8f7cada7bb187863aaeadc1182e8c1ea19361/frontend/package.json",
      },
      {
        label: "Deterministic calculation implementation",
        path: "backend/app/engine/budget.py",
        url: "https://github.com/EXCALIBUR303/IIIT_HACKATHON/blob/5ec8f7cada7bb187863aaeadc1182e8c1ea19361/backend/app/engine/budget.py",
      },
    ],
    sourceCommit: "5ec8f7cada7bb187863aaeadc1182e8c1ea19361",
    eyebrow: "Financial literacy / RupeeRise",
    problem:
      "Understanding a technical project requires following its actual boundaries and implementation, rather than inferring a system from its title.",
    solution:
      "A student financial-literacy platform using deterministic, fictional-money simulations and explainable learning progression.",
  },
  {
    id: "resume-screener",
    slug: "resume-screener",
    repository: "resume-screener",
    title: "Privacy-first Resume Screener",
    tagline: "Evidence before a score.",
    description:
      "A resume research system that separates untrusted-document parsing/redaction from retrieval and evidence-constrained scoring.",
    categories: ["AI/ML", "Web Development"],
    stack: [
      "Python",
      "FastAPI",
      "PostgreSQL",
      "pgvector",
      "Next.js",
      "Ollama",
      "fastembed",
      "Presidio",
      "spaCy",
      "Tesseract",
      "Docker",
    ],
    status: "Research / portfolio system",
    kind: "architecture",
    accent: "#df9bc8",
    featured: false,
    githubUrl: "https://github.com/EXCALIBUR303/resume-screener",
    liveUrl: null,
    sourceVisibility: "public",
    interactionLabel: "Source-backed architecture explorer",
    overview:
      "A resume research system that separates untrusted-document parsing/redaction from retrieval and evidence-constrained scoring.",
    features: [
      "PDF/DOCX ingestion with byte validation and optional OCR",
      "Redaction and pseudonymization before embedding or prompting",
      "PostgreSQL job queue with FOR UPDATE SKIP LOCKED; pgvector retrieval",
      "Deterministic + model terms with evidence checks and capped model contribution",
      "Next.js interface and interview-copilot source",
    ],
    limitations: [
      "Decision support/research only; not audited for bias and not a compliant automated employment-decision tool.",
      "README explicitly says not to use real candidate data.",
      "No Redis dependency: a sample synthetic resume mentions Redis, but the actual queue uses PostgreSQL.",
      "Audio answers explicitly declined; do not imply audio/video multimodal processing.",
      "Hybrid retrieval does not outperform lexical retrieval on the published synthetic corpus; no broad superiority claim.",
      "No live model or pipeline was executed in this audit.",
    ],
    architecture: {
      kind: "Source-backed reconstruction",
      nodes: [
        {
          id: "ingest",
          label: "Upload quarantine",
          description: "File validation gates PDF/DOCX ingestion.",
        },
        {
          id: "parse",
          label: "Isolated parse worker",
          description:
            "Extract text or OCR, then redact and pseudonymize before reasoning.",
        },
        {
          id: "retrieve",
          label: "Chunk & retrieve",
          description:
            "Embeddings and lexical/vector retrieval use PostgreSQL/pgvector.",
        },
        {
          id: "score",
          label: "Evidence-checked scoring",
          description:
            "Deterministic terms and capped model contribution require source evidence.",
        },
        {
          id: "ui",
          label: "Explanation UI",
          description:
            "Next.js exposes ranked candidates and itemized decision support.",
        },
      ],
      edges: [
        ["ingest", "parse"],
        ["parse", "retrieve"],
        ["retrieve", "score"],
        ["score", "ui"],
      ],
    },
    sources: [
      {
        label: "Architecture, actual stack and candid limitations",
        path: "README.md",
        url: "https://github.com/EXCALIBUR303/resume-screener/blob/3d7e8f0e2ab71cca28e614c6d8c2a55af213f3fd/README.md",
      },
      {
        label: "Backend dependencies",
        path: "apps/api/pyproject.toml",
        url: "https://github.com/EXCALIBUR303/resume-screener/blob/3d7e8f0e2ab71cca28e614c6d8c2a55af213f3fd/apps/api/pyproject.toml",
      },
      {
        label: "Scoring fusion implementation",
        path: "apps/api/src/screener_api/scoring/fusion.py",
        url: "https://github.com/EXCALIBUR303/resume-screener/blob/3d7e8f0e2ab71cca28e614c6d8c2a55af213f3fd/apps/api/src/screener_api/scoring/fusion.py",
      },
    ],
    sourceCommit: "3d7e8f0e2ab71cca28e614c6d8c2a55af213f3fd",
    eyebrow: "Document intelligence / retrieval",
    problem:
      "Understanding a technical project requires following its actual boundaries and implementation, rather than inferring a system from its title.",
    solution:
      "A resume research system that separates untrusted-document parsing/redaction from retrieval and evidence-constrained scoring.",
  },
];

export const categories = [
  "All worlds",
  "AI/ML",
  "Algorithms",
  "Sustainability",
  "Engineering",
  "Databases",
  "Web Development",
  "Interactive Systems",
] as const;
export const getProject = (slug: string) =>
  projects.find((project) => project.slug === slug);
