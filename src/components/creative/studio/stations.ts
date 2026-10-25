import type { SceneId } from "../../scenes/catalog";
import type { District } from "../identity";

/**
 * How a station is entered, said by its shape on the map:
 *   exhibit   an interactive exhibit exists (a scene made from the project's own ideas)
 *   briefing  a verified project with a briefing and a project page, no exhibit here
 *   blueprint a design on paper, or a link-out project with nothing to run
 */
export type Tier = "exhibit" | "briefing" | "blueprint";

export type ChallengeId =
  | "smartpark"
  | "mazera"
  | "pathable"
  | "aura"
  | "private-ai"
  | "maintenance";

export type Station = {
  slug: string;
  district: District;
  tier: Tier;
  /** Label printed under the landmark. The full title is still the accessible name. */
  short: string;
  /** What the project is for, in one plain line. */
  purpose: string;
  /** Position on the district's 9 x 9 ground plate. */
  at: [number, number];
  /** Exhibit title, for stations with an exhibit. */
  exhibit?: string;
  scene?: SceneId;
  challenge?: ChallengeId;
  /** An exhibit that stays a briefing for now (shared work whose permissions are not settled). */
  note?: string;
};

/**
 * The 20 stations. The district of each is the one named in the project
 * registry; this file never decides a district. Positions are only drawing
 * choices, laid out so that no label touches another.
 */
export const stations: Station[] = [
  // ---- Systems: the workshop ----
  {
    slug: "smart-parking-dbms",
    district: "systems",
    tier: "exhibit",
    short: "SmartPark",
    purpose: "Two cars ask for one bay. The database decides who gets it.",
    at: [1.6, 1.7],
    exhibit: "The Concurrency Garage",
    scene: "smartpark",
    challenge: "smartpark",
  },
  {
    slug: "aura",
    district: "systems",
    tier: "exhibit",
    short: "AURA",
    purpose: "A studio of zones around an AI companion, joined to native services by a typed bridge.",
    at: [4.5, 1.7],
    exhibit: "The Living Developer Studio",
    scene: "aura",
    challenge: "aura",
  },
  {
    slug: "private-local-ai",
    district: "systems",
    tier: "exhibit",
    short: "Private Local AI",
    purpose: "Answers from your own notes, each with the source it came from.",
    at: [7.6, 1.4],
    exhibit: "The Evidence Vault",
    scene: "private-ai",
    challenge: "private-ai",
  },
  {
    slug: "uco-recovery-station",
    district: "systems",
    tier: "briefing",
    short: "Cycoil",
    purpose: "Used cooking oil collection: classifier rules and an integer ledger.",
    at: [1.6, 7.3],
  },
  {
    slug: "green-mobility",
    district: "systems",
    tier: "briefing",
    short: "Green Mobility",
    purpose: "Campus ride-sharing with seat-capacity booking and a CO2 estimate.",
    at: [4.5, 7.3],
  },
  {
    slug: "lifeos",
    district: "systems",
    tier: "briefing",
    short: "LifeOS",
    purpose: "A local-first life tracker with heuristic insights.",
    at: [0.9, 4.5],
  },
  {
    slug: "rupeerise",
    district: "systems",
    tier: "briefing",
    short: "RupeeRise",
    purpose: "A money-habit game on fictional money. A team project.",
    at: [7.4, 7.3],
    note: "A team project, so it stays a briefing here.",
  },
  {
    slug: "burnout-backend",
    district: "systems",
    tier: "blueprint",
    short: "Burnout API",
    purpose: "The API behind Student Burnout AI. Link-out only.",
    at: [8.3, 4.5],
  },

  // ---- Algorithms: the atlas ----
  {
    slug: "mazera-ai-maze-solver",
    district: "algorithms",
    tier: "exhibit",
    short: "Mazera",
    purpose: "Six search algorithms on mazes, with the search made visible.",
    at: [2.2, 2.2],
    exhibit: "The Algorithm Observatory",
    scene: "mazera",
    challenge: "mazera",
  },
  {
    slug: "pathable",
    district: "algorithms",
    tier: "exhibit",
    short: "PathAble",
    purpose: "Routes that respect how each person can travel.",
    at: [6.8, 2.2],
    exhibit: "The Accessible Campus",
    scene: "pathable",
    challenge: "pathable",
  },
  {
    slug: "last-mile-daa",
    district: "algorithms",
    tier: "briefing",
    short: "Last Mile",
    purpose: "Zoning, parcel selection and route order for a delivery van. A team project.",
    at: [2.2, 6.8],
    note: "A team project, so it stays a briefing here.",
  },
  {
    slug: "parkscan-swarm",
    district: "algorithms",
    tier: "briefing",
    short: "ParkScan Swarm",
    purpose: "Robots that scan car parks, coordinated centrally over MQTT.",
    at: [4.5, 8.2],
  },
  {
    slug: "football-penalty-shootout",
    district: "algorithms",
    tier: "briefing",
    short: "Penalty Shootout",
    purpose: "A penalty-kick demonstration made for this portfolio.",
    at: [6.8, 6.8],
  },

  // ---- Intelligence: the lab ----
  {
    slug: "predictive-maintenance",
    district: "intelligence",
    tier: "exhibit",
    short: "Predictive Maintenance",
    purpose: "Estimating the remaining life of engines from sensor histories.",
    at: [1.6, 1.6],
    exhibit: "The Diagnostic Workbench",
    scene: "maintenance",
    challenge: "maintenance",
  },
  {
    slug: "quadruped-rl",
    district: "intelligence",
    tier: "exhibit",
    short: "Robot Dog",
    purpose: "Speech to intent to gait: a quadruped controlled by voice, in simulation.",
    at: [7.4, 1.6],
    exhibit: "The Command Chain",
    scene: "robot-dog",
  },
  {
    slug: "swarmmind",
    district: "intelligence",
    tier: "exhibit",
    short: "SWARMMIND",
    purpose: "Searchers in a grid: a random walk against frontier exploration.",
    at: [7.4, 4.5],
    exhibit: "The Search Table",
    scene: "swarmmind",
  },
  {
    slug: "aeris",
    district: "intelligence",
    tier: "briefing",
    short: "AERIS",
    purpose: "Autonomous drone software, in simulation.",
    at: [1.6, 4.5],
  },
  {
    slug: "resume-screener",
    district: "intelligence",
    tier: "briefing",
    short: "Resume Screener",
    purpose: "Privacy-first resume screening, on synthetic data only.",
    at: [4.5, 8.0],
  },
  {
    slug: "student-burnout-ai",
    district: "intelligence",
    tier: "blueprint",
    short: "Student Burnout AI",
    purpose: "A student questionnaire model with a rule-based override. Link-out only.",
    at: [7.4, 7.4],
  },
  {
    slug: "sigsmith",
    district: "intelligence",
    tier: "blueprint",
    short: "SIGSMITH",
    purpose: "A design for synthesising detection rules. Nothing to run yet.",
    at: [1.3, 6.8],
  },
];

export const stationFor = (slug: string) => stations.find((s) => s.slug === slug);
export const tierWords: Record<Tier, { label: string; note: string }> = {
  exhibit: { label: "Exhibit", note: "Has an interactive exhibit" },
  briefing: { label: "Briefing", note: "A briefing and a project page" },
  blueprint: { label: "Blueprint", note: "Design stage or link-out only" },
};

export const exhibitSlugs = stations.filter((s) => s.tier === "exhibit").map((s) => s.slug);
