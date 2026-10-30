import { test, expect, type Page } from "@playwright/test";
import { stations } from "../src/components/creative/studio/stations";

/*
 * The 3D world's landmarks: every station can be selected without a page error, the world
 * keeps drawing, and the scene stays inside its draw-call and triangle budget.
 * `?world=medium` forces the 3D world, so these run on any GPU the suite finds.
 */
type Split = { scene: { calls: number; triangles: number }; withShadows: { calls: number; triangles: number } };
const split = (page: Page) => page.evaluate(() => (window as unknown as { __world: { split: () => unknown } }).__world.split()) as Promise<Split>;

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("portfolio-mode", "creative"));
});

test("every station can be selected in the 3D world without an error", async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("/?world=medium");
  await page.waitForSelector(".w-stage[data-ready]", { state: "attached", timeout: 30000 });
  await expect.poll(() => page.evaluate(() => !!(window as unknown as { __world?: object }).__world)).toBe(true);

  const district = page.getByRole("group", { name: "District" });
  const names = { systems: /^Systems/, algorithms: /^Algorithms/, intelligence: /^Intelligence/ } as const;
  let current = "";
  for (const s of stations) {
    // As a visitor would: pick the district, let the camera arrive, then pick the station.
    if (s.district !== current) {
      current = s.district;
      await district.getByRole("button", { name: names[s.district as keyof typeof names] }).click();
      await page.waitForTimeout(1500);
    }
    // Back out to the district view first, as a visitor does between stations.
    await page.keyboard.press("Escape");
    await page.waitForTimeout(900);
    await page.locator(`[data-station="${s.slug}"]`).click({ force: true });
    await expect(page.locator(`[data-station="${s.slug}"]`)).toHaveAttribute("aria-pressed", "true");
    // Let the flight and the landmark's reaction run a little.
    await page.waitForTimeout(500);
    const { scene } = await split(page);
    expect(scene.calls, `${s.slug} draws something`).toBeGreaterThan(40);
  }
  expect(errors).toEqual([]);
});

test("the scene stays inside its budget: 320 draw calls, 180k triangles, without the shadow pass", async ({ page }) => {
  await page.goto("/?world=medium");
  await page.waitForSelector(".w-stage[data-ready]", { state: "attached", timeout: 30000 });
  await expect.poll(() => page.evaluate(() => !!(window as unknown as { __world?: object }).__world)).toBe(true);
  await page.waitForTimeout(1500);
  const { scene, withShadows } = await split(page);
  expect(scene.calls).toBeLessThanOrEqual(320);
  expect(scene.triangles).toBeLessThanOrEqual(180_000);
  // The shadow pass is drawn only on frames where something moves; it must not grow without notice.
  expect(withShadows.calls).toBeLessThanOrEqual(560);
});

test("in each district view a station's name does not sit on its own landmark", async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?world=medium");
  await page.waitForSelector(".w-stage[data-ready]", { state: "attached", timeout: 30000 });
  const district = page.getByRole("group", { name: "District" });
  for (const name of [/^Systems/, /^Algorithms/, /^Intelligence/]) {
    await district.getByRole("button", { name }).click();
    await page.waitForTimeout(2500);
    const covered = await page.evaluate(() => {
      const hits: string[] = [];
      for (const slot of document.querySelectorAll<HTMLElement>('.w-slot[data-label="on"]')) {
        const pin = slot.querySelector<HTMLElement>(".w-pin")!.getBoundingClientRect();
        const plaque = slot.querySelector<HTMLElement>(".w-plaque")!.getBoundingClientRect();
        const overlap = Math.min(pin.right, plaque.right) - Math.max(pin.left, plaque.left) > 2 && Math.min(pin.bottom, plaque.bottom) - Math.max(pin.top, plaque.top) > 2;
        if (overlap) hits.push(slot.dataset.slot!);
      }
      return hits;
    });
    expect(covered, `${name} view`).toEqual([]);
  }
});
