"use client";
import { useMemo, useRef, useState } from "react";
import { useShiftIntro } from "../shift-intro";
import Link from "next/link";
import { m, useReducedMotion } from "motion/react";
import { micro, motionTokens } from "../motion-config";
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  Compass,
  Eye,
  EyeOff,
  RotateCcw,
} from "lucide-react";
import { profile } from "@/data/profile";
import { projects, type Project } from "@/data/projects";
import { demoClassFor } from "@/data/demo-class";
import { missionSteps, useExploration } from "@/lib/exploration";
import { SceneStage } from "../scenes/scene-stage";
import { sceneForSlug } from "../scenes/catalog";
import { useGalleryFilter } from "../use-gallery-filter";
import { districtFor, districts, toneFor } from "./identity";

/**
 * Creative home: a studio map. Every project is a station on one of three
 * districts. Choosing a station opens a briefing with four short missions that
 * each lead to a real section of the project page. Session progress is counted
 * from what this visitor actually opened.
 */
export default function CreativeHero() {
  const reduced = useReducedMotion();
  const [slug, setSlug] = useState("mazera-ai-maze-solver");
  const [peek, setPeek] = useState(false);
  const { filtered, gallery } = useGalleryFilter();
  const { visited, stepsFor, markStep, reset } = useExploration();
  const brief = useRef<HTMLElement>(null);
  const section = useRef<HTMLElement>(null);
  useShiftIntro(section, "creative", { onLoad: true });
  const project = projects.find((p) => p.slug === slug) ?? projects[0];
  const matching = new Set(filtered.map((p) => p.slug));
  const filtering = filtered.length !== projects.length;
  const byDistrict = useMemo(
    () =>
      districts.map((d) => ({
        ...d,
        stations: projects.filter((p) => districtFor(p) === d.id),
      })),
    [],
  );
  const number = projects.indexOf(project) + 1;
  const district = districts.find(
    (d) => d.id === districtFor(project),
  )!;
  const demo = demoClassFor(project);
  const lens = sceneForSlug(project.slug)?.id;
  const done = stepsFor(project.slug);

  function choose(next: Project) {
    setSlug(next.slug);
    setPeek(false);
    if (matchMedia("(max-width: 899px)").matches)
      requestAnimationFrame(() =>
        brief.current?.scrollIntoView({
          block: "start",
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        }),
      );
  }
  function nextUnexplored() {
    const order = [
      ...projects.slice(projects.indexOf(project) + 1),
      ...projects,
    ];
    const next =
      order.find((p) => !visited.includes(p.slug) && p.slug !== slug) ??
      order[0];
    choose(next);
  }

  return (
    <section
      id="map"
      ref={section}
      className="c-hero"
      aria-labelledby="hero-title"
    >
      <div className="container">
        <div className="c-hero-top">
          <div className="c-hero-copy">
            <p className="c-kicker mono">
              <span className="c-pill">Studio map</span>
              {profile.name} · B.Tech CSE
            </p>
            <h1 id="hero-title" tabIndex={-1}>
              Hi, I&apos;m Sidharth. <br className="c-br" />I build{" "}
              <em className="c-mark">intelligent systems</em>, and make them{" "}
              <em className="c-scribble c-draw">
                explorable
                <svg
                  viewBox="0 0 220 16"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path d="M3 10 C 22 2, 38 15, 60 8 S 98 3, 120 9 S 165 14, 217 5" />
                </svg>
              </em>
              .
            </h1>
          </div>
          <div className="c-note">
            <span className="c-tape" aria-hidden="true" />
            <svg
              className="c-doodle c-draw"
              viewBox="0 0 120 70"
              aria-hidden="true"
            >
              <path d="M6 8 C 40 4, 80 18, 92 52" />
              <path d="M80 44 L 93 56 L 104 40" />
            </svg>
            <p>{profile.introduction}</p>
            <p className="c-note-how">
              Pick a station on the map for a short briefing and four missions.
              Prefer to scroll? The board below has every project.
            </p>
            <div className="c-hero-actions">
              <a href="#projects" className="c-btn c-btn-ink">
                Browse the board <ArrowDown size={17} aria-hidden="true" />
              </a>
              <a href="#contact" className="c-btn c-btn-paper">
                Say hi <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        <div className="c-progress" role="status">
          <span className="mono">
            Explored{" "}
            <b>
              {visited.filter((s) => projects.some((p) => p.slug === s)).length}
            </b>{" "}
            of {projects.length} stations in this tab
          </span>
          <ol className="c-pips" aria-hidden="true">
            {projects.map((p) => (
              <li
                key={p.slug}
                data-done={visited.includes(p.slug) || undefined}
                data-current={p.slug === slug || undefined}
              />
            ))}
          </ol>
          <button
            type="button"
            className="c-link-btn"
            onClick={reset}
            disabled={!visited.length}
          >
            <RotateCcw size={13} aria-hidden="true" /> Clear
          </button>
          <span className="c-progress-note">
            Counted from pages you open. Kept only in this browser tab.
          </span>
        </div>

        <div className="c-map-layout">
          <aside
            className="c-brief"
            ref={brief}
            aria-live="polite"
            aria-label="Station briefing"
            data-tone={toneFor(project.slug)}
            style={{ "--world-accent": project.accent } as React.CSSProperties}
          >
            <span className="c-tape c-tape-a" aria-hidden="true" />
            <p className="c-brief-no mono">
              Station {String(number).padStart(2, "0")} · {district.label}
            </p>
            <m.h2
              key={project.slug}
              initial={reduced ? false : { y: 10 }}
              animate={{ y: 0 }}
              transition={{ duration: motionTokens.duration.normal, ease: motionTokens.ease }}
            >
              {project.title}
            </m.h2>
            <p className="c-brief-tag">{project.tagline}</p>
            <ul className="c-brief-badges">
              <li>{project.collection} project</li>
              <li>{project.status}</li>
              <li data-kind={demo.kind}>{demo.label}</li>
            </ul>
            <p>{project.description}</p>
            <ol className="c-missions" aria-label="Missions">
              {missionSteps.map((step, i) => (
                <li
                  key={step.id}
                  data-done={done.includes(step.id) || undefined}
                >
                  <Link
                    href={`/projects/${project.slug}/#${step.id}`}
                    prefetch={false}
                    onClick={() => markStep(project.slug, step.id)}
                  >
                    <span className="c-mission-no mono" aria-hidden="true">
                      {done.includes(step.id) ? <Check size={13} /> : i + 1}
                    </span>
                    {step.label}
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ol>
            <div className="c-brief-actions">
              <Link
                href={`/projects/${project.slug}/#problem`}
                prefetch={false}
                className="c-btn c-btn-lime"
                onClick={() => markStep(project.slug, "problem")}
              >
                Start the missions <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
              <Link
                href={`/projects/${project.slug}/`}
                prefetch={false}
                className="c-btn c-btn-paper"
              >
                Open project page
              </Link>
              {lens && (
                <button
                  type="button"
                  className="c-btn c-btn-paper"
                  aria-expanded={peek}
                  onClick={() => setPeek(!peek)}
                >
                  {peek ? (
                    <EyeOff size={15} aria-hidden="true" />
                  ) : (
                    <Eye size={15} aria-hidden="true" />
                  )}
                  {peek ? "Hide quick peek" : "Quick peek"}
                </button>
              )}
            </div>
            {lens && peek && (
              <div className="c-peek">
                <SceneStage id={lens} />
              </div>
            )}
          </aside>

          <div className="c-map" role="group" aria-label="Project stations">
            {filtering && (
              <p className="c-map-filter mono" role="status">
                {filtered.length} of {projects.length} stations match your board
                filters{gallery.query ? ` (“${gallery.query}”)` : ""}. The rest
                are dimmed.
              </p>
            )}
            {byDistrict.map((d) => (
              <section
                key={d.id}
                className="c-island"
                data-district={d.id}
                aria-labelledby={`district-${d.id}`}
              >
                <header>
                  <h3 id={`district-${d.id}`}>{d.label}</h3>
                  <p>{d.blurb}</p>
                </header>
                <ul className="c-pins">
                  {d.stations.map((p) => (
                    <li key={p.slug}>
                      <button
                        type="button"
                        className="c-pin"
                        data-tone={toneFor(p.slug)}
                        data-match={matching.has(p.slug)}
                        data-visited={visited.includes(p.slug) || undefined}
                        aria-pressed={p.slug === slug}
                        onClick={() => choose(p)}
                      >
                        <span className="c-pin-no mono" aria-hidden="true">
                          {String(projects.indexOf(p) + 1).padStart(2, "0")}
                        </span>
                        <span className="c-pin-title">{p.title}</span>
                        {visited.includes(p.slug) && (
                          <span className="sr-only">, explored</span>
                        )}
                        {visited.includes(p.slug) && (
                          <m.span
                            className="c-pin-check-pop"
                            initial={reduced ? false : { scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={micro.glide}
                          >
                            <Check
                              size={14}
                              className="c-pin-check"
                              aria-hidden="true"
                            />
                          </m.span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            <button
              type="button"
              className="c-surprise"
              onClick={nextUnexplored}
            >
              <Compass size={16} aria-hidden="true" /> Next unexplored station
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
