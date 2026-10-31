import { expect, test, type Page } from "@playwright/test";
import { TIMINGS, beat, collectRadius, passProgress, phaseOf, slit, transition, within, type Direction } from "../src/lib/transition/state";
import { cutClip, tilesOf } from "../src/lib/transition/regions";
import { QUALITY, stepDown, summarise, tierFor } from "../src/lib/transition/quality";

/**
 * Phase D: the two directions as separate choreographies, the loading skeletons for the rest of the page, the
 * quality tiers, and the ways a run can end early. The first group is pure maths (no browser); the rest runs
 * in the browser against the built site.
 */
const DIRECTIONS: Direction[] = ["to-creative", "to-pro"];

test.describe("timings", () => {
  for (const direction of DIRECTIONS) {
    test(`${direction}: the phases are contiguous and the beats fit inside the run`, () => {
      const { phases, beats, seconds } = TIMINGS[direction];
      expect(seconds).toBeGreaterThan(1.4);
      expect(seconds).toBeLessThan(2.4);
      expect(phases.aim[0]).toBe(0);
      expect(phases.aim[1]).toBe(phases.scan[0]);
      expect(phases.scan[1]).toBe(phases.settle[0]);
      expect(phases.settle[1]).toBe(1);
      for (const [name, [a, b]] of Object.entries(beats)) {
        expect(a, name).toBeGreaterThanOrEqual(0);
        expect(b, name).toBeLessThanOrEqual(1);
        expect(b, name).toBeGreaterThan(a);
      }
    });
    test(`${direction}: a scanner passes the left of the screen before the right edge, within the scan window`, () => {
      const W = 1440;
      const [a, b] = TIMINGS[direction].phases.scan;
      const xs = [0, 200, 480, 720, 960, 1240, 1440];
      const passes = xs.map((x) => passProgress(x, direction, W));
      for (const p of passes) {
        expect(p).toBeGreaterThanOrEqual(a - 1e-9);
        expect(p).toBeLessThanOrEqual(b + 1e-9);
      }
      // Going out the planes leave the centre; coming back they arrive from the edges.
      const centre = passProgress(720, direction, W);
      const edge = passProgress(0, direction, W);
      if (direction === "to-creative") expect(centre).toBeLessThan(edge);
      else expect(centre).toBeGreaterThan(edge);
    });
  }

  test("the two directions are different choreographies, not one played backwards", () => {
    const out = TIMINGS["to-creative"];
    const back = TIMINGS["to-pro"];
    expect(Object.keys(out.beats)).not.toEqual(Object.keys(back.beats));
    expect(out.phases.scan).not.toEqual(back.phases.scan);
    expect(out.seconds).not.toBe(back.seconds);
    // Creative has a tunnel (portal) and the return has none.
    expect(out.beats.portal).toBeDefined();
    expect(back.beats.portal).toBeUndefined();
    expect(back.beats.collect).toBeDefined();
    expect(back.beats.align).toBeDefined();
  });

  test("phase maths follow the direction that is running", () => {
    transition.direction = "to-pro";
    expect(phaseOf(0.1)).toBe("aim");
    expect(phaseOf(0.5)).toBe("scan");
    expect(phaseOf(0.9)).toBe("settle");
    expect(within(0.34, "scan", "to-pro")).toBe(0);
    expect(within(0.82, "scan", "to-pro")).toBe(1);
    expect(beat(0.2, "collect", "to-pro")).toBeGreaterThan(0);
    transition.direction = "to-creative";
    expect(phaseOf(0.1)).toBe("aim");
    expect(within(0.7, "scan")).toBe(1);
    // The slit is closed before the scan and open after it, whichever way it moves.
    expect(slit(1440, 0).r - slit(1440, 0).l).toBe(0);
    expect(slit(1440, 1).r - slit(1440, 1).l).toBeGreaterThan(1440);
    transition.direction = "to-pro";
    expect(slit(1440, 0).r - slit(1440, 0).l).toBeGreaterThan(1440);
    expect(slit(1440, 1).r - slit(1440, 1).l).toBeLessThanOrEqual(0);
    transition.direction = "to-creative";
  });

  test("the gather ring fits every screen", () => {
    for (const [w, h] of [[1440, 900], [820, 1180], [390, 844]]) {
      const r = collectRadius(w, h);
      expect(r).toBeGreaterThanOrEqual(90);
      expect(r * 2).toBeLessThan(Math.min(w, h));
    }
  });
});

