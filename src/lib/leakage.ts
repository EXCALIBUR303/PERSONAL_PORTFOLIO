/**
 * Sample-data illustration of the Predictive Maintenance split protocol.
 *
 * The project splits training and validation by engine before any fitting, and
 * builds 30-cycle windows inside each engine. This helper draws twelve sample
 * engines as rows of windows and assigns each window to train or validation
 * two ways, so a visitor can see why the order of those steps matters. The
 * engines and windows are synthetic; no C-MAPSS data or model is used.
 */
export const ENGINES = 12;
export const WINDOWS = 9;
export type Side = "train" | "validation";
export type SplitMode = "row" | "engine";

function rng(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export function splitEngines(mode: SplitMode, seed: number) {
  const random = rng(seed * 7919 + 13);
  const grid: Side[][] = Array.from({ length: ENGINES }, () =>
    Array<Side>(WINDOWS).fill("train"),
  );
  if (mode === "row") {
    for (const row of grid)
      for (let w = 0; w < WINDOWS; w++)
        row[w] = random() < 0.25 ? "validation" : "train";
  } else {
    const order = Array.from({ length: ENGINES }, (_, i) => i)
      .map((i) => ({ i, k: random() }))
      .sort((a, b) => a.k - b.k)
      .slice(0, Math.round(ENGINES / 4));
    for (const { i } of order) grid[i].fill("validation");
  }
  const shared = grid.filter(
    (row) => row.includes("train") && row.includes("validation"),
  ).length;
  const validationWindows = grid
    .flat()
    .filter((s) => s === "validation").length;
  return { grid, shared, validationWindows };
}
