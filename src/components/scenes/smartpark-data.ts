import { steps, type Mode } from "@/components/lens/lens-systems";

/**
 * The garage the SmartPark scene draws. The layout is an illustration made for
 * this portfolio; the sequence of events comes from the same step list the
 * project page uses (lens-systems.tsx), so the words and the picture agree.
 */
export type Tone = "free" | "locked" | "taken" | "conflict";
export type Pose = { x: number; z: number; rot: number; y?: number };
export type Bay = { id: string; x: number; z: number; y: number; level: "Ground" | "Deck"; row: number };

const SPACING = 1.15;
export const bayX = (i: number) => (i - 2.5) * SPACING;
/** Aisle runs along z = 0; bays sit either side of it. */
export const ROW_Z = { north: -2.1, south: 2.1 };
export const DECK_Y = 2.0;

const ground: Bay[] = Array.from({ length: 12 }, (_, i) => {
  const south = i >= 6;
  return {
    id: `A${String(i + 1).padStart(2, "0")}`,
    x: bayX(i % 6),
    z: south ? ROW_Z.south : ROW_Z.north,
    y: 0,
    level: "Ground",
    row: south ? 1 : 0,
  };
});
const deck: Bay[] = Array.from({ length: 6 }, (_, i) => ({
  id: `B${String(i + 1).padStart(2, "0")}`,
  x: bayX(i),
  z: ROW_Z.north,
  y: DECK_Y,
  level: "Deck",
  row: 0,
}));
export const bays: Bay[] = [...ground, ...deck];
export const bayById = (id: string) => bays.find((b) => b.id === id)!;

/** Bays already occupied in the drawing. A07 and A08 stay free for the demo. */
export const parked: { bay: string; color: string }[] = [
  { bay: "A01", color: "#8c93a6" },
  { bay: "A03", color: "#c9a46a" },
  { bay: "A04", color: "#6f8f86" },
  { bay: "A09", color: "#a58aa8" },
  { bay: "A11", color: "#8c93a6" },
  { bay: "B02", color: "#6f8f86" },
  { bay: "B05", color: "#c9a46a" },
];
const occupied = new Set(parked.map((p) => p.bay));
export const isOccupied = (id: string) => occupied.has(id);

export const TARGET_BAY = "A07";
export const OTHER_BAY = "A08";
const target = bayById(TARGET_BAY);
const other = bayById(OTHER_BAY);

const front: Pose = { x: target.x, z: 0, rot: 0 };
const inBay = (b: Bay, jitter = 0): Pose => ({ x: b.x + jitter, z: b.z + jitter * 0.4, rot: -Math.PI / 2 });

export type Ray = "solid" | "dashed" | null;
export type View = {
  car1: Pose;
  car2: Pose;
  /** What each car is asking the database about the target bay, if anything. */
  ray1: Ray;
  ray2: Ray;
  tone: Tone;
  locked: boolean;
  /** Bay the second car ends up in, drawn as taken. */
  otherTaken: boolean;
};

const views: Record<Mode, View[]> = {
  unsafe: [
    { car1: front, car2: { x: -5.2, z: 0, rot: 0 }, ray1: "solid", ray2: null, tone: "free", locked: false, otherTaken: false },
    { car1: front, car2: { x: -4.2, z: 0, rot: 0 }, ray1: "solid", ray2: "solid", tone: "free", locked: false, otherTaken: false },
    { car1: inBay(target), car2: { x: -4.2, z: 0, rot: 0 }, ray1: null, ray2: "solid", tone: "taken", locked: false, otherTaken: false },
    { car1: inBay(target), car2: inBay(target, 0.16), ray1: null, ray2: null, tone: "conflict", locked: false, otherTaken: false },
  ],
  safe: [
    { car1: front, car2: { x: -5.2, z: 0, rot: 0 }, ray1: "solid", ray2: null, tone: "locked", locked: true, otherTaken: false },
    { car1: front, car2: { x: -4.2, z: 0, rot: 0 }, ray1: "solid", ray2: "dashed", tone: "locked", locked: true, otherTaken: false },
    { car1: inBay(target), car2: { x: -4.2, z: 0, rot: 0 }, ray1: null, ray2: null, tone: "taken", locked: false, otherTaken: false },
    { car1: inBay(target), car2: inBay(other), ray1: null, ray2: "solid", tone: "taken", locked: false, otherTaken: true },
  ],
};

export const viewFor = (mode: Mode, step: number): View => views[mode][Math.min(step, views[mode].length - 1)];
export { steps };
export type { Mode };

/** Plain-language state of any bay, for the selection readout. */
export function describeBay(id: string, view: View): string {
  const b = bayById(id);
  const where = `${b.level} level`;
  if (id === TARGET_BAY) {
    const label = { free: "free", locked: "free but row-locked by Car 1", taken: "occupied by Car 1", conflict: "claimed by two sessions" }[view.tone];
    return `${id} · ${where} · ${label} (this is the demonstration bay)`;
  }
  if (id === OTHER_BAY) return `${id} · ${where} · ${view.otherTaken ? "occupied by Car 2, offered after the lock" : "free"}`;
  return `${id} · ${where} · ${occupied.has(id) ? "occupied (drawn for scale)" : "free"}`;
}
