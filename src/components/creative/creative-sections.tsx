"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Asterisk, Sparkles } from "lucide-react";
import { skills } from "@/data/skills";
import { profile } from "@/data/profile";
import { CreativeContact } from "./creative-contact";

const statusKey = (status: string) =>
  status === "Used in a project"
    ? "used"
    : status === "Currently learning"
      ? "learning"
      : "exploring";

/** Skills as a sticker sheet. Same data, same selection behaviour, same honest status labels. */
export function CreativeToolkit() {
  const [selected, setSelected] = useState(0);
  const current = skills[selected];
  const groups = Array.from(new Set(skills.map((skill) => skill.group)));
  return (
    <section id="skills" className="c-section c-toolkit">
      <div className="container">
        <header className="c-section-head">
          <p className="c-kicker mono">
            <span className="c-pill c-pill-sky">02</span> Curious mind / growing
            toolkit
          </p>
          <h2>
            A growing <em>sticker sheet.</em>
          </h2>
          <p className="c-section-lede">
            Tools make more sense in context. Pick one to see where it lives.
          </p>
        </header>
        <div className="c-toolkit-grid">
          <div className="c-sheet-board">
            {groups.map((group) => (
              <div key={group} className="c-sheet-group">
                <h3 className="mono">{group.toUpperCase()}</h3>
                <div className="c-stickers">
                  {skills.map(
                    (skill, i) =>
                      skill.group === group && (
                        <button
                          key={skill.name}
                          type="button"
                          className="c-skill"
                          data-status={statusKey(skill.status)}
                          style={
                            {
                              "--tilt": `${((i * 29) % 5) - 2}deg`,
                            } as React.CSSProperties
                          }
                          aria-pressed={selected === i}
                          onClick={() => setSelected(i)}
                        >
                          {skill.name}
                        </button>
                      ),
                  )}
                </div>
              </div>
            ))}
          </div>
          <aside className="c-ticket" aria-live="polite">
            <span className="c-ticket-hole" aria-hidden="true" />
            <span className="mono c-ticket-label">IN THE TOOLKIT</span>
            <h3>{current.name}</h3>
            <span className="c-badge" data-status={statusKey(current.status)}>
              {current.status}
            </span>
            <p>{current.explanation}</p>
            {current.projectSlug ? (
              <Link
                className="c-btn c-btn-ink"
                href={`/projects/${current.projectSlug}`}
                prefetch={false}
              >
                See it in a project
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            ) : (
              <a className="c-btn c-btn-ink" href="#projects">
                Explore the portfolio
                <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            )}
            <ul className="c-legend">
              <li data-status="used">Used in a project</li>
              <li data-status="learning">Currently learning · ongoing study</li>
              <li data-status="exploring">
                Exploring · an interest, not a proficiency claim
              </li>
            </ul>
          </aside>
        </div>
      </div>
    </section>
  );
}

/** About: a notebook page with sticky notes, in place of the Professional two-column copy block. */
export function CreativeAbout() {
  return (
    <section id="about" className="c-section c-about">
      <div className="container c-about-grid">
        <div className="c-notebook" aria-hidden="true">
          <span className="c-tape c-tape-a" />
          <p className="c-notebook-hand">
            hello
            <br />
            there.
          </p>
          <Asterisk className="c-notebook-star" size={64} strokeWidth={1.6} />
          <p className="c-notebook-foot mono">
            logic + curiosity → something useful
          </p>
        </div>
        <div className="c-about-copy">
          <p className="c-kicker mono">
            <span className="c-pill c-pill-lime">03</span> The person behind the
            code
          </p>
          <h2>
            More than a <em>semicolon.</em>
          </h2>
          <p className="c-about-lead">Part problem solver. Always a student.</p>
          <p>{profile.about}</p>
          <div className="c-notes">
            <div className="c-sticky c-sticky-butter">
              <span className="mono">THE FOUNDATION</span>
              <p>B.Tech · Computer Science and Engineering.</p>
            </div>
            <div className="c-sticky c-sticky-sky">
              <span className="mono">CURRENTLY EXPLORING</span>
              <p>{profile.focus}</p>
            </div>
          </div>
          <ul className="c-interests">
            {profile.interests.map((interest) => (
              <li key={interest}>
                <Sparkles size={13} aria-hidden="true" />
                {interest}
              </li>
            ))}
          </ul>
          <a className="c-link" href="#chapters">
            Explore the chapters <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}

export { CreativeContact };
