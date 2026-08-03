import { ensureDatabase, runtimeEnv } from "../../../../../lib/server/db";
import { generatePostcard } from "../../../../../lib/server/postcard";
import { findSession, jsonError, jsonOk, roleFor, serializeSession, tokenFrom } from "../../../../../lib/server/session";
import type { Artist, Senses } from "../../../../../lib/types";

export const dynamic = "force-dynamic";

function decodeImage(dataUrl: string): { bytes: Uint8Array; type: string } | null {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([a-z0-9+/=]+)$/i.exec(dataUrl);
  if (!match) return null;
  const binary = atob(match[2]);
  if (binary.length > 1_600_000) return null;
  return { bytes: Uint8Array.from(binary, (char) => char.charCodeAt(0)), type: match[1].toLowerCase() };
}

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await context.params;
    const row = await findSession(code);
    if (!row || row.expires_at <= Date.now()) return jsonError("This bridge has faded.", 404);
    if (roleFor(row, tokenFrom(request)) !== "host") return jsonError("Only the person at the festival can make this postcard.", 403);
    if (!["waiting", "connected", "draft_ready"].includes(row.status)) {
      return jsonError("This moment has already crossed the bridge.", 409);
    }
    const body = (await request.json()) as {
      artist?: Artist;
      stageName?: string;
      observation?: string;
      senses?: Senses;
      photoDataUrl?: string | null;
    };
    if (!body.artist?.name || typeof body.artist.id !== "string" || !body.stageName || !body.senses) return jsonError("Choose the set and add a few details from the field.");
    const observation = body.observation?.replace(/\s+/g, " ").trim().slice(0, 600) ?? "";
    if (!observation && !body.senses.tags?.length) return jsonError("Add one thing you notice, or choose an atmosphere signal.");
    const senses: Senses = {
      energy: Math.max(0, Math.min(100, Math.round(Number(body.senses.energy) || 0))),
      soundLevel: body.senses.soundLevel == null ? null : Math.max(0, Math.min(100, Math.round(Number(body.senses.soundLevel) || 0))),
      tags: Array.isArray(body.senses.tags) ? body.senses.tags.map(String).slice(0, 6) : [],
      light: String(body.senses.light || "soft dusk").slice(0, 60),
      air: String(body.senses.air || "cool").slice(0, 60),
    };

    let photoKey: string | null = row.photo_key;
    let photoType: string | null = row.photo_type;
    if (body.photoDataUrl) {
      const image = decodeImage(body.photoDataUrl);
      if (!image) return jsonError("Use a JPEG, PNG, or WebP image under 1.6 MB.");
      const media = runtimeEnv().MEDIA;
      if (media) {
        photoKey = `sessions/${row.id}/presence`;
        photoType = image.type;
        await media.put(photoKey, image.bytes, {
          httpMetadata: { contentType: image.type, cacheControl: "private, max-age=300" },
          customMetadata: { expiresAt: String(row.expires_at) },
        });
      }
    }

    const generated = await generatePostcard({
      sessionCode: row.code,
      artist: body.artist,
      stageName: body.stageName.slice(0, 60),
      observation,
      senses,
      photoDataUrl: body.photoDataUrl,
    });
    const db = await ensureDatabase();
    await db
      .prepare(
        "UPDATE sessions SET status = 'draft_ready', artist_id = ?, artist_name = ?, artist_url = ?, stage_name = ?, observation = ?, senses_json = ?, photo_key = ?, photo_type = ?, postcard_json = ?, ai_mode = ?, updated_at = ? WHERE code = ?",
      )
      .bind(
        body.artist.id.slice(0, 160),
        String(body.artist.name).slice(0, 120),
        typeof body.artist.url === "string" && /^https:\/\//i.test(body.artist.url) ? body.artist.url.slice(0, 500) : null,
        body.stageName.slice(0, 60),
        observation,
        JSON.stringify(senses),
        photoKey,
        photoType,
        JSON.stringify(generated.postcard),
        generated.mode,
        Date.now(),
        row.code,
      )
      .run();
    const updated = await findSession(row.code);
    if (!updated) return jsonError("The postcard could not be held.", 503);
    return jsonOk({ session: serializeSession(updated, "host", request.url) });
  } catch (error) {
    console.error("presence failed", error);
    return jsonError("The postcard could not be made. Your bridge is still open—try again.", 500);
  }
}
