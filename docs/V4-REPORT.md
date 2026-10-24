# V4 "Hybrid Portal Ride": final report

Live: https://sidharth-portfolio-ten.vercel.app · Last deployed commit: `33b90ac` (2026-10-24)

This report says what was built, how it was checked, and what was not done or not verified.

## What shipped, by stage

| Stage | Commit | What changed |
| --- | --- | --- |
| 1–2 Audit and plan | none | An audit and a staged plan were approved before any edits. |
| 3 AURA companion and annotations | `1b0756d` | **Companion:** a procedural android built in code. It turns towards the selected part or the current request hop, and nods. **Callouts:** wide stages show callouts in edge columns with leader lines; narrow stages show numbered markers plus one named callout. Labels behind geometry become dashed or hidden. |
| 4 Mazera walls | `4d92666` | **Walls:** continuous rounded wall runs merged into one mesh. **Floor and path:** floor tiles under every cell and glowing path stones. The solver and its UI are unchanged. |
| 5 Predictive Maintenance / RUL | `b8141a5` | **Model:** a cut-away turbofan whose colour shifts with wear and a ring of 21 sensors. **Steps:** six steps walk through the repository's real preprocessing rules: engine-grouped split, sensor filter, scaling fitted on training engines, RUL cap of 125, and 30-cycle windows. **Results:** the published FD001/FD004 tables are copied from the repository's results CSV at commit `9bb3742`. |
| 6 Hybrid Portal Ride | `b8141a5` | **Ride:** switching modes is a 3D portal dive inside a View Transition, driven by one GSAP timeline. The return trip plays the same path backwards. **What moves:** the header and on-screen cards glide between layouts, and the visitor stays at the same section. **Fallbacks:** without WebGL, or if the visitor clicks before the 3D layer has loaded, the 2D ring reveal plays. Without View Transitions there is a cross-fade. With reduced motion the switch is instant. |
| 7 Professional refinement | `b8141a5` | **Featured:** 6 cards, each with a title, one line, a College/Personal tag, status and a single "Open project" action. **More work:** the other 14 are rows that open a quick view in place. **Filters:** a sliding segmented filter. **Motion:** shared microinteraction tokens (`micro` in `motion-config.ts`, `--mi-*` in `micro.css`). The nav item "Worlds" is now "Projects". |
| 8 Creative mode | `33b90ac` | **Refinement only:** the existing studio map, briefing and missions were kept. **Added:** shared press feedback, a slide-in briefing title, a pop on the explored check, and a smaller gap below the map. |
| 9 Polish | `33b90ac` | **Dead CSS:** about 1,200 lines of rules for the removed Professional gallery were deleted. **Search box:** its styling was fixed. **Docs:** the README was refreshed, and VERIFICATION.md is marked as out of date. |

## How it was checked (Stage 10)

**Production test suite**
- **Result:** the 97-test Playwright suite ran against the live URL. 93 passed in the full run.
- **Failures:** the 4 failures were the Creative keyboard stations test, the 768 px overflow test and two Last Mile tests. All 4 passed when rerun alone.
- **Local runs:** two architecture-walkthrough tests behave the same way, failing only in full runs.

**Live route sweep**
- **Coverage:** the home page and all 20 project pages, in both modes (42 loads), at 1366 px and again at 390 px.
- **What was checked:** page errors, console errors, HTTP errors of 400 or above, and sideways overflow.
- **Result:** no problems at either width.

**Portal ride on production**
- **Forward:** in headless Chromium the 3D layer loaded on hover, the ride ran its 3D path, and the page settled in Creative with no leftover state.
- **Return:** the switch back landed in Professional with all 6 cards.

**Accessibility**
- **Automated:** the suite's axe checks (WCAG 2 / 2.1 A and AA) pass, including every Creative mission tab.
- **Lighthouse:** accessibility scored 100.

**Performance (Lighthouse 12, mobile, live home page, three runs)**
- **Scores:** performance 60, 85 and 93. Best practices 100 and SEO 100 on the first run.
- **First run:** blocking time 1,660 ms and LCP 4.1 s. I treat it as an outlier, because the repeats measured about 265 ms of blocking time and an LCP of 2.3–3.6 s.
- **What remains:** the blocking that is left comes from React hydration and evaluating the 908 KB three.js bundle for the hero scene. Both predate this round.
- **Portal preload:** making touch devices skip the portal's idle preload did not change the measurement. The portal chunk does not load inside Lighthouse's window, so I reverted that change.

## Honest notes

- **No invented facts:** nothing about education, employers, awards, metrics or LinkedIn was added. Mazera is labelled a College project everywhere.
- **Simulated RUL data:** the RUL scene uses a made-up fleet of 12 engines to show the pipeline. Nothing is trained or predicted in the browser; only the results table is real, and it links to its source.
- **AURA companion:** the companion is procedural. The AURA repository's real companion model ("Astra Lumen II", CC BY 4.0) is gitignored there, so it was not available to use.
- **Robot dog:** the voice-controlled robot dog scene matches keywords as a stand-in for a language model, and says so.
- **Paid tools:** no paid tools or Canva credits were used.

## Not done or not verified

- **Browsers and devices:** Safari, Firefox and real phones are untested. View Transitions are Chromium-only, so other browsers get the cross-fade.
- **Smoothness:** the portal ride was checked frame by frame and in headless runs with software rendering. Its smoothness on real GPUs and phones has not been measured.
- **Early clicks:** a click within roughly the first 5 seconds without hovering the switch first gets the 2D ring, not the 3D portal.
- **Hardware lab AURA zone:** it is often hidden behind the companion.
- **AURA stage size:** the stage is small at 1280 px.
- **Creative board:** it still lists all 20 projects that the map also shows.
- **Old reports:** VERIFICATION.md and the `docs/lighthouse-*.json` files describe the older V3 baseline and were not regenerated.
- **Assistive technology:** no manual screen-reader pass was done; only the automated checks above.
- **Flaky tests:** several tests fail only in full runs and pass alone. They were not made deterministic.
