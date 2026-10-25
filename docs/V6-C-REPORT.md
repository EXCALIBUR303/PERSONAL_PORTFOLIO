# V6 stage C: the Spatial Studio Map and exhibits

Branch `stage-c-spatial-map`, from the reviewed Stage A/B tip `ed4aeb1` (`stage-ab` is unchanged). Nothing here touches the Precision Scanner, any transition file, `package.json` or the lockfile. Everything is local; nothing was pushed or deployed.

## What changed

### C1: the map
Creative home is an illustrated isometric campus: three districts on ground plates (Systems 8, Algorithms 5, Intelligence 7, the explicit registry split), a landmark for each project, streets inside each district and roads between the districts and the Studio. It is plain inline SVG with real `<button>`s laid over it; no canvas, no WebGL and no new dependency.

- **Layers, back to front:** paper with a dotted survey grid and three soft colour fields, district plates (each with its own surface: workshop panel seams and cables, atlas contours and grid references, lab dot lattice and circuit traces), streets, landmarks with contact shadows, labels, the preview card.
- **Landmarks** are drawn from what each project is (a garage with bays and a barrier for SmartPark, a studio of zones around a companion for AURA, a vault drum for Private Local AI, a maze for Mazera, steps and a ramp to one door for PathAble, a turbine on a bench for Predictive Maintenance, and so on). A small isometric kit (`studio/iso.tsx`) gives every object the same lighting: light from the upper left, a mid left face, a dark right face.
- **Tier by shape, not colour alone:** *exhibit* stations stand on a solid pad with a lime centre, *briefing* stations stand on bare ground, *blueprint* stations (SIGSMITH, Student Burnout AI, Burnout Backend) are drawn as dashed cobalt outlines on paper. The legend says so in words.
- **Ways in that are not the map:** district chips (focus one district, dim the rest, zoom on wide screens), a station finder that shares the board's search, a Map / List switch (List shows all 20 with the claim class, an Enter-exhibit button where one exists and a project-page link), the board below, and ordinary header navigation. Selection, district and view are kept for the tab and restored after a trip to a project page and back.
- **Interaction cues:** hover lifts the landmark 4 px, lights its street and its label; the selected station gets a ring, a dark label and a lit street; keyboard focus gets a cobalt ring and the same street; a check marks stations opened in this tab; pressed states squash briefly; the preview eases in. Under `prefers-reduced-motion` the zoom, lift, squash and entrance are removed.
- **Keyboard:** one tab stop per district; arrow keys move to the nearest neighbour in that direction; Home and End jump; Enter or Space selects; Escape closes the preview and leaves focus on its station.
- **Layouts:** from 1000 px the whole campus is one stage with the preview opening beside the chosen landmark; from 640 to 999 px the districts stack at full width and the preview opens under its district; below 640 px each district is a swipeable row of station cards.

### C2: exhibits
An exhibit opens in place of the map, in a "viewing room": the project's existing scene (only that one is mounted; switching exhibits unmounts the previous one) on a tinted wall, a plaque that says what you are seeing and how far to trust it (with the claim class and caveat), an *Understand the engineering* panel, optional challenge and experiment panels, the evidence strip, and links to the full project page and public source.

- Address: `/?exhibit=<slug>` opens it; opening from the map adds one history entry, so Back closes it; switching exhibits replaces that entry; Escape and the Close button also leave. Leaving restores the scroll position and returns focus to the station that opened it.
- A trail of the eight exhibits lets a visitor hop between them without going back to the map.
- 2D fallbacks are the existing flat scenes; the exhibit works with WebGL unavailable (tested).

### C3: the six first-wave exhibits and their challenges
Every challenge is optional, unscored, and runs on logic or data the exhibit already uses. Each states, in order, what changed, the result, why, what the real project does and what the challenge is.

| Exhibit | Challenge | What really runs | Class shown |
|---|---|---|---|
| SmartPark: The Concurrency Garage | Two cars, one last bay: pick *look, then book* or *lock the row first*, predict Car 2's bay | A small two-session simulation of both rules, with the state after each step | simplified logic |
| Mazera: The Algorithm Observatory | Which search looks at fewer cells (four rounds on open fields and generated mazes) | `solveMaze` from the page's own re-implementation | re-implemented algorithm |
| PathAble: The Accessible Campus | Pick the route the rules choose for a profile; every candidate is marked rejected (and why) or allowed | `route()` and the campus graph the scene uses | simplified logic |
| AURA: The Living Developer Studio | Follow a request from a zone to the native service that answers | The scene's `requestRoute` and part descriptions | illustration |
| Private Local AI: The Evidence Vault | Pick the note cited first for three sample questions | The scene's BM25 + weighted rank fusion over made-up notes | sample data |
| Predictive Maintenance: The Diagnostic Workbench | Which model made the smallest error, by dataset and score; says when the gap is smaller than the spread across seeds | The committed result table (commit 9bb3742) | saved results |

