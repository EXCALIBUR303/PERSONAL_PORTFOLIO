"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Layers3 } from "lucide-react";
import { projects } from "@/data/projects";
import ArchitectureExplorer from "./architecture-explorer";
import { Reveal, SectionLabel } from "./ui";
export default function DimensionEngine() {
  const [slug, setSlug] = useState("student-burnout-ai");
  const project = projects.find((p) => p.slug === slug) || projects[0];
  return (
    <section id="engine" className="engine-section section-pad">
      <div className="container">
        <SectionLabel number="03">
          DIMENSION ENGINE / UNDER THE SURFACE
        </SectionLabel>
        <Reveal className="section-heading">
          <h2>
            Good systems
            <br />
            have a <em>story.</em>
          </h2>
          <p>
            Follow the data. Find the boundary.
            <br />
            Explore what connects the pieces.
          </p>
        </Reveal>
        <div className="engine-layout">
          <aside className="engine-selector">
            <span className="eyebrow">
              <Layers3 size={14} /> CHOOSE A SYSTEM
            </span>
            <label className="sr-only" htmlFor="engine-project">
              Project architecture
            </label>
            <select
              id="engine-project"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
            >
              {projects.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.title}
                </option>
              ))}
            </select>
            <div className="engine-project-meta">
              <span className="mono">
                {project.categories[0].toUpperCase()}
              </span>
              <h3>{project.title}</h3>
              <p>{project.description}</p>
              <span className="source-status">
                <i />
                {project.sourceVisibility === "public"
                  ? "PUBLIC SOURCE VERIFIED"
                  : "INDEPENDENT DEMO"}
              </span>
              <Link href={`/projects/${project.slug}`} prefetch={false}>
                Enter this world
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </aside>
          <ArchitectureExplorer key={project.id} project={project} compact />
        </div>
      </div>
    </section>
  );
}
