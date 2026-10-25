# Stage C3 — Art direction and architecture specification (Phase 1)

Status: **proposal, awaiting approval.** Nothing in this document is implemented yet.
Written on Opus 5.5 (effort xhigh) against branch `stage-c-premium-spatial-world` at `c7ea94c`.

This spec refines the existing R3F world. The architecture stays as it is: one camera owner (`rig.ts`), an HTML overlay for every control and word, on-demand rendering, staged build, and the 2D/List fallbacks. What changes is how the world looks and how it responds, plus the panel, the toolbar and the responsive layouts.

Baseline it builds on (Phase 0, measured on one M5 laptop):
- 142/142 tests pass.
- Build totals: 219 draw calls, 75.8k triangles, 8 shader programs.
- 60 fps unthrottled.
- At 4x CPU throttle: single 83–117 ms frames on some camera moves, and load long tasks of 350 and 562 ms.

---

## 1. Decisions that need your approval

Each row has a recommendation; the alternatives are described in the section named.

| # | Decision | Recommended | Alternatives considered | § |
|---|---|---|---|---|
| D1 | Background concept | **Chart table**: a survey/bathymetric chart under the islands, lit by a pool of light | Calm "mineral sea"; the current paper sheet, improved | 5 |
| D2 | Stage value structure | **Display case**: a mid-value graded stage, with the islands the brightest objects in it | Keep a near-white stage and darken the islands instead | 5, 6 |
| D3 | Studio identity symbol | **Oculus**: the spark is the tracery of a round window in the roof prow, lit from inside | A lantern tower with the spark on top; a spark relief on a façade wall | 3 |
| D4 | Island silhouettes | **Three profiles**: Systems steps *up* (terraces), Algorithms is a *graph* of separate plates, Intelligence steps *down* into a bowl | Keep three slabs and vary only their outlines | 2 |
| D5 | When the new Algorithms/Intelligence *terrain* is built | **Phase 2** (terrain only, with the current white-card landmarks), so the overview can be judged as a whole | Leave it to Phase 6 with the landmarks | 2, 16 |
| D6 | Lighting mood | **Late-afternoon gallery light**: warm, lower key, longer soft shadows | North-light studio (soft, high, close to the current look) | 7 |
| D7 | Post-processing | **None.** Grading is done with materials, tone mapping, the background shader and CSS | three.js `EffectComposer` with SSAO and/or bloom (no new dependency, but costly) | 7, 13 |
| D8 | Project panel | **Docked, progressive** card on desktop; an **in-stage bottom sheet** on tablet; a **bottom sheet** on phones | A callout pinned to the landmark in space; a bottom sheet at every size | 11 |

Flagged discrepancy: the brief lists PathAble among the Systems examples. The project manifest (`stations.ts`, which takes districts from the registry) puts **PathAble in Algorithms**. Per the brief, the manifest is the source of truth, so PathAble's landmark is Phase 6 work in Algorithms.

---

## 2. Spatial composition

### 2.1 Overview hierarchy

The overview must answer five questions without reading:
- where the Studio is;
- that there are three districts;
- how to choose one;
- how to reach a project;
- how to come back.

1. **Studio: vertical anchor, smallest footprint.**
   - The podium is raised from y 0.62 to **y 1.05**.
   - The building's roof prow becomes **the highest point in the world**, at least 0.4 units above the SmartPark garage roof.
   - Today the Studio is about the same height as the districts, so nothing tells the eye where to start.
2. **Three districts.** They keep their current positions: Systems upper left, Algorithms upper right, Intelligence in front. This keeps the 2D map, the keyboard order and the tests consistent. Each gets a different vertical profile (D4), so they differ in silhouette and not only in colour.
3. **Bridges as routes.**
   - Each bridge leaves the Studio through a **gate** (a thin portal frame in the district accent) and descends gently to its district, because the Studio now stands higher.
   - Their decks stay pale. The district accent appears only on the deck edge and the gate.
4. **Landmarks.** On the overview they read as massing only: silhouettes, roofs and a few lit windows. Detail is for the district view.
5. **Secondary details** (lamps, trees, cars) are kept sparse. None of them animate at idle.
6. **Atmosphere** extends beyond the islands (section 5). The empty space between islands is kept on purpose, with no props in it.

### 2.2 Island profiles (D4)