Two experiments change real inputs: Mazera (all six algorithms on a grid the visitor shapes, with explored counts and path lengths) and Private Local AI (the keyword weight, showing whether the first citation moves).

### C4: the rest, and Creative About
All 20 projects are stations. Eight have exhibits (the six above, Robot Dog and SWARMMIND, which reuse their existing scenes). Last Mile and RupeeRise are briefings only, with a plain note that team projects stay briefings here; they link to their project pages and no team-owned code or assets are used. Briefing and blueprint stations show the existing concept sketch with the line "Concept sketch, not the project running." The Penalty Shootout stays the independent portfolio implementation. Cycoil shows "This exhibit performs no transactions." as its caveat and makes no payment claim.

Creative About keeps "The person behind the experiments" (reachable from the header and from the Studio building on the map, which is a link to the same notebook) and gains **Still open** (three open questions, each taken from a limit the project documents and the audit checked, with a link back) and **How to read my labels** (the six claim classes in plain words). No personal stories, awards or credentials were added. The "How I verify" row is not in Creative About.

## Which interactions are genuine, simplified, sample-based or illustrative
- **Genuine logic running in your browser:** Mazera's algorithms (independent re-implementation; path lengths matched the original on 327 audited grids, explored counts differ), PathAble's routing over a fictional campus (simplified cost model; 22 of 504 audited queries differ), the Private Local AI fusion rule on made-up notes (the meaning match is a labelled word-overlap stand-in; no model runs).
- **Simplified logic:** the SmartPark two-session sketch; the check-then-write branch is not project code and nothing talks to the project's database.
- **Saved results:** Predictive Maintenance numbers are copied from the committed result files; nothing is trained or predicted.
- **Illustration:** the AURA request route; the map landmarks themselves; every concept sketch.
- Nothing connects to a database, a model, a payment path or any private data, and no backend, account or leaderboard exists. Session-only marks (stations opened, challenges revealed) live in this tab's session storage.

## How it was checked

| Check | Result |
|---|---|
| `npm run lint`, `npm run typecheck`, `npm run build:static` | Pass (exit 0 each) |
| `tests/studio.spec.ts` (new, 19 tests) | Pass when run on their own and in the full runs below, apart from the machine-level flakes described next |
| Full Playwright suite, 139 tests, static build, run 1 (Python's simple `http.server`) | 128 passed, 11 failed |
| Full Playwright suite, run 2 (same build, a static server with a deeper connection queue) | 134 passed, 5 failed |

**The failures were not stable.** The two runs failed on different tests, the failing set changed between them, and each failed test passed when rerun alone. Chrome logs display-link errors throughout on this machine, and in run 1 one failure was traced to `ERR_CONNECTION_RESET` from the simple static server, which left a page on its Professional markup because a script chunk never loaded. That is why run 2 used a server with a deeper queue; it still failed on tests in other files, none in a way I could reproduce. A rerun passing is not proof of zero effect, but no deterministic regression was found, and the Creative map, exhibits, challenges, keyboard, fallback, reduced-motion and accessibility tests passed. Failed at least once and then passed alone: `hero.spec` Mazera district, `modes.spec` Creative About and search-and-filters, `portfolio.spec` (direct routes, demonstration labels, maze, clipboard, accessibility in both modes), `studio.spec` (exhibit by address, accessibility, tablet and phone widths), `transition.spec` (scanner both directions, no-WebGL scanner, reduced motion).

Looked at in Chrome (Playwright, installed Google Chrome) at 1440x900, 1000x800, 820x1100 and 390x844: the full map, each district, hover, selection, a zoomed district, the preview, all eight exhibit rooms, the SmartPark challenge result, List view, the phone strip and the preview under its district, and the About notebook.

## Known limits
- Not checked: Safari, Firefox, a real phone or touch device, a screen reader, Lighthouse, real GPUs. The 3D scenes ran in Chrome's software renderer.
- The browser suites are flaky on this machine (Chrome logs display-link errors, and a different test fails on each full run, on this branch and on the earlier baselines). Failed tests were rerun alone; a rerun passing is a rerun passing, not proof of zero effect.
- The scene canvases keep their own colours, so some exhibits (for example the SmartPark and AURA stages) sit on a light card inside the tinted room rather than being fully re-lit.
- Landmark art is hand-built SVG: it is consistent and honest but not a bespoke illustration set. Some labels overlap the base of a neighbouring landmark on the densest plates at narrow desktop widths (about 1000 px).
- The map is not pannable and has no free camera by design; the zoom is a fixed camera per district.
- A persisted preview can cover its neighbours; it closes with the × button or Escape.

## Open items carried over
Licences and teammate permissions (Last Mile, RupeeRise stay briefings), the AURA companion model licence, Cycoil's payment status (needs the owner), the Penalty Shootout's related-repository ownership, and checks that need hardware, credentials or models. See `docs/V6-AB-REPORT.md`.

## Not started
Stage D (transition redesign) and any change to the Precision Scanner; a 3D map; exhibits for the remaining briefing stations.
