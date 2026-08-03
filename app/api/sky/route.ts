import { ensureDatabase } from "../../../lib/server/db";
import type { SkyPulse } from "../../../lib/types";

export const dynamic = "force-dynamic";

function coordinate(seed: string, axis: "x" | "y"): number {
  let hash = axis === "x" ? 2166136261 : 2246822519;
  for (const char of seed) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return 7 + ((hash >>> 0) % 8600) / 100;
}

export async function GET() {
  try {
    const db = await ensureDatabase();
    const since = Date.now() - 24 * 60 * 60 * 1000;
    const rows = await db
      .prepare("SELECT id, code, artist_name, pulse_color, pulse_at FROM sessions WHERE pulse_at IS NOT NULL AND pulse_at > ? ORDER BY pulse_at DESC LIMIT 120")
      .bind(since)
      .all<{ id: string; code: string; artist_name: string | null; pulse_color: string | null; pulse_at: number }>();
    const pulses: SkyPulse[] = rows.results.map((row) => ({
      id: row.id,
      artistName: row.artist_name ?? "A festival set",
      color: row.pulse_color ?? "#ff7a61",
      pulseAt: row.pulse_at,
      x: coordinate(row.code, "x"),
      y: coordinate(row.code, "y"),
    }));
    return Response.json({ ok: true, pulses, count: pulses.length, now: Date.now() }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ ok: true, pulses: [], count: 0, now: Date.now() }, { headers: { "cache-control": "no-store" } });
  }
}
