"use client";
import dynamic from "next/dynamic";
import { ShieldCheck } from "lucide-react";
import type { Project } from "@/data/projects";
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
const WorkflowWorld = dynamic(() => import("./workflow-world"), {
  ssr: false,
  loading: Loading,
});
const PenaltyWorld = dynamic(() => import("./penalty-world"), {
  ssr: false,
  loading: Loading,
});
/** The interactive "Try the idea" module for a project. Shared by both modes. */
export default function WorldPlayground({ project }: { project: Project }) {
  return (
    <>
      {project.kind === "unavailable" ? (
        <div className="private-project-note">
          <ShieldCheck size={32} />
          <h3>Private by design.</h3>
          <p>{project.demo.summary}</p>
        </div>
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
        <WorkflowWorld project={project} />
      )}
    </>
  );
}
