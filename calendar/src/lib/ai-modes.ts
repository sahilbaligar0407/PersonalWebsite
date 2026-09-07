/**
 * Classify user input into AI modes to minimize API usage.
 * Mode 1: Platform questions - no API
 * Mode 2: Assignment parsing - requires API
 * Mode 3: Unsupported - no API
 */
export type AIMode = "platform" | "assignment" | "unsupported";

const PLATFORM_KEYWORDS = [
  "hi", "hello", "hey", "what", "how", "does", "work", "this", "website",
  "help", "explain", "tell me", "can you", "what is", "how do i",
  "calendar", "smartcal", "features", "about",
];

const ASSIGNMENT_PATTERNS = [
  /\b(due|deadline|homework|hw|lab|quiz|exam|assignment|essay|project)\b/i,
  /\b(cs\d+|math\d+|eng\d+|phys\d+|stat\d+|com\d+)\s/i,
  /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
  /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i,
  /\b\d{1,2}\/\d{1,2}\b/, // date like 4/12
  /\b(add|paste|here is|here's)\s/i,
];

const UNSUPPORTED_PATTERNS = [
  /\b(write|code|program|python|javascript|java)\b/i,
  /\b(create|build)\s+(a\s+)?(script|app|website)\b/i,
  /\b(summarize|translate|translate to)\b/i,
];

export function classifyInput(text: string): AIMode {
  const trimmed = text.trim().toLowerCase();
  if (trimmed.length < 2) return "platform";

  for (const p of UNSUPPORTED_PATTERNS) {
    if (p.test(text)) return "unsupported";
  }

  const isPlatform = PLATFORM_KEYWORDS.some((k) => trimmed.includes(k)) &&
    (trimmed.length < 50 || trimmed.includes("how") || trimmed.includes("what"));

  if (isPlatform && !ASSIGNMENT_PATTERNS.some((p) => p.test(text))) {
    return "platform";
  }

  if (ASSIGNMENT_PATTERNS.some((p) => p.test(text))) {
    return "assignment";
  }

  if (trimmed.length > 100) return "assignment";
  return "platform";
}
