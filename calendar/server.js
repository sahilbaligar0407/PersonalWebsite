// SmartCal — single Railway service.
// Serves the built Vite SPA AND the API (auth, assignments, AI) on one port,
// all under a base path (default /Calendar) so it lives at sahilbaligar.com/Calendar.
//
// Design (same reliability goals as the RRender.ai server):
//   1. Bind to 0.0.0.0 so Railway's healthcheck can reach it.
//   2. Never let a DB/SLM problem stop the server from listening — Prisma is
//      initialized lazily and failures are logged, not fatal.
//   3. Health check always returns 200 when the process is up.
//
// The whole app is mounted under BASE_PATH so it behaves identically whether the
// request arrives via the main-site rewrite (which keeps the /Calendar prefix)
// or directly on the Railway domain.
import express from "express";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { initPrisma, getPrisma, isDbReady } from "./server/db.js";
import {
  hashPassword,
  verifyPassword,
  signToken,
  setAuthCookie,
  clearAuthCookie,
  requireAuth,
  readUser,
} from "./server/auth.js";
import { parseAssignmentsFromText, slmHealthy } from "./server/slm.js";
import { extractTextFromImage } from "./server/ocr.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "dist");
// Empty (root) by default for local dev; the production image sets
// APP_BASE_PATH=/Calendar so the app lives at sahilbaligar.com/Calendar.
const BASE_PATH = (process.env.APP_BASE_PATH || "").replace(/\/+$/, "");
const mountPath = BASE_PATH || "/";

console.log(
  `>>> [boot] SmartCal server.js loaded | PORT=${process.env.PORT ?? "<unset>"} | NODE_ENV=${process.env.NODE_ENV ?? "<unset>"} | base=${BASE_PATH} | dist=${distDir}`,
);

process.on("unhandledRejection", (err) => console.error("[unhandledRejection]", err));
process.on("uncaughtException", (err) => console.error("[uncaughtException]", err));

const AI_MONTHLY_LIMIT = 20;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const str = (v, max) => (v == null ? "" : String(v)).trim().slice(0, max);
const monthKey = () => new Date().toISOString().slice(0, 7); // YYYY-MM

const app = express();
app.set("trust proxy", 1); // behind Railway's proxy (and the main-site rewrite)
app.use(express.json({ limit: "512kb" }));
app.use(cookieParser());

const upload = multer({
  storage: multer.memoryStorage(), // ephemeral — image never touches disk
  limits: { fileSize: 8 * 1024 * 1024 },
});

// Everything the browser reaches lives on this router, mounted at BASE_PATH.
const router = express.Router();

// --- Health (liveness) — always 200, never rate-limited ---
router.get("/api/health", async (_req, res) => {
  res.status(200).json({
    ok: true,
    db: isDbReady() ? "connected" : "unavailable",
    slm: (await slmHealthy()) ? "connected" : "unavailable",
  });
});

// Moderate limiter on the rest of /api.
router.use(
  "/api",
  rateLimit({
    windowMs: 5 * 60 * 1000,
    limit: 200,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Too many requests. Please try again later." },
  }),
);

// Strict limiter for auth endpoints (brute-force protection).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again later." },
});

// ---------- helpers ----------
function serializeAssignment(row) {
  return {
    id: row.id,
    course: row.course,
    name: row.name,
    // @db.Date comes back as a Date at UTC midnight; take the ISO date part.
    dueDate: row.dueDate instanceof Date ? row.dueDate.toISOString().slice(0, 10) : row.dueDate,
    dueTime: row.dueTime,
    link: row.link,
    color: row.color,
    source: row.source,
  };
}

async function getOrCreateCalendar(prisma, userId) {
  const existing = await prisma.calendar.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.calendar.create({ data: { userId } });
}

function dbGuard(res) {
  const prisma = getPrisma();
  if (!prisma) {
    res.status(503).json({ error: "Service warming up. Please try again in a moment." });
    return null;
  }
  return prisma;
}

// Enforce + increment the monthly AI quota. Returns { ok, usage } or { ok:false, status }.
async function consumeAiQuota(prisma, userId) {
  const month = monthKey();
  const existing = await prisma.aiUsage.findUnique({
    where: { userId_month: { userId, month } },
  });
  const current = existing?.count ?? 0;
  if (current >= AI_MONTHLY_LIMIT) {
    return { ok: false, status: 429, usage: { count: current, remaining: 0, limit: AI_MONTHLY_LIMIT } };
  }
  const updated = await prisma.aiUsage.upsert({
    where: { userId_month: { userId, month } },
    update: { count: { increment: 1 } },
    create: { userId, month, count: 1 },
  });
  return {
    ok: true,
    usage: {
      count: updated.count,
      remaining: Math.max(0, AI_MONTHLY_LIMIT - updated.count),
      limit: AI_MONTHLY_LIMIT,
    },
  };
}

