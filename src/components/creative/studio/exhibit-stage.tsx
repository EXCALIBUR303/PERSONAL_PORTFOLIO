"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowLeft, ArrowUpRight, Check, X } from "lucide-react";
import type { Project } from "@/data/projects";
import { demoClassFor } from "@/data/demo-class";
import { claimClassNote, evidence } from "@/data/evidence";
import type { MissionStep } from "@/lib/exploration";
import { EvidenceStrip } from "../../evidence-strip";
import { sceneById } from "../../scenes/catalog";
import { SceneStage } from "../../scenes/scene-stage";
import { districts, toneFor } from "../identity";
import { ChallengePanel, ExperimentPanel, hasExperiment } from "./challenges";
import { stations, type Station } from "./stations";
import { useChallenges } from "./studio-state";

/**
 * An exhibit: the project's existing scene in a stage of its own, with a plaque
 * that says what it is and how far to trust it, an optional challenge, and the
 * way out to the full project page. Only this one scene is mounted; switching
 * exhibits unmounts the previous one first.
 */
export default function ExhibitStage({
  station,
  project,
  onClose,
  onSwitch,
  onStep,
  steps,
}: {
  station: Station;
  project: Project;
  onClose: () => void;
  onSwitch: (slug: string) => void;
  onStep: (step: MissionStep) => void;
  steps: readonly { id: MissionStep; label: string; short: string }[];
}) {
  const scene = sceneById(station.scene!);
  const demo = demoClassFor(project);
  const item = evidence[project.slug];
  const district = districts.find((d) => d.id === station.district)!;
  const { done, mark } = useChallenges();
  const heading = useRef<HTMLHeadingElement>(null);
  const root = useRef<HTMLElement>(null);
  const exhibits = stations.filter((s) => s.tier === "exhibit");
  const index = exhibits.findIndex((s) => s.slug === station.slug);
  const finished = done.includes(station.slug);

  // Bring the exhibit into view and put keyboard focus on its title.
  useEffect(() => {
    root.current?.scrollIntoView({ block: "start", behavior: "auto" });
    heading.current?.focus({ preventScroll: true });
  }, []);
  // Escape leaves the exhibit.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <section
      ref={root}
      className="ex"
      aria-labelledby="ex-title"
      data-district={station.district}
      data-tone={toneFor(project.slug)}
      style={{ "--world-accent": project.accent } as React.CSSProperties}
    >
      <header className="ex-bar">
        <button type="button" className="c-btn c-btn-paper ex-back" onClick={onClose}>
          <ArrowLeft size={16} aria-hidden="true" /> Studio map
        </button>
        <nav className="ex-trail" aria-label="Exhibits">
          <ol>
            {exhibits.map((s) => (
              <li key={s.slug}>
                <button
                  type="button"
                  data-district={s.district}
                  aria-current={s.slug === station.slug ? "true" : undefined}
                  onClick={() => s.slug !== station.slug && onSwitch(s.slug)}
                >
                  {s.short}
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <button type="button" className="ex-close" onClick={onClose} aria-label="Close exhibit">
          <X size={18} aria-hidden="true" />
        </button>
      </header>

      <div className="ex-room">
        <div className="ex-stage" data-scene={scene.id}>
          <div className="ex-wall" aria-hidden="true" />
          <SceneStage id={scene.id} />
        </div>

        <aside className="ex-plaque" aria-label="About this exhibit">
          <p className="ex-where mono">
            {district.label} · Exhibit {index + 1} of {exhibits.length}
          </p>
          <h2 id="ex-title" ref={heading} tabIndex={-1}>
            {station.exhibit}
          </h2>
          <p className="ex-project">
            <b>{project.title}.</b> {station.purpose}
          </p>
          <ul className="c-brief-badges">
            <li>{project.collection} project</li>
            <li data-kind={demo.kind}>{scene.badge}</li>
            {item && <li>{item.claimClass}</li>}
          </ul>
          <h3>What you are seeing</h3>
          <p>{scene.seeing}</p>
          <h3>How far to trust it</h3>
          <p>{item ? claimClassNote[item.claimClass] : demo.note}</p>
          {item && <p className="ex-caveat">{item.caveat}</p>}
          <div className="c-brief-actions">
            <Link
              href={`/projects/${project.slug}/`}
              prefetch={false}
              className="c-btn c-btn-lime"
              onClick={() => onStep("problem")}
            >
              Full project page <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
            {project.sourceVisibility === "public" && project.githubUrl && (
              <a className="c-btn c-btn-paper" href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                Source <ArrowUpRight size={15} aria-hidden="true" />
                <span className="sr-only"> (opens GitHub in a new tab)</span>
              </a>
            )}
          </div>
        </aside>
      </div>

      <div className="ex-lower">
        <section className="ex-engineering" aria-labelledby="ex-eng">
          <h3 id="ex-eng">Understand the engineering</h3>
          <p>{scene.why}</p>
        </section>

        {station.challenge && (
          <details className="ex-optional" data-done={finished || undefined}>
            <summary>
              <span className="mono">Optional</span> Try a challenge
              {finished && (
                <span className="ex-done">
                  <Check size={13} aria-hidden="true" /> done
                </span>
              )}
            </summary>
            <ChallengePanel
              id={station.challenge}
              onDone={() => {
                mark(station.slug);
                onStep("try");
              }}
            />
          </details>
        )}
        {station.challenge && hasExperiment(station.challenge) && (
          <details className="ex-optional">
            <summary>
              <span className="mono">Optional</span> Run an experiment
            </summary>
            <ExperimentPanel id={station.challenge} />
          </details>
        )}

        <details className="ex-optional">
          <summary>
            <span className="mono">Evidence</span> What was checked, and what was not
          </summary>
          <EvidenceStrip project={project} />
        </details>

        <nav className="ex-deeper" aria-label="Go deeper on the full page">
          <span className="mono">On the full page</span>
          <ul>
            {steps.map((step) => (
              <li key={step.id}>
                <Link
                  href={`/projects/${project.slug}/#${step.id}`}
                  prefetch={false}
                  onClick={() => onStep(step.id)}
                >
                  {step.short} <ArrowUpRight size={13} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
