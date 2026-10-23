import { test, expect, type Page } from "@playwright/test";

const setMode = (page: Page, mode: "pro" | "creative") =>
  page.addInitScript((m) => localStorage.setItem("portfolio-mode", m), mode);

test.describe("Professional hero: three project visualisations", () => {
  test.beforeEach(async ({ page }) => {
    await setMode(page, "pro");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
  });

  test("each lens is tied to a real project and says what kind of visual it is", async ({
    page,
  }) => {
    await expect(page.locator(".hx-pro canvas")).toHaveCount(0);
    const cases = [
      ["01 / Systems", "Illustrative sequence", "smart-parking-dbms"],
      ["02 / Algorithms", "Working demo", "mazera-ai-maze-solver"],
      [
        "03 / Intelligence",
        "Sample-data walkthrough",
        "predictive-maintenance",
      ],
    ] as const;
    for (const [name, badge, slug] of cases) {
      await page.getByRole("button", { name, exact: true }).click();
      await expect(
        page.getByRole("button", { name, exact: true }),
      ).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator(".lz-badge")).toHaveText(badge);
      await expect(page.locator(".lz-caption")).toContainText(
        "What you are seeing.",
      );
      await expect(page.locator(".lz-caption")).toContainText(
        "Why it is here.",
      );
      await expect(page.locator(".lz-caption a")).toHaveAttribute(
        "href",
        `/projects/${slug}/`,
      );
    }
  });

  test("Systems: a plain check-then-write conflicts, row-locked allocation does not", async ({
    page,
  }) => {
    const next = page.getByRole("button", { name: "Next step" });
    for (let i = 0; i < 3; i++) await next.click();
    await expect(page.locator(".lz-verdict")).toContainText("Conflict");
    await page.getByRole("button", { name: "Row-locked allocation" }).click();
    await expect(page.locator(".lz-verdict")).toHaveCount(0);
    for (let i = 0; i < 3; i++) await next.click();
    await expect(page.locator(".lz-verdict")).toContainText("Safe");
    await expect(page.locator(".lz-bay")).toContainText("Occupied by Car 1");
  });

  test("Algorithms: six real solvers run on the maze and the grid can change", async ({
    page,
  }) => {
    await page
      .getByRole("button", { name: "02 / Algorithms", exact: true })
      .click();
    const chips = page.locator(".lz-chips button");
    await expect(chips).toHaveCount(6);
    await expect(page.locator(".lz-stats")).toContainText("steps");
    const counts: number[] = [];
    for (const name of [
      "BFS",
      "DFS",
      "Dijkstra",
      "A*",
      "Greedy",
      "Bidirectional",
    ]) {
      const chip = page.getByRole("button", {
        name: new RegExp(`^${name.replace("*", "\\*")} `),
      });
      await chip.click();
      await expect(chip).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator(".lz-maze-svg .lz-path").first()).toBeVisible();
      counts.push(
        Number((await chip.locator("small").innerText()).replace(/\D/g, "")),
      );
    }
    expect(new Set(counts).size).toBeGreaterThan(1);
    await page.getByRole("button", { name: "Open field", exact: true }).click();
    await page.getByRole("button", { name: /^BFS / }).click();
    const bfs = Number(
      (
        await page
          .getByRole("button", { name: /^BFS / })
          .locator("small")
          .innerText()
      ).replace(/\D/g, ""),
    );
    const greedy = Number(
      (
        await page
          .getByRole("button", { name: /^Greedy / })
          .locator("small")
          .innerText()
      ).replace(/\D/g, ""),
    );
    expect(greedy).toBeLessThan(bfs);
    await page.getByRole("button", { name: "New maze" }).click();
    await expect(page.locator(".lz-maze-svg")).toBeVisible();
  });

  test("Intelligence: splitting by window leaks engines across sets, splitting by engine does not", async ({
    page,
  }) => {
    await page
      .getByRole("button", { name: "03 / Intelligence", exact: true })
      .click();
    const shared = page.locator(".lz-stats dd").first();
    await expect(shared).not.toHaveText(/^0/);
    await expect(page.locator(".lz-note")).toContainText("Leaky.");
    await page.getByRole("button", { name: "Split by engine" }).click();
    await expect(shared).toHaveText(/^0/);
    await expect(page.locator(".lz-note")).toContainText("Clean.");
    await page.getByRole("button", { name: "Reshuffle" }).click();
    await expect(shared).toHaveText(/^0/);
  });

  test("the hero is usable at phone width without sideways scrolling", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
    for (const name of ["02 / Algorithms", "03 / Intelligence"]) {
      await page.getByRole("button", { name, exact: true }).click();
      const box = await page.locator(".lz").boundingBox();
      expect(box!.width).toBeLessThanOrEqual(390);
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

  test("quick peek shows the lens visualisation for the three featured ideas", async ({
    page,
  }) => {
    await page
      .locator(".c-map")
      .getByRole("button", { name: /Mazera/ })
      .click();
    await page.getByRole("button", { name: "Quick peek" }).click();
    await expect(page.locator(".c-peek .lz-maze-svg")).toBeVisible();
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
