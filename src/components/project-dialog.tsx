"use client";
import { useEffect, useRef } from "react";
import { m } from "motion/react";
import Link from "next/link";
import { Github, X, ArrowUpRight } from "lucide-react";
import type { Project } from "@/data/projects";
import MiniAnim, { animForSlug } from "./mini-anim";
export default function ProjectDialog({
  project,
  close,
}: {
  project: Project;
  close: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    element?.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = old;
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="project-dialog"
      aria-labelledby="project-dialog-title"
      onClose={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="dialog-inner"
      >
        <button
          type="button"
          className="dialog-close icon-button"
          onClick={close}
          aria-label="Close project details"
          autoFocus
        >
          <X size={22} />
        </button>
        <div className="dialog-preview">
          <MiniAnim
            kind={animForSlug[project.slug] ?? "pulse"}
            label={`Animated concept sketch of ${project.title}`}
          />
        </div>
        <div className="dialog-copy">
          <span className="eyebrow">
            {project.categories.join(" / ")} ·{" "}
            {project.sourceVisibility === "public"
              ? "PUBLIC SOURCE VERIFIED"
              : "INDEPENDENT DEMO"}
          </span>
          <h2 id="project-dialog-title">{project.title}</h2>
          <p className="dialog-subtitle">{project.tagline}</p>
          <p>{project.overview}</p>
          <div className="project-tags">
            {project.stack.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <div className="dialog-actions">
            <Link
              href={`/projects/${project.slug}`}
              prefetch={false}
              className="button button-lime"
            >
              Enter project world
              <ArrowUpRight size={16} />
            </Link>
            {project.githubUrl ? (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="button button-outline"
              >
                <Github size={17} /> Source code
                <ArrowUpRight size={16} />
              </a>
            ) : (
              <span className="unavailable">
                <Github size={16} /> Source not added yet
              </span>
            )}
            {project.liveUrl ? (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="button button-lime"
              >
                Live project
                <ArrowUpRight size={16} />
              </a>
            ) : (
              <span className="unavailable">Demo not published yet</span>
            )}
          </div>
        </div>
      </m.div>
    </dialog>
  );
}
