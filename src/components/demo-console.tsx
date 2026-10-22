"use client";
import { useRef, useState } from "react";
import {
  ArrowUpRight,
  Check,
  Copy,
  ExternalLink,
  Play,
  Terminal,
  X,
} from "lucide-react";
import type { Project } from "@/data/projects";
export function demoLabel(project: Project) {
  return project.demo.type === "embedded"
    ? "Original application"
    : project.demo.type === "simulation"
      ? "Interactive simulation"
      : project.demo.type === "local"
        ? "Run locally"
        : "Demo unavailable";
}
export default function DemoConsole({ project }: { project: Project }) {
  const [embedded, setEmbedded] = useState(false),
    [copied, setCopied] = useState(false),
    [copyError, setCopyError] = useState(false);
  const details = useRef<HTMLDetailsElement>(null);
  async function copy() {
    try {
      await navigator.clipboard.writeText(project.demo.commands.join("\n"));
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  }
  return (
    <section
      id="world-demo"
      className="demo-console"
      aria-labelledby="demo-title"
    >
      <div className="demo-console-heading">
        <div>
          <span className="eyebrow">
            EXECUTION BAY / {project.demo.verifiedOn}
          </span>
          <h2 id="demo-title">
            Experience the <em>project.</em>
          </h2>
        </div>
        <span className={`demo-type demo-type-${project.demo.type}`}>
          {demoLabel(project)}
        </span>
      </div>
      <p className="demo-summary">{project.demo.summary}</p>
      <div className="demo-actions">
        {project.demo.type === "embedded" && project.demo.url && (
          <>
            <a
              href={project.demo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="button button-lime"
            >
              Launch original app <ExternalLink size={16} />
            </a>
            <button
              className="button button-outline"
              onClick={() => setEmbedded(!embedded)}
            >
              {embedded ? <X size={16} /> : <Play size={16} />}{" "}
              {embedded ? "Close embedded app" : "Load original app here"}
            </button>
          </>
        )}
        {project.demo.type === "simulation" && (
          <a className="button button-lime" href="#world-playground">
            Try interactive explorer <ArrowUpRight size={16} />
          </a>
        )}
        {project.architecture.nodes.length > 0 && (
          <a href="#world-architecture" className="button button-outline">
            Inspect architecture <ArrowUpRight size={16} />
          </a>
        )}
        {project.githubUrl && (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="button button-outline"
          >
            View source <ExternalLink size={16} />
          </a>
        )}
        {project.demo.commands.length > 0 && (
          <button
            className="button button-outline"
            onClick={() => {
              if (details.current) {
                details.current.open = true;
                details.current.scrollIntoView({ block: "center" });
                details.current.querySelector("summary")?.focus();
              }
            }}
          >
            <Terminal size={16} /> Run locally
          </button>
        )}
      </div>
      {embedded && project.demo.url && (
        <div className="embedded-original">
          <div className="mono">
            ORIGINAL PUBLIC APPLICATION / SAME-SITE EMBED
          </div>
          <div
            className="embedded-scroll"
            tabIndex={0}
            role="region"
            aria-label="Original app — scroll horizontally on small screens"
          >
            <iframe
              title={`${project.title} original application`}
              src={project.demo.url}
              sandbox="allow-scripts allow-same-origin"
              loading="lazy"
            />
          </div>
          <p>
            This original desktop interface scrolls horizontally on small
            screens. Open it in a new tab for more room. Portfolio navigation
            remains outside this frame.
          </p>
        </div>
      )}
      <div className="execution-status">
        <div>
          <span className="mono">RUNTIME CHECK</span>
          <p>{project.demo.runtimeStatus}</p>
        </div>
        <div>
          <span className="mono">TEST CHECK</span>
          <p>{project.demo.testStatus}</p>
        </div>
      </div>
      <details ref={details} className="local-guide">
        <summary>
          <Terminal size={17} /> Local setup & verification notes
        </summary>
        {project.demo.commands.length > 0 ? (
          <div className="command-block">
            <div>
              <span className="mono">REPOSITORY COMMANDS</span>
              <button onClick={copy} aria-label="Copy local startup commands">
                {copied ? <Check size={14} /> : <Copy size={14} />}{" "}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre>
              <code>{project.demo.commands.join("\n")}</code>
            </pre>
          </div>
        ) : (
          <p>
            No verified original startup command is available for this entry.
            Any available component guide runs entirely in this website.
          </p>
        )}
        {copyError && (
          <p role="status">
            Clipboard unavailable. Select and copy the commands above.
          </p>
        )}
        {!!project.demo.environment.length && (
          <div className="env-instructions">
            <h3>Configuration</h3>
            <dl>
              {project.demo.environment.map((variable) => (
                <div key={variable.name}>
                  <dt>
                    <code>{variable.name}</code>
                  </dt>
                  <dd>{variable.purpose}</dd>
                </div>
              ))}
            </dl>
            <p>
              Set configuration in your local environment. Keep credentials out
              of browser code and Git.
            </p>
          </div>
        )}
        {!!project.demo.notes.length && (
          <ul>
            {project.demo.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        )}
      </details>
    </section>
  );
}
