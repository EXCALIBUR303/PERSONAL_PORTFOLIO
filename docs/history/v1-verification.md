# Verification — Form & Function

Verified on 21 October 2026 using Node.js 24.19.0 and Chromium 154 in the managed build environment.

The visitor story is: open the portfolio → explore real HTML content and the optional 3D enhancement → filter concept projects and inspect their details → try the color experiment → prepare an email draft. Profile and project data are local TypeScript modules. There is no API, database, or delivery service in this flow.

## Build and static checks

- `npm run lint`: passes.
- `npm run typecheck`: passes with strict TypeScript.
- `npm run build`: normal Next.js production build supported.
- `STATIC_EXPORT=1 npm run build`: passes and emits the static `out/` deployment.
- Next.js 16.4.2, React 19.3.1, React Three Fiber 9.8.2, Drei 10.7.9, Three.js 0.185.1, and Motion 14.5.0 installed together without peer incompatibilities. The committed npm lockfile records exact dependencies.

## Browser checks

The 16 Playwright cases verify:

1. All primary sections render, internal section destinations exist, and no page-level JavaScript errors occur.
2. All category filters select the correct projects and restore the full collection.
3. Project details open by keyboard, trap focus in a native modal, close with Escape, and restore focus to the trigger.
4. Mobile menu opens, closes with Escape, restores focus, and navigates to a section.
5. No horizontal overflow or clipped headings/buttons at 320px.
6. The same layout check at 375px.
7. The same layout check at 768px.
8. The same layout check at 1024px.
9. The same layout check at 1440px.
10. The same layout check at 1920px.
11. Color Field palette selection, keyboard slider adjustment, pause, and reset.
12. Required contact input validation and an actual `.eml` draft download, with explicit “nothing was sent” feedback.
13. CSS fallback without WebGL, and the reduced-motion experiment state.
14. Automated WCAG 2 A/AA and WCAG 2.1 A/AA checks on both themes.
15. A real WebGL canvas loads on desktop and its pause/play controls respond without page-level errors.
16. Touch devices initially defer the WebGL scene and successfully load it after “Try in 3D”.

The HTML/interaction cases deliberately disable WebGL to exercise the graceful fallback independently. The two dedicated WebGL cases use separate, GPU-capable browser contexts. Browser binaries are test tooling, not an application requirement.

Desktop and mobile compositions were also visually inspected. The GPU scene, responsive recomposition, local previews, and major sections were checked in rendered Chromium, not inferred only from source.

## Measured mobile Lighthouse results

Lighthouse **13.5.0**, default mobile emulation, simulated slow 4G (~1.6Mbps, 150ms RTT), 4× CPU slowdown. The production static export was served locally with gzip for text assets and immutable caching for hashed Next.js assets, representative of production CDN delivery. No browser tests or builds ran during this measurement.

| Category       | Score |
| -------------- | ----: |
| Performance    |    90 |
| Accessibility  |   100 |
| Best practices |   100 |
| SEO            |   100 |

| Metric                   | Measured value |
| ------------------------ | -------------: |
| First Contentful Paint   |           1.2s |
| Largest Contentful Paint |           2.8s |
| Total Blocking Time      |          270ms |
| Cumulative Layout Shift  |              0 |
| Speed Index              |           2.3s |

The run completed without Lighthouse warnings. The raw report is retained in `docs/lighthouse-mobile.json`. This is one local lab measurement, not a guarantee of hosted or real-user performance. LCP remains above the 2.5s “good” threshold in this simulated mobile run. TBT is a lab diagnostic, not measured field INP.

On touch devices the default product experience uses the CSS sculpture until the visitor opts into WebGL. The mobile score therefore describes this initial experience; it does not claim the same score with 3D activated. Desktop WebGL and mobile activation were functionally verified separately. Actual GPU performance depends on the device.

An earlier software-rendered WebGL audit timed out, motivating the mobile opt-in behavior and a 30fps idle-render cap. An uncompressed Python preview also produced a lower score, so the final performance result explicitly uses compressed delivery. No performance score is claimed for the private hosted deployment or for desktop Lighthouse.

## Boundaries and limitations

- Personal identity, education, experience, availability, social links, and project ownership are editable placeholders. Concept studies are visibly identified and their details explain their illustrative status.
- Missing project destinations show explanatory text. Missing social links are text, not fake destinations.
- No contact address was supplied. The template downloads a local draft. Adding a real address enables mailto and copy-email; there is no server delivery or claim that a message was sent.
- Clipboard behavior requires HTTPS or localhost and is intentionally unavailable until a real address is configured.
- Automated accessibility results do not establish complete conformance. Manual checks here cover visual layout and primary keyboard interactions, not every browser, screen reader, or device.
- The build is compatible with standard Next.js hosting, including Vercel; no Vercel account deployment is claimed. The provided private Sites link is a separate static deployment.
