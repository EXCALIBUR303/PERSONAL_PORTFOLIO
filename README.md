# Devfolio V3 — The Interactive Engineering Universe

Sidharth Sood’s source-backed portfolio: a material-lit engineering desk, searchable College and Personal collections, fifteen project worlds, and an embedded original Mazera application. Built with the existing Next.js App Router, React, strict TypeScript, Motion, Three.js / React Three Fiber / Drei, and Lucide stack. No new runtime dependencies were added.

## Run on a Mac

Install Node.js 24 LTS and npm, then run these commands from this portfolio checkout:

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. For normal Next.js production mode:

```sh
npm run lint
npm run typecheck
npm run build
npm run preview
```

For static hosting, use `npm run build:static` and serve `out/` with a static server that supports directory `index.html` files. Do not use `next start` for the static export. The included cross-platform build script sets `STATIC_EXPORT` without requiring shell-specific environment syntax. Execution was verified on Linux; physical Mac/Safari verification is not claimed.

Run browser checks against a separately running server:

```sh
TEST_BASE_URL=http://localhost:3000 npm test
```

Playwright uses installed Google Chrome on macOS or `/usr/bin/chromium` on Linux when available. Set `CHROMIUM_PATH` to another installed browser, or install Playwright Chromium in your own environment. Algorithm-only checks use `npm run test:unit`.

## What changed

- The hero has three categories (Systems, Algorithms, Intelligence) with three project scenes each. The main scene in each is 3D: the AURA studio (zones on a web-layer deck, a typed bridge, Swift services below; send a request and watch it cross), Mazera's six solvers on a 3D maze with play, pause, step, reset and speed, and the Voice-Controlled Robot Dog walking on spoken or typed commands. The others are flat: SmartPark row locking, Private Local AI retrieval with citations, Last Mile DAA stages, PathAble accessible routing, SWARMMIND's random and frontier baselines, and Predictive Maintenance's engine split. Every scene says whether it is a working demo, simulation, sample-data walkthrough or illustration, and links to its project.
- Switching modes plays the **World Shift**, a short portal ride: a ring portal opens at the switch, the camera dives through it and down a tunnel of rings into Creative mode, and the way back retraces the path. The header and any project cards on screen glide to their places in the other layout. Without the 3D layer the other mode grows out of the switch inside a cobalt and orange ring.
- The home page is shorter: hero, project worlds, toolkit, About (with source-backed highlights in place of the old Chapters section) and contact. The Dimension Engine, Color Field and skills marquee were removed from the home page because they repeated the project pages or were only decoration. No empty "not provided" fields remain.
- College/Personal and Software/Hardware filters combine with search, categories and featured selection. Exhibit and compact index views share selection state across client-side navigation. Hardware shows an honest empty state because no completed physical build was verified.
- Every project page is a short story: the problem and approach, a demonstration, how it works, the technical decisions and the honest limits, with deeper detail in disclosures. Mazera, Last Mile DAA, ParkScan Swarm, SmartPark DBMS, Predictive Maintenance, Burnout, UCO and the penalty study have their own interactive demos; the rest use the architecture walkthrough. Every page labels its demo (`src/data/demo-class.ts`). The skills explorer, theme switching and accessible dialogs remain available.
- Mazera loads its original built React app only on request and can open separately. Its original desktop layout scrolls inside the embed on small screens. The portfolio’s smaller maze explorer remains separately available.
- The supplied `sidharthsood303@gmail.com` address supports direct email and clipboard actions. The message pad prepares a link to a local email draft; visitors must send it in their email application. There is no submission backend or delivery claim.

## Project and demo boundaries

The authorized repository listing returned 21 repositories: 14 public (including the empty portfolio repository) and seven private. Thirteen public project repositories are represented, alongside an independent penalty game and the owner-named Last Mile DAA entry. Private source is not published. The five other private repositories are omitted.

The owner classified Burnout, its separate backend, Mazera AI Maze Solver, UCO Recovery Station, PBL6 Green Mobility, Last Mile DAA and SmartPark DBMS as College. Other represented repositories are Personal. This collection label is not a sole-authorship claim; RupeeRise retains its team attribution. Last Mile DAA has no speculative architecture or technology claims. SIGSMITH is a documented proposal, not an implemented model.

