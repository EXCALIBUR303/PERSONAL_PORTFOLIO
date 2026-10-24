"use client";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  depot,
  orders,
  selectOrders,
  sequenceInfo,
  sequenceRoute,
  spanningTree,
  type SelectionStrategy,
  type SequenceStrategy,
} from "@/lib/lastmile";

const CAPACITY = 22;
const stages = ["Orders", "Fill the van", "Spanning tree", "Route"] as const;

/** Last Mile DAA stages on the eight sample orders in lib/lastmile. */
export default function LastMileScene() {
  const [stage, setStage] = useState(0);
  const [pick, setPick] = useState<SelectionStrategy>("knapsack");
  const [order, setOrder] = useState<SequenceStrategy>("twoopt");
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
  const chosen = new Set(selection.chosen.map((o) => o.id));
  const path = route.route.map((i) => `${points[i].x},${points[i].y}`).join(" ");

  return (
    <div className="lz-viz fl-lastmile">
      <ol className="lz-stages" aria-label="Pipeline stages">
        {stages.map((name, i) => (
          <li key={name} aria-current={i === stage ? "step" : undefined}>
            <span>{i + 1}</span>
            {name}
          </li>
        ))}
      </ol>
      <svg className="fl-map" viewBox="-4 -4 108 108" role="img" aria-label={`Depot and eight sample orders, stage ${stage + 1}: ${stages[stage]}`}>
        <rect x="-4" y="-4" width="108" height="108" className="fl-ground" />
        {stage === 2 &&
          tree.edges.map(([a, b]) => (
            <line key={`${a}-${b}`} x1={points[a].x} y1={points[a].y} x2={points[b].x} y2={points[b].y} className="fl-tree" />
          ))}
        {stage === 3 && <polygon points={path} className="fl-route" />}
        {orders.map((o) => (
          <g key={o.id} className="fl-stop" data-out={stage >= 1 && !chosen.has(o.id) || undefined}>
            <circle cx={o.x} cy={o.y} r={4.2} />
            <text x={o.x} y={o.y + 1.4} textAnchor="middle">{o.id}</text>
            {stage <= 1 && (
              <text x={o.x} y={o.y + 9} textAnchor="middle" className="fl-small">
                {o.weight}kg · {o.value}
              </text>
            )}
          </g>
        ))}
        <rect x={depot.x - 4.5} y={depot.y - 4.5} width="9" height="9" className="fl-depot" />
        <text x={depot.x} y={depot.y + 1.4} textAnchor="middle" className="fl-depot-text">D</text>
      </svg>
      {stage === 1 && (
        <div className="lz-seg" role="group" aria-label="Selection">
          <button type="button" aria-pressed={pick === "greedy"} onClick={() => setPick("greedy")}>Greedy by value per kg</button>
          <button type="button" aria-pressed={pick === "knapsack"} onClick={() => setPick("knapsack")}>Knapsack · best fit</button>
        </div>
      )}
      {stage === 3 && (
        <div className="lz-chips" role="group" aria-label="Route ordering">
          {(Object.keys(sequenceInfo) as SequenceStrategy[]).map((s) => (
            <button key={s} type="button" aria-pressed={order === s} onClick={() => setOrder(s)}>
              {sequenceInfo[s].label} <small>{routes[s].length.toFixed(1)} units</small>
            </button>
          ))}
        </div>
      )}
      <p className="lz-note" aria-live="polite">
        {stage === 0 && "Eight sample orders with a weight and a value. The van carries 22 kg."}
        {stage === 1 &&
          `${pick === "greedy" ? "Greedy" : "Knapsack"} chooses ${selection.chosen.map((o) => o.id).join(", ")}: ${selection.weight} kg, value ${selection.value}. Greedy fills by value per kg; the knapsack checks every combination that fits.`}
        {stage === 2 && `The minimum spanning tree joins the depot and the chosen stops with ${tree.weight.toFixed(1)} units of edges. Any round trip is at least this long.`}
        {stage === 3 && sequenceInfo[order].blurb}
      </p>
      <div className="lz-actions">
        <button type="button" disabled={stage === 0} onClick={() => setStage(stage - 1)}>
          <ArrowLeft size={14} aria-hidden="true" /> Back
        </button>
        <button type="button" disabled={stage === stages.length - 1} onClick={() => setStage(stage + 1)}>
          Next stage <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
