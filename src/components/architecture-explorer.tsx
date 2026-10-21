"use client";
import { useId, useState } from "react";
import { ArrowUpRight, Network } from "lucide-react";
import type { Project } from "@/data/projects";
export default function ArchitectureExplorer({
  project,
  compact = false,
}: {
  project: Project;
  compact?: boolean;
}) {
  const markerId = useId().replaceAll(":", "");
  const [selected, setSelected] = useState(
    project.architecture.nodes[0]?.id || "",
  );
  const nodes = project.architecture.nodes,
    current = nodes.find((node) => node.id === selected) || nodes[0];
  const connected = new Set(
    project.architecture.edges.flatMap(([from, to]) =>
      from === selected ? [to] : to === selected ? [from] : [],
    ),
  );
  const cols = 3,
    rows = Math.ceil(nodes.length / cols),
    width = 780,
    height = rows * 130 + 30;
  const position = (index: number) => ({
    x: 130 + (index % cols) * 260,
    y: 65 + Math.floor(index / cols) * 130,
  });
  return (
    <div
      className={`architecture-explorer ${compact ? "architecture-compact" : ""}`}
      style={{ "--world-accent": project.accent } as React.CSSProperties}
    >
      <div className="architecture-toolbar">
        <span className="mono">
          <Network size={13} /> SELECT A COMPONENT TO FOLLOW ITS CONNECTIONS
        </span>
        <span className="diagram-badge">
          {project.sourceVisibility === "public"
            ? "SOURCE-BACKED RECONSTRUCTION"
            : "THIS PORTFOLIO DEMO"}
        </span>
      </div>
      <svg
        className="architecture-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${project.title} architecture. ${nodes.map((node) => node.label).join(" → ")}. Select components with the buttons below.`}
      >
        <defs>
          <marker
            id={`arrow-${project.id}-${markerId}`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0 0L10 5L0 10Z" fill="currentColor" />
          </marker>
        </defs>
        {project.architecture.edges.map(([from, to]) => {
          const a = position(nodes.findIndex((node) => node.id === from)),
            b = position(nodes.findIndex((node) => node.id === to)),
            highlight = from === selected || to === selected;
          return (
            <g
              key={`${from}-${to}`}
              className={
                highlight ? "diagram-edge highlighted" : "diagram-edge"
              }
            >
              <path
                d={`M${a.x} ${a.y} C${a.x + 100} ${a.y},${b.x - 100} ${b.y},${b.x} ${b.y}`}
                fill="none"
                markerEnd={`url(#arrow-${project.id}-${markerId})`}
              />
            </g>
          );
        })}
        {nodes.map((node, i) => {
          const p = position(i);
          return (
            <g
              key={node.id}
              className={`diagram-node ${node.id === selected ? "selected" : ""} ${connected.has(node.id) ? "connected" : ""}`}
              transform={`translate(${p.x},${p.y})`}
              aria-hidden="true"
            >
              <rect x="-106" y="-32" width="212" height="64" rx="12" />
              <circle cx="-85" cy="0" r="4" />
              <text x="-70" y="-7" className="diagram-node-number">
                MODULE 0{i + 1}
              </text>
              <text x="-70" y="13">
                {node.label.length > 26
                  ? node.label.slice(0, 24) + "…"
                  : node.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div
        className="architecture-node-buttons"
        role="group"
        aria-label={`${project.title} architecture components`}
      >
        {nodes.map((node, i) => (
          <button
            key={node.id}
            onClick={() => setSelected(node.id)}
            aria-pressed={node.id === selected}
          >
            <span className="mono">0{i + 1}</span>
            {node.label}
          </button>
        ))}
      </div>
      <div className="component-inspector" role="status" aria-live="polite">
        <div>
          <span className="eyebrow">COMPONENT INSPECTOR</span>
          <h3>{current.label}</h3>
        </div>
        <p>{current.description}</p>
        {project.sources[0] && (
          <a
            href={project.sources[0].url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Inspect source evidence
            <ArrowUpRight size={14} />
          </a>
        )}
      </div>
      <p className="diagram-caption">
        {project.architecture.kind}. Arrows show the documented logical flow,
        not live network traffic. Full source evidence is listed in the project
        world.
      </p>
    </div>
  );
}
