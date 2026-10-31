"use client";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Compass, List, Map as MapIcon, RotateCcw, Search } from "lucide-react";
import { projects } from "@/data/projects";
import { evidence } from "@/data/evidence";
import { missionSteps, useExploration, type MissionStep } from "@/lib/exploration";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { useGalleryFilter } from "../../use-gallery-filter";
import { districts, toneFor, type District } from "../identity";
import { worldEngine } from "../world/quality";
import WorldStage, { screenSpot } from "../world/world-stage";
import { Map2D } from "./map-2d";
import { MotionToggle } from "./motion-toggle";
import { useAmbientPaused } from "../world/ambient";
import { hubPoint, plateXY, stationPoint } from "./plates";
import { StationCard } from "./station-card";
import { StudioCard } from "./studio-card";
import { stationFor, stations, tierWords, type Station } from "./stations";
import { useChallenges, useExhibitParam, useSaved } from "./studio-state";

/** Wide screens show the whole world with the panel docked in it; tablets put the panel under it; phones list stations as strips. */
type Layout = "wide" | "tablet" | "phone";
const WIDE = "(min-width: 1000px)";
const PHONE = "(max-width: 639px)";
function useLayoutMode(): Layout {
  return useSyncExternalStore(
    (notify) => {
      const queries = [window.matchMedia(WIDE), window.matchMedia(PHONE)];
      queries.forEach((q) => q.addEventListener("change", notify));
      return () => queries.forEach((q) => q.removeEventListener("change", notify));
    },
    () => (window.matchMedia(WIDE).matches ? "wide" : window.matchMedia(PHONE).matches ? "phone" : "tablet"),
    () => "wide",
  );
}
const noop = () => () => {};
/** "3d" or "2d", decided once on the client from WebGL support, the renderer and `?world=`. */
function useEngine() {
  return useSyncExternalStore(noop, worldEngine, () => null);
}

const ExhibitStage = dynamic(() => import("./exhibit-stage"), { ssr: false });

const projectOf = (slug: string) => projects.find((p) => p.slug === slug)!;
const ZOOM = 1.75;

/** The 2D map's camera for one district: where the stage is moved and scaled so that plate fills it. */
function cameraFor(district: District) {
  const [cx, cy] = hubPoint(district);
  return { s: ZOOM, tx: 50 - ZOOM * cx, ty: 50 - ZOOM * cy };
}

/** Where the 2D map's preview opens relative to its landmark (as a share of the stage). */
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

type Dir = "left" | "right" | "up" | "down";
/** The nearest station in a direction among those drawn at these points. */
function nearest(from: Station, dir: Dir, pointOf: (s: Station) => [number, number] | null, minStep: number) {
  const origin = pointOf(from);
  if (!origin) return undefined;
  const [fx, fy] = origin;
  let best: { s: Station; score: number } | undefined;
  for (const s of stations) {
    if (s.district !== from.district || s.slug === from.slug) continue;
    const at = pointOf(s);
    if (!at) continue;
    const dx = at[0] - fx;
    const dy = at[1] - fy;
    const along = dir === "left" ? -dx : dir === "right" ? dx : dir === "up" ? -dy : dy;
    const across = dir === "left" || dir === "right" ? Math.abs(dy) : Math.abs(dx);
    if (along < minStep) continue;
    const score = along + across * 1.6;
    if (!best || score < best.score) best = { s, score };
  }
  return best?.s;
}

const KEY_DIR: Record<string, Dir> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
};

/**
 * The Creative home: a world of three districts around a central Studio. Every
 * project is a station you can select for a preview; stations with an exhibit
 * open it in place. With WebGL it is a 3D world (the Studio and the Systems
 * district modelled in detail); without it, the illustrated 2D map. The same 20
 * projects are always available as a searchable list.
 */
