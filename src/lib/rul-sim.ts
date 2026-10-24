/**
 * A made-up fleet of engines for the Predictive Maintenance scene, run through
 * small TypeScript copies of the repository's own data steps:
 *
 * - engine-level split: `grouped_train_val_units` (20% of engines, at least one)
 * - sensor filter: drop a sensor whose scaled training values have variance
 *   <= 1e-8 or at most 2 unique values (`CmapssPreprocessor.fit`)
 * - MinMax scaling fitted on training engines only
 * - capped target: RUL = min(last cycle - cycle, 125) (`add_train_rul`)
 * - 30-cycle window summary: mean, std, min, max, last, slope, delta
 *   (`_window_stats`)
 *
 * The engines, their sensor readings and which sensors are flat are invented
 * here. No C-MAPSS data, trained model or prediction is used.
 */

export const SENSORS = 21;
export const WINDOW = 30;
export const RUL_CAP = 125;
export const VALIDATION_FRACTION = 0.2;
export const FLEET = 12;

/** Sensors the walkthrough plots: one that rises, one that falls, one flat. */
export const PLOTTED = [3, 10, 4] as const;

export type Engine = { unit: number; life: number; readings: number[][] };
export type Fleet = {
  engines: Engine[];
  train: number[];
  validation: number[];
  /** The validation engine the walkthrough follows. */
  featured: Engine;
};

