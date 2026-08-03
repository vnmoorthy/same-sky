import { findSession, jsonError, jsonOk, roleFor, serializeSession, tokenFrom } from "../../../../lib/server/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const row = await findSession(code);
  if (!row || row.expires_at <= Date.now()) return jsonError("This bridge has faded.", 404);
  const role = roleFor(row, tokenFrom(request));
  if (!role) return jsonError("This bridge is private.", 401);
  return jsonOk({ session: serializeSession(row, role, request.url), serverNow: Date.now() });
}
