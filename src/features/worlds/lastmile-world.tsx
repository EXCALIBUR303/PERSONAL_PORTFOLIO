"use client";
import { useMemo, useState } from "react";
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

const STRATEGIES: SequenceStrategy[] = [
  "nearest",
  "insertion",
  "twoopt",
  "exact",
];

/**
 * Last Mile DAA walkthrough: two stages of the project's pipeline on one small
 * sample instance. Stage 1 picks which orders fit a vehicle (greedy vs
 * knapsack). Stage 2 sequences the route through the chosen stops. Simplified
 * re-implementations on made-up data; not the project's solver.
 */
export default function LastMileWorld() {
  const [capacity, setCapacity] = useState(10);
  const [selection, setSelection] = useState<SelectionStrategy>("greedy");
  const [method, setMethod] = useState<SequenceStrategy>("nearest");
  const [showTree, setShowTree] = useState(false);

  const greedy = useMemo(() => selectOrders("greedy", capacity), [capacity]);
  const knap = useMemo(() => selectOrders("knapsack", capacity), [capacity]);
  const picked = selection === "greedy" ? greedy : knap;
  const points = useMemo(() => [depot, ...picked.chosen], [picked]);
  const exact = useMemo(() => sequenceRoute(points, "exact"), [points]);
  const result = useMemo(() => sequenceRoute(points, method), [points, method]);
  const tree = useMemo(() => spanningTree(points), [points]);
  const chosenIds = new Set(picked.chosen.map((o) => o.id));
  const gap = result.length - exact.length;
  const path = result.route
    .concat(result.route[0])
    .map((i) => `${points[i].x * 4},${points[i].y * 4}`)
    .join(" ");
  const order = result.route.map((i) =>
    i === 0 ? "Depot" : picked.chosen[i - 1].id,
  );

  return (
    <div className="interactive-module lm-module">
      <div className="lm-grid">
        <div className="lm-map-wrap">
          <svg
            className="lm-map"
            viewBox="0 0 400 400"
            role="img"
            aria-label={`Sample delivery map with ${picked.chosen.length} chosen orders. Route length ${result.length.toFixed(0)} units using ${sequenceInfo[method].label}.`}
          >
            <rect x="1" y="1" width="398" height="398" className="lm-field" />
            {showTree &&
              tree.edges.map(([a, b]) => (
                <line
                  key={`${a}-${b}`}
                  x1={points[a].x * 4}
                  y1={points[a].y * 4}
                  x2={points[b].x * 4}
                  y2={points[b].y * 4}
                  className="lm-tree"
                />
              ))}
            {points.length > 1 && (
              <polyline points={path} className="lm-route" />
            )}
            {orders.map((o) => (
              <g key={o.id} transform={`translate(${o.x * 4} ${o.y * 4})`}>
                <circle
                  r={13}
                  className={
                    chosenIds.has(o.id) ? "lm-stop lm-in" : "lm-stop lm-out"
                  }
                />
                <text y={4} textAnchor="middle" className="lm-label">
                  {o.id}
                </text>
              </g>
            ))}
            <rect
              x={depot.x * 4 - 11}
              y={depot.y * 4 - 11}
              width={22}
              height={22}
              rx={4}
              className="lm-depot"
            />
            <text
              x={depot.x * 4}
              y={depot.y * 4 + 4}
              textAnchor="middle"
              className="lm-label lm-label-on"
            >
              D
            </text>
          </svg>
          <p className="lm-legend">
            <span>
              <i className="lm-in" /> Chosen order
            </span>
            <span>
              <i className="lm-out" /> Left behind
            </span>
            <span>
              <i className="lm-dep" /> Depot
            </span>
          </p>
        </div>

        <div className="lm-controls">
          <section aria-labelledby="lm-step1">
            <h3 id="lm-step1">
              <span>1</span> Which orders fit?
            </h3>
            <label className="lm-slider">
              <span>
                Vehicle capacity: <b>{capacity}</b> units
              </span>
              <input
                type="range"
                min={4}
                max={20}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
              />
            </label>
            <div
              className="lz-seg"
              role="group"
              aria-label="Order selection method"
            >
              <button
                type="button"
                aria-pressed={selection === "greedy"}
                onClick={() => setSelection("greedy")}
              >
                Greedy · value per weight
              </button>
              <button
                type="button"
                aria-pressed={selection === "knapsack"}
                onClick={() => setSelection("knapsack")}
              >
                Knapsack · best fit
              </button>
            </div>
            <dl className="lm-compare">
              <div>
                <dt>Greedy value</dt>
                <dd>{greedy.value}</dd>
              </div>
              <div>
                <dt>Knapsack value</dt>
                <dd>{knap.value}</dd>
              </div>
            </dl>
            <p className="lz-note" aria-live="polite">
              {knap.value > greedy.value ? (
                <>
                  <b>Greedy loses {knap.value - greedy.value} here.</b> Taking
                  the best-looking order first leaves space that nothing fits
                  into. The knapsack checks combinations.
                </>
              ) : (
                <>
                  <b>A tie at this capacity.</b> Try capacity 10: greedy and
                  knapsack pick different orders.
                </>
              )}{" "}
              Chosen: {picked.chosen.map((o) => o.id).join(", ") || "none"} ·{" "}
              {picked.weight}/{capacity} units used.
            </p>
          </section>

          <section aria-labelledby="lm-step2">
            <h3 id="lm-step2">
              <span>2</span> In what order do we visit them?
            </h3>
            <div
              className="lz-chips"
              role="group"
              aria-label="Route sequencing method"
            >
              {STRATEGIES.map((name) => (
                <button
                  key={name}
                  type="button"
                  aria-pressed={method === name}
                  onClick={() => setMethod(name)}
                >
                  <span>{sequenceInfo[name].label}</span>
                </button>
              ))}
            </div>
            <dl className="lm-compare">
              <div>
                <dt>Route length</dt>
                <dd>{result.length.toFixed(0)}</dd>
              </div>
              <div>
                <dt>Best possible</dt>
                <dd>{exact.length.toFixed(0)}</dd>
              </div>
              <div>
                <dt>Extra distance</dt>
                <dd className={gap > 0.5 ? "lz-bad" : "lz-good"}>
                  {gap > 0.5 ? `+${gap.toFixed(0)}` : "0"}
                </dd>
              </div>
            </dl>
            <p className="lz-note" aria-live="polite">
              <b>{sequenceInfo[method].label}.</b> {sequenceInfo[method].blurb}{" "}
              Visits: {order.join(" → ")} → Depot.
            </p>
            <label className="lm-check">
              <input
                type="checkbox"
                checked={showTree}
                onChange={(e) => setShowTree(e.target.checked)}
              />
              Show the minimum spanning tree ({tree.weight.toFixed(0)} units, a
              lower bound for any round trip)
            </label>
          </section>
        </div>
      </div>
      <p className="module-disclaimer">
        Sample-data walkthrough. Eight made-up orders with straight-line
        distances, one vehicle, capacity only. Last Mile DAA itself runs these
        ideas as a seven-stage Python pipeline on a road graph with deadlines;
        nothing here is output from that solver.
      </p>
    </div>
  );
}
