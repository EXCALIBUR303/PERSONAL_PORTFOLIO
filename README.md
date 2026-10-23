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

- The new hero uses an asymmetric editorial layout and three selectable technical scenes: a metal system assembly, an algorithm grid, and a computational sculpture. Orbit, zoom, reset and motion controls work; touch users opt into 3D.
- College/Personal and Software/Hardware filters combine with search, categories and featured selection. Exhibit and compact index views share selection state across client-side navigation. Hardware shows an honest empty state because no completed physical build was verified.
- Every project has a dedicated route, evidence links, limitations, a typed demo record, and an appropriate interaction. The Dimension Engine, skills explorer, academic chapters, Color Field, theme switching and accessible dialogs remain available.
- Mazera loads its original built React app only on request and can open separately. Its original desktop layout scrolls inside the embed on small screens. The portfolio’s smaller maze explorer remains separately available.
- The supplied `sidharthsood303@gmail.com` address supports direct email and clipboard actions. The message pad prepares a link to a local email draft; visitors must send it in their email application. There is no submission backend or delivery claim.

## Project and demo boundaries

The authorized repository listing returned 21 repositories: 14 public (including the empty portfolio repository) and seven private. Thirteen public project repositories are represented, alongside an independent penalty game and the owner-named Last Mile DAA entry. Private source is not published. The five other private repositories are omitted.

The owner classified Burnout, its separate backend, UCO Recovery Station, PBL6 Green Mobility, Last Mile DAA and SmartPark DBMS as College. Other represented repositories are Personal. This collection label is not a sole-authorship claim; RupeeRise retains its team attribution. Last Mile DAA has no speculative architecture or technology claims. SIGSMITH is a documented proposal, not an implemented model.

Each demo explicitly distinguishes **original application**, **interactive simulation**, **run locally**, or **unavailable**. Passing core tests does not imply a complete application works without its database, simulator, model artifacts or configuration. See [execution audit](docs/research/v3-execution-audit.md), [source audit](docs/research/repository-audit.md), and [Mazera verification](docs/research/mazera-demo-verification.md).

## Two modes, one site

The header's **Professional / Creative** switch (also Alt+M) swaps the presentation. Routes, URLs, project data and behaviour are shared; the two modes are **separate component trees**, not one page re-coloured.

- **Mode state.** The choice is stored in `localStorage` (`portfolio-mode`). A tiny script in `<head>` (`modeBootScript` in `src/components/mode.tsx`) sets `data-mode` on `<html>` before first paint. React reads it with `useMode()` (`useSyncExternalStore`, server snapshot `pro`), so there is no hydration mismatch. First-time visitors get Professional. Creative visitors see the page fade in once React has swapped its tree (`data-ready`).
- **One source of truth.** Content comes from `src/data/*`. Filtering lives in `useGalleryFilter()` (`use-gallery-filter.ts`), the contact draft logic in `useContactDraft()` (`contact.tsx`), the project playground in `features/worlds/world-playground.tsx`. Both modes call these, and the gallery state sits in `AppFrame`, so search and filters survive a mode switch.
- **Professional** (`engineering-desk.tsx`, `project-gallery.tsx`, `growing-toolkit.tsx`, `contact.tsx`, `project-world.tsx`, `modes.css`, `hero.css`): editorial, structured, recruiter friendly.
- **Creative** (`src/components/creative/*`, `features/worlds/creative-project.tsx`, `creative.css`): a floating sticker dock, an asymmetric desk hero, a pinboard gallery with varied cards, a sticker-sheet toolkit, a notebook About page, a postcard contact form, a colophon footer, and a poster-style project page with folder tabs, a numbered scope timeline and a receipt of evidence. Each project keeps one colour identity (`creative/identity.ts`).
- **3D hero.** `hero-stage.tsx` (container, controls, keyboard, fallback) and `sculpture.tsx` (React Three Fiber scene) are shared. The camera distance is solved from the container's real aspect ratio so the model is never clipped. The wheel is left to the page; zoom uses the buttons or `+`/`-`; arrow keys rotate; `0` resets. Touch devices opt in, and vertical swipes keep scrolling the page. Without WebGL, or if the scene does not start within 15 s, a static poster and a plain explanation are shown.
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
| `src/components/hero-stage.tsx`, `sculpture.tsx`          | Shared 3D stage: framing, controls, fallback, and the lit geometry.                                                                                               |
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
