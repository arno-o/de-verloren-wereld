# De Verloren Wereld

Interactive installation built with Vite, GSAP, and Lottie. This build is designed to work fully offline once assets are bundled into `dist/`.

## Offline build & use

1. Build the project (copies all assets to `dist/assets`).
2. Serve the `dist` folder locally for the best offline experience (recommended), or open `dist/index.html` directly if your browser allows local module execution.

### Double-clickable offline usage (macOS)

1. Run `npm run build` once to generate `dist/`.
2. Double-click `offline-start.command`.
3. Open `http://localhost:4173` in a browser.

### Double-clickable offline usage (Windows)

1. Run `npm run build` once to generate `dist/`.
2. Double-click `offline-start.bat`.
3. Open `http://localhost:4173` in a browser.

### Recommended offline usage

- Use the `offline-start.bat` launcher or any static file server to open `dist` locally.
- Make sure your audio device and kiosk settings allow autoplay if you’re installing this on-site.

## Scripts

- `npm run dev` — local development server
- `npm run build` — production build to `dist`
- `npm run preview` — preview the production build

## Notes

- All runtime assets are copied to `dist/assets` during build.
- The app expects a full-screen kiosk-like setup (hidden cursor, no browser chrome).