| District | Profile | Silhouette from the overview | Why it fits |
|---|---|---|---|
| Systems (8) | **Terraced campus that climbs away from the viewer.** Three terraces, already built, are refined: cut lines, strata, a pier where the bridge lands. | A stepped, rectilinear block, the largest mass | Infrastructure is built up in layers: roads, services, buildings on top |
| Algorithms (5) | **Graph plateau.** Five separate node plates of different sizes at heights from 0.2 to 0.9, joined by six thin straight beam bridges (the edges). One edge meets the Studio bridge. | A small constellation of plates and lines, airy and precise | Routing, search and graphs are literally nodes and edges; each project stands on its own node |
| Intelligence (7) | **Observatory bowl.** A round island whose top steps *down* in three rings to a sunken central court (the "inference chamber"), with stations on the rings and a ring walkway. | A concave ring, with the opening visible at the overview elevation | Research looks inward at a subject; a bowl reads as a lab or observatory, not a campus |

For a fair comparison, the alternative (three slabs with different outlines) is what the world has now. In the Phase 0 screenshots it reads as three similar trays.

### 2.3 What gets built when

- **Phase 2:**
  - the Studio rebuild;
  - Systems refinement;
  - the background, lighting and materials;
  - the *terrain* of Algorithms and Intelligence in their new profiles (D5), with the existing white-card study landmarks placed on them.
- **Phase 6, after the visual approval:** the 12 detailed landmarks for the Algorithms and Intelligence stations (13 if a 20th landmark is counted for the Studio).

---

## 3. Studio redesign

**Intent:** a compact research and engineering pavilion, recognisable from the overview, where the projects start and connect.

### 3.1 Architecture

The building uses STUDIO.scale = 1.3. "Front" means facing the overview camera.

- **Plan.**
  - A **U-shaped pavilion** around a small courtyard that opens to the front.
  - The back wing is two storeys and about 3.4 × 1.0. The side wings are one storey, about 1.0 × 1.8.
  - The courtyard is about 1.4 × 1.4 and holds the exhibition wall.
- **Roof (the silhouette).**
  - One folded mono-pitch plane over the back wing. It rises from about 1.2 on the west to about 2.6 on the east, then cantilevers forward over the courtyard's east corner as a **prow**.
  - From the overview, this asymmetric wedge is what you recognise.
- **Oculus (D3).**
  - The prow's front end wall carries a round window about 0.9 across. Its tracery is the brand spark: eight lime spokes inside a graphite ring.
  - The space behind the window is a warm emissive interior, so the spark reads as **a lit window** and not an ornament on a pole.
  - The current spark mast, pergola, roof pavilion and gyroscope are removed. They are decoration with no meaning.
- **Façades.**
  - The side wings have **vertical fins** at about 0.18 spacing on their outer façades, in warm white card.
  - The back wing's ground floor is glazed onto the courtyard and shows **lit workspaces**: simple desk and screen silhouettes in the warm interior material.
- **Exhibition wall.**
  - The courtyard's back wall carries **20 small plaques in three groups (8 / 5 / 7)**, one per station, grouped by district.
  - A plaque is plain card until its station has been visited in this tab. It then takes its district accent at low intensity.
  - This uses the `visited` list from the existing `useExploration()` store (the same one behind "Explored N of 20 stations in this tab"), so no new state or storage is needed. It makes the Studio show what the visitor has explored: the projects literally hang where they connect.
- **Gates.** The three bridge landings get thin portal frames in the district accent. They are the only district colour on the Studio.
- **Podium.**
  - Round, with the cliff built in layered strata like the districts.
  - The plaza is paved with three paths to the gates, plus one to the entrance.
  - The lime ring stays and is the Studio's only lime besides the spark.

### 3.2 Studio interaction

| State | Response |
|---|---|
| Hover / keyboard focus | The courtyard entrance light rises a little; the oculus interior brightens about 25%; the plate shows "The Studio · Welcome, About and your passport · Open". The camera doesn't move. |
| Select | The camera glides to a ¾ courtyard view (el ≈ 30°, turned to face the oculus). Interiors light up, and the visited plaques pulse once, in order. The Studio panel opens (welcome, About, bench, passport, district buttons). |
| Reduced motion | Same end state with no pulse; the camera snaps. |

### 3.3 Alternatives to D3
- **Lantern tower**, with the spark on a glass lantern on the roof. It is very visible, but it repeats today's problem (the symbol sits *on* the building, not *in* it), and a tall thin element competes with the prow.
- **Façade relief**, with the spark cut into the exhibition wall. It is well integrated, but it is invisible from the overview at this scale, so the Studio loses its mark.

---

## 4. Systems district: refinement plan

Systems is the flagship. It is evaluated and refined, not rebuilt. The eight landmarks keep their current identities, which already match the project facts.

### 4.1 Layout and composition

