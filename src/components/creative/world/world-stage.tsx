"use client";
import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { m } from "motion/react";
import { ArrowLeft, Check } from "lucide-react";
import { projects } from "@/data/projects";
import { subscribeTransition, transition } from "@/lib/transition/state";
import { micro } from "../../motion-config";
import { lazyView } from "../../scenes/lazy-view";
import { districts, toneFor, type District } from "../identity";
import { tierWords, type Station } from "../studio/stations";
import { easeInCubic, easeInOutCubic, easeOutCubic, Projector, type Pose } from "./camera";
import { boxOf, PLACEMENTS, plateOf, PLATES, poseFor, STUDIO, type Shot, type Stage } from "./layout";
import { guessTier, readOverride, type Tier } from "./quality";
import { Rig } from "./rig";

/*
 * The studio world as the page sees it: a stage with the 3D canvas behind and
 * real HTML in front. Every station is a <button> whose hit area is its
 * landmark's box on screen, so pointing at a building selects it, the keyboard
 * reaches it and screen readers read it, with or without WebGL. The camera rig
 * places the buttons and labels with the same projection the canvas draws with.
 */
const WorldCanvas = lazyView(() => import("./world-canvas"), () => null);

export type ScreenSpot = { x: number; y: number; visible: boolean };
type Layout = "wide" | "tablet" | "phone";

/** Where each station was last drawn on screen (one world per page), for arrow-key navigation. */
const screen = new Map<string, ScreenSpot>();
export const screenSpot = (slug: string) => screen.get(slug);

type Props = {
  stations: Station[];
  focus: District | "all";
  /** A station's slug, "studio", or nothing. */
  selected: string | null;
  hover: string | null;
  entering: string | null;
  visited: string[];
  challenges: string[];
  matching: Set<string>;
  layout: Layout;
  reduced: boolean;
  paused: boolean;
  /** The open panel: docked in the stage on wide screens, under its district on phones. */
  card: ReactNode;
  onChoose: (station: Station) => void;
  onStudio: () => void;
  onOverview: () => void;
  /** Back to a district's own view, leaving the selected station. */
  onDistrict: (district: District) => void;
  onHover: (slug: string | null) => void;
  onEntered: (slug: string) => void;
  onFailed: () => void;
};

/** The one project whose reaction crosses the island: its note starts at LifeOS and ends in the vault (times in ms, matching the vault's timeline). */
const JOURNEY = { from: "lifeos", to: "private-local-ai", reveal: 700, follow: 1900 };
/** Width the docked panel takes from the stage (its CSS width plus margins). */
const PANEL = 328 + 28;
/** The share of the stage a tablet's panel sheet covers. */
const SHEET = 0.46;
const sheetHost = () => (typeof document === "undefined" ? null : document.querySelector<HTMLElement>(".portfolio-root"));
const proj = new Projector();
type Placed = { slot: HTMLElement; slug: string; x: number; y: number; depth: number; visible: boolean; box: { left: number; top: number; right: number; bottom: number } };

function useTransitionRunning() {
  return useSyncExternalStore(subscribeTransition, () => transition.running, () => false);
}
const noop = () => () => {};
let tierGuess: Tier | null = null;
/** The device tier, guessed once on the client (null while hydrating). */
function useTier() {
  return useSyncExternalStore(
    noop,
    () => (tierGuess ??= guessTier()),
    () => null,
  );
}

