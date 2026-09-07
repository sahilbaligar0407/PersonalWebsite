// Self-hosted SLM client. Talks to an Ollama service over Railway's private
// network and extracts academic assignments from free text.
//
// The model is asked only for semantics — which words are a course, which are a
// title, and a VERBATIM copy of the due wording. Turning "next Monday" into a
// real date is done here in JS with chrono, because small models reliably get
// calendar arithmetic wrong ("next Monday" was landing on a Saturday). That
// matters more here than it did locally: this service runs a 3B model.
//
// Env:
//   SLM_BASE_URL  e.g. http://slm.railway.internal:11434  (default localhost)
//   SLM_MODEL     e.g. qwen2.5:3b-instruct                (default below)

import * as chrono from "chrono-node";

const SLM_BASE_URL = (process.env.SLM_BASE_URL || "http://localhost:11434").replace(/\/$/, "");
const SLM_MODEL = process.env.SLM_MODEL || "qwen2.5:3b-instruct";
const SLM_TIMEOUT_MS = Number(process.env.SLM_TIMEOUT_MS ?? 120_000);

const SYSTEM_PROMPT = `You extract graded work from a student's message. The message may be a whole page pasted from a course website, so most of it is navigation, lectures and boilerplate that you must ignore.

Reply with ONLY a JSON object of the form:
{"assignments":[{"course":"CS 307","name":"Project Charter","due":"09/08 11:58pm","status":"Due"}]}

INCLUDE only things the student has to hand in or sit:
homework, assignments, projects, project documents (charter, backlog, design document, sprint planning, retrospective), quizzes, exams, papers, presentations, peer evaluations, labs, reflections, forms.

EXCLUDE everything else:
lectures and lecture titles, readings, slide links, week headings ("Week 4"), breaks and holidays ("October Break", "No Lecture"), announcements, navigation and menu items, instructor names, syllabus links, "Sprint 1 Begins", "Continues" and "Reviews" markers, and anything with no date.

Field rules:
- "course": the course code from the page (e.g. "CS 307", "CS 30700"). Use "General" if no code appears anywhere.
- "name": the title of the work only. Drop the trailing "Due", "Due by 11:58pm", and any status word.
- "due": copy the date and time wording VERBATIM from the message (e.g. "09/08", "Sep 09 at 11:59PM", "Friday", "next Monday"). Never calculate or reformat a date.
- Always include the time when the row states one. If the entry reads "Project Charter Due by 11:58pm" on row 09/08, then "due" is "09/08 11:58pm".
- If a row shows BOTH a released/available date and a due date, "due" must be the DUE one — that is the later of the two.
- "status": copy a status label if one is shown ("Due", "Available", "Availability Ends", "Submitted"). Otherwise "".

A course calendar usually lists the same piece of work twice: once on the day it is handed out, and again on the day it is due (that row says "Due"). Output it ONCE, using the row marked "Due".

One row often holds SEVERAL separate deliverables, joined by "+", "and", a comma, or a line break. Output one object for EACH of them, all with that row's date.

If there is no graded work at all, reply exactly: {"assignments":[]}`;

/* ----------------------------- date handling ---------------------------- */

