// Self-hosted SLM client. Talks to an Ollama service over Railway's private
// network. Extracts academic assignments from free text into structured JSON.
//
// Env:
//   SLM_BASE_URL  e.g. http://slm.railway.internal:11434  (default localhost)
//   SLM_MODEL     e.g. qwen2.5:3b-instruct                (default below)

const SLM_BASE_URL = process.env.SLM_BASE_URL || "http://localhost:11434";
const SLM_MODEL = process.env.SLM_MODEL || "qwen2.5:3b-instruct";

const SYSTEM_PROMPT = `You extract academic assignments from a student's pasted text (course schedules, Brightspace dumps, emails, OCR'd screenshots).

Return ONLY a JSON object of the form:
{"assignments":[{"course":"CS251","name":"Homework 5","dueDate":"2025-04-12","dueTime":"11:59 PM","link":null}]}

Rules:
- "course": the course code/name the item belongs to (e.g. "CS251", "MATH266"). If unknown, use "General".
- "name": the assignment/task title.
- "dueDate": ISO date "YYYY-MM-DD". Resolve relative dates ("Friday", "next week", "tomorrow") against the provided CURRENT DATE. If a due date can't be determined, omit that item.
- "dueTime": human string like "11:59 PM" or null.
- "link": a URL if present, else null.
- If there are no assignments, return {"assignments":[]}.
- Output valid JSON only. No prose, no markdown.`;

function normalize(items) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((p) => p && typeof p === "object" && p.dueDate)
    .map((p) => ({
      course: String(p.course || "General").slice(0, 120),
      name: String(p.name || "Assignment").slice(0, 300),
      dueDate: String(p.dueDate).slice(0, 10),
      dueTime: p.dueTime ? String(p.dueTime).slice(0, 40) : null,
      link: p.link ? String(p.link).slice(0, 500) : null,
      color: "blue",
      source: "ai_text",
    }))
    // Guard against a model that hallucinates a bad date format.
    .filter((p) => /^\d{4}-\d{2}-\d{2}$/.test(p.dueDate));
}

export async function parseAssignmentsFromText(text) {
  const today = new Date().toISOString().slice(0, 10);
  const userContent = `CURRENT DATE: ${today}\n\nTEXT:\n${text}`;

  const res = await fetch(`${SLM_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: SLM_MODEL,
      stream: false,
      format: "json",
      options: { temperature: 0.1 },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`SLM request failed (${res.status}): ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data?.message?.content?.trim() || "{}";

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    return [];
  }

  // Accept either {"assignments":[...]} or a bare [...] array.
  const items = Array.isArray(parsed) ? parsed : parsed.assignments;
  return normalize(items);
}

// Liveness probe for the SLM service (used by /api/health for observability).
export async function slmHealthy() {
  try {
    const res = await fetch(`${SLM_BASE_URL}/api/tags`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}
