# Creative Studio: ambient motion

Branch `creative-ambient-motion`, cut from production `441c2cc`. **Nothing is committed, pushed or deployed.**
This is the implementation and validation report. It says what moves, what it costs, what was measured, what was
only emulated and what is still open. **Measured** results (counts, milliseconds, percentages, test outcomes) are
separated from **visual judgements**. **Visual approval has not been given**: whether 30 draws a second looks smooth,
whether the motion is "alive but not distracting", and whether it avoids looking like a screensaver are the owner's
calls, from the recordings listed at the end. The 30 draws/s default itself was chosen by the owner ("Keep 30").

## What visitors get without touching anything

| Layer | What moves | Where | Runs at |
| --- | --- | --- | --- |
| Landmark float | Each landmark rises and falls about 3 to 4 px peak to peak at 1440 x 900, on its own period (5.8 to 9 s) and phase. Explorable stations also turn about half a degree. Labels, markers and hit areas are DOM elements placed from the footprint, so they do not move with it. | 3D, **high tier only** for the sway | 30 draws/s |
| Studio breath | The Studio's interior light and lime sign swell and fade every 4.8 s (about 15/255 in brightness on the sign). | 3D, high and medium | 30 draws/s |
| Travelling lights | A small light crosses one bridge at a time, Studio to district, in the district's colour (a trailing light and halo on the high tier). A new crossing starts every 3.4 s. | 3D, high and medium; low tier and Save-Data see fewer | 30 draws/s |
| Key light | Strength drifts by about 4.5 % over 38 s; direction never changes, so shadows stay valid. | 3D, high tier | 30 draws/s |
| Cloud shadows and sun sweep | Two clouds and a sun sweep cross the map (44, 60 and 26 s cycles; were 110, 150 and 64 s and too faint). | CSS, every tier, no 3D cost | display rate |
| Station ripples | The 9 explorable stations' markers take turns to send out a soft lime ring (21.6 s cycle, 2.4 s apart). | CSS, 3D map | display rate |
| 2D map | A light travels from the Studio along one link at a time; explorable stations glow in turn and float 2 px (not on phones). | CSS, 2D map | display rate |

Everything stops under **Pause motion** (a button in the map toolbar, kept for the visit) and under reduced motion,
which is genuinely static and shows no button.

## Architecture

- `world/ambient.ts`: the shared store (`ambient.t`, `amount`, `level`, `rich`, `visible`, `busyUntil`, `bridge`), the
  level per tier (`full` high and medium, `events` low, `saver` Save-Data, `off` reduced motion), the pause state
  (`sessionStorage["studio-motion-paused"]`), and the rate (`?ambient=30|60`, default **30**).
- `scene/ambient-clock.tsx` (inside the world canvas, **no loop of its own**): each frame advances the clock, fades the
  motion in (0.8 s) and out (0.5 s), and asks R3F for the next frame only while there is something to show. In the
  event levels it sleeps between events and a single timeout asks for one frame to wake it (it requests a frame of
  the existing loop; it does not draw).
- **30 draws a second without a second loop.** `HalfRate` is a `useFrame` subscriber with a positive priority, which makes
  R3F hand drawing over to it; it draws on alternate frames, and on every frame while the visitor is interacting
  (`markBusy`: a camera move, a hover or selection, the pause toggle, a visibility change) or while the motion fades.
- Everything that moves reads the store in its own `useFrame`. No React state is set per frame; materials and
  geometries are created once (the bridge lights, their halo and tail share one geometry and per-bridge materials).
- Visibility: an `IntersectionObserver` on the stage (`world-stage.tsx`), `document.hidden`, and the existing
  `paused` prop (exhibit open, map hidden) all feed `ambientWanted()`.
- The compositor layer (clouds, ripples) and the 2D map are CSS under `prefers-reduced-motion: no-preference`, paused
  by `data-still` on the map (needed `!important`: the animation shorthands that start them have higher specificity).
- Also fixed on the way: the scanner's 3D particles no longer load on a software renderer (`scanner-layer.tsx`).

## Changed files

Modified: `src/app/map-2d.css`, `studio.css`, `world.css`; `creative/studio/map-2d.tsx`, `plates.tsx`,
`studio-map.tsx`; `creative/world/scene/bridges.tsx`, `landmark.tsx`, `studio.tsx`; `world-canvas.tsx`,
`world-stage.tsx`; `components/scanner/scanner-layer.tsx`.
New: `creative/world/ambient.ts`, `creative/world/scene/ambient-clock.tsx`, `creative/studio/motion-toggle.tsx`,
`tests/ambient.spec.ts` (10 tests), `docs/ambient-motion/` (stills), this file.

