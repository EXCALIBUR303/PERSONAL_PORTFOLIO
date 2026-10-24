"use client";
import { useRef, useState } from "react";
import { useShiftIntro } from "./shift-intro";
import { ArrowDown, ArrowUpRight, Github } from "lucide-react";
import { profile } from "@/data/profile";
import { projects } from "@/data/projects";
import HeroScenes, { heroMemory } from "./scenes/scene-stage";
import { accentOf, type CategoryId } from "./scenes/catalog";

/** Professional hero: copy on the left, the project scenes on the right. */
export default function EngineeringDesk() {
  const [category, setCategory] = useState<CategoryId>(() => heroMemory.category);
  const section = useRef<HTMLElement>(null);
  useShiftIntro(section, "pro");
  const github = profile.socials.find((s) => s.name === "GitHub")?.url;
  return (
    <section
      ref={section}
      className="hx hx-pro engineering-hero"
      aria-labelledby="hero-title"
      style={{ "--station-accent": accentOf(category) } as React.CSSProperties}
    >
      <svg className="ws-grid" aria-hidden="true" preserveAspectRatio="none">
        {Array.from({ length: 13 }, (_, i) => (
          <line key={`v${i}`} x1={`${(i * 100) / 12}%`} y1="0" x2={`${(i * 100) / 12}%`} y2="100%" />
        ))}
        {Array.from({ length: 7 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={`${(i * 100) / 6}%`} x2="100%" y2={`${(i * 100) / 6}%`} />
        ))}
      </svg>
      <div className="container hx-grid">
        <div className="hx-copy">
          <p className="hx-topline mono">
            <i className="status-dot" /> {profile.name.toUpperCase()} / B.TECH
            CSE / FIELD NOTES
          </p>
          <h1 id="hero-title" tabIndex={-1}>
            Hi, I&apos;m Sidharth. I build <em>intelligent systems</em>, and
            make them <em className="hero-underlined">explorable</em>.
          </h1>
          <p className="hx-lede">{profile.introduction}</p>
          <div className="hx-actions">
            <a href="#projects" className="button button-lime">
              Explore my work <ArrowDown size={17} />
            </a>
            <a href="#about" className="hero-contact">
              About me <ArrowUpRight size={16} />
            </a>
          </div>
          <dl className="hx-facts mono">
            <div>
              <dt>Project worlds</dt>
              <dd>{String(projects.length).padStart(2, "0")}</dd>
            </div>
            <div>
              <dt>Degree</dt>
              <dd>B.Tech CSE</dd>
            </div>
            {github && (
              <div>
                <dt>Source</dt>
                <dd>
                  <a href={github} target="_blank" rel="noopener noreferrer">
                    <Github size={13} /> EXCALIBUR303
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>
        <div className="hx-visual">
          <HeroScenes onCategoryChange={setCategory} />
        </div>
      </div>
    </section>
  );
}
