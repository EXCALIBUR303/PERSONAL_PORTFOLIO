"use client";
import Link from "next/link";
import {
  AnimatePresence,
  m,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import { ArrowUpRight, ChevronDown, Github } from "lucide-react";
import type { Project } from "@/data/projects";
import { micro, motionTokens } from "./motion-config";
import MiniAnim, { animForSlug } from "./mini-anim";
import { usePortfolioState } from "./app-frame";

const demoLabel: Record<Project["demo"]["type"], string> = {
  embedded: "Original app",
  local: "Run locally",
  unavailable: "Demo unavailable",
  simulation: "Interactive simulation",
};

/** College or Personal, as confirmed by the project owner. */
export function CollectionPill({ project }: { project: Project }) {
  return (
    <span className={`pg-pill pg-pill-${project.collection.toLowerCase()}`}>
      {project.collection} project
    </span>
  );
}

/**
 * Featured project: title, one line, College or Personal, status, and one
 * action. The whole card is the link. Hover lifts it, the preview follows the
 * pointer a few degrees, and pressing it sinks it slightly.
 */
export function ProjectCard({ project }: { project: Project }) {
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const rx = useSpring(rotateX, motionTokens.spring);
  const ry = useSpring(rotateY, motionTokens.spring);
  const reduced = useReducedMotion();
  const { beginPortal } = usePortfolioState();
  return (
    <m.article
      layout
      variants={{
        hidden: { y: micro.enter.y },
        show: {
          y: 0,
          transition: { duration: motionTokens.duration.reveal, ease: motionTokens.ease },
        },
      }}
      whileHover={reduced ? undefined : { y: micro.lift }}
      whileTap={reduced ? undefined : { scale: micro.press + 0.02 }}
      transition={motionTokens.spring}
      className="project-card pg-card"
      data-ws-card={project.slug}
      style={{ "--world-accent": project.accent } as React.CSSProperties}
      onPointerMove={(event) => {
        if (event.pointerType !== "mouse" || reduced) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        rotateX.set((0.5 - (event.clientY - bounds.top) / bounds.height) * micro.tilt);
        rotateY.set(((event.clientX - bounds.left) / bounds.width - 0.5) * micro.tilt);
      }}
      onPointerLeave={() => {
        rotateX.set(0);
        rotateY.set(0);
      }}
    >
      <m.div
        className="pg-card-preview"
        style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      >
        <MiniAnim
          kind={animForSlug[project.slug] ?? "pulse"}
          label={`Animated concept sketch of ${project.title}`}
        />
      </m.div>
      <div className="pg-card-body">
        <div className="pg-meta">
          <CollectionPill project={project} />
          <span className="pg-status">
            <i aria-hidden="true" />
            {project.status}
          </span>
        </div>
        <h3>{project.title}</h3>
        <p>{project.description}</p>
        <Link
          className="pg-action"
          href={`/projects/${project.slug}`}
          prefetch={false}
          onClick={() => beginPortal(project.accent)}
          data-cursor="OPEN"
        >
          Open project
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </m.article>
  );
}

/**
 * One row of the "More work" list. Selecting it opens a quick view in place:
 * a larger sketch, the overview, the stack and the links. One row is open at
 * a time; the gallery owns which.
 */
export function ProjectRow({
  project,
  index,
  open,
  onToggle,
}: {
  project: Project;
  index: number;
  open: boolean;
  onToggle: () => void;
}) {
  const reduced = useReducedMotion();
  const { beginPortal } = usePortfolioState();
  const panel = `quick-${project.slug}`;
  return (
    <m.li
      layout="position"
      className="pg-row"
      data-open={open}
      style={{ "--world-accent": project.accent } as React.CSSProperties}
    >
      <button
        type="button"
        className="pg-row-head"
        aria-expanded={open}
        aria-controls={panel}
        onClick={onToggle}
      >
        <span className="pg-row-no mono" aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="pg-row-title">
          <strong>{project.title}</strong>
          <small>{project.tagline}</small>
        </span>
        <CollectionPill project={project} />
        <span className="pg-row-status">{project.status}</span>
        <span className="sr-only">Quick view of {project.title}</span>
        <m.span
          className="pg-chevron"
          aria-hidden="true"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: reduced ? 0 : micro.expand, ease: motionTokens.ease }}
        >
          <ChevronDown size={18} />
        </m.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <m.div
            id={panel}
            role="region"
            aria-label={`${project.title} quick view`}
            className="pg-quick"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0 : micro.expand, ease: motionTokens.ease }}
          >
            <div className="pg-quick-inner">
              <div className="pg-quick-art">
                <MiniAnim
                  kind={animForSlug[project.slug] ?? "pulse"}
                  label={`Animated concept sketch of ${project.title}`}
                />
              </div>
              <div className="pg-quick-copy">
                <p className="pg-quick-lede">{project.overview}</p>
                <div className="pg-tags">
                  {project.stack.slice(0, 7).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <p className="pg-quick-demo mono">{demoLabel[project.demo.type]}</p>
                <div className="pg-quick-actions">
                  <Link
                    className="button button-lime"
                    href={`/projects/${project.slug}`}
                    prefetch={false}
                    onClick={() => beginPortal(project.accent)}
                  >
                    Open project <ArrowUpRight size={16} aria-hidden="true" />
                  </Link>
                  {project.githubUrl ? (
                    <a
                      className="button button-outline"
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Github size={16} aria-hidden="true" /> Source code
                    </a>
                  ) : (
                    <span className="unavailable">Source not added yet</span>
                  )}
                  {project.liveUrl && (
                    <a
                      className="button button-outline"
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Live project <ArrowUpRight size={16} aria-hidden="true" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.li>
  );
}

/**
 * Segmented filter. The highlight is one element that glides to whichever
 * option is pressed, so the change reads as a single movement.
 */
export function Segmented<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: T;
  options: { value: T; label: string; count?: number }[];
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="pg-seg">
      {options.map((option) => {
        const on = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(option.value)}
          >
            {on && (
              <m.span
                layoutId={`seg-${id}`}
                className="pg-seg-pill"
                transition={micro.glide}
              />
            )}
            <span className="pg-seg-label">{option.label}</span>
            {option.count !== undefined && <small>{option.count}</small>}
          </button>
        );
      })}
    </div>
  );
}
