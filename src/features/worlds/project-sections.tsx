"use client";
import { ArrowUpRight, ExternalLink, Github } from "lucide-react";
import type { Project } from "@/data/projects";
import { demoClassFor } from "@/data/demo-class";
import DemoConsole from "@/components/demo-console";
import ArchitectureExplorer from "@/components/architecture-explorer";
import WorldPlayground, { hasDedicatedDemo } from "./world-playground";

/**
 * The building blocks of a project page, shared by Professional and Creative.
 * Each mode wraps them in its own sections; the content and the wording of
 * every honesty label come from one place.
 */

/** Says what kind of demonstration this is, in plain words. */
export function DemoNote({ project }: { project: Project }) {
  const demo = demoClassFor(project);
  return (
    <div className="ps-demonote" data-kind={demo.kind}>
      <span className="ps-demo-badge">{demo.label}</span>
      <p>{demo.note}</p>
    </div>
  );
}

/** The "Try it" body: an honest label, the interactive module, and the original project's own options. */
export function TryBody({ project }: { project: Project }) {
  return (
    <div className="ps-try">
      <DemoNote project={project} />
      <WorldPlayground project={project} />
      <DemoConsole project={project} />
    </div>
  );
}

/** The documented scope of the repository, as a plain numbered list. */
export function ScopeList({ project }: { project: Project }) {
  return (
    <ol className="ps-scope">
      {project.features.map((feature, i) => (
        <li key={feature}>
          <span className="mono" aria-hidden="true">
            {String(i + 1).padStart(2, "0")}
          </span>
          <p>{feature}</p>
        </li>
      ))}
    </ol>
  );
}

/**
 * How it works. Projects with their own demo show the architecture map here.
 * The others already show it as their demo, so this lists what the repository
 * documents instead of drawing the same diagram twice.
 */
export function HowBody({ project }: { project: Project }) {
  const dedicated = hasDedicatedDemo(project);
  if (dedicated && project.architecture.nodes.length > 0)
    return <ArchitectureExplorer project={project} />;
  return <ScopeList project={project} />;
}

export function StackList({ project }: { project: Project }) {
  return (
    <ul
      className="ps-stack"
      aria-label={
        project.sourceVisibility === "public"
          ? "Repository stack"
          : "Public demo stack"
      }
    >
      {project.stack.map((tool) => (
        <li key={tool}>{tool}</li>
      ))}
    </ul>
  );
}

export function LimitsList({ project }: { project: Project }) {
  return (
    <ul className="ps-limits">
      {project.limitations.map((limit) => (
        <li key={limit}>{limit}</li>
      ))}
    </ul>
  );
}

export function SourceLinks({ project }: { project: Project }) {
  return (
    <div className="ps-sources">
      {project.sourceCommit && (
        <p className="mono">AUDITED COMMIT / {project.sourceCommit.slice(0, 10)}</p>
      )}
      {project.sources.map((source) => (
        <a
          key={source.url}
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>
            <b>{source.label}</b>
            <small>{source.path}</small>
          </span>
          <ArrowUpRight size={15} aria-hidden="true" />
        </a>
      ))}
      {!project.sources.length && (
        <p>
          {project.kind === "unavailable"
            ? "Only the name and college classification provided by the owner are displayed. Private source and internal project details are withheld."
            : "No source link is shown. The related football repository's ownership, attribution and licence have not been verified, so nothing from it is used. All controls and visuals here belong to this independent portfolio demonstration."}
        </p>
      )}
    </div>
  );
}

export function ProjectLinks({
  project,
  buttonClass,
  liveClass,
  noneClass,
}: {
  project: Project;
  buttonClass: string;
  liveClass: string;
  noneClass: string;
}) {
  return (
    <div className="ps-links">
      {project.githubUrl && (
        <a
          className={buttonClass}
          href={project.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Github size={16} aria-hidden="true" />
          Open repository
          <ArrowUpRight size={15} aria-hidden="true" />
        </a>
      )}
      {project.liveUrl ? (
        <a
          className={liveClass}
          href={project.liveUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink size={15} aria-hidden="true" />
          Verified live demo
        </a>
      ) : (
        <span className={noneClass}>
          {project.sourceVisibility === "public"
            ? "No verified external live demo"
            : "No source link shown"}
        </span>
      )}
    </div>
  );
}
