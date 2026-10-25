"use client";
import { Fragment, type CSSProperties, type ReactNode } from "react";
import { m } from "motion/react";
import { Check } from "lucide-react";
import { projects } from "@/data/projects";
import { micro } from "../../motion-config";
import { toneFor, type District } from "../identity";
import { GATE, GateArt, STAGE, STUDIO, Connectors, Plate, PLATE, StudioArt, islands, plateXY } from "./plates";
import { landmarkArt, Pad } from "./landmarks";
import type { Station } from "./stations";

/**
 * The illustrated 2D campus from Stage C: three isometric plates in inline SVG
 * with real buttons laid over them. It is the map when WebGL is unavailable or
 * the 3D world fails (and with ?world=2d), so it keeps every behaviour the
 * 3D world has: districts, selection, keyboard, the Studio and the preview.
 */
export function Map2D({
  byDistrict,
  focus,
  selected,
  hot,
  visited,
  challenges,
  matching,
  wide,
  reduced,
  card,
  onChoose,
  onHover,
}: {
  byDistrict: { id: District; label: string; blurb: string; list: Station[] }[];
  focus: District | "all";
  selected: Station | undefined;
  hot: string | null;
  visited: string[];
  challenges: string[];
  matching: Set<string>;
  wide: boolean;
  reduced: boolean;
  card: ReactNode;
  onChoose: (station: Station) => void;
  onHover: (slug: string | null) => void;
}) {
  return (
    <>
      <div className="c-stage-inner">
        <Connectors />
        <a
          className="c-studio-bldg"
          href="#about"
          style={{ left: `${(STUDIO.x / STAGE.w) * 100}%`, top: `${(STUDIO.y / STAGE.h) * 100}%` }}
        >
          <StudioArt />
          <span className="c-pin-label">
            <span>The Studio</span>
            <small>About me</small>
          </span>
        </a>
        <div
          className="c-gate"
          style={{ left: `${(GATE.x / STAGE.w) * 100}%`, top: `${(GATE.y / STAGE.h) * 100}%` }}
          aria-hidden="true"
        >
          <GateArt />
          <span className="c-here mono">You are here</span>
        </div>
        {byDistrict.map((d) => {
          const box = islands[d.id];
          return (
            <Fragment key={d.id}>
              <section
                className="c-island"
                data-district={d.id}
                data-dim={focus !== "all" && focus !== d.id ? "" : undefined}
                aria-labelledby={`district-${d.id}`}
                style={
                  {
                    "--ix": `${(box.x / STAGE.w) * 100}%`,
                    "--iy": `${(box.y / STAGE.h) * 100}%`,
                    "--iw": `${(box.w / STAGE.w) * 100}%`,
                  } as CSSProperties
                }
              >
                <svg className="c-plate" viewBox={`0 0 ${PLATE.w} ${PLATE.h}`} aria-hidden="true" focusable="false">
                  <Plate district={d.id} active={hot} />
                </svg>
                <header>
                  <h3 id={`district-${d.id}`}>{d.label}</h3>
                  <p>{d.blurb}</p>
                </header>
                <ul className="c-pins">
                  {d.list.map((s, index) => {
                    const p = projects.find((x) => x.slug === s.slug)!;
                    const [sx, sy] = plateXY(...s.at);
                    const isVisited = visited.includes(s.slug);
                    const tabbable = selected?.district === d.id ? selected.slug === s.slug : index === 0;
                    return (
                      <li
                        key={s.slug}
                        className="c-slot"
                        data-tier={s.tier}
                        style={
                          {
                            left: `${(sx / PLATE.w) * 100}%`,
                            top: `${(sy / PLATE.h) * 100}%`,
                            zIndex: Math.round(sy),
                          } as CSSProperties
                        }
                      >
                        <button
                          type="button"
                          className="c-pin"
                          data-station={s.slug}
                          data-tone={toneFor(s.slug)}
                          data-tier={s.tier}
                          data-match={matching.has(s.slug)}
                          data-visited={isVisited || undefined}
                          data-challenge={challenges.includes(s.slug) || undefined}
                          aria-pressed={s.slug === selected?.slug}
                          aria-describedby={`tier-${s.tier}`}
                          tabIndex={tabbable ? 0 : -1}
                          onClick={() => onChoose(s)}
                          onPointerEnter={() => onHover(s.slug)}
                          onPointerLeave={() => onHover(null)}
                          onFocus={() => onHover(s.slug)}
                          onBlur={() => onHover(null)}
                        >
                          <svg className="c-glyph" viewBox="-64 -96 128 112" aria-hidden="true" focusable="false">
                            <ellipse className="c-sel" cx="0" cy="0" rx="46" ry="26" />
                            <Pad tier={s.tier} />
                            <g className="c-art">{landmarkArt(s.slug)}</g>
                          </svg>
                          <span className="c-pin-label">
                            <span aria-hidden="true">{s.short}</span>
                            <span className="sr-only">{p.title}</span>
                            {isVisited && <span className="sr-only">, explored</span>}
                          </span>
                          {isVisited && (
                            <m.span
                              className="c-pin-check-pop"
                              initial={reduced ? false : { scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={micro.glide}
                            >
                              <Check size={13} className="c-pin-check" aria-hidden="true" />
                            </m.span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
              {!wide && selected?.district === d.id && card}
            </Fragment>
          );
        })}
      </div>
      {wide && card}
    </>
  );
}
