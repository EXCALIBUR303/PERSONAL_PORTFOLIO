"use client";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, X } from "lucide-react";
import type { CSSProperties } from "react";
import type { Project } from "@/data/projects";
import { demoClassFor } from "@/data/demo-class";
import { claimClassNote, evidence } from "@/data/evidence";
import { missionSteps, type MissionStep } from "@/lib/exploration";
import MiniAnim from "../../mini-anim";
import { sceneForSlug } from "../../scenes/catalog";
import { animKindFor, districts, toneFor } from "../identity";
import { tierWords, type Station } from "./stations";

/**
 * The preview that opens beside a station. It holds what a visitor needs to
 * decide where to go next: what the project is for, how far it was checked,
 * and the way in. Depth stays in the exhibit and on the project page.
 */
export function StationCard({
  station,
  project,
  number,
  placement,
  doneSteps,
  challengeDone,
  onClose,
  onEnter,
  onStep,
}: {
  station: Station;
  project: Project;
  number: number;
  /** Where it opens beside its landmark on the 2D map; the 3D world docks it instead. */
  placement?: { x: number; y: number; side: "left" | "right"; vert: "up" | "down" };
  doneSteps: MissionStep[];
  challengeDone: boolean;
  onClose: () => void;
  onEnter: () => void;
  onStep: (step: MissionStep) => void;
}) {
  const district = districts.find((d) => d.id === station.district)!;
  const demo = demoClassFor(project);
  const item = evidence[project.slug];
  const tier = tierWords[station.tier];
  return (
    <aside
      className="c-brief"
      aria-label="Station preview"
      aria-live="polite"
      data-tone={toneFor(project.slug)}
      data-tier={station.tier}
      data-side={placement?.side}
      data-vert={placement?.vert}
      style={
        {
          "--world-accent": project.accent,
          ...(placement ? { "--ax": placement.x, "--ay": placement.y } : {}),
        } as CSSProperties
      }
    >
      <button type="button" className="c-brief-close" onClick={onClose} aria-label="Close station preview">
        <X size={16} aria-hidden="true" />
      </button>
      <p className="c-brief-no mono">
        Station {String(number).padStart(2, "0")} · {district.label} · {tier.label}
      </p>
      <h2>{project.title}</h2>
      <p className="c-brief-tag">{station.purpose}</p>
      <p className="c-brief-explore">
        <span className="mono">{station.tier === "exhibit" ? "You can explore" : station.tier === "briefing" ? "You can read" : "What it is"}</span>
        {station.tier === "exhibit" && station.exhibit
          ? station.exhibit
          : station.tier === "briefing"
            ? "A short briefing, then the full project page"
            : "A design or link-out, described honestly on its page"}
      </p>
      <ul className="c-brief-badges c-brief-evidence" aria-label="What this scene is">
        {item ? (
          <li className="evidence-chip">
            {item.claimClass}
            <span className="sr-only">. {claimClassNote[item.claimClass]}</span>
          </li>
        ) : (
          <li data-kind={demo.kind}>{sceneForSlug(project.slug)?.badge ?? demo.label}</li>
        )}
      </ul>
      {item && <p className="c-brief-claim">{claimClassNote[item.claimClass]} {item.caveat}</p>}
      {station.note && <p className="c-brief-note">{station.note}</p>}
      <p className="c-brief-facts mono">
        {project.collection} project · {project.status}
      </p>
      <div className="c-brief-actions">
        {station.tier === "exhibit" && (
          <button type="button" className="c-btn c-btn-lime c-brief-enter" onClick={onEnter}>
            Explore exhibit <ArrowRight size={16} aria-hidden="true" />
            <span className="sr-only">: {station.exhibit}</span>
          </button>
        )}
        <Link
          href={`/projects/${project.slug}/`}
          prefetch={false}
          className={`c-btn ${station.tier === "exhibit" ? "c-btn-paper" : "c-btn-lime"}`}
          onClick={() => onStep("problem")}
        >
          Open full project page <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
        {project.sourceVisibility === "public" && project.githubUrl && (
          <a className="c-btn c-btn-paper" href={project.githubUrl} target="_blank" rel="noopener noreferrer">
            Source <ArrowUpRight size={15} aria-hidden="true" />
            <span className="sr-only"> (opens GitHub in a new tab)</span>
          </a>
        )}
      </div>
      <details className="c-brief-more">
        <summary className="mono">More about this project</summary>
        <div className="c-brief-more-body">
          <h3>Problem</h3>
          <p>{project.problem}</p>
          <h3>What I built</h3>
          <p>{project.solution}</p>
          <h3>Technologies</h3>
          <ul className="c-brief-stack">
            {project.stack.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          {project.limitations.length > 0 && (
            <>
              <h3>Limits</h3>
              <ul className="c-brief-limits">
                {project.limitations.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </>
          )}
          {station.tier !== "exhibit" && (
            <figure className="c-brief-sketch">
              <MiniAnim kind={animKindFor(project.slug)} label={`Animated concept sketch of ${project.title}`} />
              <figcaption className="mono">Concept sketch, not the project running.</figcaption>
            </figure>
          )}
        </div>
      </details>
      <details className="c-brief-route">
        <summary className="mono">
          The full page, in four steps
          {challengeDone && <span className="c-brief-done"> · challenge done</span>}
        </summary>
        <ol className="c-missions" aria-label="Missions">
          {missionSteps.map((step, i) => (
            <li key={step.id} data-done={doneSteps.includes(step.id) || undefined}>
              <Link
                href={`/projects/${project.slug}/#${step.id}`}
                prefetch={false}
                onClick={() => onStep(step.id)}
              >
                <span className="c-mission-no mono" aria-hidden="true">
                  {doneSteps.includes(step.id) ? <Check size={13} /> : i + 1}
                </span>
                {step.label}
                <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ol>
      </details>
    </aside>
  );
}
