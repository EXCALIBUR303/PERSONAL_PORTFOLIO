# Phase D: implementation status

Branch `phase-d-precision-scanner` from `05623ef`. **Nothing is committed, pushed or deployed.** The approved
design is `docs/V6-PHASE-D-TRANSITION-DESIGN.md`; the behaviour is described in `docs/TRANSITION.md`. This file
says what was built, what was measured, what was not done and what is compromised.

Phase D is **not marked complete**. The choreography, skeletons, tiers and failure handling are built and tested,
and the 60 Hz pacing is measured. A real-time review round followed (below); it was done from every-frame recordings
of the production build in headless Chrome, not by a person watching a display, and the owner's own review has not
happened. High-refresh-rate behaviour and every browser or device other than the ones named below are unverified.

## Real-time review round

Method: the production static build, Chrome for Testing at 1440 x 900 and 390 x 844 (phone emulation), recorded with
the CDP screencast (every composited frame with its timestamp, about 50 per second), turned into contact sheets at
100 ms steps and real-speed videos, several runs per case: both directions, with and without a selected station, and
reduced motion. This shows real movement and timing; it is still a recording, and a browser frame the screencast
skipped is not in it.

What I saw, and what was done:

| Observation | Cause | Change |
| --- | --- | --- |
| Going to Creative, the middle of the run (0.9 to 1.4 s) was a wall of large grey and blue plates, up to about 150 px | The tall scene panel was cut too, and the tile size grew until the budget fitted | Tiles keep one size (44 px, 34 px on phones); a region that would go over the budget is left whole instead of cut coarser (the scene panel, usually). Budget share raised from 0.62 to 0.85 of the fragment count, so the headline, lede, actions and facts are all cut on a desktop at the high tier. |
| Professional text (the headline's cobalt letters) visible inside the opening over Creative | A tile stayed in the snapshot until the plane had crossed its centre plus a lag of up to 0.05 of the run | The part of a tile the plane has crossed is clipped out at once (`cutClip` takes the slit); the lag before the fragment lifts is shorter (0.004 to 0.02) |
| Coming back, the row ticks were hard to see (about 22 x 1.6 px), and those that did land lay across the Creative headline for up to half a second, reading as strike-throughs | They arrived early in the align beat and were very thin | A tick lands about 90 ms before the bracket that reveals its text, as a rule about 30 x 3 px; side by side they draw the line |
| With a station selected, the reticle and ring locked on the middle of the map | The footprint used the map's opening camera pose; selecting a station moves the camera | The anchor is the selected station's marker where it is drawn now |
| Coming back, a large ring and reticle stayed over the finished page and vanished in one step at about 2.05 s | The settle fades were scheduled past the end of the timeline (a 120 ms fade starting at 0.96 of it), so they were cut off at about 70 % opacity | The settle's fades finish by 0.99: label at 0.3, aperture at 0.4, crop marks at 0.55 of the settle |
| Phone, a station selected: the page seemed to jump up 437 px when the switch was tapped | Not the site. Playwright's locator tap and click scroll their target into view first, and for a button in the sticky header that scrolls the page; the scroll came before any input event. A tap sent at the button's place on screen (as a finger would) does not move the page, here or on the live site | No site change. The recordings now tap and click by coordinates (the phone capture `23` was re-recorded), and a test checks that a tap far down the page leaves the scroll where it was |

Not changed after looking: the first 300 ms going out shows only the small reticle at the switch (the cue and the
capture) before the aperture draws; whether that reads as latency is for the owner to judge in a real browser. The
tile cloud right after release is still dense for about 200 ms, but now within the headline and lede. Reduced motion
is an instant switch, then the map's static skeleton steps; nothing moves.

Captures `20` to `23` in `docs/phase-d-concepts/` were replaced with frames from these recordings. After a switch
the page keeps the visitor's scroll position (existing behaviour), so a switch made far down the Creative page lands
part-way down the Professional one.

## What was already there (first tranche, kept unchanged in intent)

| Item | Where |
| --- | --- |
| Studio-map skeleton drawn from the world's own layout (`worldOutline`, `establishingPose`), one shimmer, wipe, status line, `aria-busy`, 150 ms threshold, no minimum time | `src/components/skeleton/studio-skeleton.tsx`, `use-skeleton-gate.ts`, `skeleton.css`, `creative/world/outline.ts` |
| Fragments landing on the real map (seeds on station feet, dashes on island outlines) | `particle-layout.ts` |
| Five depth frames (three on phones) | `scanner-canvas.tsx` |
| One loop: the scanner canvas is drawn from the master timeline | `scanner-canvas.tsx` |
| Watchdog (3.2 s) and hidden-tab finish | `lib/world-shift.ts` |

## Newly completed in this tranche

| Brief item | What was done | Where |
| --- | --- | --- |
| Per-direction timings | `TIMINGS` holds the length, the three shared phases and the named beats of each direction. Nothing else holds a duration. To Creative 1.9 s; to Professional 1.8 s. `within`, `beat`, `phaseOf`, `passProgress`, the morph timings, the arrival delays and the SVG frame all read it. | `lib/transition/state.ts`, `scanner.ts`, `shift-intro.ts`, `scanner-frame.tsx` |
| Professional to Creative: selected regions separate into fragments | Up to five Professional blocks (headline, scene panel, lede, facts, actions) get their own view-transition name. Each is cut into tiles whose clip is rewritten as a plane crosses them; a paper tile of the same size lifts off as a 3D plate. | `lib/transition/regions.ts`, `world-shift.css`, `scanner-canvas.tsx` |
| Fragment trajectories | A tile lifts, dives into the mouth of the tunnel (small and deep), and comes out along the line to its landing on the map. Markers from the page grid keep the short arc. | `scanner-canvas.tsx` |
| Tunnel / camera through the portal | The Creative page arrives from depth (scale 0.84 to 1, 0.9 on phones) inside the aperture while the depth frames pass. | `lib/transition/scanner.ts` (`paintScanner`) |
| Region marks | Corner marks on each region the planes will cut, drawn at the start and released as the tiles lift. | `scanner-frame.tsx` |
| Creative to Professional as its own choreography | Anchor (reticle on the selected station, else the map's middle, else the screen's), collect (fragments rise from island outlines and stations, nearest first, onto a dashed ring), align (each goes in through the anchor and out to a row), close (scanners come in as brackets with end caps), lock (aperture, crop marks). The Creative page recedes toward the anchor. No tunnel, no depth frames, no snapshot cutting. | `particle-layout.ts`, `scanner-canvas.tsx`, `scanner-frame.tsx`, `scanner.ts`, `lib/transition/layout.ts` |
| Rows on the real text | `readRows()` finds each line of the Professional text with a Range, so fragments lie on the real baselines. A tick is on its row before the bracket that reveals that text has passed, then drops 2 px and gives way. | `lib/transition/layout.ts`, `particle-layout.ts` |
| Skeletons for the rest of the page | `SceneSkeleton` (toolbar, viewport with a silhouette, controls) for the Professional hero viewport and every exhibit scene (and a viewport-only variant for the inner canvases); `SceneWait` for "Checking for 3D support"; `MediaSkeleton` over the video frame while its poster or first frame loads. They share `SkeletonCover` (the gate, wipe, shimmer, status). | `components/skeleton/primitives.tsx`, `scenes/lazy-view.tsx`, `scenes/*-scene.tsx`, `demo-video.tsx` |
| Quality tiers | High / medium / low from CPU cores, memory, canvas pixel load, save-data and battery, corrected by the last runs on this device (kept for the visit). | `lib/transition/quality.ts` |
| Delta handling | The timeline is time-based; renderers are functions of `progress`. A gap of more than 400 ms between updates ends the run at once. The refresh interval is read from the run's own frame gaps. | `scanner.ts`, `quality.ts` |
| More failure guards | Resize now ends a run; a stall ends it; all guard listeners are removed in every exit. | `lib/world-shift.ts` |
| Capture-frame instrumentation | `performance` marks `ws:cue-end`, `ws:regions-named`, `ws:update`, `ws:rendered`, `ws:named`, `ws:measured`. | `lib/world-shift.ts` |

Design departures: the tile cut is a clip-path of the remaining tiles, not shards cut from the plane's edge; the
region cut is clipped by tile centre, not by the plane's own edge; the Professional skeleton for text is the
rows of fragments themselves (design 4.1), not grey boxes over text that is always ready.

## What remains incomplete

- **Capture-frame reduction: partly.** Profiled with Chrome traces that record the JS stack of every forced style and layout pass (details under Performance). What was avoidable is gone; at 60 Hz six of eight warm runs now have no long animation frame over 50 ms, but the worst frame of a run is still 50 to 83 ms (three to five display intervals), and under 4x throttle 133 to 200 ms. What is left is the inherent work: React rendering the other mode, removing the old page's DOM (about 7 ms going to Creative), one full style and layout pass of the new page (about 15 ms), and a style and layout pass of the old page forced by Motion's shared-layout measurement on unmount (going to Creative, about 5 to 7 ms). The design target (60 ms) is met in most warm runs, not all.
- **Persistent world across switches (S8).** Not built; still an owner decision.
- **Video skeleton has no live case.** Every video is "planned"; the skeleton was exercised only once, by temporarily giving one project a fake video in the dev server (shown, status line "Loading the poster" after a second, wiped when the poster arrived), and the data file was then restored. No automated test covers it. The skeleton's own control row is largely hidden behind the real control bar.
- **Layout shift of scene skeletons.** The skeleton has the footprint of the toolbar, viewport and controls, but the finished scenes differ in height (steps, captions), so some shift can remain. Not measured as a number.
- **Station connections** (bridges) are not fragmented separately going back; islands and stations are.
- **Reduced motion** keeps the earlier behaviour (no scanner, instant switch); the restrained reveal is the 120 ms skeleton fade.
- **A tile can only land as a box** (a dash on an island), because it is a box in flight; the lime seeds come from grid markers.

## Architecture and component changes

- `lib/transition/state.ts`: `TIMINGS`, `timing()`, `secondsFor()`, `beat()`; `Region`, `Tile`, `Row`; `transition.regions`, `.anchor`, `.tier`; `collectRadius()`.
- `lib/transition/regions.ts` (new): planning, naming, clearing and clipping regions.
- `lib/transition/quality.ts` (new): tiers, telemetry, `RunProbe`, `countFor`.
- `lib/transition/layout.ts`: `readRows()`, `findAnchor()`.
- `lib/transition/scanner.ts`: depth dolly, anchor drift, region cut variables, stall detection, per-direction length.
- `lib/world-shift.ts`: tier, regions, anchor, probe, resize and stall guards, marks.
- `scanner-canvas.tsx`, `particle-layout.ts`, `scanner-frame.tsx`: tiles, tunnel path, return choreography, tier effects (fragment share, outlines, depth frames, pixel ratio).
- `components/skeleton/primitives.tsx` (new), `skeleton.css` (flattened from creative-only, shared), `scenes/lazy-view.tsx` (wraps in `SkeletonSwap`; a `null` label keeps the world's own skeleton), nine scene files (labels instead of `.s3-loading` tiles), `demo-video.tsx`.
- No dependency or lockfile change.

Behaviour changes to know about: every scene now sits in a `div.sk-swap` wrapper; a resize during a run ends it; `skeleton.css` is global rather than creative-only.

## Test results

| Check | Result |
| --- | --- |
| `tsc --noEmit` | clean |
| ESLint | clean |
| Full suite, Chromium (Chrome for Testing 1248), final static build | **207 of 207 passed** (206 of 206 in the full run of the three browsers; the phone tap test was added afterwards and the full Chromium suite re-run) |
| Full suite, Firefox (Playwright build), 206 tests | **204 of 206**: the two clipboard tests fail at `grantPermissions` (Firefox has no `clipboard-read` permission in Playwright); a harness limit, not the site |
| Full suite, WebKit (Playwright build), 206 tests | **193 of 206**. All transition and skeleton tests pass. Failing: the same two clipboard tests (no `clipboard-write`); "a quick view opens in place..." (also fails against the live site, so it predates Phase D); and ten "direct route and refresh" tests, where WebKit blocks the RSC prefetch from the local Python file server "due to access control checks" (they pass against the live site on Vercel, so it is this local server) |

The full WebKit suite had not been run before this round (earlier WebKit runs covered the three transition and
skeleton files).

**The WebKit skeleton race.** Two causes, both in the test, none in the app. (1) The test installed its delay on
scripts only after the load event had been reported to it, while the world's code is requested 18 to 60 ms after
that event; when the request won, the code was not held and the skeleton's life was down to chance. The delay is now
installed before navigation and goes by the order in which the browser reports the load event and each request.
(2) Phase D added skeletons elsewhere on the Creative page, so `.sk-layer` could match a scene skeleton instead of the
map's; the test now looks inside `.w-stage`. It also holds scripts only (holding the lazily loaded stylesheet left the
skeleton unstyled). 15 of 15 repeats pass in WebKit; it passes in the full runs of all three browsers.

**A real defect found in WebKit.** "Ten quick switches" failed intermittently. While a view transition runs, the
browser's overlay takes every pointer event, so a click on the switch mid-run reaches no button (Chromium and WebKit
both; the test passed only when its last click came after the run had ended, which WebKit's slower runs made rarer).
Separately, the switch compared a request with the mode on the page, which changes only once the old page is
captured, so asking to stay, or Alt+M pressed again early, was taken as "already there" and ignored. Now a request is
compared with where a running shift is heading (`shiftHeading`); asking to stay during the cue drops the run
(`stayInMode`); Alt+M toggles from the heading. The tests use the keyboard toggle, which works throughout a run.
Pointer clicks during a run are still absorbed (browser behaviour; letting them through would click the hidden new
page).

Added in the review round: no part of a remaining tile inside the opening; regions keep small tiles and the scene panel
is not cut; the scanner's variables never on `<html>` (and none left after a run); the ring locks on a selected
station's drawn marker; turning back before the switch has applied (in the cue and mid-run); a phone tap on the switch
far down the page does not move it.

New tests cover: per-direction timing maths, tile coverage and clip, tiers, frame-gap summary at 60 and 120 Hz,
each direction's own beats, ten quick switches, the overlay never taking input, hidden tab and return, a stalled
page, a resize, a failing view transition (mode applied, focus kept), listener cleanup, phones, each tier, skeleton
for slow code (hidden from assistive technology, inert, one status line, footprint, wipe, not busy afterwards),
a loaded scene showing none, reduced motion, and tokens.

## Performance (production static build, headless Chrome for Testing, Apple M5, 60 Hz, 1440 x 900)

Budgets: 16.67 ms at 60 Hz, 8.33 ms at 120 Hz. "Missed" means a gap over 18 ms. "Before" is the build at the start of
this review round (same machine, same script); the capture callback is `ws:update` to `ws:measured`, and LoAF is
the browser's long-animation-frame entry for the capture frame (it reports only frames over 50 ms).

| Warm, 8 runs (4 each way) | Before this round | **After** |
| --- | --- | --- |
| Click to rest, to Creative / to Professional | 2.12 to 2.15 s / 2.05 s | 2.11 to 2.18 s / 2.03 to 2.05 s |
| Median / p95 frame during a run | 16.7 / 16.7 to 16.8 ms | 16.7 / 16.7 to 16.8 ms |
| p99 | 16.8 to 33.4 ms | 16.8 to 33.4 ms |
| Worst frame (the capture) | 50 to 67 ms | 50 to 83 ms (one run at 83) |
| Missed frames per run | 1 to 3 | 1 to 2 |
| Capture callback, to Creative / to Professional | 32 to 48 / 29 to 43 ms | 30 to 45 / 27 ms |
| Capture frame as a LoAF (over 50 ms) | 7 of 8 runs, 54 to 72 ms | 2 of 8 runs, 51 and 80 ms |
| World ready after rest | 268 to 324 ms | 246 to 299 ms |

| 4x CPU throttle, 6 runs (3 each way) | Before this round | **After** |
| --- | --- | --- |
| p95 | 33.4 to 49.9 ms | 16.7 to 16.8 ms |
| p99 | 150 to 267 ms | 50 to 83 ms |
| Worst frame (the capture) | 150 to 267 ms | 133 to 200 ms |
| Missed frames per run | 19 to 31 | 3 to 5 |
| Capture callback, to Creative / to Professional | 109 to 203 / 89 to 116 ms | 141 to 143 / 77 to 79 ms |
| Click to rest, to Creative / to Professional | 2.27 to 2.43 / 2.16 to 2.21 s | 2.33 / 2.14 s |

Phone width (390 x 844), cold first switch, after: rest 2.14 s and 2.05 s, worst 66.6 ms, 2 missed frames each.

Where the gains came from, found in Chrome traces (`Tracing` with JS samples and the stack of each forced style and
layout pass):

- **Every frame of a run restyled the whole page.** The `--sc-*` variables were written on `<html>`, so each frame
  recalculated the style of all 1,627 elements (5.5 to 5.8 ms per frame here). They now live on two rules of their own
  (`html::view-transition` and `.sc-layer`); the per-frame recalculation fell to about 32 elements and 0.9 ms. This is
  most of the throttled improvement.
- **Inside the capture frame**, avoidable passes were removed: removing the focused switch forced a full style and
  layout of the old page (the switch now lets go of focus first, inside the update, after the old page is captured);
  Anime.js's `createDrawable`, the arrivals' box reads and starting state, the canvas sketches and the contact log's
  scroll each forced another pass of the new page (they now wait until the snapshot exists, or skip a pointless read);
  the studio map's WebGL check (3 ms) runs at idle time on the Professional page.
- What is still in the capture frame is listed under "What remains incomplete".

Reading it: warm, the median and p95 sit on the display's interval and a run has one or two frames over budget, at
the capture. Under 4x throttle the run itself now holds the interval (3 to 5 missed frames, against 19 to 31), but
the capture frame is still 133 to 200 ms. A lower p99 is not a claim that all frames meet a budget.

**Not measured:** 90, 120 and 144 Hz (no such display here). At 8.33 ms the capture frame would miss by a wide margin
in every run, and the 0.9 ms of style per frame plus the canvas work have not been checked against that budget.
Nothing is claimed for those rates. Also not measured: Safari and Firefox pacing (their test runs are correctness only),
real phones, weaker GPUs, a real battery-saver state.

## Captures (real browser frames, in `docs/phase-d-concepts/`)

- `20-to-creative-desktop.png`: 0.3 to 2.2 s after the click, 1440 x 900, from a real-speed recording of the final build.
- `21-to-pro-desktop.png`: 0.3 to 2.1 s, with the LifeOS station selected (the ring is on the station).
- `22-to-creative-phone.png`, `23-to-pro-phone.png`: 390 x 844; the second with a station selected.
- `24-scene-skeleton.png`: the scene skeleton while its code is delayed (shimmer, status line, still waiting).
- Earlier: `10-built-to-creative.png`, `11-built-to-pro.png`, `00-*`, and the design boards.

Real-speed videos of these runs were made for the review and are not in the repository.

## Known visual and technical compromises

- Tiles read as grey-white plates (lit paper) and carry no picture of the text they came from; right after release they are a dense block for about 200 ms.
- The scene panel is no longer cut on desktop (it is revealed by the planes), so the fragments come from the text only.
- Professional and Creative headlines sit in the same place and say the same words, so near a plane both are seen side by side for a moment (one outside the opening, one inside); nothing of Professional is drawn inside it any more.
- The capture frame hitch is still visible as one 50 to 83 ms frame at the start of some runs.
- The tile cut adds snapshot images at the capture (the headline and three text blocks); weaker GPUs were not tested.
- Coming back from a selected station, the fragments start from the islands as the map's opening pose places them, not where the camera has moved them; the anchor and ring are right, the starting points are approximate.
- A pointer click on the switch during a run does nothing (the view transition takes it); Alt+M works.
- The wipe goes left to right.
- The tier thresholds (cores, pixel load) are my choices, not tuned on real devices.