## Cost: 30 versus 60 frames a second

Method (repeatable): production static build, Chrome for Testing 156, M5, 60 Hz, 1440 x 900, a fresh browser per run,
3 s settle, then a **30 s window** with no input and **no screencast**, measured through CDP (`Performance.getMetrics`
for main-thread task time, `SystemInfo.getProcessInfo` for per-process CPU time, a `gl.clear` counter for draws, a
`requestAnimationFrame` sampler for frame gaps, `PerformanceObserver` for long frames). Runs were **interleaved**
(60, 30, 60, 30, 60, 30) so drift in the machine's load does not favour either. Script: `scratchpad/amb/prof.mjs`.

| | 60 draws/s (mean of 3) | 30 draws/s (mean of 3) | Static (reduced motion) |
| --- | --- | --- | --- |
| Draws counted per second | 64.3 | 34.3 | 0 |
| Main-thread busy | **23.0 %** (22.3 to 24.2) | **15.1 %** (14.2 to 16.0) | 1.0 % |
| Script time | 18.6 % | 10.8 % | 0.1 % |
| Renderer process CPU | 33.3 % | 23.7 % | 2.3 % |
| GPU process CPU | 21.8 % | 15.1 % | not measured |
| Frame gap median / p95 / p99 / max | 16.7 / 16.7 / 16.8 / 16.8 ms | 16.7 / 16.8 / 16.8 / 16.8 ms | same |
| Long frames (LoAF) and long tasks | 0 and 0 | 0 and 0 | 0 and 0 |

Draw counts include the shadow pass (about 4.5 a second), so 64.3 is 60 and 34.3 is 30 draws.
Going from 60 to 30 cuts main-thread time by about a third, the renderer's CPU by 29 % and the GPU process's by 31 %.

- **Where the time goes.** A 10 s CPU profile at 60 shows idle time 89 %, and the rest in three.js
  (`renderBufferDirect`, matrix updates, uniform uploads). None of the ambient `useFrame` code appears among the top
  functions, so cost follows the number of draws, which is why halving them works.
- **The earlier "6 to 7 %" run** was recorded with the CDP screencast on. With the screencast running the same
  scene reads 7.8 % main-thread busy while the browser process jumps to about 40 %: the work moves, it does not
  disappear. **CPU numbers taken during a recording are not comparable; the table above is without one.**
- **GPU utilisation** is not available as a percentage here; the GPU-process CPU time above is the closest proxy, and
  Metal GPU counters were not read.
- Under 4x CPU throttling both rates hold p99 at 16.8 ms in a 20 s idle window; the throttled main-thread figures
  are not comparable with the table (the throttle itself shows as renderer CPU of 82 to 84 %), so none is quoted.

**Is 30 smooth enough? (a visual judgement, not measured, not approved by me on the owner's behalf).** I could only judge
this from frame sequences, crops and step sizes, not by watching in real time as a person would. The owner then viewed
real-speed recordings (below) and chose 30. By geometry the fastest ambient 3D motion is the bridge light, about 0.7 px per frame at 60
and 1.3 px per frame at 30 (bridge runs of 60 to 100 px crossed in 2.6 s); the landmarks' float is below 0.1 px a
frame at either rate; the CSS layers run at the display's rate regardless. Interaction is not slowed: a camera move
or hover draws at the full rate (a test checks more than 30 draws in 700 ms during a district move). I therefore set
the **default to 30** and left `?ambient=60` to compare. `docs/ambient-motion` has no videos (size); the 30 and 60
recordings are listed under "Recordings".

## Tier by tier (measured, 16 s windows, Chrome for Testing, M5)

| Condition | Engine | What moves | 3D draws per second |
| --- | --- | --- | --- |
| High | 3D | float, sway, Studio breath, bridge lights with halo and tail, light drift, clouds, ripples | 34.3 (30 draws), continuous |
| Medium (`?world=medium`) | 3D | float, Studio breath, plain bridge lights, clouds, ripples (no sway, halo, tail or drift) | 34.3, continuous |
| Low (`?world=low`) | 3D | a bridge light every 5.5 s (2.6 s long), clouds, ripples | 13.7, sleeps in 12 of 32 half-seconds |
| Save-Data | 3D | a bridge light every 11 s, clouds, ripples | 4.9, sleeps in 24 of 32 |
| Phone (Pixel 7 emulation, medium) | 3D | as medium | 34.3 (the stage must be on screen) |
| Software WebGL (`--disable-gpu`) | **2D map** | CSS lights, glows, floats; no 3D, no scanner particles | 0 |
| No WebGL | 2D map | as above | 0 |
| Reduced motion | 3D or 2D | **nothing**; no pause button | 0 |

Before this round the low tier drew 27 times a second and Save-Data 9.8; both now halve with the 30-draw rule. Medium
differs from high only in detail, not in cadence; if medium devices are the ones struggling, a lower medium cadence is the
next lever. The 2D map on a phone shows only the stations' glow (no floats, no link lights: the phone layout is a row
of cards), so it is the quietest variant.

