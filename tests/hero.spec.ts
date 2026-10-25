import { test, expect, type Page } from "@playwright/test";

const setMode = (page: Page, mode: "pro" | "creative") =>
  page.addInitScript((m) => localStorage.setItem("portfolio-mode", m), mode);

test.describe("Professional hero: project scenes in three categories", () => {
  test.beforeEach(async ({ page }) => {
    await setMode(page, "pro");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
  });

  const pickScene = async (page: Page, category: string, scene: string) => {
    await page.getByRole("button", { name: category, exact: true }).click();
    await page
      .locator(".s3-picker")
      .getByRole("button", { name: new RegExp(`^${scene}( \\(3D\\))?$`) })
      .click();
  };

  test("every category offers three real-project scenes that say what they are", async ({
    page,
  }) => {
    const cases = [
      ["01 / Systems", "AURA studio", "Illustrative 3D model", "aura"],
      ["01 / Systems", "SmartPark", "Illustrative 3D sequence", "smart-parking-dbms"],
      ["01 / Systems", "Private Local AI", "Sample-data walkthrough", "private-local-ai"],
      ["02 / Algorithms", "Mazera", "Working demo", "mazera-ai-maze-solver"],
      ["02 / Algorithms", "Last Mile DAA", "Sample-data walkthrough", "last-mile-daa"],
      ["02 / Algorithms", "PathAble", "Sample-data walkthrough", "pathable"],
      ["03 / Intelligence", "Robot dog", "Simulation", "quadruped-rl"],
      ["03 / Intelligence", "SWARMMIND", "Simulation", "swarmmind"],
      ["03 / Intelligence", "Predictive Maintenance", "Sample-data walkthrough", "predictive-maintenance"],
    ] as const;
    for (const [category, scene, badge, slug] of cases) {
      await pickScene(page, category, scene);
      await expect(page.locator(".s3-picker button")).toHaveCount(3);
      await expect(page.locator(".lz-badge")).toHaveText(badge);
      await expect(page.locator(".lz-caption")).toContainText("Why it is here.");
      await expect(page.locator(".lz-caption a")).toHaveAttribute(
        "href",
        `/projects/${slug}/`,
      );
    }
  });

  test("AURA: a request crosses the bridge hop by hop, and services cannot send", async ({
    page,
  }) => {
    // The part buttons live behind a "Parts" disclosure, closed by default.
    await expect(page.locator(".s3-parts-disclosure")).not.toHaveAttribute("open", "");
    await page.locator(".s3-parts-disclosure > summary").click();
    await expect(page.locator(".s3-parts-disclosure")).toHaveAttribute("open", "");
    await page.locator(".s3-parts").getByRole("button", { name: "AI lab" }).click();
    await expect(page.locator(".s3-panel")).toContainText("provider-neutral");
    await expect(page.locator(".s3-panel")).not.toContainText("mocked");
    // The selected part's callout is marked, and the companion is labelled as a stand-in.
    await expect(page.locator('.s3-label[data-part="ailab"]')).toHaveAttribute("data-active", "true");
    await page.locator(".s3-parts").getByRole("button", { name: "AI companion" }).click();
    await expect(page.locator(".s3-panel")).toContainText("set movements");
    await page.locator(".s3-parts").getByRole("button", { name: "AI lab" }).click();
    await page.getByRole("button", { name: "Send a request" }).click();
    const hops = page.locator(".s3-hops li");
    await expect(hops).toHaveCount(7);
    await expect(hops.nth(3)).toContainText("AI service");
    await expect(hops.last()).toHaveAttribute("data-done", "true", { timeout: 10_000 });
    await page.locator(".s3-parts").getByRole("button", { name: "Bridge router" }).click();
    await expect(page.getByRole("button", { name: "Send a request" })).toBeDisabled();
  });

  test("Mazera: six solvers, step and reset, and the grid can change", async ({
    page,
  }) => {
    await pickScene(page, "02 / Algorithms", "Mazera");
    const chips = page.locator(".lz-chips button");
    await expect(chips).toHaveCount(6);
    const explored = page.locator(".lz-stats dd").first();
    await page.getByRole("button", { name: "Reset search" }).click();
    await expect(explored).toHaveText(/^0/);
    await page.getByRole("button", { name: "Step" }).click();
    await expect(explored).toHaveText(/^1/);
    const counts: number[] = [];
    for (const name of ["BFS", "DFS", "Dijkstra", "A*", "Greedy", "Bidirectional"]) {
      const chip = page.getByRole("button", { name: new RegExp(`^${name.replace("*", "\\*")} `) });
      await chip.click();
      await expect(chip).toHaveAttribute("aria-pressed", "true");
      counts.push(Number((await chip.locator("small").innerText()).replace(/\D/g, "")));
    }
    expect(new Set(counts).size).toBeGreaterThan(1);
    await page.getByRole("button", { name: "Open field", exact: true }).click();
    const count = async (name: string) =>
      Number(
        (await page.getByRole("button", { name: new RegExp(`^${name} `) }).locator("small").innerText()).replace(/\D/g, ""),
      );
    expect(await count("Greedy")).toBeLessThan(await count("BFS"));
    await page.getByRole("button", { name: "New maze" }).click();
    await expect(page.locator(".lz-note")).toContainText(".");
  });

  test("Robot dog: a typed command goes through the documented chain", async ({
    page,
  }) => {
    await pickScene(page, "03 / Intelligence", "Robot dog");
    await page.getByLabel("Or type a command").fill("please turn left");
    await page.getByRole("button", { name: "Send", exact: true }).click();
    const stages = page.locator(".s3-dog .lz-stages li");
    await expect(stages.first()).toContainText("please turn left");
    await expect(stages.nth(1)).toContainText("Turning left.");
    await expect(page.getByRole("button", { name: "Turn left" })).toHaveAttribute("aria-pressed", "true");
    await page.getByLabel("Or type a command").fill("do a backflip");
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await expect(page.locator(".s3-dog")).toContainText("Not understood");
  });

  test("PathAble: a wheelchair route avoids stairs and reroutes after a report", async ({
    page,
  }) => {
    await pickScene(page, "02 / Algorithms", "PathAble");
    const note = page.locator(".fl-pathable .lz-note");
    await expect(note).toContainText("Walking: Main gate → Quad → Library → CS lab");
    await page.getByRole("button", { name: "Wheelchair" }).click();
    await expect(note).toContainText("Cafe → Library → CS lab");
    await page.getByLabel("Community report: the cafe ramp is blocked").check();
    await expect(note).toContainText("Car park");
  });

  test("PathAble 3D: the campus is drawn and destinations and profiles change the route", async ({
    page,
  }) => {
    await pickScene(page, "02 / Algorithms", "PathAble");
    await expect(page.locator(".s3-campus canvas")).toBeVisible();
    const note = page.locator(".s3-campus .lz-note");
    await page.getByRole("button", { name: "Wheelchair" }).click();
    await page.getByRole("group", { name: "Destination" }).getByRole("button", { name: "Hostel" }).click();
    await expect(note).toContainText("Car park → Hostel");
    await expect(note).toContainText("red cross");
    await expect(page.getByRole("button", { name: /Follow the walker/ })).toBeVisible();
    await page.getByRole("button", { name: "Follow the walker" }).click();
    await expect(page.getByRole("button", { name: "Stop following" })).toHaveAttribute("aria-pressed", "true");
  });

  test("SmartPark 3D: the garage steps through a conflict, then the row-locked fix", async ({
    page,
  }) => {
    await pickScene(page, "01 / Systems", "SmartPark");
    await expect(page.locator(".s3-garage canvas")).toBeVisible();
    const next = page.getByRole("button", { name: "Next step" });
    for (let i = 0; i < 3; i++) await next.click();
    await expect(page.locator(".s3-garage .lz-verdict")).toContainText("Conflict");
    await page.getByRole("button", { name: "Row-locked allocation" }).click();
    await expect(page.locator(".s3-garage .lz-verdict")).toHaveCount(0);
    for (let i = 0; i < 3; i++) await next.click();
    await expect(page.locator(".s3-garage .lz-verdict")).toContainText("Safe");
    await expect(page.locator(".s3-garage .lz-note").first()).toContainText("Select any bay");
  });

  test("Last Mile: stages run from orders to compared routes", async ({ page }) => {
    await pickScene(page, "02 / Algorithms", "Last Mile DAA");
    const next = page.getByRole("button", { name: "Next stage" });
    await next.click();
    await page.getByRole("button", { name: "Greedy by value per kg" }).click();
    await expect(page.locator(".fl-lastmile .lz-note")).toContainText("value 46");
    await page.getByRole("button", { name: "Knapsack · best fit" }).click();
    await expect(page.locator(".fl-lastmile .lz-note")).toContainText("value 48");
    await next.click();
    await next.click();
    const chips = page.locator(".fl-lastmile .lz-chips button");
    await expect(chips).toHaveCount(4);
    const len = async (i: number) => Number((await chips.nth(i).locator("small").innerText()).replace(/[^\d.]/g, ""));
    expect(await len(0)).toBeGreaterThan(await len(3));
  });

  test("Private Local AI: the answer is a fenced, cited passage", async ({ page }) => {
    await pickScene(page, "01 / Systems", "Private Local AI");
    for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Next step" }).click();
    await expect(page.locator(".fl-fence")).toContainText("UNTRUSTED");
    await page.getByRole("button", { name: "Next step" }).click();
    await expect(page.locator(".fl-answer")).toContainText("Lab doors lock");
    await expect(page.locator(".fl-answer")).toContainText("lab-handbook.pdf · p. 2");
  });

  test("SWARMMIND: both baselines run and are compared honestly", async ({ page }) => {
    await pickScene(page, "03 / Intelligence", "SWARMMIND");
    await expect(page.locator(".fl-swarm .lz-note")).toContainText("not SWARMMIND results");
    await page.getByRole("button", { name: "Reset", exact: true }).click();
    await page.getByRole("button", { name: "Step", exact: true }).click();
    await expect(page.locator(".fl-swarm .lz-stats dd").first()).toHaveText(/^1/);
  });

  test("Private Local AI 3D: the chamber scores passages, ranks them and cites the best", async ({ page }) => {
    await pickScene(page, "01 / Systems", "Private Local AI");
    await expect(page.locator(".s3-vault canvas")).toBeVisible();
    const next = page.getByRole("button", { name: "Next step" });
    await next.click();
    await expect(page.locator(".s3-vault .fl-table tbody tr")).toHaveCount(5);
    await next.click();
    await expect(page.locator(".s3-vault .fl-table tr[data-top] th")).toContainText("lab-handbook.pdf · p. 2");
    await expect(page.locator(".s3-vault")).toContainText("Sample data");
  });

  test("Last Mile 3D: the district runs from orders to a driven route", async ({ page }) => {
    await pickScene(page, "02 / Algorithms", "Last Mile DAA");
    await expect(page.locator(".s3-city canvas")).toBeVisible();
    for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Next stage" }).click();
    await expect(page.getByRole("button", { name: "Drive the route again" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Follow the van" })).toBeVisible();
    await expect(page.locator(".s3-city .lz-chips button")).toHaveCount(4);
  });

  test("SWARMMIND 3D: searchers are numbered, selectable and stepped", async ({ page }) => {
    await pickScene(page, "03 / Intelligence", "SWARMMIND");
    await expect(page.locator(".s3-swarm canvas")).toBeVisible();
    await expect(page.locator(".s3-swarm .s3-selection")).toContainText("numbered as well as coloured");
    await page.getByRole("button", { name: "Random walk" }).click();
    await page.getByRole("button", { name: "Reset", exact: true }).click();
    await page.getByRole("button", { name: "Step", exact: true }).click();
    await expect(page.locator(".s3-swarm .lz-stats dd").first()).toHaveText(/^1/);
  });

  test("Predictive Maintenance: the data steps run on made-up engines and results are the repository's", async ({
    page,
  }) => {
    await pickScene(page, "03 / Intelligence", "Predictive Maintenance");
    const scene = page.locator(".s3-rul");
    const step = (name: string) => scene.locator(".rul-steps").getByRole("button", { name });
    await step("Engine split").click();
    await expect(scene.locator(".lz-stats dd")).toHaveText(/^0/);
    await scene.getByRole("button", { name: "Split by window (leaky)" }).click();
    await expect(scene.locator(".lz-stats dd")).not.toHaveText(/^0/);
    await step("Scale and filter").click();
    await expect(scene.locator(".rul-dropped")).toContainText("Kept");
    await step("30-cycle window").click();
    await expect(scene.locator(".rul-stats dt")).toHaveText(["mean", "std", "min", "max", "last", "slope", "delta"]);
    await step("Target").click();
    const slider = scene.getByRole("slider");
    await slider.fill("40");
    await expect(scene.locator(".lz-stats dd").first()).toHaveText(/^125/);
    await step("Published results").click();
    await expect(scene.locator(".rul-results tbody tr").first()).toContainText("12.369");
    await scene.getByRole("button", { name: "FD004" }).click();
    await expect(scene.locator(".rul-results tbody tr").first()).toContainText("15.924");
    await expect(scene.locator(".lz-note")).toContainText("not from this page");
  });

  test("the hero is usable at phone width without sideways scrolling", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    for (const name of ["01 / Systems", "02 / Algorithms", "03 / Intelligence"]) {
      await page.getByRole("button", { name, exact: true }).click();
      const box = await page.locator(".lz").boundingBox();
      expect(box!.width).toBeLessThanOrEqual(390);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    }
  });
});

test.describe("Creative home: the studio map", () => {
  test.beforeEach(async ({ page }) => {
    await setMode(page, "creative");
    await page.goto("/");
  });

  test("every project is a station and choosing one opens a briefing with four missions", async ({
    page,
  }) => {
    await expect(page.locator(".c-pin")).toHaveCount(20);
    await expect(page.locator(".c-island")).toHaveCount(3);
    await expect(page.locator(".c-hero .lz-explorer")).toHaveCount(0);
    await page
      .getByRole("button", { name: "SmartPark DBMS", exact: true })
      .click();
    const brief = page.locator(".c-brief");
    await expect(brief.locator("h2")).toHaveText("SmartPark DBMS");
    await expect(brief).toContainText("College project");
    const missions = brief.locator(".c-missions a");
    await expect(missions).toHaveCount(4);
    await expect(missions.nth(1)).toHaveAttribute(
      "href",
      "/projects/smart-parking-dbms/#try",
    );
  });

  test("Mazera sits in the Algorithms district and is a College project", async ({
    page,
  }) => {
    const island = page.locator('.c-island[data-district="algorithms"]');
    await expect(island.getByRole("button", { name: /Mazera/ })).toBeVisible();
    await page
      .locator(".c-map")
      .getByRole("button", { name: /Mazera/ })
      .click();
    await expect(page.locator(".c-brief-badges")).toContainText(
      "College project",
    );
    await expect(page.locator(".c-brief-badges")).not.toContainText(
      "Personal project",
    );
  });

  test("quick peek shows the project's scene where one exists", async ({
    page,
  }) => {
    await page
      .locator(".c-map")
      .getByRole("button", { name: /Mazera/ })
      .click();
    await page.getByRole("button", { name: "Quick peek" }).click();
    await expect(page.locator('.c-peek [data-scene="mazera"]')).toBeVisible();
    await expect(page.locator(".c-peek .lz-chips button")).toHaveCount(6);
    await page.getByRole("button", { name: "Hide quick peek" }).click();
    await expect(page.locator(".c-peek")).toHaveCount(0);
    await page
      .locator(".c-map")
      .getByRole("button", { name: "Student Burnout AI" })
      .click();
    await expect(page.getByRole("button", { name: /Quick peek/ })).toHaveCount(
      0,
    );
  });

  test("progress counts only what this tab opened, and can be cleared", async ({
    page,
  }) => {
    await expect(page.locator(".c-progress")).toContainText("Explored 0 of 20");
    await page
      .locator(".c-map")
      .getByRole("button", { name: /Mazera/ })
      .click();
    await page
      .locator(".c-brief")
      .getByRole("link", { name: "Try the demonstration" })
      .click();
    await expect(page).toHaveURL(/mazera-ai-maze-solver\/#try/);
    await page.goBack();
    await page.waitForURL("**/");
    await expect(page.locator(".c-progress")).toContainText("Explored 1 of 20");
    await expect(page.locator(".c-pin[data-visited]")).toHaveCount(1);
    await page.getByRole("button", { name: "Clear" }).click();
    await expect(page.locator(".c-progress")).toContainText("Explored 0 of 20");
  });

  test("board filters dim the stations that do not match", async ({ page }) => {
    await page
      .getByRole("searchbox", { name: "Search project worlds" })
      .fill("PostgreSQL");
    await expect(page.locator('.c-pin[data-match="true"]')).not.toHaveCount(20);
    await expect(page.locator(".c-map-filter")).toBeVisible();
    await page.getByRole("button", { name: "Clear project search" }).click();
    await expect(page.locator(".c-map-filter")).toHaveCount(0);
  });

  test("stations are reachable and operable with the keyboard", async ({
    page,
  }) => {
    const pin = page
      .locator(".c-map")
      .getByRole("button", { name: "AERIS", exact: true });
    await pin.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".c-brief h2")).toHaveText("AERIS");
  });

  test("the map works at phone width without sideways scrolling", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
    await expect(page.locator(".c-pin").first()).toBeVisible();
  });
});
