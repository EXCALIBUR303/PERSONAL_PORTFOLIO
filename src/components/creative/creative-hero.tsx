"use client";
import { useRef } from "react";
import { useShiftIntro } from "../shift-intro";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { profile } from "@/data/profile";
import StudioMap from "./studio/studio-map";

/**
 * Creative home: an illustrated studio map. Every project is a station on one
 * of three districts; stations with an exhibit open it in place, and every
 * station has a link to its full project page. The map is not the only way in:
 * the same 20 projects are a searchable list and the board below.
 */
export default function CreativeHero() {
  const section = useRef<HTMLElement>(null);
  useShiftIntro(section, "creative", { onLoad: true });
  return (
    <section id="map" ref={section} className="c-hero" aria-labelledby="hero-title">
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
                <svg viewBox="0 0 220 16" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M3 10 C 22 2, 38 15, 60 8 S 98 3, 120 9 S 165 14, 217 5" />
                </svg>
              </em>
              .
            </h1>
          </div>
          <div className="c-note">
            <span className="c-tape" aria-hidden="true" />
            <svg className="c-doodle c-draw" viewBox="0 0 120 70" aria-hidden="true">
              <path d="M6 8 C 40 4, 80 18, 92 52" />
              <path d="M80 44 L 93 56 L 104 40" />
            </svg>
            <p>{profile.introduction}</p>
            <p className="c-note-how">
              Three districts, twenty stations. Select one for a preview, step into an exhibit, or switch to the list.
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
        <StudioMap />
      </div>
    </section>
  );
}
