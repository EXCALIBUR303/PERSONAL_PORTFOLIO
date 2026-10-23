export type WorldKind =
  | "signals"
  | "maze"
  | "process"
  | "parking"
  | "maintenance"
  | "penalty"
  | "architecture"
  | "unavailable";
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
export type ProjectCollection = "College" | "Personal";
export type ProjectDiscipline = "Software" | "Hardware" | "Unverified";
export type DemoInfo = {
  type: "embedded" | "simulation" | "local" | "unavailable";
  url: string | null;
  summary: string;
  commands: string[];
  environment: { name: string; purpose: string }[];
  runtimeStatus: string;
  testStatus: string;
  verifiedOn: string;
  notes: string[];
};
export type Project = {
  collection: ProjectCollection;
  discipline: ProjectDiscipline;
  classificationNote: string;
  demo: DemoInfo;
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
// Source audit: 2026-10-21–22. Evidence is pinned; bounded execution is recorded per project.
// The football entry describes only the independently implemented portfolio demo.
export const projects: Project[] = [
  {
    id: "student-burnout-ai",
    collection: "College",
    discipline: "Software",
    classificationNote:
      "Collection confirmed by the project owner. Physical hardware completion has not been verified.",
    demo: {
      type: "simulation",
      url: null,
      summary:
        "Explore the documented idea through a local interactive demonstration. Original services are not connected.",
      commands: [
        "# From the original repository root. Run frontend and backend in separate terminals.",
        "cd burnout-frontend",
        "npm ci --ignore-scripts",
        "npm start",
        "# Backend, from the repository root:",
        "cd burnout-backend",
        "python3.12 -m venv .venv",
        "source .venv/bin/activate",
        "pip install -r requirements.txt",
        "uvicorn main:app --host 127.0.0.1 --port 8000",
      ],
      environment: [
        {
          name: "JWT_SECRET",
          purpose: "Private signing secret for local accounts.",
        },
        {
          name: "GEMINI_API_KEY",
          purpose:
            "Optional wellness chatbot API key; offline fallback without it.",
        },
      ],
      runtimeStatus:
        "Original React production build passed. Model inference and the complete backend were not run.",
      testStatus:
        "1 SQLite feedback test passed. Frontend Jest suite failed to resolve react-router-dom; no frontend tests executed.",
      verifiedOn: "2026-10-22",
      notes: [
        "Portfolio interaction explains the pipeline; it does not diagnose burnout or run the trained model.",
        "Full startup loads committed model artifacts; those were not deserialized in this audit.",
      ],
    },
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
      "Model training and inference were not rerun; bounded verification is documented in the execution bay.",
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
    collection: "Personal",
    discipline: "Software",
    classificationNote:
      "Collection confirmed by the project owner. Physical hardware completion has not been verified.",
    demo: {
      type: "embedded",
      url: "/demos/mazera/",
      summary:
        "Launch the original Mazera React application: six real search algorithms, maze generation, replay controls and browser-local history.",
      commands: [
        "git clone https://github.com/EXCALIBUR303/mazera-ai-maze-solver.git",
        "cd mazera-ai-maze-solver",
        "npm ci --ignore-scripts",
        "npm run dev",
      ],
      environment: [],
      runtimeStatus:
        "Original production build and all six solver browser workflows passed.",
      testStatus:
        "168 direct solver/generator/grid checks passed. No repository test suite is supplied.",
      verifiedOn: "2026-10-22",
      notes: [
        "Original desktop interface needs horizontal scrolling on small screens.",
        "The Memory Usage chart counts explored nodes plus path length; it does not measure bytes.",
        "DFS and Greedy do not guarantee shortest paths. The original Step control replays the animation.",
        "Classical search algorithms; no neural inference service.",
      ],
    },
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
    collection: "College",
    discipline: "Software",
    classificationNote:
      "Collection confirmed by the project owner. Physical hardware completion has not been verified.",
    demo: {
      type: "simulation",
      url: null,
      summary:
        "Explore the documented idea through a local interactive demonstration. Original services are not connected.",
      commands: [
        "npm ci --ignore-scripts",
        "npm run db:generate -w @uco/api",
        "# Configure local PostgreSQL and the API environment before migration.",
        "npm run db:migrate",
        "npm run dev:api",
        "# Separate terminals from the repository root:",
        "npm run dev -w @uco/kiosk",
        "npm run dev -w @uco/dashboard",
      ],
      environment: [
        {
          name: "DATABASE_URL",
          purpose: "Local PostgreSQL connection.",
        },
        {
          name: "JWT_SECRET",
          purpose: "Private authentication signing secret.",
        },
      ],
      runtimeStatus:
        "Original kiosk and dashboard builds passed. API build blocked by missing generated Prisma client; Prisma engine download returned HTTP 403.",
      testStatus:
        "5 original classifier branches and 2 integer payout checks passed; database and payment workflows not run.",
      verifiedOn: "2026-10-22",
      notes: [
        "Portfolio station is an illustrative software simulation. No physical station or real payment is connected.",
        "A local database is required. Payment integration is optional and unverified here.",
      ],
    },
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
    collection: "College",
    discipline: "Software",
    classificationNote:
      "Collection confirmed by the project owner. Physical hardware completion has not been verified.",
    demo: {
      type: "simulation",
      url: null,
      summary:
        "Explore the documented idea through a local interactive demonstration. Original services are not connected.",
      commands: [
        "# Requires a local PostgreSQL server; run in the original repository root.",
        "./setup.sh",
        "./.venv/bin/uvicorn api.main:app --port 8077",
      ],
      environment: [
        {
          name: "SMARTPARK_DATABASE_URL",
          purpose: "Local PostgreSQL database connection.",
        },
        {
          name: "SMARTPARK_JWT_SECRET",
          purpose: "Private authentication signing secret.",
        },
      ],
      runtimeStatus:
        "API startup attempted; PostgreSQL connection pool timed out because no database was configured.",
      testStatus:
        "Database and authenticated end-to-end tests not run; local portfolio parking simulation is tested separately.",
      verifiedOn: "2026-10-22",
      notes: [
        "The interactive parking lot is a browser-only demonstration, not connected to the original database.",
        "Original setup creates local database/schema resources; use a dedicated development database.",
      ],
    },
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
    collection: "Personal",
    discipline: "Software",
    classificationNote:
      "Collection confirmed by the project owner. Physical hardware completion has not been verified.",
    demo: {
      type: "simulation",
      url: null,
      summary:
        "The portfolio shows a synthetic sensor demonstration. The original API needs locally trained artifacts.",
      commands: [
        "make install-all",
        "make data-fd001",
        "make train-xgboost-fd001",
        "export RULPM_ARTIFACT_DIR=runs/FD001/xgboost/latest",
        "make serve",
      ],
      environment: [
        {
          name: "RULPM_ARTIFACT_DIR",
          purpose:
            "Directory containing a locally trained model, preprocessor, config and metadata.",
        },
      ],
      runtimeStatus:
        "Actual Uvicorn API started on 127.0.0.1:18321; GET /health returned HTTP 200 with loaded:false.",
      testStatus:
        "18 selected repository ingestion, targets, preprocessing, sequence-window, metric, EDA and download-script tests passed.",
      verifiedOn: "2026-10-22",
      notes: [
        "Raw C-MAPSS data and trained artifacts not committed",
        "No full model inference or training reproduction",
        "NASA C-MAPSS is simulated degradation data, not physical sensor integration.",
        "First bounded startup check ended before scientific imports completed; second startup succeeded.",
        "API was shut down after local verification; this is not a live public demo.",
      ],
    },
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
    collection: "Personal",
    discipline: "Software",
    classificationNote:
      "Collection confirmed by the project owner. Physical hardware completion has not been verified.",
    demo: {
      type: "simulation",
      url: null,
      summary:
        "An original browser penalty game built for this portfolio. It does not reproduce or expose the private project.",
      commands: [],
      environment: [],
      runtimeStatus: "Runs entirely in this portfolio using local game state.",
      testStatus:
        "Shot, score, mode and reset behavior are covered by portfolio browser tests.",
      verifiedOn: "2026-10-22",
      notes: [
        "Independent portfolio implementation; private repository contents were not inspected.",
      ],
    },
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
    collection: "College",
    discipline: "Software",
    classificationNote:
      "Collection confirmed by the project owner. Physical hardware completion has not been verified.",
    demo: {
      type: "local",
      url: null,
      summary:
        "Explore the documented idea through a local interactive demonstration. Original services are not connected.",
      commands: [
        "# Requires Java, Maven, Tomcat and a configured local MySQL database.",
        "mvn clean package",
        "# Deploy target/green-mobility.war to your local Tomcat webapps directory.",
      ],
      environment: [],
      runtimeStatus:
        "Full Java application not run: this workspace lacks javac, Maven, Tomcat and configured MySQL.",
      testStatus:
        "Java utility test harness prepared, but not executed because the JDK compiler is unavailable.",
      verifiedOn: "2026-10-22",
      notes: [
        "Carbon savings are estimates using fixed factors, not measured emissions.",
        "Portfolio guide does not book real vehicles or connect to MySQL.",
      ],
    },
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
    collection: "Personal",
    discipline: "Software",
    classificationNote:
      "Collection confirmed by the project owner. Physical hardware completion has not been verified.",
    demo: {
      type: "local",
      url: null,
      summary:
        "Inspect the source-backed component guide, then run the original application locally with its required services.",
      commands: [
        "uv sync --extra sim --extra dev",
        "uv run python -m aeris.cli sim up --profile headless_x500",
        "uv run pytest -q tests/unit/autonomy/planning/test_astar.py",
      ],
      environment: [
        {
          name: "AERIS_PX4_DIR",
          purpose:
            "Path to externally built PX4-Autopilot checkout; Gazebo Harmonic also required.",
        },
      ],
      runtimeStatus:
        "CLI simulation startup attempted and failed explicitly with Px4NotFoundError: external PX4 checkout is absent.",
      testStatus:
        "70 selected core configuration/types/units/logging/clock and A* tests passed in 2.71 s.",
      verifiedOn: "2026-10-22",
      notes: [
        "Built PX4-Autopilot checkout absent",
        "Gazebo Harmonic simulator and integration not exercised",
        "PyTorch learning extras not installed; no training attempted",
        "Initial A* collection failed because numba was absent; installing numba resolved collection and all 70 selected tests passed.",
        "Physical flight is out of scope; classify as software simulation.",
        "No public deployment URL verified.",
      ],
    },
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
    collection: "Personal",
    discipline: "Software",
    classificationNote:
      "Collection confirmed by the project owner. Physical hardware completion has not been verified.",
    demo: {
      type: "local",
      url: null,
      summary:
        "Inspect the source-backed component guide, then run the original application locally with its required services.",
      commands: [
        "# From the original repository root; configure local PostgreSQL and environment first.",
        "createdb rupeerise",
        "cd backend",
        "uv sync",
        "uv run alembic upgrade head",
        "RUPEERISE_PRIVATE_CONTENT_DIR=none uv run python -m app.seed --demo",
        "RUPEERISE_PRIVATE_CONTENT_DIR=none uv run uvicorn app.main:app --reload --port 8000",
        "# In a second terminal from the repository root:",
        "cd frontend",
        "npm install",
        "npm run dev",
      ],
      environment: [
        {
          name: "RUPEERISE_DATABASE_URL",
          purpose: "Local PostgreSQL connection.",
        },
        {
          name: "RUPEERISE_SECRET_KEY",
          purpose: "Application signing secret; configure privately.",
        },
        {
          name: "RUPEERISE_PRIVATE_CONTENT_DIR",
          purpose:
            "Private answer-key directory; none explicitly selects public placeholder development mode.",
        },
        {
          name: "RUPEERISE_ANTHROPIC_API_KEY",
          purpose:
            "Optional tutor service; deterministic fallback without key.",
        },
        {
          name: "ALPHA_VANTAGE_API_KEY",
          purpose: "Optional market reference data.",
        },
        {
          name: "MARKETAUX_API_TOKEN",
          purpose: "Optional news reference data.",
        },
        {
          name: "VITE_API_BASE_URL",
          purpose: "Frontend API origin.",
        },
      ],
      runtimeStatus:
        "Actual Uvicorn API started on 127.0.0.1:18322; GET /api/health returned HTTP 200 with status:degraded,database:false.",
      testStatus:
        "66 repository deterministic money, budget, savings and investing engine tests passed with --noconftest.",
      verifiedOn: "2026-10-22",
      notes: [
        "No PostgreSQL instance/schema configured",
        "Private answer keys intentionally not accessed; production requires them",
        "Full suite includes autouse DROP SCHEMA fixture and requires a dedicated isolated test database",
        "--noconftest intentionally bypassed repository database fixtures to safely execute independent pure-engine tests; does not claim full suite pass.",
        "Five-member hackathon project; user classifies Personal. No sole-authorship claim.",
        "Fictional money; optional paid API integrations not called.",
      ],
    },
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
    collection: "Personal",
    discipline: "Software",
    classificationNote:
      "Collection confirmed by the project owner. Physical hardware completion has not been verified.",
    demo: {
      type: "local",
      url: null,
      summary:
        "Inspect the source-backed component guide, then run the original application locally with its required services.",
      commands: [
        "cp .env.example .env # set fresh private APP_KEK, JWT_SECRET and POSTGRES_PASSWORD",
        "make bootstrap",
        "make up",
        "make migrate",
        "make seed",
      ],
      environment: [
        {
          name: "APP_KEK",
          purpose: "Private encryption key.",
        },
        {
          name: "JWT_SECRET",
          purpose: "Private authentication signing secret.",
        },
        {
          name: "POSTGRES_PASSWORD",
          purpose: "Private database credential.",
        },
        {
          name: "POSTGRES_HOST",
          purpose: "PostgreSQL/pgvector host.",
        },
        {
          name: "LLM_PROVIDER",
          purpose: "Local model provider selection or offline stub.",
        },
        {
          name: "LLM_BASE_URL",
          purpose: "Local Ollama/model endpoint.",
        },
        {
          name: "LLM_MODEL",
          purpose: "Configured local model identifier.",
        },
        {
          name: "SPACY_MODEL",
          purpose: "Installed NLP model for redaction.",
        },
        {
          name: "EMBEDDING_MODEL",
          purpose: "Embedding model used for retrieval.",
        },
      ],
      runtimeStatus:
        "Full API startup not verified; database, storage and service configuration are required.",
      testStatus:
        "64 repository scoring/injection/evidence/fusion and ranking metric tests passed in 8.49 s using offline stub provider and --noconftest.",
      verifiedOn: "2026-10-22",
      notes: [
        "Full deployment needs PostgreSQL with pgvector, parse worker, OCR binaries, spaCy/embedding models and local model service",
        "Only synthetic data used; no real candidate files or live models accessed",
        "Initial selected suite had 63 pass / 1 dependency failure (pgvector absent). Installing pgvector resolved it; rerun passed all 64.",
        "The test subset skips application/database conftest and does not establish end-to-end upload or hiring validity.",
        "Local-only deployment guidance; no verified public URL.",
      ],
    },
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
  {
    id: "last-mile-daa",
    slug: "last-mile-daa",
    repository: "lastmile-daa",
    title: "Last Mile DAA",
    tagline: "Every algorithm, one delivery plan.",
    description:
      "A college Design and Analysis of Algorithms project that plans last-mile deliveries by chaining shortest paths, minimum spanning trees, knapsack selection and route sequencing, with a React dashboard and a reproducible benchmark.",
    collection: "College",
    discipline: "Software",
    classificationNote:
      "College classification supplied by the owner. Software only; no physical hardware is involved.",
    demo: {
      type: "local",
      url: null,
      summary:
        "Run the FastAPI solver and the React dashboard locally to step through each algorithm's trace.",
      commands: [
        "# From the repository root, in two terminals.",
        "cd backend && ./.venv/bin/uvicorn app.main:app --reload --port 8000",
        "cd frontend && npm run dev",
        "# Tests, from the repository root:",
        "cd backend && ./.venv/bin/python -m pytest -q",
      ],
      environment: [],
      runtimeStatus:
        "Not run in this portfolio audit. Commands come from the repository's RUN.md.",
      testStatus:
        "The repository contains backend tests per algorithm and benchmark checks; they were not run here.",
      verifiedOn: "2026-10-23",
      notes: [
        "Source and documentation were read at the pinned commit; nothing was executed.",
        "The backend needs a Python virtual environment created from backend/requirements.txt.",
      ],
    },
    categories: ["Algorithms", "Engineering", "Web Development"],
    stack: ["Python", "FastAPI", "React", "TypeScript", "Vite"],
    status: "Academic project",
    kind: "architecture",
    accent: "#e8b26a",
    featured: false,
    githubUrl: "https://github.com/EXCALIBUR303/lastmile-daa",
    liveUrl: null,
    sourceVisibility: "public",
    interactionLabel: "Source-backed pipeline explorer",
    overview:
      "A delivery-planning pipeline that builds a road graph, computes distances, splits stops into per-vehicle zones, picks which orders fit, sequences each route and repairs any missed deadlines.",
    problem:
      "A small fleet must serve pickup-and-delivery orders with capacities and deadlines, and a course project must show the algorithms working, not just the final answer.",
    solution:
      "A seven-stage solver where each stage is a classic algorithm with a selectable variant, plus a trace of every step and a benchmark that compares the variants.",
    features: [
      "Distance stage selectable between targeted Dijkstra, Floyd-Warshall and Johnson (Bellman-Ford potentials plus Dijkstra).",
      "Zoning by a minimum spanning tree built with Prim or Kruskal, cut into one zone per vehicle; the tree weight is reported as a lower bound.",
      "Order selection with a knapsack over capacity and time, against greedy baselines, with an upper bound and gap reported.",
      "Route sequencing with exact Held-Karp up to a size cap, otherwise cheapest insertion with 2-opt.",
      "Deadline repair that drops the worst-value late order and re-simulates.",
      "FastAPI endpoints to generate an instance, solve it and run benchmarks, plus a React dashboard with trace, matrix and results panels.",
    ],
    limitations: [
      "Each stage is a heuristic or exact algorithm on a modelled approximation; the code states that the plan is not provably optimal.",
      "The negative-cost-cycle check is informational and does not change routing.",
      "Instances are generated, not real road data.",
      "Not run in this portfolio audit; no hosted demo is linked.",
    ],
    architecture: {
      kind: "Reconstructed from the solver pipeline source",
      nodes: [
        {
          id: "graph",
          label: "Build and validate",
          description:
            "Builds the graph, checks connectivity and travel times, and runs a Bellman-Ford screen on cost.",
        },
        {
          id: "closure",
          label: "Distance closure",
          description:
            "Stop-to-stop distances from Dijkstra, Floyd-Warshall or Johnson behind one interface.",
        },
        {
          id: "zoning",
          label: "MST zoning",
          description:
            "Prim or Kruskal tree over the stops, cut into one zone per vehicle.",
        },
        {
          id: "selection",
          label: "Knapsack selection",
          description:
            "Chooses which orders each vehicle takes under capacity and deadlines.",
        },
        {
          id: "sequencing",
          label: "Route sequencing",
          description:
            "Held-Karp when small enough, otherwise insertion with 2-opt.",
        },
        {
          id: "repair",
          label: "Simulate and repair",
          description:
            "Drives the routes with release and service times and drops late orders until feasible.",
        },
      ],
      edges: [
        ["graph", "closure"],
        ["closure", "zoning"],
        ["zoning", "selection"],
        ["selection", "sequencing"],
        ["sequencing", "repair"],
      ],
    },
    sources: [
      {
        label: "How to run the backend and frontend",
        path: "RUN.md",
        url: "https://github.com/EXCALIBUR303/lastmile-daa/blob/6f5e8007fb3f025906146ef3ab29ec12bd9187db/RUN.md",
      },
      {
        label: "Seven-stage solver orchestration",
        path: "backend/app/core/pipeline.py",
        url: "https://github.com/EXCALIBUR303/lastmile-daa/blob/6f5e8007fb3f025906146ef3ab29ec12bd9187db/backend/app/core/pipeline.py",
      },
      {
        label: "Minimum spanning tree implementation",
        path: "backend/app/core/mst.py",
        url: "https://github.com/EXCALIBUR303/lastmile-daa/blob/6f5e8007fb3f025906146ef3ab29ec12bd9187db/backend/app/core/mst.py",
      },
      {
        label: "Knapsack order selection",
        path: "backend/app/core/knapsack.py",
        url: "https://github.com/EXCALIBUR303/lastmile-daa/blob/6f5e8007fb3f025906146ef3ab29ec12bd9187db/backend/app/core/knapsack.py",
      },
      {
        label: "Benchmark runner",
        path: "backend/bench/run_bench.py",
        url: "https://github.com/EXCALIBUR303/lastmile-daa/blob/6f5e8007fb3f025906146ef3ab29ec12bd9187db/backend/bench/run_bench.py",
      },
    ],
    sourceCommit: "6f5e8007fb3f025906146ef3ab29ec12bd9187db",
    eyebrow: "College / Algorithms",
  },
  {
    id: "burnout-backend",
    slug: "burnout-backend",
    repository: "burnout-backend",
    title: "Burnout AI · Backend",
    tagline: "The service behind the signal.",
    description:
      "A separate FastAPI deployment of the burnout research API, with model inference, SQLite account and prediction history, feedback, and optional wellness chat.",
    overview:
      "A separate FastAPI deployment of the burnout research API, with model inference, SQLite account and prediction history, feedback, and optional wellness chat.",
    collection: "College",
    discipline: "Software",
    classificationNote:
      "College collection confirmed by the owner; software API, not a physical hardware build.",
    demo: {
      type: "local",
      url: null,
      summary:
        "Inspect the source-backed component guide, then run the original application locally with its required services.",
      commands: [
        "python3.12 -m venv .venv",
        "source .venv/bin/activate",
        "pip install -r requirements.txt",
        "uvicorn main:app --host 127.0.0.1 --port 8000",
      ],
      environment: [
        {
          name: "JWT_SECRET",
          purpose: "Provide a private signing secret before shared use.",
        },
        {
          name: "DB_PATH",
          purpose: "Path to local SQLite database.",
        },
        {
          name: "GEMINI_API_KEY",
          purpose:
            "Optional external chatbot; leave unset for offline fallback.",
        },
      ],
      runtimeStatus: "Source-reviewed startup; inference not run.",
      testStatus: "1 SQLite feedback test passed in an isolated environment.",
      verifiedOn: "2026-10-22",
      notes: [
        "No README exists at this snapshot.",
        "Separate backend of the same burnout research project; not an independent clinical result.",
        "Full startup automatically deserializes model artifacts; this audit did not load them.",
        "Not a clinical diagnostic tool; public hosting needs security review of permissive CORS, debug routes and development secret defaults.",
      ],
    },
    categories: ["AI/ML", "Web Development"],
    stack: [
      "Python",
      "FastAPI",
      "SQLite",
      "scikit-learn",
      "XGBoost",
      "LightGBM",
    ],
    status: "Research backend",
    kind: "architecture",
    accent: "#79dce5",
    featured: false,
    githubUrl: "https://github.com/EXCALIBUR303/burnout-backend",
    liveUrl: null,
    sourceVisibility: "public",
    interactionLabel: "Source-backed component guide",
    problem:
      "Serve the burnout research model through an account-aware API with persistent feedback and prediction history.",
    solution:
      "A separate FastAPI deployment of the burnout research API, with model inference, SQLite account and prediction history, feedback, and optional wellness chat.",
    features: [
      "FastAPI prediction, account, history, and feedback routes.",
      "Prioritizes committed v5, then v3 and legacy artifacts; inference not rerun in this audit.",
      "SQLite stores account, prediction, and feedback records.",
      "Gemini REST integration has an offline fallback when no key is configured.",
    ],
    limitations: [
      "No README exists at this snapshot.",
      "Separate backend of the same burnout research project; not an independent clinical result.",
      "Full startup automatically deserializes model artifacts; this audit did not load them.",
      "Not a clinical diagnostic tool; public hosting needs security review of permissive CORS, debug routes and development secret defaults.",
    ],
    architecture: {
      kind: "Reconstructed from verified public source",
      nodes: [
        {
          id: "component-0",
          label: "API boundary",
          description:
            "FastAPI prediction, account, history, and feedback routes.",
        },
        {
          id: "component-1",
          label: "Model loading",
          description:
            "Prioritizes committed v5, then v3 and legacy artifacts; inference not rerun in this audit.",
        },
        {
          id: "component-2",
          label: "Persistence",
          description:
            "SQLite stores account, prediction, and feedback records.",
        },
        {
          id: "component-3",
          label: "Optional chat",
          description:
            "Gemini REST integration has an offline fallback when no key is configured.",
        },
      ],
      edges: [
        ["component-0", "component-1"],
        ["component-0", "component-2"],
        ["component-0", "component-3"],
      ],
    },
    sources: [
      {
        label: "main.py",
        url: "https://github.com/EXCALIBUR303/burnout-backend/blob/488d4c16d79e19dfab2d3d204246dd82a4365650/main.py",
        path: "main.py",
      },
      {
        label: "requirements.txt",
        url: "https://github.com/EXCALIBUR303/burnout-backend/blob/488d4c16d79e19dfab2d3d204246dd82a4365650/requirements.txt",
        path: "requirements.txt",
      },
      {
        label: "feedback.py",
        url: "https://github.com/EXCALIBUR303/burnout-backend/blob/488d4c16d79e19dfab2d3d204246dd82a4365650/feedback.py",
        path: "feedback.py",
      },
      {
        label: "Dockerfile",
        url: "https://github.com/EXCALIBUR303/burnout-backend/blob/488d4c16d79e19dfab2d3d204246dd82a4365650/Dockerfile",
        path: "Dockerfile",
      },
    ],
    sourceCommit: "488d4c16d79e19dfab2d3d204246dd82a4365650",
    eyebrow: "College / Research API",
  },
  {
    id: "sigsmith",
    slug: "sigsmith",
    repository: "sigsmith",
    title: "SIGSMITH",
    tagline: "A design before a detector.",
    description:
      "A technical blueprint for offline, schema-conditioned Sigma detection-rule synthesis. Implementation has not started.",
    overview:
      "A technical blueprint for offline, schema-conditioned Sigma detection-rule synthesis. Implementation has not started.",
    collection: "Personal",
    discipline: "Software",
    classificationNote:
      "Personal collection confirmed by the owner. Software scope only; no physical hardware claim.",
    demo: {
      type: "unavailable",
      url: null,
      summary:
        "Read the proposed architecture and evaluation contract. An executable application has not been implemented.",
      commands: [],
      environment: [],
      runtimeStatus: "Not executable — documentation and design contract only.",
      testStatus: "No implementation or test suite supplied.",
      verifiedOn: "2026-10-22",
      notes: [
        "Documentation only; no application, model, tests or measured performance has been implemented.",
        "Architecture is proposed, not a working system.",
      ],
    },
    categories: ["AI/ML", "Engineering"],
    stack: [
      "Planned Python",
      "Planned Qwen3-1.7B",
      "Planned QLoRA",
      "Planned GGUF",
    ],
    status: "Design phase",
    kind: "architecture",
    accent: "#d5acff",
    featured: false,
    githubUrl: "https://github.com/EXCALIBUR303/sigsmith",
    liveUrl: null,
    sourceVisibility: "public",
    interactionLabel: "Proposed design walkthrough",
    problem:
      "Explore how local detection-rule generation could remain constrained to a supplied telemetry schema.",
    solution:
      "A technical blueprint for offline, schema-conditioned Sigma detection-rule synthesis. Implementation has not started.",
    features: [
      "Completed technical blueprint",
      "Locked task and evaluation contract",
      "Planned execution-based rule evaluation",
    ],
    limitations: [
      "Documentation only; no application, model, tests or measured performance has been implemented.",
      "Architecture is proposed, not a working system.",
    ],
    architecture: {
      kind: "Proposed design — not implemented",
      nodes: [
        {
          id: "component-0",
          label: "Telemetry schema card",
          description:
            "A proposed input card restricts the telemetry fields available to the rule generator.",
        },
        {
          id: "component-1",
          label: "Threat-behaviour description",
          description:
            "A threat-behaviour description supplies the intended detection behaviour.",
        },
        {
          id: "component-2",
          label: "Planned local model",
          description:
            "The blueprint proposes local schema-conditioned rule synthesis; no model has been implemented.",
        },
        {
          id: "component-3",
          label: "Planned Sigma rule evaluation",
          description:
            "The contract describes planned execution-based evaluation; no measured evaluation results exist.",
        },
      ],
      edges: [
        ["component-0", "component-2"],
        ["component-1", "component-2"],
        ["component-2", "component-3"],
      ],
    },
    sources: [
      {
        label: "README.md",
        path: "README.md",
        url: "https://github.com/EXCALIBUR303/sigsmith/blob/11253c8b450acae412095e8276a84ecbca44e00c/README.md",
      },
      {
        label: "docs/BLUEPRINT.md",
        path: "docs/BLUEPRINT.md",
        url: "https://github.com/EXCALIBUR303/sigsmith/blob/11253c8b450acae412095e8276a84ecbca44e00c/docs/BLUEPRINT.md",
      },
      {
        label: "docs/CONTRACT.json",
        path: "docs/CONTRACT.json",
        url: "https://github.com/EXCALIBUR303/sigsmith/blob/11253c8b450acae412095e8276a84ecbca44e00c/docs/CONTRACT.json",
      },
    ],
    sourceCommit: "11253c8b450acae412095e8276a84ecbca44e00c",
    eyebrow: "Personal / Proposed system",
  },
  {
    id: "swarmmind",
    slug: "swarmmind",
    repository: "swarmmind",
    title: "SWARMMIND",
    tagline: "Many agents. One search.",
    description:
      "A 2D robot-swarm search-and-rescue simulator comparing IPPO and MAPPO policies with random and frontier baselines.",
    overview:
      "A 2D robot-swarm search-and-rescue simulator comparing IPPO and MAPPO policies with random and frontier baselines.",
    collection: "Personal",
    discipline: "Software",
    classificationNote:
      "Personal collection confirmed by the owner. Software scope only; no physical hardware claim.",
    demo: {
      type: "local",
      url: null,
      summary:
        "Inspect the source-backed component guide, then run the original application locally with its required services.",
      commands: [
        "python3.11 -m venv .venv",
        '.venv/bin/pip install -c requirements.lock -e ".[dev]"',
        "npm ci --prefix frontend",
        "make demo",
      ],
      environment: [
        {
          name: "VITE_API_BASE_URL",
          purpose: "Optional browser API endpoint override",
        },
        {
          name: "SWARMMIND_HOST",
          purpose: "Local API binding",
        },
        {
          name: "SWARMMIND_PORT",
          purpose: "Local API port",
        },
        {
          name: "SWARMMIND_CORS_ORIGIN",
          purpose: "Permitted UI origin",
        },
      ],
      runtimeStatus:
        "Original frontend build and core simulation checks passed. Trained-policy API workflow not run.",
      testStatus:
        "88 core environment tests and 204 frontend tests passed; 1 frontend test skipped.",
      verifiedOn: "2026-10-22",
      notes: [
        "Software simulator; no physical robotics claim.",
        "Local single-user application is not hardened for public hosting.",
        "Five seeds on one L2 configuration; no claim of emergent coordination or MAPPO superiority.",
        "Full training and learned-policy inference not rerun in portfolio audit.",
      ],
    },
    categories: ["AI/ML", "Engineering"],
    stack: [
      "Python",
      "PyTorch",
      "PettingZoo",
      "Gymnasium",
      "FastAPI",
      "React",
      "TypeScript",
      "Vite",
    ],
    status: "Local simulation research application",
    kind: "architecture",
    accent: "#edb76e",
    featured: false,
    githubUrl: "https://github.com/EXCALIBUR303/swarmmind",
    liveUrl: null,
    sourceVisibility: "public",
    interactionLabel: "Source-backed component guide",
    problem:
      "A 2D robot-swarm search-and-rescue simulator comparing IPPO and MAPPO policies with random and frontier baselines.",
    solution:
      "A 2D robot-swarm search-and-rescue simulator comparing IPPO and MAPPO policies with random and frontier baselines.",
    features: [
      "Partially observed multi-robot environment",
      "IPPO and MAPPO training implementations",
      "Committed trained actors and recorded replays",
      "Interactive simulation, comparison and behaviour analysis",
    ],
    limitations: [
      "Software simulator; no physical robotics claim.",
      "Local single-user application is not hardened for public hosting.",
      "Five seeds on one L2 configuration; no claim of emergent coordination or MAPPO superiority.",
      "Full training and learned-policy inference not rerun in portfolio audit.",
    ],
    architecture: {
      kind: "Source-backed logical component map",
      nodes: [
        {
          id: "component-0",
          label: "Grid world and local observations",
          description:
            "A two-dimensional grid exposes partial local observations for simulated robots.",
        },
        {
          id: "component-1",
          label: "IPPO / MAPPO policies",
          description:
            "IPPO and MAPPO policies are compared with random and frontier baselines.",
        },
        {
          id: "component-2",
          label: "Evaluation and replay artifacts",
          description:
            "Evaluation outputs and recorded replays support bounded comparisons across seeded runs.",
        },
        {
          id: "component-3",
          label: "FastAPI and WebSockets",
          description:
            "The backend exposes local simulation state and updates through HTTP and WebSockets.",
        },
        {
          id: "component-4",
          label: "React Swarm Lab",
          description:
            "The React application provides simulation, comparison and behaviour-analysis views.",
        },
      ],
      edges: [
        ["component-0", "component-1"],
        ["component-1", "component-2"],
        ["component-2", "component-3"],
        ["component-3", "component-4"],
      ],
    },
    sources: [
      {
        label: "README.md",
        path: "README.md",
        url: "https://github.com/EXCALIBUR303/swarmmind/blob/e2269fe8f5f08ba5f491e340d46e63b17acef2a7/README.md",
      },
      {
        label: "pyproject.toml",
        path: "pyproject.toml",
        url: "https://github.com/EXCALIBUR303/swarmmind/blob/e2269fe8f5f08ba5f491e340d46e63b17acef2a7/pyproject.toml",
      },
      {
        label: "frontend/package.json",
        path: "frontend/package.json",
        url: "https://github.com/EXCALIBUR303/swarmmind/blob/e2269fe8f5f08ba5f491e340d46e63b17acef2a7/frontend/package.json",
      },
      {
        label: "marl/envs/core/world.py",
        path: "marl/envs/core/world.py",
        url: "https://github.com/EXCALIBUR303/swarmmind/blob/e2269fe8f5f08ba5f491e340d46e63b17acef2a7/marl/envs/core/world.py",
      },
      {
        label: "backend/app/settings.py",
        path: "backend/app/settings.py",
        url: "https://github.com/EXCALIBUR303/swarmmind/blob/e2269fe8f5f08ba5f491e340d46e63b17acef2a7/backend/app/settings.py",
      },
    ],
    sourceCommit: "e2269fe8f5f08ba5f491e340d46e63b17acef2a7",
    eyebrow: "Personal / Software system",
  },
  {
    id: "pathable",
    slug: "pathable",
    repository: "PATHABLE",
    title: "PathAble",
    tagline: "A route that considers you.",
    description:
      "A campus navigation application with accessibility-constrained graph routing, community reports, review and durable rerouting updates.",
    overview:
      "A campus navigation application with accessibility-constrained graph routing, community reports, review and durable rerouting updates.",
    collection: "Personal",
    discipline: "Software",
    classificationNote:
      "Personal collection confirmed by the owner. Software scope only; no physical hardware claim.",
    demo: {
      type: "local",
      url: null,
      summary:
        "Inspect the source-backed component guide, then run the original application locally with its required services.",
      commands: [
        "bash scripts/install.sh",
        "bash scripts/start.sh",
        "bash scripts/test.sh",
        "bash scripts/test_frontend.sh",
      ],
      environment: [
        {
          name: "POSTGRES_HOST",
          purpose: "PostGIS host",
        },
        {
          name: "POSTGRES_PORT",
          purpose: "PostGIS port",
        },
        {
          name: "POSTGRES_DB",
          purpose: "Database name",
        },
        {
          name: "POSTGRES_USER",
          purpose: "Database owner role",
        },
        {
          name: "POSTGRES_PASSWORD",
          purpose: "Generated owner credential",
        },
        {
          name: "APP_DB_USER",
          purpose: "Restricted API database role",
        },
        {
          name: "APP_DB_PASSWORD",
          purpose: "Generated API database credential",
        },
        {
          name: "CSRF_SECRET",
          purpose: "Generated request protection secret",
        },
        {
          name: "RATE_LIMIT_HASH_KEY",
          purpose: "Generated rate-limit key",
        },
        {
          name: "APP_ORIGIN",
          purpose: "Permitted frontend origin",
        },
        {
          name: "ML_ENABLED",
          purpose: "Optional inference gate; disabled by default",
        },
      ],
      runtimeStatus:
        "Original frontend production build passed. Pure routing engine executed; complete PostGIS workflow not run.",
      testStatus: "163 routing/oracle tests and 41 frontend tests passed.",
      verifiedOn: "2026-10-22",
      notes: [
        "All campus examples are fictional demonstration data, not a university survey.",
        "Hazard inference remains disabled because no approved evaluated weights exist.",
        "Full authenticated workflow requires PostGIS and generated local secrets.",
        "Public operational readiness and macOS execution remain separate checks.",
      ],
    },
    categories: ["Algorithms", "Web Development"],
    stack: [
      "React",
      "TypeScript",
      "Vite",
      "Leaflet",
      "FastAPI",
      "PostgreSQL",
      "PostGIS",
    ],
    status: "Local accessibility navigation application",
    kind: "architecture",
    accent: "#79dce5",
    featured: false,
    githubUrl: "https://github.com/EXCALIBUR303/PATHABLE",
    liveUrl: null,
    sourceVisibility: "public",
    interactionLabel: "Source-backed component guide",
    problem:
      "A campus navigation application with accessibility-constrained graph routing, community reports, review and durable rerouting updates.",
    solution:
      "A campus navigation application with accessibility-constrained graph routing, community reports, review and durable rerouting updates.",
    features: [
      "Dijkstra and A* with explicit accessibility constraints",
      "Bounded alternative routes and geometry instructions",
      "Cookie authentication and saved preferences",
      "Private reports, review and live rerouting",
    ],
    limitations: [
      "All campus examples are fictional demonstration data, not a university survey.",
      "Hazard inference remains disabled because no approved evaluated weights exist.",
      "Full authenticated workflow requires PostGIS and generated local secrets.",
      "Public operational readiness and macOS execution remain separate checks.",
    ],
    architecture: {
      kind: "Source-backed logical component map",
      nodes: [
        {
          id: "component-0",
          label: "Leaflet route map",
          description:
            "Leaflet renders fictional campus geometry, route alternatives and navigation instructions.",
        },
        {
          id: "component-1",
          label: "FastAPI boundaries",
          description:
            "FastAPI validates requests and coordinates authentication, preferences and route access.",
        },
        {
          id: "component-2",
          label: "Pure constrained routing engine",
          description:
            "Dijkstra and A* honor explicit accessibility constraints in the pure routing engine.",
        },
        {
          id: "component-3",
          label: "PostgreSQL / PostGIS graph",
          description:
            "PostgreSQL with PostGIS stores the route graph, geometry and application state.",
        },
        {
          id: "component-4",
          label: "Reviewed reports and durable events",
          description:
            "Reviewed reports and durable events support rerouting updates; full integration requires a database.",
        },
      ],
      edges: [
        ["component-0", "component-1"],
        ["component-1", "component-2"],
        ["component-1", "component-3"],
        ["component-3", "component-4"],
      ],
    },
    sources: [
      {
        label: "README.md",
        path: "README.md",
        url: "https://github.com/EXCALIBUR303/PATHABLE/blob/7d29bbae1cdacd04e7c089a30f4fa2ba1144ef3e/README.md",
      },
      {
        label: "frontend/package.json",
        path: "frontend/package.json",
        url: "https://github.com/EXCALIBUR303/PATHABLE/blob/7d29bbae1cdacd04e7c089a30f4fa2ba1144ef3e/frontend/package.json",
      },
      {
        label: "backend/app/routing/engine.py",
        path: "backend/app/routing/engine.py",
        url: "https://github.com/EXCALIBUR303/PATHABLE/blob/7d29bbae1cdacd04e7c089a30f4fa2ba1144ef3e/backend/app/routing/engine.py",
      },
      {
        label: "backend/app/core/config.py",
        path: "backend/app/core/config.py",
        url: "https://github.com/EXCALIBUR303/PATHABLE/blob/7d29bbae1cdacd04e7c089a30f4fa2ba1144ef3e/backend/app/core/config.py",
      },
      {
        label: "scripts/install.sh",
        path: "scripts/install.sh",
        url: "https://github.com/EXCALIBUR303/PATHABLE/blob/7d29bbae1cdacd04e7c089a30f4fa2ba1144ef3e/scripts/install.sh",
      },
      {
        label: "scripts/start.sh",
        path: "scripts/start.sh",
        url: "https://github.com/EXCALIBUR303/PATHABLE/blob/7d29bbae1cdacd04e7c089a30f4fa2ba1144ef3e/scripts/start.sh",
      },
    ],
    sourceCommit: "7d29bbae1cdacd04e7c089a30f4fa2ba1144ef3e",
    eyebrow: "Personal / Software system",
  },
  {
    id: "parkscan-swarm",
    slug: "parkscan-swarm",
    repository: "parkscan-swarm",
    title: "ParkScan Swarm",
    tagline: "Three robots. One honest simulation.",
    description:
      "A simulation-first system where three coordinated robots inspect a parking lot and map potholes, with a FastAPI and PostGIS backend and a live React dashboard.",
    collection: "Personal",
    discipline: "Software",
    classificationNote:
      "Everything in this project is simulated; the repository states there is no hardware.",
    demo: {
      type: "local",
      url: null,
      summary:
        "Run the deterministic simulator, database and dashboard locally with the repository's make targets.",
      commands: [
        "# From the repository root. Requires uv, Node 20+ and Docker.",
        "make bootstrap",
        "make up",
        "make migrate",
        "make dev",
        "make demo",
      ],
      environment: [],
      runtimeStatus:
        "Not run in this portfolio audit. Commands come from the repository README.",
      testStatus:
        "The README reports 787 Python and 74 web tests; they were not re-run here.",
      verifiedOn: "2026-10-23",
      notes: [
        "Source and documentation were read at the pinned commit; nothing was executed.",
        "Needs Docker for PostGIS and the MQTT broker.",
      ],
    },
    categories: ["Algorithms", "Engineering", "Web Development"],
    stack: [
      "Python",
      "FastAPI",
      "PostGIS",
      "MQTT",
      "React",
      "TypeScript",
      "ROS 2",
      "Gazebo",
    ],
    status: "Simulation project",
    kind: "architecture",
    accent: "#8fd0c2",
    featured: false,
    githubUrl: "https://github.com/EXCALIBUR303/parkscan-swarm",
    liveUrl: null,
    sourceVisibility: "public",
    interactionLabel: "Source-backed architecture explorer",
    overview:
      "Three centrally coordinated robots divide a 150 by 100 metre lot into zones, drive lane by lane, detect potholes from simulated camera geometry, place them on a map and return to charge when needed.",
    problem:
      "Inspecting a large parking lot is repetitive work, and building the robots first would hide whether the coordination and mapping ideas even work.",
    solution:
      "Develop the coordination, detection and mapping in simulation behind a narrow backend adapter, so a deterministic simulator and an optional ROS 2 and Gazebo backend can be swapped without changing the coordinator.",
    features: [
      "Central allocator that splits the lot into zones so robots do not duplicate work.",
      "Two simulation backends behind one WorldBackend interface: a deterministic pure-Python default and an optional ROS 2 with headless Gazebo one.",
      "Telemetry over MQTT into PostGIS, pushed live to a React dashboard.",
      "Every record carries a data-source column that is required in the database, and the dashboard's SIMULATED badge is drawn from that value.",
      "Charging-bay arbitration with leases, fencing tokens and a queue.",
      "Benchmark of allocation strategies over many seeds and an evaluation of geolocation accuracy.",
    ],
    limitations: [
      "Entirely simulated; there is no hardware.",
      "The robots are centrally coordinated, not a decentralised swarm; the name is the project's own.",
      "The README says the ROS 2 backend ran cleanly for 100 steps but a 600-step run failed on transport overhead, so it is a second implementation, not an equally trusted one.",
      "Leases cover charging bays, not individual lane segments.",
      "Not run in this portfolio audit.",
    ],
    architecture: {
      kind: "Reconstructed from the repository README and decision records",
      nodes: [
        {
          id: "coordinator",
          label: "Coordinator",
          description: "Allocates zones and arbitrates charging bays.",
        },
        {
          id: "backend",
          label: "WorldBackend adapter",
          description:
            "One interface over the deterministic simulator and the ROS 2 and Gazebo backend.",
        },
        {
          id: "robots",
          label: "Robot agents",
          description:
            "Three agents that drive lanes, avoid each other and return to charge.",
        },
        {
          id: "mqtt",
          label: "MQTT telemetry",
          description: "Carries robot telemetry and detections to the API.",
        },
        {
          id: "postgis",
          label: "PostGIS store",
          description:
            "Stores telemetry and pothole detections with a required data-source label.",
        },
        {
          id: "dashboard",
          label: "React dashboard",
          description:
            "Shows the live map and a SIMULATED badge drawn from stored data.",
        },
      ],
      edges: [
        ["coordinator", "robots"],
        ["robots", "backend"],
        ["backend", "mqtt"],
        ["mqtt", "postgis"],
        ["postgis", "dashboard"],
      ],
    },
    sources: [
      {
        label: "Scope, architecture and stated limitations",
        path: "README.md",
        url: "https://github.com/EXCALIBUR303/parkscan-swarm/blob/48f3176ddca6c2bea224da6b71b9d544d47f84a8/README.md",
      },
      {
        label: "Why there are two simulation backends",
        path: "docs/adr/0001-two-simulation-backends.md",
        url: "https://github.com/EXCALIBUR303/parkscan-swarm/blob/48f3176ddca6c2bea224da6b71b9d544d47f84a8/docs/adr/0001-two-simulation-backends.md",
      },
      {
        label: "Platform research log",
        path: "docs/RESEARCH_LOG.md",
        url: "https://github.com/EXCALIBUR303/parkscan-swarm/blob/48f3176ddca6c2bea224da6b71b9d544d47f84a8/docs/RESEARCH_LOG.md",
      },
    ],
    sourceCommit: "48f3176ddca6c2bea224da6b71b9d544d47f84a8",
    eyebrow: "Personal / Robotics simulation",
  },
  {
    id: "quadruped-rl",
    slug: "quadruped-rl",
    repository: "quadruped-rl",
    title: "Voice-Controlled Robot Dog",
    tagline: "Say it. It walks.",
    description:
      "A 12-joint robot dog trained with reinforcement learning in physics simulation, then controlled by speech through a local language model.",
    collection: "Personal",
    discipline: "Software",
    classificationNote:
      "Simulation only; the repository states it needs no hardware, so it does not count as a physical build.",
    demo: {
      type: "local",
      url: null,
      summary:
        "Train or load the pretrained policy, then talk to the robot in the MuJoCo viewer on a Mac.",
      commands: [
        "# From the repository root.",
        "python3.11 -m venv .venv && source .venv/bin/activate",
        "pip install -r requirements.txt",
        "mkdir -p checkpoints_v2 && cp models/final/* checkpoints_v2/",
        "python training/evaluate_v2.py",
        "mjpython brain/talk_to_robot.py",
      ],
      environment: [],
      runtimeStatus:
        "Not run in this portfolio audit. Commands come from the repository README.",
      testStatus: "The README reports 85 tests; they were not re-run here.",
      verifiedOn: "2026-10-23",
      notes: [
        "Source and documentation were read at the pinned commit; nothing was executed.",
        "Voice control needs Ollama with a local model and a Mac for the speech output.",
      ],
    },
    categories: ["AI/ML", "Engineering", "Interactive Systems"],
    stack: [
      "Python",
      "MuJoCo",
      "Stable-Baselines3",
      "PPO",
      "Gymnasium",
      "faster-whisper",
      "Ollama",
    ],
    status: "Simulation project",
    kind: "architecture",
    accent: "#e9a38a",
    featured: false,
    githubUrl: "https://github.com/EXCALIBUR303/quadruped-rl",
    liveUrl: null,
    sourceVisibility: "public",
    interactionLabel: "Source-backed architecture explorer",
    overview:
      "A speech command goes through Whisper and a local language model to become a velocity and turn command, which a PPO-trained policy turns into joint targets for a simulated robot dog.",
    problem:
      "Learned walking policies often score well on speed alone while sliding or collapsing, and a robot is only fun to command if speech reliably maps to behaviour.",
    solution:
      "Train in body-frame coordinates with PD joint control, evaluate posture and foot slip as well as speed, and put a small local speech layer in front of the policy.",
    features: [
      "Custom 12-joint robot dog trained with PPO to stand, walk, reverse and turn.",
      "The policy outputs target joint angles that a PD loop converts to torques, rather than raw torques.",
      "Evaluation checks velocity, body height and foot slip so a collapsed gait cannot pass on speed alone.",
      "Keyframe tricks, fetch with obstacle avoidance, patrol and follow modes.",
      "Local speech pipeline: Whisper speech-to-text, an Ollama language model for intent, and macOS speech output.",
    ],
    limitations: [
      "Simulation only; there is no physical robot.",
      "The README's own results mark walking fast and walking while turning as only partly clean on foot slip.",
      "Voice control is set up for a Mac with Ollama.",
      "Not run in this portfolio audit.",
    ],
    architecture: {
      kind: "Reconstructed from the repository README",
      nodes: [
        {
          id: "speech",
          label: "Speech",
          description: "Whisper turns spoken commands into text.",
        },
        {
          id: "intent",
          label: "Intent model",
          description:
            "A local Ollama model maps text to a command with speed, turn and reply.",
        },
        {
          id: "controller",
          label: "Mode controller",
          description:
            "Switches between policy walking, tricks, fetch navigation and spin.",
        },
        {
          id: "policy",
          label: "PPO policy",
          description:
            "Outputs 12 target joint angles from body-frame observations.",
        },
        {
          id: "sim",
          label: "MuJoCo simulation",
          description:
            "Runs the robot dog physics under a PD joint controller.",
        },
      ],
      edges: [
        ["speech", "intent"],
        ["intent", "controller"],
        ["controller", "policy"],
        ["policy", "sim"],
      ],
    },
    sources: [
      {
        label: "Overview, results and quick start",
        path: "README.md",
        url: "https://github.com/EXCALIBUR303/quadruped-rl/blob/86c8d3dd172b092fc0159766a78b17074015ad2d/README.md",
      },
      {
        label: "Training environment and reward",
        path: "sim/envs/robot_v2_env.py",
        url: "https://github.com/EXCALIBUR303/quadruped-rl/blob/86c8d3dd172b092fc0159766a78b17074015ad2d/sim/envs/robot_v2_env.py",
      },
      {
        label: "Speech to command mapping",
        path: "brain/nlu.py",
        url: "https://github.com/EXCALIBUR303/quadruped-rl/blob/86c8d3dd172b092fc0159766a78b17074015ad2d/brain/nlu.py",
      },
      {
        label: "Evaluation of velocity, height and foot slip",
        path: "training/evaluate_v2.py",
        url: "https://github.com/EXCALIBUR303/quadruped-rl/blob/86c8d3dd172b092fc0159766a78b17074015ad2d/training/evaluate_v2.py",
      },
    ],
    sourceCommit: "86c8d3dd172b092fc0159766a78b17074015ad2d",
    eyebrow: "Personal / Reinforcement learning",
  },
  {
    id: "private-local-ai",
    slug: "private-local-ai",
    repository: "private-local-ai",
    title: "Private Local AI",
    tagline: "An assistant that never phones home.",
    description:
      "A personal AI assistant for macOS that runs entirely on the machine: chat, private document search with citations, push-to-talk voice and a small set of approved Mac actions.",
    collection: "Personal",
    discipline: "Software",
    classificationNote:
      "Personal software project; classification follows the repository's own description.",
    demo: {
      type: "local",
      url: null,
      summary:
        "Run the FastAPI app against local Ollama models and open it on localhost.",
      commands: [
        "# From the repository root, on a Mac with Ollama installed.",
        "./setup.sh",
        "./start.sh",
        "./.venv/bin/python -m pytest",
      ],
      environment: [],
      runtimeStatus:
        "Not run in this portfolio audit. Commands come from the repository README.",
      testStatus:
        "The README reports 238 offline tests; they were not re-run here.",
      verifiedOn: "2026-10-23",
      notes: [
        "Source and documentation were read at the pinned commit; nothing was executed.",
        "Needs Ollama and downloaded models, which are large.",
      ],
    },
    categories: ["AI/ML", "Engineering", "Web Development"],
    stack: ["Python", "FastAPI", "Ollama", "SQLite", "whisper.cpp", "Swift"],
    status: "Working application",
    kind: "architecture",
    accent: "#a7c4f2",
    featured: false,
    githubUrl: "https://github.com/EXCALIBUR303/private-local-ai",
    liveUrl: null,
    sourceVisibility: "public",
    interactionLabel: "Source-backed architecture explorer",
    overview:
      "A browser interface on localhost talks to a FastAPI server that uses local models through Ollama, stores chats and document embeddings in SQLite, and exposes only four allowlisted Mac actions behind explicit approval.",
    problem:
      "Cloud assistants send documents and voice off the machine, and an assistant with broad Mac control is risky if it can be steered by the text it reads.",
    solution:
      "Keep every model and the index local, show a live local-only status, cite file and page for answers, fence retrieved text against injection and limit actions to a short approved list.",
    features: [
      "Local chat streamed from Ollama with history in SQLite.",
      "Document assistant for Markdown, text, PDF, DOCX and CSV with hybrid dense and keyword retrieval and citations by file and page or section.",
      "Push-to-talk voice transcribed on the device, with the transcript reviewed before it is sent.",
      "Exactly four allowlisted Mac actions, each proposed, approved and then executed, with an audit log.",
      "Retrieved passages are fenced and sanitised as untrusted content.",
    ],
    limitations: [
      "Designed for one Mac; setup depends on Ollama and large local models.",
      "Answer quality is bounded by the small local models the README names.",
      "The README reports measured performance for the author's own machine only.",
      "Not run in this portfolio audit.",
    ],
    architecture: {
      kind: "Reconstructed from the repository README",
      nodes: [
        {
          id: "browser",
          label: "Browser UI",
          description: "Localhost-only interface using streaming responses.",
        },
        {
          id: "api",
          label: "FastAPI server",
          description:
            "Routes chat, retrieval, voice and actions on 127.0.0.1.",
        },
        {
          id: "llm",
          label: "Ollama models",
          description: "Local chat, fast and embedding models.",
        },
        {
          id: "rag",
          label: "Hybrid retrieval",
          description:
            "NumPy cosine similarity plus BM25 over chunks, with fenced passages and citations.",
        },
        {
          id: "actions",
          label: "Approved actions",
          description:
            "Four-action allowlist with propose, approve and execute steps.",
        },
        {
          id: "store",
          label: "SQLite store",
          description: "Chats, chunks, embeddings and the audit log.",
        },
      ],
      edges: [
        ["browser", "api"],
        ["api", "llm"],
        ["api", "rag"],
        ["api", "actions"],
        ["rag", "store"],
      ],
    },
    sources: [
      {
        label: "Features, architecture, privacy and security model",
        path: "README.md",
        url: "https://github.com/EXCALIBUR303/private-local-ai/blob/091da754e267b7af71d4fc0052df6a083c389bbd/README.md",
      },
      {
        label: "Server entry point",
        path: "app/main.py",
        url: "https://github.com/EXCALIBUR303/private-local-ai/blob/091da754e267b7af71d4fc0052df6a083c389bbd/app/main.py",
      },
      {
        label: "Allowlisted Mac actions",
        path: "app/actions.py",
        url: "https://github.com/EXCALIBUR303/private-local-ai/blob/091da754e267b7af71d4fc0052df6a083c389bbd/app/actions.py",
      },
      {
        label: "Retrieval, citations and injection defence",
        path: "app/rag.py",
        url: "https://github.com/EXCALIBUR303/private-local-ai/blob/091da754e267b7af71d4fc0052df6a083c389bbd/app/rag.py",
      },
    ],
    sourceCommit: "091da754e267b7af71d4fc0052df6a083c389bbd",
    eyebrow: "Personal / Local AI",
  },
  {
    id: "lifeos",
    slug: "lifeos",
    repository: "lifeos",
    title: "LifeOS",
    tagline: "Your life, in one place.",
    description:
      "A local-first personal life tracker covering tasks, habits, money, goals, health, journaling, focus, study and notes, with an on-device insights engine and an optional AI assistant.",
    collection: "Personal",
    discipline: "Software",
    classificationNote:
      "Personal software project; classification follows the repository's own description.",
    demo: {
      type: "local",
      url: null,
      summary:
        "Open the deployed app, or run it locally with npm; all data stays in the browser unless sync is turned on.",
      commands: ["# From the repository root.", "npm install", "npm run dev"],
      environment: [
        {
          name: "Anthropic or Gemini API key",
          purpose:
            "Optional, entered in the app's settings and kept in the browser; the app falls back to an on-device engine without one.",
        },
      ],
      runtimeStatus:
        "Not run in this portfolio audit. The README links a deployed version.",
      testStatus: "No test suite is named in the README.",
      verifiedOn: "2026-10-23",
      notes: [
        "Source and documentation were read at the pinned commit; nothing was executed.",
        "The deployed link comes from the repository README and was not opened here.",
      ],
    },
    categories: ["Web Development", "Interactive Systems", "AI/ML"],
    stack: [
      "Next.js",
      "React",
      "TypeScript",
      "Tailwind CSS",
      "Zustand",
      "Framer Motion",
      "Supabase",
    ],
    status: "Working application",
    kind: "architecture",
    accent: "#c6a8f0",
    featured: false,
    githubUrl: "https://github.com/EXCALIBUR303/lifeos",
    liveUrl: "https://lifeos-eta-woad.vercel.app",
    sourceVisibility: "public",
    interactionLabel: "Source-backed architecture explorer",
    overview:
      "One installable web app for everyday life data. It keeps everything in the browser, scores each area with a rule-based engine and can sync between devices with end-to-end encryption.",
    problem:
      "Tasks, habits, money, health and notes usually live in separate apps that cannot see each other.",
    solution:
      "A single local-first app with shared data, so insights such as a life score, unusual spending, habit risk and burnout watch can use all of it.",
    features: [
      "Modules for tasks, habits, money, goals, journal, health, focus, calendar, study and notes.",
      "Natural-language task entry and a command palette.",
      "Rule-based, on-device insights: life score, spending anomalies, habit risk and burnout watch.",
      "Optional encrypted sync between devices, where the key is derived from a code and the server stores only ciphertext.",
      "Calendar subscription feed, ICS import and export, offline support and installation as an app.",
      "Assistant that can use Claude or Gemini with the user's own key, or an on-device fallback.",
    ],
    limitations: [
      "Data lives in the browser's local storage unless the user turns on sync.",
      "Conflicts in sync resolve by newest write wins.",
      "Health data from phones and two-way calendar sync are listed in the README as future work.",
      "Not run in this portfolio audit; no tests are named in the README.",
    ],
    architecture: {
      kind: "Reconstructed from the repository README",
      nodes: [
        {
          id: "pages",
          label: "Module pages",
          description: "One route per module, rendered on the client.",
        },
        {
          id: "store",
          label: "Zustand store",
          description: "App state persisted to browser local storage.",
        },
        {
          id: "insights",
          label: "Insights engine",
          description:
            "Rule-based life score and detectors that run on the device.",
        },
        {
          id: "assistant",
          label: "Assistant",
          description:
            "Claude, Gemini or an on-device fallback, using the user's own key.",
        },
        {
          id: "sync",
          label: "Encrypted sync",
          description:
            "Optional device sync that stores only ciphertext on the server.",
        },
      ],
      edges: [
        ["pages", "store"],
        ["store", "insights"],
        ["insights", "assistant"],
        ["store", "sync"],
      ],
    },
    sources: [
      {
        label: "Modules, architecture and privacy model",
        path: "README.md",
        url: "https://github.com/EXCALIBUR303/lifeos/blob/0d63cbbd48789835ff8c5d7b3163d4aac99e4b3a/README.md",
      },
      {
        label: "On-device insights engine",
        path: "src/lib/insights.ts",
        url: "https://github.com/EXCALIBUR303/lifeos/blob/0d63cbbd48789835ff8c5d7b3163d4aac99e4b3a/src/lib/insights.ts",
      },
      {
        label: "Persisted application store",
        path: "src/lib/store.ts",
        url: "https://github.com/EXCALIBUR303/lifeos/blob/0d63cbbd48789835ff8c5d7b3163d4aac99e4b3a/src/lib/store.ts",
      },
    ],
    sourceCommit: "0d63cbbd48789835ff8c5d7b3163d4aac99e4b3a",
    eyebrow: "Personal / Productivity app",
  },
  {
    id: "aura",
    slug: "aura",
    repository: "AURA",
    title: "AURA",
    tagline: "A developer universe you can walk through.",
    description:
      "A native macOS app that hosts a navigable 3D developer studio and an AI companion, with a SwiftUI shell and a React and three.js scene in a web view.",
    collection: "Personal",
    discipline: "Software",
    classificationNote:
      "Personal software project; the README describes work in progress.",
    demo: {
      type: "local",
      url: null,
      summary:
        "Run the studio in a browser with a mock bridge, or run it inside the native shell on Apple Silicon.",
      commands: [
        "# From the repository root.",
        "npm --prefix frontend install",
        "npm --prefix frontend run dev",
        "# In a second terminal, for the native shell:",
        "AURA_DEV_SERVER_URL=http://127.0.0.1:5173 swift run --package-path macos AuraApp",
      ],
      environment: [],
      runtimeStatus:
        "Not run in this portfolio audit. Commands come from the repository README.",
      testStatus:
        "The README lists TypeScript and Swift test commands; they were not run here.",
      verifiedOn: "2026-10-23",
      notes: [
        "Source and documentation were read at the pinned commit; nothing was executed.",
        "Needs macOS 15 on Apple Silicon and the avatar model, which is not stored in git.",
      ],
    },
    categories: ["Interactive Systems", "AI/ML", "Engineering"],
    stack: [
      "Swift",
      "SwiftUI",
      "React",
      "three.js",
      "React Three Fiber",
      "TypeScript",
      "SQLite",
    ],
    status: "Work in progress",
    kind: "architecture",
    accent: "#9ac2f5",
    featured: false,
    githubUrl: "https://github.com/EXCALIBUR303/AURA",
    liveUrl: null,
    sourceVisibility: "public",
    interactionLabel: "Source-backed architecture explorer",
    overview:
      "The web layer owns everything visual and the native layer owns everything privileged, such as credentials, files, the microphone and storage. They talk only through a typed, versioned JSON bridge.",
    problem:
      "A rich 3D interface is easiest to build on the web, but an app that touches tokens, files and voice should not give that code direct access.",
    solution:
      "Split the app along a bridge: a React and three.js studio in a web view for the visuals, and Swift services behind a router for the privileged work.",
    features: [
      "Navigable 3D studio with zones for a hardware lab, software studio, AI lab and GitHub projects.",
      "Typed bridge contracts in TypeScript that both the web client and Swift tests decode.",
      "Read-only GitHub integration using a GitHub App with device-flow sign-in and the token in the Keychain.",
      "Provider-neutral AI service with a mock and an OpenAI-compatible adapter that can also reach local runtimes.",
      "Speech recognition and synthesis using system frameworks on the device.",
    ],
    limitations: [
      "The README describes the app as in progress, with AI and voice still mocked or unavailable over the bridge at that point.",
      "Requires macOS 15 on Apple Silicon.",
      "The 3D avatar model is not in the repository and carries its own CC BY 4.0 credit.",
      "Not run in this portfolio audit.",
    ],
    architecture: {
      kind: "Reconstructed from the repository architecture document",
      nodes: [
        {
          id: "studio",
          label: "React studio",
          description:
            "React, three.js and React Three Fiber scene inside a web view.",
        },
        {
          id: "bridge",
          label: "Typed bridge",
          description:
            "Versioned JSON contracts shared by the web client and Swift.",
        },
        {
          id: "router",
          label: "Bridge router",
          description:
            "Swift router that dispatches to preferences, projects, GitHub, AI and voice services.",
        },
        {
          id: "github",
          label: "GitHub service",
          description:
            "Read-only GitHub App access with the token held in the Keychain.",
        },
        {
          id: "ai",
          label: "AI and voice",
          description:
            "Provider-neutral AI service and on-device speech frameworks.",
        },
        {
          id: "store",
          label: "SQLite store",
          description: "Local persistence for preferences and project data.",
        },
      ],
      edges: [
        ["studio", "bridge"],
        ["bridge", "router"],
        ["router", "github"],
        ["router", "ai"],
        ["router", "store"],
      ],
    },
    sources: [
      {
        label: "Overview, requirements and quick start",
        path: "README.md",
        url: "https://github.com/EXCALIBUR303/AURA/blob/895ebc3fed1017d86854e03a0789c11a2b7a7155/README.md",
      },
      {
        label: "Architecture and bridge design",
        path: "ARCHITECTURE.md",
        url: "https://github.com/EXCALIBUR303/AURA/blob/895ebc3fed1017d86854e03a0789c11a2b7a7155/ARCHITECTURE.md",
      },
      {
        label: "GitHub integration design",
        path: "docs/PHASE3B_GITHUB.md",
        url: "https://github.com/EXCALIBUR303/AURA/blob/895ebc3fed1017d86854e03a0789c11a2b7a7155/docs/PHASE3B_GITHUB.md",
      },
    ],
    sourceCommit: "895ebc3fed1017d86854e03a0789c11a2b7a7155",
    eyebrow: "Personal / Native app",
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
