import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { stations } from "../src/components/creative/studio/stations";
import { projects } from "../src/data/projects";

const setMode = (page: Page, mode: "pro" | "creative") =>
  page.addInitScript((m) => localStorage.setItem("portfolio-mode", m), mode);

test.beforeEach(async ({ page }) => {
  await setMode(page, "creative");
});

test("the 20 stations match the registry: same projects, same districts", () => {
  expect(stations).toHaveLength(20);
  expect(new Set(stations.map((s) => s.slug)).size).toBe(20);
  for (const s of stations) {
    const project = projects.find((p) => p.slug === s.slug);
    expect(project, s.slug).toBeTruthy();
    expect(s.district, s.slug).toBe(project!.district);
    if (s.tier === "exhibit") {
      expect(s.scene, s.slug).toBeTruthy();
      expect(s.exhibit, s.slug).toBeTruthy();
    }
  }
  // The first wave, and the two team projects that stay briefings.
  const exhibit = (slug: string) => stations.find((s) => s.slug === slug)!.tier;
  for (const slug of ["smart-parking-dbms", "mazera-ai-maze-solver", "pathable", "aura", "private-local-ai", "predictive-maintenance"])
    expect(exhibit(slug), slug).toBe("exhibit");
  expect(exhibit("last-mile-daa")).toBe("briefing");
  expect(exhibit("rupeerise")).toBe("briefing");
});

test("district chips focus one district and dim the others, and can be undone", async ({ page }) => {
  await page.goto("/");
  const group = page.getByRole("group", { name: "District" });
  await group.getByRole("button", { name: /^Systems/ }).click();
  await expect(page.locator(".c-map")).toHaveAttribute("data-focus", "systems");
  await expect(page.locator('.c-island[data-district="algorithms"]')).toHaveAttribute("data-dim", "");
  await expect(page.locator('.c-island[data-district="systems"]')).not.toHaveAttribute("data-dim", "");
  await group.getByRole("button", { name: /^All districts/ }).click();
  await expect(page.locator(".c-map")).toHaveAttribute("data-focus", "all");
  await expect(page.locator(".c-island[data-dim]")).toHaveCount(0);
});

test("List view shows all 20 stations, is searchable, and enters exhibits", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "List", exact: true }).click();
  await expect(page.locator(".c-row")).toHaveCount(20);
  await expect(page.locator(".c-map")).toBeHidden();
  await page.getByRole("searchbox", { name: "Find a station" }).fill("maze");
  const rows = await page.locator(".c-row").count();
  expect(rows).toBeGreaterThan(0);
  expect(rows).toBeLessThan(20);
  await page.getByRole("searchbox", { name: "Find a station" }).fill("");
  await page.getByRole("button", { name: "Enter exhibit for SmartPark DBMS" }).click();
  await expect(page.locator("#ex-title")).toHaveText("The Concurrency Garage");
  // Every row, exhibit or not, still links to the project page.
  await page.keyboard.press("Escape");
  await expect(page.locator(".c-row").first().getByRole("link", { name: /Project page/ })).toBeVisible();
});

test("an exhibit can be opened by address, switched, and closed with Back", async ({ page }) => {
  await page.goto("/?exhibit=pathable");
  await expect(page.locator("#ex-title")).toHaveText("The Accessible Campus");
  await expect(page.locator('.ex .lz[data-scene="pathable"]')).toBeVisible();
  // Only the open exhibit's scene is mounted.
  await page.locator(".ex-trail").getByRole("button", { name: "AURA" }).click();
  await expect(page.locator("#ex-title")).toHaveText("The Living Developer Studio");
  await expect(page.locator('.ex .lz[data-scene]')).toHaveCount(1);
  await expect(page.locator('.ex .lz[data-scene="aura"]')).toBeVisible();
  expect(await page.locator(".ex canvas").count()).toBeLessThanOrEqual(1);
  // Opened from the map, Back returns to the map.
  await page.goto("/");
  await page.locator('[data-station="smart-parking-dbms"]').click();
  await page.getByRole("button", { name: /Enter exhibit/ }).click();
  await expect(page.locator(".ex")).toBeVisible();
  await page.goBack();
  await expect(page.locator(".ex")).toHaveCount(0);
  await expect(page.locator(".c-map")).toBeVisible();
});

