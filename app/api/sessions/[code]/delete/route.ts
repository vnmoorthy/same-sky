import { ensureDatabase, runtimeEnv } from "../../../../../lib/server/db";
import { findSession, jsonError, jsonOk, roleFor, tokenFrom } from "../../../../../lib/server/session";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const row = await findSession(code);
  if (!row) return jsonOk({ deleted: true });
  if (!roleFor(row, tokenFrom(request))) return jsonError("Only the two people on this bridge can let it fade.", 401);
  if (row.photo_key && runtimeEnv().MEDIA) await runtimeEnv().MEDIA!.delete(row.photo_key);
  const db = await ensureDatabase();
  await db.prepare("DELETE FROM sessions WHERE code = ?").bind(row.code).run();
  return jsonOk({ deleted: true });
}
