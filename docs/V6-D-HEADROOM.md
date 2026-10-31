# Stage D: headroom and accessibility pass

Measured on the static build with Chrome for Testing on an Apple M5 (real GPU, `?world=medium` or `high`), before (862a448) and after.

## What changed
- `kit.tsx`: a box with a rounded edge under 0.02 units stays a plain box (12 triangles, not hundreds). The edge is under a pixel at the closest framing. The Mazera wall mesh alone fell from 15,300 to about 1,000 triangles.
- `world-canvas.tsx`: casters smaller than 5 shadow-map texels (about 0.23 units on medium, 0.12 on high) stop casting, checked once per mesh as landmarks build in steps. 237 casters became 187 on medium.
- `landmark.tsx`: each landmark group carries its slug as its name. The `__world.casters(true)` probe uses it to say which landmark owns a mesh (measurement only).
- `tests/landmarks.spec.ts`: the budget test now holds the medium tier to its real budget (110k triangles, was 180k) and the shadow-inclusive frame to 520 calls (was 560).

## Numbers (medium tier, desktop view)
| | before | after |
|---|---|---|
| Scene triangles | 111,204 | 89,892 |
| Scene draw calls | 292 | 292 |
| Scene plus shadow pass, triangles | 206,660 | 158,936 |
| Scene plus shadow pass, draw calls | 519 | 478 |
| Shadow casters | 237 | 187 |

Frame pacing over four district switches and three station selects: 60 fps at the median and 95th percentile, no frame over 33.4 ms without throttling. With a 4x CPU throttle there is one slow frame (50 to 67 ms) at the first district switch. The unmodified 862a448 build shows the same frame, so it is not new. Load long tasks are 110 ms or less.

## Accessibility (checked in the 3D world, desktop)
- axe (WCAG 2 A and AA, 2.1 AA) on the stage: no violations in the overview, each district, and with a station selected.
- Keyboard: one tab stop per district into the pins, Enter selects, Escape deselects and focus stays on the pin. The focus ring is a 3px outline.
- Reduced motion: labels appear within 700 ms of a district switch and no infinite CSS animations run.

## Not checked
Safari, Firefox, real phones, integrated GPUs, screen readers, and the 3D stage with browser zoom or forced colours.
