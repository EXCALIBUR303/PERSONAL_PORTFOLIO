# Stage C3 — Phase 3 report: panel, type and tablet toolbar

Done (Sonnet 5.5 Medium):
- **Panel:** docked width 372 → 328 px. Purpose line moves from serif italic to the body face; the "Exhibit:" line leaves monospace. The problem, what-I-built, technologies, limits and (for briefings) the concept sketch now sit behind a **"More about this project"** disclosure, using only fields the project registry already has. The evidence chip and caveat, team-project note and actions stay visible. The four-step route disclosure is unchanged.
- **Tablet toolbar (768–1199 px):** one row. The search field shrinks, and "Next unexplored station" and the Map/List words stay available to screen readers only.
- **Tablet stage height:** 68vw → 74vw (max 760 px), so squarish stages use more of their height.

Verified: lint, typecheck and static build pass; Playwright 142 of 142 pass. Screenshots checked at 1440, 1000 and 820 wide.

Not done (deferred, with reasons):
- **In-stage bottom sheet on tablets, and a bottom sheet on phones.** Tablets still open the panel under the stage; phones keep the district strips. The spec's sheet needs the camera fit to reserve space at the bottom, which is camera work, so it moves to Phase 4.
- **Plate leader lines:** not implemented.
- **Chips:** the badge row still shows three chips, because existing tests assert their content.
- **Search field:** its placeholder is truncated at 820 px.
- No axe scan was run separately beyond the existing suite; no manual screen-reader check.
