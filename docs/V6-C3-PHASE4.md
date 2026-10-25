# Stage C3 — Phase 4 report: camera, sheets and reactions

Sonnet 5.5 at High.

## Done
- **Hitch investigation** (measured, not assumed):
  - The page reports 22 canvases: 1 is the 3D world and about 20 are small animated card canvases (`MiniAnim`) in the gallery below the map. They are not world resources.
  - At 4x CPU throttle the page has long tasks at load with or without the 3D world (professional mode: 78/96/132/91 ms; `?world=2d`: 75/173/102 ms). The world adds roughly one extra task of about 320–370 ms.
  - A CPU profile of that load shows the time is mostly native ("(program)" 565 ms, plus about 100 ms of module evaluation), with the world's own JS functions at tens of milliseconds each. So it is shader compile and first draw, not React or scene-building JS. I did not change it; the only lever would be fewer shader programs (10 now).
  - The Phase 0 camera-move spikes did not reproduce (see the Phase 2 report).
- **Arcing flights:** a camera move longer than 12 units now lifts over what lies between (`Rig.fly` takes a lift) instead of gliding straight. A mid-flight frame shows the Studio clear.
- **Clear-view rule:** `viewBlockedBy` casts the camera-to-subject line against every other landmark box and the Studio. `poseFor` for a station tries the straight-on framing, then turns of ±12/24/36°, then a steeper look. In today's layout **no station needs a turn** at the tested stages (desktop with panel, a 1000 px panel, tablet sheet at two sizes), so the fallback is a safeguard, not an active behaviour. A test proves the check can fire (a camera behind the Studio is blocked) and that every station is clear at all four stages.
- **Tablet sheet (640–999 px):** the panel is a sheet over the bottom 46% of the stage. The camera frames the subject above it (`Stage.insetBottom`). Actions come first in the sheet.
- **Phone sheet (<640 px):** the panel is a fixed bottom sheet, 44% of screen height at most, drawn from the page root, because a page wrapper above the stage is transformed and traps fixed children. The old scroll-to-card is removed. Escape and the close button dismiss it.
- **Studio:** selecting it pulses the visited plaques once in order (the hover brightening of the oculus and interior already existed). Reduced motion shows no pulse.
- **SmartPark reaction:** a second (amber) car follows the first and is handed the next free bay, as in the spec.

## Verification
- Lint, typecheck and build pass. Playwright: all pass (150 tests: 147 before, plus 3 new for the tablet sheet, the phone sheet and rapid-interruption settling).
- Performance (one M5 laptop): 60 fps with no frame over 33 ms in the 1440 run; at 4x two runs had no frame over 50 ms; phone-size at 4x had none over 33 ms. Scene cost is unchanged: 216 draw calls, 74.8k triangles. Load long tasks at 4x are the same as before.

## Not done / not verified
- Systems reactions still short of the spec: no amber barrier light on SmartPark; Private Local AI does not yet show the "note travels along the conduit and nothing crosses the bridge" sequence; Cycoil, Green Mobility, RupeeRise and LifeOS keep their existing reactions. The conduit exists as static geometry.
- Studio select does not move the camera to a courtyard view facing the oculus; it uses the existing Studio shot.
- Reduced motion verified by the existing tests and the new snap/animation rules only; no real-device or screen-reader check.
- The 320–370 ms native load task is explained, not reduced.
