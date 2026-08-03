import { env } from "cloudflare:workers";

export type RuntimeEnv = {
  DB?: D1Database;
  MEDIA?: R2Bucket;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  JAMBASE_API_KEY?: string;
};

export function runtimeEnv(): RuntimeEnv {
  return env as unknown as RuntimeEnv;
}

let schemaReady: Promise<void> | null = null;

export async function ensureDatabase(): Promise<D1Database> {
  const db = runtimeEnv().DB;
  if (!db) throw new Error("The session database is not available.");

  schemaReady ??= db
    .batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY NOT NULL,
        code TEXT NOT NULL UNIQUE,
        host_token TEXT NOT NULL,
        guest_token TEXT,
        status TEXT NOT NULL DEFAULT 'waiting',
        artist_id TEXT,
        artist_name TEXT,
        artist_url TEXT,
        stage_name TEXT,
        observation TEXT,
        senses_json TEXT,
        photo_key TEXT,
        photo_type TEXT,
        postcard_json TEXT,
        ai_mode TEXT,
        pulse_color TEXT,
        pulse_at INTEGER,
        pulse_ends_at INTEGER,
        demo INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
      )`),
      db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_code ON sessions(code)"),
      db.prepare("CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)"),
      db.prepare("CREATE INDEX IF NOT EXISTS idx_sessions_pulse_at ON sessions(pulse_at)"),
    ])
    .then(() => undefined)
    .catch((error) => {
      schemaReady = null;
      throw error;
    });

  await schemaReady;
  return db;
}

export async function purgeExpiredSessions(): Promise<void> {
  const db = await ensureDatabase();
  const now = Date.now();
  const expired = await db
    .prepare("SELECT id, photo_key FROM sessions WHERE expires_at < ? LIMIT 40")
    .bind(now)
    .all<{ id: string; photo_key: string | null }>();

  const media = runtimeEnv().MEDIA;
  if (media) {
    await Promise.all(expired.results.flatMap((row) => (row.photo_key ? [media.delete(row.photo_key)] : [])));
  }
  if (expired.results.length) {
    await db.batch(expired.results.map((row) => db.prepare("DELETE FROM sessions WHERE id = ?").bind(row.id)));
  }
}
