// Thin fetch wrapper for the SmartCal backend.
// Base-path aware: BASE_URL is "/Calendar/" in production and "/" in dev, so the
// same code targets "/Calendar/api/..." live and "/api/..." locally.
const BASE = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
const API_ROOT = `${BASE}/api`;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function handle(res: Response) {
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => ({})) : {};
  if (!res.ok) {
    throw new ApiError(body?.error || `Request failed (${res.status})`, res.status);
  }
  return body;
}

export const api = {
  get: (path: string) => fetch(`${API_ROOT}${path}`, { credentials: "include" }).then(handle),

  post: (path: string, data?: unknown) =>
    fetch(`${API_ROOT}${path}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data ?? {}),
    }).then(handle),

  patch: (path: string, data?: unknown) =>
    fetch(`${API_ROOT}${path}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data ?? {}),
    }).then(handle),

  del: (path: string) =>
    fetch(`${API_ROOT}${path}`, { method: "DELETE", credentials: "include" }).then(handle),

  // multipart upload (e.g. screenshot for OCR) — no JSON content-type header.
  postForm: (path: string, form: FormData) =>
    fetch(`${API_ROOT}${path}`, { method: "POST", credentials: "include", body: form }).then(handle),
};
