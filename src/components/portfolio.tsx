"use client";
import { Sparkles } from "lucide-react";
import { profile } from "@/data/profile";
import EngineeringDesk from "./engineering-desk";
import ProjectGallery from "./project-gallery";
import GrowingToolkit from "./growing-toolkit";
import Contact from "./contact";
import Highlights from "./about-highlights";
import { Reveal, SectionLabel } from "./ui";
import type { CSSProperties } from "react";
import { useMode } from "./mode";
import CreativeHero from "./creative/creative-hero";
import CreativeGallery from "./creative/creative-gallery";
import {
  CreativeAbout,
  CreativeContact,
  CreativeToolkit,
} from "./creative/creative-sections";
export default function Portfolio() {
  const [mode] = useMode();
  if (mode === "creative") {
    return (
      <main id="main" tabIndex={-1} className="c-home">
        <CreativeHero />
        <CreativeGallery />
        <CreativeToolkit />
        <CreativeAbout />
        <CreativeContact />
      </main>
    );
  }
  return (
    <main id="main" tabIndex={-1}>
      <EngineeringDesk />
      <ProjectGallery />
      <GrowingToolkit />
      <section id="about" className="about-section section-pad">
        <div className="container">
          <SectionLabel number="03">THE PERSON BEHIND THE CODE</SectionLabel>
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
              <Highlights variant="pro" />
            </Reveal>
          </div>
        </div>
      </section>
      <Contact />
    </main>
  );
}