test.describe("region tiles", () => {
  const box = { x: 100, y: 120, w: 540, h: 190 };

  test("tiles cover the region exactly, each released as a plane has passed it", () => {
    const tiles = tilesOf(box, 46, 1440);
    const area = tiles.reduce((n, t) => n + t.w * t.h, 0);
    expect(Math.round(area)).toBe(box.w * box.h);
    const [a, b] = TIMINGS["to-creative"].phases.scan;
    for (const t of tiles) {
      expect(t.pass).toBeGreaterThan(a);
      // A tile's lag is at most a few hundredths of the run, so it is released before the scan has ended.
      expect(t.pass).toBeLessThan(b + 0.1);
      expect([0, 1, 2]).toContain(t.tone);
    }
    // Tiles nearer the centre of the screen (where the planes start) are released before those further out.
    const near = tiles.filter((t) => Math.abs(t.x + t.w / 2 - 720) < 120);
    const far = tiles.filter((t) => Math.abs(t.x + t.w / 2 - 720) > 400);
    expect(Math.max(...near.map((t) => t.pass))).toBeLessThan(Math.max(...far.map((t) => t.pass)));
  });

  test("the clip is whole, then loses tiles, then is empty, and never gains one back", () => {
    const region = { id: "head", ...box, tiles: tilesOf(box, 46, 1440) };
    expect(cutClip(region, 0)).toBe("none");
    expect(cutClip(region, 1)).toBe("inset(100%)");
    let last = Infinity;
    for (let p = 0; p <= 1; p += 0.02) {
      const clip = cutClip(region, p);
      const left = clip === "none" ? region.tiles.length : clip === "inset(100%)" ? 0 : (clip.match(/M/g) ?? []).length;
      expect(left).toBeLessThanOrEqual(last);
      last = left;
    }
    // Tiles are written in the region's own pixels (0,0 is its top left).
    const mid = cutClip(region, 0.45);
    expect(mid).toMatch(/^path\("M/);
    for (const [, x, y] of mid.matchAll(/M(-?[\d.]+) (-?[\d.]+)/g)) {
      expect(Number(x)).toBeGreaterThanOrEqual(0);
      expect(Number(y)).toBeGreaterThanOrEqual(0);
    }
  });

  test("no part of a remaining tile is drawn inside the opening between the planes", () => {
    const region = { id: "head", ...box, tiles: tilesOf(box, 46, 1440) };
    for (const p of [0.3, 0.38, 0.45, 0.52]) {
      transition.direction = "to-creative";
      const open = slit(1440, p);
      const clip = cutClip(region, p, open);
      if (clip === "none" || clip === "inset(100%)") continue;
      for (const [, x, , w] of clip.matchAll(/M(-?[\d.]+) (-?[\d.]+)h(-?[\d.]+)/g)) {
        const x0 = Number(x) + region.x;
        const x1 = x0 + Number(w);
        // Each rectangle lies wholly left of the opening or wholly right of it (to a tenth of a pixel of rounding).
        expect(x1 <= open.l + 0.2 || x0 >= open.r - 0.2, `p=${p} [${x0}, ${x1}] vs [${open.l}, ${open.r}]`).toBe(true);
      }
    }
    // Before the planes part, nothing is cut.
    expect(cutClip(region, 0, slit(1440, 0))).toBe("none");
  });

  test("a bigger tile size means fewer tiles", () => {
    expect(tilesOf(box, 90, 1440).length).toBeLessThan(tilesOf(box, 40, 1440).length);
  });
});

test.describe("quality tiers", () => {
  const base = { cores: 8, load: 3_000_000 };
  test("the tier follows the device, not the size of the screen", () => {
    expect(tierFor({ ...base })).toBe("high");
    expect(tierFor({ cores: 4, load: 3_000_000 })).toBe("medium");
    expect(tierFor({ cores: 2, load: 3_000_000 })).toBe("low");
    expect(tierFor({ ...base, memory: 2 })).toBe("low");
    expect(tierFor({ ...base, memory: 4 })).toBe("medium");
    expect(tierFor({ ...base, saveData: true })).toBe("low");
    expect(tierFor({ ...base, lowBattery: true })).toBe("medium");
    // A very large canvas costs more to fill, but a phone-sized one does not lower the tier by itself.
    expect(tierFor({ cores: 8, load: 18_000_000 })).toBe("medium");
    expect(tierFor({ cores: 8, load: 342 * 390 * 2.25 })).toBe("high");
  });

  test("each step down draws less, and the lowest cuts no regions", () => {
    expect(stepDown("high", 1)).toBe("medium");
    expect(stepDown("high", 5)).toBe("low");
    expect(QUALITY.high.fragments).toBeGreaterThan(QUALITY.medium.fragments);
    expect(QUALITY.medium.fragments).toBeGreaterThan(QUALITY.low.fragments);
    expect(QUALITY.high.frames).toBeGreaterThan(QUALITY.medium.frames);
    expect(QUALITY.low.frames).toBe(0);
    expect(QUALITY.low.outlines).toBe(false);
    expect(QUALITY.low.regions).toBe(0);
    expect(QUALITY.low.dprCap).toBe(1);
  });

  test("frame gaps are summarised against the display's own interval, not a fixed 60 Hz", () => {
    const at60 = Array.from({ length: 120 }, (_, i) => (i === 40 ? 50 : 16.7));
    const s60 = summarise(at60)!;
    expect(s60.hz).toBe(60);
    expect(s60.slow).toBe(1);
    expect(s60.worst).toBe(50);
    const at120 = Array.from({ length: 200 }, (_, i) => (i % 40 === 0 ? 20 : 8.3));
    const s120 = summarise(at120)!;
    expect(s120.hz).toBe(120);
    // 20 ms is more than 1.5 intervals at 120 Hz (a missed frame), though it would pass at 60 Hz.
    expect(s120.slow).toBeGreaterThan(0);
    expect(summarise([16, 16, 16])).toBeNull();
  });
});

const html = (page: Page) => page.locator("html");
const leftovers = (page: Page) =>
  page.evaluate(() =>
    [...document.documentElement.attributes]
      .map((a) => a.name)
      .filter((n) => /^data-(shift|scanner|portal)$/.test(n))
      .concat(document.documentElement.getAttribute("style") ? ["style"] : [])
      .concat(document.getElementById("sc-morph") ? ["sc-morph"] : [])
      .concat(document.querySelector("[data-ws-region]") ? ["region"] : [])
      .concat(document.querySelector('[style*="view-transition-name"]') ? ["vt-name"] : [])
      .concat(
        [...((document.getElementById("sc-vars") as HTMLStyleElement | null)?.sheet?.cssRules ?? [])].some((r) => (r as CSSStyleRule).style.length)
          ? ["sc-vars"]
          : [],
      ),
  );
const settled = (page: Page) => expect.poll(() => leftovers(page), { timeout: 12_000 }).toEqual([]);

const prepare = async (page: Page, path = "/") => {
  await page.goto(path);
  await page.locator(".mode-switcher").hover();
  await expect(page.locator(".sc-layer canvas")).toBeAttached({ timeout: 20_000 });
  await page.waitForTimeout(400);
};
/** Records, from the first frame of a run, what the page showed during it. */
const record = (page: Page) =>
  page.evaluate(() => {
    const w = window as Window & { __run?: { regions: string[]; cuts: number; rootVars: number; covers: number; frames: number; quality: string } };
    const run = (w.__run = { regions: [] as string[], cuts: 0, rootVars: 0, covers: 0, frames: 0, quality: "" });
    const look = () => {
      if (!document.documentElement.dataset.scanner) return;
      document.querySelectorAll("[data-ws-region]").forEach((el) => {
        const id = el.getAttribute("data-ws-region")!;
        if (!run.regions.includes(id)) run.regions.push(id);
      });
      const vars = (document.getElementById("sc-vars") as HTMLStyleElement | null)?.sheet?.cssRules[0]?.cssText ?? "";
      if (vars.includes("--sc-cut-")) run.cuts++;
      if (document.documentElement.style.cssText.includes("--sc-")) run.rootVars++;
      run.covers += document.querySelectorAll(".sk-swap .sk-cover").length;
      if (document.querySelector(".sc-frame-svg")) run.frames++;
    };
    new MutationObserver(look).observe(document.documentElement, { childList: true, subtree: true, attributes: true });
    const tick = () => {
      look();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
const run = (page: Page) =>
  page.evaluate(() => (window as Window & { __run?: { regions: string[]; cuts: number; rootVars: number; covers: number; frames: number } }).__run!);

test.describe("both directions", () => {
  test("going to Creative names and cuts Professional regions, then leaves nothing behind", async ({ page }) => {
    await prepare(page);
    await record(page);
    await page.getByRole("button", { name: "Creative" }).click();
    await expect(html(page)).toHaveAttribute("data-mode", "creative");
    await settled(page);
    const seen = await run(page);
    // Headline and scene at the least; each region is a separate snapshot while the run lasts, and its clip was cut.
    // Tiles keep one small size: a region that would take more than the budget (the tall scene) is left whole.
    expect(seen.regions).toEqual(expect.arrayContaining(["head", "lede"]));
    expect(seen.regions).not.toContain("visual");
    // The scanner's variables live on rules of their own, never on <html>, so the page is not restyled every frame.
    expect(seen.rootVars).toBe(0);
    expect(seen.cuts).toBeGreaterThan(5);
    // The Professional page's destination content was ready, so no skeleton was drawn over it.
    expect(seen.covers).toBe(0);
    await expect(page.locator(".sc-frame-svg")).toHaveCount(0);
  });

  test("coming back runs its own beats (an anchor and a ring), not the reverse of the way out", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("portfolio-mode", "creative"));
    await prepare(page);
    await page.evaluate(() => {
      const w = window as Window & { __parts?: Set<string> };
      w.__parts = new Set();
      const look = () => {
        for (const sel of [".sc-anchor", ".sc-collect", ".sc-region-mark", ".sc-iris"]) if (document.querySelector(sel)) w.__parts!.add(sel);
      };
      new MutationObserver(look).observe(document.querySelector(".sc-layer")!, { childList: true, subtree: true });
    });
    await page.getByRole("button", { name: "Professional" }).click();
    await expect(html(page)).toHaveAttribute("data-mode", "pro");
    await settled(page);
    const parts = await page.evaluate(() => [...(window as Window & { __parts?: Set<string> }).__parts!]);
    expect(parts).toEqual(expect.arrayContaining([".sc-anchor", ".sc-collect"]));
    // The region marks belong to the way out only.
    expect(parts).not.toContain(".sc-region-mark");
    await expect(page.locator(".pg-card")).toHaveCount(6);
  });

  test("coming back from a selected station, the scanner locks on that station where it is drawn", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("portfolio-mode", "creative"));
    await prepare(page);
    await page.locator('[data-station="lifeos"]').first().click({ force: true });
    await expect(page.locator('.w-pin[data-station="lifeos"]')).toHaveAttribute("aria-pressed", "true");
    // Selecting a station moves the camera; wait for it to settle.
    await page.waitForTimeout(1600);
    const dot = await page.locator('.w-slot[data-slot="lifeos"] .w-dot').evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    await page.evaluate(() => {
      const w = window as Window & { __ring?: { x: number; y: number } };
      new MutationObserver((_, o) => {
        const ring = document.querySelector(".sc-collect");
        if (!ring) return;
        w.__ring = { x: Number(ring.getAttribute("cx")), y: Number(ring.getAttribute("cy")) };
        o.disconnect();
      }).observe(document.querySelector(".sc-layer")!, { childList: true, subtree: true });
    });
    await page.getByRole("button", { name: "Professional" }).click();
    await expect(html(page)).toHaveAttribute("data-mode", "pro");
    await settled(page);
    const ring = await page.evaluate(() => (window as Window & { __ring?: { x: number; y: number } }).__ring);
    expect(ring).toBeDefined();
    expect(Math.abs(ring!.x - dot.x)).toBeLessThan(3);
    expect(Math.abs(ring!.y - dot.y)).toBeLessThan(3);
  });

  test("a run takes about two seconds in each direction and ends on the chosen mode", async ({ page }) => {
    await prepare(page);
    for (const [name, mode] of [["Creative", "creative"], ["Professional", "pro"]] as const) {
      const t0 = Date.now();
      await page.getByRole("button", { name }).click();
      await expect(html(page)).toHaveAttribute("data-mode", mode);
      await settled(page);
      const ms = Date.now() - t0;
      expect(ms, `${mode} took ${ms} ms`).toBeGreaterThan(1500);
      expect(ms, `${mode} took ${ms} ms`).toBeLessThan(3600);
    }
  });
});

test.describe("interruptions", () => {
  // While a view transition runs, the browser's overlay takes every pointer event (a click on the switch reaches no
  // button), so switching back mid-run is done with the keyboard toggle, which works throughout.
  test("ten quick switches end in the last mode, with the page free to use", async ({ page }) => {
    await prepare(page);
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Alt+KeyM");
      await page.waitForTimeout(250);
    }
    // Ten toggles from Professional end in Professional.
    await settled(page);
    await expect(html(page)).toHaveAttribute("data-mode", "pro");
    const pro = page.getByRole("button", { name: "Professional" });
    const creative = page.getByRole("button", { name: "Creative" });
    await expect(pro).toHaveAttribute("aria-pressed", "true");
    await creative.click();
    await expect(html(page)).toHaveAttribute("data-mode", "creative");
    await settled(page);
  });

  test("turning back before the switch has applied ends in the mode asked for last", async ({ page }) => {
    await prepare(page);
    // The mode changes only once the old page has been captured; a request for the mode still shown, before then,
    // must not be read as "already there". Once in the cue (nothing captured yet) and once mid-run.
    for (const gap of [40, 400]) {
      await page.keyboard.press("Alt+KeyM");
      await page.waitForTimeout(gap);
      await page.keyboard.press("Alt+KeyM");
      await settled(page);
      await expect(html(page), `after ${gap} ms`).toHaveAttribute("data-mode", "pro");
      await expect(page.getByRole("button", { name: "Professional" })).toHaveAttribute("aria-pressed", "true");
    }
  });

  test("the overlay never takes a click or the keyboard while it runs", async ({ page }) => {
    await prepare(page);
    await page.getByRole("button", { name: "Creative" }).click();
    await page.waitForTimeout(500);
    const state = await page.evaluate(() => {
      const layer = document.querySelector<HTMLElement>(".sc-layer")!;
      const hit = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
      return {
        pointer: getComputedStyle(layer).pointerEvents,
        hidden: layer.getAttribute("aria-hidden"),
        covered: !!hit?.closest(".sc-layer"),
        focusable: layer.querySelectorAll("a, button, input, [tabindex]").length,
      };
    });
    expect(state).toEqual({ pointer: "none", hidden: "true", covered: false, focusable: 0 });
    // Tab goes to a real control, never into the overlay.
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => !!document.activeElement?.closest(".sc-layer, .sk-cover"))).toBe(false);
    await settled(page);
  });

  test("a hidden tab ends the run at once, and coming back finds the chosen mode and a free page", async ({ page }) => {
    await prepare(page);
    await page.getByRole("button", { name: "Creative" }).click();
    await page.waitForTimeout(700);
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect(html(page)).toHaveAttribute("data-mode", "creative");
    await settled(page);
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.waitForTimeout(300);
    expect(await leftovers(page)).toEqual([]);
    await page.getByRole("button", { name: "Professional" }).click();
    await expect(html(page)).toHaveAttribute("data-mode", "pro");
    await settled(page);
  });

  test("a stalled page (a long block between frames) ends the run instead of resuming mid-motion", async ({ page }) => {
    await prepare(page);
    await page.getByRole("button", { name: "Creative" }).click();
    await page.waitForTimeout(700);
    const t0 = Date.now();
    await page.evaluate(() => {
      const end = performance.now() + 700;
      while (performance.now() < end);
    });
    await expect(html(page)).toHaveAttribute("data-mode", "creative");
    // The run is over within a moment of the stall, long before its natural end would have left it mid-motion.
    await expect.poll(() => leftovers(page), { timeout: 6000 }).toEqual([]);
    expect(Date.now() - t0).toBeLessThan(3000);
  });

  test("a resize during the run ends it cleanly", async ({ page }) => {
    await prepare(page);
    await page.getByRole("button", { name: "Creative" }).click();
    await page.waitForTimeout(600);
    await page.setViewportSize({ width: 1100, height: 800 });
    await expect(html(page)).toHaveAttribute("data-mode", "creative");
    await settled(page);
    // The page still answers at its new size.
    await page.getByRole("button", { name: "Professional" }).click();
    await expect(html(page)).toHaveAttribute("data-mode", "pro");
    await settled(page);
  });

  test("a transition that fails still lands in the chosen mode, with focus kept on the switch", async ({ page }) => {
    await prepare(page);
    await page.evaluate(() => {
      Object.defineProperty(document, "startViewTransition", {
        configurable: true,
        value: (update: () => void) => {
          update();
          return { ready: Promise.reject(new Error("no")), finished: Promise.resolve(), skipTransition() {} };
        },
      });
    });
    await page.getByRole("button", { name: "Creative" }).focus();
    await page.keyboard.press("Enter");
    await expect(html(page)).toHaveAttribute("data-mode", "creative");
    await expect(page.locator('[data-mode-option="creative"]')).toBeFocused();
    await settled(page);
  });

  test("the run's own listeners are removed when it ends", async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as Window & { __net?: Record<string, number> };
      w.__net = {};
      type Listening = { addEventListener: (...a: unknown[]) => void; removeEventListener: (...a: unknown[]) => void };
      for (const target of [document, window] as unknown as Listening[]) {
        const add = target.addEventListener.bind(target);
        const remove = target.removeEventListener.bind(target);
        target.addEventListener = (type: unknown, ...rest: unknown[]) => {
          if (type === "visibilitychange") w.__net!.visibilitychange = (w.__net!.visibilitychange ?? 0) + 1;
          return add(type, ...rest);
        };
        target.removeEventListener = (type: unknown, ...rest: unknown[]) => {
          if (type === "visibilitychange") w.__net!.visibilitychange = (w.__net!.visibilitychange ?? 0) - 1;
          return remove(type, ...rest);
        };
      }
    });
    await prepare(page);
    const before = await page.evaluate(() => (window as Window & { __net?: Record<string, number> }).__net!.visibilitychange ?? 0);
    await page.getByRole("button", { name: "Creative" }).click();
    await expect(html(page)).toHaveAttribute("data-mode", "creative");
    await settled(page);
    await page.getByRole("button", { name: "Professional" }).click();
    await expect(html(page)).toHaveAttribute("data-mode", "pro");
    await settled(page);
    const after = await page.evaluate(() => (window as Window & { __net?: Record<string, number> }).__net!.visibilitychange ?? 0);
    expect(after).toBe(before);
  });
});

