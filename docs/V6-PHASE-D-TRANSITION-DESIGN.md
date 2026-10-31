# Phase D: Precision Scanner, Particle Assembly and Intelligent Loading

Design and implementation specification. **Status: design only, for owner review.** Nothing in this
document is implemented yet. Every number marked *measured* was taken on 31 Oct 2026 from the
production static build of `05623ef` (headless Chrome for Testing on an Apple M5, 60 Hz).
Every other number is a target or a proposal.

Branch for this work: `phase-d-precision-scanner`, cut from `05623ef`
(`stage-d-premium-refinement`). Production `main` is `9582c26`; the rollback tag
`rollback-pre-stage-c` points at `70ad823`.

Concept images are in `docs/phase-d-concepts/`. They are **design concepts, not screenshots of
working code.**

---

## 0. The idea in one paragraph

Professional Mode is a precise engineering publication; Creative Mode is an explorable engineering
universe. The scanner is the instrument that moves between them. Going to Creative, the scanner
**reads** the publication, **lifts** its structure off as fragments, carries them **through** a
dimensional aperture and **builds** the island world from them: every fragment lands on something
real (an island contour, one of the 21 stations, a district plate). Coming back, the scanner
**collects** the world, **aligns** the fragments into the rows and columns of the page grid and
**typesets** the publication from them. Where real content is still being prepared (in practice,
the 3D world and the 3D scenes), the scanner leaves its construction lines in place as a
content-shaped skeleton, and resolves them into the live interface the moment it is ready.

---

## 1. Audit of the current transition

### 1.1 Architecture (as built, `05623ef`)

| Part | File | What it does |
| --- | --- | --- |
| Controller | `src/lib/world-shift.ts` | `worldShift()`: cancels any run, chooses scanner / portal / ring / none, runs the cue on the live page, then `document.startViewTransition(update)` with `flushSync(apply)` inside. Names on-screen cards and the header for morphs, keeps the section and focus, clears everything on `finished`. |
| Shared state | `src/lib/transition/state.ts` | `transition` object; two driving numbers `cue` and `progress`; `PHASES` (aim 0–0.2, scan 0.2–0.7, settle 0.7–1); `slit()`, `passProgress()`; readiness of the `frame` and `particles` layers. `CUE_SECONDS` 0.14, `SCANNER_SECONDS` 1.8. |
| Timeline | `src/lib/transition/scanner.ts` | GSAP: a cue tween and one master timeline that moves `progress` linearly; `paintScanner()` writes `--sc-*` CSS variables every frame; per-element morph timings injected as a `<style>`; `gsap.ticker.lagSmoothing(0)`. |
| Layout reader | `src/lib/transition/layout.ts` | Reads bordered blocks and text boxes of the page at the click and after the new page renders (1.5–3.4 ms, per TRANSITION.md). |
| SVG frame | `src/components/scanner/scanner-frame.tsx` | Anime.js: reticle, two half-ring aperture, iris, core, chevrons, scanner lines, corners; two paused timelines GSAP seeks. |
| Particles | `src/components/scanner/scanner-canvas.tsx`, `particle-layout.ts` | R3F canvas, `frameloop="always"` during a run, DPR 1–1.5; three instanced shapes plus outlines; 120 / 96 / 64 particles; a full-screen band shader (grid to dots, colour fields). Loads on intent or after idle, never during a run. |
| Layer | `src/components/scanner/scanner-layer.tsx` | Arms on intent; warms Creative fonts; preloads the hero scene from Creative; lite mode for low-power devices. |
| Snapshots | `src/app/world-shift.css` | Clip, scale and filter of `::view-transition-old/new(root)`; morph timings for `ws-morph`; portal and ring styles. |
| Arrivals | `src/components/shift-intro.ts` | Motion: the new page's blocks arrive as the scanner passes; Anime.js: drawn strokes. |
| Portal ride | `src/components/portal/*` | The earlier 3D portal, behind `?transition=portal`. |

Ownership is already disciplined: GSAP owns time; Anime.js owns strokes (seeked); R3F owns
particles; CSS owns snapshots; Motion owns arrivals. **Phase D keeps this model** and extends it.

### 1.2 What a visitor sees today (frames captured from the production build)

Frames at 250, 600, 950, 1300, 1700 and 2600 ms after the click, 1440 × 900. `docs/phase-d-concepts/00-current-*.png`.

**Professional → Creative**

- 250–600 ms: a large thin aperture forms over the Professional page; small coloured markers dot the page.
- 950 ms: the slit opens and the Creative page is already **complete** inside it.
- 1300–1700 ms: the Creative page is fully shown, but **the map stage is an empty grey box**, with small particles scattered across it.
- ~2400–2600 ms: the island world **pops in** after the transition has ended.

**Creative → Professional**

- The closing brackets and the locking aperture read well and already tell a "reconstruction" story.
- The particles are small, numerous and evenly scattered, so they read as confetti rather than structure.

### 1.3 Visual problems (observed in those frames)

1. **The payoff is missing.** The world (islands, districts, stations) never takes part in the
   transition: the 3D canvas is mounted only after the run, by design (see 2.1), so the run reveals
   an empty stage and the world appears afterwards without ceremony.
2. **Particles have no legible destinations.** They are small (a few pixels), many and spread over
   the whole page, so they read as a shower, not as structure being carried.
3. **The aperture is flat.** One SVG plane; nothing moves in depth, so there is no sense of passing
   *through* anything.
4. **Creative arrives fully formed.** The slit reveals a finished page; nothing is assembled.
5. **Loading states are text in a box.** Exhibits show "Loading the 3D maze…" / "Checking for 3D
   support…" on a grid tile (`.s3-loading`); the world shows "Building the studio…". They do not
   resemble the content that is coming.

---

## 2. Lag: actual causes and potential causes

### 2.1 Actual (measured)

Method: `long-animation-frame` and `longtask` observers plus a rAF gap recorder, from pointer-down
to the moment `data-scanner`/`data-shift` leave `<html>` ("rest"), then until the destination's
real content is attached, plus 900 ms. Script attribution comes from LoAF.

| Case | Click → rest | Frames during run (median / p95 / p99 / max) | Frames > 25 ms |
| --- | --- | --- | --- |
| Desktop 1440 × 900, warm, to Creative (2 runs) | 2032–2113 ms | 16.7 / 16.8 / 33–50 / 67–117 ms | 2 |
| Desktop warm, to Professional (2 runs) | 2038–2050 ms | 16.7 / 16.7–16.8 / 50 / 67–83 ms | 2–3 |
| Desktop cold (1.2 s after load, no hover), to Creative | 2106 ms | 16.7 / 16.8 / 67 / 117 ms | 3 |
| Phone 390 × 844 (3 runs to Creative) | 2082–2097 ms | 16.7 / 16.8 / – / 100–733 ms | 1–3 |
| Desktop, 4× CPU throttle, to Creative | 2533 ms | 16.7 / **66.7** / 433 / 433 ms | **23** |
| Desktop, 4× CPU throttle, to Professional | 2341 ms | 16.7 / **83.4** / 317 / 317 ms | **22** |

Attributed long frames (desktop, unthrottled):

