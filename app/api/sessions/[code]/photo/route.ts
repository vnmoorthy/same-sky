import { runtimeEnv } from "../../../../../lib/server/db";
import { findSession, jsonError, roleFor, tokenFrom } from "../../../../../lib/server/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const row = await findSession(code);
  if (!row || row.expires_at <= Date.now()) return jsonError("This bridge has faded.", 404);
  if (!roleFor(row, tokenFrom(request))) return jsonError("This image belongs to a private bridge.", 401);
  if (!row.photo_key) return jsonError("No image was shared for this postcard.", 404);
  const media = runtimeEnv().MEDIA;
  if (!media) return jsonError("The image store is unavailable.", 503);
  const object = await media.get(row.photo_key);
  if (!object) return jsonError("That image has already faded.", 404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("cache-control", "private, no-store");
  headers.set("x-content-type-options", "nosniff");
  return new Response(object.body, { headers });
}