- **Clusters by meaning.**
  - **Upper terrace, the data row:** SmartPark garage (the tallest, anchoring the west corner), the Private Local AI vault, and the Burnout API blueprint footprint next to the vault.
  - **Middle terrace, the personal apps:** AURA's studio pods and the LifeOS workstation, joined by the boulevard.
  - **Front street, the civic and operations row:** the Green Mobility shuttle stop on the transit loop, the Cycoil kiosk by the service yard, and the RupeeRise board near the bridge plaza.
- **Breathing room.**
  - Each landmark keeps a clear pad at least 0.6 units wider than its footprint.
  - Props (trees, lamps, parked cars) are reduced by about 30%. None stand between the overview camera and a landmark's front face.
- **Height variety.** The garage is about 4 storeys; the vault and AURA pods are mid-height; the rest are low. This gives one focal object and two secondary ones.
- **Sightlines.** The boulevard is aligned so that from the district view it leads from the bridge plaza to the garage, the focal object.
- **Transit loop.**
  - The shuttle lane becomes a **continuous loop** round the island's front and east edge, through the bridge plaza: the "mobility network" motif.
  - It is static at idle. A shuttle runs on it only while Systems is focused or Green Mobility is selected.
- **Service conduits.**
  - Thin graphite trenches with short cyan dashes run between the workstation (LifeOS), the vault (Private Local AI) and AURA's bridge block.
  - They stay **on the island and never cross a bridge**. That is the point of the private-AI reaction below.
- **Underside.** The island's sides and taper are built as **strata** in three darker sandstone bands with a dark cut line under the top skin. This gives the depth and figure-ground separation the overview currently lacks.

### 4.2 Landmark reactions

Each reaction plays once on selection, takes 1.5–3.5 s, rests in its end state, and is labelled as it is now (Illustrative / Simplified) in the panel.

| Station (tier) | Landmark | Reaction on select: what it teaches | Real vs illustrative |
|---|---|---|---|
| SmartPark (exhibit) | Multi-level garage | **Two cars reach the barrier together** for **one free bay**, lit amber. The first is granted the bay (it turns ink, occupied); the second is sent to the next free bay. Message: the database decides who gets the bay. | Illustrative; the concurrency logic is shown in the exhibit's simplified simulation |
| AURA (exhibit) | Studio of zones around a companion | The zone pods light one by one round the central companion. A signal from a web zone reaches the native block **only through the typed bridge gateway**, which lights. Message: the web UI never touches native services directly. | Illustrative; the portfolio does not run the Mac app |
| Private Local AI (exhibit) | Document vault | A note card travels from the workstation along the conduit into the vault. An answer card comes back with a **source tag** linking to that note. The bridge stays dark the whole time: nothing leaves the island. | Illustrative; no inference runs here (the keyword-weight experiment is in the exhibit) |
| LifeOS (briefing) | Workstation | Five desk tiles (tasks, habits, money, health, notes) light and connect to **one local store** under the desk. | Illustrative |
| Cycoil (briefing) | Used-oil collection kiosk | A container is weighed, a **rule gate** shows accept, and a **ledger counter ticks by a whole number**. No currency symbol, no payment. | Illustrative; worded with the existing caution |
| Green Mobility (briefing) | Shuttle stop and bike rack | The shuttle arrives and its seat lights fill to **capacity**. The booking light turns amber, "full", and a small CO₂ estimate readout appears. | Illustrative |
| RupeeRise (briefing, team) | Choice board with a coin | One coin moves along a choice path on the board (fictional money). Nothing about the team or its members is shown. | Illustrative; stays a briefing |
| Burnout API (blueprint) | Blueprint footprint | The dashed footprint extrudes briefly as a **wireframe ghost**, then settles back: a design here, link-out only. | Nothing runs; that is the message |

Reactions for the Algorithms and Intelligence stations are specified in Phase 6. They will follow the same table shape.

---

## 5. Background: five layers (D1, D2)

The whole background is the **existing sheet plane (one draw call) with a rewritten fragment shader**, the fog, and the CSS layers behind and over the canvas. It adds **no draw calls**. "Reactive" changes are uniform updates on frames that are already being drawn.

### Layer 1: foundational atmosphere
- A **pool of light** on the chart, centred under the key light's aim point. Inside it is warm chalk stone (`--w-chart-pool` `#ebe5d9`); it falls off radially through `#d9d6cd` to cool slate at the edges (`--w-chart-edge` `#b4bbbd`).
- The fog colour equals the edge colour, so the far chart melts into it. The CSS backdrop behind the canvas uses the same edge colour at the top, so the stage never shows a flat beige band.
- The CSS vignette over the stage gets slightly cooler and stronger (`rgb(38 44 52 / 0.14)` at the corners).
- The islands' tops are the brightest surfaces in the frame. The chart is one to two value steps darker. That is the "display case" (D2).

