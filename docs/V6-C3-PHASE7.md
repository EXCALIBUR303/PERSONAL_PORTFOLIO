# Stage C3 — Phase 7 report (part 1): the draw-call overrun and the landmark tests

Sonnet 5.5 at High. Branch `stage-c-premium-spatial-world`. Local only; nothing pushed. This is the first part of QA: the phone draw-call overrun and the missing landmark test. The carried-over polish issues are not done yet (see the end).

## The "337 draw calls on phone" finding was a measurement mix-up, not a bigger scene
The earlier figures came from `gl.info.render`, which reports the **last frame drawn**. That frame may or may not include the shadow pass. To separate them I added two test-only readers to the existing `__world` probe: `split()` renders one frame without and one with the shadow pass, and `casters()` lists the meshes that cast shadows.

| Frame | Desktop overview | Desktop, SmartPark selected | Phone (medium tier), overview | Phone, SmartPark selected |
|---|---|---|---|---|
| Scene only (what the camera sees) | 277 calls, 111k tris | 169 calls, 66k tris | 258 calls, 107k tris | 107 calls, 46k tris |
| Scene plus shadow pass | 501 calls, 206k tris | 399 calls, 162k tris | 482 calls, 202k tris | 337 calls, 142k tris |

- The scene itself is **inside the budget** (320 calls, 180k triangles on high, 110k on medium): 277 / 111k on desktop and 258 / 107k on the phone tier. The 337 was the phone's last frame after a selection, which included the shadow pass.
- The shadow pass is the real cost: 234 casting meshes, about 224 calls and 95k triangles, drawn from the light's view with no camera culling. It was already drawn only on frames where something moved, but while a camera flight was running the moving car or robots marked shadows dirty on every frame.
- The earlier 216 / 74.8k baseline and the 219 / 75.8k in the spec used the same last-frame reading, so they were also inexact; the scene-only figures above are the clean ones.

## What changed
- **Shadow redraws are limited to about 30 a second** (`ShadowUpdates` in `world-canvas.tsx`). A change that arrives too soon stays pending and one more frame is drawn, so the last move is never left out. Moving shadows (a car, a robot) update at 30 Hz, which is not visible; a settled screenshot of SmartPark shows the shadows in place (`docs/review-shots-p6/p7-smartpark-shadows.png`). On frames that moved the shadows this roughly halves the shadow work during flights and reactions.
- **Probe readers** `split()` and `casters()` (test and measurement only).
- **New tests** (`tests/landmarks.spec.ts`, 2): every one of the 20 stations can be selected in the 3D world (district first, then the station, as a visitor does) with no page error and the world still drawing; and the scene-only budget (320 calls, 180k triangles) plus a ceiling of 560 calls with shadows.

## Verification (M5, Chrome for Testing)
| Check | Result |
|---|---|
| Lint, typecheck, build | pass |
| Playwright suite | **152 of 152 passed** (4.0 min) |
| M5 | 60 fps; no frame over 33.3 ms in any segment; ready about 0.4 s |
| 4x CPU throttle | one frame at exactly 50 ms on the overview-to-Systems flight, none over; last load task 417 ms |
| Phone at 4x | no frame over 33.4 ms |

**What this does not show:** the M5 already ran at 60 fps before the throttle, so these runs cannot show a speed-up from it. Its benefit on slower GPUs is reasoned from the draw-call counts, not measured on a real phone or integrated GPU. I would not call the shadow pass "fixed", only halved in frequency during motion.

## Not done in this part
- Cutting the shadow pass itself (merging or dropping small casters): 47 of the 234 casters are under 0.2 units across and carry about 6k triangles, so removing them saves around a fifth of the calls. I left them in, since it changes the look and the measured gain would be unproven.
- The carried-over issues: the remaining Systems reactions (SmartPark barrier light, Private Local AI conduit sequence, Cycoil, Green Mobility, LifeOS and RupeeRise reactions); the Studio select camera and its name plate and plate leader lines; the two-chip panel header; the Algorithms island's small look; the 820 px search placeholder.
- Accessibility: the existing axe checks in the suite pass, but I added no new ones and did not re-run a manual keyboard or screen-reader pass.
- Safari, Firefox, real phones, tablets, integrated GPUs and screen readers remain unverified.
