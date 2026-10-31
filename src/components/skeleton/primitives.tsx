"use client";
import { useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { subscribeTransition, transition } from "@/lib/transition/state";
import { useSkeletonGate } from "./use-skeleton-gate";

/**
 * The loading skeleton system, shared by every place that waits for content (the Creative studio map has its
 * own drawing, studio-skeleton.tsx, and uses the same gate and the same wipe).
 *
 * Rules every skeleton here follows:
 *   - it has the footprint of what it stands for, so the content arrives without moving anything
 *   - it shows only if the content is not ready by `SKELETON_DELAY_MS`; content that is ready never shows one
 *   - it stays until the content is ready (no minimum time) and leaves with a wipe, or a short fade under
 *     reduced motion
 *   - it is hidden from assistive technology and cannot take focus (`aria-hidden`, `inert`); the region says it
 *     is busy (`aria-busy`) and, after a second, names the real operation in one status line
 *   - there is no progress figure: nothing here knows how far a download has got
 */

/** One line of text, at the height of the text it stands for. */
export function SkLine({ w = "100%", h = 12 }: { w?: number | string; h?: number }) {
  return <span className="sk-ph sk-line" style={{ width: typeof w === "number" ? `${w}px` : w, height: h }} />;
}

/** A rounded block. */
export function SkBlock({ w = "100%", h = 40, r }: { w?: number | string; h?: number | string; r?: number }) {
  const style: CSSProperties = { width: typeof w === "number" ? `${w}px` : w, height: typeof h === "number" ? `${h}px` : h };
  if (r !== undefined) style.borderRadius = r;
  return <span className="sk-ph sk-block" style={style} />;
}

/** A pill: a button or a filter chip. */
export function SkChip({ w = 72 }: { w?: number }) {
  return <span className="sk-ph sk-chip" style={{ width: w }} />;
}

/** A row of skeleton pieces. */
export function SkRow({ children }: { children: ReactNode }) {
  return <div className="sk-row">{children}</div>;
}

/**
 * The framed viewport of a scene: the footprint of `.s3-stage` (the same ratio, floor and ceiling), with the
 * page's faint grid behind whatever silhouette it holds.
 */
export function SkViewport({ children }: { children?: ReactNode }) {
  return <div className="sk-vp">{children}</div>;
}

/** An isometric box outline, a stand-in for a 3D model. */
function ModelOutline() {
  return (
    <svg className="sk-model" viewBox="0 0 200 140" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 5" strokeLinejoin="round">
        <path d="M100 22 L168 56 L168 100 L100 134 L32 100 L32 56 Z" />
        <path d="M100 22 L100 66 M32 56 L100 90 L168 56 M100 90 L100 134" />
      </g>
    </svg>
  );
}

/** A chart frame: bars standing on an axis. */
function BarsOutline() {
  return (
    <svg className="sk-model" viewBox="0 0 200 140" aria-hidden="true" focusable="false">
      <g fill="currentColor" opacity="0.7">
        {[44, 72, 58, 96, 80, 112].map((h, i) => (
          <rect key={i} x={26 + i * 26} y={124 - h} width={16} height={h} rx={3} />
        ))}
      </g>
      <path d="M18 124 H184 M18 14 V124" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

/** A list of documents: a square icon and two lines each. */
function RowsOutline() {
  return (
    <div className="sk-doc-rows">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="sk-doc-row">
          <SkBlock w={28} h={28} r={6} />
          <div className="sk-doc-lines">
            <SkLine w="68%" />
            <SkLine w="42%" h={9} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** `scene`: a whole scene (toolbar, viewport, controls). `stage`: only the viewport. `data` and `document`: the viewport holds a chart or a document list. */
export type SceneVariant = "scene" | "stage" | "data" | "document";

/**
 * A scene waiting for its code: the toolbar row, the viewport with a silhouette of what it will hold, and the
 * row of controls below, so the scene's frame is where the finished scene's frame will be.
 */
export function SceneSkeleton({ variant = "scene" }: { variant?: SceneVariant }) {
  const model = variant === "scene" || variant === "stage" ? <ModelOutline /> : variant === "data" ? <BarsOutline /> : <RowsOutline />;
  if (variant === "stage") return <SkViewport>{model}</SkViewport>;
  return (
    <div className="sk-scene" data-variant={variant}>
      <SkRow>
        <SkChip w={92} />
        <SkChip w={64} />
        <SkLine w="18%" h={10} />
      </SkRow>
      <SkViewport>{model}</SkViewport>
      <SkRow>
        <SkChip w={76} />
        <SkChip w={76} />
        <SkChip w={76} />
      </SkRow>
    </div>
  );
}

/**
 * A 16:9 media frame waiting for its poster or video: the poster area, a control row (a play disc, a scrubber and
 * two chips) and two caption lines. It fills the frame, which already holds its ratio.
 */
export function MediaSkeleton() {
  return (
    <div className="sk-media">
      <div className="sk-media-poster">
        <span className="sk-ph sk-media-play" />
      </div>
      <div className="sk-media-bar">
        <SkBlock w={26} h={26} r={13} />
        <SkLine w="46%" h={6} />
        <SkChip w={52} />
        <SkChip w={52} />
      </div>
      <div className="sk-media-caps">
        <SkLine w="58%" h={9} />
        <SkLine w="34%" h={9} />
      </div>
    </div>
  );
}

/** True while a mode transition is running, so a skeleton under it is already in place when it reveals the page. */
const transitionRunning = () => transition.running && transition.style === "scanner";

/**
 * The covering layer of a skeleton, with its clocks. It stays out of sight for the first `SKELETON_DELAY_MS`
 * (content that is ready sooner never shows one), fills the region while the content is not there (`flow`: in
 * the layout, so it gives the region its footprint; otherwise laid over a region that already has one), and
 * leaves with a wipe the moment `ready` is true. Under a running mode transition it is in place at once and its
 * clocks start when the transition ends. After a second of waiting it names the real operation in one status
 * line; after eight it says plainly that this is taking longer than usual.
 */
export function SkeletonCover({
  ready,
  skeleton,
  label,
  slowLabel = "Still loading. This is taking longer than usual.",
  flow = false,
  tone,
}: {
  ready: boolean;
  skeleton: ReactNode;
  label: string;
  slowLabel?: string;
  flow?: boolean;
  tone?: "dark";
}) {
  const hold = useSyncExternalStore(subscribeTransition, transitionRunning, () => false);
  const gate = useSkeletonGate(ready, hold);
  return (
    <>
      {gate.phase !== "done" && (
        <div className="sk-layer sk-cover" data-phase={gate.phase} data-flow={flow && !ready ? "flow" : "overlay"} data-tone={tone} aria-hidden="true" {...{ inert: true }}>
          {skeleton}
          <span className="sk-shimmer" />
          <span className="sk-edge" />
        </div>
      )}
      {(gate.status || gate.slow) && (
        <p className="sk-status mono" role="status">
          {gate.slow ? slowLabel : label}
        </p>
      )}
    </>
  );
}

/**
 * Shows `skeleton` in place of `children` until `ready`, then wipes it away over the content. `children` is
 * rendered only when `ready`; the wrapper is always there, so the content is never remounted. The region is
 * marked busy for assistive technology while it waits.
 */
export function SkeletonSwap({
  ready,
  skeleton,
  label,
  slowLabel,
  className,
  tone,
  children,
}: {
  ready: boolean;
  skeleton: ReactNode;
  /** The real operation, shown as one status line once the skeleton has been up for a second. */
  label: string;
  slowLabel?: string;
  className?: string;
  tone?: "dark";
  children?: ReactNode;
}) {
  return (
    <div className={`sk-swap${className ? ` ${className}` : ""}`} aria-busy={!ready || undefined} data-tone={tone}>
      {ready && children}
      <SkeletonCover ready={ready} skeleton={skeleton} label={label} slowLabel={slowLabel} flow tone={tone} />
    </div>
  );
}

/** A tile that waits for something quick (feature detection): it shows only if the wait is not quick. */
export function SceneWait({ label }: { label: string }) {
  return (
    <SkeletonSwap ready={false} skeleton={<SceneSkeleton variant="stage" />} label={label}>
      {null}
    </SkeletonSwap>
  );
}
