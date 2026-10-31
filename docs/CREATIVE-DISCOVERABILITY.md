# Creative Mode discoverability

Branch `creative-mode-discoverability`, cut from production `main` (`faff874`). **Nothing is committed, pushed or deployed.**
A small, focused change: the mode switch keeps its words at every width it can, and a first-time visitor gets one quiet pointer
to Creative Mode. The transitions, the ambient motion and the rest of the navigation are as they were.

## What changed

| File | Change |
| --- | --- |
| `src/components/mode.tsx` | Each option carries a full label and a short one (`Pro`). New `CreativeHint` (the one-time tip). The switch is wrapped so the tip can sit under it. |
| `src/app/modes.css` | Tiers for the switch (full labels, short labels under the icons, icons alone); the inactive Creative option is tinted lime; the tip's styles; the wordmark steps down on phones. |
| `src/app/globals.css` | The desktop links give way to the menu at 1020 px (was 760 px); gaps between the header's parts tighten at 1100 px and below; "Let's talk" never wraps. |
| `src/app/creative.css` | The brand pill steps down at 400 px and below so the labelled switch fits. |
| `tests/mode-discovery.spec.ts` | 38 new tests (below). |
| `docs/creative-discoverability/` | Before and after screenshots. |

## The switch, width by width

Measured from the live header (every 10 px from 320 to 1440, both modes: no overlap, no clipped edge, no horizontal
scroll, "Let's talk" on one line). Pro mode shown; Creative mode's header has the same tiers.

| Width | Before | After |
| --- | --- | --- |
| 1440, 1280 | words and icons (245 px) | same |
| 1100 | icons only (78 px) | words and icons (237 px); links and switch have 57 px between them |
| 1024 | icons only | words and icons; gaps tightened, "Let's talk" stays on one line |
| 900, 768 | icons only | words and icons; the links move into the menu button (the same menu the phone uses) |
| 541 to 760 | icons only | words and icons |
| 390, 360 | icons only (the menu button was 12 px past the page padding at 390 and past the screen edge at 360) | short words under the icons (`Pro`, `Creative`), 99 px wide, everything inside the padding |
| 350 to 540 | icons only | short words under the icons |
| 320 to 349 | icons only; the menu button was cut off at the right edge | icons only (nothing else fits), now inside the screen |

The breakpoint was not simply moved to 1000 px: with the links and "Let's talk" in the row, words do not fit at 900 px
(there are 37 px to spare). The links therefore fold into the menu below 1020 px, and the switch gets the room.
**That is the one navigation change**: tablets (761 to 1020 px) now get the menu button where they had the links.
The same menu, the same four links; it opens under the header (checked).

Visual: the active option is filled (ink for Professional, lime with a ring for Creative). The inactive Creative option
carries a pale lime tint, in the colour it takes when chosen: a quiet pointer rather than a button. No glow, no motion.

## The first-visit tip

> Discover Creative Mode — explore my projects in an interactive 3D studio.

- **When.** About 1.4 s after the page loads, only if the mode is Professional, `portfolio-mode` has never been stored
  (a stored value means the switch has been used, so a returning visitor never sees it) and `portfolio-creative-hint`
  is not set. Showing the tip writes that second key, so it appears once per browser. That is the only new storage key.
  If storage is blocked nothing is shown (it could not be limited to once).
- **Where.** Under the switch, right-aligned to it, with a small pointer toward Creative. 268 px wide at most, and within
  the screen on a 320 px phone. It covers the hero's top edge briefly, never the header, the links or "Let's talk".
- **Dismissal.** A tap or click anywhere else, Escape, Alt+M, its close button, any mode change, or about 8 s. The timer
  holds while the pointer is over the tip or focus is inside it. Gone for good afterwards.
- **Accessibility.** Not announced by moving focus (focus is never taken). The same text is sent once through the
  existing polite live region (`#mode-announcer`); the Creative button is described by the tip for as long as it shows;
  the close button is a labelled native button, 26 px. Keyboard order: the switch, then the tip's close button.
- **Motion.** A 0.25 s fade, and none at all under `prefers-reduced-motion`. No bounce, no loop.

## Tests

`tests/mode-discovery.spec.ts`, 38 tests: the tip appears once and describes the Creative option, covers nothing, and does
not take focus; dismissal by tap, Escape, close button (keyboard), switching, and the timer; hover holds the timer;
returning visitors (a stored mode in either mode, a seen tip, blocked storage) see nothing; reduced motion has no
animation; the labels are in the expected style with no overlap, clipping or scroll at 13 widths in each mode; the tip
fits inside 390, 360 and 320 px phones; both transitions from the labelled switch at desktop and phone widths; the menu
at 900 px; an axe check (WCAG 2.2 AA) with the tip on screen at desktop and phone width.

### Results (this machine, final build)

| Browser | Whole suite (255 tests: 217 existing + 38 new) |
| --- | --- |
| Chrome for Testing (Chromium engine), final code | **255 of 255** (217 existing + 38 new) |
| Firefox | 245 of 254 in the full run before the last two additions: the 2 clipboard tests, 6 frame-rate-sensitive ambient tests, 1 pointer-lean test (below) |
| WebKit | 239 of 254 in that run: 15 failures, all existing or load-related (below) |

The 38 new tests pass in all three engines (Chromium, Firefox and WebKit, each 38 of 38).

Firefox and WebKit **failures in the full runs are not caused by this change**: the Firefox ambient and pointer-lean tests
and four WebKit tests measure the browser's frame rate and read 16 to 18.5 draws a second against a threshold of 20 here
while the Mac's WindowServer and the desktop app are busy. I built the deployed `main` (`faff874`) separately and ran the
same tests against it at the same time: identical failures, identical numbers. The two clipboard tests (Playwright's
Firefox and WebKit cannot grant `clipboard-read` and `clipboard-write`) and the WebKit "direct route" and quick-view tests were
already failing before this branch.

## Not changed

The scanner transitions (the choreography, the 30 draws/s ambient rate, Pause motion and reduced motion are untouched; the
suite's transition and ambient specs pass on Chromium), the navigation's content and the design language.

## Limitations

- On the smallest phones (320 to 349 px) there is room only for the two icons; the tip is what names Creative Mode there.
- 761 to 1020 px now uses the menu button in Professional mode, as it already did in Creative mode below 1080 px.
- No real phone, Safari.app or Edge; Playwright's WebKit stands in for Safari. Tab order on Safari skips buttons unless a
  system option is on, so the keyboard test places focus directly and presses Enter.
- The tip is dismissed for good when shown, so a visitor who reloads within a second of seeing it does not see it again.
