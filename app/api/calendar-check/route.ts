// Diagnostic: proves (at RUNTIME) that this service can reach the calendar
// backend over Railway's private network, and that CALENDAR_ORIGIN is set.
// Hit https://www.sahilbaligar.com/api/calendar-check after deploy.
// Safe to delete once /Calendar is confirmed working.
export const dynamic = "force-dynamic";

async function probe(url: string) {
  const started = Date.now();
  try {
    const res = await fetch(url, { cache: "no-store" });
    const body = await res.text();
    return { url, ok: res.ok, status: res.status, ms: Date.now() - started, body: body.slice(0, 200) };
  } catch (err) {
    return { url, ok: false, error: (err as Error)?.message ?? String(err), ms: Date.now() - started };
  }
}

export async function GET() {
  const origin = process.env.CALENDAR_ORIGIN;
  if (!origin) {
    return Response.json(
      { calendarOriginSet: false, note: "CALENDAR_ORIGIN is not set at runtime on this service." },
      { status: 500 },
    );
  }
  const base = origin.replace(/\/$/, "");
  // Root health (raw connectivity) + the /Calendar-mounted health (full path).
  const [root, mounted] = await Promise.all([
    probe(`${base}/api/health`),
    probe(`${base}/Calendar/api/health`),
  ]);
  return Response.json({ calendarOriginSet: true, origin: base, checks: { root, mounted } });
}
