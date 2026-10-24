import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type === "webgl" || type === "webgl2") return null;
      return original.apply(this, [type, ...args] as Parameters<
        typeof original
      >);
    } as typeof original;
  });
});

const html = (page: import("@playwright/test").Page) => page.locator("html");

test("first visit defaults to Professional mode", async ({ page }) => {
  await page.goto("/");
  await expect(html(page)).toHaveAttribute("data-mode", "pro");
  await expect(
    page.getByRole("button", { name: "Professional" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Creative" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});

test("switching mode changes the presentation without a reload or route change", async ({
  page,
}) => {
  await page.goto("/projects/last-mile-daa/");
  await page.evaluate(() => {
    (window as unknown as { __marker: string }).__marker = "same-document";
  });
  const before = await page
    .locator("h1")
    .evaluate((el) => getComputedStyle(el).fontFamily);
  await page.getByRole("button", { name: "Creative" }).click();
  await expect(html(page)).toHaveAttribute("data-mode", "creative");
  await expect(page).toHaveURL(/\/projects\/last-mile-daa\/?$/);
  expect(
    await page.evaluate(
      () => (window as unknown as { __marker?: string }).__marker,
    ),
  ).toBe("same-document");
  const after = await page
    .locator("h1")
    .evaluate((el) => getComputedStyle(el).fontFamily);
  expect(after).not.toBe(before);
  await expect(page.locator("h1")).toHaveText("Last Mile DAA");
});

test("the chosen mode survives a refresh and is applied before first paint", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Creative" }).click();
  expect(
    await page.evaluate(() => localStorage.getItem("portfolio-mode")),
  ).toBe("creative");
  await page.reload();
  await expect(html(page)).toHaveAttribute("data-mode", "creative");
  await expect(page.getByRole("button", { name: "Creative" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("an invalid stored value falls back to Professional", async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("portfolio-mode", "neon"),
  );
  await page.goto("/");
  await expect(html(page)).toHaveAttribute("data-mode", "pro");
});

test("mode switcher is keyboard operable and Alt+M toggles", async ({
  page,
}) => {
  await page.goto("/");
  const creative = page.getByRole("button", { name: "Creative" });
  await creative.focus();
  await page.keyboard.press("Enter");
  await expect(html(page)).toHaveAttribute("data-mode", "creative");
  await page.locator("body").click({ position: { x: 5, y: 300 } });
  await page.keyboard.press("Alt+KeyM");
  await expect(html(page)).toHaveAttribute("data-mode", "pro");
});

test("search and filters keep working after switching modes", async ({
  page,
}) => {
  await page.goto("/#projects");
  await page.getByRole("button", { name: "Creative" }).click();
  await page
    .getByRole("searchbox", { name: "Search project worlds" })
    .fill("mazera");
  await expect(page.locator(".c-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Professional" }).click();
  await expect(page.locator(".project-card")).toHaveCount(1);
  await expect(
    page.getByRole("searchbox", { name: "Search project worlds" }),
  ).toHaveValue("mazera");
});

test("reduced motion removes the mode transition and the custom cursor", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Creative" }).click();
  await expect(html(page)).toHaveAttribute("data-mode", "creative");
  await expect(html(page)).not.toHaveClass(/mode-switching/);
  await expect(page.locator(".cursor-dot")).toHaveCount(0);
  await expect(html(page)).not.toHaveClass(/has-cursor/);
});

test("the architecture walkthrough plays, pauses and scrubs", async ({
  page,
}) => {
  await page.goto("/projects/last-mile-daa/");
  const range = page.getByRole("slider", { name: "Scrub through components" });
  await expect(range).toHaveValue("0");
  await range.fill("3");
  await expect(page.locator(".component-inspector h3")).toHaveText(
    "Knapsack selection",
  );
  await page.getByRole("button", { name: "Play walkthrough" }).click();
  await expect(
    page.getByRole("button", { name: "Pause walkthrough" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pause walkthrough" }).click();
});

test("project cards show a playing canvas sketch and the hero sentence is exact", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveText(
    "Hi, I'm Sidharth. I build intelligent systems, and make them explorable.",
  );
  const canvases = page.locator(".project-card canvas.mini-anim");
  await expect(canvases.first()).toBeVisible();
  expect(await canvases.count()).toBeGreaterThan(5);
});

test("Creative renders its own component tree on the home page", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".engineering-hero")).toBeVisible();
  await expect(page.locator(".c-hero")).toHaveCount(0);
  await expect(page.locator(".project-card").first()).toBeVisible();
  await page.getByRole("button", { name: "Creative" }).click();
  await expect(page.locator(".c-hero")).toBeVisible();
  await expect(page.locator(".c-dock")).toBeVisible();
  await expect(page.locator(".c-board")).toBeVisible();
  await expect(page.locator(".c-term")).toHaveCount(1);
  await expect(page.locator(".c-map")).toBeVisible();
  await expect(page.locator(".engine-section")).toHaveCount(0);
  await expect(page.locator(".c-sheet-board")).toHaveCount(1);
  await expect(page.locator(".c-notebook")).toHaveCount(1);
  await expect(page.locator(".engineering-hero")).toHaveCount(0);
  await expect(page.locator(".project-card")).toHaveCount(0);
  await expect(page.locator(".site-footer")).toHaveCount(0);
  await expect(page.locator(".c-footer")).toBeVisible();
  await expect(page.locator("h1")).toHaveText(
    "Hi, I'm Sidharth. I build intelligent systems, and make them explorable.",
  );
  const canvases = page.locator(".c-card canvas.mini-anim");
  await expect(canvases.first()).toBeVisible();
  expect(await canvases.count()).toBeGreaterThan(5);
});

test("Creative gallery shares every filter and keeps the empty states", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("portfolio-mode", "creative"),
  );
  await page.goto("/#projects");
  await expect(page.locator(".c-card")).toHaveCount(20);
  await page.getByRole("button", { name: /College Projects/ }).click();
  const college = await page.locator(".c-card").count();
  expect(college).toBeGreaterThan(0);
  expect(college).toBeLessThan(20);
  await page.getByRole("button", { name: "Hardware", exact: true }).click();
  await expect(page.locator(".c-card")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: /Physical builds/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Reset filters/ }).click();
  await expect(page.locator(".c-card")).toHaveCount(20);
  await page.getByRole("button", { name: "Index view" }).click();
  await expect(page.locator(".c-board-list")).toBeVisible();
  await page.getByRole("button", { name: "Featured only" }).click();
  expect(await page.locator(".c-card").count()).toBeLessThan(20);
  await page.getByRole("button", { name: "Professional" }).click();
  await expect(
    page.locator(".gallery-view-toggle button").nth(1),
  ).toHaveAttribute("aria-pressed", "true");
});

test("Creative project page is a mission board over the same project data", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("portfolio-mode", "creative"),
  );
  await page.goto("/projects/last-mile-daa/");
  await expect(page.locator(".c-poster")).toBeVisible();
  await expect(page.getByRole("tab")).toHaveCount(4);
  await expect(page.locator(".pr-head")).toHaveCount(0);
  await expect(page.locator("h1")).toHaveText("Last Mile DAA");
  await expect(
    page.getByRole("tab", { name: /Discover the problem/ }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(".c-sticky")).toContainText("small fleet");
  await page.getByRole("tab", { name: /Try the demonstration/ }).click();
  await expect(page).toHaveURL(/#try$/);
  await expect(page.locator(".ps-demonote")).toContainText(
    "Sample-data walkthrough",
  );
  await page.getByRole("tab", { name: /Explore how it works/ }).click();
  await expect(page.locator(".architecture-explorer")).toBeVisible();
  await page
    .getByRole("tab", { name: /Inspect the technical decisions/ })
    .click();
  await expect(page.locator(".c-caution li").first()).toBeVisible();
  await expect(page.locator(".c-poster canvas.mini-anim")).toBeVisible();
  await page.getByRole("button", { name: "Professional" }).click();
  await expect(page.locator(".pr-head")).toBeVisible();
  await expect(page.locator(".c-poster")).toHaveCount(0);
  await expect(page).toHaveURL(/\/projects\/last-mile-daa\/#decisions$/);
});

test("mission tabs follow the keyboard and the URL hash", async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("portfolio-mode", "creative"),
  );
  await page.goto("/projects/mazera-ai-maze-solver/#how");
  await expect(
    page.getByRole("tab", { name: /Explore how it works/ }),
  ).toHaveAttribute("aria-selected", "true");
  await page.getByRole("tab", { name: /Explore how it works/ }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: /technical decisions/ }),
  ).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Home");
  await expect(
    page.getByRole("tab", { name: /Discover the problem/ }),
  ).toHaveAttribute("aria-selected", "true");
});

