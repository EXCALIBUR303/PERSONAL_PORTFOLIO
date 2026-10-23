import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { projects } from "../src/data/projects";

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

test("home renders all chapters with valid anchors and no runtime errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator("h1")).toHaveText(
    "Hi, I'm Sidharth. I build intelligent systems, and make them explorable.",
  );
  for (const id of [
    "projects",
    "skills",
    "engine",
    "about",
    "education",
    "experience",
    "milestones",
    "lab",
    "contact",
  ])
    await expect(page.locator(`#${id}`)).toBeVisible();
  const broken = await page.locator('a[href^="#"]').evaluateAll((links) =>
    links
      .filter((link) => {
        const href = link.getAttribute("href")!;
        return href !== "#" && !document.querySelector(href);
      })
      .map((link) => link.outerHTML),
  );
  expect(broken).toEqual([]);
  expect(errors).toEqual([]);
});

test("search, categories, featured filtering, and empty-state reset work", async ({
  page,
}) => {
  await page.goto("/#projects");
  await expect(page.locator(".project-card")).toHaveCount(projects.length);
  await page
    .getByRole("combobox", { name: "Filter projects by category" })
    .selectOption("Algorithms");
  await expect(
    page.locator(".project-card h3").filter({ hasText: "Mazera" }),
  ).toBeVisible();
  await expect(
    page.locator(".project-card h3").filter({ hasText: "AERIS" }),
  ).toBeVisible();
  await expect(
    page.locator(".project-card h3").filter({ hasText: "Student Burnout" }),
  ).toHaveCount(0);
  await page
    .getByRole("combobox", { name: "Filter projects by category" })
    .selectOption("All worlds");
  await page
    .getByRole("searchbox", { name: "Search project worlds" })
    .fill("PostgreSQL");
  await expect(
    page.locator(".project-card h3").filter({ hasText: "SmartPark" }),
  ).toBeVisible();
  await expect(
    page.locator(".project-card h3").filter({ hasText: "Mazera" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Clear project search" }).click();
  await page
    .getByRole("button", { name: "Featured only", exact: true })
    .click();
  await expect(page.locator(".project-card")).toHaveCount(6);
  await page
    .getByRole("searchbox", { name: "Search project worlds" })
    .fill("no-such-world");
  await expect(page.locator(".gallery-empty")).toBeVisible();
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page.locator(".project-card")).toHaveCount(projects.length);
});

test("primary cards enter routes and Back preserves gallery state and mode", async ({
  page,
}) => {
  await page.goto("/#projects");
  await page.getByRole("button", { name: "Creative" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-mode", "creative");
  await page
    .getByRole("searchbox", { name: "Search project worlds" })
    .fill("mazera");
  const entry = page.getByRole("link", {
    name: "Open Mazera AI Maze Solver",
  });
  await entry.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/projects\/mazera-ai-maze-solver\/?$/);
  await expect(page.locator("h1")).toContainText("Mazera");
  await expect(page.locator("h1")).toBeFocused();
  await expect(page.locator("html")).toHaveAttribute("data-mode", "creative");
  await page
    .getByRole("link", { name: "Back to the map", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("searchbox", { name: "Search project worlds" }),
  ).toHaveValue("mazera");
  await expect(page.locator(".c-card")).toHaveCount(1);
  await expect(page.locator("html")).toHaveAttribute("data-mode", "creative");
});

test("quick overview retains accessible native dialog behavior", async ({
  page,
}) => {
  await page.goto("/#projects");
  const trigger = page.getByRole("button", {
    name: "Quick overview of Student Burnout AI",
  });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("heading", { name: "Student Burnout AI", exact: true }),
  ).toBeVisible();
  for (let i = 0; i < 6; i++) await page.keyboard.press("Tab");
  expect(
    await dialog.evaluate((el) => el.contains(document.activeElement)),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("mobile menu supports Escape and section navigation", async ({ page }) => {
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
    .getByRole("link", { name: "Worlds" })
    .click();
  await expect(page).toHaveURL(/#projects$/);
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
});

for (const width of [320, 375, 768, 1024, 1440, 1920])
  test(`home layout does not overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    const clipped = await page
      .locator("h1,h2,.button")
      .evaluateAll((elements) =>
        elements
          .filter((el) => {
            const b = el.getBoundingClientRect();
            return b.left < -1 || b.right > innerWidth + 1;
          })
          .map((el) => el.textContent),
      );
    expect(clipped).toEqual([]);
  });

for (const project of projects)
  test(`direct route and refresh: ${project.slug}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const response = await page.goto(`/projects/${project.slug}/`);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveText(project.title);
    await expect(page.locator("#limits")).toBeVisible();
    await page.reload();
    await expect(page.locator("h1")).toHaveText(project.title);
    expect(errors).toEqual([]);
  });

test("Dimension Engine and toolkit selections reveal real project context", async ({
  page,
}) => {
  await page.goto("/#engine");
  await page
    .getByLabel("Project architecture")
    .selectOption("smart-parking-dbms");
  const engine = page.locator("#engine");
  await engine.getByRole("button", { name: "Allocation transaction" }).click();
  await expect(engine.locator(".component-inspector")).toContainText(
    "row locks",
  );
  await page
    .locator("#skills")
    .getByRole("button", { name: "PostgreSQL", exact: true })
    .click();
  await expect(page.locator(".skill-inspector")).toContainText("row locks");
  await expect(page.locator(".skill-inspector a")).toHaveAttribute(
    "href",
    "/projects/smart-parking-dbms/",
  );
});

test("maze supports step, run, pause, reset, algorithms, generation, and reduced motion", async ({
  page,
}) => {
  await page.goto("/projects/mazera-ai-maze-solver/");
  await page.getByRole("button", { name: "Step search" }).click();
  await expect(page.locator(".maze-readout strong").first()).toContainText("1");
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pause", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.getByRole("button", { name: "Reset maze search" }).click();
  await expect(page.locator(".maze-readout strong").first()).toContainText("0");
  await page
    .getByRole("combobox", { name: "Algorithm", exact: true })
    .selectOption("A*");
  await page.getByRole("button", { name: "New maze" }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.locator(".maze-readout")).toContainText("Search complete.");
  await expect(page.locator(".maze-path")).not.toHaveCount(0);
  await page.getByLabel("Inspect cell").selectOption("22");
  await expect(page.locator(".maze-cell-inspector")).toContainText(
    "Solution path",
  );
});

test("parking simulation selects bays, changes local occupancy, and resets", async ({
  page,
}) => {
  await page.goto("/projects/smart-parking-dbms/");
  await page.getByRole("button", { name: "Bay A02 Free", exact: true }).click();
  await page.getByRole("button", { name: "Simulate arrival" }).click();
  await expect(
    page.getByRole("button", { name: "Bay A02 Occupied", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Release demo bay" }).click();
  await expect(
    page.getByRole("button", { name: "Bay A02 Free", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset simulation" }).click();
  await expect(page.locator(".parking-inspector")).toContainText(
    "do not query or update",
  );
});

test("ML and recovery worlds distinguish explanations and synthetic data", async ({
  page,
}) => {
  await page.goto("/projects/student-burnout-ai/");
  await page.getByRole("button", { name: /Stacking ensemble/ }).click();
  await expect(page.locator(".signal-inspector")).toContainText(
    "No trained model is loaded",
  );
  await expect(page.locator(".research-boundary")).toContainText(
    "not diagnosis",
  );
  await page.goto("/projects/uco-recovery-station/");
  await page.getByRole("button", { name: "Weight gate" }).click();
  await page.getByLabel("Illustrative outcome").selectOption("Ignored");
  await expect(page.locator(".process-inspector")).toContainText(
    "do not count",
  );
  await expect(page.locator(".outcome")).toHaveText("Ignored / illustrative");
  await page.goto("/projects/predictive-maintenance/");
  await page.getByLabel("Model guide").selectOption("GRU");
  await expect(page.locator(".maintenance-inspector")).toContainText(
    "gated recurrent",
  );
  const slider = page.getByRole("slider", { name: "Inspection cycle" });
  await slider.fill("100");
  await expect(page.locator(".synthetic-reading")).toContainText(
    "SIMULATED VALUE",
  );
  await expect(page.locator(".synthetic-reading p")).toContainText(
    "independent of the selected model",
  );
});

test("independent penalty demo scores shots and discloses private-source limits", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/projects/football-penalty-shootout/");
  await expect(page.locator(".module-disclaimer")).toContainText("private");
  await page.getByRole("button", { name: "Center", exact: true }).click();
  await page.getByRole("button", { name: "Shoot", exact: true }).click();
  await expect(page.locator(".penalty-result")).toContainText("Goal!");
  await expect(page.locator(".penalty-score")).toContainText("1");
  await page.getByRole("button", { name: "Next shot" }).click();
  await page.getByRole("slider", { name: "Shot power" }).fill("95");
  await page.getByRole("button", { name: "Shoot", exact: true }).click();
  await expect(page.locator(".penalty-result")).toContainText("Wide!");
  await page.getByRole("button", { name: "Reset penalty game" }).click();
  await expect(page.locator(".penalty-score strong").first()).toHaveText("0");
  await page.locator("#decisions summary").click();
  await expect(page.locator(".ps-sources")).toContainText("private");
});

test("architecture walkthroughs navigate components without pretending to execute backends", async ({
  page,
}) => {
  await page.goto("/projects/resume-screener/");
  const inspector = page.locator("#try .component-inspector");
  const before = await inspector.textContent();
  await page.locator("#try .architecture-node-buttons button").nth(2).click();
  await expect(inspector).not.toHaveText(before || "");
  await expect(page.locator("#try .diagram-caption")).toContainText(
    "not live network traffic",
  );
  await expect(page.locator(".ps-demonote")).toContainText(
    "Architecture walkthrough",
  );
  await expect(page.locator("#how .ps-scope li").first()).toBeVisible();
});

test("every project says what kind of demonstration it offers", async ({
  page,
}) => {
  const expected: Record<string, string> = {
    "mazera-ai-maze-solver": "Working demo",
    "smart-parking-dbms": "Sample-data walkthrough",
    "last-mile-daa": "Sample-data walkthrough",
    "parkscan-swarm": "Simulation",
    "predictive-maintenance": "Sample-data walkthrough",
    aeris: "Architecture walkthrough",
  };
  for (const [slug, label] of Object.entries(expected)) {
    await page.goto(`/projects/${slug}/`);
    await expect(page.locator(".pr-badges li[data-kind]")).toHaveText(label);
    await expect(page.locator(".ps-demo-badge")).toHaveText(label);
  }
});

test("Last Mile walkthrough: greedy can lose to the knapsack, and routes can be compared with the exact one", async ({
  page,
}) => {
  await page.goto("/projects/last-mile-daa/");
  await expect(page.locator(".lm-compare").first()).toContainText("22");
  await expect(page.locator(".lm-compare").first()).toContainText("23");
  await expect(page.locator(".lm-controls .lz-note").first()).toContainText(
    "Greedy loses 1",
  );
  await page.getByRole("button", { name: "Knapsack · best fit" }).click();
  await page.getByRole("button", { name: "Exact (Held-Karp)" }).click();
  await expect(page.locator(".lm-compare").nth(1)).toContainText(
    "Extra distance0",
  );
  await page.getByRole("button", { name: "Nearest neighbour" }).click();
  await page.getByRole("checkbox").check();
  await expect(page.locator(".lm-tree").first()).toBeVisible();
});

test("ParkScan simulation: zones finish with no repeated work and the badge says SIMULATED", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/projects/parkscan-swarm/");
  await expect(page.locator(".ps-badge")).toHaveText("SIMULATED");
  await page.getByRole("button", { name: "Step simulation" }).click();
  await expect(page.locator(".ps-module .lz-stats")).toContainText("Tick1");
  await page.getByRole("slider", { name: "Speed" }).fill("8");
  await page.getByRole("button", { name: "Play simulation" }).click();
  await expect(page.locator(".ps-module .lz-note")).toContainText(
    "Finished in",
    { timeout: 20000 },
  );
  await expect(page.locator(".ps-module .lz-stats")).toContainText(
    "Repeated work0",
  );
  await page
    .getByRole("button", { name: "Robots that do not share a map" })
    .click();
  await page.getByRole("button", { name: "Play simulation" }).click();
  await expect(page.locator(".ps-module .lz-note")).toContainText(
    "Finished in",
    { timeout: 30000 },
  );
  await expect(page.locator(".ps-module .lz-stats")).not.toContainText(
    "Repeated work0",
  );
});

test("Mazera challenge reveals real results for all six algorithms", async ({
  page,
}) => {
  await page.goto("/projects/mazera-ai-maze-solver/");
  await page.getByRole("button", { name: "Run all six" }).isDisabled();
  await page.getByRole("combobox", { name: "Grid" }).selectOption("open");
  await page
    .locator(".maze-guesses")
    .getByRole("button", { name: "A*", exact: true })
    .click();
  await page.getByRole("button", { name: "Run all six" }).click();
  await expect(page.locator(".maze-results tbody tr")).toHaveCount(6);
  await expect(page.locator(".maze-results tr[data-best]")).toHaveCount(1);
  await expect(page.locator(".maze-results")).toContainText("Greedy");
});

test("Mazera is a College project everywhere it is shown", async ({ page }) => {
  await page.goto("/projects/mazera-ai-maze-solver/");
  await expect(page.locator(".pr-badges")).toContainText("College project");
  await expect(page.locator(".pr-badges")).not.toContainText(
    "Personal project",
  );
  expect(
    projects.find((p) => p.slug === "mazera-ai-maze-solver")?.collection,
  ).toBe("College");
  await page.goto("/#projects");
  await page.getByRole("button", { name: /College Projects/ }).click();
  await expect(
    page.locator(".project-card h3").filter({ hasText: "Mazera" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Personal Projects/ }).click();
  await expect(
    page.locator(".project-card h3").filter({ hasText: "Mazera" }),
  ).toHaveCount(0);
});

test("Color Field controls and reduced-motion CSS are preserved", async ({
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
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page
      .locator(".circle-a")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
});

test("configured email and profile clipboard work without a delivery claim", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/#contact");
  const form = page.locator(".contact-form");
  await form.getByRole("button", { name: "Prepare email draft" }).click();
  expect(
    await form
      .locator("input[name=name]")
      .evaluate((el) => (el as HTMLInputElement).validity.valueMissing),
  ).toBe(true);
  await form.getByLabel("Your name").fill("Test visitor");
  await form.getByLabel("Your email").fill("visitor@example.com");
  await form.getByLabel("What’s on your mind?").fill("A portfolio inquiry.");
  await expect(
    page.locator('a[href="mailto:sidharthsood303@gmail.com"]'),
  ).toBeVisible();
  await form.getByRole("button", { name: "Prepare email draft" }).click();
  await expect(form.getByRole("status")).toContainText(
    "nothing was sent by this site",
  );
  await expect(
    form.getByRole("link", { name: "Open email draft" }),
  ).toHaveAttribute(
    "href",
    /mailto:sidharthsood303@gmail.com\?subject=Portfolio%20inquiry%20from%20Test%20visitor&body=/,
  );
  await page.getByRole("button", { name: "Copy email address" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "sidharthsood303@gmail.com",
  );
  await page.getByRole("button", { name: "Copy GitHub profile" }).click();
  await expect(form.getByRole("status")).toContainText("GitHub profile copied");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "https://github.com/EXCALIBUR303",
  );
});

for (const route of [
  "/",
  "/projects/mazera-ai-maze-solver/",
  "/projects/smart-parking-dbms/",
  "/projects/football-penalty-shootout/",
])
  test(`mobile route layout: ${route}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(route);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(320);
    const clipped = await page
      .locator("h1,h2,.button")
      .evaluateAll((elements) =>
        elements
          .filter((el) => {
            const b = el.getBoundingClientRect();
            return b.left < -1 || b.right > innerWidth + 1;
          })
          .map((el) => el.textContent),
      );
    expect(clipped).toEqual([]);
  });

test("home and representative worlds pass automated accessibility in both modes", async ({
  page,
}) => {
  test.setTimeout(180000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const route of [
    "/",
    "/projects/mazera-ai-maze-solver/",
    "/projects/student-burnout-ai/",
    "/projects/smart-parking-dbms/",
    "/projects/football-penalty-shootout/",
    "/projects/last-mile-daa/",
    "/projects/burnout-backend/",
    "/projects/sigsmith/",
    "/projects/swarmmind/",
    "/projects/pathable/",
  ]) {
    await page.goto(route === "/" ? route : `${route}#try`);
    if (route !== "/" && !route.includes("last-mile-daa"))
      await expect(
        page.locator(".interactive-module, .architecture-explorer").first(),
      ).toBeVisible();
    for (const mode of ["pro", "creative"]) {
      await page
        .getByRole("button", {
          name: mode === "pro" ? "Professional" : "Creative",
        })
        .click();
      await expect(page.locator("html")).toHaveAttribute("data-mode", mode);
      // Audit the completed paint after the lazy world has mounted.
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(
        result.violations.map((v) => ({
          route,
          mode,
          id: v.id,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            failure: n.failureSummary,
          })),
        })),
      ).toEqual([]);
    }
  }
});

test("Creative mission tabs pass automated accessibility on every mission", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() =>
    localStorage.setItem("portfolio-mode", "creative"),
  );
  for (const route of [
    "/projects/mazera-ai-maze-solver/",
    "/projects/parkscan-swarm/",
    "/projects/aeris/",
  ]) {
    for (const mission of ["problem", "try", "how", "decisions"]) {
      await page.goto(`${route}#${mission}`);
      await expect(page.getByRole("tabpanel")).toBeVisible();
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(
        result.violations.map((v) => ({
          route,
          mission,
          id: v.id,
          targets: v.nodes.map((n) => n.target),
        })),
      ).toEqual([]);
    }
  }
});

test("project spatial view uses WebGL with working controls", async ({
  browser,
}) => {
  test.setTimeout(60000);
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator("canvas:not(.mini-anim)")).toHaveCount(0);
  await page.goto("/projects/mazera-ai-maze-solver/");
  await expect(page.locator("canvas:not(.mini-anim)")).toBeVisible({
    timeout: 20000,
  });
  await expect(page.locator(".spatial-fallback")).toHaveCount(0);
  await page.getByRole("button", { name: "Top view", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Top view", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Reset camera", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Isometric", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "2D", exact: true }).click();
  await expect(page.locator("canvas:not(.mini-anim)")).toHaveCount(0);
  await expect(page.locator(".maze-grid-svg")).toBeVisible();
  expect(errors).toEqual([]);
  await context.close();
});

test("touch devices opt into 3D on project pages while 2D stays fully usable", async ({
  browser,
}) => {
  test.setTimeout(60000);
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("canvas:not(.mini-anim)")).toHaveCount(0);
  await page.goto("/projects/smart-parking-dbms/");
  await expect(page.locator("canvas:not(.mini-anim)")).toHaveCount(0);
  await page.getByRole("button", { name: "Enable 3D view" }).click();
  await expect(page.locator("canvas:not(.mini-anim)")).toBeVisible({
    timeout: 20000,
  });
  await context.close();
});
