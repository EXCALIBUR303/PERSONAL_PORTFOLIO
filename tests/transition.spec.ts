import { expect, test, type Page } from "@playwright/test";

/**
 * The mode transition (src/lib/world-shift.ts, src/lib/transition). The
 * Precision Scanner is the default; `?transition=portal` brings back the
 * earlier portal ride.
 */
const html = (page: Page) => page.locator("html");
const leftovers = (page: Page) =>
  page.evaluate(() =>
    [...document.documentElement.attributes]
      .map((a) => a.name)
      .filter((n) => /^data-(shift|scanner|portal)$/.test(n))
      .concat(document.documentElement.getAttribute("style") ? ["style"] : [])
      .concat(document.getElementById("sc-morph") ? ["sc-morph"] : []),
  );
/** Records what a run showed, so a test can check a run that has already finished. */
const watch = (page: Page) =>
  page.evaluate(() => {
    const w = window as Window & { __seen?: string[] };
    w.__seen = [];
    new MutationObserver(() => {
      const v = document.documentElement.dataset.scanner;
      if (v) w.__seen!.push(v);
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-scanner", "data-shift"] });
    new MutationObserver(() => {
      if (document.querySelector(".sc-frame-svg")) w.__seen!.push("frame");
    }).observe(document.querySelector(".sc-layer")!, { childList: true, subtree: true });
  });
const seen = (page: Page) => page.evaluate(() => [...new Set((window as Window & { __seen?: string[] }).__seen)]);

const prepare = async (page: Page, path = "/") => {
  await page.goto(path);
  await page.locator(".mode-switcher").hover();
  await expect(page.locator(".sc-layer canvas")).toBeAttached({ timeout: 20_000 });
  await page.waitForTimeout(400);
  await watch(page);
};

test("the scanner runs in both directions, draws its frame and leaves nothing behind", async ({ page }) => {
  await prepare(page);
  await page.getByRole("button", { name: "Creative" }).click();
  await expect(html(page)).toHaveAttribute("data-mode", "creative");
  await expect.poll(() => leftovers(page), { timeout: 12_000 }).toEqual([]);
  expect(await seen(page)).toEqual(expect.arrayContaining(["to-creative", "frame"]));
  await expect(page.locator(".sc-frame-svg")).toHaveCount(0);
  await page.getByRole("button", { name: "Professional" }).click();
  await expect(html(page)).toHaveAttribute("data-mode", "pro");
  await expect.poll(() => leftovers(page), { timeout: 12_000 }).toEqual([]);
  expect(await seen(page)).toContain("to-pro");
  await expect(page.locator(".pg-card")).toHaveCount(6);
});

test("the hero scene is rebuilt without a loading message, and keeps the chosen category", async ({ page }) => {
  await prepare(page);
  await page.locator(".hx-lenses").getByRole("button", { name: /Algorithms/ }).click();
  await expect(page.locator(".s3-stage canvas")).toBeAttached({ timeout: 20_000 });
  await page.getByRole("button", { name: "Creative" }).click();
  await expect(html(page)).toHaveAttribute("data-mode", "creative");
  await expect.poll(() => leftovers(page), { timeout: 12_000 }).toEqual([]);
  // Record any loading message that is on screen while the scanner is running.
  await page.evaluate(() => {
    const w = window as Window & { __loadingSeen?: string[] };
    w.__loadingSeen = [];
    const look = () => {
      if (!document.documentElement.dataset.scanner) return;
      document.querySelectorAll(".s3-loading, .s3-wait").forEach((el) => w.__loadingSeen!.push(el.textContent ?? ""));
    };
    new MutationObserver(look).observe(document.documentElement, { childList: true, subtree: true, attributes: true });
    const tick = () => {
      look();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await page.getByRole("button", { name: "Professional" }).click();
  await expect(html(page)).toHaveAttribute("data-mode", "pro");
  await expect.poll(() => leftovers(page), { timeout: 12_000 }).toEqual([]);
  expect(await page.evaluate(() => (window as Window & { __loadingSeen?: string[] }).__loadingSeen)).toEqual([]);
  // The scene is there once the run has ended, in the category the visitor chose.
  await expect(page.locator(".s3-stage canvas")).toBeAttached({ timeout: 20_000 });
  await expect(page.locator(".hx-lenses").getByRole("button", { name: /Algorithms/ })).toHaveAttribute("aria-pressed", "true");
});

test("filters, search and scroll position survive the scanner", async ({ page }) => {
  await prepare(page, "/");
  await page.evaluate(() => document.getElementById("projects")!.scrollIntoView({ behavior: "instant" }));
  await page.waitForTimeout(300);
  await page.getByRole("searchbox", { name: "Search project worlds" }).fill("mazera");
  // Alt+M switches without a click, which would scroll the auto-hiding header into view first.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("Alt+M");
  await expect(html(page)).toHaveAttribute("data-mode", "creative");
  await expect(page.getByRole("searchbox", { name: "Search project worlds" })).toHaveValue("mazera");
  await expect(page.locator(".c-card")).toHaveCount(1);
  await expect.poll(() => leftovers(page), { timeout: 12_000 }).toEqual([]);
  // The visitor stays at the project section, not back at the top.
  expect(await page.evaluate(() => Math.round(document.getElementById("projects")!.getBoundingClientRect().top))).toBeLessThan(400);
  await page.keyboard.press("Alt+M");
  await expect(html(page)).toHaveAttribute("data-mode", "pro");
  await expect(page.locator(".project-card")).toHaveCount(1);
});

test("rapid switching settles on the last choice and releases the page", async ({ page }) => {
  await prepare(page);
  const creative = page.getByRole("button", { name: "Creative" });
  const pro = page.getByRole("button", { name: "Professional" });
  await creative.click();
  await page.waitForTimeout(60);
  await pro.click();
  await page.waitForTimeout(400);
  await creative.click();
  await expect(html(page)).toHaveAttribute("data-mode", "creative");
  await expect.poll(() => leftovers(page), { timeout: 12_000 }).toEqual([]);
  // Nothing is left blocking the page: the switch still answers.
  await pro.click();
  await expect(html(page)).toHaveAttribute("data-mode", "pro");
  await expect(pro).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => leftovers(page), { timeout: 12_000 }).toEqual([]);
});

test("a keyboard switch keeps focus on the switch and announces the mode", async ({ page }) => {
  await prepare(page);
  await page.getByRole("button", { name: "Creative" }).focus();
  await page.keyboard.press("Enter");
  await expect(html(page)).toHaveAttribute("data-mode", "creative");
  await expect(page.locator('[data-mode-option="creative"]')).toBeFocused();
  await expect(page.locator("#mode-announcer")).toHaveText("Creative mode");
  await expect.poll(() => leftovers(page), { timeout: 12_000 }).toEqual([]);
});

test("reduced motion changes the mode at once and never loads the scanner", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator(".mode-switcher").hover();
  await page.waitForTimeout(1500);
  await expect(page.locator(".sc-layer canvas")).toHaveCount(0);
  await page.getByRole("button", { name: "Creative" }).click();
  await expect(html(page)).toHaveAttribute("data-mode", "creative");
  expect(await leftovers(page)).toEqual([]);
  await expect(page.locator(".sc-frame-svg")).toHaveCount(0);
});

test("the particle layer loads only on intent, and the overlay never takes the pointer", async ({ page }) => {
  // Checked soon after the document is ready: the layer would also load by
  // itself a few seconds after the page settles.
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  await expect(page.locator(".sc-layer canvas")).toHaveCount(0);
  await page.locator(".mode-switcher").hover();
  await expect(page.locator(".sc-layer canvas")).toBeAttached({ timeout: 20_000 });
  const layer = page.locator(".sc-layer");
  await expect(layer).toHaveAttribute("aria-hidden", "true");
  expect(await layer.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe("none");
});

test("without WebGL the scanner still runs with its drawn frame", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type === "webgl" || type === "webgl2") return null;
      return original.apply(this, [type, ...args] as Parameters<typeof original>);
    } as typeof original;
  });
  await page.goto("/");
  await page.locator(".mode-switcher").hover();
  await page.waitForTimeout(600);
  await watch(page);
  await page.getByRole("button", { name: "Creative" }).click();
  await expect(html(page)).toHaveAttribute("data-mode", "creative");
  await expect.poll(() => leftovers(page), { timeout: 12_000 }).toEqual([]);
  expect(await seen(page)).toEqual(expect.arrayContaining(["to-creative", "frame"]));
  await expect(page.locator(".sc-layer canvas")).toHaveCount(0);
});

