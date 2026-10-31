import { test, expect } from "@playwright/test";
import { projects } from "../src/data/projects";
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
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
test("hero categories change the scene and its meaningful destination", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "02 / Algorithms", exact: true })
    .click();
  await expect(page.locator(".lz-head h2")).toHaveText("Watch a search think.");
  await expect(page.locator(".lz-caption a")).toHaveAttribute(
    "href",
    "/projects/mazera-ai-maze-solver/",
  );
  await page
    .getByRole("button", { name: "03 / Intelligence", exact: true })
    .click();
  await expect(page.locator(".lz-caption a")).toHaveAttribute(
    "href",
    "/projects/quadruped-rl/",
  );
});
test("collections, type filters, and hardware empty states reflect owner classification", async ({
  page,
}) => {
  await page.goto("/#projects");
  await page.getByRole("button", { name: /College Projects/ }).click();
  for (const title of ["SmartPark", "Last Mile DAA", "Mazera"])
    await expect(
      page.locator(".project-card h3, .pg-row-title strong").filter({ hasText: title }),
    ).toBeVisible();
  await page.getByRole("button", { name: "Hardware", exact: true }).click();
  await expect(page.locator(".gallery-empty")).toContainText(
    "No verified physical hardware project",
  );
  await page.getByRole("button", { name: /Personal Projects/ }).click();
  await expect(page.locator(".gallery-empty")).toBeVisible();
  await page.getByRole("button", { name: "Software", exact: true }).click();
  await expect(
    page.locator(".project-card h3, .pg-row-title strong").filter({ hasText: "Mazera" }),
  ).toHaveCount(0);
  await expect(
    page.locator(".project-card h3, .pg-row-title strong").filter({ hasText: "AERIS" }),
  ).toBeVisible();
});
test("quick view and browser navigation retain collection state", async ({
  page,
}) => {
  await page.goto("/#projects");
  await page.getByRole("button", { name: /College Projects/ }).click();
  await page
    .getByRole("button", { name: /Quick view of Campus Green Mobility/ })
    .click();
  await page
    .getByRole("region", { name: "Campus Green Mobility quick view" })
    .getByRole("link", { name: /Open project/ })
    .click();
  await expect(page).toHaveURL(/green-mobility/);
  await page.goBack();
  await expect(
    page.getByRole("button", { name: /College Projects/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.goForward();
  await expect(page).toHaveURL(/green-mobility/);
});
test("Last Mile DAA is a public college entry with source-backed architecture and repository link", async ({
  page,
}) => {
  await page.goto("/projects/last-mile-daa/");
  await expect(page.locator("h1")).toHaveText("Last Mile DAA");
  await expect(page.locator(".demo-type")).toHaveText(
    "Original project: Run locally",
  );
  await expect(page.locator(".private-project-note")).toHaveCount(0);
  await expect(page.locator("#how .architecture-explorer")).toBeVisible();
  await expect(page.locator(".ps-demonote")).toContainText(
    "not outputs of its Python solver",
  );
  await expect(
    page.getByRole("link", { name: "Open repository" }).first(),
  ).toBeVisible();
});
test("demo registry is complete and distinguishes original applications from simulations", () => {
  for (const project of projects) {
    expect(project.demo.runtimeStatus).not.toMatch(/in progress/i);
    expect(project.demo.testStatus).not.toMatch(/in progress/i);
    expect(project.demo.verifiedOn).toMatch(/^2026-10-(2\d|3[01])$/);
    if (project.demo.type === "embedded")
      expect(project.demo.url).toMatch(/^\/demos\/[a-z0-9-]+\/$/);
    else expect(project.demo.url).toBeNull();
    if (project.discipline === "Hardware")
      expect(project.classificationNote).toMatch(/physical|hardware/i);
  }
});
test("local commands copy and original Mazera loads only on request", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/projects/mazera-ai-maze-solver/");
  await expect(page.locator("iframe")).toHaveCount(0);
  await page.getByRole("button", { name: "Run locally", exact: true }).click();
  await expect(page.locator(".local-guide")).toHaveAttribute("open", "");
  await page
    .getByRole("button", { name: "Copy local startup commands" })
    .click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "npm run dev",
  );
  await page.getByRole("button", { name: "Load original app here" }).click();
  const frame = page.frameLocator("iframe");
  await expect(
    frame.getByRole("heading", { name: "AI Maze Solver", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Launch original app" }),
  ).toHaveAttribute("href", "/demos/mazera/");
  await page.getByRole("button", { name: "Close embedded app" }).click();
  await expect(page.locator("iframe")).toHaveCount(0);
});