| # | When | Cost | Attribution | Cause |
| --- | --- | --- | --- | --- |
| A | ~150–170 ms after the click, both directions | LoAF 64–120 ms; script 41–88 ms | `ViewTransitionCallback` in the app chunk | **Capture render.** `flushSync(apply)` renders the whole destination mode inside the view-transition callback, then `measureLayout()` and card naming. This produces the one 67–117 ms frame per run. |
| B | ~320–350 ms after the click, to Professional | LoAF 59–65 ms; script 51–54 ms | `FrameRequestCallback` in the three.js chunk | **Hero scene's first frame** (shaders compiled with `compileAsync`, then the first render) lands inside the run. |
| C | 15–110 ms after rest, to Creative | 104–178 ms | `MessagePort.onmessage` (React scheduler) | **World canvas mount**: the deferred `setMountCanvas(true)` commit builds the R3F root and the Studio and district models in one task. Then a 34–38 ms first-frame callback. |
| D | to Creative | world ready **307–403 ms after rest** (992 ms at 4× throttle, with a 605 ms task) | – | **The visible gap**: the map stage shows its backdrop and "Building the studio…" until the first world frame. |
| E | 1 of 3 phone runs, ~590 ms | 733 ms frame, no script attribution | – | **Unexplained**: not reproduced in two reruns. Possibly rendering or GPU work outside script; it needs a trace on a real phone. Recorded, not diagnosed. |

The 4× throttle rows show the shape of a weaker CPU: A grows to 230 ms, C to 605 ms, and the run
itself drops frames throughout (p95 67–83 ms).

### 2.2 Potential (not measured; reasons to design against)

1. **Two frame callbacks per frame during a run.** GSAP's ticker and R3F's loop each register
   `requestAnimationFrame`. Their order within a frame decides whether the particles render with
   this frame's `progress` or the previous one. If R3F runs first, particles trail the scanner
   line by one frame (about 14 px at the current scan speed at 60 Hz). Not yet verified.
2. **Full-viewport filters on snapshots** (`brightness`/`saturate` on `::view-transition-old/new`).
   They are cheap on an M5 but cost GPU fill on integrated graphics.
3. **CSS variables painted every frame on `<html>`.** Each write invalidates style on the root. It is
   cheap at today's count of 8; a design that adds many per-region variables must keep them scoped
   to the elements that use them.
4. **Growing particle counts or new shapes.** Each new geometry adds draw calls and possibly a
   shader program compiled mid-run.
5. **A second WebGL canvas** for the portal or particles would compile on first use and stall a
   capture (TRANSITION.md documents this).
6. **Mask-image animation.** A gradient mask that changes every frame repaints its layer every frame.
7. **React's own view transitions.** Motion's `AnimateView` (see 6.1) starts
   `document.startViewTransition` itself. If one fires during a scanner run, the browser skips the
   active transition and the scanner would cut off.

---

## 3. Professional → Creative storyboard

**Narrative:** technical precision is scanned, separated into components, carried through a
dimensional aperture and assembled into the Creative Engineering Universe.

**Timing:**

- The cue: 140 ms on the live page.
- The capture.
- The main timeline: `SCANNER_SECONDS = 1.9` s (proposed; today it is 1.8).
- Click to rest: about 2.1–2.2 s on this machine.

All times below are milliseconds from the start of the main timeline, with `progress` in brackets.

### Phase table (to Creative)

| Phase | Progress | ms | One-line job |
| --- | --- | --- | --- |
| `lock` | 0.00–0.12 | 0–230 | The instrument forms and states its axes |
| `scan` | 0.10–0.42 | 190–800 | Two planes read the page; selected regions decompose |
| `portal` | 0.38–0.64 | 720–1215 | The aperture closes to an iris and opens as a tunnel; the camera passes through |
| `assemble` | 0.58–0.90 | 1100–1710 | Fragments emerge and land on islands, stations and plates |
| `resolve` | 0.86–1.00 | 1635–1900 | Hand-off to the live interface; the overlay clears |

### Frames

```
F0  CUE (live page, 0–140 ms before capture)
┌───────────────────────────────────────────────────────────────┐
│ form&function            Projects Toolkit About  [PRO|CRE]◎── │  reticle locks on the switch;
│                                                       ╲       │  one coordinate line runs from
│  Hi, I'm Sidharth.                ┌──────────────┐      ╲      │  the switch to the viewport
│  I build intelligent              │  3D scene    │       ·     │  centre (cobalt, 1 px)
│  systems, and make                │              │             │
│  them explorable.                 └──────────────┘             │
└───────────────────────────────────────────────────────────────┘
```

**F1 · lock · 0–230 ms (0.00–0.12)**

- **Aperture:** it assembles at the viewport centre with radius R = `apertureRadius()` (340 px on desktop). Its parts:
  - an outer fine ring (ink, 1 px);
  - a cobalt ring;
  - 24 coordinate ticks (every 15°) with 4 long ticks at the axes;
  - a crosshair;
  - a small readout, `SCAN · PRO → CRE`, in mono 10 px.
- **Axes:** one horizontal and one vertical coordinate line run from the aperture to the viewport edges. These are the scan planes, still dormant.
- **Depth:** in the 3D layer, three further frames appear *behind* the aperture at z = −140, −280 and −420. They are rounded octagons, ink at 40 % / 25 % / 15 %. With the camera's perspective they read as a lens with depth, not a flat ring.
- **The page:** Professional dims by 12 % and desaturates by 20 %.
- **Markers:** corner brackets mark the selected regions (see 3.1) at 30 % opacity. These are the scan targets.

```
F1  LOCK
┌───────────────────────────────────────────────────────────────┐
│  ┌                ┐      ·    ╭───────╮    ·  ┌──────────────┐ │
│  Hi, I'm Sidharth.  ───────── │ ╭───╮ │ ───── │  3D scene    │ │
│  I build intelligent      ·   │ │ + │ │   ·   │              │ │
│  └                ┘           │ ╰───╯ │       └──────────────┘ │
│        brackets = targets     ╰───────╯  (3 frames recede      │
│                                │           behind the ring)    │
└───────────────────────────────────────────────────────────────┘
```

**F2 · scan · 190–800 ms (0.10–0.42)**

- **Planes:** the aperture's vertical diameter lights. Two vertical scan planes leave it and sweep outward to the edges.
  - Each plane is a 2 px cobalt line with a 28 px soft trailing band (8 % cobalt).
  - They move on the existing `slit()` easing, but here they **read** the page and do not reveal Creative yet. The Professional page stays visible behind them.
