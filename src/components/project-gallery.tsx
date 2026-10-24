"use client";
import { useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { Search, X, ArrowUpRight, CircuitBoard } from "lucide-react";
import { projects, categories } from "@/data/projects";
import { useGalleryFilter } from "./use-gallery-filter";
import { ProjectCard, ProjectRow, Segmented } from "./project-components";
import { micro, motionTokens } from "./motion-config";
import { SectionLabel } from "./ui";

/**
 * Professional project gallery. A few featured projects come first, each with
 * one clear action. Everything else sits in a list below, and a row opens a
 * quick view in place. The filters are shared with the Creative gallery.
 */
export default function ProjectGallery() {
  const { gallery, setGallery, filtered, reset } = useGalleryFilter();
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const reduced = useReducedMotion();
  const featured = filtered.filter((p) => p.featured);
  const more = filtered.filter((p) => !p.featured);
  const featuredTotal = projects.filter((p) => p.featured).length;
  const count = (collection: string) =>
    projects.filter((p) => collection === "All" || p.collection === collection).length;
  const empty = !filtered.length;
  return (
    <section id="projects" className="projects-section section-pad pg">
      <div className="container">
        <SectionLabel number="01">SELECTED WORK</SectionLabel>
        <div className="pg-head">
          <h2>
            Built to be
            <br />
            <em>explored.</em>
          </h2>
          <p>
            Coursework and independent projects. Start with the {featuredTotal}{" "}
            featured ones; each opens into its own page where you can try the
            idea. The rest of the work is listed below them.
          </p>
          <span className="pg-total mono" aria-label={`${projects.length} projects`}>
            {projects.length}
            <small>PROJECTS</small>
          </span>
        </div>

        <div className="pg-toolbar">
          <label className="pg-search">
            <Search size={17} aria-hidden="true" />
            <span className="sr-only">Search project worlds</span>
            <input
              type="search"
              value={gallery.query}
              placeholder="Search projects, tools, ideas…"
              onChange={(event) => setGallery({ ...gallery, query: event.target.value })}
            />
            <AnimatePresence>
              {gallery.query && (
                <m.button
                  type="button"
                  aria-label="Clear project search"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ duration: reduced ? 0 : 0.16 }}
                  onClick={() => setGallery({ ...gallery, query: "" })}
                >
                  <X size={15} />
                </m.button>
              )}
            </AnimatePresence>
          </label>
          <Segmented
            id="collection"
            label="Project collections"
            value={gallery.collection}
            onChange={(collection) =>
              setGallery({ ...gallery, collection, selectedSlug: null })
            }
            options={(["All", "College", "Personal"] as const).map((collection) => ({
              value: collection,
              label: collection === "All" ? "All projects" : `${collection} Projects`,
              count: count(collection),
            }))}
          />
        </div>
        <div className="pg-toolbar pg-toolbar-sub">
          <Segmented
            id="discipline"
            label="Software or hardware"
            value={gallery.discipline}
            onChange={(discipline) => setGallery({ ...gallery, discipline, selectedSlug: null })}
            options={[
              { value: "All", label: "All types" },
              { value: "Software", label: "Software" },
              { value: "Hardware", label: "Hardware" },
            ]}
          />
          <label className="pg-select">
            <span className="sr-only">Filter projects by category</span>
            <select
              value={gallery.category}
              onChange={(event) => setGallery({ ...gallery, category: event.target.value })}
            >
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          {gallery.featuredOnly && (
            <button
              type="button"
              className="pg-chip"
              onClick={() => setGallery({ ...gallery, featuredOnly: false })}
            >
              Featured only <X size={13} aria-hidden="true" />
              <span className="sr-only">Show all projects</span>
            </button>
          )}
          <span className="mono pg-count" role="status">
            {filtered.length} / {projects.length} PROJECTS
          </span>
        </div>
        <p className="pg-note">
          College and Personal are confirmed by me. Hardware is reserved for physical
          builds; simulations stay in Software.
        </p>

        {featured.length > 0 && (
          <>
            <h3 className="pg-sub">
              Featured <span className="mono">{featured.length}</span>
            </h3>
            <m.div
              className="pg-featured"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.1 }}
              variants={{
                hidden: {},
                show: {
                  transition: { staggerChildren: reduced ? 0 : micro.enter.stagger },
                },
              }}
            >
              {featured.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </m.div>
          </>
        )}

        {more.length > 0 && (
          <>
            <h3 className="pg-sub">
              More work <span className="mono">{more.length}</span>
            </h3>
            <p className="pg-sub-note">
              Select a row for a quick look. Every project opens into its own page.
            </p>
            <ul className="pg-list">
              {more.map((project, i) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  index={i}
                  open={openSlug === project.slug}
                  onToggle={() => setOpenSlug(openSlug === project.slug ? null : project.slug)}
                />
              ))}
            </ul>
          </>
        )}

        <AnimatePresence>
          {empty && (
            <m.div
              className="gallery-empty pg-empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0 : motionTokens.duration.normal, ease: motionTokens.ease }}
            >
              {gallery.discipline === "Hardware" ? <CircuitBoard size={36} /> : <Search size={30} />}
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
            </m.div>
          )}
        </AnimatePresence>

        <div className="work-end mono">
          <span>SOURCE EVIDENCE, EXECUTION STATUS & DEMO OPTIONS INSIDE EACH PROJECT.</span>
          <a href="https://github.com/EXCALIBUR303?tab=repositories" target="_blank" rel="noopener noreferrer">
            BROWSE GITHUB <ArrowUpRight size={14} />
          </a>
        </div>
      </div>
    </section>
  );
}
