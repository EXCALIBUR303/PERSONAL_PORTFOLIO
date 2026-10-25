# V6 stages A and B: corrections, evidence strips and exhibit fixes

Branch `stage-ab`, from `70ad823`. Nothing here changes the Precision Scanner or any transition file. The Studio Map, station cards, exhibit stage and Creative About changes are a later stage.

## What changed

### Stage A: polish
- **A1 Districts.** Each project now names its district (`district` in `src/data/projects.ts`): Systems 8, Algorithms 5, Intelligence 7. The Creative map reads that field instead of inferring a district from tags. The old rule produced 5, 4 and 11. `tests/registry.spec.ts` asserts the exact membership and the rendered map.
- **A2 Copy.** Statements that no longer matched the repository audit were corrected: AURA's AI and voice are no longer called "mocked"; the Penalty Shootout is described as an independent demonstration with no claim about the related repository; Cycoil's payment status is marked as requiring owner verification and the exhibit performs no transactions; Mazera's solvers are called independent re-implementations; repository counts in the README and VERIFICATION.md were corrected; registry test and runtime statements were updated to the audited values; the Student Burnout AI backend note was corrected.
- **A3 Evidence strip.** `src/data/evidence.ts` holds, for each of the 20 projects, a claim class, what ran, what was read, what was not checked, a caveat and the audited commit. The strip renders on every project page in both modes (`src/components/evidence-strip.tsx`) and as one line on the featured cards.
- **A4 Featured six.** SmartPark, Mazera, PathAble, AURA, Private Local AI and Predictive Maintenance. This changes emphasis only; no project's district or tags changed. The Professional list is ordered by district, then by whether something was executed.
- **A5 Professional hero.** One proof line under the introduction; the AURA part buttons sit behind a closed-by-default "Parts" disclosure; on desktop the copy column is top-aligned so the headline and both calls to action sit in the first screen. At 1440x900 the main call to action ends at 709 px and at 1280x800 at 666 px (measured in Chrome; before the change it ended at 903 px at 1440x900).

### Stage B: exhibits
- **B1 Private Local AI.** The equal-weight average was replaced by BM25 (k1 1.5, b 0.75, discriminative terms) and weighted Reciprocal Rank Fusion (1.0 and 0.5, K 20, keyword floor 0.35), as the project implements it. The meaning match is still a labelled word-overlap stand-in; no embedding or language model runs. `tests/retrieval-parity.spec.ts` compares the scene with the project's own tokenizer, BM25 and search run on the same sample passages (fused scores to 1e-9, identical ranks).
- **B2 AURA.** The default camera is turned off the deck diagonal so the companion no longer hides the hardware lab, and the stage is 4:3 from 1000 px. The scene shows no bridge method or event names, so none needed correcting. The bridge has 52 request methods and 18 push events at the audited commit.
- **B3 Caveats.** SmartPark: the second session is handed the next free bay; the check-then-write branch is illustrative. PathAble: fictional campus, simplified cost model (22 of 504 route queries differ from the project's own), hazard inference disabled in the project. Mazera: independent re-implementation; path lengths matched the original on 327 grids for BFS, Dijkstra, A* and Bidirectional; explored counts differ; DFS and Greedy do not guarantee shortest paths.
- **B4 Evidence panels.** Predictive Maintenance shows what was checked at commit 9bb3742. Robot Dog shows the audited benchmark values and the failing walk-fast foot-slip check.
- **B5 Parity re-run.** Mazera (54 and 273 grids) and PathAble (504 route queries) were re-run against the original solvers and routing engine with the network denied. Results matched the earlier audit: see "Parity".

## How it was checked

| Check | Result |
|---|---|
| `npm run lint`, `npm run typecheck`, `npm run build:static` | Pass |
| `algorithms.spec.ts` | 6 passed |
| `registry.spec.ts` (new) | 6 passed |
| `retrieval-parity.spec.ts` (new) | 1 passed |
| `transition.spec.ts`, `hero.spec.ts`, `modes.spec.ts`, `portfolio.spec.ts`, `universe.spec.ts` | See the note below |

**Browser suites are flaky on the machine used.** In full runs a few tests fail and pass when rerun, and the set that fails changes from run to run on both the untouched baseline and this branch, with Chrome logging display-link errors during the runs. Repeated runs (three to six per build) of the tests that failed most often showed failures on both builds at similar rates. This does not prove the changes have no effect on those tests; it means no deterministic regression was found.

**Looked at in a real browser (Chrome driven by Playwright, at 1440x900, 1280x800 and 390x844):** the Professional hero, the AURA scene at 1280 and 1440 px, an evidence strip on project pages in both modes, and a featured card. **Not checked:** Safari, Firefox, real phones, a screen reader, Lighthouse, and the Creative map after the district change beyond the automated test.

## Parity
- **Private Local AI:** the project's own `tokenize`, `_build_index`, `_bm25_scores` and `search` were run on the scene's five sample passages and three questions inside a sandbox with the network denied and writes confined; the scene matches on fused score, ranks and final order. The dense side is a rank-equivalent stand-in, so this does not say anything about real embeddings.
- **Mazera:** path lengths equal the original on 327 of 327 grids for BFS, Dijkstra, A* and Bidirectional; explored counts are not equal; DFS and Greedy are not shortest-path algorithms.
- **PathAble:** 482 of 504 route queries use the same node sequence as the project's engine; reachability agrees on 504 of 504.

## Open items
- Licences, teammate permissions and credit, and the model licence for AURA's companion remain open decisions; nothing here reuses another project's code or assets.
- Cycoil's payment status needs the owner to verify the deployed state.
- The Penalty Shootout's related repository needs an ownership, attribution and licence check before anything from it is used.
- Checks that need hardware, credentials, models or large downloads are listed in each project's evidence strip as "not checked".
