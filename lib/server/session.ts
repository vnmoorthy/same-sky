import type { Artist, Postcard, Role, SameSkySession, Senses, SessionStatus } from "../types";
import { ensureDatabase } from "./db";

export type SessionRow = {
  id: string;
  code: string;
  host_token: string;
  guest_token: string | null;
  status: SessionStatus;
  artist_id: string | null;
  artist_name: string | null;
  artist_url: string | null;
  stage_name: string | null;
  observation: string | null;
  senses_json: string | null;
  photo_key: string | null;
  photo_type: string | null;
  postcard_json: string | null;
  ai_mode: "openai" | "festival-safe" | null;
  pulse_color: string | null;
  pulse_at: number | null;
  pulse_ends_at: number | null;
  demo: number;
  created_at: number;
  updated_at: number;
  expires_at: number;
};

const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function makeCode(length = 6): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join("");
}

export function makeToken(): string {
  return `${crypto.randomUUID()}.${crypto.randomUUID().replaceAll("-", "")}`;
}

export function tokenFrom(request: Request): string {
  const auth = request.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return new URL(request.url).searchParams.get("token")?.trim() ?? "";
}

export async function findSession(code: string): Promise<SessionRow | null> {
  const db = await ensureDatabase();
  return db
    .prepare("SELECT * FROM sessions WHERE code = ? LIMIT 1")
    .bind(code.toUpperCase())
    .first<SessionRow>();
}

export function roleFor(row: SessionRow, token: string): Role | null {
  if (token && token === row.host_token) return "host";
  if (token && token === row.guest_token) return "guest";
  return null;
}

function safeParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function serializeSession(row: SessionRow, role: Role, requestUrl: string): SameSkySession {
  const now = Date.now();
  const effectiveStatus: SessionStatus =
    row.status === "pulse_ready" && row.pulse_ends_at && row.pulse_ends_at <= now ? "completed" : row.status;
  const artist: Artist | null = row.artist_name
    ? {
        id: row.artist_id ?? row.artist_name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        name: row.artist_name,
        genre: "Live at Outside Lands",
        day: row.stage_name ?? "Festival weekend",
        url: row.artist_url ?? undefined,
        source: row.artist_url ? "jambase" : "festival-preview",
      }
    : null;
  const origin = new URL(requestUrl).origin;

  return {
    code: row.code,
    role,
    status: effectiveStatus,
    paired: Boolean(row.guest_token),
    artist,
    stageName: row.stage_name,
    observation: row.observation,
    senses: safeParse<Senses>(row.senses_json),
    postcard: safeParse<Postcard>(row.postcard_json),
    aiMode: row.ai_mode,
    photoUrl: row.photo_key ? `${origin}/api/sessions/${row.code}/photo` : null,
    pulseColor: row.pulse_color,
    pulseAt: row.pulse_at,
    pulseEndsAt: row.pulse_ends_at,
    demo: Boolean(row.demo),
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>): Response {
  return Response.json({ ok: false, error: message, ...extra }, { status, headers: { "cache-control": "no-store" } });
}

export function jsonOk(body: Record<string, unknown>, init?: ResponseInit): Response {
  return Response.json({ ok: true, ...body }, { ...init, headers: { "cache-control": "no-store", ...(init?.headers ?? {}) } });
}
