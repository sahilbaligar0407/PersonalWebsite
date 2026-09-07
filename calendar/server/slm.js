// Self-hosted SLM client. Talks to an Ollama service over Railway's private
// network and extracts academic assignments from free text.
//
// Two things are deliberately kept away from the model:
//
//   1. Layout. A pasted course calendar is a table: the date sits at the start
//      of a row and the work belonging to it is on the following lines or in
//      later columns. A 3B model cannot hold that association, which is why
//      "Final Exam" used to come back on 12/15 instead of 10/29. So the table
//      is rebuilt HERE, in JS, into flat "date :: everything on that date"
//      rows. The model then only decides which of those words are graded work.
//
//   2. Calendar arithmetic. Dates are resolved with chrono, as before, because
//      small models reliably get it wrong ("next Monday" landed on a Saturday).
//
// The rows are then sent in small batches. One request for a 16-week calendar
// produces a long JSON array that the model truncates; ~18 rows at a time does
// not. num_ctx is set explicitly because Ollama's default is small and the
// response shares that budget with the prompt.
//
// Env:
//   SLM_BASE_URL  e.g. http://slm.railway.internal:11434  (default localhost)
//   SLM_MODEL     e.g. qwen2.5:3b-instruct                (default below)

import * as chrono from "chrono-node";

const SLM_BASE_URL = (process.env.SLM_BASE_URL || "http://localhost:11434").replace(/\/$/, "");
const SLM_MODEL = process.env.SLM_MODEL || "qwen2.5:3b-instruct";
const SLM_TIMEOUT_MS = Number(process.env.SLM_TIMEOUT_MS ?? 120_000);
// How long Ollama holds the model in memory after a request. Without this it
// unloads within minutes, and the next visitor pays the cold start again.
const SLM_KEEP_ALIVE = process.env.SLM_KEEP_ALIVE ?? "30m";

// Ollama's default context is small and the reply shares it with the prompt,
// so a long calendar silently truncated the JSON mid-array.
const SLM_NUM_CTX = Number(process.env.SLM_NUM_CTX ?? 8192);
const SLM_NUM_PREDICT = Number(process.env.SLM_NUM_PREDICT ?? 2048);

// Rows per request. Small enough that the JSON always closes.
const ROW_BATCH_SIZE = Number(process.env.SLM_ROW_BATCH ?? 14);
// The second look at rows that came back empty: smaller groups, and capped so
// a page that is mostly empty rows cannot double the wall time.
const RETRY_BATCH_SIZE = Number(process.env.SLM_RETRY_BATCH ?? 6);
const RETRY_ROW_LIMIT = Number(process.env.SLM_RETRY_LIMIT ?? 24);

/* ------------------------- prompts -------------------------------------- */

// Used for the normalized-row path: the model never sees a raw table, never
// sees a date it has to attach to something, and never emits a date.
//
// The model is made to echo EVERY row id back, with an empty list where a row
// holds nothing. Asked for a flat list of finds instead, a 3B model answers
// {"items":[]} for the whole batch; walking the rows one by one is what makes
// it actually look at each of them.
const ROWS_SYSTEM_PROMPT = `You are given rows from a student's course schedule or assignment list. Each row is:

  <id> | <date> | <the text that appears on that date>

For EVERY row id you are given, list the graded work named in that row's text.

Reply with ONLY JSON:
{"rows":[{"row":1,"text":"Homework 1","work":["Homework 1"]},{"row":2,"text":"Lecture 4 - Ethics","work":[]},{"row":3,"text":"Project Charter Due by 11:58pm | Design Document","work":["Project Charter","Design Document"]}]}

Graded work is anything a student hands in, submits, sets up, presents or sits.
Homework, assignments, team assignments, quizzes, exams, midterms, final exams,
tests, papers, essays, labs, presentations, peer evaluations, reports,
reflections, forms, and every project deliverable: project name, project
charter, project backlog, design document, sprint planning document, sprint
retrospective, code repository setup, final project presentations.
When a row names one of those, LIST IT. "Final Exam", "Quiz #3", "Team
Assignments" and "Final Project Presentations" are all graded work.

The one thing to leave out is an assigned reading — the title of a book, paper
or article. A reading reads like a title and never mentions homework, a quiz, an
exam, a project or a deadline.

RULES:
- Output one entry for EVERY row id you were given, starting at the FIRST one,
  in order. Use "work":[] only when the row really names nothing to hand in.
- Never invent a row id and NEVER output a date or a time.
- Each name is the title of the work only, copied from the row, without a
  trailing "Due", "Due by 11:58pm", "Deadline", "Times TBD", "Submitted" or
  "No Submission".
- Clock times and room numbers inside a row are not separate work; ignore them,
  but they never stop the rest of the row from being work.
- One row may hold SEVERAL separate deliverables, split by "|". List each.
- A row marked "Submitted" or "No Submission" is still real work: list it.
- "text": copy that row's text back exactly as given, before deciding.`;

