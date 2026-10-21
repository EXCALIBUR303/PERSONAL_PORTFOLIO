export type Skill = {
  name: string;
  group: string;
  status:
    "Used in a project" | "Currently learning" | "Interested in exploring";
  projectSlug?: string;
  explanation: string;
};
export const skills: Skill[] = [
  {
    name: "Python",
    group: "Languages",
    status: "Used in a project",
    projectSlug: "predictive-maintenance",
    explanation:
      "Used for trajectory validation, preprocessing, training, and model-serving code.",
  },
  {
    name: "TypeScript",
    group: "Languages",
    status: "Used in a project",
    projectSlug: "uco-recovery-station",
    explanation:
      "Connects the NestJS API, classifier, Prisma models, kiosk, and dashboard code.",
  },
  {
    name: "Java",
    group: "Languages",
    status: "Used in a project",
    projectSlug: "green-mobility",
    explanation:
      "JSP, servlets, and JDBC implement the mobility booking workflow.",
  },
  {
    name: "React",
    group: "Frontend",
    status: "Used in a project",
    projectSlug: "student-burnout-ai",
    explanation:
      "Questionnaire and history views are implemented in the public React frontend.",
  },
  {
    name: "Next.js",
    group: "Frontend",
    status: "Used in a project",
    projectSlug: "uco-recovery-station",
    explanation:
      "The fleet dashboard uses Next.js; this portfolio also uses the App Router.",
  },
  {
    name: "FastAPI",
    group: "Backend",
    status: "Used in a project",
    projectSlug: "smart-parking-dbms",
    explanation:
      "Role-scoped API endpoints mediate parking transactions and reporting.",
  },
  {
    name: "NestJS",
    group: "Backend",
    status: "Used in a project",
    projectSlug: "uco-recovery-station",
    explanation:
      "Server modules coordinate kiosk sessions, classification, ledger operations, and machine telemetry.",
  },
  {
    name: "PyTorch",
    group: "AI / ML",
    status: "Used in a project",
    projectSlug: "predictive-maintenance",
    explanation:
      "LSTM, GRU, and a small Transformer are implemented for remaining-useful-life research.",
  },
  {
    name: "XGBoost",
    group: "AI / ML",
    status: "Used in a project",
    projectSlug: "predictive-maintenance",
    explanation:
      "A summary-feature baseline is compared with sequence models using the same engine-level split.",
  },
  {
    name: "PostgreSQL",
    group: "Data",
    status: "Used in a project",
    projectSlug: "smart-parking-dbms",
    explanation:
      "Relations, constraints, row locks, and database billing functions enforce system rules.",
  },
  {
    name: "Prisma",
    group: "Data",
    status: "Used in a project",
    projectSlug: "uco-recovery-station",
    explanation:
      "A typed relational model and transactional ledger support the recovery station API.",
  },
  {
    name: "Graph search",
    group: "Algorithms",
    status: "Used in a project",
    projectSlug: "mazera-ai-maze-solver",
    explanation:
      "The public source implements BFS, DFS, Dijkstra, A*, Greedy Best-First, and Bidirectional search.",
  },
  {
    name: "Three.js",
    group: "Creative coding",
    status: "Used in a project",
    explanation:
      "Used in this portfolio’s original violet sculpture and optional spatial project views.",
  },
  {
    name: "Robotics",
    group: "Engineering",
    status: "Interested in exploring",
    projectSlug: "aeris",
    explanation:
      "An engineering interest supported by simulation research. This does not claim verified physical flight or hardware deployment.",
  },
];
