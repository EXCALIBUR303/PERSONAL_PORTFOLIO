"use client";
import { Fragment, useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { m } from "motion/react";
import { ArrowRight, ArrowUpRight, Check, Compass, List, Map as MapIcon, RotateCcw, Search } from "lucide-react";
import { projects } from "@/data/projects";
import { evidence } from "@/data/evidence";
import { missionSteps, useExploration, type MissionStep } from "@/lib/exploration";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { micro } from "../../motion-config";
import { useGalleryFilter } from "../../use-gallery-filter";
import { districts, toneFor, type District } from "../identity";
import { GATE, GateArt, STAGE, STUDIO, Connectors, Plate, PLATE, StudioArt, hubPoint, islands, plateXY, stationPoint } from "./plates";
import { landmarkArt, Pad } from "./landmarks";
import { StationCard } from "./station-card";
import { stationFor, stations, tierWords, type Station } from "./stations";
import { useChallenges, useExhibitParam, useSaved } from "./studio-state";

/** True from the width at which the whole campus fits in one stage. Below it the districts stack. */
const WIDE = "(min-width: 1000px)";
function useWide() {
  return useSyncExternalStore(
    (notify) => {
      const query = window.matchMedia(WIDE);
      query.addEventListener("change", notify);
      return () => query.removeEventListener("change", notify);
    },
    () => window.matchMedia(WIDE).matches,
    () => true,
  );
}

const ExhibitStage = dynamic(() => import("./exhibit-stage"), { ssr: false });

const projectOf = (slug: string) => projects.find((p) => p.slug === slug)!;
const ZOOM = 1.75;

/** Camera for one district: where the stage is moved and scaled so that plate fills it. */
function cameraFor(district: District) {
  const [cx, cy] = hubPoint(district);
  return { s: ZOOM, tx: 50 - ZOOM * cx, ty: 50 - ZOOM * cy };
}

/** Where the station preview opens relative to its landmark (as a share of the stage). */
function placementFor(station: Station, focus: District | "all") {
  let [x, y] = stationPoint(station);
  if (focus !== "all") {
    const cam = cameraFor(focus);
    x = cam.tx + cam.s * x;
    y = cam.ty + cam.s * y;
  }
  x = Math.min(92, Math.max(8, x));
  y = Math.min(92, Math.max(8, y));
  return { x, y, side: x > 50 ? ("left" as const) : ("right" as const), vert: y > 52 ? ("up" as const) : ("down" as const) };
}

/** The neighbour in a direction, by where the landmarks are drawn on the plate. */
function neighbour(from: Station, dir: "left" | "right" | "up" | "down"): Station | undefined {
  const [fx, fy] = plateXY(...from.at);
  let best: { s: Station; score: number } | undefined;
  for (const s of stations) {
    if (s.district !== from.district || s.slug === from.slug) continue;
    const [x, y] = plateXY(...s.at);
    const dx = x - fx;
    const dy = y - fy;
    const along = dir === "left" ? -dx : dir === "right" ? dx : dir === "up" ? -dy : dy;
    const across = dir === "left" || dir === "right" ? Math.abs(dy) : Math.abs(dx);
    if (along < 6) continue;
    const score = along + across * 1.6;
    if (!best || score < best.score) best = { s, score };
  }
  return best?.s;
}

const KEY_DIR: Record<string, "left" | "right" | "up" | "down"> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
};

/**
 * The Creative home: an illustrated campus of three districts. Every project is
 * a station you can select for a preview; stations with an exhibit open it in
 * place. The same 20 projects are always available as a searchable list.
 */