/**
 * Ollama compiles this into a grammar, which does two jobs. It stops the 3B
 * model emitting unbalanced JSON (one malformed reply used to lose a whole
 * batch), and pinning the array to exactly `count` entries stops it quietly
 * skipping rows partway down — which is how "Sprint 2 Retrospective" went
 * missing while everything after it shifted up a day.
 */
function rowsSchema(count) {
  return {
    type: "object",
    properties: {
      rows: {
        type: "array",
        minItems: count,
        maxItems: count,
        items: {
          type: "object",
          properties: {
            row: { type: "integer" },
            text: { type: "string" },
            work: { type: "array", items: { type: "string" } },
          },
          required: ["row", "text", "work"],
        },
      },
    },
    required: ["rows"],
  };
}

// Fallback for free-form chat ("my essay is due next Friday"), where there is
// no table to rebuild.
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
- If a row shows BOTH a released/available date and a due date, "due" must be the DUE one — that is the later of the two. Ignore any "Late Due Date".
- A status of "Submitted" or "No Submission" is NOT a reason to skip a row. Include it. Only "Available" / "Opens" rows are openings and should be dropped.
- "status": copy a status label if one is shown ("Due", "Available", "Availability Ends", "Submitted"). Otherwise "".

A course calendar usually lists the same piece of work twice: once on the day it is handed out, and again on the day it is due (that row says "Due"). Output it ONCE, using the row marked "Due".

NEVER merge two pieces of work into one entry. If a sentence or a row mentions
several deliverables — joined by "and", "+", a comma, or a line break — output a
SEPARATE object for each, and give each one its OWN due wording. A name must
never contain the word "and" joining two titles.

Example. For the message:
  "for CS 180 my essay is due next Friday and the lab report is due 10/12 at 5pm"
reply with TWO objects:
{"assignments":[{"course":"CS 180","name":"Essay","due":"next Friday","status":""},{"course":"CS 180","name":"Lab Report","due":"10/12 at 5pm","status":""}]}

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

/* --------------------- deterministic layout rebuild --------------------- */

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTH_INDEX = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

// "09/16", "9/16/26", "Sep 09", "September 9, 2026" — each optionally followed
// by a clock time ("Sep 09 at 11:59PM").
const DATE_TOKEN_RE = new RegExp(
  "(?:" +
    "\\b(\\d{1,2})\\/(\\d{1,2})(?:\\/(\\d{2,4}))?\\b" +
    "|" +
    "\\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?\\s+" +
    "(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s*(\\d{4}))?\\b" +
  ")" +
  "(?:\\s*(?:at|@|,)?\\s*(\\d{1,2}(?::\\d{2})?\\s*[ap]\\.?m\\.?))?",
  "gi",
);

/** Every date token in a line, with its position and any attached time. */
function findDateTokens(line) {
  const out = [];
  DATE_TOKEN_RE.lastIndex = 0;
  let m;
  while ((m = DATE_TOKEN_RE.exec(line))) {
    let month, day, year;
    if (m[1] !== undefined) {
      month = Number(m[1]);
      day = Number(m[2]);
      year = m[3] ? Number(m[3].length === 2 ? `20${m[3]}` : m[3]) : null;
    } else {
      month = MONTH_INDEX[m[4].toLowerCase()];
      day = Number(m[5]);
      year = m[6] ? Number(m[6]) : null;
    }
    if (!month || month > 12 || !day || day > 31) continue;
    out.push({
      index: m.index,
      length: m[0].length,
      month,
      day,
      year,
      time: m[7] ? m[7].replace(/\s+/g, "").toLowerCase() : null,
    });
  }
  return out;
}

