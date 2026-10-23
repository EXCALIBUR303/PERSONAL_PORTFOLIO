import { Cpu, Network, Orbit } from "lucide-react";

export type DeskMode = "systems" | "algorithms" | "computation";

/** The three lenses of the hero scene. Both modes read the same list. */
export const stations = [
  {
    id: "systems" as const,
    label: "01 / Systems",
    title: "Make the pieces work together.",
    description: "Interfaces, databases, and the rules that connect them.",
    slug: "smart-parking-dbms",
    project: "Smart Parking DBMS",
    icon: Network,
    accent: "#ff6538",
  },
  {
    id: "algorithms" as const,
    label: "02 / Algorithms",
    title: "Give the question a path.",
    description: "Step inside graph search. Follow every decision.",
    slug: "mazera-ai-maze-solver",
    project: "Mazera AI Maze Solver",
    icon: Orbit,
    accent: "#2f4bf5",
  },
  {
    id: "computation" as const,
    label: "03 / Intelligence",
    title: "Look beneath the prediction.",
    description: "Data, models, and the boundaries of what they tell us.",
    slug: "predictive-maintenance",
    project: "Predictive Maintenance",
    icon: Cpu,
    accent: "#8a5cf6",
  },
];

export type Station = (typeof stations)[number];
