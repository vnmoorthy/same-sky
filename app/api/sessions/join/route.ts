import { ensureDatabase } from "../../../../lib/server/db";
import { findSession, jsonError, jsonOk, makeToken, serializeSession } from "../../../../lib/server/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { code?: string };
    const code = body.code?.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 6) ?? "";
    if (code.length !== 6) return jsonError("Enter the six-character bridge code.");
    const row = await findSession(code);
    if (!row || row.expires_at <= Date.now()) return jsonError("That bridge has faded. Check the code or open a new one.", 404);
    if (row.guest_token) return jsonError("Someone is already across this bridge.", 409);

    const guestToken = makeToken();
    const db = await ensureDatabase();
    const result = await db
      .prepare("UPDATE sessions SET guest_token = ?, status = CASE WHEN status = 'waiting' THEN 'connected' ELSE status END, updated_at = ? WHERE code = ? AND guest_token IS NULL")
      .bind(guestToken, Date.now(), code)
      .run();
    if (!result.meta.changes) return jsonError("Someone joined a moment before you. Ask for a new bridge.", 409);
    const updated = await findSession(code);
    if (!updated) return jsonError("The bridge could not be joined.", 503);
    return jsonOk({ token: guestToken, session: serializeSession(updated, "guest", request.url) });
  } catch (error) {
    console.error("join session failed", error);
    return jsonError("The bridge could not be joined just yet.", 500);
  }
}
