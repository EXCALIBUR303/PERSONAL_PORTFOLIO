# Mazera original application verification

Build completed 21 October 2026; browser and algorithm verification completed **22 October 2026 (UTC)** in the managed Debian Linux workspace. Collection: **Personal**, confirmed by the owner in this conversation.

## Source and distribution

- Original public repository: https://github.com/EXCALIBUR303/mazera-ai-maze-solver
- Exact source commit: [`6fad8eddc8ad8c5d216ff9eb11d11c270572fb24`](https://github.com/EXCALIBUR303/mazera-ai-maze-solver/tree/6fad8eddc8ad8c5d216ff9eb11d11c270572fb24).
- Clone and isolated dependencies: `work/v3-mazera/` (not committed with the portfolio).
- Distributable: `public/demos/mazera/`; launch URL `/demos/mazera/`.
- `demoType: "embedded"`; this is the **built original React application**, including its actual six solver functions. No replacement visualization or fabricated results are used.
- No authored source was modified. Only Vite's command-line asset base changes the generated asset URLs. The original source tracked diff is empty.
- Original repository has no LICENSE file or license declaration. Its owner expressly requested its inclusion in their own portfolio; that authorization supports this use, not a general open-source redistribution grant. Attribution and complete bundled-runtime notices (React, React DOM, Scheduler, Bootstrap, Lucide) are retained in `public/demos/mazera/THIRD-PARTY-NOTICES.txt`.

## Commands and environment

Repository `package.json` was read before install. It defines only `dev: vite`, `build: vite build`, and `preview: vite preview`. Installation lifecycle scripts were disabled.

```sh
# From the portfolio root, for a fresh checkout:
git clone --depth 1 https://github.com/EXCALIBUR303/mazera-ai-maze-solver.git work/v3-mazera
cd work/v3-mazera
git rev-parse HEAD
npm ci --ignore-scripts
npm run build -- --base=/demos/mazera/
# Development startup:
npm run dev -- --host 127.0.0.1 --port 3060
# Production-build startup (alternative):
npm run preview -- --host 127.0.0.1 --port 3060
```

For the actual distributed-path verification, the completed `dist/` files were copied to `public/demos/mazera/`, then served from the portfolio root:

```sh
python3 -m http.server 3060 --bind 127.0.0.1 --directory public
node work/v3-mazera/verify-demo.mjs
node work/v3-mazera/verify-iframe.mjs
```

The source SHA above must be checked when reproducing against a later default branch. Generated files are `index.html`, `mazera-mark.svg`, `assets/index-C72qdlNZ.js`, and `assets/index-CAXGzfiC.css`, plus the retained notices. JavaScript: 168,982 bytes; CSS: 29,953 bytes. Vite rewrote the favicon, script and stylesheet URLs correctly under `/demos/mazera/`.

- Node: `v24.19.0`; npm: `11.9.0`; locked Vite: `5.4.21`.
- Browser: preinstalled `/usr/bin/chromium`, Chromium `154.0.8037.57`, Debian GNU/Linux 13.
- Playwright: existing portfolio installation; no browser was downloaded or installed.
- Required environment variables: **`[]`**. No backend, database, API token or network inference service is needed.
- Optional test override: `CHROMIUM_PATH` selects an already installed browser executable.
- Managed network policy checked through the Cloud Environment runtime skill/tool. GitHub/npm permitted; Google Fonts is not in the selected environment's allowed destinations.

## Results

| Check                                    | Status              | Evidence                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Locked dependency install                | Passed              | `npm ci --ignore-scripts`: 66 packages installed.                                                                                                                                                                                                                                                                        |
| Original production build                | Passed              | 1,578 modules transformed; Vite completed successfully.                                                                                                                                                                                                                                                                  |
| Repository automated tests               | Not supplied        | Original package has no test script or test files.                                                                                                                                                                                                                                                                       |
| Direct algorithm execution               | Passed              | 168 runs: six solvers × four maze generators × seven offered grid sizes (10, 15, 20, 25, 30, 40, 50). Each run returned a successful wall-free, adjacent-cell path ending at the goal; BFS, Dijkstra and A* agreed on shortest path length. Random generator received one generated maze per size in this bounded check. |
| Original UI workflow                     | Passed              | All six algorithms selected and solved; visible final path, completed status and metrics verified. All four generators exercised. A* Euclidean heuristic selection exercised.                                                                                                                                            |
| Animation controls                       | Passed              | Pause, resume, stop, and restart exercised.                                                                                                                                                                                                                                                                              |
| Browser history                          | Passed              | Six completed runs stored; four recent cards displayed; reload retained history; clicking a recent maze restored its 10×10 grid.                                                                                                                                                                                         |
| Standalone runtime                       | Passed              | No JavaScript page errors or HTTP error responses from application asset requests.                                                                                                                                                                                                                                       |
| Iframe `allow-scripts`                   | Failed              | Opaque origin `null` blocked the Vite module and cross-origin stylesheet under normal static-server CORS settings. Source also writes history to localStorage without catching storage errors.                                                                                                                           |
| Iframe `allow-scripts allow-same-origin` | Passed              | Original app loaded, generated and solved a maze, displayed a final path and saved history.                                                                                                                                                                                                                              |
| Mobile layout                            | Existing limitation | At viewport 390×844, original document scroll width is 1,049px. Original app needs horizontal scrolling; wider view/new-tab launch is preferable.                                                                                                                                                                        |

The six recorded UI runs on 10×10 grids were BFS/Open Field (14-step path), DFS/Random (16), Dijkstra/Spiral (14), A*/Zigzag (24), Greedy/Open Field (14), and Bidirectional/Random (14). These are observations from this run, not fixed benchmarks; random generation and timing vary.

Browser evidence retained locally:

- `work/v3-mazera/verification-results.json`
- `work/v3-mazera/iframe-results.json`
- `work/v3-mazera/mazera-original-desktop.png`
- `work/v3-mazera/mazera-original-mobile.png`
- `work/v3-mazera/mazera-original-iframe.png`

## Integration and remaining limits

Use the original-app iframe only after the visitor chooses to load it; set `sandbox="allow-scripts allow-same-origin"`. Both permissions are needed for the unchanged app and its browser-local history. Because this is same-origin trusted owner code, that combination is **not a strong security isolation boundary**. Keep the external/source link and the `/demos/mazera/` new-tab launch available. The original app writes only its `mazera-history` storage key in the inspected source.

The original stylesheet imports Google Fonts. That optional request failed under the managed environment policy; the application continued with fallback fonts. The screenshots show that fallback rendering. Font requests may work on other hosts; this build does not claim complete offline font fidelity. No attempt was made to bypass network policy.

Source-level caveats are preserved: “AI” denotes classical search rather than a neural model; the “Memory Usage” chart computes explored nodes plus path length, not measured memory bytes; DFS and Greedy do not promise shortest paths; the A* insight text always says Manhattan even when Euclidean is selected; the original “Step” button invokes replay rather than single-step execution. These were not altered because this task packages the original application.

No remote deployment was performed. The static demo is ready for the portfolio's normal build/static hosting path. This execution report supersedes the V2 audit's earlier statement that Mazera was inspected without running the original application.
