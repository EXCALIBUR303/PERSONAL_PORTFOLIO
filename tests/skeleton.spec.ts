import { expect, test, type Page } from "@playwright/test";
import { worldOutline } from "../src/components/creative/world/outline";
import { projects } from "../src/data/projects";

test("the world's outline covers every island and every station, inside the stage", () => {
  for (const [w, h] of [
    [1292, 747],
    [820, 560],
    [342, 390],
  ] as const)
    for (const opening of [false, true]) {
      const world = worldOutline(w, h, opening);
      // The Studio, Systems, five Algorithms plates and their pier, and the Intelligence bowl.
      expect(world.islands).toHaveLength(9);
      expect(new Set(world.islands.map((i) => i.id))).toEqual(new Set(["studio", "systems", "algorithms", "intelligence"]));
      expect(world.feet).toHaveLength(projects.length);
      // At the settled camera every station foot is on the stage; the opening shot (higher, farther) keeps most.
      const inside = world.feet.filter((f) => f.visible).length;
      expect(inside, `${w}x${h} opening=${opening}`).toBeGreaterThanOrEqual(opening ? projects.length - 3 : projects.length - 1);
      for (const island of world.islands) expect(island.points.length).toBeGreaterThan(20);
    }
});

/**
 * Holds back by `ms` every script the page requests after its load event: the world's own code (not its styles). The hold is in place
 * before the page is requested and goes by the order in which the browser reports the load event and each request;
 * installing the route only after the load event had been reported instead raced the first of those requests, which
 * start a few tens of milliseconds after it (WebKit lost that race in some full runs).
 */
const holdCodeAfterLoad = async (page: Page, ms: number) => {
  let loaded = false;
  page.on("load", () => (loaded = true));
  await page.route("**/_next/static/**", async (route) => {
    if (loaded && route.request().resourceType() === "script") await new Promise((resolve) => setTimeout(resolve, ms));
    await route.continue();
  });
};

test("a slow world shows a content-shaped skeleton, says why after a second, and wipes away when ready", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("portfolio-mode", "creative"));
  await holdCodeAfterLoad(page, 3000);
  await page.goto("/");
  const stage = page.locator(".w-stage");
  // The studio map's own skeleton (other regions of the page have skeletons of their own).
  const sk = stage.locator(".sk-layer");
  await expect(sk).toBeAttached({ timeout: 6_000 });
  // It is decoration: hidden from assistive technology, never focusable, and the region says it is busy.
  await expect(sk).toHaveAttribute("aria-hidden", "true");
  expect(await sk.evaluate((el) => (el as HTMLElement).inert)).toBe(true);
  await expect(stage).toHaveAttribute("aria-busy", "true");
  expect(await sk.locator("path").count()).toBeGreaterThanOrEqual(9);
  // One status line, only after the skeleton has been on screen for a second.
  await expect(stage.locator(".sk-status")).toHaveText("Building the 3D studio", { timeout: 5_000 });
  // As soon as the world has drawn, the skeleton and the status are gone and the region is no longer busy.
  await expect(page.locator(".w-stage[data-ready]")).toBeAttached({ timeout: 20_000 });
  await expect(sk).toHaveCount(0, { timeout: 3_000 });
  await expect(stage.locator(".sk-status")).toHaveCount(0);
  await expect(stage).not.toHaveAttribute("aria-busy", "true");
});

test("with reduced motion the skeleton does not shimmer", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => localStorage.setItem("portfolio-mode", "creative"));
  await holdCodeAfterLoad(page, 2500);
  await page.goto("/");
  const stage = page.locator(".w-stage");
  await expect(stage.locator(".sk-layer")).toBeAttached({ timeout: 6_000 });
  expect(await stage.locator(".sk-shimmer").evaluate((el) => getComputedStyle(el).display)).toBe("none");
});
