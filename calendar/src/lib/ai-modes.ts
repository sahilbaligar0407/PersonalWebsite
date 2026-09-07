/**
 * Routes chat input to either a canned answer or the local model.
 *
 * This used to also refuse anything mentioning "java", "code", "project" etc.
 * to conserve paid API calls — which rejected real input like
 * "CS252 Java project due Friday". The model is local and free, so anything
 * that isn't clearly a question about the app now goes to the parser.
 */
export type AIMode = "platform" | "assignment";

/** Short questions about SmartCal itself, answered without the model. */
const PLATFORM_PATTERNS = [
  /^(hi|hey|hello|yo|sup)\b/i,
  /\b(how|what|why|who|where)\b.*\b(work|works|use|using|this|smartcal|app|site)\b/i,
  /\b(help|what can you do|who are you)\b/i,
];

const ASSIGNMENT_PATTERNS = [
  /\b(due|deadline|homework|hw|lab|quiz|exam|assignment|essay|project|paper|reading|midterm|final)\b/i,
  /\b[a-z]{2,5}\s?\d{3,5}\b/i,
  /\b(mon|tues|wednes|thurs|fri|satur|sun)day\b/i,
  /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}\b/i,
  /\b\d{1,2}\/\d{1,2}\b/,
  /\b\d{4}-\d{2}-\d{2}\b/,
];

export function classifyInput(text: string): AIMode {
  const trimmed = text.trim();
  if (trimmed.length < 2) return "platform";

  // Anything that looks like a deadline goes to the parser, even if it also
  // reads like a question.
  if (ASSIGNMENT_PATTERNS.some((p) => p.test(trimmed))) return "assignment";
  if (PLATFORM_PATTERNS.some((p) => p.test(trimmed))) return "platform";

  return "assignment";
}
