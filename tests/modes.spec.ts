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
  await expect(page.locator(".project-card")).toHaveCount(1);
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
