import { demoClassFor, type DemoClass } from "./demo-class";
import { projects, type Project } from "./projects";

/**
 * The capture plan and media record for every project's demonstration video.
 *
 * A project's video is real captured output (the portfolio's own scene, a recorded run of the project, or a
 * labelled architecture walkthrough), never a generated depiction of something that is not built. `video`,
 * `poster` and `captions` stay null until the file exists; the player only appears when all three do.
 * See docs/V6-D-MEDIA.md for the size budget and the order of production.
 */
export type CaptureMode = "automatic" | "manual" | "mixed";
export type VideoStatus = "planned" | "captured" | "published";

export type DemoMedia = {
  slug: string;
  /** Target length in seconds: the featured six run longer than the rest. */
  seconds: number;
  /** The real workflow the recording shows. */
  workflow: string;
  /** The shots, in order. */
  shots: string[];
  /** Where the pictures come from. */
  source: string;
  capture: CaptureMode;
  /** Why it is automatic, manual or mixed. */
  captureNote: string;
  posterNeeded: boolean;
  status: VideoStatus;
  /** What the video must say it is not. */
  limitation: string;
  /** Published file paths, or null until they exist. */
  video: string | null;
  poster: string | null;
  captions: string | null;
};

const FEATURED = 45;
const SUPPORT = 20;
const BRIEF = 12;

