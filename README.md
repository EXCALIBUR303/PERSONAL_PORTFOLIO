# Devfolio V2 — Form & Function

**The Project Multiverse:** Sidharth Sood’s source-backed engineering portfolio. Next.js App Router, React, strict TypeScript, Tailwind CSS 4, Motion, Three.js / React Three Fiber / Drei, and Lucide. The original violet sculpture, themes, accessible quick overviews, pointer depth, and Color Field are preserved.

The home page leads to **ten dedicated project routes**: nine inspected public repositories and one independently authored penalty game. No private football code was read, embedded, or published. Every public project includes pinned implementation evidence, its actual stack, reconstructed architecture, and known limits.

## Run locally on macOS

Use Node.js **20.9 or newer**; Node 22 or 24 is recommended. From the repository directory:

```sh
npm ci
npm run dev
```

Open **http://localhost:3000**. Next.js reports a different port if 3000 is occupied; you can explicitly choose one with `npm run dev -- --port 3005`.

Production mode:

```sh
npm run lint
npm run typecheck
npm run build
npm run preview
```

`preview` and `start` both run the standard Next.js production server on port 3000. Run the normal build first; `next start` does not serve a static-export build. No database, API key, authentication provider, or environment file is required to run this portfolio. The engineering projects are explored through local demonstrations and source explanations, not external backends.

No framework migration, duplicate animation engine, or runtime dependency was added for V2. The existing npm lockfile is retained.

## Explore the worlds