export default function StudioMap() {
  const reduced = useReducedMotion();
  const wide = useWide();
  const { visited, stepsFor, markStep, markProject, reset } = useExploration();
  const { done: challenges } = useChallenges();
  const { filtered, gallery, setGallery } = useGalleryFilter();
  const [saved, update] = useSaved();
  const { exhibit, open, close, scrollBefore } = useExhibitParam();
  const [hover, setHover] = useState<string | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const opener = useRef<string | null>(null);

  const matching = useMemo(() => new Set(filtered.map((p) => p.slug)), [filtered]);
  const filtering = filtered.length !== projects.length;
  const selected = saved.slug ? stationFor(saved.slug) : undefined;
  const exhibitStation = exhibit ? stations.find((s) => s.slug === exhibit && s.tier === "exhibit") : undefined;
  const number = (slug: string) => projects.findIndex((p) => p.slug === slug) + 1;
  const hot = hover ?? selected?.slug ?? null;
  const cam = saved.focus === "all" ? null : cameraFor(saved.focus);
  const visitedCount = visited.filter((s) => projects.some((p) => p.slug === s)).length;

  function choose(station: Station) {
    update({
      slug: station.slug,
      focus: saved.focus !== "all" && saved.focus !== station.district ? station.district : saved.focus,
    });
    // Stacked layouts show the preview under the district; make sure the visitor sees it.
    if (!window.matchMedia(WIDE).matches)
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          document.querySelector(".c-brief")?.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" }),
        ),
      );
  }
  function enter(station: Station) {
    opener.current = station.slug;
    markProject(station.slug);
    update({ slug: station.slug });
    open(station.slug);
  }
  function nextUnexplored() {
    const here = selected ? stations.findIndex((s) => s.slug === selected.slug) : -1;
    const order = [...stations.slice(here + 1), ...stations.slice(0, here + 1)];
    const next = order.find((s) => !visited.includes(s.slug) && s.slug !== selected?.slug) ?? order[0];
    choose(next);
    requestAnimationFrame(() =>
      stage.current?.querySelector<HTMLElement>(`[data-station="${next.slug}"]`)?.focus({ preventScroll: true }),
    );
  }

  // Opening an exhibit brings its stage to the top; closing it puts the page back where it was.
  const wasOpen = useRef(false);
  useEffect(() => {
    const isOpen = !!exhibitStation;
    if (isOpen === wasOpen.current) return;
    wasOpen.current = isOpen;
    if (isOpen) return;
    window.scrollTo({ top: scrollBefore(), behavior: "auto" });
    const slug = opener.current ?? saved.slug;
    requestAnimationFrame(() => {
      if (saved.view === "map")
        stage.current?.querySelector<HTMLElement>(`[data-station="${slug}"]`)?.focus({ preventScroll: true });
    });
  }, [exhibitStation, saved.slug, saved.view, scrollBefore]);

  // Escape closes the preview while focus is on the map.
  function onMapKey(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape" && selected) {
      const slug = selected.slug;
      update({ slug: null });
      requestAnimationFrame(() =>
        stage.current?.querySelector<HTMLElement>(`[data-station="${slug}"]`)?.focus({ preventScroll: true }),
      );
      return;
    }
    const dir = KEY_DIR[event.key];
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-station]");
    if (!target || (!dir && event.key !== "Home" && event.key !== "End")) return;
    const from = stationFor(target.dataset.station!);
    if (!from) return;
    let next: Station | undefined;
    if (dir) next = neighbour(from, dir);
    else {
      const pool = stations.filter((s) => s.district === from.district);
      next = event.key === "Home" ? pool[0] : pool[pool.length - 1];
    }
    if (!next) return;
    event.preventDefault();
    stage.current?.querySelector<HTMLElement>(`[data-station="${next.slug}"]`)?.focus();
  }

  const byDistrict = districts.map((d) => ({ ...d, list: stations.filter((s) => s.district === d.id) }));
  const mapHidden = saved.view !== "map";
  const placement = selected ? placementFor(selected, saved.focus) : null;
  const stageVars = {
    "--zs": cam ? cam.s : 1,
    "--ztx": `${cam ? cam.tx : 0}%`,
    "--zty": `${cam ? cam.ty : 0}%`,
  } as CSSProperties;

  const card =
    selected && placement ? (
      <StationCard
        key={selected.slug}
        station={selected}
        project={projectOf(selected.slug)}
        number={number(selected.slug)}
        placement={placement}
        doneSteps={stepsFor(selected.slug)}
        challengeDone={challenges.includes(selected.slug)}
        onClose={() => {
          const slug = selected.slug;
          update({ slug: null });
          requestAnimationFrame(() =>
            stage.current?.querySelector<HTMLElement>(`[data-station="${slug}"]`)?.focus({ preventScroll: true }),
          );
        }}
        onEnter={() => enter(selected)}
        onStep={(step: MissionStep) => markStep(selected.slug, step)}
      />
    ) : null;

  return (
    <>
      <div className="c-progress" role="status">
        <span className="mono">
          Explored <b>{visitedCount}</b> of {projects.length} stations in this tab
        </span>
        <ol className="c-pips" aria-hidden="true">
          {projects.map((p) => (
            <li
              key={p.slug}
              data-done={visited.includes(p.slug) || undefined}
              data-current={p.slug === selected?.slug || undefined}
            />
          ))}
        </ol>
        <button type="button" className="c-link-btn" onClick={() => { reset(); }} disabled={!visited.length}>
          <RotateCcw size={13} aria-hidden="true" /> Clear
        </button>
        <span className="c-progress-note">
          Counted from exhibits and pages you open. Kept only in this browser tab.
        </span>
      </div>

      <div className="c-studio" data-open={exhibitStation ? "" : undefined}>
        <div className="c-tools" hidden={!!exhibitStation}>
          <div className="c-tools-group" role="group" aria-label="District">
            <button type="button" aria-pressed={saved.focus === "all"} onClick={() => update({ focus: "all" })}>
              All districts <small>{stations.length}</small>
            </button>
            {byDistrict.map((d) => (
              <button
                key={d.id}
                type="button"
                data-district={d.id}
                aria-pressed={saved.focus === d.id}
                onClick={() => update({ focus: saved.focus === d.id ? "all" : d.id })}
              >
                {d.label} <small>{d.list.length}</small>
              </button>
            ))}
          </div>
          <label className="c-find">
            <Search size={15} aria-hidden="true" />
            <span className="sr-only">Find a station</span>
            <input
              type="search"
              value={gallery.query}
              placeholder="Find a station"
              onChange={(e) => setGallery({ ...gallery, query: e.target.value })}
            />
          </label>
          <div className="c-tools-group c-view-toggle" role="group" aria-label="Show stations as">
            <button type="button" aria-pressed={saved.view === "map"} onClick={() => update({ view: "map" })}>
              <MapIcon size={14} aria-hidden="true" /> Map
            </button>
            <button type="button" aria-pressed={saved.view === "list"} onClick={() => update({ view: "list" })}>
              <List size={14} aria-hidden="true" /> List
            </button>
          </div>
          <button type="button" className="c-surprise" onClick={nextUnexplored} hidden={mapHidden}>
            <Compass size={16} aria-hidden="true" /> Next unexplored station
          </button>
        </div>

        {filtering && !exhibitStation && (
          <p className="c-map-filter mono" role="status">
            {filtered.length} of {projects.length} stations match your board filters
            {gallery.query ? ` (“${gallery.query}”)` : ""}. The rest are dimmed.
          </p>
        )}

        <div hidden={mapHidden || !!exhibitStation}>
          <div className="c-map" role="group" aria-label="Project stations" ref={stage} data-focus={saved.focus} style={stageVars} onKeyDown={onMapKey}>
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
                    data-dim={saved.focus !== "all" && saved.focus !== d.id ? "" : undefined}
                    aria-labelledby={`district-${d.id}`}
                    style={
                      {
                        "--ix": `${(box.x / STAGE.w) * 100}%`,
                        "--iy": `${(box.y / STAGE.h) * 100}%`,
                        "--iw": `${(box.w / STAGE.w) * 100}%`,
                      } as CSSProperties
                    }
                  >
                    <svg
                      className="c-plate"
                      viewBox={`0 0 ${PLATE.w} ${PLATE.h}`}
                      aria-hidden="true"
                      focusable="false"
                    >
                      <Plate district={d.id} active={hot} />
                    </svg>
                    <header>
                      <h3 id={`district-${d.id}`}>{d.label}</h3>
                      <p>{d.blurb}</p>
                    </header>
                    <ul className="c-pins">
                      {d.list.map((s, index) => {
                        const p = projectOf(s.slug);
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
                              onClick={() => choose(s)}
                              onPointerEnter={() => setHover(s.slug)}
                              onPointerLeave={() => setHover(null)}
                              onFocus={() => setHover(s.slug)}
                              onBlur={() => setHover(null)}
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
          </div>
          <ul className="c-keys" aria-label="How to read the map">
            {(["exhibit", "briefing", "blueprint"] as const).map((tier) => (
              <li key={tier} id={`tier-${tier}`}>
                <i className="c-key" data-tier={tier} aria-hidden="true" />
                <b>{tierWords[tier].label}</b> {tierWords[tier].note}
              </li>
            ))}
            <li>
              <i className="c-key c-key-check" aria-hidden="true">
                <Check size={11} />
              </i>
              Opened in this tab
            </li>
          </ul>
          <p className="c-map-help">
            Select a station for a preview. Arrow keys move between stations in a district, and Tab moves between
            districts. Prefer a list? Use <button type="button" onClick={() => update({ view: "list" })}>List view</button>{" "}
            or <a href="#projects">the full board</a>.
          </p>
        </div>

        <div className="c-list-wrap" hidden={saved.view !== "list" || !!exhibitStation}>
          <ol className="c-rows" aria-label="All stations">
            {stations
              .filter((s) => matching.has(s.slug) && (saved.focus === "all" || s.district === saved.focus))
              .map((s) => {
                const p = projectOf(s.slug);
                const item = evidence[s.slug];
                return (
                  <li key={s.slug} className="c-row" data-tier={s.tier} data-tone={toneFor(s.slug)}>
                    <div className="c-row-main">
                      <h4>{p.title}</h4>
                      <p>{s.purpose}</p>
                      <p className="c-row-meta mono">
                        {districts.find((d) => d.id === s.district)!.label} · {tierWords[s.tier].label}
                        {item ? ` · ${item.claimClass}` : ""}
                      </p>
                    </div>
                    <div className="c-row-actions">
                      {s.tier === "exhibit" && (
                        <button type="button" className="c-btn c-btn-lime" onClick={() => enter(s)}>
                          Enter exhibit <ArrowRight size={15} aria-hidden="true" />
                          <span className="sr-only"> for {p.title}</span>
                        </button>
                      )}
                      <Link
                        href={`/projects/${s.slug}/`}
                        prefetch={false}
                        className="c-btn c-btn-paper"
                        onClick={() => markStep(s.slug, "problem")}
                      >
                        Project page <ArrowUpRight size={15} aria-hidden="true" />
                        <span className="sr-only"> for {p.title}</span>
                      </Link>
                    </div>
                  </li>
                );
              })}
          </ol>
          {!filtered.length && <p className="c-empty-note">No station matches. Clear the search to see all {projects.length}.</p>}
        </div>

        {exhibitStation && (
          <ExhibitStage
            key={exhibitStation.slug}
            station={exhibitStation}
            project={projectOf(exhibitStation.slug)}
            onClose={close}
            onSwitch={(slug) => {
              opener.current = slug;
              markProject(slug);
              update({ slug });
              open(slug);
            }}
            onStep={(step: MissionStep) => markStep(exhibitStation.slug, step)}
            steps={missionSteps}
          />
        )}
      </div>
    </>
  );
}
