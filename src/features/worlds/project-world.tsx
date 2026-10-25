"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import type { Project } from "@/data/projects";
import { demoClassFor } from "@/data/demo-class";
import { usePortfolioState } from "@/components/app-frame";
import { useExploration } from "@/lib/exploration";
import {
  HowBody,
  LimitsList,
  ProjectLinks,
  ScopeList,
  SourceLinks,
  StackList,
  TryBody,
} from "./project-sections";
import { hasDedicatedDemo } from "./world-playground";
import { EvidenceStrip } from "@/components/evidence-strip";

/**
 * Professional project page, organised as a story: the problem and the
 * approach, then the demonstration, then how it works, the technical decisions
 * and the honest limits. Deeper detail sits in disclosures so the page stays
 * short until the reader asks for more.
 */
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
  const { markProject } = useExploration();
  const heading = useRef<HTMLHeadingElement>(null);
  const demo = demoClassFor(project);
  const dedicated = hasDedicatedDemo(project);
  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      heading.current?.focus({ preventScroll: true }),
    );
    return () => cancelAnimationFrame(frame);
  }, [project.slug]);
  useEffect(() => markProject(project.slug), [markProject, project.slug]);
  useEffect(() => {
    // Mission links point at sections (#try, #how, ...). Scroll once the demo
    // modules have taken their place so the target is not pushed away.
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    const timer = window.setTimeout(
      () => document.getElementById(id)?.scrollIntoView({ block: "start" }),
      400,
    );
    return () => window.clearTimeout(timer);
  }, [project.slug]);
  return (
    <main
      id="main"
      className={`project-world pr world-${project.kind}`}
      style={{ "--world-accent": project.accent } as React.CSSProperties}
      tabIndex={-1}
    >
      <div className="container">
        <div className="world-breadcrumb">
          <Link href="/#projects">
            <ArrowLeft size={16} />
            Back to all projects
          </Link>
          <span className="mono">
            PROJECT {String(index + 1).padStart(2, "0")} /{" "}
            {String(count).padStart(2, "0")}
          </span>
        </div>

        <header className="pr-head">
          <span className="eyebrow">{project.eyebrow}</span>
          <h1 ref={heading} tabIndex={-1}>
            {project.title}
          </h1>
          <p className="pr-tagline">{project.tagline}</p>
          <p className="pr-desc">{project.description}</p>
          <ul className="pr-badges" aria-label="Project facts">
            <li>
              <ShieldCheck size={14} aria-hidden="true" />
              {project.status}
            </li>
            <li>
              {project.collection} project · {project.discipline}
            </li>
            <li data-kind={demo.kind}>{demo.label}</li>
          </ul>
          <ProjectLinks
            project={project}
            buttonClass="button button-outline"
            liveClass="button button-lime"
            noneClass="unavailable"
          />
        </header>

        <nav className="pr-nav" aria-label="Project sections">
          <a href="#problem">Problem</a>
          <a href="#try">Try it</a>
          <a href="#how">How it works</a>
          <a href="#decisions">Decisions</a>
          <a href="#limits">Limits &amp; status</a>
        </nav>

        <EvidenceStrip project={project} />

        <section id="problem" className="pr-section pr-story">
          <div>
            <span className="eyebrow">THE PROBLEM</span>
            <p>{project.problem}</p>
          </div>
          <div>
            <span className="eyebrow">THE APPROACH</span>
            <p>{project.solution}</p>
          </div>
        </section>

        <section id="try" className="pr-section">
          <div className="pr-section-head">
            <h2>
              Try <em>it.</em>
            </h2>
            <span className="world-mode-label">{project.interactionLabel}</span>
          </div>
          <TryBody project={project} />
        </section>

        <section id="how" className="pr-section">
          <div className="pr-section-head">
            <h2>
              How it <em>works.</em>
            </h2>
            <span className="world-mode-label">
              {dedicated ? project.architecture.kind : "What the repository documents"}
            </span>
          </div>
          <HowBody project={project} />
          {dedicated && project.features.length > 0 && (
            <details className="pr-more">
              <summary>Everything the repository documents</summary>
              <ScopeList project={project} />
            </details>
          )}
        </section>

        <section id="decisions" className="pr-section">
          <div className="pr-section-head">
            <h2>
              Technical <em>decisions.</em>
            </h2>
          </div>
          <p className="pr-lead">
            {project.sourceVisibility === "public"
              ? "What it is built with, and where the choices are written down. Reasons are shown only where the repository documents them."
              : "The stack of this portfolio demonstration."}
          </p>
          <StackList project={project} />
          <details className="pr-more">
            <summary>
              {project.sourceVisibility === "public"
                ? "Source evidence in the repository"
                : "About the source"}
            </summary>
            <SourceLinks project={project} />
          </details>
        </section>

        <section id="limits" className="pr-section pr-limits">
          <div className="pr-section-head">
            <h2>
              Limits &amp; <em>status.</em>
            </h2>
            <span className="world-status">
              <ShieldCheck size={15} />
              {project.status}
            </span>
          </div>
          <LimitsList project={project} />
        </section>

        <div className="world-next">
          <Link href="/#projects">
            <ArrowLeft size={17} />
            Back to all projects
          </Link>
          <Link
            href={`/projects/${nextProject.slug}`}
            prefetch={false}
            onClick={() => beginPortal(project.accent)}
          >
            <div>
              <span className="mono">NEXT PROJECT</span>
              <strong>{nextProject.title}</strong>
            </div>
            <ArrowRight size={24} />
          </Link>
        </div>
      </div>
    </main>
  );
}
