"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Github } from "lucide-react";
import { profile } from "@/data/profile";
import { projects } from "@/data/projects";
import HeroStage from "./hero-stage";
import { stations, type DeskMode } from "./desk-data";

export type { DeskMode };

/** Professional hero: copy on the left, one framed 3D stage with its lens panel on the right. */
export default function EngineeringDesk() {
  const [mode, setMode] = useState<DeskMode>("systems");
  const station = stations.find((item) => item.id === mode)!;
  const github = profile.socials.find((s) => s.name === "GitHub")?.url;
  return (
    <section
      className="hx hx-pro engineering-hero"
      aria-labelledby="hero-title"
      style={{ "--station-accent": station.accent } as React.CSSProperties}
    >
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
          <HeroStage mode={mode} variant="pro" />
          <div className="hx-panel">
            <div
              className="hx-lenses"
              role="group"
              aria-label="Engineering desk discipline"
            >
              {stations.map((item) => (
                <button
                  key={item.id}
                  aria-pressed={mode === item.id}
                  onClick={() => setMode(item.id)}
                  style={
                    { "--lens-accent": item.accent } as React.CSSProperties
                  }
                >
                  <item.icon size={17} aria-hidden="true" />
                  {item.label}
                </button>
              ))}
            </div>
            <div className="hx-inspector" aria-live="polite">
              <div>
                <h2>{station.title}</h2>
                <p>{station.description}</p>
              </div>
              <Link href={`/projects/${station.slug}/`} prefetch={false}>
                Enter {station.project}
                <ArrowUpRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
