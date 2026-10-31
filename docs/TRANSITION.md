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

The two directions are separate choreographies with their own beats and their own lengths
(`TIMINGS` in `src/lib/transition/state.ts`). One structure leads both: a large aperture, about three
quarters of a laptop screen's height across, made of two half-rings, each carrying a scanner line. What
happens around it is different.

**Professional → Creative: scan, decompose, tunnel, assemble** (1.9 s)

- **Lock (cue and first 12 %):** a reticle locks onto the switch and a line reaches for the centre, on the live page, before anything is captured. Corner marks appear on the Professional regions the planes are about to read.
- **Decompose:** the two scanners part from the centre. The Professional page is the old snapshot outside the slit. Selected regions (the headline, and on larger screens the lede, actions and facts) are separate snapshots, cut into tiles of one small size (44 px, 34 px on phones; `lib/transition/regions.ts`). A region whose tiles would go over the tier's budget (the tall scene panel, usually) is left whole and revealed by the planes like the rest of the page, rather than cut into bigger pieces. The part of a tile a plane has crossed is clipped out at once, so no Professional text is ever seen inside the opening over Creative; the rest of the tile goes a few milliseconds later, when a paper tile of the same size and place lifts off as a 3D fragment. No heading is split into letters.
- **Tunnel:** the aperture opens into a tunnel. Five octagonal frames sit behind it at different depths and rush past the viewer (three on phones). The Creative page arrives from depth: small inside the aperture at first, then the camera moves in until it fills the view (scale 0.84 to 1). The tiles dive into the mouth of the tunnel, small and deep, and come out along the line to where they will land.
- **Assemble:** the tiles land on the map as the world's own shape: a lime seed on every station's foot, dashes laid along each island outline in its district colour. The skeleton of the map is already there for any part of the world that is not drawn yet, and wipes away as the real 3D studio is ready.
- **Resolve:** the fragments clear from the centre outward; the overlay clears; the map is at the right district and its controls work.

**Creative → Professional: anchor, collect, align, close** (1.8 s)

There is no tunnel, no depth frames and no snapshot cutting. The motion is collection and alignment.