- **The grid:** behind each plane the Professional technical grid lines break into dashes, then into paper dots. This is the existing band shader with its direction kept.
- **Region decomposition:** as a plane passes a selected region, three things happen.
  - Its brackets snap to full strength, and a 1 px outline traces the region's border.
  - The region's old snapshot is cut away in the plane's direction (clip-path inset driven by the plane's x). Its border emits fragments at the cut edge: 6–14 per region, by perimeter.
  - Fragments lift toward the viewer (z +60 to +140) with a small tumble.
- **Cut, not dust:** the region is cut by the plane, not dissolved. By 800 ms the selected regions are gone and the rest of the page (paper and grid) remains, dimmed.
- **Text:** no character-level effects. Headings are never split into letters.

```
F2  SCAN  (planes moving outward; right half shown)
┌──────────────────────────────┬────────────────────────────────┐
│                         ░░░░▌│▐░░░░                            │
│   Hi, I'm Sidh  ◇ ◇          ▌│▐        ┌─────── ▫ ▫          │
│   I build inte ◇   ◇ ◇       ▌│▐   ◇    │  3D sc ▫  ▫▫        │  region cut at the plane;
│   systems, an   ◇            ▌│▐        └─────── ▫            │  fragments lift from the
│   ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄▌│▐┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │  cut edge; grid → dashes
└──────────────────────────────┴────────────────────────────────┘
```

**F3 · portal · 720–1215 ms (0.38–0.64)**

- **Contraction, 720–900 ms:** the aperture contracts to an iris of 0.3 R. The depth frames tighten with it.
- **Intake:** the fragments, now all lifted, turn toward the iris. Each follows a cubic Bézier in its own **lane**: the angle of its origin around the centre. Lanes therefore converge radially and never cross.
- **Into the tunnel:** each fragment shrinks as it enters (z goes from +100 to −600).
- **Expansion, 900–1215 ms:** the iris opens into a tunnel of five frames. The camera dollies forward through them: camera z goes from D to 0.2 D.
  - The Professional page (the old snapshot, now mostly paper and grid) scales up about the iris, from k = 1 to about 6, and flies past the edges. This is the earlier portal-ride math in `paint()`, reused.
  - The Creative page (the new snapshot) is seen *inside* the iris, deep and small (`inK` from 0.72 to 1), clipped to the mouth.
  - The frames pass the camera one by one. Each fades out as it passes z = camera z − 40, so nothing pops.
- **No sci-fi:** no streaks and no glow tunnel. There are only five precise frames, ticks and the fragments in their lanes.

```
F3  PORTAL (expansion; camera inside the third frame)
┌───────────────────────────────────────────────────────────────┐
│ ╲                                                           ╱ │  frames pass the camera;
│   ╲     ╭───────────────────────────────────────────╮     ╱   │  the Professional page
│         │   ╭───────────────────────────────╮       │         │  flies past the edges
│         │   │    ╭──────────────────╮       │  ◇→   │         │
│         │   │    │  CREATIVE PAGE   │ ←◇    │       │         │  fragments run their lanes
│         │   │    │ (deep, growing)  │       │       │         │  into and out of the mouth
│         │   │    ╰──────────────────╯       │       │         │
│         │   ╰───────────────────────────────╯       │         │
│   ╱     ╰───────────────────────────────────────────╯     ╲   │
└───────────────────────────────────────────────────────────────┘
```

**F4 · assemble · 1100–1710 ms (0.58–0.90)**

- **The page fills the view:** the last frame passes and the Creative page is full size. Its own blocks arrive by region (see 3.2):
  - the note card;
  - the progress strip;
  - the toolbar;
  - the map stage.
- **Fragments emerge** from the mouth (the centre) along their lanes and land on real destinations in the map stage. The assignment is sorted by angle, so lanes stay parallel.
  - **Island contours (≈ 60 %).** Points sampled along the projected outline of the Systems, Algorithms and Intelligence islands and the Studio podium (see 8.3). Each fragment lands, flattens to a 2 × 8 px dash and becomes part of the contour stroke.
  - **Stations (21, one each).** Each station has one "seed" fragment, a diamond. It lands exactly on the station's pin position (the same projection the pins use) and becomes the pin's dot (see F5).
  - **District plates (3).** A tile lands on each plate's corner, and the plate arrives.
  - **Bridges (3).** Two or three fragments land on each bridge, drawing it as a dashed path from the Studio to the district.
- **Colour:** the fragments take their destination's colour while flying.
  - Contours take their district colour: Systems `#e8532a`, Algorithms `#2f4bff`, Intelligence `#7a4ee6`.
  - Seeds keep ink with a lime core. Lime is the interaction accent, and stations are interactive.
- **Colour fields** bloom behind Creative's coloured blocks (the existing band behaviour).
- **Contours draw on:** the contours in the live map stage draw on behind the landing fragments (Anime.js stroke draw, timed by `passProgress`-like arrival times).

```
F4  ASSEMBLE (map stage)
┌───────────────────────────────────────────────────────────────┐
│  Hi, I'm Sidharth.                    ┌─[note card]──────────┐ │
│  I build intelligent systems…         └──────────────────────┘ │
│  [All districts][Systems][Algorithms][Intelligence]  [Map][List]│
│ ┌───────────────────────────────────────────────────────────┐ │
│ │      ┌┄┄┄┄┄┄┄┄┄┄┐ ◇                ┌┄┐┌┄┐                 │ │
│ │  ◇→  ┆ SYSTEMS  ┆┄┄┄┄(   STUDIO  )┄┄┆ ┆┆ ┆ ALGORITHMS      │ │
│ │      └┄┄┄┄┄┄┄┄┄┄┘ ◇      ┆          └┄┘└┄┘  ◇               │ │
│ │                        (┄┄┄┄┄┄)  ← INTELLIGENCE ring         │ │
│ └───────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

**F5 · resolve · 1635–1900 ms (0.86–1.00)**

- **Hand-off:** each seed shrinks into its station's pin dot while the real pin (`.w-dot`, `.w-plaque`) scales in at the same spot. Motion arrivals in `shift-intro.ts` do this, with the same timings, so it is one continuous object.
- **Fragments become strokes:** contour fragments fade to the skeleton stroke opacity and the fragment meshes are removed. The scanner layer clears, the colour fields fade and the depth frames are gone.
- **At rest:**
  - If the world has drawn, the canvas is already under the contours. The contours fade out over 200 ms, which is the reveal (see 9).
  - If it has not, which is the expected case on a first switch (2.1 D), the contours stay as the **studio skeleton**. Shimmer starts 150 ms after rest, and the live skeleton resolves into the world with a scanner wipe as soon as `data-ready` is set.

### 3.1 Professional regions that decompose (going out)

Selected regions get their own `view-transition-name`, so their old snapshots can be cut
individually. There are at most six, to bound capture cost.

| Region | Selector | Fragments (desktop) | Name |
| --- | --- | --- | --- |
| Header bar | `.site-header` | already `ws-header` (morph, not cut) | – |
| Headline block | `.hx-copy h1` | 14 | `ws-pro-head` |
| Lede + actions | `.hx-lede, .hx-actions` (wrapped) | 10 | `ws-pro-lede` |
| Facts row | `.hx-facts` | 8 | `ws-pro-facts` |
| Scene panel | `.hx-visual` | 16 | `ws-pro-visual` |
| Section below the fold | – | none (off screen) | – |

Rules:

- **Professional pages only:** these names exist only on Professional elements, so they never morph into a Creative element by accident.
- **Unnamed parts stay put:** everything else (paper, grid, copy outside these blocks) stays in the root snapshot and is carried by the portal scale.
- **Cut in the plane's direction:** the cut is a `clip-path: inset()` on `::view-transition-old(ws-pro-*)`, driven by one variable per region (`--sc-cut-<i>`) that GSAP paints. It cuts from the side nearer the centre outward, so it follows the outward planes.

### 3.2 Creative regions that assemble (going out)

| Region | Selector | Arrival |
| --- | --- | --- |
| Header | `.c-header` | `ws-header` morph (existing) |
| Note card | `.c-note` | Motion arrival at 0.62 |
| Progress strip | `.c-progress` | Motion arrival at 0.66 |
| Toolbar | `.c-tools` | Motion arrival at 0.68 |
| Map stage | `.c-map .w-stage` | Visible from 0.58; contours draw on as fragments land; pins arrive at 0.86–0.95 |

Arrival times come from the phase table, not from `passProgress`, because the portal reveals the
page from the centre at once, not by a moving line.

---

## 4. Creative → Professional storyboard

**Narrative:** the expressive universe is scanned, organised, aligned and reconstructed as a precise
engineering publication. It is **not** the forward run reversed: there is no tunnel. The motion is
collection, alignment and closing brackets.

### Phase table (to Professional)

| Phase | Progress | ms | One-line job |
| --- | --- | --- | --- |
| `anchor` | 0.00–0.12 | 0–230 | The scanner locks onto an anchor in the world |
| `collect` | 0.08–0.40 | 150–760 | Islands, stations and blocks give up fragments, which move inward |
| `align` | 0.34–0.64 | 645–1215 | Fragments form rows on the future baselines; the background becomes grid |
| `close` | 0.42–0.84 | 800–1600 | Two brackets close in from the edges; Professional appears outside them |
| `lock` | 0.80–0.94 | 1520–1785 | The brackets meet; the aperture locks; the rows land as type |
| `resolve` | 0.90–1.00 | 1710–1900 | Marks clear; focus and input are restored |

### Frames

**R0 · cue (live, 140 ms)**

- **Reticle:** it locks on the switch.
- **Selected station:** if a station is selected and on screen, its lime frame pulses once (the live 3D world can still draw during the cue). This makes it the anchor.
- **No station:** the anchor is the map stage's centre if the map is on screen, otherwise the viewport centre.

**R1 · anchor · 0–230 ms**

- **The aperture:** it forms at the anchor at 0.6 R, cobalt, with four long axis ticks.
- **A target:** a faint dashed target marks the viewport centre, where the halves will lock.
- **Drain:** the Creative snapshot drains by 30 % saturation and 8 % brightness (existing behaviour, stronger).

**R2 · collect · 150–760 ms**

- **Fragments rise:** they lift from Creative's structure, in this order:
  - first the selected station and its district's contour;
  - then the other islands;
  - then the note card, toolbar and progress strip edges.
- **Toward the anchor:** each moves inward along a smooth curve with a clear destination. It holds briefly in a loose ring at 1.2 R around the anchor, its tumble damping to zero.
- **The world recedes:** the Creative snapshot scales toward the anchor (1 → 0.96).
- **Colour fields** contract toward the anchor (existing).
- **The background:** the dotted background starts drawing into dashes around the anchor ring.

**R3 · align · 645–1215 ms**

- **The ring unfolds into rows.** The fragments leave the ring and travel to **row slots**. These slots lie on the baselines of the Professional hero's real text lines, measured in the new page after `flushSync` (Range client rects):
  - the 2–4 headline lines;
  - the 3–4 lede lines;
  - the action buttons;
  - the facts row.
- **Typesetting:** each fragment becomes a short cobalt or ink tick lying on its row. Rows fill left to right with a 10 ms stagger, like type being set.
- **A grid emerges:** the remaining fragments go to the hero scene panel's border and corners, so the panel's rectangle appears as a dotted frame.
- **The Professional grid** draws in behind the rows (band shader: dots → dashes → grid).

**R4 · close · 800–1600 ms**

- **Brackets close:** two bracket-scanners close in from the edges (the existing `slit()` to-pro geometry).
- **Professional is revealed:** the Professional page is the new snapshot, live. It shows outside the closing slit, at full light.
- **Creative is compressed:** inside the slit, the Creative page is compressed (0.965) and drained.
- **Rows become real type:** as a bracket passes a row, that row's ticks drop 2 px onto the baseline and fade. The real text, revealed by the bracket at the same moment, takes their place.

**R5 · lock · 1520–1785 ms**

- **The aperture locks:** the brackets meet at the centre and lock into one aperture (iris, core, cobalt ring).
- **Corner marks** snap in at the viewport corners: the publication's crop marks.
- **The hero viewport:** if the hero 3D scene has drawn (measured: it compiles about 0.35 s into the run), it is simply there. If not, its skeleton (9.1) is visible in the live page and resolves on readiness.

**R6 · resolve · 1710–1900 ms**

- **Clearing:** the marks fade from the centre outward and the overlay clears.
- **Focus:** it returns to the same switch option (existing).
- **Announcement:** the mode is announced (existing).

### 4.1 Why the Professional skeleton is mostly *particle rows*, not placeholder boxes

The brief asks for a Professional skeleton reveal. It also forbids unnecessary skeletons when content is ready.

The Professional page's text and layout are always ready at capture, because they are synchronous React. Showing grey boxes over ready text would be a fake loading state.

So the Professional "skeleton" is **built by the fragments themselves**: rows on the real baselines and a frame on the real panel. They become the real interface as the brackets pass.

Only the **hero viewport** has a true skeleton. It appears only if the 3D scene is genuinely still loading at the moment it is revealed, plus the threshold. On this machine that should be rare: measured readiness is 22–52 ms after rest, and the scene compiles during the run.

---

## 5. Scanner visual composition

One instrument dominates. Everything else supports it.

| Element | Layer | Spec |
| --- | --- | --- |
| Outer fine ring | SVG (front plane) | Ink `#17171d`, 1 px, radius R |
| Cobalt ring | SVG | `#2f4bf5`, 2 px, radius R − 8 |
| Coordinate ticks | SVG | 24 ticks, 6 px (long ticks 14 px at 0/90/180/270°), ink 70 % |
| Crosshair | SVG | 1 px ink 50 %, 18 px gap at the centre |
| Readout | SVG text | Mono 10 px, ink 60 %: `SCAN · PRO → CRE` / `ALIGN · CRE → PRO` (labels a real state) |
| Scan planes | SVG + band shader | 2 px cobalt line; trailing band 28 px, cobalt 8 %; grid break in the shader |
| Depth frames | R3F (scanner canvas) | 5 rounded octagons, line geometry merged into **one** `LineSegments`; ink at 40/30/22/15/10 %; the innermost carries 8 orange (`#ff6538`) tick pairs; z = 0, −140, −280, −420, −560 |
| Iris | SVG | Contracts to 0.3 R; 6 blades drawn as arcs (existing iris, re-timed) |
| Region brackets | SVG | 10 px L-corners, cobalt; 30 % at lock, 100 % when scanned |
| Corner marks (to-pro lock) | SVG | 18 px crop marks at the viewport corners |

Colour discipline:

- Cobalt is the instrument.
- Orange is used only on the innermost frame and the to-Creative core.
- Lime only on station seeds and selected-station anchors.
- District colours only on fragments bound for a district.
- No gradients other than the trailing band; no bloom; nothing glows except the cobalt band at 8 %.

---

## 6. Portal and camera journey

The **portal** is the depth frames, plus the iris, plus the snapshot transforms. The **camera** is the
scanner canvas's perspective camera (at distance D, where one unit equals one CSS pixel on z = 0,
as today).

