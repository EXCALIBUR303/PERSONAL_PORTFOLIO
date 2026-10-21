# Form & Function

A complete, editable creative developer portfolio. Built with Next.js App Router, strict TypeScript, React, Tailwind CSS 4, Motion, Three.js, React Three Fiber, Drei, and Lucide. Fonts and artwork are local; no external image or font services are required at runtime.

## Start locally

Requires Node.js 20.9 or newer (Node 22 or 24 recommended) and npm.

```sh
npm ci
npm run dev
```

Open **http://localhost:3000**. For production:

```sh
npm run lint
npm run typecheck
npm run build
npm run start
```

The normal build runs with the standard Next.js production server and is compatible with Vercel. No database, authentication, API key, or `.env` file is needed.

## Make it yours

Edit **`src/data/profile.ts`**:

- Name, initials, role, three headline lines, introduction, availability.
- About, background, current focus, and interests.
- Skills grouped by purpose; the template list is illustrative, not a proficiency claim.
- Education, experience, and milestones in `journey`.
- A real email address and social destinations. Leave missing values `null`.
- SEO title, description, and absolute production origin in `site`.

Edit **`src/data/projects.ts`** for project titles, descriptions, categories, technology lists, featured flags, detail text, preview style, and verified URLs. The four included entries are **original illustrative concept studies, not completed personal or client projects**. Their missing links render explanatory text, never dead navigation buttons. Set `placeholder: false` only for your real work. Categories are defined in the same file; keep the category union, category list, and data consistent if adding categories.

The previews in `src/components/project-preview.tsx` are custom HTML/CSS compositions. Replace a preview with your own local optimized image when available; include dimensions and descriptive alt text. Update `public/opengraph-image.png` and the wordmark in the header/footer if changing the identity. Font files are in `public/fonts`; their licenses are in `public/fonts/licenses`.

Design tokens, responsive layouts, and reduced-motion rules live in **`src/app/globals.css`**. Named animation presets live in **`src/components/motion-config.ts`**; Motion features load separately through `motion-features.ts`. The theme toggle changes the current session; it intentionally does not store cookies or preferences.

## Features

- Pointer-responsive violet knot with physically based material, local environment lighting, and lightweight satellites.
- Lazy-loaded 3D bundle; capped pixel ratio (1–1.5); demand rendering capped at 30fps; pauses when offscreen, the document is hidden, or the user presses Pause. Reduced motion gives a static 3D composition.
- CSS sculpture before WebGL initializes, when WebGL is unavailable, or if the 3D renderer fails. Touch and data-saving devices start with the lightweight CSS composition and can opt into WebGL with **Try in 3D**. Desktop loads it automatically.
- Responsive section navigation, active section markers, mobile disclosure menu, Escape support, and skip link.
- Animated category filtering, restrained desktop pointer tilt, and on-demand native project dialogs with focus trapping, Escape, and trigger focus restoration.
- Keyboard-accessible Color Field experiment with three palettes, a spread slider, pause, and reset. CSS animation stops for reduced motion.
- Semantic HTML, visible focus indicators, explicit placeholder content, local fonts, and no scroll hijacking.
- Metadata, Open Graph image, favicon, robots, and sitemap. Set `site.url` to your final origin when moving hosts. A missing origin produces an empty sitemap rather than a fabricated domain.

## Contact behavior

The template starts with `profile.email: null`:

- Direct email and copy-email are unavailable, clearly labeled.
- Required name, email, and message inputs use browser validation plus whitespace validation.
- **Prepare a message** downloads a local `.eml` draft. The feedback explicitly says there is no configured recipient and nothing was sent. No message is transmitted or stored by this site.

After adding a real `profile.email`:

- Direct email uses `mailto:`.
- Copy-email uses the Clipboard API with confirmation and a failure message. Clipboard access requires HTTPS or localhost.
- The form prepares a `mailto:` draft with the entered message. The visitor reviews and sends it in their email app. Success text never claims delivery.

There is no contact backend. A fully server-submitted form would require a configured delivery service and server-side validation; do not put a private key in browser code.

## Verification

The Playwright suite covers navigation, filtering, keyboard dialog behavior, mobile menu, six viewport widths (320–1920px), the Color Field controls, form validation and draft download, reduced motion, no-WebGL fallback, dark/light automated WCAG checks, and real WebGL loading/pause controls.

Start a production server on port 3001 in another terminal:

```sh
npm run build
npm run start -- --port 3001
npm run test:e2e
```

By default the test configuration uses `/usr/bin/chromium`, available in the build environment. On another machine, use an installed Chromium executable:

```sh
CHROMIUM_PATH=/absolute/path/to/chromium npm run test:e2e
```

Or install Playwright Chromium with `npx playwright install chromium` and set `CHROMIUM_PATH` to its executable. Set `TEST_BASE_URL` to test another running instance. Browser binaries are not needed to run the application.

Automated accessibility checks complement manual keyboard and visual inspection; they do not establish complete accessibility conformance. See `VERIFICATION.md` for actual measured results and limits.

## Deployment

### Vercel

Import this directory into Vercel, select the **Next.js** framework preset, leave the build command as `npm run build`, and do not set an output-directory override. No environment variables are required. Update `site.url` to the final production origin and redeploy. No Vercel-specific runtime APIs are used.

### Static hosting

All application interactions work in a static export:

```sh
STATIC_EXPORT=1 npm run build
```

Upload the generated **`out/`** directory to your static host. `STATIC_EXPORT` is a build switch, not a secret. With Node.js on Windows use PowerShell's `$env:STATIC_EXPORT='1'` before the build. The tracked `.openai/hosting.json` identifies this task’s private Sites deployment and its `out` directory. Remove the project identity before registering a separate copy as a new Site.

## Structure

```text
src/app/                  App Router page, layout, global CSS, robots, sitemap
src/components/           Focused hero, WebGL sculpture, projects, dialog,
                          contact, Color Field, and shared motion/UI components
src/data/                 Central profile and project configuration
public/                   Original social preview, icon, local fonts/licenses
tests/                    Browser interaction and accessibility regression tests
```

## Troubleshooting

- **Port already in use:** `npm run dev -- --port 3002`.
- **3D absent:** the CSS fallback is intentional when WebGL is unavailable. Check browser graphics settings or the console; the rest of the page stays usable.
- **Static sculpture:** check reduced-motion settings, Pause, tab visibility, and whether the hero is in view.
- **Clipboard fails:** use HTTPS/localhost or select the visible email address manually.
- **No email is sent:** this is a draft-based contact flow. Configure a real address and send from your email application.
- **Wrong social metadata:** set the absolute `site.url` and rebuild; update the PNG when personalizing.
- **Node or dependency failures:** use the supported Node version and `npm ci` with the committed lockfile. Avoid mixing package managers.
- **Playwright browser not found:** set `CHROMIUM_PATH` to a real Chromium executable as described above.