## Validation

- **Visual.** Recorded 32 s without any input on the final build: desktop 3D, phone 3D (Pixel 7 emulation, 412 x 915),
  desktop 2D and phone 2D, plus a 20 s desktop run at 60. Over 32 s, 33.8 % of the desktop frame changed at some point
  (landmarks, light and the bridge lights; heat map in `docs/ambient-motion`). Measured: the Studio sign's brightness
  ranged 15/255; the sampled sky patch changed 1.8/255 (the key-light drift and clouds are close to the threshold of
  being seen on their own); the one landmark I could block-match moved -3 to +1 px (two other sample boxes read 0, so
  either their float is under a pixel or my boxes were poorly placed). **The most visible items are the bridge lights, the
  ripples and the Studio's breath; floating and drift are deliberately faint.** Labels and markers stay put.
- **Accessibility.** The pause button is a native button in the map toolbar (so it is reachable on a phone, where a
  button pinned inside the map was below the fold), keyboard-operable with Enter and Space, relabelled
  Pause or Resume motion, keeps focus, stops both the 3D draws and every running CSS animation in the map, restarts
  on resume, is held across a trip to Professional and back and across a reload in the same tab, and leaves station
  selection working. Reduced motion shows no button, draws nothing and runs no animation. Operating-system
  preferences are never overridden.
- **Tests** (`tests/ambient.spec.ts`, 10 tests, **all pass in Chromium, Firefox and WebKit**): moves with no input;
  30 by default and 60 on request, with camera moves at full rate; sleeps off screen; hidden tab; pause (keyboard,
  label, focus, 3D and CSS, persistence, stations usable, resume); scanner transitions undisturbed, twice;
  reduced motion static; low tier and Save-Data draw in bursts and sleep; 2D map moves and pauses; 2D still under reduced motion.

### Full suite, three browsers (217 tests each, final build, no skipped tests in any run)

Run against the production static build served locally (`scratchpad/d8out`, port 3040), one worker, one browser at a
time. Total / passed / failed / skipped:

| Browser | Total | Passed | Failed | Skipped |
| --- | --- | --- | --- | --- |
| Chrome for Testing 156 (Chromium engine) | 217 | **217** | 0 | 0 |
| Installed Google Chrome 156.0.8078.74 | 217 | 203 | 14 | 0 |
| Firefox 157 (Playwright) | 217 | 215 | 2 | 0 |
| WebKit build 2370 (Playwright; stands in for Safari) | 217 | 201 | 16 | 0 |

**Failures, classified. None is a new ambient-motion regression.**

- *Installed Google Chrome, 14 failures: browser/environment, not the app.* Every one reads "Target page, context or
  browser has been closed", across unrelated files (`ambient`, `hero`, `landmarks`, `modes`, `portfolio`, `studio`,
  `transition`, `transition-d`). With `DEBUG=pw:browser` the browser logs `process did exit: exitCode=0` about 30 s into
  a test: the installed Chrome app is quit cleanly from outside the test (its log also shows macOS display-link
  errors). Re-running only those 14: 11 passed; of the other 3, `ambient.spec.ts:177` and `transition-d.spec.ts:483`
  passed on a second re-run and `landmarks.spec.ts:16` (a 32 s test) failed at the same ~30 s point every time, on the
  original `playwright.config.ts` as well. The same test **passes in 35.8 s on Chrome for Testing**, and the whole suite
  passes 217 of 217 there. (An earlier full run on this branch passed 217 of 217; the installed Chrome has been quit from outside only in this later session.) The tests were not
  changed and no application code was changed to hide this.
