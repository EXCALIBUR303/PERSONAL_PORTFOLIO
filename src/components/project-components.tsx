"use client";
import Link from "next/link";
import { m, useMotionValue, useSpring, useReducedMotion } from "motion/react";
import { ArrowUpRight, Info } from "lucide-react";
import type { Project } from "@/data/projects";
import { motionTokens } from "./motion-config";
import MiniAnim, { animForSlug } from "./mini-anim";
import { usePortfolioState } from "./app-frame";
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
    rotateY = useMotionValue(0),
    rx = useSpring(rotateX, motionTokens.spring),
    ry = useSpring(rotateY, motionTokens.spring),
    reduced = useReducedMotion();
  const { beginPortal } = usePortfolioState();
  return (
    <m.article
      layout
      initial={{ opacity: 1, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : 0.3 }}
      className={`project-card project-${project.kind}`}
      style={{ "--world-accent": project.accent } as React.CSSProperties}
    >
      <m.div
        className="project-preview-frame"
        style={{ rotateX: rx, rotateY: ry, transformPerspective: 1000 }}
        onPointerMove={(event) => {
          if (event.pointerType !== "mouse" || reduced) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          rotateX.set((0.5 - (event.clientY - bounds.top) / bounds.height) * 4);
          rotateY.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 4);
        }}
        onPointerLeave={() => {
          rotateX.set(0);
          rotateY.set(0);
        }}
      >
        <MiniAnim
          kind={animForSlug[project.slug] ?? "pulse"}
          label={`Animated concept sketch of ${project.title}`}
        />
        <span className="project-demo mono" aria-hidden="true">
          {project.sourceVisibility === "public"
            ? "PUBLIC SOURCE / VERIFIED"
            : "INDEPENDENT STUDY"}
        </span>
        <Link
          className="project-preview-button"
          href={`/projects/${project.slug}`}
          prefetch={false}
          onClick={() => beginPortal(project.accent)}
          aria-label={`Enter ${project.title} world`}
          data-cursor="OPEN"
        >
          <span className="project-open" aria-hidden="true">
            <ArrowUpRight size={22} />
          </span>
        </Link>
      </m.div>
      <div className="project-info">
        <div>
          <span className="project-index mono">
            {String(index + 1).padStart(2, "0")} / {project.categories[0]}
          </span>
          <h3>
            <Link
              href={`/projects/${project.slug}`}
              prefetch={false}
              onClick={() => beginPortal(project.accent)}
            >
              {project.title}
              <ArrowUpRight size={23} />
            </Link>
          </h3>
          <p>{project.description}</p>
        </div>
        <button
          className="project-quick icon-button"
          onClick={onOpen}
          aria-label={`Quick overview of ${project.title}`}
        >
          <Info size={16} />
        </button>
      </div>
      <div className="project-tags">
        {project.stack.slice(0, 4).map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <span className="project-status">
        <i />
        {project.status} ·{" "}
        {project.demo.type === "embedded"
          ? "Original app"
          : project.demo.type === "local"
            ? "Run locally"
            : project.demo.type === "unavailable"
              ? "Demo unavailable"
              : "Interactive simulation"}
      </span>
    </m.article>
  );
}