| Route                                  | Experience                                                                                                               | Scope                                                                                                                                                      |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/projects/student-burnout-ai/`        | Selectable input → features → ensemble → history guide                                                                   | Source-backed explainer. No health data collection, diagnosis, or model inference.                                                                         |
| `/projects/mazera-ai-maze-solver/`     | Seeded maze generation; BFS, DFS, Dijkstra, A*; Start/Pause/Step/Reset/speed; cell inspection; optional 3D               | Independently implemented TypeScript educational adaptation of verified standard algorithms. The original source also implements Greedy and Bidirectional. |
| `/projects/uco-recovery-station/`      | Selectable weight, capacitance/contamination, and color gates; accepted/rejected/ignored guide; optional spatial objects | Illustrative sample states. Hardware calibration, sensors, ledger transactions, and payment services are not connected.                                    |
| `/projects/smart-parking-dbms/`        | Selectable bays, simulated arrival/release/reset, optional 3D floor map                                                  | Synthetic local occupancy only. No requests or mutations to the actual PostgreSQL system.                                                                  |
| `/projects/predictive-maintenance/`    | Select computational modules and a model guide; inspect a synthetic RUL curve; optional symbolic engine                  | No checkpoints, real sensors, calibrated twin, confidence estimates, or trained-model inference.                                                           |
| `/projects/football-penalty-shootout/` | Playable aim/power/keeper/scoring interaction                                                                            | Original local game, separate from the private repository. Deterministic rules are disclosed.                                                              |
| `/projects/green-mobility/`            | Component walkthrough and architecture graph                                                                             | Public Java/JSP/JDBC/MySQL booking implementation. Emissions estimates are not measured impact.                                                            |
| `/projects/aeris/`                     | Component walkthrough and architecture graph                                                                             | Public simulation research; later source is more developed than the stale README. No verified physical flight.                                             |
| `/projects/rupeerise/`                 | Component walkthrough and architecture graph                                                                             | Public financial-literacy prototype. No hackathon award or placement is claimed.                                                                           |
| `/projects/resume-screener/`           | Component walkthrough and architecture graph                                                                             | Public ingestion/OCR/redaction/retrieval/evidence-scoring pipeline. No candidate data or backend is connected.                                             |

Public repositories: `student-burnout-ai`, `mazera-ai-maze-solver`, `uco-recovery-station`, `DBMS_SMART_PARKING`, `rul-predictive-maintenance`, `pbl6-green-mobility`, `aeris`, `IIIT_HACKATHON`, and `resume-screener`, all under `github.com/EXCALIBUR303`.

The provided GitHub `PERSONAL_PORTFOLIO` repository was publicly visible but empty at audit time; this existing local portfolio and its history were preserved as the implementation base. No public GitHub push is implied by a private Sites deployment.

## How it works

- **App frame:** persistent theme, gallery query/category/featured state, navigation, route focus management, cursor enhancement, scroll progress, and a non-blocking color transition. Returning from a world preserves filters during client navigation. Browser Back and direct URLs continue to work.
- **Gallery:** search across names, summaries, tools, and categories; category filters; featured switch; explicit empty state; keyboard-operable route links and native quick-overview dialogs.
- **Curious Mind / Growing Toolkit:** stable skill clusters. Each selection explains actual project use or an explicitly labeled interest. No percentages or inferred expert status.
- **Dimension Engine:** source-backed SVG diagrams with selectable components, highlighted connections, and an HTML inspector. Logical diagrams are reconstructions, not live network traffic.
- **Chapters:** expandable education, independent experience, and implementation milestones. The degree is user-confirmed; university, academic dates, employment, awards, and contact email are not fabricated.
- **3D:** the original hero auto-loads on eligible desktop devices. Spatial project views use demand rendering and instancing for maze blocks. Orbit controls have no continuous damping loop. Touch/data-saving devices opt in; reduced motion defaults to 2D project views. Every meaningful interaction has ordinary HTML controls and a 2D counterpart.
- **Motion:** shared timing tokens, lazily loaded Motion features, restrained section/route entrances, card depth, and project-color feedback. The transition never waits before navigation or blocks controls. Reduced motion disables decorative movement. Theme colors switch together to preserve text contrast.
- **Contact:** the public GitHub profile is linked and copyable. With no verified email, the message pad downloads a local `.eml` draft and explicitly says nothing was sent. It is not a backend submission form. Adding a verified address enables mailto/copy-email; sending still happens in the visitor’s email app.

## Customize

| File                              | Edit here                                                                                                                                                                                                   |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/data/profile.ts`             | Public name, degree/role, hero, introduction, About, interests, availability, verified email/socials, SEO origin/title/description.                                                                         |
| `src/data/projects.ts`            | The single project registry: ID/slug, categories, actual stack, status, source visibility, art kind/accent, features, problem/solution, architecture, limitations, pinned evidence, optional verified demo. |
| `src/data/skills.ts`              | Skills, group, status, explanation, and optional project reference.                                                                                                                                         |
| `src/data/education.ts`           | University, dates, year/semester, confirmed coursework, and technical activities.                                                                                                                           |
| `src/data/experience.ts`          | Independent/academic/professional roles, organization, dates, responsibilities, outcomes, project and evidence links.                                                                                       |
| `src/data/milestones.ts`          | Genuine implementation highlights, dates when supplied, project reference, and optional image.                                                                                                              |
| `src/app/globals.css`             | Original design system and preserved compositions.                                                                                                                                                          |
| `src/app/multiverse.css`          | V2 tokens, gallery artwork, toolkit, diagrams, chapters, responsive worlds, and interaction styles.                                                                                                         |
| `src/components/motion-config.ts` | Named timing, easing, and spring presets.                                                                                                                                                                   |

To add a project, add a typed record to `projects.ts`, use unique `id`/`slug` values, provide valid node IDs/edge references, and cite inspected public source. Put private source behind `githubUrl: null` and never copy its code or claims into the registry. Use the shared `architecture` kind for a source walkthrough, or add a focused module under `src/features/worlds/` and register it in `project-world.tsx`. Routes, sitemap, gallery, and engine selector are generated from the registry.

Use `liveUrl` only after confirming a genuine working external deployment. SmartPark’s README lists a demo, but the available Vercel connection could not verify that deployment; the field intentionally stays null. This access limit is not evidence that the public application is down.

