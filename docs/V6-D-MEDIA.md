# Project demonstration videos

## What exists now
- `src/data/demo-media.ts`: a capture plan for all 21 projects (workflow, shots, source, automatic or manual capture, poster need, status, limitation). The demonstration class of each project is read from `demo-class.ts`, not stored twice.
- `src/components/demo-video.tsx`: the shared player, shown at the top of every project's "Try" section in both modes. A 16:9 frame with a poster, play and pause, native captions, full screen and a link to the full page and (for public repositories) the source. Nothing loads before play (`preload="none"`, and the video element is not even mounted until then), nothing autoplays, and a video without its poster and captions is never shown. If the file is missing or fails, a card says what the recording will show.
- Today every record is `planned`, so every page shows the honest "Video in preparation" card. No video has been produced.
- Checked: the player was run with a synthetic 3-second clip, poster and captions (then removed): only the poster loaded before play, the clip and caption track loaded on press, pause worked. The test suite checks all 21 records, the 16:9 frame on project pages in both modes, and that no video loads.

## Capture plan summary
| Capture | Projects |
|---|---|
| Automatic (scripted browser run of the portfolio's own exhibit, world view or architecture explorer) | 16: SmartPark, PathAble, AURA, Private Local AI, Predictive Maintenance, Last Mile, ParkScan, SWARMMIND, Robot Dog, NEXUS, AERIS, Resume Screener, Cycoil, RupeeRise, Student Burnout AI, SIGSMITH (AERIS, Resume Screener, Student Burnout AI and SIGSMITH as clearly labelled walkthroughs) |
| Mixed (a scripted clip plus a recording the owner must make) | Mazera (original app), Penalty Shootout (the Penalty Kings game), Campus Green Mobility (Tomcat and MySQL) |
| Manual (needs the real application running locally on sample data) | LifeOS, Burnout AI backend |

Lengths: the six featured projects about 45 seconds, nine supporting about 20, six briefings about 12.

## Size and bandwidth (estimate, not measured)
Total planned running time is about 522 seconds. At 720p H.264 and 0.8 Mbps that is about 52 MB; at 1.5 Mbps about 98 MB. Posters add about 2 MB. Because each video loads only on play, a visitor downloads one clip, not the set, but the files would all ship in the static deployment. Decide before production: (a) keep to about 50 MB at 0.8 Mbps and commit the files, (b) host the files outside the static bundle (needs your approval; no third-party video platform has been added), or (c) record only the featured six first. Deployment-size limits were not checked.

## Order of production (nothing is recorded yet)
1. Content and exhibits stable (done for this branch once reviewed).
2. Scripted captures of the automatic projects, with captions written from the shots list.
3. The manual and mixed recordings, only after the owner runs those applications on sample data.
4. Publish files, posters and captions together, set `status` and the three paths; the player then appears.

Rules: real captured output only; no generated footage of anything not built; design-stage projects say so on screen; no autoplay with sound.