### Layer 2: environmental plane, the chart
- The uniform 1 m / 5 m graph-paper grid is **removed**.
- **Bathymetric contours** follow each island's *actual outline*: distance to the rounded rectangle, the disc, or the union of the Algorithms node plates, not a circle.
  - Spacing widens with distance (0.6, 0.9, 1.4, 2.1…).
  - Each band is about 1.5% darker, so depth reads as "deeper water".
  - Line alpha is 4–7% ink, with contours fading out beyond about 1.6 island radii.
- **Survey crosses** (small "+" marks) every 10 units, only inside the pool, at 6% ink.
- **Construction lines**: the three bridge axes extended across the chart as faint dashed lines (5% ink) that fade out at the pool edge. This ties the chart to the architecture.

### Layer 3: mid-distance context
- The four little islands with trees and boxes are **removed**. In the Phase 0 screenshots they read as stray objects in the corners.
- They are replaced by:
  - **Shoals:** two or three contour clusters drawn in the shader with no geometry. They read as unbuilt sites further off.
  - **Two low plinths:** flat, chart-coloured foundations far behind the back islands, with no props, fog-faded.
  - **Survey routes:** one or two faint dashed routes on the chart linking the shoals to the extended bridge axes, suggesting the world continues.
- Negative space is kept deliberately. Nothing goes between the islands.

### Layer 4: atmospheric integration
- **Island shadows** on the chart stay where the low sun throws them, but are softer and cooler (`#56606c` multiply, 18–22%), so the height reads.
- **Contact grounding** for every building: a shared, tiny radial-gradient texture on a quad under each landmark footprint, merged into the landmark's model (multiply, 25%). It is cheap ambient occlusion where walls meet ground.
- **Aerial perspective:** fog near and far are retuned so the farthest island loses about 10% contrast in the overview. Labels sit in HTML and are never fogged.

