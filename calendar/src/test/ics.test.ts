import { describe, it, expect } from "vitest";
import { parseICSText, toAssignments } from "@/lib/ics";

/**
 * Regression tests for the Brightspace import.
 *
 * The previous version of this parser split SUMMARY on " - " to find the course
 * code, which turned "GIT Homework - Due" into course "GIT Homework" with the
 * name "Due", and kept every VEVENT — including the "- Available" opening rows
 * Brightspace emits alongside each real deadline, and week headings that carry a
 * date but nothing to hand in. The fixture below is shaped like a real feed.
 */
const FEED = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//D2L//Brightspace//EN
BEGIN:VEVENT
UID:1@brightspace
SUMMARY:GIT Homework - Due
LOCATION:Fall 2026 CS 25200-LE1 LEC
DTSTART:20260911T235900Z
DTEND:20260911T235900Z
DESCRIPTION:Submit here https://purdue.brightspace.com/d2l/le/12345/assignment/7
END:VEVENT
BEGIN:VEVENT
UID:2@brightspace
SUMMARY:GIT Homework - Available
LOCATION:Fall 2026 CS 25200-LE1 LEC
DTSTART:20260904T050000Z
DTEND:20260904T050000Z
END:VEVENT
BEGIN:VEVENT
UID:3@brightspace
SUMMARY:Week 4
LOCATION:Fall 2026 CS 25200-LE1 LEC
DTSTART;VALUE=DATE:20260921
END:VEVENT
BEGIN:VEVENT
UID:4@brightspace
SUMMARY:Project Charter - Availability Ends
LOCATION:Fall 2026 CS 30700-LE2 LEC
DTSTART:20260918T235800Z
DTEND:20260918T235800Z
END:VEVENT
END:VCALENDAR`;

describe("parseICSText", () => {
  const { deadlines, skipped } = parseICSText(FEED);

  it("reads the course code from LOCATION, not by splitting SUMMARY", () => {
    const hw = deadlines.find((d) => d.name === "GIT Homework");
    expect(hw).toBeDefined();
    expect(hw!.course).toBe("CS 25200");
  });

  it("strips the trailing status word from the title", () => {
    expect(deadlines.map((d) => d.name)).not.toContain("Due");
    expect(deadlines.map((d) => d.name)).toContain("Project Charter");
  });

  it("drops '- Available' openings so a deadline is not listed twice", () => {
    const git = deadlines.filter((d) => d.name === "GIT Homework");
    expect(git).toHaveLength(1);
  });

  it("drops week headings, which carry a date but nothing to hand in", () => {
    expect(deadlines.some((d) => /^week\s*\d+$/i.test(d.name))).toBe(false);
    expect(skipped.length).toBeGreaterThan(0);
  });

  it("keeps 'Availability Ends' rows, which are real deadlines", () => {
    const charter = deadlines.find((d) => d.name === "Project Charter");
    expect(charter).toBeDefined();
    expect(charter!.course).toBe("CS 30700");
  });

  it("recovers the submission link from DESCRIPTION", () => {
    const hw = deadlines.find((d) => d.name === "GIT Homework");
    expect(hw!.link).toContain("/assignment/7");
  });
});

describe("toAssignments", () => {
  it("assigns a stable per-course colour rather than everything blue", () => {
    const { deadlines } = parseICSText(FEED);
    const rows = toAssignments(deadlines, "ics");
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.source).toBe("ics");
      expect(row.color).toBeTruthy();
    }
    // Same course in, same colour out.
    const cs252 = rows.filter((r) => r.course === "CS 25200").map((r) => r.color);
    expect(new Set(cs252).size).toBeLessThanOrEqual(1);
  });
});