- **Dolly:** camera z goes from D to 0.2 D over the expansion (900–1215 ms), on `inOutCubic`.
- **Frames:** each depth frame at depth z_k is seen at scale D / (cam − z_k). Frames pass the camera in order and fade over the last 40 units before they reach it.
- **Old snapshot (Professional):** `transform: scale(k)` about the iris centre, with k = D / cam_z_equivalent. This uses the `paint()` math from the portal ride, extracted into a shared function. The front SVG plane (ring and ticks) gets the same scale through `--sc-k`, so the SVG and 3D agree.
- **New snapshot (Creative):** clipped to `circle(r_mouth · k)` at the iris centre, scaled by `inK` (0.72 → 1), and slid to the centre. This is also existing `paint()` math.
- **Phones:** three frames instead of five, dolly to 0.35 D. The iris stays at 0.3 R, so it stays readable on a 390 px screen.
- **Reverse:** there is no tunnel. The camera stays at D and only z offsets of collected fragments are used.

### 6.1 Motion's `AnimateView`: checked, and not used for the transition

**What is installed:**

- `motion` 14.5.0 exports `motion/react-animate-view`, which re-exports `framer-motion/animate-view`.
- `AnimateView` is a wrapper around React's `<ViewTransition>`. It throws unless React is 19.3 or later; this project has 19.3.1, and `React.ViewTransition` exists.
- React starts its own `document.startViewTransition` when a `<ViewTransition>` boundary changes inside a React transition (`startTransition`, a Suspense reveal, `useDeferredValue`).

**Why it is not used:**

- The scanner already owns a manually started view transition.
- Only one view transition can run per document, so a React-initiated one during a run would **skip** the scanner (potential cause 7).
- The skeleton-to-content reveal must therefore not use `AnimateView` or `<ViewTransition>`.

**Decision:** skeleton reveals are done on the **live DOM** with `clip-path` and a feathered edge (section 9), driven by GSAP during a run and by Motion's `animate()` outside one. This needs no new dependency. It also works in every browser that renders the page, including those without View Transitions.

---

## 7. Particle design and trajectories

### 7.1 Forms (three geometries, instanced, as today)

