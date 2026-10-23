"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ExternalLink,
  Github,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import type { Project } from "@/data/projects";
import DemoConsole, { demoLabel } from "@/components/demo-console";
import ArchitectureExplorer from "@/components/architecture-explorer";
import MiniAnim from "@/components/mini-anim";
import { usePortfolioState } from "@/components/app-frame";
import { animKindFor, toneFor } from "@/components/creative/identity";
import WorldPlayground from "./world-playground";

/**
 * Creative project page. Same project record, same demo console, same
 * playground and architecture explorer as the Professional page, arranged as a
 * poster, folder tabs, a numbered scope timeline and a receipt of evidence.
 */
export default function CreativeProjectWorld({
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
      className="c-project"
      data-tone={toneFor(project.slug)}
      style={{ "--world-accent": project.accent } as React.CSSProperties}
      tabIndex={-1}
    >
      <div className="container">
        <div className="c-crumbs">
          <Link href="/#projects" className="c-chip c-chip-paper">
            <ArrowLeft size={15} aria-hidden="true" />
            Back to the board
          </Link>
          <span className="mono">
            NO. {String(index + 1).padStart(2, "0")} /{" "}
            {String(count).padStart(2, "0")}
          </span>
        </div>

        <header className="c-poster">
          <div className="c-poster-copy">
            <span className="c-pill c-pill-ink mono">{project.eyebrow}</span>
            <h1 ref={heading} tabIndex={-1}>
              {project.title}
            </h1>
            <p className="c-poster-tagline">{project.tagline}</p>
            <dl className="c-meta">
              <div>
                <dt>Collection</dt>
                <dd>{project.collection}</dd>
              </div>
              <div>
                <dt>Type</dt>
                <dd>{project.discipline}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <ShieldCheck size={14} aria-hidden="true" />
                  {project.status}
                </dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>
                  {project.sourceVisibility === "public"
                    ? "Public repository"
                    : "Not published"}
                </dd>
              </div>
              <div>
                <dt>Demo</dt>
                <dd>{demoLabel(project)}</dd>
              </div>
            </dl>
            <p className="c-poster-desc">{project.description}</p>
            <ul
              className="c-tags"
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
          </div>
          <figure className="c-poster-art">
            <span className="c-tape c-tape-a" aria-hidden="true" />
            <span className="c-tape c-tape-b" aria-hidden="true" />
            <MiniAnim
              kind={animKindFor(project.slug)}
              label={`Animated concept sketch of ${project.title}`}
            />
            <figcaption className="mono">
              Concept sketch of the idea, not a recording of the project.
            </figcaption>
            <span className="c-anno c-anno-a" aria-hidden="true">
              the idea, sketched
            </span>
            {project.stack[0] && (
              <span className="c-anno c-anno-b" aria-hidden="true">
                built with {project.stack[0]}
              </span>
            )}
          </figure>
        </header>

        <nav className="c-tabs" aria-label="Project sections">
          <a href="#world-demo">Demo &amp; local setup</a>
          <a href="#world-playground">Explore</a>
          {project.architecture.nodes.length > 0 && (
            <a href="#world-architecture">Architecture</a>
          )}
          <a href="#world-overview">The story</a>
          <a href="#world-evidence">Evidence &amp; limits</a>
        </nav>

        <DemoConsole project={project} />

        <section id="world-playground" className="c-panel">
          <header className="c-panel-head">
            <h2>
              Try the <em>idea.</em>
            </h2>
            <span className="c-pill c-pill-lime mono">
              {project.interactionLabel}
            </span>
          </header>
          <WorldPlayground project={project} />
        </section>

        {project.architecture.nodes.length > 0 && (
          <section id="world-architecture" className="c-panel">
            <header className="c-panel-head">
              <h2>
                Trace the <em>connections.</em>
              </h2>
              <span className="c-pill c-pill-sky mono">
                {project.architecture.kind}
              </span>
            </header>
            <ArchitectureExplorer project={project} />
          </section>
        )}

        <section id="world-overview" className="c-panel c-story">
          <header className="c-panel-head">
            <h2>
              A question worth <em>asking.</em>
            </h2>
          </header>
          <div className="c-story-grid">
            <div className="c-sticky c-sticky-butter">
              <span className="mono">THE PROBLEM</span>
              <p>{project.problem}</p>
            </div>
            <div className="c-approach">
              <span className="mono">THE APPROACH</span>
              <h3>{project.tagline}</h3>
              <p>{project.solution}</p>
            </div>
          </div>
          <h3 className="c-timeline-title mono">DOCUMENTED SCOPE</h3>
          <ol className="c-timeline">
            {project.features.map((feature, i) => (
              <li key={feature}>
                <span className="c-stop mono" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p>{feature}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="world-evidence" className="c-panel c-evidence">
          <header className="c-panel-head">
            <h2>
              Know the <em>limits.</em>
            </h2>
          </header>
          <div className="c-evidence-grid">
            <div className="c-caution">
              <h3 className="mono">
                <TriangleAlert size={15} aria-hidden="true" /> HONEST BOUNDARIES
              </h3>
              <ul>
                {project.limitations.map((limit) => (
                  <li key={limit}>{limit}</li>
                ))}
              </ul>
            </div>
            <div className="c-receipt">
              <h3 className="mono">
                {project.sourceVisibility === "public"
                  ? "IMPLEMENTATION EVIDENCE"
                  : project.kind === "unavailable"
                    ? "PRIVATE IMPLEMENTATION"
                    : "AN INDEPENDENT STUDY"}
              </h3>
              {project.sourceCommit && (
                <p className="c-commit mono">
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
                    : "The supplied football repository is private. Its code was not read or reproduced. All controls and visuals here belong to this original portfolio demonstration."}
                </p>
              )}
              <div className="c-receipt-actions">
                {project.githubUrl && (
                  <a
                    className="c-btn c-btn-paper"
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
                    className="c-btn c-btn-lime"
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink size={15} aria-hidden="true" />
                    Verified live demo
                  </a>
                ) : (
                  <span className="c-none">
                    {project.sourceVisibility === "public"
                      ? "No verified external live demo"
                      : "Private source not shared"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="c-next">
          <Link href="/#projects" className="c-chip c-chip-paper">
            <ArrowLeft size={15} aria-hidden="true" />
            Back to the board
          </Link>
          <Link
            href={`/projects/${nextProject.slug}`}
            prefetch={false}
            className="c-next-card"
            onClick={() => beginPortal(project.accent)}
          >
            <span>
              <small className="mono">NEXT ON THE BOARD</small>
              <strong>{nextProject.title}</strong>
            </span>
            <ArrowRight size={26} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </main>
  );
}
