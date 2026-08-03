import { ensureDatabase } from "../../../../../lib/server/db";
import { findSession, jsonError, jsonOk, roleFor, serializeSession, tokenFrom } from "../../../../../lib/server/session";

export const dynamic = "force-dynamic";

const ALLOWED_COLORS = ["#ff7a61", "#8c7bff", "#55d6be", "#ffd166"];

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await context.params;
    const row = await findSession(code);
    if (!row || row.expires_at <= Date.now()) return jsonError("This bridge has faded.", 404);
    if (roleFor(row, tokenFrom(request)) !== "guest") return jsonError("The pulse begins from the person watching away.", 403);
    if (!row.postcard_json || !["postcard_ready", "pulse_ready", "completed"].includes(row.status)) {
      return jsonError("The postcard has not arrived yet.", 409);
    }
    if (row.pulse_at) return jsonOk({ session: serializeSession(row, "guest", request.url), replay: true });
    const body = (await request.json().catch(() => ({}))) as { color?: string };
    const color = ALLOWED_COLORS.includes(String(body.color).toLowerCase()) ? String(body.color).toLowerCase() : ALLOWED_COLORS[0];
    const pulseAt = Date.now() + 1800;
    const pulseEndsAt = pulseAt + 8000;
    const db = await ensureDatabase();
    const result = await db
      .prepare("UPDATE sessions SET status = 'pulse_ready', pulse_color = ?, pulse_at = ?, pulse_ends_at = ?, updated_at = ? WHERE code = ? AND status = 'postcard_ready' AND pulse_at IS NULL")
      .bind(color, pulseAt, pulseEndsAt, Date.now(), row.code)
      .run();
    if (!result.meta.changes) {
      const existing = await findSession(row.code);
      if (!existing) return jsonError("The pulse could not cross the bridge.", 503);
      return jsonOk({ session: serializeSession(existing, "guest", request.url), replay: true });
    }
    const updated = await findSession(row.code);
    if (!updated) return jsonError("The pulse could not cross the bridge.", 503);
    return jsonOk({ session: serializeSession(updated, "guest", request.url), serverNow: Date.now() });
  } catch (error) {
    console.error("pulse failed", error);
    return jsonError("The pulse did not leave your screen. Hold once more.", 500);
  }
}
