import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Test HTML and interactions independently of GPU availability. A dedicated test
// below verifies the real WebGL path on the same production build.
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

test("renders all sections without runtime errors or broken internal links", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Making digital",
  );
  for (const id of ["projects", "about", "skills", "lab", "contact"])
    await expect(page.locator(`#${id}`)).toBeVisible();
  const broken = await page.locator('a[href^="#"]').evaluateAll((links) =>
    links
      .filter((link) => {
        const hash = link.getAttribute("href")!;
        return hash !== "#" && !document.querySelector(hash);
      })
      .map((link) => link.outerHTML),
  );
  expect(broken).toEqual([]);
  expect(errors).toEqual([]);
});

test("filters the project collection and restores all work", async ({
  page,
}) => {
  await page.goto("/#projects");
  await expect(page.locator(".project-card")).toHaveCount(4);
  await page
    .getByRole("button", { name: "Creative coding", exact: true })
    .click();
  await expect(page.locator(".project-card")).toHaveCount(1);
  await expect(page.locator(".project-card h3")).toHaveText("Resonance");
  await page.getByRole("button", { name: "Web apps", exact: true }).click();
  await expect(page.locator(".project-card")).toHaveCount(2);
  await page
    .getByRole("button", { name: "UI experiments", exact: true })
    .click();
  await expect(page.locator(".project-card")).toHaveCount(1);
  await expect(page.locator(".project-card h3")).toHaveText("Chromatic");
  await page.getByRole("button", { name: "All work" }).click();
  await expect(page.locator(".project-card")).toHaveCount(4);
});

test("project dialog supports keyboard, traps focus, and restores the trigger", async ({
  page,
}) => {
  await page.goto("/#projects");
  const trigger = page.getByRole("button", {
    name: "View Orbit project details",
  });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("heading", { name: "Orbit", exact: true }),
  ).toBeVisible();
  await expect(dialog).toContainText("Source not added yet");
  for (let i = 0; i < 5; i++) await page.keyboard.press("Tab");
  expect(
    await dialog.evaluate((el) => el.contains(document.activeElement)),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("mobile navigation opens, closes with Escape, and navigates", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Open navigation menu" });
  await toggle.click();
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Work" })
    .click();
  await expect(page).toHaveURL(/#projects$/);
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
});

for (const width of [320, 375, 768, 1024, 1440, 1920]) {
  test(`layout has no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const size = await page.evaluate(() => ({
      width: innerWidth,
      document: document.documentElement.scrollWidth,
      heading: document.querySelector("h1")!.getBoundingClientRect().right,
    }));
    expect(size.document).toBeLessThanOrEqual(size.width);
    expect(size.heading).toBeLessThanOrEqual(size.width);
    const clipped = await page
      .locator("h1,h2,.button")
      .evaluateAll((elements) =>
        elements
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.left < -1 || r.right > innerWidth + 1;
          })
          .map((el) => el.textContent),
      );
    expect(clipped).toEqual([]);
  });
}

test("color lab supports keyboard controls, palette changes, pause and reset", async ({
  page,
}) => {
  await page.goto("/#lab");
  const lab = page.locator("#lab");
  await lab.getByRole("button", { name: "Coral & blue" }).click();
  await expect(
    lab.getByRole("button", { name: "Coral & blue" }),
  ).toHaveAttribute("aria-pressed", "true");
  const slider = lab.getByRole("slider", { name: "Spread" });
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveValue("46");
  await lab.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(
    lab.getByRole("button", { name: "Play", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await lab.getByRole("button", { name: "Reset color field" }).click();
  await expect(slider).toHaveValue("45");
  await expect(
    lab.getByRole("button", { name: "Lilac & lime" }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("contact validates input and downloads an honest, unsent email draft", async ({
  page,
}) => {
  await page.goto("/#contact");
  const form = page.locator(".contact-form");
  await form.getByRole("button", { name: "Prepare a message" }).click();
  expect(
    await form
      .locator("input[name=name]")
      .evaluate((el) => (el as HTMLInputElement).validity.valueMissing),
  ).toBe(true);
  await form.getByLabel("Your name").fill("Test visitor");
  await form.getByLabel("Your email").fill("visitor@example.com");
  await form
    .getByLabel("What’s on your mind?")
    .fill("A thoughtful portfolio inquiry.");
  const downloaded = page.waitForEvent("download");
  await form.getByRole("button", { name: "Prepare a message" }).click();
  const draft = await downloaded;
  expect(draft.suggestedFilename()).toBe("portfolio-message.eml");
  await expect(form.getByRole("status")).toContainText("nothing was sent");
  await expect(
    page.getByRole("button", { name: "Copy email address" }),
  ).toBeDisabled();
});

test("fallback renders without WebGL and reduced motion stops the experiment", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".sculpture-fallback")).toBeVisible();
  await expect(page.locator(".art-bottom")).toContainText(
    "STATIC / CSS SCULPTURE",
  );
  const animation = await page
    .locator(".circle-a")
    .evaluate((el) => getComputedStyle(el).animationName);
  expect(animation).toBe("none");
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("dark and light themes pass automated WCAG A/AA checks", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  let result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(
    result.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        failure: n.failureSummary,
      })),
    })),
  ).toEqual([]);
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.locator(".portfolio-root")).toHaveAttribute(
    "data-theme",
    "light",
  );
  await expect(page.locator(".portfolio-root")).toHaveCSS(
    "background-color",
    "rgb(243, 242, 233)",
  );
  result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(
    result.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        failure: n.failureSummary,
      })),
    })),
  ).toEqual([]);
});

test("real WebGL sculpture loads and responds to its pause control", async ({
  browser,
}) => {
  // A fresh context bypasses this suite’s non-WebGL fixture.
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible({ timeout: 20000 });
  await expect(page.locator(".sculpture-fallback")).toHaveCount(0);
  await page.getByRole("button", { name: "Pause sculpture" }).click();
  await expect(
    page.getByRole("button", { name: "Play sculpture" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Play sculpture" }).click();
  await expect(
    page.getByRole("button", { name: "Pause sculpture" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
  await context.close();
});

test("touch devices defer the GPU scene until explicitly enabled", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto("/");
  const enable = page.getByRole("button", { name: "Try in 3D" });
  await expect(enable).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.locator(".sculpture-fallback")).toBeVisible();
  await enable.click();
  await expect(page.locator("canvas")).toBeVisible({ timeout: 20000 });
  await expect(page.locator(".sculpture-fallback")).toHaveCount(0);
  await context.close();
});
