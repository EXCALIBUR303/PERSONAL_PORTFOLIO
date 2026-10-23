import { Cpu, Network, Orbit } from "lucide-react";

export type DeskMode = "systems" | "algorithms" | "computation";

/**
 * The three lenses of the hero. Each one is tied to a real project and shows a
 * visualisation of an idea that project documents. `badge` says honestly what
 * kind of visualisation it is. Both modes read this same list.
 */
export const stations = [
  {
    id: "systems" as const,
    label: "01 / Systems",
    title: "Two cars, one last bay.",
    badge: "Illustrative sequence",
    seeing:
      "Two cars ask for the same free bay at the same moment. Switch between a plain check-then-write and a row-locked allocation to see why the database has to decide who gets it.",
    why: "SmartPark DBMS keeps capacity, tariff and access rules in the relational database. Row-locked slot allocation is how it avoids two sessions on one bay.",
    slug: "smart-parking-dbms",
    project: "SmartPark DBMS",
    icon: Network,
    accent: "#ff6538",
  },
  {
    id: "algorithms" as const,
    label: "02 / Algorithms",
    title: "Watch a search think.",
    badge: "Working demo",
    seeing:
      "A real graph search running on a generated maze. Pick an algorithm and watch which cells it explores before it finds the way out.",
    why: "Mazera compares six search algorithms on mazes. These are TypeScript versions of the same algorithms, running live in your browser.",
    slug: "mazera-ai-maze-solver",
    project: "Mazera AI Maze Solver",
    icon: Orbit,
    accent: "#2f4bf5",
  },
  {
    id: "computation" as const,
    label: "03 / Intelligence",
    title: "Split before you fit.",
    badge: "Sample-data walkthrough",
    seeing:
      "Twelve made-up engines, each cut into windows. Compare splitting by window with splitting by engine, and count how many engines end up on both sides.",
    why: "Predictive Maintenance splits engines into training and validation before any preprocessing, so the model is never scored on engines it has already seen.",
    slug: "predictive-maintenance",
    project: "Predictive Maintenance",
    icon: Cpu,
    accent: "#8a5cf6",
  },
];

export type Station = (typeof stations)[number];
