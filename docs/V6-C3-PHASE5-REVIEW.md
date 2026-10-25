# Stage C3 — Phase 5 review preview

Build: branch `stage-c-premium-spatial-world` at `7c1901d`, static output served locally. Screenshots and the recording are in `docs/review-shots-c3/` (untracked, about 23 MB, kept local).

## What to look at
| File | Shows |
|---|---|
| `01-overview-1440x900.png` | The whole world |
| `12-studio-focused.png`, `11-studio-visited-wall-pulse.png` | The Studio after opening five exhibits: oculus, courtyard wall, gates; the wall plaques lit |
| `02-systems-focused.png`, `03-selected-smartpark-panel.png` | Systems, and the compact panel |
| `04-algorithms-graph.png`, `05-intelligence-bowl.png` | The new terrain, with white-card placeholder landmarks |
| `06-exhibit-open.png` | An exhibit (unchanged) |
| `07-tablet-1000x800.png`, `08-tablet-820-sheet.png` | Tablet, and the in-stage sheet |
| `09-phone-390.png`, `10-phone-390-sheet.png` | Phone, and the bottom sheet |
| `camera-tour-phase5.webm` | Overview, Systems, SmartPark, back, Algorithms, back, Studio, back |

Phase 0 baselines for comparison are `docs/review-shots/1…8` (the Stage C2 prototype).

## Against the acceptance list (my own reading; yours decides)
- **Not plain beige graph paper:** met. A survey chart and a slate stage.
- **Studio identity and integrated symbol:** met in the build; still a first-pass model.
- **Systems pathways, depth, material variety:** met moderately: strata, loop, conduit. Cluster composition was refined only lightly.
- **Islands distinct but connected:** met (terraces, graph, bowl, bridges and gates).
- **Lighting hierarchy:** improved; shadow detail on the white-card placeholders is weaker.
- **Labels, panels, tablet and phone:** panel, tablet toolbar and sheets done; **the phone sheet covers most of the stage** when a station is selected.
- **Landmark reactions:** Systems reactions partly done (see issues).

## Numbers (one M5 laptop, Chrome for Testing; not a guarantee for other hardware)
| | Phase 0 (C2 prototype) | Now |
|---|---|---|
| Tests | 142 pass | 150 pass |
| Draw calls / triangles / programs | 219 / 75.8k / 8 | 216 / 74.8k / 10 |
| Frames, 1440 run | 0 over 33 ms | 0 over 33 ms |
| Frames at 4x CPU throttle | spikes up to 117 ms in one run (**not reproduced** in later runs of either build) | none over 50 ms in 2 runs |
| Ready at 4x | 2.3 s in one run; 1.18–1.21 s in interleaved runs | 1.16 s |
| Load long tasks at 4x | about 70, 165, 95, 320–350 ms | same |

No performance improvement or regression is claimed.

## Open issues
1. **Phone sheet covers the stage.** The 3D view is mostly hidden when a station is selected on a phone. Needs a decision: shorter sheet, or scroll the stage into view first.
2. **Remaining Systems reactions** (not cheap, so listed): SmartPark amber barrier light; Private Local AI conduit sequence showing nothing crosses the bridge; refreshed Cycoil, Green Mobility, LifeOS and RupeeRise reactions. The conduit is static geometry only.
3. **Studio select** does not yet move the camera to a courtyard view facing the oculus.
4. **Studio name plate** overlaps the roof in the overview.
5. **Algorithms** reads smaller than before, with spare space in its district view.
6. **Plate leader lines** and a ≤2-chip panel header are not done.
7. **Load-time native task** of about 320–370 ms at 4x throttle is explained (shader compile and first draw) but not reduced.
8. **Unverified:** Safari, Firefox, real phones and tablets, integrated GPUs, screen readers, the scanner transition over the new world.
9. **Placeholders:** 12 of 20 landmarks are white-card massings until Phase 6.

## Decision needed
Approve the art direction as it stands, or list refinements. The 13 remaining landmarks (the 12 white-card stations and, if you want one, a detailed Studio set piece) are not started and will not start without your approval.
