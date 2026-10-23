"use client";
import dynamic from "next/dynamic";
import { ShieldCheck } from "lucide-react";
import type { Project } from "@/data/projects";
import ArchitectureExplorer from "@/components/architecture-explorer";
function Loading() {
  return (
    <div className="world-module-loading" role="status">
      Preparing the explorer… The source overview is available below.
    </div>
  );
}
const MazeWorld = dynamic(() => import("./maze-world"), {
  ssr: false,
  loading: Loading,
});
const ParkingWorld = dynamic(() => import("./parking-world"), {
  ssr: false,
  loading: Loading,
});
const MaintenanceWorld = dynamic(() => import("./maintenance-world"), {
  ssr: false,
  loading: Loading,
});
const ProcessWorld = dynamic(() => import("./process-world"), {
  ssr: false,
  loading: Loading,
});
const SignalsWorld = dynamic(() => import("./signals-world"), {
  ssr: false,
  loading: Loading,
});
const LastMileWorld = dynamic(() => import("./lastmile-world"), {
  ssr: false,
  loading: Loading,
});
const ParkScanWorld = dynamic(() => import("./parkscan-world"), {
  ssr: false,
  loading: Loading,
});
const PenaltyWorld = dynamic(() => import("./penalty-world"), {
  ssr: false,
  loading: Loading,
});
/** Projects that have their own interactive module. The rest get the architecture walkthrough. */
export function hasDedicatedDemo(project: Project) {
  return (
    [
      "maze",
      "parking",
      "maintenance",
      "process",
      "signals",
      "penalty",
    ].includes(project.kind) ||
    ["last-mile-daa", "parkscan-swarm"].includes(project.slug)
  );
}

/** The interactive "Try it" module for a project. Shared by both modes. */
export default function WorldPlayground({ project }: { project: Project }) {
  return (
    <>
      {project.kind === "unavailable" ? (
        <div className="private-project-note">
          <ShieldCheck size={32} />
          <h3>Private by design.</h3>
          <p>{project.demo.summary}</p>
        </div>
      ) : project.slug === "last-mile-daa" ? (
        <LastMileWorld />
      ) : project.slug === "parkscan-swarm" ? (
        <ParkScanWorld />
      ) : project.kind === "maze" ? (
        <MazeWorld />
      ) : project.kind === "parking" ? (
        <ParkingWorld />
      ) : project.kind === "maintenance" ? (
        <MaintenanceWorld />
      ) : project.kind === "process" ? (
        <ProcessWorld />
      ) : project.kind === "signals" ? (
        <SignalsWorld />
      ) : project.kind === "penalty" ? (
        <PenaltyWorld />
      ) : (
        <ArchitectureExplorer project={project} />
      )}
    </>
  );
}
