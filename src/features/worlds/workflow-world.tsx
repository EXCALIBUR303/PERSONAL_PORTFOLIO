"use client";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Network } from "lucide-react";
import type { Project } from "@/data/projects";
export default function WorkflowWorld({ project }: { project: Project }) {
  const [index, setIndex] = useState(0);
  const nodes = project.architecture.nodes,
    current = nodes[index];
  return (
    <div className="interactive-module workflow-module">
      <div className="workflow-stage">
        <div className="workflow-orbit" aria-hidden="true">
          <Network size={75} />
          <i />
          <i />
          <i />
        </div>
        <span className="eyebrow">
          {project.demo.type === "unavailable"
            ? "PROPOSED DESIGN / READ-ONLY GUIDE"
            : "FOLLOW THE IMPLEMENTATION / READ-ONLY GUIDE"}
        </span>
        <div className="workflow-stage-content" aria-live="polite">
          <span className="workflow-large-number">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div>
            <span className="mono">
              COMPONENT {index + 1} OF {nodes.length}
            </span>
            <h3>{current.label}</h3>
            <p>{current.description}</p>
          </div>
        </div>
      </div>
      <div
        className="workflow-step-buttons"
        role="group"
        aria-label="Workflow components"
      >
        {nodes.map((node, i) => (
          <button
            key={node.id}
            aria-pressed={index === i}
            onClick={() => setIndex(i)}
          >
            <span className="mono">{String(i + 1).padStart(2, "0")}</span>
            {node.label}
          </button>
        ))}
      </div>
      <div className="workflow-actions">
        <button
          className="button button-outline"
          disabled={index === 0}
          onClick={() => setIndex(index - 1)}
        >
          <ArrowLeft size={15} />
          Previous component
        </button>
        <button
          className="button button-lime"
          disabled={index === nodes.length - 1}
          onClick={() => setIndex(index + 1)}
        >
          Next component
          <ArrowRight size={15} />
        </button>
      </div>
      <p className="module-disclaimer">
        Source-backed component guide. These controls navigate documented
        component notes; they do not execute the original application, model, or
        external services. Use the architecture map below to inspect actual
        logical connections.
      </p>
    </div>
  );
}
