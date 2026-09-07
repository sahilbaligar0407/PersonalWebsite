/** Course accent names shared by the ICS importer and every calendar surface. */
export const COURSE_COLORS = ["blue", "amber", "green", "purple", "rose"] as const;

export type CourseColor = (typeof COURSE_COLORS)[number];

/** Stable per-course colour, so a course looks the same on every reload. */
export function colorForCourse(course: string): CourseColor {
  let hash = 0;
  for (let i = 0; i < course.length; i++) {
    hash = (hash * 31 + course.charCodeAt(i)) | 0;
  }
  return COURSE_COLORS[Math.abs(hash) % COURSE_COLORS.length];
}

const TEXT: Record<CourseColor, string> = {
  blue: "text-course-blue",
  amber: "text-course-amber",
  green: "text-course-green",
  purple: "text-course-purple",
  rose: "text-course-rose",
};

const BG: Record<CourseColor, string> = {
  blue: "bg-course-blue",
  amber: "bg-course-amber",
  green: "bg-course-green",
  purple: "bg-course-purple",
  rose: "bg-course-rose",
};

const isCourseColor = (v: string): v is CourseColor =>
  (COURSE_COLORS as readonly string[]).includes(v);

/** Tailwind classes for a stored colour name, tolerating legacy values. */
export function courseColorClasses(color: string, course: string) {
  const key = isCourseColor(color) ? color : colorForCourse(course);
  return { text: TEXT[key], bg: BG[key], key };
}
