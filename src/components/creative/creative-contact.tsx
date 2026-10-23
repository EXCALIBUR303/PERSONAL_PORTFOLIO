"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  CheckCheck,
  Copy,
  CornerDownLeft,
  RotateCcw,
  TerminalSquare,
} from "lucide-react";
import { profile } from "@/data/profile";
import { composeDraft, isEmail, useContactDraft } from "../contact";

type Step = "topic" | "name" | "email" | "message" | "review";
type Line = { who: "bot" | "you"; text: string };

const topics = [
  "Just saying hi",
  "A project idea",
  "An opportunity",
  "Collaboration",
];
const prompts: Record<Exclude<Step, "review">, string> = {
  topic: "Hi! What brings you by?",
  name: "Nice. What should I call you?",
  email: "And where can I reply? (an email address)",
  message: "What would you like to say?",
};

/**
 * Creative contact: a small guided terminal. It is a way to write a message,
 * never a requirement: the email button above it works on its own. At the end
 * it only prepares an email draft that the visitor opens and sends; this site
 * has no mail service and says so.
 */
export function CreativeContact() {
  const { copied, copy, githubUrl, profileCopied, copyProfile } =
    useContactDraft();
  const [step, setStep] = useState<Step>("topic");
  const [lines, setLines] = useState<Line[]>([
    { who: "bot", text: prompts.topic },
  ]);
  const [topic, setTopic] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [msgCopied, setMsgCopied] = useState(false);
  const field = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (step !== "topic") field.current?.focus({ preventScroll: true });
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [step, lines]);

  const say = (...next: Line[]) => setLines((current) => [...current, ...next]);
  const draft =
    step === "review" ? composeDraft({ name, email, message, topic }) : null;

  function chooseTopic(choice: string) {
    setTopic(choice);
    say({ who: "you", text: choice }, { who: "bot", text: prompts.name });
    setStep("name");
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    const text = value.trim();
    if (step === "name") {
      if (!text) return setError("Please type a name.");
      setName(text);
      say({ who: "you", text }, { who: "bot", text: prompts.email });
      setStep("email");
    } else if (step === "email") {
      if (!isEmail(text))
        return setError("That does not look like an email address.");
      setEmail(text);
      say({ who: "you", text }, { who: "bot", text: prompts.message });
      setStep("message");
    } else if (step === "message") {
      if (!text) return setError("Please write a few words.");
      setMessage(text);
      say(
        {
          who: "you",
          text: text.length > 140 ? `${text.slice(0, 140)}…` : text,
        },
        {
          who: "bot",
          text: "Draft ready. Nothing has been sent: your email app opens with this message and you press send there.",
        },
      );
      setStep("review");
    }
    setValue("");
    setError("");
  }
  function restart() {
    setStep("topic");
    setLines([{ who: "bot", text: prompts.topic }]);
    setTopic("");
    setName("");
    setEmail("");
    setMessage("");
    setValue("");
    setError("");
    setMsgCopied(false);
  }
  async function copyMessage() {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(`${draft.subject}\n\n${draft.body}`);
      setMsgCopied(true);
    } catch {
      setError(
        "Clipboard is unavailable. Select the text and copy it by hand.",
      );
    }
  }

  return (
    <section id="contact" className="c-section c-contact">
      <div className="container c-contact-grid">
        <div className="c-contact-copy">
          <p className="c-kicker mono">
            <span className="c-pill c-pill-orange">05</span> Good things start
            with a hello
          </p>
          <h2>
            Have something in <em>mind?</em>
          </h2>
          <p className="c-section-lede">
            An idea, an opportunity, or just a good conversation. The quickest
            way is a plain email, no terminal needed.
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

        <div className="c-term" role="group" aria-label="Guided message writer">
          <div className="c-term-bar" aria-hidden="true">
            <i />
            <i />
            <i />
            <span className="mono">
              <TerminalSquare size={13} /> ~/studio/say-hello
            </span>
          </div>
          <div className="c-term-log" ref={log} role="log" aria-live="polite">
            {lines.map((line, i) => (
              <p key={i} data-who={line.who}>
                <span aria-hidden="true">
                  {line.who === "bot" ? "sid" : "you"}
                </span>
                {line.text}
              </p>
            ))}
          </div>
          {step === "topic" && (
            <div className="c-term-choices" role="group" aria-label="Topic">
              {topics.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  onClick={() => chooseTopic(choice)}
                >
                  {choice}
                </button>
              ))}
            </div>
          )}
          {(step === "name" || step === "email" || step === "message") && (
            <form className="c-term-form" onSubmit={submit} noValidate>
              <label htmlFor="term-input">
                <span className="sr-only">{prompts[step]}</span>
                <span aria-hidden="true" className="c-term-prompt mono">
                  {step}&gt;
                </span>
              </label>
              {step === "message" ? (
                <textarea
                  id="term-input"
                  ref={field}
                  value={value}
                  rows={4}
                  maxLength={5000}
                  placeholder="Tell me a little about it…"
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                      e.currentTarget.form?.requestSubmit();
                  }}
                />
              ) : (
                <input
                  id="term-input"
                  ref={field}
                  value={value}
                  type={step === "email" ? "email" : "text"}
                  autoComplete={step === "email" ? "email" : "name"}
                  maxLength={step === "email" ? 254 : 100}
                  placeholder={
                    step === "email" ? "you@example.com" : "Your name"
                  }
                  onChange={(e) => setValue(e.target.value)}
                />
              )}
              <button type="submit" className="c-btn c-btn-ink">
                Enter <CornerDownLeft size={15} aria-hidden="true" />
              </button>
            </form>
          )}
          {error && (
            <p className="c-term-error" role="alert">
              {error}
            </p>
          )}
          {step === "review" && draft && (
            <div className="c-term-review">
              <pre>{`To: ${profile.email ?? "(email not shared)"}\nSubject: ${draft.subject}\n\n${draft.body}`}</pre>
              <div className="c-term-actions">
                {draft.url && (
                  <a className="c-btn c-btn-lime" href={draft.url}>
                    Open in my email app{" "}
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </a>
                )}
                <button
                  type="button"
                  className="c-btn c-btn-paper"
                  onClick={copyMessage}
                >
                  {msgCopied ? <CheckCheck size={15} /> : <Copy size={15} />}
                  {msgCopied ? "Copied" : "Copy message"}
                </button>
              </div>
            </div>
          )}
          {step !== "topic" && (
            <button
              type="button"
              className="c-link-btn c-term-reset"
              onClick={restart}
            >
              <RotateCcw size={13} aria-hidden="true" /> Start over
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
