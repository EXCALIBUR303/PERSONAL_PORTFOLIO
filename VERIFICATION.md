# Verification — Devfolio V3

Verified 22 October 2026 in managed Linux with Node.js 24.19.0, Python 3.12 and Chromium 154.0.8037.57. Mac startup commands are documented; physical Mac/Safari execution is not claimed.

## Baseline and preservation

The V2 baseline at `7f71d2493e254c98b6d15af79349503a512caec2` passed lint, strict TypeScript, a normal production build and all 39 browser/algorithm tests before V3 edits. The existing Sites source matched that commit. Git history, GitHub origin, framework, package manager and lockfile were preserved. No runtime dependency was added.

## Builds and checks

- Normal Next.js production build: passed.
- Strict TypeScript: passed.
- ESLint: passed without warnings. Built original Mazera assets are excluded from source linting.
- Static export: passed; home, all 15 project routes, sitemap and robots files generated.
- Whitespace check: passed.
- Original Mazera assets are included under `/demos/mazera/` with corrected asset base and retained notices.

**All 50 tests passed** in the final consolidated run against the compressed static export on `http://localhost:3003` (one worker, 2.5 minutes). Initial focus, contact and contrast regressions were corrected; the final run includes the expanded accessibility checks.

## Functional coverage

The suite covers project/skill/graph references, seeded maze path validity and shortest-path agreement, deterministic penalty rules, all route reloads, search/category/featured filters, College/Personal collections, Software/Hardware empty states, exhibit/index selection, browser Back/Forward state, heading focus, native dialogs, menus, clipboard actions, email draft preparation, chapter navigation, toolkit/Dimension Engine controls, Color Field, project simulations, source walkthroughs, lazy original-app loading, touch 3D opt-in and no-WebGL fallbacks.

Responsive home widths: 320, 375, 768, 1024, 1440 and 1920 pixels. Representative project routes were checked on mobile. A separate original-app check confirmed the portfolio document does not overflow at 375px while the original Mazera interface scrolls within its own frame.

Automated WCAG 2 A/AA and WCAG 2.1 A/AA checks cover the home page and nine project worlds in both themes. The audit waits for lazy world content and completed theme paint. No violations were reported in the corrected expanded check. Automated checks are not a substitute for a full assistive-technology audit.

## Visual and 3D verification

Desktop real-WebGL and mobile fallback screenshots were inspected for the hero, gallery, light theme and original-app embed. The three desk lenses change the scene and meaningful project destination. Hero pause/reset and world 2D/3D controls work without page errors. A separate canvas-pixel check confirmed Top view changes the image, Reset changes it back, and the reset image exactly matches the initial isometric view.

WebGL is deferred on touch/data-saving devices until requested. Hero rendering is capped and paused offscreen; project scenes render on demand. Performance with activated WebGL was functionally exercised, not benchmarked for every device.

## Repository execution

The authorized inventory contained 21 repositories: 14 public (including the empty portfolio repository), seven private. Fifteen portfolio entries comprise thirteen public project repositories, an independent penalty game and the owner-named Last Mile DAA entry. No private implementation is published.

See [execution audit](docs/research/v3-execution-audit.md) for per-repository results and [Mazera verification](docs/research/mazera-demo-verification.md) for its original application. Notable results include 168 Mazera algorithm checks; 41 PathAble frontend and 163 routing checks; 204 SWARMMIND frontend checks (one skipped) and 88 core checks; and 218 selected Python tests across AERIS, RUL, RupeeRise and Resume Screener. Each burnout backend passed one SQLite feedback test. UCO passed five classifier branches and two payout arithmetic checks.

These counts describe separate bounded checks. They do not imply full database, authentication, model-training, paid-service or physical-hardware verification. The original Burnout frontend Jest suite failed before executing tests; UCO's API build was blocked by Prisma generation/download; SmartPark lacked PostgreSQL; PBL6 lacked a JDK compiler/Maven/Tomcat/MySQL. SIGSMITH is documentation only. Exact scope and local setup are visible in each world's demo registry.

## Contact and deployment boundaries

The supplied public contact email is configured. The message pad validates fields and prepares a mailto link. Visitors open, review and send the draft themselves; the website submits nothing and makes no delivery claim. Clipboard checks verify the email and GitHub profile contents.

The existing Sites project remains owner-private. Source is pushed to that site's repository, separately from the unchanged GitHub origin, before its exact static artifact is deployed. The deployment tool's terminal result is the publication authority; no public audience is implied. Original backend services are not deployed by the portfolio.

## Performance

Lighthouse 13.5.0 measured the compressed local static home page in mobile simulation, with browser tests/builds stopped during measurement:

| Category       | Score |
| -------------- | ----: |
| Performance    |    87 |
| Accessibility  |   100 |
| Best practices |   100 |
| SEO            |   100 |

FCP: 1.2 seconds; LCP: 3.5 seconds; total blocking time: 200 milliseconds; speed index: 2.8 seconds; cumulative layout shift: 0. Raw evidence: `docs/lighthouse-v3-mobile.json`.

This is one local laboratory run of the initial mobile presentation, where WebGL is opt-in. LCP is above the 2.5-second good threshold and remains an optimization opportunity. These scores do not establish hosted-origin performance, field INP, activated WebGL frame rate, or every route/device. A first measurement attempt could not connect after the local preview process stopped; it produced no valid scores. Restarting the preview produced the result above. V2 scores remain historical.
