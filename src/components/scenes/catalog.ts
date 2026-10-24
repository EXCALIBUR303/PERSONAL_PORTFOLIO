import { Cpu, Network, Orbit } from "lucide-react";

export type CategoryId = "systems" | "algorithms" | "intelligence";
export type SceneId =
  | "aura"
  | "smartpark"
  | "private-ai"
  | "mazera"
  | "lastmile"
  | "pathable"
  | "robot-dog"
  | "swarmmind"
  | "maintenance";

export type SceneInfo = {
  id: SceneId;
  category: CategoryId;
  /** Short name for the scene picker. */
  name: string;
  title: string;
  /** What kind of visual this is, said plainly. */
  badge: string;
  is3d: boolean;
  seeing: string;
  why: string;
  slug: string;
  project: string;
};

/**
 * The hero scenes. Each one is tied to a real project and shows an idea that
 * project documents. Both modes and the Creative quick peek read this list.
 */
export const scenes: SceneInfo[] = [
  {
    id: "aura",
    category: "systems",
    name: "AURA studio",
    title: "A studio with a bridge underneath.",
    badge: "Illustrative 3D model",
    is3d: true,
    seeing:
      "AURA's four studio zones and its companion sit on the top deck, which is the web layer. Below them are the native Swift services. Choose a zone and send a request to watch it cross the typed bridge.",
    why: "AURA keeps everything visual in a React and three.js web view and everything privileged in Swift, joined only by a versioned JSON bridge. Its README says the AI and voice are still mocked, and nothing from AURA runs here.",
    slug: "aura",
    project: "AURA",
  },
  {
    id: "smartpark",
    category: "systems",
    name: "SmartPark",
    title: "Two cars, one last bay.",
    badge: "Illustrative sequence",
    is3d: false,
    seeing:
      "Two cars ask for the same free bay at the same moment. Switch between a plain check-then-write and a row-locked allocation to see why the database has to decide who gets it.",
    why: "SmartPark DBMS keeps capacity, tariff and access rules in the relational database. Row-locked slot allocation is how it avoids two sessions on one bay.",
    slug: "smart-parking-dbms",
    project: "SmartPark DBMS",
  },
  {
    id: "private-ai",
    category: "systems",
    name: "Private Local AI",
    title: "Answers with a receipt.",
    badge: "Sample-data walkthrough",
    is3d: false,
    seeing:
      "Three made-up notes are split into passages. Ask a question and step through scoring, combining, fencing and citing. No language model runs here: the answer is the best passage, quoted with its source.",
    why: "Private Local AI answers from your own files with hybrid dense and keyword retrieval, cites the file and page, and fences retrieved text as untrusted, all on the machine.",
    slug: "private-local-ai",
    project: "Private Local AI",
  },
  {
    id: "mazera",
    category: "algorithms",
    name: "Mazera",
    title: "Watch a search think.",
    badge: "Working demo",
    is3d: true,
    seeing:
      "A real graph search running on a generated maze. Pick one of Mazera's six algorithms, then play, pause or step through the cells it explores before the path lights up.",
    why: "Mazera compares six search algorithms on mazes. These are TypeScript versions of the same algorithms, running live in your browser.",
    slug: "mazera-ai-maze-solver",
    project: "Mazera AI Maze Solver",
  },
  {
    id: "lastmile",
    category: "algorithms",
    name: "Last Mile DAA",
    title: "Pick the parcels, then the route.",
    badge: "Sample-data walkthrough",
    is3d: false,
    seeing:
      "Eight sample orders around a depot. Step through the stages: choose what fits the van, draw the spanning tree, then compare route orderings.",
    why: "Last Mile DAA chains MST zoning, knapsack selection and route sequencing. These are simplified versions running on sample stops, not outputs of its Python solver.",
    slug: "last-mile-daa",
    project: "Last Mile DAA",
  },
  {
    id: "pathable",
    category: "algorithms",
    name: "PathAble",
    title: "The shortest route is not always yours.",
    badge: "Sample-data walkthrough",
    is3d: false,
    seeing:
      "A small made-up campus. Change the travel profile or report a blocked path, and the route is recomputed with only the paths that profile can use.",
    why: "PathAble routes on a graph with accessibility constraints and reroutes after reviewed community reports. Its own campus examples are fictional too; this is a simplified re-implementation.",
    slug: "pathable",
    project: "PathAble",
  },
  {
    id: "robot-dog",
    category: "intelligence",
    name: "Robot dog",
    title: "Say it. It walks.",
    badge: "Simulation",
    is3d: true,
    seeing:
      "Give the dog a command and follow it through the documented chain: speech, intent, mode controller, policy and simulation. The gait is a hand-written animation, not the trained policy.",
    why: "The Voice-Controlled Robot Dog maps speech through Whisper and a local language model to a velocity and turn command, which a PPO policy turns into 12 joint targets in MuJoCo.",
    slug: "quadruped-rl",
    project: "Voice-Controlled Robot Dog",
  },
  {
    id: "swarmmind",
    category: "intelligence",
    name: "SWARMMIND",
    title: "Four searchers, two baselines.",
    badge: "Simulation",
    is3d: false,
    seeing:
      "Four agents search a grid for hidden survivors. Compare a random walk with frontier exploration, the two baselines SWARMMIND measures its learned policies against.",
    why: "SWARMMIND compares IPPO and MAPPO policies with random and frontier baselines in a search-and-rescue simulator. Only simplified baselines run here, not the learned policies.",
    slug: "swarmmind",
    project: "SWARMMIND",
  },
  {
    id: "maintenance",
    category: "intelligence",
    name: "Predictive Maintenance",
    title: "From sensor drift to remaining life.",
    badge: "Sample-data walkthrough",
    is3d: true,
    seeing:
      "An illustrative cut-away engine above a made-up engine's sensor data, taken through the project's steps: split by engine, scale and filter, 30-cycle windows, the capped remaining-life label, then the results the repository publishes.",
    why: "The project predicts how many cycles an engine has left from simulated NASA C-MAPSS data. The data steps here are small copies of its code run on invented engines; the result tables are copied from its committed results, and nothing is predicted on this page.",
    slug: "predictive-maintenance",
    project: "Predictive Maintenance",
  },
];

export const categories = [
  {
    id: "systems" as const,
    label: "01 / Systems",
    accent: "#ff6538",
    icon: Network,
  },
  {
    id: "algorithms" as const,
    label: "02 / Algorithms",
    accent: "#2f4bf5",
    icon: Orbit,
  },
  {
    id: "intelligence" as const,
    label: "03 / Intelligence",
    accent: "#8a5cf6",
    icon: Cpu,
  },
];

export const scenesIn = (category: CategoryId) =>
  scenes.filter((scene) => scene.category === category);
export const sceneById = (id: SceneId) =>
  scenes.find((scene) => scene.id === id)!;
export const sceneForSlug = (slug: string) =>
  scenes.find((scene) => scene.slug === slug);
export const accentOf = (category: CategoryId) =>
  categories.find((item) => item.id === category)!.accent;