| Form | Geometry | Size at rest | Used for |
| --- | --- | --- | --- |
| Tile | thin box 1 × 1 × 0.18 | 8–12 px | Professional region borders; Creative block edges |
| Seed | octahedron | 10 px, lime core | The 21 stations |
| Dash | box 1 × 0.25 × 0.25 | 8 × 2 px when landed | Island contours, bridges, Professional baselines |

The current sizes are a few pixels. Phase D makes them **larger and fewer**: legible as objects.

They are lit and outlined (existing `ink` outline mesh). `castShadow` is off and there are no shadow maps.

### 7.2 Counts

| Tier | Total | Seeds | Contours + bridges | Region tiles |
| --- | --- | --- | --- | --- |
| T3 desktop | 160 | 21 | ~95 | ~44 |
| T2 tablet / medium | 112 | 21 | ~60 | ~31 |
| Phone | 72 | 21 | ~33 | ~18 |
| T1 lite (no WebGL) | 0 (SVG frame only) | – | – | – |

The 21 seeds are never dropped: one seed per station is the point of the assembly.

### 7.3 Forward trajectory (one particle)

```
origin o (region border, at the cut)      lane angle θ = atan2(o − c)
  │ lift:    release at the plane's pass p₀; over 0.08: z 0 → +60..140, small tumble
  ▼
  intake:  cubic Bézier o → c + 0.3R·(cos θ, sin θ), control points on the lane; z → −600
  ▼          (scale by perspective; fragments vanish into the mouth by 0.62)
  emerge:  from c along θ', the angle of its *destination* d about c (assignment sorted by angle,
  ▼          so θ' ≈ θ and lanes stay parallel); z −600 → 0; land by 0.90
  land:    flatten to the destination form (dash on a contour, seed on a pin), take its colour;
             tumble 0 by landing (critically damped)
```

### 7.4 Reverse trajectory (one particle)

```
origin (Creative contour / pin / block edge) ── lift (z +40) ──► ring slot at 1.2R around the anchor
                                     (hold 0.06, tumble damps)
ring slot ──► row slot (x sorted along each baseline; rows top to bottom) ── typeset at 10 ms stagger
row slot  ──► drop 2 px and fade as a bracket passes its x (passProgress, to-pro)
```

### 7.5 Assignment

The existing `assignEnds()` in `particle-layout.ts` is extended:

- **Sources and destinations:** both are sorted by angle about the centre (or the anchor) and paired in order, so no two paths cross.
- **Seeds:** stations are assigned first. Each takes the source with the nearest angle.
- **Balancing:** contours take the rest, balanced by district perimeter.

### 7.6 Pure functions of `progress`

Every particle position, scale, colour and rotation is a function of `progress`, its index and its endpoints. Nothing integrates over time. Consequences:

- **Refresh rate:** the same speed at 60, 90, 120 and 144 Hz.
- **Frame drops:** a skipped frame only skips a sample.
- **Reproducibility:** scrubbing `progress` reproduces any frame for captures and tests.

No physics simulation is needed, so no fixed timestep is needed.

---

## 8. Skeleton loading design system

### 8.1 Principles

1. **Content-shaped:** a skeleton has the silhouette of what is coming: island outlines, a viewport with its tabs, a 16:9 poster, rows of a document list. It is never a generic stack of grey bars.
2. **Only for real waiting** (see 10). Synchronous text never gets a skeleton.
3. **Same footprint:** the skeleton occupies exactly the box the content will occupy. No layout shift.
4. **Quiet:** no bright white, no glow, a restrained shimmer.
5. **One source of geometry:** a skeleton is drawn from the same data as its content (the same layout tables, the same projection), so the hand-off lines up.

### 8.2 Primitives (proposed `src/components/skeleton/`)

| Primitive | Props | Renders |
| --- | --- | --- |
| `SkLine` | `width` (% or px), `size` (`h1`/`body`/`mono`) | One text line at the line-height of that text style; 0.62 em tall, radius 4 px |
| `SkBlock` | `w`, `h`, `radius` | Rounded rectangle |
| `SkChip` | `w` | Pill (buttons, filter chips) |
| `SkViewport` | `ratio`, `tabs?` | Framed viewport with an optional tab row, a faint grid and a centred model silhouette slot |
| `SkPath` | `d`, `tone` | An SVG path (islands, bridges, model silhouettes) with fill + dashed stroke |
| `SkRegion` | `label`, `busy`, `children` | The wrapper: `aria-busy`, the single status line, shimmer and wipe, inert |

### 8.3 Composite skeletons

**Studio map skeleton.** This replaces "Building the studio…" in `.w-stage` and is the important one.

- **Islands:** the islands and Studio podium are drawn as `SkPath`s, **projected from the world's own layout** (`DISTRICTS`, `local` footprints, `BOWL`, `ALGORITHMS_PLATES`, `STUDIO`) through `poseFor({ kind: "overview" }, stage)` and the same `Projector` the pins use. A new function in the world layout module returns these paths for a stage size, so the skeleton, the forward particle destinations and the real canvas agree to within a pixel or two. The acceptance check is in 19.
  - Fill: the district's glow colour (`--g-systems` and so on) at 55 %.
  - Stroke: the district colour at 45 %, 1.5 px, dashed 6/5.
- **Stations:** 21 station dots at the pin positions, as 8 px ink rings.
- **Plates:** three plate placeholders (`SkLine` title + mono count).
- **Bridges:** three dashed bridge paths.
- **Unchanged:** the map toolbar is real and interactive (it is ready), so it gets no skeleton.
- **Selection:** if a station was selected, its panel's real content is ready (registry data), so the panel shows real content, not a skeleton.

**Professional hero viewport skeleton.** Shown only when the hero scene is not ready (4.1).

- An `SkViewport` 16:10 with the real category tabs. The tabs are ready, so they are real.
- A model silhouette slot: an isometric box outline for the selected scene's kind.
- Two annotation `SkLine`s and a control row of two `SkChip`s.

**Exhibit skeletons.** These replace the `.s3-loading` text tiles, keeping their footprint.

| Variant | For | Shape |
| --- | --- | --- |
| `scene` | 3D exhibits (maze, campus, engine, dog, AURA studio, city net, vault) | Viewport with a model silhouette (per-exhibit simple outline: maze grid, garage box, ring, quadruped box, vault cylinder), toolbar chips, a step list of 3–5 `SkLine`s |
| `data` | NEXUS run view, Predictive Maintenance charts | A chart frame with axis ticks and 4–6 bar silhouettes; a 4-row table |
| `document` | Retrieval / evidence views | A 5-row document list (icon square + two lines) |
| `controls` | Experiment controls | 3 sliders (track + knob) and 2 chips |

**Video skeleton** (for later, when real videos exist):

- A 16:9 poster frame, a control row (play circle, a scrubber line, two chips) and two caption lines.
- It is used only while a real poster or video is loading. Today every entry is "planned", so the existing "Video in preparation" card stays. **The video component is not changed in Phase D.**

### 8.4 Tokens

| Token | Professional | Creative |
| --- | --- | --- |
| `--sk-surface` | `#ece9e0` (ivory, one step below `--m-paper #f7f6f0`) | district glow at 55 % over paper; neutral `#ebe6d8` |
| `--sk-line` | `rgb(23 23 29 / 0.08)` hairline | `rgb(23 23 29 / 0.10)` |
| `--sk-accent` | cobalt `#2f4bf5` at 35 %, a 2 px left rule on viewport skeletons | district colour at 45 % (dashed strokes) |
| `--sk-highlight` | `rgb(255 255 255 / 0.55)` | `rgb(255 252 244 / 0.6)` |
| `--sk-radius` | 6 px lines, 10 px blocks | 8 px lines, 14 px blocks (matches Creative cards) |

The contrast of skeleton surfaces against paper is about 1.1–1.3:1, which is fine for decorative non-text shapes. Every **text** shown in a loading state (the status line) is ink on paper, at least 4.5:1.

---

