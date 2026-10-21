"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence } from "motion/react";
import { Search, X, ArrowUpRight } from "lucide-react";
import { projects, categories, type Project } from "@/data/projects";
import { usePortfolioState } from "./app-frame";
import { ProjectCard } from "./project-components";
import { SectionLabel, Reveal } from "./ui";
const ProjectDialog = dynamic(() => import("./project-dialog"), { ssr: false });
export default function ProjectGallery() {
  const { gallery, setGallery } = usePortfolioState();
  const [selected, setSelected] = useState<Project | null>(null);
  const filtered = projects.filter(
    (project) =>
      (gallery.category === "All worlds" ||
        project.categories.includes(gallery.category)) &&
      (!gallery.featuredOnly || project.featured) &&
      `${project.title} ${project.description} ${project.stack.join(" ")} ${project.categories.join(" ")}`
        .toLowerCase()
        .includes(gallery.query.toLowerCase().trim()),
  );
  return (
    <section id="projects" className="projects-section section-pad">
      <div className="container">
        <SectionLabel number="01">
          THE PROJECT MULTIVERSE / CHOOSE YOUR WORLD
        </SectionLabel>
        <Reveal className="section-heading">
          <h2>
            Different worlds.
            <br />
            One <em>curious mind.</em>
          </h2>
          <div>
            <p>
              Algorithms to intelligent systems.
              <br />
              Follow a question. Enter a world. See how it works.
            </p>
            <span className="template-note mono">
              {projects.filter((p) => p.sourceVisibility === "public").length}{" "}
              PUBLIC REPOSITORIES / 1 INDEPENDENT STUDY
            </span>
          </div>
        </Reveal>
        <div className="gallery-toolbar">
          <label className="project-search">
            <Search size={16} />
            <span className="sr-only">Search project worlds</span>
            <input
              type="search"
              value={gallery.query}
              placeholder="Find a world, a tool, an idea…"
              onChange={(event) =>
                setGallery({ ...gallery, query: event.target.value })
              }
            />
            {gallery.query && (
              <button
                aria-label="Clear project search"
                onClick={() => setGallery({ ...gallery, query: "" })}
              >
                <X size={14} />
              </button>
            )}
          </label>
          <button
            className="featured-toggle"
            aria-pressed={gallery.featuredOnly}
            onClick={() =>
              setGallery({ ...gallery, featuredOnly: !gallery.featuredOnly })
            }
          >
            Featured only
          </button>
          <span className="mono gallery-count" role="status">
            {filtered.length} / {projects.length} WORLDS
          </span>
        </div>
        <div
          className="project-filters"
          role="group"
          aria-label="Filter projects by category"
        >
          {categories.map((category) => (
            <button
              key={category}
              aria-pressed={gallery.category === category}
              onClick={() => setGallery({ ...gallery, category })}
            >
              {category}
              {category === "All worlds" && <span>{projects.length}</span>}
            </button>
          ))}
        </div>
        <div className="project-grid">
          <AnimatePresence mode="popLayout">
            {filtered.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={projects.indexOf(project)}
                onOpen={() => setSelected(project)}
              />
            ))}
          </AnimatePresence>
        </div>
        {filtered.length === 0 && (
          <div className="gallery-empty">
            <Search size={30} />
            <h3>No worlds match that signal.</h3>
            <p>Try a project name, technology, or a different category.</p>
            <button
              className="button button-lime"
              onClick={() =>
                setGallery({
                  query: "",
                  category: "All worlds",
                  featuredOnly: false,
                })
              }
            >
              Reset filters
              <X size={15} />
            </button>
          </div>
        )}
        <div className="work-end mono">
          <span>
            EVERY TECHNICAL CLAIM HAS A SOURCE. EVERY WORLD HAS A WAY IN.
          </span>
          <a href="#engine">
            EXPLORE THE ARCHITECTURE
            <ArrowUpRight size={14} />
          </a>
        </div>
      </div>
      {selected && (
        <ProjectDialog project={selected} close={() => setSelected(null)} />
      )}
    </section>
  );
}