- *Firefox, 2 failures: environment.* The two clipboard tests (`portfolio.spec.ts:469`, `universe.spec.ts:111`):
  `grantPermissions: Unknown permission: clipboard-write`. Playwright's Firefox does not have that permission. Existing,
  unrelated to ambient motion.
- *WebKit, 16 failures: existing and environment.* The same two clipboard tests; `portfolio.spec.ts:156` (the quick view,
  which also fails against the live site); and 13 "direct route and refresh" tests (`strict mode violation: h1 resolved
  to 2 elements`, WebKit blocks the RSC prefetch from the local Python server; they pass against Vercel; the count varies
  between runs: 10, 13 and 15 across full runs). Existing, unrelated to ambient motion.
- The 10 ambient tests pass in all three engines when the browser stays up (Chrome for Testing, Firefox, WebKit).

### Scanner transitions with ambient motion on

*Functional* (`scratchpad/d/scan-func.mjs`, Chrome for Testing, ambient running):

| Scenario | Result |
| --- | --- |
| Creative to Professional and back with a station selected | both settle (2.08 s and 2.14 s), selection (`aura`) restored, 3D resumes at 34 draws/s, no page errors |
| Professional to Creative / Creative to Professional | both directions settle; covered again by the suite's `transition.spec.ts` and `transition-d.spec.ts` (all pass on Chrome for Testing) |
| Rapid switching | the suite's "ten quick switches end in the last mode" passes. My own probe (ten mouse clicks 130 ms apart) ended in Professional, not Creative, but the **Phase D baseline build behaves identically** (clicks that land during an active transition are ignored), so it is not an ambient effect; the page stays usable and no errors |
| Reduced motion | switches both ways, settles, 0 draws, no pause button, no errors |
| Hidden tab mid-transition | transition settles after the tab is back, then back to Creative works and 3D resumes at 34 draws/s, no errors |

*Frame pacing against the Phase D baseline.* To make the comparison fair I built `441c2cc` itself (git archive into a
scratch folder; the working tree was not touched) and served it next to the current build. Chrome for Testing 156, 1440 x 900,
10 transitions per run (5 each way), interleaved: ambient on, ambient paused (`studio-motion-paused=1`), Phase D baseline.
Warm: 1 run each. 4x CPU throttle: 3 runs each (15 transitions per direction per condition).

| Warm (60 Hz) | click to rest, median | p95 frame | worst frame | frames over 25 ms |
| --- | --- | --- | --- | --- |
| to Professional, ambient on / paused / baseline | 2031 / 2031 / 2048 ms | 16.8 / 16.8 / 16.8 ms | 50 / 50 / 66.6 ms | 1 / 1 / 1 |
| to Creative, ambient on / paused / baseline | 2117 / 2133 / 2132 ms | 16.7 / 16.8 / 16.8 ms | 50 / 50 / 50 ms | 1 / 1 / 1 |

| 4x throttle | click to rest, median | p95 frame | worst frame, median (max) | frames over 25 ms, median |
| --- | --- | --- | --- | --- |
| to Professional, on / paused / baseline | 2149 / 2138 / 2140 ms | 16.8 / 16.8 / 16.8 ms | 150 (167) / 133 (167) / 133 (167) ms | 4 / 4 / 4 |
| to Creative, on / paused / baseline | 2263 / 2266 / 2258 ms | 16.8 / 16.8 / 16.8 ms | 150 (233) / 150 (200) / 150 (217) ms | 3 / 2 / 3 |

Frame pacing with ambient motion present is the same as the Phase D baseline in every column, warm and throttled.
(Single throttled 'to Professional' p95 outliers of 33 ms occurred once in the ambient-on set; they are not repeated.)

**The 126 to 127 ms throttled capture frame, investigated.** I measured the long animation frame that contains the
view-transition callback (the capture frame) going to Professional, 15 samples per condition at 4x throttle:

- ambient on: 111 113 114 114 115 125 125 125 126 128 128 128 132 137 138 (median 125, mean 123.9)
- ambient paused: 112 113 113 113 113 114 114 116 117 127 128 129 131 131 152 (median 116, mean 121.5)
- Phase D baseline: 112 114 114 114 114 115 115 115 115 126 134 134 134 140 142 (median 115, mean 122.5)

