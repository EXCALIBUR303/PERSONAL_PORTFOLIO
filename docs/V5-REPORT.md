# V5 final report: project 3D worlds, scanner transition, two modes

Live: https://sidharth-portfolio-ten.vercel.app · Deployed commit: `28ea11a` (2026-10-24)

This covers the second brief (project-specific 3D worlds, background layers, the About sections and the Precision Scanner). The earlier round is in `docs/V4-REPORT.md`.

## What changed, by stage

| Stage | What shipped |
| --- | --- |
| 1 Foundation | **Backgrounds:** layered tokens in `backdrop.css`. Professional has a warm surface, soft tonal fields, a fine grid and a major blueprint grid. Creative has paper, soft colour fields and dots. **Camera:** the shared 3D stage can follow a moving point, with a Follow button for scenes that opt in. |
| 2 SmartPark and PathAble | **SmartPark:** a two-level garage where two cars ask for bay A07. The method decides whether the bay conflicts or is row-locked and the second car is offered A08. The words come from the project page's step list. **PathAble:** a 3D campus that uses the same routing code as the flat map. Walking, Wheelchair and Avoid steep slopes remove paths before the search, and a walker follows the route. |
| 3 Private AI, Last Mile, SWARMMIND | **Private Local AI:** a vault chamber of sample passages, scored, ranked, fenced and cited, with a score table beside it. **Last Mile:** a delivery district with the same stages, a spanning tree, route orderings and a van. **SWARMMIND:** four numbered searchers with trails on a seeded map, comparing random walk with frontier search. All nine hero scenes are now 3D, and each keeps its flat fallback. |
| 4 About | **Professional:** "How I turn questions into systems", with four principles, three evidence rows from existing source-backed milestones, education, and proof-of-work links. **Creative:** "The person behind the experiments", a notebook with a pull-a-question card, builds in progress and lessons. No invented facts. |
| 5 Controller | A shared transition state with one progress value and a phase table, plus a lifecycle with cleanup. |
| 6 Precision Scanner | The default mode transition, in two different choreographies (see `docs/TRANSITION.md`). A cue, an aperture, scanners that open or close, 168 outlined 3D shapes that leave or join the page grid, a background band that turns lines into dots and back, the header and cards moving as a scanner passes them, and keyboard focus and a mode announcement kept. |

## How it was checked in Stage 7

**Full test suite against production (112 tests)**
- **Result:** 107 passed in the full run.
- **Failures:** the other 5 were different tests from run to run, and all 5 passed when rerun alone. Across the three full runs I did, these were Chromium crashes or timeouts under load.

**Live sweep (production, 153 checks)**
- **Coverage:** the home page and all 20 project pages in both modes at 1366, 768 and 390 px, plus all nine hero scenes in Professional.
- **Result:** every scene had a drawn 3D canvas and no loading state left, with no sideways scrolling, no page errors and no HTTP errors.

**Creative scenes**
- **Result:** all nine scenes load through Creative's Quick peek at 1366 and 390 px, with no errors and no overflow.

**Transitions**
- **Tests:** 8 transition tests cover both directions, their cleanup, filters, search and scroll surviving, rapid switching, keyboard focus and the announcement, reduced motion, intent-based loading, the WebGL-free run and the portal opt-in. All pass.
- **Frames:** I looked at frozen frames of both directions on desktop and at phone width, plus a run from inside the project gallery.
- **Real GPU timing (previous session):** six warm runs on an Apple GPU took 1.63 to 1.67 s from click to rest, at about 60 fps with one 50 to 67 ms frame per run.
- **Earlier bugs fixed:** an old one-second freeze into Professional (a new 3D canvas compiling during the run) and the scanner clock drifting from the browser's own animations are both fixed.

**Accessibility**
- **Automated:** the suite's axe checks (WCAG 2 / 2.1 A and AA) pass on the home page and representative project pages in both modes.
- **Contrast:** it also passes with the new background layers.

**Performance (Lighthouse mobile, live home page, three runs)**
- **Scores:** performance 76, 87 and 85.
- **Run 1:** blocking time 790 ms and LCP 2.9 s.
- **Runs 2 and 3:** blocking time 210 to 260 ms and LCP 3.3 to 3.8 s.
- **Layout shift:** CLS 0.
- **Compared with the last round:** this is a little slower on the LCP: 2.3 to 3.6 s then, 2.9 to 3.8 s now. I did not find a cause; the 3D layers load after the page settles, outside Lighthouse's window.

**Build:** lint, the type check and the static build are clean.

## Honest notes

- **Illustrative scenes:** the garage, campus, delivery district, vault and search area are drawn for this portfolio, and each scene says so. Sample data and sequences are labelled as sample data and sequences.
- **PathAble heights:** the campus heights are illustrative. The routing data cannot define a consistent terrain, so stairs and the steep path are drawn as local fixtures on flat ground.
- **SWARMMIND, Last Mile, RUL numbers:** these are toy-run or simplified-algorithm numbers, not the projects' own results, and the scenes say that.
- **LinkedIn:** I added the LinkedIn URL you gave. I did not visit it.
- **No assets or dependencies:** everything 3D is procedural, and no new dependency was added.

## Not verified or still open

- **Cold first switch on a real GPU:** I did not re-measure the first switch after a fresh page load, before the visitor has pointed at the switch. The in-app pane was not rendering frames this time.
- **Browsers and devices:** Safari, Firefox and real phones are untested. Where the View Transitions API is missing, the modes cross-fade.
- **Smoothness:** measured on one Apple GPU only. Phones and older laptops are untested.
- **Particle count at phone width:** 84 particles at 390 px were checked by eye in headless runs, not measured on a phone.
- **Hardware lab AURA zone:** it is often hidden behind the companion, and the AURA stage is small at 1280 px. Both are still open.
- **Creative board:** it still lists all 20 projects that the map also shows.
- **Older reports:** `VERIFICATION.md` and the `docs/lighthouse-*.json` files still describe the V3 baseline.
- **No manual screen-reader pass:** only the automated checks above.
- **Flaky full-run tests:** several tests fail only in full runs and pass alone.
