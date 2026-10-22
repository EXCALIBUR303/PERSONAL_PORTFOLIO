"use client";
import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ExternalLink,
  Github,
  ShieldCheck,
} from "lucide-react";
import type { Project } from "@/data/projects";
import DemoConsole from "@/components/demo-console";
import ArchitectureExplorer from "@/components/architecture-explorer";
import { Reveal, SectionLabel } from "@/components/ui";
import { usePortfolioState } from "@/components/app-frame";
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
export default function ProjectWorld({
  project,
  index,
  count,
  nextProject,
}: {
  project: Project;
  index: number;
  count: number;
  nextProject: { slug: string; title: string };
}) {
  const { beginPortal } = usePortfolioState();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      heading.current?.focus({ preventScroll: true }),
    );
    return () => cancelAnimationFrame(frame);
  }, [project.slug]);
  return (
    <main
      id="main"
      className={`project-world world-${project.kind}`}
      style={{ "--world-accent": project.accent } as React.CSSProperties}
      tabIndex={-1}
    >
      <div className="world-color-wash" aria-hidden="true" />
      <div className="container">
        <div className="world-breadcrumb">
          <Link href="/#projects">
            <ArrowLeft size={16} />
            Back to Multiverse
          </Link>
          <span className="mono">
            WORLD {String(index + 1).padStart(2, "0")} /{" "}
            {String(count).padStart(2, "0")}
          </span>
        </div>
        <header className="world-header">
          <div>
            <span className="world-eyebrow eyebrow">{project.eyebrow}</span>
            <h1 ref={heading} tabIndex={-1}>
              {project.title}
            </h1>
            <p className="world-tagline">{project.tagline}</p>
          </div>
          <div className="world-header-meta">
            <span className="world-status">
              <ShieldCheck size={15} />
              {project.status}
            </span>
            <p>{project.description}</p>
            <div className="project-tags">
              {project.stack.map((tool) => (
                <span key={tool}>{tool}</span>
              ))}
            </div>
            <span className="world-stack-note mono">
              {project.sourceVisibility === "public"
                ? "REPOSITORY STACK"
                : "PUBLIC DEMO STACK"}
            </span>
          </div>
        </header>
        <div className="world-collection-label mono">
          {project.collection.toUpperCase()} PROJECTS /{" "}
          {project.discipline.toUpperCase()}
        </div>
        <nav className="world-section-nav" aria-label="Project sections">
          <a href="#world-demo">Demo & local setup</a>
          <a href="#world-playground">Explore</a>
          {project.architecture.nodes.length > 0 && (
            <a href="#world-architecture">Architecture</a>
          )}
          <a href="#world-overview">The story</a>
          <a href="#world-evidence">Evidence & limits</a>
        </nav>
        <DemoConsole project={project} />
        <section id="world-playground" className="world-playground">
          <div className="world-section-heading">
            <div>
              <span className="eyebrow">INSIDE THE WORLD</span>
              <h2>
                Try the <em>idea.</em>
              </h2>
            </div>
            <span className="world-mode-label">{project.interactionLabel}</span>
          </div>
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
        </section>
        {project.architecture.nodes.length > 0 && (
          <section id="world-architecture" className="world-architecture">
            <SectionLabel number="A">
              DIMENSION ENGINE / SYSTEM MAP
            </SectionLabel>
            <h2>
              Trace the <em>connections.</em>
            </h2>
            <ArchitectureExplorer project={project} />
          </section>
        )}
        <section id="world-overview" className="world-story">
          <SectionLabel number="B">THE QUESTION / THE BUILD</SectionLabel>
          <div className="world-story-grid">
            <Reveal>
              <span className="eyebrow">THE PROBLEM</span>
              <h2>
                A question
                <br />
                worth <em>asking.</em>
              </h2>
              <p>{project.problem}</p>
            </Reveal>
            <div>
              <span className="eyebrow">THE APPROACH</span>
              <h3>{project.tagline}</h3>
              <p>{project.solution}</p>
              <h4>Documented scope</h4>
              <ul>
                {project.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
        <section id="world-evidence" className="world-evidence">
          <SectionLabel number="C">EVIDENCE / HONEST BOUNDARIES</SectionLabel>
          <div className="evidence-grid">
            <div>
              <h2>
                Know the
                <br />
                <em>limits.</em>
              </h2>
              <ul>
                {project.limitations.map((limit) => (
                  <li key={limit}>{limit}</li>
                ))}
              </ul>
            </div>
            <div className="source-ledger">
              <span className="eyebrow">IMPLEMENTATION EVIDENCE</span>
              <h3>
                {project.sourceVisibility === "public"
                  ? "Follow it to the source."
                  : project.kind === "unavailable"
                    ? "Private implementation."
                    : "An independent study."}
              </h3>
              {project.sourceCommit && (
                <p className="source-commit mono">
                  AUDITED COMMIT / {project.sourceCommit.slice(0, 10)}
                </p>
              )}
              {project.sources.map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div>
                    <b>{source.label}</b>
                    <span>{source.path}</span>
                  </div>
                  <ArrowUpRight size={16} />
                </a>
              ))}
              {!project.sources.length && (
                <p>
                  {project.kind === "unavailable"
                    ? "Only the name and college classification provided by the owner are displayed. Private source and internal project details are withheld."
                    : "The supplied football repository is private. Its code was not read or reproduced. All controls and visuals here belong to this original portfolio demonstration."}
                </p>
              )}
              <div className="world-source-actions">
                {project.githubUrl && (
                  <a
                    className="button button-outline"
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github size={16} />
                    Open repository
                    <ArrowUpRight size={15} />
                  </a>
                )}
                {project.liveUrl ? (
                  <a
                    className="button button-lime"
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink size={15} />
                    Verified live demo
                  </a>
                ) : (
                  <span className="unavailable">
                    {project.sourceVisibility === "public"
                      ? "No verified external live demo"
                      : "Private source not shared"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
        <div className="world-next">
          <Link href="/#projects">
            <ArrowLeft size={17} />
            Back to Multiverse
          </Link>
          <Link
            href={`/projects/${nextProject.slug}`}
            prefetch={false}
            onClick={() => beginPortal(project.accent)}
          >
            <div>
              <span className="mono">NEXT DIMENSION</span>
              <strong>{nextProject.title}</strong>
            </div>
            <ArrowRight size={24} />
          </Link>
        </div>
      </div>
    </main>
  );
}