export default function StudioMap() {
  const reduced = useReducedMotion();
  const motionPaused = useAmbientPaused();
  const layout = useLayoutMode();
  const wide = layout === "wide";
  const preferred = useEngine();
  const [failed, setFailed] = useState(false);
  const engine: "3d" | "2d" = preferred === "2d" || failed ? "2d" : "3d";
  const { visited, stepsFor, markStep, markProject, reset } = useExploration();
  const { done: challenges } = useChallenges();
  const { filtered, gallery, setGallery } = useGalleryFilter();
  const [saved, update] = useSaved();
  const { exhibit, open, close, scrollBefore } = useExhibitParam();
  const [hover, setHover] = useState<string | null>(null);
  const [entering, setEntering] = useState<string | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const opener = useRef<string | null>(null);

  const matching = useMemo(() => new Set(filtered.map((p) => p.slug)), [filtered]);
  const filtering = filtered.length !== projects.length;
  const studioOpen = engine === "3d" && saved.slug === "studio";
  const selected = saved.slug && saved.slug !== "studio" ? stationFor(saved.slug) : undefined;
  const exhibitStation = exhibit ? stations.find((s) => s.slug === exhibit && s.tier === "exhibit") : undefined;
  const number = (slug: string) => projects.findIndex((p) => p.slug === slug) + 1;
  const hot = hover ?? selected?.slug ?? null;
  const visitedCount = visited.filter((s) => projects.some((p) => p.slug === s)).length;

  const focusOn = useCallback(
    (slug: string | null) =>
      requestAnimationFrame(() => {
        const el =
          slug === "studio"
            ? stage.current?.querySelector<HTMLElement>(".w-studio")
            : slug
              ? stage.current?.querySelector<HTMLElement>(`[data-station="${slug}"]`)
              : null;
        el?.focus({ preventScroll: true });
      }),
    [],
  );

  /** On a phone the panel is a sheet over the bottom of the screen: bring the world to the top, above it. */
  function showStage() {
    if (layout !== "phone") return;
    requestAnimationFrame(() => {
      const stage = document.querySelector(".w-stage");
      if (!stage) return;
      const top = stage.getBoundingClientRect().top;
      if (Math.abs(top - 84) > 6) window.scrollBy({ top: top - 84, behavior: reduced ? "auto" : "smooth" });
    });
  }
  function choose(station: Station) {
    showStage();
    setEntering(null);
    update({
      slug: station.slug,
      focus: saved.focus !== "all" && saved.focus !== station.district ? station.district : saved.focus,
    });
  }
  function openStudio() {
    if (saved.slug !== "studio") showStage();
    setEntering(null);
    update({ slug: saved.slug === "studio" ? null : "studio" });
  }
  function enter(station: Station) {
    opener.current = station.slug;
    markProject(station.slug);
    update({ slug: station.slug });
    // In the 3D world the camera moves into the landmark first, then the exhibit opens.
    if (engine === "3d" && !reduced && saved.view === "map") setEntering(station.slug);
    else open(station.slug);
  }
  const onEntered = useCallback(
    (slug: string) => {
      setEntering((current) => (current === slug ? null : current));
      open(slug);
    },
    [open],
  );
  // If the camera move is interrupted, the exhibit still opens.
  useEffect(() => {
    if (!entering) return;
    const id = window.setTimeout(() => onEntered(entering), 1500);
    return () => window.clearTimeout(id);
  }, [entering, onEntered]);

  function nextUnexplored() {
    const here = selected ? stations.findIndex((s) => s.slug === selected.slug) : -1;
    const order = [...stations.slice(here + 1), ...stations.slice(0, here + 1)];
    const next = order.find((s) => !visited.includes(s.slug) && s.slug !== selected?.slug) ?? order[0];
    choose(next);
    focusOn(next.slug);
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
    if (saved.view === "map") focusOn(slug);
  }, [exhibitStation, saved.slug, saved.view, scrollBefore, focusOn]);

  // Escape steps back out: from a preview to its station, then from a district to the whole world.
  function onMapKey(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      if (saved.slug) {
        const slug = saved.slug;
        update({ slug: null });
        focusOn(slug);
      } else if (saved.focus !== "all" && engine === "3d") update({ focus: "all" });
      return;
    }
    const dir = KEY_DIR[event.key];
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-station]");
    if (!target || (!dir && event.key !== "Home" && event.key !== "End")) return;
    const from = stationFor(target.dataset.station!);
    if (!from) return;
    let next: Station | undefined;
    if (dir)
      next =
        engine === "3d"
          ? nearest(from, dir, (s) => {
              const spot = screenSpot(s.slug);
              return spot?.visible ? [spot.x, spot.y] : null;
            }, 6)
          : nearest(from, dir, (s) => plateXY(...s.at), 6);
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
  const cam = engine === "2d" && saved.focus !== "all" ? cameraFor(saved.focus) : null;
  const stageVars =
    engine === "2d"
      ? ({ "--zs": cam ? cam.s : 1, "--ztx": `${cam ? cam.tx : 0}%`, "--zty": `${cam ? cam.ty : 0}%` } as CSSProperties)
      : undefined;

  const closeCard = () => {
    const slug = saved.slug;
    update({ slug: null });
    focusOn(slug);
  };
  const card = studioOpen ? (
    <StudioCard
      visited={visited}
      challenges={challenges}
      onClose={closeCard}
      onDistrict={(d) => update({ focus: d, slug: null })}
    />
  ) : selected ? (
    <StationCard
      key={selected.slug}
      station={selected}
      project={projectOf(selected.slug)}
      number={number(selected.slug)}
      placement={engine === "2d" ? placementFor(selected, saved.focus) : undefined}
      doneSteps={stepsFor(selected.slug)}
      challengeDone={challenges.includes(selected.slug)}
      onClose={closeCard}
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
            <button type="button" aria-pressed={saved.focus === "all"} onClick={() => update({ focus: "all", slug: null })}>
              All districts <small>{stations.length}</small>
            </button>
            {byDistrict.map((d) => (
              <button
                key={d.id}
                type="button"
                data-district={d.id}
                aria-pressed={saved.focus === d.id}
                onClick={() =>
                  update({
                    focus: saved.focus === d.id ? "all" : d.id,
                    slug: selected && selected.district !== d.id ? null : saved.slug === "studio" ? null : saved.slug,
                  })
                }
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
              <MapIcon size={14} aria-hidden="true" /> <span className="c-view-label">Map</span>
            </button>
            <button type="button" aria-pressed={saved.view === "list"} onClick={() => update({ view: "list" })}>
              <List size={14} aria-hidden="true" /> <span className="c-view-label">List</span>
            </button>
          </div>
          <MotionToggle />
          <button type="button" className="c-surprise" onClick={nextUnexplored} hidden={mapHidden}>
            <Compass size={16} aria-hidden="true" /> Next<span className="c-surprise-rest"> unexplored station</span>
          </button>
        </div>

        {filtering && !exhibitStation && (
          <p className="c-map-filter mono" role="status">
            {filtered.length} of {projects.length} stations match your board filters
            {gallery.query ? ` (“${gallery.query}”)` : ""}. The rest are dimmed.
          </p>
        )}

        <div hidden={mapHidden || !!exhibitStation}>
          <div
            className="c-map"
            role="group"
            aria-label="Project stations"
            ref={stage}
            data-engine={engine}
            data-focus={saved.focus}
            data-entering={entering ? "" : undefined}
            data-still={motionPaused || undefined}
            style={stageVars}
            onKeyDown={onMapKey}
          >
            {engine === "3d" ? (
              <WorldStage
                stations={stations}
                focus={saved.focus}
                selected={studioOpen ? "studio" : (selected?.slug ?? null)}
                hover={hover}
                entering={entering}
                visited={visited}
                challenges={challenges}
                matching={matching}
                layout={layout}
                reduced={reduced}
                paused={mapHidden || !!exhibitStation}
                card={card}
                onChoose={choose}
                onStudio={openStudio}
                onOverview={() => update({ focus: "all", slug: null })}
                onDistrict={(d) => update({ focus: d, slug: null })}
                onHover={setHover}
                onEntered={onEntered}
                onFailed={() => setFailed(true)}
              />
            ) : (
              <Map2D
                byDistrict={byDistrict}
                focus={saved.focus}
                selected={selected}
                hot={hot}
                visited={visited}
                challenges={challenges}
                matching={matching}
                wide={wide}
                reduced={reduced}
                card={card}
                onChoose={choose}
                onHover={setHover}
              />
            )}
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
            Select a station for a preview. Arrow keys move between stations in a district, Tab moves between
            districts and Escape steps back out. Prefer a list? Use{" "}
            <button type="button" onClick={() => update({ view: "list" })}>List view</button> or{" "}
            <a href="#projects">the full board</a>.
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
                          Explore exhibit <ArrowRight size={15} aria-hidden="true" />
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
