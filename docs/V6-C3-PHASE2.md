# Stage C3 — Phase 2 report: Studio, Systems and the world's look

Branch `stage-c-premium-spatial-world`. Implements the approved decisions D1–D8 of `V6-C3-ART-DIRECTION.md` for the Studio, Systems, the background, the materials and the lighting. Panel, toolbar and tablet/phone UI changes are Phase 3; camera arcs, occlusion and reactions are Phase 4; the 12 detailed Algorithms/Intelligence landmarks are Phase 6.

## What changed

| Area | Change |
|---|---|
| Background (D1, D2) | The paper sheet's shader is rewritten as a **chart table**: a pool of warm light fading to cool slate; contour lines that follow each island's real outline (rounded boxes, discs, the Algorithms plates) and widen with distance; survey crosses inside the pool; the three bridge axes run on as dashed construction lines; three far shoals drawn as contours with no geometry. The graph-paper grid and the four corner islands are gone. Still **one draw call**. The stage is now mid-value slate at its edges, with the islands the brightest surfaces in it. |
| Lighting (D6) | Key light lowered to 40° (azimuth unchanged), warmer and stronger; hemisphere fill reduced; cool fill and rim retuned; exposure 0.95. Tone mapping stays Neutral. |
| Grounding | One shared radial-gradient texture on one merged mesh puts a soft contact shadow under all 20 landmark footprints (one extra draw call), in place of a post-processing pass (D7). |
| Palette | District grounds are mineral stone (sandstone, limestone and mineral blue, lilac stone) with darker cliff strata; added `roof`, `cyan`, `amber`; vegetation desaturated. |
| Studio (D3) | Rebuilt: the podium is raised to y 1.05 and is the world's anchor; a U-shaped pavilion round a courtyard; a two-storey back wing with lit workspaces behind glass; an **exhibition wall of 20 plaques** (8 / 5 / 7, one instanced mesh, lit in the district colour for stations visited in this tab, read from the existing exploration store); a low finned east wing; a tall **west prow whose front wall carries the oculus**, the brand's spark as a lit round window; a gate in each district's colour where its bridge leaves. The roof mast, pergola, roof pavilion and gyroscope are removed. |
| Systems | Three strata bands with dark cut lines under the island; the shuttle street continues as a **loop** up the east side (with a ramp) to the bridge plaza; a service conduit with cyan dashes along the upper terrace front; about 30% fewer trees. The eight landmarks and their placements are unchanged. |
| Algorithms (D4, D5) | A **graph**: five separate floating plates at different heights joined by beams, plus a landing pier for the Studio's bridge. The existing white-card study landmarks stand on it. |
| Intelligence (D4, D5) | A **bowl**: a low rim, the terrace the stations stand on, and a sunken court. The existing study landmarks stand on it. |

Files: `layout.ts` (Studio constants, graph plates, bowl, `CHART_SHAPES`), `scene/ground.tsx` (rewritten), `scene/studio.tsx` (rewritten), `scene/massing.tsx`, `scene/systems.tsx`, `scene/palette.ts`, `world-canvas.tsx`, `world-stage.tsx` (passes `visited`), `world.css`. No dependency, lockfile or scanner file is touched.

## Deviations from the approved spec

- **The prow is on the west**, not the east as drafted. The viewer looks from the front-right, so a tall west prow keeps the courtyard and the exhibition wall in view.
- **The two far plinths were dropped.** In the first render they read as stray discs at the stage top. The shoals carry the "world continues" idea with no geometry.
- **Build steps are 4, not 5**, because the far props are gone.

## Verification (one M5 laptop, Chrome for Testing)

| Check | Result |
|---|---|
| Lint, typecheck, static build | pass |
| Playwright suite | **142 of 142 passed** (3.3 min) |
| Scene size | 216 draw calls (was 219), 74.8k triangles (was 75.8k), 10 shader programs (was 8), 6 textures (was 5) |
| Frames, M5 | 60 fps; no frame over 33 ms in any camera segment |
| Frames, 4x CPU throttle | no frame over 50 ms in the single run; one 33 ms frame |
| Frames, phone 390 at 4x | no frame over 33 ms |
| Load, 4x throttle | ready at about 1.16–1.2 s; four load-time long tasks, the last about 320–350 ms (see below) |

### A correction to Phase 0

Phase 0 recorded 83–117 ms frames on camera moves at 4x throttle, and a 2.3 s ready time. Four back-to-back runs (two of the Phase 0 build, two of this one, interleaved) did **not reproduce those spikes in either build**: ready times were 1.16–1.21 s for both, and no move produced a frame over 50 ms. The Phase 0 figures were most likely noise from a machine that was busy at the time. This phase therefore makes **no claim** of a performance improvement or regression: the two builds measure the same within run-to-run noise.

What did reproduce in every run, in both builds, is the **load-time long-task pattern at 4x**: tasks of about 70, 165, 95 and 320–350 ms before the world is ready. That is the real cost to investigate in Phase 4's hitch protocol, along with the 22 canvases the page reports (still unexplained).

## Not verified

- Safari, Firefox, real phones and tablets, integrated GPUs, screen readers.
- How the scanner transition looks over the new world (its tests pass).
- Plaque colouring was checked once by hand: one station opened, and one plaque turned coral. It has no automated test yet.
- The Studio hover and select treatments (entrance light, courtyard camera, plaque pulse) are Phase 4 work and are not implemented here.

## Known issues for Phase 3 and 4

- The Studio's name plate overlaps the roof in the overview.
- The Algorithms island reads smaller than before, because its plates are separate and compact. Its framing in the district view leaves some empty space.
- The district plates and the selected-project panel are unchanged (Phase 3).
