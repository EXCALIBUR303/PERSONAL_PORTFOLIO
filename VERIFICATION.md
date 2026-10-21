# Verification — Devfolio V2 / The Project Multiverse

Verified 21 October 2026 in managed Linux using Node.js 24.19.0 and Chromium 154.0.8037.57. macOS instructions are documented, but execution on a physical Mac or Safari is not claimed.

## Baseline and preservation

Before V2 changes, the existing lint, strict TypeScript, normal production build, and all 16 Playwright tests passed. The native hosting source matched local commit `43e973dad5dd3d9b2fc43f4b1adf8705420c805c`. Existing history, GitHub origin, lockfile, dependencies, original violet sculpture, Color Field, themes, and native quick-overview dialog behavior were preserved.

The public GitHub PERSONAL_PORTFOLIO repository was empty at audit time. Source publication to the existing Sites repository is separate from the user’s GitHub origin; no GitHub push is claimed.

## Build and static checks

- `npm run lint`: passed.
- `npm run typecheck`: passed with strict TypeScript.
- `npm run build`: passed in normal Next.js production mode.
- `npm run build:static`: passed and emitted the deployment in `out/`.
- Ten project paths are generated through `generateStaticParams`; the export contains a folder `index.html` for each route.
- `git diff --check`: passed.
- No runtime dependency or lockfile change was necessary. The existing installed dependency set was reused.

The cross-platform static build script sets `STATIC_EXPORT` in the child-process environment. The normal `build` and `preview` commands remain appropriate for Next.js/Vercel hosting. Static exports require an ordinary static host instead of `next start`.

## Automated browser and algorithm results

**39 tests passed** against the compressed static export on `http://localhost:3003` (one worker, approximately 1.7 minutes).

The three algorithm/data cases cover reproducible seeded mazes; reachable, valid paths; shortest-path agreement among BFS, Dijkstra, and A* across several seeds; deterministic penalty rules; source-evidence and graph-reference integrity; and valid skill/project references.

The 36 browser cases cover:

- All home chapters, internal anchor destinations, and runtime errors.
- Search, justified categories, featured filtering, and empty-state reset.
- Dedicated route entry and return with gallery query/theme retained; route heading focus.
- Native dialog focus trapping, Escape dismissal, and focus restoration.
- Mobile navigation and Escape behavior.
- Home layout at 320, 375, 768, 1024, 1440, and 1920 pixels.
- Direct navigation and refresh of all ten project routes.
- Toolkit and Dimension Engine selection, real component descriptions, and source-project links.
- Maze generation, algorithm selection, stepping, Start/Pause/Reset, live reduced-motion preference changes, path rendering, and cell inspection.
- Parking selection, local arrival/release/reset states, and backend separation.
- ML, UCO, and RUL explanatory controls and clear synthetic-data boundaries.
- Playable original football scoring and disclosed deterministic behavior.
- Additional project architecture walkthroughs.
- Preserved Color Field controls and reduced-motion behavior.
- Local `.eml` download and actual GitHub clipboard behavior, with no delivery claim.
- Representative 320px home and world layouts.
- Automated WCAG 2/2.1 A/AA checks on the home, maze, student, parking, and football routes in **both themes**, with no violations returned.
- Actual desktop WebGL sculpture and maze view, plus switching back to the technical fallback.
- Actual touch-device opt-in for hero and parking WebGL.

The HTML cases explicitly disable WebGL to test usable fallbacks. The two dedicated 3D cases create separate contexts with WebGL enabled. Browser errors are checked in the home, direct-route, and desktop WebGL cases. Additional screenshots of the home, maze, parking, maintenance, UCO, football, toolkit, and chapters were visually inspected.

Issues found during V2 QA were corrected: light-theme diagram contrast, parking visible/accessibility-name alignment, inert pre-hydration explorer controls, route slash expectations, and the installed motion hook’s failure to subscribe to runtime preference changes. Explorers now load on the client behind a useful loading state, while project summaries, evidence, and architecture remain available as ordinary page content. Maze animation observes media-query changes directly.

A final contact-only regression also passed after deriving clipboard content from the editable profile record. This prevents a future profile URL edit from leaving the clipboard action out of sync.

## Performance measurement

Lighthouse **13.5.0**, default mobile emulation with simulated slow 4G and 4× CPU slowdown, measured the final static export served locally with gzip and immutable caching for hashed assets. Browser tests and builds were stopped during measurement. No run warnings were returned.

| Category       | Score |
| -------------- | ----: |
| Performance    |    91 |
| Accessibility  |   100 |
| Best practices |   100 |
| SEO            |   100 |

| Metric                   | Measured value |
| ------------------------ | -------------: |
| First Contentful Paint   |          1.1 s |
| Largest Contentful Paint |          3.1 s |
| Total Blocking Time      |         170 ms |
| Cumulative Layout Shift  |              0 |
| Speed Index              |          1.2 s |

Raw results are committed in `docs/lighthouse-v2-mobile.json`. This is one local laboratory result, not a claim about every route, the hosted origin, field INP, or all devices. LCP remains above the 2.5-second good threshold. The default touch experience defers WebGL until requested, so the score describes the initial mobile presentation; activated WebGL was functionally checked separately. Historical V1 reports are archived under `docs/history/` and are not evidence of V2 performance.

## Evidence and application boundaries

Nine public repositories were inspected beyond their README files. Pinned source references and caveats live in `src/data/projects.ts` and `docs/research/repository-audit.md`. No model training or original Python/Java/Node backend was executed for this audit.

The maze is an independently written TypeScript adaptation of verified standard algorithms. Parking uses synthetic local states. Student Burnout, UCO, maintenance, and the additional project workflows explain source behavior through interactive guides; they do not run trained models, operate sensors, connect payments, or mutate databases. The maintenance curve is explicitly synthetic; the symbolic engine is not a calibrated digital twin.

Football source is private and was never read or published. The playable portfolio game is independently authored. No private implementation or achievement claim is made.

The user’s degree and public GitHub profile name are populated. University, academic dates, employers, awards, and email remain unfilled when not supplied. The contact pad only prepares a local draft. SmartPark’s README demo could not be independently verified with the available Vercel access; it is not advertised as a working live demo. This does not establish that the external app is unavailable.

3D quality and frame rate depend on the visitor’s hardware. Touch/data-saving devices opt in; project scenes use capped DPR and demand rendering. Unsupported WebGL retains functional HTML controls and 2D diagrams. Automated accessibility checks and Chromium keyboard testing do not establish complete conformance across every screen reader or browser.

## Deployment

The existing Site identity and private audience are retained. The static artifact is published only after successful checks and source synchronization. Deployment status and the returned URL are verified through the hosting integration; no public audience change or Vercel deployment is claimed.