// Section headings and column headers. They reset the "current date" so that a
// stray line never gets attached to the previous week's last day. Tested
// against a letters-and-digits-only form of the line, because OCR sprays
// glyphs through them ("$+ Name   $ Status   Released   Due (EDT) »").
const SECTION_BREAK_RE =
  /^(week\s*\d+|(final\s*)?exams?\s*week|finals?\s*week|midterms?\s*week|reading\s*week|date\s+class\b|date\s+assignment\b|name\s+status\b|module\s*\d+|unit\s*\d+)\b/i;

const headingForm = (line) =>
  line.replace(/[^\p{L}\p{N}\s]+/gu, " ").replace(/\s+/g, " ").trim();

// Page furniture that would otherwise trail onto the last date row. "Late Due
// Date: ..." gets its own line in OCR output and is never the deadline.
const JUNK_LINE_RE =
  /^(©|\(c\)\s*\d{4}|copyright\b|all rights reserved|written in\b|course id\b|late\s+due\b)/i;

// The live countdown a submission portal prints above each row ("3 days, 51
// minutes left"). It reads like content and carries no date.
const COUNTDOWN_RE = /^\d+\s+(day|hour|minute|second)s?\b.*\bleft\b\.?$/i;

// OCR of a submission portal picks up the widgets as text: status bullets
// (@, ·, ®) and the progress bar drawn between the name and the dates
// ("——————————————", "-———_————").
const BULLET_RE = /[@·•●▪▸®»«§¶]/g;
const PROGRESS_BAR_RE = /[-–—_=]{2,}/g;
const LEADING_NOISE_RE = /^[\s$+*#>|~^\\/\-–—_·•@®»]+/;

// Print-column noise in Purdue-style calendars ("Color, B&W" sits in front of
// the real cell content).
const NOISE_PREFIX_RE = /^(?:color,?\s*b&w|color|b&w)\b[\s,]*/i;

function cleanLine(raw) {
  let line = raw.replace(/\t/g, "  ").replace(/ /g, " ").trim();
  line = line.replace(PROGRESS_BAR_RE, " ").replace(BULLET_RE, " ");
  line = line.replace(LEADING_NOISE_RE, "").trim();

  let prev;
  do {
    prev = line;
    line = line.replace(NOISE_PREFIX_RE, "").trim();
  } while (line !== prev);
  return line;
}

/**
 * Split a table line into its columns (two or more spaces = a column break).
 * A cell with no run of three letters or digits in it is scanner debris — a
 * leftover dash, or the "Co" that OCR made of a truncated widget — never a
 * title, so it is dropped here rather than offered to the model.
 */
function segments(line) {
  return line
    .split(/\s{2,}|\s*\|\s*/)
    .map((s) => s.trim().replace(/^[-•*]\s*/, ""))
    .filter((s) => /[\p{L}\p{N}]{3,}/u.test(s));
}

/** A line that is nothing but dates: the second half of an OCR-split row. */
function isDateOnly(line, tokens) {
  let rest = line;
  for (let i = tokens.length - 1; i >= 0; i--) {
    rest = rest.slice(0, tokens[i].index) + " " + rest.slice(tokens[i].index + tokens[i].length);
  }
  return !/[\p{L}\p{N}]/u.test(rest);
}

/**
 * Rebuild the table. A line that STARTS with a date opens a new row; anything
 * after it on that line, plus the following undated lines, belongs to that row.
 * A line whose date is not at the start (a Gradescope-style "Name / Status /
 * Released / Due" row) is a self-contained row whose date is the DUE one — the
 * last date on the line once "Late Due Date: ..." has been cut off.
 */
function buildRows(text) {
  const lines = [];
  for (const rawLine of String(text).split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (JUNK_LINE_RE.test(trimmed) || COUNTDOWN_RE.test(trimmed)) continue;
    const line = cleanLine(rawLine);
    if (!line || JUNK_LINE_RE.test(line) || COUNTDOWN_RE.test(line)) continue;
    lines.push(line);
  }

  const rows = [];
  let current = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (SECTION_BREAK_RE.test(headingForm(line))) {
      current = null;
      continue;
    }

    const tokens = findDateTokens(line);

    if (tokens.length === 0) {
      // OCR splits ONE table row over TWO lines, because the progress bar
      // renders between the title and the dates:
      //
      //   Homework #1   @ No Submission   ——————————
      //   Sep 02 at 8:00AM   Sep 09 at 11:50PM
      //
      // So a line with a title and no date, followed by a line with dates and
      // no title, is one row. Requiring TWO dates on that second line (a
      // Released and a Due) is what keeps this away from a normal calendar,
      // where "Homework 1 Due" is followed by the next, empty day.
      const next = lines[i + 1];
      const nextTokens = next ? findDateTokens(next) : [];
      if (
        nextTokens.length &&
        isDateOnly(next, nextTokens) &&
        (nextTokens.length > 1 || current === null) &&
        /[\p{L}]/u.test(line)
      ) {
        const due = nextTokens[nextTokens.length - 1];
        current = {
          month: due.month,
          day: due.day,
          year: due.year,
          rowTime: due.time,
          label: `${pad(due.month)}/${pad(due.day)}`,
          fromDueColumn: true,
          parts: segments(line),
        };
        rows.push(current);
        i += 1; // the date line belongs to this row and nothing else
        continue;
      }

      if (current) current.parts.push(...segments(line));
      continue;
    }

    const first = tokens[0];
    if (first.index === 0) {
      // Calendar row: "09/16   Lecture 10 - UML".
      current = {
        month: first.month,
        day: first.day,
        year: first.year,
        rowTime: first.time,
        label: line.slice(0, first.length).trim(),
        parts: segments(line.slice(first.length)),
      };
      rows.push(current);
      continue;
    }

    // Assignment-table row: the date columns sit after the title. Only a real
    // table qualifies — a sentence ("the essay is due 10/12, the lab next
    // Friday") must not be chopped into one row with one date.
    if (!/\s{2,}/.test(line)) {
      if (current) current.parts.push(...segments(line));
      continue;
    }

    const trimmed = line.replace(/\blate\s+due(\s+date)?\b\s*:?.*$/i, "").trim();
    const inRow = findDateTokens(trimmed);
    if (inRow.length === 0) {
      if (current) current.parts.push(...segments(trimmed || line));
      continue;
    }
    const due = inRow[inRow.length - 1]; // Released comes first, Due comes last.

    // Strip every date token so the model cannot pick the released date.
    let body = trimmed;
    for (let k = inRow.length - 1; k >= 0; k--) {
      body = body.slice(0, inRow[k].index) + "  " + body.slice(inRow[k].index + inRow[k].length);
    }

    current = {
      month: due.month,
      day: due.day,
      year: due.year,
      rowTime: due.time,
      label: `${pad(due.month)}/${pad(due.day)}`,
      // The date came out of a Due column, so the whole row is owed work even
      // though the words "due by" never appear in it.
      fromDueColumn: true,
      parts: segments(body),
    };
    rows.push(current);
  }

  // Drop the cells the name filters would reject anyway (lecture titles,
  // breaks, "Begin Work on X", "Sprint 2 Continues"...) BEFORE the model sees
  // them. It is the same verdict, only cheaper: the cs307 dump shrinks from 52
  // noisy rows to 24 clean ones, which is what stopped the model losing its
  // place partway down a batch.
  for (const row of rows) {
    row.parts = row.parts.filter((part) => !isRejectedName(cleanName(part)));
  }

  return rows.filter((r) => r.parts.length > 0);
}

