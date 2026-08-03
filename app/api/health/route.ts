import { ensureDatabase, runtimeEnv } from "../../../lib/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDatabase();
    const runtime = runtimeEnv();
    return Response.json(
      {
        ok: true,
        service: "same-sky",
        database: true,
        media: Boolean(runtime.MEDIA),
        openai: Boolean(runtime.OPENAI_API_KEY),
        jambase: Boolean(runtime.JAMBASE_API_KEY),
        now: Date.now(),
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return Response.json({ ok: false, service: "same-sky" }, { status: 503 });
  }
}
