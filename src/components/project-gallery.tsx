"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Search,
  X,
  ArrowUpRight,
  GraduationCap,
  FlaskConical,
  Layers3,
  List,
  Monitor,
  CircuitBoard,
  ScanLine,
} from "lucide-react";
import { projects, categories, type Project } from "@/data/projects";
import { useGalleryFilter } from "./use-gallery-filter";
import { ProjectCard } from "./project-components";
import MiniAnim, { animForSlug } from "./mini-anim";
import { SectionLabel } from "./ui";
const ProjectDialog = dynamic(() => import("./project-dialog"), { ssr: false });
export default function ProjectGallery() {
  const { gallery, setGallery, beginPortal, filtered, spotlight, reset } =
    useGalleryFilter();
  const [selected, setSelected] = useState<Project | null>(null);
  return (
    <section id="projects" className="projects-section section-pad">
      <div className="container">
        <SectionLabel number="01">
          THE PROJECT COLLECTIONS / OPEN THE LAB
        </SectionLabel>
        <div className="universe-section-heading">
          <h2>
            Built to be
            <br />
            <em>explored.</em>
          </h2>
          <p>
            Coursework and curiosity, made tangible.
            <br />
            Choose a collection. Open a system. Try the idea.
          </p>
          <span className="collection-total">
            {String(projects.length).padStart(2, "0")}
            <small>PROJECT WORLDS</small>
          </span>
        </div>
        <div className="collection-layout">
          <aside className="collection-sidebar">
            <span className="eyebrow">THE ARCHIVE</span>
            <div
              role="group"
              aria-label="Project collections"
              className="collection-buttons"
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
                    aria-pressed={gallery.collection === collection}
                    onClick={() =>
                      setGallery({ ...gallery, collection, selectedSlug: null })
                    }
                  >
                    <Icon size={19} />
                    <span>
                      {collection === "All"
                        ? "All projects"
                        : `${collection} Projects`}
                    </span>
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
            <span className="eyebrow sidebar-subtitle">PROJECT TYPE</span>
            <div
              role="group"
              aria-label="Software or hardware"
              className="discipline-buttons"
            >
              {(["All", "Software", "Hardware"] as const).map((discipline) => (
                <button
                  key={discipline}
                  aria-pressed={gallery.discipline === discipline}
                  onClick={() =>
                    setGallery({ ...gallery, discipline, selectedSlug: null })
                  }
                >
                  {discipline === "Hardware" ? (
                    <CircuitBoard size={16} />
                  ) : discipline === "Software" ? (
                    <Monitor size={16} />
                  ) : (
                    <Layers3 size={16} />
                  )}
                  <span>{discipline === "All" ? "All types" : discipline}</span>
                </button>
              ))}
            </div>
            <p className="classification-note">
              College and Personal collections are confirmed by me. Hardware is
              reserved for physical builds; simulations stay in Software.
            </p>
            <a
              className="sidebar-source"
              href="https://github.com/EXCALIBUR303?tab=repositories"
              target="_blank"
              rel="noopener noreferrer"
            >
              Browse GitHub <ArrowUpRight size={14} />
            </a>
          </aside>
          <div className="collection-main">
            <div className="gallery-toolbar">
              <label className="project-search">
                <Search size={17} />
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
                    aria-label="Clear project search"
                    onClick={() => setGallery({ ...gallery, query: "" })}
                  >
                    <X size={15} />
                  </button>
                )}
              </label>
              <div
                className="gallery-view-toggle"
                role="group"
                aria-label="Project layout"
              >
                <button
                  aria-label="Exhibit view"
                  aria-pressed={gallery.layout === "exhibits"}
                  onClick={() => setGallery({ ...gallery, layout: "exhibits" })}
                >
                  <ScanLine size={17} />
                </button>
                <button
                  aria-label="Index view"
                  aria-pressed={gallery.layout === "index"}
                  onClick={() => setGallery({ ...gallery, layout: "index" })}
                >
                  <List size={17} />
                </button>
              </div>
            </div>
            <div className="gallery-filter-line">
              <label className="category-select">
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
                className="featured-toggle"
                aria-pressed={gallery.featuredOnly}
                onClick={() =>
                  setGallery({
                    ...gallery,
                    featuredOnly: !gallery.featuredOnly,
                  })
                }
              >
                Featured only
              </button>
              <span className="mono gallery-count" role="status">
                {filtered.length} / {projects.length} WORLDS
              </span>
            </div>
            {spotlight && gallery.layout === "exhibits" && (
              <div
                className={`project-exhibit exhibit-${spotlight.kind}`}
                style={
                  { "--world-accent": spotlight.accent } as React.CSSProperties
                }
              >
                <div className="exhibit-art">
                  <MiniAnim
                    kind={animForSlug[spotlight.slug] ?? "pulse"}
                    label={`Animated concept sketch of ${spotlight.title}`}
                  />
                  <span className="exhibit-coordinate mono">
                    EXHIBIT{" "}
                    {String(projects.indexOf(spotlight) + 1).padStart(2, "0")} /{" "}
                    {spotlight.collection.toUpperCase()}
                  </span>
                </div>
                <div className="exhibit-copy">
                  <span className="eyebrow">
                    {spotlight.discipline} /{" "}
                    {spotlight.demo.type === "embedded"
                      ? "ORIGINAL APPLICATION"
                      : spotlight.demo.type === "unavailable"
                        ? "DOCUMENTED SCOPE"
                        : "INTERACTIVE EXPLORER"}
                  </span>
                  <h3>{spotlight.title}</h3>
                  <p>{spotlight.tagline}</p>
                  <Link
                    className="button button-lime"
                    href={`/projects/${spotlight.slug}/`}
                    prefetch={false}
                    onClick={() => beginPortal(spotlight.accent)}
                  >
                    Explore project <ArrowUpRight size={17} />
                  </Link>
                </div>
              </div>
            )}
            <div
              className={`project-grid project-index-list ${gallery.layout === "index" ? "compact-index" : ""}`}
            >
              {filtered.map((project) => (
                <div className="project-index-entry" key={project.id}>
                  <ProjectCard
                    project={project}
                    index={projects.indexOf(project)}
                    onOpen={() => setSelected(project)}
                  />
                  <button
                    className="exhibit-select"
                    aria-label={`Preview ${project.title} in exhibit`}
                    aria-pressed={spotlight?.id === project.id}
                    onClick={() => {
                      setGallery({
                        ...gallery,
                        selectedSlug: project.slug,
                        layout: "exhibits",
                      });
                      requestAnimationFrame(() =>
                        document
                          .querySelector(".project-exhibit")
                          ?.scrollIntoView({
                            block: "center",
                            behavior: matchMedia(
                              "(prefers-reduced-motion: reduce)",
                            ).matches
                              ? "instant"
                              : "smooth",
                          }),
                      );
                    }}
                  >
                    <ScanLine size={15} />
                    <span>Preview</span>
                  </button>
                </div>
              ))}
            </div>
            {!filtered.length && (
              <div className="gallery-empty">
                {gallery.discipline === "Hardware" ? (
                  <CircuitBoard size={36} />
                ) : (
                  <Search size={30} />
                )}
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
                <button className="button button-lime" onClick={reset}>
                  Reset filters <X size={15} />
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="work-end mono">
          <span>
            SOURCE EVIDENCE, EXECUTION STATUS & DEMO OPTIONS INSIDE EACH WORLD.
          </span>
          <a href="#engine">
            INSPECT THE SYSTEMS <ArrowUpRight size={14} />
          </a>
        </div>
      </div>
      {selected && (
        <ProjectDialog project={selected} close={() => setSelected(null)} />
      )}
    </section>
  );
}
