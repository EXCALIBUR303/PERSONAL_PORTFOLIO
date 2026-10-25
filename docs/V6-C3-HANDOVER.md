# Stage C3 — handover

Branch `stage-c-premium-spatial-world` (local; HEAD `6e375b1`). Built on `stage-c-spatial-map`; `stage-ab` and `stage-c-spatial-map` are untouched. **Nothing has been pushed, merged or deployed.** `main` still holds the live site.

## What this stage is
Creative mode's studio map is a hybrid 3D world: WebGL draws the architecture, light and atmosphere; HTML carries controls, labels and panels. Direction: "Living Engineering Archipelago x Premium Interactive Museum". Professional mode is unchanged. The 2D SVG map remains the fallback (no WebGL, a software renderer, or `?world=2d`). `?world=low|medium|high` forces a quality tier.

## Phases and where to read more
| Phase | Result | Report |
|---|---|---|
| 0 Audit | baseline | (in the spec's section 1) |
| 1 Art direction | decisions D1-D8, palette, lighting, budgets | `V6-C3-ART-DIRECTION.md` |
| 2 Studio, Systems, background | chart-table background, Studio rebuild, graph and bowl terrain | `V6-C3-PHASE2.md` |
| 3 Polish | compact panel with disclosure, type rules, one-row tablet toolbar | `V6-C3-PHASE3.md` |
| 4 Camera and reactions | arcing flights, clear-view rule, tablet and phone sheets | `V6-C3-PHASE4.md` |
| 5 Review | review report | `V6-C3-PHASE5-REVIEW.md` |
| 6 Landmarks | 12 more detailed landmarks (20 total) | `V6-C3-PHASE6.md` |
| 7 QA | shadow cost, landmark tests, polish, Systems reactions | `V6-C3-PHASE7.md`, `V6-C3-PHASE7B.md` |

## Run and test
```bash
npm run dev            # dev server
npm run build:static   # static export to out/
npm run lint && npx tsc --noEmit
TEST_BASE_URL=http://localhost:<port> npx playwright test   # serve out/ first; 154 tests
```
Restore `next-env.d.ts` (`git checkout -- next-env.d.ts`) after a build before committing. The tests need a Chrome that can run WebGL (set `CHROMIUM_PATH`); the 3D tests use `?world=medium`.

## Where things are
- `src/components/creative/world/`: `world-stage.tsx` (stage, HTML overlay, sheets), `world-canvas.tsx` (renderer, lights, shadows, test probe), `rig.ts` (the only camera owner), `camera.ts`, `layout.ts` (placements, shots, clear-view rule), `quality.ts`.
- `.../world/scene/`: `studio.tsx`, `ground.tsx`, `massing.tsx` (districts and the slug-to-landmark map), `systems-landmarks.tsx`, `algorithms-landmarks.tsx`, `intelligence-landmarks.tsx`, `tiles.tsx`, `trail.ts`, `kit.tsx` (merged geometry), `motion.ts`.
- `src/components/creative/studio/`: the panel (`station-card.tsx`) and toolbar (`studio-map.tsx`).
- CSS: `src/app/world.css`, `studio.css`. Tests: `tests/camera.spec.ts`, `landmarks.spec.ts`, `studio.spec.ts`.
- The transition and scanner files were not touched.

## Numbers (M5 laptop, Chrome for Testing)
- 60 fps; no frame over 33.3 ms. At 4x CPU throttle no frame over 50 ms. The load shows long tasks, the last about 410 ms, mostly native shader compile.
- The scene alone: 277 draw calls and 111k triangles (258 and 107k on the phone tier), inside the 320 / 180k budget. The shadow pass adds about 224 calls and 95k triangles on frames where something moves; it is limited to about 30 redraws a second.
- The speed-up from that limit is reasoned from the counts; the M5 already ran at 60 fps, so it is unmeasured on slower GPUs.

## What is real, simplified or illustrative
Landmark reactions use the project's own data modules where listed in `V6-C3-PHASE6.md` (Mazera, Last Mile, ParkScan, Penalty Shootout, Predictive Maintenance, Robot Dog, SWARMMIND). PathAble, AERIS's planner, Resume Screener, Student Burnout AI, SIGSMITH and every Systems reaction are illustrative, and the panel says so. Last Mile and RupeeRise stay briefings (team projects). Penalty Shootout is its own implementation. Cycoil shows no payment. No metrics are invented.

## Unverified or open
- Not checked: Safari, Firefox, real phones and tablets, integrated GPUs, screen readers, the scanner transition over the new 3D content.
- Accessibility: only the existing axe checks; the planned keyboard-order, focus and reduced-motion pass on the world was skipped by decision.
- The shadow pass on slower GPUs; 47 small casters could be dropped for about a fifth fewer shadow calls.
- The Algorithms island reads small.
- Spec gaps in the Systems reactions: Private Local AI's note stays within the vault and the bridge is not shown dark; SmartPark's first car does not turn ink; Cycoil's weighing is a lamp, not a scale; the new reaction details are small at district zoom.

## Housekeeping
- Untracked, local only: `docs/review-shots/`, `docs/review-shots-c3/`, `docs/review-shots-p6/` (about 51 MB of screenshots and a recording). Do not commit them without deciding.
- Pushing is the owner's call: `push preview` or `push main` only.