## 9. Shimmer and wipe reveal

### 9.1 Shimmer

- **Mechanism:** one `::after` per `SkRegion` (not per shape), with `background: linear-gradient(100deg, transparent 30%, var(--sk-highlight) 50%, transparent 70%)`. Shapes are masked into it, so one moving highlight passes through all the shapes of a region together, like light crossing the surface.
- **Motion:** `transform: translateX(-100%) → translateX(100%)`. This is a compositor-only animation, not `background-position` (which repaints).
- **Timing:** 1.6 s, `ease-in-out`, infinite, with a 0.4 s pause between passes (keyframes 0–80 %).
- **Starts late:** `animation-delay: 150ms` from when the skeleton appears, so very short waits never shimmer.
- **Reduced motion:** shimmer off; the shapes stay static.

### 9.2 Wipe reveal (skeleton → live content)

The content renders **underneath** the skeleton and is fully drawn before the wipe starts. For the
world that means after `data-ready`, which is set after the first drawn frame. So the wipe only ever
uncovers finished content: no flicker and no overlap of two half-states.

- **Edge:** the skeleton layer gets `clip-path: inset(0 0 0 var(--sk-wipe))`, which removes it from left to right. A 24 px feathered edge rides the cut as a separate thin element with a gradient, moved by `transform`, plus a 1 px cobalt line. It reads as a small scanner resolving the region.
  - Animating the clip is cheaper than animating a gradient mask, which would repaint the whole layer every frame (2.2, item 6).
- **Direction:**
  - Studio map: wipes **outward from the Studio podium** (two clip edges, left and right), so the world is resolved from its centre, echoing the scanner.
  - Viewports: left to right.
- **Duration:** 320 ms (`easeInOutCubic`) for the map, 240 ms for viewports. There is no minimum display time before the wipe: if content is ready the wipe starts in the next frame.
- **Owners:**
  - During a run, GSAP paints `--sk-wipe` (only if the world becomes ready mid-run, which can happen with the persistent world in stage S8).
  - Outside a run, Motion's `animate()` animates `--sk-wipe` on the skeleton element.
  - The hand-off is at rest. The two never animate the same element at the same time.
- **Reduced motion:** a 120 ms opacity fade instead of the wipe.

---

## 10. Content-readiness and skeleton display rules

Each async region R exposes three things:

- `ready(R)`: true once real content is visibly drawn.
- `revealAt(R)`: when R becomes visible to the visitor.
- `failed(R)`.

| Region | `ready` signal (exists / to add) | `failed` signal |
| --- | --- | --- |
| Studio world | `.w-stage[data-ready]`, set by `onReady` after the first frame (exists) | `onFailed` → 2D map (exists) |
| Professional hero scene | to add: `data-ready` on the hero scene frame after its first drawn frame | WebGL unavailable → its flat view (exists) |
| Exhibit 3D canvases | to add: the same `data-ready` on `lazyView` canvases after the first frame | `fallback` prop → flat view (exists) |
| Video poster | `<img>` `onload` (later) | `onerror` → "Video in preparation" card (exists) |

Rules:

1. **Prepare early.** Start preparing the destination as soon as intent is shown:
   - Code chunks are fetched on intent (`preload()`, exists).
   - The world canvas still mounts only **after** rest, because mounting a canvas mid-run stalls the frame (actual cause C). Stage S8 proposes keeping it alive across switches.
2. **No skeleton for ready content.** If `ready(R)` at `revealAt(R)`, no skeleton is ever shown.
3. **Threshold θ = 150 ms.** If R is not ready by `revealAt(R) + θ`, its skeleton is shown. Until then R shows its plain surface (paper and frame), never a flash of placeholder.
4. **The transition's construction lines are not a loading claim.** The contours that fragments land on are choreography and always play. At rest + θ, if the world is still not ready, those same contours **become** the skeleton: shimmer starts and `aria-busy` is set. If the world is ready, they fade with the reveal.
5. **Remove as soon as ready.** On `ready(R)` the wipe starts in the next frame. There is no minimum display time.
6. **Fail honestly.** On `failed(R)`, remove the skeleton at once and show the real fallback: the 2D map, the flat exhibit view, or the video card.
7. **Never endless.** If R is not ready after 8 s:
   - The shimmer stops.
   - The status line changes to a plain statement with actions: "The 3D studio is taking longer than usual." [Use the 2D map] [Keep waiting]. Keep waiting re-arms 8 s.
   - No percentages, no fake steps.
8. **Interrupted.** If the visitor switches mode or leaves, skeleton timers and listeners are cleared with the region.

**Why θ = 150 ms.** The measured readiness on this machine falls on either side of it:

- The Professional hero is ready 22–52 ms after rest, and in practice during the run, so θ never shows it a skeleton.
- The Creative world is ready 307–403 ms after rest (992 ms at 4× throttle), so θ always shows the skeleton on a first switch.

A shorter θ (around 80 ms) risks a skeleton flash on a slightly slower machine for the hero. A longer θ (around 250 ms) leaves an empty stage visible for a quarter of a second. Stage S5 must re-measure on the final code and record the distribution. θ is a constant, `SKELETON_DELAY_MS`.

---

## 11. Contextual loading messages

A message is shown only for a real operation, only after the skeleton has been visible for 1 s, as one line, with no ellipsis animation and no progress numbers.

| Operation (observable) | Message |
| --- | --- |
| World chunk still downloading (`lazyView` pending, first visit) | Downloading the 3D studio |
| World canvas mounted, waiting for its first frame | Building the 3D studio |
| Hero scene chunk downloading | Downloading the 3D scene |
| Hero scene compiling (canvas mounted, not drawn) | Preparing the 3D scene |
| Exhibit chunk downloading / building | Loading the 3D maze (existing per-exhibit wording, kept) |
| Evidence/document view data (if ever fetched) | Loading the document evidence view |
| Over 8 s | The 3D studio is taking longer than usual. (+ actions) |

Not used, because no separate operation exists: "Resolving project stations" (pins are placed
synchronously from the layout) and "Restoring the Professional workspace" (Professional renders
synchronously). Using them would describe work that does not happen.

---

## 12. Frame-rate architecture

1. **One loop during a run.**
   - **Proposed:** the scanner canvas switches to `frameloop="never"` and renders from GSAP's ticker. A `gsap.ticker.add(render)` listener registered after the timeline calls R3F's `advance(time, true, rootState)` for that root only.
   - **Result:** GSAP updates `progress`, then paints the CSS variables, then the particles render in the same callback, always in that order.
   - This removes the second frame callback and the possible one-frame lag (2.2, item 1). The Creative world's own on-demand loop is not running during a run.
2. **Natural refresh.** The browser's `requestAnimationFrame` (inside GSAP's ticker) is the only clock:
   - no `setInterval`;
   - no fixed 60 or 120;
   - no `gsap.ticker.fps()` cap.
3. **Elapsed time everywhere.** The timeline is time-based and renderers are pure functions of `progress` (7.6). The shimmer is a CSS animation. Existing world animations already use `tick(delta)`.
4. **Large deltas.**
   - `lagSmoothing(0)` stays, so the timeline never stretches.
   - If the page becomes hidden during a run (`visibilitychange`), the run is finished at once: skip the view transition, apply the mode, clear. On return the visitor sees the destination, not a frozen mid-frame.
   - World animations clamp their deltas, as today.
5. **Refresh estimate.**
   - **Sampling:** 30 rAF gaps sampled once on intent (pointer or focus at the switch), in a short-lived loop that stops itself. The estimate is the 10th percentile, clamped to 6.9–16.7 ms. This is the same method as the world's `Adapt`.
   - **Uses:** it sets the frame budget used by the quality decision (13) and the dev probe.
   - **Speed is unaffected:** it never changes animation speed.
