"use client";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import type { Project } from "@/data/projects";
import { demoClassFor } from "@/data/demo-class";
import MiniAnim from "@/components/mini-anim";
import { usePortfolioState } from "@/components/app-frame";
import { animKindFor, toneFor } from "@/components/creative/identity";
import {
  missionSteps,
  useExploration,
  type MissionStep,
} from "@/lib/exploration";
import { hasDedicatedDemo } from "./world-playground";
import {
  HowBody,
  LimitsList,
  ProjectLinks,
  ScopeList,
  SourceLinks,
  StackList,
  TryBody,
} from "./project-sections";

const ids = missionSteps.map((step) => step.id);
const fromHash = (hash: string): MissionStep | null => {
  const id = decodeURIComponent(hash.replace(/^#/, ""));
  if (id === "limits") return "decisions";
  return (ids as string[]).includes(id) ? (id as MissionStep) : null;
};

/** The URL hash is the single source of truth for the open mission. */
const hashListeners = new Set<() => void>();
const subscribeHash = (listener: () => void) => {
  hashListeners.add(listener);
  window.addEventListener("hashchange", listener);
  return () => {
    hashListeners.delete(listener);
    window.removeEventListener("hashchange", listener);
  };
};
const readHash = () => location.hash;
function writeHash(next: MissionStep) {
  history.replaceState(null, "", `#${next}`);
  hashListeners.forEach((listener) => listener());
}

/**
 * Creative project page: a mission board. The poster introduces the project,
 * then four missions (problem, try it, how it works, decisions) open one at a
 * time, so a visitor is never faced with the whole page at once. Same project
 * record and same content blocks as the Professional page; every mission is a
 * normal tab and a normal URL hash, so nothing is locked.
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
  const { stepsFor, markStep, markProject } = useExploration();
  const hash = useSyncExternalStore(subscribeHash, readHash, () => "");
  const step = fromHash(hash) ?? "problem";
  const heading = useRef<HTMLHeadingElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const demo = demoClassFor(project);
  const dedicated = hasDedicatedDemo(project);
  const done = stepsFor(project.slug);

  const open = useCallback((next: MissionStep, focus = false) => {
    writeHash(next);
    if (focus) tabs.current[ids.indexOf(next)]?.focus();
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      heading.current?.focus({ preventScroll: true }),
    );
    return () => cancelAnimationFrame(frame);
  }, [project.slug]);

  useEffect(() => markProject(project.slug), [markProject, project.slug]);
  useEffect(() => markStep(project.slug, step), [markStep, project.slug, step]);
  useEffect(() => {
    if (!fromHash(location.hash)) return;
    const timer = window.setTimeout(
      () =>
        document
          .getElementById("c-missions")
          ?.scrollIntoView({ block: "start" }),
      350,
    );
    return () => window.clearTimeout(timer);
  }, [project.slug]);

  const position = ids.indexOf(step);
  const onKey = (event: React.KeyboardEvent) => {
    const move =
      event.key === "ArrowRight"
        ? 1
        : event.key === "ArrowLeft"
          ? -1
          : event.key === "Home"
            ? -position
            : event.key === "End"
              ? ids.length - 1 - position
              : 0;
    if (!move) return;
    event.preventDefault();
    open(ids[(position + move + ids.length) % ids.length], true);
  };

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
          <Link href="/#map" className="c-chip c-chip-paper">
            <ArrowLeft size={15} aria-hidden="true" />
            Back to the map
          </Link>
          <span className="mono">
            STATION {String(index + 1).padStart(2, "0")} /{" "}
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
            <p className="c-poster-desc">{project.description}</p>
            <ul className="c-brief-badges" aria-label="Project facts">
              <li>
                <ShieldCheck size={13} aria-hidden="true" /> {project.status}
              </li>
              <li>
                {project.collection} project · {project.discipline}
              </li>
              <li data-kind={demo.kind}>{demo.label}</li>
            </ul>
            <ProjectLinks
              project={project}
              buttonClass="c-btn c-btn-paper"
              liveClass="c-btn c-btn-lime"
              noneClass="c-none"
            />
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
          </figure>
        </header>

        <section
          id="c-missions"
          className="c-missions-board"
          aria-label="Missions"
        >
          <div className="c-mission-head">
            <h2>
              Four <em>missions.</em>
            </h2>
            <p className="mono" role="status">
              {done.length} of {missionSteps.length} opened in this tab
            </p>
          </div>
          <div
            className="c-tabs c-tabs-missions"
            role="tablist"
            aria-label="Project missions"
            onKeyDown={onKey}
          >
            {missionSteps.map((item, i) => (
              <button
                key={item.id}
                ref={(node) => {
                  tabs.current[i] = node;
                }}
                type="button"
                role="tab"
                id={`tab-${item.id}`}
                aria-selected={step === item.id}
                aria-controls={`panel-${item.id}`}
                tabIndex={step === item.id ? 0 : -1}
                data-done={done.includes(item.id) || undefined}
                onClick={() => open(item.id)}
              >
                <span className="c-mission-no mono" aria-hidden="true">
                  {done.includes(item.id) && step !== item.id ? (
                    <Check size={13} />
                  ) : (
                    i + 1
                  )}
                </span>
                {item.label}
              </button>
            ))}
          </div>

          <div
            role="tabpanel"
            id={`panel-${step}`}
            aria-labelledby={`tab-${step}`}
            className="c-mission-panel"
            tabIndex={0}
          >
            {step === "problem" && (
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
            )}
            {step === "try" && <TryBody project={project} />}
            {step === "how" && (
              <>
                <HowBody project={project} />
                {dedicated && (
                  <details className="c-more">
                    <summary>Everything the repository documents</summary>
                    <ScopeList project={project} />
                  </details>
                )}
              </>
            )}
            {step === "decisions" && (
              <div className="c-decisions">
                <div>
                  <h3 className="mono">BUILT WITH</h3>
                  <StackList project={project} />
                  <p className="c-fine">
                    Reasons are shown only where the repository documents them.
                  </p>
                </div>
                <div className="c-caution">
                  <h3 className="mono">
                    <TriangleAlert size={15} aria-hidden="true" /> LIMITS &amp;
                    STATUS · {project.status.toUpperCase()}
                  </h3>
                  <LimitsList project={project} />
                </div>
                <div className="c-receipt">
                  <h3 className="mono">
                    {project.sourceVisibility === "public"
                      ? "WHERE THE DECISIONS ARE WRITTEN DOWN"
                      : project.kind === "unavailable"
                        ? "PRIVATE IMPLEMENTATION"
                        : "AN INDEPENDENT STUDY"}
                  </h3>
                  <SourceLinks project={project} />
                </div>
              </div>
            )}
          </div>

          <div className="c-mission-nav">
            <button
              type="button"
              className="c-btn c-btn-paper"
              disabled={position === 0}
              onClick={() => open(ids[position - 1], true)}
            >
              <ArrowLeft size={15} aria-hidden="true" /> Previous mission
            </button>
            <button
              type="button"
              className="c-btn c-btn-ink"
              disabled={position === ids.length - 1}
              onClick={() => open(ids[position + 1], true)}
            >
              Next mission <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </section>

        <div className="c-next">
          <Link href="/#map" className="c-chip c-chip-paper">
            <ArrowLeft size={15} aria-hidden="true" />
            Back to the map
          </Link>
          <Link
            href={`/projects/${nextProject.slug}`}
            prefetch={false}
            className="c-next-card"
            onClick={() => beginPortal(project.accent)}
          >
            <span>
              <small className="mono">NEXT STATION</small>
              <strong>{nextProject.title}</strong>
            </span>
            <ArrowRight size={26} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </main>
  );
}
