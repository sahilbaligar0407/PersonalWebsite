# SmartCal — Railway deployment

SmartCal lives in the **PersonalWebsite** monorepo
(`github.com/sahilbaligar0407/PersonalWebsite`) under `calendar/`. One Railway
project deploys three services from that one repo, each with its own **Root
Directory**:

| Service       | Root Directory  | Notes                                |
| ------------- | --------------- | ------------------------------------ |
| personal-site | `/` (repo root) | Next.js portfolio (already deployed) |
| calendar      | `calendar`      | Vite SPA + Express API               |
| slm           | `calendar/slm`  | Ollama inference (private)           |

SmartCal runs entirely on Railway: a **calendar service** (Vite SPA + Express API +
Postgres), a **self-hosted SLM service** (Ollama), and it's exposed at
`sahilbaligar.com/Calendar` by proxying that path from the personal-site service.

```
                 sahilbaligar.com
                        │
        ┌───────────────┴────────────────┐
        │  Personal site (Next.js)        │   rewrite /Calendar/* ─┐
        └─────────────────────────────────┘                        │  (private network)
                                                                    ▼
                            ┌───────────────────────────────────────────────┐
                            │  SmartCal calendar service (this repo, root)   │
                            │  Express serves SPA + /api, base path /Calendar│
                            └───────┬───────────────────────┬───────────────┘
                                    │ Postgres              │ SLM_BASE_URL (private)
                                    ▼                       ▼
                          ┌──────────────┐        ┌──────────────────────┐
                          │ Railway PG   │        │ SLM service (slm/)    │
                          │ (plugin)     │        │ Ollama, private only  │
                          └──────────────┘        └──────────────────────┘
```

## 1. Postgres

Add a **Postgres** database to the Railway project (New → Database → PostgreSQL).
Note its connection variable (`DATABASE_URL`).

## 2. SLM service (Ollama)

New service → the PersonalWebsite GitHub repo → **Root Directory = `calendar/slm`**.
- Attach a **Volume** at `/root/.ollama` (~4 GB) so the model is cached across deploys.
- Keep it **private** (no public domain).
- Optional env `SLM_MODEL` (default `qwen2.5:3b-instruct`).
- First boot pulls the model (a few minutes); see `slm/README.md`.

Grab its private hostname from **Settings → Networking → Private Networking**
(e.g. `smartcal-slm.railway.internal`).

## 3. Calendar service

New service → the PersonalWebsite GitHub repo → **Root Directory = `calendar`**
(uses `calendar/Dockerfile`). Set env vars:

| Variable       | Value                                                    |
| -------------- | -------------------------------------------------------- |
| `DATABASE_URL` | Reference the Postgres plugin's variable                 |
| `JWT_SECRET`   | A long random string                                     |
| `SLM_BASE_URL` | `http://<slm-host>.railway.internal:11434`               |
| `SLM_MODEL`    | `qwen2.5:3b-instruct` (must match the SLM service)       |

`APP_BASE_PATH=/Calendar`, `NODE_ENV=production`, and `PORT` are handled by the
Dockerfile / Railway. On deploy, `start.sh` runs `prisma migrate deploy` then boots
the server. Healthcheck: `/api/health`.

This service does **not** need its own public domain — traffic comes through the
personal site. (You can add a temporary public domain to test it directly at
`<domain>/Calendar`.)

## 4. Route sahilbaligar.com/Calendar → this service

On the **personal-site** Railway service set:

```
CALENDAR_ORIGIN = http://<calendar-host>.railway.internal:8080
```

The personal site's `next.config.js` proxies `/Calendar` and `/Calendar/*` to that
origin (prefix preserved). Redeploy the personal site.

## Local development

```sh
npm install
# Terminal 1 — API (Postgres reachable via DATABASE_URL in .env)
PORT=8787 npm run dev:server
# Terminal 2 — Vite (proxies /api → :8787)
npm run dev            # http://localhost:8080
```

For AI locally, run Ollama on your machine (`ollama pull qwen2.5:3b-instruct`) and set
`SLM_BASE_URL=http://localhost:11434`.

## What changed from the Supabase version

- Auth is self-hosted (bcrypt + JWT httpOnly cookie) — no Supabase Auth.
- Data lives in Railway Postgres via Prisma — no Supabase DB/RLS.
- The OpenAI client call moved server-side to the self-hosted SLM — no exposed key.
- Screenshots are OCR'd in the browser (`tesseract.js`, `src/lib/ocr.ts`) and only
  the recovered text is sent to `/api/ai/parse` — the image never leaves the
  device, and the server needs no upload handling.

## What changed when the newer calendar app was ported in

- The front end is the rebuilt SmartCal UI (minimal design, dark mode, per-course
  colours). The old animated scroll landing page was retired with it.
- `GET /api/ics` was added: Brightspace sends no CORS headers, so the browser
  could never fetch a real feed. It is auth-gated and refuses private/loopback
  hosts, since it fetches a caller-supplied URL from inside the private network.
- The .ics parser now reads the course code from `LOCATION` and drops
  `- Available` openings and week headings. `src/test/ics.test.ts` pins this.
- Assignment dates are resolved by `chrono-node` in JS rather than by the model,
  which matters with a 3B model.
- `GET /api/calendar` and `PUT /api/calendar/feed` now read and write the
  `Calendar.subscriptionUrl` column, which already existed but was never used.
- `GET /api/ai/status` backs the model indicator in the chat header.
- Server-side OCR and the `/api/ai/parse-image` upload route were removed along
  with `multer`; OCR is client-side now.
