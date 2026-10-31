import { expect, test, type Page } from "@playwright/test";

/**
 * The Creative studio's ambient motion (src/components/creative/world/ambient.ts): the map moves by itself while the
 * visitor does nothing, stops when it should (off screen, a hidden tab, "Pause motion", reduced motion) and leaves
 * interaction and the mode transitions as they were. The 3D canvas renders on demand, so the number of renders in a
 * window says whether anything is being drawn; CSS motion is read from the document's running animations.
 */
const watch = (page: Page, opts: { saveData?: boolean } = {}) =>
  page.addInitScript(({ saveData }) => {
    localStorage.setItem("portfolio-mode", "creative");
    if (saveData)
      Object.defineProperty(Navigator.prototype, "connection", {
        get: () => ({ saveData: true, addEventListener() {}, removeEventListener() {} }),
        configurable: true,
      });
    (window as Window & { __renders?: number }).__renders = 0;
    for (const C of [window.WebGL2RenderingContext, window.WebGLRenderingContext]) {
      if (!C) continue;
      const clear = C.prototype.clear;
      C.prototype.clear = function (this: WebGLRenderingContext, ...a: [number]) {
        if ((this.canvas as HTMLCanvasElement | undefined)?.closest?.(".w-canvas")) (window as Window & { __renders?: number }).__renders!++;
        return clear.apply(this, a);
      };
    }
  }, opts);

const renders = (page: Page) => page.evaluate(() => (window as Window & { __renders?: number }).__renders ?? 0);
/** Renders per second over `ms`. */
const rate = async (page: Page, ms: number) => {
  const a = await renders(page);
  await page.waitForTimeout(ms);
  return ((await renders(page)) - a) / (ms / 1000);
};
/** CSS animations running inside the map (compositor motion: clouds, ripples, the 2D map's lights). */
const running = (page: Page) =>
  page.evaluate(() =>
    document.getAnimations().filter((a) => a.playState === "running" && (a.effect as KeyframeEffect | null)?.target instanceof Element && ((a.effect as KeyframeEffect).target as Element).closest(".c-map")).length,
  );

const open3d = async (page: Page, query = "") => {
  await page.goto("/" + query);
  await page.mouse.move(1, 1);
  await page.waitForSelector(".w-stage[data-ready]", { state: "attached", timeout: 30_000 });
  await page.locator(".c-map").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1800);
};

