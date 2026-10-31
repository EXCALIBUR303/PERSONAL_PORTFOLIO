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

test("the scene stays inside its budget: 320 draw calls, 110k triangles on the medium tier, without the shadow pass", async ({ page }) => {
  await page.goto("/?world=medium");
  await page.waitForSelector(".w-stage[data-ready]", { state: "attached", timeout: 30000 });
  await expect.poll(() => page.evaluate(() => !!(window as unknown as { __world?: object }).__world)).toBe(true);
  await page.waitForTimeout(1500);
  const { scene, withShadows } = await split(page);
  expect(scene.calls).toBeLessThanOrEqual(320);
  expect(scene.triangles).toBeLessThanOrEqual(110_000);
  // The shadow pass is drawn only on frames where something moves; it must not grow without notice.
  expect(withShadows.calls).toBeLessThanOrEqual(520);
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

test("ambient light drifts over the world, and stops under reduced motion and while the stage is paused", async ({ page, browser }) => {
  test.setTimeout(60_000);
  await page.goto("/?world=medium");
  await page.waitForSelector(".w-stage[data-ready]", { state: "attached", timeout: 30000 });
  const running = () => page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running" && (a.effect as KeyframeEffect)?.target?.closest?.(".w-drift")).length);
  await expect.poll(running).toBe(3);
  // The overlay never takes the pointer.
  expect(await page.evaluate(() => getComputedStyle(document.querySelector(".w-drift")!).pointerEvents)).toBe("none");

  // While the stage is paused (hidden, or an exhibit open) the layers hold still.
  await page.evaluate(() => document.querySelector(".w-stage")!.setAttribute("data-paused", ""));
  await expect.poll(running).toBe(0);
  await page.evaluate(() => document.querySelector(".w-stage")!.removeAttribute("data-paused"));

  const calm = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 1000 } });
  const still = await calm.newPage();
  await still.addInitScript(() => localStorage.setItem("portfolio-mode", "creative"));
  await still.goto("/?world=medium");
  await still.waitForSelector(".w-stage[data-ready]", { state: "attached", timeout: 30000 });
  expect(await still.locator(".w-drift").count()).toBe(0);
  await calm.close();
});

test("the view leans towards a mouse pointer, comes back to rest, and holds still under reduced motion", async ({ page, browser }) => {
  test.setTimeout(60_000);
  const studioAt = (p: Page) => p.locator(".w-studio").evaluate((el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
  const settle = (p: Page) => p.waitForTimeout(1800);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?world=medium");
  await page.waitForSelector(".w-stage[data-ready]", { state: "attached", timeout: 30000 });
  await page.locator(".w-stage").scrollIntoViewIfNeeded();
  await settle(page);
  const box = (await page.locator(".w-stage").boundingBox())!;
  await page.mouse.move(box.x + 6, box.y + box.height / 2);
  await settle(page);
  const left = await studioAt(page);
  await page.mouse.move(box.x + box.width - 6, box.y + box.height / 2);
  await settle(page);
  const right = await studioAt(page);
  expect(Math.abs(right[0] - left[0]), "the Studio moves across the stage as the pointer does").toBeGreaterThan(8);
  expect(Math.abs(right[0] - left[0]), "but only a little").toBeLessThan(120);
  await page.mouse.move(box.x - 40, box.y - 40);
  await settle(page);
  const rest = await studioAt(page);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await settle(page);
  const centre = await studioAt(page);
  expect(Math.abs(rest[0] - centre[0]) + Math.abs(rest[1] - centre[1]), "leaving the stage returns the view to its centre").toBeLessThan(3);

  const calm = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
  const still = await calm.newPage();
  await still.addInitScript(() => localStorage.setItem("portfolio-mode", "creative"));
  await still.goto("/?world=medium");
  await still.waitForSelector(".w-stage[data-ready]", { state: "attached", timeout: 30000 });
  await still.locator(".w-stage").scrollIntoViewIfNeeded();
  const b2 = (await still.locator(".w-stage").boundingBox())!;
  await still.mouse.move(b2.x + b2.width / 2, b2.y + b2.height / 2);
  await settle(still);
  const a = await studioAt(still);
  await still.mouse.move(b2.x + b2.width - 6, b2.y + b2.height / 2);
  await settle(still);
  const c = await studioAt(still);
  expect(Math.abs(a[0] - c[0]) + Math.abs(a[1] - c[1])).toBeLessThan(1);
  await calm.close();
});
