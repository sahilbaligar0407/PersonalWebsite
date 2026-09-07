/**
 * Client for the SmartCal API.
 *
 * Two things differ from a plain same-origin fetch client, both because of how
 * this is deployed:
 *
 *  - The app is served under a base path (`/Calendar` in production, `/` in
 *    dev), so every request is prefixed with Vite's BASE_URL rather than a
 *    hardcoded `/api`.
 *  - The session is an httpOnly cookie set by the server, not a token this
 *    code can read. That means `credentials: "include"` on every call and no
 *    Authorization header — the browser attaches the cookie itself.
 */

const BASE = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
const API_ROOT = `${BASE}/api`;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");

  let res: Response;
  try {
    res = await fetch(`${API_ROOT}${path}`, {
      ...init,
      headers,
      credentials: "include",
    });
  } catch {
    throw new ApiError("Can't reach the SmartCal server. Check your connection.", 0);
  }

  if (res.status === 204) return undefined as T;

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    const message =
      (isJson && (payload as { error?: string })?.error) ||
      `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return payload as T;
}

export type Plan = "free" | "pro";

export interface ApiUser {
  id: string;
  email: string;
  plan: Plan;
}

export interface ApiAssignment {
  id: string;
  course: string;
  name: string;
  dueDate: string;
  dueTime: string | null;
  link: string | null;
  color: string;
  source: "manual" | "ics" | "ai_text" | "ai_image";
}

export type AssignmentPayload = Omit<ApiAssignment, "id">;

/** The server has no plan column; everyone is on the free tier. */
type ServerUser = { id: string; email: string } | null;

function withPlan(user: ServerUser): ApiUser | null {
  return user ? { ...user, plan: "free" } : null;
}

export interface AiUsage {
  count: number;
  remaining: number;
  limit: number;
}

export const api = {
  signUp: async (email: string, password: string) => {
    const { user } = await request<{ user: ServerUser }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    return { user: withPlan(user) as ApiUser };
  },

  signIn: async (email: string, password: string) => {
    const { user } = await request<{ user: ServerUser }>("/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    return { user: withPlan(user) as ApiUser };
  },

  signOut: () => request<{ ok: boolean }>("/auth/signout", { method: "POST" }),

  me: async () => {
    const { user } = await request<{ user: ServerUser }>("/auth/me");
    return { user: withPlan(user) };
  },

  listAssignments: () =>
    request<{ calendarId: string; assignments: ApiAssignment[] }>("/assignments"),

  addAssignments: async (items: Partial<AssignmentPayload>[]) => {
    const r = await request<{
      added: number;
      duplicates: number;
      assignments: ApiAssignment[];
    }>("/assignments/bulk", { method: "POST", body: JSON.stringify({ items }) });
    return { added: r.added, duplicates: r.duplicates, items: r.assignments };
  },

  updateAssignment: (id: string, patch: Partial<AssignmentPayload>) =>
    request<{ ok: boolean }>(`/assignments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  deleteAssignment: (id: string) =>
    request<{ ok: boolean }>(`/assignments/${id}`, { method: "DELETE" }),

  deleteAssignments: async (ids: string[]) => {
    await request<{ ok: boolean }>("/assignments/delete-bulk", {
      method: "POST",
      body: JSON.stringify({ ids }),
    });
    return { ok: true, deleted: ids.length };
  },

  getCalendar: () =>
    request<{ calendar: { id: string; feedUrl: string | null } }>("/calendar"),

  saveFeedUrl: (feedUrl: string | null) =>
    request<{ ok: boolean; feedUrl: string | null }>("/calendar/feed", {
      method: "PUT",
      body: JSON.stringify({ feedUrl }),
    }),

  /** Relays the .ics through the server; the source host sends no CORS headers. */
  fetchIcs: (url: string) => request<string>(`/ics?url=${encodeURIComponent(url)}`),

  parseWithModel: async (text: string) => {
    const r = await request<{ assignments: AssignmentPayload[]; usage: AiUsage }>(
      "/ai/parse",
      { method: "POST", body: JSON.stringify({ text }) }
    );
    return { items: r.assignments, usage: r.usage };
  },

  aiUsage: () => request<AiUsage>("/ai/usage"),

  aiStatus: () =>
    request<{
      online: boolean;
      model: string;
      /** Undefined when the model list could not be read; the UI treats only
          an explicit false as "the model is missing". */
      modelAvailable?: boolean;
      /** No vision model is deployed — screenshots are OCR'd in the browser. */
      visionAvailable?: boolean;
    }>("/ai/status"),
};
