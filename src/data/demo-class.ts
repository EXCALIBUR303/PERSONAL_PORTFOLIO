import type { Project } from "./projects";

/**
 * What kind of demonstration a project page offers. One place, so both modes
 * and every badge say the same thing, and an illustration is never presented
 * as a live system.
 */
export type DemoClass =
  "working" | "simulation" | "walkthrough" | "architecture";

export const demoClassInfo: Record<
  DemoClass,
  { label: string; blurb: string }
> = {
  working: {
    label: "Working demo",
    blurb: "A real algorithm or interaction running in your browser.",
  },
  simulation: {
    label: "Simulation",
    blurb: "A simplified model of the idea. It is not the project's own run.",
  },
  walkthrough: {
    label: "Sample-data walkthrough",
    blurb: "Made-up sample data, used to show how the idea behaves.",
  },
  architecture: {
    label: "Architecture walkthrough",
    blurb:
      "An illustration of the documented structure. The project itself is not running here.",
  },
};

const bySlug: Record<string, { kind: DemoClass; note: string }> = {
  "mazera-ai-maze-solver": {
    kind: "working",
    note: "The search algorithms are independently re-implemented in TypeScript and run live here. The original Mazera application can also be launched.",
  },
  "football-penalty-shootout": {
    kind: "working",
    note: "A small independent study made for this portfolio. The owner's separate 3D game, Penalty Kings, is a different project with no licence file, so nothing from it is copied here.",
  },
  nexus: {
    kind: "architecture",
    note: "A drawn explanation and committed DEV numbers. The platform is not running here and no robot or scene images are involved.",
  },
  "smart-parking-dbms": {
    kind: "walkthrough",
    note: "Sample bays and a made-up sequence. Nothing here talks to the project's database.",
  },
  "predictive-maintenance": {
    kind: "walkthrough",
    note: "Synthetic engines. No C-MAPSS data, trained model or prediction is used.",
  },
  "last-mile-daa": {
    kind: "walkthrough",
    note: "A small sample instance with simplified versions of the project's ideas. These are not outputs of its Python solver.",
  },
  "parkscan-swarm": {
    kind: "simulation",
    note: "A separate, simplified simulation of the coordination idea. It is not ParkScan's own simulator or benchmark.",
  },
  "uco-recovery-station": {
    kind: "simulation",
    note: "Symbolic software gates. No sensors, machinery or measurements are connected.",
  },
  sigsmith: {
    kind: "architecture",
    note: "A proposed design. Nothing is implemented yet, so there is nothing to run.",
  },
  "student-burnout-ai": {
    kind: "architecture",
    note: "Explains the pipeline. It does not diagnose anything or run the trained model.",
  },
};

export function demoClassFor(project: Project) {
  const entry = bySlug[project.slug] ?? {
    kind: "architecture" as const,
    note: "Built from the documented structure of the repository. The application itself is not running here.",
  };
  return { ...entry, ...demoClassInfo[entry.kind] };
}