Each demo explicitly distinguishes **original application**, **interactive simulation**, **run locally**, or **unavailable**. Passing core tests does not imply a complete application works without its database, simulator, model artifacts or configuration. See [execution audit](docs/research/v3-execution-audit.md), [source audit](docs/research/repository-audit.md), and [Mazera verification](docs/research/mazera-demo-verification.md).

## Two modes, one site

The header's **Professional / Creative** switch (also Alt+M) swaps the presentation. Routes, URLs, project data and behaviour are shared; the two modes are **separate component trees**, not one page re-coloured.

- **Mode state.** The choice is stored in `localStorage` (`portfolio-mode`). A tiny script in `<head>` (`modeBootScript` in `src/components/mode.tsx`) sets `data-mode` on `<html>` before first paint. React reads it with `useMode()` (`useSyncExternalStore`, server snapshot `pro`), so there is no hydration mismatch. First-time visitors get Professional. Creative visitors see the page fade in once React has swapped its tree (`data-ready`).
- **One source of truth.** Content comes from `src/data/*`. Filtering lives in `useGalleryFilter()` (`use-gallery-filter.ts`), the contact draft logic in `useContactDraft()` (`contact.tsx`), the project playground in `features/worlds/world-playground.tsx`. Both modes call these, and the gallery state sits in `AppFrame`, so search and filters survive a mode switch.
- **Professional** (`engineering-desk.tsx`, `project-gallery.tsx`, `growing-toolkit.tsx`, `contact.tsx`, `project-world.tsx`, `modes.css`, `hero.css`): editorial, structured, recruiter friendly.
- **Creative** (`src/components/creative/*`, `features/worlds/creative-project.tsx`, `creative.css`): a studio map instead of a hero. Every project is a station in one of three districts; choosing one opens a briefing with four missions (problem, try it, how it works, decisions) that link to real sections of the project page. Session progress (`src/lib/exploration.ts`) counts only pages and missions this browser tab opened, lives in `sessionStorage`, and is never sent anywhere. The board below keeps search and filters, which also dim stations on the map. The project page is a mission board with one panel open at a time, a notebook About, a sticker-sheet toolkit, a guided terminal contact that only prepares an email draft, and a colophon footer. Each project keeps one colour identity (`creative/identity.ts`).
- **Hero scenes.** `src/components/scenes/catalog.ts` lists every scene and its honest label. `scene-stage.tsx` loads only the chosen scene (each is its own chunk; three.js loads only with a 3D scene). The 3D scenes (`scenes/three/*`) share `stage.tsx`: one React Three Fiber canvas that renders continuously only while on screen and not paused, a camera framing per mode that eases when the mode changes and pulls back on narrow screens, orbit and zoom, pause and reset. Without WebGL each falls back to a flat version; with reduced motion they start paused. Scene state and controls are ordinary HTML beside the canvas, so nothing is locked inside it. The Professional hero shows category tabs and a scene picker; the Creative map offers the same scene as a quick peek.
- **World Shift** (`src/lib/world-shift.ts`, `world-shift.css`, `src/components/portal/`). Uses the View Transitions API: the browser keeps the old page as a snapshot while the new mode renders live underneath. One GSAP timeline (about 0.92 s) moves a virtual camera. The same numbers drive the 3D rings (React Three Fiber, `portal-canvas.tsx`) and the CSS that scales the two page snapshots, so the opening in the page stays on the ring. Professional is the wall the portal is cut into and Creative lies beyond it; Creative to Professional plays the timeline in reverse. The header and on-screen project cards carry a shared `view-transition-name` and morph between layouts; Anime.js draws spark lines at the switch. The 3D layer loads when the pointer or focus reaches the switch, or a few seconds after the page settles; until then, or without WebGL, the shift uses the earlier ring reveal. Clicks pass through, a second click finishes the running shift and starts the next, the route and filters are untouched, and the visitor stays at the same section. Without View Transitions it falls back to a short colour cross-fade; with reduced motion the mode simply changes and the 3D layer never loads.
- **Animation ownership.** GSAP drives only the World Shift (its camera, CSS variables and portal state). Anime.js (`src/components/shift-intro.ts`) draws the Creative annotations and settles the districts, and draws the Professional grid after a shift, scoped to one root and reverted on unmount. Motion keeps its existing component transitions. Three.js movement stays inside the R3F scenes. No two engines animate the same element.
- **Project demos.** `src/lib/lastmile.ts` (greedy vs knapsack, nearest/insertion/2-opt/Held-Karp, spanning tree), `swarm-sim.ts` (zones vs independent robots) and `leakage.ts` are small re-implementations on made-up data, each labelled as such. They are not output from the original projects.
- `src/components/mini-anim.tsx` draws the small looping canvas sketches on cards and project pages. They illustrate the documented idea and are labelled as concept sketches. They pause off-screen and in reduced motion.
- The Creative cursor (`Cursor` in `app-frame.tsx`) moves its dot directly from the pointer event. It is not rendered on touch or with reduced motion.
- VERIFICATION.md and the Lighthouse files describe the earlier V3 baseline and were not regenerated for the modes.

