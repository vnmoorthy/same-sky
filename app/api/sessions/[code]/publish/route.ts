import { ensureDatabase } from "../../../../../lib/server/db";
import { findSession, jsonError, jsonOk, roleFor, serializeSession, tokenFrom } from "../../../../../lib/server/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const row = await findSession(code);
  if (!row || row.expires_at <= Date.now()) return jsonError("This bridge has faded.", 404);
  if (roleFor(row, tokenFrom(request)) !== "host") return jsonError("Only the sender can release this postcard.", 403);
  if (!row.postcard_json) return jsonError("Make the postcard before sending it.", 409);
  if (row.status !== "draft_ready") {
    return jsonOk({ session: serializeSession(row, "host", request.url), replay: true });
  }
  const db = await ensureDatabase();
  await db.prepare("UPDATE sessions SET status = 'postcard_ready', updated_at = ? WHERE code = ? AND status = 'draft_ready'").bind(Date.now(), row.code).run();
  const updated = await findSession(row.code);
  if (!updated) return jsonError("The postcard could not cross the bridge.", 503);
  return jsonOk({ session: serializeSession(updated, "host", request.url) });
}
