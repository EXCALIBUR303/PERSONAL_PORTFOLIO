"use client";
import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { ArrowUpRight, Shuffle, Sparkles } from "lucide-react";
import { profile } from "@/data/profile";
import { milestones } from "@/data/milestones";
import { claimClassNote, type ClaimClass } from "@/data/evidence";
import { projects } from "@/data/projects";
import { micro, motionTokens } from "../motion-config";

/** Questions the projects raised. Each one points at the project it came from. */
const questions = [
  { q: "How do you show a search thinking, instead of only reporting where it ended up?", slug: "mazera-ai-maze-solver" },
  { q: "What should a database refuse to let two people do at the same moment?", slug: "smart-parking-dbms" },
  { q: "How do you evaluate a model without fooling yourself with the test set?", slug: "predictive-maintenance" },
  { q: "Can a robot's chain from command to movement be explained one step at a time?", slug: "quadruped-rl" },
];
/** Builds that are not finished, with the honest status the project data gives them. */
const bench = ["aura", "aeris", "sigsmith"];
const tones = ["lime", "pink", "sky"] as const;
/**
 * Open questions, each taken from a limit the project documents (and the audit
 * checked). They are questions the work leaves open, not a list of plans.
 */
const openQuestions = [
  {
    q: "Can the robot dog's fast walk stay inside the foot-slip limit? The audit measured 0.37 against a limit of 0.25.",
    slug: "quadruped-rl",
  },
  {
    q: "What changes in the Private Local AI walkthrough when a real embedding model replaces the word-overlap stand-in?",
    slug: "private-local-ai",
  },
  {
    q: "Do SWARMMIND's learned policies keep their lead over the baselines when they are retrained? Re-running the committed actors is not the same as retraining them.",
    slug: "swarmmind",
  },
];
const claimOrder: ClaimClass[] = [
  "original logic",
  "adapted algorithm",
  "simplified simulation",
  "illustrative walkthrough",
  "design-stage",
  "link-out only",
];
const title = (slug: string) => projects.find((p) => p.slug === slug)!;

/**
 * Creative About: a developer's notebook. It is built from the same project
 * data as the rest of the site: questions the projects raised, builds still in
 * progress, and the lessons the source backs. It claims nothing beyond that.
 */
export default function CreativeAbout() {
  const reduced = useReducedMotion();
  const [n, setN] = useState(0);
  const current = questions[n];
  const source = title(current.slug);
  return (
    <section id="about" className="c-section c-about c-ab">
      <div className="container">
        <header className="c-section-head">
          <p className="c-kicker mono">
            <span className="c-pill c-pill-lime">03</span> From the notebook
          </p>
          <h2>
            The person behind{" "}
            <br />
            the <em>experiments.</em>
          </h2>
          <p className="c-section-lede">
            Questions the projects raised, builds still in progress and lessons I keep. {profile.about}
          </p>
        </header>

        <div className="c-ab-board">
          <article className="c-ab-page" aria-labelledby="ab-curious">
            <span className="c-tape c-tape-a" aria-hidden="true" />
            <h3 id="ab-curious" className="c-ab-hand">
              Things I&apos;m curious about
            </h3>
            <ul>
              {profile.interests.map((interest) => (
                <li key={interest}>
                  <Sparkles size={14} aria-hidden="true" />
                  {interest}
                </li>
              ))}
            </ul>
            <p className="c-ab-foot mono">B.Tech · Computer Science and Engineering</p>
          </article>

          <article className="c-ab-pull" aria-labelledby="ab-pull">
            <h3 id="ab-pull" className="mono">
              A question from the notebook
            </h3>
            <div className="c-ab-q" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                <m.blockquote
                  key={n}
                  initial={reduced ? false : { opacity: 0, rotate: -2, y: 10 }}
                  animate={{ opacity: 1, rotate: 0, y: 0 }}
                  exit={{ opacity: 0, rotate: 2, y: -8 }}
                  transition={{ duration: 0.22, ease: motionTokens.ease }}
                >
                  {current.q}
                  <footer>
                    <Link href={`/projects/${current.slug}/`} prefetch={false}>
                      Raised by {source.title} <ArrowUpRight size={14} aria-hidden="true" />
                    </Link>
                  </footer>
                </m.blockquote>
              </AnimatePresence>
            </div>
            <button type="button" className="c-btn c-btn-ink" onClick={() => setN((n + 1) % questions.length)}>
              <Shuffle size={15} aria-hidden="true" /> Another question
              <span className="sr-only">
                {" "}
                ({n + 1} of {questions.length})
              </span>
            </button>
          </article>

          <section className="c-ab-bench" aria-labelledby="ab-bench">
            <h3 id="ab-bench" className="c-ab-hand">
              On the bench
            </h3>
            <ul>
              {bench.map((slug, i) => {
                const p = title(slug);
                return (
                  <m.li
                    key={slug}
                    data-tone={tones[i % tones.length]}
                    style={{ "--r": `${[-1.6, 1.2, -0.8][i]}deg` } as React.CSSProperties}
                    whileHover={reduced ? undefined : { y: micro.lift, rotate: 0 }}
                    transition={micro.glide}
                  >
                    <Link href={`/projects/${slug}/`} prefetch={false}>
                      <span className="mono">{p.status}</span>
                      <strong>{p.title}</strong>
                      <em>{p.tagline}</em>
                    </Link>
                  </m.li>
                );
              })}
            </ul>
          </section>

          <section className="c-ab-next" aria-labelledby="ab-next">
            <h3 id="ab-next" className="c-ab-hand">
              Still open
            </h3>
            <p className="c-ab-small">
              Taken from each project&apos;s own documented limits, not from a wish list.
            </p>
            <ul>
              {openQuestions.map((item) => (
                <li key={item.slug}>
                  {item.q}{" "}
                  <Link href={`/projects/${item.slug}/`} prefetch={false}>
                    {title(item.slug).title} <ArrowUpRight size={13} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="c-ab-receipts" aria-labelledby="ab-receipts">
            <h3 id="ab-receipts" className="c-ab-hand">
              How to read my labels
            </h3>
            <p className="c-ab-small">Every project says what kind of thing you are looking at.</p>
            <dl>
              {claimOrder.map((claim) => (
                <div key={claim}>
                  <dt>
                    <strong className="evidence-chip">{claim}</strong>
                  </dt>
                  <dd>{claimClassNote[claim]}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="c-ab-lessons" aria-labelledby="ab-lessons">
            <h3 id="ab-lessons" className="c-ab-hand">
              Lessons I keep
            </h3>
            <ol>
              {milestones.map((item) => (
                <li key={item.projectSlug}>
                  <strong>{item.title}.</strong> {item.description}{" "}
                  <Link href={`/projects/${item.projectSlug}/`} prefetch={false}>
                    {title(item.projectSlug).title} <ArrowUpRight size={13} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </section>
  );
}
