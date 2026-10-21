"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Orbit } from "lucide-react";
import { skills } from "@/data/skills";
import { Reveal, SectionLabel } from "./ui";
export default function GrowingToolkit() {
  const [selected, setSelected] = useState(0);
  const current = skills[selected];
  const groups = Array.from(new Set(skills.map((skill) => skill.group)));
  return (
    <section id="skills" className="skills-section section-pad">
      <div className="container">
        <SectionLabel number="02">CURIOUS MIND / GROWING TOOLKIT</SectionLabel>
        <Reveal className="section-heading">
          <h2>
            A growing
            <br />
            <em>constellation.</em>
          </h2>
          <p>
            Tools make more sense in context.
            <br />
            Pick one to see where it lives.
          </p>
        </Reveal>
        <div className="toolkit-layout">
          <div className="skill-map">
            <div className="skill-orbit orbit-a" aria-hidden="true" />
            <div className="skill-orbit orbit-b" aria-hidden="true" />
            <div className="skill-map-center" aria-hidden="true">
              <Orbit size={26} />
              <span>
                STAY
                <br />
                CURIOUS.
              </span>
            </div>
            {groups.map((group) => (
              <div key={group} className="skill-cluster">
                <span className="mono">{group.toUpperCase()}</span>
                <div>
                  {skills.map(
                    (skill, i) =>
                      skill.group === group && (
                        <button
                          key={skill.name}
                          onClick={() => setSelected(i)}
                          aria-pressed={selected === i}
                        >
                          <i />
                          {skill.name}
                        </button>
                      ),
                  )}
                </div>
              </div>
            ))}
          </div>
          <aside className="skill-inspector" aria-live="polite">
            <span className="eyebrow">IN THE TOOLKIT</span>
            <h3>{current.name}</h3>
            <span className="skill-state">{current.status}</span>
            <p>{current.explanation}</p>
            {current.projectSlug ? (
              <Link href={`/projects/${current.projectSlug}`} prefetch={false}>
                See it in a project
                <ArrowUpRight size={16} />
              </Link>
            ) : (
              <a href="#projects">
                Explore the portfolio
                <ArrowUpRight size={16} />
              </a>
            )}
            <div className="skill-state-key">
              <span>
                <i />
                Used in a project
              </span>
              <span>Currently learning · ongoing study</span>
              <span>Exploring · an interest, not a proficiency claim</span>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
