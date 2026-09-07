import ICAL from "ical.js";
import type { AssignmentInsert } from "@/types/assignment";
import { api } from "@/lib/api";
import { colorForCourse } from "@/lib/course-colors";

/** Brightspace appends a status to every SUMMARY: "GIT Homework - Due". */
export type EventKind = "due" | "ends" | "available" | "event";

export interface ParsedEvent {
  course: string;
  name: string;
  dueDate: string;
  dueTime: string | null;
  link: string | null;
  kind: EventKind;
}

export interface ParseResult {
  /** Deadlines worth putting on an assignment calendar. */
  deadlines: ParsedEvent[];
  /** "- Available" openings and non-assignment calendar entries. */
  skipped: ParsedEvent[];
}

const pad = (n: number) => String(n).padStart(2, "0");

const toISODate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function to12Hour(d: Date): string {
  let h = d.getHours();
  const m = pad(d.getMinutes());
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${period}`;
}

/**
 * Strip the trailing Brightspace status. The old parser split SUMMARY on " - "
 * and used the LEFT half as the course, which turned "GIT Homework - Due" into
 * course "GIT Homework" / name "Due".
 */
const STATUS_RE =
  /\s*[-–]\s*(Due|Available|Availability\s+Ends?|Starts?|Ends?)\s*$/i;

function splitStatus(summary: string): { name: string; kind: EventKind } {
  const match = summary.match(STATUS_RE);
  if (!match) return { name: summary.trim(), kind: "event" };

  const name = summary.slice(0, match.index).trim() || summary.trim();
  const status = match[1].toLowerCase();

  if (status.startsWith("due")) return { name, kind: "due" };
  if (status.startsWith("availability end") || status === "ends" || status === "end")
    return { name, kind: "ends" };
  return { name, kind: "available" };
}

/**
 * Course code lives in LOCATION, e.g. "Fall 2026 CS 25200-LE1 LEC".
 * Rooms and system-wide entries ("Purdue University System") have no code.
 */
const COURSE_RE = /\b([A-Z]{2,5})\s*(\d{3,5})\b/;

function courseFromLocation(location: string | null): string {
  if (!location) return "General";
  const withoutTerm = location.replace(
    /^(Spring|Summer|Fall|Winter)\s+\d{4}\s*/i,
    ""
  );
  const match = withoutTerm.match(COURSE_RE);
  return match ? `${match[1]} ${match[2]}` : "General";
}

/**
 * Course-structure entries, not work to hand in: "Week 4", "Midterm Week",
 * "Week begins". Matched against the whole name so "Week 4 Reflection" stays.
 */
const NON_ASSIGNMENT_RE =
  /^(week\s*\d+|(midterm|finals?|exam|reading|spring break|fall break)\s*week|week\s*(begins|starts|ends)|module\s*\d+|unit\s*\d+|online meeting|getting started)\.?$/i;

export function isNonAssignment(name: string): boolean {
  return NON_ASSIGNMENT_RE.test(name.trim());
}

const URL_RE = /https?:\/\/[^\s\\<>"')]+/g;

/**
 * Brightspace has no URL property; links are embedded in DESCRIPTION as
 * "Quizzes:\nGIT Homework - https://..." plus a trailing "View event - https://...".
 * Prefer the activity link over the generic calendar entry.
 */
function linkFromEvent(comp: ICAL.Component, description: string | null): string | null {
  const urlProp = comp.getFirstPropertyValue("url");
  if (typeof urlProp === "string" && urlProp.startsWith("http")) return urlProp;

  if (!description) return null;
  const urls = description.match(URL_RE);
  if (!urls?.length) return null;

  const activity = urls.find((u) => !u.includes("/calendar/"));
  return activity ?? urls[0];
}

export function parseICSText(icsText: string): ParseResult {
  const comp = new ICAL.Component(ICAL.parse(icsText));
  const deadlines: ParsedEvent[] = [];
  const skipped: ParsedEvent[] = [];

  for (const eventComp of comp.getAllSubcomponents("vevent")) {
    const event = new ICAL.Event(eventComp);
    const summary = (event.summary ?? "").trim();
    if (!summary || !event.startDate) continue;

    const start = event.startDate;
    const date = start.toJSDate();
    if (Number.isNaN(date.getTime())) continue;

    const { name, kind } = splitStatus(summary);
    const location = eventComp.getFirstPropertyValue("location");
    const description = eventComp.getFirstPropertyValue("description");

    const parsed: ParsedEvent = {
      course: courseFromLocation(typeof location === "string" ? location : null),
      name,
      dueDate: toISODate(date),
      // All-day entries (VALUE=DATE) have no real time; the old parser stamped
      // every one of them "12:00 AM".
      dueTime: start.isDate ? null : to12Hour(date),
      link: linkFromEvent(
        eventComp,
        typeof description === "string" ? description : null
      ),
      kind,
    };

    // "Due" and "Availability Ends" are deadlines. "Available" is an opening
    // date, and unsuffixed entries are lectures/club events, not assignments.
    // "Week 4" and friends carry a date but nothing to hand in.
    if ((kind === "due" || kind === "ends") && !isNonAssignment(name)) {
      deadlines.push(parsed);
    } else {
      skipped.push(parsed);
    }
  }

  const byDate = (a: ParsedEvent, b: ParsedEvent) => a.dueDate.localeCompare(b.dueDate);
  return { deadlines: dedupe(deadlines).sort(byDate), skipped: skipped.sort(byDate) };
}

/**
 * Brightspace emits the same deadline twice — once "- Due" and once
 * "- Availability Ends". Keep one, preferring the explicit "Due" entry.
 */
function dedupe(events: ParsedEvent[]): ParsedEvent[] {
  const byKey = new Map<string, ParsedEvent>();

  for (const event of events) {
    const key = `${event.course}|${event.name}|${event.dueDate}`;
    const existing = byKey.get(key);
    if (!existing || (existing.kind !== "due" && event.kind === "due")) {
      byKey.set(key, event);
    }
  }

  return [...byKey.values()];
}

/** Fetches through the local server, which relays past the feed's missing CORS headers. */
export async function fetchAndParseICS(url: string): Promise<ParseResult> {
  const icsText = await api.fetchIcs(url);
  return parseICSText(icsText);
}

export function toAssignments(
  parsed: ParsedEvent[],
  source: AssignmentInsert["source"] = "ics"
): AssignmentInsert[] {
  return parsed.map((p) => ({
    course: p.course,
    name: p.name,
    dueDate: p.dueDate,
    dueTime: p.dueTime,
    link: p.link,
    color: colorForCourse(p.course),
    source,
  }));
}