### Layer 5: reactive atmosphere
| Event | Change | Cost |
|---|---|---|
| District focus | The pool centre eases toward that district (over the camera move's own frames); its contour band ink rises from 5% to 8%; its gate and bridge edge brighten | Uniforms only |
| Landmark selected | The district's contact grounding deepens slightly around the selected pad; no full-screen colour change | Uniform |
| Exhibit entry | The pool contracts and the CSS vignette deepens over the 0.25 s crossfade into the exhibit | Uniform + CSS |
| Studio | The pool centres on the Studio and the oculus interior brightens | Uniform |

Reduced motion: these changes still happen (they are state, not decoration), but they jump to their end values.

### Alternatives to D1
- **Mineral sea.** A matte water plane with soft depth tint and very slow caustics. It is the most literal reading of "archipelago", but it brings continuous motion (against "calm at rest"), reflections or extra passes, and a resort look rather than an engineering one.
- **Improved paper sheet.** The current concept with a warmer field and lighter grid. It is the cheapest, but it stays "objects on beige graph paper", which the brief rejects.

The **chart table** keeps the archipelago metaphor (contours like a nautical chart) and the engineering one (survey and drafting) in a single static layer that costs nothing per frame.

---

## 6. Colour and materials

### 6.1 Tokens

The base is chalk, ivory, warm grey, graphite and slate. The accents are restrained.

| Role | Token / value | Use |
|---|---|---|
| Chart pool / mid / edge | `#ebe5d9` / `#d9d6cd` / `#b4bbbd` | Background field (5.1) |
| Fog = backdrop top | `#b4bbbd` | Distance |
| Contour ink | `#2b3039` at 4–8% | Chart lines |
| Systems ground: top / pave / cliff / strata | `#e9dccb` / `#dccab4` / `#b98f74` / `#a57b62`, `#8d6a55` | Warm sandstone, a mineral version of the brand coral |
| Algorithms ground | `#e3e7e9` / `#d4dadf` / `#9fb0bf` / `#8ea1b3`, `#7a8ea3` | Pale limestone and mineral blue |
| Intelligence ground | `#e7e2ea` / `#d9d2e0` / `#a99fbc` / `#978cb0`, `#83789f` | Pale lilac stone |
| Studio ground | `#efece4` / `#e3dfd3` / `#bcbfa9` / `#a8ad92` | Chalk and sage stone |
| District accents (brand, small areas only) | coral `#ee8466`, cobalt `#2f4bff`, violet `#7a4ee6` | Gates, deck edges, plaques, plate squares |
| Lime (Studio and selection only) | `#c8f13b` | The spark, the podium ring, the selection frame |
| Signal: data | cyan `#5fd3e6` | Conduits and data flow only |
| Signal: operational | amber `#f2b544` | Free bay, "full", attention |
| Vegetation | sage `#9fae86`, moss `#b3bf96`, pine `#6f8467` | Mixed per tree, all desaturated |

District identity never rests on colour alone: profile (D4), architectural language (2.2) and landmarks carry it. Colour confirms it.

### 6.2 Material families

The current palette is nearly all matte card at roughness 0.88–0.96. It becomes eight families:

| Family | Roughness / metalness / env | Notes |
|---|---|---|
| 1. Terrain and foundation | 0.95 / 0 / 0.3 | The darkest values on the island (cliffs, strata); tops one step lighter |
| 2. Architecture | 0.82–0.88 / 0 / 0.5 | Warm plaster and card; the brightest values in the frame |
| 3. Paths and bridges | 0.9 / 0 / 0.4 | Pavers a step darker than tops; asphalt `#454a52` stays |
| 4. Glass and displays | 0.06–0.12 / 0.05 / 1.4 | Cool tint; dark glass on upper floors; clear glass over lit interiors |
| 5. Mechanical | graphite 0.55 / 0.3, steel 0.38 / 0.6, brass 0.35 / 0.7 | Brass only on the Studio and the vault |
| 6. Vegetation | 1.0 / 0 / 0.2 | Three hues; slight random scale and rotation (in the merge, so free per frame) |
| 7. Signals | emissive, small areas only | Lime, cyan, amber; never as edge glow on whole objects |
| 8. Selection | lime frame plus a 0.12 lift (existing) and grounding contrast | The only "glow" the world uses |

The environment map stays RoomEnvironment (generated, nothing downloaded). `scene.environmentIntensity` stays low; the per-family values above do the work.

---

## 7. Lighting and grading (D6, D7)

| Light | Now | Proposed |
|---|---|---|
| Key (directional, casts shadows) | `#ffead0`, 3.3, elevation about 53° | `#ffe4c4`, 3.6, elevation **about 40°**, same azimuth. Longer, softer shadows that model the terraces |
| Hemisphere | sky `#eef3f8` / ground `#e4d4bf`, 0.44 | sky `#e6edf3` / ground `#b9a993`, **0.3**. Less flat fill, a warmer bounce |
| Fill (cool, from the right) | `#d9e3ff`, 0.28 | `#cfdcf0`, 0.32. Shaded faces turn slightly cool: a split-tone grade without post |
| Rim (from behind) | `#fff0dc`, 0.72 | `#fff0dc`, 0.6. Keeps silhouettes off the chart |
| Shadows | PCF, 2048 (high) / 1024 (medium), radius 3 | Same type and sizes. The shadow camera is refit to the islands' bounds. Bias is retuned for the lower sun |
| Tone mapping | Neutral, exposure 1.0 | **Keep Neutral**, exposure about 0.95 |

- **Why Neutral and not AgX or ACES:** Neutral keeps base colours true, which matters for the brand lime and the district accents. AgX greys pastel scenes, and ACES shifts yellows and oranges.
- **Why "washed out" today:** it comes from value structure, not from the lights. The islands and the background have the same luminance (`#f0dccb` on `#f3eee4`). D2 and the material table fix that; the light changes add modelling.
- **D7, no post-processing.** SSAO or bloom through `EffectComposer` would add a full-screen pass or more to every frame. Bloom also blurs the HTML-aligned edges and fights label legibility. Depth of field hurts readability for the same reason. Contact grounding (5.4) and the stronger key and rim give most of SSAO's benefit at no per-frame cost. If a later review still wants it, a single measured SSAO pass on the high tier only could be trialled. It is not in this plan.
- **D6 alternative, north light:** soft high light with shorter shadows. It is calmer and closer to now, but it keeps the flatness the brief objects to.

---

## 8. Cinematic camera

The rig stays the single owner. Moves are springs (`glide`) with an optional timed path (`fly`). These are design targets, tuned in Phase 4 by measurement, not fixed delays.

| State | Framing target | el / fov | Perceived move | Interaction while moving | Reduced motion |
|---|---|---|---|---|---|
| Overview | The whole world, fitted to the stage (excluding the far plinths) | 40–52° by aspect / 26° | — | All | — |
| District focus | The district's points with a 0.4 margin, turned ±7° | 42–46° / 26° | Settles in **≤ 1.1 s** | Clicks retarget the move | Snap |
| Station focus | The landmark box ×1.6, offset beside the panel | 36–40° / 26° | Settles in **≤ 0.7 s** | Clicks retarget | Snap |
| Studio | The courtyard ¾ view facing the oculus | about 30° / 26° | **≤ 0.9 s** | Clicks retarget | Snap |
| Exhibit entry | A dolly in to 0.6× distance, el −4°, fov +6, then a crossfade | — | **0.75 s** fly, 0.25 s fade | Escape or Back cancels and returns | Fade only |
| Return | The previous shot (exhibit → station → district → overview) | — | **≤ 0.8 s** | Clicks retarget | Snap |

Movement rules:
1. **No flying through geometry.** District-to-district and overview-to-station moves whose target travels more than 12 units use `fly` with an **arc**: distance rises by `0.18 × travel × sin(πt)`, so the camera lifts over the Studio instead of skimming it. This needs a small extension to `Rig.fly`, adding a per-key offset function.
2. **No hidden subject.** A pure function in `layout.ts` casts the camera-to-subject ray against the other landmarks' boxes. If anything blocks it within 85% of the distance, the shot turns ±12° in steps (up to ±36°), then raises el by 4°. This is covered by a unit test over every station shot at the three reference stage sizes.
3. **Interruption.** A new goal during a `fly` drops the tween and continues as a spring from the current pose and velocity (the existing behaviour). The exhibit's 1.5 s safety timeout stays. There are no stuck states: every state has a reversible parent and Escape always steps one level up.
4. **Resize and viewport changes:** the current shot is re-fitted and snapped, as today. The same holds for mobile toolbar or URL-bar height changes, debounced 120 ms.
5. **No dramatic spins.** Azimuth changes are ±7° per district and at most ±36° from the occlusion rule. There are no rolls.

**The first-move hitch is not hidden by longer moves.** Phase 4 measures it first (section 13.3).

---

## 9. Interaction vocabulary and priorities

| Input | World response | Overlay response |
|---|---|---|
| Hover a station | A 0.06 lift; the label chip turns ink; the cursor ring goes hollow (existing) | A one-line purpose appears under the chip after 150 ms (desktop only) |
| Keyboard focus | The same as hover, with no camera move | A 2 px lime focus ring on the chip; visible focus is mandatory |
| Select | Camera to station; the landmark reaction (4.2); grounding contrast | The panel opens in its compact state |
| Enter exhibit | The fly and fade (8) | The exhibit stage (existing, one active scene) |
| Escape / Back / ← button | One level up | Focus returns to the station's button |
| District chip | Camera to district; reactive atmosphere | Plates update |

Priority if performance drops, removed in this order:
1. decorative ambient motion (there is none at idle by design);
2. contextual environmental motion (the shuttle, conduit dashes);
3. landmark reactions shortened to their end state.

Selection clarity and navigation feedback are never removed.

---

## 10. Labels and typography

Creative mode already uses **three families**, and that stays. No new fonts.

| Family | Use | Sizes |
|---|---|---|
| Instrument Serif (`--font-display`) | Names only: station titles, district plate titles, the Studio title | Panel title 28/1.05 (24 on tablet), plates 22, Studio 26 |
| Familjen Grotesk (`--font-body`) | Everything readable: purpose lines, body, buttons, chips | Body 15/1.45, buttons 15 semibold, chips 13 semibold |
| JetBrains Mono (`--font-mono-set`) | Metadata only: eyebrows ("STATION 04 · SYSTEMS"), counts, tier tags | 11/1, uppercase, tracking 0.08em; never for sentences |

Rules:
- No text under 11 px.
- All text sits on paper chips or cards (`#fffdf7`, ink border), never directly on the scene, so contrast is ≥ 4.5:1 regardless of what is behind it.
- The italic serif purpose line in the panel moves to Familjen. Serif italic stays only for the one-line exhibit name.
- "Exhibit: The Concurrency Garage" moves out of mono.

Label hierarchy:
- **Overview:** three district plates and the Studio plate, plus station *dots* (filled lime for exhibit, hollow for briefing, dashed for blueprint, as now). There are no station names, so the overview stays calm.
- **Plates:** each gets a thin leader line to its island edge, like a museum wall label. Plates never overlap island geometry. On stages narrower than 1200 px they show only the name and count (existing rule).
- **District:** all station name chips, using the existing collision-free layout.
- **Selected:** the chip turns ink with its tier tag; neighbours' chips drop to 70% opacity.

---

## 11. Project panel (D8)

### Content: progressive disclosure

**Compact state** (on selection, about 200–240 px tall on desktop):
- the eyebrow (mono);
- the title (serif);
- the purpose line (Familjen, one line where possible);
- at most **two chips**: the tier, and the strongest evidence class;
- **one primary action** (Enter exhibit, or Read briefing);
- one row of secondary links (Project page ↗ · Source ↗);
- a "More about this project" disclosure.

**Expanded state** (in place, internal scroll, max 70% of the stage height), with sections in this order:
1. Problem;
2. What I built;
3. Engineering decisions;
4. Technologies;
5. Demonstration (real, simplified or illustrative, using the existing wording);
6. Evidence and limits.

Sections draw **only on fields the registry already has**. An absent field omits its section; it is never filled in. Team-project limits and the Cycoil caution are kept word for word.

### Placement

| Size | Placement | Camera |
|---|---|---|
| ≥ 1000 px | Docked top-right inside the stage, **width 328 px** (from 372), compact by default | The station is framed in the left 60% (the existing `insetRight`) |
| 640–999 px | **An in-stage bottom sheet.** Its peek height is 38% of the stage and it expands to 85%. There is a visible handle *and* a close button, and the sheet is not draggable-only | The station is framed in the upper 60%; expanding re-frames it |
| < 640 px | **Bottom sheet** over the page, full width, compact first; it expands to full height with internal scroll. Close and Back are supported, and reopening restores the same station and scroll | The world stays on the hub framing. "Show on map" frames the station |

Alternatives to D8:
- **A callout pinned to the landmark.** It feels spatial, but it moves with the camera, covers neighbouring landmarks, needs collision logic against the label layout, and is hard to keep accessible.
- **A bottom sheet everywhere.** It is consistent, but it wastes desktop width and pushes the subject up into the toolbar on wide screens.

---

## 12. Toolbar and responsive layouts

### Stage height (the tablet whitespace)
- The world's aspect is about 1.62. The stage height follows the *stage width*, using container units on the map wrapper: `height: clamp(520px, min(61.7cqi, 100svh − 150px), 840px)` on desktop.
- Below 1000 px, where the aspect is under 1.2: `min(78cqi, 100svh − 230px)`, with the overview's steeper elevation (the existing aspect rule, extended to 52°) so a squarish stage is filled by looking down more.
- The fit ignores the far plinths, which no longer sit in the corners.

### Toolbar
| Width | Layout |
|---|---|
| ≥ 1200 px | One row: the district segmented control (All 20 · Systems 8 · Algorithms 5 · Intelligence 7), search field, Map/List segmented control, "Next unexplored" |
| 768–1199 px | **One row**, no wrapping: the district segmented control; search collapses to an icon button that expands over the row; Map/List as icons with text labels for screen readers; "Next" as icon plus a short word |
| < 768 px | Two rows. Row 1 is the district segmented control (horizontally scrollable, current one centred). Row 2 is search, Map/List and Next |

Standard patterns only: a segmented control is a radio group; search is an input with a clear button. No new custom widgets.

### Phones
The existing **hub framing plus district strips** stays. It is functionally complete and battery-friendly.
- The phone world renders at most dpr 1.5, with the medium tier, no reactions except selection, and the shuttle off.
- List mode stays one tap away.

---

## 13. Performance: budget, trade-offs and the hitch

### 13.1 Budget for the full world (all 20 landmarks)

These are targets on this M5 laptop, not guarantees for other hardware.

| Metric | Now (Systems only detailed) | Budget |
|---|---|---|
| Draw calls | 219 | **≤ 320**, ≤ 12 per landmark (merged geometry per material) |
| Triangles | 75.8k | **≤ 180k** on high, ≤ 110k on medium (simpler trees and fewer props) |
| Shader programs | 8 | **≤ 12** |
| Textures | 5 | ≤ 10 (the letter textures, the grounding gradient) |
| Background | 1 call | 1 call (shader only) |
| Ready (M5 / 4x) | 816 ms / 2.3 s | **≤ 900 ms / ≤ 2.5 s** |
| Camera moves, M5 | 0 frames > 33 ms | 0 frames > 33 ms |
| Camera moves, 4x | single 83–117 ms frames | **≤ 1 frame > 50 ms per move, no long task > 100 ms after ready** |

### 13.2 Trade-offs taken
- No post-processing (D7). The background lives in the shader, and grounding uses one shared texture.
- Reactions only on the focused landmark. Ambient motion is off at idle, so the world costs nothing at rest (on-demand rendering).
- The shadow map is redrawn only when a caster moves (existing). Moving reactions are short, because each one forces shadow redraws for its duration. That cost is measured in Phase 4.
- Algorithms' graph plates add bridges. They are merged into one model per material, so the extra cost is triangles, not calls.

### 13.3 Hitch investigation protocol (Phase 4, measure before fixing)

Hypotheses, **none measured yet**:
1. The first React commit of the overlay when a move settles (label layout, 20 buttons).
2. A full shadow-map pass on every frame of a moving reaction.
3. Late shader compilation for objects first seen in a new framing.
4. Garbage collection.
5. Texture upload of the letter textures.

Method:
- Chrome trace at 4x CPU with User Timing marks around the rig settle, the overlay `place()`, the shadow update and `gl.render`.
- Compare against `?world=low` (no shadows).
- Compare `gl.info.programs` before and after the first move.
- Watch the heap for GC drops.

Fixes come only after a cause is named and the trace attached. Phase 0 also found **22 `<canvas>` elements** on the page, which are not yet accounted for; this is checked in the same pass.

### 13.4 Tiers
| Brief's name | Tier | What changes |
|---|---|---|
| Full | high | Everything above; dpr up to 2; 2048 shadows |
| Balanced | medium | dpr up to 1.5; 1024 shadows; fewer props; shorter reactions |
| Minimal | low, or the 2D map | No shadow map (grounding textures remain); no reactions beyond selection; the 2D map on software renderers, with no WebGL, or `?world=2d` |

Content is identical in every tier.

---

## 14. Requests challenged

- **Bloom, depth of field, SSR, volumetrics:** not planned (D7). Their cost is per frame, and depth of field works against legible HTML labels.
- **Sound:** not in this stage. There is nothing it would explain that the light and the text don't.
- **GSAP or Anime.js in the world:** not used. The rig owns the camera and the reactions are tiny frame functions; a second timeline system on the same properties would break the single-owner rule. Motion stays for the panel and DOM transitions only. Anime.js has no justified use here.
- **"Every landmark teaches":** blueprint stations get a deliberately minimal reaction (the wireframe ghost), because there is nothing to run. Inventing behaviour would break the honesty rules.
- **Cyan and blue:** used only for data signals, never as decoration or edge glow.
- **Full 3D on phones:** not attempted. The hub plus strips is the intentional phone layout.

---

## 15. Preserved and out of scope

**Preserved:**
- the 20 stations and their districts;
- the 8 exhibits, 6 challenges and 2 experiments;
- Map/List, deep links `/?exhibit=<slug>`, keyboard control, Escape/Back, and the WebGL-off and 2D paths;
- evidence badges and trust wording, Creative About, source links;
- team-project limits (Last Mile and RupeeRise as briefings), the Cycoil caution, Penalty Shootout described as its own implementation;
- the class names the protected `shift-intro.ts` and the tests rely on.

**Out of scope:**
- the scanner transition;
- Professional mode;
- dependencies, lockfiles and configuration.

---

## 16. Work breakdown and acceptance checks

### Phase 2: Studio, Systems, world look (Sonnet 5.5 High)
- **Studio rebuild (§3):** the prow, the oculus spark, fins, the courtyard exhibition wall wired to `visited`, gates, the raised podium. Remove the mast, pergola and gyroscope.
- **Systems refinement (§4.1):** clusters, fewer props, the transit loop, conduits, strata.
- **New terrain for Algorithms and Intelligence (§2.2, D5),** with the current study landmarks on it.
- **Background shader rewrite (§5)** and removal of the far islands.
- **Palette and material families (§6); lights and exposure (§7).**
- **Acceptance:**
  - a side-by-side screenshot set against Phase 0;
  - draw calls ≤ 260 at this point;
  - typecheck, lint and build pass;
  - the map and studio tests pass.

### Phase 3: UI, panel, responsive (Sonnet 5.5 Medium)
- The panel's compact and expanded states (§11).
- Typography rules (§10), plate leader lines.
- The toolbar at three widths (§12) and the stage height formula.
- The tablet bottom sheet and the phone bottom sheet.
- **Acceptance:**
  - no toolbar wrap at 768–1199;
  - the panel never covers the selected landmark at 1440×900, 1280×800 or 1000×800;
  - axe shows no new violations;
  - keyboard paths unchanged.

### Phase 4: camera and reactions (Sonnet 5.5 High)
- The arc flights, the occlusion rule and its unit test, and resize handling (§8).
- The Systems reactions (§4.2) and reactive atmosphere uniforms (§5.5).
- The hitch protocol (§13.3), then the fixes it justifies.
- **Acceptance:**
  - every station shot passes the occlusion test;
  - the 4x budget in §13.1 is met, or the gap is reported with traces;
  - reduced-motion paths are verified.

### Phase 5: review checkpoint (Sonnet 5.5 Medium), then a stop
The review set: overview, Studio, Systems, a selected landmark, an exhibit, tablet, phone, a camera recording, a baseline comparison, and a performance table.

---

## 17. Open questions for you

1. Approve D1–D8 as recommended, or name the ones to change.
2. **The Studio plaques show visited stations only for this tab** (`useExploration()` is per-tab state). Is that acceptable, or should the wall show something static, such as only the district groups?
3. **The stage turns mid-value slate at its edges (D2),** inside the light Creative page. Is that the "display case" you want, or should the edges stay lighter (with the islands darkened instead)?
