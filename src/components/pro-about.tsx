"use client";
import Link from "next/link";
import { m, useReducedMotion } from "motion/react";
import { ArrowUpRight, Github, Linkedin } from "lucide-react";
import { profile } from "@/data/profile";
import { milestones } from "@/data/milestones";
import { projects } from "@/data/projects";
import { micro, motionTokens } from "./motion-config";
import { Reveal, SectionLabel } from "./ui";

/**
 * How the work is approached. These are working principles, not claims of
 * employment; each one is backed below by something in a project's source.
 */
const principles = [
  { title: "Understand the problem", text: "Define the inputs, constraints, and intended outcome." },
  { title: "Make the logic visible", text: "Design interfaces that help people understand what a system is doing." },
  { title: "Test the assumptions", text: "Evaluate behaviour and explain known limitations." },
  { title: "Improve through evidence", text: "Refine the implementation based on results rather than unsupported claims." },
];
/** Which principle each evidence row illustrates (index into `principles`). */
const shows: Record<string, number> = {
  "smart-parking-dbms": 0,
  "mazera-ai-maze-solver": 1,
  "predictive-maintenance": 2,
};

const icon: Record<string, typeof Github> = { GitHub: Github, LinkedIn: Linkedin };

/** Professional About: engineering approach and evidence, not a biography. */
export default function ProAbout() {
  const reduced = useReducedMotion();
  const links = profile.socials.filter((s) => s.url);
  return (
    <section id="about" className="about-section section-pad pa">
      <div className="container">
        <SectionLabel number="03">ENGINEERING APPROACH</SectionLabel>
        <Reveal className="pa-head">
          <h2>
            How I turn questions{" "}
            <br />
            into <em>systems.</em>
          </h2>
          <p>
            I&apos;m a B.Tech Computer Science and Engineering student interested in intelligent
            systems, algorithms, and software that makes complex ideas easier to explore. My
            projects range from algorithmic problem-solving and database systems to AI-driven
            experiments. I care not only about getting a system to work, but also about making its
            decisions understandable.
          </p>
        </Reveal>

        <m.ol
          className="pa-principles"
          aria-label="How I approach problems"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: reduced ? 0 : micro.enter.stagger } } }}
        >
          {principles.map((item, i) => (
            <m.li
              key={item.title}
              variants={{
                hidden: { y: micro.enter.y },
                show: { y: 0, transition: { duration: motionTokens.duration.reveal, ease: motionTokens.ease } },
              }}
            >
              <span className="pa-no mono" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </m.li>
          ))}
        </m.ol>

        <div id="highlights" className="pa-evidence">
          <h3 className="pa-sub">
            Evidence from my projects <span className="mono">{milestones.length}</span>
          </h3>
          <ul>
            {milestones.map((item) => {
              const project = projects.find((p) => p.slug === item.projectSlug)!;
              return (
                <li key={item.projectSlug}>
                  <span className="pa-shows mono">{principles[shows[item.projectSlug] ?? 0].title}</span>
                  <div className="pa-evidence-main">
                    <h4>{item.title}</h4>
                    <p>{item.description}</p>
                    <ul className="pa-tools" aria-label={`Tools in ${project.title}`}>
                      {project.stack.slice(0, 5).map((tool) => (
                        <li key={tool}>{tool}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="pa-evidence-links">
                    <Link href={`/projects/${project.slug}/`} prefetch={false}>
                      {project.title} <ArrowUpRight size={15} aria-hidden="true" />
                    </Link>
                    {project.githubUrl && (
                      <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                        Source <ArrowUpRight size={15} aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="pa-foot">
          <dl className="pa-facts">
            <div>
              <dt className="mono">Foundation</dt>
              <dd>B.Tech · Computer Science and Engineering.</dd>
            </div>
            <div>
              <dt className="mono">Currently exploring</dt>
              <dd>{profile.focus}</dd>
            </div>
          </dl>
          <div className="pa-proof">
            <span className="mono">Proof of work</span>
            <div>
              <a className="button button-lime" href="#projects">
                Try the demonstrations <ArrowUpRight size={16} aria-hidden="true" />
              </a>
              {links.map((s) => {
                const Icon = icon[s.name];
                return (
                  <a key={s.name} className="button button-outline" href={s.url!} target="_blank" rel="noopener noreferrer">
                    {Icon && <Icon size={16} aria-hidden="true" />} {s.name}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
