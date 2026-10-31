import { test, expect } from "@playwright/test";
import { projects } from "../src/data/projects";
import { demoMedia, hasVideo, mediaFor, missingMedia } from "../src/data/demo-media";

/*
 * The demonstration-video system: every project has a capture plan, a video appears only when the file, its
 * poster and its captions all exist, and a project without one says so plainly instead of showing a fake.
 */
test("every project has exactly one media record with a real plan", () => {
  expect(missingMedia()).toEqual([]);
  expect(new Set(demoMedia.map((m) => m.slug)).size).toBe(projects.length);
  expect(demoMedia).toHaveLength(projects.length);
  for (const m of demoMedia) {
    expect(projects.some((p) => p.slug === m.slug), m.slug).toBe(true);
    expect(m.workflow.length, m.slug).toBeGreaterThan(30);
    expect(m.shots.length, m.slug).toBeGreaterThanOrEqual(3);
    expect(m.limitation.length, m.slug).toBeGreaterThan(20);
    expect(m.captureNote.length, m.slug).toBeGreaterThan(15);
    expect(["automatic", "manual", "mixed"], m.slug).toContain(m.capture);
    expect(m.seconds, m.slug).toBeGreaterThanOrEqual(10);
    expect(m.seconds, m.slug).toBeLessThanOrEqual(45);
  }
});

test("featured projects get the longer recordings and design-stage ones are labelled as designs", () => {
  for (const p of projects.filter((p) => p.featured)) expect(mediaFor(p)!.seconds, p.slug).toBeGreaterThanOrEqual(30);
  const sig = mediaFor(projects.find((p) => p.slug === "sigsmith")!)!;
  expect(sig.demoClass).toBe("architecture");
  expect(sig.limitation).toMatch(/design/i);
});

test("a video needs its poster and captions, and no file is published before it exists", () => {
  for (const m of demoMedia) {
    if (m.video) expect(hasVideo(m), `${m.slug} has a video without a poster and captions`).toBe(true);
    expect(m.status === "planned" ? m.video : true, m.slug).toBe(null);
  }
});

test("each project page shows the video frame with an honest state, and loads no video", async ({ page }) => {
  test.setTimeout(120_000);
  for (const mode of ["pro", "creative"] as const) {
    await page.addInitScript((m) => localStorage.setItem("portfolio-mode", m), mode);
    for (const slug of ["smart-parking-dbms", "nexus", "sigsmith"]) {
      await page.goto(`/projects/${slug}/`);
      // Creative mode tells the story in steps; the demonstration is the second.
      if (mode === "creative") await page.getByRole("tab", { name: /Try the demonstration/ }).click();
      const frame = page.locator(".dv");
      await expect(frame, `${mode} ${slug}`).toHaveCount(1);
      await expect(frame.locator(".dv-state")).toContainText("Video in preparation");
      await expect(frame.locator("video")).toHaveCount(0);
      await expect(frame.locator(".dv-limit")).toContainText("What it is not");
      const ratio = await frame.locator(".dv-frame").evaluate((el) => el.getBoundingClientRect().width / el.getBoundingClientRect().height);
      expect(ratio).toBeGreaterThan(1.7);
      expect(ratio).toBeLessThan(1.85);
    }
  }
});
