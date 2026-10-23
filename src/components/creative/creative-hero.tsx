"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Star } from "lucide-react";
import { profile } from "@/data/profile";
import HeroStage from "../hero-stage";
import { stations, type DeskMode } from "../desk-data";

/**
 * Creative hero: an asymmetric desk. The headline runs large on the left, the
 * intro sits on a sticky note, and the same 3D scene is pinned to a board on
 * the right with its lenses as stickers. Same copy and same scene as the
 * Professional hero, laid out differently.
 */
export default function CreativeHero() {
  const [mode, setMode] = useState<DeskMode>("systems");
  const station = stations.find((item) => item.id === mode)!;
  return (
    <section
      className="c-hero"
      aria-labelledby="hero-title"
      style={{ "--station-accent": station.accent } as React.CSSProperties}
    >
      <span className="c-blob c-blob-lime" aria-hidden="true" />
      <span className="c-blob c-blob-pink" aria-hidden="true" />
      <div className="container c-hero-grid">
        <div className="c-hero-copy">
          <p className="c-kicker mono">
            <span className="c-pill">Hello, desk!</span>
            {profile.name} · B.Tech CSE
          </p>
          <h1 id="hero-title" tabIndex={-1}>
            Hi, I&apos;m Sidharth. <br className="c-br" />I build{" "}
            <em className="c-mark">intelligent systems</em>, and make them{" "}
            <em className="c-scribble">
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
          <div className="c-note">
            <span className="c-tape" aria-hidden="true" />
            <p>{profile.introduction}</p>
          </div>
          <div className="c-hero-actions">
            <a href="#projects" className="c-btn c-btn-ink">
              Explore my work <ArrowDown size={17} aria-hidden="true" />
            </a>
            <a href="#about" className="c-btn c-btn-paper">
              About me <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </div>
          <span className="c-sticker c-sticker-star" aria-hidden="true">
            <Star size={15} fill="currentColor" /> open source
          </span>
        </div>
        <div className="c-hero-board">
          <p className="c-scrawl" aria-hidden="true">
            pick a lens, spin the model
            <svg viewBox="0 0 120 70" fill="none" stroke="currentColor">
              <path d="M6 8 C 30 6, 80 14, 104 54" />
              <path d="M92 48 L105 57 L108 41" />
            </svg>
          </p>
          <div className="c-frame">
            <span className="c-tape c-tape-a" aria-hidden="true" />
            <span className="c-tape c-tape-b" aria-hidden="true" />
            <HeroStage mode={mode} variant="creative" />
          </div>
          <div
            className="c-lenses"
            role="group"
            aria-label="Engineering desk discipline"
          >
            {stations.map((item) => (
              <button
                key={item.id}
                aria-pressed={mode === item.id}
                onClick={() => setMode(item.id)}
                style={{ "--lens-accent": item.accent } as React.CSSProperties}
              >
                <item.icon size={16} aria-hidden="true" />
                {item.label}
              </button>
            ))}
          </div>
          <div className="hx-inspector c-caption" aria-live="polite">
            <div>
              <h2>{station.title}</h2>
              <p>{station.description}</p>
            </div>
            <Link href={`/projects/${station.slug}/`} prefetch={false}>
              Enter {station.project}
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
