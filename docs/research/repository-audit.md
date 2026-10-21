# Public repository research — Devfolio V2

Verified 21 October 2026. Source inspection only; external services and ML training were not rerun.

Public profile name: **Sidharth Sood**. Degree from user's brief: **B.Tech CSE**. University, dates and public contact email remain unverified.

**Private Football repository:** no source or README read. Any football demo must be separately authored and clearly independent. **GitHub PERSONAL_PORTFOLIO:** public but empty; tree API returns 409.

## Student Burnout AI

- Repository: https://github.com/EXCALIBUR303/student-burnout-ai
- Snapshot: 8f80e29eaf152938cba8cd094bb94afacf107289
- Status: Research prototype
- Stack: React, JavaScript, FastAPI, Python, SQLite, scikit-learn, XGBoost, LightGBM
- Summary: A student well-being research application connecting a self-reported lifestyle questionnaire with a model-processing and personal-history interface.

Verified features:
- React questionnaire and dashboard pages
- FastAPI prediction, history, insights and feedback endpoints
- SQLite persistence and authenticated account flows
- v5 stacking ensemble: XGBoost + LightGBM → LogisticRegression meta-learner
- 18 model features: 7 objective lifestyle, 4 subjective, 7 engineered

Architecture: Lifestyle questionnaire → FastAPI input boundary → Feature preparation → Stacking model → Insights & history.

Limits:
- Not a clinical or diagnostic instrument; no clinical validation established.
- Mixed/synthetic-source holdout metrics do not establish real-student predictive validity.
- v5 metadata reports primary holdout accuracy 0.7672 and macro-F1 0.7932, but real-lifestyle benchmark accuracy 0.337 and macro-F1 0.168. Prefer not highlighting a single accuracy figure.
- Trainer comments initially claim 19 features; actual feature arrays, model metadata and inference source have 18.
- Source includes older duplicate frontend/backend trees; current primary backend main.py tries v5 artifact before v4/v3/legacy.
- No model training or backend execution was rerun during this portfolio audit.