test("Creative contact is a guided terminal that only prepares a draft", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("portfolio-mode", "creative"),
  );
  await page.goto("/#contact");
  await expect(
    page.getByRole("link", { name: /sidharthsood303@gmail\.com/ }).first(),
  ).toHaveAttribute("href", "mailto:sidharthsood303@gmail.com");
  await page.getByRole("button", { name: "A project idea" }).click();
  const input = page.locator("#term-input");
  await input.fill("");
  await page.getByRole("button", { name: /^Enter/ }).click();
  await expect(page.locator(".c-term-error")).toContainText("name");
  await input.fill("Alex");
  await page.keyboard.press("Enter");
  await input.fill("not-an-email");
  await page.keyboard.press("Enter");
  await expect(page.locator(".c-term-error")).toContainText("email");
  await input.fill("alex@example.com");
  await page.keyboard.press("Enter");
  await page
    .locator("#term-input")
    .fill("I would like to talk about a project.");
  await page.getByRole("button", { name: /^Enter/ }).click();
  const draft = page.getByRole("link", { name: /Open in my email app/ });
  await expect(draft).toBeVisible();
  const href = (await draft.getAttribute("href"))!;
  expect(href).toContain("mailto:sidharthsood303@gmail.com?subject=");
  expect(decodeURIComponent(href)).toContain("Reply to: alex@example.com");
  await expect(page.locator(".c-term-log")).toContainText(
    "Nothing has been sent",
  );
  await page.getByRole("button", { name: "Start over" }).click();
  await expect(page.locator(".c-term-choices button")).toHaveCount(4);
});

