# Stage D — baseline and refinement audit

Branch `stage-d-premium-refinement`, created from the production commit `9582c26`. `main` and production are at `9582c26`, unchanged since the release. Rollback tag `rollback-pre-stage-c` (`70ad823`). Sonnet 5.5 Medium. Audit only: no visual change, nothing pushed. The scanner transition is not touched.

Baseline screenshots (local, untracked): `docs/review-shots-d/` at desktop 1440, tablet 820 and phone 390: overview, each district, a selected station, Studio. I read `V6-C3-ART-DIRECTION.md` and `V6-C3-HANDOVER.md` first. The Studio view in the phone and tablet set did not capture the Studio (the capture script's click missed); the Studio was reviewed from the Phase 7 shot instead.

## The ten most important issues
Defects are things that read wrongly or break a stated rule. Improvements are taste and ambition.

| # | Issue | Kind |
|---|---|---|
| 1 | **Labels sit on top of their landmarks** in district views: Mazera's, Penalty Shootout's, Student Burnout AI's and Resume Screener's plates cover the model they name. | Defect |
| 2 | **The phone overview crops the world**: Systems and Algorithms run off the left and right edges in portrait. | Defect |
| 3 | **The Studio plate crowds the Algorithms bridge and island** in the tablet overview. | Defect (minor) |
| 4 | **Intelligence is low contrast**: pale landmarks on pale pink ground; the SIGSMITH and Burnout blueprints almost vanish at district zoom. | Defect |
| 5 | **The Algorithms district view wastes the stage**: the island is small, the Studio is clipped at the left edge and the right half is empty. | Defect (framing) |
| 6 | **Flat, low-contrast atmosphere**: grey-beige haze, no sky gradient or sun cue, shadows are soft grey. It reads as a clean model, not a place. | Improvement |
| 7 | **One matte clay material family**: little glass, metal, water or emissive light to separate buildings from terrain. | Improvement |
| 8 | **Static at idle**: nothing moves unless selected. No drifting light, haze, birds or water; the world does not feel alive. | Improvement |
| 9 | **The camera only does click-flights**: no establishing move, no hover focus or parallax, no idle drift, so it is not yet "cinematic". | Improvement |
| 10 | **The UI chrome competes with the scene**: heavy-outlined white plates and district cards are as loud as the 3D, and the panel's visual language is separate from the world's. | Improvement |

## Performance and accessibility limits (measured or known)
- Scene: 277 calls and 111k triangles on high (budget 320 and 180k), 258 and 107k on the phone tier (medium budget 110k, so almost no headroom). The shadow pass adds about 224 calls and 95k triangles on frames that move; it is limited to about 30 redraws a second. Headroom on high is about 43 calls and 69k triangles.
- Load: long tasks to about 410 ms at 4x CPU, mostly shader compile. Performance is measured only on one M5; real phones, integrated GPUs, Safari and Firefox are unmeasured.
- No post-processing exists (by design). Anything cinematic must be done with cheap means: gradients, sprites, one-draw layers, light and material tuning.
- Accessibility: only the existing axe checks. No keyboard-order, focus or reduced-motion pass was done on the 3D stage; plaques are `aria-hidden` with the real buttons overlaid; no screen-reader testing; label contrast over the 3D scene is not measured. Any new motion needs a reduced-motion rule.

## Prioritized Stage D proposal
Impact is on the look and feel; complexity is build effort; risk is to frame rate, load or the existing tests.

| Pri | Item | Fixes | Impact | Complexity | Performance risk |
|---|---|---|---|---|---|
| 1 | Label placement: keep each plate off its landmark (side offset, leader line), fade plates during flights | 1, 3 | High | Low to medium | None |
| 2 | Framing: portrait overview that fits, and a tighter Algorithms and district framing with the Studio kept out of the edge | 2, 5 | Medium | Low | None; the clear-view tests already cover framings |
| 3 | Atmosphere: a sky and horizon gradient, warmer key and cooler shadow tones, graded haze layers, a soft light bloom from cheap sprites | 6 | High | Medium | Low (one backdrop layer, no post-processing) |
| 4 | Intelligence and Algorithms legibility: stronger value separation, richer ground tones, bolder blueprint lines, island scale in the overview | 4, 5 | Medium | Low to medium | None |
| 5 | Ambient life: slow drifting light and cloud shadows, haze motes, shimmering shoal contours, window glow; idle only, paused when the stage is hidden | 8 | High | Medium | Medium (keep it to one or two draws; must obey reduced motion) |
| 6 | Cinematic camera: an establishing move on first load, subtle hover focus and parallax, an idle drift, eased district transitions; scanner untouched | 9 | High | Medium to high | Low; the risk is interruption and motion comfort |
| 7 | Material depth: glass, metal and emissive accents on key landmarks, a few reflective surfaces | 7 | Medium to high | Medium | Low to medium (shader count) |
| 8 | Chrome: plates and the panel take the world's language (translucent, thinner outlines, matching type) | 10 | Medium | Low to medium | None |
| 9 | Headroom: drop the 47 smallest shadow casters, merge small meshes, fix the medium-tier budget before adding detail | enabler | Enabler | Medium | Reduces risk |
| 10 | The skipped accessibility pass (keyboard, focus, reduced motion, contrast, axe over the 3D stage) | limits | Required before claiming it | Medium | None |

Suggested order: 1, 2, 4, 9 first (defects and headroom), then 3, 7, 8 (look), then 5 and 6 (motion), with 10 run alongside and again at the end.

## Does Stage D need Opus 5.5 Extra?
**Not for implementation. Yes for one short, bounded art-direction brief.** Items 1, 2, 4, 8, 9 and 10 are engineering and tuning that Sonnet 5.5 High can do directly. Items 3, 5, 6 and 7 are taste-heavy: the atmosphere, light mood, motion language and what "cinematic" means for an engineering portfolio. Those are costly to redo, and Stage C showed that a written direction before building avoided rework. A single Opus 5.5 Extra session, producing about a ten-page spec for items 3, 5, 6 and 7 only (mood board in words and references, palette and light targets, motion rules with reduced-motion behaviour, budgets), would be worth it. Then Sonnet 5.5 High builds everything. If you prefer to skip Opus, Sonnet High can try items 3 and 6 from the descriptions above; expect more iteration on them. It needs your approval, per your rule on Opus.

## Not done
No code, design or visual changes; no push; no deployment; the stray Vercel project `portfolio-stage-ab` is untouched.