test.describe("phones", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  test("both directions run, cut at most two regions, and settle", async ({ page }) => {
    await prepare(page);
    await record(page);
    await page.locator('[data-mode-option="creative"]').first().tap();
    await expect(html(page)).toHaveAttribute("data-mode", "creative");
    await settled(page);
    expect((await run(page)).regions.length).toBeLessThanOrEqual(2);
    await page.locator('[data-mode-option="pro"]').first().tap();
    await expect(html(page)).toHaveAttribute("data-mode", "pro");
    await settled(page);
  });

  // A tap is sent at the switch's place on screen: a locator tap first scrolls its target into view, and for a button
  // in the sticky header that scrolls the page (Playwright's doing, which once looked like a jump in the site).
  test("tapping the switch far down the page does not move the page before the switch", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("portfolio-mode", "creative"));
    await prepare(page);
    await page.locator('[data-station="lifeos"]').first().click({ force: true });
    await page.waitForTimeout(800);
    await page.evaluate(() => scrollTo(0, 976));
    await page.waitForTimeout(400);
    const before = await page.evaluate(() => scrollY);
    expect(before).toBeGreaterThan(600);
    await page.evaluate(() => {
      const w = window as Window & { __atTap?: number };
      addEventListener("click", () => (w.__atTap = scrollY), { capture: true, once: true });
    });
    const box = (await page.locator('[data-mode-option="pro"]').first().boundingBox())!;
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    await expect(html(page)).toHaveAttribute("data-mode", "pro");
    await settled(page);
    expect(await page.evaluate(() => (window as Window & { __atTap?: number }).__atTap)).toBe(before);
  });
});

