"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUpRight, Asterisk, CheckCheck, Copy, Send } from "lucide-react";
import { profile } from "@/data/profile";
import { SectionLabel, Reveal } from "./ui";
export default function Contact() {
  const githubUrl = profile.socials.find(
    (social) => social.name === "GitHub",
  )?.url;
  const [copied, setCopied] = useState(false);
  const [profileCopied, setProfileCopied] = useState(false);
  const [status, setStatus] = useState("");
  const [draftUrl, setDraftUrl] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  async function copy() {
    if (!profile.email) return;
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2500);
    } catch {
      setStatus(
        "Clipboard is unavailable. Select and copy the email address manually.",
      );
    }
  }
  async function copyProfile() {
    if (!githubUrl) return;
    try {
      await navigator.clipboard.writeText(githubUrl);
      setProfileCopied(true);
      setStatus("GitHub profile copied.");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setProfileCopied(false), 2500);
    } catch {
      setStatus(
        "Clipboard is unavailable. Copy the GitHub profile link manually.",
      );
    }
  }
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPreparing(true);
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name")).trim(),
      email = String(data.get("email")).trim(),
      message = String(data.get("message")).trim();
    if (!name || !message) {
      setStatus("Please add your name and a message.");
      setPreparing(false);
      return;
    }
    const subject = `Portfolio inquiry from ${name}`.replace(/[\r\n]/g, " ");
    const body = `${message}\n\nFrom: ${name}\nReply to: ${email}`;
    try {
      if (profile.email) {
        setDraftUrl(
          `mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
        );
        setStatus(
          "Draft ready. Open it in your email app, review and send; nothing was sent by this site.",
        );
      } else {
        const blob = new Blob(
          [
            `Subject: ${subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${body}`,
          ],
          { type: "message/rfc822" },
        );
        const url = URL.createObjectURL(blob),
          link = document.createElement("a");
        link.href = url;
        link.download = "portfolio-message.eml";
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        setStatus(
          "Email draft downloaded. No recipient is configured and nothing was sent. This is a local draft.",
        );
      }
    } catch {
      setStatus(
        "The draft could not be prepared. Please try again or use the email address directly.",
      );
    } finally {
      setPreparing(false);
    }
  }
  return (
    <section id="contact" className="contact-section section-pad">
      <div className="container">
        <SectionLabel number="07">GOOD THINGS START WITH A HELLO</SectionLabel>
        <div className="contact-grid">
          <Reveal>
            <h2>
              Have something
              <br />
              in <em>mind?</em>
              <Asterisk className="contact-star" size={62} strokeWidth={1.4} />
            </h2>
            <p>
              An idea, an opportunity, or just a good conversation.
              <br />
              Let’s see what we can make happen.
            </p>
            <div className="email-line">
              {profile.email ? (
                <a href={`mailto:${profile.email}`}>
                  {profile.email}
                  <ArrowUpRight size={21} />
                </a>
              ) : (
                <span>
                  Email not shared
                  <ArrowUpRight size={21} />
                </span>
              )}
              <button
                className="icon-button"
                onClick={copy}
                disabled={!profile.email}
                aria-label={copied ? "Email copied" : "Copy email address"}
              >
                {copied ? <CheckCheck size={19} /> : <Copy size={19} />}
              </button>
            </div>
            <div className="contact-socials">
              <button
                className="copy-profile"
                type="button"
                onClick={copyProfile}
                disabled={!githubUrl}
              >
                {profileCopied ? <CheckCheck size={13} /> : <Copy size={13} />}{" "}
                {profileCopied ? "Profile copied" : "Copy GitHub profile"}
              </button>
              {profile.socials.map((s) =>
                s.url ? (
                  <a
                    key={s.name}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {s.name}
                    <ArrowUpRight size={15} />
                  </a>
                ) : (
                  <span key={s.name}>
                    {s.name} <span className="mono">/ ADD LINK</span>
                  </span>
                ),
              )}
            </div>
          </Reveal>
          <form
            className="contact-form"
            onSubmit={submit}
            onChange={() => {
              setDraftUrl(null);
              setStatus("");
            }}
          >
            <h3>A local message pad.</h3>
            <div className="form-row">
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
                rows={3}
                maxLength={5000}
                required
              />
            </label>
            <div className="form-submit">
              <span>
                {profile.email
                  ? "Prepares a draft. You open and send it."
                  : "Saved on your device. Nothing is submitted."}
              </span>
              <button
                className="button button-dark"
                type="submit"
                disabled={preparing}
              >
                {preparing ? "Preparing…" : "Prepare email draft"}
                <Send size={16} />
              </button>
            </div>
            <p className="form-status" role="status" aria-live="polite">
              {status || (copied ? "Email address copied." : "")}
            </p>
            {draftUrl && (
              <a className="button button-dark" href={draftUrl}>
                Open email draft <ArrowUpRight size={16} />
              </a>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
