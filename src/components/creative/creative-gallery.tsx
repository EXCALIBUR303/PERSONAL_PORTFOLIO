"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowUpRight,
  CircuitBoard,
  GraduationCap,
  FlaskConical,
  Info,
  Layers3,
  LayoutGrid,
  List,
  Monitor,
  Search,
  Star,
  X,
} from "lucide-react";
import { projects, categories, type Project } from "@/data/projects";
import MiniAnim from "../mini-anim";
import { useGalleryFilter } from "../use-gallery-filter";
import { demoLabel } from "../demo-console";
import { animKindFor, tiltFor, toneFor } from "./identity";

const ProjectDialog = dynamic(() => import("../project-dialog"), {
  ssr: false,
});

/** Spans for the 12-column pinboard; a repeating rhythm so rows stay full but never look uniform. */
const spans = [6, 3, 3, 4, 4, 4, 3, 6, 3];

function PinCard({
  project,
  index,
  slot,
  onOpen,
  list,
}: {
  project: Project;
  index: number;
  slot: number;
  onOpen: () => void;
  list: boolean;
}) {
  const { beginPortal } = useGalleryFilter();
  const href = `/projects/${project.slug}`;
  const span = list ? 12 : spans[slot % spans.length];
  return (
    <article
      className={`c-card c-card-${list ? "list" : span >= 6 ? "wide" : "std"}`}
      data-tone={toneFor(project.slug)}
      style={
        {
          "--span": span,
          "--tilt": `${list ? 0 : tiltFor(index)}deg`,
        } as React.CSSProperties
      }
    >
      {!list && <span className="c-tape" aria-hidden="true" />}
      <Link
        href={href}
        prefetch={false}
        tabIndex={-1}
        aria-hidden="true"
        className="c-card-art"
        data-cursor="OPEN"
        onClick={() => beginPortal(project.accent)}
      >
        <MiniAnim
          kind={animKindFor(project.slug)}
          label={`Animated concept sketch of ${project.title}`}
        />
        <span className="c-sticker c-sticker-corner mono">
          {project.sourceVisibility === "public"
            ? "PUBLIC SOURCE"
            : "INDEPENDENT STUDY"}
        </span>
      </Link>
      <div className="c-card-body">
        <span className="c-index mono">
          No.{String(index + 1).padStart(2, "0")} · {project.categories[0]}
        </span>
        <h3>
          <Link
            href={href}
            prefetch={false}
            onClick={() => beginPortal(project.accent)}
          >
            {project.title}
          </Link>
        </h3>
        <p>{project.description}</p>
        <ul className="c-tags" aria-label="Main technologies">
          {project.stack.slice(0, span >= 6 || list ? 5 : 3).map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
        <div className="c-card-foot">
          <span className="c-status">
            <i aria-hidden="true" />
            {project.status} · {demoLabel(project)}
          </span>
          <button
            type="button"
            className="c-icon-btn"
            onClick={onOpen}
            aria-label={`Quick overview of ${project.title}`}
          >
            <Info size={16} />
          </button>
          <Link
            className="c-open"
            href={href}
            prefetch={false}
            aria-label={`Open ${project.title}`}
            onClick={() => beginPortal(project.accent)}
          >
            Open <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

/** Creative gallery: a pinboard of varied cards. It shares every filter with the Professional gallery. */
export default function CreativeGallery() {
  const { gallery, setGallery, filtered, reset } = useGalleryFilter();
  const [selected, setSelected] = useState<Project | null>(null);
  const list = gallery.layout === "index";
  return (
    <section id="projects" className="c-section c-projects">
      <div className="container">
        <header className="c-section-head">
          <p className="c-kicker mono">
            <span className="c-pill c-pill-pink">01</span> The project
            collections
          </p>
          <h2>
            Built to be <em>explored.</em>
          </h2>
          <p className="c-section-lede">
            Coursework and curiosity, pinned to the board. Choose a collection,
            open a system, try the idea.
          </p>
          <span className="c-count" aria-hidden="true">
            {String(projects.length).padStart(2, "0")}
            <small>project worlds</small>
          </span>
        </header>

        <div className="c-controls">
          <label className="c-search">
            <Search size={17} aria-hidden="true" />
            <span className="sr-only">Search project worlds</span>
            <input
              type="search"
              value={gallery.query}
              placeholder="Search projects, tools, ideas…"
              onChange={(event) =>
                setGallery({ ...gallery, query: event.target.value })
              }
            />
            {gallery.query && (
              <button
                type="button"
                aria-label="Clear project search"
                onClick={() => setGallery({ ...gallery, query: "" })}
              >
                <X size={15} />
              </button>
            )}
          </label>
          <div
            className="c-chips"
            role="group"
            aria-label="Project collections"
          >
            {(["All", "College", "Personal"] as const).map((collection) => {
              const Icon =
                collection === "College"
                  ? GraduationCap
                  : collection === "Personal"
                    ? FlaskConical
                    : Layers3;
              return (
                <button
                  key={collection}
                  type="button"
                  aria-pressed={gallery.collection === collection}
                  onClick={() =>
                    setGallery({ ...gallery, collection, selectedSlug: null })
                  }
                >
                  <Icon size={16} aria-hidden="true" />
                  {collection === "All"
                    ? "All projects"
                    : `${collection} Projects`}
                  <small>
                    {
                      projects.filter(
                        (p) =>
                          collection === "All" || p.collection === collection,
                      ).length
                    }
                  </small>
                </button>
              );
            })}
          </div>
          <div
            className="c-chips"
            role="group"
            aria-label="Software or hardware"
          >
            {(["All", "Software", "Hardware"] as const).map((discipline) => (
              <button
                key={discipline}
                type="button"
                aria-pressed={gallery.discipline === discipline}
                onClick={() =>
                  setGallery({ ...gallery, discipline, selectedSlug: null })
                }
              >
                {discipline === "Hardware" ? (
                  <CircuitBoard size={16} aria-hidden="true" />
                ) : discipline === "Software" ? (
                  <Monitor size={16} aria-hidden="true" />
                ) : (
                  <Layers3 size={16} aria-hidden="true" />
                )}
                {discipline === "All" ? "All types" : discipline}
              </button>
            ))}
          </div>
          <div className="c-controls-row">
            <label className="c-select">
              <span className="sr-only">Filter projects by category</span>
              <select
                value={gallery.category}
                onChange={(event) =>
                  setGallery({ ...gallery, category: event.target.value })
                }
              >
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="c-toggle"
              aria-pressed={gallery.featuredOnly}
              onClick={() =>
                setGallery({ ...gallery, featuredOnly: !gallery.featuredOnly })
              }
            >
              <Star size={14} aria-hidden="true" /> Featured only
            </button>
            <div className="c-view" role="group" aria-label="Project layout">
              <button
                type="button"
                aria-label="Exhibit view"
                aria-pressed={!list}
                onClick={() => setGallery({ ...gallery, layout: "exhibits" })}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                aria-label="Index view"
                aria-pressed={list}
                onClick={() => setGallery({ ...gallery, layout: "index" })}
              >
                <List size={16} />
              </button>
            </div>
            <span className="c-total mono" role="status">
              {filtered.length} / {projects.length} WORLDS
            </span>
          </div>
        </div>

        <div className={`c-board ${list ? "c-board-list" : ""}`}>
          {filtered.map((project, slot) => (
            <PinCard
              key={project.id}
              project={project}
              index={projects.indexOf(project)}
              slot={slot}
              list={list}
              onOpen={() => setSelected(project)}
            />
          ))}
        </div>

        {!filtered.length && (
          <div className="c-empty">
            <h3>
              {gallery.discipline === "Hardware"
                ? "Physical builds, when they’re ready."
                : "No worlds match that signal."}
            </h3>
            <p>
              {gallery.discipline === "Hardware"
                ? "No verified physical hardware project is listed in this collection yet. Explore the software systems and simulations, or choose another collection."
                : "Try a project name, technology, or a different category."}
            </p>
            <button type="button" className="c-btn c-btn-ink" onClick={reset}>
              Reset filters <X size={15} aria-hidden="true" />
            </button>
          </div>
        )}
        <p className="c-fineprint mono">
          College and Personal collections are confirmed by me. Hardware is
          reserved for physical builds; simulations stay in Software. Source
          evidence, execution status and demo options are inside each world.
        </p>
      </div>
      {selected && (
        <ProjectDialog project={selected} close={() => setSelected(null)} />
      )}
    </section>
  );
}
