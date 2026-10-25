# Stage C3 — Phase 6 report: the remaining landmarks

Sonnet 5.5 at High. Branch `stage-c-premium-spatial-world`. Local only; nothing pushed.

## What changed
All 12 remaining landmarks (5 Algorithms, 7 Intelligence) now have detailed 3D models in place of the white study cards, each with a reaction on hover/select that is driven by the project's own data module where one exists. The world now has 20 detailed landmarks.

| District | Landmark | Model and reaction | Data behind the reaction |
|---|---|---|---|
| Algorithms | Mazera | 9x9 maze; a wave floods outward, then a lime path traces the solution | `lib/maze` (`makeMaze`, `solveMaze`) |
| Algorithms | PathAble | stairs with amber barrier posts versus a lime accessible route and a traveller | illustrative |
| Algorithms | Last Mile | depot, parcels, a van following an insertion route | `lib/lastmile` (`sequenceRoute`) |
| Algorithms | ParkScan | 30x20 tile floor, three robots, amber potholes | `lib/swarm-sim` (`simulate`) |
| Algorithms | Penalty Shootout | goal, keeper dives, net flash only on a goal | `lib/penalty` (`resolvePenalty`) |
| Intelligence | Predictive Maintenance | engine, 12-engine rack (training blue, validation amber), life gauge | `lib/rul-sim` (`makeFleet`, `cappedRul`) |
| Intelligence | Robot Dog | trotting legs, five-lamp pipeline chain | `scenes/dog-data` (`trot`) |
| Intelligence | SWARMMIND | two maps side by side: random walk versus frontier | `scenes/swarm-data` (`simulate`) |
| Intelligence | AERIS | 7x7 grid, A* path, drone with rotors | A* computed in the scene |
| Intelligence | Resume Screener | document through a redaction gate to a capped score gauge | illustrative |
| Intelligence | Student Burnout AI, SIGSMITH | blueprint ghosts that firm up on select | illustrative; they stay briefings |

Honesty labels: the reactions use the real algorithms where listed; the scenes are simplified miniatures, not live demos. PathAble, Resume Screener and the two blueprints are illustrative. Last Mile and RupeeRise remain briefings (team projects); Penalty Shootout stays independent; Cycoil wording is untouched.

New files: `scene/algorithms-landmarks.tsx`, `scene/intelligence-landmarks.tsx`, `scene/tiles.tsx` (one instanced tile grid, recoloured per frame). Edited: `scene/massing.tsx` (`DETAILED` map of 20 slugs). No dependency, lockfile or scanner file touched.

## Verification (M5, Chrome for Testing)
| Check | Result |
|---|---|
| Lint, typecheck, static build | pass |
| Playwright suite | **150 of 150 passed** (3.5 min) |
| M5 desktop | 60 fps; no frame over 33.4 ms in any segment; ready 390 ms |
| 4x CPU throttle | no frame over 50 ms except one at 50.1 ms on the overview-to-Systems flight; ready 1.24 s; last load task 413 ms (was 320-350 ms) |
| Scene size, desktop | **277 draw calls** (was 216), **111k triangles** (was 74.8k), 10 programs; budget 320 / 180k |
| Scene size, phone 390 | **337 draw calls**, 142k triangles |

### The phone draw-call count is over budget
Phone measured 337 calls against the 320 budget. I did not diagnose why the phone run counts more than desktop (the same landmarks are in both). It is a candidate for Phase 7: check whether the figure includes the shadow pass, and whether the Low tier should draw fewer details. Frame times on the 4x phone profile were fine (no frame over 50 ms), so this is a budget issue, not a measured stutter.

## Not verified
- Safari, Firefox, real phones and tablets, integrated GPUs, screen readers.
- The scanner transition over the new landmarks (its tests pass, but they do not look at the 3D content).
- No automated test yet checks that each of the 12 new landmarks renders without errors. Screenshots were reviewed by hand for all 12; the suite only exercises a few stations.

## Known issues (carried over)
- Remaining Systems reactions: SmartPark amber barrier light, Private Local AI conduit sequence, updated Cycoil, Green Mobility, LifeOS, RupeeRise reactions.
- Studio select camera does not face the oculus; the Studio name plate overlaps the roof; plate leader lines; two-chip panel header.
- The Algorithms island reads small; the search placeholder truncates at 820 px.

## Review shots
`docs/review-shots-p6/` (untracked, local): the 12 landmarks.

## Approval needed
Approve Phase 6, then Phase 7 (QA).

## Next
Phase 7: accessibility, performance and regression QA. Sonnet 5.5 High (current setting; no switch needed). Proposed scope: fix the phone draw-call overrun, add a render test for the 12 new landmarks, then the carried-over issues you choose.