/**
 * Fill in the year. A pasted calendar is in document order, so the year only
 * changes where the month wraps backwards (December -> January). If the whole
 * schedule then lands well in the past, it was for the next intake.
 */
function assignYears(rows, reference) {
  let year = reference.getFullYear();
  let prevMonth = null;

  for (const row of rows) {
    if (row.year) {
      year = row.year;
    } else {
      if (prevMonth !== null && row.month < prevMonth - 6) year += 1;
      row.year = year;
    }
    prevMonth = row.month;
  }

  const last = rows[rows.length - 1];
  if (!last) return;
  const cutoff = new Date(reference.getTime() - 90 * 864e5);
  if (new Date(last.year, last.month - 1, last.day) < cutoff) {
    for (const row of rows) row.year += 1;
  }
}

/** Course code from the page ("CS 307", "CS 30700"). Model never guesses it. */
function detectCourse(text) {
  const m = String(text).match(/\b([A-Z]{2,4})\s?[- ]?\s?(\d{3,5})\b/);
  return m ? `${m[1]} ${m[2]}` : null;
}

const normWords = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

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
 * Scaffolding the model still emits now and then: lecture rows, holidays, and
 * the "work towards X" milestones that sit next to the real deadline.
 */
const EXCLUDE_NAME_RE = new RegExp(
  [
    "^lecture\\b",
    "^no\\s+(lecture|class|submission|end\\b)",
    "^(begin|continue|start)\\s+work\\b",
    "^last\\s+day\\b",
    "^exam\\s+review$",
    "^consultation\\s+meeting",
    "^final\\s+team\\s+assignments\\s+made",
    "\\bcoordinators?\\b",
    "\\bbreak$",
    "^(labor|memorial|independence|veterans|presidents)\\s+day$",
    "^(color,?\\s*b&w|b&w|color)$",
    "^end\\s+of\\s+semester\\b",
  ].join("|"),
  "i",
);

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