test.describe("ambient motion, 3D map", () => {
  test("the map moves by itself, with no input at all", async ({ page }) => {
    await watch(page);
    await open3d(page);
    expect(await rate(page, 2000)).toBeGreaterThan(20);
    const a = await page.locator(".c-map").screenshot();
    await page.waitForTimeout(1500);
    const b = await page.locator(".c-map").screenshot();
    expect(a.equals(b)).toBe(false);
    expect(await running(page)).toBeGreaterThan(0);
  });

  test("it draws at 30 a second by default and at 60 on request, and a camera move is drawn at 60 either way", async ({ page }) => {
    await watch(page);
    await open3d(page);
    const slow = await rate(page, 2500);
    expect(slow).toBeGreaterThan(24);
    expect(slow).toBeLessThan(42);
    // A district move: the visitor's own motion is never skipped.
    const before = await renders(page);
    await page.getByRole("group", { name: "District" }).getByRole("button", { name: /^Algorithms/ }).click();
    await page.waitForTimeout(700);
    expect((await renders(page)) - before).toBeGreaterThan(30);
    // The same page at 60: clearly more draws (a browser's own frame rate sets the absolute number).
    await page.goto("/?ambient=60");
    await page.waitForSelector(".w-stage[data-ready]", { state: "attached", timeout: 30_000 });
    await page.locator(".c-map").scrollIntoViewIfNeeded();
    await page.waitForTimeout(1800);
    // (Counts include the shadow pass about every 220 ms, so the ratio is a little under two.)
    expect(await rate(page, 2500)).toBeGreaterThan(slow * 1.25);
  });

  test("it sleeps while the map is off screen and wakes when it is back", async ({ page }) => {
    await watch(page);
    await open3d(page);
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);
    expect(await rate(page, 2000)).toBeLessThan(2);
    await page.locator(".c-map").scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    expect(await rate(page, 2000)).toBeGreaterThan(20);
  });

  test("a hidden tab stops it and a visible one restarts it", async ({ page }) => {
    await watch(page);
    await open3d(page);
    const hide = (hidden: boolean) =>
      page.evaluate((h) => {
        Object.defineProperty(document, "hidden", { configurable: true, get: () => h });
        document.dispatchEvent(new Event("visibilitychange"));
      }, hidden);
    await hide(true);
    await page.waitForTimeout(1200);
    expect(await rate(page, 2000)).toBeLessThan(2);
    await hide(false);
    await page.waitForTimeout(1000);
    expect(await rate(page, 2000)).toBeGreaterThan(20);
  });

  test("Pause motion: keyboard, label, 3D and CSS motion, focus, the visit, and stations still work", async ({ page }) => {
    await watch(page);
    await open3d(page);
    const button = page.locator(".c-motion");
    await expect(button).toHaveText("Pause motion");
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(button).toHaveText("Resume motion");
    // Focus stays on the button (it is the same element, relabelled).
    expect(await page.evaluate(() => document.activeElement?.classList.contains("c-motion"))).toBe(true);
    await page.waitForTimeout(1200);
    expect(await rate(page, 2000)).toBeLessThan(2);
    expect(await running(page)).toBe(0);
    // Stations stay usable while paused.
    await page.locator('[data-station="aura"]').first().click({ force: true });
    await expect(page.locator('.w-pin[data-station="aura"]')).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Escape");
    // Held for the visit: a trip to Professional and back, and a reload in the same tab.
    await page.getByRole("button", { name: "Professional" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-mode", "pro");
    await expect.poll(() => page.evaluate(() => !document.documentElement.dataset.scanner), { timeout: 10_000 }).toBe(true);
    await page.getByRole("button", { name: "Creative" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-mode", "creative");
    await page.waitForSelector(".w-stage[data-ready]", { state: "attached", timeout: 30_000 });
    await page.locator(".c-map").scrollIntoViewIfNeeded();
    await expect(page.locator(".c-motion")).toHaveText("Resume motion");
    // The world's opening move after a return takes a moment even when motion is paused; wait for it to end.
    await page.waitForTimeout(2800);
    expect(await rate(page, 1500)).toBeLessThan(2);
    // Resume with the space bar.
    await page.locator(".c-motion").focus();
    await page.keyboard.press("Space");
    await expect(page.locator(".c-motion")).toHaveText("Pause motion");
    await page.waitForTimeout(1000);
    expect(await rate(page, 2000)).toBeGreaterThan(20);
    expect(await running(page)).toBeGreaterThan(0);
  });

  test("the scanner transitions are not disturbed by the ambient clock", async ({ page }) => {
    await watch(page);
    await open3d(page);
    for (let i = 0; i < 2; i++) {
      await page.getByRole("button", { name: "Professional" }).click();
      await expect(page.locator("html")).toHaveAttribute("data-mode", "pro");
      await expect.poll(() => page.evaluate(() => [...document.documentElement.attributes].map((a) => a.name).filter((n) => /^data-(shift|scanner)$/.test(n))), { timeout: 12_000 }).toEqual([]);
      await page.getByRole("button", { name: "Creative" }).click();
      await expect(page.locator("html")).toHaveAttribute("data-mode", "creative");
      await expect.poll(() => page.evaluate(() => [...document.documentElement.attributes].map((a) => a.name).filter((n) => /^data-(shift|scanner)$/.test(n))), { timeout: 12_000 }).toEqual([]);
    }
    await page.waitForSelector(".w-stage[data-ready]", { state: "attached", timeout: 30_000 });
    await page.locator(".c-map").scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    expect(await rate(page, 2000)).toBeGreaterThan(20);
  });
});

test.describe("tiers and preferences", () => {
  test("reduced motion is static: nothing is drawn, nothing runs, and there is nothing to pause", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await watch(page);
    await open3d(page);
    await expect(page.locator(".c-motion")).toHaveCount(0);
    expect(await rate(page, 3000)).toBeLessThan(1);
    expect(await running(page)).toBe(0);
    const a = await page.locator(".c-map").screenshot();
    await page.waitForTimeout(1500);
    expect((await page.locator(".c-map").screenshot()).equals(a)).toBe(true);
  });

  test("the low tier and Save-Data draw only short events, and sleep in between", async ({ page }) => {
    for (const mode of ["low", "saver"] as const) {
      await watch(page, { saveData: mode === "saver" });
      await open3d(page, mode === "low" ? "?world=low" : "");
      const samples: number[] = [];
      for (let i = 0; i < 24; i++) {
        const a = await renders(page);
        await page.waitForTimeout(500);
        samples.push((await renders(page)) - a);
      }
      expect(Math.min(...samples), `${mode}: sleeps between events`).toBe(0);
      expect(Math.max(...samples), `${mode}: draws during an event`).toBeGreaterThan(5);
      // The compositor's motion still runs, so the map is not lifeless.
      expect(await running(page)).toBeGreaterThan(0);
      await page.goto("about:blank");
    }
  });
});

test.describe("ambient motion, 2D map", () => {
  test("the illustrated map moves by itself and pauses", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("portfolio-mode", "creative"));
    await page.goto("/?world=2d");
    await page.waitForSelector('.c-map[data-engine="2d"]');
    await page.locator(".c-map").scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    expect(await running(page)).toBeGreaterThan(5);
    await page.locator(".c-motion").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".c-motion")).toHaveText("Resume motion");
    await page.waitForTimeout(500);
    expect(await running(page)).toBe(0);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);
    expect(await running(page)).toBeGreaterThan(5);
  });

  test("the 2D map is still under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() => localStorage.setItem("portfolio-mode", "creative"));
    await page.goto("/?world=2d");
    await page.waitForSelector('.c-map[data-engine="2d"]');
    await page.locator(".c-map").scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    expect(await running(page)).toBe(0);
    await expect(page.locator(".c-motion")).toHaveCount(0);
  });
});