test("the earlier portal ride is still available on request", async ({ page }) => {
  await page.goto("/?transition=portal");
  await page.waitForTimeout(600);
  await watch(page);
  await page.getByRole("button", { name: "Creative" }).click();
  await expect(html(page)).toHaveAttribute("data-mode", "creative");
  await expect.poll(() => leftovers(page), { timeout: 12_000 }).toEqual([]);
  expect(await seen(page)).not.toContain("to-creative");
});

test("a transition that never finishes is ended by the watchdog and leaves the page usable", async ({ page }) => {
  // A browser whose view transition never becomes ready or finished: the mode must still change and nothing may linger.
  await page.addInitScript(() => {
    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      value: () => ({ ready: new Promise(() => {}), finished: new Promise(() => {}), skipTransition() {} }),
    });
  });
  await prepare(page);
  await page.getByRole("button", { name: "Creative" }).click();
  await expect(html(page)).toHaveAttribute("data-mode", "creative", { timeout: 8_000 });
  await expect.poll(() => leftovers(page), { timeout: 4_000 }).toEqual([]);
  await expect(page.locator(".sc-frame-svg")).toHaveCount(0);
  // The page answers: the switch works again.
  await page.getByRole("button", { name: "Professional" }).click();
  await expect(html(page)).toHaveAttribute("data-mode", "pro", { timeout: 8_000 });
});

test("hiding the tab during a run ends it at once instead of freezing it mid-motion", async ({ page }) => {
  await prepare(page);
  await page.getByRole("button", { name: "Creative" }).click();
  await page.waitForTimeout(250);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(html(page)).toHaveAttribute("data-mode", "creative");
  await expect.poll(() => leftovers(page), { timeout: 2_000 }).toEqual([]);
});
