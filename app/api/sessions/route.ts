import { ensureDatabase, purgeExpiredSessions } from "../../../lib/server/db";
import { findSession, jsonError, jsonOk, makeCode, makeToken, serializeSession } from "../../../lib/server/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { demo?: boolean };
    const db = await ensureDatabase();
    if (Math.random() < 0.08) await purgeExpiredSessions();
    const now = Date.now();
    const hostToken = makeToken();
    const id = crypto.randomUUID();
    let code = makeCode();
    let created = false;

    for (let attempt = 0; attempt < 5 && !created; attempt += 1) {
      try {
        await db
          .prepare(
            "INSERT INTO sessions (id, code, host_token, status, demo, created_at, updated_at, expires_at) VALUES (?, ?, ?, 'waiting', ?, ?, ?, ?)",
          )
          .bind(id, code, hostToken, body.demo ? 1 : 0, now, now, now + 24 * 60 * 60 * 1000)
          .run();
        created = true;
      } catch {
        code = makeCode();
      }
    }
    if (!created) return jsonError("A bridge could not be opened. Please try once more.", 503);
    const row = await findSession(code);
    if (!row) return jsonError("The bridge was created but could not be opened.", 503);
    return jsonOk({ token: hostToken, session: serializeSession(row, "host", request.url) }, { status: 201 });
  } catch (error) {
    console.error("create session failed", error);
    return jsonError("The bridge could not be opened just yet.", 500);
  }
}