The frame is bimodal in every build, including `441c2cc`: about 113 ms, or about 126 to 134 ms. The 126 to 127 ms
reading is the upper mode of the baseline, not a regression. The probability that a random ambient-on sample exceeds a
random baseline sample is 0.52 (0.58 against paused); that is no measurable difference. The median is about 10 ms
higher with ambient on only because five of 15 samples happened to land in the lower mode against nine for the baseline,
which does not survive the distributions overlapping. (Earlier "59 to 117 ms" figures were from a different, warm,
un-throttled build state and are not comparable with 4x numbers.) Conclusion: **supported by data, not dismissed as noise.**

Bugs the validation found, now fixed: Pause did not stop the CSS motion (a nesting and specificity mistake, caught
by the pause test); the pause button was unreachable on a phone; the phone 2D map used 15 % main thread for 21
floating glyphs (now 3.4 %); the low tier drew 27 times a second.

## Mode-switch discoverability (recommendation only; nothing implemented)

Verified: first visits start in Professional (no stored mode); below 1100 px the switch is two icons with their labels
visually hidden (`modes.css`, `max-width: 1100px`); on a phone the header holds only that pair and the menu button.
Forcing the labels back showed they **fit down to about 1000 px** (the "Let's talk" button wraps to two lines at 1000),
and **do not fit at 900 px or below** (the "Creative" label is cut off at 820; a 245 px switch cannot share a 390 px header).
Minimal recommendation, no navigation redesign:
1. Move the icon-only breakpoint from 1100 to about 1000 px and keep "Let's talk" on one line, so a narrow laptop
   window shows "Professional | Creative".
2. For phones and narrower windows, add a **one-time hint** under the switch ("Try Creative mode"), stored in
   `localStorage`, dismissed by the first switch, a tap elsewhere or after about 8 s, with no animation. Showing the
   inactive option's word beside its icon is the alternative, but it needs about 130 px and would crowd a 390 px header.

## Remaining limitations

- Default rate 30 was chosen from measurements and step sizes and then **selected by the owner** ("Keep 30"); the owner's
  visual review checklist (smoothness, alive-not-distracting, natural movement, not a screensaver, mobile and desktop
  hierarchy) is **still open**. Flip `DEFAULT_RATE` in `ambient.ts` or use `?ambient=60` to compare.
- Ambient 3D still costs about 15 % of one main-thread core on an M5 at 30 draws a second while the map is on
  screen. Lowering it further means fewer draw calls (merging meshes), not a slower clock.
- Float amplitude is in world units, so on a phone's smaller stage it is under a pixel or two; the lights and CSS
  layers carry the "alive" impression there.
- Untested: a real phone, Safari.app, Edge, 90/120/144 Hz displays, long (minutes) soak, battery impact, and the
  installed Google Chrome app for tests longer than about 30 s on this Mac (it is quit externally; see above).
- No GPU utilisation counter; no real phone, no Safari.app, no Edge; Playwright's WebKit stands in for Safari and
  Firefox ran about 43 to 48 frames a second in this environment. No 90, 120 or 144 Hz measurements.
- The 2D fallback is intentionally lighter (and the software-renderer case lands there).
- Pause motion lives in the toolbar, so it is hidden while an exhibit is open (the map is paused then anyway).

## Recordings and stills

Stills in `docs/ambient-motion/`: before and after (desktop 3D), a 32 s change heat map, final frames of the phone 3D,
phone 2D and desktop 2D maps, and the header at 1000, 820 and 390 px. Real-speed recordings (not in the repository),
all in `/private/tmp/claude-501/-Users-sid-Claude/24877687-ec0b-42ec-8824-25550e33f46e/scratchpad/amb/`:
`ambient-v-desk3d.mp4`, `ambient-v-desk3d-60.mp4` (20 s), `ambient-v-phone3d.mp4`, `ambient-v-desk2d.mp4`,
`ambient-v-phone2d.mp4`. The **comparable 30 versus 60 pair** (same build, scene, camera and district, 30 s, no input, 1440 x 900,
60 fps container) is in `.../scratchpad/amb/cmp/`: `real-speed-default-30.mp4`, `real-speed-ambient-60.mp4` and
`side-by-side-LEFT30-RIGHT60.mp4`. Note the CSS layers (clouds, ripples) run at the display rate in both clips, so
only the 3D layer differs between left and right.