export default function WorldStage({
  stations,
  focus,
  selected,
  hover,
  entering,
  visited,
  challenges,
  matching,
  layout,
  reduced,
  paused,
  card,
  onChoose,
  onStudio,
  onOverview,
  onDistrict,
  onHover,
  onEntered,
  onFailed,
}: Props) {
  const root = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const size = useRef({ w: 0, h: 0 });
  const [measured, setMeasured] = useState<{ w: number; h: number } | null>(null);
  const [ready, setReady] = useState(false);
  const tier = useTier();
  const running = useTransitionRunning();
  const [mountCanvas, setMountCanvas] = useState(false);
  const rig = useMemo(() => new Rig(poseFor({ kind: "overview" }, { width: 1200, height: 720, insetRight: 0 })), []);

  const inset = layout === "wide" && selected ? PANEL : 0;
  // On a tablet the panel is a sheet over the bottom of the stage; the camera frames the subject above it.
  const sheet = layout === "tablet" && selected && measured ? Math.round(measured.h * SHEET) : 0;
  const shot: Shot = entering
    ? { kind: "approach", slug: entering }
    : selected === "studio"
      ? { kind: "studio" }
      : selected && PLACEMENTS[selected]
        ? { kind: "station", slug: selected, within: focus === "all" ? "overview" : "district" }
        : focus !== "all"
          ? { kind: "district", district: focus }
          : { kind: "overview" };
  const shotKey = JSON.stringify(shot);

  /* ---------- placing the HTML over the world ---------- */
  const slots = useRef<HTMLElement[]>([]);
  const plates = useRef<HTMLElement[]>([]);
  const studio = useRef<HTMLElement | null>(null);
  const plaques = useRef(new Map<string, { w: number; h: number }>());
  const plateSizes = useRef(new Map<string, { w: number; h: number }>());
  const labels = useRef({ focus, selected, hover, layout });

  /** Shows the names that fit without covering each other, the selected and nearest first. */
  const layoutPlaques = useCallback(
    (placed: Placed[], w: number, h: number) => {
      const { focus: f, selected: sel, hover: hov, layout: lay } = labels.current;
      const rank = (slug: string) => {
        if (slug === sel) return 0;
        if (slug === hov) return 1;
        const tier = stations.find((s) => s.slug === slug)?.tier;
        return tier === "exhibit" ? 2 : tier === "briefing" ? 3 : 4;
      };
      const order = [...placed].sort((a, b) => rank(a.slug) - rank(b.slug) || a.depth - b.depth);
      const shown = sel && PLACEMENTS[sel] ? PLACEMENTS[sel].district : f !== "all" ? f : null;
      // Every visible marker is an obstacle for every name.
      const taken = placed.filter((s) => s.visible).map((s) => ({ l: s.x - 8, t: s.y - 8, r: s.x + 8, b: s.y + 8, own: s.slug }));
      for (const s of order) {
        const wanted = s.visible && lay !== "phone" && (s.slug === sel || PLACEMENTS[s.slug]?.district === shown);
        if (!wanted) {
          s.slot.dataset.label = "off";
          continue;
        }
        const { w: pw, h: ph } = plaques.current.get(s.slug) ?? { w: 90, h: 22 };
        // Beside or below the landmark's own outline, so a name never sits on the model it names;
        // then, if the stage is too crowded for that, under the marker as before.
        const b = s.box;
        const mid = (b.left + b.right) / 2 - s.x;
        const options: [number, number][] = [
          [mid, b.bottom + 6 - s.y],
          [b.right + pw / 2 + 8 - s.x, (b.top + b.bottom) / 2 - ph / 2 - s.y],
          [b.left - pw / 2 - 8 - s.x, (b.top + b.bottom) / 2 - ph / 2 - s.y],
          [mid, b.top - ph - 6 - s.y],
          [0, 9],
          [0, 12 + ph],
          [pw / 2 + 12, -ph / 2],
          [-pw / 2 - 12, -ph / 2],
        ];
        let chosen: [number, number] | null = null;
        for (const option of options) {
          const [cx, top] = option;
          const r = { l: s.x + cx - pw / 2 - 3, t: s.y + top - 2, r: s.x + cx + pw / 2 + 3, b: s.y + top + ph + 2 };
          if (r.l < 4 || r.r > w - 4 || r.t < 4 || r.b > h - 4) continue;
          if (taken.some((o) => o.own !== s.slug && r.l < o.r && r.r > o.l && r.t < o.b && r.b > o.t)) continue;
          // The first four options must clear the landmark's own outline.
          if (options.indexOf(option) < 4 && r.l < b.right && r.r > b.left && r.t < b.bottom && r.b > b.top) continue;
          chosen = [cx, top];
          taken.push({ ...r, own: s.slug });
          break;
        }
        if (!chosen && s.slug === sel) chosen = options[0];
        if (chosen) {
          s.slot.dataset.label = "on";
          s.slot.style.setProperty("--lx", `${chosen[0].toFixed(1)}px`);
          s.slot.style.setProperty("--ly", `${chosen[1].toFixed(1)}px`);
        } else s.slot.dataset.label = "off";
      }
    },
    [stations],
  );

  /**
   * Places everything for a camera pose. While the camera moves only positions
   * change (transforms, which skip layout); hit areas and the label layout are
   * written once it settles, or when `full` asks for them.
   */
  const place = useCallback(
    (pose: Pose, full = false) => {
      const { w, h } = size.current;
      if (w < 2 || h < 2) return;
      const settled = full || !rig.moving;
      // Reads first: measuring between writes would force a layout per label.
      if (plaques.current.size < slots.current.length)
        for (const slot of slots.current) {
          const el = slot.querySelector<HTMLElement>(".w-plaque");
          plaques.current.set(slot.dataset.slot!, { w: el?.offsetWidth || 90, h: el?.offsetHeight || 22 });
        }
      if (plateSizes.current.size < plates.current.length)
        for (const plate of plates.current)
          plateSizes.current.set(plate.dataset.plate!, { w: plate.offsetWidth || 180, h: plate.offsetHeight || 50 });
      proj.set(pose, w, h);
      const placed: Placed[] = [];
      const hit = (el: HTMLElement, footX: number, footY: number, b: { left: number; top: number; right: number; bottom: number }) => {
        el.style.transform = `translate3d(${footX.toFixed(1)}px, ${footY.toFixed(1)}px, 0)`;
        if (!settled) return;
        el.style.setProperty("--hx", `${(b.left - footX).toFixed(1)}px`);
        el.style.setProperty("--hy", `${(b.top - footY).toFixed(1)}px`);
        el.style.setProperty("--hw", `${(b.right - b.left).toFixed(1)}px`);
        el.style.setProperty("--hh", `${(b.bottom - b.top).toFixed(1)}px`);
      };
      for (const slot of slots.current) {
        const slug = slot.dataset.slot!;
        const p = PLACEMENTS[slug];
        if (!p) continue;
        const foot = proj.project(p.base[0], p.base[1] + 0.03, p.base[2] + p.size[2] / 2 + 0.04);
        const [min, max] = boxOf(p);
        const b = proj.box(min, max);
        const visible = foot.visible && b.right > 6 && b.left < w - 6 && b.bottom > 6 && b.top < h - 6;
        hit(slot, foot.x, foot.y, b);
        slot.style.zIndex = String(Math.max(1, Math.round(3000 - foot.depth * 20)));
        if (visible) delete slot.dataset.off;
        else slot.dataset.off = "";
        screen.set(slug, { x: foot.x, y: foot.y, visible });
        placed.push({ slot, slug, x: foot.x, y: foot.y, depth: foot.depth, visible, box: b });
      }
      for (const plate of plates.current) {
        const id = plate.dataset.plate as District;
        const at = plateOf(id);
        const s = proj.project(at[0], at[1], at[2]);
        const box = plateSizes.current.get(id) ?? { w: 180, h: 50 };
        // Read from the anchor in the plate's direction, then kept inside the stage.
        const align = PLATES[id].align;
        let left = align === "left" ? s.x - box.w : align === "right" ? s.x : s.x - box.w / 2;
        let top = align === "below" ? s.y : s.y - box.h / 2;
        const inside = s.visible && s.x > -box.w / 2 && s.x < w + box.w / 2 && s.y > -box.h && s.y < h + box.h;
        left = Math.min(w - box.w - 10, Math.max(10, left));
        top = Math.min(h - box.h - 10, Math.max(10, top));
        plate.style.transform = `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0)`;
        if (inside) delete plate.dataset.off;
        else plate.dataset.off = "";
      }
      const st = studio.current;
      if (st) {
        // The Studio's marker and name float above its roof; its button covers the building.
        const top = proj.project(...STUDIO.anchor);
        const b = proj.box(STUDIO.min, STUDIO.max);
        hit(st, top.x, top.y, b);
        st.style.zIndex = String(Math.max(1, Math.round(3000 - top.depth * 20)));
        if (top.visible && top.x > 0 && top.x < w && top.y > 0 && top.y < h) delete st.dataset.off;
        else st.dataset.off = "";
      }
      if (settled) layoutPlaques(placed, w, h);
    },
    [layoutPlaques, rig],
  );

  // Collect the elements the rig moves.
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    slots.current = [...el.querySelectorAll<HTMLElement>("[data-slot]")];
    plates.current = [...el.querySelectorAll<HTMLElement>("[data-plate]")];
    studio.current = el.querySelector<HTMLElement>("[data-studio-slot]");
  }, [stations]);

  // Follow the stage's size; a size of zero means it is hidden (an exhibit is open).
  useLayoutEffect(() => {
    const el = frame.current;
    if (!el) return;
    const read = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w < 2 || h < 2 || (w === size.current.w && h === size.current.h)) return;
      size.current = { w, h };
      plaques.current.clear();
      plateSizes.current.clear();
      setMeasured({ w, h });
    };
    read();
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => rig.subscribe(place), [rig, place]);

  // Move the camera to the current shot. The first framing is a jump (or a
  // short establishing glide once the world has drawn); after that every
  // change eases, and entering an exhibit flies into the landmark first.
  const first = useRef(true);
  const journeyKey = useRef<string | null>(null);
  const establishing = useRef(false);
  useLayoutEffect(() => {
    if (!measured) return;
    const stage: Stage = { width: measured.w, height: measured.h, insetRight: inset, insetBottom: sheet };
    const goal = poseFor(shot, stage);
    if (first.current) {
      first.current = false;
      if (!reduced && shot.kind === "overview") {
        establishing.current = true;
        rig.snap({ ...goal, dist: goal.dist * 1.34, el: goal.el + 0.17, az: goal.az - 0.34 });
      } else rig.snap(goal);
      return;
    }
    if (shot.kind === "approach") {
      if (reduced) {
        rig.snap(goal);
        onEntered(shot.slug);
      } else rig.fly(goal, 620, easeInCubic, () => onEntered(shot.slug));
      return;
    }
    if (reduced) {
      rig.snap(goal);
      return;
    }
    if (establishing.current && !ready) return;
    establishing.current = false;
    // Private Local AI's note starts at the LifeOS workstation. The camera shows that origin first, then follows
    // the note along the conduit and settles on the vault, so the whole route is seen without framing it all at once.
    if (shot.kind === "station" && shot.slug === JOURNEY.to && journeyKey.current !== shotKey) {
      journeyKey.current = shotKey;
      const origin = poseFor({ ...shot, slug: JOURNEY.from }, stage);
      rig.fly(origin, JOURNEY.reveal, easeInOutCubic, () => rig.fly(goal, JOURNEY.follow, easeInOutCubic));
      return;
    }
    if (shot.kind !== "station" || shot.slug !== JOURNEY.to) journeyKey.current = null;
    // A long move lifts over what lies between; a short one glides.
    const travel = Math.hypot(goal.target[0] - rig.pose.target[0], goal.target[2] - rig.pose.target[2]);
    if (travel > 12) rig.fly(goal, 900, easeInOutCubic, undefined, travel * 0.18);
    else rig.glide(goal, 0.44);
    // `shot` is represented by `shotKey`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shotKey, measured, inset, sheet, reduced, rig]);

  // Once the world has drawn, finish the establishing move.
  useEffect(() => {
    if (!ready || !establishing.current || !measured) return;
    establishing.current = false;
    // The opening shot: the world settles into its framing from higher and a little round, slowing as it arrives.
    rig.fly(poseFor(shot, { width: measured.w, height: measured.h, insetRight: inset, insetBottom: sheet }), 1500, easeOutCubic);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Re-place the labels when what decides them changes.
  // Plates drop their blurb when zoomed, so their size changes with it.
  const zoomedNow = focus !== "all" || !!selected;
  useLayoutEffect(() => {
    plateSizes.current.clear();
  }, [zoomedNow]);
  useLayoutEffect(() => {
    labels.current = { focus, selected, hover, layout };
    place(rig.shown, true);
  }, [focus, selected, hover, layout, matching, place, rig, zoomedNow]);

  // Build the canvas after the page has painted, and never during a mode transition.
  useEffect(() => {
    if (mountCanvas || running || !measured || !tier || readOverride() === "2d") return;
    const idle = typeof window.requestIdleCallback === "function";
    const build = () => setMountCanvas(true);
    const id = idle ? window.requestIdleCallback(build, { timeout: 700 }) : globalThis.setTimeout(build, 120);
    return () => (idle ? window.cancelIdleCallback(id as number) : globalThis.clearTimeout(id));
  }, [mountCanvas, running, measured, tier]);

  const onReady = useCallback(() => setReady(true), []);

  // The view leans a little towards a mouse pointer, so the world has depth when the hand moves. It rests with
  // the pointer, never for touch or pen, never under reduced motion, and not while entering an exhibit.
  const leanOn = !reduced && ready && shot.kind !== "approach";
  useEffect(() => {
    if (!leanOn) rig.look(0, 0);
  }, [leanOn, rig]);
  const onLean = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!leanOn || event.pointerType !== "mouse") return;
    const r = event.currentTarget.getBoundingClientRect();
    const k = shot.kind === "station" ? 0.5 : 1;
    rig.look(((event.clientX - r.left) / r.width - 0.5) * 2 * k, ((event.clientY - r.top) / r.height - 0.5) * 2 * k);
  };
  const onLeanEnd = () => rig.look(0, 0);
  const byDistrict = districts.map((d) => ({ ...d, list: stations.filter((s) => s.district === d.id) }));
  const zoomed = focus !== "all" || !!selected;
  const selectedDistrict = selected && PLACEMENTS[selected] ? PLACEMENTS[selected].district : null;
  // Where the visitor is, said in words: the district they are in and the station they have open.
  const hereId = selectedDistrict ?? (focus !== "all" ? focus : null);
  const here = {
    district: districts.find((d) => d.id === hereId) ?? null,
    station: selected === "studio" ? "The Studio" : (stations.find((s) => s.slug === selected)?.short ?? null),
  };

  return (
    <>
      <div
        className="w-stage"
        ref={frame}
        data-ready={ready || undefined}
        data-paused={paused || undefined}
        data-shot={shot.kind}
        onPointerMove={onLean}
        onPointerLeave={onLeanEnd}
      >
        <div className="w-backdrop" aria-hidden="true" />
        {mountCanvas && tier && (
          <WorldCanvas
            rig={rig}
            tier={tier}
            hot={hover}
            selected={selected}
            matching={matching}
            visited={visited}
            reduced={reduced}
            paused={paused}
            onReady={onReady}
            onLost={onFailed}
          />
        )}
        {ready && tier && tier !== "low" && !reduced && (
          <div className="w-drift" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
        )}
        <div className="w-vignette" aria-hidden="true" />
        {!ready && (
          <p className="w-wait mono" aria-hidden="true">
            Building the studio…
          </p>
        )}
        {zoomed && (
          <nav className="w-where" aria-label="Where you are">
            <button type="button" className="w-back c-btn c-btn-paper" onClick={onOverview}>
              <ArrowLeft size={15} aria-hidden="true" /> All districts
            </button>
            {here.district && (
              <span className="w-crumb" data-district={here.district.id}>
                <i aria-hidden="true" />
                {here.station ? (
                  <button type="button" onClick={() => onDistrict(here.district!.id)}>
                    {here.district.label}
                  </button>
                ) : (
                  <b aria-current="location">{here.district.label}</b>
                )}
              </span>
            )}
            {here.station && (
              <span className="w-crumb w-crumb-here">
                <b aria-current="location">{here.station}</b>
              </span>
            )}
          </nav>
        )}
        {layout !== "phone" && card}
      </div>

      <div className="c-stage-inner w-overlay" ref={root} data-zoomed={focus !== "all" || undefined}>
        <div className="w-studio-slot" data-studio-slot="">
          <button
            type="button"
            className="w-pin w-studio"
            aria-pressed={selected === "studio"}
            onClick={onStudio}
            onPointerEnter={() => onHover("studio")}
            onPointerLeave={() => onHover(null)}
            onFocus={() => onHover("studio")}
            onBlur={() => onHover(null)}
          >
            <span className="sr-only">The Studio: welcome, about and your passport</span>
          </button>
          <span className="w-dot" aria-hidden="true" />
          <span className="w-plaque w-plaque-studio" aria-hidden="true">
            <span>The Studio</span>
            <small>Welcome, about and your passport</small>
          </span>
        </div>

        {byDistrict.map((d) => (
          <Fragment key={d.id}>
            <section
              className="c-island w-island"
              data-district={d.id}
              data-dim={focus !== "all" && focus !== d.id ? "" : undefined}
              aria-labelledby={`district-${d.id}`}
            >
              <header className="w-plate" data-plate={d.id} data-align={PLATES[d.id].align} data-zoomed={zoomed || undefined}>
                <h3 id={`district-${d.id}`}>{d.label}</h3>
                <p>
                  <span className="mono">{d.list.length} stations</span> <span className="w-plate-blurb">{d.blurb}</span>
                </p>
              </header>
              <ul className="c-pins">
                {d.list.map((s, index) => {
                  const p = projects.find((x) => x.slug === s.slug)!;
                  const isVisited = visited.includes(s.slug);
                  const tabbable = selectedDistrict === d.id ? selected === s.slug : index === 0;
                  return (
                    <li key={s.slug} className="w-slot" data-slot={s.slug} data-tier={s.tier} data-label="off">
                      <button
                        type="button"
                        className="c-pin w-pin"
                        data-station={s.slug}
                        data-tone={toneFor(s.slug)}
                        data-tier={s.tier}
                        data-match={matching.has(s.slug)}
                        data-visited={isVisited || undefined}
                        data-challenge={challenges.includes(s.slug) || undefined}
                        aria-pressed={s.slug === selected}
                        aria-describedby={`tier-${s.tier}`}
                        tabIndex={tabbable ? 0 : -1}
                        onClick={() => onChoose(s)}
                        onPointerEnter={() => onHover(s.slug)}
                        onPointerLeave={() => onHover(null)}
                        onFocus={() => onHover(s.slug)}
                        onBlur={() => onHover(null)}
                      >
                        <span className="sr-only">
                          {p.title}
                          {isVisited && ", explored"}
                        </span>
                      </button>
                      {/* The marker and plaque sit at the landmark's foot, beside its button. */}
                      <span className="w-dot" aria-hidden="true" />
                      <span className="w-plaque" aria-hidden="true">
                        <span>{s.short}</span>
                        <small>{tierWords[s.tier].label}</small>
                      </span>
                      {isVisited && (
                        <m.span
                          className="w-check"
                          aria-hidden="true"
                          initial={reduced ? false : { scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={micro.glide}
                        >
                          <Check size={9} />
                        </m.span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          </Fragment>
        ))}
      </div>
      {/* On a phone the panel is a sheet fixed to the bottom of the screen. A page wrapper above the stage is transformed, which would trap a fixed child, so the sheet is drawn from the page root. */}
      {layout === "phone" && measured && card && sheetHost() && createPortal(card, sheetHost()!)}
    </>
  );
}
