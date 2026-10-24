"use client";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Truck } from "lucide-react";
import { useMode } from "@/components/mode";
import {
  depot,
  selectOrders,
  sequenceInfo,
  sequenceRoute,
  spanningTree,
  type SelectionStrategy,
  type SequenceStrategy,
} from "@/lib/lastmile";
import LastMileFlat from "./flat/lastmile-scene";
import { SceneToolbar, useSceneControls } from "./scene-controls";
import { useWebGL } from "./use-webgl";

const CityNetCanvas = dynamic(() => import("./three/citynet-canvas"), {
  ssr: false,
  loading: () => <div className="s3-loading mono">Loading the 3D district…</div>,
});

const CAPACITY = 22;
const stages = ["Orders", "Fill the van", "Spanning tree", "Route"] as const;

/**
 * Last Mile DAA as a small delivery district. The stages and numbers come from
 * the same sample-order code as the flat walkthrough (lib/lastmile): eight
 * made-up orders and simplified versions of the project's algorithms. It is not
 * the project's Python solver.
 */
export default function LastMileScene() {
  const [mode] = useMode();
  const webgl = useWebGL();
  const controls = useSceneControls();
  const [stage, setStage] = useState(0);
  const [pick, setPick] = useState<SelectionStrategy>("knapsack");
  const [order, setOrder] = useState<SequenceStrategy>("twoopt");
  const [driveKey, setDriveKey] = useState(0);
  const selection = useMemo(() => selectOrders(pick, CAPACITY), [pick]);
  const points = useMemo(() => [depot, ...selection.chosen], [selection]);
  const tree = useMemo(() => spanningTree(points), [points]);
  const routes = useMemo(
    () =>
      Object.fromEntries(
        (Object.keys(sequenceInfo) as SequenceStrategy[]).map((s) => [s, sequenceRoute(points, s)]),
      ) as Record<SequenceStrategy, ReturnType<typeof sequenceRoute>>,
    [points],
  );
  const route = routes[order];
  const chosenIds = useMemo(() => new Set(selection.chosen.map((o) => o.id)), [selection]);

  if (webgl === false) return <LastMileFlat />;
  return (
    <div className="lz-viz fl-lastmile s3-city">
      <ol className="lz-stages" aria-label="Pipeline stages">
        {stages.map((name, i) => (
          <li key={name} aria-current={i === stage ? "step" : undefined}>
            <span>{i + 1}</span>
            {name}
          </li>
        ))}
      </ol>
      <SceneToolbar controls={controls} followLabel="the van" />
      {webgl ? (
        <CityNetCanvas
          points={points}
          chosenIds={chosenIds}
          stage={stage}
          treeEdges={tree.edges}
          route={route.route}
          driveKey={driveKey}
          following={controls.following}
          mode={mode}
          paused={controls.paused}
          resetKey={controls.resetKey}
          busy={stage === 3}
          fallback={<LastMileFlat />}
        />
      ) : (
        <div className="s3-loading mono">Checking for 3D support…</div>
      )}
      {stage === 1 && (
        <div className="lz-seg" role="group" aria-label="Selection">
          <button type="button" aria-pressed={pick === "greedy"} onClick={() => setPick("greedy")}>Greedy by value per kg</button>
          <button type="button" aria-pressed={pick === "knapsack"} onClick={() => setPick("knapsack")}>Knapsack · best fit</button>
        </div>
      )}
      {stage === 3 && (
        <>
          <div className="lz-chips" role="group" aria-label="Route ordering">
            {(Object.keys(sequenceInfo) as SequenceStrategy[]).map((s) => (
              <button key={s} type="button" aria-pressed={order === s} onClick={() => { setOrder(s); setDriveKey((k) => k + 1); }}>
                {sequenceInfo[s].label} <small>{routes[s].length.toFixed(1)} units</small>
              </button>
            ))}
          </div>
          <div className="lz-actions">
            <button type="button" onClick={() => setDriveKey((k) => k + 1)}>
              <Truck size={14} aria-hidden="true" /> Drive the route again
            </button>
          </div>
        </>
      )}
      <p className="lz-note" aria-live="polite">
        {stage === 0 && "Eight sample orders with a weight and a value. The van carries 22 kg."}
        {stage === 1 &&
          `${pick === "greedy" ? "Greedy" : "Knapsack"} chooses ${selection.chosen.map((o) => o.id).join(", ")}: ${selection.weight} kg, value ${selection.value}. Greedy fills by value per kg; the knapsack checks every combination that fits. Parcels left behind are grey with a cross.`}
        {stage === 2 && `The minimum spanning tree joins the depot and the chosen stops with ${tree.weight.toFixed(1)} units of edges, labelled on the roads. Any round trip is at least this long.`}
        {stage === 3 && `${sequenceInfo[order].blurb} The numbers on the roads are leg lengths in map units.`}
      </p>
      <div className="lz-actions">
        <button type="button" disabled={stage === 0} onClick={() => setStage(stage - 1)}>
          <ArrowLeft size={14} aria-hidden="true" /> Back
        </button>
        <button type="button" disabled={stage === stages.length - 1} onClick={() => { setStage(stage + 1); setDriveKey((k) => k + 1); }}>
          Next stage <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
      <p className="lz-fine">Sample orders: weights, values and positions are made up for this demo, and the district is drawn for this portfolio.</p>
    </div>
  );
}
