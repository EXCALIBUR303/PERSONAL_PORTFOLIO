import { test, expect, type Page } from "@playwright/test";
import { projects } from "../src/data/projects";
import { evidence } from "../src/data/evidence";

const setMode = (page: Page, mode: "pro" | "creative") =>
  page.addInitScript((m) => localStorage.setItem("portfolio-mode", m), mode);

/** The decided Studio Map split (8 / 5 / 7). Districts are assigned explicitly, never from tags. */
const DISTRICTS: Record<string, string[]> = {
  systems: [
    "aura",
    "smart-parking-dbms",
    "private-local-ai",
    "uco-recovery-station",
    "green-mobility",
    "lifeos",
    "burnout-backend",
    "rupeerise",
  ],
  algorithms: [
    "mazera-ai-maze-solver",
    "last-mile-daa",
    "pathable",
    "parkscan-swarm",
    "football-penalty-shootout",
  ],
  intelligence: [
    "swarmmind",
    "quadruped-rl",
    "predictive-maintenance",
    "aeris",
    "student-burnout-ai",
    "resume-screener",
    "sigsmith",
  ],
};

test("districts are explicit and split 8 / 5 / 7 with the decided members", () => {
  expect(projects).toHaveLength(20);
  for (const [district, slugs] of Object.entries(DISTRICTS)) {
    const actual = projects
      .filter((p) => p.district === district)
      .map((p) => p.slug)
      .sort();
    expect(actual).toEqual([...slugs].sort());
  }
  expect(new Set(projects.map((p) => p.slug)).size).toBe(20);
  expect(projects.filter((p) => p.district === "systems")).toHaveLength(8);
  expect(projects.filter((p) => p.district === "algorithms")).toHaveLength(5);
  expect(projects.filter((p) => p.district === "intelligence")).toHaveLength(7);
});

test("the featured six are the evidence-led set and featuring changes no district", () => {
  const featured = projects
    .filter((p) => p.featured)
    .map((p) => p.slug)
    .sort();
  expect(featured).toEqual(
    [
      "smart-parking-dbms",
      "mazera-ai-maze-solver",
      "pathable",
      "aura",
      "private-local-ai",
      "predictive-maintenance",
    ].sort(),
  );
});

test("the Creative map renders the same 8 / 5 / 7 districts", async ({
  page,
}) => {
  await setMode(page, "creative");
  await page.goto("/");
  await expect(page.locator(".c-island")).toHaveCount(3);
  await expect(page.locator(".c-pin")).toHaveCount(20);
  for (const [district, slugs] of Object.entries(DISTRICTS)) {
    const island = page.locator(`.c-island[data-district="${district}"]`);
    await expect(island.locator(".c-pin")).toHaveCount(slugs.length);
    for (const slug of slugs) {
      const title = projects.find((p) => p.slug === slug)!.title;
      await expect(
        island.getByRole("button", { name: new RegExp(escape(title)) }),
      ).toHaveCount(1);
    }
  }
});

function escape(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("every project has evidence with a claim class, a caveat and a matching audited commit", () => {
  for (const project of projects) {
    const item = evidence[project.slug];
    expect(item, project.slug).toBeTruthy();
    expect(item.claimClass, project.slug).toBeTruthy();
    expect(item.caveat.length, project.slug).toBeGreaterThan(10);
    for (const list of [item.ran, item.read, item.notChecked])
      expect(list.length, project.slug).toBeLessThanOrEqual(3);
    if (item.auditedCommit && project.sourceCommit)
      expect(project.sourceCommit.startsWith(item.auditedCommit), project.slug).toBe(true);
  }
  expect(Object.keys(evidence).sort()).toEqual(projects.map((p) => p.slug).sort());
});

test("the evidence strip renders on every project page in both modes", async ({
  page,
}) => {
  test.setTimeout(180000);
  for (const mode of ["pro", "creative"] as const) {
    await page.addInitScript((m) => localStorage.setItem("portfolio-mode", m), mode);
    for (const project of projects) {
      await page.goto(`/projects/${project.slug}/`);
      const strip = page.locator(".evidence-strip");
      await expect(strip, `${mode} ${project.slug}`).toHaveCount(1);
      await expect(strip).toContainText(evidence[project.slug].claimClass);
      await expect(strip).toContainText("Caveat");
    }
  }
});

test("featured cards show a claim chip and a caveat in Professional mode", async ({
  page,
}) => {
  await setMode(page, "pro");
  await page.goto("/");
  const cards = page.locator(".pg-card");
  await expect(cards).toHaveCount(6);
  await expect(cards.locator(".evidence-line")).toHaveCount(6);
});