// ---------- auth ----------
router.post("/api/auth/signup", authLimiter, async (req, res) => {
  const prisma = dbGuard(res);
  if (!prisma) return;
  const email = str(req.body?.email, 200).toLowerCase();
  const password = str(req.body?.password, 200);
  if (!EMAIL_RE.test(email) || password.length < 8) {
    return res.status(400).json({ error: "A valid email and a password of 8+ characters are required." });
  }
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ error: "An account with that email already exists." });

  const user = await prisma.user.create({
    data: { email, passwordHash: await hashPassword(password) },
  });
  await getOrCreateCalendar(prisma, user.id);
  setAuthCookie(res, signToken(user));
  res.status(201).json({ user: { id: user.id, email: user.email } });
});

router.post("/api/auth/signin", authLimiter, async (req, res) => {
  const prisma = dbGuard(res);
  if (!prisma) return;
  const email = str(req.body?.email, 200).toLowerCase();
  const password = str(req.body?.password, 200);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid email or password." });
  }
  setAuthCookie(res, signToken(user));
  res.status(200).json({ user: { id: user.id, email: user.email } });
});

router.post("/api/auth/signout", (_req, res) => {
  clearAuthCookie(res);
  res.status(200).json({ ok: true });
});

router.get("/api/auth/me", (req, res) => {
  res.status(200).json({ user: readUser(req) });
});

// ---------- assignments ----------
router.get("/api/assignments", requireAuth, async (req, res) => {
  const prisma = dbGuard(res);
  if (!prisma) return;
  const calendar = await getOrCreateCalendar(prisma, req.user.id);
  const rows = await prisma.assignment.findMany({
    where: { calendarId: calendar.id },
    orderBy: { dueDate: "asc" },
  });
  res.json({ calendarId: calendar.id, assignments: rows.map(serializeAssignment) });
});

router.post("/api/assignments", requireAuth, async (req, res) => {
  const prisma = dbGuard(res);
  if (!prisma) return;
  const calendar = await getOrCreateCalendar(prisma, req.user.id);
  const b = req.body ?? {};
  const course = str(b.course, 120) || "General";
  const name = str(b.name, 300) || "Assignment";
  const dueDate = str(b.dueDate, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return res.status(400).json({ error: "dueDate must be YYYY-MM-DD." });
  }
  try {
    const row = await prisma.assignment.create({
      data: {
        calendarId: calendar.id,
        course,
        name,
        dueDate: new Date(dueDate),
        dueTime: str(b.dueTime, 40) || null,
        link: str(b.link, 500) || null,
        color: str(b.color, 40) || "blue",
        source: str(b.source, 20) || "manual",
      },
    });
    res.status(201).json({ assignment: serializeAssignment(row) });
  } catch (err) {
    if (err?.code === "P2002") return res.status(200).json({ duplicate: true });
    console.error("[assignments] create failed:", err);
    res.status(500).json({ error: "Failed to add assignment." });
  }
});

router.post("/api/assignments/bulk", requireAuth, async (req, res) => {
  const prisma = dbGuard(res);
  if (!prisma) return;
  const calendar = await getOrCreateCalendar(prisma, req.user.id);
  const items = Array.isArray(req.body?.items) ? req.body.items.slice(0, 200) : [];
  let added = 0;
  let duplicates = 0;
  const created = [];
  for (const b of items) {
    const dueDate = str(b.dueDate, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) continue;
    try {
      const row = await prisma.assignment.create({
        data: {
          calendarId: calendar.id,
          course: str(b.course, 120) || "General",
          name: str(b.name, 300) || "Assignment",
          dueDate: new Date(dueDate),
          dueTime: str(b.dueTime, 40) || null,
          link: str(b.link, 500) || null,
          color: str(b.color, 40) || "blue",
          source: str(b.source, 20) || "manual",
        },
      });
      created.push(serializeAssignment(row));
      added++;
    } catch (err) {
      if (err?.code === "P2002") duplicates++;
      else console.error("[assignments] bulk item failed:", err?.message || err);
    }
  }
  res.json({ added, duplicates, assignments: created });
});

