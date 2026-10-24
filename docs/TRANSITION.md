# Mode transition: the Precision Scanner

The switch between Professional and Creative mode is one controller,
`worldShift()` in `src/lib/world-shift.ts`. It picks how to animate each switch:

| Style | When | What it is |
| --- | --- | --- |
| `scanner` | default | The Precision Scanner described below |
| `portal` | `?transition=portal` or localStorage `portfolio-transition = "portal"` | The earlier 3D portal ride, kept for comparison |
| `ring` | the chosen layer is not available | A circle revealing the new page from the switch |
| none | reduced motion, or no View Transitions API | The mode just changes (a short cross-fade without View Transitions) |

## What the visitor sees

One structure leads the whole transition: a large aperture, about three
quarters of a laptop screen's height across, made of two half-rings. Each
half-ring carries a scanner line along its straight edge. The two directions
are the same shape opening and closing.

**Professional → Creative: outward assembly**

- **Cue:** a reticle locks onto the switch and a line reaches for the centre. This plays on the live page before anything is captured.
- **Aim:** the aperture assembles at the centre: fine ring, glow, ticks, coloured segments, iris and core. Chevrons show which way it will open.
  - The Professional page dims a little, so the scanner reads as light.
  - Small markers light up on Professional's real structure, from the centre outward: the borders of its panels and the nodes of its blueprint grid in open space.
- **Scan:** the vertical diameter lights up and the aperture splits. Each half leads its scanner outward to the edge.
  - The Creative page is revealed, fully lit, inside the widening slit.
  - Behind each scanner, grid lines break into dashes and then into paper dots, and soft colour fields bloom behind Creative's coloured blocks.
  - Each marker is released as a scanner passes it. It arcs toward the viewer and lands on Creative's real structure: the dashed edge of an island or the note, in that block's colour, or a paper dot in open space.
- **Settle:** the particles hold the outlines of the new layout for a moment, then clear from the centre outward and the overlay clears.

**Creative → Professional: inward convergence**

- **Cue:** the reticle locks onto the switch, and shapes pop up along the edges of Creative's blocks.
- **Aim (gather):** the shapes are gathered onto the alignment axis, each above the column it will land in, losing their tumble. Colour fields contract and the Creative page drains of colour.
  - A faint target marks the centre, where the halves will lock.
  - The scanner lines draw down at the edges and a dashed alignment axis reaches out from the centre.
- **Scan:** the two scanners close in from the edges, each followed by its half of the ring, like brackets closing.
  - The Professional page appears behind them, outside the closing slit, while the Creative page inside it is compressed.
  - Behind the scanners, dots draw into dashes and then into the blueprint grid.
  - Each shape is placed as a scanner passes its column: it drops from the axis onto Professional's structure (a panel border or a grid node) and becomes a small ink or cobalt mark.
- **Settle:** the scanners meet and the two halves close into one ring. The aperture locks (iris, core and a cobalt ring), corner marks snap in at the viewport corners, the marks fade from the centre outward and everything clears.

**In both directions**

- **Shared elements:** the header and any project cards on screen keep their identity and move to their new places. Each one moves as a scanner passes it, not all at once.
- **Interface arrival:** the new page's main blocks arrive the same way: Creative's districts and stations pop in, and Professional's hero copy and scene panel align.
- **No text is covered at rest:** particles only rest on block borders and in open space; open-space places avoid every heading, line of copy and control, and the header.
- **The 3D scene:** a mode switch rebuilds the hero, but the scene's canvas mounts at once and compiles its shaders without blocking, so no loading message appears during the run (see Performance below). The visitor's chosen category and scene are kept across the switch.

## Timing

| Beat | Time |
| --- | --- |
| Cue | 0.14 s (`CUE_SECONDS`) |
| Snapshot capture | about 45 ms on an Apple GPU (measured) |
| Main timeline (`SCANNER_SECONDS`) | 1.8 s: aim 0 to 0.2, scan 0.2 to 0.7, settle 0.7 to 1 (`PHASES` in `src/lib/transition/state.ts`) |
| Click to rest | about 2.1 s (measured) |

## The contract

`src/lib/transition/state.ts` holds the shared state. **Two numbers drive everything:**

- `cue` runs from 0 to 1 before the snapshot is taken.
- `progress` runs from 0 to 1 during the transition.

Renderers are pure functions of them and of `direction`, so any frame can be reproduced by setting them. GSAP moves both in straight lines; all easing lives in the renderers.

- **`slit(width, progress)`:** where the two scanners are.
- **`passProgress(x)`:** the moment a scanner passes x. Particles, shared-element morphs and interface arrivals all use it, so they agree with the line the visitor sees.

## Who owns what

| Owner | Job | Where |
| --- | --- | --- |
| GSAP | Master timeline; moves `cue` and `progress`; paints the `--sc-*` CSS variables that place the scanners (and the halves riding them) and light the snapshots | `src/lib/transition/scanner.ts` |
| View Transitions + CSS | The two page snapshots: slit clip, scale, filter; the shared-element morph | `world-shift.css` |
| Anime.js | Every drawn stroke in the frame: reticle, aperture halves, iris, core, chevrons, scanner lines, corners. Two paused timelines that GSAP seeks | `src/components/scanner/scanner-frame.tsx` |
| React Three Fiber | Particles (instanced, lit and outlined), the background band shader | `src/components/scanner/scanner-canvas.tsx`, `particle-layout.ts` |
| Layout reader | Reads each page's bordered blocks and the text to keep clear of, at the click and once the new page has rendered | `src/lib/transition/layout.ts` |
| Motion | The new page's blocks arriving as the scanner passes them | `src/components/shift-intro.ts` |