const ISO_DATE = /^(\d{4}-\d{2}-\d{2})/;
const pad = (n) => String(n).padStart(2, "0");
const toISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function formatTime(d) {
  let h = d.getHours();
  const m = pad(d.getMinutes());
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${period}`;
}

/**
 * Resolve a natural-language due phrase against now. forwardDate makes a bare
 * "Friday" or "April 20" mean the next one, not one already past.
 */
export function resolveDue(phrase, reference = new Date(), forwardDate = true) {
  const raw = String(phrase ?? "").trim();
  if (!raw) return null;

  // The model sometimes returns an ISO date anyway; take it at face value.
  const iso = raw.match(ISO_DATE);
  if (iso && !Number.isNaN(Date.parse(iso[1]))) {
    return { dueDate: iso[1], dueTime: null };
  }

  const [result] = chrono.parse(raw, reference, { forwardDate });
  if (!result) return null;

  const date = result.start.date();
  if (Number.isNaN(date.getTime())) return null;

  return {
    dueDate: toISODate(date),
    // Only record a time when the text actually stated one.
    dueTime: result.start.isCertain("hour") ? formatTime(date) : null,
  };
}

/* ------------------------------ filtering ------------------------------- */

/**
 * Course-structure rows, not work to hand in. Course calendars are full of
 * these ("Week 4", "Midterm Week"), and they carry a date, so the parser would
 * otherwise happily turn them into assignments.
 */
const NON_ASSIGNMENT_RE =
  /^(week\s*\d+|(midterm|finals?|exam|reading|spring break|fall break)\s*week|week\s*(begins|starts|ends)|module\s*\d+|unit\s*\d+|online meeting|getting started|lecture|office hours|announcement)\.?$/i;

/** Progress markers ("Sprint 2 Continues") carry a date but owe nothing. */
const PROGRESS_MARKER_RE = /\b(continues?|begins?|starts?|reviews?|ongoing)\s*$/i;

/**
 * An "Available" row is when work becomes visible, not when it is owed.
 * Brightspace lists both for the same item, so keeping these would put every
 * project on the calendar twice, on the wrong day.
 */
const OPENING_STATUS_RE = /^(available|opens?|starts?|availability\s+starts?)$/i;

/** Mirrors COURSE_COLORS / colorForCourse in src/lib/course-colors.ts. */
const COURSE_COLORS = ["blue", "amber", "green", "purple", "rose"];

function colorForCourse(course) {
  let hash = 0;
  for (let i = 0; i < course.length; i++) {
    hash = (hash * 31 + course.charCodeAt(i)) | 0;
  }
  return COURSE_COLORS[Math.abs(hash) % COURSE_COLORS.length];
}

function toAssignment(item) {
  if (!item || typeof item !== "object") return null;

  const status = String(item.status ?? "").trim();
  if (OPENING_STATUS_RE.test(status)) return null;

  const name = String(item.name ?? "").trim();
  if (!name || NON_ASSIGNMENT_RE.test(name) || PROGRESS_MARKER_RE.test(name)) return null;

  const due = resolveDue(item.due ?? item.dueDate);
  if (!due) return null; // No usable date means it would land on the wrong day.

  const course = String(item.course ?? "").trim() || "General";

  return {
    course: course.slice(0, 120),
    name: name.slice(0, 300),
    dueDate: due.dueDate,
    dueTime: due.dueTime,
    link: item.link ? String(item.link).trim().slice(0, 500) : null,
    color: colorForCourse(course),
    source: "ai_text",
  };
}

/**
 * Course calendars list a piece of work on the day it is handed out and again
 * on the day it is due. The model catches that inconsistently, so collapse it
 * here: within one import, the same course and title means one deadline, and
 * the later date is the one that matters.
 */
function collapseAssignedAndDue(items) {
  const byKey = new Map();

  for (const item of items) {
    const key = `${item.course.toLowerCase()}|${item.name.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
    const seen = byKey.get(key);
    if (!seen || item.dueDate > seen.dueDate) byKey.set(key, item);
  }

  return [...byKey.values()].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

/* -------------------------------- parse --------------------------------- */

export async function parseAssignmentsFromText(text) {
  const today = new Date().toDateString();
  const userContent = `CURRENT DATE: ${today}\n\nTEXT:\n${text}`;

  const res = await fetch(`${SLM_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(SLM_TIMEOUT_MS),
    body: JSON.stringify({
      model: SLM_MODEL,
      stream: false,
      format: "json",
      options: { temperature: 0.1 },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`SLM request failed (${res.status}): ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data?.message?.content?.trim() || "{}";

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    return [];
  }

  // Accept {"assignments":[...]} or a bare [...] array.
  const raw = Array.isArray(parsed) ? parsed : parsed.assignments;
  if (!Array.isArray(raw)) return [];

  return collapseAssignedAndDue(raw.map(toAssignment).filter(Boolean));
}

/* -------------------------------- status -------------------------------- */

// Liveness probe for the SLM service (used by /api/health for observability).
export async function slmHealthy() {
  try {
    const res = await fetch(`${SLM_BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Richer status for the chat header, so a cold or un-pulled model reads as
 * "model offline" in the UI rather than a generic parse failure.
 */
export async function slmStatus() {
  try {
    const res = await fetch(`${SLM_BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return { online: false, model: SLM_MODEL };

    const data = await res.json();
    const names = (data?.models ?? []).map((m) => m.name);
    return {
      online: true,
      model: SLM_MODEL,
      // Ollama reports "qwen2.5:3b-instruct"; tolerate a missing ":latest".
      modelAvailable: names.some((n) => n === SLM_MODEL || n === `${SLM_MODEL}:latest`),
    };
  } catch {
    return { online: false, model: SLM_MODEL };
  }
}
