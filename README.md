# AeroPrep Alpha

A local-first, interactive pre-PPL (Private Pilot License) ground school companion. Dark cockpit-themed UI, knowledge graph, simulator tools, and progress tracking — all in your browser.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Features

- **Knowledge graph** — 34 interconnected concepts across ATC, aircraft systems, airspace/weather, navigation, and safety
- **Progressive depth** — summary → deep dive → advanced layer (unlocks on quiz mastery)
- **Grow Knowledge** — add personal notes, custom concepts, flashcards, and quiz questions at runtime
- **Knowledge Radar** — interactive force-directed graph (locked / available / mastered states)
- **Simulator Lab** — ATC comm sandbox, 6-pack instrument explainer, METAR decoder
- **Leitner flashcards** — spaced repetition with daily checklist
- **Import/export** — back up your overlay and progress as JSON

## Architecture

```
src/data/     Seed content (swappable for API/DB later)
src/store/    ProgressStore interface + localStorage + content merge service
src/pages/    Dashboard, Radar, Learning Path, Lab, Profile
server/       Optional REST API for multi-user sync (SQLite)
```

Progress persists in `localStorage`. To support multiple users, swap `LocalStorageProgressStore` for an API-backed implementation — the backend in `server/` is ready for that.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | Run oxlint |

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for GitHub Pages, Vercel/Netlify, and Docker instructions.

## Backend (optional)

```bash
cd server
npm install
npm run dev
```

API runs on port 4000 by default. See [server/README.md](server/README.md).
