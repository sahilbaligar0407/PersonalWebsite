# SmartCal — calendar service

A deadline calendar for students, served at **sahilbaligar.com/Calendar**. Import
your Brightspace calendar feed, type or paste assignments in plain English, or
drop in a screenshot of a course page — SmartCal turns all of it into one
calendar of what is actually due, plus an "Up next" list for the next 14 days.

This is one of three Railway services in this monorepo (see `DEPLOYMENT.md`):
the Next.js personal site proxies `/Calendar` here, and this service calls a
self-hosted small language model running as its own service.

- **Front end** — Vite, React, TypeScript, Tailwind CSS, shadcn/ui
- **API** — Express, in `server.js` and `server/`, mounted under `APP_BASE_PATH`
- **Database** — Postgres via Prisma
- **Auth** — email + password, bcrypt hashes, session in an httpOnly JWT cookie
- **AI** — a self-hosted SLM (Ollama) reached over Railway's private network
- **OCR** — Tesseract.js, running in the browser

Nothing is sent to a third-party AI provider and there is no API key.

## How it works

**The .ics relay.** Brightspace serves the feed without CORS headers, so the
browser cannot fetch it directly. The server relays it at `GET /api/ics` and
hands the text back to the browser to parse. The relay resolves the hostname
first and refuses private or loopback addresses, because it is fetching a
URL supplied by the caller from inside Railway's private network.

**The .ics parser** (`src/lib/ics.ts`) reads the course code out of the
`LOCATION` property — `"Fall 2026 CS 25200-LE1 LEC"` becomes `CS 25200` — and
strips the status Brightspace appends to `SUMMARY`, so `"GIT Homework - Due"`
becomes `GIT Homework`. Only real deadlines are kept: entries marked *Due* or
*Availability Ends*. `- Available` openings are dropped (Brightspace lists most
work twice, and keeping both would put every item on the calendar on the wrong
day as well as the right one), and so are course-structure rows like `Week 4`,
which carry a date but nothing to hand in. `src/test/ics.test.ts` pins this
behaviour.

**Text parsing** goes to the SLM. The model is asked only for semantics — which
words are the course, which are the assignment title, and a *verbatim* copy of
the due phrase. It is never asked to compute a date; that is done in JavaScript
with `chrono-node`, because small models get calendar arithmetic wrong.

**Screenshots** are read by Tesseract.js in the browser (`src/lib/ocr.ts`), so
images never reach the server. A course page is a table, so a flat OCR string is
not enough: word bounding boxes are regrouped into visual rows, and wide
horizontal gaps become column separators, so a title stays attached to the date
beside it. The recovered text then goes through the same `/api/ai/parse`
pipeline as a pasted page. No vision model is needed.

**Duplicate prevention** is a unique constraint on
`(calendarId, course, name, dueDate)`; a collision comes back as
`{ duplicate: true }` rather than an error. The importer also collapses the
duplicate *Due* / *Availability Ends* pair within a single import.

## Local development

```sh
npm install          # also runs scripts/setup-ocr.mjs (postinstall)
npx prisma generate
```

You need a Postgres URL in `.env` (see `.env.example`). With no `APP_BASE_PATH`
the app is served at the root, which is what the Vite dev server expects.

```sh
npm run dev:server   # API on 8787
npm run dev          # Vite on 8080, proxying /api to 8787
```

The AI chat needs an Ollama instance reachable at `SLM_BASE_URL` with
`SLM_MODEL` pulled. Without one the app still runs; the chat header reads
"Model offline" and parsing requests fail cleanly.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server (8080) |
| `npm run dev:server` | API server only |
| `npm run build` | Production build of the front end into `dist/` |
| `npm start` | Serve `dist/` + the API from one port (what Railway runs) |
| `npm run lint` | ESLint |
| `npm test` | Vitest, single run |
| `npm run setup:ocr` | Refresh the Tesseract assets in `public/tesseract` |
| `npm run prisma:migrate` | `prisma migrate deploy` |

## Configuration

See `.env.example`. All of it is server-side; the front end carries no secrets
and reads only Vite's `BASE_URL`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | — | Postgres connection string (required) |
| `JWT_SECRET` | insecure dev value | Signs the `smartcal_token` session cookie |
| `SLM_BASE_URL` | `http://localhost:11434` | Ollama endpoint for assignment parsing |
| `SLM_MODEL` | `qwen2.5:3b-instruct` | Model name, must match what the SLM pulled |
| `SLM_TIMEOUT_MS` | `120000` | Abort a parse that hangs |
| `APP_BASE_PATH` | empty (root) | `/Calendar` in the production image |
| `PORT` | `8080` | Listen port |

## Limits

AI parsing is capped at **20 requests per account per month**, enforced in the
database. Auth endpoints are rate limited to 20 attempts per 15 minutes and the
rest of `/api` to 200 requests per 5 minutes.
