import type { AssignmentInsert } from "@/types/assignment";
import { api } from "@/lib/api";

/**
 * Parse assignment text with the small language model.
 *
 * The request goes to the SmartCal server, which calls the self-hosted SLM
 * service over Railway's private network. Nothing is sent to a third-party API
 * and no API key is involved.
 *
 * Screenshots take the same path: they are OCR'd in the browser (see lib/ocr.ts)
 * and the recovered text is sent here, so there is no separate vision model.
 */
export async function parseAssignmentsFromText(
  text: string
): Promise<AssignmentInsert[]> {
  const { items } = await api.parseWithModel(text);
  return items as AssignmentInsert[];
}

export async function getModelStatus() {
  return api.aiStatus();
}
