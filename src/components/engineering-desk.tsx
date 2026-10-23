"use client";
import { useState } from "react";
import { ArrowDown, ArrowUpRight, Github } from "lucide-react";
import { profile } from "@/data/profile";
import { projects } from "@/data/projects";
import LensExplorer from "./lens/lens-explorer";
import { stations, type DeskMode } from "./desk-data";

export type { DeskMode };

/** Professional hero: copy on the left, the project visualisation (three lenses) on the right. */
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
          <LensExplorer mode={mode} onModeChange={setMode} />
        </div>
      </div>
    </section>
  );
}