6. **Quality per run, decided before the run.**
   - **Inputs:** the device tier (`guessTier`), `prefersLite()` and the last run's telemetry (kept in `sessionStorage`).
   - **Step down:** if the last run had more than 6 frames over 1.5× the refresh interval, or any frame over 100 ms outside the capture frame, the next run steps down one tier.
   - **No mid-run changes:** tiers never change mid-run, because a pop is worse than a dropped frame.
7. **Honesty.** Only 60 Hz is available here, so 90, 120 and 144 Hz behaviour remains **unverified** until measured on such a display. Nothing in this design forces a rate.

---

## 13. Performance budgets

### Per frame, during a run (T3)

| Item | 60 Hz | 120 Hz | 144 Hz |
| --- | --- | --- | --- |
| Frame budget | 16.67 ms | 8.33 ms | 6.94 ms |
| Main-thread script (timeline + paint + particle update) | ≤ 3 ms | ≤ 2 ms | ≤ 1.8 ms |
| Scanner canvas GPU (particles + frames + band) | ≤ 4 ms | ≤ 3 ms | ≤ 2.5 ms |
| Draw calls in the scanner canvas | ≤ 10 (3 instanced + 3 outline + 1 frames + 1 band + spare) | same | same |
| CSS variables written per frame | ≤ 16, on the elements that use them | same | same |

### Per run

| Item | Target | Measured today |
| --- | --- | --- |
| Click → first visible response | ≤ 1 frame (the cue is on the live page) | 1 frame |
| Capture frame (A) | ≤ 60 ms LoAF on M5 | 64–120 ms |
| Frames over 1.5× refresh during the run, excluding the capture frame | ≤ 2 on M5 at 60 Hz; ≤ 4 at 120 Hz | 1–2 |
| Median / p95 frame during the run | ≤ 1.05× refresh / ≤ 1.1× refresh | 16.7 / 16.8 ms |
| p99 frame during the run | ≤ 2× refresh | 33–50 ms |
| Post-rest world build task (C) | ≤ 60 ms per task (split) | 104–178 ms |
| World ready after rest (first switch) | ≤ 400 ms on M5 (skeleton covers the rest) | 307–403 ms |
| World ready after rest (repeat switch, with S8) | ≤ 50 ms | 307–403 ms |
| Particle instances | ≤ 160 (T3) | 120 |
| Scanner canvas DPR | ≤ 1.5 (≤ 1.25 phones) | 1–1.5 |

The capture frame (A) is the hardest. Options, in order of risk:

1. Name fewer elements and measure less inside the callback; move `measureLayout()` of the new page to the first frame after `ready`.
2. Defer below-the-fold React subtrees of the destination by one transition tick (render them in a `startTransition` after rest). There are no `<ViewTransition>` boundaries, so this cannot trigger a React view transition, but it must be verified.
3. Keep both mode trees mounted with React `<Activity>`. This is **not recommended** in Phase D: duplicate ids (`#projects`, `#about`), anchors and tests break. It is recorded here only as the large lever that exists.

---

## 14. Motion-library responsibilities

| System | Owns | Never touches |
| --- | --- | --- |
| **GSAP** (3.15) | The master timeline; `cue`, `progress`; painting `--sc-*`, `--sc-k`, `--sc-cut-*` and, during a run, `--sk-wipe`; calling R3F `advance()` for the scanner root; seeking Anime.js timelines | DOM layout, React state, element opacity or transform of live components |
| **R3F / three** (9.8.2 / 0.185) | Scanner canvas: particles (instanced), depth frames (one merged `LineSegments`), band shader, its perspective camera | Page DOM; the world canvas during a run |
| **View Transitions + CSS** | The root snapshots and named region snapshots: clip, scale, filter; shared-element morphs | Anything after `finished` |
| **Anime.js** (4.5) | SVG strokes: reticle, rings, ticks, iris, chevrons, brackets, corner marks (seeked by GSAP); contour draw-on in the live map stage (seeked by GSAP during a run) | Transforms set by CSS variables |
| **Motion** (14.5) | Live-DOM arrivals of the new page's blocks (`shift-intro.ts`); post-rest skeleton wipe (`--sk-wipe`) and fades | Anything GSAP paints during a run; it never uses `AnimateView` (6.1) |
| **React** | Mode state, content, readiness flags, skeleton mounting/unmounting | Per-frame updates (no `setState` per frame during a run) |

Cleanup on finish or cancel: kill the GSAP timeline and ticker listener; remove the injected
`<style>`; remove all `--sc-*`; remove region view-transition names; dispose of nothing GPU-side per run
(geometries and materials are built once when the scanner canvas loads and reused). Skeleton regions
remove their timers, Motion animations and listeners on unmount.

---

## 15. Reduced motion and mobile

**Reduced motion** (`prefers-reduced-motion: reduce`):

- **The switch:** the mode changes at once, as today, with no scanner and no camera.
- **Skeletons:** if content is loading, the skeleton appears static (no shimmer) after θ and is replaced by the content with a 120 ms opacity fade.
- **Status:** the status line still appears after 1 s, because it is information, not motion.
- **Map journey:** the Private Local AI camera journey already snaps; that is unchanged.

**Mobile and tablet:**

- **Counts:** particle counts 72 (phone) and 112 (tablet). The 21 seeds stay.
- **Portal:** phones use 3 depth frames and dolly to 0.35 D. The scanner canvas DPR is capped at 1.25 on phones.
- **Size:** fragments stay at least 7 px on screen, so they are perceptible.
- **Map stage:** on phones it is 342 × 390 at overview. The skeleton uses the same projection, so its islands are small, but they are the real shapes. The station dots are hidden at phone overview, as the real pins are; they appear in a district view.
- **Region decomposition:** on phones only the headline and the scene panel are cut (two named regions, not four), which reduces capture cost.
- **No oversized canvas:** the scanner canvas is the viewport size × DPR; nothing is drawn off-screen.

---

## 16. Failure and interrupt handling

| Situation | Behaviour |
| --- | --- |
| Second click during a run | The existing `cancel()`: kill everything, skip the view transition, start the new run clean |
| `startViewTransition` rejects or `ready` fails | Apply the mode at once, clear all attributes, variables, names and styles (existing `.catch` path extended to always call `clear()`) |
| Timeline never finishes (watchdog) | **New:** a 3.2 s watchdog from the click forces `skipTransition()` and `clear()` |
| Page hidden during a run | **New:** finish at once (12, item 4) |
| Scanner WebGL context lost | Layer marked not ready (existing); later runs use the SVG frame only |
| World build fails | `onFailed` → 2D map (existing); the skeleton is removed at once |
| Skeleton over 8 s | Rule 7 in section 10 |
| Focus | Restored to the same switch option (existing); never left on a removed element |
| Scroll / section | Kept (existing `sectionInView`); route, filters, district and selection survive (existing session store; tested) |
| Invisible overlays | `::view-transition { pointer-events: none }` and `.sc-layer` are pointer-transparent and `aria-hidden` (existing); skeleton layers are `inert`, `aria-hidden` and pointer-transparent; the real toolbar stays interactive |

---

## 17. Implementation stages (for Sonnet 5.5, High)

Each stage ends with its tests green, `tsc` and ESLint clean, and a frame capture where visual.
Work on `phase-d-precision-scanner`. Commit locally per stage only after owner review where noted.

