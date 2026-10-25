# V6 stage C2: the spatial world (prototype checkpoint)

Branch `stage-c-premium-spatial-world`, from the Stage C tip `3c9bb0f` (`stage-c-spatial-map` and `stage-ab` are unchanged). Everything is local; nothing was pushed, merged or deployed. No Precision Scanner or transition file, no dependency and no lockfile changed (`git diff 3c9bb0f` on those paths is empty).

This is the review checkpoint the brief asks for after phases 1 to 3: the audit, the architecture, and one finished district (Systems) with the central Studio. Algorithms and Intelligence are white-card study models with their final island shapes, so the whole world can be judged; their thirteen landmarks are the next phase, after your review.

## 1. Audit of Stage C, as found

Verified on the running build at 1440 x 900, 1280 x 800, 1000 x 800 and 390 x 844 before any change (screenshots in the scratchpad, `shots-baseline/`).

**Art direction.** Every point in your list was confirmed: the three districts were the same diamond board in three colours; landmarks were drawn at one small icon scale (about 40 to 60 px), with labels larger than the buildings and some colliding (Last Mile's label sat on the ParkScan tower); the Studio was a small building squeezed between two boards with a "You are here" gate that did not lead anywhere; the background was flat paper with a dot grid; light was a fixed face shading with flat contact ellipses, so nothing had height or depth.

**Technical.** The map was inline SVG with real buttons over it, a CSS-scale "camera" per district, and session-only stores for selection, view and the open exhibit. Three facts shaped the design:
- `shift-intro.ts` (protected) animates the transforms of `.c-island`, `.c-pin`, `.c-progress` and `.c-brief` when Creative arrives, and the tests use the same names. The new world keeps those elements and never positions a `.c-pin` with a transform (its wrapper is moved instead), so the arrival animation and the world never fight.
- The exhibit scenes already use React Three Fiber, with a warm-up that compiles shaders off the main thread and a rule not to build a canvas during a mode transition. The world follows the same rules.
- three.js was already downloaded on the Creative home after load in Stage C (the scene preloads). The world therefore adds about 88 KB of JavaScript (about 27 KB gzipped), not a 3D library.

**Baseline tests, and what the earlier failures were.** The Stage C report recorded 128 and 134 of 139 passing, with failures that passed alone. I ran the unchanged Stage C build three times today:

| Browser | Run | Result |
|---|---|---|
| Installed Google Chrome 156 | 1 | 133 passed, 6 failed |
| Playwright's Chrome for Testing (1248) | 1 | 139 passed |
| Playwright's Chrome for Testing (1248) | 2 | 139 passed |

Every Chrome 156 failure was the browser process quitting in the middle of a test with exit code 0 and no crash signal (the test then reports "Target page, context or browser has been closed"). The same build passes completely in Chrome for Testing twice. The flakes come from the installed Chrome on this Mac, not from the site; tests are better run with `CHROMIUM_PATH` pointing at Chrome for Testing (commands below).

**A correction.** The Stage C report said the 3D scenes "ran in Chrome's software renderer". That was wrong: headless Chrome on this Mac renders WebGL on the Apple M5 GPU through ANGLE/Metal (checked for both Chrome builds today).

## 2. Architecture decision: a hybrid

WebGL draws the architecture, light and atmosphere; HTML carries every control, label and description; the Stage C SVG map stays as the fallback.

- **Why WebGL here.** The brief's acceptance criteria (perspective, occlusion, shadows, real camera movement, layered depth) cannot be met by scaling an SVG: CSS 3D transforms give flat cards in perspective, with no occlusion between buildings and no light. React Three Fiber and three.js were already dependencies and already loaded on this page.
- **Why HTML on top.** Keyboard, focus, screen readers, text quality, the existing tests and the arrival animation all need real elements. Each station is a `<button>` whose hit area is its landmark's box on screen, so pointing at a building selects it.
- **Rejected:** labels or controls drawn inside WebGL (unreadable to assistive technology, hard to test); a free orbit camera (it disorients, fights the programmed moves, and puts information behind dragging); a full redesign of the page (out of scope).
- **Fallback.** Without WebGL, if the renderer is a software one (measured at about 2 frames a second), if the context is lost, or with `?world=2d`, the page shows the Stage C map with every behaviour it had. Its styles moved to `map-2d.css`, scoped to that engine.

### How it fits together

| Piece | Owner | Notes |
|---|---|---|
| `world/camera.ts`, `layout.ts` | plain numbers, no three.js | Projection, camera framings and every landmark footprint. The canvas and the HTML both use them, so labels sit exactly on the buildings. |
| `world/rig.ts` | the only camera owner | Critically damped springs that bend when interrupted (no jumps), and one timed move for entering an exhibit. Reduced motion jumps instead. While the canvas is up, the canvas steps the rig inside its own frame, so the camera and labels update in the same frame. |
| `world/world-stage.tsx` | HTML layer | Markers, plaques (laid out so they do not cover each other, nearest and most important first), district plates, the Studio button, the docked panel. While the camera moves only transforms change; hit areas and labels are written when it settles. |
| `world/world-canvas.tsx`, `world/scene/*` | WebGL layer | Built in five idle steps (not one long task); renders only on demand; shaders compiled before the first frame; never built during a mode transition; shadows redrawn only when something casting one moves; pixel ratio steps down if moves run slowly. |
| `studio/studio-map.tsx` | page state | Unchanged stores (selection, district, view, exhibit address, challenges, exploration). The camera shot follows from them, so returning from a project page or an exhibit restores the view without a separate camera state. |

**Camera shots:** overview (the whole world, establishing glide on first load); district (each with its own slight turn, about 7 degrees); station (closer, framed beside the docked panel); the Studio; approach (a 0.62 s fly-in before an exhibit opens). Back from an exhibit eases out from the approach to the station. Escape steps back out one level at a time. Phones use a Studio-centred hub view instead of shrinking the whole world.

**Tiers.** High (pixel ratio up to 2, 2048 shadows, reflections), medium (1.5, 1024 shadows; integrated or mobile GPUs, small touch screens, 4 or fewer cores), low (1, no shadow map; `?world=low`, very low-end devices). `?world=low|medium|high|2d` overrides for testing.

## 3. Art direction

**The look:** an architect's maquette in a gallery. Matte card and plaster, painted metal, a little brass and glass, warm light inside the buildings, soft daylight from the upper left (the same direction the 2D map used: lit left faces, shaded right faces), a cool fill and a rim from behind. Colour is graded once in a shared material set: each district's brand accent becomes a pastel ground with a darker band down its sides, and the saturated accents (lime, coral, cobalt, violet) are kept for small signals: exhibit pads, the Studio's spark and stripe, bridge edges.

**Background layers:**
1. Base: warm paper.
2. Technical texture: a survey grid drawn in a shader on a sheet far below the islands, so it stays crisp in perspective.
3. Atmosphere: a soft colour field under each island, fog from warm paper near the viewer to a cool haze far away, and a light vignette.
4. Distant environment: a few small platforms in the overview's empty corners, and each island's shadow thrown far across the sheet by the low sun, so the height reads.
5. The world.
6. The interface.

The CSS behind the canvas paints the same paper, grid and colour fields, so the moment the canvas fades in is quiet.

**Composition:** the Studio is the centre and the tallest thing, on its own round island with a lime ring; slender arched bridges (edged in each district's colour) lead to Systems upper left, Algorithms upper right and Intelligence in front, the same arrangement as the 2D map.
- **Systems, "the workshop campus":** three terraces built like layers of model board, climbing away from the viewer so nothing hides anything else. It has a boulevard with lamps and trees, a lower street with the shuttle lane, stairs, railings, panel seams and the plaza where the Studio's bridge lands.
- **Algorithms, "the graph":** square plinths at different heights joined by bridges (nodes and edges), on a grid.
- **Intelligence, "the ring":** a round campus with a raised promenade and a central test field.

**The Studio:** a glazed ground floor lit warm inside, a white upper floor turned against it with a finned ribbon window and the brand's lime stripe, an observation balcony, a roof deck with a lit pavilion and a white pergola, and the brand's lime spark on a mast. Selecting it opens a panel with:
- the welcome, from `profile.focus`;
- the link to "The person behind the experiments";
- "On the bench", the same three builds as Creative About;
- the experiment passport: stations opened and challenges tried in this tab, as 20 stamps;
- buttons to each district.

No new text about you was written.

### Systems landmarks and their reactions

Each reaction plays only for the landmark in focus (hover, keyboard focus or selection), is short, and stops drawing when it ends. Under reduced motion each one jumps to its end state with no movement. The exhibits themselves are unchanged and remain the authority.

| Station | Model | Reaction |
|---|---|---|
| SmartPark (exhibit) | Three-deck garage with zig-zag ramps, coral parapets, parked cars, a barrier and a P sign | Deck and roof lamps come on, the barrier lifts, and a lime car climbs the ramps to a free bay on the roof. |
| AURA (exhibit) | Four zone pods round a companion orb, a typed bridge to a native-services block | The orb glows lime, its ring turns, and the bridge lights segment by segment towards the services. |
| Private Local AI (exhibit) | A plaster vault drum with a brass door and a shelf of notes | The door wheel turns, the light goes from coral to lime, and a cited note lifts. |
| LifeOS | An open workstation with a kanban wall | The screens and lamp come on, and a task card moves to the last column. |
| Burnout API (blueprint) | Server racks drawn in cobalt lines on a white sheet | The drawing darkens, and one request travels to a rack and back. |
| Cycoil | A collection kiosk with an awning, a drum and a tank | The screen wakes, a drop runs down the pipe, and the tank's level rises a little. Nothing about money or payment is shown. |
| Green Mobility | A shuttle stop with a green roof, a bike rack and a charger | The shuttle leaves its charging bay for the stop, and backs in again afterwards. |
| RupeeRise (team project, briefing) | A board of branching tiles, rising bars and a coin | A token takes one branch, and the coin turns once. |

Every landmark also lifts a little and gets a lime frame on the ground while it is in focus. A board filter that excludes a station turns its model to plain white card.

**Labels:** small tier markers at each landmark's foot in the overview (filled lime: exhibit; white: briefing; dashed cobalt: blueprint; shape as well as colour). Names appear on hover and focus, and for every station of the district you are in. Selection docks the full panel (name, district, tier, status, purpose, claim class and caveat, demonstration type, Enter exhibit, project page, source). Tablets show the panel under the world; phones list each district's stations as a swipeable strip under the world, as the 2D map did.

## 4. Performance (measured)

Headless Chrome for Testing on this Mac (Apple M5, 16 GB; WebGL on the GPU through ANGLE/Metal), static build, a scripted tour of nine moves (district changes, hover, selection, Escape, the Studio). "Slow CPU" uses Chrome's 4x CPU throttling; it slows JavaScript and layout, not the GPU.

| Profile | Tier / pixel ratio | World ready after load | Moves measured | Frame rate (mean) | Frames over 33 ms | Frames over 50 ms | Longest frame |
|---|---|---|---|---|---|---|---|
| Apple M5 GPU, DPR 2, high tier | high / 2 | 665 ms | 8 | 59.9 fps | 0 of 963 | 0 | 33.4 ms |
| same, CPU 4x slower | high / 2 | 2481 ms | 8 | 58.7 fps | 4 of 970 | 2 | 116.6 ms |
| phone 390x844, DPR 3, CPU 4x slower | medium / 1.5 | 2378 ms | 2 | 58.1 fps | 3 of 293 | 2 | 99.9 ms |

The rare slow frames are the first camera move after load in each profile; every later move was at or under 33 ms on the M5. The numbers come from one run per profile, so treat them as indicative, not as a guarantee.

- **JavaScript.** About 88 KB more than Stage C on the Creative home (the world's own code), loaded after the page; three.js and React Three Fiber were already downloaded there.
- **Memory.** About 30 to 35 MB of JS heap on the page with the world built; one WebGL canvas for the world, plus at most one for an open exhibit (the world stops drawing while an exhibit is open).
- **Software rendering** (no GPU) drew about 2 frames a second with a 3 s main-thread stall, so it now gets the 2D map. An explicit `?world=` setting still forces the 3D world for testing.
- **Not measured:** real phones and tablets, integrated Intel or AMD GPUs, Safari and Firefox, battery. Throttling is a stand-in for a slow CPU, not for a slow GPU.

## 5. Visual verification

Screenshots of the final build, at 1440 x 900 unless stated, are in the scratchpad (`shots-final/`):
- the overview at 1440 x 900 and 1280 x 800;
- each of the three districts;
- the Studio and its panel;
- SmartPark selected, with its car on the roof;
- hovering the vault;
- the fly-in, the open exhibit and the return;
- 1000 x 800 and 390 x 844;
- `?world=2d`.

What I checked in them:
- The Studio is the focal point at every size.
- The three islands have different silhouettes.
- Plates and plaques do not cover landmarks.
- The docked panel never covers the selected station.
- After closing an exhibit, keyboard focus returns to its station and outlines the building.

Remaining crowding is listed in section 7.

## 6. Accessibility

Automated (axe, WCAG 2.1 AA tags) on the map with a station selected and on an open exhibit: no violations. Axe also caught one bug during this work: station buttons had lost their names while their plaques were hidden, which is now fixed.

Keyboard: one tab stop per district; arrow keys move to the station nearest in that direction on screen; Home and End work; Escape steps out one level; focus returns to the station after an exhibit, a preview or Back. Reduced motion: no establishing glide, no camera easing, no fly-in, and reactions jump to their end states. The 2D map is fully usable without WebGL.

Not verified: a screen reader pass, real touch devices, Safari and Firefox.

## 7. Known limitations of this checkpoint

- Algorithms and Intelligence are study models. Their stations, previews and exhibits all work, but their landmarks are massing only.
- Off-screen stations are hidden while you are zoomed into another district. You reach them with the district buttons, "All districts", Escape, List view or the board. Tab does not move the camera to them.
- One frame of about 50 to 100 ms on the first camera move after load, in every profile. Later moves are smooth.
- The world is built after the page has painted, so it fades in about 0.7 s (M5) to 2.5 s (4x slower CPU) after load. The HTML map and List view work before that.
- On tablet-sized stages the overview still has empty space above and below. A wide world in a squarish frame needs its own composition, a design question for the full rollout.
- The custom cursor's ring turns hollow over landmarks, but it still covers part of what it points at.
- The scanner transition was not changed. With the world on the Creative page the transition tests pass, but the transition's look over the world has not been reviewed visually.

## 8. Tests

| Check | Result |
|---|---|
| `npm run lint`, `npm run typecheck`, `npm run build:static` | Pass |
| Full Playwright suite (Chrome for Testing, 142 tests: the 139 of Stage C plus 3 new) | **142 passed**, run once on the build just before the last two cosmetic tweaks |
| Map, hero, registry and modes specs (67 tests) on the final build | **67 passed** |
| Baseline for comparison (Stage C, 139 tests, Chrome for Testing) | 139 passed twice; installed Chrome 156 once: 133 passed, 6 failed (browser quit mid-test) |

I did not rerun the full suite after the final two cosmetic tweaks (hiding plate blurbs under 1200 px, moving the distant platforms); the 67 map-related tests were rerun and pass. The full suite has not been run in the installed Chrome 156, whose flakes are described above. Run it with:

```bash
cd /Users/sid/Claude/portfolio-stage-ab && CHROMIUM_PATH="$HOME/Library/Caches/ms-playwright/chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing" TEST_BASE_URL=http://localhost:3001 npx playwright test
```

New tests:
- the camera shot follows district focus, selection and Escape;
- entering an exhibit from the world and coming back with Back;
- the Studio panel;
- the 2D map without WebGL and with `?world=2d`.

Two Stage C tests changed:
- The Studio is now a button that opens its panel, and the panel holds the About link.
- To pick a station in another district after leaving an exhibit, the test now starts from "All districts", which is how the zoomed world works.

## 9. For your review

1. The overall direction: the maquette look, colour grading and light.
2. The composition, and the three silhouettes (terraced campus, graph, ring).
3. The Systems landmarks and their reactions, and whether any is unclear or claims too much.
4. The Studio's architecture and what its panel holds.
5. Camera speed and angles, the fly-in, and Escape stepping out.
6. The phone approach: a Studio hub view above the station strips.

After your approval: model the thirteen Algorithms and Intelligence landmarks in the same language (phase 4), integrate and test the exhibits (phase 5), polish (phase 6) and run full verification (phase 7).