- **Anchor:** a reticle locks onto the selected station where its marker is drawn now (selecting a station moves the camera, so the map's opening footprint would be wrong) if it is on screen, otherwise the middle of the map, otherwise the middle of the screen. The Creative page starts to recede toward that point.
- **Collect:** fragments lift off the world's own islands (dashes along each outline) and stations (diamonds), nearest first, and gather on a dashed ring around the anchor.
- **Align:** the ring has done its work. Fragments go in through the anchor (the aperture) and come out along the line to a row: the baselines of the Professional text, found with a Range over the real text of the new page (`readRows` in `lib/transition/layout.ts`). Each lies on its row as a cobalt or ink rule about 30 x 3 px; side by side they draw the line. A tick lands about 90 ms before the bracket that reveals that text, so it marks the line the type is set on rather than lying across the Creative page for long.
- **Close:** the scanners come in from the edges as brackets. The Professional page appears behind them, outside the closing slit, while the Creative page inside it is compressed and drained of colour. Behind them dots draw into dashes and then into the blueprint grid. As a bracket passes a row, its ticks drop two pixels onto the line and give way to the real text.
- **Lock:** the brackets meet; the aperture locks (iris, core, cobalt ring); crop marks snap in at the viewport corners; everything has faded out by the end of the timeline, so nothing is cut off when the view transition ends. Focus is on the same switch option and the page is where the visitor was.

**In both directions**

- **Shared elements:** the header and any project cards on screen keep their identity and move to their new places, each as a scanner passes it.
- **Interface arrival:** the new page's main blocks arrive the same way.
- **No text is covered at rest:** fragments only rest on block borders, on rows and in open space that avoids text, controls and the header.
- **Loading:** any part of the destination that is not ready shows a skeleton in its own footprint (below).

## Timing

Each direction has its own table (`TIMINGS`); every renderer reads it, and nothing else holds a duration.

| | Professional → Creative | Creative → Professional |
| --- | --- | --- |
| Cue (before capture) | 0.14 s | 0.14 s |
| Main timeline | 1.9 s | 1.8 s |
| `aim` / `scan` / `settle` | 0 to 0.2 / 0.2 to 0.7 / 0.7 to 1 | 0 to 0.34 / 0.34 to 0.82 / 0.82 to 1 |
| Beats | lock 0 to 0.12, decompose 0.2 to 0.62, portal 0.16 to 0.66, assemble 0.4 to 0.88, resolve 0.86 to 1 | anchor 0 to 0.12, collect 0.06 to 0.34, align 0.26 to 0.58, close 0.34 to 0.82, lock 0.8 to 0.94, resolve 0.9 to 1 |
| Click to rest (measured, 60 Hz) | see Performance | see Performance |

## The contract

`src/lib/transition/state.ts` holds the shared state. **Two numbers drive everything:**

- `cue` runs from 0 to 1 before the snapshot is taken.
- `progress` runs from 0 to 1 during the transition.

Renderers are pure functions of them and of `direction`, so any frame can be reproduced by setting them. GSAP moves both in straight lines; all easing lives in the renderers. Nothing integrates over time, so the speed is the same at any refresh rate and a skipped frame only skips a sample.

- **`timing(direction)`, `within(progress, phase, direction)`, `beat(progress, name, direction)`:** the direction's table.
- **`slit(width, progress)`:** where the two scanners are.
- **`passProgress(x)`:** the moment a scanner passes x. Particles, tiles, shared-element morphs and interface arrivals all use it, so they agree with the line the visitor sees.

## Who owns what

| Owner | Job | Where |
| --- | --- | --- |
| GSAP | Master timeline; moves `cue` and `progress`; paints the `--sc-*` CSS variables (scanner positions, snapshot clip, scale and light, and `--sc-cut-<region>`, what is left of each cut region). They are written to two rules of their own in `<style id="sc-vars">` (`html::view-transition` for the snapshots, `.sc-layer` for the drawn frame), never to `<html>`: a custom property on `<html>` is inherited by the whole page, and each frame would restyle every element (about 1,600, 5 to 6 ms a frame on an M5) | `src/lib/transition/scanner.ts` |
| View Transitions + CSS | The page snapshots, the region snapshots (their clip), the shared-element morph | `world-shift.css`, `lib/transition/regions.ts` |
| Anime.js | Every drawn stroke in the frame: reticle, region corner marks, anchor and collect ring, aperture halves, brackets, iris, core, crop marks. Two paused timelines that GSAP seeks | `src/components/scanner/scanner-frame.tsx` |
| React Three Fiber | Fragments (instanced, lit and outlined; tiles are flat plates), the depth frames (one merged line set), the background band shader. It has no loop of its own: it is drawn from the master timeline's update | `src/components/scanner/scanner-canvas.tsx`, `particle-layout.ts` |
| Layout reader | Reads each page's bordered blocks, the text to keep clear of, the world's islands and stations, and the baselines of the text | `src/lib/transition/layout.ts` |
| Quality | Chooses a tier before each run and learns from the last runs | `src/lib/transition/quality.ts` |
| Motion | The new page's blocks arriving as the scanner passes them | `src/components/shift-intro.ts` |
| Skeletons | The loading skeletons, their gate and wipe | `src/components/skeleton/` |

GSAP's lag smoothing is off. GSAP shares the clock with the browser's own transition animations, which run in real time, so a slow device skips frames but stays in step.

## Lifecycle and safety

The run moves through five states:

1. **Start.** `transition.running` is set, `data-scanner` goes on `<html>`, the quality tier is chosen, the regions are planned (going out) or the anchor is found (coming back), and the cue tween plays.
2. **Capture.** The regions are given their view-transition names; `startViewTransition` takes the old snapshot and renders the new page.
3. **Run.** `transition.started` is set and the main timeline plays.
4. **Finish.** The view transition's `finished` promise clears every attribute, variable, injected style, region name and morph name, and the run's timing is recorded for the next run's tier.
5. **Cancel.** A new switch, or a failed transition, clears the same things immediately.

The run is also ended at once, with the mode applied, when:

- it has not finished 3.2 s after the click (watchdog);
- the tab is hidden (frames stop, so it would resume mid-motion later);
- the viewport is resized (the geometry the layers were built for no longer fits);
- two updates are more than 400 ms apart (the page was blocked or suspended).

Listeners and timers for all of these are removed in every case. The page is protected throughout:

- **Pointer:** the overlay is `aria-hidden` and has no pointer events, so it never blocks the page.
- **Focus:** a keyboard switch keeps focus on the same option in the new header.
- **Announcement:** `#mode-announcer` announces the new mode.
- **Section:** the visitor stays at the same section of the page.

## Loading skeletons

`src/components/skeleton/`. The rules are the same wherever one appears:

- it has the footprint of what it stands for;
- it shows only if the content is not ready after 150 ms (`SKELETON_DELAY_MS`); content that is ready sooner never shows one;
- it stays until the content is ready (no minimum time) and leaves with a wipe, or a short fade under reduced motion;
- it is `aria-hidden` and `inert`, the region is `aria-busy`, and after a second one `role="status"` line names the real operation; after eight seconds the line says it is taking longer than usual;
- there is no progress figure and no invented message;
- under a running mode transition the skeleton is already in place when the page is revealed, and its clocks start when the run ends.

Where it is used: the Creative studio map (its own drawing of the islands, `studio-skeleton.tsx`), every scene (the Professional hero viewport and every exhibit: toolbar, viewport with a silhouette, controls, `SceneSkeleton`), the "Checking for 3D support" wait (`SceneWait`), and the demonstration video's poster and first frame (`MediaSkeleton`; no video exists yet, so this path has no live case).

## Quality tiers

Decided before each run, never during one (`lib/transition/quality.ts`).

| Tier | Fragments | Depth frames | Outlines | Pixel ratio cap | Cut regions |
| --- | --- | --- | --- | --- | --- |
| high | 100 % of the layout's count (160 / 112 / 72) | 5 (3 on phones) | yes | 1.5 | up to 5 (2 on phones) |
| medium | 70 % | 3 | yes | 1.25 | up to 3 |
| low | 40 % (at least 40) | 0 | no | 1 | none |

The base tier comes from CPU cores, reported memory, the pixel load of the canvas (viewport times the squared pixel ratio), a save-data request and, where the browser reports it, a low battery that is not charging. It is not derived from the screen size alone. A correction from the last runs on this device is kept in sessionStorage (`ws-quality`): after a run with more than 6 frames over 1.5 times the display's own interval, or any frame over 100 ms, the next run steps one tier down; after three clean runs it steps back up. The interval comes from the 10th percentile of the run's own frame gaps, so it follows the display. `localStorage["portfolio-quality"]` (`high`, `medium`, `low`) overrides the choice. Reduced motion has no scanner at all, and devices that report 2 cores or 2 GB, or ask to save data, keep the scanner frame without the 3D fragments (existing behaviour).

## Performance

- **Frame layer:** the SVG frame is always ready.
- **Particle layer:** the WebGL layer loads on intent (pointer or focus at the switch) or once the page settles. It also warms Creative's fonts.
- **The particle layer never loads during a run.** A new canvas compiles on the GPU, and the browser waits for that before it can show the new page.
- **One loop:** the scanner canvas is drawn from the master timeline's update, in the same callback that paints the page variables, so a run has no second frame callback of its own. The page's other loops (the 3D hero, Motion, Anime.js) are unchanged.
- **Scenes rebuilt by a switch do not wait.** Scene code that is already loaded renders on the first pass; from Creative the hero scene's code is fetched on intent. A scene whose code is not there yet shows its skeleton.
- **Per frame:** no geometry is created, no React state is set. A tile's clip is rewritten only in frames where a tile was cut.
- **Capture frame:** `performance` marks `ws:cue-end`, `ws:regions-named`, `ws:update`, `ws:rendered`, `ws:named` and `ws:measured` show where the time goes (see docs/V6-PHASE-D-IMPLEMENTATION.md for numbers).
- **Keeping the capture frame to one layout:** the work inside the update callback should read the new page's layout once. Things that would read or restyle it again wait until the snapshot exists (`whenStarted`), when the new page is still hidden behind the scanners: the arrivals' starting state and box reads (`shift-intro.ts`), the stroke drawing's `createDrawable`, the canvas sketches (`mini-anim.tsx`). The switch lets go of focus before the old header is removed (removing a focused element forces a style and layout pass of the old page), and the studio map's WebGL check runs at idle time on the Professional page. Found with a Chrome trace that records the JS stack of each forced style and layout pass.
- **Low-power fallback:** without WebGL, or on devices that report at most 2 GB or 2 cores, or that ask to save data, the scanner runs with its drawn frame only.

## Not verified

- **Cold first switch:** the first switch after a fresh page load, before the visitor has pointed at the switch, runs with the drawn frame only (the particle layer has not loaded yet). Its smoothness on a real GPU was not measured.
- **Real Safari and Firefox windows:** both engines were driven through Playwright only (Firefox 157, WebKit 27.2). See Browsers below.
- **Devices:** no real phone has been tested; phone widths were checked in headless Chromium, Firefox and WebKit.
- **90, 120 and 144 Hz:** the animation is a function of elapsed time and the scanner is drawn once per browser frame, so it should follow the display, but it was measured only at 60 Hz. No claim is made beyond that.
- **Weaker machines:** the timings above are from one Apple GPU. On a computer without a good GPU the hero scene's first frame can still stall a switch (headless software rendering showed a stall of about a second).

## Browsers

Phase D re-check (Firefox 157 and WebKit 27.2 through Playwright): `transition.spec.ts`, `transition-d.spec.ts` and `skeleton.spec.ts` all pass in Firefox; in WebKit all pass except one skeleton reduced-motion timing race that passes alone. The notes below are from the earlier tranche.

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
- the watchdog and a hidden tab

`tests/transition-d.spec.ts` covers the Phase D work: per-direction timing maths, region tiles and their clip, quality tiers, both directions' own beats, ten quick switches, the overlay never taking input, a hidden tab, a stalled page, a resize, a failing view transition, listener cleanup, phones, each quality tier, and the skeletons (slow code, already loaded, reduced motion, tokens). `tests/skeleton.spec.ts` covers the studio skeleton.

In development, `window.__worldShiftGsap` and `window.__transition` allow frozen-frame capture: pause GSAP, step the cue, then scrub the main timeline.