export const demoMedia: DemoMedia[] = [
  {
    slug: "smart-parking-dbms",
    seconds: FEATURED,
    workflow: "The Concurrency Garage: two cars ask for the same free bay at the same moment; switch from a plain check-then-write to a row-locked allocation and see why the database has to decide.",
    shots: ["The garage and the two cars", "Check-then-write: both cars are told yes", "Row-locked allocation: one wins, the other is handed the next free bay", "The label: sample bays, not the project's database"],
    source: "The portfolio's SmartPark exhibit",
    capture: "automatic",
    captureNote: "A scripted browser run of the exhibit; the sequence is fixed and repeatable.",
    posterNeeded: true,
    status: "planned",
    limitation: "A made-up sequence on sample bays. Nothing talks to the project's database.",
    video: null, poster: null, captions: null,
  },
  {
    slug: "mazera-ai-maze-solver",
    seconds: FEATURED,
    workflow: "A real graph search on a generated maze: pick one of the six algorithms, play or step through the cells it explores until the path lights up, then try another.",
    shots: ["A generated maze", "One algorithm explores, then the path lights up", "A second algorithm on the same maze, with its path length and cells visited", "The note that DFS and greedy do not guarantee shortest paths"],
    source: "The portfolio's re-implemented search (TypeScript); optionally the original Mazera application",
    capture: "mixed",
    captureNote: "The portfolio run is automatic. A recording of the original application needs the owner to launch it.",
    posterNeeded: true,
    status: "planned",
    limitation: "The algorithms are independent re-implementations; cell counts can differ from the original's.",
    video: null, poster: null, captions: null,
  },
  {
    slug: "pathable",
    seconds: FEATURED,
    workflow: "The Accessible Campus: change the travel profile or report a blocked path, and the route is recomputed using only the paths that profile can use.",
    shots: ["The made-up campus", "A different travel profile selected", "A path reported blocked and the route recomputed", "The label: sample campus data"],
    source: "The portfolio's PathAble exhibit",
    capture: "automatic",
    captureNote: "A scripted run of the exhibit.",
    posterNeeded: true,
    status: "planned",
    limitation: "Sample campus data and a simplified route search; not the project's own application or map data.",
    video: null, poster: null, captions: null,
  },
  {
    slug: "aura",
    seconds: FEATURED,
    workflow: "The Living Developer Studio: choose one of the four studio zones and send a request to watch it cross the typed bridge to the native services underneath.",
    shots: ["The studio on the top deck with its companion", "A zone chosen and a request sent", "The request crossing the typed bridge", "The label: an illustrative model, nothing from the app runs"],
    source: "The portfolio's AURA exhibit",
    capture: "automatic",
    captureNote: "A scripted run of the exhibit. A recording of the real AURA application would be manual and only on a safe build.",
    posterNeeded: true,
    status: "planned",
    limitation: "An illustrative model of the structure; the application is work in progress and is not shown running.",
    video: null, poster: null, captions: null,
  },
  {
    slug: "private-local-ai",
    seconds: FEATURED,
    workflow: "The Evidence Vault: three made-up notes are split into passages; ask a question and step through scoring, combining, fencing and citing, and the answer is a quoted passage with its source. A second clip in the 3D world shows the Systems bridge go dark.",
    shots: ["The three sample notes", "A question asked", "Scoring, combining, fencing, citing", "The answer with its source", "The Systems bridge dark in the world view"],
    source: "The portfolio's Private Local AI exhibit and its 3D world",
    capture: "automatic",
    captureNote: "Scripted from the exhibit and the world view.",
    posterNeeded: true,
    status: "planned",
    limitation: "Sample notes. No embedding or language model runs in the scene.",
    video: null, poster: null, captions: null,
  },
  {
    slug: "predictive-maintenance",
    seconds: FEATURED,
    workflow: "From sensor drift to remaining life: split by engine, scale and filter, 30-cycle windows, the capped label, then the results the repository publishes.",
    shots: ["A made-up engine's sensor drift", "The data steps one by one", "A window and its label", "The published result tables, marked as copied from the project"],
    source: "The portfolio's Diagnostic Workbench exhibit",
    capture: "automatic",
    captureNote: "A scripted run of the exhibit.",
    posterNeeded: true,
    status: "planned",
    limitation: "Synthetic engines. No C-MAPSS data, trained model or prediction is used on the page.",
    video: null, poster: null, captions: null,
  },
  {
    slug: "last-mile-daa",
    seconds: SUPPORT,
    workflow: "Eight sample orders around a depot: choose what fits the van, draw the spanning tree, then compare route orderings.",
    shots: ["The orders and the depot", "What fits the van", "The spanning tree", "Two route orderings compared", "The label: not the Python solver's output"],
    source: "The portfolio's Last Mile scene",
    capture: "automatic",
    captureNote: "A scripted run of the scene.",
    posterNeeded: true,
    status: "planned",
    limitation: "A team project, shown as a briefing. Simplified versions of its ideas on a sample instance.",
    video: null, poster: null, captions: null,
  },
  {
    slug: "football-penalty-shootout",
    seconds: SUPPORT,
    workflow: "Aim, set power, read the keeper; then the owner's separate 3D game, Penalty Kings, as a second clip of real play.",
    shots: ["The small study: aim and power", "A save and a goal", "Penalty Kings: the arena, a kick and the replay"],
    source: "The portfolio's study, and a screen recording of the owner's Penalty Kings game",
    capture: "mixed",
    captureNote: "The study is scripted. Penalty Kings needs the owner to run it (npm install, npm run dev) before it can be recorded.",
    posterNeeded: true,
    status: "planned",
    limitation: "The study and the 3D game are two different projects; the video says which clip is which.",
    video: null, poster: null, captions: null,
  },
  {
    slug: "parkscan-swarm",
    seconds: SUPPORT,
    workflow: "Scanners coordinate over a car-park grid: independent scanning against coordinated scanning.",
    shots: ["The lot", "Independent scanners overlap", "Coordinated scanners split the lot", "The label: a separate, simplified simulation"],
    source: "The portfolio's ParkScan scene",
    capture: "automatic",
    captureNote: "A scripted run of the scene.",
    posterNeeded: true,
    status: "planned",
    limitation: "Not ParkScan's own simulator or benchmark.",
    video: null, poster: null, captions: null,
  },
  {
    slug: "swarmmind",
    seconds: SUPPORT,
    workflow: "Four searchers on a grid: a random walk against frontier exploration, replayed from the same seed.",
    shots: ["The search area", "Random walk for 60 steps", "Frontier exploration for 60 steps", "The coverage and found counts"],
    source: "The portfolio's SWARMMIND exhibit",
    capture: "automatic",
    captureNote: "A scripted run of the exhibit.",
    posterNeeded: true,
    status: "planned",
    limitation: "Only the two simple baselines run; the learned IPPO and MAPPO policies do not.",
    video: null, poster: null, captions: null,
  },
  {
    slug: "quadruped-rl",
    seconds: SUPPORT,
    workflow: "The Command Chain: a spoken command becomes an intent, a mode, a velocity and a gait.",
    shots: ["The command", "The chain: speech, intent, mode controller, policy, simulation", "The dog moves"],
    source: "The portfolio's Robot Dog exhibit",
    capture: "automatic",
    captureNote: "A scripted run of the exhibit.",
    posterNeeded: true,
    status: "planned",
    limitation: "The gait is a hand-written animation, not the trained policy; there is no hardware.",
    video: null, poster: null, captions: null,
  },
  {
    slug: "nexus",
    seconds: SUPPORT,
    workflow: "The Embodied Intelligence Lab: the five-part loop, the recorded DEV comparison, and the status board.",
    shots: ["The loop, part by part", "The bars: random, heuristic, trained agent, oracle", "The status board and the not-claimed list"],
    source: "The portfolio's NEXUS exhibit",
    capture: "automatic",
    captureNote: "A scripted run of the exhibit. A recording of the real platform would be manual and is not planned until the HM3D experiments exist.",
    posterNeeded: true,
    status: "planned",
    limitation: "A drawn explanation and committed DEV numbers. No robot, no scene images, no real experiment result.",
    video: null, poster: null, captions: null,
  },
  {
    slug: "aeris",
    seconds: SUPPORT,
    workflow: "The architecture, layer by layer, with what is implemented and what is not.",
    shots: ["The source-backed architecture explorer", "Mapping, planning, learning, safety and FastSim", "The limits: no PX4 run, no autonomy level reached, no physical flight"],
    source: "The portfolio's architecture explorer",
    capture: "automatic",
    captureNote: "A scripted walkthrough of the explorer. A recording of the AERIS showcase on its unmerged work branch would be manual and is labelled synthetic if used.",
    posterNeeded: true,
    status: "planned",
    limitation: "An architecture walkthrough, not a flight. The simulator tiers were not run.",
    video: null, poster: null, captions: null,
  },
  {
    slug: "resume-screener",
    seconds: SUPPORT,
    workflow: "Synthetic resumes pass through the privacy-first pipeline, with leakage checks.",
    shots: ["The pipeline", "A synthetic resume", "The checks"],
    source: "The portfolio's architecture explorer",
    capture: "automatic",
    captureNote: "A scripted walkthrough of the explorer.",
    posterNeeded: true,
    status: "planned",
    limitation: "Synthetic data only; no real resume is shown.",
    video: null, poster: null, captions: null,
  },
  {
    slug: "lifeos",
    seconds: SUPPORT,
    workflow: "The working application on sample data: a day, its heat map and its entries.",
    shots: ["The dashboard on sample data", "Adding an entry", "The heat map"],
    source: "A screen recording of the owner's local LifeOS build",
    capture: "manual",
    captureNote: "Needs the application running locally, on sample data only; the owner records or approves the run.",
    posterNeeded: true,
    status: "planned",
    limitation: "Sample data only; no personal entries.",
    video: null, poster: null, captions: null,
  },
  {
    slug: "uco-recovery-station",
    seconds: BRIEF,
    workflow: "A symbolic accept-and-count sequence for a used-cooking-oil collection kiosk.",
    shots: ["The kiosk", "The weighing dial and the gate lamp", "The counter reads 1"],
    source: "The portfolio's 3D world, Cycoil station",
    capture: "automatic",
    captureNote: "A scripted camera move in the world.",
    posterNeeded: true,
    status: "planned",
    limitation: "Symbolic software gates. No sensors, machinery, measurements or payment.",
    video: null, poster: null, captions: null,
  },
  {
    slug: "green-mobility",
    seconds: BRIEF,
    workflow: "Browse, confirm and book a seat, with the seat count and the carbon estimate.",
    shots: ["Browse", "Book the last seat", "The estimate and its stated method"],
    source: "The portfolio's 3D world, or a recording of the application if the owner runs it on Tomcat and MySQL",
    capture: "mixed",
    captureNote: "The world clip is scripted. The application needs a local Tomcat and MySQL to record.",
    posterNeeded: true,
    status: "planned",
    limitation: "Not deployed; the estimate uses simplified emission factors.",
    video: null, poster: null, captions: null,
  },
  {
    slug: "student-burnout-ai",
    seconds: BRIEF,
    workflow: "How the questionnaire pipeline is built, from answers to the model and the rule-based override.",
    shots: ["The pipeline", "The override", "The label: it diagnoses nothing"],
    source: "The portfolio's architecture explorer",
    capture: "automatic",
    captureNote: "A scripted walkthrough of the explorer.",
    posterNeeded: true,
    status: "planned",
    limitation: "Explains the structure only; no trained model runs and nothing is diagnosed.",
    video: null, poster: null, captions: null,
  },
  {
    slug: "burnout-backend",
    seconds: BRIEF,
    workflow: "One controlled request and response against the backend, on a sample payload.",
    shots: ["The request", "The response", "The structure behind it"],
    source: "A recording of the backend run locally, or the architecture explorer",
    capture: "manual",
    captureNote: "Needs the backend running with a throwaway database; no production data or credentials are used.",
    posterNeeded: true,
    status: "planned",
    limitation: "A sample payload only. Falls back to an architecture walkthrough if the backend cannot be run safely.",
    video: null, poster: null, captions: null,
  },
  {
    slug: "rupeerise",
    seconds: BRIEF,
    workflow: "The choice path on the board, with fictional money.",
    shots: ["The board", "A coin moves along the choice path", "The label: fictional money, a team project"],
    source: "The portfolio's 3D world, RupeeRise station",
    capture: "automatic",
    captureNote: "A scripted camera move in the world.",
    posterNeeded: true,
    status: "planned",
    limitation: "A briefing of a team project; fictional money only; the private answer keys are not shown.",
    video: null, poster: null, captions: null,
  },
  {
    slug: "sigsmith",
    seconds: BRIEF,
    workflow: "A progress walkthrough of the design for synthesising detection rules.",
    shots: ["The problem", "The proposed design", "The label: nothing is implemented yet"],
    source: "The portfolio's architecture explorer",
    capture: "automatic",
    captureNote: "A scripted walkthrough, clearly labelled as a design.",
    posterNeeded: true,
    status: "planned",
    limitation: "A design only. There is nothing to run, so it is not presented as a demo.",
    video: null, poster: null, captions: null,
  },
];

const bySlug = new Map(demoMedia.map((m) => [m.slug, m]));

/** The media record for a project, with the class of demonstration it already declares. */
export function mediaFor(project: Project) {
  const entry = bySlug.get(project.slug);
  if (!entry) return null;
  return { ...entry, title: project.title, demoClass: demoClassFor(project).kind as DemoClass };
}

/** True once a project's video, poster and captions all exist. */
export const hasVideo = (m: DemoMedia) => !!(m.video && m.poster && m.captions);

/** Every project must have a record; checked by a test. */
export const missingMedia = () => projects.filter((p) => !bySlug.has(p.slug)).map((p) => p.slug);
