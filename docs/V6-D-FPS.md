# Frame rate: is 60 FPS a cap?

## Finding
No. Nothing in the world caps the frame rate at 60.
- The 3D canvas uses react-three-fiber's `frameloop="demand"`. Frames are driven by the browser's `requestAnimationFrame`, so they arrive at the display's refresh rate, and only when something moves (a flight, a reaction, a hover). There is no `setInterval`, no fixed 16.7 ms timer and no frame limiter in the code.
- Motion is time-based. Reactions advance by `useFrame`'s `delta` (clamped to 50 ms, so a long pause cannot make a jump), the camera rig steps by real elapsed time (clamped the same way), and the CSS layers (cloud shadows, sun sweep) run on the compositor. Speed is therefore the same at 60, 90, 120 or 144 Hz.
- The shadow map is deliberately redrawn at most about 33 times a second (`SHADOW_INTERVAL`, 30 ms) while something that casts a shadow moves. That is a power saving, not a cap on the frame rate: the camera still moves at the display rate.
- The earlier "60 FPS" result is the display and test browser, not the renderer: this Mac's built-in display is a 60 Hz Liquid Retina panel and Chrome's `requestAnimationFrame` measured 60 Hz (59 to 60) on it.

## What changed
`Adapt` (the pixel-ratio governor) used a fixed 26 ms threshold, which is right for 60 Hz and wrong for faster displays. It now reads the refresh interval from the fastest steady gap between frames (clamped to 60 to 144 Hz) and lowers the pixel ratio when frames average more than 1.55 intervals: 26 ms at 60 Hz, 13 ms at 120 Hz, 8 ms at 144 Hz. It still never raises the ratio, and a display below 60 Hz is judged as 60. Frames closer than 4 ms are ignored as not being real frames.

## Measured (Apple M5, Chrome for Testing, 60 Hz display)
- Steady state and district switches: the median and 95th-percentile frame gap are 16.7 ms (60 Hz); no frame over 33.4 ms in the final unthrottled runs.
- Render cost per frame, drained with a one-pixel read after each frame (`__world.bench`, which includes that sync), scene only / with the shadow pass:

| View | Pixel ratio | Scene | With shadows |
|---|---|---|---|
| Desktop high tier | 2 | 8.3 to 8.7 ms | 9.6 to 11.5 ms |
| Desktop high tier | 1 | 5.8 to 6.6 ms | 6.7 to 7.2 ms |
| Desktop medium tier | 1.5 | 6.3 to 7.5 ms | 3.2 to 8.1 ms (noisy) |
| Phone width, medium tier | 1.5 | 3.4 to 4.3 ms | 2.4 to 2.6 ms (noisy) |

A 120 Hz frame is 8.33 ms. Read as a guide only: at pixel ratio 2 the high tier's camera moves (no shadow pass) sit right at that budget and frames that redraw shadows exceed it; at pixel ratio 1 and on the medium tier there is headroom. The sync read makes these upper-ish bounds, and the shadow column is noisy because the run order changes what the GPU has warm.

## Not verified
- 90, 120 and 144 Hz were **not** tested: no high-refresh display or browser exposing one was available. `--disable-frame-rate-limit` and `--disable-gpu-vsync` did not uncap `requestAnimationFrame` on macOS (59 to 60 Hz either way).
- Nothing here claims 120 FPS. The verified result is 60 FPS on a 60 Hz display; the code is built not to prevent more.
- Power and heat were not measured.
