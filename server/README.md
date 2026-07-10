# AeroPrep Alpha — API Server

A minimal REST API that lets each user's learning **progress** (mastered concepts, quiz results, flashcard Leitner boxes, daily checklist) and **content overlay** (personal notes, custom concepts, custom flashcards, custom quiz questions) sync to a server instead of browser `localStorage`.

**Stack:** Node 22, TypeScript, Express 5, better-sqlite3 (zero-config local SQLite), zod for request validation.

## Run

```bash
cd server
npm install
npm run dev        # tsx watch mode on http://localhost:4000
```

Production-style:

```bash
npm run build      # tsc → dist/
npm start          # node dist/index.js
```

### Configuration (env vars)

| Variable        | Default                              | Purpose                                  |
| --------------- | ------------------------------------ | ---------------------------------------- |
| `PORT`          | `4000`                               | HTTP port                                |
| `CORS_ORIGIN`   | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated allowed origins (Vite dev default) |
| `DATABASE_PATH` | `server/data/aeroprep.sqlite`        | SQLite file location (created on boot)   |

## Authentication caveat

There is **no real authentication yet**. `POST /api/users` returns an opaque bearer token which is simply a random id stored in plaintext — no passwords, hashing, expiry, or refresh. This is deliberate for the alpha: it gives every request a stable user identity so the multi-user data model and sync API can be built now. Real auth (password or OAuth login, hashed credentials, token rotation) is a future step and can be added behind the same `Authorization` header without changing any endpoint shapes.

Send the token on every request as either:

```
Authorization: Bearer <token>
```

or

```
X-User-Token: <token>
```

## Endpoint reference

All endpoints are under `/api` and speak JSON. Errors always have the shape:

```json
{ "error": { "code": "bad_request", "message": "…", "details": [] } }
```

The examples below assume:

```bash
BASE=http://localhost:4000
TOKEN=... # from POST /api/users
```

### Health

```bash
curl $BASE/api/health
# {"status":"ok","uptime":12.3}
```

### Users

**`POST /api/users`** — create a user; the token is returned only here, so save it.

```bash
curl -s $BASE/api/users -H 'Content-Type: application/json' \
  -d '{"name":"Amelia"}'
# {"id":"…","name":"Amelia","createdAt":"…","token":"…"}
```

**`GET /api/users/me`** — identify the calling user.

```bash
curl -s $BASE/api/users/me -H "Authorization: Bearer $TOKEN"
```

### Progress

The progress blob mirrors the frontend `ProgressStore` progress surface:

```json
{
  "masteredNodeIds": ["phonetic-alphabet"],
  "quizResults": [
    { "id": "…", "quizId": "atc-basics", "score": 8, "total": 10, "timestamp": "…" }
  ],
  "flashcards": { "card-123": { "box": 3, "lastReviewedAt": "…" } },
  "dailyChecklist": { "date": "2026-07-10", "completedItemIds": ["review-flashcards"] }
}
```

**`GET /api/progress`** — fetch the full blob.

```bash
curl -s $BASE/api/progress -H "Authorization: Bearer $TOKEN"
```

**`PUT /api/progress`** — replace the full blob (client-driven full sync).

```bash
curl -s -X PUT $BASE/api/progress \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"masteredNodeIds":["phonetic-alphabet"],"quizResults":[],"flashcards":{},"dailyChecklist":null}'
```

**`POST /api/progress/quiz-results`** — append one quiz result. `id` and `timestamp` are filled in by the server if omitted; extra fields are stored as-is.

```bash
curl -s -X POST $BASE/api/progress/quiz-results \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"quizId":"atc-basics","score":8,"total":10}'
```

**`PUT /api/progress/flashcards/:cardId`** — upsert the Leitner state of one flashcard (seed or custom).

```bash
curl -s -X PUT $BASE/api/progress/flashcards/card-123 \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"box":3,"lastReviewedAt":"2026-07-10T21:00:00Z"}'
```

### Overlay

The overlay blob holds user-generated content layered over the seed JSON:

```json
{
  "notes": { "phonetic-alphabet": { "conceptId": "phonetic-alphabet", "text": "…", "updatedAt": "…" } },
  "customConcepts": [ { "id": "custom-…", "title": "…", "category": "atc" } ],
  "customFlashcards": [ { "id": "custom-…", "front": "…", "back": "…" } ],
  "customQuizQuestions": [ { "id": "custom-…", "question": "…", "options": ["a","b"], "correctIndex": 0 } ]
}
```

**`GET /api/overlay`** / **`PUT /api/overlay`** — fetch / replace the full overlay.

```bash
curl -s $BASE/api/overlay -H "Authorization: Bearer $TOKEN"

curl -s -X PUT $BASE/api/overlay \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"notes":{},"customConcepts":[],"customFlashcards":[],"customQuizQuestions":[]}'
```

**`POST /api/overlay/concepts`** — add a custom concept (upserts by `id`; server assigns `custom-<uuid>` if omitted).

```bash
curl -s -X POST $BASE/api/overlay/concepts \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"Density Altitude","category":"weather","difficulty":"intermediate"}'
```

**`POST /api/overlay/flashcards`** — add a custom flashcard.

```bash
curl -s -X POST $BASE/api/overlay/flashcards \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"front":"What does WILCO mean?","back":"Will comply","conceptId":"standard-phraseology"}'
```

**`POST /api/overlay/notes`** — upsert the personal note for a concept (one note per concept id).

```bash
curl -s -X POST $BASE/api/overlay/notes \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"conceptId":"phonetic-alphabet","text":"Practice with license plates"}'
```

### Export / import

**`GET /api/export`** — full user data (`{ version, exportedAt, user, progress, overlay }`), mirroring the frontend's overlay export shape.

```bash
curl -s $BASE/api/export -H "Authorization: Bearer $TOKEN" > backup.json
```

**`POST /api/import`** — restore progress and/or overlay. Accepts the export bundle above or a bare `{ "progress": …, "overlay": … }`; each provided section fully replaces what's stored.

```bash
curl -s -X POST $BASE/api/import \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d @backup.json
```

## Frontend integration (future)

The frontend persists everything through a swappable `ProgressStore` interface, currently implemented by `LocalStorageProgressStore`. This API is shaped so a future `ApiProgressStore` can be a drop-in replacement:

- `GET/PUT /api/progress` and `GET/PUT /api/overlay` support the simple "load once, write-through on change" strategy the localStorage store uses today.
- The granular endpoints (`POST /api/progress/quiz-results`, `PUT /api/progress/flashcards/:cardId`, `POST /api/overlay/concepts|flashcards|notes`) map onto the individual `ProgressStore` mutation methods for finer-grained sync later.
- `GET /api/export` / `POST /api/import` mirror the frontend's existing overlay import/export feature.

The server keeps its own copies of the shared types in `src/types.ts` (no cross-package imports). Domain objects are validated structurally but stored as flexible JSON, so additive frontend type changes round-trip without server migrations.
