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
  placement: { x: number; y: number; side: "left" | "right"; vert: "up" | "down" };
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
      data-side={placement.side}
      data-vert={placement.vert}
      style={
        {
          "--world-accent": project.accent,
          "--ax": placement.x,
          "--ay": placement.y,
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
      <ul className="c-brief-badges">
        <li>{project.collection} project</li>
        <li>{project.status}</li>
        <li data-kind={demo.kind}>{sceneForSlug(project.slug)?.badge ?? demo.label}</li>
      </ul>
      {item && (
        <p className="c-brief-claim">
          <strong className="evidence-chip">{item.claimClass}</strong>{" "}
          <span>{item.caveat}</span>
          <span className="sr-only"> {claimClassNote[item.claimClass]}</span>
        </p>
      )}
      {station.tier !== "exhibit" && (
        <figure className="c-brief-sketch">
          <MiniAnim kind={animKindFor(project.slug)} label={`Animated concept sketch of ${project.title}`} />
          <figcaption className="mono">Concept sketch, not the project running.</figcaption>
        </figure>
      )}
      {station.note && <p className="c-brief-note">{station.note}</p>}
      {station.tier === "exhibit" && station.exhibit && (
        <p className="c-brief-exhibit mono">Exhibit: {station.exhibit}</p>
      )}
      <div className="c-brief-actions">
        {station.tier === "exhibit" && (
          <button type="button" className="c-btn c-btn-lime c-brief-enter" onClick={onEnter}>
            Enter exhibit <ArrowRight size={16} aria-hidden="true" />
            <span className="sr-only">: {station.exhibit}</span>
          </button>
        )}
        <Link
          href={`/projects/${project.slug}/`}
          prefetch={false}
          className={`c-btn ${station.tier === "exhibit" ? "c-btn-paper" : "c-btn-lime"}`}
          onClick={() => onStep("problem")}
        >
          Open project page <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
        {project.sourceVisibility === "public" && project.githubUrl && (
          <a className="c-btn c-btn-paper" href={project.githubUrl} target="_blank" rel="noopener noreferrer">
            Source <ArrowUpRight size={15} aria-hidden="true" />
            <span className="sr-only"> (opens GitHub in a new tab)</span>
          </a>
        )}
      </div>
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