## Edit the portfolio

| File                                                      | Purpose                                                                                                                                                            |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/data/profile.ts`                                     | Name, introduction, public contact and canonical site URL.                                                                                                         |
| `src/data/projects.ts`                                    | Typed project/demo registry: collections, discipline, source commits, evidence, architecture, commands, environment variable names and actual verification limits. |
| `src/data/skills.ts`                                      | Skills and their project evidence.                                                                                                                                 |
| `src/data/education.ts`, `experience.ts`, `milestones.ts` | Academic and experience chapters; populate only verified personal facts.                                                                                           |
| `src/components/engineering-desk.tsx`, `creative/creative-hero.tsx` | Professional and Creative hero compositions.                                                                                                      |
| `src/components/lens/`, `desk-data.ts`                    | The three hero visualisations and the copy that ties each to a project.                                                                                           |
| `src/features/worlds/project-sections.tsx`                | Project page blocks shared by both modes (try it, how it works, limits, sources).                                                                                 |
| `src/data/demo-class.ts`                                  | What kind of demonstration each project page offers.                                                                                                              |
| `src/components/project-gallery.tsx`                      | Collection filters, exhibit preview and index.                                                                                                                     |
| `src/components/demo-console.tsx`                         | Original app launch, lazy iframe and local setup.                                                                                                                  |
| `src/features/worlds/`                                    | Project interactions, fallback diagrams and optional 3D.                                                                                                           |
| `src/app/universe.css`                                    | V3 surfaces, composition, typography and responsive overrides.                                                                                                     |
| `public/demos/mazera/`                                    | Pinned original Mazera distribution and third-party notices.                                                                                                       |
| `tests/`                                                  | Browser, accessibility, registry and algorithm checks.                                                                                                             |

Keep credentials out of the registry: it stores environment variable **names and purposes only**. Commands in each world start from that project's repository root unless otherwise stated. They are setup guidance, not claims that every dependency or full workflow passed here. Dedicated local databases are recommended for setup and repository test suites that recreate schemas.

## Add a project

Add a typed entry to `src/data/projects.ts` with a unique ID/slug, owner-confirmed collection, evidence-backed discipline, pinned public source links, architecture nodes/edges, and a complete demo record. Use an existing world kind or implement a dedicated component under `src/features/worlds/` and wire it into `project-world.tsx`. Routes are generated from the registry automatically. Add only substantiated skill references in `skills.ts`.

For an original static application, build it with a `/demos/<slug>/` asset base, retain attribution/notices under `public/demos/<slug>/`, and verify it both standalone and embedded. Choose `embedded` only after the real application works. Otherwise use `local`, `simulation`, or `unavailable`, with precise commands and blockers. Update the audit and run lint, TypeScript, build, and route/interaction checks before publishing.

## Hosting and history

`.openai/hosting.json` identifies the existing owner-private Sites project and `out/` artifact. Source is versioned and pushed to that site's separate source repository before deployment. The GitHub `origin` is preserved; deployment does not mean the empty GitHub repository was populated. Sharing remains private until the owner explicitly changes it.

Previous verification is retained in `docs/history/`. Current results are in [VERIFICATION.md](VERIFICATION.md). The original V2 stylesheet remains a foundation; `universe.css` provides the V3 visual system. No previous performance score is presented as a V3 result.