The hero and local artwork contain no external font/image calls. Fonts live in `public/fonts` with licenses. Update both `public/opengraph-image.svg` and its rendered PNG when changing the identity.

## Test

Fast algorithm and registry checks need no server:

```sh
npm run test:unit
```

For the complete regression suite, first build and start a production server in one terminal:

```sh
npm run build
npm run start -- --port 3001
```

In a second terminal:

```sh
npm test
```

The config uses installed Google Chrome on macOS or `/usr/bin/chromium` in the Linux build environment when available. Otherwise install Playwright Chromium:

```sh
npx playwright install chromium
npm test
```

To choose a browser explicitly on a Mac:

```sh
CHROMIUM_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm test
```

`TEST_BASE_URL=http://localhost:3002 npm test` targets another running instance. `npm run test:e2e` remains an alias for the complete Playwright suite.

The suite checks seeded algorithm validity and shortest paths, deterministic game rules, registry integrity, home sections, all ten direct routes/refresh, search/filtering, state restoration, theme persistence, keyboard dialogs, architecture/skill selection, specific world controls, local draft/clipboard behavior, responsive widths, reduced motion, WCAG checks, and real desktop/mobile WebGL paths. See `VERIFICATION.md` for the actual executed results and measurement limits.

## Deploy

### Vercel / standard Next.js

Import the source directory, choose **Next.js**, and use `npm run build`. Keep the standard framework output settings; do not set `STATIC_EXPORT`. No runtime secrets or environment variables are required. Update `site.url` in `profile.ts` to the final origin, rebuild, and deploy. Next.js handles deep-route refreshes and metadata.

No Vercel account deployment is claimed. Publishing through the available Sites integration updates the existing Site and preserves its current audience.

### Static host

The cross-platform export command is:

```sh
npm run build:static
```

Upload **`out/`** to a static host with gzip/Brotli and long-lived caching for hashed `/_next/static/` assets. `trailingSlash: true` emits each project as `projects/<slug>/index.html`, so direct navigation and refresh do not need an SPA catch-all rewrite. Retain folder index handling on your host. Robots and all world URLs are generated at build time.

`.openai/hosting.json` retains this Site’s existing opaque project ID and `out` directory. Do not reuse that identity to register an unrelated Site. No database, API key, or authentication is necessary for the portfolio’s own code; private hosting access, if enabled by the platform, is separate.

## Troubleshooting and boundaries

- **Missing browser:** install Playwright Chromium or set `CHROMIUM_PATH` as above.
- **Wrong app under test:** ensure `TEST_BASE_URL` points at the server for the build being checked. The dev server and a production server can coexist on separate ports.
- **Static build with `preview` error:** run `npm run build` before `npm run preview`, or serve `out/` with a static host.
- **No 3D / unsupported WebGL:** use the fully functional 2D controls. Touch/data-saving devices opt in; reduced-motion project views start in 2D. The original hero uses a static composition with reduced motion.
- **Blank or failed scene:** the scene boundary retains the technical fallback; try 2D mode. No important project information depends on WebGL.
- **Clipboard unavailable:** use HTTPS or localhost and copy the visible GitHub/email link manually.
- **No email delivered:** the message pad only prepares a local draft. Configure an actual email address and send from an email app, or connect a real server delivery service separately.
- **New project absent:** verify its registry entry and rebuild; static routes and metadata are generated at build time.
- **Academic placeholders:** only fill university, dates, coursework, jobs, and awards with confirmed information.
- **Original ML/hardware systems:** this portfolio does not execute Python services, model checkpoints, PostgreSQL databases, kiosks, hardware, payment systems, or private repositories.
- **macOS verification:** the local workflow is portable and documented for macOS; automated execution here occurs on managed Linux/Chromium, not a physical Mac.

Public source research and pinned references are in `docs/research/repository-audit.md`. V1 verification is archived under `docs/history/` and is not a V2 performance claim.
