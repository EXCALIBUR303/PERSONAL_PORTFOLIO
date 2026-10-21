"use client";
import { m, useReducedMotion, useScroll, useTransform } from "motion/react";
import {
  ArrowDown,
  ArrowUpRight,
  Asterisk,
  Github,
  Sparkles,
} from "lucide-react";
import { profile } from "@/data/profile";
import HeroArt from "./hero-art";
import ProjectGallery from "./project-gallery";
import GrowingToolkit from "./growing-toolkit";
import DimensionEngine from "./dimension-engine";
import Chapters from "./chapters";
import ColorLab from "./color-lab";
import Contact from "./contact";
import { Reveal, SectionLabel } from "./ui";
import type { CSSProperties } from "react";
export default function Portfolio() {
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -25]);
  const reduced = useReducedMotion();
  return (
    <main id="main" tabIndex={-1}>
      <section className="hero container" aria-labelledby="hero-title">
        <div className="hero-topline mono">
          <span>
            <i className="status-dot" />
            WELCOME TO MY CORNER OF THE MULTIVERSE
          </span>
          <span>DEVFOLIO / VOL. 02</span>
        </div>
        <div className="hero-layout">
          <m.div
            className="hero-copy"
            style={{ y: reduced ? 0 : heroY }}
            initial={false}
          >
            <p className="hero-intro mono">
              HELLO, I’M <span>{profile.name.toUpperCase()}</span>
              <span className="role-label">{profile.role}</span>
            </p>
            <h1 id="hero-title" tabIndex={-1}>
              {profile.headline[0]}
              <br />
              {profile.headline[1]}
              <br />
              <span>
                {profile.headline[2]}
                <svg viewBox="0 0 500 18" aria-hidden="true">
                  <path d="M3 11C130 1 320 1 496 10" />
                </svg>
              </span>
            </h1>
            <p className="hero-description">{profile.introduction}</p>
            <div className="hero-buttons">
              <a
                href="#projects"
                className="button button-lime magnetic-button"
              >
                Explore projects
                <ArrowUpRight size={19} />
              </a>
              <a href="#about" className="hero-contact">
                About me
                <ArrowUpRight size={18} />
              </a>
            </div>
            <div className="hero-socials">
              <a
                href="https://github.com/EXCALIBUR303"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github size={14} /> EXCALIBUR303
                <ArrowUpRight size={12} />
              </a>
              <a href="#engine">
                Inside the systems
                <ArrowUpRight size={12} />
              </a>
            </div>
          </m.div>
          <div className="hero-universe">
            <HeroArt />
            <span className="hero-orbit-label orbit-label-one mono">
              AI / INTELLIGENT SYSTEMS
            </span>
            <span className="hero-orbit-label orbit-label-two mono">
              ALGORITHMS / ENGINEERING
            </span>
          </div>
        </div>
        <div className="hero-bottom mono">
          <span>
            <i className="status-dot" />
            {profile.availability.toUpperCase()}
          </span>
          <a href="#projects">
            ENTER THE MULTIVERSE
            <ArrowDown size={14} />
          </a>
          <span>BUILT FROM QUESTIONS. CONNECTED BY CODE.</span>
        </div>
      </section>
      <div className="ticker" aria-hidden="true">
        <div>
          <span>CURIOUS BY NATURE</span>
          <Asterisk />
          <span>SYSTEMS WITH SUBSTANCE</span>
          <Asterisk />
          <span>IDEAS WORTH EXPLORING</span>
          <Asterisk />
          <span>CURIOUS BY NATURE</span>
          <Asterisk />
          <span>BUILD. TEST. UNDERSTAND.</span>
          <Asterisk />
        </div>
      </div>
      <ProjectGallery />
      <GrowingToolkit />
      <DimensionEngine />
      <section id="about" className="about-section section-pad">
        <div className="container">
          <SectionLabel number="04">THE PERSON BEHIND THE CODE</SectionLabel>
          <div className="about-grid">
            <Reveal className="about-visual">
              <span className="about-stamp mono">
                A LITTLE LEFT BRAIN.
                <br />A LITTLE RIGHT BRAIN.
              </span>
              <div className="about-flower" aria-hidden="true">
                {Array.from({ length: 8 }, (_, i) => (
                  <i key={i} style={{ "--petal": i } as CSSProperties} />
                ))}
                <span>
                  hello
                  <br />
                  there.
                </span>
              </div>
              <span className="about-visual-footer mono">
                LOGIC + CURIOSITY → SOMETHING USEFUL
              </span>
            </Reveal>
            <Reveal className="about-copy">
              <h2>
                More than
                <br />a <em>semicolon.</em>
              </h2>
              <p className="about-lead">
                Part problem solver.
                <br />
                Always a student.
              </p>
              <p>{profile.about}</p>
              <div className="about-facts">
                <div>
                  <span className="mono">THE FOUNDATION</span>
                  <p>B.Tech · Computer Science and Engineering.</p>
                </div>
                <div>
                  <span className="mono">CURRENTLY EXPLORING</span>
                  <p>{profile.focus}</p>
                </div>
              </div>
              <div className="interest-tags">
                {profile.interests.map((interest) => (
                  <span key={interest}>
                    <Sparkles size={12} />
                    {interest}
                  </span>
                ))}
              </div>
              <a className="about-chapters-link" href="#chapters">
                Explore the chapters
                <ArrowUpRight size={15} />
              </a>
            </Reveal>
          </div>
        </div>
      </section>
      <Chapters />
      <ColorLab />
      <Contact />
    </main>
  );
}
