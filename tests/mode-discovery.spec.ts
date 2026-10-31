import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Creative Mode discoverability: the mode switch keeps its words as far down as the header allows (full labels, then short
 * labels under the icons, then icons alone below 350 px), and a first-time visitor gets one small, dismissible pointer.
 * "First time" is read from the storage the site already has: a stored mode means the switch has been used.
 */
const HINT = ".mode-hint";
const MODE_KEY = "portfolio-mode";
const HINT_KEY = "portfolio-creative-hint";

const stored = (page: Page, key: string) => page.evaluate((k) => localStorage.getItem(k), key);
const seed = (page: Page, entries: Record<string, string>) =>
  page.addInitScript((e) => {
    if (sessionStorage.getItem("seeded")) return;
    sessionStorage.setItem("seeded", "1");
    for (const [k, v] of Object.entries(e)) localStorage.setItem(k, v);
  }, entries);
const settled = (page: Page) =>
  expect.poll(() => page.evaluate(() => !document.documentElement.dataset.scanner && !document.documentElement.dataset.shift), { timeout: 12_000 }).toBe(true);

test.describe("first-time visitor", () => {
  test("sees one small tip near the switch, and it describes the Creative option", async ({ page }) => {
    await page.goto("/");
    const hint = page.locator(HINT);
    await expect(hint).toBeVisible({ timeout: 6000 });
    await expect(hint).toContainText("Discover Creative Mode — explore my projects in an interactive 3D studio.");
    await expect(hint).toHaveAttribute("role", "group");
    await expect(page.locator('[data-mode-option="creative"]')).toHaveAttribute("aria-describedby", "mode-hint");
    // It is announced once through the existing polite live region.
    await expect(page.locator("#mode-announcer")).toHaveText(/Discover Creative Mode/);
    // It sits under the switch and covers neither the switch, the links, nor the call to action.
    const box = (await hint.boundingBox())!;
    for (const sel of [".mode-switcher", ".desktop-nav", ".nav-contact", ".wordmark"]) {
      const other = await page.locator(sel).first().boundingBox();
      if (!other) continue;
      const overlap = box.x < other.x + other.width && other.x < box.x + box.width && box.y < other.y + other.height && other.y < box.y + box.height;
      expect(overlap, `hint covers ${sel}`).toBe(false);
    }
    expect(await stored(page, HINT_KEY)).toBe("1");
    // It does not take focus or move the page.
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe("BODY");
  });

  test("is dismissed by a tap elsewhere, Escape, the close button, a mode switch and the 8-second timer, and then stays gone", async ({ browser }) => {
    test.setTimeout(60_000);
    const fresh = async () => {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      await page.goto("/");
      await expect(page.locator(HINT)).toBeVisible({ timeout: 6000 });
      return { ctx, page };
    };
    // tap elsewhere
    let t = await fresh();
    await t.page.mouse.click(300, 600);
    await expect(t.page.locator(HINT)).toHaveCount(0);
    await expect(t.page.locator('[data-mode-option="creative"]')).not.toHaveAttribute("aria-describedby", /.+/);
    // gone for good on a reload and a second page
    await t.page.reload();
    await t.page.waitForTimeout(2600);
    await expect(t.page.locator(HINT)).toHaveCount(0);
    await t.ctx.close();
    // Escape
    t = await fresh();
    await t.page.keyboard.press("Escape");
    await expect(t.page.locator(HINT)).toHaveCount(0);
    await t.ctx.close();
    // close button, by keyboard
    t = await fresh();
    await t.page.locator(".mode-hint-close").focus();
    await t.page.keyboard.press("Enter");
    await expect(t.page.locator(HINT)).toHaveCount(0);
    await t.ctx.close();
    // switching mode
    t = await fresh();
    await t.page.locator('[data-mode-option="creative"]').click();
    await expect(t.page.locator(HINT)).toHaveCount(0);
    await settled(t.page);
    await expect(t.page.locator("html")).toHaveAttribute("data-mode", "creative");
    await t.ctx.close();
    // after about 8 seconds
    t = await fresh();
    await t.page.waitForTimeout(7000);
    await expect(t.page.locator(HINT)).toBeVisible();
    await expect(t.page.locator(HINT)).toHaveCount(0, { timeout: 4000 });
    await t.ctx.close();
  });

  test("passes automated accessibility checks with the tip on screen, on a desktop and a phone", async ({ browser }) => {
    for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      const ctx = await browser.newContext({ viewport: vp, isMobile: vp.width < 640, hasTouch: vp.width < 640 });
      const page = await ctx.newPage();
      await page.goto("/");
      await expect(page.locator(HINT)).toBeVisible({ timeout: 6000 });
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`), `${vp.width}px`).toEqual([]);
      // The close button is a real target (WCAG 2.5.8 asks for at least 24 px).
      const close = (await page.locator(".mode-hint-close").boundingBox())!;
      expect(Math.min(close.width, close.height)).toBeGreaterThanOrEqual(24);
      await ctx.close();
    }
  });

  test("waits while it is being read: hovering the tip holds the timer", async ({ page }) => {
    test.setTimeout(45_000);
    await page.goto("/");
    const hint = page.locator(HINT);
    await expect(hint).toBeVisible({ timeout: 6000 });
    await hint.hover();
    await page.waitForTimeout(9500);
    await expect(hint).toBeVisible();
    await page.mouse.click(300, 700);
    await expect(hint).toHaveCount(0);
  });

  test("the switch stays operable by keyboard with the tip showing, and the mode persists", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(HINT)).toBeVisible({ timeout: 6000 });
    // Safari-family browsers skip buttons when tabbing unless a system option is on, so focus is placed directly; the
    // activation by keyboard is what is under test (both buttons are native buttons in the document's tab order).
    await page.locator('[data-mode-option="creative"]').focus();
    expect(await page.evaluate(() => document.activeElement?.getAttribute("data-mode-option"))).toBe("creative");
    await page.keyboard.press("Enter");
    await expect(page.locator("html")).toHaveAttribute("data-mode", "creative");
    await settled(page);
    expect(await stored(page, MODE_KEY)).toBe("creative");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-mode", "creative");
    await page.waitForTimeout(2600);
    await expect(page.locator(HINT)).toHaveCount(0);
  });

  test("with reduced motion the tip appears without animation", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const hint = page.locator(HINT);
    await expect(hint).toBeVisible({ timeout: 6000 });
    expect(await hint.evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
    expect(await hint.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
  });
});

test.describe("returning visitors", () => {
  test("a stored mode (they have used the switch) never shows the tip, in either mode", async ({ page }) => {
    for (const mode of ["pro", "creative"]) {
      await page.addInitScript((m) => localStorage.setItem("portfolio-mode", m), mode);
      await page.goto("/");
      await page.waitForTimeout(2600);
      await expect(page.locator(HINT)).toHaveCount(0);
      expect(await stored(page, HINT_KEY)).toBeNull();
    }
  });

  test("a visitor who has already seen the tip does not see it again", async ({ page }) => {
    await seed(page, { [HINT_KEY]: "1" });
    await page.goto("/");
    await page.waitForTimeout(2600);
    await expect(page.locator(HINT)).toHaveCount(0);
  });

  test("blocked storage shows nothing rather than a tip that could repeat", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", { get: () => { throw new Error("blocked"); }, configurable: true });
    });
    await page.goto("/");
    await page.waitForTimeout(2600);
    await expect(page.locator(HINT)).toHaveCount(0);
  });
});

test.describe("the switch keeps its words", () => {
  // width: [mode label style] full = words beside icons, short = short words under icons, icons = icons only
  const tiers: [number, "full" | "short" | "icons"][] = [
    [1440, "full"], [1280, "full"], [1100, "full"], [1024, "full"], [900, "full"], [768, "full"],
    [541, "full"], [540, "short"], [390, "short"], [360, "short"], [350, "short"], [349, "icons"], [320, "icons"],
  ];
  for (const mode of ["pro", "creative"] as const) {
    for (const [width, style] of tiers) {
      test(`${mode} header at ${width}px: ${style} labels, nothing overlaps, clipped or scrolling`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 });
        await page.addInitScript((m) => localStorage.setItem("portfolio-mode", m), mode);
        await page.goto(mode === "creative" ? "/?world=2d" : "/");
        await page.waitForSelector(".mode-switcher");
        await page.waitForTimeout(600);
        const r = await page.evaluate(() => {
          const pick = (s: string) => {
            const e = [...document.querySelectorAll(s)].find((x) => getComputedStyle(x).display !== "none");
            return e ? e.getBoundingClientRect() : null;
          };
          const parts = Object.fromEntries(Object.entries({ brand: ".wordmark, .c-brand", nav: ".desktop-nav, .c-dock", sw: ".mode-switcher", cta: ".nav-contact, .c-hi", menu: ".mobile-menu-toggle, .c-menu-toggle" }).map(([k, s]) => [k, pick(s)]));
          const rects = Object.entries(parts).filter(([, v]) => v && v.width) as [string, DOMRect][];
          const overlaps: string[] = [];
          for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) if (rects[i][1].left < rects[j][1].right - 0.5 && rects[j][1].left < rects[i][1].right - 0.5) overlaps.push(`${rects[i][0]}/${rects[j][0]}`);
          const shown = (cls: string) => [...document.querySelectorAll(".mode-option")].map((o) => { const s = o.querySelector(cls) as HTMLElement; const b = s.getBoundingClientRect(); return getComputedStyle(s).display !== "none" && b.width > 4 && b.height > 4; });
          return {
            overlaps,
            right: Math.max(...rects.map(([, v]) => v.right)),
            hscroll: document.documentElement.scrollWidth > innerWidth,
            ctaHeight: parts.cta ? parts.cta.height : 0,
            full: shown(".mode-label").every(Boolean),
            short: shown(".mode-short").every(Boolean),
            names: [...document.querySelectorAll(".mode-option")].map((o) => o.textContent),
          };
        });
        expect(r.overlaps).toEqual([]);
        expect(r.hscroll).toBe(false);
        expect(r.right).toBeLessThanOrEqual(width - 12);
        expect(r.ctaHeight).toBeLessThan(50); // the call to action stays on one line
        if (style === "full") expect(r.full).toBe(true);
        if (style === "short") { expect(r.short).toBe(true); expect(r.full).toBe(false); }
        if (style === "icons") { expect(r.short).toBe(false); expect(r.full).toBe(false); }
        // Whatever is seen, the buttons are always named in full for assistive technology.
        for (const [i, name] of ["Professional", "Creative"].entries()) expect(r.names[i]).toContain(name);
        await expect(page.locator('[data-mode-option="pro"]')).toBeVisible();
        await expect(page.locator('[data-mode-option="creative"]')).toBeVisible();
      });
    }
  }

  test("the tip fits inside a phone screen and never reaches the menu button or the page edge", async ({ browser }) => {
    for (const width of [390, 360, 320]) {
      const ctx = await browser.newContext({ viewport: { width, height: 800 }, isMobile: true, hasTouch: true });
      const page = await ctx.newPage();
      await page.goto("/");
      const hint = page.locator(HINT);
      await expect(hint).toBeVisible({ timeout: 6000 });
      const b = (await hint.boundingBox())!;
      expect(b.x, `${width}px left edge`).toBeGreaterThanOrEqual(8);
      expect(b.x + b.width, `${width}px right edge`).toBeLessThanOrEqual(width - 8);
      const menu = (await page.locator(".mobile-menu-toggle").boundingBox())!;
      expect(b.y).toBeGreaterThanOrEqual(menu.y + menu.height - 1);
      // tapping the page dismisses it
      await page.touchscreen.tap(width / 2, 600);
      await expect(hint).toHaveCount(0);
      await ctx.close();
    }
  });
});

test.describe("modes and motion are unaffected", () => {
  test("both transition directions work from the labelled switch, on a phone too", async ({ browser }) => {
    for (const vp of [{ width: 1280, height: 800 }, { width: 390, height: 800 }]) {
      const ctx = await browser.newContext({ viewport: vp, isMobile: vp.width < 640, hasTouch: vp.width < 640 });
      await ctx.addInitScript(() => localStorage.setItem("portfolio-mode", "pro"));
      const page = await ctx.newPage();
      await page.goto("/");
      await page.locator('[data-mode-option="creative"]').click();
      await expect(page.locator("html")).toHaveAttribute("data-mode", "creative");
      await settled(page);
      await page.waitForSelector(".c-map", { timeout: 20_000 });
      await page.locator('[data-mode-option="pro"]').click();
      await expect(page.locator("html")).toHaveAttribute("data-mode", "pro");
      await settled(page);
      await ctx.close();
    }
  });

  test("the pro menu now opens at tablet widths and lists the same links", async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 800 });
    await page.addInitScript(() => localStorage.setItem("portfolio-mode", "pro"));
    await page.goto("/");
    await expect(page.locator(".desktop-nav")).toBeHidden();
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    const nav = page.getByRole("navigation", { name: "Mobile navigation" });
    await expect(nav).toBeVisible();
    for (const name of ["Projects", "Toolkit", "About", "Contact"]) await expect(nav.getByRole("link", { name })).toBeVisible();
    // below the header, not over it
    const header = (await page.locator(".site-header").boundingBox())!;
    expect((await nav.boundingBox())!.y).toBeGreaterThanOrEqual(header.y + header.height - 2 - 1);
  });
});