/** Strip the trailing status wording the model is asked (but often fails) to drop. */
function cleanName(name) {
  return String(name ?? "")
    .replace(/\s*[-–—:|]\s*$/, "")
    .replace(/\s*\bdue\s+(by|on|at)\b.*$/i, "")
    .replace(/\s*\b(due|deadline|submitted|no submission|times tbd|tbd)\b\s*$/i, "")
    .replace(/\s*\bdue\s+date\b\s*$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Words that make something a piece of work rather than a title on a page.
 * Course calendars print the week's reading in the same column as the week's
 * homework ("Homework 4" next to "Big Ball of Mud"), and the model cannot tell
 * a book from an assignment — but a book title never carries one of these.
 */
const WORK_KEYWORD_RE =
  /\b(homework|hw|assignment|assignments|quiz|quizzes|exam|exams|midterm|final|finals|test|project|lab|labs|paper|essay|report|presentation|presentations|evaluation|eval|retrospective|planning|document|charter|backlog|setup|milestone|deliverable|sprint|reflection|journal|form|survey|worksheet|problem\s*set|pset|proposal|thesis|capstone|portfolio|draft|submission|checkpoint|demo|poster|discussion|response)\b/i;

/** The cell says, in so many words, that this is owed. */
const DUE_MARKER_RE = /\b(due|deadline|submit|submitted|submission|turn\s*in|hand\s*in)\b/i;

/**
 * Titles that are graded work by definition, whether or not the page prints a
 * deadline beside them — a calendar rarely writes "due" next to the final exam.
 * Kept to short titles so a reading called "Testing in Practice" cannot slip in.
 */
const ASSESSMENT_RE = /\b(exams?|examinations?|midterms?|quiz|quizzes|presentations?)\b/i;
const isAssessment = (name) => ASSESSMENT_RE.test(name) && normWords(name).length <= 5;

/**
 * Keep a title only if it names work OR the page says it is owed. Either signal
 * alone is enough — an oddly named deliverable still says "Due", and "Final
 * Exam" is obviously work even with no due wording next to it — but a bare book
 * title has neither.
 */
function looksLikeWork(name, cellText, fromDueColumn) {
  return (
    WORK_KEYWORD_RE.test(name) ||
    fromDueColumn === true ||
    DUE_MARKER_RE.test(String(cellText ?? ""))
  );
}

function isRejectedName(name) {
  return (
    !name ||
    NON_ASSIGNMENT_RE.test(name) ||
    PROGRESS_MARKER_RE.test(name) ||
    EXCLUDE_NAME_RE.test(name)
  );
}

function buildAssignment({ course, name, dueDate, dueTime, link }) {
  const finalCourse = String(course ?? "").trim() || "General";
  return {
    course: finalCourse.slice(0, 120),
    name: name.slice(0, 300),
    dueDate,
    dueTime,
    link: link ? String(link).trim().slice(0, 500) : null,
    color: colorForCourse(finalCourse),
    source: "ai_text",
  };
}

function toAssignment(item) {
  if (!item || typeof item !== "object") return null;

  const status = String(item.status ?? "").trim();
  if (OPENING_STATUS_RE.test(status)) return null;

  const name = cleanName(item.name);
  if (isRejectedName(name)) return null;

  const due = resolveDue(item.due ?? item.dueDate);
  if (!due) return null; // No usable date means it would land on the wrong day.

  return buildAssignment({
    course: item.course,
    name,
    dueDate: due.dueDate,
    dueTime: due.dueTime,
    link: item.link,
  });
}

/**
 * Course calendars list a piece of work on the day it is handed out and again
 * on the day it is due. The model catches that inconsistently, so collapse it
 * here: within one import, the same course and title means one deadline.
 *
 * The row that actually says "Due" wins (that is the deadline, however early or
 * late it sits). When no row says "Due" the entry is simply repeated — "Final
 * Project Presentations" sits on four consecutive days — and the first one is
 * the date the student needs.
 */
function collapseAssignedAndDue(items) {
  const byKey = new Map();

  for (const item of items) {
    const key = `${item.course.toLowerCase()}|${item.name.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
    const seen = byKey.get(key);
    if (!seen) {
      byKey.set(key, item);
      continue;
    }

    const seenDue = seen.markedDue === true;
    const itemDue = item.markedDue === true;
    let winner;
    if (seenDue !== itemDue) winner = itemDue ? item : seen;
    else if (itemDue) winner = item.dueDate > seen.dueDate ? item : seen; // both due-marked
    else winner = item.dueDate < seen.dueDate ? item : seen; // neither: first occurrence

    byKey.set(key, winner);
  }

  return [...byKey.values()]
    .map(({ markedDue, sourceRow, ...rest }) => rest)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

/* ------------------------------ SLM calls ------------------------------- */

async function chat(messages, format = "json") {
  const res = await fetch(`${SLM_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(SLM_TIMEOUT_MS),
    body: JSON.stringify({
      model: SLM_MODEL,
      stream: false,
      format,
      keep_alive: SLM_KEEP_ALIVE,
      options: {
        temperature: 0,
        num_ctx: SLM_NUM_CTX,
        num_predict: SLM_NUM_PREDICT,
      },
      messages,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`SLM request failed (${res.status}): ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data?.message?.content?.trim() || "{}";
  try {
    return JSON.parse(content);
  } catch {
    // Belt and braces: older Ollama builds ignore the schema and the model can
    // still trail off mid-array. Salvage whatever rows did come out intact.
    return salvageRows(content);
  }
}

const ROW_SALVAGE_RE = /"row"\s*:\s*(\d+)\s*,\s*"work"\s*:\s*\[([^\]]*)\]/g;
const STRING_RE = /"((?:[^"\\]|\\.)*)"/g;

function salvageRows(content) {
  const rows = [];
  let m;
  ROW_SALVAGE_RE.lastIndex = 0;
  while ((m = ROW_SALVAGE_RE.exec(content))) {
    const work = [];
    STRING_RE.lastIndex = 0;
    let s;
    while ((s = STRING_RE.exec(m[2]))) work.push(s[1]);
    rows.push({ row: Number(m[1]), work });
  }
  return rows.length ? { rows } : null;
}

/* -------------------------------- parse --------------------------------- */

/** Flatten whatever shape the model replied with into {row, name} pairs. */
function flattenRowReply(parsed) {
  const pairs = [];
  const list = Array.isArray(parsed)
    ? parsed
    : parsed.rows ?? parsed.items ?? parsed.assignments ?? [];
  if (!Array.isArray(list)) return pairs;

  for (const entry of list) {
    if (!entry || typeof entry !== "object") continue;
    const row = Number(entry.row);
    const work = entry.work ?? entry.items ?? entry.names ?? entry.name;
    for (const w of Array.isArray(work) ? work : [work]) {
      if (w == null) continue;
      const name = typeof w === "string" ? w : w?.name;
      if (name) pairs.push({ row, name: String(name) });
    }
  }
  return pairs;
}

const CLOCK_RE = /\b(\d{1,2}(?::\d{2})?\s*[ap]\.?m\.?)/i;
// A cell that is nothing but a time or a time range: "8:00pm - 9:30pm".
const TIME_ONLY_RE =
  /^\d{1,2}(:\d{2})?\s*[ap]\.?m\.?(\s*(-|–|—|to)\s*\d{1,2}(:\d{2})?\s*[ap]\.?m\.?)?$/i;

const isSuperset = (words, of) => of.length > 0 && of.every((w) => words.has(w));

/**
 * The time is read out of the cell the title came from, never from the model.
 * "Sprint 1 Retrospective Due by 11:58pm | First Peer Evaluation Due" has one
 * time and two deliverables, and only the first of them is owed at 11:58pm.
 * A cell holding nothing but a time belongs to the cell before it, which is how
 * "Final Exam" picks up the "8:00pm - 9:30pm" printed underneath it.
 */
function timeForSegment(row, index) {
  const own = row.parts[index].match(CLOCK_RE);
  if (own) return own[1];
  const next = row.parts[index + 1];
  if (next && TIME_ONLY_RE.test(next)) return next.match(CLOCK_RE)[1];
  return row.rowTime;
}

/** One batch of normalized rows -> assignments, with dates taken from the rows. */
async function parseRowBatch(batch, course, reference) {
  const listing = batch
    .map((row, i) => `${i + 1} | ${row.label} | ${row.parts.join(" | ")}`)
    .join("\n");

  const parsed = await chat(
    [
      { role: "system", content: ROWS_SYSTEM_PROMPT },
      { role: "user", content: `ROWS:\n${listing}` },
    ],
    rowsSchema(batch.length),
  );
  if (!parsed) return [];

  // Which cell of which row each title actually came from. A title the model
  // made up matches nothing and is dropped; a title it filed under the wrong id
  // is re-filed, as long as exactly one row in the batch can be its source.
  const cells = batch.map((row) => row.parts.map((p) => new Set(normWords(cleanName(p)))));

  const out = [];
  for (const { row: claimed, name: rawName } of flattenRowReply(parsed)) {
    const name = cleanName(rawName);
    if (isRejectedName(name)) continue;

    const words = normWords(name);
    if (!words.length) continue;

    const hits = [];
    for (let r = 0; r < batch.length; r++) {
      const c = cells[r].findIndex((cell) => isSuperset(cell, words));
      if (c !== -1) hits.push([r, c]);
    }
    if (!hits.length) continue; // not written anywhere in this batch

    const claimedHit = hits.find(([r]) => r === claimed - 1);
    // Trust the model's id when it holds up; otherwise only when unambiguous.
    const [rowIndex, cellIndex] = claimedHit ?? (hits.length === 1 ? hits[0] : []);
    if (rowIndex === undefined) continue;

    const row = batch[rowIndex];
    const cellText = row.parts[cellIndex];
    if (!looksLikeWork(name, cellText, row.fromDueColumn)) continue;

    const time = timeForSegment(row, cellIndex);
    const phrase = `${MONTH_NAMES[row.month - 1]} ${row.day}, ${row.year}${time ? ` at ${time}` : ""}`;
    const due = resolveDue(phrase, reference, false);
    if (!due) continue;

    const assignment = buildAssignment({
      course,
      name,
      dueDate: due.dueDate,
      dueTime: due.dueTime,
      link: null,
    });
    // Both remembered for later steps, then dropped.
    assignment.markedDue = row.fromDueColumn === true || DUE_MARKER_RE.test(cellText);
    assignment.sourceRow = row;
    out.push(assignment);
  }
  return out;
}

/**
 * The cells no model judgement is needed for: the page names a piece of work
 * AND says it is owed — either in words ("Team Assignments Due by 5:00pm") or
 * by structure, having come out of a Released/Due table. A book title never
 * does both, so this cannot let a reading through, and it stops a real deadline
 * being lost to the 3B model's habit of overlooking whichever row happens to
 * sit in the middle of a batch.
 */
function certainAssignments(rows, course, reference) {
  const out = [];

  for (const row of rows) {
    row.parts.forEach((cell, index) => {
      const name = cleanName(cell);
      if (isRejectedName(name)) return;
      if (!WORK_KEYWORD_RE.test(name)) return;

      const owed = row.fromDueColumn === true || DUE_MARKER_RE.test(cell);
      if (!owed && !isAssessment(name)) return;

      const time = timeForSegment(row, index);
      const phrase = `${MONTH_NAMES[row.month - 1]} ${row.day}, ${row.year}${time ? ` at ${time}` : ""}`;
      const due = resolveDue(phrase, reference, false);
      if (!due) return;

      const assignment = buildAssignment({
        course,
        name,
        dueDate: due.dueDate,
        dueTime: due.dueTime,
        link: null,
      });
      // Only a real due marker counts here. "Final Project Presentations" runs
      // on four consecutive days with no deadline wording, and the collapse
      // step must be free to keep the first of them rather than the last.
      assignment.markedDue = owed;
      assignment.sourceRow = row;
      out.push(assignment);
    });
  }

  return out;
}

/** Fallback for free-form text with no table to rebuild. */
async function parseWholeText(text) {
  const today = new Date().toDateString();
  const parsed = await chat([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `CURRENT DATE: ${today}\n\nTEXT:\n${text}` },
  ]);
  if (!parsed) return [];

  const raw = Array.isArray(parsed) ? parsed : parsed.assignments;
  if (!Array.isArray(raw)) return [];

  return collapseAssignedAndDue(raw.map(toAssignment).filter(Boolean));
}

export async function parseAssignmentsFromText(text) {
  const reference = new Date();
  const rows = buildRows(text);

  // Three dated rows is what makes something a schedule rather than a sentence.
  // Anything smaller is a chat message ("my essay is due next Friday"), which
  // has no layout to rebuild and does need the model to read relative dates.
  // A Released/Due table is the exception: its shape is unmistakable even when
  // a screenshot only caught one assignment.
  const tabular = rows.length >= 3 || rows.some((row) => row.fromDueColumn);

  if (tabular) {
    assignYears(rows, reference);
    const course = detectCourse(text) || "General";

    const found = [];
    const answered = new Set();

    const sweep = async (list, size) => {
      for (let i = 0; i < list.length; i += size) {
        const batch = list.slice(i, i + size);
        try {
          for (const item of await parseRowBatch(batch, course, reference)) {
            found.push(item);
            answered.add(item.sourceRow);
          }
        } catch (err) {
          // One bad batch should not lose the other fifteen weeks.
          if (err?.name === "TimeoutError" || err?.name === "AbortError") continue;
          throw err;
        }
      }
    };

    for (const item of certainAssignments(rows, course, reference)) {
      found.push(item);
      answered.add(item.sourceRow);
    }

    await sweep(rows, ROW_BATCH_SIZE);

    // Whether the model spots a deadline turns out to depend on which rows sit
    // around it: "Team Assignments Due by 5:00pm" is found at the top of a
    // batch and missed in the middle of one. So the rows that came back with
    // nothing get one more look, in different company and smaller groups. Rows
    // that really are empty (a reading, a room number) stay empty, so this
    // second pass is short — four rows out of the cs307 dump's twenty-four.
    const missed = rows.filter((row) => !answered.has(row));
    if (missed.length && missed.length <= RETRY_ROW_LIMIT) {
      await sweep(missed, RETRY_BATCH_SIZE);
    }

    if (found.length) return collapseAssignedAndDue(found);
  }

  return parseWholeText(text);
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
 * Ask Ollama to load the model and hold it in memory.
 *
 * Without this the first chat message after a deploy (or after an idle period)
 * pays a cold start that can outlast the proxy in front of this service, which
 * surfaces to the user as a 500 that mysteriously fixes itself on the retry.
 * Called once at boot; failure is not fatal, it just means the first real
 * request pays the cost instead.
 */
export async function warmUp() {
  try {
    const res = await fetch(`${SLM_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: SLM_MODEL,
        prompt: "",
        keep_alive: SLM_KEEP_ALIVE,
        options: { num_ctx: SLM_NUM_CTX },
      }),
      signal: AbortSignal.timeout(300_000),
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