const challenges: [string, string][] = [
  ["smart-parking-dbms", "Two cars, one last bay"],
  ["mazera-ai-maze-solver", "Which search looks at fewer cells?"],
  ["pathable", "The shortest route is not always yours"],
  ["aura", "Follow a request down the bridge"],
  ["private-local-ai", "Pick the note that gets cited"],
  ["predictive-maintenance", "Which model made the smallest error?"],
];
for (const [slug, heading] of challenges) {
  test(`the ${slug} challenge is optional and explains its result`, async ({ page }) => {
    await page.goto(`/?exhibit=${slug}`);
    // The scene and its links are there without touching the challenge.
    await expect(page.locator(".ex-stage")).toBeVisible();
    await expect(page.getByRole("link", { name: /Full project page/ })).toBeVisible();
    await expect(page.locator(".ch").first()).toBeHidden();
    await page.locator(".ex-optional summary", { hasText: "Try a challenge" }).click();
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    await expect(page.locator(".ch-answer dl")).toHaveCount(0);
    const answers = page.locator(".ex-optional", { hasText: "Try a challenge" }).locator(".ch-choices").last();
    await answers.getByRole("button").first().click();
    const dl = page.locator(".ch-answer dl");
    for (const term of ["What changed", "Result", "Why", "What the real project does", "What this is"])
      await expect(dl.getByText(term, { exact: true })).toBeVisible();
    await expect(page.locator(".ex-optional summary", { hasText: "Try a challenge" })).toContainText("done");
  });
}

test("Mazera and Private Local AI experiments recompute from real inputs", async ({ page }) => {
  await page.goto("/?exhibit=mazera-ai-maze-solver");
  await page.locator(".ex-optional summary", { hasText: "Run an experiment" }).click();
  const rows = page.locator(".ch-exp tbody tr");
  await expect(rows).toHaveCount(6);
  const open = await rows.first().locator("td").first().innerText();
  await page.getByRole("button", { name: "Generated maze" }).click();
  const maze = await rows.first().locator("td").first().innerText();
  expect(maze).not.toBe(open);
  await page.goto("/?exhibit=private-local-ai");
  await page.locator(".ex-optional summary", { hasText: "Run an experiment" }).click();
  await expect(page.locator(".ch-order li")).toHaveCount(5);
  await page.getByRole("slider").fill("0");
  await expect(page.locator(".ch-order li")).toHaveCount(5);
});

test("the Studio opens a panel with the way to About, the bench and the passport", async ({ page }) => {
  await page.goto("/");
  await page.locator(".c-map").getByRole("button", { name: /The Studio/ }).click();
  const panel = page.getByRole("complementary", { name: "The Studio" });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("link", { name: /The person behind the experiments/ })).toHaveAttribute("href", "#about");
  await expect(panel).toContainText("On the bench");
  await expect(panel).toContainText("0 of 20 stations opened and 0 of 6 challenges tried");
  await panel.getByRole("button", { name: /^Algorithms/ }).click();
  await expect(page.locator(".c-map")).toHaveAttribute("data-focus", "algorithms");
  await expect(page.locator("#about h2")).toContainText("The person behind");
});

test("the camera follows district focus and station selection, and Escape steps back out", async ({ page }) => {
  await page.goto("/");
  const stage = page.locator(".w-stage");
  await expect(stage).toHaveAttribute("data-shot", "overview");
  await page.getByRole("group", { name: "District" }).getByRole("button", { name: /^Systems/ }).click();
  await expect(stage).toHaveAttribute("data-shot", "district");
  await page.locator('[data-station="aura"]').click();
  await expect(stage).toHaveAttribute("data-shot", "station");
  await expect(page.locator(".c-brief h2")).toHaveText("AURA");
  await page.keyboard.press("Escape");
  await expect(stage).toHaveAttribute("data-shot", "district");
  await expect(page.locator('[data-station="aura"]')).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(stage).toHaveAttribute("data-shot", "overview");
  await expect(page.locator(".c-map")).toHaveAttribute("data-focus", "all");
});

test("entering an exhibit from the world opens it, and Back returns to the selected station", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-station="private-local-ai"]').click();
  await page.getByRole("button", { name: /Enter exhibit/ }).click();
  await expect(page.locator("#ex-title")).toHaveText("The Evidence Vault");
  await page.goBack();
  await expect(page.locator(".ex")).toHaveCount(0);
  await expect(page.locator('[data-station="private-local-ai"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".w-stage")).toHaveAttribute("data-shot", "station");
  await expect(page.locator('[data-station="private-local-ai"]')).toBeFocused();
});

