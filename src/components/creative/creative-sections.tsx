"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Asterisk,
  CheckCheck,
  Copy,
  Send,
  Sparkles,
} from "lucide-react";
import { skills } from "@/data/skills";
import { profile } from "@/data/profile";
import { useContactDraft } from "../contact";

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
            <span className="c-pill c-pill-lime">04</span> The person behind the
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

/** Contact: a postcard. Uses the same draft logic as the Professional form; nothing is sent by this site. */
export function CreativeContact() {
  const {
    githubUrl,
    copied,
    copy,
    profileCopied,
    copyProfile,
    status,
    draftUrl,
    preparing,
    submit,
    onFormChange,
  } = useContactDraft();
  return (
    <section id="contact" className="c-section c-contact">
      <div className="container c-contact-grid">
        <div className="c-contact-copy">
          <p className="c-kicker mono">
            <span className="c-pill c-pill-orange">07</span> Good things start
            with a hello
          </p>
          <h2>
            Have something in <em>mind?</em>
          </h2>
          <p className="c-section-lede">
            An idea, an opportunity, or just a good conversation. Let’s see what
            we can make happen.
          </p>
          <div className="c-mailrow">
            {profile.email ? (
              <a className="c-btn c-btn-lime" href={`mailto:${profile.email}`}>
                {profile.email}
                <ArrowUpRight size={17} aria-hidden="true" />
              </a>
            ) : (
              <span className="c-btn c-btn-paper">Email not shared</span>
            )}
            <button
              type="button"
              className="c-icon-btn c-icon-btn-lg"
              onClick={copy}
              disabled={!profile.email}
              aria-label={copied ? "Email copied" : "Copy email address"}
            >
              {copied ? <CheckCheck size={19} /> : <Copy size={19} />}
            </button>
          </div>
          <div className="c-contact-links">
            <button
              className="c-chip c-chip-paper"
              type="button"
              onClick={copyProfile}
              disabled={!githubUrl}
            >
              {profileCopied ? <CheckCheck size={13} /> : <Copy size={13} />}
              {profileCopied ? "Profile copied" : "Copy GitHub profile"}
            </button>
            {profile.socials.map((s) =>
              s.url ? (
                <a
                  key={s.name}
                  className="c-chip c-chip-sky"
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {s.name}
                  <ArrowUpRight size={14} aria-hidden="true" />
                </a>
              ) : (
                <span key={s.name} className="c-chip c-chip-paper">
                  {s.name} / ADD LINK
                </span>
              ),
            )}
          </div>
        </div>
        <form className="c-postcard" onSubmit={submit} onChange={onFormChange}>
          <span className="c-stamp" aria-hidden="true">
            <Asterisk size={26} strokeWidth={2.4} />
          </span>
          <h3>A local message pad.</h3>
          <div className="c-postcard-row">
            <label>
              Your name
              <input
                name="name"
                autoComplete="name"
                placeholder="What should I call you?"
                maxLength={100}
                required
              />
            </label>
            <label>
              Your email
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="hello@yourworld.com"
                maxLength={254}
                required
              />
            </label>
          </div>
          <label>
            What’s on your mind?
            <textarea
              name="message"
              placeholder="Tell me a little about your idea…"
              rows={4}
              maxLength={5000}
              required
            />
          </label>
          <div className="c-postcard-foot">
            <span className="mono">
              {profile.email
                ? "Prepares a draft. You open and send it."
                : "Saved on your device. Nothing is submitted."}
            </span>
            <button
              className="c-btn c-btn-ink"
              type="submit"
              disabled={preparing}
            >
              {preparing ? "Preparing…" : "Prepare email draft"}
              <Send size={16} aria-hidden="true" />
            </button>
          </div>
          <p className="c-form-status" role="status" aria-live="polite">
            {status || (copied ? "Email address copied." : "")}
          </p>
          {draftUrl && (
            <a className="c-btn c-btn-lime" href={draftUrl}>
              Open email draft <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          )}
        </form>
      </div>
    </section>
  );
}
