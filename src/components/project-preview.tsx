import type { CSSProperties } from "react";
import {
  Activity,
  BrainCircuit,
  CircuitBoard,
  FileSearch,
  Network,
} from "lucide-react";
import type { WorldKind } from "@/data/projects";
export default function ProjectPreview({
  type,
  title = "",
  accent = "#b8a0f0",
}: {
  type: WorldKind;
  title?: string;
  accent?: string;
}) {
  const style = { "--world-accent": accent } as CSSProperties;
  return (
    <div
      className={`preview universe-preview universe-${type}`}
      style={style}
      aria-hidden="true"
    >
      <div className="universe-preview-grid" />
      <span className="universe-caption">
        {type === "penalty"
          ? "ORIGINAL INTERACTION STUDY"
          : "ENGINEERING WORLDS / SOURCE VERIFIED"}
      </span>
      {type === "maze" ? (
        <>
          <div className="maze-cover">
            {Array.from({ length: 81 }, (_, i) => (
              <i
                key={i}
                className={
                  (i * 7 + Math.floor(i / 9)) % 5 < 2
                    ? "cover-wall"
                    : i % 11 === 0
                      ? "cover-path"
                      : ""
                }
              />
            ))}
          </div>
          <strong className="universe-cover-title">
            Find
            <br />
            <em>a way.</em>
          </strong>
          <span className="universe-cover-meta">MAZERA / ALGORITHMS</span>
        </>
      ) : type === "signals" ? (
        <>
          <div className="signal-cover">
            <svg viewBox="0 0 400 260">
              <g stroke="currentColor" strokeWidth="1" opacity=".45">
                {[50, 130, 210].flatMap((y) =>
                  [65, 150, 235].map((end, i) => (
                    <path
                      key={`${y}-${end}`}
                      d={`M90 ${y}L${210 + i * 40} ${end}`}
                    />
                  )),
                )}
              </g>
              {[
                [90, 50],
                [90, 130],
                [90, 210],
                [210, 65],
                [250, 150],
                [290, 235],
              ].map(([x, y], i) => (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={i % 2 ? 16 : 24}
                  fill="var(--world-accent)"
                  opacity={0.4 + i * 0.09}
                />
              ))}
            </svg>
            <BrainCircuit size={57} />
          </div>
          <strong className="universe-cover-title">
            A human
            <br />
            <em>signal.</em>
          </strong>
          <span className="universe-cover-meta">
            RESEARCH / NOT A DIAGNOSIS
          </span>
        </>
      ) : type === "process" ? (
        <>
          <div className="process-cover">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <span>0{i}</span>
                <i />
                <b>{["SENSE", "CLASSIFY", "RECORD"][i - 1]}</b>
              </div>
            ))}
          </div>
          <strong className="universe-cover-title">
            Second life.
            <br />
            <em>Better loop.</em>
          </strong>
          <span className="universe-cover-meta">
            CYCOIL / SUSTAINABLE SYSTEMS
          </span>
        </>
      ) : type === "parking" ? (
        <>
          <div className="parking-cover">
            {Array.from({ length: 18 }, (_, i) => (
              <i key={i} className={i % 3 === 0 ? "parked" : ""}>
                <span />
              </i>
            ))}
          </div>
          <strong className="universe-cover-title">
            Space,
            <br />
            <em>allocated.</em>
          </strong>
          <span className="universe-cover-meta">
            SMARTPARK / RELATIONAL SYSTEMS
          </span>
        </>
      ) : type === "maintenance" ? (
        <>
          <div className="engine-cover">
            {Array.from({ length: 12 }, (_, i) => (
              <i key={i} style={{ "--i": i } as CSSProperties} />
            ))}
            <Activity size={50} />
          </div>
          <strong className="universe-cover-title">
            Ahead of
            <br />
            <em>the curve.</em>
          </strong>
          <span className="universe-cover-meta">
            C-MAPSS / REMAINING USEFUL LIFE
          </span>
        </>
      ) : type === "penalty" ? (
        <>
          <div className="pitch-cover">
            <i />
            <span />
            <b>+</b>
          </div>
          <strong className="universe-cover-title">
            Make it
            <br />
            <em>count.</em>
          </strong>
          <span className="universe-cover-meta">
            PLAYABLE / INDEPENDENT DEMO
          </span>
        </>
      ) : (
        <>
          <div className="system-cover">
            {title.toLowerCase().includes("resume") ? (
              <FileSearch size={80} />
            ) : title.toLowerCase().includes("aeris") ? (
              <CircuitBoard size={80} />
            ) : (
              <Network size={80} />
            )}
            <i />
            <i />
            <i />
          </div>
          <strong className="universe-cover-title">
            Look
            <br />
            <em>closer.</em>
          </strong>
          <span className="universe-cover-meta">
            {title.toUpperCase()} / SYSTEM EXPLORER
          </span>
        </>
      )}
    </div>
  );
}
