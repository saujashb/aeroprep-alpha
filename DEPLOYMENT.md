# Deploying AeroPrep Alpha

AeroPrep Alpha is a fully static, client-side SPA. `npm run build` produces a `dist/` folder that can be served by any static host.

## GitHub Pages (automatic)

Pushes to `main` trigger `.github/workflows/deploy.yml`, which builds the app and publishes `dist/` to GitHub Pages.

One-time setup in the GitHub repository:

1. Go to **Settings → Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions**.

The workflow builds with `--base=/<repo-name>/` so asset URLs resolve correctly under the Pages subpath, and copies `index.html` to `404.html` so client-side routes work on direct navigation or refresh.

## Vercel / Netlify (zero-config alternative)

Import the repository and both platforms detect Vite automatically. If asked:

- **Build command:** `npm run build`
- **Output directory:** `dist`

No base path override is needed since these serve from the domain root.

## Docker

```bash
docker build -t aeroprep-alpha .
docker run -p 8080:80 aeroprep-alpha
```

The app is then available at http://localhost:8080. The image is multi-stage: `node:22-alpine` builds the app, then `nginx:alpine` serves `dist/` with SPA fallback, gzip, and cache headers (immutable caching for hashed assets, no-cache for `index.html`).

## Scaling to multiple users later

All persistence currently lives in `localStorage`, so progress is per browser and per device. To support multiple users, swap the `ProgressStore` data layer for a backend API backed by a database (plus authentication). Because the rest of the app talks to that store rather than to `localStorage` directly, this is an isolated change — the static hosting options above would still serve the frontend unchanged.