| Stage | Scope | Files (expected) | Gate |
| --- | --- | --- | --- |
| **S0 Harness** | Move the measurement script into `scripts/` or `tests/perf/` (transition frames, LoAF, readiness); add a frozen-frame capture helper using `__worldShiftGsap` / `__transition` in dev | new script, `tests/transition.spec.ts` (read-only use) | Reproduces section 2.1 within ±15 % |
| **S1 Timeline** | Direction-specific phase tables (3, 4); `SCANNER_SECONDS = 1.9`; `within()` per direction; keep `slit()`/`passProgress()` for scan planes and brackets; unit tests for the phase math | `lib/transition/state.ts`, `scanner.ts` | Phase math tests; both directions still finish and clean up |
| **S2 One loop + depth frames** | Scanner canvas `frameloop="never"` + `advance()` from the GSAP ticker; merged depth-frame `LineSegments`; camera dolly; shared portal `paint()` math | `scanner-canvas.tsx`, `world-shift.ts` (extract math), `world-shift.css` | One rAF chain during a run (verify with a trace); frames at 900/1050/1200 ms match F3 |
| **S3 Region decomposition** | Named Professional regions (3.1), cut variables, fragment emission at the cut edge | `world-shift.ts`, `world-shift.css`, `layout.ts`, `particle-layout.ts` | Capture frame (A) does not grow by more than 10 ms; frames at 400/600 ms match F2 |
| **S4 Island projection** | `projectIslands(stage)` and station pin positions from the world layout and `poseFor` overview | `creative/world/layout.ts` (new export), unit test | Skeleton outline vs rendered world: intersection-over-union ≥ 0.9 per island at 1440 × 900 and 390 × 844 |
| **S5 Skeleton system** | Primitives, composites, tokens, shimmer, wipe, readiness hook with θ, status line, 8 s rule; integrate Studio map, hero viewport, exhibits (replace `.s3-loading` contents only) | new `components/skeleton/*`, `world-stage.tsx`, scene wrappers, `scenes.css`, new `skeleton.css` | Skeleton shows only when not ready by θ (tests with a delayed chunk and a delayed first frame); no layout shift (CLS 0 in the region); axe clean |
| **S6 Forward assembly** | Lanes, intake, tunnel, emergence, landing on contours/seeds/plates/bridges; seed → pin hand-off; contour draw-on | `particle-layout.ts`, `scanner-canvas.tsx`, `shift-intro.ts` | Frames at 1200/1500/1800 ms match F4–F5; every seed lands within 2 px of its pin |
| **S7 Reverse narrative** | Anchor, collection ring, row slots from Range rects, typesetting, bracket close, lock, corner marks | same + `scanner-frame.tsx` | Frames match R1–R6; rows lie within 2 px of the real baselines |
| **S8 Performance** | Capture-frame reduction (13, options 1–2); split the world's first commit into ≤ 60 ms tasks; quality tiers and telemetry step-down; **optional, owner decision:** keep the world canvas alive (hidden, `frameloop="never"`) across mode switches after the first build | `world-shift.ts`, `world-canvas.tsx`, `world-stage.tsx` | Section 13 budgets; memory cost of the kept world reported before adoption |
| **S9 Reduced motion, mobile, failure** | Section 15 and 16, including watchdog and hidden-page finish | as above | Tests for each row of section 16 |
| **S10 Verification and docs** | Full suite, browser plan (18), frame captures of both directions, update `docs/TRANSITION.md` | docs, tests | Acceptance criteria (19) |

Model use: S0–S9 on Sonnet 5.5 High. S10 docs and later timing or colour tweaks on Sonnet 5.5 Medium.

---

## 18. Browser verification plan

| Check | Tool | What it proves | What it does not |
| --- | --- | --- | --- |
| Both directions, cleanup, rapid switching, focus, section, reduced motion, failure paths | Playwright, Chromium (Chrome for Testing) | Behaviour | Real-GPU smoothness on other machines |
| Frame pacing and long frames, warm / cold / repeated / with an exhibit open / at 4× CPU throttle | S0 harness, production build, Chromium | 60 Hz pacing on this M5 | 90/120/144 Hz |
| Frozen frames F0–F5 and R0–R6 at fixed `progress` | dev probe + screenshots | The composition matches this document | Motion feel (needs real-time review by the owner) |
| Real-time recordings of both directions | Playwright video, Chromium; WebKit video (its screenshots omit the scanner layer, per TRANSITION.md) | Sequencing | Firefox real-window rendering (Playwright Firefox video shows blank frames for any view transition) |
| Firefox and WebKit engines | Playwright | Functional parity | Real Safari / Firefox windows (unverified) |
| Phone and tablet widths | Playwright emulation 390 × 844, 820 × 1180 | Layout, counts, readability | Real phones (unverified) |
| Accessibility | axe in each state, keyboard path, `aria-busy`, a single status line | Automated a11y | Screen-reader experience (unverified unless tested with VoiceOver by the owner) |
| 120 / 144 Hz | **Only on a real high-refresh display** | Real pacing | Nothing, if no such display is available. Report it as unverified |

---

## 19. Acceptance criteria

**Visual (frozen frames and real-time review by the owner)**

1. Going to Creative, the run has five legible beats (lock, scan, portal, assemble, resolve) at the times in section 3, within ±60 ms.
2. Selected Professional regions are cut by the scan planes and emit fragments from the cut edge; no heading is split into letters.
3. The portal shows depth: at least three frames visibly at different depths and passing the camera; no frame pops.
4. Every one of the 21 stations receives a seed that lands within 2 px of its pin and hands off to it.
5. Island contours assemble from fragments and match the real islands (IoU ≥ 0.9).
6. Coming back is a different motion: collection, rows on the real baselines (within 2 px), closing brackets and a lock. No tunnel.
7. Colour discipline holds (section 5): no neon, no added gradients, no glow other than the cobalt band.

**Loading**

8. No skeleton appears for content ready by `revealAt + 150 ms`; a skeleton appears for content not ready by then; it leaves within one frame of `ready` plus its wipe (320 / 240 ms).
9. Skeletons occupy the content's exact box (no layout shift), are `aria-hidden`/`inert`, set `aria-busy` on the region and expose at most one status line.
10. Status messages correspond to real operations (section 11); none is shown before the skeleton has been visible for 1 s; the 8 s rule works; failure shows the real fallback.
11. Reduced motion: no scanner, no shimmer, and a static skeleton only if loading.

**Performance (production build, this M5, 60 Hz)**

12. Click to rest is 2.0–2.3 s in both directions.
13. During a run the median frame is 16.7 ms, the p95 is at most 18.4 ms and the p99 is at most 33.4 ms. There are no more than 2 frames over 25 ms besides the capture frame.
14. The capture frame is at most 60 ms LoAF (S8); the post-rest world tasks are at most 60 ms each.
15. One frame-callback chain during a run (trace).
16. 90, 120 and 144 Hz are reported as unverified unless measured on such a display.

**Robustness**

17. Rapid switching (10 clicks within 3 s) ends in a clean, interactive state in the last chosen mode.
18. A forced timeline failure, a hidden page and a lost WebGL context each leave no overlay, restore input and keep focus.
19. The full Playwright suite passes; `tsc` and ESLint are clean; axe reports no violations in the tested states.

---

## Appendix A: what stays untouched in Phase D

- The map, exhibits and world art direction of Stage C and Stage D.
- The demo-video component and the media manifest. Skeletons for video are designed but not wired until real videos exist.
- The refresh-aware pixel-ratio adaptation (`Adapt`) and the world's on-demand loop.
- Production `main`, Vercel configuration and the rollback tag.

## Appendix B: open decisions for the owner

1. **The persistent world (S8).** Keep the 3D world alive across mode switches after its first build?
   - **For:** repeat switches to Creative arrive with the real world drawn, and no skeleton is needed.
   - **Against:** the GPU memory is held while in Professional mode.
   - **Recommendation:** decide after S8 measures its memory and idle cost.
2. **Total length.** 1.9 s main timeline (about 2.1–2.2 s click to rest), against today's 1.8 s. The extra 0.1 s pays for the portal beat.
3. **Phone portal.** Three frames and a shorter dolly, or the to-pro-style scan without a tunnel on phones?
   - **Recommendation:** three frames, then re-judge from a phone recording.
