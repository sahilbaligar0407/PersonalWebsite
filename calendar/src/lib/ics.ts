import ICAL from "ical.js";
import type { AssignmentInsert } from "@/types/assignment";
import { format } from "date-fns";

export interface ParsedEvent {
  course: string;
  name: string;
  dueDate: string;
  dueTime: string | null;
  link: string | null;
}

export async function fetchAndParseICS(url: string): Promise<ParsedEvent[]> {
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) throw new Error("Failed to fetch calendar");
  const icsText = await res.text();
  return parseICSText(icsText);
}

export function parseICSText(icsText: string): ParsedEvent[] {
  const jcal = ICAL.parse(icsText);
  const comp = new ICAL.Component(jcal);
  const events = comp.getAllSubcomponents("vevent");
  const results: ParsedEvent[] = [];

  for (const eventComp of events) {
    const event = new ICAL.Event(eventComp);
    const summary = event.summary || "";
    const dtstart = event.startDate;
    const dt = dtstart.toJSDate();
    const dueDate = format(dt, "yyyy-MM-dd");
    const dueTime = format(dt, "h:mm a");

    let course = "";
    let name = summary;

    if (summary.includes(" - ") || summary.includes(" – ")) {
      const sep = summary.includes(" - ") ? " - " : " – ";
      const parts = summary.split(sep);
      course = parts[0]?.trim() ?? "";
      name = parts.slice(1).join(sep).trim() || summary;
    }

    const urlProp = eventComp.getFirstProperty("url");
    const link = urlProp ? urlProp.getFirstValue() : null;

    results.push({
      course: course || "General",
      name,
      dueDate,
      dueTime,
      link,
    });
  }

  return results;
}

export function toAssignments(parsed: ParsedEvent[], source: AssignmentInsert["source"] = "ics"): AssignmentInsert[] {
  return parsed.map((p) => ({
    course: p.course,
    name: p.name,
    dueDate: p.dueDate,
    dueTime: p.dueTime,
    link: p.link,
    color: "blue",
    source,
  }));
}
