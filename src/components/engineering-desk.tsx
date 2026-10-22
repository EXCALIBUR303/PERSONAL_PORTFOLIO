"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  Cpu,
  Network,
  Orbit,
  Github,
  Crosshair,
} from "lucide-react";
import { profile } from "@/data/profile";
import HeroArt from "./hero-art";
export type DeskMode = "systems" | "algorithms" | "computation";
const stations = [
  {
    id: "systems" as const,
    label: "01 / Systems",
    title: "Make the pieces work together.",
    description: "Interfaces, databases, and the rules that connect them.",
    slug: "smart-parking-dbms",
    project: "Smart Parking DBMS",
    icon: Network,
    accent: "#f2a35e",
  },
  {
    id: "algorithms" as const,
    label: "02 / Algorithms",
    title: "Give the question a path.",
    description: "Step inside graph search. Follow every decision.",
    slug: "mazera-ai-maze-solver",
    project: "Mazera AI Maze Solver",
    icon: Orbit,
    accent: "#71d8e5",
  },
  {
    id: "computation" as const,
    label: "03 / Intelligence",
    title: "Look beneath the prediction.",
    description: "Data, models, and the boundaries of what they tell us.",
    slug: "predictive-maintenance",
    project: "Predictive Maintenance",
    icon: Cpu,
    accent: "#b29af0",
  },
];
export default function EngineeringDesk() {
  const [mode, setMode] = useState<DeskMode>("systems");
  const station = stations.find((item) => item.id === mode)!;
  return (
    <section
      className="engineering-hero"
      aria-labelledby="hero-title"
      style={{ "--station-accent": station.accent } as React.CSSProperties}
    >
      <div className="container">
        <div className="desk-topline mono">
          <span>
            <i className="status-dot" /> SIDHARTH SOOD / INDEPENDENT EXPLORATION
            + ACADEMIC WORK
          </span>
          <span>FIELD NOTES — VOL. 03</span>
        </div>
        <div className="desk-introduction">
          <div>
            <p className="eyebrow">
              HELLO, WORLD. I’M {profile.name.toUpperCase()}.
            </p>
            <h1 id="hero-title" tabIndex={-1}>
              <span>I build</span> things<span className="hero-period">.</span>
              <br />
              <em>And ask why.</em>
            </h1>
          </div>
          <div className="desk-intro-aside">
            <span className="degree-chip">
              B.TECH / COMPUTER SCIENCE & ENGINEERING
            </span>
            <p>{profile.introduction}</p>
            <div className="hero-buttons">
              <a href="#projects" className="button button-lime">
                Explore my work <ArrowDown size={17} />
              </a>
              <a href="#about" className="hero-contact">
                About me <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
        </div>
        <div className="engineering-desk">
          <div className="desk-rail">
            <span className="mono">CHOOSE A LENS</span>
            <div
              className="desk-mode-controls"
              role="group"
              aria-label="Engineering desk discipline"
            >
              {stations.map((item) => (
                <button
                  key={item.id}
                  aria-pressed={mode === item.id}
                  onClick={() => setMode(item.id)}
                >
                  <item.icon size={19} />
                  <span>{item.label}</span>
                  <ArrowUpRight size={14} />
                </button>
              ))}
            </div>
            <div className="desk-rail-note">
              <Crosshair size={25} />
              <p>
                Ideas become clearer
                <br />
                when you can explore them.
              </p>
            </div>
          </div>
          <div className="desk-scene">
            <HeroArt mode={mode} />
            <span className="desk-axis mono" aria-hidden="true">
              X / BUILD &nbsp; Y / TEST &nbsp; Z / UNDERSTAND
            </span>
          </div>
          <div className="desk-inspector" aria-live="polite">
            <span className="eyebrow">ON THE WORKBENCH</span>
            <span className="desk-inspector-index mono">
              {stations.indexOf(station) + 1} / 3
            </span>
            <h2>{station.title}</h2>
            <p>{station.description}</p>
            <Link href={`/projects/${station.slug}/`} prefetch={false}>
              Enter {station.project}
              <ArrowUpRight size={19} />
            </Link>
            <span className="desk-metaphor mono">
              SPATIAL STUDY / SELECT A LENS TO EXPLORE
            </span>
          </div>
        </div>
        <div className="desk-footer mono">
          <span>
            SCROLL TO THE PROJECT COLLECTIONS <ArrowDown size={12} />
          </span>
          <a
            href={
              profile.socials.find((s) => s.name === "GitHub")?.url ||
              "#projects"
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github size={14} /> EXCALIBUR303 <ArrowUpRight size={12} />
          </a>
          <span>SOFTWARE, SYSTEMS & A LITTLE CURIOSITY.</span>
        </div>
      </div>
    </section>
  );
}
