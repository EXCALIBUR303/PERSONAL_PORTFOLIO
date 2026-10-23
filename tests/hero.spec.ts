import { test, expect } from "@playwright/test";

/** Real WebGL (no mocking): the hero scene itself. */
for (const mode of ["pro", "creative"] as const) {
  test(`${mode}: 3D hero is framed, interactive and does not trap the page`, async ({
    page,
  }) => {
    test.setTimeout(60000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error" && !/hmr|WebSocket/i.test(m.text()))
        errors.push(m.text());
    });
    await page.addInitScript(
      (m) => localStorage.setItem("portfolio-mode", m),
      mode,
    );
    await page.goto("/");
    const stage = page.locator(".hx-stage");
    await expect(stage).toHaveAttribute("data-state", "live", {
      timeout: 30000,
    });
    const canvas = stage.locator("canvas");
    await expect(canvas).toBeVisible();
    // The canvas fills its container: nothing clipped, nothing overflowing.
    const sizes = await stage.evaluate((el) => {
      const wrap = el.querySelector<HTMLElement>(".hx-canvas-wrap")!;
      const cv = el.querySelector<HTMLCanvasElement>("canvas")!;
      return {
        wrap: [wrap.clientWidth, wrap.clientHeight],
        canvas: [cv.clientWidth, cv.clientHeight],
      };
    });
    expect(Math.abs(sizes.canvas[0] - sizes.wrap[0])).toBeLessThan(2);
    expect(Math.abs(sizes.canvas[1] - sizes.wrap[1])).toBeLessThan(2);
    const ratio = sizes.wrap[0] / sizes.wrap[1];
    expect(ratio).toBeGreaterThan(1.1);
    expect(ratio).toBeLessThan(1.4);
    // Touch scrolling is preserved on the canvas.
    expect(
      await canvas.evaluate((el) => getComputedStyle(el).touchAction),
    ).toBe("pan-y");
    // Every lens renders without errors.
    for (const name of [
      "02 / Algorithms",
      "03 / Intelligence",
      "01 / Systems",
    ]) {
      await page.getByRole("button", { name, exact: true }).click();
      await expect(
        page.getByRole("button", { name, exact: true }),
      ).toHaveAttribute("aria-pressed", "true");
      await page.waitForTimeout(400);
    }
    // Controls and keyboard.
    await page.getByRole("button", { name: "Zoom in" }).click();
    await page.getByRole("button", { name: "Zoom out" }).click();
    await page.getByRole("button", { name: "Reset sculpture view" }).click();
    await stage.locator(".hx-canvas-wrap").focus();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("+");
    await page.keyboard.press("0");
    await page.getByRole("button", { name: "Pause sculpture" }).click();
    await expect(
      page.getByRole("button", { name: "Play sculpture" }),
    ).toBeVisible();
    // The wheel scrolls the page instead of zooming the model.
    const before = await page.evaluate(() => window.scrollY);
    const c = await canvas.boundingBox();
    await page.mouse.move(c!.x + c!.width / 2, c!.y + c!.height / 2);
    await page.mouse.wheel(0, 300);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(before);
    expect(errors).toEqual([]);
  });
}

test("reduced motion: the scene renders once and no autoplay control is offered", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".hx-stage")).toHaveAttribute(
    "data-state",
    "live",
    {
      timeout: 30000,
    },
  );
  await expect(
    page.getByRole("button", { name: /(Pause|Play) sculpture/ }),
  ).toHaveCount(0);
});