test("without WebGL, or with ?world=2d, the map is the illustrated 2D campus", async ({ page }) => {
  await page.goto("/?world=2d");
  await expect(page.locator('.c-map[data-engine="2d"]')).toBeVisible();
  await expect(page.locator(".c-plate")).toHaveCount(3);
  await expect(page.locator(".c-pin")).toHaveCount(20);
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type === "webgl" || type === "webgl2") return null;
      return original.apply(this, [type, ...args] as Parameters<typeof original>);
    } as typeof original;
  });
  await page.goto("/");
  await expect(page.locator('.c-map[data-engine="2d"]')).toBeVisible();
  await expect(page.locator(".c-map canvas")).toHaveCount(0);
  await page.locator('[data-station="aura"]').click();
  await expect(page.locator(".c-brief h2")).toHaveText("AURA");
});

test("selection survives a trip to a project page and back", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-station="aura"]').click();
  await page.locator(".c-brief").getByRole("link", { name: "Open project page" }).click();
  await expect(page).toHaveURL(/projects\/aura/);
  await page.goBack();
  await expect(page.locator(".c-brief h2")).toHaveText("AURA");
});

test("reduced motion removes the map's movement", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const t = await page
    .locator(".c-stage-inner")
    .evaluate((el) => getComputedStyle(el).transitionDuration);
  // The site's reduced-motion rule shortens every transition to a fraction of a millisecond.
  expect(parseFloat(t)).toBeLessThan(0.001);
  await page.locator('[data-station="aura"]').click();
  const anim = await page.locator(".c-brief").evaluate((el) => getComputedStyle(el).animationName);
  expect(anim === "none" || parseFloat(await page.locator(".c-brief").evaluate((el) => getComputedStyle(el).animationDuration)) < 0.001).toBe(true);
});

test("the map, preview and an exhibit have no automatic accessibility violations", async ({ page }) => {
  test.setTimeout(60000);
  await page.goto("/");
  await page.locator('[data-station="smart-parking-dbms"]').click();
  await expect(page.locator(".c-brief")).toBeVisible();
  const map = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(map.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual([]);
  await page.getByRole("button", { name: /Enter exhibit/ }).click();
  await page.locator(".ex-optional summary", { hasText: "Try a challenge" }).click();
  await page.locator(".ex-optional", { hasText: "Try a challenge" }).locator(".ch-choices").last().getByRole("button").first().click();
  const exhibit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(exhibit.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual([]);
});

test("the map keeps working without sideways scrolling at tablet and phone widths", async ({ page }) => {
  for (const [width, height] of [
    [820, 1100],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow, `${width}`).toBeLessThanOrEqual(1);
    await page.locator('[data-station="mazera-ai-maze-solver"]').click();
    await expect(page.locator(".c-brief")).toBeVisible();
    await page.getByRole("button", { name: "Close station preview" }).click();
    await expect(page.locator(".c-brief")).toHaveCount(0);
  }
});

test("exhibits fall back to their 2D versions when WebGL is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type === "webgl" || type === "webgl2") return null;
      return original.apply(this, [type, ...args] as Parameters<typeof original>);
    } as typeof original;
  });
  for (const slug of ["smart-parking-dbms", "mazera-ai-maze-solver", "pathable", "aura", "private-local-ai", "predictive-maintenance"]) {
    await page.goto(`/?exhibit=${slug}`);
    await expect(page.locator(".ex .lz[data-scene]")).toBeVisible();
    await expect(page.locator(".ex-plaque")).toContainText("What you are seeing");
    await expect(page.locator(".ex .lz canvas")).toHaveCount(0);
  }
});

test("Creative About is a notebook reachable from ordinary navigation, with no map needed", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /About/ }).first().click();
  const about = page.locator("#about");
  await expect(about.getByRole("heading", { level: 2 })).toContainText("The person behind");
  await expect(about.getByRole("heading", { name: "Still open" })).toBeVisible();
  await expect(about.getByRole("heading", { name: "How to read my labels" })).toBeVisible();
  // The "How I verify" row belongs to Professional About only.
  await expect(about).not.toContainText("How I verify");
});