Evidence:
- [Frontend stack](https://github.com/EXCALIBUR303/student-burnout-ai/blob/8f80e29eaf152938cba8cd094bb94afacf107289/burnout-frontend/package.json)
- [API, model loading and inference](https://github.com/EXCALIBUR303/student-burnout-ai/blob/8f80e29eaf152938cba8cd094bb94afacf107289/burnout-backend/main.py)
- [Training/model implementation](https://github.com/EXCALIBUR303/student-burnout-ai/blob/8f80e29eaf152938cba8cd094bb94afacf107289/burnout-backend/trainer_v5.py)
- [Feature list and reported evaluation limitations](https://github.com/EXCALIBUR303/student-burnout-ai/blob/8f80e29eaf152938cba8cd094bb94afacf107289/burnout-backend/model_meta_v5.json)
- [Backend dependencies](https://github.com/EXCALIBUR303/student-burnout-ai/blob/8f80e29eaf152938cba8cd094bb94afacf107289/burnout-backend/requirements.txt)

## Mazera AI Maze Solver

- Repository: https://github.com/EXCALIBUR303/mazera-ai-maze-solver
- Snapshot: 6fad8eddc8ad8c5d216ff9eb11d11c270572fb24
- Status: Implemented visualizer
- Stack: React, JavaScript, Vite, Bootstrap, Lucide
- Summary: A browser graph-search visualizer comparing traversal order and final paths through generated mazes.

Verified features:
- BFS, DFS, Dijkstra, A*, Greedy Best-First and Bidirectional search are implemented functions
- A* and Greedy accept Manhattan or Euclidean heuristics
- Random DFS-carved, Spiral, Zigzag and Open Field generators
- Visited order, path length, nodes explored, measured execution duration
- Recent maze history in browser-local state

Architecture: Maze generator → Graph search → Search trace → Traversal visualization → Browser history.

Limits:
- Grid movements are four-connected and unweighted; do not imply terrain costs or neural-network inference.
- DFS and Greedy are not shortest-path guarantees.
- Random generation includes an even-size goal connector.
- The portfolio may adapt these algorithms in TypeScript, but should identify the scene as an adapted educational demonstration rather than an embedded original app.
- No production demo URL was verified.

Evidence:
- [Features and run instructions](https://github.com/EXCALIBUR303/mazera-ai-maze-solver/blob/6fad8eddc8ad8c5d216ff9eb11d11c270572fb24/README.md)
- [All six actual solver functions](https://github.com/EXCALIBUR303/mazera-ai-maze-solver/blob/6fad8eddc8ad8c5d216ff9eb11d11c270572fb24/src/algorithms/solvers.js)
- [Actual maze generators](https://github.com/EXCALIBUR303/mazera-ai-maze-solver/blob/6fad8eddc8ad8c5d216ff9eb11d11c270572fb24/src/utils/maze.js)
- [Visualizer UI](https://github.com/EXCALIBUR303/mazera-ai-maze-solver/blob/6fad8eddc8ad8c5d216ff9eb11d11c270572fb24/src/main.jsx)
- [Verified stack](https://github.com/EXCALIBUR303/mazera-ai-maze-solver/blob/6fad8eddc8ad8c5d216ff9eb11d11c270572fb24/package.json)

## Cycoil · UCO Recovery Station

- Repository: https://github.com/EXCALIBUR303/uco-recovery-station
- Snapshot: 44608149de81cd50ab75ad56e120fbbc5c0e84e1
- Status: Software prototype · hardware calibration pending
- Stack: TypeScript, NestJS, Prisma, PostgreSQL, Preact, Vite, Next.js
- Summary: A used-cooking-oil recovery software platform combining a touchscreen kiosk, sensor-decision backend and fleet dashboard.

Verified features:
- Kiosk session and pairing flow
- Backend classifier gates weight, capacitance and color in that order
- Accepted, rejected and ignored deposit states; below-threshold drips never count as offences
- Transactional offence counting and blacklist handling
- Integer grams and paise; reserve/capture/release wallet ledger
- Machine telemetry, effective status and dashboard notifications
- Admin/renter scoping and rental billing

Architecture: Touchscreen kiosk → Sensor input → Server classifier → Deposit & wallet ledger → Fleet dashboard.

Limits:
- Sensor calibration thresholds are placeholders until measured on real hardware.
- README states real money is not moving; payments default to mock Razorpay until real configuration.
- README has stale/inconsistent statements about phone signup and telemetry auth; avoid broad claims of complete production readiness.
- Do not invent filtration or biodiesel hardware stages: source verifies the software deposit/classification/payment workflow, not physical purification machinery.
- No environmental impact reduction numbers are established.
- No external service or physical hardware was exercised in this audit.

Evidence:
- [Current scope and important mock/calibration limitations](https://github.com/EXCALIBUR303/uco-recovery-station/blob/44608149de81cd50ab75ad56e120fbbc5c0e84e1/README.md)
- [Pure classifier and integer payout arithmetic](https://github.com/EXCALIBUR303/uco-recovery-station/blob/44608149de81cd50ab75ad56e120fbbc5c0e84e1/apps/api/src/kiosk/sensor-classifier.ts)
- [Deposit/session and offence transactions](https://github.com/EXCALIBUR303/uco-recovery-station/blob/44608149de81cd50ab75ad56e120fbbc5c0e84e1/apps/api/src/kiosk/kiosk.service.ts)
- [Implemented data model](https://github.com/EXCALIBUR303/uco-recovery-station/blob/44608149de81cd50ab75ad56e120fbbc5c0e84e1/apps/api/prisma/schema.prisma)
- [NestJS/Prisma/PostgreSQL dependencies](https://github.com/EXCALIBUR303/uco-recovery-station/blob/44608149de81cd50ab75ad56e120fbbc5c0e84e1/apps/api/package.json)
- [Kiosk dependencies](https://github.com/EXCALIBUR303/uco-recovery-station/blob/44608149de81cd50ab75ad56e120fbbc5c0e84e1/apps/kiosk/package.json)
- [Dashboard dependencies](https://github.com/EXCALIBUR303/uco-recovery-station/blob/44608149de81cd50ab75ad56e120fbbc5c0e84e1/apps/dashboard/package.json)

## SmartPark DBMS

- Repository: https://github.com/EXCALIBUR303/DBMS_SMART_PARKING
- Snapshot: f4fe6b10e8ed189fe02afcf9931f960cd5c8b87a
- Status: Implemented academic system
- Stack: Python, FastAPI, PostgreSQL 17, SQL, HTML, CSS, JavaScript
- Summary: A multi-level parking allocation and billing system whose relational database enforces capacity, tariff and access rules.

Verified features:
- Facility → floor → zone → slot hierarchy
- Free, reserved, occupied and out-of-service bay states with selectable details
- Gate entry/exit and row-locked slot allocation
- Reservations, parking passes, tariff-derived billing, payment records and violations
- 17 implemented relations documented in a generated schema
- RLS and role-scoped APIs; reporting views

Architecture: Floor map UI → FastAPI application → Allocation transaction → Parking session → Tariff billing.

Limits:
- Payments are recorded, not processed through a payment gateway.
- A portfolio floor map must label its occupancy fixtures as simulated and must not imply connection to the deployed database.
- No real facility operation or revenue/occupancy impact is established.
- README provides a live URL, but its reachability was not verified here because the environment's HTTP policy does not allow the destination. Leave liveUrl null until an approved check succeeds.

Evidence:
- [Scope, architecture and documented demo](https://github.com/EXCALIBUR303/DBMS_SMART_PARKING/blob/f4fe6b10e8ed189fe02afcf9931f960cd5c8b87a/README.md)
- [Row-lock allocation and gate lifecycle](https://github.com/EXCALIBUR303/DBMS_SMART_PARKING/blob/f4fe6b10e8ed189fe02afcf9931f960cd5c8b87a/db/migrations/006_gate_transactions.sql)
- [17 actual relations and keys](https://github.com/EXCALIBUR303/DBMS_SMART_PARKING/blob/f4fe6b10e8ed189fe02afcf9931f960cd5c8b87a/docs/database/RELATIONAL_SCHEMA.md)
- [Actual bay states and filters](https://github.com/EXCALIBUR303/DBMS_SMART_PARKING/blob/f4fe6b10e8ed189fe02afcf9931f960cd5c8b87a/web/js/slots.js)
- [API boundaries and permissions](https://github.com/EXCALIBUR303/DBMS_SMART_PARKING/blob/f4fe6b10e8ed189fe02afcf9931f960cd5c8b87a/docs/API.md)

## Predictive Maintenance

- Repository: https://github.com/EXCALIBUR303/rul-predictive-maintenance
- Snapshot: 9bb3742068623e99945a7ba9d66011e4c312eb37
- Status: Reproducible research pipeline
- Stack: Python, PyTorch, XGBoost, scikit-learn, NumPy, pandas, FastAPI
- Summary: A leakage-safe remaining-useful-life research pipeline comparing four model families on NASA C-MAPSS FD001 and FD004.

Verified features:
- 26-column C-MAPSS schema validation: engine ID, cycle, 3 settings and 21 sensors
- Engine-level train/validation split before preprocessing
- Training-only sensor filtering and scaling; six KMeans operating regimes for FD004
- 30-cycle per-engine windows and a 125-cycle target cap
- XGBoost summary-feature baseline versus LSTM, GRU and small Transformer
- Three fixed experiment seeds and committed per-seed/aggregate results
- FastAPI loads the same persisted preprocessor/window code for inference

Architecture: C-MAPSS trajectories → Engine-level split → Training-only preprocessing → 30-cycle context → Four model families → Point-estimate API.

Limits:
- C-MAPSS is simulated turbofan degradation data, not live industrial telemetry.
- Model checkpoints and raw data are not committed; portfolio must not pretend the full model is loaded.
- Predictions are point estimates; API explicitly returns no calibrated per-prediction confidence.
- Reported metrics belong to the repository experiments, not an independent reproduction in this audit.
- A digital twin and machine-component labels would be illustrative spatial metaphors for the pipeline, not a validated physical turbine replica.

Evidence:
- [Protocol and reported results](https://github.com/EXCALIBUR303/rul-predictive-maintenance/blob/9bb3742068623e99945a7ba9d66011e4c312eb37/README.md)
- [FD001 configuration](https://github.com/EXCALIBUR303/rul-predictive-maintenance/blob/9bb3742068623e99945a7ba9d66011e4c312eb37/configs/fd001.yaml)
- [FD004 configuration](https://github.com/EXCALIBUR303/rul-predictive-maintenance/blob/9bb3742068623e99945a7ba9d66011e4c312eb37/configs/fd004.yaml)
- [Train-fitted scaling and regime handling](https://github.com/EXCALIBUR303/rul-predictive-maintenance/blob/9bb3742068623e99945a7ba9d66011e4c312eb37/src/rul_pm/data/preprocess.py)
- [Actual neural models](https://github.com/EXCALIBUR303/rul-predictive-maintenance/blob/9bb3742068623e99945a7ba9d66011e4c312eb37/src/rul_pm/models/torch_models.py)
- [Artifact loading and point-confidence limitation](https://github.com/EXCALIBUR303/rul-predictive-maintenance/blob/9bb3742068623e99945a7ba9d66011e4c312eb37/src/rul_pm/api/app.py)
- [Reported FD001 measurements](https://github.com/EXCALIBUR303/rul-predictive-maintenance/blob/9bb3742068623e99945a7ba9d66011e4c312eb37/results/FD001/model_comparison.json)
- [Reported FD004 measurements](https://github.com/EXCALIBUR303/rul-predictive-maintenance/blob/9bb3742068623e99945a7ba9d66011e4c312eb37/results/FD004/model_comparison.json)

## Campus Green Mobility

- Repository: https://github.com/EXCALIBUR303/pbl6-green-mobility
- Snapshot: 85ae0c58509590a1743d45e0c0c841b3087cc47f
- Status: Academic application
- Stack: Java, JSP, JDBC, MySQL, Maven, Tomcat, Bootstrap
- Summary: Campus EV-shuttle and shared-bike booking with atomic seat-capacity checks and estimated carbon savings.

Verified features:
- Server-rendered browse → confirm → atomic booking → history flow
- JDBC DAO and JavaBean model boundaries
- Atomic UPDATE WHERE booked_count < capacity prevents last-seat conflict
- Monthly archive/close-out and points/feedback code exists
- Carbon estimate uses distance × difference in simplified emission factors

Architecture: JSP pages → JDBC DAOs → Atomic booking → MySQL records → Estimated CO₂.

Limits:
- Carbon values are estimates from simplified factors, not measured environmental savings.
- README has stale three-table descriptions although migrations add points, feedback and archives.
- Local Tomcat deployment documented; no verified external demo URL.
- Do not publish sample accounts or credentials from the public README.

Evidence:
- [Scope and academic stack](https://github.com/EXCALIBUR303/pbl6-green-mobility/blob/85ae0c58509590a1743d45e0c0c841b3087cc47f/README.md)
- [Explicitly simplified CO₂ formula](https://github.com/EXCALIBUR303/pbl6-green-mobility/blob/85ae0c58509590a1743d45e0c0c841b3087cc47f/src/main/java/com/woxsen/greenmobility/util/CarbonCalculator.java)
- [Capacity enforcement source](https://github.com/EXCALIBUR303/pbl6-green-mobility/blob/85ae0c58509590a1743d45e0c0c841b3087cc47f/src/main/java/com/woxsen/greenmobility/dao/SlotDAO.java)

## AERIS

- Repository: https://github.com/EXCALIBUR303/aeris
- Snapshot: b55ca2fb161b4b5d6f1be01bce70dcd8ea1539db
- Status: Simulation research · in progress
- Stack: Python, NumPy, PyTorch, Gymnasium, PX4 SITL, Gazebo Harmonic
- Summary: A simulated drone-autonomy research platform with mapping, planning, mission and learning modules above external PX4 flight control.

Verified features:
- Implemented 8-connected A* with octile heuristic and configurable unknown-cell cost
- Mapping, localization, navigation, mission and evaluation source modules
- PPO implementation and feed-forward/recurrent networks described in phase-14 report
- FastSim and higher-fidelity simulation boundaries documented

Architecture: Simulation boundary → Perception & mapping → A* planner → Learning layer → Mission & evaluation.

Limits:
- README phase-2 status table is stale; phase reports through 14 and actual later source are the stronger evidence.
- Do not claim all 34 roadmap phases or physical autonomous flight are completed.
- Physical flight is explicitly out of scope.
- Phase-14 report retains a flaky simulation boot failure and says no Tier H runs in that phase; do not erase reported limitations.
- Research benchmarks were not independently rerun during this portfolio audit.

Evidence:
- [Project boundaries; status table is stale](https://github.com/EXCALIBUR303/aeris/blob/b55ca2fb161b4b5d6f1be01bce70dcd8ea1539db/README.md)
- [Implemented A*](https://github.com/EXCALIBUR303/aeris/blob/b55ca2fb161b4b5d6f1be01bce70dcd8ea1539db/aeris/autonomy/planning/astar.py)
- [Later implementation/report and limitations](https://github.com/EXCALIBUR303/aeris/blob/b55ca2fb161b4b5d6f1be01bce70dcd8ea1539db/docs/phase_reports/phase-14.md)
- [Package and optional dependency boundaries](https://github.com/EXCALIBUR303/aeris/blob/b55ca2fb161b4b5d6f1be01bce70dcd8ea1539db/pyproject.toml)

## RupeeRise

- Repository: https://github.com/EXCALIBUR303/IIIT_HACKATHON
- Snapshot: 5ec8f7cada7bb187863aaeadc1182e8c1ea19361
- Status: Team academic/hackathon project
- Stack: React, TypeScript, Vite, Tailwind CSS, FastAPI, SQLAlchemy, PostgreSQL, Motion
- Summary: A student financial-literacy platform using deterministic, fictional-money simulations and explainable learning progression.

Verified features:
- Budget, savings, investing and financial-safety simulations
- Deterministic Python calculations; no LLM in numerical outcomes
- Adaptive learning/mastery and educator-class views
- Optional grounded tutor with deterministic fallback
- React/TypeScript frontend and modular FastAPI/PostgreSQL backend

Architecture: React learning UI → FastAPI monolith → Deterministic engine → Mastery layer → PostgreSQL progress.

Limits:
- Five-member team project; do not imply sole authorship or invent the owner's specific responsibility.
- README says built for IIIT Hyderabad Megathon 2026; no award or placement verified.
- Fictional money and educational simulations, not financial recommendations.
- Private answer-key bundle is excluded from public source; do not fetch it or imply production keys are present.
- Repository-stated test totals were not rerun in this audit.

Evidence:
- [Scope, team and limitations](https://github.com/EXCALIBUR303/IIIT_HACKATHON/blob/5ec8f7cada7bb187863aaeadc1182e8c1ea19361/README.md)
- [Actual frontend dependencies](https://github.com/EXCALIBUR303/IIIT_HACKATHON/blob/5ec8f7cada7bb187863aaeadc1182e8c1ea19361/frontend/package.json)
- [Deterministic calculation implementation](https://github.com/EXCALIBUR303/IIIT_HACKATHON/blob/5ec8f7cada7bb187863aaeadc1182e8c1ea19361/backend/app/engine/budget.py)

## Privacy-first Resume Screener

- Repository: https://github.com/EXCALIBUR303/resume-screener
- Snapshot: 3d7e8f0e2ab71cca28e614c6d8c2a55af213f3fd
- Status: Research / portfolio system
- Stack: Python, FastAPI, PostgreSQL, pgvector, Next.js, Ollama, fastembed, Presidio, spaCy, Tesseract, Docker
- Summary: A resume research system that separates untrusted-document parsing/redaction from retrieval and evidence-constrained scoring.

Verified features:
- PDF/DOCX ingestion with byte validation and optional OCR
- Redaction and pseudonymization before embedding or prompting
- PostgreSQL job queue with FOR UPDATE SKIP LOCKED; pgvector retrieval
- Deterministic + model terms with evidence checks and capped model contribution
- Next.js interface and interview-copilot source

Architecture: Upload quarantine → Isolated parse worker → Chunk & retrieve → Evidence-checked scoring → Explanation UI.

Limits:
- Decision support/research only; not audited for bias and not a compliant automated employment-decision tool.
- README explicitly says not to use real candidate data.
- No Redis dependency: a sample synthetic resume mentions Redis, but the actual queue uses PostgreSQL.
- Audio answers explicitly declined; do not imply audio/video multimodal processing.
- Hybrid retrieval does not outperform lexical retrieval on the published synthetic corpus; no broad superiority claim.
- No live model or pipeline was executed in this audit.

Evidence:
- [Architecture, actual stack and candid limitations](https://github.com/EXCALIBUR303/resume-screener/blob/3d7e8f0e2ab71cca28e614c6d8c2a55af213f3fd/README.md)
- [Backend dependencies](https://github.com/EXCALIBUR303/resume-screener/blob/3d7e8f0e2ab71cca28e614c6d8c2a55af213f3fd/apps/api/pyproject.toml)
- [Scoring fusion implementation](https://github.com/EXCALIBUR303/resume-screener/blob/3d7e8f0e2ab71cca28e614c6d8c2a55af213f3fd/apps/api/src/screener_api/scoring/fusion.py)

## SmartPark demo verification limit

The README documents this URL, but connected Vercel verification returned 403 forbidden at read_protection_bypass: this Vercel connection does not authorize the deployment project/team. This does not prove the public app is down. No access settings were changed and no app login or database mutation was attempted.

Keep `liveUrl: null` until a permitted public availability check succeeds. The documented URL may be recorded as a source claim, not a verified working demo.
