"use client";
import { m, useMotionValue, useSpring, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/data/projects";
import { motionTokens } from "./motion-config";
import ProjectPreview from "./project-preview";
export function ProjectCard({
  project,
  index,
  onOpen,
}: {
  project: Project;
  index: number;
  onOpen: () => void;
}) {
  const rotateX = useMotionValue(0),
    rotateY = useMotionValue(0);
  const rx = useSpring(rotateX, motionTokens.spring),
    ry = useSpring(rotateY, motionTokens.spring);
  const reduced = useReducedMotion();
  return (
    <m.article
      layout
      initial={{ opacity: 1, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : 0.3 }}
      className={`project-card project-${project.preview}`}
    >
      <m.div
        className="project-preview-frame"
        style={{ rotateX: rx, rotateY: ry, transformPerspective: 1000 }}
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse" || reduced) return;
          const bounds = e.currentTarget.getBoundingClientRect();
          rotateX.set((0.5 - (e.clientY - bounds.top) / bounds.height) * 4);
          rotateY.set(((e.clientX - bounds.left) / bounds.width - 0.5) * 4);
        }}
        onPointerLeave={() => {
          rotateX.set(0);
          rotateY.set(0);
        }}
      >
        <ProjectPreview type={project.preview} />
        <span className="project-demo mono" aria-hidden="true">
          CONCEPT STUDY
        </span>
        <button
          type="button"
          className="project-preview-button"
          onClick={onOpen}
          aria-label={`View ${project.title} project details`}
        >
          <span className="project-open" aria-hidden="true">
            <ArrowUpRight size={22} />
          </span>
        </button>
      </m.div>
      <div className="project-info">
        <div>
          <span className="project-index mono">
            0{index + 1} / {project.category}
          </span>
          <h3>
            <button onClick={onOpen}>
              {project.title}
              <ArrowUpRight size={25} />
            </button>
          </h3>
          <p>{project.description}</p>
        </div>
        <span className="project-year mono">
          {project.featured ? "FEATURED" : "EXPLORATION"}
        </span>
      </div>
      <div className="project-tags">
        {project.stack.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
    </m.article>
  );
}
