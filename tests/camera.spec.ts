import { test, expect } from "@playwright/test";
import { AZ, DISTRICTS, PLACEMENTS, poseFor, viewBlockedBy, type Stage } from "../src/components/creative/world/layout";
import { Projector } from "../src/components/creative/world/camera";

/*
 * Camera framings: every station must be in view (nothing between the camera and
 * the landmark) in the framings a visitor can reach, at desktop, tablet and
 * phone-landscape stages.
 */
const STAGES: [string, Stage][] = [
  ["desktop with panel", { width: 1296, height: 746, insetRight: 356 }],
  ["desktop 1000 with panel", { width: 940, height: 640, insetRight: 356 }],
  ["tablet with sheet", { width: 940, height: 640, insetRight: 0, insetBottom: 294 }],
  ["small tablet with sheet", { width: 700, height: 520, insetRight: 0, insetBottom: 239 }],
];

for (const [name, stage] of STAGES) {
  test(`every station is in clear view: ${name}`, () => {
    const blocked: string[] = [];
    for (const slug of Object.keys(PLACEMENTS))
      for (const within of ["district", "overview"] as const) {
        const by = viewBlockedBy(poseFor({ kind: "station", slug, within }, stage), slug);
        if (by) blocked.push(`${slug} (${within}) behind ${by}`);
      }
    expect(blocked).toEqual([]);
  });
}

test("the blocking check can fire", () => {
  // A camera on the far side of the Studio, looking at the Systems garage across it, is blocked.
  const garage = PLACEMENTS["smart-parking-dbms"];
  const behind = { target: [garage.base[0], garage.base[1] + 1, garage.base[2]] as [number, number, number], dist: 40, az: 0, el: 0.05, fov: 26 };
  // Walk the azimuth round: at least one direction must be blocked by something, or the check is not testing anything.
  let sawBlock = false;
  for (let a = 0; a < Math.PI * 2; a += 0.1) if (viewBlockedBy({ ...behind, az: a }, "smart-parking-dbms")) sawBlock = true;
  expect(sawBlock).toBe(true);

  // The fallback turn is a safeguard: in today's layout no station's straight-on framing is blocked at these
  // stages, so none is turned. If a future layout does hide one, the framing tests above fail unless it is turned clear.
  const stage = STAGES[0][1];
  let turned = 0;
  for (const slug of Object.keys(PLACEMENTS)) {
    const p = PLACEMENTS[slug];
    const pose = poseFor({ kind: "station", slug, within: "district" }, stage);
    if (Math.abs(pose.az - (AZ + DISTRICTS[p.district].turn)) > 1e-6) turned++;
  }
  console.log(`stations framed with a turn to clear the view: ${turned}`);
});

test("a portrait phone overview keeps the Studio and every district in view", () => {
  for (const [w, h] of [[342, 390], [360, 560], [390, 640]]) {
    const stage: Stage = { width: w, height: h, insetRight: 0 };
    const pose = poseFor({ kind: "overview" }, stage);
    const proj = new Projector();
    proj.set(pose, w, h);
    const centres: [string, [number, number, number]][] = [
      ["studio", [0, 1, 0]],
      ...(Object.keys(DISTRICTS) as (keyof typeof DISTRICTS)[]).map((d): [string, [number, number, number]] => [d, DISTRICTS[d].centre]),
    ];
    for (const [name, c] of centres) {
      const p = proj.project(...c);
      expect(p.visible, `${name} at ${w}x${h}`).toBe(true);
      expect(p.x, `${name} x at ${w}x${h}`).toBeGreaterThan(10);
      expect(p.x, `${name} x at ${w}x${h}`).toBeLessThan(w - 10);
      expect(p.y, `${name} y at ${w}x${h}`).toBeGreaterThan(10);
      expect(p.y, `${name} y at ${w}x${h}`).toBeLessThan(h - 10);
    }
  }
});