test.describe("quality tiers in the browser", () => {
  test("a run records how this device coped, from the timeline's own frames", async ({ page }) => {
    await prepare(page);
    await page.getByRole("button", { name: "Creative" }).click();
    await expect(html(page)).toHaveAttribute("data-mode", "creative");
    await settled(page);
    const last = await page.evaluate(() => JSON.parse(sessionStorage.getItem("ws-quality") ?? "{}").last);
    expect(last.frames).toBeGreaterThan(20);
    expect(last.hz).toBeGreaterThan(20);
    expect(last.hz).toBeLessThan(250);
    expect(last.worst).toBeGreaterThan(0);
  });

  test("the lowest tier cuts no regions and still runs both ways", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("portfolio-quality", "low"));
    await prepare(page);
    await record(page);
    await page.getByRole("button", { name: "Creative" }).click();
    await expect(html(page)).toHaveAttribute("data-mode", "creative");
    await settled(page);
    const seen = await run(page);
    expect(seen.regions).toEqual([]);
    expect(seen.frames).toBeGreaterThan(5);
    await page.getByRole("button", { name: "Professional" }).click();
    await expect(html(page)).toHaveAttribute("data-mode", "pro");
    await settled(page);
  });

  test("the medium tier cuts fewer regions than the highest", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("portfolio-quality", "medium"));
    await prepare(page);
    await record(page);
    await page.getByRole("button", { name: "Creative" }).click();
    await expect(html(page)).toHaveAttribute("data-mode", "creative");
    await settled(page);
    const seen = await run(page);
    expect(seen.regions.length).toBeGreaterThan(0);
    expect(seen.regions.length).toBeLessThanOrEqual(3);
  });

  test("runs that went badly step the next one down, and the step is kept for the visit", async ({ page }) => {
    await page.addInitScript(() => {
      if (!sessionStorage.getItem("ws-quality")) sessionStorage.setItem("ws-quality", JSON.stringify({ bias: 2, clean: 0 }));
    });
    await prepare(page);
    await record(page);
    await page.getByRole("button", { name: "Creative" }).click();
    await expect(html(page)).toHaveAttribute("data-mode", "creative");
    await settled(page);
    // Two steps below the device's own tier is the lowest: nothing was cut.
    expect((await run(page)).regions).toEqual([]);
  });
});

