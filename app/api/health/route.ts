// Liveness endpoint for Railway's healthcheck. Always 200 when the process is up.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ok: true });
}