function rng(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function gaussian(random: () => number) {
  const u = Math.max(random(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random());
}

/** How each made-up sensor behaves. Indices are 0-based; names are 1-based. */
type Kind = "rise" | "fall" | "flat" | "twoLevel";
const kinds: Kind[] = Array.from({ length: SENSORS }, (_, s) =>
  [0, 4, 9, 15, 17].includes(s) ? "flat" : s === 5 ? "twoLevel" : s % 3 === 1 ? "fall" : "rise",
);
export const sensorName = (index: number) => `sensor_${index + 1}`;

/** Wear grows slowly, then quickly near the end of an engine's life. */
export const wear = (cycle: number, life: number) =>
  (Math.exp((3 * cycle) / life) - 1) / (Math.exp(3) - 1);

function makeEngine(unit: number, random: () => number): Engine {
  const life = 150 + Math.floor(random() * 120);
  const level = random() < 0.5 ? 0 : 1;
  const readings: number[][] = [];
  for (let c = 1; c <= life; c++) {
    const w = wear(c, life);
    readings.push(
      kinds.map((kind, s) => {
        const base = 100 + s * 37;
        const amp = base * (0.012 + (s % 4) * 0.004);
        if (kind === "flat") return base;
        if (kind === "twoLevel") return base + level;
        const noise = gaussian(random) * amp * 0.12;
        return base + (kind === "rise" ? 1 : -1) * amp * w + noise;
      }),
    );
  }
  return { unit, life, readings };
}

/** Same rule as the repository: shuffle units with a seed, hold out 20%. */
function splitUnits(units: number[], seed: number) {
  const random = rng(seed);
  const shuffled = [...units];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const nVal = Math.max(1, Math.round(units.length * VALIDATION_FRACTION));
  return {
    validation: shuffled.slice(0, nVal).sort((a, b) => a - b),
    train: shuffled.slice(nVal).sort((a, b) => a - b),
  };
}

export function makeFleet(seed = 7): Fleet {
  const random = rng(seed);
  const engines = Array.from({ length: FLEET }, (_, i) => makeEngine(i + 1, random));
  const { train, validation } = splitUnits(
    engines.map((e) => e.unit),
    seed + 42,
  );
  return { engines, train, validation, featured: engines[validation[0] - 1] };
}

export type Preprocessor = {
  min: number[];
  max: number[];
  kept: number[];
  dropped: { sensor: number; reason: "variance" | "unique" }[];
};

/** Fits scaling and the sensor filter on the training engines only. */
export function fitPreprocessor(fleet: Fleet): Preprocessor {
  const rows = fleet.engines.filter((e) => fleet.train.includes(e.unit)).flatMap((e) => e.readings);
  const min = Array.from({ length: SENSORS }, (_, s) => Math.min(...rows.map((r) => r[s])));
  const max = Array.from({ length: SENSORS }, (_, s) => Math.max(...rows.map((r) => r[s])));
  const kept: number[] = [];
  const dropped: Preprocessor["dropped"] = [];
  for (let s = 0; s < SENSORS; s++) {
    const range = max[s] - min[s];
    // sklearn's MinMaxScaler maps a constant column to 0.
    const scaled = rows.map((r) => (range ? (r[s] - min[s]) / range : 0));
    const mean = scaled.reduce((a, b) => a + b, 0) / scaled.length;
    const variance = scaled.reduce((a, b) => a + (b - mean) ** 2, 0) / scaled.length;
    const unique = new Set(scaled).size;
    if (variance <= 1e-8) dropped.push({ sensor: s, reason: "variance" });
    else if (unique <= 2) dropped.push({ sensor: s, reason: "unique" });
    else kept.push(s);
  }
  return { min, max, kept, dropped };
}

export const scale = (p: Preprocessor, sensor: number, value: number) => {
  const range = p.max[sensor] - p.min[sensor];
  return range ? (value - p.min[sensor]) / range : 0;
};

/** Training label for a cycle (1-based): cycles left, capped at 125. */
export const cappedRul = (life: number, cycle: number) => Math.min(life - cycle, RUL_CAP);

export type WindowStats = Record<"mean" | "std" | "min" | "max" | "last" | "slope" | "delta", number>;

/** The seven summary features XGBoost gets for one sensor in one window. */
export function windowStats(values: number[]): WindowStats {
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const std = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / n);
  const tMean = (n - 1) / 2;
  let num = 0;
  let den = 0;
  values.forEach((v, t) => {
    num += (t - tMean) * (v - mean);
    den += (t - tMean) ** 2;
  });
  return {
    mean,
    std,
    min: Math.min(...values),
    max: Math.max(...values),
    last: values[n - 1],
    slope: num / (den || 1),
    delta: values[n - 1] - values[0],
  };
}

/** Leaky alternative for comparison: windows assigned at random, 20% held out. */
export function windowSplit(fleet: Fleet, seed: number) {
  const random = rng(seed * 31 + 5);
  return fleet.engines.map((e) =>
    Array.from({ length: Math.floor(e.life / WINDOW) }, () =>
      random() < VALIDATION_FRACTION ? ("validation" as const) : ("train" as const),
    ),
  );
}

/**
 * Aggregate test-set results committed in the repository (results/FD00x/
 * model_comparison.csv at commit 9bb3742), mean and standard deviation over
 * seeds 42, 1337 and 2026, rounded to three decimals.
 */
export const RESULTS_COMMIT = "9bb3742068623e99945a7ba9d66011e4c312eb37";
export type ResultRow = {
  model: string;
  mae: [number, number];
  rmse: [number, number];
  nasa: [number, number];
};
export const publishedResults: Record<"FD001" | "FD004", ResultRow[]> = {
  FD001: [
    { model: "XGBoost", mae: [9.263, 0.368], rmse: [12.369, 0.161], nasa: [239.092, 9.234] },
    { model: "Transformer", mae: [9.886, 0.21], rmse: [13.574, 0.331], nasa: [338.386, 25.927] },
    { model: "LSTM", mae: [10.019, 0.174], rmse: [13.805, 0.294], nasa: [356.955, 38.283] },
    { model: "GRU", mae: [10.038, 0.41], rmse: [13.856, 0.465], nasa: [340.976, 47.797] },
  ],
  FD004: [
    { model: "XGBoost", mae: [11.177, 0.086], rmse: [15.924, 0.15], nasa: [1442.499, 166.958] },
    { model: "Transformer", mae: [11.382, 0.822], rmse: [16.387, 1.596], nasa: [1706.756, 679.18] },
    { model: "GRU", mae: [10.787, 0.518], rmse: [16.447, 1.009], nasa: [1909.921, 580.499] },
    { model: "LSTM", mae: [11.331, 0.936], rmse: [17.963, 2.509], nasa: [4575.788, 4984.535] },
  ],
};