GSAP's lag smoothing is off. GSAP shares the clock with the browser's own transition animations, which run in real time, so a slow device skips frames but stays in step.

## Lifecycle and safety

The run moves through five states:

1. **Start.** `transition.running` is set, `data-scanner` goes on `<html>` and the cue tween plays.
2. **Capture.** `startViewTransition` takes the old snapshot and renders the new page.
3. **Run.** `transition.started` is set and the main timeline plays.
4. **Finish.** The view transition's `finished` promise clears every attribute, variable, injected style and morph name.
5. **Cancel.** A new switch, or a failed transition, clears the same things immediately.

The page is protected throughout:

- **Pointer:** the overlay is `aria-hidden` and has no pointer events, so it never blocks the page.
- **Focus:** a keyboard switch keeps focus on the same option in the new header.
- **Announcement:** `#mode-announcer` announces the new mode.
- **Section:** the visitor stays at the same section of the page.

## Performance

- **Frame layer:** the SVG frame is always ready.
- **Particle layer:** the WebGL particle layer loads on intent (pointer or focus at the switch) or once the page settles. It also warms Creative's fonts.
- **The particle layer never loads during a run.** A new canvas compiles on the GPU, and the browser waits for that before it can show the new page.
- **Scenes rebuilt by a switch do not wait.** The Professional hero's scene canvas mounts at once with its loop off, compiles its shaders without blocking (`compileAsync`), and starts drawing when they are ready, about 0.35 s into the run on an Apple GPU. Scene code that is already loaded renders on the first pass (no suspense fallback), and from Creative the hero scene's code is fetched on intent. No loading message shows during a run; one shows only if a scene is still not ready after the run.
- **Particle counts:** 120 on desktop, 96 on tablets, 64 on phones, in three shapes (cube, diamond, ring). Each shape is one instanced mesh plus one outline mesh.
- **Layout reading:** 1.5 to 3.4 ms per switch on the home pages (measured).
- **Low-power fallback:** without WebGL, or on devices that report at most 2 GB of memory or 2 cores, or that ask to save data, the scanner runs with its drawn frame only.
- **Rendering cost:** DPR is capped at 1.5, and the canvas renders only during a run.
- **Measured:** headless Chromium on an Apple M5 GPU (1440 × 900, production build), three runs each way: 2.06 to 2.14 s from click to rest, median frame 16.7 ms, 95th percentile 16.8 ms, and one or two frames of 50 to 100 ms per run around the capture.

## Not verified

- **Cold first switch:** the first switch after a fresh page load, before the visitor has pointed at the switch, runs with the drawn frame only (the particle layer has not loaded yet). Its smoothness on a real GPU was not measured.
- **Real Safari and Firefox windows:** both engines were driven through Playwright only (Firefox 157, WebKit 27.2). See Browsers below.
- **Devices:** no real phone has been tested; phone widths were checked in headless Chromium, Firefox and WebKit.
- **Weaker machines:** the timings above are from one Apple GPU. On a computer without a good GPU the hero scene's first frame can still stall a switch (headless software rendering showed a stall of about a second).

## Browsers

Checked with Playwright on the final build: Chromium (the system Chrome), Firefox 157 and WebKit 27.2, all of which support View Transitions. Where the API is missing, the modes cross-fade instead.

- **Transition tests:** all 9 in `tests/transition.spec.ts` pass in each of the three.
- **Full suite (113 tests):** Firefox passed 111; the two failures are clipboard tests that grant a Chromium-only permission. WebKit passed 104 on its first run, and every failure also happens without this work or is a timing flake that passes alone:
  - the same two clipboard tests;
  - "a quick view opens in place", which fails the same way on the live V5 site;
  - five "direct route and refresh" tests, which hit different routes on each run (also on the live V5 site) because WebKit logs an access-control message for a Next.js data fetch and shows the loading heading beside the page heading for a moment;
  - one architecture walkthrough timing test, which passes alone.
- **Looking at it:** both directions were recorded in real time in Firefox and WebKit at desktop and phone width, and the aperture, particles, slit, shared-element moves and the settle all render. Two notes on the tooling:
  - Playwright's WebKit screenshots leave out the scanner layer, so use its video there.
  - Playwright's Firefox video shows blank frames for any view transition on this site, including the earlier scanner and a plain cross-fade. Real-time Firefox screenshots show none, but this could not be told apart from real flicker without a real Firefox window.

## Testing

`tests/transition.spec.ts` covers:

- both directions and their cleanup
- search, filters and section surviving the switch
- rapid switching
- keyboard focus and the announcement
- reduced motion
- loading on intent
- the WebGL-free run
- the portal opt-in
- the hero scene being rebuilt without a loading message, and keeping its category

In development, `window.__worldShiftGsap` and `window.__transition` allow frozen-frame capture: pause GSAP, step the cue, then scrub the main timeline.
