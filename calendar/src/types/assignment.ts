export type AssignmentSource = "manual" | "ics" | "ai_text" | "ai_image";

export interface Assignment {
  id: string;
  course: string;
  name: string;
  dueDate: string; // ISO date string (YYYY-MM-DD)
  dueTime: string | null;
  link: string | null;
  color: string;
  source: AssignmentSource;
}

export type AssignmentInsert = Omit<Assignment, "id"> & { id?: string };
