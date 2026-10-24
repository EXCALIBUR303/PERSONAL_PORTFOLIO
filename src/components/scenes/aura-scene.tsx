"use client";
import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import { Send } from "lucide-react";
import { useMode } from "@/components/mode";
import {
  auraPart,
  auraParts,
  hopText,
  requestRoute,
  type AuraPartId,
} from "./aura-data";
import { SceneToolbar, useSceneControls } from "./scene-controls";
import { useWebGL } from "./use-webgl";

const AuraCanvas = dynamic(() => import("./three/aura-canvas"), {
  ssr: false,
  loading: () => <div className="s3-loading mono">Loading the 3D studio…</div>,
});

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
  const labels = useRef<Record<string, HTMLSpanElement | null>>({});
  const setLabel = useCallback((id: string, node: HTMLSpanElement | null) => {
    labels.current[id] = node;
  }, []);
  // Called every rendered frame with each label's screen position.
  const placeLabel = useCallback((id: string, x: number, y: number, visible: boolean) => {
    const el = labels.current[id];
    if (!el) return;
    el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    el.style.visibility = visible ? "visible" : "hidden";
  }, []);
  const part = auraPart(selected);
  const canSend = Boolean(part.service);

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
          labels={setLabel}
          placeLabel={placeLabel}
          busy={route.length > 0 && hop < route.length - 1}
        />
      ) : webgl === false ? (
        flat
      ) : (
        <div className="s3-loading mono">Checking for 3D support…</div>
      )}
      <div className="s3-parts" role="group" aria-label="AURA parts">
        {auraParts.map((p) => (
          <button key={p.id} type="button" aria-pressed={selected === p.id} onClick={() => select(p.id)}>
            {p.label}
          </button>
        ))}
      </div>
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
          Illustration of the documented split. Which zone calls which service is simplified, and no part of AURA runs here.
        </p>
      </div>
    </div>
  );
}
