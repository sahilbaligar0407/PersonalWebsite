import { parseISO, startOfDay } from "date-fns";
import type { Assignment } from "@/types/assignment";

export interface CalendarEvent {
  id: string;
  name: string;
  time: string | null;
  assignment: Assignment;
}

export interface CalendarDay {
  day: Date;
  events: CalendarEvent[];
}

/** Parse time string (e.g. "14:30", "2:30 PM") to hour 0-23. Returns null if unparseable. */
export function parseTimeToHour(timeStr: string | null): number | null {
  if (!timeStr || !timeStr.trim()) return null;
  const s = timeStr.trim();
  const ampm = /(\d{1,2}):?(\d{2})?\s*(am|pm)/i.exec(s);
  if (ampm) {
    let h = parseInt(ampm[1], 10);
    const m = ampm[2] ? parseInt(ampm[2], 10) : 0;
    if (/pm/i.test(ampm[3]) && h < 12) h += 12;
    if (/am/i.test(ampm[3]) && h === 12) h = 0;
    return h + m / 60;
  }
  const hm = /(\d{1,2}):(\d{2})/.exec(s);
  if (hm) return parseInt(hm[1], 10) + parseInt(hm[2], 10) / 60;
  return null;
}

export function assignmentsToCalendarData(assignments: Assignment[]): CalendarDay[] {
  const byDay = new Map<string, CalendarEvent[]>();

  for (const a of assignments) {
    const day = startOfDay(parseISO(a.dueDate));
    const key = day.toISOString();
    const event: CalendarEvent = {
      id: a.id,
      name: `${a.course} - ${a.name}`,
      time: a.dueTime,
      assignment: a,
    };
    const list = byDay.get(key) ?? [];
    list.push(event);
    byDay.set(key, list);
  }

  return Array.from(byDay.entries())
    .map(([key, events]) => ({
      day: new Date(key),
      events: events.sort((a, b) => {
        if (!a.time || !b.time) return 0;
        return a.time.localeCompare(b.time);
      }),
    }))
    .sort((a, b) => a.day.getTime() - b.day.getTime());
}
