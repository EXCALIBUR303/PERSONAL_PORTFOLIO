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
  await expect(page.locator(".c-postcard")).toHaveCount(1);
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

test("Creative project page has its own layout over the same project data", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("portfolio-mode", "creative"),
  );
  await page.goto("/projects/last-mile-daa/");
  await expect(page.locator(".c-poster")).toBeVisible();
  await expect(page.locator(".c-tabs")).toBeVisible();
  await expect(page.locator(".world-header")).toHaveCount(0);
  await expect(page.locator("h1")).toHaveText("Last Mile DAA");
  await expect(page.locator("#world-demo")).toBeVisible();
  await expect(page.locator("#world-architecture")).toBeVisible();
  const features = await page.locator(".c-timeline li").count();
  expect(features).toBeGreaterThan(0);
  await expect(page.locator(".c-caution li").first()).toBeVisible();
  await expect(page.locator(".c-poster canvas.mini-anim")).toBeVisible();
  await page.getByRole("button", { name: "Professional" }).click();
  await expect(page.locator(".world-header")).toBeVisible();
  await expect(page.locator(".c-poster")).toHaveCount(0);
  await expect(page).toHaveURL(/\/projects\/last-mile-daa\/?$/);
});

test("both heroes switch lens and keep their explanation in sync", async ({
  page,
}) => {
  for (const mode of ["pro", "creative"]) {
    await page.addInitScript(
      (m) => localStorage.setItem("portfolio-mode", m),
      mode,
    );
    await page.goto("/");
    await page
      .getByRole("button", { name: "02 / Algorithms", exact: true })
      .click();
    await expect(page.locator(".hx-inspector")).toContainText(
      "Give the question a path.",
    );
    await expect(page.locator(".hx-inspector a")).toHaveAttribute(
      "href",
      "/projects/mazera-ai-maze-solver/",
    );
    await expect(
      page.getByRole("button", { name: "02 / Algorithms", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
  }
});

test("without WebGL the stage explains itself and keeps the lens controls", async ({
  page,
}) => {
  await page.goto("/");
  const stage = page.locator(".hx-stage");
  await expect(stage).toHaveAttribute("data-state", "unavailable", {
    timeout: 10000,
  });
  await expect(stage).toContainText("isn’t available");
  await expect(stage.locator("canvas")).toHaveCount(0);
  await page
    .getByRole("button", { name: "03 / Intelligence", exact: true })
    .click();
  await expect(page.locator(".hx-inspector")).toContainText(
    "Look beneath the prediction.",
  );
});
