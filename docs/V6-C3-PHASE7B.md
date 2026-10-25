# Stage C3 — Phase 7 report (part 2): carried-over issues and the Systems reactions

Sonnet 5.5 at High. Branch `stage-c-premium-spatial-world`. Local only; nothing pushed.

## Fixed
| Issue | Change |
|---|---|
| Studio select camera | The Studio view turns 16 degrees toward the west prow, so its oculus (the brand's spark) faces the visitor, with the courtyard still in view (`layout.ts`, `poseFor` "studio"). |
| Studio name plate over the roof | The plate's anchor is raised from 6.3 to 7.2, and the plate is now part of what the Studio framing must fit, so it is not cut off at the top of the stage. Screenshots: overview and Studio view. |
| Panel header | The four run-together chips are now one line of facts (`College project · Implemented academic system`), then a row of two chips for what the scene is (the evidence class in ink, then the scene badge), then the caveat as its own paragraph. The sr-only evidence note is kept. |
| Search placeholder at 820 px | Below 980 px the district counts become screen-reader-only and the search field gets at least 150 px. "Find a station" reads in full at 820 px. |

## The remaining Systems reactions
All use the approved spec (`V6-C3-ART-DIRECTION.md` 4.2) as the target. They play for the landmark in focus only, rest in their end state, and are reduced-motion safe (a reduced-motion visitor sees the end state at once). Step-by-step reveals are one merged mesh each (`scene/trail.ts`, `showTrail` over a draw range), so they add no draw calls beyond the single mesh.

| Station | Reaction now |
|---|---|
| SmartPark | The booth's barrier light is amber while the two cars ask for the one bay, then lime once the decision is made. |
| Private Local AI | A note card travels over the vault's plinth into the vault, the door wheel turns and the light goes coral to lime, then a trail lights from the door to the reading desk and the answer card lifts with a lime source tag. All of it stays on the island. |
| LifeOS | Five desk tiles light one by one, a cyan cable fills to a store box under the desk and its light comes on. |
| Cycoil | A drop runs down the pipe, a gate lamp goes amber to lime ("accept"), a counter plate ticks from 0 to 1 and the tank level rises. A whole number only; no currency or payment shown. |
| Green Mobility | Six seat lights fill along the shuttle as it pulls in; when it is full the booking light turns amber and a three-bar gauge appears (a shape only, no figure). |
| RupeeRise | The token is now a coin that spins as it moves along the board's choice path, lighting each square it passes (fictional money; still a briefing). |

### Where this falls short of the spec
- **Private Local AI:** the spec has the note travel from the LifeOS workstation along the island's conduit. Landmarks do not animate across each other, so the note travels within the vault landmark. The bridge is not shown dark.
- **SmartPark:** the first car does not "turn ink" when it takes the bay.
- **Cycoil:** "weighed" is the amber gate lamp plus the drop, not a scale with a weight.
- **Green Mobility:** the estimate is a bar shape, not a CO2 readout, so that no figure is invented.
- **Size:** the new details are small. They read in the district and station views, and the gate lamp, counter and seat lights are hard to see from the district view.

## Verification (M5, Chrome for Testing)
| Check | Result |
|---|---|
| Lint, typecheck, build | pass |
| Playwright suite | **154 of 154 passed** (4.1 min); 2 new tests: the panel header, and the 820 px search width |
| Page errors while selecting all 20 stations | none (the existing every-station test) |
| M5 | 60 fps; no frame over 33.3 ms |
| 4x CPU throttle | no frame over 50 ms (one at 49.9 ms); last load task 417 ms |
| Phone at 4x | no frame over 33.3 ms |

The hero test that read `.c-brief-badges` now reads `.c-brief-facts`, since the "College project" fact moved there.

## Not verified
- Safari, Firefox, real phones and tablets, integrated GPUs, screen readers.
- Tablet and phone panel layout with the new header (only desktop was reviewed by eye; the suite's tablet and phone sheet tests pass).
- The reaction details at phone size.

## Review shots
`docs/review-shots-p6/` (untracked): `p7-studio-oculus.png`, `p7-panel-header.png`, `p7-search-820.png`, and four reactions.

## Still open for Phase 7
- The accessibility pass (keyboard order, focus, reduced motion on the world, axe over the 3D stage).
- Shadow-pass cost on slow GPUs (see part 1).
- The Algorithms island reads small.
- Safari, Firefox, device checks.