router.patch("/api/assignments/:id", requireAuth, async (req, res) => {
  const prisma = dbGuard(res);
  if (!prisma) return;
  const calendar = await getOrCreateCalendar(prisma, req.user.id);
  const b = req.body ?? {};
  const data = {};
  if (b.course != null) data.course = str(b.course, 120);
  if (b.name != null) data.name = str(b.name, 300);
  if (b.dueDate != null) {
    const d = str(b.dueDate, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return res.status(400).json({ error: "Bad dueDate." });
    data.dueDate = new Date(d);
  }
  if (b.dueTime !== undefined) data.dueTime = b.dueTime ? str(b.dueTime, 40) : null;
  if (b.link !== undefined) data.link = b.link ? str(b.link, 500) : null;
  if (b.color != null) data.color = str(b.color, 40);
  // updateMany scoped by calendar ownership so users can't edit others' rows.
  const result = await prisma.assignment.updateMany({
    where: { id: req.params.id, calendarId: calendar.id },
    data,
  });
  if (!result.count) return res.status(404).json({ error: "Not found." });
  res.json({ ok: true });
});

router.delete("/api/assignments/:id", requireAuth, async (req, res) => {
  const prisma = dbGuard(res);
  if (!prisma) return;
  const calendar = await getOrCreateCalendar(prisma, req.user.id);
  await prisma.assignment.deleteMany({
    where: { id: req.params.id, calendarId: calendar.id },
  });
  res.json({ ok: true });
});

router.post("/api/assignments/delete-bulk", requireAuth, async (req, res) => {
  const prisma = dbGuard(res);
  if (!prisma) return;
  const calendar = await getOrCreateCalendar(prisma, req.user.id);
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map((i) => str(i, 60)) : [];
  await prisma.assignment.deleteMany({
    where: { id: { in: ids }, calendarId: calendar.id },
  });
  res.json({ ok: true });
});

// ---------- AI ----------
router.get("/api/ai/usage", requireAuth, async (req, res) => {
  const prisma = dbGuard(res);
  if (!prisma) return;
  const row = await prisma.aiUsage.findUnique({
    where: { userId_month: { userId: req.user.id, month: monthKey() } },
  });
  const count = row?.count ?? 0;
  res.json({ count, remaining: Math.max(0, AI_MONTHLY_LIMIT - count), limit: AI_MONTHLY_LIMIT });
});

router.post("/api/ai/parse", requireAuth, async (req, res) => {
  const prisma = dbGuard(res);
  if (!prisma) return;
  const text = str(req.body?.text, 20000);
  if (text.length < 2) return res.status(400).json({ error: "Provide some text to parse." });

  const quota = await consumeAiQuota(prisma, req.user.id);
  if (!quota.ok) {
    return res.status(quota.status).json({ error: "Monthly AI limit reached.", usage: quota.usage });
  }
  try {
    const assignments = await parseAssignmentsFromText(text);
    res.json({ assignments, usage: quota.usage });
  } catch (err) {
    console.error("[ai/parse] SLM failed:", err?.message || err);
    res.status(502).json({ error: "The AI service is unavailable right now.", usage: quota.usage });
  }
});

router.post("/api/ai/parse-image", requireAuth, upload.single("image"), async (req, res) => {
  const prisma = dbGuard(res);
  if (!prisma) return;
  if (!req.file?.buffer) return res.status(400).json({ error: "No image uploaded." });

  const quota = await consumeAiQuota(prisma, req.user.id);
  if (!quota.ok) {
    return res.status(quota.status).json({ error: "Monthly AI limit reached.", usage: quota.usage });
  }
  try {
    const text = await extractTextFromImage(req.file.buffer); // buffer discarded after this
    if (!text || text.length < 2) {
      return res.json({ assignments: [], text: "", usage: quota.usage });
    }
    const assignments = (await parseAssignmentsFromText(text)).map((a) => ({ ...a, source: "ai_image" }));
    res.json({ assignments, text, usage: quota.usage });
  } catch (err) {
    console.error("[ai/parse-image] failed:", err?.message || err);
    res.status(502).json({ error: "Could not read that image.", usage: quota.usage });
  }
});

// ---------- static SPA + fallback (served under BASE_PATH) ----------
router.use(express.static(distDir, { redirect: false }));

router.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api")) return next();
  res.sendFile(path.join(distDir, "index.html"));
});

// Mount the whole app under the base path (root in dev, /Calendar in prod).
app.use(mountPath, router);

// When served under a base path, also answer a root health probe and redirect
// the bare domain into the app (handy for direct Railway-domain access).
if (BASE_PATH) {
  app.get("/api/health", (_req, res) => res.status(200).json({ ok: true }));
  app.get("/", (_req, res) => res.redirect(`${BASE_PATH}/`));
}

// ---------- listen, then connect DB in the background ----------
const port = Number(process.env.PORT) || 8080;
app.listen(port, "0.0.0.0", () => {
  console.log(`SmartCal server listening on 0.0.0.0:${port} (base ${BASE_PATH})`);
  initPrisma();
});
