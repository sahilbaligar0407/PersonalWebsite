import type { AssignmentInsert } from "@/types/assignment";
import { api } from "@/lib/api";

/**
 * Parse assignment text via the backend, which calls the self-hosted SLM.
 * The server enforces + increments the monthly AI quota.
 */
export async function parseAssignmentsFromText(text: string): Promise<AssignmentInsert[]> {
  const data = await api.post("/ai/parse", { text });
  return (data?.assignments ?? []) as AssignmentInsert[];
}

/**
 * Parse assignments from a screenshot. The image is OCR'd server-side (in
 * memory, never stored) and the extracted text is sent to the SLM.
 */
export async function parseAssignmentsFromImage(file: File): Promise<AssignmentInsert[]> {
  const form = new FormData();
  form.append("image", file);
  const data = await api.postForm("/ai/parse-image", form);
  return (data?.assignments ?? []) as AssignmentInsert[];
}
