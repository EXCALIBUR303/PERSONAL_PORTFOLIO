"use client";
import { lazyView } from "./lazy-view";
import { SceneWait } from "../skeleton/primitives";
import { useState } from "react";
import { Send } from "lucide-react";
import { useMode } from "@/components/mode";
import {
  auraPart,
  auraParts,
  hopText,
  requestRoute,
  type AuraPartId,
} from "./aura-data";
import { Callouts, useCallouts } from "./aura-callouts";
import { SceneToolbar, useSceneControls } from "./scene-controls";
import { useWebGL } from "./use-webgl";

const AuraCanvas = lazyView(() => import("./three/aura-canvas"), "Loading the 3D studio", "stage");
/** Fetches the 3D canvas code early, so a scene built during a mode switch is ready at once. */
export const preloadCanvas = () => AuraCanvas.preload();

function hopLabel(route: AuraPartId[], index: number) {
  const id = route[index];
  const half = Math.floor(route.length / 2);
  if (index === 0) return `${auraPart(id).label} ${hopText.out}`;
  if (index === route.length - 1) return `${auraPart(id).label} gets the reply`;
  if (index === half) return `${auraPart(id).label} ${hopText[id]}`;
  if (index > half)
    return id === "router"
      ? "the router hands the reply back"
      : hopText.back;
  return hopText[id];
}

/** Text version of the studio, shown without WebGL and read by screen readers. */
function FlatStudio({ selected, onSelect }: { selected: AuraPartId; onSelect: (id: AuraPartId) => void }) {
  const layers = [
    { id: "web", name: "Web layer · React and three.js" },
    { id: "bridge", name: "Bridge" },
    { id: "native", name: "Native layer · Swift" },
  ] as const;
  return (
    <div className="s3-flat">
      {layers.map((layer) => (
        <div key={layer.id} className="s3-flat-layer" data-layer={layer.id}>
          <span className="mono">{layer.name}</span>
          <div>
            {auraParts
              .filter((p) => p.layer === layer.id)
              .map((p) => (
                <button key={p.id} type="button" aria-pressed={selected === p.id} onClick={() => onSelect(p.id)}>
                  {p.label}
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AuraScene() {
  const [mode] = useMode();
  const webgl = useWebGL();
  const controls = useSceneControls();
  const [selected, setSelected] = useState<AuraPartId>("github-zone");
  const [runId, setRunId] = useState(0);
  const [route, setRoute] = useState<AuraPartId[]>([]);
  const [hop, setHop] = useState(-1);
  const [hovered, setHovered] = useState<AuraPartId | null>(null);
  const callouts = useCallouts(selected, hovered);
  const part = auraPart(selected);
  const canSend = Boolean(part.service);
  const busy = route.length > 0 && hop < route.length - 1;
  // The companion follows a request along its route, otherwise the selection.
  const focus = busy && hop >= 0 ? route[hop] : selected;
  const hoverProps = (id: AuraPartId) => ({
    onPointerEnter: () => setHovered(id),
    onPointerLeave: () => setHovered(null),
    onFocus: () => setHovered(id),
    onBlur: () => setHovered(null),
  });

  const select = (id: AuraPartId) => {
    setSelected(id);
    setRoute([]);
    setRunId(0);
    setHop(-1);
  };
  const send = () => {
    const next = requestRoute(selected);
    setRoute(next);
    setHop(-1);
    setRunId((n) => n + 1);
  };
  // Without a canvas (no WebGL), step the request through on a timer instead.
  const flatSend = () => {
    const next = requestRoute(selected);
    setRoute(next);
    setRunId((n) => n + 1);
    next.forEach((_, i) => window.setTimeout(() => setHop(i), i * 450));
  };

  const flat = <FlatStudio selected={selected} onSelect={select} />;
  return (
    <div className="lz-viz s3-aura">
      <SceneToolbar controls={controls} />
      {webgl ? (
        <AuraCanvas
          mode={mode}
          paused={controls.paused}
          resetKey={controls.resetKey}
          selected={selected}
          onSelect={select}
          route={route}
          runId={runId}
          onHop={setHop}
          fallback={flat}
          hovered={hovered}
          onHover={setHovered}
          focus={focus}
          overlay={<Callouts selected={selected} hovered={hovered} />}
          placeLabels={callouts.place}
          busy={busy}
        />
      ) : webgl === false ? (
        flat
      ) : (
        <SceneWait label="Checking for 3D support" />
      )}
      <details className="s3-parts-disclosure">
        <summary>
          Parts <span className="mono">{auraParts.length}</span>
        </summary>
        <div className="s3-parts" role="group" aria-label="AURA parts">
          {auraParts.map((p, i) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={selected === p.id}
              onClick={() => select(p.id)}
              {...hoverProps(p.id)}
            >
              <span className="s3-num" aria-hidden="true">
                {i + 1}
              </span>
              {p.label}
            </button>
          ))}
        </div>
      </details>
      <div className="s3-panel">
        <p className="lz-step-text">
          <span>{part.layer === "web" ? "Web layer" : part.layer === "bridge" ? "Between the layers" : "Native layer"}</span>
          <b>{part.label}.</b> {part.text}
        </p>
        <div className="lz-actions">
          <button type="button" onClick={webgl ? send : flatSend} disabled={!canSend}>
            <Send size={14} aria-hidden="true" /> Send a request
          </button>
        </div>
        {!canSend && (
          <p className="s3-hint">Choose a studio zone or the companion to send a request from it.</p>
        )}
        {route.length > 0 && (
          <ol className="s3-hops" aria-live="polite">
            {route.map((id, i) => (
              <li key={`${id}-${i}`} data-done={i <= hop || undefined} aria-current={i === hop ? "step" : undefined}>
                {hopLabel(route, i)}
              </li>
            ))}
          </ol>
        )}
        <p className="s3-fine">
          Illustration of the documented split. Which zone calls which service is simplified, the companion&apos;s
          movements are predefined, and no part of AURA runs here.
        </p>
      </div>
    </div>
  );
}