test.describe("loading skeletons", () => {
  /** Delays the code of a scene the page has not loaded yet, so its skeleton has something to wait for. */
  const slowScenes = (page: Page, ms: number) =>
    page.route("**/_next/static/**/*.js", async (route) => {
      await new Promise((r) => setTimeout(r, ms));
      await route.continue();
    });

  test("a scene whose code is slow shows a skeleton in its frame, then the scene, with nothing moved by a focus trap", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".s3-stage canvas")).toBeAttached({ timeout: 20_000 });
    await slowScenes(page, 1800);
    // A category whose scene has not been loaded yet.
    await page.locator(".hx-lenses").getByRole("button", { name: /Intelligence/ }).click();
    const region = page.locator(".lz-explorer .sk-swap").first();
    await expect(region).toHaveAttribute("aria-busy", "true");
    const cover = region.locator(".sk-cover");
    await expect(cover).toBeVisible({ timeout: 3000 });
    // It is decorative: hidden from assistive technology, inert, and never a place for the keyboard to go.
    await expect(cover).toHaveAttribute("aria-hidden", "true");
    expect(await cover.evaluate((el) => (el as HTMLElement & { inert?: boolean }).inert)).toBe(true);
    expect(await cover.locator("a, button, input, [tabindex]").count()).toBe(0);
    // It has the frame of a scene: a viewport at least as tall as the stage's floor.
    expect(await cover.locator(".sk-vp").evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThan(250);
    // The wait gets one status line, after a second, naming the real operation.
    await expect(region.locator('[role="status"]')).toHaveText(/Loading/, { timeout: 4000 });
    expect(await region.locator('[role="status"]').count()).toBe(1);
    // Then the scene arrives, the skeleton wipes away and the region is no longer busy.
    await expect(region).not.toHaveAttribute("aria-busy", "true", { timeout: 15_000 });
    await expect(region.locator(".sk-cover")).toHaveCount(0, { timeout: 3000 });
    await expect(region.locator(".s3-stage, .lz-viz").first()).toBeVisible();
  });

  test("a scene that is already loaded shows no skeleton at all", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".s3-stage canvas")).toBeAttached({ timeout: 20_000 });
    // Visit a second scene once, so both are loaded.
    await page.locator(".s3-picker").getByRole("button").nth(1).click();
    await expect(page.locator(".s3-stage canvas")).toBeAttached({ timeout: 20_000 });
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      const w = window as Window & { __cover?: number };
      w.__cover = 0;
      new MutationObserver(() => {
        w.__cover! += document.querySelectorAll(".sk-swap .sk-cover").length;
      }).observe(document.body, { childList: true, subtree: true, attributes: true });
    });
    // Back and forth between scenes that are already in memory.
    await page.locator(".s3-picker").getByRole("button").nth(0).click();
    await page.locator(".s3-picker").getByRole("button").nth(1).click();
    await page.locator(".s3-picker").getByRole("button").nth(0).click();
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => (window as Window & { __cover?: number }).__cover)).toBe(0);
  });

  test("with reduced motion the skeleton is static", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator(".s3-stage canvas")).toBeAttached({ timeout: 20_000 });
    await slowScenes(page, 1500);
    await page.locator(".hx-lenses").getByRole("button", { name: /Intelligence/ }).click();
    const shimmer = page.locator(".lz-explorer .sk-swap .sk-shimmer").first();
    await expect(shimmer).toBeAttached({ timeout: 3000 });
    expect(await shimmer.evaluate((el) => getComputedStyle(el).display)).toBe("none");
  });

  test("skeleton tokens are in place for both modes", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".s3-stage canvas")).toBeAttached({ timeout: 20_000 });
    await slowScenes(page, 1500);
    await page.locator(".hx-lenses").getByRole("button", { name: /Intelligence/ }).click();
    const cover = page.locator(".lz-explorer .sk-cover").first();
    await expect(cover).toBeVisible({ timeout: 3000 });
    expect(await cover.evaluate((el) => getComputedStyle(el).getPropertyValue("--sk-surface").trim())).toBe("#ece9e0");
  });
});