test("arrow keys move between stations in a district and Tab moves between districts", async ({ page }) => {
  await page.goto("/");
  const first = page.locator('.c-island[data-district="systems"] .c-pin[tabindex="0"]');
  await expect(first).toHaveCount(1);
  await first.focus();
  const start = await page.evaluate(() => (document.activeElement as HTMLElement).dataset.station);
  await page.keyboard.press("ArrowDown");
  const moved = await page.evaluate(() => (document.activeElement as HTMLElement).dataset.station);
  expect(moved).toBeTruthy();
  expect(moved).not.toBe(start);
  await page.keyboard.press("End");
  await page.keyboard.press("Home");
  expect(await page.evaluate(() => (document.activeElement as HTMLElement).dataset.station)).toBe(start);
  // Tab leaves the district rather than visiting every station in it.
  await page.keyboard.press("Tab");
  const next = await page.evaluate(() => (document.activeElement as HTMLElement).closest(".c-island")?.getAttribute("data-district") ?? "outside");
  expect(next).not.toBe("systems");
  // Escape closes a preview and leaves focus on its station.
  await page.locator('[data-station="aura"]').click();
  await expect(page.locator(".c-brief")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".c-brief")).toHaveCount(0);
  await expect(page.locator('[data-station="aura"]')).toBeFocused();
});

test("on a tablet the station panel is a sheet inside the stage, and the station stays in view above it", async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1100 });
  await page.goto("/");
  const stage = page.locator(".w-stage");
  await page.locator('[data-station="smart-parking-dbms"]').click();
  const sheet = stage.locator(".c-brief");
  await expect(sheet).toBeVisible();
  await page.waitForTimeout(1600);
  const [s, b, pin] = await Promise.all([
    stage.boundingBox(),
    sheet.boundingBox(),
    page.locator('[data-slot="smart-parking-dbms"] .w-pin').boundingBox(),
  ]);
  expect(b!.y).toBeGreaterThanOrEqual(s!.y);
  expect(b!.y + b!.height).toBeLessThanOrEqual(s!.y + s!.height + 1);
  // The landmark's centre is above the top of the sheet.
  expect(pin!.y + pin!.height / 2).toBeLessThan(b!.y);
  await expect(sheet.getByRole("button", { name: /Enter exhibit/ })).toBeVisible();
});

test("on a phone the station panel is a bottom sheet that stays inside the screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator('[data-station="smart-parking-dbms"]').click();
  const sheet = page.locator(".c-brief");
  await expect(sheet).toBeVisible();
  await expect(sheet).toHaveCSS("position", "fixed");
  await page.waitForTimeout(1400); // the sheet slides in and the page scrolls the world up
  const b = (await sheet.boundingBox())!;
  expect(b.y).toBeGreaterThanOrEqual(0);
  expect(b.y + b.height).toBeLessThanOrEqual(844 + 1);
  // The world is brought up above the sheet, not left underneath it.
  const stage = (await page.locator(".w-stage").boundingBox())!;
  expect(stage.y).toBeGreaterThanOrEqual(0);
  expect(stage.y + stage.height).toBeLessThanOrEqual(b.y + 2);
  await expect(sheet.getByRole("button", { name: /Enter exhibit/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".c-brief")).toHaveCount(0);
});

test("rapid district and station changes settle on the last choice with no errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("/");
  const group = page.getByRole("group", { name: "District" });
  for (const name of [/^Systems/, /^Algorithms/, /^Intelligence/, /^Systems/, /^All districts/, /^Algorithms/])
    await group.getByRole("button", { name }).click({ delay: 10 });
  await page.locator('[data-station="mazera-ai-maze-solver"]').click();
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1500);
  await expect(page.locator(".w-stage")).toHaveAttribute("data-shot", "overview");
  await expect(page.locator(".c-brief")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("the station panel header: one facts line, then the evidence chips, then the caveat", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-station="smart-parking-dbms"]').click();
  const card = page.locator(".c-brief").first();
  await expect(card.locator(".c-brief-facts")).toContainText("College project");
  const chips = card.locator(".c-brief-evidence li");
  await expect(chips).toHaveCount(2);
  await expect(chips.first()).toHaveClass(/evidence-chip/);
  // The caveat is its own paragraph, not run on after a chip.
  await expect(card.locator(".c-brief-claim")).not.toContainText("Simplified Simulation");
});

test("at 820px the search field is wide enough to read its placeholder", async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 900 });
  await page.goto("/");
  const input = page.locator(".c-find input");
  await expect(input).toBeVisible();
  const box = await input.boundingBox();
  // "Find a station" at 13px needs about 90px beside its icon.
  expect(box!.width).toBeGreaterThanOrEqual(100);
  await expect(input).toHaveAttribute("placeholder", "Find a station");
});
