# Mode transition: the Precision Scanner

The switch between Professional and Creative mode is one controller,
`worldShift()` in `src/lib/world-shift.ts`. It picks how to animate each switch:

| Style | When | What it is |
| --- | --- | --- |
| `scanner` | default | The Precision Scanner described below |
| `portal` | `?transition=portal` or localStorage `portfolio-transition = "portal"` | The earlier 3D portal ride, kept for comparison |
| `ring` | the chosen layer is not available | A circle revealing the new page from the switch |
| none | reduced motion, or no View Transitions API | The mode just changes (a short cross-fade without View Transitions) |

## What the visitor sees

The two directions differ in geometry, not just in order.

**Professional → Creative: outward assembly**

- **Cue:** a reticle locks onto the switch and a line reaches for the centre. This plays on the live page before anything is captured.
- **Aim:** an aperture assembles at the centre: dial, ticks, iris and inner ring. A crosshair, corner brackets and a frame draw in toward it. Small markers light up on the page's own grid, radiating from the centre.
- **Scan:** the aperture opens. Its vertical diameter becomes two scanners that sweep outward.
  - The Creative page is revealed inside the widening slit.
  - Behind the scanners, grid lines break into dashes and then into coloured paper dots, and soft colour fields bloom.
  - Each grid marker is released as a scanner passes it and flies on an arc to a place in a Creative form: an asterisk, a scribble, a sticker ring or loose confetti. It changes from an ink or cobalt marker into a coloured, outlined 3D shape.
- **Settle:** the camera pulls back a little and the field turns, giving the forms depth. Then they dissolve and the overlay clears.

**Creative → Professional: inward convergence**

- **Cue:** the reticle locks onto the switch, and colourful 3D shapes pop up in the Creative forms.
- **Aim:** a wide, loose ring contracts into the aperture and the shapes drift toward it. Two scanners draw in at the left and right edges, and the camera comes forward.
- **Scan:** the scanners close in from the edges.
  - The Professional page appears behind them, outside the closing slit, while the Creative page inside it is compressed and drained of colour.
  - Behind the scanners, dots draw into dashes and then into the blueprint grid. The crosshair is laid down as they pass.
  - Every shape is caught as a scanner passes it and snapped onto the nearest node of the page's real grid.
- **Settle:** the scanners meet, the iris locks and the corner frame snaps in. The grid markers fade from the centre outward.

**In both directions**

- **Shared elements:** the header and any project cards on screen keep their identity and move to their new places. Each one moves as a scanner passes it, not all at once.
- **Interface arrival:** the new page's main blocks arrive the same way: Creative's districts and stations pop in, and Professional's hero copy and scene panel align.

## Timing

| Beat | Time |
| --- | --- |
| Cue | 0.12 s (`CUE_SECONDS`) |
| Snapshot capture | about 45 ms on an Apple GPU (measured) |
| Main timeline (`SCANNER_SECONDS`) | 1.45 s: aim 0 to 0.2, scan 0.2 to 0.74, settle 0.74 to 1 (`PHASES` in `src/lib/transition/state.ts`) |
| Click to rest | about 1.65 s (measured) |

## The contract

`src/lib/transition/state.ts` holds the shared state. **Two numbers drive everything:**

- `cue` runs from 0 to 1 before the snapshot is taken.
- `progress` runs from 0 to 1 during the transition.

Renderers are pure functions of them and of `direction`, so any frame can be reproduced by setting them. GSAP moves both in straight lines; all easing lives in the renderers.

- **`slit(width, progress)`:** where the two scanners are.
- **`passProgress(x)`:** the moment a scanner passes x. Particles, shared-element morphs and interface arrivals all use it, so they agree with the line the visitor sees.

## Who owns what

| Owner | Job | Where |
| --- | --- | --- |
| GSAP | Master timeline; moves `cue` and `progress`; paints the `--sc-*` CSS variables | `src/lib/transition/scanner.ts` |
| View Transitions + CSS | The two page snapshots: slit clip, scale, filter; the shared-element morph | `world-shift.css` |
| Anime.js | Every drawn stroke in the frame: reticle, aperture, crosshair, corners, scanner lines. Two paused timelines that GSAP seeks | `src/components/scanner/scanner-frame.tsx` |
| React Three Fiber | Particles (instanced, lit and outlined), the background band shader, the camera | `src/components/scanner/scanner-canvas.tsx`, `particle-layout.ts` |
| Motion | The new page's blocks arriving as the scanner passes them | `src/components/shift-intro.ts` |

GSAP's lag smoothing is off. GSAP shares the clock with the browser's own transition animations, which run in real time, so a slow device skips frames but stays in step.

## Lifecycle and safety

The run moves through five states:

1. **Start.** `transition.running` is set, `data-scanner` goes on `<html>` and the cue tween plays.
2. **Capture.** `startViewTransition` takes the old snapshot and renders the new page.
3. **Run.** `transition.started` is set and the main timeline plays.
4. **Finish.** The view transition's `finished` promise clears every attribute, variable, injected style and morph name.
5. **Cancel.** A new switch, or a failed transition, clears the same things immediately.

The page is protected throughout:

- **Pointer:** the overlay is `aria-hidden` and has no pointer events, so it never blocks the page.
- **Focus:** a keyboard switch keeps focus on the same option in the new header.
- **Announcement:** `#mode-announcer` announces the new mode.
- **Section:** the visitor stays at the same section of the page.

## Performance

- **Frame layer:** the SVG frame is always ready.
- **Particle layer:** the WebGL particle layer loads on intent (pointer or focus at the switch) or once the page settles. It also warms Creative's fonts.
- **No loading during a run:** neither the particle layer nor any scene's 3D canvas starts loading while a run is in progress. A new canvas compiles on the GPU, and the browser waits for that before it can show the new page; created mid-run, the AURA canvas held the transition up by about a second. Scenes therefore show "Preparing the 3D view…" until the run ends.
- **Particle counts:** 168 on desktop, 120 on tablets, 84 on phones. Each kind is one instanced mesh plus one outline mesh.
- **Low-power fallback:** without WebGL, or on devices that report at most 2 GB of memory or 2 cores, or that ask to save data, the scanner runs with its drawn frame only.
- **Rendering cost:** DPR is capped at 1.5, and the canvas renders only during a run.
- **Measured:** in the built-in browser on an Apple GPU (1024 × 768 viewport, DPR 2), six warm runs took 1.63 to 1.67 s from click to rest. The median frame was 16.7 ms and the 95th percentile about 18 ms, with one 50 to 67 ms frame per run at the capture.

## Not verified

- **Cold first switch:** the first switch after a fresh page load, before the visitor has pointed at the switch, was not re-measured after the deferral and font warming were added. Before them it could stall for about a second.
- **Browsers:** not tested in Safari or Firefox. Where the View Transitions API is missing, the modes cross-fade instead.
- **Devices:** no real phone has been tested; phone widths were checked in headless Chromium only.

## Testing

`tests/transition.spec.ts` covers:

- both directions and their cleanup
- search, filters and section surviving the switch
- rapid switching
- keyboard focus and the announcement
- reduced motion
- loading on intent
- the WebGL-free run
- the portal opt-in

In development, `window.__worldShiftGsap` and `window.__transition` allow frozen-frame capture: pause GSAP, step the cue, then scrub the main timeline.
