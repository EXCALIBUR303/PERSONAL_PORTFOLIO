# Stage D review pack

Branch `stage-d-premium-refinement`, nine local commits on top of production `9582c26` (Stage C, live). Nothing is pushed. Rollback reference for Stage C stays `rollback-pre-stage-c` (70ad823); to undo Stage D after a release, revert to `9582c26`.

## Scope
Premium visual refinement of the studio world. Scanner and transition files, `package.json` and the lockfile are untouched (17 files changed, 610 insertions, 70 deletions; the list is in `git diff --stat main..HEAD`).

## What changed, in commit order
| Commit | Change |
|---|---|
| e6eb595 | Baseline and refinement audit (`V6-D-AUDIT.md`). |
| 862a448 | Five defects: names off their landmarks, whole-world phone overview, Algorithms framed from its real plates, short Studio plate on narrow stages, Intelligence contrast. |
| 6b89834 | Headroom: sub-pixel box rounding dropped, tiny shadow casters dropped, medium tier held to 110k triangles (`V6-D-HEADROOM.md`). |
| 0ec584c | Atmosphere and materials: cool sky and warm haze layers, sun glow, cooler fill, real reflections on glass and metal. |
| ec8d504 | Ambient light: two cloud shadows and a slow sun sweep on the compositor. |
| c53371e | Camera: fuller opening move, small eased lean towards a mouse pointer. |
| 2d8de2b | Quieter chrome: fine line and soft lift on plaques, plates and panel. |
| 41b0b91 | Polish: SmartPark's first car turns ink, Cycoil weighs on a dial, small details larger (`V6-D-POLISH.md`). |
| abfa4f3 | The Systems bridge goes dark while Private Local AI is in focus. |

## Measured (Apple M5, real GPU, Chrome for Testing)
- Scene, medium tier: 111,204 to 89,892 triangles, 292 draw calls (unchanged). Scene plus shadow pass: 206,660 to 158,936 triangles, 519 to 478 calls. Shadow casters 237 to 187.
- Frames on the high tier: 60 fps at the median and 95th percentile, no frame over 33.4 ms in the final unthrottled run (16.8 ms max). Shader programs stay at 11. Load long tasks 110 ms or less.
- Under a 4x CPU throttle there is one 50 to 67 ms frame at the first district switch. The Stage C build shows the same frame, so it is not new.
- Tests: 158 of 158 pass on a clean run (Stage C had 156; two new tests cover the ambient layers and the pointer lean, and the budget test now enforces 110k triangles). Lint and typecheck are clean. axe (WCAG 2 A and AA, 2.1 AA) finds no violations on the stage in the overview, each district and with a station selected (checked before the later visual passes, then re-run after the chrome pass).
- Earlier full runs failed on timeouts caused by my own scratch test server, not by the app; they were not counted as passes.

## Look at these
Screenshots are in `docs/review-shots-d/` (untracked): `desktop-*`, `tablet-*` and `phone-*` are the audit baseline; `after-*` the five fixes; `atm-before/after-*`, `chrome-after-*` and `polish-*` the later passes.

## Not checked
Safari, Firefox, real phones and tablets, integrated GPUs, screen readers, browser zoom and forced colours, and battery impact of the ambient layers. The tablet and phone chrome was checked in screenshots only. The plaque outline contrast (about 3.3 to 1) is computed, not measured in a browser. Preview and production have not seen any Stage D code.

## Decisions for you
1. **Review the look** from the screenshots, or in a local run (`npm run dev`, Creative mode, Map).
2. **Release path** (only on your literal command): `push preview` publishes the branch for a Vercel preview, which is behind Vercel sign-in and cannot be browsed by me; `push main` promotes to production and needs its own approval after preview verification.
3. **Untracked screenshot folders** (`docs/review-shots*`): commit, keep local, or delete. They are not in any commit.
4. **Stray Vercel project `portfolio-stage-ab`**: still untouched; your deletion to review.
