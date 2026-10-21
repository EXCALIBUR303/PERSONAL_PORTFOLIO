import Link from "next/link";
import { ArrowUpRight, GraduationCap, Route, Flag } from "lucide-react";
import { education } from "@/data/education";
import { experience } from "@/data/experience";
import { milestones } from "@/data/milestones";
import { Reveal, SectionLabel } from "./ui";
export default function Chapters() {
  return (
    <section id="chapters" className="chapters-section section-pad">
      <div className="container">
        <SectionLabel number="05">
          THE CHAPTERS / LEARNING OUT LOUD
        </SectionLabel>
        <Reveal className="section-heading">
          <h2>
            Still learning.
            <br />
            Always <em>connecting.</em>
          </h2>
          <p>
            The academic foundation, independent work,
            <br />
            and implementation highlights along the way.
          </p>
        </Reveal>
        <div className="chapter-grid">
          <div id="education" className="chapter-card">
            <GraduationCap size={28} />
            <span className="mono">CHAPTER 01</span>
            <h3>Education</h3>
            <details open>
              <summary>
                {education.degree} · {education.specialization}
              </summary>
              <dl>
                <dt>University</dt>
                <dd>{education.university || "Not provided yet"}</dd>
                <dt>Year / semester</dt>
                <dd>{education.academicYear || "Not provided yet"}</dd>
                <dt>Academic dates</dt>
                <dd>{education.period || "Not provided yet"}</dd>
              </dl>
              <p>
                {education.coursework.length
                  ? education.coursework.join(" · ")
                  : "Coursework, workshops, and academic activities can be added once confirmed."}
              </p>
            </details>
            <div className="chapter-tags">
              {education.interests.map((interest) => (
                <span key={interest}>{interest}</span>
              ))}
            </div>
          </div>
          <div id="experience" className="chapter-card">
            <Route size={28} />
            <span className="mono">CHAPTER 02</span>
            <h3>Experience</h3>
            {experience.map((item) => (
              <details key={item.role} open>
                <summary>{item.role}</summary>
                <span className="chapter-type">
                  {item.type} / {item.period || "Dates not provided"}
                </span>
                <b>{item.organization}</b>
                {item.responsibilities.map((text) => (
                  <p key={text}>{text}</p>
                ))}
                {item.outcomes.map((text) => (
                  <p key={text}>{text}</p>
                ))}
                <Link href={`/projects/${item.projectSlug}`} prefetch={false}>
                  Explore related work
                  <ArrowUpRight size={13} />
                </Link>
              </details>
            ))}
          </div>
          <div id="milestones" className="chapter-card">
            <Flag size={28} />
            <span className="mono">CHAPTER 03</span>
            <h3>Milestones</h3>
            <p className="milestone-disclaimer">
              Source-backed highlights. Dates and awards have not been supplied.
            </p>
            {milestones.map((item) => (
              <details key={item.title}>
                <summary>{item.title}</summary>
                <span className="chapter-type">
                  {item.type} / {item.date || "Date not provided"}
                </span>
                <p>{item.description}</p>
                <Link href={`/projects/${item.projectSlug}`} prefetch={false}>
                  Inspect the project
                  <ArrowUpRight size={13} />
                </Link>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