test("World Shift reveals the other mode in place, and rapid toggling settles", async ({
  page,
}) => {
  await page.goto("/projects/mazera-ai-maze-solver/");
  await page.evaluate(() => ((window as unknown as { marker: number }).marker = 1));
  await page.getByRole("button", { name: "Creative" }).click();
  await expect(html(page)).toHaveAttribute("data-mode", "creative");
  await expect(html(page)).not.toHaveAttribute("data-shift", /.*/, {
    timeout: 3000,
  });
  expect(
    await page.evaluate(() => (window as unknown as { marker: number }).marker),
  ).toBe(1);
  expect(page.url()).toContain("/projects/mazera-ai-maze-solver/");
  await page.evaluate(async () => {
    const click = (m: string) =>
      document.querySelector<HTMLElement>(`[data-mode-option="${m}"]`)!.click();
    click("pro");
    await new Promise((r) => setTimeout(r, 90));
    click("creative");
    await new Promise((r) => setTimeout(r, 60));
    click("pro");
  });
  await expect(html(page)).toHaveAttribute("data-mode", "pro");
  await expect(html(page)).not.toHaveAttribute("data-shift", /.*/, {
    timeout: 3000,
  });
  expect(await page.evaluate(() => document.documentElement.getAttribute("style") || "")).toBe("");
  expect(await page.evaluate(() => localStorage.getItem("portfolio-mode"))).toBe("pro");
});
